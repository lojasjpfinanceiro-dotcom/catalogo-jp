/* OTB BI - correção seleção VISÃO normalizada */
let OTB_DATASET = [];

/*
 * Guarda o dataset completo antes do clique
 * no gráfico temporal.
 */
let OTB_DATASET_BASE = [];

let OTB_TIMELINE_DATASET = [];

let OTB_EMPRESAS_SEL = new Set();
let OTB_VISAO_SEL = new Set();
let OTB_COMPARATIVO_SEL = new Set();
let OTB_COMPARATIVO2_SEL = new Set();
let OTB_PRODUTOS_SEL = new Set();

/*
 * Período atualmente selecionado no gráfico temporal.
 */
let OTB_PERIODOS_TEMPORAIS_SEL = new Set();

let grafEmpresas = null;
let grafVisao = null;
let grafAnaliseOTB = null;
let grafComparativoVisaoOTB = null;
let grafComparativoVisaoOTB2 = null;
let grafTemporal = null;
let OTB_SEMAFORO_ATIVO = "";

/* =========================================================
   CONSOLIDAÇÃO GLOBAL DE EMPRESAS
   ---------------------------------------------------------
   A parametrização vem da API global:
   /api/empresas-consolidacao/ativa

   O estado liga/desliga é compartilhado com o JP Deskboard
   pelo localStorage:
   jp_empresas_consolidadas = "1" | "0"

   Se a preferência ainda não existir, o padrão é LIGADO.
   ========================================================= */

const OTB_CHAVE_EMPRESAS_CONSOLIDADAS =
  "jp_empresas_consolidadas";

let OTB_EMPRESAS_CONSOLIDADAS_ATIVO = true;
let OTB_MAPA_EMPRESAS_CONSOLIDADAS = {};
let OTB_DESTINOS_EMPRESAS_CONSOLIDADAS = {};
let OTB_GRUPOS_EMPRESAS_CONSOLIDADAS = [];

function normalizarEmpresaOTB(valor){
  const digitos = String(valor ?? "")
    .replace(/\D/g,"");

  if(!digitos) return "";

  return digitos
    .slice(-2)
    .padStart(2,"0");
}

function lerPreferenciaEmpresasConsolidadasOTB(){
  try{
    const salvo =
      localStorage.getItem(
        OTB_CHAVE_EMPRESAS_CONSOLIDADAS
      );

    if(salvo === "0"){
      return false;
    }

    if(salvo === "1"){
      return true;
    }
  }catch(e){}

  return true;
}

function empresaConsolidadaOTB(empresa){
  const codigo = normalizarEmpresaOTB(empresa);

  if(!codigo){
    return "";
  }

  if(!OTB_EMPRESAS_CONSOLIDADAS_ATIVO){
    return codigo;
  }

  return normalizarEmpresaOTB(
    OTB_MAPA_EMPRESAS_CONSOLIDADAS[codigo]
  ) || codigo;
}

function empresasFisicasDaConsolidadaOTB(empresa){
  const codigo = normalizarEmpresaOTB(empresa);

  if(!codigo){
    return [];
  }

  if(!OTB_EMPRESAS_CONSOLIDADAS_ATIVO){
    return [codigo];
  }

  const principal = empresaConsolidadaOTB(codigo);

  const lista =
    OTB_DESTINOS_EMPRESAS_CONSOLIDADAS[principal];

  if(Array.isArray(lista) && lista.length){
    return [...new Set(
      lista
        .map(normalizarEmpresaOTB)
        .filter(Boolean)
    )];
  }

  return [codigo];
}

function empresaAtendeSelecaoOTB(empresa){
  if(!OTB_EMPRESAS_SEL.size){
    return true;
  }

  const consolidada =
    empresaConsolidadaOTB(empresa);

  return OTB_EMPRESAS_SEL.has(consolidada);
}

function nomeEmpresaConsolidadaOTB(item){
  const original =
    normalizarEmpresaOTB(item?.empresa);

  const consolidada =
    empresaConsolidadaOTB(original);

  if(!consolidada){
    return "";
  }

  /*
   * Quando ocorreu consolidação, o código principal já é a
   * identificação correta. Evita usar a descrição da empresa
   * antiga como nome da empresa principal.
   */
  if(
    OTB_EMPRESAS_CONSOLIDADAS_ATIVO &&
    original &&
    consolidada !== original
  ){
    return consolidada;
  }

  const nomeEmpresa = String(
    item?.empresa_descricao ??
    item?.descricao_empresa ??
    item?.nome_filial ??
    item?.filial_nome ??
    ""
  )
    .replace(/\s+/g," ")
    .trim();

  return nomeEmpresa
    ? `${consolidada} - ${nomeEmpresa}`
    : consolidada;
}

async function carregarConsolidacaoGlobalEmpresasOTB(){
  OTB_EMPRESAS_CONSOLIDADAS_ATIVO =
    lerPreferenciaEmpresasConsolidadasOTB();

  try{
    const resposta =
      await api("/api/empresas-consolidacao/ativa");

    OTB_MAPA_EMPRESAS_CONSOLIDADAS =
      resposta?.mapa &&
      typeof resposta.mapa === "object"
        ? resposta.mapa
        : {};

    OTB_DESTINOS_EMPRESAS_CONSOLIDADAS =
      resposta?.destinos &&
      typeof resposta.destinos === "object"
        ? resposta.destinos
        : {};

    OTB_GRUPOS_EMPRESAS_CONSOLIDADAS =
      Array.isArray(resposta?.grupos)
        ? resposta.grupos
        : [];

    console.log(
      "[OTB] Consolidação global:",
      OTB_EMPRESAS_CONSOLIDADAS_ATIVO
        ? "ATIVA"
        : "DESATIVADA",
      "| grupos:",
      OTB_GRUPOS_EMPRESAS_CONSOLIDADAS.length
    );

  }catch(e){
    console.warn(
      "[OTB] Não foi possível carregar a consolidação global:",
      e?.message || e
    );

    OTB_MAPA_EMPRESAS_CONSOLIDADAS = {};
    OTB_DESTINOS_EMPRESAS_CONSOLIDADAS = {};
    OTB_GRUPOS_EMPRESAS_CONSOLIDADAS = [];
  }

  atualizarIndicadorConsolidacaoOTB();
}

function atualizarIndicadorConsolidacaoOTB(){
  const el =
    document.getElementById(
      "statusConsolidacaoEmpresasOTB"
    );

  if(!el){
    return;
  }

  const grupos =
    OTB_GRUPOS_EMPRESAS_CONSOLIDADAS.length;

  el.classList.toggle(
    "ativo",
    OTB_EMPRESAS_CONSOLIDADAS_ATIVO
  );

  el.textContent =
    OTB_EMPRESAS_CONSOLIDADAS_ATIVO
      ? `Empresas consolidadas • ${grupos} grupo${grupos === 1 ? "" : "s"}`
      : "Empresas separadas";
}

async function reaplicarPreferenciaGlobalEmpresasOTB(){
  const novoEstado =
    lerPreferenciaEmpresasConsolidadasOTB();

  const mudou =
    novoEstado !== OTB_EMPRESAS_CONSOLIDADAS_ATIVO;

  OTB_EMPRESAS_CONSOLIDADAS_ATIVO =
    novoEstado;

  if(mudou){
    /*
     * Seleções de empresas feitas em um modo não devem ser
     * carregadas para o outro, pois os códigos visuais mudam.
     */
    OTB_EMPRESAS_SEL.clear();

    if(OTB_GRAFICO_ORIGEM_SEL === "empresas"){
      OTB_GRAFICO_ORIGEM_SEL = "";
    }

    atualizarIndicadorConsolidacaoOTB();

    if(
      Array.isArray(OTB_DATASET) &&
      OTB_DATASET.length &&
      typeof aplicarFiltrosOTB === "function"
    ){
      aplicarFiltrosOTB();
    }
  }
}

window.addEventListener("storage",evento=>{
  if(
    evento.key ===
    OTB_CHAVE_EMPRESAS_CONSOLIDADAS
  ){
    reaplicarPreferenciaGlobalEmpresasOTB();
  }
});


/* Ordenação da Central Estratégica de Produtos. */
let OTB_ORDENACAO_TABELA = {
  campo: "prioridade",
  direcao: "asc"
};

let OTB_CENTRAL_ITENS = new Map();
let OTB_MODAL_PRODUTO_ABERTO = false;
let OTB_MODAL_GRAF_LINHA = null;
let OTB_MODAL_LINHA_TEMPO = [];
let OTB_MODAL_ESTOQUE_ATUAL = 0;

function ordenarCentralProdutosOTB(campo){
  if(OTB_ORDENACAO_TABELA.campo === campo){
    OTB_ORDENACAO_TABELA.direcao =
      OTB_ORDENACAO_TABELA.direcao === "asc" ? "desc" : "asc";
  }else{
    OTB_ORDENACAO_TABELA.campo = campo;
    OTB_ORDENACAO_TABELA.direcao = "asc";
  }

  if(OTB_TABELAS_LIBERADAS){
    renderCentralEstrategicaProdutosOTB(filtrarDatasetOTB());
  }
}

function indicadorOrdenacaoCentralOTB(campo){
  if(OTB_ORDENACAO_TABELA.campo !== campo) return "↕";
  return OTB_ORDENACAO_TABELA.direcao === "asc" ? "▲" : "▼";
}

function cabecalhoOrdenavelCentralOTB(campo, titulo, classe = ""){
  return `
    <th
      class="cabecalhoOrdenavelOTB ${classe}"
      onclick="ordenarCentralProdutosOTB('${campo}')"
      title="Clique para ordenar crescente ou decrescente"
    >
      <span>${titulo}</span>
      <i>${indicadorOrdenacaoCentralOTB(campo)}</i>
    </th>
  `;
}

/*
 * MODO RÁPIDO:
 * gráficos e KPIs aparecem primeiro. As tabelas só são
 * montadas quando o usuário solicitar.
 */
let OTB_TABELAS_LIBERADAS = false;
let OTB_SEQ_CARREGAMENTO = 0;

/*
 * CACHE LOCAL DE CONSULTAS OTB
 * O banco analítico já é a fonte principal. Este Map evita até mesmo
 * repetir uma requisição HTTP quando o usuário volta a um filtro que já
 * consultou nesta sessão.
 */
const OTB_CACHE_CONSULTAS = new Map();
const OTB_CACHE_CONSULTAS_LIMITE = 20;

function guardarConsultaOTB(chave, resposta){
  if(!chave || !resposta) return;

  if(OTB_CACHE_CONSULTAS.has(chave)){
    OTB_CACHE_CONSULTAS.delete(chave);
  }

  OTB_CACHE_CONSULTAS.set(chave, resposta);

  while(OTB_CACHE_CONSULTAS.size > OTB_CACHE_CONSULTAS_LIMITE){
    const primeira = OTB_CACHE_CONSULTAS.keys().next().value;
    OTB_CACHE_CONSULTAS.delete(primeira);
  }
}

async function carregarDatasetCacheOTB(parametros){
  const chave = String(parametros || "");

  const qs = new URLSearchParams(chave);
  const dataFim = String(qs.get("data_fim") || "");

  const hoje = new Date();
  const hojeISO =
    `${hoje.getFullYear()}-` +
    `${String(hoje.getMonth()+1).padStart(2,"0")}-` +
    `${String(hoje.getDate()).padStart(2,"0")}`;

  /*
   * Se o período chega até hoje, nunca reaproveita resposta antiga:
   * o backend precisa consultar as vendas do SETA novamente.
   */
  const precisaTempoReal =
    !dataFim ||
    dataFim >= hojeISO;

  if(
    !precisaTempoReal &&
    OTB_CACHE_CONSULTAS.has(chave)
  ){
    const resposta = OTB_CACHE_CONSULTAS.get(chave);

    OTB_CACHE_CONSULTAS.delete(chave);
    OTB_CACHE_CONSULTAS.set(chave, resposta);

    console.log(
      "[OTB-BI] Período histórico atendido pelo cache da sessão."
    );

    return resposta;
  }

  const resposta = await api(
    "/api/otb-bi/dataset?" + parametros
  );

  /*
   * Só guarda períodos já encerrados.
   * Consulta que inclui hoje permanece sempre viva.
   */
  if(!precisaTempoReal){
    guardarConsultaOTB(chave, resposta);
  }

  if(resposta?.tempo_real_hoje){
    console.log(
      `[OTB-BI] Vendas de hoje atualizadas no SETA em ` +
      `${Number(resposta.tempo_real_ms || 0)} ms.`
    );
  }

  return resposta;
}


/*
 * Ordenação atual do gráfico de Visão.
 * Pode ser alterada pelo seletor exibido
 * no canto superior direito do gráfico.
 */
let OTB_ORDEM_EMPRESAS = "estoque";
let OTB_ORDEM_VISAO = "estoque";
let OTB_ORDEM_COMPARATIVO_VISAO = "estoque";
let OTB_CAMPO_COMPARATIVO = "grupo";
let OTB_ORDEM_COMPARATIVO_VISAO2 = "estoque";
let OTB_CAMPO_COMPARATIVO2 = "subgrupo";

/*
 * Quantidade máxima de colunas visíveis em cada gráfico.
 * O valor 0 significa mostrar todas.
 */
let OTB_LIMITE_VISAO = 10;
let OTB_LIMITE_COMPARATIVO1 = 10;
let OTB_LIMITE_COMPARATIVO2 = 10;

function limitarListaGraficoOTB(lista, limite){
  const quantidade = Number(limite || 0);

  if(!quantidade || quantidade <= 0){
    return lista;
  }

  return lista.slice(0, quantidade);
}

/*
 * Identifica qual gráfico iniciou a seleção atual.
 * O gráfico de origem continua exibindo todas as categorias,
 * deixando apagadas as não selecionadas. Os demais gráficos
 * mostram somente as categorias selecionadas.
 */
let OTB_GRAFICO_ORIGEM_SEL = "";

const CORES = {
  compras: "#22c55e",
  comprasAnoPassado: "#0891b2",
  comprasAnoRetrasado: "#67e8f9",
  vendas: "#a855f7",
  pedidos: "#f97316",
  estoque: "#2563eb",
  vendaAnoPassado: "#facc15",
  vendaAnoRetrasado: "#fde68a"
};

/* Legendas mais espaçadas e legíveis em todos os gráficos Chart.js. */
if(window.Chart?.defaults?.plugins?.legend?.labels){
  Object.assign(Chart.defaults.plugins.legend.labels, {
    color: "#f8fafc",
    padding: 18,
    boxWidth: 14,
    boxHeight: 14,
    font: { size: 12, weight: "700", family: "Arial, Helvetica, sans-serif" }
  });
}


/*
 * As três séries históricas adicionais começam ocultas
 * separadamente em cada um dos quatro gráficos.
 * O usuário ativa ou desativa clicando na própria legenda.
 */
const OTB_SERIES_HISTORICAS_OCULTAS_PADRAO = new Set();

function serieAtivaGeralOTB(){
  /*
   * Mantida por compatibilidade com os datasets existentes.
   * A visibilidade real agora é controlada individualmente
   * pela legenda de cada gráfico.
   */
  return true;
}

function atualizarCardsPorSeriesOTB(){
  document.querySelectorAll("[data-card-serie-otb]").forEach(card => {
    card.hidden = false;
  });
}

function iniciarSeletorSeriesGeraisOTB(){
  atualizarCardsPorSeriesOTB();
}

/* =========================================================
   FILTRO GLOBAL MULTI-SELEÇÃO PELOS CARDS DE RESUMO

   - Clique simples: adiciona/remove a série.
   - Pode manter várias séries selecionadas ao mesmo tempo.
   - Nenhuma selecionada = mostra todas.
   - Duplo clique em qualquer nome = limpa todas as seleções.
   ========================================================= */

const OTB_SERIES_CARD_SEL = new Set();
let OTB_TIMER_CLIQUE_CARD_SERIE = null;

const OTB_SERIES_CARD_CONFIG = {
  "Vendas": {
    label:"Vendas",
    aliases:["Vendas"]
  },
  "Vendas Ano Passado": {
    label:"Venda Ano Passado",
    aliases:["Venda Ano Passado","Vendas Ano Passado"]
  },
  "Vendas Ano Retrasado": {
    label:"Venda Ano Retrasado",
    aliases:["Venda Ano Retrasado","Vendas Ano Retrasado"]
  },
  "Compras": {
    label:"Compras",
    aliases:["Compras"]
  },
  "Compras Ano Passado": {
    label:"Compras Ano Passado",
    aliases:["Compras Ano Passado","Compra Ano Passado"]
  },
  "Compras Ano Retrasado": {
    label:"Compras Ano Retrasado",
    aliases:["Compras Ano Retrasado","Compra Ano Retrasado"]
  },
  "Pedidos": {
    label:"Pedidos",
    aliases:["Pedidos"]
  },
  "Estoque": {
    label:"Estoque",
    aliases:[
      "Estoque",
      "Estoque Real",
      "Estoque Atual"
    ]
  }
};

function normalizarNomeSerieCardOTB(valor){
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");
}

function aliasesSerieCardOTB(nomeCard){
  const cfg = OTB_SERIES_CARD_CONFIG[nomeCard];
  if(!cfg) return [];

  return [
    cfg.label,
    ...(Array.isArray(cfg.aliases) ? cfg.aliases : [])
  ]
    .filter(Boolean)
    .map(normalizarNomeSerieCardOTB);
}

function serieDoDatasetCorrespondeCardOTB(dataset,nomeCard){
  const nomeDataset =
    normalizarNomeSerieCardOTB(dataset?.label);

  return aliasesSerieCardOTB(nomeCard)
    .includes(nomeDataset);
}

function datasetCorrespondeAlgumCardSelecionadoOTB(dataset){
  if(!OTB_SERIES_CARD_SEL.size) return true;

  return [...OTB_SERIES_CARD_SEL].some(nomeCard =>
    serieDoDatasetCorrespondeCardOTB(
      dataset,
      nomeCard
    )
  );
}

function graficosSeriesCardOTB(){
  return [
    grafEmpresas,
    grafVisao,
    grafComparativoVisaoOTB,
    grafComparativoVisaoOTB2,
    grafTemporal
  ].filter(Boolean);
}

function aplicarSeriesCardsEmGraficoOTB(chart){
  if(!chart?.data?.datasets?.length) return;

  /*
   * Sem seleção = todas visíveis.
   */
  if(!OTB_SERIES_CARD_SEL.size){
    chart.data.datasets.forEach((dataset,indice)=>{
      chart.setDatasetVisibility(indice,true);
    });
    return;
  }

  /*
   * Se nenhuma das séries escolhidas existir neste gráfico,
   * não deixa o gráfico completamente vazio.
   */
  const existeAlgumaEscolhida =
    chart.data.datasets.some(dataset =>
      datasetCorrespondeAlgumCardSelecionadoOTB(dataset)
    );

  if(!existeAlgumaEscolhida){
    chart.data.datasets.forEach((dataset,indice)=>{
      chart.setDatasetVisibility(indice,true);
    });
    return;
  }

  chart.data.datasets.forEach((dataset,indice)=>{
    chart.setDatasetVisibility(
      indice,
      datasetCorrespondeAlgumCardSelecionadoOTB(dataset)
    );
  });
}

function atualizarVisualCardsSerieOTB(){
  document
    .querySelectorAll(".cards .card")
    .forEach(card=>{
      const span = card.querySelector(":scope > span");
      const titulo = String(
        span?.textContent || ""
      ).trim();

      const configuravel =
        Boolean(OTB_SERIES_CARD_CONFIG[titulo]);

      const selecionado =
        configuravel &&
        OTB_SERIES_CARD_SEL.has(titulo);

      card.classList.toggle(
        "cardSerieFiltroDisponivelOTB",
        configuravel
      );

      card.classList.toggle(
        "cardSerieFiltroAtivoOTB",
        selecionado
      );

      if(span && configuravel){
        span.title = selecionado
          ? "Clique para retirar esta série. Duplo clique limpa todas."
          : "Clique para acrescentar esta série. Duplo clique limpa todas.";

        span.setAttribute(
          "aria-pressed",
          selecionado ? "true" : "false"
        );
      }
    });
}

function atualizarGraficosPorCardsOTB(){
  graficosSeriesCardOTB().forEach(chart=>{
    aplicarSeriesCardsEmGraficoOTB(chart);
    chart.update("none");
  });

  atualizarVisualCardsSerieOTB();
}

function alternarFiltroSerieCardOTB(nomeCard){
  const nome = String(nomeCard || "").trim();
  if(!OTB_SERIES_CARD_CONFIG[nome]) return;

  if(OTB_SERIES_CARD_SEL.has(nome)){
    OTB_SERIES_CARD_SEL.delete(nome);
  }else{
    OTB_SERIES_CARD_SEL.add(nome);
  }

  atualizarGraficosPorCardsOTB();
}

function limparFiltroSeriesCardsOTB(){
  OTB_SERIES_CARD_SEL.clear();
  atualizarGraficosPorCardsOTB();
}

function reaplicarFiltroSerieCardOTB(){
  if(!OTB_SERIES_CARD_SEL.size) return;

  graficosSeriesCardOTB().forEach(chart=>{
    aplicarSeriesCardsEmGraficoOTB(chart);
    chart.update("none");
  });

  atualizarVisualCardsSerieOTB();
}

function iniciarFiltroSeriesCardsOTB(){
  document
    .querySelectorAll(".cards .card")
    .forEach(card=>{
      const span = card.querySelector(":scope > span");
      const titulo = String(
        span?.textContent || ""
      ).trim();

      if(
        !span ||
        !OTB_SERIES_CARD_CONFIG[titulo] ||
        span.dataset.filtroSerieConfigurado === "1"
      ){
        return;
      }

      span.dataset.filtroSerieConfigurado = "1";
      span.setAttribute("role","button");
      span.setAttribute("tabindex","0");
      span.setAttribute("aria-pressed","false");

      /*
       * Pequeno atraso distingue clique simples do duplo clique.
       * Assim o duplo clique não marca/desmarca a série antes de limpar.
       */
      span.addEventListener("click",evento=>{
        evento.preventDefault();
        evento.stopPropagation();

        clearTimeout(OTB_TIMER_CLIQUE_CARD_SERIE);

        OTB_TIMER_CLIQUE_CARD_SERIE = setTimeout(()=>{
          alternarFiltroSerieCardOTB(titulo);
          OTB_TIMER_CLIQUE_CARD_SERIE = null;
        },220);
      });

      span.addEventListener("dblclick",evento=>{
        evento.preventDefault();
        evento.stopPropagation();

        clearTimeout(OTB_TIMER_CLIQUE_CARD_SERIE);
        OTB_TIMER_CLIQUE_CARD_SERIE = null;

        limparFiltroSeriesCardsOTB();
      });

      span.addEventListener("keydown",evento=>{
        if(evento.key === "Enter" || evento.key === " "){
          evento.preventDefault();
          alternarFiltroSerieCardOTB(titulo);
        }

        if(evento.key === "Escape"){
          evento.preventDefault();
          limparFiltroSeriesCardsOTB();
        }
      });
    });

  atualizarVisualCardsSerieOTB();
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarFiltroSeriesCardsOTB
);


/*
 * Séries ocultas por gráfico.
 * A escolha permanece mesmo quando o gráfico é recriado
 * por filtros, cliques ou atualização local.
 */
const OTB_SERIES_OCULTAS = new Map();

function obterSeriesOcultasOTB(chaveGrafico){
  if(!OTB_SERIES_OCULTAS.has(chaveGrafico)){
    OTB_SERIES_OCULTAS.set(
      chaveGrafico,
      new Set(OTB_SERIES_HISTORICAS_OCULTAS_PADRAO)
    );
  }

  return OTB_SERIES_OCULTAS.get(chaveGrafico);
}

function serieOcultaOTB(chaveGrafico, nomeSerie){
  return obterSeriesOcultasOTB(chaveGrafico).has(
    String(nomeSerie || "")
  );
}

function aplicarVisibilidadeSeriesOTB(chart, chaveGrafico){
  if(!chart) return;

  const ocultas = obterSeriesOcultasOTB(chaveGrafico);

  chart.data.datasets.forEach((dataset, indice) => {
    chart.setDatasetVisibility(
      indice,
      !ocultas.has(String(dataset.label || ""))
    );
  });

  atualizarLegendasExternasOTB(chaveGrafico);
}

function alternarSerieOTB(chaveGrafico, nomeSerie, chart){
  const nome = String(nomeSerie || "");
  if(!nome) return;

  const ocultas = obterSeriesOcultasOTB(chaveGrafico);

  if(ocultas.has(nome)){
    ocultas.delete(nome);
  }else{
    ocultas.add(nome);
  }

  aplicarVisibilidadeSeriesOTB(chart, chaveGrafico);
  chart?.update();
}

function cliqueLegendaChartOTB(chaveGrafico){
  return function(evento, itemLegenda, legenda){
    const chart = legenda.chart;
    const indice = Number(itemLegenda?.datasetIndex);
    const nomeSerie = String(itemLegenda?.text || "");

    if(!chart || !Number.isInteger(indice)) return;

    const ocultas = obterSeriesOcultasOTB(chaveGrafico);
    const estaVisivel = chart.isDatasetVisible(indice);

    chart.setDatasetVisibility(indice, !estaVisivel);

    if(estaVisivel){
      ocultas.add(nomeSerie);
    }else{
      ocultas.delete(nomeSerie);
    }

    /*
     * O Chart.js risca automaticamente o nome da série oculta.
     * update() também recalcula barras, linhas, escalas e espaços,
     * fazendo as séries restantes se reposicionarem no gráfico.
     */
    chart.update();
    atualizarLegendasExternasOTB(chaveGrafico);
  };
}

function atualizarLegendasExternasOTB(chaveGrafico){
  document
    .querySelectorAll(
      `.legendaItemComparativoOTB[data-grafico="${chaveGrafico}"]`
    )
    .forEach(item => {
      const nomeSerie = item.dataset.serie || "";

      item.classList.toggle(
        "desativada",
        serieOcultaOTB(chaveGrafico, nomeSerie)
      );

      item.setAttribute(
        "aria-pressed",
        serieOcultaOTB(chaveGrafico, nomeSerie)
          ? "false"
          : "true"
      );
    });
}

function garantirLegendaComprasComparativosOTB(){
  ["comparativo1", "comparativo2"].forEach(chave => {
    const existente = document.querySelector(
      `.legendaItemComparativoOTB[data-grafico="${chave}"][data-serie="Compras"]`
    );

    if(existente) return;

    const referencia = document.querySelector(
      `.legendaItemComparativoOTB[data-grafico="${chave}"]`
    );

    const container = referencia?.parentElement;
    if(!container) return;

    const item = document.createElement(referencia.tagName || "span");
    item.className = referencia.className;
    item.dataset.grafico = chave;
    item.dataset.serie = "Compras";
    item.innerHTML = `
      <span style="
        display:inline-block;
        width:14px;
        height:14px;
        border-radius:4px;
        background:${CORES.compras};
        margin-right:7px;
        vertical-align:-2px;
      "></span>
      Compras
    `;

    container.insertBefore(item, referencia);
  });
}

function configurarLegendasExternasOTB(){
  garantirLegendaComprasComparativosOTB();

  document
    .querySelectorAll(".legendaItemComparativoOTB[data-grafico]")
    .forEach(item => {
      if(item.dataset.legendaConfigurada === "1") return;

      item.dataset.legendaConfigurada = "1";
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-pressed", "true");

      const executar = () => {
        const chave = item.dataset.grafico || "";
        const serie = item.dataset.serie || "";

        const chart =
          chave === "comparativo1"
            ? grafComparativoVisaoOTB
            : chave === "comparativo2"
              ? grafComparativoVisaoOTB2
              : null;

        alternarSerieOTB(chave, serie, chart);
      };

      item.addEventListener("click", executar);

      item.addEventListener("keydown", evento => {
        if(evento.key === "Enter" || evento.key === " "){
          evento.preventDefault();
          executar();
        }
      });
    });

  atualizarLegendasExternasOTB("comparativo1");
  atualizarLegendasExternasOTB("comparativo2");
}

function voltarCatalogo(){
  window.location.href = "/index.html";
}

async function api(url){
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 90000);

  try{
    const r = await fetch(url, {
      signal: controller.signal
    });

    const texto = await r.text();

    let j;
    try{
      j = JSON.parse(texto);
    }catch(e){
      throw new Error("Servidor retornou HTML/erro em vez de JSON.");
    }

    if(!r.ok || j.ok === false){
      throw new Error(j.erro || "Erro ao carregar dados.");
    }

    return j;

  }catch(e){
    if(e.name === "AbortError"){
      throw new Error("A busca demorou demais. Informe uma empresa, grupo ou departamento para reduzir a consulta.");
    }

    throw e;

  }finally{
    clearTimeout(timer);
  }
}
function numeroOTB(v){
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatarNum(v){
  return numeroOTB(v).toLocaleString("pt-BR");
}
function formatarMoedaOTB(valor){
  return numeroOTB(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/*
 * Limpa imediatamente os resultados da consulta anterior.
 * É executada antes de iniciar uma nova busca para impedir
 * que valores antigos sejam confundidos com a nova consulta.
 */
function limparResultadosAntesBuscaOTB(){
  const quantidades = [
    "kpiVenda12Qtd",
    "kpiVendaAnoPassadoQtd",
    "kpiVendaAnoRetrasadoQtd",
    "kpiCompraQtd",
    "kpiCompraAnoPassadoQtd",
    "kpiCompraAnoRetrasadoQtd",
    "kpiPedidoQtd",
    "kpiEstoqueQtd",
    "kpiNecessidadeCompraQtd"
  ];

  const valores = [
    "kpiVenda12Valor",
    "kpiVendaAnoPassadoValor",
    "kpiVendaAnoRetrasadoValor",
    "kpiCompraValor",
    "kpiCompraAnoPassadoValor",
    "kpiCompraAnoRetrasadoValor",
    "kpiPedidoValor",
    "kpiEstoqueValor",
    "kpiNecessidadeCompraValor"
  ];

  quantidades.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = "0";
  });

  valores.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = "R$ 0,00";
  });

  const cobertura = document.getElementById("kpiCobertura");
  const giro = document.getElementById("kpiGiro");

  if(cobertura) cobertura.textContent = "0 dias";
  if(giro) giro.textContent = "0,00";

  [
    "rEstoque",
    "rPedidos",
    "rCompras",
    "rVendas",
    "semRuptura",
    "semAtencao",
    "semSaudavel",
    "qtdProdutosComprarOTB",
    "qtdCompraSugeridaOTB",
    "qtdFornecedoresComprarOTB",
    "qtdRupturasEvitaveisOTB"
  ].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = "0";
  });

  /*
   * Retira os dados antigos dos gráficos, mas mantém as
   * instâncias até que a nova consulta termine.
   */
  [
    grafEmpresas,
    grafVisao,
    grafAnaliseOTB,
    grafComparativoVisaoOTB,
    grafComparativoVisaoOTB2,
    grafTemporal
  ].forEach(grafico => {
    if(!grafico) return;

    grafico.data.labels = [];

    grafico.data.datasets.forEach(dataset => {
      dataset.data = [];
    });

    grafico.update("none");
  });

  const tabela = document.getElementById("tblCentralProdutosOTB");

  if(tabela){
    tabela.innerHTML = `
      <div class="otbTabelaSobDemanda">
        <div>Realizando nova consulta...</div>
      </div>
    `;
  }

  OTB_DATASET = [];
  OTB_DATASET_BASE = [];
  OTB_TIMELINE_DATASET = [];
}

/* =========================================================
   FOTO DOS PRODUTOS NAS TABELAS DO OTB-BI
   Mantém o mesmo padrão compacto usado no Giro de Produtos.
   ========================================================= */
function escaparHTMLFotoOTB(valor){
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function obterCodigoProdutoOTB(item = {}){
  return String(
    item.produto ??
    item.produto_id ??
    item.codigo_produto ??
    item.codigo ??
    ""
  ).trim();
}

function obterFotosProdutoOTB(item = {}){
  const produto = obterCodigoProdutoOTB(item);

  const fotos = [
    item.foto_url,
    item.url_foto,
    item.imagem_url,
    item.image_url,
    item.foto,
    item.imagem
  ]
    .map(x => String(x || "").trim())
    .filter(Boolean);

  /*
   * A foto dos calçados não fica em uma pasta pública /fotos.
   * Ela é entregue pela mesma rota já usada no catálogo/Giro:
   * /foto?codigo=CODIGO_DO_PRODUTO
   *
   * Mantemos os caminhos de pasta apenas como alternativas finais.
   */
  if(produto){
    const codigoFoto = encodeURIComponent(produto);

    fotos.push(`/foto?codigo=${codigoFoto}`);
    fotos.push(`/fotos/${codigoFoto}.jpg`);
    fotos.push(`/fotos/${codigoFoto}.jpeg`);
    fotos.push(`/fotos/${codigoFoto}.png`);
  }

  return [...new Set(fotos)];
}

function proximaFotoProdutoOTB(img){
  let fotos = [];

  try{
    fotos = JSON.parse(img.dataset.fotos || "[]");
  }catch(e){
    fotos = [];
  }

  const proximoIndice = Number(img.dataset.indice || 0) + 1;

  if(proximoIndice < fotos.length){
    img.dataset.indice = String(proximoIndice);
    img.src = fotos[proximoIndice];
    return;
  }

  /*
   * O CSS da foto usa display:block !important.
   * Por isso, para ocultar definitivamente a imagem quebrada,
   * também precisamos aplicar prioridade important via JavaScript.
   */
  img.style.setProperty("display", "none", "important");
  img.removeAttribute("src");

  const semFoto = img.nextElementSibling;
  if(semFoto){
    semFoto.style.setProperty("display", "flex", "important");
  }
}

function montarFotoProdutoOTB(item = {}){
  const produto = obterCodigoProdutoOTB(item);
  const descricao = String(
    item.descricao ??
    item.produto_descricao ??
    item.nome_produto ??
    "Produto"
  ).trim();

  const fotos = obterFotosProdutoOTB(item);

  if(!fotos.length){
    return `<div class="semFotoProdutoOTB" title="Produto sem foto">📷</div>`;
  }

  const fotosSeguras = fotos.map(escaparHTMLFotoOTB);
  const fotosJson = escaparHTMLFotoOTB(JSON.stringify(fotosSeguras));
  const descricaoSegura = escaparHTMLFotoOTB(descricao);
  const produtoSeguro = escaparHTMLFotoOTB(produto);

  return `
    <img
      class="fotoProdutoOTB"
      src="${fotosSeguras[0]}"
      data-fotos="${fotosJson}"
      data-indice="0"
      alt="${descricaoSegura}"
      title="${produtoSeguro} - ${descricaoSegura}"
      loading="lazy"
      decoding="async"
      onerror="proximaFotoProdutoOTB(this)"
    >
    <div
      class="semFotoProdutoOTB"
      title="Foto não encontrada"
      style="display:none"
    >📷</div>
  `;
}
/* =========================================================
   FILTROS SUPERIORES — NORMALIZAÇÃO ÚNICA
   Datalists exibem "CÓDIGO - DESCRIÇÃO", mas o backend
   precisa receber a descrição da dimensão.
   ========================================================= */

function valorFiltroDimensaoOTB(id){
  const bruto = String(
    document.getElementById(id)?.value || ""
  ).trim();

  if(!bruto){
    return "";
  }

  const pos = bruto.indexOf(" - ");

  if(pos > 0){
    const depois = bruto.slice(pos + 3).trim();

    if(depois){
      return depois.toUpperCase();
    }
  }

  return bruto.toUpperCase();
}

function paramsOTB(){
  const qs = new URLSearchParams();

  const dataIni =
    document.getElementById("dataIniOTB")?.value || "";

  const dataFim =
    document.getElementById("dataFimOTB")?.value || "";

  if(dataIni) qs.set("data_ini",dataIni);
  if(dataFim) qs.set("data_fim",dataFim);

  qs.set("incluir_venda_ano_passado","1");
  qs.set("incluir_venda_ano_retrasado","1");
  qs.set("incluir_compra_ano_passado","1");
  qs.set("incluir_compra_ano_retrasado","1");

  const emp = String(
    document.getElementById("empresasBusca")?.value || ""
  ).trim();

  if(emp){
    qs.set("empresas",emp.toUpperCase());
  }

  [
    ["departamento","departamentoBusca"],
    ["fornecedor","fornecedorBusca"],
    ["grupo","grupoBusca"],
    ["marca","marcaBusca"],
    ["complemento","complementoBusca"]
  ].forEach(([parametro,id])=>{
    const valor = valorFiltroDimensaoOTB(id);

    if(valor){
      qs.set(parametro,valor);
    }
  });

  return qs.toString();
}
async function carregarTudoOTB(){
  const minhaSequencia = ++OTB_SEQ_CARREGAMENTO;

  try{
    /*
     * Primeiro apaga completamente os dados da consulta anterior.
     * Depois mostra o estado de carregamento.
     */
    limparResultadosAntesBuscaOTB();
    setBuscandoOTB(true);

    OTB_EMPRESAS_SEL.clear();
    OTB_VISAO_SEL.clear();
    OTB_COMPARATIVO_SEL.clear();
    OTB_COMPARATIVO2_SEL.clear();
    OTB_PERIODOS_TEMPORAIS_SEL.clear();
    OTB_GRAFICO_ORIGEM_SEL = "";

    /*
     * Em toda nova consulta, as tabelas voltam a ficar fechadas.
     * Isso evita montar centenas de linhas antes dos gráficos.
     */
    OTB_TABELAS_LIBERADAS = false;
    prepararTabelasSobDemandaOTB();

    const parametros = paramsOTB();

    /*
     * PRIMEIRO: dataset principal.
     * Assim que ele chegar, KPIs, gráficos, semáforo e resumos
     * já aparecem. Não esperamos mais a projeção temporal.
     */
    const jDataset = await carregarDatasetCacheOTB(
      parametros
    );

    if(minhaSequencia !== OTB_SEQ_CARREGAMENTO){
      return;
    }

    OTB_DATASET = Array.isArray(jDataset?.dataset) ? jDataset.dataset : [];
    OTB_DATASET_BASE = Array.isArray(OTB_DATASET) ? [...OTB_DATASET] : [];

    if(jDataset?.politica){
      console.log(
        `[OTB-BI] Banco analítico: ${jDataset.politica.dias_recentes} dias recentes; ` +
        `atualização a cada ${jDataset.politica.atualizacao_minutos} min; ` +
        `vendas de hoje ${jDataset.tempo_real_hoje ? "em tempo real" : "fora do período"}; ` +
        `fonte ${jDataset.cache_mensal ? "mensal + bordas diárias" : "diária"}.`
      );
    }

    aplicarFiltrosOTB();
    setBuscandoOTB(false);

    /*
     * SEGUNDO: projeção temporal em segundo plano.
     * Se ela demorar, não bloqueia mais o restante do dashboard.
     */
    carregarTimelineOTBEmSegundoPlano(
      parametros,
      minhaSequencia
    );

  }catch(e){
    if(minhaSequencia !== OTB_SEQ_CARREGAMENTO){
      return;
    }

    setBuscandoOTB(false);

    prepararTabelasSobDemandaOTB(
      "A consulta principal não foi concluída."
    );

    console.error("[OTB-BI] Falha na consulta principal:", e);
    alert(e.message || "Não foi possível concluir a consulta do OTB-BI.");
  }
}

async function carregarTimelineOTBEmSegundoPlano(
  parametros,
  sequencia
){
  const titulo = document.querySelector(
    ".graficoTemporalBox .tituloTemporal h3"
  );

  const tituloOriginal =
    titulo?.dataset?.tituloOriginal ||
    titulo?.textContent ||
    "Projeção Temporal de Estoque";

  if(titulo){
    titulo.dataset.tituloOriginal = tituloOriginal;
    titulo.textContent = tituloOriginal + " — carregando...";
  }

  try{
    const jTimeline = await api(
      "/api/otb-bi/timeline?" + parametros
    );

    if(sequencia !== OTB_SEQ_CARREGAMENTO){
      return;
    }

    OTB_TIMELINE_DATASET = jTimeline.timeline || [];
    renderizarTimelineFiltradaOTB();

    if(titulo){
      titulo.textContent = tituloOriginal;
    }

  }catch(e){
    if(sequencia !== OTB_SEQ_CARREGAMENTO){
      return;
    }

    console.warn("Timeline OTB não carregada:", e.message);

    OTB_TIMELINE_DATASET = [];
    renderizarTimelineFiltradaOTB();

    if(titulo){
      titulo.textContent =
        tituloOriginal + " — indisponível nesta consulta";
    }
  }
}

function prepararTabelasSobDemandaOTB(mensagem = ""){
  const texto = mensagem ||
    "Os gráficos foram priorizados. Clique abaixo para montar a Central Estratégica de Produtos.";

  const el = document.getElementById("tblCentralProdutosOTB");
  if(!el) return;

  el.innerHTML = `
    <div class="otbTabelaSobDemanda">
      <div>${texto}</div>
      <button type="button" onclick="carregarTabelasOTBAgora()">
        Carregar Central de Produtos
      </button>
    </div>
  `;
}

function carregarTabelasOTBAgora(){
  OTB_TABELAS_LIBERADAS = true;
  renderCentralEstrategicaProdutosOTB(filtrarDatasetOTB());
}

function getCampoVisao(){
  return document.getElementById("visao")?.value || "marca";
}

function getCampoComparativoOTB(){
  const seletor = document.getElementById("campoGraficoComparativoVisaoOTB");
  return seletor?.value || OTB_CAMPO_COMPARATIVO || "grupo";
}

function getCampoComparativo2OTB(){
  const seletor = document.getElementById("campoGraficoComparativoVisaoOTB2");
  return seletor?.value || OTB_CAMPO_COMPARATIVO2 || "subgrupo";
}

/*
 * Normaliza os valores usados nos filtros dos gráficos.
 * O PostgreSQL/ERP pode devolver descrições com espaços no final.
 * Sem esta normalização, o clique guarda "MOLECA", mas o dataset
 * pode conter "MOLECA   ", fazendo todas as colunas apagarem e
 * o filtro retornar vazio.
 */
function normalizarValorFiltroOTB(valor, fallback = "SEM INFORMAÇÃO"){
  const texto = String(valor ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return (texto || fallback).toUpperCase();
}

function valorDimensaoOTB(item, campo){
  if(campo === "empresa"){
    return normalizarValorFiltroOTB(
      empresaConsolidadaOTB(item?.empresa)
    );
  }

  if(campo === "preco_venda"){
    const valor = numeroOTB(item?.preco_venda);
    return valor.toLocaleString("pt-BR", {
      style:"currency",
      currency:"BRL",
      minimumFractionDigits:2,
      maximumFractionDigits:2
    }).toUpperCase();
  }
  return normalizarValorFiltroOTB(item?.[campo]);
}

function filtrarDatasetOTB({
  ignorarEmpresa = false,
  ignorarVisao = false,
  ignorarComparativo = false,
  ignorarComparativo2 = false,
  ignorarSemaforo = false
} = {}){
  let dados = Array.isArray(OTB_DATASET) ? [...OTB_DATASET] : [];
  const campoVisao = getCampoVisao();
  const campoComparativo = getCampoComparativoOTB();
  const campoComparativo2 = getCampoComparativo2OTB();

  if(!ignorarEmpresa && OTB_EMPRESAS_SEL.size){
    dados = dados.filter(x =>
      empresaAtendeSelecaoOTB(x.empresa)
    );
  }

  if(!ignorarVisao && OTB_VISAO_SEL.size){
    dados = dados.filter(x =>
      OTB_VISAO_SEL.has(valorDimensaoOTB(x, campoVisao))
    );
  }

  if(!ignorarComparativo && OTB_COMPARATIVO_SEL.size){
    dados = dados.filter(x =>
      OTB_COMPARATIVO_SEL.has(valorDimensaoOTB(x, campoComparativo))
    );
  }

  if(!ignorarComparativo2 && OTB_COMPARATIVO2_SEL.size){
    dados = dados.filter(x =>
      OTB_COMPARATIVO2_SEL.has(valorDimensaoOTB(x, campoComparativo2))
    );
  }

  if(!ignorarSemaforo && OTB_SEMAFORO_ATIVO){
    dados = filtrarDadosPorSemaforoOTB(dados, OTB_SEMAFORO_ATIVO);
  }

  /* A linha escolhida na Central de Produtos filtra todos os
     gráficos, os dois resumos e os KPIs superiores. */
  if(OTB_PRODUTOS_SEL.size){
    dados = dados.filter(item =>
      OTB_PRODUTOS_SEL.has(
        String(item.produto || item.codigo || "").trim()
      )
    );
  }

  /*
   * O seletor suspenso "Ação" também filtra KPIs, gráficos,
   * semáforo e a Central Estratégica.
   */
  const acaoSelecionada = document.getElementById("acao")?.value || "";

  if(acaoSelecionada){
    const produtosPermitidos = new Set(
      agruparProduto(dados)
        .map(classificarProdutoCentralOTB)
        .filter(item => {
          if(acaoSelecionada === "comprar"){
            return numeroOTB(item.compraSugerida) > 0;
          }

          if(acaoSelecionada === "liquidar"){
            return String(item.acaoCentral || "").includes("LIQUIDAR");
          }

          if(acaoSelecionada === "reposicao"){
            return String(item.acaoCentral || "").includes("REPOR ESTOQUE");
          }

          return true;
        })
        .map(item => String(item.produto || ""))
    );

    dados = dados.filter(item =>
      produtosPermitidos.has(String(item.produto || item.codigo || ""))
    );
  }

  return dados;
}


function executarEtapaSeguraOTB(nome, executar){
  try{
    return executar();
  }catch(erro){
    console.error(`[OTB-BI] Erro na etapa: ${nome}`, erro);
    return null;
  }
}

/*
 * Atualização rápida das seleções locais.
 *
 * A consulta ao servidor e os cálculos-base continuam acontecendo somente
 * quando o usuário pesquisa por empresa/período/filtros. Cliques em gráficos
 * e linhas trabalham exclusivamente com OTB_DATASET_BASE já carregado.
 *
 * Os componentes visíveis são atualizados primeiro. A reconstrução mais
 * pesada da Central de Produtos e da projeção temporal é feita depois, em uma
 * única tarefa cancelável. Assim, vários cliques seguidos não criam uma fila
 * de recálculos antigos.
 */
let OTB_SEQ_ATUALIZACAO_LOCAL = 0;
let OTB_TIMER_ATUALIZACAO_PESADA = null;

function agendarAtualizacaoPesadaOTB(dadosFinais, campoVisao, sequencia){
  if(OTB_TIMER_ATUALIZACAO_PESADA){
    clearTimeout(OTB_TIMER_ATUALIZACAO_PESADA);
  }

  const executar = () => {
    if(sequencia !== OTB_SEQ_ATUALIZACAO_LOCAL) return;

    if(OTB_TABELAS_LIBERADAS){
      executarEtapaSeguraOTB("central estratégica", () =>
        renderCentralEstrategicaProdutosOTB(dadosFinais)
      );
    }

    if(sequencia !== OTB_SEQ_ATUALIZACAO_LOCAL) return;
    executarEtapaSeguraOTB("projeção temporal", renderizarTimelineFiltradaOTB);
  };

  /* Dá tempo para cards e gráficos aparecerem antes da montagem das tabelas. */
  if(typeof requestIdleCallback === "function"){
    OTB_TIMER_ATUALIZACAO_PESADA = setTimeout(() => {
      requestIdleCallback(executar, { timeout:250 });
    }, 0);
  }else{
    OTB_TIMER_ATUALIZACAO_PESADA = setTimeout(executar, 0);
  }
}

function aplicarFiltrosOTB(){
  const sequencia = ++OTB_SEQ_ATUALIZACAO_LOCAL;
  const campoVisao = getCampoVisao();
  const campoComparativo = getCampoComparativoOTB();
  const campoComparativo2 = getCampoComparativo2OTB();

  /* Uma única filtragem principal sobre os dados que já estão na memória. */
  const dadosFinais = filtrarDatasetOTB();

  /* Só o gráfico de origem precisa de uma segunda filtragem, ignorando o
     próprio filtro. Os demais reutilizam exatamente o mesmo array final. */
  let dadosGrafEmpresas = dadosFinais;
  let dadosGrafVisao = dadosFinais;
  let dadosGrafComparativo = dadosFinais;
  let dadosGrafComparativo2 = dadosFinais;
  let dadosGrafAnalise = dadosFinais;

  switch(OTB_GRAFICO_ORIGEM_SEL){
    case "empresas":
      dadosGrafEmpresas = filtrarDatasetOTB({ ignorarEmpresa:true });
      break;
    case "visao":
      dadosGrafVisao = filtrarDatasetOTB({ ignorarVisao:true });
      break;
    case "comparativo_visao":
      dadosGrafComparativo = filtrarDatasetOTB({ ignorarComparativo:true });
      break;
    case "comparativo_visao_2":
      dadosGrafComparativo2 = filtrarDatasetOTB({ ignorarComparativo2:true });
      break;
    case "analise":
      dadosGrafAnalise = filtrarDatasetOTB({ ignorarVisao:true });
      break;
  }

  /* Primeiro: informações que o usuário precisa perceber imediatamente. */
  executarEtapaSeguraOTB("cards", () => atualizarCardsOTB(dadosFinais));
  executarEtapaSeguraOTB("semáforo", () => atualizarSemaforoOTB(dadosFinais));
  executarEtapaSeguraOTB("menu de visão", atualizarMenuVisaoAtivo);

  executarEtapaSeguraOTB("gráfico de empresas", () =>
    renderGraficoEmpresas(agruparPor(dadosGrafEmpresas, "empresa"))
  );
  executarEtapaSeguraOTB("gráfico da visão", () =>
    renderGraficoVisao(agruparPor(dadosGrafVisao, campoVisao, 0))
  );
  executarEtapaSeguraOTB("primeiro gráfico comparativo", () =>
    renderGraficoComparativoVisaoOTB(dadosGrafComparativo, campoComparativo)
  );
  executarEtapaSeguraOTB("segundo gráfico comparativo", () =>
    renderGraficoComparativoVisaoOTB2(dadosGrafComparativo2, campoComparativo2)
  );
  executarEtapaSeguraOTB("gráfico de análise", () =>
    renderGraficoAnaliseOTB(dadosGrafAnalise, campoVisao)
  );
  executarEtapaSeguraOTB("resumo consolidado", () =>
    renderResumoConsolidadoVisaoOTB(dadosFinais, campoVisao)
  );

  /* Depois: partes de maior custo. Uma seleção nova cancela a anterior. */
  agendarAtualizacaoPesadaOTB(dadosFinais, campoVisao, sequencia);
}

function agruparPor(lista, campo, limite = 25){
  lista = Array.isArray(lista) ? lista : [];
  const map = new Map();

  for(const x of lista){
    const chave = campo === "empresa"
      ? empresaConsolidadaOTB(x.empresa)
      : valorDimensaoOTB(x, campo);

    if(!map.has(chave)){
      const nomeAgrupamentoEmpresa =
        campo === "empresa"
          ? nomeEmpresaConsolidadaOTB(x)
          : chave;

      map.set(chave, {
        valor: chave,
        nome: nomeAgrupamentoEmpresa,
        empresa: campo === "empresa" ? chave : "",
        compras: 0,
        compras_ano_passado: 0,
        compras_ano_retrasado: 0,

        vendas: 0,
        venda_ano_passado: 0,
        venda_ano_retrasado: 0,

        pedidos: 0,
        estoque: 0,

        /* Custo médio do produto entre as empresas filtradas. */
        custo_ponderado_soma: 0,
        custo_ponderado_qtd: 0,
        custo_simples_soma: 0,
        custo_simples_itens: 0,
        valor_custo: 0,

        preco_venda_soma: 0,
        preco_venda_itens: 0,
        preco_venda: 0
      });
    }

    const a = map.get(chave);

    a.compras += Number(x.compras || 0);
    a.compras_ano_passado += Number(x.compras_ano_passado || 0);
    a.compras_ano_retrasado += Number(x.compras_ano_retrasado || 0);

    a.vendas += Number(x.vendas || 0);
    a.venda_ano_passado += Number(x.venda_ano_passado || 0);
    a.venda_ano_retrasado += Number(x.venda_ano_retrasado || 0);

    a.pedidos += Number(x.pedidos || 0);
    a.estoque += Number(x.estoque || 0);
    if(numeroOTB(x.preco_venda) > 0){
      a.preco_venda_soma += numeroOTB(x.preco_venda);
      a.preco_venda_itens += 1;
      a.preco_venda = a.preco_venda_soma / a.preco_venda_itens;
    }
  }

  const resultado = Array.from(map.values())
    .filter(x =>
      x.compras !== 0 ||
      x.compras_ano_passado !== 0 ||
      x.compras_ano_retrasado !== 0 ||
      x.vendas !== 0 ||
      x.venda_ano_passado !== 0 ||
      x.venda_ano_retrasado !== 0 ||
      x.pedidos !== 0 ||
      x.estoque !== 0
    )
    .sort((a,b) => {
      /*
       * Coloca primeiro quem possui pedido.
       * Depois ordena pelo estoque.
       *
       * Assim nenhuma marca com pedido fica escondida
       * atrás das marcas que possuem apenas estoque.
       */
      const diferencaPedidos =
        Number(b.pedidos || 0) -
        Number(a.pedidos || 0);

      if(diferencaPedidos !== 0){
        return diferencaPedidos;
      }

      return (
        Number(b.estoque || 0) -
        Number(a.estoque || 0)
      );
    });

  /*
   * limite = 0 significa mostrar todos os agrupamentos.
   */
  return limite > 0
    ? resultado.slice(0, limite)
    : resultado;
}

function atualizarCardsOTB(dados){
  dados = Array.isArray(dados) ? dados : [];
  const total = dados.reduce((acc, x) => {
    acc.itens += 1;

    acc.compras += numeroOTB(
      x.compras
    );

    acc.compraAnoPassado += numeroOTB(
      x.compras_ano_passado
    );
    acc.compraAnoRetrasado += numeroOTB(x.compras_ano_retrasado);

    acc.vendas += numeroOTB(
      x.vendas
    );

    acc.vendaAnoPassado += numeroOTB(
      x.venda_ano_passado
    );
    acc.vendaAnoRetrasado += numeroOTB(x.venda_ano_retrasado);

    acc.pedidos += numeroOTB(
      x.pedidos
    );

    acc.estoque += numeroOTB(
      x.estoque
    );
/*
 * Os valores já chegam líquidos do banco:
 *
 * VE soma
 * DV subtrai
 * VC subtrai
 *
 * Não multiplicar quantidade por preço.
 */
acc.valorVendas +=
  numeroOTB(x.valor_vendas);

acc.valorVendaAnoPassado +=
  numeroOTB(x.valor_venda_ano_passado);

acc.valorVendaAnoRetrasado +=
  numeroOTB(x.valor_venda_ano_retrasado);

/* Valores reais devolvidos pelo backend a partir da tabela movimento. */
acc.valorCompras +=
  numeroOTB(x.valor_compras);

acc.valorCompraAnoPassado +=
  numeroOTB(x.valor_compras_ano_passado);
acc.valorCompraAnoRetrasado += numeroOTB(x.valor_compras_ano_retrasado);

acc.valorPedidos +=
  numeroOTB(x.pedidos) *
  numeroOTB(x.valor_custo_pedido);

acc.valorEstoque +=
  numeroOTB(x.estoque) *
  numeroOTB(x.valor_custo);

    return acc;
}, {
    itens:0,

    compras:0,
    compraAnoPassado:0,
    compraAnoRetrasado:0,
    vendas:0,
    vendaAnoPassado:0,
    vendaAnoRetrasado:0,
    pedidos:0,
    estoque:0,

    valorCompras:0,
    valorCompraAnoPassado:0,
    valorCompraAnoRetrasado:0,
    valorVendas:0,
    valorVendaAnoPassado:0,
    valorVendaAnoRetrasado:0,
    valorPedidos:0,
    valorEstoque:0
});
  const janela = mesesEntreDatasOTB();

  const mediaMensal =
    janela > 0
      ? total.vendas / janela
      : 0;

  const cobertura =
    mediaMensal > 0
      ? Math.round(
          (total.estoque / mediaMensal) * 30
        )
      : 0;

  const giro =
    total.estoque > 0
      ? total.vendas / total.estoque
      : 0;

const elVendas =
  document.getElementById("kpiVenda12Qtd") ||
  document.getElementById("kpiVenda12");

const elVendaAnoPassado =
  document.getElementById("kpiVendaAnoPassadoQtd") ||
  document.getElementById("kpiVendaAnoPassado");

const elVendaAnoRetrasado =
  document.getElementById("kpiVendaAnoRetrasadoQtd");

const elCompras =
  document.getElementById("kpiCompraQtd") ||
  document.getElementById("kpiCompra");

const elCompraAnoPassado =
  document.getElementById("kpiCompraAnoPassadoQtd");

const elCompraAnoRetrasado =
  document.getElementById("kpiCompraAnoRetrasadoQtd");

const elPedidos =
  document.getElementById("kpiPedidoQtd") ||
  document.getElementById("kpiPedido");

const elEstoque =
  document.getElementById("kpiEstoqueQtd") ||
  document.getElementById("kpiEstoque");
  const elCobertura =
    document.getElementById("kpiCobertura");

  const elGiro =
    document.getElementById("kpiGiro");

  if(elVendas){
    elVendas.textContent =
      formatarNum(total.vendas);
  }

  if(elVendaAnoPassado){
    elVendaAnoPassado.textContent =
      formatarNum(total.vendaAnoPassado);
  }

  if(elVendaAnoRetrasado){
    elVendaAnoRetrasado.textContent =
      formatarNum(total.vendaAnoRetrasado);
  }

  if(elCompras){
    elCompras.textContent =
      formatarNum(total.compras);
  }

  if(elCompraAnoPassado){
    elCompraAnoPassado.textContent =
      formatarNum(total.compraAnoPassado);
  }

  if(elCompraAnoRetrasado){
    elCompraAnoRetrasado.textContent =
      formatarNum(total.compraAnoRetrasado);
  }

  if(elPedidos){
    elPedidos.textContent =
      formatarNum(total.pedidos);
  }

  if(elEstoque){
    elEstoque.textContent =
      formatarNum(total.estoque);
  }
const elValorVendas =
  document.getElementById("kpiVenda12Valor");

const elValorVendaAnoPassado =
  document.getElementById("kpiVendaAnoPassadoValor");

const elValorVendaAnoRetrasado =
  document.getElementById("kpiVendaAnoRetrasadoValor");

const elValorCompras =
  document.getElementById("kpiCompraValor");

const elValorCompraAnoPassado =
  document.getElementById("kpiCompraAnoPassadoValor");

const elValorCompraAnoRetrasado =
  document.getElementById("kpiCompraAnoRetrasadoValor");

const elValorPedidos =
  document.getElementById("kpiPedidoValor");

const elValorEstoque =
  document.getElementById("kpiEstoqueValor");


if(elValorVendas){
  elValorVendas.textContent =
    formatarMoedaOTB(total.valorVendas);
}

if(elValorVendaAnoPassado){
  elValorVendaAnoPassado.textContent =
    formatarMoedaOTB(total.valorVendaAnoPassado);
}

if(elValorVendaAnoRetrasado){
  elValorVendaAnoRetrasado.textContent =
    formatarMoedaOTB(total.valorVendaAnoRetrasado);
}

if(elValorCompras){
  elValorCompras.textContent =
    formatarMoedaOTB(total.valorCompras);
}

if(elValorCompraAnoPassado){
  elValorCompraAnoPassado.textContent =
    formatarMoedaOTB(total.valorCompraAnoPassado);
}

if(elValorCompraAnoRetrasado){
  elValorCompraAnoRetrasado.textContent =
    formatarMoedaOTB(total.valorCompraAnoRetrasado);
}

if(elValorPedidos){
  elValorPedidos.textContent =
    formatarMoedaOTB(total.valorPedidos);
}

if(elValorEstoque){
  elValorEstoque.textContent =
    formatarMoedaOTB(total.valorEstoque);
}
  if(elCobertura){
    elCobertura.textContent =
      formatarNum(cobertura) + " dias";
  }

  if(elGiro){
    elGiro.textContent =
      numeroOTB(giro).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );
  }

  atualizarCardsPorSeriesOTB();

  const rEstoque =
    document.getElementById("rEstoque");

  const rPedidos =
    document.getElementById("rPedidos");

  const rCompras =
    document.getElementById("rCompras");

  const rVendas =
    document.getElementById("rVendas");

  if(rEstoque){
    rEstoque.textContent =
      formatarNum(total.estoque);
  }

  if(rPedidos){
    rPedidos.textContent =
      formatarNum(total.pedidos);
  }

  if(rCompras){
    rCompras.textContent =
      formatarNum(total.compras);
  }

  if(rVendas){
    rVendas.textContent =
      formatarNum(total.vendas);
  }
}
function renderGraficoEmpresas(dados){
  dados = Array.isArray(dados) ? dados : [];
  const ctx = document.getElementById("grafEmpresas");
  if(!ctx) return;

  prepararOrdenacaoGraficoEmpresasOTB();
  dados = ordenarResumoVisaoOTB(dados, OTB_ORDEM_EMPRESAS);

  ctx.ondblclick = function(evento){
  evento.preventDefault();
  evento.stopPropagation();
  limparFiltrosGraficosOTB();
};

  const labels = dados.map(x => x.nome || x.empresa);

  const cfg = {
    type:"bar",
    data:{
      labels,
      datasets:[
{
  type:"bar",
  label:"Compras",
          hidden: !serieAtivaGeralOTB("Compras"),
  data:dados.map(x => Number(x.compras || 0)),
  order:10,
          backgroundColor:dados.map(x =>
            OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
              ? "rgba(34,197,94,.25)"
              : CORES.compras
          )
        },
{
  type:"bar",
  label:"Compras Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Compras Ano Retrasado"),
  data:dados.map(x => Number(x.compras_ano_retrasado || 0)),
  order:10,
          backgroundColor:dados.map(x =>
            OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
              ? "rgba(34,197,94,.25)"
              : CORES.comprasAnoRetrasado
          )
        },
{
  type:"bar",
  label:"Compras Ano Passado",
          hidden: !serieAtivaGeralOTB("Compras Ano Passado"),
  data:dados.map(x => Number(x.compras_ano_passado || 0)),
  order:10,
          backgroundColor:dados.map(x =>
            OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
              ? "rgba(34,197,94,.25)"
              : CORES.comprasAnoPassado
          )
        },
{
  type:"line",
  label:"Venda Ano Passado",
          hidden: !serieAtivaGeralOTB("Venda Ano Passado"),
  data:dados.map(x => Number(x.venda_ano_passado || 0)),

  borderColor:dados.map(x =>
    OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
      ? "rgba(250,204,21,.25)"
      : CORES.vendaAnoPassado
  ),

  backgroundColor:CORES.vendaAnoPassado,
  pointBackgroundColor:CORES.vendaAnoPassado,
  pointBorderColor:CORES.vendaAnoPassado,

  borderWidth:3,
  borderDash:[7,5],
  pointRadius:4,
  pointHoverRadius:6,
  tension:.25,
  fill:false,
  order:1
},
{
  type:"line",
  label:"Venda Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Venda Ano Retrasado"),
  data:dados.map(x => Number(x.venda_ano_retrasado || 0)),

  borderColor:dados.map(x =>
    OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
      ? "rgba(250,204,21,.25)"
      : CORES.vendaAnoRetrasado
  ),

  backgroundColor:CORES.vendaAnoRetrasado,
  pointBackgroundColor:CORES.vendaAnoRetrasado,
  pointBorderColor:CORES.vendaAnoRetrasado,

  borderWidth:3,
  borderDash:[7,5],
  pointRadius:4,
  pointHoverRadius:6,
  tension:.25,
  fill:false,
  order:1
},
        {
          label:"Vendas",
          hidden: !serieAtivaGeralOTB("Vendas"),
          data:dados.map(x => Number(x.vendas || 0)),
  order:10,
          backgroundColor:dados.map(x =>
            OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
              ? "rgba(168,85,247,.25)"
              : CORES.vendas
          )
        },
        {
          label:"Pedidos",
          hidden: !serieAtivaGeralOTB("Pedidos"),
          data:dados.map(x => Number(x.pedidos || 0)),
  order:10,         
 backgroundColor:dados.map(x =>
            OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
              ? "rgba(249,115,22,.25)"
              : CORES.pedidos
          )
        },
        {
          label:"Estoque",
          hidden: !serieAtivaGeralOTB("Estoque"),
          data:dados.map(x => Number(x.estoque || 0)),
  order:10,  
        backgroundColor:dados.map(x =>
            OTB_EMPRESAS_SEL.size && !empresaAtendeSelecaoOTB(x.empresa)
              ? "rgba(37,99,235,.25)"
              : CORES.estoque
          )
        }
      ]
    },
    plugins:[pluginRotulosLinhaTempoModalOTB()],
    options:{
      responsive:true,
      maintainAspectRatio:false,
 plugins:{
  legend:{
    onClick:cliqueLegendaChartOTB("empresas"),
    labels:{
      color:"#fff",
      usePointStyle:true
    }
  },

  tooltip:{
    mode:"index",
    intersect:false,
    position:"aoLadoOTB",
    caretPadding:14,
    caretSize:7,
    padding:12,
    callbacks:{
      label(context){
        const nome = context.dataset.label || "";
        const valor = Number(context.raw || 0);

        return nome + ": " + formatarNum(valor);
      }
    }
  }
},
interaction:{
  mode:"index",
  intersect:false
},
      scales:{
        x:{ ticks:{ color:"#cbd5e1" }, grid:{ color:"rgba(255,255,255,.08)" } },
        y:{ ticks:{ color:"#cbd5e1" }, grid:{ color:"rgba(255,255,255,.08)" } }
      },
      onClick:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          { intersect:false },
          true
        );

        if(!pontos.length) return;

        const idx = pontos[0].index;
        const emp = dados[idx].empresa || dados[idx].valor;

        alternarSelecaoGrafico(OTB_EMPRESAS_SEL, emp, "empresas");
      },
      onHover:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          { intersect:false },
          true
        );

        ev.native.target.style.cursor = pontos.length ? "pointer" : "default";
      }
    }
  };

  if(grafEmpresas) grafEmpresas.destroy();
  grafEmpresas = new Chart(ctx,cfg);
  aplicarVisibilidadeSeriesOTB(grafEmpresas, "empresas");
  reaplicarFiltroSerieCardOTB();
}

function montarOpcoesOrdenacaoGraficosOTB(){
  return `
    <option value="vendas">Ordenar: Vendas</option>
    <option value="venda_ano_passado">Ordenar: Venda Ano Passado</option>
    <option value="venda_ano_retrasado">Ordenar: Venda Ano Retrasado</option>
    <option value="estoque">Ordenar: Estoque</option>
    <option value="compras">Ordenar: Compras</option>
    <option value="compras_ano_retrasado">Ordenar: Compras Ano Retrasado</option>
    <option value="compras_ano_passado">Ordenar: Compras Ano Passado</option>
    <option value="pedidos">Ordenar: Pedidos</option>
    <option value="nome_asc">Ordenar: Nome (A → Z)</option>
    <option value="nome_desc">Ordenar: Nome (Z → A)</option>
  `;
}

function atualizarOpcoesSeletoresOrdenacaoOTB(){
  [
    "ordenarGraficoVisaoOTB",
    "ordenarGraficoComparativoVisaoOTB",
    "ordenarGraficoComparativoVisaoOTB2"
  ].forEach(id => {
    const seletor = document.getElementById(id);
    if(!seletor) return;

    const valorAtual = seletor.value || "estoque";
    seletor.innerHTML = montarOpcoesOrdenacaoGraficosOTB();
    seletor.value = valorAtual;
  });
}

function prepararOrdenacaoGraficoEmpresasOTB(){
  const canvas = document.getElementById("grafEmpresas");
  if(!canvas) return;

  const painel =
    canvas.closest(".graficoBox, .painelGrafico, .cardGrafico, .boxGrafico") ||
    canvas.parentElement;

  if(!painel) return;

  painel.style.position = "relative";

  let seletor = document.getElementById("ordenarGraficoEmpresasOTB");

  if(!seletor){
    seletor = document.createElement("select");
    seletor.id = "ordenarGraficoEmpresasOTB";
    seletor.className = "ordenarGraficoComplementarOTB";
    seletor.innerHTML = montarOpcoesOrdenacaoGraficosOTB();

    Object.assign(seletor.style, {
      position:"absolute",
      top:"8px",
      right:"12px",
      zIndex:"30",
      width:"220px",
      maxWidth:"calc(100% - 24px)",
      height:"38px",
      padding:"0 34px 0 14px",
      background:"#111827",
      color:"#ffffff",
      border:"1px solid #334155",
      borderRadius:"9px",
      fontSize:"13px",
      fontWeight:"800",
      cursor:"pointer"
    });

    seletor.addEventListener("change", function(){
      OTB_ORDEM_EMPRESAS = this.value || "estoque";
      aplicarFiltrosOTB();
    });

    painel.appendChild(seletor);
  }

  seletor.value = OTB_ORDEM_EMPRESAS;
}

function ordenarDadosVisaoOTB(dados){
  const lista = [...(dados || [])];

  let campo = String(OTB_ORDEM_VISAO || "estoque");
  if(campo === "nome") campo = "nome_asc";

  lista.sort((a, b) => {
if(campo === "nome_asc"){
  return String(a.nome || a.valor || "")
    .localeCompare(
      String(b.nome || b.valor || ""),
      "pt-BR",
      { numeric:true, sensitivity:"base" }
    );
}

if(campo === "nome_desc"){
  return String(b.nome || b.valor || "")
    .localeCompare(
      String(a.nome || a.valor || ""),
      "pt-BR",
      { numeric:true, sensitivity:"base" }
    );
}

    const valorA = numeroOTB(a[campo]);
    const valorB = numeroOTB(b[campo]);

    /*
     * Maior valor primeiro.
     * Em caso de empate, organiza pelo nome.
     */
    if(valorB !== valorA){
      return valorB - valorA;
    }

    return String(a.nome || a.valor || "")
      .localeCompare(
        String(b.nome || b.valor || ""),
        "pt-BR"
      );
  });

  return lista;
}

function prepararAreaRolagemVisaoOTB(canvas, quantidadeItens){
  if(!canvas) return null;

  let rolagem =
    document.getElementById("rolagemGraficoVisaoOTB");

  let areaInterna =
    document.getElementById("areaInternaGraficoVisaoOTB");

  /*
   * Cria automaticamente a estrutura de rolagem,
   * sem precisar alterar o HTML.
   */
  if(!rolagem || !areaInterna){
    const paiOriginal = canvas.parentElement;

    rolagem = document.createElement("div");
    rolagem.id = "rolagemGraficoVisaoOTB";

    areaInterna = document.createElement("div");
    areaInterna.id = "areaInternaGraficoVisaoOTB";

    paiOriginal.insertBefore(rolagem, canvas);

    rolagem.appendChild(areaInterna);
    areaInterna.appendChild(canvas);

    Object.assign(rolagem.style, {
      width: "100%",
      overflowX: "auto",
      overflowY: "hidden",
      paddingBottom: "10px",
      scrollbarWidth: "thin"
    });

    Object.assign(areaInterna.style, {
  position: "relative",
  height: "445px",
  minHeight: "445px"
});

    /*
     * Barra de rolagem visível no Chrome e Edge.
     */
    const estilo = document.createElement("style");

    estilo.textContent = `
      #rolagemGraficoVisaoOTB::-webkit-scrollbar {
        height: 12px;
      }

      #rolagemGraficoVisaoOTB::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, .75);
        border-radius: 10px;
      }

      #rolagemGraficoVisaoOTB::-webkit-scrollbar-thumb {
        background: rgba(59, 130, 246, .85);
        border-radius: 10px;
        border: 2px solid rgba(15, 23, 42, .75);
      }

      #rolagemGraficoVisaoOTB::-webkit-scrollbar-thumb:hover {
        background: rgba(96, 165, 250, 1);
      }

      #ordenarGraficoVisaoOTB {
        background: #111827;
        color: #ffffff;
        border: 1px solid #334155;
        border-radius: 9px;
        padding: 7px 34px 7px 12px;
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
        outline: none;
      }

      #ordenarGraficoVisaoOTB:focus {
        border-color: #3b82f6;
      }
    `;

    document.head.appendChild(estilo);
  }

  /*
   * Reserva espaço suficiente para cada categoria.
   * Assim as colunas não ficam espremidas.
   */
  /*
 * Cada categoria recebe espaço suficiente
 * para as barras e para o nome quebrado.
 */
const larguraPorItem = 92;
const larguraMinima = 760;

  const larguraGrafico = Math.max(
    larguraMinima,
    quantidadeItens * larguraPorItem
  );

  areaInterna.style.width =
    larguraGrafico + "px";

  canvas.style.width = "100%";
  canvas.style.height = "445px";

  return {
    rolagem,
    areaInterna,
    larguraGrafico
  };
}

function prepararOrdenacaoGraficoVisaoOTB(){
  const titulo =
    document.getElementById("tituloGrafico");

  if(!titulo) return;

  const painel = titulo.parentElement;

  if(!painel) return;

  painel.style.position = "relative";
painel.style.paddingTop = "0";

  let seletor =
    document.getElementById("ordenarGraficoVisaoOTB");

  if(!seletor){
    seletor = document.createElement("select");
    seletor.id = "ordenarGraficoVisaoOTB";

seletor.innerHTML = montarOpcoesOrdenacaoGraficosOTB();

    Object.assign(seletor.style, {
  position: "absolute",

  /*
   * Fica na mesma linha do título:
   * Visão: MARCA                         Ordenar: Estoque
   */
  top: "8px",
  right: "16px",
  zIndex: "20",

  width: "220px",
  minWidth: "220px",
  maxWidth: "220px",

  height: "38px",
  padding: "0 34px 0 14px",

  background: "#111827",
  color: "#ffffff",

  border: "1px solid #334155",
  borderRadius: "9px",

  fontSize: "13px",
  fontWeight: "800",

  cursor: "pointer"
});

    seletor.value = OTB_ORDEM_VISAO;

    seletor.addEventListener("change", function(){
      OTB_ORDEM_VISAO = this.value || "estoque";

      /*
       * Redesenha somente os componentes,
       * sem consultar novamente o servidor.
       */
      aplicarFiltrosOTB();
    });

    painel.appendChild(seletor);
  }else{
    seletor.value = OTB_ORDEM_VISAO;
  }
}
function quebrarRotuloVisaoOTB(valor, indice = 0){
  const texto = String(valor || "")
    .replace(/\s+/g, " ")
    .trim();

  if(!texto){
    return [""];
  }

  const maximoPorLinha = 11;
  const maximoLinhas = 4;
  const palavras = texto.split(" ");
  const linhas = [];
  let linhaAtual = "";

  for(let palavra of palavras){
    /*
     * Palavras muito grandes também são repartidas.
     * Isso evita que fornecedor, complemento ou grupo
     * ultrapasse a coluna vizinha.
     */
    while(palavra.length > maximoPorLinha){
      if(linhaAtual){
        linhas.push(linhaAtual);
        linhaAtual = "";
      }

      linhas.push(palavra.slice(0, maximoPorLinha));
      palavra = palavra.slice(maximoPorLinha);
    }

    const tentativa = linhaAtual
      ? linhaAtual + " " + palavra
      : palavra;

    if(tentativa.length <= maximoPorLinha){
      linhaAtual = tentativa;
    }else{
      if(linhaAtual){
        linhas.push(linhaAtual);
      }
      linhaAtual = palavra;
    }
  }

  if(linhaAtual){
    linhas.push(linhaAtual);
  }

  let resultado = linhas.slice(0, maximoLinhas);

  if(linhas.length > maximoLinhas){
    const ultima = resultado[maximoLinhas - 1] || "";
    resultado[maximoLinhas - 1] =
      ultima.length >= maximoPorLinha
        ? ultima.slice(0, maximoPorLinha - 1) + "…"
        : ultima + "…";
  }

  /*
   * Alterna os nomes em duas alturas:
   * MOLECA       BEIRA RIO
   *        VIZZANO       FILA
   *
   * O primeiro item fica na linha normal e o seguinte
   * recebe uma linha vazia antes do texto.
   */
  if(Number(indice) % 2 === 1){
    resultado = ["", ...resultado];
  }

  return resultado;
}

function quebrarRotuloComparativoOTB(valor){
  const texto = String(valor || "")
    .replace(/\s+/g, " ")
    .trim();

  if(!texto) return [""];

  /*
   * Mostra o nome COMPLETO de Grupo/Subgrupo.
   * Não corta com reticências. Quando necessário,
   * quebra palavras grandes e continua nas linhas seguintes.
   */
  const maximoPorLinha = 15;
  const palavras = texto.split(" ");
  const linhas = [];
  let linhaAtual = "";

  for(let palavra of palavras){
    while(palavra.length > maximoPorLinha){
      if(linhaAtual){
        linhas.push(linhaAtual);
        linhaAtual = "";
      }

      linhas.push(palavra.slice(0, maximoPorLinha));
      palavra = palavra.slice(maximoPorLinha);
    }

    const tentativa = linhaAtual
      ? `${linhaAtual} ${palavra}`
      : palavra;

    if(tentativa.length <= maximoPorLinha){
      linhaAtual = tentativa;
    }else{
      if(linhaAtual) linhas.push(linhaAtual);
      linhaAtual = palavra;
    }
  }

  if(linhaAtual) linhas.push(linhaAtual);

  return linhas.length ? linhas : [texto];
}

function renderGraficoVisao(dados){
  dados = Array.isArray(dados) ? dados : [];
  const ctx = document.getElementById("grafVisao");
  if(!ctx) return;

  /*
   * Ordena conforme a opção selecionada
   * no canto superior direito.
   */
  dados = ordenarDadosVisaoOTB(dados);

  /*
   * Aplica o limite escolhido somente depois da ordenação.
   * Assim 10, 20, 30 etc. exibem os primeiros itens
   * conforme a ordenação atualmente selecionada.
   */
  dados = limitarListaGraficoOTB(
    dados,
    OTB_LIMITE_VISAO
  );

  /*
   * Cria seletor e área horizontal rolável.
   */
  prepararOrdenacaoGraficoVisaoOTB();
  prepararAreaRolagemVisaoOTB(
    ctx,
    dados.length
  );

  ctx.ondblclick = function(evento){
    evento.preventDefault();
    evento.stopPropagation();
    limparFiltrosGraficosOTB();
  };

  const campo = getCampoVisao();

  document.getElementById("tituloGrafico").textContent =
    "Visão: " + campo.toUpperCase();

  const labels = dados.map(x =>
    x.nome || x.valor
  );

  const cfg = {
    type:"bar",
    data:{
      labels,
      datasets:[
        {
          label:"Compras",
          hidden: !serieAtivaGeralOTB("Compras"),
          data:dados.map(x => Number(x.compras || 0)),
          backgroundColor:dados.map(x =>
            OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
              ? "rgba(34,197,94,.25)"
              : CORES.compras
          )
        },
{
          label:"Compras Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Compras Ano Retrasado"),
          data:dados.map(x => Number(x.compras_ano_retrasado || 0)),
          backgroundColor:dados.map(x =>
            OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
              ? "rgba(34,197,94,.25)"
              : CORES.comprasAnoRetrasado
          )
        },
{
          label:"Compras Ano Passado",
          hidden: !serieAtivaGeralOTB("Compras Ano Passado"),
          data:dados.map(x => Number(x.compras_ano_passado || 0)),
          backgroundColor:dados.map(x =>
            OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
              ? "rgba(34,197,94,.25)"
              : CORES.comprasAnoPassado
          )
        },
        {
          label:"Vendas",
          hidden: !serieAtivaGeralOTB("Vendas"),
          data:dados.map(x => Number(x.vendas || 0)),
          backgroundColor:dados.map(x =>
            OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
              ? "rgba(168,85,247,.25)"
              : CORES.vendas
          )
        },
{
  type:"line",
  label:"Venda Ano Passado",
          hidden: !serieAtivaGeralOTB("Venda Ano Passado"),
  data:dados.map(x => Number(x.venda_ano_passado || 0)),

  borderColor:dados.map(x =>
    OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
      ? "rgba(250,204,21,.25)"
      : CORES.vendaAnoPassado
  ),

  backgroundColor:CORES.vendaAnoPassado,
  pointBackgroundColor:CORES.vendaAnoPassado,
  pointBorderColor:CORES.vendaAnoPassado,

  borderWidth:3,
  borderDash:[7,5],
  pointRadius:4,
  pointHoverRadius:6,
  tension:.25,
  fill:false,
  order:1
},
{
  type:"line",
  label:"Venda Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Venda Ano Retrasado"),
  data:dados.map(x => Number(x.venda_ano_retrasado || 0)),

  borderColor:dados.map(x =>
    OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
      ? "rgba(250,204,21,.25)"
      : CORES.vendaAnoRetrasado
  ),

  backgroundColor:CORES.vendaAnoRetrasado,
  pointBackgroundColor:CORES.vendaAnoRetrasado,
  pointBorderColor:CORES.vendaAnoRetrasado,

  borderWidth:3,
  borderDash:[7,5],
  pointRadius:4,
  pointHoverRadius:6,
  tension:.25,
  fill:false,
  order:1
},
        {
          label:"Pedidos",
          hidden: !serieAtivaGeralOTB("Pedidos"),
          data:dados.map(x => Number(x.pedidos || 0)),
          backgroundColor:dados.map(x =>
            OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
              ? "rgba(249,115,22,.25)"
              : CORES.pedidos
          )
        },
        {
          label:"Estoque",
          hidden: !serieAtivaGeralOTB("Estoque"),
          data:dados.map(x => Number(x.estoque || 0)),
          backgroundColor:dados.map(x =>
            OTB_VISAO_SEL.size && !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.valor))
              ? "rgba(37,99,235,.25)"
              : CORES.estoque
          )
        }
      ]
    },
options:{
  responsive:true,
  maintainAspectRatio:false,

  /*
   * Reserva a parte direita da primeira linha
   * para o seletor de ordenação.
   *
   * A legenda permanece alinhada à esquerda.
   */
layout:{
  padding:{
    /*
     * Não precisa mais reservar a lateral da legenda,
     * porque o seletor agora está na linha do título.
     */
    top:8,
    right:0,
    bottom:8,
    left:0
  }
},

  /*
   * Mantém largura normal das colunas,
   * mesmo quando existem muitas categorias.
   */
  datasets:{
    bar:{
      categoryPercentage:0.78,
      barPercentage:0.82,
      maxBarThickness:34
    }
  },

plugins:{
legend:{
  position:"top",
  align:"start",
  onClick:cliqueLegendaChartOTB("visao"),

  labels:{
    color:"#fff",
    usePointStyle:true,
    padding:14,
    boxWidth:12,
    boxHeight:12
  }
},

  tooltip:{
    mode:"index",
    intersect:false,
    position:"aoLadoOTB",
    caretPadding:14,
    caretSize:7,
    padding:12,
    callbacks:{
      label(context){
        const nome = context.dataset.label || "";
        const valor = Number(context.raw || 0);

        return nome + ": " + formatarNum(valor);
      }
    }
  }
},
interaction:{
  mode:"index",
  intersect:false
},
scales:{
  x:{
    offset:true,

ticks:{
  color:"#cbd5e1",
  autoSkip:false,

  /*
   * O texto ficará reto e quebrado em linhas.
   */
  maxRotation:0,
  minRotation:0,

  padding:10,

  font:{
    size:11,
    weight:"700",
    lineHeight:1.15
  },

  callback:function(valor, indice){
    const texto = this.getLabelForValue(valor);
    return quebrarRotuloVisaoOTB(texto, indice);
  }
},

    grid:{
      color:"rgba(255,255,255,.08)",
      offset:true
    }
  },

  y:{
    beginAtZero:true,

    ticks:{
      color:"#cbd5e1",
      callback:valor =>
        formatarNum(valor)
    },

    grid:{
      color:"rgba(255,255,255,.08)"
    }
  }
},
      onClick:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          { intersect:false },
          true
        );

        if(!pontos.length) return;

        const idx = pontos[0].index;
        const valor = normalizarValorFiltroOTB(dados[idx].valor);

        alternarSelecaoGrafico(OTB_VISAO_SEL, valor, "visao");
      },
      onHover:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          { intersect:false },
          true
        );

        ev.native.target.style.cursor = pontos.length ? "pointer" : "default";
      }
    }
  };

  if(grafVisao) grafVisao.destroy();
  grafVisao = new Chart(ctx,cfg);
  aplicarVisibilidadeSeriesOTB(grafVisao, "visao");
  reaplicarFiltroSerieCardOTB();
}



function ordenarResumoVisaoOTB(dados, campoOrdenacao){
  const lista = [...(dados || [])];
  let campo = String(campoOrdenacao || "nome_asc");
  if(campo === "nome") campo = "nome_asc";

  lista.sort((a,b) => {
    if(campo === "nome_asc"){
      return String(a.nome || a.valor || "").localeCompare(
        String(b.nome || b.valor || ""), "pt-BR", {numeric:true,sensitivity:"base"}
      );
    }

    if(campo === "nome_desc"){
      return String(b.nome || b.valor || "").localeCompare(
        String(a.nome || a.valor || ""), "pt-BR", {numeric:true,sensitivity:"base"}
      );
    }

    const diferenca = numeroOTB(b[campo]) - numeroOTB(a[campo]);
    if(diferenca !== 0) return diferenca;

    return String(a.nome || a.valor || "").localeCompare(
      String(b.nome || b.valor || ""), "pt-BR", {numeric:true,sensitivity:"base"}
    );
  });

  return lista;
}

function ajustarLarguraGraficoComplementarOTB(idArea, quantidade){
  const area = document.getElementById(idArea);
  if(!area) return;

  /*
   * Evita espaços exagerados entre as categorias.
   * Até 10 colunas cabem na largura disponível; acima disso,
   * a área cresce e a rolagem horizontal continua funcionando.
   */
  const qtd = Math.max(1, Number(quantidade || 0));
  const larguraMinima = area.parentElement?.clientWidth || 980;
  const larguraPorCategoria = 128;
  const larguraCalculada = Math.max(
    larguraMinima,
    qtd * larguraPorCategoria
  );

  area.style.width = `${larguraCalculada}px`;
  area.style.minWidth = "100%";
  area.style.height = "390px";
  area.style.minHeight = "390px";

  const canvas = area.querySelector("canvas");
  if(canvas){
    canvas.style.height = "390px";
    canvas.style.minHeight = "390px";
  }
}

function criarSeletorOrdenacaoComplementarOTB({id, painel, valor, opcoes, aoAlterar}){
  if(!painel) return;
  painel.style.position = "relative";

  let seletor = document.getElementById(id);
  if(!seletor){
    seletor = document.createElement("select");
    seletor.id = id;
    seletor.className = "ordenarGraficoComplementarOTB";
    seletor.innerHTML = (Array.isArray(opcoes) ? opcoes : []).map(x => `<option value="${x.valor}">${x.texto}</option>`).join("");
    painel.appendChild(seletor);
    seletor.addEventListener("change", aoAlterar);
  }
  seletor.value = valor;
}

function alternarSelecaoVisaoPeloGraficoOTB(nome, origem){
  alternarSelecaoGrafico(
    OTB_VISAO_SEL,
    normalizarValorFiltroOTB(nome),
    origem
  );
}

function alternarSelecaoComparativoOTB(nome){
  alternarSelecaoGrafico(
    OTB_COMPARATIVO_SEL,
    normalizarValorFiltroOTB(nome),
    "comparativo_visao"
  );
}

function alternarSelecaoComparativo2OTB(nome){
  alternarSelecaoGrafico(
    OTB_COMPARATIVO2_SEL,
    normalizarValorFiltroOTB(nome),
    "comparativo_visao_2"
  );
}

function pluginRotulosComparativoOTB(){
  return {
    id:"rotulosComparativoOTB",
    afterDatasetsDraw(chart){
      const {ctx, chartArea} = chart;
      ctx.save();
      ctx.font = OTB_MODO_PDF_TEXTO_PRETO ? "500 11px Arial" : "800 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = OTB_MODO_PDF_TEXTO_PRETO ? "#000000" : "#ffffff";
      ctx.shadowColor = OTB_MODO_PDF_TEXTO_PRETO ? "transparent" : "rgba(0,0,0,.85)";
      ctx.shadowBlur = OTB_MODO_PDF_TEXTO_PRETO ? 0 : 4;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if(meta.hidden) return;

        meta.data.forEach((element, index) => {
          const valor = numeroOTB(dataset.data[index]);
          if(!Number.isFinite(valor) || valor === 0) return;

          const pos = element.tooltipPosition();
          const y = Math.max(chartArea.top + 16, pos.y - 8);
          ctx.fillText(formatarNum(valor), pos.x, y);
        });
      });

      ctx.restore();
    }
  };
}

function renderGraficoComparativoVisaoOTB(lista, campo){
  lista = Array.isArray(lista) ? lista : [];
  const ctx = document.getElementById("grafComparativoVisaoOTB");
  if(!ctx) return;

  let dados = agruparPor(lista, campo, 0);
  dados = ordenarResumoVisaoOTB(dados, OTB_ORDEM_COMPARATIVO_VISAO);
  dados = limitarListaGraficoOTB(
    dados,
    OTB_LIMITE_COMPARATIVO1
  );

  const titulo = document.getElementById("tituloGraficoComparativoVisaoOTB");
  if(titulo){
    titulo.textContent =
      "Estoque x Vendas por " + String(campo || "marca").toUpperCase();
  }

  ajustarLarguraGraficoComplementarOTB(
    "areaInternaGraficoComparativoVisaoOTB",
    dados.length
  );

  if(grafComparativoVisaoOTB) grafComparativoVisaoOTB.destroy();

  grafComparativoVisaoOTB = new Chart(ctx, {
    data:{
      labels:dados.map(x => x.nome || x.valor),
      datasets:[
        {
          type:"bar",
          label:"Estoque",
          hidden: !serieAtivaGeralOTB("Estoque"),
          data:dados.map(x => numeroOTB(x.estoque)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(37,99,235,.22)"
              : CORES.estoque
          ),
          borderColor:"#60a5fa",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:48,
          order:3
        },
        {
          type:"bar",
          label:"Compras",
          hidden: !serieAtivaGeralOTB("Compras"),
          data:dados.map(x => numeroOTB(x.compras)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(34,197,94,.22)"
              : CORES.compras
          ),
          borderColor:"#4ade80",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
{
          type:"bar",
          label:"Compras Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Compras Ano Retrasado"),
          data:dados.map(x => numeroOTB(x.compras_ano_retrasado)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(34,197,94,.22)"
              : CORES.comprasAnoRetrasado
          ),
          borderColor:"#4ade80",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
{
          type:"bar",
          label:"Compras Ano Passado",
          hidden: !serieAtivaGeralOTB("Compras Ano Passado"),
          data:dados.map(x => numeroOTB(x.compras_ano_passado)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(34,197,94,.22)"
              : CORES.comprasAnoPassado
          ),
          borderColor:"#4ade80",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
        {
          type:"bar",
          label:"Pedidos",
          hidden: !serieAtivaGeralOTB("Pedidos"),
          data:dados.map(x => numeroOTB(x.pedidos)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(249,115,22,.22)"
              : CORES.pedidos
          ),
          borderColor:"#fb923c",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
        {
          type:"line",
          label:"Vendas",
          hidden: !serieAtivaGeralOTB("Vendas"),
          data:dados.map(x => numeroOTB(x.vendas)),
          borderColor:CORES.vendas,
          backgroundColor:CORES.vendas,
          pointBackgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(168,85,247,.25)"
              : CORES.vendas
          ),
          pointBorderColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(255,255,255,.25)"
              : "#ffffff"
          ),
          pointBorderWidth:1,
          pointRadius:5,
          pointHoverRadius:7,
          borderWidth:3,
          tension:.25,
          fill:false,
          order:1
        },
        {
          type:"line",
          label:"Venda Ano Passado",
          hidden: !serieAtivaGeralOTB("Venda Ano Passado"),
          data:dados.map(x => numeroOTB(x.venda_ano_passado)),
          borderColor:CORES.vendaAnoPassado,
          backgroundColor:CORES.vendaAnoPassado,
          pointBackgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(250,204,21,.25)"
              : CORES.vendaAnoPassado
          ),
          pointBorderColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(255,255,255,.25)"
              : "#ffffff"
          ),
          pointBorderWidth:1,
          pointRadius:5,
          pointHoverRadius:7,
          borderWidth:3,
          borderDash:[8,5],
          tension:.25,
          fill:false,
          order:2
        },
{
          type:"line",
          label:"Venda Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Venda Ano Retrasado"),
          data:dados.map(x => numeroOTB(x.venda_ano_retrasado)),
          borderColor:CORES.vendaAnoRetrasado,
          backgroundColor:CORES.vendaAnoRetrasado,
          pointBackgroundColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(250,204,21,.25)"
              : CORES.vendaAnoRetrasado
          ),
          pointBorderColor:dados.map(x =>
            OTB_COMPARATIVO_SEL.size &&
            !OTB_COMPARATIVO_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(255,255,255,.25)"
              : "#ffffff"
          ),
          pointBorderWidth:1,
          pointRadius:5,
          pointHoverRadius:7,
          borderWidth:3,
          borderDash:[8,5],
          tension:.25,
          fill:false,
          order:2
        }
      ]
    },
    plugins:[pluginRotulosComparativoOTB()],
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      layout:{padding:{top:24,right:8,bottom:24,left:8}},
      plugins:{
        legend:{
          display:true,
          position:"top",
          align:"start",
          onClick:cliqueLegendaChartOTB("comparativo1"),
          labels:{
            color:"#e2e8f0",
            boxWidth:13,
            boxHeight:13,
            padding:12,
            font:{size:12,weight:"600",family:"Arial, Helvetica, sans-serif"},
            usePointStyle:false
          }
        },
        tooltip:{
          mode:"index",
          intersect:false,
          callbacks:{
            label:c => `${c.dataset.label}: ${formatarNum(c.raw)}`
          }
        }
      },
      scales:{
        x:{
          ticks:{
            color:"#cbd5e1",
            font:{
              size:12,
              weight:"700",
              family:"Arial, Helvetica, sans-serif",
              lineHeight:1.2
            },
            autoSkip:false,
            maxRotation:0,
            minRotation:0,
            padding:8,
            callback:function(v){
              return quebrarRotuloComparativoOTB(this.getLabelForValue(v));
            }
          },
          afterFit:function(escala){
            /*
             * Reserva espaço para o nome completo, inclusive quando
             * Grupo/Subgrupo precisar quebrar em várias linhas.
             */
            const maiorQuantidadeLinhas = dados.reduce((maior, item) => {
              const linhas = quebrarRotuloComparativoOTB(
                item.nome || item.valor
              ).length;
              return Math.max(maior, linhas);
            }, 1);

            escala.height = Math.max(
              escala.height,
              34 + (maiorQuantidadeLinhas * 14)
            );
          },
          grid:{color:"rgba(255,255,255,.08)"}
        },
        y:{
          beginAtZero:true,
          ticks:{color:"#cbd5e1",font:{size:12,weight:"600",family:"Arial, Helvetica, sans-serif"},callback:v => formatarNum(v)},
          grid:{color:"rgba(255,255,255,.08)"}
        }
      },
      onClick:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          {intersect:false},
          true
        );
        if(!pontos.length) return;

        const item = dados[pontos[0].index];
        alternarSelecaoComparativoOTB(
          item.valor || item.nome
        );
      },
      onHover:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          {intersect:false},
          true
        );
        ev.native.target.style.cursor = pontos.length ? "pointer" : "default";
      }
    }
  });
  aplicarVisibilidadeSeriesOTB(grafComparativoVisaoOTB, "comparativo1");
  reaplicarFiltroSerieCardOTB();

  ctx.ondblclick = e => {
    e.preventDefault();
    e.stopPropagation();
    limparFiltrosGraficosOTB();
  };
}

function renderGraficoComparativoVisaoOTB2(lista, campo){
  lista = Array.isArray(lista) ? lista : [];
  const ctx = document.getElementById("grafComparativoVisaoOTB2");
  if(!ctx) return;

  let dados = agruparPor(lista, campo, 0);
  dados = ordenarResumoVisaoOTB(dados, OTB_ORDEM_COMPARATIVO_VISAO2);
  dados = limitarListaGraficoOTB(
    dados,
    OTB_LIMITE_COMPARATIVO2
  );

  const titulo = document.getElementById("tituloGraficoComparativoVisaoOTB2");
  if(titulo){
    titulo.textContent =
      "Estoque x Vendas por " + String(campo || "marca").toUpperCase();
  }

  ajustarLarguraGraficoComplementarOTB(
    "areaInternaGraficoComparativoVisaoOTB2",
    dados.length
  );

  if(grafComparativoVisaoOTB2) grafComparativoVisaoOTB2.destroy();

  grafComparativoVisaoOTB2 = new Chart(ctx, {
    data:{
      labels:dados.map(x => x.nome || x.valor),
      datasets:[
        {
          type:"bar",
          label:"Estoque",
          hidden: !serieAtivaGeralOTB("Estoque"),
          data:dados.map(x => numeroOTB(x.estoque)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(37,99,235,.22)"
              : CORES.estoque
          ),
          borderColor:"#60a5fa",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:48,
          order:3
        },
        {
          type:"bar",
          label:"Compras",
          hidden: !serieAtivaGeralOTB("Compras"),
          data:dados.map(x => numeroOTB(x.compras)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(34,197,94,.22)"
              : CORES.compras
          ),
          borderColor:"#4ade80",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
{
          type:"bar",
          label:"Compras Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Compras Ano Retrasado"),
          data:dados.map(x => numeroOTB(x.compras_ano_retrasado)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(34,197,94,.22)"
              : CORES.comprasAnoRetrasado
          ),
          borderColor:"#4ade80",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
{
          type:"bar",
          label:"Compras Ano Passado",
          hidden: !serieAtivaGeralOTB("Compras Ano Passado"),
          data:dados.map(x => numeroOTB(x.compras_ano_passado)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(34,197,94,.22)"
              : CORES.comprasAnoPassado
          ),
          borderColor:"#4ade80",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
        {
          type:"bar",
          label:"Pedidos",
          hidden: !serieAtivaGeralOTB("Pedidos"),
          data:dados.map(x => numeroOTB(x.pedidos)),
          backgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(249,115,22,.22)"
              : CORES.pedidos
          ),
          borderColor:"#fb923c",
          borderWidth:1,
          borderRadius:6,
          maxBarThickness:38,
          order:4
        },
        {
          type:"line",
          label:"Vendas",
          hidden: !serieAtivaGeralOTB("Vendas"),
          data:dados.map(x => numeroOTB(x.vendas)),
          borderColor:CORES.vendas,
          backgroundColor:CORES.vendas,
          pointBackgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(168,85,247,.25)"
              : CORES.vendas
          ),
          pointBorderColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(255,255,255,.25)"
              : "#ffffff"
          ),
          pointBorderWidth:1,
          pointRadius:5,
          pointHoverRadius:7,
          borderWidth:3,
          tension:.25,
          fill:false,
          order:1
        },
        {
          type:"line",
          label:"Venda Ano Passado",
          hidden: !serieAtivaGeralOTB("Venda Ano Passado"),
          data:dados.map(x => numeroOTB(x.venda_ano_passado)),
          borderColor:CORES.vendaAnoPassado,
          backgroundColor:CORES.vendaAnoPassado,
          pointBackgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(250,204,21,.25)"
              : CORES.vendaAnoPassado
          ),
          pointBorderColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(255,255,255,.25)"
              : "#ffffff"
          ),
          pointBorderWidth:1,
          pointRadius:5,
          pointHoverRadius:7,
          borderWidth:3,
          borderDash:[8,5],
          tension:.25,
          fill:false,
          order:2
        },
{
          type:"line",
          label:"Venda Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Venda Ano Retrasado"),
          data:dados.map(x => numeroOTB(x.venda_ano_retrasado)),
          borderColor:CORES.vendaAnoRetrasado,
          backgroundColor:CORES.vendaAnoRetrasado,
          pointBackgroundColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(250,204,21,.25)"
              : CORES.vendaAnoRetrasado
          ),
          pointBorderColor:dados.map(x =>
            OTB_COMPARATIVO2_SEL.size &&
            !OTB_COMPARATIVO2_SEL.has(normalizarValorFiltroOTB(x.valor || x.nome))
              ? "rgba(255,255,255,.25)"
              : "#ffffff"
          ),
          pointBorderWidth:1,
          pointRadius:5,
          pointHoverRadius:7,
          borderWidth:3,
          borderDash:[8,5],
          tension:.25,
          fill:false,
          order:2
        }
      ]
    },
    plugins:[pluginRotulosComparativoOTB()],
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      layout:{padding:{top:24,right:8,bottom:24,left:8}},
      plugins:{
        legend:{
          display:true,
          position:"top",
          align:"start",
          onClick:cliqueLegendaChartOTB("comparativo2"),
          labels:{
            color:"#e2e8f0",
            boxWidth:13,
            boxHeight:13,
            padding:12,
            font:{size:12,weight:"600",family:"Arial, Helvetica, sans-serif"},
            usePointStyle:false
          }
        },
        tooltip:{
          mode:"index",
          intersect:false,
          callbacks:{
            label:c => `${c.dataset.label}: ${formatarNum(c.raw)}`
          }
        }
      },
      scales:{
        x:{
          ticks:{
            color:"#cbd5e1",
            font:{
              size:12,
              weight:"700",
              family:"Arial, Helvetica, sans-serif",
              lineHeight:1.2
            },
            autoSkip:false,
            maxRotation:0,
            minRotation:0,
            padding:8,
            callback:function(v){
              return quebrarRotuloComparativoOTB(this.getLabelForValue(v));
            }
          },
          afterFit:function(escala){
            /*
             * Reserva espaço para o nome completo, inclusive quando
             * Grupo/Subgrupo precisar quebrar em várias linhas.
             */
            const maiorQuantidadeLinhas = dados.reduce((maior, item) => {
              const linhas = quebrarRotuloComparativoOTB(
                item.nome || item.valor
              ).length;
              return Math.max(maior, linhas);
            }, 1);

            escala.height = Math.max(
              escala.height,
              34 + (maiorQuantidadeLinhas * 14)
            );
          },
          grid:{color:"rgba(255,255,255,.08)"}
        },
        y:{
          beginAtZero:true,
          ticks:{color:"#cbd5e1",font:{size:12,weight:"600",family:"Arial, Helvetica, sans-serif"},callback:v => formatarNum(v)},
          grid:{color:"rgba(255,255,255,.08)"}
        }
      },
      onClick:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          {intersect:false},
          true
        );
        if(!pontos.length) return;

        const item = dados[pontos[0].index];
        alternarSelecaoComparativo2OTB(
          item.valor || item.nome
        );
      },
      onHover:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          {intersect:false},
          true
        );
        ev.native.target.style.cursor = pontos.length ? "pointer" : "default";
      }
    }
  });
  aplicarVisibilidadeSeriesOTB(grafComparativoVisaoOTB2, "comparativo2");
  reaplicarFiltroSerieCardOTB();

  ctx.ondblclick = e => {
    e.preventDefault();
    e.stopPropagation();
    limparFiltrosGraficosOTB();
  };
}

function metricaAnaliseSelecionadaOTB(){
  return document.getElementById("metricaAnaliseOTB")?.value || "faturamento";
}

function configuracaoMetricaAnaliseOTB(){
  const configs = {
    faturamento: { titulo:"Faturamento líquido", formato:"moeda", cor:"#22c55e" },
    preco_medio: { titulo:"Preço médio vendido", formato:"moeda", cor:"#38bdf8" },
    crescimento: { titulo:"Crescimento sobre ano passado", formato:"percentual", cor:"#a855f7" },
    giro: { titulo:"Giro do estoque", formato:"decimal", cor:"#f97316" },
    cobertura: { titulo:"Cobertura estimada", formato:"dias", cor:"#facc15" },
    estoque_valor: { titulo:"Capital em estoque", formato:"moeda", cor:"#2563eb" },
    pedidos_valor: { titulo:"Valor em pedidos", formato:"moeda", cor:"#fb7185" },
    margem_bruta: { titulo:"Margem bruta estimada", formato:"moeda", cor:"#10b981" }
  };

  return configs[metricaAnaliseSelecionadaOTB()] || configs.faturamento;
}

function agruparAnaliseOTB(lista, campo){
  const mapa = new Map();

  for(const x of (lista || [])){
    const nome = valorDimensaoOTB(x, campo);
    const atual = mapa.get(nome) || {
      nome, vendas:0, venda_ano_passado:0, valor_vendas:0,
      valor_venda_ano_passado:0, estoque:0, pedidos:0,
      valor_estoque:0, valor_pedidos:0, custo_vendido:0
    };

    const vendas = numeroOTB(x.vendas);
    const custo = numeroOTB(x.valor_custo);
    const pedidos = numeroOTB(x.pedidos);

    atual.vendas += vendas;
    atual.venda_ano_passado += numeroOTB(x.venda_ano_passado);
    atual.valor_vendas += numeroOTB(x.valor_vendas);
    atual.valor_venda_ano_passado += numeroOTB(x.valor_venda_ano_passado);
    atual.estoque += numeroOTB(x.estoque);
    atual.pedidos += pedidos;
    atual.valor_estoque += numeroOTB(x.estoque) * custo;
    atual.valor_pedidos += pedidos * numeroOTB(x.valor_custo_pedido);
    atual.custo_vendido += vendas * custo;
    mapa.set(nome, atual);
  }

  const meses = Math.max(mesesEntreDatasOTB(), 1);
  const metrica = metricaAnaliseSelecionadaOTB();

  return Array.from(mapa.values()).map(x => {
    let valor = 0;

    if(metrica === "faturamento") valor = x.valor_vendas;
    if(metrica === "preco_medio") valor = x.vendas !== 0 ? x.valor_vendas / x.vendas : 0;
    if(metrica === "crescimento") valor = x.venda_ano_passado !== 0
      ? ((x.vendas - x.venda_ano_passado) / Math.abs(x.venda_ano_passado)) * 100
      : (x.vendas > 0 ? 100 : 0);
    if(metrica === "giro") valor = x.estoque !== 0 ? x.vendas / x.estoque : 0;
    if(metrica === "cobertura"){
      const mediaMensal = x.vendas / meses;
      valor = mediaMensal > 0 ? (x.estoque / mediaMensal) * 30 : 0;
    }
    if(metrica === "estoque_valor") valor = x.valor_estoque;
    if(metrica === "pedidos_valor") valor = x.valor_pedidos;
    if(metrica === "margem_bruta") valor = x.valor_vendas - x.custo_vendido;

    return { ...x, valor };
  })
  .filter(x => Number.isFinite(x.valor) && x.valor !== 0)
  .sort((a,b) => b.valor - a.valor);
}

function formatarMetricaAnaliseOTB(valor, formato){
  if(formato === "moeda") return formatarMoedaOTB(valor);
  if(formato === "percentual") return numeroOTB(valor).toLocaleString("pt-BR", {maximumFractionDigits:1}) + "%";
  if(formato === "dias") return numeroOTB(valor).toLocaleString("pt-BR", {maximumFractionDigits:0}) + " dias";
  return numeroOTB(valor).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
}

function corTransparenteOTB(corHex, opacidade = 0.25){
  const hex = String(corHex || "").replace("#", "").trim();

  if(!/^[0-9a-fA-F]{6}$/.test(hex)){
    return corHex;
  }

  const r = parseInt(hex.slice(0,2), 16);
  const g = parseInt(hex.slice(2,4), 16);
  const b = parseInt(hex.slice(4,6), 16);

  return `rgba(${r},${g},${b},${opacidade})`;
}

function pluginRotulosAnaliseOTB(cfgMetrica){
  return {
    id:"rotulosAnaliseOTB",
    afterDatasetsDraw(chart){
      const {ctx, chartArea} = chart;
      const meta = chart.getDatasetMeta(0);

      if(!meta || meta.hidden) return;

      ctx.save();
      ctx.font = OTB_MODO_PDF_TEXTO_PRETO ? "500 11px Arial" : "800 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = OTB_MODO_PDF_TEXTO_PRETO ? "#000000" : "#ffffff";
      ctx.shadowColor = OTB_MODO_PDF_TEXTO_PRETO ? "transparent" : "rgba(0,0,0,.90)";
      ctx.shadowBlur = OTB_MODO_PDF_TEXTO_PRETO ? 0 : 5;

      meta.data.forEach((element, index) => {
        const valor = numeroOTB(chart.data.datasets[0].data[index]);
        if(!Number.isFinite(valor)) return;

        const pos = element.tooltipPosition();
        const deslocamento = valor >= 0 ? -8 : 18;
        const y = Math.max(
          chartArea.top + 16,
          Math.min(chartArea.bottom - 4, pos.y + deslocamento)
        );

        ctx.fillText(
          formatarMetricaAnaliseOTB(valor, cfgMetrica.formato),
          pos.x,
          y
        );
      });

      ctx.restore();
    }
  };
}

function renderGraficoAnaliseOTB(lista, campo){
  lista = Array.isArray(lista) ? lista : [];
  const ctx = document.getElementById("grafAnaliseOTB");
  if(!ctx) return;

  const cfgMetrica = configuracaoMetricaAnaliseOTB();
  const dados = agruparAnaliseOTB(lista, campo);
  const titulo = document.getElementById("tituloGraficoAnaliseOTB");

  if(titulo){
    titulo.textContent = cfgMetrica.titulo + " por " + String(campo || "marca").toUpperCase();
  }

  const larguraPorItem = 118;
  const area = document.getElementById("areaInternaGraficoAnaliseOTB");
  if(area){
    area.style.width = Math.max(760, dados.length * larguraPorItem) + "px";
  }

  const labels = dados.map(x => x.nome);

  if(grafAnaliseOTB) grafAnaliseOTB.destroy();
  grafAnaliseOTB = new Chart(ctx, {
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:cfgMetrica.titulo,
        data:dados.map(x => x.valor),
        backgroundColor:dados.map(x =>
          OTB_VISAO_SEL.size &&
          !OTB_VISAO_SEL.has(normalizarValorFiltroOTB(x.nome))
            ? corTransparenteOTB(cfgMetrica.cor, 0.25)
            : cfgMetrica.cor
        ),
        borderColor:cfgMetrica.cor,
        borderWidth:1,
        borderRadius:5,
        maxBarThickness:38
      }]
    },
    plugins:[pluginRotulosAnaliseOTB(cfgMetrica)],
    options:{
      responsive:true,
      maintainAspectRatio:false,
      layout:{padding:{top:28,bottom:12}},
      plugins:{
        legend:{ labels:{ color:"#fff", usePointStyle:true } },
        tooltip:{
          callbacks:{
            label(context){
              return cfgMetrica.titulo + ": " +
                formatarMetricaAnaliseOTB(context.raw, cfgMetrica.formato);
            },
            afterLabel(context){
              const item = dados[context.dataIndex];
              return [
                "Qtd. vendida: " + formatarNum(item.vendas),
                "Valor vendido: " + formatarMoedaOTB(item.valor_vendas),
                "Estoque: " + formatarNum(item.estoque)
              ];
            }
          }
        }
      },
      scales:{
        x:{
          ticks:{
            color:"#cbd5e1", autoSkip:false, maxRotation:0, minRotation:0,
            callback:function(valor, indice){
              return quebrarRotuloVisaoOTB(this.getLabelForValue(valor), indice);
            }
          },
          grid:{ color:"rgba(255,255,255,.08)" }
        },
        y:{
          beginAtZero:metricaAnaliseSelecionadaOTB() !== "crescimento",
          ticks:{
            color:"#cbd5e1",
            callback:valor => formatarMetricaAnaliseOTB(valor, cfgMetrica.formato)
          },
          grid:{ color:"rgba(255,255,255,.08)" }
        }
      },
      onClick:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          { intersect:false },
          true
        );

        if(!pontos.length) return;

        const item = dados[pontos[0].index];
        alternarSelecaoVisaoPeloGraficoOTB(item.nome, "analise");
      },
      onHover:(ev,items,chart)=>{
        const pontos = chart.getElementsAtEventForMode(
          ev,
          "nearest",
          { intersect:false },
          true
        );

        ev.native.target.style.cursor = pontos.length ? "pointer" : "default";
      }
    }
  });

  ctx.ondblclick = evento => {
    evento.preventDefault();
    evento.stopPropagation();
    limparFiltrosGraficosOTB();
  };
}

function classificarProdutoCentralOTB(x){
  const calculado = calcularCompraSugeridaProdutoOTB(x);
  const vendas = numeroOTB(calculado.vendas);
  const vendaAA = numeroOTB(calculado.venda_ano_passado);
  const estoque = numeroOTB(calculado.estoque);
  const pedidos = numeroOTB(calculado.pedidos);
  const demanda = Math.max(vendas, vendaAA, 0);
  const compraSugerida = numeroOTB(calculado.compraSugerida);
  const coberturaComPedido = numeroOTB(calculado.coberturaComPedido);

  if(compraSugerida > 0){
    return {
      ...calculado,
      prioridadeCentral: calculado.prioridade === "urgente" ? "URGENTE" : "ATENÇÃO",
      classePrioridadeCentral: calculado.prioridade === "urgente" ? "compraUrgente" : "compraAtencao",
      acaoCentral: estoque <= 0 ? "COMPRAR AGORA" : "REPOR ESTOQUE",
      classeAcaoCentral: "acaoComprarOTB"
    };
  }

  if(demanda > 0 && estoque + pedidos > demanda * 2.5){
    return {
      ...calculado,
      prioridadeCentral: "EXCESSO",
      classePrioridadeCentral: "prioridadeExcessoOTB",
      acaoCentral: "LIQUIDAR / PROMOVER",
      classeAcaoCentral: "acaoLiquidarOTB"
    };
  }

  if(vendas > vendaAA && vendas > 0){
    return {
      ...calculado,
      prioridadeCentral: "OPORTUNIDADE",
      classePrioridadeCentral: "prioridadeOportunidadeOTB",
      acaoCentral: coberturaComPedido < 45 ? "ACOMPANHAR REPOSIÇÃO" : "MANTER DESTAQUE",
      classeAcaoCentral: "acaoMonitorarOTB"
    };
  }

  return {
    ...calculado,
    prioridadeCentral: "SAUDÁVEL",
    classePrioridadeCentral: "compraNormal",
    acaoCentral: demanda > 0 ? "MONITORAR" : "AVALIAR CADASTRO",
    classeAcaoCentral: "acaoManterOTB"
  };
}


function giroProdutoCentralOTB(item){
  const estoque = numeroOTB(item?.estoque);
  const vendas = numeroOTB(item?.vendas);
  return estoque !== 0 ? vendas / estoque : 0;
}

/*
 * Giro calculado sobre as compras realizadas no período filtrado.
 * Fórmula: quantidade vendida / quantidade comprada.
 */
function giroComprasProdutoCentralOTB(item){
  const compras = numeroOTB(item?.compras);
  const vendas = numeroOTB(item?.vendas);
  return compras !== 0 ? vendas / compras : 0;
}

function formatarGiroProdutoOTB(valor){
  return numeroOTB(valor).toLocaleString("pt-BR", {
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });
}

function fecharModalProdutoOTB(){
  const modal = document.getElementById("modalProdutoOTB");
  if(!modal) return;
  OTB_MODAL_GRAF_LINHA?.destroy();
  OTB_MODAL_GRAF_LINHA = null;
  OTB_MODAL_LINHA_TEMPO = [];
  OTB_MODAL_ESTOQUE_ATUAL = 0;
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("modalProdutoOTBAberto");
  OTB_MODAL_PRODUTO_ABERTO = false;
}

function chavePeriodoModalOTB(data, granularidade){
  const d = new Date(`${String(data).slice(0,10)}T12:00:00`);
  if(Number.isNaN(d.getTime())) return "";
  if(granularidade === "ano") return String(d.getFullYear());
  if(granularidade === "mes") return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  if(granularidade === "semana"){
    const copia = new Date(d);
    const dia = (copia.getDay()+6)%7;
    copia.setDate(copia.getDate()-dia);
    return copia.toISOString().slice(0,10);
  }
  return d.toISOString().slice(0,10);
}

function rotuloPeriodoModalOTB(chave, granularidade){
  if(granularidade === "ano") return chave;
  if(granularidade === "mes"){
    const [a,m] = chave.split("-");
    return `${m}/${a}`;
  }
  const [a,m,d] = chave.split("-");
  return `${d}/${m}/${a}`;
}

function pluginRotulosLinhaTempoModalOTB(){
  return {
    id:"rotulosLinhaTempoModalOTB",
    afterDatasetsDraw(chart){
      const {ctx, chartArea} = chart;
      if(!chartArea) return;

      const ocupados = [];
      const deslocamentos = [-7, 11, -18, 22, -29, 33, -40, 44];

      ctx.save();
      ctx.font = "600 9px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        if(!chart.isDatasetVisible(datasetIndex)) return;

        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((ponto, indice) => {
          const valor = numeroOTB(dataset.data?.[indice]);
          if(!valor) return;

          const props = ponto.getProps(["x","y"], true);
          if(!Number.isFinite(props.x) || !Number.isFinite(props.y)) return;

          let yTexto = props.y + deslocamentos[datasetIndex % deslocamentos.length];
          const xTexto = props.x;

          for(let tentativa = 0; tentativa < 6; tentativa++){
            const colidiu = ocupados.some(pos =>
              Math.abs(pos.x - xTexto) < 22 && Math.abs(pos.y - yTexto) < 11
            );
            if(!colidiu) break;
            yTexto += tentativa % 2 === 0 ? 11 : -22;
          }

          yTexto = Math.max(chartArea.top + 8, Math.min(chartArea.bottom - 8, yTexto));
          ocupados.push({x:xTexto, y:yTexto});

          ctx.fillStyle = "#ffffff";
          ctx.fillText(formatarNum(valor), xTexto, yTexto);
        });
      });

      ctx.restore();
    }
  };
}

function renderizarGraficosModalProdutoOTB(granularidade="dia"){
  const canvasLinha = document.getElementById("grafHistoricoProdutoOTB");
  if(!canvasLinha) return;

  OTB_MODAL_GRAF_LINHA?.destroy();

  const mapa = new Map();

  OTB_MODAL_LINHA_TEMPO.forEach(item => {
    const chave = chavePeriodoModalOTB(item.data, granularidade);
    if(!chave) return;

    if(!mapa.has(chave)){
      mapa.set(chave,{
        vendas:0,
        vendaAnoPassado:0,
        vendaAnoRetrasado:0,
        compras:0,
        compraAnoPassado:0,
        compraAnoRetrasado:0,
        pedidos:0
      });
    }

    const linha = mapa.get(chave);
    linha.vendas += numeroOTB(item.vendas);
    linha.vendaAnoPassado += numeroOTB(item.vendaAnoPassado);
    linha.vendaAnoRetrasado += numeroOTB(item.vendaAnoRetrasado);
    linha.compras += numeroOTB(item.compras);
    linha.compraAnoPassado += numeroOTB(item.compraAnoPassado);
    linha.compraAnoRetrasado += numeroOTB(item.compraAnoRetrasado);
    linha.pedidos += numeroOTB(item.pedidos);
  });

  const chaves = [...mapa.keys()].sort();
  const labels = chaves.map(chave => rotuloPeriodoModalOTB(chave,granularidade));
  const vendas = chaves.map(chave => mapa.get(chave).vendas);
  const vendaAnoPassado = chaves.map(chave => mapa.get(chave).vendaAnoPassado);
  const vendaAnoRetrasado = chaves.map(chave => mapa.get(chave).vendaAnoRetrasado);
  const compras = chaves.map(chave => mapa.get(chave).compras);
  const compraAnoPassado = chaves.map(chave => mapa.get(chave).compraAnoPassado);
  const compraAnoRetrasado = chaves.map(chave => mapa.get(chave).compraAnoRetrasado);
  const pedidos = chaves.map(chave => mapa.get(chave).pedidos);

  /*
   * Estoque projetado:
   * - o estoque atual é o ponto de referência;
   * - voltando no tempo: estoque anterior = estoque seguinte - compras + vendas;
   * - avançando no tempo: estoque seguinte = estoque anterior + compras + pedidos - vendas.
   */
  const estoqueProjetado = new Array(chaves.length).fill(0);
  const hoje = chavePeriodoModalOTB(new Date().toISOString().slice(0,10), granularidade);
  let indiceHoje = chaves.findIndex(chave => chave >= hoje);
  if(indiceHoje < 0) indiceHoje = Math.max(0, chaves.length - 1);

  if(chaves.length){
    estoqueProjetado[indiceHoje] = numeroOTB(OTB_MODAL_ESTOQUE_ATUAL);

    for(let i = indiceHoje - 1; i >= 0; i--){
      const movimentoSeguinte = mapa.get(chaves[i + 1]);
      estoqueProjetado[i] =
        estoqueProjetado[i + 1]
        - numeroOTB(movimentoSeguinte.compras)
        + numeroOTB(movimentoSeguinte.vendas);
    }

    for(let i = indiceHoje + 1; i < chaves.length; i++){
      const movimentoAtual = mapa.get(chaves[i]);
      estoqueProjetado[i] =
        estoqueProjetado[i - 1]
        + numeroOTB(movimentoAtual.compras)
        + numeroOTB(movimentoAtual.pedidos)
        - numeroOTB(movimentoAtual.vendas);
    }
  }

  OTB_MODAL_GRAF_LINHA = new Chart(canvasLinha,{
    type:"line",
    data:{
      labels,
      datasets:[
        {label:"Estoque projetado",data:estoqueProjetado,borderColor:CORES.estoque,backgroundColor:CORES.estoque,tension:.2,pointRadius:3,pointHoverRadius:5,borderWidth:4},
        {label:"Vendas",data:vendas,borderColor:CORES.vendas,backgroundColor:CORES.vendas,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:3},
        {label:"Vendas ano passado",data:vendaAnoPassado,borderColor:CORES.vendaAnoPassado,backgroundColor:CORES.vendaAnoPassado,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:2,borderDash:[7,4]},
        {label:"Vendas ano retrasado",data:vendaAnoRetrasado,borderColor:CORES.vendaAnoRetrasado,backgroundColor:CORES.vendaAnoRetrasado,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:2,borderDash:[2,4]},
        {label:"Compras",data:compras,borderColor:CORES.compras,backgroundColor:CORES.compras,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:3},
        {label:"Compras ano passado",data:compraAnoPassado,borderColor:CORES.comprasAnoPassado,backgroundColor:CORES.comprasAnoPassado,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:2,borderDash:[7,4]},
        {label:"Compras ano retrasado",data:compraAnoRetrasado,borderColor:CORES.comprasAnoRetrasado,backgroundColor:CORES.comprasAnoRetrasado,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:2,borderDash:[2,4]},
        {label:"Pedidos",data:pedidos,borderColor:CORES.pedidos,backgroundColor:CORES.pedidos,tension:.25,pointRadius:2,pointHoverRadius:4,borderWidth:2,borderDash:[6,4]}
      ]
    },
    plugins:[pluginRotulosLinhaTempoModalOTB()],
    options:{
      responsive:true,
      maintainAspectRatio:false,
      interaction:{mode:"index",intersect:false},
      plugins:{
        legend:{labels:{color:"#fff",usePointStyle:true,padding:12,boxWidth:10,boxHeight:10,font:{size:11,weight:"700"}}},
        tooltip:{callbacks:{label:ctx => `${ctx.dataset.label}: ${formatarNum(ctx.parsed.y)}`}}
      },
      scales:{
        x:{ticks:{color:"#cbd5e1",maxRotation:45,minRotation:0},grid:{color:"rgba(255,255,255,.06)"}},
        y:{beginAtZero:true,grace:"12%",ticks:{color:"#cbd5e1",precision:0},grid:{color:"rgba(255,255,255,.08)"}}
      }
    }
  });
}
function abrirModalProdutoOTB(produto){
  const item = OTB_CENTRAL_ITENS.get(String(produto || ""));
  const modal = document.getElementById("modalProdutoOTB");
  const corpo = document.getElementById("modalProdutoOTBCorpo");
  if(!item || !modal || !corpo) return;

  const dataIni = document.getElementById("dataIniOTB")?.value || "";
  const dataFim = document.getElementById("dataFimOTB")?.value || "";

  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("modalProdutoOTBAberto");
  OTB_MODAL_PRODUTO_ABERTO = true;

  if(!dataIni || !dataFim){
    corpo.innerHTML = `
      <div class="modalProdutoOTBAviso">
        Selecione a Data Inicial e a Data Final antes de abrir os detalhes do produto.
      </div>
    `;
    return;
  }

  if(dataIni > dataFim){
    corpo.innerHTML = `
      <div class="modalProdutoOTBAviso">
        A Data Inicial não pode ser maior que a Data Final.
      </div>
    `;
    return;
  }

  /*
   * IMPORTANTE: o modal usa somente os dados que já vieram na busca
   * principal e na timeline carregada em segundo plano. Nenhuma nova
   * requisição ao backend é feita ao clicar no produto.
   */
  const produtoChave = String(item.produto || "");
  const linhasProduto = (OTB_DATASET_BASE || []).filter(x =>
    String(x.produto || x.codigo || "") === produtoChave
  );

  const porEmpresa = new Map();
  for(const d of linhasProduto){
    const empresa = empresaConsolidadaOTB(d.empresa);

    if(!empresa){
      continue;
    }

    if(!porEmpresa.has(empresa)){
      porEmpresa.set(
        empresa,
        {empresa,vendas:0,compras:0,pedidos:0,estoque:0}
      );
    }

    const r = porEmpresa.get(empresa);
    r.vendas += numeroOTB(d.vendas);
    r.compras += numeroOTB(d.compras);
    r.pedidos += numeroOTB(d.pedidos);
    r.estoque += numeroOTB(d.estoque);
  }

  const empresasResumo = [...porEmpresa.values()].sort((a,b)=>
    a.empresa.localeCompare(b.empresa,"pt-BR",{numeric:true})
  );

  OTB_MODAL_LINHA_TEMPO = [];
  for(const x of (OTB_TIMELINE_DATASET || [])){
    if(String(x.produto || x.codigo || "") !== produtoChave) continue;

    const data = x.data ?? x.data_movimento ?? x.data_compra ??
      x.data_pedido ?? x.data_venda ?? null;
    if(!data) continue;

    OTB_MODAL_LINHA_TEMPO.push({
      data,
      vendas: numeroOTB(x.vendas ?? x.qtd_vendas ?? x.quantidade_venda),
      vendaAnoPassado: numeroOTB(x.venda_ano_passado ?? x.vendas_ano_passado),
      vendaAnoRetrasado: numeroOTB(x.venda_ano_retrasado ?? x.vendas_ano_retrasado),
      compras: numeroOTB(x.compras ?? x.qtd_compras ?? x.quantidade_compra),
      compraAnoPassado: numeroOTB(x.compras_ano_passado ?? x.compra_ano_passado),
      compraAnoRetrasado: numeroOTB(x.compras_ano_retrasado ?? x.compra_ano_retrasado),
      pedidos: numeroOTB(x.pedidos ?? x.qtd_pedidos ?? x.quantidade_pedido)
    });
  }

  /* Se a timeline ainda não estiver disponível, mostra os totais do
     período em um único ponto, sem realizar nova consulta ao banco. */
  if(!OTB_MODAL_LINHA_TEMPO.length){
    OTB_MODAL_LINHA_TEMPO.push({
      data:dataFim,
      vendas:numeroOTB(item.vendas),
      vendaAnoPassado:numeroOTB(item.venda_ano_passado),
      vendaAnoRetrasado:numeroOTB(item.venda_ano_retrasado),
      compras:numeroOTB(item.compras),
      compraAnoPassado:numeroOTB(item.compras_ano_passado),
      compraAnoRetrasado:numeroOTB(item.compras_ano_retrasado),
      pedidos:numeroOTB(item.pedidos)
    });
  }

  const fotos = obterFotosProdutoOTB(item);
  const primeiraFoto = fotos[0] || "";
  const precoNormal = numeroOTB(item.preco_venda ?? item.valor_venda ?? item.preco);
  const promocao = numeroOTB(
    item.valor_promocao ?? item.preco_promocao ?? item.promocao_vigente ?? item.preco_promocional
  );
  const promocaoInicio =
    item.promocao_inicio ?? item.data_inicio_promocao ?? item.promocao_data ?? "";
  const promocaoNome = String(item.promocao_nome || item.nome_promocao || "").trim();
  const custo = numeroOTB(item.custo_liquido ?? item.valor_custo ?? item.custo);
  const valorMedio = numeroOTB(item.vendas) !== 0
    ? numeroOTB(item.valor_vendas) / numeroOTB(item.vendas)
    : 0;

  const total = {
    vendas: numeroOTB(item.vendas),
    compras: numeroOTB(item.compras),
    pedidos: numeroOTB(item.pedidos),
    estoque: numeroOTB(item.estoque)
  };
  OTB_MODAL_ESTOQUE_ATUAL = total.estoque;

  const formatarData = v => {
    const p = String(v || "").slice(0,10).split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(v || "");
  };

  corpo.innerHTML = `
    <div class="modalProdutoOTBTopoNovo">
      <div class="modalProdutoOTBImagemGrande">
        ${primeiraFoto
          ? `<img src="${escaparHTMLFotoOTB(primeiraFoto)}" alt="Produto ${escaparHTMLFotoOTB(item.produto)}" onerror="proximaFotoProdutoOTB(this)" data-fotos='${escaparHTMLFotoOTB(JSON.stringify(fotos))}' data-indice="0"><span>Sem foto</span>`
          : "<span>Sem foto</span>"}
      </div>

      <div class="modalProdutoOTBConteudoTopo">
        <h2 id="modalProdutoOTBTitulo">${escaparHTMLFotoOTB(item.produto)} - ${escaparHTMLFotoOTB(item.descricao || "")}</h2>
        <div class="modalProdutoOTBPeriodo">Período analisado: ${formatarData(dataIni)} a ${formatarData(dataFim)}</div>

        <div class="modalProdutoOTBPrecos">
          <div><span>Complemento</span><b>${escaparHTMLFotoOTB(item.complemento || "SEM COMPLEMENTO")}</b></div>
          <div><span>Valor médio vendido</span><b>${formatarMoedaOTB(valorMedio)}</b></div>
          <div><span>Preço de venda</span><b>${formatarMoedaOTB(precoNormal)}</b></div>
          <div><span>Valor de custo</span><b>${formatarMoedaOTB(custo)}</b></div>
          <div class="promocao"><span>Promoção vigente</span><b>${
            promocao > 0
              ? `${formatarMoedaOTB(promocao)}${promocaoInicio ? ` · a partir de ${formatarData(promocaoInicio)}` : ""}${promocaoNome ? `<small>${escaparHTMLFotoOTB(promocaoNome)}</small>` : ""}`
              : "Sem promoção"
          }</b></div>
        </div>

        <div class="modalProdutoOTBQuantidades">
          <div><span>Vendeu no período</span><b>${formatarNum(total.vendas)}</b></div>
          <div><span>Comprou no período</span><b>${formatarNum(total.compras)}</b></div>
          <div><span>Quantidade em pedido</span><b>${formatarNum(total.pedidos)}</b></div>
          <div id="modalProdutoEstoqueValorOTB" data-valor="${total.estoque}"><span>Estoque atual</span><b>${formatarNum(total.estoque)}</b></div>
        </div>
      </div>
    </div>

    <div class="modalProdutoOTBGraficoBox">
      <div class="modalProdutoOTBGraficoCabecalho">
        <div>
          <h3>Linha do tempo</h3>
          <small>Estoque projetado, pedidos, vendas e compras dos três anos usando os dados já carregados.</small>
        </div>
        <select id="granularidadeHistoricoProdutoOTB" onchange="renderizarGraficosModalProdutoOTB(this.value)">
          <option value="dia">Por dia</option>
          <option value="semana">Por semana</option>
          <option value="mes">Por mês</option>
          <option value="ano">Por ano</option>
        </select>
      </div>
      <div class="modalProdutoOTBCanvas"><canvas id="grafHistoricoProdutoOTB"></canvas></div>
    </div>


    <div class="modalProdutoOTBDetalhes">
      <h3>Resumo por empresa</h3>
      <div class="modalProdutoOTBTabelaScroll">
        <table class="modalProdutoOTBTabelaComDivisorias">
          <thead><tr><th>Empresa</th><th class="num">Vendido</th><th class="num">Comprado</th><th class="num">Pedidos</th><th class="num">Estoque</th></tr></thead>
          <tbody>
            ${empresasResumo.map(r=>`
              <tr>
                <td><b>${escaparHTMLFotoOTB(r.empresa)}</b></td>
                <td class="num">${formatarNum(r.vendas)}</td>
                <td class="num">${formatarNum(r.compras)}</td>
                <td class="num">${formatarNum(r.pedidos)}</td>
                <td class="num">${formatarNum(r.estoque)}</td>
              </tr>
            `).join("") || '<tr><td colspan="5">Sem movimentação no período.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  requestAnimationFrame(()=>renderizarGraficosModalProdutoOTB("dia"));
}

document.addEventListener("keydown", evento => {
  if(evento.key === "Escape" && OTB_MODAL_PRODUTO_ABERTO){
    fecharModalProdutoOTB();
  }
});

document.addEventListener("click", evento => {
  const modal = document.getElementById("modalProdutoOTB");
  if(evento.target === modal) fecharModalProdutoOTB();
});

function renderCentralEstrategicaProdutosOTB(dados){
  dados = Array.isArray(dados) ? dados : [];
  const el = document.getElementById("tblCentralProdutosOTB");
  if(!el) return;

  const ordemPrioridade = {
    "URGENTE": 1,
    "ATENÇÃO": 2,
    "OPORTUNIDADE": 3,
    "EXCESSO": 4,
    "SAUDÁVEL": 5
  };

  const lista = agruparProduto(dados)
    .map(classificarProdutoCentralOTB);

  if(!lista.length){
    el.innerHTML = '<div style="padding:18px;color:#cbd5e1;font-weight:900;">Nenhum produto encontrado para os filtros selecionados.</div>';
    return;
  }

  const campo = OTB_ORDENACAO_TABELA.campo;
  const direcao = OTB_ORDENACAO_TABELA.direcao === "desc" ? -1 : 1;

  const obterValorOrdenacao = item => {
    switch(campo){
      case "foto":
      case "produto":
        return `${item.produto || ""} ${item.descricao || ""}`.trim();
      case "prioridade":
        return ordemPrioridade[item.prioridadeCentral] || 99;
      case "fornecedor":
        return item.fornecedor || "";
      case "marca":
        return item.marca || "";
      case "complemento":
        return item.complemento || "";
      case "giro":
        return giroProdutoCentralOTB(item);
      case "giro_compras":
        return giroComprasProdutoCentralOTB(item);
      case "vendas":
        return numeroOTB(item.vendas);
      case "venda_ano_passado":
        return numeroOTB(item.venda_ano_passado);
      case "compras":
        return numeroOTB(item.compras);
      case "compras_ano_passado":
        return numeroOTB(item.compras_ano_passado);
      case "pedidos":
        return numeroOTB(item.pedidos);
      case "estoque":
        return numeroOTB(item.estoque);
      case "coberturaComPedido":
        return numeroOTB(item.coberturaComPedido);
      case "compraSugerida":
        return numeroOTB(item.compraSugerida);
      default:
        return "";
    }
  };

  lista.sort((a,b) => {
    const va = obterValorOrdenacao(a);
    const vb = obterValorOrdenacao(b);

    if(typeof va === "number" && typeof vb === "number"){
      const diferenca = va - vb;
      if(diferenca !== 0) return diferenca * direcao;
    }else{
      const comparacao = String(va).localeCompare(
        String(vb),
        "pt-BR",
        { numeric:true, sensitivity:"base" }
      );
      if(comparacao !== 0) return comparacao * direcao;
    }

    return String(a.produto || "").localeCompare(
      String(b.produto || ""),
      "pt-BR",
      { numeric:true, sensitivity:"base" }
    );
  });

  OTB_CENTRAL_ITENS = new Map(lista.map(item => [String(item.produto || ""), item]));

  el.innerHTML = `
    <div class="tabelaOTBScroll tabelaCentralProdutosOTB">
      <table>
        <thead>
          <tr>
            ${cabecalhoOrdenavelCentralOTB("foto", "Foto", "colFotoProdutoOTB")}
            ${cabecalhoOrdenavelCentralOTB("prioridade", "Prioridade")}
            ${cabecalhoOrdenavelCentralOTB("fornecedor", "Fornecedor")}
            ${cabecalhoOrdenavelCentralOTB("produto", "Produto")}
            ${cabecalhoOrdenavelCentralOTB("marca", "Marca")}
            ${cabecalhoOrdenavelCentralOTB("complemento", "Complemento")}
            ${cabecalhoOrdenavelCentralOTB("giro", "Giro/Estoque", "num")}
            ${cabecalhoOrdenavelCentralOTB("giro_compras", "Giro/Compras", "num")}
            ${cabecalhoOrdenavelCentralOTB("vendas", "Qtd. vendida", "num")}
            ${cabecalhoOrdenavelCentralOTB("venda_ano_passado", "Qtd. vendida ano passado", "num")}
            ${cabecalhoOrdenavelCentralOTB("compras", "Qtd. comprada", "num")}
            ${cabecalhoOrdenavelCentralOTB("compras_ano_passado", "Qtd. comprada ano passado", "num")}
            ${cabecalhoOrdenavelCentralOTB("pedidos", "Pedidos", "num")}
            ${cabecalhoOrdenavelCentralOTB("estoque", "Estoque", "num")}
            ${cabecalhoOrdenavelCentralOTB("coberturaComPedido", "Cobertura c/ pedido", "num")}
            ${cabecalhoOrdenavelCentralOTB("compraSugerida", "Compra sugerida", "num")}
          </tr>
        </thead>
        <tbody>
          ${lista.slice(0,500).map(x => `
            <tr
              class="linhaProdutoCentralOTB ${OTB_PRODUTOS_SEL.has(String(x.produto || "")) ? "selecionadaOTB" : ""}"
              tabindex="0"
              data-produto="${escaparHTMLFotoOTB(x.produto)}"
              title="Clique uma vez para filtrar. Clique duas vezes para abrir o modal."
              onclick="agendarCliqueProdutoOTB('${escaparHTMLFotoOTB(x.produto)}', event)"
              ondblclick="abrirProdutoPorDuploCliqueOTB('${escaparHTMLFotoOTB(x.produto)}', event)"
              onkeydown="if(event.key==='Enter'){alternarSelecaoProdutoOTB('${escaparHTMLFotoOTB(x.produto)}', event)}"
            >
              <td class="colFotoProdutoOTB">${montarFotoProdutoOTB(x)}</td>
              <td class="${x.classePrioridadeCentral}">${x.prioridadeCentral}</td>
              <td class="colFornecedorCentralOTB">${escaparHTMLFotoOTB(x.fornecedor || "SEM FORNECEDOR")}</td>
              <td class="colProdutoCentralOTB" title="${escaparHTMLFotoOTB(`${x.produto} - ${x.descricao || ""}`)}">
                <b>${escaparHTMLFotoOTB(x.produto)}</b>
                <span>${escaparHTMLFotoOTB(x.descricao || "")}</span>
              </td>
              <td class="colMarcaCentralOTB">${escaparHTMLFotoOTB(x.marca || "SEM MARCA")}</td>
              <td class="colComplementoCentralOTB">${escaparHTMLFotoOTB(x.complemento || "SEM COMPLEMENTO")}</td>
              <td class="num">${formatarGiroProdutoOTB(giroProdutoCentralOTB(x))}</td>
              <td class="num">${formatarGiroProdutoOTB(giroComprasProdutoCentralOTB(x))}</td>
              <td class="num">${formatarNum(x.vendas)}</td>
              <td class="num">${formatarNum(x.venda_ano_passado)}</td>
              <td class="num">${formatarNum(x.compras)}</td>
              <td class="num">${formatarNum(x.compras_ano_passado)}</td>
              <td class="num">${formatarNum(x.pedidos)}</td>
              <td class="num">${formatarNum(x.estoque)}</td>
              <td class="num">${formatarNum(x.coberturaComPedido)} dias</td>
              <td class="num"><b>${formatarNum(x.compraSugerida)}</b></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* Compatibilidade com chamadas antigas. */
function renderTabelaProdutos(lista){
  renderCentralEstrategicaProdutosOTB(lista);
}

function renderTabelaCriticos(lista){
  renderCentralEstrategicaProdutosOTB(lista);
}

function agruparProduto(lista){
  const map = new Map();

  for(const x of lista){
    const chave = String(x.produto || x.codigo || "");

    if(!chave) continue;

    if(!map.has(chave)){
      map.set(chave, {
        produto: chave,
        descricao: x.descricao || "",
        empresa: x.empresa || "",
        marca: x.marca || "SEM MARCA",
        fornecedor: x.fornecedor || "SEM FORNECEDOR",
        departamento: x.departamento || "SEM DEPARTAMENTO",
        grupo: x.grupo || "SEM GRUPO",
        subgrupo: x.subgrupo || "SEM SUBGRUPO",
        linha: x.linha || "SEM LINHA",
        complemento: x.complemento || "SEM COMPLEMENTO",
        valor_promocao: numeroOTB(x.valor_promocao ?? x.preco_promocao ?? x.promocao_vigente ?? x.preco_promocional),
        promocao_inicio: x.promocao_inicio ?? x.data_inicio_promocao ?? x.promocao_data ?? "",
        promocao_nome: x.promocao_nome ?? x.nome_promocao ?? "",
        foto_url: x.foto_url || x.url_foto || x.imagem_url || x.image_url || x.foto || x.imagem || "",
        url_foto: x.url_foto || "",
        imagem_url: x.imagem_url || x.image_url || "",
          compras: 0,
          compras_ano_passado: 0,

        vendas: 0,
        valor_vendas: 0,

        venda_ano_passado: 0,
        valor_venda_ano_passado: 0,

        pedidos: 0,
        estoque: 0,

        /* Custo líquido do cadastro do produto. */
        custo_liquido_ponderado_soma: 0,
        custo_liquido_ponderado_qtd: 0,
        custo_liquido_simples_soma: 0,
        custo_liquido_simples_itens: 0,
        custo_liquido: 0,

        preco_venda_soma: 0,
        preco_venda_itens: 0,
        preco_venda: 0
      });
    }

    const a = map.get(chave);

     a.compras += numeroOTB(x.compras);
    a.compras_ano_passado += numeroOTB(x.compras_ano_passado);

    a.vendas += numeroOTB(x.vendas);
    a.valor_vendas += numeroOTB(x.valor_vendas);

    a.venda_ano_passado +=
      numeroOTB(x.venda_ano_passado);

    a.valor_venda_ano_passado +=
      numeroOTB(x.valor_venda_ano_passado);

    a.pedidos += numeroOTB(x.pedidos);
    a.estoque += numeroOTB(x.estoque);

    /*
     * Usa prioritariamente o custo líquido vindo do cadastro do produto.
     * Mantém valor_custo como compatibilidade com a consulta atual.
     */
    const custoLiquidoLinha = numeroOTB(
      x.custo_liquido ??
      x.valor_custo_liquido ??
      x.custoliquido ??
      x.custo ??
      x.valor_custo
    );
    const qtdPesoCusto = Math.max(numeroOTB(x.estoque), 0);

    if((!a.complemento || a.complemento === "SEM COMPLEMENTO") && x.complemento){
      a.complemento = x.complemento;
    }

    const promocaoLinha = numeroOTB(
      x.valor_promocao ?? x.preco_promocao ?? x.promocao_vigente ?? x.preco_promocional
    );
    if(promocaoLinha > 0){
      a.valor_promocao = promocaoLinha;
      a.promocao_inicio = x.promocao_inicio ?? x.data_inicio_promocao ?? x.promocao_data ?? a.promocao_inicio;
      a.promocao_nome = x.promocao_nome ?? x.nome_promocao ?? a.promocao_nome;
    }

    const precoVendaLinha = numeroOTB(x.preco_venda ?? x.valor_venda ?? x.preco);
    if(precoVendaLinha > 0){
      a.preco_venda_soma += precoVendaLinha;
      a.preco_venda_itens += 1;
    }

    if(custoLiquidoLinha > 0){
      a.custo_liquido_simples_soma += custoLiquidoLinha;
      a.custo_liquido_simples_itens += 1;

      if(qtdPesoCusto > 0){
        a.custo_liquido_ponderado_soma += custoLiquidoLinha * qtdPesoCusto;
        a.custo_liquido_ponderado_qtd += qtdPesoCusto;
      }
    }
  }

  map.forEach(a => {
    a.custo_liquido = a.custo_liquido_ponderado_qtd > 0
      ? a.custo_liquido_ponderado_soma / a.custo_liquido_ponderado_qtd
      : a.custo_liquido_simples_itens > 0
        ? a.custo_liquido_simples_soma / a.custo_liquido_simples_itens
        : 0;

    a.preco_venda = a.preco_venda_itens > 0
      ? a.preco_venda_soma / a.preco_venda_itens
      : numeroOTB(a.preco_venda);

    /* Compatibilidade com pontos antigos que ainda leem valor_custo. */
    a.valor_custo = a.custo_liquido;
  });

  return Array.from(map.values())
    .sort((a,b) => Number(b.vendas || 0) - Number(a.vendas || 0));
}

async function carregarDepartamentosOTB(){
  try{
    const j = await api("/api/otb-bi/departamentos");
    const dl = document.getElementById("dlDepartamentosOTB");

    if(!dl) return;

    dl.innerHTML = (j.departamentos || []).map(x => `
      <option value="${x.codigo} - ${x.descricao}">
    `).join("");

  }catch(e){
    console.warn("Não carregou departamentos:", e.message);
  }
}

function atualizarMenuVisaoAtivo(){
  const visaoAtual = document.getElementById("visao")?.value || "";

  document.querySelectorAll(".listaVisao button").forEach(btn => {
    const txt = btn.textContent.trim().toLowerCase();

    const mapa = {
      "fornecedor": "fornecedor",
      "complemento": "complemento",
      "campanha": "campanha",
      "marca": "marca",
      "departamento": "departamento",
      "grupo": "grupo",
      "subgrupo": "subgrupo",
      "linha": "linha",
      "cor": "cor",
      "numeração": "numeracao"
    };

    btn.classList.toggle("ativo", mapa[txt] === visaoAtual);
  });
}

function limparTodosFiltrosOTB(){
  OTB_EMPRESAS_SEL.clear();
  OTB_VISAO_SEL.clear();
  OTB_COMPARATIVO_SEL.clear();
  OTB_COMPARATIVO2_SEL.clear();
  OTB_PRODUTOS_SEL.clear();
  OTB_PERIODOS_TEMPORAIS_SEL.clear();
  OTB_SEMAFORO_ATIVO = "";
  OTB_GRAFICO_ORIGEM_SEL = "";
  OTB_DATASET = [...OTB_DATASET_BASE];

  const visao = document.getElementById("visao");
  const empresa = document.getElementById("empresasBusca");
  const departamento = document.getElementById("departamentoBusca");
  const fornecedor =
  document.getElementById("fornecedorBusca");

const grupo =
  document.getElementById("grupoBusca");

const marca =
  document.getElementById("marcaBusca");

const complemento =
  document.getElementById("complementoBusca");

const acao =
  document.getElementById("acao");

  if(visao) visao.value = "marca";
  if(empresa) empresa.value = "";
  if(departamento) departamento.value = "";
  if(fornecedor) fornecedor.value = "";
if(grupo) grupo.value = "";
if(marca) marca.value = "";
if(complemento) complemento.value = "";
if(acao) acao.value = "";

  preencherDatasPadraoOTB();

  /*
 * Não apagamos os datasets carregados.
 * Assim a tela não fica toda zerada.
 *
 * Para pesquisar novamente sem filtros,
 * o usuário deve clicar no botão Atualizar.
 */
aplicarFiltrosOTB();
}


let OTB_ORDEM_RESUMO_VISAO = { campo:"compraSugerida", direcao:"desc" };

const OTB_EXPLICACOES_RESUMO = {
  visao:[
    "Visão selecionada",
    "Agrupa os resultados conforme a visão escolhida no OTB-BI: Marca, Grupo, Subgrupo, Fornecedor, Departamento e demais opções."
  ],
  vendas:[
    "Vendas deste ano",
    "Soma a quantidade vendida no período atual informado no filtro. Esta coluna serve para acompanhamento, mas não entra na fórmula principal da sugestão de compra."
  ],
  venda_ano_passado:[
    "Venda do ano passado",
    "Soma a venda do mesmo intervalo de datas, deslocado exatamente um ano para trás."
  ],
  venda_ano_retrasado:[
    "Venda do ano retrasado",
    "Soma a venda do mesmo intervalo de datas, deslocado exatamente dois anos para trás."
  ],
  compras:[
    "Compras deste ano",
    "Soma as entradas de compra realizadas dentro do período atual selecionado."
  ],
  compras_ano_passado:[
    "Compras do ano passado",
    "Soma as compras realizadas no mesmo intervalo de datas do ano anterior."
  ],
  compras_ano_retrasado:[
    "Compras do ano retrasado",
    "Soma as compras realizadas no mesmo intervalo de datas de dois anos atrás."
  ],
  pedidos:[
    "Pedidos abertos",
    "Soma os pedidos ainda previstos para chegar. Eles são adicionados ao estoque atual para formar o estoque projetado disponível."
  ],
  estoque:[
    "Estoque atual",
    "Soma o estoque real atual das empresas filtradas."
  ],
  previsaoPeriodo:[
    "Venda prevista até o fim do período",
    "Média simples entre as vendas do mesmo período do ano passado e do ano retrasado.\n\nFórmula:\n(Venda ano passado + Venda ano retrasado) ÷ 2."
  ],
  mediaMensal:[
    "Venda média mensal prevista",
    "Divide a venda prevista pela duração aproximada do período informado no filtro.\n\nFórmula:\nVenda prevista do período ÷ quantidade de meses do filtro."
  ],
  estoqueProjetado:[
    "Estoque projetado disponível",
    "Representa tudo o que estará disponível para atender as vendas: estoque atual mais os pedidos ainda previstos para chegar.\n\nFórmula:\nEstoque atual + Pedidos."
  ],
  coberturaAtual:[
    "Cobertura atual com pedidos",
    "Informa por quantos meses o estoque atual somado aos pedidos consegue sustentar a venda média mensal prevista.\n\nFórmula:\n(Estoque atual + Pedidos) ÷ Venda média mensal prevista."
  ],
  metaCobertura:[
    "Meta de cobertura final",
    "É a quantidade de meses de estoque que você deseja manter ao final do período planejado. Pode ser 3,1, 4,1, 5,1 meses ou um valor personalizado."
  ],
  estoqueFinalDesejado:[
    "Estoque desejado no final do período",
    "É o estoque que deverá restar depois das vendas previstas até a data final, para iniciar o período seguinte com a cobertura escolhida.\n\nFórmula:\nVenda média mensal prevista × Meta de cobertura."
  ],
  necessidadeTotal:[
    "Necessidade total",
    "Soma tudo o que será necessário: a venda prevista até a data final mais o estoque que deverá restar no final.\n\nFórmula:\nVenda prevista do período + Estoque final desejado."
  ],
  compraSugerida:[
    "Sugestão de compra",
    "Calcula quanto ainda precisa ser comprado para atender as vendas até o fim do período e terminar com a cobertura escolhida.\n\nFórmula:\nVenda prevista do período + Estoque final desejado − Estoque atual − Pedidos.\n\nSe o resultado for negativo, a sugestão será zero."
  ]
};

function abrirExplicacaoCalculoOTB(campo){
  const modal = document.getElementById("modalCalculoOTB");
  const [titulo, texto] =
    OTB_EXPLICACOES_RESUMO[campo] ||
    ["Como foi calculado", "Informação não disponível."];

  const tituloEl = document.getElementById("modalCalculoTituloOTB");
  const conteudoEl = document.getElementById("modalCalculoConteudoOTB");

  if(tituloEl) tituloEl.textContent = titulo;

  if(conteudoEl){
    const partes = String(texto || "").split(/\n{2,}/);
    conteudoEl.innerHTML = partes
      .map(parte => {
        const seguro = escaparHTMLFotoOTB(parte);
        return parte.includes("Fórmula:")
          ? `<code>${seguro}</code>`
          : `<p>${seguro.replace(/\n/g, "<br>")}</p>`;
      })
      .join("");
  }

  modal?.classList.add("aberto");
  modal?.setAttribute("aria-hidden", "false");
}

function fecharExplicacaoCalculoOTB(){
  const modal = document.getElementById("modalCalculoOTB");
  modal?.classList.remove("aberto");
  modal?.setAttribute("aria-hidden", "true");
}

function ordenarTabelaResumoVisaoOTB(campo){
  if(OTB_ORDEM_RESUMO_VISAO.campo === campo){
    OTB_ORDEM_RESUMO_VISAO.direcao =
      OTB_ORDEM_RESUMO_VISAO.direcao === "asc" ? "desc" : "asc";
  }else{
    OTB_ORDEM_RESUMO_VISAO.campo = campo;
    OTB_ORDEM_RESUMO_VISAO.direcao =
      campo === "visao" ? "asc" : "desc";
  }

  renderResumoConsolidadoVisaoOTB(
    filtrarDatasetOTB(),
    getCampoVisao()
  );
}

function cabecalhoResumoOTB(campo, titulo){
  const seta =
    OTB_ORDEM_RESUMO_VISAO.campo === campo
      ? (OTB_ORDEM_RESUMO_VISAO.direcao === "asc" ? "▲" : "▼")
      : "↕";

  return `
    <th onclick="ordenarTabelaResumoVisaoOTB('${campo}')">
      <span>${titulo} ${seta}</span>
      <button
        class="infoCalculoOTB"
        type="button"
        onclick="event.stopPropagation();abrirExplicacaoCalculoOTB('${campo}')"
        title="Explicar cálculo"
      >ⓘ</button>
    </th>
  `;
}


let OTB_ITEM_PLANEJAMENTO_ABERTO = "";

function obterCampoVisaoPlanejamentoOTB(){
  return document.getElementById("visaoPlanejamentoOTB")?.value || getCampoVisao() || "marca";
}

function mesesPlanejamentoOTB(){
  const ini = document.getElementById("dataIniOTB")?.value;
  const fim = document.getElementById("dataFimOTB")?.value;
  if(!ini || !fim) return [];
  const a = new Date(ini + "T00:00:00");
  const b = new Date(fim + "T00:00:00");
  if(Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || a > b) return [];
  const lista = [];
  let d = new Date(a.getFullYear(), a.getMonth(), 1);
  const ultimo = new Date(b.getFullYear(), b.getMonth(), 1);
  while(d <= ultimo){
    lista.push({
      chave:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,
      ano:d.getFullYear(),
      mes:d.getMonth()+1,
      nome:d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})
    });
    d = new Date(d.getFullYear(), d.getMonth()+1, 1);
  }
  return lista;
}

function chaveProdutoPlanejamentoOTB(x){
  return String(x?.produto ?? x?.codigo_produto ?? x?.codigo ?? "").trim();
}

function dataLinhaPlanejamentoOTB(x){
  const bruto = x?.data ?? x?.data_movimento ?? x?.data_venda ?? x?.data_compra ?? x?.data_pedido;
  if(!bruto) return null;
  const d = new Date(String(bruto).slice(0,10) + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function montarDistribuicaoMensalOTB(item, dadosFiltrados, campo){
  const meses = mesesPlanejamentoOTB();
  if(!meses.length) return [];

  const produtos = new Set(
    dadosFiltrados
      .filter(x => valorDimensaoOTB(x,campo) === item.visao)
      .map(chaveProdutoPlanejamentoOTB)
      .filter(Boolean)
  );

  const porMes = new Map(meses.map(m => [m.chave,{
    ...m, vendaAP:0, vendaAR:0, pedidos:0
  }]));

  for(const x of (Array.isArray(OTB_TIMELINE_DATASET) ? OTB_TIMELINE_DATASET : [])){
    const prod = chaveProdutoPlanejamentoOTB(x);
    if(produtos.size && prod && !produtos.has(prod)) continue;
    if(!produtos.size && valorDimensaoOTB(x,campo) !== item.visao) continue;
    const d = dataLinhaPlanejamentoOTB(x);
    if(!d) continue;
    const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const r = porMes.get(chave);
    if(!r) continue;
    r.vendaAP += numeroOTB(x.venda_ano_passado ?? x.vendas_ano_passado);
    r.vendaAR += numeroOTB(x.venda_ano_retrasado ?? x.vendas_ano_retrasado);
    r.pedidos += numeroOTB(x.pedidos ?? x.qtd_pedidos ?? x.quantidade_pedido);
  }

  const arr = [...porMes.values()];
  let somaHistorica = arr.reduce((s,m)=>s + ((m.vendaAP+m.vendaAR)/2),0);

  if(somaHistorica <= 0){
    const pesoIgual = 1 / arr.length;
    arr.forEach(m => {
      m.mediaHistorica = item.previsaoPeriodo * pesoIgual;
      m.peso = pesoIgual;
    });
  }else{
    arr.forEach(m => {
      m.mediaHistorica = (m.vendaAP+m.vendaAR)/2;
      m.peso = m.mediaHistorica/somaHistorica;
    });
  }

  /* Se a timeline não trouxe os totais históricos completos,
     normaliza os pesos para que a soma mensal feche com a previsão da linha. */
  const somaPesos = arr.reduce((s,m)=>s+m.peso,0) || 1;
  arr.forEach(m => {
    m.peso /= somaPesos;
    m.vendaPrevista = item.previsaoPeriodo * m.peso;
  });

  const pedidosTimeline = arr.reduce((s,m)=>s+m.pedidos,0);
  if(pedidosTimeline <= 0 && numeroOTB(item.pedidos) > 0){
    arr[0].pedidos = numeroOTB(item.pedidos);
  }else if(pedidosTimeline > 0 && Math.abs(pedidosTimeline-numeroOTB(item.pedidos)) > 0.5){
    const fator = numeroOTB(item.pedidos)/pedidosTimeline;
    arr.forEach(m => m.pedidos *= fator);
  }

  let estoque = numeroOTB(item.estoque);
  let acumuladoPeso = 0;
  for(const m of arr){
    acumuladoPeso += m.peso;
    const estoqueInicial = estoque;
    const reservaProgressiva = item.estoqueFinalDesejado * acumuladoPeso;
    const compra = Math.max(
      0,
      Math.ceil(m.vendaPrevista + reservaProgressiva - estoqueInicial - m.pedidos)
    );
    const estoqueFinal = estoqueInicial + m.pedidos + compra - m.vendaPrevista;
    m.estoqueInicial = estoqueInicial;
    m.compraSugerida = compra;
    m.estoqueFinal = estoqueFinal;
    m.coberturaFinal = item.mediaMensal > 0 ? estoqueFinal/item.mediaMensal : 0;
    estoque = estoqueFinal;
  }

  /* Ajuste final de arredondamento para a soma mensal fechar exatamente. */
  const totalMensal = arr.reduce((s,m)=>s+m.compraSugerida,0);
  const diferenca = Math.round(item.compraSugerida-totalMensal);
  if(arr.length && diferenca !== 0){
    arr[arr.length-1].compraSugerida = Math.max(0,arr[arr.length-1].compraSugerida+diferenca);
    const ultima = arr[arr.length-1];
    ultima.estoqueFinal += diferenca;
    ultima.coberturaFinal = item.mediaMensal > 0 ? ultima.estoqueFinal/item.mediaMensal : 0;
  }
  return arr;
}

function alternarDetalhePlanejamentoOTB(chaveCodificada){
  const chave = decodeURIComponent(String(chaveCodificada || ""));
  OTB_ITEM_PLANEJAMENTO_ABERTO =
    OTB_ITEM_PLANEJAMENTO_ABERTO === chave ? "" : chave;
  renderResumoConsolidadoVisaoOTB(
    filtrarDatasetOTB(),
    obterCampoVisaoPlanejamentoOTB()
  );
}

function linhaDetalheMensalOTB(item,dadosFiltrados,campo){
  if(OTB_ITEM_PLANEJAMENTO_ABERTO !== item.chaveLinha) return "";
  const meses = montarDistribuicaoMensalOTB(item,dadosFiltrados,campo);
  const linhas = meses.map(m=>`
    <tr>
      <td>${escaparHTMLFotoOTB(m.nome)}</td>
      <td class="num">${formatarNum(Math.round(m.vendaAP))}</td>
      <td class="num">${formatarNum(Math.round(m.vendaAR))}</td>
      <td class="num">${formatarNum(Math.round(m.mediaHistorica))}</td>
      <td class="num">${(m.peso*100).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}%</td>
      <td class="num">${formatarNum(Math.round(m.vendaPrevista))}</td>
      <td class="num">${formatarNum(Math.round(m.estoqueInicial))}</td>
      <td class="num">${formatarNum(Math.round(m.pedidos))}</td>
      <td class="num compraPositivaOTB">${formatarNum(m.compraSugerida)}</td>
      <td class="num">${formatarNum(Math.round(m.estoqueFinal))}</td>
      <td class="num">${m.coberturaFinal.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})} meses</td>
    </tr>`).join("");
  return `
    <tr class="linhaDetalhePlanejamentoOTB">
      <td colspan="17">
        <div class="detalhePlanejamentoMensalOTB">
          <div class="tituloDetalhePlanejamentoOTB">
            Distribuição mensal — ${escaparHTMLFotoOTB(item.visao)}
            <small>Variação calculada pela média dos mesmos meses do ano passado e do ano retrasado.</small>
          </div>
          <div class="tabelaDetalheMensalWrapOTB">
            <table>
              <thead><tr>
                <th>Mês</th><th>Venda AP</th><th>Venda AR</th><th>Média histórica</th>
                <th>Peso do mês</th><th>Venda prevista</th><th>Estoque inicial</th>
                <th>Pedidos</th><th>Comprar</th><th>Estoque final</th><th>Cobertura final</th>
              </tr></thead>
              <tbody>${linhas}</tbody>
              <tfoot><tr>
                <td>TOTAL</td>
                <td>${formatarNum(Math.round(meses.reduce((s,m)=>s+m.vendaAP,0)))}</td>
                <td>${formatarNum(Math.round(meses.reduce((s,m)=>s+m.vendaAR,0)))}</td>
                <td>${formatarNum(Math.round(meses.reduce((s,m)=>s+m.mediaHistorica,0)))}</td>
                <td>100%</td>
                <td>${formatarNum(Math.round(meses.reduce((s,m)=>s+m.vendaPrevista,0)))}</td>
                <td>—</td>
                <td>${formatarNum(Math.round(meses.reduce((s,m)=>s+m.pedidos,0)))}</td>
                <td>${formatarNum(meses.reduce((s,m)=>s+m.compraSugerida,0))}</td>
                <td>${formatarNum(Math.round(meses.at(-1)?.estoqueFinal||0))}</td>
                <td>${(meses.at(-1)?.coberturaFinal||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})} meses</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      </td>
    </tr>`;
}

function renderResumoConsolidadoVisaoOTB(dados, campo){
  dados = Array.isArray(dados) ? dados : [];
  campo = obterCampoVisaoPlanejamentoOTB();

  const corpo = document.getElementById("corpoResumoVisaoOTB");
  const cab = document.getElementById("cabecalhoResumoVisaoOTB");
  const rodape = document.getElementById("rodapeResumoVisaoOTB");
  if(!corpo || !cab || !rodape) return;

  const nomesVisao = {
    fornecedor:"Fornecedor", complemento:"Complemento", campanha:"Campanha",
    marca:"Marca", departamento:"Departamento", grupo:"Grupo", subgrupo:"Subgrupo",
    linha:"Linha", cor:"Cor", numeracao:"Numeração", preco_venda:"Preço de Venda",
    empresa:"Empresa"
  };
  const nomeCampo = nomesVisao[campo] || "Visão";
  const titulo = document.getElementById("tituloTabelaResumoVisaoOTB");
  if(titulo) titulo.textContent = `Planejamento de compras por ${nomeCampo}`;

  cab.innerHTML = [
    cabecalhoResumoOTB("visao", nomeCampo),
    cabecalhoResumoOTB("vendas", "Vendas deste ano"),
    cabecalhoResumoOTB("venda_ano_passado", "Venda ano passado"),
    cabecalhoResumoOTB("venda_ano_retrasado", "Venda ano retrasado"),
    cabecalhoResumoOTB("compras", "Compras deste ano"),
    cabecalhoResumoOTB("compras_ano_passado", "Compra ano passado"),
    cabecalhoResumoOTB("compras_ano_retrasado", "Compra ano retrasado"),
    cabecalhoResumoOTB("pedidos", "Pedidos"),
    cabecalhoResumoOTB("estoque", "Estoque atual"),
    cabecalhoResumoOTB("previsaoPeriodo", "Venda prevista"),
    cabecalhoResumoOTB("mediaMensal", "Média mensal"),
    cabecalhoResumoOTB("estoqueProjetado", "Estoque + pedidos"),
    cabecalhoResumoOTB("coberturaAtual", "Cobertura atual"),
    cabecalhoResumoOTB("metaCobertura", "Meta"),
    cabecalhoResumoOTB("estoqueFinalDesejado", "Estoque final desejado"),
    cabecalhoResumoOTB("necessidadeTotal", "Necessidade total"),
    cabecalhoResumoOTB("compraSugerida", "Comprar")
  ].join("");

  const meses = Math.max(0.1, mesesEntreDatasOTB());
  const meta = obterMetaCoberturaMesesOTB();
  let linhas = agruparPor(dados,campo,0).map(x=>{
    const previsaoPeriodo=(numeroOTB(x.venda_ano_passado)+numeroOTB(x.venda_ano_retrasado))/2;
    const mediaMensal=previsaoPeriodo>0?previsaoPeriodo/meses:0;
    const estoque=numeroOTB(x.estoque), pedidos=numeroOTB(x.pedidos);
    const estoqueProjetado=estoque+pedidos;
    const coberturaAtual=mediaMensal>0?estoqueProjetado/mediaMensal:0;
    const estoqueFinalDesejado=mediaMensal*meta;
    const necessidadeTotal=previsaoPeriodo+estoqueFinalDesejado;
    const compraSugerida=Math.max(0,Math.ceil(necessidadeTotal-estoqueProjetado));
    const visao=x.nome||x.valor||"SEM INFORMAÇÃO";
    return {...x,visao,previsaoPeriodo,mediaMensal,estoqueProjetado,coberturaAtual,
      metaCobertura:meta,estoqueFinalDesejado,necessidadeTotal,compraSugerida,
      chaveLinha:`${campo}::${visao}`};
  });

  const {campo:ord,direcao}=OTB_ORDEM_RESUMO_VISAO;
  linhas.sort((a,b)=>{
    const av=ord==="visao"?String(a.visao):numeroOTB(a[ord]);
    const bv=ord==="visao"?String(b.visao):numeroOTB(b[ord]);
    const r=typeof av==="string"?av.localeCompare(bv,"pt-BR"):av-bv;
    return direcao==="asc"?r:-r;
  });

  if(!linhas.length){
    corpo.innerHTML='<tr><td colspan="17">Nenhum dado encontrado para os filtros informados.</td></tr>';
    rodape.innerHTML=""; return;
  }
  const dec=v=>numeroOTB(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
  corpo.innerHTML=linhas.map(x=>`
    <tr class="linhaPlanejamentoOTB" onclick="alternarDetalhePlanejamentoOTB('${encodeURIComponent(x.chaveLinha)}')">
      <td class="celulaNomePlanejamentoOTB"><span class="setaDetalheOTB">${OTB_ITEM_PLANEJAMENTO_ABERTO===x.chaveLinha?"▼":"▶"}</span><span class="nomePlanejamentoOTB">${escaparHTMLFotoOTB(x.visao)}</span></td>
      <td>${formatarNum(x.vendas)}</td><td>${formatarNum(x.venda_ano_passado)}</td>
      <td>${formatarNum(x.venda_ano_retrasado)}</td><td>${formatarNum(x.compras)}</td>
      <td>${formatarNum(x.compras_ano_passado)}</td><td>${formatarNum(x.compras_ano_retrasado)}</td>
      <td>${formatarNum(x.pedidos)}</td><td>${formatarNum(x.estoque)}</td>
      <td>${formatarNum(Math.round(x.previsaoPeriodo))}</td><td>${formatarNum(Math.round(x.mediaMensal))}</td>
      <td>${formatarNum(x.estoqueProjetado)}</td><td>${dec(x.coberturaAtual)} meses</td>
      <td>${dec(x.metaCobertura)} meses</td><td>${formatarNum(Math.ceil(x.estoqueFinalDesejado))}</td>
      <td>${formatarNum(Math.ceil(x.necessidadeTotal))}</td>
      <td class="${x.compraSugerida>0?"compraPositivaOTB":"compraZeroOTB"}">${formatarNum(x.compraSugerida)}</td>
    </tr>
    ${linhaDetalheMensalOTB(x,dados,campo)}
  `).join("");

  const soma=c=>linhas.reduce((t,i)=>t+numeroOTB(i[c]),0);
  const mediaTotal=soma("mediaMensal"), estProj=soma("estoqueProjetado");
  rodape.innerHTML=`<tr><td>TOTAL</td><td>${formatarNum(soma("vendas"))}</td>
    <td>${formatarNum(soma("venda_ano_passado"))}</td><td>${formatarNum(soma("venda_ano_retrasado"))}</td>
    <td>${formatarNum(soma("compras"))}</td><td>${formatarNum(soma("compras_ano_passado"))}</td>
    <td>${formatarNum(soma("compras_ano_retrasado"))}</td><td>${formatarNum(soma("pedidos"))}</td>
    <td>${formatarNum(soma("estoque"))}</td><td>${formatarNum(Math.round(soma("previsaoPeriodo")))}</td>
    <td>${formatarNum(Math.round(mediaTotal))}</td><td>${formatarNum(estProj)}</td>
    <td>${dec(mediaTotal>0?estProj/mediaTotal:0)} meses</td><td>${dec(meta)} meses</td>
    <td>${formatarNum(Math.ceil(soma("estoqueFinalDesejado")))}</td>
    <td>${formatarNum(Math.ceil(soma("necessidadeTotal")))}</td><td>${formatarNum(soma("compraSugerida"))}</td></tr>`;
}


function setBuscandoOTB(ativo){
  ["tblCentralProdutosOTB"].forEach(id => {
    const el = document.getElementById(id);

    if(el && ativo){
      el.innerHTML = "<b>Buscando...</b>";
    }
  });

  /*
   * Mostra carregamento apenas nas quantidades principais.
   * Não interfere nos valores em R$, cobertura, giro
   * nem nos cartões de resumo inferiores.
   */
  if(ativo){
    [
      "kpiVenda12Qtd",
      "kpiVendaAnoPassadoQtd",
      "kpiVendaAnoRetrasadoQtd",
      "kpiCompraQtd",
      "kpiCompraAnoPassadoQtd",
      "kpiCompraAnoRetrasadoQtd",
      "kpiPedidoQtd",
      "kpiEstoqueQtd"
    ].forEach(id => {
      const el = document.getElementById(id);

      if(el){
        el.textContent = "...";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  /*
   * A consolidação precisa estar carregada antes do primeiro
   * agrupamento por empresa.
   */
  await carregarConsolidacaoGlobalEmpresasOTB();

  iniciarSeletorSeriesGeraisOTB();
  atualizarOpcoesSeletoresOrdenacaoOTB();
  prepararOrdenacaoGraficoEmpresasOTB();
  const limiteVisao = document.getElementById("limiteGraficoVisaoOTB");
  const limiteComparativo1 = document.getElementById("limiteGraficoComparativoVisaoOTB");
  const limiteComparativo2 = document.getElementById("limiteGraficoComparativoVisaoOTB2");

  if(limiteVisao){
    limiteVisao.value = String(OTB_LIMITE_VISAO);
    limiteVisao.addEventListener("change", function(){
      OTB_LIMITE_VISAO = Number(this.value || 0);
      aplicarFiltrosOTB();
    });
  }

  if(limiteComparativo1){
    limiteComparativo1.value = String(OTB_LIMITE_COMPARATIVO1);
    limiteComparativo1.addEventListener("change", function(){
      OTB_LIMITE_COMPARATIVO1 = Number(this.value || 0);
      aplicarFiltrosOTB();
    });
  }

  if(limiteComparativo2){
    limiteComparativo2.value = String(OTB_LIMITE_COMPARATIVO2);
    limiteComparativo2.addEventListener("change", function(){
      OTB_LIMITE_COMPARATIVO2 = Number(this.value || 0);
      aplicarFiltrosOTB();
    });
  }

document
  .getElementById("coberturaAlvoOTB")
  ?.addEventListener("change", function(){
    const personalizado=document.getElementById("coberturaPersonalizadaOTB");
    if(personalizado) personalizado.hidden=this.value!=="personalizada";
    aplicarFiltrosOTB();
  });

document.getElementById("coberturaPersonalizadaOTB")?.addEventListener("input", aplicarFiltrosOTB);

  const visaoPlanejamento = document.getElementById("visaoPlanejamentoOTB");
  if(visaoPlanejamento){
    visaoPlanejamento.addEventListener("change", function(){
      OTB_ITEM_PLANEJAMENTO_ABERTO = "";
      renderResumoConsolidadoVisaoOTB(
        filtrarDatasetOTB(),
        obterCampoVisaoPlanejamentoOTB()
      );
    });
  }

  document
    .getElementById("metricaAnaliseOTB")
    ?.addEventListener("change", aplicarFiltrosOTB); 

  document
    .getElementById("campoGraficoComparativoVisaoOTB")
    ?.addEventListener("change", function(){
      OTB_CAMPO_COMPARATIVO = this.value || "grupo";
      OTB_COMPARATIVO_SEL.clear();
      if(OTB_GRAFICO_ORIGEM_SEL === "comparativo_visao"){
        OTB_GRAFICO_ORIGEM_SEL = "";
      }
      aplicarFiltrosOTB();
    });

  document
    .getElementById("ordenarGraficoComparativoVisaoOTB")
    ?.addEventListener("change", function(){
      OTB_ORDEM_COMPARATIVO_VISAO = this.value || "estoque";
      aplicarFiltrosOTB();
    });

  document
    .getElementById("campoGraficoComparativoVisaoOTB2")
    ?.addEventListener("change", function(){
      OTB_CAMPO_COMPARATIVO2 = this.value || "subgrupo";
      OTB_COMPARATIVO2_SEL.clear();
      if(OTB_GRAFICO_ORIGEM_SEL === "comparativo_visao_2"){
        OTB_GRAFICO_ORIGEM_SEL = "";
      }
      aplicarFiltrosOTB();
    });

  document
    .getElementById("ordenarGraficoComparativoVisaoOTB2")
    ?.addEventListener("change", function(){
      OTB_ORDEM_COMPARATIVO_VISAO2 = this.value || "estoque";
      aplicarFiltrosOTB();
    });
 document.getElementById("visao")?.addEventListener("change", () => {
    OTB_VISAO_SEL.clear();
    aplicarFiltrosOTB();
  });

  preencherDatasPadraoOTB();


  document.getElementById("acao")?.addEventListener("change", aplicarFiltrosOTB);
document.getElementById("granularidadeTempo")?.addEventListener("change", function(){
  renderizarTimelineFiltradaOTB();
});

  await carregarDepartamentosOTB();
await carregarFornecedoresOTB();

  /*
 * Selecionar ou digitar departamento não consulta automaticamente.
 * O usuário deve clicar em Atualizar.
 */
  document.getElementById("departamentoBusca")?.addEventListener("blur", function(){});
  document.getElementById("departamentoBusca")?.addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    e.preventDefault();

    /*
     * Enter apenas remove o foco.
     * Não pesquisa automaticamente.
     */
    this.blur();
  }
});
document.getElementById("fornecedorBusca")?.addEventListener("input", function(){
  clearTimeout(timerBuscaFornecedorOTB);

  const valor = this.value;

  timerBuscaFornecedorOTB = setTimeout(() => {
    buscarFornecedoresOTB(valor);
  }, 180);
});
document
  .getElementById("grupoBusca")
  ?.addEventListener("input", function(){
    clearTimeout(timerBuscaGrupoOTB);

    const valor = this.value;

    timerBuscaGrupoOTB = setTimeout(() => {
      buscarGruposOTB(valor);
    }, 180);
  });
[
  "grupoBusca",
  "marcaBusca",
  "complementoBusca"
].forEach(id => {
  document
    .getElementById(id)
    ?.addEventListener("keydown", function(e){
      if(e.key === "Enter"){
        e.preventDefault();
        this.blur();
      }
    });
});
document
  .getElementById("marcaBusca")
  ?.addEventListener("input", function(){
    clearTimeout(timerBuscaMarcaOTB);

    const valor = this.value;

    timerBuscaMarcaOTB = setTimeout(() => {
      buscarMarcasOTB(valor);
    }, 180);
  });

document
  .getElementById("complementoBusca")
  ?.addEventListener("input", function(){
    clearTimeout(timerBuscaComplementoOTB);

    const valor = this.value;

    timerBuscaComplementoOTB = setTimeout(() => {
      buscarComplementosOTB(valor);
    }, 180);
  });
document.getElementById("fornecedorBusca")?.addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    e.preventDefault();
    this.blur();
  }
});

document.getElementById("fornecedorBusca")?.addEventListener("blur", function(){});
  document.getElementById("empresasBusca")?.addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    e.preventDefault();
    this.blur();
  }
});

  document.getElementById("empresasBusca")?.addEventListener("blur", function(){});

  document.querySelector(".btn.azul")?.addEventListener("click", function(evento){
  evento.preventDefault();
  carregarTudoOTB();
});

  document.getElementById("tblCentralProdutosOTB").innerHTML =
  "<b>Informe empresa/grupo, departamento ou fornecedor e clique em Atualizar.</b>";

document.getElementById("tblCentralProdutosOTB").innerHTML =
  "<b>Aguardando filtro.</b>";

  /*
   * FILTROS SUPERIORES:
   * selecionar no datalist ou pressionar Enter executa a busca.
   */
  let timerExecutarFiltroSuperiorOTB = null;

  function executarPesquisaFiltroSuperiorOTB(){
    clearTimeout(timerExecutarFiltroSuperiorOTB);

    timerExecutarFiltroSuperiorOTB = setTimeout(()=>{
      carregarTudoOTB();
    },80);
  }

  [
    "empresasBusca",
    "departamentoBusca",
    "fornecedorBusca",
    "grupoBusca",
    "marcaBusca",
    "complementoBusca"
  ].forEach(id=>{
    const campo = document.getElementById(id);

    if(!campo || campo.dataset.pesquisaFiltroOTB === "1"){
      return;
    }

    campo.dataset.pesquisaFiltroOTB = "1";

    campo.addEventListener("change",()=>{
      executarPesquisaFiltroSuperiorOTB();
    });

    campo.addEventListener("keydown",evento=>{
      if(evento.key !== "Enter"){
        return;
      }

      evento.preventDefault();
      evento.stopImmediatePropagation();
      campo.blur();
      executarPesquisaFiltroSuperiorOTB();
    },true);
  });
});

async function carregarFornecedoresOTB(){
  try{
    const j = await api("/api/otb-bi/fornecedores");
    const dl = document.getElementById("dlFornecedoresOTB");

    if(!dl) return;

    dl.innerHTML = (j.fornecedores || []).map(x => `
      <option value="${x.codigo} - ${x.nome}">
    `).join("");

  }catch(e){
    console.warn("Não carregou fornecedores:", e.message);
  }
}
let timerBuscaFornecedorOTB = null;
let timerBuscaGrupoOTB = null;
let timerBuscaMarcaOTB = null;
let timerBuscaComplementoOTB = null;

/*
 * Cancela a pesquisa anterior quando o usuário
 * continua digitando.
 */
const OTB_CONTROLLERS_BUSCA = {
  fornecedor: null,
  grupo: null,
  marca: null,
  complemento: null
};

/*
 * Guarda pesquisas já realizadas.
 * Exemplo: ao pesquisar "moleca" novamente,
 * não consulta o banco outra vez.
 */
const OTB_CACHE_BUSCA = {
  fornecedor: new Map(),
  grupo: new Map(),
  marca: new Map(),
  complemento: new Map()
};

async function apiBuscaRapidaOTB(tipo, url){
  /*
   * Cancela a requisição anterior do mesmo campo.
   */
  if(OTB_CONTROLLERS_BUSCA[tipo]){
    OTB_CONTROLLERS_BUSCA[tipo].abort();
  }

  const controller = new AbortController();
  OTB_CONTROLLERS_BUSCA[tipo] = controller;

  const timer = setTimeout(() => {
    controller.abort();
  }, 15000);

  try{
    const resposta = await fetch(url, {
      signal: controller.signal
    });

    const texto = await resposta.text();

    let json;

    try{
      json = JSON.parse(texto);
    }catch(e){
      throw new Error("O servidor não retornou uma resposta válida.");
    }

    if(!resposta.ok || json.ok === false){
      throw new Error(json.erro || "Erro ao pesquisar.");
    }

    return json;

  }catch(e){
    /*
     * AbortError é normal quando o usuário
     * continua digitando rapidamente.
     */
    if(e.name === "AbortError"){
      return null;
    }

    throw e;

  }finally{
    clearTimeout(timer);

    if(OTB_CONTROLLERS_BUSCA[tipo] === controller){
      OTB_CONTROLLERS_BUSCA[tipo] = null;
    }
  }
}

async function buscarFornecedoresOTB(q){
  try{
    const texto = String(q || "")
      .trim()
      .toUpperCase();

    if(texto.length < 2){
      return;
    }

    const dl =
      document.getElementById("dlFornecedoresOTB");

    if(!dl){
      return;
    }

    const cache =
      OTB_CACHE_BUSCA.fornecedor;

    if(cache.has(texto)){
      dl.innerHTML = cache.get(texto);
      return;
    }

    const j = await apiBuscaRapidaOTB(
      "fornecedor",
      "/api/otb-bi/fornecedores?q=" +
      encodeURIComponent(texto)
    );

    if(!j){
      return;
    }

    const html = (j.fornecedores || [])
      .map(x => `
        <option value="${x.codigo} - ${x.nome}">
      `)
      .join("");

    cache.set(texto, html);
    dl.innerHTML = html;

  }catch(e){
    console.warn(
      "Erro fornecedor:",
      e.message
    );
  }
}
async function buscarGruposOTB(q){
  try{
    const texto = String(q || "")
      .trim()
      .toUpperCase();

    if(texto.length < 2){
      return;
    }

    const dl =
      document.getElementById("dlGruposOTB");

    if(!dl){
      return;
    }

    const cache =
      OTB_CACHE_BUSCA.grupo;

    if(cache.has(texto)){
      dl.innerHTML = cache.get(texto);
      return;
    }

    const j = await apiBuscaRapidaOTB(
      "grupo",
      "/api/otb-bi/grupos?q=" +
      encodeURIComponent(texto)
    );

    if(!j){
      return;
    }

    const html = (j.grupos || [])
      .map(x => `
        <option value="${x.codigo} - ${x.descricao}">
      `)
      .join("");

    cache.set(texto, html);
    dl.innerHTML = html;

  }catch(e){
    console.warn(
      "Erro ao buscar grupos:",
      e.message
    );
  }
}

async function buscarMarcasOTB(q){
  try{
    const texto = String(q || "")
      .trim()
      .toUpperCase();

    if(texto.length < 2){
      return;
    }

    const dl =
      document.getElementById("dlMarcasOTB");

    if(!dl){
      return;
    }

    const cache =
      OTB_CACHE_BUSCA.marca;

    if(cache.has(texto)){
      dl.innerHTML = cache.get(texto);
      return;
    }

    const j = await apiBuscaRapidaOTB(
      "marca",
      "/api/otb-bi/marcas?q=" +
      encodeURIComponent(texto)
    );

    if(!j){
      return;
    }

    const html = (j.marcas || [])
      .map(x => `
        <option value="${x.codigo} - ${x.descricao}">
      `)
      .join("");

    cache.set(texto, html);
    dl.innerHTML = html;

  }catch(e){
    console.warn(
      "Erro ao buscar marcas:",
      e.message
    );
  }
}

async function buscarComplementosOTB(q){
  try{
    const texto = String(q || "")
      .trim()
      .toUpperCase();

    if(texto.length < 2){
      return;
    }

    const dl =
      document.getElementById("dlComplementosOTB");

    if(!dl){
      return;
    }

    const cache =
      OTB_CACHE_BUSCA.complemento;

    if(cache.has(texto)){
      dl.innerHTML = cache.get(texto);
      return;
    }

    const j = await apiBuscaRapidaOTB(
      "complemento",
      "/api/otb-bi/complementos?q=" +
      encodeURIComponent(texto)
    );

    if(!j){
      return;
    }

    const html = (j.complementos || [])
      .map(x => `
        <option value="${x.complemento}">
      `)
      .join("");

    cache.set(texto, html);
    dl.innerHTML = html;

  }catch(e){
    console.warn(
      "Erro ao buscar complementos:",
      e.message
    );
  }
}
function limparFiltrosGraficosOTB(){
  /*
   * DUPLO CLIQUE EM QUALQUER GRÁFICO:
   * remove todos os filtros de navegação/interação, mas preserva
   * integralmente a consulta principal já carregada (empresa digitada,
   * período, departamento, grupo, marca, complemento, fornecedor e ação).
   * Nenhuma nova consulta ao banco é executada.
   */

  OTB_EMPRESAS_SEL.clear();
  OTB_VISAO_SEL.clear();
  OTB_COMPARATIVO_SEL.clear();
  OTB_COMPARATIVO2_SEL.clear();
  OTB_PRODUTOS_SEL.clear();
  OTB_PERIODOS_TEMPORAIS_SEL.clear();

  OTB_SEMAFORO_ATIVO = "";
  OTB_GRAFICO_ORIGEM_SEL = "";

  /* Limpa também os três níveis selecionáveis do planejamento. */
  if(typeof OTB_FILTRO_PLANEJAMENTO_MESTRE !== "undefined"){
    OTB_FILTRO_PLANEJAMENTO_MESTRE = "";
  }
  if(typeof OTB_MES_PLANEJAMENTO_SEL !== "undefined"){
    OTB_MES_PLANEJAMENTO_SEL = "";
  }
  if(typeof OTB_GRUPO_PLANEJAMENTO_ABERTO !== "undefined"){
    OTB_GRUPO_PLANEJAMENTO_ABERTO = "";
  }
  if(typeof OTB_ITEM_PLANEJAMENTO_ABERTO !== "undefined"){
    OTB_ITEM_PLANEJAMENTO_ABERTO = "";
  }
  if(typeof OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE !== "undefined"){
    OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE = false;
  }

  /* Cancela atualizações locais atrasadas que poderiam recolocar filtros. */
  if(typeof OTB_TIMER_ATUALIZACAO_PESADA !== "undefined" && OTB_TIMER_ATUALIZACAO_PESADA){
    clearTimeout(OTB_TIMER_ATUALIZACAO_PESADA);
    OTB_TIMER_ATUALIZACAO_PESADA = null;
  }
  if(typeof OTB_SEQ_ATUALIZACAO_LOCAL !== "undefined"){
    OTB_SEQ_ATUALIZACAO_LOCAL++;
  }

  OTB_DATASET = [...OTB_DATASET_BASE];

  if(typeof atualizarEstadoBotaoProdutosPlanejamentoOTB === "function"){
    atualizarEstadoBotaoProdutosPlanejamentoOTB();
  }

  /* Atualiza tudo usando somente o dataset da consulta principal em memória. */
  aplicarFiltrosOTB();
}

function alternarSelecaoGrafico(setFiltro, valor, origem = ""){
  const valorNormalizado =
    setFiltro === OTB_EMPRESAS_SEL
      ? empresaConsolidadaOTB(valor)
      : normalizarValorFiltroOTB(valor);

  if(!valorNormalizado) return;

  /*
   * O último gráfico clicado passa a ser o gráfico de origem.
   * Ele mantém todos os seus componentes visíveis e apaga apenas
   * os não selecionados. Os outros gráficos recebem o filtro real
   * e escondem tudo aquilo que não foi selecionado.
   */
  OTB_GRAFICO_ORIGEM_SEL = String(origem || "");

  if(setFiltro.has(valorNormalizado)){
    setFiltro.delete(valorNormalizado);
  }else{
    setFiltro.add(valorNormalizado);
  }

  /*
   * Quando não existe mais seleção daquele tipo, nenhum gráfico
   * precisa permanecer como origem.
   */
  if(
    (setFiltro === OTB_EMPRESAS_SEL && !OTB_EMPRESAS_SEL.size) ||
    (setFiltro === OTB_VISAO_SEL && !OTB_VISAO_SEL.size) ||
    (setFiltro === OTB_COMPARATIVO_SEL && !OTB_COMPARATIVO_SEL.size) ||
    (setFiltro === OTB_COMPARATIVO2_SEL && !OTB_COMPARATIVO2_SEL.size)
  ){
    OTB_GRAFICO_ORIGEM_SEL = "";
  }

  aplicarFiltrosOTB();
}

function mesesEntreDatasOTB(){
  const ini = document.getElementById("dataIniOTB")?.value;
  const fim = document.getElementById("dataFimOTB")?.value;

  if(!ini || !fim) return 3;

  const d1 = new Date(ini + "T00:00:00");
  const d2 = new Date(fim + "T00:00:00");

  const dias = Math.max(1, Math.ceil((d2 - d1) / 86400000));
  return Math.max(1, dias / 30);
}

function preencherDatasPadraoOTB(){
  const ini = document.getElementById("dataIniOTB");
  const fim = document.getElementById("dataFimOTB");

  if(!ini || !fim) return;

  const hoje = new Date();

const inicio = new Date();
inicio.setMonth(inicio.getMonth() - 2);

const final = new Date();
final.setMonth(final.getMonth() + 2);

ini.value = inicio.toISOString().slice(0,10);
fim.value = final.toISOString().slice(0,10);
}
function parseDataOTB(valor){
  if(!valor) return null;

  if(valor instanceof Date){
    return Number.isNaN(valor.getTime()) ? null : new Date(valor.getTime());
  }

  const texto = String(valor).trim();
  if(!texto) return null;

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if(iso){
    const data = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      12, 0, 0
    );

    return Number.isNaN(data.getTime()) ? null : data;
  }

  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

function nomeMesCurtoOTB(data){
  return data
    .toLocaleDateString("pt-BR", { month:"short" })
    .replace(".", "")
    .replace(/^./, letra => letra.toUpperCase());
}

function criarDataLocalOTB(valor){
  if(!valor) return null;

  if(valor instanceof Date){
    return Number.isNaN(valor.getTime())
      ? null
      : new Date(
          valor.getFullYear(),
          valor.getMonth(),
          valor.getDate()
        );
  }

  const texto = String(valor).trim();

  /*
   * PostgreSQL pode retornar:
   * 2026-07-15
   * 2026-07-15T00:00:00.000Z
   */
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if(iso){
    const data = new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3])
    );

    return Number.isNaN(data.getTime()) ? null : data;
  }

  const data = new Date(texto);

  if(Number.isNaN(data.getTime())){
    return null;
  }

  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );
}

function bucketDataOTB(dataStr, gran){
  const dt = criarDataLocalOTB(dataStr);

  if(!dt) return null;

  let inicio;
  let fim;
  let chave;
  let label;

  if(gran === "mes"){
    inicio = new Date(dt.getFullYear(), dt.getMonth(), 1);
    fim = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);

    chave =
      dt.getFullYear() +
      "-" +
      String(dt.getMonth() + 1).padStart(2, "0");

    label = dt.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric"
    }).replace(".", "");
  }
  else if(gran === "semana"){
    inicio = new Date(dt);

    const diaSemana = inicio.getDay();
    const recuo = diaSemana === 0 ? 6 : diaSemana - 1;

    inicio.setDate(inicio.getDate() - recuo);

    fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);

    chave =
      inicio.getFullYear() +
      "-" +
      String(inicio.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(inicio.getDate()).padStart(2, "0");

    label =
      inicio.toLocaleDateString("pt-BR") +
      " a " +
      fim.toLocaleDateString("pt-BR");
  }
  else{
    const primeira = dt.getDate() <= 15;

    inicio = new Date(
      dt.getFullYear(),
      dt.getMonth(),
      primeira ? 1 : 16
    );

    fim = primeira
      ? new Date(dt.getFullYear(), dt.getMonth(), 15)
      : new Date(dt.getFullYear(), dt.getMonth() + 1, 0);

    chave =
      dt.getFullYear() +
      "-" +
      String(dt.getMonth() + 1).padStart(2, "0") +
      "-" +
      (primeira ? "01" : "16");

    const mes = dt.toLocaleDateString("pt-BR", {
      month: "short"
    }).replace(".", "");

    label =
      (primeira ? "1ª" : "2ª") +
      " Quinz. " +
      mes +
      "/" +
      dt.getFullYear();
  }

  return {
    chave,
    label,
    inicio,
    fim,
    ordem: inicio.getTime()
  };
}
function obterDatasetPrincipalFiltradoOTB(){
  let dados = Array.isArray(OTB_DATASET) ? [...OTB_DATASET] : [];
  const campoVisao = getCampoVisao();

  if(OTB_EMPRESAS_SEL.size){
    dados = dados.filter(x =>
      empresaAtendeSelecaoOTB(x.empresa)
    );
  }

  if(OTB_VISAO_SEL.size){
    dados = dados.filter(x =>
      OTB_VISAO_SEL.has(valorDimensaoOTB(x, campoVisao))
    );
  }

  if(OTB_SEMAFORO_ATIVO){
    dados = filtrarDadosPorSemaforoOTB(dados, OTB_SEMAFORO_ATIVO);
  }

  return dados;
}

function renderizarTimelineFiltradaOTB(){
  let dados = [...OTB_TIMELINE_DATASET];
  const campoVisao = getCampoVisao();

  if(OTB_EMPRESAS_SEL.size){
    dados = dados.filter(x =>
      empresaAtendeSelecaoOTB(x.empresa)
    );
  }

  if(OTB_VISAO_SEL.size){
    dados = dados.filter(x =>
      OTB_VISAO_SEL.has(valorDimensaoOTB(x, campoVisao))
    );
  }

  renderGraficoTemporal(dados);
}

function destruirGraficoTemporalOTB(){
  if(grafTemporal){
    grafTemporal.destroy();
    grafTemporal = null;
  }
}
/*
 * Posiciona o demonstrativo sempre ao lado da coluna/ponto,
 * evitando cobrir o item onde o mouse está posicionado.
 */
if(
  typeof Chart !== "undefined" &&
  Chart.Tooltip &&
  !Chart.Tooltip.positioners.aoLadoOTB
){
  Chart.Tooltip.positioners.aoLadoOTB = function(
    elementos,
    posicaoEvento
  ){
    if(!elementos || !elementos.length){
      return posicaoEvento;
    }

    const chartArea = this.chart.chartArea;

    /*
     * Usa a posição real do mouse ou do toque,
     * e não a ponta da coluna do gráfico.
     */
    const mouseX = Number(
      posicaoEvento?.x ?? elementos[0].element.x
    );

    const mouseY = Number(
      posicaoEvento?.y ?? elementos[0].element.y
    );

    const larguraTooltip = Number(this.width || 230);
    const alturaTooltip = Number(this.height || 130);

    /*
     * Distância lateral entre o ponteiro e o demonstrativo.
     */
    const distanciaMouse = 56;
    const margemBorda = 10;

    const espacoDireita = chartArea.right - mouseX;
    const espacoEsquerda = mouseX - chartArea.left;

    const abrirDireita =
      espacoDireita >= larguraTooltip + distanciaMouse ||
      espacoDireita >= espacoEsquerda;

    let x = abrirDireita
      ? mouseX + distanciaMouse
      : mouseX - distanciaMouse;

    let y = mouseY;

    /*
     * Evita que o demonstrativo saia para fora do gráfico.
     */
    const metadeAltura = alturaTooltip / 2;

    y = Math.max(
      chartArea.top + metadeAltura + margemBorda,
      Math.min(
        y,
        chartArea.bottom - metadeAltura - margemBorda
      )
    );

    return {
      x,
      y,
      xAlign: abrirDireita ? "left" : "right",
      yAlign: "center"
    };
  };
}
function dataISOLocalOTB(data){
  if(!(data instanceof Date)){
    return "";
  }

  if(Number.isNaN(data.getTime())){
    return "";
  }

  return (
    data.getFullYear() +
    "-" +
    String(data.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(data.getDate()).padStart(2, "0")
  );
}
function chaveLinhaDatasetOTB(x){
  return [
    String(x.empresa || "").padStart(2,"0"),
    String(x.produto || x.codigo || ""),
    String(x.marca || ""),
    String(x.fornecedor || ""),
    String(x.departamento || ""),
    String(x.grupo || ""),
    String(x.subgrupo || ""),
    String(x.linha || ""),
    String(x.cor || ""),
    String(x.complemento || ""),
    String(x.campanha || ""),
    String(x.numeracao || "")
  ].join("¦");
}

function mesclarDatasetsPeriodosOTB(listaDatasets){
  const mapa = new Map();

  for(const lista of listaDatasets){
    for(const x of (lista || [])){
      const chave = chaveLinhaDatasetOTB(x);

      if(!mapa.has(chave)){
        mapa.set(chave, {
          ...x,
                 compras:0,

          vendas:0,
          valor_vendas:0,

          venda_ano_passado:0,
          valor_venda_ano_passado:0,

          pedidos:0,
          estoque:0
        });
      }

      const a = mapa.get(chave);
         a.compras += numeroOTB(x.compras);

      a.vendas += numeroOTB(x.vendas);
      a.valor_vendas += numeroOTB(x.valor_vendas);

      a.venda_ano_passado +=
        numeroOTB(x.venda_ano_passado);

      a.valor_venda_ano_passado +=
        numeroOTB(x.valor_venda_ano_passado);

      // Pedido e estoque são posições atuais; não devem duplicar
      // quando vários períodos forem consultados separadamente.
      a.pedidos = Math.max(numeroOTB(a.pedidos), numeroOTB(x.pedidos));
      a.estoque = Math.max(numeroOTB(a.estoque), numeroOTB(x.estoque));
    }
  }

  return Array.from(mapa.values());
}

function chaveProdutoTemporalOTB(x){
  return [
    String(x.empresa || "").padStart(2,"0"),
    String(x.produto || x.codigo || "")
  ].join("¦");
}

/*
 * Monta o dataset do período usando exclusivamente os dados
 * que já vieram da rota timeline na carga inicial.
 * Nenhuma nova consulta ao backend é realizada ao clicar.
 */
function montarDatasetPeriodosLocaisOTB(){
  const granularidade =
    document.getElementById("granularidadeTempo")?.value || "mes";

  const basePorProduto = new Map();

  for(const x of OTB_DATASET_BASE){
    const chave = chaveProdutoTemporalOTB(x);

    if(!basePorProduto.has(chave)){
      basePorProduto.set(chave, {
        ...x,
        estoque:0
      });
    }

    const base = basePorProduto.get(chave);
    base.estoque += numeroOTB(x.estoque);
  }

  const mapa = new Map();

  for(const x of OTB_TIMELINE_DATASET){
    const dataBase =
      x.data ?? x.data_movimento ?? x.data_compra ??
      x.data_pedido ?? x.data_venda ?? null;

    const bucket = bucketDataOTB(dataBase, granularidade);

    if(
      !bucket ||
      !OTB_PERIODOS_TEMPORAIS_SEL.has(String(bucket.chave))
    ){
      continue;
    }

    const chave = chaveProdutoTemporalOTB(x);
    const base = basePorProduto.get(chave) || {};

    if(!mapa.has(chave)){
      mapa.set(chave, {
        ...base,
        ...x,
        empresa:String(x.empresa || base.empresa || "").padStart(2,"0"),
        produto:x.produto || base.produto || base.codigo || "",
        descricao:x.descricao || base.descricao || "",
        marca:x.marca || base.marca || "SEM MARCA",
        fornecedor:x.fornecedor || base.fornecedor || "SEM FORNECEDOR",
        departamento:x.departamento || base.departamento || "SEM DEPARTAMENTO",
        grupo:x.grupo || base.grupo || "SEM GRUPO",
        subgrupo:x.subgrupo || base.subgrupo || "SEM SUBGRUPO",
        linha:x.linha || base.linha || "SEM LINHA",
        cor:x.cor || base.cor || "SEM COR",
        complemento:x.complemento || base.complemento || "SEM COMPLEMENTO",
        campanha:x.campanha || base.campanha || "SEM CAMPANHA",
        numeracao:x.numeracao || base.numeracao || "SEM NUMERAÇÃO",
                compras:0,

        vendas:0,
        valor_vendas:0,

        venda_ano_passado:0,
        valor_venda_ano_passado:0,

        pedidos:0,
        estoque:numeroOTB(base.estoque)
      });
    }

    const item = mapa.get(chave);
       item.compras += numeroOTB(x.compras);

    item.vendas += numeroOTB(x.vendas);
    item.valor_vendas += numeroOTB(x.valor_vendas);

    item.venda_ano_passado +=
      numeroOTB(x.venda_ano_passado);

    item.valor_venda_ano_passado +=
      numeroOTB(x.valor_venda_ano_passado);

    item.pedidos += numeroOTB(x.pedidos);
  }

  return Array.from(mapa.values());
}

function filtrarPorPeriodoTemporalOTB(item){
  if(!item) return;

  const chavePeriodo = String(item.chave || "");
  if(!chavePeriodo) return;

  if(OTB_PERIODOS_TEMPORAIS_SEL.has(chavePeriodo)){
    OTB_PERIODOS_TEMPORAIS_SEL.delete(chavePeriodo);
  }else{
    OTB_PERIODOS_TEMPORAIS_SEL.add(chavePeriodo);
  }

  if(!OTB_PERIODOS_TEMPORAIS_SEL.size){
    OTB_DATASET = [...OTB_DATASET_BASE];
  }else{
    OTB_DATASET = montarDatasetPeriodosLocaisOTB();
  }

  aplicarFiltrosOTB();
}

function renderGraficoTemporal(dados){
  dados = Array.isArray(dados) ? dados : [];
  const ctx = document.getElementById("grafTemporal");
  if(!ctx) return;

  destruirGraficoTemporalOTB();

  if(!Array.isArray(dados) || !dados.length){
    return;
  }

  const granularidade =
    document.getElementById("granularidadeTempo")?.value || "mes";

  const mapa = new Map();

  for(const x of dados){
    const dataBase =
      x.data ??
      x.data_movimento ??
      x.data_compra ??
      x.data_pedido ??
      x.data_venda ??
      null;

    const bucket = bucketDataOTB(dataBase, granularidade);
    if(!bucket) continue;

    if(!mapa.has(bucket.chave)){
      mapa.set(bucket.chave, {
        chave: bucket.chave,
        periodo: bucket.label,
        inicio: bucket.inicio,
        fim: bucket.fim,
        ordem: bucket.ordem,
        movimentoEstoque: 0,
        compras: 0,
        pedidos: 0,
        vendas: 0,
        vendaAnoPassado: 0,
        estoqueReal: null,
        estoqueProjetado: null
      });
    }

    const item = mapa.get(bucket.chave);
    item.movimentoEstoque += numeroOTB(x.movimento_estoque);
    item.compras += numeroOTB(x.compras);
    item.pedidos += numeroOTB(x.pedidos);
    item.vendas += numeroOTB(x.vendas);
    item.vendaAnoPassado += numeroOTB(x.venda_ano_passado);
  }

  const lista = Array.from(mapa.values())
    .sort((a,b) => a.ordem - b.ordem);

  if(!lista.length) return;

  const estoqueAtual = obterDatasetPrincipalFiltradoOTB()
    .reduce((total, x) => total + numeroOTB(x.estoque), 0);

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  let indiceHoje = lista.findIndex(x =>
    x.inicio.getTime() <= hoje.getTime() &&
    x.fim.getTime() >= hoje.getTime()
  );

  if(indiceHoje < 0){
    for(let i = 0; i < lista.length; i++){
      if(lista[i].fim.getTime() < hoje.getTime()){
        indiceHoje = i;
      }
    }
  }

  /* Histórico: parte do estoque atual e desfaz o movimento líquido. */
  let saldoRetroativo = estoqueAtual;

  if(indiceHoje >= 0){
    lista[indiceHoje].estoqueReal = estoqueAtual;
    lista[indiceHoje].estoqueProjetado = estoqueAtual;

    for(let i = indiceHoje; i >= 0; i--){
      saldoRetroativo -= numeroOTB(lista[i].movimentoEstoque);

      if(i > 0){
        lista[i - 1].estoqueReal = saldoRetroativo;
        lista[i - 1].estoqueProjetado = saldoRetroativo;
      }
    }
  }

  /*
   * Projeção:
   * estoque atual + compras + pedidos
   * menos a demanda estimada.
   *
   * Quando existir venda do ano passado, ela será usada como
   * referência de demanda para o mesmo período.
   * Caso não exista, utiliza a venda do período atual.
   */
  let saldoFuturo = estoqueAtual;
  const inicioFuturo = indiceHoje >= 0 ? indiceHoje + 1 : 0;

  for(let i = inicioFuturo; i < lista.length; i++){
    const item = lista[i];

    const demandaEstimada =
      numeroOTB(item.vendaAnoPassado) > 0
        ? numeroOTB(item.vendaAnoPassado)
        : numeroOTB(item.vendas);

    saldoFuturo += numeroOTB(item.compras);
    saldoFuturo += numeroOTB(item.pedidos);
    saldoFuturo -= demandaEstimada;

    item.estoqueProjetado = saldoFuturo;
  }
  const labels = lista.map(x => x.periodo);

  const cfg = {
    data:{
      labels,
      datasets:[
        {
          type:"line",
          label:"Compras",
          hidden: !serieAtivaGeralOTB("Compras"),
          data:lista.map(x => numeroOTB(x.compras)),
          borderColor:CORES.compras,
          backgroundColor:CORES.compras,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.compras
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.compras
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
{
          type:"line",
          label:"Compras Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Compras Ano Retrasado"),
          data:lista.map(x => numeroOTB(x.compras_ano_retrasado)),
          borderColor:CORES.comprasAnoRetrasado,
          backgroundColor:CORES.comprasAnoRetrasado,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.comprasAnoRetrasado
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.comprasAnoRetrasado
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
{
          type:"line",
          label:"Compras Ano Passado",
          hidden: !serieAtivaGeralOTB("Compras Ano Passado"),
          data:lista.map(x => numeroOTB(x.compras_ano_passado)),
          borderColor:CORES.comprasAnoPassado,
          backgroundColor:CORES.comprasAnoPassado,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.comprasAnoPassado
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.comprasAnoPassado
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
        {
          type:"line",
          label:"Pedidos",
          hidden: !serieAtivaGeralOTB("Pedidos"),
          data:lista.map(x => numeroOTB(x.pedidos)),
          borderColor:CORES.pedidos,
          backgroundColor:CORES.pedidos,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.pedidos
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.pedidos
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
         {
          type:"line",
          label:"Venda Ano Passado",
          hidden: !serieAtivaGeralOTB("Venda Ano Passado"),
          data:lista.map(x => numeroOTB(x.vendaAnoPassado)),
          borderColor:CORES.vendaAnoPassado,
          backgroundColor:CORES.vendaAnoPassado,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.vendaAnoPassado
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.vendaAnoPassado
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          borderDash:[8,5],
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
{
          type:"line",
          label:"Venda Ano Retrasado",
          hidden: !serieAtivaGeralOTB("Venda Ano Retrasado"),
          data:lista.map(x => numeroOTB(x.vendaAnoRetrasado)),
          borderColor:CORES.vendaAnoRetrasado,
          backgroundColor:CORES.vendaAnoRetrasado,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.vendaAnoRetrasado
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.vendaAnoRetrasado
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          borderDash:[8,5],
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
        {
          type:"line",
          label:"Vendas",
          hidden: !serieAtivaGeralOTB("Vendas"),
          data:lista.map(x => numeroOTB(x.vendas)),
          borderColor:CORES.vendas,
          backgroundColor:CORES.vendas,
          pointBackgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? CORES.vendas
              : "rgba(148,163,184,.28)"
          ),
          pointBorderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : CORES.vendas
          ),
          pointBorderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderWidth:3,
          pointRadius:4,
          tension:.25,
          yAxisID:"yQuantidade",
          order:1
        },
        {
          type:"bar",
          label:"Estoque Real",
          hidden: !serieAtivaGeralOTB("Estoque Real"),
          data:lista.map(x => {
            const passadoOuHoje = x.inicio.getTime() <= hoje.getTime();
            return passadoOuHoje && x.estoqueReal !== null
              ? numeroOTB(x.estoqueReal)
              : null;
          }),
          backgroundColor:lista.map(x =>
            !OTB_PERIODOS_TEMPORAIS_SEL.size || OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))
              ? "rgba(30,64,175,.72)"
              : "rgba(30,64,175,.18)"
          ),
          borderColor:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? "#ffffff" : "#60a5fa"
          ),
          borderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderRadius:7,
          yAxisID:"yQuantidade",
          order:20
        },
        {
          type:"bar",
          label:"Estoque Projetado",
          hidden: !serieAtivaGeralOTB("Estoque Projetado"),
          data:lista.map(x => {
            const futuro = x.inicio.getTime() > hoje.getTime();
            return futuro && x.estoqueProjetado !== null
              ? numeroOTB(x.estoqueProjetado)
              : null;
          }),
          backgroundColor:lista.map(x => {
            const selecionado = OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave));
            if(OTB_PERIODOS_TEMPORAIS_SEL.size && !selecionado){
              return "rgba(148,163,184,.18)";
            }
            const saldo = numeroOTB(x.estoqueProjetado);
            if(saldo <= 0) return "rgba(239,68,68,.78)";
            if(estoqueAtual > 0 && saldo <= estoqueAtual * .30){
              return "rgba(250,204,21,.72)";
            }
            return "rgba(56,189,248,.58)";
          }),
          borderColor:lista.map(x => {
            if(OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave))){
              return "#ffffff";
            }
            const saldo = numeroOTB(x.estoqueProjetado);
            if(saldo <= 0) return "#ef4444";
            if(estoqueAtual > 0 && saldo <= estoqueAtual * .30){
              return "#facc15";
            }
            return "#38bdf8";
          }),
          borderWidth:lista.map(x =>
            OTB_PERIODOS_TEMPORAIS_SEL.has(String(x.chave)) ? 3 : 1
          ),
          borderRadius:7,
          yAxisID:"yQuantidade",
          order:20
        }
      ]
    },
options:{
  responsive:true,
  maintainAspectRatio:false,

  interaction:{
    mode:"index",
    intersect:false
  },

  /*
   * Clicar em qualquer barra, linha ou ponto
   * filtra os demais elementos do dashboard.
   */
  onClick:(evento, elementos, chart)=>{
    const pontos = chart.getElementsAtEventForMode(
      evento,
      "index",
      {
        intersect:false
      },
      true
    );

    if(!pontos.length){
      return;
    }

    const indice = pontos[0].index;
    const item = lista[indice];

    filtrarPorPeriodoTemporalOTB(item);
  },

  /*
   * Mostra a mãozinha quando o mouse estiver
   * sobre um período clicável.
   */
  onHover:(evento, elementos, chart)=>{
    const pontos = chart.getElementsAtEventForMode(
      evento,
      "index",
      {
        intersect:false
      },
      true
    );

    if(evento?.native?.target){
      evento.native.target.style.cursor =
        pontos.length
          ? "pointer"
          : "default";
    }
  },
      plugins:{
        legend:{
          labels:{
            color:"#fff",
            usePointStyle:true
          }
        },
tooltip:{
  mode:"index",
  intersect:false,

  /*
   * Sempre abre ao lado da coluna/ponto selecionado.
   */
  position:"aoLadoOTB",

  /*
   * Impede que o demonstrativo fique grudado
   * no elemento do gráfico.
   */
  caretPadding:14,

  /*
   * Distância entre a seta do tooltip e a coluna.
   */
  caretSize:7,

  padding:12
}
      },
      scales:{
        x:{
          ticks:{
            color:"#cbd5e1",
            maxRotation:35,
            minRotation:0
          },
          grid:{
            color:"rgba(255,255,255,.08)"
          }
        },
        yQuantidade:{
          position:"left",
          beginAtZero:true,
          title:{
            display:true,
            text:"Quantidade",
            color:"#cbd5e1",
            font:{ weight:"bold" }
          },
          ticks:{
            color:"#cbd5e1",
            callback:v => formatarNum(v)
          },
          grid:{
            color:"rgba(255,255,255,.08)"
          }
        }
      }
    }
  };

  grafTemporal = new Chart(ctx, cfg);
  reaplicarFiltroSerieCardOTB();

  /* O gráfico temporal também restaura toda a navegação com duplo clique. */
  ctx.ondblclick = evento => {
    evento.preventDefault();
    evento.stopPropagation();
    limparFiltrosGraficosOTB();
  };
}

function obterMetaCoberturaMesesOTB(){
  const seletor = document.getElementById("coberturaAlvoOTB");
  const personalizado = document.getElementById("coberturaPersonalizadaOTB");
  const bruto = seletor?.value === "personalizada" ? personalizado?.value : seletor?.value;
  const valor = Number(bruto || 3.1);
  return Number.isFinite(valor) && valor > 0 ? valor : 3.1;
}

function calcularCompraSugeridaProdutoOTB(x){
  const metaMeses = obterMetaCoberturaMesesOTB();
  const mesesPeriodo = Math.max(1, mesesEntreDatasOTB());
  const recenteMes = numeroOTB(x.vendas) / mesesPeriodo;
  const anoPassadoMes = numeroOTB(x.venda_ano_passado) / mesesPeriodo;
  const anoRetrasadoMes = numeroOTB(x.venda_ano_retrasado) / mesesPeriodo;

  /* Previsão mensal: 50% período recente, 30% ano passado e 20% ano retrasado. */
  const previsaoMensal =
    (recenteMes * 0.50) +
    (anoPassadoMes * 0.30) +
    (anoRetrasadoMes * 0.20);

  const necessidadeAlvo = Math.ceil(previsaoMensal * metaMeses);
  const estoque = numeroOTB(x.estoque);
  const pedidos = numeroOTB(x.pedidos);
  const disponibilidadeFutura = estoque + pedidos;
  const compraSugerida = Math.max(0, Math.ceil(necessidadeAlvo - disponibilidadeFutura));
  const coberturaAtual = previsaoMensal > 0 ? estoque / previsaoMensal : 999;
  const coberturaComPedido = previsaoMensal > 0 ? disponibilidadeFutura / previsaoMensal : 999;
  const saldoProjetado = disponibilidadeFutura - necessidadeAlvo;

  let prioridade = "normal";
  if(coberturaComPedido < 1) prioridade = "urgente";
  else if(coberturaComPedido < metaMeses) prioridade = "atencao";

  return {
    ...x, metaMeses, mesesPeriodo, recenteMes, anoPassadoMes, anoRetrasadoMes,
    previsaoMensal, demandaBase: previsaoMensal * mesesPeriodo,
    mediaDiaria: previsaoMensal / 30, necessidadeAlvo, disponibilidadeFutura,
    compraSugerida, coberturaAtual, coberturaComPedido, saldoProjetado, prioridade
  };
}

function gerarCompraInteligenteOTB(dados){
  return agruparProduto(dados)
    .map(calcularCompraSugeridaProdutoOTB)
    .filter(x => x.compraSugerida > 0)
    .sort((a,b) => {
      const ordem = {
        urgente: 1,
        atencao: 2,
        normal: 3
      };

      const prioridade =
        ordem[a.prioridade] - ordem[b.prioridade];

      if(prioridade !== 0) return prioridade;

      return b.compraSugerida - a.compraSugerida;
    });
}

function renderCompraInteligenteOTB(dados){
  dados = Array.isArray(dados) ? dados : [];
  renderCentralEstrategicaProdutosOTB(dados);
}

function calcularStatusProdutoOTB(x){
  const vendaPeriodoAtual =
    Number(x.vendas || 0);

  const vendaAnoPassado =
    Number(x.venda_ano_passado || 0);

  /*
   * Utiliza o histórico do mesmo período do ano passado
   * como referência de demanda.
   *
   * Quando não existir esse histórico, utiliza a venda atual.
   */
  const demandaReferencia =
    vendaAnoPassado > 0
      ? vendaAnoPassado
      : vendaPeriodoAtual;

  const estoque = Number(x.estoque || 0);
  const compras = Number(x.compras || 0);
  const pedidos = Number(x.pedidos || 0);

  const saldoProjetado =
    estoque + compras + pedidos - demandaReferencia;

  if(saldoProjetado <= 0){
    return "ruptura";
  }

  if(saldoProjetado <= demandaReferencia * 0.35){
    return "atencao";
  }

  return "saudavel";
}
function atualizarSemaforoOTB(dados){
  dados = Array.isArray(dados) ? dados : [];
  const produtos = agruparProduto(dados);

  const cont = {
    ruptura:0,
    atencao:0,
    saudavel:0
  };

  produtos.forEach(x => {
    const st = calcularStatusProdutoOTB(x);
    cont[st]++;
  });

  document.getElementById("semRuptura").textContent = formatarNum(cont.ruptura);
  document.getElementById("semAtencao").textContent = formatarNum(cont.atencao);
  document.getElementById("semSaudavel").textContent = formatarNum(cont.saudavel);
}

function filtrarDadosPorSemaforoOTB(dados, status){
  const produtosStatus = new Set();

  agruparProduto(dados).forEach(x => {
    if(calcularStatusProdutoOTB(x) === status){
      produtosStatus.add(String(x.produto));
    }
  });

  return dados.filter(x => produtosStatus.has(String(x.produto || x.codigo || "")));
}

function filtrarSemaforoOTB(status){
  if(OTB_SEMAFORO_ATIVO === status){
    OTB_SEMAFORO_ATIVO = "";
  }else{
    OTB_SEMAFORO_ATIVO = status;
  }

  aplicarFiltrosOTB();
}


/* =========================================================
   AMPLIAÇÃO DAS FOTOS NAS TABELAS DO OTB-BI
   Desktop: abre ao posicionar o mouse e fecha ao retirar.
   Celular/tablet: abre ao tocar e fecha tocando na foto grande.
   ========================================================= */
let OTB_FOTO_PREVIEW_FECHAR_TIMER = null;

function dispositivoComMouseOTB(){
  return window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function garantirPreviewFotoOTB(){
  let overlay = document.getElementById('previewFotoProdutoOTB');

  if(overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'previewFotoProdutoOTB';
  overlay.className = 'previewFotoProdutoOTB';
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <div class="previewFotoProdutoOTBConteudo">
      <img id="previewFotoProdutoOTBImagem" alt="Foto ampliada do produto">
      <div id="previewFotoProdutoOTBLegenda" class="previewFotoProdutoOTBLegenda"></div>
      <button type="button" class="previewFotoProdutoOTBFechar" aria-label="Fechar foto">×</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const fechar = () => fecharPreviewFotoOTB();
  overlay.addEventListener('click', fechar);
  overlay.querySelector('.previewFotoProdutoOTBFechar')?.addEventListener('click', fechar);
  overlay.querySelector('#previewFotoProdutoOTBImagem')?.addEventListener('click', fechar);

  return overlay;
}

function abrirPreviewFotoOTB(img){
  if(!img || !img.src || img.style.display === 'none') return;

  clearTimeout(OTB_FOTO_PREVIEW_FECHAR_TIMER);

  const overlay = garantirPreviewFotoOTB();
  const imagemGrande = overlay.querySelector('#previewFotoProdutoOTBImagem');
  const legenda = overlay.querySelector('#previewFotoProdutoOTBLegenda');

  if(!imagemGrande) return;

  imagemGrande.src = img.currentSrc || img.src;
  imagemGrande.alt = img.alt || 'Foto ampliada do produto';

  if(legenda){
    legenda.textContent = img.title || img.alt || '';
    legenda.style.display = legenda.textContent ? 'block' : 'none';
  }

  overlay.classList.toggle('modoMouse', dispositivoComMouseOTB());
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');

  if(!dispositivoComMouseOTB()){
    document.body.classList.add('otbFotoAberta');
  }
}

function fecharPreviewFotoOTB(){
  clearTimeout(OTB_FOTO_PREVIEW_FECHAR_TIMER);

  const overlay = document.getElementById('previewFotoProdutoOTB');
  if(!overlay) return;

  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('otbFotoAberta');
}

function agendarFechamentoPreviewFotoOTB(){
  clearTimeout(OTB_FOTO_PREVIEW_FECHAR_TIMER);
  OTB_FOTO_PREVIEW_FECHAR_TIMER = setTimeout(fecharPreviewFotoOTB, 70);
}

function configurarAmpliacaoFotosOTB(){
  document.addEventListener('mouseover', evento => {
    if(!dispositivoComMouseOTB()) return;

    const img = evento.target.closest?.('.fotoProdutoOTB');
    if(!img) return;

    const origem = evento.relatedTarget;
    if(origem && img.contains(origem)) return;

    abrirPreviewFotoOTB(img);
  });

  document.addEventListener('mouseout', evento => {
    if(!dispositivoComMouseOTB()) return;

    const img = evento.target.closest?.('.fotoProdutoOTB');
    if(!img) return;

    const destino = evento.relatedTarget;
    if(destino && img.contains(destino)) return;

    agendarFechamentoPreviewFotoOTB();
  });

  document.addEventListener('click', evento => {
    const img = evento.target.closest?.('.fotoProdutoOTB');
    if(!img || dispositivoComMouseOTB()) return;

    evento.preventDefault();
    evento.stopPropagation();

    const overlay = garantirPreviewFotoOTB();
    const estaAberto = overlay.classList.contains('aberto');
    const imagemGrande = overlay.querySelector('#previewFotoProdutoOTBImagem');
    const mesmaFoto = estaAberto && imagemGrande &&
      imagemGrande.src === (img.currentSrc || img.src);

    if(mesmaFoto){
      fecharPreviewFotoOTB();
    }else{
      abrirPreviewFotoOTB(img);
    }
  });

  document.addEventListener('keydown', evento => {
    if(evento.key === 'Escape') fecharPreviewFotoOTB();
  });
}

/* A ampliação foi desativada: a foto permanece fixa na tabela. */


/* =========================================================
   EXPORTAÇÃO PDF OTB BI
   IMPORTANTE:
   - não altera gráficos, filtros, tabelas ou layout da tela;
   - cria uma cópia da tela em uma nova janela;
   - respeita filtros, seleções, ordenações e dados carregados;
   - transforma os canvases dos gráficos em imagens para impressão;
   - expande a Central Estratégica para exportar todas as linhas.
   ========================================================= */

function valorFiltroPDFOTB(id, padrao = "Todos"){
  const el = document.getElementById(id);
  if(!el) return padrao;

  if(el.tagName === "SELECT"){
    const texto = el.options?.[el.selectedIndex]?.textContent || el.value || "";
    return String(texto).trim() || padrao;
  }

  return String(el.value || "").trim() || padrao;
}

function dataPDFOTB(valor){
  const texto = String(valor || "").trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto || "Não informado";

  const [ano, mes, dia] = texto.split("-");
  return `${dia}/${mes}/${ano}`;
}

function escaparPDFOTB(valor){
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function listaSelecaoPDFOTB(conjunto){
  const valores = Array.from(conjunto || [])
    .map(x => String(x || "").trim())
    .filter(Boolean);

  return valores.length ? valores.join(", ") : "Nenhuma";
}

let OTB_MODO_PDF_TEXTO_PRETO = false;

/*
 * Captura o canvas original sem alterar nenhuma opção do Chart.js.
 * Os pixels claros usados em textos e números são convertidos para
 * preto na cópia, nunca no gráfico exibido na tela.
 */
function clonarValorGraficoPDFOTB(valor, vistos = new WeakMap()){
  if(
    valor === null ||
    valor === undefined ||
    typeof valor !== "object"
  ){
    return valor;
  }

  if(vistos.has(valor)){
    return vistos.get(valor);
  }

  if(Array.isArray(valor)){
    const copia = [];
    vistos.set(valor, copia);

    valor.forEach(item => {
      copia.push(clonarValorGraficoPDFOTB(item, vistos));
    });

    return copia;
  }

  if(valor instanceof Date){
    return new Date(valor.getTime());
  }

  const prototipo = Object.getPrototypeOf(valor);

  /*
   * Objetos especiais do navegador não são modificados.
   * Funções também passam por referência, mas nunca são alteradas.
   */
  if(
    prototipo &&
    prototipo !== Object.prototype &&
    prototipo !== null
  ){
    return valor;
  }

  const copia = {};
  vistos.set(valor, copia);

  Reflect.ownKeys(valor).forEach(chave => {
    try{
      copia[chave] =
        clonarValorGraficoPDFOTB(valor[chave], vistos);
    }catch(_){
      copia[chave] = valor[chave];
    }
  });

  return copia;
}

function garantirObjetoGraficoPDFOTB(objeto, chave){
  if(
    !objeto[chave] ||
    typeof objeto[chave] !== "object"
  ){
    objeto[chave] = {};
  }

  return objeto[chave];
}

function aplicarVisualBrancoGraficoPDFOTB(configuracao){
  const opcoes = garantirObjetoGraficoPDFOTB(
    configuracao,
    "options"
  );

  opcoes.responsive = false;
  opcoes.maintainAspectRatio = false;
  opcoes.animation = false;
  opcoes.animations = false;
  opcoes.events = [];

  const plugins = garantirObjetoGraficoPDFOTB(
    opcoes,
    "plugins"
  );

  const legenda = garantirObjetoGraficoPDFOTB(
    plugins,
    "legend"
  );

  const labels = garantirObjetoGraficoPDFOTB(
    legenda,
    "labels"
  );

  labels.color = "#000000";

  const fonteLegenda = garantirObjetoGraficoPDFOTB(
    labels,
    "font"
  );

  fonteLegenda.weight = "400";

  ["title", "subtitle"].forEach(nome => {
    const titulo = garantirObjetoGraficoPDFOTB(
      plugins,
      nome
    );

    titulo.color = "#000000";

    const fonte = garantirObjetoGraficoPDFOTB(
      titulo,
      "font"
    );

    fonte.weight = nome === "title" ? "500" : "400";
  });

  const escalas = garantirObjetoGraficoPDFOTB(
    opcoes,
    "scales"
  );

  Object.values(escalas).forEach(escala => {
    if(!escala || typeof escala !== "object") return;

    const ticks = garantirObjetoGraficoPDFOTB(
      escala,
      "ticks"
    );

    ticks.color = "#000000";

    const fonteTicks = garantirObjetoGraficoPDFOTB(
      ticks,
      "font"
    );

    fonteTicks.weight = "400";

    const titulo = garantirObjetoGraficoPDFOTB(
      escala,
      "title"
    );

    titulo.color = "#000000";

    const fonteTitulo = garantirObjetoGraficoPDFOTB(
      titulo,
      "font"
    );

    fonteTitulo.weight = "500";

    const grade = garantirObjetoGraficoPDFOTB(
      escala,
      "grid"
    );

    grade.color = "rgba(15,23,42,.12)";
    grade.borderColor = "rgba(15,23,42,.25)";
  });

  /*
   * Plugin exclusivo da cópia do PDF.
   * Pinta branco antes de o Chart.js desenhar os dados.
   */
  const fundoBrancoPDFOTB = {
    id: "fundoBrancoPDFOTB",
    beforeDraw(chart){
      const ctx = chart.ctx;

      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        0,
        0,
        chart.width,
        chart.height
      );
      ctx.restore();
    }
  };

  const pluginsConfig =
    Array.isArray(configuracao.plugins)
      ? configuracao.plugins
      : [];

  configuracao.plugins = [
    ...pluginsConfig,
    fundoBrancoPDFOTB
  ];
}

function capturarGraficoPDFOTB(grafico){
  const canvasOriginal = grafico?.canvas;
  if(!canvasOriginal || !window.Chart) return "";

  let copiaGrafico = null;

  try{
    const largura = Math.max(
      Number(canvasOriginal.width || 0),
      900
    );

    const altura = Math.max(
      Number(canvasOriginal.height || 0),
      320
    );

    const canvasPDF = document.createElement("canvas");
    canvasPDF.width = largura;
    canvasPDF.height = altura;

    /*
     * Usa a configuração declarada do gráfico, não os objetos
     * internos calculados pelo Chart.js.
     */
    const configOriginal =
      grafico.config?._config || {
        type: grafico.config?.type,
        data: grafico.data,
        options: grafico.options,
        plugins: grafico.config?.plugins || []
      };

    const configuracao =
      clonarValorGraficoPDFOTB(configOriginal);

    /*
     * Copia exatamente a visibilidade atual de cada série.
     * Tudo que o usuário ocultou pela legenda no sistema também
     * ficará oculto no PDF.
     */
    if(
      Array.isArray(configuracao?.data?.datasets) &&
      Array.isArray(grafico?.data?.datasets)
    ){
      configuracao.data.datasets.forEach((dataset, indice) => {
        let visivel = true;

        try{
          visivel = grafico.isDatasetVisible(indice);
        }catch(_){
          const meta = grafico.getDatasetMeta?.(indice);
          visivel = meta?.hidden !== true;
        }

        dataset.hidden = !visivel;
      });
    }

    aplicarVisualBrancoGraficoPDFOTB(configuracao);

    /*
     * A variável é lida apenas pelos plugins de números já existentes.
     * O gráfico original nunca recebe update() ou alteração de opções.
     */
    OTB_MODO_PDF_TEXTO_PRETO = true;

    copiaGrafico = new Chart(
      canvasPDF.getContext("2d"),
      configuracao
    );

    copiaGrafico.update("none");

    const imagem =
      canvasPDF.toDataURL("image/png", 1);

    copiaGrafico.destroy();
    copiaGrafico = null;
    OTB_MODO_PDF_TEXTO_PRETO = false;

    return imagem;

  }catch(e){
    try{
      copiaGrafico?.destroy();
    }catch(_){}

    OTB_MODO_PDF_TEXTO_PRETO = false;

    console.error(
      "Erro ao criar cópia branca do gráfico para o PDF:",
      e
    );

    return "";
  }
}

function substituirCanvasNoClonePDFOTB(clone, idCanvas, grafico){
  const canvasClone = clone.querySelector(`#${idCanvas}`);
  if(!canvasClone) return;

  const imagem = capturarGraficoPDFOTB(grafico);

  if(!imagem){
    canvasClone.remove();
    return;
  }

  const img = document.createElement("img");
  img.src = imagem;
  img.alt = idCanvas;
  img.className = "graficoImagemPDFOTB";

  canvasClone.replaceWith(img);
}

function fixarValoresCamposClonePDFOTB(clone){
  clone.querySelectorAll("input, select, textarea").forEach(campoClone => {
    const original = campoClone.id
      ? document.getElementById(campoClone.id)
      : null;

    if(!original) return;

    if(campoClone.tagName === "SELECT"){
      const texto =
        original.options?.[original.selectedIndex]?.textContent ||
        original.value ||
        "";

      const span = document.createElement("div");
      span.className = "campoEstaticoPDFOTB";
      span.textContent = String(texto).trim() || "Todos";
      campoClone.replaceWith(span);
      return;
    }

    if(original.type === "hidden"){
      campoClone.remove();
      return;
    }

    const span = document.createElement("div");
    span.className = "campoEstaticoPDFOTB";

    span.textContent = original.type === "date"
      ? dataPDFOTB(original.value)
      : String(original.value || "").trim() || "Todos";

    campoClone.replaceWith(span);
  });
}

function removerControlesClonePDFOTB(clone){
  /*
   * Remove somente controles visuais.
   * Não remove elementos com onclick, porque as linhas da tabela
   * possuem onclick e estavam desaparecendo do PDF.
   */
  clone.querySelectorAll(
    [
      ".acoes",
      ".listaVisao",
      ".painelEscolhaAnaliseOTB",
      ".previewFotoProdutoOTB",
      "#previewFotoProdutoOTB",
      "button"
    ].join(",")
  ).forEach(el => {
    if(el.closest?.(".semaforoGrid")) return;
    el.remove();
  });

  /*
   * Retira os eventos sem excluir os elementos.
   * Assim a tabela selecionada e já ordenada permanece completa.
   */
  clone.querySelectorAll("[onclick], [onkeydown], [tabindex]").forEach(el => {
    el.removeAttribute("onclick");
    el.removeAttribute("onkeydown");
    el.removeAttribute("tabindex");
  });
}

function expandirConteudoClonePDFOTB(clone){
  clone.querySelectorAll(
    [
      "#tblCentralProdutosOTB",
      "#tblProdutos",
      "#tblCriticos",
      "#tblCompraInteligenteOTB",
      ".tabelaScrollOTB",
      ".rolagemGraficoComplementarOTB",
      "#rolagemGraficoVisaoOTB",
      "#rolagemGraficoAnaliseOTB",
      ".listaVisao"
    ].join(",")
  ).forEach(el => {
    el.style.maxHeight = "none";
    el.style.height = "auto";
    el.style.overflow = "visible";
    el.style.width = "100%";
  });

  clone.querySelectorAll(
    [
      "#areaInternaGraficoVisaoOTB",
      "#areaInternaGraficoComparativoVisaoOTB",
      "#areaInternaGraficoComparativoVisaoOTB2",
      "#areaInternaGraficoAnaliseOTB"
    ].join(",")
  ).forEach(el => {
    el.style.width = "100%";
    el.style.height = "auto";
    el.style.minHeight = "0";
  });

  clone.querySelectorAll("table").forEach(tabela => {
    tabela.style.width = "100%";
  });
}

const OTB_PDF_STORAGE_KEY = "otb_pdf_colunas_central_v1";

const OTB_PDF_COLUNAS = [
  { chave:"foto", titulo:"Foto", padrao:true },
  { chave:"prioridade", titulo:"Prioridade", padrao:true },
  { chave:"fornecedor", titulo:"Fornecedor", padrao:true },
  { chave:"produto", titulo:"Código e descrição", padrao:true },
  { chave:"marca", titulo:"Marca", padrao:true },
  { chave:"complemento", titulo:"Complemento", padrao:true },
  { chave:"giro", titulo:"Giro/Estoque", padrao:true },
  { chave:"giro_compras", titulo:"Giro/Compras", padrao:true },
  { chave:"vendas", titulo:"Qtd. vendida", padrao:true },
  { chave:"venda_ano_passado", titulo:"Qtd. vendida ano passado", padrao:true },
  { chave:"compras", titulo:"Qtd. comprada", padrao:true },
  { chave:"compras_ano_passado", titulo:"Qtd. comprada ano passado", padrao:true },
  { chave:"pedidos", titulo:"Pedidos", padrao:true },
  { chave:"estoque", titulo:"Estoque", padrao:true },
  { chave:"coberturaComPedido", titulo:"Cobertura c/ pedido", padrao:true },
  { chave:"compraSugerida", titulo:"Compra sugerida", padrao:true }
];

function obterColunasPDFSalvasOTB(){
  try{
    const salvas = JSON.parse(localStorage.getItem(OTB_PDF_STORAGE_KEY) || "null");
    if(Array.isArray(salvas) && salvas.length){
      const validas = new Set(OTB_PDF_COLUNAS.map(c => c.chave));
      const filtradas = salvas.filter(chave => validas.has(chave));
      if(filtradas.length) return filtradas;
    }
  }catch(e){
    console.warn("Não foi possível ler as colunas salvas do PDF:", e.message);
  }

  return OTB_PDF_COLUNAS.filter(c => c.padrao).map(c => c.chave);
}

function salvarColunasPDFOTB(colunas){
  try{
    localStorage.setItem(OTB_PDF_STORAGE_KEY, JSON.stringify(colunas));
  }catch(e){
    console.warn("Não foi possível salvar as colunas do PDF:", e.message);
  }
}

function abrirSelecaoPDFOTB(){
  if(!OTB_DATASET_BASE.length){
    alert("Faça uma consulta antes de exportar.");
    return;
  }

  const modal = document.getElementById("modalExportarPDFOTB");
  const lista = document.getElementById("listaCamposExportarPDFOTB");
  if(!modal || !lista) return;

  const selecionadas = new Set(obterColunasPDFSalvasOTB());

  lista.innerHTML = OTB_PDF_COLUNAS.map(coluna => `
    <label class="campoExportarPDFOTB">
      <input
        type="checkbox"
        value="${escaparPDFOTB(coluna.chave)}"
        ${selecionadas.has(coluna.chave) ? "checked" : ""}
      >
      <span>${escaparPDFOTB(coluna.titulo)}</span>
    </label>
  `).join("");

  modal.classList.add("aberto");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modalExportarPDFOTBAberto");
}

function fecharSelecaoPDFOTB(){
  const modal = document.getElementById("modalExportarPDFOTB");
  if(!modal) return;
  modal.classList.remove("aberto");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modalExportarPDFOTBAberto");
}

function marcarTodosCamposPDFOTB(marcar = true){
  document
    .querySelectorAll('#listaCamposExportarPDFOTB input[type="checkbox"]')
    .forEach(input => { input.checked = !!marcar; });
}

function colunasMarcadasPDFOTB(){
  return Array.from(
    document.querySelectorAll('#listaCamposExportarPDFOTB input[type="checkbox"]:checked')
  ).map(input => input.value);
}

function obterFiltrosAtivosPDFOTB(){
  const periodoIni = document.getElementById("dataIniOTB")?.value || "";
  const periodoFim = document.getElementById("dataFimOTB")?.value || "";
  const periodo = periodoIni || periodoFim
    ? `${dataPDFOTB(periodoIni)} até ${dataPDFOTB(periodoFim)}`
    : "";

  const filtros = [
    ["Empresas", valorFiltroPDFOTB("empresasBusca", "")],
    ["Período", periodo],
    ["Departamento", valorFiltroPDFOTB("departamentoBusca", "")],
    ["Grupo", valorFiltroPDFOTB("grupoBusca", "")],
    ["Marca", valorFiltroPDFOTB("marcaBusca", "")],
    ["Complemento", valorFiltroPDFOTB("complementoBusca", "")],
    ["Fornecedor", valorFiltroPDFOTB("fornecedorBusca", "")],
    ["Ação", valorFiltroPDFOTB("acao", "")],
    ["Empresas selecionadas no gráfico", listaSelecaoPDFOTB(OTB_EMPRESAS_SEL, "")],
    ["Seleções da visão", listaSelecaoPDFOTB(OTB_VISAO_SEL, "")],
    ["Seleções comparativo 1", listaSelecaoPDFOTB(OTB_COMPARATIVO_SEL, "")],
    ["Seleções comparativo 2", listaSelecaoPDFOTB(OTB_COMPARATIVO2_SEL, "")],
    ["Períodos selecionados", listaSelecaoPDFOTB(OTB_PERIODOS_TEMPORAIS_SEL, "")],
    ["Semáforo ativo", OTB_SEMAFORO_ATIVO || ""]
  ];

  return filtros.filter(([, valor]) => {
    const texto = String(valor || "").trim();
    return texto && !["Todos", "Todas", "Nenhum", "Não informado", "-"].includes(texto);
  });
}

function cabecalhoRelatorioPDFOTB(){
  const filtros = obterFiltrosAtivosPDFOTB();

  return `
    <header class="cabecalhoPDFOTB">
      <h1>Central Estratégica de Produtos</h1>
      ${filtros.length ? `
        <div class="filtrosPDFOTB">
          ${filtros.map(([titulo, valor]) => `
            <div><b>${escaparPDFOTB(titulo)}:</b> ${escaparPDFOTB(valor)}</div>
          `).join("")}
        </div>
      ` : ""}
    </header>
  `;
}


function produtoCompactoPDFOTB(item){
  const codigo = String(item?.produto || "").trim();
  const descricao = String(item?.descricao || "")
    .replace(/\s+/g," ")
    .trim();

  if(!descricao){
    return `<div class="produtoCompactoPDFOTB"><b>${escaparPDFOTB(codigo)}</b></div>`;
  }

  const palavras = descricao.split(" ").filter(Boolean);

  /*
   * Linha 1: código + começo da descrição.
   * Linha 2: restante, truncado visualmente com reticências.
   */
  let linha1Descricao = "";
  let resto = [...palavras];

  while(resto.length){
    const teste = [linha1Descricao, resto[0]]
      .filter(Boolean)
      .join(" ");

    const comprimentoComCodigo =
      `${codigo} ${teste}`.trim().length;

    if(comprimentoComCodigo > 20 && linha1Descricao){
      break;
    }

    if(comprimentoComCodigo > 22){
      break;
    }

    linha1Descricao = teste;
    resto.shift();
  }

  if(!linha1Descricao && resto.length){
    linha1Descricao = resto.shift();
  }

  const linha1 = `${codigo} ${linha1Descricao}`.trim();
  const linha2 = resto.join(" ").trim();

  return `
    <div class="produtoCompactoPDFOTB">
      <div class="produtoLinha1PDFOTB">${escaparPDFOTB(linha1)}</div>
      ${linha2 ? `
        <div
          class="produtoLinha2PDFOTB"
          title="${escaparPDFOTB(linha2)}"
        >${escaparPDFOTB(linha2)}</div>
      ` : ""}
    </div>
  `;
}

function montarTabelaProdutosPDFOTB(dados, colunasSelecionadas){
  const ordemPrioridade = {
    "URGENTE": 1,
    "ATENÇÃO": 2,
    "OPORTUNIDADE": 3,
    "EXCESSO": 4,
    "SAUDÁVEL": 5
  };

  const lista = agruparProduto(Array.isArray(dados) ? dados : [])
    .map(classificarProdutoCentralOTB);

  const campo = OTB_ORDENACAO_TABELA.campo;
  const direcao = OTB_ORDENACAO_TABELA.direcao === "desc" ? -1 : 1;

  const obterValorOrdenacao = item => {
    switch(campo){
      case "foto":
      case "produto": return `${item.produto || ""} ${item.descricao || ""}`.trim();
      case "prioridade": return ordemPrioridade[item.prioridadeCentral] || 99;
      case "fornecedor": return item.fornecedor || "";
      case "marca": return item.marca || "";
      case "complemento": return item.complemento || "";
      case "giro": return giroProdutoCentralOTB(item);
      case "giro_compras": return giroComprasProdutoCentralOTB(item);
      case "vendas": return numeroOTB(item.vendas);
      case "venda_ano_passado": return numeroOTB(item.venda_ano_passado);
      case "compras": return numeroOTB(item.compras);
      case "compras_ano_passado": return numeroOTB(item.compras_ano_passado);
      case "pedidos": return numeroOTB(item.pedidos);
      case "estoque": return numeroOTB(item.estoque);
      case "coberturaComPedido": return numeroOTB(item.coberturaComPedido);
      case "compraSugerida": return numeroOTB(item.compraSugerida);
      default: return "";
    }
  };

  lista.sort((a,b) => {
    const va = obterValorOrdenacao(a);
    const vb = obterValorOrdenacao(b);
    if(typeof va === "number" && typeof vb === "number"){
      const diferenca = va - vb;
      if(diferenca !== 0) return diferenca * direcao;
    }else{
      const comparacao = String(va).localeCompare(String(vb), "pt-BR", { numeric:true, sensitivity:"base" });
      if(comparacao !== 0) return comparacao * direcao;
    }
    return String(a.produto || "").localeCompare(String(b.produto || ""), "pt-BR", { numeric:true, sensitivity:"base" });
  });

  if(!lista.length){
    return '<div class="semDadosPDFOTB">Nenhum produto encontrado para os filtros selecionados.</div>';
  }

  const colunas = OTB_PDF_COLUNAS.filter(c => colunasSelecionadas.includes(c.chave));

  const valorCelula = (item, chave) => {
    const codigo = String(item.produto || "").trim();
    switch(chave){
      case "foto": {
        const src = codigo ? `${window.location.origin}/foto?codigo=${encodeURIComponent(codigo)}` : "";
        return src ? `<img class="fotoProdutoPDFOTB" src="${escaparPDFOTB(src)}" alt="Foto">` : "";
      }
      case "prioridade": return escaparPDFOTB(item.prioridadeCentral || "");
      case "fornecedor": return escaparPDFOTB(item.fornecedor || "SEM FORNECEDOR");
      case "produto": return produtoCompactoPDFOTB(item);
      case "marca": return escaparPDFOTB(item.marca || "SEM MARCA");
      case "complemento": return escaparPDFOTB(item.complemento || "SEM COMPLEMENTO");
      case "giro": return formatarGiroProdutoOTB(giroProdutoCentralOTB(item));
      case "giro_compras": return formatarGiroProdutoOTB(giroComprasProdutoCentralOTB(item));
      case "vendas": return formatarNum(item.vendas);
      case "venda_ano_passado": return formatarNum(item.venda_ano_passado);
      case "compras": return formatarNum(item.compras);
      case "compras_ano_passado": return formatarNum(item.compras_ano_passado);
      case "pedidos": return formatarNum(item.pedidos);
      case "estoque": return formatarNum(item.estoque);
      case "coberturaComPedido": return `${formatarNum(item.coberturaComPedido)} dias`;
      case "compraSugerida": return `<b>${formatarNum(item.compraSugerida)}</b>`;
      default: return "";
    }
  };

  const numericas = new Set([
    "giro", "giro_compras", "vendas", "venda_ano_passado", "compras",
    "compras_ano_passado", "pedidos", "estoque", "coberturaComPedido", "compraSugerida"
  ]);

  return `
    <table class="tabelaProdutosPDFOTB">
      <thead><tr>${colunas.map(c => `<th>${escaparPDFOTB(c.titulo)}</th>`).join("")}</tr></thead>
      <tbody>
        ${lista.slice(0,500).map(item => `
          <tr>
            ${colunas.map(c => `<td class="${numericas.has(c.chave) ? "num" : ""}">${valorCelula(item, c.chave)}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function aguardarImagensPDFOTB(raiz, limiteMs = 5000){
  const imagens = Array.from(raiz.querySelectorAll("img"));
  await Promise.race([
    Promise.all(imagens.map(img => img.complete ? Promise.resolve() : new Promise(resolve => {
      img.addEventListener("load", resolve, { once:true });
      img.addEventListener("error", resolve, { once:true });
    }))),
    new Promise(resolve => setTimeout(resolve, limiteMs))
  ]);
}

async function confirmarExportacaoPDFOTB(){
  const colunas = colunasMarcadasPDFOTB();

  if(!colunas.length){
    alert("Marque pelo menos um campo para exportar.");
    return;
  }

  /*
   * Abre a janela IMEDIATAMENTE no clique do usuário.
   * Assim Edge/Chrome não a tratam como pop-up tardio.
   */
  const janelaPDF = window.open(
    "",
    "_blank",
    "noopener=no,noreferrer=no"
  );

  if(!janelaPDF){
    alert(
      "O navegador bloqueou a janela do PDF. " +
      "Libere os pop-ups deste endereço e tente novamente."
    );
    return;
  }

  janelaPDF.document.open();
  janelaPDF.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <title>Preparando PDF...</title>
      <style>
        body{
          margin:0;
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          font-family:Arial,Helvetica,sans-serif;
          background:#fff;
          color:#0f172a;
        }
        .preparandoPDFOTB{
          font-size:20px;
          font-weight:800;
        }
      </style>
    </head>
    <body>
      <div class="preparandoPDFOTB">
        Preparando Central Estratégica de Produtos...
      </div>
    </body>
    </html>
  `);
  janelaPDF.document.close();

  salvarColunasPDFOTB(colunas);
  fecharSelecaoPDFOTB();

  await exportarPDFOTB(
    colunas,
    janelaPDF
  );
}

async function exportarPDFOTB(
  colunasSelecionadas = null,
  janelaExistente = null
){
  if(!Array.isArray(colunasSelecionadas)){
    abrirSelecaoPDFOTB();
    return;
  }

  const botao = document.querySelector('button[onclick*="exportarPDFOTB"]');
  const textoOriginal = botao?.textContent || "Exportar";

  let janela = janelaExistente;

  try{
    if(!OTB_DATASET_BASE.length){
      if(janela && !janela.closed) janela.close();
      alert("Faça uma consulta antes de exportar.");
      return;
    }

    if(botao){
      botao.disabled = true;
      botao.textContent = "Preparando PDF...";
    }

    const dadosTabelaPDFOTB = filtrarDatasetOTB();
    const tabela = montarTabelaProdutosPDFOTB(
      dadosTabelaPDFOTB,
      colunasSelecionadas
    );

    /*
     * Compatibilidade com chamadas diretas antigas:
     * se nenhuma janela foi entregue, tenta abrir agora.
     */
    if(!janela || janela.closed){
      janela = window.open("", "_blank");
    }

    if(!janela){
      alert(
        "O navegador bloqueou a janela do PDF. " +
        "Libere os pop-ups deste endereço e tente novamente."
      );
      return;
    }

    janela.document.open();
    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Central Estratégica de Produtos</title>
        <style>
          @page{size:A4 landscape;margin:7mm}
          *{box-sizing:border-box}
          html,body{margin:0;padding:0;background:#fff;color:#0f172a;font-family:Arial,Helvetica,sans-serif}
          .cabecalhoPDFOTB{margin:0 0 10px;padding:0 0 8px;border-bottom:2px solid #0f172a}
          .cabecalhoPDFOTB h1{margin:0 0 12px;font-size:32px;line-height:1.15;text-align:center}
          .filtrosPDFOTB{display:flex;flex-wrap:wrap;gap:8px 22px;font-size:18px;line-height:1.45}
          .filtrosPDFOTB div{white-space:normal}
          table{width:100%;border-collapse:collapse;table-layout:auto;font-size:10px;line-height:1.18}
          thead{display:table-header-group}
          tr{page-break-inside:avoid;break-inside:avoid}
          th,td{border:1px solid #94a3b8;padding:5px 5px;min-height:48px;vertical-align:middle;white-space:normal}
          th{background:#dbeafe;color:#020617;font-size:10px;font-weight:800;text-align:left;padding-top:5px;padding-bottom:5px}
          tbody tr:nth-child(even) td{background:#f8fafc}
          tbody tr{height:54px}
          tbody td{font-size:10px}
          tbody td:first-child{width:72px;min-width:72px;text-align:center}
          td.num{text-align:right;white-space:nowrap}
          .fotoProdutoPDFOTB{display:block;width:58px;height:58px;max-width:58px;max-height:58px;object-fit:contain;margin:auto}
          .semDadosPDFOTB{padding:28px;text-align:center;font-size:18px;font-weight:700}
          .produtoCompactoPDFOTB{width:150px;max-width:150px;font-size:10px;line-height:1.18}
          .produtoLinha1PDFOTB,.produtoLinha2PDFOTB{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .produtoLinha1PDFOTB{font-weight:800}
          .produtoLinha2PDFOTB{margin-top:2px}

          .linhaDistribuicaoEmpresaPDFOTB td{padding:5px 8px 10px!important;background:#fff!important;border-top:0!important}
          .boxDistribuicaoEmpresaPDFOTB{padding:5px 4px 8px 18px;border-left:4px solid #2563eb;background:#f8fafc}
          .boxDistribuicaoEmpresaPDFOTB .tituloDistribuicaoEmpresaOTB{margin:0 0 5px;color:#1e3a8a;font-size:11px;font-weight:800;text-transform:uppercase}
          .tabelaDistribuicaoEmpresaPDFOTB{width:100%!important;border-collapse:collapse!important;table-layout:auto!important;font-size:10px!important}
          .tabelaDistribuicaoEmpresaPDFOTB th,.tabelaDistribuicaoEmpresaPDFOTB td{min-height:0!important;height:auto!important;padding:4px 5px!important;border:1px solid #cbd5e1!important;font-size:10px!important}
          .tabelaDistribuicaoEmpresaPDFOTB th{background:#eff6ff!important;color:#0f172a!important}
          .tabelaDistribuicaoEmpresaPDFOTB td.num{text-align:right!important}
          .distribuicaoEmpresaVaziaPDFOTB{padding:5px;font-size:10px;color:#64748b}
          .linhaDistribuicaoEmpresaPDFOTB,.linhaDistribuicaoEmpresaPDFOTB>td{height:auto!important;min-height:0!important}
          .linhaDistribuicaoEmpresaPDFOTB>td{padding:2px 4px 5px!important}
          .boxDistribuicaoEmpresaPDFOTB{padding:3px 3px 4px 12px!important}
          .boxDistribuicaoEmpresaPDFOTB .tituloDistribuicaoEmpresaOTB{margin:0 0 3px!important;font-size:9px!important;line-height:1!important}
          .tabelaDistribuicaoEmpresaPDFOTB{width:100%!important;border-collapse:collapse!important;border-spacing:0!important;table-layout:fixed!important;margin:0!important}
          .tabelaDistribuicaoEmpresaPDFOTB tr{height:18px!important;min-height:18px!important;max-height:18px!important}
          .tabelaDistribuicaoEmpresaPDFOTB th,.tabelaDistribuicaoEmpresaPDFOTB td{height:18px!important;min-height:18px!important;max-height:18px!important;padding:2px 3px!important;line-height:1!important;font-size:8px!important;vertical-align:middle!important;white-space:nowrap!important}
          .tabelaDistribuicaoEmpresaPDFOTB th:first-child,.tabelaDistribuicaoEmpresaPDFOTB td:first-child{width:48px!important}
          /* Empresas mais legíveis que a linha principal */
          .boxDistribuicaoEmpresaPDFOTB .tituloDistribuicaoEmpresaOTB{
            font-size:11px!important;
            line-height:1.15!important;
            margin:0 0 4px!important;
          }
          .tabelaDistribuicaoEmpresaPDFOTB tr{
            height:22px!important;
            min-height:22px!important;
            max-height:22px!important;
          }
          .tabelaDistribuicaoEmpresaPDFOTB th{
            font-size:10px!important;
            line-height:1.05!important;
            padding:3px 4px!important;
            font-weight:800!important;
          }
          .tabelaDistribuicaoEmpresaPDFOTB td{
            font-size:11px!important;
            line-height:1.05!important;
            padding:3px 4px!important;
            font-weight:700!important;
          }
          .tabelaDistribuicaoEmpresaPDFOTB th:first-child,
          .tabelaDistribuicaoEmpresaPDFOTB td:first-child{
            width:52px!important;
          }

        </style>
      </head>
      <body>
        ${cabecalhoRelatorioPDFOTB()}
        ${tabela}
      </body>
      </html>
    `);
    janela.document.close();

    await new Promise(resolve => {
      if(janela.document.readyState === "complete") resolve();
      else {
        janela.addEventListener("load", resolve, { once:true });
        setTimeout(resolve, 1800);
      }
    });

    await aguardarImagensPDFOTB(janela.document, 5000);
    janela.focus();
    janela.print();
  }catch(e){
    console.error("Erro ao exportar PDF OTB:", e);

    if(janela && !janela.closed){
      try{
        janela.document.open();
        janela.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <title>Erro ao preparar PDF</title>
          </head>
          <body style="font-family:Arial;padding:30px">
            <h2>Não foi possível preparar o PDF.</h2>
            <p>${escaparPDFOTB(e.message || "Erro desconhecido")}</p>
          </body>
          </html>
        `);
        janela.document.close();
      }catch(_){}
    }

    alert("Não foi possível preparar o PDF: " + e.message);
  }finally{
    if(botao){
      botao.disabled = false;
      botao.textContent = textoOriginal;
    }
  }
}

document.addEventListener("keydown", evento => {
  if(evento.key === "Escape" && document.getElementById("modalExportarPDFOTB")?.classList.contains("aberto")){
    fecharSelecaoPDFOTB();
  }
});

document.addEventListener("click", evento => {
  const modal = document.getElementById("modalExportarPDFOTB");
  if(evento.target === modal) fecharSelecaoPDFOTB();
});



/* =========================================================
   PLANEJAMENTO DE COMPRAS — DUAS VISÕES HIERÁRQUICAS
   A implementação abaixo substitui apenas a renderização
   da tabela consolidada. Os gráficos e os cálculos existentes
   continuam preservados.
   ========================================================= */

let OTB_GRUPO_PLANEJAMENTO_ABERTO = "";

function usarApenasUmaVisaoPlanejamentoOTB(){
  return document.getElementById("usarUmaVisaoPlanejamentoOTB")?.checked !== false;
}

function obterCampoVisaoPlanejamento2OTB(){
  return document.getElementById("visaoPlanejamento2OTB")?.value || "grupo";
}

function nomesCamposPlanejamentoOTB(){
  return {
    fornecedor:"Fornecedor",
    complemento:"Complemento",
    campanha:"Campanha",
    marca:"Marca",
    departamento:"Departamento",
    grupo:"Grupo",
    subgrupo:"Subgrupo",
    linha:"Linha",
    cor:"Cor",
    numeracao:"Numeração",
    preco_venda:"Preço de Venda",
    empresa:"Empresa"
  };
}

function atualizarEstadoDuasVisoesPlanejamentoOTB(){
  const uma = usarApenasUmaVisaoPlanejamentoOTB();
  const bloco = document.getElementById("blocoVisaoPlanejamento2OTB");
  if(bloco) bloco.hidden = uma;

  const visao1 = document.getElementById("visaoPlanejamentoOTB");
  const visao2 = document.getElementById("visaoPlanejamento2OTB");

  if(!uma && visao1 && visao2 && visao1.value === visao2.value){
    const alternativa = [...visao2.options].find(op => op.value !== visao1.value);
    if(alternativa) visao2.value = alternativa.value;
  }
}

function calcularLinhaPlanejamentoOTB(x, campo, meta, meses){
  const previsaoPeriodo =
    (numeroOTB(x.venda_ano_passado) + numeroOTB(x.venda_ano_retrasado)) / 2;

  const mediaMensal = previsaoPeriodo > 0 ? previsaoPeriodo / meses : 0;
  const estoque = numeroOTB(x.estoque);
  const pedidos = numeroOTB(x.pedidos);
  const estoqueProjetado = estoque + pedidos;
  const coberturaAtual = mediaMensal > 0 ? estoqueProjetado / mediaMensal : 0;
  const estoqueFinalDesejado = mediaMensal * meta;
  const necessidadeTotal = previsaoPeriodo + estoqueFinalDesejado;
  const compraSugerida = Math.max(
    0,
    Math.ceil(necessidadeTotal - estoqueProjetado)
  );

  const visao = x.nome || x.valor || "SEM INFORMAÇÃO";

  return {
    ...x,
    visao,
    previsaoPeriodo,
    mediaMensal,
    estoqueProjetado,
    coberturaAtual,
    metaCobertura: meta,
    estoqueFinalDesejado,
    necessidadeTotal,
    compraSugerida,
    chaveLinha: `${campo}::${visao}`
  };
}

function celulasNumericasPlanejamentoOTB(x){
  const dec = v => numeroOTB(v).toLocaleString("pt-BR",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });

  return `
    <td>${formatarNum(x.vendas)}</td>
    <td>${formatarNum(x.venda_ano_passado)}</td>
    <td>${formatarNum(x.venda_ano_retrasado)}</td>
    <td>${formatarNum(x.compras)}</td>
    <td>${formatarNum(x.compras_ano_passado)}</td>
    <td>${formatarNum(x.compras_ano_retrasado)}</td>
    <td>${formatarNum(x.pedidos)}</td>
    <td>${formatarNum(x.estoque)}</td>
    <td>${formatarNum(Math.round(x.previsaoPeriodo))}</td>
    <td>${formatarNum(Math.round(x.mediaMensal))}</td>
    <td>${formatarNum(x.estoqueProjetado)}</td>
    <td>${dec(x.coberturaAtual)} meses</td>
    <td>${dec(x.metaCobertura)} meses</td>
    <td>${formatarNum(Math.ceil(x.estoqueFinalDesejado))}</td>
    <td>${formatarNum(Math.ceil(x.necessidadeTotal))}</td>
    <td class="${x.compraSugerida>0?"compraPositivaOTB":"compraZeroOTB"}">
      ${formatarNum(x.compraSugerida)}
    </td>
  `;
}

function alternarGrupoPlanejamentoOTB(chaveCodificada){
  const chave = decodeURIComponent(chaveCodificada || "");
  OTB_GRUPO_PLANEJAMENTO_ABERTO =
    OTB_GRUPO_PLANEJAMENTO_ABERTO === chave ? "" : chave;

  OTB_ITEM_PLANEJAMENTO_ABERTO = "";

  renderResumoConsolidadoVisaoOTB(
    filtrarDatasetOTB(),
    obterCampoVisaoPlanejamentoOTB()
  );
}

function renderResumoConsolidadoVisaoOTB(dados, campo){
  dados = Array.isArray(dados) ? dados : [];

  const campo1 = obterCampoVisaoPlanejamentoOTB();
  const duasVisoes = !usarApenasUmaVisaoPlanejamentoOTB();
  let campo2 = obterCampoVisaoPlanejamento2OTB();

  if(duasVisoes && campo2 === campo1){
    const select2 = document.getElementById("visaoPlanejamento2OTB");
    const alternativa = select2
      ? [...select2.options].find(op => op.value !== campo1)
      : null;

    if(alternativa){
      campo2 = alternativa.value;
      select2.value = campo2;
    }
  }

  const corpo = document.getElementById("corpoResumoVisaoOTB");
  const cab = document.getElementById("cabecalhoResumoVisaoOTB");
  const rodape = document.getElementById("rodapeResumoVisaoOTB");

  if(!corpo || !cab || !rodape) return;

  const nomes = nomesCamposPlanejamentoOTB();
  const nome1 = nomes[campo1] || "Visão 1";
  const nome2 = nomes[campo2] || "Visão 2";

  const titulo = document.getElementById("tituloTabelaResumoVisaoOTB");
  if(titulo){
    titulo.textContent = duasVisoes
      ? `Planejamento de compras por ${nome1} → ${nome2}`
      : `Planejamento de compras por ${nome1}`;
  }

  const tituloPrimeiraColuna = duasVisoes
    ? `${nome1} / ${nome2}`
    : nome1;

  cab.innerHTML = [
    cabecalhoResumoOTB("visao", tituloPrimeiraColuna),
    cabecalhoResumoOTB("vendas", "Vendas deste ano"),
    cabecalhoResumoOTB("venda_ano_passado", "Venda ano passado"),
    cabecalhoResumoOTB("venda_ano_retrasado", "Venda ano retrasado"),
    cabecalhoResumoOTB("compras", "Compras deste ano"),
    cabecalhoResumoOTB("compras_ano_passado", "Compra ano passado"),
    cabecalhoResumoOTB("compras_ano_retrasado", "Compra ano retrasado"),
    cabecalhoResumoOTB("pedidos", "Pedidos"),
    cabecalhoResumoOTB("estoque", "Estoque atual"),
    cabecalhoResumoOTB("previsaoPeriodo", "Venda prevista"),
    cabecalhoResumoOTB("mediaMensal", "Média mensal"),
    cabecalhoResumoOTB("estoqueProjetado", "Estoque + pedidos"),
    cabecalhoResumoOTB("coberturaAtual", "Cobertura atual"),
    cabecalhoResumoOTB("metaCobertura", "Meta"),
    cabecalhoResumoOTB("estoqueFinalDesejado", "Estoque final desejado"),
    cabecalhoResumoOTB("necessidadeTotal", "Necessidade total"),
    cabecalhoResumoOTB("compraSugerida", "Comprar")
  ].join("");

  const meses = Math.max(0.1, mesesEntreDatasOTB());
  const meta = obterMetaCoberturaMesesOTB();

  let nivel1 = agruparPor(dados,campo1,0)
    .map(x => calcularLinhaPlanejamentoComMesesOTB(x,campo1,meta,meses,dados));

  const {campo:ord,direcao} = OTB_ORDEM_RESUMO_VISAO;

  nivel1.sort((a,b)=>{
    const av = ord === "visao" ? String(a.visao) : numeroOTB(a[ord]);
    const bv = ord === "visao" ? String(b.visao) : numeroOTB(b[ord]);
    const r = typeof av === "string"
      ? av.localeCompare(bv,"pt-BR")
      : av-bv;
    return direcao === "asc" ? r : -r;
  });

  if(!nivel1.length){
    corpo.innerHTML =
      '<tr><td colspan="17">Nenhum dado encontrado para os filtros informados.</td></tr>';
    rodape.innerHTML = "";
    return;
  }

  if(!duasVisoes){
    corpo.innerHTML = nivel1.map(x=>`
      <tr
        class="linhaPlanejamentoOTB"
        onclick="alternarDetalhePlanejamentoOTB('${encodeURIComponent(x.chaveLinha)}')"
      >
        <td class="celulaNomePlanejamentoOTB">
          <span class="setaDetalheOTB">
            ${OTB_ITEM_PLANEJAMENTO_ABERTO===x.chaveLinha?"▼":"▶"}
          </span>
          <span class="nomePlanejamentoOTB">
            ${escaparHTMLFotoOTB(x.visao)}
          </span>
        </td>
        ${celulasNumericasPlanejamentoOTB(x)}
      </tr>
      ${linhaDetalheMensalOTB(x,dados,campo1)}
    `).join("");
  }else{
    const partes = [];

    for(const grupo of nivel1){
      const chaveGrupo = `${campo1}::${grupo.visao}`;
      const grupoAberto = OTB_GRUPO_PLANEJAMENTO_ABERTO === chaveGrupo;

      partes.push(`
        <tr
          class="linhaPlanejamentoOTB linhaPlanejamentoNivel1OTB"
          onclick="alternarGrupoPlanejamentoOTB('${encodeURIComponent(chaveGrupo)}')"
        >
          <td class="celulaNomePlanejamentoOTB">
            <span class="setaDetalheOTB">${grupoAberto?"▼":"▶"}</span>
            <span class="nomeNivelPlanejamentoOTB">
              <span class="rotuloNivelPlanejamentoOTB">${escaparHTMLFotoOTB(nome1)}</span>
              <span class="nomePlanejamentoOTB">${escaparHTMLFotoOTB(grupo.visao)}</span>
            </span>
          </td>
          ${celulasNumericasPlanejamentoOTB(grupo)}
        </tr>
      `);

      if(!grupoAberto) continue;

      const valorGrupoNivel1 = campo1 === "empresa"
        ? String(grupo.valor || grupo.empresa || "").padStart(2,"0")
        : grupo.visao;

      const dadosGrupo = dados.filter(
        item => valorDimensaoOTB(item,campo1) === valorGrupoNivel1
      );

      let nivel2 = agruparPor(dadosGrupo,campo2,0)
        .map(x => calcularLinhaPlanejamentoComMesesOTB(x,campo2,meta,meses,dadosGrupo));

      nivel2.sort((a,b)=>{
        const av = ord === "visao" ? String(a.visao) : numeroOTB(a[ord]);
        const bv = ord === "visao" ? String(b.visao) : numeroOTB(b[ord]);
        const r = typeof av === "string"
          ? av.localeCompare(bv,"pt-BR")
          : av-bv;
        return direcao === "asc" ? r : -r;
      });

      for(const filho of nivel2){
        filho.chaveLinha =
          `${campo1}::${grupo.visao}||${campo2}::${filho.visao}`;

        partes.push(`
          <tr
            class="linhaPlanejamentoOTB linhaPlanejamentoNivel2OTB"
            onclick="alternarDetalhePlanejamentoOTB('${encodeURIComponent(filho.chaveLinha)}')"
          >
            <td class="celulaNomePlanejamentoOTB">
              <span class="setaDetalheOTB">
                ${OTB_ITEM_PLANEJAMENTO_ABERTO===filho.chaveLinha?"▼":"▶"}
              </span>
              <span class="nomeNivelPlanejamentoOTB">
                <span class="rotuloNivelPlanejamentoOTB">${escaparHTMLFotoOTB(nome2)}</span>
                <span class="nomePlanejamentoOTB">${escaparHTMLFotoOTB(filho.visao)}</span>
              </span>
            </td>
            ${celulasNumericasPlanejamentoOTB(filho)}
          </tr>
        `);

        if(OTB_ITEM_PLANEJAMENTO_ABERTO === filho.chaveLinha){
          /* O conjunto já está restrito à Visão 1.
             A função mensal filtra novamente pela Visão 2. */
          partes.push(linhaDetalheMensalOTB(filho,dadosGrupo,campo2));
        }
      }
    }

    corpo.innerHTML = partes.join("");
  }

  const soma = c => nivel1.reduce((t,i)=>t+numeroOTB(i[c]),0);
  const mediaTotal = soma("mediaMensal");
  const estProj = soma("estoqueProjetado");
  const dec = v => numeroOTB(v).toLocaleString("pt-BR",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });

  rodape.innerHTML = `<tr>
    <td>TOTAL</td>
    <td>${formatarNum(soma("vendas"))}</td>
    <td>${formatarNum(soma("venda_ano_passado"))}</td>
    <td>${formatarNum(soma("venda_ano_retrasado"))}</td>
    <td>${formatarNum(soma("compras"))}</td>
    <td>${formatarNum(soma("compras_ano_passado"))}</td>
    <td>${formatarNum(soma("compras_ano_retrasado"))}</td>
    <td>${formatarNum(soma("pedidos"))}</td>
    <td>${formatarNum(soma("estoque"))}</td>
    <td>${formatarNum(Math.round(soma("previsaoPeriodo")))}</td>
    <td>${formatarNum(Math.round(mediaTotal))}</td>
    <td>${formatarNum(estProj)}</td>
    <td>${dec(mediaTotal>0?estProj/mediaTotal:0)} meses</td>
    <td>${dec(meta)} meses</td>
    <td>${formatarNum(Math.ceil(soma("estoqueFinalDesejado")))}</td>
    <td>${formatarNum(Math.ceil(soma("necessidadeTotal")))}</td>
    <td>${formatarNum(soma("compraSugerida"))}</td>
  </tr>`;
}

document.addEventListener("DOMContentLoaded", ()=>{
  const umaVisao = document.getElementById("usarUmaVisaoPlanejamentoOTB");
  const visao1 = document.getElementById("visaoPlanejamentoOTB");
  const visao2 = document.getElementById("visaoPlanejamento2OTB");

  const reconstruir = ()=>{
    atualizarEstadoDuasVisoesPlanejamentoOTB();
    OTB_GRUPO_PLANEJAMENTO_ABERTO = "";
    OTB_ITEM_PLANEJAMENTO_ABERTO = "";
    renderResumoConsolidadoVisaoOTB(
      filtrarDatasetOTB(),
      obterCampoVisaoPlanejamentoOTB()
    );
  };

  umaVisao?.addEventListener("change", reconstruir);

  visao1?.addEventListener("change", ()=>{
    if(
      !usarApenasUmaVisaoPlanejamentoOTB() &&
      visao2 &&
      visao2.value === visao1.value
    ){
      const alternativa = [...visao2.options]
        .find(op => op.value !== visao1.value);
      if(alternativa) visao2.value = alternativa.value;
    }
    reconstruir();
  });

  visao2?.addEventListener("change", ()=>{
    if(visao1 && visao2.value === visao1.value){
      const alternativa = [...visao2.options]
        .find(op => op.value !== visao1.value);
      if(alternativa) visao2.value = alternativa.value;
    }
    reconstruir();
  });

  atualizarEstadoDuasVisoesPlanejamentoOTB();
});


/* =========================================================
   PLANEJAMENTO HIERÁRQUICO → FILTRO DA TABELA DE PRODUTOS
   ========================================================= */

function filtrarProdutosPelaChavePlanejamentoOTB(chave){
  const dadosBase = filtrarDatasetOTB();
  const texto = String(chave || "").trim();

  if(!texto){
    renderCentralEstrategicaProdutosOTB(dadosBase);
    return dadosBase;
  }

  const filtros = texto
    .split("||")
    .map(parte => {
      const pos = parte.indexOf("::");
      if(pos < 0) return null;

      return {
        campo: parte.slice(0,pos),
        valor: parte.slice(pos+2)
      };
    })
    .filter(Boolean);

  const filtrados = dadosBase.filter(item =>
    filtros.every(filtro =>
      valorDimensaoOTB(item,filtro.campo) === filtro.valor
    )
  );

  renderCentralEstrategicaProdutosOTB(filtrados);

  const tabelaProdutos = document.getElementById("tblCentralProdutosOTB");
  if(tabelaProdutos){
    tabelaProdutos.dataset.filtroPlanejamento = texto;
  }

  return filtrados;
}

function rolarAteTabelaProdutosOTB(){
  const tabela = document.getElementById("tblCentralProdutosOTB");
  if(!tabela) return;

  /* Não força a rolagem para não tirar o comprador da análise.
     A tabela é atualizada imediatamente e permanece pronta abaixo. */
}

function alternarDetalhePlanejamentoOTB(chaveCodificada){
  const chave = decodeURIComponent(String(chaveCodificada || ""));
  const estavaAberto = OTB_ITEM_PLANEJAMENTO_ABERTO === chave;

  OTB_ITEM_PLANEJAMENTO_ABERTO = estavaAberto ? "" : chave;

  if(estavaAberto){
    filtrarProdutosPelaChavePlanejamentoOTB("");
  }else{
    filtrarProdutosPelaChavePlanejamentoOTB(chave);
  }

  renderResumoConsolidadoVisaoOTB(
    filtrarDatasetOTB(),
    obterCampoVisaoPlanejamentoOTB()
  );

  rolarAteTabelaProdutosOTB();
}

function alternarGrupoPlanejamentoOTB(chaveCodificada){
  const chave = decodeURIComponent(chaveCodificada || "");
  const estavaAberto = OTB_GRUPO_PLANEJAMENTO_ABERTO === chave;

  OTB_GRUPO_PLANEJAMENTO_ABERTO = estavaAberto ? "" : chave;
  OTB_ITEM_PLANEJAMENTO_ABERTO = "";

  if(estavaAberto){
    filtrarProdutosPelaChavePlanejamentoOTB("");
  }else{
    filtrarProdutosPelaChavePlanejamentoOTB(chave);
  }

  renderResumoConsolidadoVisaoOTB(
    filtrarDatasetOTB(),
    obterCampoVisaoPlanejamentoOTB()
  );

  rolarAteTabelaProdutosOTB();
}

/* Ao trocar uma ou duas visões, elimina o filtro local anterior
   e devolve a tabela de produtos aos filtros gerais do painel. */
document.addEventListener("DOMContentLoaded",()=>{
  [
    "usarUmaVisaoPlanejamentoOTB",
    "visaoPlanejamentoOTB",
    "visaoPlanejamento2OTB"
  ].forEach(id=>{
    document.getElementById(id)?.addEventListener("change",()=>{
      const tabelaProdutos = document.getElementById("tblCentralProdutosOTB");
      if(tabelaProdutos?.dataset?.filtroPlanejamento){
        delete tabelaProdutos.dataset.filtroPlanejamento;
      }

      renderCentralEstrategicaProdutosOTB(filtrarDatasetOTB());
    });
  });
});


/* =========================================================
   REGRA DEFINITIVA — RELAÇÃO ESTOQUE/VENDA 3:1, 4:1 OU 5:1

   3:1 significa:
   para cada 1 par previsto para vender, manter 3 pares
   disponíveis antes da venda do mês.
   ========================================================= */

function obterMetaCoberturaMesesOTB(){
  const seletor = document.getElementById("coberturaAlvoOTB");
  const personalizado = document.getElementById("coberturaPersonalizadaOTB");
  const bruto =
    seletor?.value === "personalizada"
      ? personalizado?.value
      : seletor?.value;

  const valor = Number(bruto || 3);
  return Number.isFinite(valor) && valor > 0 ? valor : 3;
}

Object.assign(OTB_EXPLICACOES_RESUMO,{
  mediaMensal:[
    "Venda média mensal prevista",
    "Divide a previsão total do período pela quantidade aproximada de meses selecionados. Essa informação serve como referência, mas a relação 3:1 é calculada diretamente sobre a previsão de venda."
  ],
  coberturaAtual:[
    "Relação atual estoque/venda",
    "Mostra quantos pares existem entre estoque e pedidos para cada par previsto para vender no período.\n\nFórmula:\n(Estoque atual + Pedidos) ÷ Venda prevista do período.\n\nExemplo: resultado 2,4 significa 2,4 pares disponíveis para cada 1 par previsto de venda."
  ],
  metaCobertura:[
    "Relação estoque/venda escolhida",
    "3:1 significa manter 3 pares disponíveis para cada 1 par previsto de venda. 4:1 significa 4 pares para cada 1, e 5:1 significa 5 pares para cada 1."
  ],
  estoqueFinalDesejado:[
    "Estoque-alvo pela relação",
    "Calcula quanto estoque e pedidos deveriam estar disponíveis para atender a relação escolhida.\n\nFórmula:\nVenda prevista do período × Relação estoque/venda.\n\nExemplo: previsão de 2.000 pares × 3 = estoque-alvo de 6.000 pares."
  ],
  necessidadeTotal:[
    "Estoque-alvo total",
    "É o total de pares que deveria estar disponível conforme a relação escolhida. Não soma novamente a venda prevista, porque ela já é a base multiplicada pela relação.\n\nFórmula:\nVenda prevista × 3, 4 ou 5."
  ],
  compraSugerida:[
    "Sugestão de compra",
    "Mostra quanto falta para estoque atual mais pedidos alcançarem a relação selecionada.\n\nFórmula:\nEstoque-alvo − Estoque atual − Pedidos.\n\nNo detalhamento mensal, o saldo final de cada mês passa a ser o estoque inicial do mês seguinte."
  ]
});

function calcularLinhaPlanejamentoOTB(x,campo,meta,meses){
  const previsaoPeriodo =
    (numeroOTB(x.venda_ano_passado) +
     numeroOTB(x.venda_ano_retrasado)) / 2;

  const mediaMensal =
    previsaoPeriodo > 0 ? previsaoPeriodo / Math.max(0.1,meses) : 0;

  const estoque = numeroOTB(x.estoque);
  const pedidos = numeroOTB(x.pedidos);
  const estoqueProjetado = estoque + pedidos;

  /* Relação atual: quantos pares disponíveis existem para cada
     par previsto para vender em todo o período. */
  const coberturaAtual =
    previsaoPeriodo > 0 ? estoqueProjetado / previsaoPeriodo : 0;

  /* 3:1 = previsão × 3. */
  const estoqueFinalDesejado = previsaoPeriodo * meta;
  const necessidadeTotal = estoqueFinalDesejado;

  const compraSugerida = Math.max(
    0,
    Math.ceil(estoqueFinalDesejado - estoqueProjetado)
  );

  const visao = x.nome || x.valor || "SEM INFORMAÇÃO";

  return {
    ...x,
    visao,
    previsaoPeriodo,
    mediaMensal,
    estoqueProjetado,
    coberturaAtual,
    metaCobertura:meta,
    estoqueFinalDesejado,
    necessidadeTotal,
    compraSugerida,
    chaveLinha:`${campo}::${visao}`
  };
}

function celulasNumericasPlanejamentoOTB(x){
  const dec = v => numeroOTB(v).toLocaleString("pt-BR",{
    minimumFractionDigits:2,
    maximumFractionDigits:2
  });

  return `
    <td>${formatarNum(x.vendas)}</td>
    <td>${formatarNum(x.venda_ano_passado)}</td>
    <td>${formatarNum(x.venda_ano_retrasado)}</td>
    <td>${formatarNum(x.compras)}</td>
    <td>${formatarNum(x.compras_ano_passado)}</td>
    <td>${formatarNum(x.compras_ano_retrasado)}</td>
    <td>${formatarNum(x.pedidos)}</td>
    <td>${formatarNum(x.estoque)}</td>
    <td>${formatarNum(Math.round(x.previsaoPeriodo))}</td>
    <td>${formatarNum(Math.round(x.mediaMensal))}</td>
    <td>${formatarNum(x.estoqueProjetado)}</td>
    <td>${dec(x.coberturaAtual)}:1</td>
    <td>${numeroOTB(x.metaCobertura).toLocaleString("pt-BR")} : 1</td>
    <td>${formatarNum(Math.ceil(x.estoqueFinalDesejado))}</td>
    <td>${formatarNum(Math.ceil(x.necessidadeTotal))}</td>
    <td class="${x.compraSugerida>0?"compraPositivaOTB":"compraZeroOTB"}">
      ${formatarNum(x.compraSugerida)}
    </td>
  `;
}

function montarDistribuicaoMensalOTB(item,dadosFiltrados,campo){
  const meses = mesesPlanejamentoOTB();
  if(!meses.length) return [];

  const produtos = new Set(
    dadosFiltrados
      .filter(x => valorDimensaoOTB(x,campo) === item.visao)
      .map(chaveProdutoPlanejamentoOTB)
      .filter(Boolean)
  );

  const porMes = new Map(meses.map(m => [m.chave,{
    ...m,
    vendaAP:0,
    vendaAR:0,
    pedidos:0
  }]));

  for(const x of (Array.isArray(OTB_TIMELINE_DATASET)
    ? OTB_TIMELINE_DATASET
    : [])){
    const prod = chaveProdutoPlanejamentoOTB(x);

    if(produtos.size && prod && !produtos.has(prod)) continue;
    if(!produtos.size && valorDimensaoOTB(x,campo) !== item.visao) continue;

    const d = dataLinhaPlanejamentoOTB(x);
    if(!d) continue;

    const chave =
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;

    const r = porMes.get(chave);
    if(!r) continue;

    r.vendaAP += numeroOTB(
      x.venda_ano_passado ?? x.vendas_ano_passado
    );
    r.vendaAR += numeroOTB(
      x.venda_ano_retrasado ?? x.vendas_ano_retrasado
    );
    r.pedidos += numeroOTB(
      x.pedidos ?? x.qtd_pedidos ?? x.quantidade_pedido
    );
  }

  const arr = [...porMes.values()];
  let somaHistorica = arr.reduce(
    (s,m)=>s + ((m.vendaAP+m.vendaAR)/2),
    0
  );

  if(somaHistorica <= 0){
    const pesoIgual = 1/arr.length;
    arr.forEach(m=>{
      m.mediaHistorica = item.previsaoPeriodo*pesoIgual;
      m.peso = pesoIgual;
    });
  }else{
    arr.forEach(m=>{
      m.mediaHistorica = (m.vendaAP+m.vendaAR)/2;
      m.peso = m.mediaHistorica/somaHistorica;
    });
  }

  const somaPesos = arr.reduce((s,m)=>s+m.peso,0) || 1;

  arr.forEach(m=>{
    m.peso /= somaPesos;
    m.vendaPrevista = item.previsaoPeriodo*m.peso;
  });

  const pedidosTimeline = arr.reduce((s,m)=>s+m.pedidos,0);

  if(pedidosTimeline <= 0 && numeroOTB(item.pedidos)>0){
    arr[0].pedidos = numeroOTB(item.pedidos);
  }else if(
    pedidosTimeline > 0 &&
    Math.abs(pedidosTimeline-numeroOTB(item.pedidos))>0.5
  ){
    const fator = numeroOTB(item.pedidos)/pedidosTimeline;
    arr.forEach(m=>m.pedidos*=fator);
  }

  let estoque = numeroOTB(item.estoque);
  const relacao = numeroOTB(item.metaCobertura) || 3;

  for(const m of arr){
    const estoqueInicial = estoque;

    /* Regra mensal:
       previsão do mês × relação escolhida. */
    const estoqueAlvo = m.vendaPrevista*relacao;

    const compra = Math.max(
      0,
      Math.ceil(
        estoqueAlvo -
        estoqueInicial -
        numeroOTB(m.pedidos)
      )
    );

    const disponivel =
      estoqueInicial +
      numeroOTB(m.pedidos) +
      compra;

    const estoqueFinal =
      disponivel -
      m.vendaPrevista;

    m.estoqueInicial = estoqueInicial;
    m.estoqueAlvo = estoqueAlvo;
    m.compraSugerida = compra;
    m.estoqueFinal = estoqueFinal;

    /* Relação antes da venda, depois de receber pedidos e compra. */
    m.relacaoAtendida =
      m.vendaPrevista > 0
        ? disponivel/m.vendaPrevista
        : 0;

    estoque = estoqueFinal;
  }

  return arr;
}

function linhaDetalheMensalOTB(item,dadosFiltrados,campo){
  if(OTB_ITEM_PLANEJAMENTO_ABERTO !== item.chaveLinha) return "";

  const meses = montarDistribuicaoMensalOTB(
    item,
    dadosFiltrados,
    campo
  );

  const linhas = meses.map(m=>`
    <tr>
      <td>${escaparHTMLFotoOTB(m.nome)}</td>
      <td class="num">${formatarNum(Math.round(m.vendaAP))}</td>
      <td class="num">${formatarNum(Math.round(m.vendaAR))}</td>
      <td class="num">${formatarNum(Math.round(m.mediaHistorica))}</td>
      <td class="num">${(m.peso*100).toLocaleString("pt-BR",{
        minimumFractionDigits:1,
        maximumFractionDigits:1
      })}%</td>
      <td class="num">${formatarNum(Math.round(m.vendaPrevista))}</td>
      <td class="num">${formatarNum(Math.round(m.estoqueInicial))}</td>
      <td class="num">${formatarNum(Math.round(m.pedidos))}</td>
      <td class="num">${formatarNum(Math.ceil(m.estoqueAlvo))}</td>
      <td class="num compraPositivaOTB">${formatarNum(m.compraSugerida)}</td>
      <td class="num">${formatarNum(Math.round(m.estoqueFinal))}</td>
      <td class="num">${m.relacaoAtendida.toLocaleString("pt-BR",{
        minimumFractionDigits:2,
        maximumFractionDigits:2
      })}:1</td>
    </tr>
  `).join("");

  return `
    <tr class="linhaDetalhePlanejamentoOTB">
      <td colspan="17">
        <div class="detalhePlanejamentoMensalOTB">
          <div class="tituloDetalhePlanejamentoOTB">
            Distribuição mensal — ${escaparHTMLFotoOTB(item.visao)}
            <small>
              A previsão mensal considera a variação dos mesmos meses
              do ano passado e do ano retrasado. A compra mantém
              ${numeroOTB(item.metaCobertura)}:1 em cada mês.
            </small>
          </div>

          <div class="tabelaDetalheMensalWrapOTB">
            <table>
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Venda AP</th>
                  <th>Venda AR</th>
                  <th>Média histórica</th>
                  <th>Peso do mês</th>
                  <th>Venda prevista</th>
                  <th>Estoque inicial</th>
                  <th>Pedidos</th>
                  <th>Estoque-alvo ${numeroOTB(item.metaCobertura)}:1</th>
                  <th>Comprar</th>
                  <th>Estoque final</th>
                  <th>Relação atendida</th>
                </tr>
              </thead>

              <tbody>${linhas}</tbody>

              <tfoot>
                <tr>
                  <td>TOTAL</td>
                  <td>${formatarNum(Math.round(
                    meses.reduce((s,m)=>s+m.vendaAP,0)
                  ))}</td>
                  <td>${formatarNum(Math.round(
                    meses.reduce((s,m)=>s+m.vendaAR,0)
                  ))}</td>
                  <td>${formatarNum(Math.round(
                    meses.reduce((s,m)=>s+m.mediaHistorica,0)
                  ))}</td>
                  <td>100%</td>
                  <td>${formatarNum(Math.round(
                    meses.reduce((s,m)=>s+m.vendaPrevista,0)
                  ))}</td>
                  <td>—</td>
                  <td>${formatarNum(Math.round(
                    meses.reduce((s,m)=>s+m.pedidos,0)
                  ))}</td>
                  <td>—</td>
                  <td>${formatarNum(
                    meses.reduce((s,m)=>s+m.compraSugerida,0)
                  )}</td>
                  <td>${formatarNum(Math.round(
                    meses.length
                      ? meses[meses.length-1].estoqueFinal
                      : 0
                  ))}</td>
                  <td>${numeroOTB(item.metaCobertura)}:1</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </td>
    </tr>
  `;
}

/* Atualiza títulos da tabela principal para a nova interpretação. */
const _renderResumoRelacaoOTB = renderResumoConsolidadoVisaoOTB;

renderResumoConsolidadoVisaoOTB = function(dados,campo){
  _renderResumoRelacaoOTB(dados,campo);

  const cab = document.getElementById("cabecalhoResumoVisaoOTB");
  if(!cab) return;

  const ths = cab.querySelectorAll("th");

  /* Índices conforme a ordem atual das 17 colunas. */
  if(ths[11]){
    const span = ths[11].querySelector("span");
    if(span) span.childNodes[0].nodeValue = "Relação atual ";
  }

  if(ths[12]){
    const span = ths[12].querySelector("span");
    if(span) span.childNodes[0].nodeValue = "Meta estoque/venda ";
  }

  if(ths[13]){
    const span = ths[13].querySelector("span");
    if(span) span.childNodes[0].nodeValue = "Estoque-alvo ";
  }

  if(ths[14]){
    const span = ths[14].querySelector("span");
    if(span) span.childNodes[0].nodeValue = "Alvo total ";
  }
};

/* A Central Estratégica também passa a usar a relação selecionada
   quando recalcular sugestão por produto. */
function calcularCompraSugeridaProdutoOTB(x){
  const relacao = obterMetaCoberturaMesesOTB();
  const previsaoPeriodo =
    (
      numeroOTB(x.venda_ano_passado) +
      numeroOTB(x.venda_ano_retrasado)
    ) / 2;

  const estoqueAlvo = Math.ceil(previsaoPeriodo*relacao);
  const estoque = numeroOTB(x.estoque);
  const pedidos = numeroOTB(x.pedidos);
  const disponibilidadeFutura = estoque+pedidos;
  const compraSugerida = Math.max(
    0,
    Math.ceil(estoqueAlvo-disponibilidadeFutura)
  );

  const relacaoAtual =
    previsaoPeriodo>0
      ? disponibilidadeFutura/previsaoPeriodo
      : 999;

  let prioridade = "normal";
  if(relacaoAtual<1) prioridade = "urgente";
  else if(relacaoAtual<relacao) prioridade = "atencao";

  return {
    ...x,
    previsaoMensal:
      previsaoPeriodo/Math.max(1,mesesEntreDatasOTB()),
    necessidadeAlvo:estoqueAlvo,
    estoque,
    pedidos,
    disponibilidadeFutura,
    compraSugerida,
    coberturaAtual:
      previsaoPeriodo>0 ? estoque/previsaoPeriodo : 999,
    coberturaComPedido:relacaoAtual,
    saldoProjetado:disponibilidadeFutura-estoqueAlvo,
    prioridade
  };
}

document.addEventListener("DOMContentLoaded",()=>{
  const seletor = document.getElementById("coberturaAlvoOTB");
  const label = seletor?.previousElementSibling;

  if(label && label.tagName==="LABEL"){
    label.textContent = "Relação estoque/venda";
  }
});


/* =========================================================
   CORREÇÃO — A LINHA PRINCIPAL FECHA COM O PLANEJAMENTO MENSAL
   ========================================================= */
function calcularLinhaPlanejamentoComMesesOTB(
  x,
  campo,
  meta,
  meses,
  dadosDoAgrupamento
){
  const linha = calcularLinhaPlanejamentoOTB(
    x,
    campo,
    meta,
    meses
  );

  const distribuicao = montarDistribuicaoMensalOTB(
    linha,
    Array.isArray(dadosDoAgrupamento)
      ? dadosDoAgrupamento
      : [],
    campo
  );

  const compraMensalTotal = distribuicao.reduce(
    (total,mes) =>
      total + numeroOTB(mes.compraSugerida),
    0
  );

  const estoqueAlvoMaximo = distribuicao.reduce(
    (maior,mes) =>
      Math.max(maior,numeroOTB(mes.estoqueAlvo)),
    0
  );

  const estoqueFinalProjetado = distribuicao.length
    ? numeroOTB(
        distribuicao[distribuicao.length-1].estoqueFinal
      )
    : numeroOTB(linha.estoqueProjetado);

  return {
    ...linha,
    compraSugerida:compraMensalTotal,
    estoqueFinalDesejado:estoqueAlvoMaximo,
    necessidadeTotal:estoqueFinalProjetado,
    compraMensalTotal,
    estoqueAlvoMaximo,
    estoqueFinalProjetado
  };
}

Object.assign(OTB_EXPLICACOES_RESUMO,{
  estoqueFinalDesejado:[
    "Maior estoque-alvo mensal",
    "Mostra o maior estoque-alvo encontrado entre os meses do filtro.\n\nEm cada mês:\nEstoque-alvo = Venda prevista do mês × Relação escolhida.\n\nO sistema não multiplica mais a venda total de todo o período pela relação."
  ],

  necessidadeTotal:[
    "Estoque final projetado",
    "Mostra quanto estoque deverá restar depois da venda prevista do último mês, considerando os pedidos e as compras planejadas mês a mês."
  ],

  compraSugerida:[
    "Compra planejada total",
    "É exatamente a soma da coluna Comprar no detalhamento mensal.\n\nO estoque final de cada mês se transforma no estoque inicial do mês seguinte.\n\nFórmula:\nCompra total = soma das compras sugeridas de todos os meses do filtro."
  ]
});

const _renderResumoCompraMensalFechadaOTB =
  renderResumoConsolidadoVisaoOTB;

renderResumoConsolidadoVisaoOTB = function(dados,campo){
  _renderResumoCompraMensalFechadaOTB(dados,campo);

  const cab =
    document.getElementById("cabecalhoResumoVisaoOTB");

  if(!cab) return;

  const ths = cab.querySelectorAll("th");

  if(ths[13]){
    const span = ths[13].querySelector("span");
    if(span){
      span.childNodes[0].nodeValue =
        "Maior estoque-alvo ";
    }
  }

  if(ths[14]){
    const span = ths[14].querySelector("span");
    if(span){
      span.childNodes[0].nodeValue =
        "Estoque final projetado ";
    }
  }

  if(ths[15]){
    const span = ths[15].querySelector("span");
    if(span){
      span.childNodes[0].nodeValue =
        "Compra mensal total ";
    }
  }
};


/* =========================================================
   AJUSTE FINAL — RELAÇÃO ESTOQUE/VENDA SEM CARDS FINANCEIROS
   Os antigos cálculos de Estoque atual, Pedidos feitos e
   Compra planejada estimada foram removidos por completo.
   ========================================================= */
const _renderResumoSemMesesOTB = renderResumoConsolidadoVisaoOTB;
renderResumoConsolidadoVisaoOTB = function(dados,campo){
  _renderResumoSemMesesOTB(dados,campo);

  const rodape=document.getElementById('rodapeResumoVisaoOTB');
  const celulas=rodape?.querySelectorAll('td') || [];
  const meta=obterMetaCoberturaMesesOTB();
  const lista=Array.isArray(dados)?dados:[];
  const previsaoTotal=lista.reduce((s,x)=>s+(numeroOTB(x.venda_ano_passado)+numeroOTB(x.venda_ano_retrasado))/2,0);
  const disponivelTotal=lista.reduce((s,x)=>s+numeroOTB(x.estoque)+numeroOTB(x.pedidos),0);
  const relacaoTotal=previsaoTotal>0?disponivelTotal/previsaoTotal:0;

  if(celulas[12]) celulas[12].textContent=`${relacaoTotal.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}:1`;
  if(celulas[13]) celulas[13].textContent=`${numeroOTB(meta).toLocaleString('pt-BR')}:1`;
};

document.addEventListener('DOMContentLoaded',()=>{
  const label=document.querySelector('label[for="coberturaAlvoOTB"]');
  if(label) label.textContent='Relação estoque/venda';
});


/* =========================================================
   RESUMO ÚNICO + FILTRO POR LINHA DE PRODUTO
   Evita manter cálculos repetidos abaixo da tabela.
   ========================================================= */
function calcularNecessidadeCompraResumoOTB(dados){
  const produtos = agruparProduto(Array.isArray(dados) ? dados : []);

  return produtos.reduce((total, produto) => {
    const calculado = classificarProdutoCentralOTB(produto);
    const quantidade = Math.max(0, numeroOTB(calculado.compraSugerida));
    const custoUnitario = numeroOTB(
      calculado.custo_liquido ??
      calculado.valor_custo ??
      produto.custo_liquido ??
      produto.valor_custo
    );

    total.quantidade += quantidade;
    total.valor += quantidade * custoUnitario;
    return total;
  }, { quantidade:0, valor:0 });
}

const _atualizarCardsResumoUnicoOTB = atualizarCardsOTB;
atualizarCardsOTB = function(dados){
  _atualizarCardsResumoUnicoOTB(dados);

  const necessidade = calcularNecessidadeCompraResumoOTB(dados);
  const qtd = document.getElementById("kpiNecessidadeCompraQtd");
  const valor = document.getElementById("kpiNecessidadeCompraValor");

  if(qtd) qtd.textContent = formatarNum(necessidade.quantidade);
  if(valor) valor.textContent = formatarMoedaOTB(necessidade.valor);
};

function alternarSelecaoProdutoOTB(produto, evento){
  evento?.preventDefault?.();
  evento?.stopPropagation?.();

  const codigo = String(produto || "").trim();
  if(!codigo) return;

  if(OTB_PRODUTOS_SEL.has(codigo)){
    OTB_PRODUTOS_SEL.clear();
  }else{
    OTB_PRODUTOS_SEL.clear();
    OTB_PRODUTOS_SEL.add(codigo);
  }

  OTB_GRAFICO_ORIGEM_SEL = "produto";

  /* Resposta visual imediata; a reconstrução dos demais componentes ocorre
     em seguida usando somente os dados já carregados. */
  document.querySelectorAll(".linhaProdutoCentralOTB").forEach(linha => {
    linha.classList.toggle(
      "selecionadaOTB",
      OTB_PRODUTOS_SEL.has(String(linha.dataset.produto || ""))
    );
  });

  aplicarFiltrosOTB();
}

/* =========================================================
   AJUSTE FINAL — PRIMEIRA TABELA COMO FILTRO MESTRE

   Ao clicar/abrir uma linha da Visão 1 ou da Visão 2 na tabela
   de Planejamento de Compras, a seleção passa a filtrar:
   - todos os gráficos;
   - todos os cards superiores;
   - a Central Estratégica de Produtos (segunda tabela);
   - o próprio resumo de planejamento.

   Nenhuma nova consulta ao servidor é realizada. A seleção usa
   exclusivamente o dataset que já está carregado em memória.
   ========================================================= */
let OTB_FILTRO_PLANEJAMENTO_MESTRE = "";

const _filtrarDatasetAntesPlanejamentoMestreOTB = filtrarDatasetOTB;
filtrarDatasetOTB = function(opcoes = {}){
  let dados = _filtrarDatasetAntesPlanejamentoMestreOTB(opcoes);

  if(opcoes?.ignorarPlanejamentoMestre || !OTB_FILTRO_PLANEJAMENTO_MESTRE){
    return dados;
  }

  const filtros = String(OTB_FILTRO_PLANEJAMENTO_MESTRE)
    .split("||")
    .map(parte => {
      const pos = parte.indexOf("::");
      if(pos < 0) return null;
      return {
        campo: parte.slice(0,pos),
        valor: parte.slice(pos+2)
      };
    })
    .filter(Boolean);

  if(!filtros.length) return dados;

  return dados.filter(item =>
    filtros.every(filtro =>
      valorDimensaoOTB(item,filtro.campo) === filtro.valor
    )
  );
};

function marcarSelecaoPlanejamentoMestreOTB(){
  document
    .querySelectorAll("#corpoResumoVisaoOTB .linhaPlanejamentoOTB")
    .forEach(linha => linha.classList.remove("selecionadaMestreOTB"));

  if(!OTB_FILTRO_PLANEJAMENTO_MESTRE) return;

  const alvo = decodeURIComponent(OTB_FILTRO_PLANEJAMENTO_MESTRE);

  document
    .querySelectorAll("#corpoResumoVisaoOTB .linhaPlanejamentoOTB")
    .forEach(linha => {
      const onclick = linha.getAttribute("onclick") || "";
      if(onclick.includes(encodeURIComponent(alvo))){
        linha.classList.add("selecionadaMestreOTB");
      }
    });
}

function aplicarFiltroMestrePlanejamentoOTB(chave){
  const texto = String(chave || "").trim();
  OTB_FILTRO_PLANEJAMENTO_MESTRE =
    OTB_FILTRO_PLANEJAMENTO_MESTRE === texto ? "" : texto;

  OTB_GRAFICO_ORIGEM_SEL = "planejamento_mestre";

  /* O filtro é aplicado somente em memória. aplicarFiltrosOTB já
     prioriza cards e gráficos e agenda a tabela mais pesada depois. */
  aplicarFiltrosOTB();
}

alternarDetalhePlanejamentoOTB = function(chaveCodificada){
  const chave = decodeURIComponent(String(chaveCodificada || ""));
  const vaiFechar = OTB_FILTRO_PLANEJAMENTO_MESTRE === chave;

  OTB_ITEM_PLANEJAMENTO_ABERTO = vaiFechar ? "" : chave;

  /* Quando é uma linha de Visão 2, mantém o grupo da Visão 1 aberto. */
  if(!vaiFechar && chave.includes("||")){
    OTB_GRUPO_PLANEJAMENTO_ABERTO = chave.split("||")[0];
  }

  aplicarFiltroMestrePlanejamentoOTB(chave);
};

alternarGrupoPlanejamentoOTB = function(chaveCodificada){
  const chave = decodeURIComponent(String(chaveCodificada || ""));
  const vaiFechar = OTB_FILTRO_PLANEJAMENTO_MESTRE === chave;

  OTB_GRUPO_PLANEJAMENTO_ABERTO = vaiFechar ? "" : chave;
  OTB_ITEM_PLANEJAMENTO_ABERTO = "";

  aplicarFiltroMestrePlanejamentoOTB(chave);
};

/* O card Necessidade de Compra deixa de executar um cálculo próprio
   antes da tabela. Ele passa a ser alimentado depois da renderização,
   usando exatamente o TOTAL da coluna Comprar da primeira tabela. */
atualizarCardsOTB = function(dados){
  _atualizarCardsResumoUnicoOTB(dados);
};

function numeroTextoBrasileiroOTB(texto){
  const limpo = String(texto ?? "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const numero = Number(limpo || 0);
  return Number.isFinite(numero) ? numero : 0;
}

function atualizarCardNecessidadePeloRodapeOTB(dados){
  const rodape = document.getElementById("rodapeResumoVisaoOTB");
  const celulas = rodape?.querySelectorAll("td") || [];

  /* A coluna Comprar é a 17ª coluna da primeira tabela. */
  const quantidadeRodape = celulas.length >= 17
    ? numeroTextoBrasileiroOTB(celulas[16].textContent)
    : 0;

  /* O valor usa os custos dos mesmos produtos atualmente filtrados.
     A quantidade exibida, porém, vem obrigatoriamente do rodapé. */
  const necessidadeProdutos = calcularNecessidadeCompraResumoOTB(
    Array.isArray(dados) ? dados : []
  );

  const qtd = document.getElementById("kpiNecessidadeCompraQtd");
  const valor = document.getElementById("kpiNecessidadeCompraValor");

  if(qtd) qtd.textContent = formatarNum(quantidadeRodape);
  if(valor) valor.textContent = formatarMoedaOTB(necessidadeProdutos.valor);
}

const _renderResumoAntesFiltroMestreOTB = renderResumoConsolidadoVisaoOTB;
renderResumoConsolidadoVisaoOTB = function(dados,campo){
  _renderResumoAntesFiltroMestreOTB(dados,campo);
  atualizarCardNecessidadePeloRodapeOTB(dados);
  marcarSelecaoPlanejamentoMestreOTB();
};

/* Nova pesquisa e troca das visões removem a seleção mestre anterior. */
const _limparResultadosAntesBuscaMestreOTB = limparResultadosAntesBuscaOTB;
limparResultadosAntesBuscaOTB = function(){
  OTB_FILTRO_PLANEJAMENTO_MESTRE = "";
  OTB_GRUPO_PLANEJAMENTO_ABERTO = "";
  OTB_ITEM_PLANEJAMENTO_ABERTO = "";
  _limparResultadosAntesBuscaMestreOTB();
};

document.addEventListener("DOMContentLoaded",()=>{
  [
    "usarUmaVisaoPlanejamentoOTB",
    "visaoPlanejamentoOTB",
    "visaoPlanejamento2OTB"
  ].forEach(id=>{
    document.getElementById(id)?.addEventListener("change",()=>{
      OTB_FILTRO_PLANEJAMENTO_MESTRE = "";
      OTB_GRUPO_PLANEJAMENTO_ABERTO = "";
      OTB_ITEM_PLANEJAMENTO_ABERTO = "";
    });
  });
});



/* =========================================================
   CORREÇÃO FINAL — VISÃO 2 + ORDENAÇÃO DO PLANEJAMENTO
   ========================================================= */

function decomporFiltroPlanejamentoMestreOTB(chave){
  return String(chave || "")
    .split("||")
    .map(parte => {
      const pos = parte.indexOf("::");
      if(pos < 0) return null;

      const campo = String(parte.slice(0,pos) || "").trim();
      const valor = String(parte.slice(pos+2) || "").trim();

      if(!campo) return null;
      return { campo, valor };
    })
    .filter(Boolean);
}

function itemAtendeFiltroPlanejamentoMestreOTB(item, filtros){
  return filtros.every(({campo,valor}) => {
    const valorItem = valorDimensaoOTB(item,campo);
    const valorFiltro = campo === "preco_venda"
      ? String(valor || "").trim().toUpperCase()
      : normalizarValorFiltroOTB(valor);

    return valorItem === valorFiltro;
  });
}

/* Substitui a comparação literal anterior. Isso é importante na Visão 2,
   pois descrições vindas do ERP podem conter espaços, letras minúsculas
   ou formatações diferentes. */
const _filtrarDatasetComFiltroMestreAntigoOTB = filtrarDatasetOTB;
filtrarDatasetOTB = function(opcoes = {}){
  const ignorarMestre = Boolean(opcoes?.ignorarPlanejamentoMestre);
  const chaveMestre = OTB_FILTRO_PLANEJAMENTO_MESTRE;

  /* Chama a versão anterior sem deixar que ela aplique a comparação
     literal. Depois aplicamos uma única vez, de forma normalizada. */
  OTB_FILTRO_PLANEJAMENTO_MESTRE = "";
  let dados;
  try{
    dados = _filtrarDatasetComFiltroMestreAntigoOTB(opcoes);
  }finally{
    OTB_FILTRO_PLANEJAMENTO_MESTRE = chaveMestre;
  }

  if(ignorarMestre || !chaveMestre) return dados;

  const filtros = decomporFiltroPlanejamentoMestreOTB(chaveMestre);
  if(!filtros.length) return dados;

  return dados.filter(item =>
    itemAtendeFiltroPlanejamentoMestreOTB(item,filtros)
  );
};

/* Garante que tanto a linha da Visão 1 quanto a linha da Visão 2 usem
   exatamente a mesma rotina de filtro mestre. */
aplicarFiltroMestrePlanejamentoOTB = function(chave){
  const texto = String(chave || "").trim();

  OTB_FILTRO_PLANEJAMENTO_MESTRE =
    OTB_FILTRO_PLANEJAMENTO_MESTRE === texto ? "" : texto;

  OTB_GRAFICO_ORIGEM_SEL = "planejamento_mestre";
  aplicarFiltrosOTB();
};

alternarGrupoPlanejamentoOTB = function(chaveCodificada){
  const chave = decodeURIComponent(String(chaveCodificada || ""));
  const vaiFechar = OTB_FILTRO_PLANEJAMENTO_MESTRE === chave;

  OTB_GRUPO_PLANEJAMENTO_ABERTO = vaiFechar ? "" : chave;
  OTB_ITEM_PLANEJAMENTO_ABERTO = "";
  aplicarFiltroMestrePlanejamentoOTB(chave);
};

alternarDetalhePlanejamentoOTB = function(chaveCodificada){
  const chave = decodeURIComponent(String(chaveCodificada || ""));
  const vaiFechar = OTB_FILTRO_PLANEJAMENTO_MESTRE === chave;

  OTB_ITEM_PLANEJAMENTO_ABERTO = vaiFechar ? "" : chave;

  if(!vaiFechar && chave.includes("||")){
    OTB_GRUPO_PLANEJAMENTO_ABERTO = chave.split("||")[0];
  }

  aplicarFiltroMestrePlanejamentoOTB(chave);
};

/* Cabeçalhos realmente clicáveis. O evento fica delegado no THEAD,
   portanto continua funcionando depois de qualquer nova renderização. */
cabecalhoResumoOTB = function(campo, titulo){
  const seta =
    OTB_ORDEM_RESUMO_VISAO.campo === campo
      ? (OTB_ORDEM_RESUMO_VISAO.direcao === "asc" ? "▲" : "▼")
      : "↕";

  return `
    <th
      class="cabecalhoOrdenavelPlanejamentoOTB"
      data-campo-ordenacao-planejamento="${campo}"
      title="Clique para ordenar crescente ou decrescente"
    >
      <span>${titulo} ${seta}</span>
      <button
        class="infoCalculoOTB"
        type="button"
        onclick="event.stopPropagation();abrirExplicacaoCalculoOTB('${campo}')"
        title="Explicar cálculo"
      >ⓘ</button>
    </th>
  `;
};

document.addEventListener("DOMContentLoaded",()=>{
  const cabecalho = document.getElementById("cabecalhoResumoVisaoOTB");
  if(!cabecalho || cabecalho.dataset.ordenacaoPlanejamentoAtiva === "1") return;

  cabecalho.dataset.ordenacaoPlanejamentoAtiva = "1";
  cabecalho.addEventListener("click",evento=>{
    if(evento.target.closest(".infoCalculoOTB")) return;

    const th = evento.target.closest("[data-campo-ordenacao-planejamento]");
    if(!th) return;

    const campo = th.dataset.campoOrdenacaoPlanejamento;
    if(!campo) return;

    ordenarTabelaResumoVisaoOTB(campo);
  });
});


/* =========================================================
   PLANEJAMENTO RÁPIDO V3

   1. Visão 1, Visão 2 e mês filtram imediatamente cards,
      gráficos e a própria tabela de planejamento.
   2. A Central Estratégica de Produtos não é reconstruída
      durante a navegação da primeira tabela.
   3. A tabela de produtos só recebe o novo recorte quando o
      usuário clicar em "Filtrar os produtos conforme a visão".
   4. Ordenações usam o conjunto já exibido, sem filtrar tudo
      novamente.
   ========================================================= */

let OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE = false;
let OTB_DADOS_CENTRAL_ATUAIS = [];
let OTB_DADOS_PLANEJAMENTO_ATUAIS = [];
let OTB_MES_PLANEJAMENTO_SEL = "";
let OTB_SEQ_APLICAR_PRODUTOS = 0;

function atualizarEstadoBotaoProdutosPlanejamentoOTB(){
  const botao = document.getElementById("btnAplicarProdutosPlanejamentoOTB");
  const status = document.getElementById("statusFiltroProdutosPlanejamentoOTB");

  if(botao){
    botao.classList.toggle(
      "pendente",
      OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE
    );
    botao.textContent = OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE
      ? "Aplicar esta visão nos produtos"
      : "Filtrar os produtos conforme a visão";
  }

  if(status){
    status.classList.toggle(
      "pendente",
      OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE
    );
    status.textContent = OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE
      ? "A análise mudou. Clique no botão para atualizar a tabela de produtos."
      : "A tabela de produtos está sincronizada com a visão aplicada.";
  }
}

function marcarProdutosPlanejamentoPendentesOTB(){
  OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE = true;
  atualizarEstadoBotaoProdutosPlanejamentoOTB();
}

function chaveMesPlanejamentoOTB(data){
  if(!(data instanceof Date) || Number.isNaN(data.getTime())) return "";
  return `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,"0")}`;
}

/* Acrescenta o terceiro nível da hierarquia: mês. */
const _itemAtendeFiltroPlanejamentoSemMesOTB = itemAtendeFiltroPlanejamentoMestreOTB;
itemAtendeFiltroPlanejamentoMestreOTB = function(item,filtros){
  return filtros.every(filtro => {
    if(filtro.campo === "__mes"){
      return chaveMesPlanejamentoOTB(dataLinhaPlanejamentoOTB(item)) === filtro.valor;
    }
    return _itemAtendeFiltroPlanejamentoSemMesOTB(item,[filtro]);
  });
};

/* Guarda o último conjunto usado por cada tabela. */
const _renderCentralCachePlanejamentoOTB = renderCentralEstrategicaProdutosOTB;
renderCentralEstrategicaProdutosOTB = function(dados){
  OTB_DADOS_CENTRAL_ATUAIS = Array.isArray(dados) ? dados.slice() : [];
  return _renderCentralCachePlanejamentoOTB(dados);
};

const _renderResumoCachePlanejamentoOTB = renderResumoConsolidadoVisaoOTB;
renderResumoConsolidadoVisaoOTB = function(dados,campo){
  OTB_DADOS_PLANEJAMENTO_ATUAIS = Array.isArray(dados) ? dados : [];
  const retorno = _renderResumoCachePlanejamentoOTB(dados,campo);
  requestAnimationFrame(marcarMesSelecionadoPlanejamentoOTB);
  return retorno;
};

/* Ordena a tabela 2 sem executar filtrarDatasetOTB novamente. */
ordenarCentralProdutosOTB = function(campo){
  if(OTB_ORDENACAO_TABELA.campo === campo){
    OTB_ORDENACAO_TABELA.direcao =
      OTB_ORDENACAO_TABELA.direcao === "asc" ? "desc" : "asc";
  }else{
    OTB_ORDENACAO_TABELA.campo = campo;
    OTB_ORDENACAO_TABELA.direcao = "asc";
  }

  if(OTB_TABELAS_LIBERADAS){
    renderCentralEstrategicaProdutosOTB(OTB_DADOS_CENTRAL_ATUAIS);
  }
};

/* Ordena a tabela 1 usando o array que já foi filtrado. */
ordenarTabelaResumoVisaoOTB = function(campo){
  if(OTB_ORDEM_RESUMO_VISAO.campo === campo){
    OTB_ORDEM_RESUMO_VISAO.direcao =
      OTB_ORDEM_RESUMO_VISAO.direcao === "asc" ? "desc" : "asc";
  }else{
    OTB_ORDEM_RESUMO_VISAO.campo = campo;
    OTB_ORDEM_RESUMO_VISAO.direcao = campo === "visao" ? "asc" : "desc";
  }

  renderResumoConsolidadoVisaoOTB(
    OTB_DADOS_PLANEJAMENTO_ATUAIS,
    obterCampoVisaoPlanejamentoOTB()
  );
};

/* A etapa pesada continua atualizando a projeção temporal, mas não
   reconstrói a tabela 2 enquanto o usuário navega na tabela 1. */
const _agendarAtualizacaoPesadaAntesPlanejamentoRapidoOTB =
  agendarAtualizacaoPesadaOTB;

agendarAtualizacaoPesadaOTB = function(dadosFinais,campoVisao,sequencia){
  if(OTB_GRAFICO_ORIGEM_SEL !== "planejamento_mestre"){
    return _agendarAtualizacaoPesadaAntesPlanejamentoRapidoOTB(
      dadosFinais,
      campoVisao,
      sequencia
    );
  }

  if(OTB_TIMER_ATUALIZACAO_PESADA){
    clearTimeout(OTB_TIMER_ATUALIZACAO_PESADA);
  }

  const executar = () => {
    if(sequencia !== OTB_SEQ_ATUALIZACAO_LOCAL) return;
    executarEtapaSeguraOTB("projeção temporal", renderizarTimelineFiltradaOTB);
  };

  if(typeof requestIdleCallback === "function"){
    OTB_TIMER_ATUALIZACAO_PESADA = setTimeout(() => {
      requestIdleCallback(executar,{timeout:250});
    },0);
  }else{
    OTB_TIMER_ATUALIZACAO_PESADA = setTimeout(executar,0);
  }
};

/* Visão 1 e Visão 2 atualizam tudo, exceto a tabela 2, que fica pendente. */
aplicarFiltroMestrePlanejamentoOTB = function(chave){
  const texto = String(chave || "").trim();

  OTB_FILTRO_PLANEJAMENTO_MESTRE =
    OTB_FILTRO_PLANEJAMENTO_MESTRE === texto ? "" : texto;

  if(!OTB_FILTRO_PLANEJAMENTO_MESTRE){
    OTB_MES_PLANEJAMENTO_SEL = "";
  }

  OTB_GRAFICO_ORIGEM_SEL = "planejamento_mestre";
  marcarProdutosPlanejamentoPendentesOTB();
  aplicarFiltrosOTB();
};

function aplicarMesPlanejamentoOTB(chaveMes){
  const mes = String(chaveMes || "").trim();
  if(!mes) return;

  const partes = decomporFiltroPlanejamentoMestreOTB(
    OTB_FILTRO_PLANEJAMENTO_MESTRE
  ).filter(f => f.campo !== "__mes");

  const base = partes
    .map(f => `${f.campo}::${f.valor}`)
    .join("||");

  const mesmaSelecao = OTB_MES_PLANEJAMENTO_SEL === mes;
  OTB_MES_PLANEJAMENTO_SEL = mesmaSelecao ? "" : mes;

  OTB_FILTRO_PLANEJAMENTO_MESTRE = mesmaSelecao
    ? base
    : [base,`__mes::${mes}`].filter(Boolean).join("||");

  OTB_GRAFICO_ORIGEM_SEL = "planejamento_mestre";
  marcarProdutosPlanejamentoPendentesOTB();
  aplicarFiltrosOTB();
}

function marcarMesSelecionadoPlanejamentoOTB(){
  const linhas = document.querySelectorAll(
    "#corpoResumoVisaoOTB .linhaDetalhePlanejamentoOTB tbody tr"
  );

  linhas.forEach(linha => {
    const nome = String(linha.cells?.[0]?.textContent || "").trim();
    const mes = mesesPlanejamentoOTB().find(m => m.nome === nome);
    linha.classList.toggle(
      "mesSelecionadoPlanejamentoOTB",
      Boolean(mes && mes.chave === OTB_MES_PLANEJAMENTO_SEL)
    );
  });
}

/* Clique delegado no mês do detalhamento. */
document.addEventListener("click",evento => {
  const linha = evento.target.closest(
    "#corpoResumoVisaoOTB .linhaDetalhePlanejamentoOTB tbody tr"
  );
  if(!linha) return;

  const nomeMes = String(linha.cells?.[0]?.textContent || "").trim();
  const mes = mesesPlanejamentoOTB().find(m => m.nome === nomeMes);
  if(!mes) return;

  evento.preventDefault();
  evento.stopPropagation();
  aplicarMesPlanejamentoOTB(mes.chave);
});

async function aplicarProdutosConformeVisaoOTB(){
  const botao = document.getElementById("btnAplicarProdutosPlanejamentoOTB");
  const seq = ++OTB_SEQ_APLICAR_PRODUTOS;

  if(botao){
    botao.disabled = true;
    botao.textContent = "Aplicando produtos...";
  }

  const executar = () => {
    if(seq !== OTB_SEQ_APLICAR_PRODUTOS) return;

    const dados = filtrarDatasetOTB();
    renderCentralEstrategicaProdutosOTB(dados);

    OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE = false;
    atualizarEstadoBotaoProdutosPlanejamentoOTB();

    if(botao) botao.disabled = false;
  };

  if(typeof requestIdleCallback === "function"){
    requestIdleCallback(executar,{timeout:800});
  }else{
    setTimeout(executar,0);
  }
}

/* Remove os vários listeners antigos dos três controles, clonando-os,
   e instala uma única rotina. Isso evita renderizações duplicadas. */
document.addEventListener("DOMContentLoaded",()=>{
  const ids = [
    "usarUmaVisaoPlanejamentoOTB",
    "visaoPlanejamentoOTB",
    "visaoPlanejamento2OTB"
  ];

  const controles = {};

  ids.forEach(id => {
    const antigo = document.getElementById(id);
    if(!antigo) return;
    const novo = antigo.cloneNode(true);
    antigo.replaceWith(novo);
    controles[id] = novo;
  });

  const reconstruirUmaVez = () => {
    atualizarEstadoDuasVisoesPlanejamentoOTB();
    OTB_FILTRO_PLANEJAMENTO_MESTRE = "";
    OTB_MES_PLANEJAMENTO_SEL = "";
    OTB_GRUPO_PLANEJAMENTO_ABERTO = "";
    OTB_ITEM_PLANEJAMENTO_ABERTO = "";
    OTB_GRAFICO_ORIGEM_SEL = "planejamento_mestre";
    marcarProdutosPlanejamentoPendentesOTB();
    aplicarFiltrosOTB();
  };

  controles.usarUmaVisaoPlanejamentoOTB?.addEventListener(
    "change",
    reconstruirUmaVez
  );

  controles.visaoPlanejamentoOTB?.addEventListener("change",()=>{
    const visao1 = controles.visaoPlanejamentoOTB;
    const visao2 = controles.visaoPlanejamento2OTB;

    if(!usarApenasUmaVisaoPlanejamentoOTB() && visao2?.value === visao1?.value){
      const alternativa = [...visao2.options].find(op => op.value !== visao1.value);
      if(alternativa) visao2.value = alternativa.value;
    }
    reconstruirUmaVez();
  });

  controles.visaoPlanejamento2OTB?.addEventListener("change",()=>{
    const visao1 = controles.visaoPlanejamentoOTB;
    const visao2 = controles.visaoPlanejamento2OTB;

    if(visao1 && visao2?.value === visao1.value){
      const alternativa = [...visao2.options].find(op => op.value !== visao1.value);
      if(alternativa) visao2.value = alternativa.value;
    }
    reconstruirUmaVez();
  });

  atualizarEstadoDuasVisoesPlanejamentoOTB();
  atualizarEstadoBotaoProdutosPlanejamentoOTB();
});

/* Uma nova pesquisa volta a sincronizar automaticamente a tabela 2. */
const _limparResultadosPlanejamentoRapidoOTB = limparResultadosAntesBuscaOTB;
limparResultadosAntesBuscaOTB = function(){
  OTB_FILTRO_PRODUTOS_PLANEJAMENTO_PENDENTE = false;
  OTB_DADOS_CENTRAL_ATUAIS = [];
  OTB_DADOS_PLANEJAMENTO_ATUAIS = [];
  OTB_MES_PLANEJAMENTO_SEL = "";
  _limparResultadosPlanejamentoRapidoOTB();
  atualizarEstadoBotaoProdutosPlanejamentoOTB();
};


/* =========================================================
   CORREÇÃO FINAL — ORDENAÇÃO DA CENTRAL ESTRATÉGICA
   Usa delegação de clique no cabeçalho e nunca refaz consulta.
   ========================================================= */
(function configurarOrdenacaoCentralDelegadaOTB(){
  if(window.__OTB_ORDENACAO_CENTRAL_DELEGADA__) return;
  window.__OTB_ORDENACAO_CENTRAL_DELEGADA__ = true;

  document.addEventListener("click", function(evento){
    const th = evento.target.closest(
      "#tblCentralProdutosOTB th.cabecalhoOrdenavelOTB[data-campo-ordem-otb]"
    );

    if(!th) return;

    evento.preventDefault();
    evento.stopPropagation();

    const campo = String(th.dataset.campoOrdemOtb || "").trim();
    if(!campo) return;

    ordenarCentralProdutosOTB(campo);
  }, true);
})();

/* O atributo data-* torna o clique confiável mesmo com cabeçalho sticky. */
cabecalhoOrdenavelCentralOTB = function(campo, titulo, classe = ""){
  return `
    <th
      class="cabecalhoOrdenavelOTB ${classe}"
      data-campo-ordem-otb="${campo}"
      role="button"
      tabindex="0"
      title="Clique para ordenar crescente ou decrescente"
    >
      <span>${titulo}</span>
      <i>${indicadorOrdenacaoCentralOTB(campo)}</i>
    </th>
  `;
};

/* Também permite ordenar pelo teclado. */
document.addEventListener("keydown", function(evento){
  if(evento.key !== "Enter" && evento.key !== " ") return;

  const th = evento.target.closest(
    "#tblCentralProdutosOTB th.cabecalhoOrdenavelOTB[data-campo-ordem-otb]"
  );

  if(!th) return;

  evento.preventDefault();
  const campo = String(th.dataset.campoOrdemOtb || "").trim();
  if(campo) ordenarCentralProdutosOTB(campo);
});


/* =========================================================
   AJUSTE FINAL — ORDENAÇÃO VISUAL IMEDIATA + MODAL NO CLIQUE
   ========================================================= */

/*
 * Ordena diretamente as linhas já renderizadas da Central Estratégica.
 * Não filtra dataset, não agrupa novamente e não consulta o servidor.
 */
ordenarCentralProdutosOTB = function(campo){
  const tabela = document.querySelector("#tblCentralProdutosOTB table");
  const tbody = tabela?.tBodies?.[0];
  if(!tabela || !tbody) return;

  if(OTB_ORDENACAO_TABELA.campo === campo){
    OTB_ORDENACAO_TABELA.direcao =
      OTB_ORDENACAO_TABELA.direcao === "asc" ? "desc" : "asc";
  }else{
    OTB_ORDENACAO_TABELA.campo = campo;
    OTB_ORDENACAO_TABELA.direcao =
      ["foto","produto","fornecedor","marca","complemento","prioridade"].includes(campo)
        ? "asc"
        : "desc";
  }

  const indicePorCampo = {
    foto:0,
    prioridade:1,
    fornecedor:2,
    produto:3,
    marca:4,
    complemento:5,
    giro:6,
    giro_compras:7,
    vendas:8,
    venda_ano_passado:9,
    compras:10,
    compras_ano_passado:11,
    pedidos:12,
    estoque:13,
    coberturaComPedido:14,
    compraSugerida:15
  };

  const indice = indicePorCampo[campo];
  if(!Number.isInteger(indice)) return;

  const numericos = new Set([
    "giro","giro_compras","vendas","venda_ano_passado","compras",
    "compras_ano_passado","pedidos","estoque",
    "coberturaComPedido","compraSugerida"
  ]);

  const prioridade = {
    "URGENTE":1,
    "ATENÇÃO":2,
    "OPORTUNIDADE":3,
    "EXCESSO":4,
    "SAUDÁVEL":5
  };

  const numeroTexto = valor => {
    const limpo = String(valor || "")
      .replace(/\s*dias?\s*/gi, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^0-9+\-.]/g, "");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : 0;
  };

  const linhas = Array.from(tbody.rows);
  const direcao = OTB_ORDENACAO_TABELA.direcao === "desc" ? -1 : 1;

  linhas.sort((a,b) => {
    const ta = String(a.cells[indice]?.innerText || "").trim();
    const tb = String(b.cells[indice]?.innerText || "").trim();

    let comparacao = 0;
    if(campo === "prioridade"){
      comparacao = (prioridade[ta.toUpperCase()] || 99) -
                   (prioridade[tb.toUpperCase()] || 99);
    }else if(campo === "giro" || campo === "giro_compras"){
      /*
       * Usa os valores originais do produto, e não o texto arredondado
       * exibido na célula. Assim Giro/Estoque e Giro/Compras ordenam
       * corretamente mesmo quando vários produtos aparecem com 0,00,
       * 0,01 ou outros valores visualmente iguais após o arredondamento.
       */
      const itemA = OTB_CENTRAL_ITENS.get(String(a.dataset.produto || "")) || {};
      const itemB = OTB_CENTRAL_ITENS.get(String(b.dataset.produto || "")) || {};

      const valorA = campo === "giro_compras"
        ? giroComprasProdutoCentralOTB(itemA)
        : giroProdutoCentralOTB(itemA);

      const valorB = campo === "giro_compras"
        ? giroComprasProdutoCentralOTB(itemB)
        : giroProdutoCentralOTB(itemB);

      comparacao = numeroOTB(valorA) - numeroOTB(valorB);
    }else if(numericos.has(campo)){
      comparacao = numeroTexto(ta) - numeroTexto(tb);
    }else{
      comparacao = ta.localeCompare(tb,"pt-BR",{
        numeric:true,
        sensitivity:"base"
      });
    }

    if(comparacao === 0){
      const pa = String(a.dataset.produto || "");
      const pb = String(b.dataset.produto || "");
      comparacao = pa.localeCompare(pb,"pt-BR",{numeric:true,sensitivity:"base"});
    }

    return comparacao * direcao;
  });

  const fragmento = document.createDocumentFragment();
  linhas.forEach(linha => fragmento.appendChild(linha));
  tbody.appendChild(fragmento);

  tabela.querySelectorAll("th.cabecalhoOrdenavelOTB").forEach(th => {
    const icone = th.querySelector("i");
    const ativo = th.dataset.campoOrdemOtb === campo;
    th.classList.toggle("ordenacaoAtivaOTB", ativo);
    if(icone){
      icone.textContent = ativo
        ? (OTB_ORDENACAO_TABELA.direcao === "asc" ? "▲" : "▼")
        : "↕";
    }
  });
};

/* =========================================================
   CLIQUE SIMPLES E DUPLO CLIQUE NA CENTRAL DE PRODUTOS

   - Um clique: aplica o produto como filtro.
   - Dois cliques: abre o modal de movimentações.

   O pequeno atraso evita que o segundo clique de um duplo clique
   desfaça a seleção feita pelo primeiro clique.
   ========================================================= */
let OTB_TIMER_CLIQUE_PRODUTO = null;
let OTB_PRODUTO_CLIQUE_PENDENTE = "";

function agendarCliqueProdutoOTB(produto, evento){
  evento?.preventDefault?.();
  evento?.stopPropagation?.();

  const codigo = String(produto || "").trim();
  if(!codigo) return;

  clearTimeout(OTB_TIMER_CLIQUE_PRODUTO);
  OTB_PRODUTO_CLIQUE_PENDENTE = codigo;

  OTB_TIMER_CLIQUE_PRODUTO = setTimeout(() => {
    const produtoPendente = OTB_PRODUTO_CLIQUE_PENDENTE;
    OTB_TIMER_CLIQUE_PRODUTO = null;
    OTB_PRODUTO_CLIQUE_PENDENTE = "";

    if(produtoPendente){
      alternarSelecaoProdutoOTB(produtoPendente, evento);
    }
  }, 240);
}

function abrirProdutoPorDuploCliqueOTB(produto, evento){
  evento?.preventDefault?.();
  evento?.stopPropagation?.();

  clearTimeout(OTB_TIMER_CLIQUE_PRODUTO);
  OTB_TIMER_CLIQUE_PRODUTO = null;
  OTB_PRODUTO_CLIQUE_PENDENTE = "";

  const codigo = String(produto || "").trim();
  if(!codigo) return;

  abrirModalProdutoOTB(codigo);
}

/* Compatibilidade com versões anteriores do HTML. */
function selecionarProdutoEAbrirModalOTB(produto, evento){
  agendarCliqueProdutoOTB(produto, evento);
}


/* =========================================================
   DISTRIBUIÇÃO DO PRODUTO POR EMPRESA
   Ativa somente quando "Empresa" estiver escolhida na
   Visão 1 ou na Visão 2 do Planejamento de Compras.

   - 1 clique no produto: abre/fecha distribuição por empresa.
   - 2 cliques: continua abrindo o modal do produto.
   - PDF: distribuição aparece automaticamente abaixo do item.
   ========================================================= */

let OTB_PRODUTO_DISTRIBUICAO_EMPRESA_ABERTO = "";

function empresaAtivaNasVisoesPlanejamentoOTB(){
  const campo1 = String(
    document.getElementById("visaoPlanejamentoOTB")?.value || ""
  ).trim().toLowerCase();

  const campo2 = String(
    document.getElementById("visaoPlanejamento2OTB")?.value || ""
  ).trim().toLowerCase();

  const chaveMestre = String(
    typeof OTB_FILTRO_PLANEJAMENTO_MESTRE !== "undefined"
      ? OTB_FILTRO_PLANEJAMENTO_MESTRE
      : ""
  ).toLowerCase();

  /*
   * Reconhece Empresa mesmo depois que a visão já foi aplicada.
   * Não depende mais apenas do checkbox "Usar apenas uma visão".
   */
  return (
    campo1 === "empresa" ||
    campo2 === "empresa" ||
    chaveMestre.includes("empresa::")
  );
}

function dadosBaseDistribuicaoEmpresaOTB(){
  /*
   * Ignora somente o recorte de EMPRESA, porque a finalidade desta
   * distribuição é justamente comparar o mesmo produto entre lojas.
   * Mantém Marca/Grupo/Mês/etc. que estiverem ativos na Visão 1/2.
   */
  let dados;

  try{
    dados = filtrarDatasetOTB({
      ignorarEmpresa:true,
      ignorarPlanejamentoMestre:true
    });
  }catch(e){
    dados = Array.isArray(OTB_DATASET) ? [...OTB_DATASET] : [];
  }

  const filtrosPlanejamento =
    typeof decomporFiltroPlanejamentoMestreOTB === "function"
      ? decomporFiltroPlanejamentoMestreOTB(
          typeof OTB_FILTRO_PLANEJAMENTO_MESTRE !== "undefined"
            ? OTB_FILTRO_PLANEJAMENTO_MESTRE
            : ""
        ).filter(f => f.campo !== "empresa")
      : [];

  if(filtrosPlanejamento.length){
    dados = dados.filter(item =>
      typeof itemAtendeFiltroPlanejamentoMestreOTB === "function"
        ? itemAtendeFiltroPlanejamentoMestreOTB(
            item,
            filtrosPlanejamento
          )
        : true
    );
  }

  return dados;
}

function distribuicaoProdutoPorEmpresaOTB(produto){
  const codigo = String(produto || "").trim();
  if(!codigo) return [];

  const dados = dadosBaseDistribuicaoEmpresaOTB()
    .filter(item =>
      String(item.produto || item.codigo || "").trim() === codigo
    );

  const porEmpresa = new Map();

  for(const item of dados){
    const empresa =
      empresaConsolidadaOTB(item.empresa);

    if(!empresa) continue;

    if(!porEmpresa.has(empresa)){
      porEmpresa.set(empresa,[]);
    }

    porEmpresa.get(empresa).push(item);
  }

  const lista = [];

  for(const [empresa,itens] of porEmpresa){
    const consolidado =
      agruparProduto(itens)
        .map(classificarProdutoCentralOTB)[0];

    if(!consolidado) continue;

    lista.push({
      ...consolidado,
      empresa
    });
  }

  const campoOrdem =
    OTB_ORDENACAO_TABELA?.campo || "empresa";

  const direcaoOrdem =
    OTB_ORDENACAO_TABELA?.direcao === "asc"
      ? 1
      : -1;

  const valorOrdenacaoEmpresa = item => {
    switch(campoOrdem){
      case "giro":
        return numeroOTB(giroProdutoCentralOTB(item));

      case "giro_compras":
        return numeroOTB(giroComprasProdutoCentralOTB(item));

      case "vendas":
        return numeroOTB(item.vendas);

      case "venda_ano_passado":
        return numeroOTB(item.venda_ano_passado);

      case "compras":
        return numeroOTB(item.compras);

      case "compras_ano_passado":
        return numeroOTB(item.compras_ano_passado);

      case "pedidos":
        return numeroOTB(item.pedidos);

      case "estoque":
        return numeroOTB(item.estoque);

      case "coberturaComPedido":
        return numeroOTB(item.coberturaComPedido);

      case "compraSugerida":
        return numeroOTB(item.compraSugerida);

      /*
       * Foto, prioridade, fornecedor, produto, marca e complemento
       * são iguais para todas as empresas do mesmo item.
       * Nesses casos a empresa vira o desempate natural.
       */
      default:
        return null;
    }
  };

  lista.sort((a,b) => {
    const va = valorOrdenacaoEmpresa(a);
    const vb = valorOrdenacaoEmpresa(b);

    if(va !== null && vb !== null){
      const diferenca = numeroOTB(va) - numeroOTB(vb);

      if(diferenca !== 0){
        return diferenca * direcaoOrdem;
      }
    }

    const ea = String(a.empresa || "").padStart(2,"0");
    const eb = String(b.empresa || "").padStart(2,"0");

    return ea.localeCompare(
      eb,
      "pt-BR",
      {numeric:true,sensitivity:"base"}
    );
  });

  return lista;
}

function htmlTabelaDistribuicaoEmpresaOTB(produto, modoPDF = false){
  const distribuicao = distribuicaoProdutoPorEmpresaOTB(produto);

  if(!distribuicao.length){
    return modoPDF
      ? `<div class="distribuicaoEmpresaVaziaPDFOTB">Sem distribuição por empresa para este item.</div>`
      : `<div class="distribuicaoEmpresaVaziaOTB">Sem distribuição por empresa para este item.</div>`;
  }

  const classeTabela = modoPDF
    ? "tabelaDistribuicaoEmpresaPDFOTB"
    : "tabelaDistribuicaoEmpresaOTB";

  const classeBox = modoPDF
    ? "boxDistribuicaoEmpresaPDFOTB"
    : "boxDistribuicaoEmpresaOTB";

  return `
    <div class="${classeBox}">
      <div class="tituloDistribuicaoEmpresaOTB">
        Distribuição do item por empresa
      </div>

      <table class="${classeTabela}">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Vend.</th>
            <th>Vend. AA</th>
            <th>Compr.</th>
            <th>Compr. AA</th>
            <th>Pedidos</th>
            <th>Estoque</th>
            <th>Giro/Est.</th>
            <th>Giro/Compr.</th>
            <th>Comprar</th>
          </tr>
        </thead>

        <tbody>
          ${distribuicao.map(x => `
            <tr>
              <td><b>${escaparHTMLFotoOTB(x.empresa)}</b></td>
              <td class="num">${formatarNum(x.vendas)}</td>
              <td class="num">${formatarNum(x.venda_ano_passado)}</td>
              <td class="num">${formatarNum(x.compras)}</td>
              <td class="num">${formatarNum(x.compras_ano_passado)}</td>
              <td class="num">${formatarNum(x.pedidos)}</td>
              <td class="num"><b>${formatarNum(x.estoque)}</b></td>
              <td class="num">${formatarGiroProdutoOTB(giroProdutoCentralOTB(x))}</td>
              <td class="num">${formatarGiroProdutoOTB(giroComprasProdutoCentralOTB(x))}</td>
              <td class="num"><b>${formatarNum(x.compraSugerida)}</b></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function fecharDistribuicoesEmpresaTelaOTB(){
  document
    .querySelectorAll(".linhaDistribuicaoEmpresaProdutoOTB")
    .forEach(linha => linha.remove());
}

function alternarDistribuicaoEmpresaProdutoOTB(produto){
  const codigo = String(produto || "").trim();
  if(!codigo) return;

  const mesma =
    OTB_PRODUTO_DISTRIBUICAO_EMPRESA_ABERTO === codigo;

  fecharDistribuicoesEmpresaTelaOTB();

  if(mesma){
    OTB_PRODUTO_DISTRIBUICAO_EMPRESA_ABERTO = "";
    return;
  }

  const linhaProduto = [...document.querySelectorAll(
    ".linhaProdutoCentralOTB"
  )].find(linha =>
    String(linha.dataset.produto || "").trim() === codigo
  );

  if(!linhaProduto) return;

  const quantidadeColunas =
    linhaProduto.cells?.length || 16;

  const detalhe = document.createElement("tr");
  detalhe.className = "linhaDistribuicaoEmpresaProdutoOTB";
  detalhe.dataset.produto = codigo;

  detalhe.innerHTML = `
    <td colspan="${quantidadeColunas}">
      ${htmlTabelaDistribuicaoEmpresaOTB(codigo,false)}
    </td>
  `;

  linhaProduto.insertAdjacentElement("afterend",detalhe);
  OTB_PRODUTO_DISTRIBUICAO_EMPRESA_ABERTO = codigo;
}

/*
 * Mantém exatamente o comportamento anterior quando Empresa NÃO está
 * entre as duas visões. Quando Empresa está ativa, o clique simples
 * passa a abrir a distribuição. O atraso continua preservando o
 * duplo clique para o modal.
 */
const _agendarCliqueProdutoAntesDistribuicaoEmpresaOTB =
  agendarCliqueProdutoOTB;

agendarCliqueProdutoOTB = function(produto,evento){
  const empresaNaAnalise = empresaAtivaNasVisoesPlanejamentoOTB();

  if(!empresaNaAnalise){
    return _agendarCliqueProdutoAntesDistribuicaoEmpresaOTB(
      produto,
      evento
    );
  }

  evento?.preventDefault?.();
  evento?.stopPropagation?.();

  const codigo = String(produto || "").trim();
  if(!codigo) return;

  clearTimeout(OTB_TIMER_CLIQUE_PRODUTO);
  OTB_PRODUTO_CLIQUE_PENDENTE = codigo;

  OTB_TIMER_CLIQUE_PRODUTO = setTimeout(() => {
    const produtoPendente = OTB_PRODUTO_CLIQUE_PENDENTE;

    OTB_TIMER_CLIQUE_PRODUTO = null;
    OTB_PRODUTO_CLIQUE_PENDENTE = "";

    if(produtoPendente){
      alternarDistribuicaoEmpresaProdutoOTB(
        produtoPendente
      );
    }
  },240);
};

/*
 * Após qualquer reconstrução da Central, fecha o detalhe antigo.
 * Isso evita deixar uma distribuição associada a uma linha que já
 * não existe no novo recorte.
 */
const _renderCentralAntesDistribuicaoEmpresaOTB =
  renderCentralEstrategicaProdutosOTB;

renderCentralEstrategicaProdutosOTB = function(dados){
  OTB_PRODUTO_DISTRIBUICAO_EMPRESA_ABERTO = "";
  const retorno =
    _renderCentralAntesDistribuicaoEmpresaOTB(dados);

  if(empresaAtivaNasVisoesPlanejamentoOTB()){
    document
      .querySelectorAll(".linhaProdutoCentralOTB")
      .forEach(linha => {
        linha.title =
          "Clique uma vez para ver a distribuição por empresa. " +
          "Clique duas vezes para abrir o produto.";
      });
  }

  return retorno;
};

/*
 * PDF:
 * usa a tabela já montada e insere uma linha de distribuição logo
 * após cada item, somente quando Empresa está na Visão 1 ou Visão 2.
 */
const _montarTabelaProdutosAntesDistribuicaoEmpresaPDFOTB =
  montarTabelaProdutosPDFOTB;

montarTabelaProdutosPDFOTB = function(
  dados,
  colunasSelecionadas
){
  const htmlBase =
    _montarTabelaProdutosAntesDistribuicaoEmpresaPDFOTB(
      dados,
      colunasSelecionadas
    );

  if(!empresaAtivaNasVisoesPlanejamentoOTB()){
    return htmlBase;
  }

  const lista = agruparProduto(
    Array.isArray(dados) ? dados : []
  ).map(classificarProdutoCentralOTB);

  const ordemPrioridade = {
    "URGENTE":1,
    "ATENÇÃO":2,
    "OPORTUNIDADE":3,
    "EXCESSO":4,
    "SAUDÁVEL":5
  };

  const campo = OTB_ORDENACAO_TABELA.campo;
  const direcao =
    OTB_ORDENACAO_TABELA.direcao === "desc"
      ? -1
      : 1;

  const valorOrdenacao = item => {
    switch(campo){
      case "foto":
      case "produto":
        return `${item.produto || ""} ${item.descricao || ""}`.trim();
      case "prioridade":
        return ordemPrioridade[item.prioridadeCentral] || 99;
      case "fornecedor":
        return item.fornecedor || "";
      case "marca":
        return item.marca || "";
      case "complemento":
        return item.complemento || "";
      case "giro":
        return giroProdutoCentralOTB(item);
      case "giro_compras":
        return giroComprasProdutoCentralOTB(item);
      case "vendas":
        return numeroOTB(item.vendas);
      case "venda_ano_passado":
        return numeroOTB(item.venda_ano_passado);
      case "compras":
        return numeroOTB(item.compras);
      case "compras_ano_passado":
        return numeroOTB(item.compras_ano_passado);
      case "pedidos":
        return numeroOTB(item.pedidos);
      case "estoque":
        return numeroOTB(item.estoque);
      case "coberturaComPedido":
        return numeroOTB(item.coberturaComPedido);
      case "compraSugerida":
        return numeroOTB(item.compraSugerida);
      default:
        return "";
    }
  };

  lista.sort((a,b)=>{
    const va = valorOrdenacao(a);
    const vb = valorOrdenacao(b);

    if(
      typeof va === "number" &&
      typeof vb === "number"
    ){
      const dif = va-vb;
      if(dif !== 0) return dif*direcao;
    }else{
      const cmp = String(va).localeCompare(
        String(vb),
        "pt-BR",
        {numeric:true,sensitivity:"base"}
      );

      if(cmp !== 0) return cmp*direcao;
    }

    return String(a.produto || "").localeCompare(
      String(b.produto || ""),
      "pt-BR",
      {numeric:true,sensitivity:"base"}
    );
  });

  const caixa = document.createElement("div");
  caixa.innerHTML = htmlBase;

  const corpo =
    caixa.querySelector(".tabelaProdutosPDFOTB tbody");

  if(!corpo) return htmlBase;

  const linhasProduto =
    Array.from(corpo.children);

  const totalColunas = Math.max(
    1,
    Array.isArray(colunasSelecionadas)
      ? colunasSelecionadas.length
      : 1
  );

  /*
   * O HTML-base já está na ordem exata da Central Estratégica,
   * pois foi produzido pela função original com os filtros e a
   * ordenação vigentes. Portanto não mexemos nessa ordem aqui:
   * apenas anexamos a distribuição logo após o item correspondente.
   */
  linhasProduto.forEach((linha,indice)=>{
    const item = lista[indice];
    if(!item) return;

    linha.dataset.produto = String(item.produto || "");

    const detalhe = document.createElement("tr");
    detalhe.className = "linhaDistribuicaoEmpresaPDFOTB";
    detalhe.dataset.produtoPai = String(item.produto || "");

    detalhe.innerHTML = `
      <td colspan="${totalColunas}">
        ${htmlTabelaDistribuicaoEmpresaOTB(
          item.produto,
          true
        )}
      </td>
    `;

    linha.insertAdjacentElement("afterend",detalhe);
  });

  return caixa.innerHTML;
};

/* Ao mudar as visões, fecha eventual distribuição aberta. */
document.addEventListener("change",evento=>{
  if(
    evento.target?.id === "visaoPlanejamentoOTB" ||
    evento.target?.id === "visaoPlanejamento2OTB" ||
    evento.target?.id === "usarUmaVisaoPlanejamentoOTB"
  ){
    OTB_PRODUTO_DISTRIBUICAO_EMPRESA_ABERTO = "";
    fecharDistribuicoesEmpresaTelaOTB();
  }
});

