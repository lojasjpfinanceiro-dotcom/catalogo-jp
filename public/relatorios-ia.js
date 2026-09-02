(() => {
  "use strict";

  const CHAVE_SESSAO_IA =
    "jp_relatorios_ia_sessao_v2";

  const sessaoIa =
    localStorage.getItem(CHAVE_SESSAO_IA) ||
    (
      "ia_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2)
    );

  localStorage.setItem(
    CHAVE_SESSAO_IA,
    sessaoIa
  );

  const $ = (id) =>
    document.getElementById(id);

  const pergunta = $("perguntaIa");
  const btnPerguntar = $("btnPerguntar");
  const mensagem = $("mensagemIa");
  const areaResultado = $("areaResultado");
  const textoResposta = $("textoResposta");
  const indicadores = $("indicadores");
  const cabecalhoTabela = $("cabecalhoTabela");
  const corpoTabela = $("corpoTabela");
  const btnCsv = $("btnCsv");
  const btnImprimir = $("btnImprimir");

  let ultimoResultado = null;
  let consultaEmAndamento = false;

  function escaparHtml(valor) {
    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function mostrarMensagem(
    texto,
    tipo = ""
  ) {
    mensagem.textContent = texto || "";
    mensagem.className =
      `mensagem ${tipo}`.trim();
  }

  function formatarValor(
    valor,
    chave = ""
  ) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return "—";
    }

    const camposTexto = new Set([
      "codigo",
      "empresa",
      "tamanho",
      "numero",
      "numeracao",
      "venda",
      "pedido",
      "documento",
      "codigo_barras"
    ]);

    if (
      camposTexto.has(
        String(chave || "")
      )
    ) {
      return String(valor);
    }

    if (typeof valor === "number") {
      return new Intl.NumberFormat(
        "pt-BR",
        {
          maximumFractionDigits: 2
        }
      ).format(valor);
    }

    return String(valor);
  }

  function renderizarResultado(dados) {
    ultimoResultado = dados;

    textoResposta.textContent =
      dados.resposta ||
      "Consulta concluída.";

    const listaIndicadores =
      Array.isArray(dados.indicadores)
        ? dados.indicadores
        : [];

    indicadores.innerHTML =
      listaIndicadores
        .map((item) => `
          <div class="indicador">
            <span class="k">
              ${escaparHtml(item.rotulo)}
            </span>

            <span class="v">
              ${escaparHtml(
                formatarValor(item.valor)
              )}
            </span>
          </div>
        `)
        .join("");

    const colunas =
      Array.isArray(dados.colunas)
        ? dados.colunas
        : [];

    const linhas =
      Array.isArray(dados.linhas)
        ? dados.linhas
        : [];

    cabecalhoTabela.innerHTML = `
      <tr>
        ${colunas
          .map((coluna) => `
            <th>
              ${escaparHtml(coluna.titulo)}
            </th>
          `)
          .join("")}
      </tr>
    `;

    corpoTabela.innerHTML =
      linhas.length
        ? linhas
            .map((linha) => `
              <tr>
                ${colunas
                  .map((coluna) => `
                    <td>
                      ${escaparHtml(
                        formatarValor(
                          linha[coluna.chave],
                          coluna.chave
                        )
                      )}
                    </td>
                  `)
                  .join("")}
              </tr>
            `)
            .join("")
        : `
          <tr>
            <td colspan="${Math.max(
              1,
              colunas.length
            )}">
              Nenhum resultado encontrado.
            </td>
          </tr>
        `;

    areaResultado.classList.remove(
      "escondido"
    );

    areaResultado.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function perguntarIa() {
    if (consultaEmAndamento) {
      mostrarMensagem(
        "Já existe uma consulta em andamento. Aguarde.",
        "erro"
      );
      return;
    }

    const texto =
      String(
        pergunta.value || ""
      ).trim();

    if (!texto) {
      mostrarMensagem(
        "Digite uma pergunta antes de consultar.",
        "erro"
      );

      pergunta.focus();
      return;
    }

    consultaEmAndamento = true;
    btnPerguntar.disabled = true;
    btnPerguntar.textContent =
      "Consultando ERP...";

    mostrarMensagem(
      "Aguarde. Consultando os dados reais do ERP..."
    );

    areaResultado.classList.add(
      "escondido"
    );

    const controlador =
      new AbortController();

    const temporizador =
      setTimeout(
        () => controlador.abort(),
        75000
      );

    try {
      const resposta = await fetch(
        "/api/relatorios-ia/perguntar",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials: "same-origin",

          signal: controlador.signal,

          body: JSON.stringify({
            pergunta: texto,
            sessaoId: sessaoIa
          })
        }
      );

      const tipoConteudo =
        resposta.headers.get(
          "content-type"
        ) || "";

      if (
        !tipoConteudo.includes(
          "application/json"
        )
      ) {
        const textoServidor =
          await resposta.text();

        console.error(
          "Resposta recebida do servidor:",
          textoServidor
        );

        throw new Error(
          textoServidor
            .trim()
            .startsWith("<")
            ? "O servidor retornou uma página HTML. Reinicie o Node e confirme se o index.js correto está em execução."
            : "O servidor não retornou JSON."
        );
      }

      const dados =
        await resposta.json();

      if (
        !resposta.ok ||
        dados.ok === false
      ) {
        throw new Error(
          dados.erro ||
          `Erro HTTP ${resposta.status}`
        );
      }

      renderizarResultado(dados);

      mostrarMensagem(
        "Consulta concluída com sucesso.",
        "sucesso"
      );
    } catch (erro) {
      console.error(
        "Erro Relatórios IA:",
        erro
      );

      const foiCancelada =
        erro?.name === "AbortError";

      mostrarMensagem(
        foiCancelada
          ? "A consulta demorou demais e foi interrompida sem travar a tela. Informe uma loja, produto ou período menor."
          : (
              erro?.message ||
              "Não foi possível consultar o ERP."
            ),
        "erro"
      );
    } finally {
      clearTimeout(temporizador);
      consultaEmAndamento = false;
      btnPerguntar.disabled = false;
      btnPerguntar.textContent =
        "Perguntar à IA";
    }
  }

  function exportarCsv() {
    if (!ultimoResultado) {
      mostrarMensagem(
        "Faça uma consulta antes de exportar.",
        "erro"
      );
      return;
    }

    const colunas =
      ultimoResultado.colunas || [];

    const linhas =
      ultimoResultado.linhas || [];

    const limpar = (valor) =>
      `"${String(valor ?? "")
        .replaceAll('"', '""')}"`;

    const cabecalho =
      colunas
        .map((coluna) =>
          limpar(coluna.titulo)
        )
        .join(";");

    const registros =
      linhas.map((linha) =>
        colunas
          .map((coluna) =>
            limpar(
              linha[coluna.chave]
            )
          )
          .join(";")
      );

    const conteudo = [
      cabecalho,
      ...registros
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + conteudo],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `relatorio-ia-${
        new Date()
          .toISOString()
          .slice(0, 10)
      }.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  btnPerguntar.addEventListener(
    "click",
    perguntarIa
  );

  pergunta.addEventListener(
    "keydown",
    (evento) => {
      if (
        evento.key === "Enter" &&
        (
          evento.ctrlKey ||
          evento.metaKey
        )
      ) {
        perguntarIa();
      }
    }
  );

  document
    .querySelectorAll(
      "[data-pergunta]"
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () => {
          pergunta.value =
            botao.dataset.pergunta || "";

          perguntarIa();
        }
      );
    });

  btnCsv.addEventListener(
    "click",
    exportarCsv
  );

  btnImprimir.addEventListener(
    "click",
    () => window.print()
  );

  mostrarMensagem(
    "Tela pronta. Escolha uma pergunta rápida ou digite a sua."
  );
})();
