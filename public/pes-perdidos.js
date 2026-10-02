"use strict";


const $ = (seletor) => document.querySelector(seletor);

const $$ = (seletor) => [
  ...document.querySelectorAll(seletor)
];


const M = (valor) => {

  return Number(valor || 0)
    .toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );

};


const E = (valor) => {

  return String(valor ?? "")
    .replace(
      /[&<>"']/g,
      (caractere) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[caractere]
    );

};


let P = null;

let L = "";

let S = "PERDIDO";

let D = [];

let K = "criado_em";

let O = "desc";

let timerSugestoes = null;

let ultimaBuscaSugestoes = "";

let sugestoesProdutos = [];

let sugestaoAtiva = -1;


/* ==========================================================
   API
   ========================================================== */

async function api(url, opcoes = {}) {

  const resposta = await fetch(
    url,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      ...opcoes
    }
  );

  const dados = await resposta
    .json()
    .catch(() => ({}));

  if (
    !resposta.ok ||
    dados.ok === false
  ) {

    throw new Error(
      dados.erro ||
      "Falha na requisição"
    );

  }

  return dados;

}


/* ==========================================================
   FOTO
   ========================================================== */

function foto(produto) {

  return (
    produto?.imagem_url ||
    (
      produto?.codigo
        ? "/foto?codigo=" +
          encodeURIComponent(produto.codigo)
        : ""
    )
  );

}


/* ==========================================================
   NUMERAÇÃO AUTOMÁTICA
   ========================================================== */

function limparNumeroAutomatico() {

  const campo = $("#tam");

  const aviso = $("#numeroOrigem");

  campo.classList.remove(
    "numero-automatico"
  );

  aviso.className = "numero-origem";

  aviso.textContent = "";

}


function aplicarNumeroProduto(produto) {

  limparNumeroAutomatico();

  const tamanho = String(
    produto?.tamanho || ""
  ).trim();

  const origem = String(
    produto?.origem_tamanho || ""
  ).trim();

  if (!tamanho) {

    $("#tam").value = "";

    return;

  }

  $("#tam").value = tamanho;

  const aviso = $("#numeroOrigem");


  if (
    origem === "CODIGO_BARRAS" ||
    origem === "CODIGO_BARRAS_INTERNO"
  ) {

    $("#tam").classList.add(
      "numero-automatico"
    );

    aviso.textContent =
      "✓ Nº " +
      tamanho +
      " preenchido pelo código de barras";

    aviso.className =
      "numero-origem ativo";

    return;

  }


  if (
    origem === "CODIGO_PRODUTO_TAMANHO"
  ) {

    aviso.textContent =
      "Nº " +
      tamanho +
      " identificado no código produto + numeração";

    aviso.className =
      "numero-origem manual";

  }

}


/* ==========================================================
   LIMPAR FLUXO APÓS REGISTRO
   Mantém somente a empresa selecionada/preenchida.
   ========================================================== */

function limparFluxoAposRegistro() {

  /*
   * PASSO 1
   * Empresa permanece preenchida.
   * Limpa somente o produto pesquisado.
   */
  $("#codigo").value = "";
  $("#msg").textContent = "";

  fecharSugestoes();


  /*
   * PASSO 2
   * Volta os dados do produto ao estado inicial.
   */
  P = null;

  $("#pcod").textContent = "—";
  $("#pdesc").textContent = "Aguardando produto";
  $("#marca").textContent = "—";
  $("#ref").textContent = "—";
  $("#cor").textContent = "—";
  $("#dep").textContent = "—";
  $("#grupo").textContent = "—";
  $("#custo").textContent = "R$ 0,00";

  const imagem = $("#foto");
  const semFoto = $("#semfoto");

  imagem.removeAttribute("src");
  imagem.style.display = "none";

  semFoto.style.display = "";


  /*
   * PASSO 3
   * Limpa número e seleção do pé.
   */
  $("#tam").value = "";

  limparNumeroAutomatico();

  L = "";

  $$(".lados button")
    .forEach(
      (botao) =>
        botao.classList.remove("on")
    );


  /*
   * PASSO 4
   * Volta a verificação do par ao estado inicial.
   */
  const caixaPar = $("#par");

  caixaPar.className = "par";

  caixaPar.innerHTML =
    "<strong>AGUARDANDO REGISTRO</strong>" +
    "<p>" +
    "O sistema procura automaticamente " +
    "o outro pé em todas as lojas." +
    "</p>";


  /*
   * Novo registro começa pelo campo de produto,
   * sem apagar a empresa.
   */
  $("#codigo").focus();

}


/* ==========================================================
   EXIBIR PRODUTO
   ========================================================== */

function mostrarProduto(produto) {

  P = produto;

  $("#pcod").textContent =
    produto.codigo || "—";

  $("#pdesc").textContent =
    produto.descricao || "—";

  $("#marca").textContent =
    produto.marca || "—";

  $("#ref").textContent =
    produto.referencia || "—";

  $("#cor").textContent =
    produto.cor || "—";

  $("#dep").textContent =
    produto.departamento || "—";

  $("#grupo").textContent =
    produto.grupo || "—";

  $("#custo").textContent =
    M(produto.custo);


  const imagem = $("#foto");

  const semFoto = $("#semfoto");

  const url = foto(produto);


  if (url) {

    imagem.src = url;

    imagem.style.display = "block";

    semFoto.style.display = "none";


    imagem.onerror = () => {

      imagem.style.display = "none";

      semFoto.style.display = "block";

    };

  } else {

    imagem.style.display = "none";

    semFoto.style.display = "block";

  }


  aplicarNumeroProduto(produto);


  $("#msg").textContent =
    "✓ Produto encontrado no ERP";

}


/* ==========================================================
   BUSCAR PRODUTO
   Código de barras
   Código do produto
   Descrição
   ========================================================== */

async function busca() {

  const termo = String(
    $("#codigo").value || ""
  ).trim();


  if (!termo) {
    return;
  }


  $("#msg").textContent =
    "Consultando ERP...";


  try {

    const dados = await api(
      "/api/pes-perdidos/produto" +
      "?q=" +
      encodeURIComponent(termo)
    );


    mostrarProduto(
      dados.produto
    );


  } catch (erro) {

    P = null;

    limparNumeroAutomatico();

    $("#msg").textContent =
      erro.message;

  }

}


/* ==========================================================
   AUTOCOMPLETE PROFISSIONAL DA DESCRIÇÃO
   ========================================================== */

function garantirCaixaSugestoes() {

  let caixa = $("#sugestoesProdutosPesPerdidos");

  if (caixa) {
    return caixa;
  }

  caixa = document.createElement("div");

  caixa.id = "sugestoesProdutosPesPerdidos";

  caixa.className = "sugestoes-produtos";

  $("#codigo").insertAdjacentElement(
    "afterend",
    caixa
  );

  return caixa;

}


function fecharSugestoes() {

  const caixa = garantirCaixaSugestoes();

  caixa.classList.remove("aberta");

  caixa.innerHTML = "";

  sugestoesProdutos = [];

  sugestaoAtiva = -1;

}


function destacarSugestao() {

  const itens = [
    ...garantirCaixaSugestoes()
      .querySelectorAll(".sugestao-produto")
  ];

  itens.forEach(
    (item, indice) => {

      item.classList.toggle(
        "ativa",
        indice === sugestaoAtiva
      );

    }
  );

  if (
    sugestaoAtiva >= 0 &&
    itens[sugestaoAtiva]
  ) {

    itens[sugestaoAtiva]
      .scrollIntoView({
        block: "nearest"
      });

  }

}


async function selecionarSugestao(indice) {

  const produto =
    sugestoesProdutos[indice];

  if (!produto) {
    return;
  }

  /*
   * Colocamos o CÓDIGO no campo.
   * Assim não existe ambiguidade quando dois produtos têm
   * descrições parecidas ou iguais.
   */
  $("#codigo").value =
    String(produto.codigo || "").trim();

  fecharSugestoes();

  await busca();

}


function renderSugestoes(lista) {

  const caixa =
    garantirCaixaSugestoes();

  sugestoesProdutos =
    Array.isArray(lista)
      ? lista
      : [];

  sugestaoAtiva = -1;

  if (!sugestoesProdutos.length) {

    caixa.innerHTML =
      '<div class="sugestao-vazia">' +
      "Nenhum produto encontrado com esse nome." +
      "</div>";

    caixa.classList.add("aberta");

    return;

  }

  caixa.innerHTML =
    sugestoesProdutos
      .map(
        (produto, indice) => {

          const descricao =
            E(produto.descricao || "");

          const codigo =
            E(produto.codigo || "");

          return (
            '<button type="button" ' +
            'class="sugestao-produto" ' +
            'data-i="' + indice + '">' +
              '<span class="sugestao-desc">' +
                descricao +
              '</span>' +
              '<span class="sugestao-cod">' +
                "CÓD. " + codigo +
              '</span>' +
            '</button>'
          );

        }
      )
      .join("");

  caixa.classList.add("aberta");

  caixa
    .querySelectorAll(".sugestao-produto")
    .forEach(
      (botao) => {

        botao.addEventListener(
          "mousedown",
          (evento) => {

            evento.preventDefault();

          }
        );

        botao.addEventListener(
          "click",
          () => {

            selecionarSugestao(
              Number(botao.dataset.i)
            );

          }
        );

      }
    );

}


async function carregarSugestoes() {

  const campo = $("#codigo");

  const termo = String(
    campo.value || ""
  ).trim();


  /*
   * Se for somente número, tratamos como código de barras
   * ou código do produto. A lista de nomes não é necessária.
   */
  if (
    !termo ||
    /^\d+$/.test(termo) ||
    termo.length < 2
  ) {

    fecharSugestoes();

    ultimaBuscaSugestoes = "";

    return;

  }


  if (
    termo === ultimaBuscaSugestoes
  ) {
    return;
  }


  ultimaBuscaSugestoes = termo;


  try {

    const dados = await api(
      "/api/pes-perdidos/sugestoes" +
      "?q=" +
      encodeURIComponent(termo)
    );


    renderSugestoes(
      dados.produtos || []
    );


  } catch (erro) {

    console.error(
      "Erro autocomplete Pés Perdidos:",
      erro
    );

    const caixa =
      garantirCaixaSugestoes();

    caixa.innerHTML =
      '<div class="sugestao-vazia">' +
      E(erro.message) +
      "</div>";

    caixa.classList.add("aberta");

  }

}


/* ==========================================================
   SELEÇÃO DO PÉ
   ========================================================== */

function lado(ladoSelecionado) {

  L = ladoSelecionado;


  $$(".lados button")
    .forEach(
      (botao) => {

        botao.classList.toggle(
          "on",
          botao.dataset.l === ladoSelecionado
        );

      }
    );

}


/* ==========================================================
   REGISTRAR
   ========================================================== */

async function salvar() {

  if (!P) {

    alert(
      "Localize um produto primeiro."
    );

    return;

  }


  const empresa =
    $("#empresa").value.trim();

  const tamanho =
    $("#tam").value.trim();


  if (
    !empresa ||
    !tamanho ||
    !L
  ) {

    alert(
      "Informe loja, numeração e pé."
    );

    return;

  }


  try {

    const dados = await api(
      "/api/pes-perdidos",
      {
        method: "POST",

        body: JSON.stringify({
          empresa,
          produto: P.codigo,
          barras:
            $("#codigo").value.trim(),
          tamanho,
          lado: L,
          custo: P.custo,
          descricao: P.descricao,
          marca: P.marca,
          referencia: P.referencia,
          departamento: P.departamento,
          grupo: P.grupo,
          imagem_url: foto(P)
        })
      }
    );


    const caixaPar = $("#par");


    if (dados.par) {

      caixaPar.className =
        "par ok";

      caixaPar.innerHTML =
        "<strong>✓ PAR ENCONTRADO!</strong>" +
        "<p>" +
        "Outro pé: " +
        E(dados.par.lado) +
        " • Loja " +
        E(dados.par.empresa) +
        "</p>";

    } else {

      caixaPar.className =
        "par";

      caixaPar.innerHTML =
        "<strong>PÉ REGISTRADO</strong>" +
        "<p>" +
        "O outro pé ainda não foi localizado." +
        "</p>";

    }


    limparFluxoAposRegistro();


    await load();


  } catch (erro) {

    alert(
      erro.message
    );

  }

}


/* ==========================================================
   DATA PADRÃO — HOJE
   ========================================================== */

function dataHojeLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function aplicarDatasPadrao() {
  /*
   * PÉS PERDIDOS É UMA LISTA DE PENDÊNCIAS.
   *
   * Ao abrir a tela, as datas ficam vazias para que todos os
   * registros ainda pendentes apareçam, independentemente da
   * data em que foram cadastrados.
   *
   * Data inicial e Data final continuam funcionando normalmente
   * quando o usuário quiser usá-las como filtros opcionais.
   */
  if ($("#di")) {
    $("#di").value = "";
  }

  if ($("#df")) {
    $("#df").value = "";
  }
}


/* ==========================================================
   FILTROS
   ========================================================== */

function qs() {

  /*
   * DATA INICIAL E FINAL SÃO OPCIONAIS.
   * Somente são enviadas para a API quando o usuário preencher.
   * Com os campos vazios, o status atual é carregado sem corte por data.
   */
  const parametros =
    new URLSearchParams({
      status: S
    });


  [
    ["dataIni", "#di"],
    ["dataFim", "#df"],
    ["empresa", "#fe"],
    ["marca", "#fm"],
    ["produto", "#fp"],
    ["tamanho", "#ft"],
    ["lado", "#fl"]
  ]
    .forEach(
      ([nome, seletor]) => {

        const valor =
          $(seletor).value.trim();

        if (valor) {
          parametros.set(
            nome,
            valor
          );
        }

      }
    );


  return parametros;

}


/* ==========================================================
   CARREGAR PAINEL
   ========================================================== */

async function load() {

  try {

    const [
      registros,
      resumo
    ] = await Promise.all([

      api(
        "/api/pes-perdidos?" +
        qs()
      ),

      api(
        "/api/pes-perdidos/resumo"
      )

    ]);


    D =
      registros.registros || [];


    $("#k1").textContent =
      resumo.pesPerdidos || 0;

    $("#k2").textContent =
      resumo.paresEncontrados || 0;

    $("#k3").textContent =
      resumo.paresRecuperados || 0;


    /*
     * CONTADORES PEQUENOS NAS ABAS
     * Pés perdidos = quantidade de pés sem par.
     * Demais módulos = quantidade de pares/operações.
     */
    $("#qtdTabPerdido").textContent =
      resumo.pesPerdidos || 0;

    $("#qtdTabEncontrado").textContent =
      resumo.paresEncontrados || 0;

    $("#qtdTabResolvido").textContent =
      resumo.paresRecuperados || 0;

    $("#qtdTabTransferencia").textContent =
      resumo.transferenciasSugeridas || 0;

    /*
     * VALORES DA TELA
     * O valor deve refletir SOMENTE os registros que estão
     * efetivamente carregados na lista atual.
     *
     * Não usa estoque do ERP.
     * Não soma registros fora dos filtros da tela.
     */
    const valorLista =
      D.reduce(
        (total, item) =>
          total + Number(item.custo || 0),
        0
      );


    if (
      S === "RESOLVIDO"
    ) {

      $("#k4").textContent =
        M(0);

      $("#k5").textContent =
        M(valorLista);

    } else {

      $("#k4").textContent =
        M(valorLista);

      /*
       * Mantemos o histórico recuperado no card próprio.
       * Ele continua vindo do resumo geral.
       */
      $("#k5").textContent =
        M(resumo.custoRecuperado);

    }


    render();


  } catch (erro) {

    $("#tb").innerHTML =
      '<tr>' +
      '<td colspan="15">' +
      E(erro.message) +
      "</td>" +
      "</tr>";

  }

}


/* ==========================================================
   TABELA
   ========================================================== */

function render() {

  const registros = [
    ...D
  ]
    .sort(
      (a, b) => {

        let A =
          a[K] ?? "";

        let B =
          b[K] ?? "";


        if (
          K === "custo"
        ) {

          A = Number(A || 0);

          B = Number(B || 0);

        }


        return (
          (
            A > B
              ? 1
              : A < B
                ? -1
                : 0
          ) *
          (
            O === "asc"
              ? 1
              : -1
          )
        );

      }
    );


  const valorRegistros =
    registros.reduce(
      (total, item) =>
        total + Number(item.custo || 0),
      0
    );


  $("#total").textContent =
    "Total: " +
    registros.length +
    " registros • Valor: " +
    M(valorRegistros);


  $("#tb").innerHTML =
    registros.length

      ? registros
          .map(
            (x) => {

              const imagem =
                x.imagem_url
                  ? (
                      '<img ' +
                      'class="thumb" ' +
                      'src="' +
                      E(x.imagem_url) +
                      '">' 
                    )
                  : "—";


              const botaoResolver =
                x.status === "ENCONTRADO"
                  ? (
                      '<button ' +
                      'class="act" ' +
                      'onclick="resolver(' +
                      x.id +
                      ')">' +
                      "✓" +
                      "</button>"
                    )
                  : "";


              return `
                <tr>

                  <td>
                    ${x.id}
                  </td>

                  <td>
                    ${imagem}
                  </td>

                  <td>
                    ${E(x.empresa)}
                  </td>

                  <td>
                    ${E(x.produto)}
                  </td>

                  <td>
                    ${E(x.descricao)}
                  </td>

                  <td>
                    ${E(x.marca)}
                  </td>

                  <td>
                    ${E(x.tamanho)}
                  </td>

                  <td>
                    ${E(x.lado)}
                  </td>

                  <td>
                    ${M(x.custo)}
                  </td>

                  <td>
                    <span
                      class="badge ${E(x.status)}"
                    >
                      ${E(x.status)}
                    </span>
                  </td>

                  <td>
                    ${E(x.par_lado || "—")}
                  </td>

                  <td>
                    ${E(x.par_empresa || "—")}
                  </td>

                  <td>
                    ${
                      x.criado_em
                        ? new Date(
                            x.criado_em
                          )
                            .toLocaleString(
                              "pt-BR"
                            )
                        : "—"
                    }
                  </td>

                  <td>
                    ${E(x.usuario || "—")}
                  </td>

                  <td>

                    ${botaoResolver}

                    <button
                      class="act del"
                      onclick="del(${x.id})"
                    >
                      ✕
                    </button>

                  </td>

                </tr>
              `;

            }
          )
          .join("")

      : (
          '<tr>' +
          '<td colspan="15">' +
          "Nenhum registro encontrado." +
          "</td>" +
          "</tr>"
        );

}


/* ==========================================================
   RESOLVER
   ========================================================== */

async function resolver(id) {

  if (
    !confirm(
      "Confirmar par recuperado?"
    )
  ) {
    return;
  }


  await api(
    "/api/pes-perdidos/" +
    id +
    "/resolver",
    {
      method: "POST",
      body: "{}"
    }
  );


  load();

}


/* ==========================================================
   EXCLUIR
   ========================================================== */

async function del(id) {

  if (
    !confirm(
      "Excluir registro?"
    )
  ) {
    return;
  }


  await api(
    "/api/pes-perdidos/" +
    id,
    {
      method: "DELETE"
    }
  );


  load();

}


window.resolver = resolver;

window.del = del;


/* ==========================================================
   NAVEGAÇÃO RÁPIDA COM ENTER
   ========================================================== */

function proximoCampoAoEnter(campoAtual) {

  const ordem = [
    "#empresa",
    "#codigo",
    "#tam"
  ];

  const indice = ordem.indexOf(
    "#" + campoAtual.id
  );

  if (indice === -1) {
    return false;
  }


  /*
   * Empresa -> código do produto
   */
  if (campoAtual.id === "empresa") {

    $("#codigo").focus();
    $("#codigo").select?.();

    return true;

  }


  /*
   * Código -> se já existe produto carregado,
   * avança para número. Caso contrário,
   * executa a busca primeiro.
   */
  if (campoAtual.id === "codigo") {

    if (
      !P
    ) {

      busca()
        .then(
          () => {
            if (P) {
              $("#tam").focus();
              $("#tam").select?.();
            }
          }
        );

      return true;

    }

    $("#tam").focus();
    $("#tam").select?.();

    return true;

  }


  /*
   * Número -> avança para a escolha do pé.
   * Como os pés são botões, o foco vai para
   * o primeiro deles (Pé Esquerdo).
   */
  if (campoAtual.id === "tam") {

    const primeiroPe =
      $(".lados button");

    primeiroPe?.focus();

    return true;

  }


  return false;

}


function ativarEnterSequencial() {

  ["empresa", "codigo", "tam"]
    .forEach(
      (id) => {

        const campo = $("#" + id);

        if (!campo) {
          return;
        }

        campo.addEventListener(
          "keydown",
          (evento) => {

            if (
              evento.key !== "Enter"
            ) {
              return;
            }

            /*
             * No campo código a busca já faz parte do fluxo.
             * Evita duplo disparo.
             */
            evento.preventDefault();

            proximoCampoAoEnter(
              campo
            );

          }
        );

      }
    );


  /*
   * Enter nos botões de pé:
   * ativa a escolha e leva para o botão
   * Registrar no inventário.
   */
  $$(".lados button")
    .forEach(
      (botao) => {

        botao.addEventListener(
          "keydown",
          (evento) => {

            if (
              evento.key !== "Enter"
            ) {
              return;
            }

            evento.preventDefault();

            botao.click();

            const registrar =
              $("#salvar");

            registrar?.focus();

          }
        );

      }
    );

}

/* ==========================================================
   EVENTOS
   ========================================================== */

$("#codigo")
  .addEventListener(
    "keydown",
    (evento) => {

      const caixaAberta =
        garantirCaixaSugestoes()
          .classList
          .contains("aberta");

      if (
        caixaAberta &&
        sugestoesProdutos.length
      ) {

        if (evento.key === "ArrowDown") {

          evento.preventDefault();

          sugestaoAtiva =
            Math.min(
              sugestaoAtiva + 1,
              sugestoesProdutos.length - 1
            );

          destacarSugestao();

          return;

        }


        if (evento.key === "ArrowUp") {

          evento.preventDefault();

          sugestaoAtiva =
            Math.max(
              sugestaoAtiva - 1,
              0
            );

          destacarSugestao();

          return;

        }


        if (
          evento.key === "Enter" &&
          sugestaoAtiva >= 0
        ) {

          evento.preventDefault();

          selecionarSugestao(
            sugestaoAtiva
          );

          return;

        }


        if (evento.key === "Escape") {

          fecharSugestoes();

          return;

        }

      }


      if (
        evento.key === "Enter"
      ) {

        evento.preventDefault();

        fecharSugestoes();

        busca();

      }

    }
  );


$("#codigo")
  .addEventListener(
    "input",
    () => {

      /*
       * Mudou o termo: o produto anterior não deve continuar
       * selecionado nem manter numeração automática antiga.
       */
      P = null;

      limparNumeroAutomatico();

      clearTimeout(
        timerSugestoes
      );


      const termoAtual =
        $("#codigo").value.trim();

      const codigoCompleto =
        /^\d{8}$/.test(termoAtual) ||
        /^7700\d{8,}$/.test(termoAtual) ||
        /^\d{13}$/.test(termoAtual);

      if (codigoCompleto) {
        timerSugestoes =
          setTimeout(
            () => {
              fecharSugestoes();
              busca();
            },
            120
          );

        return;
      }

      timerSugestoes =
        setTimeout(
          carregarSugestoes,
          220
        );

    }
  );


$("#codigo")
  .addEventListener(
    "focus",
    () => {

      const termo =
        $("#codigo").value.trim();

      if (
        termo &&
        !/^\d+$/.test(termo) &&
        termo.length >= 2
      ) {

        ultimaBuscaSugestoes = "";

        carregarSugestoes();

      }

    }
  );


document.addEventListener(
  "click",
  (evento) => {

    const campo = $("#codigo");

    const caixa =
      garantirCaixaSugestoes();

    if (
      evento.target !== campo &&
      !caixa.contains(evento.target)
    ) {

      fecharSugestoes();

    }

  }
);


$("#tam")
  .addEventListener(
    "input",
    () => {

      /*
       * Se o usuário alterar manualmente a numeração,
       * deixa de ser considerada automática.
       */
      if (
        $("#tam")
          .classList
          .contains(
            "numero-automatico"
          )
      ) {

        $("#tam")
          .classList
          .remove(
            "numero-automatico"
          );


        const aviso =
          $("#numeroOrigem");


        aviso.textContent =
          "Numeração alterada manualmente";

        aviso.className =
          "numero-origem manual";

      }

    }
  );


$$(".lados button")
  .forEach(
    (botao) => {

      botao.onclick =
        () =>
          lado(
            botao.dataset.l
          );

    }
  );


$("#salvar").onclick =
  salvar;


$("#filtrar").onclick =
  load;


$$(".tabs button")
  .forEach(
    (botao) => {

      botao.onclick = () => {

        S =
          botao.dataset.s;


        $$(".tabs button")
          .forEach(
            (x) =>
              x.classList.toggle(
                "on",
                x === botao
              )
          );


        load();

      };

    }
  );


$$("th[data-k]")
  .forEach(
    (cabecalho) => {

      cabecalho.onclick = () => {

        const novoCampo =
          cabecalho.dataset.k;


        if (
          K === novoCampo
        ) {

          O =
            O === "asc"
              ? "desc"
              : "asc";

        } else {

          K = novoCampo;

          O = "asc";

        }


        render();

      };

    }
  );




/* ==========================================================
   AJUDA / TUTORIAL DO MÓDULO
   ========================================================== */

function abrirAjudaPesPerdidos() {
  const modal = $("#modalAjudaPesPerdidos");
  if (!modal) return;
  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  $("#fecharAjudaPesPerdidos")?.focus();
}

function fecharAjudaPesPerdidos() {
  const modal = $("#modalAjudaPesPerdidos");
  if (!modal) return;
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
  $("#abrirAjudaPesPerdidos")?.focus();
}

function ativarAjudaPesPerdidos() {
  $("#abrirAjudaPesPerdidos")?.addEventListener("click", abrirAjudaPesPerdidos);
  $("#fecharAjudaPesPerdidos")?.addEventListener("click", fecharAjudaPesPerdidos);
  $("#entendiAjudaPesPerdidos")?.addEventListener("click", fecharAjudaPesPerdidos);

  $("#modalAjudaPesPerdidos")?.addEventListener("click", (evento) => {
    if (evento.target.id === "modalAjudaPesPerdidos") {
      fecharAjudaPesPerdidos();
    }
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && $("#modalAjudaPesPerdidos")?.classList.contains("aberto")) {
      fecharAjudaPesPerdidos();
    }
  });
}

aplicarDatasPadrao();

ativarAjudaPesPerdidos();

ativarEnterSequencial();

load();
