"use strict";

const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "index.js");
let codigo = fs.readFileSync(arquivo, "utf8");

function substituirTodas(de, para, descricao, minimo = 1) {
  const ocorrencias = codigo.split(de).length - 1;
  if (ocorrencias < minimo) {
    throw new Error(`${descricao}: esperado pelo menos ${minimo} ocorrência(s), encontrado ${ocorrencias}.`);
  }
  codigo = codigo.split(de).join(para);
  console.log(`${descricao}: ${ocorrencias} ocorrência(s) ajustada(s).`);
}

substituirTodas(
  "public.atendimento_centrais_ativas",
  "jpdesk.atendimento_centrais_ativas",
  "Central de Atendimento"
);

substituirTodas(
  "table_schema='public'",
  "table_schema='jpdesk'",
  "Verificação do schema das Metas",
  2
);

substituirTodas(
  "A tabela public.metas_lojas não possui as colunas:",
  "A tabela jpdesk.metas_lojas não possui as colunas:",
  "Mensagem de diagnóstico das Metas"
);

substituirTodas(
  'tabela:"public.metas_lojas"',
  'tabela:"jpdesk.metas_lojas"',
  "Diagnóstico da tabela de Metas"
);

fs.writeFileSync(arquivo, codigo, "utf8");
console.log("OK: referências auxiliares restantes ajustadas para o schema jpdesk.");
