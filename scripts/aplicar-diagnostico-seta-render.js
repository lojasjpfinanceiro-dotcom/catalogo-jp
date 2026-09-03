"use strict";

const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "index.js");
let codigo = fs.readFileSync(arquivo, "utf8");

const alvo = '  console.log("Conectado ao PostgreSQL 🚀");';
const ocorrencias = codigo.split(alvo).length - 1;

if (ocorrencias !== 1) {
  throw new Error(`diagnóstico SETA: esperado 1 ocorrência, encontrado ${ocorrencias}.`);
}

const substituto = `  querySafe(\"SELECT current_database() AS banco, current_user AS usuario\", [], 15000)\n    .then(r => {\n      const row = r.rows?.[0] || {};\n      console.log(\"[SETA TESTE] conexão real OK. banco=\" + (row.banco || \"\") + \" usuario=\" + (row.usuario || \"\"));\n    })\n    .catch(e => {\n      console.error(\"[SETA TESTE] conexão real FALHOU:\", e?.message || e);\n    });`;

codigo = codigo.replace(alvo, substituto);
fs.writeFileSync(arquivo, codigo, "utf8");

console.log("OK: diagnóstico real da conexão SETA adicionado ao startup.");
