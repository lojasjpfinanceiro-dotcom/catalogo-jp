"use strict";

const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "index.js");
let codigo = fs.readFileSync(arquivo, "utf8");

function substituirUmaVez(de, para, descricao) {
  const ocorrencias = codigo.split(de).length - 1;
  if (ocorrencias !== 1) {
    throw new Error(`${descricao}: esperado 1 ocorrência, encontrado ${ocorrencias}.`);
  }
  codigo = codigo.replace(de, para);
}

substituirUmaVez(
  'const { Pool } = require("pg");\nconst dbConfig = {\n  host: process.env.DB_HOST,\n  port: Number(process.env.DB_PORT || 5432),\n  database: process.env.DB_NAME,\n  user: process.env.DB_USER,\n  password: process.env.DB_PASS,\n  ssl: String(process.env.DB_SSL || "false").toLowerCase() === "true"\n    ? { rejectUnauthorized: false }\n    : false\n};\n\nconst poolAtendimento = new Pool(dbConfig);\nconst poolInventario = new Pool(dbConfig);',
  'const { Pool } = require("pg");\nconst { criarPoolJPDesk } = require("./backend/config/jpdesk-db");\n\nconst poolAtendimento = criarPoolJPDesk({ max: 5 });\nconst poolInventario = criarPoolJPDesk({ max: 5 });',
  "conexões auxiliares do JPDesk"
);

codigo = codigo.replaceAll(
  "public.transferencia_dono_produto",
  "jpdesk.transferencia_dono_produto"
);

codigo = codigo.replaceAll(
  "to_regclass('public.jp_otb_vendas_mes')",
  "to_regclass('jpdesk.jp_otb_vendas_mes')"
);

codigo = codigo.replaceAll(
  "to_regclass('public.jp_otb_compras_mes')",
  "to_regclass('jpdesk.jp_otb_compras_mes')"
);

codigo = codigo.replaceAll(
  "A grade public.jp_grupos_modulos passa a ser a autoridade.",
  "A grade jpdesk.jp_grupos_modulos passa a ser a autoridade."
);

fs.writeFileSync(arquivo, codigo, "utf8");
console.log("OK: index.js organizado para usar JP_DB_* nas tabelas auxiliares do JPDesk.");
