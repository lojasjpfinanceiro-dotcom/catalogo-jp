"use strict";

let ADM_USUARIO = null;
let ADM_PERGUNTAS = [];
let DADOS = null;
let LOJAS_FILTRADAS = [];
let RESUMO_FILTRO = "";
const FILTROS_CRUZADOS = {
  empresas:new Set(),
  status:new Set(),
  vendedores:new Set(),
  motivos:new Set(),
  periodos:new Set()
};
let ORDENACAO = { coluna:"empresa", direcao:1 };
let RELATORIO_DADOS = [];
let RELATORIO_ORDENACAO = { coluna:"data_ref", direcao:-1 };
let AUTO_REFRESH = null;

async function api(url, opts={}){
  const r = await fetch(url,{
    credentials:"same-origin",
    headers:{
      "Content-Type":"application/json",
      ...(opts.headers || {})
    },
    ...opts
  });

  const texto = await r.text();

  let j;
  try{
    j = JSON.parse(texto);
  }catch(e){
    const erro = new Error("Servidor retornou HTML/erro em vez de JSON.");
    erro.status = r.status;
    throw erro;
  }

  if(!r.ok || j.ok === false){
    const erro = new Error(j.erro || "Erro");
    erro.status = r.status;
    throw erro;
  }

  return j;
}

async function executarBotao(btn,texto,fn){
  if(!btn) return await fn();

  const original = btn.textContent;

  try{
    btn.disabled = true;
    btn.textContent = texto || "Executando...";
    return await fn();
  }finally{
    btn.disabled = false;
    btn.textContent = original;
  }
}

function mostrarToast(msg){
  const el = document.getElementById("toast");
  if(!el) return;

  el.textContent = msg;
  el.classList.add("show");

  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(
    ()=>el.classList.remove("show"),
    2000
  );
}

function escaparHtml(valor){
  return String(valor ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('\"',"&quot;")
    .replaceAll("'","&#039;");
}

function iniciaisVendedor(nome){
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (partes[0]?.[0] || "V") + (partes[1]?.[0] || "");
}

function formatarTempo(seg){
  const s = Math.max(0,Number(seg || 0));
  const min = Math.floor(s / 60);
  const resto = Math.floor(s % 60);
  return `${min}m ${String(resto).padStart(2,"0")}s`;
}

function formatarHora(v){
  if(!v) return "-";

  return new Date(v).toLocaleTimeString(
    "pt-BR",
    { hour:"2-digit", minute:"2-digit" }
  );
}

function formatarDataHora(v){
  if(!v) return "-";

  return new Date(v).toLocaleString(
    "pt-BR",
    {
      day:"2-digit",
      month:"2-digit",
      hour:"2-digit",
      minute:"2-digit"
    }
  );
}

function formatarDataBR(v){
  if(!v) return "-";

  const s = String(v).slice(0,10);

  if(/^\d{4}-\d{2}-\d{2}$/.test(s)){
    const [ano,mes,dia] = s.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  return s;
}

function hojeISO(){
  return new Date().toISOString().slice(0,10);
}

function primeiroDiaMesISO(){
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0,10);
}

function inicioAnoISO(){
  const d = new Date();
  d.setMonth(0,1);
  return d.toISOString().slice(0,10);
}

function diasAtrasISO(qtd){
  const d = new Date();
  d.setDate(d.getDate() - Number(qtd || 0));
  return d.toISOString().slice(0,10);
}

function formatarPeriodoLabel(periodo,agrupamento){
  const p = String(periodo || "");

  if(agrupamento === "ano"){
    return p;
  }

  if(agrupamento === "mes" && /^\d{4}-\d{2}$/.test(p)){
    const [ano,mes] = p.split("-");
    return `${mes}/${ano}`;
  }

  if(/^\d{4}-\d{2}-\d{2}$/.test(p)){
    const [ano,mes,dia] = p.split("-");

    if(agrupamento === "semana"){
      return `Sem. ${dia}/${mes}`;
    }

    if(agrupamento === "quinzena"){
      return `${Number(dia) <= 1 ? "1ª" : "2ª"} quinz. ${mes}/${ano}`;
    }

    return `${dia}/${mes}`;
  }

  return p;
}

function aplicarPeriodoRapido(tipo,btn){
  const ini = document.getElementById("filtroDataIni");
  const fim = document.getElementById("filtroDataFim");
  const agrup = document.getElementById("filtroAgrupamento");

  if(!ini || !fim || !agrup) return;

  const hoje = hojeISO();

  if(tipo === "hoje"){
    ini.value = hoje;
    fim.value = hoje;
    agrup.value = "dia";
  }

  if(tipo === "semana"){
    ini.value = diasAtrasISO(6);
    fim.value = hoje;
    agrup.value = "dia";
  }

  if(tipo === "quinzena"){
    ini.value = diasAtrasISO(14);
    fim.value = hoje;
    agrup.value = "dia";
  }

  if(tipo === "mes"){
    ini.value = primeiroDiaMesISO();
    fim.value = hoje;
    agrup.value = "dia";
  }

  if(tipo === "ano"){
    ini.value = inicioAnoISO();
    fim.value = hoje;
    agrup.value = "mes";
  }

  FILTROS_CRUZADOS.periodos.clear();

  document.querySelectorAll(".period-shortcuts button").forEach(x=>{
    x.classList.toggle("active",x === btn);
  });

  atualizarDashboard(btn);
}


/* ==========================================================
   INICIALIZAÇÃO
   ========================================================== */

async function inicializarAdmin(){
  try{
    const sessao = await api("/api/auth/me");
    ADM_USUARIO = sessao.usuario || null;

    if(!ADM_USUARIO){
      throw new Error("Sessão do JP Sistema não encontrada.");
    }

    document.getElementById("cabecalhoUsuario").textContent =
      `${ADM_USUARIO.nome || ADM_USUARIO.codigo || "-"} • ` +
      `${ADM_USUARIO.grupoDescricao || "Acesso gerencial"}`;

    // Ao abrir o Gerencial do Atendimento, as duas datas iniciam em HOJE.
    document.getElementById("relDataIni").value = hojeISO();
    document.getElementById("relDataFim").value = hojeISO();

    const dashIni = document.getElementById("filtroDataIni");
    const dashFim = document.getElementById("filtroDataFim");
    const dashAgrup = document.getElementById("filtroAgrupamento");

    // Visão Geral também inicia com Data inicial e Data final em HOJE.
    if(dashIni && !dashIni.value) dashIni.value = hojeISO();
    if(dashFim && !dashFim.value) dashFim.value = hojeISO();
    if(dashAgrup && !dashAgrup.value) dashAgrup.value = "dia";

    const manutIni = document.getElementById("manutDataIni");
    const manutFim = document.getElementById("manutDataFim");

    if(manutIni && !manutIni.value) manutIni.value = hojeISO();
    if(manutFim && !manutFim.value) manutFim.value = hojeISO();

    await Promise.all([
      atualizarDashboard(null,true),
      carregarPerguntas()
    ]);

    // Relatório já fica pronto quando o usuário abrir a aba.
    carregarRelatorioAdmin()
      .catch(console.error);

    AUTO_REFRESH = setInterval(()=>{
      if(!document.hidden){
        atualizarDashboard(null,true);
      }
    },30000);

  }catch(e){
    console.error("Erro ao abrir Atendimento Gerencial:",e);

    if(e.status === 401){
      window.location.href =
        "/login.html?destino=" +
        encodeURIComponent(
          window.location.pathname + window.location.search
        );
      return;
    }

    alert(
      "Não foi possível abrir o Atendimento Gerencial: " +
      (e.message || e)
    );
  }
}

/* ==========================================================
   NAVEGAÇÃO
   ========================================================== */

function abrirAbaAdmin(nome,btn){
  document.querySelectorAll(".admin-view").forEach(x=>{
    x.classList.remove("active");
  });

  document.querySelectorAll(".admin-nav-btn").forEach(x=>{
    x.classList.remove("active");
  });

  const aba = document.getElementById(`aba-${nome}`);
  if(aba) aba.classList.add("active");
  if(btn) btn.classList.add("active");

  if(nome === "motivos"){
    carregarPerguntas().catch(console.error);
  }

  if(nome === "relatorios"){
    sincronizarFiltrosAuxiliares();

    const dashIni =
      document.getElementById("filtroDataIni")?.value;

    const dashFim =
      document.getElementById("filtroDataFim")?.value;

    const relIni =
      document.getElementById("relDataIni");

    const relFim =
      document.getElementById("relDataFim");

    if(relIni && dashIni) relIni.value = dashIni;
    if(relFim && dashFim) relFim.value = dashFim;

    carregarRelatorioAdmin()
      .catch(console.error);
  }
}

/* ==========================================================
   DASHBOARD - TODAS AS LOJAS
   ========================================================== */

async function atualizarDashboard(btn,silencioso=false){
  return executarBotao(btn,"Atualizando...",async()=>{
    try{
      const dataIni =
        document.getElementById("filtroDataIni")?.value ||
        primeiroDiaMesISO();

      const dataFim =
        document.getElementById("filtroDataFim")?.value ||
        hojeISO();

      const agrupamento =
        document.getElementById("filtroAgrupamento")?.value ||
        "dia";

      const qs = new URLSearchParams({
        data_ini:dataIni,
        data_fim:dataFim,
        agrupamento
      });

      DADOS = await api(
        "/api/atendimento/dashboard-lojas?" + qs.toString()
      );

      popularFiltroLojas();
      aplicarFiltros();

      document.getElementById("ultimaAtualizacao").textContent =
        "Atualizado " + formatarHora(DADOS.atualizado_em);

      const p = DADOS?.periodo || {};

      const periodoLegenda =
        document.getElementById("periodoLegenda");

      if(periodoLegenda){
        periodoLegenda.textContent =
          `${formatarDataBR(p.data_ini)} → ${formatarDataBR(p.data_fim)}`;
      }

      const movLabel =
        document.getElementById("movimentoAgrupamentoLabel");

      if(movLabel){
        const nomes = {
          dia:"Por dia",
          semana:"Por semana",
          quinzena:"Por quinzena",
          mes:"Por mês",
          ano:"Por ano"
        };

        movLabel.textContent =
          nomes[p.agrupamento] || "Por dia";
      }

      if(!silencioso){
        mostrarToast("Painel atualizado.");
      }

    }catch(e){
      console.error("Erro dashboard gerencial:",e);

      document.getElementById("cardsLojas").innerHTML =
        `<div class="loading-card">⚠ ${e.message}</div>`;

      if(!silencioso){
        alert("Erro ao atualizar painel: " + e.message);
      }
    }
  });
}

function popularFiltroLojas(){
  if(!DADOS) return;

  const ids = [
    "filtroLoja",
    "relEmpresa"
  ];

  for(const id of ids){
    const sel = document.getElementById(id);
    if(!sel) continue;

    const atual = sel.value;

    const primeira =
      `<option value="">Todas as lojas</option>`;

    const opcoes = (DADOS.lojas || []).map(x=>`
      <option value="${x.empresa}">
        ${x.empresa} • ${x.nome || "Loja "+x.empresa}
      </option>
    `).join("");

    sel.innerHTML = primeira + opcoes;

    if([...sel.options].some(o=>o.value === atual)){
      sel.value = atual;
    }
  }

  renderLojasManutencao();
}

function sincronizarFiltrosAuxiliares(){
  popularFiltroLojas();
}

function criterioStatusLoja(loja,tipo){
  if(tipo === "ATIVA") return Boolean(loja.central_ativa);
  if(tipo === "INATIVA") return !loja.central_ativa;
  if(tipo === "DISP") return Number(loja.disponiveis || 0) > 0;
  if(tipo === "FILA") return Number(loja.fila || 0) > 0;
  if(tipo === "EM") return Number(loja.em_atendimento || 0) > 0;
  if(tipo === "ATEND") return Number(loja.atendimentos || 0) > 0;
  if(tipo === "FINAL") return Number(loja.finalizados || 0) > 0;
  return true;
}

function chaveVendedor(empresa,codigo){
  return `${String(empresa)}|${String(codigo)}`;
}

function motivosDoAtendimento(item){
  return String(item?.motivos || "")
    .split("|||")
    .map(x=>x.trim())
    .filter(Boolean);
}

function vendedorSelecionado(empresa,codigo){
  if(!FILTROS_CRUZADOS.vendedores.size) return true;
  return FILTROS_CRUZADOS.vendedores.has(
    chaveVendedor(empresa,codigo)
  );
}

function motivoSelecionadoNoAtendimento(item){
  if(!FILTROS_CRUZADOS.motivos.size) return true;

  const motivos = motivosDoAtendimento(item);

  return [...FILTROS_CRUZADOS.motivos].some(
    motivo=>motivos.includes(String(motivo))
  );
}

function periodoEstaSelecionado(periodo){
  return (
    FILTROS_CRUZADOS.periodos.size === 0 ||
    FILTROS_CRUZADOS.periodos.has(String(periodo))
  );
}

function empresaPassaFiltrosPrincipais(empresa){
  const empresaSelect =
    document.getElementById("filtroLoja")?.value || "";

  if(empresaSelect && String(empresa) !== empresaSelect){
    return false;
  }

  if(
    FILTROS_CRUZADOS.empresas.size &&
    !FILTROS_CRUZADOS.empresas.has(String(empresa))
  ){
    return false;
  }

  return true;
}

function atendimentosDetalheFiltrados(opcoes={}){
  const {
    ignorarEmpresas=false,
    ignorarVendedores=false,
    ignorarMotivos=false,
    ignorarPeriodos=false
  } = opcoes;

  const empresaSelect =
    document.getElementById("filtroLoja")?.value || "";

  return (DADOS?.atendimentos_detalhe || []).filter(item=>{
    const empresa = String(item.empresa || "");

    if(
      !ignorarPeriodos &&
      !periodoEstaSelecionado(item.periodo)
    ){
      return false;
    }

    if(
      empresaSelect &&
      empresa !== empresaSelect
    ){
      return false;
    }

    if(
      !ignorarEmpresas &&
      FILTROS_CRUZADOS.empresas.size &&
      !FILTROS_CRUZADOS.empresas.has(empresa)
    ){
      return false;
    }

    if(
      !ignorarVendedores &&
      FILTROS_CRUZADOS.vendedores.size &&
      !FILTROS_CRUZADOS.vendedores.has(
        chaveVendedor(empresa,item.vendedor_codigo)
      )
    ){
      return false;
    }

    if(
      !ignorarMotivos &&
      !motivoSelecionadoNoAtendimento(item)
    ){
      return false;
    }

    return true;
  });
}

function vendedoresRelacionadosAosMotivos(){
  const set = new Set();

  if(!FILTROS_CRUZADOS.motivos.size){
    return set;
  }

  for(const item of atendimentosDetalheFiltrados({
    ignorarVendedores:true,
    ignorarMotivos:true
  })){
    if(motivoSelecionadoNoAtendimento(item)){
      set.add(
        chaveVendedor(item.empresa,item.vendedor_codigo)
      );
    }
  }

  return set;
}

function estadoAtualPorEmpresa(){
  const resultado = new Map();
  const vendedoresMotivo = vendedoresRelacionadosAosMotivos();

  const filaPorVendedor = new Map(
    (DADOS?.fila_detalhe || []).map(x=>[
      chaveVendedor(x.empresa,x.vendedor_codigo),
      x
    ])
  );

  for(const vendedor of DADOS?.equipe_detalhe || []){
    const empresa = String(vendedor.empresa || "");
    const chave = chaveVendedor(
      empresa,
      vendedor.vendedor_codigo
    );

    const empresaSelect =
      document.getElementById("filtroLoja")?.value || "";

    if(empresaSelect && empresa !== empresaSelect) continue;

    if(
      FILTROS_CRUZADOS.empresas.size &&
      !FILTROS_CRUZADOS.empresas.has(empresa)
    ) continue;

    if(
      FILTROS_CRUZADOS.vendedores.size &&
      !FILTROS_CRUZADOS.vendedores.has(chave)
    ) continue;

    if(
      FILTROS_CRUZADOS.motivos.size &&
      !vendedoresMotivo.has(chave)
    ) continue;

    if(!resultado.has(empresa)){
      resultado.set(empresa,{
        equipe_total:0,
        disponiveis:0,
        fila:0,
        em_atendimento:0
      });
    }

    const r = resultado.get(empresa);
    r.equipe_total += 1;

    const atual = filaPorVendedor.get(chave);
    const status = String(atual?.status || "");

    if(status === "ESPERANDO"){
      r.fila += 1;
    }else if(
      status === "EM_ATENDIMENTO" ||
      status === "POS_ATENDIMENTO"
    ){
      r.em_atendimento += 1;
    }else{
      r.disponiveis += 1;
    }
  }

  return resultado;
}

function historicoPorEmpresa(){
  const mapa = new Map();

  for(const item of atendimentosDetalheFiltrados()){
    const empresa = String(item.empresa || "");

    if(!mapa.has(empresa)){
      mapa.set(empresa,{
        atendimentos:0,
        finalizados:0,
        duracao_total_seg:0
      });
    }

    const r = mapa.get(empresa);
    r.atendimentos += 1;

    if(String(item.status) === "FINALIZADO"){
      r.finalizados += 1;
      r.duracao_total_seg += Number(item.duracao_seg || 0);
    }
  }

  return mapa;
}

function movimentoPorEmpresa(){
  return historicoPorEmpresa();
}

function periodosDoMovimento(){
  const mapa = new Map();

  // Ignora somente a própria dimensão "período":
  // vendedor, motivo e loja continuam filtrando este gráfico.
  for(const item of atendimentosDetalheFiltrados({
    ignorarPeriodos:true
  })){
    const periodo = String(item.periodo || "");
    if(!periodo) continue;

    if(!mapa.has(periodo)){
      mapa.set(periodo,{
        periodo,
        data_inicial:item.iniciou_em
          ? String(item.iniciou_em).slice(0,10)
          : "",
        data_final:item.iniciou_em
          ? String(item.iniciou_em).slice(0,10)
          : "",
        atendimentos:0,
        finalizados:0,
        duracao_total_seg:0
      });
    }

    const r = mapa.get(periodo);
    r.atendimentos += 1;

    const dataItem = item.iniciou_em
      ? String(item.iniciou_em).slice(0,10)
      : "";

    if(dataItem){
      if(!r.data_inicial || dataItem < r.data_inicial){
        r.data_inicial = dataItem;
      }
      if(!r.data_final || dataItem > r.data_final){
        r.data_final = dataItem;
      }
    }

    if(String(item.status) === "FINALIZADO"){
      r.finalizados += 1;
      r.duracao_total_seg += Number(item.duracao_seg || 0);
    }
  }

  return [...mapa.values()].sort(
    (a,b)=>String(a.periodo).localeCompare(String(b.periodo))
  );
}

function alternarPeriodo(periodo,event){
  if(event?.detail > 1) return;

  const chave = String(periodo);

  if(FILTROS_CRUZADOS.periodos.has(chave)){
    FILTROS_CRUZADOS.periodos.delete(chave);
  }else{
    FILTROS_CRUZADOS.periodos.add(chave);
  }

  aplicarFiltros();
}

function calcularLojasFiltradas(opcoes={}){
  if(!DADOS) return [];

  const {
    ignorarEmpresas=false,
    ignorarStatus=false,
    ignorarVendedores=false,
    ignorarMotivos=false
  } = opcoes;

  const empresaSelect =
    document.getElementById("filtroLoja")?.value || "";

  const statusSelect =
    document.getElementById("filtroStatus")?.value || "";

  const busca =
    String(
      document.getElementById("buscaTabela")?.value || ""
    ).trim().toUpperCase();

  /*
   * Para componentes que ignoram uma dimensão, recalculamos
   * temporariamente os dados sem aquela dimensão.
   */
  let historico;

  if(ignorarVendedores || ignorarMotivos || ignorarEmpresas){
    historico = new Map();

    for(const item of atendimentosDetalheFiltrados({
      ignorarEmpresas,
      ignorarVendedores,
      ignorarMotivos
    })){
      const empresa = String(item.empresa || "");

      if(!historico.has(empresa)){
        historico.set(empresa,{
          atendimentos:0,
          finalizados:0,
          duracao_total_seg:0
        });
      }

      const r = historico.get(empresa);
      r.atendimentos += 1;

      if(String(item.status) === "FINALIZADO"){
        r.finalizados += 1;
        r.duracao_total_seg += Number(item.duracao_seg || 0);
      }
    }
  }else{
    historico = historicoPorEmpresa();
  }

  // Estado atual usa vendedor real, não apenas a empresa do vendedor.
  const atual = estadoAtualPorEmpresa();

  return [...(DADOS.lojas || [])]
    .map(loja=>{
      const empresa = String(loja.empresa || "");
      const hist = historico.get(empresa) || {};
      const est = atual.get(empresa);

      const clone = {...loja};

      if(est){
        clone.equipe_total = Number(est.equipe_total || 0);
        clone.disponiveis = Number(est.disponiveis || 0);
        clone.fila = Number(est.fila || 0);
        clone.em_atendimento = Number(est.em_atendimento || 0);
      }else if(
        FILTROS_CRUZADOS.vendedores.size ||
        FILTROS_CRUZADOS.motivos.size
      ){
        clone.equipe_total = 0;
        clone.disponiveis = 0;
        clone.fila = 0;
        clone.em_atendimento = 0;
      }

      clone.atendimentos =
        Number(hist.atendimentos || 0);

      clone.finalizados =
        Number(hist.finalizados || 0);

      clone.pos_atendimento =
        clone.finalizados;

      clone.tempo_medio_seg =
        clone.finalizados
          ? Number(hist.duracao_total_seg || 0) /
            clone.finalizados
          : 0;

      return clone;
    })
    .filter(loja=>{
      const empresa = String(loja.empresa);

      if(empresaSelect && empresa !== empresaSelect){
        return false;
      }

      if(
        !ignorarEmpresas &&
        FILTROS_CRUZADOS.empresas.size &&
        !FILTROS_CRUZADOS.empresas.has(empresa)
      ){
        return false;
      }

      if(statusSelect && !criterioStatusLoja(loja,statusSelect)){
        return false;
      }

      if(
        busca &&
        !`${loja.empresa} ${loja.nome} ${loja.gerente_nome}`
          .toUpperCase()
          .includes(busca)
      ){
        return false;
      }

      if(
        !ignorarStatus &&
        FILTROS_CRUZADOS.status.size &&
        ![...FILTROS_CRUZADOS.status].some(
          tipo=>criterioStatusLoja(loja,tipo)
        )
      ){
        return false;
      }

      // Se vendedor ou motivo estiver selecionado, lojas sem qualquer
      // dado relacionado deixam de participar dos demais componentes.
      if(
        !ignorarVendedores &&
        FILTROS_CRUZADOS.vendedores.size &&
        Number(loja.equipe_total || 0) === 0 &&
        Number(loja.atendimentos || 0) === 0
      ){
        return false;
      }

      if(
        !ignorarMotivos &&
        FILTROS_CRUZADOS.motivos.size &&
        Number(loja.atendimentos || 0) === 0
      ){
        return false;
      }

      return true;
    });
}

function resumoDasLojas(lista){
  const r = lista.reduce((acc,x)=>{
    acc.lojas_total += 1;
    if(x.central_ativa) acc.lojas_ativas += 1;
    acc.disponiveis += Number(x.disponiveis || 0);
    acc.fila += Number(x.fila || 0);
    acc.em_atendimento += Number(x.em_atendimento || 0);
    acc.atendimentos += Number(x.atendimentos || 0);
    acc.finalizados += Number(x.finalizados || 0);

    if(Number(x.finalizados || 0) > 0){
      acc.tempo_soma +=
        Number(x.tempo_medio_seg || 0) *
        Number(x.finalizados || 0);
      acc.tempo_qtd += Number(x.finalizados || 0);
    }

    return acc;
  },{
    lojas_total:0,
    lojas_ativas:0,
    disponiveis:0,
    fila:0,
    em_atendimento:0,
    atendimentos:0,
    finalizados:0,
    tempo_soma:0,
    tempo_qtd:0
  });

  r.tempo_medio_seg =
    r.tempo_qtd
      ? r.tempo_soma / r.tempo_qtd
      : 0;

  return r;
}

function preencherResumo(){
  /*
   * Os cards de resumo obedecem todos os demais filtros,
   * porém ignoram a própria dimensão "status".
   * Assim os outros cards não somem quando o usuário seleciona
   * Fila + Em atendimento + Finalizados ao mesmo tempo.
   */
  const lista =
    calcularLojasFiltradas({ignorarStatus:true});

  const r = resumoDasLojas(lista);

  document.getElementById("kpiLojas").textContent =
    Number(r.lojas_total || 0);

  document.getElementById("kpiAtivas").textContent =
    Number(r.lojas_ativas || 0);

  document.getElementById("kpiFila").textContent =
    Number(r.fila || 0);

  document.getElementById("kpiPos").textContent =
    Number(r.em_atendimento || 0);

  document.getElementById("kpiAtendimentos").textContent =
    Number(r.atendimentos || 0);

  document.getElementById("kpiFinalizados").textContent =
    Number(r.finalizados || 0);

  document.getElementById("kpiTempo").textContent =
    formatarTempo(r.tempo_medio_seg);

  document
    .querySelectorAll(".summary-card[data-resumo]")
    .forEach(card=>{
      const tipo = card.dataset.resumo || "";
      const selecionado =
        tipo
          ? FILTROS_CRUZADOS.status.has(tipo)
          : FILTROS_CRUZADOS.status.size === 0;

      card.classList.toggle("active",selecionado);
      card.classList.toggle("cross-selected",selecionado && Boolean(tipo));
    });
}

function filtrarResumo(tipo,btn){
  if(!tipo){
    FILTROS_CRUZADOS.status.clear();
  }else if(FILTROS_CRUZADOS.status.has(tipo)){
    FILTROS_CRUZADOS.status.delete(tipo);
  }else{
    FILTROS_CRUZADOS.status.add(tipo);
  }

  aplicarFiltros();
}

function alternarEmpresa(empresa,event){
  if(event?.detail > 1) return;

  const chave = String(empresa);

  if(FILTROS_CRUZADOS.empresas.has(chave)){
    FILTROS_CRUZADOS.empresas.delete(chave);
  }else{
    FILTROS_CRUZADOS.empresas.add(chave);
  }

  aplicarFiltros();
}

function alternarStatus(tipo,event){
  if(event?.detail > 1) return;

  if(FILTROS_CRUZADOS.status.has(tipo)){
    FILTROS_CRUZADOS.status.delete(tipo);
  }else{
    FILTROS_CRUZADOS.status.add(tipo);
  }

  aplicarFiltros();
}

function alternarVendedor(empresa,codigo,event){
  if(event?.detail > 1) return;

  const chave = `${empresa}|${codigo}`;

  if(FILTROS_CRUZADOS.vendedores.has(chave)){
    FILTROS_CRUZADOS.vendedores.delete(chave);
  }else{
    FILTROS_CRUZADOS.vendedores.add(chave);
  }

  aplicarFiltros();
}

function alternarMotivo(motivo,event){
  if(event?.detail > 1) return;

  const chave = String(motivo);

  if(FILTROS_CRUZADOS.motivos.has(chave)){
    FILTROS_CRUZADOS.motivos.delete(chave);
  }else{
    FILTROS_CRUZADOS.motivos.add(chave);
  }

  aplicarFiltros();
}

function limparFiltrosSecundarios(event){
  if(event){
    event.preventDefault();
    event.stopPropagation();
  }

  FILTROS_CRUZADOS.empresas.clear();
  FILTROS_CRUZADOS.status.clear();
  FILTROS_CRUZADOS.vendedores.clear();
  FILTROS_CRUZADOS.motivos.clear();
  FILTROS_CRUZADOS.periodos.clear();

  aplicarFiltros();
  mostrarToast("Seleções dos gráficos e resumos limpas.");
}

function aplicarFiltros(){
  if(!DADOS) return;

  LOJAS_FILTRADAS = calcularLojasFiltradas();

  preencherResumo();
  renderTudo();
}

function renderTudo(){
  renderCardsLojas();
  renderGraficoMovimento();
  renderGraficoLojas();
  renderDonut();
  renderRanking();
  renderMotivosGrafico();
  renderTabela();
}

function renderCardsLojas(){
  const el = document.getElementById("cardsLojas");

  /*
   * Ignora apenas a seleção de empresa nesta área.
   * Assim, depois de selecionar Loja 01, Loja 02 continua visível
   * para poder ser acrescentada à seleção.
   */
  const lista = calcularLojasFiltradas({
    ignorarEmpresas:true
  }).filter(x=>
    x.central_ativa ||
    Number(x.fila || 0) > 0 ||
    Number(x.em_atendimento || 0) > 0 ||
    Number(x.atendimentos || 0) > 0
  );

  el.innerHTML = lista.map(x=>{
    const selecionada =
      FILTROS_CRUZADOS.empresas.has(String(x.empresa));

    return `
      <div
        class="store-card cross-selectable ${selecionada ? "cross-selected" : ""}"
        onclick="alternarEmpresa('${x.empresa}',event)"
        ondblclick="limparFiltrosSecundarios(event)"
        title="Clique para selecionar. Clique novamente para retirar. Duplo clique limpa todas as seleções."
      >

        <div class="store-top">
          <div class="store-id">
            <div class="store-code">${x.empresa}</div>

            <div class="store-name">
              <b>${x.nome || "Loja "+x.empresa}</b>
              <span>
                ${x.central_ativa
                  ? "Operação monitorada"
                  : "Sem Central ativa"}
              </span>
            </div>
          </div>

          <span class="status-badge ${x.central_ativa ? "on" : "off"}">
            ${x.central_ativa ? "Ativa" : "Inativa"}
          </span>
        </div>

        <div class="store-manager">
          ${x.central_ativa
            ? `👤 ${x.gerente_nome || "Responsável não informado"} • desde ${formatarHora(x.central_iniciada_em)}`
            : "Nenhum gerente operando a Central neste momento"}
        </div>

        <div class="store-stats">
          <div class="store-stat">
            <small>Fila</small>
            <b>${Number(x.fila || 0)}</b>
          </div>

          <div class="store-stat">
            <small>Em atend.</small>
            <b>${Number(x.em_atendimento || 0)}</b>
          </div>

          <div class="store-stat">
            <small>Atend.</small>
            <b>${Number(x.atendimentos || 0)}</b>
          </div>

          <div class="store-stat">
            <small>Resultados</small>
            <b>${Number(x.finalizados || 0)}</b>
          </div>
        </div>

      </div>
    `;
  }).join("") || `
    <div class="loading-card">
      Nenhuma loja encontrada para os filtros atuais.
    </div>
  `;
}

function selecionarLoja(empresa){
  alternarEmpresa(empresa);
}

function renderGraficoMovimento(){
  const el = document.getElementById("graficoMovimento");
  if(!el) return;

  const lista = periodosDoMovimento();

  if(!lista.length){
    el.innerHTML = `
      <div class="empty">
        Nenhum atendimento no período selecionado.
      </div>
    `;
    return;
  }

  const max = Math.max(
    1,
    ...lista.map(x=>Number(x.atendimentos || 0))
  );

  const agrupamento =
    DADOS?.periodo?.agrupamento || "dia";

  el.innerHTML = `
    <div class="movement-bars">
      ${lista.map(x=>{
        const selecionado =
          FILTROS_CRUZADOS.periodos.has(
            String(x.periodo)
          );

        const altura =
          Math.max(
            5,
            (Number(x.atendimentos || 0) / max) * 100
          );

        return `
          <div
            class="movement-item cross-selectable ${selecionado ? "cross-selected" : ""}"
            onclick="alternarPeriodo('${x.periodo}',event)"
            ondblclick="limparFiltrosSecundarios(event)"
            title="${formatarDataBR(x.data_inicial)} a ${formatarDataBR(x.data_final)}"
          >
            <div class="movement-value">
              ${Number(x.atendimentos || 0)}
            </div>

            <div class="movement-column">
              <div
                class="movement-fill"
                style="height:${altura}%"
              ></div>
            </div>

            <div class="movement-label">
              ${formatarPeriodoLabel(
                x.periodo,
                agrupamento
              )}
            </div>

            <div class="movement-result">
              ${Number(x.finalizados || 0)} result.
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderGraficoLojas(){
  const el = document.getElementById("graficoLojas");

  // Mantém todas as lojas elegíveis visíveis para multisseleção.
  const lista = calcularLojasFiltradas({
    ignorarEmpresas:true
  })
    .sort(
      (a,b)=>
        Number(b.atendimentos || 0) -
        Number(a.atendimentos || 0)
    )
    .slice(0,30);

  const max = Math.max(
    1,
    ...lista.map(x=>Number(x.atendimentos || 0))
  );

  el.innerHTML = lista.map(x=>{
    const selecionada =
      FILTROS_CRUZADOS.empresas.has(String(x.empresa));

    return `
      <div
        class="bar-row cross-selectable ${selecionada ? "cross-selected" : ""}"
        onclick="alternarEmpresa('${x.empresa}',event)"
        ondblclick="limparFiltrosSecundarios(event)"
      >
        <div class="bar-label">
          Loja ${x.empresa}
        </div>

        <div class="bar-track">
          <div
            class="bar-fill"
            style="width:${Math.max(
              2,
              (Number(x.atendimentos || 0) / max) * 100
            )}%"
          ></div>
        </div>

        <div class="bar-value">
          ${Number(x.atendimentos || 0)}
        </div>
      </div>
    `;
  }).join("") || `
    <div class="empty">
      Sem atendimentos no filtro atual.
    </div>
  `;
}

function renderDonut(){
  /*
   * A pizza recebe TODOS os filtros das demais dimensões.
   * Ignora somente a própria dimensão STATUS para manter todas
   * as fatias visíveis e permitir multisseleção.
   */
  const contexto =
    calcularLojasFiltradas({ignorarStatus:true});

  const disponiveis = contexto.reduce(
    (s,x)=>s + Number(x.disponiveis || 0), 0
  );

  const fila = contexto.reduce(
    (s,x)=>s + Number(x.fila || 0), 0
  );

  const emAtendimento = contexto.reduce(
    (s,x)=>s + Number(x.em_atendimento || 0), 0
  );

  const posAtendimento = contexto.reduce(
    (s,x)=>s + Number(x.finalizados || 0), 0
  );

  const vals = [
    disponiveis,
    fila,
    emAtendimento,
    posAtendimento
  ];

  const soma = vals.reduce((a,b)=>a+b,0);
  const total = Math.max(1,soma);
  const pct = vals.map(v=>v/total*100);

  const p1 = pct[0];
  const p2 = p1 + pct[1];
  const p3 = p2 + pct[2];

  const donut = document.getElementById("donutFluxo");

  if(donut){
    donut.style.background =
      `conic-gradient(
        #22c55e 0 ${p1}%,
        #f59e0b ${p1}% ${p2}%,
        #3b82f6 ${p2}% ${p3}%,
        #a78bfa ${p3}% 100%
      )`;

    donut.dataset.p1 = String(p1);
    donut.dataset.p2 = String(p2);
    donut.dataset.p3 = String(p3);
    donut.dataset.total = String(soma);

    donut.onclick = clicarDonutFluxo;
    donut.ondblclick = limparFiltrosSecundarios;

    donut.classList.toggle(
      "tem-filtro",
      FILTROS_CRUZADOS.status.size > 0
    );

    donut.title =
      "Clique em uma fatia para filtrar todo o painel. " +
      "Clique novamente para retirar. Duplo clique limpa as seleções.";
  }

  document.getElementById("donutCentro").textContent = soma;

  const itens = [
    ["DISP","Disponíveis",disponiveis,"#22c55e"],
    ["FILA","Na fila",fila,"#f59e0b"],
    ["EM","Em atendimento",emAtendimento,"#3b82f6"],
    ["FINAL","Pós-atendimento / resultado",posAtendimento,"#a78bfa"]
  ];

  document.getElementById("legendaFluxo").innerHTML =
    itens.map(i=>{
      const selecionado =
        FILTROS_CRUZADOS.status.has(i[0]);

      return `
        <div
          class="legend-item cross-selectable ${selecionado ? "cross-selected" : ""}"
          style="--dot:${i[3]}"
          onclick="alternarStatus('${i[0]}',event)"
          ondblclick="limparFiltrosSecundarios(event)"
          title="Clique para filtrar todo o painel por ${i[1]}"
        >
          <span>${i[1]}</span>
          <b>${i[2]}</b>
        </div>
      `;
    }).join("");
}

function clicarDonutFluxo(event){
  if(event?.detail > 1) return;

  const donut = event.currentTarget;
  if(!donut) return;

  const total = Number(donut.dataset.total || 0);
  if(total <= 0) return;

  const rect = donut.getBoundingClientRect();

  const x =
    event.clientX - rect.left - rect.width / 2;

  const y =
    event.clientY - rect.top - rect.height / 2;

  /*
   * Se clicar no miolo do donut, não seleciona nenhuma fatia.
   */
  const raio =
    Math.sqrt((x*x) + (y*y));

  const raioExterno =
    Math.min(rect.width,rect.height) / 2;

  const raioInterno =
    raioExterno * 0.60;

  if(raio < raioInterno || raio > raioExterno){
    return;
  }

  /*
   * CSS conic-gradient começa às 12h e cresce no sentido horário.
   * Convertemos o ponto clicado para percentual de 0 a 100.
   */
  let angulo =
    Math.atan2(y,x) * 180 / Math.PI;

  angulo = (angulo + 90 + 360) % 360;

  const percentual =
    angulo / 360 * 100;

  const p1 = Number(donut.dataset.p1 || 0);
  const p2 = Number(donut.dataset.p2 || 0);
  const p3 = Number(donut.dataset.p3 || 0);

  let tipo = "FINAL";

  if(percentual < p1){
    tipo = "DISP";
  }else if(percentual < p2){
    tipo = "FILA";
  }else if(percentual < p3){
    tipo = "EM";
  }

  alternarStatus(tipo,event);
}

function renderRanking(){
  const mapa = new Map();

  // Ignora apenas a própria seleção de vendedor para manter
  // os demais vendedores visíveis e permitir multisseleção.
  for(const item of atendimentosDetalheFiltrados({
    ignorarVendedores:true
  })){
    const chave =
      chaveVendedor(item.empresa,item.vendedor_codigo);

    if(!mapa.has(chave)){
      mapa.set(chave,{
        empresa:String(item.empresa || ""),
        vendedor_codigo:String(item.vendedor_codigo || ""),
        vendedor_nome:String(item.vendedor_nome || ""),
        atendimentos:0,
        finalizados:0,
        duracao_total_seg:0
      });
    }

    const r = mapa.get(chave);
    r.atendimentos += 1;

    if(String(item.status) === "FINALIZADO"){
      r.finalizados += 1;
      r.duracao_total_seg += Number(item.duracao_seg || 0);
    }
  }

  const lista =
    [...mapa.values()]
      .sort(
        (a,b)=>
          b.atendimentos-a.atendimentos ||
          b.finalizados-a.finalizados ||
          a.vendedor_nome.localeCompare(b.vendedor_nome,"pt-BR")
      )
      .slice(0,30);

  document.getElementById("rankingVendedores").innerHTML =
    lista.map((x,i)=>{
      const chave =
        chaveVendedor(x.empresa,x.vendedor_codigo);

      const selecionado =
        FILTROS_CRUZADOS.vendedores.has(chave);

      return `
        <div
          class="rank-row cross-selectable ${selecionado ? "cross-selected" : ""}"
          onclick="alternarVendedor('${x.empresa}','${x.vendedor_codigo}',event)"
          ondblclick="limparFiltrosSecundarios(event)"
          title="Clique para filtrar todo o painel por este vendedor"
        >
          <div class="rank-pos">${i+1}</div>

          <div class="rank-name">
            <b>${x.vendedor_nome}</b>
            <span>
              Loja ${x.empresa} •
              ${x.finalizados} resultados
            </span>
          </div>

          <div class="rank-number">
            ${x.atendimentos}
          </div>
        </div>
      `;
    }).join("") || `
      <div class="empty">
        Sem ranking no filtro atual.
      </div>
    `;
}

function renderMotivosGrafico(){
  const el = document.getElementById("graficoMotivos");

  const acumulado = new Map();

  // Ignora apenas a própria dimensão motivo para manter todos
  // os motivos relacionados ao vendedor/loja/período selecionados.
  for(const item of atendimentosDetalheFiltrados({
    ignorarMotivos:true
  })){
    if(String(item.status) !== "FINALIZADO") continue;

    for(const motivo of motivosDoAtendimento(item)){
      acumulado.set(
        motivo,
        Number(acumulado.get(motivo) || 0) + 1
      );
    }
  }

  const lista =
    [...acumulado.entries()]
      .map(([motivo,qtd])=>({motivo,qtd}))
      .sort((a,b)=>b.qtd-a.qtd)
      .slice(0,30);

  const max = Math.max(
    1,
    ...lista.map(x=>Number(x.qtd || 0))
  );

  el.innerHTML = lista.map(x=>{
    const selecionado =
      FILTROS_CRUZADOS.motivos.has(String(x.motivo));

    const motivoSeguro =
      String(x.motivo)
        .replace(/\\/g,"\\\\")
        .replace(/'/g,"\\'");

    return `
      <div
        class="bar-row cross-selectable ${selecionado ? "cross-selected" : ""}"
        onclick="alternarMotivo('${motivoSeguro}',event)"
        ondblclick="limparFiltrosSecundarios(event)"
        title="Clique para filtrar todo o painel por este resultado"
      >
        <div
          class="bar-label"
          title="${String(x.motivo || "")}"
        >
          ${x.motivo}
        </div>

        <div class="bar-track">
          <div
            class="bar-fill"
            style="width:${Math.max(
              2,
              (Number(x.qtd || 0) / max) * 100
            )}%"
          ></div>
        </div>

        <div class="bar-value">
          ${Number(x.qtd || 0)}
        </div>
      </div>
    `;
  }).join("") || `
    <div class="empty">
      Nenhum motivo registrado no filtro atual.
    </div>
  `;
}

function ordenarTabela(coluna){
  if(ORDENACAO.coluna === coluna){
    ORDENACAO.direcao *= -1;
  }else{
    ORDENACAO = {
      coluna,
      direcao:1
    };
  }

  renderTabela();
}

function renderTabela(){
  const lista =
    [...LOJAS_FILTRADAS].sort((a,b)=>{
      const c = ORDENACAO.coluna;

      let va =
        c === "status"
          ? (a.central_ativa ? 1 : 0)
          : a[c];

      let vb =
        c === "status"
          ? (b.central_ativa ? 1 : 0)
          : b[c];

      if(
        typeof va === "number" ||
        typeof vb === "number"
      ){
        return (
          Number(va || 0) -
          Number(vb || 0)
        ) * ORDENACAO.direcao;
      }

      return String(va || "")
        .localeCompare(
          String(vb || ""),
          "pt-BR"
        ) * ORDENACAO.direcao;
    });

  document.getElementById("tbodyLojas").innerHTML =
    lista.map(x=>`
      <tr
        class="cross-selectable ${FILTROS_CRUZADOS.empresas.has(String(x.empresa)) ? "cross-selected" : ""}"
        onclick="alternarEmpresa('${x.empresa}',event)"
        ondblclick="limparFiltrosSecundarios(event)"
      >
        <td>
          <b>${x.empresa}</b><br>
          <small>${x.nome || ""}</small>
        </td>

        <td>
          <span class="table-status ${x.central_ativa ? "on" : "off"}">
            ${x.central_ativa ? "ATIVA" : "INATIVA"}
          </span>
        </td>

        <td>${x.gerente_nome || "-"}</td>
        <td>${Number(x.fila || 0)}</td>
        <td>${Number(x.em_atendimento || 0)}</td>
        <td>${Number(x.atendimentos || 0)}</td>
        <td>${Number(x.finalizados || 0)}</td>
        <td>${formatarTempo(x.tempo_medio_seg)}</td>
        <td>
          ${x.ultimo_sinal_em
            ? formatarDataHora(x.ultimo_sinal_em)
            : "-"}
        </td>
      </tr>
    `).join("") || `
      <tr>
        <td colspan="9" class="empty">
          Nenhum registro encontrado.
        </td>
      </tr>
    `;

  document.getElementById("totFila").textContent =
    lista.reduce(
      (s,x)=>s+Number(x.fila || 0),
      0
    );

  document.getElementById("totPos").textContent =
    lista.reduce(
      (s,x)=>s+Number(x.em_atendimento || 0),
      0
    );

  document.getElementById("totAtend").textContent =
    lista.reduce(
      (s,x)=>s+Number(x.atendimentos || 0),
      0
    );

  document.getElementById("totFinal").textContent =
    lista.reduce(
      (s,x)=>s+Number(x.finalizados || 0),
      0
    );

  const periodo = DADOS?.periodo || {};

  document.getElementById("tableCaption").textContent =
    `${lista.length} loja(s) exibida(s) • ` +
    `${formatarDataBR(periodo.data_ini)} a ${formatarDataBR(periodo.data_fim)}.`;
}

/* ==========================================================
   MOTIVOS DE INSUCESSO / RESULTADOS
   ========================================================== */

async function carregarPerguntas(){
  try{
    const j = await api("/api/atendimento-gerencial/perguntas");

    ADM_PERGUNTAS = j.perguntas || [];

    renderPerguntas();

    const qtd = document.getElementById("qtdMotivos");
    if(qtd){
      qtd.textContent =
        `${ADM_PERGUNTAS.length} motivo(s) ativo(s)`;
    }

  }catch(e){
    console.error("Erro ao carregar motivos:",e);

    const el = document.getElementById("listaPerguntas");

    if(el){
      el.innerHTML =
        `<div class="loading-card">⚠ ${e.message}</div>`;
    }
  }
}

function ajustarTipoMotivo(){
  const tipo =
    document.getElementById("tipoPergunta").value;

  document
    .getElementById("grupoOpcoesMotivo")
    .classList.toggle(
      "hidden",
      tipo !== "BOTAO_LISTA"
    );

  const ajuda = document.getElementById("ajudaTipoMotivo");
  if(ajuda){
    const textos = {
      BOTAO_UNICO:"Ao clicar, registra diretamente este resultado.",
      BOTAO_LISTA:"Ao clicar, abre as opções cadastradas abaixo.",
      TEXTO_LIVRE:"Ao clicar, abre um campo para digitar uma observação específica."
    };

    ajuda.textContent = textos[tipo] || "";
  }
}

function renderPerguntas(){
  const el = document.getElementById("listaPerguntas");

  if(!el) return;

  el.innerHTML =
    ADM_PERGUNTAS.map((p,i)=>{

      const tipoLista =
        p.tipo_resposta === "BOTAO_LISTA" ||
        p.tipo_resposta === "LISTA";

      const tipoTexto =
        p.tipo_resposta === "TEXTO_LIVRE" ||
        p.tipo_resposta === "SUGESTAO";

      const rotuloTipo = tipoTexto
        ? "Sugestão / texto livre"
        : (tipoLista ? "Com opções" : "Botão único");

      return `
        <article class="motivo-card">

          <div>
            <div class="motivo-card-top">
              <h3>${p.pergunta}</h3>

              <span class="motivo-tipo">
                ${rotuloTipo}
              </span>
            </div>

            <p>
              ${tipoLista && p.opcoes
                ? `Opções: ${p.opcoes}`
                : (tipoTexto
                    ? "Abre um campo para digitação livre ao selecionar."
                    : "Resultado direto, sem subopções.")}
            </p>
          </div>

          <div class="motivo-card-footer">
            <small>Ordem ${p.ordem || i+1}</small>

            <button
              class="btn-danger"
              onclick="excluirPergunta(${p.id},this)"
            >
              Desativar
            </button>
          </div>

        </article>
      `;
    }).join("") || `
      <div class="loading-card">
        Nenhum motivo cadastrado.
      </div>
    `;
}

async function salvarPergunta(btn){
  const pergunta =
    document.getElementById("novaPergunta").value.trim();

  const tipo =
    document.getElementById("tipoPergunta").value;

  let opcoes =
    document.getElementById("opcoesPergunta").value;

  opcoes =
    String(opcoes || "")
      .split(";")
      .map(x=>x.trim())
      .filter(Boolean)
      .slice(0,10)
      .join(";");

  if(!pergunta){
    alert("Informe o nome do motivo.");
    return;
  }

  if(tipo === "BOTAO_LISTA" && !opcoes){
    alert(
      "O motivo com opções precisa ter pelo menos uma opção."
    );
    return;
  }

  try{
    await executarBotao(
      btn,
      "Cadastrando...",
      async()=>{
        await api(
          "/api/atendimento-gerencial/perguntas",
          {
            method:"POST",
            body:JSON.stringify({
              pergunta,
              tipo_resposta:tipo,
              opcoes,
              obrigatoria:true,
              ordem:ADM_PERGUNTAS.length + 1
            })
          }
        );

        document.getElementById("novaPergunta").value = "";
        document.getElementById("opcoesPergunta").value = "";
        document.getElementById("tipoPergunta").value = "BOTAO_UNICO";

        ajustarTipoMotivo();
        await carregarPerguntas();

        mostrarToast("Motivo cadastrado.");
      }
    );
  }catch(e){
    alert("Erro ao cadastrar motivo: " + e.message);
  }
}

async function excluirPergunta(id,btn){
  if(
    !confirm(
      "Desativar este motivo? " +
      "Ele deixará de aparecer na finalização dos atendimentos."
    )
  ){
    return;
  }

  try{
    await executarBotao(
      btn,
      "Desativando...",
      async()=>{
        await api(
          "/api/atendimento-gerencial/perguntas/" + id,
          { method:"DELETE" }
        );

        await carregarPerguntas();
        mostrarToast("Motivo desativado.");
      }
    );
  }catch(e){
    alert("Erro ao desativar motivo: " + e.message);
  }
}

/* ==========================================================
   RELATÓRIOS
   ========================================================== */


function valorOrdenacaoRelatorio(x,coluna){
  if(["atendimentos","finalizados","tempo_medio_seg"].includes(coluna)){
    return Number(x?.[coluna] || 0);
  }
  return String(x?.[coluna] || "").trim().toLocaleUpperCase("pt-BR");
}

function atualizarSetasRelatorio(){
  document.querySelectorAll("#tabelaRelatorioAdmin thead th[data-coluna]").forEach(th=>{
    const coluna = th.dataset.coluna;
    const ativa = RELATORIO_ORDENACAO.coluna === coluna;
    const seta = ativa ? (RELATORIO_ORDENACAO.direcao === 1 ? "↑" : "↓") : "↕";
    const label = th.dataset.label || "";
    th.innerHTML = `${escaparHtml(label)} <span class="sort-indicator">${seta}</span>`;
    th.classList.toggle("sort-active", ativa);
  });
}

function ordenarRelatorioAdmin(coluna){
  if(RELATORIO_ORDENACAO.coluna === coluna){
    RELATORIO_ORDENACAO.direcao *= -1;
  }else{
    RELATORIO_ORDENACAO = { coluna, direcao:1 };
  }
  renderRelatorioAdmin();
}

function renderRelatorioAdmin(){
  const tb = document.getElementById("tbodyRelatorioAdmin");
  if(!tb) return;

  const dados = [...RELATORIO_DADOS];
  const { coluna, direcao } = RELATORIO_ORDENACAO;

  dados.sort((a,b)=>{
    const va = valorOrdenacaoRelatorio(a,coluna);
    const vb = valorOrdenacaoRelatorio(b,coluna);

    if(typeof va === "number" || typeof vb === "number"){
      return (Number(va || 0) - Number(vb || 0)) * direcao;
    }

    return String(va || "").localeCompare(
      String(vb || ""), "pt-BR", { numeric:true, sensitivity:"base" }
    ) * direcao;
  });

  atualizarSetasRelatorio();

  if(!dados.length){
    tb.innerHTML = `<tr><td colspan="7" class="empty">Nenhum atendimento encontrado.</td></tr>`;
    return;
  }

  tb.innerHTML = dados.map(x=>`
    <tr>
      <td>${formatarDataBR(x.data_ref)}</td>
      <td><b>${escaparHtml(x.empresa || "-")}</b></td>
      <td>
        <div class="rel-vendedor">
          <div class="rel-vendedor-foto">
            <span>${escaparHtml(iniciaisVendedor(x.vendedor_nome))}</span>
            ${x.foto_url ? `<img src="${escaparHtml(x.foto_url)}" alt="${escaparHtml(x.vendedor_nome || "Vendedor")}" loading="lazy" onerror="this.style.display='none'">` : ""}
          </div>
          <div class="rel-vendedor-info">
            <b>${escaparHtml(x.vendedor_nome || "-")}</b>
            <small>Cód. ${escaparHtml(x.vendedor_codigo || "-")}</small>
          </div>
        </div>
      </td>
      <td class="num">${Number(x.atendimentos || 0)}</td>
      <td class="num">${Number(x.finalizados || 0)}</td>
      <td class="num">${formatarTempo(x.tempo_medio_seg)}</td>
      <td>${x.motivos ? escaparHtml(x.motivos) : "-"}</td>
    </tr>
  `).join("");
}

async function carregarRelatorioAdmin(btn){
  const tb =
    document.getElementById("tbodyRelatorioAdmin");

  const empresa =
    document.getElementById("relEmpresa").value;

  const dataIni =
    document.getElementById("relDataIni").value;

  const dataFim =
    document.getElementById("relDataFim").value;

  const vendedor =
    document.getElementById("relVendedor").value;

  if(!dataIni || !dataFim){
    alert("Informe o período.");
    return;
  }

  RELATORIO_DADOS = [];
  tb.innerHTML =
    `<tr>
      <td colspan="7" class="empty">
        Carregando relatório...
      </td>
    </tr>`;

  try{
    await executarBotao(
      btn,
      "Buscando...",
      async()=>{

        const qs = new URLSearchParams({
          empresa,
          data_ini:dataIni,
          data_fim:dataFim,
          vendedor
        });

        const j =
          await api(
            "/api/atendimento-gerencial/relatorio?" + qs
          );

        const dados = j.dados || [];
        const resumo = j.resumo || {};

        document
          .getElementById("relTotalAtendimentos")
          .textContent =
            Number(resumo.atendimentos || 0);

        document
          .getElementById("relTotalFinalizados")
          .textContent =
            Number(resumo.finalizados || 0);

        document
          .getElementById("relTempoMedio")
          .textContent =
            formatarTempo(
              resumo.tempo_medio_seg || 0
            );

        document
          .getElementById("relTotalVendedores")
          .textContent =
            Number(resumo.vendedores || 0);

        RELATORIO_DADOS = dados;
        renderRelatorioAdmin();
      }
    );

  }catch(e){
    console.error(e);

    tb.innerHTML =
      `<tr>
        <td colspan="7" class="empty">
          ${e.message}
        </td>
      </tr>`;
  }
}

/* ==========================================================
   MANUTENÇÃO
   ========================================================== */

function renderLojasManutencao(){
  const grid =
    document.getElementById("manutLojasGrid");

  if(!grid || !DADOS) return;

  const marcadas =
    new Set(
      [...grid.querySelectorAll(
        'input[type="checkbox"]:checked'
      )].map(x=>x.value)
    );

  grid.innerHTML =
    (DADOS.lojas || [])
      .map(loja=>{
        const checked =
          marcadas.has(String(loja.empresa));

        return `
          <label class="maintenance-store-option">
            <input
              type="checkbox"
              value="${loja.empresa}"
              ${checked ? "checked" : ""}
              onchange="atualizarQtdLojasManutencao()"
            >

            <span class="maintenance-store-code">
              ${loja.empresa}
            </span>

            <span class="maintenance-store-name">
              ${loja.nome || "Loja "+loja.empresa}
            </span>
          </label>
        `;
      })
      .join("") || `
        <div class="loading-card">
          Nenhuma loja encontrada.
        </div>
      `;

  atualizarQtdLojasManutencao();
}

function alterarEscopoManutencao(){
  const escopo =
    document.querySelector(
      'input[name="manutEscopo"]:checked'
    )?.value || "todas";

  const area =
    document.getElementById("manutLojasArea");

  const todasLabel =
    document.getElementById("scopeTodasLabel");

  const selecionadasLabel =
    document.getElementById("scopeSelecionadasLabel");

  const usandoTodas =
    escopo === "todas";

  area?.classList.toggle(
    "hidden",
    usandoTodas
  );

  todasLabel?.classList.toggle(
    "active",
    usandoTodas
  );

  selecionadasLabel?.classList.toggle(
    "active",
    !usandoTodas
  );

  limparPreviewManutencao();
}

function marcarTodasLojasManutencao(marcar){
  document
    .querySelectorAll(
      '#manutLojasGrid input[type="checkbox"]'
    )
    .forEach(x=>{
      x.checked = Boolean(marcar);
    });

  atualizarQtdLojasManutencao();
  limparPreviewManutencao();
}

function atualizarQtdLojasManutencao(){
  const qtd =
    document.querySelectorAll(
      '#manutLojasGrid input[type="checkbox"]:checked'
    ).length;

  const el =
    document.getElementById(
      "manutQtdSelecionadas"
    );

  if(el){
    el.textContent =
      `${qtd} selecionada(s)`;
  }

  limparPreviewManutencao();
}

function obterPayloadManutencao(){
  const dataIni =
    document.getElementById(
      "manutDataIni"
    )?.value || "";

  const dataFim =
    document.getElementById(
      "manutDataFim"
    )?.value || "";

  const escopo =
    document.querySelector(
      'input[name="manutEscopo"]:checked'
    )?.value || "todas";

  const todas =
    escopo === "todas";

  const empresas =
    todas
      ? []
      : [
          ...document.querySelectorAll(
            '#manutLojasGrid input[type="checkbox"]:checked'
          )
        ].map(x=>x.value);

  if(!dataIni || !dataFim){
    throw new Error(
      "Informe a data inicial e a data final."
    );
  }

  if(dataIni > dataFim){
    throw new Error(
      "A data inicial não pode ser maior que a data final."
    );
  }

  if(!todas && !empresas.length){
    throw new Error(
      "Selecione ao menos uma loja."
    );
  }

  return {
    data_ini:dataIni,
    data_fim:dataFim,
    todas,
    empresas
  };
}

function limparPreviewManutencao(){
  document
    .getElementById("manutPreview")
    ?.classList.add("hidden");

  const input =
    document.getElementById(
      "manutConfirmacao"
    );

  if(input){
    input.value = "";
  }

  validarConfirmacaoManutencao();
}

async function consultarMovimentoExclusao(btn){
  let payload;

  try{
    payload = obterPayloadManutencao();
  }catch(e){
    alert(e.message);
    return;
  }

  try{
    await executarBotao(
      btn,
      "Consultando...",
      async()=>{
        const j = await api(
          "/api/atendimento-gerencial/manutencao/preview-exclusao",
          {
            method:"POST",
            body:JSON.stringify(payload)
          }
        );

        const r = j.resumo || {};

        document
          .getElementById(
            "manutPrevLojas"
          )
          .textContent =
            Number(r.lojas || 0);

        document
          .getElementById(
            "manutPrevAtendimentos"
          )
          .textContent =
            Number(r.atendimentos || 0);

        document
          .getElementById(
            "manutPrevFinalizados"
          )
          .textContent =
            Number(r.finalizados || 0);

        document
          .getElementById(
            "manutPrevRespostas"
          )
          .textContent =
            Number(r.respostas || 0);

        document
          .getElementById(
            "manutPrevFila"
          )
          .textContent =
            Number(r.fila || 0);

        document
          .getElementById(
            "manutPreviewPeriodo"
          )
          .textContent =
            `${formatarDataBR(j.data_ini)} a ${formatarDataBR(j.data_fim)} • ${j.empresas.length} loja(s)`;

        document
          .getElementById(
            "manutPreview"
          )
          ?.classList.remove("hidden");

        const input =
          document.getElementById(
            "manutConfirmacao"
          );

        if(input){
          input.value = "";
          input.focus();
        }

        validarConfirmacaoManutencao();

        mostrarToast(
          "Movimento conferido. Revise os números antes de excluir."
        );
      }
    );

  }catch(e){
    alert(
      "Erro ao consultar movimento: " +
      e.message
    );
  }
}

function validarConfirmacaoManutencao(){
  const valor =
    String(
      document.getElementById(
        "manutConfirmacao"
      )?.value || ""
    )
      .trim()
      .toUpperCase();

  const btn =
    document.getElementById(
      "btnExcluirPeriodo"
    );

  if(btn){
    btn.disabled =
      valor !== "EXCLUIR";
  }
}

async function excluirMovimentoPeriodo(btn){
  let payload;

  try{
    payload = obterPayloadManutencao();
  }catch(e){
    alert(e.message);
    return;
  }

  const confirmacao =
    String(
      document.getElementById(
        "manutConfirmacao"
      )?.value || ""
    )
      .trim()
      .toUpperCase();

  if(confirmacao !== "EXCLUIR"){
    alert(
      'Digite EXCLUIR para confirmar.'
    );
    return;
  }

  const alvo =
    payload.todas
      ? "TODAS AS LOJAS"
      : `${payload.empresas.length} loja(s) selecionada(s)`;

  if(
    !confirm(
      `Excluir definitivamente o movimento de ${formatarDataBR(payload.data_ini)} a ${formatarDataBR(payload.data_fim)} em ${alvo}?`
    )
  ){
    return;
  }

  if(
    !confirm(
      "Última confirmação: esta operação não pode ser desfeita. Deseja continuar?"
    )
  ){
    return;
  }

  try{
    await executarBotao(
      btn,
      "Excluindo...",
      async()=>{
        const j = await api(
          "/api/atendimento-gerencial/manutencao/excluir-periodo",
          {
            method:"DELETE",
            body:JSON.stringify({
              ...payload,
              confirmacao:"EXCLUIR"
            })
          }
        );

        const r =
          j.removidos || {};

        mostrarToast(
          `Exclusão concluída: ${Number(r.atendimentos || 0)} atendimento(s), ${Number(r.respostas || 0)} resposta(s) e ${Number(r.fila || 0)} movimento(s) de fila.`
        );

        limparPreviewManutencao();

        await atualizarDashboard(
          null,
          true
        );
      }
    );

  }catch(e){
    alert(
      "Erro ao excluir movimento: " +
      e.message
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  inicializarAdmin
);

window.addEventListener("pagehide",()=>{
  if(AUTO_REFRESH){
    clearInterval(AUTO_REFRESH);
    AUTO_REFRESH = null;
  }
});
