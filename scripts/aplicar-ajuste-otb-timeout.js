"use strict";

const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "otb_engine.js");
let codigo = fs.readFileSync(arquivo, "utf8").replace(/\r\n/g, "\n");

const atual = `  async function sourceQuery(sql, params = [], timeoutMs = 600000) {
    const client = await sourcePool.connect();
    try {
      await client.query(\`SET statement_timeout TO \${Math.max(30000, timeoutMs)}\`);
      return await client.query(sql, params);
    } finally {
      try {
        await client.query(
          \`SET statement_timeout TO \${Number(process.env.DB_STATEMENT_TIMEOUT || 180000)}\`
        );
      } catch (_) {}
      client.release();
    }
  }
`;

const novo = `  async function sourceQuery(sql, params = [], timeoutMs = 600000) {
    const maxTentativas = Math.max(
      1,
      Number(process.env.OTB_SOURCE_CONNECT_RETRIES || 3)
    );

    let ultimoErro = null;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
      let client = null;

      try {
        client = await sourcePool.connect();

        await client.query(
          \`SET statement_timeout TO \${Math.max(30000, timeoutMs)}\`
        );

        const resultado = await client.query(sql, params);
        return resultado;

      } catch (e) {
        ultimoErro = e;

        const mensagem = String(e?.message || e || "");
        const codigoErro = String(e?.code || "").toUpperCase();

        const erroConexao =
          /connection terminated|connection timeout|connection closed|socket|ECONNRESET|ECONNREFUSED/i.test(mensagem) ||
          ["ECONNRESET", "ECONNREFUSED", "EPIPE", "57P01", "57P02", "57P03"].includes(codigoErro);

        if (!erroConexao || tentativa >= maxTentativas) {
          throw e;
        }

        logger.warn(
          \`[OTB CACHE] Falha de conexão com SETA na tentativa \${tentativa}/\${maxTentativas}. Nova tentativa...\`
        );

        await new Promise(resolve =>
          setTimeout(resolve, Math.min(10000, 2000 * tentativa))
        );

      } finally {
        if (client) {
          try {
            await client.query(
              \`SET statement_timeout TO \${Number(process.env.DB_STATEMENT_TIMEOUT || 180000)}\`
            );
          } catch (_) {}

          try {
            client.release(ultimoErro || undefined);
          } catch (_) {}
        }
      }
    }

    throw ultimoErro || new Error("Falha ao conectar ao SETA para o OTB.");
  }
`;

const ocorrencias = codigo.split(atual).length - 1;

if (ocorrencias !== 1) {
  throw new Error(
    `sourceQuery do OTB: esperado 1 ocorrência, encontrado ${ocorrencias}.`
  );
}

codigo = codigo.replace(atual, novo);
fs.writeFileSync(arquivo, codigo, "utf8");

console.log(
  "OK: OTB ajustado para repetir conexões transitórias com o SETA antes de falhar."
);
