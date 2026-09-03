require("dotenv").config();

const { Pool } = require("pg");
const { criarPoolJPDesk } = require("./backend/config/jpdesk-db");

const TABELAS_SQL = `
CREATE TABLE IF NOT EXISTS jp_otb_cache_status (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  sincronizando boolean NOT NULL DEFAULT false,
  carga_inicial_concluida boolean NOT NULL DEFAULT false,
  ultima_inicio timestamp without time zone,
  ultima_sucesso timestamp without time zone,
  ultima_carga_completa timestamp without time zone,
  ultima_carga_incremental timestamp without time zone,
  inicio_historico date,
  ultima_mensagem text,
  ultimo_erro text
);

INSERT INTO jp_otb_cache_status (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE jp_otb_cache_status
  ADD COLUMN IF NOT EXISTS ultima_dimensao timestamp without time zone;

ALTER TABLE jp_otb_cache_status
  ADD COLUMN IF NOT EXISTS ultima_estoque timestamp without time zone;

ALTER TABLE jp_otb_cache_status
  ADD COLUMN IF NOT EXISTS ultima_pedidos timestamp without time zone;

ALTER TABLE jp_otb_cache_status
  ADD COLUMN IF NOT EXISTS ultima_promocoes timestamp without time zone;

CREATE TABLE IF NOT EXISTS jp_otb_dim_produto (
  produto varchar(6) PRIMARY KEY,
  descricao text NOT NULL DEFAULT '',
  marca text NOT NULL DEFAULT 'SEM MARCA',
  fornecedor text NOT NULL DEFAULT 'SEM FORNECEDOR',
  departamento text NOT NULL DEFAULT 'SEM DEPARTAMENTO',
  grupo text NOT NULL DEFAULT 'SEM GRUPO',
  subgrupo text NOT NULL DEFAULT 'SEM SUBGRUPO',
  linha text NOT NULL DEFAULT 'SEM LINHA',
  cor text NOT NULL DEFAULT 'SEM COR',
  complemento text NOT NULL DEFAULT 'SEM COMPLEMENTO',
  campanha text NOT NULL DEFAULT 'SEM CAMPANHA',
  preco_venda numeric NOT NULL DEFAULT 0,
  valor_custo numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jp_otb_estoque (
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  estoque numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (empresa, produto)
);

CREATE TABLE IF NOT EXISTS jp_otb_vendas_dia (
  data date NOT NULL,
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  vendas numeric NOT NULL DEFAULT 0,
  valor_vendas numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (data, empresa, produto)
);

CREATE TABLE IF NOT EXISTS jp_otb_compras_dia (
  data date NOT NULL,
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  compras numeric NOT NULL DEFAULT 0,
  valor_compras numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (data, empresa, produto)
);

CREATE TABLE IF NOT EXISTS jp_otb_vendas_mes (
  mes date NOT NULL,
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  vendas numeric NOT NULL DEFAULT 0,
  valor_vendas numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (mes, empresa, produto)
);

CREATE TABLE IF NOT EXISTS jp_otb_compras_mes (
  mes date NOT NULL,
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  compras numeric NOT NULL DEFAULT 0,
  valor_compras numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (mes, empresa, produto)
);

CREATE INDEX IF NOT EXISTS idx_jp_otb_vendas_mes_empresa
  ON jp_otb_vendas_mes (empresa, mes, produto);

CREATE INDEX IF NOT EXISTS idx_jp_otb_vendas_mes_produto
  ON jp_otb_vendas_mes (produto, mes, empresa);

CREATE INDEX IF NOT EXISTS idx_jp_otb_compras_mes_empresa
  ON jp_otb_compras_mes (empresa, mes, produto);

CREATE INDEX IF NOT EXISTS idx_jp_otb_compras_mes_produto
  ON jp_otb_compras_mes (produto, mes, empresa);

CREATE TABLE IF NOT EXISTS jp_otb_pedidos (
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  pedidos numeric NOT NULL DEFAULT 0,
  valor_pedidos numeric NOT NULL DEFAULT 0,
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (empresa, produto)
);

CREATE TABLE IF NOT EXISTS jp_otb_promocoes (
  empresa varchar(2) NOT NULL,
  produto varchar(6) NOT NULL,
  valor_promocao numeric NOT NULL DEFAULT 0,
  promocao_inicio date,
  promocao_nome text NOT NULL DEFAULT '',
  atualizado_em timestamp without time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (empresa, produto)
);

CREATE TABLE IF NOT EXISTS jp_otb_cache_meses (
  tipo varchar(10) NOT NULL,
  ano_mes varchar(7) NOT NULL,
  data_ini date NOT NULL,
  data_fim date NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  ultima_inicio timestamp without time zone,
  ultima_sucesso timestamp without time zone,
  ultima_mensagem text,
  ultimo_erro text,
  PRIMARY KEY (tipo, ano_mes)
);

CREATE INDEX IF NOT EXISTS idx_jp_otb_cache_meses_concluido
  ON jp_otb_cache_meses (tipo, concluido, ano_mes);

CREATE INDEX IF NOT EXISTS idx_jp_otb_vendas_empresa_data
  ON jp_otb_vendas_dia (empresa, data, produto);

CREATE INDEX IF NOT EXISTS idx_jp_otb_vendas_produto_data
  ON jp_otb_vendas_dia (produto, data, empresa);

CREATE INDEX IF NOT EXISTS idx_jp_otb_compras_empresa_data
  ON jp_otb_compras_dia (empresa, data, produto);

CREATE INDEX IF NOT EXISTS idx_jp_otb_compras_produto_data
  ON jp_otb_compras_dia (produto, data, empresa);

CREATE INDEX IF NOT EXISTS idx_jp_otb_estoque_produto
  ON jp_otb_estoque (produto, empresa);

CREATE INDEX IF NOT EXISTS idx_jp_otb_pedidos_produto
  ON jp_otb_pedidos (produto, empresa);

CREATE INDEX IF NOT EXISTS idx_jp_otb_dim_marca
  ON jp_otb_dim_produto (marca);

CREATE INDEX IF NOT EXISTS idx_jp_otb_dim_grupo
  ON jp_otb_dim_produto (grupo);

CREATE INDEX IF NOT EXISTS idx_jp_otb_dim_subgrupo
  ON jp_otb_dim_produto (subgrupo);

CREATE INDEX IF NOT EXISTS idx_jp_otb_dim_departamento
  ON jp_otb_dim_produto (departamento);

CREATE INDEX IF NOT EXISTS idx_jp_otb_dim_fornecedor
  ON jp_otb_dim_produto (fornecedor);

CREATE INDEX IF NOT EXISTS idx_jp_otb_dim_complemento
  ON jp_otb_dim_produto (complemento);
`;

function dataISO(d = new Date()) {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${dia}`;
}

function adicionarDias(data, dias) {
  const d = new Date(`${data}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return dataISO(d);
}

function inicioHistoricoPadrao() {
  const anos = Math.max(3, Number(process.env.OTB_CACHE_HIST_YEARS || 4));
  const hoje = new Date();
  return `${hoje.getFullYear() - anos}-01-01`;
}

function criarOTBEngine({
  sourcePool,
  cachePool,
  logger = console
}) {
  if (!sourcePool || !cachePool) {
    throw new Error("OTB Engine precisa de sourcePool e cachePool.");
  }

  let executando = false;
  let timer = null;
  let ultimaCargaCompletaDia = "";
  let contadorCiclos = 0;

  const intervaloMinutos = Math.max(
    5,
    Number(
      process.env.OTB_CACHE_UPDATE_MINUTES ||
      process.env.CACHE_UPDATE_MINUTES ||
      10
    )
  );

  const diasIncrementais = Math.max(
    2,
    Number(process.env.OTB_CACHE_INCREMENTAL_DAYS || 3)
  );

  const minutosEstoque = Math.max(
    10,
    Number(process.env.OTB_CACHE_ESTOQUE_MINUTES || 30)
  );

  const minutosDimensoes = Math.max(
    60,
    Number(process.env.OTB_CACHE_DIM_MINUTES || 1440)
  );

  const minutosPromocoes = Math.max(
    10,
    Number(process.env.OTB_CACHE_PROMO_MINUTES || 30)
  );

  async function sourceQuery(sql, params = [], timeoutMs = 600000) {
    const maxTentativas = Math.max(
      1,
      Number(process.env.OTB_SOURCE_CONNECT_RETRIES || 3)
    );

    let ultimoErro = null;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      let client = null;

      try {
        client = await sourcePool.connect();

        await client.query(
          `SET statement_timeout TO ${Math.max(30000, timeoutMs)}`
        );

        const resultado = await client.query(sql, params);
        return resultado;

      } catch (e) {
        ultimoErro = e;

        const mensagem = String(e?.message || e || "");
        const codigoErro = String(e?.code || "").toUpperCase();

        const erroConexao =
          /connection terminated|connection timeout|connection closed|socket|ECONNRESET|ECONNREFUSED/i.test(mensagem) ||
          ["ECONNRESET", "ECONNREFUSED", "EPIPE", "57P01", "57P02", "57P03"].includes(codigoErro);

        if (!erroConexao || tentativa >= maxTentativas) {
          throw e;
        }

        logger.warn(
          `[OTB CACHE] Falha de conexão com SETA na tentativa ${tentativa}/${maxTentativas}. Nova tentativa...`
        );

        await new Promise(resolve =>
          setTimeout(resolve, Math.min(10000, 2000 * tentativa))
        );

      } finally {
        if (client) {
          try {
            await client.query(
              `SET statement_timeout TO ${Number(process.env.DB_STATEMENT_TIMEOUT || 180000)}`
            );
          } catch (_) {}

          try {
            client.release(ultimoErro || undefined);
          } catch (_) {}
        }
      }
    }

    throw ultimoErro || new Error("Falha ao conectar ao SETA para o OTB.");
  }

  async function cacheQuery(sql, params = []) {
    const client = await cachePool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  function minutosDesde(data) {
    if (!data) return Number.POSITIVE_INFINITY;
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
    return (Date.now() - d.getTime()) / 60000;
  }

  function primeiroDiaMes(data) {
    const d = new Date(`${data}T12:00:00`);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
  }

  function ultimoDiaMes(data) {
    const d = new Date(`${data}T12:00:00`);
    return dataISO(new Date(d.getFullYear(), d.getMonth()+1, 0, 12));
  }

  function proximoMes(data) {
    const d = new Date(`${data}T12:00:00`);
    return dataISO(new Date(d.getFullYear(), d.getMonth()+1, 1, 12));
  }

  async function coberturaHistorica() {
    await garantirEstrutura();

    const r = await cacheQuery(`
      SELECT
        (SELECT MIN(data) FROM jp_otb_vendas_dia) AS vendas_min,
        (SELECT MAX(data) FROM jp_otb_vendas_dia) AS vendas_max,
        (SELECT MIN(data) FROM jp_otb_compras_dia) AS compras_min,
        (SELECT MAX(data) FROM jp_otb_compras_dia) AS compras_max,
        (SELECT COUNT(*) FROM jp_otb_vendas_dia) AS vendas_qtd,
        (SELECT COUNT(*) FROM jp_otb_compras_dia) AS compras_qtd
    `);

    return r.rows?.[0] || {};
  }

  function mesChave(data) {
    return String(data || "").slice(0,7);
  }

  async function registrarMes({
    tipo,
    dataIni,
    dataFim,
    concluido = false,
    mensagem = null,
    erro = null
  }) {
    const anoMes = mesChave(dataIni);

    await cacheQuery(`
      INSERT INTO jp_otb_cache_meses (
        tipo,
        ano_mes,
        data_ini,
        data_fim,
        concluido,
        ultima_inicio,
        ultima_sucesso,
        ultima_mensagem,
        ultimo_erro
      )
      VALUES (
        $1,$2,$3::date,$4::date,$5,
        NOW(),
        CASE WHEN $5::boolean THEN NOW() ELSE NULL END,
        $6,$7
      )
      ON CONFLICT (tipo,ano_mes)
      DO UPDATE SET
        data_ini = EXCLUDED.data_ini,
        data_fim = EXCLUDED.data_fim,
        concluido = EXCLUDED.concluido,
        ultima_inicio = NOW(),
        ultima_sucesso =
          CASE
            WHEN EXCLUDED.concluido THEN NOW()
            ELSE jp_otb_cache_meses.ultima_sucesso
          END,
        ultima_mensagem = EXCLUDED.ultima_mensagem,
        ultimo_erro = EXCLUDED.ultimo_erro
    `, [
      tipo,
      anoMes,
      dataIni,
      dataFim,
      Boolean(concluido),
      mensagem,
      erro
    ]);
  }

  async function mesConcluido(tipo, anoMes) {
    const r = await cacheQuery(`
      SELECT concluido
      FROM jp_otb_cache_meses
      WHERE tipo=$1
        AND ano_mes=$2
    `, [tipo, anoMes]);

    return r.rows?.[0]?.concluido === true;
  }

  async function semearMesesExistentes(dataInicioHistorico, hoje) {
    /*
     * Compatibilidade com o cache já parcialmente carregado pela versão
     * anterior. Só considera concluídos meses encerrados e efetivamente
     * cobertos pelo MAX(data) existente.
     */
    const c = await coberturaHistorica();

    const fontes = [
      {
        tipo:"VENDAS",
        max:c.vendas_max ? dataISO(new Date(c.vendas_max)) : ""
      },
      {
        tipo:"COMPRAS",
        max:c.compras_max ? dataISO(new Date(c.compras_max)) : ""
      }
    ];

    for (const fonte of fontes) {
      if (!fonte.max) continue;

      let cursor = primeiroDiaMes(dataInicioHistorico);

      while (cursor <= hoje) {
        const fimNatural = ultimoDiaMes(cursor);
        const fimTrecho = fimNatural > hoje ? hoje : fimNatural;
        const chave = mesChave(cursor);

        /*
         * Um mês passado só é semeado como concluído quando o MAX(data)
         * já alcançou o último dia daquele mês. O mês corrente nunca é
         * marcado automaticamente por esta rotina.
         */
        const mesPassado = fimNatural < hoje;
        const coberto = fonte.max >= fimNatural;

        if (mesPassado && coberto) {
          const jaExiste = await mesConcluido(fonte.tipo, chave);

          if (!jaExiste) {
            await registrarMes({
              tipo:fonte.tipo,
              dataIni:cursor,
              dataFim:fimNatural,
              concluido:true,
              mensagem:"Checkpoint recuperado do cache existente"
            });
          }
        }

        cursor = proximoMes(cursor);
      }
    }
  }

  async function mesesPendentes(tipo, dataInicioHistorico, hoje) {
    const pendentes = [];
    let cursor = primeiroDiaMes(dataInicioHistorico);

    while (cursor <= hoje) {
      const fimNatural = ultimoDiaMes(cursor);
      const fimTrecho = fimNatural > hoje ? hoje : fimNatural;
      const chave = mesChave(cursor);

      const concluido = await mesConcluido(tipo, chave);

      /*
       * O mês corrente sempre é elegível para recarga durante a carga
       * histórica; depois disso o incremental mantém os dias recentes.
       */
      const ehMesAtual = chave === mesChave(hoje);

      if (!concluido || ehMesAtual) {
        pendentes.push({
          tipo,
          anoMes:chave,
          dataIni:cursor < dataInicioHistorico ? dataInicioHistorico : cursor,
          dataFim:fimTrecho
        });
      }

      cursor = proximoMes(cursor);
    }

    return pendentes;
  }

  async function historicoEstaCompleto(dataInicioHistorico, hoje) {
    await semearMesesExistentes(dataInicioHistorico, hoje);

    const vendasPendentes = await mesesPendentes(
      "VENDAS",
      dataInicioHistorico,
      hoje
    );

    const comprasPendentes = await mesesPendentes(
      "COMPRAS",
      dataInicioHistorico,
      hoje
    );

    /*
     * Desconsidera o mês corrente: ele é continuamente atualizado pelo
     * incremental. Para liberar o OTB, todos os meses anteriores precisam
     * estar concluídos e o mês atual precisa ter pelo menos uma carga.
     */
    const mesAtual = mesChave(hoje);

    const vendasPassadas = vendasPendentes.filter(x => x.anoMes !== mesAtual);
    const comprasPassadas = comprasPendentes.filter(x => x.anoMes !== mesAtual);

    const vendaAtualConcluida = await mesConcluido("VENDAS", mesAtual);
    const compraAtualConcluida = await mesConcluido("COMPRAS", mesAtual);

    return {
      ok:
        vendasPassadas.length === 0 &&
        comprasPassadas.length === 0 &&
        vendaAtualConcluida &&
        compraAtualConcluida,
      vendasPendentes,
      comprasPendentes
    };
  }

  async function marcarEtapa(campo) {
    const permitidos = new Set([
      "ultima_dimensao",
      "ultima_estoque",
      "ultima_pedidos",
      "ultima_promocoes"
    ]);

    if (!permitidos.has(campo)) return;

    await cacheQuery(`
      UPDATE jp_otb_cache_status
      SET ${campo} = NOW()
      WHERE id = 1
    `);
  }

  async function garantirEstrutura() {
    await cacheQuery(TABELAS_SQL);
  }

  async function status() {
    await garantirEstrutura();
    const r = await cacheQuery(`
      SELECT *
      FROM jp_otb_cache_status
      WHERE id = 1
    `);
    return r.rows?.[0] || {};
  }

  async function marcarInicio(mensagem) {
    await cacheQuery(`
      UPDATE jp_otb_cache_status
      SET sincronizando = TRUE,
          ultima_inicio = NOW(),
          ultima_mensagem = $1,
          ultimo_erro = NULL
      WHERE id = 1
    `, [mensagem]);
  }

  async function marcarErro(erro) {
    await cacheQuery(`
      UPDATE jp_otb_cache_status
      SET sincronizando = FALSE,
          ultimo_erro = $1,
          ultima_mensagem = 'Falha na atualização'
      WHERE id = 1
    `, [String(erro?.message || erro || "Erro desconhecido").slice(0, 4000)]);
  }

  async function marcarSucesso({ completa, inicioHistorico }) {
    await cacheQuery(`
      UPDATE jp_otb_cache_status
      SET sincronizando = FALSE,
          carga_inicial_concluida = TRUE,
          ultima_sucesso = NOW(),
          ultima_carga_completa =
            CASE WHEN $1::boolean THEN NOW() ELSE ultima_carga_completa END,
          ultima_carga_incremental =
            CASE WHEN $1::boolean THEN ultima_carga_incremental ELSE NOW() END,
          inicio_historico = COALESCE($2::date, inicio_historico),
          ultima_mensagem = $3,
          ultimo_erro = NULL
      WHERE id = 1
    `, [
      Boolean(completa),
      inicioHistorico || null,
      completa
        ? "Carga analítica completa concluída"
        : "Atualização incremental concluída"
    ]);
  }

  async function substituirTabelaPorJSON({
    tabela,
    colunas,
    rows,
    tipos,
    whereDelete = "",
    paramsDelete = []
  }) {
    const client = await cachePool.connect();
    try {
      await client.query("BEGIN");

      if (whereDelete) {
        await client.query(
          `DELETE FROM ${tabela} WHERE ${whereDelete}`,
          paramsDelete
        );
      } else {
        await client.query(`TRUNCATE TABLE ${tabela}`);
      }

      if (rows?.length) {
        const defs = colunas
          .map((c, i) => `${c} ${tipos[i]}`)
          .join(", ");

        const selects = colunas
          .map(c => `x.${c}`)
          .join(", ");

        const campos = colunas.join(", ");

        const chunk = 5000;
        for (let i = 0; i < rows.length; i += chunk) {
          const parte = rows.slice(i, i + chunk);

          await client.query(`
            INSERT INTO ${tabela} (${campos})
            SELECT ${selects}
            FROM jsonb_to_recordset($1::jsonb) AS x(${defs})
          `, [JSON.stringify(parte)]);
        }
      }

      await client.query("COMMIT");
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch (_) {}
      throw e;
    } finally {
      client.release();
    }
  }

  async function atualizarDimensoes() {
    const inicio = Date.now();

    const r = await sourceQuery(`
      SELECT
        LEFT(TRIM(prod.codigo::text),6) AS produto,
        COALESCE(MAX(prod.descricao::text),'') AS descricao,
        COALESCE(MAX(mk.descricao::text),'SEM MARCA') AS marca,
        COALESCE(
          MAX(pe.nome::text),
          MAX(prod.fornecedor::text),
          'SEM FORNECEDOR'
        ) AS fornecedor,
        COALESCE(MAX(d.descricao::text),'SEM DEPARTAMENTO') AS departamento,
        COALESCE(MAX(g.descricao::text),'SEM GRUPO') AS grupo,
        COALESCE(
          MAX(sg.descricao::text),
          MAX(prod.subgrupo::text),
          'SEM SUBGRUPO'
        ) AS subgrupo,
        COALESCE(MAX(l.descricao::text),'SEM LINHA') AS linha,
        COALESCE(MAX(prod.corx::text),'SEM COR') AS cor,
        COALESCE(MAX(prod.complemento::text),'SEM COMPLEMENTO') AS complemento,
        COALESCE(MAX(prod.colecao::text),'SEM CAMPANHA') AS campanha,
        COALESCE(
          MAX(
            COALESCE(
              NULLIF(to_jsonb(prod)->>'preco_venda','')::numeric,
              NULLIF(to_jsonb(prod)->>'preco','')::numeric,
              NULLIF(to_jsonb(prod)->>'valor_venda','')::numeric,
              NULLIF(to_jsonb(prod)->>'preco1','')::numeric,
              0
            )
          ),
          0
        ) AS preco_venda,
        COALESCE(MAX(prod.custo::numeric),0) AS valor_custo
      FROM produtos prod
      LEFT JOIN marcas mk
        ON TRIM(mk.codigo::text)=TRIM(prod.marca::text)
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text)=TRIM(prod.departamento::text)
      LEFT JOIN grupos g
        ON TRIM(g.codigo::text)=TRIM(prod.grupo::text)
      LEFT JOIN subgrupos sg
        ON TRIM(sg.codigo::text)=TRIM(prod.subgrupo::text)
      LEFT JOIN linhas l
        ON TRIM(l.codigo::text)=TRIM(prod.linha::text)
      LEFT JOIN pessoas pe
        ON TRIM(pe.codigo::text)=TRIM(prod.fornecedor::text)
      WHERE COALESCE(TRIM(prod.codigo::text),'') <> ''
      GROUP BY LEFT(TRIM(prod.codigo::text),6)
    `, [], 600000);

    await substituirTabelaPorJSON({
      tabela: "jp_otb_dim_produto",
      colunas: [
        "produto","descricao","marca","fornecedor","departamento",
        "grupo","subgrupo","linha","cor","complemento","campanha",
        "preco_venda","valor_custo"
      ],
      tipos: [
        "varchar(6)","text","text","text","text",
        "text","text","text","text","text","text",
        "numeric","numeric"
      ],
      rows: r.rows || []
    });

    await marcarEtapa("ultima_dimensao");

    logger.log(
      `[OTB CACHE] Dimensões: ${r.rows?.length || 0} produtos | ${Date.now()-inicio} ms`
    );
  }

  async function atualizarEstoque() {
    const inicio = Date.now();

    const r = await sourceQuery(`
      SELECT
        LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
        LEFT(TRIM(m.produto::text),6) AS produto,
        SUM(
          CASE
            WHEN TRIM(m.movimento::text)='E'
              THEN COALESCE(m.quantidade::numeric,0)
            WHEN TRIM(m.movimento::text)='S'
              THEN -COALESCE(m.quantidade::numeric,0)
            ELSE 0
          END
        ) AS estoque
      FROM movimento m
      WHERE COALESCE(m.estoque,false)=TRUE
      GROUP BY 1,2
      HAVING SUM(
        CASE
          WHEN TRIM(m.movimento::text)='E'
            THEN COALESCE(m.quantidade::numeric,0)
          WHEN TRIM(m.movimento::text)='S'
            THEN -COALESCE(m.quantidade::numeric,0)
          ELSE 0
        END
      ) <> 0
    `, [], 600000);

    await substituirTabelaPorJSON({
      tabela: "jp_otb_estoque",
      colunas: ["empresa","produto","estoque"],
      tipos: ["varchar(2)","varchar(6)","numeric"],
      rows: r.rows || []
    });

    await marcarEtapa("ultima_estoque");

    logger.log(
      `[OTB CACHE] Estoque: ${r.rows?.length || 0} linhas | ${Date.now()-inicio} ms`
    );
  }

  async function atualizarVendas(dataIni, dataFim) {
    const inicio = Date.now();

    const r = await sourceQuery(`
      SELECT
        m.data::date AS data,
        LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
        LEFT(TRIM(m.produto::text),6) AS produto,

        SUM(
          CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
             AND COALESCE(TRIM(v.status::text),'')='S'
              THEN ABS(COALESCE(m.quantidade::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
              THEN -ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END
        ) AS vendas,

        SUM(
          CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
             AND COALESCE(TRIM(v.status::text),'')='S'
              THEN ABS(COALESCE(m.total::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
              THEN -ABS(COALESCE(m.total::numeric,0))
            ELSE 0
          END
        ) AS valor_vendas

      FROM movimento m

      LEFT JOIN vendas v
        ON TRIM(m.auxiliar::text)=('VE'||TRIM(v.codigo::text))

      WHERE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC')
        AND m.data::date BETWEEN $1::date AND $2::date

      GROUP BY 1,2,3

      HAVING
        SUM(
          CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
             AND COALESCE(TRIM(v.status::text),'')='S'
              THEN ABS(COALESCE(m.quantidade::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
              THEN -ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END
        ) <> 0
        OR
        SUM(
          CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
             AND COALESCE(TRIM(v.status::text),'')='S'
              THEN ABS(COALESCE(m.total::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
              THEN -ABS(COALESCE(m.total::numeric,0))
            ELSE 0
          END
        ) <> 0
    `, [dataIni, dataFim], 900000);

    await substituirTabelaPorJSON({
      tabela: "jp_otb_vendas_dia",
      colunas: ["data","empresa","produto","vendas","valor_vendas"],
      tipos: ["date","varchar(2)","varchar(6)","numeric","numeric"],
      rows: r.rows || [],
      whereDelete: "data BETWEEN $1::date AND $2::date",
      paramsDelete: [dataIni, dataFim]
    });

    logger.log(
      `[OTB CACHE] Vendas ${dataIni}..${dataFim}: ` +
      `${r.rows?.length || 0} linhas | ${Date.now()-inicio} ms`
    );
  }

  async function atualizarCompras(dataIni, dataFim) {
    const inicio = Date.now();

    const r = await sourceQuery(`
      SELECT
        COALESCE(e.entrega::date,e.data::date) AS data,
        LPAD(TRIM(e.empresa::text),2,'0') AS empresa,
        LEFT(TRIM(m.produto::text),6) AS produto,
        SUM(ABS(COALESCE(m.quantidade::numeric,0))) AS compras,
        SUM(ABS(COALESCE(m.total::numeric,0))) AS valor_compras

      FROM movimento m

      INNER JOIN entradas e
        ON TRIM(m.auxiliar::text)=TRIM(('EN'||e.codigo)::char(8))

      WHERE COALESCE(TRIM(e.tipo::text),'')='10'
        AND TRIM(COALESCE(e.cfop::text,'')) IN ('1102','2102','3102')
        AND COALESCE(e.entrega::date,e.data::date)
            BETWEEN $1::date AND $2::date

      GROUP BY 1,2,3

      HAVING
        SUM(ABS(COALESCE(m.quantidade::numeric,0))) <> 0
        OR
        SUM(ABS(COALESCE(m.total::numeric,0))) <> 0
    `, [dataIni, dataFim], 900000);

    await substituirTabelaPorJSON({
      tabela: "jp_otb_compras_dia",
      colunas: ["data","empresa","produto","compras","valor_compras"],
      tipos: ["date","varchar(2)","varchar(6)","numeric","numeric"],
      rows: r.rows || [],
      whereDelete: "data BETWEEN $1::date AND $2::date",
      paramsDelete: [dataIni, dataFim]
    });

    logger.log(
      `[OTB CACHE] Compras ${dataIni}..${dataFim}: ` +
      `${r.rows?.length || 0} linhas | ${Date.now()-inicio} ms`
    );
  }

  async function atualizarPedidos() {
    const inicio = Date.now();

    const r = await sourceQuery(`
      SELECT
        LPAD(
          TRIM(
            COALESCE(
              NULLIF(pd.empresa::text,''),
              pdd.empresa::text
            )
          ),
          2,
          '0'
        ) AS empresa,

        LEFT(TRIM(pd.produto::text),6) AS produto,

        SUM(
          ABS(COALESCE(pd.pquantidade::numeric,0))
        ) AS pedidos,

        SUM(
          ABS(COALESCE(pd.total::numeric,0))
        ) AS valor_pedidos

      FROM pedidos_detalhes pd

      INNER JOIN pedidos pdd
        ON TRIM(pdd.codigo::text)=TRIM(pd.pedido::text)

      WHERE TRIM(COALESCE(pdd.status::text,'')) IN ('A','C')
        AND pdd.previsao IS NOT NULL
        AND pdd.previsao::date >= CURRENT_DATE - INTERVAL '30 DAY'

      GROUP BY 1,2

      HAVING SUM(
        ABS(COALESCE(pd.pquantidade::numeric,0))
      ) <> 0
    `, [], 300000);

    await substituirTabelaPorJSON({
      tabela: "jp_otb_pedidos",
      colunas: ["empresa","produto","pedidos","valor_pedidos"],
      tipos: ["varchar(2)","varchar(6)","numeric","numeric"],
      rows: r.rows || []
    });

    await marcarEtapa("ultima_pedidos");

    logger.log(
      `[OTB CACHE] Pedidos: ${r.rows?.length || 0} linhas | ${Date.now()-inicio} ms`
    );
  }

  async function atualizarPromocoes() {
    const inicio = Date.now();

    const r = await sourceQuery(`
      SELECT DISTINCT ON (produto,empresa)
        produto,
        empresa,
        valor_promocao,
        promocao_inicio,
        promocao_nome
      FROM (
        SELECT
          CASE
            WHEN LEFT(TRIM(pp.codigo),1)='P'
              THEN SUBSTRING(TRIM(pp.codigo),2,6)
            ELSE SUBSTRING(TRIM(pp.codigo),1,6)
          END AS produto,

          CASE
            WHEN LEFT(TRIM(pp.codigo),1)='P'
              THEN SUBSTRING(TRIM(pp.codigo),8,2)
            ELSE SUBSTRING(TRIM(pp.codigo),7,2)
          END AS empresa,

          COALESCE(
            NULLIF(TRIM(pp.condicao000001::text),'')::numeric,
            0
          ) AS valor_promocao,

          pp.cadastro::date AS promocao_inicio,
          TRIM(COALESCE(pc.descricao::text,'')) AS promocao_nome,
          TRIM(COALESCE(pp.promocao::text,'')) AS promocao_codigo

        FROM promocoes_produtos pp

        INNER JOIN promocoes_cadastro pc
          ON TRIM(pc.codigo::text)=TRIM(pp.promocao::text)

        WHERE pc.fim::date >= CURRENT_DATE
          AND pp.cadastro::date <= CURRENT_DATE
      ) x
      WHERE COALESCE(produto,'') <> ''
        AND COALESCE(empresa,'') <> ''
      ORDER BY
        produto,
        empresa,
        promocao_inicio DESC NULLS LAST,
        promocao_codigo DESC
    `, [], 300000);

    await substituirTabelaPorJSON({
      tabela: "jp_otb_promocoes",
      colunas: [
        "empresa","produto","valor_promocao",
        "promocao_inicio","promocao_nome"
      ],
      tipos: [
        "varchar(2)","varchar(6)","numeric",
        "date","text"
      ],
      rows: r.rows || []
    });

    await marcarEtapa("ultima_promocoes");

    logger.log(
      `[OTB CACHE] Promoções: ${r.rows?.length || 0} linhas | ${Date.now()-inicio} ms`
    );
  }

  async function consolidarVendaMes(dataReferencia) {
    const mes = primeiroDiaMes(dataReferencia);

    await cacheQuery(`
      DELETE FROM jp_otb_vendas_mes
      WHERE mes=$1::date
    `, [mes]);

    await cacheQuery(`
      INSERT INTO jp_otb_vendas_mes (
        mes,empresa,produto,vendas,valor_vendas,atualizado_em
      )
      SELECT
        DATE_TRUNC('month',data)::date AS mes,
        empresa,
        produto,
        SUM(vendas) AS vendas,
        SUM(valor_vendas) AS valor_vendas,
        NOW()
      FROM jp_otb_vendas_dia
      WHERE data >= $1::date
        AND data < ($1::date + INTERVAL '1 MONTH')
      GROUP BY 1,2,3
      HAVING SUM(vendas)<>0 OR SUM(valor_vendas)<>0
    `, [mes]);
  }

  async function consolidarCompraMes(dataReferencia) {
    const mes = primeiroDiaMes(dataReferencia);

    await cacheQuery(`
      DELETE FROM jp_otb_compras_mes
      WHERE mes=$1::date
    `, [mes]);

    await cacheQuery(`
      INSERT INTO jp_otb_compras_mes (
        mes,empresa,produto,compras,valor_compras,atualizado_em
      )
      SELECT
        DATE_TRUNC('month',data)::date AS mes,
        empresa,
        produto,
        SUM(compras) AS compras,
        SUM(valor_compras) AS valor_compras,
        NOW()
      FROM jp_otb_compras_dia
      WHERE data >= $1::date
        AND data < ($1::date + INTERVAL '1 MONTH')
      GROUP BY 1,2,3
      HAVING SUM(compras)<>0 OR SUM(valor_compras)<>0
    `, [mes]);
  }

  async function consolidarMes(tipo,dataReferencia) {
    const inicio=Date.now();

    if(tipo==="VENDAS"){
      await consolidarVendaMes(dataReferencia);
    }else if(tipo==="COMPRAS"){
      await consolidarCompraMes(dataReferencia);
    }else{
      throw new Error(`Tipo de consolidação mensal inválido: ${tipo}`);
    }

    logger.log(
      `[OTB CACHE] ${tipo} ${mesChave(dataReferencia)} consolidado | ` +
      `${Date.now()-inicio} ms`
    );
  }

  async function reconstruirResumosMensais() {
    const inicio=Date.now();

    await cacheQuery("TRUNCATE TABLE jp_otb_vendas_mes");
    await cacheQuery("TRUNCATE TABLE jp_otb_compras_mes");

    await cacheQuery(`
      INSERT INTO jp_otb_vendas_mes (
        mes,empresa,produto,vendas,valor_vendas,atualizado_em
      )
      SELECT
        DATE_TRUNC('month',data)::date,
        empresa,
        produto,
        SUM(vendas),
        SUM(valor_vendas),
        NOW()
      FROM jp_otb_vendas_dia
      GROUP BY 1,2,3
      HAVING SUM(vendas)<>0 OR SUM(valor_vendas)<>0
    `);

    await cacheQuery(`
      INSERT INTO jp_otb_compras_mes (
        mes,empresa,produto,compras,valor_compras,atualizado_em
      )
      SELECT
        DATE_TRUNC('month',data)::date,
        empresa,
        produto,
        SUM(compras),
        SUM(valor_compras),
        NOW()
      FROM jp_otb_compras_dia
      GROUP BY 1,2,3
      HAVING SUM(compras)<>0 OR SUM(valor_compras)<>0
    `);

    logger.log(
      `[OTB CACHE] Resumos mensais reconstruídos | ${Date.now()-inicio} ms`
    );
  }

  async function carregarMesHistorico(item) {
    const {
      tipo,
      anoMes,
      dataIni,
      dataFim
    } = item;

    await registrarMes({
      tipo,
      dataIni,
      dataFim,
      concluido:false,
      mensagem:"Carregando"
    });

    logger.log(
      `[OTB CACHE] ${tipo} ${anoMes} | ${dataIni}..${dataFim} ...`
    );

    try {
      if (tipo === "VENDAS") {
        await atualizarVendas(dataIni, dataFim);
      } else if (tipo === "COMPRAS") {
        await atualizarCompras(dataIni, dataFim);
      } else {
        throw new Error(`Tipo histórico inválido: ${tipo}`);
      }

      await consolidarMes(tipo,dataIni);

      await registrarMes({
        tipo,
        dataIni,
        dataFim,
        concluido:true,
        mensagem:"Concluído"
      });

      logger.log(
        `[OTB CACHE] ${tipo} ${anoMes} ✔`
      );

    } catch (e) {
      await registrarMes({
        tipo,
        dataIni,
        dataFim,
        concluido:false,
        mensagem:"Falha",
        erro:String(e?.message || e || "Erro").slice(0,4000)
      });

      throw e;
    }
  }

  async function carregarHistoricoPendente(dataIni, dataFim) {
    await semearMesesExistentes(dataIni, dataFim);

    /*
     * Vendas e compras têm checkpoints separados. Portanto, se vendas
     * chegaram até abril/2022 e compras até junho/2022, cada uma continua
     * exatamente do seu próprio ponto.
     */
    const vendasPendentes = await mesesPendentes(
      "VENDAS",
      dataIni,
      dataFim
    );

    const comprasPendentes = await mesesPendentes(
      "COMPRAS",
      dataIni,
      dataFim
    );

    logger.log(
      `[OTB CACHE] Pendências históricas: ` +
      `${vendasPendentes.length} mês(es) de vendas | ` +
      `${comprasPendentes.length} mês(es) de compras.`
    );

    /*
     * Intercala vendas/compras por mês para o cache evoluir de forma
     * equilibrada e facilitar a retomada após qualquer interrupção.
     */
    const mapa = new Map();

    for (const item of [...vendasPendentes, ...comprasPendentes]) {
      if (!mapa.has(item.anoMes)) mapa.set(item.anoMes, []);
      mapa.get(item.anoMes).push(item);
    }

    const meses = [...mapa.keys()].sort();

    for (const anoMes of meses) {
      const itens = mapa.get(anoMes)
        .sort((a,b) => a.tipo.localeCompare(b.tipo));

      for (const item of itens) {
        /*
         * Confere novamente porque uma reinicialização pode ter concluído
         * o checkpoint entre a montagem da lista e a execução.
         */
        const jaConcluido = await mesConcluido(item.tipo,item.anoMes);
        const ehMesAtual = item.anoMes === mesChave(dataFim);

        if (jaConcluido && !ehMesAtual) {
          logger.log(
            `[OTB CACHE] ${item.tipo} ${item.anoMes} já concluído. Pulando.`
          );
          continue;
        }

        await carregarMesHistorico(item);
      }
    }
  }

  async function atualizar({ completa = false } = {}) {
    if (executando) {
      return {
        ok:false,
        ignorado:true,
        mensagem:"OTB Engine já está atualizando."
      };
    }

    executando = true;

    const inicioGeral = Date.now();
    const hoje = dataISO();
    const hist = inicioHistoricoPadrao();

    try {
      await garantirEstrutura();

      /*
       * Corrige status deixado como sincronizando=true por encerramento
       * abrupto de uma execução anterior.
       */
      await cacheQuery(`
        UPDATE jp_otb_cache_status
        SET sincronizando = FALSE
        WHERE id = 1
          AND sincronizando = TRUE
          AND (
            ultima_inicio IS NULL
            OR ultima_inicio < NOW() - INTERVAL '20 MINUTES'
          )
      `);

      const st = await status();
      const histStatus = await historicoEstaCompleto(hist,hoje);

      const precisaHistorico =
        completa ||
        !st.carga_inicial_concluida ||
        !histStatus.ok;

      await marcarInicio(
        precisaHistorico
          ? "Retomando carga histórica mensal"
          : "Executando atualização incremental"
      );

      if (precisaHistorico) {
        logger.log(
          `[OTB CACHE] Iniciando/retomando CARGA HISTÓRICA...`
        );

        /*
         * Snapshots são independentes do histórico e podem ser renovados
         * uma vez no início desta retomada.
         */
        if (minutosDesde(st.ultima_dimensao) >= minutosDimensoes) {
          await atualizarDimensoes();
        }

        if (minutosDesde(st.ultima_estoque) >= minutosEstoque) {
          await atualizarEstoque();
        }

        await atualizarPedidos();

        if (minutosDesde(st.ultima_promocoes) >= minutosPromocoes) {
          await atualizarPromocoes();
        }

        /*
         * Não trunca vendas/compras. Continua exatamente dos meses ainda
         * não concluídos.
         */
        await carregarHistoricoPendente(hist,hoje);

        const finalStatus = await historicoEstaCompleto(hist,hoje);

        if (!finalStatus.ok) {
          throw new Error(
            "A carga histórica terminou o ciclo, mas ainda há meses pendentes."
          );
        }

        await marcarSucesso({
          completa:true,
          inicioHistorico:hist
        });

      } else {
        logger.log("[OTB CACHE] Iniciando incremental...");

        if (minutosDesde(st.ultima_dimensao) >= minutosDimensoes) {
          await atualizarDimensoes();
        } else {
          logger.log("[OTB CACHE] Dimensões: mantidas (recentes).");
        }

        if (minutosDesde(st.ultima_estoque) >= minutosEstoque) {
          await atualizarEstoque();
        } else {
          logger.log("[OTB CACHE] Estoque: mantido (snapshot recente).");
        }

        await atualizarPedidos();

        if (minutosDesde(st.ultima_promocoes) >= minutosPromocoes) {
          await atualizarPromocoes();
        } else {
          logger.log("[OTB CACHE] Promoções: mantidas (recentes).");
        }

        const dataIniInc = adicionarDias(hoje,-diasIncrementais);

        await atualizarVendas(dataIniInc,hoje);
        await atualizarCompras(dataIniInc,hoje);

        /*
         * Atualiza apenas os meses tocados pela janela incremental.
         * Normalmente é só o mês atual; na virada do mês serão dois.
         */
        const mesesIncrementais = new Set([
          primeiroDiaMes(dataIniInc),
          primeiroDiaMes(hoje)
        ]);

        for(const mes of mesesIncrementais){
          await consolidarVendaMes(mes);
          await consolidarCompraMes(mes);
        }

        /*
         * O mês atual continua marcado como concluído após cada atualização
         * incremental, registrando a cobertura até o dia corrente.
         */
        await registrarMes({
          tipo:"VENDAS",
          dataIni:primeiroDiaMes(hoje),
          dataFim:hoje,
          concluido:true,
          mensagem:"Atualizado pelo incremental"
        });

        await registrarMes({
          tipo:"COMPRAS",
          dataIni:primeiroDiaMes(hoje),
          dataFim:hoje,
          concluido:true,
          mensagem:"Atualizado pelo incremental"
        });

        await marcarSucesso({
          completa:false,
          inicioHistorico:null
        });
      }

      logger.log(
        `[OTB CACHE] Concluído em ${Date.now()-inicioGeral} ms.`
      );

      return {
        ok:true,
        completa:precisaHistorico,
        duracao_ms:Date.now()-inicioGeral
      };

    } catch (e) {
      logger.error("[OTB CACHE] Erro:",e);

      try {
        await marcarErro(e);
      } catch (_) {}

      /*
       * Nunca mantém a carga como concluída se o histórico não terminou.
       */
      try {
        const final = await historicoEstaCompleto(hist,hoje);

        if (!final.ok) {
          await cacheQuery(`
            UPDATE jp_otb_cache_status
            SET carga_inicial_concluida = FALSE,
                sincronizando = FALSE
            WHERE id = 1
          `);
        }
      } catch (_) {}

      throw e;

    } finally {
      executando = false;
    }
  }

  async function iniciar() {
    await garantirEstrutura();

    // Uma execução anterior pode ter sido encerrada pelo Ctrl+C/restart.
    await cacheQuery(`
      UPDATE jp_otb_cache_status
      SET sincronizando = FALSE
      WHERE id = 1
    `);

    const st = await status();

    const qtdMes = await cacheQuery(`
      SELECT
        (SELECT COUNT(*) FROM jp_otb_vendas_mes) AS vendas_mes,
        (SELECT COUNT(*) FROM jp_otb_compras_mes) AS compras_mes,
        (SELECT COUNT(*) FROM jp_otb_vendas_dia) AS vendas_dia,
        (SELECT COUNT(*) FROM jp_otb_compras_dia) AS compras_dia
    `);

    const resumo = qtdMes.rows?.[0] || {};

    if(
      (
        Number(resumo.vendas_dia || 0) > 0 &&
        Number(resumo.vendas_mes || 0) === 0
      ) ||
      (
        Number(resumo.compras_dia || 0) > 0 &&
        Number(resumo.compras_mes || 0) === 0
      )
    ){
      logger.log("[OTB CACHE] Criando resumos mensais existentes...");
      await reconstruirResumosMensais();
    }

    /*
     * Não bloqueia o servidor. Se ainda não existe cache, inicia
     * a primeira carga em segundo plano.
     */
    setTimeout(() => {
      atualizar({
        completa: !st.carga_inicial_concluida
      }).catch(e => {
        logger.error(
          "[OTB CACHE] Atualização inicial falhou:",
          e.message
        );
      });
    }, 2500);

    if (timer) clearInterval(timer);

    timer = setInterval(() => {
      contadorCiclos++;

      const agora = new Date();

      /*
       * Atualização completa semanal: domingo, após 03h.
       * Incrementais continuam ocorrendo nos demais ciclos.
       */
      const ehDomingo = agora.getDay() === 0;
      const passouDas3 = agora.getHours() >= 3;
      const chaveDia = dataISO(agora);

      const fazerCompleta =
        ehDomingo &&
        passouDas3 &&
        ultimaCargaCompletaDia !== chaveDia;

      if (fazerCompleta) {
        ultimaCargaCompletaDia = chaveDia;
      }

      atualizar({
        completa: fazerCompleta
      }).catch(e => {
        logger.error(
          "[OTB CACHE] Atualização agendada falhou:",
          e.message
        );
      });

    }, intervaloMinutos * 60 * 1000);

    logger.log(
      `[OTB CACHE] Motor ativo. Incremental a cada ${intervaloMinutos} min.`
    );
  }

  function parar() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }


  /* =========================================================
     ATUALIZAÇÕES MANUAIS SEPARADAS
     ---------------------------------------------------------
     Dimensões = cadastros leves.
     Fatos     = movimentos pesados.
     ========================================================= */

  async function finalizarAtualizacaoManual(mensagem, {completa=false} = {}){
    await cacheQuery(`
      UPDATE jp_otb_cache_status
      SET sincronizando = FALSE,
          ultima_sucesso = NOW(),
          ultima_carga_completa =
            CASE WHEN $1::boolean THEN NOW() ELSE ultima_carga_completa END,
          ultima_carga_incremental =
            CASE WHEN $1::boolean THEN ultima_carga_incremental ELSE NOW() END,
          ultima_mensagem = $2,
          ultimo_erro = NULL
      WHERE id = 1
    `,[Boolean(completa),String(mensagem || "").slice(0,4000)]);
  }

  async function atualizarDimensoesAgora(){
    if(executando){
      return {
        ok:false,
        ignorado:true,
        mensagem:"O Motor Analítico já está executando outra atualização."
      };
    }

    executando = true;
    const inicio = Date.now();

    try{
      await garantirEstrutura();
      await marcarInicio("Atualização manual de Cadastros / Dimensões");

      /*
       * Hoje o OTB possui a dimensão central de produtos.
       * Quando outros caches do sistema forem registrados no orquestrador
       * global, eles serão chamados pelo mesmo botão do Deskboard.
       */
      await atualizarDimensoes();

      await finalizarAtualizacaoManual(
        "Cadastros / Dimensões atualizados manualmente"
      );

      return {
        ok:true,
        tipo:"dimensoes",
        duracao_ms:Date.now()-inicio
      };

    }catch(e){
      try{ await marcarErro(e); }catch(_){}
      throw e;

    }finally{
      executando = false;
    }
  }

  async function atualizarFatosAgora({periodo="recente"} = {}){
    if(executando){
      return {
        ok:false,
        ignorado:true,
        mensagem:"O Motor Analítico já está executando outra atualização."
      };
    }

    executando = true;

    const inicioExecucao = Date.now();
    const hoje = dataISO();
    const historico = inicioHistoricoPadrao();

    let dataIni;
    let rotulo;

    if(periodo === "completo"){
      dataIni = historico;
      rotulo = "Histórico completo";
    }else if(periodo === "12m"){
      dataIni = adicionarDias(hoje,-365);
      rotulo = "Últimos 12 meses";
    }else{
      dataIni = adicionarDias(hoje,-diasIncrementais);
      rotulo = `Janela normal (${diasIncrementais} dias)`;
      periodo = "recente";
    }

    try{
      await garantirEstrutura();

      await marcarInicio(
        `Atualização manual de Movimentos / Fatos - ${rotulo}`
      );

      /*
       * Snapshots atuais fazem parte do bloco de fatos.
       */
      await atualizarEstoque();
      await atualizarPedidos();

      /*
       * Reprocessa vendas e compras mês a mês. Isso evita uma consulta
       * gigantesca no ERP e garante que alterações antigas sejam realmente
       * relidas, inclusive em meses já marcados como concluídos.
       */
      let cursor = primeiroDiaMes(dataIni);

      while(cursor <= hoje){
        const mesIni = primeiroDiaMes(cursor);
        const mesFimNatural = ultimoDiaMes(cursor);

        const trechoIni =
          dataIni > mesIni ? dataIni : mesIni;

        const trechoFim =
          hoje < mesFimNatural ? hoje : mesFimNatural;

        logger.log(
          `[OTB CACHE] Reprocessando fatos ${trechoIni}..${trechoFim}`
        );

        await atualizarVendas(trechoIni,trechoFim);
        await atualizarCompras(trechoIni,trechoFim);

        await consolidarVendaMes(mesIni);
        await consolidarCompraMes(mesIni);

        await registrarMes({
          tipo:"VENDAS",
          dataIni:mesIni,
          dataFim:trechoFim,
          concluido:true,
          mensagem:`Reprocessado manualmente - ${rotulo}`
        });

        await registrarMes({
          tipo:"COMPRAS",
          dataIni:mesIni,
          dataFim:trechoFim,
          concluido:true,
          mensagem:`Reprocessado manualmente - ${rotulo}`
        });

        cursor = proximoMes(cursor);
      }

      await finalizarAtualizacaoManual(
        `Movimentos / Fatos atualizados manualmente - ${rotulo}`,
        {completa:periodo === "completo"}
      );

      return {
        ok:true,
        tipo:"fatos",
        periodo,
        data_ini:dataIni,
        data_fim:hoje,
        duracao_ms:Date.now()-inicioExecucao
      };

    }catch(e){
      try{ await marcarErro(e); }catch(_){}
      throw e;

    }finally{
      executando = false;
    }
  }

  return {
    garantirEstrutura,
    status,
    atualizar,
    atualizarDimensoesAgora,
    atualizarFatosAgora,
    iniciar,
    parar
  };
}

module.exports = {
  criarOTBEngine,
  TABELAS_SQL
};


/* =========================================================
   MODO STANDALONE
   Use:
     node otb_engine.js
   Faz a carga completa e encerra.
   ========================================================= */
if (require.main === module) {
  const sourcePool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl:
      String(process.env.DB_SSL || "false").toLowerCase() === "true"
        ? { rejectUnauthorized:false }
        : false,
    max: 3,
    connectionTimeoutMillis: 15000,
    statement_timeout: 900000
  });

  const cachePool = criarPoolJPDesk({
    max: 2,
    statement_timeout: 900000,
    query_timeout: 900000
  });

  const engine = criarOTBEngine({
    sourcePool,
    cachePool
  });

  engine.atualizar({ completa:true })
    .then(resultado => {
      console.log("[OTB CACHE] Carga standalone concluída:", resultado);
      process.exitCode = 0;
    })
    .catch(erro => {
      console.error("[OTB CACHE] Carga standalone falhou:", erro);
      process.exitCode = 1;
    })
    .finally(async () => {
      try { await sourcePool.end(); } catch (_) {}
      try { await cachePool.end(); } catch (_) {}
    });
}
