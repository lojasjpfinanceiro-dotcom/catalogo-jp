"use strict";

const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "index.js");
let codigo = fs.readFileSync(arquivo, "utf8");

const blocoConexoes = /const \{ Pool \} = require\("pg"\);\r?\nconst dbConfig = \{\r?\n  host: process\.env\.DB_HOST,\r?\n  port: Number\(process\.env\.DB_PORT \|\| 5432\),\r?\n  database: process\.env\.DB_NAME,\r?\n  user: process\.env\.DB_USER,\r?\n  password: process\.env\.DB_PASS,\r?\n  ssl: String\(process\.env\.DB_SSL \|\| "false"\)\.toLowerCase\(\) === "true"\r?\n    \? \{ rejectUnauthorized: false \}\r?\n    : false\r?\n\};\r?\n\r?\nconst poolAtendimento = new Pool\(dbConfig\);\r?\nconst poolInventario = new Pool\(dbConfig\);/;

const ocorrencias = codigo.match(new RegExp(blocoConexoes.source, "g")) || [];
if (ocorrencias.length !== 1) {
  throw new Error(
    `conexões auxiliares do JPDesk: esperado 1 ocorrência, encontrado ${ocorrencias.length}.`
  );
}

codigo = codigo.replace(
  blocoConexoes,
  [
    'const { Pool } = require("pg");',
    'const { criarPoolJPDesk } = require("./backend/config/jpdesk-db");',
    '',
    'const poolAtendimento = criarPoolJPDesk({ max: 5 });',
    'const poolInventario = criarPoolJPDesk({ max: 5 });'
  ].join("\n")
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
