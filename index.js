
require("dotenv").config();

const express = require("express");
const basicAuth = require("express-basic-auth");
const { Pool } = require("pg");
const poolAtendimento = new Pool({
  host: "localhost",
  port: 5432,
  database: "atendimento_vendedores",
  user: "postgres",
  password: "123456",
  ssl: false
});
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);

// ============================
// BASIC AUTH
// ============================
const CAT_USER = (process.env.CAT_USER || "").toString().trim();
let CAT_PASS = (process.env.CAT_PASS || "").toString().trim();
let CAT_CUSTO_PASS = (process.env.CAT_CUSTO_PASS || "").toString().trim();

if (
  (CAT_PASS.startsWith('"') && CAT_PASS.endsWith('"')) ||
  (CAT_PASS.startsWith("'") && CAT_PASS.endsWith("'"))
) {
  CAT_PASS = CAT_PASS.slice(1, -1).trim();
}

if (
  (CAT_CUSTO_PASS.startsWith('"') && CAT_CUSTO_PASS.endsWith('"')) ||
  (CAT_CUSTO_PASS.startsWith("'") && CAT_CUSTO_PASS.endsWith("'"))
) {
  CAT_CUSTO_PASS = CAT_CUSTO_PASS.slice(1, -1).trim();
}

app.use(
  basicAuth({
    users: { [CAT_USER]: CAT_PASS },
    challenge: true,
  })
);

// ============================
// SITE (public)
// ============================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/index_dark.html", (req, res) => res.redirect("/index.html"));
app.get("/catalogo", (req, res) => res.redirect("/index.html"));
app.get("/catalogo-cliente", (req, res) => res.redirect("/catalogo_cliente.html"));
app.get("/otb", (req, res) => res.redirect("/otb.html"));
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

pool.on("connect", async (client) => {
  try {
    await client.query(
      `SET statement_timeout TO ${Number(process.env.DB_STATEMENT_TIMEOUT || 180000)}`
    );
  } catch (e) {
    console.error("⚠️ Falha ao aplicar statement_timeout:", e.message);
  }
});

pool.on("error", (err) => {
  console.error("⚠️ Erro inesperado no pool PostgreSQL:", err.message);
});

async function querySafe(sql, params = [], ms = 180000) {
  const client = await pool.connect();
  try {
    return await client.query({
      text: sql,
      values: params,
      query_timeout: Math.max(1000, Number(ms || 180000)),
    });
  } finally {
    client.release();
  }
}

// ============================
// HELPERS
// ============================
function parseTam(raw) {
  const t = String(raw || "").trim();
  if (!t) return "";
  return t.padStart(2, "0");
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
  return await resolveCodigosGenericos({
    raw,
    tabela: "departamentos",
    colunaCodigo: "codigo",
    colunaDescricao: "descricao",
  });
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
// CATÁLOGO
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
    const lim = Math.min(Math.max(parseInt(limit || "500", 10) || 500, 1), 5000);
    const rupturaNum = clampInt(ruptura, 0, 6, 0);
    
    const depCodigos = await resolveDepartamentoCodigos(departamento);
const grpCodigos = await resolveGrupoCodigos(grupo);
const marcaCodigos = await resolveMarcaCodigos(marca);
const fornCodigos = await resolveFornecedorCodigos(fornecedor);
const linhaTokens = parseMultiTokens(linha);
const colecaoCodigos = await resolveColecaoCodigos(colecao);
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

        COALESCE(vd.mov_venda_2d, 0) AS mov_venda_2d,
        COALESCE(vd.mov_venda_1m, 0) AS mov_venda_1m,
        COALESCE(vd.mov_venda_2m, 0) AS mov_venda_2m,

        COALESCE(pt.pedidos_abertos, 0) AS pedidos_abertos,
        COALESCE(pt.pedidos_conferidos, 0) AS pedidos_conferidos,
        COALESCE(pt.pedidos_total, 0) AS pedidos_total,
        COALESCE(pe.pedidos_empresas, '') AS pedidos_empresas,

        (COALESCE(et.estoque, 0) + COALESCE(pt.pedidos_abertos, 0)) AS estoque_com_abertos,
        (COALESCE(et.estoque, 0) + COALESCE(pt.pedidos_total, 0)) AS estoque_com_todos,

        COALESCE(pa.promocao_codigo, '') AS promocao_codigo,
        COALESCE(pa.promocao_valor, 0)   AS promocao_valor,
        COALESCE(pa.promocao_valor, 0)   AS promocao,
COALESCE(pa.promocao_nome, '')   AS promocao_nome,
        pa.cadastro                      AS promocao_cadastro,
COALESCE(pa.usuario, '')        AS promocao_usuario,

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

    const r = await querySafe(sql, params, 60000);
    res.json({ codigo, data: r.rows || [] });
  } catch (e) {
    res.status(500).json({ erro: e.message });
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

    const visao = String(req.query.visao || "produto").toLowerCase();
    const limit = clampInt(req.query.limit, 1, 20000, 3000);

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
          (date_trunc('month', CURRENT_DATE) - interval '12 month')::date AS m1,
          (date_trunc('month', CURRENT_DATE) - interval '11 month')::date AS m2,
          (date_trunc('month', CURRENT_DATE) - interval '10 month')::date AS m3,
          (date_trunc('month', CURRENT_DATE) - interval '9 month')::date AS m4,
          (date_trunc('month', CURRENT_DATE) - interval '8 month')::date AS m5,
          (date_trunc('month', CURRENT_DATE) - interval '7 month')::date AS m6,
          (date_trunc('month', CURRENT_DATE) - interval '6 month')::date AS m7,
          (date_trunc('month', CURRENT_DATE) - interval '5 month')::date AS m8,
          (date_trunc('month', CURRENT_DATE) - interval '4 month')::date AS m9,
          (date_trunc('month', CURRENT_DATE) - interval '3 month')::date AS m10,
          (date_trunc('month', CURRENT_DATE) - interval '2 month')::date AS m11,
          (date_trunc('month', CURRENT_DATE) - interval '1 month')::date AS m12
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
          AND m.data::date <  (SELECT mes_atual FROM meses)
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

    res.json({
      ok: true,
      visao,
      min_dias: minDias,
      periodos: getClosedMonthLabels(),
      resumo,
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

    if (!codigo) {
      return res.status(400).json({ ok: false, erro: "Informe o código do produto." });
    }

    const empList = await resolveEmpresasFiltro(empresasRaw);

    const params = [codigo];
    let empMovSql = "";
    let empEstSql = "";

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach((e) => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");

      empMovSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
      empEstSql = ` AND LPAD(TRIM(m.empresa::text), 2, '0') IN (${ph}) `;
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
        LEFT JOIN pessoas pe
          ON TRIM(pe.codigo::text) = z.cod_fornecedor
      ) pf ON TRUE
      WHERE TRIM(pr.codigo) = $1
      LIMIT 1;
    `;

    const sqlMesLoja = `
      WITH meses AS (
        SELECT generate_series(
          (date_trunc('month', CURRENT_DATE) - interval '12 month')::date,
          (date_trunc('month', CURRENT_DATE) - interval '1 month')::date,
          interval '1 month'
        )::date AS mes_ref
      ),
      lojas AS (
        SELECT DISTINCT LPAD(TRIM(m.empresa::text), 2, '0') AS empresa
        FROM movimento m
        WHERE LEFT(TRIM(m.produto)::text, 6) = $1
          ${empEstSql}
      ),
      base AS (
        SELECT
          ms.mes_ref,
          lj.empresa
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
          AND m.data::date >= (date_trunc('month', CURRENT_DATE) - interval '12 month')::date
          AND m.data::date <  date_trunc('month', CURRENT_DATE)::date
          ${empMovSql}
        GROUP BY 1, 2
      )
      SELECT
        TO_CHAR(b.mes_ref, 'MM/YYYY') AS mes,
        b.empresa,
        COALESCE(v.vendas, 0) AS vendas
      FROM base b
      LEFT JOIN vendas v
        ON v.mes_ref = b.mes_ref
       AND v.empresa = b.empresa
      ORDER BY b.mes_ref, b.empresa;
    `;

    const sqlEstoqueLoja = `
      SELECT
        LPAD(TRIM(m.empresa::text), 2, '0') AS empresa,
        SUM(${sumMovExpr("m")}) AS estoque
      FROM movimento m
      WHERE LEFT(TRIM(m.produto)::text, 6) = $1
        AND m.estoque
        ${empEstSql}
      GROUP BY 1
      ORDER BY 1;
    `;

    const [rProduto, rMesLoja, rEstoqueLoja] = await Promise.all([
      querySafe(sqlProduto, [codigo], 60000),
      querySafe(sqlMesLoja, params, 90000),
      querySafe(sqlEstoqueLoja, params, 90000),
    ]);

    res.json({
      ok: true,
      produto: rProduto.rows?.[0] || { codigo, foto_url: `/foto?codigo=${codigo}` },
      mes_loja: rMesLoja.rows || [],
      estoque_loja: rEstoqueLoja.rows || [],
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
      params.push(`%${complemento}%`);
      filtrosBaseProd += ` AND COALESCE(pr.complemento, '') ILIKE $${params.length} `;
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

app.get("/api/financeiro/meta-real-competencia", app._router ? (req, res, next) => next() : async (req, res) => {
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
    // ==========================
// FATURAMENTO DRE
// usa MOVIMENTO + VENDAS
// ==========================
const paramsFat = [];
const whereFat = [`1=1`];

if (empList.length) {
  const start = paramsFat.length + 1;
  empList.forEach((e) => paramsFat.push(e));
  const ph = empList.map((_, i) => `$${start + i}`).join(",");
  whereFat.push(`LPAD(TRIM(COALESCE(m.empresa::text,'')),2,'0') IN (${ph})`);
}

if (dataIni) {
  paramsFat.push(dataIni);
  whereFat.push(`m.data::date >= $${paramsFat.length}`);
}

if (dataFim) {
  paramsFat.push(dataFim);
  whereFat.push(`m.data::date <= $${paramsFat.length}`);
}

if (tipo && String(tipo).trim().toLowerCase() !== "todos") {
  paramsFat.push(String(tipo).trim());
  whereFat.push(`TRIM(COALESCE(c.tipo::text,'')) = $${paramsFat.length}`);
}

const sqlFat = `
  SELECT COALESCE(
    SUM(
      COALESCE(m.total,0) *
      (
        COALESCE(v.total,0) /
        NULLIF(COALESCE(v.subtotal,0),0)
      )
    ),
    0
  ) AS total_faturado
  FROM movimento m
  INNER JOIN vendas v
    ON m.auxiliar = ('VE' || v.codigo)::char(10)
  INNER JOIN condicoes c
    ON TRIM(COALESCE(v.condicoes::text,'')) = TRIM(COALESCE(c.codigo::text,''))
  WHERE ${whereFat.join(" AND ")}
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
`;

const fatRes = await querySafe(sqlFat, paramsFat, 45000);
const totalFaturado = Number(fatRes.rows?.[0]?.total_faturado || 0);

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

    const sqlPag = `
      SELECT
        COALESCE(TRIM(ft.item::text),'') AS item,
        COALESCE(SUM(COALESCE(ft.valorpago,0)),0) AS total
      FROM financeiro_titulos ft
      WHERE ${wherePag.join(" AND ")}
      GROUP BY COALESCE(TRIM(ft.item::text),'')
    `;

    const pagRes = await querySafe(sqlPag, paramsPag, 45000);
    const pagamentosPorItem = new Map(
      (pagRes.rows || []).map((x) => [String(x.item || "").trim(), Number(x.total || 0)])
    );

    const linhas = metas.map((m) => {
      const realizado = Number(pagamentosPorItem.get(String(m.item || "").trim()) || 0);
      const percMeta = m.meta > 0 ? (realizado / m.meta) * 100 : 0;

      return {
        grupo: m.grupo,
        item: m.item,
        descricao: m.descricao,
        meta: Number(m.meta || 0),
        realizado,
        diferenca: realizado - Number(m.meta || 0),
        percMeta
      };
    });

    const totalMeta = linhas.reduce((a, x) => a + Number(x.meta || 0), 0);
    const totalPagamentos = linhas.reduce((a, x) => a + Number(x.realizado || 0), 0);
    const diferencaTotal = totalPagamentos - totalMeta;
    const percTotal = totalMeta > 0 ? (totalPagamentos / totalMeta) * 100 : 0;

    return res.json({
      ok: true,
      resumo: {
        total_faturado: totalFaturado,
        total_meta: totalMeta,
        total_pagamentos: totalPagamentos,
        diferenca_total: diferencaTotal,
        perc_total: percTotal
      },
      data: linhas
    });
  } catch (err) {
    console.error("Erro /api/financeiro/meta-real:", err);
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
    "99-NAO CLASSIFICADO": [],
  };

  return mapa[String(grupo || "").trim()] || [];
}

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

app.get("/api/financeiro/meta-real-detalhe", async (req, res) => {
  try {
    const {
      empresa = "todas",
      dataIni = "",
      dataFim = "",
      grupo = "",
      tipo = "todos",
    } = req.query;

    const grupoSel = String(grupo || "").trim();
    if (!grupoSel) {
      return res.status(400).json({ erro: "Informe o grupo do DRE." });
    }

    const itensGrupo = [];
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const paramsBase = [];
    const where = [
      `UPPER(TRIM(COALESCE(ft.rp::text,''))) = 'P'`,
      `ft.status = 'B'`,
      `ft.pagamento IS NOT NULL`,
      `COALESCE(ft.valorpago,0) > 0`,
      `COALESCE(TRIM(ft.item::text), '') <> ''`
    ];

    if (empList.length) {
      const start = paramsBase.length + 1;
      empList.forEach((e) => paramsBase.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')), 2, '0') IN (${ph})`);
    }

    if (dataIni) {
      paramsBase.push(dataIni);
      where.push(`ft.pagamento::date >= $${paramsBase.length}`);
    }

    if (dataFim) {
      paramsBase.push(dataFim);
      where.push(`ft.pagamento::date <= $${paramsBase.length}`);
    }

    if (tipo && String(tipo).trim().toLowerCase() !== "todos") {
      paramsBase.push(String(tipo).trim());
      where.push(`TRIM(COALESCE(ft.tipo::text,'')) = $${paramsBase.length}`);
    }

    // filtro do grupo já no SQL
    if (itensGrupo.length) {
      const start = paramsBase.length + 1;
      itensGrupo.forEach((it) => paramsBase.push(it));
      const ph = itensGrupo.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.item::text,'')), 3, '0') IN (${ph})`);
    } else if (grupoSel === "99-NAO CLASSIFICADO") {
      const todosClassificados = Object.values(getItensGrupoDRE("01-COMPRAS"))
        .concat(
          getItensGrupoDRE("02-EMPRESTIMOS"),
          getItensGrupoDRE("03-IMPOSTOS"),
          getItensGrupoDRE("04-ROYALTES"),
          getItensGrupoDRE("05-ALUGUEL"),
          getItensGrupoDRE("06-ENERGIA"),
          getItensGrupoDRE("07-PROLABORE"),
          getItensGrupoDRE("08-PROL PALMARES"),
          getItensGrupoDRE("09-COLABORADOR"),
          getItensGrupoDRE("10-INVEST EMPRESA"),
          getItensGrupoDRE("11-DESPESA GERAL"),
          getItensGrupoDRE("12-DIVIDENDO"),
          getItensGrupoDRE("13-DESPESA FINANCEIRA"),
          getItensGrupoDRE("14-MENS SISTEMA")
        );

      const start = paramsBase.length + 1;
      todosClassificados.forEach((it) => paramsBase.push(it));
      const ph = todosClassificados.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ft.item::text,'')), 3, '0') NOT IN (${ph})`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

const sqlItens = `
  SELECT
    LPAD(TRIM(COALESCE(ft.item::text,'')),3,'0') AS item_codigo,
    COALESCE(NULLIF(TRIM(fi.descricao::text),''), 'SEM DESCRIÇÃO') AS item_descricao,
    COUNT(*) AS qtd_titulos,
    COALESCE(SUM(COALESCE(ft.valorpago,0)),0) AS valor
  FROM financeiro_titulos ft
  LEFT JOIN financeiro_itens fi
    ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
  ${whereSql}
  GROUP BY 1,2
  ORDER BY 4 DESC, 2
`;
const itens = (rItens.rows || [])
  .map((x) => ({
    item: String(x.item_codigo || "").trim(),
    descricao: String(x.item_descricao || "").trim(),
    qtdTitulos: Number(x.qtd_titulos || 0),
    valor: Number(x.valor || 0),
  }))
  .filter((x) => classificarTipoDespesaDRE(x.item) === grupoSel);

    const sqlTitulos = `
      SELECT
        ft.pagamento::date AS data_ref,
        LPAD(TRIM(COALESCE(ft.empresa::text,'')), 2, '0') AS empresa,
        COALESCE(ft.codigo::text, ft.documento::text, '-') AS documento,
        LPAD(TRIM(COALESCE(ft.item::text,'')), 3, '0') AS item_codigo,
        COALESCE(NULLIF(TRIM(fi.descricao::text), ''), 'SEM DESCRIÇÃO') AS item_descricao,
        COALESCE(
          NULLIF(TRIM(pes.apelido::text), ''),
          NULLIF(TRIM(pes.nome::text), ''),
          TRIM(COALESCE(ft.pessoa::text, '-'))
        ) AS pessoa,
        COALESCE(ft.instrucoes::text, '-') AS instrucoes,
        COALESCE(ft.complemento::text, '-') AS complemento,
        COALESCE(ft.valorpago,0) AS valor
      FROM financeiro_titulos ft
      LEFT JOIN financeiro_itens fi
        ON TRIM(COALESCE(fi.codigo::text,'')) = TRIM(COALESCE(ft.item::text,''))
      LEFT JOIN pessoas pes
        ON TRIM(COALESCE(pes.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      ${whereSql}
ORDER BY ft.pagamento DESC
      LIMIT 150
    `;

    const [rItens, rTitulos] = await Promise.all([
      querySafe(sqlItens, paramsBase, 60000),
      querySafe(sqlTitulos, paramsBase, 60000),
    ]);

    const itensDetalhe = (rItens.rows || []).map((x) => ({
      item: String(x.item_codigo || "").trim(),
      descricao: String(x.item_descricao || "").trim(),
      qtdTitulos: Number(x.qtd_titulos || 0),
      valor: Number(x.valor || 0),
    }));

    const titulos = (rTitulos.rows || []).map((x) => ({
      data: x.data_ref,
      empresa: String(x.empresa || "").trim(),
      documento: String(x.documento || "-").trim(),
      item: String(x.item_codigo || "").trim(),
      descricao: String(x.item_descricao || "").trim(),
      pessoa: String(x.pessoa || "-").trim(),
      instrucoes: String(x.instrucoes || "-").trim(),
      complemento: String(x.complemento || "-").trim(),
      valor: Number(x.valor || 0),
    }));

    const totalGrupo = itens.reduce((s, x) => s + Number(x.valor || 0), 0);
    const metas = getMetasDRE();

    return res.json({
      ok: true,
      grupo: grupoSel,
      meta: Number(metas[grupoSel] || 0),
      totalGrupo,
      qtdTitulos: titulos.length,
      qtdItens: itens.length,
      itens: itensDetalhe,
      titulos,
      baseData: "pagamento"
    });
  } catch (err) {
    console.error("Erro /api/financeiro/meta-real-detalhe:", err);
    res.status(500).json({ erro: err.message });
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

// ======================================================
// CONCILIAÇÃO - RESUMO GERAL
// ======================================================
app.get("/api/conciliacao/resumo", async (req, res) => {
  try {
    const { empresa = "", dataIni = "", dataFim = "" } = req.query;
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const params = [];
    const whereBase = [];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereBase.push(`LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (dataIni) { params.push(dataIni); whereBase.push(`ca.data_ajuste::date >= $${params.length}`); }
    if (dataFim) { params.push(dataFim); whereBase.push(`ca.data_ajuste::date <= $${params.length}`); }

    const where = whereBase.length ? `WHERE ${whereBase.join(" AND ")}` : "";

    const sqlAjustes = `
      SELECT
        COUNT(*) AS total_ajustes,
        COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'C' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS total_credito,
        COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'D' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS total_debito,
        COALESCE(SUM(COALESCE(ca.valor_bruto::numeric,0)),0) AS valor_bruto_total,
        COALESCE(SUM(COALESCE(ca.valor_liquido::numeric,0)),0) AS valor_liquido_total,
        COUNT(CASE WHEN ca.data_pagamento IS NOT NULL THEN 1 END) AS qtd_pagos,
        COUNT(CASE WHEN ca.data_pagamento IS NULL THEN 1 END) AS qtd_pendentes
      FROM conciliacao_ajustes ca
      ${where}
    `;

    const paramsEq = [];
    const whereEq = [];
    if (empList.length) {
      const start = paramsEq.length + 1;
      empList.forEach(e => paramsEq.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereEq.push(`LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') IN (${ph})`);
    }
    const whereEqSql = whereEq.length ? `WHERE ${whereEq.join(" AND ")}` : "";

    const sqlEquals = `
      SELECT
        COUNT(*) AS total_conciliacoes,
        COUNT(CASE WHEN ce.status = 1 THEN 1 END) AS conciliadas,
        COUNT(CASE WHEN ce.status = 2 THEN 1 END) AS divergentes,
        COUNT(CASE WHEN ce.status = 0 THEN 1 END) AS pendentes,
        COUNT(CASE WHEN ce.status = 3 THEN 1 END) AS erros
      FROM conciliacao_equals_lite ce
      ${whereEqSql}
    `;

    const paramsReg = [];
    const whereReg = [];
    if (empList.length) {
      const start = paramsReg.length + 1;
      empList.forEach(e => paramsReg.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereReg.push(`LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (dataIni) { paramsReg.push(dataIni); whereReg.push(`cr.dtvenda::date >= $${paramsReg.length}`); }
    if (dataFim) { paramsReg.push(dataFim); whereReg.push(`cr.dtvenda::date <= $${paramsReg.length}`); }
    const whereRegSql = whereReg.length ? `WHERE ${whereReg.join(" AND ")}` : "";

    const sqlRegistros = `
      SELECT
        COUNT(*) AS total_registros,
        COUNT(DISTINCT TRIM(COALESCE(cr.bandeira::text,''))) AS qtd_bandeiras,
        COUNT(DISTINCT TRIM(COALESCE(cr.empresa::text,''))) AS qtd_empresas,
        COALESCE(SUM(COALESCE(cr.vlbrutovenda::numeric,0)),0) AS valor_bruto_total,
        COUNT(CASE WHEN COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') <> '' THEN 1 END) AS qtd_conciliados,
        COUNT(CASE WHEN COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') = '' THEN 1 END) AS qtd_nao_conciliados
      FROM conciliacao_cartao_registros cr
      ${whereRegSql}
    `;

    const [rAj, rEq, rReg] = await Promise.all([
      querySafe(sqlAjustes, params, 30000),
      querySafe(sqlEquals, paramsEq, 30000),
      querySafe(sqlRegistros, paramsReg, 30000),
    ]);

    const aj = rAj.rows?.[0] || {};
    const eq = rEq.rows?.[0] || {};
    const reg = rReg.rows?.[0] || {};

    return res.json({
      ok: true,
      ajustes: {
        total: Number(aj.total_ajustes || 0),
        totalCredito: Number(aj.total_credito || 0),
        totalDebito: Number(aj.total_debito || 0),
        valorBrutoTotal: Number(aj.valor_bruto_total || 0),
        valorLiquidoTotal: Number(aj.valor_liquido_total || 0),
        qtdPagos: Number(aj.qtd_pagos || 0),
        qtdPendentes: Number(aj.qtd_pendentes || 0),
      },
      conciliacao: {
        total: Number(eq.total_conciliacoes || 0),
        conciliadas: Number(eq.conciliadas || 0),
        divergentes: Number(eq.divergentes || 0),
        pendentes: Number(eq.pendentes || 0),
        erros: Number(eq.erros || 0),
        taxaConciliacao: Number(eq.total_conciliacoes || 0) > 0
          ? (Number(eq.conciliadas || 0) / Number(eq.total_conciliacoes || 0)) * 100
          : 0,
      },
      cartao: {
        totalRegistros: Number(reg.total_registros || 0),
        qtdBandeiras: Number(reg.qtd_bandeiras || 0),
        qtdEmpresas: Number(reg.qtd_empresas || 0),
        valorBrutoTotal: Number(reg.valor_bruto_total || 0),
        qtdConciliados: Number(reg.qtd_conciliados || 0),
        qtdNaoConciliados: Number(reg.qtd_nao_conciliados || 0),
        taxaConciliacao: Number(reg.total_registros || 0) > 0
          ? (Number(reg.qtd_conciliados || 0) / Number(reg.total_registros || 0)) * 100
          : 0,
      },
    });
  } catch (err) {
    console.error("Erro /api/conciliacao/resumo:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ======================================================
// CONCILIAÇÃO - AJUSTES
// ======================================================
app.get("/api/conciliacao/ajustes", async (req, res) => {
  try {
    const { empresa = "", dataIni = "", dataFim = "", tipo_ajuste = "", limit = "200" } = req.query;
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    const lim = Math.min(Math.max(parseInt(String(limit || "200"), 10) || 200, 1), 1000);

    const params = [];
    const where = [];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (dataIni) { params.push(dataIni); where.push(`ca.data_ajuste::date >= $${params.length}`); }
    if (dataFim) { params.push(dataFim); where.push(`ca.data_ajuste::date <= $${params.length}`); }
    if (tipo_ajuste) { params.push(tipo_ajuste); where.push(`TRIM(COALESCE(ca.tipo_ajuste::text,'')) = $${params.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    params.push(lim);

    const sql = `
      SELECT
        ca.codigo,
        LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') AS empresa,
        ca.data_ajuste::date AS data_ajuste,
        TRIM(COALESCE(ca.tipo_ajuste::text,'')) AS tipo_ajuste,
        COALESCE(ca.valor_bruto::numeric,0) AS valor_bruto,
        COALESCE(ca.valor_liquido::numeric,0) AS valor_liquido,
        ca.data_previsao_pagto::date AS data_previsao_pagto,
        ca.data_pagamento::date AS data_pagamento,
        COALESCE(ca.observacao::text,'') AS observacao,
        COALESCE(ca.lote_do_ajuste::text,'') AS lote_do_ajuste,
        COALESCE(ca.id_lote::text,'') AS id_lote,
        ca.parcela_lote,
        COALESCE(cat.descricao::text,'') AS tipo_descricao,
        COALESCE(cat.operacao::text,'') AS operacao,
        COALESCE(cat.operadora::text,'') AS operadora,
        CASE WHEN ca.data_pagamento IS NOT NULL THEN 'PAGO' ELSE 'PENDENTE' END AS situacao
      FROM conciliacao_ajustes ca
      LEFT JOIN conciliacao_ajustes_tipos cat
        ON TRIM(COALESCE(cat.codigo_tipo_seta::text,'')) = TRIM(COALESCE(ca.tipo_ajuste::text,''))
      ${whereSql}
      ORDER BY ca.data_ajuste DESC, ca.codigo DESC
      LIMIT $${params.length}
    `;

    const r = await querySafe(sql, params, 60000);
    return res.json({
      ok: true,
      total: r.rows?.length || 0,
      data: (r.rows || []).map(x => ({
        codigo: x.codigo,
        empresa: x.empresa || "-",
        dataAjuste: x.data_ajuste,
        tipoAjuste: x.tipo_ajuste || "-",
        tipoDescricao: x.tipo_descricao || "-",
        operacao: x.operacao || "-",
        operadora: x.operadora || "-",
        valorBruto: Number(x.valor_bruto || 0),
        valorLiquido: Number(x.valor_liquido || 0),
        dataPrevisaoPagto: x.data_previsao_pagto,
        dataPagamento: x.data_pagamento,
        observacao: x.observacao || "-",
        lotePagamento: x.lote_do_ajuste || "-",
        idLote: x.id_lote || "-",
        parcelaLote: Number(x.parcela_lote || 0),
        situacao: x.situacao || "-",
      })),
    });
  } catch (err) {
    console.error("Erro /api/conciliacao/ajustes:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ======================================================
// CONCILIAÇÃO - REGISTROS DE CARTÃO
// ======================================================
app.get("/api/conciliacao/cartao-registros", async (req, res) => {
  try {
    const { empresa = "", dataIni = "", dataFim = "", bandeira = "", conciliado = "", limit = "300" } = req.query;
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    const lim = Math.min(Math.max(parseInt(String(limit || "300"), 10) || 300, 1), 2000);

    const params = [];
    const where = [];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (dataIni) { params.push(dataIni); where.push(`cr.dtvenda::date >= $${params.length}`); }
    if (dataFim) { params.push(dataFim); where.push(`cr.dtvenda::date <= $${params.length}`); }
    if (bandeira) { params.push(`%${bandeira}%`); where.push(`TRIM(COALESCE(cr.bandeira::text,'')) ILIKE $${params.length}`); }
    if (conciliado === "sim") where.push(`COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') <> ''`);
    if (conciliado === "nao") where.push(`COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') = ''`);

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    params.push(lim);

    const sql = `
      SELECT
        cr.id_arquivo,
        cr.semaforo,
        LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') AS empresa,
        TRIM(COALESCE(cr.auxiliar::text,'')) AS auxiliar,
        TRIM(COALESCE(cr.financeiro_conciliacoes::text,'')) AS financeiro_conciliacoes,
        cr.dtvenda::date AS dtvenda,
        COALESCE(cr.vlbrutovenda::numeric,0) AS vlbrutovenda,
        TRIM(COALESCE(cr.plano::text,'')) AS plano,
        TRIM(COALESCE(cr.parcela::text,'')) AS parcela,
        TRIM(COALESCE(cr.nsu::text,'')) AS nsu,
        TRIM(COALESCE(cr.bandeira::text,'')) AS bandeira,
        TRIM(COALESCE(cr.log::text,'')) AS log,
        CASE
          WHEN COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') <> '' THEN 'CONCILIADO'
          ELSE 'PENDENTE'
        END AS status_conciliacao
      FROM conciliacao_cartao_registros cr
      ${whereSql}
      ORDER BY cr.dtvenda DESC, cr.id_arquivo DESC
      LIMIT $${params.length}
    `;

    const r = await querySafe(sql, params, 60000);

    const porBandeira = {};
    (r.rows || []).forEach(row => {
      const b = String(row.bandeira || "OUTROS").trim() || "OUTROS";
      if (!porBandeira[b]) porBandeira[b] = { bandeira: b, qtd: 0, valor: 0, conciliados: 0 };
      porBandeira[b].qtd++;
      porBandeira[b].valor += Number(row.vlbrutovenda || 0);
      if (row.status_conciliacao === "CONCILIADO") porBandeira[b].conciliados++;
    });

    return res.json({
      ok: true,
      total: r.rows?.length || 0,
      resumoBandeira: Object.values(porBandeira).sort((a, b) => b.valor - a.valor),
      data: (r.rows || []).map(x => ({
        idArquivo: x.id_arquivo,
        semaforo: x.semaforo,
        empresa: x.empresa || "-",
        auxiliar: x.auxiliar || "-",
        financeiroConciliacoes: x.financeiro_conciliacoes || "-",
        dtVenda: x.dtvenda,
        vlBrutoVenda: Number(x.vlbrutovenda || 0),
        plano: x.plano || "-",
        parcela: x.parcela || "-",
        nsu: x.nsu || "-",
        bandeira: x.bandeira || "-",
        log: x.log || "-",
        statusConciliacao: x.status_conciliacao || "PENDENTE",
      })),
    });
  } catch (err) {
    console.error("Erro /api/conciliacao/cartao-registros:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ======================================================
// CONCILIAÇÃO - EQUALS LITE
// ======================================================
app.get("/api/conciliacao/equals", async (req, res) => {
  try {
    const { empresa = "", status = "", limit = "300" } = req.query;
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
    const lim = Math.min(Math.max(parseInt(String(limit || "300"), 10) || 300, 1), 2000);

    const params = [];
    const where = [];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (status !== "" && status !== "todos") {
      params.push(parseInt(status, 10));
      where.push(`ce.status = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    params.push(lim);

    const sql = `
      SELECT
        ce.codigo,
        LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') AS empresa,
        TRIM(COALESCE(ce.financeirotitulo::text,'')) AS financeiro_titulo,
        ce.status,
        TRIM(COALESCE(ce.statusdescricao::text,'')) AS status_descricao,
        COALESCE(ce.log::text,'') AS log,
        COALESCE(ce.loghistorico::text,'') AS log_historico,
        ft.vencimento::date AS vencimento,
        ft.valor::numeric AS valor_titulo,
        TRIM(COALESCE(ft.rp::text,'')) AS rp,
        TRIM(COALESCE(ft.status::text,'')) AS status_titulo,
        COALESCE(
          NULLIF(TRIM(p.apelido::text),''),
          NULLIF(TRIM(p.nome::text),''),
          ft.pessoa::text,
          '-'
        ) AS pessoa
      FROM conciliacao_equals_lite ce
      LEFT JOIN financeiro_titulos ft
        ON TRIM(COALESCE(ft.codigo::text,'')) = TRIM(COALESCE(ce.financeirotitulo::text,''))
       AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') = LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0')
      LEFT JOIN pessoas p
        ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
      ${whereSql}
      ORDER BY ce.codigo DESC
      LIMIT $${params.length}
    `;

    const r = await querySafe(sql, params, 60000);
    const statusLabel = { 0: "PENDENTE", 1: "CONCILIADO", 2: "DIVERGENTE", 3: "ERRO" };

    return res.json({
      ok: true,
      total: r.rows?.length || 0,
      data: (r.rows || []).map(x => ({
        codigo: x.codigo,
        empresa: x.empresa || "-",
        financeiroTitulo: x.financeiro_titulo || "-",
        status: x.status,
        statusLabel: statusLabel[x.status] || "DESCONHECIDO",
        statusDescricao: x.status_descricao || "-",
        log: x.log || "-",
        logHistorico: x.log_historico || "-",
        vencimento: x.vencimento,
        valorTitulo: Number(x.valor_titulo || 0),
        rp: x.rp || "-",
        statusTitulo: x.status_titulo || "-",
        pessoa: x.pessoa || "-",
      })),
    });
  } catch (err) {
    console.error("Erro /api/conciliacao/equals:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ======================================================
// CONCILIAÇÃO - DIVERGÊNCIAS E PENDÊNCIAS
// ======================================================
app.get("/api/conciliacao/divergencias", async (req, res) => {
  try {
    const { empresa = "", dataIni = "", dataFim = "" } = req.query;
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const params = [];
    const whereReg = [];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereReg.push(`LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (dataIni) { params.push(dataIni); whereReg.push(`cr.dtvenda::date >= $${params.length}`); }
    if (dataFim) { params.push(dataFim); whereReg.push(`cr.dtvenda::date <= $${params.length}`); }
    whereReg.push(`COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') = ''`);

    const whereRegSql = `WHERE ${whereReg.join(" AND ")}`;

    const sqlPendentes = `
      SELECT
        cr.dtvenda::date AS dtvenda,
        LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') AS empresa,
        TRIM(COALESCE(cr.bandeira::text,'OUTROS')) AS bandeira,
        COUNT(*) AS qtd,
        COALESCE(SUM(cr.vlbrutovenda::numeric),0) AS valor_total
      FROM conciliacao_cartao_registros cr
      ${whereRegSql}
      GROUP BY cr.dtvenda, cr.empresa, cr.bandeira
      ORDER BY cr.dtvenda DESC, valor_total DESC
      LIMIT 200
    `;

    const paramsEq = [];
    const whereEq = [];
    if (empList.length) {
      const start = paramsEq.length + 1;
      empList.forEach(e => paramsEq.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      whereEq.push(`LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') IN (${ph})`);
    }
    whereEq.push(`ce.status IN (2,3)`);
    const whereEqSql = `WHERE ${whereEq.join(" AND ")}`;

    const sqlDivEq = `
      SELECT
        ce.codigo,
        LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') AS empresa,
        TRIM(COALESCE(ce.financeirotitulo::text,'')) AS financeiro_titulo,
        ce.status,
        TRIM(COALESCE(ce.statusdescricao::text,'')) AS status_descricao,
        COALESCE(ce.log::text,'') AS log,
        ft.vencimento::date AS vencimento,
        COALESCE(ft.valor::numeric,0) AS valor_titulo
      FROM conciliacao_equals_lite ce
      LEFT JOIN financeiro_titulos ft
        ON TRIM(COALESCE(ft.codigo::text,'')) = TRIM(COALESCE(ce.financeirotitulo::text,''))
       AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') = LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0')
      ${whereEqSql}
      ORDER BY ce.codigo DESC
      LIMIT 200
    `;

    const [rPend, rDiv] = await Promise.all([
      querySafe(sqlPendentes, params, 30000),
      querySafe(sqlDivEq, paramsEq, 30000),
    ]);

    return res.json({
      ok: true,
      pendentesCartao: (rPend.rows || []).map(x => ({
        dtVenda: x.dtvenda,
        empresa: x.empresa || "-",
        bandeira: x.bandeira || "OUTROS",
        qtd: Number(x.qtd || 0),
        valorTotal: Number(x.valor_total || 0),
      })),
      divergenciasEquals: (rDiv.rows || []).map(x => ({
        codigo: x.codigo,
        empresa: x.empresa || "-",
        financeiroTitulo: x.financeiro_titulo || "-",
        status: x.status,
        statusLabel: x.status === 2 ? "DIVERGENTE" : "ERRO",
        statusDescricao: x.status_descricao || "-",
        log: x.log || "-",
        vencimento: x.vencimento,
        valorTitulo: Number(x.valor_titulo || 0),
      })),
    });
  } catch (err) {
    console.error("Erro /api/conciliacao/divergencias:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

// ======================================================
// CONCILIAÇÃO - TIMELINE DIÁRIA
// ======================================================
app.get("/api/conciliacao/timeline", async (req, res) => {
  try {
    const { empresa = "", dataIni = "", dataFim = "" } = req.query;
    const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

    const params = [];
    const where = [];

    if (empList.length) {
      const start = params.length + 1;
      empList.forEach(e => params.push(e));
      const ph = empList.map((_, i) => `$${start + i}`).join(",");
      where.push(`LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') IN (${ph})`);
    }
    if (dataIni) { params.push(dataIni); where.push(`ca.data_ajuste::date >= $${params.length}`); }
    if (dataFim) { params.push(dataFim); where.push(`ca.data_ajuste::date <= $${params.length}`); }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
      SELECT
        ca.data_ajuste::date AS data,
        TO_CHAR(ca.data_ajuste::date, 'DD/MM') AS data_fmt,
        COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'C' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS credito,
        COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'D' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS debito,
        COALESCE(SUM(COALESCE(ca.valor_bruto::numeric,0)),0) AS total_bruto,
        COALESCE(SUM(COALESCE(ca.valor_liquido::numeric,0)),0) AS total_liquido,
        COUNT(*) AS qtd_ajustes,
        COUNT(CASE WHEN ca.data_pagamento IS NOT NULL THEN 1 END) AS qtd_pagos
      FROM conciliacao_ajustes ca
      ${whereSql}
      GROUP BY ca.data_ajuste
      ORDER BY ca.data_ajuste DESC
    `;

    const r = await querySafe(sql, params, 30000);
    return res.json({
      ok: true,
      data: (r.rows || []).map(x => ({
        data: x.data,
        dataFmt: x.data_fmt || "-",
        credito: Number(x.credito || 0),
        debito: Number(x.debito || 0),
        totalBruto: Number(x.total_bruto || 0),
        totalLiquido: Number(x.total_liquido || 0),
        qtdAjustes: Number(x.qtd_ajustes || 0),
        qtdPagos: Number(x.qtd_pagos || 0),
      })),
    });
  } catch (err) {
    console.error("Erro /api/conciliacao/timeline:", err);
    res.status(500).json({ ok: false, erro: err.message });
  }
});
app.get("/api/atendimento/empresas", async (req, res) => {
  try {

    const sql = `
      SELECT DISTINCT
        LPAD(TRIM(empresa::text), 2, '0') AS empresa
      FROM pessoas
      WHERE funcionario = true
        AND podevender = true
        AND empresa IS NOT NULL
      ORDER BY empresa
    `;

    const result = await querySafe(sql, [], 30000);

    res.json(result.rows || []);

  } catch (err) {

    console.error("Erro ao buscar empresas:", err);

    res.status(500).json({
      erro: "Erro ao buscar empresas"
    });

  }
});
app.get("/api/atendimento/vendedores", async (req, res) => {
  try {
    const empresa = String(req.query.empresa || "").trim().padStart(2, "0");

    if (!empresa || empresa === "00") {
      return res.status(400).json({
        erro: "Empresa obrigatória"
      });
    }

    const sql = `
      SELECT
        TRIM(codigo::text) AS codigo,
        TRIM(COALESCE(NULLIF(apelido::text, ''), nome::text, codigo::text)) AS nome,
        LPAD(TRIM(empresa::text), 2, '0') AS empresa
      FROM pessoas
      WHERE funcionario = true
        AND podevender = true
        AND LPAD(TRIM(empresa::text), 2, '0') = $1
      ORDER BY nome
    `;

    const result = await querySafe(sql, [empresa], 30000);

    res.json(result.rows || []);

  } catch (err) {
    console.error("Erro ao buscar vendedores:", err.message);

    res.status(500).json({
      erro: "Erro ao buscar vendedores",
      detalhe: err.message
    });
  }
});

app.post("/api/atendimento/sessao/iniciar", async (req, res) => {
  try {
    const empresa = String(req.body.empresa || "").trim().padStart(2, "0");

    if (!empresa) {
      return res.status(400).json({ erro: "Empresa obrigatória" });
    }

    const sql = `
      INSERT INTO atendimento_sessoes (empresa, status)
      VALUES ($1, 'ABERTA')
      RETURNING *
    `;

    const result = await poolAtendimento.query(sql, [empresa]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao iniciar sessão:", err);
    res.status(500).json({ erro: "Erro ao iniciar sessão" });
  }
});

app.get("/api/atendimento/sessao/aberta", async (req, res) => {
  try {
    const empresa = String(req.query.empresa || "").trim().padStart(2, "0");

    if (!empresa) {
      return res.status(400).json({ erro: "Empresa obrigatória" });
    }

    const sql = `
      SELECT *
      FROM atendimento_sessoes
      WHERE empresa = $1
        AND data_sessao = CURRENT_DATE
        AND status = 'ABERTA'
      ORDER BY id DESC
      LIMIT 1
    `;

    const result = await poolAtendimento.query(sql, [empresa]);

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("Erro ao buscar sessão:", err);
    res.status(500).json({ erro: "Erro ao buscar sessão" });
  }
});

app.get("/api/atendimento/ativos", async (req, res) => {
  try {
    const sessaoId = Number(req.query.sessao_id || 0);

    if (!sessaoId) {
      return res.status(400).json({ erro: "Sessão obrigatória" });
    }

    const sql = `
      SELECT *
      FROM atendimentos
      WHERE sessao_id = $1
        AND status = 'EM_ATENDIMENTO'
      ORDER BY data_inicio DESC
    `;

    const result = await poolAtendimento.query(sql, [sessaoId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar ativos:", err);
    res.status(500).json({ erro: "Erro ao buscar atendimentos ativos" });
  }
});

app.get("/api/atendimento/relatorio", async (req, res) => {
  try {
    function normCodigo(v) {
      return String(v || "").trim().replace(/^0+/, "");
    }

    const sqlAtend = `
      SELECT
        COALESCE(data_fim, data_inicio)::date::text AS data_ref,
        TO_CHAR(COALESCE(data_fim, data_inicio)::date, 'DD/MM/YYYY') AS data_fmt,
        LPAD(TRIM(COALESCE(empresa::text, '')), 2, '0') AS empresa,
        TRIM(COALESCE(vendedor_codigo::text, '')) AS vendedor_codigo,
        COUNT(*)::int AS atendimentos,
        SUM(CASE WHEN vendido = 1 THEN 1 ELSE 0 END)::int AS vendidos,
        SUM(CASE WHEN nao_vendido = 1 THEN 1 ELSE 0 END)::int AS nao_vendidos
      FROM atendimentos
      WHERE status = 'FINALIZADO'
      GROUP BY
        COALESCE(data_fim, data_inicio)::date,
        LPAD(TRIM(COALESCE(empresa::text, '')), 2, '0'),
        TRIM(COALESCE(vendedor_codigo::text, ''))
    `;

    const rAtend = await poolAtendimento.query(sqlAtend);
    const atend = rAtend.rows || [];

    if (!atend.length) {
      return res.json({
        ok: true,
        totalAtendimentos: 0,
        totalVendidos: 0,
        totalNaoVendidos: 0,
        conversaoGeral: 0,
        data: []
      });
    }

    const datas = [...new Set(atend.map(x => x.data_ref))].sort();
    const dataIni = datas[0];
    const dataFim = datas[datas.length - 1];

    const empresas = [...new Set(atend.map(x => x.empresa).filter(Boolean))];

    const sqlVendedores = `
      SELECT
        LPAD(TRIM(empresa::text), 2, '0') AS empresa,
        TRIM(codigo::text) AS vendedor_codigo,
        COALESCE(
          NULLIF(TRIM(apelido::text), ''),
          NULLIF(TRIM(nome::text), ''),
          TRIM(codigo::text)
        ) AS vendedor_nome
      FROM pessoas
      WHERE COALESCE(funcionario, false) = true
        AND COALESCE(podevender, false) = true
        AND LPAD(TRIM(empresa::text), 2, '0') = ANY($1::text[])
      ORDER BY empresa, vendedor_nome
    `;

    const rVend = await querySafe(sqlVendedores, [empresas], 60000);
    const vendedores = rVend.rows || [];

    const sqlVendas = `
      SELECT
        v.data::date::text AS data_ref,
        LPAD(TRIM(v.empresa::text), 2, '0') AS empresa,
        TRIM(v.vendedor::text) AS vendedor_codigo,
        SUM(
          CASE
            WHEN TRIM(COALESCE(m.operacao::text,'')) = 'VE'
              THEN ABS(COALESCE(m.quantidade::numeric,0))
            WHEN TRIM(COALESCE(m.operacao::text,'')) = 'DV'
              THEN -ABS(COALESCE(m.quantidade::numeric,0))
            ELSE 0
          END
        ) AS qtd_erp
      FROM vendas v
      JOIN movimento m
        ON TRIM(m.auxiliar::text) = TRIM(('VE' || v.codigo)::char(10))
      WHERE v.data::date BETWEEN $1 AND $2
        AND LPAD(TRIM(v.empresa::text), 2, '0') = ANY($3::text[])
        AND TRIM(COALESCE(m.operacao::text,'')) IN ('VE','DV')
      GROUP BY
        v.data::date,
        LPAD(TRIM(v.empresa::text), 2, '0'),
        TRIM(v.vendedor::text)
    `;

    const rVendas = await querySafe(sqlVendas, [dataIni, dataFim, empresas], 60000);

    const mapaAtend = new Map();
    for (const a of atend) {
      const chave = `${a.data_ref}|${a.empresa}|${normCodigo(a.vendedor_codigo)}`;
      mapaAtend.set(chave, a);
    }

    const mapaVendas = new Map();
    for (const v of rVendas.rows || []) {
      const chave = `${v.data_ref}|${v.empresa}|${normCodigo(v.vendedor_codigo)}`;
      mapaVendas.set(chave, Number(v.qtd_erp || 0));
    }

    const data = [];

    for (const dia of datas) {
      for (const vend of vendedores) {
        const chave = `${dia}|${vend.empresa}|${normCodigo(vend.vendedor_codigo)}`;
        const a = mapaAtend.get(chave);

        const atendimentos = Number(a?.atendimentos || 0);
        const vendidos = Number(a?.vendidos || 0);
        const nao_vendidos = Number(a?.nao_vendidos || 0);

        data.push({
          data_ref: dia,
          data_fmt: new Date(dia + "T00:00:00").toLocaleDateString("pt-BR"),
          empresa: vend.empresa,
          vendedor_codigo: vend.vendedor_codigo,
          vendedor_nome: vend.vendedor_nome,
          atendimentos,
          vendidos,
          nao_vendidos,
          conversao: atendimentos > 0 ? (vendidos / atendimentos) * 100 : 0,
          venda_erp: mapaVendas.get(chave) || 0
        });
      }
    }
const dataFiltrado = data.filter(x =>
  Number(x.vendidos || 0) > 0 ||
  Number(x.venda_erp || 0) > 0
);

const totalAtendimentos = dataFiltrado.reduce((s, x) => s + Number(x.atendimentos || 0), 0);
const totalVendidos = dataFiltrado.reduce((s, x) => s + Number(x.vendidos || 0), 0);
const totalNaoVendidos = dataFiltrado.reduce((s, x) => s + Number(x.nao_vendidos || 0), 0);

res.json({
  ok: true,
  totalAtendimentos,
  totalVendidos,
  totalNaoVendidos,
  conversaoGeral: totalAtendimentos > 0
    ? (totalVendidos / totalAtendimentos) * 100
    : 0,
  data: dataFiltrado
});

  } catch (err) {
    console.error("Erro /api/atendimento/relatorio:", err.message);
    res.status(500).json({ ok: false, erro: err.message });
  }
});

app.post("/api/atendimentos/iniciar", async (req, res) => {
  try {
    const vendedor = String(req.body.vendedor || "").trim();
    const vendedorCodigo = String(req.body.vendedor_codigo || "").trim();
    const empresa = String(req.body.empresa || "").trim().padStart(2, "0");
    const sessaoId = Number(req.body.sessao_id || 0);

    if (!vendedor) {
      return res.status(400).json({ erro: "Vendedor obrigatório" });
    }

    if (!empresa) {
      return res.status(400).json({ erro: "Empresa obrigatória" });
    }

    if (!sessaoId) {
      return res.status(400).json({ erro: "Sessão obrigatória" });
    }

    const sql = `
      INSERT INTO atendimentos (
        sessao_id,
        empresa,
        vendedor_codigo,
        vendedor_nome,
        status
      )
      VALUES ($1, $2, $3, $4, 'EM_ATENDIMENTO')
      RETURNING *
    `;

    const result = await poolAtendimento.query(sql, [
      sessaoId,
      empresa,
      vendedorCodigo,
      vendedor
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Erro ao iniciar atendimento:", err);

    res.status(500).json({
      erro: "Erro ao iniciar atendimento",
      detalhe: err.message
    });
  }
});

app.post("/api/atendimentos/finalizar", async (req, res) => {
  try {
    const atendimentoId = Number(req.body.id || 0);
    const resultado = String(req.body.resultado || "").trim();

    if (!atendimentoId) {
      return res.status(400).json({ erro: "Atendimento obrigatório" });
    }

    if (!resultado) {
      return res.status(400).json({ erro: "Resultado obrigatório" });
    }

    const vendeu = resultado === "VENDIDO" ? 1 : 0;
const naoVendido = vendeu ? 0 : 1;
const motivoNaoVenda = vendeu ? null : resultado;

    const sql = `
      UPDATE atendimentos
      SET
  data_fim = CURRENT_TIMESTAMP,
  status = 'FINALIZADO',
  resultado = $2,
  vendido = $3,
  nao_vendido = $4,
  motivo_nao_venda = $5
      WHERE id = $1
      RETURNING *
    `;

    const result = await poolAtendimento.query(sql, [
  atendimentoId,
  resultado,
  vendeu,
  naoVendido,
  motivoNaoVenda
]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao finalizar atendimento:", err);
    res.status(500).json({
      erro: "Erro ao finalizar atendimento",
      detalhe: err.message
    });
  }
});

// ============================
// START
// ============================
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log("Conectado ao PostgreSQL 🚀");
});