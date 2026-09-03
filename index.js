require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const { criarPoolJPDesk } = require("./backend/config/jpdesk-db");

const poolAtendimento = criarPoolJPDesk({ max: 5 });
const poolInventario = criarPoolJPDesk({ max: 5 });

instalarProtecaoPoolPostgres(poolAtendimento,"ATENDIMENTO");
instalarProtecaoPoolPostgres(poolInventario,"INVENTARIO");
 poolInventario.query("SELECT current_database()")
 .then(r => console.log("BANCO INVENTARIO:", r.rows[0].current_database))
  .catch(e => console.error("ERRO INVENTARIO:", e.message));

// ============================================================
// PROTEÇÃO GLOBAL DAS CONEXÕES POSTGRESQL
// Evita que "Connection terminated unexpectedly" derrube o Node.
// ============================================================
function instalarProtecaoPoolPostgres(poolDb,nome){
  if(!poolDb || poolDb.__jpdeskProtegido) return;

  poolDb.__jpdeskProtegido = true;

  poolDb.on("error",(err)=>{
    console.error(`[POSTGRES ${nome}] erro inesperado no pool:`,err?.message || err);
  });

  poolDb.on("connect",(client)=>{
    if(!client || client.__jpdeskProtegido) return;

    client.__jpdeskProtegido = true;

    client.on("error",(err)=>{
      console.error(
        `[POSTGRES ${nome}] conexão encerrada/erro no client:`,
        err?.message || err
      );
    });
  });
}

function erroConexaoPostgres(err){
  const msg=String(err?.message || err || "").toLowerCase();
  const code=String(err?.code || "").toUpperCase();

  return (
    msg.includes("connection terminated unexpectedly") ||
    msg.includes("connection terminated") ||
    msg.includes("connection closed") ||
    msg.includes("server closed the connection") ||
    msg.includes("socket") ||
    ["ECONNRESET","ECONNREFUSED","EPIPE","57P01","57P02","57P03"].includes(code)
  );
}

function liberarClientSeguro(client,err=null){
  if(!client) return;

  try{
    client.release(err || undefined);
  }catch(e){
    console.error("[POSTGRES] falha ao liberar client:",e?.message || e);
  }
}

const crypto = require("crypto");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);



// ============================
// AUTENTICAÇÃO PELO SETA
// ============================
const { criarAuthSeta } = require("./auth_seta");
const { criarServicoPermissoes } = require("./permissoes_acesso");
const { criarMiddlewareEmpresas } = require("./acesso_empresas");
const { moduloDaRota } = require("./permissoes_modulos");
const { AsyncLocalStorage } = require("async_hooks");

const servicoPermissoes = criarServicoPermissoes({
  querySafe,
  queryAtendimento
});

const authSeta = criarAuthSeta({
  segredo: process.env.AUTH_SETA_SECRET,
  duracaoSegundos: Number(process.env.AUTH_SETA_DURACAO_SEGUNDOS || 28800),
  servicoPermissoes
});

app.use(express.json());
app.use(authSeta.middlewareGlobal);
app.use(criarMiddlewareEmpresas());

/*
 * ============================================================
 * BLOQUEIO REAL POR MÓDULO
 * ============================================================
 * A grade jpdesk.jp_grupos_modulos passa a ser a autoridade.
 * Este middleware fica ANTES do express.static para impedir que
 * um HTML seja aberto digitando a URL diretamente.
 */
app.use(async (req, res, next) => {
  try {
    const caminho = String(req.path || "");

    let modulo = moduloDaRota(caminho);

    /*
     * APIs administrativas do Atendimento Gerencial.
     * Não exigem acesso ao módulo operacional "atendimento".
     */
    if (/^\/api\/atendimento-gerencial(?:\/|$)/i.test(caminho)) {
      modulo = "atendimento-gerencial";
    }

    /*
     * Compatibilidade das rotas antigas:
     * GET /api/atendimento/perguntas continua operacional.
     * Alterações antigas de perguntas continuam tratadas como Gerencial.
     */
    if (
      /^\/api\/atendimento\/perguntas(?:\/|$)/i.test(caminho) &&
      String(req.method || "GET").toUpperCase() !== "GET"
    ) {
      modulo = "atendimento-gerencial";
    }

    // Rota não pertencente à grade: segue normalmente.
    if (!modulo) {
      return next();
    }

    const usuario = req.usuarioSeta;

    if (!usuario) {
      if (caminho.startsWith("/api/")) {
        return res.status(401).json({
          ok:false,
          erro:"Sessão expirada. Entre novamente no JPDESK."
        });
      }

      return res.redirect("/home.html");
    }

    const grupo = String(usuario.grupo || "")
      .trim()
      .padStart(2, "0")
      .slice(-2);

    const permitido = await servicoPermissoes.grupoTemModulo(
      grupo,
      modulo
    );

    if (permitido) {
      return next();
    }

    console.warn(
      `[PERMISSÃO NEGADA] grupo=${grupo} modulo=${modulo} rota=${caminho}`
    );

    if (caminho.startsWith("/api/")) {
      return res.status(403).json({
        ok:false,
        erro:`Seu grupo não possui acesso ao módulo ${modulo}.`,
        modulo
      });
    }

    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Acesso não autorizado</title>
        <style>
          body{
            margin:0;
            min-height:100vh;
            display:grid;
            place-items:center;
            background:#071426;
            font-family:Segoe UI,Arial,sans-serif;
            color:#eef5ff;
          }
          .box{
            width:min(520px,calc(100vw - 32px));
            padding:28px;
            border:1px solid #203b60;
            border-radius:18px;
            background:#0e213d;
            box-shadow:0 22px 60px rgba(0,0,0,.28);
          }
          h2{margin:0 0 10px}
          p{color:#b9cbe4;line-height:1.5}
          a{
            display:inline-block;
            margin-top:12px;
            padding:11px 16px;
            border-radius:10px;
            background:#2f6df6;
            color:white;
            text-decoration:none;
            font-weight:700;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>Acesso não autorizado</h2>
          <p>
            Seu grupo não possui permissão para acessar este módulo.
            Solicite a liberação na Central de Permissões.
          </p>
          <a href="/home.html">Voltar ao JPDESK</a>
        </div>
      </body>
      </html>
    `);

  } catch (erro) {
    console.error("Erro ao validar permissão do módulo:", erro);
    return res.status(500).json({
      ok:false,
      erro:"Não foi possível validar a permissão de acesso."
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/index_dark.html", (req, res) => res.redirect("/index.html"));
app.get("/transferencia-inteligente.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "transf-intel.html"));
});
app.get("/relatorios-ia", (req, res) => res.redirect("/relatorios-ia.html"));
app.get("/comercial/relatorios-ia", (req, res) => res.redirect("/relatorios-ia.html"));
// ============================
// ROTAS PRINCIPAIS
// ============================

// LOGÍSTICA
app.get("/", (req, res) => res.redirect("/home.html"));
app.get("/catalogo", (req, res) => res.redirect("/index.html"));
app.get("/logistica/catalogo", (req, res) => res.redirect("/index.html"));
app.get("/logistica/otb", (req, res) => res.redirect("/otb.html"));
app.get("/logistica/giro", (req, res) => res.redirect("/giro.html"));
app.get("/logistica/transferencia-inteligente", (req, res) => res.redirect("/transf-intel.html"));
app.get("/logistica/inventario-vitrine", (req, res) => res.redirect("/index.html#inventario-vitrine"));

// COMERCIAL
app.get("/comercial/catalogo-cliente", (req, res) => res.redirect("/catalogo_cliente.html"));
app.get("/catalogo-cliente", (req, res) => res.redirect("/catalogo_cliente.html"));
app.get("/comercial/atendimento", (req, res) => {
  res.redirect("/atendimento.html");
});

app.get("/atendimento", (req, res) => {
  res.redirect("/atendimento.html");
});
app.get("/comercial/atendimento-gerencial", (req, res) => res.redirect("/atendimento-admin.html"));
app.get("/comercial/metas", (req, res) => res.redirect("/metas.html"));
app.get("/metas", (req, res) => res.redirect("/metas.html"));

// FINANCEIRO
app.get("/financeiro", (req, res) => res.redirect("/financeiro.html"));
app.get("/financeiro/fluxo-caixa", (req, res) => res.redirect("/financeiro.html#fluxo-caixa"));
app.get("/financeiro/dre-competencia", (req, res) => res.redirect("/financeiro.html#dre-competencia"));
app.get("/financeiro/dre-caixa", (req, res) => res.redirect("/financeiro.html#dre-caixa"));
app.get("/financeiro/crediario", (req, res) => res.redirect("/financeiro.html#crediario"));
app.get("/financeiro/ativo-passivo", (req, res) => res.redirect("/financeiro.html#ativo-passivo"));
app.get("/financeiro/conciliacao", (req, res) => res.redirect("/financeiro.html#conciliacao"));
app.get("/financeiro/rentabilidade", (req, res) => res.redirect("/financeiro.html#rentabilidade"));

// ROTAS ANTIGAS MANTIDAS
app.get("/otb", (req, res) => res.redirect("/otb.html"));
app.get("/otb-bi", (req, res) => res.redirect("/otb-bi.html"));
app.get("/logistica/otb-bi", (req, res) => res.redirect("/otb-bi.html"));
app.get("/giro", (req, res) => res.redirect("/giro.html"));
app.get("/home", (req, res) =>
  res.sendFile(path.join(__dirname, "public", "home.html"))
);

// ============================
// DB POOL
// ============================
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  ssl:
    (process.env.DB_SSL || "false").toLowerCase() === "true"
      ? { rejectUnauthorized: false }
      : undefined,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  keepAlive: true,
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT || 180000),
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT || 180000),
});

instalarProtecaoPoolPostgres(pool,"SETA");

pool.on("connect", async (client) => {
  try {
    await client.query(
      `SET statement_timeout TO ${Number(process.env.DB_STATEMENT_TIMEOUT || 180000)}`
    );
  } catch (e) {
    console.error("⚠️ Falha ao aplicar statement_timeout:", e.message);
  }
});

// ============================================================
// REGRA GLOBAL DO FINANCEIRO — PLANO 012 TRANSFERÊNCIAS
// ============================================================
// Todas as rotas /api/financeiro executam dentro deste contexto.
// Por padrão, qualquer leitura de financeiro_titulos exclui item 012.
// Só inclui quando ?incluirTransferencias=1.
const financeiroRequestContext = new AsyncLocalStorage();

app.use("/api/financeiro", (req, res, next) => {
  const incluirTransferencias =
    String(req.query?.incluirTransferencias || "0").trim() === "1";

  financeiroRequestContext.run({ incluirTransferencias }, next);
});

function aplicarRegraGlobalTransferencias012(sql){
  const ctx = financeiroRequestContext.getStore();

  // Fora do módulo Financeiro, não altera absolutamente nada.
  if(!ctx) return sql;

  // Marcado = consulta original, incluindo 012.
  if(ctx.incluirTransferencias) return sql;

  let texto = String(sql || "");

  // Filtra a tabela na origem, preservando JOINs, WHEREs, agrupamentos,
  // cards, gráficos, tabelas, DRE, caixa, posição e projeções.
  // Suporta os aliases usados atualmente no servidor (ft, ftf etc.).
  texto = texto.replace(
    /\bFROM\s+financeiro_titulos\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    (match, alias) =>
      `FROM (SELECT * FROM financeiro_titulos WHERE LPAD(REGEXP_REPLACE(TRIM(COALESCE(item::text,'')),'\\\\D','','g'),3,'0') <> '012') ${alias}`
  );

  texto = texto.replace(
    /\bJOIN\s+financeiro_titulos\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    (match, alias) =>
      `JOIN (SELECT * FROM financeiro_titulos WHERE LPAD(REGEXP_REPLACE(TRIM(COALESCE(item::text,'')),'\\\\D','','g'),3,'0') <> '012') ${alias}`
  );

  return texto;
}

async function querySafe(sql, params = [], ms = 180000) {
  let client = null;
  let erroClient = null;

  try {
    client = await pool.connect();

    const sqlFinal = aplicarRegraGlobalTransferencias012(sql);

    return await client.query({
      text: sqlFinal,
      values: params,
      query_timeout: Math.max(1000, Number(ms || 180000)),
    });

  } catch (e) {
    if(erroConexaoPostgres(e)){
      erroClient = e;
      console.error("[POSTGRES SETA] conexão perdida durante consulta:",e?.message || e);
    }

    throw e;

  } finally {
    liberarClientSeguro(client,erroClient);
  }
}
// Rotas públicas de login/logout e consulta da sessão.
authSeta.registrarRotas({ app, querySafe });

// Grade administrativa de permissões por grupo do Seta.
servicoPermissoes.registrarRotas({ app, authSeta });


let FIN_TITULOS_COLUNAS_CACHE = null;
let FIN_TITULOS_COLUNAS_CACHE_EM = 0;

async function obterColunasFinanceiroTitulos(){
  const agora = Date.now();

  if(
    FIN_TITULOS_COLUNAS_CACHE &&
    agora - FIN_TITULOS_COLUNAS_CACHE_EM < 10 * 60 * 1000
  ){
    return FIN_TITULOS_COLUNAS_CACHE;
  }

  const r = await querySafe(`
    SELECT LOWER(column_name) AS coluna
    FROM information_schema.columns
    WHERE LOWER(table_name) = 'financeiro_titulos'
  `,[],15000);

  FIN_TITULOS_COLUNAS_CACHE = new Set(
    (r.rows || []).map(x => String(x.coluna || "").toLowerCase())
  );
  FIN_TITULOS_COLUNAS_CACHE_EM = agora;

  return FIN_TITULOS_COLUNAS_CACHE;
}

function primeiraColunaExistente(colunas,candidatas){
  for(const nome of candidatas){
    if(colunas.has(String(nome).toLowerCase())){
      return String(nome).toLowerCase();
    }
  }
  return "";
}

function exprFlagTitulo(alias,coluna){
  if(!coluna) return "";

  // Funciona para booleanos, textos, números e também datas:
  // qualquer conteúdo válido que não represente explicitamente "não".
  return `(
    NULLIF(TRIM(COALESCE(${alias}.${coluna}::text,'')),'') IS NOT NULL
    AND UPPER(TRIM(COALESCE(${alias}.${coluna}::text,''))) NOT IN (
      'N','NAO','NÃO','F','FALSE','0','NO'
    )
  )`;
}

function situacaoTituloLabel(status){
  const s = String(status || "").trim().toUpperCase();
  if(s === "A") return "Em aberto";
  if(s === "B") return "Baixado";
  if(s === "C") return "Cancelado";
  return s || "-";
}


async function consultarResumoTodasSituacoesFinanceirasSeta({
  lado="pagar",
  dataIni="",
  dataFim="",
  empresa="",
  empresas=[],
  fornecedor="",
  plano="",
  cliente="",
  formaPagamento="",
  incluirTransferencias=false
}={}){
  const situacoes = [
    ["ABERTO","Em aberto"],
    ["BAIXADO","Baixado / realizado"],
    ["ATRASADO","Atrasado"],
    ["EMISSAO","Emissão"],
    ["COMBINADO","Combinado"],
    ["COMPETENCIA","Competência"],
    ["ACEITE","Aceite"],
    ["SEM_ACEITE","Sem aceite"],
    ["COMPETENCIA_EMISSAO","Competência / emissão"],
    ["PREVISAO","Previsão"],
    ["PENDENCIA","Pendência"],
    ["SCPC","SCPC"],
    ["CARTORIO","Cartório"],
    ["COBRADORA","Cobradora"],
    ["CANCELADO","Cancelado"],
    ["SUBSTITUIDO","Substituído"],
    ["CUSTODIA","Custódia"]
  ];

  const saida = [];

  const resultados = await Promise.all(
    situacoes.map(async ([codigo,label]) => {
    const params = [];
    const where = [
      lado === "receber"
        ? `TRIM(COALESCE(ft.rp::text,'')) = 'R'`
        : `TRIM(COALESCE(ft.rp::text,'')) IN ('P','S')`
    ];

    const filtroSit = await montarFiltroSituacaoFinanceiraSeta({
      alias:"ft",
      situacao:codigo,
      dataIni,
      dataFim,
      params
    });

    where.push(...filtroSit.filtros);

    if(lado === "pagar" && !incluirTransferencias){
      where.push(`
        LPAD(
          REGEXP_REPLACE(TRIM(COALESCE(ft.item::text,'')),'\\D','','g'),
          3,'0'
        ) <> '012'
      `);
    }

    // Datas padrão quando a própria situação não possui data específica.
    const situacoesComDataPropria = new Set([
      "ATRASADO","EMISSAO","COMBINADO","COMPETENCIA",
      "ACEITE","SEM_ACEITE","COMPETENCIA_EMISSAO"
    ]);

    if(!situacoesComDataPropria.has(codigo)){
      if(dataIni){
        params.push(dataIni);
        where.push(`ft.vencimento::date >= $${params.length}::date`);
      }
      if(dataFim){
        params.push(dataFim);
        where.push(`ft.vencimento::date <= $${params.length}::date`);
      }
    }

    const empList = Array.isArray(empresas) ? empresas.filter(Boolean) : [];

    if(empList.length){
      const start = params.length + 1;
      empList.forEach(e=>params.push(String(e).padStart(2,"0")));
      const ph = empList.map((_,i)=>`$${start+i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }else if(empresa){
      params.push(`%${String(empresa).trim()}%`);
      where.push(`
        (
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') ILIKE $${params.length}
          OR TRIM(COALESCE(ft.empresa::text,'')) ILIKE $${params.length}
        )
      `);
    }

    if(lado === "pagar" && fornecedor){
      params.push(`%${String(fornecedor).trim()}%`);
      where.push(`
        EXISTS(
          SELECT 1
          FROM pessoas px
          WHERE TRIM(COALESCE(px.codigo::text,''))=TRIM(COALESCE(ft.pessoa::text,''))
            AND COALESCE(
              NULLIF(TRIM(px.apelido::text),''),
              NULLIF(TRIM(px.nome::text),''),
              TRIM(COALESCE(ft.pessoa::text,''))
            ) ILIKE $${params.length}
        )
      `);
    }

    if(lado === "pagar" && plano){
      params.push(`%${String(plano).trim()}%`);
      where.push(`
        EXISTS(
          SELECT 1
          FROM financeiro_itens fix
          WHERE TRIM(COALESCE(fix.codigo::text,''))=TRIM(COALESCE(ft.item::text,''))
            AND COALESCE(
              NULLIF(TRIM(fix.descricao::text),''),
              TRIM(COALESCE(ft.item::text,''))
            ) ILIKE $${params.length}
        )
      `);
    }

    if(lado === "receber" && cliente){
      params.push(`%${String(cliente).trim()}%`);
      where.push(`
        EXISTS(
          SELECT 1
          FROM pessoas px
          WHERE TRIM(COALESCE(px.codigo::text,''))=TRIM(COALESCE(ft.pessoa::text,''))
            AND COALESCE(
              NULLIF(TRIM(px.nome::text),''),
              NULLIF(TRIM(px.apelido::text),''),
              TRIM(COALESCE(ft.pessoa::text,''))
            ) ILIKE $${params.length}
        )
      `);
    }

    if(lado === "receber" && formaPagamento){
      params.push(`%${String(formaPagamento).trim()}%`);
      where.push(`(${formaReceberCase("ft")} ILIKE $${params.length})`);
    }

    // Valor do gráfico: aberto usa saldo; baixado usa pago; demais usam valor nominal.
    let valorExpr = `COALESCE(ft.valor::numeric,0)`;

    if(codigo === "ABERTO" || codigo === "ATRASADO"){
      valorExpr = `
        GREATEST(
          COALESCE(ft.valor::numeric,0)
          - COALESCE(ft.valorpago::numeric,0)
          + COALESCE(ft.juros::numeric,0)
          + COALESCE(ft.multa::numeric,0)
          + COALESCE(ft.acrescimo::numeric,0)
          - COALESCE(ft.desconto::numeric,0),
          0
        )
      `;
    }

    if(codigo === "BAIXADO"){
      valorExpr = `COALESCE(NULLIF(ft.valorpago::numeric,0),ft.valor::numeric,0)`;
    }

    const sql = `
      SELECT
        COUNT(*)::int AS qtd,
        COALESCE(SUM(${valorExpr}),0)::numeric AS total
      FROM financeiro_titulos ft
      WHERE ${where.join(" AND ")}
    `;

    const r = await querySafe(sql,params,30000);
    const qtd = Number(r.rows?.[0]?.qtd || 0);
    const total = Number(r.rows?.[0]?.total || 0);

    // Só exibe situações que realmente existam na base.
    if(qtd > 0 || Math.abs(total) > 0){
      return {
        nome:label,
        codigo,
        qtd,
        total
      };
    }

    return null;
    })
  );

  saida.push(...resultados.filter(Boolean));

  const soma = saida.reduce((s,x)=>s+Math.abs(Number(x.total||0)),0);

  return saida
    .map(x=>({
      ...x,
      percentual:soma>0
        ? Math.abs(Number(x.total||0))/soma*100
        : 0
    }))
    .sort((a,b)=>Math.abs(b.total)-Math.abs(a.total));
}

async function montarFiltroSituacaoFinanceiraSeta({
  alias="ft",
  situacao="ABERTO",
  dataIni="",
  dataFim="",
  params=[]
}={}){
  const colunas = await obterColunasFinanceiroTitulos();
  const sit = String(situacao || "ABERTO").trim().toUpperCase();

  const addParam = valor => {
    params.push(valor);
    return `$${params.length}`;
  };

  const dataRange = coluna => {
    if(!coluna) return "";

    const partes = [];
    if(dataIni){
      const p = addParam(dataIni);
      partes.push(`${alias}.${coluna}::date >= ${p}::date`);
    }
    if(dataFim){
      const p = addParam(dataFim);
      partes.push(`${alias}.${coluna}::date <= ${p}::date`);
    }

    return partes.length ? `(${partes.join(" AND ")})` : "";
  };

  const emissao = primeiraColunaExistente(colunas,[
    "emissao","dataemissao","data_emissao","lancamento"
  ]);

  const competencia = primeiraColunaExistente(colunas,[
    "competencia","datacompetencia","data_competencia"
  ]);

  const combinado = primeiraColunaExistente(colunas,[
    "combinado","datacombinado","data_combinado",
    "combinada","data_combinada"
  ]);

  const aceite = primeiraColunaExistente(colunas,[
    "aceite","dataaceite","data_aceite"
  ]);

  const previsao = primeiraColunaExistente(colunas,[
    "previsao","previsto","previsaopagamento","previsao_pagamento",
    "previsao_pgto","previsaopgto","previsaopg","data_previsao",
    "dataprevisao"
  ]);

  const pendencia = primeiraColunaExistente(colunas,[
    "pendencia","pendente","existependencia","existe_pendencia",
    "possui_pendencia","tem_pendencia"
  ]);

  const scpc = primeiraColunaExistente(colunas,[
    "scpc","registradoscpc","registrado_scpc","enviado_scpc"
  ]);

  const cartorio = primeiraColunaExistente(colunas,[
    "cartorio","emcartorio","enviadocartorio","enviado_cartorio",
    "pagoemcartorio","pago_cartorio","data_cartorio","datacartorio"
  ]);

  const cobradora = primeiraColunaExistente(colunas,[
    "cobradora","enviadocobradora","enviado_cobradora"
  ]);

  const custodia = primeiraColunaExistente(colunas,[
    "custodia","chequecustodia","cheque_custodia"
  ]);

  const filtros = [];

  if(sit === "TODOS"){
    return { filtros, params, sit };
  }

  if(sit === "ABERTO"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'A'`);
    return { filtros, params, sit };
  }

  if(sit === "BAIXADO"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'B'`);
    return { filtros, params, sit };
  }

  if(sit === "CANCELADO"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'C'`);
    return { filtros, params, sit };
  }

  if(sit === "ATRASADO"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'A'`);
    filtros.push(`${alias}.vencimento::date < CURRENT_DATE`);
    const r = dataRange("vencimento");
    if(r) filtros.push(r);
    return { filtros, params, sit };
  }

  if(sit === "EMISSAO"){
    const r = dataRange(emissao);
    if(r) filtros.push(r);
    return { filtros, params, sit, colunaData:emissao };
  }

  if(sit === "COMBINADO"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'A'`);
    if(combinado){
      const r = dataRange(combinado);
      if(r) filtros.push(r);
    }else{
      filtros.push("1=0");
    }
    return { filtros, params, sit, colunaData:combinado };
  }

  if(sit === "COMPETENCIA"){
    if(competencia){
      const r = dataRange(competencia);
      if(r) filtros.push(r);
    }else{
      filtros.push("1=0");
    }
    return { filtros, params, sit, colunaData:competencia };
  }

  if(sit === "ACEITE"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'A'`);
    if(aceite){
      filtros.push(`${alias}.${aceite} IS NOT NULL`);
      const r = dataRange(aceite);
      if(r) filtros.push(r);
    }else{
      filtros.push("1=0");
    }
    return { filtros, params, sit, colunaData:aceite };
  }

  if(sit === "SEM_ACEITE"){
    filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'A'`);
    if(aceite){
      filtros.push(`${alias}.${aceite} IS NULL`);
    }
    const r = dataRange("vencimento");
    if(r) filtros.push(r);
    return { filtros, params, sit };
  }

  if(sit === "COMPETENCIA_EMISSAO"){
    const partes = [];
    const rComp = competencia ? dataRange(competencia) : "";
    const rEmi = emissao ? dataRange(emissao) : "";
    if(rComp) partes.push(rComp);
    if(rEmi) partes.push(rEmi);

    if(partes.length){
      filtros.push(`(${partes.join(" OR ")})`);
    }else{
      filtros.push("1=0");
    }

    return { filtros, params, sit };
  }

  const flags = {
    PREVISAO:previsao,
    PENDENCIA:pendencia,
    SCPC:scpc,
    CARTORIO:cartorio,
    COBRADORA:cobradora,
    CUSTODIA:custodia
  };

  if(Object.prototype.hasOwnProperty.call(flags,sit)){
    const coluna = flags[sit];

    if(coluna){
      filtros.push(exprFlagTitulo(alias,coluna));
    }else{
      filtros.push("1=0");
    }

    return { filtros, params, sit, colunaFlag:coluna };
  }

  // Substituído varia conforme a versão do Seta.
  // Primeiro procura coluna booleana específica.
  if(sit === "SUBSTITUIDO"){
    const substituido = primeiraColunaExistente(colunas,[
      "substituido","reparcelado","titulo_substituido"
    ]);

    if(substituido){
      filtros.push(exprFlagTitulo(alias,substituido));
    }else{
      // Não inventa código de status; sem campo conhecido, retorna vazio.
      filtros.push("1=0");
    }

    return { filtros, params, sit, colunaFlag:substituido };
  }

  filtros.push(`TRIM(COALESCE(${alias}.status::text,'')) = 'A'`);
  return { filtros, params, sit:"ABERTO" };
}

async function queryAtendimento(sql, params = [], ms = 180000) {
  let client = null;
  let erroClient = null;

  try {
    client = await poolAtendimento.connect();

    return await client.query({
      text: sql,
      values: params,
      query_timeout: Math.max(1000, Number(ms || 180000)),
    });

  } catch (e) {
    if(erroConexaoPostgres(e)){
      erroClient = e;
      console.error("[POSTGRES ATENDIMENTO] conexão perdida durante consulta:",e?.message || e);
    }

    throw e;

  } finally {
    liberarClientSeguro(client,erroClient);
  }
}
async function queryInventario(sql, params = [], ms = 180000) {
  let client = null;
  let erroClient = null;

  try {
    client = await poolInventario.connect();

    return await client.query({
      text: sql,
      values: params,
      query_timeout: Math.max(1000, Number(ms || 180000)),
    });

  } catch (e) {
    if(erroConexaoPostgres(e)){
      erroClient = e;
      console.error("[POSTGRES INVENTARIO] conexão perdida durante consulta:",e?.message || e);
    }

    throw e;

  } finally {
    liberarClientSeguro(client,erroClient);
  }
}


// ============================================================
// CONSOLIDAÇÃO GLOBAL DE EMPRESAS
// Um cadastro = uma empresa principal + empresas pertencentes.
// Nenhuma empresa fica fixa na programação.
// ============================================================

function normalizarEmpresaConsolidacao(valor){
  const digitos = String(valor ?? "").replace(/\D/g,"");
  if(!digitos) return "";
  return digitos.slice(-2).padStart(2,"0");
}

function usuarioPodeConfigurarConsolidacao(req){
  const grupo = String(req.usuarioSeta?.grupo || "")
    .trim()
    .padStart(2,"0");

  return grupo === "02";
}

function exigirAdministradorConsolidacao(req,res){
  if(usuarioPodeConfigurarConsolidacao(req)) return true;

  res.status(403).json({
    ok:false,
    erro:"Somente o grupo ADMINISTRADOR pode configurar a consolidação de empresas."
  });

  return false;
}

/*
 * Leitura global para TODOS os módulos.
 *
 * Retorna:
 * mapa = { "19":"03","23":"03","03":"03","33":"07","07":"07" }
 *
 * O módulo deve primeiro respeitar as empresas permitidas do usuário
 * e somente depois aplicar este mapa.
 */

async function carregarConsolidacaoEmpresasAtiva(){
  const r = await queryAtendimento(`
    SELECT
      c.id,
      c.codigo,
      c.descricao,
      c.empresa_principal,
      c.ativo,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'empresa',i.empresa,
            'ordem',i.ordem
          )
          ORDER BY i.ordem,i.empresa
        ) FILTER (
          WHERE i.id IS NOT NULL
            AND i.ativo=TRUE
        ),
        '[]'::json
      ) AS empresas
    FROM jp_empresas_consolidacao c
    LEFT JOIN jp_empresas_consolidacao_itens i
      ON i.consolidacao_id=c.id
    WHERE c.ativo=TRUE
    GROUP BY
      c.id,c.codigo,c.descricao,
      c.empresa_principal,c.ativo
    ORDER BY c.empresa_principal,c.codigo
  `,[],15000);

  const grupos=r.rows||[];
  const mapa={};
  const destinos={};
  const gruposPorPrincipal={};

  for(const grupo of grupos){
    const principal=normalizarEmpresaConsolidacao(grupo.empresa_principal);
    if(!principal) continue;

    const membros=[];

    for(const item of (Array.isArray(grupo.empresas)?grupo.empresas:[])){
      const empresa=normalizarEmpresaConsolidacao(item?.empresa);
      if(!empresa) continue;
      if(!membros.includes(empresa)) membros.push(empresa);
    }

    if(!membros.includes(principal)) membros.unshift(principal);

    destinos[principal]=membros;

    gruposPorPrincipal[principal]={
      id:Number(grupo.id||0),
      codigo:String(grupo.codigo||""),
      descricao:String(grupo.descricao||""),
      empresa_principal:principal,
      empresas:membros
    };

    for(const empresa of membros){
      mapa[empresa]=principal;
    }
  }

  return {
    grupos,
    mapa,
    destinos,
    gruposPorPrincipal
  };
}

function metaPeriodoConsolidar(lista,chave,metaMesConsolidada){
  const periodos=(lista||[])
    .map(x=>x?.periodos?.[chave])
    .filter(Boolean);

  const meta=periodos.reduce((s,p)=>s+Number(p.meta||0),0);
  const vendido=periodos.reduce((s,p)=>s+Number(p.vendido||0),0);
  const falta=Math.max(meta-vendido,0);

  return {
    meta,
    vendido,
    falta,
    peso:metaMesConsolidada>0 ? (meta/metaMesConsolidada)*100 : 0,
    percentual:meta>0 ? (vendido/meta)*100 : 0
  };
}

function consolidarLojasMetas(lojas,consolidacao,mapaNomeEmpresa){
  const buckets=new Map();

  for(const loja of lojas||[]){
    const origem=String(loja.empresa||"").padStart(2,"0");
    const principal=String(consolidacao.mapa?.[origem]||origem).padStart(2,"0");

    if(!buckets.has(principal)) buckets.set(principal,[]);
    buckets.get(principal).push(loja);
  }

  const saida=[];

  for(const [principal,membros] of buckets.entries()){
    if(membros.length===1 && String(membros[0].empresa||"")===principal){
      const unico={...membros[0]};
      const grupo=consolidacao.gruposPorPrincipal?.[principal];

      unico.consolidada=Boolean(grupo && (grupo.empresas||[]).length>1);
      unico.meta_configurada=Number(unico.meta_loja_valor||0)>0;
      unico.meta_vendedor_configurada=Number(unico.meta_vendedor_valor||0)>0;
      unico.empresas_origem=grupo?.empresas || [principal];
      unico.grupo_consolidacao=grupo || null;

      saida.push(unico);
      continue;
    }

    const grupo=consolidacao.gruposPorPrincipal?.[principal]||null;

    const soma=campo=>membros.reduce((s,x)=>s+Number(x?.[campo]||0),0);
    const metaMes=soma("meta_loja_valor");
    const vendido=soma("vendido_valor");
    const falta=Math.max(metaMes-vendido,0);

    const pHoje=metaPeriodoConsolidar(membros,"hoje",metaMes);
    const pSemana=metaPeriodoConsolidar(membros,"semana",metaMes);
    const pQuinzena=metaPeriodoConsolidar(membros,"quinzena",metaMes);
    const pMes={
      meta:metaMes,
      vendido,
      falta,
      peso:100,
      percentual:metaMes>0 ? vendido/metaMes*100 : 0
    };

    const pesoPassado=soma("meta_ate_hoje");
    const vendidoMes=vendido;
    const metaAteHoje=pesoPassado;
    const saldoHoje=vendidoMes-metaAteHoje;

    const projecao=soma("projecao_fechamento");
    const percentual=metaMes>0 ? vendido/metaMes*100 : 0;
    const percentualProjetado=metaMes>0 ? projecao/metaMes*100 : 0;

    saida.push({
      ...membros[0],

      empresa:principal,
      nome_empresa:
        mapaNomeEmpresa.get(principal) ||
        grupo?.descricao ||
        membros[0]?.nome_empresa ||
        principal,

      consolidada:true,
      empresas_origem:[
        ...new Set(
          membros.map(x=>String(x.empresa||"").padStart(2,"0"))
        )
      ],
      grupo_consolidacao:grupo,

      meta_loja_valor:metaMes,
      meta_vendedor_valor:soma("meta_vendedor_valor"),
      meta_configurada:metaMes>0,
      meta_vendedor_configurada:soma("meta_vendedor_valor")>0,

      vendido_valor:vendido,
      vendido_hoje:pHoje.vendido,
      vendido_semana:pSemana.vendido,
      vendido_quinzena:pQuinzena.vendido,

      falta_valor:falta,
      percentual,
      percentual_projetado:percentualProjetado,

      peso_hoje:pHoje.peso,
      peso_semana_atual:pSemana.peso,
      peso_quinzena_atual:pQuinzena.peso,

      meta_hoje:pHoje.meta,
      meta_hoje_ajustada:pHoje.meta,
      falta_hoje:pHoje.falta,

      meta_semana_atual:pSemana.meta,
      falta_semana_atual:pSemana.falta,
      percentual_semana_atual:pSemana.percentual,

      meta_quinzena_atual:pQuinzena.meta,
      falta_quinzena_atual:pQuinzena.falta,

      meta_ate_hoje:metaAteHoje,
      saldo_hoje:saldoHoje,

      media_diaria:soma("media_diaria"),
      meta_diaria_base:soma("meta_diaria_base"),
      meta_diaria_necessaria:soma("meta_diaria_necessaria"),

      projecao_fechamento:projecao,

      comissao_atual:soma("comissao_atual"),
      comissao_projetada:soma("comissao_projetada"),
      qtd_vendas:soma("qtd_vendas"),

      dias_decorridos:Math.max(...membros.map(x=>Number(x.dias_decorridos||0)),0),
      dias_restantes:Math.max(...membros.map(x=>Number(x.dias_restantes||0)),0),
      dias_uteis:Math.max(...membros.map(x=>Number(x.dias_uteis||0)),0),

      peso_passado:metaMes>0 ? (metaAteHoje/metaMes)*100 : 0,
      peso_real:metaMes>0 ? (vendido/metaMes)*100 : 0,
      peso_diferenca:
        metaMes>0
          ? ((vendido-metaAteHoje)/metaMes)*100
          : 0,
      peso_restante:Math.max(100-(metaMes>0?(vendido/metaMes)*100:0),0),

      periodos:{
        hoje:pHoje,
        semana:pSemana,
        quinzena:pQuinzena,
        mes:pMes
      },

      tendencia:
        percentualProjetado>=100 ? "VAI BATER"
        : percentualProjetado>=90 ? "RISCO"
        : "NAO BATE",

      status:
        percentualProjetado>=100 ? "VERDE"
        : percentualProjetado>=90 ? "AMARELO"
        : "VERMELHO"
    });
  }

  return saida.sort((a,b)=>
    String(a.empresa||"").localeCompare(
      String(b.empresa||""),
      "pt-BR",
      {numeric:true}
    )
  );
}

function consolidarVendedoresMetas(vendedores,consolidacao,mapaNomeEmpresa){
  return (vendedores||[]).map(v=>{
    const origem=String(v.empresa||"").padStart(2,"0");
    const principal=String(consolidacao.mapa?.[origem]||origem).padStart(2,"0");
    const grupo=consolidacao.gruposPorPrincipal?.[principal]||null;

    return {
      ...v,
      empresa_origem:origem,
      empresa:principal,
      nome_empresa:
        mapaNomeEmpresa.get(principal) ||
        grupo?.descricao ||
        v.nome_empresa ||
        principal,
      consolidada:Boolean(grupo && (grupo.empresas||[]).length>1),
      grupo_consolidacao:grupo
    };
  });
}

app.get("/api/empresas-consolidacao/ativa", async (req,res)=>{
  try{
    const r = await queryAtendimento(`
      SELECT
        c.id,
        c.codigo,
        c.descricao,
        c.empresa_principal,
        c.ativo,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'empresa',i.empresa,
              'ordem',i.ordem
            )
            ORDER BY i.ordem,i.empresa
          ) FILTER (
            WHERE i.id IS NOT NULL
              AND i.ativo=TRUE
          ),
          '[]'::json
        ) AS empresas
      FROM jp_empresas_consolidacao c
      LEFT JOIN jp_empresas_consolidacao_itens i
        ON i.consolidacao_id=c.id
      WHERE c.ativo=TRUE
      GROUP BY
        c.id,
        c.codigo,
        c.descricao,
        c.empresa_principal,
        c.ativo
      ORDER BY c.empresa_principal,c.codigo
    `,[],15000);

    const grupos = r.rows || [];
    const mapa = {};
    const destinos = {};

    for(const grupo of grupos){
      const principal =
        normalizarEmpresaConsolidacao(grupo.empresa_principal);

      if(!principal) continue;

      destinos[principal] = [];

      const membros = Array.isArray(grupo.empresas)
        ? grupo.empresas
        : [];

      for(const item of membros){
        const empresa =
          normalizarEmpresaConsolidacao(item.empresa);

        if(!empresa) continue;

        mapa[empresa] = principal;

        if(!destinos[principal].includes(empresa)){
          destinos[principal].push(empresa);
        }
      }

      /*
       * A principal sempre pertence ao próprio grupo,
       * mesmo que o cadastro antigo esteja incompleto.
       */
      mapa[principal] = principal;

      if(!destinos[principal].includes(principal)){
        destinos[principal].unshift(principal);
      }
    }

    res.json({
      ok:true,
      grupos,
      mapa,
      destinos
    });

  }catch(e){
    console.error("Erro /api/empresas-consolidacao/ativa:",e);
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});

/*
 * Empresas disponíveis no ERP Seta.
 */
app.get("/api/config/empresas-consolidacao/empresas", async (req,res)=>{
  if(!exigirAdministradorConsolidacao(req,res)) return;

  try{
    const r = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
        TRIM(
          COALESCE(
            NULLIF(apelido::text,''),
            NULLIF(nome::text,''),
            codigo::text
          )
        ) AS nome
      FROM pessoas
      WHERE status='S'
        AND filial='T'
      ORDER BY 1
    `,[],60000);

    res.json({
      ok:true,
      empresas:r.rows || []
    });

  }catch(e){
    console.error("Erro empresas consolidação:",e);
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});

/*
 * Lista todos os grupos de consolidação.
 */
app.get("/api/config/empresas-consolidacao", async (req,res)=>{
  if(!exigirAdministradorConsolidacao(req,res)) return;

  try{
    const r = await queryAtendimento(`
      SELECT
        c.id,
        c.codigo,
        c.descricao,
        c.empresa_principal,
        c.ativo,
        c.criado_em,
        c.atualizado_em,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id',i.id,
              'empresa',i.empresa,
              'ordem',i.ordem,
              'ativo',i.ativo
            )
            ORDER BY i.ordem,i.empresa
          ) FILTER (
            WHERE i.id IS NOT NULL
          ),
          '[]'::json
        ) AS empresas
      FROM jp_empresas_consolidacao c
      LEFT JOIN jp_empresas_consolidacao_itens i
        ON i.consolidacao_id=c.id
      GROUP BY
        c.id,
        c.codigo,
        c.descricao,
        c.empresa_principal,
        c.ativo,
        c.criado_em,
        c.atualizado_em
      ORDER BY
        c.ativo DESC,
        c.empresa_principal,
        c.descricao,
        c.codigo
    `,[],15000);

    res.json({
      ok:true,
      consolidacoes:r.rows || []
    });

  }catch(e){
    console.error("Erro listar consolidações:",e);
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});

/*
 * Cria ou atualiza um grupo:
 * empresa_principal = empresa que representará o consolidado
 * empresas = ["03","19","23"]
 */
app.post("/api/config/empresas-consolidacao", async (req,res)=>{
  if(!exigirAdministradorConsolidacao(req,res)) return;

  const id = Number(req.body?.id || 0);

  const codigo = String(req.body?.codigo || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g,"_")
    .slice(0,30);

  const descricao = String(req.body?.descricao || "")
    .trim()
    .slice(0,100);

  const empresaPrincipal =
    normalizarEmpresaConsolidacao(
      req.body?.empresa_principal
    );

  const ativo = req.body?.ativo !== false;

  const empresasRecebidas = Array.isArray(req.body?.empresas)
    ? req.body.empresas
    : [];

  if(!codigo){
    return res.status(400).json({
      ok:false,
      erro:"Informe o código do grupo."
    });
  }

  if(!descricao){
    return res.status(400).json({
      ok:false,
      erro:"Informe a descrição do grupo."
    });
  }

  if(!empresaPrincipal){
    return res.status(400).json({
      ok:false,
      erro:"Escolha a empresa principal."
    });
  }

  const empresas = [];
  const usadas = new Set();

  /*
   * A empresa principal é membro obrigatório do grupo.
   */
  const lista = [empresaPrincipal,...empresasRecebidas];

  for(const valor of lista){
    const empresa = normalizarEmpresaConsolidacao(valor);
    if(!empresa || usadas.has(empresa)) continue;

    usadas.add(empresa);
    empresas.push(empresa);
  }

  const client = await poolAtendimento.connect();

  try{
    await client.query("BEGIN");

    /*
     * Uma empresa não pode pertencer a dois grupos diferentes.
     * Ao editar o próprio grupo, seus itens atuais são ignorados.
     */
    const conflito = await client.query(`
      SELECT
        i.empresa,
        c.codigo,
        c.descricao
      FROM jp_empresas_consolidacao_itens i
      JOIN jp_empresas_consolidacao c
        ON c.id=i.consolidacao_id
      WHERE i.empresa = ANY($1::varchar[])
        AND ($2::bigint=0 OR c.id<>$2::bigint)
      LIMIT 1
    `,[empresas,id || 0]);

    if(conflito.rows.length){
      const c = conflito.rows[0];

      await client.query("ROLLBACK");

      return res.status(409).json({
        ok:false,
        erro:
          `A empresa ${c.empresa} já pertence ao grupo ` +
          `${c.codigo} - ${c.descricao}.`
      });
    }

    let consolidacaoId = id;

    if(consolidacaoId){
      const rAtualiza = await client.query(`
        UPDATE jp_empresas_consolidacao
        SET
          codigo=$1,
          descricao=$2,
          empresa_principal=$3,
          ativo=$4,
          atualizado_em=NOW()
        WHERE id=$5
        RETURNING id
      `,[
        codigo,
        descricao,
        empresaPrincipal,
        ativo,
        consolidacaoId
      ]);

      if(!rAtualiza.rows.length){
        await client.query("ROLLBACK");

        return res.status(404).json({
          ok:false,
          erro:"Grupo de consolidação não encontrado."
        });
      }

    }else{
      const rNovo = await client.query(`
        INSERT INTO jp_empresas_consolidacao
        (
          codigo,
          descricao,
          empresa_principal,
          ativo
        )
        VALUES($1,$2,$3,$4)
        RETURNING id
      `,[
        codigo,
        descricao,
        empresaPrincipal,
        ativo
      ]);

      consolidacaoId = Number(rNovo.rows[0].id);
    }

    await client.query(`
      DELETE FROM jp_empresas_consolidacao_itens
      WHERE consolidacao_id=$1
    `,[consolidacaoId]);

    for(let pos=0;pos<empresas.length;pos++){
      await client.query(`
        INSERT INTO jp_empresas_consolidacao_itens
        (
          consolidacao_id,
          empresa,
          ordem,
          ativo
        )
        VALUES($1,$2,$3,TRUE)
      `,[
        consolidacaoId,
        empresas[pos],
        pos+1
      ]);
    }

    await client.query("COMMIT");

    res.json({
      ok:true,
      id:consolidacaoId,
      mensagem:id
        ? "Grupo de consolidação atualizado com sucesso."
        : "Grupo de consolidação cadastrado com sucesso."
    });

  }catch(e){
    try{
      await client.query("ROLLBACK");
    }catch(_){}

    console.error("Erro salvar grupo de consolidação:",e);

    const duplicado =
      String(e.code || "") === "23505";

    res.status(duplicado ? 409 : 500).json({
      ok:false,
      erro:duplicado
        ? "Código já utilizado ou empresa já pertencente a outro grupo."
        : e.message
    });

  }finally{
    client.release();
  }
});

app.delete("/api/config/empresas-consolidacao/:id", async (req,res)=>{
  if(!exigirAdministradorConsolidacao(req,res)) return;

  const id = Number(req.params.id || 0);

  if(!id){
    return res.status(400).json({
      ok:false,
      erro:"Identificador inválido."
    });
  }

  try{
    const r = await queryAtendimento(`
      DELETE FROM jp_empresas_consolidacao
      WHERE id=$1
      RETURNING id
    `,[id],15000);

    if(!r.rows.length){
      return res.status(404).json({
        ok:false,
        erro:"Grupo de consolidação não encontrado."
      });
    }

    res.json({
      ok:true,
      mensagem:"Grupo de consolidação excluído com sucesso."
    });

  }catch(e){
    console.error("Erro excluir grupo de consolidação:",e);
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});

// ============================
// MOTOR ANALÍTICO OTB-BI
// Cache local: não grava nas tabelas do Seta.
//
// POLÍTICA OTB:
// - histórico antigo permanece consolidado no cache;
// - somente a janela recente é refeita;
// - atualização normal acontece 1 vez ao dia;
// - consultas dos usuários leem somente o PostgreSQL local.
// ============================
const OTB_CACHE_DIAS_RECENTES = Math.max(
  30,
  Number(process.env.OTB_CACHE_DIAS_RECENTES || 92)
);

const OTB_CACHE_ATUALIZACAO_MINUTOS = Math.max(
  60,
  Number(process.env.OTB_CACHE_ATUALIZACAO_MINUTOS || 1440)
);

// Compatibilidade com o otb_engine já existente.
process.env.OTB_CACHE_INCREMENTAL_DAYS =
  String(OTB_CACHE_DIAS_RECENTES);

process.env.OTB_CACHE_UPDATE_MINUTES =
  String(OTB_CACHE_ATUALIZACAO_MINUTOS);

// Snapshots que não precisam rodar várias vezes durante o dia.
process.env.OTB_CACHE_ESTOQUE_MINUTES =
  String(OTB_CACHE_ATUALIZACAO_MINUTOS);

process.env.OTB_CACHE_DIM_MINUTES =
  String(OTB_CACHE_ATUALIZACAO_MINUTOS);

process.env.OTB_CACHE_PROMO_MINUTES =
  String(OTB_CACHE_ATUALIZACAO_MINUTOS);

console.log(
  `[OTB CACHE] Política: últimos ${OTB_CACHE_DIAS_RECENTES} dias ` +
  `recalculados a cada ${OTB_CACHE_ATUALIZACAO_MINUTOS} min.`
);

const { criarOTBEngine } = require("./otb_engine");

const otbEngine = criarOTBEngine({
  sourcePool: pool,
  cachePool: poolAtendimento
});

app.get("/api/otb-bi/cache/status", async (req,res)=>{
  try{
    const status = await otbEngine.status();
    res.json({ok:true,status});
  }catch(e){
    res.status(500).json({ok:false,erro:e.message});
  }
});


// ============================================================
// CENTRO GLOBAL DE ATUALIZAÇÃO DO BANCO ANALÍTICO
// ------------------------------------------------------------
// Dimensões = cadastros leves.
// Fatos     = movimentos pesados.
//
// Esta API não fica amarrada à tela OTB. Ela é o ponto central
// para todos os módulos com cache analítico.
// ============================================================

function exigirAdministradorAtualizacaoGlobal(req,res){
  const grupo = String(req.usuarioSeta?.grupo || "")
    .trim()
    .padStart(2,"0");

  if(grupo === "02"){
    return true;
  }

  res.status(403).json({
    ok:false,
    erro:"Somente o grupo ADMINISTRADOR pode executar atualizações globais."
  });

  return false;
}

/*
 * Registro de provedores analíticos.
 * Hoje o OTB já possui cache próprio.
 * Outros módulos podem ser acrescentados aqui sem mudar o JPDESK.
 */
const atualizadoresAnaliticosGlobais = [
  {
    codigo:"OTB",
    nome:"Motor Analítico OTB",
    async dimensoes(){
      return await otbEngine.atualizarDimensoesAgora();
    },
    async fatos(periodo){
      return await otbEngine.atualizarFatosAgora({periodo});
    },
    async status(){
      return await otbEngine.status();
    }
  }
];

let atualizacaoGlobalEmAndamento = null;

app.get("/api/sistema/banco-analitico/status", async (req,res)=>{
  if(!exigirAdministradorAtualizacaoGlobal(req,res)) return;

  try{
    const provedores = [];

    for(const provedor of atualizadoresAnaliticosGlobais){
      let st = null;

      try{
        st = await provedor.status();
      }catch(e){
        st = {erro:e.message};
      }

      provedores.push({
        codigo:provedor.codigo,
        nome:provedor.nome,
        status:st
      });
    }

    res.json({
      ok:true,
      executando:Boolean(atualizacaoGlobalEmAndamento),
      atualizacao:atualizacaoGlobalEmAndamento,
      politica:{
        janela_fatos_dias:OTB_CACHE_DIAS_RECENTES,
        atualizacao_automatica_minutos:OTB_CACHE_ATUALIZACAO_MINUTOS
      },
      provedores
    });

  }catch(e){
    res.status(500).json({ok:false,erro:e.message});
  }
});

app.post("/api/sistema/banco-analitico/dimensoes", async (req,res)=>{
  if(!exigirAdministradorAtualizacaoGlobal(req,res)) return;

  if(atualizacaoGlobalEmAndamento){
    return res.status(409).json({
      ok:false,
      erro:"Já existe uma atualização global em andamento.",
      atualizacao:atualizacaoGlobalEmAndamento
    });
  }

  const inicio = new Date().toISOString();

  atualizacaoGlobalEmAndamento = {
    tipo:"dimensoes",
    inicio,
    descricao:"Cadastros / Dimensões"
  };

  res.json({
    ok:true,
    iniciado:true,
    tipo:"dimensoes",
    mensagem:"Atualização de Cadastros / Dimensões iniciada."
  });

  (async ()=>{
    try{
      for(const provedor of atualizadoresAnaliticosGlobais){
        await provedor.dimensoes();
      }
    }catch(e){
      console.error(
        "[BANCO ANALÍTICO] Erro na atualização de dimensões:",
        e.message
      );
    }finally{
      atualizacaoGlobalEmAndamento = null;
    }
  })();
});

app.post("/api/sistema/banco-analitico/fatos", async (req,res)=>{
  if(!exigirAdministradorAtualizacaoGlobal(req,res)) return;

  if(atualizacaoGlobalEmAndamento){
    return res.status(409).json({
      ok:false,
      erro:"Já existe uma atualização global em andamento.",
      atualizacao:atualizacaoGlobalEmAndamento
    });
  }

  const permitidos = new Set(["recente","12m","completo"]);
  const periodo = permitidos.has(String(req.body?.periodo || ""))
    ? String(req.body.periodo)
    : "recente";

  const inicio = new Date().toISOString();

  atualizacaoGlobalEmAndamento = {
    tipo:"fatos",
    periodo,
    inicio,
    descricao:"Movimentos / Fatos"
  };

  res.json({
    ok:true,
    iniciado:true,
    tipo:"fatos",
    periodo,
    mensagem:"Atualização de Movimentos / Fatos iniciada."
  });

  (async ()=>{
    try{
      for(const provedor of atualizadoresAnaliticosGlobais){
        await provedor.fatos(periodo);
      }
    }catch(e){
      console.error(
        "[BANCO ANALÍTICO] Erro na atualização de fatos:",
        e.message
      );
    }finally{
      atualizacaoGlobalEmAndamento = null;
    }
  })();
});

app.post("/api/otb-bi/cache/atualizar", async (req,res)=>{
  try{
    const grupo = String(req.usuarioSeta?.grupo || "").trim().padStart(2,"0");

    if(grupo !== "02"){
      return res.status(403).json({
        ok:false,
        erro:"Somente o grupo ADMINISTRADOR pode forçar a atualização do Motor OTB."
      });
    }

    const completa = req.body?.completa === true;

    // Responde imediatamente; a atualização continua em segundo plano.
    otbEngine.atualizar({completa})
      .catch(e => console.error("[OTB CACHE] Atualização manual:",e.message));

    res.json({
      ok:true,
      iniciado:true,
      completa
    });

  }catch(e){
    res.status(500).json({ok:false,erro:e.message});
  }
});


// ============================
// HELPERS
// ============================
function parseTam(raw) {
  const t = String(raw || "").trim();
  if (!t) return "";
  return t.padStart(2, "0");
}
function codificarSenhaSeta(senha) {
  const mapa = {
    "0": "V",
    "1": "W",
    "2": "E",
    "3": "y",
    "4": "t",
    "5": "U",
    "6": "e",
    "7": "r",
    "8": "q",
    "9": "p"
  };

  return String(senha || "")
    .trim()
    .split("")
    .map(ch => mapa[ch] || ch)
    .join("");
}
function parseNumBR(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const cleaned = s
    .replace(/\s/g, "")
    .replace("R$", "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function clampInt(n, min, max, fallback) {
  const v = parseInt(String(n ?? ""), 10);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function parseEmpresaTokens(raw) {
  return String(raw || "")
    .split(/[;,]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}
function parseMultiTokens(raw) {
  return String(raw || "")
    .split(/[;,]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function resolveCodigosGenericos({
  raw,
  tabela,
  colunaCodigo = "codigo",
  colunaDescricao = "descricao",
  padLen = null,
}) {
  const tokens = parseMultiTokens(raw);
  if (!tokens.length) return [];

  const codigos = new Set();

  for (const token of tokens) {
    const direto = normalizeCodeToken(token, padLen);
    if (direto) {
      codigos.add(direto);
      continue;
    }

    const sql = `
      SELECT TRIM(${colunaCodigo}::text) AS codigo
      FROM ${tabela}
      WHERE COALESCE(TRIM(${colunaDescricao}::text), '') ILIKE $1
      ORDER BY TRIM(${colunaDescricao}::text), TRIM(${colunaCodigo}::text)
    `;
    const r = await querySafe(sql, [`%${token}%`], 30000);

    for (const row of r.rows || []) {
      const codigo = String(row?.codigo || "").trim();
      if (codigo) codigos.add(padLen ? codigo.padStart(padLen, "0") : codigo);
    }
  }

  return Array.from(codigos).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function normalizeCodeToken(raw, len = null) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const mInicio = s.match(/^(\d+)\s*-/);
  const base = mInicio ? mInicio[1] : s;
  const digits = base.replace(/\D/g, "");
  if (!digits) return "";
  return len ? digits.padStart(len, "0") : digits;
}

function getClosedMonthLabels() {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
  });

  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const arr = [];

  for (let back = 12; back >= 1; back--) {
    const d = new Date(
      firstDayThisMonth.getFullYear(),
      firstDayThisMonth.getMonth() - back,
      1
    );
    arr.push(fmt.format(d));
  }

  return arr;
}

function sumMovExpr(alias = "m") {
  return `
    CASE
      WHEN TRIM(${alias}.movimento::text) = 'E' THEN COALESCE(${alias}.quantidade::numeric,0)
      WHEN TRIM(${alias}.movimento::text) = 'S' THEN -COALESCE(${alias}.quantidade::numeric,0)
      ELSE 0
    END
  `;
}

function fornecedorNomeExpr(aliasPe = "pe") {
  return `
    TRIM(
      COALESCE(
        NULLIF(${aliasPe}.nome::text, ''),
        NULLIF(${aliasPe}.apelido::text, ''),
        ''
      )
    )
  `;
}

async function resolveEmpresasFiltro(raw) {
  const tokens = parseEmpresaTokens(raw);
  if (!tokens.length) return [];

  const codigos = new Set();
  const nomes = [];

  for (const tokenBruto of tokens) {
    const token = String(tokenBruto || "").trim();
    if (!token) continue;

    const mInicio = token.match(/^(\d{1,2})\s*-/);
    if (mInicio) {
      codigos.add(mInicio[1].padStart(2, "0"));
      continue;
    }

    if (/^\d{1,2}$/.test(token)) {
      codigos.add(token.padStart(2, "0"));
      continue;
    }

    const mQualquer = token.match(/\b(\d{1,2})\b/);
    if (mQualquer && token.length <= 8) {
      codigos.add(mQualquer[1].padStart(2, "0"));
      continue;
    }

    nomes.push(token);
  }

  if (nomes.length) {
    const params = [];
    const conds = nomes.map((nome) => {
      params.push(`%${nome}%`);
      return `
        (
          COALESCE(TRIM(apelido), '') ILIKE $${params.length}
          OR COALESCE(TRIM(nome), '') ILIKE $${params.length}
        )
      `;
    });

    const sql = `
      SELECT DISTINCT LPAD(RIGHT(TRIM(codigo), 2), 2, '0') AS codigo
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
        AND (${conds.join(" OR ")})
      ORDER BY 1
    `;

    const r = await querySafe(sql, params, 60000);
    for (const row of r.rows || []) {
      if (row?.codigo) codigos.add(String(row.codigo).padStart(2, "0"));
    }
  }

  return Array.from(codigos).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
app.get("/api/dashboard/resumo", async (req, res) => {
  try {
    const { empresa = "", dataIni = "", dataFim = "" } = req.query;

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const params = [];
    const where = [];

    if (dataIni) {
      params.push(dataIni);
      where.push(`v.data::date >= $${params.length}`);
    } else {
      where.push(`v.data::date >= CURRENT_DATE`);
    }

    if (dataFim) {
      params.push(dataFim);
      where.push(`v.data::date <= $${params.length}`);
    } else {
      where.push(`v.data::date <= CURRENT_DATE`);
    }

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(v.empresa::text),2,'0') IN (${ph})`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const sqlResumo = `
      SELECT
        COALESCE(SUM(COALESCE(v.total::numeric,0)),0) AS faturamento,
        COUNT(*) AS qtd_vendas,
        COALESCE(AVG(COALESCE(v.total::numeric,0)),0) AS ticket_medio
      FROM vendas v
      ${whereSql}
    `;

    const sqlDias = `
      SELECT
        v.data::date AS data,
        COALESCE(SUM(COALESCE(v.total::numeric,0)),0) AS total
      FROM vendas v
      ${whereSql}
      GROUP BY v.data::date
      ORDER BY v.data::date
    `;

    const sqlLojas = `
      SELECT
        LPAD(TRIM(v.empresa::text),2,'0') AS empresa,
        COALESCE(SUM(COALESCE(v.total::numeric,0)),0) AS total
      FROM vendas v
      ${whereSql}
      GROUP BY LPAD(TRIM(v.empresa::text),2,'0')
      ORDER BY total DESC
      LIMIT 15
    `;

    const [rResumo, rDias, rLojas] = await Promise.all([
      querySafe(sqlResumo, params, 90000),
      querySafe(sqlDias, params, 90000),
      querySafe(sqlLojas, params, 90000)
    ]);

    res.json({
      ok: true,
      resumo: rResumo.rows[0] || {},
      dias: rDias.rows || [],
      lojas: rLojas.rows || []
    });

  } catch (e) {
    console.error("Erro /api/dashboard/resumo:", e.message);
    res.status(500).json({ ok:false, erro: e.message });
  }
});

async function resolveCodigoGenerico({
  raw,
  tabela,
  colunaCodigo = "codigo",
  colunaDescricao = "descricao",
  padLen = null,
}) {
  const valor = String(raw || "").trim();
  if (!valor) return "";

  const direto = normalizeCodeToken(valor, padLen);
  if (direto) return direto;

  const sql = `
    SELECT TRIM(${colunaCodigo}::text) AS codigo
    FROM ${tabela}
    WHERE COALESCE(TRIM(${colunaDescricao}::text), '') ILIKE $1
    ORDER BY TRIM(${colunaDescricao}::text), TRIM(${colunaCodigo}::text)
    LIMIT 1
  `;
  const r = await querySafe(sql, [`%${valor}%`], 30000);
  const codigo = String(r.rows?.[0]?.codigo || "").trim();
  if (!codigo) return "";
  return padLen ? codigo.padStart(padLen, "0") : codigo;
}

async function resolveDepartamentoCodigos(raw) {
  const tokens = parseMultiTokens(raw);
  if (!tokens.length) return [];

  const codigos = new Set();

  for (const tokenOriginal of tokens) {
    const token = String(tokenOriginal || "").trim();
    if (!token) continue;

    // Quando o usuário escolhe no datalist, por exemplo:
    // 000146 - CAL FEM INF
    const codigoDireto = normalizeCodeToken(token);
    if (codigoDireto) {
      codigos.add(codigoDireto);
      continue;
    }

    // Pesquisa cada palavra separadamente.
    // Exemplo: "CAL I" encontra "CAL FEM INF" e "CAL MAS INF".
    const palavras = token
      .toUpperCase()
      .split(/\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (!palavras.length) continue;

    const params = palavras.map(p => `%${p}%`);
    const condicoes = palavras.map((_, i) =>
      `COALESCE(TRIM(descricao::text), '') ILIKE $${i + 1}`
    );

    const r = await querySafe(`
      SELECT TRIM(codigo::text) AS codigo
      FROM departamentos
      WHERE ${condicoes.join(" AND ")}
      ORDER BY TRIM(descricao::text), TRIM(codigo::text)
    `, params, 30000);

    for (const row of r.rows || []) {
      const codigo = String(row?.codigo || "").trim();
      if (codigo) codigos.add(codigo);
    }
  }

  return Array.from(codigos).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

async function resolveGrupoCodigos(raw) {
  return await resolveCodigosGenericos({
    raw,
    tabela: "grupos",
    colunaCodigo: "codigo",
    colunaDescricao: "descricao",
  });
}

async function resolveMarcaCodigos(raw) {
  return await resolveCodigosGenericos({
    raw,
    tabela: "marcas",
    colunaCodigo: "codigo",
    colunaDescricao: "descricao",
  });
}
async function resolveColecaoCodigos(raw) {
  return await resolveCodigosGenericos({
    raw,
    tabela: "colecoes",
    colunaCodigo: "codigo",
    colunaDescricao: "descricao",
  });
}
async function resolveFornecedorCodigos(raw) {
  const tokens = parseMultiTokens(raw);
  if (!tokens.length) return [];

  const codigos = new Set();

  for (const token of tokens) {
    const direto = normalizeCodeToken(token, 6);
    if (direto) {
      codigos.add(direto);
      continue;
    }

    const sql = `
      SELECT DISTINCT codigo
      FROM (
        SELECT
          TRIM(p.fornecedor::text) AS codigo,
          ${fornecedorNomeExpr("pe")} AS nome
        FROM produtos p
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = TRIM(p.fornecedor::text)
        WHERE COALESCE(TRIM(p.fornecedor::text), '') <> ''

        UNION

        SELECT
          TRIM(pf.fornecedor::text) AS codigo,
          ${fornecedorNomeExpr("pe")} AS nome
        FROM produtos_fornecedor pf
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = TRIM(pf.fornecedor::text)
        WHERE COALESCE(TRIM(pf.fornecedor::text), '') <> ''
      ) x
      WHERE
        codigo ILIKE $1
        OR COALESCE(nome, '') ILIKE $1
      ORDER BY codigo
    `;

    const r = await querySafe(sql, [`%${token}%`], 30000);
    for (const row of r.rows || []) {
      const codigo = String(row?.codigo || "").trim();
      if (codigo) codigos.add(codigo);
    }
  }

  return Array.from(codigos).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// ============================
// HEALTH
// ============================
app.get("/health/db", async (req, res) => {
  try {
    const r = await querySafe("select now() as agora", [], 15000);
    res.json({ ok: true, agora: r.rows?.[0]?.agora ?? null });
  } catch (e) {
    res.status(500).json({ ok: false, erro: e.message });
  }
});
// ======================================================
// VALIDAR SENHA DO CUSTO
// ======================================================
function senhaCustoOk(senha) {
  return !!CAT_CUSTO_PASS && String(senha || "").trim() === CAT_CUSTO_PASS;
}

app.get("/validar-senha-custo", (req, res) => {
  const senha = String(req.query.senha || "").trim();

  if (!CAT_CUSTO_PASS) {
    return res.status(500).json({
      ok: false,
      erro: "Senha de custo não configurada no servidor."
    });
  }

  if (!senhaCustoOk(senha)) {
    res.clearCookie("CAT_CUSTO_OK");
    return res.status(403).json({
      ok: false,
      erro: "Senha incorreta."
    });
  }

  res.cookie("CAT_CUSTO_OK", "1", {
    maxAge: 1000 * 60 * 60 * 8,
    sameSite: "lax"
  });

  return res.json({ ok: true });
});
// ======================================================
// METAS COMERCIAIS
// Banco metas: atendimento/postgres
// Vendas e lojas: SETA
// ======================================================
function metasISODataLocal(dt){
  const a = dt.getFullYear();
  const m = String(dt.getMonth()+1).padStart(2,"0");
  const d = String(dt.getDate()).padStart(2,"0");
  return `${a}-${m}-${d}`;
}

function metasDataBR(iso){
  const s=String(iso||"");
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}` : s;
}
function metasNomeMes(mes){
  return ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][Number(mes)||0]||"";
}

function metasInfoReferencia(ano,mes){
  const hoje = new Date();
  const chaveSel = ano*12+mes;
  const chaveHoje = hoje.getFullYear()*12+(hoje.getMonth()+1);
  const ultimo = new Date(ano,mes,0).getDate();

  let referencia;
  let corteConsolidado;

  if(chaveSel < chaveHoje){
    referencia = new Date(ano,mes-1,ultimo);
    corteConsolidado = new Date(ano,mes-1,ultimo);
  }else if(chaveSel > chaveHoje){
    referencia = new Date(ano,mes-1,1);
    corteConsolidado = new Date(ano,mes-1,0); // antes do mês
  }else{
    referencia = new Date(ano,mes-1,hoje.getDate());
    corteConsolidado = new Date(referencia);
    corteConsolidado.setDate(corteConsolidado.getDate()-1); // congela a meta de hoje
  }

  const diaSemana = referencia.getDay();
  const voltar = diaSemana===0 ? 6 : diaSemana-1;
  const semanaIni = new Date(referencia);
  semanaIni.setDate(referencia.getDate()-voltar);
  const semanaFim = new Date(semanaIni);
  semanaFim.setDate(semanaIni.getDate()+6);

  const diaRef = referencia.getDate();
  const quinzenaIni = new Date(ano,mes-1,diaRef<=15?1:16);
  const quinzenaFim = new Date(ano,mes-1,diaRef<=15?15:ultimo);

  return {
    referencia,
    referenciaISO:metasISODataLocal(referencia),
    corteConsolidado,
    corteISO:metasISODataLocal(corteConsolidado),
    semanaIniISO:metasISODataLocal(semanaIni),
    semanaFimISO:metasISODataLocal(semanaFim),
    quinzenaIniISO:metasISODataLocal(quinzenaIni),
    quinzenaFimISO:metasISODataLocal(quinzenaFim)
  };
}

async function calcularCalendariosInteligentesMeta(ano,mes,empList){
  const empresas=(empList||[]).map(x=>String(x).padStart(2,"0")).filter(Boolean);
  const mapas=new Map();
  if(!empresas.length) return mapas;

  const ultimoDia=new Date(ano,mes,0).getDate();
  const mesStr=String(mes).padStart(2,"0");
  const dataIni=`${ano}-${mesStr}-01`;
  const dataFim=`${ano}-${mesStr}-${String(ultimoDia).padStart(2,"0")}`;
  const info=metasInfoReferencia(ano,mes);

  const anoBase=ano-1;
  const dataIniBase=`${anoBase}-${mesStr}-01`;
  const ultimoDiaBase=new Date(anoBase,mes,0).getDate();
  const dataFimBase=`${anoBase}-${mesStr}-${String(ultimoDiaBase).padStart(2,"0")}`;

  const [rPesos,rMetas,rVendas,rVendasBase]=await Promise.all([
    queryAtendimento(`
      SELECT
        LPAD(TRIM(empresa::text),2,'0') AS empresa,
        dia,
        COALESCE(peso_percentual,0)::numeric AS peso_percentual,
        COALESCE(observacao,'')::text AS observacao
      FROM metas_peso_diario
      WHERE ano=$1 AND mes=$2
        AND LPAD(TRIM(empresa::text),2,'0')=ANY($3::text[])
      ORDER BY empresa,dia
    `,[ano,mes,empresas],30000),
    queryAtendimento(`
      SELECT
        LPAD(TRIM(empresa::text),2,'0') AS empresa,
        COALESCE(meta_loja_valor,0)::numeric AS meta_loja_valor
      FROM metas_lojas
      WHERE ano=$1 AND mes=$2 AND ativo=TRUE
        AND LPAD(TRIM(empresa::text),2,'0')=ANY($3::text[])
    `,[ano,mes,empresas],30000),
    querySafe(`
      SELECT
        LPAD(TRIM(v.empresa::text),2,'0') AS empresa,
        v.data::date AS data,
        COALESCE(SUM(
          COALESCE(m.total::numeric,0)
          * (COALESCE(v.total::numeric,0)/NULLIF(COALESCE(v.subtotal::numeric,0),0))
        ),0)::numeric AS vendido
      FROM vendas v
      INNER JOIN movimento m
        ON TRIM(m.auxiliar::text)=('VE'||TRIM(v.codigo::text))
      WHERE v.data::date BETWEEN $1::date AND $2::date
        AND LPAD(TRIM(v.empresa::text),2,'0')=ANY($3::text[])
        AND COALESCE(v.subtotal::numeric,0)<>0
        AND COALESCE(m.estoque,false)=TRUE
        AND (CASE WHEN TRIM(COALESCE(v.tipo::text,''))='03'
             THEN TRIM(COALESCE(v.status::text,''))='P'
             ELSE TRIM(COALESCE(v.status::text,'')) IN ('S','O') END)
        AND (CASE WHEN TRIM(COALESCE(v.tipo::text,''))='03'
             THEN TRIM(COALESCE(m.operacao::text,''))='VC'
             ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV') END)
      GROUP BY LPAD(TRIM(v.empresa::text),2,'0'),v.data::date
      ORDER BY 1,2
    `,[dataIni,dataFim,empresas],120000)
    ,
    querySafe(`
      SELECT
        LPAD(TRIM(v.empresa::text),2,'0') AS empresa,
        EXTRACT(DAY FROM v.data)::int AS dia,
        COALESCE(SUM(
          COALESCE(m.total::numeric,0)
          * (COALESCE(v.total::numeric,0)/NULLIF(COALESCE(v.subtotal::numeric,0),0))
        ),0)::numeric AS vendido
      FROM vendas v
      INNER JOIN movimento m
        ON TRIM(m.auxiliar::text)=('VE'||TRIM(v.codigo::text))
      WHERE v.data::date BETWEEN $1::date AND $2::date
        AND LPAD(TRIM(v.empresa::text),2,'0')=ANY($3::text[])
        AND COALESCE(v.subtotal::numeric,0)<>0
        AND COALESCE(m.estoque,false)=TRUE
        AND (CASE WHEN TRIM(COALESCE(v.tipo::text,''))='03'
             THEN TRIM(COALESCE(v.status::text,''))='P'
             ELSE TRIM(COALESCE(v.status::text,'')) IN ('S','O') END)
        AND (CASE WHEN TRIM(COALESCE(v.tipo::text,''))='03'
             THEN TRIM(COALESCE(m.operacao::text,''))='VC'
             ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV') END)
      GROUP BY LPAD(TRIM(v.empresa::text),2,'0'),EXTRACT(DAY FROM v.data)
      ORDER BY 1,2
    `,[dataIniBase,dataFimBase,empresas],120000)
  ]);

  const pesos=new Map();
  for(const x of rPesos.rows||[]){
    const emp=x.empresa;
    if(!pesos.has(emp)) pesos.set(emp,new Map());
    pesos.get(emp).set(Number(x.dia),x);
  }

  const metas=new Map((rMetas.rows||[]).map(x=>[x.empresa,Number(x.meta_loja_valor||0)]));

  const vendasBase=new Map();
  for(const x of rVendasBase.rows||[]){
    const emp=String(x.empresa||"").padStart(2,"0");
    if(!vendasBase.has(emp)) vendasBase.set(emp,new Map());
    vendasBase.get(emp).set(Number(x.dia),Number(x.vendido||0));
  }

  const vendas=new Map();
  for(const x of rVendas.rows||[]){
    const emp=x.empresa;
    if(!vendas.has(emp)) vendas.set(emp,new Map());
    const data=typeof x.data==='string'?x.data.slice(0,10):metasISODataLocal(new Date(x.data));
    vendas.get(emp).set(data,Number(x.vendido||0));
  }

  for(const emp of empresas){
    const meta=Number(metas.get(emp)||0);
    const pmapOriginal=pesos.get(emp)||new Map();
    const vmap=vendas.get(emp)||new Map();
    const baseAnoPassado=vendasBase.get(emp)||new Map();

    // Se o calendário gravado estiver ausente/incompleto, cria automaticamente
    // a distribuição pelo mesmo mês do ano anterior daquela própria loja.
    const somaPesoGravado=[...pmapOriginal.values()]
      .reduce((s,x)=>s+Math.max(Number(x.peso_percentual||0),0),0);

    const pmap=new Map(pmapOriginal);
    let fontePeso="GRAVADO";

    if(somaPesoGravado < 99.5){
      const totalBase=[...baseAnoPassado.values()]
        .reduce((s,v)=>s+Math.max(Number(v||0),0),0);

      fontePeso=totalBase>0 ? "ANO_PASSADO_AUTOMATICO" : "DISTRIBUICAO_PADRAO";

      pmap.clear();

      if(totalBase>0){
        for(let d=1;d<=ultimoDia;d++){
          const vendaBase=Math.max(Number(baseAnoPassado.get(d)||0),0);
          pmap.set(d,{
            peso_percentual:(vendaBase/totalBase)*100,
            observacao:"Peso automático • mesmo mês do ano passado"
          });
        }
      }else{
        // Último recurso: distribui somente entre segunda e sábado.
        const diasValidos=[];
        for(let d=1;d<=ultimoDia;d++){
          const dt=new Date(ano,mes-1,d);
          if(dt.getDay()!==0) diasValidos.push(d);
        }
        const pesoPadrao=diasValidos.length ? 100/diasValidos.length : 0;
        for(let d=1;d<=ultimoDia;d++){
          pmap.set(d,{
            peso_percentual:diasValidos.includes(d)?pesoPadrao:0,
            observacao:"Peso automático • distribuição padrão"
          });
        }
      }
    }

    const dias=[];

    for(let d=1;d<=ultimoDia;d++){
      const dt=new Date(ano,mes-1,d);
      const iso=metasISODataLocal(dt);
      const p=pmap.get(d)||{};
      const vendido=Number(vmap.get(iso)||0);
      const pesoBase=Number(p.peso_percentual||0);
      dias.push({
        dia:d,
        data:iso,
        semana:["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][dt.getDay()],
        peso_base:pesoBase,
        observacao:p.observacao||"",
        vendido_atual:vendido,
        peso_real:meta>0?(vendido/meta)*100:0,
        peso_ajustado:0,
        meta_ajustada_dia:0,
        saldo_peso:0
      });
    }

    const consolidados=dias.filter(x=>x.data<=info.corteISO);
    const futuros=dias.filter(x=>x.data>info.corteISO);
    const pesoRealConsolidado=consolidados.reduce((s,x)=>s+Number(x.peso_real||0),0);
    const pesoRestante=Math.max(100-pesoRealConsolidado,0);
    const baseFutura=futuros.reduce((s,x)=>s+Math.max(Number(x.peso_base||0),0),0);

    for(const x of dias){
      if(x.data<=info.corteISO){
        x.peso_ajustado=Number(x.peso_real||0);
      }else{
        x.peso_ajustado=baseFutura>0
          ? pesoRestante*(Math.max(Number(x.peso_base||0),0)/baseFutura)
          : 0;
      }
      x.meta_ajustada_dia=meta*(x.peso_ajustado/100);
    }

    let acumulado=0;
    for(const x of dias){
      acumulado+=Number(x.peso_ajustado||0);
      x.saldo_peso=Math.max(100-acumulado,0);
    }

    const periodo=(inicio,fim)=>{
      const rows=dias.filter(x=>x.data>=inicio&&x.data<=fim);

      let metaPeriodo=0;
      let vendido=0;

      for(const x of rows){
        const vendaDia=Number(x.vendido_atual||0);
        const metaDia=Number(x.meta_ajustada_dia||0);

        vendido += vendaDia;

        // Dias passados entram pelo realizado.
        // Hoje e dias futuros entram pela meta ajustada.
        metaPeriodo += x.data < info.referenciaISO
          ? vendaDia
          : metaDia;
      }

      const peso=meta>0 ? (metaPeriodo/meta)*100 : 0;

      return {
        peso,
        meta:metaPeriodo,
        vendido,
        falta:Math.max(metaPeriodo-vendido,0),
        percentual:metaPeriodo>0?(vendido/metaPeriodo)*100:0
      };
    };

    const rowHoje=dias.find(x=>x.data===info.referenciaISO) || {};
    const metaHojeFinal=Number(rowHoje.meta_ajustada_dia||0);
    const vendidoHojeFinal=Number(rowHoje.vendido_atual||0);

    const hoje={
      peso:meta>0 ? (metaHojeFinal/meta)*100 : Number(rowHoje.peso_ajustado||0),
      meta:metaHojeFinal,
      vendido:vendidoHojeFinal,
      falta:Math.max(metaHojeFinal-vendidoHojeFinal,0),
      percentual:metaHojeFinal>0?(vendidoHojeFinal/metaHojeFinal)*100:0
    };

    const semana=periodo(info.semanaIniISO,info.semanaFimISO);
    const quinzena=periodo(info.quinzenaIniISO,info.quinzenaFimISO);
    const mesPeriodo={
      peso:100,
      meta,
      vendido:dias.reduce((s,x)=>s+Number(x.vendido_atual||0),0),
      falta:0,
      percentual:0
    };
    mesPeriodo.falta=Math.max(meta-mesPeriodo.vendido,0);
    mesPeriodo.percentual=meta>0?(mesPeriodo.vendido/meta)*100:0;

    const ateReferencia=dias.filter(x=>x.data<=info.referenciaISO);
    const pesoBaseAteHoje=ateReferencia.reduce((s,x)=>s+Number(x.peso_base||0),0);
    const pesoRealAteHoje=ateReferencia.reduce((s,x)=>s+Number(x.peso_real||0),0);
    const pesoAjustadoRestante=dias
      .filter(x=>x.data>=info.referenciaISO)
      .reduce((s,x)=>s+Number(x.peso_ajustado||0),0);

    mapas.set(emp,{
      empresa:emp,
      meta,
      dias,
      info,
      peso_base_ate_hoje:pesoBaseAteHoje,
      peso_real_ate_hoje:pesoRealAteHoje,
      peso_restante_ajustado:pesoAjustadoRestante,
      fonte_peso:fontePeso,
      calendario_gravado:fontePeso==="GRAVADO",
      meta_configurada:meta>0,
      periodos:{hoje,semana,quinzena,mes:mesPeriodo}
    });
  }

  return mapas;
}

function extrairDiaBaseObservacaoMeta(observacao,diaFallback){
  const texto=String(observacao||"").trim();

  // Formato atualmente gravado pela tela:
  // "Base: 28 Qui"
  const m=texto.match(/\bBase\s*:\s*(\d{1,2})\b/i);

  if(m){
    const dia=Number(m[1]||0);
    if(dia>=1 && dia<=31) return dia;
  }

  return Number(diaFallback||0);
}

app.get("/api/metas/peso-diario", async (req, res) => {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    const mes = Number(req.query.mes || (new Date().getMonth() + 1));
    const empresaRaw = String(req.query.empresa || "").trim();

    if (!ano || !mes || !empresaRaw) {
      return res.status(400).json({ok:false,erro:"Informe ano, mês e empresa."});
    }

    const empList = await resolveEmpresasFiltro(empresaRaw);
    if (!empList.length) {
      return res.status(400).json({ok:false,erro:"Nenhuma empresa encontrada para esse filtro."});
    }

    const mapas = await calcularCalendariosInteligentesMeta(ano,mes,empList);
    const ultimoDia = new Date(ano,mes,0).getDate();
    const metaTotal=[...mapas.values()].reduce((s,x)=>s+Number(x.meta||0),0);

    const anoBase=ano-1;
    const mesStr=String(mes).padStart(2,"0");
    const fimBase=`${anoBase}-${mesStr}-${String(new Date(anoBase,mes,0).getDate()).padStart(2,"0")}`;
    const iniBase=`${anoBase}-${mesStr}-01`;
    const rBase=await querySafe(`
      SELECT
        EXTRACT(DAY FROM v.data)::int AS dia,
        COALESCE(SUM(
          COALESCE(m.total::numeric,0)
          * (COALESCE(v.total::numeric,0)/NULLIF(COALESCE(v.subtotal::numeric,0),0))
        ),0)::numeric AS vendido
      FROM vendas v
      INNER JOIN movimento m ON TRIM(m.auxiliar::text)=('VE'||TRIM(v.codigo::text))
      WHERE v.data::date BETWEEN $1::date AND $2::date
        AND LPAD(TRIM(v.empresa::text),2,'0')=ANY($3::text[])
        AND COALESCE(v.subtotal::numeric,0)<>0
        AND COALESCE(m.estoque,false)=TRUE
        AND (CASE WHEN TRIM(COALESCE(v.tipo::text,''))='03'
             THEN TRIM(COALESCE(v.status::text,''))='P'
             ELSE TRIM(COALESCE(v.status::text,'')) IN ('S','O') END)
        AND (CASE WHEN TRIM(COALESCE(v.tipo::text,''))='03'
             THEN TRIM(COALESCE(m.operacao::text,''))='VC'
             ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV') END)
      GROUP BY EXTRACT(DAY FROM v.data)
    `,[iniBase,fimBase,empList],120000);
    const baseMap=new Map((rBase.rows||[]).map(x=>[Number(x.dia),Number(x.vendido||0)]));

    const dias=[];
    for(let d=1;d<=ultimoDia;d++){
      const linhas=[...mapas.values()].map(x=>x.dias.find(z=>z.dia===d)).filter(Boolean);
      const vendidoAtual=linhas.reduce((s,x)=>s+Number(x.vendido_atual||0),0);
      const metaDia=linhas.reduce((s,x)=>s+Number(x.meta_ajustada_dia||0),0);
      const pesoReal=metaTotal>0?(vendidoAtual/metaTotal)*100:0;
      const pesoAjustado=metaTotal>0?(metaDia/metaTotal)*100:0;
      const pesoBase=metaTotal>0
        ? [...mapas.values()].reduce((s,x)=>{
            const row=x.dias.find(z=>z.dia===d)||{};
            return s+Number(x.meta||0)*(Number(row.peso_base||0)/100);
          },0)/metaTotal*100
        : (linhas.length?linhas.reduce((s,x)=>s+Number(x.peso_base||0),0)/linhas.length:0);
      const obs=[...new Set(
        linhas
          .map(x=>String(x.observacao||'').trim())
          .filter(Boolean)
      )].join(' | ');

      const dt=new Date(ano,mes-1,d);

      // IMPORTANTE:
      // O peso salvo pode ter sido deslocado para casar o mesmo dia da
      // semana do ano anterior. A observação registra essa associação:
      // ex. "Base: 28 Qui".
      //
      // Portanto a Venda Ano Passado precisa usar o MESMO dia-base
      // registrado, e não simplesmente o mesmo número do dia atual.
      const diaBase=extrairDiaBaseObservacaoMeta(obs,d);

      const dtBase=new Date(anoBase,mes-1,diaBase);
      const semanaBase=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][dtBase.getDay()];

      const vendidoBaseCorreto=Number(baseMap.get(diaBase)||0);

      const saldoPeso=linhas.length
        ? (metaTotal>0
            ? [...mapas.values()].reduce((s,x)=>{
                const row=x.dias.find(z=>z.dia===d)||{};
                return s+Number(x.meta||0)*(Number(row.saldo_peso||0)/100);
              },0)/metaTotal*100
            : linhas.reduce((s,x)=>s+Number(x.saldo_peso||0),0)/linhas.length)
        : 0;

      dias.push({
        dia:d,
        data:metasISODataLocal(dt),
        semana:["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][dt.getDay()],
        peso_percentual:pesoBase,
        peso_base:pesoBase,

        // Agora acompanha exatamente a base usada pelo peso.
        dia_base:diaBase,
        data_base:metasISODataLocal(dtBase),
        semana_base:semanaBase,
        vendido_base:vendidoBaseCorreto,

        vendido_atual:vendidoAtual,
        peso_real:pesoReal,
        peso_ajustado:pesoAjustado,
        meta_ajustada_dia:metaDia,
        saldo_peso:saldoPeso,
        observacao:obs
      });
    }

    const totalPeso=dias.reduce((s,x)=>s+Number(x.peso_base||0),0);
    const diasMovimento=dias.filter(x=>Number(x.peso_base||0)>0).length;
    const info=metasInfoReferencia(ano,mes);

    res.json({
      ok:true,ano,mes,
      empresa:empList[0],
      empresa_digitada:empresaRaw,
      empresas_codigos:empList,
      meta_total:metaTotal,
      data_referencia:info.referenciaISO,
      corte_consolidado:info.corteISO,
      total_peso:totalPeso,
      dias_movimento:diasMovimento,
      dias_sem_movimento:dias.length-diasMovimento,
      dias
    });
  } catch (e) {
    console.error("Erro GET /api/metas/peso-diario:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/metas/peso-diario/sugestao", async (req, res) => {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    const mes = Number(req.query.mes || (new Date().getMonth() + 1));
    const empresaRaw = String(req.query.empresa || "").trim();

    if (!ano || !mes || !empresaRaw) {
      return res.status(400).json({
        ok:false,
        erro:"Informe ano, mês e empresa."
      });
    }

    const anoBase = ano - 1;
    const mesStr = String(mes).padStart(2, "0");
    const dataIniBase = `${anoBase}-${mesStr}-01`;
    const ultimoDiaBase = new Date(anoBase, mes, 0).getDate();
    const dataFimBase = `${anoBase}-${mesStr}-${String(ultimoDiaBase).padStart(2, "0")}`;

    const empList = await resolveEmpresasFiltro(empresaRaw);

    if (!empList.length) {
      return res.json({
        ok:false,
        erro:"Nenhuma loja encontrada para o filtro informado.",
        empresas:[]
      });
    }

    const rEmpresas = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
        TRIM(COALESCE(NULLIF(apelido,''), NULLIF(nome,''), codigo::text)) AS nome
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
        AND LPAD(RIGHT(TRIM(codigo::text),2),2,'0') = ANY($1::text[])
      ORDER BY 1
    `, [empList], 60000);

    const rVendas = await querySafe(`
      SELECT
        v.data::date AS data,
        COALESCE(SUM(
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ),0) AS vendido
      FROM vendas v
      INNER JOIN movimento m
        ON TRIM(m.auxiliar::text) = ('VE' || TRIM(v.codigo::text))
      WHERE v.data::date BETWEEN $1::date AND $2::date
        AND LPAD(TRIM(v.empresa::text),2,'0') = ANY($3::text[])
        AND COALESCE(v.subtotal::numeric,0) <> 0
        AND COALESCE(m.estoque,false) = TRUE
        AND (
          CASE
            WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
              THEN TRIM(COALESCE(v.status::text,'')) = 'P'
            ELSE TRIM(COALESCE(v.status::text,'')) IN ('S','O')
          END
        )
        AND (
          CASE
            WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
              THEN TRIM(COALESCE(m.operacao::text,'')) = 'VC'
            ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV')
          END
        )
      GROUP BY v.data::date
      ORDER BY v.data::date
    `, [dataIniBase, dataFimBase, empList], 120000);

    const mapaVendas = new Map(
      (rVendas.rows || []).map(x => {
        // Evita deslocamento de data por timezone ao receber DATE do PostgreSQL.
        let chave="";

        if(x.data instanceof Date){
          chave=[
            x.data.getFullYear(),
            String(x.data.getMonth()+1).padStart(2,"0"),
            String(x.data.getDate()).padStart(2,"0")
          ].join("-");
        }else{
          chave=String(x.data||"").slice(0,10);
        }

        return [chave,Number(x.vendido||0)];
      })
    );

    const totalVendidoBase = [...mapaVendas.values()]
      .reduce((s,v) => s + Number(v || 0), 0);

    const ultimoDiaAtual = new Date(ano, mes, 0).getDate();
    const dias = [];

    for (let d = 1; d <= ultimoDiaAtual; d++) {
      const dataAtual = new Date(ano, mes - 1, d);
      const dataBase = new Date(anoBase, mes - 1, d);

      const dataBaseISO = dataBase.toISOString().slice(0,10);
      const vendidoBase = Number(mapaVendas.get(dataBaseISO) || 0);

      const peso = totalVendidoBase > 0
        ? (vendidoBase / totalVendidoBase) * 100
        : 0;

      dias.push({
        dia: d,
        data: dataAtual.toISOString().slice(0,10),
        semana: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][dataAtual.getDay()],
        semana_base: ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][dataBase.getDay()],
        data_base: dataBaseISO,
        vendido_base: vendidoBase,
        peso_percentual: Number(peso.toFixed(4)),
        observacao: vendidoBase <= 0 ? "Sem venda ano passado" : "",
        peso_deslocado: 0,
        vendido_base_deslocado: 0,
        dia_base_deslocado: null,
        semana_base_deslocado: ""
      });
    }

    for (let i = 0; i < dias.length; i++) {
      const baseSeguinte = dias[i + 1];

      if (baseSeguinte) {
        dias[i].peso_deslocado = baseSeguinte.peso_percentual;
        dias[i].vendido_base_deslocado = baseSeguinte.vendido_base;
        dias[i].dia_base_deslocado = baseSeguinte.dia;
        dias[i].semana_base_deslocado = baseSeguinte.semana_base || baseSeguinte.semana;
      } else {
        dias[i].peso_deslocado = 0;
        dias[i].vendido_base_deslocado = 0;
        dias[i].dia_base_deslocado = null;
        dias[i].semana_base_deslocado = "";
      }
    }

    const totalPeso = dias.reduce((s,x) => s + Number(x.peso_percentual || 0), 0);
    const diasComVenda = dias.filter(x => Number(x.peso_percentual || 0) > 0).length;

    res.json({
      ok:true,
      ano,
      mes,
      ano_base: anoBase,
      periodo_base: {
        dataIni: dataIniBase,
        dataFim: dataFimBase
      },
      empresas: rEmpresas.rows || [],
      empresas_codigos: empList,
      total_vendido_base: totalVendidoBase,
      total_peso: totalPeso,
      dias_com_venda: diasComVenda,
      dias_sem_venda: dias.length - diasComVenda,
      dias
    });

  } catch (e) {
    console.error("Erro GET /api/metas/peso-diario/sugestao:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.post("/api/metas/peso-diario", async (req, res) => {
  try {
    const { ano, mes, empresa, dias = [] } = req.body || {};
    const empresaRaw = String(empresa || "").trim();

    if (!ano || !mes || !empresaRaw || !Array.isArray(dias)) {
      return res.status(400).json({
        ok:false,
        erro:"Informe ano, mês, empresa e dias."
      });
    }

    const empList = await resolveEmpresasFiltro(empresaRaw);

    if (!empList.length) {
      return res.status(400).json({
        ok:false,
        erro:"Nenhuma empresa encontrada para esse filtro."
      });
    }

    let gravados = 0;

    for (const x of dias) {
      const dia = Number(x.dia || 0);
      if (!dia) continue;

      for (const emp of empList) {
        await queryAtendimento(`
          INSERT INTO metas_peso_diario (
            ano, mes, empresa, dia, peso_percentual, observacao, atualizado_em
          )
          VALUES ($1,$2,$3,$4,$5,$6,NOW())
          ON CONFLICT (ano, mes, empresa, dia)
          DO UPDATE SET
            peso_percentual = EXCLUDED.peso_percentual,
            observacao = EXCLUDED.observacao,
            atualizado_em = NOW()
        `, [
          Number(ano),
          Number(mes),
          emp,
          dia,
          Number(x.peso_percentual || 0),
          String(x.observacao || "").trim()
        ], 30000);

        gravados++;
      }
    }

    res.json({
      ok:true,
      empresas: empList,
      empresas_qtd: empList.length,
      gravados
    });

  } catch (e) {
    console.error("Erro POST /api/metas/peso-diario:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/metas/lojas", async (req, res) => {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    const mes = Number(req.query.mes || (new Date().getMonth() + 1));
    const empresaRaw = String(req.query.empresa || "").trim();

    const params = [ano, mes];
    let filtroEmpresa = "";

    if (empresaRaw) {
      const empList = await resolveEmpresasFiltro(empresaRaw);

      if (!empList.length) {
        return res.json({ ok:true, dados:[] });
      }

      params.push(empList);
      filtroEmpresa = ` AND LPAD(TRIM(empresa::text),2,'0') = ANY($${params.length}::text[])`;
    }

    const r = await queryAtendimento(`
      SELECT *
      FROM metas_lojas
      WHERE ano = $1
        AND mes = $2
        AND ativo = TRUE
        ${filtroEmpresa}
      ORDER BY empresa
    `, params, 30000);

    res.json({ ok: true, dados: r.rows || [] });

  } catch (e) {
    console.error("Erro GET /api/metas/lojas:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.post("/api/metas/lojas", async (req, res) => {
  try {
    const {
      ano,
      mes,
      empresa,
      meta_loja_valor = 0,
      meta_vendedor_valor = 0,
      dias_uteis = 0,
      bronze_menor_pct = 20,
      prata_pct = 100,
      ouro_pct = 105,
      diamante_pct = 110
    } = req.body || {};

    if (!ano || !mes || !empresa) {
      return res.status(400).json({
        ok:false,
        erro:"Informe ano, mês e empresa."
      });
    }

    const r = await queryAtendimento(`
      INSERT INTO metas_lojas (
        ano,
        mes,
        empresa,
        meta_loja_valor,
        meta_vendedor_valor,
        dias_uteis,
        bronze_menor_pct,
        prata_pct,
        ouro_pct,
        diamante_pct,
        ativo,
        atualizado_em
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,NOW())
      ON CONFLICT (ano, mes, empresa)
      DO UPDATE SET
        meta_loja_valor = EXCLUDED.meta_loja_valor,
        meta_vendedor_valor = EXCLUDED.meta_vendedor_valor,
        dias_uteis = EXCLUDED.dias_uteis,
        bronze_menor_pct = EXCLUDED.bronze_menor_pct,
        prata_pct = EXCLUDED.prata_pct,
        ouro_pct = EXCLUDED.ouro_pct,
        diamante_pct = EXCLUDED.diamante_pct,
        ativo = TRUE,
        atualizado_em = NOW()
      RETURNING *
    `, [
      Number(ano),
      Number(mes),
      String(empresa).trim().padStart(2, "0"),
      Number(meta_loja_valor || 0),
      Number(meta_vendedor_valor || 0),
      Number(dias_uteis || 0),
      Number(bronze_menor_pct ?? 20),
      Number(prata_pct ?? 100),
      Number(ouro_pct ?? 105),
      Number(diamante_pct ?? 110)
    ], 30000);

    res.json({ ok:true, dados:r.rows[0] });

  } catch (e) {
    console.error("Erro POST /api/metas/lojas:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});


async function obterReguaSemaforoMetas(){
  const rColunas = await queryAtendimento(`
    SELECT LOWER(column_name) AS coluna
    FROM information_schema.columns
    WHERE table_schema='jpdesk'
      AND table_name='metas_lojas'
      AND LOWER(column_name) IN ('bronze_menor_pct','prata_pct','ouro_pct','diamante_pct')
  `, [], 15000);

  const existentes = new Set((rColunas.rows || []).map(x => String(x.coluna || "").toLowerCase()));
  const obrigatorias = ['bronze_menor_pct','prata_pct','ouro_pct','diamante_pct'];
  const faltando = obrigatorias.filter(c => !existentes.has(c));

  if(faltando.length){
    const erro = new Error(`A tabela jpdesk.metas_lojas não possui as colunas: ${faltando.join(", ")}`);
    erro.code = "METAS_REGUA_COLUNAS_AUSENTES";
    throw erro;
  }

  const r = await queryAtendimento(`
    SELECT
      COALESCE(bronze_menor_pct,20)::numeric AS bronze_menor_pct,
      COALESCE(prata_pct,100)::numeric AS prata_pct,
      COALESCE(ouro_pct,105)::numeric AS ouro_pct,
      COALESCE(diamante_pct,110)::numeric AS diamante_pct
    FROM metas_lojas
    WHERE ativo=TRUE
    ORDER BY atualizado_em DESC NULLS LAST, ano DESC, mes DESC, empresa
    LIMIT 1
  `, [], 15000);

  const x = r.rows?.[0] || {};
  return {
    bronze_menor_pct:Number(x.bronze_menor_pct ?? 20),
    prata_pct:Number(x.prata_pct ?? 100),
    ouro_pct:Number(x.ouro_pct ?? 105),
    diamante_pct:Number(x.diamante_pct ?? 110)
  };
}

async function gravarReguaSemaforoMetas(regua={}){
  await obterReguaSemaforoMetas();

  const bronzeMenor = Number(regua.bronze_menor_pct ?? 20);
  const prata = Number(regua.prata_pct ?? 100);
  const ouro = Number(regua.ouro_pct ?? 105);
  const diamante = Number(regua.diamante_pct ?? 110);
  const bronzeAlvo = 100 - bronzeMenor;

  if(
    !Number.isFinite(bronzeMenor) ||
    !Number.isFinite(prata) ||
    !Number.isFinite(ouro) ||
    !Number.isFinite(diamante) ||
    bronzeMenor < 0 ||
    bronzeMenor > 100 ||
    prata < bronzeAlvo ||
    ouro < prata ||
    diamante < ouro
  ){
    const erro = new Error("Régua inválida. Revise Bronze, Prata, Ouro e Diamante.");
    erro.code = "METAS_REGUA_INVALIDA";
    throw erro;
  }

  const r = await queryAtendimento(`
    UPDATE metas_lojas
    SET
      bronze_menor_pct=$1,
      prata_pct=$2,
      ouro_pct=$3,
      diamante_pct=$4,
      atualizado_em=NOW()
  `,[bronzeMenor,prata,ouro,diamante],30000);

  METAS_RESULTADO_MEM_CACHE.clear();

  return {
    bronze_menor_pct:bronzeMenor,
    prata_pct:prata,
    ouro_pct:ouro,
    diamante_pct:diamante,
    registros_atualizados:Number(r.rowCount || 0)
  };
}

app.get("/api/metas/regua-semaforo/diagnostico", async (req,res)=>{
  try{
    const rBanco = await queryAtendimento(`SELECT current_database() AS banco,current_schema() AS schema`,[],15000);
    const rColunas = await queryAtendimento(`
      SELECT column_name,data_type,column_default,is_nullable
      FROM information_schema.columns
      WHERE table_schema='jpdesk'
        AND table_name='metas_lojas'
        AND LOWER(column_name) IN ('bronze_menor_pct','prata_pct','ouro_pct','diamante_pct')
      ORDER BY ordinal_position
    `,[],15000);

    let regua=null;
    let erroRegua="";
    try{ regua=await obterReguaSemaforoMetas(); }catch(e){ erroRegua=e.message; }

    res.json({
      ok:true,
      banco:rBanco.rows?.[0]?.banco || "",
      schema:rBanco.rows?.[0]?.schema || "",
      tabela:"jpdesk.metas_lojas",
      colunas:rColunas.rows || [],
      regua,
      erro_regua:erroRegua
    });
  }catch(e){
    console.error("Erro diagnóstico régua metas:",e);
    res.status(500).json({ok:false,erro:e.message});
  }
});

app.get("/api/metas/regua-semaforo", async (req,res)=>{
  try{
    const regua=await obterReguaSemaforoMetas();
    res.json({ok:true,regua});
  }catch(e){
    console.error("Erro GET /api/metas/regua-semaforo:",e);
    res.status(500).json({ok:false,erro:e.message,codigo:e.code||""});
  }
});

app.post("/api/metas/regua-semaforo", async (req,res)=>{
  try{
    const regua=await gravarReguaSemaforoMetas(req.body || {});
    res.json({ok:true,regua});
  }catch(e){
    console.error("Erro POST /api/metas/regua-semaforo:",e);
    const status=e.code==="METAS_REGUA_INVALIDA" ? 400 : 500;
    res.status(status).json({ok:false,erro:e.message,codigo:e.code||""});
  }
});

app.get("/api/metas/browse-lojas", async (req, res) => {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    const mes = Number(req.query.mes || (new Date().getMonth() + 1));

    const rEmpresas = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
        TRIM(COALESCE(NULLIF(apelido,''), NULLIF(nome,''), codigo::text)) AS nome
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
      ORDER BY 1
    `, [], 60000);

    const rMetas = await queryAtendimento(`
      SELECT
        LPAD(TRIM(ml.empresa::text),2,'0') AS empresa,
        COALESCE(ml.meta_loja_valor,0)::numeric AS meta_loja_valor,
        COALESCE(ml.meta_vendedor_valor,0)::numeric AS meta_vendedor_valor,
        COALESCE(ml.dias_uteis,0)::int AS dias_uteis,
        COALESCE(ml.bronze_menor_pct,20)::numeric AS bronze_menor_pct,
        COALESCE(ml.prata_pct,100)::numeric AS prata_pct,
        COALESCE(ml.ouro_pct,105)::numeric AS ouro_pct,
        COALESCE(ml.diamante_pct,110)::numeric AS diamante_pct,
        COALESCE(pd.dias_movimento,0)::int AS dias_movimento
      FROM metas_lojas ml
      LEFT JOIN (
        SELECT
          ano,
          mes,
          LPAD(TRIM(empresa::text),2,'0') AS empresa,
          COUNT(*) FILTER (
            WHERE COALESCE(peso_percentual,0)::numeric > 0
          ) AS dias_movimento
        FROM metas_peso_diario
        GROUP BY ano, mes, LPAD(TRIM(empresa::text),2,'0')
      ) pd
        ON pd.ano = ml.ano
       AND pd.mes = ml.mes
       AND pd.empresa = LPAD(TRIM(ml.empresa::text),2,'0')
      WHERE ml.ano = $1
        AND ml.mes = $2
        AND ml.ativo = TRUE
      ORDER BY LPAD(TRIM(ml.empresa::text),2,'0')
    `, [ano, mes], 30000);

    const mapa = new Map();

    for(const m of rMetas.rows || []){
      mapa.set(m.empresa, m);
    }

    const dados = (rEmpresas.rows || []).map(e => {
      const m = mapa.get(e.empresa) || {};

      return {
        empresa: e.empresa,
        nome: e.nome,
        meta_loja_valor: Number(m.meta_loja_valor || 0),
        meta_vendedor_valor: Number(m.meta_vendedor_valor || 0),
        dias_uteis: Number(m.dias_movimento || m.dias_uteis || 0)
      };
    });

    // A régua é única para a rede, mas fica gravada JUNTO com as metas
    // do mês/ano selecionado. Ao carregar, lê exatamente desse período.
    const primeiraMetaPeriodo = (rMetas.rows || [])[0] || {};
    const regua = {
      bronze_menor_pct:Number(primeiraMetaPeriodo.bronze_menor_pct ?? 20),
      prata_pct:Number(primeiraMetaPeriodo.prata_pct ?? 100),
      ouro_pct:Number(primeiraMetaPeriodo.ouro_pct ?? 105),
      diamante_pct:Number(primeiraMetaPeriodo.diamante_pct ?? 110)
    };

    res.json({ ok:true, ano, mes, dados, regua });

  } catch(e) {
    console.error("Erro GET /api/metas/browse-lojas:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});
app.post("/api/metas/browse-lojas", async (req, res) => {
  try {
    const { ano, mes, lojas = [], regua = {} } = req.body || {};

    if(!ano || !mes || !Array.isArray(lojas)){
      return res.status(400).json({
        ok:false,
        erro:"Informe ano, mês e lojas."
      });
    }

    let gravadas = 0;

    for(const x of lojas){
      const empresa = String(x.empresa || "").trim().padStart(2, "0");
      if(!empresa) continue;

      const rDiasMov = await queryAtendimento(`
        SELECT COUNT(*)::int AS dias_movimento
        FROM metas_peso_diario
        WHERE ano = $1
          AND mes = $2
          AND LPAD(TRIM(empresa::text),2,'0') = $3
          AND COALESCE(peso_percentual,0)::numeric > 0
      `, [Number(ano), Number(mes), empresa], 30000);

      const diasUteisCalculado = Number(rDiasMov.rows?.[0]?.dias_movimento || 0);

      await queryAtendimento(`
        INSERT INTO metas_lojas (
          ano,
          mes,
          empresa,
          meta_loja_valor,
          meta_vendedor_valor,
          dias_uteis,
          bronze_menor_pct,
          prata_pct,
          ouro_pct,
          diamante_pct,
          ativo,
          atualizado_em
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,NOW())
        ON CONFLICT (ano, mes, empresa)
        DO UPDATE SET
          meta_loja_valor = EXCLUDED.meta_loja_valor,
          meta_vendedor_valor = EXCLUDED.meta_vendedor_valor,
          dias_uteis = EXCLUDED.dias_uteis,
          bronze_menor_pct = EXCLUDED.bronze_menor_pct,
          prata_pct = EXCLUDED.prata_pct,
          ouro_pct = EXCLUDED.ouro_pct,
          diamante_pct = EXCLUDED.diamante_pct,
          ativo = TRUE,
          atualizado_em = NOW()
      `, [
        Number(ano),
        Number(mes),
        empresa,
        Number(x.meta_loja_valor || 0),
        Number(x.meta_vendedor_valor || 0),
        diasUteisCalculado,
        Number(regua.bronze_menor_pct ?? 20),
        Number(regua.prata_pct ?? 100),
        Number(regua.ouro_pct ?? 105),
        Number(regua.diamante_pct ?? 110)
      ], 30000);

      gravadas++;
    }

    // A régua já foi gravada junto com cada meta do período acima.
    METAS_RESULTADO_MEM_CACHE.clear();

    res.json({
      ok:true,
      gravadas,
      regua:{
        bronze_menor_pct:Number(regua.bronze_menor_pct ?? 20),
        prata_pct:Number(regua.prata_pct ?? 100),
        ouro_pct:Number(regua.ouro_pct ?? 105),
        diamante_pct:Number(regua.diamante_pct ?? 110)
      }
    });

  } catch(e) {
    console.error("Erro POST /api/metas/browse-lojas:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});


const METAS_RESULTADO_MEM_CACHE = new Map();
const METAS_RESULTADO_CACHE_ATUAL_MS = 20000;      // mês atual: 20s
const METAS_RESULTADO_CACHE_HIST_MS = 300000;      // meses passados: 5min

function metasResultadoCacheGet(chave,ano,mes){
  const item=METAS_RESULTADO_MEM_CACHE.get(chave);
  if(!item) return null;

  const hoje=new Date();
  const mesAtual=hoje.getFullYear()===Number(ano) &&
    (hoje.getMonth()+1)===Number(mes);

  const ttl=mesAtual
    ? METAS_RESULTADO_CACHE_ATUAL_MS
    : METAS_RESULTADO_CACHE_HIST_MS;

  if(Date.now()-item.ts>ttl){
    METAS_RESULTADO_MEM_CACHE.delete(chave);
    return null;
  }

  return item.data;
}

function metasResultadoCacheSet(chave,data){
  METAS_RESULTADO_MEM_CACHE.set(chave,{
    ts:Date.now(),
    data
  });

  // evita crescimento indefinido
  if(METAS_RESULTADO_MEM_CACHE.size>120){
    const primeira=METAS_RESULTADO_MEM_CACHE.keys().next().value;
    METAS_RESULTADO_MEM_CACHE.delete(primeira);
  }
}

app.get("/api/metas/resultado", async (req, res) => {
  try {
    const ano = Number(req.query.ano || new Date().getFullYear());
    const mes = Number(req.query.mes || (new Date().getMonth() + 1));

    const empresaSolicitadaRaw = String(req.query.empresa || "").trim();
    let empresasSolicitadas = await resolveEmpresasFiltro(empresaSolicitadaRaw);

    const consolidacaoMetas = await carregarConsolidacaoEmpresasAtiva();

    // Se o usuário pesquisar uma empresa membro do grupo,
    // a busca passa a representar a empresa PRINCIPAL consolidada.
    if(empresasSolicitadas.length){
      const principais=[
        ...new Set(
          empresasSolicitadas.map(emp=>
            consolidacaoMetas.mapa?.[emp] || emp
          )
        )
      ];

      empresasSolicitadas=[
        ...new Set(
          principais.flatMap(principal=>
            consolidacaoMetas.destinos?.[principal] || [principal]
          )
        )
      ].sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true}));
    }

    const acessoEmpresasSessao = req.acessoEmpresas || {
      todas: true,
      empresas: []
    };

    let empList;

    if (acessoEmpresasSessao.todas) {
      // Usuário com Empresas de Acesso em branco no Seta.
      empList = empresasSolicitadas;
    } else {
      const permitidas = Array.isArray(req.empresasPermitidas)
        ? req.empresasPermitidas
        : [];

      // Sem filtro na tela: usa obrigatoriamente todas as empresas permitidas.
      // Com filtro: faz a interseção e nunca permite sair da lista da sessão.
      empList = empresasSolicitadas.length
        ? empresasSolicitadas.filter(codigo => permitidas.includes(codigo))
        : [...permitidas];

      if (!empList.length) {
        return res.status(403).json({
          ok: false,
          erro: "Nenhuma das empresas solicitadas está liberada para este usuário.",
          empresasPermitidas: permitidas
        });
      }
    }

    const empresaRaw = empList.join(",");

    const metasCacheKey = JSON.stringify({
      ano,
      mes,
      empresas:[...empList].sort(),
      consolidacao:(consolidacaoMetas.grupos||[])
        .map(g=>`${g.id}:${g.empresa_principal}:${g.ativo}`)
        .join("|")
    });

    const metasCacheHit = metasResultadoCacheGet(metasCacheKey,ano,mes);
    if(metasCacheHit){
      return res.json({
        ...metasCacheHit,
        cache:true
      });
    }

    const mesStr = String(mes).padStart(2, "0");
    const dataIni = `${ano}-${mesStr}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFim = `${ano}-${mesStr}-${String(ultimoDia).padStart(2, "0")}`;

const hoje = new Date();

function dataLocalISO(dt = new Date()){
  const ano = dt.getFullYear();
  const mes = String(dt.getMonth() + 1).padStart(2, "0");
  const dia = String(dt.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

const hojeStr = dataLocalISO(hoje);
const metaInfoRef = metasInfoReferencia(ano,mes);
const dataReferenciaMeta = metaInfoRef.referenciaISO;
const quinzenaIniMeta = metaInfoRef.quinzenaIniISO;
    const diaSemana = metaInfoRef.referencia.getDay(); // Domingo=0, Segunda=1, ... Sábado=6
const inicioSemana = new Date(metaInfoRef.referencia);

// Semana comercial: segunda até domingo.
// Na segunda zera. No domingo ainda considera a segunda anterior.
const diasVoltar = diaSemana === 0 ? 6 : diaSemana - 1;

inicioSemana.setDate(metaInfoRef.referencia.getDate() - diasVoltar);

const semanaIni = dataLocalISO(inicioSemana);

const fimSemana = new Date(inicioSemana);
fimSemana.setDate(inicioSemana.getDate() + 6);

const semanaFim = dataLocalISO(fimSemana);
    const rEmpresas = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
        TRIM(COALESCE(NULLIF(apelido,''), NULLIF(nome,''), codigo::text)) AS nome_empresa
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
        AND (
          $1::boolean = TRUE
          OR LPAD(RIGHT(TRIM(codigo::text),2),2,'0') = ANY($2::text[])
        )
    `, [acessoEmpresasSessao.todas, empList], 60000);

    const mapaNomeEmpresa = new Map();
    for(const e of rEmpresas.rows || []){
      mapaNomeEmpresa.set(e.empresa, e.nome_empresa);
    }

    const rMetas = await queryAtendimento(`
      SELECT
        ano,
        mes,
        LPAD(TRIM(empresa::text),2,'0') AS empresa,
        COALESCE(meta_loja_valor,0)::numeric AS meta_loja_valor,
        COALESCE(meta_vendedor_valor,0)::numeric AS meta_vendedor_valor,
        COALESCE(dias_uteis,0)::int AS dias_uteis,
        COALESCE(bronze_menor_pct,20)::numeric AS bronze_menor_pct,
        COALESCE(prata_pct,100)::numeric AS prata_pct,
        COALESCE(ouro_pct,105)::numeric AS ouro_pct,
        COALESCE(diamante_pct,110)::numeric AS diamante_pct
      FROM metas_lojas
      WHERE ano = $1
        AND mes = $2
        AND ativo = TRUE
        AND (
          $3::text = ''
          OR LPAD(TRIM(empresa::text),2,'0') = ANY($4::text[])
        )
      ORDER BY empresa
    `, [ano, mes, empresaRaw, empList], 30000);

    // Usa a régua efetivamente gravada junto com as metas deste mês/ano.
    const primeiraMetaResultado = (rMetas.rows || [])[0] || {};
    const reguaMetas = {
      bronze_menor_pct:Number(primeiraMetaResultado.bronze_menor_pct ?? 20),
      prata_pct:Number(primeiraMetaResultado.prata_pct ?? 100),
      ouro_pct:Number(primeiraMetaResultado.ouro_pct ?? 105),
      diamante_pct:Number(primeiraMetaResultado.diamante_pct ?? 110)
    };

    const filtroEmp = `
      AND (
        $3::text = ''
        OR LPAD(TRIM(v.empresa::text),2,'0') = ANY($4::text[])
      )
    `;

    const pVendasLoja = querySafe(`
  SELECT
    LPAD(TRIM(v.empresa::text),2,'0') AS empresa,

    COALESCE(SUM(
      COALESCE(m.total::numeric,0)
      * (
        COALESCE(v.total::numeric,0)
        / NULLIF(COALESCE(v.subtotal::numeric,0),0)
      )
    ),0) AS vendido_mes,

    COALESCE(SUM(
      CASE WHEN v.data::date = $5::date
        THEN
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ELSE 0
      END
    ),0) AS vendido_hoje,

    COALESCE(SUM(
      CASE WHEN v.data::date BETWEEN $6::date AND $5::date
        THEN
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ELSE 0
      END
    ),0) AS vendido_semana,

    COALESCE(SUM(
      CASE WHEN v.data::date BETWEEN $7::date AND $5::date
        THEN
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ELSE 0
      END
    ),0) AS vendido_quinzena,

    COUNT(DISTINCT v.codigo) AS qtd_vendas

  FROM vendas v

  INNER JOIN movimento m
    ON TRIM(m.auxiliar::text) = ('VE' || TRIM(v.codigo::text))

  WHERE v.data::date BETWEEN $1::date AND $2::date

    AND (
      CASE
        WHEN TRIM(v.tipo::text) = '03'
          THEN TRIM(v.status::text) = 'P'
        ELSE TRIM(v.status::text) IN ('S','O')
      END
    )

    AND COALESCE(m.estoque,false) = TRUE

    AND (
      CASE
        WHEN TRIM(v.tipo::text) = '03'
          THEN TRIM(m.operacao::text) = 'VC'
        ELSE TRIM(m.operacao::text) IN ('VE','DV')
      END
    )

  ${filtroEmp}

  GROUP BY LPAD(TRIM(v.empresa::text),2,'0')
`, [dataIni, dataFim, empresaRaw, empList, dataReferenciaMeta, semanaIni, quinzenaIniMeta], 90000);

    const pVendedores = querySafe(`
  SELECT
    LPAD(TRIM(v.empresa::text),2,'0') AS empresa,
    TRIM(m.vendedorm::text) AS vendedor_codigo,

    TRIM(
      COALESCE(
        NULLIF(p.apelido::text,''),
        NULLIF(p.nome::text,''),
        m.vendedorm::text
      )
    ) AS vendedor_nome,

    COALESCE(SUM(
      COALESCE(m.total::numeric,0)
      * (
        COALESCE(v.total::numeric,0)
        / NULLIF(COALESCE(v.subtotal::numeric,0),0)
      )
    ),0) AS vendido_mes,

    COALESCE(SUM(
      CASE WHEN v.data::date = $5::date
        THEN
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ELSE 0
      END
    ),0) AS vendido_hoje,

    COALESCE(SUM(
      CASE WHEN v.data::date BETWEEN $6::date AND $5::date
        THEN
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ELSE 0
      END
    ),0) AS vendido_semana,

    COALESCE(SUM(
      CASE WHEN v.data::date BETWEEN $7::date AND $5::date
        THEN
          COALESCE(m.total::numeric,0)
          * (
            COALESCE(v.total::numeric,0)
            / NULLIF(COALESCE(v.subtotal::numeric,0),0)
          )
        ELSE 0
      END
    ),0) AS vendido_quinzena,

    COUNT(DISTINCT v.codigo) AS qtd_vendas

  FROM vendas v

  INNER JOIN movimento m
    ON TRIM(m.auxiliar::text) = ('VE' || TRIM(v.codigo::text))

  LEFT JOIN pessoas p
    ON TRIM(p.codigo::text) = TRIM(m.vendedorm::text)

  WHERE v.data::date BETWEEN $1::date AND $2::date
    AND EXISTS (
      SELECT 1
      FROM pessoas pv
      WHERE TRIM(pv.codigo::text) = TRIM(m.vendedorm::text)
        AND COALESCE(pv.podevender,false) = TRUE
    )
    AND (
      CASE
        WHEN TRIM(v.tipo::text) = '03'
          THEN TRIM(v.status::text) = 'P'
        ELSE TRIM(v.status::text) IN ('S','O')
      END
    )

    AND COALESCE(m.estoque,false) = TRUE

    AND (
      CASE
        WHEN TRIM(v.tipo::text) = '03'
          THEN TRIM(m.operacao::text) = 'VC'
        ELSE TRIM(m.operacao::text) IN ('VE','DV')
      END
    )

  ${filtroEmp}

  GROUP BY
    LPAD(TRIM(v.empresa::text),2,'0'),
    TRIM(m.vendedorm::text),
    TRIM(
      COALESCE(
        NULLIF(p.apelido::text,''),
        NULLIF(p.nome::text,''),
        m.vendedorm::text
      )
    )

  ORDER BY empresa, vendido_mes DESC
`, [dataIni, dataFim, empresaRaw, empList, dataReferenciaMeta, semanaIni, quinzenaIniMeta], 90000);

    const ehMesAtual = hoje.getFullYear() === ano && (hoje.getMonth() + 1) === mes;
    const diaAtual = ehMesAtual ? hoje.getDate() : ultimoDia;
const dataReferencia = dataReferenciaMeta;

const pCalendario = queryAtendimento(`
  SELECT
    LPAD(TRIM(empresa::text),2,'0') AS empresa,

    COUNT(*) FILTER (
      WHERE COALESCE(peso_percentual,0)::numeric > 0
    ) AS dias_movimento_mes,

    COUNT(*) FILTER (
      WHERE COALESCE(peso_percentual,0)::numeric > 0
        AND make_date(ano, mes, dia) <= $5::date
    ) AS dias_movimento_passados,

    COUNT(*) FILTER (
      WHERE COALESCE(peso_percentual,0)::numeric > 0
        AND make_date(ano, mes, dia) > $5::date
    ) AS dias_movimento_restantes,

    COALESCE(SUM(
      CASE
        WHEN COALESCE(peso_percentual,0)::numeric > 0
         AND make_date(ano, mes, dia) <= $5::date
        THEN COALESCE(peso_percentual,0)::numeric
        ELSE 0
      END
    ),0) AS peso_passado,

    COALESCE(SUM(
      CASE
        WHEN COALESCE(peso_percentual,0)::numeric > 0
         AND make_date(ano, mes, dia) > $5::date
        THEN COALESCE(peso_percentual,0)::numeric
        ELSE 0
      END
    ),0) AS peso_restante,

    COALESCE(SUM(
      CASE
        WHEN COALESCE(peso_percentual,0)::numeric > 0
         AND make_date(ano, mes, dia) = $5::date
        THEN COALESCE(peso_percentual,0)::numeric
        ELSE 0
      END
    ),0) AS peso_hoje,

    COALESCE(SUM(
      CASE
        WHEN COALESCE(peso_percentual,0)::numeric > 0
         AND make_date(ano, mes, dia) BETWEEN $6::date AND $7::date
        THEN COALESCE(peso_percentual,0)::numeric
        ELSE 0
      END
    ),0) AS peso_semana_atual

  FROM metas_peso_diario
  WHERE ano = $1
    AND mes = $2
    AND (
      $3::text = ''
      OR LPAD(TRIM(empresa::text),2,'0') = ANY($4::text[])
    )
  GROUP BY LPAD(TRIM(empresa::text),2,'0')
`, [ano, mes, empresaRaw, empList, dataReferencia, semanaIni, semanaFim], 30000);

const pCalendariosMetaInteligente =
  calcularCalendariosInteligentesMeta(ano,mes,empList);

const [
  rVendasLoja,
  rVendedores,
  rCalendario,
  calendariosMetaInteligente
] = await Promise.all([
  pVendasLoja,
  pVendedores,
  pCalendario,
  pCalendariosMetaInteligente
]);

const mapaCalendario = new Map();

for(const c of rCalendario.rows || []){
  mapaCalendario.set(c.empresa, c);
}

for(const [emp,ci] of calendariosMetaInteligente.entries()){
  const p=ci.periodos || {};
  const base=mapaCalendario.get(emp)||{};
  mapaCalendario.set(emp,{
    ...base,
    peso_passado: Number(ci.peso_base_ate_hoje||0),
    peso_restante: Number(ci.peso_restante_ajustado||0),
    peso_hoje: Number(p.hoje?.peso||0),
    peso_semana_atual: Number(p.semana?.peso||0),
    peso_quinzena_atual: Number(p.quinzena?.peso||0),
    peso_real_acumulado: Number(ci.peso_real_ate_hoje||0),
    periodos_inteligentes:p
  });
}
    function tendencia(projecao, meta){
      const p = meta > 0 ? (projecao / meta) * 100 : 0;
      if(p >= 100) return "VAI BATER";
      if(p >= 90) return "RISCO";
      return "NAO BATE";
    }

    function statusCor(projecao, meta){
      const p = meta > 0 ? (projecao / meta) * 100 : 0;
      if(p >= 100) return "VERDE";
      if(p >= 90) return "AMARELO";
      return "VERMELHO";
    }

    const mapaLoja = new Map();
for(const x of rVendasLoja.rows || []){
  mapaLoja.set(x.empresa, x);
}

const lojas = (rMetas.rows || []).map(m => {
  const venda = mapaLoja.get(m.empresa) || {};
  const meta = Number(m.meta_loja_valor || 0);
  const vendido = Number(venda.vendido_mes || 0);
  const falta = Math.max(meta - vendido, 0);

  const cal = mapaCalendario.get(m.empresa) || {};
const temCalendario = Number(cal.dias_movimento_mes || 0) > 0;

const diasUteis = temCalendario
  ? Number(cal.dias_movimento_mes || 0)
  : Number(m.dias_uteis || ultimoDia);

const diasDecorridos = temCalendario
  ? Number(cal.dias_movimento_passados || 0)
  : Math.max(1, Math.min(diaAtual, diasUteis || diaAtual));

const diasRestantes = temCalendario
  ? Number(cal.dias_movimento_restantes || 0)
  : Math.max((diasUteis || ultimoDia) - diasDecorridos, 0);

const pesoPassado = temCalendario
  ? Number(cal.peso_passado || 0)
  : ((diasDecorridos / (diasUteis || ultimoDia)) * 100);

const pesoRestante = temCalendario
  ? Number(cal.peso_restante || 0)
  : Math.max(100 - pesoPassado, 0);

const pesoReal = meta > 0
  ? (vendido / meta) * 100
  : 0;

const pesoDiferenca = pesoReal - pesoPassado;

const pesoOperacionalRestante = Math.max(100 - pesoReal, 0);

const metaDiariaBase = meta / (diasUteis || ultimoDia);
const metaAteHoje = meta * (pesoPassado / 100);
const saldoHoje = vendido - metaAteHoje;

const metaAjustadaRestante = Math.max(meta - vendido, 0);

const mediaDia = diasDecorridos > 0 ? vendido / diasDecorridos : vendido;

const metaDia = diasRestantes > 0
  ? falta / diasRestantes
  : falta;

const periodosInteligentes = cal.periodos_inteligentes || {};

const pesoHojeFinal = Number(periodosInteligentes.hoje?.peso ?? cal.peso_hoje ?? 0);
const pesoSemanaFinal = Number(periodosInteligentes.semana?.peso ?? cal.peso_semana_atual ?? 0);
const pesoQuinzenaFinal = Number(periodosInteligentes.quinzena?.peso ?? cal.peso_quinzena_atual ?? 0);

const metaHoje = Number(periodosInteligentes.hoje?.meta ?? (meta * (pesoHojeFinal / 100)));
const metaSemanaFinal = Number(periodosInteligentes.semana?.meta ?? (meta * (pesoSemanaFinal / 100)));
const metaQuinzenaFinal = Number(periodosInteligentes.quinzena?.meta ?? (meta * (pesoQuinzenaFinal / 100)));

const metaHojeAjustada = metaHoje;
const faltaHoje = Math.max(metaHojeAjustada - Number(venda.vendido_hoje || 0), 0);

const projecao = pesoPassado > 0
  ? vendido / (pesoPassado / 100)
  : vendido;

const percentual = meta > 0
  ? (vendido / meta) * 100
  : 0;

const percentualProjetado = meta > 0
  ? (projecao / meta) * 100
  : 0;

return {
  ...m,
  ...reguaMetas,
  nome_empresa: mapaNomeEmpresa.get(m.empresa) || m.empresa,

  vendido_valor: vendido,
  vendido_hoje: Number(venda.vendido_hoje || 0),
  vendido_semana: Number(venda.vendido_semana || 0),
peso_semana_atual: pesoSemanaFinal,
meta_semana_atual: metaSemanaFinal,
falta_semana_atual: Math.max(metaSemanaFinal - Number(venda.vendido_semana || 0),0),
percentual_semana_atual: metaSemanaFinal>0
  ? (Number(venda.vendido_semana || 0)/metaSemanaFinal)*100
  : 0,
  falta_valor: falta,
  percentual,
  percentual_projetado: percentualProjetado,

  dias_uteis: diasUteis,
dias_decorridos: diasDecorridos,
dias_restantes: diasRestantes,
peso_passado: pesoPassado,
peso_restante: pesoRestante,
peso_hoje: pesoHojeFinal,
peso_quinzena_atual: pesoQuinzenaFinal,
peso_real: pesoReal,
peso_diferenca: pesoDiferenca,
peso_operacional_restante: pesoOperacionalRestante,

meta_hoje: metaHoje,
meta_hoje_ajustada: metaHojeAjustada,
falta_hoje: faltaHoje,
meta_ajustada_restante: metaAjustadaRestante,

dias_movimento_mes: diasUteis,

  media_diaria: mediaDia,
  meta_diaria_base: metaDiariaBase,
  meta_ate_hoje: metaAteHoje,
  saldo_hoje: saldoHoje,
  meta_diaria_necessaria: metaDia,
  projecao_fechamento: projecao,

  comissao_atual: vendido >= meta ? vendido * 0.005 : 0,
  comissao_projetada: projecao >= meta ? projecao * 0.005 : 0,

  periodos: {
    hoje: {
      ...(periodosInteligentes.hoje || {}),
      peso:pesoHojeFinal,
      meta:metaHojeAjustada,
      vendido:Number(venda.vendido_hoje || 0),
      falta:Math.max(metaHojeAjustada-Number(venda.vendido_hoje || 0),0),
      percentual:metaHojeAjustada>0 ? Number(venda.vendido_hoje || 0)/metaHojeAjustada*100 : 0
    },
    semana: {
      ...(periodosInteligentes.semana || {}),
      peso:pesoSemanaFinal,
      meta:metaSemanaFinal,
      vendido:Number(venda.vendido_semana || 0),
      falta:Math.max(metaSemanaFinal-Number(venda.vendido_semana || 0),0),
      percentual:metaSemanaFinal>0 ? Number(venda.vendido_semana || 0)/metaSemanaFinal*100 : 0
    },
    quinzena: {
      ...(periodosInteligentes.quinzena || {}),
      peso:pesoQuinzenaFinal,
      meta:metaQuinzenaFinal,
      vendido:Number(venda.vendido_quinzena || 0),
      falta:Math.max(metaQuinzenaFinal-Number(venda.vendido_quinzena || 0),0),
      percentual:metaQuinzenaFinal>0 ? Number(venda.vendido_quinzena || 0)/metaQuinzenaFinal*100 : 0
    },
    mes: {
      ...(periodosInteligentes.mes || {}),
      peso:100,
      meta,
      vendido,
      falta,
      percentual
    }
  },

  qtd_vendas: Number(venda.qtd_vendas || 0),
  tendencia: tendencia(projecao, meta),
  status: statusCor(projecao, meta)
};
    });

    const metaPorEmpresa = new Map();
    for(const m of lojas){
      metaPorEmpresa.set(m.empresa, Number(m.meta_vendedor_valor || 0));
    }

    const vendedores = (rVendedores.rows || []).map(v => {
      const meta = Number(metaPorEmpresa.get(v.empresa) || 0);
      const vendido = Number(v.vendido_mes || 0);
      const falta = Math.max(meta - vendido, 0);

      const loja = lojas.find(l => l.empresa === v.empresa);
      const calInt = calendariosMetaInteligente.get(v.empresa) || {};

      // =====================================================
      // META DO VENDEDOR = META MENSAL × PESO AJUSTADO DA LOJA
      // =====================================================
      // O vendedor NÃO possui calendário próprio.
      // Ele herda o mesmo PESO OPERACIONAL que a loja está usando.
      //
      // PESO BASE:
      //   referência histórica do ano passado.
      //
      // PESO AJUSTADO:
      //   peso operacional atual, já corrigido pelo realizado e pela
      //   redistribuição do saldo para os dias restantes.
      //
      // DIA:
      //   meta mensal vendedor × peso_ajustado do dia
      //
      // SEMANA:
      //   meta mensal vendedor × soma dos peso_ajustado da semana atual
      //
      // QUINZENA:
      //   meta mensal vendedor × soma dos peso_ajustado da quinzena atual
      //
      // MÊS:
      //   meta mensal vendedor × 100%
      //
      // Para identificar dia útil, continuamos respeitando peso_base > 0,
      // pois domingo/feriado zerado não deve virar dia útil por redistribuição.
      const diasPesoLoja = Array.isArray(calInt.dias)
        ? calInt.dias
        : [];

      const pesoPeriodoCalendario = (dataIniPeso,dataFimPeso) => {
        return diasPesoLoja.reduce((soma,dia) => {
          const data = String(dia?.data || "");
          if(!data || data < dataIniPeso || data > dataFimPeso){
            return soma;
          }

          const pesoBase = Math.max(Number(dia?.peso_base || 0),0);

          // Dia sem peso-base continua fora da meta.
          if(pesoBase <= 0){
            return soma;
          }

          const pesoOperacional = Math.max(
            Number(
              dia?.peso_ajustado ??
              dia?.peso_base ??
              0
            ),
            0
          );

          return soma + pesoOperacional;
        },0);
      };

      const diasUteisPeriodoCalendario = (dataIniPeso,dataFimPeso) => {
        return diasPesoLoja.filter(dia => {
          const data = String(dia?.data || "");
          const pesoBase = Math.max(Number(dia?.peso_base || 0),0);

          return (
            data &&
            data >= dataIniPeso &&
            data <= dataFimPeso &&
            pesoBase > 0
          );
        }).length;
      };

      const pesoHoje = pesoPeriodoCalendario(
        dataReferenciaMeta,
        dataReferenciaMeta
      );

      const pesoSemana = pesoPeriodoCalendario(
        semanaIni,
        semanaFim
      );

      const pesoQuinzena = pesoPeriodoCalendario(
        metaInfoRef.quinzenaIniISO,
        metaInfoRef.quinzenaFimISO
      );

      const diasUteisHoje = diasUteisPeriodoCalendario(
        dataReferenciaMeta,
        dataReferenciaMeta
      );

      const diasUteisSemana = diasUteisPeriodoCalendario(
        semanaIni,
        semanaFim
      );

      const diasUteisQuinzena = diasUteisPeriodoCalendario(
        metaInfoRef.quinzenaIniISO,
        metaInfoRef.quinzenaFimISO
      );

      const metaHoje = meta * (pesoHoje / 100);
      const metaSemana = meta * (pesoSemana / 100);
      const metaQuinzena = meta * (pesoQuinzena / 100);

      const vendidoHoje = Number(v.vendido_hoje || 0);
      const vendidoSemana = Number(v.vendido_semana || 0);
      const vendidoQuinzena = Number(v.vendido_quinzena || 0);

      const diasDecorridos = Number(loja?.dias_decorridos || 0);
      const diasRestantes = Number(loja?.dias_restantes || 0);
      const diasUteis = Number(loja?.dias_uteis || ultimoDia);
      const pesoPassado = Number(loja?.peso_passado || 0);
      const pesoReal = meta > 0 ? (vendido/meta)*100 : 0;
      const pesoDiferenca = pesoReal-pesoPassado;

      const mediaDia = diasDecorridos>0 ? vendido/diasDecorridos : vendido;
      const metaDiariaBase = diasUteis>0 ? meta/diasUteis : 0;
      const metaAteHoje = meta*(pesoPassado/100);
      const saldoHoje = vendido-metaAteHoje;
      const metaDiaNecessaria = diasRestantes>0 ? falta/diasRestantes : falta;

      const projecao = pesoPassado>0
        ? vendido/(pesoPassado/100)
        : vendido;

      const percentual = meta>0 ? vendido/meta*100 : 0;
      const percentualProjetado = meta>0 ? projecao/meta*100 : 0;

      const periodoVendedor=(pesoPeriodo,metaPeriodo,vendidoPeriodo)=>({
        peso:pesoPeriodo,
        meta:metaPeriodo,
        vendido:vendidoPeriodo,
        falta:Math.max(metaPeriodo-vendidoPeriodo,0),
        percentual:metaPeriodo>0 ? vendidoPeriodo/metaPeriodo*100 : 0
      });

      return {
        empresa:v.empresa,
        nome_empresa:mapaNomeEmpresa.get(v.empresa)||v.empresa,
        vendedor_codigo:v.vendedor_codigo,
        vendedor_nome:v.vendedor_nome,

        meta_valor:meta,
        meta_configurada:meta>0,
        fonte_peso:String(calInt.fonte_peso||""),
        calendario_gravado:Boolean(calInt.calendario_gravado),
        regra_meta_periodo:"PESO_AJUSTADO_CALENDARIO_LOJA",

        // Todos os vendedores e lojas usam a mesma régua oficial da rede.
        bronze_menor_pct:Number(reguaMetas.bronze_menor_pct ?? 20),
        prata_pct:Number(reguaMetas.prata_pct ?? 100),
        ouro_pct:Number(reguaMetas.ouro_pct ?? 105),
        diamante_pct:Number(reguaMetas.diamante_pct ?? 110),

        vendido_valor:vendido,
        vendido_hoje:vendidoHoje,
        vendido_semana:vendidoSemana,
        vendido_quinzena:vendidoQuinzena,

        falta_valor:falta,
        percentual,
        percentual_projetado:percentualProjetado,

        dias_decorridos:diasDecorridos,
        dias_restantes:diasRestantes,
        media_diaria:mediaDia,
        meta_diaria_base:metaDiariaBase,

        peso_passado:pesoPassado,
        peso_real:pesoReal,
        peso_diferenca:pesoDiferenca,

        peso_hoje:pesoHoje,
        peso_semana_atual:pesoSemana,
        peso_quinzena_atual:pesoQuinzena,
        peso_base_hoje:Number(
          diasPesoLoja.find(d=>String(d?.data||"")===dataReferenciaMeta)?.peso_base || 0
        ),
        peso_ajustado_hoje:Number(
          diasPesoLoja.find(d=>String(d?.data||"")===dataReferenciaMeta)?.peso_ajustado || 0
        ),

        dias_uteis_hoje:diasUteisHoje,
        dias_uteis_semana:diasUteisSemana,
        dias_uteis_quinzena:diasUteisQuinzena,

        meta_hoje:metaHoje,
        meta_hoje_ajustada:metaHoje,
        falta_hoje:Math.max(metaHoje-vendidoHoje,0),

        meta_semana_atual:metaSemana,
        falta_semana_atual:Math.max(metaSemana-vendidoSemana,0),
        percentual_semana_atual:metaSemana>0?vendidoSemana/metaSemana*100:0,

        meta_quinzena_atual:metaQuinzena,
        falta_quinzena_atual:Math.max(metaQuinzena-vendidoQuinzena,0),

        meta_ate_hoje:metaAteHoje,
        saldo_hoje:saldoHoje,
        meta_diaria_necessaria:metaDiaNecessaria,
        projecao_fechamento:projecao,

        comissao_atual:vendido>=meta && meta>0 ? vendido*0.005 : 0,
        comissao_projetada:projecao>=meta && meta>0 ? projecao*0.005 : 0,

        periodos:{
          hoje:periodoVendedor(pesoHoje,metaHoje,vendidoHoje),
          semana:periodoVendedor(pesoSemana,metaSemana,vendidoSemana),
          quinzena:periodoVendedor(pesoQuinzena,metaQuinzena,vendidoQuinzena),
          mes:periodoVendedor(100,meta,vendido)
        },

        qtd_vendas:Number(v.qtd_vendas||0),
        tendencia:tendencia(projecao,meta),
        status:statusCor(projecao,meta)
      };
    }).sort((a,b)=>Number(b.percentual||0)-Number(a.percentual||0));

    // ======================================================
    // CONSOLIDAÇÃO DE EMPRESAS APLICADA ÀS METAS
    // ======================================================
    const lojasOriginais=[...lojas];
    const vendedoresOriginais=[...vendedores];

    const lojasConsolidadas=consolidarLojasMetas(
      lojasOriginais,
      consolidacaoMetas,
      mapaNomeEmpresa
    );

    const vendedoresConsolidados=consolidarVendedoresMetas(
      vendedoresOriginais,
      consolidacaoMetas,
      mapaNomeEmpresa
    );

    lojas.length=0;
    lojas.push(...lojasConsolidadas);

    vendedores.length=0;
    vendedores.push(
      ...vendedoresConsolidados.sort(
        (a,b)=>Number(b.percentual||0)-Number(a.percentual||0)
      )
    );

    vendedores.forEach((x, i) => x.ranking = i + 1);

    const totais = {
      meta_loja_valor: lojas.reduce((s,x) => s + Number(x.meta_loja_valor || 0), 0),
      vendido_valor: lojas.reduce((s,x) => s + Number(x.vendido_valor || 0), 0),
      vendido_hoje: lojas.reduce((s,x) => s + Number(x.vendido_hoje || 0), 0),
      vendido_semana: lojas.reduce((s,x) => s + Number(x.vendido_semana || 0), 0),
      falta_valor: lojas.reduce((s,x) => s + Number(x.falta_valor || 0), 0),
      projecao_fechamento: lojas.reduce((s,x) => s + Number(x.projecao_fechamento || 0), 0),
      comissao_atual: vendedores.reduce((s,x) => s + Number(x.comissao_atual || 0), 0),
      comissao_projetada: vendedores.reduce((s,x) => s + Number(x.comissao_projetada || 0), 0),
      qtd_vendas: lojas.reduce((s,x) => s + Number(x.qtd_vendas || 0), 0),
      dias_decorridos: Math.max(...lojas.map(x => Number(x.dias_decorridos || 0)), 0),
      dias_restantes: Math.max(...lojas.map(x => Number(x.dias_restantes || 0)), 0)
    };

    totais.percentual = totais.meta_loja_valor > 0
      ? (totais.vendido_valor / totais.meta_loja_valor) * 100
      : 0;

    totais.percentual_projetado = totais.meta_loja_valor > 0
      ? (totais.projecao_fechamento / totais.meta_loja_valor) * 100
      : 0;

    totais.tendencia = tendencia(totais.projecao_fechamento, totais.meta_loja_valor);
    totais.status = statusCor(totais.projecao_fechamento, totais.meta_loja_valor);

    const respostaMetas = {
      ok: true,
      ano,
      mes,
      empresa: empresaRaw,
      empresas_filtradas: empList,
      consolidacao: {
        aplicada:true,
        grupos:consolidacaoMetas.gruposPorPrincipal || {},
        mapa:consolidacaoMetas.mapa || {}
      },
      periodo: {
        dataIni,
        dataFim,
        hoje: hojeStr,
        semanaIni,
        referencia: metaInfoRef.referenciaISO,
        semanaFim: metaInfoRef.semanaFimISO,
        quinzenaIni: metaInfoRef.quinzenaIniISO,
        quinzenaFim: metaInfoRef.quinzenaFimISO,
        labels: {
          hoje: metasDataBR(metaInfoRef.referenciaISO),
          semana: `${metasDataBR(metaInfoRef.semanaIniISO)} a ${metasDataBR(metaInfoRef.semanaFimISO)}`,
          quinzena: `${metasDataBR(metaInfoRef.quinzenaIniISO)} a ${metasDataBR(metaInfoRef.quinzenaFimISO)}`,
          mes: `${metasNomeMes(mes)}/${ano}`
        }
      },
      regua_semaforo:reguaMetas,
      totais,
      lojas,
      vendedores
    };

    metasResultadoCacheSet(metasCacheKey,respostaMetas);

    return res.json({
      ...respostaMetas,
      cache:false
    });


  } catch (e) {
    console.error("Erro GET /api/metas/resultado:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});
// ======================================================
// OTB-BI PREMIUM
// ======================================================
// ======================================================
// DATASET UNICO OTB BI
// ======================================================
let OTB_COLUNA_DATA_PEDIDO_CACHE = null;

async function obterColunaDataPedidoOTB(){
  if(OTB_COLUNA_DATA_PEDIDO_CACHE){
    return OTB_COLUNA_DATA_PEDIDO_CACHE;
  }

  const r = await querySafe(`
    SELECT LOWER(column_name) AS coluna
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND LOWER(table_name) = 'pedidos'
      AND LOWER(column_name) IN (
        'entrega',
        'dataentrega',
        'data_entrega',
        'previsao',
        'previsaoentrega',
        'previsao_entrega',
        'dataprevista',
        'data_prevista',
        'data'
      )
  `, [], 30000);

  const existentes = new Set(
    (r.rows || []).map(x => String(x.coluna || "").toLowerCase())
  );

  const prioridade = [
    "entrega",
    "dataentrega",
    "data_entrega",
    "previsaoentrega",
    "previsao_entrega",
    "previsao",
    "dataprevista",
    "data_prevista",
    "data"
  ];

  const escolhida = prioridade.find(nome => existentes.has(nome));

  if(!escolhida){
    throw new Error(
      "Não encontrei uma coluna de data ou entrega na tabela pedidos."
    );
  }

  // Valor vem de uma lista interna controlada, não do usuário.
  OTB_COLUNA_DATA_PEDIDO_CACHE = escolhida;

  console.log(
    "[OTB BI] Coluna de previsão dos pedidos:",
    OTB_COLUNA_DATA_PEDIDO_CACHE
  );

  return OTB_COLUNA_DATA_PEDIDO_CACHE;
}
app.get("/api/otb-bi/fornecedores", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toUpperCase();

    if (q.length < 2) {
      return res.json({ ok:true, fornecedores:[] });
    }

    const r = await querySafe(`
      SELECT DISTINCT
        TRIM(e.fornecedor::text) AS codigo,
        TRIM(COALESCE(p.nome, e.fornecedor::text)) AS nome
      FROM entradas e
      LEFT JOIN pessoas p
        ON TRIM(p.codigo::text) = TRIM(e.fornecedor::text)
      WHERE TRIM(e.tipo) = '10'
        AND (
          UPPER(TRIM(e.fornecedor::text)) ILIKE $1
          OR UPPER(TRIM(COALESCE(p.nome,''))) ILIKE $1
          OR UPPER(TRIM(e.fornecedor::text) || ' - ' || TRIM(COALESCE(p.nome,''))) ILIKE $1
        )
      ORDER BY nome
      LIMIT 50
    `, [`%${q}%`], 30000);

    res.json({ ok:true, fornecedores:r.rows || [] });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
app.get("/api/otb-bi/timeline", async (req, res) => {
  try {
    const empresasRaw = String(req.query.empresas || "")
      .trim()
      .toUpperCase();

    const departamentoRaw = String(req.query.departamento || "")
      .trim()
      .toUpperCase();

    const fornecedorRaw =
      String(req.query.fornecedor || "")
        .trim()
        .toUpperCase();

    const grupoRaw =
      String(req.query.grupo || "")
        .trim()
        .toUpperCase();

    const marcaRaw =
      String(req.query.marca || "")
        .trim()
        .toUpperCase();

    const complementoRaw =
      String(req.query.complemento || "")
        .trim()
        .toUpperCase();

    const dataIni =
      String(req.query.data_ini || "").trim();
    const dataFim = String(req.query.data_fim || "").trim();

    const empList = await resolveEmpresasFiltro(empresasRaw);

    const params = [];

    let filtroEmpresaMovimento = "";
    let filtroEmpresaCompra = "";
    let filtroEmpresaPedido = "";

    let filtroDepartamento = "";
    let filtroFornecedor = "";
    let filtroGrupo = "";
    let filtroMarca = "";
    let filtroComplemento = "";

    if (empList.length) {
      params.push(empList);

      const pEmpresas = params.length;

      filtroEmpresaMovimento = `
        AND LPAD(TRIM(m.empresa::text),2,'0')
            = ANY($${pEmpresas}::text[])
      `;

      filtroEmpresaCompra = `
        AND LPAD(TRIM(e.empresa::text),2,'0')
            = ANY($${pEmpresas}::text[])
      `;

      filtroEmpresaPedido = `
        AND LPAD(
          TRIM(
            COALESCE(
              NULLIF(pd.empresa::text,''),
              pdd.empresa::text
            )
          ),
          2,
          '0'
        ) = ANY($${pEmpresas}::text[])
      `;
    }

    if (departamentoRaw) {
      params.push(`%${departamentoRaw}%`);

      const pDepartamento = params.length;

      filtroDepartamento = `
        AND (
          UPPER(TRIM(COALESCE(d.codigo::text,'')))
            ILIKE $${pDepartamento}

          OR UPPER(TRIM(COALESCE(d.descricao::text,'')))
            ILIKE $${pDepartamento}

          OR UPPER(
            TRIM(COALESCE(d.codigo::text,'')) ||
            ' - ' ||
            TRIM(COALESCE(d.descricao::text,''))
          ) ILIKE $${pDepartamento}
        )
      `;
    }

    if (fornecedorRaw) {
      params.push(`%${fornecedorRaw}%`);

      const pFornecedor = params.length;

      filtroFornecedor = `
        AND (
          UPPER(TRIM(COALESCE(prod.fornecedor::text,'')))
            ILIKE $${pFornecedor}

          OR UPPER(TRIM(COALESCE(forn.nome::text,'')))
            ILIKE $${pFornecedor}

          OR UPPER(
            TRIM(COALESCE(prod.fornecedor::text,'')) ||
            ' - ' ||
            TRIM(COALESCE(forn.nome::text,''))
          ) ILIKE $${pFornecedor}
        )
      `;
    }
    if(grupoRaw){
      params.push(`%${grupoRaw}%`);

      const pGrupo = params.length;

      filtroGrupo = `
        AND (
          UPPER(
            TRIM(
              COALESCE(g.codigo::text,'')
            )
          ) ILIKE $${pGrupo}

          OR UPPER(
            TRIM(
              COALESCE(g.descricao::text,'')
            )
          ) ILIKE $${pGrupo}

          OR UPPER(
            TRIM(COALESCE(g.codigo::text,'')) ||
            ' - ' ||
            TRIM(COALESCE(g.descricao::text,''))
          ) ILIKE $${pGrupo}
        )
      `;
    }

    if(marcaRaw){
      params.push(`%${marcaRaw}%`);

      const pMarca = params.length;

      filtroMarca = `
        AND (
          UPPER(
            TRIM(
              COALESCE(mk.codigo::text,'')
            )
          ) ILIKE $${pMarca}

          OR UPPER(
            TRIM(
              COALESCE(mk.descricao::text,'')
            )
          ) ILIKE $${pMarca}

          OR UPPER(
            TRIM(COALESCE(mk.codigo::text,'')) ||
            ' - ' ||
            TRIM(COALESCE(mk.descricao::text,''))
          ) ILIKE $${pMarca}
        )
      `;
    }

    if(complementoRaw){
      const complementos = parseMultiTokens(complementoRaw)
        .map(valor => String(valor || "").trim().toUpperCase())
        .filter(Boolean);

      if(complementos.length){
        const condicoesComplemento = complementos.map(valor => {
          params.push(`%${valor}%`);
          const pComplemento = params.length;

          return `
            UPPER(
              TRIM(
                COALESCE(prod.complemento::text,'')
              )
            ) ILIKE $${pComplemento}
          `;
        });

        filtroComplemento = `
          AND (
            ${condicoesComplemento.join(" OR ")}
          )
        `;
      }
    }
    params.push(dataIni || null);
    const pDataIni = params.length;

    params.push(dataFim || null);
    const pDataFim = params.length;

    const sql = `
      WITH eventos AS (

        /* ==================================================
           MOVIMENTAÇÃO REAL DE ESTOQUE
           Entrada = positivo
           Saída   = negativo
           ================================================== */
        SELECT
          m.data::date AS data,
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto::text),6) AS produto,

          SUM(
            CASE
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(COALESCE(m.movimento::text,'')) = 'E'
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(COALESCE(m.movimento::text,'')) = 'S'
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS movimento_estoque,

          0::numeric AS compras,
          0::numeric AS vendas,
          0::numeric AS pedidos,
          0::numeric AS venda_ano_passado,
          0::numeric AS venda_ano_retrasado

        FROM movimento m

        WHERE COALESCE(m.estoque,false) = TRUE
          AND TRIM(COALESCE(m.movimento::text,'')) IN ('E','S')

          AND m.data::date BETWEEN
              COALESCE(
                $${pDataIni}::date,
                CURRENT_DATE - INTERVAL '2 MONTH'
              )
              AND
              LEAST(
                COALESCE($${pDataFim}::date, CURRENT_DATE),
                CURRENT_DATE
              )

          ${filtroEmpresaMovimento}

        GROUP BY
          m.data::date,
          LPAD(TRIM(m.empresa::text),2,'0'),
          LEFT(TRIM(m.produto::text),6)


        UNION ALL


        /* ==================================================
           VENDAS REAIS
           ================================================== */
        SELECT
          m.data::date AS data,
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto::text),6) AS produto,

          0::numeric AS movimento_estoque,
          0::numeric AS compras,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS vendas,

          0::numeric AS pedidos,
          0::numeric AS venda_ano_passado,
          0::numeric AS venda_ano_retrasado

        FROM movimento m

        WHERE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC')

          AND m.data::date BETWEEN
              COALESCE(
                $${pDataIni}::date,
                CURRENT_DATE - INTERVAL '2 MONTH'
              )
              AND
              LEAST(
                COALESCE($${pDataFim}::date, CURRENT_DATE),
                CURRENT_DATE
              )

          ${filtroEmpresaMovimento}

        GROUP BY
          m.data::date,
          LPAD(TRIM(m.empresa::text),2,'0'),
          LEFT(TRIM(m.produto::text),6)


        UNION ALL


        /* ==================================================
           COMPRAS REAIS
           Somente entradas tipo 10
           ================================================== */
        SELECT
          COALESCE(e.entrega::date, e.data::date) AS data,
          LPAD(TRIM(e.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto::text),6) AS produto,

          0::numeric AS movimento_estoque,

          SUM(
            ABS(COALESCE(m.quantidade::numeric,0))
          ) AS compras,

          0::numeric AS vendas,
          0::numeric AS pedidos,
          0::numeric AS venda_ano_passado,
          0::numeric AS venda_ano_retrasado

        FROM movimento m

        INNER JOIN entradas e
          ON TRIM(m.auxiliar::text)
           = TRIM(('EN' || e.codigo)::char(8))

        WHERE COALESCE(TRIM(e.tipo::text),'') = '10'

          AND TRIM(COALESCE(e.cfop::text,''))
              IN ('1102','2102','3102')

          AND COALESCE(e.entrega::date, e.data::date) BETWEEN
              COALESCE(
                $${pDataIni}::date,
                CURRENT_DATE - INTERVAL '2 MONTH'
              )
              AND
              LEAST(
                COALESCE($${pDataFim}::date, CURRENT_DATE),
                CURRENT_DATE
              )

          ${filtroEmpresaCompra}

        GROUP BY
          COALESCE(e.entrega::date, e.data::date),
          LPAD(TRIM(e.empresa::text),2,'0'),
          LEFT(TRIM(m.produto::text),6)


        UNION ALL


        /* ==================================================
           PEDIDOS ABERTOS
           Usa a DATA DE PREVISÃO do ERP
           ================================================== */
        SELECT
          pdd.previsao::date AS data,

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

          0::numeric AS movimento_estoque,
          0::numeric AS compras,
          0::numeric AS vendas,

          SUM(
            ABS(COALESCE(pd.pquantidade::numeric,0))
          ) AS pedidos,

          0::numeric AS venda_ano_passado,
          0::numeric AS venda_ano_retrasado

        FROM pedidos_detalhes pd

        INNER JOIN pedidos pdd
          ON TRIM(pdd.codigo::text)
           = TRIM(pd.pedido::text)

        WHERE TRIM(COALESCE(pdd.status::text,'')) IN ('A','C')
          AND pdd.previsao IS NOT NULL

          AND pdd.previsao::date BETWEEN
              COALESCE(
                $${pDataIni}::date,
                CURRENT_DATE - INTERVAL '2 MONTH'
              )
              AND
              COALESCE(
                $${pDataFim}::date,
                CURRENT_DATE + INTERVAL '2 MONTH'
              )

          ${filtroEmpresaPedido}

        GROUP BY
          pdd.previsao::date,

          LPAD(
            TRIM(
              COALESCE(
                NULLIF(pd.empresa::text,''),
                pdd.empresa::text
              )
            ),
            2,
            '0'
          ),

          LEFT(TRIM(pd.produto::text),6)


        UNION ALL


        /* ==================================================
           VENDA DO ANO ANTERIOR

           Exemplo:
           filtro 01/05/2026 a 31/08/2026
           busca  01/05/2025 a 31/08/2025

           A data é deslocada +1 ano somente para que o valor
           fique alinhado ao período selecionado no gráfico.
           ================================================== */
        SELECT
          (m.data::date + INTERVAL '1 YEAR')::date AS data,

          LPAD(
            TRIM(m.empresa::text),
            2,
            '0'
          ) AS empresa,

          LEFT(
            TRIM(m.produto::text),
            6
          ) AS produto,

          0::numeric AS movimento_estoque,
          0::numeric AS compras,
          0::numeric AS vendas,
          0::numeric AS pedidos,

          SUM(
            CASE
              WHEN TRIM(
                     COALESCE(m.operacao::text,'')
                   ) = 'VE'
                THEN ABS(
                  COALESCE(m.quantidade::numeric,0)
                )

              WHEN TRIM(
                     COALESCE(m.operacao::text,'')
                   ) IN ('DV','VC')
                THEN -ABS(
                  COALESCE(m.quantidade::numeric,0)
                )

              ELSE 0
            END
          ) AS venda_ano_passado,

          0::numeric AS venda_ano_retrasado

        FROM movimento m

        WHERE TRIM(
                COALESCE(m.operacao::text,'')
              ) IN ('VE','DV','VC')

          /*
           * Busca exatamente o mesmo intervalo,
           * porém um ano antes.
           */
          AND m.data::date BETWEEN
              (
                COALESCE(
                  $${pDataIni}::date,
                  CURRENT_DATE - INTERVAL '2 MONTH'
                )
                - INTERVAL '1 YEAR'
              )::date

              AND

              (
                COALESCE(
                  $${pDataFim}::date,
                  CURRENT_DATE
                )
                - INTERVAL '1 YEAR'
              )::date

          ${filtroEmpresaMovimento}

        GROUP BY
          (m.data::date + INTERVAL '1 YEAR')::date,

          LPAD(
            TRIM(m.empresa::text),
            2,
            '0'
          ),

          LEFT(
            TRIM(m.produto::text),
            6
          )

        UNION ALL


        /* ==================================================
           VENDA DO ANO RETRASADO

           Exemplo:
           filtro 01/05/2026 a 31/08/2026
           busca  01/05/2024 a 31/08/2024

           A data é deslocada +2 anos para alinhar cada
           dia/mês ao período atual da timeline.
           ================================================== */
        SELECT
          (m.data::date + INTERVAL '2 YEAR')::date AS data,

          LPAD(
            TRIM(m.empresa::text),
            2,
            '0'
          ) AS empresa,

          LEFT(
            TRIM(m.produto::text),
            6
          ) AS produto,

          0::numeric AS movimento_estoque,
          0::numeric AS compras,
          0::numeric AS vendas,
          0::numeric AS pedidos,
          0::numeric AS venda_ano_passado,

          SUM(
            CASE
              WHEN TRIM(
                     COALESCE(m.operacao::text,'')
                   ) = 'VE'
                THEN ABS(
                  COALESCE(m.quantidade::numeric,0)
                )

              WHEN TRIM(
                     COALESCE(m.operacao::text,'')
                   ) IN ('DV','VC')
                THEN -ABS(
                  COALESCE(m.quantidade::numeric,0)
                )

              ELSE 0
            END
          ) AS venda_ano_retrasado

        FROM movimento m

        WHERE TRIM(
                COALESCE(m.operacao::text,'')
              ) IN ('VE','DV','VC')

          AND m.data::date BETWEEN
              (
                COALESCE(
                  $${pDataIni}::date,
                  CURRENT_DATE - INTERVAL '2 MONTH'
                )
                - INTERVAL '2 YEAR'
              )::date

              AND

              (
                COALESCE(
                  $${pDataFim}::date,
                  CURRENT_DATE
                )
                - INTERVAL '2 YEAR'
              )::date

          ${filtroEmpresaMovimento}

        GROUP BY
          (m.data::date + INTERVAL '2 YEAR')::date,

          LPAD(
            TRIM(m.empresa::text),
            2,
            '0'
          ),

          LEFT(
            TRIM(m.produto::text),
            6
          )

      ),

      consolidado AS (
        SELECT
          data,
          empresa,
          produto,

          SUM(movimento_estoque) AS movimento_estoque,
          SUM(compras) AS compras,
          SUM(vendas) AS vendas,
          SUM(pedidos) AS pedidos,
          SUM(venda_ano_passado) AS venda_ano_passado,
          SUM(venda_ano_retrasado) AS venda_ano_retrasado

        FROM eventos

        GROUP BY
          data,
          empresa,
          produto
      )

      SELECT
        c.data,
        c.empresa,
        c.produto,

        COALESCE(MAX(prod.descricao),'') AS descricao,

        COALESCE(
          MAX(mk.descricao),
          'SEM MARCA'
        ) AS marca,

        COALESCE(
          MAX(forn.nome),
          MAX(prod.fornecedor::text),
          'SEM FORNECEDOR'
        ) AS fornecedor,

        COALESCE(
          MAX(prod.fornecedor::text),
          ''
        ) AS fornecedor_codigo,

        COALESCE(
          MAX(d.descricao),
          'SEM DEPARTAMENTO'
        ) AS departamento,

        COALESCE(
          MAX(d.codigo::text),
          ''
        ) AS departamento_codigo,

        COALESCE(
          MAX(g.descricao),
          'SEM GRUPO'
        ) AS grupo,

        COALESCE(
          MAX(sg.descricao),
          MAX(prod.subgrupo::text),
          'SEM SUBGRUPO'
        ) AS subgrupo,

        COALESCE(
          MAX(l.descricao),
          'SEM LINHA'
        ) AS linha,

        COALESCE(
          MAX(prod.corx),
          'SEM COR'
        ) AS cor,

        COALESCE(
          MAX(prod.complemento),
          'SEM COMPLEMENTO'
        ) AS complemento,

        COALESCE(
          MAX(prod.colecao),
          'SEM CAMPANHA'
        ) AS campanha,

        SUM(c.movimento_estoque) AS movimento_estoque,
        SUM(c.compras) AS compras,
        SUM(c.vendas) AS vendas,
        SUM(c.pedidos) AS pedidos,
        SUM(c.venda_ano_passado) AS venda_ano_passado,
        SUM(c.venda_ano_retrasado) AS venda_ano_retrasado

      FROM consolidado c

      LEFT JOIN produtos prod
        ON TRIM(prod.codigo::text)
         = TRIM(c.produto::text)

      LEFT JOIN marcas mk
        ON TRIM(mk.codigo::text)
         = TRIM(prod.marca::text)

      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text)
         = TRIM(prod.departamento::text)

      LEFT JOIN grupos g
        ON TRIM(g.codigo::text)
         = TRIM(prod.grupo::text)

      LEFT JOIN subgrupos sg
        ON TRIM(sg.codigo::text)
         = TRIM(prod.subgrupo::text)

      LEFT JOIN linhas l
        ON TRIM(l.codigo::text)
         = TRIM(prod.linha::text)

      LEFT JOIN pessoas forn
        ON TRIM(forn.codigo::text)
         = TRIM(prod.fornecedor::text)

      WHERE 1=1
        ${filtroDepartamento}
        ${filtroFornecedor}
        ${filtroGrupo}
        ${filtroMarca}
        ${filtroComplemento}

      GROUP BY
        c.data,
        c.empresa,
        c.produto

      HAVING
        SUM(c.movimento_estoque) <> 0
        OR SUM(c.compras) <> 0
        OR SUM(c.vendas) <> 0
        OR SUM(c.pedidos) <> 0
        OR SUM(c.venda_ano_passado) <> 0
        OR SUM(c.venda_ano_retrasado) <> 0

      ORDER BY
        c.data,
        c.empresa,
        c.produto
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok:true,
      timeline:r.rows || []
    });

  } catch (e) {
    console.error("Erro /api/otb-bi/timeline:", e);

    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});
app.get("/api/otb-bi/dataset", async (req,res)=>{
  try{
    const empresasRaw = String(
      req.query.empresas ||
      req.query.empresa ||
      ""
    ).trim().toUpperCase();

    const departamentoRaw = String(req.query.departamento || "").trim().toUpperCase();
    const fornecedorRaw = String(req.query.fornecedor || "").trim().toUpperCase();
    const grupoRaw = String(req.query.grupo || "").trim().toUpperCase();
    const marcaRaw = String(req.query.marca || "").trim().toUpperCase();
    const complementoRaw = String(req.query.complemento || "").trim().toUpperCase();

    let empList = await resolveEmpresasFiltro(empresasRaw);

    /*
     * Segurança por empresa continua obrigatória também no cache.
     */
    if(Array.isArray(req.empresasPermitidas) && req.empresasPermitidas.length){
      const permitidas = [...new Set(
        req.empresasPermitidas
          .map(x => String(x || "").replace(/\D/g,"").slice(-2).padStart(2,"0"))
          .filter(Boolean)
      )];

      empList = empList.length
        ? empList.filter(x => permitidas.includes(x))
        : permitidas;
    }

    if(
      !empresasRaw &&
      !empList.length &&
      !departamentoRaw &&
      !fornecedorRaw &&
      !grupoRaw &&
      !marcaRaw &&
      !complementoRaw
    ){
      return res.json({ok:true,dataset:[]});
    }

    const dataIni = String(req.query.data_ini || "").trim();
    const dataFim = String(req.query.data_fim || "").trim();

    const rStatus = await queryAtendimento(`
      SELECT
        carga_inicial_concluida,
        sincronizando,
        ultima_sucesso,
        inicio_historico,
        ultima_carga_completa,
        ultima_carga_incremental,
        ultima_mensagem,
        ultimo_erro
      FROM jp_otb_cache_status
      WHERE id = 1
    `, [], 10000);

    const cacheStatus = rStatus.rows?.[0];

    if(!cacheStatus?.carga_inicial_concluida){
      return res.status(503).json({
        ok:false,
        cache_preparando:true,
        erro:
          "O Motor Analítico OTB está preparando a primeira carga. " +
          "Aguarde a conclusão e pesquise novamente.",
        status:cacheStatus || null
      });
    }

    if(dataIni && cacheStatus.inicio_historico){
      const dataIniISO = /^\d{2}\/\d{2}\/\d{4}$/.test(String(dataIni))
        ? String(dataIni).split("/").reverse().join("-")
        : String(dataIni).slice(0,10);

      const inicioHistoricoISO =
        new Date(cacheStatus.inicio_historico)
          .toISOString()
          .slice(0,10);

      if(dataIniISO < inicioHistoricoISO){
        return res.status(400).json({
          ok:false,
          erro:
            "O período solicitado começa antes do histórico disponível no Motor OTB.",
          inicio_historico:inicioHistoricoISO
        });
      }
    }

    /*
     * Confirma se o resumo mensal existe.
     * Se ainda não existir, a própria rota usa o cache diário como fallback.
     */
    const rEstruturaMensal = await queryAtendimento(`
      SELECT
        to_regclass('jpdesk.jp_otb_vendas_mes') IS NOT NULL AS vendas_mes,
        to_regclass('jpdesk.jp_otb_compras_mes') IS NOT NULL AS compras_mes
    `, [], 10000);

    const usarMensal =
      rEstruturaMensal.rows?.[0]?.vendas_mes === true &&
      rEstruturaMensal.rows?.[0]?.compras_mes === true;

    const params = [];

    let filtroEmpresaBase = "";
    let filtroEmpresaVendasDia = "";
    let filtroEmpresaVendasMes = "";
    let filtroEmpresaComprasDia = "";
    let filtroEmpresaComprasMes = "";

    let filtroDepartamento = "";
    let filtroFornecedor = "";
    let filtroGrupo = "";
    let filtroMarca = "";
    let filtroComplemento = "";

    if(empList.length){
      params.push(empList);
      const p = params.length;

      filtroEmpresaBase = `AND x.empresa = ANY($${p}::text[])`;
      filtroEmpresaVendasDia = `AND v.empresa = ANY($${p}::text[])`;
      filtroEmpresaVendasMes = `AND vm.empresa = ANY($${p}::text[])`;
      filtroEmpresaComprasDia = `AND c.empresa = ANY($${p}::text[])`;
      filtroEmpresaComprasMes = `AND cm.empresa = ANY($${p}::text[])`;
    }

    if(departamentoRaw){
      params.push(`%${departamentoRaw}%`);
      const p = params.length;
      filtroDepartamento = `
        AND UPPER(COALESCE(d.departamento,'')) ILIKE $${p}
      `;
    }

    if(fornecedorRaw){
      params.push(`%${fornecedorRaw}%`);
      const p = params.length;
      filtroFornecedor = `
        AND UPPER(COALESCE(d.fornecedor,'')) ILIKE $${p}
      `;
    }

    if(grupoRaw){
      params.push(`%${grupoRaw}%`);
      const p = params.length;
      filtroGrupo = `
        AND UPPER(COALESCE(d.grupo,'')) ILIKE $${p}
      `;
    }

    if(marcaRaw){
      params.push(`%${marcaRaw}%`);
      const p = params.length;
      filtroMarca = `
        AND UPPER(COALESCE(d.marca,'')) ILIKE $${p}
      `;
    }

    if(complementoRaw){
      const complementos = parseMultiTokens(complementoRaw)
        .map(x => String(x || "").trim().toUpperCase())
        .filter(Boolean);

      if(complementos.length){
        const conds = complementos.map(valor => {
          params.push(`%${valor}%`);
          return `UPPER(COALESCE(d.complemento,'')) ILIKE $${params.length}`;
        });

        filtroComplemento = `AND (${conds.join(" OR ")})`;
      }
    }

    params.push(dataIni || null);
    const pIni = params.length;

    params.push(dataFim || null);
    const pFim = params.length;

    /*
     * PRODUTOS FILTRADOS:
     * aplica filtros de dimensão antes de somar fatos.
     * Isso impede o PostgreSQL de agregar produtos que serão descartados.
     */
    const cteProdutosFiltrados = `
      produtos_filtrados AS (
        SELECT d.produto
        FROM jp_otb_dim_produto d
        WHERE 1=1
          ${filtroDepartamento}
          ${filtroFornecedor}
          ${filtroGrupo}
          ${filtroMarca}
          ${filtroComplemento}
      )
    `;

    let ctesFatos;

    if(usarMensal){
      ctesFatos = `
        intervalos AS (
          SELECT 'ATUAL'::text AS periodo, data_ini AS ini, data_fim AS fim
          FROM parametros

          UNION ALL

          SELECT
            'AA',
            (data_ini - INTERVAL '1 YEAR')::date,
            (data_fim - INTERVAL '1 YEAR')::date
          FROM parametros

          UNION ALL

          SELECT
            'AR',
            (data_ini - INTERVAL '2 YEAR')::date,
            (data_fim - INTERVAL '2 YEAR')::date
          FROM parametros
        ),

        intervalos_calc AS (
          SELECT
            periodo,
            ini,
            fim,

            CASE
              WHEN ini = DATE_TRUNC('month',ini)::date
                THEN DATE_TRUNC('month',ini)::date
              ELSE
                (DATE_TRUNC('month',ini) + INTERVAL '1 MONTH')::date
            END AS primeiro_mes_completo,

            CASE
              WHEN fim =
                (DATE_TRUNC('month',fim) + INTERVAL '1 MONTH - 1 DAY')::date
                THEN DATE_TRUNC('month',fim)::date
              ELSE
                (DATE_TRUNC('month',fim) - INTERVAL '1 MONTH')::date
            END AS ultimo_mes_completo

          FROM intervalos
        ),

        vendas_partes AS (
          /*
           * Meses fechados: 1 linha consolidada por mês/empresa/produto.
           */
          SELECT
            vm.empresa,
            vm.produto,
            i.periodo,
            SUM(vm.vendas) AS qtd,
            SUM(vm.valor_vendas) AS valor

          FROM intervalos_calc i

          JOIN jp_otb_vendas_mes vm
            ON vm.mes BETWEEN
               i.primeiro_mes_completo
               AND i.ultimo_mes_completo
           AND i.primeiro_mes_completo <= i.ultimo_mes_completo

          JOIN produtos_filtrados pf
            ON pf.produto = vm.produto

          WHERE 1=1
            ${filtroEmpresaVendasMes}

          GROUP BY
            vm.empresa,
            vm.produto,
            i.periodo

          UNION ALL

          /*
           * Somente bordas incompletas do período usam detalhe diário.
           */
          SELECT
            v.empresa,
            v.produto,
            i.periodo,
            SUM(v.vendas) AS qtd,
            SUM(v.valor_vendas) AS valor

          FROM intervalos_calc i

          JOIN jp_otb_vendas_dia v
            ON v.data BETWEEN i.ini AND i.fim

          JOIN produtos_filtrados pf
            ON pf.produto = v.produto

          WHERE 1=1
            ${filtroEmpresaVendasDia}

            AND NOT (
              i.primeiro_mes_completo <= i.ultimo_mes_completo
              AND v.data >= i.primeiro_mes_completo
              AND v.data <
                  (i.ultimo_mes_completo + INTERVAL '1 MONTH')
            )

          GROUP BY
            v.empresa,
            v.produto,
            i.periodo
        ),

        vendas AS (
          SELECT
            empresa,
            produto,

            COALESCE(
              SUM(qtd) FILTER (WHERE periodo='ATUAL'),
              0
            ) AS vendas,

            COALESCE(
              SUM(valor) FILTER (WHERE periodo='ATUAL'),
              0
            ) AS valor_vendas,

            COALESCE(
              SUM(qtd) FILTER (WHERE periodo='AA'),
              0
            ) AS venda_ano_passado,

            COALESCE(
              SUM(valor) FILTER (WHERE periodo='AA'),
              0
            ) AS valor_venda_ano_passado,

            COALESCE(
              SUM(qtd) FILTER (WHERE periodo='AR'),
              0
            ) AS venda_ano_retrasado,

            COALESCE(
              SUM(valor) FILTER (WHERE periodo='AR'),
              0
            ) AS valor_venda_ano_retrasado

          FROM vendas_partes

          GROUP BY empresa,produto
        ),

        compras_partes AS (
          SELECT
            cm.empresa,
            cm.produto,
            i.periodo,
            SUM(cm.compras) AS qtd,
            SUM(cm.valor_compras) AS valor

          FROM intervalos_calc i

          JOIN jp_otb_compras_mes cm
            ON cm.mes BETWEEN
               i.primeiro_mes_completo
               AND i.ultimo_mes_completo
           AND i.primeiro_mes_completo <= i.ultimo_mes_completo

          JOIN produtos_filtrados pf
            ON pf.produto = cm.produto

          WHERE 1=1
            ${filtroEmpresaComprasMes}

          GROUP BY
            cm.empresa,
            cm.produto,
            i.periodo

          UNION ALL

          SELECT
            c.empresa,
            c.produto,
            i.periodo,
            SUM(c.compras) AS qtd,
            SUM(c.valor_compras) AS valor

          FROM intervalos_calc i

          JOIN jp_otb_compras_dia c
            ON c.data BETWEEN i.ini AND i.fim

          JOIN produtos_filtrados pf
            ON pf.produto = c.produto

          WHERE 1=1
            ${filtroEmpresaComprasDia}

            AND NOT (
              i.primeiro_mes_completo <= i.ultimo_mes_completo
              AND c.data >= i.primeiro_mes_completo
              AND c.data <
                  (i.ultimo_mes_completo + INTERVAL '1 MONTH')
            )

          GROUP BY
            c.empresa,
            c.produto,
            i.periodo
        ),

        compras AS (
          SELECT
            empresa,
            produto,

            COALESCE(
              SUM(qtd) FILTER (WHERE periodo='ATUAL'),
              0
            ) AS compras,

            COALESCE(
              SUM(valor) FILTER (WHERE periodo='ATUAL'),
              0
            ) AS valor_compras,

            COALESCE(
              SUM(qtd) FILTER (WHERE periodo='AA'),
              0
            ) AS compras_ano_passado,

            COALESCE(
              SUM(valor) FILTER (WHERE periodo='AA'),
              0
            ) AS valor_compras_ano_passado,

            COALESCE(
              SUM(qtd) FILTER (WHERE periodo='AR'),
              0
            ) AS compras_ano_retrasado,

            COALESCE(
              SUM(valor) FILTER (WHERE periodo='AR'),
              0
            ) AS valor_compras_ano_retrasado

          FROM compras_partes

          GROUP BY empresa,produto
        )
      `;
    }else{
      /*
       * FALLBACK:
       * se as tabelas mensais ainda não existirem, usa somente o cache
       * diário. Continua sem consultar movimento/vendas/entradas do Seta.
       */
      ctesFatos = `
        vendas AS (
          SELECT
            v.empresa,
            v.produto,

            SUM(v.vendas) FILTER (
              WHERE v.data BETWEEN p.data_ini AND p.data_fim
            ) AS vendas,

            SUM(v.valor_vendas) FILTER (
              WHERE v.data BETWEEN p.data_ini AND p.data_fim
            ) AS valor_vendas,

            SUM(v.vendas) FILTER (
              WHERE v.data BETWEEN
                (p.data_ini - INTERVAL '1 YEAR')::date
                AND
                (p.data_fim - INTERVAL '1 YEAR')::date
            ) AS venda_ano_passado,

            SUM(v.valor_vendas) FILTER (
              WHERE v.data BETWEEN
                (p.data_ini - INTERVAL '1 YEAR')::date
                AND
                (p.data_fim - INTERVAL '1 YEAR')::date
            ) AS valor_venda_ano_passado,

            SUM(v.vendas) FILTER (
              WHERE v.data BETWEEN
                (p.data_ini - INTERVAL '2 YEAR')::date
                AND
                (p.data_fim - INTERVAL '2 YEAR')::date
            ) AS venda_ano_retrasado,

            SUM(v.valor_vendas) FILTER (
              WHERE v.data BETWEEN
                (p.data_ini - INTERVAL '2 YEAR')::date
                AND
                (p.data_fim - INTERVAL '2 YEAR')::date
            ) AS valor_venda_ano_retrasado

          FROM jp_otb_vendas_dia v
          CROSS JOIN parametros p

          JOIN produtos_filtrados pf
            ON pf.produto = v.produto

          WHERE v.data BETWEEN
            (p.data_ini - INTERVAL '2 YEAR')::date
            AND p.data_fim
            ${filtroEmpresaVendasDia}

          GROUP BY v.empresa,v.produto
        ),

        compras AS (
          SELECT
            c.empresa,
            c.produto,

            SUM(c.compras) FILTER (
              WHERE c.data BETWEEN p.data_ini AND p.data_fim
            ) AS compras,

            SUM(c.valor_compras) FILTER (
              WHERE c.data BETWEEN p.data_ini AND p.data_fim
            ) AS valor_compras,

            SUM(c.compras) FILTER (
              WHERE c.data BETWEEN
                (p.data_ini - INTERVAL '1 YEAR')::date
                AND
                (p.data_fim - INTERVAL '1 YEAR')::date
            ) AS compras_ano_passado,

            SUM(c.valor_compras) FILTER (
              WHERE c.data BETWEEN
                (p.data_ini - INTERVAL '1 YEAR')::date
                AND
                (p.data_fim - INTERVAL '1 YEAR')::date
            ) AS valor_compras_ano_passado,

            SUM(c.compras) FILTER (
              WHERE c.data BETWEEN
                (p.data_ini - INTERVAL '2 YEAR')::date
                AND
                (p.data_fim - INTERVAL '2 YEAR')::date
            ) AS compras_ano_retrasado,

            SUM(c.valor_compras) FILTER (
              WHERE c.data BETWEEN
                (p.data_ini - INTERVAL '2 YEAR')::date
                AND
                (p.data_fim - INTERVAL '2 YEAR')::date
            ) AS valor_compras_ano_retrasado

          FROM jp_otb_compras_dia c
          CROSS JOIN parametros p

          JOIN produtos_filtrados pf
            ON pf.produto = c.produto

          WHERE c.data BETWEEN
            (p.data_ini - INTERVAL '2 YEAR')::date
            AND p.data_fim
            ${filtroEmpresaComprasDia}

          GROUP BY c.empresa,c.produto
        )
      `;
    }

    const sql = `
      WITH parametros AS (
        SELECT
          COALESCE(
            $${pIni}::date,
            CURRENT_DATE - INTERVAL '3 MONTH'
          )::date AS data_ini,

          COALESCE(
            $${pFim}::date,
            CURRENT_DATE
          )::date AS data_fim
      ),

      ${cteProdutosFiltrados},

      ${ctesFatos},

      chaves AS (
        SELECT e.empresa,e.produto
        FROM jp_otb_estoque e
        JOIN produtos_filtrados pf
          ON pf.produto=e.produto

        UNION

        SELECT empresa,produto FROM vendas

        UNION

        SELECT empresa,produto FROM compras

        UNION

        SELECT pd.empresa,pd.produto
        FROM jp_otb_pedidos pd
        JOIN produtos_filtrados pf
          ON pf.produto=pd.produto
      ),

      base AS (
        SELECT
          x.empresa,
          x.produto,

          COALESCE(e.estoque,0) AS estoque,

          COALESCE(v.vendas,0) AS vendas,
          COALESCE(v.valor_vendas,0) AS valor_vendas,

          COALESCE(v.venda_ano_passado,0) AS venda_ano_passado,
          COALESCE(v.valor_venda_ano_passado,0) AS valor_venda_ano_passado,

          COALESCE(v.venda_ano_retrasado,0) AS venda_ano_retrasado,
          COALESCE(v.valor_venda_ano_retrasado,0) AS valor_venda_ano_retrasado,

          COALESCE(c.compras,0) AS compras,
          COALESCE(c.valor_compras,0) AS valor_compras,

          COALESCE(c.compras_ano_passado,0) AS compras_ano_passado,
          COALESCE(c.valor_compras_ano_passado,0) AS valor_compras_ano_passado,

          COALESCE(c.compras_ano_retrasado,0) AS compras_ano_retrasado,
          COALESCE(c.valor_compras_ano_retrasado,0) AS valor_compras_ano_retrasado,

          COALESCE(pd.pedidos,0) AS pedidos,
          COALESCE(pd.valor_pedidos,0) AS valor_pedidos

        FROM chaves x

        LEFT JOIN jp_otb_estoque e
          USING(empresa,produto)

        LEFT JOIN vendas v
          USING(empresa,produto)

        LEFT JOIN compras c
          USING(empresa,produto)

        LEFT JOIN jp_otb_pedidos pd
          USING(empresa,produto)

        WHERE 1=1
          ${filtroEmpresaBase}
      )

      SELECT
        x.empresa,
        x.produto,

        COALESCE(d.descricao,'') AS descricao,
        COALESCE(d.marca,'SEM MARCA') AS marca,
        COALESCE(d.fornecedor,'SEM FORNECEDOR') AS fornecedor,
        COALESCE(d.departamento,'SEM DEPARTAMENTO') AS departamento,
        COALESCE(d.grupo,'SEM GRUPO') AS grupo,
        COALESCE(d.subgrupo,'SEM SUBGRUPO') AS subgrupo,
        COALESCE(d.linha,'SEM LINHA') AS linha,
        COALESCE(d.cor,'SEM COR') AS cor,
        COALESCE(d.complemento,'SEM COMPLEMENTO') AS complemento,
        COALESCE(d.campanha,'SEM CAMPANHA') AS campanha,

        COALESCE(pr.valor_promocao,0) AS valor_promocao,
        pr.promocao_inicio,
        COALESCE(pr.promocao_nome,'') AS promocao_nome,

        RIGHT(TRIM(x.produto),2) AS numeracao,
        COALESCE(d.preco_venda,0) AS preco_venda,

        x.estoque,

        x.compras,
        x.valor_compras,
        x.compras_ano_passado,
        x.valor_compras_ano_passado,
        x.compras_ano_retrasado,
        x.valor_compras_ano_retrasado,

        x.vendas,
        x.valor_vendas,
        x.venda_ano_passado,
        x.valor_venda_ano_passado,
        x.venda_ano_retrasado,
        x.valor_venda_ano_retrasado,

        x.pedidos,

        COALESCE(d.valor_custo,0) AS valor_custo,

        CASE
          WHEN x.pedidos>0
            THEN x.valor_pedidos / NULLIF(x.pedidos,0)
          ELSE 0
        END AS valor_custo_pedido

      FROM base x

      INNER JOIN jp_otb_dim_produto d
        ON d.produto=x.produto

      LEFT JOIN jp_otb_promocoes pr
        ON pr.empresa=x.empresa
       AND pr.produto=x.produto

      WHERE 1=1

        AND (
          x.estoque<>0
          OR x.compras<>0
          OR x.compras_ano_passado<>0
          OR x.compras_ano_retrasado<>0
          OR x.vendas<>0
          OR x.venda_ano_passado<>0
          OR x.venda_ano_retrasado<>0
          OR x.pedidos<>0
        )

      ORDER BY
        x.empresa,
        x.produto
    `;

    const inicio = Date.now();

    const r = await queryAtendimento(
      sql,
      params,
      60000
    );

    let dataset = Array.isArray(r.rows) ? r.rows : [];

    /*
     * ==========================================================
     * CAMADA TEMPO REAL — VENDAS DE HOJE
     * ==========================================================
     *
     * O histórico continua vindo somente do banco analítico.
     * Quando o período pesquisado inclui hoje, buscamos no SETA
     * apenas as vendas de HOJE e substituímos a parcela de hoje
     * que estava gravada no cache.
     *
     * Assim:
     *   histórico = rápido/cache
     *   hoje      = tempo real/SETA
     */
    const hojeISO = new Date().toLocaleDateString("en-CA", {
      timeZone:"America/Recife"
    });

    const dataIniEfetiva = dataIni || hojeISO;
    const dataFimEfetiva = dataFim || hojeISO;

    const periodoIncluiHoje =
      dataIniEfetiva <= hojeISO &&
      dataFimEfetiva >= hojeISO;

    let tempoRealAplicado = false;
    let tempoRealMs = 0;

    if(periodoIncluiHoje){
      const inicioTempoReal = Date.now();

      const paramsLive = [hojeISO];
      let filtroEmpresaLive = "";

      if(empList.length){
        paramsLive.push(empList);
        filtroEmpresaLive =
          `AND LPAD(TRIM(m.empresa::text),2,'0') = ANY($2::text[])`;
      }

      /*
       * Movimento do dia é pequeno quando comparado ao histórico.
       * Agrupamos no próprio SETA antes de trazer ao Node.
       */
      const rLive = await querySafe(`
        SELECT
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto::text),6) AS produto,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS vendas,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
                THEN ABS(COALESCE(m.total::numeric,0))

              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
                THEN -ABS(COALESCE(m.total::numeric,0))

              ELSE 0
            END
          ) AS valor_vendas

        FROM movimento m

        WHERE m.data::date = $1::date
          AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC')
          ${filtroEmpresaLive}

        GROUP BY
          LPAD(TRIM(m.empresa::text),2,'0'),
          LEFT(TRIM(m.produto::text),6)
      `, paramsLive, 30000);

      /*
       * Quanto do "hoje" já estava no cache?
       * Precisamos subtrair essa parcela antes de somar o valor real,
       * evitando duplicidade.
       */
      const paramsCacheHoje = [hojeISO];
      let filtroEmpresaCacheHoje = "";

      if(empList.length){
        paramsCacheHoje.push(empList);
        filtroEmpresaCacheHoje =
          `AND empresa = ANY($2::text[])`;
      }

      const rCacheHoje = await queryAtendimento(`
        SELECT
          empresa,
          produto,
          SUM(vendas) AS vendas,
          SUM(valor_vendas) AS valor_vendas
        FROM jp_otb_vendas_dia
        WHERE data = $1::date
          ${filtroEmpresaCacheHoje}
        GROUP BY empresa,produto
      `, paramsCacheHoje, 15000);

      const cacheHoje = new Map(
        (rCacheHoje.rows || []).map(x => [
          `${String(x.empresa || "").padStart(2,"0")}|${String(x.produto || "").trim()}`,
          {
            vendas:Number(x.vendas || 0),
            valor:Number(x.valor_vendas || 0)
          }
        ])
      );

      const liveHoje = new Map(
        (rLive.rows || []).map(x => [
          `${String(x.empresa || "").padStart(2,"0")}|${String(x.produto || "").trim()}`,
          {
            empresa:String(x.empresa || "").padStart(2,"0"),
            produto:String(x.produto || "").trim(),
            vendas:Number(x.vendas || 0),
            valor:Number(x.valor_vendas || 0)
          }
        ])
      );

      const mapaDataset = new Map(
        dataset.map(item => [
          `${String(item.empresa || "").padStart(2,"0")}|${String(item.produto || "").trim()}`,
          item
        ])
      );

      /*
       * Ajusta produtos que já existem no dataset.
       */
      for(const [chave,item] of mapaDataset){
        const antigo = cacheHoje.get(chave) || {vendas:0,valor:0};
        const atual = liveHoje.get(chave) || {
          vendas:0,
          valor:0
        };

        item.vendas =
          Number(item.vendas || 0) -
          Number(antigo.vendas || 0) +
          Number(atual.vendas || 0);

        item.valor_vendas =
          Number(item.valor_vendas || 0) -
          Number(antigo.valor || 0) +
          Number(atual.valor || 0);
      }

      /*
       * Se um produto vendeu hoje mas ainda não existia no snapshot
       * retornado pelo cache, acrescentamos a linha usando as dimensões
       * locais. Isso garante venda lançada após a carga diária.
       */
      const chavesNovas = [...liveHoje.entries()]
        .filter(([chave]) => !mapaDataset.has(chave));

      if(chavesNovas.length){
        const produtosNovos = [...new Set(
          chavesNovas.map(([,x]) => x.produto)
        )];

        const empresasNovas = [...new Set(
          chavesNovas.map(([,x]) => x.empresa)
        )];

        const rDimNovas = await queryAtendimento(`
          SELECT
            d.produto,
            COALESCE(d.descricao,'') AS descricao,
            COALESCE(d.marca,'SEM MARCA') AS marca,
            COALESCE(d.fornecedor,'SEM FORNECEDOR') AS fornecedor,
            COALESCE(d.departamento,'SEM DEPARTAMENTO') AS departamento,
            COALESCE(d.grupo,'SEM GRUPO') AS grupo,
            COALESCE(d.subgrupo,'SEM SUBGRUPO') AS subgrupo,
            COALESCE(d.linha,'SEM LINHA') AS linha,
            COALESCE(d.cor,'SEM COR') AS cor,
            COALESCE(d.complemento,'SEM COMPLEMENTO') AS complemento,
            COALESCE(d.campanha,'SEM CAMPANHA') AS campanha,
            COALESCE(d.preco_venda,0) AS preco_venda,
            COALESCE(d.valor_custo,0) AS valor_custo
          FROM jp_otb_dim_produto d
          WHERE d.produto = ANY($1::text[])
        `, [produtosNovos], 15000);

        const dims = new Map(
          (rDimNovas.rows || []).map(x => [String(x.produto),x])
        );

        const rEstNovas = await queryAtendimento(`
          SELECT empresa,produto,estoque
          FROM jp_otb_estoque
          WHERE empresa = ANY($1::text[])
            AND produto = ANY($2::text[])
        `, [empresasNovas,produtosNovos], 15000);

        const ests = new Map(
          (rEstNovas.rows || []).map(x => [
            `${String(x.empresa).padStart(2,"0")}|${String(x.produto)}`,
            Number(x.estoque || 0)
          ])
        );

        for(const [,live] of chavesNovas){
          const d = dims.get(live.produto);
          if(!d) continue;

          /*
           * Respeita também os filtros dimensionais já solicitados.
           */
          const confere = (valor,filtro) =>
            !filtro ||
            String(valor || "").toUpperCase().includes(
              String(filtro || "").replace(/%/g,"").toUpperCase()
            );

          if(!confere(d.departamento,departamentoRaw)) continue;
          if(!confere(d.fornecedor,fornecedorRaw)) continue;
          if(!confere(d.grupo,grupoRaw)) continue;
          if(!confere(d.marca,marcaRaw)) continue;

          if(complementoRaw){
            const comps = parseMultiTokens(complementoRaw)
              .map(x => String(x).toUpperCase());
            const valorComp = String(d.complemento || "").toUpperCase();
            if(!comps.some(x => valorComp.includes(x))) continue;
          }

          dataset.push({
            empresa:live.empresa,
            produto:live.produto,
            descricao:d.descricao,
            marca:d.marca,
            fornecedor:d.fornecedor,
            departamento:d.departamento,
            grupo:d.grupo,
            subgrupo:d.subgrupo,
            linha:d.linha,
            cor:d.cor,
            complemento:d.complemento,
            campanha:d.campanha,
            valor_promocao:0,
            promocao_inicio:null,
            promocao_nome:"",
            numeracao:"",
            preco_venda:Number(d.preco_venda || 0),
            estoque:Number(
              ests.get(`${live.empresa}|${live.produto}`) || 0
            ),
            compras:0,
            valor_compras:0,
            compras_ano_passado:0,
            valor_compras_ano_passado:0,
            compras_ano_retrasado:0,
            valor_compras_ano_retrasado:0,
            vendas:live.vendas,
            valor_vendas:live.valor,
            venda_ano_passado:0,
            valor_venda_ano_passado:0,
            venda_ano_retrasado:0,
            valor_venda_ano_retrasado:0,
            pedidos:0,
            valor_custo:Number(d.valor_custo || 0),
            valor_custo_pedido:0
          });
        }
      }

      tempoRealAplicado = true;
      tempoRealMs = Date.now()-inicioTempoReal;
    }

    console.log(
      `[OTB BI CACHE] dataset em ${Date.now()-inicio} ms | ` +
      `linhas: ${dataset.length} | ` +
      `empresas: ${empList.length || "todas"} | ` +
      `fonte: ${usarMensal ? "mensal+bordas" : "diario"} | ` +
      `hoje: ${tempoRealAplicado ? `SETA ${tempoRealMs}ms` : "fora do período"}`
    );

    res.json({
      ok:true,
      cache:true,
      cache_mensal:usarMensal,
      tempo_real_hoje:tempoRealAplicado,
      tempo_real_ms:tempoRealMs,
      atualizado_em:cacheStatus.ultima_sucesso,
      atualizado_ate:tempoRealAplicado ? new Date().toISOString() : cacheStatus.ultima_sucesso,
      politica:{
        dias_recentes:OTB_CACHE_DIAS_RECENTES,
        atualizacao_minutos:OTB_CACHE_ATUALIZACAO_MINUTOS,
        vendas_hoje:"tempo_real"
      },
      dataset
    });

  }catch(e){
    console.error(
      "Erro /api/otb-bi/dataset CACHE:",
      e
    );

    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});
/* =========================================================
   OTB BI - DETALHES DO PRODUTO POR EMPRESA E TAMANHO
   ========================================================= */
app.get("/api/otb-bi/produto-detalhes", async (req,res)=>{
  try{
    const produto = String(req.query.produto || "").replace(/\D/g, "").slice(0,6);
    const empresasRaw = String(req.query.empresas || "").trim().toUpperCase();
    const dataIni = String(req.query.data_ini || "").trim();
    const dataFim = String(req.query.data_fim || "").trim();

    if(produto.length !== 6){
      return res.status(400).json({ok:false,erro:"Produto inválido."});
    }

    if(!/^\d{4}-\d{2}-\d{2}$/.test(dataIni) || !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)){
      return res.status(400).json({
        ok:false,
        erro:"Informe a Data Inicial e a Data Final antes de abrir os detalhes do produto."
      });
    }

    if(dataIni > dataFim){
      return res.status(400).json({
        ok:false,
        erro:"A Data Inicial não pode ser maior que a Data Final."
      });
    }

    const empList = await resolveEmpresasFiltro(empresasRaw);
    const produtoIni = `${produto}00`;
    const produtoFim = `${produto}99`;

    const paramsMov = [produtoIni, produtoFim, dataIni || null, dataFim || null];
    const paramsComp = [produtoIni, produtoFim, dataIni || null, dataFim || null];
    const paramsPed = [produtoIni, produtoFim, dataIni || null, dataFim || null];
    const paramsPreco = [produto];

    let filtroMovimento = "";
    let filtroEntrada = "";
    let filtroPedido = "";
    let filtroEmpresaPromocao = "";

    if(empList.length){
      paramsMov.push(empList);
      paramsComp.push(empList);
      paramsPed.push(empList);

      filtroMovimento = `AND LPAD(TRIM(m.empresa::text),2,'0') = ANY($5::text[])`;
      filtroEntrada = `AND LPAD(TRIM(e.empresa::text),2,'0') = ANY($5::text[])`;
      filtroPedido = `
        AND LPAD(
          TRIM(COALESCE(NULLIF(pd.empresa::text,''),pdd.empresa::text)),
          2,
          '0'
        ) = ANY($5::text[])
      `;

      paramsPreco.push(empList);
      filtroEmpresaPromocao = `
        AND (
          CASE
            WHEN LEFT(TRIM(pp.codigo),1) = 'P'
              THEN SUBSTRING(TRIM(pp.codigo),8,2)
            ELSE SUBSTRING(TRIM(pp.codigo),7,2)
          END
        ) = ANY($2::text[])
      `;
    }

    const sqlMovimento = `
      WITH p AS (
        SELECT
          $3::date AS data_ini,
          $4::date AS data_fim
      )
      SELECT
        LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
        RIGHT(TRIM(m.produto::text),2) AS tamanho,
        COALESCE(SUM(CASE
          WHEN m.data::date BETWEEN p.data_ini AND p.data_fim
           AND TRIM(COALESCE(m.operacao::text,''))='VE'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
          WHEN m.data::date BETWEEN p.data_ini AND p.data_fim
           AND TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
            THEN -ABS(COALESCE(m.quantidade::numeric,0))
          ELSE 0
        END),0) AS vendas,
        COALESCE(SUM(CASE
          WHEN m.data::date BETWEEN (p.data_ini - INTERVAL '1 year')
                                AND (p.data_fim - INTERVAL '1 year')
           AND TRIM(COALESCE(m.operacao::text,''))='VE'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
          WHEN m.data::date BETWEEN (p.data_ini - INTERVAL '1 year')
                                AND (p.data_fim - INTERVAL '1 year')
           AND TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
            THEN -ABS(COALESCE(m.quantidade::numeric,0))
          ELSE 0
        END),0) AS venda_ano_passado,
        COALESCE(SUM(CASE
          WHEN COALESCE(m.estoque,false)=TRUE
           AND TRIM(COALESCE(m.movimento::text,''))='E'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
          WHEN COALESCE(m.estoque,false)=TRUE
           AND TRIM(COALESCE(m.movimento::text,''))='S'
            THEN -ABS(COALESCE(m.quantidade::numeric,0))
          ELSE 0
        END),0) AS estoque
      FROM movimento m
      CROSS JOIN p
      WHERE m.produto >= $1::char(8)
        AND m.produto <= $2::char(8)
        ${filtroMovimento}
      GROUP BY 1,2
    `;

    const sqlCompras = `
      WITH p AS (
        SELECT
          $3::date AS data_ini,
          $4::date AS data_fim
      )
      SELECT
        LPAD(TRIM(e.empresa::text),2,'0') AS empresa,
        RIGHT(TRIM(m.produto::text),2) AS tamanho,
        COALESCE(SUM(CASE
          WHEN COALESCE(e.entrega::date, e.data::date) BETWEEN p.data_ini AND p.data_fim
            THEN ABS(COALESCE(m.quantidade::numeric,0))
          ELSE 0
        END),0) AS compras,
        COALESCE(SUM(CASE
          WHEN COALESCE(e.entrega::date, e.data::date) BETWEEN (p.data_ini - INTERVAL '1 year')
                                AND (p.data_fim - INTERVAL '1 year')
            THEN ABS(COALESCE(m.quantidade::numeric,0))
          ELSE 0
        END),0) AS compras_ano_passado
      FROM movimento m
      INNER JOIN entradas e
        ON TRIM(m.auxiliar::text) = TRIM(('EN' || e.codigo)::char(8))
      CROSS JOIN p
      WHERE m.produto >= $1::char(8)
        AND m.produto <= $2::char(8)
        AND COALESCE(e.entrega::date, e.data::date) BETWEEN (p.data_ini - INTERVAL '1 year') AND p.data_fim
        AND COALESCE(TRIM(e.tipo::text),'')='10'
        AND TRIM(COALESCE(e.cfop::text,'')) IN ('1102','2102','3102')
        ${filtroEntrada}
      GROUP BY 1,2
    `;

    const sqlPedidos = `
      WITH p AS (
        SELECT
          $3::date AS data_ini,
          $4::date AS data_fim
      )
      SELECT
        LPAD(
          TRIM(COALESCE(NULLIF(pd.empresa::text,''),pdd.empresa::text)),
          2,
          '0'
        ) AS empresa,
        RIGHT(TRIM(pd.produto::text),2) AS tamanho,
        COALESCE(SUM(ABS(COALESCE(pd.pquantidade::numeric,0))),0) AS pedidos
      FROM pedidos_detalhes pd
      INNER JOIN pedidos pdd
        ON TRIM(pdd.codigo::text)=TRIM(pd.pedido::text)
      CROSS JOIN p
      WHERE pd.produto >= $1::char(8)
        AND pd.produto <= $2::char(8)
        AND TRIM(COALESCE(pdd.status::text,'')) IN ('A','C')
        AND pdd.previsao IS NOT NULL
        AND pdd.previsao::date BETWEEN p.data_ini AND p.data_fim
        ${filtroPedido}
      GROUP BY 1,2
    `;

    /*
     * LINHA DO TEMPO LIMITADA AO PERÍODO INFORMADO.
     * Não existe busca sem datas nem consulta desde a primeira movimentação.
     */
    const sqlLinhaVendas = `
      SELECT
        m.data::date AS data,
        'VENDA'::text AS tipo,
        COALESCE(SUM(CASE
          WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
          WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
            THEN -ABS(COALESCE(m.quantidade::numeric,0))
          ELSE 0
        END),0) AS quantidade
      FROM movimento m
      WHERE m.produto >= $1::char(8)
        AND m.produto <= $2::char(8)
        AND m.data::date BETWEEN $3::date AND $4::date
        ${filtroMovimento}
      GROUP BY 1
      HAVING COALESCE(SUM(CASE
        WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
          THEN ABS(COALESCE(m.quantidade::numeric,0))
        WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
          THEN -ABS(COALESCE(m.quantidade::numeric,0))
        ELSE 0
      END),0) <> 0
      ORDER BY 1
    `;

    const sqlLinhaCompras = `
      SELECT
        COALESCE(e.entrega::date,e.data::date) AS data,
        'COMPRA'::text AS tipo,
        COALESCE(SUM(ABS(COALESCE(m.quantidade::numeric,0))),0) AS quantidade
      FROM movimento m
      INNER JOIN entradas e
        ON TRIM(m.auxiliar::text) = TRIM(('EN' || e.codigo)::char(8))
      WHERE m.produto >= $1::char(8)
        AND m.produto <= $2::char(8)
        AND COALESCE(e.entrega::date,e.data::date) BETWEEN $3::date AND $4::date
        AND COALESCE(TRIM(e.tipo::text),'')='10'
        AND TRIM(COALESCE(e.cfop::text,'')) IN ('1102','2102','3102')
        ${filtroEntrada}
      GROUP BY 1
      HAVING COALESCE(SUM(ABS(COALESCE(m.quantidade::numeric,0))),0) <> 0
      ORDER BY 1
    `;

    /*
     * PREÇO NORMAL E PROMOÇÃO VIGENTE
     * Usa a mesma regra do Catálogo:
     * - preço normal: produtos.preco
     * - promoção: condicao000001
     * - somente promoção cuja data final ainda esteja vigente
     * - respeita a(s) empresa(s) selecionada(s) no filtro
     */
    const sqlPrecos = `
      SELECT
        COALESCE(p.preco::numeric,0) AS preco_normal,
        COALESCE(pr.valor_promocao,0) AS valor_promocao,
        TRIM(COALESCE(p.complemento::text,'')) AS complemento,
        COALESCE(p.custo::numeric,0) AS custo
      FROM produtos p
      LEFT JOIN LATERAL (
        SELECT
          COALESCE(
            NULLIF(TRIM(pp.condicao000001::text),'')::numeric,
            0
          ) AS valor_promocao
        FROM promocoes_produtos pp
        INNER JOIN promocoes_cadastro pc
          ON TRIM(pc.codigo::text) = TRIM(pp.promocao::text)
        WHERE pc.fim::date >= CURRENT_DATE
          AND (
            CASE
              WHEN LEFT(TRIM(pp.codigo),1) = 'P'
                THEN SUBSTRING(TRIM(pp.codigo),2,6)
              ELSE SUBSTRING(TRIM(pp.codigo),1,6)
            END
          ) = TRIM(p.codigo::text)
          ${filtroEmpresaPromocao}
        ORDER BY pp.cadastro DESC NULLS LAST, pp.promocao DESC
        LIMIT 1
      ) pr ON TRUE
      WHERE TRIM(p.codigo::text) = $1
      LIMIT 1
    `;

    const [rMovimento,rCompras,rPedidos,rPrecos,rLinhaVendas,rLinhaCompras] = await Promise.all([
      querySafe(sqlMovimento,paramsMov,180000),
      querySafe(sqlCompras,paramsComp,180000),
      querySafe(sqlPedidos,paramsPed,180000),
      querySafe(sqlPrecos,paramsPreco,180000),
      querySafe(sqlLinhaVendas,paramsMov,180000),
      querySafe(sqlLinhaCompras,paramsComp,180000)
    ]);

    const mapa = new Map();

    function obterLinha(empresa,tamanho){
      const emp = String(empresa || "").padStart(2,"0");
      const tam = String(tamanho || "").padStart(2,"0");
      const chave = `${emp}|${tam}`;

      if(!mapa.has(chave)){
        mapa.set(chave,{
          empresa:emp,
          tamanho:tam,
          vendas:0,
          venda_ano_passado:0,
          compras:0,
          compras_ano_passado:0,
          pedidos:0,
          estoque:0
        });
      }

      return mapa.get(chave);
    }

    for(const x of rMovimento.rows || []){
      const linha = obterLinha(x.empresa,x.tamanho);
      linha.vendas = Number(x.vendas || 0);
      linha.venda_ano_passado = Number(x.venda_ano_passado || 0);
      linha.estoque = Number(x.estoque || 0);
    }

    for(const x of rCompras.rows || []){
      const linha = obterLinha(x.empresa,x.tamanho);
      linha.compras = Number(x.compras || 0);
      linha.compras_ano_passado = Number(x.compras_ano_passado || 0);
    }

    for(const x of rPedidos.rows || []){
      const linha = obterLinha(x.empresa,x.tamanho);
      linha.pedidos = Number(x.pedidos || 0);
    }

    const detalhes = Array.from(mapa.values())
      .filter(x =>
        x.vendas !== 0 ||
        x.venda_ano_passado !== 0 ||
        x.compras !== 0 ||
        x.compras_ano_passado !== 0 ||
        x.pedidos !== 0 ||
        x.estoque !== 0
      )
      .sort((a,b) =>
        a.empresa.localeCompare(b.empresa,"pt-BR") ||
        Number(a.tamanho) - Number(b.tamanho)
      );

    const precosProduto = rPrecos.rows?.[0] || {};

    let proprietarios = [];

    try {
      const rProprietarios = await queryAtendimento(`
        SELECT
          empresa,
          primeira_compra,
          ultima_compra,
          quantidade_comprada,
          (ultima_compra >= CURRENT_DATE - INTERVAL '24 months') AS ativo24
        FROM jpdesk.transferencia_dono_produto
        WHERE produto = $1
          AND ativo = TRUE
        ORDER BY empresa
      `, [produto], 30000);

      proprietarios = (rProprietarios.rows || []).map(item => ({
        empresa:String(item.empresa || "").padStart(2,"0"),
        primeira_compra:item.primeira_compra,
        ultima_compra:item.ultima_compra,
        quantidade_comprada:Number(item.quantidade_comprada || 0),
        ativo24:Boolean(item.ativo24)
      }));
    } catch (erroProprietarios) {
      if (erroProprietarios.code !== "42P01") {
        throw erroProprietarios;
      }
    }

    res.json({
      ok:true,
      detalhes,
      empresas_filtradas:empList,
      preco_normal:Number(precosProduto.preco_normal || 0),
      valor_promocao:Number(precosProduto.valor_promocao || 0),
      complemento:String(precosProduto.complemento || "").trim(),
      custo:Number(precosProduto.custo || 0),
      linha_tempo:[
        ...(rLinhaVendas.rows || []).map(x => ({
          data:x.data,
          tipo:"VENDA",
          quantidade:Number(x.quantidade || 0)
        })),
        ...(rLinhaCompras.rows || []).map(x => ({
          data:x.data,
          tipo:"COMPRA",
          quantidade:Number(x.quantidade || 0)
        }))
      ].sort((a,b) => String(a.data).localeCompare(String(b.data))),
      proprietarios
    });
  }catch(e){
    console.error("Erro /api/otb-bi/produto-detalhes:",e);
    res.status(500).json({ok:false,erro:e.message});
  }
});


/* =========================================================
   OTB BI - DETALHES DE VÁRIOS PRODUTOS PARA EXPORTAÇÃO
   Retorna vendido, pedido e estoque por empresa e tamanho
   em uma única consulta, evitando uma chamada por produto.
   ========================================================= */
app.post("/api/otb-bi/produtos-detalhes-lote", async (req, res) => {
  try {
    const produtos = Array.from(
      new Set(
        (Array.isArray(req.body?.produtos) ? req.body.produtos : [])
          .map(codigo =>
            String(codigo || "")
              .replace(/\D/g, "")
              .padStart(6, "0")
              .slice(0, 6)
          )
          .filter(codigo => codigo.length === 6)
      )
    );

    const empresasRaw = String(req.body?.empresas || "").trim().toUpperCase();
    const dataIni = String(req.body?.data_ini || "").trim();
    const dataFim = String(req.body?.data_fim || "").trim();

    if (!produtos.length) {
      return res.json({
        ok: true,
        detalhes: [],
        empresas_filtradas: []
      });
    }

    const empList = await resolveEmpresasFiltro(empresasRaw);
    const params = [produtos, dataIni || null, dataFim || null];

    let filtroEmpresaMovimento = "";
    let filtroEmpresaPedido = "";

    if (empList.length) {
      params.push(empList);
      const pEmpresas = params.length;

      filtroEmpresaMovimento = `
        AND LPAD(TRIM(m.empresa::text),2,'0')
            = ANY($${pEmpresas}::text[])
      `;

      filtroEmpresaPedido = `
        AND LPAD(
          TRIM(COALESCE(NULLIF(pd.empresa::text,''), pdd.empresa::text)),
          2,
          '0'
        ) = ANY($${pEmpresas}::text[])
      `;
    }

    const sql = `
      WITH periodo AS (
        SELECT
          COALESCE($2::date, CURRENT_DATE - INTERVAL '3 MONTH')::date AS data_ini,
          COALESCE($3::date, CURRENT_DATE)::date AS data_fim
      ),

      movimento_grade AS (
        SELECT
          LEFT(TRIM(m.produto::text),6) AS produto,
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          RIGHT(LPAD(TRIM(m.produto::text),8,'0'),2) AS tamanho,

          SUM(
            CASE
              WHEN m.data::date BETWEEN p.data_ini AND p.data_fim
               AND TRIM(COALESCE(m.operacao::text,'')) = 'VE'
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN m.data::date BETWEEN p.data_ini AND p.data_fim
               AND TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS vendas,

          SUM(
            CASE
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(COALESCE(m.movimento::text,'')) = 'E'
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(COALESCE(m.movimento::text,'')) = 'S'
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS estoque

        FROM movimento m
        CROSS JOIN periodo p

        WHERE LEFT(TRIM(m.produto::text),6) = ANY($1::text[])
          ${filtroEmpresaMovimento}

        GROUP BY
          LEFT(TRIM(m.produto::text),6),
          LPAD(TRIM(m.empresa::text),2,'0'),
          RIGHT(LPAD(TRIM(m.produto::text),8,'0'),2)
      ),

      pedidos_grade AS (
        SELECT
          LEFT(TRIM(pd.produto::text),6) AS produto,

          LPAD(
            TRIM(COALESCE(NULLIF(pd.empresa::text,''), pdd.empresa::text)),
            2,
            '0'
          ) AS empresa,

          RIGHT(LPAD(TRIM(pd.produto::text),8,'0'),2) AS tamanho,

          SUM(
            ABS(COALESCE(pd.pquantidade::numeric,0))
          ) AS pedidos

        FROM pedidos_detalhes pd

        INNER JOIN pedidos pdd
          ON TRIM(pdd.codigo::text) = TRIM(pd.pedido::text)

        CROSS JOIN periodo p

        WHERE LEFT(TRIM(pd.produto::text),6) = ANY($1::text[])
          AND TRIM(COALESCE(pdd.status::text,'')) IN ('A','C')
          AND pdd.previsao IS NOT NULL
          AND pdd.previsao::date BETWEEN p.data_ini AND p.data_fim
          ${filtroEmpresaPedido}

        GROUP BY
          LEFT(TRIM(pd.produto::text),6),

          LPAD(
            TRIM(COALESCE(NULLIF(pd.empresa::text,''), pdd.empresa::text)),
            2,
            '0'
          ),

          RIGHT(LPAD(TRIM(pd.produto::text),8,'0'),2)
      ),

      chaves AS (
        SELECT produto, empresa, tamanho FROM movimento_grade
        UNION
        SELECT produto, empresa, tamanho FROM pedidos_grade
      )

      SELECT
        c.produto,
        c.empresa,
        c.tamanho,
        COALESCE(m.vendas,0) AS vendas,
        COALESCE(p.pedidos,0) AS pedidos,
        COALESCE(m.estoque,0) AS estoque

      FROM chaves c

      LEFT JOIN movimento_grade m
        ON m.produto = c.produto
       AND m.empresa = c.empresa
       AND m.tamanho = c.tamanho

      LEFT JOIN pedidos_grade p
        ON p.produto = c.produto
       AND p.empresa = c.empresa
       AND p.tamanho = c.tamanho

      WHERE COALESCE(m.vendas,0) <> 0
         OR COALESCE(p.pedidos,0) <> 0
         OR COALESCE(m.estoque,0) <> 0

      ORDER BY
        c.produto,
        c.empresa,
        c.tamanho
    `;

    const r = await querySafe(sql, params, 180000);

    res.json({
      ok: true,
      detalhes: r.rows || [],
      empresas_filtradas: empList
    });

  } catch (e) {
    console.error("Erro /api/otb-bi/produtos-detalhes-lote:", e);

    res.status(500).json({
      ok: false,
      erro: e.message
    });
  }
});

app.get("/api/otb-bi/empresas", async (req, res) => {
  try {
    const r = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
        TRIM(COALESCE(NULLIF(apelido,''), NULLIF(nome,''), codigo::text)) AS nome
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
      ORDER BY 1
    `, [], 60000);

    res.json({ ok:true, empresas:r.rows || [] });
  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/otb-bi/departamentos", async (req, res) => {
  try {
    const r = await querySafe(`
      SELECT
        TRIM(codigo::text) AS codigo,
        TRIM(descricao::text) AS descricao
      FROM departamentos
      WHERE COALESCE(TRIM(descricao::text),'') <> ''
      ORDER BY descricao
      LIMIT 300
    `, [], 60000);

    res.json({ ok:true, departamentos:r.rows || [] });
  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
// ======================================================
// AUTOCOMPLETE DE GRUPOS OTB
// ======================================================
app.get("/api/otb-bi/grupos", async (req, res) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .toUpperCase();

    if(q.length < 2){
      return res.json({
        ok:true,
        grupos:[]
      });
    }

    const r = await querySafe(`
      SELECT DISTINCT
        TRIM(g.codigo::text) AS codigo,
        TRIM(g.descricao::text) AS descricao

      FROM grupos g

      WHERE COALESCE(
              TRIM(g.descricao::text),
              ''
            ) <> ''

        AND (
          UPPER(TRIM(g.codigo::text))
            ILIKE $1

          OR UPPER(TRIM(g.descricao::text))
            ILIKE $1

          OR UPPER(
            TRIM(g.codigo::text) ||
            ' - ' ||
            TRIM(g.descricao::text)
          ) ILIKE $1
        )

      ORDER BY descricao
      LIMIT 50
    `, [`%${q}%`], 30000);

    res.json({
      ok:true,
      grupos:r.rows || []
    });

  } catch(e) {
    console.error(
      "Erro /api/otb-bi/grupos:",
      e
    );

    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});


// ======================================================
// AUTOCOMPLETE DE MARCAS OTB
// ======================================================
app.get("/api/otb-bi/marcas", async (req, res) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .toUpperCase();

    if(q.length < 2){
      return res.json({
        ok:true,
        marcas:[]
      });
    }

    const r = await querySafe(`
      SELECT DISTINCT
        TRIM(m.codigo::text) AS codigo,
        TRIM(m.descricao::text) AS descricao

      FROM marcas m

      WHERE COALESCE(
              TRIM(m.descricao::text),
              ''
            ) <> ''

        AND (
          UPPER(TRIM(m.codigo::text))
            ILIKE $1

          OR UPPER(TRIM(m.descricao::text))
            ILIKE $1

          OR UPPER(
            TRIM(m.codigo::text) ||
            ' - ' ||
            TRIM(m.descricao::text)
          ) ILIKE $1
        )

      ORDER BY descricao
      LIMIT 50
    `, [`%${q}%`], 30000);

    res.json({
      ok:true,
      marcas:r.rows || []
    });

  } catch(e) {
    console.error(
      "Erro /api/otb-bi/marcas:",
      e
    );

    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});


// ======================================================
// AUTOCOMPLETE DE COMPLEMENTOS OTB
// ======================================================
app.get("/api/otb-bi/complementos", async (req, res) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .toUpperCase();

    if(q.length < 2){
      return res.json({
        ok:true,
        complementos:[]
      });
    }

    const r = await querySafe(`
      SELECT DISTINCT
        TRIM(p.complemento::text) AS complemento

      FROM produtos p

      WHERE COALESCE(
              TRIM(p.complemento::text),
              ''
            ) <> ''

        AND UPPER(
              TRIM(p.complemento::text)
            ) ILIKE $1

      ORDER BY complemento
      LIMIT 50
    `, [`%${q}%`], 30000);

    res.json({
      ok:true,
      complementos:r.rows || []
    });

  } catch(e) {
    console.error(
      "Erro /api/otb-bi/complementos:",
      e
    );

    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});
app.get("/api/otb-bi/resumo", async (req, res) => {
  try {
    const empresasRaw = String(req.query.empresas || "").trim();
    const departamentoRaw = String(req.query.departamento || "").trim();
    const empList = await resolveEmpresasFiltro(empresasRaw);

    const janelaMeses = Math.max(1, Math.min(12, Number(req.query.janela || 3)));
    const params = [janelaMeses];
    const pJanela = 1;

    let filtroEmpMov = "";
    let filtroEmpPed = "";
    let filtroDepartamento = "";

    if (empList.length) {
      params.push(empList);
      filtroEmpMov = `AND LPAD(TRIM(m.empresa::text),2,'0') = ANY($${params.length}::text[])`;
      filtroEmpPed = `AND LPAD(TRIM(ped.empresa::text),2,'0') = ANY($${params.length}::text[])`;
    }

    if (departamentoRaw) {
      params.push(`%${departamentoRaw}%`);
      filtroDepartamento = `
        AND (
          TRIM(COALESCE(d.codigo::text,'')) ILIKE $${params.length}
          OR TRIM(COALESCE(d.descricao::text,'')) ILIKE $${params.length}
          OR (TRIM(COALESCE(d.codigo::text,'')) || ' - ' || TRIM(COALESCE(d.descricao::text,''))) ILIKE $${params.length}
        )
      `;
    }

    const r = await querySafe(`
      WITH mov AS (
        SELECT
          LEFT(TRIM(m.produto::text),6) AS codigo,

          SUM(
            CASE
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(m.movimento::text) = 'E'
                THEN COALESCE(m.quantidade::numeric,0)

              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(m.movimento::text) = 'S'
                THEN -COALESCE(m.quantidade::numeric,0)

              ELSE 0
            END
          ) AS estoque,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS vendas,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'EN'
               AND TRIM(COALESCE(m.cfop::text,'')) IN ('1102','2102','3102')
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN ABS(COALESCE(m.quantidade::numeric,0))
              ELSE 0
            END
          ) AS compras

        FROM movimento m
        WHERE (
            COALESCE(m.estoque,false) = TRUE
            OR (
              TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC','EN')
              AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
            )
          )
          ${filtroEmpMov}
        GROUP BY LEFT(TRIM(m.produto::text),6)
      ),

      ped AS (
        SELECT
          LEFT(TRIM(pd.produto::text),6) AS codigo,
          SUM(COALESCE(pd.pquantidade::numeric,0)) AS pedidos
        FROM pedidos ped
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido::text) = TRIM(ped.codigo::text)
        WHERE TRIM(COALESCE(ped.status::text,'')) IN ('A','C')
          ${filtroEmpPed}
        GROUP BY LEFT(TRIM(pd.produto::text),6)
      ),

      base AS (
        SELECT
          COALESCE(mov.codigo, ped.codigo) AS codigo,
          COALESCE(mov.estoque,0) AS estoque,
          COALESCE(mov.vendas,0) AS vendas,
          COALESCE(mov.compras,0) AS compras,
          COALESCE(ped.pedidos,0) AS pedidos
        FROM mov
        FULL JOIN ped
          ON ped.codigo = mov.codigo
      )

      SELECT
        COUNT(DISTINCT base.codigo)::int AS itens,
        COALESCE(SUM(base.vendas),0) AS vendas,
        COALESCE(SUM(base.compras),0) AS compras,
        COALESCE(SUM(base.pedidos),0) AS pedidos,
        COALESCE(SUM(base.estoque),0) AS estoque
      FROM base
      LEFT JOIN produtos prod
        ON TRIM(prod.codigo::text) = base.codigo
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text) = TRIM(prod.departamento::text)
      WHERE 1=1
        ${filtroDepartamento}
    `, params, 120000);

    const x = r.rows?.[0] || {};
    const vendas = Number(x.vendas || 0);
    const estoque = Number(x.estoque || 0);
    const mediaMensal = janelaMeses > 0 ? vendas / janelaMeses : 0;

    res.json({
      ok:true,
      resumo:{
        itens:Number(x.itens || 0),
        vendas,
        compras:Number(x.compras || 0),
        pedidos:Number(x.pedidos || 0),
        estoque,
        cobertura: mediaMensal > 0 ? Math.round((estoque / mediaMensal) * 30) : 0,
        giro: estoque > 0 ? Number((vendas / estoque).toFixed(2)) : 0
      }
    });

  } catch (e) {
    console.error("Erro /api/otb-bi/resumo:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/otb-bi/graficos", async (req, res) => {
  try {
    const visao = String(req.query.visao || "marca").trim().toLowerCase();
    const empresasRaw = String(req.query.empresas || "").trim();
    const departamentoRaw = String(req.query.departamento || "").trim();
    const selecoesRaw = String(req.query.selecoes || "").trim();

    const empList = await resolveEmpresasFiltro(empresasRaw);
    const selecoes = parseMultiTokens(selecoesRaw);

    const campoVisao = {
      marca: "COALESCE(NULLIF(TRIM(mk.descricao),''),'SEM MARCA')",
      fornecedor: "COALESCE(NULLIF(TRIM(pe.nome),''),'SEM FORNECEDOR')",
      departamento: "COALESCE(NULLIF(TRIM(d.descricao),''),'SEM DEPARTAMENTO')",
      grupo: "COALESCE(NULLIF(TRIM(g.descricao),''),'SEM GRUPO')",
      linha: "COALESCE(NULLIF(TRIM(l.descricao),''),'SEM LINHA')",
      cor: "COALESCE(NULLIF(TRIM(p.corx),''),'SEM COR')",
      complemento: "COALESCE(NULLIF(TRIM(p.complemento),''),'SEM COMPLEMENTO')",
      campanha: "COALESCE(NULLIF(TRIM(p.colecao),''),'SEM CAMPANHA')",
      subgrupo: "COALESCE(NULLIF(TRIM(p.subgrupo::text),''),'SEM SUBGRUPO')",
      numeracao: "RIGHT(TRIM(base.produto8),2)"
    }[visao] || "COALESCE(NULLIF(TRIM(mk.descricao),''),'SEM MARCA')";

    const janelaMeses = Math.max(1, Math.min(12, Number(req.query.janela || 3)));
    const params = [janelaMeses];
    const pJanela = 1;

    let filtroEmpMov = "";
    let filtroEmpPed = "";
    let filtroDepartamento = "";

    if (empList.length) {
      params.push(empList);
      filtroEmpMov = `AND LPAD(TRIM(m.empresa::text),2,'0') = ANY($${params.length}::text[])`;
      filtroEmpPed = `AND LPAD(TRIM(ped.empresa::text),2,'0') = ANY($${params.length}::text[])`;
    }

    if (departamentoRaw) {
      params.push(`%${departamentoRaw}%`);
      filtroDepartamento = `
        AND (
          TRIM(COALESCE(d.codigo::text,'')) ILIKE $${params.length}
          OR TRIM(COALESCE(d.descricao::text,'')) ILIKE $${params.length}
          OR (TRIM(COALESCE(d.codigo::text,'')) || ' - ' || TRIM(COALESCE(d.descricao::text,''))) ILIKE $${params.length}
        )
      `;
    }

    let filtroSelecao = "";

    if (selecoes.length) {
      params.push(selecoes);
      filtroSelecao = `AND ${campoVisao} = ANY($${params.length}::text[])`;
    }

    const cteBase = `
      WITH mov AS (
        SELECT
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto::text),6) AS codigo,
          TRIM(m.produto::text) AS produto8,

          SUM(
            CASE
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(m.movimento::text) = 'E'
                THEN COALESCE(m.quantidade::numeric,0)

              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(m.movimento::text) = 'S'
                THEN -COALESCE(m.quantidade::numeric,0)

              ELSE 0
            END
          ) AS estoque,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS vendas,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'EN'
               AND TRIM(COALESCE(m.cfop::text,'')) IN ('1102','2102','3102')
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN ABS(COALESCE(m.quantidade::numeric,0))
              ELSE 0
            END
          ) AS compras

        FROM movimento m
        WHERE (
            COALESCE(m.estoque,false) = TRUE
            OR (
              TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC','EN')
              AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
            )
          )
          ${filtroEmpMov}
        GROUP BY
          LPAD(TRIM(m.empresa::text),2,'0'),
          LEFT(TRIM(m.produto::text),6),
          TRIM(m.produto::text)
      ),

      ped AS (
        SELECT
          LPAD(TRIM(ped.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(pd.produto::text),6) AS codigo,
          TRIM(pd.produto::text) AS produto8,
          SUM(COALESCE(pd.pquantidade::numeric,0)) AS pedidos
        FROM pedidos ped
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido::text) = TRIM(ped.codigo::text)
        WHERE TRIM(COALESCE(ped.status::text,'')) IN ('A','C')
          ${filtroEmpPed}
        GROUP BY
          LPAD(TRIM(ped.empresa::text),2,'0'),
          LEFT(TRIM(pd.produto::text),6),
          TRIM(pd.produto::text)
      ),

      base AS (
        SELECT
          COALESCE(mov.empresa, ped.empresa) AS empresa,
          COALESCE(mov.codigo, ped.codigo) AS codigo,
          COALESCE(mov.produto8, ped.produto8) AS produto8,
          COALESCE(mov.estoque,0) AS estoque,
          COALESCE(mov.vendas,0) AS vendas,
          COALESCE(mov.compras,0) AS compras,
          COALESCE(ped.pedidos,0) AS pedidos
        FROM mov
        FULL JOIN ped
          ON ped.empresa = mov.empresa
         AND ped.produto8 = mov.produto8
      )
    `;

    const fromBase = `
      FROM base
      LEFT JOIN produtos p
        ON TRIM(p.codigo::text) = base.codigo
      LEFT JOIN marcas mk
        ON TRIM(mk.codigo::text) = TRIM(p.marca::text)
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text) = TRIM(p.departamento::text)
      LEFT JOIN grupos g
        ON TRIM(g.codigo::text) = TRIM(p.grupo::text)
      LEFT JOIN linhas l
        ON TRIM(l.codigo::text) = TRIM(p.linha::text)
      LEFT JOIN pessoas pe
        ON TRIM(pe.codigo::text) = TRIM(p.fornecedor::text)
      WHERE 1=1
        ${filtroDepartamento}
        ${filtroSelecao}
    `;

    const rEmpresas = await querySafe(`
      ${cteBase}
      SELECT
        base.empresa AS empresa,
        base.empresa AS nome,
        SUM(base.compras) AS compras,
        SUM(base.vendas) AS vendas,
        SUM(base.pedidos) AS pedidos,
        SUM(base.estoque) AS estoque
      ${fromBase}
      GROUP BY base.empresa
      ORDER BY estoque DESC
      LIMIT 25
    `, params, 120000);

    const rVisao = await querySafe(`
      ${cteBase}
      SELECT
        ${campoVisao} AS valor,
        ${campoVisao} AS nome,
        SUM(base.compras) AS compras,
        SUM(base.vendas) AS vendas,
        SUM(base.pedidos) AS pedidos,
        SUM(base.estoque) AS estoque
      ${fromBase}
      GROUP BY ${campoVisao}
      ORDER BY estoque DESC
      LIMIT 25
    `, params, 120000);

    res.json({
      ok:true,
      empresas:rEmpresas.rows || [],
      visao:rVisao.rows || []
    });

  } catch (e) {
    console.error("Erro /api/otb-bi/graficos:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/otb-bi/tabelas", async (req, res) => {
  try {
    const empresasRaw = String(req.query.empresas || "").trim();
    const departamentoRaw = String(req.query.departamento || "").trim();
    const empList = await resolveEmpresasFiltro(empresasRaw);

    const janelaMeses = Math.max(1, Math.min(12, Number(req.query.janela || 3)));
    const params = [janelaMeses];
    const pJanela = 1;

    let filtroEmpMov = "";
    let filtroEmpPed = "";
    let filtroDepartamento = "";

    if (empList.length) {
      params.push(empList);
      filtroEmpMov = `AND LPAD(TRIM(m.empresa::text),2,'0') = ANY($${params.length}::text[])`;
      filtroEmpPed = `AND LPAD(TRIM(ped.empresa::text),2,'0') = ANY($${params.length}::text[])`;
    }

    if (departamentoRaw) {
      params.push(`%${departamentoRaw}%`);
      filtroDepartamento = `
        AND (
          TRIM(COALESCE(d.codigo::text,'')) ILIKE $${params.length}
          OR TRIM(COALESCE(d.descricao::text,'')) ILIKE $${params.length}
          OR (TRIM(COALESCE(d.codigo::text,'')) || ' - ' || TRIM(COALESCE(d.descricao::text,''))) ILIKE $${params.length}
        )
      `;
    }

    const rProdutos = await querySafe(`
      WITH mov AS (
        SELECT
          LEFT(TRIM(m.produto::text),6) AS codigo,

          SUM(
            CASE
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(m.movimento::text) = 'E'
                THEN COALESCE(m.quantidade::numeric,0)

              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(m.movimento::text) = 'S'
                THEN -COALESCE(m.quantidade::numeric,0)

              ELSE 0
            END
          ) AS estoque,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN ABS(COALESCE(m.quantidade::numeric,0))

              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN -ABS(COALESCE(m.quantidade::numeric,0))

              ELSE 0
            END
          ) AS vendas,

          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'EN'
               AND TRIM(COALESCE(m.cfop::text,'')) IN ('1102','2102','3102')
               AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
                THEN ABS(COALESCE(m.quantidade::numeric,0))
              ELSE 0
            END
          ) AS compras

        FROM movimento m
        WHERE (
            COALESCE(m.estoque,false) = TRUE
            OR (
              TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC','EN')
              AND m.data::date >= COALESCE($${pDataIni}::date, CURRENT_DATE - INTERVAL '3 MONTH')
            )
          )
          ${filtroEmpMov}
        GROUP BY LEFT(TRIM(m.produto::text),6)
      ),

      ped AS (
        SELECT
          LEFT(TRIM(pd.produto::text),6) AS codigo,
          SUM(COALESCE(pd.pquantidade::numeric,0)) AS pedidos
        FROM pedidos ped
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido::text) = TRIM(ped.codigo::text)
        WHERE TRIM(COALESCE(ped.status::text,'')) IN ('A','C')
          ${filtroEmpPed}
        GROUP BY LEFT(TRIM(pd.produto::text),6)
      ),

      base AS (
        SELECT
          COALESCE(mov.codigo, ped.codigo) AS codigo,
          COALESCE(mov.estoque,0) AS estoque,
          COALESCE(mov.vendas,0) AS vendas,
          COALESCE(mov.compras,0) AS compras,
          COALESCE(ped.pedidos,0) AS pedidos
        FROM mov
        FULL JOIN ped
          ON ped.codigo = mov.codigo
      )

      SELECT
        base.codigo,
        COALESCE(MAX(prod.descricao),'') AS descricao,
        SUM(base.vendas) AS vendas,
        SUM(base.compras) AS compras,
        SUM(base.pedidos) AS pedidos,
        SUM(base.estoque) AS estoque
      FROM base
      LEFT JOIN produtos prod
        ON TRIM(prod.codigo::text) = base.codigo
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text) = TRIM(prod.departamento::text)
      WHERE 1=1
        ${filtroDepartamento}
      GROUP BY base.codigo
      HAVING
        COALESCE(SUM(base.vendas),0) <> 0
        OR COALESCE(SUM(base.compras),0) <> 0
        OR COALESCE(SUM(base.pedidos),0) <> 0
        OR COALESCE(SUM(base.estoque),0) <> 0
      ORDER BY vendas DESC, estoque DESC
      LIMIT 100
    `, params, 120000);

    const produtos = rProdutos.rows || [];

    const criticos = produtos
      .filter(x =>
        Number(x.estoque || 0) > 0 &&
        Number(x.estoque || 0) <= 12
      )
      .map(x => ({
        ...x,
        acao: Number(x.vendas || 0) > 0 ? "Reposição" : "Avaliar",
        cobertura: 0
      }));

    res.json({
      ok:true,
      produtos,
      criticos
    });

  } catch (e) {
    console.error("Erro /api/otb-bi/tabelas:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});


// ======================================================
// CATALOGO
// ======================================================
app.get("/produtos", async (req, res) => {
  const tInicio = Date.now();

  try {
const {
  busca = "",
  empresas = "",
  tamanho = "",
  marca = "",
  departamento = "",
  grupo = "",
  fornecedor = "",
  linha = "",
  colecao = "",
  cor = "",
  complemento = "",
  campanha = "",
  ruptura = "",
  limit = "500",
  ordem_custo = "",
  ordenar_por = "",
} = req.query;


const ordemCusto = String(ordem_custo || req.query.ordemCusto || "").trim().toLowerCase();
const ordenarPor = String(ordenar_por || req.query.ordenarPor || "").trim().toLowerCase();
const senhaCusto = String(req.query.senha_custo || req.query.senhaCusto || "").trim();

function cookieCustoOk(req) {
  return String(req.headers.cookie || "").includes("CAT_CUSTO_OK=1");
}

    const minPrecoRaw = req.query.min_preco ?? req.query.minPreco ?? "";
const maxPrecoRaw = req.query.max_preco ?? req.query.maxPreco ?? "";
const minCustoRaw = req.query.min_custo ?? req.query.minCusto ?? "";
const maxCustoRaw = req.query.max_custo ?? req.query.maxCusto ?? "";
const minPromoRaw = req.query.min_promo ?? req.query.minPromo ?? "";
const maxPromoRaw = req.query.max_promo ?? req.query.maxPromo ?? "";

const minPreco = parseNumBR(minPrecoRaw);
const maxPreco = parseNumBR(maxPrecoRaw);
const minCusto = parseNumBR(minCustoRaw);
const maxCusto = parseNumBR(maxCustoRaw);
const minPromo = parseNumBR(minPromoRaw);
const maxPromo = parseNumBR(maxPromoRaw);
const pediuFiltroCusto =
  minCusto !== null ||
  maxCusto !== null ||
  ordemCusto === "crescente" ||
  ordemCusto === "decrescente";

if (pediuFiltroCusto && !senhaCustoOk(senhaCusto) && !cookieCustoOk(req)) {
  return res.status(403).json({
    erro: "Senha necessária para usar filtro/ordenação de custo."
  });
}
    const lim = Math.min(Math.max(parseInt(limit || "500", 10) || 500, 1), 10000);
    const rupturaNum = clampInt(ruptura, 0, 6, 0);
    
    const depCodigos = await resolveDepartamentoCodigos(departamento);
const grpCodigos = await resolveGrupoCodigos(grupo);
const marcaCodigos = await resolveMarcaCodigos(marca);
const fornCodigos = await resolveFornecedorCodigos(fornecedor);
const linhaTokens = parseMultiTokens(linha);
const colecaoTokensRaw = parseMultiTokens(colecao);

const colecaoIncluir = colecaoTokensRaw
  .filter(x => !String(x).trim().startsWith("<>"))
  .join(";");

const colecaoExcluirTokens = colecaoTokensRaw
  .filter(x => String(x).trim().startsWith("<>"))
  .map(x => String(x).trim().replace(/^<>/, "").trim())
  .filter(Boolean);

const colecaoCodigos = await resolveColecaoCodigos(colecaoIncluir);
const complementoTokens = parseMultiTokens(complemento);
const campanhaTokens = parseMultiTokens(campanha);

    const params = [];
    let where = "WHERE COALESCE(p.desativar,false) = false";

    const joins = `
      LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(p.departamento)
      LEFT JOIN marcas mk       ON TRIM(mk.codigo) = TRIM(p.marca)
      LEFT JOIN grupos g        ON TRIM(g.codigo) = TRIM(p.grupo)
      LEFT JOIN linhas l        ON TRIM(l.codigo) = TRIM(p.linha)
      LEFT JOIN colecoes col    ON TRIM(col.codigo) = TRIM(p.colecao)
      LEFT JOIN LATERAL (
        SELECT
          cod_fornecedor AS fornecedor_codigo,
          ${fornecedorNomeExpr("pe")} AS fornecedor_nome,
          CASE
            WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
              THEN cod_fornecedor || ' - ' || ${fornecedorNomeExpr("pe")}
            ELSE cod_fornecedor
          END AS fornecedor
        FROM (
          SELECT
            COALESCE(
              NULLIF(TRIM(p.fornecedor::text), ''),
              (
                SELECT TRIM(pf1.fornecedor::text)
                FROM produtos_fornecedor pf1
                WHERE TRIM(pf1.produtoseta::text) = TRIM(p.codigo::text)
                ORDER BY TRIM(pf1.codigo::text)
                LIMIT 1
              )
            ) AS cod_fornecedor
        ) z
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = z.cod_fornecedor
      ) pf ON TRUE
    `;

    const b = String(busca || "").trim();
if (b) {
  const like = `%${b}%`;
  params.push(like);
  const p1 = `$${params.length}`;

  where += `
    AND (
      TRIM(p.codigo) ILIKE ${p1}
      OR COALESCE(p.descricao,'') ILIKE ${p1}
      OR COALESCE(p.referencia,'') ILIKE ${p1}
      OR EXISTS (
        SELECT 1
        FROM barras br
        WHERE TRIM(COALESCE(br.codigo::text, '')) ILIKE ${p1}
          AND LEFT(LPAD(TRIM(COALESCE(br.produto::text, '')), 8, '0'), 6) = TRIM(p.codigo)
      )
    )
  `;
}

    if (cor) {
      params.push(`%${String(cor).trim()}%`);
      where += ` AND COALESCE(p.corx,'') ILIKE $${params.length}`;
    }

if (complementoTokens.length) {
  const conds = [];
  for (const token of complementoTokens) {
    params.push(`%${token}%`);
    conds.push(`COALESCE(p.complemento,'') ILIKE $${params.length}`);
  }
  where += ` AND (${conds.join(" OR ")})`;
}

if (marcaCodigos.length) {
  const start = params.length + 1;
  marcaCodigos.forEach((c) => params.push(c));
  const ph = marcaCodigos.map((_, i) => `$${start + i}`).join(",");
  where += ` AND TRIM(p.marca) IN (${ph})`;
}

if (depCodigos.length) {
  const start = params.length + 1;
  depCodigos.forEach((c) => params.push(c));
  const ph = depCodigos.map((_, i) => `$${start + i}`).join(",");
  where += ` AND TRIM(p.departamento) IN (${ph})`;
}

if (grpCodigos.length) {
  const start = params.length + 1;
  grpCodigos.forEach((c) => params.push(c));
  const ph = grpCodigos.map((_, i) => `$${start + i}`).join(",");
  where += ` AND TRIM(p.grupo) IN (${ph})`;
}

    if (fornCodigos.length) {
      const start = params.length + 1;
      fornCodigos.forEach((c) => params.push(c));
      const ph = fornCodigos.map((_, i) => `$${start + i}`).join(",");
      where += ` AND TRIM(COALESCE(pf.fornecedor_codigo, '')) IN (${ph})`;
    }

    if (linhaTokens.length) {
  const conds = [];

  for (const ln of linhaTokens) {
    params.push(ln, `%${ln}%`, `%${ln}%`);
    conds.push(`
      (
        TRIM(p.linha) = $${params.length - 2}
        OR COALESCE(l.descricao,'') ILIKE $${params.length - 1}
        OR TRIM(p.linha) ILIKE $${params.length}
      )
    `);
  }

  where += ` AND (${conds.join(" OR ")})`;
}

if (colecaoCodigos.length) {
  const start = params.length + 1;

  colecaoCodigos.forEach((c) => params.push(c));

  const ph = colecaoCodigos
    .map((_, i) => `$${start + i}`)
    .join(",");

  where += ` AND TRIM(p.colecao) IN (${ph})`;
}

if (colecaoExcluirTokens.length) {
  for (const token of colecaoExcluirTokens) {
    params.push(`%${token}%`);
    where += `
      AND (
        COALESCE(TRIM(p.colecao::text),'') NOT ILIKE $${params.length}
        AND COALESCE(TRIM(col.descricao::text),'') NOT ILIKE $${params.length}
      )
    `;
  }
}

    if (minPreco !== null) {
  params.push(minPreco);
  where += ` AND COALESCE(p.preco::numeric,0) >= $${params.length}`;
}

if (maxPreco !== null) {
  params.push(maxPreco);
  where += ` AND COALESCE(p.preco::numeric,0) <= $${params.length}`;
}

if (minCusto !== null) {
   params.push(minCusto);
   where += ` AND COALESCE(p.custo::numeric,0) >= $${params.length}`;
 }

 if (maxCusto !== null) {
   params.push(maxCusto);
   where += ` AND COALESCE(p.custo::numeric,0) <= $${params.length}`;
 }

    const empList = await resolveEmpresasFiltro(empresas);
    let empPlaceholders = "";
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      empPlaceholders = empList.map((_, i) => `$${start + i}`).join(",");
    }

    const tam = parseTam(tamanho);
    let sizeFilterSql = "";
    let sizeFilterPedidosSql = "";
    if (tam) {
      params.push(tam);
      sizeFilterSql = ` AND RIGHT(TRIM(m.produto)::text, 2) = $${params.length} `;
      sizeFilterPedidosSql = ` AND RIGHT(TRIM(pd.produto)::text, 2) = $${params.length} `;
    }

    const promoProdExpr = `
      CASE
        WHEN LEFT(TRIM(pp.codigo), 1) = 'P' THEN SUBSTRING(TRIM(pp.codigo), 2, 6)
        ELSE SUBSTRING(TRIM(pp.codigo), 1, 6)
      END
    `;
    const promoEmpExpr = `
      CASE
        WHEN LEFT(TRIM(pp.codigo), 1) = 'P' THEN SUBSTRING(TRIM(pp.codigo), 8, 2)
        ELSE SUBSTRING(TRIM(pp.codigo), 7, 2)
      END
    `;
    const promoValExpr = `
      COALESCE(NULLIF(TRIM(pp.condicao000001::text), '')::numeric, 0)
    `;

    let promoRangeWhere = "";
    if (minPromo !== null) {
      params.push(minPromo);
      promoRangeWhere += ` AND COALESCE(pa.promocao_valor,0) >= $${params.length} `;
    }
    if (maxPromo !== null) {
      params.push(maxPromo);
      promoRangeWhere += ` AND COALESCE(pa.promocao_valor,0) <= $${params.length} `;
    }

    let estoqueFinalWhere = `WHERE COALESCE(et.estoque,0) <> 0`;
    if (rupturaNum >= 1 && rupturaNum <= 6) {
      params.push(rupturaNum);
      estoqueFinalWhere = `WHERE COALESCE(et.estoque,0) BETWEEN 1 AND $${params.length}`;
    }

    let orderBySql = `
  COALESCE(et.estoque,0) DESC,
  COALESCE(pt.pedidos_total,0) DESC,
  pf.descricao
`;

if (ordenarPor === "descricao") {
  orderBySql = `
    pf.descricao ASC,
    pf.codigo ASC
  `;
} else if (ordemCusto === "crescente") {
  orderBySql = `
    COALESCE(pf.custo,0) ASC,
    COALESCE(et.estoque,0) DESC,
    pf.descricao
  `;
} else if (ordemCusto === "decrescente") {
  orderBySql = `
    COALESCE(pf.custo,0) DESC,
    COALESCE(et.estoque,0) DESC,
    pf.descricao
  `;
} else if (ordemCusto === "mov_venda_2d") {
  orderBySql = `
    COALESCE(vd.mov_venda_2d,0) DESC,
    COALESCE(et.estoque,0) DESC,
    pf.descricao
  `;
} else if (ordemCusto === "mov_venda_1m") {
  orderBySql = `
    COALESCE(vd.mov_venda_1m,0) DESC,
    COALESCE(et.estoque,0) DESC,
    pf.descricao
  `;
} else if (ordemCusto === "mov_venda_2m") {
  orderBySql = `
    COALESCE(vd.mov_venda_2m,0) DESC,
    COALESCE(et.estoque,0) DESC,
    pf.descricao
  `;
} else if (ordemCusto === "promocao_data") {
  orderBySql = `
    pa.cadastro DESC NULLS LAST,
    COALESCE(et.estoque,0) DESC,
    pf.descricao
  `;
}

    params.push(lim);
    const limParam = params.length;

    const sql = `
      WITH produtos_filtrados AS (
        SELECT
          TRIM(p.codigo) AS codigo,
          TRIM(p.descricao) AS descricao,
          TRIM(p.corx) AS cor,
          TRIM(p.referencia) AS referencia,
          TRIM(p.complemento) AS complemento,
          TRIM(mk.descricao) AS marca,
          TRIM(d.descricao)  AS departamento,
          TRIM(g.descricao)  AS grupo,
          TRIM(COALESCE(pf.fornecedor, '')) AS fornecedor,
          TRIM(p.linha)      AS linha_codigo,
          TRIM(l.descricao)   AS linha,
TRIM(p.colecao)     AS colecao_codigo,
TRIM(col.descricao) AS colecao,
p.preco,
p.custo,
p.atualizado AS data_atualizacao
        FROM produtos p
        ${joins}
        ${where}
      ),

      est_raw AS (
        SELECT
          LEFT(TRIM(m.produto)::text, 6)  AS cod_produto,
          RIGHT(TRIM(m.produto)::text, 2) AS tamanho,
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          SUM(${sumMovExpr("m")}) AS quantidade
        FROM movimento m
        JOIN produtos_filtrados pf
          ON pf.codigo = LEFT(TRIM(m.produto)::text, 6)
        WHERE m.estoque
        ${empList.length ? ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${empPlaceholders}) ` : ""}
        ${sizeFilterSql}
        GROUP BY
          LEFT(TRIM(m.produto)::text, 6),
          RIGHT(TRIM(m.produto)::text, 2),
          LPAD(TRIM(m.empresa::text), 2, '0')
      ),

      est_total AS (
        SELECT cod_produto, SUM(quantidade) AS estoque
        FROM est_raw
        GROUP BY cod_produto
      ),

      est_empresas AS (
        SELECT
          cod_produto,
          STRING_AGG(DISTINCT empresa, ', ' ORDER BY empresa) AS empresas
        FROM est_raw
        WHERE COALESCE(quantidade,0) <> 0
        GROUP BY cod_produto
      ),

            vendas_agg AS (
        SELECT
          LEFT(TRIM(m.produto)::text, 6) AS cod_produto,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
               AND COALESCE(m.data::date, CURRENT_DATE) >= CURRENT_DATE - INTERVAL '2 days'
              THEN ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS mov_venda_2d,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
               AND COALESCE(m.data::date, CURRENT_DATE) >= CURRENT_DATE - INTERVAL '30 days'
              THEN ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS mov_venda_1m,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
               AND COALESCE(m.data::date, CURRENT_DATE) >= CURRENT_DATE - INTERVAL '60 days'
              THEN ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS mov_venda_2m
        FROM movimento m
        JOIN produtos_filtrados pf
          ON pf.codigo = LEFT(TRIM(m.produto)::text, 6)
        WHERE TRIM(COALESCE(m.operacao::text,'')) = 'VE'
          ${empList.length ? ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${empPlaceholders}) ` : ""}
          ${sizeFilterSql}
        GROUP BY LEFT(TRIM(m.produto)::text, 6)
      ),

      pedidos_raw AS (
        SELECT
          LEFT(TRIM(pd.produto)::text, 6) AS cod_produto,
          RIGHT(TRIM(pd.produto)::text, 2) AS tamanho,
          LPAD(TRIM(ped.empresa::text), 2, '0') AS empresa,
          TRIM(COALESCE(ped.status::text,'')) AS status,
          SUM(COALESCE(pd.pquantidade::numeric, 0)) AS quantidade
        FROM pedidos ped
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido::text) = TRIM(ped.codigo::text)
        JOIN produtos_filtrados pf
          ON pf.codigo = LEFT(TRIM(pd.produto)::text, 6)
        WHERE TRIM(COALESCE(ped.status::text,'')) IN ('A', 'C')
        ${empList.length ? ` AND LPAD(TRIM(ped.empresa::text), 2, '0') IN (${empPlaceholders}) ` : ""}
        ${sizeFilterPedidosSql}
        GROUP BY
          LEFT(TRIM(pd.produto)::text, 6),
          RIGHT(TRIM(pd.produto)::text, 2),
          LPAD(TRIM(ped.empresa::text), 2, '0'),
          TRIM(COALESCE(ped.status::text,''))
      ),

      pedidos_total AS (
        SELECT
          cod_produto,
          SUM(CASE WHEN status = 'A' THEN quantidade ELSE 0 END) AS pedidos_abertos,
          SUM(CASE WHEN status = 'C' THEN quantidade ELSE 0 END) AS pedidos_conferidos,
          SUM(quantidade) AS pedidos_total
        FROM pedidos_raw
        GROUP BY cod_produto
      ),

      pedidos_empresas AS (
        SELECT
          cod_produto,
          STRING_AGG(DISTINCT empresa, ', ' ORDER BY empresa) AS pedidos_empresas
        FROM pedidos_raw
        WHERE COALESCE(quantidade,0) <> 0
        GROUP BY cod_produto
      ),

promo_agg AS (
  SELECT
    x.cod_produto,
    x.promocao_codigo,
    x.promocao_nome,
    x.promocao_valor,
    x.cadastro,
    x.usuario
  FROM (
    SELECT
      ${promoProdExpr} AS cod_produto,

      pp.promocao AS promocao_codigo,

      pc.descricao AS promocao_nome,

      ${promoValExpr}::numeric AS promocao_valor,

      pp.cadastro,

      TRIM(
        COALESCE(
          NULLIF(pu.nome::text, ''),
          NULLIF(pu.apelido::text, ''),
          pp.usuario::text,
          ''
        )
      ) AS usuario,

      ROW_NUMBER() OVER (
        PARTITION BY ${promoProdExpr}
        ORDER BY pp.cadastro DESC NULLS LAST, pp.promocao DESC
      ) AS rn

    FROM promocoes_produtos pp

    LEFT JOIN promocoes_cadastro pc
      ON TRIM(pc.codigo::text) = TRIM(pp.promocao::text)

    LEFT JOIN pessoas pu
      ON TRIM(pu.codigo::text) = TRIM(pp.usuario::text)

WHERE EXISTS (
  SELECT 1
  FROM promocoes_cadastro pc2
  WHERE TRIM(pc2.codigo::text) = TRIM(pp.promocao::text)
    AND pc2.fim::date >= CURRENT_DATE
    ${
      campanhaTokens.length
        ? `AND (${campanhaTokens.map((token) => {
            params.push(`%${token}%`);
            return `pc2.descricao ILIKE $${params.length}`;
          }).join(" OR ")})`
        : ""
    }
)

    ${empList.length ? ` AND ${promoEmpExpr} IN (${empPlaceholders}) ` : ""}

  ) x
  WHERE x.rn = 1
)
      SELECT
        pf.codigo,
        pf.descricao,
        pf.cor,
        pf.referencia,
        pf.complemento,
        pf.marca,
        pf.departamento,
        pf.grupo,
        pf.fornecedor,
        COALESCE(pf.linha, pf.linha_codigo) AS linha,
COALESCE(pf.colecao, pf.colecao_codigo) AS colecao,
pf.preco,
        pf.custo,

        COALESCE(et.estoque, 0) AS estoque,
        COALESCE(ee.empresas, '') AS empresas,

COALESCE(vd.mov_venda_2d,0) AS mov_venda_2d,
COALESCE(vd.mov_venda_1m,0) AS mov_venda_1m,
COALESCE(vd.mov_venda_2m,0) AS mov_venda_2m,

COALESCE(pt.pedidos_abertos,0) AS pedidos_abertos,
COALESCE(pt.pedidos_conferidos,0) AS pedidos_conferidos,
COALESCE(pt.pedidos_total,0) AS pedidos_total,
COALESCE(pe.pedidos_empresas,'') AS pedidos_empresas,

COALESCE(et.estoque,0) - COALESCE(pt.pedidos_abertos,0) AS estoque_com_abertos,
COALESCE(et.estoque,0) - COALESCE(pt.pedidos_total,0) AS estoque_com_todos,

COALESCE(pa.promocao_codigo,'') AS promocao_codigo,
COALESCE(pa.promocao_valor,0) AS promocao_valor,
CASE
  WHEN COALESCE(pa.promocao_valor,0) > 0 THEN 1
  ELSE 0
END AS promocao,
COALESCE(pa.promocao_nome,'') AS promocao_nome,
pa.cadastro AS promocao_cadastro,
COALESCE(pa.usuario,'') AS promocao_usuario,

('/foto?codigo=' || pf.codigo) AS foto_url

      FROM produtos_filtrados pf
      LEFT JOIN est_total et         ON et.cod_produto = pf.codigo
      LEFT JOIN est_empresas ee      ON ee.cod_produto = pf.codigo
      LEFT JOIN vendas_agg vd        ON vd.cod_produto = pf.codigo
      LEFT JOIN pedidos_total pt     ON pt.cod_produto = pf.codigo
      LEFT JOIN pedidos_empresas pe  ON pe.cod_produto = pf.codigo
      LEFT JOIN promo_agg pa         ON pa.cod_produto = pf.codigo

      ${estoqueFinalWhere}
${promoRangeWhere}
${campanhaTokens.length ? ` AND pa.promocao_codigo IS NOT NULL ` : ""}

ORDER BY ${orderBySql}

      LIMIT $${limParam};
    `;

    const r = await querySafe(sql, params, 120000);

    console.log(
      `⏱️ /produtos ${Date.now() - tInicio}ms rows:${r.rowCount} fornecedorCods:${fornCodigos.length}`
    );
    res.json(r.rows || []);
  } catch (err) {
    console.error("Erro no /produtos:", err.message);
    res.status(500).json({ erro: err.message });
  }
});

// ======================================================
// RESUMO POR EMPRESA - CATÁLOGO
// ======================================================
app.get("/api/resumo-empresa", async (req, res) => {
  try {
    const {
      busca = "",
      empresas = "",
      tamanho = "",
      marca = "",
      departamento = "",
      grupo = "",
      fornecedor = "",
      linha = "",
      colecao = "",
      cor = "",
      complemento = "",
      limit = "500"
    } = req.query;

    const depCodigos = await resolveDepartamentoCodigos(departamento);
    const grpCodigos = await resolveGrupoCodigos(grupo);
    const marcaCodigos = await resolveMarcaCodigos(marca);
    const fornCodigos = await resolveFornecedorCodigos(fornecedor);
    const colecaoTokensRaw = parseMultiTokens(colecao);

const colecaoIncluir = colecaoTokensRaw
  .filter(x => !String(x).trim().startsWith("<>"))
  .join(";");

const colecaoExcluirTokens = colecaoTokensRaw
  .filter(x => String(x).trim().startsWith("<>"))
  .map(x => String(x).trim().replace(/^<>/, "").trim())
  .filter(Boolean);

const colecaoCodigos = await resolveColecaoCodigos(colecaoIncluir);
    const linhaTokens = parseMultiTokens(linha);
    const complementoTokens = parseMultiTokens(complemento);
    const empList = await resolveEmpresasFiltro(empresas);

    const params = [];
    let where = "WHERE COALESCE(p.desativar,false) = false";

    const joins = `
      LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(p.departamento)
      LEFT JOIN marcas mk       ON TRIM(mk.codigo) = TRIM(p.marca)
      LEFT JOIN grupos g        ON TRIM(g.codigo) = TRIM(p.grupo)
      LEFT JOIN linhas l        ON TRIM(l.codigo) = TRIM(p.linha)
      LEFT JOIN colecoes col    ON TRIM(col.codigo) = TRIM(p.colecao)

      LEFT JOIN LATERAL (
        SELECT
          cod_fornecedor AS fornecedor_codigo,
          ${fornecedorNomeExpr("pe")} AS fornecedor_nome
        FROM (
          SELECT
            COALESCE(
              NULLIF(TRIM(p.fornecedor::text), ''),
              (
                SELECT TRIM(pf1.fornecedor::text)
                FROM produtos_fornecedor pf1
                WHERE TRIM(pf1.produtoseta::text) = TRIM(p.codigo::text)
                ORDER BY TRIM(pf1.codigo::text)
                LIMIT 1
              )
            ) AS cod_fornecedor
        ) z
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = z.cod_fornecedor
      ) pf ON TRUE
    `;

    const b = String(busca || "").trim();

    if (b) {
      params.push(`%${b}%`);
      where += `
        AND (
          TRIM(p.codigo) ILIKE $${params.length}
          OR COALESCE(p.descricao,'') ILIKE $${params.length}
          OR COALESCE(p.referencia,'') ILIKE $${params.length}
          OR EXISTS (
            SELECT 1
            FROM barras br
            WHERE TRIM(COALESCE(br.codigo::text, '')) ILIKE $${params.length}
              AND LEFT(LPAD(TRIM(COALESCE(br.produto::text, '')), 8, '0'), 6) = TRIM(p.codigo)
          )
        )
      `;
    }

    if (cor) {
      params.push(`%${String(cor).trim()}%`);
      where += ` AND COALESCE(p.corx,'') ILIKE $${params.length}`;
    }

    if (complementoTokens.length) {
      const conds = [];

      for (const token of complementoTokens) {
        params.push(`%${token}%`);
        conds.push(`COALESCE(p.complemento,'') ILIKE $${params.length}`);
      }

      where += ` AND (${conds.join(" OR ")})`;
    }

    if (marcaCodigos.length) {
      const start = params.length + 1;
      marcaCodigos.forEach(c => params.push(c));
      const ph = marcaCodigos.map((_, i) => `$${start + i}`).join(",");
      where += ` AND TRIM(p.marca) IN (${ph})`;
    }

    if (depCodigos.length) {
      const start = params.length + 1;
      depCodigos.forEach(c => params.push(c));
      const ph = depCodigos.map((_, i) => `$${start + i}`).join(",");
      where += ` AND TRIM(p.departamento) IN (${ph})`;
    }

    if (grpCodigos.length) {
      const start = params.length + 1;
      grpCodigos.forEach(c => params.push(c));
      const ph = grpCodigos.map((_, i) => `$${start + i}`).join(",");
      where += ` AND TRIM(p.grupo) IN (${ph})`;
    }

    if (fornCodigos.length) {
      const start = params.length + 1;
      fornCodigos.forEach(c => params.push(c));
      const ph = fornCodigos.map((_, i) => `$${start + i}`).join(",");
      where += ` AND TRIM(COALESCE(pf.fornecedor_codigo, '')) IN (${ph})`;
    }

    if (linhaTokens.length) {
      const conds = [];

      for (const ln of linhaTokens) {
        params.push(ln, `%${ln}%`, `%${ln}%`);
        conds.push(`
          (
            TRIM(p.linha) = $${params.length - 2}
            OR COALESCE(l.descricao,'') ILIKE $${params.length - 1}
            OR TRIM(p.linha) ILIKE $${params.length}
          )
        `);
      }

      where += ` AND (${conds.join(" OR ")})`;
    }

    if (colecaoCodigos.length) {
  const start = params.length + 1;
  colecaoCodigos.forEach(c => params.push(c));
  const ph = colecaoCodigos.map((_, i) => `$${start + i}`).join(",");
  where += ` AND TRIM(p.colecao) IN (${ph})`;
}

if (colecaoExcluirTokens.length) {
  for (const token of colecaoExcluirTokens) {
    params.push(`%${token}%`);
    where += `
      AND (
        COALESCE(TRIM(p.colecao::text),'') NOT ILIKE $${params.length}
        AND COALESCE(TRIM(col.descricao::text),'') NOT ILIKE $${params.length}
      )
    `;
  }
}

    const minPreco = parseNumBR(req.query.min_preco ?? req.query.minPreco ?? "");
    const maxPreco = parseNumBR(req.query.max_preco ?? req.query.maxPreco ?? "");

    if (minPreco !== null) {
      params.push(minPreco);
      where += ` AND COALESCE(p.preco::numeric,0) >= $${params.length}`;
    }

    if (maxPreco !== null) {
      params.push(maxPreco);
      where += ` AND COALESCE(p.preco::numeric,0) <= $${params.length}`;
    }

    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(m.empresa::text),2,'0') IN (${ph}) `;
    }

    const tam = parseTam(tamanho);
    let tamSql = "";

    if (tam) {
      params.push(tam);
      tamSql = ` AND RIGHT(TRIM(m.produto)::text,2) = $${params.length} `;
    }

    const sql = `
      WITH produtos_filtrados AS (
        SELECT
          TRIM(p.codigo) AS codigo,
          COALESCE(p.preco::numeric,0) AS preco
        FROM produtos p
        ${joins}
        ${where}
      ),

      estoque_empresa AS (
        SELECT
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto)::text,6) AS codigo,
          SUM(${sumMovExpr("m")}) AS estoque
        FROM movimento m
        JOIN produtos_filtrados pf
          ON pf.codigo = LEFT(TRIM(m.produto)::text,6)
        WHERE m.estoque
          ${empSql}
          ${tamSql}
        GROUP BY
          LPAD(TRIM(m.empresa::text),2,'0'),
          LEFT(TRIM(m.produto)::text,6)
        HAVING SUM(${sumMovExpr("m")}) > 0
      )


      SELECT
  e.empresa,
  COALESCE(
    NULLIF(TRIM(pe.apelido::text),''),
    NULLIF(TRIM(pe.nome::text),''),
    e.empresa
  ) AS nome_empresa,

  SUM(
    CASE WHEN COALESCE(pr.promocao_valor,0) > 0
      THEN e.estoque ELSE 0 END
  ) AS estoque_promocao,

  SUM(
    CASE WHEN COALESCE(pr.promocao_valor,0) > 0
      THEN e.estoque * COALESCE(pr.promocao_valor,0) ELSE 0 END
  ) AS valor_promocao,

  SUM(
    CASE WHEN COALESCE(pr.promocao_valor,0) <= 0
      THEN e.estoque ELSE 0 END
  ) AS estoque_sem_promocao,

  SUM(
    CASE WHEN COALESCE(pr.promocao_valor,0) <= 0
      THEN e.estoque * pf.preco ELSE 0 END
  ) AS valor_sem_promocao,

  SUM(e.estoque) AS qtd_estoque,
  SUM(
    CASE WHEN COALESCE(pr.promocao_valor,0) > 0
      THEN e.estoque * COALESCE(pr.promocao_valor,0)
      ELSE e.estoque * pf.preco
    END
  ) AS valor_total

FROM estoque_empresa e
JOIN produtos_filtrados pf
  ON pf.codigo = e.codigo

LEFT JOIN LATERAL (
  SELECT
    COALESCE(NULLIF(TRIM(pp.condicao000001::text),'')::numeric,0) AS promocao_valor
  FROM promocoes_produtos pp
  LEFT JOIN promocoes_cadastro pc
    ON TRIM(pc.codigo::text) = TRIM(pp.promocao::text)
  WHERE pc.fim::date >= CURRENT_DATE
    AND (
      CASE
        WHEN LEFT(TRIM(pp.codigo),1) = 'P'
          THEN SUBSTRING(TRIM(pp.codigo),2,6)
        ELSE SUBSTRING(TRIM(pp.codigo),1,6)
      END
    ) = e.codigo
    AND (
      CASE
        WHEN LEFT(TRIM(pp.codigo),1) = 'P'
          THEN SUBSTRING(TRIM(pp.codigo),8,2)
        ELSE SUBSTRING(TRIM(pp.codigo),7,2)
      END
    ) = e.empresa
  ORDER BY pp.cadastro DESC NULLS LAST
  LIMIT 1
) pr ON TRUE
      LEFT JOIN pessoas pe
        ON LPAD(RIGHT(TRIM(pe.codigo::text),2),2,'0') = e.empresa
       AND pe.status = 'S'
       AND pe.filial = 'T'
      GROUP BY
        e.empresa,
        COALESCE(
          NULLIF(TRIM(pe.apelido::text),''),
          NULLIF(TRIM(pe.nome::text),''),
          e.empresa
        )
      ORDER BY e.empresa
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok: true,
      dados: r.rows || []
    });

  } catch (e) {
    console.error("Erro /api/resumo-empresa:", e.message);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// INVENTÁRIO DE VITRINE - CALÇADOS / SETA
// ======================================================
app.post("/api/inventario-vitrine/iniciar", async (req, res) => {
  try {
    const empresaRaw = String(req.body.empresa || "").trim();
    const departamentoRaw = String(req.body.departamento || "").trim();

    const usuario = String(req.body.usuario || "").trim();

    const empList = await resolveEmpresasFiltro(empresaRaw);

    if (!empList.length) {
      return res.status(400).json({ ok:false, erro:"Informe a empresa." });
    }

    const empresa = empList[0];
    const dataInventario = new Date().toISOString().slice(0, 10);
let inventarioId = 0;
let retomado = false;
    const aberto = await queryInventario(`
  SELECT id, status
  FROM inventarios_vitrine
  WHERE empresa = $1
    AND COALESCE(departamento,'') = COALESCE($2,'')
    AND status IN ('ABERTO','PAUSADO')
  ORDER BY iniciado_em DESC
  LIMIT 1
`, [empresa, departamentoRaw], 15000);

if (aberto.rows.length) {
  return res.json({
    ok:false,
    vigente:true,
    inventario_id: aberto.rows[0].id,
    status: aberto.rows[0].status,
    erro:"Já existe inventário desta loja. Clique em LISTAR INVENTÁRIO para continuar ou APAGAR para começar novamente."
  });
}    const r = await queryInventario(`
      INSERT INTO inventarios_vitrine (
        empresa,
        departamento,
        usuario,
        status,
        data_inventario
      )
      VALUES ($1,$2,$3,'ABERTO',CURRENT_DATE)
      RETURNING id
    `, [empresa, departamentoRaw, usuario], 15000);

    inventarioId = r.rows[0].id;

    const depCodigos = await resolveDepartamentoCodigos(departamentoRaw);

    // Segurança: se o usuário informou um departamento e ele não foi
    // reconhecido, nunca montar uma base geral com todos os produtos.
    if (departamentoRaw && !depCodigos.length) {
      await queryInventario(`
        DELETE FROM inventarios_vitrine
        WHERE id = $1
      `, [inventarioId], 15000);

      return res.status(400).json({
        ok:false,
        erro:`Nenhum departamento foi encontrado para o filtro "${departamentoRaw}". O inventário não foi criado.`
      });
    }

    const params = [empresa];
    let filtroDepartamentoSql = "";

    if (depCodigos.length) {
      const start = params.length + 1;
      depCodigos.forEach(c => params.push(c));

      const ph = depCodigos.map((_, i) => `$${start + i}`).join(",");

      filtroDepartamentoSql = `
        AND TRIM(p.departamento) IN (${ph})
      `;
    }

    const sqlBaseERP = `
      WITH est AS (
        SELECT
          LEFT(TRIM(m.produto)::text,6) AS codigo,
          SUM(${sumMovExpr("m")}) AS estoque
        FROM movimento m
        WHERE m.estoque
          AND LPAD(TRIM(m.empresa::text),2,'0') = $1
        GROUP BY LEFT(TRIM(m.produto)::text,6)
        HAVING SUM(${sumMovExpr("m")}) > 0
      ),
      promo AS (
        SELECT DISTINCT ON (
          CASE
            WHEN LEFT(TRIM(pp.codigo),1) = 'P'
              THEN SUBSTRING(TRIM(pp.codigo),2,6)
            ELSE SUBSTRING(TRIM(pp.codigo),1,6)
          END
        )
          CASE
            WHEN LEFT(TRIM(pp.codigo),1) = 'P'
              THEN SUBSTRING(TRIM(pp.codigo),2,6)
            ELSE SUBSTRING(TRIM(pp.codigo),1,6)
          END AS codigo,
          COALESCE(NULLIF(TRIM(pp.condicao000001::text),'')::numeric,0) AS valor_promocao
        FROM promocoes_produtos pp
        LEFT JOIN promocoes_cadastro pc
          ON TRIM(pc.codigo::text) = TRIM(pp.promocao::text)
        WHERE pc.fim::date >= CURRENT_DATE
        ORDER BY 1, pp.cadastro DESC NULLS LAST
      )
      SELECT
        e.codigo AS codigo_produto,
        TRIM(COALESCE(p.descricao,'')) AS descricao,
        COALESCE(p.preco::numeric,0) AS preco,
        COALESCE(pr.valor_promocao,0) AS valor_promocao,
        COALESCE(e.estoque,0) AS estoque,
        '/foto?codigo=' || e.codigo AS foto_url
      FROM est e
      JOIN produtos p
        ON TRIM(p.codigo) = e.codigo
      LEFT JOIN promo pr
        ON pr.codigo = e.codigo
      WHERE COALESCE(p.desativar,false) = false
      ${filtroDepartamentoSql}
      ORDER BY TRIM(COALESCE(p.descricao,''))
    `;

    const base = await querySafe(sqlBaseERP, params, 120000);

    for (const item of base.rows || []) {
      await queryInventario(`
        INSERT INTO inventarios_vitrine_estoque_base (
          inventario_id,
          empresa,
          departamento,
          data_inventario,
          codigo_produto,
          descricao,
          preco,
          valor_promocao,
          estoque,
          foto_url
        )
        VALUES ($1,$2,$3,CURRENT_DATE,$4,$5,$6,$7,$8,$9)
      `, [
        inventarioId,
        empresa,
        departamentoRaw,
        item.codigo_produto,
        item.descricao,
        item.preco,
        item.valor_promocao,
        item.estoque,
        item.foto_url
      ], 15000);
    }

    res.json({
      ok:true,
      inventario_id: inventarioId,
      retomado,
      qtd_base: base.rows.length
    });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
app.get("/api/inventario-vitrine/aberto", async (req, res) => {
  try {
    const empresaRaw = String(req.query.empresa || "").trim();
    const departamentoRaw = String(req.query.departamento || "").trim();

    const empList = await resolveEmpresasFiltro(empresaRaw);

    if (!empList.length) {
      return res.status(400).json({ ok:false, erro:"Informe a empresa." });
    }

    const empresa = empList[0];

    const r = await queryInventario(`
      SELECT
        i.id,
        i.empresa,
        i.departamento,
        i.status,
        i.iniciado_em,
        COUNT(b.id) AS qtd_bips,
        MAX(b.sequencia) AS ultima_sequencia,
        (
          SELECT b2.codigo_lido
          FROM inventarios_vitrine_bips b2
          WHERE b2.inventario_id = i.id
          ORDER BY b2.sequencia DESC
          LIMIT 1
        ) AS ultimo_codigo
      FROM inventarios_vitrine i
      LEFT JOIN inventarios_vitrine_bips b
        ON b.inventario_id = i.id
      WHERE i.empresa = $1
        AND COALESCE(i.departamento,'') = COALESCE($2,'')
        AND i.status IN ('ABERTO','PAUSADO')
      GROUP BY i.id
      ORDER BY i.iniciado_em DESC
      LIMIT 1
    `, [empresa, departamentoRaw], 15000);

    if (!r.rows.length) {
      return res.json({ ok:true, aberto:false });
    }

    res.json({
      ok:true,
      aberto:true,
      inventario:r.rows[0]
    });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
app.get("/api/inventario-vitrine/bips/:id", async (req, res) => {
  try {
    const inventarioId = Number(req.params.id || 0);

    if (!inventarioId) {
      return res.status(400).json({ ok:false, erro:"Informe o inventário." });
    }

    const r = await queryInventario(`
      SELECT
        id,
        sequencia,
        codigo_lido,
        codigo_produto,
        descricao,
        preco,
        valor_promocao,
        estoque_loja,
        duplicado,
        bipado_em
      FROM inventarios_vitrine_bips
      WHERE inventario_id = $1
      ORDER BY sequencia DESC
    `, [inventarioId], 15000);

    res.json({ ok:true, bips:r.rows || [] });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
app.delete("/api/inventario-vitrine/bips/:id", async (req, res) => {
  try {
    const bipId = Number(req.params.id || 0);

    if (!bipId) {
      return res.status(400).json({ ok:false, erro:"Informe o bip." });
    }

    await queryInventario(`
      DELETE FROM inventarios_vitrine_bips
      WHERE id = $1
    `, [bipId], 15000);

    res.json({ ok:true });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
app.get("/api/inventario-vitrine/lista", async (req, res) => {
  try {
    const empresaRaw = String(req.query.empresa || "").trim();
    const departamentoRaw = String(req.query.departamento || "").trim();

    const params = [];
    let where = "WHERE 1=1";

    if(empresaRaw){
      const empList = await resolveEmpresasFiltro(empresaRaw);

      if(empList.length){
        params.push(empList[0]);
        where += ` AND i.empresa = $${params.length}`;
      }
    }

    if(departamentoRaw){
      params.push(departamentoRaw);
      where += ` AND COALESCE(i.departamento,'') = COALESCE($${params.length},'')`;
    }

    const r = await queryInventario(`
      SELECT
        i.id,
        i.empresa,
        i.departamento,
        i.status,
        i.data_inventario,
        i.iniciado_em,
        i.finalizado_em,
        COALESCE(COUNT(b.id),0)::int AS qtd_bips,
        COALESCE(eb.qtd_base,0)::int AS qtd_base
      FROM inventarios_vitrine i
      LEFT JOIN inventarios_vitrine_bips b
        ON b.inventario_id = i.id
      LEFT JOIN (
        SELECT inventario_id, COUNT(*) AS qtd_base
        FROM inventarios_vitrine_estoque_base
        GROUP BY inventario_id
      ) eb
        ON eb.inventario_id = i.id
      ${where}
      GROUP BY
        i.id,
        i.empresa,
        i.departamento,
        i.status,
        i.data_inventario,
        i.iniciado_em,
        i.finalizado_em,
        eb.qtd_base
      ORDER BY i.data_inventario DESC, i.iniciado_em DESC
    `, params, 15000);

    res.json({
      ok:true,
      inventarios:r.rows || []
    });

  } catch(e){
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});

app.delete("/api/inventario-vitrine/:id", async (req, res) => {
  try {

    const inventarioId = Number(req.params.id || 0);

    if(!inventarioId){
      return res.status(400).json({
        ok:false,
        erro:"Inventário inválido."
      });
    }

await queryInventario(`
  DELETE FROM inventarios_vitrine_bips
  WHERE inventario_id = $1
`,[inventarioId],15000);

await queryInventario(`
  DELETE FROM inventarios_vitrine_estoque_base
  WHERE inventario_id = $1
`,[inventarioId],15000);

await queryInventario(`
  DELETE FROM inventarios_vitrine
  WHERE id = $1
`,[inventarioId],15000);

    res.json({ ok:true });

  } catch(e){
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});
app.post("/api/inventario-vitrine/pausar", async (req, res) => {
  try {
    const inventarioId = Number(req.body.inventario_id || 0);

    if (!inventarioId) {
      return res.status(400).json({
        ok:false,
        erro:"Informe o inventário."
      });
    }

    await queryInventario(`
      UPDATE inventarios_vitrine
      SET status = 'PAUSADO'
      WHERE id = $1
        AND status <> 'FINALIZADO'
    `, [inventarioId], 15000);

    res.json({ ok:true });

  } catch(e) {
    res.status(500).json({
      ok:false,
      erro:e.message
    });
  }
});
// ======================================================
// INVENTÁRIO DE VITRINE - GERAR RELATÓRIO FINAL
// Compara o estoque-base com os produtos bipados
// ======================================================
app.post("/api/inventario-vitrine/relatorio", async (req, res) => {
  try {
    const inventarioId = Number(req.body.inventario_id || 0);

    if (!inventarioId) {
      return res.status(400).json({
        ok: false,
        erro: "Informe o inventário."
      });
    }

    // Confirma que o inventário existe
    const rInventario = await queryInventario(`
      SELECT
        id,
        empresa,
        departamento,
        status,
        data_inventario
      FROM inventarios_vitrine
      WHERE id = $1
      LIMIT 1
    `, [inventarioId], 15000);

    if (!rInventario.rows.length) {
      return res.status(404).json({
        ok: false,
        erro: "Inventário não encontrado."
      });
    }

    /*
      A base foi fotografada no momento em que o inventário foi iniciado.
      Cada item da base será comparado com os bipes deste inventário.
    */
    const rRelatorio = await queryInventario(`
  WITH base AS (
    SELECT
      eb.id,
      LEFT(
        REGEXP_REPLACE(
          COALESCE(eb.codigo_produto::text, ''),
          '[^0-9]',
          '',
          'g'
        ),
        6
      ) AS codigo,
      eb.codigo_produto,
      eb.descricao,
      eb.preco,
      eb.valor_promocao,
      eb.estoque,
      eb.foto_url,

      CASE
        WHEN EXISTS (
          SELECT 1
          FROM inventarios_vitrine_bips b
          WHERE b.inventario_id = eb.inventario_id
            AND LEFT(
              REGEXP_REPLACE(
                COALESCE(b.codigo_produto::text, ''),
                '[^0-9]',
                '',
                'g'
              ),
              6
            ) = LEFT(
              REGEXP_REPLACE(
                COALESCE(eb.codigo_produto::text, ''),
                '[^0-9]',
                '',
                'g'
              ),
              6
            )
        )
        THEN 'BIPADO'
        ELSE 'NAO_BIPADO'
      END AS status

    FROM inventarios_vitrine_estoque_base eb
    WHERE eb.inventario_id = $1
  ),

  bipados_fora_base AS (
    SELECT DISTINCT ON (
      LEFT(
        REGEXP_REPLACE(
          COALESCE(b.codigo_produto::text, ''),
          '[^0-9]',
          '',
          'g'
        ),
        6
      )
    )
      b.id,
      LEFT(
        REGEXP_REPLACE(
          COALESCE(b.codigo_produto::text, ''),
          '[^0-9]',
          '',
          'g'
        ),
        6
      ) AS codigo,
      b.codigo_produto,
      b.descricao,
      b.preco,
      b.valor_promocao,
      COALESCE(b.estoque_loja, 0) AS estoque,
      '/foto?codigo=' ||
        LEFT(
          REGEXP_REPLACE(
            COALESCE(b.codigo_produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          6
        ) AS foto_url,
      'BIPADO_FORA_ESTOQUE' AS status

    FROM inventarios_vitrine_bips b

    WHERE b.inventario_id = $1

      AND NOT EXISTS (
        SELECT 1
        FROM inventarios_vitrine_estoque_base eb
        WHERE eb.inventario_id = b.inventario_id

          AND LEFT(
            REGEXP_REPLACE(
              COALESCE(eb.codigo_produto::text, ''),
              '[^0-9]',
              '',
              'g'
            ),
            6
          ) = LEFT(
            REGEXP_REPLACE(
              COALESCE(b.codigo_produto::text, ''),
              '[^0-9]',
              '',
              'g'
            ),
            6
          )
      )

    ORDER BY
      LEFT(
        REGEXP_REPLACE(
          COALESCE(b.codigo_produto::text, ''),
          '[^0-9]',
          '',
          'g'
        ),
        6
      ),
      b.sequencia DESC
  )

  SELECT *
  FROM (
    SELECT * FROM base

    UNION ALL

    SELECT * FROM bipados_fora_base
  ) resultado

  ORDER BY
    CASE
      WHEN status = 'BIPADO_FORA_ESTOQUE' THEN 1
      WHEN status = 'NAO_BIPADO' THEN 2
      WHEN status = 'BIPADO' THEN 3
      ELSE 4
    END,
    descricao,
    codigo
`, [inventarioId], 120000);

    const dados = rRelatorio.rows || [];

// ======================================================
// BUSCAR EMPRESA DO INVENTÁRIO
// ======================================================
const inventarioAtual = rInventario.rows[0];

const empresaInventario = String(
  inventarioAtual.empresa || ""
).trim().padStart(2, "0");

// ======================================================
// CÓDIGOS DOS PRODUTOS DO RELATÓRIO
// ======================================================
const codigosRelatorio = Array.from(
  new Set(
    dados
      .map(item =>
        String(
          item.codigo_produto ||
          item.codigo ||
          ""
        )
          .replace(/\D/g, "")
          .padStart(6, "0")
          .slice(0, 6)
      )
      .filter(Boolean)
  )
);

// ======================================================
// ESTOQUE ATUAL POR PRODUTO E TAMANHO
// ======================================================
let gradesEstoque = [];

if (codigosRelatorio.length) {
  const rGrades = await querySafe(`
    SELECT
      LEFT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(m.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        6
      ) AS codigo,

      RIGHT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(m.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        2
      ) AS tamanho,

      COALESCE(
        SUM(${sumMovExpr("m")}),
        0
      )::numeric AS estoque

    FROM movimento m

    WHERE COALESCE(m.estoque, false) = true

      AND LPAD(
        TRIM(m.empresa::text),
        2,
        '0'
      ) = $1

      AND LEFT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(m.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        6
      ) = ANY($2::text[])

    GROUP BY
      LEFT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(m.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        6
      ),

      RIGHT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(m.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        2
      )

    HAVING COALESCE(
      SUM(${sumMovExpr("m")}),
      0
    ) <> 0

    ORDER BY 1, 2
  `, [
    empresaInventario,
    codigosRelatorio
  ], 120000);

  gradesEstoque = rGrades.rows || [];
}

// ======================================================
// BIPS DO INVENTÁRIO
// ======================================================
const rBipsRelatorio = await queryInventario(`
  SELECT
    id,
    codigo_lido,
    codigo_produto,
    sequencia
  FROM inventarios_vitrine_bips
  WHERE inventario_id = $1
  ORDER BY sequencia
`, [inventarioId], 30000);

const bipsRelatorio = rBipsRelatorio.rows || [];

// ======================================================
// LOCALIZAR TAMANHOS DOS EANS NA TABELA BARRAS
// ======================================================
const codigosLidos = Array.from(
  new Set(
    bipsRelatorio
      .map(b =>
        String(b.codigo_lido || "")
          .replace(/\D/g, "")
      )
      .filter(Boolean)
  )
);

const mapaBarras = new Map();

if (codigosLidos.length) {
  const rBarras = await querySafe(`
    SELECT
      TRIM(br.codigo::text) AS codigo_lido,

      LEFT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(br.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        6
      ) AS codigo_produto,

      RIGHT(
        LPAD(
          REGEXP_REPLACE(
            COALESCE(br.produto::text, ''),
            '[^0-9]',
            '',
            'g'
          ),
          8,
          '0'
        ),
        2
      ) AS tamanho

    FROM barras br
    WHERE TRIM(br.codigo::text) = ANY($1::text[])
  `, [codigosLidos], 60000);

  for (const barra of rBarras.rows || []) {
    mapaBarras.set(
      String(barra.codigo_lido || ""),
      {
        codigo_produto: String(
          barra.codigo_produto || ""
        ).padStart(6, "0"),

        tamanho: String(
          barra.tamanho || ""
        ).padStart(2, "0")
      }
    );
  }
}

// ======================================================
// DESCOBRIR TAMANHO DE CADA BIP
// ======================================================
function tamanhoDoBip(codigoLido) {
  const codigo = String(codigoLido || "")
    .replace(/\D/g, "");

  if (!codigo) return "";

  // Código próprio: 7700 + produto + tamanho + dígito
  if (codigo.startsWith("7700") && codigo.length >= 12) {
    return codigo.slice(10, 12);
  }

  // EAN cadastrado
  const encontrado = mapaBarras.get(codigo);

  if (encontrado?.tamanho) {
    return encontrado.tamanho;
  }

  // Produto + tamanho digitado
  if (codigo.length === 8) {
    return codigo.slice(6, 8);
  }

  return "";
}

const mapaBipsPorProduto = new Map();

for (const bip of bipsRelatorio) {
  const codigoProduto = String(
    bip.codigo_produto || ""
  )
    .replace(/\D/g, "")
    .padStart(6, "0")
    .slice(0, 6);

  if (!codigoProduto) continue;

  if (!mapaBipsPorProduto.has(codigoProduto)) {
    mapaBipsPorProduto.set(codigoProduto, []);
  }

  mapaBipsPorProduto.get(codigoProduto).push({
    codigo_lido: bip.codigo_lido,
    tamanho: tamanhoDoBip(bip.codigo_lido),
    sequencia: Number(bip.sequencia || 0)
  });
}

// ======================================================
// MAPA DA GRADE DE ESTOQUE
// ======================================================
const mapaGrades = new Map();

for (const grade of gradesEstoque) {
  const codigo = String(grade.codigo || "")
    .padStart(6, "0");

  if (!mapaGrades.has(codigo)) {
    mapaGrades.set(codigo, []);
  }

  mapaGrades.get(codigo).push({
    tamanho: String(grade.tamanho || "")
      .padStart(2, "0"),

    estoque: Number(grade.estoque || 0)
  });
}

// ======================================================
// ACRESCENTAR GRADE E TAMANHO BIPADO AO RELATÓRIO
// ======================================================
for (const item of dados) {
  const codigo = String(
    item.codigo_produto ||
    item.codigo ||
    ""
  )
    .replace(/\D/g, "")
    .padStart(6, "0")
    .slice(0, 6);

  item.codigo = codigo;
  item.grade = mapaGrades.get(codigo) || [];
  item.bips = mapaBipsPorProduto.get(codigo) || [];

  item.tamanhos_bipados = Array.from(
    new Set(
      item.bips
        .map(b => String(b.tamanho || "").trim())
        .filter(Boolean)
    )
  );

  item.estoque_grade = item.grade.reduce(
    (total, tamanho) =>
      total + Number(tamanho.estoque || 0),
    0
  );
}

const total = dados.filter(
  item => item.status !== "BIPADO_FORA_ESTOQUE"
).length;

const bipadosComEstoque = dados.filter(
  item => item.status === "BIPADO"
).length;

const bipadosSemEstoque = dados.filter(
  item => item.status === "BIPADO_FORA_ESTOQUE"
).length;

const naoBipados = dados.filter(
  item => item.status === "NAO_BIPADO"
).length;

  return res.json({
    ok: true,
    inventario: inventarioAtual,

    total,
    bipados: bipadosComEstoque + bipadosSemEstoque,
    bipados_com_estoque: bipadosComEstoque,
    bipados_sem_estoque: bipadosSemEstoque,
    nao_bipados: naoBipados,

    dados
  });

  } catch (e) {
    console.error("Erro POST /api/inventario-vitrine/relatorio:", e);

    return res.status(500).json({
      ok: false,
      erro: e.message
    });
  }
});

app.post("/api/inventario-vitrine/finalizar", async (req, res) => {
  try {
    const inventarioId = Number(req.body.inventario_id || 0);

    if (!inventarioId) {
      return res.status(400).json({ ok:false, erro:"Informe o inventário." });
    }

await queryInventario(`
  UPDATE inventarios_vitrine
      SET status = 'FINALIZADO',
          finalizado_em = NOW()
      WHERE id = $1
    `, [inventarioId], 15000);

    res.json({ ok:true });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// INVENTÁRIO DE VITRINE - REABRIR INVENTÁRIO FINALIZADO
// Mantém todos os bipes e a base de estoque já gravados.
// ======================================================
app.post("/api/inventario-vitrine/reabrir", async (req, res) => {
  try {
    const inventarioId = Number(req.body.inventario_id || 0);

    if (!inventarioId) {
      return res.status(400).json({
        ok: false,
        erro: "Informe o inventário."
      });
    }

    const r = await queryInventario(`
      UPDATE inventarios_vitrine
         SET status = 'ABERTO',
             finalizado_em = NULL
       WHERE id = $1
         AND status = 'FINALIZADO'
       RETURNING id, empresa, departamento, status
    `, [inventarioId], 15000);

    if (!r.rows.length) {
      return res.status(404).json({
        ok: false,
        erro: "Inventário não encontrado ou ele já está aberto."
      });
    }

    return res.json({
      ok: true,
      mensagem: "Inventário reaberto com sucesso.",
      inventario: r.rows[0]
    });

  } catch (e) {
    console.error("Erro POST /api/inventario-vitrine/reabrir:", e);
    return res.status(500).json({
      ok: false,
      erro: e.message
    });
  }
});

app.get("/api/inventario-vitrine/bip", async (req, res) => {
  try {
    const empresaRaw = String(req.query.empresa || "").trim();
    const codigoLido = String(req.query.codigo || "").replace(/\D/g, "");

function sku6Inventario(codigo){
  const n = String(codigo || "").replace(/\D/g, "");

  // Código interno: 7700 + produto(6) + numeração(2) + dígito
  if(n.startsWith("7700") && n.length >= 10){
    return n.slice(4, 10);
  }

  // Produto + numeração
  if(n.length >= 8){
    return n.slice(0, 6);
  }

  // Produto direto
  return n.padStart(6, "0").slice(0, 6);
}

const codigoProduto6 = sku6Inventario(codigoLido);
    const departamentoRaw = String(req.query.departamento || "").trim();
    const inventarioId = Number(req.query.inventario_id || 0);

    const depCodigos = await resolveDepartamentoCodigos(departamentoRaw);
    const empList = await resolveEmpresasFiltro(empresaRaw);

    if (!empList.length || !codigoLido) {
      return res.status(400).json({ ok:false, erro:"Informe empresa e código." });
    }

    const empresa = empList[0];
    const params = [empresa, codigoLido];

    let filtroDepartamentoSql = "";

    if (depCodigos.length) {
      const start = params.length + 1;
      depCodigos.forEach(c => params.push(c));

      const depPlaceholders = depCodigos
        .map((_, i) => `$${start + i}`)
        .join(",");

      filtroDepartamentoSql = `
        AND TRIM(p.departamento) IN (${depPlaceholders})
      `;
    }

    const sql = `
WITH alvo AS (
  SELECT *
  FROM (
    /* 1) Código interno: 7700 + produto(6) + numeração(2) + dígito */
    SELECT
      SUBSTRING($2 FROM 5 FOR 6) AS sku,
      SUBSTRING($2 FROM 5 FOR 6) AS codigo,
      '' AS cor,
      SUBSTRING($2 FROM 11 FOR 2) AS tamanho,
      $2 AS codigo_barras,
      1 AS prioridade
    WHERE LEFT($2, 4) = '7700'
      AND LENGTH($2) >= 10
      AND EXISTS (
        SELECT 1
        FROM produtos p2
        WHERE TRIM(p2.codigo) = SUBSTRING($2 FROM 5 FOR 6)
      )

    UNION ALL

    /* 2) EAN de fábrica cadastrado na tabela barras */
SELECT
  LEFT(LPAD(TRIM(br.produto::text), 8, '0'), 6) AS sku,
  LEFT(LPAD(TRIM(br.produto::text), 8, '0'), 6) AS codigo,
  '' AS cor,

  RIGHT(
    LPAD(
      REGEXP_REPLACE(
        COALESCE(br.produto::text, ''),
        '[^0-9]',
        '',
        'g'
      ),
      8,
      '0'
    ),
    2
  ) AS tamanho,

  TRIM(br.codigo::text) AS codigo_barras,
  2 AS prioridade
    FROM barras br
    WHERE LENGTH($2) = 13
      AND LEFT($2, 4) <> '7700'
      AND TRIM(br.codigo::text) = $2

    UNION ALL

    /* 3) Código digitado: produto(6) ou produto(6)+numeração(2) */
    SELECT
      LEFT($2, 6) AS sku,
      LEFT($2, 6) AS codigo,
      '' AS cor,
      CASE WHEN LENGTH($2) >= 8 THEN SUBSTRING($2 FROM 7 FOR 2) ELSE '' END AS tamanho,
      $2 AS codigo_barras,
      3 AS prioridade
    WHERE LENGTH($2) >= 6
      AND EXISTS (
        SELECT 1
        FROM produtos p2
        WHERE TRIM(p2.codigo) = LEFT($2, 6)
      )
  ) x
  ORDER BY prioridade
  LIMIT 1
),
est AS (
  SELECT
    SUM(${sumMovExpr("m")}) AS estoque
  FROM movimento m
JOIN alvo a
  ON LEFT(TRIM(m.produto)::text,6) = a.sku
  WHERE m.estoque
    AND LPAD(TRIM(m.empresa::text),2,'0') = $1
),

promo AS (
  SELECT
    COALESCE(NULLIF(TRIM(pp.condicao000001::text),'')::numeric,0) AS valor_promocao,
    COALESCE(pc.descricao,'') AS promocao_nome
  FROM alvo a
  JOIN promocoes_produtos pp
    ON (
      CASE
        WHEN LEFT(TRIM(pp.codigo),1) = 'P'
          THEN SUBSTRING(TRIM(pp.codigo),2,6)
ELSE SUBSTRING(TRIM(pp.codigo),1,6)
      END
    ) = a.sku
  LEFT JOIN promocoes_cadastro pc
    ON TRIM(pc.codigo::text) = TRIM(pp.promocao::text)
  WHERE pc.fim::date >= CURRENT_DATE

  ORDER BY pp.cadastro DESC NULLS LAST
  LIMIT 1
)

SELECT
  a.sku,
  p.codigo,
  a.cor,
  a.tamanho,
  a.sku AS codigo_produto,
  p.descricao,
  p.referencia,
  p.preco,
  COALESCE(pr.valor_promocao,0) AS valor_promocao,
  COALESCE(pr.promocao_nome,'') AS promocao_nome,
  COALESCE(est.estoque,0) AS estoque_loja,
  a.codigo_barras,
  '/foto?codigo=' || p.codigo AS foto_url
FROM alvo a
JOIN produtos p ON TRIM(p.codigo) = a.codigo
LEFT JOIN est ON TRUE
LEFT JOIN promo pr ON TRUE
WHERE 1=1
${filtroDepartamentoSql}
LIMIT 1
    `;

    const r = await querySafe(sql, params, 15000);

    if (!r.rows.length) {
      return res.json({ ok:false, erro:"Código não encontrado neste departamento." });
    }

    const produto = r.rows[0];

// Usa sempre o código real localizado no ERP.
// Isso é indispensável quando o código lido é um EAN de fábrica.
const codigoProdutoEncontrado = String(
  produto.codigo_produto ||
  produto.codigo ||
  codigoProduto6 ||
  ""
).replace(/\D/g, "").padStart(6, "0").slice(0, 6);

let salvamento = null;
    if (inventarioId > 0) {
      const rSeq = await queryInventario(`
        SELECT COALESCE(MAX(sequencia),0) + 1 AS prox
        FROM inventarios_vitrine_bips
        WHERE inventario_id = $1
      `, [inventarioId], 15000);

      const sequencia = Number(rSeq.rows?.[0]?.prox || 1);

      const rDup = await queryInventario(`
  SELECT
    id,
    sequencia,
    codigo_lido,
    codigo_produto,
    descricao,
    bipado_em
  FROM inventarios_vitrine_bips
  WHERE inventario_id = $1
    AND LEFT(
      REGEXP_REPLACE(
        COALESCE(codigo_produto::text, ''),
        '[^0-9]',
        '',
        'g'
      ),
      6
    ) = $2
  ORDER BY sequencia DESC
  LIMIT 1
`, [
  inventarioId,
  codigoProdutoEncontrado
], 15000);
      if (rDup.rows.length) {
        const ja = rDup.rows[0];

        return res.json({
          ok:false,
          duplicado:true,
          erro:`Este produto já foi bipado na sequência ${ja.sequencia}. Código: ${ja.codigo_lido}`,
          bip_existente: ja,
          produto
        });
      }

      const duplicado = false;

      const rIns = await queryInventario(`
        INSERT INTO inventarios_vitrine_bips (
          inventario_id,
          codigo_lido,
          codigo_produto,
          descricao,
          preco,
          valor_promocao,
          estoque_loja,
          empresa,
          departamento,
          sequencia,
          duplicado
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
        )
        RETURNING id, sequencia, duplicado, bipado_em
      `, [
        inventarioId,
codigoLido,
codigoProdutoEncontrado,
produto.descricao,
        produto.preco,
        produto.valor_promocao,
        produto.estoque_loja,
        empresa,
        departamentoRaw,
        sequencia,
        duplicado
      ], 15000);

      salvamento = rIns.rows[0];
    }

    res.json({
      ok:true,
      produto,
      salvamento
    });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// EXPORTAÇÃO DE PEDIDOS - CSV/PDF
// ======================================================
app.get("/api/pedidos-exportacao", async (req, res) => {
  try {
    const status = String(req.query.status || "").trim().toUpperCase();
    const empresas = String(req.query.empresas || "").trim();

    const empList = await resolveEmpresasFiltro(empresas);

    const params = [];
    let where = `WHERE TRIM(COALESCE(p.status::text,'')) IN ('A','C')`;

    if (status === "A" || status === "C") {
      params.push(status);
      where += ` AND TRIM(COALESCE(p.status::text,'')) = $${params.length}`;
    }

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where += ` AND LPAD(TRIM(p.empresa::text),2,'0') IN (${ph})`;
    }

    const sql = `
      SELECT
        p.data::date AS data,
        p.previsao::date AS previsao,
        p.entrega::date AS entrega,
        TRIM(p.codigo::text) AS pedido,
        LPAD(TRIM(p.empresa::text),2,'0') AS empresa,
        COALESCE(SUM(pd.pquantidade::numeric),0) AS quantidade,
        TRIM(COALESCE(p.status::text,'')) AS status,
        TRIM(COALESCE(func.nome::text, func.apelido::text, p.funcionario::text, '')) AS funcionario,
        TRIM(COALESCE(conf.nome::text, conf.apelido::text, p.conferente::text, '')) AS conferente,
        TRIM(COALESCE(forn.nome::text, forn.apelido::text, p.fornecedor::text, '')) AS fornecedor,
JSON_AGG(
  JSON_BUILD_OBJECT(
    'produto', LEFT(TRIM(pd.produto::text), 6),
    'descricao', TRIM(COALESCE(pr.descricao::text,'')),
    'quantidade', COALESCE(pd.pquantidade::numeric,0),
    'foto_url', '/foto?codigo=' || LEFT(TRIM(pd.produto::text), 6)
  )
  ORDER BY LEFT(TRIM(pd.produto::text), 6)
) FILTER (WHERE pd.produto IS NOT NULL) AS itens
      FROM pedidos p
      LEFT JOIN pedidos_detalhes pd
        ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)
      LEFT JOIN pessoas func
        ON TRIM(func.codigo::text) = TRIM(p.funcionario::text)
      LEFT JOIN pessoas conf
        ON TRIM(conf.codigo::text) = TRIM(p.conferente::text)
      LEFT JOIN pessoas forn
  ON TRIM(forn.codigo::text) = TRIM(p.fornecedor::text)
LEFT JOIN produtos pr
  ON TRIM(pr.codigo::text) = LEFT(TRIM(pd.produto::text), 6)
${where}
      GROUP BY
        p.data,
        p.previsao,
        p.entrega,
        p.codigo,
        p.empresa,
        p.status,
        func.nome,
        func.apelido,
        p.funcionario,
        conf.nome,
        conf.apelido,
        p.conferente,
        forn.nome,
        forn.apelido,
        p.fornecedor
      ORDER BY p.data DESC NULLS LAST, p.codigo DESC
    `;

    const r = await querySafe(sql, params, 120000);
    res.json({ ok: true, data: r.rows || [] });

  } catch (e) {
    console.error("Erro /api/pedidos-exportacao:", e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});
// ======================================================
// /variacoes
// ======================================================
app.get("/variacoes", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    if (!codigo) return res.status(400).json({ erro: "Informe o codigo" });

    const todas = String(req.query.todas || "0") === "1";
    const empList = todas ? [] : await resolveEmpresasFiltro(req.query.empresas || "");

    const params = [codigo];
    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
    }

    const sql = `
      SELECT
        LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
        RIGHT(TRIM(m.produto)::text, 2) AS tamanho,
        SUM(${sumMovExpr("m")}) AS quantidade
      FROM movimento m
      WHERE m.estoque
        AND LEFT(TRIM(m.produto)::text, 6) = $1
        ${empSql}
      GROUP BY LPAD(TRIM(m.empresa::text), 2, '0'), RIGHT(TRIM(m.produto)::text, 2)
      HAVING SUM(${sumMovExpr("m")}) <> 0
      ORDER BY RIGHT(TRIM(m.produto)::text, 2), LPAD(TRIM(m.empresa::text), 2, '0');
    `;

    /*
     * Consulta separada para descobrir todas as lojas em promoção vigente,
     * inclusive quando a quantidade atual do produto naquela loja for zero.
     */
    const paramsPromo = [codigo];
    let filtroPromoEmpresa = "";

    if (empList.length) {
      paramsPromo.push(empList);
      filtroPromoEmpresa = `
        AND (
          CASE
            WHEN LEFT(TRIM(pp.codigo), 1) = 'P'
              THEN SUBSTRING(TRIM(pp.codigo), 8, 2)
            ELSE SUBSTRING(TRIM(pp.codigo), 7, 2)
          END
        ) = ANY($2::text[])
      `;
    }

    const sqlPromocoes = `
      SELECT DISTINCT
        LPAD(
          CASE
            WHEN LEFT(TRIM(pp.codigo), 1) = 'P'
              THEN SUBSTRING(TRIM(pp.codigo), 8, 2)
            ELSE SUBSTRING(TRIM(pp.codigo), 7, 2)
          END,
          2,
          '0'
        ) AS empresa
      FROM promocoes_produtos pp
      INNER JOIN promocoes_cadastro pc
        ON TRIM(pc.codigo::text) = TRIM(pp.promocao::text)
      WHERE pc.fim::date >= CURRENT_DATE
        AND COALESCE(pp.cadastro::date, CURRENT_DATE) <= CURRENT_DATE
        AND (
          CASE
            WHEN LEFT(TRIM(pp.codigo), 1) = 'P'
              THEN SUBSTRING(TRIM(pp.codigo), 2, 6)
            ELSE SUBSTRING(TRIM(pp.codigo), 1, 6)
          END
        ) = $1
        AND COALESCE(
              NULLIF(TRIM(pp.condicao000001::text), '')::numeric,
              0
            ) > 0
        ${filtroPromoEmpresa}
      ORDER BY 1
    `;

    const [r, rPromocoes] = await Promise.all([
      querySafe(sql, params, 60000),
      querySafe(sqlPromocoes, paramsPromo, 60000)
    ]);

    res.json({
      codigo,
      data: r.rows || [],
      promocoes: (rPromocoes.rows || [])
        .map(x => String(x.empresa || "").trim())
        .filter(Boolean)
    });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});
// ======================================================
// /comportamento-produto
// Última compra real + comprado na data + venda líquida após compra
// ======================================================
app.get("/comportamento-produto", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();

    if (!codigo) {
      return res.status(400).json({
        ok: false,
        erro: "Informe o código do produto."
      });
    }

    const todas = String(req.query.todas || "0") === "1";
    const empList = todas ? [] : await resolveEmpresasFiltro(req.query.empresas || "");

    const params = [codigo];
    let empSql = "";

let empAtivaSql = `
  AND NOT EXISTS (
    SELECT 1
    FROM pessoas pe
    WHERE pe.status = 'S'
      AND pe.filial = 'T'
      AND LPAD(RIGHT(TRIM(pe.codigo::text), 2), 2, '0') =
          LPAD(TRIM(m.empresa::text), 2, '0')
      AND (
        UPPER(COALESCE(pe.nome::text, '')) LIKE '%DESATIV%'
        OR UPPER(COALESCE(pe.apelido::text, '')) LIKE '%DESATIV%'
      )
  )
`;

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");

      empSql = `
        AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph})
      `;
    }

    const sql = `
      WITH base AS (
        SELECT
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          TRIM(COALESCE(m.operacao::text, '')) AS operacao,
          TRIM(COALESCE(m.cfop::text, '')) AS cfop,
          COALESCE(m.data::date, CURRENT_DATE) AS data_mov,
          COALESCE(m.quantidade::numeric, 0) AS quantidade
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          AND COALESCE(m.estoque, false) = true
          ${empSql}
${empAtivaSql}
      ),

      ultima_compra AS (
        SELECT
          empresa,
          MAX(data_mov) AS ultima_compra
        FROM base
        WHERE operacao = 'EN'
          AND cfop IN ('1102','2102','3102')
        GROUP BY empresa
      ),

      comprado_ultima_data AS (
        SELECT
          b.empresa,
          SUM(ABS(b.quantidade)) AS qtd_comprada
        FROM base b
        JOIN ultima_compra uc
          ON uc.empresa = b.empresa
         AND uc.ultima_compra = b.data_mov
        WHERE b.operacao = 'EN'
          AND b.cfop IN ('1102','2102','3102')
        GROUP BY b.empresa
      ),

      venda_liquida AS (
        SELECT
          b.empresa,
          SUM(
            CASE
              WHEN b.operacao = 'VE' THEN ABS(COALESCE(b.quantidade, 0))
              WHEN b.operacao IN ('DV', 'VC') THEN -ABS(COALESCE(b.quantidade, 0))
              ELSE 0
            END
          ) AS venda_total
        FROM base b
        LEFT JOIN ultima_compra uc
          ON uc.empresa = b.empresa
        WHERE b.operacao IN ('VE', 'DV', 'VC')
          AND (
            uc.ultima_compra IS NULL
            OR b.data_mov >= uc.ultima_compra
          )
        GROUP BY b.empresa
      ),

      outras_operacoes AS (
        SELECT
          b.empresa,
          b.operacao,
          SUM(ABS(COALESCE(b.quantidade, 0))) AS quantidade
        FROM base b
        WHERE b.operacao NOT IN ('EN', 'VE')
        GROUP BY b.empresa, b.operacao
      ),
estoque_empresa AS (
  SELECT
    LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
    SUM(
      CASE
        WHEN TRIM(COALESCE(m.movimento::text,'')) = 'E'
          THEN COALESCE(m.quantidade::numeric,0)
        WHEN TRIM(COALESCE(m.movimento::text,'')) = 'S'
          THEN -COALESCE(m.quantidade::numeric,0)
        ELSE 0
      END
    ) AS estoque
  FROM movimento m
  WHERE LEFT(TRIM(m.produto)::text, 6) = $1
    AND COALESCE(m.estoque, false) = true
    ${empSql}
${empAtivaSql}
  GROUP BY LPAD(TRIM(m.empresa::text), 2, '0')
),
      resultado AS (
        SELECT
          uc.empresa,
          'EN' AS operacao,
          uc.ultima_compra,
          COALESCE(cu.qtd_comprada, 0) AS quantidade
        FROM ultima_compra uc
        LEFT JOIN comprado_ultima_data cu
          ON cu.empresa = uc.empresa

        UNION ALL

        SELECT
          COALESCE(v.empresa, uc.empresa) AS empresa,
          'VE' AS operacao,
          uc.ultima_compra,
          COALESCE(v.venda_total, 0) AS quantidade
        FROM venda_liquida v
        FULL JOIN ultima_compra uc
          ON uc.empresa = v.empresa

        UNION ALL

        SELECT
          o.empresa,
          o.operacao,
          uc.ultima_compra,
          o.quantidade
        FROM outras_operacoes o
        LEFT JOIN ultima_compra uc
          ON uc.empresa = o.empresa
      )

SELECT
  r.empresa,
  r.operacao,
  r.ultima_compra,
  r.quantidade,
  COALESCE(e.estoque, 0) AS estoque
FROM resultado r
LEFT JOIN estoque_empresa e
  ON e.empresa = r.empresa
WHERE COALESCE(r.empresa, '') <> ''
ORDER BY
  r.empresa,
  r.operacao;
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok: true,
      data: r.rows || []
    });

  } catch (e) {
    console.error("Erro /comportamento-produto:", e.message);
    res.status(500).json({
      ok: false,
      erro: e.message
    });
  }
});

// ======================================================
// /movimentacao
// ======================================================
app.get("/movimentacao", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    if (!codigo) return res.status(400).json({ erro: "Informe o codigo" });

    const todas = String(req.query.todas || "0") === "1";
    const empList = todas ? [] : await resolveEmpresasFiltro(req.query.empresas || "");

    const params = [codigo];
    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
    }

    const sql = `
      WITH mov_base AS (
        SELECT
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          COALESCE(m.data::date, CURRENT_DATE) AS data_mov,
          TRIM(COALESCE(m.operacao::text, '')) AS operacao,
          SUM(COALESCE(m.quantidade::numeric, 0)) AS quantidade
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          ${empSql}
GROUP BY
        COALESCE(m.data::date, CURRENT_DATE),
        LPAD(TRIM(m.empresa::text), 2, '0'),
        TRIM(COALESCE(m.operacao::text, '')),
        COALESCE(TRIM(m.auxiliar::text), '-')
      ),
      resumo AS (
        SELECT
          operacao,
          COUNT(*) AS lancamentos,
          STRING_AGG(DISTINCT empresa, ', ' ORDER BY empresa) AS empresas,
          SUM(CASE WHEN quantidade > 0 THEN quantidade ELSE 0 END) AS entradas,
          SUM(CASE WHEN quantidade < 0 THEN ABS(quantidade) ELSE 0 END) AS saidas,
          SUM(quantidade) AS saldo
        FROM mov_base
        GROUP BY operacao
      ),
      totais AS (
        SELECT
          COALESCE(SUM(CASE WHEN quantidade > 0 THEN quantidade ELSE 0 END), 0) AS total_entradas,
          COALESCE(SUM(CASE WHEN quantidade < 0 THEN ABS(quantidade) ELSE 0 END), 0) AS total_saidas,
          COALESCE(SUM(quantidade), 0) AS saldo_mov
        FROM mov_base
      )
      SELECT
        r.operacao,
        r.lancamentos,
        COALESCE(r.empresas, '') AS empresas,
        COALESCE(r.entradas, 0) AS entradas,
        COALESCE(r.saidas, 0) AS saidas,
        COALESCE(r.saldo, 0) AS saldo,
        t.total_entradas,
        t.total_saidas,
        t.saldo_mov
      FROM resumo r
      CROSS JOIN totais t
      ORDER BY r.operacao;
    `;

    const r = await querySafe(sql, params, 90000);
    const rows = r.rows || [];

    const summary = rows.length
      ? {
          total_entradas: Number(rows[0].total_entradas || 0),
          total_saidas: Number(rows[0].total_saidas || 0),
          saldo_mov: Number(rows[0].saldo_mov || 0),
          operacoes: rows.length,
        }
      : {
          total_entradas: 0,
          total_saidas: 0,
          saldo_mov: 0,
          operacoes: 0,
        };

    res.json({
      codigo,
      resumo: summary,
      data: rows.map((x) => ({
        operacao: x.operacao,
        lancamentos: Number(x.lancamentos || 0),
        empresas: x.empresas || "",
        entradas: Number(x.entradas || 0),
        saidas: Number(x.saidas || 0),
        saldo: Number(x.saldo || 0),
      })),
    });
  } catch (e) {
    console.error("Erro no /movimentacao:", e.message);
    res.status(500).json({ erro: e.message });
  }
});
// ======================================================
// /movimentacao/detalhe (CORRIGIDO)
// ======================================================
app.get("/movimentacao/detalhe", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    const operacao = String(req.query.operacao || "").trim();

    if (!codigo) return res.status(400).json({ erro: "Informe o codigo" });

    const todas = String(req.query.todas || "0") === "1";
    const empList = todas ? [] : await resolveEmpresasFiltro(req.query.empresas || "");

    const params = [codigo];
    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");

      empSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
    }

    // filtro opcional de operação
    let opSql = "";
if (operacao) {
  params.push(operacao);
  opSql += ` AND TRIM(COALESCE(m.operacao::text, '')) = $${params.length} `;

  if (operacao === "EN") {
    opSql += ` AND TRIM(COALESCE(m.cfop::text, '')) IN ('1102','2102', '3102') `;
  }
}
const isVenda = operacao === "VE";

    const sql = `
      WITH detalhe_venda AS (
  SELECT
    COALESCE(m.data::date, CURRENT_DATE) AS data,
    LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
    TRIM(COALESCE(m.operacao::text, '')) AS operacao,
    COALESCE(TRIM(m.auxiliar::text), '-') AS venda,

    ${isVenda ? `
    CASE
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '0' THEN 'PIX'
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '6' THEN 'DEPOSITO'
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '1'
           AND UPPER(COALESCE(c.descricao, '')) LIKE '%CARTAO%' THEN 'DEBITO'
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '1' THEN 'DINHEIRO'
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '2' THEN 'CARTAO'
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '3' THEN 'CHEQUE'
      WHEN TRIM(COALESCE(c.tipo::text, '')) = '4' THEN 'CREDIARIO'
      ELSE 'OUTROS'
    END AS forma_pagamento,
    ` : `
    '-'::text AS forma_pagamento,
    `}

    COALESCE(m.total::numeric, 0) AS valor_vendido,

    CASE
      WHEN COALESCE(m.quantidade::numeric, 0) > 0
        THEN COALESCE(m.quantidade::numeric, 0)
      ELSE 0
    END AS entrada,

    CASE
      WHEN COALESCE(m.quantidade::numeric, 0) < 0
        THEN ABS(COALESCE(m.quantidade::numeric, 0))
      ELSE 0
    END AS saida,

    COALESCE(m.quantidade::numeric, 0) AS saldo

  FROM movimento m

  ${isVenda ? `
  INNER JOIN vendas v
    ON m.auxiliar = ('VE' || v.codigo)::char(10)
  INNER JOIN condicoes c
    ON TRIM(COALESCE(v.condicoes::text,'')) = TRIM(COALESCE(c.codigo::text,''))
  ` : ``}

  WHERE LEFT(TRIM(m.produto)::text, 6) = $1
    ${opSql}
    ${empSql}
)
      SELECT
        data,
        empresa,
        operacao,
        venda,
        forma_pagamento,
        SUM(valor_vendido) AS valor_vendido,
        SUM(entrada) AS entrada,
        SUM(saida) AS saida,
        SUM(saldo) AS saldo
      FROM detalhe_venda
      GROUP BY
        data,
        empresa,
        operacao,
        venda,
        forma_pagamento
      ORDER BY
        data DESC,
        empresa,
        venda DESC,
        forma_pagamento
    `;

    const r = await querySafe(sql, params, 90000);
    const rows = r.rows || [];

    res.json({
      codigo,
      operacao: operacao || "todas",
      total_linhas: rows.length,
      total_entrada: rows.reduce((a, x) => a + Number(x.entrada || 0), 0),
      total_saida: rows.reduce((a, x) => a + Number(x.saida || 0), 0),
      total_saldo: rows.reduce((a, x) => a + Number(x.saldo || 0), 0),
      data: rows.map((x) => ({
        data: x.data,
        empresa: x.empresa || "",
        operacao: x.operacao || "",
        venda: x.venda || "",
        valor_vendido: Number(x.valor_vendido || 0),
        forma_pagamento: x.forma_pagamento || "",
        entrada: Number(x.entrada || 0),
        saida: Number(x.saida || 0),
        saldo: Number(x.saldo || 0),
      })),
    });

  } catch (e) {
    console.error("Erro no /movimentacao/detalhe:", e.message);
    res.status(500).json({ erro: e.message });
  }
});

// ======================================================
// FOTO
// ======================================================
app.get("/foto", async (req, res) => {
  try {
    const codigo = (req.query.codigo || "").toString().trim();
    if (!codigo) return res.status(400).json({ erro: "Informe o codigo" });

    const sql = `
      SELECT imagem, auxiliar
      FROM imagens
      WHERE
           TRIM(codigo) = $1
        OR TRIM(codigo) = 'P' || $1
        OR ltrim(TRIM(codigo),'P') = $1
      ORDER BY datahora DESC NULLS LAST
      LIMIT 1
    `;

    const r = await querySafe(sql, [codigo], 30000);
    const row = r.rows?.[0];
    if (!row || !row.imagem) return res.status(404).send("Sem foto");

    let buf;
    if (Buffer.isBuffer(row.imagem)) buf = row.imagem;
    else {
      const s = String(row.imagem || "").trim();
      const base64 = s.includes("base64,") ? s.split("base64,")[1] : s;
      buf = Buffer.from(base64, "base64");
    }

    if (!buf || buf.length < 10) return res.status(404).send("Sem foto");

    const aux = (row.auxiliar || "").toString().trim().toLowerCase();
    const contentType = aux.startsWith("image/") ? aux : "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buf);
  } catch (e) {
    console.error("Erro no /foto:", e.message);
    return res.status(500).json({ erro: e.message });
  }
});

// ======================================================
// FOTO DE PESSOA / VENDEDOR
// ======================================================
app.get("/foto-pessoa", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();

    if (!codigo) {
      return res.status(400).json({ erro:"Informe o código da pessoa." });
    }

    const r = await querySafe(`
      SELECT ip.imagem
      FROM imagens_pessoas ip
      WHERE REGEXP_REPLACE(TRIM(ip.codigo::text), '^[A-Za-z]+', '') =
            REGEXP_REPLACE(TRIM($1::text), '^[A-Za-z]+', '')
        AND ip.imagem IS NOT NULL
      ORDER BY ip.datahora DESC NULLS LAST
      LIMIT 1
    `, [codigo], 30000);

    const imagem = r.rows?.[0]?.imagem;

    if (!imagem) {
      return res.status(404).send("Sem foto");
    }

    let buf;
    if (Buffer.isBuffer(imagem)) {
      buf = imagem;
    } else {
      const valor = String(imagem || "").trim();
      const base64 = valor.includes("base64,")
        ? valor.split("base64,")[1]
        : valor;
      buf = Buffer.from(base64, "base64");
    }

    if (!buf || buf.length < 10) {
      return res.status(404).send("Sem foto");
    }

    const png =
      buf.length >= 4 &&
      buf[0] === 137 &&
      buf[1] === 80 &&
      buf[2] === 78 &&
      buf[3] === 71;

    res.setHeader("Content-Type", png ? "image/png" : "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buf);

  } catch (e) {
    console.error("Erro no /foto-pessoa:", e.message);
    return res.status(500).json({ erro:e.message });
  }
});

// ======================================================
// AUTOCOMPLETE
// ======================================================
async function opcoesDistinct(res, sql, params) {
  const r = await querySafe(sql, params, 60000);
  res.json((r.rows || []).map((x) => x.valor).filter(Boolean));
}

app.get("/opcoes/busca", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT TRIM(descricao) AS valor
      FROM produtos
      WHERE COALESCE(descricao,'') ILIKE $1
      ORDER BY TRIM(descricao)
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/marcas", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT
        TRIM(codigo)::text || ' - ' || TRIM(descricao) AS valor
      FROM marcas
      WHERE COALESCE(descricao,'') ILIKE $1
         OR TRIM(codigo)::text ILIKE $1
      ORDER BY valor
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/departamentos", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT
        TRIM(codigo)::text || ' - ' || TRIM(descricao) AS valor
      FROM departamentos
WHERE COALESCE(desativar,'F') = 'F'
  AND (
    COALESCE(descricao,'') ILIKE $1
    OR TRIM(codigo)::text ILIKE $1
  )
      ORDER BY valor
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/grupos", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT
        TRIM(codigo)::text || ' - ' || TRIM(descricao) AS valor
      FROM grupos
      WHERE COALESCE(descricao,'') ILIKE $1
         OR TRIM(codigo)::text ILIKE $1
      ORDER BY TRIM(descricao), TRIM(codigo)
      LIMIT 100
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/fornecedores", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const sql = `
      SELECT DISTINCT valor
      FROM (
        SELECT
          CASE
            WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
              THEN TRIM(p.fornecedor::text) || ' - ' || ${fornecedorNomeExpr("pe")}
            ELSE TRIM(p.fornecedor::text)
          END AS valor
        FROM produtos p
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = TRIM(p.fornecedor::text)
        WHERE COALESCE(TRIM(p.fornecedor::text), '') <> ''

        UNION

        SELECT
          CASE
            WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
              THEN TRIM(pf.fornecedor::text) || ' - ' || ${fornecedorNomeExpr("pe")}
            ELSE TRIM(pf.fornecedor::text)
          END AS valor
        FROM produtos_fornecedor pf
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = TRIM(pf.fornecedor::text)
        WHERE COALESCE(TRIM(pf.fornecedor::text), '') <> ''
      ) x
      WHERE
        $1 = ''
        OR valor ILIKE '%' || $1 || '%'
      ORDER BY valor
      LIMIT 100
    `;

    await opcoesDistinct(res, sql, [q]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/cores", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT TRIM(corx) AS valor
      FROM produtos
      WHERE COALESCE(corx,'') ILIKE $1
      ORDER BY TRIM(corx)
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/complementos", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT TRIM(complemento) AS valor
      FROM produtos
      WHERE COALESCE(complemento,'') ILIKE $1
      ORDER BY TRIM(complemento)
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});
app.get("/opcoes/campanhas", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const sql = `
      SELECT DISTINCT TRIM(pc.descricao) AS valor
      FROM promocoes_cadastro pc
      JOIN promocoes_produtos pp
        ON TRIM(pp.promocao::text) = TRIM(pc.codigo::text)
      WHERE COALESCE(TRIM(pc.descricao::text), '') <> ''
        AND pc.fim::date >= CURRENT_DATE
        AND ($1 = '' OR pc.descricao ILIKE '%' || $1 || '%')
      ORDER BY valor
      LIMIT 100
    `;

    const r = await querySafe(sql, [q], 60000);
    res.json((r.rows || []).map(x => x.valor).filter(Boolean));
  } catch (err) {
    console.error("Erro /opcoes/campanhas:", err.message);
    res.status(500).json([]);
  }
});

app.get("/opcoes/empresas", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const sql = `
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo), 2), 2, '0') || ' - ' ||
        COALESCE(NULLIF(TRIM(apelido), ''), NULLIF(TRIM(nome), ''), TRIM(codigo)) AS valor
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
        AND (
          $1 = ''
          OR LPAD(RIGHT(TRIM(codigo), 2), 2, '0') ILIKE '%' || $1 || '%'
          OR COALESCE(TRIM(apelido), '') ILIKE '%' || $1 || '%'
          OR COALESCE(TRIM(nome), '') ILIKE '%' || $1 || '%'
        )
      ORDER BY valor
      LIMIT 100
    `;

    const r = await querySafe(sql, [q], 60000);
    res.json((r.rows || []).map((x) => x.valor).filter(Boolean));
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

app.get("/opcoes/tamanhos", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT RIGHT(TRIM(produto)::text, 2) AS valor
      FROM movimento
      WHERE RIGHT(TRIM(produto)::text, 2) ILIKE $1
      ORDER BY RIGHT(TRIM(produto)::text, 2)
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});
app.get("/opcoes/colecoes", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const sql = `
      SELECT DISTINCT
        TRIM(codigo::text) AS codigo,
        TRIM(COALESCE(descricao::text,'')) AS descricao
      FROM colecoes
      WHERE
        COALESCE(TRIM(desativar::text), 'F') = 'F'
        AND (
          TRIM(codigo::text) ILIKE $1
          OR COALESCE(TRIM(descricao::text),'') ILIKE $1
        )
      ORDER BY descricao, codigo
      LIMIT 100
    `;

    const r = await querySafe(sql, [`%${q}%`], 30000);

    const lista = (r.rows || []).map(x => {
      if (x.descricao) {
        return `${x.codigo} - ${x.descricao}`;
      }
      return x.codigo;
    });

    res.json(lista);

  } catch (e) {
    console.error("Erro /opcoes/colecoes:", e);
    res.status(500).json({ erro: e.message });
  }
});	

app.get("/opcoes/linhas", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const sql = `
      SELECT DISTINCT
        CASE
          WHEN COALESCE(TRIM(descricao),'') <> '' THEN TRIM(descricao)
          ELSE TRIM(codigo)
        END AS valor
      FROM linhas
      WHERE COALESCE(descricao,'') ILIKE $1
         OR TRIM(codigo) ILIKE $1
      ORDER BY valor
      LIMIT 60
    `;
    await opcoesDistinct(res, sql, [`%${q}%`]);
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

// ======================================================
// OTB PROFISSIONAL
// ======================================================
app.get("/api/otb", async (req, res) => {
  const tInicio = Date.now();

  try {
    const empresasRaw = String(req.query.empresas || "").trim();
    const departamento = String(req.query.departamento || "").trim();
    const grupo = String(req.query.grupo || "").trim();
    const marca = String(req.query.marca || "").trim();
    const fornecedor = String(req.query.fornecedor || "").trim();

    const minDias = clampInt(
      req.query.min_dias ?? req.query.minDias,
      1,
      365,
      60
    );
const incluirMesAtual = String(req.query.incluir_mes_atual || "0") === "1";
    const visao = String(req.query.visao || "produto").toLowerCase();
    const limit = clampInt(req.query.limit, 1, 20000, 3000);

const empList = await resolveEmpresasFiltro(empresasRaw);
const depCodigos = await resolveDepartamentoCodigos(departamento);
const grpCodigos = await resolveGrupoCodigos(grupo);
const marcaCodigos = await resolveMarcaCodigos(marca);
const fornCodigos = await resolveFornecedorCodigos(fornecedor);

const params = [];
let empMovSql = "";
let empEstSql = "";
let empPedSql = "";

if (empList.length) {
  const start = params.length + 1;
  empList.forEach((e) => params.push(e));
  const ph = empList.map((_, i) => `$${start + i}`).join(",");

  empMovSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
  empPedSql = ` AND LPAD(TRIM(p.empresa::text), 2, '0') IN (${ph}) `;
}

let filtrosBaseProd = "";
let filtrosEnriquecido = "";

if (depCodigos.length) {
  const start = params.length + 1;
  depCodigos.forEach((c) => params.push(c));
  const ph = depCodigos.map((_, i) => `$${start + i}`).join(",");
  filtrosBaseProd += ` AND TRIM(pr.departamento) IN (${ph}) `;
  filtrosEnriquecido += ` AND TRIM(pr.departamento) IN (${ph}) `;
}

if (grpCodigos.length) {
  const start = params.length + 1;
  grpCodigos.forEach((c) => params.push(c));
  const ph = grpCodigos.map((_, i) => `$${start + i}`).join(",");
  filtrosBaseProd += ` AND TRIM(pr.grupo) IN (${ph}) `;
  filtrosEnriquecido += ` AND TRIM(pr.grupo) IN (${ph}) `;
}

if (marcaCodigos.length) {
  const start = params.length + 1;
  marcaCodigos.forEach((c) => params.push(c));
  const ph = marcaCodigos.map((_, i) => `$${start + i}`).join(",");
  filtrosBaseProd += ` AND TRIM(pr.marca) IN (${ph}) `;
  filtrosEnriquecido += ` AND TRIM(pr.marca) IN (${ph}) `;
}

if (fornCodigos.length) {
  const start = params.length + 1;
  fornCodigos.forEach((c) => params.push(c));
  const ph = fornCodigos.map((_, i) => `$${start + i}`).join(",");

  filtrosBaseProd += `
    AND (
      TRIM(COALESCE(pr.fornecedor::text, '')) IN (${ph})
      OR EXISTS (
        SELECT 1
        FROM produtos_fornecedor pf2
        WHERE TRIM(pf2.produtoseta::text) = TRIM(pr.codigo::text)
          AND TRIM(pf2.fornecedor::text) IN (${ph})
      )
    )
  `;

  filtrosEnriquecido += `
    AND (
      TRIM(COALESCE(pr.fornecedor::text, '')) IN (${ph})
      OR EXISTS (
        SELECT 1
        FROM produtos_fornecedor pf2
        WHERE TRIM(pf2.produtoseta::text) = TRIM(pr.codigo::text)
          AND TRIM(pf2.fornecedor::text) IN (${ph})
      )
    )
  `;
}


    params.push(minDias);
    const pMinDias = params.length;

    params.push(limit);
    const pLimit = params.length;

    const groupMap = {
      grupo: {
        labelExpr: `TRIM(COALESCE(src.departamento,'')) || ' • ' || TRIM(COALESCE(src.grupo,''))`,
        extraExprs: `
          TRIM(COALESCE(src.departamento,'')) AS departamento,
          TRIM(COALESCE(src.grupo,'')) AS grupo,
          ''::text AS marca,
          ''::text AS fornecedor,
          ''::text AS produto
        `,
      },
      marca: {
        labelExpr: `TRIM(COALESCE(src.marca,''))`,
        extraExprs: `
          ''::text AS departamento,
          ''::text AS grupo,
          TRIM(COALESCE(src.marca,'')) AS marca,
          ''::text AS fornecedor,
          ''::text AS produto
        `,
      },
      produto: {
        labelExpr: `TRIM(src.codigo) || ' - ' || TRIM(src.descricao)`,
        extraExprs: `
          TRIM(COALESCE(src.departamento,'')) AS departamento,
          TRIM(COALESCE(src.grupo,'')) AS grupo,
          TRIM(COALESCE(src.marca,'')) AS marca,
          TRIM(COALESCE(src.fornecedor,'')) AS fornecedor,
          TRIM(src.codigo) || ' - ' || TRIM(src.descricao) AS produto
        `,
      },
    };

    const grp = groupMap[visao] || groupMap.produto;

    const sql = `
WITH meses AS (
  SELECT
    date_trunc('month', CURRENT_DATE)::date AS mes_atual,

    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '11 month'" : "date_trunc('month', CURRENT_DATE) - interval '12 month'"})::date AS m1,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '10 month'" : "date_trunc('month', CURRENT_DATE) - interval '11 month'"})::date AS m2,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '9 month'" : "date_trunc('month', CURRENT_DATE) - interval '10 month'"})::date AS m3,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '8 month'" : "date_trunc('month', CURRENT_DATE) - interval '9 month'"})::date AS m4,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '7 month'" : "date_trunc('month', CURRENT_DATE) - interval '8 month'"})::date AS m5,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '6 month'" : "date_trunc('month', CURRENT_DATE) - interval '7 month'"})::date AS m6,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '5 month'" : "date_trunc('month', CURRENT_DATE) - interval '6 month'"})::date AS m7,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '4 month'" : "date_trunc('month', CURRENT_DATE) - interval '5 month'"})::date AS m8,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '3 month'" : "date_trunc('month', CURRENT_DATE) - interval '4 month'"})::date AS m9,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '2 month'" : "date_trunc('month', CURRENT_DATE) - interval '3 month'"})::date AS m10,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '1 month'" : "date_trunc('month', CURRENT_DATE) - interval '2 month'"})::date AS m11,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE)" : "date_trunc('month', CURRENT_DATE) - interval '1 month'"})::date AS m12,

    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) + interval '1 month'" : "date_trunc('month', CURRENT_DATE)"})::date AS fim_periodo
),

      base_prod AS (
        SELECT
          TRIM(pr.codigo) AS cod_produto
        FROM produtos pr
        WHERE COALESCE(pr.desativar, false) = false
        ${filtrosBaseProd}
      ),

      vendas_mensais AS (
        SELECT
          LEFT(TRIM(m.produto)::text, 6) AS cod_produto,
          date_trunc('month', m.data::date)::date AS mes_ref,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS vendas_mes
        FROM movimento m
        JOIN base_prod bp
          ON bp.cod_produto = LEFT(TRIM(m.produto)::text, 6)
        WHERE m.estoque
          AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
          AND m.data::date >= (SELECT m1 FROM meses)
          AND m.data::date <  (SELECT fim_periodo FROM meses)
          ${empMovSql}
        GROUP BY 1, 2
      ),

      estoque_total AS (
        SELECT
          LEFT(TRIM(m.produto)::text, 6) AS cod_produto,
          SUM(${sumMovExpr("m")}) AS estoque_atual
        FROM movimento m
        JOIN base_prod bp
          ON bp.cod_produto = LEFT(TRIM(m.produto)::text, 6)
        WHERE m.estoque
        ${empMovSql}
        GROUP BY 1
      ),

      em_transito_total AS (
        SELECT
          LEFT(TRIM(pd.produto)::text, 6) AS cod_produto,
          SUM(COALESCE(pd.pquantidade::numeric, 0)) AS em_transito
        FROM pedidos p
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido) = TRIM(p.codigo)
        JOIN base_prod bp
          ON bp.cod_produto = LEFT(TRIM(pd.produto)::text, 6)
        WHERE TRIM(COALESCE(p.status::text,'')) = 'A'
        ${empPedSql}
        GROUP BY 1
      ),

      enriquecido AS (
        SELECT
          TRIM(pr.codigo) AS codigo,
          TRIM(pr.descricao) AS descricao,
          TRIM(COALESCE(d.descricao, '')) AS departamento,
          TRIM(COALESCE(g.descricao, '')) AS grupo,
          TRIM(COALESCE(mk.descricao, '')) AS marca,
          TRIM(COALESCE(pf.fornecedor, '')) AS fornecedor,

          COALESCE(et.estoque_atual, 0) AS estoque,
          COALESCE(tt.em_transito, 0) AS em_transito,
          COALESCE(et.estoque_atual, 0) + COALESCE(tt.em_transito, 0) AS estoque_futuro,

          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m1 FROM meses)  THEN vm.vendas_mes END), 0)  AS v1,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m2 FROM meses)  THEN vm.vendas_mes END), 0)  AS v2,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m3 FROM meses)  THEN vm.vendas_mes END), 0)  AS v3,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m4 FROM meses)  THEN vm.vendas_mes END), 0)  AS v4,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m5 FROM meses)  THEN vm.vendas_mes END), 0)  AS v5,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m6 FROM meses)  THEN vm.vendas_mes END), 0)  AS v6,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m7 FROM meses)  THEN vm.vendas_mes END), 0)  AS v7,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m8 FROM meses)  THEN vm.vendas_mes END), 0)  AS v8,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m9 FROM meses)  THEN vm.vendas_mes END), 0)  AS v9,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m10 FROM meses) THEN vm.vendas_mes END), 0)  AS v10,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m11 FROM meses) THEN vm.vendas_mes END), 0)  AS v11,
          COALESCE(SUM(CASE WHEN vm.mes_ref = (SELECT m12 FROM meses) THEN vm.vendas_mes END), 0)  AS v12

        FROM produtos pr
        LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(pr.departamento)
        LEFT JOIN grupos g ON TRIM(g.codigo) = TRIM(pr.grupo)
        LEFT JOIN marcas mk ON TRIM(mk.codigo) = TRIM(pr.marca)
        LEFT JOIN LATERAL (
          SELECT
            CASE
              WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
                THEN cod_fornecedor || ' - ' || ${fornecedorNomeExpr("pe")}
              ELSE cod_fornecedor
            END AS fornecedor
          FROM (
            SELECT
              COALESCE(
                NULLIF(TRIM(pr.fornecedor::text), ''),
                (
                  SELECT TRIM(pf1.fornecedor::text)
                  FROM produtos_fornecedor pf1
                  WHERE TRIM(pf1.produtoseta::text) = TRIM(pr.codigo::text)
                  ORDER BY TRIM(pf1.codigo::text)
                  LIMIT 1
                )
              ) AS cod_fornecedor
          ) z
          LEFT JOIN pessoas pe
            ON TRIM(pe.codigo::text) = z.cod_fornecedor
        ) pf ON TRUE
        LEFT JOIN vendas_mensais vm ON vm.cod_produto = TRIM(pr.codigo)
        LEFT JOIN estoque_total et ON et.cod_produto = TRIM(pr.codigo)
        LEFT JOIN em_transito_total tt ON tt.cod_produto = TRIM(pr.codigo)
        WHERE COALESCE(pr.desativar, false) = false
        ${filtrosEnriquecido}
        GROUP BY
          TRIM(pr.codigo),
          TRIM(pr.descricao),
          TRIM(COALESCE(d.descricao, '')),
          TRIM(COALESCE(g.descricao, '')),
          TRIM(COALESCE(mk.descricao, '')),
          TRIM(COALESCE(pf.fornecedor, '')),
          COALESCE(et.estoque_atual, 0),
          COALESCE(tt.em_transito, 0)
      ),

      agrupado AS (
        SELECT
          ${grp.labelExpr} AS chave,
          ${grp.extraExprs},

          SUM(v1) AS v1,
          SUM(v2) AS v2,
          SUM(v3) AS v3,
          SUM(v4) AS v4,
          SUM(v5) AS v5,
          SUM(v6) AS v6,
          SUM(v7) AS v7,
          SUM(v8) AS v8,
          SUM(v9) AS v9,
          SUM(v10) AS v10,
          SUM(v11) AS v11,
          SUM(v12) AS v12,

          SUM(estoque) AS estoque,
          SUM(em_transito) AS em_transito,
          SUM(estoque_futuro) AS estoque_futuro
        FROM enriquecido src
        GROUP BY 1,2,3,4,5,6
      ),

      calculado AS (
        SELECT
          *,
          (v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8 + v9 + v10 + v11 + v12) AS vendas_12m,
          ((v10 + v11 + v12) / 3.0) AS media_3m,
          ((v7 + v8 + v9 + v10 + v11 + v12) / 6.0) AS media_6m,

          CASE
            WHEN v11 <= 0 AND v12 > 0 THEN 100
            WHEN v11 <= 0 THEN 0
            ELSE ((v12 - v11) / NULLIF(v11, 0)) * 100
          END AS crescimento_mensal_pct,

          CASE
            WHEN ((v7 + v8 + v9) / 3.0) <= 0 AND ((v10 + v11 + v12) / 3.0) > 0 THEN 100
            WHEN ((v7 + v8 + v9) / 3.0) <= 0 THEN 0
            ELSE ((((v10 + v11 + v12) / 3.0) - ((v7 + v8 + v9) / 3.0)) / NULLIF(((v7 + v8 + v9) / 3.0), 0)) * 100
          END AS crescimento_trimestre_pct
        FROM agrupado
      ),

      projetado AS (
        SELECT
          *,
          (
            (media_3m * 0.50) +
            (media_6m * 0.30) +
            (((v1 + v2 + v3 + v4 + v5 + v6 + v7 + v8 + v9 + v10 + v11 + v12) / 12.0) * 0.20)
          ) *
          CASE
            WHEN media_6m <= 0 AND media_3m > 0 THEN 1.15
            WHEN media_6m <= 0 THEN 1.00
            WHEN media_3m >= media_6m THEN LEAST(1.35, GREATEST(1.00, media_3m / NULLIF(media_6m, 0)))
            ELSE GREATEST(0.85, media_3m / NULLIF(media_6m, 0))
          END AS projecao_mensal
        FROM calculado
      ),

      rankeado AS (
        SELECT
          *,
          SUM(vendas_12m) OVER () AS total_venda_12m_geral,
          SUM(vendas_12m) OVER (ORDER BY vendas_12m DESC, chave ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS venda_acumulada
        FROM projetado
      )

      SELECT
        chave,
        departamento,
        grupo,
        marca,
        fornecedor,
        produto,

        ROUND(v1::numeric, 2) AS v1,
        ROUND(v2::numeric, 2) AS v2,
        ROUND(v3::numeric, 2) AS v3,
        ROUND(v4::numeric, 2) AS v4,
        ROUND(v5::numeric, 2) AS v5,
        ROUND(v6::numeric, 2) AS v6,
        ROUND(v7::numeric, 2) AS v7,
        ROUND(v8::numeric, 2) AS v8,
        ROUND(v9::numeric, 2) AS v9,
        ROUND(v10::numeric, 2) AS v10,
        ROUND(v11::numeric, 2) AS v11,
        ROUND(v12::numeric, 2) AS v12,

        ROUND(vendas_12m::numeric, 2) AS vendas_12m,
        ROUND(media_3m::numeric, 2) AS media_3m,
        ROUND(media_6m::numeric, 2) AS media_6m,
        ROUND(crescimento_mensal_pct::numeric, 2) AS crescimento_mensal_pct,
        ROUND(crescimento_trimestre_pct::numeric, 2) AS crescimento_trimestre_pct,

        ROUND(projecao_mensal::numeric, 2) AS projecao_mensal,
        ROUND((projecao_mensal / 30.0)::numeric, 4) AS projecao_diaria,

        ROUND(estoque::numeric, 2) AS estoque,
        ROUND(em_transito::numeric, 2) AS em_transito,
        ROUND(estoque_futuro::numeric, 2) AS estoque_futuro,

        CASE
          WHEN total_venda_12m_geral <= 0 THEN 0
          ELSE ROUND(((vendas_12m / NULLIF(total_venda_12m_geral, 0)) * 100)::numeric, 2)
        END AS participacao_pct,

        CASE
          WHEN total_venda_12m_geral <= 0 THEN 0
          ELSE ROUND(((venda_acumulada / NULLIF(total_venda_12m_geral, 0)) * 100)::numeric, 2)
        END AS acumulado_pct,

        CASE
          WHEN total_venda_12m_geral <= 0 THEN 'C'
          WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.80 THEN 'A'
          WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.95 THEN 'B'
          ELSE 'C'
        END AS abc,

        CASE
          WHEN total_venda_12m_geral <= 0 THEN GREATEST($${pMinDias} - 20, 45)
          WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.80 THEN GREATEST($${pMinDias}, 75)
          WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.95 THEN GREATEST($${pMinDias} - 10, 60)
          ELSE GREATEST($${pMinDias} - 20, 45)
        END AS cobertura_alvo_dias,

        CASE
          WHEN projecao_mensal <= 0 THEN 0
          ELSE ROUND(
            (estoque_futuro / NULLIF((projecao_mensal / 30.0), 0))::numeric,
            2
          )
        END AS cobertura_atual_dias,

        CEIL(
          GREATEST(
            0,
            (
              (projecao_mensal / 30.0) *
              CASE
                WHEN total_venda_12m_geral <= 0 THEN GREATEST($${pMinDias} - 20, 45)
                WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.80 THEN GREATEST($${pMinDias}, 75)
                WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.95 THEN GREATEST($${pMinDias} - 10, 60)
                ELSE GREATEST($${pMinDias} - 20, 45)
              END
            ) - estoque_futuro
          )
        )::int AS compra_sugerida,

        CEIL(
          GREATEST(
            0,
            (
              (projecao_mensal / 30.0) *
              CASE
                WHEN total_venda_12m_geral <= 0 THEN GREATEST($${pMinDias} - 20, 45)
                WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.80 THEN GREATEST($${pMinDias}, 75)
                WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.95 THEN GREATEST($${pMinDias} - 10, 60)
                ELSE GREATEST($${pMinDias} - 20, 45)
              END
            )
          )
        )::int AS estoque_ideal,

        CASE
          WHEN projecao_mensal <= 0 AND estoque_futuro > 0 THEN 'EXCESSO'
          WHEN projecao_mensal <= 0 THEN 'SEM GIRO'
          WHEN estoque_futuro <= 0 THEN 'RUPTURA'
          WHEN (estoque_futuro / NULLIF((projecao_mensal / 30.0), 0)) < 15 THEN 'COMPRAR URGENTE'
          WHEN (estoque_futuro / NULLIF((projecao_mensal / 30.0), 0)) < (
            CASE
              WHEN total_venda_12m_geral <= 0 THEN GREATEST($${pMinDias} - 20, 45)
              WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.80 THEN GREATEST($${pMinDias}, 75)
              WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.95 THEN GREATEST($${pMinDias} - 10, 60)
              ELSE GREATEST($${pMinDias} - 20, 45)
            END
          ) THEN 'COMPRAR'
          WHEN (estoque_futuro / NULLIF((projecao_mensal / 30.0), 0)) > (
            CASE
              WHEN total_venda_12m_geral <= 0 THEN GREATEST($${pMinDias} - 20, 45)
              WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.80 THEN GREATEST($${pMinDias}, 75)
              WHEN (venda_acumulada / NULLIF(total_venda_12m_geral, 0)) <= 0.95 THEN GREATEST($${pMinDias} - 10, 60)
              ELSE GREATEST($${pMinDias} - 20, 45)
            END
          ) * 1.50 THEN 'EXCESSO'
          ELSE 'MANTER'
        END AS status_otb

      FROM rankeado
      WHERE vendas_12m > 0 OR estoque_futuro > 0
      ORDER BY compra_sugerida DESC, vendas_12m DESC, chave
      LIMIT $${pLimit};
    `;

    const r = await querySafe(sql, params, 180000);
    const rows = r.rows || [];
const paramsGraficos = params.slice(0, pMinDias - 1);

const sqlGraficos = `
WITH meses AS (
  SELECT
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '11 month'" : "date_trunc('month', CURRENT_DATE) - interval '12 month'"})::date AS m1,
    (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) + interval '1 month'" : "date_trunc('month', CURRENT_DATE)"})::date AS fim_periodo
),

base_prod AS (
  SELECT
    TRIM(pr.codigo) AS cod_produto
  FROM produtos pr
  WHERE COALESCE(pr.desativar, false) = false
  ${filtrosBaseProd}
),

vendas AS (
  SELECT
    LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
    LEFT(TRIM(m.produto)::text, 6) AS cod_produto,
    SUBSTR(TRIM(m.produto)::text, 7, 2) AS tamanho,
    SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
        WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
        ELSE 0
      END
    ) AS qtd
  FROM movimento m
  JOIN base_prod bp
    ON bp.cod_produto = LEFT(TRIM(m.produto)::text, 6)
  WHERE m.estoque
    AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
    AND m.data::date >= (SELECT m1 FROM meses)
    AND m.data::date <  (SELECT fim_periodo FROM meses)
    ${empMovSql}
  GROUP BY 1,2,3
),

base AS (
  SELECT
    v.empresa,
    v.tamanho,
    v.qtd,
    TRIM(COALESCE(d.descricao, '')) AS departamento,
    TRIM(COALESCE(g.descricao, '')) AS grupo,
    TRIM(COALESCE(mk.descricao, '')) AS marca,
    TRIM(COALESCE(pr.complemento, '')) AS complemento,
TRIM(COALESCE(camp.campanha, '')) AS campanha,
TRIM(COALESCE(col.descricao, pr.colecao, '')) AS subgrupo,
TRIM(COALESCE(l.descricao, pr.linha, '')) AS linha,
TRIM(COALESCE(pr.corx, '')) AS cor,
TRIM(COALESCE(pf.fornecedor, '')) AS fornecedor
  FROM vendas v
  JOIN produtos pr ON TRIM(pr.codigo) = v.cod_produto
  LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(pr.departamento)
  LEFT JOIN grupos g ON TRIM(g.codigo) = TRIM(pr.grupo)
  LEFT JOIN marcas mk ON TRIM(mk.codigo) = TRIM(pr.marca)
LEFT JOIN linhas l
  ON TRIM(l.codigo) = TRIM(pr.linha)

LEFT JOIN colecoes col
  ON TRIM(col.codigo) = TRIM(pr.colecao)

LEFT JOIN LATERAL (
  SELECT TRIM(COALESCE(pc.descricao, '')) AS campanha
  FROM promocoes_produtos pp
  JOIN promocoes_cadastro pc
    ON TRIM(pp.promocao::text) = TRIM(pc.codigo::text)
  WHERE
    CASE
      WHEN LEFT(TRIM(pp.codigo), 1) = 'P'
        THEN SUBSTRING(TRIM(pp.codigo), 2, 6)
      ELSE SUBSTRING(TRIM(pp.codigo), 1, 6)
    END = TRIM(pr.codigo)
    AND pc.fim::date >= CURRENT_DATE
    AND COALESCE(TRIM(pc.descricao::text), '') <> ''
  ORDER BY pp.cadastro DESC NULLS LAST
  LIMIT 1
) camp ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      CASE
        WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
          THEN ${fornecedorNomeExpr("pe")}
        ELSE cod_fornecedor
      END AS fornecedor
    FROM (
      SELECT
        COALESCE(
          NULLIF(TRIM(pr.fornecedor::text), ''),
          (
            SELECT TRIM(pf1.fornecedor::text)
            FROM produtos_fornecedor pf1
            WHERE TRIM(pf1.produtoseta::text) = TRIM(pr.codigo::text)
            ORDER BY TRIM(pf1.codigo::text)
            LIMIT 1
          )
        ) AS cod_fornecedor
    ) z
    LEFT JOIN pessoas pe
      ON TRIM(pe.codigo::text) = z.cod_fornecedor
  ) pf ON TRUE
)

SELECT jsonb_build_object(
  'empresa',      (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(empresa,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'fornecedor',  (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(fornecedor,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'complemento', (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(complemento,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'campanha',    (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(campanha,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'marca',       (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(marca,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'departamento',(SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(departamento,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'grupo',       (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(grupo,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'subgrupo',    (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(subgrupo,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'linha',       (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(linha,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'cor',         (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(cor,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
  'tamanho',     (SELECT jsonb_agg(x ORDER BY valor DESC) FROM (SELECT COALESCE(NULLIF(tamanho,''),'SEM INFORMAÇÃO') AS nome, SUM(qtd)::numeric AS valor FROM base GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x)
) AS graficos;
`;

const rGraficos = await querySafe(sqlGraficos, paramsGraficos, 120000);
const graficos = rGraficos.rows?.[0]?.graficos || {};
    const resumo = {
      linhas: rows.length,
      venda_12m_total: rows.reduce((a, x) => a + Number(x.vendas_12m || 0), 0),
      estoque_total: rows.reduce((a, x) => a + Number(x.estoque || 0), 0),
      em_transito_total: rows.reduce((a, x) => a + Number(x.em_transito || 0), 0),
      estoque_futuro_total: rows.reduce((a, x) => a + Number(x.estoque_futuro || 0), 0),
      projecao_mensal_total: rows.reduce((a, x) => a + Number(x.projecao_mensal || 0), 0),
      compra_total: rows.reduce((a, x) => a + Number(x.compra_sugerida || 0), 0),
      qtd_a: rows.filter((x) => x.abc === "A").length,
      qtd_b: rows.filter((x) => x.abc === "B").length,
      qtd_c: rows.filter((x) => x.abc === "C").length,
      qtd_comprar_urgente: rows.filter((x) => x.status_otb === "COMPRAR URGENTE").length,
      qtd_comprar: rows.filter((x) => x.status_otb === "COMPRAR").length,
      qtd_manter: rows.filter((x) => x.status_otb === "MANTER").length,
      qtd_excesso: rows.filter((x) => x.status_otb === "EXCESSO").length,
      qtd_ruptura: rows.filter((x) => x.status_otb === "RUPTURA").length,
      qtd_sem_giro: rows.filter((x) => x.status_otb === "SEM GIRO").length,
    };

    console.log(
      `⏱️ /api/otb ${Date.now() - tInicio}ms linhas:${rows.length} compra:${resumo.compra_total} fornecedorCods:${fornCodigos.length}`
    );

const rPeriodos = await querySafe(`
  WITH meses AS (
    SELECT
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '11 month'" : "date_trunc('month', CURRENT_DATE) - interval '12 month'"})::date AS m1,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '10 month'" : "date_trunc('month', CURRENT_DATE) - interval '11 month'"})::date AS m2,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '9 month'" : "date_trunc('month', CURRENT_DATE) - interval '10 month'"})::date AS m3,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '8 month'" : "date_trunc('month', CURRENT_DATE) - interval '9 month'"})::date AS m4,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '7 month'" : "date_trunc('month', CURRENT_DATE) - interval '8 month'"})::date AS m5,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '6 month'" : "date_trunc('month', CURRENT_DATE) - interval '7 month'"})::date AS m6,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '5 month'" : "date_trunc('month', CURRENT_DATE) - interval '6 month'"})::date AS m7,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '4 month'" : "date_trunc('month', CURRENT_DATE) - interval '5 month'"})::date AS m8,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '3 month'" : "date_trunc('month', CURRENT_DATE) - interval '4 month'"})::date AS m9,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '2 month'" : "date_trunc('month', CURRENT_DATE) - interval '3 month'"})::date AS m10,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE) - interval '1 month'" : "date_trunc('month', CURRENT_DATE) - interval '2 month'"})::date AS m11,
      (${incluirMesAtual ? "date_trunc('month', CURRENT_DATE)" : "date_trunc('month', CURRENT_DATE) - interval '1 month'"})::date AS m12
  )
  SELECT ARRAY[
    TO_CHAR(m1,'MM/YYYY'),
    TO_CHAR(m2,'MM/YYYY'),
    TO_CHAR(m3,'MM/YYYY'),
    TO_CHAR(m4,'MM/YYYY'),
    TO_CHAR(m5,'MM/YYYY'),
    TO_CHAR(m6,'MM/YYYY'),
    TO_CHAR(m7,'MM/YYYY'),
    TO_CHAR(m8,'MM/YYYY'),
    TO_CHAR(m9,'MM/YYYY'),
    TO_CHAR(m10,'MM/YYYY'),
    TO_CHAR(m11,'MM/YYYY'),
    TO_CHAR(m12,'MM/YYYY')
  ] AS periodos
  FROM meses
`, [], 10000);

const periodos = rPeriodos.rows?.[0]?.periodos || [];
res.json({
  ok: true,
  visao,
  incluir_mes_atual: incluirMesAtual,
  periodos,
  resumo,
  graficos,
  data: rows,
});
  } catch (e) {
    console.error("Erro /api/otb:", e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});

// ======================================================
// OTB DETALHE PRODUTO
// ======================================================
app.get("/api/otb/detalhe", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    const empresasRaw = String(req.query.empresas || "").trim();

    const mesesAnalise = Math.min(12, Math.max(6, Number(req.query.meses || 12)));

const incluirMesAtual = String(req.query.incluir_mes_atual || "0") === "1";

    if (!codigo) {
      return res.status(400).json({ ok: false, erro: "Informe o código do produto." });
    }

    const empList = await resolveEmpresasFiltro(empresasRaw);

    const hojeDetalhe = new Date();

const fimDetalhe = incluirMesAtual
  ? new Date(hojeDetalhe.getFullYear(), hojeDetalhe.getMonth() + 1, 1)
  : new Date(hojeDetalhe.getFullYear(), hojeDetalhe.getMonth(), 1);

const iniDetalhe = incluirMesAtual
  ? new Date(hojeDetalhe.getFullYear(), hojeDetalhe.getMonth() - (mesesAnalise - 1), 1)
  : new Date(hojeDetalhe.getFullYear(), hojeDetalhe.getMonth() - mesesAnalise, 1);
    const dataSQL = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const paramsProduto = [codigo];
    const paramsMesLoja = [codigo, dataSQL(iniDetalhe), dataSQL(fimDetalhe)];
    const paramsEstoqueLoja = [codigo];
    const paramsGrade = [codigo, dataSQL(iniDetalhe), dataSQL(fimDetalhe)];
const paramsRentabilidade = [codigo, dataSQL(iniDetalhe), dataSQL(fimDetalhe)];

    let empMovSql = "";
    let empEstSql = "";
    let empPedSql = "";
    let empGradeMovSql = "";
let empRentSql = "";

    if (empList.length) {
      const startMov = paramsMesLoja.length + 1;
      empList.forEach((e) => paramsMesLoja.push(e));
      const phMov = empList.map((_, i) => `$${startMov + i}`).join(",");

      const startEst = paramsEstoqueLoja.length + 1;
      empList.forEach((e) => paramsEstoqueLoja.push(e));
      const phEst = empList.map((_, i) => `$${startEst + i}`).join(",");

      const startGrade = paramsGrade.length + 1;
      empList.forEach((e) => paramsGrade.push(e));
      const phGrade = empList.map((_, i) => `$${startGrade + i}`).join(",");

      empMovSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${phMov}) `;
      empEstSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${phEst}) `;
      empPedSql = ` AND LPAD(TRIM(p.empresa::text), 2, '0') IN (${phEst}) `;
      empGradeMovSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${phGrade}) `;
const startRent = paramsRentabilidade.length + 1;
empList.forEach((e) => paramsRentabilidade.push(e));
const phRent = empList.map((_, i) => `$${startRent + i}`).join(",");

empRentSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${phRent}) `;
    }

    const sqlProduto = `
      SELECT
        TRIM(pr.codigo) AS codigo,
        TRIM(pr.descricao) AS descricao,
        TRIM(COALESCE(d.descricao, '')) AS departamento,
        TRIM(COALESCE(g.descricao, '')) AS grupo,
        TRIM(COALESCE(mk.descricao, '')) AS marca,
        TRIM(COALESCE(pf.fornecedor, '')) AS fornecedor,
        ('/foto?codigo=' || TRIM(pr.codigo)) AS foto_url
      FROM produtos pr
      LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(pr.departamento)
      LEFT JOIN grupos g ON TRIM(g.codigo) = TRIM(pr.grupo)
      LEFT JOIN marcas mk ON TRIM(mk.codigo) = TRIM(pr.marca)
      LEFT JOIN LATERAL (
        SELECT
          CASE
            WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
              THEN cod_fornecedor || ' - ' || ${fornecedorNomeExpr("pe")}
            ELSE cod_fornecedor
          END AS fornecedor
        FROM (
          SELECT
            COALESCE(
              NULLIF(TRIM(pr.fornecedor::text), ''),
              (
                SELECT TRIM(pf1.fornecedor::text)
                FROM produtos_fornecedor pf1
                WHERE TRIM(pf1.produtoseta::text) = TRIM(pr.codigo::text)
                ORDER BY TRIM(pf1.codigo::text)
                LIMIT 1
              )
            ) AS cod_fornecedor
        ) z
        LEFT JOIN pessoas pe ON TRIM(pe.codigo::text) = z.cod_fornecedor
      ) pf ON TRUE
      WHERE TRIM(pr.codigo) = $1
      LIMIT 1;
    `;

    const sqlMesLoja = `
      WITH meses AS (
        SELECT generate_series($2::date, ($3::date - interval '1 month')::date, interval '1 month')::date AS mes_ref
      ),
      lojas AS (
        SELECT DISTINCT LPAD(TRIM(m.empresa::text), 2, '0') AS empresa
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          ${empMovSql}
      ),
      base AS (
        SELECT ms.mes_ref, lj.empresa
        FROM meses ms
        CROSS JOIN lojas lj
      ),
      vendas AS (
        SELECT
          date_trunc('month', m.data::date)::date AS mes_ref,
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS vendas
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          AND m.estoque
          AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
          AND m.data::date >= $2::date
          AND m.data::date <  $3::date
          ${empMovSql}
        GROUP BY 1, 2
      )
      SELECT TO_CHAR(b.mes_ref, 'MM/YYYY') AS mes, b.empresa, COALESCE(v.vendas, 0) AS vendas
      FROM base b
      LEFT JOIN vendas v ON v.mes_ref = b.mes_ref AND v.empresa = b.empresa
      ORDER BY b.mes_ref, b.empresa;
    `;

    const sqlEstoqueLoja = `
      WITH estoque AS (
        SELECT
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          SUM(${sumMovExpr("m")}) AS estoque
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          AND m.estoque
          ${empEstSql}
        GROUP BY 1
      ),
      transito AS (
        SELECT
          LPAD(TRIM(p.empresa::text), 2, '0') AS empresa,
          SUM(COALESCE(pd.pquantidade::numeric, 0)) AS em_transito
        FROM pedidos p
        JOIN pedidos_detalhes pd ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)
        WHERE LEFT(TRIM(pd.produto)::text, 6) = $1
          AND TRIM(COALESCE(p.status::text,'')) = 'A'
          ${empPedSql}
        GROUP BY 1
      ),
      lojas AS (
        SELECT empresa FROM estoque
        UNION
        SELECT empresa FROM transito
      )
      SELECT
        l.empresa,
        COALESCE(e.estoque, 0) AS estoque,
        COALESCE(t.em_transito, 0) AS em_transito,
        COALESCE(e.estoque, 0) + COALESCE(t.em_transito, 0) AS estoque_futuro
      FROM lojas l
      LEFT JOIN estoque e ON e.empresa = l.empresa
      LEFT JOIN transito t ON t.empresa = l.empresa
      ORDER BY l.empresa;
    `;

    const sqlGradeTamanhoEmpresa = `
      WITH vendas AS (
        SELECT
          SUBSTR(TRIM(m.produto)::text, 7, 2) AS tamanho,
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS vendido
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          AND m.estoque
          AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
          AND m.data::date >= $2::date
          AND m.data::date <  $3::date
          ${empGradeMovSql}
        GROUP BY 1, 2
      ),
      estoque AS (
        SELECT
          SUBSTR(TRIM(m.produto)::text, 7, 2) AS tamanho,
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
          SUM(${sumMovExpr("m")}) AS estoque
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          AND m.estoque
          ${empGradeMovSql}
        GROUP BY 1, 2
      ),
      base AS (
        SELECT tamanho, empresa FROM vendas
        UNION
        SELECT tamanho, empresa FROM estoque
      )
      SELECT
        b.tamanho,
        b.empresa,
        COALESCE(v.vendido, 0) AS vendido,
        COALESCE(e.estoque, 0) AS estoque
      FROM base b
      LEFT JOIN vendas v ON v.tamanho = b.tamanho AND v.empresa = b.empresa
      LEFT JOIN estoque e ON e.tamanho = b.tamanho AND e.empresa = b.empresa
      WHERE TRIM(COALESCE(b.tamanho,'')) <> ''
      ORDER BY b.tamanho, b.empresa;
    `;
const sqlRentabilidade = `
  SELECT
    COALESCE(SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric,0))
        WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(m.quantidade::numeric,0))
        ELSE 0
      END
    ),0) AS qtd_vendida,

    COALESCE(SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.total::numeric,0))
        WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(m.total::numeric,0))
        ELSE 0
      END
    ),0) AS valor_vendido,

    COALESCE(SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
          THEN ABS(COALESCE(m.quantidade::numeric,0) * COALESCE(m.custo::numeric,0))
        WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
          THEN -ABS(COALESCE(m.quantidade::numeric,0) * COALESCE(m.custo::numeric,0))
        ELSE 0
      END
    ),0) AS custo_total
  FROM movimento m
  WHERE LEFT(TRIM(m.produto)::text, 6) = $1
    AND m.estoque
    AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC')
    AND m.data::date >= $2::date
    AND m.data::date <  $3::date
    ${empRentSql}
`;
    const [rProduto, rMesLoja, rEstoqueLoja, rGrade, rRent] = await Promise.all([
  querySafe(sqlProduto, paramsProduto, 60000),
  querySafe(sqlMesLoja, paramsMesLoja, 90000),
  querySafe(sqlEstoqueLoja, paramsEstoqueLoja, 90000),
  querySafe(sqlGradeTamanhoEmpresa, paramsGrade, 90000),
  querySafe(sqlRentabilidade, paramsRentabilidade, 90000),
]);
    const rent = rRent.rows?.[0] || {};

    const qtdVendida = Number(rent.qtd_vendida || 0);
    const valorVendido = Number(rent.valor_vendido || 0);
    const custoTotal = Number(rent.custo_total || 0);

    const precoMedio = qtdVendida !== 0 ? valorVendido / qtdVendida : 0;
    const custoMedio = qtdVendida !== 0 ? custoTotal / qtdVendida : 0;
    const lucroBruto = valorVendido - custoTotal;
    const markup = custoMedio > 0 ? precoMedio / custoMedio : 0;
    const margemPct = valorVendido > 0 ? (lucroBruto / valorVendido) * 100 : 0;
    res.json({
      ok: true,
      meses: mesesAnalise,
      produto: rProduto.rows?.[0] || { codigo, foto_url: `/foto?codigo=${codigo}` },
      mes_loja: rMesLoja.rows || [],
      estoque_loja: rEstoqueLoja.rows || [],
      grade_tamanho_empresa: rGrade.rows || [],
rentabilidade: {
  qtd_vendida: qtdVendida,
  valor_vendido: valorVendido,
  custo_total: custoTotal,
  preco_medio: precoMedio,
  custo_medio: custoMedio,
  lucro_bruto: lucroBruto,
  markup,
  margem_pct: margemPct
},
    });

  } catch (e) {
    console.error("Erro /api/otb/detalhe:", e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});
// ======================================================
// GIRO DE PRODUTOS
// ======================================================
app.get("/api/giro", async (req, res) => {
  const tInicio = Date.now();

  try {
    const empresasRaw = String(req.query.empresas || req.query.empresa || "").trim();
    const departamento = String(req.query.departamento || "").trim();
    const grupo = String(req.query.grupo || "").trim();
    const marca = String(req.query.marca || "").trim();
    const fornecedor = String(req.query.fornecedor || "").trim();
    const complemento = String(req.query.complemento || "").trim();
    const busca = String(req.query.busca || "").trim();

    const limit = clampInt(req.query.limit, 1, 20000, 3000);

    const diasInformado = parseInt(String(req.query.dias ?? "").trim(), 10);
    const dias = Number.isFinite(diasInformado)
      ? Math.max(1, Math.min(365, diasInformado))
      : 30;

    const usarBaseDiaria = dias <= 30;

    const empList = await resolveEmpresasFiltro(empresasRaw);
const depCodigos = await resolveDepartamentoCodigos(departamento);
const grpCodigos = await resolveGrupoCodigos(grupo);
const marcaCodigos = await resolveMarcaCodigos(marca);
const fornCodigos = await resolveFornecedorCodigos(fornecedor);

    const params = [];
    let empMovSql = "";
    let empPedSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empMovSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
      empPedSql = ` AND LPAD(TRIM(p.empresa::text), 2, '0') IN (${ph}) `;
    }

    let filtrosBaseProd = "";
let filtrosEnriquecido = "";

if (depCodigos.length) {
  const start = params.length + 1;
  depCodigos.forEach((c) => params.push(c));
  const ph = depCodigos.map((_, i) => `$${start + i}`).join(",");
  filtrosBaseProd += ` AND TRIM(pr.departamento) IN (${ph}) `;
  filtrosEnriquecido += ` AND TRIM(pr.departamento) IN (${ph}) `;
} else if (departamento) {
  const depTokens = parseMultiTokens(departamento);
  const conds = [];

  for (const token of depTokens) {
    const codigo = normalizeCodeToken(token);

    if (codigo) {
      params.push(codigo);
      conds.push(`TRIM(pr.departamento) = $${params.length}`);
    }

    params.push(`%${token}%`);
    conds.push(`COALESCE(d.descricao,'') ILIKE $${params.length}`);
  }

  if (conds.length) {
    filtrosEnriquecido += ` AND (${conds.join(" OR ")}) `;
  }
}

if (grpCodigos.length) {
  const start = params.length + 1;
  grpCodigos.forEach((c) => params.push(c));
  const ph = grpCodigos.map((_, i) => `$${start + i}`).join(",");
  filtrosBaseProd += ` AND TRIM(pr.grupo) IN (${ph}) `;
  filtrosEnriquecido += ` AND TRIM(pr.grupo) IN (${ph}) `;
}

if (marcaCodigos.length) {
  const start = params.length + 1;
  marcaCodigos.forEach((c) => params.push(c));
  const ph = marcaCodigos.map((_, i) => `$${start + i}`).join(",");
  filtrosBaseProd += ` AND TRIM(pr.marca) IN (${ph}) `;
  filtrosEnriquecido += ` AND TRIM(pr.marca) IN (${ph}) `;
}

    if (fornCodigos.length) {
      const start = params.length + 1;
      fornCodigos.forEach((c) => params.push(c));
      const ph = fornCodigos.map((_, i) => `$${start + i}`).join(",");

      filtrosBaseProd += `
        AND TRIM(
          COALESCE(
            NULLIF(TRIM(pr.fornecedor::text), ''),
            (
              SELECT TRIM(pf1.fornecedor::text)
              FROM produtos_fornecedor pf1
              WHERE TRIM(pf1.produtoseta::text) = TRIM(pr.codigo::text)
              ORDER BY TRIM(pf1.codigo::text)
              LIMIT 1
            )
          )
        ) IN (${ph})
      `;
    }

if (complemento) {
  const comps = String(complemento || "")
    .split(/[;,]+/g)
    .map(x => x.trim())
    .filter(Boolean);

  if (comps.length) {
    const start = params.length + 1;

    comps.forEach(c => {
      params.push(`%${c}%`);
    });

    const ph = comps
      .map((_, i) => `COALESCE(pr.complemento, '') ILIKE $${start + i}`)
      .join(" OR ");

    filtrosBaseProd += `
      AND (${ph})
    `;
  }
}

if (busca) {
      params.push(`%${busca}%`);
      const pBusca = `$${params.length}`;

      filtrosBaseProd += `
        AND (
          TRIM(pr.codigo) ILIKE ${pBusca}
          OR COALESCE(pr.descricao, '') ILIKE ${pBusca}
          OR COALESCE(pr.complemento, '') ILIKE ${pBusca}
          OR COALESCE(pr.corx, '') ILIKE ${pBusca}
          OR COALESCE(pr.referencia, '') ILIKE ${pBusca}
        )
      `;
    }

    params.push(dias);
    const pDias = params.length;

    params.push(limit);
    const pLimit = params.length;

    const sql = `
      WITH base_prod AS (
        SELECT
          TRIM(pr.codigo) AS codigo,
          TRIM(pr.descricao) AS descricao,
          TRIM(COALESCE(pr.complemento, '')) AS complemento,
          TRIM(COALESCE(d.descricao, '')) AS departamento,
          TRIM(COALESCE(g.descricao, '')) AS grupo,
          TRIM(COALESCE(mk.descricao, '')) AS marca,
          TRIM(
            COALESCE(
              (
                SELECT
                  CASE 	
                    WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
                      THEN cod_fornecedor || ' - ' || ${fornecedorNomeExpr("pe")}
                    ELSE cod_fornecedor
                  END
                FROM (
                  SELECT
                    COALESCE(
                      NULLIF(TRIM(pr.fornecedor::text), ''),
                      (
                        SELECT TRIM(pf1.fornecedor::text)
                        FROM produtos_fornecedor pf1
                        WHERE TRIM(pf1.produtoseta::text) = TRIM(pr.codigo::text)
                        ORDER BY TRIM(pf1.codigo::text)
                        LIMIT 1
                      )
                    ) AS cod_fornecedor
                ) z
                LEFT JOIN pessoas pe
                  ON TRIM(pe.codigo::text) = z.cod_fornecedor
              ),
              ''
            )
          ) AS fornecedor,
          COALESCE(pr.preco::numeric, 0) AS preco,
          COALESCE(pr.custo::numeric, 0) AS custo
        FROM produtos pr
        LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(pr.departamento)
        LEFT JOIN grupos g ON TRIM(g.codigo) = TRIM(pr.grupo)
        LEFT JOIN marcas mk ON TRIM(mk.codigo) = TRIM(pr.marca)
        WHERE COALESCE(pr.desativar, false) = false
          ${filtrosBaseProd}
      ),

      estoque AS (
        SELECT
          LEFT(TRIM(m.produto)::text, 6) AS codigo,
          SUM(${sumMovExpr("m")}) AS estoque
        FROM movimento m
        WHERE m.estoque
          ${empMovSql}
        GROUP BY 1
      ),

      vendas AS (
        SELECT
          LEFT(TRIM(m.produto)::text, 6) AS codigo,
          SUM(
            CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
              ELSE 0
            END
          ) AS vendas_periodo
        FROM movimento m
        WHERE m.estoque
          AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
          AND m.data::date >= (CURRENT_DATE - ($${pDias}::int - 1))
          ${empMovSql}
        GROUP BY 1
      ),

      pedidos AS (
        SELECT
          LEFT(TRIM(pd.produto)::text, 6) AS codigo,
          SUM(CASE WHEN TRIM(COALESCE(p.status::text,'')) = 'A' THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedidos_abertos,
          SUM(CASE WHEN TRIM(COALESCE(p.status::text,'')) = 'C' THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedidos_conferidos
        FROM pedidos p
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)
        WHERE TRIM(COALESCE(p.status::text,'')) IN ('A', 'C')
          ${empPedSql}
        GROUP BY 1
      ),

      enriquecido AS (
        SELECT
          bp.codigo,
          bp.descricao,
          bp.complemento,
          bp.departamento,
          bp.grupo,
          bp.marca,
          bp.fornecedor,
          bp.preco,
          bp.custo,
          COALESCE(e.estoque, 0) AS estoque,
          COALESCE(p.pedidos_abertos, 0) AS pedidos_abertos,
          COALESCE(p.pedidos_conferidos, 0) AS pedidos_conferidos,
          GREATEST(COALESCE(e.estoque, 0) + COALESCE(p.pedidos_abertos, 0) + COALESCE(p.pedidos_conferidos, 0), 0) AS estoque_base_giro,
          COALESCE(v.vendas_periodo, 0) AS vendas_periodo
        FROM base_prod bp
        LEFT JOIN estoque e ON e.codigo = bp.codigo
        LEFT JOIN pedidos p ON p.codigo = bp.codigo
        LEFT JOIN vendas v ON v.codigo = bp.codigo
      ),

      final AS (
        SELECT
          e.*,

          CASE
            WHEN $${pDias} <= 30
              THEN (e.vendas_periodo / GREATEST($${pDias}, 1)::numeric)
            ELSE (e.vendas_periodo / GREATEST(($${pDias}::numeric / 30.0), 1))
          END AS media_periodo,

          CASE
            WHEN e.estoque_base_giro <= 0 AND e.vendas_periodo > 0 THEN 999
            WHEN e.estoque_base_giro <= 0 THEN 0
            ELSE (e.vendas_periodo / NULLIF(e.estoque_base_giro, 0))
          END AS giro_periodo,

          CASE
            WHEN $${pDias} <= 30 THEN
              CASE
                WHEN e.estoque_base_giro <= 0 AND (e.vendas_periodo / GREATEST($${pDias}, 1)::numeric) > 0 THEN 0
                WHEN (e.vendas_periodo / GREATEST($${pDias}, 1)::numeric) <= 0 THEN 999
                ELSE e.estoque_base_giro / NULLIF((e.vendas_periodo / GREATEST($${pDias}, 1)::numeric), 0)
              END
            ELSE
              CASE
                WHEN e.estoque_base_giro <= 0 AND (e.vendas_periodo / GREATEST(($${pDias}::numeric / 30.0), 1)) > 0 THEN 0
                WHEN (e.vendas_periodo / GREATEST(($${pDias}::numeric / 30.0), 1)) <= 0 THEN 999
                ELSE (e.estoque_base_giro / NULLIF((e.vendas_periodo / GREATEST(($${pDias}::numeric / 30.0), 1)), 0)) * 30
              END
          END AS cobertura_dias_periodo
        FROM enriquecido e
      )

      SELECT
        codigo,
        descricao,
        complemento,
        departamento,
        grupo,
        marca,
        fornecedor,

        ROUND(estoque::numeric, 2) AS estoque,
        ROUND(pedidos_abertos::numeric, 2) AS pedidos_abertos,
        ROUND(pedidos_conferidos::numeric, 2) AS pedidos_conferidos,
        ROUND((pedidos_abertos + pedidos_conferidos)::numeric, 2) AS pedidos_total,
        ROUND(estoque_base_giro::numeric, 2) AS estoque_base_giro,

        ROUND(vendas_periodo::numeric, 2) AS vendas_periodo,
        ROUND(media_periodo::numeric, 2) AS media_periodo,
        ROUND(giro_periodo::numeric, 4) AS giro_periodo,
        ROUND(cobertura_dias_periodo::numeric, 2) AS cobertura_dias_periodo,

        CASE
          WHEN vendas_periodo <= 0 AND estoque_base_giro > 0 THEN 'SEM GIRO'
          WHEN estoque_base_giro <= 0 AND vendas_periodo > 0 THEN 'RUPTURA'
          WHEN giro_periodo >= 1.00 THEN 'ALTO GIRO'
          WHEN giro_periodo >= 0.30 THEN 'GIRO MEDIO'
          ELSE 'BAIXO GIRO'
        END AS classificacao,

        ('/foto?codigo=' || codigo) AS foto_url
      FROM final
      WHERE estoque > 0 OR pedidos_abertos > 0 OR pedidos_conferidos > 0
      ORDER BY giro_periodo DESC, vendas_periodo DESC, descricao
      LIMIT $${pLimit};
    `;

    const r = await querySafe(sql, params, 180000);
    const rows = r.rows || [];

    const resumo = {
      linhas: rows.length,
      dias,
      base_calculo: usarBaseDiaria ? "dia" : "mes",
      estoque_total: rows.reduce((a, x) => a + Number(x.estoque || 0), 0),
      pedidos_abertos_total: rows.reduce((a, x) => a + Number(x.pedidos_abertos || 0), 0),
      pedidos_conferidos_total: rows.reduce((a, x) => a + Number(x.pedidos_conferidos || 0), 0),
      pedidos_total: rows.reduce((a, x) => a + Number(x.pedidos_total || 0), 0),
      estoque_base_giro_total: rows.reduce((a, x) => a + Number(x.estoque_base_giro || 0), 0),
      vendas_periodo_total: rows.reduce((a, x) => a + Number(x.vendas_periodo || 0), 0),
      media_periodo_total: rows.reduce((a, x) => a + Number(x.media_periodo || 0), 0),
      qtd_alto_giro: rows.filter((x) => x.classificacao === "ALTO GIRO").length,
      qtd_giro_medio: rows.filter((x) => x.classificacao === "GIRO MEDIO").length,
      qtd_baixo_giro: rows.filter((x) => x.classificacao === "BAIXO GIRO").length,
      qtd_sem_giro: rows.filter((x) => x.classificacao === "SEM GIRO").length,
      qtd_ruptura: rows.filter((x) => x.classificacao === "RUPTURA").length,
    };

    console.log(
      `⏱️ /api/giro ${Date.now() - tInicio}ms linhas:${rows.length} dias:${dias} base:${resumo.base_calculo} pedidosA:${resumo.pedidos_abertos_total} pedidosC:${resumo.pedidos_conferidos_total} baseGiro:${resumo.estoque_base_giro_total}`
    );

    res.json({
      ok: true,
      dias,
      base_calculo: resumo.base_calculo,
      resumo,
      data: rows,
    });
  } catch (e) {
    console.error("Erro /api/giro:", e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});
// ======================================================
// GIRO - MOVIMENTO ESTOQUE
// ======================================================
app.get("/api/giro/movimento-estoque", async (req, res) => {
  try {

const {
  empresa = "",
  dias = "365",
  busca = "",
  fornecedor = "",
  marca = "",
  departamento = "",
  grupo = "",
  complemento = ""
} = req.query;

const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
const depCodigos = await resolveDepartamentoCodigos(String(departamento || "").trim());
const grpCodigos = await resolveGrupoCodigos(String(grupo || "").trim());
const marcaCodigos = await resolveMarcaCodigos(String(marca || "").trim());
const fornCodigos = await resolveFornecedorCodigos(String(fornecedor || "").trim());

const params = [Number(dias || 365)];

let empSql = "";
let empPedSql = "";
let prodSql = "";

if (empList.length) {
  const start = params.length + 1;
  empList.forEach(e => params.push(e));

  empSql = `
    AND LPAD(TRIM(m.empresa::text),2,'0')
    IN (${empList.map((_,i)=>`$${start+i}`).join(",")})
  `;
empPedSql = `
  AND LPAD(TRIM(p.empresa::text),2,'0')
  IN (${empList.map((_,i)=>`$${start+i}`).join(",")})
`;
}

if (busca) {
  params.push(`%${busca}%`);
  prodSql += `
    AND (
      TRIM(p.codigo::text) ILIKE $${params.length}
      OR COALESCE(p.descricao::text,'') ILIKE $${params.length}
      OR COALESCE(p.complemento::text,'') ILIKE $${params.length}
      OR COALESCE(p.referencia::text,'') ILIKE $${params.length}
    )
  `;
}

if (complemento) {
  const comps = String(complemento || "")
    .split(/[;,]+/g)
    .map(x => x.trim())
    .filter(Boolean);

  if (comps.length) {
    const start = params.length + 1;
    comps.forEach(c => params.push(`%${c}%`));

    prodSql += `
      AND (
        ${comps.map((_, i) => `COALESCE(p.complemento::text,'') ILIKE $${start + i}`).join(" OR ")}
      )
    `;
  }
}

if (depCodigos.length) {
  const start = params.length + 1;
  depCodigos.forEach(c => params.push(c));

  prodSql += `
    AND TRIM(p.departamento::text)
    IN (${depCodigos.map((_,i)=>`$${start+i}`).join(",")})
  `;
}

if (grpCodigos.length) {
  const start = params.length + 1;
  grpCodigos.forEach(c => params.push(c));

  prodSql += `
    AND TRIM(p.grupo::text)
    IN (${grpCodigos.map((_,i)=>`$${start+i}`).join(",")})
  `;
}

if (marcaCodigos.length) {
  const start = params.length + 1;
  marcaCodigos.forEach(c => params.push(c));

  prodSql += `
    AND TRIM(p.marca::text)
    IN (${marcaCodigos.map((_,i)=>`$${start+i}`).join(",")})
  `;
}

if (fornCodigos.length) {
  const start = params.length + 1;
  fornCodigos.forEach(c => params.push(c));

  prodSql += `
    AND TRIM(
      COALESCE(
        NULLIF(TRIM(p.fornecedor::text), ''),
        (
          SELECT TRIM(pf1.fornecedor::text)
          FROM produtos_fornecedor pf1
          WHERE TRIM(pf1.produtoseta::text) = TRIM(p.codigo::text)
          ORDER BY TRIM(pf1.codigo::text)
          LIMIT 1
        )
      )
    ) IN (${fornCodigos.map((_,i)=>`$${start+i}`).join(",")})
  `;
}
    const sql = `
 WITH mov_periodo AS (

  SELECT
    LEFT(TRIM(m.produto)::text,6) AS produto,

SUM(
  CASE
    WHEN TRIM(COALESCE(m.operacao::text,''))='EN'
 AND TRIM(COALESCE(e.tipo::text,''))='10'
    THEN ABS(COALESCE(m.quantidade::numeric,0))
    ELSE 0
  END
) AS compra,

SUM(
  CASE
    WHEN TRIM(COALESCE(m.operacao::text,''))='EN'
 AND TRIM(COALESCE(e.tipo::text,''))='99'
    THEN ABS(COALESCE(m.quantidade::numeric,0))
    ELSE 0
  END
) AS transf_recebida,

    SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
        THEN ABS(COALESCE(m.quantidade::numeric,0))

        WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
        THEN -ABS(COALESCE(m.quantidade::numeric,0))

        ELSE 0
      END
    ) AS venda,

    SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,''))='TR'
        THEN ABS(COALESCE(m.quantidade::numeric,0))
        ELSE 0
      END
    ) AS tran_ent,

    SUM(
      CASE
        WHEN TRIM(COALESCE(m.operacao::text,''))='TE'
        THEN ABS(COALESCE(m.quantidade::numeric,0))
        ELSE 0
      END
    ) AS tran_sai,

    SUM(
      CASE
        WHEN TRIM(COALESCE(m.movimento::text,''))='E'
         AND TRIM(COALESCE(m.operacao::text,'')) NOT IN ('EN','TR')
        THEN ABS(COALESCE(m.quantidade::numeric,0))
        ELSE 0
      END
    ) AS outras_ent,

    SUM(
      CASE
        WHEN TRIM(COALESCE(m.movimento::text,''))='S'
         AND TRIM(COALESCE(m.operacao::text,'')) NOT IN ('VE','DV','VC','TE')
        THEN ABS(COALESCE(m.quantidade::numeric,0))
        ELSE 0
      END
    ) AS outras_sai

  FROM movimento m
LEFT JOIN entradas e
  ON TRIM(m.auxiliar::text) = TRIM(('EN' || e.codigo)::char(10))

  WHERE
    COALESCE(m.estoque,false)=true
    AND m.data::date >= CURRENT_DATE - ($1::int)
    ${empSql}

  GROUP BY 1
),

pedidos_prod AS (
  SELECT
    LEFT(TRIM(pd.produto)::text,6) AS produto,

    SUM(
      CASE
        WHEN TRIM(COALESCE(p.status::text,'')) = 'A'
        THEN COALESCE(pd.pquantidade::numeric,0)
        ELSE 0
      END
    ) AS pedido_aberto,

    SUM(
      CASE
        WHEN TRIM(COALESCE(p.status::text,'')) = 'C'
        THEN COALESCE(pd.pquantidade::numeric,0)
        ELSE 0
      END
    ) AS pedido_conferido

  FROM pedidos p
  JOIN pedidos_detalhes pd
    ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)

  WHERE TRIM(COALESCE(p.status::text,'')) IN ('A','C')
    ${empPedSql}

  GROUP BY 1
),

estoque_atual AS (

  SELECT
    LEFT(TRIM(m.produto)::text,6) AS produto,

    SUM(
      CASE
        WHEN TRIM(COALESCE(m.movimento::text,''))='E'
          THEN COALESCE(m.quantidade::numeric,0)

        WHEN TRIM(COALESCE(m.movimento::text,''))='S'
          THEN -COALESCE(m.quantidade::numeric,0)

        ELSE 0
      END
    ) AS estoque

  FROM movimento m

  WHERE
    COALESCE(m.estoque,false)=true
    ${empSql}

  GROUP BY 1
)
      SELECT
        p.codigo,
        p.descricao,
        p.complemento,

        COALESCE(m.compra,0) AS compra,
COALESCE(m.transf_recebida,0) AS transf_recebida,

COALESCE(pp.pedido_aberto,0) AS pedido_aberto,
COALESCE(pp.pedido_conferido,0) AS pedido_conferido,

COALESCE(m.venda,0) AS venda,
COALESCE(m.tran_ent,0) AS tran_ent,
COALESCE(m.tran_sai,0) AS tran_sai,

COALESCE(m.outras_ent,0) AS outras_ent,
COALESCE(m.outras_sai,0) AS outras_sai,

(
  COALESCE(m.tran_sai,0)
  -
  COALESCE(m.tran_ent,0)
) AS transito,

COALESCE(ea.estoque,0) AS estoque

FROM mov_periodo m
LEFT JOIN estoque_atual ea
  ON ea.produto = m.produto

LEFT JOIN pedidos_prod pp
  ON pp.produto = m.produto

JOIN produtos p
  ON TRIM(p.codigo::text) = m.produto

WHERE COALESCE(p.desativar,false) = false
  ${prodSql}

ORDER BY venda DESC
LIMIT 1000
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok: true,
      itens: r.rows || []
    });

  } catch(err) {

    console.error(err);

    res.status(500).json({
      ok:false,
      erro:err.message
    });
  }
});
// ======================================================
// GIRO - MOVIMENTO ESTOQUE DETALHE POR LOJA
// ======================================================
app.get("/api/giro/movimento-estoque-detalhe", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    const empresa = String(req.query.empresa || "").trim();
    const dias = Number(req.query.dias || 365);

    if (!codigo) {
      return res.status(400).json({ ok:false, erro:"Informe o produto." });
    }

    const empList = await resolveEmpresasFiltro(empresa);

    const params = [codigo, dias];

    let empSql = "";
    let empPedSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));

      const ph = empList.map((_,i)=>`$${start+i}`).join(",");

      empSql = `
        AND LPAD(TRIM(m.empresa::text),2,'0') IN (${ph})
      `;

      empPedSql = `
        AND LPAD(TRIM(p.empresa::text),2,'0') IN (${ph})
      `;
    }

    const sql = `
      WITH mov_periodo AS (
        SELECT
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,

          SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='EN'
             AND TRIM(COALESCE(e.tipo::text,''))='10'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END) AS compra,

          SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='EN'
             AND TRIM(COALESCE(e.tipo::text,''))='99'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END) AS transf_recebida,

          SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
            THEN -ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END) AS venda,

          SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='TR'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END) AS tran_ent,

          SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='TE'
            THEN ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END) AS tran_sai

        FROM movimento m
        LEFT JOIN entradas e
          ON TRIM(m.auxiliar::text) = TRIM(('EN' || e.codigo)::char(10))

        WHERE LEFT(TRIM(m.produto)::text,6) = $1
          AND COALESCE(m.estoque,false)=true
          AND m.data::date >= CURRENT_DATE - ($2::int)
          ${empSql}

        GROUP BY 1
      ),

      pedidos_prod AS (
        SELECT
          LPAD(TRIM(p.empresa::text),2,'0') AS empresa,

          SUM(CASE WHEN TRIM(COALESCE(p.status::text,''))='A'
            THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedido_aberto,

          SUM(CASE WHEN TRIM(COALESCE(p.status::text,''))='C'
            THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedido_conferido

        FROM pedidos p
        JOIN pedidos_detalhes pd
          ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)

        WHERE LEFT(TRIM(pd.produto)::text,6) = $1
          AND TRIM(COALESCE(p.status::text,'')) IN ('A','C')
          ${empPedSql}

        GROUP BY 1
      ),

      estoque_tamanho AS (
        SELECT
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          RIGHT(TRIM(m.produto)::text,2) AS tamanho,

          SUM(CASE
            WHEN TRIM(COALESCE(m.movimento::text,''))='E'
            THEN COALESCE(m.quantidade::numeric,0)
            WHEN TRIM(COALESCE(m.movimento::text,''))='S'
            THEN -COALESCE(m.quantidade::numeric,0)
            ELSE 0
          END) AS estoque

        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text,6) = $1
          AND COALESCE(m.estoque,false)=true
          ${empSql}

        GROUP BY 1,2
      ),

      estoque_empresa AS (
        SELECT
          empresa,
          SUM(estoque) AS estoque,
          STRING_AGG(
            tamanho || ':' || ROUND(estoque::numeric,0)::text,
            ' | '
            ORDER BY tamanho
          ) FILTER (WHERE estoque <> 0) AS estoque_tamanhos
        FROM estoque_tamanho
        GROUP BY empresa
      )

      SELECT
        COALESCE(mp.empresa, pp.empresa, ee.empresa) AS empresa,

        COALESCE(mp.compra,0) AS compra,
        COALESCE(mp.transf_recebida,0) AS transf_recebida,
        COALESCE(pp.pedido_aberto,0) AS pedido_aberto,
        COALESCE(pp.pedido_conferido,0) AS pedido_conferido,

        COALESCE(mp.venda,0) AS venda,
        COALESCE(mp.tran_ent,0) AS tran_ent,
        COALESCE(mp.tran_sai,0) AS tran_sai,

        COALESCE(mp.tran_sai,0) - COALESCE(mp.tran_ent,0) AS transito,

        COALESCE(ee.estoque,0) AS estoque,
        COALESCE(ee.estoque_tamanhos,'') AS estoque_tamanhos

      FROM mov_periodo mp
      FULL JOIN pedidos_prod pp
        ON pp.empresa = mp.empresa
      FULL JOIN estoque_empresa ee
        ON ee.empresa = COALESCE(mp.empresa, pp.empresa)

      WHERE
  COALESCE(mp.compra,0) <> 0
  OR COALESCE(mp.transf_recebida,0) <> 0
  OR COALESCE(pp.pedido_aberto,0) <> 0
  OR COALESCE(pp.pedido_conferido,0) <> 0
  OR COALESCE(mp.venda,0) <> 0
  OR COALESCE(mp.tran_ent,0) <> 0
  OR COALESCE(mp.tran_sai,0) <> 0
  OR COALESCE(ee.estoque,0) <> 0

ORDER BY empresa
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok:true,
      lojas:r.rows || []
    });

  } catch(err) {
    console.error("Erro /api/giro/movimento-estoque-detalhe:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});
// ======================================================
// GIRO - VENDAS EM VALOR / FORMA DE PAGAMENTO
// ======================================================
app.get("/api/giro/vendas-forma", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    if (!codigo) {
      return res.status(400).json({ ok: false, erro: "Informe o código do produto." });
    }

    const diasInformado = parseInt(String(req.query.dias ?? "").trim(), 10);
    const dias = Number.isFinite(diasInformado)
      ? Math.max(1, Math.min(365, diasInformado))
      : 30;

    const todas = String(req.query.todas || "0") === "1";
    const empresasRaw = String(req.query.empresas || req.query.empresa || "").trim();
    const empList = todas ? [] : await resolveEmpresasFiltro(empresasRaw);

    const params = [codigo, dias];
    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
    }

    const sql = `
  WITH base AS (
    SELECT
      LPAD(TRIM(v.empresa::text), 2, '0') AS empresa,

      SUM(
        CASE
          WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
            THEN ABS(COALESCE(m.quantidade::numeric, 0))
          WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
            THEN -ABS(COALESCE(m.quantidade::numeric, 0))
          ELSE 0
        END
      ) AS qtd_vendida,

      SUM(
        CASE
          WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
            THEN ABS(COALESCE(ft.valor::numeric, 0))
          WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC')
            THEN -ABS(COALESCE(ft.valor::numeric, 0))
          ELSE 0
        END
      ) AS valor_vendido,

      SUM(
        CASE
          WHEN agrupamento = 'Dinheiro'
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS dinheiro,

      SUM(
        CASE
          WHEN agrupamento = 'Pix'
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS pix,

      SUM(
        CASE
          WHEN agrupamento = 'Débito'
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS debito,

      SUM(
        CASE
          WHEN agrupamento = 'Crédito'
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS credito,

      SUM(
        CASE
          WHEN agrupamento = 'Cheque'
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS cheque,

      SUM(
        CASE
          WHEN agrupamento = 'Crediário'
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS crediario,

      SUM(
        CASE
          WHEN agrupamento IN ('Dinheiro','Pix','Débito','Vale Presente','Fidelidade','Depósito','Carteiras Digitais')
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS valor_avista,

      SUM(
        CASE
          WHEN agrupamento IN ('Crédito','Cheque','Crediário','Boleto','Crédito de Cliente')
            THEN CASE
              WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(ft.valor::numeric, 0))
              WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(ft.valor::numeric, 0))
              ELSE 0
            END
          ELSE 0
        END
      ) AS valor_aprazo

    FROM financeiro_titulos ft
    INNER JOIN vendas v
      ON ft.auxiliar = ('VE' || v.codigo)::char(10)
    INNER JOIN movimento m
      ON TRIM(m.auxiliar::text) = TRIM(ft.auxiliar::text)
     AND LEFT(TRIM(m.produto)::text, 6) = $1
    LEFT JOIN formasnfce nfce
      ON nfce.codigo = ft.forma

    WHERE
      (
        CASE
          WHEN v.tipo = '03' THEN v.status = 'P'
          ELSE v.status IN ('S','O')
        END
      )
      AND LEFT(ft.auxiliar, 2)::char(2) = 'VE'
      AND COALESCE(m.data::date, CURRENT_DATE) >= (CURRENT_DATE - ($2::int - 1))
      ${empSql}

    GROUP BY LPAD(TRIM(v.empresa::text), 2, '0')
  )
  SELECT *
  FROM base
  ORDER BY empresa
`;

    const r = await querySafe(sql, params, 120000);
    const rows = r.rows || [];

    res.json({
      ok: true,
      dias,
      resumo: {
        qtd_total: rows.reduce((a, x) => a + Number(x.qtd_vendida || 0), 0),
        valor_total: rows.reduce((a, x) => a + Number(x.valor_vendido || 0), 0),
        qtd_empresas: rows.length
      },
      data: rows.map((x) => ({
  empresa: String(x.empresa || ""),
  qtd_vendida: Number(x.qtd_vendida || 0),
  valor_vendido: Number(x.valor_vendido || 0),
  valor_avista: Number(x.valor_avista || 0),
  valor_aprazo: Number(x.valor_aprazo || 0),
  dinheiro: Number(x.dinheiro || 0),
  pix: Number(x.pix || 0),
  debito: Number(x.debito || 0),
  credito: Number(x.credito || 0),
  crediario: Number(x.crediario || 0),
  cheque: Number(x.cheque || 0)
}))
    });
  } catch (e) {
    console.error("Erro /api/giro/vendas-forma:", e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});
// ======================================================
// GIRO - DETALHE DAS VENDAS POR EMPRESA
// ======================================================
app.get("/api/giro/vendas-detalhe-empresa", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    const empresa = String(req.query.empresa || "").trim().padStart(2, "0");

    if (!codigo) return res.status(400).json({ ok:false, erro:"Informe o código do produto." });
    if (!empresa) return res.status(400).json({ ok:false, erro:"Informe a empresa." });

    const diasInformado = parseInt(String(req.query.dias ?? "").trim(), 10);
    const dias = Number.isFinite(diasInformado)
      ? Math.max(1, Math.min(365, diasInformado))
      : 30;

    const params = [codigo, dias, empresa];

    const sql = `
      WITH promo AS (
        SELECT
          CASE
            WHEN LEFT(TRIM(pp.codigo), 1) = 'P' THEN SUBSTRING(TRIM(pp.codigo), 2, 6)
            ELSE SUBSTRING(TRIM(pp.codigo), 1, 6)
          END AS cod_produto,
          CASE
            WHEN LEFT(TRIM(pp.codigo), 1) = 'P' THEN SUBSTRING(TRIM(pp.codigo), 8, 2)
            ELSE SUBSTRING(TRIM(pp.codigo), 7, 2)
          END AS empresa,
          COALESCE(NULLIF(TRIM(pp.condicao000001::text), '')::numeric, 0) AS valor_promocao,
          ROW_NUMBER() OVER (
            PARTITION BY
              CASE
                WHEN LEFT(TRIM(pp.codigo), 1) = 'P' THEN SUBSTRING(TRIM(pp.codigo), 2, 6)
                ELSE SUBSTRING(TRIM(pp.codigo), 1, 6)
              END,
              CASE
                WHEN LEFT(TRIM(pp.codigo), 1) = 'P' THEN SUBSTRING(TRIM(pp.codigo), 8, 2)
                ELSE SUBSTRING(TRIM(pp.codigo), 7, 2)
              END
            ORDER BY pp.cadastro DESC NULLS LAST, pp.promocao DESC
          ) AS rn
        FROM promocoes_produtos pp
WHERE EXISTS (
  SELECT 1
  FROM promocoes_cadastro pc
  WHERE TRIM(pc.codigo::text) = TRIM(pp.promocao::text)
    AND pc.fim >= CURRENT_DATE
    ${campanhaBusca ? `AND pc.descricao ILIKE '%${campanhaBusca.replace(/'/g, "''")}%'` : ""}
)
      )
      SELECT
        COALESCE(m.data::date, CURRENT_DATE) AS data_venda,
        LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
        TRIM(COALESCE(v.codigo::text, REPLACE(TRIM(m.auxiliar::text), 'VE', ''), '')) AS numero_venda,

        COALESCE(m.quantidade::numeric, 0) AS qtd,

COALESCE(
  NULLIF(p.preco::numeric, 0),
  0
) AS preco_tabela,
        COALESCE(pr.valor_promocao, 0) AS valor_promocao,

        COALESCE(m.total::numeric, 0) AS valor_vendido,

        TRIM(
          COALESCE(
            NULLIF(vend.apelido::text, ''),
            NULLIF(vend.nome::text, ''),
            v.vendedor::text,
            '-'
          )
        ) AS vendedor

      FROM movimento m
      INNER JOIN vendas v
        ON TRIM(m.auxiliar::text) = TRIM(('VE' || v.codigo)::char(10))
      LEFT JOIN produtos p
        ON TRIM(p.codigo::text) = LEFT(TRIM(m.produto)::text, 6)
      LEFT JOIN pessoas vend
  ON TRIM(vend.codigo::text) = TRIM(v.vendedor::text)
      LEFT JOIN promo pr
        ON pr.cod_produto = LEFT(TRIM(m.produto)::text, 6)
       AND pr.empresa = LPAD(TRIM(m.empresa::text), 2, '0')
       AND pr.rn = 1
      WHERE LEFT(TRIM(m.produto)::text, 6) = $1
        AND COALESCE(m.data::date, CURRENT_DATE) >= (CURRENT_DATE - ($2::int - 1))
        AND LPAD(TRIM(m.empresa::text), 2, '0') = $3
        AND TRIM(COALESCE(m.operacao::text,'')) = 'VE'
        AND (
          CASE
            WHEN v.tipo = '03' THEN v.status = 'P'
            ELSE v.status IN ('S','O')
          END
        )
      ORDER BY
        COALESCE(m.data::date, CURRENT_DATE) DESC,
        v.codigo DESC
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok: true,
      codigo,
      empresa,
      dias,
      data: (r.rows || []).map(x => ({
        data_venda: x.data_venda,
        empresa: x.empresa,
        numero_venda: x.numero_venda,
        qtd: Number(x.qtd || 0),
        preco_tabela: Number(x.preco_tabela || 0),
        valor_promocao: Number(x.valor_promocao || 0),
        valor_vendido: Number(x.valor_vendido || 0),
        vendedor: x.vendedor || "-"
      }))
    });
  } catch (e) {
    console.error("Erro /api/giro/vendas-detalhe-empresa:", e.message);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// GIRO DETALHE PRODUTO
// ======================================================
app.get("/api/giro/detalhe", async (req, res) => {
  try {
    const codigo = String(req.query.codigo || "").trim();
    if (!codigo) {
      return res.status(400).json({ ok: false, erro: "Informe o código do produto." });
    }

    const diasInformado = parseInt(String(req.query.dias ?? "").trim(), 10);
    const dias = Number.isFinite(diasInformado)
      ? Math.max(1, Math.min(365, diasInformado))
      : 30;

    const usarBaseDiaria = dias <= 30;

    const todas = String(req.query.todas || "0") === "1";
    const empresasRaw = String(req.query.empresas || req.query.empresa || "").trim();
    const empList = todas ? [] : await resolveEmpresasFiltro(empresasRaw);

    const paramsProduto = [codigo];

    const params = [codigo, dias];
    let empSqlMov = "";
    let empSqlPed = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");

      empSqlMov = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
      empSqlPed = ` AND LPAD(TRIM(p.empresa::text), 2, '0') IN (${ph}) `;
    }

    const sqlProduto = `
      SELECT
        TRIM(pr.codigo) AS codigo,
        TRIM(pr.descricao) AS descricao,
        TRIM(COALESCE(pr.complemento, '')) AS complemento,
        TRIM(COALESCE(d.descricao, '')) AS departamento,
        TRIM(COALESCE(g.descricao, '')) AS grupo,
        TRIM(COALESCE(mk.descricao, '')) AS marca,
        TRIM(COALESCE(pf.fornecedor, '')) AS fornecedor,
        COALESCE(pr.preco::numeric, 0) AS preco,
        COALESCE(pr.custo::numeric, 0) AS custo,
        ('/foto?codigo=' || TRIM(pr.codigo)) AS foto_url
      FROM produtos pr
      LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(pr.departamento)
      LEFT JOIN grupos g ON TRIM(g.codigo) = TRIM(pr.grupo)
      LEFT JOIN marcas mk ON TRIM(mk.codigo) = TRIM(pr.marca)
      LEFT JOIN LATERAL (
        SELECT
          CASE
            WHEN COALESCE(${fornecedorNomeExpr("pe")}, '') <> ''
              THEN cod_fornecedor || ' - ' || ${fornecedorNomeExpr("pe")}
            ELSE cod_fornecedor
          END AS fornecedor
        FROM (
          SELECT
            COALESCE(
              NULLIF(TRIM(pr.fornecedor::text), ''),
              (
                SELECT TRIM(pf1.fornecedor::text)
                FROM produtos_fornecedor pf1
                WHERE TRIM(pf1.produtoseta::text) = TRIM(pr.codigo::text)
                ORDER BY TRIM(pf1.codigo::text)
                LIMIT 1
              )
            ) AS cod_fornecedor
        ) z
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = z.cod_fornecedor
      ) pf ON TRUE
      WHERE TRIM(pr.codigo) = $1
      LIMIT 1;
    `;

    const sqlDetalhe = usarBaseDiaria
      ? `
        WITH vendas AS (
          SELECT
            m.data::date AS periodo_ref,
            TO_CHAR(m.data::date, 'DD/MM') AS periodo_label,
            LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
            SUM(
              CASE
                WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
                WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
                ELSE 0
              END
            ) AS vendas
          FROM movimento m
          WHERE LEFT(TRIM(m.produto)::text, 6) = $1
            AND m.estoque
            AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
            AND m.data::date >= (CURRENT_DATE - ($2::int - 1))
            ${empSqlMov}
          GROUP BY 1, 2, 3
        ),
        pedidos AS (
          SELECT
            CURRENT_DATE AS periodo_ref,
            TO_CHAR(CURRENT_DATE, 'DD/MM') AS periodo_label,
            LPAD(TRIM(p.empresa::text), 2, '0') AS empresa,
            SUM(CASE WHEN TRIM(COALESCE(p.status::text,'')) = 'A' THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedidos_abertos,
            SUM(CASE WHEN TRIM(COALESCE(p.status::text,'')) = 'C' THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedidos_conferidos
          FROM pedidos p
          JOIN pedidos_detalhes pd
            ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)
          WHERE LEFT(TRIM(pd.produto)::text, 6) = $1
            AND TRIM(COALESCE(p.status::text,'')) IN ('A', 'C')
            ${empSqlPed}
          GROUP BY 1, 2, 3
        ),
        base AS (
          SELECT DISTINCT periodo_ref, periodo_label, empresa
          FROM (
            SELECT periodo_ref, periodo_label, empresa FROM vendas
            UNION
            SELECT periodo_ref, periodo_label, empresa FROM pedidos
          ) x
        ),
        estoque AS (
          SELECT
            LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
            SUM(${sumMovExpr("m")}) AS estoque
          FROM movimento m
          WHERE LEFT(TRIM(m.produto)::text, 6) = $1
            AND m.estoque
            ${empSqlMov}
          GROUP BY 1
        )
        SELECT
          b.periodo_label AS mes,
          b.periodo_ref,
          b.empresa,
          COALESCE(v.vendas, 0) AS vendas,
          COALESCE(p.pedidos_abertos, 0) AS pedidos_abertos,
          COALESCE(p.pedidos_conferidos, 0) AS pedidos_conferidos,
          COALESCE(e.estoque, 0) AS estoque,
          (COALESCE(e.estoque, 0) + COALESCE(p.pedidos_abertos, 0) + COALESCE(p.pedidos_conferidos, 0)) AS base_giro
        FROM base b
        LEFT JOIN vendas v
          ON v.periodo_ref = b.periodo_ref
         AND v.empresa = b.empresa
        LEFT JOIN pedidos p
          ON p.periodo_ref = b.periodo_ref
         AND p.empresa = b.empresa
        LEFT JOIN estoque e
          ON e.empresa = b.empresa
        ORDER BY b.periodo_ref DESC, b.empresa
      `
      : `
        WITH vendas AS (
          SELECT
            date_trunc('month', m.data::date)::date AS periodo_ref,
            TO_CHAR(date_trunc('month', m.data::date)::date, 'MM/YYYY') AS periodo_label,
            LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
            SUM(
              CASE
                WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE' THEN ABS(COALESCE(m.quantidade::numeric, 0))
                WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV', 'VC') THEN -ABS(COALESCE(m.quantidade::numeric, 0))
                ELSE 0
              END
            ) AS vendas
          FROM movimento m
          WHERE LEFT(TRIM(m.produto)::text, 6) = $1
            AND m.estoque
            AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE', 'DV', 'VC')
            AND m.data::date >= (CURRENT_DATE - ($2::int - 1))
            ${empSqlMov}
          GROUP BY 1, 2, 3
        ),
        pedidos AS (
          SELECT
            date_trunc('month', CURRENT_DATE)::date AS periodo_ref,
            TO_CHAR(date_trunc('month', CURRENT_DATE)::date, 'MM/YYYY') AS periodo_label,
            LPAD(TRIM(p.empresa::text), 2, '0') AS empresa,
            SUM(CASE WHEN TRIM(COALESCE(p.status::text,'')) = 'A' THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedidos_abertos,
            SUM(CASE WHEN TRIM(COALESCE(p.status::text,'')) = 'C' THEN COALESCE(pd.pquantidade::numeric,0) ELSE 0 END) AS pedidos_conferidos
          FROM pedidos p
          JOIN pedidos_detalhes pd
            ON TRIM(pd.pedido::text) = TRIM(p.codigo::text)
          WHERE LEFT(TRIM(pd.produto)::text, 6) = $1
            AND TRIM(COALESCE(p.status::text,'')) IN ('A', 'C')
            ${empSqlPed}
          GROUP BY 1, 2, 3
        ),
        base AS (
          SELECT DISTINCT periodo_ref, periodo_label, empresa
          FROM (
            SELECT periodo_ref, periodo_label, empresa FROM vendas
            UNION
            SELECT periodo_ref, periodo_label, empresa FROM pedidos
          ) x
        ),
        estoque AS (
          SELECT
            LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
            SUM(${sumMovExpr("m")}) AS estoque
          FROM movimento m
          WHERE LEFT(TRIM(m.produto)::text, 6) = $1
            AND m.estoque
            ${empSqlMov}
          GROUP BY 1
        )
        SELECT
          b.periodo_label AS mes,
          b.periodo_ref,
          b.empresa,
          COALESCE(v.vendas, 0) AS vendas,
          COALESCE(p.pedidos_abertos, 0) AS pedidos_abertos,
          COALESCE(p.pedidos_conferidos, 0) AS pedidos_conferidos,
          COALESCE(e.estoque, 0) AS estoque,
          (COALESCE(e.estoque, 0) + COALESCE(p.pedidos_abertos, 0) + COALESCE(p.pedidos_conferidos, 0)) AS base_giro
        FROM base b
        LEFT JOIN vendas v
          ON v.periodo_ref = b.periodo_ref
         AND v.empresa = b.empresa
        LEFT JOIN pedidos p
          ON p.periodo_ref = b.periodo_ref
         AND p.empresa = b.empresa
        LEFT JOIN estoque e
          ON e.empresa = b.empresa
        ORDER BY b.periodo_ref DESC, b.empresa
      `;

    const [rProduto, rDetalhe] = await Promise.all([
      querySafe(sqlProduto, paramsProduto, 60000),
      querySafe(sqlDetalhe, params, 120000),
    ]);

    const linhas = rDetalhe.rows || [];
    const produto = rProduto.rows?.[0] || {
      codigo,
      descricao: "",
      complemento: "",
      departamento: "",
      grupo: "",
      marca: "",
      fornecedor: "",
      preco: 0,
      custo: 0,
      foto_url: `/foto?codigo=${codigo}`,
    };

    const periodos = [...new Set(linhas.map((x) => String(x.mes || "").trim()).filter(Boolean))];
    const empresas = [...new Set(linhas.map((x) => String(x.empresa || "").trim()).filter(Boolean))];

    const totalVendas = linhas.reduce((a, x) => a + Number(x.vendas || 0), 0);
    const baseGiroTotal = linhas.reduce((a, x) => a + Number(x.base_giro || 0), 0);
    const valorEstimadoTotal = totalVendas * Number(produto.preco || 0);
    const markupMedio =
      Number(produto.custo || 0) > 0
        ? (((Number(produto.preco || 0) - Number(produto.custo || 0)) / Number(produto.custo || 0)) * 100)
        : 0;

    res.json({
      ok: true,
      dias,
      base_calculo: usarBaseDiaria ? "dia" : "mes",
      produto,
      periodos,
      vendas_empresa_mes: linhas.map((x) => ({
        mes: String(x.mes || ""),
        empresa: String(x.empresa || ""),
        vendas: Number(x.vendas || 0),
        pedidos_abertos: Number(x.pedidos_abertos || 0),
        pedidos_conferidos: Number(x.pedidos_conferidos || 0),
        estoque: Number(x.estoque || 0),
        base_giro: Number(x.base_giro || 0),
      })),
      resumo: {
        total_vendas: totalVendas,
        qtd_empresas: empresas.length,
        qtd_periodos: periodos.length,
        base_giro_total: baseGiroTotal,
        valor_estimado_total: valorEstimadoTotal,
        markup_medio: markupMedio,
      },
    });
  } catch (e) {
    console.error("Erro /api/giro/detalhe:", e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});
app.get("/api/giro/resumo-agrupado", async (req, res) => {
  try {
    const {
      tipo = "departamento",
      dias = "30",
      busca = "",
      empresas = "",
      complemento = "",
      fornecedor = "",
      grupo = "",
      marca = "",
      departamento = ""
    } = req.query;

    const diasNum = Math.max(1, Number(dias || 30));
    const dataIni = new Date();
    dataIni.setDate(dataIni.getDate() - diasNum);

    let campo = "d.descricao";
    let codigoCampo = "p.departamento";

    if (tipo === "grupo") {
      campo = "g.descricao";
      codigoCampo = "p.grupo";
    } else if (tipo === "subgrupo") {
      campo = "l.descricao";
      codigoCampo = "p.linha";
    } else if (tipo === "marca") {
      campo = "mk.descricao";
      codigoCampo = "p.marca";
    } else if (tipo === "fornecedor") {
      campo = "pe.nome";
      codigoCampo = "p.fornecedor";
    }

    const empList = await resolveEmpresasFiltro(empresas);
    const depCodigos = await resolveDepartamentoCodigos(departamento);
    const grpCodigos = await resolveGrupoCodigos(grupo);
    const marcaCodigos = await resolveMarcaCodigos(marca);
    const fornCodigos = await resolveFornecedorCodigos(fornecedor);

    const params = [dataIni.toISOString().slice(0,10)];
    let where = `WHERE COALESCE(p.desativar,false) = false`;

    if (busca) {
      params.push(`%${busca}%`);
      where += ` AND (p.codigo ILIKE $${params.length} OR p.descricao ILIKE $${params.length})`;
    }

    if (complemento) {
      params.push(`%${complemento}%`);
      where += ` AND COALESCE(p.complemento,'') ILIKE $${params.length}`;
    }

    function addInFiltro(col, arr){
      if(!arr.length) return "";
      const start = params.length + 1;
      arr.forEach(x => params.push(x));
      return ` AND TRIM(${col}) IN (${arr.map((_,i)=>`$${start+i}`).join(",")})`;
    }

    where += addInFiltro("p.departamento", depCodigos);
    where += addInFiltro("p.grupo", grpCodigos);
    where += addInFiltro("p.marca", marcaCodigos);
    where += addInFiltro("p.fornecedor", fornCodigos);

    let filtroEmpresaMov = "";
    if(empList.length){
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      filtroEmpresaMov = ` AND LPAD(TRIM(m.empresa::text),2,'0') IN (${empList.map((_,i)=>`$${start+i}`).join(",")})`;
    }

    const sql = `
      WITH base AS (
        SELECT
          p.codigo,
          TRIM(COALESCE(NULLIF(${campo}::text,''), 'SEM CADASTRO')) AS descricao,
          TRIM(COALESCE(${codigoCampo}::text,'')) AS codigo_grupo
        FROM produtos p
        LEFT JOIN departamentos d ON TRIM(d.codigo) = TRIM(p.departamento)
        LEFT JOIN grupos g ON TRIM(g.codigo) = TRIM(p.grupo)
        LEFT JOIN linhas l ON TRIM(l.codigo) = TRIM(p.linha)
        LEFT JOIN marcas mk ON TRIM(mk.codigo) = TRIM(p.marca)
        LEFT JOIN pessoas pe ON TRIM(pe.codigo::text) = TRIM(p.fornecedor::text)
        ${where}
      ),
      movs AS (
        SELECT
          LEFT(LPAD(TRIM(m.produto::text),8,'0'),6) AS produto,
          SUM(CASE WHEN m.movimento = 'E' AND m.data::date >= $1::date THEN COALESCE(m.quantidade::numeric,0) ELSE 0 END) AS comprado_periodo,
          SUM(CASE WHEN m.movimento = 'S' AND m.data::date >= $1::date THEN COALESCE(m.quantidade::numeric,0) ELSE 0 END) AS vendido_periodo,
          SUM(CASE
                WHEN m.movimento = 'E' THEN COALESCE(m.quantidade::numeric,0)
                WHEN m.movimento = 'S' THEN -COALESCE(m.quantidade::numeric,0)
                ELSE 0
              END) AS estoque_atual
        FROM movimento m
        WHERE 1=1
          ${filtroEmpresaMov}
        GROUP BY LEFT(LPAD(TRIM(m.produto::text),8,'0'),6)
      )
      SELECT
        b.descricao,
        COALESCE(SUM(m.comprado_periodo),0) AS comprado_periodo,
        COALESCE(SUM(m.vendido_periodo),0) AS vendido_periodo,
        COALESCE(SUM(m.estoque_atual),0) AS estoque_atual,
        COALESCE(SUM(m.comprado_periodo),0) - COALESCE(SUM(m.vendido_periodo),0) AS saldo
      FROM base b
      LEFT JOIN movs m ON TRIM(m.produto) = TRIM(b.codigo)
      GROUP BY b.descricao
      ORDER BY estoque_atual DESC, vendido_periodo DESC
    `;

    const r = await querySafe(sql, params, 120000);

    res.json({
      ok: true,
      tipo,
      data
    : r.rows || []
    });

  } catch (e) {
    console.error("Erro /api/giro/resumo-agrupado:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// FLUXO DE CAIXA PROFISSIONAL
// ======================================================
app.get("/api/financeiro/fluxo-caixa", async (req, res) => {
  try {
    const {
      dataIni,
      dataFim,
      empresa = "",
      tipo = "todos",
      rpSaida = "PS"
    } = req.query;

    if (!dataIni || !dataFim) {
      return res.status(400).json({ erro: "Informe período" });
    }

    const empList = await resolveEmpresasFiltro(empresa);

    const paramsBase = [dataIni, dataFim];
    let empSql = "";

    if (empList.length) {
      const start = paramsBase.length + 1;
      empList.forEach(e => paramsBase.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph}) `;
    }

    // ================================
    // FILTRO DE TIPO (RECEBER)
    // ================================
    let tipoSql = "";
    if (String(tipo || "").trim() !== "" && String(tipo || "").trim() !== "todos") {
      paramsBase.push(String(tipo).trim());
      tipoSql = ` AND TRIM(COALESCE(ft.tipo::text,'')) = $${paramsBase.length} `;
    }

    // ================================
    // FILTRO RP SAÍDA (PAGAR)
    // ================================
    let rpSaidaSql = ` AND TRIM(COALESCE(ft.rp::text,'')) IN ('P','S') `;
    const rpSaidaUp = String(rpSaida || "PS").trim().toUpperCase();

    if (rpSaidaUp === "P") {
      rpSaidaSql = ` AND TRIM(COALESCE(ft.rp::text,'')) = 'P' `;
    } else if (rpSaidaUp === "S") {
      rpSaidaSql = ` AND TRIM(COALESCE(ft.rp::text,'')) = 'S' `;
    }

    // ================================
    // EXPRESSÃO FORMA RECEBER
    // ================================
    const formaReceberExpr = `
      CASE
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '0' THEN 'PIX'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '1' THEN 'A VISTA'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '2' THEN 'CARTAO'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '3' THEN 'CHEQUE PRE'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '4' THEN 'CREDIARIO'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '5' THEN 'BOLETOS'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '6' THEN 'DEPOSITO'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '7' THEN 'DEBITO CONTA'
        ELSE 'OUTROS'
      END
    `;
    // ================================
    // RECEBER EM ABERTO
    // ================================
    const sqlReceber = `
      SELECT
        ft.vencimento::date AS data,
        SUM(COALESCE(ft.valor,0)) AS valor
      FROM financeiro_titulos ft
      WHERE TRIM(COALESCE(ft.rp::text,'')) = 'R'
        AND TRIM(COALESCE(ft.status::text,'')) = 'A'
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
        ${tipoSql}
      GROUP BY ft.vencimento::date
    `;

    // ================================
    // PAGAR EM ABERTO
    // ================================
    const sqlPagar = `
      SELECT
        ft.vencimento::date AS data,
        SUM(COALESCE(ft.valor,0)) AS valor
      FROM financeiro_titulos ft
      WHERE TRIM(COALESCE(ft.status::text,'')) = 'A'
        ${rpSaidaSql}
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
      GROUP BY ft.vencimento::date
    `;

    // ================================
    // VENDAS ANO PASSADO (MESMO PERÍODO DO FILTRO)
    // À VISTA / A PRAZO / TOTAL
    // ================================
    const sqlPrev = `
  SELECT
    v.data::date AS data,

    SUM(
      COALESCE(m.total,0) *
      (COALESCE(v.avista,0) / NULLIF(COALESCE(v.subtotal,0),0))
    ) AS valor_avista,

    SUM(
      COALESCE(m.total,0) *
      (COALESCE(v.aprazo,0) / NULLIF(COALESCE(v.subtotal,0),0))
    ) AS valor_aprazo,

    SUM(
      COALESCE(m.total,0) *
      (COALESCE(v.total,0) / NULLIF(COALESCE(v.subtotal,0),0))
    ) AS valor

  FROM vendas v
  INNER JOIN movimento m
    ON ('VE' || v.codigo)::char(10) = m.auxiliar

  WHERE
    v.data::date BETWEEN ($1::date - INTERVAL '1 year') AND ($2::date - INTERVAL '1 year')
    AND m.estoque = true
    AND (
      CASE
        WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
          THEN TRIM(COALESCE(v.status::text,'')) = 'P'
        ELSE TRIM(COALESCE(v.status::text,'')) IN ('S','O')
      END
    )
    AND (
      CASE
        WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
          THEN TRIM(COALESCE(m.operacao::text,'')) = 'VC'
        ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV')
      END
    )
    ${empList.length ? ` AND LPAD(TRIM(v.empresa::text), 2, '0') IN (${empList.map((_, i) => `$${3 + i}`).join(",")}) ` : ""}

  GROUP BY v.data::date
  ORDER BY v.data::date
`;
    // ================================
    // TÍTULOS A RECEBER (DETALHE)
    // ================================
    const sqlTitulosReceber = `
      SELECT
        ft.vencimento::date AS data,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, '-') AS documento,
        COALESCE(ft.descricao::text, '-') AS descricao,
        COALESCE(p.nome::text, p.apelido::text, ft.pessoa::text, '-') AS pessoa,
        COALESCE(ft.instrucoes::text, '-') AS instrucoes,
        COALESCE(ft.complemento::text, '-') AS complemento,
        ${formaReceberExpr} AS forma_receber,
        COALESCE(ft.valor::numeric,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      WHERE TRIM(COALESCE(ft.rp::text,'')) = 'R'
        AND TRIM(COALESCE(ft.status::text,'')) = 'A'
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
        ${tipoSql}
      ORDER BY ft.vencimento::date, empresa, documento
    `;

    // ================================
    // TÍTULOS A PAGAR (DETALHE)
    // ================================
    const sqlTitulosPagar = `
      SELECT
        ft.vencimento::date AS data,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, '-') AS documento,
        COALESCE(ft.descricao::text, '-') AS descricao,
        COALESCE(p.nome::text, p.apelido::text, ft.pessoa::text, '-') AS pessoa,
        COALESCE(ft.instrucoes::text, '-') AS instrucoes,
        COALESCE(ft.complemento::text, '-') AS complemento,
        COALESCE(
          NULLIF(TRIM(fi.descricao::text), ''),
          NULLIF(TRIM(ft.descricao::text), ''),
          'SEM PLANO'
        ) AS plano_conta,
        COALESCE(ft.valor::numeric,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      LEFT JOIN financeiro_itens fi
        ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
      WHERE TRIM(COALESCE(ft.status::text,'')) = 'A'
        ${rpSaidaSql}
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
      ORDER BY ft.vencimento::date, empresa, documento
    `;

    // ================================
    // RESUMO RECEBER POR FORMA DE PAGAMENTO
    // ================================
    const sqlResumoReceberForma = `
      SELECT
        ${formaReceberExpr} AS forma,
        COUNT(*) AS qtd_titulos,
        COALESCE(SUM(COALESCE(ft.valor,0)),0) AS total
      FROM financeiro_titulos ft
      WHERE TRIM(COALESCE(ft.rp::text,'')) = 'R'
        AND TRIM(COALESCE(ft.status::text,'')) = 'A'
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
        ${tipoSql}
      GROUP BY ${formaReceberExpr}
      ORDER BY total DESC, forma
    `;

    // ================================
    // RESUMO PAGAR POR PLANO DE CONTA
    // ================================
    const sqlResumoPagarPlano = `
      SELECT
        COALESCE(
          NULLIF(TRIM(fi.descricao::text), ''),
          NULLIF(TRIM(ft.descricao::text), ''),
          'SEM PLANO'
        ) AS plano_conta,
        COALESCE(TRIM(ft.item::text), '') AS item,
        COUNT(*) AS qtd_titulos,
        COALESCE(SUM(COALESCE(ft.valor,0)),0) AS total
      FROM financeiro_titulos ft
      LEFT JOIN financeiro_itens fi
        ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
      WHERE TRIM(COALESCE(ft.status::text,'')) = 'A'
        ${rpSaidaSql}
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
      GROUP BY
        COALESCE(
          NULLIF(TRIM(fi.descricao::text), ''),
          NULLIF(TRIM(ft.descricao::text), ''),
          'SEM PLANO'
        ),
        COALESCE(TRIM(ft.item::text), '')
      ORDER BY total DESC, plano_conta
    `;

const [
  receber,
  pagar,
  previsto,
  resumoRecForma,
  resumoPagPlano
] = await Promise.all([
      querySafe(sqlReceber, paramsBase),
      querySafe(sqlPagar, paramsBase),
      querySafe(sqlPrev, [dataIni, dataFim, ...empList]),
      querySafe(sqlResumoReceberForma, paramsBase),
      querySafe(sqlResumoPagarPlano, paramsBase)
    ]);

    // ================================
    // ORGANIZA DADOS
    // ================================
    const mapa = {};

    function add(tipoMapa, rows, campo = "valor") {
      (rows || []).forEach(r => {
        if (!r.data) return;
        const d = new Date(r.data).toISOString().slice(0, 10);
        if (!mapa[d]) {
          mapa[d] = {
            receber: 0,
            pagar: 0,
            previsto: 0,
            previsto_avista: 0,
            previsto_aprazo: 0
          };
        }
        mapa[d][tipoMapa] += Number(r[campo] || 0);
      });
    }

      add("receber", receber.rows || []);
    add("pagar", pagar.rows || []);
    add("previsto", previsto.rows || [], "valor");
    add("previsto_avista", previsto.rows || [], "valor_avista");
    add("previsto_aprazo", previsto.rows || [], "valor_aprazo");

    let saldoAcumulado = 0;

    const diario = Object.keys(mapa).sort().map(d => {
      const r = mapa[d];
      const saldoDia = (Number(r.receber || 0) + Number(r.previsto || 0)) - Number(r.pagar || 0);
      saldoAcumulado += saldoDia;

      return {
        data: d,
        data_fmt: new Date(d + "T00:00:00").toLocaleDateString("pt-BR"),
        receber_aberto: Number(r.receber || 0),
        previsto_avista_ano_passado: Number(r.previsto_avista || 0),
        previsto_aprazo_ano_passado: Number(r.previsto_aprazo || 0),
        previsto_total_ano_passado: Number(r.previsto || 0),
        pagar_aberto: Number(r.pagar || 0),
        saldo_previsto: saldoDia,
        saldo_acumulado: saldoAcumulado
      };
    });

    const mapaMes = {};

    diario.forEach(d => {
      const mes = d.data.slice(0, 7);

      if (!mapaMes[mes]) {
               mapaMes[mes] = {
          periodo: mes,
          receber_aberto: 0,
          previsto_avista_ano_passado: 0,
          previsto_aprazo_ano_passado: 0,
          previsto_total_ano_passado: 0,
          entrada_total_prevista: 0,
          pagar_aberto: 0,
          saldo_previsto: 0,
          saldo_acumulado: 0
        };
      }

      mapaMes[mes].receber_aberto += Number(d.receber_aberto || 0);
      mapaMes[mes].previsto_avista_ano_passado += Number(d.previsto_avista_ano_passado || 0);
      mapaMes[mes].previsto_aprazo_ano_passado += Number(d.previsto_aprazo_ano_passado || 0);
      mapaMes[mes].previsto_total_ano_passado += Number(d.previsto_total_ano_passado || 0);
      mapaMes[mes].entrada_total_prevista += Number(d.receber_aberto || 0) + Number(d.previsto_total_ano_passado || 0);
      mapaMes[mes].pagar_aberto += Number(d.pagar_aberto || 0);
      mapaMes[mes].saldo_previsto += Number(d.saldo_previsto || 0);
    });

    let saldoMesAcum = 0;

    const mensal = Object.keys(mapaMes).sort().map(m => {
      const r = mapaMes[m];
      saldoMesAcum += Number(r.saldo_previsto || 0);

      return {
        periodo: m,
        receber_aberto: Number(r.receber_aberto || 0),
        previsto_avista_ano_passado: Number(r.previsto_avista_ano_passado || 0),
        previsto_aprazo_ano_passado: Number(r.previsto_aprazo_ano_passado || 0),
        previsto_total_ano_passado: Number(r.previsto_total_ano_passado || 0),
        entrada_total_prevista: Number(r.entrada_total_prevista || 0),
        pagar_aberto: Number(r.pagar_aberto || 0),
        saldo_previsto: Number(r.saldo_previsto || 0),
        saldo_acumulado: saldoMesAcum
      };
    });

       const totalReceber = (receber.rows || []).reduce((a, x) => a + Number(x.valor || 0), 0);
    const totalPagar = (pagar.rows || []).reduce((a, x) => a + Number(x.valor || 0), 0);
    const totalPrev = (previsto.rows || []).reduce((a, x) => a + Number(x.valor || 0), 0);
const totalPrevAvista = (previsto.rows || []).reduce((a, x) => a + Number(x.valor_avista || 0), 0);
const totalPrevAprazo = (previsto.rows || []).reduce((a, x) => a + Number(x.valor_aprazo || 0), 0);

const resumo = {
  receber_aberto: totalReceber,
  pagar_aberto: totalPagar,
  previsto_avista_ano_passado: totalPrevAvista,
  previsto_aprazo_ano_passado: totalPrevAprazo,
  previsto_total_ano_passado: totalPrev,
  saldo_projetado: totalReceber + totalPrev - totalPagar,
  receber_vencido: 0,
  pagar_vencido: 0
};

    res.json({
      resumo,
      diario,
      mensal,
      titulosReceber: [],
      titulosPagar: [],
      resumoReceberForma: (resumoRecForma.rows || []).map(x => ({
        forma: x.forma || "OUTROS",
        qtdTitulos: Number(x.qtd_titulos || 0),
        total: Number(x.total || 0)
      })),
      resumoPagarPlano: (resumoPagPlano.rows || []).map(x => ({
        planoConta: x.plano_conta || "SEM PLANO",
        item: x.item || "",
        qtdTitulos: Number(x.qtd_titulos || 0),
        total: Number(x.total || 0)
      })),
      maiorRisco: null
    });

  } catch (err) {
    console.error("Erro fluxo caixa:", err);
    res.status(500).json({ erro: err.message });
  }
});
// ======================================================
// FLUXO DE CAIXA - DETALHE A RECEBER
// ======================================================
app.get("/api/financeiro/fluxo-caixa/detalhe-receber", async (req, res) => {
  try {
    const {
      dataIni,
      dataFim,
      empresa = "",
      tipo = "todos",
      forma = ""
    } = req.query;

    if (!dataIni || !dataFim) {
      return res.status(400).json({ erro: "Informe período" });
    }

    const empList = await resolveEmpresasFiltro(empresa);

    const params = [dataIni, dataFim];
    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph}) `;
    }

    let tipoSql = "";
    if (String(tipo || "").trim() !== "" && String(tipo || "").trim() !== "todos") {
      params.push(String(tipo).trim());
      tipoSql = ` AND TRIM(COALESCE(ft.tipo::text,'')) = $${params.length} `;
    }

    const formaReceberExpr = `
      CASE
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '0' THEN 'PIX'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '1' THEN 'A VISTA'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '2' THEN 'CARTAO'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '3' THEN 'CHEQUE PRE'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '4' THEN 'CREDIARIO'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '5' THEN 'BOLETOS'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '6' THEN 'DEPOSITO'
        WHEN TRIM(COALESCE(ft.tipo::text,'')) = '7' THEN 'DEBITO CONTA'
        ELSE 'OUTROS'
      END
    `;

    let formaSql = "";
    if (String(forma || "").trim()) {
      params.push(String(forma).trim().toUpperCase());
      formaSql = ` AND UPPER(${formaReceberExpr}) = $${params.length} `;
    }

    const sql = `
      SELECT
        ft.vencimento::date AS data,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, '-') AS documento,
        COALESCE(ft.descricao::text, '-') AS descricao,
        COALESCE(p.nome::text, p.apelido::text, ft.pessoa::text, '-') AS pessoa,
        COALESCE(ft.instrucoes::text, '-') AS instrucoes,
        ${formaReceberExpr} AS forma_receber,
        COALESCE(ft.valor::numeric,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      WHERE TRIM(COALESCE(ft.rp::text,'')) = 'R'
        AND TRIM(COALESCE(ft.status::text,'')) = 'A'
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
        ${tipoSql}
        ${formaSql}
      ORDER BY ft.vencimento::date, empresa, documento
    `;

    const r = await querySafe(sql, params, 120000);

res.json({
  titulos: (r.rows || []).map(x => ({
    ...x,
    formaReceber: x.forma_receber || "OUTROS"
  }))
});
  } catch (err) {
    console.error("Erro detalhe receber fluxo:", err);
    res.status(500).json({ erro: err.message });
  }
});
// ======================================================
// FLUXO DE CAIXA - DETALHE A PAGAR
// ======================================================
app.get("/api/financeiro/fluxo-caixa/detalhe-pagar", async (req, res) => {
  try {
    const {
      dataIni,
      dataFim,
      empresa = "",
      rpSaida = "PS",
      plano = ""
    } = req.query;

    if (!dataIni || !dataFim) {
      return res.status(400).json({ erro: "Informe período" });
    }

    const empList = await resolveEmpresasFiltro(empresa);

    const params = [dataIni, dataFim];
    let empSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph}) `;
    }

    let rpSaidaSql = ` AND TRIM(COALESCE(ft.rp::text,'')) IN ('P','S') `;
    const rpSaidaUp = String(rpSaida || "PS").trim().toUpperCase();

    if (rpSaidaUp === "P") {
      rpSaidaSql = ` AND TRIM(COALESCE(ft.rp::text,'')) = 'P' `;
    } else if (rpSaidaUp === "S") {
      rpSaidaSql = ` AND TRIM(COALESCE(ft.rp::text,'')) = 'S' `;
    }

    let planoSql = "";
    if (String(plano || "").trim()) {
      params.push(String(plano).trim().toUpperCase());
      planoSql = `
        AND UPPER(
          COALESCE(
            NULLIF(TRIM(fi.descricao::text), ''),
            NULLIF(TRIM(ft.descricao::text), ''),
            'SEM PLANO'
          )
        ) = $${params.length}
      `;
    }

    const sql = `
      SELECT
        ft.vencimento::date AS data,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, '-') AS documento,
        COALESCE(ft.descricao::text, '-') AS descricao,
        COALESCE(p.nome::text, p.apelido::text, ft.pessoa::text, '-') AS pessoa,
        COALESCE(ft.instrucoes::text, '-') AS instrucoes,
        COALESCE(
          NULLIF(TRIM(fi.descricao::text), ''),
          NULLIF(TRIM(ft.descricao::text), ''),
          'SEM PLANO'
        ) AS plano_conta,
        COALESCE(ft.valor::numeric,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      LEFT JOIN financeiro_itens fi
        ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
      WHERE TRIM(COALESCE(ft.status::text,'')) = 'A'
        ${rpSaidaSql}
        AND ft.vencimento::date BETWEEN $1 AND $2
        ${empSql}
        ${planoSql}
      ORDER BY ft.vencimento::date, empresa, documento
    `;

    const r = await querySafe(sql, params, 120000);

res.json({
  titulos: (r.rows || []).map(x => ({
    ...x,
    planoConta: x.plano_conta || "SEM PLANO"
  }))
});
  } catch (err) {
    console.error("Erro detalhe pagar fluxo:", err);
    res.status(500).json({ erro: err.message });
  }
});
app.get("/api/financeiro/fluxo-calendario-pagar", async (req, res) => {
  try {

    const {
      empresa = "",
      fornecedor = "",
      plano = "",
      dataIni = "",
      dataFim = ""
    } = req.query;
    if (!dataIni || !dataFim) {
      return res.status(400).json({
        ok:false,
        erro:"Informe data inicial e data final."
      });
    }

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const params = [dataIni, dataFim];

let filtroFornecedor = "";
let filtroPlano = "";
if (fornecedor.trim()) {
  params.push(`%${fornecedor.trim().toUpperCase()}%`);

  filtroFornecedor = `
    AND UPPER(
      COALESCE(
        NULLIF(TRIM(p.apelido::text), ''),
        NULLIF(TRIM(p.nome::text), ''),
        NULLIF(TRIM(ft.pessoa::text), ''),
        ''
      )
    ) LIKE $${params.length}
  `;
}

if (plano.trim()) {
  params.push(`%${plano.trim().toUpperCase()}%`);

  filtroPlano = `
    AND UPPER(
      COALESCE(
        NULLIF(TRIM(fi.descricao::text), ''),
        NULLIF(TRIM(ft.descricao::text), ''),
        NULLIF(TRIM(ft.item::text), ''),
        ''
      )
    ) LIKE $${params.length}
  `;
}
    let empSql = "";
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = `
        AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})
      `;
    }

    const sql = `
      SELECT
        TO_CHAR(ft.vencimento::date, 'YYYY-MM-DD') AS data,
        COUNT(*) AS qtd_titulos,
        COALESCE(SUM(COALESCE(ft.valor::numeric,0)),0) AS total
      FROM financeiro_titulos ft
LEFT JOIN pessoas p
  ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
LEFT JOIN financeiro_itens fi
  ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
WHERE TRIM(COALESCE(ft.status::text,'')) = 'A'
        AND UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'
        AND ft.vencimento::date BETWEEN $1::date AND $2::date
        AND COALESCE(ft.valor::numeric,0) > 0
${filtroFornecedor}
${filtroPlano}
        ${empSql}
      GROUP BY ft.vencimento::date
      ORDER BY ft.vencimento::date
    `;

    const r = await querySafe(sql, params, 30000);

    res.json({
      ok:true,
      dias:(r.rows || []).map(x => ({
        data: x.data,
        qtdTitulos:Number(x.qtd_titulos || 0),
        total:Number(x.total || 0)
      }))
    });

  } catch (err) {
    console.error("Erro /api/financeiro/fluxo-calendario-pagar:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});
app.get("/api/financeiro/calendario-pagar-dashboard", async (req, res) => {
  try {
    const {
      empresa = "todas",
      dataIni = "",
      dataFim = "",
      fornecedor = "",
      plano = ""
    } = req.query;

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const params = [];
    const where = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'`,
      `TRIM(COALESCE(ft.status::text,'')) = 'A'`,
      `ft.vencimento IS NOT NULL`,
      `COALESCE(ft.valor,0) > 0`
    ];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${empList.map((_, i) => `$${start + i}`).join(",")})`);
    }

    if (dataIni) {
      params.push(dataIni);
      where.push(`ft.vencimento::date >= $${params.length}`);
    }

    if (dataFim) {
      params.push(dataFim);
      where.push(`ft.vencimento::date <= $${params.length}`);
    }

    if (fornecedor) {
      params.push(`%${String(fornecedor).trim().toUpperCase()}%`);
      where.push(`UPPER(COALESCE(p.apelido::text, p.nome::text, ft.pessoa::text, '')) LIKE $${params.length}`);
    }

    if (plano) {
      params.push(`%${String(plano).trim().toUpperCase()}%`);
      where.push(`UPPER(COALESCE(fi.descricao::text, ft.item::text, '')) LIKE $${params.length}`);
    }

    const sql = `
      SELECT
        ft.vencimento::date AS data,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, '-') AS documento,
        COALESCE(NULLIF(TRIM(p.apelido::text),''), NULLIF(TRIM(p.nome::text),''), TRIM(COALESCE(ft.pessoa::text,'-'))) AS fornecedor,
        COALESCE(NULLIF(TRIM(fi.descricao::text),''), TRIM(COALESCE(ft.item::text,'-'))) AS plano,
        COALESCE(ft.valor,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      LEFT JOIN financeiro_itens fi
        ON LPAD(TRIM(COALESCE(fi.codigo::text,'')),3,'0') =
           LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0')
      WHERE ${where.join(" AND ")}
      ORDER BY ft.vencimento::date, fornecedor, valor DESC
      LIMIT 5000
    `;

    const r = await querySafe(sql, params, 90000);

    const titulos = (r.rows || []).map(x => ({
      data: String(x.data).slice(0,10),
      empresa: x.empresa,
      documento: x.documento,
      fornecedor: x.fornecedor,
      plano: x.plano,
      valor: Number(x.valor || 0)
    }));

    const mapaDias = {};

    titulos.forEach(x => {
      mapaDias[x.data] ||= { data:x.data, qtdTitulos:0, total:0 };
      mapaDias[x.data].qtdTitulos += 1;
      mapaDias[x.data].total += x.valor;
    });

    res.json({
      ok:true,
      dias:Object.values(mapaDias).sort((a,b) => a.data.localeCompare(b.data)),
      titulos
    });

  } catch (err) {
    console.error("Erro /api/financeiro/calendario-pagar-dashboard:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.post("/api/financeiro/fluxo-calendario-pagar-detalhe", async (req, res) => {
  try {
    const {
  empresa = "todas",
  datas = [],
  fornecedor = "",
  plano = ""
} = req.body || {};
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    if (!Array.isArray(datas) || !datas.length) {
      return res.status(400).json({ ok:false, erro:"Informe ao menos uma data." });
    }

    const params = [];
    const where = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'`,
      `TRIM(COALESCE(ft.status::text,'')) = 'A'`,
      `ft.vencimento IS NOT NULL`,
      `COALESCE(ft.valor,0) > 0`
    ];

    const startDatas = params.length + 1;
    datas.forEach(d => params.push(d));
    where.push(`ft.vencimento::date IN (${datas.map((_, i) => `$${startDatas + i}`).join(",")})`);

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }
if (fornecedor) {
  params.push(`%${String(fornecedor).trim().toUpperCase()}%`);
  where.push(`
    UPPER(COALESCE(p.apelido::text, p.nome::text, ft.pessoa::text, '')) LIKE $${params.length}
  `);
}

if (plano) {
  params.push(`%${String(plano).trim().toUpperCase()}%`);
  where.push(`
    UPPER(COALESCE(fi.descricao::text, ft.item::text, '')) LIKE $${params.length}
  `);
}
    const sql = `
      SELECT
        ft.vencimento::date AS data,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, '-') AS documento,
        COALESCE(NULLIF(TRIM(p.apelido::text),''), NULLIF(TRIM(p.nome::text),''), TRIM(COALESCE(ft.pessoa::text,'-'))) AS fornecedor,
        COALESCE(NULLIF(TRIM(fi.descricao::text),''), TRIM(COALESCE(ft.item::text,'-'))) AS plano,
        COALESCE(ft.valor,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      LEFT JOIN financeiro_itens fi
        ON LPAD(TRIM(COALESCE(fi.codigo::text,'')),3,'0') =
           LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0')
      WHERE ${where.join(" AND ")}
      ORDER BY ft.vencimento::date, fornecedor, valor DESC
      LIMIT 5000
    `;

    const r = await querySafe(sql, params, 120000);
    const titulos = (r.rows || []).map(x => ({
      data: x.data,
      empresa: x.empresa,
      documento: x.documento,
      fornecedor: x.fornecedor,
      plano: x.plano,
      valor: Number(x.valor || 0)
    }));

    const porFornecedor = Object.values(titulos.reduce((acc, x) => {
      const k = x.fornecedor || "-";
      acc[k] ||= { nome:k, valor:0, qtd:0 };
      acc[k].valor += x.valor;
      acc[k].qtd += 1;
      return acc;
    }, {})).sort((a,b) => b.valor - a.valor);

    const porPlano = Object.values(titulos.reduce((acc, x) => {
      const k = x.plano || "-";
      acc[k] ||= { nome:k, valor:0, qtd:0 };
      acc[k].valor += x.valor;
      acc[k].qtd += 1;
      return acc;
    }, {})).sort((a,b) => b.valor - a.valor);

    res.json({ ok:true, porFornecedor, porPlano, titulos });

  } catch (err) {
    console.error("Erro /api/financeiro/fluxo-calendario-pagar-detalhe:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});
app.get("/api/financeiro/faturamento-x-pagamento-detalhe", async (req, res) => {
  try {
    const {
      empresa = "todas",
      dataIni = "",
      dataFim = "",
      tipo = "todos",
      rpSaida = "PS",
      lado = "",
      grupo = "",
      origem = "",
      visaoDireita = "plano_conta",
      chave = "",
    } = req.query;

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const rpFiltro = String(rpSaida || "PS").trim().toUpperCase();
    let rpPermitidos = ["P", "S"];
    if (rpFiltro === "P") rpPermitidos = ["P"];
    else if (rpFiltro === "S") rpPermitidos = ["S"];

    const visaoRaw = String(visaoDireita || "plano_conta").trim().toLowerCase();
    const visao = visaoRaw === "fornecedor" ? "fornecedor" : "plano_conta";

    // =====================================================
    // DETALHE DA ESQUERDA: PRAZO / AVISTA
    // =====================================================
    if (String(lado).toLowerCase() === "esquerda") {
      const grupoSel = String(grupo || "").trim().toUpperCase();
      const isPrazo = grupoSel === "PRAZO";
      const isAvista = grupoSel === "AVISTA";

      if (!isPrazo && !isAvista) {
        return res.status(400).json({ erro: "Grupo inválido para detalhe da esquerda." });
      }

      const params = [];
      const where = [
        `COALESCE(v.subtotal, 0) <> 0`,
        `UPPER(COALESCE(c.descricao, '')) NOT LIKE '%BOLETO MOIP%'`,
        `(
          CASE
            WHEN TRIM(COALESCE(v.tipo::text,'')) = '03' THEN TRIM(COALESCE(v.status::text,'')) = 'P'
            ELSE TRIM(COALESCE(v.status::text,'')) = 'S'
          END
        )`
      ];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        where.push(`LPAD(TRIM(COALESCE(v.empresa::text,'')),2,'0') IN (${ph})`);
      }

      if (dataIni) {
        params.push(dataIni);
        where.push(`v.data::date >= $${params.length}`);
      }

      if (dataFim) {
        params.push(dataFim);
        where.push(`v.data::date <= $${params.length}`);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const formaExpr = `
        CASE
          WHEN UPPER(COALESCE(c.descricao, '')) LIKE '%PIX%' THEN 'PIX'
          WHEN UPPER(COALESCE(c.descricao, '')) LIKE '%DEBITO%' THEN 'DEBITO'
          WHEN UPPER(COALESCE(c.descricao, '')) LIKE '%DÉBITO%' THEN 'DEBITO'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '0' THEN 'PIX'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '6' THEN 'DEPOSITO'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '1'
               AND UPPER(COALESCE(c.descricao, '')) LIKE '%CARTAO%' THEN 'DEBITO'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '1' THEN 'DINHEIRO'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '2' THEN 'CARTAO'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '3' THEN 'CHEQUE'
          WHEN TRIM(COALESCE(c.tipo::text, '')) = '4' THEN 'CREDIARIO'
          ELSE 'OUTROS'
        END
      `;

      const valorExpr = isAvista
        ? `
          CASE
            WHEN UPPER(COALESCE(c.descricao, '')) LIKE '%PIX%' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            WHEN UPPER(COALESCE(c.descricao, '')) LIKE '%DEBITO%' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            WHEN UPPER(COALESCE(c.descricao, '')) LIKE '%DÉBITO%' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            WHEN TRIM(COALESCE(c.tipo::text, '')) = '0' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            WHEN TRIM(COALESCE(c.tipo::text, '')) = '6' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            WHEN TRIM(COALESCE(c.tipo::text, '')) = '1'
                 AND UPPER(COALESCE(c.descricao, '')) LIKE '%CARTAO%' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            WHEN TRIM(COALESCE(c.tipo::text, '')) = '1' THEN COALESCE(m.total,0) * (COALESCE(v.avista,0) / NULLIF(v.subtotal,0))
            ELSE 0
          END
        `
        : `
          CASE
            WHEN TRIM(COALESCE(c.tipo::text, '')) IN ('2','3','4')
              THEN COALESCE(m.total,0) * (COALESCE(v.aprazo,0) / NULLIF(v.subtotal,0))
            ELSE 0
          END
        `;

      const filtroGrupo = isAvista
        ? `AND ${formaExpr} IN ('PIX','DINHEIRO','DEBITO','DEPOSITO')`
        : `AND ${formaExpr} IN ('CARTAO','CHEQUE','CREDIARIO')`;

      const sqlResumoFormas = `
        SELECT
          ${formaExpr} AS forma,
          SUM(${valorExpr}) AS total
        FROM movimento m
        INNER JOIN vendas v
          ON m.auxiliar = ('VE' || v.codigo)::char(10)
        INNER JOIN condicoes c
          ON TRIM(COALESCE(v.condicoes::text,'')) = TRIM(COALESCE(c.codigo::text,''))
        ${whereSql}
          AND (
            CASE
              WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
                THEN TRIM(COALESCE(m.operacao::text,'')) = 'VC'
              ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV')
            END
          )
          AND COALESCE(m.estoque, false) = true
          ${filtroGrupo}
        GROUP BY 1
        HAVING SUM(${valorExpr}) <> 0
        ORDER BY 2 DESC, 1
      `;

      const sqlCondicoes = `
        SELECT
          COALESCE(NULLIF(TRIM(c.descricao::text), ''), 'SEM CONDIÇÃO') AS condicao,
          ${formaExpr} AS forma,
          SUM(${valorExpr}) AS total
        FROM movimento m
        INNER JOIN vendas v
          ON m.auxiliar = ('VE' || v.codigo)::char(10)
        INNER JOIN condicoes c
          ON TRIM(COALESCE(v.condicoes::text,'')) = TRIM(COALESCE(c.codigo::text,''))
        ${whereSql}
          AND (
            CASE
              WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
                THEN TRIM(COALESCE(m.operacao::text,'')) = 'VC'
              ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV')
            END
          )
          AND COALESCE(m.estoque, false) = true
          ${filtroGrupo}
        GROUP BY 1,2
        HAVING SUM(${valorExpr}) <> 0
        ORDER BY 3 DESC, 1
        LIMIT 200
      `;

      const [resumoFormasRs, condicoesRs] = await Promise.all([
        querySafe(sqlResumoFormas, params, 120000),
        querySafe(sqlCondicoes, params, 120000),
      ]);

      const resumoFormas = (resumoFormasRs.rows || []).map(x => ({
        forma: x.forma,
        total: Number(x.total || 0),
      }));

      const totalGrupo = resumoFormas.reduce((s, x) => s + x.total, 0);

      const condicoes = (condicoesRs.rows || []).map(x => ({
        condicao: x.condicao,
        forma: x.forma,
        total: Number(x.total || 0),
      }));

      return res.json({
        tipoDetalhe: "esquerda",
        grupo: grupoSel,
        titulo: grupoSel === "AVISTA" ? "Detalhe do À Vista" : "Detalhe do Prazo",
        subtitulo: grupoSel === "AVISTA"
          ? "Mostrando dinheiro, pix, débito e depósito."
          : "Mostrando crediário, cartão e cheque.",
        totalGrupo,
        qtdCondicoes: condicoes.length,
        qtdLancamentos: condicoes.length,
        resumoFormas: resumoFormas.map(x => ({
          ...x,
          pct: totalGrupo > 0 ? (x.total / totalGrupo) * 100 : 0
        })),
        condicoes
      });
    }

    // =====================================================
    // DETALHE DA DIREITA: PLANO DE CONTA / FORNECEDOR
    // =====================================================
    if (String(lado).toLowerCase() === "direita") {
      const origemSel = String(origem || "").trim().toLowerCase();
      const chaveSel = String(chave || "").trim();

      if (!["pagos", "abertos"].includes(origemSel)) {
        return res.status(400).json({ erro: "Origem inválida para detalhe da direita." });
      }

      if (!chaveSel) {
        return res.status(400).json({ erro: "Chave do item não informada." });
      }

      const params = [];
      const where = [
        origemSel === "pagos"
          ? `ft.status = 'B'`
          : `ft.status = 'A'`
      ];

      if (origemSel === "pagos") {
        where.push(`COALESCE(ft.valorpago,0) > 0`);
        where.push(`ft.pagamento IS NOT NULL`);
      }

      if (rpPermitidos.length === 1) {
        params.push(rpPermitidos[0]);
        where.push(`UPPER(TRIM(COALESCE(ft.rp::text,''))) = $${params.length}`);
      } else {
        const startRp = params.length + 1;
        rpPermitidos.forEach(rp => params.push(rp));
        where.push(`UPPER(TRIM(COALESCE(ft.rp::text,''))) IN ($${startRp}, $${startRp + 1})`);
      }

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
      }

      if (dataIni) {
        params.push(dataIni);
        where.push(
          origemSel === "pagos"
            ? `ft.pagamento::date >= $${params.length}`
            : `ft.vencimento::date >= $${params.length}`
        );
      }

      if (dataFim) {
        params.push(dataFim);
        where.push(
          origemSel === "pagos"
            ? `ft.pagamento::date <= $${params.length}`
            : `ft.vencimento::date <= $${params.length}`
        );
      }

      if (tipo && String(tipo).trim().toLowerCase() !== "todos") {
        params.push(String(tipo).trim());
        where.push(`TRIM(COALESCE(ft.tipo::text,'')) = $${params.length}`);
      }

      params.push(chaveSel);
      const chavePlaceholder = `$${params.length}`;

      const planoContaExpr = `
        COALESCE(
          NULLIF(TRIM(fi.descricao::text), ''),
          NULLIF(TRIM(ft.item::text), ''),
          'SEM PLANO DE CONTA'
        )
      `;

      const fornecedorExpr = `
        COALESCE(
          NULLIF(TRIM(p.apelido::text), ''),
          NULLIF(TRIM(p.nome::text), ''),
          'SEM FORNECEDOR'
        )
      `;

      const filtroItem = visao === "fornecedor"
        ? `TRIM(COALESCE(ft.pessoa::text,'')) = ${chavePlaceholder}`
        : `TRIM(COALESCE(ft.item::text,'')) = ${chavePlaceholder}`;

      where.push(filtroItem);

      const whereSql = `WHERE ${where.join(" AND ")}`;

      const joinVisao = `
        LEFT JOIN financeiro_itens fi
          ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
        LEFT JOIN pessoas p
          ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      `;

      const itemSelecionadoExpr = visao === "fornecedor" ? fornecedorExpr : planoContaExpr;
      const secundarioExpr = visao === "fornecedor" ? planoContaExpr : fornecedorExpr;

      const valorTituloExpr = origemSel === "pagos"
        ? `COALESCE(ft.valorpago,0)`
        : `
          GREATEST(
            COALESCE(ft.valor,0)
            - COALESCE(ft.valorpago,0)
            + COALESCE(ft.ajustes,0)
            + COALESCE(ft.juros,0)
            + COALESCE(ft.multa,0)
            + COALESCE(ft.acrescimo,0)
            - COALESCE(ft.desconto,0),
            0
          )
        `;

      const sqlResumo = `
        SELECT
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(ft.rp::text,'')) AS rp,
          TRIM(COALESCE(ft.status::text,'')) AS status,
          SUM(${valorTituloExpr}) AS total
        FROM financeiro_titulos ft
        ${joinVisao}
        ${whereSql}
        GROUP BY 1,2,3
        ORDER BY 1,2,3
      `;

      const sqlTitulos = `
        SELECT
          ${itemSelecionadoExpr} AS item_selecionado,
          COALESCE(ft.codigo::text, ft.documento::text, ft.conta::text, '-') AS documento,
          ${secundarioExpr} AS secundario,
          COALESCE(ft.instrucoes::text, '-') AS instrucoes,
          COALESCE(ft.complemento::text, '-') AS complemento,
          COALESCE(ft.lancamento::date, ft.vencimento::date, ft.pagamento::date) AS data_ref,
          ${valorTituloExpr} AS valor
        FROM financeiro_titulos ft
        ${joinVisao}
        ${whereSql}
        ORDER BY COALESCE(ft.pagamento::date, ft.vencimento::date, ft.lancamento::date) DESC, COALESCE(ft.codigo::text, ft.documento::text, ft.conta::text) DESC
        LIMIT 300
      `;

      const [resumoRs, titulosRs] = await Promise.all([
        querySafe(sqlResumo, params, 120000),
        querySafe(sqlTitulos, params, 120000),
      ]);

      const resumo = (resumoRs.rows || []).map(x => ({
        empresa: x.empresa || "-",
        rp: x.rp || "-",
        status: x.status || "-",
        total: Number(x.total || 0),
      }));

      const titulos = (titulosRs.rows || []).map(x => ({
        data: x.data_ref,
        documento: x.documento || "-",
        secundario: x.secundario || "-",
        instrucoes: x.instrucoes || "-",
        complemento: x.complemento || "-",
        valor: Number(x.valor || 0),
        itemSelecionado: x.item_selecionado || "-",
      }));

      const totalTitulos = titulos.reduce((s, x) => s + x.valor, 0);
      const itemSelecionado = titulos[0]?.itemSelecionado || chaveSel;

      return res.json({
        tipoDetalhe: "direita",
        visaoDireita: visao,
        origem: origemSel,
        origemLabel: origemSel === "pagos" ? "Baixado" : "Em aberto",
        titulo: visao === "fornecedor"
          ? `Detalhe do fornecedor: ${itemSelecionado}`
          : `Detalhe do plano de conta: ${itemSelecionado}`,
        subtitulo: "Mostrando instruções e complemento do financeiro_titulos.",
        itemSelecionado,
        qtdTitulos: titulos.length,
        totalTitulos,
        resumo,
        titulos: titulos.map(x => ({
          data: x.data ? new Date(x.data).toLocaleDateString("pt-BR") : "-",
          documento: x.documento,
          secundario: x.secundario,
          instrucoes: x.instrucoes,
          complemento: x.complemento,
          valor: x.valor,
        })),
      });
    }

    return res.status(400).json({ erro: "Parâmetros de detalhe inválidos." });
  } catch (err) {
    console.error("Erro /api/financeiro/faturamento-x-pagamento-detalhe:", err);
    res.status(500).json({
      erro: err.message
    });
  }
});


// =====================================================
// FINANCEIRO - DRE / META x REAL
// FILTRO POR DATA DE PAGAMENTO
// =====================================================

function classificarTipoDespesaDRE(item) {
  const i = String(item || "").trim().padStart(3, "0");

  if (["004","005","006","323","007","008","354","009","363","364"].includes(i)) return "01-COMPRAS";
  if (["246"].includes(i)) return "02-EMPRESTIMOS";
  if (["014","183","184","185","186","262","263","264","273","274","275","327","252","245","311"].includes(i)) return "03-IMPOSTOS";
  if (["127","213","214","215","216","217","218","219","220","221","222","223","224","225","226","227","248","250","204","294","102"].includes(i)) return "04-ROYALTES";
  if (["117","326","353"].includes(i)) return "05-ALUGUEL";
  if (["210"].includes(i)) return "06-ENERGIA";
  if (["128","298"].includes(i)) return "07-PROLABORE";
  if (["297"].includes(i)) return "08-PROL PALMARES";
  if (["181","187","188","189","190","191","192","193","194","195","196","197","198","201","203","261","270","282","284","285","286","314","319","347","205","206","207","208","209","272"].includes(i)) return "09-COLABORADOR";
  if (["302","303","321","316","291","287"].includes(i)) return "10-INVEST EMPRESA";
  if (["109","368","305","366","367","352","108","116","129","152","322","110","133","283","296","340","120","139","140","141","143","123","125","144","167","168","172","179","276","277","278","279","119","289","290","317","145","146","122","131","118","105","310","309","299","153","132","155","281","355","341","342","343","115","247","260","265","268","199","202","280","010","106","251","999","308","325","020","019","156","324","346","021","292"].includes(i)) return "11-DESPESA GERAL";
  if (["126"].includes(i)) return "12-DIVIDENDO";
  if (["359","365","315","013"].includes(i)) return "13-DESPESA FINANCEIRA";
  if (["300","301","304","312","313","320","212"].includes(i)) return "14-MENS SISTEMA";

  return "99-NAO CLASSIFICADO";
}

function getMetasDRE() {
  return {
    "01-COMPRAS": 40.00,
    "02-EMPRESTIMOS": 7.00,
    "03-IMPOSTOS": 15.00,
    "04-ROYALTES": 3.50,
    "05-ALUGUEL": 6.00,
    "06-ENERGIA": 1.20,
    "07-PROLABORE": 2.50,
    "08-PROL PALMARES": 0.00,
    "09-COLABORADOR": 14.00,
    "10-INVEST EMPRESA": 3.50,
    "11-DESPESA GERAL": 4.00,
    "12-DIVIDENDO": 0.60,
    "13-DESPESA FINANCEIRA": 1.50,
    "14-MENS SISTEMA": 1.20,
    "99-NAO CLASSIFICADO": 0.00,
  };
}
app.get("/api/financeiro/meta-real-competencia", async (req, res) => {
  const qs = new URLSearchParams(req.query).toString();
  return res.redirect(307, `/api/financeiro/meta-real?${qs}`);
});
app.get("/api/financeiro/meta-real", async (req, res) => {
  try {
    const {
      empresa = "todas",
      dataIni = "",
      dataFim = "",
      tipo = "todos",
    } = req.query;

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    const metas = getMetasDRE();

// ==========================
// FATURAMENTO COMPETENCIA
// VENDA REAL (ERP)
// ==========================
const paramsFat = [];
const whereFat = [
  `v.status = 'S'`,
  `COALESCE(m.estoque, false) = true`,
  `COALESCE(v.subtotal,0) <> 0`,
  `COALESCE(TRIM(d.descricao::text), '') <> 'APAGAR'`
];

if (empList.length) {
  const start = paramsFat.length + 1;
  empList.forEach((e) => paramsFat.push(e));
  const ph = empList.map((_, i) => `$${start + i}`).join(",");
  whereFat.push(`RIGHT(TRIM(emp.codigo::text), 2) IN (${ph})`);
}

if (dataIni) {
  paramsFat.push(dataIni);
  whereFat.push(`v.data::date >= $${paramsFat.length}`);
}

if (dataFim) {
  paramsFat.push(dataFim);
  whereFat.push(`v.data::date <= $${paramsFat.length}`);
}

const sqlFat = `
  SELECT
    COALESCE(
      SUM(
        COALESCE(m.total,0) *
        (COALESCE(v.total,0) / NULLIF(COALESCE(v.subtotal,0),0))
      ),
      0
    ) AS total_faturado
  FROM movimento m
  INNER JOIN vendas v
    ON m.auxiliar = ('VE' || v.codigo)::CHAR(10)
  INNER JOIN produtos p
    ON SUBSTR(m.produto, 1, 6)::CHAR(6) = p.codigo
  INNER JOIN pessoas emp
    ON LPAD(v.empresa, 8, '0')::CHAR(8) = emp.codigo
  LEFT JOIN departamentos d
    ON p.departamento = d.codigo
  WHERE ${whereFat.join(" AND ")}
`;

    // ==========================
    // PAGAMENTOS REALIZADOS
    // RP = P baixados
    // ==========================
    const paramsPag = [];
    const wherePag = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'`,
      `ft.status = 'B'`,
      `ft.pagamento IS NOT NULL`,
      `COALESCE(ft.valorpago,0) > 0`,
      `COALESCE(TRIM(ft.item::text),'') <> ''`
    ];

    if (empList.length) {
      const start = paramsPag.length + 1;
      empList.forEach((e) => paramsPag.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      wherePag.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      paramsPag.push(dataIni);
      wherePag.push(`ft.pagamento::date >= $${paramsPag.length}`);
    }

    if (dataFim) {
      paramsPag.push(dataFim);
      wherePag.push(`ft.pagamento::date <= $${paramsPag.length}`);
    }

    if (tipo && String(tipo).trim().toLowerCase() !== "todos") {
      paramsPag.push(String(tipo).trim());
      wherePag.push(`TRIM(COALESCE(ft.tipo::text,'')) = $${paramsPag.length}`);
    }

    const sqlPag = `
      SELECT
        LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0') AS item_codigo,
        COALESCE(NULLIF(TRIM(fi.descricao::text),''), 'SEM DESCRIÇÃO') AS item_descricao,
        SUM(COALESCE(ft.valorpago,0)) AS total
      FROM financeiro_titulos ft
      LEFT JOIN financeiro_itens fi
        ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
      WHERE ${wherePag.join(" AND ")}
      GROUP BY 1,2
      ORDER BY 3 DESC, 2
    `;

    const [rFat, rPag] = await Promise.all([
      querySafe(sqlFat, paramsFat, 120000),
      querySafe(sqlPag, paramsPag, 120000),
    ]);

    const totalFaturado = Number(rFat.rows?.[0]?.total_faturado || 0);

    const gruposMap = {};
    for (const grupo of Object.keys(metas)) {
      gruposMap[grupo] = { grupo, valor: 0, itens: [] };
    }

           for (const row of (rPag.rows || [])) {
      const itemCodigo = String(row.item_codigo || "").trim();
      const itemDescricao = String(row.item_descricao || "").trim();
      const valor = Number(row.total || 0);
      const grupo = classificarTipoDespesaDRE(itemCodigo);

      if (!gruposMap[grupo]) {
        gruposMap[grupo] = { grupo, valor: 0, itens: [] };
      }

      gruposMap[grupo].valor += valor;
      gruposMap[grupo].itens.push({
        item: itemCodigo,
        descricao: itemDescricao,
        valor,
      });
    }
    const ordem = Object.keys(metas);
    const dados = ordem.map((grupo) => {
      const valor = Number(gruposMap[grupo]?.valor || 0);
      const meta = Number(metas[grupo] || 0);
      const realizado = totalFaturado > 0 ? (valor / totalFaturado) * 100 : 0;
      const diferenca = realizado - meta;
      const atingivelValor = totalFaturado * (meta / 100);
      const status = realizado <= meta ? "OK" : "ACIMA";

      return {
        grupo,
        meta,
        realizado,
        diferenca,
        valor,
        atingivelValor,
        status,
        qtdItens: (gruposMap[grupo]?.itens || []).length,
      };
    });

    const totalPago = dados.reduce((s, x) => s + Number(x.valor || 0), 0);
    const totalMetaPercentual = dados.reduce((s, x) => s + Number(x.meta || 0), 0);
    const totalRealPercentual = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;

    return res.json({
      ok: true,
      periodo: {
        dataIni: dataIni || null,
        dataFim: dataFim || null,
        baseData: "pagamento"
      },
      totalFaturado,
      totalPago,
      totalMetaPercentual,
      totalRealPercentual,
      saldoAposPagamentos: totalFaturado - totalPago,
      dados,
    });
  } catch (err) {
    console.error("Erro /api/financeiro/meta-real:", err);
    res.status(500).json({ erro: err.message });
  }
});
app.get("/api/financeiro/meta-real-caixa", async (req, res) => {
  try {
    const {
      empresa = "todas",
      dataIni = "",
      dataFim = "",
      tipo = "todos",
    } = req.query;

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    const metas = getMetasDRE();

    // =====================================================
    // ENTRADAS DE CAIXA VIA MOVIMENTO / VENDAS / CONDICOES
    // dinheiro, pix, debito e deposito
    // =====================================================
    const paramsMov = [];
    const whereMov = [`1=1`];

    if (empList.length) {
      const start = paramsMov.length + 1;
      empList.forEach((e) => paramsMov.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereMov.push(`LPAD(TRIM(COALESCE(m.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      paramsMov.push(dataIni);
      whereMov.push(`m.data::date >= $${paramsMov.length}`);
    }

    if (dataFim) {
      paramsMov.push(dataFim);
      whereMov.push(`m.data::date <= $${paramsMov.length}`);
    }

    const formaExpr = `
      CASE
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '0' THEN 'PIX'
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '6' THEN 'DEPOSITO'
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '1'
             AND UPPER(COALESCE(c.descricao, '')) LIKE '%CARTAO%' THEN 'DEBITO'
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '1' THEN 'DINHEIRO'
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '2' THEN 'CARTAO'
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '3' THEN 'CHEQUE'
        WHEN TRIM(COALESCE(c.tipo::text, '')) = '4' THEN 'CREDIARIO'
        ELSE 'OUTROS'
      END
    `;

    const sqlCaixaMov = `
      SELECT
        COALESCE(
          SUM(
            COALESCE(m.total,0) *
            (COALESCE(v.total,0) / NULLIF(COALESCE(v.subtotal,0),0))
          ),
          0
        ) AS total
      FROM movimento m
      INNER JOIN vendas v
        ON m.auxiliar = ('VE' || v.codigo)::char(10)
      INNER JOIN condicoes c
        ON TRIM(COALESCE(v.condicoes::text,'')) = TRIM(COALESCE(c.codigo::text,''))
      WHERE ${whereMov.join(" AND ")}
        AND COALESCE(m.estoque, false) = true
        AND COALESCE(v.subtotal,0) <> 0
        AND (
          CASE
            WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
              THEN TRIM(COALESCE(v.status::text,'')) = 'P'
            ELSE TRIM(COALESCE(v.status::text,'')) = 'S'
          END
        )
        AND (
          CASE
            WHEN TRIM(COALESCE(v.tipo::text,'')) = '03'
              THEN TRIM(COALESCE(m.operacao::text,'')) = 'VC'
            ELSE TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV')
          END
        )
        AND ${formaExpr} IN ('DINHEIRO','PIX','DEBITO','DEPOSITO')
    `;

    const rMov = await querySafe(sqlCaixaMov, paramsMov, 45000);
    const totalMovCaixa = Number(rMov.rows?.[0]?.total || 0);

    // =====================================================
    // TITULOS RECEBIDOS
    // =====================================================
    const paramsRec = [];
    const whereRec = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'R'`,
      `TRIM(COALESCE(ft.status::text,'')) = 'B'`,
      `ft.pagamento IS NOT NULL`,
      `COALESCE(ft.valorpago,0) > 0`
    ];

    if (empList.length) {
      const start = paramsRec.length + 1;
      empList.forEach((e) => paramsRec.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereRec.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      paramsRec.push(dataIni);
      whereRec.push(`ft.pagamento::date >= $${paramsRec.length}`);
    }

    if (dataFim) {
      paramsRec.push(dataFim);
      whereRec.push(`ft.pagamento::date <= $${paramsRec.length}`);
    }

    if (tipo && String(tipo).trim().toLowerCase() !== "todos") {
      paramsRec.push(String(tipo).trim());
      whereRec.push(`TRIM(COALESCE(ft.tipo::text,'')) = $${paramsRec.length}`);
    }

    const sqlRec = `
      SELECT COALESCE(SUM(COALESCE(ft.valorpago,0)),0) AS total
      FROM financeiro_titulos ft
      WHERE ${whereRec.join(" AND ")}
    `;

    const rRec = await querySafe(sqlRec, paramsRec, 45000);
    const totalTitulosRecebidos = Number(rRec.rows?.[0]?.total || 0);

    const totalFaturado = totalMovCaixa + totalTitulosRecebidos;

    // =====================================================
    // PAGAMENTOS REALIZADOS POR ITEM
    // =====================================================
    const paramsPag = [];
    const wherePag = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'`,
      `TRIM(COALESCE(ft.status::text,'')) = 'B'`,
      `ft.pagamento IS NOT NULL`,
      `COALESCE(ft.valorpago,0) > 0`,
      `COALESCE(TRIM(ft.item::text),'') <> ''`
    ];

    if (empList.length) {
      const start = paramsPag.length + 1;
      empList.forEach((e) => paramsPag.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      wherePag.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      paramsPag.push(dataIni);
      wherePag.push(`ft.pagamento::date >= $${paramsPag.length}`);
    }

    if (dataFim) {
      paramsPag.push(dataFim);
      wherePag.push(`ft.pagamento::date <= $${paramsPag.length}`);
    }

    const sqlPag = `
      SELECT
        COALESCE(TRIM(ft.item::text),'') AS item,
        COALESCE(SUM(COALESCE(ft.valorpago,0)),0) AS total
      FROM financeiro_titulos ft
      WHERE ${wherePag.join(" AND ")}
      GROUP BY COALESCE(TRIM(ft.item::text),'')
    `;

    const rPag = await querySafe(sqlPag, paramsPag, 45000);
    const pagosPorItem = new Map(
      (rPag.rows || []).map(x => [String(x.item || "").trim(), Number(x.total || 0)])
    );

    const gruposMap = {};
    for (const grupo of Object.keys(metas)) {
      gruposMap[grupo] = { grupo, valor: 0, itens: [] };
    }

    for (const grupo of Object.keys(metas)) {
      const itensGrupo = getItensGrupoDRE(grupo) || [];
      for (const itemCodigo of itensGrupo) {
        const valor = Number(pagosPorItem.get(String(itemCodigo).trim()) || 0);
        gruposMap[grupo].valor += valor;
        gruposMap[grupo].itens.push({
          item: itemCodigo,
          descricao: itemCodigo,
          valor,
        });
      }
    }

    const ordem = Object.keys(metas);
    const dados = ordem.map((grupo) => {
      const valor = Number(gruposMap[grupo]?.valor || 0);
      const meta = Number(metas[grupo] || 0);
      const realizado = totalFaturado > 0 ? (valor / totalFaturado) * 100 : 0;
      const diferenca = realizado - meta;
      const atingivelValor = totalFaturado * (meta / 100);
      const status = realizado <= meta ? "OK" : "ACIMA";

      return {
        grupo,
        meta,
        realizado,
        diferenca,
        valor,
        atingivelValor,
        status,
        qtdItens: (gruposMap[grupo]?.itens || []).length,
      };
    });

    const totalPago = dados.reduce((s, x) => s + Number(x.valor || 0), 0);
    const totalMetaPercentual = dados.reduce((s, x) => s + Number(x.meta || 0), 0);
    const totalRealPercentual = totalFaturado > 0 ? (totalPago / totalFaturado) * 100 : 0;

    return res.json({
      ok: true,
      periodo: {
        dataIni: dataIni || null,
        dataFim: dataFim || null,
        baseData: "caixa"
      },
      componentes: {
        vendasAvistaPix: totalMovCaixa,
        titulosRecebidos: totalTitulosRecebidos
      },
      totalFaturado,
      totalPago,
      totalMetaPercentual,
      totalRealPercentual,
      saldoAposPagamentos: totalFaturado - totalPago,
      dados,
    });
  } catch (err) {
    console.error("Erro /api/financeiro/meta-real-caixa:", err);
    res.status(500).json({ erro: err.message });
  }
});
function getItensGrupoDRE(grupo) {
  const mapa = {
    "01-COMPRAS": ["004","005","006","323","007","008","354","009","363","364"],
    "02-EMPRESTIMOS": ["246"],
    "03-IMPOSTOS": ["014","183","184","185","186","262","263","264","273","274","275","327","252","245","311"],
    "04-ROYALTES": ["127","213","214","215","216","217","218","219","220","221","222","223","224","225","226","227","248","250","204","294","102"],
    "05-ALUGUEL": ["117","326","353"],
    "06-ENERGIA": ["210"],
    "07-PROLABORE": ["128","298"],
    "08-PROL PALMARES": ["297"],
    "09-COLABORADOR": ["181","187","188","189","190","191","192","193","194","195","196","197","198","201","203","261","270","282","284","285","286","314","319","347","205","206","207","208","209","272"],
    "10-INVEST EMPRESA": ["302","303","321","316","291","287"],
    "11-DESPESA GERAL": ["109","368","305","366","367","352","108","116","129","152","322","110","133","283","296","340","120","139","140","141","143","123","125","144","167","168","172","179","276","277","278","279","119","289","290","317","145","146","122","131","118","105","310","309","299","153","132","155","281","355","341","342","343","115","247","260","265","268","199","202","280","010","106","251","999","308","325","020","019","156","324","346","021","292"],
    "12-DIVIDENDO": ["126"],
    "13-DESPESA FINANCEIRA": ["359","365","315","013"],
    "14-MENS SISTEMA": ["300","301","304","312","313","320","212"],
    "99-NAO CLASSIFICADO": []
  };

  return mapa[String(grupo || "").trim()] || [];
}

app.get("/api/financeiro/meta-real-detalhe", async (req, res) => {

  try {
    const {
      empresa = "",
      dataIni = "",
      dataFim = "",
      grupo = "",
      tipo = "todos"
    } = req.query;

    const grupoSel = String(grupo || "").trim();
    if (!grupoSel) {
      return res.status(400).json({
        ok: false,
        erro: "Informe o grupo do DRE."
      });
    }

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    const itensGrupo = getItensGrupoDRE(grupoSel);
    const metas = getMetasDRE();

    if (grupoSel !== "99-NAO CLASSIFICADO" && !itensGrupo.length) {
      return res.json({
        ok: true,
        grupo: grupoSel,
        meta: Number(metas[grupoSel] || 0),
        totalGrupo: 0,
        qtdItens: 0,
        qtdTitulos: 0,
        itens: [],
        titulos: [],
        aviso: "Grupo sem itens cadastrados em getItensGrupoDRE."
      });
    }

    const params = [];
    const where = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'`,
      `TRIM(COALESCE(ft.status::text,'')) = 'B'`,
      `ft.pagamento IS NOT NULL`,
      `COALESCE(ft.valorpago,0) > 0`,
      `COALESCE(TRIM(ft.item::text),'') <> ''`
    ];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      params.push(dataIni);
      where.push(`ft.pagamento::date >= $${params.length}`);
    }

    if (dataFim) {
      params.push(dataFim);
      where.push(`ft.pagamento::date <= $${params.length}`);
    }

    if (tipo && String(tipo).trim().toLowerCase() !== "todos") {
      params.push(String(tipo).trim());
      where.push(`TRIM(COALESCE(ft.tipo::text,'')) = $${params.length}`);
    }

if (grupoSel !== "99-NAO CLASSIFICADO") {
  const start = params.length + 1;
  itensGrupo.forEach(i => params.push(String(i).padStart(3, "0")));
  const ph = itensGrupo.map((_, i) => `$${start + i}`).join(",");
  where.push(`LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0') IN (${ph})`);
}
    const whereSql = `WHERE ${where.join(" AND ")}`;

    const sqlItens = `
      SELECT
        LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0') AS item,
        COALESCE(NULLIF(TRIM(fi.descricao::text),''),'SEM DESCRIÇÃO') AS descricao,
        COUNT(*) AS qtd_titulos,
        COALESCE(SUM(COALESCE(ft.valorpago,0)),0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN financeiro_itens fi
        ON LPAD(TRIM(COALESCE(fi.codigo::text,'')),3,'0') =
           LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0')
      ${whereSql}
      GROUP BY 1,2
      ORDER BY 4 DESC, 2
    `;

     const sqlTitulos = `
      WITH titulos_base AS (
        SELECT
          ft.pagamento::date AS data,
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          COALESCE(ft.codigo::text, ft.documento::text, '-') AS documento,
          LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0') AS item,
          COALESCE(NULLIF(TRIM(fi.descricao::text),''),'SEM DESCRIÇÃO') AS descricao,
          TRIM(COALESCE(ft.pessoa::text,'')) AS pessoa_codigo,
          COALESCE(ft.instrucoes::text,'-') AS instrucoes,
          COALESCE(ft.complemento::text,'-') AS complemento,
          COALESCE(ft.valorpago,0) AS valor
        FROM financeiro_titulos ft
        LEFT JOIN financeiro_itens fi
          ON LPAD(TRIM(COALESCE(fi.codigo::text,'')),3,'0') =
             LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0')
        ${whereSql}
        ORDER BY ft.pagamento DESC
        LIMIT 500
      )
      SELECT
        tb.data,
        tb.empresa,
        tb.documento,
        tb.item,
        tb.descricao,
        COALESCE(
          NULLIF(TRIM(pes.apelido::text),''),
          NULLIF(TRIM(pes.nome::text),''),
          NULLIF(TRIM(tb.pessoa_codigo),''),
          '-'
        ) AS pessoa,
        tb.instrucoes,
        tb.complemento,
        tb.valor
      FROM titulos_base tb
      LEFT JOIN pessoas pes
        ON TRIM(COALESCE(pes.codigo::text,'')) = TRIM(COALESCE(tb.pessoa_codigo,''))
      ORDER BY tb.data DESC
    `;
    const [rItens, rTitulos] = await Promise.all([
      querySafe(sqlItens, params, 90000),
      querySafe(sqlTitulos, params, 90000)
    ]);

    const itens = (rItens.rows || []).map(x => ({
      item: String(x.item || "").trim(),
      descricao: String(x.descricao || "").trim(),
      qtdTitulos: Number(x.qtd_titulos || 0),
      valor: Number(x.valor || 0)
    }));

    const titulos = (rTitulos.rows || []).map(x => ({
      data: x.data,
      empresa: String(x.empresa || "").trim(),
      documento: String(x.documento || "-").trim(),
      item: String(x.item || "").trim(),
      descricao: String(x.descricao || "").trim(),
      pessoa: String(x.pessoa || "-").trim(),
      instrucoes: String(x.instrucoes || "-").trim(),
      complemento: String(x.complemento || "-").trim(),
      valor: Number(x.valor || 0)
    }));

const itensFinal = grupoSel === "99-NAO CLASSIFICADO"
  ? itens.filter(x => classificarTipoDespesaDRE(x.item) === "99-NAO CLASSIFICADO")
  : itens;

const titulosFinal = grupoSel === "99-NAO CLASSIFICADO"
  ? titulos.filter(x => classificarTipoDespesaDRE(x.item) === "99-NAO CLASSIFICADO")
  : titulos;

return res.json({
  ok: true,
  grupo: grupoSel,
  meta: Number(metas[grupoSel] || 0),
  totalGrupo: itensFinal.reduce((s, x) => s + Number(x.valor || 0), 0),
  qtdItens: itensFinal.length,
  qtdTitulos: titulosFinal.length,
  itens: itensFinal,
  titulos: titulosFinal
});

  } catch (err) {
    console.error("Erro /api/financeiro/meta-real-detalhe:", err);
    res.status(500).json({ ok:false, erro: err.message });
  }
});

// =====================================================
// FINANCEIRO - CREDIARIO RESUMO
// REGRA:
// - filtro do painel pelo LANCAMENTO
// - vencimento serve para separar vencido / a vencer
// - item 002 = principal
// - item 009 = acrescimo
// - item 010 = desconto
// =====================================================
app.get("/api/financeiro/crediario-resumo", async (req, res) => {
  try {
    const { empresa = "todas", dataIni = "", dataFim = "" } = req.query;

    const params = [];
    const whereBase = [
      `ft.rp = 'R'`,
      `TRIM(COALESCE(ft.tipo::text,'')) = '4'`
    ];

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereBase.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    let condLancamento = `TRUE`;
    if (dataIni && dataFim) {
      params.push(dataIni);
      const pIni = `$${params.length}`;
      params.push(dataFim);
      const pFim = `$${params.length}`;
      condLancamento = `lancamento >= ${pIni} AND lancamento <= ${pFim}`;
    } else if (dataIni) {
      params.push(dataIni);
      const pIni = `$${params.length}`;
      condLancamento = `lancamento >= ${pIni}`;
    } else if (dataFim) {
      params.push(dataFim);
      const pFim = `$${params.length}`;
      condLancamento = `lancamento <= ${pFim}`;
    }

    const sql = `
      WITH base AS (
        SELECT
          COALESCE(ft.lancamento::date, ft.vencimento::date) AS lancamento,
          ft.vencimento::date AS vencimento,
          ft.pagamento::date AS pagamento,
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(ft.pessoa::text,'')) AS pessoa,
          TRIM(COALESCE(ft.item::text,'')) AS item,
          TRIM(COALESCE(ft.status::text,'')) AS status,
          COALESCE(ft.valor::numeric,0) AS valor,
          TRIM(COALESCE(ft.documento::text, ft.codigo::text, ft.conta::text, '')) AS documento,
          TRIM(COALESCE(p.nome::text, p.apelido::text, ft.pessoa::text, '')) AS cliente,
          p.scpcentrada::date AS scpc_entrada,
          p.scpcsaida::date AS scpc_saida,
          CASE
            WHEN p.scpcstatus = 1 THEN 'Nada consta'
            WHEN p.scpcstatus = 2 THEN 'Reabilitado'
            WHEN p.scpcstatus = 3 THEN 'Seprocado'
            WHEN p.scpcstatus = 4 THEN 'Inabilitado'
            WHEN p.scpcstatus = 5 THEN 'Serasa'
            WHEN p.scpcstatus = 6 THEN 'SCPC/Serasa'
            ELSE 'Não metrificado'
          END AS scpc_status
        FROM financeiro_titulos ft
        LEFT JOIN pessoas p
          ON TRIM(COALESCE(ft.pessoa::text,'')) = TRIM(COALESCE(p.codigo::text,''))
        WHERE ${whereBase.join(" AND ")}
      ),
      filtro AS (
        SELECT *
        FROM base
        WHERE ${condLancamento}
      ),
      scpc AS (
        SELECT
          scpc_status AS status,
          COUNT(*) AS qtd_titulos,
          COALESCE(SUM(valor),0) AS valor
        FROM filtro
        WHERE item = '002'
          AND status = 'A'
        GROUP BY scpc_status
      )
      SELECT
        COALESCE(SUM(CASE WHEN item = '002' AND status IN ('A','B') THEN valor ELSE 0 END),0) AS vendido,
        COALESCE(SUM(CASE WHEN item = '002' AND status IN ('A','B') THEN 1 ELSE 0 END),0) AS qtd_vendido,

        COALESCE(SUM(CASE WHEN item = '002' AND status = 'B' THEN valor ELSE 0 END),0) AS recebido,
        COALESCE(SUM(CASE WHEN item = '002' AND status = 'B' THEN 1 ELSE 0 END),0) AS qtd_baixados,

        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' THEN valor ELSE 0 END),0) AS aberto,
        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' THEN 1 ELSE 0 END),0) AS qtd_abertos,

        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' AND vencimento < CURRENT_DATE THEN valor ELSE 0 END),0) AS vencido,
        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' AND vencimento < CURRENT_DATE THEN 1 ELSE 0 END),0) AS qtd_vencidos,

        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' AND vencimento >= CURRENT_DATE THEN valor ELSE 0 END),0) AS a_vencer,
        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' AND vencimento >= CURRENT_DATE THEN 1 ELSE 0 END),0) AS qtd_a_vencer,

        COALESCE(SUM(CASE WHEN item = '009' AND status = 'B' THEN valor ELSE 0 END),0) AS acrescimos,
        COALESCE(SUM(CASE WHEN item = '009' AND status = 'B' THEN 1 ELSE 0 END),0) AS qtd_acrescimos,

        COALESCE(SUM(CASE WHEN item = '010' AND status = 'B' THEN valor ELSE 0 END),0) AS descontos,
        COALESCE(SUM(CASE WHEN item = '010' AND status = 'B' THEN 1 ELSE 0 END),0) AS qtd_descontos,

        COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' AND vencimento < CURRENT_DATE AND scpc_entrada IS NULL THEN 1 ELSE 0 END),0) AS qtd_vencidos_nao_negativados,

        CASE
          WHEN COALESCE(SUM(CASE WHEN item = '002' AND status IN ('A','B') THEN valor ELSE 0 END),0) > 0
          THEN
            (
              COALESCE(SUM(CASE WHEN item = '002' AND status = 'A' AND vencimento < CURRENT_DATE THEN valor ELSE 0 END),0)
              / COALESCE(SUM(CASE WHEN item = '002' AND status IN ('A','B') THEN valor ELSE 0 END),0)
            ) * 100
          ELSE 0
        END AS inadimplencia_pct,

        COALESCE((
          SELECT json_agg(
            json_build_object(
              'status', status,
              'qtdTitulos', qtd_titulos,
              'valor', valor
            )
            ORDER BY valor DESC, status
          )
          FROM scpc
        ), '[]'::json) AS scpc_resumo
      FROM filtro
    `;

    const r = await querySafe(sql, params, 60000);
    const x = r.rows?.[0] || {};

    return res.json({
      ok: true,
      resumo: {
        vendido: Number(x.vendido || 0),
        qtdVendido: Number(x.qtd_vendido || 0),

        recebido: Number(x.recebido || 0),
        qtdBaixados: Number(x.qtd_baixados || 0),

        aberto: Number(x.aberto || 0),
        qtdAbertos: Number(x.qtd_abertos || 0),

        vencido: Number(x.vencido || 0),
        qtdVencidos: Number(x.qtd_vencidos || 0),

        aVencer: Number(x.a_vencer || 0),
        qtdAVencer: Number(x.qtd_a_vencer || 0),

        jurosRecebidos: Number(x.acrescimos || 0),
        qtdAcrescimos: Number(x.qtd_acrescimos || 0),

        descontos: Number(x.descontos || 0),
        qtdDescontos: Number(x.qtd_descontos || 0),

        qtdVencidosNaoNegativados: Number(x.qtd_vencidos_nao_negativados || 0),
        inadimplenciaPct: Number(x.inadimplencia_pct || 0),

        scpcResumo: Array.isArray(x.scpc_resumo) ? x.scpc_resumo : []
      }
    });
  } catch (err) {
    console.error("Erro /api/financeiro/crediario-resumo:", err);
    res.status(500).json({ erro: err.message });
  }
});

// =====================================================
// FINANCEIRO - CREDIARIO TITULOS
// FILTRO E EXIBIÇÃO PELO LANCAMENTO REAL
// =====================================================
app.get("/api/financeiro/crediario-titulos", async (req, res) => {
  try {
    const {
      empresa = "todas",
      dataIni = "",
      dataFim = "",
      limit = "120"
    } = req.query;

    const params = [];
    const where = [
      `ft.rp = 'R'`,
      `ft.tipo = '4'`,
      `ft.item = '002'`
    ];

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(ft.empresa::text, 2, '0') IN (${ph})`);
    }

    // =================================================
    // FILTRO PELO LANCAMENTO REAL
    // =================================================
    if (dataIni) {
      params.push(dataIni);
      where.push(`ft.lancamento::date >= $${params.length}`);
    }

    if (dataFim) {
      params.push(dataFim);
      where.push(`ft.lancamento::date <= $${params.length}`);
    }

    const lim = Math.min(Math.max(parseInt(String(limit || "120"), 10) || 120, 1), 200);
    params.push(lim);

    const sql = `
      SELECT
        ft.lancamento::date AS lancamento,
        ft.vencimento::date AS vencimento,
        ft.pagamento::date AS pagamento,
        LPAD(ft.empresa::text, 2, '0') AS empresa,
        COALESCE(ft.documento::text, ft.codigo::text, ft.conta::text, '-') AS documento,
        COALESCE(p.nome::text, p.apelido::text, ft.pessoa::text, '-') AS cliente,
        COALESCE(ft.valor,0) AS valor,

        CASE
          WHEN ft.status = 'B' THEN COALESCE(ft.valor,0)
          ELSE 0
        END AS valor_pago,

        CASE
          WHEN ft.status = 'A' THEN COALESCE(ft.valor,0)
          ELSE 0
        END AS falta_receber,

        CASE
          WHEN ft.status = 'B' THEN 'Recebido'
          WHEN ft.vencimento::date < CURRENT_DATE THEN 'Vencido'
          ELSE 'A vencer'
        END AS situacao,

        p.scpcentrada::date AS scpc_entrada,
        p.scpcsaida::date AS scpc_saida,

        CASE
          WHEN p.scpcstatus = 1 THEN 'Nada consta'
          WHEN p.scpcstatus = 2 THEN 'Reabilitado'
          WHEN p.scpcstatus = 3 THEN 'Seprocado'
          WHEN p.scpcstatus = 4 THEN 'Inabilitado'
          WHEN p.scpcstatus = 5 THEN 'Serasa'
          WHEN p.scpcstatus = 6 THEN 'SCPC/Serasa'
          ELSE 'Não metrificado'
        END AS scpc_status

      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON p.codigo = ft.pessoa

      WHERE ${where.join(" AND ")}

      ORDER BY
        ft.lancamento::date DESC,
        ft.vencimento::date DESC,
        ft.codigo DESC

      LIMIT $${params.length}
    `;

    const r = await querySafe(sql, params, 15000);

    return res.json({
      ok: true,
      titulos: (r.rows || []).map((x) => ({
        lancamento: x.lancamento,
        vencimento: x.vencimento,
        pagamento: x.pagamento,
        empresa: x.empresa || "-",
        documento: x.documento || "-",
        cliente: x.cliente || "-",
        valor: Number(x.valor || 0),
        valorPago: Number(x.valor_pago || 0),
        faltaReceber: Number(x.falta_receber || 0),
        situacao: x.situacao || "-",
        scpcStatus: x.scpc_status || "Não metrificado",
        scpcEntrada: x.scpc_entrada,
        scpcSaida: x.scpc_saida
      }))
    });
  } catch (err) {
    console.error("Erro /api/financeiro/crediario-titulos:", err);
    res.status(500).json({ erro: err.message });
  }
});

// =====================================================
// FINANCEIRO - CREDIARIO MENSAL
// SUPER LEVE
// =====================================================
app.get("/api/financeiro/crediario-mensal", async (req, res) => {
  try {
    const { empresa = "todas", dataIni = "", dataFim = "" } = req.query;

    const params = [];
    const where = [
      `ft.rp = 'R'`,
      `ft.tipo = '4'`,
      `ft.item IN ('002','009')`
    ];

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(ft.empresa::text, 2, '0') IN (${ph})`);
    }

    if (dataIni) {
      params.push(dataIni);
      where.push(`ft.lancamento::date >= $${params.length}`);
    }

    if (dataFim) {
      params.push(dataFim);
      where.push(`ft.lancamento::date <= $${params.length}`);
    }

    const sql = `
      SELECT
        EXTRACT(YEAR FROM ft.lancamento::date)::int AS ano,
        EXTRACT(MONTH FROM ft.lancamento::date)::int AS mes,
        TO_CHAR(ft.lancamento::date, 'MM/YYYY') AS periodo,
        SUM(CASE WHEN ft.item = '002' AND ft.status IN ('A','B') THEN COALESCE(ft.valor,0) ELSE 0 END) AS vendido,
        SUM(CASE WHEN ft.item = '002' AND ft.status = 'B' THEN COALESCE(ft.valor,0) ELSE 0 END) AS recebido,
        SUM(CASE WHEN ft.item = '002' AND ft.status = 'A' AND ft.vencimento < CURRENT_DATE THEN COALESCE(ft.valor,0) ELSE 0 END) AS vencido,
        SUM(CASE WHEN ft.item = '009' AND ft.status = 'B' THEN COALESCE(ft.valor,0) ELSE 0 END) AS acrescimos
      FROM financeiro_titulos ft
      WHERE ${where.join(" AND ")}
      GROUP BY 1,2,3
      ORDER BY 1,2
    `;

    const r = await querySafe(sql, params, 15000);

    return res.json({
      ok: true,
      data: (r.rows || []).map((x) => ({
        ano: Number(x.ano || 0),
        mes: Number(x.mes || 0),
        periodo: x.periodo,
        vendido: Number(x.vendido || 0),
        recebido: Number(x.recebido || 0),
        vencido: Number(x.vencido || 0),
        acrescimos: Number(x.acrescimos || 0)
      }))
    });
  } catch (err) {
    console.error("Erro /api/financeiro/crediario-mensal:", err);
    res.status(500).json({ erro: err.message });
  }
});

// =====================================================
// FINANCEIRO - PROJECAO DE RECEBIMENTO
// carteira futura agrupada pelo vencimento
// =====================================================
app.get("/api/financeiro/crediario-projecao", async (req, res) => {
  try {
    const { empresa = "todas", dataIni = "", dataFim = "" } = req.query;

    const params = [];
    const whereBase = [
      `ft.rp = 'R'`,
      `TRIM(COALESCE(ft.tipo::text,'')) = '4'`,
      `TRIM(COALESCE(ft.item::text,'')) = '002'`,
      `TRIM(COALESCE(ft.status::text,'')) = 'A'`,
      `ft.vencimento::date >= CURRENT_DATE`
    ];

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereBase.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      params.push(dataIni);
      whereBase.push(`COALESCE(ft.lancamento::date, ft.vencimento::date) >= $${params.length}`);
    }
    if (dataFim) {
      params.push(dataFim);
      whereBase.push(`COALESCE(ft.lancamento::date, ft.vencimento::date) <= $${params.length}`);
    }

    const sql = `
      SELECT
        EXTRACT(YEAR FROM ft.vencimento::date)::int AS ano,
        EXTRACT(MONTH FROM ft.vencimento::date)::int AS mes,
        TO_CHAR(ft.vencimento::date, 'MM/YYYY') AS periodo,
        COUNT(*) AS qtd_titulos,
        COALESCE(SUM(ft.valor::numeric),0) AS total
      FROM financeiro_titulos ft
      WHERE ${whereBase.join(" AND ")}
      GROUP BY 1,2,3
      ORDER BY 1,2
    `;

    const r = await querySafe(sql, params, 60000);
    res.json({
      ok: true,
      data: (r.rows || []).map((x) => ({
        ano: Number(x.ano || 0),
        mes: Number(x.mes || 0),
        periodo: x.periodo,
        qtdTitulos: Number(x.qtd_titulos || 0),
        total: Number(x.total || 0)
      }))
    });
  } catch (err) {
    console.error("Erro /api/financeiro/crediario-projecao:", err);
    res.status(500).json({ erro: err.message });
  }
});

// =====================================================
// FINANCEIRO - RANKING INADIMPLENTES
// SUPER LEVE
// =====================================================
app.get("/api/financeiro/crediario-ranking-inadimplentes", async (req, res) => {
  try {
    const { empresa = "todas", dataIni = "", dataFim = "", limit = "30" } = req.query;

    const params = [];
    const where = [
      `ft.rp = 'R'`,
      `ft.tipo = '4'`,
      `ft.item = '002'`,
      `ft.status = 'A'`,
      `ft.vencimento < CURRENT_DATE`
    ];

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(ft.empresa::text, 2, '0') IN (${ph})`);
    }

    if (dataIni) {
      params.push(dataIni);
      where.push(`ft.lancamento::date >= $${params.length}`);
    }

    if (dataFim) {
      params.push(dataFim);
      where.push(`ft.lancamento::date <= $${params.length}`);
    }

    const lim = Math.min(Math.max(parseInt(String(limit || "10"), 10) || 10, 1), 15);
    params.push(lim);

    const sql = `
      SELECT
        ft.pessoa AS cliente_codigo,
        COALESCE(MAX(p.nome), MAX(p.apelido), ft.pessoa::text, '-') AS cliente,
        COUNT(*) AS qtd_titulos,
        SUM(COALESCE(ft.valor,0)) AS total_vencido,
        MIN(ft.vencimento::date) AS primeiro_vencimento,
        MAX(ft.vencimento::date) AS ultimo_vencimento,
        CASE
          WHEN MAX(p.scpcstatus) = 1 THEN 'Nada consta'
          WHEN MAX(p.scpcstatus) = 2 THEN 'Reabilitado'
          WHEN MAX(p.scpcstatus) = 3 THEN 'Seprocado'
          WHEN MAX(p.scpcstatus) = 4 THEN 'Inabilitado'
          WHEN MAX(p.scpcstatus) = 5 THEN 'Serasa'
          WHEN MAX(p.scpcstatus) = 6 THEN 'SCPC/Serasa'
          ELSE 'Não metrificado'
        END AS scpc_status
      FROM financeiro_titulos ft
      LEFT JOIN pessoas p
        ON p.codigo = ft.pessoa
      WHERE ${where.join(" AND ")}
      GROUP BY ft.pessoa
      ORDER BY total_vencido DESC, qtd_titulos DESC
      LIMIT $${params.length}
    `;

    const r = await querySafe(sql, params, 15000);

    return res.json({
      ok: true,
      data: (r.rows || []).map((x) => ({
        clienteCodigo: x.cliente_codigo || "-",
        cliente: x.cliente || "-",
        qtdTitulos: Number(x.qtd_titulos || 0),
        totalVencido: Number(x.total_vencido || 0),
        primeiroVencimento: x.primeiro_vencimento,
        ultimoVencimento: x.ultimo_vencimento,
        scpcStatus: x.scpc_status || "Não metrificado"
      }))
    });
  } catch (err) {
    console.error("Erro /api/financeiro/crediario-ranking-inadimplentes:", err);
    res.status(500).json({ erro: err.message });
  }
});

// =====================================================
// FINANCEIRO - CREDIARIO DASHBOARD PROFISSIONAL
// Carteira, aging, saude por loja e clientes em risco.
// Mantem a mesma regra do crediario atual:
// RP=R | tipo=4 | item=002 | periodo pelo lancamento.
// =====================================================
app.get("/api/financeiro/crediario-dashboard", async (req, res) => {
  try {
    const { empresa = "todas", dataIni = "", dataFim = "" } = req.query;
    const params = [];
    const where = [
      `ft.rp = 'R'`,
      `TRIM(COALESCE(ft.tipo::text,'')) = '4'`,
      `TRIM(COALESCE(ft.item::text,'')) = '002'`
    ];

    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (dataIni) {
      params.push(dataIni);
      where.push(`COALESCE(ft.lancamento::date,ft.vencimento::date) >= $${params.length}::date`);
    }
    if (dataFim) {
      params.push(dataFim);
      where.push(`COALESCE(ft.lancamento::date,ft.vencimento::date) <= $${params.length}::date`);
    }

    const sql = `
      WITH base AS (
        SELECT
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(ft.pessoa::text,'')) AS pessoa,
          COALESCE(NULLIF(TRIM(COALESCE(p.nome::text,'')),''), NULLIF(TRIM(COALESCE(p.apelido::text,'')),''), TRIM(COALESCE(ft.pessoa::text,'')), '-') AS cliente,
          COALESCE(ft.lancamento::date,ft.vencimento::date) AS lancamento,
          ft.vencimento::date AS vencimento,
          ft.pagamento::date AS pagamento,
          TRIM(COALESCE(ft.status::text,'')) AS status,
          COALESCE(ft.valor::numeric,0) AS valor,
          p.scpcentrada::date AS scpc_entrada,
          CASE
            WHEN p.scpcstatus = 1 THEN 'Nada consta'
            WHEN p.scpcstatus = 2 THEN 'Reabilitado'
            WHEN p.scpcstatus = 3 THEN 'Seprocado'
            WHEN p.scpcstatus = 4 THEN 'Inabilitado'
            WHEN p.scpcstatus = 5 THEN 'Serasa'
            WHEN p.scpcstatus = 6 THEN 'SCPC/Serasa'
            ELSE 'Não metrificado'
          END AS scpc_status,
          CASE
            WHEN ft.status <> 'A' THEN 0
            WHEN ft.vencimento::date >= CURRENT_DATE THEN 0
            ELSE (CURRENT_DATE - ft.vencimento::date)
          END::int AS dias_atraso
        FROM financeiro_titulos ft
        LEFT JOIN pessoas p ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
        WHERE ${where.join(" AND ")}
      ),
      aging AS (
        SELECT faixa, ordem, COUNT(*) AS qtd_titulos, COALESCE(SUM(valor),0) AS total
        FROM (
          SELECT *,
            CASE
              WHEN status='A' AND vencimento >= CURRENT_DATE THEN 'Em dia / a vencer'
              WHEN status='A' AND dias_atraso BETWEEN 1 AND 7 THEN '1-7 dias'
              WHEN status='A' AND dias_atraso BETWEEN 8 AND 15 THEN '8-15 dias'
              WHEN status='A' AND dias_atraso BETWEEN 16 AND 30 THEN '16-30 dias'
              WHEN status='A' AND dias_atraso BETWEEN 31 AND 60 THEN '31-60 dias'
              WHEN status='A' AND dias_atraso BETWEEN 61 AND 90 THEN '61-90 dias'
              WHEN status='A' AND dias_atraso BETWEEN 91 AND 120 THEN '91-120 dias'
              WHEN status='A' AND dias_atraso > 120 THEN '+120 dias'
              ELSE NULL
            END AS faixa,
            CASE
              WHEN status='A' AND vencimento >= CURRENT_DATE THEN 0
              WHEN dias_atraso BETWEEN 1 AND 7 THEN 1
              WHEN dias_atraso BETWEEN 8 AND 15 THEN 2
              WHEN dias_atraso BETWEEN 16 AND 30 THEN 3
              WHEN dias_atraso BETWEEN 31 AND 60 THEN 4
              WHEN dias_atraso BETWEEN 61 AND 90 THEN 5
              WHEN dias_atraso BETWEEN 91 AND 120 THEN 6
              WHEN dias_atraso > 120 THEN 7
              ELSE 99
            END AS ordem
          FROM base
        ) x
        WHERE faixa IS NOT NULL
        GROUP BY faixa, ordem
      ),
      clientes AS (
        SELECT
          pessoa,
          MAX(cliente) AS cliente,
          COUNT(*) FILTER (WHERE status='A') AS qtd_abertos,
          COUNT(*) FILTER (WHERE status='A' AND vencimento < CURRENT_DATE) AS qtd_vencidos,
          COALESCE(SUM(valor) FILTER (WHERE status='A'),0) AS saldo,
          COALESCE(SUM(valor) FILTER (WHERE status='A' AND vencimento < CURRENT_DATE),0) AS vencido,
          COALESCE(MAX(dias_atraso) FILTER (WHERE status='A'),0) AS maior_atraso,
          MAX(scpc_status) AS scpc_status,
          BOOL_OR(scpc_entrada IS NOT NULL) AS negativado
        FROM base
        GROUP BY pessoa
      ),
      lojas AS (
        SELECT
          empresa,
          COALESCE(SUM(valor) FILTER (WHERE status='A'),0) AS carteira,
          COALESCE(SUM(valor) FILTER (WHERE status='A' AND vencimento < CURRENT_DATE),0) AS vencido,
          COUNT(DISTINCT pessoa) FILTER (WHERE status='A') AS clientes,
          COUNT(DISTINCT pessoa) FILTER (WHERE status='A' AND vencimento < CURRENT_DATE) AS inadimplentes,
          COALESCE(SUM(valor) FILTER (WHERE status='B'),0) AS recebido,
          COALESCE(SUM(valor),0) AS vendido
        FROM base
        GROUP BY empresa
      )
      SELECT json_build_object(
        'indicadores', json_build_object(
          'carteira', COALESCE((SELECT SUM(valor) FROM base WHERE status='A'),0),
          'clientesComSaldo', COALESCE((SELECT COUNT(DISTINCT pessoa) FROM base WHERE status='A'),0),
          'clientesInadimplentes', COALESCE((SELECT COUNT(DISTINCT pessoa) FROM base WHERE status='A' AND vencimento < CURRENT_DATE),0),
          'ticketCarteira', COALESCE((SELECT SUM(valor) FROM base WHERE status='A'),0) / NULLIF(COALESCE((SELECT COUNT(DISTINCT pessoa) FROM base WHERE status='A'),0),0),
          'vencido30', COALESCE((SELECT SUM(valor) FROM base WHERE status='A' AND dias_atraso > 30),0),
          'vencido90', COALESCE((SELECT SUM(valor) FROM base WHERE status='A' AND dias_atraso > 90),0)
        ),
        'aging', COALESCE((SELECT json_agg(json_build_object('faixa',faixa,'ordem',ordem,'qtdTitulos',qtd_titulos,'total',total) ORDER BY ordem) FROM aging),'[]'::json),
        'lojas', COALESCE((SELECT json_agg(json_build_object(
          'empresa',empresa,'carteira',carteira,'vencido',vencido,'clientes',clientes,'inadimplentes',inadimplentes,
          'inadimplenciaPct',CASE WHEN carteira>0 THEN (vencido/carteira)*100 ELSE 0 END,
          'recuperacaoPct',CASE WHEN vendido>0 THEN (recebido/vendido)*100 ELSE 0 END
        ) ORDER BY CASE WHEN carteira>0 THEN (vencido/carteira) ELSE 0 END DESC) FROM lojas),'[]'::json),
        'prioridade', COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT pessoa AS "clienteCodigo", cliente, qtd_abertos AS "qtdTitulos", vencido AS "totalVencido",
                 maior_atraso AS "maiorAtraso", scpc_status AS "scpcStatus", negativado,
                 CASE
                   WHEN maior_atraso > 120 OR vencido >= 5000 THEN 'CRITICO'
                   WHEN maior_atraso > 60 OR vencido >= 2500 THEN 'ALTO'
                   WHEN maior_atraso > 30 OR vencido >= 1000 THEN 'MEDIO'
                   ELSE 'ATENCAO'
                 END AS prioridade
          FROM clientes
          WHERE vencido > 0
          ORDER BY
            CASE WHEN maior_atraso > 120 OR vencido >= 5000 THEN 4 WHEN maior_atraso > 60 OR vencido >= 2500 THEN 3 WHEN maior_atraso > 30 OR vencido >= 1000 THEN 2 ELSE 1 END DESC,
            vencido DESC, maior_atraso DESC
          LIMIT 50
        ) z),'[]'::json)
      ) AS dashboard
    `;

    const r = await querySafe(sql, params, 60000);
    return res.json({ ok:true, ...(r.rows?.[0]?.dashboard || {}) });
  } catch (err) {
    console.error("Erro /api/financeiro/crediario-dashboard:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});


// ======================================================
// FINANCEIRO - POSIÇÃO FINANCEIRA - RESUMO RÁPIDO
// Resumos e gráficos sem carregar a tabela detalhada.
// ======================================================
app.get("/api/financeiro/ativo-passivo-resumo", async (req, res) => {
  try {
    const {
      empresa = "",
      dataIni = "",
      dataFim = "",
      status = "B",
      lado = "TODOS",
      forma = "",
      busca = "",
      fornecedor = "",
      plano = ""
    } = req.query;

    if (!dataIni || !dataFim) {
      return res.status(400).json({ erro: "Informe período" });
    }

    const empList = await resolveEmpresasFiltro(empresa);

    const params = [dataIni, dataFim];
    const where = [];

    let dataRefExpr = "";
    if (status === "B") {
      dataRefExpr = "ft.pagamento::date";
    } else if (status === "A") {
      dataRefExpr = "ft.vencimento::date";
    } else {
      dataRefExpr = "COALESCE(ft.pagamento::date, ft.vencimento::date, ft.lancamento::date)";
    }

    where.push(`${dataRefExpr} BETWEEN $1::date AND $2::date`);
    where.push(`TRIM(COALESCE(ft.rp::text,'')) IN ('R','P','S')`);

    if (empList.length) {
      const ini = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${ini+i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`);
    }

    if (status !== "TODOS") {
      params.push(status);
      where.push(`TRIM(COALESCE(ft.status::text,'')) = $${params.length}`);
    }

    if (forma) {
      params.push(`%${forma}%`);
      where.push(`(${formaReceberCase("ft")} ILIKE $${params.length})`);
    }

    if (busca) {
      params.push(`%${busca}%`);
      where.push(`(
        COALESCE(p.nome::text,'') ILIKE $${params.length}
        OR COALESCE(p.apelido::text,'') ILIKE $${params.length}
        OR COALESCE(ft.documento::text,'') ILIKE $${params.length}
        OR COALESCE(ft.descricao::text,'') ILIKE $${params.length}
      )`);
    }

    if (fornecedor) {
      params.push(`%${fornecedor}%`);
      where.push(`(
        COALESCE(p.nome::text,'') ILIKE $${params.length}
        OR COALESCE(p.apelido::text,'') ILIKE $${params.length}
        OR COALESCE(ft.pessoa::text,'') ILIKE $${params.length}
      )`);
    }

    if (plano) {
      params.push(`%${plano}%`);
      where.push(`(
        COALESCE(fi.descricao::text,'') ILIKE $${params.length}
        OR COALESCE(ft.item::text,'') ILIKE $${params.length}
        OR COALESCE(ft.descricao::text,'') ILIKE $${params.length}
      )`);
    }

    if (lado === "ATIVO") {
      where.push(`TRIM(COALESCE(ft.rp::text,'')) = 'R'`);
    } else if (lado === "PASSIVO") {
      where.push(`TRIM(COALESCE(ft.rp::text,'')) IN ('P','S')`);
    }

    const valorAbertoExpr = `
      GREATEST(
        COALESCE(ft.valor,0)
        - COALESCE(ft.valorpago,0)
        + COALESCE(ft.juros,0)
        + COALESCE(ft.multa,0)
        + COALESCE(ft.acrescimo,0)
        - COALESCE(ft.desconto,0),
        0
      )
    `;

    const valorCalc =
      status === "B"
        ? `COALESCE(ft.valorpago::numeric,0)`
        : status === "A"
          ? `${valorAbertoExpr}`
          : `(COALESCE(ft.valorpago::numeric,0) + ${valorAbertoExpr})`;

    const sql = `
      WITH base AS (
        SELECT
          CASE
            WHEN TRIM(COALESCE(ft.rp::text,'')) = 'R' THEN 'ATIVO'
            ELSE 'PASSIVO'
          END AS lado,

          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,

          COALESCE(
            NULLIF(TRIM(p.nome::text),''),
            NULLIF(TRIM(p.apelido::text),''),
            NULLIF(TRIM(ft.pessoa::text),''),
            'SEM PESSOA'
          ) AS pessoa,

          COALESCE(
            NULLIF(TRIM(ft.descricao::text),''),
            NULLIF(TRIM(ft.complemento::text),''),
            NULLIF(TRIM(ft.instrucoes::text),''),
            'SEM DESCRIÇÃO'
          ) AS descricao,

          COALESCE(
            NULLIF(TRIM(fi.descricao::text),''),
            NULLIF(TRIM(ft.item::text),''),
            'SEM PLANO'
          ) AS plano,

          COALESCE(
            NULLIF(TRIM(fc.descricao::text),''),
            NULLIF(TRIM(ft.conta::text),''),
            'SEM CONTA/BANCO'
          ) AS conta_banco,

          ${formaReceberCase("ft")} AS forma,

          CASE
            WHEN TRIM(COALESCE(ft.status::text,'')) = 'B' THEN 'Realizado'
            WHEN TRIM(COALESCE(ft.status::text,'')) = 'A' THEN 'Em aberto'
            ELSE TRIM(COALESCE(ft.status::text,''))
          END AS situacao,

          ${valorCalc}::numeric AS valor
        FROM financeiro_titulos ft
        LEFT JOIN pessoas p
          ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
        LEFT JOIN financeiro_itens fi
          ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
        LEFT JOIN financeiro_contas fc
          ON TRIM(COALESCE(fc.codigo::text,'')) = TRIM(COALESCE(ft.conta::text,''))
        WHERE ${where.join("\n AND ")}
      ),

      resumo AS (
        SELECT
          lado,
          situacao,
          COUNT(*)::int AS qtd,
          COALESCE(SUM(valor),0)::numeric AS valor
        FROM base
        GROUP BY lado,situacao
      )

      SELECT
        COALESCE((SELECT SUM(valor) FROM base WHERE lado='ATIVO'),0)::numeric AS "totalAtivo",
        COALESCE((SELECT SUM(valor) FROM base WHERE lado='PASSIVO'),0)::numeric AS "totalPassivo",

        COALESCE((
          SELECT json_agg(json_build_object(
            'origem', CASE WHEN situacao='Realizado' THEN 'Recebimentos baixados' ELSE 'Contas a receber' END,
            'situacao',situacao,'qtd',qtd,'valor',valor
          ) ORDER BY valor DESC)
          FROM resumo WHERE lado='ATIVO'
        ),'[]'::json) AS "ativo",

        COALESCE((
          SELECT json_agg(json_build_object(
            'origem', CASE WHEN situacao='Realizado' THEN 'Pagamentos / saídas baixadas' ELSE 'Contas a pagar / saídas abertas' END,
            'situacao',situacao,'qtd',qtd,'valor',valor
          ) ORDER BY valor DESC)
          FROM resumo WHERE lado='PASSIVO'
        ),'[]'::json) AS "passivo",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT plano AS "planoConta", COUNT(*)::int AS "qtdTitulos", SUM(valor)::numeric AS total
          FROM base WHERE lado='ATIVO' GROUP BY plano ORDER BY total DESC LIMIT 30
        ) z),'[]'::json) AS "resumoPlanoAtivo",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT plano AS "planoConta", COUNT(*)::int AS "qtdTitulos", SUM(valor)::numeric AS total
          FROM base WHERE lado='PASSIVO' GROUP BY plano ORDER BY total DESC LIMIT 30
        ) z),'[]'::json) AS "resumoPlanoPassivo",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT pessoa AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='ATIVO' GROUP BY pessoa ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "ativoPessoa",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT empresa AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='ATIVO' GROUP BY empresa ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "ativoEmpresa",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT forma AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='ATIVO' GROUP BY forma ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "ativoForma",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT conta_banco AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='ATIVO' GROUP BY conta_banco ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "ativoContaBanco",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT descricao AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='ATIVO' GROUP BY descricao ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "ativoDescricao",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT plano AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='PASSIVO' GROUP BY plano ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "passivoPlano",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT pessoa AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='PASSIVO' GROUP BY pessoa ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "passivoPessoa",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT empresa AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='PASSIVO' GROUP BY empresa ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "passivoEmpresa",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT forma AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='PASSIVO' GROUP BY forma ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "passivoForma",

        COALESCE((SELECT json_agg(row_to_json(z)) FROM (
          SELECT conta_banco AS nome, COUNT(*)::int AS qtd, SUM(valor)::numeric AS valor
          FROM base WHERE lado='PASSIVO' GROUP BY conta_banco ORDER BY valor DESC LIMIT 20
        ) z),'[]'::json) AS "passivoContaBanco"
    `;

    const r = await querySafe(sql, params, 45000);
    const row = r.rows?.[0] || {};

    const totalAtivo = Number(row.totalAtivo || 0);
    const totalPassivo = Number(row.totalPassivo || 0);

    res.json({
      ok:true,
      totalAtivo,
      totalPassivo,
      saldo: totalAtivo - totalPassivo,
      ativo: row.ativo || [],
      passivo: row.passivo || [],
      resumoPlanoAtivo: row.resumoPlanoAtivo || [],
      resumoPlanoPassivo: row.resumoPlanoPassivo || [],
      graficos:{
        ativoPessoa: row.ativoPessoa || [],
        ativoEmpresa: row.ativoEmpresa || [],
        ativoForma: row.ativoForma || [],
        ativoContaBanco: row.ativoContaBanco || [],
        ativoDescricao: row.ativoDescricao || [],
        passivoPlano: row.passivoPlano || [],
        passivoPessoa: row.passivoPessoa || [],
        passivoEmpresa: row.passivoEmpresa || [],
        passivoForma: row.passivoForma || [],
        passivoContaBanco: row.passivoContaBanco || []
      }
    });

  } catch (err) {
    console.error("Erro /api/financeiro/ativo-passivo-resumo:", err);

    const msg = String(err?.message || err || "");
    const timeout = /timeout|statement timeout|query read timeout|canceling statement/i.test(msg);

    if(timeout){
      return res.status(504).json({
        ok:false,
        codigo:"TIMEOUT",
        erro:"A consulta demorou mais que o esperado. Refine os filtros e tente novamente."
      });
    }

    res.status(500).json({
      ok:false,
      codigo:"ERRO_CONSULTA",
      erro:"Não foi possível concluir a consulta da Posição Financeira."
    });
  }
});

// ======================================================
// FINANCEIRO - ATIVO X PASSIVO
// ======================================================
app.get("/api/financeiro/ativo-passivo", async (req, res) => {
  try {
    const {
      empresa = "",
      dataIni = "",
      dataFim = "",
      status = "B",
      lado = "TODOS",
      forma = "",
      busca = "",
      fornecedor = "",
      plano = ""
    } = req.query;

    if (!dataIni || !dataFim) {
      return res.status(400).json({ erro: "Informe período" });
    }

    const empList = await resolveEmpresasFiltro(empresa);

    const params = [dataIni, dataFim];
    let empSql = "";
    let filtrosExtras = "";

    let dataRefExpr = "";
    if (status === "B") {
      dataRefExpr = "ft.pagamento::date";
    } else if (status === "A") {
      dataRefExpr = "ft.vencimento::date";
    } else {
      dataRefExpr = "COALESCE(ft.pagamento::date, ft.vencimento::date, ft.lancamento::date)";
    }

    const dataSql = `
      AND ${dataRefExpr} BETWEEN $1::date AND $2::date
    `;

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      empSql = ` AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph}) `;
    }

    if (status !== "TODOS") {
      params.push(status);
      filtrosExtras += ` AND TRIM(COALESCE(ft.status::text,'')) = $${params.length} `;
    }

    if (forma) {
      params.push(`%${forma}%`);
      filtrosExtras += `
        AND (${formaReceberCase("ft")} ILIKE $${params.length})
      `;
    }

    if (busca) {
      params.push(`%${busca}%`);
      filtrosExtras += `
        AND (
          COALESCE(p.nome::text,'') ILIKE $${params.length}
          OR COALESCE(p.apelido::text,'') ILIKE $${params.length}
          OR COALESCE(ft.documento::text,'') ILIKE $${params.length}
          OR COALESCE(ft.descricao::text,'') ILIKE $${params.length}
        )
      `;
    }

    if (fornecedor) {
      params.push(`%${fornecedor}%`);
      filtrosExtras += `
        AND (
          COALESCE(p.nome::text,'') ILIKE $${params.length}
          OR COALESCE(p.apelido::text,'') ILIKE $${params.length}
          OR COALESCE(ft.pessoa::text,'') ILIKE $${params.length}
        )
      `;
    }

    if (plano) {
      params.push(`%${plano}%`);
      filtrosExtras += `
        AND (
          COALESCE(fi.descricao::text,'') ILIKE $${params.length}
          OR COALESCE(ft.item::text,'') ILIKE $${params.length}
          OR COALESCE(ft.descricao::text,'') ILIKE $${params.length}
        )
      `;
    }

    const valorAbertoExpr = `
      GREATEST(
        COALESCE(ft.valor,0)
        - COALESCE(ft.valorpago,0)
        + COALESCE(ft.juros,0)
        + COALESCE(ft.multa,0)
        + COALESCE(ft.acrescimo,0)
        - COALESCE(ft.desconto,0),
        0
      )
    `;

    const formaExpr = formaReceberCase("ft");

    const detalheSql = `
      SELECT
        CASE
          WHEN rp = 'R' THEN 'ATIVO'
          WHEN rp IN ('P','S') THEN 'PASSIVO'
          ELSE 'OUTROS'
        END AS lado,
        empresa,
        data_ref,
        pessoa,
        documento,
        descricao,
        complemento,
        instrucoes,
        item,
        plano_conta,
conta_banco,
tipo,
forma_recebimento,
        CASE
          WHEN status = 'B' THEN 'Realizado'
          WHEN status = 'A' THEN 'Em aberto'
          ELSE status
        END AS situacao,
        lancamento,
        vencimento,
        pagamento,
        valor,
        valorpago,
        valor_aberto
      FROM (
        SELECT
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          ${dataRefExpr} AS data_ref,
          TRIM(COALESCE(ft.rp::text,'')) AS rp,
          TRIM(COALESCE(ft.status::text,'')) AS status,
          TRIM(COALESCE(ft.tipo::text,'')) AS tipo,
          TRIM(COALESCE(ft.item::text,'')) AS item,
          COALESCE(fi.descricao, '') AS plano_conta,
TRIM(
  COALESCE(
    NULLIF(fc.descricao::text,''),
    ft.conta::text,
    'SEM CONTA/BANCO'
  )
) AS conta_banco,
          ft.lancamento::date AS lancamento,
          ft.vencimento::date AS vencimento,
          ft.pagamento::date AS pagamento,
          COALESCE(TRIM(ft.documento::text),'') AS documento,
          COALESCE(TRIM(ft.descricao::text),'') AS descricao,
          COALESCE(TRIM(ft.complemento::text),'') AS complemento,
          COALESCE(TRIM(ft.instrucoes::text),'') AS instrucoes,
          TRIM(
            COALESCE(
              NULLIF(p.nome::text,''),
              NULLIF(p.apelido::text,''),
              ft.pessoa::text,
              ''
            )
          ) AS pessoa,
          COALESCE(ft.valor::numeric,0) AS valor,
          COALESCE(ft.valorpago::numeric,0) AS valorpago,
          ${valorAbertoExpr} AS valor_aberto,
          ${formaExpr} AS forma_recebimento
        FROM financeiro_titulos ft
        LEFT JOIN pessoas p
          ON TRIM(p.codigo::text) = TRIM(ft.pessoa::text)
        LEFT JOIN financeiro_itens fi
  ON TRIM(fi.codigo::text) = TRIM(ft.item::text)

LEFT JOIN financeiro_contas fc
  ON TRIM(fc.codigo::text) = TRIM(ft.conta::text)

        WHERE 1=1
          ${dataSql}
          ${empSql}
          ${filtrosExtras}
      ) b
      WHERE rp IN ('R','P','S')
      ORDER BY data_ref DESC, empresa, pessoa
    `;

    const detalheRes = await querySafe(detalheSql, params, 120000);
    const detalhes = detalheRes.rows || [];

    const detalheAtivo = detalhes
      .filter(x => x.lado === "ATIVO")
      .map(x => ({
        empresa: x.empresa,
        dataRef: x.data_ref,
        pessoa: x.pessoa,
        documento: x.documento,
        descricao: x.descricao || x.complemento || x.instrucoes,
        forma: x.forma_recebimento,
contaBanco: x.conta_banco || "SEM CONTA/BANCO",
situacao: x.situacao,
        lancamento: x.lancamento,
        vencimento: x.vencimento,
        pagamento: x.pagamento,
        valor: Number(x.valor || 0),
        valorPago: Number(x.valorpago || 0),
        valorAberto: Number(x.valor_aberto || 0)
      }));

    const detalhePassivo = detalhes
      .filter(x => x.lado === "PASSIVO")
      .map(x => ({
        empresa: x.empresa,
        dataRef: x.data_ref,
        pessoa: x.pessoa,
        documento: x.documento,
        descricao: x.descricao || x.complemento || x.instrucoes,
        planoConta: x.plano_conta || x.item || "SEM PLANO",
contaBanco: x.conta_banco || "SEM CONTA/BANCO",
tipo: x.tipo,
        situacao: x.situacao,
        lancamento: x.lancamento,
        vencimento: x.vencimento,
        pagamento: x.pagamento,
        valor: Number(x.valor || 0),
        valorPago: Number(x.valorpago || 0),
        valorAberto: Number(x.valor_aberto || 0)
      }));

    let detalheAtivoFinal = detalheAtivo;
    let detalhePassivoFinal = detalhePassivo;

    if (lado === "ATIVO") detalhePassivoFinal = [];
    if (lado === "PASSIVO") detalheAtivoFinal = [];

    function valorConformeStatus(x){
      if (status === "B") return Number(x.valorPago || 0);
      if (status === "A") return Number(x.valorAberto || 0);
      return Number(x.valorPago || 0) + Number(x.valorAberto || 0);
    }

    function agruparResumo(lista, ladoResumo){
      const mapa = new Map();

      for (const x of lista) {
        const situacao = x.situacao || "-";
        const origem = ladoResumo === "ATIVO"
          ? (situacao === "Realizado" ? "Recebimentos baixados" : "Contas a receber")
          : (situacao === "Realizado" ? "Pagamentos / saídas baixadas" : "Contas a pagar / saídas abertas");

        const chave = `${origem}|${situacao}`;
        const atual = mapa.get(chave) || { origem, situacao, qtd: 0, valor: 0 };
        atual.qtd += 1;
        atual.valor += valorConformeStatus(x);
        mapa.set(chave, atual);
      }

      return Array.from(mapa.values());
    }

    function agruparPlano(lista){
      const mapa = new Map();

      for (const x of lista) {
        const nomePlano = String(x.planoConta || "SEM PLANO").trim() || "SEM PLANO";
        const atual = mapa.get(nomePlano) || { planoConta: nomePlano, qtdTitulos: 0, total: 0 };
        atual.qtdTitulos += 1;
        atual.total += valorConformeStatus(x);
        mapa.set(nomePlano, atual);
      }

      return Array.from(mapa.values()).sort((a,b) => Number(b.total || 0) - Number(a.total || 0));
    }

    const ativo = agruparResumo(detalheAtivoFinal, "ATIVO");
    const passivo = agruparResumo(detalhePassivoFinal, "PASSIVO");

    const totalAtivo = detalheAtivoFinal.reduce((s, x) => s + valorConformeStatus(x), 0);
    const totalPassivo = detalhePassivoFinal.reduce((s, x) => s + valorConformeStatus(x), 0);

    res.json({
      ok: true,
      ativo,
      passivo,
      resumoPlanoAtivo: agruparPlano(detalheAtivoFinal),
      resumoPlanoPassivo: agruparPlano(detalhePassivoFinal),
      detalheAtivo: detalheAtivoFinal,
      detalhePassivo: detalhePassivoFinal,
      totalAtivo,
      totalPassivo,
      saldo: totalAtivo - totalPassivo
    });

  } catch (err) {
    console.error("Erro /api/financeiro/ativo-passivo:", err);
    res.status(500).json({ ok:false, erro: err.message });
  }
});

function formaReceberCase(alias = "ft"){
  return `
    CASE
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '0' THEN 'PIX'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '1' THEN 'A VISTA'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '2' THEN 'CARTAO'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '3' THEN 'CHEQUE PRE'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '4' THEN 'CREDIARIO'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '5' THEN 'BOLETOS'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '6' THEN 'DEPOSITO'
      WHEN TRIM(COALESCE(${alias}.tipo::text,'')) = '7' THEN 'DEBITO CONTA'
      ELSE 'OUTROS'
    END
  `;
}


// ======================================================
// MÓDULO FINANCEIRO - CONCILIAÇÃO BANCÁRIA
// ======================================================
const registrarRotasConciliacao = require("./conciliacao");
registrarRotasConciliacao({
  app,
  querySafe,
  queryAtendimento,
  resolveEmpresasFiltro
});


// ======================================================
// FINANCEIRO - QUADRO DEMONSTRATIVO
// CONTAS A RECEBER / CONTAS A PAGAR
// Retorna somente KPIs e agrupamentos leves.
// ======================================================
app.get("/api/financeiro/quadro-demonstrativo", async (req, res) => {
  try {
    const {
      tipo = "receber",
      visao = "",
      empresa = "",
      dataIni = "",
      dataFim = "",
      fornecedor = "",
      plano = "",
      cliente = "",
      formaPagamento = "",
      situacaoFinanceira = "ABERTO",
      incluirTransferencias = "0",
      filtroEmpresa = "",
      filtroItem = "",
      filtroStatus = "",
      filtroEmpresasMulti = "",
      filtroItensMulti = "",
      filtroStatusMulti = "",
      detalhes = ""
    } = req.query;

    const lado = String(tipo || "receber").toLowerCase() === "pagar"
      ? "pagar" : "receber";

    const visoesReceber = ["forma","cliente","conta","vencimento"];
    const visoesPagar = ["plano","fornecedor","conta","vencimento"];

    const visaoFinal = lado === "receber"
      ? (visoesReceber.includes(String(visao)) ? String(visao) : "forma")
      : (visoesPagar.includes(String(visao)) ? String(visao) : "plano");

    const parseLista = valor => {
      if(!valor) return [];
      try{
        const arr=JSON.parse(String(valor));
        return Array.isArray(arr)
          ? arr.map(x=>String(x).trim()).filter(Boolean)
          : [];
      }catch{
        return [];
      }
    };

    const empresasMulti = parseLista(filtroEmpresasMulti);
    const itensMulti = parseLista(filtroItensMulti);
    const statusMulti = parseLista(filtroStatusMulti);

    const params=[];

    const situacaoPrincipal =
      String(situacaoFinanceira || "ABERTO").trim().toUpperCase();

    const whereBase=[
      lado==="receber"
        ? `TRIM(COALESCE(ft.rp::text,'')) = 'R'`
        : `TRIM(COALESCE(ft.rp::text,'')) IN ('P','S')`
    ];

    const filtroSituacaoBase = await montarFiltroSituacaoFinanceiraSeta({
      alias:"ft",
      situacao:situacaoPrincipal,
      dataIni,
      dataFim,
      params
    });

    whereBase.push(...filtroSituacaoBase.filtros);

    // Regra padrão do Contas a Pagar:
    // plano 012 (TRANSFERÊNCIAS) fica fora dos cálculos.
    // Só entra quando o usuário marcar "Incluir transferências".
    const deveIncluirTransferencias =
      String(incluirTransferencias || "0").trim() === "1";

    if(lado === "pagar" && !deveIncluirTransferencias){
      whereBase.push(`
        LPAD(
          REGEXP_REPLACE(TRIM(COALESCE(ft.item::text,'')),'\\D','','g'),
          3,
          '0'
        ) <> '012'
      `);
    }

    const situacoesComDataPropria = new Set([
      "ATRASADO","EMISSAO","COMBINADO","COMPETENCIA",
      "ACEITE","SEM_ACEITE","COMPETENCIA_EMISSAO"
    ]);
    const usarFiltroVencimentoPadrao =
      !situacoesComDataPropria.has(situacaoPrincipal);

    if(usarFiltroVencimentoPadrao && dataIni){
      params.push(dataIni);
      whereBase.push(`ft.vencimento::date >= $${params.length}::date`);
    }

    if(usarFiltroVencimentoPadrao && dataFim){
      params.push(dataFim);
      whereBase.push(`ft.vencimento::date <= $${params.length}::date`);
    }

    const empList=await resolveEmpresasFiltro(String(empresa||"").trim());

    if(empList.length){
      const ini=params.length+1;
      empList.forEach(x=>params.push(x));
      const ph=empList.map((_,i)=>`$${ini+i}`).join(",");
      whereBase.push(
        `LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})`
      );
    }

    // Filtros principais do formulário de Contas a Pagar.
    if(lado==="pagar" && fornecedor){
      params.push(`%${String(fornecedor).trim()}%`);
      whereBase.push(`
        EXISTS (
          SELECT 1 FROM pessoas px
          WHERE TRIM(COALESCE(px.codigo::text,''))=TRIM(COALESCE(ft.pessoa::text,''))
          AND COALESCE(
            NULLIF(TRIM(px.nome::text),''),
            NULLIF(TRIM(px.apelido::text),''),
            TRIM(COALESCE(ft.pessoa::text,''))
          ) ILIKE $${params.length}
        )
      `);
    }

    if(lado==="pagar" && plano){
      params.push(`%${String(plano).trim()}%`);
      whereBase.push(`
        EXISTS (
          SELECT 1 FROM financeiro_itens fix
          WHERE TRIM(COALESCE(fix.codigo::text,''))=TRIM(COALESCE(ft.item::text,''))
          AND COALESCE(
            NULLIF(TRIM(fix.descricao::text),''),
            TRIM(COALESCE(ft.item::text,''))
          ) ILIKE $${params.length}
        )
      `);
    }

    // Filtros principais do formulário de Contas a Receber.
    if(lado==="receber" && cliente){
      params.push(`%${String(cliente).trim()}%`);
      whereBase.push(`
        EXISTS (
          SELECT 1 FROM pessoas px
          WHERE TRIM(COALESCE(px.codigo::text,''))=TRIM(COALESCE(ft.pessoa::text,''))
          AND COALESCE(
            NULLIF(TRIM(px.nome::text),''),
            NULLIF(TRIM(px.apelido::text),''),
            TRIM(COALESCE(ft.pessoa::text,''))
          ) ILIKE $${params.length}
        )
      `);
    }

    if(lado==="receber" && formaPagamento){
      params.push(`%${String(formaPagamento).trim()}%`);
      whereBase.push(`
        (${formaReceberCase("ft")} ILIKE $${params.length})
      `);
    }

    const saldoAbertoExpr=`
      GREATEST(
        COALESCE(ft.valor::numeric,0)
        - COALESCE(ft.valorpago::numeric,0)
        + COALESCE(ft.juros::numeric,0)
        + COALESCE(ft.multa::numeric,0)
        + COALESCE(ft.acrescimo::numeric,0)
        - COALESCE(ft.desconto::numeric,0),
        0
      )
    `;

    // Em aberto usa saldo. Realizado usa efetivamente pago/recebido.
    // Em "Todos", cada título usa a medida adequada ao seu status.
    const saldoExpr = situacaoPrincipal === "BAIXADO"
      ? `COALESCE(NULLIF(ft.valorpago::numeric,0),ft.valor::numeric,0)`
      : situacaoPrincipal === "TODOS"
        ? `CASE
             WHEN TRIM(COALESCE(ft.status::text,''))='B'
               THEN COALESCE(NULLIF(ft.valorpago::numeric,0),ft.valor::numeric,0)
             ELSE ${saldoAbertoExpr}
           END`
        : saldoAbertoExpr;

    const formaExpr=`
      CASE
        WHEN TRIM(COALESCE(b.tipo::text,''))='0' THEN 'PIX'
        WHEN TRIM(COALESCE(b.tipo::text,''))='1' THEN 'A VISTA'
        WHEN TRIM(COALESCE(b.tipo::text,''))='2' THEN 'CARTAO'
        WHEN TRIM(COALESCE(b.tipo::text,''))='3' THEN 'CHEQUE PRE'
        WHEN TRIM(COALESCE(b.tipo::text,''))='4' THEN 'CREDIARIO'
        WHEN TRIM(COALESCE(b.tipo::text,''))='5' THEN 'BOLETOS'
        WHEN TRIM(COALESCE(b.tipo::text,''))='6' THEN 'DEPOSITO'
        WHEN TRIM(COALESCE(b.tipo::text,''))='7' THEN 'DEBITO CONTA'
        ELSE 'OUTROS'
      END
    `;

    const vencExpr=`
      CASE
        WHEN b.vencimento < CURRENT_DATE
             AND b.vencimento >= CURRENT_DATE - 30
          THEN 'VENCIDO ATÉ 30 DIAS'
        WHEN b.vencimento < CURRENT_DATE - 30
             AND b.vencimento >= CURRENT_DATE - 60
          THEN 'VENCIDO DE 31 A 60 DIAS'
        WHEN b.vencimento < CURRENT_DATE - 60
             AND b.vencimento >= CURRENT_DATE - 90
          THEN 'VENCIDO DE 61 A 90 DIAS'
        WHEN b.vencimento < CURRENT_DATE - 90
             AND b.vencimento >= CURRENT_DATE - 180
          THEN 'VENCIDO DE 91 A 180 DIAS'
        WHEN b.vencimento < CURRENT_DATE - 180
          THEN 'VENCIDO ACIMA DE 180 DIAS'
        WHEN b.vencimento >= CURRENT_DATE
             AND b.vencimento <= CURRENT_DATE + 30
          THEN 'A VENCER ATÉ 30 DIAS'
        WHEN b.vencimento <= CURRENT_DATE + 60
          THEN 'A VENCER DE 31 A 60 DIAS'
        WHEN b.vencimento <= CURRENT_DATE + 90
          THEN 'A VENCER DE 61 A 90 DIAS'
        ELSE 'A VENCER ACIMA DE 90 DIAS'
      END
    `;

    let joinVisao="";
    let nomeVisaoExpr=formaExpr;

    if(visaoFinal==="cliente" || visaoFinal==="fornecedor"){
      joinVisao=`
        LEFT JOIN pessoas p
          ON TRIM(COALESCE(p.codigo::text,''))=TRIM(COALESCE(b.pessoa::text,''))
      `;
      nomeVisaoExpr=`
        COALESCE(
          NULLIF(TRIM(p.nome::text),''),
          NULLIF(TRIM(p.apelido::text),''),
          NULLIF(TRIM(b.pessoa::text),''),
          'SEM PESSOA'
        )
      `;
    }else if(visaoFinal==="conta"){
      joinVisao=`
        LEFT JOIN financeiro_contas fc
          ON TRIM(COALESCE(fc.codigo::text,''))=TRIM(COALESCE(b.conta::text,''))
      `;
      nomeVisaoExpr=`
        COALESCE(
          NULLIF(TRIM(fc.descricao::text),''),
          NULLIF(TRIM(b.conta::text),''),
          'SEM CONTA/BANCO'
        )
      `;
    }else if(visaoFinal==="plano"){
      joinVisao=`
        LEFT JOIN financeiro_itens fi
          ON TRIM(COALESCE(fi.codigo::text,''))=TRIM(COALESCE(b.item::text,''))
      `;
      nomeVisaoExpr=`
        COALESCE(
          NULLIF(TRIM(fi.descricao::text),''),
          NULLIF(TRIM(b.item::text),''),
          'SEM PLANO'
        )
      `;
    }else if(visaoFinal==="vencimento"){
      nomeVisaoExpr=vencExpr;
    }

    // Normaliza compatibilidade com filtros antigos de seleção única.
    const empresasSel=empresasMulti.length
      ? empresasMulti
      : (filtroEmpresa ? [String(filtroEmpresa).trim()] : []);

    const itensSel=itensMulti.length
      ? itensMulti
      : (filtroItem ? [String(filtroItem).trim()] : []);

    const statusSel=statusMulti.length
      ? statusMulti
      : (filtroStatus ? [String(filtroStatus).trim()] : []);

    const makeIn=(expr,valores)=>{
      if(!valores.length) return "TRUE";
      const ini=params.length+1;
      valores.forEach(x=>params.push(x));
      const ph=valores.map((_,i)=>`$${ini+i}`).join(",");
      return `${expr} IN (${ph})`;
    };

    const filtroEmpresaSql=makeIn("e.empresa",empresasSel);
    const filtroItemSql=makeIn("e.visao_nome",itensSel);

    let filtroStatusSql="TRUE";
    if(statusSel.length===1){
      if(statusSel[0]==="vencido") filtroStatusSql="e.vencimento < CURRENT_DATE";
      else if(statusSel[0]==="avencer") filtroStatusSql="e.vencimento >= CURRENT_DATE";
    }

    const sqlDashboard=`
      WITH base AS (
        SELECT
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          ft.pessoa,
          ft.conta,
          ft.item,
          ft.tipo,
          ft.vencimento::date AS vencimento,
          ${saldoExpr}::numeric AS saldo
        FROM financeiro_titulos ft
        WHERE ${whereBase.join(" AND ")}
      ),
      enriched AS (
        SELECT
          b.*,
          ${nomeVisaoExpr} AS visao_nome
        FROM base b
        ${joinVisao}
      ),
      resumo_base AS (
        SELECT e.*
        FROM enriched e
        WHERE ${filtroEmpresaSql}
          AND ${filtroStatusSql}
          AND ${filtroItemSql}
      ),
      empresas_base AS (
        SELECT e.*
        FROM enriched e
        WHERE ${filtroStatusSql}
          AND ${filtroItemSql}
      ),
      visao_base AS (
        SELECT e.*
        FROM enriched e
        WHERE ${filtroEmpresaSql}
          AND ${filtroStatusSql}
      ),
      resumo AS (
        SELECT
          COUNT(*)::int AS qtd_titulos,
          COUNT(DISTINCT TRIM(COALESCE(pessoa::text,'')))::int AS qtd_pessoas,
          COALESCE(SUM(saldo),0)::numeric AS total,
          COALESCE(SUM(CASE WHEN vencimento<CURRENT_DATE THEN saldo ELSE 0 END),0)::numeric AS vencido,
          COALESCE(SUM(CASE WHEN vencimento>=CURRENT_DATE THEN saldo ELSE 0 END),0)::numeric AS a_vencer
        FROM resumo_base
      ),
      empresas AS (
        SELECT empresa AS nome,COUNT(*)::int AS qtd,
               COALESCE(SUM(saldo),0)::numeric AS total
        FROM empresas_base
        GROUP BY empresa
        ORDER BY total DESC
        LIMIT 30
      ),
      visao AS (
        SELECT
          visao_nome AS nome,
          COUNT(*)::int AS qtd,
          COALESCE(SUM(saldo),0)::numeric AS total,
          CASE
            WHEN '${visaoFinal}' <> 'vencimento' THEN 0
            WHEN visao_nome='VENCIDO ATÉ 30 DIAS' THEN 1
            WHEN visao_nome='VENCIDO DE 31 A 60 DIAS' THEN 2
            WHEN visao_nome='VENCIDO DE 61 A 90 DIAS' THEN 3
            WHEN visao_nome='VENCIDO DE 91 A 180 DIAS' THEN 4
            WHEN visao_nome='VENCIDO ACIMA DE 180 DIAS' THEN 5
            WHEN visao_nome='A VENCER ATÉ 30 DIAS' THEN 6
            WHEN visao_nome='A VENCER DE 31 A 60 DIAS' THEN 7
            WHEN visao_nome='A VENCER DE 61 A 90 DIAS' THEN 8
            WHEN visao_nome='A VENCER ACIMA DE 90 DIAS' THEN 9
            ELSE 99
          END AS ordem
        FROM visao_base
        GROUP BY visao_nome
        ORDER BY
          CASE
            WHEN '${visaoFinal}'='vencimento' THEN
              CASE
                WHEN visao_nome='VENCIDO ATÉ 30 DIAS' THEN 1
                WHEN visao_nome='VENCIDO DE 31 A 60 DIAS' THEN 2
                WHEN visao_nome='VENCIDO DE 61 A 90 DIAS' THEN 3
                WHEN visao_nome='VENCIDO DE 91 A 180 DIAS' THEN 4
                WHEN visao_nome='VENCIDO ACIMA DE 180 DIAS' THEN 5
                WHEN visao_nome='A VENCER ATÉ 30 DIAS' THEN 6
                WHEN visao_nome='A VENCER DE 31 A 60 DIAS' THEN 7
                WHEN visao_nome='A VENCER DE 61 A 90 DIAS' THEN 8
                WHEN visao_nome='A VENCER ACIMA DE 90 DIAS' THEN 9
                ELSE 99
              END
            ELSE 0
          END,
          total DESC
        LIMIT 30
      )
      SELECT
        (SELECT row_to_json(r) FROM resumo r) AS resumo,
        COALESCE((SELECT json_agg(x ORDER BY x.total DESC) FROM empresas x),'[]'::json) AS empresas,
        COALESCE((
          SELECT json_agg(
            x ORDER BY
              CASE WHEN '${visaoFinal}'='vencimento' THEN x.ordem ELSE 0 END,
              x.total DESC
          )
          FROM visao x
        ),'[]'::json) AS visao
    `;

    const dashRes=await querySafe(sqlDashboard,params,30000);
    const row=dashRes.rows?.[0]||{};
    const rr=row.resumo||{};
    const total=Number(rr.total||0);

    const labelSituacaoSelecionada = ({
      ABERTO:"Em aberto",
      BAIXADO:"Baixado / realizado",
      ATRASADO:"Atrasado",
      EMISSAO:"Emissão",
      COMBINADO:"Combinado",
      COMPETENCIA:"Competência",
      ACEITE:"Aceite",
      SEM_ACEITE:"Sem aceite",
      COMPETENCIA_EMISSAO:"Competência / emissão",
      PREVISAO:"Previsão",
      PENDENCIA:"Pendência",
      SCPC:"SCPC",
      CARTORIO:"Cartório",
      COBRADORA:"Cobradora",
      CANCELADO:"Cancelado",
      SUBSTITUIDO:"Substituído",
      CUSTODIA:"Custódia",
      TODOS:"Todos"
    })[situacaoPrincipal] || situacaoPrincipal;

    const porSituacaoRapida =
      situacaoPrincipal === "TODOS"
        ? await consultarResumoTodasSituacoesFinanceirasSeta({
            lado,
            dataIni,
            dataFim,
            empresa:filtroEmpresa,
            empresas:empList,
            fornecedor,
            plano,
            cliente,
            formaPagamento,
            incluirTransferencias:deveIncluirTransferencias
          })
        : [{
            nome:labelSituacaoSelecionada,
            codigo:situacaoPrincipal,
            qtd:Number(rr.qtd_titulos || 0),
            total:Number(rr.total || 0),
            percentual:100
          }];

    const mapLista=(rows)=>{
      const lista=rows||[];
      const denom=lista.reduce((s,x)=>s+Number(x.total||0),0);
      return lista.map(x=>({
        nome:x.nome||"-",
        qtd:Number(x.qtd||0),
        total:Number(x.total||0),
        percentual:denom>0?(Number(x.total||0)/denom)*100:0
      }));
    };

    let detalheRows = [];

    // ------------------------------------------------------
    // DETALHE SOMENTE AO CLICAR "CARREGAR TABELA"
    // ------------------------------------------------------
    if (String(detalhes) === "1") {
      const pessoaExpr = `
        COALESCE(
          NULLIF(TRIM(p.nome::text),''),
          NULLIF(TRIM(p.apelido::text),''),
          NULLIF(TRIM(ft.pessoa::text),''),
          'SEM PESSOA'
        )
      `;

      const contaExpr = `
        COALESCE(
          NULLIF(TRIM(fc.descricao::text),''),
          NULLIF(TRIM(ft.conta::text),''),
          'SEM CONTA/BANCO'
        )
      `;

      const planoExpr = `
        COALESCE(
          NULLIF(TRIM(fi.descricao::text),''),
          NULLIF(TRIM(ft.item::text),''),
          'SEM PLANO'
        )
      `;

      // Repete os filtros principais para o detalhe.
      const paramsDetalhe = [];
      const whereDetalhe = [
        lado === "receber"
          ? `TRIM(COALESCE(ft.rp::text,'')) = 'R'`
          : `TRIM(COALESCE(ft.rp::text,'')) IN ('P','S')`
      ];

      const filtroSituacaoDetalhe = await montarFiltroSituacaoFinanceiraSeta({
        alias:"ft",
        situacao:situacaoPrincipal,
        dataIni,
        dataFim,
        params:paramsDetalhe
      });

      whereDetalhe.push(...filtroSituacaoDetalhe.filtros);

      if(lado === "pagar" && !deveIncluirTransferencias){
        whereDetalhe.push(`
          LPAD(
            REGEXP_REPLACE(TRIM(COALESCE(ft.item::text,'')),'\\D','','g'),
            3,
            '0'
          ) <> '012'
        `);
      }

      if (dataIni) {
        paramsDetalhe.push(dataIni);
        whereDetalhe.push(`ft.vencimento::date >= $${paramsDetalhe.length}::date`);
      }
      if (dataFim) {
        paramsDetalhe.push(dataFim);
        whereDetalhe.push(`ft.vencimento::date <= $${paramsDetalhe.length}::date`);
      }

      if (empList.length) {
        const start = paramsDetalhe.length + 1;
        empList.forEach(e => paramsDetalhe.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        whereDetalhe.push(`
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') IN (${ph})
        `);
      }

      if (filtroEmpresa) {
        paramsDetalhe.push(String(filtroEmpresa).trim());
        whereDetalhe.push(`
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') = $${paramsDetalhe.length}
        `);
      }

      if (filtroStatus === "vencido") {
        whereDetalhe.push(`ft.vencimento::date < CURRENT_DATE`);
      } else if (filtroStatus === "avencer") {
        whereDetalhe.push(`ft.vencimento::date >= CURRENT_DATE`);
      }

      if (filtroItem) {
        paramsDetalhe.push(String(filtroItem).trim());

        if (visaoFinal === "forma") {
          whereDetalhe.push(`
            CASE
              WHEN TRIM(COALESCE(ft.tipo::text,''))='0' THEN 'PIX'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='1' THEN 'A VISTA'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='2' THEN 'CARTAO'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='3' THEN 'CHEQUE PRE'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='4' THEN 'CREDIARIO'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='5' THEN 'BOLETOS'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='6' THEN 'DEPOSITO'
              WHEN TRIM(COALESCE(ft.tipo::text,''))='7' THEN 'DEBITO CONTA'
              ELSE 'OUTROS'
            END = $${paramsDetalhe.length}
          `);
        } else if (visaoFinal === "cliente" || visaoFinal === "fornecedor") {
          whereDetalhe.push(`${pessoaExpr} = $${paramsDetalhe.length}`);
        } else if (visaoFinal === "conta") {
          whereDetalhe.push(`${contaExpr} = $${paramsDetalhe.length}`);
        } else if (visaoFinal === "plano") {
          whereDetalhe.push(`${planoExpr} = $${paramsDetalhe.length}`);
        }
      }

      const colunasTitulos = await obterColunasFinanceiroTitulos();

      const colPrev = primeiraColunaExistente(colunasTitulos,[
        "previsao","previsto","previsaopagamento","previsao_pagamento",
        "previsao_pgto","previsaopgto","previsaopg","data_previsao","dataprevisao"
      ]);
      const colPend = primeiraColunaExistente(colunasTitulos,[
        "pendencia","pendente","existependencia","existe_pendencia",
        "possui_pendencia","tem_pendencia"
      ]);
      const colAceite = primeiraColunaExistente(colunasTitulos,[
        "aceite","dataaceite","data_aceite"
      ]);
      const colScpc = primeiraColunaExistente(colunasTitulos,[
        "scpc","registradoscpc","registrado_scpc","enviado_scpc"
      ]);
      const colCartorio = primeiraColunaExistente(colunasTitulos,[
        "cartorio","emcartorio","enviadocartorio","enviado_cartorio",
        "pagoemcartorio","pago_cartorio","data_cartorio","datacartorio"
      ]);
      const colCobradora = primeiraColunaExistente(colunasTitulos,[
        "cobradora","enviadocobradora","enviado_cobradora"
      ]);
      const colCustodia = primeiraColunaExistente(colunasTitulos,[
        "custodia","chequecustodia","cheque_custodia"
      ]);
      const colSubstituido = primeiraColunaExistente(colunasTitulos,[
        "substituido","reparcelado","titulo_substituido"
      ]);
      const colCompetencia = primeiraColunaExistente(colunasTitulos,[
        "competencia","datacompetencia","data_competencia"
      ]);
      const colCombinado = primeiraColunaExistente(colunasTitulos,[
        "combinado","datacombinado","data_combinado","combinada","data_combinada"
      ]);
      const colEmissao = primeiraColunaExistente(colunasTitulos,[
        "emissao","dataemissao","data_emissao","lancamento"
      ]);

      const flagSql = coluna => coluna
        ? `CASE WHEN ${exprFlagTitulo("ft",coluna)} THEN TRUE ELSE FALSE END`
        : `FALSE`;

      const existeSql = coluna => coluna
        ? `CASE WHEN NULLIF(TRIM(COALESCE(ft.${coluna}::text,'')),'') IS NOT NULL THEN TRUE ELSE FALSE END`
        : `FALSE`;

      const sqlDetalhes = `
        SELECT
          ft.vencimento::date AS data,
          TRIM(COALESCE(ft.status::text,'')) AS status_financeiro,
          ${flagSql(colPrev)} AS sit_previsao,
          ${flagSql(colPend)} AS sit_pendencia,
          ${existeSql(colAceite)} AS sit_aceite,
          ${flagSql(colScpc)} AS sit_scpc,
          ${flagSql(colCartorio)} AS sit_cartorio,
          ${flagSql(colCobradora)} AS sit_cobradora,
          ${flagSql(colCustodia)} AS sit_custodia,
          ${flagSql(colSubstituido)} AS sit_substituido,
          ${existeSql(colCompetencia)} AS sit_competencia,
          ${existeSql(colCombinado)} AS sit_combinado,
          ${existeSql(colEmissao)} AS sit_emissao,
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          ${pessoaExpr} AS pessoa,
          COALESCE(ft.documento::text,ft.codigo::text,'-') AS documento,
          ${
            lado === "pagar"
              ? planoExpr
              : `COALESCE(
                   NULLIF(TRIM(ft.descricao::text),''),
                   NULLIF(TRIM(ft.complemento::text),''),
                   '-'
                 )`
          } AS descricao,
          ${contaExpr} AS conta_banco,
          ${planoExpr} AS plano_conta,
          CASE
            WHEN TRIM(COALESCE(ft.tipo::text,''))='0' THEN 'PIX'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='1' THEN 'A VISTA'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='2' THEN 'CARTAO'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='3' THEN 'CHEQUE PRE'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='4' THEN 'CREDIARIO'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='5' THEN 'BOLETOS'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='6' THEN 'DEPOSITO'
            WHEN TRIM(COALESCE(ft.tipo::text,''))='7' THEN 'DEBITO CONTA'
            ELSE 'OUTROS'
          END AS forma,
          CASE
            WHEN ft.vencimento::date < CURRENT_DATE
                 AND ft.vencimento::date >= CURRENT_DATE - 30
              THEN 'VENCIDO ATÉ 30 DIAS'
            WHEN ft.vencimento::date < CURRENT_DATE - 30
                 AND ft.vencimento::date >= CURRENT_DATE - 60
              THEN 'VENCIDO DE 31 A 60 DIAS'
            WHEN ft.vencimento::date < CURRENT_DATE - 60
                 AND ft.vencimento::date >= CURRENT_DATE - 90
              THEN 'VENCIDO DE 61 A 90 DIAS'
            WHEN ft.vencimento::date < CURRENT_DATE - 90
                 AND ft.vencimento::date >= CURRENT_DATE - 180
              THEN 'VENCIDO DE 91 A 180 DIAS'
            WHEN ft.vencimento::date < CURRENT_DATE - 180
              THEN 'VENCIDO ACIMA DE 180 DIAS'
            WHEN ft.vencimento::date >= CURRENT_DATE
                 AND ft.vencimento::date <= CURRENT_DATE + 30
              THEN 'A VENCER ATÉ 30 DIAS'
            WHEN ft.vencimento::date <= CURRENT_DATE + 60
              THEN 'A VENCER DE 31 A 60 DIAS'
            WHEN ft.vencimento::date <= CURRENT_DATE + 90
              THEN 'A VENCER DE 61 A 90 DIAS'
            ELSE 'A VENCER ACIMA DE 90 DIAS'
          END AS faixa_vencimento,
          CASE
            WHEN ft.vencimento::date < CURRENT_DATE THEN 'VENCIDO'
            ELSE 'A VENCER'
          END AS situacao,
          ${saldoExpr}::numeric AS valor_aberto
        FROM financeiro_titulos ft
        LEFT JOIN pessoas p
          ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
        LEFT JOIN financeiro_itens fi
          ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
        LEFT JOIN financeiro_contas fc
          ON TRIM(COALESCE(fc.codigo::text,'')) = TRIM(COALESCE(ft.conta::text,''))
        WHERE ${whereDetalhe.join(" AND ")}
        ORDER BY ft.vencimento::date, empresa, pessoa
        LIMIT 50000
      `;

      const rd = await querySafe(sqlDetalhes, paramsDetalhe, 120000);

      detalheRows = (rd.rows || []).map(x => ({
        data: x.data,
        empresa: x.empresa,
        pessoa: x.pessoa,
        documento: x.documento,
        descricao: x.descricao,
        contaBanco: x.conta_banco,
        planoConta: x.plano_conta,
        forma: x.forma,
        faixaVencimento: x.faixa_vencimento,
        situacao: x.situacao,
        statusFinanceiro: String(x.status_financeiro || ""),
        situacaoCodigo:
          String(x.status_financeiro || "").toUpperCase() === "A"
            ? "ABERTO"
            : String(x.status_financeiro || "").toUpperCase() === "B"
              ? "BAIXADO"
              : String(x.status_financeiro || ""),
        situacoes: [
          String(x.status_financeiro || "").toUpperCase() === "A" ? "ABERTO" : "",
          String(x.status_financeiro || "").toUpperCase() === "B" ? "BAIXADO" : "",
          String(x.status_financeiro || "").toUpperCase() === "C" ? "CANCELADO" : "",
          x.situacao === "VENCIDO" ? "ATRASADO" : "",
          x.sit_previsao ? "PREVISAO" : "",
          x.sit_pendencia ? "PENDENCIA" : "",
          x.sit_aceite ? "ACEITE" : "",
          x.sit_scpc ? "SCPC" : "",
          x.sit_cartorio ? "CARTORIO" : "",
          x.sit_cobradora ? "COBRADORA" : "",
          x.sit_custodia ? "CUSTODIA" : "",
          x.sit_substituido ? "SUBSTITUIDO" : "",
          x.sit_competencia ? "COMPETENCIA" : "",
          x.sit_combinado ? "COMBINADO" : "",
          x.sit_emissao ? "EMISSAO" : ""
        ].filter(Boolean),
        valorAberto: Number(x.valor_aberto || 0)
      }));
    }

    return res.json({
      ok: true,
      tipo: lado,
      visao: visaoFinal,
      resumo: {
        total,
        vencido: Number(rr.vencido || 0),
        aVencer: Number(rr.a_vencer || 0),
        qtdTitulos: Number(rr.qtd_titulos || 0),
        qtdPessoas: Number(rr.qtd_pessoas || 0)
      },
      porEmpresa: mapLista(row.empresas),
      porVisao: mapLista(row.visao),
      porSituacao: porSituacaoRapida,
      detalhes: detalheRows
    });

  } catch (err) {
    console.error("Erro /api/financeiro/quadro-demonstrativo:", err);
    return res.status(500).json({
      ok: false,
      erro: err.message
    });
  }
});

// ======================================================
// ATENDIMENTO NOVO - ERP CALÇADOS + BANCO ATENDIMENTO
// ======================================================
app.post("/api/atendimento/login", express.json(), async (req, res) => {
  try {
    const senhaDigitada = String(req.body.senha || "").trim();
    const apelidoDigitado = String(req.body.apelido || "").trim();

    if (!senhaDigitada || !apelidoDigitado) {
      return res.status(400).json({
        ok:false,
        erro:"Informe apelido/código e senha."
      });
    }

    const senhaCodificada = codificarSenhaSeta(senhaDigitada);
    const apelidoLike = `%${apelidoDigitado}%`;
    const codigoDigitado = apelidoDigitado.replace(/\D/g, "").padStart(7, "0");

    const r = await querySafe(`
      SELECT
        TRIM(p.codigo::text) AS gerente_codigo,
        TRIM(COALESCE(NULLIF(p.apelido::text,''), NULLIF(p.nome::text,''), p.codigo::text)) AS gerente_nome,
        LPAD(RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),2,'0') AS empresa,
        UPPER(TRIM(COALESCE(fg.descricao::text,''))) AS grupo_nome
      FROM pessoas p
      LEFT JOIN funcionarios_grupos fg
        ON TRIM(fg.codigo::text) = TRIM(p.grupo::text)
      WHERE COALESCE(p.funcionario,false) = TRUE
        AND (
          TRIM(COALESCE(p.senha::text,'')) = $1
          OR TRIM(COALESCE(p.senha::text,'')) = $2
        )
        AND (
          UPPER(TRIM(COALESCE(p.apelido::text,''))) ILIKE UPPER($3)
          OR UPPER(TRIM(COALESCE(p.nome::text,''))) ILIKE UPPER($3)
          OR TRIM(p.codigo::text) = $4
        )
        AND UPPER(TRIM(COALESCE(fg.descricao::text,''))) IN (
          'ADMINISTRADOR',
          'SUPERVISOR',
          'GERENTE 1',
          'GERENTE 2',
          'GERENTE 3'
        )
      ORDER BY p.codigo
      LIMIT 1
    `, [senhaDigitada, senhaCodificada, apelidoLike, codigoDigitado], 30000);

    if (!r.rows.length) {
      return res.status(403).json({
        ok:false,
        erro:"Login não autorizado. Confira apelido/código, senha e grupo do funcionário."
      });
    }

    const gerente = r.rows[0];

    const vendedores = await querySafe(`
      SELECT
        TRIM(p.codigo::text) AS codigo,
        TRIM(COALESCE(NULLIF(p.apelido::text,''), NULLIF(p.nome::text,''), p.codigo::text)) AS nome,
        LPAD(RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),2,'0') AS empresa
      FROM pessoas p
      WHERE COALESCE(p.funcionario,false) = TRUE
        AND COALESCE(p.podevender,false) = TRUE
        AND LPAD(RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),2,'0') = $1
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%GERENTE%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%ADMIN%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%SUPERVISOR%'
      ORDER BY nome
    `, [gerente.empresa], 30000);

    res.json({
      ok:true,
      gerente,
      vendedores: vendedores.rows || []
    });

  } catch (err) {
    console.error("Erro /api/atendimento/login:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});


// ======================================================
// ATENDIMENTO - SESSÃO JÁ AUTENTICADA
// ======================================================
async function obterGerenteResponsavelDaSessao(req) {
  const usuario = req.usuarioSeta || {};

  const codigoSessao = String(
    usuario.codigo ||
    usuario.usuario_codigo ||
    usuario.id ||
    ""
  ).trim();

  const apelidoSessao = String(
    usuario.apelido ||
    usuario.nome ||
    usuario.usuario ||
    ""
  ).trim();

  if (!codigoSessao && !apelidoSessao) {
    const erro = new Error("Sessão do usuário não encontrada.");
    erro.status = 401;
    throw erro;
  }

  const codigoNormalizado = codigoSessao
    ? codigoSessao.replace(/\D/g,"").padStart(7,"0")
    : "";

  const r = await querySafe(`
    SELECT
      TRIM(p.codigo::text) AS gerente_codigo,
      TRIM(
        COALESCE(
          NULLIF(p.apelido::text,''),
          NULLIF(p.nome::text,''),
          p.codigo::text
        )
      ) AS gerente_nome,
      LPAD(
        RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),
        2,
        '0'
      ) AS empresa,
      LPAD(TRIM(COALESCE(p.grupo::text,'')),2,'0') AS grupo,
      UPPER(TRIM(COALESCE(fg.descricao::text,''))) AS grupo_nome
    FROM pessoas p
    LEFT JOIN funcionarios_grupos fg
      ON TRIM(fg.codigo::text) = TRIM(p.grupo::text)
    WHERE COALESCE(p.funcionario,false) = TRUE
      AND (
        ($1 <> '' AND TRIM(p.codigo::text) = $1)
        OR
        ($2 <> '' AND (
          UPPER(TRIM(COALESCE(p.apelido::text,''))) = UPPER($2)
          OR UPPER(TRIM(COALESCE(p.nome::text,''))) = UPPER($2)
        ))
      )
    ORDER BY
      CASE WHEN TRIM(p.codigo::text) = $1 THEN 0 ELSE 1 END,
      p.codigo
    LIMIT 1
  `, [codigoNormalizado, apelidoSessao], 30000);

  if (!r.rows.length) {
    const erro = new Error("Usuário da sessão não foi localizado no cadastro de funcionários.");
    erro.status = 403;
    throw erro;
  }

  const gerente = r.rows[0];

  /*
   * Regra operacional absoluta:
   * somente grupo cujo nome começa com GERENTE.
   * Administrador e supervisor devem usar Atendimento Gerencial.
   */
  if (!/^GERENTE(?:\s|$)/i.test(String(gerente.grupo_nome || ""))) {
    const erro = new Error(
      "A Central de Atendimento da loja é exclusiva do gerente responsável. Use o Atendimento Gerencial para acompanhamento."
    );
    erro.status = 403;
    throw erro;
  }

  if (!gerente.empresa || gerente.empresa === "00") {
    const erro = new Error(
      "O gerente não possui uma loja válida vinculada no cadastro do Seta."
    );
    erro.status = 403;
    throw erro;
  }

  return gerente;
}


// ======================================================
// ATENDIMENTO - CENTRAL EXCLUSIVA POR LOJA
// ======================================================
// Regras:
// - somente 1 Central operacional ativa por loja;
// - heartbeat automático a cada 30 segundos;
// - tolerância de 2 minutos sem heartbeat antes de liberar para OUTRO gerente;
// - F5/reabertura na MESMA ABA retoma automaticamente a Central;
// - fila e atendimentos NÃO são apagados quando a trava expira;
// - o botão Encerrar Central libera imediatamente a loja.
const ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS = 120;
let atendimentoCentralSchemaPronto = false;

async function garantirSchemaCentralAtendimento() {
  if (atendimentoCentralSchemaPronto) return;

  await queryAtendimento(`
    CREATE TABLE IF NOT EXISTS jpdesk.atendimento_centrais_ativas (
      empresa             VARCHAR(2) PRIMARY KEY,
      gerente_codigo      VARCHAR(40) NOT NULL,
      gerente_nome        VARCHAR(160) NOT NULL,
      token               VARCHAR(120) NOT NULL,
      iniciado_em         TIMESTAMP NOT NULL DEFAULT NOW(),
      ultimo_sinal_em     TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `, [], 30000);

  await queryAtendimento(`
    CREATE INDEX IF NOT EXISTS idx_atendimento_centrais_ultimo_sinal
    ON jpdesk.atendimento_centrais_ativas(ultimo_sinal_em)
  `, [], 30000);

  atendimentoCentralSchemaPronto = true;
}

function tokenCentralDaRequisicao(req) {
  return String(
    req.headers["x-atendimento-central-token"] ||
    req.body?.central_token ||
    ""
  ).trim();
}

async function adquirirCentralAtendimento(gerente, tokenExistente="") {
  await garantirSchemaCentralAtendimento();

  const client = await poolAtendimento.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      SELECT pg_advisory_xact_lock(
        hashtext('JP-ATENDIMENTO-CENTRAL-' || $1)
      )
    `, [gerente.empresa]);

    const atual = await client.query(`
      SELECT
        empresa,
        gerente_codigo,
        gerente_nome,
        token,
        iniciado_em,
        ultimo_sinal_em,
        (
          ultimo_sinal_em >
          NOW() - ($2::int * INTERVAL '1 second')
        ) AS ativa
      FROM jpdesk.atendimento_centrais_ativas
      WHERE empresa=$1
      LIMIT 1
    `, [gerente.empresa, ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS]);

    if (atual.rows.length) {
      const sessao = atual.rows[0];
      const ativa = Boolean(sessao.ativa);

      const mesmoToken =
        tokenExistente &&
        String(sessao.token) === String(tokenExistente) &&
        String(sessao.gerente_codigo) === String(gerente.gerente_codigo);

      // Mesmo gerente + mesma aba/token: F5 ou retomada normal.
      if (ativa && mesmoToken) {
        const renovada = await client.query(`
          UPDATE jpdesk.atendimento_centrais_ativas
          SET ultimo_sinal_em=NOW(),
              gerente_nome=$3
          WHERE empresa=$1
            AND token=$2
          RETURNING *
        `, [
          gerente.empresa,
          tokenExistente,
          gerente.gerente_nome
        ]);

        await client.query("COMMIT");

        return {
          ok:true,
          central:renovada.rows[0],
          retomada:true
        };
      }

      /*
       * MESMO GERENTE DA MESMA LOJA:
       * se a janela fechou inesperadamente, ele pode reassumir
       * imediatamente sem esperar os 2 minutos.
       *
       * É gerado um novo token e a janela antiga perde o controle.
       */
      if (
        ativa &&
        String(sessao.gerente_codigo) === String(gerente.gerente_codigo)
      ) {
        const novoTokenMesmoGerente = crypto.randomUUID();

        const reassumida = await client.query(`
          UPDATE jpdesk.atendimento_centrais_ativas
          SET token=$2,
              gerente_nome=$3,
              ultimo_sinal_em=NOW()
          WHERE empresa=$1
          RETURNING *
        `, [
          gerente.empresa,
          novoTokenMesmoGerente,
          gerente.gerente_nome
        ]);

        await client.query("COMMIT");

        return {
          ok:true,
          central:reassumida.rows[0],
          retomada:true,
          reassumida:true
        };
      }

      // Outro gerente ainda dentro da tolerância: bloqueia.
      if (ativa) {
        await client.query("COMMIT");

        return {
          ok:false,
          ocupada:true,
          central:{
            empresa:sessao.empresa,
            gerente_codigo:sessao.gerente_codigo,
            gerente_nome:sessao.gerente_nome,
            iniciado_em:sessao.iniciado_em,
            ultimo_sinal_em:sessao.ultimo_sinal_em
          }
        };
      }
    }

    // Trava inexistente ou expirada há mais de 2 min: nova sessão assume.
    const novoToken = crypto.randomUUID();

    const aberta = await client.query(`
      INSERT INTO jpdesk.atendimento_centrais_ativas
        (empresa, gerente_codigo, gerente_nome, token, iniciado_em, ultimo_sinal_em)
      VALUES ($1,$2,$3,$4,NOW(),NOW())
      ON CONFLICT (empresa) DO UPDATE SET
        gerente_codigo=EXCLUDED.gerente_codigo,
        gerente_nome=EXCLUDED.gerente_nome,
        token=EXCLUDED.token,
        iniciado_em=NOW(),
        ultimo_sinal_em=NOW()
      RETURNING *
    `, [
      gerente.empresa,
      gerente.gerente_codigo,
      gerente.gerente_nome,
      novoToken
    ]);

    await client.query("COMMIT");

    return {
      ok:true,
      central:aberta.rows[0],
      retomada:false
    };

  } catch (erro) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw erro;
  } finally {
    client.release();
  }
}

async function validarCentralAtendimento(req) {
  await garantirSchemaCentralAtendimento();

  const gerente =
    req.gerenteAtendimento ||
    await obterGerenteResponsavelDaSessao(req);

  const token = tokenCentralDaRequisicao(req);

  if (!token) {
    const erro = new Error(
      "Esta janela não está vinculada à Central de Atendimento. Abra novamente pelo JPDESK."
    );
    erro.status = 409;
    erro.codigo = "CENTRAL_SEM_TOKEN";
    throw erro;
  }

  const r = await queryAtendimento(`
    SELECT
      empresa,
      gerente_codigo,
      gerente_nome,
      token,
      iniciado_em,
      ultimo_sinal_em,
      (
        ultimo_sinal_em >
        NOW() - ($4::int * INTERVAL '1 second')
      ) AS ativa
    FROM jpdesk.atendimento_centrais_ativas
    WHERE empresa=$1
      AND token=$2
      AND gerente_codigo=$3
    LIMIT 1
  `, [
    gerente.empresa,
    token,
    gerente.gerente_codigo,
    ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS
  ], 30000);

  if (!r.rows.length || !Boolean(r.rows[0].ativa)) {
    const erro = new Error(
      "Esta janela perdeu o controle da Central de Atendimento. Volte ao JPDESK e abra novamente."
    );
    erro.status = 409;
    erro.codigo = "CENTRAL_PERDEU_CONTROLE";
    throw erro;
  }

  req.centralAtendimento = r.rows[0];
  return r.rows[0];
}


/*
 * Proteção adicional das APIs operacionais.
 * Mesmo que alguém altere manualmente empresa no navegador,
 * o servidor força a empresa cadastrada no usuário gerente.
 *
 * APIs gerenciais ficam fora desta regra porque precisam enxergar
 * várias lojas conforme a permissão do Atendimento Gerencial.
 */
app.use("/api/atendimento", async (req, res, next) => {
  try {
    const caminho = String(req.originalUrl || req.url || "").split("?")[0];

    const gerenciais = [
      /^\/api\/atendimento\/dashboard(?:\/|$)/i,
      /^\/api\/atendimento\/dashboard-lojas(?:\/|$)/i,
      /^\/api\/atendimento\/relatorio-gerencial(?:\/|$)/i,
      /^\/api\/atendimento\/reset-dia(?:\/|$)/i,
      /^\/api\/atendimento\/diagnostico-fila(?:\/|$)/i
    ];

    const perguntasAlteracao =
      /^\/api\/atendimento\/perguntas(?:\/|$)/i.test(caminho) &&
      String(req.method || "GET").toUpperCase() !== "GET";

    const loginAntigo =
      /^\/api\/atendimento\/login(?:\/|$)/i.test(caminho);

    if (
      gerenciais.some(rx => rx.test(caminho)) ||
      perguntasAlteracao ||
      loginAntigo
    ) {
      return next();
    }

    const gerente = await obterGerenteResponsavelDaSessao(req);

    req.gerenteAtendimento = gerente;

    // A loja operacional vem SEMPRE do cadastro do gerente.
    if (req.query && Object.prototype.hasOwnProperty.call(req.query,"empresa")) {
      req.query.empresa = gerente.empresa;
    }

    if (req.body && typeof req.body === "object") {
      req.body.empresa = gerente.empresa;
    }

    // /sessao é a rota que pode adquirir ou retomar a trava.
    const rotaSessao =
      /^\/api\/atendimento\/sessao(?:\/|$)/i.test(caminho);

    if (!rotaSessao) {
      await validarCentralAtendimento(req);
    }

    return next();

  } catch (erro) {
    return res.status(Number(erro.status || 403)).json({
      ok:false,
      erro:erro.message
    });
  }
});

app.get("/api/atendimento/sessao", async (req, res) => {
  try {
    const gerente =
      req.gerenteAtendimento ||
      await obterGerenteResponsavelDaSessao(req);

    const tokenExistente = tokenCentralDaRequisicao(req);

    const trava = await adquirirCentralAtendimento(
      gerente,
      tokenExistente
    );

    if (!trava.ok && trava.ocupada) {
      return res.status(409).json({
        ok:false,
        codigo:"CENTRAL_OCUPADA",
        erro:
          `A Central da Loja ${gerente.empresa} já está sendo operada por ` +
          `${trava.central.gerente_nome}.`,
        central:trava.central,
        expira_segundos:ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS
      });
    }

    const vendedores = await querySafe(`
      SELECT
        TRIM(p.codigo::text) AS codigo,
        TRIM(
          COALESCE(
            NULLIF(p.apelido::text,''),
            NULLIF(p.nome::text,''),
            p.codigo::text
          )
        ) AS nome,
        LPAD(
          RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),
          2,
          '0'
        ) AS empresa,
        CASE
          WHEN img.imagem IS NULL THEN ''
          WHEN octet_length(img.imagem) >= 4
           AND get_byte(img.imagem, 0) = 137
           AND get_byte(img.imagem, 1) = 80
           AND get_byte(img.imagem, 2) = 78
           AND get_byte(img.imagem, 3) = 71
            THEN 'data:image/png;base64,' || encode(img.imagem, 'base64')
          ELSE 'data:image/jpeg;base64,' || encode(img.imagem, 'base64')
        END AS foto
      FROM pessoas p
      LEFT JOIN LATERAL (
        SELECT ip.imagem
        FROM imagens_pessoas ip
        WHERE REGEXP_REPLACE(TRIM(ip.codigo::text), '^[A-Za-z]+', '') =
              REGEXP_REPLACE(TRIM(p.codigo::text), '^[A-Za-z]+', '')
          AND ip.imagem IS NOT NULL
        ORDER BY ip.datahora DESC NULLS LAST
        LIMIT 1
      ) img ON TRUE
      WHERE COALESCE(p.funcionario,false) = TRUE
        AND COALESCE(p.podevender,false) = TRUE
        AND LPAD(
          RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),
          2,
          '0'
        ) = $1
        AND TRIM(p.codigo::text) <> $2
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%GERENTE%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%ADMIN%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%SUPERVISOR%'
      ORDER BY nome
    `, [gerente.empresa, gerente.gerente_codigo], 30000);

    return res.json({
      ok:true,
      gerente,
      vendedores:vendedores.rows || [],
      central:{
        token:trava.central.token,
        empresa:trava.central.empresa,
        gerente_codigo:trava.central.gerente_codigo,
        gerente_nome:trava.central.gerente_nome,
        iniciado_em:trava.central.iniciado_em,
        ultimo_sinal_em:trava.central.ultimo_sinal_em,
        retomada:Boolean(trava.retomada),
        tolerancia_segundos:ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS
      }
    });

  } catch (err) {
    console.error("Erro /api/atendimento/sessao:", err);

    return res.status(Number(err.status || 500)).json({
      ok:false,
      codigo:err.codigo || "",
      erro:err.message
    });
  }
});

app.post("/api/atendimento/central/heartbeat", express.json(), async (req, res) => {
  try {
    const gerente = req.gerenteAtendimento;
    const token = tokenCentralDaRequisicao(req);

    const r = await queryAtendimento(`
      UPDATE jpdesk.atendimento_centrais_ativas
      SET ultimo_sinal_em=NOW(),
          gerente_nome=$3
      WHERE empresa=$1
        AND token=$2
        AND gerente_codigo=$4
      RETURNING
        empresa,
        gerente_codigo,
        gerente_nome,
        iniciado_em,
        ultimo_sinal_em
    `, [
      gerente.empresa,
      token,
      gerente.gerente_nome,
      gerente.gerente_codigo
    ], 30000);

    if (!r.rows.length) {
      return res.status(409).json({
        ok:false,
        codigo:"CENTRAL_PERDEU_CONTROLE",
        erro:"Esta janela não controla mais a Central desta loja."
      });
    }

    return res.json({
      ok:true,
      central:r.rows[0]
    });

  } catch (err) {
    return res.status(Number(err.status || 500)).json({
      ok:false,
      codigo:err.codigo || "",
      erro:err.message
    });
  }
});

app.post("/api/atendimento/central/encerrar", express.json(), async (req, res) => {
  try {
    const gerente = req.gerenteAtendimento;
    const token = tokenCentralDaRequisicao(req);

    const r = await queryAtendimento(`
      DELETE FROM jpdesk.atendimento_centrais_ativas
      WHERE empresa=$1
        AND token=$2
        AND gerente_codigo=$3
      RETURNING empresa
    `, [
      gerente.empresa,
      token,
      gerente.gerente_codigo
    ], 30000);

    return res.json({
      ok:true,
      liberada:Boolean(r.rows.length)
    });

  } catch (err) {
    return res.status(Number(err.status || 500)).json({
      ok:false,
      codigo:err.codigo || "",
      erro:err.message
    });
  }
});


// ======================================================
// MOTIVOS / RESULTADOS - ADMINISTRAÇÃO GERENCIAL
// ======================================================
app.get("/api/atendimento-gerencial/perguntas", async (req, res) => {
  try {
    const r = await queryAtendimento(`
      SELECT *
      FROM atendimento_perguntas
      WHERE ativo = true
      ORDER BY ordem, id
    `, [], 30000);

    res.json({ ok:true, perguntas:r.rows || [] });
  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.post("/api/atendimento-gerencial/perguntas", express.json(), async (req, res) => {
  try {
    const pergunta = String(req.body.pergunta || "").trim();
    const tipo = String(req.body.tipo_resposta || "BOTAO_UNICO").trim().toUpperCase();
    const opcoes = String(req.body.opcoes || "").trim();
    const ordem = Number(req.body.ordem || 0);

    const tiposPermitidos = new Set([
      "BOTAO_UNICO",
      "BOTAO_LISTA",
      "TEXTO_LIVRE"
    ]);

    if (!pergunta) {
      return res.status(400).json({ ok:false, erro:"Informe a pergunta." });
    }

    if (!tiposPermitidos.has(tipo)) {
      return res.status(400).json({ ok:false, erro:"Tipo de botão inválido." });
    }

    if (tipo === "BOTAO_LISTA" && !opcoes) {
      return res.status(400).json({ ok:false, erro:"Informe ao menos uma opção para este botão." });
    }

    const r = await queryAtendimento(`
      INSERT INTO atendimento_perguntas
        (pergunta, tipo_resposta, opcoes, obrigatoria, ordem)
      VALUES ($1,$2,$3,true,$4)
      RETURNING *
    `, [pergunta, tipo, opcoes, ordem], 30000);

    res.json({ ok:true, pergunta:r.rows[0] });
  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.delete("/api/atendimento-gerencial/perguntas/:id", async (req, res) => {
  try {
    await queryAtendimento(`
      UPDATE atendimento_perguntas
      SET ativo = false, atualizado_em = NOW()
      WHERE id = $1
    `, [Number(req.params.id)], 30000);

    res.json({ ok:true });
  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.get("/api/atendimento/perguntas", async (req, res) => {
  try {
    const r = await queryAtendimento(`
      SELECT *
      FROM atendimento_perguntas
      WHERE ativo = true
      ORDER BY ordem, id
    `, [], 30000);

    res.json({ ok:true, perguntas:r.rows || [] });
  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.post("/api/atendimento/perguntas", express.json(), async (req, res) => {
  try {
    const pergunta = String(req.body.pergunta || "").trim();
    const tipo = String(req.body.tipo_resposta || "SIM_NAO").trim();
    const opcoes = String(req.body.opcoes || "").trim();
    const ordem = Number(req.body.ordem || 0);

    if (!pergunta) {
      return res.status(400).json({ ok:false, erro:"Informe a pergunta." });
    }

    const r = await queryAtendimento(`
      INSERT INTO atendimento_perguntas
        (pergunta, tipo_resposta, opcoes, obrigatoria, ordem)
      VALUES ($1,$2,$3,true,$4)
      RETURNING *
    `, [pergunta, tipo, opcoes, ordem], 30000);

    res.json({ ok:true, pergunta:r.rows[0] });
  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.delete("/api/atendimento/perguntas/:id", async (req, res) => {
  try {
    await queryAtendimento(`
      UPDATE atendimento_perguntas
      SET ativo = false, atualizado_em = NOW()
      WHERE id = $1
    `, [Number(req.params.id)], 30000);

    res.json({ ok:true });
  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});

app.get("/api/atendimento/fila", async (req, res) => {
  try {
    const empresa = String(req.query.empresa || "").trim().padStart(2, "0");

    const r = await queryAtendimento(`
      SELECT *
      FROM (
        SELECT
          f.*,
          a.atendimento_id,
          ROW_NUMBER() OVER (
            PARTITION BY f.empresa, f.vendedor_codigo, f.status
            ORDER BY f.ordem, f.entrou_em, f.id
          ) AS rn
        FROM atendimento_fila f
        LEFT JOIN LATERAL (
          SELECT id AS atendimento_id
          FROM atendimento_atendimentos a
          WHERE a.empresa = f.empresa
            AND a.vendedor_codigo = f.vendedor_codigo
            AND a.status = 'EM_ATENDIMENTO'
          ORDER BY a.id DESC
          LIMIT 1
        ) a ON TRUE
        WHERE f.empresa = $1
          AND f.status IN ('ESPERANDO','EM_ATENDIMENTO','POS_ATENDIMENTO')
          AND f.entrou_em::date = CURRENT_DATE
      ) x
      WHERE rn = 1
      ORDER BY ordem, entrou_em, id
    `, [empresa], 30000);

    res.json({ ok:true, fila:r.rows || [] });

  } catch (err) {
    console.error("Erro /api/atendimento/fila:", err);
    res.status(500).json({ ok:false, erro:err.message });
  }
});
app.post("/api/atendimento/entrar-fila", express.json(), async (req, res) => {
  const client = await poolAtendimento.connect();

  try {
    const empresa = String(req.body.empresa || "").trim().padStart(2, "0");
    const vendedorCodigo = String(req.body.vendedor_codigo || "").trim();
    const vendedorNome = String(req.body.vendedor_nome || "").trim();

    if (!empresa || !vendedorCodigo) {
      return res.status(400).json({ ok:false, erro:"Empresa/vendedor inválido." });
    }

    await client.query("BEGIN");

    await client.query(`
      SELECT pg_advisory_xact_lock(
        hashtext($1 || '-' || $2 || '-' || CURRENT_DATE::text)
      )
    `, [empresa, vendedorCodigo]);

    const jaNaFila = await client.query(`
      SELECT id
      FROM atendimento_fila
      WHERE empresa = $1
        AND vendedor_codigo = $2
        AND status IN ('ESPERANDO','EM_ATENDIMENTO','POS_ATENDIMENTO')
        AND entrou_em::date = CURRENT_DATE
      LIMIT 1
    `, [empresa, vendedorCodigo]);

    if (jaNaFila.rows.length) {
      await client.query("COMMIT");
      return res.json({
        ok:true,
        ja_existe:true,
        item:jaNaFila.rows[0]
      });
    }

    const prox = await client.query(`
      SELECT COALESCE(MAX(ordem),0) + 1 AS ordem
      FROM atendimento_fila
      WHERE empresa = $1
        AND status = 'ESPERANDO'
        AND entrou_em::date = CURRENT_DATE
    `, [empresa]);

    const ordem = Number(prox.rows[0]?.ordem || 1);

    const r = await client.query(`
      INSERT INTO atendimento_fila
        (empresa, vendedor_codigo, vendedor_nome, status, ordem, entrou_em)
      VALUES ($1,$2,$3,'ESPERANDO',$4,NOW())
      RETURNING *
    `, [empresa, vendedorCodigo, vendedorNome, ordem]);

    await client.query("COMMIT");

    res.json({ ok:true, item:r.rows[0] });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok:false, erro:err.message });
  } finally {
    client.release();
  }
});

app.post("/api/atendimento/iniciar", express.json(), async (req, res) => {
  const client = await poolAtendimento.connect();

  try {
    const filaId = Number(req.body.fila_id || 0);

    if (!filaId) {
      return res.status(400).json({ ok:false, erro:"Fila inválida." });
    }

    await client.query("BEGIN");

    const fila = await client.query(`
      SELECT *
      FROM atendimento_fila
      WHERE id = $1
        AND status = 'ESPERANDO'
      LIMIT 1
      FOR UPDATE
    `, [filaId]);

    if (!fila.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok:false, erro:"Vendedor não encontrado na fila." });
    }

    const f = fila.rows[0];

    const aberto = await client.query(`
      SELECT id
      FROM atendimento_atendimentos
      WHERE empresa = $1
        AND vendedor_codigo = $2
        AND status = 'EM_ATENDIMENTO'
        AND iniciou_em::date = CURRENT_DATE
      ORDER BY id DESC
      LIMIT 1
    `, [f.empresa, f.vendedor_codigo]);

    let atendimento;

    if (aberto.rows.length) {
      atendimento = { rows: [aberto.rows[0]] };
    } else {
      atendimento = await client.query(`
        INSERT INTO atendimento_atendimentos
          (empresa, vendedor_codigo, vendedor_nome, status, iniciou_em)
        VALUES ($1,$2,$3,'EM_ATENDIMENTO',NOW())
        RETURNING *
      `, [f.empresa, f.vendedor_codigo, f.vendedor_nome]);
    }

    await client.query(`
      UPDATE atendimento_fila
      SET status = 'EM_ATENDIMENTO',
          iniciou_em = COALESCE(iniciou_em, NOW())
      WHERE id = $1
        AND status = 'ESPERANDO'
    `, [filaId]);

    await client.query("COMMIT");

    res.json({ ok:true, atendimento:atendimento.rows[0] });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok:false, erro:err.message });
  } finally {
    client.release();
  }
});

app.post("/api/atendimento/finalizar", express.json(), async (req, res) => {
  const client = await poolAtendimento.connect();

  try {
    const {
      atendimento_id,
      empresa,
      vendedor_codigo,
      vendedor_nome,
      respostas = []
    } = req.body;

    if (!atendimento_id || !empresa || !vendedor_codigo) {
      return res.status(400).json({
        ok:false,
        erro:"Atendimento, empresa e vendedor são obrigatórios."
      });
    }

    if (!Array.isArray(respostas) || !respostas.length) {
      return res.status(400).json({
        ok:false,
        erro:"Informe o resultado do atendimento."
      });
    }

    await client.query("BEGIN");

    const atendimento = await client.query(`
      UPDATE atendimento_atendimentos
      SET status = 'FINALIZADO',
          finalizou_em = NOW(),
          voltar_fila = TRUE
      WHERE id = $1
        AND empresa = $2
        AND vendedor_codigo = $3
        AND status = 'EM_ATENDIMENTO'
      RETURNING id
    `, [atendimento_id, empresa, vendedor_codigo]);

    if (!atendimento.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        ok:false,
        erro:"Este atendimento já foi finalizado ou não está mais em andamento."
      });
    }

    await client.query(`
      DELETE FROM atendimento_respostas
      WHERE atendimento_id = $1
    `, [atendimento_id]);

    for (const r of respostas) {
      await client.query(`
        INSERT INTO atendimento_respostas
          (atendimento_id, pergunta_id, resposta)
        VALUES ($1,$2,$3)
      `, [
        atendimento_id,
        Number(r.pergunta_id),
        String(r.resposta || "").trim()
      ]);
    }

    await client.query(`
      DELETE FROM atendimento_fila
      WHERE empresa = $1
        AND vendedor_codigo = $2
        AND status IN ('EM_ATENDIMENTO','POS_ATENDIMENTO')
    `, [empresa, vendedor_codigo]);

    const prox = await client.query(`
      SELECT COALESCE(MAX(ordem),0) + 1 AS ordem
      FROM atendimento_fila
      WHERE empresa = $1
        AND status = 'ESPERANDO'
        AND entrou_em::date = CURRENT_DATE
    `, [empresa]);

    const novaOrdem = Number(prox.rows[0]?.ordem || 1);

    await client.query(`
      INSERT INTO atendimento_fila
        (empresa, vendedor_codigo, vendedor_nome, status, ordem, entrou_em)
      VALUES ($1,$2,$3,'ESPERANDO',$4,NOW())
    `, [
      empresa,
      vendedor_codigo,
      vendedor_nome,
      novaOrdem
    ]);

    await client.query("COMMIT");

    return res.json({
      ok:true,
      voltou_fila:true,
      ordem:novaOrdem
    });

  } catch (err) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    console.error("Erro /api/atendimento/finalizar:", err);
    return res.status(500).json({
      ok:false,
      erro:err.message
    });
  } finally {
    client.release();
  }
});

app.delete("/api/atendimento/reset-dia", express.json(), async (req, res) => {
  try {
    const empresa = String(req.body.empresa || "").trim().padStart(2, "0");

    if (!empresa || empresa === "00") {
      return res.status(400).json({ ok:false, erro:"Empresa inválida." });
    }

    await queryAtendimento(`
      DELETE FROM atendimento_respostas r
      USING atendimento_atendimentos a
      WHERE r.atendimento_id = a.id
        AND a.empresa = $1
        AND a.iniciou_em::date = CURRENT_DATE
    `, [empresa], 30000);

    await queryAtendimento(`
      DELETE FROM atendimento_atendimentos
      WHERE empresa = $1
        AND iniciou_em::date = CURRENT_DATE
    `, [empresa], 30000);

    await queryAtendimento(`
      DELETE FROM atendimento_fila
      WHERE empresa = $1
        AND entrou_em::date = CURRENT_DATE
    `, [empresa], 30000);

    res.json({ ok:true });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// ATENDIMENTO GERENCIAL - VISÃO GERAL DE TODAS AS LOJAS
// ======================================================
app.get("/api/atendimento/dashboard-lojas", async (req, res) => {
  try {
    await garantirSchemaCentralAtendimento();

    const hoje = new Date().toISOString().slice(0,10);

    const dataIni = String(req.query.data_ini || hoje).trim();
    const dataFim = String(req.query.data_fim || hoje).trim();

    let agrupamento = String(req.query.agrupamento || "dia")
      .trim()
      .toLowerCase();

    if (!["dia","semana","quinzena","mes","ano"].includes(agrupamento)) {
      agrupamento = "dia";
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dataIni) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)
    ) {
      return res.status(400).json({
        ok:false,
        erro:"Período inválido."
      });
    }

    if (dataIni > dataFim) {
      return res.status(400).json({
        ok:false,
        erro:"A data inicial não pode ser maior que a data final."
      });
    }

    const expressaoPeriodo =
      agrupamento === "ano"
        ? "TO_CHAR(DATE_TRUNC('year', a.iniciou_em), 'YYYY')"
        : agrupamento === "mes"
          ? "TO_CHAR(DATE_TRUNC('month', a.iniciou_em), 'YYYY-MM')"
          : agrupamento === "semana"
            ? "TO_CHAR(DATE_TRUNC('week', a.iniciou_em), 'YYYY-MM-DD')"
            : agrupamento === "quinzena"
              ? `TO_CHAR(
                   DATE_TRUNC('month', a.iniciou_em) +
                   CASE
                     WHEN EXTRACT(DAY FROM a.iniciou_em) > 15
                     THEN INTERVAL '15 days'
                     ELSE INTERVAL '0 days'
                   END,
                   'YYYY-MM-DD'
                 )`
              : "TO_CHAR(a.iniciou_em::date, 'YYYY-MM-DD')";

    // Lojas ativas no ERP.
    const rLojas = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
        TRIM(
          COALESCE(
            NULLIF(apelido::text,''),
            NULLIF(nome::text,''),
            codigo::text
          )
        ) AS nome
      FROM pessoas
      WHERE COALESCE(status::text,'S')='S'
        AND COALESCE(filial,false)=TRUE
      ORDER BY 1
    `, [], 30000);

    // Equipe apta para atendimento por loja.
    const rEquipe = await querySafe(`
      SELECT
        LPAD(
          RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),
          2,
          '0'
        ) AS empresa,
        COUNT(*)::int AS equipe_total
      FROM pessoas p
      WHERE COALESCE(p.funcionario,false) = TRUE
        AND COALESCE(p.podevender,false) = TRUE
        AND p.demissao IS NULL
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%GERENTE%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%ADMIN%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%SUPERVISOR%'
      GROUP BY 1
      ORDER BY 1
    `, [], 30000);

    // Equipe detalhada por vendedor. Necessária para filtros cruzados reais.
    const rEquipeDetalhe = await querySafe(`
      SELECT
        LPAD(
          RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),
          2,
          '0'
        ) AS empresa,
        TRIM(p.codigo::text) AS vendedor_codigo,
        TRIM(
          COALESCE(
            NULLIF(p.apelido::text,''),
            NULLIF(p.nome::text,''),
            p.codigo::text
          )
        ) AS vendedor_nome
      FROM pessoas p
      WHERE COALESCE(p.funcionario,false) = TRUE
        AND COALESCE(p.podevender,false) = TRUE
        AND p.demissao IS NULL
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%GERENTE%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%ADMIN%'
        AND UPPER(TRIM(COALESCE(p.apelido::text,''))) NOT ILIKE '%SUPERVISOR%'
      ORDER BY empresa, vendedor_nome
    `, [], 30000);

    // Estado operacional AGORA. Não é histórico.
    const rFila = await queryAtendimento(`
      SELECT
        empresa,
        COUNT(*) FILTER (
          WHERE status='ESPERANDO'
            AND entrou_em::date=CURRENT_DATE
        )::int AS fila,
        COUNT(*) FILTER (
          WHERE status IN ('EM_ATENDIMENTO','POS_ATENDIMENTO')
            AND entrou_em::date=CURRENT_DATE
        )::int AS em_atendimento
      FROM atendimento_fila
      WHERE entrou_em::date=CURRENT_DATE
      GROUP BY empresa
    `, [], 30000);

    // Estado atual detalhado de cada vendedor que está no fluxo.
    const rFilaDetalhe = await queryAtendimento(`
      SELECT DISTINCT ON (empresa, vendedor_codigo)
        empresa,
        vendedor_codigo,
        vendedor_nome,
        status,
        ordem,
        entrou_em,
        iniciou_em
      FROM atendimento_fila
      WHERE entrou_em::date = CURRENT_DATE
      ORDER BY empresa, vendedor_codigo, id DESC
    `, [], 30000);

    // Resultado consolidado no período informado.
    const rAtend = await queryAtendimento(`
      SELECT
        a.empresa,
        COUNT(*)::int AS atendimentos,
        COUNT(*) FILTER (WHERE a.status='FINALIZADO')::int AS finalizados,
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (a.finalizou_em-a.iniciou_em)))
          FILTER (WHERE a.status='FINALIZADO'),
          0
        )::numeric AS tempo_medio_seg
      FROM atendimento_atendimentos a
      WHERE a.iniciou_em::date BETWEEN $1::date AND $2::date
      GROUP BY a.empresa
    `, [dataIni, dataFim], 30000);

    // Um registro por atendimento, já com vendedor, período e motivos.
    // Esta é a base dos filtros cruzados: vendedor -> motivos -> resumos -> gráficos -> tabela.
    const rAtendimentosDetalhe = await queryAtendimento(`
      SELECT
        a.id,
        a.empresa,
        ${expressaoPeriodo} AS periodo,
        a.vendedor_codigo,
        a.vendedor_nome,
        a.status,
        a.iniciou_em,
        a.finalizou_em,
        COALESCE(
          EXTRACT(EPOCH FROM (a.finalizou_em-a.iniciou_em)),
          0
        )::numeric AS duracao_seg,
        COALESCE(
          STRING_AGG(
            DISTINCT NULLIF(TRIM(r.resposta),''),
            '|||'
            ORDER BY NULLIF(TRIM(r.resposta),'')
          ) FILTER (
            WHERE COALESCE(TRIM(r.resposta),'') <> ''
          ),
          ''
        ) AS motivos
      FROM atendimento_atendimentos a
      LEFT JOIN atendimento_respostas r
        ON r.atendimento_id = a.id
      WHERE a.iniciou_em::date BETWEEN $1::date AND $2::date
      GROUP BY
        a.id,
        a.empresa,
        ${expressaoPeriodo},
        a.vendedor_codigo,
        a.vendedor_nome,
        a.status,
        a.iniciou_em,
        a.finalizou_em
      ORDER BY a.iniciou_em, a.empresa, a.vendedor_nome
    `, [dataIni, dataFim], 30000);

    // Movimento por período + empresa. Essa estrutura permite clicar
    // no gráfico de datas e recalcular resumos, gráficos e tabela.
    const rMovimento = await queryAtendimento(`
      SELECT
        a.empresa,
        ${expressaoPeriodo} AS periodo,
        MIN(a.iniciou_em::date)::text AS data_inicial,
        MAX(a.iniciou_em::date)::text AS data_final,
        COUNT(*)::int AS atendimentos,
        COUNT(*) FILTER (WHERE a.status='FINALIZADO')::int AS finalizados,
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (a.finalizou_em-a.iniciou_em)))
          FILTER (WHERE a.status='FINALIZADO'),
          0
        )::numeric AS duracao_total_seg
      FROM atendimento_atendimentos a
      WHERE a.iniciou_em::date BETWEEN $1::date AND $2::date
      GROUP BY a.empresa, ${expressaoPeriodo}
      ORDER BY periodo, a.empresa
    `, [dataIni, dataFim], 30000);

    // Central operacional ativa.
    const rCentrais = await queryAtendimento(`
      SELECT
        empresa,
        gerente_codigo,
        gerente_nome,
        iniciado_em,
        ultimo_sinal_em,
        (
          ultimo_sinal_em >
          NOW() - ($1::int * INTERVAL '1 second')
        ) AS ativa
      FROM jpdesk.atendimento_centrais_ativas
      ORDER BY empresa
    `, [ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS], 30000);

    // Ranking segmentado pelo mesmo período do gráfico.
    const rRanking = await queryAtendimento(`
      SELECT
        a.empresa,
        ${expressaoPeriodo} AS periodo,
        a.vendedor_codigo,
        a.vendedor_nome,
        COUNT(*)::int AS atendimentos,
        COUNT(*) FILTER (WHERE a.status='FINALIZADO')::int AS finalizados,
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (a.finalizou_em-a.iniciou_em)))
          FILTER (WHERE a.status='FINALIZADO'),
          0
        )::numeric AS duracao_total_seg
      FROM atendimento_atendimentos a
      WHERE a.iniciou_em::date BETWEEN $1::date AND $2::date
      GROUP BY
        a.empresa,
        ${expressaoPeriodo},
        a.vendedor_codigo,
        a.vendedor_nome
      ORDER BY atendimentos DESC, finalizados DESC, a.vendedor_nome
    `, [dataIni, dataFim], 30000);

    // Motivos segmentados pelo mesmo período.
    const rMotivos = await queryAtendimento(`
      SELECT
        a.empresa,
        ${expressaoPeriodo} AS periodo,
        a.vendedor_codigo,
        a.vendedor_nome,
        r.resposta AS motivo,
        COUNT(*)::int AS qtd
      FROM atendimento_respostas r
      INNER JOIN atendimento_atendimentos a
        ON a.id=r.atendimento_id
      WHERE a.iniciou_em::date BETWEEN $1::date AND $2::date
        AND a.status='FINALIZADO'
        AND COALESCE(TRIM(r.resposta),'')<>''
      GROUP BY
        a.empresa,
        ${expressaoPeriodo},
        a.vendedor_codigo,
        a.vendedor_nome,
        r.resposta
      ORDER BY periodo, qtd DESC, a.empresa, motivo
    `, [dataIni, dataFim], 30000);

    const mapaEquipe = new Map(
      (rEquipe.rows || []).map(x => [String(x.empresa), x])
    );

    const mapaFila = new Map(
      (rFila.rows || []).map(x => [String(x.empresa), x])
    );

    const mapaAtend = new Map(
      (rAtend.rows || []).map(x => [String(x.empresa), x])
    );

    const mapaCentrais = new Map(
      (rCentrais.rows || []).map(x => [String(x.empresa), x])
    );

    const codigos = new Set();

    for (const x of rLojas.rows || []) codigos.add(String(x.empresa));
    for (const x of rEquipe.rows || []) codigos.add(String(x.empresa));
    for (const x of rFila.rows || []) codigos.add(String(x.empresa));
    for (const x of rAtend.rows || []) codigos.add(String(x.empresa));
    for (const x of rCentrais.rows || []) codigos.add(String(x.empresa));

    const nomes = new Map(
      (rLojas.rows || []).map(x => [
        String(x.empresa),
        String(x.nome || "")
      ])
    );

    const lojas = [...codigos]
      .sort()
      .map(empresa => {
        const equipe = mapaEquipe.get(empresa) || {};
        const fila = mapaFila.get(empresa) || {};
        const atend = mapaAtend.get(empresa) || {};
        const central = mapaCentrais.get(empresa) || null;

        const equipeTotal = Number(equipe.equipe_total || 0);
        const filaQtd = Number(fila.fila || 0);
        const emAtendimento = Number(fila.em_atendimento || 0);

        const disponiveis = Math.max(
          equipeTotal - filaQtd - emAtendimento,
          0
        );

        return {
          empresa,
          nome: nomes.get(empresa) || `Loja ${empresa}`,

          // Situação atual:
          central_ativa:Boolean(central?.ativa),
          gerente_codigo:central?.gerente_codigo || "",
          gerente_nome:central?.gerente_nome || "",
          central_iniciada_em:central?.iniciado_em || null,
          ultimo_sinal_em:central?.ultimo_sinal_em || null,
          equipe_total:equipeTotal,
          disponiveis,
          fila:filaQtd,
          em_atendimento:emAtendimento,

          // Resultado do período:
          pos_atendimento:Number(atend.finalizados || 0),
          atendimentos:Number(atend.atendimentos || 0),
          finalizados:Number(atend.finalizados || 0),
          tempo_medio_seg:Number(atend.tempo_medio_seg || 0)
        };
      });

    const resumo = lojas.reduce((acc, x) => {
      acc.lojas_total += 1;

      if (x.central_ativa) {
        acc.lojas_ativas += 1;
      }

      acc.disponiveis += x.disponiveis;
      acc.fila += x.fila;
      acc.em_atendimento += x.em_atendimento;
      acc.atendimentos += x.atendimentos;
      acc.finalizados += x.finalizados;

      if (x.finalizados > 0) {
        acc.tempo_total_seg +=
          Number(x.tempo_medio_seg || 0) * x.finalizados;

        acc.tempo_qtd += x.finalizados;
      }

      return acc;
    }, {
      lojas_total:0,
      lojas_ativas:0,
      disponiveis:0,
      fila:0,
      em_atendimento:0,
      atendimentos:0,
      finalizados:0,
      tempo_total_seg:0,
      tempo_qtd:0
    });

    resumo.tempo_medio_seg =
      resumo.tempo_qtd
        ? resumo.tempo_total_seg / resumo.tempo_qtd
        : 0;

    return res.json({
      ok:true,

      periodo:{
        data_ini:dataIni,
        data_fim:dataFim,
        agrupamento
      },

      atualizado_em:new Date().toISOString(),
      tolerancia_segundos:ATENDIMENTO_CENTRAL_EXPIRA_SEGUNDOS,

      resumo,
      lojas,

      equipe_detalhe:(rEquipeDetalhe.rows || []).map(x => ({
        empresa:String(x.empresa || ""),
        vendedor_codigo:String(x.vendedor_codigo || ""),
        vendedor_nome:String(x.vendedor_nome || "")
      })),

      fila_detalhe:(rFilaDetalhe.rows || []).map(x => ({
        empresa:String(x.empresa || ""),
        vendedor_codigo:String(x.vendedor_codigo || ""),
        vendedor_nome:String(x.vendedor_nome || ""),
        status:String(x.status || ""),
        ordem:Number(x.ordem || 0),
        entrou_em:x.entrou_em || null,
        iniciou_em:x.iniciou_em || null
      })),

      atendimentos_detalhe:(rAtendimentosDetalhe.rows || []).map(x => ({
        id:Number(x.id),
        empresa:String(x.empresa || ""),
        periodo:String(x.periodo || ""),
        vendedor_codigo:String(x.vendedor_codigo || ""),
        vendedor_nome:String(x.vendedor_nome || ""),
        status:String(x.status || ""),
        iniciou_em:x.iniciou_em || null,
        finalizou_em:x.finalizou_em || null,
        duracao_seg:Number(x.duracao_seg || 0),
        motivos:String(x.motivos || "")
      })),

      movimento:(rMovimento.rows || []).map(x => ({
        empresa:String(x.empresa),
        periodo:String(x.periodo),
        data_inicial:x.data_inicial,
        data_final:x.data_final,
        atendimentos:Number(x.atendimentos || 0),
        finalizados:Number(x.finalizados || 0),
        duracao_total_seg:Number(x.duracao_total_seg || 0)
      })),

      ranking:(rRanking.rows || []).map(x => ({
        empresa:String(x.empresa),
        periodo:String(x.periodo),
        vendedor_codigo:String(x.vendedor_codigo || ""),
        vendedor_nome:String(x.vendedor_nome || ""),
        atendimentos:Number(x.atendimentos || 0),
        finalizados:Number(x.finalizados || 0),
        duracao_total_seg:Number(x.duracao_total_seg || 0)
      })),

      motivos:(rMotivos.rows || []).map(x => ({
        empresa:String(x.empresa),
        periodo:String(x.periodo),
        vendedor_codigo:String(x.vendedor_codigo || ""),
        vendedor_nome:String(x.vendedor_nome || ""),
        motivo:String(x.motivo || ""),
        qtd:Number(x.qtd || 0)
      }))
    });

  } catch (err) {
    console.error("Erro /api/atendimento/dashboard-lojas:", err);

    return res.status(500).json({
      ok:false,
      erro:err.message
    });
  }
});

app.get("/api/atendimento/dashboard", async (req, res) => {
  try {
    const empresaRaw = String(req.query.empresa || "").trim();
    const empresa = empresaRaw.toUpperCase() === "TODOS"
      ? ""
      : empresaRaw.padStart(2, "0");

    const hoje = new Date().toISOString().slice(0,10);

    const rFila = await queryAtendimento(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ESPERANDO')::int AS fila,
        COUNT(*) FILTER (WHERE status IN ('EM_ATENDIMENTO','POS_ATENDIMENTO'))::int AS em_atendimento
      FROM atendimento_fila
      WHERE ($1::text = '' OR empresa = $1)
        AND entrou_em::date = $2::date
    `, [empresa, hoje], 30000);

    const rAtend = await queryAtendimento(`
      SELECT
        COUNT(*)::int AS atendimentos,
        COUNT(*) FILTER (WHERE status = 'FINALIZADO')::int AS finalizados,
        COALESCE(AVG(EXTRACT(EPOCH FROM (finalizou_em - iniciou_em))) FILTER (WHERE status = 'FINALIZADO'),0) AS tempo_medio_seg
      FROM atendimento_atendimentos
      WHERE ($1::text = '' OR empresa = $1)
        AND iniciou_em::date = $2::date
    `, [empresa, hoje], 30000);

    const rRanking = await queryAtendimento(`
      SELECT
        empresa,
        vendedor_codigo,
        vendedor_nome,
        COUNT(*)::int AS atendimentos,
        COUNT(*) FILTER (WHERE status = 'FINALIZADO')::int AS finalizados,
        COALESCE(AVG(EXTRACT(EPOCH FROM (finalizou_em - iniciou_em))) FILTER (WHERE status = 'FINALIZADO'),0) AS tempo_medio_seg
      FROM atendimento_atendimentos
      WHERE ($1::text = '' OR empresa = $1)
        AND iniciou_em::date = $2::date
      GROUP BY empresa, vendedor_codigo, vendedor_nome
      ORDER BY atendimentos DESC, vendedor_nome
      LIMIT 50
    `, [empresa, hoje], 30000);

    const rMotivos = await queryAtendimento(`
      SELECT
        r.resposta AS motivo,
        COUNT(*)::int AS qtd
      FROM atendimento_respostas r
      INNER JOIN atendimento_atendimentos a
        ON a.id = r.atendimento_id
      WHERE ($1::text = '' OR a.empresa = $1)
        AND a.iniciou_em::date = $2::date
        AND a.status = 'FINALIZADO'
        AND COALESCE(TRIM(r.resposta),'') <> ''
      GROUP BY r.resposta
      ORDER BY qtd DESC, motivo
      LIMIT 50
    `, [empresa, hoje], 30000);

    res.json({
      ok:true,
      empresa: empresa || "TODAS",
      fila: rFila.rows[0] || {},
      resumo: rAtend.rows[0] || {},
      ranking: rRanking.rows || [],
      motivos: rMotivos.rows || []
    });

  } catch (err) {
    res.status(500).json({ ok:false, erro:err.message });
  }
});
app.post("/api/atendimento/sair-fila", express.json(), async (req, res) => {
  try {
    const filaId = Number(req.body.fila_id || 0);

    if (!filaId) {
      return res.status(400).json({ ok:false, erro:"Fila inválida." });
    }

    const r = await queryAtendimento(`
      SELECT empresa, vendedor_codigo
      FROM atendimento_fila
      WHERE id = $1
        AND status = 'ESPERANDO'
        AND entrou_em::date = CURRENT_DATE
      LIMIT 1
    `, [filaId], 30000);

    if (!r.rows.length) {
      return res.status(409).json({
        ok:false,
        erro:"O vendedor só pode sair quando estiver aguardando na fila."
      });
    }

    const item = r.rows[0];

    await queryAtendimento(`
      DELETE FROM atendimento_fila
      WHERE empresa = $1
        AND vendedor_codigo = $2
        AND status = 'ESPERANDO'
        AND entrou_em::date = CURRENT_DATE
    `, [item.empresa, item.vendedor_codigo], 30000);

    return res.json({ ok:true });

  } catch (err) {
    return res.status(500).json({ ok:false, erro:err.message });
  }
});

app.get("/api/atendimento-gerencial/relatorio", async (req, res) => {
  try {
    const empresaRaw = String(req.query.empresa || "").trim();
    const empresa =
      !empresaRaw || empresaRaw.toUpperCase() === "TODOS"
        ? ""
        : empresaRaw.padStart(2, "0").slice(-2);

    const dataIni = String(req.query.data_ini || "").trim();
    const dataFim = String(req.query.data_fim || "").trim();
    const vendedor = String(req.query.vendedor || "").trim();

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dataIni) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)
    ) {
      return res.status(400).json({
        ok:false,
        erro:"Informe um período válido."
      });
    }

    if (dataIni > dataFim) {
      return res.status(400).json({
        ok:false,
        erro:"A data inicial não pode ser maior que a data final."
      });
    }

    const params = [empresa, dataIni, dataFim];
    let filtroVendedor = "";

    if (vendedor) {
      params.push(`%${vendedor}%`);

      filtroVendedor = `
        AND (
          a.vendedor_nome ILIKE $${params.length}
          OR a.vendedor_codigo ILIKE $${params.length}
        )
      `;
    }

    /*
     * Primeiro consolida as respostas por atendimento.
     * Isso evita multiplicar o COUNT quando um atendimento tem
     * mais de um motivo/resposta gravado.
     */
    const r = await queryAtendimento(`
      WITH respostas_por_atendimento AS (
        SELECT
          r.atendimento_id,
          STRING_AGG(
            DISTINCT NULLIF(TRIM(r.resposta),''),
            ' | '
            ORDER BY NULLIF(TRIM(r.resposta),'')
          ) AS motivos
        FROM atendimento_respostas r
        GROUP BY r.atendimento_id
      )
      SELECT
        a.iniciou_em::date AS data_ref,
        a.empresa,
        a.vendedor_codigo,
        a.vendedor_nome,

        COUNT(a.id)::int AS atendimentos,

        COUNT(a.id) FILTER (
          WHERE a.status='FINALIZADO'
        )::int AS finalizados,

        COALESCE(
          AVG(
            EXTRACT(
              EPOCH FROM (a.finalizou_em-a.iniciou_em)
            )
          ) FILTER (
            WHERE a.status='FINALIZADO'
              AND a.finalizou_em IS NOT NULL
          ),
          0
        )::numeric AS tempo_medio_seg,

        STRING_AGG(
          DISTINCT ra.motivos,
          ' | '
        ) FILTER (
          WHERE COALESCE(TRIM(ra.motivos),'')<>''
        ) AS motivos

      FROM atendimento_atendimentos a

      LEFT JOIN respostas_por_atendimento ra
        ON ra.atendimento_id=a.id

      WHERE ($1::text='' OR a.empresa=$1)
        AND a.iniciou_em::date BETWEEN $2::date AND $3::date
        ${filtroVendedor}

      GROUP BY
        a.iniciou_em::date,
        a.empresa,
        a.vendedor_codigo,
        a.vendedor_nome

      ORDER BY
        a.iniciou_em::date DESC,
        a.empresa,
        a.vendedor_nome
    `, params, 30000);

    const dados = (r.rows || []).map(x => ({
      data_ref:x.data_ref,
      empresa:String(x.empresa || ""),
      vendedor_codigo:String(x.vendedor_codigo || ""),
      vendedor_nome:String(x.vendedor_nome || ""),
      foto_url:x.vendedor_codigo
        ? `/foto-pessoa?codigo=${encodeURIComponent(String(x.vendedor_codigo))}`
        : "",
      atendimentos:Number(x.atendimentos || 0),
      finalizados:Number(x.finalizados || 0),
      tempo_medio_seg:Number(x.tempo_medio_seg || 0),
      motivos:String(x.motivos || "")
    }));

    const resumo = dados.reduce((acc,x) => {
      acc.atendimentos += x.atendimentos;
      acc.finalizados += x.finalizados;

      if (x.finalizados > 0) {
        acc.tempo_total_seg +=
          x.tempo_medio_seg * x.finalizados;

        acc.tempo_qtd += x.finalizados;
      }

      acc.vendedores.add(
        `${x.empresa}|${x.vendedor_codigo}`
      );

      return acc;
    }, {
      atendimentos:0,
      finalizados:0,
      tempo_total_seg:0,
      tempo_qtd:0,
      vendedores:new Set()
    });

    return res.json({
      ok:true,
      periodo:{
        data_ini:dataIni,
        data_fim:dataFim
      },
      resumo:{
        atendimentos:resumo.atendimentos,
        finalizados:resumo.finalizados,
        tempo_medio_seg:
          resumo.tempo_qtd
            ? resumo.tempo_total_seg / resumo.tempo_qtd
            : 0,
        vendedores:resumo.vendedores.size
      },
      dados
    });

  } catch (err) {
    console.error(
      "Erro /api/atendimento-gerencial/relatorio:",
      err
    );

    return res.status(500).json({
      ok:false,
      erro:err.message
    });
  }
});

/*
 * Compatibilidade temporária com a URL antiga.
 * O front novo usa somente /api/atendimento-gerencial/relatorio.
 */
app.get("/api/atendimento/relatorio-gerencial", async (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  return res.redirect(
    307,
    "/api/atendimento-gerencial/relatorio" +
    (query ? `?${query}` : "")
  );
});

app.delete("/api/atendimento/reset-dia", express.json(), async (req, res) => {
  try {
    const empresa = String(req.body.empresa || "").trim().padStart(2, "0");

    if (!empresa || empresa === "00") {
      return res.status(400).json({ ok:false, erro:"Empresa inválida." });
    }

    await queryAtendimento(`
      DELETE FROM atendimento_respostas r
      USING atendimento_atendimentos a
      WHERE r.atendimento_id = a.id
        AND a.empresa = $1
        AND a.iniciou_em::date = CURRENT_DATE
    `, [empresa], 30000);

    await queryAtendimento(`
      DELETE FROM atendimento_atendimentos
      WHERE empresa = $1
        AND iniciou_em::date = CURRENT_DATE
    `, [empresa], 30000);

    await queryAtendimento(`
      DELETE FROM atendimento_fila
      WHERE empresa = $1
        AND entrou_em::date = CURRENT_DATE
    `, [empresa], 30000);

    res.json({ ok:true });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ======================================================
// ATENDIMENTO GERENCIAL - MANUTENÇÃO POR PERÍODO
// ======================================================
function normalizarEmpresasManutencao(valor) {
  const lista = Array.isArray(valor) ? valor : [];

  return [...new Set(
    lista
      .map(x => String(x || "").trim().padStart(2,"0").slice(-2))
      .filter(x => /^\d{2}$/.test(x) && x !== "00")
  )];
}

function validarPeriodoManutencao(dataIni, dataFim) {
  const ini = String(dataIni || "").trim();
  const fim = String(dataFim || "").trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(ini) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fim)
  ) {
    return { ok:false, erro:"Informe uma data inicial e uma data final válidas." };
  }

  if (ini > fim) {
    return { ok:false, erro:"A data inicial não pode ser maior que a data final." };
  }

  return { ok:true, dataIni:ini, dataFim:fim };
}

async function resolverEmpresasManutencao({ todas, empresas }) {
  if (todas) {
    const r = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa
      FROM pessoas
      WHERE COALESCE(status::text,'S')='S'
        AND COALESCE(filial,false)=TRUE
      ORDER BY 1
    `, [], 30000);

    return (r.rows || [])
      .map(x => String(x.empresa || "").trim())
      .filter(Boolean);
  }

  return normalizarEmpresasManutencao(empresas);
}

app.post(
  "/api/atendimento-gerencial/manutencao/preview-exclusao",
  express.json(),
  async (req, res) => {
    try {
      const periodo = validarPeriodoManutencao(
        req.body?.data_ini,
        req.body?.data_fim
      );

      if (!periodo.ok) {
        return res.status(400).json({
          ok:false,
          erro:periodo.erro
        });
      }

      const todas = Boolean(req.body?.todas);
      const empresas = await resolverEmpresasManutencao({
        todas,
        empresas:req.body?.empresas
      });

      if (!empresas.length) {
        return res.status(400).json({
          ok:false,
          erro:"Selecione ao menos uma loja ou marque Todas as lojas."
        });
      }

      const params = [
        periodo.dataIni,
        periodo.dataFim,
        empresas
      ];

      const atend = await queryAtendimento(`
        SELECT
          COUNT(*)::int AS atendimentos,
          COUNT(*) FILTER (WHERE status='FINALIZADO')::int AS finalizados
        FROM atendimento_atendimentos
        WHERE iniciou_em::date BETWEEN $1::date AND $2::date
          AND empresa = ANY($3::text[])
      `, params, 30000);

      const respostas = await queryAtendimento(`
        SELECT COUNT(*)::int AS respostas
        FROM atendimento_respostas r
        INNER JOIN atendimento_atendimentos a
          ON a.id=r.atendimento_id
        WHERE a.iniciou_em::date BETWEEN $1::date AND $2::date
          AND a.empresa = ANY($3::text[])
      `, params, 30000);

      const fila = await queryAtendimento(`
        SELECT COUNT(*)::int AS fila
        FROM atendimento_fila
        WHERE entrou_em::date BETWEEN $1::date AND $2::date
          AND empresa = ANY($3::text[])
      `, params, 30000);

      return res.json({
        ok:true,
        data_ini:periodo.dataIni,
        data_fim:periodo.dataFim,
        empresas,
        resumo:{
          lojas:empresas.length,
          atendimentos:Number(atend.rows?.[0]?.atendimentos || 0),
          finalizados:Number(atend.rows?.[0]?.finalizados || 0),
          respostas:Number(respostas.rows?.[0]?.respostas || 0),
          fila:Number(fila.rows?.[0]?.fila || 0)
        }
      });

    } catch (e) {
      console.error(
        "Erro preview manutenção atendimento:",
        e
      );

      return res.status(500).json({
        ok:false,
        erro:e.message
      });
    }
  }
);

app.delete(
  "/api/atendimento-gerencial/manutencao/excluir-periodo",
  express.json(),
  async (req, res) => {
    const client = await poolAtendimento.connect();

    try {
      const periodo = validarPeriodoManutencao(
        req.body?.data_ini,
        req.body?.data_fim
      );

      if (!periodo.ok) {
        return res.status(400).json({
          ok:false,
          erro:periodo.erro
        });
      }

      const todas = Boolean(req.body?.todas);
      const empresas = await resolverEmpresasManutencao({
        todas,
        empresas:req.body?.empresas
      });

      if (!empresas.length) {
        return res.status(400).json({
          ok:false,
          erro:"Selecione ao menos uma loja ou marque Todas as lojas."
        });
      }

      const confirmacao =
        String(req.body?.confirmacao || "")
          .trim()
          .toUpperCase();

      if (confirmacao !== "EXCLUIR") {
        return res.status(400).json({
          ok:false,
          erro:'Digite EXCLUIR para confirmar a operação.'
        });
      }

      await client.query("BEGIN");

      const rRespostas = await client.query(`
        DELETE FROM atendimento_respostas r
        USING atendimento_atendimentos a
        WHERE r.atendimento_id = a.id
          AND a.iniciou_em::date BETWEEN $1::date AND $2::date
          AND a.empresa = ANY($3::text[])
        RETURNING r.id
      `, [
        periodo.dataIni,
        periodo.dataFim,
        empresas
      ]);

      const rAtend = await client.query(`
        DELETE FROM atendimento_atendimentos
        WHERE iniciou_em::date BETWEEN $1::date AND $2::date
          AND empresa = ANY($3::text[])
        RETURNING id
      `, [
        periodo.dataIni,
        periodo.dataFim,
        empresas
      ]);

      const rFila = await client.query(`
        DELETE FROM atendimento_fila
        WHERE entrou_em::date BETWEEN $1::date AND $2::date
          AND empresa = ANY($3::text[])
        RETURNING id
      `, [
        periodo.dataIni,
        periodo.dataFim,
        empresas
      ]);

      await client.query("COMMIT");

      return res.json({
        ok:true,
        data_ini:periodo.dataIni,
        data_fim:periodo.dataFim,
        empresas,
        removidos:{
          respostas:rRespostas.rowCount || 0,
          atendimentos:rAtend.rowCount || 0,
          fila:rFila.rowCount || 0
        }
      });

    } catch (e) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}

      console.error(
        "Erro excluir manutenção atendimento:",
        e
      );

      return res.status(500).json({
        ok:false,
        erro:e.message
      });

    } finally {
      client.release();
    }
  }
);

app.get("/api/atendimento/diagnostico-fila", async (req, res) => {
  try {
    const empresa = String(req.query.empresa || "").trim().padStart(2, "0");

    if (!empresa || empresa === "00") {
      return res.status(400).json({ ok:false, erro:"Empresa inválida." });
    }

    const duplicados = await queryAtendimento(`
      SELECT
        empresa,
        vendedor_codigo,
        vendedor_nome,
        status,
        entrou_em::date AS data,
        COUNT(*)::int AS qtd,
        STRING_AGG(id::text, ', ' ORDER BY id) AS ids
      FROM atendimento_fila
      WHERE empresa = $1
        AND status IN ('ESPERANDO','POS_ATENDIMENTO')
      GROUP BY empresa, vendedor_codigo, vendedor_nome, status, entrou_em::date
      HAVING COUNT(*) > 1
      ORDER BY qtd DESC, vendedor_nome
    `, [empresa], 30000);

    const filaHoje = await queryAtendimento(`
      SELECT *
      FROM atendimento_fila
      WHERE empresa = $1
        AND entrou_em::date = CURRENT_DATE
      ORDER BY vendedor_nome, entrou_em, id
    `, [empresa], 30000);

    res.json({
      ok:true,
      empresa,
      duplicados: duplicados.rows || [],
      filaHoje: filaHoje.rows || []
    });

  } catch (e) {
    res.status(500).json({ ok:false, erro:e.message });
  }
});
function mostrarAjuda(titulo,texto,ev){

    const box=document.getElementById("tooltipAjuda");

    box.querySelector(".tooltip-titulo").innerHTML=titulo;

    box.querySelector(".tooltip-texto").innerHTML=texto;

    box.style.display="block";

    box.style.left=(ev.pageX+15)+"px";

    box.style.top=(ev.pageY+15)+"px";
}

function esconderAjuda(){

    document.getElementById("tooltipAjuda").style.display="none";

}
// ============================================================
// CRM - CENTRAL DE RELACIONAMENTO
// COLE ESTE BLOCO NO index.js ANTES DO app.listen(...)
// Requer: app, pool e express.json() já configurados.
// ============================================================

function somenteNumerosCRM(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarTelefoneCRM(valor) {
  let numero = somenteNumerosCRM(valor);
  if (!numero) return "";
  if (numero.length === 11 && numero.startsWith("0")) numero = numero.substring(1);
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  return numero;
}

function primeiroNomeCRM(nome) {
  return String(nome || "").trim().split(/\s+/)[0] || "";
}

function formatarDataCRM(data) {
  if (!data) return "";
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return "";
  return valor.toLocaleDateString("pt-BR", { timeZone: "America/Recife" });
}

function formatarDinheiroCRM(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function montarMensagemAniversarianteParaVendedorCRM(cliente) {
  const telefoneCliente = normalizarTelefoneCRM(
    cliente.cliente_celular || cliente.cliente_telefone
  );
  const nomeCliente = String(cliente.cliente_nome || "").trim();
  const nomeVendedor = primeiroNomeCRM(cliente.vendedor_nome);
  const ultimaCompra = cliente.ultima_compra
    ? formatarDataCRM(cliente.ultima_compra)
    : "Não localizada";
  const totalComprado = formatarDinheiroCRM(cliente.valor_total_comprado);

  const mensagemCliente =
    `Olá, ${primeiroNomeCRM(nomeCliente)}! 🎉\n\n` +
    `Toda a equipe da JP deseja um feliz aniversário!\n` +
    `Que Deus abençoe sua vida com saúde, alegria e muitas realizações.\n\n` +
    `Esperamos sua visita para conhecer nossas novidades. ❤️`;

  const linkCliente = telefoneCliente
    ? `https://wa.me/${telefoneCliente}?text=${encodeURIComponent(mensagemCliente)}`
    : "Cliente sem telefone válido";

  return (
    `🎂 *ANIVERSARIANTE DO DIA*\n\n` +
    `Olá, ${nomeVendedor || "vendedor"}!\n\n` +
    `Este cliente da sua carteira está fazendo aniversário hoje:\n\n` +
    `👤 *Cliente:* ${nomeCliente}\n` +
    `📱 *Telefone:* ${cliente.cliente_celular || cliente.cliente_telefone || "Não informado"}\n` +
    `🏪 *Empresa:* ${cliente.empresa || "Não informada"}\n` +
    `🛍️ *Última compra:* ${ultimaCompra}\n` +
    `💰 *Total comprado:* ${totalComprado}\n\n` +
    `Clique abaixo para enviar a mensagem pronta ao cliente:\n\n${linkCliente}`
  );
}

function gerarLinkWhatsAppVendedorCRM(cliente) {
  const telefoneVendedor = normalizarTelefoneCRM(
    cliente.vendedor_celular || cliente.vendedor_telefone
  );
  if (!telefoneVendedor) return "";

  return `https://wa.me/${telefoneVendedor}?text=${encodeURIComponent(
    montarMensagemAniversarianteParaVendedorCRM(cliente)
  )}`;
}

app.get("/api/crm/aniversariantes", async (req, res) => {
  try {
    let empresaBusca = String(req.query.empresa || "").trim();
    const empresaSelecionada = empresaBusca.match(/^(\d{1,3})\s*-/);
    if (empresaSelecionada) empresaBusca = empresaSelecionada[1].padStart(2, "0");
    const dataInicio = String(req.query.data_inicio || "").trim();
    const dataFim = String(req.query.data_fim || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
      return res.status(400).json({
        sucesso: false,
        erro: "Informe data_inicio e data_fim no formato AAAA-MM-DD."
      });
    }

    const parametros = [dataInicio, dataFim];
    let filtroEmpresa = "";

    if (empresaBusca) {
      // Usa exatamente a mesma resolução de empresas do Catálogo/OTB.
      // Ex.: JPP, JPF, parte da cidade, parte do apelido, nome ou código.
      const empresasResolvidas = await resolveEmpresasFiltro(empresaBusca);

      if (!empresasResolvidas.length) {
        return res.json({
          sucesso: true,
          data_inicio: dataInicio,
          data_fim: dataFim,
          total: 0,
          aniversariantes: []
        });
      }

      const inicioParametrosEmpresas = parametros.length + 1;

      for (const codigoEmpresa of empresasResolvidas) {
        parametros.push(String(codigoEmpresa).padStart(2, "0"));
      }

      const placeholdersEmpresas = empresasResolvidas
        .map((_, indice) => `$${inicioParametrosEmpresas + indice}`)
        .join(", ");

      filtroEmpresa = `
        AND LPAD(
              RIGHT(TRIM(COALESCE(c.empresa::text, '')), 2),
              2,
              '0'
            ) IN (${placeholdersEmpresas})
      `;
    }

    const sql = `
      WITH periodo AS (
        SELECT dia::date
        FROM generate_series($1::date, $2::date, interval '1 day') AS dia
      ),
      vendas_cliente AS (
        SELECT
          TRIM(v.cliente::text) AS cliente,
          MAX(v.data::date) AS ultima_compra,
          COALESCE(
            SUM(
              COALESCE(m.total::numeric, 0) *
              (
                COALESCE(v.total::numeric, 0) /
                NULLIF(COALESCE(v.subtotal::numeric, 0), 0)
              )
            ),
            0
          ) AS valor_total_comprado
        FROM vendas v
        INNER JOIN movimento m
          ON TRIM(m.auxiliar::text) = ('VE' || TRIM(v.codigo::text))
        WHERE COALESCE(v.subtotal::numeric, 0) <> 0
          AND COALESCE(m.estoque, FALSE) = TRUE
          AND CASE
            WHEN TRIM(COALESCE(v.tipo::text, '')) = '03'
              THEN TRIM(COALESCE(v.status::text, '')) = 'P'
            ELSE TRIM(COALESCE(v.status::text, '')) IN ('S', 'O')
          END
          AND CASE
            WHEN TRIM(COALESCE(v.tipo::text, '')) = '03'
              THEN TRIM(COALESCE(m.operacao::text, '')) = 'VC'
            ELSE TRIM(COALESCE(m.operacao::text, '')) IN ('VE', 'DV')
          END
          AND COALESCE(TRIM(v.cliente::text), '') <> ''
        GROUP BY TRIM(v.cliente::text)
      )
      SELECT
        c.codigo AS cliente_codigo,
        TRIM(COALESCE(c.nome, '')) AS cliente_nome,
        COALESCE(
          NULLIF(TRIM(c.telefone2::text), ''),
          NULLIF(TRIM(c.telefone1::text), ''),
          NULLIF(TRIM(c.telefone3::text), '')
        ) AS cliente_telefone,
        c.telefone2 AS cliente_celular,
        c.telefone1 AS cliente_telefone_fixo,
        c.nascimento AS cliente_nascimento,
        ani.data_aniversario,

        CASE
          WHEN img.imagem IS NULL THEN ''
          WHEN octet_length(img.imagem) >= 4
           AND get_byte(img.imagem, 0) = 137
           AND get_byte(img.imagem, 1) = 80
           AND get_byte(img.imagem, 2) = 78
           AND get_byte(img.imagem, 3) = 71
            THEN 'data:image/png;base64,' || encode(img.imagem, 'base64')
          ELSE 'data:image/jpeg;base64,' || encode(img.imagem, 'base64')
        END AS cliente_foto,

        LPAD(COALESCE(c.empresa::text, ''), 2, '0') AS empresa,
        TRIM(
          COALESCE(
            NULLIF(emp.apelido::text, ''),
            NULLIF(emp.nome::text, ''),
            'Empresa ' || LPAD(
              RIGHT(TRIM(COALESCE(c.empresa::text, '')), 2),
              2,
              '0'
            )
          )
        ) AS empresa_nome,

        c.responsavel AS vendedor_codigo,
        TRIM(
          COALESCE(
            NULLIF(vd.apelido::text, ''),
            NULLIF(vd.nome::text, ''),
            ''
          )
        ) AS vendedor_nome,

        COALESCE(vd.funcionario, FALSE) AS vendedor_funcionario,
        COALESCE(vd.podevender, FALSE) AS vendedor_pode_vender,
        vd.demissao AS vendedor_demissao,
        vd.atividade AS vendedor_atividade,
        TRIM(COALESCE(atv.descricao, '')) AS vendedor_atividade_descricao,
        COALESCE(atv.desativar, FALSE) AS vendedor_atividade_desativada,

        CASE
          WHEN vd.codigo IS NULL THEN FALSE
          WHEN COALESCE(vd.funcionario, FALSE) = FALSE THEN FALSE
          WHEN vd.demissao IS NOT NULL THEN FALSE
          WHEN COALESCE(vd.podevender, FALSE) = FALSE THEN FALSE
          WHEN COALESCE(atv.desativar, FALSE) = TRUE THEN FALSE
          ELSE TRUE
        END AS vendedor_ativo,

        CASE
          WHEN vd.codigo IS NULL THEN 'Cliente sem vendedor responsável cadastrado'
          WHEN COALESCE(vd.funcionario, FALSE) = FALSE THEN 'O responsável não está marcado como funcionário'
          WHEN vd.demissao IS NOT NULL THEN 'O responsável possui data de demissão'
          WHEN COALESCE(vd.podevender, FALSE) = FALSE THEN 'A opção Pode Vender está desativada'
          WHEN COALESCE(atv.desativar, FALSE) = TRUE THEN 'A atividade do responsável está desativada'
          ELSE 'Carteira ativa'
        END AS motivo_carteira,

        COALESCE(
          NULLIF(TRIM(vd.telefone2::text), ''),
          NULLIF(TRIM(vd.telefone1::text), ''),
          NULLIF(TRIM(vd.telefone3::text), '')
        ) AS vendedor_telefone,
        vd.telefone2 AS vendedor_celular,
        vd.telefone1 AS vendedor_telefone_fixo,
        vc.ultima_compra,
        COALESCE(vc.valor_total_comprado, 0) AS valor_total_comprado

      FROM pessoas c
      JOIN LATERAL (
        SELECT MIN(p.dia)::date AS data_aniversario
        FROM periodo p
        WHERE EXTRACT(DAY FROM p.dia) = EXTRACT(DAY FROM c.nascimento)
          AND EXTRACT(MONTH FROM p.dia) = EXTRACT(MONTH FROM c.nascimento)
      ) ani ON ani.data_aniversario IS NOT NULL
      LEFT JOIN LATERAL (
        SELECT ip.imagem
        FROM imagens_pessoas ip
        WHERE REGEXP_REPLACE(TRIM(ip.codigo::text), '^[A-Za-z]+', '') =
              REGEXP_REPLACE(TRIM(c.codigo::text), '^[A-Za-z]+', '')
          AND ip.imagem IS NOT NULL
        ORDER BY ip.datahora DESC NULLS LAST
        LIMIT 1
      ) img ON TRUE
      LEFT JOIN pessoas vd
        ON TRIM(vd.codigo::text) = TRIM(c.responsavel::text)
      LEFT JOIN atividades atv
        ON TRIM(atv.codigo::text) = TRIM(vd.atividade::text)
      LEFT JOIN pessoas emp
        ON TRIM(COALESCE(emp.status::text, '')) = 'S'
       AND UPPER(TRIM(COALESCE(emp.filial::text, ''))) = 'T'
       AND LPAD(
             RIGHT(TRIM(COALESCE(emp.codigo::text, '')), 2),
             2,
             '0'
           ) =
           LPAD(
             RIGHT(TRIM(COALESCE(c.empresa::text, '')), 2),
             2,
             '0'
           )
      LEFT JOIN vendas_cliente vc
        ON TRIM(vc.cliente::text) = TRIM(c.codigo::text)

      WHERE COALESCE(c.cliente, FALSE) = TRUE
        AND c.nascimento IS NOT NULL
        ${filtroEmpresa}

      ORDER BY
        ani.data_aniversario,
        CASE
          WHEN vd.codigo IS NOT NULL
           AND COALESCE(vd.funcionario, FALSE) = TRUE
           AND vd.demissao IS NULL
           AND COALESCE(vd.podevender, FALSE) = TRUE
           AND COALESCE(atv.desativar, FALSE) = FALSE
          THEN 1 ELSE 0
        END DESC,
        vd.nome,
        c.nome
    `;

    const resultado = await pool.query(sql, parametros);

    const lista = resultado.rows.map(cliente => {
      const telefoneCliente = normalizarTelefoneCRM(
        cliente.cliente_celular || cliente.cliente_telefone
      );
      const telefoneVendedor = normalizarTelefoneCRM(
        cliente.vendedor_celular || cliente.vendedor_telefone
      );

      return {
        ...cliente,
        cliente_telefone_normalizado: telefoneCliente,
        vendedor_telefone_normalizado: telefoneVendedor,
        possui_telefone_cliente: Boolean(telefoneCliente),
        possui_telefone_vendedor: Boolean(telefoneVendedor),
        mensagem_vendedor: montarMensagemAniversarianteParaVendedorCRM(cliente),
        link_whatsapp_vendedor: gerarLinkWhatsAppVendedorCRM(cliente)
      };
    });

    res.json({
      sucesso: true,
      data_inicio: dataInicio,
      data_fim: dataFim,
      total: lista.length,
      aniversariantes: lista
    });
  } catch (erro) {
    console.error("Erro ao buscar aniversariantes CRM:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Não foi possível buscar os aniversariantes.",
      detalhes: erro.message
    });
  }
});

// Lista somente funcionários aptos a receber clientes na carteira.
app.get("/api/crm/vendedores-ativos", async (req, res) => {
  try {
    const empresa = String(req.query.empresa || "").trim();
    const parametros = [];
    let filtroEmpresa = "";

    if (empresa) {
      parametros.push(empresa.padStart(2, "0"));
      filtroEmpresa = `
        AND LPAD(COALESCE(p.empresa::text, ''), 2, '0') = $${parametros.length}
      `;
    }

    const resultado = await pool.query(`
      SELECT
        p.codigo,
        TRIM(
          COALESCE(
            NULLIF(p.apelido::text, ''),
            NULLIF(p.nome::text, ''),
            ''
          )
        ) AS nome,
        LPAD(COALESCE(p.empresa::text, ''), 2, '0') AS empresa,
        TRIM(COALESCE(atv.descricao, '')) AS atividade
      FROM pessoas p
      LEFT JOIN atividades atv
        ON TRIM(atv.codigo::text) = TRIM(p.atividade::text)
      WHERE COALESCE(p.funcionario, FALSE) = TRUE
        AND p.demissao IS NULL
        AND COALESCE(p.podevender, FALSE) = TRUE
        AND COALESCE(atv.desativar, FALSE) = FALSE
        ${filtroEmpresa}
      ORDER BY nome
    `, parametros);

    res.json({ sucesso: true, vendedores: resultado.rows });
  } catch (erro) {
    console.error("Erro ao buscar vendedores ativos CRM:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Não foi possível buscar os vendedores ativos.",
      detalhes: erro.message
    });
  }
});

// Transfere o cliente para uma carteira cujo responsável seja vendedor ativo.
app.put("/api/crm/clientes/:clienteCodigo/responsavel", async (req, res) => {
  const conexao = await pool.connect();

  try {
    const clienteCodigo = String(req.params.clienteCodigo || "").trim();
    const vendedorCodigo = String(req.body?.vendedor_codigo || "").trim();

    if (!clienteCodigo || !vendedorCodigo) {
      return res.status(400).json({
        sucesso: false,
        erro: "Cliente e novo vendedor são obrigatórios."
      });
    }

    await conexao.query("BEGIN");

    const vendedor = await conexao.query(`
      SELECT
        p.codigo,
        COALESCE(p.funcionario, FALSE) AS funcionario,
        COALESCE(p.podevender, FALSE) AS podevender,
        p.demissao,
        COALESCE(atv.desativar, FALSE) AS atividade_desativada
      FROM pessoas p
      LEFT JOIN atividades atv
        ON TRIM(atv.codigo::text) = TRIM(p.atividade::text)
      WHERE TRIM(p.codigo::text) = $1
      LIMIT 1
      FOR UPDATE OF p
    `, [vendedorCodigo]);

    if (!vendedor.rows.length) {
      await conexao.query("ROLLBACK");
      return res.status(404).json({
        sucesso: false,
        erro: "Vendedor não encontrado."
      });
    }

    const cadastro = vendedor.rows[0];

    if (!cadastro.funcionario) {
      await conexao.query("ROLLBACK");
      return res.status(409).json({
        sucesso: false,
        erro: "O responsável selecionado não está marcado como funcionário."
      });
    }

    if (cadastro.demissao) {
      await conexao.query("ROLLBACK");
      return res.status(409).json({
        sucesso: false,
        erro: "O funcionário selecionado possui data de demissão."
      });
    }

    if (!cadastro.podevender) {
      await conexao.query("ROLLBACK");
      return res.status(409).json({
        sucesso: false,
        erro: "O vendedor selecionado está com Pode Vender desativado."
      });
    }

    if (cadastro.atividade_desativada) {
      await conexao.query("ROLLBACK");
      return res.status(409).json({
        sucesso: false,
        erro: "A atividade do vendedor selecionado está desativada."
      });
    }

    const atualizado = await conexao.query(`
      UPDATE pessoas
      SET responsavel = $1
      WHERE TRIM(codigo::text) = $2
        AND COALESCE(cliente, FALSE) = TRUE
      RETURNING codigo, nome, responsavel
    `, [vendedorCodigo, clienteCodigo]);

    if (!atualizado.rows.length) {
      await conexao.query("ROLLBACK");
      return res.status(404).json({
        sucesso: false,
        erro: "Cliente não encontrado ou cadastro não marcado como cliente."
      });
    }

    await conexao.query("COMMIT");

    res.json({
      sucesso: true,
      mensagem: "Responsável alterado com sucesso.",
      cliente: atualizado.rows[0]
    });
  } catch (erro) {
    try {
      await conexao.query("ROLLBACK");
    } catch (_) {}

    console.error("Erro ao trocar responsável CRM:", erro);
    res.status(500).json({
      sucesso: false,
      erro: "Não foi possível trocar o vendedor responsável.",
      detalhes: erro.message
    });
  } finally {
    conexao.release();
  }
});

// ======================================================
// TRANSFERÊNCIA INTELIGENTE
// Grupos sem pesos manuais.
// Percentuais calculados pelas vendas do item no período.
// ======================================================

app.get("/api/transferencia-inteligente/empresas", async (req, res) => {
  try {
    const r = await querySafe(`
      SELECT DISTINCT
        LPAD(RIGHT(TRIM(codigo::text), 2), 2, '0') AS empresa,
        TRIM(
          COALESCE(
            NULLIF(apelido::text, ''),
            NULLIF(nome::text, ''),
            codigo::text
          )
        ) AS nome
      FROM pessoas
      WHERE status = 'S'
        AND filial = 'T'
      ORDER BY 1
    `, [], 60000);

    res.json({ ok:true, empresas:r.rows || [] });
  } catch (e) {
    console.error("Erro empresas transferência:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/transferencia-inteligente/grupos", async (req, res) => {
  try {
    const r = await querySafe(`
      SELECT
        g.id,
        g.nome,
        g.gerar_reposicao,
        g.ativo,
        COALESCE(
          JSON_AGG(ge.empresa ORDER BY ge.empresa)
            FILTER (WHERE ge.empresa IS NOT NULL),
          '[]'::json
        ) AS empresas
      FROM transferencia_grupos g
      LEFT JOIN transferencia_grupo_empresas ge
        ON ge.grupo_id = g.id
      GROUP BY
        g.id,
        g.nome,
        g.gerar_reposicao,
        g.ativo
      ORDER BY g.ativo DESC, g.nome
    `, [], 60000);

    res.json({ ok:true, grupos:r.rows || [] });
  } catch (e) {
    console.error("Erro grupos transferência:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.post("/api/transferencia-inteligente/grupos", async (req, res) => {
  const client = await pool.connect();

  try {
    const id = Number(req.body?.id || 0) || null;
    const nome = String(req.body?.nome || "").trim();
    const gerarReposicao = req.body?.gerar_reposicao !== false;
    const ativo = req.body?.ativo !== false;

    const empresas = [
      ...new Set(
        (Array.isArray(req.body?.empresas) ? req.body.empresas : [])
          .map(item =>
            String(item?.empresa ?? item ?? "")
              .replace(/\D/g, "")
              .padStart(2, "0")
              .slice(-2)
          )
          .filter(Boolean)
      )
    ];

    if (!nome) {
      return res.status(400).json({
        ok:false,
        erro:"Informe o nome do grupo."
      });
    }

    if (empresas.length < 2) {
      return res.status(400).json({
        ok:false,
        erro:"Selecione pelo menos duas empresas."
      });
    }

    await client.query("BEGIN");

    let grupoId = id;

    if (grupoId) {
      const atualizado = await client.query(`
        UPDATE transferencia_grupos
        SET
          nome = $1,
          gerar_reposicao = $2,
          ativo = $3,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id
      `, [nome, gerarReposicao, ativo, grupoId]);

      if (!atualizado.rows.length) {
        throw new Error("Grupo não encontrado.");
      }
    } else {
      /*
       * Os campos antigos recebem valores neutros apenas para manter
       * compatibilidade com a estrutura já existente no banco.
       * Eles não são exibidos nem utilizados no cálculo novo.
       */
      const inserido = await client.query(`
        INSERT INTO transferencia_grupos (
          nome,
          periodo_dias,
          peso_historico,
          multiplicador_saudavel,
          minimo_campea,
          modo_transferencia,
          grade_minima_zerou,
          gerar_reposicao,
          ativo
        )
        VALUES ($1,30,0,4,1,'ZEROU',1,$2,$3)
        RETURNING id
      `, [nome, gerarReposicao, ativo]);

      grupoId = inserido.rows[0].id;
    }

    await client.query(`
      DELETE FROM transferencia_grupo_empresas
      WHERE grupo_id = $1
    `, [grupoId]);

    for (const empresa of empresas) {
      await client.query(`
        INSERT INTO transferencia_grupo_empresas (
          grupo_id,
          empresa,
          percentual_base
        )
        VALUES ($1,$2,100)
      `, [grupoId, empresa]);
    }

    await client.query("COMMIT");
    res.json({ ok:true, id:grupoId });

  } catch (e) {
    try { await client.query("ROLLBACK"); } catch (_) {}

    console.error("Erro salvar grupo transferência:", e);
    res.status(500).json({ ok:false, erro:e.message });
  } finally {
    client.release();
  }
});

app.delete("/api/transferencia-inteligente/grupos/:id", async (req, res) => {
  try {
    const id = Number(req.params.id || 0);

    if (!id) {
      return res.status(400).json({
        ok:false,
        erro:"Grupo inválido."
      });
    }

    await querySafe(`
      DELETE FROM transferencia_grupos
      WHERE id = $1
    `, [id], 30000);

    res.json({ ok:true });
  } catch (e) {
    console.error("Erro excluir grupo transferência:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});


app.post("/api/transferencia-inteligente/donos/atualizar", async (req, res) => {
  try {
    /*
     * ETAPA 1 — leitura no banco oficial do SETA.
     * Usa exatamente a mesma regra de compras do OTB-BI:
     * entrada tipo 10 e CFOP 1102, 2102 ou 3102.
     */
    const rCompras = await querySafe(`
      SELECT
        LPAD(TRIM(e.empresa::text),2,'0') AS empresa,
        LEFT(TRIM(m.produto::text),6) AS produto,
        MIN(COALESCE(e.entrega::date, e.data::date)) AS primeira_compra,
        MAX(COALESCE(e.entrega::date, e.data::date)) AS ultima_compra,
        SUM(ABS(COALESCE(m.quantidade::numeric,0))) AS quantidade_comprada
      FROM movimento m
      INNER JOIN entradas e
        ON TRIM(m.auxiliar::text) =
           TRIM(('EN' || e.codigo)::char(8))
      WHERE COALESCE(TRIM(e.tipo::text),'') = '10'
        AND TRIM(COALESCE(e.cfop::text,'')) IN (
          '1102',
          '2102',
          '3102'
        )
      GROUP BY
        LPAD(TRIM(e.empresa::text),2,'0'),
        LEFT(TRIM(m.produto::text),6)
      ORDER BY 1,2
    `, [], 180000);

    const compras = (rCompras.rows || [])
      .map(item => ({
        empresa:String(item.empresa || "").trim().padStart(2,"0"),
        produto:String(item.produto || "").trim().slice(0,6),
        primeira_compra:item.primeira_compra,
        ultima_compra:item.ultima_compra,
        quantidade_comprada:Number(item.quantidade_comprada || 0)
      }))
      .filter(item =>
        item.empresa &&
        item.produto &&
        item.primeira_compra &&
        item.ultima_compra
      );

    /*
     * ETAPA 2 — gravação somente no banco auxiliar postgres.
     * Nenhuma tabela oficial do ERP é alterada.
     */
    await queryAtendimento(`
      UPDATE jpdesk.transferencia_dono_produto
      SET ativo = FALSE,
          atualizado_em = NOW()
      WHERE ativo = TRUE
    `, [], 30000);

    const tamanhoLote = 1000;
    let gravadas = 0;

    for (let inicio = 0; inicio < compras.length; inicio += tamanhoLote) {
      const lote = compras.slice(inicio, inicio + tamanhoLote);

      const rGravacao = await queryAtendimento(`
        INSERT INTO jpdesk.transferencia_dono_produto (
          empresa,
          produto,
          primeira_compra,
          ultima_compra,
          quantidade_comprada,
          ativo,
          atualizado_em
        )
        SELECT
          x.empresa,
          x.produto,
          x.primeira_compra,
          x.ultima_compra,
          x.quantidade_comprada,
          TRUE,
          NOW()
        FROM jsonb_to_recordset($1::jsonb) AS x(
          empresa varchar(2),
          produto varchar(6),
          primeira_compra date,
          ultima_compra date,
          quantidade_comprada numeric
        )
        ON CONFLICT (empresa,produto)
        DO UPDATE SET
          primeira_compra = EXCLUDED.primeira_compra,
          ultima_compra = EXCLUDED.ultima_compra,
          quantidade_comprada = EXCLUDED.quantidade_comprada,
          ativo = TRUE,
          atualizado_em = NOW()
        RETURNING empresa,produto
      `, [JSON.stringify(lote)], 120000);

      gravadas += (rGravacao.rows || []).length;
    }

    res.json({
      ok:true,
      relacoes:gravadas,
      compras_encontradas:compras.length,
      origem:"SETA",
      destino:"postgres"
    });
  } catch (e) {
    console.error("Erro ao atualizar donos:", e);
    res.status(500).json({
      ok:false,
      erro:e.code === "42P01"
        ? "A tabela jpdesk.transferencia_dono_produto não existe no banco postgres."
        : e.message
    });
  }
});

app.get("/api/transferencia-inteligente/opcoes", async (req, res) => {
  try {
    const campo = String(req.query.campo || "").trim().toLowerCase();
    const q = String(req.query.q || "").trim();
    const busca = `%${q}%`;

    const consultas = {
      departamento:`
        SELECT DISTINCT
          TRIM(COALESCE(d.descricao::text,'')) AS valor
        FROM departamentos d
        WHERE TRIM(COALESCE(d.descricao::text,'')) <> ''
          AND (
            TRIM(COALESCE(d.codigo::text,'')) ILIKE $1
            OR TRIM(COALESCE(d.descricao::text,'')) ILIKE $1
            OR (
              TRIM(COALESCE(d.codigo::text,'')) || ' - ' ||
              TRIM(COALESCE(d.descricao::text,''))
            ) ILIKE $1
          )
        ORDER BY valor
        LIMIT 60
      `,
      grupo:`
        SELECT DISTINCT
          TRIM(COALESCE(g.descricao::text,'')) AS valor
        FROM grupos g
        WHERE TRIM(COALESCE(g.descricao::text,'')) <> ''
          AND (
            TRIM(COALESCE(g.codigo::text,'')) ILIKE $1
            OR TRIM(COALESCE(g.descricao::text,'')) ILIKE $1
            OR (
              TRIM(COALESCE(g.codigo::text,'')) || ' - ' ||
              TRIM(COALESCE(g.descricao::text,''))
            ) ILIKE $1
          )
        ORDER BY valor
        LIMIT 60
      `,
      complemento:`
        SELECT DISTINCT
          TRIM(COALESCE(p.complemento::text,'')) AS valor
        FROM produtos p
        WHERE TRIM(COALESCE(p.complemento::text,'')) <> ''
          AND TRIM(COALESCE(p.complemento::text,'')) ILIKE $1
        ORDER BY valor
        LIMIT 60
      `,
      produto:`
        SELECT DISTINCT
          TRIM(COALESCE(p.codigo::text,'')) || ' - ' ||
          TRIM(COALESCE(p.descricao::text,'')) AS valor
        FROM produtos p
        WHERE TRIM(COALESCE(p.codigo::text,'')) <> ''
          AND (
            TRIM(COALESCE(p.codigo::text,'')) ILIKE $1
            OR TRIM(COALESCE(p.descricao::text,'')) ILIKE $1
            OR (
              TRIM(COALESCE(p.codigo::text,'')) || ' - ' ||
              TRIM(COALESCE(p.descricao::text,''))
            ) ILIKE $1
          )
        ORDER BY valor
        LIMIT 60
      `
    };

    if (!consultas[campo]) {
      return res.status(400).json({
        ok:false,
        erro:"Campo de filtro inválido."
      });
    }

    const r = await querySafe(consultas[campo], [busca], 30000);

    res.json({
      ok:true,
      opcoes:(r.rows || [])
        .map(x => String(x.valor || "").trim())
        .filter(Boolean)
    });
  } catch (e) {
    console.error("Erro opções transferência:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/transferencia-inteligente/direcionada", async (req, res) => {
  try {
    const origem = String(req.query.origem || "").padStart(2, "0");
    const destino = String(req.query.destino || "").padStart(2, "0");
    const departamento = String(req.query.departamento || "").trim();
    const grupo = String(req.query.grupo || "").trim();
    const complemento = String(req.query.complemento || "").trim();
    const produto = String(req.query.produto || "").trim();
    const preservar = String(req.query.preservar || "1") === "1";
    const politicaEstoque = String(req.query.politica_estoque || "LIVRE").trim().toUpperCase();

    if (!["LIVRE","DONO","ATIVO"].includes(politicaEstoque)) {
      return res.status(400).json({ok:false, erro:"Política de propriedade inválida."});
    }

    if (!origem || !destino || origem === destino) {
      return res.status(400).json({
        ok:false,
        erro:"Informe lojas de origem e destino diferentes."
      });
    }

    const r = await querySafe(`
      WITH estoque AS (
        SELECT
          LEFT(LPAD(TRIM(m.produto::text),8,'0'),6) AS produto,
          RIGHT(LPAD(TRIM(m.produto::text),8,'0'),2) AS tamanho,
          SUM(
            CASE
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(COALESCE(m.movimento::text,'')) = 'E'
                THEN ABS(COALESCE(m.quantidade::numeric,0))
              WHEN COALESCE(m.estoque,false) = TRUE
               AND TRIM(COALESCE(m.movimento::text,'')) = 'S'
                THEN -ABS(COALESCE(m.quantidade::numeric,0))
              ELSE 0
            END
          ) AS estoque
        FROM movimento m
        WHERE LPAD(TRIM(m.empresa::text),2,'0') = $1
        GROUP BY 1,2
      )
      SELECT
        e.produto,
        e.tamanho,
        GREATEST(0,COALESCE(e.estoque,0)) AS estoque,
        GREATEST(
          0,
          GREATEST(0,COALESCE(e.estoque,0)) -
          CASE WHEN $7::boolean THEN 1 ELSE 0 END
        ) AS max_transferir,
        TRIM(COALESCE(p.descricao::text,'')) AS descricao,
        TRIM(COALESCE(p.complemento::text,'')) AS complemento,
        TRIM(COALESCE(d.descricao::text,'')) AS departamento,
        TRIM(COALESCE(g.descricao::text,'')) AS grupo,
        $1::text AS origem,
        $2::text AS destino
      FROM estoque e
      LEFT JOIN produtos p
        ON TRIM(p.codigo::text) = e.produto
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text) = TRIM(p.departamento::text)
      LEFT JOIN grupos g
        ON TRIM(g.codigo::text) = TRIM(p.grupo::text)
      WHERE GREATEST(0,COALESCE(e.estoque,0)) > 0
        AND (
          $3 = ''
          OR TRIM(COALESCE(p.departamento::text,'')) ILIKE '%' || $3 || '%'
          OR TRIM(COALESCE(d.descricao::text,'')) ILIKE '%' || $3 || '%'
          OR (
            TRIM(COALESCE(d.codigo::text,'')) || ' - ' ||
            TRIM(COALESCE(d.descricao::text,''))
          ) ILIKE '%' || $3 || '%'
        )
        AND (
          $4 = ''
          OR TRIM(COALESCE(p.grupo::text,'')) ILIKE '%' || $4 || '%'
          OR TRIM(COALESCE(g.descricao::text,'')) ILIKE '%' || $4 || '%'
          OR (
            TRIM(COALESCE(g.codigo::text,'')) || ' - ' ||
            TRIM(COALESCE(g.descricao::text,''))
          ) ILIKE '%' || $4 || '%'
        )
        AND (
          $5 = ''
          OR TRIM(COALESCE(p.complemento::text,'')) ILIKE '%' || $5 || '%'
        )
        AND (
          $6 = ''
          OR TRIM(COALESCE(p.codigo::text,'')) ILIKE '%' || $6 || '%'
          OR TRIM(COALESCE(p.descricao::text,'')) ILIKE '%' || $6 || '%'
          OR (
            TRIM(COALESCE(p.codigo::text,'')) || ' - ' ||
            TRIM(COALESCE(p.descricao::text,''))
          ) ILIKE '%' || $6 || '%'
        )
      ORDER BY
        TRIM(COALESCE(p.descricao::text,'')),
        e.produto,
        e.tamanho
    `, [
      origem,
      destino,
      departamento,
      grupo,
      complemento,
      produto,
      preservar
    ], 120000);

    let itens = (r.rows || []).map(x => ({
      ...x,
      estoque:Number(x.estoque || 0),
      max_transferir:Number(x.max_transferir || 0)
    }));

    /*
     * A propriedade está no banco auxiliar postgres.
     * Quando a política não é LIVRE, origem e destino precisam
     * ser proprietárias do produto.
     */
    if (politicaEstoque !== "LIVRE" && itens.length) {
      const produtos = [...new Set(
        itens.map(item => String(item.produto || "").trim()).filter(Boolean)
      )];

      const rDonos = await queryAtendimento(`
        SELECT
          empresa,
          produto
        FROM jpdesk.transferencia_dono_produto
        WHERE ativo = TRUE
          AND empresa = ANY($1::text[])
          AND produto = ANY($2::text[])
          AND (
            $3 = 'DONO'
            OR ultima_compra >= CURRENT_DATE - INTERVAL '24 months'
          )
      `, [[origem,destino], produtos, politicaEstoque], 60000);

      const donos = new Set(
        (rDonos.rows || []).map(item =>
          `${String(item.empresa || "").padStart(2,"0")}|${String(item.produto || "").trim()}`
        )
      );

      itens = itens.filter(item => {
        const produtoItem = String(item.produto || "").trim();

        return (
          donos.has(`${origem}|${produtoItem}`) &&
          donos.has(`${destino}|${produtoItem}`)
        );
      });
    }

    res.json({
      ok:true,
      politica_estoque:politicaEstoque,
      itens
    });
  } catch (e) {
    console.error("Erro transferência direcionada:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

app.get("/api/transferencia-inteligente/analisar", async (req, res) => {
  try {
    const grupoId = Number(req.query.grupo_id || 0);
    const dataInicio = String(req.query.data_inicio || "").trim();
    const dataFim = String(req.query.data_fim || "").trim();
    const modo = String(req.query.modo || "GERAL").trim().toUpperCase();
    const departamento = String(req.query.departamento || "").trim();
    const grupoFiltro = String(req.query.grupo || "").trim();
    const complemento = String(req.query.complemento || "").trim();
    const produtoFiltro = String(req.query.produto || "").trim();
    const politicaEstoque = String(req.query.politica_estoque || "LIVRE").trim().toUpperCase();

    if (!["LIVRE","DONO","ATIVO"].includes(politicaEstoque)) {
      return res.status(400).json({ok:false, erro:"Política de propriedade inválida."});
    }

    if (!grupoId) {
      return res.status(400).json({
        ok:false,
        erro:"Informe o grupo."
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
      return res.status(400).json({
        ok:false,
        erro:"Informe corretamente a data inicial e a data final."
      });
    }

    if (dataInicio > dataFim) {
      return res.status(400).json({
        ok:false,
        erro:"A data inicial não pode ser maior que a data final."
      });
    }

    const rg = await querySafe(`
      SELECT
        g.id,
        g.nome,
        g.gerar_reposicao,
        g.ativo,
        COALESCE(
          JSON_AGG(ge.empresa ORDER BY ge.empresa)
            FILTER (WHERE ge.empresa IS NOT NULL),
          '[]'::json
        ) AS empresas
      FROM transferencia_grupos g
      LEFT JOIN transferencia_grupo_empresas ge
        ON ge.grupo_id = g.id
      WHERE g.id = $1
      GROUP BY
        g.id,
        g.nome,
        g.gerar_reposicao,
        g.ativo
    `, [grupoId], 30000);

    const grupo = rg.rows?.[0];

    if (!grupo) {
      return res.status(404).json({
        ok:false,
        erro:"Grupo não encontrado."
      });
    }

    const empresas = (grupo.empresas || [])
      .map(x => String(x).padStart(2, "0"));

    if (empresas.length < 2) {
      return res.status(400).json({
        ok:false,
        erro:"O grupo precisa possuir pelo menos duas lojas."
      });
    }

    /*
     * vendido:
     * VE soma; DV e VC subtraem.
     *
     * estoque:
     * considera toda a movimentação de estoque até a data final,
     * para representar a posição existente no encerramento do período.
     */
    const rd = await querySafe(`
      WITH base AS (
        SELECT
          LEFT(LPAD(TRIM(m.produto::text), 8, '0'), 6) AS produto,
          RIGHT(LPAD(TRIM(m.produto::text), 8, '0'), 2) AS tamanho,
          LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,

          SUM(
            CASE
              WHEN m.data::date BETWEEN $2::date AND $3::date
               AND TRIM(COALESCE(m.operacao::text, '')) = 'VE'
                THEN ABS(COALESCE(m.quantidade::numeric, 0))

              WHEN m.data::date BETWEEN $2::date AND $3::date
               AND TRIM(COALESCE(m.operacao::text, '')) IN ('DV','VC')
                THEN -ABS(COALESCE(m.quantidade::numeric, 0))

              ELSE 0
            END
          ) AS vendido,

          SUM(
            CASE
              WHEN m.data::date <= $3::date
               AND COALESCE(m.estoque, FALSE) = TRUE
               AND TRIM(COALESCE(m.movimento::text, '')) = 'E'
                THEN ABS(COALESCE(m.quantidade::numeric, 0))

              WHEN m.data::date <= $3::date
               AND COALESCE(m.estoque, FALSE) = TRUE
               AND TRIM(COALESCE(m.movimento::text, '')) = 'S'
                THEN -ABS(COALESCE(m.quantidade::numeric, 0))

              ELSE 0
            END
          ) AS estoque

        FROM movimento m
        WHERE LPAD(TRIM(m.empresa::text), 2, '0') = ANY($1::text[])
          AND m.data::date <= $3::date
        GROUP BY 1,2,3
      )
      SELECT
        b.produto,
        b.tamanho,
        b.empresa,
        GREATEST(0, COALESCE(b.vendido,0)) AS vendido,
        GREATEST(0, COALESCE(b.estoque,0)) AS estoque,
        TRIM(COALESCE(p.descricao, '')) AS descricao
      FROM base b
      LEFT JOIN produtos p
        ON TRIM(p.codigo::text) = b.produto
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text) = TRIM(p.departamento::text)
      LEFT JOIN grupos g
        ON TRIM(g.codigo::text) = TRIM(p.grupo::text)
      WHERE (
        COALESCE(b.vendido,0) <> 0
        OR COALESCE(b.estoque,0) <> 0
      )
        AND (
          $4 = ''
          OR TRIM(COALESCE(p.departamento::text,'')) ILIKE '%' || $4 || '%'
          OR TRIM(COALESCE(d.descricao::text,'')) ILIKE '%' || $4 || '%'
          OR (
            TRIM(COALESCE(d.codigo::text,'')) || ' - ' ||
            TRIM(COALESCE(d.descricao::text,''))
          ) ILIKE '%' || $4 || '%'
        )
        AND (
          $5 = ''
          OR TRIM(COALESCE(p.grupo::text,'')) ILIKE '%' || $5 || '%'
          OR TRIM(COALESCE(g.descricao::text,'')) ILIKE '%' || $5 || '%'
          OR (
            TRIM(COALESCE(g.codigo::text,'')) || ' - ' ||
            TRIM(COALESCE(g.descricao::text,''))
          ) ILIKE '%' || $5 || '%'
        )
        AND (
          $6 = ''
          OR TRIM(COALESCE(p.complemento::text,'')) ILIKE '%' || $6 || '%'
        )
        AND (
          $7 = ''
          OR TRIM(COALESCE(p.codigo::text,'')) ILIKE '%' || $7 || '%'
          OR TRIM(COALESCE(p.descricao::text,'')) ILIKE '%' || $7 || '%'
          OR (
            TRIM(COALESCE(p.codigo::text,'')) || ' - ' ||
            TRIM(COALESCE(p.descricao::text,''))
          ) ILIKE '%' || $7 || '%'
        )
      ORDER BY b.produto, b.tamanho, b.empresa
    `, [
      empresas,
      dataInicio,
      dataFim,
      departamento,
      grupoFiltro,
      complemento,
      produtoFiltro
    ], 180000);

    const mapa = new Map();

    for (const row of rd.rows || []) {
      const produto = String(row.produto || "").trim();
      const tamanho = String(row.tamanho || "")
        .replace(/^0+(?=\d)/, "");
      const empresa = String(row.empresa || "").padStart(2, "0");
      const chave = `${produto}|${tamanho}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          produto,
          tamanho,
          descricao:row.descricao || "",
          lojas:new Map()
        });
      }

      mapa.get(chave).lojas.set(empresa, {
        vendido:Number(row.vendido || 0),
        estoque:Math.max(0, Number(row.estoque || 0))
      });
    }

    const produtosAnalise = [...new Set([...mapa.values()].map(item => item.produto))];

    /*
     * ÚLTIMA COMPRA DO PRODUTO
     * Busca a compra real mais recente no ERP, independentemente da loja.
     * Regra oficial: entrada tipo 10 e CFOP 1102, 2102 ou 3102.
     */
    const ultimaCompraPorProduto = new Map();

    if (produtosAnalise.length) {
      const rUltimasCompras = await querySafe(`
        SELECT
          LEFT(TRIM(m.produto::text),6) AS produto,
          MAX(COALESCE(e.entrega::date, e.data::date)) AS ultima_compra
        FROM movimento m
        INNER JOIN entradas e
          ON TRIM(m.auxiliar::text) =
             TRIM(('EN' || e.codigo)::char(8))
        WHERE COALESCE(TRIM(e.tipo::text),'') = '10'
          AND TRIM(COALESCE(e.cfop::text,'')) IN (
            '1102',
            '2102',
            '3102'
          )
          AND LEFT(TRIM(m.produto::text),6) = ANY($1::text[])
        GROUP BY LEFT(TRIM(m.produto::text),6)
      `, [produtosAnalise], 180000);

      for (const compra of rUltimasCompras.rows || []) {
        ultimaCompraPorProduto.set(
          String(compra.produto || '').trim().slice(0,6),
          compra.ultima_compra || null
        );
      }
    }

    const lojasProprietarias = new Set();

    if (politicaEstoque !== "LIVRE" && produtosAnalise.length) {
      const rDonos = await queryAtendimento(`
        SELECT empresa,produto
        FROM jpdesk.transferencia_dono_produto
        WHERE ativo = TRUE
          AND empresa = ANY($1::text[])
          AND produto = ANY($2::text[])
          AND (
            $3 = 'DONO'
            OR ultima_compra >= CURRENT_DATE - INTERVAL '24 months'
          )
      `, [empresas, produtosAnalise, politicaEstoque], 120000);

      for (const dono of rDonos.rows || []) {
        lojasProprietarias.add(`${String(dono.empresa).padStart(2,"0")}|${String(dono.produto)}`);
      }
    }

    const sugestoes = [];
    const reposicoes = [];
    let itensAnalisados = 0;
    let itensComVenda = 0;
    let campeasRupturadas = 0;

    /*
     * VENDAS DO PRODUTO POR LOJA (somando todas as numerações)
     *
     * Esta visão permite que o modo VENDAS complete a grade do mesmo
     * produto. Assim, se a loja vendeu o produto em qualquer numeração,
     * ela também poderá receber 1 par de outra numeração desse produto
     * que esteja rupturada, mesmo que aquela numeração específica ainda
     * não tenha registrado venda no período.
     */
    const vendasProdutoPorLoja = new Map();

    for (const itemProduto of mapa.values()) {
      if (!vendasProdutoPorLoja.has(itemProduto.produto)) {
        vendasProdutoPorLoja.set(itemProduto.produto, new Map());
      }

      const vendasLojasProduto = vendasProdutoPorLoja.get(itemProduto.produto);

      for (const empresa of empresas) {
        const dadosLoja = itemProduto.lojas.get(empresa) || { vendido:0 };
        const vendidoAtual = Number(vendasLojasProduto.get(empresa) || 0);
        vendasLojasProduto.set(
          empresa,
          vendidoAtual + Math.max(0, Number(dadosLoja.vendido || 0))
        );
      }
    }

    for (const item of mapa.values()) {
      const lojas = empresas
        .filter(empresa =>
          politicaEstoque === "LIVRE" ||
          lojasProprietarias.has(`${empresa}|${item.produto}`)
        )
        .map(empresa => {
          const dados = item.lojas.get(empresa) || {
            vendido:0,
            estoque:0
          };

          const vendidoProduto = Math.max(
            0,
            Number(
              vendasProdutoPorLoja.get(item.produto)?.get(empresa) || 0
            )
          );

          return {
            empresa,
            vendido:Math.max(0, Number(dados.vendido || 0)),
            vendido_produto:vendidoProduto,
            estoque:Math.max(0, Number(dados.estoque || 0))
          };
        });

      if (lojas.length < 2) {
        continue;
      }

      const totalVendido = lojas.reduce(
        (s, loja) => s + loja.vendido,
        0
      );

      const totalVendidoProduto = lojas.reduce(
        (s, loja) => s + loja.vendido_produto,
        0
      );

      /*
       * DISTRIBUIÇÃO GERAL:
       * continua analisando numerações sem venda para garantir presença.
       *
       * SOMENTE LOJAS QUE VENDEM:
       * o PRODUTO precisa possuir venda real no período, mesmo que esta
       * numeração específica ainda não tenha sido vendida. Isso permite
       * completar a grade nas lojas que movimentam o produto.
       */
      if (modo === "VENDAS" && totalVendidoProduto <= 0) {
        continue;
      }

      itensAnalisados++;

      if (totalVendido > 0) {
        itensComVenda++;
      }

      lojas.forEach(loja => {
        loja.percentual = totalVendido > 0
          ? (loja.vendido / totalVendido) * 100
          : 0;
      });

      lojas.sort((a, b) =>
        b.vendido - a.vendido ||
        b.estoque - a.estoque ||
        a.empresa.localeCompare(
          b.empresa,
          "pt-BR",
          { numeric:true }
        )
      );

      const campea = lojas[0];

      const ranking = lojas.map((loja, indice) => ({
        posicao:indice + 1,
        empresa:loja.empresa,
        vendido:loja.vendido,
        estoque:loja.estoque,
        percentual:Number(loja.percentual.toFixed(4))
      }));

      /*
       * REGRA CORRIGIDA DA TRANSFERÊNCIA AUTOMÁTICA
       *
       * DESTINO:
       * - GERAL: toda loja zerada naquela numeração pode receber,
       *   independentemente de venda no período.
       * - VENDAS: loja zerada que vendeu o mesmo produto no período,
       *   ainda que não tenha vendido esta numeração específica.
       *
       * ORIGEM:
       * 1. precisa possuir estoque acima de 1 par;
       * 2. maior excedente disponível primeiro;
       * 3. em empate de estoque, menor venda do produto (todas as
       *    numerações) nos últimos 60 dias ou no período informado;
       * 4. em novo empate, menor código da loja.
       *
       * QUANTIDADE:
       * - cada origem envia somente 1 par por sugestão;
       * - nunca envia todo o excedente;
       * - preserva pelo menos 1 par na origem;
       * - não existe reforço posterior para loja campeã.
       */
      const estoqueProjetado = new Map(
        lojas.map(loja => [
          loja.empresa,
          Math.max(0, Number(loja.estoque || 0))
        ])
      );

      const lojasZeradas = lojas
        .filter(loja =>
          Number(estoqueProjetado.get(loja.empresa) || 0) <= 0 &&
          (
            modo !== "VENDAS" ||
            Number(loja.vendido_produto || 0) > 0
          )
        )
        .sort((a, b) =>
          b.vendido_produto - a.vendido_produto ||
          b.vendido - a.vendido ||
          b.percentual - a.percentual ||
          a.empresa.localeCompare(
            b.empresa,
            "pt-BR",
            { numeric:true }
          )
        );

      campeasRupturadas += lojasZeradas.length;

      const ordenarDoadoras = destinoEmpresa =>
        lojas
          .filter(loja =>
            loja.empresa !== destinoEmpresa &&
            Number(estoqueProjetado.get(loja.empresa) || 0) > 1
          )
          .sort((a, b) =>
            Number(estoqueProjetado.get(b.empresa) || 0) -
              Number(estoqueProjetado.get(a.empresa) || 0) ||
            a.vendido_produto - b.vendido_produto ||
            a.vendido - b.vendido ||
            a.empresa.localeCompare(
              b.empresa,
              "pt-BR",
              { numeric:true }
            )
          );

      const registrarTransferencia = ({
        doadora,
        destino,
        motivo
      }) => {
        const quantidade = 1;
        const estoqueOrigemAntes =
          Number(estoqueProjetado.get(doadora.empresa) || 0);

        const estoqueDestinoAntes =
          Number(estoqueProjetado.get(destino.empresa) || 0);

        sugestoes.push({
          produto:item.produto,
          descricao:item.descricao,
          ultima_compra:ultimaCompraPorProduto.get(item.produto) || null,
          tamanho:item.tamanho,
          origem:doadora.empresa,
          destino:destino.empresa,
          quantidade,
          estoque_origem:estoqueOrigemAntes,
          estoque_destino:estoqueDestinoAntes,
          vendido_origem:doadora.vendido,
          vendido_destino:destino.vendido,
          vendido_produto_origem:doadora.vendido_produto,
          vendido_produto_destino:destino.vendido_produto,
          percentual_origem:Number(doadora.percentual.toFixed(4)),
          percentual_destino:Number(destino.percentual.toFixed(4)),
          ranking,
          motivo
        });

        estoqueProjetado.set(
          doadora.empresa,
          estoqueOrigemAntes - quantidade
        );

        estoqueProjetado.set(
          destino.empresa,
          estoqueDestinoAntes + quantidade
        );
      };

      /*
       * Cada loja zerada recebe somente o par necessário para sair
       * da ruptura. A origem é recalculada a cada destino para considerar
       * o estoque projetado após as sugestões anteriores.
       */
      for (const destino of lojasZeradas) {
        if (Number(estoqueProjetado.get(destino.empresa) || 0) > 0) {
          continue;
        }

        const doadora = ordenarDoadoras(destino.empresa)[0];

        if (!doadora) {
          continue;
        }

        registrarTransferencia({
          doadora,
          destino,
          motivo:
            destino.vendido > 0
              ? "Enviar 1 par para suprir a ruptura da numeração que a loja vendeu. Origem escolhida pelo maior excedente e, no empate, pela menor venda do produto no período."
              : modo === "VENDAS" && destino.vendido_produto > 0
                ? "Completar a grade: a loja vende o mesmo produto, mas está rupturada nesta numeração. Enviar 1 par, retirando primeiro da loja com maior excedente e, no empate, da que menos vendeu o produto."
                : "Enviar 1 par para suprir a ruptura. Origem escolhida pelo maior excedente e, no empate, pela menor venda do produto no período."
        });
      }

      /*
       * Reposição:
       * somente quando existe loja com venda e estoque zero,
       * mas nenhuma transferência conseguiu abastecê-la.
       */
      if (grupo.gerar_reposicao) {
        for (const loja of lojas) {
          const continuaZerada =
            (
              loja.vendido > 0 ||
              (modo === "VENDAS" && loja.vendido_produto > 0)
            ) &&
            Number(estoqueProjetado.get(loja.empresa) || 0) <= 0;

          if (!continuaZerada) {
            continue;
          }

          reposicoes.push({
            produto:item.produto,
            descricao:item.descricao,
            tamanho:item.tamanho,
            destino:loja.empresa,
            percentual_campea:Number(loja.percentual.toFixed(4)),
            vendido_campea:loja.vendido,
            quantidade:1,
            motivo:
              loja.vendido > 0
                ? "A loja vendeu esta numeração e continua rupturada porque nenhuma loja do grupo pôde doar preservando 1 par."
                : "A loja vende o mesmo produto e precisa completar a grade, mas nenhuma loja do grupo pôde doar esta numeração preservando 1 par."
          });
        }
      }
    }

    res.json({
      ok:true,
      grupo:{
        id:grupo.id,
        nome:grupo.nome,
        empresas,
        data_inicio:dataInicio,
        data_fim:dataFim,
        modo,
        filtros:{
          departamento,
          grupo:grupoFiltro,
          complemento,
          produto:produtoFiltro
        },
        politica_estoque:politicaEstoque
      },
      resumo:{
        itens_analisados:itensAnalisados,
        itens_com_venda:itensComVenda,
        campeas_rupturadas:campeasRupturadas,
        transferencias_sugeridas:sugestoes.length,
        pares_transferir:sugestoes.reduce(
          (s, x) => s + Number(x.quantidade || 0),
          0
        ),
        reposicoes_urgentes:reposicoes.length
      },
      sugestoes,
      reposicoes
    });

  } catch (e) {
    console.error("Erro análise transferência:", e);
    res.status(500).json({ ok:false, erro:e.message });
  }
});

// ============================================================
// RELATÓRIOS INTELIGENTES IA — MOTOR COM MEMÓRIA E CONTEXTO
// ============================================================

const conversasRelatoriosIa = new Map();

const IA_TEMPO_MEMORIA_MS = 2 * 60 * 60 * 1000;

function iaNormalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[?!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function iaFormatarDinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function iaLimparMemoriasAntigas() {
  const limite = Date.now() - IA_TEMPO_MEMORIA_MS;

  for (const [chave, item] of conversasRelatoriosIa.entries()) {
    if (!item || Number(item.atualizadoEm || 0) < limite) {
      conversasRelatoriosIa.delete(chave);
    }
  }
}

function iaObterContexto(sessaoId) {
  iaLimparMemoriasAntigas();

  const chave = String(sessaoId || "padrao").trim() || "padrao";

  return conversasRelatoriosIa.get(chave) || {
    assunto: "",
    empresas: [],
    periodo: null,
    busca: "",
    cor: "",
    tamanho: "",
    agrupamento: "produto",
    metricas: [],
    ultimaPergunta: "",
    atualizadoEm: Date.now()
  };
}

function iaSalvarContexto(sessaoId, contexto) {
  const chave = String(sessaoId || "padrao").trim() || "padrao";

  conversasRelatoriosIa.set(chave, {
    ...contexto,
    atualizadoEm: Date.now()
  });
}

function iaExtrairEmpresas(pergunta) {
  const texto = iaNormalizarTexto(pergunta);
  const codigos = new Set();

  const padroes = [
    /(?:loja|lojas|empresa|empresas|filial|filiais)\s+((?:\d{1,2}[\s,;e]*)+)/g,
    /(?:da|de|na|no)\s+(?:loja|empresa|filial)?\s*(\d{1,2})(?!\d)/g
  ];

  for (const padrao of padroes) {
    let resultado;

    while ((resultado = padrao.exec(texto)) !== null) {
      const numeros =
        String(resultado[1] || "").match(/\d{1,2}/g) || [];

      for (const numero of numeros) {
        codigos.add(String(numero).padStart(2, "0"));
      }
    }
  }

  return Array.from(codigos);
}

function iaExtrairTamanho(pergunta) {
  const texto = iaNormalizarTexto(pergunta);

  const padroes = [
    /(?:numero|numeracao|nº|n°|tam|tamanho)\s*(\d{2})\b/,
    /\b(\d{2})\s*(?:numero|numeracao|nº|n°|tam|tamanho)\b/
  ];

  for (const padrao of padroes) {
    const resultado = texto.match(padrao);

    if (resultado) {
      const tamanho = Number(resultado[1]);

      if (tamanho >= 15 && tamanho <= 50) {
        return String(tamanho).padStart(2, "0");
      }
    }
  }

  /*
   * Reconhece também:
   * "sapatênis branco 35"
   * "sandália 37"
   */
  const numerosSoltos = texto.match(/\b([1-4][0-9]|50)\b/g) || [];

  for (const numero of numerosSoltos) {
    const n = Number(numero);

    if (n >= 15 && n <= 50) {
      return String(n).padStart(2, "0");
    }
  }

  return "";
}

function iaExtrairCor(pergunta) {
  const texto = iaNormalizarTexto(pergunta);

  const cores = [
    ["branco", "BRANCO"],
    ["branca", "BRANCO"],
    ["brancos", "BRANCO"],
    ["brancas", "BRANCO"],

    ["preto", "PRETO"],
    ["preta", "PRETO"],
    ["pretos", "PRETO"],
    ["pretas", "PRETO"],

    ["vermelho", "VERMELHO"],
    ["vermelha", "VERMELHO"],
    ["azul", "AZUL"],
    ["verde", "VERDE"],
    ["amarelo", "AMARELO"],
    ["amarela", "AMARELO"],
    ["bege", "BEGE"],
    ["marrom", "MARROM"],
    ["caramelo", "CARAMELO"],
    ["rosa", "ROSA"],
    ["pink", "PINK"],
    ["lilas", "LILAS"],
    ["roxo", "ROXO"],
    ["roxa", "ROXO"],
    ["cinza", "CINZA"],
    ["dourado", "DOURADO"],
    ["dourada", "DOURADO"],
    ["prata", "PRATA"],
    ["prateado", "PRATA"],
    ["prateada", "PRATA"],
    ["nude", "NUDE"],
    ["off white", "OFF WHITE"]
  ];

  for (const [termo, valor] of cores) {
    if (texto.includes(termo)) {
      return valor;
    }
  }

  return "";
}

function iaResolverPeriodo(pergunta, periodoAnterior = null) {
  const texto = iaNormalizarTexto(pergunta);

  /*
   * Reconhece datas como palavras inteiras.
   * "contém" não será confundido com "ontem".
   */
  if (/\banteontem\b/.test(texto)) {
    return {
      inicioSql: "CURRENT_DATE - INTERVAL '2 day'",
      fimSql: "CURRENT_DATE - INTERVAL '2 day'",
      descricao: "anteontem",
      chave: "anteontem"
    };
  }

  if (/\bontem\b/.test(texto)) {
    return {
      inicioSql: "CURRENT_DATE - INTERVAL '1 day'",
      fimSql: "CURRENT_DATE - INTERVAL '1 day'",
      descricao: "ontem",
      chave: "ontem"
    };
  }

  if (
    /\bultimos\s+7\s+dias\b/.test(texto) ||
    /\bsete\s+dias\b/.test(texto)
  ) {
    return {
      inicioSql: "CURRENT_DATE - INTERVAL '6 day'",
      fimSql: "CURRENT_DATE",
      descricao: "nos últimos 7 dias",
      chave: "7_dias"
    };
  }

  if (
    /\bultimos\s+30\s+dias\b/.test(texto) ||
    /\btrinta\s+dias\b/.test(texto)
  ) {
    return {
      inicioSql: "CURRENT_DATE - INTERVAL '29 day'",
      fimSql: "CURRENT_DATE",
      descricao: "nos últimos 30 dias",
      chave: "30_dias"
    };
  }

  if (
    /\beste\s+mes\b/.test(texto) ||
    /\bnesse\s+mes\b/.test(texto) ||
    /\bno\s+mes\b/.test(texto) ||
    /\bmes\s+atual\b/.test(texto)
  ) {
    return {
      inicioSql: "date_trunc('month', CURRENT_DATE)::date",
      fimSql: "CURRENT_DATE",
      descricao: "neste mês",
      chave: "mes_atual"
    };
  }

  if (/\bhoje\b/.test(texto)) {
    return {
      inicioSql: "CURRENT_DATE",
      fimSql: "CURRENT_DATE",
      descricao: "hoje",
      chave: "hoje"
    };
  }

  if (periodoAnterior) {
    return periodoAnterior;
  }

  return {
    inicioSql: "CURRENT_DATE",
    fimSql: "CURRENT_DATE",
    descricao: "hoje",
    chave: "hoje"
  };
}

function iaDetectarAssunto(pergunta, contextoAnterior) {
  const texto = iaNormalizarTexto(pergunta);

  const palavrasEstoque = [
    "estoque",
    "tem",
    "disponivel",
    "disponiveis",
    "onde tem",
    "qual loja tem",
    "em qual loja",
    "quantos tem",
    "saldo",
    "grade",
    "numeracao"
  ];

  const palavrasVenda = [
    "venda",
    "vendas",
    "vendeu",
    "venderam",
    "vendido",
    "vendidos",
    "faturou",
    "quanto foi vendido",
    "preco medio"
  ];

  if (palavrasEstoque.some(item => texto.includes(item))) {
    return "estoque";
  }

  if (palavrasVenda.some(item => texto.includes(item))) {
    return "vendas";
  }

  if (
    texto.includes("por quanto") ||
    texto.includes("qual valor") ||
    texto.includes("quanto deu")
  ) {
    return contextoAnterior?.assunto || "vendas";
  }

  return contextoAnterior?.assunto || "estoque";
}

function iaDetectarAgrupamento(pergunta, assuntoAnterior) {
  const texto = iaNormalizarTexto(pergunta);

  if (
    texto.includes("por loja") ||
    texto.includes("em qual loja") ||
    texto.includes("qual loja") ||
    texto.includes("separe por loja")
  ) {
    return "loja";
  }

  if (
    texto.includes("por marca") ||
    texto.includes("qual marca") ||
    texto.includes("marca vendeu")
  ) {
    return "marca";
  }

  if (
    texto.includes("por grupo") ||
    texto.includes("qual grupo")
  ) {
    return "grupo";
  }

  if (
    texto.includes("por vendedor") ||
    texto.includes("qual vendedor")
  ) {
    return "vendedor";
  }

  if (
    texto.includes("por numero") ||
    texto.includes("por numeracao") ||
    texto.includes("por tamanho")
  ) {
    return "tamanho";
  }

  if (
    texto.includes("por produto") ||
    texto.includes("quais produtos") ||
    texto.includes("qual produto")
  ) {
    return "produto";
  }

  return assuntoAnterior || "produto";
}

function iaDetectarMetricas(pergunta, assunto) {
  const texto = iaNormalizarTexto(pergunta);
  const metricas = new Set();

  if (assunto === "estoque") {
    metricas.add("estoque");
    metricas.add("preco_venda");
  }

  if (assunto === "vendas") {
    metricas.add("quantidade");

    if (
      texto.includes("valor") ||
      texto.includes("por quanto") ||
      texto.includes("quanto foi vendido") ||
      texto.includes("quanto vendeu") ||
      texto.includes("faturou") ||
      texto.includes("preco medio") ||
      texto.includes("total")
    ) {
      metricas.add("valor_vendido");
      metricas.add("preco_medio");
    }
  }

  return Array.from(metricas);
}

function iaExtrairFiltroEmpresaTexto(pergunta) {
  const texto = iaNormalizarTexto(pergunta);

  /*
   * Exemplos:
   * lojas JPP
   * só nas lojas JPP
   * lojas que contêm as letras JPP
   * empresas PALM
   */
  const padroes = [
    /\b(?:loja|lojas|empresa|empresas|filial|filiais)\s+que\s+(?:contem|tenham|tem)\s+(?:as\s+)?(?:letras?\s+)?([a-z][a-z0-9_-]{1,20})\b/,
    /\b(?:loja|lojas|empresa|empresas|filial|filiais)\s+(?:do\s+grupo\s+)?([a-z][a-z0-9_-]{1,20})\b/
  ];

  const ignorar = new Set([
    "que", "tem", "tenham", "contem", "com", "sem",
    "onde", "qual", "quais", "numero", "numeracao",
    "branco", "branca", "preto", "preta", "hoje", "ontem"
  ]);

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    const valor = String(match?.[1] || "").trim();

    if (
      valor &&
      !ignorar.has(valor) &&
      !/^\d+$/.test(valor)
    ) {
      return valor;
    }
  }

  return "";
}

function iaRemoverFiltroEmpresaDaBusca(textoOriginal) {
  let texto = iaNormalizarTexto(textoOriginal);

  texto = texto
    .replace(
      /\b(?:so\s+)?(?:nas?|nos?|das?|dos?)?\s*(?:loja|lojas|empresa|empresas|filial|filiais)\s+que\s+(?:contem|tenham|tem)\s+(?:as\s+)?(?:letras?\s+)?[a-z][a-z0-9_-]{1,20}\b/g,
      " "
    )
    .replace(
      /\b(?:so\s+)?(?:nas?|nos?|das?|dos?)?\s*(?:loja|lojas|empresa|empresas|filial|filiais)\s+(?:do\s+grupo\s+)?[a-z][a-z0-9_-]{1,20}\b/g,
      " "
    );

  return texto.replace(/\s+/g, " ").trim();
}

function iaExtrairBuscaProduto(pergunta) {
  let texto = iaRemoverFiltroEmpresaDaBusca(pergunta);

  const palavrasRemover = [
    "quais",
    "qual",
    "onde",
    "mande",
    "mostre",
    "traga",
    "informe",
    "diga",
    "consulta",
    "consultar",

    "produto",
    "produtos",
    "modelo",
    "modelos",

    "estoque",
    "disponivel",
    "disponiveis",
    "saldo",
    "tem",
    "tenho",

    "venda",
    "vendas",
    "vendeu",
    "venderam",
    "vendido",
    "vendidos",

    "hoje",
    "ontem",
    "anteontem",
    "mes",
    "semana",
    "ultimos",
    "dias",

    "loja",
    "lojas",
    "empresa",
    "empresas",
    "filial",
    "filiais",

    "numero",
    "numeracao",
    "tamanho",
    "tam",

    "branco",
    "branca",
    "brancos",
    "brancas",
    "preto",
    "preta",
    "vermelho",
    "vermelha",
    "azul",
    "verde",
    "amarelo",
    "amarela",
    "bege",
    "marrom",
    "caramelo",
    "rosa",
    "pink",
    "lilas",
    "roxo",
    "roxa",
    "cinza",
    "dourado",
    "dourada",
    "prata",
    "prateado",
    "prateada",
    "nude",

    "em",
    "por",
    "para",
    "com",
    "sem",
    "e",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "no",
    "na",
    "nos",
    "nas",
    "as",
    "os",
    "o",
    "a",

    "quanto",
    "quantos",
    "quantidade",
    "valor",
    "total",
    "preco",
    "medio",
    "foi",

    "separe",
    "separado",
    "agrupado"
  ];

  texto = texto
    .replace(
      /(?:loja|lojas|empresa|empresas|filial|filiais)\s+(?:\d{1,2}[\s,;e]*)+/g,
      " "
    )
    .replace(
      /(?:da|de|na|no)\s+(?:loja|empresa|filial)?\s*\d{1,2}\b/g,
      " "
    )
    .replace(/\b([1-4][0-9]|50)\b/g, " ");

  const bloqueadas = new Set(palavrasRemover);

  const palavras = texto
    .split(/\s+/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => item.length >= 3)
    .filter(item => !bloqueadas.has(item));

  return palavras.join(" ");
}

function iaPerguntaDeContinuacao(pergunta) {
  const texto = iaNormalizarTexto(pergunta);

  const indicadoresContinuacao = [
    "e ontem",
    "e hoje",
    "e anteontem",
    "e na loja",
    "e no numero",
    "e no tamanho",
    "por quanto",
    "qual o valor",
    "qual valor",
    "quanto deu",
    "separe por",
    "agora por",
    "mostre por",
    "e por marca",
    "e por loja",
    "e por produto",
    "e por grupo",
    "e por vendedor",
    "tem no numero",
    "tem no tamanho",
    "tem na loja"
  ];

  return indicadoresContinuacao.some(
    indicador => texto.includes(indicador)
  );
}

function iaMontarPlano(pergunta, contextoAnterior) {
  const continuacao =
    iaPerguntaDeContinuacao(pergunta);

  const contextoBase = continuacao
    ? contextoAnterior
    : {
        assunto: "",
        empresas: [],
        empresaTexto: "",
        periodo: null,
        busca: "",
        cor: "",
        tamanho: "",
        agrupamento: "produto",
        metricas: []
      };

  const assunto =
    iaDetectarAssunto(pergunta, contextoBase);

  const empresasNovas =
    iaExtrairEmpresas(pergunta);

  const empresaTextoNova =
    iaExtrairFiltroEmpresaTexto(pergunta);

  const tamanhoNovo =
    iaExtrairTamanho(pergunta);

  const corNova =
    iaExtrairCor(pergunta);

  const buscaNova =
    iaExtrairBuscaProduto(pergunta);

  const periodo =
    iaResolverPeriodo(
      pergunta,
      continuacao
        ? contextoBase?.periodo
        : null
    );

  const agrupamento =
    iaDetectarAgrupamento(
      pergunta,
      continuacao
        ? contextoBase?.agrupamento
        : "produto"
    );

  const metricasNovas =
    iaDetectarMetricas(pergunta, assunto);

  const metricas = Array.from(
    new Set([
      ...(continuacao
        ? contextoBase?.metricas || []
        : []),
      ...metricasNovas
    ])
  );

  return {
    assunto,

    empresas:
      empresasNovas.length
        ? empresasNovas
        : continuacao
          ? contextoBase?.empresas || []
          : [],

    empresaTexto:
      empresaTextoNova ||
      (
        continuacao
          ? contextoBase?.empresaTexto || ""
          : ""
      ),

    periodo,

    busca:
      buscaNova ||
      (
        continuacao
          ? contextoBase?.busca || ""
          : ""
      ),

    cor:
      corNova ||
      (
        continuacao
          ? contextoBase?.cor || ""
          : ""
      ),

    tamanho:
      tamanhoNovo ||
      (
        continuacao
          ? contextoBase?.tamanho || ""
          : ""
      ),

    agrupamento,
    metricas,
    ultimaPergunta: pergunta
  };
}

function iaValidarPerguntaProtegida(pergunta) {
  const texto = iaNormalizarTexto(pergunta);

  const bloqueados = [
    "financeiro",
    "fluxo de caixa",
    "dre",
    "contas a pagar",
    "contas a receber",
    "crediario",
    "lucro",
    "margem",
    "rentabilidade",
    "saldo bancario",
    "preco de custo",
    "custo medio",
    "valor de custo",
    "custo da compra",
    "custo do produto",
    "custo do pedido"
  ];

  return bloqueados.find(item => texto.includes(item)) || "";
}

async function iaConsultarEstoque(plano) {
  const params = [];
  const filtrosProduto = [];
  const filtrosMovimento = [];

  if (plano.busca) {
    params.push(`%${plano.busca}%`);
    const p = params.length;

    filtrosProduto.push(`
      (
        COALESCE(TRIM(p.descricao::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.complemento::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.referencia::text),'') ILIKE $${p}
        OR COALESCE(TRIM(mk.descricao::text),'') ILIKE $${p}
        OR COALESCE(TRIM(g.descricao::text),'') ILIKE $${p}
      )
    `);
  }

  if (plano.cor) {
    params.push(`%${plano.cor}%`);
    const p = params.length;

    filtrosProduto.push(`
      (
        COALESCE(TRIM(p.corx::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.descricao::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.complemento::text),'') ILIKE $${p}
      )
    `);
  }

  if (plano.tamanho) {
    params.push(plano.tamanho);
    filtrosMovimento.push(`
      RIGHT(TRIM(m.produto::text),2) = $${params.length}
    `);
  }

  if (plano.empresas.length) {
    params.push(plano.empresas);
    filtrosMovimento.push(`
      LPAD(TRIM(m.empresa::text),2,'0')
      = ANY($${params.length}::text[])
    `);
  }

  const sql = `
    WITH produtos_filtrados AS (
      SELECT
        TRIM(p.codigo::text) AS codigo,
        TRIM(COALESCE(p.descricao::text,'')) AS produto,
        TRIM(COALESCE(p.complemento::text,'')) AS complemento,
        TRIM(COALESCE(p.corx::text,'')) AS cor,
        TRIM(COALESCE(mk.descricao::text,'')) AS marca,
        TRIM(COALESCE(g.descricao::text,'')) AS grupo,
        COALESCE(p.preco::numeric,0) AS preco_venda

      FROM produtos p

      LEFT JOIN marcas mk
        ON TRIM(mk.codigo::text) =
           TRIM(p.marca::text)

      LEFT JOIN grupos g
        ON TRIM(g.codigo::text) =
           TRIM(p.grupo::text)

      WHERE COALESCE(p.desativar,false) = FALSE

      ${
        filtrosProduto.length
          ? `AND ${filtrosProduto.join(" AND ")}`
          : ""
      }
    ),

    estoque AS (
      SELECT
        LEFT(TRIM(m.produto::text),6) AS codigo,
        RIGHT(TRIM(m.produto::text),2) AS tamanho,
        LPAD(TRIM(m.empresa::text),2,'0') AS empresa,

        SUM(
          CASE
            WHEN TRIM(COALESCE(m.movimento::text,'')) = 'E'
              THEN COALESCE(m.quantidade::numeric,0)

            WHEN TRIM(COALESCE(m.movimento::text,'')) = 'S'
              THEN -COALESCE(m.quantidade::numeric,0)

            ELSE 0
          END
        ) AS estoque

      FROM movimento m

      JOIN produtos_filtrados pf
        ON pf.codigo =
           LEFT(TRIM(m.produto::text),6)

      WHERE COALESCE(m.estoque,false) = TRUE

      ${
        filtrosMovimento.length
          ? `AND ${filtrosMovimento.join(" AND ")}`
          : ""
      }

      GROUP BY
        LEFT(TRIM(m.produto::text),6),
        RIGHT(TRIM(m.produto::text),2),
        LPAD(TRIM(m.empresa::text),2,'0')
    )

    SELECT
      e.empresa,

      COALESCE(
        NULLIF(TRIM(pe.apelido::text),''),
        NULLIF(TRIM(pe.nome::text),''),
        e.empresa
      ) AS loja,

      pf.codigo,
      pf.produto,
      pf.complemento,
      pf.cor,
      pf.marca,
      pf.grupo,
      e.tamanho,

      ROUND(COALESCE(e.estoque,0),0) AS estoque,

      ROUND(
        COALESCE(pf.preco_venda,0),
        2
      ) AS preco_venda

    FROM estoque e

    JOIN produtos_filtrados pf
      ON pf.codigo = e.codigo

    LEFT JOIN pessoas pe
      ON LPAD(
           RIGHT(TRIM(pe.codigo::text),2),
           2,
           '0'
         ) = e.empresa

     AND pe.status = 'S'
     AND pe.filial = 'T'

    WHERE COALESCE(e.estoque,0) > 0

    ORDER BY
      pf.produto,
      e.tamanho,
      e.estoque DESC,
      e.empresa

    LIMIT 300
  `;

  const resultado =
    await querySafe(sql, params, 120000);

  const linhas = (resultado.rows || []).map(item => ({
    ...item,
    preco_venda_formatado:
      iaFormatarDinheiro(item.preco_venda)
  }));

  const estoqueTotal = linhas.reduce(
    (soma, item) =>
      soma + Number(item.estoque || 0),
    0
  );

  const lojas = new Set(
    linhas.map(item => item.empresa)
  );

  const partes = [];

  if (plano.busca) {
    partes.push(plano.busca);
  }

  if (plano.cor) {
    partes.push(`cor ${plano.cor.toLowerCase()}`);
  }

  if (plano.tamanho) {
    partes.push(`número ${plano.tamanho}`);
  }

  return {
    ok: true,
    tipo: "estoque",

    resposta: linhas.length
      ? `Encontrei ${linhas.length} combinações de produto e loja para ${partes.join(", ") || "o filtro informado"}, totalizando ${Math.round(estoqueTotal)} pares disponíveis em ${lojas.size} lojas.`
      : `Não encontrei estoque disponível para ${partes.join(", ") || "o filtro informado"}.`,

    indicadores: [
      {
        rotulo: "Resultados",
        valor: linhas.length
      },
      {
        rotulo: "Estoque disponível",
        valor: Math.round(estoqueTotal)
      },
      {
        rotulo: "Lojas encontradas",
        valor: lojas.size
      }
    ],

    colunas: [
      {
        chave: "empresa",
        titulo: "Loja"
      },
      {
        chave: "loja",
        titulo: "Nome da loja"
      },
      {
        chave: "codigo",
        titulo: "Código"
      },
      {
        chave: "produto",
        titulo: "Produto"
      },
      {
        chave: "cor",
        titulo: "Cor"
      },
      {
        chave: "marca",
        titulo: "Marca"
      },
      {
        chave: "tamanho",
        titulo: "Número"
      },
      {
        chave: "estoque",
        titulo: "Estoque"
      },
      {
        chave: "preco_venda_formatado",
        titulo: "Preço de venda"
      }
    ],

    linhas
  };
}

async function iaConsultarVendas(plano) {
  const params = [];
  const filtros = [];
  const filtrosProduto = [];

  if (plano.empresas.length) {
    params.push(plano.empresas);

    filtros.push(`
      LPAD(TRIM(m.empresa::text),2,'0')
      = ANY($${params.length}::text[])
    `);
  }

  if (plano.tamanho) {
    params.push(plano.tamanho);

    filtros.push(`
      RIGHT(TRIM(m.produto::text),2)
      = $${params.length}
    `);
  }

  if (plano.busca) {
    params.push(`%${plano.busca}%`);
    const p = params.length;

    filtrosProduto.push(`
      (
        COALESCE(TRIM(p.descricao::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.complemento::text),'') ILIKE $${p}
        OR COALESCE(TRIM(mk.descricao::text),'') ILIKE $${p}
        OR COALESCE(TRIM(g.descricao::text),'') ILIKE $${p}
      )
    `);
  }

  if (plano.cor) {
    params.push(`%${plano.cor}%`);
    const p = params.length;

    filtrosProduto.push(`
      (
        COALESCE(TRIM(p.corx::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.descricao::text),'') ILIKE $${p}
        OR COALESCE(TRIM(p.complemento::text),'') ILIKE $${p}
      )
    `);
  }

  const sql = `
    SELECT
      LPAD(
        TRIM(m.empresa::text),
        2,
        '0'
      ) AS empresa,

      LEFT(
        TRIM(m.produto::text),
        6
      ) AS codigo,

      RIGHT(
        TRIM(m.produto::text),
        2
      ) AS tamanho,

      TRIM(
        COALESCE(p.descricao::text,'')
      ) AS produto,

      TRIM(
        COALESCE(p.corx::text,'')
      ) AS cor,

      TRIM(
        COALESCE(mk.descricao::text,'')
      ) AS marca,

 TRIM(
  COALESCE(g.descricao::text,'')
) AS grupo,

MAX(
  COALESCE(p.preco::numeric, 0)
) AS preco_tabela,

MAX(
  COALESCE(pr.valor_promocao, 0)
) AS valor_promocao,

MAX(
  COALESCE(pr.promocao_nome, '')
) AS promocao_nome,

SUM(
        CASE
          WHEN
            TRIM(COALESCE(m.operacao::text,'')) = 'VE'
            AND COALESCE(TRIM(v.status::text),'') = 'S'

            THEN ABS(
              COALESCE(m.quantidade::numeric,0)
            )

          WHEN
            TRIM(COALESCE(m.operacao::text,''))
            IN ('DV','VC')

            THEN -ABS(
              COALESCE(m.quantidade::numeric,0)
            )

          ELSE 0
        END
      ) AS quantidade,

      SUM(
        CASE
          WHEN
            TRIM(COALESCE(m.operacao::text,'')) = 'VE'
            AND COALESCE(TRIM(v.status::text),'') = 'S'

            THEN ABS(
              COALESCE(m.total::numeric,0)
            )

          WHEN
            TRIM(COALESCE(m.operacao::text,''))
            IN ('DV','VC')

            THEN -ABS(
              COALESCE(m.total::numeric,0)
            )

          ELSE 0
        END
      ) AS valor_vendido

    FROM movimento m

    LEFT JOIN vendas v
      ON TRIM(m.auxiliar::text) =
         TRIM(
           ('VE' || v.codigo)::char(10)
         )

    JOIN produtos p
      ON TRIM(p.codigo::text) =
         LEFT(TRIM(m.produto::text),6)

    LEFT JOIN marcas mk
      ON TRIM(mk.codigo::text) =
         TRIM(p.marca::text)

LEFT JOIN grupos g
  ON TRIM(g.codigo::text) =
     TRIM(p.grupo::text)

/*
 * Localiza a promoção vigente do produto
 * especificamente para a empresa da venda.
 */
LEFT JOIN LATERAL (
  SELECT
    COALESCE(
      NULLIF(
        TRIM(pp.condicao000001::text),
        ''
      )::numeric,
      0
    ) AS valor_promocao,

    COALESCE(
      TRIM(pc.descricao::text),
      ''
    ) AS promocao_nome

  FROM promocoes_produtos pp

  INNER JOIN promocoes_cadastro pc
    ON TRIM(pc.codigo::text) =
       TRIM(pp.promocao::text)

  WHERE pc.fim::date >= CURRENT_DATE

    AND (
      CASE
        WHEN LEFT(TRIM(pp.codigo::text), 1) = 'P'
          THEN SUBSTRING(
            TRIM(pp.codigo::text),
            2,
            6
          )

        ELSE SUBSTRING(
          TRIM(pp.codigo::text),
          1,
          6
        )
      END
    ) = LEFT(TRIM(m.produto::text), 6)

    AND (
      CASE
        WHEN LEFT(TRIM(pp.codigo::text), 1) = 'P'
          THEN SUBSTRING(
            TRIM(pp.codigo::text),
            8,
            2
          )

        ELSE SUBSTRING(
          TRIM(pp.codigo::text),
          7,
          2
        )
      END
    ) = LPAD(
      TRIM(m.empresa::text),
      2,
      '0'
    )

  ORDER BY
    pp.cadastro DESC NULLS LAST,
    pp.promocao DESC

  LIMIT 1
) pr ON TRUE

WHERE COALESCE(m.estoque,false) = TRUE
      AND m.data::date
          BETWEEN ${plano.periodo.inicioSql}
              AND ${plano.periodo.fimSql}

      AND TRIM(
        COALESCE(m.operacao::text,'')
      ) IN ('VE','DV','VC')

      ${
        filtros.length
          ? `AND ${filtros.join(" AND ")}`
          : ""
      }

      ${
        filtrosProduto.length
          ? `AND ${filtrosProduto.join(" AND ")}`
          : ""
      }

    GROUP BY
      1,
      2,
      3,
      4,
      5,
      6,
      7

    HAVING SUM(
      CASE
        WHEN
          TRIM(COALESCE(m.operacao::text,'')) = 'VE'
          AND COALESCE(TRIM(v.status::text),'') = 'S'

          THEN ABS(
            COALESCE(m.quantidade::numeric,0)
          )

        WHEN
          TRIM(COALESCE(m.operacao::text,''))
          IN ('DV','VC')

          THEN -ABS(
            COALESCE(m.quantidade::numeric,0)
          )

        ELSE 0
      END
    ) > 0

    ORDER BY
      quantidade DESC,
      produto,
      empresa

    LIMIT 300
  `;

  const resultado =
    await querySafe(sql, params, 120000);

  const linhas = (resultado.rows || []).map(item => {
    const quantidade =
      Number(item.quantidade || 0);

    const valorVendido =
      Number(item.valor_vendido || 0);

    const precoMedio =
      quantidade !== 0
        ? valorVendido / quantidade
        : 0;

const precoTabela =
  Number(item.preco_tabela || 0);

const valorPromocao =
  Number(item.valor_promocao || 0);

const promocaoNome =
  String(item.promocao_nome || "").trim();

let precoPromocaoTexto =
  `Vendido: ${iaFormatarDinheiro(precoMedio)}`;

if (precoTabela > 0) {
  precoPromocaoTexto +=
    ` | Tabela: ${iaFormatarDinheiro(precoTabela)}`;
}

if (valorPromocao > 0) {
  precoPromocaoTexto +=
    ` | Promoção: ${
      promocaoNome || "PROMOÇÃO VIGENTE"
    } — ${iaFormatarDinheiro(valorPromocao)}`;
} else {
  precoPromocaoTexto +=
    " | Sem promoção vigente";
}

return {
  ...item,

  quantidade:
    Math.round(quantidade),

  valor_vendido:
    valorVendido,

  valor_vendido_formatado:
    iaFormatarDinheiro(valorVendido),

  preco_medio:
    precoMedio,

  preco_medio_formatado:
    iaFormatarDinheiro(precoMedio),

  preco_tabela:
    precoTabela,

  preco_tabela_formatado:
    iaFormatarDinheiro(precoTabela),

  valor_promocao:
    valorPromocao,

  valor_promocao_formatado:
    valorPromocao > 0
      ? iaFormatarDinheiro(valorPromocao)
      : "",

  promocao_nome:
    promocaoNome,

  preco_promocao:
    precoPromocaoTexto
};
  });

  const quantidadeTotal =
    linhas.reduce(
      (soma, item) =>
        soma + Number(item.quantidade || 0),
      0
    );

  const valorTotal =
    linhas.reduce(
      (soma, item) =>
        soma + Number(item.valor_vendido || 0),
      0
    );

  return {
    ok: true,
    tipo: "vendas",

    resposta: linhas.length
      ? `Foram encontrados ${linhas.length} registros de vendas ${plano.periodo.descricao}, totalizando ${Math.round(quantidadeTotal)} pares e ${iaFormatarDinheiro(valorTotal)} em vendas.`
      : `Não encontrei vendas ${plano.periodo.descricao} para o filtro informado.`,

    indicadores: [
      {
        rotulo: "Quantidade vendida",
        valor: Math.round(quantidadeTotal)
      },
      {
        rotulo: "Valor vendido",
        valor: iaFormatarDinheiro(valorTotal)
      },
      {
        rotulo: "Preço médio",
        valor:
          iaFormatarDinheiro(
            quantidadeTotal > 0
              ? valorTotal / quantidadeTotal
              : 0
          )
      }
    ],

    colunas: [
      {
        chave: "empresa",
        titulo: "Loja"
      },
      {
        chave: "codigo",
        titulo: "Código"
      },
      {
        chave: "produto",
        titulo: "Produto"
      },
      {
        chave: "cor",
        titulo: "Cor"
      },
      {
        chave: "marca",
        titulo: "Marca"
      },
      {
        chave: "grupo",
        titulo: "Grupo"
      },
      {
        chave: "tamanho",
        titulo: "Número"
      },
      {
        chave: "quantidade",
        titulo: "Quantidade"
      },
      {
        chave: "valor_vendido_formatado",
        titulo: "Valor vendido"
      },
{
  chave: "preco_promocao",
  titulo: "Preço vendido / Promoção"
}
    ],

    linhas
  };
}

app.post(
  "/api/relatorios-ia/perguntar",
  async (req, res) => {
    try {
      const pergunta =
        String(req.body?.pergunta || "").trim();

      const sessaoId =
        String(
          req.body?.sessaoId ||
          req.ip ||
          "padrao"
        ).trim();

      if (!pergunta) {
        return res.status(400).json({
          ok: false,
          erro: "Digite uma pergunta."
        });
      }

      const termoBloqueado =
        iaValidarPerguntaProtegida(pergunta);

      if (termoBloqueado) {
        return res.status(403).json({
          ok: false,
          bloqueado: true,
          erro:
            "Esta informação é protegida. Os Relatórios IA não acessam custos, lucros, margens nem o módulo financeiro."
        });
      }

      const contextoAnterior =
        iaObterContexto(sessaoId);

      const plano =
        iaMontarPlano(
          pergunta,
          contextoAnterior
        );

      /*
       * Resolve nomes e grupos de lojas:
       * JPP, PALM, JPF ou parte do apelido da filial.
       */
      if (
        !plano.empresas.length &&
        plano.empresaTexto
      ) {
        plano.empresas =
          await resolveEmpresasFiltro(
            plano.empresaTexto
          );
      }

      console.log(
        "[RELATÓRIOS IA]",
        {
          sessaoId,
          pergunta,
          plano
        }
      );

      let resultado;

      if (plano.assunto === "vendas") {
        resultado =
          await iaConsultarVendas(plano);
      } else {
        resultado =
          await iaConsultarEstoque(plano);
      }

      iaSalvarContexto(
        sessaoId,
        plano
      );

      return res.json({
        ...resultado,
        pergunta,
        contexto: {
          assunto: plano.assunto,
          empresas: plano.empresas,
          empresaTexto: plano.empresaTexto || "",
          periodo:
            plano.periodo?.descricao || "",
          busca: plano.busca,
          cor: plano.cor,
          tamanho: plano.tamanho,
          agrupamento:
            plano.agrupamento
        }
      });
    } catch (erro) {
      console.error(
        "Erro POST /api/relatorios-ia/perguntar:",
        erro
      );

      return res.status(500).json({
        ok: false,
        erro: erro.message
      });
    }
  }
);

// ============================
// START
// Não executa ALTER TABLE ao iniciar.
// ============================


// =====================================================
// FINANCEIRO - CENTRAL DE RENTABILIDADE / LUCRO BRUTO
// Regra: VE - DV - VC | Lucro Bruto = Venda Líquida - CMV
// OTIMIZADO: primeiro resume movimento por venda+produto;
// só depois junta cadastro/dimensões. Formas de pagamento são
// buscadas por auxiliar somente para as vendas retornadas.
// Cliente: exclusivamente vendas.cliente -> pessoas.codigo.
// =====================================================
app.get("/api/financeiro/rentabilidade", async (req, res) => {
  try {
    // Rentabilidade: base somente das filiais cujo nome/apelido contém JP.
    const empresaRaw = "JP";
    const dataIni = String(req.query.dataIni || "").trim();
    const dataFim = String(req.query.dataFim || "").trim();
    const marca = String(req.query.marca || "").trim();
    const departamento = String(req.query.departamento || "").trim();
    const grupo = String(req.query.grupo || "").trim();
    const subgrupo = String(req.query.subgrupo || "").trim();
    const busca = String(req.query.busca || "").trim();
    const formaPagamento = String(req.query.forma || "").trim();

    if (!dataIni || !dataFim) {
      return res.status(400).json({ ok:false, erro:"Informe a data inicial e a data final." });
    }
    if (dataIni > dataFim) {
      return res.status(400).json({ ok:false, erro:"A data inicial não pode ser maior que a data final." });
    }

    let empList = await resolveEmpresasFiltro(empresaRaw);
    if (Array.isArray(req.empresasPermitidas) && req.empresasPermitidas.length) {
      const permitidas = new Set(req.empresasPermitidas.map(x =>
        String(x || "").replace(/\D/g, "").slice(-2).padStart(2, "0")
      ));
      empList = empList.filter(e => permitidas.has(e));
    }

    // Se nenhuma filial JP for encontrada/liberada, retorna vazio.
    if (!empList.length) {
      return res.json({
        ok:true,
        periodo:{dataIni,dataFim},
        resumo:{
          qtdVendida:0, valorVendido:0, custoTotal:0, lucroBruto:0,
          margemPct:0, lucroPeca:0, qtdEmpresas:0, qtdProdutos:0, qtdClientes:0
        },
        empresas:[],
        produtos:[],
        formas:[],
        aviso:"Nenhuma filial com JP no nome/apelido foi encontrada ou está liberada para este usuário."
      });
    }

    // Nome/apelido das filiais retornadas, para permitir filtro local
    // por texto (ex.: JP, JPP, parte do nome) sem nova consulta pesada.
    const nomesEmpresasMap = new Map();
    if (empList.length) {
      const rNomesEmpresas = await querySafe(`
        SELECT DISTINCT
          LPAD(RIGHT(TRIM(codigo::text),2),2,'0') AS empresa,
          TRIM(COALESCE(NULLIF(apelido::text,''),NULLIF(nome::text,''),codigo::text)) AS nome
        FROM pessoas
        WHERE status='S'
          AND filial='T'
          AND LPAD(RIGHT(TRIM(codigo::text),2),2,'0') = ANY($1::text[])
      `,[empList],15000);

      for (const e of rNomesEmpresas.rows || []) {
        nomesEmpresasMap.set(String(e.empresa||'').trim(), String(e.nome||'').trim());
      }
    }

    // -----------------------------------------------------
    // 1) FILTROS DO MOVIMENTO: aplicados ANTES dos joins.
    // -----------------------------------------------------
    const params = [dataIni, dataFim];
    const whereMov = [
      `COALESCE(m.estoque,false) = true`,
      `TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV','VC')`,
      `m.data::date BETWEEN $1::date AND $2::date`
    ];

    if (empList.length) {
      params.push(empList);
      whereMov.push(`LPAD(TRIM(m.empresa::text),2,'0') = ANY($${params.length}::text[])`);
    }

    // Forma é filtrada por EXISTS no título, sem trazer financeiro_titulos
    // para dentro da agregação principal.
    if (formaPagamento) {
      params.push(formaPagamento);
      const pForma = `$${params.length}`;
      whereMov.push(`EXISTS (
        SELECT 1
        FROM financeiro_titulos ftf
        LEFT JOIN formasnfce nff ON nff.codigo = ftf.forma
        WHERE TRIM(ftf.auxiliar::text) = TRIM(m.auxiliar::text)
          AND TRIM(COALESCE(NULLIF(nff.agrupamento::text,''),'Outros')) ILIKE ${pForma}
      )`);
    }

    // -----------------------------------------------------
    // 2) FILTROS DE CADASTRO: aplicados DEPOIS que movimento
    // já está resumido por venda + produto.
    // -----------------------------------------------------
    const whereDim = [];
    function addLikeDim(expr, value) {
      if (!value) return;
      params.push(`%${value}%`);
      whereDim.push(`${expr} ILIKE $${params.length}`);
    }

    addLikeDim(`COALESCE(mk.descricao::text,'')`, marca);
    addLikeDim(`COALESCE(d.descricao::text,'')`, departamento);
    addLikeDim(`COALESCE(g.descricao::text,'')`, grupo);
    addLikeDim(`COALESCE(sg.descricao::text,p.subgrupo::text,'')`, subgrupo);

    if (busca) {
      params.push(`%${busca}%`);
      const pBusca = `$${params.length}`;
      whereDim.push(`(
        mb.produto ILIKE ${pBusca}
        OR COALESCE(p.descricao::text,'') ILIKE ${pBusca}
        OR COALESCE(p.referencia::text,'') ILIKE ${pBusca}
        OR COALESCE(p.complemento::text,'') ILIKE ${pBusca}
        OR COALESCE(mb.cliente_nome,'') ILIKE ${pBusca}
      )`);
    }

    const sql = `
      WITH mov_base AS (
        SELECT
          LPAD(TRIM(m.empresa::text),2,'0') AS empresa,
          LEFT(TRIM(m.produto::text),6) AS produto,
          TRIM(COALESCE(m.auxiliar::text,'')) AS auxiliar_venda,
          TRIM(COALESCE(v.codigo::text,'')) AS venda,
          COALESCE(v.data::date,m.data::date) AS data_venda,
          TRIM(COALESCE(v.cliente::text,'')) AS cliente_codigo,
          COALESCE(
            NULLIF(TRIM(cli.nome::text),''),
            NULLIF(TRIM(cli.apelido::text),''),
            'CONSUMIDOR / NÃO IDENTIFICADO'
          ) AS cliente_nome,
          STRING_AGG(
            DISTINCT NULLIF(SUBSTR(LPAD(TRIM(m.produto::text),8,'0'),7,2),''),
            ' + ' ORDER BY NULLIF(SUBSTR(LPAD(TRIM(m.produto::text),8,'0'),7,2),'')
          ) AS numeracoes,
          COALESCE(SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE' THEN ABS(COALESCE(m.quantidade::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0 END),0) AS qtd_vendida,
          COALESCE(SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE' THEN ABS(COALESCE(m.total::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(m.total::numeric,0))
            ELSE 0 END),0) AS valor_vendido,
          COALESCE(SUM(CASE
            WHEN TRIM(COALESCE(m.operacao::text,''))='VE' THEN ABS(COALESCE(m.quantidade::numeric,0)*COALESCE(m.custo::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) IN ('DV','VC') THEN -ABS(COALESCE(m.quantidade::numeric,0)*COALESCE(m.custo::numeric,0))
            ELSE 0 END),0) AS custo_total
        FROM movimento m
        INNER JOIN vendas v
          ON m.auxiliar = ('VE' || v.codigo)::char(10)
        LEFT JOIN pessoas cli
          ON TRIM(cli.codigo::text) = TRIM(v.cliente::text)
        WHERE ${whereMov.join(" AND ")}
        GROUP BY 1,2,3,4,5,6,7
      )
      SELECT
        mb.*,
        COALESCE(p.descricao::text,'SEM DESCRIÇÃO') AS descricao,
        COALESCE(p.referencia::text,'') AS referencia,
        COALESCE(mk.descricao::text,'SEM MARCA') AS marca,
        COALESCE(d.descricao::text,'SEM DEPARTAMENTO') AS departamento,
        COALESCE(g.descricao::text,'SEM GRUPO') AS grupo,
        COALESCE(sg.descricao::text,p.subgrupo::text,'SEM SUBGRUPO') AS subgrupo,
        COALESCE(li.descricao::text,p.linha::text,'SEM LINHA') AS linha,
        COALESCE(forn.nome::text,p.fornecedor::text,'SEM FORNECEDOR') AS fornecedor,
        COALESCE(p.complemento::text,'SEM COMPLEMENTO') AS complemento,
        COALESCE(p.colecao::text,'SEM CAMPANHA') AS campanha,
        COALESCE(p.corx::text,'SEM COR') AS cor,
        COALESCE(p.preco::numeric,0) AS preco_venda
      FROM mov_base mb
      LEFT JOIN produtos p
        ON TRIM(p.codigo::text) = mb.produto
      LEFT JOIN marcas mk
        ON TRIM(mk.codigo::text) = TRIM(p.marca::text)
      LEFT JOIN departamentos d
        ON TRIM(d.codigo::text) = TRIM(p.departamento::text)
      LEFT JOIN grupos g
        ON TRIM(g.codigo::text) = TRIM(p.grupo::text)
      LEFT JOIN subgrupos sg
        ON TRIM(sg.codigo::text) = TRIM(p.subgrupo::text)
      LEFT JOIN linhas li
        ON TRIM(li.codigo::text) = TRIM(p.linha::text)
      LEFT JOIN pessoas forn
        ON TRIM(forn.codigo::text) = TRIM(p.fornecedor::text)
      WHERE (ABS(mb.qtd_vendida)>0.000001 OR ABS(mb.valor_vendido)>0.005 OR ABS(mb.custo_total)>0.005)
        ${whereDim.length ? `AND ${whereDim.join(" AND ")}` : ""}
      ORDER BY mb.valor_vendido DESC,mb.empresa,mb.venda,mb.produto
    `;

    // Primeiro busca o detalhe. Essa é a única leitura pesada de movimento.
    const r = await querySafe(sql,params,120000);
    const rows = r.rows || [];

    // -----------------------------------------------------
    // 3) FORMAS DE PAGAMENTO: somente para as vendas que
    // realmente apareceram no resultado. Não relê movimento.
    // -----------------------------------------------------
    const auxiliares = [...new Set(
      rows.map(x => String(x.auxiliar_venda || "").trim()).filter(Boolean)
    )];

    let formasRows = [];
    if (auxiliares.length) {
      const rFormas = await querySafe(`
        SELECT
          TRIM(COALESCE(ft.auxiliar::text,'')) AS auxiliar_venda,
          TRIM(COALESCE(NULLIF(nfce.agrupamento::text,''),'Outros')) AS forma,
          COALESCE(SUM(ABS(COALESCE(ft.valor::numeric,0))),0) AS valor,
          COUNT(*)::int AS qtd_titulos
        FROM financeiro_titulos ft
        LEFT JOIN formasnfce nfce ON nfce.codigo = ft.forma
        WHERE ft.auxiliar = ANY($1::char(10)[])
          AND LEFT(TRIM(COALESCE(ft.auxiliar::text,'')),2)='VE'
        GROUP BY 1,2
      `,[auxiliares],60000);
      formasRows = rFormas.rows || [];
    }

    const formasPorVenda = new Map();
    const formasDetalhesPorVenda = new Map();
    const resumoFormasMap = new Map();

    for (const x of formasRows) {
      const aux = String(x.auxiliar_venda || "").trim();
      const forma = String(x.forma || "Outros").trim() || "Outros";
      const valor = Number(x.valor || 0);
      const qtdTitulos = Number(x.qtd_titulos || 0);

      if (!formasPorVenda.has(aux)) formasPorVenda.set(aux, []);
      if (!formasPorVenda.get(aux).includes(forma)) formasPorVenda.get(aux).push(forma);

      if (!formasDetalhesPorVenda.has(aux)) formasDetalhesPorVenda.set(aux, []);
      formasDetalhesPorVenda.get(aux).push({ forma, valor, qtdTitulos });

      if (!resumoFormasMap.has(forma)) resumoFormasMap.set(forma,{forma,valor:0,qtdTitulos:0});
      const rf = resumoFormasMap.get(forma);
      rf.valor += valor;
      rf.qtdTitulos += qtdTitulos;
    }

    // Total vendido por venda, usado somente para ratear as formas de
    // pagamento entre os produtos daquela mesma venda. Isso permite que
    // os cards de pagamento obedeçam marca/grupo/empresa/produto etc.
    const totalVendaPorAuxiliar = new Map();
    for (const row of rows) {
      const aux = String(row.auxiliar_venda || "").trim();
      if (!aux) continue;
      const valorLinha = Math.abs(Number(row.valor_vendido || 0));
      totalVendaPorAuxiliar.set(aux,(totalVendaPorAuxiliar.get(aux)||0)+valorLinha);
    }


    // -----------------------------------------------------
    // 4) PROMOÇÃO VIGENTE: busca leve e separada.
    // Consulta somente produtos/empresas que já vieram da
    // Rentabilidade e monta um mapa em memória.
    // -----------------------------------------------------
    const produtosCodigos = [...new Set(
      rows.map(x => String(x.produto || "").trim()).filter(Boolean)
    )];
    const empresasCodigos = [...new Set(
      rows.map(x => String(x.empresa || "").trim()).filter(Boolean)
    )];

    const promocaoPorProdutoEmpresa = new Map();

    if (produtosCodigos.length && empresasCodigos.length) {
      const rPromo = await querySafe(`
        SELECT DISTINCT ON (produto,empresa)
          produto,
          empresa,
          valor_promocao
        FROM (
          SELECT
            CASE
              WHEN LEFT(TRIM(pp.codigo),1)='P'
                THEN SUBSTRING(TRIM(pp.codigo),2,6)
              ELSE SUBSTRING(TRIM(pp.codigo),1,6)
            END AS produto,
            LPAD(
              CASE
                WHEN LEFT(TRIM(pp.codigo),1)='P'
                  THEN SUBSTRING(TRIM(pp.codigo),8,2)
                ELSE SUBSTRING(TRIM(pp.codigo),7,2)
              END,
              2,
              '0'
            ) AS empresa,
            COALESCE(
              NULLIF(TRIM(pp.condicao000001::text),'')::numeric,
              0
            ) AS valor_promocao,
            pp.cadastro,
            pp.promocao
          FROM promocoes_produtos pp
          INNER JOIN promocoes_cadastro pc
            ON TRIM(pc.codigo::text)=TRIM(pp.promocao::text)
          WHERE pc.fim::date >= CURRENT_DATE
            AND COALESCE(pp.cadastro::date,CURRENT_DATE) <= CURRENT_DATE
            AND (
              CASE
                WHEN LEFT(TRIM(pp.codigo),1)='P'
                  THEN SUBSTRING(TRIM(pp.codigo),2,6)
                ELSE SUBSTRING(TRIM(pp.codigo),1,6)
              END
            ) = ANY($1::text[])
            AND LPAD(
              CASE
                WHEN LEFT(TRIM(pp.codigo),1)='P'
                  THEN SUBSTRING(TRIM(pp.codigo),8,2)
                ELSE SUBSTRING(TRIM(pp.codigo),7,2)
              END,
              2,
              '0'
            ) = ANY($2::text[])
            AND COALESCE(
              NULLIF(TRIM(pp.condicao000001::text),'')::numeric,
              0
            ) > 0
        ) p
        ORDER BY produto,empresa,cadastro DESC NULLS LAST,promocao DESC
      `,[produtosCodigos,empresasCodigos],30000);

      for (const p of rPromo.rows || []) {
        promocaoPorProdutoEmpresa.set(
          `${String(p.empresa||"").trim()}|${String(p.produto||"").trim()}`,
          Number(p.valor_promocao || 0)
        );
      }
    }

    const produtos = rows.map(x => {
      const qtdVendida = Number(x.qtd_vendida || 0);
      const valorVendido = Number(x.valor_vendido || 0);
      const custoTotal = Number(x.custo_total || 0);
      const lucroBruto = valorVendido - custoTotal;
      const aux = String(x.auxiliar_venda || "").trim();
      const formasVenda = formasPorVenda.get(aux) || [];
      const detalhesVenda = formasDetalhesPorVenda.get(aux) || [];
      const totalVendaAbs = Number(totalVendaPorAuxiliar.get(aux) || 0);
      const pesoLinha = totalVendaAbs > 0
        ? Math.abs(valorVendido) / totalVendaAbs
        : 0;

      const formasPagamentoDetalhes = detalhesVenda.map(fp => ({
        forma:fp.forma,
        // valor real recebido na forma, rateado proporcionalmente
        // pelo valor deste produto dentro da venda.
        valor:Number(fp.valor || 0) * pesoLinha
      }));

      return {
        empresa:x.empresa,
        empresaNome:nomesEmpresasMap.get(String(x.empresa||'').trim()) || "",
        venda:x.venda || "",
        dataVenda:x.data_venda || null,
        produto:x.produto,
        numeracao:x.numeracoes || "-",
        clienteCodigo:x.cliente_codigo || "",
        cliente:x.cliente_nome || "CONSUMIDOR / NÃO IDENTIFICADO",
        descricao:x.descricao,
        referencia:x.referencia || '',
        marca:x.marca,
        departamento:x.departamento,
        grupo:x.grupo,
        subgrupo:x.subgrupo,
        linha:x.linha,
        fornecedor:x.fornecedor,
        complemento:x.complemento,
        campanha:x.campanha,
        cor:x.cor,
        precoVenda:Number(x.preco_venda || 0),
        valorPromocao:Number(
          promocaoPorProdutoEmpresa.get(
            `${String(x.empresa||"").trim()}|${String(x.produto||"").trim()}`
          ) || 0
        ),
        auxiliarVenda:aux,
        formasPagamento:formasVenda.length ? formasVenda.join(" + ") : "Não identificado",
        formasPagamentoDetalhes,
        qtdVendida,valorVendido,custoTotal,lucroBruto,
        margemPct:valorVendido!==0?(lucroBruto/valorVendido)*100:0,
        precoMedio:qtdVendida!==0?valorVendido/qtdVendida:0,
        custoMedio:qtdVendida!==0?custoTotal/qtdVendida:0,
        lucroPeca:qtdVendida!==0?lucroBruto/qtdVendida:0
      };
    });

    const mapaEmpresas = new Map();
    for (const x of produtos) {
      if (!mapaEmpresas.has(x.empresa)) {
        mapaEmpresas.set(x.empresa,{empresa:x.empresa,qtdVendida:0,valorVendido:0,custoTotal:0,lucroBruto:0});
      }
      const e = mapaEmpresas.get(x.empresa);
      e.qtdVendida += x.qtdVendida;
      e.valorVendido += x.valorVendido;
      e.custoTotal += x.custoTotal;
      e.lucroBruto += x.lucroBruto;
    }

    const empresas = [...mapaEmpresas.values()].map(e => ({
      ...e,
      margemPct:e.valorVendido!==0?(e.lucroBruto/e.valorVendido)*100:0,
      lucroPeca:e.qtdVendida!==0?e.lucroBruto/e.qtdVendida:0
    })).sort((a,b)=>b.lucroBruto-a.lucroBruto);

    const resumo = produtos.reduce((a,x)=>{
      a.qtdVendida += x.qtdVendida;
      a.valorVendido += x.valorVendido;
      a.custoTotal += x.custoTotal;
      a.lucroBruto += x.lucroBruto;
      return a;
    },{qtdVendida:0,valorVendido:0,custoTotal:0,lucroBruto:0});

    resumo.margemPct = resumo.valorVendido!==0?(resumo.lucroBruto/resumo.valorVendido)*100:0;
    resumo.lucroPeca = resumo.qtdVendida!==0?resumo.lucroBruto/resumo.qtdVendida:0;
    resumo.qtdEmpresas = empresas.length;
    resumo.qtdProdutos = new Set(produtos.map(x=>`${x.empresa}|${x.produto}`)).size;
    resumo.qtdClientes = new Set(produtos.map(x=>String(x.clienteCodigo||"").trim()).filter(Boolean)).size;

    const formas = [...resumoFormasMap.values()].sort((a,b)=>b.valor-a.valor);
    const totalFormas = formas.reduce((a,x)=>a+x.valor,0);
    formas.forEach(x => x.percentual = totalFormas!==0?(x.valor/totalFormas)*100:0);

    return res.json({
      ok:true,
      periodo:{dataIni,dataFim},
      filtroForma:formaPagamento,
      resumo,
      empresas,
      produtos,
      formas
    });
  } catch (err) {
    console.error("Erro /api/financeiro/rentabilidade:",err);
    return res.status(500).json({ok:false,erro:err.message});
  }
});


process.on("unhandledRejection",(reason)=>{
  console.error(
    "[NODE] Promise rejeitada sem tratamento:",
    reason?.stack || reason?.message || reason
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log("Conectado ao PostgreSQL 🚀");

  otbEngine.iniciar()
    .catch(e => {
      console.error("[OTB CACHE] Não foi possível iniciar o motor:", e.message);
    });
});
