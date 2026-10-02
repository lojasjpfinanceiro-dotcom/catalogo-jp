const API = "/api/qualidade";

let ocorrenciasBase = [];
let ocorrencias = [];
let selecionada = null;
let empresasEstoqueTabela = [];
let estoqueTabelaPorProduto = {};
let carregandoEstoquesTabela = false;
let charts = [];
let pluginRotulosQtdValorRegistrado = false;
let fornecedoresPrazo = [];
let configuracoesPrazo = [];
let marcasFornecedorAtual = [];
let vinculosFornecedorMarcaPrazo = [];
let mapaMarcaPorFornecedor = new Map();
let fornecedoresFiltradosPrazo = [];
let fornecedoresSelecionadosPrazo = new Set();
let timerBuscaFornecedor = null;

/*
 * PERFORMANCE:
 * Em consultas históricas podemos ter dezenas de milhares de ocorrências
 * em memória. Mantemos todos os dados para resumos, gráficos e filtros,
 * mas limitamos apenas a quantidade de linhas criadas no DOM da tabela.
 */
const LIMITE_LINHAS_TABELA_DOM = 600;

let cacheFiltrosDashboard =
  new Map();

let frameRenderDashboard =
  null;

let ordenacaoTabela = {
  campo:"ocorrencia",
  direcao:"desc"
};

const destinosTransferencia = new Map();

const filtrosGraficos = {
  empresa: new Set(),
  operacao: new Set(),
  statusSeta: new Set(),
  tipoOperacao: new Set(),
  credito: new Set(),
  marca: new Set(),
  fornecedor: new Set(),
  defeito: new Set(),
  prazo: new Set(),
  financeiro: new Set(),
  funcionarioEntrada: new Set(),
  nf: new Set(),
  auxiliar: new Set(),
  ocorrencia: new Set()
};

/*
 * Seleção visual da tabela.
 * A linha selecionada ganha destaque, mas as demais continuam visíveis.
 */
const selecoesTabela =
  new Set();

let timerCliqueVisual =
  null;

const ATRASO_CLIQUE_VISUAL =
  230;

const $ = seletor =>
  document.querySelector(
    seletor
  );

function valoresFiltro(
  chave
){
  const atual =
    filtrosGraficos[
      chave
    ];

  if(
    atual instanceof Set
  ){
    return atual;
  }

  const set =
    new Set();

  if(
    atual !== null
    &&
    atual !== undefined
    &&
    atual !== ""
  ){
    set.add(
      String(
        atual
      )
    );
  }

  filtrosGraficos[
    chave
  ] =
    set;

  return set;
}

function filtroTem(
  chave,
  valor
){
  return valoresFiltro(
    chave
  ).has(
    String(
      valor ??
      ""
    )
  );
}

function filtroVazio(
  chave
){
  return (
    valoresFiltro(
      chave
    ).size ===
    0
  );
}

function filtroAceita(
  chave,
  valor
){
  const set =
    valoresFiltro(
      chave
    );

  if(!set.size){
    return true;
  }

  return set.has(
    String(
      valor ??
      ""
    )
  );
}

function corSelecionada(
  chave,
  valor,
  corBase
){
  return corBase;
}

function corContornoSelecionado(
  chave,
  valor,
  corPadrao = "transparent"
){
  return filtroTem(
    chave,
    valor
  )
    ? "#ffd54a"
    : corPadrao;
}

function larguraContornoSelecionado(
  chave,
  valor,
  larguraPadrao = 0
){
  return filtroTem(
    chave,
    valor
  )
    ? 3
    : larguraPadrao;
}

function agendarCliqueVisual(
  callback
){
  clearTimeout(
    timerCliqueVisual
  );

  timerCliqueVisual =
    setTimeout(
      () => {
        timerCliqueVisual =
          null;

        callback();
      },
      ATRASO_CLIQUE_VISUAL
    );
}

function limparTodosFiltrosVisuais(){
  clearTimeout(
    timerCliqueVisual
  );

  timerCliqueVisual =
    null;

  Object.keys(
    filtrosGraficos
  ).forEach(
    chave =>
      valoresFiltro(
        chave
      ).clear()
  );

  selecoesTabela.clear();

  renderDashboard();
}

function cancelarCliqueELimparTudo(
  e
){
  if(e){
    e.preventDefault();
    e.stopPropagation();
  }

  limparTodosFiltrosVisuais();
}

function bindDuploCliqueLimpar(
  elemento
){
  if(!elemento){
    return;
  }

  elemento.ondblclick =
    cancelarCliqueELimparTudo;
}

function bindCanvasDuploClique(
  canvas
){
  if(!canvas){
    return;
  }

  canvas.ondblclick =
    cancelarCliqueELimparTudo;
}

const esc = valor =>
  String(
    valor ?? ""
  ).replace(
    /[&<>"']/g,
    c =>
      ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      })[c]
  );

const fmtQtd = valor =>
  (
    Number(valor) ||
    0
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits:2
    }
  );

const fmtMoney = valor =>
  (
    Number(valor) ||
    0
  ).toLocaleString(
    "pt-BR",
    {
      style:"currency",
      currency:"BRL"
    }
  );

function fmtData(valor){
  if(!valor){
    return "-";
  }

  const s =
    String(valor)
      .slice(
        0,
        10
      );

  const p =
    s.split("-");

  if(
    p.length === 3 &&
    p[0].length === 4
  ){
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  const d =
    new Date(valor);

  return Number.isNaN(
    d.getTime()
  )
    ? String(valor)
    : d.toLocaleDateString(
        "pt-BR"
      );
}

function fmtDataHora(
  valor
){
  if(!valor){
    return "-";
  }

  const bruto =
    String(
      valor
    ).trim();

  /*
   * PostgreSQL pode retornar:
   * 2026-09-18
   * 2026-09-18 14:32:08
   * 2026-09-18T14:32:08.000Z
   *
   * Montamos manualmente para não deslocar a data por timezone.
   */
  const match =
    bruto.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

  if(match){
    const data =
      `${match[3]}/${match[2]}/${match[1]}`;

    const hh =
      match[4];

    const mm =
      match[5];

    const ss =
      match[6];

    /*
     * Se veio apenas DATE, mostra só a data.
     * Se veio timestamp, mostra a hora real gravada.
     * Evitamos exibir 00:00:00 quando for apenas conversão de DATE.
     */
    if(
      hh !== undefined
      &&
      mm !== undefined
      &&
      !(
        hh === "00"
        &&
        mm === "00"
        &&
        (
          ss === undefined
          ||
          ss === "00"
        )
      )
    ){
      return `${data} ${hh}:${mm}${
        ss !== undefined
          ? `:${ss}`
          : ""
      }`;
    }

    return data;
  }

  const d =
    new Date(
      valor
    );

  if(
    Number.isNaN(
      d.getTime()
    )
  ){
    return bruto;
  }

  const temHora =
    d.getHours() !== 0
    ||
    d.getMinutes() !== 0
    ||
    d.getSeconds() !== 0;

  return temHora
    ? d.toLocaleString(
        "pt-BR",
        {
          day:"2-digit",
          month:"2-digit",
          year:"numeric",
          hour:"2-digit",
          minute:"2-digit",
          second:"2-digit"
        }
      )
    : d.toLocaleDateString(
        "pt-BR"
      );
}


const NOMENCLATURA_QUALIDADE = {
  D1:"Defeito - Na Loja",
  D7:"Defeito - Pré-envio",
  D2:"Defeito - Enviado",
  D5:"Defeito - Baixado",

  A1:"Análise da Fábrica - Na Loja",
  A7:"Análise da Fábrica - Pré-envio",
  A2:"Análise da Fábrica - Enviada",
  A5:"Análise da Fábrica - Baixada",

  L1:"Análise da Loja - Na Loja",
  L7:"Análise da Loja - Pré-envio",
  L2:"Análise da Loja - Enviada",
  L5:"Análise da Loja - Baixada",

  S1:"Sem Defeito - Na Loja",
  S7:"Sem Defeito - Pré-envio",
  S2:"Sem Defeito - Enviado",
  S5:"Sem Defeito - Baixado",

  C6:"Conserto - Entregue"
};

const NOMENCLATURA_PRAZO = {
  DENTRO:"Dentro do Prazo",
  ATENCAO:"Atenção",
  PROXIMO:"Próximo do Vencimento",
  CRITICO:"Crítico",
  FORA_PRAZO:"Fora do Prazo",
  SEM_PRAZO:"Prazo não Cadastrado",
  SEM_COMPRA:"Sem Última Compra"
};

const NOMENCLATURA_FINANCEIRA = {
  SEM_REGISTRO:"Sem Registro",
  EM_ANALISE:"Em Análise",
  A_INDENIZAR:"Falta Indenizar",
  A_RECEBER:"Indenizado a Receber",
  RECEBIDO_PARCIAL:"Recebido Parcial",
  RECEBIDO:"Recebido",
  RECUSADO:"Recusado"
};

const CORES_PRAZO = {
  DENTRO:"#20c978",
  ATENCAO:"#e2c348",
  PROXIMO:"#f59a23",
  CRITICO:"#ef4b5d",
  FORA_PRAZO:"#651722",
  SEM_PRAZO:"#65758a",
  SEM_COMPRA:"#425368"
};

const CORES_OPERACAO = {
  D0:"#a52d32",
  D1:"#a96118",
  D2:"#82701b",
  D3:"#82701b",

  A0:"#623ca0",
  A1:"#0878a7",
  A2:"#126b91",
  A3:"#126b91",

  S0:"#526477",
  S1:"#526477",
  S2:"#526477",
  S3:"#526477"
};

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const fim =
      new Date();

    const inicio =
      new Date(fim);

    inicio.setFullYear(
      fim.getFullYear() -
      4
    );

    $("#dataIni").value =
      inicio
        .toISOString()
        .slice(
          0,
          10
        );

    $("#dataFim").value =
      fim
        .toISOString()
        .slice(
          0,
          10
        );

    $("#recData").value =
      fim
        .toISOString()
        .slice(
          0,
          10
        );

    bind();

    /*
     * Não executa consulta automaticamente ao abrir o módulo.
     * O usuário define os filtros e somente o botão Pesquisar
     * consulta o ERP Seta.
     */
    prepararEstadoInicialQualidade();

    /*
     * Carrega apenas o cadastro Fornecedor/Marca e tolerâncias.
     * Não executa a pesquisa de ocorrências do Setor de Qualidade.
     */
    // Não bloqueia a abertura do módulo com consultas auxiliares pesadas.
    // Fornecedores/marcas/tolerâncias continuam carregando em segundo plano.
    carregarPrazosFornecedores().catch(e =>
      console.error("Carga auxiliar da qualidade:", e)
    );
  }
);

function prepararEstadoInicialQualidade(
  mensagem = "Defina os filtros e clique em Pesquisar."
){
  ocorrenciasBase = [];
  ocorrencias = [];

  destruirGraficos();

  if($("#pipelineResumo")){
    $("#pipelineResumo").innerHTML = "";
  }

  if($("#totalRegistros")){
    $("#totalRegistros").textContent = "0 registros";
  }

  if($("#tbodyOcorrencias")){
    $("#tbodyOcorrencias").innerHTML = `
      <tr>
        <td
          colspan="36"
          class="empty"
        >
          ${esc(mensagem)}
        </td>
      </tr>
    `;
  }

  if($("#detalheConteudo")){
    $("#detalheConteudo").innerHTML =
      '<div class="empty-detail">Pesquise uma ocorrência para visualizar o processo.</div>';
  }
}

function nomeOperacao(
  codigo
){
  const c =
    String(
      codigo ||
      ""
    )
      .trim()
      .toUpperCase();

  return (
    NOMENCLATURA_QUALIDADE[c] ||
    c ||
    "-"
  );
}

function nomePrazo(
  codigo
){
  return (
    NOMENCLATURA_PRAZO[
      String(
        codigo ||
        ""
      )
    ] ||
    codigo ||
    "-"
  );
}

function nomeFinanceiro(
  codigo
){
  return (
    NOMENCLATURA_FINANCEIRA[
      String(
        codigo ||
        ""
      )
    ] ||
    codigo ||
    "-"
  );
}

function bind(){

  const modalDetalheOcorrencia = $("#modalDetalheOcorrencia");
  if(modalDetalheOcorrencia){
    modalDetalheOcorrencia.addEventListener("click", e => {
      if(e.target === modalDetalheOcorrencia){
        fecharModalDetalheOcorrencia();
      }
    });
  }

  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){
      fecharModalDetalheOcorrencia();
    }
  });


  $("#btnPesquisar").onclick =
    carregarTudo;

  $("#btnLimpar").onclick =
    async () => {
      document
        .querySelectorAll(
          ".filters select, .filters input:not([type=date])"
        )
        .forEach(
          el => {
            el.value =
              "";
          }
        );

      limparFiltrosGraficos();

      prepararEstadoInicialQualidade(
        "Filtros limpos. Clique em Pesquisar para consultar o Seta."
      );
    };

  $("#btnLimparGraficos").onclick =
    () =>
      limparTodosFiltrosVisuais();

  const buscaGlobalEl = $("#buscaGlobal");
  if(buscaGlobalEl){
    buscaGlobalEl.addEventListener("input", renderDashboard);
  }

  [
    "#filtroTabelaFuncionario",
    "#filtroTabelaProduto",
    "#filtroTabelaDescricao",
    "#filtroTabelaMarca",
    "#filtroTabelaNF",
    "#filtroTabelaUltimaCompra",
    "#filtroTabelaDias",
    "#filtroTabelaFotos"
  ].forEach(seletor => {
    const el = $(seletor);
    if(el){
      el.addEventListener("input", renderDashboard);
      el.addEventListener("change", renderDashboard);
    }
  });

  const chkGraficoSemNF = $("#chkGraficoSemNF");
  if(chkGraficoSemNF){
    chkGraficoSemNF.checked = false;
    chkGraficoSemNF.addEventListener("change", () => {
      if(ocorrenciasBase.length){ renderDashboard(); }
    });
  }

  const btnLimparFiltrosTabela = $("#btnLimparFiltrosTabela");
  if(btnLimparFiltrosTabela){
    btnLimparFiltrosTabela.onclick = () => {
      [
        "#filtroTabelaFuncionario",
        "#filtroTabelaProduto",
        "#filtroTabelaDescricao",
        "#filtroTabelaMarca",
        "#filtroTabelaNF",
        "#filtroTabelaUltimaCompra",
        "#filtroTabelaDias",
        "#filtroTabelaFotos"
      ].forEach(seletor => {
        const el = $(seletor);
        if(el) el.value = "";
      });
      renderDashboard();
    };
  }

  $("#fecharDetalhe").onclick =
    () => {
      selecionada =
        null;

      $("#detalheConteudo")
        .innerHTML =
        '<div class="empty-detail">Selecione uma ocorrência para visualizar o processo.</div>';
    };

  $("#inputFotos")
    .addEventListener(
      "change",
      enviarFotos
    );

  const btnPdfTransferencia = $("#btnPdfTransferencia");
  if(btnPdfTransferencia){
    btnPdfTransferencia.onclick = gerarPdfTransferencias;
  }

  const btnPdf = $("#btnPdf");
  if(btnPdf){
    btnPdf.onclick = gerarPdf;
  }

  const btnBaixarFotos = $("#btnBaixarFotos");
  if(btnBaixarFotos){
    btnBaixarFotos.onclick = baixarFotosFiltradas;
  }

  const chkPdfEstoques = $("#chkPdfEstoques");
  if(chkPdfEstoques){
    chkPdfEstoques.addEventListener("change", async () => {
      if(chkPdfEstoques.checked){
        await carregarEstoquesTabela();
      }else{
        empresasEstoqueTabela = [];
        estoqueTabelaPorProduto = {};
        renderTabela();
      }
    });
  }

  const btnEmail = $("#btnEmail");
  if(btnEmail){
    btnEmail.onclick = enviarEmail;
  }

  const visaoGlobalGraficosEl =
    $("#visaoGlobalGraficos");

  if(visaoGlobalGraficosEl){
    visaoGlobalGraficosEl.addEventListener(
      "change",
      () => {
        if(
          Array.isArray(
            ocorrenciasBase
          )
          &&
          ocorrenciasBase.length
        ){
          renderGraficos(
            ocorrenciasBase
          );
        }
      }
    );
  }

  const visaoLinhaTempoEl =
    $("#visaoLinhaTempo");

  if(visaoLinhaTempoEl){
    visaoLinhaTempoEl.addEventListener(
      "change",
      () => {
        if(
          Array.isArray(ocorrenciasBase)
          &&
          ocorrenciasBase.length
        ){
          renderGraficos(
            ocorrenciasBase
          );
        }
      }
    );
  }

  const tipoDataEl =
    $("#tipoData");

  if(tipoDataEl){
    tipoDataEl.addEventListener(
      "change",
      () => {
        const mapa = {
          entrada_defeito:"Período pela data de entrada do defeito no Seta.",
          ultima_compra:"Período pela última compra do produto na loja da ocorrência.",
          envio:"Período pela data de envio ao fornecedor.",
          baixa:"Período pela data de baixa do processo.",
          retorno:"Período pela data de retorno.",
          entrega:"Período pela data de entrega."
        };

        tipoDataEl.title =
          mapa[
            tipoDataEl.value
          ] ||
          "";
      }
    );

    tipoDataEl.dispatchEvent(
      new Event(
        "change"
      )
    );
  }

  const chkSomenteSemCompra = $("#chkSomenteSemCompra");
  if(chkSomenteSemCompra){
    chkSomenteSemCompra.addEventListener("change", renderTabela);
  }

  $("#chkSelecionarTodos").addEventListener("change", e => {
    document.querySelectorAll("#tbodyOcorrencias .sel-rel").forEach(chk => {
      chk.checked = e.target.checked;
    });
  });

  document
    .querySelectorAll(
      "thead th.sortable"
    )
    .forEach(
      th => {
        th.addEventListener(
          "click",
          e => {
            if(
              e.target.closest(
                "input,button,a"
              )
            ){
              return;
            }

            const campo =
              th.dataset.sort;

            if(!campo){
              return;
            }

            if(
              ordenacaoTabela.campo ===
              campo
            ){
              ordenacaoTabela.direcao =
                ordenacaoTabela.direcao ===
                "asc"
                  ? "desc"
                  : "asc";
            }else{
              ordenacaoTabela = {
                campo,
                direcao:"asc"
              };
            }

            renderTabela();
          }
        );
      }
    );

  $("#btnAbrirTolerancia").onclick =
    () => {
      $("#modalTolerancia")
        .classList.remove(
          "hidden"
        );
    };

  $("#btnSalvarPrazoFornecedor").onclick =
    salvarPrazoFornecedor;

  if($("#btnGravarFiltradosMarcaFornecedor")){
    $("#btnGravarFiltradosMarcaFornecedor").onclick =
      salvarFiltradosMarcaFornecedor;
  }

  [
    $("#prazoFornecedorBusca"),
    $("#prazoMarcaBusca")
  ]
    .filter(Boolean)
    .forEach(
      input => {
        input.addEventListener(
          "input",
          () => {
            clearTimeout(
              timerBuscaFornecedor
            );

            timerBuscaFornecedor =
              setTimeout(
                () => {
                  filtrarFornecedoresPrazo(
                    true
                  );
                },
                220
              );
          }
        );
      }
    );

  $("#btnLimparBuscaFornecedor").onclick =
    async () => {
      $("#prazoFornecedorBusca").value =
        "";

      if($("#prazoMarcaBusca")){
        $("#prazoMarcaBusca").value =
          "";
      }

      fornecedoresSelecionadosPrazo.clear();

      fornecedoresFiltradosPrazo =
        [];

      renderFornecedoresEncontrados();

      await carregarMarcasFornecedoresSelecionados();
    };

  $("#chkTodosFornecedores")
    .addEventListener(
      "change",
      async e => {
        const marcar =
          !!e.target.checked;

        fornecedoresFiltradosPrazo
          .forEach(
            item => {
              const codigos =
                Array.isArray(item.codigos)
                  ? item.codigos
                  : [
                      String(
                        item.codigo ||
                        ""
                      )
                    ];

              codigos
                .filter(Boolean)
                .forEach(
                  codigo => {
                    if(marcar){
                      fornecedoresSelecionadosPrazo.add(
                        String(codigo)
                      );
                    }else{
                      fornecedoresSelecionadosPrazo.delete(
                        String(codigo)
                      );
                    }
                  }
                );
            }
          );

        renderFornecedoresEncontrados();

        await carregarMarcasFornecedoresSelecionados();
      }
    );

  $("#btnSalvarIndenizacao").onclick =
    salvarIndenizacao;

  $("#btnSalvarRecebimento").onclick =
    salvarRecebimento;

  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(
      btn => {
        btn.onclick =
          () =>
            fecharModal(
              btn.dataset.close
            );
      }
    );

  document
    .querySelectorAll(
      ".modal-backdrop"
    )
    .forEach(
      modal => {
        modal.addEventListener(
          "click",
          e => {
            if(
              e.target ===
              modal
            ){
              modal.classList.add(
                "hidden"
              );
            }
          }
        );
      }
    );
}

function params(){
  const ids = [
    "tipoData",
    "dataIni",
    "dataFim",
    "fornecedor"
  ];

  const p =
    new URLSearchParams();

  ids.forEach(
    id => {
      const el =
        $("#" + id);

      if(!el){
        return;
      }

      const valor =
        String(
          el.value ||
          ""
        ).trim();

      if(valor){
        p.set(
          id,
          valor
        );
      }
    }
  );

  return p.toString();
}

async function api(
  url,
  opt
){
  const resposta =
    await fetch(
      url,
      opt
    );

  const tipo =
    String(
      resposta.headers.get(
        "content-type"
      ) ||
      ""
    );

  const corpo =
    tipo.includes(
      "application/json"
    )
      ? await resposta.json()
      : await resposta.text();

  if(!resposta.ok){
    const mensagem =
      corpo &&
      typeof corpo ===
      "object"
        ? (
            corpo.erro ||
            corpo.mensagem ||
            JSON.stringify(
              corpo
            )
          )
        : String(
            corpo ||
            `HTTP ${resposta.status}`
          );

    throw new Error(
      mensagem
    );
  }

  return corpo;
}

async function carregarTudo(){
  setLoading(
    true
  );

  try{
    const q =
      params();

    // A pesquisa principal não espera mais a consulta de filtros.
    // Assim que as ocorrências chegam, o dashboard já pode ser exibido.
    const lista = await api(
      `${API}/ocorrencias?${q}`
    );

    // Atualiza combos em segundo plano, sem segurar o resultado principal.
    api(`${API}/filtros`)
      .then(filtros => preencherFiltros(filtros || {}))
      .catch(e => console.warn("Filtros da qualidade:", e));

    ocorrenciasBase =
      Array.isArray(
        lista
      )
        ? lista
        : (
            lista?.dados ||
            []
          );

    if($("#chkPdfEstoques")?.checked){
      await carregarEstoquesTabela(false);
    }else{
      empresasEstoqueTabela = [];
      estoqueTabelaPorProduto = {};
    }

    prepararOcorrenciasParaInteracao(
      ocorrenciasBase
    );

    cacheFiltrosDashboard.clear();

    sanearFiltrosGraficos();

    renderDashboard();

  }catch(e){
    console.error(
      "Erro Qualidade:",
      e
    );

    ocorrenciasBase =
      [];

    ocorrencias =
      [];

    destruirGraficos();

    if($("#pipelineResumo")){
      $("#pipelineResumo")
        .innerHTML =
        "";
    }

    $("#totalRegistros")
      .textContent =
      "0 registros";

    $("#tbodyOcorrencias")
      .innerHTML =
      `
        <tr>
          <td
            colspan="36"
            class="empty"
          >
            Não foi possível carregar os dados:
            ${esc(
              e.message
            )}
          </td>
        </tr>
      `;

  }finally{
    setLoading(
      false
    );
  }
}

function setLoading(
  ativo
){
  const btn =
    $("#btnPesquisar");

  btn.disabled =
    ativo;

  btn.textContent =
    ativo
      ? "Executando..."
      : "⌕ Pesquisar";
}

function preencherFiltros(
  filtros
){
  const mapa = [
    [
      "empresa",
      "empresas"
    ],
    [
      "marca",
      "marcas"
    ],
    [
      "fornecedor",
      "fornecedores"
    ],
    [
      "defeito",
      "defeitos"
    ],
    [
      "departamento",
      "departamentos"
    ],
    [
      "grupo",
      "grupos"
    ]
  ];

  mapa.forEach(
    (
      [
        id,
        chave
      ]
    ) => {
      const el =
        $("#" + id);

      if(!el){
        return;
      }

      const atual =
        el.value;

      const primeira =
        el.options[0]
          ?.outerHTML ||
        '<option value="">Todos</option>';

      const dados =
        Array.isArray(
          filtros[chave]
        )
          ? filtros[chave]
          : [];

      el.innerHTML =
        primeira +
        dados.map(
          x =>
            `
              <option
                value="${esc(
                  x.codigo ??
                  x.valor ??
                  x
                )}"
              >
                ${esc(
                  x.descricao ??
                  x.nome ??
                  x
                )}
              </option>
            `
        ).join("");

      el.value =
        atual;
    }
  );
}

async function carregarPrazosFornecedores(){

  try{
    const resposta =
      await api(
        `${API}/prazos-fornecedores`
      );

    fornecedoresPrazo =
      resposta.fornecedores ||
      [];

    configuracoesPrazo =
      resposta.configuracoes ||
      [];

    vinculosFornecedorMarcaPrazo =
      Array.isArray(
        resposta.vinculos
      )
        ? resposta.vinculos
        : [];

    mapaMarcaPorFornecedor =
      new Map();

    vinculosFornecedorMarcaPrazo
      .forEach(
        item => {
          const fornecedorCodigo =
            String(
              item.fornecedor_codigo ||
              ""
            ).trim();

          const marcaCodigo =
            String(
              item.marca_codigo ||
              ""
            ).trim();

          if(
            fornecedorCodigo &&
            marcaCodigo
          ){
            mapaMarcaPorFornecedor.set(
              `${fornecedorCodigo}|${marcaCodigo}`,
              String(
                item.marca_nome ||
                marcaCodigo
              ).trim()
            );
          }
        }
      );

    const fornecedoresUnicos =
      [
        ...new Set(
          configuracoesPrazo.map(
            x =>
              String(
                x.fornecedor_codigo ||
                ""
              ).trim()
          ).filter(Boolean)
        )
      ];

    // A rota principal já devolve todos os vínculos fornecedor/marca.
    // Evita uma requisição adicional por fornecedor configurado (N+1),
    // que era uma das maiores causas da demora ao abrir o módulo.
    if(fornecedoresUnicos.length){
      configuracoesPrazo =
        configuracoesPrazo.map(
          item => ({
            ...item,
            marca_nome:
              mapaMarcaPorFornecedor.get(
                `${String(item.fornecedor_codigo || "").trim()}|${String(item.marca_codigo || "").trim()}`
              ) ||
              item.marca_nome ||
              ""
          })
        );
    }

    renderSelectPrazoFornecedor();

    renderTabelaPrazosFornecedores();

    /*
     * Já abre com TODOS os vínculos Fornecedor/Marca do Seta.
     * Os filtros apenas reduzem a tabela.
     */
    filtrarFornecedoresPrazo(
      true
    );

  }catch(e){
    console.error(
      "Erro ao carregar prazos dos fornecedores:",
      e
    );

    if($("#tbodyPrazosFornecedores")){
      $("#tbodyPrazosFornecedores")
        .innerHTML =
        `
          <tr>
            <td colspan="7" class="empty">
              ${esc(e.message)}
            </td>
          </tr>
        `;
    }
  }
}

function normalizarBuscaFornecedor(
  valor
){
  return String(
    valor ||
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toUpperCase()
    .trim();
}


function agruparFornecedoresPrazo(lista){
  const grupos = new Map();

  (lista || []).forEach(item => {
    const nome = String(item.nome || item.codigo || "").trim();
    const codigo = String(item.codigo || "").trim();
    const chave = normalizarBuscaFornecedor(nome);

    if(!chave || !codigo){
      return;
    }

    if(!grupos.has(chave)){
      grupos.set(chave,{
        chave,
        nome,
        codigos:[]
      });
    }

    const grupo = grupos.get(chave);

    if(!grupo.codigos.includes(codigo)){
      grupo.codigos.push(codigo);
    }
  });

  return [...grupos.values()]
    .sort((a,b) =>
      String(a.nome || "").localeCompare(
        String(b.nome || ""),
        "pt-BR"
      )
    );
}

function renderSelectPrazoFornecedor(){
  filtrarFornecedoresPrazo(false);
}

function linhasFornecedorMarcaDosVinculos(
  vinculos
){
  const mapa =
    new Map();

  (vinculos || [])
    .forEach(
      vinculo => {
        const fornecedorCodigo =
          String(
            vinculo.fornecedor_codigo ||
            ""
          ).trim();

        const fornecedorNome =
          String(
            vinculo.fornecedor_nome ||
            fornecedorCodigo ||
            ""
          ).trim();

        const marcaCodigo =
          String(
            vinculo.marca_codigo ||
            ""
          ).trim();

        const marcaNome =
          String(
            vinculo.marca_nome ||
            marcaCodigo ||
            ""
          ).trim();

        if(
          !fornecedorCodigo ||
          !marcaCodigo
        ){
          return;
        }

        const configuracao =
          (configuracoesPrazo || [])
            .find(
              item =>
                String(
                  item.fornecedor_codigo ||
                  ""
                ).trim() ===
                fornecedorCodigo
                &&
                String(
                  item.marca_codigo ||
                  ""
                ).trim() ===
                marcaCodigo
            ) || null;

        const chave =
          `${normalizarBuscaFornecedor(
            fornecedorNome
          )}||${normalizarBuscaFornecedor(
            marcaNome
          )}`;

        if(!mapa.has(chave)){
          mapa.set(
            chave,
            {
              chave,
              fornecedor_nome:
                fornecedorNome,
              nome:
                marcaNome,
              vinculos:[],
              fornecedor_codigos:
                new Set()
            }
          );
        }

        const linha =
          mapa.get(chave);

        linha.fornecedor_codigos.add(
          fornecedorCodigo
        );

        linha.vinculos.push({
          fornecedor_codigo:
            fornecedorCodigo,
          marca_codigo:
            marcaCodigo,
          configuracao
        });
      }
    );

  return [
    ...mapa.values()
  ]
    .map(
      item => ({
        ...item,
        total_fornecedor_codigos:
          item.fornecedor_codigos.size
      })
    )
    .sort(
      (a,b) => {
        const f =
          String(
            a.fornecedor_nome ||
            ""
          ).localeCompare(
            String(
              b.fornecedor_nome ||
              ""
            ),
            "pt-BR"
          );

        if(f){
          return f;
        }

        return String(
          a.nome ||
          ""
        ).localeCompare(
          String(
            b.nome ||
            ""
          ),
          "pt-BR"
        );
      }
    );
}

function vinculosFornecedorMarcaFiltrados(){
  const termoFornecedor =
    normalizarBuscaFornecedor(
      $("#prazoFornecedorBusca")
        ?.value ||
      ""
    );

  const termoMarca =
    normalizarBuscaFornecedor(
      $("#prazoMarcaBusca")
        ?.value ||
      ""
    );

  return (
    vinculosFornecedorMarcaPrazo ||
    []
  )
    .filter(
      item => {
        const fornecedorNome =
          normalizarBuscaFornecedor(
            item.fornecedor_nome
          );

        const fornecedorCodigo =
          normalizarBuscaFornecedor(
            item.fornecedor_codigo
          );

        const marcaNome =
          normalizarBuscaFornecedor(
            item.marca_nome
          );

        const marcaCodigo =
          normalizarBuscaFornecedor(
            item.marca_codigo
          );

        const fornecedorOk =
          !termoFornecedor
          ||
          fornecedorNome.includes(
            termoFornecedor
          )
          ||
          fornecedorCodigo.includes(
            termoFornecedor
          );

        const marcaOk =
          !termoMarca
          ||
          marcaNome.includes(
            termoMarca
          )
          ||
          marcaCodigo.includes(
            termoMarca
          );

        return (
          fornecedorOk &&
          marcaOk
        );
      }
    );
}

function filtrarFornecedoresPrazo(
  selecionarTodos = true
){
  const vinculosEncontrados =
    vinculosFornecedorMarcaFiltrados();

  fornecedoresFiltradosPrazo =
    agruparFornecedoresPrazo(
      vinculosEncontrados.map(
        item => ({
          codigo:
            String(
              item.fornecedor_codigo ||
              ""
            ).trim(),

          nome:
            String(
              item.fornecedor_nome ||
              item.fornecedor_codigo ||
              ""
            ).trim()
        })
      )
    );

  if(selecionarTodos){
    fornecedoresSelecionadosPrazo.clear();

    vinculosEncontrados
      .forEach(
        item => {
          const codigo =
            String(
              item.fornecedor_codigo ||
              ""
            ).trim();

          if(codigo){
            fornecedoresSelecionadosPrazo.add(
              codigo
            );
          }
        }
      );
  }

  marcasFornecedorAtual =
    linhasFornecedorMarcaDosVinculos(
      vinculosEncontrados
    );

  renderFornecedoresEncontrados();

  $("#totalMarcasFornecedor")
    .textContent =
    `${marcasFornecedorAtual.length} ${
      marcasFornecedorAtual.length === 1
        ? "vínculo"
        : "vínculos"
    }`;

  renderMarcasFornecedorEdicao();
}

function grupoFornecedorSelecionado(
  grupo
){
  return (
    grupo.codigos.length > 0 &&
    grupo.codigos.every(codigo =>
      fornecedoresSelecionadosPrazo.has(
        String(codigo)
      )
    )
  );
}

function renderFornecedoresEncontrados(){
  const alvo =
    $("#fornecedoresEncontrados");

  const total =
    fornecedoresFiltradosPrazo.length;

  const totalCadastros =
    fornecedoresFiltradosPrazo.reduce(
      (soma,item) =>
        soma + item.codigos.length,
      0
    );

  $("#totalFornecedoresEncontrados")
    .textContent =
    total
      ? `${total} fornecedor${total === 1 ? "" : "es"} • ${totalCadastros} cadastro${totalCadastros === 1 ? "" : "s"}`
      : "0 encontrados";

  const temFiltro =
    Boolean(
      normalizarBuscaFornecedor(
        $("#prazoFornecedorBusca")?.value || ""
      )
      ||
      normalizarBuscaFornecedor(
        $("#prazoMarcaBusca")?.value || ""
      )
    );

  if(!total){
    alvo.innerHTML =
      `
        <span class="empty-chip">
          Nenhum vínculo Fornecedor/Marca encontrado.
        </span>
      `;

    $("#chkTodosFornecedores").checked =
      false;

    return;
  }

  $("#chkTodosFornecedores").checked =
    true;

  if(!temFiltro){
    alvo.innerHTML =
      `
        <div class="fornecedor-lista-resumo">
          Tabela completa carregada abaixo.
          Use Fornecedor e/ou Marca apenas para filtrar os vínculos que deseja gravar.
        </div>
      `;

    return;
  }

  alvo.innerHTML =
    fornecedoresFiltradosPrazo
      .map(
        grupo => {
          const marcas =
            [
              ...new Set(
                (vinculosFornecedorMarcaFiltrados() || [])
                  .filter(
                    v =>
                      grupo.codigos.includes(
                        String(
                          v.fornecedor_codigo ||
                          ""
                        ).trim()
                      )
                  )
                  .map(
                    v =>
                      String(
                        v.marca_nome ||
                        v.marca_codigo ||
                        ""
                      ).trim()
                  )
                  .filter(Boolean)
              )
            ];

          return `
            <div class="fornecedor-opcao selecionado">
              <span class="fornecedor-texto">
                <strong>${esc(grupo.nome)}</strong>
                <small>
                  ${esc(
                    marcas.slice(0,5).join(" • ")
                  )}
                  ${
                    marcas.length > 5
                      ? ` • +${marcas.length - 5}`
                      : ""
                  }
                </small>
              </span>
            </div>
          `;
        }
      )
      .join("");
}

function configuracaoMarcaConsolidada(
  vinculos
){
  const configs =
    (vinculos || [])
      .map(x => x.configuracao)
      .filter(Boolean);

  if(!configs.length){
    return {
      configurada:false,
      divergente:false,
      prazo_meses:"",
      atencao_dias:180,
      proximo_dias:90,
      critico_dias:30,
      observacao:""
    };
  }

  const primeira =
    configs[0];

  const iguais =
    configs.every(
      x =>
        Number(x.prazo_meses || 0) ===
        Number(primeira.prazo_meses || 0)
        &&
        Number(x.atencao_dias || 0) ===
        Number(primeira.atencao_dias || 0)
        &&
        Number(x.proximo_dias || 0) ===
        Number(primeira.proximo_dias || 0)
        &&
        Number(x.critico_dias || 0) ===
        Number(primeira.critico_dias || 0)
        &&
        String(x.observacao || "") ===
        String(primeira.observacao || "")
    );

  if(!iguais){
    return {
      configurada:true,
      divergente:true,
      prazo_meses:"",
      atencao_dias:"",
      proximo_dias:"",
      critico_dias:"",
      observacao:""
    };
  }

  return {
    configurada:true,
    divergente:false,
    prazo_meses:
      primeira.prazo_meses ?? "",
    atencao_dias:
      primeira.atencao_dias ?? 180,
    proximo_dias:
      primeira.proximo_dias ?? 90,
    critico_dias:
      primeira.critico_dias ?? 30,
    observacao:
      primeira.observacao || ""
  };
}

function renderMarcasFornecedorEdicao(){
  const tbody =
    $("#tbodyMarcasFornecedorEdicao");

  if(!tbody){
    return;
  }

  if(!marcasFornecedorAtual.length){
    tbody.innerHTML =
      `
        <tr>
          <td colspan="7" class="empty">
            Nenhum vínculo Fornecedor/Marca encontrado.
          </td>
        </tr>
      `;
    return;
  }

  tbody.innerHTML =
    marcasFornecedorAtual
      .map(
        (item,index) => {
          const cfg =
            configuracaoMarcaConsolidada(
              item.vinculos
            );

          const status =
            cfg.divergente
              ? "Configurações diferentes"
              : (
                  cfg.configurada
                    ? "Configurada"
                    : "Ainda não gravada"
                );

          return `
            <tr
              class="${
                cfg.configurada
                  ? "marca-configurada"
                  : ""
              }"
              data-marca-index="${index}"
            >
              <td>
                <div class="marca-edit-nome">
                  ${esc(
                    item.fornecedor_nome ||
                    "-"
                  )}
                </div>

                ${
                  Number(
                    item.total_fornecedor_codigos ||
                    0
                  ) > 1
                    ? `
                        <small class="marca-edit-status">
                          ${Number(
                            item.total_fornecedor_codigos
                          )} cadastros agrupados
                        </small>
                      `
                    : ""
                }
              </td>

              <td>
                <div class="marca-edit-nome">
                  ${esc(item.nome)}
                </div>
                <small class="marca-edit-status">
                  ${esc(status)}
                </small>
              </td>

              <td>
                <div class="marca-edit-input">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    data-campo="prazo_meses"
                    value="${esc(cfg.prazo_meses)}"
                    placeholder="Prazo"
                  >
                  <span>m</span>
                </div>
              </td>

              <td>
                <div class="marca-edit-input">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    data-campo="atencao_dias"
                    value="${esc(cfg.atencao_dias || 180)}"
                  >
                  <span>d</span>
                </div>
              </td>

              <td>
                <div class="marca-edit-input">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    data-campo="proximo_dias"
                    value="${esc(cfg.proximo_dias || 90)}"
                  >
                  <span>d</span>
                </div>
              </td>

              <td>
                <div class="marca-edit-input">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    data-campo="critico_dias"
                    value="${esc(cfg.critico_dias || 30)}"
                  >
                  <span>d</span>
                </div>
              </td>

              <td>
                <input
                  class="marca-edit-observacao"
                  data-campo="observacao"
                  value="${esc(cfg.observacao)}"
                  placeholder="Opcional"
                >
              </td>
            </tr>
          `;
        }
      )
      .join("");
}

async function carregarMarcasFornecedoresSelecionados(){
  const vinculos =
    vinculosFornecedorMarcaFiltrados();

  marcasFornecedorAtual =
    linhasFornecedorMarcaDosVinculos(
      vinculos
    );

  $("#totalMarcasFornecedor")
    .textContent =
    `${marcasFornecedorAtual.length} ${
      marcasFornecedorAtual.length === 1
        ? "vínculo"
        : "vínculos"
    }`;

  renderMarcasFornecedorEdicao();
}

// Mantém compatibilidade com chamadas antigas.
async function carregarMarcasFornecedorSelecionado(){
  return carregarMarcasFornecedoresSelecionados();
}

function editarMarcaFornecedor(
  index
){
  const item =
    marcasFornecedorAtual[
      Number(index)
    ];

  const tr =
    document.querySelector(
      `tr[data-marca-index="${Number(index)}"]`
    );

  if(!item || !tr){
    return;
  }

  const btn =
    tr.querySelector(
      ".btn-editar-marca"
    );

  const editando =
    btn?.dataset.acao ===
    "gravar";

  if(editando){
    salvarMarcaFornecedor(
      Number(index)
    );
    return;
  }

  const cfg =
    configuracaoMarcaConsolidada(
      item.vinculos
    );

  tr
    .querySelectorAll(
      "[data-campo]"
    )
    .forEach(
      input => {
        input.disabled = false;

        if(cfg.divergente){
          const campo =
            input.dataset.campo;

          if(campo === "prazo_meses"){
            input.value =
              $("#prazoMeses").value ||
              "";
          }

          if(campo === "atencao_dias"){
            input.value =
              $("#prazoAtencaoDias").value ||
              180;
          }

          if(campo === "proximo_dias"){
            input.value =
              $("#prazoProximoDias").value ||
              90;
          }

          if(campo === "critico_dias"){
            input.value =
              $("#prazoCriticoDias").value ||
              30;
          }
        }
      }
    );

  if(btn){
    btn.dataset.acao =
      "gravar";

    btn.textContent =
      "Gravar";

    btn.classList.remove(
      "secondary"
    );

    btn.classList.add(
      "primary"
    );
  }

  tr
    .querySelector(
      '[data-campo="prazo_meses"]'
    )
    ?.focus();
}

async function salvarMarcaFornecedor(
  index
){
  const item =
    marcasFornecedorAtual[
      Number(index)
    ];

  const tr =
    document.querySelector(
      `tr[data-marca-index="${Number(index)}"]`
    );

  if(!item || !tr){
    return;
  }

  const valor =
    campo =>
      String(
        tr.querySelector(
          `[data-campo="${campo}"]`
        )?.value ||
        ""
      ).trim();

  const prazoMeses =
    Number(
      valor(
        "prazo_meses"
      )
    );

  const atencaoDias =
    Number(
      valor(
        "atencao_dias"
      )
    );

  const proximoDias =
    Number(
      valor(
        "proximo_dias"
      )
    );

  const criticoDias =
    Number(
      valor(
        "critico_dias"
      )
    );

  const observacao =
    valor(
      "observacao"
    );

  if(
    !Number.isFinite(
      prazoMeses
    )
    ||
    prazoMeses <= 0
  ){
    return alert(
      "Informe o prazo da marca em meses."
    );
  }

  if(
    !(
      criticoDias <= proximoDias &&
      proximoDias <= atencaoDias
    )
  ){
    return alert(
      "A regra deve obedecer: Crítico ≤ Próximo ≤ Atenção."
    );
  }

  const porMarcaCodigo =
    new Map();

  (item.vinculos || [])
    .forEach(
      vinculo => {
        const marcaCodigo =
          String(
            vinculo.marca_codigo ||
            ""
          ).trim();

        const fornecedorCodigo =
          String(
            vinculo.fornecedor_codigo ||
            ""
          ).trim();

        if(
          !marcaCodigo ||
          !fornecedorCodigo
        ){
          return;
        }

        if(!porMarcaCodigo.has(marcaCodigo)){
          porMarcaCodigo.set(
            marcaCodigo,
            new Set()
          );
        }

        porMarcaCodigo
          .get(marcaCodigo)
          .add(
            fornecedorCodigo
          );
      }
    );

  const btn =
    tr.querySelector(
      ".btn-editar-marca"
    );

  const texto =
    btn?.textContent ||
    "Gravar";

  try{
    if(btn){
      btn.disabled =
        true;

      btn.textContent =
        "Executando...";
    }

    await Promise.all(
      [
        ...porMarcaCodigo.entries()
      ].map(
        ([marcaCodigo,codigos]) =>
          api(
            `${API}/prazos-marcas/salvar`,
            {
              method:"POST",
              headers:{
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify({
                  fornecedor_codigos:
                    [
                      ...codigos
                    ],
                  marca_codigo:
                    marcaCodigo,
                  prazo_meses:
                    prazoMeses,
                  atencao_dias:
                    atencaoDias,
                  proximo_dias:
                    proximoDias,
                  critico_dias:
                    criticoDias,
                  observacao
                })
            }
          )
      )
    );

    await carregarPrazosFornecedores();
    await carregarMarcasFornecedoresSelecionados();
    await carregarTudo();

    alert(
      `Prazo da marca ${item.nome} gravado com sucesso.`
    );

  }catch(e){
    alert(
      e.message
    );

    if(btn){
      btn.disabled =
        false;

      btn.textContent =
        texto;
    }
  }
}


async function salvarFiltradosMarcaFornecedor(){
  const btn =
    $("#btnGravarFiltradosMarcaFornecedor");

  const linhas =
    [
      ...document.querySelectorAll(
        '#tbodyMarcasFornecedorEdicao tr[data-marca-index]'
      )
    ];

  const dados =
    [];

  for(const tr of linhas){
    const index =
      Number(
        tr.dataset.marcaIndex
      );

    const item =
      marcasFornecedorAtual[
        index
      ];

    if(!item){
      continue;
    }

    const campo =
      nome =>
        String(
          tr.querySelector(
            `[data-campo="${nome}"]`
          )?.value ||
          ""
        ).trim();

    const prazoTexto =
      campo(
        "prazo_meses"
      );

    /*
     * Regra simples:
     * se não informou prazo, essa linha não é gravada.
     */
    if(!prazoTexto){
      continue;
    }

    const prazoMeses =
      Number(
        prazoTexto
      );

    const atencaoDias =
      Number(
        campo(
          "atencao_dias"
        ) ||
        0
      );

    const proximoDias =
      Number(
        campo(
          "proximo_dias"
        ) ||
        0
      );

    const criticoDias =
      Number(
        campo(
          "critico_dias"
        ) ||
        0
      );

    const observacao =
      campo(
        "observacao"
      );

    if(
      !Number.isFinite(
        prazoMeses
      )
      ||
      prazoMeses <= 0
    ){
      return alert(
        `Prazo inválido em ${item.fornecedor_nome} / ${item.nome}.`
      );
    }

    if(
      !(
        criticoDias <= proximoDias &&
        proximoDias <= atencaoDias
      )
    ){
      return alert(
        `${item.fornecedor_nome} / ${item.nome}: use Crítico ≤ Próximo ≤ Atenção.`
      );
    }

    const porMarcaCodigo =
      new Map();

    (item.vinculos || [])
      .forEach(
        vinculo => {
          const marcaCodigo =
            String(
              vinculo.marca_codigo ||
              ""
            ).trim();

          const fornecedorCodigo =
            String(
              vinculo.fornecedor_codigo ||
              ""
            ).trim();

          if(
            !marcaCodigo ||
            !fornecedorCodigo
          ){
            return;
          }

          if(
            !porMarcaCodigo.has(
              marcaCodigo
            )
          ){
            porMarcaCodigo.set(
              marcaCodigo,
              new Set()
            );
          }

          porMarcaCodigo
            .get(
              marcaCodigo
            )
            .add(
              fornecedorCodigo
            );
        }
      );

    dados.push({
      item,
      prazoMeses,
      atencaoDias,
      proximoDias,
      criticoDias,
      observacao,
      porMarcaCodigo
    });
  }

  if(!dados.length){
    return alert(
      "Nenhuma linha com prazo informado para gravar."
    );
  }

  const textoOriginal =
    btn?.textContent ||
    "Gravar Filtrados";

  try{
    if(btn){
      btn.disabled =
        true;

      btn.textContent =
        "Executando...";
    }

    await Promise.all(
      dados.flatMap(
        dadosLinha =>
          [
            ...dadosLinha.porMarcaCodigo.entries()
          ].map(
            ([marcaCodigo,codigos]) =>
              api(
                `${API}/prazos-marcas/salvar`,
                {
                  method:"POST",

                  headers:{
                    "Content-Type":
                      "application/json"
                  },

                  body:
                    JSON.stringify({
                      fornecedor_codigos:
                        [
                          ...codigos
                        ],

                      marca_codigo:
                        marcaCodigo,

                      prazo_meses:
                        dadosLinha.prazoMeses,

                      atencao_dias:
                        dadosLinha.atencaoDias,

                      proximo_dias:
                        dadosLinha.proximoDias,

                      critico_dias:
                        dadosLinha.criticoDias,

                      observacao:
                        dadosLinha.observacao
                    })
                }
              )
          )
      )
    );

    await carregarPrazosFornecedores();

    alert(
      `${dados.length} ${
        dados.length === 1
          ? "linha gravada"
          : "linhas gravadas"
      } com sucesso.`
    );

  }catch(e){
    alert(
      e.message
    );

  }finally{
    if(btn){
      btn.disabled =
        false;

      btn.textContent =
        textoOriginal;
    }
  }
}

function nomeFornecedorPrazo(
  codigo
){
  const item =
    fornecedoresPrazo.find(
      x =>
        String(
          x.codigo
        ) ===
        String(
          codigo
        )
    );

  return (
    item?.nome ||
    codigo ||
    "-"
  );
}

function nomeMarcaPrazo(
  codigo,
  fornecedorCodigo = ""
){
  const chave =
    `${String(fornecedorCodigo || "").trim()}|${String(codigo || "").trim()}`;

  if(
    mapaMarcaPorFornecedor?.has(
      chave
    )
  ){
    return (
      mapaMarcaPorFornecedor.get(
        chave
      ) ||
      codigo ||
      "-"
    );
  }

  const itemConfig =
    (
      configuracoesPrazo ||
      []
    ).find(
      x =>
        String(
          x.fornecedor_codigo ||
          ""
        ).trim()
        ===
        String(
          fornecedorCodigo ||
          ""
        ).trim()
        &&
        String(
          x.marca_codigo ||
          ""
        ).trim()
        ===
        String(
          codigo ||
          ""
        ).trim()
        &&
        String(
          x.marca_nome ||
          ""
        ).trim()
    );

  if(
    itemConfig?.marca_nome
  ){
    return itemConfig.marca_nome;
  }

  const item =
    ocorrenciasBase.find(
      x =>
        String(
          x.marca_codigo ||
          ""
        ) ===
        String(
          codigo
        )
    );

  if(item?.marca){
    return item.marca;
  }

  for(const marca of marcasFornecedorAtual){
    if(
      String(marca.codigo) ===
      String(codigo)
    ){
      return marca.nome;
    }
  }

  return "Marca não identificada";
}

function renderTabelaPrazosFornecedores(){

  if(!$("#tbodyPrazosFornecedores")){
    return;
  }

  const configuracoes =
    (
      configuracoesPrazo ||
      []
    )
      .filter(
        x =>
          x.ativo !==
          false
      );

  /*
    IMPORTANTE:
    Um mesmo fornecedor pode existir no Seta com vários códigos.
    O prazo continua gravado em TODOS os códigos/fornecedor+marca,
    porém a tabela visual não pode repetir linhas iguais.

    Agrupamento visual:
      NOME DO FORNECEDOR + NOME DA MARCA

    Se houver vários códigos com o mesmo nome e a mesma marca,
    mostramos apenas uma linha e informamos quantos cadastros
    estão agrupados.
  */
  const grupos =
    new Map();

  configuracoes.forEach(
    item => {
      const fornecedorNome =
        String(
          nomeFornecedorPrazo(
            item.fornecedor_codigo
          ) ||
          item.fornecedor_codigo ||
          ""
        ).trim();

      const marcaNome =
        String(
          nomeMarcaPrazo(
            item.marca_codigo,
            item.fornecedor_codigo
          ) ||
          item.marca_codigo ||
          ""
        ).trim();

      const chave =
        normalizarBuscaFornecedor(
          fornecedorNome
        )
        +
        "||"
        +
        normalizarBuscaFornecedor(
          marcaNome
        );

      if(
        !grupos.has(
          chave
        )
      ){
        grupos.set(
          chave,
          {
            fornecedor_nome:
              fornecedorNome,

            marca_nome:
              marcaNome,

            codigos_fornecedor:
              new Set(),

            codigos_marca:
              new Set(),

            configuracoes:
              []
          }
        );
      }

      const grupo =
        grupos.get(
          chave
        );

      grupo.codigos_fornecedor.add(
        String(
          item.fornecedor_codigo ||
          ""
        )
      );

      grupo.codigos_marca.add(
        String(
          item.marca_codigo ||
          ""
        )
      );

      grupo.configuracoes.push(
        item
      );
    }
  );

  const lista =
    [
      ...grupos.values()
    ]
      .map(
        grupo => {
          const primeira =
            grupo.configuracoes[0] ||
            {};

          const mesmaConfiguracao =
            grupo.configuracoes.every(
              x =>
                Number(
                  x.prazo_meses ||
                  0
                )
                ===
                Number(
                  primeira.prazo_meses ||
                  0
                )
                &&
                Number(
                  x.atencao_dias ||
                  0
                )
                ===
                Number(
                  primeira.atencao_dias ||
                  0
                )
                &&
                Number(
                  x.proximo_dias ||
                  0
                )
                ===
                Number(
                  primeira.proximo_dias ||
                  0
                )
                &&
                Number(
                  x.critico_dias ||
                  0
                )
                ===
                Number(
                  primeira.critico_dias ||
                  0
                )
            );

          return {
            ...grupo,

            prazo_meses:
              mesmaConfiguracao
                ? primeira.prazo_meses
                : null,

            atencao_dias:
              mesmaConfiguracao
                ? primeira.atencao_dias
                : null,

            proximo_dias:
              mesmaConfiguracao
                ? primeira.proximo_dias
                : null,

            critico_dias:
              mesmaConfiguracao
                ? primeira.critico_dias
                : null,

            observacao:
              mesmaConfiguracao
                ? (
                    primeira.observacao ||
                    ""
                  )
                : "Existem configurações diferentes entre os cadastros",

            configuracao_divergente:
              !mesmaConfiguracao
          };
        }
      )
      .sort(
        (a,b) => {
          const cmp =
            a.fornecedor_nome
              .localeCompare(
                b.fornecedor_nome,
                "pt-BR"
              );

          if(cmp){
            return cmp;
          }

          return a.marca_nome
            .localeCompare(
              b.marca_nome,
              "pt-BR"
            );
        }
      );

  $("#tbodyPrazosFornecedores")
    .innerHTML =
    lista.length
      ? lista.map(
          item => {
            const codigosFornecedor =
              [
                ...item.codigos_fornecedor
              ];

            const totalCadastros =
              codigosFornecedor.length;

            return `
              <tr
                data-fornecedor-nome="${esc(
                  item.fornecedor_nome
                )}"
              >
                <td>
                  <div class="prazo-nome-principal">
                    ${esc(
                      item.fornecedor_nome
                    )}
                  </div>

                  ${
                    totalCadastros > 1
                      ? `
                          <small class="prazo-agrupado-info">
                            ${totalCadastros} cadastros agrupados
                          </small>
                        `
                      : ""
                  }
                </td>

                <td>
                  ${esc(
                    item.marca_nome
                  )}
                </td>

                <td>
                  ${
                    item.configuracao_divergente
                      ? `
                          <span class="prazo-divergente">
                            DIFERENTE
                          </span>
                        `
                      : `
                          ${esc(
                            item.prazo_meses
                          )}
                          meses
                        `
                  }
                </td>

                <td>
                  ${
                    item.configuracao_divergente
                      ? "-"
                      : `
                          ${esc(
                            item.atencao_dias
                          )}
                          dias
                        `
                  }
                </td>

                <td>
                  ${
                    item.configuracao_divergente
                      ? "-"
                      : `
                          ${esc(
                            item.proximo_dias
                          )}
                          dias
                        `
                  }
                </td>

                <td>
                  ${
                    item.configuracao_divergente
                      ? "-"
                      : `
                          ${esc(
                            item.critico_dias
                          )}
                          dias
                        `
                  }
                </td>

                <td>
                  ${esc(
                    item.observacao ||
                    "-"
                  )}
                </td>
              </tr>
            `;
          }
        ).join("")
      : `
          <tr>
            <td
              colspan="7"
              class="empty"
            >
              Nenhum fornecedor com prazo cadastrado.
            </td>
          </tr>
        `;

  $("#tbodyPrazosFornecedores")
    .querySelectorAll(
      "[data-fornecedor-nome]"
    )
    .forEach(
      tr => {
        tr.onclick =
          () => {
            $("#prazoFornecedorBusca").value =
              tr.dataset.fornecedorNome ||
              "";

            if($("#prazoMarcaBusca")){
              const celulas =
                tr.querySelectorAll(
                  "td"
                );

              $("#prazoMarcaBusca").value =
                celulas?.[1]?.textContent?.trim() ||
                "";
            }

            filtrarFornecedoresPrazo(
              true
            );

            $("#prazoMeses")
              .focus();
          };
      }
    );
}

async function salvarPrazoFornecedor(){

  const fornecedores =
    [
      ...fornecedoresSelecionadosPrazo
    ];

  const prazoMeses =
    Number(
      $("#prazoMeses")
        .value ||
      0
    );

  const atencaoDias =
    Number(
      $("#prazoAtencaoDias")
        .value ||
      0
    );

  const proximoDias =
    Number(
      $("#prazoProximoDias")
        .value ||
      0
    );

  const criticoDias =
    Number(
      $("#prazoCriticoDias")
        .value ||
      0
    );

  const observacao =
    String(
      $("#prazoObservacao")
        .value ||
      ""
    ).trim();

  if(!fornecedores.length){
    return alert(
      "Pesquise e selecione pelo menos um fornecedor."
    );
  }

  if(
    !marcasFornecedorAtual.length
  ){
    return alert(
      "Nenhuma marca foi encontrada para os fornecedores selecionados."
    );
  }

  if(
    !Number.isFinite(
      prazoMeses
    )
    ||
    prazoMeses <= 0
  ){
    return alert(
      "Informe o prazo em meses."
    );
  }

  const btn =
    $("#btnSalvarPrazoFornecedor");

  const texto =
    btn.textContent;

  try{
    btn.disabled =
      true;

    btn.textContent =
      "Executando...";

    const porMarca =
      new Map();

    marcasFornecedorAtual
      .forEach(
        item => {
          (item.vinculos || [])
            .forEach(
              vinculo => {
                const marcaCodigo =
                  String(
                    vinculo.marca_codigo ||
                    ""
                  ).trim();

                const fornecedorCodigo =
                  String(
                    vinculo.fornecedor_codigo ||
                    ""
                  ).trim();

                if(
                  !marcaCodigo ||
                  !fornecedorCodigo
                ){
                  return;
                }

                if(!porMarca.has(marcaCodigo)){
                  porMarca.set(
                    marcaCodigo,
                    new Set()
                  );
                }

                porMarca
                  .get(marcaCodigo)
                  .add(
                    fornecedorCodigo
                  );
              }
            );
        }
      );

    const resultados =
      await Promise.all(
        [
          ...porMarca.entries()
        ].map(
          ([marcaCodigo,codigos]) =>
            api(
              `${API}/prazos-marcas/salvar`,
              {
                method:"POST",
                headers:{
                  "Content-Type":
                    "application/json"
                },
                body:
                  JSON.stringify({
                    fornecedor_codigos:[
                      ...codigos
                    ],
                    marca_codigo:
                      marcaCodigo,
                    prazo_meses:
                      prazoMeses,
                    atencao_dias:
                      atencaoDias,
                    proximo_dias:
                      proximoDias,
                    critico_dias:
                      criticoDias,
                    observacao
                  })
              }
            )
        )
      );

    const totalMarcas =
      marcasFornecedorAtual.length;

    await Promise.all([
      carregarPrazosFornecedores(),
      carregarTudo()
    ]);

    filtrarFornecedoresPrazo(
      true
    );

    alert(
      `Tolerância aplicada a ${totalMarcas} ${
        totalMarcas === 1
          ? "vínculo Fornecedor/Marca"
          : "vínculos Fornecedor/Marca"
      } filtrados.`
    );

  }catch(e){
    alert(
      e.message
    );

  }finally{
    btn.disabled =
      false;

    btn.textContent =
      texto;
  }
}

function limparFiltrosGraficos(){

  Object.keys(
    filtrosGraficos
  ).forEach(
    chave =>
      valoresFiltro(
        chave
      ).clear()
  );

  selecoesTabela.clear();
}

function statusFinanceiroCompativel(
  item,
  filtro
){
  if(!filtro){
    return true;
  }

  if(
    filtro ===
    "FALTA_INDENIZAR"
  ){
    return Number(
      item.falta_indenizar ||
      0
    ) > 0;
  }

  if(
    filtro ===
    "A_RECEBER"
  ){
    return Number(
      item.saldo_receber ||
      0
    ) > 0;
  }

  if(
    filtro ===
    "RECEBIDO"
  ){
    return Number(
      item.valor_recebido ||
      0
    ) > 0;
  }

  if(
    filtro ===
    "RECUSADO"
  ){
    return Number(
      item.valor_recusado ||
      0
    ) > 0;
  }

  return String(
    item.status_financeiro ||
    ""
  ) ===
  String(
    filtro
  );
}

function sanearFiltrosGraficos(){

  const lista =
    ocorrenciasBase ||
    [];

  const regras = {
    empresa:
      x =>
        String(
          x.empresa ||
          ""
        ),

    operacao:
      x =>
        String(
          x.situacao_codigo ||
          x.operacao ||
          ""
        ),

    statusSeta:
      x =>
        statusSetaItem(
          x
        ),

    tipoOperacao:
      x =>
        operacaoSetaItem(
          x
        ),

    credito:
      x =>
        creditoSetaItem(
          x
        ),

    marca:
      x =>
        String(
          x.marca ||
          ""
        ),

    defeito:
      x =>
        String(
          x.tipo_defeito ||
          ""
        ),

    prazo:
      x =>
        String(
          x.status_prazo ||
          ""
        )
  };

  Object.entries(
    regras
  ).forEach(
    ([chave,getter]) => {
      const set =
        valoresFiltro(
          chave
        );

      [
        ...set
      ].forEach(
        valor => {
          if(
            !lista.some(
              item =>
                String(
                  getter(
                    item
                  )
                ) ===
                String(
                  valor
                )
            )
          ){
            set.delete(
              valor
            );
          }
        }
      );
    }
  );

  const setFinanceiro =
    valoresFiltro(
      "financeiro"
    );

  [
    ...setFinanceiro
  ].forEach(
    valor => {
      if(
        !lista.some(
          item =>
            statusFinanceiroCompativel(
              item,
              valor
            )
        )
      ){
        setFinanceiro.delete(
          valor
        );
      }
    }
  );
}

function prepararOcorrenciasParaInteracao(
  lista
){
  (lista || [])
    .forEach(
      item => {
        item.__q =
          {
            empresa:
              String(
                item.empresa ||
                ""
              ),

            operacao:
              String(
                item.situacao_codigo ||
                item.operacao ||
                ""
              ),

            statusSeta:
              statusSetaItem(
                item
              ),

            tipoOperacao:
              operacaoSetaItem(
                item
              ),

            credito:
              creditoSetaItem(
                item
              ),

            marca:
              String(
                item.marca ||
                ""
              ),

            fornecedor:
              String(
                item.fornecedor ||
                item.fornecedor_nome ||
                item.fornecedor_codigo ||
                "Não informado"
              ).trim(),

            defeito:
              String(
                item.tipo_defeito ||
                ""
              ),

            prazo:
              String(
                item.status_prazo ||
                ""
              ),

            funcionarioEntrada:
              String(
                item.funcionario_entrada_codigo ||
                item.funcionario_entrada ||
                "Não informado"
              ),

            nf:
              String(
                item.nf ||
                "Sem NF"
              ).trim(),

            auxiliar:
              String(
                item.auxiliar ||
                "Sem auxiliar"
              ).trim(),

            ocorrencia:
              String(
                item.id ||
                item.conserto ||
                item.movimento ||
                ""
              )
          };

        item.__busca =
          [
            item.id,
            item.conserto,
            item.movimento,
            item.auxiliar,
            item.produto,
            item.produto_base,
            item.codigos_barras,
            item.descricao,
            item.referencia,
            item.marca,
            item.nf,
            item.fornecedor,
            item.tipo_defeito
          ]
            .map(
              valor =>
                String(
                  valor ||
                  ""
                )
                  .toLowerCase()
            )
            .join(" ");
      }
    );
}

function assinaturaFiltrosDashboard(
  ignorarChave = ""
){
  return Object
    .keys(
      filtrosGraficos
    )
    .sort()
    .map(
      chave => {
        if(chave === ignorarChave){
          return `${chave}:*`;
        }

        return `${chave}:${
          [
            ...valoresFiltro(
              chave
            )
          ]
            .sort()
            .join(",")
        }`;
      }
    )
    .join("|");
}

function aplicarFiltrosGraficos(
  lista,
  ignorarChave = ""
){
  const usaBase =
    lista ===
    ocorrenciasBase;

  const cacheKey =
    usaBase
      ? assinaturaFiltrosDashboard(
          ignorarChave
        )
      : "";

  if(
    usaBase
    &&
    cacheFiltrosDashboard.has(
      cacheKey
    )
  ){
    return cacheFiltrosDashboard.get(
      cacheKey
    );
  }

  const resultado =
    (
      lista ||
      []
    ).filter(
      item => {
        const q =
          item.__q ||
          {
            empresa:
              String(item.empresa || ""),
            operacao:
              String(
                item.situacao_codigo ||
                item.operacao ||
                ""
              ),
            statusSeta:
              statusSetaItem(item),
            tipoOperacao:
              operacaoSetaItem(item),
            credito:
              creditoSetaItem(item),
            marca:
              String(item.marca || ""),
            fornecedor:
              String(
                item.fornecedor ||
                item.fornecedor_nome ||
                item.fornecedor_codigo ||
                "Não informado"
              ).trim(),
            defeito:
              String(item.tipo_defeito || ""),
            prazo:
              String(item.status_prazo || ""),
            funcionarioEntrada:
              String(
                item.funcionario_entrada_codigo ||
                item.funcionario_entrada ||
                "Não informado"
              ),
            nf:
              String(item.nf || "Sem NF").trim(),
            auxiliar:
              String(item.auxiliar || "Sem auxiliar").trim(),
            ocorrencia:
              String(
                item.id ||
                item.conserto ||
                item.movimento ||
                ""
              )
          };

        const aceita =
          (
            chave,
            valor
          ) =>
            chave === ignorarChave
            ||
            filtroAceita(
              chave,
              valor
            );

        const financeiroOk =
          ignorarChave ===
          "financeiro"
          ||
          filtroVazio(
            "financeiro"
          )
          ||
          [
            ...valoresFiltro(
              "financeiro"
            )
          ].some(
            valor =>
              statusFinanceiroCompativel(
                item,
                valor
              )
          );

        return (
          aceita(
            "empresa",
            q.empresa
          )
          &&
          aceita(
            "operacao",
            q.operacao
          )
          &&
          aceita(
            "statusSeta",
            q.statusSeta
          )
          &&
          aceita(
            "tipoOperacao",
            q.tipoOperacao
          )
          &&
          aceita(
            "credito",
            q.credito
          )
          &&
          aceita(
            "marca",
            q.marca
          )
          &&
          aceita(
            "fornecedor",
            q.fornecedor
          )
          &&
          aceita(
            "defeito",
            q.defeito
          )
          &&
          aceita(
            "prazo",
            q.prazo
          )
          &&
          aceita(
            "funcionarioEntrada",
            q.funcionarioEntrada
          )
          &&
          aceita(
            "nf",
            q.nf
          )
          &&
          aceita(
            "auxiliar",
            q.auxiliar
          )
          &&
          aceita(
            "ocorrencia",
            q.ocorrencia
          )
          &&
          financeiroOk
        );
      }
    );

  if(usaBase){
    cacheFiltrosDashboard.set(
      cacheKey,
      resultado
    );
  }

  return resultado;
}

function normalizarTextoSeta(valor){
  return String(valor || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toUpperCase();
}

function statusSetaItem(item){
  const codigo =
    String(
      item?.status_seta ||
      ""
    )
      .trim();

  /*
   * Código oficial de consertos.status no ERP Seta.
   */
  if(codigo === "1"){
    return "NA_LOJA";
  }

  if(codigo === "7"){
    return "PRE_ENVIO";
  }

  if(codigo === "2"){
    return "ENVIADO";
  }

  if(codigo === "5"){
    return "BAIXADO";
  }

  if(codigo === "6"){
    return "CONSERTO_ENTREGUE";
  }

  /*
   * Compatibilidade apenas para registros legados/atípicos.
   * Não altera a regra principal dos códigos oficiais.
   */
  const bruto =
    normalizarTextoSeta(
      item?.status_seta
    );

  if(bruto.includes("PRE") && bruto.includes("ENV")){
    return "PRE_ENVIO";
  }

  if(bruto.includes("ENVI")){
    return "ENVIADO";
  }

  if(bruto.includes("BAIX")){
    return "BAIXADO";
  }

  if(bruto.includes("LOJA")){
    return "NA_LOJA";
  }

  const situacao =
    String(
      item?.situacao_codigo ||
      ""
    )
      .trim()
      .toUpperCase();

  const sufixo =
    situacao.slice(1);

  if(sufixo === "1"){
    return "NA_LOJA";
  }

  if(sufixo === "7"){
    return "PRE_ENVIO";
  }

  if(sufixo === "2"){
    return "ENVIADO";
  }

  if(sufixo === "5"){
    return "BAIXADO";
  }

  if(sufixo === "6"){
    return "CONSERTO_ENTREGUE";
  }

  return "NAO_INFORMADO";
}

function nomeStatusSeta(item){
  const status =
    typeof item === "string"
      ? item
      : statusSetaItem(item);

  return {
    NA_LOJA:"Na Loja",
    PRE_ENVIO:"Pré-envio",
    ENVIADO:"Enviado",
    BAIXADO:"Baixado",
    CONSERTO_ENTREGUE:"Conserto Entregue",
    NAO_INFORMADO:"Não informado"
  }[status] || status || "-";
}

function operacaoSetaItem(item){
  const bruto =
    String(
      item?.operacao_seta ||
      ""
    ).trim();

  const n =
    normalizarTextoSeta(
      bruto
    );

  if(n){
    if(n === "SEM DEFEITO"){
      return "SEM_DEFEITO";
    }

    if(n === "ANALISE DA FABRICA"){
      return "ANALISE_FABRICA";
    }

    if(n === "ANALISE DA LOJA"){
      return "ANALISE_LOJA";
    }

    if(n === "CONSERTO"){
      return "CONSERTO";
    }

    if(n === "DEFEITO"){
      return "DEFEITO";
    }

    return bruto;
  }

  const codigo =
    String(
      item?.situacao_codigo ||
      item?.operacao ||
      ""
    )
      .trim()
      .toUpperCase();

  if(codigo.startsWith("S")) return "SEM_DEFEITO";
  if(codigo.startsWith("A")) return "ANALISE_FABRICA";
  if(codigo.startsWith("L")) return "ANALISE_LOJA";
  if(codigo.startsWith("D")) return "DEFEITO";
  if(codigo.startsWith("C")) return "CONSERTO";

  return "NAO_INFORMADO";
}

function nomeOperacaoSeta(item){
  const op =
    typeof item === "string"
      ? item
      : operacaoSetaItem(item);

  return {
    ANALISE_FABRICA:"Análise da Fábrica",
    ANALISE_LOJA:"Análise da Loja",
    SEM_DEFEITO:"Sem Defeito",
    CONSERTO:"Conserto",
    DEFEITO:"Defeito",
    NAO_INFORMADO:"Não informado"
  }[op] || op || "-";
}

function creditoSetaItem(item){
  const bruto =
    String(
      item?.credito_seta ||
      ""
    ).trim();

  const n =
    normalizarTextoSeta(
      bruto
    );

  if(
    ["S","SIM","1","TRUE","T","COM CREDITO","COM CRÉDITO"].includes(n)
    ||
    n.includes("COM CREDITO")
  ){
    return "COM_CREDITO";
  }

  if(
    ["N","NAO","NÃO","0","FALSE","F","SEM CREDITO","SEM CRÉDITO"].includes(n)
    ||
    n.includes("SEM CREDITO")
  ){
    return "SEM_CREDITO";
  }

  return "NAO_INFORMADO";
}

function nomeCreditoSeta(item){
  const credito =
    typeof item === "string"
      ? item
      : creditoSetaItem(item);

  return {
    COM_CREDITO:"Com Crédito",
    SEM_CREDITO:"Sem Crédito",
    NAO_INFORMADO:"Não informado"
  }[credito] || credito || "-";
}

function resumoGrupo(
  lista,
  getKey,
  getLabel
){
  const mapa =
    new Map();

  (lista || [])
    .forEach(
      item => {
        const key =
          getKey(item);

        if(!mapa.has(key)){
          mapa.set(
            key,
            {
              key,
              label:
                getLabel(
                  key,
                  item
                ),
              quantidade:0,
              valor:0
            }
          );
        }

        const atual =
          mapa.get(key);

        atual.quantidade +=
          qtdItem(item);

        atual.valor +=
          valorItem(item);
      }
    );

  return [
    ...mapa.values()
  ];
}

function renderResumosSecundarios(lista){
  const alvoOperacoes =
    $("#resumoOperacoes");

  const alvoCreditos =
    $("#resumoCreditos");

  const listaOperacoes =
    aplicarFiltrosGraficos(
      ocorrenciasBase,
      "tipoOperacao"
    );

  const listaCreditos =
    aplicarFiltrosGraficos(
      ocorrenciasBase,
      "credito"
    );

  if(alvoOperacoes){
    const ordem = [
      "DEFEITO",
      "ANALISE_FABRICA",
      "SEM_DEFEITO",
      "CONSERTO",
      "NAO_INFORMADO"
    ];

    const dados =
      resumoGrupo(
        listaOperacoes,
        operacaoSetaItem,
        key =>
          nomeOperacaoSeta(key)
      )
        .sort(
          (a,b) =>
            ordem.indexOf(a.key) -
            ordem.indexOf(b.key)
        );

    alvoOperacoes.innerHTML =
      dados.map(
        x => `
          <button
            type="button"
            class="resumo-chip resumo-operacao ${filtroTem("tipoOperacao",x.key) ? "ativo" : ""}"
            data-operacao-resumo="${esc(x.key)}"
          >
            <b>${esc(x.label)}</b>
            <span>${fmtQtd(x.quantidade)} pares</span>
            <small>${fmtMoney(x.valor)}</small>
          </button>
        `
      ).join("");

    alvoOperacoes
      .querySelectorAll(
        "[data-operacao-resumo]"
      )
      .forEach(
        btn => {
          btn.onclick =
            () =>
              toggleFiltro(
                "tipoOperacao",
                btn.dataset.operacaoResumo
              );
        }
      );
  }

  if(alvoCreditos){
    const ordem = [
      "COM_CREDITO",
      "SEM_CREDITO",
      "NAO_INFORMADO"
    ];

    const dados =
      resumoGrupo(
        listaCreditos,
        creditoSetaItem,
        key =>
          nomeCreditoSeta(key)
      )
        .sort(
          (a,b) =>
            ordem.indexOf(a.key) -
            ordem.indexOf(b.key)
        );

    alvoCreditos.innerHTML =
      dados.map(
        x => `
          <button
            type="button"
            class="resumo-chip resumo-credito ${esc(x.key.toLowerCase())} ${filtroTem("credito",x.key) ? "ativo" : ""}"
            data-credito-resumo="${esc(x.key)}"
          >
            <b>${esc(x.label)}</b>
            <span>${fmtQtd(x.quantidade)} pares</span>
            <small>${fmtMoney(x.valor)}</small>
          </button>
        `
      ).join("");

    alvoCreditos
      .querySelectorAll(
        "[data-credito-resumo]"
      )
      .forEach(
        btn => {
          btn.onclick =
            () =>
              toggleFiltro(
                "credito",
                btn.dataset.creditoResumo
              );
        }
      );
  }
}


function renderDashboard(){
  if(
    frameRenderDashboard !==
    null
  ){
    cancelAnimationFrame(
      frameRenderDashboard
    );
  }

  frameRenderDashboard =
    requestAnimationFrame(
      () => {
        frameRenderDashboard =
          null;

        cacheFiltrosDashboard.clear();

        renderDashboardAgora();
      }
    );
}


/*
 * FILTROS DA TABELA TAMBÉM GOVERNAM O DASHBOARD.
 * Quando qualquer um destes campos é preenchido, a mesma base filtrada
 * alimenta resumos, gráficos e tabela.
 */
function aplicarFiltrosTabelaQualidade(lista){
  const busca = String($("#buscaGlobal")?.value || "")
    .trim()
    .toLowerCase();

  const filtroFuncionario = String($("#filtroTabelaFuncionario")?.value || "")
    .trim()
    .toLowerCase();

  const filtroProduto = String($("#filtroTabelaProduto")?.value || "")
    .trim()
    .toLowerCase();

  const filtroDescricao = String($("#filtroTabelaDescricao")?.value || "")
    .trim()
    .toLowerCase();

  const filtroMarca = String($("#filtroTabelaMarca")?.value || "")
    .trim()
    .toLowerCase();

  const filtroNF = String($("#filtroTabelaNF")?.value || "")
    .trim()
    .toLowerCase();

  const filtroUltimaCompra = String($("#filtroTabelaUltimaCompra")?.value || "")
    .trim();

  const filtroDiasBruto = String($("#filtroTabelaDias")?.value || "").trim();
  const filtroDias = filtroDiasBruto === "" ? null : Number(filtroDiasBruto);

  const filtroFotos = String($("#filtroTabelaFotos")?.value || "")
    .trim()
    .toUpperCase();

  return (lista || []).filter(item => {
    const funcionarioTexto = String(
      `${item.funcionario_entrada || ""} ${item.funcionario_entrada_codigo || ""}`
    ).toLowerCase();

    const produtoTexto = String(
      `${item.produto || ""} ${item.produto_base || ""}`
    ).toLowerCase();

    const descricaoTexto = String(item.descricao || "").toLowerCase();
    const marcaTexto = String(item.marca || "").toLowerCase();
    const nfTexto = String(item.nf || "").trim().toLowerCase();
    const ultimaCompra = String(item.ultima_compra || "").slice(0,10);

    const diasItem = Number(
      item.dias_restantes ?? item.dias_processo ?? NaN
    );

    return (
      (!busca || String(item.__busca || "").includes(busca))
      &&
      (!filtroFuncionario || funcionarioTexto.includes(filtroFuncionario))
      &&
      (!filtroProduto || produtoTexto.includes(filtroProduto))
      &&
      (!filtroDescricao || descricaoTexto.includes(filtroDescricao))
      &&
      (!filtroMarca || marcaTexto.includes(filtroMarca))
      &&
      (!filtroNF || nfTexto.includes(filtroNF))
      &&
      (!filtroUltimaCompra || ultimaCompra === filtroUltimaCompra)
      &&
      (
        filtroDias === null
        ||
        (Number.isFinite(diasItem) && diasItem === filtroDias)
      )
      &&
      (
        !filtroFotos
        ||
        (filtroFotos === "COM_FOTO" && Number(item.qtd_fotos || 0) > 0)
        ||
        (filtroFotos === "SEM_FOTO" && Number(item.qtd_fotos || 0) === 0)
      )
    );
  });
}

function renderDashboardAgora(){

  /*
   * Primeiro aplica os filtros digitados acima da tabela.
   * Essa passa a ser a base comum dos resumos, gráficos e tabela.
   */
  const baseTabela =
    aplicarFiltrosTabelaQualidade(
      ocorrenciasBase
    );

  /*
   * Depois aplica as seleções visuais dos gráficos.
   * Sem filtro de tabela preenchido, o comportamento visual continua normal.
   */
  ocorrencias =
    aplicarFiltrosGraficos(
      baseTabela,
      "ocorrencia"
    );

  renderResumoCincoEtapas(
    aplicarFiltrosGraficos(
      baseTabela,
      "statusSeta"
    )
  );

  renderResumosSecundarios(
    baseTabela
  );

  renderFiltrosGraficosAtivos();

  renderGraficos(
    baseTabela
  );

  renderTabela();

  if(
    selecionada
    &&
    !ocorrenciasBase.some(
      x =>
        String(
          x.id ||
          x.conserto ||
          x.movimento
        ) ===
        String(
          selecionada.id ||
          selecionada.conserto ||
          selecionada.movimento
        )
    )
  ){
    selecionada =
      null;

    $("#detalheConteudo")
      .innerHTML =
      '<div class="empty-detail">Selecione uma ocorrência para visualizar o processo.</div>';
  }
}

function qtdItem(
  item
){
  const n =
    Number(
      item?.quantidade
    );

  return Number.isFinite(
    n
  )
    ? Math.abs(
        n
      )
    : 0;
}

function valorItem(
  item
){
  /*
   * REGRA ÚNICA PARA "VALORES" NO SETOR DE QUALIDADE:
   *
   * custo do produto x quantidade do defeito daquela loja.
   *
   * Não usa preço de venda, valor do processo, indenização
   * nem unitário do movimento.
   */
  const valorBackendRaw =
    item?.valor_custo_defeito;

  const calculadoBackend =
    Number(
      valorBackendRaw
    );

  /*
   * Só aceita diretamente o valor do backend quando ele veio realmente
   * preenchido e é maior que zero. Assim, um NULL/"" convertido em 0
   * não impede o fallback pelo custo unitário.
   */
  if(
    valorBackendRaw !== null &&
    valorBackendRaw !== undefined &&
    String(valorBackendRaw).trim() !== "" &&
    Number.isFinite(calculadoBackend) &&
    Math.abs(calculadoBackend) > 0
  ){
    return Math.abs(
      calculadoBackend
    );
  }

  const quantidadeDefeito =
    Math.abs(
      Number(
        item?.quantidade ||
        0
      )
    );

  const custoUnitario =
    Math.abs(
      Number(
        item?.custo_unitario ||
        0
      )
    );

  return (
    quantidadeDefeito *
    custoUnitario
  );
}

/*
  ETAPA ÚNICA POR REGISTRO:

  5 - concluído/baixa:
      operação finalizada ou entrega registrada.

  4 - indenização:
      possui solicitação/aprovação/recebimento/recusa.

  3 - análise/fábrica:
      possui data de envio e ainda não possui retorno.

  2 - enviado:
      operação D1/A1/S1, mas ainda não entrou na condição da etapa 3.

  1 - na loja:
      D0/A0/S0 e demais registros iniciais.
*/
function calcularEtapas(
  lista
){
  const etapas = {
    NA_LOJA:{
      numero:1,
      key:"NA_LOJA",
      nome:"NA LOJA",
      quantidade:0,
      valor:0,
      classe:"stage-status-loja"
    },

    PRE_ENVIO:{
      numero:2,
      key:"PRE_ENVIO",
      nome:"PRÉ-ENVIO",
      quantidade:0,
      valor:0,
      classe:"stage-status-pre-envio"
    },

    ENVIADO:{
      numero:3,
      key:"ENVIADO",
      nome:"ENVIADO",
      quantidade:0,
      valor:0,
      classe:"stage-status-enviado"
    },

    BAIXADO:{
      numero:4,
      key:"BAIXADO",
      nome:"BAIXADO",
      quantidade:0,
      valor:0,
      classe:"stage-status-baixado"
    },

    CONSERTO_ENTREGUE:{
      numero:5,
      key:"CONSERTO_ENTREGUE",
      nome:"CONSERTO ENTREGUE",
      quantidade:0,
      valor:0,
      classe:"stage-status-conserto"
    }
  };

  (lista || [])
    .forEach(
      item => {
        const status =
          statusSetaItem(
            item
          );

        const etapa =
          etapas[status];

        /*
         * Status não mapeado não é jogado em "Na Loja".
         * Isso evita distorcer os números oficiais do Seta.
         */
        if(!etapa){
          return;
        }

        etapa.quantidade +=
          qtdItem(item);

        etapa.valor +=
          valorItem(item);
      }
    );

  return [
    etapas.NA_LOJA,
    etapas.PRE_ENVIO,
    etapas.ENVIADO,
    etapas.BAIXADO,
    etapas.CONSERTO_ENTREGUE
  ];
}

function renderResumoCincoEtapas(
  lista
){
  const etapas =
    calcularEtapas(
      lista
    );

  const alvo =
    $("#pipelineResumo");

  if(!alvo){
    return;
  }

  alvo.innerHTML =
    etapas.map(
      etapa =>
        `
          <div
            class="stage stage-resumo ${etapa.classe} ${filtroTem("statusSeta",etapa.key) ? "ativo" : ""}"
            data-status-seta="${esc(etapa.key)}"
          >
            <b>
              ${etapa.numero}
            </b>

            <div class="stage-resumo-conteudo">
              <strong>
                ${esc(etapa.nome)}
              </strong>

              <span class="stage-resumo-qtd">
                ${fmtQtd(etapa.quantidade)}
                pares
              </span>

              <span class="stage-resumo-valor">
                ${fmtMoney(etapa.valor)}
              </span>
            </div>
          </div>
        `
    ).join("");

  alvo
    .querySelectorAll(
      "[data-status-seta]"
    )
    .forEach(
      card => {
        card.addEventListener(
          "click",
          () => {
            agendarCliqueVisual(
              () =>
                toggleFiltro(
                  "statusSeta",
                  card.dataset.statusSeta
                )
            );
          }
        );

        bindDuploCliqueLimpar(
          card
        );
      }
    );
}

function renderFiltrosGraficosAtivos(){

  const alvo =
    $("#filtrosGraficosAtivos");

  const chips = [];

  const nomesFinanceiro = {
    FALTA_INDENIZAR:
      "Falta Indenizar",

    A_RECEBER:
      "Indenizado a Receber",

    RECEBIDO:
      "Recebido",

    RECUSADO:
      "Recusado"
  };

  const configuracoes = {
    empresa:{
      prefixo:"Empresa",
      nome:
        valor =>
          valor
    },

    operacao:{
      prefixo:"Situação",
      nome:
        valor =>
          nomeOperacao(
            valor
          )
    },

    statusSeta:{
      prefixo:"Status Seta",
      nome:
        valor =>
          nomeStatusSeta(
            valor
          )
    },

    tipoOperacao:{
      prefixo:"Operação",
      nome:
        valor =>
          nomeOperacaoSeta(
            valor
          )
    },

    credito:{
      prefixo:"Crédito",
      nome:
        valor =>
          nomeCreditoSeta(
            valor
          )
    },

    marca:{
      prefixo:"Marca",
      nome:
        valor =>
          valor
    },

    defeito:{
      prefixo:"Defeito",
      nome:
        valor =>
          valor
    },

    prazo:{
      prefixo:"Prazo",
      nome:
        valor =>
          nomePrazo(
            valor
          )
    },

    financeiro:{
      prefixo:"Financeiro",
      nome:
        valor =>
          nomesFinanceiro[
            valor
          ]
          ||
          nomeFinanceiro(
            valor
          )
    },

    nf:{
      prefixo:"NF",
      nome:
        valor =>
          valor
    },

    auxiliar:{
      prefixo:"Auxiliar",
      nome:valor => valor
    },

    funcionarioEntrada:{
      prefixo:"Funcionário",
      nome:
        valor => {
          const item =
            ocorrenciasBase.find(
              x =>
                String(
                  x.funcionario_entrada_codigo ||
                  x.funcionario_entrada ||
                  "Não informado"
                ) ===
                String(valor)
            );

          return item?.funcionario_entrada || valor;
        }
    },

    ocorrencia:{
      prefixo:"Ocorrência",
      nome:
        valor => valor
    }
  };

  Object.entries(
    configuracoes
  ).forEach(
    ([chave,cfg]) => {
      [
        ...valoresFiltro(
          chave
        )
      ].forEach(
        valor => {
          chips.push({
            chave,
            valor,
            texto:
              `${cfg.prefixo}: ${
                cfg.nome(
                  valor
                )
              }`
          });
        }
      );
    }
  );

  alvo.innerHTML =
    chips.length
      ? chips.map(
          chip =>
            `
              <span class="filter-chip">
                ${esc(
                  chip.texto
                )}

                <button
                  type="button"
                  data-remover-filtro="${esc(
                    chip.chave
                  )}"
                  data-remover-valor="${esc(
                    chip.valor
                  )}"
                >
                  ✕
                </button>
              </span>
            `
        ).join("")
      : `
          <span class="empty-chip">
            Nenhum filtro visual selecionado.
          </span>
        `;

  alvo
    .querySelectorAll(
      "[data-remover-filtro]"
    )
    .forEach(
      btn => {
        btn.onclick =
          () => {
            valoresFiltro(
              btn.dataset.removerFiltro
            ).delete(
              String(
                btn.dataset.removerValor ||
                ""
              )
            );

            renderDashboard();
          };

        bindDuploCliqueLimpar(
          btn
        );
      }
    );
}

function toggleFiltro(
  chave,
  valor
){
  const set =
    valoresFiltro(
      chave
    );

  const chaveValor =
    String(
      valor ??
      ""
    );

  if(
    set.has(
      chaveValor
    )
  ){
    set.delete(
      chaveValor
    );
  }else{
    set.add(
      chaveValor
    );
  }

  renderDashboard();
}

function agruparQuantidade(
  lista,
  getKey,
  getLabel
){
  const mapa =
    new Map();

  (
    lista ||
    []
  ).forEach(
    item => {
      const chave =
        getKey(
          item
        );

      if(!chave){
        return;
      }

      const atual =
        mapa.get(
          chave
        ) ||
        {
          key:
            chave,

          label:
            getLabel
              ? getLabel(
                  item,
                  chave
                )
              : chave,

          total:
            0,

          valor:
            0
        };

      atual.total +=
        qtdItem(
          item
        );

      atual.valor +=
        valorItem(
          item
        );

      mapa.set(
        chave,
        atual
      );
    }
  );

  return [
    ...mapa.values()
  ];
}

function destruirGraficos(){

  charts.forEach(
    chart => {
      try{
        chart.destroy();

      }catch(_){}
    }
  );

  charts =
    [];
}

const pluginRotulosQtdValor = {
  id:"rotulosQtdValor",

  afterDatasetsDraw(chart,args,pluginOptions){
    if(pluginOptions?.display === false){
      return;
    }

    const ctx =
      chart.ctx;

    const area =
      chart.chartArea;

    chart.data.datasets
      .forEach(
        (dataset,datasetIndex) => {
          const resumos =
            Array.isArray(dataset.resumos)
              ? dataset.resumos
              : null;

          if(!resumos){
            return;
          }

          const meta =
            chart.getDatasetMeta(datasetIndex);

          if(
            !meta ||
            meta.hidden
          ){
            return;
          }

          meta.data.forEach(
            (element,index) => {
              const resumo =
                resumos[index];

              if(!resumo){
                return;
              }

              const qtd =
                Number(
                  resumo.quantidade ||
                  0
                );

              const valor =
                Number(
                  resumo.valor ||
                  0
                );

              if(!qtd && !valor){
                return;
              }

              const texto =
                rotuloMetricaGrafico(
                  qtd,
                  valor
                );

              const props =
                element.getProps
                  ? element.getProps(
                      [
                        "x","y","base",
                        "startAngle","endAngle",
                        "innerRadius","outerRadius"
                      ],
                      true
                    )
                  : element;

              let x =
                Number(props.x || 0);

              let y =
                Number(props.y || 0);

              const horizontal =
                chart.options.indexAxis === "y";

              if(
                Number.isFinite(props.base)
              ){
                if(horizontal){
                  x =
                    Math.max(
                      Math.min(
                        props.x - 8,
                        area.right - 8
                      ),
                      area.left + 18
                    );

                  y =
                    props.y;
                }else{
                  const deslocamento =
                    index % 2 === 0
                      ? 8
                      : 20;

                  x =
                    props.x;

                  y =
                    Math.max(
                      props.y - deslocamento,
                      area.top + 12
                    );
                }
              }

              if(
                Number.isFinite(props.startAngle) &&
                Number.isFinite(props.endAngle)
              ){
                const angulo =
                  (props.startAngle + props.endAngle) / 2;

                const tamanhoAngular =
                  Math.abs(
                    props.endAngle -
                    props.startAngle
                  );

                const raio =
                  (
                    Number(props.innerRadius || 0) +
                    Number(props.outerRadius || 0)
                  ) / 2;

                x =
                  props.x +
                  Math.cos(angulo) * raio;

                y =
                  props.y +
                  Math.sin(angulo) * raio;
              }

              ctx.save();

              ctx.font =
                modoValorGraficos()
                  ? "9px Arial, sans-serif"
                  : "11px Arial, sans-serif";

              ctx.textAlign =
                horizontal &&
                Number.isFinite(props.base)
                  ? "right"
                  : "center";

              ctx.textBaseline =
                "middle";

              /*
               * Número puro, sem fundo, sem contorno e sem sombra.
               * Apenas texto branco para manter o gráfico limpo.
               */
              /*
               * TODOS os valores/quantidades devem aparecer.
               *
               * Regra visual:
               * 1) tenta escrever na horizontal;
               * 2) se não houver largura suficiente entre as barras,
               *    gira o texto para vertical;
               * 3) nunca esconde o valor.
               */
              let rotacao =
                0;

              /*
               * Linha-guia usada quando o rótulo do gráfico de pizza
               * precisa ficar fora da fatia. Assim fica claro qual
               * valor pertence a qual segmento.
               */
              let linhaGuia =
                null;

              const larguraTexto =
                ctx.measureText(
                  texto
                ).width;

              if(
                Number.isFinite(props.base)
              ){
                if(horizontal){
                  const larguraBarra =
                    Math.abs(
                      Number(props.x || 0) -
                      Number(props.base || 0)
                    );

                  if(
                    larguraTexto >
                    Math.max(
                      larguraBarra - 12,
                      28
                    )
                  ){
                    rotacao =
                      -Math.PI / 2;

                    x =
                      Math.max(
                        Math.min(
                          props.x - 5,
                          area.right - 10
                        ),
                        area.left + 10
                      );
                  }
                }else{
                  const totalElementos =
                    Math.max(
                      1,
                      meta.data.length
                    );

                  const larguraDisponivel =
                    Math.max(
                      18,
                      (
                        area.right -
                        area.left
                      ) /
                      totalElementos -
                      6
                    );

                  if(
                    larguraTexto >
                    larguraDisponivel
                  ){
                    rotacao =
                      -Math.PI / 2;

                    /*
                     * Na vertical o texto cresce para cima.
                     * Mantemos o centro dentro da área do gráfico.
                     */
                    y =
                      Math.max(
                        props.y -
                        Math.min(
                          larguraTexto / 2 + 6,
                          42
                        ),
                        area.top + 12
                      );
                  }
                }
              }

              if(
                Number.isFinite(props.startAngle) &&
                Number.isFinite(props.endAngle)
              ){
                const anguloMedio =
                  (
                    props.startAngle +
                    props.endAngle
                  ) / 2;

                const tamanhoAngular =
                  Math.abs(
                    props.endAngle -
                    props.startAngle
                  );

                const raioMedio =
                  (
                    Number(props.innerRadius || 0) +
                    Number(props.outerRadius || 0)
                  ) / 2;

                const raioExterno =
                  Number(props.outerRadius || 0);

                const arcoDisponivel =
                  tamanhoAngular *
                  Math.max(
                    raioMedio,
                    1
                  );

                if(
                  larguraTexto >
                  Math.max(
                    arcoDisponivel,
                    26
                  )
                ){
                  const afastamentoExterno =
                    18;

                  /*
                   * Ponto onde a linha nasce na borda da fatia.
                   */
                  const pontoBordaX =
                    props.x +
                    Math.cos(anguloMedio) *
                    Math.max(
                      raioExterno - 2,
                      0
                    );

                  const pontoBordaY =
                    props.y +
                    Math.sin(anguloMedio) *
                    Math.max(
                      raioExterno - 2,
                      0
                    );

                  /*
                   * Pequeno prolongamento para fora da pizza antes
                   * de seguir até o valor.
                   */
                  const pontoSaidaX =
                    props.x +
                    Math.cos(anguloMedio) *
                    (raioExterno + 8);

                  const pontoSaidaY =
                    props.y +
                    Math.sin(anguloMedio) *
                    (raioExterno + 8);

                  /*
                   * Rótulos externos da pizza ficam SOMENTE nas laterais.
                   * Mesmo quando a fatia está na parte inferior, o valor é
                   * deslocado para a esquerda ou direita, nunca para baixo.
                   */
                  const ladoDireito =
                    Math.cos(anguloMedio) >= 0;

                  x =
                    props.x +
                    (ladoDireito ? 1 : -1) *
                    (raioExterno + afastamentoExterno + 12);

                  y =
                    props.y +
                    Math.sin(anguloMedio) *
                    Math.max(
                      raioExterno * 0.72,
                      24
                    );

                  y =
                    Math.max(
                      area.top + 14,
                      Math.min(
                        y,
                        area.bottom - 14
                      )
                    );

                  ctx.textAlign =
                    ladoDireito
                      ? 'left'
                      : 'right';

                  x +=
                    ladoDireito
                      ? 6
                      : -6;

                  const cotoveloX =
                    props.x +
                    (ladoDireito ? 1 : -1) *
                    (raioExterno + 10);

                  linhaGuia = {
                    x1:pontoBordaX,
                    y1:pontoBordaY,
                    x2:cotoveloX,
                    y2:pontoSaidaY,
                    x3:
                      ladoDireito
                        ? x - 4
                        : x + 4,
                    y3:y
                  };

                  rotacao = 0;
                }
              }

              ctx.fillStyle =
                "#ffffff";

              ctx.shadowColor =
                "transparent";

              ctx.shadowBlur =
                0;

              /*
               * Desenha a linha somente para valores que ficaram fora
               * da fatia. O traço sai da pizza e termina ao lado do valor.
               */
              if(linhaGuia){
                ctx.beginPath();
                ctx.moveTo(
                  linhaGuia.x1,
                  linhaGuia.y1
                );
                ctx.lineTo(
                  linhaGuia.x2,
                  linhaGuia.y2
                );
                ctx.lineTo(
                  linhaGuia.x3,
                  linhaGuia.y3
                );
                ctx.lineWidth =
                  1.5;
                ctx.strokeStyle =
                  "rgba(255,255,255,0.90)";
                ctx.stroke();
              }

              ctx.translate(
                x,
                y
              );

              if(rotacao){
                ctx.rotate(
                  rotacao
                );
              }

              ctx.fillText(
                texto,
                0,
                0
              );

              ctx.restore();
            }
          );
        }
      );
  }
};

function modoValorGraficos(){
  return String(
    $("#visaoGlobalGraficos")?.value ||
    "QUANTIDADE"
  )
    .trim()
    .toUpperCase() ===
    "VALOR";
}

function metricaGrafico(
  quantidade,
  valor
){
  return modoValorGraficos()
    ? Number(
        valor ||
        0
      )
    : Number(
        quantidade ||
        0
      );
}

function rotuloMetricaGrafico(
  quantidade,
  valor
){
  return modoValorGraficos()
    ? fmtMoney(
        valor ||
        0
      )
    : fmtQtd(
        quantidade ||
        0
      );
}

function resumoRotulo(
  quantidade,
  valor
){
  return {
    quantidade:
      Number(quantidade || 0),

    valor:
      Number(valor || 0)
  };
}

function opcoesBaseGrafico(
  moeda = false
){
  return {
    responsive:true,

    maintainAspectRatio:false,

    /*
     * Sem animação ao trocar filtros.
     * Com muitos dados, destruir/recriar vários gráficos animados
     * era a maior sensação de travamento após o download.
     */
    animation:false,

    transitions:{
      active:{
        animation:{
          duration:0
        }
      },
      resize:{
        animation:{
          duration:0
        }
      }
    },

    font:{
      size:10,
      weight:"normal"
    },

    plugins:{
      legend:{
        labels:{
          color:"#dbe8f6",
          boxWidth:12,

          font:{
            size:10,
            weight:"normal"
          }
        }
      },

      tooltip:{
        callbacks:{
          label:
            ctx => {
              const resumos =
                Array.isArray(
                  ctx.dataset?.resumos
                )
                  ? ctx.dataset.resumos
                  : null;

              const resumo =
                resumos
                  ? resumos[
                      ctx.dataIndex
                    ]
                  : null;

              if(resumo){
                return `${fmtQtd(
                  resumo.quantidade ||
                  0
                )} pares • Custo ${fmtMoney(
                  resumo.valor ||
                  0
                )}`;
              }

              const label =
                ctx.label ||
                "";

              const valor =
                ctx.raw ||
                0;

              return moeda
                ? `${label}: ${fmtMoney(valor)}`
                : `${label}: ${fmtQtd(valor)}`;
            }
        }
      },

      rotulosQtdValor:{
        display:true
      }
    }
  };
}

function renderGraficos(
  listaBase
){

  if(
    typeof Chart ===
    "undefined"
  ){
    return;
  }

  destruirGraficos();

  if(
    !pluginRotulosQtdValorRegistrado
  ){
    Chart.register(
      pluginRotulosQtdValor
    );

    pluginRotulosQtdValorRegistrado =
      true;
  }

  renderGraficoPrazo(
    aplicarFiltrosGraficos(
      listaBase,
      "prazo"
    )
  );

  renderGraficoFinanceiro(
    aplicarFiltrosGraficos(
      listaBase,
      "financeiro"
    )
  );

  renderGraficoEmpresas(
    aplicarFiltrosGraficos(
      listaBase,
      "empresa"
    )
  );

  renderGraficoSituacoes(
    aplicarFiltrosGraficos(
      listaBase,
      "statusSeta"
    )
  );

  renderGraficoOperacoes(
    aplicarFiltrosGraficos(
      listaBase,
      "tipoOperacao"
    )
  );

  renderGraficoCredito(
    aplicarFiltrosGraficos(
      listaBase,
      "credito"
    )
  );

  renderGraficoMarcas(
    aplicarFiltrosGraficos(
      listaBase,
      "marca"
    )
  );

  renderGraficoDefeitos(
    aplicarFiltrosGraficos(
      listaBase,
      "defeito"
    )
  );

  /*
   * Fornecedores:
   * substitui o antigo gráfico "Situação Completa".
   * Continua interativo e cruza seus filtros com todos os demais gráficos.
   */
  renderGraficoFornecedores(
    aplicarFiltrosGraficos(
      listaBase,
      "fornecedor"
    )
  );

  renderGraficoFuncionarioEntrada(
    aplicarFiltrosGraficos(
      listaBase,
      "funcionarioEntrada"
    )
  );

  renderGraficoNF(
    aplicarFiltrosGraficos(
      listaBase,
      "nf"
    )
  );

  renderGraficoAuxiliar(
    aplicarFiltrosGraficos(
      listaBase,
      "auxiliar"
    )
  );

  renderGraficoLinhaTempoSituacoes(
    aplicarFiltrosGraficos(
      listaBase,
      "statusSeta"
    )
  );
}

function renderGraficoPrazo(
  lista
){

  const ordem = [
    "DENTRO",
    "ATENCAO",
    "PROXIMO",
    "CRITICO",
    "FORA_PRAZO",
    "SEM_PRAZO",
    "SEM_COMPRA"
  ];

  const dados =
    agruparQuantidade(
      lista,

      x =>
        String(
          x.status_prazo ||
          "SEM_PRAZO"
        ),

      x =>
        nomePrazo(
          x.status_prazo ||
          "SEM_PRAZO"
        )
    )
      .sort(
        (a,b) =>
          ordem.indexOf(
            a.key
          )
          -
          ordem.indexOf(
            b.key
          )
      );

  const chart =
    new Chart(
      $("#chartPrazo"),
      {
        type:"doughnut",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.total,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.total,
                      x.valor
                    )
                ),

              backgroundColor:
                dados.map(
                  x =>
                    corSelecionada(
                      "prazo",
                      x.key,
                      CORES_PRAZO[
                        x.key
                      ] ||
                      "#65758a"
                    )
                ),

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "prazo",
                      x.key,
                      "#0d1d30"
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "prazo",
                      x.key,
                      2
                    )
                )
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          onClick:
            (
              _evt,
              els
            ) => {
              if(!els.length){
                return;
              }

              const item =
                dados[
                  els[0].index
                ];

              if(item){
                agendarCliqueVisual(
                  () =>
                    toggleFiltro(
                      "prazo",
                      item.key
                    )
                );
              }
            }
        }
      }
    );

  charts.push(
    chart
  );

  bindCanvasDuploClique(
    $("#chartPrazo")
  );
}

function renderGraficoFinanceiro(
  lista
){

  const categorias = [
    {
      key:"FALTA_INDENIZAR",
      label:"Falta Indenizar",
      campo:"falta_indenizar",
      cor:"#f59a23"
    },

    {
      key:"A_RECEBER",
      label:"Indenizado a Receber",
      campo:"saldo_receber",
      cor:"#e2c348"
    },

    {
      key:"RECEBIDO",
      label:"Recebido",
      campo:"valor_recebido",
      cor:"#20c978"
    },

    {
      key:"RECUSADO",
      label:"Recusado",
      campo:"valor_recusado",
      cor:"#ef4b5d"
    }
  ];

  const resumos =
    categorias.map(
      categoria =>
        (
          lista ||
          []
        ).reduce(
          (
            atual,
            item
          ) => {
            const indicador =
              Number(
                item[
                  categoria.campo
                ] ||
                0
              );

            if(indicador !== 0){
              atual.quantidade +=
                qtdItem(item);

              /*
               * Mesmo no gráfico financeiro, a visão VALOR
               * segue a regra global do módulo:
               * custo x quantidade do defeito.
               */
              atual.valor +=
                valorItem(
                  item
                );
            }

            return atual;
          },
          {
            quantidade:0,
            valor:0
          }
        )
    );

  const valores =
    resumos.map(
      x =>
        metricaGrafico(
          x.quantidade,
          x.valor
        )
    );

  const chart =
    new Chart(
      $("#chartFinanceiro"),
      {
        type:"bar",

        data:{
          labels:
            categorias.map(
              x => x.label
            ),

          datasets:[
            {
              data:
                valores,

              resumos,

              backgroundColor:
                categorias.map(
                  x =>
                    corSelecionada(
                      "financeiro",
                      x.key,
                      x.cor
                    )
                ),

              borderColor:
                categorias.map(
                  x =>
                    corContornoSelecionado(
                      "financeiro",
                      x.key
                    )
                ),

              borderWidth:
                categorias.map(
                  x =>
                    larguraContornoSelecionado(
                      "financeiro",
                      x.key
                    )
                ),

              borderRadius:
                6
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(
            true
          ),

          plugins:{
            ...opcoesBaseGrafico(
              true
            ).plugins,

            legend:{
              display:false
            }
          },

          scales:{
            x:{
              ticks:{
                color:"#dbe8f6"
              },

              grid:{
                color:
                  "rgba(255,255,255,0.06)"
              }
            },

            y:{
              beginAtZero:true,

              ticks:{
                color:"#dbe8f6"
              },

              grid:{
                color:
                  "rgba(255,255,255,0.06)"
              }
            }
          },

          onClick:
            (
              _evt,
              els
            ) => {
              if(!els.length){
                return;
              }

              const item =
                categorias[
                  els[0].index
                ];

              if(item){
                agendarCliqueVisual(
                  () =>
                    toggleFiltro(
                      "financeiro",
                      item.key
                    )
                );
              }
            }
        }
      }
    );

  charts.push(
    chart
  );

  bindCanvasDuploClique(
    $("#chartFinanceiro")
  );
}

function quebrarNomeEmpresaGrafico(
  nome,
  maxPorLinha = 15
){
  const texto =
    String(
      nome ||
      ""
    )
      .replace(/\s+/g," ")
      .trim();

  if(!texto){
    return ["Não informado"];
  }

  const palavras =
    texto.split(" ");

  const linhas = [];
  let atual = "";

  palavras.forEach(
    palavra => {
      const tentativa =
        atual
          ? `${atual} ${palavra}`
          : palavra;

      if(
        tentativa.length > maxPorLinha
        &&
        atual
      ){
        linhas.push(atual);
        atual = palavra;
      }else{
        atual = tentativa;
      }
    }
  );

  if(atual){
    linhas.push(atual);
  }

  if(linhas.length > 3){
    const reduzidas =
      linhas.slice(0,3);

    reduzidas[2] =
      `${reduzidas[2]}…`;

    return reduzidas;
  }

  return linhas;
}

function renderGraficoEmpresas(
  lista
){

  const dados =
    agruparQuantidade(
      lista,

      x =>
        String(
          x.empresa ||
          ""
        ).trim(),

      x => {
        const codigo =
          String(
            x.empresa ||
            ""
          )
            .trim()
            .padStart(
              2,
              "0"
            );

        return codigo;
      }
    )
      .sort(
        (a,b) =>
          String(
            a.key ||
            ""
          )
            .padStart(2,"0")
            .localeCompare(
              String(
                b.key ||
                ""
              ).padStart(2,"0"),
              "pt-BR",
              {
                numeric:true
              }
            )
      );

  const chart =
    new Chart(
      $("#chartEmpresas"),
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.total,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.total,
                      x.valor
                    )
                ),

              backgroundColor:
                dados.map(
                  x =>
                    corSelecionada(
                      "empresa",
                      x.key,
                      "#2784ff"
                    )
                ),

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "empresa",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "empresa",
                      x.key
                    )
                ),

              borderRadius:
                6
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          plugins:{
            ...opcoesBaseGrafico()
              .plugins,

            legend:{
              display:false
            }
          },

          scales:{
            x:{
              ticks:{
                color:"#dbe8f6",
                maxRotation:0,
                minRotation:0,
                autoSkip:false,

                font:{
                  size:9,
                  weight:"normal"
                }
              },

              grid:{
                color:
                  "rgba(255,255,255,0.06)"
              }
            },

            y:{
              beginAtZero:true,

              ticks:{
                color:"#dbe8f6",
                precision:0,

                font:{
                  size:10,
                  weight:"normal"
                }
              },

              grid:{
                color:
                  "rgba(255,255,255,0.06)"
              }
            }
          },

          onClick:
            (
              evt,
              els,
              chart
            ) => {
              let indice =
                els?.length
                  ? els[0].index
                  : null;

              /*
               * Além da barra, permite clicar diretamente no nome/número
               * da loja exibido no eixo X para selecionar a loja.
               *
               * Em escala "category", getValueForPixel pode devolver o
               * próprio texto do rótulo (ex.: "Loja 03") e não o índice.
               * Por isso localizamos o tick mais próximo pelo pixel real.
               */
              if(
                indice === null ||
                indice === undefined
              ){
                const escalaX =
                  chart?.scales?.x;

                const x = Number(evt?.x);
                const y = Number(evt?.y);

                if(
                  escalaX &&
                  Number.isFinite(x) &&
                  Number.isFinite(y)
                ){
                  const topoAreaRotulo =
                    Math.min(
                      Number(escalaX.top || 0),
                      Number(chart?.height || 0)
                    );

                  const baseAreaRotulo =
                    Math.max(
                      Number(escalaX.bottom || 0),
                      Number(chart?.height || 0)
                    );

                  if(
                    y >= topoAreaRotulo - 4 &&
                    y <= baseAreaRotulo + 4
                  ){
                    let melhorIndice = null;
                    let menorDistancia = Infinity;

                    dados.forEach(
                      (_item,i) => {
                        const px =
                          Number(
                            escalaX.getPixelForTick(i)
                          );

                        if(!Number.isFinite(px)){
                          return;
                        }

                        const distancia =
                          Math.abs(x - px);

                        if(distancia < menorDistancia){
                          menorDistancia = distancia;
                          melhorIndice = i;
                        }
                      }
                    );

                    const larguraMediaTick =
                      dados.length > 0
                        ? Math.max(
                            26,
                            Number(escalaX.width || 0) / dados.length
                          )
                        : 26;

                    if(
                      melhorIndice !== null &&
                      menorDistancia <= larguraMediaTick / 2 + 8
                    ){
                      indice = melhorIndice;
                    }
                  }
                }
              }

              if(
                indice === null ||
                indice === undefined
              ){
                return;
              }

              const item = dados[indice];

              if(item){
                agendarCliqueVisual(
                  () =>
                    toggleFiltro(
                      "empresa",
                      item.key
                    )
                );
              }
            }
        }
      }
    );

  charts.push(
    chart
  );

  /*
   * Clique direto no NOME/NÚMERO da loja no eixo X.
   *
   * O onClick do Chart.js pode não entregar elemento quando a barra
   * é muito baixa ou quando o clique acontece exatamente no rótulo.
   * Aqui tratamos o clique no canvas diretamente e transformamos a
   * posição X no tick/loja correspondente.
   */
  {
    const canvasLoja =
      $("#chartEmpresas");

    if(canvasLoja){
      if(canvasLoja._qualidadeCliqueRotuloLoja){
        canvasLoja.removeEventListener(
          "click",
          canvasLoja._qualidadeCliqueRotuloLoja
        );
      }

      const clicarRotuloLoja =
        evento => {
          const escalaX =
            chart?.scales?.x;

          const areaGrafico =
            chart?.chartArea;

          if(
            !escalaX ||
            !areaGrafico ||
            !dados.length
          ){
            return;
          }

          const rect =
            canvasLoja.getBoundingClientRect();

          if(
            !rect.width ||
            !rect.height
          ){
            return;
          }

          const x =
            (evento.clientX - rect.left) *
            (canvasLoja.width / rect.width) /
            (window.devicePixelRatio || 1);

          const y =
            (evento.clientY - rect.top) *
            (canvasLoja.height / rect.height) /
            (window.devicePixelRatio || 1);

          /*
           * Só intercepta a faixa dos nomes das lojas, abaixo da área
           * das barras. Clique na barra continua sendo tratado pelo
           * próprio Chart.js.
           */
          const inicioRotulos =
            Number(areaGrafico.bottom || escalaX.top || 0) - 2;

          const fimRotulos =
            Number(escalaX.bottom || chart.height || 0) + 8;

          if(
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            y < inicioRotulos ||
            y > fimRotulos
          ){
            return;
          }

          let indiceMaisPerto = null;
          let menorDistancia = Infinity;

          dados.forEach(
            (_item,i) => {
              const px =
                Number(
                  escalaX.getPixelForTick(i)
                );

              if(!Number.isFinite(px)){
                return;
              }

              const distancia =
                Math.abs(x - px);

              if(distancia < menorDistancia){
                menorDistancia = distancia;
                indiceMaisPerto = i;
              }
            }
          );

          const faixaLoja =
            Math.max(
              34,
              Number(escalaX.width || 0) /
              Math.max(dados.length,1)
            );

          if(
            indiceMaisPerto === null ||
            menorDistancia > faixaLoja * 0.60
          ){
            return;
          }

          evento.preventDefault();
          evento.stopPropagation();

          const item =
            dados[indiceMaisPerto];

          if(item){
            agendarCliqueVisual(
              () =>
                toggleFiltro(
                  "empresa",
                  item.key
                )
            );
          }
        };

      canvasLoja._qualidadeCliqueRotuloLoja =
        clicarRotuloLoja;

      canvasLoja.addEventListener(
        "click",
        clicarRotuloLoja
      );
    }
  }

  bindCanvasDuploClique(
    $("#chartEmpresas")
  );
}

function renderGraficoSituacoes(
  lista
){
  const ordem = [
    "NA_LOJA",
    "PRE_ENVIO",
    "ENVIADO",
    "BAIXADO",
    "CONSERTO_ENTREGUE",
    "NAO_INFORMADO"
  ];

  const cores = {
    NA_LOJA:"#a52d32",
    PRE_ENVIO:"#c28217",
    ENVIADO:"#a96118",
    BAIXADO:"#20c978",
    CONSERTO_ENTREGUE:"#2784ff",
    NAO_INFORMADO:"#65758a"
  };

  const dados =
    resumoGrupo(
      lista,
      statusSetaItem,
      key =>
        nomeStatusSeta(
          key
        )
    )
      .sort(
        (a,b) =>
          ordem.indexOf(a.key) -
          ordem.indexOf(b.key)
      );

  const chart =
    new Chart(
      $("#chartSituacoes"),
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              label:"Pares",
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.quantidade,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.quantidade,
                      x.valor
                    )
                ),

              backgroundColor:
                dados.map(
                  x =>
                    corSelecionada(
                      "statusSeta",
                      x.key,
                      cores[x.key] ||
                      "#526477"
                    )
                ),

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "statusSeta",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "statusSeta",
                      x.key
                    )
                ),

              borderRadius:6
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          plugins:{
            ...opcoesBaseGrafico().plugins,
            legend:{
              display:false
            }
          },

          scales:{
            x:{
              ticks:{
                color:"#dbe8f6"
              },
              grid:{
                color:"rgba(255,255,255,0.06)"
              }
            },

            y:{
              beginAtZero:true,
              ticks:{
                color:"#dbe8f6"
              },
              grid:{
                color:"rgba(255,255,255,0.06)"
              }
            }
          },

          onClick:(_evt,els) => {
            if(!els.length) return;

            const item =
              dados[
                els[0].index
              ];

            if(item){
              agendarCliqueVisual(
                () =>
                  toggleFiltro(
                    "statusSeta",
                    item.key
                  )
              );
            }
          }
        }
      }
    );

  charts.push(chart);

  bindCanvasDuploClique(
    $("#chartSituacoes")
  );
}

function renderGraficoOperacoes(
  lista
){
  const ordem = [
    "DEFEITO",
    "ANALISE_FABRICA",
    "SEM_DEFEITO",
    "CONSERTO",
    "NAO_INFORMADO"
  ];

  const dados =
    resumoGrupo(
      lista,
      operacaoSetaItem,
      key =>
        nomeOperacaoSeta(
          key
        )
    )
      .sort(
        (a,b) =>
          ordem.indexOf(a.key) -
          ordem.indexOf(b.key)
      );

  const chart =
    new Chart(
      $("#chartOperacoes"),
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              label:"Pares",
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.quantidade,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.quantidade,
                      x.valor
                    )
                ),

              backgroundColor:
                dados.map(
                  (x,index) =>
                    corSelecionada(
                      "tipoOperacao",
                      x.key,
                      [
                        "#b63139",
                        "#7447b6",
                        "#2784ff",
                        "#65758a",
                        "#425368"
                      ][index] ||
                      "#526477"
                    )
                ),

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "tipoOperacao",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "tipoOperacao",
                      x.key
                    )
                ),

              borderRadius:6
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          plugins:{
            ...opcoesBaseGrafico().plugins,
            legend:{
              display:false
            }
          },

          scales:{
            x:{
              ticks:{
                color:"#dbe8f6",
                maxRotation:0,
                minRotation:0
              },
              grid:{
                color:"rgba(255,255,255,0.06)"
              }
            },

            y:{
              beginAtZero:true,
              ticks:{
                color:"#dbe8f6"
              },
              grid:{
                color:"rgba(255,255,255,0.06)"
              }
            }
          },

          onClick:(_evt,els) => {
            if(!els.length) return;

            const item =
              dados[
                els[0].index
              ];

            if(item){
              toggleFiltro(
                "tipoOperacao",
                item.key
              );
            }
          }
        }
      }
    );

  charts.push(chart);

  bindCanvasDuploClique(
    $("#chartOperacoes")
  );
}

function renderGraficoCredito(
  lista
){
  const ordem = [
    "COM_CREDITO",
    "SEM_CREDITO",
    "NAO_INFORMADO"
  ];

  const dados =
    resumoGrupo(
      lista,
      creditoSetaItem,
      key =>
        nomeCreditoSeta(
          key
        )
    )
      .sort(
        (a,b) =>
          ordem.indexOf(a.key) -
          ordem.indexOf(b.key)
      );

  const chart =
    new Chart(
      $("#chartCredito"),
      {
        type:"doughnut",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.quantidade,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.quantidade,
                      x.valor
                    )
                ),

              backgroundColor:
                dados.map(
                  (x,index) =>
                    corSelecionada(
                      "credito",
                      x.key,
                      [
                        "#20c978",
                        "#ef4b5d",
                        "#65758a"
                      ][index] ||
                      "#526477"
                    )
                ),

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "credito",
                      x.key,
                      "#0d1d30"
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "credito",
                      x.key,
                      2
                    )
                )
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          onClick:(_evt,els) => {
            if(!els.length) return;

            const item =
              dados[
                els[0].index
              ];

            if(item){
              toggleFiltro(
                "credito",
                item.key
              );
            }
          }
        }
      }
    );

  charts.push(chart);

  bindCanvasDuploClique(
    $("#chartCredito")
  );
}

function renderGraficoMarcas(
  lista
){

  const dados =
    agruparQuantidade(
      lista,

      x =>
        String(
          x.marca ||
          ""
        ).trim()
        ||
        "Sem marca",

      x =>
        String(
          x.marca ||
          ""
        ).trim()
        ||
        "Sem marca"
    )
      .sort(
        (a,b) =>
          metricaGrafico(
            b.total,
            b.valor
          ) -
          metricaGrafico(
            a.total,
            a.valor
          )
      );

  const areaMarcas =
    $("#chartMarcasArea");

  if(areaMarcas){
    const alturaPorMarca = 36;
    const alturaMinima = 420;

    areaMarcas.style.height =
      `${Math.max(
        alturaMinima,
        dados.length * alturaPorMarca
      )}px`;
  }

  const chart =
    new Chart(
      $("#chartMarcas"),
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.total,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.total,
                      x.valor
                    )
                ),

              backgroundColor:
                "#2bb6df",

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "marca",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "marca",
                      x.key
                    )
                ),

              borderRadius:
                6
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),


          plugins:{
            ...opcoesBaseGrafico()
              .plugins,

            legend:{
              display:false
            }
          },

          scales:{
            x:{
              beginAtZero:true,

              ticks:{
                  autoSkip:false,
                  maxRotation:35,
                  minRotation:35,
                color:"#dbe8f6"
              },

              grid:{
                color:
                  "rgba(255,255,255,0.06)"
              }
            },

            y:{
              ticks:{
                color:"#dbe8f6"
              },

              grid:{
                display:false
              }
            }
          },

          onClick:
            (
              _evt,
              els
            ) => {
              if(!els.length){
                return;
              }

              const item =
                dados[
                  els[0].index
                ];

              if(item){
                agendarCliqueVisual(
                  () =>
                    toggleFiltro(
                      "marca",
                      item.key
                    )
                );
              }
            }
        }
      }
    );

  charts.push(
    chart
  );

  bindCanvasDuploClique(
    $("#chartMarcas")
  );
}

function renderGraficoDefeitos(
  lista
){

  const dados =
    agruparQuantidade(
      lista,

      x =>
        String(
          x.tipo_defeito ||
          ""
        ).trim()
        ||
        "Não informado",

      x =>
        String(
          x.tipo_defeito ||
          ""
        ).trim()
        ||
        "Não informado"
    )
      .sort(
        (a,b) =>
          metricaGrafico(
            b.total,
            b.valor
          ) -
          metricaGrafico(
            a.total,
            a.valor
          )
      )
      .slice(
        0,
        12
      );

  const chart =
    new Chart(
      $("#chartDefeitos"),
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.label
            ),

          datasets:[
            {
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.total,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.total,
                      x.valor
                    )
                ),

              backgroundColor:
                "#8d5cf6",

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "defeito",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "defeito",
                      x.key
                    )
                ),

              borderRadius:
                6
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          indexAxis:"y",

          plugins:{
            ...opcoesBaseGrafico()
              .plugins,

            legend:{
              display:false
            }
          },

          scales:{
            x:{
              beginAtZero:true,

              ticks:{
                color:"#dbe8f6"
              },

              grid:{
                color:
                  "rgba(255,255,255,0.06)"
              }
            },

            y:{
              ticks:{
                color:"#dbe8f6"
              },

              grid:{
                display:false
              }
            }
          },

          onClick:
            (
              _evt,
              els
            ) => {
              if(!els.length){
                return;
              }

              const item =
                dados[
                  els[0].index
                ];

              if(item){
                agendarCliqueVisual(
                  () =>
                    toggleFiltro(
                      "defeito",
                      item.key
                    )
                );
              }
            }
        }
      }
    );

  charts.push(
    chart
  );

  bindCanvasDuploClique(
    $("#chartDefeitos")
  );
}


function renderGraficoFuncionarioEntrada(
  lista
){
  const canvas =
    $("#chartFuncionarioEntrada");

  if(!canvas){
    return;
  }

  const mapa =
    new Map();

  (lista || [])
    .forEach(
      item => {
        const codigo =
          String(
            item.funcionario_entrada_codigo ||
            ""
          ).trim();

        const nome =
          String(
            item.funcionario_entrada ||
            codigo ||
            "Não informado"
          ).trim();

        const chave =
          codigo ||
          nome ||
          "Não informado";

        if(!mapa.has(chave)){
          mapa.set(
            chave,
            {
              key:chave,
              nome:nome || chave,
              quantidade:0,
              valor:0
            }
          );
        }

        const atual =
          mapa.get(
            chave
          );

        atual.quantidade +=
          qtdItem(
            item
          );

        atual.valor +=
          valorItem(
            item
          );
      }
    );

  const dados =
    [
      ...mapa.values()
    ]
      .sort(
        (a,b) =>
          metricaGrafico(
            b.quantidade,
            b.valor
          ) -
          metricaGrafico(
            a.quantidade,
            a.valor
          )
      )
      .slice(
        0,
        20
      );

  const chart =
    new Chart(
      canvas,
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.nome
            ),

          datasets:[
            {
              label:"Quantidade",

              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.quantidade,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.quantidade,
                      x.valor
                    )
                ),

              backgroundColor:
                "#287fd1",

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "funcionarioEntrada",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "funcionarioEntrada",
                      x.key
                    )
                ),

              borderRadius:5,
              borderSkipped:false
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          indexAxis:"y",

          plugins:{
            ...opcoesBaseGrafico().plugins,

            legend:{
              display:false
            },

            rotulosQtdValor:{
              display:true
            }
          },

          scales:{
            x:{
              beginAtZero:true,

              ticks:{
                color:"#dbe8f6",
                precision:0,

                font:{
                  size:10,
                  weight:"normal"
                }
              },

              grid:{
                color:
                  "rgba(255,255,255,.06)"
              }
            },

            y:{
              ticks:{
                color:"#dbe8f6",
                autoSkip:false,

                font:{
                  size:10,
                  weight:"normal"
                }
              },

              grid:{
                display:false
              }
            }
          }
       ,

          onClick:(_evt,els) => {
            if(!els.length){
              return;
            }

            const item =
              dados[
                els[0].index
              ];

            if(item){
              agendarCliqueVisual(
                () =>
                  toggleFiltro(
                    "funcionarioEntrada",
                    item.key
                  )
              );
            }
          }
        }
      }
    );

  charts.push(
    chart
  );

  bindCanvasDuploClique(
    canvas
  );
}


function renderGraficoNF(
  lista
){
  const canvas = $("#chartNF");

  if(!canvas){
    return;
  }

  const mapa = new Map();

  (lista || []).forEach(item => {
    const nfBruta = String(item.nf || "").trim();
    const chave = nfBruta || "Sem NF";

    if(!mapa.has(chave)){
      mapa.set(chave,{
        key:chave,
        nome:chave,
        quantidade:0,
        valor:0
      });
    }

    const atual = mapa.get(chave);
    atual.quantidade += qtdItem(item);
    atual.valor += valorItem(item);
  });

  const mostrarSemNF = !!$("#chkGraficoSemNF")?.checked;
  const dados = [...mapa.values()]
    .filter(x => mostrarSemNF || x.key !== "Sem NF")
    .sort(
      (a,b) =>
        metricaGrafico(b.quantidade,b.valor) -
        metricaGrafico(a.quantidade,a.valor)
    )
    ;

  // Mantém a rolagem das NFs sem ultrapassar o limite de tamanho do canvas
  // do navegador. Um canvas excessivamente alto pode ficar totalmente branco.
  const areaNF = $("#chartNFArea");
  if(areaNF){
    const alturaDesejada = Math.max(320, dados.length * 31 + 85);
    const alturaSegura = Math.min(12000, alturaDesejada);
    areaNF.style.height = `${alturaSegura}px`;
  }

  const chart = new Chart(
    canvas,
    {
      type:"bar",

      data:{
        labels:dados.map(x => x.nome),

        datasets:[
          {
            label:"Quantidade",
            data:dados.map(
              x => metricaGrafico(x.quantidade,x.valor)
            ),
            resumos:dados.map(
              x => resumoRotulo(x.quantidade,x.valor)
            ),
            backgroundColor:"#287fd1",
            borderColor:dados.map(
              x => corContornoSelecionado("nf",x.key)
            ),
            borderWidth:dados.map(
              x => larguraContornoSelecionado("nf",x.key)
            ),
            borderRadius:5,
            borderSkipped:false
          }
        ]
      },

      options:{
        ...opcoesBaseGrafico(),

        indexAxis:"y",

        plugins:{
          ...opcoesBaseGrafico().plugins,

          legend:{
            display:false
          },

          rotulosQtdValor:{
            display:true
          }
        },

        scales:{
          x:{
            beginAtZero:true,
            ticks:{
              color:"#dbe8f6",
              precision:0,
              font:{
                size:10,
                weight:"normal"
              }
            },
            grid:{
              color:"rgba(255,255,255,.06)"
            }
          },

          y:{
            ticks:{
              color:"#dbe8f6",
              autoSkip:false,
              font:{
                size:10,
                weight:"normal"
              }
            },
            grid:{
              display:false
            }
          }
        },

        onClick:(_evt,els) => {
          if(!els.length){
            return;
          }

          const item = dados[els[0].index];

          if(item){
            agendarCliqueVisual(
              () => toggleFiltro("nf",item.key)
            );
          }
        }
      }
    }
  );

  charts.push(chart);
  bindCanvasDuploClique(canvas);
}


function renderGraficoAuxiliar(
  lista
){
  const canvas = $("#chartAuxiliar");
  if(!canvas) return;

  const mapa = new Map();
  (lista || []).forEach(item => {
    const auxiliar = String(item.auxiliar || "").trim() || "Sem auxiliar";
    if(!mapa.has(auxiliar)){
      mapa.set(auxiliar,{key:auxiliar,nome:auxiliar,quantidade:0,valor:0});
    }
    const atual = mapa.get(auxiliar);
    atual.quantidade += qtdItem(item);
    atual.valor += valorItem(item);
  });

  const dados = [...mapa.values()].sort(
    (a,b) => metricaGrafico(b.quantidade,b.valor) - metricaGrafico(a.quantidade,a.valor)
  );

  const area = $("#chartAuxiliarArea");
  if(area){
    area.style.height = `${Math.min(12000,Math.max(320,dados.length * 31 + 85))}px`;
  }

  const chart = new Chart(canvas,{
    type:"bar",
    data:{
      labels:dados.map(x => x.nome),
      datasets:[{
        label:"Quantidade",
        data:dados.map(x => metricaGrafico(x.quantidade,x.valor)),
        resumos:dados.map(x => resumoRotulo(x.quantidade,x.valor)),
        backgroundColor:"#287fd1",
        borderColor:dados.map(x => corContornoSelecionado("auxiliar",x.key)),
        borderWidth:dados.map(x => larguraContornoSelecionado("auxiliar",x.key)),
        borderRadius:5,
        borderSkipped:false
      }]
    },
    options:{
      ...opcoesBaseGrafico(),
      indexAxis:"y",
      plugins:{
        ...opcoesBaseGrafico().plugins,
        legend:{display:false},
        rotulosQtdValor:{display:true}
      },
      scales:{
        x:{beginAtZero:true,ticks:{color:"#dbe8f6",precision:0,font:{size:10,weight:"normal"}},grid:{color:"rgba(255,255,255,.06)"}},
        y:{ticks:{color:"#dbe8f6",autoSkip:false,font:{size:10,weight:"normal"}},grid:{display:false}}
      },
      onClick:(_evt,els) => {
        if(!els.length) return;
        const item = dados[els[0].index];
        if(item){
          agendarCliqueVisual(() => toggleFiltro("auxiliar",item.key));
        }
      }
    }
  });

  charts.push(chart);
  bindCanvasDuploClique(canvas);
}


function renderGraficoFornecedores(
  lista
){
  const canvas =
    $("#chartFornecedores");

  if(!canvas){
    return;
  }

  const mapa =
    new Map();

  (
    lista ||
    []
  ).forEach(
    item => {
      const nome =
        String(
          item.fornecedor ||
          item.fornecedor_nome ||
          item.fornecedor_codigo ||
          "Não informado"
        ).trim() ||
        "Não informado";

      if(!mapa.has(nome)){
        mapa.set(
          nome,
          {
            key:nome,
            nome,
            quantidade:0,
            valor:0
          }
        );
      }

      const atual =
        mapa.get(nome);

      atual.quantidade +=
        qtdItem(item);

      atual.valor +=
        valorItem(item);
    }
  );

  const dados =
    [...mapa.values()]
      .sort(
        (a,b) =>
          metricaGrafico(
            b.quantidade,
            b.valor
          )
          -
          metricaGrafico(
            a.quantidade,
            a.valor
          )
          ||
          a.nome.localeCompare(
            b.nome,
            "pt-BR",
            {numeric:true}
          )
      );

  const area =
    $("#chartFornecedoresArea");

  if(area){
    area.style.height =
      `${Math.min(
        12000,
        Math.max(
          320,
          dados.length * 31 + 85
        )
      )}px`;
  }

  const chart =
    new Chart(
      canvas,
      {
        type:"bar",

        data:{
          labels:
            dados.map(
              x => x.nome
            ),

          datasets:[
            {
              label:"Quantidade",
              data:
                dados.map(
                  x =>
                    metricaGrafico(
                      x.quantidade,
                      x.valor
                    )
                ),

              resumos:
                dados.map(
                  x =>
                    resumoRotulo(
                      x.quantidade,
                      x.valor
                    )
                ),

              backgroundColor:"#287fd1",

              borderColor:
                dados.map(
                  x =>
                    corContornoSelecionado(
                      "fornecedor",
                      x.key
                    )
                ),

              borderWidth:
                dados.map(
                  x =>
                    larguraContornoSelecionado(
                      "fornecedor",
                      x.key
                    )
                ),

              borderRadius:5,
              borderSkipped:false
            }
          ]
        },

        options:{
          ...opcoesBaseGrafico(),

          indexAxis:"y",

          plugins:{
            ...opcoesBaseGrafico().plugins,

            legend:{
              display:false
            },

            rotulosQtdValor:{
              display:true
            }
          },

          scales:{
            x:{
              beginAtZero:true,

              ticks:{
                color:"#dbe8f6",
                precision:0,
                font:{
                  size:10,
                  weight:"normal"
                }
              },

              grid:{
                color:
                  "rgba(255,255,255,.06)"
              }
            },

            y:{
              ticks:{
                color:"#dbe8f6",
                autoSkip:false,
                font:{
                  size:10,
                  weight:"normal"
                }
              },

              grid:{
                display:false
              }
            }
          },

          onClick:
            (
              _evt,
              els
            ) => {
              if(!els.length){
                return;
              }

              const item =
                dados[
                  els[0].index
                ];

              if(item){
                agendarCliqueVisual(
                  () =>
                    toggleFiltro(
                      "fornecedor",
                      item.key
                    )
                );
              }
            }
        }
      }
    );

  charts.push(
    chart
  );

  bindCanvasDuploClique(
    canvas
  );
}

function dataLinhaTempoSituacao(
  item
){
  const tipo = "entrada_defeito";

  const datas = {
    entrada_defeito:item?.data,
    ultima_compra:item?.ultima_compra,
    envio:item?.envio,
    baixa:
      item?.baixa_seta ||
      item?.retorno ||
      item?.entrega,
    retorno:item?.retorno,
    entrega:item?.entrega
  };

  return String(
    datas[tipo] ||
    item?.data ||
    ""
  ).slice(0,10);
}

function chaveLinhaTempo(
  dataISO,
  modo
){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)){
    return "";
  }

  const [ano,mes,dia] =
    dataISO
      .split("-")
      .map(Number);

  if(modo === "ANO"){
    return String(ano);
  }

  if(modo === "MES"){
    return `${String(ano).padStart(4,"0")}-${String(mes).padStart(2,"0")}`;
  }

  if(modo === "QUINZENA"){
    const quinzena =
      dia <= 15
        ? "1"
        : "2";

    return `${String(ano).padStart(4,"0")}-${String(mes).padStart(2,"0")}-Q${quinzena}`;
  }

  if(modo === "SEMANA"){
    const d =
      new Date(
        Date.UTC(
          ano,
          mes - 1,
          dia
        )
      );

    const diaSemana =
      d.getUTCDay() || 7;

    d.setUTCDate(
      d.getUTCDate() -
      diaSemana +
      1
    );

    return d
      .toISOString()
      .slice(0,10);
  }

  return dataISO;
}

function rotuloLinhaTempo(
  chave,
  modo
){
  if(modo === "ANO"){
    return chave;
  }

  if(modo === "MES"){
    const [ano,mes] =
      chave.split("-");

    return `${mes}/${ano}`;
  }

  if(modo === "QUINZENA"){
    const partes =
      chave.split("-");

    const ano =
      partes[0] ||
      "";

    const mes =
      partes[1] ||
      "";

    const q =
      String(
        partes[2] ||
        ""
      )
        .replace(
          "Q",
          ""
        );

    return `${q}ª quinz. ${mes}/${ano}`;
  }

  const [ano,mes,dia] =
    chave.split("-");

  return dia && mes && ano
    ? `${dia}/${mes}/${ano}`
    : chave;
}

function renderGraficoLinhaTempoSituacoes(
  lista
){
  const canvas =
    $("#chartLinhaTempoSituacoes");

  if(!canvas){
    return;
  }

  const itens =
    (lista || [])
      .map(
        item => ({
          item,
          data:
            dataLinhaTempoSituacao(
              item
            )
        })
      )
      .filter(
        x =>
          /^\d{4}-\d{2}-\d{2}$/.test(
            x.data
          )
      );

  if(!itens.length){
    return;
  }

  const modo =
    String(
      $("#visaoLinhaTempo")?.value ||
      "DIA"
    )
      .trim()
      .toUpperCase();

  const statusOrdem = [
    "NA_LOJA",
    "PRE_ENVIO",
    "ENVIADO",
    "BAIXADO",
    "CONSERTO_ENTREGUE"
  ];

  const cores = {
    NA_LOJA:"#a52d32",
    PRE_ENVIO:"#c28217",
    ENVIADO:"#a96118",
    BAIXADO:"#20c978",
    CONSERTO_ENTREGUE:"#2784ff"
  };

  const periodos =
    [
      ...new Set(
        itens
          .map(
            x =>
              chaveLinhaTempo(
                x.data,
                modo
              )
          )
          .filter(Boolean)
      )
    ].sort();

  const mapa =
    new Map(
      statusOrdem.map(
        status => [
          status,
          new Map(
            periodos.map(
              periodo => [
                periodo,
                {
                  quantidade:0,
                  valor:0
                }
              ]
            )
          )
        ]
      )
    );

  itens.forEach(
    ({item,data}) => {
      const status =
        statusSetaItem(item);

      if(!mapa.has(status)){
        return;
      }

      const periodo =
        chaveLinhaTempo(
          data,
          modo
        );

      const atual =
        mapa
          .get(status)
          .get(periodo);

      if(!atual){
        return;
      }

      atual.quantidade +=
        qtdItem(item);

      atual.valor +=
        valorItem(item);
    }
  );

  const datasets =
    statusOrdem.map(
      status => {
        const dados =
          periodos.map(
            periodo =>
              mapa
                .get(status)
                .get(periodo)
          );

        return {
          label:
            nomeStatusSeta(status),

          data:
            dados.map(
              x =>
                metricaGrafico(
                  x.quantidade,
                  x.valor
                )
            ),

          resumos:
            dados.map(
              x =>
                resumoRotulo(
                  x.quantidade,
                  x.valor
                )
            ),

          borderColor:
            cores[status],

          backgroundColor:
            cores[status],

          borderWidth:
            filtroTem(
              "statusSeta",
              status
            )
              ? 4
              : 2,

          pointBorderColor:
            filtroTem(
              "statusSeta",
              status
            )
              ? "#ffd54a"
              : cores[status],

          pointBorderWidth:
            filtroTem(
              "statusSeta",
              status
            )
              ? 3
              : 1,

          pointRadius:3,
          pointHoverRadius:5,
          tension:.22,
          fill:false,
          filtroKey:status
        };
      }
    );

  const chart =
    new Chart(
      canvas,
      {
        type:"line",

        data:{
          labels:
            periodos.map(
              periodo =>
                rotuloLinhaTempo(
                  periodo,
                  modo
                )
            ),

          datasets
        },

        options:{
          ...opcoesBaseGrafico(),

          interaction:{
            mode:"index",
            intersect:false
          },

          onClick:(_evt,els) => {
            if(!els.length){
              return;
            }

            const dataset =
              datasets[
                els[0].datasetIndex
              ];

            if(dataset?.filtroKey){
              agendarCliqueVisual(
                () =>
                  toggleFiltro(
                    "statusSeta",
                    dataset.filtroKey
                  )
              );
            }
          },

          plugins:{
            ...opcoesBaseGrafico().plugins,

            legend:{
              display:true,

              onClick:(_evt,legendItem) => {
                const dataset =
                  datasets[
                    legendItem.datasetIndex
                  ];

                if(dataset?.filtroKey){
                  agendarCliqueVisual(
                    () =>
                      toggleFiltro(
                        "statusSeta",
                        dataset.filtroKey
                      )
                  );
                }
              },

              labels:{
                color:"#dbe8f6",
                boxWidth:10,

                font:{
                  size:10,
                  weight:"normal"
                }
              }
            },

            rotulosQtdValor:{
              display:
                periodos.length <= 40
            }
          },

          scales:{
            x:{
              ticks:{
                color:"#dbe8f6",
                maxRotation:45,
                minRotation:0,

                font:{
                  size:9,
                  weight:"normal"
                }
              },

              grid:{
                color:
                  "rgba(255,255,255,.05)"
              }
            },

            y:{
              beginAtZero:true,

              ticks:{
                color:"#dbe8f6",
                precision:0,

                font:{
                  size:9,
                  weight:"normal"
                }
              },

              grid:{
                color:
                  "rgba(255,255,255,.06)"
              }
            }
          }
        }
      }
    );

  charts.push(chart);

  bindCanvasDuploClique(
    canvas
  );
}


function valorOrdenacaoTabela(item,campo){
  const txt = v =>
    String(v ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .toUpperCase();

  const num = v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
  };

  const dt = v => {
    if(!v) return 0;
    const t = new Date(String(v)).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  switch(campo){
    case "ocorrencia": return txt(item.conserto || item.movimento || item.id);
    case "empresa": return txt(item.empresa);
    case "funcionario_entrada":
      return txt(
        item.funcionario_entrada ||
        item.funcionario_entrada_codigo ||
        ""
      );
    case "produto": return txt(item.produto);
    case "descricao": return txt(item.descricao);
    case "marca": return txt(item.marca);
    case "fornecedor": return txt(item.fornecedor);
    case "defeito": return txt(item.tipo_defeito);
    case "situacao": return txt(nomeStatusSeta(item));
    case "operacao_seta": return txt(nomeOperacaoSeta(item));
    case "credito_seta": return txt(nomeCreditoSeta(item));
    case "custo_unitario": return num(item.custo_unitario);
    case "valor_custo_defeito": return num(valorItem(item));
    case "data_entrada": return dt(item.data);
    case "pedido": return dt(item.pedido);
    case "previsao": return dt(item.previsao);
    case "envio": return dt(item.envio);
    case "baixa_seta": return dt(item.baixa_seta);
    case "retorno": return dt(item.retorno);
    case "entrega": return dt(item.entrega);
    case "ultima_compra": return dt(item.ultima_compra);
    case "loja_dona":
      return Array.isArray(item.lojas_donas) && item.lojas_donas.length
        ? dt(item.lojas_donas[0]?.ultima_compra)
        : 0;
    case "prazo_meses": return num(item.prazo_meses);
    case "data_limite": return dt(item.data_limite);
    case "tempo_restante":
    case "dias_restantes": return num(item.dias_restantes);
    case "status_prazo": return txt(nomePrazo(item.status_prazo));
    case "falta_indenizar":
    case "valor_aprovado":
    case "valor_recebido":
    case "saldo_receber":
    case "valor_recusado":
    case "qtd_fotos":
      return num(item[campo]);
    default: return txt(item[campo]);
  }
}

function compararTabela(a,b){
  const va = valorOrdenacaoTabela(a,ordenacaoTabela.campo);
  const vb = valorOrdenacaoTabela(b,ordenacaoTabela.campo);

  let cmp = 0;

  if(typeof va === "number" && typeof vb === "number"){
    cmp = va === vb ? 0 : (va < vb ? -1 : 1);
  }else{
    cmp = String(va).localeCompare(
      String(vb),
      "pt-BR",
      {numeric:true,sensitivity:"base"}
    );
  }

  if(!cmp){
    cmp = String(a.conserto || a.movimento || "")
      .localeCompare(
        String(b.conserto || b.movimento || ""),
        "pt-BR",
        {numeric:true}
      );
  }

  return ordenacaoTabela.direcao === "desc" ? -cmp : cmp;
}

function atualizarIndicadoresOrdenacao(){
  document
    .querySelectorAll("thead th.sortable")
    .forEach(th => {
      const ind = th.querySelector(".sort-ind");
      if(!ind) return;

      if(th.dataset.sort === ordenacaoTabela.campo){
        ind.textContent = ordenacaoTabela.direcao === "asc" ? "↑" : "↓";
        th.classList.add("sort-active");
      }else{
        ind.textContent = "↕";
        th.classList.remove("sort-active");
      }
    });
}

function idOcorrencia(item){
  return String(item?.id || item?.conserto || item?.movimento || "");
}

function lojaDestinoSelecionada(item){
  const id = idOcorrencia(item);
  const donos = Array.isArray(item?.lojas_donas) ? item.lojas_donas : [];

  if(!donos.length){
    return "";
  }

  const atual = String(destinosTransferencia.get(id) || "").padStart(2,"0");

  if(
    atual &&
    donos.some(d => String(d.empresa || "").padStart(2,"0") === atual)
  ){
    return atual;
  }

  const padrao = String(donos[0]?.empresa || "").padStart(2,"0");

  if(id && padrao){
    destinosTransferencia.set(id,padrao);
  }

  return padrao;
}

function renderLojasDonas(item){
  if(item.ultima_compra){
    return "-";
  }

  const donos = Array.isArray(item.lojas_donas) ? item.lojas_donas : [];

  if(!donos.length){
    return `<span class="sem-dono">Não identificada</span>`;
  }

  const id = idOcorrencia(item);
  const escolhida = lojaDestinoSelecionada(item);

  return `
    <div class="donos-list" data-ocorrencia="${esc(id)}">
      ${
        donos.map((dono,index) => {
          const empresa = String(dono.empresa || "").padStart(2,"0");
          const maisAtual = index === 0;
          const selecionado = empresa === escolhida;

          return `
            <button
              type="button"
              class="dono-chip ${maisAtual ? "mais-atual" : ""} ${selecionado ? "selecionado" : ""}"
              data-destino="${esc(empresa)}"
              data-id="${esc(id)}"
              title="${maisAtual ? "Compra mais atual. Clique para usar esta loja no PDF." : "Clique para usar esta loja como destino no PDF."}"
            >
              <b>Loja ${esc(empresa)}</b>
              <span>${esc(fmtData(dono.ultima_compra))}</span>
              ${maisAtual ? `<small>mais atual</small>` : ""}
            </button>
          `;
        }).join("")
      }
    </div>
  `;
}

function selecionarDestinoTransferencia(id,empresa){
  destinosTransferencia.set(
    String(id),
    String(empresa).padStart(2,"0")
  );

  document
    .querySelectorAll(".dono-chip")
    .forEach(el => {
      if(String(el.dataset.id || "") !== String(id)){
        return;
      }

      el.classList.toggle(
        "selecionado",
        String(el.dataset.destino || "").padStart(2,"0") ===
        String(empresa).padStart(2,"0")
      );
    });
}

function produtoBaseEstoqueTabela(item){
  return String(
    item?.produto_base ||
    item?.produto ||
    ""
  )
    .replace(/\D/g,"")
    .padStart(6,"0")
    .slice(0,6);
}

async function carregarEstoquesTabela(renderApos = true){
  const chk = $("#chkPdfEstoques");

  if(!chk?.checked){
    empresasEstoqueTabela = [];
    estoqueTabelaPorProduto = {};
    if(renderApos) renderTabela();
    return;
  }

  const produtos = [
    ...new Set(
      (ocorrenciasBase || [])
        .map(produtoBaseEstoqueTabela)
        .filter(Boolean)
    )
  ];

  if(!produtos.length){
    empresasEstoqueTabela = [];
    estoqueTabelaPorProduto = {};
    if(renderApos) renderTabela();
    return;
  }

  if(carregandoEstoquesTabela) return;
  carregandoEstoquesTabela = true;
  chk.disabled = true;

  try{
    const resposta = await api(
      `${API}/estoques-lojas`,
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({produtos})
      }
    );

    empresasEstoqueTabela = Array.isArray(resposta?.empresas)
      ? resposta.empresas
          .map(x => String(x || "").trim().padStart(2,"0"))
          .filter(x => x && x !== "00")
      : [];

    estoqueTabelaPorProduto =
      resposta?.estoques && typeof resposta.estoques === "object"
        ? resposta.estoques
        : {};

  }catch(e){
    empresasEstoqueTabela = [];
    estoqueTabelaPorProduto = {};
    alert("Não foi possível carregar os estoques das lojas: " + e.message);
  }finally{
    carregandoEstoquesTabela = false;
    chk.disabled = false;
    if(renderApos) renderTabela();
  }
}

function empresasEstoqueAtivasNaTabela(listaFiltrada = ocorrencias){
  if(!$("#chkPdfEstoques")?.checked) return [];

  /*
   * Mostra somente lojas que possuem estoque > 0 em pelo menos um
   * dos produtos que REALMENTE permaneceram na tabela após TODOS os filtros.
   * Loja zerada não ganha coluna.
   */
  const produtosVisiveis = new Set(
    (listaFiltrada || [])
      .map(produtoBaseEstoqueTabela)
      .filter(Boolean)
  );

  const lojas = new Set();

  produtosVisiveis.forEach(produto => {
    const porLoja = estoqueTabelaPorProduto?.[produto] || {};

    Object.entries(porLoja).forEach(([empresa, estoque]) => {
      const loja = String(empresa || "").trim().padStart(2,"0");
      const qtd = Number(estoque || 0);

      if(loja && loja !== "00" && Number.isFinite(qtd) && qtd > 0){
        lojas.add(loja);
      }
    });
  });

  return [...lojas].sort(
    (a,b) => a.localeCompare(b,"pt-BR",{numeric:true})
  );
}

function atualizarCabecalhoEstoquesTabela(empresasVisiveis = []){
  const tabela = $("#tbodyOcorrencias")?.closest("table");
  const linha = tabela?.querySelector("thead tr");
  if(!linha) return;

  linha.querySelectorAll(".col-estoque-loja").forEach(el => el.remove());

  if(!$("#chkPdfEstoques")?.checked) return;

  empresasVisiveis.forEach(empresa => {
    const th = document.createElement("th");
    th.className = "col-estoque-loja";
    th.textContent = `Estoque ${empresa}`;
    linha.appendChild(th);
  });

  const thTotal = document.createElement("th");
  thTotal.className = "col-estoque-loja col-total-item";
  thTotal.textContent = "TOTAL ITEM";
  linha.appendChild(thTotal);
}

function renderTabela(){

  const buscaEl = $("#buscaGlobal");
  const busca = String(buscaEl?.value || "")
    .trim()
    .toLowerCase();

  const filtroFuncionario = String($("#filtroTabelaFuncionario")?.value || "")
    .trim().toLowerCase();

  const filtroProduto = String($("#filtroTabelaProduto")?.value || "")
    .trim().toLowerCase();

  const filtroDescricao = String($("#filtroTabelaDescricao")?.value || "")
    .trim().toLowerCase();

  const filtroMarca = String($("#filtroTabelaMarca")?.value || "")
    .trim().toLowerCase();

  const filtroNF = String($("#filtroTabelaNF")?.value || "")
    .trim().toLowerCase();

  const filtroUltimaCompra = String($("#filtroTabelaUltimaCompra")?.value || "")
    .trim();

  const filtroDiasBruto = String($("#filtroTabelaDias")?.value || "").trim();
  const filtroDias = filtroDiasBruto === "" ? null : Number(filtroDiasBruto);

  const lista =
    ocorrencias
      .filter(item => {
        const funcionarioTexto = String(
          `${item.funcionario_entrada || ""} ${item.funcionario_entrada_codigo || ""}`
        ).toLowerCase();

        const produtoTexto = String(
          `${item.produto || ""} ${item.produto_base || ""}`
        ).toLowerCase();

        const descricaoTexto = String(item.descricao || "").toLowerCase();
        const marcaTexto = String(item.marca || "").toLowerCase();
        const nfTexto = String(item.nf || "").trim().toLowerCase();
        const ultimaCompra = String(item.ultima_compra || "").slice(0,10);

        const diasItem = Number(
          item.dias_restantes ?? item.dias_processo ?? NaN
        );

        return (
          (!busca || String(item.__busca || "").includes(busca))
          &&
          (!filtroFuncionario || funcionarioTexto.includes(filtroFuncionario))
          &&
          (!filtroProduto || produtoTexto.includes(filtroProduto))
          &&
          (!filtroDescricao || descricaoTexto.includes(filtroDescricao))
          &&
          (!filtroMarca || marcaTexto.includes(filtroMarca))
          &&
          (!filtroNF || nfTexto.includes(filtroNF))
          &&
          (!filtroUltimaCompra || ultimaCompra === filtroUltimaCompra)
          &&
          (
            filtroDias === null
            ||
            (Number.isFinite(diasItem) && diasItem === filtroDias)
          )
        );
      })
      .sort(
        compararTabela
      );

  /*
   * IMPORTANTE: as lojas de estoque são calculadas somente DEPOIS
   * de todos os filtros da tabela e dos gráficos. Assim não aparece
   * nenhuma loja zerada ou ligada apenas a produto que saiu do filtro.
   */
  const empresasEstoqueVisiveis =
    empresasEstoqueAtivasNaTabela(lista);

  atualizarCabecalhoEstoquesTabela(
    empresasEstoqueVisiveis
  );

  atualizarIndicadoresOrdenacao();

  const totalFiltrado =
    lista.length;

  const listaRender =
    lista.slice(
      0,
      LIMITE_LINHAS_TABELA_DOM
    );

  $("#totalRegistros")
    .textContent =
    totalFiltrado >
    LIMITE_LINHAS_TABELA_DOM
      ? `${totalFiltrado} registros • exibindo ${LIMITE_LINHAS_TABELA_DOM}`
      : `${totalFiltrado} registros`;

  $("#tbodyOcorrencias")
    .innerHTML =
    listaRender.length
      ? listaRender.map(
          o =>
            `
              <tr
                class="${
                  filtroTem(
                    "ocorrencia",
                    String(
                      o.id ||
                      o.conserto ||
                      o.movimento ||
                      ""
                    )
                  )
                    ? "linha-selecionada-visual"
                    : ""
                }"
                data-id="${esc(
                  o.id ||
                  o.conserto ||
                  o.movimento
                )}"
              >
                <td>
                  <input
                    type="checkbox"
                    class="sel-rel"
                    value="${esc(
                      o.id ||
                      o.conserto ||
                      o.movimento
                    )}"
                  >
                </td>

                <td class="td-foto-rapida">
                  ${
                    o.foto_defeito_url
                      ? `
                          <a
                            class="foto-defeito-link"
                            href="${esc(o.foto_defeito_url)}"
                            target="_blank"
                            rel="noopener"
                            title="${
                              Number(o.qtd_fotos || 0) > 1
                                ? `${Number(o.qtd_fotos || 0)} fotos do defeito`
                                : "Foto do defeito"
                            }"
                          >
                            <img
                              class="foto-defeito-thumb"
                              src="${esc(o.foto_defeito_url)}"
                              alt="Foto do defeito"
                              loading="lazy"
                            >
                            ${
                              Number(o.qtd_fotos || 0) > 1
                                ? `
                                    <span class="foto-defeito-qtd">
                                      +${Number(o.qtd_fotos || 0) - 1}
                                    </span>
                                  `
                                : ""
                            }
                          </a>
                        `
                      : `
                          <span
                            class="foto-defeito-vazia"
                            title="Nenhuma foto do defeito cadastrada no módulo Fotos de Defeitos"
                          >
                            Sem foto
                          </span>
                        `
                  }
                </td>

                <td class="link">
                  ${esc(
                    o.conserto ||
                    o.movimento
                  )}
                </td>

                <td>
                  ${esc(
                    String(
                      o.empresa ||
                      ""
                    )
                      .trim()
                      .padStart(
                        2,
                        "0"
                      )
                  )}
                </td>

                <td class="funcionario-usuario-cell">
                  <strong>
                    ${esc(
                      o.funcionario_entrada ||
                      "Não informado"
                    )}
                  </strong>

                  ${
                    o.funcionario_entrada_codigo
                      ? `
                          <small>
                            ${esc(
                              o.funcionario_entrada_codigo
                            )}
                          </small>
                        `
                      : ""
                  }
                </td>

                <td>
                  ${esc(
                    o.produto
                  )}
                </td>

                <td>
                  ${esc(
                    o.descricao
                  )}
                </td>

                <td>
                  ${esc(
                    o.marca
                  )}
                </td>

                <td>
                  ${esc(
                    String(o.nf || "").trim() || "Sem NF"
                  )}
                </td>

                <td>
                  ${esc(
                    String(o.auxiliar || "").trim() || "-"
                  )}
                </td>

                <td>
                  ${esc(
                    o.fornecedor
                  )}
                </td>

                <td>
                  ${esc(
                    o.tipo_defeito
                  )}
                </td>

                <td>
                  <span
                    class="badge status-seta status-${esc(
                      statusSetaItem(
                        o
                      ).toLowerCase()
                    )}"
                  >
                    ${esc(
                      nomeStatusSeta(
                        o
                      )
                    )}
                  </span>
                </td>

                <td>
                  ${esc(
                    nomeOperacaoSeta(
                      o
                    )
                  )}
                </td>

                <td>
                  <span
                    class="credito-badge credito-${esc(
                      creditoSetaItem(
                        o
                      ).toLowerCase()
                    )}"
                  >
                    ${esc(
                      nomeCreditoSeta(
                        o
                      )
                    )}
                  </span>
                </td>

                <td class="custo-produto-cell">
                  ${fmtMoney(
                    o.custo_unitario ||
                    0
                  )}
                </td>

                <td class="custo-produto-cell custo-total-cell">
                  ${fmtMoney(
                    valorItem(
                      o
                    )
                  )}
                </td>

                <td class="data-processo-cell">
                  ${fmtData(
                    o.data
                  )}
                </td>

                <td class="data-processo-cell">
                  ${fmtData(
                    o.pedido
                  )}
                </td>

                <td class="data-processo-cell">
                  ${fmtData(
                    o.previsao
                  )}
                </td>

                <td class="data-processo-cell">
                  ${fmtData(
                    o.envio
                  )}
                </td>

                <td class="data-processo-cell">
                  ${fmtData(
                    o.retorno
                  )}
                </td>

                <td class="data-processo-cell">
                  ${fmtData(
                    o.entrega
                  )}
                </td>

                <td>
                  ${
                    o.ultima_compra
                      ? fmtData(o.ultima_compra)
                      : `<span class="alerta-sem-compra" title="Esta loja não possui compra direta registrada para este produto.">⚠ Sem compra</span>`
                  }
                </td>

                <td class="donos-cell">
                  ${renderLojasDonas(o)}
                </td>

                <td>
                  ${
                    o.prazo_meses
                      ? `${esc(
                          o.prazo_meses
                        )} meses`
                      : "-"
                  }
                </td>

                <td>
                  ${fmtData(
                    o.data_limite
                  )}
                </td>

                <td>
                  <span
                    class="tempo-restante ${
                      o.status_prazo === "FORA_PRAZO"
                        ? "vencido"
                        : o.status_prazo === "CRITICO"
                          ? "critico"
                          : o.status_prazo === "PROXIMO"
                            ? "proximo"
                            : o.status_prazo === "ATENCAO"
                              ? "alerta"
                              : "ok"
                    }"
                  >
                    ${esc(
                      o.tempo_restante ||
                      "-"
                    )}
                  </span>
                </td>

                <td>
                  ${esc(
                    o.dias_restantes ??
                    "-"
                  )}
                </td>

                <td>
                  <span
                    class="semaforo ${esc(
                      o.status_prazo ||
                      "SEM_PRAZO"
                    )}"
                  >
                    ${esc(
                      nomePrazo(
                        o.status_prazo ||
                        "SEM_PRAZO"
                      )
                    )}
                  </span>
                </td>

                <td>
                  ${fmtMoney(
                    o.falta_indenizar
                  )}
                </td>

                <td>
                  ${fmtMoney(
                    o.valor_aprovado
                  )}
                </td>

                <td>
                  ${fmtMoney(
                    o.valor_recebido
                  )}
                </td>

                <td>
                  ${fmtMoney(
                    o.saldo_receber
                  )}
                </td>

                <td>
                  ${fmtMoney(
                    o.valor_recusado
                  )}
                </td>

                <td class="td-foto-produto">
                  <div class="foto-produto-wrap">
                    <img
                      class="foto-produto-real"
                      data-produto-foto
                      src="/foto?codigo=${encodeURIComponent(
                        String(
                          o.produto_base ||
                          o.produto ||
                          ""
                        )
                          .trim()
                          .slice(0,6)
                      )}"
                      alt="Foto do produto"
                      loading="lazy"
                    >
                    <span class="foto-produto-vazia">
                      Sem foto
                    </span>
                  </div>
                </td>

                ${
                  $("#chkPdfEstoques")?.checked
                    ? (() => {
                        const produtoBase = produtoBaseEstoqueTabela(o);
                        const porLoja = estoqueTabelaPorProduto?.[produtoBase] || {};

                        const celulas = empresasEstoqueVisiveis.map(empresa => {
                          const estoque = Number(porLoja?.[empresa] || 0);
                          return `<td class="estoque-loja-cell">${esc(fmtQtd(estoque))}</td>`;
                        }).join("");

                        const totalItem = empresasEstoqueVisiveis.reduce(
                          (soma,empresa) =>
                            soma + Math.max(0,Number(porLoja?.[empresa] || 0)),
                          0
                        );

                        return celulas +
                          `<td class="estoque-loja-cell total-item-cell"><strong>${esc(fmtQtd(totalItem))}</strong></td>`;
                      })()
                    : ""
                }
              </tr>
            `
        ).join("")
      : `
          <tr>
            <td
              colspan="${36 + (($("#chkPdfEstoques")?.checked) ? empresasEstoqueVisiveis.length + 1 : 0)}"
              class="empty"
            >
              Nenhuma ocorrência encontrada.
            </td>
          </tr>
        `;

  /*
   * Rodapé de estoque:
   * soma cada produto-base UMA ÚNICA VEZ para não duplicar estoque quando
   * o mesmo modelo aparece em mais de uma ocorrência/numeração/NF.
   */
  if($("#chkPdfEstoques")?.checked && lista.length){
    const produtosUnicos = [
      ...new Set(
        lista
          .map(produtoBaseEstoqueTabela)
          .filter(Boolean)
      )
    ];

    const totaisPorLoja = Object.fromEntries(
      empresasEstoqueVisiveis.map(empresa => [empresa,0])
    );

    produtosUnicos.forEach(produtoBase => {
      const porLoja = estoqueTabelaPorProduto?.[produtoBase] || {};
      empresasEstoqueVisiveis.forEach(empresa => {
        const qtd = Number(porLoja?.[empresa] || 0);
        if(Number.isFinite(qtd) && qtd > 0){
          totaisPorLoja[empresa] += qtd;
        }
      });
    });

    const totalGeral = empresasEstoqueVisiveis.reduce(
      (soma,empresa) => soma + Number(totaisPorLoja[empresa] || 0),
      0
    );

    const qtdColunasFixas = 36;

    $("#tbodyOcorrencias").insertAdjacentHTML(
      "beforeend",
      `
        <tr class="linha-total-estoques">
          <td colspan="${qtdColunasFixas}">
            <strong>TOTAL ESTOQUE POR LOJA</strong>
            <small> • ${produtosUnicos.length} produto(s) único(s)</small>
          </td>
          ${empresasEstoqueVisiveis.map(
            empresa => `
              <td class="estoque-loja-cell total-loja-cell">
                <strong>${esc(fmtQtd(totaisPorLoja[empresa] || 0))}</strong>
              </td>
            `
          ).join("")}
          <td class="estoque-loja-cell total-geral-cell">
            <strong>${esc(fmtQtd(totalGeral))}</strong>
          </td>
        </tr>
      `
    );
  }

  $("#tbodyOcorrencias")
    .querySelectorAll(
      "[data-produto-foto]"
    )
    .forEach(
      img => {
        const fallback =
          img.nextElementSibling;

        img.addEventListener(
          "load",
          () => {
            img.style.display =
              "block";

            if(fallback){
              fallback.style.display =
                "none";
            }
          },
          {
            once:true
          }
        );

        img.addEventListener(
          "error",
          () => {
            img.style.display =
              "none";

            if(fallback){
              fallback.style.display =
                "inline-flex";
            }
          },
          {
            once:true
          }
        );
      }
    );

  const chkTodos = $("#chkSelecionarTodos");
  if(chkTodos){
    chkTodos.checked = false;
    chkTodos.indeterminate = false;
  }

  $("#tbodyOcorrencias")
    .querySelectorAll(".sel-rel")
    .forEach(chk => {
      chk.addEventListener("change", () => {
        const todos = [...document.querySelectorAll("#tbodyOcorrencias .sel-rel")];
        const marcados = todos.filter(x => x.checked);
        if(chkTodos){
          chkTodos.checked = todos.length > 0 && marcados.length === todos.length;
          chkTodos.indeterminate = marcados.length > 0 && marcados.length < todos.length;
        }
      });
    });

  $("#tbodyOcorrencias")
    .querySelectorAll(".dono-chip")
    .forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        selecionarDestinoTransferencia(
          btn.dataset.id,
          btn.dataset.destino
        );
      });
    });



  $("#tbodyOcorrencias")
    .querySelectorAll(
      "tr[data-id]"
    )
    .forEach(
      tr => {
        tr.onclick =
          e => {
            if(
              e.target.closest(
                "input,button,a,label"
              )
            ){
              return;
            }

            const id =
              String(
                tr.dataset.id ||
                ""
              );

            if(
              selecoesTabela.has(
                id
              )
            ){
              selecoesTabela.delete(
                id
              );
            }else{
              selecoesTabela.add(
                id
              );
            }

            tr.classList.toggle(
              "linha-selecionada-visual",
              selecoesTabela.has(
                id
              )
            );
          };

        tr.ondblclick =
          e => {
            if(
              e.target.closest(
                "input,button,a,label"
              )
            ){
              return;
            }

            e.preventDefault();
            e.stopPropagation();

            clearTimeout(
              timerCliqueVisual
            );

            timerCliqueVisual =
              null;

            abrirDetalhe(
              String(
                tr.dataset.id ||
                ""
              )
            );
          };
      }
    );
}


function abrirModalDetalheOcorrencia(){
  const modal = $("#modalDetalheOcorrencia");
  if(!modal) return;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-detalhe-aberto");
}

function fecharModalDetalheOcorrencia(){
  const modal = $("#modalDetalheOcorrencia");
  if(modal) modal.classList.add("hidden");
  document.body.classList.remove("modal-detalhe-aberto");
}

function recebimentosHtml(
  recebimentos
){

  if(
    !Array.isArray(
      recebimentos
    )
    ||
    !recebimentos.length
  ){
    return `
      <div class="photo-required">
        Nenhum recebimento registrado.
      </div>
    `;
  }

  return recebimentos.map(
    r =>
      `
        <div class="receipt">
          <b>
            ${fmtData(
              r.data_recebimento
            )}
            •
            ${fmtMoney(
              r.valor_recebido
            )}
          </b>

          <div>
            ${esc(
              r.forma_recebimento ||
              "-"
            )}
            •
            ${esc(
              r.documento ||
              "-"
            )}
          </div>

          ${
            r.observacao
              ? `
                  <div>
                    ${esc(
                      r.observacao
                    )}
                  </div>
                `
              : ""
          }

          <button
            class="btn secondary btn-mini"
            data-excluir-recebimento="${esc(
              r.id
            )}"
          >
            Excluir
          </button>
        </div>
      `
  ).join("");
}

async function abrirDetalhe(
  id
){

  try{
    selecionada =
      await api(
        `${API}/ocorrencias/${encodeURIComponent(id)}`
      );

    const o =
      selecionada;

    const fotos =
      o.fotos ||
      [];

    const historico =
      o.historico ||
      [];

    const recebimentos =
      o.recebimentos ||
      [];

    $("#detalheConteudo")
      .innerHTML =
      `
        <div class="detail-status-row">

          <span
            class="badge status-seta status-${esc(
              statusSetaItem(
                o
              ).toLowerCase()
            )}"
          >
            ${esc(
              nomeStatusSeta(
                o
              )
            )}
          </span>

          <span class="badge operacao-seta">
            ${esc(
              nomeOperacaoSeta(
                o
              )
            )}
          </span>

          <span
            class="credito-badge credito-${esc(
              creditoSetaItem(
                o
              ).toLowerCase()
            )}"
          >
            ${esc(
              nomeCreditoSeta(
                o
              )
            )}
          </span>

          <span
            class="semaforo ${esc(
              o.status_prazo ||
              "SEM_PRAZO"
            )}"
          >
            ${esc(
              nomePrazo(
                o.status_prazo ||
                "SEM_PRAZO"
              )
            )}
          </span>

        </div>

        <h1>
          ${esc(
            o.conserto ||
            o.movimento
          )}
        </h1>

        <div class="detail-grid">

          <dl>

            <dt>Entrada do defeito</dt>
            <dd>
              ${fmtDataHora(
                o.data
              )}
            </dd>

            <dt>Pedido / Devolução</dt>
            <dd>
              ${fmtDataHora(
                o.pedido
              )}
            </dd>

            <dt>Previsão</dt>
            <dd>
              ${fmtDataHora(
                o.previsao
              )}
            </dd>

            <dt>Envio</dt>
            <dd>
              ${fmtDataHora(
                o.envio
              )}
            </dd>

            <dt>Retorno</dt>
            <dd>
              ${fmtDataHora(
                o.retorno
              )}
            </dd>

            <dt>Entrega</dt>
            <dd>
              ${fmtDataHora(
                o.entrega
              )}
            </dd>

            <dt>Loja</dt>
            <dd>
              ${esc(
                o.empresa
              )}
            </dd>

            <dt>Produto</dt>
            <dd>
              ${esc(
                o.produto
              )}
            </dd>

            <dt>Descrição</dt>
            <dd>
              ${esc(
                o.descricao
              )}
            </dd>

            <dt>Referência</dt>
            <dd>
              ${esc(
                o.referencia ||
                "-"
              )}
            </dd>

            <dt>Marca</dt>
            <dd>
              ${esc(
                o.marca
              )}
            </dd>

            <dt>Fornecedor</dt>
            <dd>
              ${esc(
                o.fornecedor
              )}
            </dd>

            <dt>Defeito</dt>
            <dd>
              ${esc(
                o.tipo_defeito
              )}
            </dd>

            <dt>Quantidade</dt>
            <dd>
              ${fmtQtd(
                o.quantidade
              )}
            </dd>

            <dt>Última compra</dt>
            <dd>
              ${fmtData(
                o.ultima_compra
              )}
            </dd>

            <dt>Prazo fornecedor</dt>
            <dd>
              ${
                o.prazo_meses
                  ? `${esc(
                      o.prazo_meses
                    )} meses`
                  : "Não cadastrado"
              }
            </dd>

            <dt>Data limite</dt>
            <dd>
              ${fmtData(
                o.data_limite
              )}
            </dd>

            <dt>Falta / vencido</dt>
            <dd>
              ${esc(
                o.tempo_restante ||
                "-"
              )}
            </dd>

            <dt>Dias restantes</dt>
            <dd>
              ${esc(
                o.dias_restantes ??
                "-"
              )}
            </dd>

            <dt>NF</dt>
            <dd>
              ${esc(
                o.nf ||
                "-"
              )}
            </dd>

            <dt>Valor Seta</dt>
            <dd>
              ${fmtMoney(
                o.valor_seta
              )}
            </dd>

            <dt>Observação</dt>
            <dd>
              ${esc(
                o.observacao ||
                "-"
              )}
            </dd>

          </dl>

          ${
            o.imagem_produto
              ? `
                  <img
                    class="product-photo"
                    src="${esc(
                      o.imagem_produto
                    )}"
                    alt="Produto"
                  >
                `
              : "<div></div>"
          }

        </div>

        <div class="finance-box">

          <div class="finance-title">

            <div>
              <b>
                Controle da Indenização
              </b>

              <small>
                Aprovado, recebido e saldo pendente.
              </small>
            </div>

            <span
              class="fin-status ${esc(
                o.status_financeiro ||
                "SEM_REGISTRO"
              )}"
            >
              ${esc(
                nomeFinanceiro(
                  o.status_financeiro ||
                  "SEM_REGISTRO"
                )
              )}
            </span>

          </div>

          <div class="finance-grid">

            <div class="finance-item">
              <small>Solicitado</small>
              <b>
                ${fmtMoney(
                  o.valor_solicitado
                )}
              </b>
            </div>

            <div class="finance-item">
              <small>Falta indenizar</small>
              <b>
                ${fmtMoney(
                  o.falta_indenizar
                )}
              </b>
            </div>

            <div class="finance-item">
              <small>Aprovado</small>
              <b>
                ${fmtMoney(
                  o.valor_aprovado
                )}
              </b>
            </div>

            <div class="finance-item">
              <small>Recebido</small>
              <b>
                ${fmtMoney(
                  o.valor_recebido
                )}
              </b>
            </div>

            <div class="finance-item">
              <small>Indenizado a receber</small>
              <b>
                ${fmtMoney(
                  o.saldo_receber
                )}
              </b>
            </div>

            <div class="finance-item">
              <small>Recusado</small>
              <b>
                ${fmtMoney(
                  o.valor_recusado
                )}
              </b>
            </div>

          </div>

          <div class="finance-actions">

            <button
              class="btn primary"
              id="btnEditarIndenizacao"
            >
              Atualizar Indenização
            </button>

            <button
              class="btn secondary"
              id="btnNovoRecebimento"
            >
              Registrar Recebimento
            </button>

          </div>

          <div class="receipts">

            <b>
              Recebimentos
            </b>

            ${recebimentosHtml(
              recebimentos
            )}

          </div>

        </div>

        <div class="photos-head">

          <div>
            <b>
              Fotos do defeito
            </b>

            <div class="photo-required">
              Pelo menos uma foto é obrigatória para documentar o defeito.
            </div>
          </div>

          <button
            class="btn primary"
            id="btnAdicionarFoto"
          >
            ＋ Adicionar Fotos
          </button>

        </div>

        <div class="photos">

          ${
            fotos.length
              ? fotos.map(
                  foto =>
                    `
                      <img
                        src="${esc(
                          foto.url ||
                          foto.arquivo_url
                        )}"
                        alt="Foto do defeito"
                      >
                    `
                ).join("")
              : `
                  <div class="photo-required">
                    Nenhuma foto cadastrada.
                  </div>
                `
          }

        </div>

        <h3>
          Linha do Tempo do Seta
        </h3>

        <div class="timeline">

          ${
            historico.length
              ? historico.map(
                  item =>
                    `
                      <div class="timeline-item">

                        <b>
                          ${fmtData(
                            item.datahora
                          )}
                          •
                          ${esc(
                            item.titulo ||
                            item.operacao
                          )}
                        </b>

                        ${esc(
                          item.ocorrencia ||
                          item.descricao ||
                          ""
                        )}

                      </div>
                    `
                ).join("")
              : `
                  <div class="timeline-item">
                    Sem histórico complementar.
                  </div>
                `
          }

        </div>
      `;

    $("#btnAdicionarFoto").onclick =
      () =>
        $("#inputFotos")
          .click();

    $("#btnEditarIndenizacao").onclick =
      abrirIndenizacao;

    $("#btnNovoRecebimento").onclick =
      abrirRecebimento;

    document
      .querySelectorAll(
        "[data-excluir-recebimento]"
      )
      .forEach(
        btn => {
          btn.onclick =
            async () => {
              if(
                !confirm(
                  "Excluir este recebimento?"
                )
              ){
                return;
              }

              try{
                await api(
                  `${API}/recebimentos/${encodeURIComponent(
                    btn.dataset.excluirRecebimento
                  )}`,
                  {
                    method:"DELETE"
                  }
                );

                await atualizarDepoisDeAlteracao(
                  id
                );


              }catch(e){
                alert(
                  e.message
                );
              }
            };
        }
      );

    abrirModalDetalheOcorrencia();

  }catch(e){
    alert(
      "Não foi possível abrir a ocorrência: " +
      e.message
    );
  }
}

async function enviarFotos(){

  if(
    !selecionada
    ||
    !this.files?.length
  ){
    return;
  }

  const id =
    selecionada.id ||
    selecionada.conserto ||
    selecionada.movimento;

  const fd =
    new FormData();

  [
    ...this.files
  ].forEach(
    arquivo =>
      fd.append(
        "fotos",
        arquivo
      )
  );

  try{
    await api(
      `${API}/ocorrencias/${encodeURIComponent(id)}/fotos`,
      {
        method:"POST",
        body:fd
      }
    );

    this.value =
      "";

    await atualizarDepoisDeAlteracao(
      id
    );


  }catch(e){
    alert(
      "Erro ao enviar fotos: " +
      e.message
    );
  }
}

function abrirModal(
  id
){
  $("#" + id)
    .classList
    .remove(
      "hidden"
    );
}

function fecharModal(
  id
){
  $("#" + id)
    .classList
    .add(
      "hidden"
    );
}

function abrirIndenizacao(){

  if(!selecionada){
    return;
  }

  $("#indenizacaoTitulo")
    .textContent =
    `Ocorrência ${
      selecionada.conserto ||
      selecionada.movimento
    }`;

  $("#indSolicitado").value =
    Number(
      selecionada.valor_solicitado ||
      0
    ).toFixed(
      2
    );

  $("#indAprovado").value =
    Number(
      selecionada.valor_aprovado ||
      0
    ).toFixed(
      2
    );

  $("#indRecusado").value =
    Number(
      selecionada.valor_recusado ||
      0
    ).toFixed(
      2
    );

  $("#indDataSolicitacao").value =
    selecionada.data_solicitacao
      ? String(
          selecionada.data_solicitacao
        ).slice(
          0,
          10
        )
      : "";

  $("#indDataAprovacao").value =
    selecionada.data_aprovacao
      ? String(
          selecionada.data_aprovacao
        ).slice(
          0,
          10
        )
      : "";

  $("#indObservacao").value =
    selecionada.observacao_indenizacao ||
    "";

  abrirModal(
    "modalIndenizacao"
  );
}

async function salvarIndenizacao(){

  if(!selecionada){
    return;
  }

  const id =
    selecionada.id ||
    selecionada.conserto ||
    selecionada.movimento;

  const btn =
    $("#btnSalvarIndenizacao");

  const texto =
    btn.textContent;

  try{
    btn.disabled =
      true;

    btn.textContent =
      "Executando...";

    await api(
      `${API}/ocorrencias/${encodeURIComponent(id)}/indenizacao`,
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            valor_solicitado:
              Number(
                $("#indSolicitado")
                  .value ||
                0
              ),

            valor_aprovado:
              Number(
                $("#indAprovado")
                  .value ||
                0
              ),

            valor_recusado:
              Number(
                $("#indRecusado")
                  .value ||
                0
              ),

            data_solicitacao:
              $("#indDataSolicitacao")
                .value ||
              null,

            data_aprovacao:
              $("#indDataAprovacao")
                .value ||
              null,

            observacao:
              $("#indObservacao")
                .value ||
              ""
          })
      }
    );

    fecharModal(
      "modalIndenizacao"
    );

    await atualizarDepoisDeAlteracao(
      id
    );

  }catch(e){
    alert(
      e.message
    );

  }finally{
    btn.disabled =
      false;

    btn.textContent =
      texto;
  }
}

function abrirRecebimento(){

  if(!selecionada){
    return;
  }

  if(
    Number(
      selecionada.valor_aprovado ||
      0
    ) <= 0
  ){
    return alert(
      "Registre primeiro o valor aprovado pela fábrica."
    );
  }

  const saldo =
    Number(
      selecionada.saldo_receber ||
      0
    );

  $("#recValor").value =
    saldo > 0
      ? saldo.toFixed(
          2
        )
      : "";

  $("#recDocumento").value =
    "";

  $("#recObservacao").value =
    "";

  abrirModal(
    "modalRecebimento"
  );
}

async function salvarRecebimento(){

  if(!selecionada){
    return;
  }

  const id =
    selecionada.id ||
    selecionada.conserto ||
    selecionada.movimento;

  const btn =
    $("#btnSalvarRecebimento");

  const texto =
    btn.textContent;

  try{
    btn.disabled =
      true;

    btn.textContent =
      "Executando...";

    await api(
      `${API}/ocorrencias/${encodeURIComponent(id)}/recebimentos`,
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            valor_recebido:
              Number(
                $("#recValor")
                  .value ||
                0
              ),

            data_recebimento:
              $("#recData")
                .value,

            forma_recebimento:
              $("#recForma")
                .value,

            documento:
              $("#recDocumento")
                .value,

            observacao:
              $("#recObservacao")
                .value
          })
      }
    );

    fecharModal(
      "modalRecebimento"
    );

    await atualizarDepoisDeAlteracao(
      id
    );

  }catch(e){
    alert(
      e.message
    );

  }finally{
    btn.disabled =
      false;

    btn.textContent =
      texto;
  }
}

async function atualizarDepoisDeAlteracao(
  id
){
  await carregarTudo();

  await abrirDetalhe(
    id
  );
}

function selecionadas(){

  return [
    ...document.querySelectorAll(
      ".sel-rel:checked"
    )
  ].map(
    x =>
      x.value
  );
}

async function abrirPdfPost(
  rota,
  payload,
  nomeErro
){
  /*
   * Abre a aba imediatamente para não ser bloqueada pelo navegador.
   * Depois troca a URL pela do Blob recebido do servidor.
   */
  const aba =
    window.open(
      "about:blank",
      "_blank"
    );

  if(!aba){
    alert(
      "O navegador bloqueou a nova aba. Libere pop-ups para este site."
    );
    return;
  }

  try{
    aba.document.title =
      "Gerando PDF...";

    aba.document.body.innerHTML =
      `
        <div style="
          font-family:Arial,sans-serif;
          padding:24px;
          color:#17324d;
        ">
          <b>Gerando PDF...</b><br>
          <small>Aguarde alguns segundos.</small>
        </div>
      `;

    const resposta =
      await fetch(
        rota,
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );

    if(!resposta.ok){
      let mensagem =
        nomeErro ||
        "Não foi possível gerar o PDF.";

      try{
        const erro =
          await resposta.json();

        mensagem =
          erro.erro ||
          mensagem;
      }catch(_){}

      throw new Error(
        mensagem
      );
    }

    const blob =
      await resposta.blob();

    if(
      !blob
      ||
      !blob.size
    ){
      throw new Error(
        "O servidor não retornou conteúdo para o PDF."
      );
    }

    const url =
      URL.createObjectURL(
        blob
      );

    aba.location.href =
      url;

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      120000
    );

  }catch(e){
    try{
      aba.close();
    }catch(_){}

    alert(
      e.message ||
      nomeErro ||
      "Erro ao gerar PDF."
    );
  }
}

function itensPdfSelecionados(){
  /*
   * Somente os checkboxes da primeira coluna contam como seleção manual.
   * Abrir/dar duplo clique em uma ocorrência NÃO pode fazer o PDF sair
   * com apenas aquele item. Sem checkbox marcado, gerarPdf() usa TODO o
   * resultado filtrado atual.
   */
  const ids =
    selecionadas();

  if(!ids.length){
    return [];
  }

  const mapa =
    new Map(
      ocorrencias.map(
        item => [
          idOcorrencia(
            item
          ),
          item
        ]
      )
    );

  return ids
    .map(
      id =>
        mapa.get(
          String(id)
        )
    )
    .filter(Boolean)
    .sort(
      compararTabela
    );
}

function textoCampoPdf(id,rotulo,sempre = false){
  const el = $("#" + id);

  if(!el){
    return null;
  }

  const valor = String(el.value || "").trim();

  if(!valor && !sempre){
    return null;
  }

  let texto = valor;

  if(el.tagName === "SELECT"){
    texto = String(
      el.selectedOptions?.[0]?.textContent ||
      valor ||
      "Todos"
    ).trim();
  }

  if(!texto && !sempre){
    return null;
  }

  return `${rotulo}: ${texto || "Todos"}`;
}

function filtrosPdfAtuais(){
  const filtros = [];

  [
    textoCampoPdf("tipoData","Data por",true),
    textoCampoPdf("dataIni","Data inicial"),
    textoCampoPdf("dataFim","Data final"),
    textoCampoPdf("empresa","Empresa"),
    textoCampoPdf("situacao","Situação"),
    textoCampoPdf("marca","Marca"),
    textoCampoPdf("fornecedor","Fornecedor"),
    textoCampoPdf("defeito","Defeito"),
    textoCampoPdf("departamento","Departamento"),
    textoCampoPdf("grupo","Grupo"),
    textoCampoPdf("produto","Produto"),
    textoCampoPdf("buscaGlobal","Busca"),

    // Filtros específicos da tabela: o PDF deve refletir exatamente
    // o mesmo recorte que está sendo exibido na tela.
    textoCampoPdf("filtroTabelaFuncionario","Funcionário"),
    textoCampoPdf("filtroTabelaProduto","Produto na tabela"),
    textoCampoPdf("filtroTabelaDescricao","Descrição"),
    textoCampoPdf("filtroTabelaMarca","Marca na tabela"),
    textoCampoPdf("filtroTabelaNF","NF"),
    textoCampoPdf("filtroTabelaUltimaCompra","Última compra"),
    textoCampoPdf("filtroTabelaDias","Dias"),
    textoCampoPdf("filtroTabelaFotos","Fotos")
  ]
    .filter(Boolean)
    .forEach(x => filtros.push(x));

  const nomesOrdenacaoPdf = {
    ocorrencia:"Ocorrência",
    empresa:"Loja",
    funcionario_entrada:"Funcionário / Usuário",
    produto:"Produto",
    descricao:"Descrição",
    marca:"Marca",
    fornecedor:"Fornecedor",
    defeito:"Defeito",
    situacao:"Situação",
    operacao_seta:"Operação",
    credito_seta:"Crédito",
    custo_unitario:"Custo unitário",
    valor_custo_defeito:"Valor de custo",
    data_entrada:"Entrada",
    pedido:"Pedido",
    previsao:"Previsão",
    envio:"Envio",
    baixa_seta:"Baixa",
    retorno:"Retorno",
    entrega:"Entrega",
    ultima_compra:"Última compra",
    loja_dona:"Loja dona",
    prazo_meses:"Prazo",
    data_limite:"Data limite",
    tempo_restante:"Tempo restante",
    dias_restantes:"Dias restantes",
    status_prazo:"Status do prazo",
    falta_indenizar:"Falta indenizar",
    valor_aprovado:"Valor aprovado",
    valor_recebido:"Valor recebido",
    saldo_receber:"Saldo a receber",
    valor_recusado:"Valor recusado",
    qtd_fotos:"Fotos"
  };

  filtros.push(
    `Ordenação da tabela: ${
      nomesOrdenacaoPdf[ordenacaoTabela.campo] ||
      ordenacaoTabela.campo ||
      "Ocorrência"
    } • ${
      ordenacaoTabela.direcao === "asc"
        ? "crescente"
        : "decrescente"
    }`
  );

  const somenteSemCompra = $("#chkSomenteSemCompra");
  if(somenteSemCompra?.checked){
    filtros.push("Somente sem última compra");
  }

  const compraOutraIni = $("#dataCompraOutraIni");
  const compraOutraFim = $("#dataCompraOutraFim");

  if(compraOutraIni?.value){
    filtros.push(`Última compra em outra loja - inicial: ${compraOutraIni.value}`);
  }

  if(compraOutraFim?.value){
    filtros.push(`Última compra em outra loja - final: ${compraOutraFim.value}`);
  }

  filtros.push(
    `Visão dos gráficos: ${modoValorGraficos() ? "Valor de custo" : "Quantidade"}`
  );

  return filtros;
}

function filtrosVisuaisPdf(){
  const nomesFinanceiro = {
    FALTA_INDENIZAR:"Falta Indenizar",
    A_RECEBER:"Indenizado a Receber",
    RECEBIDO:"Recebido",
    RECUSADO:"Recusado"
  };

  const configs = {
    empresa:{prefixo:"Loja",nome:v => `Loja ${v}`},
    operacao:{prefixo:"Situação",nome:v => nomeOperacao(v)},
    statusSeta:{prefixo:"Etapa",nome:v => nomeStatusSeta(v)},
    tipoOperacao:{prefixo:"Operação",nome:v => nomeOperacaoSeta(v)},
    credito:{prefixo:"Crédito",nome:v => nomeCreditoSeta(v)},
    marca:{prefixo:"Marca",nome:v => v},
    fornecedor:{prefixo:"Fornecedor",nome:v => v},
    defeito:{prefixo:"Defeito",nome:v => v},
    prazo:{prefixo:"Prazo",nome:v => nomePrazo(v)},
    financeiro:{prefixo:"Financeiro",nome:v => nomesFinanceiro[v] || nomeFinanceiro(v)},
    nf:{prefixo:"NF",nome:v => v},
    auxiliar:{prefixo:"Auxiliar",nome:v => v},
    funcionarioEntrada:{prefixo:"Funcionário",nome:v => {
      const item = (ocorrenciasBase || []).find(x =>
        String(x.funcionario_entrada_codigo || x.funcionario_entrada || "Não informado") === String(v)
      );
      return item?.funcionario_entrada || v;
    }},
    ocorrencia:{prefixo:"Ocorrência",nome:v => v}
  };

  const saida = [];

  Object.entries(configs).forEach(([chave,cfg]) => {
    [...valoresFiltro(chave)].forEach(valor => {
      saida.push({
        chave,
        valor:String(valor),
        texto:`${cfg.prefixo}: ${cfg.nome(valor)}`
      });
    });
  });

  return saida;
}

function resumoOperacoesPdf(lista){
  const ordem = [
    "DEFEITO",
    "ANALISE_FABRICA",
    "SEM_DEFEITO",
    "CONSERTO",
    "NAO_INFORMADO"
  ];

  return resumoGrupo(
    lista,
    operacaoSetaItem,
    key => nomeOperacaoSeta(key)
  )
    .sort((a,b) => ordem.indexOf(a.key) - ordem.indexOf(b.key))
    .map(x => ({
      key:x.key,
      label:x.label,
      quantidade:Number(x.quantidade || 0),
      valor:Number(x.valor || 0),
      selecionado:filtroTem("tipoOperacao",x.key)
    }));
}

function imagemGraficoPdf(id){
  try{
    const canvas = $("#" + id);
    return canvas?.toDataURL?.("image/png",0.92) || "";
  }catch(_){
    return "";
  }
}

function imagemPizzaPrazoPdf(){
  return imagemGraficoPdf("chartPrazo");
}

function graficosMiniaturaPdf(){
  const definicoes = [
    ["Semáforo do Prazo","chartPrazo"],
    ["Financeiro da Indenização","chartFinanceiro"],
    ["Empresas","chartEmpresas"],
    ["Status do Processo","chartSituacoes"],
    ["Operações","chartOperacoes"],
    ["Crédito","chartCredito"],
    ["Marcas","chartMarcas"],
    ["Tipos de Defeito","chartDefeitos"],
    ["Fornecedores","chartFornecedores"],
    ["Funcionário que Deu Entrada","chartFuncionarioEntrada"],
    ["Notas Fiscais (NF)","chartNF"],
    ["Auxiliar","chartAuxiliar"],
    ["Linha do Tempo das Situações","chartLinhaTempoSituacoes"]
  ];

  return definicoes
    .map(([titulo,id]) => ({
      titulo,
      id,
      imagem:imagemGraficoPdf(id)
    }))
    .filter(g => Boolean(g.imagem));
}

function imagemLojasPdf(){
  return imagemGraficoPdf("chartEmpresas");
}

function imagemMarcasPdf(){
  try{
    const canvasOriginal = $("#chartMarcas");
    const chartOriginal =
      typeof Chart !== "undefined"
        ? Chart.getChart(canvasOriginal)
        : null;

    if(!canvasOriginal || !chartOriginal){
      return imagemGraficoPdf("chartMarcas");
    }

    const labels = Array.isArray(chartOriginal.data?.labels)
      ? [...chartOriginal.data.labels]
      : [];

    const dsOriginal = chartOriginal.data?.datasets?.[0];

    if(!labels.length || !dsOriginal){
      return imagemGraficoPdf("chartMarcas");
    }

    const dados = Array.isArray(dsOriginal.data)
      ? [...dsOriginal.data]
      : [];

    /* PDF: somente as 12 maiores marcas, da maior para a menor. */
    const TOP_MARCAS_PDF = 12;

    const ranking = labels
      .map((label,i)=>({
        label:String(label || "-"),
        valor:Number(dados[i] || 0)
      }))
      .sort((a,b)=>b.valor-a.valor)
      .slice(0,TOP_MARCAS_PDF);

    const labelsPdf = ranking.map(x=>x.label);
    const dadosPdf = ranking.map(x=>x.valor);

    const canvas = document.createElement("canvas");
    canvas.width = 1250;
    canvas.height = 620;

    const ctx = canvas.getContext("2d");

    const graficoPdf = new Chart(ctx,{
      type:"bar",
      data:{
        labels:labelsPdf,
        datasets:[{
          label:"Quantidade",
          data:dadosPdf,
          backgroundColor:"#2bb6df",
          borderColor:"#2bb6df",
          borderWidth:0,
          borderRadius:5,
          maxBarThickness:54,
          categoryPercentage:0.80,
          barPercentage:0.82
        }]
      },
      options:{
        responsive:false,
        animation:false,
        maintainAspectRatio:false,
        layout:{
          padding:{top:38,right:25,bottom:20,left:15}
        },
        plugins:{
          legend:{display:false},
          tooltip:{enabled:false}
        },
        scales:{
          x:{
            grid:{display:false},
            ticks:{
              color:"#ffffff",
              autoSkip:false,
              maxRotation:45,
              minRotation:45,
              font:{size:15,weight:"600"}
            }
          },
          y:{
            beginAtZero:true,
            grid:{color:"rgba(255,255,255,.10)"},
            ticks:{color:"#d9e5f1",font:{size:13}}
          }
        }
      },
      plugins:[{
        id:"rotulosMarcasPdf",
        afterDatasetsDraw(chart){
          const c = chart.ctx;
          const meta = chart.getDatasetMeta(0);
          c.save();
          c.fillStyle = "#ffffff";
          c.textAlign = "center";
          c.textBaseline = "bottom";
          c.font = "bold 15px Arial";
          meta.data.forEach((barra,i)=>{
            c.fillText(
              Number(dadosPdf[i] || 0).toLocaleString("pt-BR"),
              barra.x,
              Math.max(20,barra.y-6)
            );
          });
          c.restore();
        }
      }]
    });

    const imagem = canvas.toDataURL("image/png",0.95);
    graficoPdf.destroy();
    return imagem;

  }catch(e){
    console.error("Erro ao montar ranking de marcas para PDF:",e);
    return imagemGraficoPdf("chartMarcas");
  }
}

async function baixarFotosFiltradas(){
  const selecionados = itensPdfSelecionados();
  const base = selecionados.length ? selecionados : [...(ocorrencias || [])];

  const itens = base.filter(
    item => Number(item.qtd_fotos || 0) > 0 || Boolean(item.foto_defeito_url)
  );

  if(!itens.length){
    return alert(
      "Não existem fotos de defeitos no resultado atual. Selecione 'Com foto' no filtro Fotos."
    );
  }

  const btn = $("#btnBaixarFotos");
  const textoOriginal = btn?.textContent || "Baixar Fotos";

  try{
    if(btn){
      btn.disabled = true;
      btn.textContent = "Preparando ZIP...";
    }

    const resposta = await fetch(
      "/api/qualidade-fotos/baixar-fotos",
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          itens: itens.map(item => ({
            id:item.id,
            conserto:item.conserto,
            movimento:item.movimento,
            empresa:item.empresa,
            empresa_nome:item.empresa_nome,
            fornecedor:item.fornecedor,
            fornecedor_nome:item.fornecedor_nome,
            produto:item.produto,
            produto_base:item.produto_base
          }))
        })
      }
    );

    if(!resposta.ok){
      let mensagem = "Não foi possível baixar as fotos.";
      try{
        const erro = await resposta.json();
        mensagem = erro?.erro || mensagem;
      }catch(_){}
      throw new Error(mensagem);
    }

    const blob = await resposta.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const hoje = new Date().toISOString().slice(0,10);

    link.href = url;
    link.download = `fotos-defeitos-${hoje}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url),1500);

  }catch(e){
    console.error("Erro ao baixar fotos filtradas:",e);
    alert(e.message || "Não foi possível baixar as fotos.");
  }finally{
    if(btn){
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }
}



function nomeMarcaPdf(valor){
  return String(valor || "SEM_MARCA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9_-]+/g,"_")
    .replace(/^_+|_+$/g,"")
    .slice(0,80) || "SEM_MARCA";
}

async function gerarArquivosPdfPorMarca(payloadBase){
  const itens = Array.isArray(payloadBase?.itens) ? payloadBase.itens : [];
  const grupos = new Map();

  for(const item of itens){
    const marca = String(item?.marca || "").trim() || "SEM MARCA";
    if(!grupos.has(marca)) grupos.set(marca,[]);
    grupos.get(marca).push(item);
  }

  /* Maior quantidade de ocorrências primeiro = PDFs maiores primeiro. */
  const marcas = [...grupos.keys()].sort(
    (a,b) => {
      const diferenca =
        (grupos.get(b)?.length || 0) -
        (grupos.get(a)?.length || 0);

      if(diferenca !== 0){
        return diferenca;
      }

      return a.localeCompare(
        b,
        "pt-BR",
        {numeric:true,sensitivity:"base"}
      );
    }
  );

  if(!marcas.length){
    throw new Error("Nenhuma marca encontrada no resultado atual.");
  }

  for(let i=0;i<marcas.length;i++){
    const marca = marcas[i];
    const payloadMarca = {
      ...payloadBase,
      itens:grupos.get(marca),
      apresentacao:{
        ...(payloadBase.apresentacao || {}),
        titulo:`JP • SETOR DE QUALIDADE • ${marca}`,
        subtitulo:`Relatório da marca ${marca}`,
        origem:`${payloadBase?.apresentacao?.origem || "Resultado filtrado"} • Marca: ${marca}`
      }
    };

    const resposta = await fetch(`${API}/relatorio.pdf`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payloadMarca)
    });

    if(!resposta.ok){
      let mensagem=`Não foi possível gerar o PDF da marca ${marca}.`;
      try{
        const erro=await resposta.json();
        mensagem=erro?.erro || mensagem;
      }catch(_){}
      throw new Error(mensagem);
    }

    const buffer=await resposta.arrayBuffer();
    const blob=new Blob([buffer],{type:"application/octet-stream"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");

    link.href=url;
    link.download=`${String(i+1).padStart(2,"0")}_${nomeMarcaPdf(marca)}.pdf`;
    link.style.display="none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    await new Promise(resolve=>setTimeout(resolve,1000));
    URL.revokeObjectURL(url);
  }
}

async function gerarPdf(){
  const selecionados = itensPdfSelecionados();

  /*
   * Se houver marcação manual, respeita a marcação.
   * Caso contrário, o botão PDF exporta exatamente o resultado
   * que está filtrado no dashboard/tabela.
   */
  const itens =
    (
      selecionados.length
        ? [...selecionados]
        : [...(ocorrencias || [])]
    )
      .sort(
        compararTabela
      );

  if(!itens.length){
    return alert(
      "Não há ocorrências no resultado atual para gerar o PDF."
    );
  }

  /*
   * Estoques por loja são opcionais.
   * Desmarcado = PDF normal.
   * Marcado = acrescenta, à direita da tabela, o estoque atual
   * dos produtos em todas as lojas que possuírem saldo.
   */
  const adicionarEstoques =
    Boolean(
      $("#chkPdfEstoques")?.checked
    );

  /*
   * Quando marcado, o PDF não recebe imagens dos gráficos.
   * O relatório continua levando o título do módulo, todos os filtros,
   * seleções visuais, seleção manual da tabela e a ordenação atual.
   */
  const incluirGraficos =
    !Boolean(
      $("#chkPdfSemGraficos")?.checked
    );

  const separarPorMarcas =
    Boolean(
      $("#chkPdfSepararMarcas")?.checked
    );

  const btn = $("#btnPdf");
  const textoOriginal = btn?.textContent || "PDF";

  if(btn){
    btn.disabled = true;
    btn.textContent =
      separarPorMarcas
        ? "Gerando PDFs por marca..."
        : "Gerando PDF...";
  }

  try{
    const etapas =
      calcularEtapas(itens)
        .map(x => ({
          key:x.key,
          numero:x.numero,
          nome:x.nome,
          quantidade:Number(x.quantidade || 0),
          valor:Number(x.valor || 0),
          selecionado:filtroTem("statusSeta",x.key)
        }));

    const itensCompactos =
      itens.map(item => ({
        id:item.id,
        conserto:item.conserto,
        movimento:item.movimento,
        empresa:item.empresa,
        produto:item.produto,
        descricao:item.descricao,
        marca:item.marca,
        fornecedor:item.fornecedor,
        departamento:item.departamento,
        grupo:item.grupo,
        tipo_defeito:item.tipo_defeito,
        operacao:item.operacao,
        operacao_seta:item.operacao_seta,
        status_seta:item.status_seta,
        situacao_codigo:item.situacao_codigo,
        credito_seta:item.credito_seta,
        status_prazo:item.status_prazo,
        quantidade:item.quantidade,
        custo_unitario:item.custo_unitario,
        valor_custo_defeito:item.valor_custo_defeito,
        ultima_compra:item.ultima_compra,
        ultima_compra_geral:item.ultima_compra_geral,
        prazo_meses:item.prazo_meses,
        data_limite:item.data_limite,
        tempo_restante:item.tempo_restante
      }));

    const payloadPdf =
      {
        itens:itensCompactos,
        adicionar_estoques:
          adicionarEstoques,
        incluir_graficos:
          incluirGraficos,
        apresentacao:{
          titulo:"JP • SETOR DE QUALIDADE",
          subtitulo:"Relatório do módulo Setor de Qualidade",
          filtros:filtrosPdfAtuais(),
          filtros_visuais:filtrosVisuaisPdf(),
          selecoes_tabela:
            selecionados.map(
              item =>
                `Ocorrência ${
                  item.conserto ||
                  item.movimento ||
                  item.id ||
                  "-"
                }`
            ),
          pizza_prazo:
            incluirGraficos
              ? imagemPizzaPrazoPdf()
              : "",
          grafico_lojas:
            incluirGraficos
              ? imagemLojasPdf()
              : "",
          grafico_marcas:
            incluirGraficos
              ? imagemMarcasPdf()
              : "",
          graficos:
            incluirGraficos
              ? graficosMiniaturaPdf()
              : [],
          resumo_operacoes:resumoOperacoesPdf(itens),
          etapas,
          visao:modoValorGraficos() ? "VALOR DE CUSTO" : "QUANTIDADE",
          origem:selecionados.length ? "Ocorrências selecionadas manualmente na tabela" : "Resultado filtrado completo",
          ordenacao:{
            campo:ordenacaoTabela.campo,
            direcao:ordenacaoTabela.direcao
          }
        }
      };

    if(separarPorMarcas){
      await gerarArquivosPdfPorMarca(
        payloadPdf
      );
    }else{
      await abrirPdfPost(
        `${API}/relatorio.pdf`,
        payloadPdf,
        "Não foi possível gerar o PDF."
      );
    }
  }finally{
    if(btn){
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }
}

async function gerarPdfTransferencias(){
  const ids =
    selecionadas();

  if(!ids.length){
    return alert(
      "Selecione pelo menos um produto na primeira coluna."
    );
  }

  const itensSelecionados =
    ocorrencias.filter(
      item =>
        ids.includes(
          idOcorrencia(
            item
          )
        )
    );

  const semCompra =
    itensSelecionados.filter(
      item =>
        !item.ultima_compra
    );

  if(!semCompra.length){
    return alert(
      "Nenhum dos produtos selecionados está sem última compra na loja atual."
    );
  }

  const comDono =
    semCompra.filter(
      item =>
        Array.isArray(
          item.lojas_donas
        )
        &&
        item.lojas_donas.length
    );

  if(!comDono.length){
    return alert(
      "Nenhum dos produtos selecionados possui loja proprietária identificada."
    );
  }

  const semDono =
    semCompra.length -
    comDono.length;

  if(semDono > 0){
    const continuar =
      confirm(
        `${semDono} produto(s) não possuem loja proprietária identificada e não entrarão no PDF. Deseja continuar?`
      );

    if(!continuar){
      return;
    }
  }

  const itens =
    comDono.map(
      item => ({
        ...item,

        loja_destino_escolhida:
          lojaDestinoSelecionada(
            item
          )
      })
    );

  await abrirPdfPost(
    `${API}/relatorio-transferencias.pdf`,
    {
      itens
    },
    "Não foi possível gerar o PDF de transferências."
  );
}

async function enviarEmail(){

  const ids =
    selecionadas();

  if(!ids.length){
    return alert(
      "Selecione pelo menos uma ocorrência."
    );
  }

  const email =
    prompt(
      "E-mail da fábrica/fornecedor:"
    );

  if(!email){
    return;
  }

  try{
    await api(
      `${API}/enviar-email`,
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            ids,
            email
          })
      }
    );

    alert(
      "Relatório encaminhado."
    );

  }catch(e){
    alert(
      e.message
    );
  }
}

/*
 * QUALIDADE - MARCAS
 * Mantém todas as marcas no dashboard, distribuídas em colunas.
 * Quando houver muitas, a área passa a rolar horizontalmente.
 */
function ajustarRolagemGraficoMarcas(){
  try{
    const canvas = $("#chartMarcas");
    const area = $("#chartMarcasArea");
    const scroll = $("#chartMarcasScroll");

    if(!canvas || !area || !scroll || typeof Chart === "undefined"){
      return;
    }

    const chart = Chart.getChart(canvas);
    const total = Array.isArray(chart?.data?.labels)
      ? chart.data.labels.length
      : 0;

    /*
     * Cada marca ganha largura própria.
     * O container externo rola na horizontal, mas NÃO corta
     * a parte inferior do canvas onde ficam os nomes.
     */
    const largura = Math.max(900,total * 105);

    scroll.style.height = "520px";
    scroll.style.maxHeight = "520px";
    scroll.style.overflowX = "auto";
    scroll.style.overflowY = "hidden";
    scroll.style.paddingBottom = "18px";

    area.style.width = `${largura}px`;
    area.style.height = "485px";
    area.style.minHeight = "485px";
    area.style.paddingBottom = "0";

    canvas.width = largura;
    canvas.height = 485;
    canvas.style.width = `${largura}px`;
    canvas.style.height = "485px";
    canvas.style.display = "block";

    /*
     * Reserva espaço interno no Chart.js para os nomes.
     * Isso é o que impede a barra de rolagem de encobrir o eixo X.
     */
    if(chart?.options){
      chart.options.maintainAspectRatio = false;

      chart.options.layout = chart.options.layout || {};
      chart.options.layout.padding = {
        ...(chart.options.layout.padding || {}),
        bottom: 58
      };

      chart.options.scales = chart.options.scales || {};
      chart.options.scales.x = chart.options.scales.x || {};
      chart.options.scales.x.ticks = {
        ...(chart.options.scales.x.ticks || {}),
        display:true,
        autoSkip:false,
        maxRotation:45,
        minRotation:45,
        padding:10,
        color:"#ffffff",
        font:{
          size:12,
          weight:"600"
        }
      };
    }

    chart.resize(largura,485);
    chart.update("none");

  }catch(e){
    console.error("Erro ao ajustar rolagem do gráfico de marcas:",e);
  }
}


/* Reaplica o dimensionamento sempre que os gráficos terminarem de renderizar. */
const _renderDashboardAgoraMarcas = renderDashboardAgora;
renderDashboardAgora = function(){
  const retorno = _renderDashboardAgoraMarcas.apply(this,arguments);
  setTimeout(ajustarRolagemGraficoMarcas,0);
  return retorno;
};
