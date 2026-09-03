const { Pool } = require("pg");
const { criarPoolJPDesk } = require("../config/jpdesk-db");

function criarPoolSeta(opcoes = {}) {
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: String(process.env.DB_SSL || "false").toLowerCase() === "true"
      ? { rejectUnauthorized: false }
      : false,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    keepAlive: true,
    statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT || 180000),
    query_timeout: Number(process.env.DB_QUERY_TIMEOUT || 180000),
    ...opcoes
  });
}

function criarFontesJPDesk() {
  return {
    seta: criarPoolSeta(),
    jpdesk: criarPoolJPDesk()
  };
}

module.exports = {
  criarPoolSeta,
  criarPoolJPDesk,
  criarFontesJPDesk
};
