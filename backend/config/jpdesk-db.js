const { Pool } = require("pg");

const schema = String(process.env.JP_DB_SCHEMA || "jpdesk")
  .trim()
  .replace(/[^a-zA-Z0-9_]/g, "");

if (!schema) {
  throw new Error("JP_DB_SCHEMA inválido.");
}

const jpdeskDbConfig = {
  host: process.env.JP_DB_HOST,
  port: Number(process.env.JP_DB_PORT || 5432),
  database: process.env.JP_DB_NAME,
  user: process.env.JP_DB_USER,
  password: process.env.JP_DB_PASS,
  ssl: String(process.env.JP_DB_SSL || "false").toLowerCase() === "true"
    ? { rejectUnauthorized: false }
    : false,
  options: `-c search_path=${schema},public`,
  application_name: "jpdesk"
};

function validarConfiguracaoJPDesk() {
  const obrigatorias = [
    "JP_DB_HOST",
    "JP_DB_NAME",
    "JP_DB_USER",
    "JP_DB_PASS"
  ];

  const ausentes = obrigatorias.filter(nome => !String(process.env[nome] || "").trim());

  if (ausentes.length) {
    throw new Error(`Configuração do banco JPDesk incompleta: ${ausentes.join(", ")}`);
  }
}

function criarPoolJPDesk(opcoes = {}) {
  validarConfiguracaoJPDesk();

  return new Pool({
    ...jpdeskDbConfig,
    ...opcoes,
    options: opcoes.options || jpdeskDbConfig.options
  });
}

module.exports = {
  schema,
  jpdeskDbConfig,
  criarPoolJPDesk,
  validarConfiguracaoJPDesk
};
