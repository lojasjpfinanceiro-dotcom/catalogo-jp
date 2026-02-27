require("dotenv").config();

const express = require("express");
const basicAuth = require("express-basic-auth");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);

// --- Segurança básica (uso interno) ---
const CAT_USER = process.env.CAT_USER || "admin";
const CAT_PASS = process.env.CAT_PASS || "admin";

app.use(
  basicAuth({
    users: { [CAT_USER]: CAT_PASS },
    challenge: true,
    realm: "Catálogo JP",
  })
);

// --- Servir o site ---
app.use(express.static(path.join(__dirname, "public")));

// --- PostgreSQL (pool) ---
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 5432),
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

// Conexão simples pra log
pool
  .query("SELECT 1")
  .then(() => console.log("Conectado ao PostgreSQL (READ) 🚀"))
  .catch((err) => console.error("Erro ao conectar no PostgreSQL:", err.message));

// --- Healthcheck ---
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// --- Produtos (catálogo) ---
// Ajuste o SQL abaixo para a sua tabela real.
// Deixei um padrão bem comum: tabela "produtos" com codigo/descricao/cor/preco
// e uma tabela "estoques" com empresa/produto/quantidade (se você tiver).
app.get("/produtos", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim(); // termo de busca
    const empresa = String(req.query.empresa || "").trim(); // opcional

    // ✅ Se você NÃO tiver tabela de estoque, pode usar só a parte "FROM produtos p"
    // ✅ Se você TIVER estoque (empresa/produto/quantidade), mantém o LEFT JOIN
    const sql = `
      SELECT
        p.codigo,
        p.descricao,
        COALESCE(p.cor, p.corx, '') AS cor,
        p.preco::numeric AS preco,
        COALESCE(SUM(e.quantidade), 0) AS quantidade
      FROM produtos p
      LEFT JOIN estoques e
        ON e.produto = p.codigo
        ${empresa ? "AND e.empresa = $2" : ""}
      WHERE
        ($1 = '' OR
          LOWER(p.codigo::text) LIKE '%' || LOWER($1) || '%' OR
          LOWER(p.descricao::text) LIKE '%' || LOWER($1) || '%' OR
          LOWER(COALESCE(p.cor, p.corx, '')::text) LIKE '%' || LOWER($1) || '%'
        )
      GROUP BY p.codigo, p.descricao, COALESCE(p.cor, p.corx, ''), p.preco
      ORDER BY p.descricao
      LIMIT 500;
    `;

    const params = empresa ? [q, empresa] : [q];

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erro /produtos:", err);
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
});

// --- Start ---
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});