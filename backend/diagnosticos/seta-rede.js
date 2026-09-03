const dns = require("node:dns").promises;
const net = require("node:net");

async function diagnosticarRedeSeta() {
  const host = String(process.env.DB_HOST || "").trim();
  const port = Number(process.env.DB_PORT || 5432);

  if (!host) {
    console.error("[SETA REDE] DB_HOST ausente");
    return;
  }

  try {
    const resultado = await dns.lookup(host);
    console.log(`[SETA REDE] DNS OK: ${host} -> ${resultado.address}`);
  } catch (erro) {
    console.error(`[SETA REDE] DNS FALHOU: ${erro.code || erro.message}`);
    return;
  }

  await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let terminou = false;

    const finalizar = (mensagem) => {
      if (terminou) return;
      terminou = true;
      clearTimeout(timer);
      console.log(mensagem);
      socket.destroy();
      resolve();
    };

    const timer = setTimeout(() => {
      finalizar(`[SETA REDE] TCP TIMEOUT: ${host}:${port}`);
    }, 10000);

    socket.once("connect", () => {
      finalizar(`[SETA REDE] TCP OK: ${host}:${port}`);
    });

    socket.once("error", (erro) => {
      finalizar(`[SETA REDE] TCP FALHOU: ${erro.code || erro.message}`);
    });
  });
}

module.exports = { diagnosticarRedeSeta };
