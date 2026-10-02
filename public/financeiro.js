const els = {
    empresa: document.getElementById("empresa"),
    dataIni: document.getElementById("dataIni"),
    dataFim: document.getElementById("dataFim"),
    tipo: { value: "todos" },
    visaoDireita: { value: "plano_conta" },
    rpSaida: { value: "PS" },
    listaEmpresas: document.getElementById("listaEmpresas"),

    fatTotal: document.getElementById("fatTotal"),
    devolucaoTotal: document.getElementById("devolucaoTotal"),
    pagTotal: document.getElementById("pagTotal"),
    abertoTotal: document.getElementById("abertoTotal"),
    saldoTotal: document.getElementById("saldoTotal"),
    topItem: document.getElementById("topItem"),
    topItemValor: document.getElementById("topItemValor"),
    topItemTitulo: document.getElementById("topItemTitulo"),

    tituloDireita1: document.getElementById("tituloDireita1"),
    subtituloDireita1: document.getElementById("subtituloDireita1"),
    tituloDireita2: document.getElementById("tituloDireita2"),
    subtituloDireita2: document.getElementById("subtituloDireita2"),

    graficoFat: document.getElementById("graficoFat"),
    graficoPag: document.getElementById("graficoPag"),
    graficoAberto: document.getElementById("graficoAberto"),
    leituraExec: document.getElementById("leituraExec"),

    detailTitle: document.getElementById("detailTitle"),
    detailSubtitle: document.getElementById("detailSubtitle"),
    detailEmpty: document.getElementById("detailEmpty"),
    detailContent: document.getElementById("detailContent"),
    miniCards: document.getElementById("miniCards"),
    detailTable1Title: document.getElementById("detailTable1Title"),
    detailTable1Subtitle: document.getElementById("detailTable1Subtitle"),
    detailThead1: document.getElementById("detailThead1"),
    detailTbody1: document.getElementById("detailTbody1"),
    detailTable2Title: document.getElementById("detailTable2Title"),
    detailTable2Subtitle: document.getElementById("detailTable2Subtitle"),
    detailThead2: document.getElementById("detailThead2"),
    detailTbody2: document.getElementById("detailTbody2"),
    btnFecharDetalhe: document.getElementById("btnFecharDetalhe"),

    dreFatTotal: document.getElementById("dreFatTotal"),
    drePagTotal: document.getElementById("drePagTotal"),
    dreMetaTotal: document.getElementById("dreMetaTotal"),
    dreRealTotal: document.getElementById("dreRealTotal"),
    dreSaldo: document.getElementById("dreSaldo"),
    dreTbody: document.getElementById("dreTbody"),
    dreAcimaMeta: document.getElementById("dreAcimaMeta"),
    dreMaiorDesvio: document.getElementById("dreMaiorDesvio"),
    dreGrupoPesado: document.getElementById("dreGrupoPesado"),
    dreGrupoPesadoValor: document.getElementById("dreGrupoPesadoValor"),
    graficoDRE: document.getElementById("graficoDRE"),

    dreDetailTitle: document.getElementById("dreDetailTitle"),
    dreDetailSubtitle: document.getElementById("dreDetailSubtitle"),
    dreDetailEmpty: document.getElementById("dreDetailEmpty"),
    dreDetailContent: document.getElementById("dreDetailContent"),
    dreMiniCards: document.getElementById("dreMiniCards"),
    dreItensTbody: document.getElementById("dreItensTbody"),
    dreTitulosTbody: document.getElementById("dreTitulosTbody"),
dreResumoPessoaGrafico: document.getElementById("dreResumoPessoaGrafico"),
    btnFecharDreDetalhe: document.getElementById("btnFecharDreDetalhe"),

        credVendido: document.getElementById("credVendido"),
    credRecebido: document.getElementById("credRecebido"),
    credVencido: document.getElementById("credVencido"),
    credAVencer: document.getElementById("credAVencer"),
    credJuros: document.getElementById("credJuros"),
    credInadimplenciaPct: document.getElementById("credInadimplenciaPct"),
    credInadCarteiraPct: document.getElementById("credInadCarteiraPct"),
    credNaoNegativados: document.getElementById("credNaoNegativados"),
    credDescontos: document.getElementById("credDescontos"),

    credQtdVendidos: document.getElementById("credQtdVendidos"),
    credQtdBaixados: document.getElementById("credQtdBaixados"),
    credQtdVencidos: document.getElementById("credQtdVencidos"),
    credQtdAVencer: document.getElementById("credQtdAVencer"),

    credGraficoMensal: document.getElementById("credGraficoMensal"),
    credRankingTbody: document.getElementById("credRankingTbody"),
    credProjecaoTbody: document.getElementById("credProjecaoTbody"),
    credTitulos: document.getElementById("credTitulos"),
    credBuscaTitulo: document.getElementById("credBuscaTitulo"),
    credSituacaoTitulo: document.getElementById("credSituacaoTitulo"),
    credLimiteTitulo: document.getElementById("credLimiteTitulo"),
    btnCredCarregarTitulos: document.getElementById("btnCredCarregarTitulos"),
    btnCredTitulosAnterior: document.getElementById("btnCredTitulosAnterior"),
    btnCredTitulosProxima: document.getElementById("btnCredTitulosProxima"),
    credTitulosPagina: document.getElementById("credTitulosPagina"),
    credTitulosStatus: document.getElementById("credTitulosStatus"),
    credCarteiraTotal: document.getElementById("credCarteiraTotal"),
    credClientesSaldo: document.getElementById("credClientesSaldo"),
    credClientesInad: document.getElementById("credClientesInad"),
    credTicketCarteira: document.getElementById("credTicketCarteira"),
    credVencido30: document.getElementById("credVencido30"),
    credVencido90: document.getElementById("credVencido90"),
    credAging: document.getElementById("credAging"),
    credSaudeResumo: document.getElementById("credSaudeResumo"),
    credLojasTbody: document.getElementById("credLojasTbody"),
    credPrioridadeTbody: document.getElementById("credPrioridadeTbody"),

    cardReceberAberto: document.getElementById("cardReceberAberto"),
    cardPagarAberto: document.getElementById("cardPagarAberto"),
    fcPrevAvistaAnoPassado: document.getElementById("fcPrevAvistaAnoPassado"),
    fcPrevAprazoAnoPassado: document.getElementById("fcPrevAprazoAnoPassado"),
    fcPrevTotalAnoPassado: document.getElementById("fcPrevTotalAnoPassado"),

    modalFluxoResumo: document.getElementById("modalFluxoResumo"),
    modalFluxoTitulo: document.getElementById("modalFluxoTitulo"),
    modalFluxoSubtitulo: document.getElementById("modalFluxoSubtitulo"),
    modalFluxoTotal: document.getElementById("modalFluxoTotal"),
    modalFluxoQtdGrupos: document.getElementById("modalFluxoQtdGrupos"),
    modalFluxoQtdTitulos: document.getElementById("modalFluxoQtdTitulos"),
    modalFluxoTabelaTitulo: document.getElementById("modalFluxoTabelaTitulo"),
modalFluxoTabelaSubtitulo: document.getElementById("modalFluxoTabelaSubtitulo"),
modalFluxoThead: document.getElementById("modalFluxoThead"),
modalFluxoTbody: document.getElementById("modalFluxoTbody"),
modalFluxoDetalheTitulo: document.getElementById("modalFluxoDetalheTitulo"),
modalFluxoDetalheSubtitulo: document.getElementById("modalFluxoDetalheSubtitulo"),
modalFluxoDetalheTbody: document.getElementById("modalFluxoDetalheTbody"),
modalFluxoColunaAgrupador: document.getElementById("modalFluxoColunaAgrupador"),
boxResumoFornecedorPagar: document.getElementById("boxResumoFornecedorPagar"),
subResumoFornecedorPagar: document.getElementById("subResumoFornecedorPagar"),
tbodyResumoFornecedorPagar: document.getElementById("tbodyResumoFornecedorPagar"),
thResumoPessoaModal: document.getElementById("thResumoPessoaModal"),
  };

let empresasCache = [];
let estadoAtual = {};
let estadoAtivoPassivo = {};
let AP_DETALHE_ATIVO = [];
let AP_DETALHE_PASSIVO = [];
let AP_FILTRO_GRAFICO_ATIVO = null;
let AP_FILTRO_GRAFICO_PASSIVO = null;
let ativoPassivoRequestId = 0;
let AP_RESUMO_GRAFICOS = {};
let AP_DETALHE_CACHE_CHAVE = "";
let AP_DETALHE_CARREGADO = false;

let filtroModalReceber = "";
let filtroModalPagar = "";
let abaAtual = "central";
let crediarioRequestId = 0;
let fluxoRequestId = 0;

  function fmtMoeda(v){
    return Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function fmtNumero(v){
    return Number(v || 0).toLocaleString("pt-BR");
  }

  function fmtPct(v){
    return Number(v || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + "%";
  }

  function fmtData(v){
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("pt-BR");
  }

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

  function corForma(forma){
    const f = String(forma || "").toUpperCase();
    if (f === "PRAZO") return "#94a3b8";
    if (f === "AVISTA") return "#facc15";
    if (f === "DEVOLUCAO") return "#ef4444";
    if (f === "PIX") return "#22c55e";
    if (f === "CARTAO") return "#3b82f6";
    if (f === "CREDIARIO") return "#a78bfa";
    if (f === "CHEQUE") return "#f59e0b";
    if (f === "DEPOSITO") return "#22d3ee";
    if (f === "DEBITO") return "#38bdf8";
    if (f === "DINHEIRO") return "#eab308";
    return "#94a3b8";
  }

  function hojeISO(){
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

function dataISO(d){
  return d.toISOString().slice(0, 10);
}

function aplicarDatasPadraoPorAba(nome = abaAtual){
  const hoje = new Date();

  if (nome === "geral" || nome === "fluxo_projetado") {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dias = nome === "fluxo_projetado" ? 90 : 60;
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias);

    els.dataIni.value = dataISO(ini);
    els.dataFim.value = dataISO(fim);
    return;
  }

  const ontem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 1);
  const tresMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());

  els.dataIni.value = dataISO(tresMesesAtras);
  els.dataFim.value = dataISO(ontem);
}

function aplicarDatasPadrao(){
  aplicarDatasPadraoPorAba(abaAtual);
}

  async function getJSON(url){
  // REGRA GLOBAL DO FINANCEIRO:
  // Plano 012 - TRANSFERÊNCIAS fica excluído por padrão.
  // Toda rota /api/financeiro recebe automaticamente a escolha atual.
  if(String(url || "").startsWith("/api/financeiro/")){
    const excluir = !!document.getElementById("finIncluirTransferencias")?.checked;
    const sep = String(url).includes("?") ? "&" : "?";
    if(!/[?&]incluirTransferencias=/.test(String(url))){
      url = `${url}${sep}incluirTransferencias=${excluir ? "0" : "1"}`;
    }
  }

  const r = await fetch(url);
  const txt = await r.text();

  let j = null;
  try {
    j = txt ? JSON.parse(txt) : null;
  } catch (_) {
    if (!r.ok) {
      throw new Error(`Erro HTTP ${r.status}: resposta não é JSON`);
    }
    throw new Error(`Resposta inválida do servidor. Início retornado: ${txt.slice(0, 120)}`);
  }

  if (!r.ok) throw new Error(j?.erro || `Erro HTTP ${r.status}`);
  return j;
}

function montarUrlDetalheReceber(forma = ""){
  const qs = new URLSearchParams();
  if ((els.empresa.value || "").trim()) qs.set("empresa", (els.empresa.value || "").trim());
  if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
  if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);
  if ((els.tipo.value || "").trim()) qs.set("tipo", (els.tipo.value || "").trim());
  if (forma) qs.set("forma", forma);
  return `/api/financeiro/fluxo-caixa/detalhe-receber?${qs.toString()}`;
}

function montarUrlDetalhePagar(plano = ""){
  const qs = new URLSearchParams();
  if ((els.empresa.value || "").trim()) qs.set("empresa", (els.empresa.value || "").trim());
  if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
  if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);
  if ((els.rpSaida.value || "").trim()) qs.set("rpSaida", (els.rpSaida.value || "").trim());
  if (plano) qs.set("plano", plano);
  return `/api/financeiro/fluxo-caixa/detalhe-pagar?${qs.toString()}`;
}

function montarUrlDRE(){
  const qs = new URLSearchParams();
  if ((els.empresa.value || "").trim()) qs.set("empresa", (els.empresa.value || "").trim());
  if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
  if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);
  if (els.tipo.value && els.tipo.value !== "todos") qs.set("tipo", els.tipo.value);
  return `/api/financeiro/meta-real?${qs.toString()}`;
}
function montarUrlDreDetalhe(grupo, opcoes = {}){
  const qs = new URLSearchParams();

  if ((els.empresa.value || "").trim()) {
    qs.set("empresa", (els.empresa.value || "").trim());
  }

  if (DRE_FILTRO_EMPRESAS.size) {
    qs.set("empresasGrafico", [...DRE_FILTRO_EMPRESAS].join(","));
  }

  if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
  if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);

  if (els.tipo?.value && els.tipo.value !== "todos") {
    qs.set("tipo", els.tipo.value);
  }

  qs.set("grupo", grupo);

  if(opcoes.modoTabela){
    qs.set("modo","tabela");
  }

  return `/api/financeiro/meta-real-detalhe?${qs.toString()}`;
}

  function preencherMesAtual(){
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes, hoje.getDate());

  els.dataIni.value = primeiroDia.toISOString().slice(0, 10);
  els.dataFim.value = ultimoDia.toISOString().slice(0, 10);

  recarregarAbaAtual();
}

function preencherUltimos12Meses(){

  const fim = new Date();

  const ini = new Date(
    fim.getFullYear(),
    fim.getMonth() - 11,
    fim.getDate()
  );

  document.getElementById("dataIni").value = dataISO(ini);
  document.getElementById("dataFim").value = dataISO(fim);

  recarregarAbaAtual();
}
function carregarDRECaixa12Meses(){
  const hoje = new Date();
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const ini = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate());

  els.dataIni.value = ini.toISOString().slice(0, 10);
  els.dataFim.value = fim.toISOString().slice(0, 10);

  abaAtual = "dre_caixa";
  carregarDRECaixa();
}

function carregarDRE12Meses(){
  return carregarDRECompetencia12Meses();
}

  function limparFiltros(){
  QD_SITUACOES_MULTI.receber?.clear();
  QD_SITUACOES_MULTI.pagar?.clear();
  els.empresa.value = "";
  aplicarDatasPadraoPorAba(abaAtual);
  els.tipo.value = "todos";
  els.visaoDireita.value = "plano_conta";
  els.rpSaida.value = "PS";
  const finSituacao = document.getElementById("filtroSituacaoFinanceira");
  if(finSituacao) {
    finSituacao.value = "ABERTO";
    if(abaAtual==="fluxo_projetado") finSituacao.disabled=true;
  }

  const finTransf = document.getElementById("finIncluirTransferencias");
  if(finTransf) finTransf.checked = false;
  document.body.classList.remove("fin-inclui-transferencias");
  atualizarDatalistEmpresas("");
  limparDetalhe();
  limparDetalheDRE();
  ["rentMarca","rentDepartamento","rentGrupo","rentSubgrupo","rentBusca"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = "";
  });
  recarregarAbaAtual();
}

  function voltarHome(){
    window.location.href = "/home";
  }

  
function atualizarFiltrosContextuaisFinanceiro(nomeAba){
  const labelPessoa = document.getElementById("labelFiltroPessoaFinanceiro");
  const labelSec = document.getElementById("labelFiltroSecundarioFinanceiro");
  const campoPessoa = document.getElementById("filtroFornecedorFluxo");
  const campoSec = document.getElementById("filtroPlanoFluxo");

  const ehReceber = nomeAba === "crediario";
  const ehPagar = nomeAba === "contas_pagar";

  if(ehReceber){
    if(labelPessoa) labelPessoa.textContent = "Cliente";
    if(campoPessoa) {
      campoPessoa.placeholder = "Cliente";
      campoPessoa.setAttribute("aria-label","Cliente");
    }

    if(labelSec) labelSec.textContent = "Forma de pagamento";
    if(campoSec) {
      campoSec.placeholder = "Ex.: PIX, CARTÃO, CREDIÁRIO...";
      campoSec.setAttribute("aria-label","Forma de pagamento");
    }
    return;
  }

  // Demais módulos continuam com o padrão financeiro original.
  if(labelPessoa) labelPessoa.textContent = "Fornecedor";
  if(campoPessoa) {
    campoPessoa.placeholder = "Fornecedor";
    campoPessoa.setAttribute("aria-label","Fornecedor");
  }

  if(labelSec) labelSec.textContent = "Plano de conta";
  if(campoSec) {
    campoSec.placeholder = "Plano de conta";
    campoSec.setAttribute("aria-label","Plano de conta");
  }
}
window.atualizarFiltrosContextuaisFinanceiro = atualizarFiltrosContextuaisFinanceiro;

function atualizarCamposInlineFluxoProjetado(nome=abaAtual){
  const box=document.getElementById("finInlineProjectionFields");
  if(!box) return;
  box.style.display = nome==="fluxo_projetado" ? "flex" : "none";
}


function atualizarSituacaoFluxoProjetado(nome=abaAtual){
  const select=document.getElementById("filtroSituacaoFinanceira");
  if(!select) return;

  const ehFluxo = nome==="fluxo_projetado";

  if(ehFluxo){
    // Fluxo de Caixa Projetado trabalha exclusivamente com títulos em aberto.
    select.value="ABERTO";
    select.disabled=true;
    select.dataset.lockedFluxo="1";
    select.title="Fluxo de Caixa Projetado: somente títulos em aberto entram na projeção.";
  }else{
    select.disabled=false;
    delete select.dataset.lockedFluxo;
    select.title="Selecione a situação financeira.";
  }
}

function trocarAba(nome){
  abaAtual = nome;
  atualizarCamposInlineFluxoProjetado(nome);
  atualizarSituacaoFluxoProjetado(nome);
  atualizarFiltrosContextuaisFinanceiro(nome);

  if(!els.dataIni.value || !els.dataFim.value){
    aplicarDatasPadraoPorAba(nome === "central" ? "geral" : nome);
  }

  const mapaViews = {
    central: "view-central",
    geral: "view-geral",
    fluxo_projetado: "view-fluxo-projetado",
    dre_competencia: "view-dre-competencia",
    dre_caixa: "view-dre-caixa",
    crediario: "view-crediario",
    ativo_passivo: "view-ativo-passivo",
    analise_crediario: "view-analise-crediario",
    contas_pagar: "view-contas-pagar",
    conciliacao: "view-conciliacao",
    rentabilidade: "view-rentabilidade"
  };

  Object.values(mapaViews).forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });

  document.getElementById(mapaViews[nome])?.classList.add("active");

  document.querySelectorAll(".finance-nav-item[data-fin-modulo]").forEach(btn => {
    const modulo = btn.dataset.finModulo;
    const ativo =
      (nome === "central" && modulo === "central_financeira") ||
      (nome === "geral" && modulo === "caixa_liquidez") ||
      (nome === "fluxo_projetado" && modulo === "fluxo_caixa_projetado") ||
      (nome === "crediario" && modulo === "contas_receber") ||
      (nome === "contas_pagar" && modulo === "contas_pagar") ||
      (nome === "conciliacao" && modulo === "bancos_conciliacao") ||
      (nome === "dre_competencia" && modulo === "resultado_gerencial") ||
      (nome === "dre_caixa" && modulo === "resultado_caixa") ||
      (nome === "rentabilidade" && modulo === "margem_rentabilidade") ||
      (nome === "ativo_passivo" && modulo === "posicao_financeira") ||
      (nome === "analise_crediario" && modulo === "analise_crediario");

    btn.classList.toggle("active", ativo);
  });

  const contexto = {
    central: ["Central Financeira", "Visão executiva consolidada da operação financeira."],
    geral: ["Caixa & Liquidez", "Fluxo de caixa, entradas, saídas, saldos e projeções."],
    fluxo_projetado: ["Fluxo de Caixa Projetado", "De hoje para frente: Ativo com até 90 dias vencidos e Passivo somente futuro."],
    dre_competencia: ["Resultado Gerencial", "Resultado por competência, metas e realizado."],
    dre_caixa: ["Resultado por Caixa", "Resultado conforme entradas e saídas efetivas."],
    crediario: ["Contas a Receber", "Carteira, recebimentos, vencimentos e inadimplência."],
    ativo_passivo: ["Posição Financeira", "Direitos, obrigações e exposição financeira."],
    analise_crediario: ["Análise de Crediário", "Crédito, cobrança, inadimplência, SCPC e recuperação."],
    contas_pagar: ["Contas a Pagar", "Obrigações, vencimentos, fornecedores e concentração dos pagamentos."],
    conciliacao: ["Bancos & Conciliação", "Extratos bancários, conferência e divergências."],
    rentabilidade: ["Margem & Rentabilidade", "Lucro bruto, margem e desempenho comercial."]
  };

  const cfg = contexto[nome] || ["Financeiro", ""];
  const titulo = document.getElementById("financeContextTitle");
  const subtitulo = document.getElementById("financeContextSubtitle");
  if(titulo) titulo.textContent = cfg[0];
  if(subtitulo) subtitulo.textContent = cfg[1];

  // Primeiro posiciona visualmente o quadro no topo da coluna direita.
  mostrarQuadroNoEspacoCerto(nome);

  // Depois inicia a consulta da aba.
  recarregarAbaAtual();

  

  if(nome === "dre_competencia"){
    
  }
}

// =====================================================
// PADRÃO GLOBAL — BOTÕES DE BUSCA
// Enquanto a consulta estiver rodando:
// - mostra "Executando..."
// - desabilita o botão
// - restaura texto/estado ao terminar ou falhar
// =====================================================
async function executarBuscaComBotao(botao, acao, textoExecutando = "Executando..."){
  if(!botao || botao.dataset.executando === "1") return;

  const textoOriginal = botao.dataset.textoOriginal || botao.textContent.trim();
  botao.dataset.textoOriginal = textoOriginal;
  botao.dataset.executando = "1";
  botao.disabled = true;
  botao.setAttribute("aria-busy","true");
  botao.textContent = textoExecutando;

  // Dá ao navegador tempo para desenhar o estado "Executando..."
  // antes de iniciar a consulta ou aplicar dados do cache.
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  try{
    const resultado = typeof acao === "function" ? acao() : acao;
    return await Promise.resolve(resultado);
  }finally{
    botao.textContent = textoOriginal;
    botao.disabled = false;
    botao.removeAttribute("aria-busy");
    delete botao.dataset.executando;
  }
}

function recarregarAbaAtual(){
  if (abaAtual === "central") return carregarTudo();
  if (abaAtual === "fluxo_projetado") return carregarFluxoCaixaProjetado();
  if (abaAtual === "dre_competencia") return carregarDRECompetencia();
  if (abaAtual === "dre_caixa") return carregarDRECaixa();
  if (abaAtual === "crediario") return carregarQuadroDemonstrativo("receber");
  if (abaAtual === "contas_pagar") return carregarQuadroDemonstrativo("pagar");
  if (abaAtual === "ativo_passivo") return carregarAtivoPassivo();
  if (abaAtual === "analise_crediario") return carregarCrediario();
  if (abaAtual === "conciliacao") return prepararAbaConciliacao();
  if (abaAtual === "rentabilidade") return carregarRentabilidade();
  return carregarTudo();
}

function renderCredScpcResumo(lista){
  const el = document.getElementById("credScpcResumo");
  if (!el) return;

  const dados = Array.isArray(lista) ? lista : [];

  if (!dados.length){
    el.innerHTML = `<div style="color:var(--muted);font-size:13px;">Sem dados no período.</div>`;
    return;
  }

  el.innerHTML = dados.map(x => `
    <div
      style="
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:10px;
        align-items:start;
        border-bottom:1px solid rgba(255,255,255,.06);
        padding-bottom:6px;
      "
    >
      <div style="min-width:0;">
        <div
          style="
            font-size:12px;
            font-weight:700;
            color:#dbe7ff;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
          "
          title="${esc(x.status || '-')}"
        >
          ${esc(x.status || "-")}
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px;">
          ${fmtNumero(x.qtdTitulos || 0)} título(s)
        </div>
      </div>
      <div
        style="
          font-size:12px;
          font-weight:800;
          color:#fda4af;
          white-space:nowrap;
        "
      >
        ${fmtMoeda(x.valor || 0)}
      </div>
    </div>
  `).join("");
}

function renderCredMensal(lista){
  if (!els.credGraficoMensal) return;

  const dados = Array.isArray(lista) ? lista : [];
  if (!dados.length){
    els.credGraficoMensal.innerHTML = `<div class="empty">Sem dados mensais.</div>`;
    return;
  }

  const maior = Math.max(...dados.map(x => Number(x.vendido || 0)), 1);

  els.credGraficoMensal.innerHTML = dados.map((x) => {
    const pct = (Number(x.vendido || 0) / maior) * 100;
    return `
      <div class="bar-row">
        <div class="bar-label" title="${esc(x.periodo)}">${esc(x.periodo)}</div>
        <div class="bar-track" title="Vendido: ${fmtMoeda(x.vendido)} | Recebido: ${fmtMoeda(x.recebido)} | Vencido: ${fmtMoeda(x.vencido)} | Acréscimos: ${fmtMoeda(x.acrescimos)}">
          <div class="bar-fill" style="width:${Math.max(pct,1)}%; background:#3b82f6;"></div>
        </div>
        <div class="bar-value">
          ${fmtMoeda(x.vendido)}
          <div style="font-size:11px;color:var(--muted);font-weight:600;">Rec: ${fmtMoeda(x.recebido)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCredRanking(lista){
  const dados = Array.isArray(lista) ? lista : [];
  els.credRankingTbody.innerHTML = dados.length
    ? dados.map(x => `
        <tr>
          <td>${esc(x.cliente || "-")}</td>
          <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
          <td class="num">${fmtMoeda(x.totalVencido || 0)}</td>
          <td>${fmtData(x.primeiroVencimento)}</td>
          <td>${fmtData(x.ultimoVencimento)}</td>
          <td>${esc(x.scpcStatus || "-")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" class="empty">Sem inadimplentes no período.</td></tr>`;
}

function renderCredProjecao(lista){
  const dados = Array.isArray(lista) ? lista : [];
  els.credProjecaoTbody.innerHTML = dados.length
    ? dados.map(x => `
        <tr>
          <td>${esc(x.periodo || "-")}</td>
          <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
          <td class="num">${fmtMoeda(x.total || 0)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="3" class="empty">Sem projeção futura.</td></tr>`;
}


function credClasseRisco(pct){
  const n = Number(pct || 0);
  if (n <= 5) return { classe:"saudavel", texto:"SAUDÁVEL" };
  if (n <= 10) return { classe:"atencao", texto:"ATENÇÃO" };
  if (n <= 20) return { classe:"cobranca", texto:"COBRANÇA" };
  return { classe:"critico", texto:"CRÍTICO" };
}

function renderCredAging(lista){
  if (!els.credAging) return;
  const dados = Array.isArray(lista) ? lista : [];
  if (!dados.length){ els.credAging.innerHTML = `<div class="empty">Sem carteira aberta para montar a régua.</div>`; return; }
  const maior = Math.max(...dados.map(x => Number(x.total || 0)), 1);
  els.credAging.innerHTML = dados.map(x => {
    const pct = (Number(x.total || 0) / maior) * 100;
    const ordem = Number(x.ordem || 0);
    const cls = ordem === 0 ? "ok" : ordem <= 3 ? "warn" : ordem <= 5 ? "risk" : "critical";
    return `<div class="cred-aging-row ${cls}">
      <div class="cred-aging-label"><strong>${esc(x.faixa)}</strong><small>${fmtNumero(x.qtdTitulos)} títulos</small></div>
      <div class="cred-aging-track"><div class="cred-aging-fill" style="width:${Math.max(pct,1)}%"></div></div>
      <div class="cred-aging-value">${fmtMoeda(x.total)}</div>
    </div>`;
  }).join("");
}

function renderCredSaude(resumo){
  if (!els.credSaudeResumo) return;
  const risco = credClasseRisco(resumo?.inadimplenciaPct || 0);
  els.credSaudeResumo.innerHTML = `
    <div class="cred-health-badge ${risco.classe}">${risco.texto}</div>
    <div class="cred-health-copy">
      <strong>${fmtPct(resumo?.inadimplenciaPct || 0)} de inadimplência</strong>
      <span>${fmtMoeda(resumo?.vencido || 0)} vencidos de ${fmtMoeda(resumo?.aberto || 0)} em carteira aberta.</span>
    </div>`;
}

function renderCredLojas(lista){
  if (!els.credLojasTbody) return;
  const dados = Array.isArray(lista) ? lista : [];
  els.credLojasTbody.innerHTML = dados.length ? dados.map(x => {
    const r=credClasseRisco(x.inadimplenciaPct);
    return `<tr>
      <td title="${esc(x.empresaNome || '')}"><strong>${esc(x.empresa || "-")}</strong>${x.empresaNome ? `<small class="rent-empresa-nome">${esc(x.empresaNome)}</small>` : ''}</td>
      <td class="num">${fmtMoeda(x.carteira)}</td>
      <td class="num">${fmtMoeda(x.vencido)}</td>
      <td class="num">${fmtPct(x.inadimplenciaPct)}</td>
      <td class="num">${fmtNumero(x.clientes)}</td>
      <td class="num">${fmtNumero(x.inadimplentes)}</td>
      <td><span class="cred-risk-pill ${r.classe}">${r.texto}</span></td>
    </tr>`;
  }).join("") : `<tr><td colspan="7" class="empty">Sem dados por loja.</td></tr>`;
}

function renderCredPrioridade(lista){
  if (!els.credPrioridadeTbody) return;
  const dados = Array.isArray(lista) ? lista : [];
  els.credPrioridadeTbody.innerHTML = dados.length ? dados.map((x,i) => {
    const p=String(x.prioridade||"ATENCAO").toLowerCase();
    return `<tr>
      <td>${i+1}</td>
      <td><strong>${esc(x.cliente || "-")}</strong></td>
      <td class="num">${fmtMoeda(x.totalVencido)}</td>
      <td class="num">${fmtNumero(x.maiorAtraso)} dias</td>
      <td class="num">${fmtNumero(x.qtdTitulos)}</td>
      <td>${esc(x.scpcStatus || "-")}</td>
      <td>${x.negativado ? '<span class="pill acima">NEGATIVADO</span>' : '<span class="pill ok">NÃO</span>'}</td>
      <td><span class="cred-priority ${p}">${esc(x.prioridade || "ATENÇÃO")}</span></td>
    </tr>`;
  }).join("") : `<tr><td colspan="8" class="empty">Nenhum cliente vencido no filtro.</td></tr>`;
}

let credTitulosPaginaAtual = 1;
let credTitulosCarregando = false;

function atualizarPaginadorCred(temMais){
  if (els.credTitulosPagina) els.credTitulosPagina.textContent = `Página ${credTitulosPaginaAtual}`;
  if (els.btnCredTitulosAnterior) els.btnCredTitulosAnterior.disabled = credTitulosCarregando || credTitulosPaginaAtual <= 1;
  if (els.btnCredTitulosProxima) els.btnCredTitulosProxima.disabled = credTitulosCarregando || !temMais;
}

function renderCredTitulosDetalhe(titulos){
  if (!els.credTitulos) return;
  els.credTitulos.innerHTML = titulos.length ? titulos.map(x => `
    <tr>
      <td>${fmtData(x.lancamento)}</td><td>${fmtData(x.vencimento)}</td><td>${fmtData(x.pagamento)}</td>
      <td>${esc(x.documento || "-")}</td><td>${esc(x.empresa || "-")}</td><td>${esc(x.cliente || "-")}</td>
      <td class="num">${fmtMoeda(x.valor || 0)}</td><td class="num">${fmtMoeda(x.valorPago || 0)}</td><td class="num">${fmtMoeda(x.faltaReceber || 0)}</td>
      <td>${esc(x.situacao || "-")}</td>
      <td><span class="pill ${x.scpcStatus === "Nada consta" || x.scpcStatus === "Reabilitado" ? "ok" : "acima"}">${esc(x.scpcStatus || "Não metrificado")}</span></td>
      <td>${fmtData(x.scpcEntrada)}</td><td>${fmtData(x.scpcSaida)}</td>
    </tr>`).join("") : `<tr><td colspan="13" class="empty">Nenhum título encontrado neste filtro.</td></tr>`;
}

async function carregarCredTitulosDetalhe(pagina = 1){
  if (credTitulosCarregando) return;
  credTitulosCarregando = true;
  credTitulosPaginaAtual = Math.max(1, Number(pagina) || 1);
  atualizarPaginadorCred(false);
  if (els.credTitulosStatus) els.credTitulosStatus.textContent = "Consultando somente esta página de títulos...";
  if (els.btnCredCarregarTitulos) els.btnCredCarregarTitulos.disabled = true;
  try{
    const qs = new URLSearchParams();
    if ((els.empresa.value || "").trim()) qs.set("empresa", (els.empresa.value || "").trim());
    if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
    if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);
    qs.set("pagina", String(credTitulosPaginaAtual));
    qs.set("limit", String(Number(els.credLimiteTitulo?.value || 50)));
    const busca = String(els.credBuscaTitulo?.value || "").trim();
    const situacao = String(els.credSituacaoTitulo?.value || "TODOS").trim();
    if (busca) qs.set("busca", busca);
    if (situacao && situacao !== "TODOS") qs.set("situacao", situacao);

    const r = await getJSON(`/api/financeiro/crediario-titulos?${qs.toString()}`);
    const titulos = Array.isArray(r.titulos) ? r.titulos : [];
    renderCredTitulosDetalhe(titulos);
    if (els.credTitulosStatus) els.credTitulosStatus.textContent = `${fmtNumero(titulos.length)} título(s) nesta página. Apenas o necessário foi transferido do servidor.`;
    credTitulosCarregando = false;
    atualizarPaginadorCred(Boolean(r.temMais));
    ativarOrdenacaoEmTodasAsTabelas();
  }catch(e){
    console.error("Erro no detalhamento do crediário:", e);
    if (els.credTitulos) els.credTitulos.innerHTML = `<tr><td colspan="13" class="empty">Erro ao carregar o detalhamento.</td></tr>`;
    if (els.credTitulosStatus) els.credTitulosStatus.textContent = "Não foi possível carregar esta página.";
    credTitulosCarregando = false;
    atualizarPaginadorCred(false);
  }finally{
    if (els.btnCredCarregarTitulos) els.btnCredCarregarTitulos.disabled = false;
  }
}

if (els.btnCredCarregarTitulos) els.btnCredCarregarTitulos.addEventListener("click", () => carregarCredTitulosDetalhe(1));
if (els.btnCredTitulosAnterior) els.btnCredTitulosAnterior.addEventListener("click", () => carregarCredTitulosDetalhe(credTitulosPaginaAtual - 1));
if (els.btnCredTitulosProxima) els.btnCredTitulosProxima.addEventListener("click", () => carregarCredTitulosDetalhe(credTitulosPaginaAtual + 1));
if (els.credBuscaTitulo) els.credBuscaTitulo.addEventListener("keydown", e => { if (e.key === "Enter") carregarCredTitulosDetalhe(1); });

async function carregarCrediario(){
  if (abaAtual !== "analise_crediario") return;

  const qs = new URLSearchParams({
    empresa: els.empresa?.value || "todas",
    dataIni: els.dataIni?.value || "",
    dataFim: els.dataFim?.value || ""
  });

  if (els.credSaudeResumo) {
    els.credSaudeResumo.innerHTML = `<div class="empty">Carregando indicadores...</div>`;
  }

  try {
    // ABERTURA LEVE: somente agregados. Nenhuma tabela detalhada é baixada aqui.
    const [rResumo, rDashboard, rMensal] = await Promise.all([
      getJSON(`/api/financeiro/crediario-resumo?${qs.toString()}`),
      getJSON(`/api/financeiro/crediario-dashboard?${qs.toString()}`),
      getJSON(`/api/financeiro/crediario-mensal?${qs.toString()}`).catch(() => ({ data: [] }))
    ]);

    const d = rResumo.resumo || rResumo || {};
    const di = rDashboard.indicadores || {};
    const carteira = Number(di.carteira || d.aberto || 0);
    const vencido = Number(d.vencido || 0);
    const vendido = Number(d.vendido || 0);
    const inadCarteira = carteira > 0 ? (vencido / carteira) * 100 : 0;
    const pressaoVendas = vendido > 0 ? (vencido / vendido) * 100 : 0;

    if (els.credVendido) els.credVendido.textContent = fmtMoeda(vendido);
    if (els.credRecebido) els.credRecebido.textContent = fmtMoeda(d.recebido || 0);
    if (els.credVencido) els.credVencido.textContent = fmtMoeda(vencido);
    if (els.credAVencer) els.credAVencer.textContent = fmtMoeda(d.aVencer || 0);
    if (els.credCarteiraTotal) els.credCarteiraTotal.textContent = fmtMoeda(carteira);
    if (els.credInadCarteiraPct) els.credInadCarteiraPct.textContent = `${fmtNumero(inadCarteira,2)}%`;
    if (els.credInadimplenciaPct) els.credInadimplenciaPct.textContent = `${fmtNumero(pressaoVendas,2)}%`;

    if (els.credClientesSaldo) els.credClientesSaldo.textContent = fmtNumero(di.clientesComSaldo || 0);
    if (els.credClientesInad) els.credClientesInad.textContent = fmtNumero(di.clientesInadimplentes || 0);
    if (els.credTicketCarteira) els.credTicketCarteira.textContent = fmtMoeda(di.ticketCarteira || 0);
    if (els.credVencido30) els.credVencido30.textContent = fmtMoeda(di.vencido30 || 0);
    if (els.credVencido90) els.credVencido90.textContent = fmtMoeda(di.vencido90 || 0);
    if (els.credNaoNegativados) els.credNaoNegativados.textContent = fmtNumero(d.qtdVencidosNaoNegativados || 0);
    if (els.credJuros) els.credJuros.textContent = fmtMoeda(d.jurosRecebidos || 0);
    if (els.credDescontos) els.credDescontos.textContent = fmtMoeda(d.descontos || 0);
    if (els.credQtdVendidos) els.credQtdVendidos.textContent = fmtNumero(d.qtdVendido || 0);
    if (els.credQtdBaixados) els.credQtdBaixados.textContent = fmtNumero(d.qtdBaixados || 0);
    if (els.credQtdVencidos) els.credQtdVencidos.textContent = fmtNumero(d.qtdVencidos || 0);
    if (els.credQtdAVencer) els.credQtdAVencer.textContent = fmtNumero(d.qtdAVencer || 0);

    renderCredSaude(d);
    renderCredAging(rDashboard.aging || []);
    renderCredScpcResumo(d.scpcResumo || []);
    renderCredMensal(rMensal.data || rMensal || []);

    const cacheInfo=document.getElementById("credCacheInfo");
    if(cacheInfo){
      const meta=rResumo._cache || rDashboard._cache;
      cacheInfo.textContent = meta?.geradoEm
        ? `Dados em cache • atualizado ${new Date(meta.geradoEm).toLocaleString("pt-BR")}`
        : "Dados analíticos carregados";
    }
  } catch (e) {
    console.error("Erro ao carregar crediário:", e);
    if (els.credSaudeResumo) {
      els.credSaudeResumo.innerHTML = `<div class="empty">Falha ao carregar a análise de crediário.</div>`;
    }
  }
}

    function atualizarTitulosDireita(visao){
  const ehFornecedor = String(visao || "plano_conta") === "fornecedor";

  els.topItemTitulo.textContent = ehFornecedor ? "Maior fornecedor" : "Maior plano de conta";
  els.tituloDireita1.textContent = ehFornecedor ? "Financeiro baixado por fornecedor" : "Financeiro baixado por plano de conta";
  els.subtituloDireita1.textContent = ehFornecedor
    ? "Clique em um fornecedor para ver instruções e complemento."
    : "Clique em um plano de conta verdadeiro para ver instruções e complemento.";

  els.tituloDireita2.textContent = ehFornecedor ? "Financeiro em aberto por fornecedor" : "Financeiro em aberto por plano de conta";
  els.subtituloDireita2.textContent = ehFornecedor
    ? "Clique em um fornecedor para ver os lançamentos."
    : "Clique em um plano de conta verdadeiro para ver os lançamentos.";
}

function renderBarras(targetEl, lista, totalBase, corFixa = null, onClick = null){
  if (!lista.length){
    targetEl.innerHTML = `<div class="empty">Sem dados.</div>`;
    return;
  }

  targetEl.innerHTML = lista.map((x, idx) => {
    const pct = totalBase > 0 ? (Number(x.total || 0) / totalBase) * 100 : 0;
    const cor = corFixa || corForma(x.forma || x.item);
    return `
      <div class="bar-row" data-idx="${idx}">
        <div class="bar-label" title="${esc(x.forma || x.item)}">${esc(x.forma || x.item)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.max(pct, 1)}%; background:${cor};"></div>
        </div>
        <div class="bar-value">${fmtMoeda(x.total)}</div>
      </div>
    `;
  }).join("");

  if (typeof onClick === "function"){
    [...targetEl.querySelectorAll(".bar-row")].forEach((el, idx) => {
      el.addEventListener("click", () => onClick(lista[idx]));
    });
  }
}

function rotuloCurtoDRE(grupo){
  return String(grupo || "")
    .replace(/^\d{2}-/, "")
    .replace("DESPESA GERAL", "DESP. GERAL")
    .replace("DESPESA FINANCEIRA", "DESP. FIN.")
    .replace("INVEST EMPRESA", "INVEST.")
    .replace("MENS SISTEMA", "SISTEMAS")
    .replace("NAO CLASSIFICADO", "OUTROS");
}

let DRE_DATASET_ATUAL = null;
let DRE_FILTRO_GRUPOS = new Set();
let DRE_FILTRO_EMPRESAS = new Set();
let DRE_FILTRO_STATUS = "";
let DRE_SAIDAS_PAGAS_CACHE = null;
let DRE_SAIDAS_PAGAS_CHAVE = "";
let DRE_OPERACIONAL_CACHE = null;
let DRE_OPERACIONAL_CHAVE = "";
let DRE_OPERACIONAL_VIEW = "fornecedores";
let DRE_CLICK_TIMER = null;
let DRE_ULTIMO_GRUPO_DETALHE = "";
let DRE_DETALHE_SYNC_TIMER = null;
let DRE_DETALHE_SYNC_CHAVE = "";

function dreToggleFiltro(set, valor){
  const chave = String(valor || "").trim();
  if(!chave) return;

  if(set.has(chave)){
    set.delete(chave);
    if(set === DRE_FILTRO_GRUPOS && DRE_ULTIMO_GRUPO_DETALHE === chave){
      DRE_ULTIMO_GRUPO_DETALHE = [...DRE_FILTRO_GRUPOS].at(-1) || "";
    }
  }else{
    set.add(chave);
    if(set === DRE_FILTRO_GRUPOS){
      DRE_ULTIMO_GRUPO_DETALHE = chave;
    }
  }

  aplicarFiltrosCruzadosDRE();
}

function limparFiltrosGraficosDRE(){
  DRE_FILTRO_GRUPOS.clear();
  DRE_FILTRO_EMPRESAS.clear();
  DRE_FILTRO_STATUS = "";
  DRE_ULTIMO_GRUPO_DETALHE = "";
  aplicarFiltrosCruzadosDRE();
  atualizarEstadoBotaoTabelaDRE();
}

function dreCliqueOuDuploClique(acaoClique){
  if(DRE_CLICK_TIMER){
    clearTimeout(DRE_CLICK_TIMER);
    DRE_CLICK_TIMER = null;
    limparFiltrosGraficosDRE();
    return;
  }
  DRE_CLICK_TIMER = setTimeout(()=>{
    DRE_CLICK_TIMER = null;
    acaoClique();
  }, 220);
}

function dreAgregacaoAtual(){
  const base = DRE_DATASET_ATUAL || {};
  const empresasBase = Array.isArray(base.empresas) ? base.empresas : [];
  const dadosBase = Array.isArray(base.dados) ? base.dados : [];

  const empresasSelecionadas = DRE_FILTRO_EMPRESAS.size
    ? empresasBase.filter(e => DRE_FILTRO_EMPRESAS.has(String(e.empresa || "")))
    : empresasBase;

  const fat = empresasSelecionadas.length
    ? empresasSelecionadas.reduce((s,e)=>s+Number(e.totalFaturado||0),0)
    : Number(base.totalFaturado||0);

  const metas = new Map(
    dadosBase.map(x=>[String(x.grupo||""),Number(x.meta||0)])
  );

  // Todos os grupos recalculados conforme as empresas selecionadas.
  // Não eliminamos visualmente os demais grupos: isso mantém multi-seleção possível.
  const mapaGrupo = new Map();
  empresasSelecionadas.forEach(e=>{
    (Array.isArray(e.dados)?e.dados:[]).forEach(x=>{
      const g=String(x.grupo||"");
      mapaGrupo.set(g,Number(mapaGrupo.get(g)||0)+Number(x.valor||0));
    });
  });

  const dadosVisual = [...metas.keys()].map(g=>{
    const valor = Number(mapaGrupo.get(g)||0);
    const meta = Number(metas.get(g)||0);
    const realizado = fat>0 ? (valor/fat)*100 : 0;
    return {
      grupo:g,
      meta,
      valor,
      realizado,
      diferenca:realizado-meta,
      metaValor:fat*(meta/100),
      status:realizado<=meta ? "OK" : "ACIMA"
    };
  });

  // Para cards e tabela, aí sim usamos somente os filtros ativos.
  let dados = [...dadosVisual];
  if(DRE_FILTRO_GRUPOS.size){
    dados=dados.filter(x=>DRE_FILTRO_GRUPOS.has(String(x.grupo||"")));
  }
  if(DRE_FILTRO_STATUS){
    dados=dados.filter(x=>String(x.status||"").toUpperCase()===DRE_FILTRO_STATUS);
  }

  const gruposAtivos = DRE_FILTRO_GRUPOS.size
    ? new Set(DRE_FILTRO_GRUPOS)
    : new Set(dadosVisual.map(x=>String(x.grupo||"")));

  // Gráfico de empresas é recalculado pelos grupos selecionados,
  // mas mantém TODAS as lojas visíveis para permitir seleção múltipla.
  const empresasGrafico = empresasBase.map(e=>{
    const faturamentoEmpresa=Number(e.totalFaturado||0);
    let itens=(Array.isArray(e.dados)?e.dados:[])
      .filter(x=>gruposAtivos.has(String(x.grupo||"")));

    if(DRE_FILTRO_STATUS){
      // Recalcula status do grupo dentro da própria empresa.
      itens=itens.filter(x=>{
        const meta=Number(x.meta||0);
        const real=faturamentoEmpresa>0?(Number(x.valor||0)/faturamentoEmpresa)*100:0;
        const status=real<=meta?"OK":"ACIMA";
        return status===DRE_FILTRO_STATUS;
      });
    }

    const valor=itens.reduce((s,x)=>s+Number(x.valor||0),0);
    const metaPercentual=itens.reduce((s,x)=>s+Number(x.meta||0),0);
    const metaValor=faturamentoEmpresa*(metaPercentual/100);
    const realPercentual=faturamentoEmpresa>0?(valor/faturamentoEmpresa)*100:0;

    return {
      ...e,
      valor,
      metaValor,
      metaPercentual,
      realPercentual
    };
  }).sort((a,b)=>Number(b.valor||0)-Number(a.valor||0));

  return {fat,dados,dadosVisual,empresasGrafico};
}
function atualizarResumoDREFiltrado(fat,dados){
  const totalPago=dados.reduce((s,x)=>s+Number(x.valor||0),0);
  const metaTotal=dados.reduce((s,x)=>s+Number(x.meta||0),0);
  const realTotal=fat>0?(totalPago/fat)*100:0;
  const metaValor=fat*(metaTotal/100);
  const diferencaPct=realTotal-metaTotal;
  const diferencaValor=totalPago-metaValor;
  const saldo=fat-totalPago;

  if(els.dreFatTotal) els.dreFatTotal.textContent=fmtMoeda(fat);
  if(els.drePagTotal) els.drePagTotal.textContent=fmtMoeda(totalPago);
  if(els.dreMetaTotal) els.dreMetaTotal.textContent=fmtPct(metaTotal);
  if(els.dreRealTotal) els.dreRealTotal.textContent=fmtPct(realTotal);
  if(els.dreSaldo) els.dreSaldo.textContent=fmtMoeda(saldo);
  const mV=document.getElementById('dreMetaTotalValor'); if(mV) mV.textContent=fmtMoeda(metaValor);
  const rV=document.getElementById('dreRealTotalValor'); if(rV) rV.textContent=fmtMoeda(totalPago);
  const dP=document.getElementById('dreDiferencaTotal'); if(dP) dP.textContent=(diferencaPct>=0?'+':'')+fmtPct(diferencaPct);
  const dV=document.getElementById('dreDiferencaTotalValor'); if(dV) dV.textContent=(diferencaValor>=0?'+':'')+fmtMoeda(diferencaValor);
  const sS=document.getElementById('dreSaldoSituacao'); if(sS) sS.textContent=saldo>=0?'Dentro do faturamento':'Pagamentos acima do faturamento';

  const acima=dados.filter(x=>x.status==='ACIMA');
  if(els.dreAcimaMeta) els.dreAcimaMeta.textContent=fmtNumero(acima.length);
  if(els.dreMaiorDesvio) els.dreMaiorDesvio.textContent=fmtPct(acima.length?Math.max(...acima.map(x=>Number(x.diferenca||0))):0);
  const pesado=[...dados].sort((a,b)=>Number(b.valor||0)-Number(a.valor||0))[0];
  if(els.dreGrupoPesado) els.dreGrupoPesado.textContent=pesado?.grupo||'-';
  if(els.dreGrupoPesadoValor) els.dreGrupoPesadoValor.textContent=fmtMoeda(pesado?.valor||0);

  const chipAcima=document.getElementById("dreChipAcimaMeta");
  const chipDesvio=document.getElementById("dreChipMaiorDesvio");
  const chipPesado=document.getElementById("dreChipMaisPesado");
  if(chipAcima) chipAcima.classList.toggle("selected",DRE_FILTRO_STATUS==="ACIMA");
  if(chipDesvio){
    const g=acima.length ? [...acima].sort((a,b)=>Number(b.diferenca||0)-Number(a.diferenca||0))[0]?.grupo : "";
    chipDesvio.dataset.grupo=encodeURIComponent(String(g||""));
    chipDesvio.classList.toggle("selected",!!g && DRE_FILTRO_GRUPOS.has(String(g)));
  }
  if(chipPesado){
    chipPesado.dataset.grupo=encodeURIComponent(String(pesado?.grupo||""));
    chipPesado.classList.toggle("selected",!!pesado?.grupo && DRE_FILTRO_GRUPOS.has(String(pesado.grupo)));
  }
}



function dreDataHora(v){
  if(!v) return "-";
  const d=new Date(v);
  if(Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
}

function dreData(v){
  if(!v) return "-";
  const d=new Date(v);
  if(Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("pt-BR");
}


function classificarGrupoDREFront(item){
  const i=String(item||"").trim().padStart(3,"0");

  const mapa={
    "01-COMPRAS":["004","005","006","323","007","008","354","009","363","364"],
    "02-EMPRESTIMOS":["246"],
    "03-IMPOSTOS":["014","183","184","185","186","262","263","264","273","274","275","327","252","245","311"],
    "04-ROYALTES":["127","213","214","215","216","217","218","219","220","221","222","223","224","225","226","227","248","250","204","294","102"],
    "05-ALUGUEL":["117","326","353"],
    "06-ENERGIA":["210"],
    "07-PROLABORE":["128","298"],
    "08-PROL PALMARES":["297"],
    "09-COLABORADOR":["181","187","188","189","190","191","192","193","194","195","196","197","198","201","203","261","270","282","284","285","286","314","319","347","205","206","207","208","209","272"],
    "10-INVEST EMPRESA":["302","303","321","316","291","287"],
    "11-DESPESA GERAL":["109","368","305","366","367","352","108","116","129","152","322","110","133","283","296","340","120","139","140","141","143","123","125","144","167","168","172","179","276","277","278","279","119","289","290","317","145","146","122","131","118","105","310","309","299","153","132","155","281","355","341","342","343","115","247","260","265","268","199","202","280","010","106","251","999","308","325","020","019","156","324","346","021","292"],
    "12-DIVIDENDO":["126"],
    "13-DESPESA FINANCEIRA":["359","365","315","013"],
    "14-MENS SISTEMA":["300","301","304","312","313","320","212"]
  };

  for(const [grupo,itens] of Object.entries(mapa)){
    if(itens.includes(i)) return grupo;
  }
  return "99-NAO CLASSIFICADO";
}

function gruposParaTabelaDRE(){
  if(DRE_FILTRO_GRUPOS.size){
    return [...DRE_FILTRO_GRUPOS];
  }

  const base = Array.isArray(DRE_DATASET_ATUAL?.dados) ? DRE_DATASET_ATUAL.dados : [];

  if(DRE_FILTRO_STATUS){
    return base
      .filter(x => String(x.status || "").toUpperCase() === DRE_FILTRO_STATUS)
      .map(x => String(x.grupo || ""))
      .filter(Boolean);
  }

  return base.map(x => String(x.grupo || "")).filter(Boolean);
}

function chaveSaidasPagasDRE(){
  return [
    els.empresa?.value||"",
    els.dataIni?.value||"",
    els.dataFim?.value||"",
    els.tipo?.value||"todos",
    [...DRE_FILTRO_EMPRESAS].sort().join(","),
    gruposParaTabelaDRE().sort().join("||"),
    DRE_FILTRO_STATUS||""
  ].join("|");
}

async function carregarSaidasPagasDRE(force=false){
  const chave=chaveSaidasPagasDRE();

  if(!force && DRE_SAIDAS_PAGAS_CACHE && DRE_SAIDAS_PAGAS_CHAVE===chave){
    return DRE_SAIDAS_PAGAS_CACHE;
  }

  const grupos=gruposParaTabelaDRE();
  if(!grupos.length){
    DRE_SAIDAS_PAGAS_CACHE=[];
    DRE_SAIDAS_PAGAS_CHAVE=chave;
    return [];
  }

  const respostas=await Promise.all(
    grupos.map(async grupo=>{
      const detalhe=await getJSON(montarUrlDreDetalhe(grupo,{modoTabela:true}));

      if(!detalhe || detalhe.ok===false){
        throw new Error(detalhe?.erro || `Falha ao carregar ${grupo}`);
      }

      const titulos=Array.isArray(detalhe.titulos)?detalhe.titulos:[];

      return titulos.map(x=>({
        ...x,
        grupo,
        pagamento:x.pagamento || x.data || null,
        valorPago:Number(x.valorPago ?? x.valor ?? 0),
        valorOriginal:Number(x.valorOriginal ?? x.valor ?? 0),
        planoConta:x.planoConta || x.descricao || "-",
        contaBanco:x.contaBanco || "-",
        tipo:x.tipo || "-",
        juros:Number(x.juros||0),
        multa:Number(x.multa||0),
        acrescimo:Number(x.acrescimo||0),
        desconto:Number(x.desconto||0)
      }));
    })
  );

  DRE_SAIDAS_PAGAS_CACHE=respostas.flat();
  DRE_SAIDAS_PAGAS_CHAVE=chave;
  return DRE_SAIDAS_PAGAS_CACHE;
}

function saidasPagasDREFiltradas(){
  let lista=Array.isArray(DRE_SAIDAS_PAGAS_CACHE)?[...DRE_SAIDAS_PAGAS_CACHE]:[];

  if(DRE_FILTRO_EMPRESAS.size){
    lista=lista.filter(x=>DRE_FILTRO_EMPRESAS.has(String(x.empresa||"")));
  }

  if(DRE_FILTRO_GRUPOS.size){
    lista=lista.filter(x=>DRE_FILTRO_GRUPOS.has(String(x.grupo||"")));
  }

  if(DRE_FILTRO_STATUS){
    const {dados}=dreAgregacaoAtual();
    const gruposPermitidos=new Set(
      dados
        .filter(x=>String(x.status||"").toUpperCase()===DRE_FILTRO_STATUS)
        .map(x=>String(x.grupo||""))
    );
    lista=lista.filter(x=>gruposPermitidos.has(String(x.grupo||"")));
  }

  return lista;
}

function renderTabelaDREFiltrada(){
  if(!els.dreTbody) return;

  const lista=saidasPagasDREFiltradas();

  const statusEl=document.getElementById("dreTabelaStatus");

  if(!lista.length){
    if(statusEl) statusEl.textContent="• 0 título(s)";
    els.dreTbody.innerHTML=`<tr><td colspan="21" class="empty">Nenhuma saída paga encontrada para os filtros atuais.</td></tr>`;
    return;
  }

  const total=lista.reduce((s,x)=>s+Number(x.valorPago||0),0);
  const totalBaixado=Array.isArray(DRE_SAIDAS_PAGAS_CACHE)?DRE_SAIDAS_PAGAS_CACHE.length:0;
  if(statusEl){
    statusEl.textContent=`• ${fmtNumero(lista.length)} título(s) exibido(s) de ${fmtNumero(totalBaixado)} baixado(s) • ${fmtMoeda(total)}`;
  }

  els.dreTbody.innerHTML=lista.map((x,i)=>{
    const grupoEnc=encodeURIComponent(String(x.grupo||""));
    const empEnc=encodeURIComponent(String(x.empresa||""));
    return `<tr class="dre-pro-row"
      data-grupo="${grupoEnc}"
      data-empresa="${empEnc}"
      title="Clique para filtrar Loja ${esc(x.empresa)} + ${esc(x.grupo)}. Duplo clique limpa os filtros.">
      <td class="dre-pro-index">${String(i+1).padStart(2,"0")}</td>
      <td>${esc(dreDataHora(x.pagamento))}</td>
      <td>${esc(dreData(x.lancamento))}</td>
      <td>${esc(dreData(x.vencimento))}</td>
      <td><strong>Loja ${esc(x.empresa||"-")}</strong></td>
      <td>${esc(x.grupo||"-")}</td>
      <td>${esc(x.item||"-")}</td>
      <td>${esc(x.planoConta||"-")}</td>
      <td>${esc(x.pessoa||"-")}</td>
      <td>${esc(x.documento||"-")}</td>
      <td>${esc(x.descricao||"-")}</td>
      <td>${esc(x.contaBanco||"-")}</td>
      <td>${esc(x.tipo||"-")}</td>
      <td>${esc(x.instrucoes||"-")}</td>
      <td>${esc(x.complemento||"-")}</td>
      <td class="num">${fmtMoeda(x.valorOriginal||0)}</td>
      <td class="num">${fmtMoeda(x.juros||0)}</td>
      <td class="num">${fmtMoeda(x.multa||0)}</td>
      <td class="num">${fmtMoeda(x.acrescimo||0)}</td>
      <td class="num">${fmtMoeda(x.desconto||0)}</td>
      <td class="num dre-paid-value">${fmtMoeda(x.valorPago||0)}</td>
    </tr>`;
  }).join("") + `
    <tr class="dre-pro-total" data-sort-exclude="1">
      <td></td>
      <td colspan="19">TOTAL DAS SAÍDAS PAGAS FILTRADAS • ${fmtNumero(lista.length)} título(s)</td>
      <td class="num">${fmtMoeda(total)}</td>
    </tr>`;

  els.dreTbody.querySelectorAll(".dre-pro-row").forEach(tr=>{
    tr.addEventListener("click",ev=>{
      dreCliqueOuDuploClique(()=>{
        const grupo=decodeURIComponent(tr.dataset.grupo||"");
        const empresa=decodeURIComponent(tr.dataset.empresa||"");
        if(grupo) dreToggleFiltro(DRE_FILTRO_GRUPOS,grupo);
        if(empresa) dreToggleFiltro(DRE_FILTRO_EMPRESAS,empresa);
      });
    });
    tr.addEventListener("dblclick",ev=>ev.preventDefault());
  });
}

function ativarFiltrosCardsResumoDRE(){
  const acima=document.getElementById("dreChipAcimaMeta");
  const desvio=document.getElementById("dreChipMaiorDesvio");
  const pesado=document.getElementById("dreChipMaisPesado");

  if(acima && acima.dataset.bound!=="1"){
    acima.dataset.bound="1";
    acima.addEventListener("click",()=>dreCliqueOuDuploClique(()=>{
      DRE_FILTRO_STATUS = DRE_FILTRO_STATUS==="ACIMA" ? "" : "ACIMA";
      aplicarFiltrosCruzadosDRE();
    }));
    acima.addEventListener("dblclick",e=>e.preventDefault());
  }

  [desvio,pesado].forEach(btn=>{
    if(!btn || btn.dataset.bound==="1") return;
    btn.dataset.bound="1";
    btn.addEventListener("click",()=>dreCliqueOuDuploClique(()=>{
      const grupo=decodeURIComponent(btn.dataset.grupo||"");
      if(grupo) dreToggleFiltro(DRE_FILTRO_GRUPOS,grupo);
    }));
    btn.addEventListener("dblclick",e=>e.preventDefault());
  });
}


function aplicarFiltrosCruzadosDRE(){
  ativarFiltrosCardsResumoDRE();
  atualizarEstadoBotaoTabelaDRE();

  const {fat,dados,dadosVisual,empresasGrafico}=dreAgregacaoAtual();

  atualizarResumoDREFiltrado(fat,dados);
  renderGraficoDRE(dadosVisual,fat,empresasGrafico);

  const tabelaCard=document.getElementById("dreTabelaCard");
  if(tabelaCard && !tabelaCard.classList.contains("dre-table-collapsed")){
    const btn=document.getElementById("btnCarregarTabelaDRE");

    if(btn && btn.dataset.carregando!=="1"){
      btn.dataset.carregando="1";
      btn.disabled=true;
      btn.textContent="CARREGANDO TABELA...";

      carregarOperacionalDRE(true)
        .then(renderOperacionalDRE)
        .catch(err=>{
          console.error("Erro ao refiltrar operacional DRE:",err);
          const status=document.getElementById("dreTabelaStatus");
          if(status) status.textContent=`• ERRO: ${err.message}`;
        })
        .finally(()=>{
          delete btn.dataset.carregando;
          atualizarEstadoBotaoTabelaDRE();
        });
    }
  }
}

function renderGraficoDRE(lista, totalBase, empresasGrafico = null){
  const alvo = els.graficoDRE;
  const empresasEl = document.getElementById("graficoDREEmpresas");

  if (!Array.isArray(lista) || !lista.length){
    if(alvo) alvo.innerHTML = `<div class="empty">Sem dados para o gráfico DRE.</div>`;
  } else if(alvo){
    const maior = Math.max(50, ...lista.flatMap(x => [Number(x.meta || 0), Number(x.realizado || 0)]));
    const teto = Math.ceil(maior / 10) * 10;
    alvo.innerHTML = `
      <div class="dre-chart-axis"><span>${fmtPct(teto)}</span><span>${fmtPct(teto*.75)}</span><span>${fmtPct(teto*.5)}</span><span>${fmtPct(teto*.25)}</span><span>0%</span></div>
      <div class="dre-chart-columns">
        ${lista.map((x, idx) => {
          const meta = Number(x.meta || 0), real = Number(x.realizado || 0);
          const hMeta = Math.max(2, Math.min(100, (meta / teto) * 100));
          const hReal = Math.max(2, Math.min(100, (real / teto) * 100));
          const selecionado=DRE_FILTRO_GRUPOS.has(String(x.grupo||''));
          return `<button type="button" class="dre-chart-col ${selecionado?'selected':''}" data-grupo="${encodeURIComponent(String(x.grupo||''))}" title="${esc(x.grupo)} | Meta ${fmtPct(meta)} | Real ${fmtPct(real)}">
            <div class="dre-chart-bars"><div class="dre-chart-bar meta" style="height:${hMeta}%"><b>${fmtPct(meta)}</b></div><div class="dre-chart-bar real ${real>meta?'acima':'ok'}" style="height:${hReal}%"><b>${fmtPct(real)}</b></div></div>
            <span>${esc(rotuloCurtoDRE(x.grupo))}</span></button>`;
        }).join("")}
      </div>`;
    alvo.querySelectorAll('.dre-chart-col').forEach(btn=>{
      btn.addEventListener('click',()=>dreCliqueOuDuploClique(()=>dreToggleFiltro(DRE_FILTRO_GRUPOS,decodeURIComponent(btn.dataset.grupo))));
      btn.addEventListener('dblclick',e=>{e.preventDefault();});
    });
  }

  if(empresasEl){
    const empresas = Array.isArray(empresasGrafico) ? empresasGrafico : (DRE_DATASET_ATUAL?.empresas || []).map(e=>({...e,valor:Number(e.totalPago||0)}));
    if(!empresas.length){ empresasEl.innerHTML=`<div class="empty">Sem dados por empresa.</div>`; return; }
    const maior=Math.max(...empresas.flatMap(e=>[
      Number(e.valor||0),
      Number(e.metaValor||0)
    ]),1);

    empresasEl.innerHTML=empresas.map(e=>{
      const emp=String(e.empresa||'');
      const valor=Number(e.valor||0);
      const metaValor=Number(e.metaValor||0);
      const realPct=Number(e.realPercentual||0);
      const metaPct=Number(e.metaPercentual||0);
      const pctReal=Math.max(1,(valor/maior)*100);
      const pctMeta=Math.max(1,(metaValor/maior)*100);
      const sel=DRE_FILTRO_EMPRESAS.has(emp);

      return `<button type="button" class="dre-company-row dre-company-compare ${sel?'selected':''}" data-empresa="${esc(emp)}"
        title="Loja ${esc(emp)} • Meta ${fmtMoeda(metaValor)} (${fmtPct(metaPct)}) • Real ${fmtMoeda(valor)} (${fmtPct(realPct)})">
        <span class="dre-company-name">Loja ${esc(emp)}</span>
        <span class="dre-company-bars">
          <span class="dre-company-line meta-line">
            <small>Meta</small>
            <span class="dre-company-track meta-track"><i style="width:${pctMeta}%"></i></span>
            <strong>${fmtMoeda(metaValor)}</strong>
          </span>
          <span class="dre-company-line real-line ${realPct>metaPct?'real-acima':'real-ok'}">
            <small>Real</small>
            <span class="dre-company-track real-track"><i style="width:${pctReal}%"></i></span>
            <strong>${fmtMoeda(valor)}</strong>
          </span>
        </span>
      </button>`;
    }).join('');
    empresasEl.querySelectorAll('.dre-company-row').forEach(btn=>{
      btn.addEventListener('click',()=>dreCliqueOuDuploClique(()=>dreToggleFiltro(DRE_FILTRO_EMPRESAS,btn.dataset.empresa)));
      btn.addEventListener('dblclick',e=>{e.preventDefault();});
    });
  }
}




function gruposOperacionaisDRE(){
  if(DRE_FILTRO_GRUPOS.size){
    return [...DRE_FILTRO_GRUPOS];
  }

  const {dadosVisual}=dreAgregacaoAtual();

  if(DRE_FILTRO_STATUS){
    return dadosVisual
      .filter(x => String(x.status || "").toUpperCase() === DRE_FILTRO_STATUS)
      .map(x => String(x.grupo || ""))
      .filter(Boolean);
  }

  // Se o filtro foi somente por empresa, todos os grupos daquela empresa
  // continuam válidos; o servidor recebe a empresa selecionada.
  return [];
}

function chaveOperacionalDRE(){
  return [
    els.empresa?.value || "",
    els.dataIni?.value || "",
    els.dataFim?.value || "",
    [...DRE_FILTRO_EMPRESAS].sort().join(","),
    gruposOperacionaisDRE().sort().join("||"),
    DRE_FILTRO_STATUS || ""
  ].join("|");
}

function montarUrlOperacionalDRE(){
  const qs = new URLSearchParams();

  if((els.empresa?.value || "").trim()){
    qs.set("empresa",(els.empresa.value || "").trim());
  }
  if(els.dataIni?.value) qs.set("dataIni",els.dataIni.value);
  if(els.dataFim?.value) qs.set("dataFim",els.dataFim.value);

  if(DRE_FILTRO_EMPRESAS.size){
    qs.set("empresasGrafico",[...DRE_FILTRO_EMPRESAS].join(","));
  }

  const grupos = gruposOperacionaisDRE();
  if(grupos.length){
    qs.set("grupos",grupos.join("||"));
  }

  return `/api/financeiro/dre-operacional?${qs.toString()}`;
}


function gruposFallbackOperacionalDRE(){
  const selecionados = gruposOperacionaisDRE();
  if(selecionados.length) return selecionados;

  // Se somente empresa foi selecionada, busca todos os grupos conhecidos.
  const base = Array.isArray(DRE_DATASET_ATUAL?.dados) ? DRE_DATASET_ATUAL.dados : [];
  return base.map(x=>String(x.grupo||"")).filter(Boolean);
}

function montarUrlDetalheFallbackDRE(grupo){
  const qs = new URLSearchParams();

  // IMPORTANTE:
  // não mandamos empresasGrafico no fallback. O endpoint de detalhe já
  // funcionava sem esse filtro; filtramos as empresas depois no navegador.
  if((els.empresa?.value||"").trim()){
    qs.set("empresa",(els.empresa.value||"").trim());
  }
  if(els.dataIni?.value) qs.set("dataIni",els.dataIni.value);
  if(els.dataFim?.value) qs.set("dataFim",els.dataFim.value);

  const tipo=(els.tipo?.value||"").trim();
  if(tipo && tipo.toLowerCase()!=="todos") qs.set("tipo",tipo);

  qs.set("grupo",grupo);
  qs.set("modo","tabela");

  return `/api/financeiro/meta-real-detalhe?${qs.toString()}`;
}

async function carregarOperacionalFallbackDRE(){
  const grupos = gruposFallbackOperacionalDRE();
  const empresasSel = new Set([...DRE_FILTRO_EMPRESAS]);

  if(!grupos.length){
    return {
      ok:true,
      origem:"fallback-detalhe",
      qtdSaidas:0,
      qtdFornecedores:0,
      totalPago:0,
      fornecedores:[],
      saidas:[]
    };
  }

  const blocos=[];

  // Faz uma requisição por grupo. É acionado somente se a rota operacional
  // retornar zero, portanto não pesa o fluxo normal.
  for(const grupo of grupos){
    const detalhe = await getJSON(montarUrlDetalheFallbackDRE(grupo));
    if(!detalhe || detalhe.ok===false) continue;

    const titulos = Array.isArray(detalhe.titulos) ? detalhe.titulos : [];

    for(const x of titulos){
      const empresa=String(x.empresa||"").trim();
      if(empresasSel.size && !empresasSel.has(empresa)) continue;

      blocos.push({
        pagamento:x.pagamento || x.data || null,
        lancamento:x.lancamento || null,
        vencimento:x.vencimento || null,
        empresa,
        grupo,
        item:String(x.item||"").trim(),
        planoConta:String(x.planoConta || x.descricao || "-").trim(),
        pessoa:String(x.pessoa||"SEM PESSOA").trim(),
        documento:String(x.documento||"-").trim(),
        descricao:String(x.descricao||"-").trim(),
        contaBanco:String(x.contaBanco||"-").trim(),
        tipo:String(x.tipo||"-").trim(),
        instrucoes:String(x.instrucoes||"-").trim(),
        complemento:String(x.complemento||"-").trim(),
        valorOriginal:Number(x.valorOriginal ?? x.valor ?? 0),
        juros:Number(x.juros||0),
        multa:Number(x.multa||0),
        acrescimo:Number(x.acrescimo||0),
        desconto:Number(x.desconto||0),
        valorPago:Number(x.valorPago ?? x.valor ?? 0)
      });
    }
  }

  const totalPago=blocos.reduce((s,x)=>s+Number(x.valorPago||0),0);
  const mapa=new Map();

  blocos.forEach(x=>{
    const nome=String(x.pessoa||"SEM PESSOA").trim() || "SEM PESSOA";
    const a=mapa.get(nome)||{
      fornecedor:nome,
      qtdTitulos:0,
      totalPago:0,
      empresas:new Set()
    };
    a.qtdTitulos++;
    a.totalPago+=Number(x.valorPago||0);
    if(x.empresa) a.empresas.add(String(x.empresa));
    mapa.set(nome,a);
  });

  const fornecedores=[...mapa.values()]
    .map(x=>({
      fornecedor:x.fornecedor,
      qtdTitulos:x.qtdTitulos,
      totalPago:x.totalPago,
      participacao:totalPago>0?(x.totalPago/totalPago)*100:0,
      empresas:[...x.empresas].sort()
    }))
    .sort((a,b)=>Number(b.totalPago||0)-Number(a.totalPago||0));

  return {
    ok:true,
    origem:"fallback-detalhe",
    qtdSaidas:blocos.length,
    qtdFornecedores:fornecedores.length,
    totalPago,
    fornecedores,
    saidas:blocos
  };
}

async function carregarOperacionalDRE(force=false){
  const chave = chaveOperacionalDRE();

  if(!force && DRE_OPERACIONAL_CACHE && DRE_OPERACIONAL_CHAVE===chave){
    return DRE_OPERACIONAL_CACHE;
  }

  let dados=null;
  let erroPrincipal=null;

  try{
    dados = await getJSON(montarUrlOperacionalDRE());
    if(!dados || dados.ok===false){
      throw new Error(dados?.erro || "Falha na rota operacional.");
    }
  }catch(err){
    erroPrincipal=err;
    console.warn("Rota operacional falhou; tentando fallback:",err);
  }

  // Se a rota principal falhar OU retornar zero mesmo existindo filtro,
  // usa a rota de detalhe por grupo, que já havia trazido títulos antes.
  if(
    erroPrincipal ||
    !dados ||
    Number(dados.qtdSaidas||0)===0
  ){
    const fallback = await carregarOperacionalFallbackDRE();

    // Se o fallback encontrou dados, ele vence a resposta principal.
    if(Number(fallback.qtdSaidas||0)>0){
      dados=fallback;
    }else if(!dados){
      if(erroPrincipal) throw erroPrincipal;
      dados=fallback;
    }else{
      // Mantém a resposta principal zero, mas registra diagnóstico.
      dados.diagnostico = {
        ...(dados.diagnostico||{}),
        fallbackQtd:Number(fallback.qtdSaidas||0),
        origemPrincipal:true
      };
    }
  }

  DRE_OPERACIONAL_CACHE=dados;
  DRE_OPERACIONAL_CHAVE=chave;
  return dados;
}

function mostrarPainelDREOperacional(view){
  DRE_OPERACIONAL_VIEW = view === "saidas" ? "saidas" : "fornecedores";

  const fornec = document.getElementById("drePainelFornecedores");
  const saidas = document.getElementById("drePainelSaidas");
  const tabFornec = document.getElementById("dreTabFornecedores");
  const tabSaidas = document.getElementById("dreTabSaidas");

  fornec?.classList.toggle("active",DRE_OPERACIONAL_VIEW==="fornecedores");
  saidas?.classList.toggle("active",DRE_OPERACIONAL_VIEW==="saidas");
  tabFornec?.classList.toggle("active",DRE_OPERACIONAL_VIEW==="fornecedores");
  tabSaidas?.classList.toggle("active",DRE_OPERACIONAL_VIEW==="saidas");
}
window.mostrarPainelDREOperacional = mostrarPainelDREOperacional;

function renderFornecedoresDREOperacional(dados){
  const lista = Array.isArray(dados?.fornecedores) ? dados.fornecedores : [];
  const totalPago = Number(dados?.totalPago || 0);

  const qtdEl = document.getElementById("dreFornecQtd");
  const titEl = document.getElementById("dreFornecTitulos");
  const totEl = document.getElementById("dreFornecTotal");
  const tbody = document.getElementById("dreFornecedoresTbody");
  const graf = document.getElementById("dreFornecedoresGrafico");

  if(qtdEl) qtdEl.textContent = fmtNumero(lista.length);
  if(titEl) titEl.textContent = fmtNumero(Number(dados?.qtdSaidas || 0));
  if(totEl) totEl.textContent = fmtMoeda(totalPago);

  if(tbody){
    tbody.innerHTML = lista.length
      ? lista.map((x,i)=>`
          <tr>
            <td>${String(i+1).padStart(2,"0")}</td>
            <td>${esc(x.fornecedor || "-")}</td>
            <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
            <td class="num dre-paid-value">${fmtMoeda(x.totalPago || 0)}</td>
            <td class="num">${fmtPct(x.participacao || 0)}</td>
            <td>${esc((x.empresas || []).map(e=>`Loja ${e}`).join(", ") || "-")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" class="empty">Nenhum fornecedor encontrado para os filtros selecionados.</td></tr>`;
  }

  if(graf){
    if(!lista.length){
      graf.innerHTML = `<div class="empty">Sem pagamentos baixados para os filtros selecionados.</div>`;
    }else{
      const max = Math.max(...lista.map(x=>Number(x.totalPago||0)),1);
      graf.innerHTML = lista.slice(0,30).map(x=>{
        const pct = Math.max(1,(Number(x.totalPago||0)/max)*100);
        return `
          <div class="dre-fornec-row">
            <span class="dre-fornec-name" title="${esc(x.fornecedor||"-")}">${esc(x.fornecedor||"-")}</span>
            <span class="dre-fornec-track"><i style="width:${pct}%"></i></span>
            <strong>${fmtMoeda(x.totalPago||0)}</strong>
            <small>${fmtNumero(x.qtdTitulos||0)} título(s)</small>
          </div>
        `;
      }).join("");
    }
  }
}

function renderSaidasDREOperacional(dados){
  const lista = Array.isArray(dados?.saidas) ? dados.saidas : [];
  const tbody = document.getElementById("dreTbody");

  const qtdEl = document.getElementById("dreSaidasQtd");
  const fornEl = document.getElementById("dreSaidasFornecQtd");
  const totEl = document.getElementById("dreSaidasTotal");

  if(qtdEl) qtdEl.textContent = fmtNumero(lista.length);
  if(fornEl) fornEl.textContent = fmtNumero(Number(dados?.qtdFornecedores||0));
  if(totEl) totEl.textContent = fmtMoeda(Number(dados?.totalPago||0));

  if(!tbody) return;

  if(!lista.length){
    tbody.innerHTML = `<tr><td colspan="21" class="empty">Nenhuma saída paga encontrada para os filtros selecionados.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map((x,i)=>`
    <tr>
      <td>${String(i+1).padStart(2,"0")}</td>
      <td>${esc(dreDataHora(x.pagamento))}</td>
      <td>${esc(dreData(x.lancamento))}</td>
      <td>${esc(dreData(x.vencimento))}</td>
      <td>Loja ${esc(x.empresa||"-")}</td>
      <td>${esc(x.grupo||"-")}</td>
      <td>${esc(x.item||"-")}</td>
      <td>${esc(x.planoConta||"-")}</td>
      <td>${esc(x.pessoa||"-")}</td>
      <td>${esc(x.documento||"-")}</td>
      <td>${esc(x.descricao||"-")}</td>
      <td>${esc(x.contaBanco||"-")}</td>
      <td>${esc(x.tipo||"-")}</td>
      <td>${esc(x.instrucoes||"-")}</td>
      <td>${esc(x.complemento||"-")}</td>
      <td class="num">${fmtMoeda(x.valorOriginal||0)}</td>
      <td class="num">${fmtMoeda(x.juros||0)}</td>
      <td class="num">${fmtMoeda(x.multa||0)}</td>
      <td class="num">${fmtMoeda(x.acrescimo||0)}</td>
      <td class="num">${fmtMoeda(x.desconto||0)}</td>
      <td class="num dre-paid-value">${fmtMoeda(x.valorPago||0)}</td>
    </tr>
  `).join("");
}

function renderOperacionalDRE(dados){
  const status = document.getElementById("dreTabelaStatus");
  if(status){
    const origem = dados?.origem==="fallback-detalhe" ? " • fonte: detalhamento" : "";
    status.textContent =
      `• ${fmtNumero(Number(dados?.qtdSaidas||0))} título(s) • ${fmtNumero(Number(dados?.qtdFornecedores||0))} fornecedor(es) • ${fmtMoeda(Number(dados?.totalPago||0))}${origem}`;
  }

  const filtroAtivo=document.getElementById("dreFiltroOperacionalAtivo");
  if(filtroAtivo){
    const partes=[];
    if(DRE_FILTRO_EMPRESAS.size){
      partes.push(`Loja(s): ${[...DRE_FILTRO_EMPRESAS].join(", ")}`);
    }
    const grupos=gruposOperacionaisDRE();
    if(grupos.length){
      partes.push(`Grupo(s): ${grupos.join(", ")}`);
    }
    if(DRE_FILTRO_STATUS){
      partes.push(`Status: ${DRE_FILTRO_STATUS}`);
    }
    filtroAtivo.textContent=partes.length
      ? `Filtro aplicado → ${partes.join(" • ")}`
      : "Nenhum filtro gráfico ativo.";
  }

  renderFornecedoresDREOperacional(dados);
  renderSaidasDREOperacional(dados);
  ativarOrdenacaoEmTodasAsTabelas();
}

function temFiltroGraficoDRE(){
  return (
    DRE_FILTRO_GRUPOS.size > 0 ||
    DRE_FILTRO_EMPRESAS.size > 0 ||
    !!String(DRE_FILTRO_STATUS || "").trim()
  );
}

function atualizarEstadoBotaoTabelaDRE(){
  const btn=document.getElementById("btnCarregarTabelaDRE");
  const card=document.getElementById("dreTabelaCard");
  if(!btn) return;

  const temFiltro=temFiltroGraficoDRE();
  const tabelaAberta=card && !card.classList.contains("dre-table-collapsed");

  if(!temFiltro){
    if(card) card.classList.add("dre-table-collapsed");
    btn.disabled=true;
    btn.textContent="CARREGAR A TABELA";
    btn.title="Selecione pelo menos um filtro em qualquer gráfico para liberar a tabela.";
    return;
  }

  btn.disabled=false;
  btn.textContent=tabelaAberta ? "OCULTAR A TABELA" : "CARREGAR A TABELA";
  btn.title="Carregar as saídas pagas conforme os filtros selecionados nos gráficos.";
}

async function alternarTabelaDRE(){
  const card=document.getElementById("dreTabelaCard");
  const btn=document.getElementById("btnCarregarTabelaDRE");
  if(!card || !btn || btn.dataset.carregando==="1") return;

  if(!temFiltroGraficoDRE()){
    atualizarEstadoBotaoTabelaDRE();
    return;
  }

  const aberta=!card.classList.contains("dre-table-collapsed");

  if(aberta){
    card.classList.add("dre-table-collapsed");
    atualizarEstadoBotaoTabelaDRE();
    return;
  }

  btn.dataset.carregando="1";
  btn.disabled=true;
  btn.textContent="CARREGANDO TABELA...";

  try{
    const dados=await carregarOperacionalDRE(true);
    renderOperacionalDRE(dados);
    mostrarPainelDREOperacional("fornecedores");
    card.classList.remove("dre-table-collapsed");
    requestAnimationFrame(()=>card.scrollIntoView({behavior:"smooth",block:"start"}));
  }catch(err){
    console.error("Erro operacional DRE:",err);
    const status=document.getElementById("dreTabelaStatus");
    if(status) status.textContent=`• ERRO: ${err.message}`;
    card.classList.remove("dre-table-collapsed");
  }finally{
    delete btn.dataset.carregando;
    atualizarEstadoBotaoTabelaDRE();
  }
}
window.alternarTabelaDRE=alternarTabelaDRE;

function renderCards(data){
  const totalFat = Number(data.totalFaturado || 0);
  const totalPag = Number(data.totalPago || 0);
  const totalAberto = Number(data.totalAbertoSaidas || 0);
  const saldo = Number(data.saldo || 0);
  const devolucao = Number(data.devolucao || 0);

  els.fatTotal.textContent = fmtMoeda(totalFat);
  els.devolucaoTotal.textContent = fmtMoeda(devolucao);
  els.pagTotal.textContent = fmtMoeda(totalPag);
  els.abertoTotal.textContent = fmtMoeda(totalAberto);
  els.saldoTotal.textContent = fmtMoeda(saldo);

  const topItem = (data.pagamentos || [])[0] || null;
  els.topItem.textContent = topItem ? topItem.item : "-";
  els.topItemValor.textContent = topItem ? fmtMoeda(topItem.total) : "R$ 0,00";
}

function renderLeitura(data){
  const totalFat = Number(data.totalFaturado || 0);
  const totalPag = Number(data.totalPago || 0);
  const totalAberto = Number(data.totalAbertoSaidas || 0);
  const saldo = Number(data.saldo || 0);
  const devolucao = Number(data.devolucao || 0);

  const prazo = (data.faturamento || []).find(x => String(x.forma).toUpperCase() === "PRAZO");
  const avista = (data.faturamento || []).find(x => String(x.forma).toUpperCase() === "AVISTA");
  const topItem = (data.pagamentos || [])[0];
  const rotuloDireita = String(data.visaoDireita || "plano_conta") === "fornecedor"
    ? "fornecedor"
    : "plano de conta";

  const texto = `
    No período filtrado, o faturamento total foi de <strong>${fmtMoeda(totalFat)}</strong>,
    com <strong>${fmtMoeda(prazo?.total || 0)}</strong> em <strong>prazo</strong>,
    <strong>${fmtMoeda(avista?.total || 0)}</strong> em <strong>à vista</strong>
    e <strong>${fmtMoeda(devolucao)}</strong> de <strong>devolução</strong>.
    No financeiro, o total <strong>baixado</strong> somou <strong>${fmtMoeda(totalPag)}</strong> e o total <strong>em aberto</strong> ficou em <strong>${fmtMoeda(totalAberto)}</strong>.
    O saldo do período ficou em <strong>${fmtMoeda(saldo)}</strong>.
    ${topItem ? `O maior agrupamento por <strong>${rotuloDireita}</strong> foi <strong>${esc(topItem.item)}</strong> com <strong>${fmtMoeda(topItem.total)}</strong>.` : ``}
  `;

  els.leituraExec.innerHTML = texto;
}

function renderMiniCards(cards){
  if (!cards.length){
    els.miniCards.innerHTML = `<div class="empty">Sem resumo para exibir.</div>`;
    return;
  }

  els.miniCards.innerHTML = cards.map(c => `
    <div class="mini-card">
      <div class="t">${esc(c.titulo)}</div>
      <div class="n">${esc(c.valor)}</div>
    </div>
  `).join("");
}

function limparDetalheDRE(){
  if (els.dreDetailTitle) {
    els.dreDetailTitle.textContent = "Detalhamento do DRE";
  }

  if (els.dreDetailSubtitle) {
    els.dreDetailSubtitle.textContent = "Clique em um grupo da tabela DRE para abrir os detalhes.";
  }

  if (els.dreDetailEmpty) {
    els.dreDetailEmpty.classList.remove("hidden");
    els.dreDetailEmpty.textContent = "Nenhum grupo do DRE foi selecionado ainda.";
  }

  if (els.dreDetailContent) {
    els.dreDetailContent.classList.add("hidden");
  }

  if (els.btnFecharDreDetalhe) {
    els.btnFecharDreDetalhe.classList.add("hidden");
  }

  if (els.dreMiniCards) els.dreMiniCards.innerHTML = "";
  if (els.dreItensTbody) els.dreItensTbody.innerHTML = "";
  if (els.dreTitulosTbody) els.dreTitulosTbody.innerHTML = "";
}

function renderMiniCardsDRE(cards){
  const alvo = els.dreMiniCards;
  if (!alvo) return;

  if (!cards.length){
    alvo.innerHTML = `<div class="empty">Sem resumo para exibir.</div>`;
    return;
  }

  alvo.innerHTML = cards.map(c => `
    <div class="mini-card">
      <div class="t">${esc(c.titulo)}</div>
      <div class="n">${esc(c.valor)}</div>
    </div>
  `).join("");
}
window.renderResumoPessoaDRE = function renderResumoPessoaDRE(titulos){
  const lista = Array.isArray(titulos) ? titulos : [];
  const mapa = new Map();

  for(const t of lista){
    const pessoa = String(t.pessoa || "-").trim() || "-";
    const atual = mapa.get(pessoa) || { pessoa, valor: 0, qtd: 0 };
    atual.valor += Number(t.valor || 0);
    atual.qtd += 1;
    mapa.set(pessoa, atual);
  }

  const dados = [...mapa.values()]
    .sort((a,b) => Number(b.valor || 0) - Number(a.valor || 0))
    .slice(0, 20);

  const total = dados.reduce((s,x) => s + Number(x.valor || 0), 0) || 1;

  if(!els.dreResumoPessoaGrafico){
    return;
  }

  if(!dados.length){
    els.dreResumoPessoaGrafico.innerHTML = `<div class="empty">Sem resumo por pessoa.</div>`;
    return;
  }

  els.dreResumoPessoaGrafico.innerHTML = dados.map(x => {
    const pct = (Number(x.valor || 0) / total) * 100;
    const pessoaSegura = encodeURIComponent(x.pessoa);

    return `
      <div class="bar-row" onclick="window.filtrarTitulosDREPorPessoa('${pessoaSegura}')" title="Clique para filtrar ${esc(x.pessoa)}">
        <div class="bar-label">${esc(x.pessoa)}</div>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.max(pct,1)}%; background:#3b82f6;"></div>
        </div>
        <div class="bar-value">
          ${fmtMoeda(x.valor)}
          <div style="font-size:11px;color:var(--muted);font-weight:600;">
            ${fmtNumero(x.qtd)} título(s)
          </div>
        </div>
      </div>
    `;
  }).join("");
};

window.filtrarTitulosDREPorPessoa = function filtrarTitulosDREPorPessoa(pessoaEnc){
  const pessoa = decodeURIComponent(String(pessoaEnc || ""));
  const todos = Array.isArray(window.dreTitulosGrupoAtual)
    ? window.dreTitulosGrupoAtual
    : [];

  const filtrados = todos.filter(x =>
    String(x.pessoa || "").trim() === pessoa
  );

  window.renderTitulosDRE(filtrados);

  if(els.dreDetailSubtitle){
    els.dreDetailSubtitle.textContent =
      `Filtrado por pessoa: ${pessoa} • ${fmtNumero(filtrados.length)} título(s)`;
  }
};
window.renderTitulosDRE = function renderTitulosDRE(titulos){
  const lista = Array.isArray(titulos) ? titulos : [];

  els.dreTitulosTbody.innerHTML = lista.length
    ? lista.map(x => `
      <tr>
        <td>${esc(x.data ? new Date(x.data).toLocaleDateString("pt-BR") : "-")}</td>
        <td>${esc(x.empresa || "-")}</td>
        <td>${esc(x.documento || "-")}</td>
        <td>${esc(x.descricao || "-")}</td>
        <td>${esc(x.pessoa || "-")}</td>
        <td>${esc(x.instrucoes || "-")}</td>
        <td>${esc(x.complemento || "-")}</td>
        <td class="num">${fmtMoeda(x.valor || 0)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="8" class="empty">Sem títulos para este item.</td></tr>`;
};

window.filtrarTitulosDREPorItem = function filtrarTitulosDREPorItem(item){
  const itemSel = String(item || "").trim();

  const todos = Array.isArray(window.dreTitulosGrupoAtual)
    ? window.dreTitulosGrupoAtual
    : [];

  const filtrados = todos.filter(x =>
    String(x.item || "").trim() === itemSel
  );

  window.renderTitulosDRE(filtrados);

  if(els.dreDetailSubtitle){
    els.dreDetailSubtitle.textContent =
      `Filtrado pelo item ${itemSel} • ${fmtNumero(filtrados.length)} título(s)`;
  }
};

window.carregarDetalheDRE = async function carregarDetalheDRE(grupo, opcoes = {}){
  const grupoSel = String(grupo || "").trim();
  DRE_ULTIMO_GRUPO_DETALHE = grupoSel;

  if (!grupoSel){
    alert("Grupo do DRE inválido.");
    return;
  }

  try{
    if(!opcoes.silencioso) document.body.style.cursor = "wait";

    els.dreDetailTitle.textContent = `Detalhamento do DRE - ${grupoSel}`;
    els.dreDetailSubtitle.textContent = DRE_FILTRO_EMPRESAS.size
      ? `Carregando para ${[...DRE_FILTRO_EMPRESAS].map(e=>`Loja ${e}`).join(", ")}.`
      : "Carregando detalhes.";
    els.dreDetailEmpty.classList.add("hidden");
    els.dreDetailContent.classList.remove("hidden");
    els.btnFecharDreDetalhe.classList.remove("hidden");

    els.dreMiniCards.innerHTML = `
      <div class="mini-card">
        <div class="t">Status</div>
        <div class="n">Carregando.</div>
      </div>
    `;

    els.dreItensTbody.innerHTML = `<tr><td colspan="4" class="empty">Carregando itens.</td></tr>`;
    els.dreTitulosTbody.innerHTML = `<tr><td colspan="8" class="empty">Carregando títulos.</td></tr>`;

    const detalhe = await getJSON(montarUrlDreDetalhe(grupoSel));

    const itens = Array.isArray(detalhe.itens) ? detalhe.itens : [];
    const titulos = Array.isArray(detalhe.titulos) ? detalhe.titulos : [];

    const totalGrupo = Number(detalhe.totalGrupo || 0);
    const meta = Number(detalhe.meta || 0);
    const qtdItens = Number(detalhe.qtdItens ?? itens.length ?? 0);
    const qtdTitulos = Number(detalhe.qtdTitulos ?? titulos.length ?? 0);

    els.dreDetailSubtitle.textContent =
      `Grupo ${grupoSel} • ${fmtMoeda(totalGrupo)} • ${fmtNumero(qtdTitulos)} título(s)`;

    els.dreMiniCards.innerHTML = `
      <div class="mini-card">
        <div class="t">Total do grupo</div>
        <div class="n">${fmtMoeda(totalGrupo)}</div>
      </div>
      <div class="mini-card">
        <div class="t">Meta %</div>
        <div class="n">${fmtPct(meta)}</div>
      </div>
      <div class="mini-card">
        <div class="t">Qtd. itens</div>
        <div class="n">${fmtNumero(qtdItens)}</div>
      </div>
      <div class="mini-card">
        <div class="t">Qtd. títulos</div>
        <div class="n">${fmtNumero(qtdTitulos)}</div>
      </div>
    `;

    window.dreTitulosGrupoAtual = titulos;
window.renderResumoPessoaDRE(titulos);
els.dreItensTbody.innerHTML = itens.length
  ? itens.map(x => {
    const itemSeguro = esc(String(x.item || "").trim());

    return `
      <tr
        class="card-click"
        style="cursor:pointer;"
        onclick="window.filtrarTitulosDREPorItem('${itemSeguro}')"
        title="Clique para filtrar os títulos deste item"
      >
        <td>${esc(x.item || "-")}</td>
        <td>${esc(x.descricao || "-")}</td>
        <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
        <td class="num">${fmtMoeda(x.valor || 0)}</td>
      </tr>
    `;
  }).join("")
  : `<tr><td colspan="4" class="empty">Sem itens neste grupo.</td></tr>`;


    window.renderTitulosDRE(titulos);
    ativarOrdenacaoEmTodasAsTabelas();

  }catch(e){
    console.error(e);
    els.dreDetailSubtitle.textContent = "Erro ao carregar detalhes.";
    els.dreItensTbody.innerHTML = `<tr><td colspan="4" class="empty">Erro: ${esc(e.message)}</td></tr>`;
    els.dreTitulosTbody.innerHTML = `<tr><td colspan="8" class="empty">Erro: ${esc(e.message)}</td></tr>`;
  }finally{
    if(!opcoes.silencioso) document.body.style.cursor = "default";
  }
}

function parseValorOrdenacao(texto){
  const raw = String(texto || "").trim();
  if (!raw) return "";

  const semTags = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!semTags) return "";

  const moeda = semTags.match(/R\$\s*([-\d\.\,]+)/i);
  if (moeda){
    const n = moeda[1].replace(/\./g, "").replace(",", ".");
    const v = Number(n);
    if (!Number.isNaN(v)) return v;
  }

  const pct = semTags.match(/([-\d\.\,]+)\s*%/);
  if (pct){
    const n = pct[1].replace(/\./g, "").replace(",", ".");
    const v = Number(n);
    if (!Number.isNaN(v)) return v;
  }

  const dataBr = semTags.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dataBr){
    const [, dd, mm, yyyy] = dataBr;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`).getTime();
  }

  const numeroSimples = semTags.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  if (numeroSimples && /^-?\d+(\.\d+)?$/.test(numeroSimples)){
    const v = Number(numeroSimples);
    if (!Number.isNaN(v)) return v;
  }

  return semTags.toUpperCase();
}

function compararValoresOrdenacao(a, b){
  const va = parseValorOrdenacao(a);
  const vb = parseValorOrdenacao(b);

  const aNum = typeof va === "number";
  const bNum = typeof vb === "number";

  if (aNum && bNum) return va - vb;
  return String(va).localeCompare(String(vb), "pt-BR", { numeric: true, sensitivity: "base" });
}

function ativarOrdenacaoEmTabela(table){
  if (!table) return;

  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  if (!thead || !tbody) return;

  const headers = [...thead.querySelectorAll("th")];
  if (!headers.length) return;

  headers.forEach((th, index) => {
    if (th.dataset.sortDisabled === "1") {
      th.style.cursor = "default";
      return;
    }
    if (th.dataset.sortBound === "1") return;

    th.dataset.sortBound = "1";
    th.dataset.colIndex = String(index);

    th.addEventListener("click", () => {
      const colIndex = Number(th.dataset.colIndex || index);

      const rows = [...tbody.querySelectorAll("tr")]
        .filter(tr => !tr.querySelector(".empty") && tr.dataset.sortExclude !== "1");
      const excluidas = [...tbody.querySelectorAll('tr[data-sort-exclude="1"]')];

      if (!rows.length) return;

      const atual = th.dataset.sortDir || "";
      const novaDirecao = atual === "asc" ? "desc" : "asc";

      headers.forEach(h => {
        h.classList.remove("sort-asc", "sort-desc");
        h.dataset.sortDir = "";
      });

      th.dataset.sortDir = novaDirecao;
      th.classList.add(novaDirecao === "asc" ? "sort-asc" : "sort-desc");

      rows.sort((ra, rb) => {
        const aCell = ra.children[colIndex]?.innerHTML ?? "";
        const bCell = rb.children[colIndex]?.innerHTML ?? "";
        const cmp = compararValoresOrdenacao(aCell, bCell);
        return novaDirecao === "asc" ? cmp : -cmp;
      });

      rows.forEach(r => tbody.appendChild(r));
      excluidas.forEach(r => tbody.appendChild(r));
    });
  });
}
function ativarOrdenacaoEmTodasAsTabelas(){
  document.querySelectorAll(".table-wrap table").forEach(ativarOrdenacaoEmTabela);
}
function montarTabelaFluxoDiario(rows){
  const tbody = document.getElementById("tbFluxo");
  if (!tbody) return;

  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="6" class="empty">Sem dados no período.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.data_fmt || r.data || "-")}</td>
      <td class="num">${fmtMoeda(r.receber_aberto || 0)}</td>
      <td class="num">${fmtMoeda(r.previsto_avista_ano_passado || 0)}</td>
      <td class="num">${fmtMoeda(r.pagar_aberto || 0)}</td>
      <td class="num">${fmtMoeda(r.saldo_previsto || 0)}</td>
      <td class="num">${fmtMoeda(r.saldo_acumulado || 0)}</td>
    </tr>
  `).join("");
}

function montarTabelaFluxoMensal(rows){
  const tbody = document.getElementById("tbFluxoMensal");
  if (!tbody) return;

  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Sem dados no período.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${esc(r.periodo || "-")}</td>
      <td class="num">${fmtMoeda(r.receber_aberto || 0)}</td>
      <td class="num">${fmtMoeda(r.previsto_avista_ano_passado || 0)}</td>
      <td class="num">${fmtMoeda(r.entrada_total_prevista || 0)}</td>
      <td class="num">${fmtMoeda(r.pagar_aberto || 0)}</td>
      <td class="num">${fmtMoeda(r.saldo_previsto || 0)}</td>
      <td class="num">${fmtMoeda(r.saldo_acumulado || 0)}</td>
    </tr>
  `).join("");
}

function montarTabelaTitulosReceber(rows){
  const tbody = document.getElementById("tbTitulosReceber");
  if (!tbody) return;

  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Sem títulos a receber no período.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(x => `
    <tr>
      <td>${esc(x.data ? new Date(x.data).toLocaleDateString("pt-BR") : "-")}</td>
      <td>${esc(x.empresa || "-")}</td>
      <td>${esc(x.documento || "-")}</td>
      <td>${esc(x.descricao || "-")}</td>
      <td>${esc(x.pessoa || "-")}</td>
      <td>${esc(x.instrucoes || "-")}</td>
      <td>${esc(x.complemento || "-")}</td>
      <td class="num">${fmtMoeda(x.valor || 0)}</td>
    </tr>
  `).join("");
}

function montarTabelaTitulosPagar(rows){
  const tbody = document.getElementById("tbTitulosPagar");
  if (!tbody) return;

  if (!rows.length){
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Sem títulos a pagar no período.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(x => `
    <tr>
      <td>${esc(x.data ? new Date(x.data).toLocaleDateString("pt-BR") : "-")}</td>
      <td>${esc(x.empresa || "-")}</td>
      <td>${esc(x.documento || "-")}</td>
      <td>${esc(x.descricao || "-")}</td>
      <td>${esc(x.pessoa || "-")}</td>
      <td>${esc(x.instrucoes || "-")}</td>
      <td>${esc(x.complemento || "-")}</td>
      <td class="num">${fmtMoeda(x.valor || 0)}</td>
    </tr>
  `).join("");
}
async function carregarDRECompetencia(){
  try{
    DRE_OPERACIONAL_CACHE = null;
    DRE_OPERACIONAL_CHAVE = "";
    const operacionalCard = document.getElementById("dreTabelaCard");
    if(operacionalCard) operacionalCard.classList.add("dre-table-collapsed");

    DRE_SAIDAS_PAGAS_CACHE = null;
    DRE_SAIDAS_PAGAS_CHAVE = "";

    document.body.style.cursor = "wait";

    const dreData = await getJSON(montarUrlDRE());
    const fat = Number(dreData.totalFaturado || 0);
    const pago = Number(dreData.totalPago || 0);
    const saldo = fat - pago;
    const realTotal = Number(dreData.totalRealPercentual || 0);

    els.dreFatTotal.textContent = fmtMoeda(fat);
    els.drePagTotal.textContent = fmtMoeda(pago);
    const metaTotal = Number(dreData.totalMetaPercentual || 0);
    const diferencaTotal = realTotal - metaTotal;
    const diferencaValor = pago - (fat * metaTotal / 100);

    els.dreMetaTotal.textContent = fmtPct(metaTotal);
    els.dreRealTotal.textContent = fmtPct(realTotal);
    els.dreSaldo.textContent = fmtMoeda(saldo);

    const elMetaValor = document.getElementById("dreMetaTotalValor");
    const elRealValor = document.getElementById("dreRealTotalValor");
    const elDif = document.getElementById("dreDiferencaTotal");
    const elDifValor = document.getElementById("dreDiferencaTotalValor");
    const elSaldoSit = document.getElementById("dreSaldoSituacao");
    const elPeriodo = document.getElementById("drePeriodoResumo");

    if(elMetaValor) elMetaValor.textContent = fmtMoeda(fat * metaTotal / 100);
    if(elRealValor) elRealValor.textContent = fmtMoeda(pago);
    if(elDif){
      elDif.textContent = `${diferencaTotal >= 0 ? "+" : ""}${fmtPct(diferencaTotal)}`;
      elDif.classList.toggle("positivo", diferencaTotal <= 0);
      elDif.classList.toggle("negativo", diferencaTotal > 0);
    }
    if(elDifValor) elDifValor.textContent = `${diferencaValor >= 0 ? "+" : ""}${fmtMoeda(diferencaValor)}`;
    if(elSaldoSit) elSaldoSit.textContent = saldo >= 0 ? "Saldo positivo no período" : "Pagamentos acima do faturamento";
    if(elPeriodo){
      const ini = els.dataIni?.value ? new Date(els.dataIni.value + "T12:00:00").toLocaleDateString("pt-BR") : "-";
      const fim = els.dataFim?.value ? new Date(els.dataFim.value + "T12:00:00").toLocaleDateString("pt-BR") : "-";
      elPeriodo.textContent = `${ini} a ${fim}`;
    }

    DRE_DATASET_ATUAL = dreData;
    DRE_FILTRO_GRUPOS.clear();
    DRE_FILTRO_EMPRESAS.clear();
    DRE_FILTRO_STATUS = "";

    const periodoResumo = document.getElementById("drePeriodoResumo");
    if(periodoResumo) periodoResumo.textContent = `${els.dataIni.value || "-"} a ${els.dataFim.value || "-"}`;

    const dadosBase = Array.isArray(dreData.dados) ? dreData.dados : [];

    if (!dadosBase.length){
      els.dreTbody.innerHTML = `<tr><td colspan="9" class="empty">Sem dados no DRE.</td></tr>`;
      els.dreAcimaMeta.textContent = "0";
      els.dreMaiorDesvio.textContent = "0,00%";
      els.dreGrupoPesado.textContent = "-";
      els.dreGrupoPesadoValor.textContent = "R$ 0,00";
      renderGraficoDRE([], fat);
ativarOrdenacaoEmTodasAsTabelas();
      return;
    }
    aplicarFiltrosCruzadosDRE();


ativarOrdenacaoEmTodasAsTabelas();
  } catch (err){
    console.error(err);
    els.dreTbody.innerHTML = `<tr><td colspan="9" class="empty">Erro ao carregar DRE.</td></tr>`;
    renderGraficoDRE([], 0);
  } finally {
    document.body.style.cursor = "default";
  }
}
async function carregarDRECaixa(){
  try {
    const qs = new URLSearchParams({
      empresa: els.empresa.value || "",
      dataIni: els.dataIni.value || "",
      dataFim: els.dataFim.value || "",
      tipo: els.tipo.value || "todos",
    });

    const r = await fetch(`/api/financeiro/meta-real-caixa?${qs.toString()}`);
    const j = await r.json();

    document.getElementById("dcxFatTotal").textContent = fmtMoeda(j.totalFaturado || 0);
    document.getElementById("dcxPagTotal").textContent = fmtMoeda(j.totalPago || 0);
    document.getElementById("dcxMetaTotal").textContent = fmtPct(j.totalMetaPercentual || 0);
document.getElementById("dcxRealTotal").textContent = fmtPct(j.totalRealPercentual || 0);
    document.getElementById("dcxSaldo").textContent = fmtMoeda(j.saldoAposPagamentos || 0);

    const dados = Array.isArray(j.dados) ? j.dados : [];

    const acima = dados.filter(x => String(x.status || "").toUpperCase() === "ACIMA");
    document.getElementById("dcxAcimaMeta").textContent = String(acima.length);

    const maiorDesvio = dados.reduce((m, x) => Math.max(m, Number(x.diferenca || 0)), 0);
    document.getElementById("dcxMaiorDesvio").textContent = fmtPct(maiorDesvio || 0);

    const grupoPesado = dados.reduce((acc, x) => {
      return Number(x.valor || 0) > Number(acc.valor || 0) ? x : acc;
    }, { grupo: "-", valor: 0 });

    document.getElementById("dcxGrupoPesado").textContent = grupoPesado.grupo || "-";
    document.getElementById("dcxGrupoPesadoValor").textContent = fmtMoeda(grupoPesado.valor || 0);

    const tbResumo = document.getElementById("tbDreCaixaResumo");
    tbResumo.innerHTML = dados.map(x => `
      <tr>
        <td>${esc(x.grupo || "-")}</td>
        <td class="num">${fmtPct(x.meta || 0)}</td>
<td class="num">${fmtPct(x.realizado || 0)}</td>
<td class="num">${fmtPct(x.diferenca || 0)}</td>
        <td class="num">${fmtMoeda(x.valor || 0)}</td>
        <td><span class="pill ${String(x.status || '').toUpperCase() === 'ACIMA' ? 'acima' : 'ok'}">${esc(x.status || '-')}</span></td>
      </tr>
    `).join("");

    const tb = document.getElementById("tbDreCaixa");
    tb.innerHTML = dados.map(x => `
      <tr>
        <td>${esc(x.grupo || "-")}</td>
        <td class="num">${fmtPct(x.meta || 0)}</td>
<td class="num">${fmtPct(x.realizado || 0)}</td>
<td class="num">${fmtPct(x.diferenca || 0)}</td>
        <td class="num">${fmtMoeda(x.valor || 0)}</td>
        <td class="num">${fmtMoeda(x.atingivelValor || 0)}</td>
        <td><span class="pill ${String(x.status || '').toUpperCase() === 'ACIMA' ? 'acima' : 'ok'}">${esc(x.status || '-')}</span></td>
        <td class="num">${fmtNumero(x.qtdItens || 0)}</td>
      </tr>
    `).join("");

    const graf = document.getElementById("dcxGrafico");
    const maior = Math.max(...dados.map(x => Number(x.realizado || 0)), 1);

    graf.innerHTML = dados.map(x => {
      const pct = (Number(x.realizado || 0) / maior) * 100;
      return `
        <div class="bar-row">
          <div class="bar-label" title="${esc(x.grupo || '-')}">${esc(x.grupo || "-")}</div>
          <div class="bar-track" title="Meta: ${fmtPct(x.meta || 0)} | Real: ${fmtPct(x.realizado || 0)} | Valor: ${fmtMoeda(x.valor || 0)}">
            <div class="bar-fill" style="width:${Math.max(pct,1)}%; background:${String(x.status || '').toUpperCase() === 'ACIMA' ? '#fb7185' : '#22c55e'};"></div>
          </div>
          <div class="bar-value">${fmtPct(x.realizado || 0)}</div>
        </div>
      `;
    }).join("");
  } catch (err) {
    console.error("Erro carregarDRECaixa:", err);
  }
}
function fecharModalFluxoResumo(){
  els.modalFluxoResumo?.classList.remove("show");
  filtroModalReceber = "";
  filtroModalPagar = "";
}

async function limparFiltroModalAtual(){
  if (els.modalFluxoTitulo?.textContent === "Pagar em aberto") {
    filtroModalPagar = "";
    await renderDetalhesPagarNoModal();
    ativarOrdenacaoEmTodasAsTabelas();
    return;
  }

  filtroModalReceber = "";
  await renderDetalhesReceberNoModal();
  ativarOrdenacaoEmTodasAsTabelas();
}

function obterTitulosPagarFiltradosModal(){
  const lista = Array.isArray(estadoAtual?.titulosPagar) ? estadoAtual.titulosPagar : [];
  const filtro = normalizarTextoComparacao(filtroModalPagar);

  if (!filtro) return lista;

  return lista.filter(x => {
    const plano = normalizarTextoComparacao(x.planoConta || "");
    return plano === filtro;
  });
}
function limparResumoPessoaModal(){
  if (els.boxResumoFornecedorPagar) els.boxResumoFornecedorPagar.classList.add("hidden");
  if (els.subResumoFornecedorPagar) els.subResumoFornecedorPagar.textContent = "";
  if (els.tbodyResumoFornecedorPagar) els.tbodyResumoFornecedorPagar.innerHTML = "";
}
function renderResumoClienteReceber(lista){
  const dados = Array.isArray(lista) ? lista : [];

  if (!els.boxResumoFornecedorPagar || !els.tbodyResumoFornecedorPagar) return;

  if (!filtroModalReceber){
    limparResumoPessoaModal();
    return;
  }

  els.boxResumoFornecedorPagar.classList.remove("hidden");

  if (els.thResumoPessoaModal) {
    els.thResumoPessoaModal.textContent = "Cliente";
  }

  const titulo = els.boxResumoFornecedorPagar.querySelector("h2");
  if (titulo) {
    titulo.textContent = "Resumo por cliente";
  }

  els.subResumoFornecedorPagar.textContent = `Clientes da forma de pagamento: ${filtroModalReceber}.`;

  const mapa = new Map();

  dados.forEach(x => {
    const cliente = String(x.pessoa || "SEM CLIENTE").trim() || "SEM CLIENTE";
    const valor = Number(x.valor || 0);

    if (!mapa.has(cliente)){
      mapa.set(cliente, { cliente, qtd: 0, total: 0 });
    }

    const item = mapa.get(cliente);
    item.qtd += 1;
    item.total += valor;
  });

  const listaResumo = Array.from(mapa.values())
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0));

  const totalForma = listaResumo.reduce((s, x) => s + Number(x.total || 0), 0);

  els.tbodyResumoFornecedorPagar.innerHTML = listaResumo.length
    ? listaResumo.map(x => {
        const pct = totalForma > 0 ? (Number(x.total || 0) / totalForma) * 100 : 0;
        return `
          <tr>
            <td>${esc(x.cliente)}</td>
            <td class="num">${fmtNumero(x.qtd || 0)}</td>
            <td class="num">${fmtMoeda(x.total || 0)}</td>
            <td class="num">${fmtPct(pct || 0)}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" class="empty">Sem clientes para esta forma.</td></tr>`;
}

function renderResumoFornecedorPagar(lista){
  const dados = Array.isArray(lista) ? lista : [];

  if (!els.boxResumoFornecedorPagar || !els.tbodyResumoFornecedorPagar) return;

  if (!filtroModalPagar){
    els.boxResumoFornecedorPagar.classList.add("hidden");
    els.tbodyResumoFornecedorPagar.innerHTML = "";
    return;
  }
limparResumoPessoaModal();
  els.boxResumoFornecedorPagar.classList.remove("hidden");
  els.subResumoFornecedorPagar.textContent = `Fornecedores do plano de conta: ${filtroModalPagar}.`;

  const mapa = new Map();

  dados.forEach(x => {
    const fornecedor = String(x.pessoa || "SEM FORNECEDOR").trim() || "SEM FORNECEDOR";
    const valor = Number(x.valor || 0);

    if (!mapa.has(fornecedor)){
      mapa.set(fornecedor, {
        fornecedor,
        qtd: 0,
        total: 0
      });
    }

    const item = mapa.get(fornecedor);
    item.qtd += 1;
    item.total += valor;
  });

  const listaResumo = Array.from(mapa.values())
    .sort((a, b) => Number(b.total || 0) - Number(a.total || 0));

  const totalPlano = listaResumo.reduce((s, x) => s + Number(x.total || 0), 0);

  els.tbodyResumoFornecedorPagar.innerHTML = listaResumo.length
    ? listaResumo.map(x => {
        const pct = totalPlano > 0 ? (Number(x.total || 0) / totalPlano) * 100 : 0;
        return `
          <tr>
            <td>${esc(x.fornecedor)}</td>
            <td class="num">${fmtNumero(x.qtd || 0)}</td>
            <td class="num">${fmtMoeda(x.total || 0)}</td>
            <td class="num">${fmtPct(pct || 0)}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" class="empty">Sem fornecedor para este plano.</td></tr>`;
}
async function renderDetalhesPagarNoModal(){
  const plano = filtroModalPagar || "";
  const d = await getJSON(montarUrlDetalhePagar(plano));
  const lista = Array.isArray(d?.titulos) ? d.titulos : [];

  estadoAtual.titulosPagar = lista;
renderResumoFornecedorPagar(lista);
  if (els.modalFluxoColunaAgrupador) {
    els.modalFluxoColunaAgrupador.textContent = "Plano de conta";
  }

  els.modalFluxoDetalheTitulo.textContent = "Títulos a pagar";
  els.modalFluxoDetalheSubtitulo.textContent = filtroModalPagar
    ? `Pagamentos filtrados pelo plano de conta: ${filtroModalPagar}.`
    : "Pagamentos e saídas em aberto dentro do período filtrado.";

  els.modalFluxoDetalheTbody.innerHTML = lista.length ? lista.map(x => `
    <tr>
      <td>${esc(fmtData(x.data))}</td>
      <td>${esc(x.empresa || "-")}</td>
      <td>${esc(x.documento || "-")}</td>
      <td>${esc(x.descricao || "-")}</td>
      <td>${esc(x.pessoa || "-")}</td>
      <td>${esc(x.instrucoes || "-")}</td>
      <td>${esc(x.planoConta || "-")}</td>
      <td class="num">${fmtMoeda(x.valor || 0)}</td>
    </tr>
  `).join("") : `
    <tr>
      <td colspan="8" class="empty">Sem títulos para o agrupamento selecionado.</td>
    </tr>
  `;
}

async function limparFiltroModalPagar(){
  filtroModalPagar = "";
  await renderDetalhesPagarNoModal();
  ativarOrdenacaoEmTodasAsTabelas();
}
function normalizarTextoComparacao(v){
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function obterTitulosReceberFiltradosModal(){
  const lista = Array.isArray(estadoAtual?.titulosReceber) ? estadoAtual.titulosReceber : [];
  const filtro = normalizarTextoComparacao(filtroModalReceber);

  if (!filtro) return lista;

  return lista.filter(x => {
    const forma = normalizarTextoComparacao(x.formaReceber || "");

    if (filtro === "CARTAO") {
      return forma === "CARTAO" || forma === "CARTAO CREDITO" || forma === "CARTAO PARCELADO";
    }

    return forma === filtro;
  });
}

async function renderDetalhesReceberNoModal(){
  const forma = filtroModalReceber || "";
  const d = await getJSON(montarUrlDetalheReceber(forma));
  const lista = Array.isArray(d?.titulos) ? d.titulos : [];

  estadoAtual.titulosReceber = lista;
if (els.thResumoPessoaModal) els.thResumoPessoaModal.textContent = "Cliente";
renderResumoClienteReceber(lista);

  if (els.modalFluxoColunaAgrupador) {
    els.modalFluxoColunaAgrupador.textContent = "Forma de pagamento";
  }

  els.modalFluxoDetalheTitulo.textContent = "Títulos a receber";
  els.modalFluxoDetalheSubtitulo.textContent = filtroModalReceber
    ? `Carteira filtrada pela forma de pagamento: ${filtroModalReceber}.`
    : "Carteira em aberto dentro do período filtrado.";

  els.modalFluxoDetalheTbody.innerHTML = lista.length ? lista.map(x => `
    <tr>
      <td>${esc(fmtData(x.data))}</td>
      <td>${esc(x.empresa || "-")}</td>
      <td>${esc(x.documento || "-")}</td>
      <td>${esc(x.descricao || "-")}</td>
      <td>${esc(x.pessoa || "-")}</td>
      <td>${esc(x.instrucoes || "-")}</td>
      <td>${esc(x.formaReceber || "-")}</td>
      <td class="num">${fmtMoeda(x.valor || 0)}</td>
    </tr>
  `).join("") : `
    <tr>
      <td colspan="8" class="empty">Sem títulos para o agrupamento selecionado.</td>
    </tr>
  `;
}

async function abrirModalFluxoResumoReceber(){
  const lista = Array.isArray(estadoAtual?.resumoReceberForma) ? estadoAtual.resumoReceberForma : [];
  const total = lista.reduce((a, x) => a + Number(x.total || 0), 0);
  const qtdTitulos = lista.reduce((a, x) => a + Number(x.qtdTitulos || 0), 0);

  els.modalFluxoTitulo.textContent = "Receber em aberto";
  els.modalFluxoSubtitulo.textContent = "Resumo por forma de pagamento dos títulos a receber em aberto.";
  els.modalFluxoTabelaTitulo.textContent = "Resumo por forma de pagamento";
  els.modalFluxoTabelaSubtitulo.textContent = "Consolidação do receber em aberto dentro do período filtrado.";
  els.modalFluxoTotal.textContent = fmtMoeda(total);
  els.modalFluxoQtdGrupos.textContent = fmtNumero(lista.length);
  els.modalFluxoQtdTitulos.textContent = fmtNumero(qtdTitulos);

  if (els.modalFluxoColunaAgrupador) {
    els.modalFluxoColunaAgrupador.textContent = "Forma de pagamento";
  }

  els.modalFluxoThead.innerHTML = `
    <tr>
      <th>Forma de pagamento</th>
      <th class="num">Qtd. títulos</th>
      <th class="num">Total</th>
      <th class="num">% do total</th>
    </tr>
  `;

  els.modalFluxoTbody.innerHTML = lista.length
    ? lista.map(x => {
        const pct = total > 0 ? (Number(x.total || 0) / total) * 100 : 0;
        return `
          <tr class="linha-resumo-receber" data-forma="${esc(x.forma || "OUTROS")}">
            <td>${esc(x.forma || "OUTROS")}</td>
            <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
            <td class="num">${fmtMoeda(x.total || 0)}</td>
            <td class="num">${fmtPct(pct || 0)}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" class="empty">Sem dados para exibir.</td></tr>`;

  els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Carregando detalhes...</td></tr>`;
  filtroModalReceber = "";

  els.modalFluxoResumo.classList.add("show");
  ativarOrdenacaoEmTodasAsTabelas();

  els.modalFluxoTbody.querySelectorAll(".linha-resumo-receber").forEach(tr => {
    tr.style.cursor = "pointer";
    tr.title = "Clique para filtrar os títulos abaixo";
    tr.addEventListener("click", async () => {
      const forma = tr.getAttribute("data-forma") || "";
      filtroModalReceber = forma;
      els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Carregando detalhes...</td></tr>`;
      try {
        await renderDetalhesReceberNoModal();
        ativarOrdenacaoEmTodasAsTabelas();
      } catch (err) {
        console.error(err);
        els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Erro ao carregar detalhes.</td></tr>`;
      }
    });
  });

  try {
    await renderDetalhesReceberNoModal();
    ativarOrdenacaoEmTodasAsTabelas();
  } catch (err) {
    console.error(err);
    els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Erro ao carregar detalhes.</td></tr>`;
  }
}

async function abrirModalFluxoResumoPagar(){
  const lista = Array.isArray(estadoAtual?.resumoPagarPlano) ? estadoAtual.resumoPagarPlano : [];
  const total = lista.reduce((a, x) => a + Number(x.total || 0), 0);
  const qtdTitulos = lista.reduce((a, x) => a + Number(x.qtdTitulos || 0), 0);
limparResumoPessoaModal();
  els.modalFluxoTitulo.textContent = "Pagar em aberto";
  els.modalFluxoSubtitulo.textContent = "Resumo por plano de conta dos títulos a pagar / saídas em aberto.";
  els.modalFluxoTabelaTitulo.textContent = "Resumo por plano de conta";
  els.modalFluxoTabelaSubtitulo.textContent = "Consolidação do pagar em aberto dentro do período filtrado.";
  els.modalFluxoDetalheTitulo.textContent = "Títulos a pagar";
  els.modalFluxoDetalheSubtitulo.textContent = "Pagamentos e saídas em aberto dentro do período filtrado.";
  els.modalFluxoTotal.textContent = fmtMoeda(total);
  els.modalFluxoQtdGrupos.textContent = fmtNumero(lista.length);
  els.modalFluxoQtdTitulos.textContent = fmtNumero(qtdTitulos);

  if (els.modalFluxoColunaAgrupador) {
    els.modalFluxoColunaAgrupador.textContent = "Plano de conta";
  }

  els.modalFluxoThead.innerHTML = `
    <tr>
      <th>Plano de conta</th>
      <th>Item</th>
      <th class="num">Qtd. títulos</th>
      <th class="num">Total</th>
      <th class="num">% do total</th>
    </tr>
  `;

  els.modalFluxoTbody.innerHTML = lista.length
    ? lista.map(x => {
        const pct = total > 0 ? (Number(x.total || 0) / total) * 100 : 0;
        return `
          <tr class="linha-resumo-pagar" data-plano="${esc(x.planoConta || "SEM PLANO")}">
            <td>${esc(x.planoConta || "SEM PLANO")}</td>
            <td>${esc(x.item || "-")}</td>
            <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
            <td class="num">${fmtMoeda(x.total || 0)}</td>
            <td class="num">${fmtPct(pct || 0)}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="5" class="empty">Sem dados para exibir.</td></tr>`;

  els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Carregando detalhes...</td></tr>`;
  filtroModalPagar = "";
if (els.boxResumoFornecedorPagar) {
  els.boxResumoFornecedorPagar.classList.add("hidden");
}
if (els.tbodyResumoFornecedorPagar) {
  els.tbodyResumoFornecedorPagar.innerHTML = "";
}
  els.modalFluxoResumo.classList.add("show");
  ativarOrdenacaoEmTodasAsTabelas();

  els.modalFluxoTbody.querySelectorAll(".linha-resumo-pagar").forEach(tr => {
    tr.style.cursor = "pointer";
    tr.title = "Clique para filtrar os títulos abaixo";

    tr.addEventListener("click", async () => {
      const plano = tr.getAttribute("data-plano") || "";
      filtroModalPagar = plano;
      els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Carregando detalhes...</td></tr>`;
      try {
        await renderDetalhesPagarNoModal();
        ativarOrdenacaoEmTodasAsTabelas();
      } catch (err) {
        console.error(err);
        els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Erro ao carregar detalhes.</td></tr>`;
      }
    });
  });

  try {
    await renderDetalhesPagarNoModal();
    ativarOrdenacaoEmTodasAsTabelas();
  } catch (err) {
    console.error(err);
    els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Erro ao carregar detalhes.</td></tr>`;
  }
}
function ativarCliqueDetalheDRE(){
  const tb = document.getElementById("dreTbody");
  const graf = document.getElementById("graficoDRE");

  if(tb && !tb.dataset.clickDreAtivo){
    tb.dataset.clickDreAtivo = "1";

    tb.addEventListener("click", function(e){
      const tr = e.target.closest("tr");
      if(!tr) return;

      const primeiraCelula = tr.querySelector("td");
      if(!primeiraCelula) return;

      const grupo = primeiraCelula.textContent.trim();
      if(!grupo) return;

      carregarDetalheDRE(grupo);

      setTimeout(() => {
        document.getElementById("dreDetailTitle")?.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });
      }, 150);
    });
  }

  if(graf && !graf.dataset.clickDreAtivo){
    graf.dataset.clickDreAtivo = "1";

    graf.addEventListener("click", function(e){
      const linha = e.target.closest(".bar-row");
      if(!linha) return;

      const label = linha.querySelector(".bar-label");
      const grupo = label ? label.textContent.trim() : "";

      if(!grupo) return;

      carregarDetalheDRE(grupo);

      setTimeout(() => {
        document.getElementById("dreDetailTitle")?.scrollIntoView({
          behavior:"smooth",
          block:"start"
        });
      }, 150);
    });
  }
}
function carregarDRE(){
  return carregarDRECompetencia();
}

function carregarDRE12Meses(){
  return carregarDRECompetencia12Meses();
}

function atualizarCentralFinanceira(resumo = {}, mensal = []){
  const valores = {
    centralReceber: resumo.receber_aberto || 0,
    centralPagar: resumo.pagar_aberto || 0,
    centralSaldo: resumo.saldo_projetado || 0,
    centralAvista: resumo.previsto_avista_ano_passado || 0,
    centralAprazo: resumo.previsto_aprazo_ano_passado || 0,
    centralTotalPrev: resumo.previsto_total_ano_passado || 0
  };

  Object.entries(valores).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = fmtMoeda(valor);
  });

  // Indicadores dos botões usam exatamente os mesmos valores do resumo
  // já retornado pelo Fluxo de Caixa. Nenhuma consulta extra é executada.
  const quick = {
    quickSaldoProjetado: resumo.saldo_projetado || 0,
    quickReceber: resumo.receber_aberto || 0,
    quickPagar: resumo.pagar_aberto || 0
  };

  Object.entries(quick).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = fmtMoeda(valor);
  });

  const box = document.getElementById("centralFluxoResumo");
  if(!box) return;

  const lista = (Array.isArray(mensal) ? mensal : []).slice(-6);

  if(!lista.length){
    box.innerHTML = `<div class="empty">Sem dados no período.</div>`;
    return;
  }

  box.innerHTML = lista.map(x => {
    const entrada = Number(x.receber_aberto || 0) + Number(x.previsto_total_ano_passado || 0);
    const saida = Number(x.pagar_aberto || 0);
    const saldo = Number(x.saldo_previsto || 0);

    return `<div class="central-resumo-row">
      <strong>${esc(x.periodo || "-")}</strong>
      <span class="in">Entradas ${fmtMoeda(entrada)}</span>
      <span class="out">Saídas ${fmtMoeda(saida)}</span>
      <b class="${saldo >= 0 ? "pos" : "neg"}">${fmtMoeda(saldo)}</b>
    </div>`;
  }).join("");
}

async function carregarTudo(){
  const reqId = ++fluxoRequestId;

  try{
    document.body.style.cursor = "wait";

    if (!els.dataIni.value || !els.dataFim.value) {
      return;
    }

     const qs = new URLSearchParams();
    if ((els.empresa.value || "").trim()) qs.set("empresa", (els.empresa.value || "").trim());
    if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
    if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);
    if ((els.tipo.value || "").trim()) qs.set("tipo", (els.tipo.value || "").trim());
    if ((els.rpSaida.value || "").trim()) qs.set("rpSaida", (els.rpSaida.value || "").trim());

    const data = await getJSON(`/api/financeiro/fluxo-caixa?${qs.toString()}`);

    if (reqId !== fluxoRequestId) return;
    const resumo = data.resumo || {};
    const diario = Array.isArray(data.diario) ? data.diario : [];
    const mensal = Array.isArray(data.mensal) ? data.mensal : [];
    const titulosReceber = Array.isArray(data.titulosReceber) ? data.titulosReceber : [];
    const titulosPagar = Array.isArray(data.titulosPagar) ? data.titulosPagar : [];
    const resumoReceberForma = Array.isArray(data.resumoReceberForma) ? data.resumoReceberForma : [];
    const resumoPagarPlano = Array.isArray(data.resumoPagarPlano) ? data.resumoPagarPlano : [];

    estadoAtual = {
      resumo,
      diario,
      mensal,
      titulosReceber,
      titulosPagar,
      resumoReceberForma,
      resumoPagarPlano
    };

    atualizarCentralFinanceira(resumo, mensal);

       const elReceber = document.getElementById("fcReceberAberto");
    const elPagar = document.getElementById("fcPagarAberto");
    const elPrevAvista = document.getElementById("fcPrevAvistaAnoPassado");
    const elPrevAprazo = document.getElementById("fcPrevAprazoAnoPassado");
    const elPrevTotal = document.getElementById("fcPrevTotalAnoPassado");
    const elSaldo = document.getElementById("fcSaldoProjetado");
    const elReceberVencido = document.getElementById("fcReceberVencido");
    const elPagarVencido = document.getElementById("fcPagarVencido");

    if (elReceber) elReceber.textContent = fmtMoeda(resumo.receber_aberto || 0);
    if (elPagar) elPagar.textContent = fmtMoeda(resumo.pagar_aberto || 0);
    if (elPrevAvista) elPrevAvista.textContent = fmtMoeda(resumo.previsto_avista_ano_passado || 0);
    if (elPrevAprazo) elPrevAprazo.textContent = fmtMoeda(resumo.previsto_aprazo_ano_passado || 0);
    if (elPrevTotal) elPrevTotal.textContent = fmtMoeda(resumo.previsto_total_ano_passado || 0);
    if (elSaldo) elSaldo.textContent = fmtMoeda(resumo.saldo_projetado || 0);
    if (elReceberVencido) elReceberVencido.textContent = fmtMoeda(resumo.receber_vencido || 0);
    if (elPagarVencido) elPagarVencido.textContent = fmtMoeda(resumo.pagar_vencido || 0);

    if (reqId !== fluxoRequestId) return;

    montarTabelaFluxoDiario(diario);
    montarTabelaFluxoMensal(mensal);

    ativarOrdenacaoEmTodasAsTabelas();

    carregarCalendarioFinanceiro();

  } catch (err){
    console.error(err);
    alert("Erro ao carregar fluxo de caixa: " + (err.message || err));
  } finally {
    document.body.style.cursor = "default";
  }
}
    els.empresa.addEventListener("input", () => {
      atualizarDatalistEmpresas(els.empresa.value);
    });

    els.empresa.addEventListener("focus", () => {
      atualizarDatalistEmpresas(els.empresa.value);
    });

    els.empresa.addEventListener("keydown", (e) => {
      if (e.key === "Enter") recarregarAbaAtual();
    });

els.dataIni.addEventListener("change", () => {
  // só aplica quando clicar no botão Aplicar
});

els.dataFim.addEventListener("change", () => {
  // só aplica quando clicar no botão Aplicar
});
    els.tipo?.addEventListener?.("change", recarregarAbaAtual);

els.visaoDireita?.addEventListener?.("change", () => {
  limparDetalhe();
  if (abaAtual === "geral") carregarTudo();
});

els.rpSaida?.addEventListener?.("change", () => {
  limparDetalhe();
  if (abaAtual === "geral") carregarTudo();
});
    els.cardReceberAberto?.addEventListener("click", () => {
  if (abaAtual !== "geral") return;
  abrirModalFluxoResumoReceber();
});

// Pagar em aberto agora é detalhado somente pelo Calendário Financeiro.
document.getElementById("cardAtivoResumo")?.addEventListener("click", () => {
  if (abaAtual !== "ativo_passivo") return;
  abrirModalAtivoPassivoPlano("ATIVO");
});

document.getElementById("cardPassivoResumo")?.addEventListener("click", () => {
  if (abaAtual !== "ativo_passivo") return;
  abrirModalAtivoPassivoPlano("PASSIVO");
});
    els.modalFluxoResumo?.addEventListener("click", (e) => {
      if (e.target === els.modalFluxoResumo) {
        fecharModalFluxoResumo();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        fecharModalFluxoResumo();
      }
    });

function parametrosAtivoPassivo(){
  const empresa = document.getElementById("empresa")?.value || "";
  const dataIni = document.getElementById("dataIni")?.value || "";
  const dataFim = document.getElementById("dataFim")?.value || "";
  const status = document.getElementById("apFiltroStatus")?.value || "B";
  const lado = document.getElementById("apFiltroLado")?.value || "TODOS";
  const forma = document.getElementById("apFiltroForma")?.value || "";
  const busca = document.getElementById("apBusca")?.value || "";
  const fornecedor = document.getElementById("filtroFornecedorFluxo")?.value || "";
  const plano = document.getElementById("filtroPlanoFluxo")?.value || "";

  return {empresa,dataIni,dataFim,status,lado,forma,busca,fornecedor,plano};
}

function chaveAtivoPassivo(){
  return new URLSearchParams(parametrosAtivoPassivo()).toString();
}

function invalidarDetalheAtivoPassivo(){
  AP_DETALHE_CARREGADO = false;
  AP_DETALHE_CACHE_CHAVE = "";
  AP_DETALHE_ATIVO = [];
  AP_DETALHE_PASSIVO = [];

  const area = document.getElementById("apDetalhesFinanceiros");
  const btn = document.getElementById("btnTabelaPosicaoFinanceira");

  area?.classList.remove("show");
  if(btn){
    btn.disabled = false;
    btn.textContent = "Carregar tabela";
    btn.classList.remove("active");
  }
}

function renderMiniGraficoAPResumo(id,dados,lado,campo){
  const el = document.getElementById(id);
  if(!el) return;

  dados = Array.isArray(dados) ? dados : [];

  if(!dados.length){
    el.innerHTML = `<div class="empty">Sem dados.</div>`;
    return;
  }

  const maior = Math.max(...dados.map(x=>Math.abs(Number(x.valor||0))),1);
  const cor = lado === "ATIVO" ? "#22c55e" : "#ef4444";

  el.innerHTML = dados.map(x=>{
    const valor = Number(x.valor||0);
    const pct = Math.max(1,Math.abs(valor)/maior*100);
    const nome = String(x.nome||"-");
    const nomeSeguro = encodeURIComponent(nome);

    return `
      <div
        class="ap-barra ap-barra-resumo"
        onclick="filtrarGraficoResumoAP('${lado}','${campo}','${nomeSeguro}')"
        title="Clique para filtrar"
      >
        <div class="ap-barra-top">
          <span class="ap-barra-nome">${esc(nome)}</span>
          <span class="ap-barra-valor">${fmtMoeda(valor)}</span>
        </div>
        <div class="ap-barra-track">
          <div class="ap-barra-fill" style="width:${pct}%;background:${cor};"></div>
        </div>
        <div class="ap-barra-sub">${fmtNumero(x.qtd||0)} lançamento(s)</div>
      </div>
    `;
  }).join("");
}

function renderGraficosAtivoPassivoResumo(){
  const g = AP_RESUMO_GRAFICOS || {};

  renderMiniGraficoAPResumo("grafAtivoPessoa",g.ativoPessoa,"ATIVO","pessoa");
  renderMiniGraficoAPResumo("grafAtivoEmpresa",g.ativoEmpresa,"ATIVO","empresa");
  renderMiniGraficoAPResumo("grafAtivoForma",g.ativoForma,"ATIVO","forma");
  renderMiniGraficoAPResumo("grafAtivoContaBanco",g.ativoContaBanco,"ATIVO","contaBanco");
  renderMiniGraficoAPResumo("grafAtivoDescricao",g.ativoDescricao,"ATIVO","descricao");

  renderMiniGraficoAPResumo("grafPassivoPlano",g.passivoPlano,"PASSIVO","plano");
  renderMiniGraficoAPResumo("grafPassivoPessoa",g.passivoPessoa,"PASSIVO","pessoa");
  renderMiniGraficoAPResumo("grafPassivoEmpresa",g.passivoEmpresa,"PASSIVO","empresa");
  renderMiniGraficoAPResumo("grafPassivoForma",g.passivoForma,"PASSIVO","forma");
  renderMiniGraficoAPResumo("grafPassivoContaBanco",g.passivoContaBanco,"PASSIVO","contaBanco");
}

function filtrarGraficoResumoAP(lado,campo,nomeEnc){
  const nome = decodeURIComponent(nomeEnc||"");

  if(campo === "empresa"){
    const el = document.getElementById("empresa");
    if(el) el.value = nome;
  }else if(campo === "forma"){
    const el = document.getElementById("apFiltroForma");
    if(el) el.value = nome;
  }else if(campo === "pessoa"){
    const el = document.getElementById("apBusca");
    if(el) el.value = nome;
  }else if(campo === "plano"){
    const el = document.getElementById("filtroPlanoFluxo");
    if(el) el.value = nome;
  }else{
    // Para campos sem filtro principal, carrega o detalhe só no clique.
    carregarDetalheAtivoPassivo(null,true).then(()=>{
      filtrarGraficoAtivoPassivo(lado,campo,nomeEnc);
    });
    return;
  }

  carregarAtivoPassivo();
}
window.filtrarGraficoResumoAP = filtrarGraficoResumoAP;


function ocultarAvisoPosicaoFinanceira(){
  const box = document.getElementById("apAvisoConsulta");
  box?.classList.remove("show","timeout","erro");
}

function mostrarAvisoPosicaoFinanceira(tipo,mensagem){
  const box = document.getElementById("apAvisoConsulta");
  const titulo = document.getElementById("apAvisoTitulo");
  const texto = document.getElementById("apAvisoTexto");
  if(!box) return;

  box.classList.remove("timeout","erro");
  box.classList.add("show", tipo === "timeout" ? "timeout" : "erro");

  if(titulo){
    titulo.textContent = tipo === "timeout"
      ? "Consulta demorou mais que o esperado"
      : "Não foi possível concluir a consulta";
  }

  if(texto){
    texto.textContent = mensagem || (
      tipo === "timeout"
        ? "Refine os filtros ou tente novamente."
        : "Tente novamente em alguns instantes."
    );
  }
}

function erroEhTimeoutPosicao(erro){
  const msg = String(erro?.message || erro || "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("query read timeout") ||
    msg.includes("statement timeout") ||
    msg.includes("canceling statement due to statement timeout")
  );
}

async function carregarAtivoPassivo(){
  const reqId = ++ativoPassivoRequestId;
  const p = parametrosAtivoPassivo();

  try{
    ocultarAvisoPosicaoFinanceira();

    const set = (id,txt) => {
      const el=document.getElementById(id);
      if(el) el.textContent=txt;
    };

    set("apTotalAtivo","Calculando...");
    set("apTotalPassivo","Calculando...");
    set("apSaldo","Calculando...");

    invalidarDetalheAtivoPassivo();

    const qs = new URLSearchParams(p);
    const d = await getJSON(`/api/financeiro/ativo-passivo-resumo?${qs.toString()}`);

    if(reqId !== ativoPassivoRequestId) return;

    estadoAtivoPassivo = d;
    AP_RESUMO_GRAFICOS = d.graficos || {};

    const tituloAtivo = document.getElementById("apTituloAtivo");
    const tituloPassivo = document.getElementById("apTituloPassivo");

    if(p.status === "B"){
      if(tituloAtivo) tituloAtivo.textContent="RECEBIDO";
      if(tituloPassivo) tituloPassivo.textContent="PAGO";
    }else if(p.status === "A"){
      if(tituloAtivo) tituloAtivo.textContent="A RECEBER";
      if(tituloPassivo) tituloPassivo.textContent="A PAGAR";
    }else{
      if(tituloAtivo) tituloAtivo.textContent="ATIVO TOTAL";
      if(tituloPassivo) tituloPassivo.textContent="PASSIVO TOTAL";
    }

    set("apTotalAtivo",fmtMoeda(d.totalAtivo||0));
    set("apTotalPassivo",fmtMoeda(d.totalPassivo||0));
    set("apSaldo",fmtMoeda(d.saldo||0));

    const periodo = document.getElementById("apPeriodoResumo");
    if(periodo){
      const ini = p.dataIni ? new Date(p.dataIni+"T00:00:00").toLocaleDateString("pt-BR") : "-";
      const fim = p.dataFim ? new Date(p.dataFim+"T00:00:00").toLocaleDateString("pt-BR") : "-";
      periodo.textContent=`${ini} → ${fim}`;
    }

    const ativo = Array.isArray(d.ativo) ? d.ativo : [];
    const passivo = Array.isArray(d.passivo) ? d.passivo : [];

    const renderResumo = lista => lista.length
      ? lista.map(x=>`
          <tr>
            <td>${esc(x.origem||"-")}</td>
            <td>${esc(x.situacao||"-")}</td>
            <td class="num">${fmtNumero(x.qtd||0)}</td>
            <td class="num">${fmtMoeda(x.valor||0)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="empty">Sem dados no período.</td></tr>`;

    const ta=document.getElementById("apTbodyAtivo");
    const tp=document.getElementById("apTbodyPassivo");
    if(ta) ta.innerHTML=renderResumo(ativo);
    if(tp) tp.innerHTML=renderResumo(passivo);

    renderGraficosAtivoPassivoResumo();
    ativarOrdenacaoEmTodasAsTabelas();

  }catch(e){
    console.error("Erro resumo ativo/passivo:",e);

    if(reqId !== ativoPassivoRequestId) return;

    const timeout = erroEhTimeoutPosicao(e);

    const set = (id,txt) => {
      const el=document.getElementById(id);
      if(el) el.textContent=txt;
    };

    // Nunca deixa os cards presos em "Calculando..."
    set("apTotalAtivo","—");
    set("apTotalPassivo","—");
    set("apSaldo","—");

    mostrarAvisoPosicaoFinanceira(
      timeout ? "timeout" : "erro",
      timeout
        ? "O banco demorou para responder. Refine empresa, fornecedor, plano de conta ou período e tente novamente."
        : (e.message || "Não foi possível carregar os dados.")
    );
  }
}

async function carregarDetalheAtivoPassivo(btn=null,silencioso=false){
  const chave = chaveAtivoPassivo();

  if(AP_DETALHE_CARREGADO && AP_DETALHE_CACHE_CHAVE === chave){
    return true;
  }

  const p = parametrosAtivoPassivo();
  const qs = new URLSearchParams(p);

  if(btn){
    btn.disabled=true;
    btn.textContent="Carregando tabela...";
  }

  try{
    const d = await getJSON(`/api/financeiro/ativo-passivo?${qs.toString()}`);

    estadoAtivoPassivo = {
      ...estadoAtivoPassivo,
      ...d
    };

    AP_DETALHE_ATIVO = Array.isArray(d.detalheAtivo) ? d.detalheAtivo : [];
    AP_DETALHE_PASSIVO = Array.isArray(d.detalhePassivo) ? d.detalhePassivo : [];
    AP_DETALHE_CARREGADO = true;
    AP_DETALHE_CACHE_CHAVE = chave;

    const renderDetalheAtivo = AP_DETALHE_ATIVO.length
      ? AP_DETALHE_ATIVO.map(x=>`
        <tr>
          <td>${esc(x.empresa||"-")}</td>
          <td>${esc(x.pessoa||"-")}</td>
          <td>${esc(x.documento||"-")}</td>
          <td>${esc(x.descricao||"-")}</td>
          <td>${esc(x.forma||"-")}</td>
          <td>${esc(x.situacao||"-")}</td>
          <td>${fmtData(x.lancamento)}</td>
          <td>${fmtData(x.vencimento)}</td>
          <td>${fmtData(x.pagamento)}</td>
          <td class="num">${fmtMoeda(x.valor||0)}</td>
          <td class="num">${fmtMoeda(x.valorPago||0)}</td>
          <td class="num">${fmtMoeda(x.valorAberto||0)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="12" class="empty">Sem detalhes no ativo.</td></tr>`;

    const renderDetalhePassivo = AP_DETALHE_PASSIVO.length
      ? AP_DETALHE_PASSIVO.map(x=>`
        <tr>
          <td>${esc(x.empresa||"-")}</td>
          <td>${esc(x.pessoa||"-")}</td>
          <td>${esc(x.documento||"-")}</td>
          <td>${esc(x.descricao||"-")}</td>
          <td>${esc(x.planoConta||"-")}</td>
          <td>${esc(x.tipo||"-")}</td>
          <td>${esc(x.situacao||"-")}</td>
          <td>${fmtData(x.lancamento)}</td>
          <td>${fmtData(x.vencimento)}</td>
          <td>${fmtData(x.pagamento)}</td>
          <td class="num">${fmtMoeda(x.valor||0)}</td>
          <td class="num">${fmtMoeda(x.valorPago||0)}</td>
          <td class="num">${fmtMoeda(x.valorAberto||0)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="13" class="empty">Sem detalhes no passivo.</td></tr>`;

    const ta=document.getElementById("apTbodyDetalheAtivo");
    const tp=document.getElementById("apTbodyDetalhePassivo");
    if(ta) ta.innerHTML=renderDetalheAtivo;
    if(tp) tp.innerHTML=renderDetalhePassivo;

    const soma = (lista,campo)=>lista.reduce((s,x)=>s+Number(x[campo]||0),0);

    const set=(id,val)=>{
      const el=document.getElementById(id);
      if(el) el.textContent=fmtMoeda(val);
    };

    set("apBoxValorAtivo",soma(AP_DETALHE_ATIVO,"valor"));
    set("apBoxPagoAtivo",soma(AP_DETALHE_ATIVO,"valorPago"));
    set("apBoxAbertoAtivo",soma(AP_DETALHE_ATIVO,"valorAberto"));
    set("apTotValorAtivo",soma(AP_DETALHE_ATIVO,"valor"));
    set("apTotPagoAtivo",soma(AP_DETALHE_ATIVO,"valorPago"));
    set("apTotAbertoAtivo",soma(AP_DETALHE_ATIVO,"valorAberto"));

    set("apBoxValorPassivo",soma(AP_DETALHE_PASSIVO,"valor"));
    set("apBoxPagoPassivo",soma(AP_DETALHE_PASSIVO,"valorPago"));
    set("apBoxAbertoPassivo",soma(AP_DETALHE_PASSIVO,"valorAberto"));
    set("apTotValorPassivo",soma(AP_DETALHE_PASSIVO,"valor"));
    set("apTotPagoPassivo",soma(AP_DETALHE_PASSIVO,"valorPago"));
    set("apTotAbertoPassivo",soma(AP_DETALHE_PASSIVO,"valorAberto"));

    ativarOrdenacaoEmTodasAsTabelas();
    return true;

  }catch(e){
    console.error("Erro detalhe ativo/passivo:",e);

    if(!silencioso){
      const timeout = erroEhTimeoutPosicao(e);
      mostrarAvisoPosicaoFinanceira(
        timeout ? "timeout" : "erro",
        timeout
          ? "A tabela detalhada demorou para responder. Refine os filtros e tente novamente."
          : (e.message || "Não foi possível carregar a tabela detalhada.")
      );
    }

    return false;
  }finally{
    if(btn){
      btn.disabled=false;
      btn.textContent="Ocultar tabela";
    }
  }
}

async function toggleTabelaPosicaoFinanceira(btn){
  const area = document.getElementById("apDetalhesFinanceiros");
  if(!area) return;

  if(area.classList.contains("show")){
    area.classList.remove("show");
    if(btn){
      btn.textContent="Carregar tabela";
      btn.classList.remove("active");
    }
    return;
  }

  const ok = await carregarDetalheAtivoPassivo(btn,false);
  if(!ok) return;

  area.classList.add("show");
  if(btn){
    btn.textContent="Ocultar tabela";
    btn.classList.add("active");
  }
}
window.toggleTabelaPosicaoFinanceira = toggleTabelaPosicaoFinanceira;

function abrirModalAtivoPassivoPlano(tipo){
  const isAtivo = tipo === "ATIVO";
  const lista = isAtivo
    ? (estadoAtivoPassivo.resumoPlanoAtivo || [])
    : (estadoAtivoPassivo.resumoPlanoPassivo || []);

  const total = lista.reduce((s,x) => s + Number(x.total || 0), 0);
  const qtd = lista.reduce((s,x) => s + Number(x.qtdTitulos || 0), 0);

  els.modalFluxoTitulo.textContent = isAtivo ? "ATIVO" : "PASSIVO";
  els.modalFluxoSubtitulo.textContent = "Resumo por plano de contas considerando os filtros atuais.";
  els.modalFluxoTabelaTitulo.textContent = "Resumo por plano de contas";
  els.modalFluxoTabelaSubtitulo.textContent = "Valores filtrados por empresa, data, situação, lado, forma e busca.";
  els.modalFluxoTotal.textContent = fmtMoeda(total);
  els.modalFluxoQtdGrupos.textContent = fmtNumero(lista.length);
  els.modalFluxoQtdTitulos.textContent = fmtNumero(qtd);

  els.modalFluxoThead.innerHTML = `
    <tr>
      <th>Plano de contas</th>
      <th class="num">Qtd. títulos</th>
      <th class="num">Total</th>
      <th class="num">% do total</th>
    </tr>
  `;

  els.modalFluxoTbody.innerHTML = lista.length
    ? lista.map(x => {
        const pct = total > 0 ? (Number(x.total || 0) / total) * 100 : 0;
        return `
          <tr>
            <td>${esc(x.planoConta || "SEM PLANO")}</td>
            <td class="num">${fmtNumero(x.qtdTitulos || 0)}</td>
            <td class="num">${fmtMoeda(x.total || 0)}</td>
            <td class="num">${fmtPct(pct)}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="4" class="empty">Sem dados para exibir.</td></tr>`;

  els.modalFluxoDetalheTbody.innerHTML = `<tr><td colspan="8" class="empty">Resumo por plano de contas carregado acima.</td></tr>`;

  els.modalFluxoResumo.classList.add("show");
  ativarOrdenacaoEmTodasAsTabelas();
}
window.abrirModalAtivoPassivoPlano = abrirModalAtivoPassivoPlano;
let CONC_ARQUIVOS = [];

function concEsc(v){ return esc(String(v ?? '')); }
function concTipoLabel(tipo){ return tipo === 'C' ? 'CRÉDITO' : 'DÉBITO'; }

async function importarExtratosConciliacao(){
  const banco = document.getElementById('concBanco')?.value || '';
  const empresa = document.getElementById('concEmpresa')?.value || document.getElementById('empresa')?.value || '';
  const st = document.getElementById('concImportStatus');

  if(!banco){
    st.className='conc-status err';
    st.textContent='Selecione o banco.';
    return;
  }

  if(!CONC_ARQUIVOS.length){
    st.className='conc-status err';
    st.textContent='Selecione pelo menos um arquivo XLSX.';
    return;
  }

  if(banco === 'ITAU' && CONC_ARQUIVOS.some(arq => !/\.xlsx$/i.test(arq.name))){
    st.className='conc-status err';
    st.textContent='Para o Itaú, selecione somente arquivos .xlsx.';
    return;
  }

  let lidos=0, inseridos=0, duplicados=0, substituidos=0;
  const contasIdentificadas = new Set();

  try {
    for(const arq of CONC_ARQUIVOS){
      st.className='conc-status';
      st.textContent=`Importando ${arq.name}...`;

      const r=await fetch('/api/conciliacao-bancaria/importar',{
        method:'POST',
        headers:{
          'Content-Type':'application/octet-stream',
          'X-Banco':banco,
          'X-Empresa':empresa,
          'X-Arquivo':encodeURIComponent(arq.name)
        },
        body:await arq.arrayBuffer()
      });

      const d=await r.json();
      if(!r.ok) throw new Error(`${arq.name}: ${d.erro || 'falha na importação'}`);

      lidos+=Number(d.lidos||0);
      inseridos+=Number(d.inseridos||0);
      duplicados+=Number(d.duplicados||0);
      substituidos+=Number(d.substituidos||0);

      const ag=String(d.agencia||d.metadadosArquivo?.agencia||'').trim();
      const co=String(d.conta||d.metadadosArquivo?.conta||'').trim();
      if(ag || co) contasIdentificadas.add(`${ag ? `Ag. ${ag}` : ''}${ag && co ? ' · ' : ''}${co ? `Conta ${co}` : ''}`);
    }

    const detalheContas = contasIdentificadas.size
      ? ` Contas identificadas: ${Array.from(contasIdentificadas).join(' | ')}.`
      : '';

    const detalheSubstituidos=substituidos
      ? ` ${substituidos} registro(s) da importação anterior foram substituídos.`
      : '';
    st.className='conc-status ok';
    st.textContent=`Concluído: ${lidos} linhas lidas, ${inseridos} incluídas e ${duplicados} duplicadas ignoradas.${detalheSubstituidos}${detalheContas}`;
    CONC_ARQUIVOS=[];
    document.getElementById('concArquivos').value='';
    await carregarConciliacao();
  } catch(e){
    console.error('Erro ao importar extratos:', e);
    st.className='conc-status err';
    st.textContent=e.message || 'Erro ao importar extratos.';
  }
}

function renderTabelaConciliacao(d, modo='BANCO') {
  const z=d.resumo||{};
  document.getElementById('concEntrada').innerText=fmtMoeda(z.creditos||0);
  document.getElementById('concSaida').innerText=fmtMoeda(z.debitos||0);
  document.getElementById('concSaldo').innerText=fmtNumero(z.conciliados||0);
  document.getElementById('concDiferenca').innerText=fmtNumero(Number(z.pendentes||0)+Number(z.ambiguos||0));

  const lista=Array.isArray(d.movimentos)?d.movimentos:[];
  document.getElementById('tbConciliacao').innerHTML=lista.length?lista.map(x=>{
    const cls=String(x.situacao||'importado').toLowerCase();
    let erp='<span style="color:var(--muted)">Comparação ainda não executada.</span>';
    if(modo==='COMPARACAO'){
      erp=x.erp?`<strong>${concEsc(x.erp.pessoa||x.erp.descricao||'-')}</strong><br><small>${concEsc(x.erp.documento||x.erp.codigo||'-')} · ${concEsc(x.erp.data||'-')} · ${fmtMoeda(x.erp.valor||0)}</small>`:
        (x.situacao==='AMBIGUO'?`<strong>${fmtNumero(x.candidatos||0)} títulos possíveis</strong><br><small>Mesmo valor e data; exige escolha manual.</small>`:'<span style="color:var(--muted)">Nenhuma baixa exata encontrada.</span>');
    }
    return `<tr><td><span class="conc-pill ${cls}">${concEsc(x.situacao)}</span></td><td><span class="conc-bank">${concEsc(x.banco)}</span><br><small>Ag. ${concEsc(x.agencia||'-')} · Conta ${concEsc(x.conta)}</small></td><td>${concEsc(fmtData(x.data))}</td><td class="conc-hist"><strong>${concEsc(x.historico||'-')}</strong><br><small>${concEsc(x.documento||'')}</small></td><td>${concTipoLabel(x.tipo)}</td><td class="num ${x.tipo==='C'?'conc-value-credit':'conc-value-debit'}">${fmtMoeda(x.valor||0)}</td><td class="conc-erp">${erp}</td><td>${concEsc(x.arquivo||'-')}</td></tr>`;
  }).join(''):`<tr><td colspan="8" class="empty">Nenhuma movimentação encontrada para os filtros informados.</td></tr>`;
  ativarOrdenacaoEmTodasAsTabelas();
}


function zerarResumoConciliacao(){
  const entrada=document.getElementById('concEntrada');
  const saida=document.getElementById('concSaida');
  const conciliados=document.getElementById('concSaldo');
  const pendentes=document.getElementById('concDiferenca');
  if(entrada) entrada.innerText='R$ 0,00';
  if(saida) saida.innerText='R$ 0,00';
  if(conciliados) conciliados.innerText='0';
  if(pendentes) pendentes.innerText='0';
}

function prepararAbaConciliacao(){
  zerarResumoConciliacao();
  const tbody=document.getElementById('tbConciliacao');
  if(tbody){
    tbody.innerHTML='<tr><td colspan="8" class="empty">A listagem inicia vazia. Clique em Mostrar extratos quando desejar consultar as importações.</td></tr>';
  }
  const st=document.getElementById('concImportStatus');
  if(st && !CONC_ARQUIVOS.length){
    st.className='conc-status';
    st.textContent='A aba inicia vazia. Importe ou clique em Mostrar extratos.';
  }
}

async function limparExtratosConciliacao(){
  const st=document.getElementById('concImportStatus');
  const banco=document.getElementById('concBanco')?.value || '';
  const empresaConc=document.getElementById('concEmpresa')?.value || document.getElementById('empresa')?.value || '';

  const escopo=[];
  if(banco) escopo.push(`banco ${banco}`);
  if(empresaConc) escopo.push(`empresa ${empresaConc}`);
  const descricaoEscopo=escopo.length ? escopo.join(' e ') : 'todos os bancos e empresas';

  const confirmou=window.confirm(
    `Apagar os extratos bancários importados de ${descricaoEscopo}?\n\n` +
    'Esta ação remove somente a tabela auxiliar de extratos. Nenhum título, venda, pagamento ou dado oficial do ERP será excluído.'
  );
  if(!confirmou) return;

  try{
    st.className='conc-status';
    st.textContent='Limpando extratos importados...';

    const qs=new URLSearchParams({
      banco,
      empresa:empresaConc
    });

    const r=await fetch(`/api/conciliacao-bancaria/movimentos?${qs.toString()}`,{
      method:'DELETE'
    });
    const d=await r.json();
    if(!r.ok) throw new Error(d.erro || 'Erro ao limpar os extratos importados.');

    CONC_ARQUIVOS=[];
    const input=document.getElementById('concArquivos');
    if(input) input.value='';
    prepararAbaConciliacao();

    st.className='conc-status ok';
    st.textContent=`Limpeza concluída: ${fmtNumero(d.removidos||0)} registro(s) importado(s) foram excluídos.`;
  }catch(e){
    console.error('Erro ao limpar extratos:',e);
    st.className='conc-status err';
    st.textContent=e.message || 'Erro ao limpar os extratos importados.';
  }
}

async function carregarConciliacao() {
  const st=document.getElementById('concImportStatus');
  try {
    const empresaConc=document.getElementById('concEmpresa')?.value || document.getElementById('empresa')?.value || '';
    const qs=new URLSearchParams({
      empresa:empresaConc,
      banco:document.getElementById('concBanco')?.value || '',
      limit:'500'
    });
    st.className='conc-status';
    st.textContent='Carregando somente os extratos importados...';
    const r=await fetch(`/api/conciliacao-bancaria/movimentos?${qs.toString()}`);
    const d=await r.json();
    if(!r.ok) throw new Error(d.erro || 'Erro ao consultar os extratos bancários');
    renderTabelaConciliacao(d,'BANCO');
    st.className='conc-status ok';
    st.textContent=`Extratos carregados: ${fmtNumero(d.resumo?.total||0)} movimentações. Nenhuma consulta ao ERP foi executada.`;
  } catch(e){
    console.error('Erro ao carregar extratos bancários:',e);
    st.className='conc-status err';
    st.textContent=e.message;
    document.getElementById('tbConciliacao').innerHTML=`<tr><td colspan="8" class="empty">${concEsc(e.message)}</td></tr>`;
  }
}

async function compararConciliacaoERP(){
  const st=document.getElementById('concImportStatus');
  try{
    const dataIni=document.getElementById('concDataIni')?.value || '';
    const dataFim=document.getElementById('concDataFim')?.value || '';
    if(!dataIni || !dataFim) throw new Error('Informe a data inicial e a data final para comparar com o ERP.');

    const empresaConc=document.getElementById('concEmpresa')?.value || document.getElementById('empresa')?.value || '';
    const qs=new URLSearchParams({
      empresa:empresaConc,
      banco:document.getElementById('concBanco')?.value || '',
      dataIni,
      dataFim,
      status:document.getElementById('concStatus')?.value || 'todos',
      limit:'500'
    });

    st.className='conc-status';
    st.textContent='Comparando com o ERP. Aguarde...';
    const r=await fetch(`/api/conciliacao-bancaria/comparar?${qs.toString()}`);
    const d=await r.json();
    if(!r.ok) throw new Error(d.erro || 'Erro ao comparar com o ERP');
    renderTabelaConciliacao(d,'COMPARACAO');
    st.className='conc-status ok';
    st.textContent=`Comparação concluída para ${dataIni} até ${dataFim}: ${fmtNumero(d.resumo?.total||0)} movimentos analisados.`;
  }catch(e){
    console.error('Erro ao comparar conciliação:',e);
    st.className='conc-status err';
    st.textContent=e.message;
  }
}


function aplicarPeriodoMesAnteriorConciliacao(){
  const campoIni=document.getElementById('concDataIni');
  const campoFim=document.getElementById('concDataFim');
  if(!campoIni || !campoFim) return;

  const hoje=new Date();
  const primeiroDiaMesAnterior=new Date(hoje.getFullYear(), hoje.getMonth()-1, 1);
  const ultimoDiaMesAnterior=new Date(hoje.getFullYear(), hoje.getMonth(), 0);

  const localISO=(d)=>{
    const ano=d.getFullYear();
    const mes=String(d.getMonth()+1).padStart(2,'0');
    const dia=String(d.getDate()).padStart(2,'0');
    return `${ano}-${mes}-${dia}`;
  };

  campoIni.value=localISO(primeiroDiaMesAnterior);
  campoFim.value=localISO(ultimoDiaMesAnterior);
}

window.addEventListener("DOMContentLoaded", () => {
  aplicarPeriodoMesAnteriorConciliacao();
  prepararAbaConciliacao();
  const inpConc=document.getElementById('concArquivos');
  const dropConc=document.getElementById('concDrop');
  if(inpConc) inpConc.addEventListener('change',()=>{ CONC_ARQUIVOS=[...(inpConc.files||[])]; const s=document.getElementById('concImportStatus'); if(s) s.textContent=CONC_ARQUIVOS.length?`${CONC_ARQUIVOS.length} arquivo(s): ${CONC_ARQUIVOS.map(x=>x.name).join(', ')}`:'Nenhum arquivo selecionado.'; });
  if(dropConc){
    ['dragenter','dragover'].forEach(ev=>dropConc.addEventListener(ev,e=>{e.preventDefault();dropConc.classList.add('drag')}));
    ['dragleave','drop'].forEach(ev=>dropConc.addEventListener(ev,e=>{e.preventDefault();dropConc.classList.remove('drag')}));
    dropConc.addEventListener('drop',e=>{ CONC_ARQUIVOS=[...(e.dataTransfer?.files||[])].filter(x=>/\.xlsx$/i.test(x.name)); const s=document.getElementById('concImportStatus'); if(s) s.textContent=CONC_ARQUIVOS.length?`${CONC_ARQUIVOS.length} arquivo(s): ${CONC_ARQUIVOS.map(x=>x.name).join(', ')}`:'Nenhum arquivo XLSX válido.'; });
  }
  aplicarDatasPadrao();
  limparDetalhe();
  limparDetalheDRE();
  carregarTudo();
  ativarOrdenacaoEmTodasAsTabelas();
recarregarAbaAtual();
});

ativarCliqueDetalheDRE();
let CAL_FIN_DIAS = [];
let CAL_FIN_DATAS = new Set();
let CAL_FIN_TITULOS = [];
let CAL_FIN_TITULOS_FILTRADOS = [];
let CAL_FIN_MESES = new Set();
let CAL_FIN_SELECAO_MANUAL = false;
function calFinMoeda(v){
  return Number(v || 0).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
}

function calFinDataBR(v){
  if(!v) return "-";
  return new Date(v + "T00:00:00").toLocaleDateString("pt-BR");
}

function calFinSemana(v){
  return ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][new Date(v + "T00:00:00").getDay()];
}

function calFinParams(){
  return {
    empresa: document.getElementById("empresa")?.value || "",
    dataIni: document.getElementById("dataIni")?.value || "",
    dataFim: document.getElementById("dataFim")?.value || "",
    fornecedor: document.getElementById("filtroFornecedorFluxo")?.value || "",
    plano: document.getElementById("filtroPlanoFluxo")?.value || ""
  };
}
function renderMesesCalendarioFinanceiro(){
  const el = document.getElementById("calMeses");
  if(!el) return;

  const { dataIni, dataFim } = calFinParams();

  if(!dataIni || !dataFim){
    el.innerHTML = "";
    return;
  }

  const ini = new Date(dataIni + "T00:00:00");
  const fim = new Date(dataFim + "T00:00:00");

  const meses = [];
  let cursor = new Date(ini.getFullYear(), ini.getMonth(), 1);

  while(cursor <= fim){
    const ano = cursor.getFullYear();
    const mes = cursor.getMonth() + 1;
    const chave = `${ano}-${String(mes).padStart(2,"0")}`;

    meses.push({
      chave,
      texto: `${String(mes).padStart(2,"0")}/${String(ano).slice(-2)}`
    });

    cursor = new Date(ano, mes, 1);
  }

  el.innerHTML = meses.map(x => {
    const ativo = CAL_FIN_MESES.has(x.chave);

    return `
      <button
        type="button"
        onclick="selecionarMesCalendarioFinanceiro(event, '${x.chave}')"
        style="
          background:${ativo ? "#1d4ed8" : "#0f172a"};
          color:#fff;
          border:1px solid ${ativo ? "#60a5fa" : "#334155"};
          border-radius:12px;
          padding:10px 14px;
          font-weight:900;
          cursor:pointer;
        "
      >
        ${x.texto}
      </button>
    `;
  }).join("");
}
function selecionarMesCalendarioFinanceiro(ev, chave){
  CAL_FIN_SELECAO_MANUAL = true;
  const todosMeses = new Set(
    CAL_FIN_DIAS.map(x => String(x.data || "").slice(0,7)).filter(Boolean)
  );

  const estavaSoEsse =
    CAL_FIN_MESES.size === 1 &&
    CAL_FIN_MESES.has(chave);

  if(ev && ev.ctrlKey){
    if(CAL_FIN_MESES.has(chave)){
      CAL_FIN_MESES.delete(chave);
    }else{
      CAL_FIN_MESES.add(chave);
    }

    if(!CAL_FIN_MESES.size){
      CAL_FIN_MESES = todosMeses;
    }

  }else{
    if(estavaSoEsse){
      CAL_FIN_MESES = todosMeses;
    }else{
      CAL_FIN_MESES = new Set([chave]);
    }
  }

  aplicarFiltroMesCalendarioFinanceiro();
}
async function aplicarFiltroMesCalendarioFinanceiro(){
  const todosMeses = new Set(
    CAL_FIN_DIAS.map(x => String(x.data || "").slice(0,7)).filter(Boolean)
  );

  const mesesAtivos = CAL_FIN_MESES.size ? CAL_FIN_MESES : todosMeses;

  CAL_FIN_DATAS = new Set(
    CAL_FIN_DIAS
      .filter(x => mesesAtivos.has(String(x.data || "").slice(0,7)))
      .map(x => String(x.data || "").slice(0,10))
      .filter(Boolean)
  );

  renderMesesCalendarioFinanceiro();
  renderDiasCalendarioFinanceiro();

  if(CAL_FIN_DATAS.size){
    await carregarDetalheCalendarioFinanceiro();
  }else{
    limparResumoCalendarioFinanceiro();
  }
}
async function carregarCalendarioFinanceiro(){
  const { empresa, dataIni, dataFim, fornecedor, plano } = calFinParams();

  if(!dataIni || !dataFim) return;
const url =
  `/api/financeiro/fluxo-calendario-pagar` +
  `?empresa=${encodeURIComponent(empresa)}` +
  `&dataIni=${dataIni}` +
  `&dataFim=${dataFim}` +
  `&fornecedor=${encodeURIComponent(fornecedor || "")}` +
  `&plano=${encodeURIComponent(plano || "")}`; 
 const r = await fetch(url);
  const d = await r.json();

  if(!d.ok){
    alert(d.erro || "Erro ao carregar calendário financeiro.");
    return;
  }

  CAL_FIN_DIAS = d.dias || [];
  CAL_FIN_TITULOS = [];

if(!CAL_FIN_SELECAO_MANUAL){
  CAL_FIN_DATAS = new Set(
    CAL_FIN_DIAS.map(x => String(x.data || "").slice(0,10)).filter(Boolean)
  );

  CAL_FIN_MESES = new Set(
    CAL_FIN_DIAS.map(x => String(x.data || "").slice(0,7)).filter(Boolean)
  );
}
renderMesesCalendarioFinanceiro();
renderDiasCalendarioFinanceiro();
if(!CAL_FIN_SELECAO_MANUAL){
  limparResumoCalendarioFinanceiro();
}
}

function renderDiasCalendarioFinanceiro(){
  const el = document.getElementById("calDias");
  if(!el) return;

  const diasVisiveis = (CAL_FIN_DIAS || []).filter(x => {
    const mes = String(x.data || "").slice(0,7);

    if(!CAL_FIN_MESES.size) return true;

    return CAL_FIN_MESES.has(mes);
  });

  if(!diasVisiveis.length){
    el.innerHTML = `<div class="empty" style="grid-column:1/-1;">Sem contas a pagar no período selecionado.</div>`;
    return;
  }

  el.innerHTML = diasVisiveis.map(x => {
    const data = String(x.data || "").slice(0,10);
    const ativo = CAL_FIN_DATAS.has(data);

    return `
      <button
        type="button"
        onclick="clicarDiaCalendarioFinanceiro(event, '${data}')"
        style="
          background:${ativo ? "#1d4ed8" : "#0f172a"};
          color:#fff;
          border:1px solid ${ativo ? "#60a5fa" : "#1e293b"};
          border-radius:14px;
          padding:12px;
          text-align:left;
          cursor:pointer;
          min-height:100px;
        "
      >
        <div style="font-weight:900;">${calFinDataBR(data)} ${calFinSemana(data)}</div>
        <div style="font-size:19px;font-weight:900;margin-top:8px;color:#93c5fd;">
          ${calFinMoeda(x.total)}
        </div>
        <div style="font-size:12px;color:#cbd5e1;margin-top:6px;">
          ${x.qtdTitulos || 0} título(s)
        </div>
      </button>
    `;
  }).join("");
}
async function clicarDiaCalendarioFinanceiro(ev, data){
  if(ev && ev.ctrlKey){
    if(CAL_FIN_DATAS.has(data)){
      CAL_FIN_DATAS.delete(data);
    }else{
      CAL_FIN_DATAS.add(data);
    }
  }else{
    CAL_FIN_DATAS = new Set([data]);
  }

  renderDiasCalendarioFinanceiro();
  await carregarDetalheCalendarioFinanceiro();
}

async function selecionarTodosDiasMeses(){
  CAL_FIN_SELECAO_MANUAL = true;

  CAL_FIN_MESES = new Set(
    CAL_FIN_DIAS
      .map(x => String(x.data || "").slice(0,7))
      .filter(Boolean)
  );

  CAL_FIN_DATAS = new Set(
    CAL_FIN_DIAS
      .map(x => String(x.data || "").slice(0,10))
      .filter(Boolean)
  );

  renderMesesCalendarioFinanceiro();
  renderDiasCalendarioFinanceiro();

  await carregarDetalheCalendarioFinanceiro();
}
async function carregarDetalheCalendarioFinanceiro(){
  const empresa = document.getElementById("empresa")?.value || "";
  const fornecedor = document.getElementById("filtroFornecedorFluxo")?.value || "";
  const plano = document.getElementById("filtroPlanoFluxo")?.value || "";
  const datas = [...CAL_FIN_DATAS];

  if(!datas.length){
    limparResumoCalendarioFinanceiro();
    return;
  }

  const r = await fetch("/api/financeiro/fluxo-calendario-pagar-detalhe", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ empresa, datas, fornecedor, plano })
  });

  const d = await r.json();

  if(!d.ok){
    alert(d.erro || "Erro ao carregar detalhe do calendário.");
    return;
  }

  CAL_FIN_TITULOS = d.titulos || [];
  CAL_FIN_TITULOS_FILTRADOS = CAL_FIN_TITULOS;

  renderGraficoCalendarioFinanceiro("grafFornecedor", d.porFornecedor || [], "fornecedor");
  renderGraficoCalendarioFinanceiro("grafPlano", d.porPlano || [], "plano");
  renderTitulosCalendarioFinanceiro(CAL_FIN_TITULOS);
}

function agruparCalendario(lista, campo){
  const mapa = {};

  (lista || []).forEach(x => {
    const nome = x[campo] || "-";
    mapa[nome] ||= { nome, valor:0, qtd:0 };
    mapa[nome].valor += Number(x.valor || 0);
    mapa[nome].qtd += 1;
  });

  return Object.values(mapa).sort((a,b) => b.valor - a.valor);
}

function renderGraficoCalendarioFinanceiro(id, dados, campo){
  const el = document.getElementById(id);
  if(!el) return;

  const lista = (dados || []).slice(0, 20);
  const maior = Math.max(...lista.map(x => Number(x.valor || 0)), 1);

  if(!lista.length){
    el.innerHTML = `<div class="empty">Sem dados.</div>`;
    return;
  }

  el.innerHTML = lista.map(x => {
    const nome = String(x.nome || "-");
    const pct = (Number(x.valor || 0) / maior) * 100;
    const nomeSeguro = encodeURIComponent(nome);

    return `
      <div onclick="filtrarTitulosCalendarioFinanceiro('${campo}', '${nomeSeguro}')"
        style="cursor:pointer;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <strong style="max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(nome)}</strong>
          <strong>${calFinMoeda(x.valor)}</strong>
        </div>
        <div style="height:15px;background:#111827;border-radius:999px;overflow:hidden;margin-top:5px;">
          <div style="height:100%;width:${Math.max(pct,1)}%;background:#3b82f6;"></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-top:3px;">
          ${x.qtd || 0} título(s)
        </div>
      </div>
    `;
  }).join("");
}

function filtrarTitulosCalendarioFinanceiro(campo, nomeEnc){
  const nome = decodeURIComponent(nomeEnc || "");

  const lista = CAL_FIN_TITULOS_FILTRADOS.filter(x =>
    String(x[campo] || "") === nome
  );

  renderTitulosCalendarioFinanceiro(lista);
}

function renderTitulosCalendarioFinanceiro(lista){
  const el = document.getElementById("tbodyCalendarioFinanceiro");
  if(!el) return;

  if(!Array.isArray(lista) || !lista.length){
    el.innerHTML = `<tr><td colspan="6" class="empty">Sem títulos.</td></tr>`;
    return;
  }

  el.innerHTML = lista.map(x => `
    <tr>
      <td>${calFinDataBR(String(x.data || "").slice(0,10))}</td>
      <td>${esc(x.empresa || "-")}</td>
      <td>${esc(x.fornecedor || "-")}</td>
      <td>${esc(x.plano || "-")}</td>
      <td>${esc(x.documento || "-")}</td>
      <td class="num">${calFinMoeda(x.valor)}</td>
    </tr>
  `).join("");
}

function limparResumoCalendarioFinanceiro(){
  document.getElementById("grafFornecedor").innerHTML = `<div class="empty">Selecione um dia.</div>`;
  document.getElementById("grafPlano").innerHTML = `<div class="empty">Selecione um dia.</div>`;
  document.getElementById("tbodyCalendarioFinanceiro").innerHTML =
    `<tr><td colspan="6" class="empty">Selecione um mês ou dia.</td></tr>`;
}
function valorAP(x){

  const status =
    document.getElementById("apFiltroStatus")?.value || "B";

  if(status === "B"){
    return Number(x.valorPago || 0);
  }

  if(status === "A"){
    return Number(x.valorAberto || 0);
  }

  return Number(x.valorPago || 0)
       + Number(x.valorAberto || 0);
}
function campoAP(x, campo){
  if(campo === "empresa") return String(x.empresa || "-");
  if(campo === "pessoa") return String(x.pessoa || x.fornecedor || x.cliente || "-");
  if(campo === "descricao") return String(x.descricao || x.planoConta || x.plano_conta || "-");
  if(campo === "plano") return String(x.planoConta || x.plano_conta || x.descricao || "-");
  if(campo === "forma") return String(x.forma || x.tipo || x.formaPagamento || x.forma_pagamento || "-");
  if(campo === "contaBanco") return String(x.contaBanco || x.conta_banco || "SEM CONTA/BANCO");
  return "-";
}

function agruparAP(lista, campo){
  const mapa = {};

  (lista || []).forEach(x => {
    const nome = campoAP(x, campo);
    mapa[nome] ||= { nome, valor:0, qtd:0 };
    mapa[nome].valor += valorAP(x);
    mapa[nome].qtd += 1;
  });

  return Object.values(mapa)
    .sort((a,b) => b.valor - a.valor)
    .slice(0, 20);
}

function renderGraficosAtivoPassivo(){
  renderMiniGraficoAP("grafAtivoPessoa", AP_DETALHE_ATIVO, "pessoa", "ATIVO");
  renderMiniGraficoAP("grafAtivoEmpresa", AP_DETALHE_ATIVO, "empresa", "ATIVO");
  renderMiniGraficoAP("grafAtivoForma", AP_DETALHE_ATIVO, "forma", "ATIVO");
  renderMiniGraficoAP("grafAtivoContaBanco", AP_DETALHE_ATIVO, "contaBanco", "ATIVO");
  renderMiniGraficoAP("grafAtivoDescricao", AP_DETALHE_ATIVO, "descricao", "ATIVO");

  renderMiniGraficoAP("grafPassivoPlano", AP_DETALHE_PASSIVO, "plano", "PASSIVO");
  renderMiniGraficoAP("grafPassivoPessoa", AP_DETALHE_PASSIVO, "pessoa", "PASSIVO");
  renderMiniGraficoAP("grafPassivoEmpresa", AP_DETALHE_PASSIVO, "empresa", "PASSIVO");
  renderMiniGraficoAP("grafPassivoForma", AP_DETALHE_PASSIVO, "forma", "PASSIVO");
  renderMiniGraficoAP("grafPassivoContaBanco", AP_DETALHE_PASSIVO, "contaBanco", "PASSIVO");
}

function campoAP(x, campo){
  if(campo === "pessoa") return String(x.pessoa || "SEM PESSOA");
  if(campo === "empresa") return String(x.empresa || "SEM EMPRESA");
  if(campo === "forma") return String(x.forma || x.tipo || "SEM FORMA");
  if(campo === "descricao") return String(x.descricao || "SEM DESCRIÇÃO");
  if(campo === "plano") return String(x.planoConta || "SEM PLANO");
  if(campo === "contaBanco") return String(x.contaBanco || x.conta_banco || "SEM CONTA/BANCO");

  return String(x[campo] || "-");
}

function renderMiniGraficoAP(id, lista, campo, lado){
  const el = document.getElementById(id);
  if(!el) return;

  lista = Array.isArray(lista) ? lista : [];

  const dados = agruparAP(lista, campo);
  const maior = Math.max(...dados.map(x => Math.abs(Number(x.valor || 0))), 1);
  const cor = lado === "ATIVO" ? "#22c55e" : "#ef4444";

  if(!dados.length){
    el.innerHTML = `<div class="empty">Sem dados.</div>`;
    return;
  }

  el.innerHTML = dados.map(x => {
    const pct = (Math.abs(Number(x.valor || 0)) / maior) * 100;
    const nomeSeguro = encodeURIComponent(String(x.nome || ""));

    return `
      <div class="ap-barra" onclick="filtrarGraficoAtivoPassivo('${lado}', '${campo}', '${nomeSeguro}')">
        <div class="ap-barra-top">
          <span class="ap-barra-nome">${esc(x.nome)}</span>
          <span class="ap-barra-valor">${fmtMoeda(x.valor)}</span>
        </div>
        <div class="ap-barra-track">
          <div class="ap-barra-fill" style="width:${Math.max(pct,1)}%;background:${cor};"></div>
        </div>
        <div class="ap-barra-sub">${x.qtd} lançamento(s)</div>
      </div>
    `;
  }).join("");
}

function filtrarGraficoAtivoPassivo(lado, campo, nomeEnc){
  const nome = decodeURIComponent(nomeEnc || "");

  if(lado === "ATIVO"){
    AP_FILTRO_GRAFICO_ATIVO = { campo, nome };
  }

  if(lado === "PASSIVO"){
    AP_FILTRO_GRAFICO_PASSIVO = { campo, nome };
  }

  aplicarFiltrosGraficosAtivoPassivo();
}

function aplicarFiltrosGraficosAtivoPassivo(){
  let ativo = [...(AP_DETALHE_ATIVO || [])];
  let passivo = [...(AP_DETALHE_PASSIVO || [])];

  if(AP_FILTRO_GRAFICO_ATIVO){
    ativo = ativo.filter(x =>
      campoAP(x, AP_FILTRO_GRAFICO_ATIVO.campo) === AP_FILTRO_GRAFICO_ATIVO.nome
    );
  }

  if(AP_FILTRO_GRAFICO_PASSIVO){
    passivo = passivo.filter(x =>
      campoAP(x, AP_FILTRO_GRAFICO_PASSIVO.campo) === AP_FILTRO_GRAFICO_PASSIVO.nome
    );
  }

  document.getElementById("apTbodyAtivo").innerHTML =
    renderResumoAPPorDetalhe(ativo, "ATIVO");

  document.getElementById("apTbodyPassivo").innerHTML =
    renderResumoAPPorDetalhe(passivo, "PASSIVO");

  renderDetalheAtivoPassivoFiltrado(ativo, passivo);

  renderMiniGraficoAP("grafAtivoPessoa", ativo, "pessoa", "ATIVO");
  renderMiniGraficoAP("grafAtivoEmpresa", ativo, "empresa", "ATIVO");
  renderMiniGraficoAP("grafAtivoForma", ativo, "forma", "ATIVO");
  renderMiniGraficoAP("grafAtivoContaBanco", ativo, "contaBanco", "ATIVO");
  renderMiniGraficoAP("grafAtivoDescricao", ativo, "descricao", "ATIVO");

  renderMiniGraficoAP("grafPassivoPlano", passivo, "plano", "PASSIVO");
  renderMiniGraficoAP("grafPassivoPessoa", passivo, "pessoa", "PASSIVO");
  renderMiniGraficoAP("grafPassivoEmpresa", passivo, "empresa", "PASSIVO");
  renderMiniGraficoAP("grafPassivoForma", passivo, "forma", "PASSIVO");
  renderMiniGraficoAP("grafPassivoContaBanco", passivo, "contaBanco", "PASSIVO");
}

function limparFiltroGraficoAtivoPassivo(){
  AP_FILTRO_GRAFICO_ATIVO = null;
  AP_FILTRO_GRAFICO_PASSIVO = null;

  aplicarFiltrosGraficosAtivoPassivo();
}
function valorAPResumo(x){
  const status = document.getElementById("apFiltroStatus")?.value || "B";

  if(status === "B") return Number(x.valorPago || 0);
  if(status === "A") return Number(x.valorAberto || 0);

  return Number(x.valorPago || 0) + Number(x.valorAberto || 0);
}

function renderResumoAPPorDetalhe(lista, lado){
  lista = Array.isArray(lista) ? lista : [];

  if(!lista.length){
    return `<tr><td colspan="4" class="empty">Sem dados no ${lado === "ATIVO" ? "ativo" : "passivo"}.</td></tr>`;
  }

  const mapa = new Map();

  lista.forEach(x => {
    const situacao = x.situacao || "-";
    const origem = lado === "ATIVO"
      ? (situacao === "Realizado" ? "Recebimentos baixados" : "Contas a receber")
      : (situacao === "Realizado" ? "Pagamentos / saídas baixadas" : "Contas a pagar / saídas abertas");

    const chave = origem + "|" + situacao;
    const atual = mapa.get(chave) || { origem, situacao, qtd:0, valor:0 };

    atual.qtd += 1;
    atual.valor += valorAPResumo(x);

    mapa.set(chave, atual);
  });

  return Array.from(mapa.values()).map(x => `
    <tr>
      <td>${esc(x.origem)}</td>
      <td>${esc(x.situacao)}</td>
      <td class="num">${fmtNumero(x.qtd)}</td>
      <td class="num">${fmtMoeda(x.valor)}</td>
    </tr>
  `).join("");
}

function renderDetalheAtivoPassivoFiltrado(ativo, passivo){
  const tbAtivo = document.getElementById("apTbodyDetalheAtivo");
  const tbPassivo = document.getElementById("apTbodyDetalhePassivo");

  ativo = Array.isArray(ativo) ? ativo : [];
  passivo = Array.isArray(passivo) ? passivo : [];

  if(tbAtivo){
    tbAtivo.innerHTML = ativo.length
      ? ativo.map(x => `
        <tr>
          <td>${esc(x.empresa || "-")}</td>
          <td>${esc(x.pessoa || "-")}</td>
          <td>${esc(x.documento || "-")}</td>
          <td>${esc(x.descricao || "-")}</td>
          <td>${esc(x.forma || "-")}</td>
          <td>${esc(x.situacao || "-")}</td>
          <td>${esc(fmtData(x.lancamento))}</td>
          <td>${esc(fmtData(x.vencimento))}</td>
          <td>${esc(fmtData(x.pagamento))}</td>
          <td class="num">${fmtMoeda(x.valor || 0)}</td>
          <td class="num">${fmtMoeda(x.valorPago || 0)}</td>
          <td class="num">${fmtMoeda(x.valorAberto || 0)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="12" class="empty">Sem detalhes no ativo.</td></tr>`;
  }

  if(tbPassivo){
    tbPassivo.innerHTML = passivo.length
      ? passivo.map(x => `
        <tr>
          <td>${esc(x.empresa || "-")}</td>
          <td>${esc(x.pessoa || "-")}</td>
          <td>${esc(x.documento || "-")}</td>
          <td>${esc(x.descricao || "-")}</td>
          <td>${esc(x.planoConta || "-")}</td>
          <td>${esc(x.tipo || "-")}</td>
          <td>${esc(x.situacao || "-")}</td>
          <td>${esc(fmtData(x.lancamento))}</td>
          <td>${esc(fmtData(x.vencimento))}</td>
          <td>${esc(fmtData(x.pagamento))}</td>
          <td class="num">${fmtMoeda(x.valor || 0)}</td>
          <td class="num">${fmtMoeda(x.valorPago || 0)}</td>
          <td class="num">${fmtMoeda(x.valorAberto || 0)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="13" class="empty">Sem detalhes no passivo.</td></tr>`;
  }

  const totAtivoValor = ativo.reduce((s,x)=>s+Number(x.valor||0),0);
  const totAtivoPago = ativo.reduce((s,x)=>s+Number(x.valorPago||0),0);
  const totAtivoAberto = ativo.reduce((s,x)=>s+Number(x.valorAberto||0),0);

  const totPassivoValor = passivo.reduce((s,x)=>s+Number(x.valor||0),0);
  const totPassivoPago = passivo.reduce((s,x)=>s+Number(x.valorPago||0),0);
  const totPassivoAberto = passivo.reduce((s,x)=>s+Number(x.valorAberto||0),0);

  const e1 = document.getElementById("apTotValorAtivo");
  const e2 = document.getElementById("apTotPagoAtivo");
  const e3 = document.getElementById("apTotAbertoAtivo");

  if(e1) e1.innerText = fmtMoeda(totAtivoValor);
  if(e2) e2.innerText = fmtMoeda(totAtivoPago);
  if(e3) e3.innerText = fmtMoeda(totAtivoAberto);

  const p1 = document.getElementById("apTotValorPassivo");
  const p2 = document.getElementById("apTotPagoPassivo");
  const p3 = document.getElementById("apTotAbertoPassivo");

  if(p1) p1.innerText = fmtMoeda(totPassivoValor);
  if(p2) p2.innerText = fmtMoeda(totPassivoPago);
  if(p3) p3.innerText = fmtMoeda(totPassivoAberto);

  const b1 = document.getElementById("apBoxValorAtivo");
  const b2 = document.getElementById("apBoxPagoAtivo");
  const b3 = document.getElementById("apBoxAbertoAtivo");

  if(b1) b1.innerText = fmtMoeda(totAtivoValor);
  if(b2) b2.innerText = fmtMoeda(totAtivoPago);
  if(b3) b3.innerText = fmtMoeda(totAtivoAberto);

  const bp1 = document.getElementById("apBoxValorPassivo");
  const bp2 = document.getElementById("apBoxPagoPassivo");
  const bp3 = document.getElementById("apBoxAbertoPassivo");

  if(bp1) bp1.innerText = fmtMoeda(totPassivoValor);
  if(bp2) bp2.innerText = fmtMoeda(totPassivoPago);
  if(bp3) bp3.innerText = fmtMoeda(totPassivoAberto);
}


// =====================================================
// CENTRAL DE RENTABILIDADE / LUCRO BRUTO
// =====================================================
let rentabilidadeRequestId = 0;
let RENT_DADOS = { resumo:{}, empresas:[], produtos:[], marcas:[], grupos:[], formas:[] };
let RENT_FILTRO_MARGEM = "";
let RENT_FILTRO_VISAO = null;
let RENT_ORDENACAO = { campo:"lucroBruto", direcao:"desc" };
let RENT_CACHE_CHAVE = "";
let RENT_CACHE_CARREGADO = false;
let RENT_CACHE_CARREGADO_EM = 0;

function rentMargemClasse(v){
  const n = Number(v || 0);
  if (n >= 35) return "boa";
  if (n >= 20) return "atencao";
  return "baixa";
}

function rentFiltroMargemAceita(x){
  if(!RENT_FILTRO_MARGEM) return true;
  return rentMargemClasse(x?.margemPct) === RENT_FILTRO_MARGEM;
}

function rentResumoDeProdutos(produtos){
  const resumo = (produtos || []).reduce((acc,x)=>{
    acc.qtdVendida += Number(x.qtdVendida || 0);
    acc.valorVendido += Number(x.valorVendido || 0);
    acc.custoTotal += Number(x.custoTotal || 0);
    acc.lucroBruto += Number(x.lucroBruto || 0);
    return acc;
  }, {qtdVendida:0,valorVendido:0,custoTotal:0,lucroBruto:0});
  resumo.margemPct = resumo.valorVendido !== 0 ? (resumo.lucroBruto / resumo.valorVendido) * 100 : 0;
  resumo.lucroPeca = resumo.qtdVendida !== 0 ? resumo.lucroBruto / resumo.qtdVendida : 0;
  return resumo;
}

function rentAgrupar(produtos, campo){
  const mapa = new Map();
  for(const x of produtos || []){
    const nome = String(x[campo] || `SEM ${String(campo).toUpperCase()}`);
    if(!mapa.has(nome)) mapa.set(nome,{nome,qtdVendida:0,valorVendido:0,custoTotal:0,lucroBruto:0});
    const a=mapa.get(nome);
    a.qtdVendida += Number(x.qtdVendida||0);
    a.valorVendido += Number(x.valorVendido||0);
    a.custoTotal += Number(x.custoTotal||0);
    a.lucroBruto += Number(x.lucroBruto||0);
  }
  return [...mapa.values()].map(a=>({
    ...a,
    margemPct:a.valorVendido!==0 ? (a.lucroBruto/a.valorVendido)*100 : 0,
    lucroPeca:a.qtdVendida!==0 ? a.lucroBruto/a.qtdVendida : 0
  })).sort((a,b)=>b.lucroBruto-a.lucroBruto);
}

function rentEmpresasDeProdutos(produtos){
  const mapa = new Map();
  for(const x of produtos || []){
    const nome=String(x.empresa||"-");
    if(!mapa.has(nome)) mapa.set(nome,{empresa:nome,empresaNome:String(x.empresaNome||""),qtdVendida:0,valorVendido:0,custoTotal:0,lucroBruto:0});
    const a=mapa.get(nome);
    a.qtdVendida+=Number(x.qtdVendida||0);
    a.valorVendido+=Number(x.valorVendido||0);
    a.custoTotal+=Number(x.custoTotal||0);
    a.lucroBruto+=Number(x.lucroBruto||0);
  }
  return [...mapa.values()].map(a=>({
    ...a,
    margemPct:a.valorVendido!==0?(a.lucroBruto/a.valorVendido)*100:0,
    lucroPeca:a.qtdVendida!==0?a.lucroBruto/a.qtdVendida:0
  })).sort((a,b)=>b.lucroBruto-a.lucroBruto);
}

function atualizarIndicadorRentabilidade(){
  const el=document.getElementById("rentFiltroAtivo");
  if(!el) return;
  const partes=[];
  const empresa=(els.empresa?.value||"").trim();
  const marca=(document.getElementById("rentMarca")?.value||"").trim();
  const dep=(document.getElementById("rentDepartamento")?.value||"").trim();
  const grupo=(document.getElementById("rentGrupo")?.value||"").trim();
  const sub=(document.getElementById("rentSubgrupo")?.value||"").trim();
  const busca=(document.getElementById("rentBusca")?.value||"").trim();
  const forma=(document.getElementById("rentFormaPagamento")?.value||"").trim();
  if(empresa) partes.push(`Empresa: ${empresa}`);
  if(marca) partes.push(`Marca: ${marca}`);
  if(dep) partes.push(`Departamento: ${dep}`);
  if(grupo) partes.push(`Grupo: ${grupo}`);
  if(sub) partes.push(`Subgrupo: ${sub}`);
  if(busca) partes.push(`Produto/cliente: ${busca}`);
  if(forma) partes.push(`Pagamento: ${forma}`);
  if(RENT_FILTRO_MARGEM) partes.push(`Margem: ${RENT_FILTRO_MARGEM === 'boa' ? '≥ 35%' : RENT_FILTRO_MARGEM === 'atencao' ? '20% a 34,99%' : '< 20%'}`);
  if(RENT_FILTRO_VISAO) partes.push(`${rentRotuloVisao(RENT_FILTRO_VISAO.campo)}: ${RENT_FILTRO_VISAO.nome}`);
  partes.push(`Ordem tabela: ${RENT_ORDENACAO.campo} ${RENT_ORDENACAO.direcao === 'desc' ? '↓' : '↑'}`);
  el.textContent = `Filtro ativo · ${partes.join(" · ")}`;
}

function rentRotuloVisao(campo){
  return ({empresa:'Empresa',cliente:'Cliente',fornecedor:'Fornecedor',complemento:'Complemento',campanha:'Campanha',marca:'Marca',departamento:'Departamento',grupo:'Grupo',subgrupo:'Subgrupo',linha:'Linha',cor:'Cor',numeracao:'Numeração',precoVenda:'Preço de Venda'})[campo] || campo;
}

function rentNomeVisao(x,campo){
  if(campo === 'precoVenda') return fmtMoeda(x?.precoVenda || 0);
  return String(x?.[campo] || `SEM ${rentRotuloVisao(campo).toUpperCase()}`);
}

function rentAgruparVisao(produtos,campo){
  const mapa=new Map();
  for(const x of produtos||[]){
    const nome=rentNomeVisao(x,campo);
    if(!mapa.has(nome)) mapa.set(nome,{nome,qtdVendida:0,valorVendido:0,custoTotal:0,lucroBruto:0});
    const a=mapa.get(nome);
    a.qtdVendida+=Number(x.qtdVendida||0);
    a.valorVendido+=Number(x.valorVendido||0);
    a.custoTotal+=Number(x.custoTotal||0);
    a.lucroBruto+=Number(x.lucroBruto||0);
  }
  return [...mapa.values()].map(a=>({...a,
    margemPct:a.valorVendido!==0?(a.lucroBruto/a.valorVendido)*100:0,
    lucroPeca:a.qtdVendida!==0?a.lucroBruto/a.qtdVendida:0
  }));
}

function renderRentRankingMarcas(lista,campo,metrica){
  const el=document.getElementById("rentRankingMarcas");
  if(!el) return;
  const dados=(Array.isArray(lista)?lista:[]).slice(0,18);
  const subt=document.getElementById('rentVisaoSubtitulo');
  if(subt) subt.textContent=`Ranking por ${rentRotuloVisao(campo).toLowerCase()} · clique em uma barra para filtrar toda a análise.`;
  if(!dados.length){el.innerHTML='<div class="empty">Sem dados no período.</div>';return;}
  const valorMetrica=x=>metrica==='margemPct'?Math.abs(Number(x.margemPct||0)):Math.abs(Number(x[metrica]||0));
  const maior=Math.max(...dados.map(valorMetrica),1);
  el.innerHTML=dados.map(x=>{
    const pct=Math.max(1,valorMetrica(x)/maior*100);
    const nome=String(x.nome||'-');
    const ativo=RENT_FILTRO_VISAO && RENT_FILTRO_VISAO.campo===campo && RENT_FILTRO_VISAO.nome===nome;
    const principal=metrica==='margemPct'?fmtPct(x.margemPct||0):metrica==='qtdVendida'?fmtNumero(x.qtdVendida||0):fmtMoeda(x[metrica]||0);
    return `<button type="button" class="rent-rank-row rent-rank-button ${ativo?'rent-selected':''}" onclick="filtrarRentabilidadeVisao('${campo}','${encodeURIComponent(nome)}')" title="Clique para filtrar por ${esc(rentRotuloVisao(campo))}: ${esc(nome)}">
      <div class="rent-rank-head"><strong>${esc(nome)}</strong><span>${principal}</span></div>
      <div class="rent-rank-track"><div class="rent-rank-fill" style="width:${pct}%"></div></div>
      <div class="rent-rank-sub">Lucro ${fmtMoeda(x.lucroBruto||0)} · Vendas ${fmtMoeda(x.valorVendido||0)} · Margem ${fmtPct(x.margemPct||0)}</div>
    </button>`;
  }).join('');
}

function rentFormasDeProdutos(produtos){
  const mapa=new Map();

  for(const x of (produtos||[])){
    const detalhes=Array.isArray(x.formasPagamentoDetalhes)
      ? x.formasPagamentoDetalhes
      : [];

    if(detalhes.length){
      for(const fp of detalhes){
        const forma=String(fp?.forma||"Outros").trim()||"Outros";
        if(!mapa.has(forma)){
          mapa.set(forma,{forma,valor:0,vendas:new Set()});
        }
        const item=mapa.get(forma);
        item.valor+=Number(fp?.valor||0);

        const venda=String(x.auxiliarVenda||x.venda||"").trim();
        if(venda) item.vendas.add(venda);
      }
    }else{
      // Compatibilidade com dados antigos em cache.
      const formas=String(x.formasPagamento||"Não identificado")
        .split(" + ").map(v=>v.trim()).filter(Boolean);

      for(const forma of formas){
        if(!mapa.has(forma)){
          mapa.set(forma,{forma,valor:0,vendas:new Set()});
        }
        const item=mapa.get(forma);
        // Fallback apenas quando o backend antigo não trouxe detalhes.
        item.valor+=Number(x.valorVendido||0)/(formas.length||1);
        const venda=String(x.auxiliarVenda||x.venda||"").trim();
        if(venda) item.vendas.add(venda);
      }
    }
  }

  const lista=[...mapa.values()].map(x=>({
    forma:x.forma,
    valor:x.valor,
    qtdTitulos:x.vendas.size
  })).sort((a,b)=>b.valor-a.valor);

  const total=lista.reduce((s,x)=>s+Number(x.valor||0),0);
  return lista.map(x=>({
    ...x,
    percentual:total>0?(Number(x.valor||0)/total)*100:0
  }));
}

function renderRentFormas(lista){
  const el=document.getElementById("rentFormasPagamento");
  const select=document.getElementById("rentFormaPagamento");
  const dados=Array.isArray(lista)?lista:[];
  const selecionada=(select?.value||"").trim();

  if(select){
    const opcoes=['<option value="">Todas as formas</option>'].concat(
      dados.map(x=>`<option value="${esc(x.forma||'Outros')}">${esc(x.forma||'Outros')}</option>`)
    );
    select.innerHTML=opcoes.join('');
    select.value=selecionada;
  }

  if(!el) return;
  if(!dados.length){
    el.innerHTML='<div class="empty">Sem formas de pagamento identificadas no período.</div>';
    return;
  }

  el.innerHTML=dados.map(x=>{
    const nome=String(x.forma||'Outros');
    const ativo=selecionada===nome;
    return `
      <button type="button" class="rent-forma-card ${ativo?'rent-selected':''}" onclick="filtrarRentabilidadeForma('${encodeURIComponent(nome)}')" title="Clique para filtrar vendas que utilizaram ${esc(nome)}">
        <span class="rent-forma-nome">${esc(nome)}</span>
        <strong>${fmtMoeda(x.valor||0)}</strong>
        <small>${fmtPct(x.percentual||0)} do recebido · ${fmtNumero(x.qtdTitulos||0)} venda(s)</small>
      </button>`;
  }).join('');
}

function renderRentEmpresas(lista){
  const el = document.getElementById("rentEmpresasTbody");
  if(!el) return;
  const dados = Array.isArray(lista) ? lista : [];
  el.innerHTML = dados.length ? dados.map(x => `
    <tr class="rent-click-row" onclick="filtrarRentabilidadeEmpresa('${encodeURIComponent(String(x.empresa||''))}')" title="Clique para filtrar pela empresa ${esc(x.empresa||'-')}">
      <td><strong>${esc(x.empresa || "-")}</strong></td>
      <td class="num">${fmtNumero(x.qtdVendida || 0)}</td>
      <td class="num">${fmtMoeda(x.valorVendido || 0)}</td>
      <td class="num">${fmtMoeda(x.custoTotal || 0)}</td>
      <td class="num rent-lucro ${Number(x.lucroBruto || 0) < 0 ? 'negativo' : ''}">${fmtMoeda(x.lucroBruto || 0)}</td>
      <td class="num"><span class="rent-pill ${rentMargemClasse(x.margemPct)}">${fmtPct(x.margemPct || 0)}</span></td>
      <td class="num">${fmtMoeda(x.lucroPeca || 0)}</td>
    </tr>`).join("") : `<tr><td colspan="7" class="empty">Sem vendas no período.</td></tr>`;
}

function renderRentProdutos(lista){
  const el=document.getElementById("rentProdutosTbody");
  if(!el) return;
  const dados=Array.isArray(lista)?lista:[];
  el.innerHTML=dados.length?dados.map(x=>`<tr>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeVisao('empresa','${encodeURIComponent(String(x.empresa||''))}')">${esc(x.empresa||'-')}</td>
    <td>${fmtData(x.dataVenda)}</td>
    <td><strong>${esc(x.clienteCodigo||'-')}</strong></td>
    <td class="rent-cell-link rent-cliente" onclick="filtrarRentabilidadeVisao('cliente','${encodeURIComponent(String(x.cliente||''))}')" title="${esc(x.cliente||'')}"><strong>${esc(x.cliente||'CONSUMIDOR / NÃO IDENTIFICADO')}</strong></td>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeProduto('${encodeURIComponent(String(x.produto||''))}')"><strong>${esc(x.produto||'-')}</strong></td>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeVisao('numeracao','${encodeURIComponent(String(x.numeracao||''))}')">${esc(x.numeracao||'-')}</td>
    <td title="${esc(x.descricao||'')}">${esc(x.descricao||'-')}</td>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeVisao('marca','${encodeURIComponent(String(x.marca||''))}')">${esc(x.marca||'-')}</td>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeVisao('grupo','${encodeURIComponent(String(x.grupo||''))}')">${esc(x.grupo||'-')}</td>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeVisao('subgrupo','${encodeURIComponent(String(x.subgrupo||''))}')">${esc(x.subgrupo||'-')}</td>
    <td class="rent-cell-link" onclick="filtrarRentabilidadeForma('${encodeURIComponent(String((x.formasPagamento||'').split(' + ')[0]||''))}')" title="${esc(x.formasPagamento||'Não identificado')}">${esc(x.formasPagamento||'Não identificado')}</td>
    <td class="num">${fmtNumero(x.qtdVendida||0)}</td>
    <td class="num" title="Preço atual cadastrado no produto">${fmtMoeda(x.precoVenda||0)}</td>
    <td class="num" title="Valor promocional vigente para este produto/empresa">${Number(x.valorPromocao||0)>0 ? fmtMoeda(x.valorPromocao) : '-'}</td>
    <td class="num">${fmtMoeda(x.custoMedio||0)}</td>
    <td class="num">${fmtMoeda(x.valorVendido||0)}</td>
    <td class="num">${fmtMoeda(x.custoTotal||0)}</td>
    <td class="num rent-lucro ${Number(x.lucroBruto||0)<0?'negativo':''}">${fmtMoeda(x.lucroBruto||0)}</td>
    <td class="num"><button type="button" class="rent-pill ${rentMargemClasse(x.margemPct)} rent-pill-btn" onclick="filtrarRentabilidadeMargem('${rentMargemClasse(x.margemPct)}')">${fmtPct(x.margemPct||0)}</button></td>
    <td class="num">${fmtMoeda(x.lucroPeca||0)}</td>
  </tr>`).join(''):`<tr><td colspan="20" class="empty">Sem produtos/clientes vendidos no período.</td></tr>`;
}

function rentNormalizarTexto(v){
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function rentContem(valor, filtro){
  const f = rentNormalizarTexto(filtro);
  if(!f) return true;
  return rentNormalizarTexto(valor).includes(f);
}

function rentEmpresaAceita(empresa, empresaNome, filtro){
  const f = String(filtro || "").trim();
  if(!f) return true;

  const fn = rentNormalizarTexto(f);
  if(["TODAS","TODOS","GERAL","TODAS AS EMPRESAS","TODOS AS EMPRESAS"].includes(fn)) return true;

  const atual = String(empresa || "").replace(/\D/g, "").slice(-2).padStart(2,"0");
  const nomeAtual = rentNormalizarTexto(empresaNome || "");

  const tokens = f.split(/[,;|]+/).map(x=>x.trim()).filter(Boolean);
  if(!tokens.length) return true;

  return tokens.some(token => {
    const tokenNorm = rentNormalizarTexto(token);
    const achou = token.match(/(?:^|\D)(\d{1,2})(?:\D|$)/);

    if(achou && token.replace(/\D/g,"").length <= 2){
      return atual === String(achou[1]).padStart(2,"0");
    }

    return rentNormalizarTexto(empresa).includes(tokenNorm)
      || nomeAtual.includes(tokenNorm);
  });
}

function rentFormaAceita(x, forma){
  const f = rentNormalizarTexto(forma);
  if(!f) return true;
  return String(x?.formasPagamento || "")
    .split("+")
    .map(v=>rentNormalizarTexto(v))
    .some(v=>v === f);
}

function rentAplicarFiltrosLocais(produtos){
  const empresa=(els.empresa?.value||"").trim();
  const marca=(document.getElementById("rentMarca")?.value||"").trim();
  const dep=(document.getElementById("rentDepartamento")?.value||"").trim();
  const grupo=(document.getElementById("rentGrupo")?.value||"").trim();
  const sub=(document.getElementById("rentSubgrupo")?.value||"").trim();
  const busca=(document.getElementById("rentBusca")?.value||"").trim();
  const forma=(document.getElementById("rentFormaPagamento")?.value||"").trim();

  return (produtos || []).filter(x => {
    if(!rentEmpresaAceita(x?.empresa, x?.empresaNome, empresa)) return false;
    if(!rentContem(x?.marca, marca)) return false;
    if(!rentContem(x?.departamento, dep)) return false;
    if(!rentContem(x?.grupo, grupo)) return false;
    if(!rentContem(x?.subgrupo, sub)) return false;
    if(!rentFormaAceita(x, forma)) return false;
    if(busca){
      const ok=[x?.produto,x?.descricao,x?.referencia,x?.complemento,x?.cliente,x?.clienteCodigo]
        .some(v=>rentContem(v,busca));
      if(!ok) return false;
    }
    return rentFiltroMargemAceita(x);
  });
}

function rentChaveBaseAtual(){
  return `${els.dataIni?.value || ""}|${els.dataFim?.value || ""}`;
}

function rentCacheValido(){
  return RENT_CACHE_CARREGADO && RENT_CACHE_CHAVE === rentChaveBaseAtual();
}

function aplicarVisaoRentabilidade(){
  const campoVisao=document.getElementById('rentVisao')?.value||'grupo';
  const metricaVisao=document.getElementById('rentVisaoOrdenar')?.value||'lucroBruto';
  let base=rentAplicarFiltrosLocais([...(RENT_DADOS.produtos||[])]);
  let ranking=rentAgruparVisao(base,campoVisao);
  ranking.sort((a,b)=>Number(b?.[metricaVisao]||0)-Number(a?.[metricaVisao]||0));

  let produtos=base;
  if(RENT_FILTRO_VISAO){
    produtos=produtos.filter(x=>rentNomeVisao(x,RENT_FILTRO_VISAO.campo)===RENT_FILTRO_VISAO.nome);
  }

  const {campo,direcao}=RENT_ORDENACAO;
  produtos.sort((a,b)=>{
    const av=a?.[campo],bv=b?.[campo];
    let cmp=0;
    if(typeof av==='number'||typeof bv==='number') cmp=Number(av||0)-Number(bv||0);
    else cmp=String(av||'').localeCompare(String(bv||''),'pt-BR',{numeric:true,sensitivity:'base'});
    return direcao==='asc'?cmp:-cmp;
  });

  const resumo=rentResumoDeProdutos(produtos);
  const empresas=rentEmpresasDeProdutos(produtos);
  const formasFiltradas=rentFormasDeProdutos(produtos);
  document.getElementById("rentFaturamento").textContent=fmtMoeda(resumo.valorVendido||0);
  document.getElementById("rentCmv").textContent=fmtMoeda(resumo.custoTotal||0);
  document.getElementById("rentLucro").textContent=fmtMoeda(resumo.lucroBruto||0);
  document.getElementById("rentMargem").textContent=fmtPct(resumo.margemPct||0);
  document.getElementById("rentQtd").textContent=fmtNumero(resumo.qtdVendida||0);
  document.getElementById("rentLucroPeca").textContent=fmtMoeda(resumo.lucroPeca||0);
  document.querySelectorAll('[data-rent-sort]').forEach(el=>el.classList.toggle('rent-selected',el.dataset.rentSort===campo));
  document.querySelectorAll('[data-rent-margem]').forEach(el=>el.classList.toggle('rent-selected',el.dataset.rentMargem===RENT_FILTRO_MARGEM&&!!RENT_FILTRO_MARGEM));
  renderRentEmpresas(empresas);
  renderRentProdutos(produtos);
  renderRentRankingMarcas(ranking,campoVisao,metricaVisao);
  renderRentFormas(formasFiltradas);
  atualizarIndicadorRentabilidade();
  ativarOrdenacaoEmTodasAsTabelas();
}

function mudarVisaoRentabilidade(){
  RENT_FILTRO_VISAO=null;
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeVisao(campo,nomeEnc){
  const nome=decodeURIComponent(nomeEnc||'');
  if(RENT_FILTRO_VISAO && RENT_FILTRO_VISAO.campo===campo && RENT_FILTRO_VISAO.nome===nome) RENT_FILTRO_VISAO=null;
  else RENT_FILTRO_VISAO={campo,nome};
  const sel=document.getElementById('rentVisao');
  if(sel && [...sel.options].some(o=>o.value===campo)) sel.value=campo;
  aplicarVisaoRentabilidade();
}

function ordenarRentabilidadePor(campo){
  if(RENT_ORDENACAO.campo === campo){
    RENT_ORDENACAO.direcao = RENT_ORDENACAO.direcao === 'desc' ? 'asc' : 'desc';
  }else{
    RENT_ORDENACAO = {campo,direcao:'desc'};
  }
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeMargem(faixa){
  RENT_FILTRO_MARGEM = RENT_FILTRO_MARGEM === faixa ? "" : String(faixa||"");
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeMarca(nomeEnc){
  const nome=decodeURIComponent(nomeEnc||"");
  const el=document.getElementById('rentMarca');
  if(el) el.value = (el.value||'').trim() === nome ? '' : nome;
  RENT_FILTRO_MARGEM='';
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeEmpresa(empresaEnc){
  const empresa=decodeURIComponent(empresaEnc||"");
  if(els.empresa) els.empresa.value = (els.empresa.value||'').trim() === empresa ? '' : empresa;
  RENT_FILTRO_MARGEM='';
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeProduto(produtoEnc){
  const produto=decodeURIComponent(produtoEnc||"");
  const el=document.getElementById('rentBusca');
  if(el) el.value = (el.value||'').trim() === produto ? '' : produto;
  RENT_FILTRO_MARGEM='';
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeCampo(id, valorEnc){
  const valor=decodeURIComponent(valorEnc||"");
  const el=document.getElementById(id);
  if(el) el.value = (el.value||'').trim() === valor ? '' : valor;
  RENT_FILTRO_MARGEM='';
  aplicarVisaoRentabilidade();
}

function filtrarRentabilidadeForma(nomeEnc){
  const nome=decodeURIComponent(nomeEnc||"");
  const el=document.getElementById('rentFormaPagamento');
  if(el) el.value=(el.value||'').trim()===nome?'':nome;
  RENT_FILTRO_MARGEM='';
  aplicarVisaoRentabilidade();
}

function limparFiltrosRentabilidade(){
  ['rentMarca','rentDepartamento','rentGrupo','rentSubgrupo','rentFormaPagamento','rentBusca'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  if(els.empresa) els.empresa.value='';
  RENT_FILTRO_MARGEM='';
  RENT_FILTRO_VISAO=null;
  RENT_ORDENACAO={campo:'lucroBruto',direcao:'desc'};
  aplicarVisaoRentabilidade();
}

// =====================================================
// RENTABILIDADE — DUPLO CLIQUE LIMPA TODOS OS FILTROS
// Clique simples: mantém filtro/ordenação normal.
// Dois cliques rápidos: volta para a visão geral.
// =====================================================
document.addEventListener("dblclick", function(evento){
  const alvo = evento.target.closest(`
    .rent-rank-button,
    .rent-forma-card,
    .rent-cell-link,
    .rent-click-row,
    .rent-pill-btn,
    [data-rent-sort],
    [data-rent-margem]
  `);

  if(!alvo) return;

  evento.preventDefault();
  evento.stopPropagation();

  limparFiltrosRentabilidade();

  const indicador = document.getElementById("rentFiltroAtivo");
  if(indicador){
    indicador.textContent = "Filtros limpos · visão geral";
  }
}, true);




// =====================================================
// RENTABILIDADE — EXPORTAR SOMENTE A TABELA PARA PDF
// Usa exatamente as linhas e a ordem que estão visíveis
// na tela. Não faz nova consulta ao banco.
// PDF gerado localmente, sem dependência externa.
// =====================================================
function rentPdfTextoSeguro(valor){
  return String(valor ?? "")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
    .replace(/\s+/g, " ")
    .trim();
}

function rentPdfEscapar(valor){
  return rentPdfTextoSeguro(valor)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function rentPdfQuebrarTexto(texto, maxChars){
  const t = rentPdfTextoSeguro(texto);
  if(!t) return [""];

  const limite = Math.max(3, Number(maxChars || 10));
  const palavras = t.split(/\s+/);
  const linhas = [];
  let atual = "";

  const empurrarPedacos = (palavra) => {
    let resto = palavra;
    while(resto.length > limite){
      linhas.push(resto.slice(0, limite));
      resto = resto.slice(limite);
    }
    return resto;
  };

  for(let palavra of palavras){
    if(palavra.length > limite){
      if(atual){
        linhas.push(atual);
        atual = "";
      }
      palavra = empurrarPedacos(palavra);
      if(!palavra) continue;
    }

    const teste = atual ? `${atual} ${palavra}` : palavra;
    if(teste.length <= limite){
      atual = teste;
    }else{
      if(atual) linhas.push(atual);
      atual = palavra;
    }
  }

  if(atual) linhas.push(atual);
  return linhas.length ? linhas : [""];
}

function rentPdfNumero(n){
  return Number(n || 0).toFixed(2).replace(/\.?0+$/,"");
}

function rentPdfBytes(binario){
  const bytes = new Uint8Array(binario.length);
  for(let i=0;i<binario.length;i++){
    bytes[i] = binario.charCodeAt(i) & 0xFF;
  }
  return bytes;
}

function rentPdfCriarDocumento(paginas, largura, altura){
  const objetos = [];
  objetos[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objetos[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objetos[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  const kids = [];
  let numeroObjeto = 5;

  for(const conteudo of paginas){
    const pageObj = numeroObjeto++;
    const contentObj = numeroObjeto++;
    kids.push(`${pageObj} 0 R`);

    objetos[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${rentPdfNumero(largura)} ${rentPdfNumero(altura)}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`;

    objetos[contentObj] =
      `<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`;
  }

  objetos[2] = `<< /Type /Pages /Count ${paginas.length} /Kids [${kids.join(" ")}] >>`;

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];

  for(let i=1;i<objetos.length;i++){
    if(!objetos[i]) continue;
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objetos[i]}\nendobj\n`;
  }

  const xref = pdf.length;
  pdf += `xref\n0 ${objetos.length}\n`;
  pdf += `0000000000 65535 f \n`;

  for(let i=1;i<objetos.length;i++){
    const off = offsets[i] || 0;
    pdf += `${String(off).padStart(10,"0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xref}\n%%EOF`;

  return new Blob([rentPdfBytes(pdf)], {type:"application/pdf"});
}


const RENT_PDF_COLUNAS_STORAGE="rentabilidade_pdf_colunas_v2";
const RENT_PDF_AUDITORIA_STORAGE="rentabilidade_pdf_auditoria_v1";

function rentPdfDataBR(v){
  const s=String(v||"").trim(),m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?`${m[3]}/${m[2]}/${m[1]}`:(s||"-");
}
function rentPdfCampo(id){return String(document.getElementById(id)?.value||"").trim();}
function rentPdfSelectTexto(id){
  const e=document.getElementById(id);
  return e?rentPdfTextoSeguro(e.options?.[e.selectedIndex]?.text||e.value||""):"";
}
function rentPdfOrdemRotulo(c){
  return ({
    empresa:"Empresa",dataVenda:"Data venda",clienteCodigo:"Cód. cliente",cliente:"Cliente",
    produto:"Produto",numeracao:"Numeração",descricao:"Descrição",marca:"Marca",
    departamento:"Departamento",grupo:"Grupo",subgrupo:"Subgrupo",formasPagamento:"Forma de pagamento",
    qtdVendida:"Quantidade",precoVenda:"Preço cadastro",valorPromocao:"Promoção vigente",
    custoMedio:"Custo médio",valorVendido:"Vendas / Faturamento líquido",custoTotal:"CMV",
    lucroBruto:"Lucro bruto",margemPct:"Margem",lucroPeca:"Lucro/peça"
  })[c]||String(c||"");
}
function rentPdfMargemTexto(){
  if(RENT_FILTRO_MARGEM==="boa") return "Margem >= 35%";
  if(RENT_FILTRO_MARGEM==="atencao") return "Margem de 20% a 34,99%";
  if(RENT_FILTRO_MARGEM==="baixa") return "Margem abaixo de 20%";
  return "Todas as margens";
}
function rentPdfOpcoesAuditoria(){
  const opcoes=[
    // Período sempre existe e representa a base do relatório.
    {id:"periodo", nome:"Período analisado", mostrar:true},

    // Empresa/grupo só aparece se o usuário realmente informou algo.
    {id:"empresa", nome:"Empresa / grupo pesquisado",
      mostrar:!!String(els?.empresa?.value||"").trim()},

    // Só oferece "Filtros preenchidos" se pelo menos um destes campos estiver preenchido.
    {id:"filtros", nome:"Filtros preenchidos",
      mostrar:[
        rentPdfCampo("rentMarca"),
        rentPdfCampo("rentDepartamento"),
        rentPdfCampo("rentGrupo"),
        rentPdfCampo("rentSubgrupo"),
        rentPdfCampo("rentFormaPagamento"),
        rentPdfCampo("rentBusca")
      ].some(v=>String(v||"").trim())},

    // Margem só aparece como auditoria se houve seleção de faixa.
    {id:"margem", nome:"Faixa de margem",
      mostrar:!!RENT_FILTRO_MARGEM},

    // Item de gráfico somente quando houve clique/filtro no gráfico.
    {id:"grafico_item", nome:"Item selecionado no gráfico",
      mostrar:!!RENT_FILTRO_VISAO},

    // Visão e ordenação do gráfico são escolhas efetivas do relatório.
    {id:"grafico_visao", nome:"Visão do gráfico",
      mostrar:!!rentPdfSelectTexto("rentVisao")},
    {id:"grafico_ordem", nome:"Ordenação do gráfico",
      mostrar:!!rentPdfSelectTexto("rentVisaoOrdenar")},

    // Ordenação da tabela só aparece quando existe estado de ordenação.
    {id:"tabela_ordem", nome:"Ordenação da tabela",
      mostrar:!!(RENT_ORDENACAO && RENT_ORDENACAO.campo)},

    // Indicador textual só aparece se houver conteúdo útil.
    {id:"filtros_ativos", nome:"Resumo dos filtros ativos",
      mostrar:!!rentPdfTextoSeguro(document.getElementById("rentFiltroAtivo")?.textContent||"")},

    // Estes são dados produzidos pelo próprio relatório e sempre podem ser escolhidos.
    {id:"resumo", nome:"Resumo financeiro da seleção", mostrar:true},
    {id:"registros", nome:"Quantidade de registros exportados", mostrar:true},
    {id:"colunas", nome:"Relação das colunas exportadas", mostrar:true}
  ];

  return opcoes.filter(x=>x.mostrar);
}

function rentPdfContexto(qtd,colunas,auditoriaSelecionada=null){
  const auditoria = new Set(
    Array.isArray(auditoriaSelecionada) && auditoriaSelecionada.length
      ? auditoriaSelecionada
      : rentPdfOpcoesAuditoria().map(x=>x.id)
  );

  const empresa=String(els?.empresa?.value||"").trim();
  const preenchidos=[
    ["Marca",rentPdfCampo("rentMarca")],["Departamento",rentPdfCampo("rentDepartamento")],
    ["Grupo",rentPdfCampo("rentGrupo")],["Subgrupo",rentPdfCampo("rentSubgrupo")],
    ["Forma de pagamento",rentPdfCampo("rentFormaPagamento")],["Produto / cliente",rentPdfCampo("rentBusca")]
  ].filter(([,v])=>v);

  const ordem=RENT_ORDENACAO||{};
  const indicador=rentPdfTextoSeguro(document.getElementById("rentFiltroAtivo")?.textContent||"");
  const resumo=[
    `Faturamento líquido: ${rentPdfTextoSeguro(document.getElementById("rentFaturamento")?.textContent||"-")}`,
    `CMV: ${rentPdfTextoSeguro(document.getElementById("rentCmv")?.textContent||"-")}`,
    `Lucro bruto: ${rentPdfTextoSeguro(document.getElementById("rentLucro")?.textContent||"-")}`,
    `Margem: ${rentPdfTextoSeguro(document.getElementById("rentMargem")?.textContent||"-")}`,
    `Quantidade: ${rentPdfTextoSeguro(document.getElementById("rentQtd")?.textContent||"-")}`,
    `Lucro/peça: ${rentPdfTextoSeguro(document.getElementById("rentLucroPeca")?.textContent||"-")}`
  ].join(" | ");

  const linhas = [];

  if(auditoria.has("periodo"))
    linhas.push(`Período: ${rentPdfDataBR(els?.dataIni?.value)} a ${rentPdfDataBR(els?.dataFim?.value)}`);

  if(auditoria.has("empresa") && empresa)
    linhas.push(`Empresa / grupo pesquisado: ${empresa}`);

  if(auditoria.has("filtros") && preenchidos.length)
    linhas.push(`Filtros preenchidos: ${preenchidos.map(([k,v])=>`${k}: ${v}`).join(" | ")}`);

  if(auditoria.has("margem"))
    linhas.push(`Faixa de margem: ${rentPdfMargemTexto()}`);

  if(auditoria.has("grafico_item"))
    linhas.push(`Item selecionado no gráfico: ${RENT_FILTRO_VISAO?`${rentRotuloVisao(RENT_FILTRO_VISAO.campo)} = ${RENT_FILTRO_VISAO.nome}`:"Nenhum"}`);

  if(auditoria.has("grafico_visao"))
    linhas.push(`Visão do gráfico: ${rentPdfSelectTexto("rentVisao")||"Padrão"}`);

  if(auditoria.has("grafico_ordem"))
    linhas.push(`Ordenação do gráfico: ${rentPdfSelectTexto("rentVisaoOrdenar")||"Padrão"}`);

  if(auditoria.has("tabela_ordem"))
    linhas.push(`Ordenação da tabela: ${rentPdfOrdemRotulo(ordem.campo)} - ${ordem.direcao==="asc"?"crescente":"decrescente"}`);

  if(auditoria.has("filtros_ativos") && indicador)
    linhas.push(`Filtros ativos: ${indicador}`);

  if(auditoria.has("resumo"))
    linhas.push(`Resumo da seleção: ${resumo}`);

  if(auditoria.has("registros"))
    linhas.push(`Registros exportados: ${qtd}`);

  if(auditoria.has("colunas"))
    linhas.push(`Colunas exportadas: ${colunas.join(", ")}`);

  return linhas;
}

function abrirModalRentabilidadePDF(){
  const modal=document.getElementById("modalRentPdfColunas");
  const lista=document.getElementById("rentPdfColunasLista");
  const tabela=document.getElementById("rentProdutosTbody")?.closest("table");
  if(!modal||!lista||!tabela){alert("Não foi possível abrir as opções do PDF.");return;}

  const hs=[...tabela.querySelectorAll("thead th")].map((th,i)=>({i,n:rentPdfTextoSeguro(th.textContent)}));
  let salvas=null;
  try{salvas=JSON.parse(localStorage.getItem(RENT_PDF_COLUNAS_STORAGE)||"null");}catch(_){}
  const sel=new Set(Array.isArray(salvas)&&salvas.length?salvas.map(String):hs.map(x=>String(x.i)));

  lista.innerHTML=hs.map(x=>`
    <label class="rent-pdf-coluna-item">
      <input type="checkbox" class="rent-pdf-coluna-check" value="${x.i}" ${sel.has(String(x.i))?"checked":""}>
      <span>${esc(x.n)}</span>
    </label>`).join("");

  document.getElementById("rentPdfModalResumo").textContent=
    `A tabela possui ${hs.length} colunas. Escolha as colunas e as informações de auditoria que irão para o PDF.`;

  const listaAuditoria=document.getElementById("rentPdfAuditoriaLista");
  if(listaAuditoria){
    let auditoriaSalva=null;
    try{auditoriaSalva=JSON.parse(localStorage.getItem(RENT_PDF_AUDITORIA_STORAGE)||"null");}catch(_){}
    const opcoesAuditoria=rentPdfOpcoesAuditoria();
    const selecionadasAuditoria=new Set(
      Array.isArray(auditoriaSalva)
        ? auditoriaSalva.map(String)
        : opcoesAuditoria.map(x=>x.id)
    );

    listaAuditoria.innerHTML=opcoesAuditoria.map(x=>`
      <label class="rent-pdf-coluna-item rent-pdf-auditoria-item">
        <input type="checkbox" class="rent-pdf-auditoria-check" value="${esc(x.id)}" ${selecionadasAuditoria.has(x.id)?"checked":""}>
        <span>${esc(x.nome)}</span>
      </label>`).join("");
  }

  modal.style.display="flex";
  modal.classList.add("open");
}
function fecharModalRentabilidadePDF(){
  const m=document.getElementById("modalRentPdfColunas");
  if(m){m.style.display="none";m.classList.remove("open");}
}
function marcarTodasColunasRentPdf(v=true){
  document.querySelectorAll(".rent-pdf-coluna-check").forEach(x=>x.checked=!!v);
}
function marcarTodaAuditoriaRentPdf(v=true){
  document.querySelectorAll(".rent-pdf-auditoria-check").forEach(x=>x.checked=!!v);
}
async function gerarRentabilidadePDFSelecionado(){
  const indices=[...document.querySelectorAll(".rent-pdf-coluna-check:checked")]
    .map(x=>Number(x.value)).filter(Number.isInteger).sort((a,b)=>a-b);
  if(!indices.length){alert("Selecione pelo menos uma coluna.");return;}

  const auditoria=[...document.querySelectorAll(".rent-pdf-auditoria-check:checked")]
    .map(x=>String(x.value||"").trim()).filter(Boolean);

  try{
    localStorage.setItem(RENT_PDF_COLUNAS_STORAGE,JSON.stringify(indices));
    localStorage.setItem(RENT_PDF_AUDITORIA_STORAGE,JSON.stringify(auditoria));
  }catch(_){}

  fecharModalRentabilidadePDF();
  return exportarRentabilidadePDF(indices,auditoria);
}

async function exportarRentabilidadePDF(indicesSelecionados,auditoriaSelecionada=null){
  const tbody=document.getElementById("rentProdutosTbody"),tabela=tbody?.closest("table");
  if(!tabela){alert("Tabela de rentabilidade não encontrada.");return;}

  const todosH=[...tabela.querySelectorAll("thead th")].map(th=>rentPdfTextoSeguro(th.textContent));
  const indices=Array.isArray(indicesSelecionados)&&indicesSelecionados.length?indicesSelecionados:todosH.map((_,i)=>i);
  const headers=indices.map(i=>todosH[i]||`Coluna ${i+1}`);
  const linhas=[...tbody.querySelectorAll("tr")].filter(tr=>!tr.querySelector(".empty")).map(tr=>{
    const cs=[...tr.querySelectorAll("td")].map(td=>rentPdfTextoSeguro(td.textContent));
    return indices.map(i=>cs[i]||"");
  });
  if(!linhas.length){alert("Não existem linhas visíveis para exportar.");return;}

  const contexto=rentPdfContexto(linhas.length,headers,auditoriaSelecionada);
  const pageW=1190.55,pageH=841.89,margem=16,rodape=14;
  const fontSize=Math.max(5.4,Math.min(7.0,125/Math.max(headers.length,8)));
  const headerFont=fontSize,lineH=fontSize+1.6,paddingX=2.3,paddingY=2.1,areaW=pageW-margem*2;

  const pesos=headers.map((_,c)=>{
    let maior=String(headers[c]||"").length;
    for(const r of linhas) maior=Math.max(maior,String(r[c]||"").length);
    return Math.max(2.8,Math.min(9.5,Math.sqrt(Math.min(maior,100))*1.2));
  });
  const sp=pesos.reduce((a,b)=>a+b,0);
  let larguras=pesos.map(p=>p/sp*areaW);

  const mins=headers.map(h=>{
    h=h.toLowerCase();
    if(h.includes("cliente")&&!h.includes("cód"))return 66;
    if(h.includes("descrição"))return 75;
    if(h.includes("forma"))return 62;
    if(h.includes("data"))return 38;
    if(h.includes("empresa"))return 35;
    if(h.includes("produto"))return 43;
    if(h.includes("lucro")||h.includes("vendas")||h.includes("cmv"))return 44;
    if(h.includes("preço")||h.includes("promoção")||h.includes("custo"))return 46;
    return 31;
  });
  let sm=0;for(let i=0;i<larguras.length;i++){larguras[i]=Math.max(larguras[i],mins[i]);sm+=larguras[i];}
  if(sm>areaW){const f=areaW/sm;larguras=larguras.map(w=>w*f);}

  function prep(celulas,fonte){
    const q=celulas.map((t,i)=>rentPdfQuebrarTexto(t,Math.max(3,Math.floor((larguras[i]-paddingX*2)/(fonte*.5)))));
    return {q,h:Math.max(11,Math.max(...q.map(x=>x.length),1)*lineH+paddingY*2)};
  }
  const hp=prep(headers,headerFont),rows=linhas.map(r=>prep(r,fontSize));
  const paginas=[];let cmd=[],y=16,pag=0;

  function texto(t,x,base,f,b=false){cmd.push(`BT /${b?"F2":"F1"} ${rentPdfNumero(f)} Tf 0 g ${rentPdfNumero(x)} ${rentPdfNumero(base)} Td (${rentPdfEscapar(t)}) Tj ET`);}
  function caixa(x,yt,w,h,fill){const yb=pageH-yt-h;if(fill)cmd.push(`${fill} g ${rentPdfNumero(x)} ${rentPdfNumero(yb)} ${rentPdfNumero(w)} ${rentPdfNumero(h)} re f`);cmd.push(`0.72 G 0.25 w ${rentPdfNumero(x)} ${rentPdfNumero(yb)} ${rentPdfNumero(w)} ${rentPdfNumero(h)} re S`);}
  function quebra(t,x,yt,w,f,b=false){for(const l of rentPdfQuebrarTexto(t,Math.max(25,Math.floor(w/(f*.49))))){texto(l,x,pageH-yt-f,f,b);yt+=f+2;}return yt;}
  function linha(p,b=false,fill=null){let x=margem;for(let c=0;c<p.q.length;c++){caixa(x,y,larguras[c],p.h,fill);for(let li=0;li<p.q[c].length;li++)texto(p.q[c][li],x+paddingX,pageH-y-paddingY-(li+1)*lineH+1.6,b?headerFont:fontSize,b);x+=larguras[c];}y+=p.h;}
  function cab(){linha(hp,true,"0.88");}
  function inicia(){
    pag++;cmd=[];y=16;
    if(pag===1){
      texto("CENTRAL DE RENTABILIDADE / LUCRO BRUTO",margem,pageH-y-15,14,true);y+=22;
      texto("Relatório da tabela conforme filtros, seleções e ordenação aplicados",margem,pageH-y-10,9,false);y+=17;
      y=quebra("Regra: Venda líquida (VE - DV - VC) | Lucro Bruto = Faturamento Líquido - CMV.",margem,y,areaW,7.4,true)+3;
      for(const item of contexto)y=quebra(item,margem,y,areaW,6.8,false)+1;
      y+=7;
    }else{texto("CENTRAL DE RENTABILIDADE / LUCRO BRUTO",margem,pageH-y-10,8,true);y+=15;}
    cab();
  }
  function fecha(){texto(`Página ${pag}`,pageW-55,8,6,false);paginas.push(cmd.join("\n"));}

  inicia();
  for(const r of rows){if(y+r.h>pageH-rodape){fecha();inicia();}linha(r);}
  fecha();

  const blob=rentPdfCriarDocumento(paginas,pageW,pageH),url=URL.createObjectURL(blob),a=document.createElement("a");
  const d1=els?.dataIni?.value||"",d2=els?.dataFim?.value||"",periodo=d1&&d2?`_${d1}_a_${d2}`:"";
  a.href=url;a.download=`rentabilidade_tabela${periodo}.pdf`;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}

async function carregarRentabilidade(forcarBanco = false){
  if(!forcarBanco && rentCacheValido()){
    aplicarVisaoRentabilidade();
    return;
  }

  const reqId = ++rentabilidadeRequestId;
  try{
    document.body.style.cursor = "wait";
    const qs = new URLSearchParams();
    if(els.dataIni?.value) qs.set("dataIni", els.dataIni.value);
    if(els.dataFim?.value) qs.set("dataFim", els.dataFim.value);

    const r = await fetch(`/api/financeiro/rentabilidade?${qs.toString()}`);
    const d = await r.json();
    if(reqId !== rentabilidadeRequestId) return;
    if(!r.ok || !d.ok) throw new Error(d.erro || "Erro ao calcular rentabilidade.");

    RENT_FILTRO_VISAO=null;
    RENT_DADOS = {
      resumo:d.resumo||{},
      empresas:Array.isArray(d.empresas)?d.empresas:[],
      produtos:Array.isArray(d.produtos)?d.produtos:[],
      marcas:Array.isArray(d.marcas)?d.marcas:[],
      grupos:Array.isArray(d.grupos)?d.grupos:[],
      formas:Array.isArray(d.formas)?d.formas:[]
    };
    RENT_CACHE_CHAVE = rentChaveBaseAtual();
    RENT_CACHE_CARREGADO = true;
    RENT_CACHE_CARREGADO_EM = Date.now();
    aplicarVisaoRentabilidade();
  }catch(e){
    console.error("Erro rentabilidade:", e);
    alert("Erro ao carregar Rentabilidade: " + (e.message || e));
  }finally{
    document.body.style.cursor = "default";
  }
}

function atualizarRentabilidadeDoBanco(){
  RENT_CACHE_CARREGADO=false;
  RENT_CACHE_CHAVE="";
  return carregarRentabilidade(true);
}

document.getElementById("rentFormaPagamento")?.addEventListener("change", () => {
  RENT_FILTRO_MARGEM='';
  aplicarVisaoRentabilidade();
});

["rentMarca","rentDepartamento","rentGrupo","rentSubgrupo","rentBusca"].forEach(id=>{
  const el=document.getElementById(id);
  if(!el) return;
  let timer=null;
  el.addEventListener("input",()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>{ if(rentCacheValido()) aplicarVisaoRentabilidade(); },180);
  });
});

// Abre diretamente a aba correta quando a URL vier com #rentabilidade.
if (window.location.hash === "#rentabilidade") {
  setTimeout(() => trocarAba("rentabilidade"), 0);
}



// ============================================================
// NOVO FLUXO DE CAIXA PROJETADO
// ============================================================
let FCP_DADOS = null;
const FCP_FILTROS = {
  periodos: new Set(),   // "AAAA-MM-DD|AAAA-MM-DD"
  empresas: new Set(),   // códigos reais das empresas; grupo consolidado adiciona todos os membros
  planos: new Set(),     // códigos de plano/item
  lados: new Set(),      // "ativo" / "passivo"
  formas: new Set(),     // forma de pagamento do receber
  fornecedores: new Set()// fornecedor do pagar
};
const FCP_PLANOS_ABERTOS = new Set(); // estruturas raiz 01, 02, 03... abertas no fluxograma

function fcpSetMoeda(id, valor, colorir = false){
  const el = document.getElementById(id);
  if(!el) return;
  const n = Number(valor || 0);
  el.textContent = fmtMoeda(n);
  if(colorir){
    el.classList.toggle("fcp-negativo", n < 0);
    el.classList.toggle("fcp-positivo", n >= 0);
  }
}

function fcpEsc(v){
  return esc(v == null ? "" : v);
}

function fcpAviso(msg = "", tipo = "info"){
  const el = document.getElementById("fcpAviso");
  if(!el) return;
  if(!msg){
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  el.className = `fcp-aviso ${tipo || "info"}`;
  el.textContent = msg;
  el.style.display = "block";
}


function fcpValorCampoMoeda(valor){
  const s = String(valor ?? "").trim();
  if(!s) return 0;
  // pt-BR: remove R$, pontos de milhar e converte vírgula decimal.
  const limpo = s.replace(/[R$\s]/g,"").replace(/\./g,"").replace(",",".").replace(/[^\d.-]/g,"");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

function fcpFormatarSaldoInicial(el){
  if(!el) return;
  const n = fcpValorCampoMoeda(el.value);
  el.value = n ? n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}) : "";
}

function fcpParametros(){
  const qs = new URLSearchParams();
  qs.set("situacaoFinanceira","ABERTO");
  const empresa = String(els.empresa?.value || "").trim();
  if(empresa) qs.set("empresa", empresa);

  if(els.dataIni?.value) qs.set("dataIni", els.dataIni.value);
  if(els.dataFim?.value) qs.set("dataFim", els.dataFim.value);

  // Saldo inicial: somente ponto de partida da projeção.
  const saldoInicial = fcpValorCampoMoeda(document.getElementById("fcpSaldoInicialManual")?.value);
  qs.set("saldoInicial", String(saldoInicial));

  // Agora este seletor controla somente quantos dias vencidos do Contas a Receber
  // ainda entram no Ativo antes de hoje.
  const atrasoDias = Math.max(0, Math.min(365, Number(document.getElementById("fcpHorizonte")?.value || 90)));
  qs.set("atrasoDias", String(atrasoDias));

  const excluirTransferencias = !!document.getElementById("finIncluirTransferencias")?.checked;
  qs.set("incluirTransferencias", excluirTransferencias ? "0" : "1");

  return qs;
}

function fcpAplicarHorizonte(valor){
  const el=document.getElementById("fcpHorizonte");
  if(el && valor != null) el.value=String(valor);
}

async function carregarFluxoCaixaProjetado(){
  const requestId = ++fluxoRequestId;
  fcpAviso("");

  try{
    const data = await getJSON(`/api/financeiro/fluxo-caixa-projetado?${fcpParametros().toString()}`);
    if(requestId !== fluxoRequestId) return;
    FCP_DADOS = data;

    const r = data.resumo || {};
    fcpSetMoeda("fcpAtivo", r.ativoFinanceiro);
    fcpSetMoeda("fcpPassivo", r.passivoProjetado);
    fcpSetMoeda("fcpCaixa", r.saldoContasCaixa);
    fcpSetMoeda("fcpLiquido", r.posicaoLiquida, true);

    fcpSetMoeda("fcpRecVencido90", r.receberVencido90);
    fcpSetMoeda("fcpRecAVencer", r.receberAVencer);
    fcpSetMoeda("fcpRecTotal", r.receberTotalAtivo);

    fcpSetMoeda("fcpPag7", r.pagar7Dias);
    fcpSetMoeda("fcpPag30", r.pagar8a30);
    fcpSetMoeda("fcpPagTotal", r.passivoProjetado);

    fcpSetMoeda("fcpAvistaAnterior", r.previstoAvistaAnoPassado);
    fcpSetMoeda("fcpAprazoAnterior", r.previstoAprazoAnoPassado);
    fcpSetMoeda("fcpTotalAnterior", r.previstoTotalAnoPassado);

    const fonte = document.getElementById("fcpCaixaFonte");
    if(fonte) fonte.textContent = "Valor informado manualmente como disponível hoje";

    // Novo carregamento zera as seleções visuais e parte dos dados integrais do servidor.
    fcpLimparFiltrosCruzados(false);
    fcpRenderTudoCruzado();

    return data;
  }catch(err){
    console.error("Erro ao carregar Fluxo de Caixa Projetado:", err);
    fcpAviso(err.message || "Não foi possível carregar o Fluxo de Caixa Projetado.", "erro");
    throw err;
  }
}



function fcpToggleSet(set, valor){
  valor=String(valor||"");
  if(!valor) return;
  if(set.has(valor)) set.delete(valor); else set.add(valor);
}

function fcpTemFiltros(){
  return FCP_FILTROS.periodos.size || FCP_FILTROS.empresas.size || FCP_FILTROS.planos.size || FCP_FILTROS.lados.size;
}

function fcpDataEmPeriodos(data){
  if(!FCP_FILTROS.periodos.size) return true;
  const d=String(data||"").slice(0,10);
  for(const faixa of FCP_FILTROS.periodos){
    const [ini,fim]=String(faixa).split("|");
    if(d>=ini && d<=fim) return true;
  }
  return false;
}

function fcpFiltrarFatos(tipo, ignorarDim=""){
  const fatos=FCP_DADOS?.fatos || {};
  let arr=Array.isArray(fatos[tipo]) ? fatos[tipo] : [];

  if(ignorarDim!=="empresa" && FCP_FILTROS.empresas.size){
    arr=arr.filter(x=>FCP_FILTROS.empresas.has(String(x.empresa||"").padStart(2,"0")));
  }
  if(ignorarDim!=="periodo" && FCP_FILTROS.periodos.size){
    arr=arr.filter(x=>fcpDataEmPeriodos(x.data));
  }
  if(ignorarDim!=="plano" && FCP_FILTROS.planos.size && tipo!=="previsao"){
    arr=arr.filter(x=>FCP_FILTROS.planos.has(String(x.item||"").padStart(3,"0")));
  }

  // A previsão de venda do ano anterior não possui vínculo técnico seguro com um plano financeiro.
  // Quando há filtro por plano, não atribuímos essa previsão ao plano selecionado.
  if(tipo==="previsao" && ignorarDim!=="plano" && FCP_FILTROS.planos.size){
    arr=[];
  }

  if(ignorarDim!=="lado" && FCP_FILTROS.lados.size){
    const aceitaAtivo = FCP_FILTROS.lados.has("ativo");
    const aceitaPassivo = FCP_FILTROS.lados.has("passivo");
    const aceitaLiquido = FCP_FILTROS.lados.has("liquido");
    if(tipo==="pagar" && !(aceitaPassivo || aceitaLiquido)) arr=[];
    if((tipo==="receber" || tipo==="previsao") && !(aceitaAtivo || aceitaLiquido)) arr=[];
  }

  if(ignorarDim!=="forma" && FCP_FILTROS.formas.size){
    if(tipo==="receber"){
      arr=arr.filter(x=>FCP_FILTROS.formas.has(String(x.forma_pagamento||"OUTROS")));
    }else if(tipo==="previsao"){
      // A previsão histórica representa venda à vista.
      if(!FCP_FILTROS.formas.has("A VISTA")) arr=[];
    }
    // "pagar" não é zerado por uma forma de recebimento; ele continua
    // respondendo aos filtros comuns (empresa, período, plano, cards etc.).
  }

  if(ignorarDim!=="fornecedor" && FCP_FILTROS.fornecedores.size){
    if(tipo==="pagar"){
      arr=arr.filter(x=>FCP_FILTROS.fornecedores.has(String(x.fornecedor||"SEM FORNECEDOR")));
    }
    // "receber" e "previsao" não são zerados por fornecedor, pois não há
    // vínculo técnico seguro. Eles continuam obedecendo aos filtros comuns.
  }
  return arr;
}

function fcpResumoFiltrado(){
  const rec=fcpFiltrarFatos("receber");
  const pag=fcpFiltrarFatos("pagar");
  const prev=fcpFiltrarFatos("previsao");

  const venc=rec.filter(x=>x.faixa==="VENCIDO90").reduce((s,x)=>s+Number(x.valor||0),0);
  const avencer=rec.filter(x=>x.faixa==="AVENCER").reduce((s,x)=>s+Number(x.valor||0),0);
  const pagar=pag.reduce((s,x)=>s+Number(x.valor||0),0);
  const avista=prev.reduce((s,x)=>s+Number(x.valor_avista||0),0);
  const aprazo=prev.reduce((s,x)=>s+Number(x.valor_aprazo||0),0);
  const totalPrev=prev.reduce((s,x)=>s+Number(x.valor_total||0),0);

  const saldoOriginal=Number(FCP_DADOS?.resumo?.saldoContasCaixa||0);
  const temFiltroLado=FCP_FILTROS.lados.size>0;
  const usarCaixa=!temFiltroLado || FCP_FILTROS.lados.has("caixa") || FCP_FILTROS.lados.has("liquido");
  const saldoManual=usarCaixa ? saldoOriginal : 0;

  // Regra do projeto: somente a venda À VISTA do mesmo período do ano passado
  // entra como previsão histórica. Venda a prazo do ano passado não participa.
  const ativo=saldoManual+venc+avencer+avista;
  const liquido=ativo-pagar;

  const dataInicio=FCP_DADOS?.regra?.dataInicioEfetiva || hojeISO();
  const d0=fcpDataLocal(dataInicio) || new Date();
  const pag7=pag.filter(x=>{
    const d=fcpDataLocal(x.data); if(!d) return false;
    const dif=Math.round((d-d0)/86400000); return dif>=0 && dif<=7;
  }).reduce((s,x)=>s+Number(x.valor||0),0);
  const pag30=pag.filter(x=>{
    const d=fcpDataLocal(x.data); if(!d) return false;
    const dif=Math.round((d-d0)/86400000); return dif>=8 && dif<=30;
  }).reduce((s,x)=>s+Number(x.valor||0),0);

  return {
    saldoContasCaixa:saldoManual,
    receberVencido90:venc,
    receberAVencer:avencer,
    receberTotalAtivo:venc+avencer+avista,
    passivoProjetado:pagar,
    previstoAvistaAnoPassado:avista,
    previstoAprazoAnoPassado:0,
    previstoTotalAnoPassado:avista,
    pagar7Dias:pag7,pagar8a30:pag30,
    ativoFinanceiro:ativo,posicaoLiquida:liquido
  };
}

function fcpDiarioFiltrado(ignorarDim=""){
  const rec=fcpFiltrarFatos("receber",ignorarDim).filter(x=>x.faixa==="AVENCER");
  const pag=fcpFiltrarFatos("pagar",ignorarDim);
  const prev=fcpFiltrarFatos("previsao",ignorarDim);
  const map=new Map();

  const add=(data,campo,valor)=>{
    const key=String(data||"").slice(0,10);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    if(!map.has(key)) map.set(key,{data:key,receber:0,previstoAvista:0,pagar:0});
    map.get(key)[campo]+=Number(valor||0);
  };
  rec.forEach(x=>add(x.data,"receber",x.valor));
  pag.forEach(x=>add(x.data,"pagar",x.valor));
  prev.forEach(x=>add(x.data,"previstoAvista",x.valor_avista));

  const ini=FCP_DADOS?.regra?.dataInicioEfetiva;
  const fim=FCP_DADOS?.regra?.dataFim;
  if(ini && fim){
    let d=fcpDataLocal(ini), f=fcpDataLocal(fim);
    while(d && f && d<=f){ add(fcpISO(d),"receber",0); d.setDate(d.getDate()+1); }
  }

  const saldoOriginal=Number(FCP_DADOS?.resumo?.saldoContasCaixa||0);
  const temFiltroLado=FCP_FILTROS.lados.size>0;
  const usarCaixa=!temFiltroLado || FCP_FILTROS.lados.has("caixa") || FCP_FILTROS.lados.has("liquido");
  let saldo=usarCaixa ? saldoOriginal : 0;
  return [...map.values()].sort((a,b)=>a.data.localeCompare(b.data)).map(x=>{
    const saldoInicial=saldo;
    const entradas=Number(x.receber||0)+Number(x.previstoAvista||0);
    const resultado=entradas-Number(x.pagar||0);
    saldo+=resultado;
    return {...x,saldoInicial,entradas,resultado,saldoProjetado:saldo};
  });
}

function fcpFaixaAgrupada(data,tipo){
  const d=fcpDataLocal(data);
  if(!d) return {ini:String(data||""),fim:String(data||""),label:String(data||"")};
  if(tipo==="dia"){
    const k=fcpISO(d); return {ini:k,fim:k,label:d.toLocaleDateString("pt-BR")};
  }
  if(tipo==="semana"){
    const ini=new Date(d), dow=(ini.getDay()+6)%7; ini.setDate(ini.getDate()-dow);
    const fim=new Date(ini); fim.setDate(fim.getDate()+6);
    return {ini:fcpISO(ini),fim:fcpISO(fim),label:`${ini.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})} a ${fim.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}`};
  }
  if(tipo==="quinzena"){
    const ini=new Date(d.getFullYear(),d.getMonth(),d.getDate()<=15?1:16);
    const fim=d.getDate()<=15?new Date(d.getFullYear(),d.getMonth(),15):new Date(d.getFullYear(),d.getMonth()+1,0);
    return {ini:fcpISO(ini),fim:fcpISO(fim),label:`${d.getDate()<=15?"1ª":"2ª"} quinzena • ${d.toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}`};
  }
  const ini=new Date(d.getFullYear(),d.getMonth(),1), fim=new Date(d.getFullYear(),d.getMonth()+1,0);
  return {ini:fcpISO(ini),fim:fcpISO(fim),label:d.toLocaleDateString("pt-BR",{month:"short",year:"numeric"})};
}

function fcpAgruparSerie(diario,tipo){
  const map=new Map();
  diario.forEach(x=>{
    const f=fcpFaixaAgrupada(x.data,tipo);
    const chave=`${f.ini}|${f.fim}`;
    if(!map.has(chave)) map.set(chave,{periodo:chave,periodoFmt:f.label,rangeStart:f.ini,rangeEnd:f.fim,receber:0,previstoAvista:0,pagar:0});
    const b=map.get(chave);
    b.receber+=Number(x.receber||0); b.previstoAvista+=Number(x.previstoAvista||0); b.pagar+=Number(x.pagar||0);
  });
  const saldoOriginal=Number(FCP_DADOS?.resumo?.saldoContasCaixa||0);
  const temFiltroLado=FCP_FILTROS.lados.size>0;
  const usarCaixa=!temFiltroLado || FCP_FILTROS.lados.has("caixa") || FCP_FILTROS.lados.has("liquido");
  let saldo=usarCaixa ? saldoOriginal : 0;
  return [...map.values()].sort((a,b)=>a.rangeStart.localeCompare(b.rangeStart)).map(x=>{
    const saldoInicial=saldo, entradas=x.receber+x.previstoAvista, resultado=entradas-x.pagar;
    saldo+=resultado;
    return {...x,saldoInicial,entradas,resultado,saldoProjetado:saldo};
  });
}

function fcpSelecionarPeriodo(ini,fim){
  fcpToggleSet(FCP_FILTROS.periodos,`${ini}|${fim}`);
  fcpRenderTudoCruzado();
}
function fcpSelecionarEmpresa(membrosJson){
  let membros=[];
  try{ membros=JSON.parse(decodeURIComponent(membrosJson)); }catch(_){}
  const todosSelecionados=membros.length && membros.every(x=>FCP_FILTROS.empresas.has(String(x).padStart(2,"0")));
  membros.forEach(x=>{
    const cod=String(x).padStart(2,"0");
    if(todosSelecionados) FCP_FILTROS.empresas.delete(cod); else FCP_FILTROS.empresas.add(cod);
  });
  fcpRenderTudoCruzado();
}
function fcpSelecionarPlano(codigo){
  fcpToggleSet(FCP_FILTROS.planos,String(codigo||"").padStart(3,"0"));
  fcpRenderTudoCruzado();
}

function fcpSelecionarPlanosGrupo(codigosEncoded){
  let codigos=[];
  try{ codigos=JSON.parse(decodeURIComponent(String(codigosEncoded||""))); }catch(_){}
  codigos=(Array.isArray(codigos)?codigos:[])
    .map(c=>String(c||"").padStart(3,"0")).filter(Boolean);
  if(!codigos.length) return;
  const todosSelecionados=codigos.every(c=>FCP_FILTROS.planos.has(c));
  codigos.forEach(c=>{
    if(todosSelecionados) FCP_FILTROS.planos.delete(c);
    else FCP_FILTROS.planos.add(c);
  });
  fcpRenderTudoCruzado();
}
function fcpSelecionarLado(lado){
  fcpToggleSet(FCP_FILTROS.lados,lado);
  fcpRenderTudoCruzado();
}

function fcpLimparFiltrosCruzados(render=true){
  FCP_FILTROS.periodos.clear();
  FCP_FILTROS.empresas.clear();
  FCP_FILTROS.planos.clear();
  FCP_FILTROS.lados.clear();
  FCP_FILTROS.formas.clear();
  FCP_FILTROS.fornecedores.clear();
  if(render && FCP_DADOS) fcpRenderTudoCruzado();
}

function fcpAtualizarFaixaFiltros(){
  const el=document.getElementById("fcpFiltrosAtivosTexto");
  if(!el) return;
  const partes=[];
  if(FCP_FILTROS.periodos.size) partes.push(`${FCP_FILTROS.periodos.size} período(s)`);
  if(FCP_FILTROS.empresas.size) partes.push(`${FCP_FILTROS.empresas.size} empresa(s)`);
  if(FCP_FILTROS.planos.size) partes.push(`${FCP_FILTROS.planos.size} plano(s)`);
  if(FCP_FILTROS.formas.size) partes.push(`${FCP_FILTROS.formas.size} forma(s) de recebimento`);
  if(FCP_FILTROS.fornecedores.size) partes.push(`${FCP_FILTROS.fornecedores.size} fornecedor(es)`);
  if(FCP_FILTROS.lados.size) partes.push([...FCP_FILTROS.lados].map(x=>{
    if(x==="ativo") return "Ativo";
    if(x==="passivo") return "Passivo";
    if(x==="caixa") return "Contas/Caixa";
    if(x==="liquido") return "Posição Líquida";
    return x;
  }).join(" + "));
  el.textContent=partes.length?partes.join(" • "):"Nenhuma seleção nos gráficos.";
  document.getElementById("fcpFiltrosAtivos")?.classList.toggle("has-filter",!!partes.length);
}

function fcpRenderCardsResumo(){
  const diasVencido = Math.max(0, Math.min(365, Number(document.getElementById("fcpHorizonte")?.value || 90)));
  const labelVencido = document.getElementById("fcpLabelVencido");
  if(labelVencido) labelVencido.textContent = `Vencido até ${diasVencido} dias`;

  const r=fcpResumoFiltrado();
  fcpSetMoeda("fcpAtivo",r.ativoFinanceiro);
  fcpSetMoeda("fcpPassivo",r.passivoProjetado);
  fcpSetMoeda("fcpCaixa",r.saldoContasCaixa);
  fcpSetMoeda("fcpLiquido",r.posicaoLiquida,true);
  fcpSetMoeda("fcpRecVencido90",r.receberVencido90);
  fcpSetMoeda("fcpRecAVencer",r.receberAVencer);
  fcpSetMoeda("fcpRecTotal",r.receberTotalAtivo);
  fcpSetMoeda("fcpPag7",r.pagar7Dias);
  fcpSetMoeda("fcpPag30",r.pagar8a30);
  fcpSetMoeda("fcpPagTotal",r.passivoProjetado);
  fcpSetMoeda("fcpAvistaAnterior",r.previstoAvistaAnoPassado);
  fcpSetMoeda("fcpAprazoAnterior",r.previstoAprazoAnoPassado);
  fcpSetMoeda("fcpTotalAnterior",r.previstoTotalAnoPassado);
  renderFluxoProjetadoAtivoPassivo(r);

  document.getElementById("fcpCardAtivo")?.classList.toggle("fcp-selected",FCP_FILTROS.lados.has("ativo"));
  document.getElementById("fcpCardPassivo")?.classList.toggle("fcp-selected",FCP_FILTROS.lados.has("passivo"));
  document.getElementById("fcpCardLiquido")?.classList.toggle("fcp-selected",FCP_FILTROS.lados.has("liquido"));
}

function fcpSelecionarFormaReceber(valor){
  fcpToggleSet(FCP_FILTROS.formas,String(valor||"OUTROS"));
  fcpRenderTudoCruzado();
}

function fcpSelecionarFornecedorPagar(valor){
  fcpToggleSet(FCP_FILTROS.fornecedores,String(valor||"SEM FORNECEDOR"));
  fcpRenderTudoCruzado();
}

function fcpRenderFormasReceber(){
  const tbody=document.getElementById("fcpFormasTbody");
  if(!tbody) return;
  const map=new Map();

  fcpFiltrarFatos("receber","forma").forEach(x=>{
    const nome=String(x.forma_pagamento||"OUTROS");
    map.set(nome,(map.get(nome)||0)+Number(x.valor||0));
  });

  const lista=[...map.entries()]
    .filter(([,v])=>Math.abs(Number(v||0))>0.00001)
    .sort((a,b)=>b[1]-a[1]);

  tbody.innerHTML=lista.length ? lista.map(([nome,valor])=>{
    const sel=FCP_FILTROS.formas.has(nome);
    const payload=encodeURIComponent(nome);
    return `<tr class="${sel?"fcp-selected":""}" onclick="event.stopPropagation();fcpSelecionarFormaReceber(decodeURIComponent('${payload}'))">
      <td>${fcpEsc(nome)}</td><td class="num">${fmtMoeda(valor)}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="2" class="empty">Sem contas a receber no filtro atual.</td></tr>`;

  const total=lista.reduce((s,[,v])=>s+Number(v||0),0);
  const totalEl=document.getElementById("fcpFormasTotal");
  if(totalEl) totalEl.textContent=fmtMoeda(total);
}

function fcpRenderFornecedoresPagar(){
  const tbody=document.getElementById("fcpFornecedoresTbody");
  if(!tbody) return;
  const map=new Map();

  fcpFiltrarFatos("pagar","fornecedor").forEach(x=>{
    const nome=String(x.fornecedor||"SEM FORNECEDOR");
    map.set(nome,(map.get(nome)||0)+Number(x.valor||0));
  });

  const lista=[...map.entries()]
    .filter(([,v])=>Math.abs(Number(v||0))>0.00001)
    .sort((a,b)=>b[1]-a[1]);

  tbody.innerHTML=lista.length ? lista.map(([nome,valor])=>{
    const sel=FCP_FILTROS.fornecedores.has(nome);
    const payload=encodeURIComponent(nome);
    return `<tr class="${sel?"fcp-selected":""}" onclick="event.stopPropagation();fcpSelecionarFornecedorPagar(decodeURIComponent('${payload}'))">
      <td>${fcpEsc(nome)}</td><td class="num">${fmtMoeda(valor)}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="2" class="empty">Sem contas a pagar no filtro atual.</td></tr>`;

  const total=lista.reduce((s,[,v])=>s+Number(v||0),0);
  const totalEl=document.getElementById("fcpFornecedoresTotal");
  if(totalEl) totalEl.textContent=fmtMoeda(total);
}

function fcpRenderInsightsFiltrados(){
  const r=fcpResumoFiltrado();
  const serie=fcpAgruparSerie(fcpDiarioFiltrado(),"mes");
  const alertas=[];
  if(r.receberVencido90>0) alertas.push({nivel:"atencao",titulo:"Recebíveis vencidos no filtro",texto:`${fmtMoeda(r.receberVencido90)} vencidos há no máximo 90 dias.`});
  const neg=serie.find(x=>Number(x.saldoProjetado||0)<0);
  if(neg) alertas.push({nivel:"risco",titulo:"Risco de caixa",texto:`Saldo projetado negativo em ${neg.periodoFmt}: ${fmtMoeda(neg.saldoProjetado)}.`});
  else alertas.push({nivel:"ok",titulo:"Caixa projetado positivo",texto:"A projeção filtrada não cruza o saldo zero."});
  if(FCP_FILTROS.planos.size) alertas.push({nivel:"atencao",titulo:"Previsão à vista sob filtro de plano",texto:"A venda do ano anterior não possui vínculo técnico direto com o plano financeiro; por segurança, ela é retirada quando um plano é selecionado."});
  renderFluxoProjetadoInsights(alertas);
}

function fcpRenderTudoCruzado(){
  if(!FCP_DADOS) return;
  fcpAtualizarFaixaFiltros();
  fcpRenderCardsResumo();
  renderFluxoProjetadoMapaAtual();
  renderFluxoProjetadoCurvaAtual();
  fcpRenderFormasReceber();
  fcpRenderFornecedoresPagar();
  fcpRenderInsightsFiltrados();
  renderFluxoProjetadoEmpresas(FCP_DADOS.empresas||[]);
  renderFluxoProjetadoPlanosAtual();
}

function fcpDataLocal(iso){
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? new Date(Number(m[1]),Number(m[2])-1,Number(m[3])) : null;
}

function fcpISO(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fcpChavePeriodo(isoData, tipo){
  const d=fcpDataLocal(isoData);
  if(!d) return {chave:String(isoData||""),label:String(isoData||"-"),ordem:String(isoData||"")};

  if(tipo==="dia"){
    return {chave:fcpISO(d),label:d.toLocaleDateString("pt-BR"),ordem:fcpISO(d)};
  }
  if(tipo==="semana"){
    const ini=new Date(d), dow=(ini.getDay()+6)%7;
    ini.setDate(ini.getDate()-dow);
    const fim=new Date(ini); fim.setDate(fim.getDate()+6);
    return {
      chave:"S-"+fcpISO(ini),
      label:`${ini.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})} a ${fim.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}`,
      ordem:fcpISO(ini)
    };
  }
  if(tipo==="quinzena"){
    const q=d.getDate()<=15?1:2;
    const ini=new Date(d.getFullYear(),d.getMonth(),q===1?1:16);
    const fim=q===1?new Date(d.getFullYear(),d.getMonth(),15):new Date(d.getFullYear(),d.getMonth()+1,0);
    return {
      chave:`Q-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${q}`,
      label:`${q}ª quinzena • ${d.toLocaleDateString("pt-BR",{month:"short",year:"numeric"})}`,
      ordem:fcpISO(ini)
    };
  }
  const ini=new Date(d.getFullYear(),d.getMonth(),1);
  return {
    chave:`M-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,
    label:d.toLocaleDateString("pt-BR",{month:"short",year:"numeric"}),
    ordem:fcpISO(ini)
  };
}

function fcpAgruparDiario(tipo){
  return fcpAgruparSerie(fcpDiarioFiltrado(),tipo);
}

function renderFluxoProjetadoMapaAtual(){
  const tipo=document.getElementById("fcpDetalheMapa")?.value || "mes";
  renderFluxoProjetadoTabela(fcpAgruparDiario(tipo));
}

function renderFluxoProjetadoCurvaAtual(){
  const tipo=document.getElementById("fcpDetalheCurva")?.value || "mes";
  renderFluxoProjetadoCurva(fcpAgruparDiario(tipo));
}

function renderFluxoProjetadoTabela(lista){
  const tbody = document.getElementById("fcpTbody");
  if(!tbody) return;

  if(!Array.isArray(lista) || !lista.length){
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Sem movimentos para o período selecionado.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(x => {
    const faixa=`${x.rangeStart||""}|${x.rangeEnd||""}`;
    const sel=FCP_FILTROS.periodos.has(faixa) ? "fcp-selected" : "";
    return `
    <tr class="${sel}" onclick="fcpSelecionarPeriodo('${fcpEsc(x.rangeStart||"")}','${fcpEsc(x.rangeEnd||"")}')">
      <td>${fcpEsc(x.periodoFmt || x.periodo || "-")}</td>
      <td class="num">${fmtMoeda(x.saldoInicial || 0)}</td>
      <td class="num">${fmtMoeda(x.receber || 0)}</td>
      <td class="num">${fmtMoeda(x.previstoAvista || 0)}</td>
      <td class="num">${fmtMoeda(x.pagar || 0)}</td>
      <td class="num ${(Number(x.resultado || 0) < 0) ? "fcp-negativo" : "fcp-positivo"}">${fmtMoeda(x.resultado || 0)}</td>
      <td class="num ${(Number(x.saldoProjetado || 0) < 0) ? "fcp-negativo" : "fcp-positivo"}">${fmtMoeda(x.saldoProjetado || 0)}</td>
      <td><span class="fcp-status ${(Number(x.saldoProjetado || 0) < 0) ? "risco" : "ok"}">${Number(x.saldoProjetado || 0) < 0 ? "RISCO" : "SAUDÁVEL"}</span></td>
    </tr>`;
  }).join("");
}

function fcpPolyline(valores, width, height, pad){
  if(!valores.length) return "";
  const nums = valores.map(Number);
  let min = Math.min(...nums, 0);
  let max = Math.max(...nums, 0);
  if(max === min){ max += 1; min -= 1; }
  return nums.map((v,i) => {
    const x = pad + (valores.length === 1 ? 0 : i * (width - pad*2)/(valores.length-1));
    const y = pad + (max - v) * (height - pad*2)/(max-min);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function renderFluxoProjetadoCurva(lista){
  const box = document.getElementById("fcpCurva");
  if(!box) return;
  if(!lista.length){
    box.innerHTML = `<div class="empty">Sem dados para desenhar a projeção.</div>`;
    return;
  }

  // A largura acompanha a área visível. Só cresce além dela quando houver
  // períodos suficientes; nesse caso a rolagem acontece APENAS dentro da curva.
  const colW = 185;
  const padX = 92;
  const padTop = 42;
  const padBottom = 55;
  const larguraVisivel = Math.max(760, Math.floor(box.clientWidth || 1000));
  const larguraPorPeriodos = padX*2 + Math.max(1,lista.length-1)*colW;
  const width = Math.max(larguraVisivel, larguraPorPeriodos);
  const height = 400;
  const chartTop = padTop;
  const chartBottom = height-padBottom;

  const entradas = lista.map(x=>Number(x.entradas||0));
  const saidas = lista.map(x=>Number(x.pagar||0));
  const saldos = lista.map(x=>Number(x.saldoProjetado||0));

  // Mesma escala para as três linhas.
  const todos=[...entradas,...saidas,...saldos,0];
  let min=Math.min(...todos), max=Math.max(...todos);
  if(max===min){max+=1;min-=1;}
  const folga=Math.max(1,(max-min)*0.14);
  max+=folga; min-=folga;

  const xAt=i=>lista.length===1 ? width/2 : padX+i*(width-padX*2)/(lista.length-1);
  const yAt=v=>chartTop+(max-Number(v||0))*(chartBottom-chartTop)/(max-min);
  const pts=valores=>valores.map((v,i)=>`${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(" ");

  const pe=pts(entradas), ps=pts(saidas);

  const fmtGrafico=v=>{
    const n=Number(v||0), a=Math.abs(n);
    if(a>=1000000) return `R$ ${(n/1000000).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})} mi`;
    if(a>=1000) return `R$ ${(n/1000).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})} mil`;
    return fmtMoeda(n);
  };

  // Semáforo do saldo projetado:
  // vermelho = abaixo de zero;
  // amarelo = positivo, mas até 10% do maior saldo absoluto do horizonte;
  // verde = acima dessa faixa de atenção.
  const maiorSaldoAbsoluto=Math.max(1,...saldos.map(v=>Math.abs(Number(v||0))));
  const limiteAmarelo=maiorSaldoAbsoluto*0.10;

  function classeSaldo(valor){
    const n=Number(valor||0);
    if(n<0) return "vermelho";
    if(n<=limiteAmarelo) return "amarelo";
    return "verde";
  }

  // A linha do saldo é desenhada por trechos pontuados. Cada trecho usa a
  // situação do saldo no ponto final, deixando a mudança de cor visível.
  const saldoSegmentos=saldos.slice(1).map((valor,i)=>{
    const x1=xAt(i), y1=yAt(saldos[i]);
    const x2=xAt(i+1), y2=yAt(valor);
    const classe=classeSaldo(valor);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      class="fcp-saldo-segmento ${classe}"/>`;
  }).join("");

  // Quando existe apenas um ponto, ainda mostramos um pequeno traço pontuado.
  const saldoPontoUnico=saldos.length===1
    ? `<line x1="${xAt(0)-28}" y1="${yAt(saldos[0])}" x2="${xAt(0)+28}" y2="${yAt(saldos[0])}"
        class="fcp-saldo-segmento ${classeSaldo(saldos[0])}"/>`
    : "";

  // Evita que Entrada, Saída e Saldo se cubram na mesma coluna.
  function labelsColuna(i){
    const itens=[
      {y:yAt(entradas[i]),valor:entradas[i],classe:"entrada"},
      {y:yAt(saidas[i]),valor:saidas[i],classe:"saida"},
      {y:yAt(saldos[i]),valor:saldos[i],classe:`saldo ${classeSaldo(saldos[i])}`}
    ].sort((a,b)=>a.y-b.y);

    const distancia=26;
    for(let k=1;k<itens.length;k++){
      if(itens[k].y-itens[k-1].y<distancia) itens[k].y=itens[k-1].y+distancia;
    }
    const ultimo=itens[itens.length-1];
    if(ultimo.y>chartBottom-10){
      const desloca=ultimo.y-(chartBottom-10);
      itens.forEach(x=>x.y-=desloca);
    }
    if(itens[0].y<chartTop+12){
      const desloca=(chartTop+12)-itens[0].y;
      itens.forEach(x=>x.y+=desloca);
    }

    const x=xAt(i);
    return itens.map(it=>`
      <text x="${x}" y="${it.y-8}" text-anchor="middle"
        class="fcp-value-label ${it.classe}">${fcpEsc(fmtGrafico(it.valor))}</text>
    `).join("");
  }

  const valoresSvg=lista.map((_,i)=>labelsColuna(i)).join("");

  const periodosSvg=lista.map((x,i)=>{
    const xPos=xAt(i);
    const faixa=`${x.rangeStart||""}|${x.rangeEnd||""}`;
    const selected=FCP_FILTROS.periodos.has(faixa);
    return `<text x="${xPos}" y="${height-15}" text-anchor="middle"
      class="fcp-svg-label ${selected?"selected":""}">
      ${fcpEsc(x.periodoFmt||x.periodo)}
    </text>`;
  }).join("");

  // Faixa inteira clicável em cada período, sem bolinhas.
  const hitW=Math.max(90,Math.min(colW,(width-padX*2)/Math.max(lista.length,1)));
  const faixasSvg=lista.map((x,i)=>{
    const xPos=xAt(i);
    const faixa=`${x.rangeStart||""}|${x.rangeEnd||""}`;
    const selected=FCP_FILTROS.periodos.has(faixa);
    return `<rect x="${Math.max(0,xPos-hitW/2)}" y="${chartTop}" width="${hitW}" height="${chartBottom-chartTop}"
      class="fcp-click-band ${selected?"selected":""}"
      onclick="event.stopPropagation();fcpSelecionarPeriodo('${fcpEsc(x.rangeStart||"")}','${fcpEsc(x.rangeEnd||"")}')">
      <title>${fcpEsc(x.periodoFmt||x.periodo)} • clique para filtrar todos os gráficos, cards e tabelas</title>
    </rect>`;
  }).join("");

  const grid=[0,.25,.5,.75,1].map(p=>{
    const y=chartTop+p*(chartBottom-chartTop);
    return `<line x1="${padX}" y1="${y}" x2="${width-padX}" y2="${y}" class="fcp-grid-line"/>`;
  }).join("");

  box.innerHTML=`
    <svg class="fcp-svg fcp-svg-values" viewBox="0 0 ${width} ${height}"
      style="width:${width}px;min-width:${width}px;height:${height}px"
      role="img" aria-label="Curva do caixa projetado com valores por período">
      ${grid}
      ${faixasSvg}
      <polyline points="${pe}" class="fcp-line fcp-line-entrada"/>
      <polyline points="${ps}" class="fcp-line fcp-line-saida"/>
      ${saldoSegmentos}
      ${saldoPontoUnico}
      ${valoresSvg}
      ${periodosSvg}
    </svg>
  `;
}
function renderFluxoProjetadoAtivoPassivo(r){
  const el = document.getElementById("fcpAtivoPassivo");
  if(!el) return;
  const ativo = Math.max(0, Number(r.ativoFinanceiro || 0));
  const passivo = Math.max(0, Number(r.passivoProjetado || 0));
  const total = Math.max(ativo + passivo, 1);
  const pa = (ativo/total)*100;
  el.innerHTML = `
    <div class="fcp-donut" style="--fcp-ativo:${pa.toFixed(2)}%">
      <div class="fcp-donut-center">
        <small>Posição líquida</small>
        <strong class="${Number(r.posicaoLiquida || 0) < 0 ? "fcp-negativo" : "fcp-positivo"}">${fmtMoeda(r.posicaoLiquida || 0)}</strong>
      </div>
    </div>
    <div class="fcp-donut-info">
      <div class="fcp-donut-choice ${FCP_FILTROS.lados.has("ativo")?"selected":""}" onclick="event.stopPropagation();fcpSelecionarLado('ativo')"><span><i class="fcp-swatch ativo"></i>Ativo</span><strong>${fmtMoeda(ativo)}</strong></div>
      <div class="fcp-donut-choice ${FCP_FILTROS.lados.has("passivo")?"selected":""}" onclick="event.stopPropagation();fcpSelecionarLado('passivo')"><span><i class="fcp-swatch passivo"></i>Passivo</span><strong>${fmtMoeda(passivo)}</strong></div>
    </div>
  `;
}

function renderFluxoProjetadoContas(lista){
  const tbody = document.getElementById("fcpContasTbody");
  if(!tbody) return;
  if(!Array.isArray(lista) || !lista.length){
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Sem contas/bancos relacionados aos títulos da projeção.</td></tr>`;
    return;
  }
  tbody.innerHTML = lista.map(x => {
    const liquido = Number(x.receber || 0) - Number(x.pagar || 0);
    return `<tr>
      <td>${fcpEsc(x.contaBanco || "SEM CONTA/BANCO")}</td>
      <td class="num">${fmtMoeda(x.receber || 0)}</td>
      <td class="num">${fmtMoeda(x.pagar || 0)}</td>
      <td class="num ${liquido < 0 ? "fcp-negativo" : "fcp-positivo"}">${fmtMoeda(liquido)}</td>
    </tr>`;
  }).join("");
}

function renderFluxoProjetadoInsights(lista){
  const el = document.getElementById("fcpInsights");
  if(!el) return;
  if(!Array.isArray(lista) || !lista.length){
    el.innerHTML = `<div class="fcp-insight ok"><strong>Sem alertas críticos</strong><span>Nenhum ponto relevante encontrado no horizonte atual.</span></div>`;
    return;
  }
  el.innerHTML = lista.map(x => `
    <div class="fcp-insight ${fcpEsc(x.nivel || "info")}">
      <strong>${fcpEsc(x.titulo || "Análise")}</strong>
      <span>${fcpEsc(x.texto || "")}</span>
    </div>
  `).join("");
}



function renderFluxoProjetadoEmpresas(listaBase){
  const box=document.getElementById("fcpEmpresasGrafico");
  if(!box) return;
  const bases=Array.isArray(listaBase)?listaBase:[];
  if(!bases.length){
    box.innerHTML=`<div class="empty">Sem dados consolidados por empresa no período selecionado.</div>`;
    return;
  }

  const rec=fcpFiltrarFatos("receber","empresa").filter(x=>x.faixa==="AVENCER");
  const pag=fcpFiltrarFatos("pagar","empresa");
  const prev=fcpFiltrarFatos("previsao","empresa");

  const somaPorEmp=(arr,campoValor)=>{
    const m=new Map();
    arr.forEach(x=>{
      const e=String(x.empresa||"").padStart(2,"0");
      m.set(e,(m.get(e)||0)+Number(x[campoValor]||0));
    });
    return m;
  };
  const mr=somaPorEmp(rec,"valor"), mp=somaPorEmp(pag,"valor"), mv=somaPorEmp(prev,"valor_avista");

  const lista=bases.map(b=>{
    const membros=Array.isArray(b.membros)&&b.membros.length?b.membros:[b.empresa];
    let receber=0,pagar=0,avista=0;
    membros.forEach(e=>{
      const cod=String(e||"").padStart(2,"0");
      receber+=mr.get(cod)||0;
      pagar+=mp.get(cod)||0;
      avista+=mv.get(cod)||0;
    });
    const entradas=receber+avista;
    return {...b,membros,receber,pagar,previstoAvista:avista,entradas,resultado:entradas-pagar};
  }).filter(x=>{
    // 1) Exibe somente lojas/grupos consolidados com movimento nos filtros atuais.
    const temMovimento =
      Math.abs(Number(x.entradas||0))>0.00001 ||
      Math.abs(Number(x.pagar||0))>0.00001;

    if(!temMovimento) return false;

    // 2) Empresas INDIVIDUAIS com "DESATIV" no nome não aparecem,
    // mesmo que ainda possuam títulos/movimentos históricos ou futuros.
    // Grupos consolidados não são excluídos por esta regra.
    const membros=Array.isArray(x.membros)&&x.membros.length ? x.membros : [x.empresa];
    const ehIndividual=membros.length<=1;
    const nomeLoja=String(
      x.nomePrincipal ||
      x.nome_principal ||
      x.descricaoPrincipal ||
      x.descricao ||
      ""
    ).toUpperCase();

    if(ehIndividual && nomeLoja.includes("DESATIV")){
      return false;
    }

    return true;
  });

  if(!lista.length){
    box.innerHTML=`<div class="empty">Nenhuma loja com movimento nos filtros atuais.</div>`;
    return;
  }

  const max=Math.max(1,...lista.flatMap(x=>[
    Math.abs(Number(x.entradas||0)),Math.abs(Number(x.pagar||0)),Math.abs(Number(x.resultado||0))
  ]));

  box.innerHTML=lista.map(x=>{
    const ent=Number(x.entradas||0), pag=Number(x.pagar||0), res=Number(x.resultado||0);
    const wE=Math.max(1,Math.abs(ent)/max*100), wP=Math.max(1,Math.abs(pag)/max*100), wR=Math.max(1,Math.abs(res)/max*100);
    const membros=x.membros||[];
    const selecionado=membros.length && membros.every(e=>FCP_FILTROS.empresas.has(String(e).padStart(2,"0")));
    const nomePrincipal=String(x.nomePrincipal||x.nome_principal||x.descricaoPrincipal||"").trim();
    const detalheGrupo=membros.length>1
      ? `Consolida: ${membros.join(" • ")}`
      : "Empresa individual";
    const payload=encodeURIComponent(JSON.stringify(membros));
    return `<div class="fcp-company-row ${selecionado?"fcp-selected":""}" onclick="event.stopPropagation();fcpSelecionarEmpresa('${payload}')">
      <div class="fcp-company-ident">
        <div class="fcp-company-name">${fcpEsc(x.rotulo||("Loja "+String(x.empresa||"").padStart(2,"0")))}</div>
        ${nomePrincipal ? `<div class="fcp-company-main-store">${fcpEsc(nomePrincipal)}</div>` : ``}
        <small>${fcpEsc(detalheGrupo)}</small>
      </div>
      <div class="fcp-company-bars">
        <div><span>Entradas</span><i class="ent" style="width:${wE}%"></i><b>${fmtMoeda(ent)}</b></div>
        <div><span>Saídas</span><i class="pag" style="width:${wP}%"></i><b>${fmtMoeda(pag)}</b></div>
        <div><span>Resultado</span><i class="${res<0?"neg":"res"}" style="width:${wR}%"></i><b class="${res<0?"fcp-negativo":"fcp-positivo"}">${fmtMoeda(res)}</b></div>
      </div>
    </div>`;
  }).join("");
}

function fcpNivelEstrutura(estrutura){
  const s=String(estrutura||"").trim();
  if(!s) return 1;
  return s.split(".").filter(Boolean).length;
}

function fcpToggleGrupoPlano(estrutura){
  const chave=String(estrutura||"").trim();
  if(!chave) return;
  if(FCP_PLANOS_ABERTOS.has(chave)) FCP_PLANOS_ABERTOS.delete(chave);
  else FCP_PLANOS_ABERTOS.add(chave);
  renderFluxoProjetadoPlanosAtual();
}

function fcpEstruturaPai(estrutura){
  const p=String(estrutura||"").trim().split(".").filter(Boolean);
  return p.length>1 ? p.slice(0,-1).join(".") : "";
}


function fcpNormalizarBuscaPlano(v){
  return String(v||"")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toUpperCase()
    .trim();
}

function fcpLimparFiltroDescricaoPlano(){
  const el=document.getElementById("fcpFiltroDescricaoPlano");
  if(el) el.value="";
  renderFluxoProjetadoPlanosAtual();
}

function renderFluxoProjetadoPlanosAtual(){
  const box=document.getElementById("fcpPlanosFluxo");
  if(!box) return;
  const meta=Array.isArray(FCP_DADOS?.planos)?FCP_DADOS.planos:[];
  if(!meta.length){
    box.innerHTML='<div class="empty">Sem movimento em planos de conta no período.</div>';
    return;
  }

  const rec=fcpFiltrarFatos("receber","plano");
  const pag=fcpFiltrarFatos("pagar","plano");

  const movimento=new Map();
  const add=(codigo,campo,valor)=>{
    const c=String(codigo||"").padStart(3,"0");
    const o=movimento.get(c)||{entrada:0,saida:0};
    o[campo]+=Number(valor||0);
    movimento.set(c,o);
  };
  rec.forEach(x=>add(x.item,"entrada",x.valor));
  pag.forEach(x=>add(x.item,"saida",x.valor));

  meta.forEach(x=>{
    const c=String(x.codigo||"").padStart(3,"0");
    const o=movimento.get(c)||{entrada:0,saida:0};
    if(!o.entrada) o.entrada=Number(x.entrada||0);
    if(!o.saida) o.saida=Number(x.saida||0);
    movimento.set(c,o);
  });

  const porEstrutura=new Map();
  meta.forEach(x=>{
    const estrutura=String(x.estrutura||"").trim().replace(/\.+$/,"");
    if(!estrutura) return;
    const codigo=String(x.codigo||"").padStart(3,"0");
    porEstrutura.set(estrutura,{...x,codigo,estrutura,nivel:fcpNivelEstrutura(estrutura)});
  });

  const estruturasAtivas=new Set();
  porEstrutura.forEach((node,estrutura)=>{
    const v=movimento.get(node.codigo)||{entrada:0,saida:0};
    if(Math.abs(Number(v.entrada||0))>0.00001 || Math.abs(Number(v.saida||0))>0.00001){
      let atual=estrutura;
      while(atual){ estruturasAtivas.add(atual); atual=fcpEstruturaPai(atual); }
    }
  });

  [...estruturasAtivas].forEach(estrutura=>{
    if(!porEstrutura.has(estrutura)){
      porEstrutura.set(estrutura,{codigo:"",estrutura,descricao:`ESTRUTURA ${estrutura}`,movimento:"",nivel:fcpNivelEstrutura(estrutura)});
    }
  });

  // Filtro local do Fluxograma dos Planos de Conta.
  // Procura pela descrição e, por conveniência, também pela estrutura e código.
  const termoPlano=fcpNormalizarBuscaPlano(
    document.getElementById("fcpFiltroDescricaoPlano")?.value || ""
  );

  if(termoPlano){
    const encontrados=new Set();

    porEstrutura.forEach((node,estrutura)=>{
      if(!estruturasAtivas.has(estrutura)) return;

      const descricao=fcpNormalizarBuscaPlano(node.descricao);
      const estruturaBusca=fcpNormalizarBuscaPlano(estrutura);
      const codigoBusca=fcpNormalizarBuscaPlano(node.codigo);

      const bate=
        descricao.includes(termoPlano) ||
        estruturaBusca.includes(termoPlano) ||
        codigoBusca.includes(termoPlano);

      if(!bate) return;

      // Mantém o resultado e seus pais para preservar a hierarquia.
      let atual=estrutura;
      while(atual){
        encontrados.add(atual);
        atual=fcpEstruturaPai(atual);
      }

      // Se o resultado for um grupo/pai, mantém também seus descendentes com movimento.
      estruturasAtivas.forEach(e=>{
        if(e.startsWith(estrutura+".")) encontrados.add(e);
      });
    });

    estruturasAtivas.clear();
    encontrados.forEach(e=>estruturasAtivas.add(e));

    // Abre automaticamente os caminhos encontrados.
    [...estruturasAtivas].forEach(e=>{
      const temFilho=[...estruturasAtivas].some(x=>fcpEstruturaPai(x)===e);
      if(temFilho) FCP_PLANOS_ABERTOS.add(e);
    });
  }

  function codigosDescendentes(estrutura){
    const out=[];
    porEstrutura.forEach((node,e)=>{
      if((e===estrutura || e.startsWith(estrutura+".")) && node.codigo){
        const v=movimento.get(node.codigo)||{entrada:0,saida:0};
        if(Math.abs(Number(v.entrada||0))>0.00001 || Math.abs(Number(v.saida||0))>0.00001){
          out.push(String(node.codigo).padStart(3,"0"));
        }
      }
    });
    return [...new Set(out)];
  }

  function totaisEstrutura(estrutura){
    let entrada=0,saida=0;
    porEstrutura.forEach((node,e)=>{
      if(e===estrutura || e.startsWith(estrutura+".")){
        const v=movimento.get(node.codigo)||{entrada:0,saida:0};
        entrada+=Number(v.entrada||0);
        saida+=Number(v.saida||0);
      }
    });
    return {entrada,saida};
  }

  // Base percentual = exatamente o Ativo Financeiro mostrado no resumo do topo.
  // Assim entram na base todos os componentes do Ativo do filtro atual
  // (crediário/recebíveis, venda à vista do ano passado e demais entradas previstas).
  const resumoTopoPercentual=fcpResumoFiltrado();
  const baseAtivoTopo=Number(resumoTopoPercentual?.ativoFinanceiro||0);
  const fmtPerc=n=>`${Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1})}%`;

  function filhosDiretos(pai){
    return [...estruturasAtivas].filter(e=>fcpEstruturaPai(e)===pai)
      .sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true}));
  }

  function renderNode(estrutura){
    const node=porEstrutura.get(estrutura);
    if(!node) return "";
    const filhos=filhosDiretos(estrutura);
    const temFilhos=filhos.length>0;
    const aberto=FCP_PLANOS_ABERTOS.has(estrutura);
    const vals=totaisEstrutura(estrutura);
    const nivel=fcpNivelEstrutura(estrutura);
    const codigos=codigosDescendentes(estrutura);
    const todosSel=codigos.length && codigos.every(c=>FCP_FILTROS.planos.has(c));
    const payload=encodeURIComponent(JSON.stringify(codigos));
    const participacao=baseAtivoTopo>0 ? (Number(vals.saida||0)/baseAtivoTopo)*100 : 0;

    const linha=`<div class="fcp-plan-tree-row nivel-${nivel} ${temFilhos?"tem-filhos":""} ${aberto?"open":""} ${todosSel?"fcp-selected":""}"
      onclick="event.stopPropagation();fcpSelecionarPlanosGrupo('${payload}')"
      ondblclick="event.stopPropagation();fcpLimparFiltrosCruzados()"
      title="Clique na linha para filtrar todo o painel. Duplo clique limpa todas as seleções.">
      <button type="button" class="fcp-plan-arrow-btn"
        onclick="event.stopPropagation();${temFilhos?`fcpToggleGrupoPlano('${fcpEsc(estrutura)}')`:""}"
        title="${temFilhos?"Abrir/fechar próximo nível":"Sem subnível"}">
        ${temFilhos?(aberto?"▾":"▸"):"•"}
      </button>
      <span class="fcp-plan-tree-estrutura">${fcpEsc(estrutura)}</span>
      <strong class="fcp-plan-tree-desc">${fcpEsc(node.descricao||"SEM DESCRIÇÃO")}</strong>
      <span class="fcp-plan-tree-money entrada">${fmtMoeda(vals.entrada)}</span>
      <span class="fcp-plan-tree-money saida">${fmtMoeda(vals.saida)}</span>
      <span class="fcp-plan-tree-percent">${fmtPerc(participacao)}</span>
    </div>`;

    if(!temFilhos || !aberto) return linha;
    return linha+`<div class="fcp-plan-tree-children nivel-${nivel+1}">`+filhos.map(renderNode).join("")+`</div>`;
  }

  const raizes=[...estruturasAtivas].filter(e=>fcpNivelEstrutura(e)===1)
    .sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true}));

  // TOTAL do Fluxograma:
  // - Entrada e Saída: soma exata dos valores das linhas de 1º nível exibidas.
  // - Percentual: soma dos percentuais apresentados em cada linha.
  //   Não limita em 100%; pode ficar abaixo ou acima de 100%.
  const totalEntradaFluxograma=raizes.reduce((s,estrutura)=>{
    const v=totaisEstrutura(estrutura);
    return s+Number(v.entrada||0);
  },0);

  const totalSaidaFluxograma=raizes.reduce((s,estrutura)=>{
    const v=totaisEstrutura(estrutura);
    return s+Number(v.saida||0);
  },0);

  const totalPercentualFluxograma=raizes.reduce((s,estrutura)=>{
    const v=totaisEstrutura(estrutura);
    const pct=baseAtivoTopo>0 ? (Number(v.saida||0)/baseAtivoTopo)*100 : 0;
    return s+pct;
  },0);

  box.innerHTML=raizes.length
    ? `<div class="fcp-plan-tree-head">
        <span></span><span>Estrutura</span><span>Descrição</span><span>Entrada</span><span>Saída</span><span>% Saída / Entrada Total</span>
      </div>${raizes.map(renderNode).join("")}
      <div class="fcp-plan-tree-total">
        <span></span>
        <span></span>
        <strong>TOTAL</strong>
        <strong class="entrada">${fmtMoeda(totalEntradaFluxograma)}</strong>
        <strong class="saida">${fmtMoeda(totalSaidaFluxograma)}</strong>
        <strong class="percentual">${fmtPerc(totalPercentualFluxograma)}</strong>
      </div>
      <div class="fcp-plan-percent-base">Base do percentual: Ativo Financeiro do resumo = <strong>${fmtMoeda(baseAtivoTopo)}</strong></div>`
    : `<div class="empty">${termoPlano ? "Nenhum plano encontrado para a descrição informada." : "Nenhum plano teve movimento no filtro atual."}</div>`;
}

function exportarFluxoProjetadoCSV(){
  const tipo = document.getElementById("fcpDetalheMapa")?.value || "mes";
  const lista = fcpAgruparDiario(tipo);
  if(!lista.length){
    alert("Não há dados carregados para exportar.");
    return;
  }

  const cab = ["Período","Saldo Inicial","A Receber","À Vista Previsto","A Pagar","Resultado","Saldo Projetado","Status"];
  const rows = lista.map(x => [
    x.periodoFmt || x.periodo || "",
    Number(x.saldoInicial || 0),
    Number(x.receber || 0),
    Number(x.previstoAvista || 0),
    Number(x.pagar || 0),
    Number(x.resultado || 0),
    Number(x.saldoProjetado || 0),
    Number(x.saldoProjetado || 0) < 0 ? "RISCO" : "SAUDÁVEL"
  ]);

  const csv = [cab,...rows]
    .map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\ufeff"+csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fluxo-caixa-projetado-${hojeISO()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

window.carregarFluxoCaixaProjetado = carregarFluxoCaixaProjetado;
window.exportarFluxoProjetadoCSV = exportarFluxoProjetadoCSV;
window.fcpAplicarHorizonte = fcpAplicarHorizonte;
window.fcpFormatarSaldoInicial = fcpFormatarSaldoInicial;
window.renderFluxoProjetadoMapaAtual = renderFluxoProjetadoMapaAtual;
window.renderFluxoProjetadoCurvaAtual = renderFluxoProjetadoCurvaAtual;
window.renderFluxoProjetadoPlanosAtual = renderFluxoProjetadoPlanosAtual;
window.fcpLimparFiltroDescricaoPlano = fcpLimparFiltroDescricaoPlano;

function fcpAtualizarLabelVencido(){
  const dias = Math.max(0, Math.min(365, Number(document.getElementById("fcpHorizonte")?.value || 90)));
  const el = document.getElementById("fcpLabelVencido");
  if(el) el.textContent = `Vencido até ${dias} dias`;
}

window.fcpAtualizarLabelVencido = fcpAtualizarLabelVencido;
window.fcpSelecionarFormaReceber = fcpSelecionarFormaReceber;
window.fcpSelecionarFornecedorPagar = fcpSelecionarFornecedorPagar;
window.fcpToggleGrupoPlano = fcpToggleGrupoPlano;
window.fcpSelecionarPeriodo = fcpSelecionarPeriodo;
window.fcpSelecionarEmpresa = fcpSelecionarEmpresa;
window.fcpSelecionarPlano = fcpSelecionarPlano;
window.fcpSelecionarPlanosGrupo = fcpSelecionarPlanosGrupo;
window.fcpSelecionarLado = fcpSelecionarLado;
window.fcpLimparFiltrosCruzados = fcpLimparFiltrosCruzados;


// ============================================================
// FINANCEIRO CORPORATIVO - NAVEGAÇÃO E ACESSOS INDIVIDUAIS
// ============================================================

const FIN_MODULOS = {
  central_financeira: {
    aba: "geral",
    titulo: "Central Financeira",
    subtitulo: "Visão consolidada da operação financeira."
  },
  caixa_liquidez: {
    aba: "geral",
    titulo: "Caixa & Liquidez",
    subtitulo: "Entradas, saídas, saldos e projeções de caixa."
  },
  fluxo_caixa_projetado: {
    aba: "fluxo_projetado",
    titulo: "Fluxo de Caixa Projetado",
    subtitulo: "Ativo com recebíveis de até 90 dias vencidos e contas a pagar somente de hoje para frente."
  },
  contas_receber: {
    aba: "crediario",
    titulo: "Contas a Receber",
    subtitulo: "Carteira, recebimentos, vencimentos e inadimplência."
  },
  contas_pagar: {
    aba: "contas_pagar",
    titulo: "Contas a Pagar",
    subtitulo: "Obrigações, vencimentos, fornecedores e pagamentos."
  },
  bancos_conciliacao: {
    aba: "conciliacao",
    titulo: "Bancos & Conciliação",
    subtitulo: "Extratos, conciliação bancária e divergências."
  },
  resultado_gerencial: {
    aba: "dre_competencia",
    titulo: "Resultado Gerencial",
    subtitulo: "Análise por competência, metas e realizado."
  },
  resultado_caixa: {
    aba: "dre_caixa",
    titulo: "Resultado por Caixa",
    subtitulo: "Resultado financeiro conforme entradas e saídas efetivas."
  },
  margem_rentabilidade: {
    aba: "rentabilidade",
    titulo: "Margem & Rentabilidade",
    subtitulo: "Lucro bruto, margem e desempenho por produto, loja e venda."
  },
  posicao_financeira: {
    aba: "ativo_passivo",
    titulo: "Posição Financeira",
    subtitulo: "Visão consolidada de direitos, obrigações e exposição financeira."
  },
  capital_giro: {
    aba: "capital_giro",
    titulo: "Capital de Giro",
    subtitulo: "Necessidade de capital, ciclo financeiro e recursos operacionais."
  },
  projecoes: {
    aba: "projecoes",
    titulo: "Projeções",
    subtitulo: "Cenários futuros de caixa, recebimentos e pagamentos."
  }
};

let contextoFinanceiroAtual = "central_financeira";

// Futuramente esta lista será preenchida pela API de permissões.
// Enquanto não vier da API, preserva o comportamento atual do sistema.
let FIN_ACESSOS_USUARIO = null;

function definirContextoFinanceiro(modulo){
  if(!FIN_MODULOS[modulo]) return;

  contextoFinanceiroAtual = modulo;

  const cfg = FIN_MODULOS[modulo];
  const titulo = document.getElementById("financeContextTitle");
  const subtitulo = document.getElementById("financeContextSubtitle");

  if(titulo) titulo.textContent = cfg.titulo;
  if(subtitulo) subtitulo.textContent = cfg.subtitulo;

  document.querySelectorAll(".finance-nav-item").forEach(btn => {
    btn.classList.toggle(
      "active",
      btn.dataset.finModulo === modulo
    );
  });
}

function moduloFinanceiroPermitido(modulo){
  if(!Array.isArray(FIN_ACESSOS_USUARIO)) return true;
  return FIN_ACESSOS_USUARIO.includes(modulo);
}

function aplicarAcessosFinanceiro(lista){
  FIN_ACESSOS_USUARIO = Array.isArray(lista) ? lista : [];

  document.querySelectorAll("[data-fin-modulo]").forEach(el => {
    const modulo = el.dataset.finModulo;
    const permitido = moduloFinanceiroPermitido(modulo);

    el.classList.toggle("finance-module-blocked", !permitido);
    el.setAttribute("aria-hidden", permitido ? "false" : "true");
  });

  // Se a tela atual perder acesso, abre o primeiro módulo autorizado.
  if(!moduloFinanceiroPermitido(contextoFinanceiroAtual)){
    const primeiro = document.querySelector(
      ".finance-nav-item[data-fin-modulo]:not(.finance-module-blocked)"
    );

    if(primeiro){
      primeiro.click();
    }
  }
}

function abrirModuloFinanceiroPlanejado(nome){
  alert(
    `${nome} já está previsto na nova arquitetura financeira. ` +
    `A tela será ligada às consultas e às permissões individuais na próxima etapa.`
  );
}

document.addEventListener("DOMContentLoaded", () => {
  definirContextoFinanceiro("central_financeira");
  document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-central")?.classList.add("active");
});


// ============================================================
// QUADRO DEMONSTRATIVO — CONTAS A RECEBER / CONTAS A PAGAR
// Consulta somente dados agregados: KPIs + 2 gráficos.
// ============================================================
let qdRequestId = 0;

function novoEstadoFiltroQD(visaoInicial){
  return {
    empresas: new Set(),
    itens: new Set(),
    status: new Set(),
    visao: visaoInicial,
    tabela: new Map()
  };
}

const QD_FILTROS = {
  receber: novoEstadoFiltroQD("forma"),
  pagar: novoEstadoFiltroQD("plano")
};

const QD_TABELA_CACHE = {
  receber: { carregada:false, assinatura:"", lista:[] },
  pagar: { carregada:false, assinatura:"", lista:[] }
};

function qdSetTabela(tipo, coluna){
  const st = QD_FILTROS[tipo];
  if(!st) return new Set();
  if(!st.tabela.has(coluna)) st.tabela.set(coluna, new Set());
  return st.tabela.get(coluna);
}

function qdAssinaturaBase(tipo){
  const empresa = (document.getElementById("empresa")?.value || "").trim();
  const dataIni = document.getElementById("dataIni")?.value || "";
  const dataFim = document.getElementById("dataFim")?.value || "";
  const campoPessoa =
    (document.getElementById("filtroFornecedorFluxo")?.value || "").trim();
  const campoSecundario =
    (document.getElementById("filtroPlanoFluxo")?.value || "").trim();

  const fornecedor = tipo === "pagar" ? campoPessoa : "";
  const plano = tipo === "pagar" ? campoSecundario : "";
  const cliente = tipo === "receber" ? campoPessoa : "";
  const formaPagamento = tipo === "receber" ? campoSecundario : "";

  const incluirTransferencias =
    !!document.getElementById("finIncluirTransferencias")?.checked;

  const situacaoFinanceira =
    document.getElementById("filtroSituacaoFinanceira")?.value || "ABERTO";

  return JSON.stringify({
    tipo,
    empresa,
    dataIni,
    dataFim,
    fornecedor,
    plano,
    cliente,
    formaPagamento,
    situacaoFinanceira,
    incluirTransferencias
  });
}

function qdCacheValido(tipo){
  const cache = QD_TABELA_CACHE[tipo];
  return !!(
    cache?.carregada &&
    cache.assinatura === qdAssinaturaBase(tipo) &&
    Array.isArray(cache.lista)
  );
}

function qdInvalidarCache(tipo){
  const cache = QD_TABELA_CACHE[tipo];
  if(!cache) return;
  cache.carregada = false;
  cache.assinatura = "";
  cache.lista = [];
}


function aoMudarSituacaoFinanceira(select){
  if(abaAtual === "fluxo_projetado"){
    if(select) select.value="ABERTO";
    return;
  }

  const valor = String(select?.value || "ABERTO").toUpperCase();

  QD_SITUACOES_MULTI.receber?.clear();
  QD_SITUACOES_MULTI.pagar?.clear();

  // Invalida os detalhes para nunca reutilizar tabela de outra situação.
  qdInvalidarCache("receber");
  qdInvalidarCache("pagar");

  // Fecha tabela aberta: o usuário verá primeiro os resumos/gráficos recalculados.
  try{
    const viewReceber = document.getElementById("view-crediario");
    if(viewReceber?.classList.contains("fin-table-inline-open")){
      fecharTabelaFinanceiro("view-crediario");
    }

    const viewPagar = document.getElementById("view-contas-pagar");
    if(viewPagar?.classList.contains("fin-table-inline-open")){
      fecharTabelaFinanceiro("view-contas-pagar");
    }
  }catch(_){}

  // Nas abas Contas a Receber/Pagar, recalcula imediatamente.
  if(abaAtual === "crediario" || abaAtual === "contas_pagar"){
    recarregarAbaAtual();
  }
}
window.aoMudarSituacaoFinanceira = aoMudarSituacaoFinanceira;

function qdParamsTabelaBase(tipo){
  const qs = qdParams(tipo, true);
  qs.delete("filtroEmpresasMulti");
  qs.delete("filtroItensMulti");
  qs.delete("filtroStatusMulti");
  return qs;
}

function qdParams(tipo, detalhes = false){
  const qs = new URLSearchParams();
  qs.set("tipo", tipo);

  const empresa = (document.getElementById("empresa")?.value || "").trim();
  let dataIni = document.getElementById("dataIni")?.value || "";
  let dataFim = document.getElementById("dataFim")?.value || "";

  // Proteção contra datas digitadas acidentalmente com século incorreto
  // (ex.: 0101 a 2050), que causam varreduras enormes no financeiro.
  const anoIni = Number(String(dataIni).slice(0,4));
  const anoFim = Number(String(dataFim).slice(0,4));
  const anoAtual = new Date().getFullYear();

  if(
    !Number.isFinite(anoIni) || !Number.isFinite(anoFim) ||
    anoIni < 2000 || anoFim > anoAtual + 10 || anoFim < anoIni
  ){
    const hoje = new Date();
    const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const iso = d => d.toISOString().slice(0,10);

    dataIni = iso(primeiro);
    dataFim = iso(ultimo);

    const elIni = document.getElementById("dataIni");
    const elFim = document.getElementById("dataFim");
    if(elIni) elIni.value = dataIni;
    if(elFim) elFim.value = dataFim;
  }
  const fornecedor = (document.getElementById("filtroFornecedorFluxo")?.value || "").trim();
  const plano = (document.getElementById("filtroPlanoFluxo")?.value || "").trim();

  if(empresa) qs.set("empresa", empresa);
  if(dataIni) qs.set("dataIni", dataIni);
  if(dataFim) qs.set("dataFim", dataFim);

  if(tipo === "pagar"){
    if(fornecedor) qs.set("fornecedor", fornecedor);
    if(plano) qs.set("plano", plano);
  }else if(tipo === "receber"){
    // Na aba Contas a Receber os mesmos dois campos do topo mudam de função:
    // Fornecedor -> Cliente | Plano de conta -> Forma de pagamento.
    if(fornecedor) qs.set("cliente", fornecedor);
    if(plano) qs.set("formaPagamento", plano);
  }

  const situacaoFinanceira =
    document.getElementById("filtroSituacaoFinanceira")?.value || "ABERTO";
  qs.set("situacaoFinanceira", situacaoFinanceira);

  const incluirTransferencias =
    !!document.getElementById("finIncluirTransferencias")?.checked;
  qs.set("incluirTransferencias", incluirTransferencias ? "1" : "0");

  const visaoAtual = tipo === "receber"
    ? (document.getElementById("qdReceberVisao")?.value || "forma")
    : (document.getElementById("qdPagarVisao")?.value || "plano");

  const st = QD_FILTROS[tipo];

  // Ao trocar a visão, limpa apenas o filtro da dimensão direita.
  if(st.visao !== visaoAtual){
    st.visao = visaoAtual;
    st.itens.clear();
  }

  qs.set("visao", visaoAtual);

  if(st.empresas?.size){
    qs.set("filtroEmpresasMulti", JSON.stringify([...st.empresas]));
  }
  if(st.itens?.size){
    qs.set("filtroItensMulti", JSON.stringify([...st.itens]));
  }
  if(st.status?.size){
    qs.set("filtroStatusMulti", JSON.stringify([...st.status]));
  }
  if(detalhes) qs.set("detalhes", "1");

  return qs;
}


function alternarTransferenciasFinanceiro(input){
  // Ativado = excluir Plano 012. Desativado = permitir Plano 012.
  // Recarrega a aba atual para que cards, gráficos e tabelas usem a mesma regra.
  try{
    recarregarAbaAtual();
  }catch(e){
    console.error("Erro ao alternar transferências:",e);
  }
}
window.alternarTransferenciasFinanceiro = alternarTransferenciasFinanceiro;

function qdTituloVisao(tipo, visao){
  const mapas = {
    receber: {
      forma: ["Por forma de pagamento", "Crediário, cartão, PIX, boletos e demais formas."],
      cliente: ["Por cliente", "Clientes com maior saldo em aberto no período."],
      conta: ["Por conta / banco", "Concentração da carteira por conta financeira."],
      vencimento: ["Por faixa de vencimento", "Vencido, curto prazo e vencimentos futuros."]
    },
    pagar: {
      plano: ["Por plano de conta", "Onde estão concentradas as obrigações por natureza financeira."],
      fornecedor: ["Por fornecedor", "Fornecedores com maior saldo a pagar."],
      conta: ["Por conta / banco", "Concentração das obrigações por conta financeira."],
      vencimento: ["Por faixa de vencimento", "Vencido, curto prazo e vencimentos futuros."]
    }
  };
  return mapas[tipo]?.[visao] || ["Composição", "Distribuição do saldo em aberto."];
}

const QD_CLICK_TIMER = {
  receber: null,
  pagar: null
};

function qdCancelarCliquePendente(tipo){
  if(QD_CLICK_TIMER[tipo]){
    clearTimeout(QD_CLICK_TIMER[tipo]);
    QD_CLICK_TIMER[tipo] = null;
  }
}

function qdProcessarClique(tipo, acao, event){
  const detalhe = Number(event?.detail || 1);

  // Segundo clique: cancela qualquer clique simples pendente
  // e limpa TODAS as seleções secundárias.
  if(detalhe >= 2){
    qdCancelarCliquePendente(tipo);
    qdLimparTodasSelecoes(tipo, event);
    return;
  }

  // Clique simples: espera um instante para saber se será duplo clique.
  qdCancelarCliquePendente(tipo);

  QD_CLICK_TIMER[tipo] = setTimeout(() => {
    QD_CLICK_TIMER[tipo] = null;
    acao();
  }, 260);
}

function qdRenderBarras(id, lista, tipo, dimensao){
  const el = document.getElementById(id);
  if(!el) return;

  const dados = Array.isArray(lista) ? lista.slice(0, 15) : [];
  if(!dados.length){
    el.innerHTML = `<div class="empty">Sem dados no período.</div>`;
    return;
  }

  const maior = Math.max(...dados.map(x => Number(x.total || 0)), 1);
  const selecionados = dimensao === "empresa"
    ? QD_FILTROS[tipo].empresas
    : QD_FILTROS[tipo].itens;

  el.innerHTML = dados.map(x => {
    const nome = String(x.nome || "-");
    const valor = Number(x.total || 0);
    const pct = (valor / maior) * 100;
    const pctCarteira = Number(x.percentual || 0);
    const ativo = selecionados?.has(nome) ? "selected" : "";

    return `
      <button class="qd-bar-row ${ativo}" type="button"
        onclick="qdProcessarClique('${tipo}',() => qdSelecionarFiltro('${tipo}','${dimensao}',decodeURIComponent('${encodeURIComponent(nome)}')),event)">
        <div class="qd-bar-label" title="${esc(nome)}">${esc(nome)}</div>
        <div class="qd-bar-track">
          <div class="qd-bar-fill ${tipo === "pagar" ? "pagar" : "receber"}" style="width:${Math.max(pct,1)}%"></div>
        </div>
        <div class="qd-bar-value">
          <strong>${fmtMoeda(valor)}</strong>
          <span>${fmtPct(pctCarteira)} • ${fmtNumero(x.qtd || 0)} título(s)</span>
        </div>
      </button>`;
  }).join("");
}

function qdToggleSet(set, valor){
  if(set.has(valor)){
    set.delete(valor);
    return false;
  }
  set.add(valor);
  return true;
}

function qdSelecionarFiltro(tipo, dimensao, nome){
  const st = QD_FILTROS[tipo];
  if(!st) return;

  qdToggleSet(dimensao === "empresa" ? st.empresas : st.itens, nome);

  if(qdCacheValido(tipo)) aplicarFiltrosLocaisQuadroTabela(tipo);
  else carregarQuadroDemonstrativo(tipo);
}

function qdSelecionarStatus(tipo, status){
  const st = QD_FILTROS[tipo];
  if(!st) return;

  if(status === "todos") st.status.clear();
  else qdToggleSet(st.status, status);

  if(qdCacheValido(tipo)) aplicarFiltrosLocaisQuadroTabela(tipo);
  else carregarQuadroDemonstrativo(tipo);
}

function qdLimparTodasSelecoes(tipo, event){
  event?.preventDefault?.();
  event?.stopPropagation?.();

  qdCancelarCliquePendente(tipo);

  const st = QD_FILTROS[tipo];
  if(!st) return;

  st.empresas.clear();
  st.itens.clear();
  st.status.clear();
  st.tabela.clear();
  QD_SITUACOES_MULTI[tipo]?.clear();

  const tableId = tipo === "receber" ? "qdTabelaReceber" : "qdTabelaPagar";
  const table = document.getElementById(tableId);

  table?.querySelectorAll(".fin-table-filter-row input").forEach(input => {
    input.value = "";
  });

  table?.querySelectorAll("td.qd-cell-selected").forEach(td => {
    td.classList.remove("qd-cell-selected");
  });

  const board = document.getElementById(
    tipo === "receber" ? "qdReceberBoard" : "qdPagarBoard"
  );

  board?.querySelectorAll(".selected").forEach(el => {
    el.classList.remove("selected");
  });

  if(qdCacheValido(tipo)) aplicarFiltrosLocaisQuadroTabela(tipo);
  else carregarQuadroDemonstrativo(tipo);
}

function qdAtualizarEstadoVisual(tipo){
  const board = document.getElementById(
    tipo === "receber" ? "qdReceberBoard" : "qdPagarBoard"
  );
  if(!board) return;

  const status = QD_FILTROS[tipo].status;
  board.querySelectorAll(".qd-filter-kpi").forEach(el => {
    const valor = el.dataset.qdStatus || "todos";
    const ativo = valor === "todos" ? status.size === 0 : status.has(valor);
    el.classList.toggle("selected", ativo);
  });
}



const QD_SITUACOES_MULTI = {
  receber:new Set(),
  pagar:new Set()
};

let QD_SITUACAO_CLICK_TIMER = null;


function qdLinhaCombinaSituacao(row,codigo){
  codigo = String(codigo || "").toUpperCase();

  const situacoes = new Set(
    String(row.dataset.situacoes || "")
      .split("|")
      .map(x=>x.trim().toUpperCase())
      .filter(Boolean)
  );

  const status = String(row.dataset.statusFinanceiro || "").toUpperCase();
  const situacaoPrazo = String(row.dataset.situacao || "").toUpperCase();

  if(status==="A") situacoes.add("ABERTO");
  if(status==="B") situacoes.add("BAIXADO");
  if(status==="C") situacoes.add("CANCELADO");
  if(situacaoPrazo==="VENCIDO") situacoes.add("ATRASADO");

  return situacoes.has(codigo);
}

function qdLinhaPassaSituacoesMulti(row,tipo){
  const set = QD_SITUACOES_MULTI[tipo];
  if(!set?.size) return true;

  return [...set].some(codigo =>
    qdLinhaCombinaSituacao(row,codigo)
  );
}

function qdSituacaoSelecionada(tipo,codigo){
  return QD_SITUACOES_MULTI[tipo]?.has(String(codigo || ""));
}

function qdAplicarFiltroSituacoesLocal(tipo){
  // Não manipula linhas isoladamente.
  // Apenas recalcula TODO o quadro usando o mesmo motor cruzado.
  aplicarFiltrosLocaisQuadroTabela(tipo);
}

function qdToggleSituacaoGrafico(tipo,codigo,event){
  event?.preventDefault?.();
  event?.stopPropagation?.();

  codigo = String(codigo || "");
  if(!codigo) return;

  if(Number(event?.detail || 0) >= 2){
    if(QD_SITUACAO_CLICK_TIMER){
      clearTimeout(QD_SITUACAO_CLICK_TIMER);
      QD_SITUACAO_CLICK_TIMER = null;
    }

    QD_SITUACOES_MULTI[tipo]?.clear();
    qdAtualizarSituacoesMarcadas(tipo);
    qdAplicarFiltroSituacoesLocal(tipo);
    return;
  }

  if(QD_SITUACAO_CLICK_TIMER){
    clearTimeout(QD_SITUACAO_CLICK_TIMER);
  }

  QD_SITUACAO_CLICK_TIMER = setTimeout(()=>{
    QD_SITUACAO_CLICK_TIMER = null;

    const set = QD_SITUACOES_MULTI[tipo];
    if(!set) return;

    if(set.has(codigo)) set.delete(codigo);
    else set.add(codigo);

    qdAtualizarSituacoesMarcadas(tipo);
    qdAplicarFiltroSituacoesLocal(tipo);
  },220);
}
window.qdToggleSituacaoGrafico = qdToggleSituacaoGrafico;

function qdAtualizarSituacoesMarcadas(tipo){
  if(tipo !== "pagar") return;

  document
    .querySelectorAll("#qdPagarSituacaoGrafico .qd-situacao-row")
    .forEach(row=>{
      const codigo = String(row.dataset.codigo || "");
      row.classList.toggle(
        "selected",
        QD_SITUACOES_MULTI.pagar.has(codigo)
      );
    });
}
window.qdAtualizarSituacoesMarcadas = qdAtualizarSituacoesMarcadas;

const QD_PRELOAD_PROMISE = {
  receber:null,
  pagar:null
};

async function qdPrecarregarBaseLocal(tipo){
  const assinatura = qdAssinaturaBase(tipo);

  if(qdCacheValido(tipo)){
    return true;
  }

  if(
    QD_TABELA_CACHE[tipo]?.carregando &&
    QD_TABELA_CACHE[tipo]?.assinatura === assinatura &&
    QD_PRELOAD_PROMISE[tipo]
  ){
    return QD_PRELOAD_PROMISE[tipo];
  }

  QD_TABELA_CACHE[tipo] = {
    carregada:false,
    carregando:true,
    assinatura,
    lista:[]
  };

  const qs = qdParamsTabelaBase(tipo);
  qs.set("detalhes","1");

  const promessa = (async ()=>{
    try{
      const d = await getJSON(
        `/api/financeiro/quadro-demonstrativo?${qs.toString()}`
      );

      // Se os filtros principais mudaram enquanto baixava, descarta.
      if(qdAssinaturaBase(tipo) !== assinatura){
        return false;
      }

      const lista = Array.isArray(d.detalhes) ? d.detalhes : [];

      QD_TABELA_CACHE[tipo] = {
        carregada:true,
        carregando:false,
        assinatura,
        lista
      };

      // MUITO IMPORTANTE:
      // preenche a tabela mesmo fechada. É ela que funciona como
      // índice local para cards, gráficos e filtros cruzados.
      renderizarTabelaDoCache(tipo);
      aplicarFiltrosLocaisQuadroTabela(tipo);

      return true;
    }catch(e){
      console.error("Erro ao pré-carregar base local financeira:",e);

      if(qdAssinaturaBase(tipo) === assinatura){
        QD_TABELA_CACHE[tipo] = {
          carregada:false,
          carregando:false,
          assinatura:"",
          lista:[]
        };
      }
      return false;
    }finally{
      if(QD_PRELOAD_PROMISE[tipo] === promessa){
        QD_PRELOAD_PROMISE[tipo] = null;
      }
    }
  })();

  QD_PRELOAD_PROMISE[tipo] = promessa;
  return promessa;
}
window.qdPrecarregarBaseLocal = qdPrecarregarBaseLocal;

async function carregarQuadroDemonstrativo(tipo){
  // Com a tabela já carregada, mudanças de visão/cards/gráficos
  // são processadas instantaneamente no navegador.
  if(qdCacheValido(tipo)){
    aplicarFiltrosLocaisQuadroTabela(tipo);
    return;
  }

  // Se os filtros principais mudaram, o cache antigo não pode ser reutilizado.
  const prefix = tipo === "receber" ? "Rec" : "Pag";
  const reqId = ++qdRequestId;
  const qs = qdParams(tipo);

  const board = document.getElementById(tipo === "receber" ? "qdReceberBoard" : "qdPagarBoard");
  board?.classList.add("loading");

  try{
    const d = await getJSON(`/api/financeiro/quadro-demonstrativo?${qs.toString()}`);
    if(reqId !== qdRequestId) return;

    const r = d.resumo || {};
    const total = Number(r.total || 0);
    const vencido = Number(r.vencido || 0);
    const avencer = Number(r.aVencer || 0);

    const set = (id, texto) => {
      const el = document.getElementById(id);
      if(el) el.textContent = texto;
    };

    set(`qd${prefix}Total`, fmtMoeda(total));
    set(`qd${prefix}Vencido`, fmtMoeda(vencido));
    set(`qd${prefix}AVencer`, fmtMoeda(avencer));
    set(`qd${prefix}Pessoas`, fmtNumero(r.qtdPessoas || 0));
    set(`qd${prefix}Qtd`, `${fmtNumero(r.qtdTitulos || 0)} título(s)`);
    set(`qd${prefix}VencidoPct`, `${fmtPct(total > 0 ? vencido / total * 100 : 0)} ${tipo === "receber" ? "da carteira" : "das obrigações"}`);
    set(`qd${prefix}AVencerPct`, `${fmtPct(total > 0 ? avencer / total * 100 : 0)} ${tipo === "receber" ? "da carteira" : "das obrigações"}`);

    qdRenderBarras(
      tipo === "receber" ? "qdReceberEmpresas" : "qdPagarEmpresas",
      d.porEmpresa || [],
      tipo,
      "empresa"
    );

    qdRenderBarras(
      tipo === "receber" ? "qdReceberVisaoGrafico" : "qdPagarVisaoGrafico",
      d.porVisao || [],
      tipo,
      "visao"
    );

    if(tipo === "pagar"){
      renderGraficoSituacaoAPI(d.porSituacao || []);
    }

    const visao = tipo === "receber"
      ? (document.getElementById("qdReceberVisao")?.value || "forma")
      : (document.getElementById("qdPagarVisao")?.value || "plano");

    const [titulo, sub] = qdTituloVisao(tipo, visao);
    set(tipo === "receber" ? "qdReceberVisaoTitulo" : "qdPagarVisaoTitulo", titulo);
    set(tipo === "receber" ? "qdReceberVisaoSub" : "qdPagarVisaoSub", sub);
    qdAtualizarEstadoVisual(tipo);

    // Depois que os resumos/gráficos aparecem, baixa UMA ÚNICA VEZ
    // a base detalhada para deixar todos os filtros seguintes locais.
    qdPrecarregarBaseLocal(tipo);

  }catch(e){
    console.error("Erro quadro demonstrativo:", e);

    const graf1 = document.getElementById(tipo === "receber" ? "qdReceberEmpresas" : "qdPagarEmpresas");
    const graf2 = document.getElementById(tipo === "receber" ? "qdReceberVisaoGrafico" : "qdPagarVisaoGrafico");

    if(graf1) graf1.innerHTML = `<div class="empty">Erro ao carregar o quadro demonstrativo.</div>`;
    if(graf2) graf2.innerHTML = `<div class="empty">${esc(e.message || "Falha na consulta.")}</div>`;
  }finally{
    board?.classList.remove("loading");
  }
}




function renderizarTabelaDoCache(tipo){
  const cache = QD_TABELA_CACHE[tipo];
  const lista = Array.isArray(cache?.lista) ? cache.lista : [];

  const tableId = tipo === "receber" ? "qdTabelaReceber" : "qdTabelaPagar";
  const bodyId = tipo === "receber" ? "qdTabelaBodyReceber" : "qdTabelaBodyPagar";
  const tbody = document.getElementById(bodyId);
  const table = document.getElementById(tableId);

  if(!tbody || !table) return;

  tbody.innerHTML = lista.length ? lista.map(x => {
    const valor = Number(x.valorAberto || 0);

    return `
      <tr
        data-empresa="${esc(x.empresa || "-")}"
        data-pessoa="${esc(x.pessoa || "-")}"
        data-forma="${esc(x.forma || "OUTROS")}"
        data-plano="${esc(x.planoConta || x.descricao || "SEM PLANO")}"
        data-conta="${esc(x.contaBanco || "SEM CONTA/BANCO")}"
        data-faixa="${esc(x.faixaVencimento || x.situacao || "-")}"
        data-situacao="${esc(x.situacao || "-")}"
        data-situacao-codigo="${esc(x.situacaoCodigo || x.statusFinanceiro || "")}"
        data-status-financeiro="${esc(x.statusFinanceiro || x.situacaoCodigo || "")}"
        data-situacoes="${esc((Array.isArray(x.situacoes) ? x.situacoes : []).join("|"))}"
        data-valor="${valor}"
      >
        <td>${esc(fmtData(x.data))}</td>
        <td>${esc(x.empresa || "-")}</td>
        <td>${esc(x.pessoa || "-")}</td>
        <td>${esc(x.documento || "-")}</td>
        <td>${esc(x.descricao || "-")}</td>
        <td>${esc(x.contaBanco || "-")}</td>
        <td>${esc(x.situacao || "-")}</td>
        <td class="num">${fmtMoeda(valor)}</td>
      </tr>
    `;
  }).join("") : `<tr><td colspan="8" class="empty">Sem títulos para os filtros selecionados.</td></tr>`;

  garantirRodapeTotalTabela(tableId);

  if(typeof ativarOrdenacaoEmTodasAsTabelas === "function"){
    ativarOrdenacaoEmTodasAsTabelas();
  }

  prepararFiltrosTabelaFinanceiro(tableId);

  table.querySelectorAll("tbody td").forEach(td => {
    if(td.dataset.qdSelecaoPronta === "1") return;
    td.dataset.qdSelecaoPronta = "1";
    td.addEventListener("click", event => {
      qdProcessarClique(
        tipo,
        () => qdSelecionarCelulaTabela(tipo,td),
        event
      );
    });
  });

  aplicarFiltrosLocaisQuadroTabela(tipo);
}

async function carregarTabelaQuadroDemonstrativo(tipo){
  // Se já temos a mesma base em memória, NÃO baixa novamente.
  if(qdCacheValido(tipo)){
    renderizarTabelaDoCache(tipo);
    return;
  }

  // Se o pré-carregamento da primeira consulta ainda estiver terminando,
  // espera por ele em vez de disparar uma segunda consulta igual.
  if(
    QD_TABELA_CACHE[tipo]?.carregando &&
    QD_PRELOAD_PROMISE[tipo]
  ){
    const ok = await QD_PRELOAD_PROMISE[tipo];
    if(ok && qdCacheValido(tipo)){
      renderizarTabelaDoCache(tipo);
      return;
    }
  }

  const qs = qdParamsTabelaBase(tipo);
  const d = await getJSON(`/api/financeiro/quadro-demonstrativo?${qs.toString()}`);

  QD_TABELA_CACHE[tipo] = {
    carregada: true,
    assinatura: qdAssinaturaBase(tipo),
    lista: Array.isArray(d.detalhes) ? d.detalhes : []
  };

  const btn = document.getElementById("btnCarregarTabelaFinanceiro");
  if(btn){
    btn.title = "Tabela carregada em memória. Os próximos filtros serão instantâneos.";
  }

  renderizarTabelaDoCache(tipo);
}

// ============================================================
// PADRÃO ÚNICO DO FINANCEIRO
// Demonstrativo primeiro; tabela somente sob demanda.
// ============================================================

const FIN_VIEW_TITULOS = {
  "view-geral": "Caixa & Liquidez",
  "view-dre-competencia": "Resultado Gerencial",
  "view-dre-caixa": "Resultado por Caixa",
  "view-crediario": "Contas a Receber",
  "view-ativo-passivo": "Posição Financeira",
  "view-analise-crediario": "Análise de Crediário",
  "view-contas-pagar": "Contas a Pagar",
  "view-conciliacao": "Bancos & Conciliação",
  "view-rentabilidade": "Margem & Rentabilidade"
};

function prepararTabelasFinanceiro(){
  document.querySelectorAll(".tab-view").forEach(view => {
    if(!view.id || !FIN_VIEW_TITULOS[view.id]) return;

    view.classList.add("fin-demo-standard");

    // Marca todos os blocos que realmente contêm tabela.
    view.querySelectorAll(".table-wrap").forEach(wrap => {
      wrap.classList.add("fin-table-hidden");
      const panel = wrap.closest(".panel");
      if(panel) panel.classList.add("fin-table-panel");
    });

    // Alguns módulos possuem tabela sem .table-wrap.
    view.querySelectorAll("table").forEach(table => {
      const wrap = table.closest(".table-wrap");
      if(wrap) return;
      const panel = table.closest(".panel");
      if(panel) panel.classList.add("fin-table-panel", "fin-table-hidden");
    });
  });
}

async function abrirTabelaFinanceiro(viewId){
  const view = document.getElementById(viewId);
  if(!view) return;

  const tipoQD = viewId === "view-crediario"
    ? "receber"
    : (viewId === "view-contas-pagar" ? "pagar" : "");

  const btn = document.getElementById("btnCarregarTabelaFinanceiro");
  const slot = document.getElementById("financeDemoSlot");

  const painelQD = tipoQD
    ? document.getElementById(tipoQD === "receber"
        ? "qdTabelaPainelReceber"
        : "qdTabelaPainelPagar")
    : null;

  if(tipoQD && painelQD && slot){
    const textoAnterior = btn?.textContent || "Carregar tabela";

    if(btn){
      btn.disabled = true;
      btn.textContent = "Carregando tabela...";
      btn.classList.add("loading");
    }

    try{
      await carregarTabelaQuadroDemonstrativo(tipoQD);

      // A tabela sai do conteúdo legado oculto e passa para a área visível,
      // imediatamente abaixo do botão.
      let holder = slot.querySelector(".fin-inline-table-holder");

      if(!holder){
        holder = document.createElement("div");
        holder.className = "fin-inline-table-holder";
        slot.appendChild(holder);
      }

      holder.innerHTML = "";
      holder.appendChild(painelQD);

      view.classList.add("fin-table-inline-open");
      slot.classList.add("table-open");

      painelQD.classList.remove("fin-table-hidden");
      painelQD.classList.add("fin-table-visible", "fin-table-inline-panel");

      painelQD.querySelectorAll(".table-wrap").forEach(wrap => {
        wrap.classList.remove("fin-table-hidden");
        wrap.classList.add("fin-table-visible");
      });

      prepararFiltrosTabelaFinanceiro(
        tipoQD === "receber" ? "qdTabelaReceber" : "qdTabelaPagar"
      );

      if(typeof ativarOrdenacaoEmTodasAsTabelas === "function"){
        ativarOrdenacaoEmTodasAsTabelas();
      }

      atualizarBotaoTabelaInline(viewId, true);

      holder.scrollIntoView({behavior:"smooth", block:"start"});
    }catch(erro){
      console.error("Erro ao carregar tabela do Financeiro:", erro);
      alert(erro?.message || "Não foi possível carregar a tabela.");
      if(btn){
        btn.textContent = textoAnterior;
      }
    }finally{
      if(btn){
        btn.disabled = false;
        btn.classList.remove("loading");
      }
    }

    return;
  }

  // Outros módulos: comportamento provisório.
  const tabelas = [
    ...view.querySelectorAll(".fin-table-panel"),
    ...view.querySelectorAll(".table-wrap.fin-table-hidden")
  ];

  if(!tabelas.length){
    alert("Este módulo ainda não possui uma tabela detalhada configurada.");
    return;
  }

  view.classList.add("fin-table-inline-open");

  tabelas.forEach(el => {
    el.classList.remove("fin-table-hidden");
    el.classList.add("fin-table-visible");
  });

  atualizarBotaoTabelaInline(viewId, true);

  if(typeof ativarOrdenacaoEmTodasAsTabelas === "function"){
    ativarOrdenacaoEmTodasAsTabelas();
  }
}

function fecharTabelaFinanceiro(viewId){
  const view = document.getElementById(viewId);
  if(!view) return;

  const tipoQD = viewId === "view-crediario"
    ? "receber"
    : (viewId === "view-contas-pagar" ? "pagar" : "");

  const slot = document.getElementById("financeDemoSlot");
  const painelQD = tipoQD
    ? document.getElementById(tipoQD === "receber"
        ? "qdTabelaPainelReceber"
        : "qdTabelaPainelPagar")
    : null;

  view.classList.remove("fin-table-inline-open");
  slot?.classList.remove("table-open");

  if(painelQD){
    painelQD.classList.remove("fin-table-visible", "fin-table-inline-panel");
    painelQD.classList.add("fin-table-hidden");

    painelQD.querySelectorAll(".table-wrap").forEach(wrap => {
      wrap.classList.remove("fin-table-visible");
      wrap.classList.add("fin-table-hidden");
    });

    const legacy = view.querySelector(".fin-legacy-content");
    if(legacy){
      legacy.prepend(painelQD);
    }
  }

  slot?.querySelector(".fin-inline-table-holder")?.remove();

  atualizarBotaoTabelaInline(viewId, false);
}

function atualizarBotaoTabelaInline(viewId, aberta){
  const btn = document.getElementById("btnCarregarTabelaFinanceiro");
  if(!btn || btn.classList.contains("loading")) return;

  const abaAtualEhView =
    (viewId === "view-crediario" && abaAtual === "crediario") ||
    (viewId === "view-contas-pagar" && abaAtual === "contas_pagar");

  if(!abaAtualEhView) return;

  btn.textContent = aberta ? "Ocultar tabela" : "Carregar tabela";
  btn.onclick = aberta
    ? () => fecharTabelaFinanceiro(viewId)
    : () => abrirTabelaFinanceiro(viewId);
}

function tabelaQuadroEstaAberta(tipo){
  const view = document.getElementById(
    tipo === "receber" ? "view-crediario" : "view-contas-pagar"
  );
  return !!view?.classList.contains("fin-table-inline-open");
}

function prepararFiltrosTabelaFinanceiro(tableId){
  const table = document.getElementById(tableId);
  if(!table || table.dataset.filtrosPreparados === "1") return;

  const thead = table.tHead;
  if(!thead || !thead.rows.length) return;

  const cab = thead.rows[0];
  const filtroRow = thead.insertRow(1);
  filtroRow.className = "fin-table-filter-row";

  [...cab.cells].forEach((th, idx) => {
    const cell = document.createElement("th");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Filtrar";
    input.dataset.col = String(idx);
    input.addEventListener("input", () => filtrarTabelaFinanceiro(tableId));
    cell.appendChild(input);
    filtroRow.appendChild(cell);
  });

  table.dataset.filtrosPreparados = "1";
}

function garantirRodapeTotalTabela(tableId){
  const table = document.getElementById(tableId);
  if(!table) return;

  let tfoot = table.tFoot;
  if(!tfoot){
    tfoot = table.createTFoot();
  }

  if(!tfoot.rows.length){
    const row = tfoot.insertRow();
    row.className = "fin-table-total-row";

    const label = row.insertCell();
    label.colSpan = 7;
    label.className = "fin-table-total-label";
    label.textContent = "TOTAL DA TABELA";

    const total = row.insertCell();
    total.className = "num fin-table-total-value";
    total.textContent = "R$ 0,00";
  }
}

function obterLinhasVisiveisTabela(tableId){
  const table = document.getElementById(tableId);
  if(!table?.tBodies?.[0]) return [];

  return [...table.tBodies[0].rows].filter(row => {
    return !row.classList.contains("empty") &&
      row.style.display !== "none" &&
      row.dataset.valor !== undefined;
  });
}

function atualizarTotalTabelaFinanceiro(tableId){
  const table = document.getElementById(tableId);
  if(!table) return;

  garantirRodapeTotalTabela(tableId);

  const linhas = obterLinhasVisiveisTabela(tableId);
  const total = linhas.reduce(
    (soma, row) => soma + Number(row.dataset.valor || 0),
    0
  );

  const label = table.querySelector(".fin-table-total-label");
  const valor = table.querySelector(".fin-table-total-value");

  if(label){
    label.textContent = `TOTAL FILTRADO • ${fmtNumero(linhas.length)} TÍTULO(S)`;
  }
  if(valor){
    valor.textContent = fmtMoeda(total);
  }
}

function agruparLinhasTabela(linhas, campo){
  const mapa = new Map();

  linhas.forEach(row => {
    const nome = String(row.dataset[campo] || "-").trim() || "-";
    const valor = Number(row.dataset.valor || 0);

    const atual = mapa.get(nome) || {nome, qtd:0, total:0};
    atual.qtd += 1;
    atual.total += valor;
    mapa.set(nome, atual);
  });

  const totalGeral = linhas.reduce(
    (soma, row) => soma + Number(row.dataset.valor || 0),
    0
  );

  return [...mapa.values()]
    .map(x => ({
      ...x,
      percentual: totalGeral > 0 ? (x.total / totalGeral) * 100 : 0
    }))
    .sort((a,b) => b.total - a.total);
}

function atualizarQuadroPelosFiltrosTabela(tableId){
  const tipo = tableId === "qdTabelaReceber" ? "receber" : "pagar";

  const linhas = obterLinhasVisiveisTabela(tableId);

  // Cada área ignora somente a própria seleção para permitir
  // multisseleção sem zerar as demais opções da mesma área.
  const linhasEmpresas = obterLinhasFacetadasTabela(tableId,tipo,"empresa");
  const linhasVisao = obterLinhasFacetadasTabela(tableId,tipo,"visao");
  const linhasStatus = obterLinhasFacetadasTabela(tableId,tipo,"status");

  const prefix = tipo === "receber" ? "Rec" : "Pag";

  const total = linhas.reduce(
    (soma,row) => soma + Number(row.dataset.valor || 0),0
  );

  const totalStatus = linhasStatus.reduce(
    (soma,row) => soma + Number(row.dataset.valor || 0),0
  );

  const vencido = linhasStatus
    .filter(row => String(row.dataset.situacao || "").toUpperCase() === "VENCIDO")
    .reduce((soma,row) => soma + Number(row.dataset.valor || 0),0);

  const aVencer = linhasStatus
    .filter(row => String(row.dataset.situacao || "").toUpperCase() !== "VENCIDO")
    .reduce((soma,row) => soma + Number(row.dataset.valor || 0),0);

  const pessoas = new Set(
    linhas.map(row => String(row.dataset.pessoa || "").trim()).filter(Boolean)
  ).size;

  const set = (id,valor) => {
    const el=document.getElementById(id);
    if(el) el.textContent=valor;
  };

  set(`qd${prefix}Total`,fmtMoeda(total));
  set(`qd${prefix}Vencido`,fmtMoeda(vencido));
  set(`qd${prefix}AVencer`,fmtMoeda(aVencer));
  set(`qd${prefix}Pessoas`,fmtNumero(pessoas));
  set(`qd${prefix}Qtd`,`${fmtNumero(linhas.length)} título(s)`);

  set(
    `qd${prefix}VencidoPct`,
    `${fmtPct(totalStatus>0?vencido/totalStatus*100:0)} ${tipo==="receber"?"da carteira":"das obrigações"}`
  );

  set(
    `qd${prefix}AVencerPct`,
    `${fmtPct(totalStatus>0?aVencer/totalStatus*100:0)} ${tipo==="receber"?"da carteira":"das obrigações"}`
  );

  const empresas = agruparLinhasTabela(linhasEmpresas,"empresa");

  const visao = tipo === "receber"
    ? (document.getElementById("qdReceberVisao")?.value || "forma")
    : (document.getElementById("qdPagarVisao")?.value || "plano");

  const campoVisao = {
    forma:"forma", cliente:"pessoa", fornecedor:"pessoa",
    plano:"plano", conta:"conta", vencimento:"faixa"
  }[visao] || (tipo==="receber"?"forma":"plano");

  const porVisao = agruparLinhasTabela(linhasVisao,campoVisao);

  qdRenderBarras(
    tipo==="receber"?"qdReceberEmpresas":"qdPagarEmpresas",
    empresas,tipo,"empresa"
  );

  qdRenderBarras(
    tipo==="receber"?"qdReceberVisaoGrafico":"qdPagarVisaoGrafico",
    porVisao,tipo,"visao"
  );

  const [titulo,sub]=qdTituloVisao(tipo,visao);
  set(tipo==="receber"?"qdReceberVisaoTitulo":"qdPagarVisaoTitulo",titulo);
  set(tipo==="receber"?"qdReceberVisaoSub":"qdPagarVisaoSub",sub);
  renderGraficoSituacaoLocal(tipo);

}



function renderGraficoSituacaoAPI(lista){
  const box = document.getElementById("qdPagarSituacaoGrafico");
  if(!box) return;

  const dados = Array.isArray(lista) ? lista : [];

  if(!dados.length){
    box.innerHTML = `
      <div class="empty">
        Nenhuma situação encontrada para este período e filtros.
      </div>
    `;
    return;
  }

  const maior = Math.max(
    ...dados.map(x => Math.abs(Number(x.total || x.valor || 0))),
    1
  );

  const soma = dados.reduce(
    (s,x)=>s + Math.abs(Number(x.total || x.valor || 0)),
    0
  );

  box.innerHTML = dados.map(x=>{
    const valor = Number(x.total || x.valor || 0);
    const qtd = Number(x.qtd || 0);

    const pctBarra = Math.max(
      Math.abs(valor) / maior * 100,
      1
    );

    const pctTotal = Number.isFinite(Number(x.percentual))
      ? Number(x.percentual)
      : (soma > 0 ? Math.abs(valor) / soma * 100 : 0);

    return `
      <div
        class="qd-situacao-row ${qdSituacaoSelecionada("pagar",String(x.codigo || "")) ? "selected" : ""}"
        data-codigo="${esc(String(x.codigo || ""))}"
        onclick="qdToggleSituacaoGrafico(
          'pagar',
          '${String(x.codigo || "").replace(/'/g,"\\'")}',
          event
        )"
        title="1 clique: seleciona/remove • vários cliques: acumula • 2 cliques: limpa"
      >
        <div class="qd-situacao-label">${esc(x.nome || "SEM SITUAÇÃO")}</div>

        <div class="qd-situacao-track">
          <div class="qd-situacao-fill" style="width:${pctBarra}%"></div>
        </div>

        <div class="qd-situacao-value">
          <strong>${fmtMoeda(valor)}</strong>
          <small>${fmtPct(pctTotal)} • ${fmtNumero(qtd)} título(s)</small>
        </div>
      </div>
    `;
  }).join("");
}
window.renderGraficoSituacaoAPI = renderGraficoSituacaoAPI;




function agruparSituacaoLinhasTabela(linhas){
  const mapa = new Map();

  (linhas || []).forEach(row => {
    const nome = String(row.dataset.situacao || "SEM SITUAÇÃO").trim() || "SEM SITUAÇÃO";
    const valor = Number(row.dataset.valor || 0);

    const atual = mapa.get(nome) || {
      nome,
      valor:0,
      qtd:0
    };

    atual.valor += valor;
    atual.qtd += 1;
    mapa.set(nome,atual);
  });

  return Array.from(mapa.values())
    .sort((a,b)=>Math.abs(b.valor)-Math.abs(a.valor));
}

function renderGraficoSituacaoQuadroPagar(linhas){
  const box = document.getElementById("qdPagarSituacaoGrafico");
  if(!box) return;

  const dados = agruparSituacaoLinhasTabela(linhas);

  if(!dados.length){
    box.innerHTML = `<div class="empty">Sem situações para os filtros selecionados.</div>`;
    return;
  }

  const total = dados.reduce((s,x)=>s+Math.abs(Number(x.valor||0)),0);
  const maior = Math.max(...dados.map(x=>Math.abs(Number(x.valor||0))),1);

  box.innerHTML = dados.map(x=>{
    const pctBarra = Math.max(
      (Math.abs(Number(x.valor||0))/maior)*100,
      1
    );

    const pctTotal = total > 0
      ? Math.abs(Number(x.valor||0))/total*100
      : 0;

    const nome = String(x.nome || "SEM SITUAÇÃO");
    const statusFiltro =
      nome.toUpperCase() === "VENCIDO"
        ? "vencido"
        : "avencer";

    const selecionado =
      QD_FILTROS.pagar?.status?.has(statusFiltro);

    return `
      <div
        class="qd-situacao-row ${selecionado ? "selected" : ""}"
        data-situacao="${esc(nome)}"
        onclick="qdProcessarClique(
          'pagar',
          () => qdSelecionarStatus('pagar','${statusFiltro}'),
          event
        )"
        title="Clique para filtrar • clique novamente para remover • duplo clique limpa as seleções"
      >
        <div class="qd-situacao-label">${esc(nome)}</div>

        <div class="qd-situacao-track">
          <div class="qd-situacao-fill" style="width:${pctBarra}%"></div>
        </div>

        <div class="qd-situacao-value">
          <strong>${fmtMoeda(x.valor)}</strong>
          <small>${fmtPct(pctTotal)} • ${fmtNumero(x.qtd)} título(s)</small>
        </div>
      </div>
    `;
  }).join("");
}
window.renderGraficoSituacaoQuadroPagar = renderGraficoSituacaoQuadroPagar;

function linhaPassaFiltrosQuadro(row, tipo){
  const st = QD_FILTROS[tipo] || {};

  if(!qdLinhaPassaSituacoesMulti(row,tipo)){
    return false;
  }
  const visao = tipo === "receber"
    ? (document.getElementById("qdReceberVisao")?.value || "forma")
    : (document.getElementById("qdPagarVisao")?.value || "plano");

  if(st.empresas?.size && !st.empresas.has(String(row.dataset.empresa || ""))) return false;

  if(st.status?.size){
    const statusLinha = String(row.dataset.situacao || "").toUpperCase() === "VENCIDO"
      ? "vencido" : "avencer";
    if(!st.status.has(statusLinha)) return false;
  }

  if(st.itens?.size){
    const campo = {
      forma:"forma", cliente:"pessoa", fornecedor:"pessoa",
      plano:"plano", conta:"conta", vencimento:"faixa"
    }[visao] || (tipo === "receber" ? "forma" : "plano");

    if(!st.itens.has(String(row.dataset[campo] || ""))) return false;
  }

  if(st.tabela?.size){
    for(const [coluna,valores] of st.tabela.entries()){
      if(valores?.size && !valores.has(qdValorTabelaPorColuna(row,Number(coluna)))) return false;
    }
  }

  return true;
}

function linhaPassaFiltrosQuadroExceto(row, tipo, exceto){
  const st = QD_FILTROS[tipo] || {};

  if(
    exceto !== "situacao_multi" &&
    !qdLinhaPassaSituacoesMulti(row,tipo)
  ){
    return false;
  }
  const visao = tipo === "receber"
    ? (document.getElementById("qdReceberVisao")?.value || "forma")
    : (document.getElementById("qdPagarVisao")?.value || "plano");

  if(exceto !== "empresa" && st.empresas?.size){
    if(!st.empresas.has(String(row.dataset.empresa || ""))) return false;
  }

  if(exceto !== "status" && st.status?.size){
    const statusLinha = String(row.dataset.situacao || "").toUpperCase() === "VENCIDO"
      ? "vencido" : "avencer";
    if(!st.status.has(statusLinha)) return false;
  }

  if(exceto !== "visao" && st.itens?.size){
    const campo = {
      forma:"forma", cliente:"pessoa", fornecedor:"pessoa",
      plano:"plano", conta:"conta", vencimento:"faixa"
    }[visao] || (tipo === "receber" ? "forma" : "plano");

    if(!st.itens.has(String(row.dataset[campo] || ""))) return false;
  }

  if(st.tabela?.size){
    for(const [coluna,valores] of st.tabela.entries()){
      if(!valores?.size) continue;

      // Se a seleção de tabela representa a mesma dimensão, não esconda
      // as outras opções do gráfico correspondente.
      if(exceto === "empresa" && Number(coluna) === 1) continue;

      const valorLinha = qdValorTabelaPorColuna(row,Number(coluna));
      if(!valores.has(valorLinha)) return false;
    }
  }

  return true;
}


function obterLinhasSituacaoFacetadas(tableId,tipo){
  const table = document.getElementById(tableId);
  if(!table?.tBodies?.[0]) return [];

  return [...table.tBodies[0].rows].filter(row=>{
    if(row.dataset.valor === undefined) return false;

    return linhaPassaFiltrosQuadroExceto(row,tipo,"situacao_multi") &&
      linhaPassaFiltrosColuna(row,table);
  });
}

function agruparSituacoesReaisDaTabela(linhas){
  const labels = {
    ABERTO:"Em aberto",
    BAIXADO:"Baixado / realizado",
    ATRASADO:"Atrasado",
    PREVISAO:"Previsão",
    PENDENCIA:"Pendência",
    ACEITE:"Aceite",
    SCPC:"SCPC",
    CARTORIO:"Cartório",
    COBRADORA:"Cobradora",
    CANCELADO:"Cancelado",
    SUBSTITUIDO:"Substituído",
    CUSTODIA:"Custódia",
    COMPETENCIA:"Competência",
    COMBINADO:"Combinado",
    EMISSAO:"Emissão"
  };

  const mapa = new Map();

  (linhas || []).forEach(row=>{
    const codigos = new Set(
      String(row.dataset.situacoes || "")
        .split("|")
        .map(x=>x.trim().toUpperCase())
        .filter(Boolean)
    );

    const status = String(row.dataset.statusFinanceiro || "").toUpperCase();
    const prazo = String(row.dataset.situacao || "").toUpperCase();

    if(status==="A") codigos.add("ABERTO");
    if(status==="B") codigos.add("BAIXADO");
    if(status==="C") codigos.add("CANCELADO");
    if(prazo==="VENCIDO") codigos.add("ATRASADO");

    codigos.forEach(codigo=>{
      if(!labels[codigo]) return;
      const atual = mapa.get(codigo) || {
        codigo,
        nome:labels[codigo],
        valor:0,
        qtd:0
      };
      atual.valor += Number(row.dataset.valor || 0);
      atual.qtd += 1;
      mapa.set(codigo,atual);
    });
  });

  return [...mapa.values()]
    .sort((a,b)=>Math.abs(b.valor)-Math.abs(a.valor));
}

function renderGraficoSituacaoLocal(tipo){
  if(tipo !== "pagar") return;

  const tableId = "qdTabelaPagar";
  const linhas = obterLinhasSituacaoFacetadas(tableId,tipo);
  const dados = agruparSituacoesReaisDaTabela(linhas);

  // Se ainda não há base local, mantém o gráfico vindo da API.
  if(!dados.length && !qdCacheValido(tipo)){
    return;
  }

  const box = document.getElementById("qdPagarSituacaoGrafico");
  if(!box) return;

  if(!dados.length){
    box.innerHTML = `<div class="empty">Sem situações para os filtros selecionados.</div>`;
    return;
  }

  const maior = Math.max(...dados.map(x=>Math.abs(Number(x.valor||0))),1);
  const total = dados.reduce((s,x)=>s+Math.abs(Number(x.valor||0)),0);

  box.innerHTML = dados.map(x=>{
    const pct = Math.max(Math.abs(Number(x.valor||0))/maior*100,1);
    const pctTotal = total>0 ? Math.abs(Number(x.valor||0))/total*100 : 0;
    const selecionado = qdSituacaoSelecionada(tipo,x.codigo);

    return `
      <div
        class="qd-situacao-row ${selecionado ? "selected" : ""}"
        data-codigo="${esc(x.codigo)}"
        onclick="qdToggleSituacaoGrafico('pagar','${String(x.codigo).replace(/'/g,"\\'")}',event)"
        title="1 clique seleciona/remove • vários cliques acumulam • 2 cliques limpa"
      >
        <div class="qd-situacao-label">${esc(x.nome)}</div>
        <div class="qd-situacao-track">
          <div class="qd-situacao-fill" style="width:${pct}%"></div>
        </div>
        <div class="qd-situacao-value">
          <strong>${fmtMoeda(x.valor)}</strong>
          <small>${fmtPct(pctTotal)} • ${fmtNumero(x.qtd)} título(s)</small>
        </div>
      </div>
    `;
  }).join("");
}

function obterLinhasFacetadasTabela(tableId, tipo, exceto){
  const table = document.getElementById(tableId);
  if(!table?.tBodies?.[0]) return [];

  return [...table.tBodies[0].rows].filter(row => {
    if(row.dataset.valor === undefined) return false;

    return linhaPassaFiltrosQuadroExceto(row,tipo,exceto) &&
      linhaPassaFiltrosColuna(row,table);
  });
}

function qdValorTabelaPorColuna(row, coluna){
  const mapa = {
    0: () => String(row.cells[0]?.textContent || "").trim(),
    1: () => String(row.dataset.empresa || "").trim(),
    2: () => String(row.dataset.pessoa || "").trim(),
    3: () => String(row.cells[3]?.textContent || "").trim(),
    4: () => String(row.cells[4]?.textContent || "").trim(),
    5: () => String(row.dataset.conta || "").trim(),
    6: () => String(row.dataset.situacao || "").trim(),
    7: () => String(row.cells[7]?.textContent || "").trim()
  };
  return (mapa[coluna] || (() => String(row.cells[coluna]?.textContent || "").trim()))();
}

function qdSelecionarCelulaTabela(tipo, td){
  if(!td) return;

  const row = td.closest("tr");
  if(!row || row.dataset.valor === undefined) return;

  const coluna = td.cellIndex;
  const valor = qdValorTabelaPorColuna(row,coluna);
  const st = QD_FILTROS[tipo];
  if(!st || !valor) return;

  if(coluna === 1){
    qdToggleSet(st.empresas,valor);
  }else if(coluna === 6){
    qdToggleSet(
      st.status,
      valor.toUpperCase() === "VENCIDO" ? "vencido" : "avencer"
    );
  }else{
    qdToggleSet(qdSetTabela(tipo,coluna),valor);
  }

  aplicarFiltrosLocaisQuadroTabela(tipo);
}

function qdAtualizarMarcacoesTabela(tipo){
  const table = document.getElementById(tipo === "receber" ? "qdTabelaReceber" : "qdTabelaPagar");
  const st = QD_FILTROS[tipo];
  if(!table || !st) return;

  [...(table.tBodies?.[0]?.rows || [])].forEach(row => {
    if(row.dataset.valor === undefined) return;

    [...row.cells].forEach(td => {
      const coluna = td.cellIndex;
      const valor = qdValorTabelaPorColuna(row,coluna);
      let ativo=false;

      if(coluna===1) ativo=st.empresas.has(valor);
      else if(coluna===6){
        const x=valor.toUpperCase()==="VENCIDO" ? "vencido" : "avencer";
        ativo=st.status.has(x);
      }else ativo=qdSetTabela(tipo,coluna).has(valor);

      td.classList.toggle("qd-cell-selected",ativo);
    });
  });
}

function linhaPassaFiltrosColuna(row, table){
  const filtros = [...table.querySelectorAll(".fin-table-filter-row input")]
    .map(i => String(i.value || "").trim().toLocaleLowerCase("pt-BR"));

  return filtros.every((filtro, idx) => {
    if(!filtro) return true;

    const texto = String(row.cells[idx]?.textContent || "")
      .trim()
      .toLocaleLowerCase("pt-BR");

    return texto.includes(filtro);
  });
}

function aplicarFiltrosLocaisQuadroTabela(tipo){
  if(!qdCacheValido(tipo)) return false;

  const visaoAtual = tipo === "receber"
    ? (document.getElementById("qdReceberVisao")?.value || "forma")
    : (document.getElementById("qdPagarVisao")?.value || "plano");

  const st = QD_FILTROS[tipo];
  if(st && st.visao !== visaoAtual){
    st.visao = visaoAtual;
    st.itens.clear();
  }

  const tableId = tipo === "receber" ? "qdTabelaReceber" : "qdTabelaPagar";
  const table = document.getElementById(tableId);
  if(!table?.tBodies?.[0]) return false;

  [...table.tBodies[0].rows].forEach(row => {
    if(row.dataset.valor === undefined) return;

    const mostrar =
      linhaPassaFiltrosQuadro(row, tipo) &&
      linhaPassaFiltrosColuna(row, table);

    row.style.display = mostrar ? "" : "none";
  });

  atualizarTotalTabelaFinanceiro(tableId);
  atualizarQuadroPelosFiltrosTabela(tableId);
  qdAtualizarEstadoVisual(tipo);
  qdAtualizarMarcacoesTabela(tipo);

  renderGraficoSituacaoLocal(tipo);
  qdAtualizarSituacoesMarcadas(tipo);

  return true;
}

function filtrarTabelaFinanceiro(tableId){
  const tipo = tableId === "qdTabelaReceber" ? "receber" : "pagar";

  if(qdCacheValido(tipo)){
    aplicarFiltrosLocaisQuadroTabela(tipo);
    return;
  }

  const table = document.getElementById(tableId);
  if(!table?.tBodies?.[0]) return;

  [...table.tBodies[0].rows].forEach(row => {
    if(row.dataset.valor === undefined) return;
    row.style.display = linhaPassaFiltrosColuna(row, table) ? "" : "none";
  });

  atualizarTotalTabelaFinanceiro(tableId);
  atualizarQuadroPelosFiltrosTabela(tableId);
}

// Depois de toda renderização principal, garante que as tabelas continuem ocultas
// até o usuário solicitar explicitamente.
document.addEventListener("DOMContentLoaded", () => {
  prepararTabelasFinanceiro();
});


// ============================================================
// SLOT FIXO DO QUADRO DEMONSTRATIVO
// Fica IMEDIATAMENTE abaixo dos filtros, no espaço vazio da direita.
// ============================================================
const FIN_DEMO_SLOT_STATE = {
  atual: null,
  origens: new Map()
};

function registrarOrigemDemo(el){
  if(!el || FIN_DEMO_SLOT_STATE.origens.has(el.id)) return;
  FIN_DEMO_SLOT_STATE.origens.set(el.id, {
    parent: el.parentNode,
    next: el.nextSibling
  });
}

function restaurarDemoAtual(){
  const slot = document.getElementById("financeDemoSlot");
  if(!slot) return;

  const board = slot.querySelector(".qd-board");
  if(board){
    const origem = FIN_DEMO_SLOT_STATE.origens.get(board.id);
    if(origem?.parent){
      if(origem.next && origem.next.parentNode === origem.parent){
        origem.parent.insertBefore(board, origem.next);
      }else{
        origem.parent.appendChild(board);
      }
    }
  }

  slot.innerHTML = "";
  slot.classList.remove("active");
  FIN_DEMO_SLOT_STATE.atual = null;
}


function removerBotoesDuplicadosCarregarTabela(){
  const todos = [...document.querySelectorAll("button")].filter(btn =>
    String(btn.textContent || "").trim().toLowerCase() === "carregar tabela"
  );

  const oficial = document.getElementById("btnCarregarTabelaFinanceiro");

  todos.forEach(btn => {
    if(btn !== oficial) {
      const footer = btn.closest(".fin-table-footer, .fin-demo-slot-footer");
      if(footer && footer !== oficial?.parentElement) {
        footer.remove();
      } else {
        btn.remove();
      }
    }
  });
}

function mostrarQuadroNoEspacoCerto(nomeAba){
  const slot = document.getElementById("financeDemoSlot");
  if(!slot) return;

  const config = {
    crediario: {
      boardId: "qdReceberBoard",
      viewId: "view-crediario",
      tipo: "receber"
    },
    contas_pagar: {
      boardId: "qdPagarBoard",
      viewId: "view-contas-pagar",
      tipo: "pagar"
    },
    ativo_passivo: {
      boardId: "qdPosicaoBoard",
      viewId: "view-ativo-passivo",
      tipo: "posicao"
    }
  }[nomeAba];

  if(!config){
    restaurarDemoAtual();
    return;
  }

  const board = document.getElementById(config.boardId);
  if(!board) return;

  if(FIN_DEMO_SLOT_STATE.atual !== nomeAba){
    restaurarDemoAtual();
  }

  registrarOrigemDemo(board);

  // Limpa completamente o slot antes de remontar.
  slot.innerHTML = "";
  slot.appendChild(board);

  // Receber/Pagar mantêm o botão genérico já existente.
  // Posição Financeira possui seu próprio botão dentro do quadro.
  if(config.tipo !== "posicao"){
    const footer = document.createElement("div");
    footer.className = "fin-demo-slot-footer";
    footer.innerHTML = `
      <button id="btnCarregarTabelaFinanceiro" class="btn fin-load-table-btn" type="button"
        onclick="abrirTabelaFinanceiro('${config.viewId}')">
        Carregar tabela
      </button>
    `;
    slot.appendChild(footer);
  }

  slot.classList.add("active");
  FIN_DEMO_SLOT_STATE.atual = nomeAba;

  if(config.tipo === "receber" || config.tipo === "pagar"){
    carregarQuadroDemonstrativo(config.tipo);
  }else if(config.tipo === "posicao"){
    // A carga é feita por recarregarAbaAtual(), evitando consulta duplicada.
  }

  const view = document.getElementById(config.viewId);

  if(config.tipo !== "posicao"){
    atualizarBotaoTabelaInline(
      config.viewId,
      !!view?.classList.contains("fin-table-inline-open")
    );

    removerBotoesDuplicadosCarregarTabela();
  }
}


document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if(
      abaAtual === "crediario" ||
      abaAtual === "contas_pagar" ||
      abaAtual === "ativo_passivo"
    ){
      mostrarQuadroNoEspacoCerto(abaAtual);
    }
  }, 0);
});


document.addEventListener("input",event=>{
  const input = event.target;
  if(!input?.closest) return;

  const table = input.closest("#qdTabelaReceber,#qdTabelaPagar");
  if(!table) return;

  if(
    input.tagName === "INPUT" &&
    (
      input.classList.contains("table-filter-input") ||
      input.closest("thead")
    )
  ){
    const tipo = table.id === "qdTabelaReceber" ? "receber" : "pagar";
    setTimeout(()=>aplicarFiltrosLocaisQuadroTabela(tipo),0);
  }
});



// Acesso direto ao novo Fluxo de Caixa Projetado.
if (window.location.hash === "#fluxo-caixa-projetado" || window.location.hash === "#fluxo-projetado") {
  setTimeout(() => trocarAba("fluxo_projetado"), 0);
}

try{ atualizarCamposInlineFluxoProjetado(abaAtual); }catch(_e){}
try{ atualizarSituacaoFluxoProjetado(abaAtual); }catch(_e){}

// CREDIÁRIO - atualização manual do cache analítico
document.addEventListener("click", async (ev)=>{
  const btn=ev.target.closest("#btnCredAtualizarCache");
  if(!btn) return;
  const original=btn.textContent;
  try{
    btn.disabled=true;
    btn.textContent="Atualizando...";
    await getJSON("/api/financeiro/crediario-cache/limpar");
    await carregarCrediario();
  }catch(e){
    console.error("Falha ao atualizar cache do crediário:",e);
  }finally{
    btn.disabled=false;
    btn.textContent=original;
  }
});
