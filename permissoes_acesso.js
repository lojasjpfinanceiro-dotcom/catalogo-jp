"use strict";

const {
  MODULOS,
  TODOS_OS_MODULOS,
  normalizarGrupo
} = require("./permissoes_modulos");

function criarServicoPermissoes({ querySafe, queryAtendimento }) {
  if (typeof querySafe !== "function" || typeof queryAtendimento !== "function") {
    throw new Error("permissoes_acesso: informe querySafe e queryAtendimento.");
  }

  let schemaPronto = false;
  let cacheGrupos = { em:0, mapa:new Map() };

  async function garantirSchema() {
    if (schemaPronto) return;

    await queryAtendimento(`
      CREATE TABLE IF NOT EXISTS jpdesk.jp_modulos (
        codigo          VARCHAR(80) PRIMARY KEY,
        nome            VARCHAR(160) NOT NULL,
        grupo_menu      VARCHAR(80) NOT NULL DEFAULT 'OUTROS',
        rota            VARCHAR(240),
        ordem           INTEGER NOT NULL DEFAULT 0,
        ativo           BOOLEAN NOT NULL DEFAULT TRUE,
        atualizado_em   TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `, [], 30000);

    await queryAtendimento(`
      CREATE TABLE IF NOT EXISTS jpdesk.jp_grupos_modulos (
        grupo_codigo    VARCHAR(2) NOT NULL,
        modulo_codigo   VARCHAR(80) NOT NULL
          REFERENCES jpdesk.jp_modulos(codigo) ON DELETE CASCADE,
        acessar         BOOLEAN NOT NULL DEFAULT FALSE,
        atualizado_em   TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_por  VARCHAR(20),
        PRIMARY KEY (grupo_codigo, modulo_codigo)
      )
    `, [], 30000);

    await queryAtendimento(`
      CREATE INDEX IF NOT EXISTS idx_jp_grupos_modulos_grupo
      ON jpdesk.jp_grupos_modulos(grupo_codigo, acessar)
    `, [], 30000);

    for (const modulo of MODULOS) {
      await queryAtendimento(`
        INSERT INTO jpdesk.jp_modulos
          (codigo, nome, grupo_menu, rota, ordem, ativo, atualizado_em)
        VALUES ($1,$2,$3,$4,$5,TRUE,NOW())
        ON CONFLICT (codigo) DO UPDATE SET
          nome=EXCLUDED.nome,
          grupo_menu=EXCLUDED.grupo_menu,
          rota=EXCLUDED.rota,
          ordem=EXCLUDED.ordem,
          atualizado_em=NOW()
      `, [
        modulo.codigo,
        modulo.nome,
        modulo.grupoMenu,
        modulo.rota,
        modulo.ordem
      ], 30000);
    }

    schemaPronto = true;
  }

  async function listarModulosAtivos() {
    await garantirSchema();

    const r = await queryAtendimento(`
      SELECT
        TRIM(codigo) AS codigo,
        TRIM(nome) AS nome,
        TRIM(grupo_menu) AS grupo_menu,
        COALESCE(rota,'') AS rota,
        ordem
      FROM jpdesk.jp_modulos
      WHERE ativo=TRUE
      ORDER BY ordem, nome
    `, [], 30000);

    return r.rows || [];
  }

  async function listarGruposSeta() {
    const r = await querySafe(`
      SELECT
        LPAD(TRIM(codigo::text),2,'0') AS codigo,
        TRIM(descricao::text) AS descricao,
        COALESCE(rede,FALSE) AS rede
      FROM public.funcionarios_grupos
      ORDER BY LPAD(TRIM(codigo::text),2,'0')
    `, [], 30000);

    return r.rows || [];
  }

  async function mapaGruposSeta() {
    const agora = Date.now();

    if (agora - cacheGrupos.em < 30000 && cacheGrupos.mapa.size) {
      return cacheGrupos.mapa;
    }

    const grupos = await listarGruposSeta();
    const mapa = new Map();

    for (const g of grupos) {
      mapa.set(
        normalizarGrupo(g.codigo),
        String(g.descricao || "").trim().toUpperCase()
      );
    }

    cacheGrupos = { em:agora, mapa };
    return mapa;
  }

  async function nomeGrupo(grupo) {
    const codigo = normalizarGrupo(grupo);
    const mapa = await mapaGruposSeta();
    return mapa.get(codigo) || "";
  }

  async function grupoEhGerente(grupo) {
    const descricao = await nomeGrupo(grupo);
    return /\bGERENTE\b/i.test(descricao);
  }

  async function regraFixaAtendimento(grupo) {
    return await grupoEhGerente(grupo);
  }

  async function sincronizarRegraAtendimento() {
    await garantirSchema();
    const grupos = await listarGruposSeta();

    for (const g of grupos) {
      const codigo = normalizarGrupo(g.codigo);
      const ehGerente = /\bGERENTE\b/i.test(String(g.descricao || "").trim().toUpperCase());

      await queryAtendimento(`
        INSERT INTO jpdesk.jp_grupos_modulos
          (grupo_codigo, modulo_codigo, acessar, atualizado_em, atualizado_por)
        VALUES ($1,'atendimento',$2,NOW(),'REGRA_SISTEMA')
        ON CONFLICT (grupo_codigo, modulo_codigo) DO UPDATE SET
          acessar=EXCLUDED.acessar,
          atualizado_em=NOW(),
          atualizado_por='REGRA_SISTEMA'
      `, [codigo, ehGerente], 30000);
    }
  }

  async function modulosDoGrupo(grupo) {
    const codigo = normalizarGrupo(grupo);
    const ehGerente = await grupoEhGerente(codigo);

    if (codigo === "02") {
      const ativos = await listarModulosAtivos();
      return ativos.map(m => m.codigo).filter(codigoModulo => codigoModulo !== "atendimento");
    }

    await garantirSchema();

    const r = await queryAtendimento(`
      SELECT TRIM(gm.modulo_codigo) AS codigo
      FROM jpdesk.jp_grupos_modulos gm
      JOIN jpdesk.jp_modulos m
        ON m.codigo=gm.modulo_codigo
       AND m.ativo=TRUE
      WHERE gm.grupo_codigo=$1
        AND gm.acessar=TRUE
      ORDER BY m.ordem, m.nome
    `, [codigo], 30000);

    const lista = new Set((r.rows || []).map(x => x.codigo));
    if (ehGerente) lista.add("atendimento");
    else lista.delete("atendimento");
    return [...lista];
  }

  async function grupoTemModulo(grupo, modulo) {
    const codigo = normalizarGrupo(grupo);
    const moduloCodigo = String(modulo || "").trim();
    if (!moduloCodigo) return false;
    if (moduloCodigo === "atendimento") return await regraFixaAtendimento(codigo);
    if (codigo === "02") return true;

    await garantirSchema();
    const r = await queryAtendimento(`
      SELECT 1
      FROM jpdesk.jp_grupos_modulos gm
      JOIN jpdesk.jp_modulos m
        ON m.codigo=gm.modulo_codigo
       AND m.ativo=TRUE
      WHERE gm.grupo_codigo=$1
        AND gm.modulo_codigo=$2
        AND gm.acessar=TRUE
      LIMIT 1
    `, [codigo, moduloCodigo], 30000);
    return Boolean(r.rows?.length);
  }

  async function obterConfiguracao() {
    const [grupos, modulos] = await Promise.all([listarGruposSeta(), listarModulosAtivos()]);
    await sincronizarRegraAtendimento();

    const r = await queryAtendimento(`
      SELECT
        TRIM(grupo_codigo) AS grupo_codigo,
        TRIM(modulo_codigo) AS modulo_codigo,
        acessar
      FROM jpdesk.jp_grupos_modulos
    `, [], 30000);

    const permissoes = {};
    for (const row of r.rows || []) {
      if (!permissoes[row.grupo_codigo]) permissoes[row.grupo_codigo] = {};
      permissoes[row.grupo_codigo][row.modulo_codigo] = Boolean(row.acessar);
    }

    for (const grupo of grupos) {
      const codigo = normalizarGrupo(grupo.codigo);
      const descricao = String(grupo.descricao || "").trim().toUpperCase();
      const ehGerente = /\bGERENTE\b/i.test(descricao);
      if (!permissoes[codigo]) permissoes[codigo] = {};
      permissoes[codigo].atendimento = ehGerente;
    }

    permissoes["02"] = Object.fromEntries(
      modulos.map(m => [m.codigo, m.codigo === "atendimento" ? false : true])
    );

    const regrasFixas = {
      atendimento: {
        modo:"SOMENTE_GERENTES",
        editavel:false,
        mensagem:"Acesso operacional obrigatório somente para grupos GERENTE. Demais grupos não podem acessar."
      }
    };

    return { grupos, modulos, permissoes, regrasFixas };
  }

  async function salvarAlteracoes(alteracoes, usuario) {
    await garantirSchema();
    const itens = Array.isArray(alteracoes) ? alteracoes : [];
    let salvos = 0;

    for (const item of itens) {
      const grupo = normalizarGrupo(item?.grupo);
      const modulo = String(item?.modulo || "").trim();
      const acessar = Boolean(item?.acessar);
      if (!grupo || !TODOS_OS_MODULOS.includes(modulo)) continue;
      if (modulo === "atendimento") continue;
      if (grupo === "02") continue;

      await queryAtendimento(`
        INSERT INTO jpdesk.jp_grupos_modulos
          (grupo_codigo, modulo_codigo, acessar, atualizado_em, atualizado_por)
        VALUES ($1,$2,$3,NOW(),$4)
        ON CONFLICT (grupo_codigo, modulo_codigo) DO UPDATE SET
          acessar=EXCLUDED.acessar,
          atualizado_em=NOW(),
          atualizado_por=EXCLUDED.atualizado_por
      `, [grupo, modulo, acessar, String(usuario?.codigo || "").trim().slice(0,20)], 30000);
      salvos++;
    }

    await sincronizarRegraAtendimento();
    return salvos;
  }

  function registrarRotas({ app, authSeta }) {
    app.get(
      "/api/permissoes/configuracao",
      authSeta.exigirGrupoAdministrador,
      async (req, res) => {
        try {
          const dados = await obterConfiguracao();
          return res.json({ ok:true, ...dados });
        } catch (e) {
          console.error("Erro carregar configuração de permissões:", e);
          return res.status(500).json({ ok:false, erro:e.message });
        }
      }
    );

    app.post(
      "/api/permissoes/salvar",
      authSeta.exigirGrupoAdministrador,
      async (req, res) => {
        try {
          const salvos = await salvarAlteracoes(req.body?.alteracoes, req.usuarioSeta);
          return res.json({
            ok:true,
            salvos,
            mensagem:`${salvos} permissão(ões) atualizada(s). Atendimento é controlado automaticamente por grupo GERENTE.`
          });
        } catch (e) {
          console.error("Erro salvar permissões:", e);
          return res.status(500).json({ ok:false, erro:e.message });
        }
      }
    );
  }

  return {
    garantirSchema,
    listarGruposSeta,
    grupoEhGerente,
    modulosDoGrupo,
    grupoTemModulo,
    obterConfiguracao,
    salvarAlteracoes,
    registrarRotas
  };
}

module.exports = { criarServicoPermissoes };
