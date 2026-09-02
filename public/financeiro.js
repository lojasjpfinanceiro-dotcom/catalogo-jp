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

  if (nome === "geral") {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 60);

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
    const incluir = !!document.getElementById("finIncluirTransferencias")?.checked;
    const sep = String(url).includes("?") ? "&" : "?";
    if(!/[?&]incluirTransferencias=/.test(String(url))){
      url = `${url}${sep}incluirTransferencias=${incluir ? "1" : "0"}`;
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
function montarUrlDreDetalhe(grupo){
  const qs = new URLSearchParams();

  if ((els.empresa.value || "").trim()) {
    qs.set("empresa", (els.empresa.value || "").trim());
  }

  if (els.dataIni.value) {
    qs.set("dataIni", els.dataIni.value);
  }

  if (els.dataFim.value) {
    qs.set("dataFim", els.dataFim.value);
  }

  if (els.tipo?.value && els.tipo.value !== "todos") {
    qs.set("tipo", els.tipo.value);
  }

  qs.set("grupo", grupo);

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
  if(finSituacao) finSituacao.value = "ABERTO";

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

function trocarAba(nome){
  abaAtual = nome;
  atualizarFiltrosContextuaisFinanceiro(nome);

  if(!els.dataIni.value || !els.dataFim.value){
    aplicarDatasPadraoPorAba(nome === "central" ? "geral" : nome);
  }

  const mapaViews = {
    central: "view-central",
    geral: "view-geral",
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
    setTimeout(() => carregarDetalheDRE("01-COMPRAS"), 1200);
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

async function carregarCrediario(){
  // O dashboard antigo de crediário pertence exclusivamente ao módulo
  // "Análise de Crediário". Nunca deve rodar dentro de Contas a Receber.
  if (abaAtual !== "analise_crediario") {
    return;
  }
  const reqId = ++crediarioRequestId;

  try{
    document.body.style.cursor = "wait";

    const qs = new URLSearchParams();
    if ((els.empresa.value || "").trim()) qs.set("empresa", (els.empresa.value || "").trim());
    if (els.dataIni.value) qs.set("dataIni", els.dataIni.value);
    if (els.dataFim.value) qs.set("dataFim", els.dataFim.value);

    const [rResumo, rDashboard] = await Promise.all([
      getJSON(`/api/financeiro/crediario-resumo?${qs.toString()}`),
      getJSON(`/api/financeiro/crediario-dashboard?${qs.toString()}`).catch(() => ({ indicadores:{}, aging:[], lojas:[], prioridade:[] }))
    ]);

    if (reqId !== crediarioRequestId) return;

    const d = rResumo.resumo || {};

    els.credVendido.textContent = fmtMoeda(d.vendido || 0);
    els.credRecebido.textContent = fmtMoeda(d.recebido || 0);
    els.credVencido.textContent = fmtMoeda(d.vencido || 0);
    els.credAVencer.textContent = fmtMoeda(d.aVencer || 0);
    els.credJuros.textContent = fmtMoeda(d.jurosRecebidos || 0);
    els.credInadimplenciaPct.textContent = fmtPct(d.inadimplenciaPct || 0);
    els.credNaoNegativados.textContent = fmtNumero(d.qtdVencidosNaoNegativados || 0);
    els.credDescontos.textContent = fmtMoeda(d.descontos || 0);

    els.credQtdVendidos.textContent = fmtNumero(d.qtdVendido || 0);
    els.credQtdBaixados.textContent = fmtNumero(d.qtdBaixados || 0);
    els.credQtdVencidos.textContent = fmtNumero(d.qtdVencidos || 0);
    els.credQtdAVencer.textContent = fmtNumero(d.qtdAVencer || 0);

    const di = rDashboard.indicadores || {};
    if (els.credCarteiraTotal) els.credCarteiraTotal.textContent = fmtMoeda(di.carteira || d.aberto || 0);
    if (els.credClientesSaldo) els.credClientesSaldo.textContent = fmtNumero(di.clientesComSaldo || 0);
    if (els.credClientesInad) els.credClientesInad.textContent = fmtNumero(di.clientesInadimplentes || 0);
    if (els.credTicketCarteira) els.credTicketCarteira.textContent = fmtMoeda(di.ticketCarteira || 0);
    if (els.credVencido30) els.credVencido30.textContent = fmtMoeda(di.vencido30 || 0);
    if (els.credVencido90) els.credVencido90.textContent = fmtMoeda(di.vencido90 || 0);
    renderCredSaude(d);
    renderCredAging(rDashboard.aging || []);
    renderCredLojas(rDashboard.lojas || []);
    renderCredPrioridade(rDashboard.prioridade || []);

    const rTitulos = await getJSON(`/api/financeiro/crediario-titulos?${qs.toString()}`).catch(() => ({ titulos: [] }));
    const rMensal = await getJSON(`/api/financeiro/crediario-mensal?${qs.toString()}`).catch(() => ({ data: [] }));
    const rRanking = await getJSON(`/api/financeiro/crediario-ranking-inadimplentes?${qs.toString()}`).catch(() => ({ data: [] }));
    const rProjecao = await getJSON(`/api/financeiro/crediario-projecao?${qs.toString()}`).catch(() => ({ data: [] }));

    if (reqId !== crediarioRequestId) return;

    const titulos = Array.isArray(rTitulos.titulos) ? rTitulos.titulos : [];
    const scpcResumo = Array.isArray(d.scpcResumo) ? d.scpcResumo : [];
    const mensal = Array.isArray(rMensal.data) ? rMensal.data : [];
    const ranking = Array.isArray(rRanking.data) ? rRanking.data : [];
    const projecao = Array.isArray(rProjecao.data) ? rProjecao.data : [];

    renderCredScpcResumo(scpcResumo);
    renderCredMensal(mensal);
    renderCredRanking(ranking);
    renderCredProjecao(projecao);

    els.credTitulos.innerHTML = titulos.length
      ? titulos.map(x => `
          <tr>
            <td>${fmtData(x.lancamento)}</td>
            <td>${fmtData(x.vencimento)}</td>
            <td>${fmtData(x.pagamento)}</td>
            <td>${esc(x.documento || "-")}</td>
            <td>${esc(x.empresa || "-")}</td>
            <td>${esc(x.cliente || "-")}</td>
            <td class="num">${fmtMoeda(x.valor || 0)}</td>
            <td class="num">${fmtMoeda(x.valorPago || 0)}</td>
            <td class="num">${fmtMoeda(x.faltaReceber || 0)}</td>
            <td>${esc(x.situacao || "-")}</td>
            <td>
              <span class="pill ${
                x.scpcStatus === "Nada consta" ? "ok" :
                x.scpcStatus === "Reabilitado" ? "ok" :
                "acima"
              }">
                ${esc(x.scpcStatus || "Não metrificado")}
              </span>
            </td>
            <td>${fmtData(x.scpcEntrada)}</td>
            <td>${fmtData(x.scpcSaida)}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="13" class="empty">Sem dados</td></tr>`;

    ativarOrdenacaoEmTodasAsTabelas();

  } catch (e){
    if (reqId !== crediarioRequestId) return;

    console.error("Erro ao carregar crediário:", e);

    els.credTitulos.innerHTML = `<tr><td colspan="13" class="empty">Erro ao carregar dados do crediário.</td></tr>`;
  } finally {
    if (reqId === crediarioRequestId) {
      document.body.style.cursor = "default";
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

function renderGraficoDRE(lista, totalBase){
  if (!lista.length){
    els.graficoDRE.innerHTML = `<div class="empty">Sem dados para o gráfico DRE.</div>`;
    return;
  }

  els.graficoDRE.innerHTML = lista.map((x, idx) => {
    const pct = totalBase > 0 ? (Number(x.valor || 0) / totalBase) * 100 : 0;
    const cor = Number(x.realizado || 0) <= Number(x.meta || 0) ? "#22c55e" : "#fb7185";

    return `
      <div class="bar-row" data-idx="${idx}">
        <div class="bar-label" title="${esc(x.grupo)}">${esc(x.grupo)}</div>
        <div class="bar-track" title="Meta: ${fmtPct(x.meta)} | Real: ${fmtPct(x.realizado)} | Valor: ${fmtMoeda(x.valor)}">
          <div class="bar-fill" style="width:${Math.max(pct,1)}%; background:${cor};"></div>
        </div>
        <div class="bar-value">${fmtMoeda(x.valor)}</div>
      </div>
    `;
  }).join("");

  [...els.graficoDRE.querySelectorAll(".bar-row")].forEach((el, idx) => {
    el.addEventListener("click", () => carregarDetalheDRE(lista[idx].grupo));
  });
}

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

window.carregarDetalheDRE = async function carregarDetalheDRE(grupo){
  const grupoSel = String(grupo || "").trim();

  if (!grupoSel){
    alert("Grupo do DRE inválido.");
    return;
  }

  try{
    document.body.style.cursor = "wait";

    els.dreDetailTitle.textContent = `Detalhamento do DRE - ${grupoSel}`;
    els.dreDetailSubtitle.textContent = "Carregando detalhes.";
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
    document.body.style.cursor = "default";
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
    if (th.dataset.sortBound === "1") return;

    th.dataset.sortBound = "1";
    th.dataset.colIndex = String(index);

    th.addEventListener("click", () => {
      const colIndex = Number(th.dataset.colIndex || index);

      const rows = [...tbody.querySelectorAll("tr")]
        .filter(tr => !tr.querySelector(".empty"));

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

      tbody.innerHTML = "";
      rows.forEach(r => tbody.appendChild(r));
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
    document.body.style.cursor = "wait";

    const dreData = await getJSON(montarUrlDRE());
    const fat = Number(dreData.totalFaturado || 0);
    const pago = Number(dreData.totalPago || 0);
    const saldo = fat - pago;
    const realTotal = Number(dreData.totalRealPercentual || 0);

    els.dreFatTotal.textContent = fmtMoeda(fat);
    els.drePagTotal.textContent = fmtMoeda(pago);
    els.dreMetaTotal.textContent = fmtPct(dreData.totalMetaPercentual || 0);
    els.dreRealTotal.textContent = fmtPct(realTotal);
    els.dreSaldo.textContent = fmtMoeda(saldo);

    const dadosBase = Array.isArray(dreData.dados) ? dreData.dados : [];

    if (!dadosBase.length){
      els.dreTbody.innerHTML = `<tr><td colspan="7" class="empty">Sem dados no DRE.</td></tr>`;
      els.dreAcimaMeta.textContent = "0";
      els.dreMaiorDesvio.textContent = "0,00%";
      els.dreGrupoPesado.textContent = "-";
      els.dreGrupoPesadoValor.textContent = "R$ 0,00";
      renderGraficoDRE([], fat);
ativarOrdenacaoEmTodasAsTabelas();
      return;
    }
    const dados = dadosBase.map(x => {
      const valor = Number(x.valor || 0);
      const meta = Number(x.meta || 0);
      const realizado = fat > 0 ? (valor / fat) * 100 : 0;
      const diferenca = realizado - meta;
      const metaValor = fat * (meta / 100);
      const status = realizado <= meta ? "OK" : "ACIMA";

      return {
        ...x,
        realizado,
        diferenca,
        metaValor,
        status
      };
    });

    const acimaMeta = dados.filter(x => x.status === "ACIMA");
    const maiorDesvio = acimaMeta.length
      ? Math.max(...acimaMeta.map(x => Number(x.diferenca || 0)))
      : 0;

    const grupoPesado = [...dados]
      .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))[0] || null;

    els.dreAcimaMeta.textContent = fmtNumero(acimaMeta.length);
    els.dreMaiorDesvio.textContent = fmtPct(maiorDesvio);
    els.dreGrupoPesado.textContent = grupoPesado ? grupoPesado.grupo : "-";
    els.dreGrupoPesadoValor.textContent = grupoPesado ? fmtMoeda(grupoPesado.valor) : "R$ 0,00"
    const totaisDRE = dados.reduce((acc, x) => {
  acc.meta += Number(x.meta || 0);
  acc.realizado += Number(x.realizado || 0);
  acc.diferenca += Number(x.diferenca || 0);
  acc.valor += Number(x.valor || 0);
  acc.metaValor += Number(x.metaValor || 0);
  return acc;
}, {
  meta: 0,
  realizado: 0,
  diferenca: 0,
  valor: 0,
  metaValor: 0
});

els.dreTbody.innerHTML = dados.map(x => {
  const grupoSeguro = encodeURIComponent(String(x.grupo || ""));

  return `
    <tr class="card-click" onclick="abrirDetalheDRELinha('${grupoSeguro}')" style="cursor:pointer;">
      <td>${esc(x.grupo)}</td>
      <td class="num">${fmtPct(x.meta)}</td>
      <td class="num">${fmtPct(x.realizado)}</td>
      <td class="num">${fmtPct(x.diferenca)}</td>
      <td class="num">${fmtMoeda(x.valor)}</td>
      <td class="num">${fmtMoeda(x.metaValor)}</td>
      <td>${x.status === "OK" ? '<span class="pill ok">OK</span>' : '<span class="pill acima">ACIMA</span>'}</td>
    </tr>
  `;
}).join("") + `
  <tr style="font-weight:900;background:#0e1f3d;">
    <td>TOTAL</td>
    <td class="num">${fmtPct(totaisDRE.meta)}</td>
    <td class="num">${fmtPct(totaisDRE.realizado)}</td>
    <td class="num">${fmtPct(totaisDRE.diferenca)}</td>
    <td class="num">${fmtMoeda(totaisDRE.valor)}</td>
    <td class="num">${fmtMoeda(totaisDRE.metaValor)}</td>
    <td>-</td>
  </tr>
`;

renderGraficoDRE(dados, fat);


ativarOrdenacaoEmTodasAsTabelas();
  } catch (err){
    console.error(err);
    els.dreTbody.innerHTML = `<tr><td colspan="7" class="empty">Erro ao carregar DRE.</td></tr>`;
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
  const marcado = !!input?.checked;

  // Invalida caches que podem conter valores calculados com a regra anterior.
  try{ qdInvalidarCache("receber"); }catch(_){}
  try{ qdInvalidarCache("pagar"); }catch(_){}

  if(typeof QD_CACHE !== "undefined" && QD_CACHE?.clear){
    try{ QD_CACHE.clear(); }catch(_){}
  }

  // Invalida caches das demais análises quando existirem.
  if(typeof RENT_CACHE_CARREGADO !== "undefined") RENT_CACHE_CARREGADO = false;
  if(typeof RENT_CACHE_CHAVE !== "undefined") RENT_CACHE_CHAVE = "";
  if(typeof AP_DETALHE_CARREGADO !== "undefined") AP_DETALHE_CARREGADO = false;
  if(typeof AP_DETALHE_CACHE_CHAVE !== "undefined") AP_DETALHE_CACHE_CHAVE = "";

  document.body.classList.toggle("fin-inclui-transferencias", marcado);

  // Recalcula a aba atual imediatamente.
  recarregarAbaAtual();
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

