const fs = require("node:fs");
const path = require("node:path");

const arquivo = path.join(__dirname, "..", "index.js");
let texto = fs.readFileSync(arquivo, "utf8");

if (texto.includes('require("./backend/diagnosticos/seta-rede")')) {
  console.log("OK: diagnóstico de rede SETA já está aplicado.");
  process.exit(0);
}

const marcadorImport = 'const { criarPoolJPDesk } = require("./backend/config/jpdesk-db");';
if (!texto.includes(marcadorImport)) {
  throw new Error("Não encontrei o ponto seguro para adicionar o diagnóstico no index.js.");
}

texto = texto.replace(
  marcadorImport,
  marcadorImport + '\nconst { diagnosticarRedeSeta } = require("./backend/diagnosticos/seta-rede");'
);

const marcadorListen = 'app.listen(port, "0.0.0.0", () => {';
if (!texto.includes(marcadorListen)) {
  throw new Error("Não encontrei o app.listen esperado no index.js.");
}

texto = texto.replace(
  marcadorListen,
  marcadorListen + '\n  diagnosticarRedeSeta().catch((erro) => console.error(`[SETA REDE] diagnóstico falhou: ${erro.message}`));'
);

fs.writeFileSync(arquivo, texto, "utf8");
console.log("OK: diagnóstico DNS/TCP do SETA adicionado ao startup.");
