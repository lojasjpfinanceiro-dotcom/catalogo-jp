"use strict";

const API = "/api/inspecao-estoque";

let BASE = [];
let FILTRADOS = [];
let CHARTS = [];
let SELECIONADOS = new Set(); // linhas da tabela / PDF
let FILTRO_GRAFICO = {};       // campo => Set(valores)
let ORDEM = { campo: "dias_restantes", dir: "asc" };
let CLICK_TIMER = null;
let FILTRO_TIMER = null;
let RENDER_TOKEN = 0;
const LIMITE_TABELA = 300;
let PAGINA_TABELA = 1;

const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[m]));
const num = v => Number(v || 0);
const fmt = v => num(v).toLocaleString("pt-BR",{maximumFractionDigits:2});
const dataBR = v => {
  if(!v) return "-";
  const s = String(v).slice(0,10).split("-");
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : v;
};

function loading(on){ $("#loading")?.classList.toggle("ativo",!!on); }
function chave(o){ return String(o.id || `${o.empresa}|${o.codigo}`); }
function norm(v){ return String(v ?? "").trim(); }
function normLow(v){ return norm(v).toLowerCase(); }

function unicos(campo){
  return [...new Set(BASE.map(x=>norm(x[campo])).filter(Boolean))]
    .sort((a,b)=>a.localeCompare(b,"pt-BR",{numeric:true}));
}

function preencherSelect(id,campo){
  const el=$(id);
  if(!el)return;
  const atual=el.value;
  el.innerHTML='<option value="">Todas</option>'+
    unicos(campo).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("");
  el.value=atual;
}

function preencherDatalistCores(){
  const dl=$("#listaCores");
  if(!dl)return;
  dl.innerHTML=unicos("cor").map(x=>`<option value="${esc(x)}"></option>`).join("");
}

function valorFiltro(id){ return normLow($(id)?.value); }

function filtrosTela(o){
  const f={
    data:valorFiltro("#fData"),
    empresa:valorFiltro("#fEmpresa"),
    codigo:valorFiltro("#fCodigo"),
    produto:valorFiltro("#fProduto"),
    cor:valorFiltro("#fCor"),
    ultima:valorFiltro("#fUltimaCompra"),
    dias:valorFiltro("#fDias"),
    status:valorFiltro("#fStatus"),
    inspecao:valorFiltro("#fInspecao")
  };

  if(f.data && String(o.data_inspecao||"").slice(0,10)!==f.data)return false;
  if(f.empresa && normLow(o.empresa)!==f.empresa)return false;
  if(f.codigo && !normLow(o.codigo).includes(f.codigo))return false;
  if(f.produto && !normLow(o.produto).includes(f.produto))return false;
  if(f.cor && !normLow(o.cor).includes(f.cor))return false;
  if(f.ultima && String(o.ultima_compra||"").slice(0,10)!==f.ultima)return false;

  // "Dias até vencer": mantém a regra atual de trazer até o limite informado.
  if(f.dias){
    if(o.dias_restantes===null || o.dias_restantes===undefined || o.dias_restantes==="")return false;
    if(Number(o.dias_restantes)>Number(f.dias))return false;
  }

  if($("#fOcultarNegativos")?.checked){
    if(o.dias_restantes!==null && o.dias_restantes!==undefined && o.dias_restantes!=="" && Number(o.dias_restantes)<0)return false;
  }

  if(f.status && normLow(o.status_prazo)!==f.status)return false;
  if(f.inspecao==="nao" && (o.de || o.pe))return false;
  if(f.inspecao==="de" && !o.de)return false;
  if(f.inspecao==="pe" && !o.pe)return false;
  return true;
}

function passaSelecoesGraficos(o, ignorarCampo=""){
  for(const [campo,valores] of Object.entries(FILTRO_GRAFICO)){
    if(campo===ignorarCampo) continue;
    if(!(valores instanceof Set) || !valores.size) continue;
    if(!valores.has(norm(o[campo]))) return false;
  }
  return true;
}

// Base cruzada: filtros da tela + seleções dos gráficos.
// Ao desenhar um gráfico, ignoramos apenas a seleção do próprio campo.
// Assim os outros itens daquele gráfico NÃO somem.
function baseCruzada(ignorarCampo=""){
  return BASE.filter(o=>filtrosTela(o) && passaSelecoesGraficos(o,ignorarCampo));
}

function aplicarFiltros(){
  PAGINA_TABELA=1;
  FILTRADOS = baseCruzada("");
  ordenar();
  renderTudo();
}

// Evita reconstruir 7 gráficos + tabela a cada tecla digitada.
function aplicarFiltrosLeve(){
  clearTimeout(FILTRO_TIMER);
  FILTRO_TIMER=setTimeout(()=>aplicarFiltros(),220);
}

// Ordenação não muda os dados dos gráficos/cards; redesenha somente a tabela.
function ordenarSomenteTabela(){
  ordenar();
  renderTabela();
}

function ordenar(){
  const {campo,dir}=ORDEM;
  FILTRADOS.sort((a,b)=>{
    let x=a[campo],y=b[campo];
    if(typeof x==="number" || typeof y==="number" ||
       ["quantidade","prazo_meses","dias_restantes"].includes(campo)){
      x=num(x); y=num(y);
      return dir==="asc"?x-y:y-x;
    }
    const c=String(x??"").localeCompare(String(y??""),"pt-BR",{numeric:true});
    return dir==="asc"?c:-c;
  });
}

function contarDistintos(lista,campo){
  return new Set(lista.map(x=>norm(x[campo])).filter(Boolean)).size;
}

function renderCards(){
  const defs=[
    ["Departamentos","departamento"],
    ["Grupos","grupo"],
    ["Marcas","marca"],
    ["Cores","cor"],
    ["Complementos","complemento"],
    ["Fornecedores","fornecedor"]
  ];

  $("#cards").innerHTML=defs.map(([t,c])=>{
    const qtd=contarDistintos(FILTRADOS,c);
    const ativo=FILTRO_GRAFICO[c]?.size ? "ativo" : "";
    return `<article class="card ${ativo}" data-campo="${c}">
      <span>${t}</span><strong>${fmt(qtd)}</strong>
      ${ativo?`<small>${FILTRO_GRAFICO[c].size} seleção(ões)</small>`:""}
    </article>`;
  }).join("");

  // Card ativo serve para limpar somente as seleções daquele resumo/dimensão.
  document.querySelectorAll(".card").forEach(el=>{
    el.onclick=()=>{
      const c=el.dataset.campo;
      if(FILTRO_GRAFICO[c]?.size){
        delete FILTRO_GRAFICO[c];
        aplicarFiltros();
      }
    };
  });
}

function agrupar(lista,campo){
  const m=new Map();
  for(const o of lista){
    const k=norm(o[campo]) || "SEM INFORMAÇÃO";
    m.set(k,(m.get(k)||0)+num(o.quantidade));
  }
  return [...m].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],"pt-BR",{numeric:true}));
}

function destruirGraficos(){
  CHARTS.forEach(c=>{try{c.destroy()}catch(_){}});
  CHARTS=[];
}

// Rótulo da quantidade em cima de cada coluna, sem biblioteca externa.
const pluginQuantidade = {
  id:"quantidadeSobreColuna",
  afterDatasetsDraw(chart){
    const {ctx}=chart;
    ctx.save();
    ctx.textAlign="center";
    ctx.textBaseline="bottom";
    ctx.font="700 11px Segoe UI, Arial, sans-serif";
    ctx.fillStyle="#f8fbff";

    chart.data.datasets.forEach((dataset,di)=>{
      const meta=chart.getDatasetMeta(di);
      if(meta.hidden)return;
      meta.data.forEach((bar,i)=>{
        const valor=Number(dataset.data[i]||0);
        if(!Number.isFinite(valor))return;
        ctx.fillText(
          valor.toLocaleString("pt-BR",{maximumFractionDigits:0}),
          bar.x,
          Math.max(14,bar.y-5)
        );
      });
    });
    ctx.restore();
  }
};

function limparSelecoesGraficos(){
  FILTRO_GRAFICO={};
  aplicarFiltros();
}

function alternarSelecaoGrafico(campo,valor){
  if(!(FILTRO_GRAFICO[campo] instanceof Set)) FILTRO_GRAFICO[campo]=new Set();
  const set=FILTRO_GRAFICO[campo];
  if(set.has(valor)) set.delete(valor);
  else set.add(valor);
  if(!set.size) delete FILTRO_GRAFICO[campo];
  aplicarFiltros();
}

function rotuloDuasLinhas(texto,maxLinha=17){
  const original=String(texto||"").trim();
  if(!original)return "";

  // Monta exatamente duas linhas. Palavras maiores que o limite também são quebradas.
  const chars=[...original];
  let corte=Math.min(maxLinha,chars.length);
  if(chars.length>maxLinha){
    const trecho=original.slice(0,maxLinha+1);
    const espaco=trecho.lastIndexOf(" ");
    if(espaco>=Math.floor(maxLinha*.55))corte=espaco;
  }
  let l1=original.slice(0,corte).trim();
  let resto=original.slice(corte).trim();

  if(!resto)return l1;

  let l2=resto;
  let truncado=false;
  if(l2.length>maxLinha){
    let c2=maxLinha;
    const trecho2=l2.slice(0,maxLinha+1);
    const espaco2=trecho2.lastIndexOf(" ");
    if(espaco2>=Math.floor(maxLinha*.55))c2=espaco2;
    l2=l2.slice(0,c2).trim();
    truncado=true;
  }
  if(truncado)l2=l2.replace(/[.…]+$/,"")+"…";
  return [l1,l2];
}

function rotuloEstaCortado(texto,maxLinha=17){
  const r=rotuloDuasLinhas(texto,maxLinha);
  return Array.isArray(r) && String(r[1]||"").endsWith("…");
}

function grafico(id,campo){
  const canvas=$(id);
  if(!canvas || !window.Chart)return;

  // Fundamental: o próprio gráfico ignora sua própria seleção.
  // Por isso todos os itens continuam visíveis para seleção múltipla.
  const listaGrafico=baseCruzada(campo);
  const dados=agrupar(listaGrafico,campo);

  const inner=canvas.parentElement;
  /*
   * Evita canvas gigante. O gráfico de Cores pode ter centenas de categorias;
   * canvases muito largos deixam de renderizar em alguns navegadores.
   * Mantemos rolagem horizontal, mas limitamos a largura física do canvas.
   */
  const larguraVisivel = inner.parentElement?.clientWidth || 360;
  // Espaço maior por categoria para os nomes não se sobreporem.
  // Em gráficos gigantes o canvas tem limite físico do navegador; nesse caso
  // preservamos a rolagem e o Chart.js pula somente alguns rótulos do eixo.
  // Cada categoria recebe largura própria porque o gráfico já rola horizontalmente.
  // Cores e textos longos ganham espaço suficiente para duas linhas sem sobreposição.
  const larguraPorItem = campo === "empresa" ? 105 : (campo === "cor" ? 150 : 140);
  const larguraMaxima = 30000;
  const largura=Math.min(
    larguraMaxima,
    Math.max(larguraVisivel, dados.length*larguraPorItem)
  );
  inner.style.width=`${largura}px`;
  inner.style.minWidth=`${largura}px`;

  const selecionados=FILTRO_GRAFICO[campo] || new Set();
  const labels=dados.map(x=>x[0]);
  const valores=dados.map(x=>x[1]);

  const c=new Chart(canvas,{
    type:"bar",
    plugins:[pluginQuantidade],
    data:{
      labels,
      datasets:[{
        label:"Quantidade em estoque",
        data:valores,
        backgroundColor:labels.map(v=>selecionados.has(v)?"rgba(59,130,246,.92)":"rgba(59,130,246,.68)"),
        borderColor:labels.map(v=>selecionados.has(v)?"#facc15":"rgba(125,211,252,.85)"),
        borderWidth:labels.map(v=>selecionados.has(v)?4:1),
        borderRadius:5,
        maxBarThickness:48
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      layout:{padding:{top:22,bottom:8}},
      onClick:(evt,els,chart)=>{
        // Barra OU nome do eixo X. Para o nome, usamos o centro real de cada tick
        // em pixels; isso funciona mesmo com rótulos inclinados.
        let indice=els.length ? els[0].index : -1;
        if(indice<0){
          const x=chart.scales?.x;
          const ne=evt?.native;
          const rect=chart.canvas.getBoundingClientRect();
          const sx=chart.width/Math.max(1,rect.width);
          const sy=chart.height/Math.max(1,rect.height);
          const px=Number.isFinite(ne?.offsetX)?ne.offsetX*sx:evt.x;
          const py=Number.isFinite(ne?.offsetY)?ne.offsetY*sy:evt.y;

          // Toda a faixa abaixo da área de plotagem pertence aos nomes.
          if(x && Number.isFinite(px) && Number.isFinite(py) &&
             py>=chart.chartArea.bottom-3 && py<=chart.height+4){
            let menor=Infinity;
            labels.forEach((_,i)=>{
              const centro=x.getPixelForTick(i);
              const d=Math.abs(px-centro);
              if(d<menor){menor=d;indice=i;}
            });
            const passo=labels.length>1
              ? Math.abs(x.getPixelForTick(1)-x.getPixelForTick(0))
              : Math.max(90,x.width);
            if(menor>passo*.5)indice=-1;
          }
        }
        if(indice<0 || indice>=labels.length)return;
        const valor=labels[indice];
        clearTimeout(CLICK_TIMER);
        CLICK_TIMER=setTimeout(()=>alternarSelecaoGrafico(campo,valor),220);
      },
      plugins:{
        legend:{labels:{color:"#eaf2ff"}},
        tooltip:{
          enabled:ctx=>{
            const i=ctx?.tooltip?.dataPoints?.[0]?.dataIndex;
            return Number.isInteger(i) ? rotuloEstaCortado(labels[i],17) : false;
          },
          callbacks:{
            title:itens=>itens?.length ? String(labels[itens[0].dataIndex]||"") : "",
            label:ctx=>` Quantidade: ${Number(ctx.raw||0).toLocaleString("pt-BR")}`
          }
        }
      },
      scales:{
        x:{
          ticks:{
            color:"#c8d8ea",
            autoSkip:false,
            maxRotation:0,
            minRotation:0,
            padding:8,
            font:{size:10,weight:"700",lineHeight:1.15},
            callback:function(value,index){
              // Horizontal, no máximo duas linhas; terceira linha vira ...
              return rotuloDuasLinhas(this.getLabelForValue(value),17);
            }
          },
          grid:{display:false}
        },
        y:{
          beginAtZero:true,
          grace:"12%",
          ticks:{color:"#c8d8ea"},
          grid:{color:"rgba(150,180,210,.12)"}
        }
      }
    }
  });

  // Duplo clique: limpa TODAS as seleções dos gráficos.
  canvas.ondblclick=e=>{
    e.preventDefault();
    clearTimeout(CLICK_TIMER);
    CLICK_TIMER=null;
    limparSelecoesGraficos();
  };

  CHARTS.push(c);
}

function baseGraficoInspecao(){
  // Mesmos filtros da tela e dos demais gráficos, mas ignora somente o droplist
  // de Inspeção para que Todos/Não inspecionados/DE/PE nunca desapareçam.
  const atual=$("#fInspecao")?.value||"";
  if($("#fInspecao"))$("#fInspecao").value="";
  const lista=BASE.filter(o=>filtrosTela(o) && passaSelecoesGraficos(o,""));
  if($("#fInspecao"))$("#fInspecao").value=atual;
  return lista;
}

function graficoInspecao(){
  const canvas=$("#chartInspecao");
  if(!canvas||!window.Chart)return;

  const lista=baseGraficoInspecao();
  const qtd=o=>lista.filter(o).reduce((s,x)=>s+num(x.quantidade),0);

  const dados=[
    ["Todos",lista.reduce((s,x)=>s+num(x.quantidade),0),""],
    ["Não inspecionados",qtd(x=>!x.de&&!x.pe),"nao"],
    ["DE",qtd(x=>!!x.de),"de"],
    ["PE",qtd(x=>!!x.pe),"pe"]
  ];

  const ativo=valorFiltro("#fInspecao");
  const labels=dados.map(x=>x[0]);
  const valores=dados.map(x=>x[1]);

  const pluginQuantidadeInspecao={
    id:"quantidadeInspecao",
    afterDatasetsDraw(chart){
      const {ctx}=chart;
      ctx.save();
      ctx.fillStyle="#f8fafc";
      ctx.font="700 11px Segoe UI";
      ctx.textAlign="center";
      chart.getDatasetMeta(0).data.forEach((bar,i)=>{
        ctx.fillText(Number(valores[i]||0).toLocaleString("pt-BR"),bar.x,Math.max(12,bar.y-6));
      });
      ctx.restore();
    }
  };

  const c=new Chart(canvas,{
    type:"bar",
    plugins:[pluginQuantidadeInspecao],
    data:{
      labels,
      datasets:[{
        label:"Quantidade em estoque",
        data:valores,
        backgroundColor:dados.map(x=>x[2]===ativo?"rgba(59,130,246,.92)":"rgba(59,130,246,.68)"),
        borderColor:dados.map(x=>x[2]===ativo&&ativo!==""?"#facc15":"rgba(125,211,252,.85)"),
        borderWidth:dados.map(x=>x[2]===ativo&&ativo!==""?4:1),
        borderRadius:5,
        maxBarThickness:58
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      layout:{padding:{top:22,bottom:8}},
      onClick:(evt,els,chart)=>{
        let indice=els.length ? els[0].index : -1;
        if(indice<0){
          const x=chart.scales?.x;
          const ne=evt?.native;
          const rect=chart.canvas.getBoundingClientRect();
          const sx=chart.width/Math.max(1,rect.width);
          const sy=chart.height/Math.max(1,rect.height);
          const px=Number.isFinite(ne?.offsetX)?ne.offsetX*sx:evt.x;
          const py=Number.isFinite(ne?.offsetY)?ne.offsetY*sy:evt.y;
          if(x && Number.isFinite(px) && Number.isFinite(py) &&
             py>=chart.chartArea.bottom-3 && py<=chart.height+4){
            let menor=Infinity;
            dados.forEach((_,i)=>{
              const centro=x.getPixelForTick(i);
              const d=Math.abs(px-centro);
              if(d<menor){menor=d;indice=i;}
            });
            const passo=dados.length>1
              ? Math.abs(x.getPixelForTick(1)-x.getPixelForTick(0))
              : Math.max(90,x.width);
            if(menor>passo*.5)indice=-1;
          }
        }
        if(indice<0 || indice>=dados.length)return;
        const valor=dados[indice][2];
        clearTimeout(CLICK_TIMER);
        CLICK_TIMER=setTimeout(()=>{
          const el=$("#fInspecao");
          if(!el)return;
          el.value=valor==="" ? "" : (el.value===valor ? "" : valor);
          aplicarFiltros();
        },220);
      },
      plugins:{
        legend:{labels:{color:"#eaf2ff"}},
        tooltip:{
          enabled:ctx=>{
            const i=ctx?.tooltip?.dataPoints?.[0]?.dataIndex;
            return Number.isInteger(i) ? rotuloEstaCortado(labels[i],17) : false;
          },
          callbacks:{
            title:itens=>itens?.length ? String(labels[itens[0].dataIndex]||"") : "",
            label:ctx=>` Quantidade: ${Number(ctx.raw||0).toLocaleString("pt-BR")}`
          }
        }
      },
      scales:{
        x:{ticks:{
          color:"#c8d8ea",autoSkip:false,maxRotation:0,minRotation:0,padding:8,
          font:{size:10,weight:"700",lineHeight:1.15},
          callback:function(value){return rotuloDuasLinhas(this.getLabelForValue(value),17);}
        },grid:{display:false}},
        y:{beginAtZero:true,grace:"12%",ticks:{color:"#c8d8ea"},grid:{color:"rgba(150,180,210,.12)"}}
      }
    }
  });

  canvas.ondblclick=e=>{
    e.preventDefault();
    clearTimeout(CLICK_TIMER);
    CLICK_TIMER=null;
    if($("#fInspecao"))$("#fInspecao").value="";
    aplicarFiltros();
  };
  CHARTS.push(c);
}

function renderGraficos(){
  destruirGraficos();
  grafico("#chartEmpresas","empresa");
  grafico("#chartDepartamentos","departamento");
  grafico("#chartGrupos","grupo");
  grafico("#chartMarcas","marca");
  grafico("#chartCores","cor");
  grafico("#chartComplementos","complemento");
  grafico("#chartFornecedores","fornecedor");
  graficoInspecao();
}

function classePrazo(s){
  s=String(s||"");
  if(s==="FORA_PRAZO")return"prazo-fora";
  if(["CRITICO","PROXIMO","ATENCAO"].includes(s))return"prazo-critico";
  if(s==="NO_PRAZO")return"prazo-ok";
  return"";
}

function classeDias(v){
  if(v===null || v===undefined || v==="")return"";
  const d=Number(v);
  if(d<0)return"dias-vencido";
  if(d<=30)return"dias-critico";
  if(d<=90)return"dias-atencao";
  return"dias-ok";
}

// Fallback no navegador: se o backend já trouxer data_limite/dias_restantes,
// ele é respeitado. Caso não traga, calculamos pela última compra + prazo_meses.
function completarPrazo(o){
  if(!o)return o;

  const temDias=o.dias_restantes!==null && o.dias_restantes!==undefined && o.dias_restantes!=="";
  const temLimite=!!o.data_limite;

  if(temDias && temLimite)return o;
  if(!o.ultima_compra || !o.prazo_meses)return o;

  const partes=String(o.ultima_compra).slice(0,10).split("-").map(Number);
  if(partes.length!==3 || partes.some(x=>!Number.isFinite(x)))return o;

  const [ano,mes,dia]=partes;
  const limite=new Date(ano,mes-1,dia,12,0,0);
  limite.setMonth(limite.getMonth()+Number(o.prazo_meses||0));

  const hoje=new Date();
  const hoje0=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate(),12,0,0);
  const lim0=new Date(limite.getFullYear(),limite.getMonth(),limite.getDate(),12,0,0);
  const dias=Math.round((lim0-hoje0)/86400000);

  if(!temLimite)o.data_limite=[
    lim0.getFullYear(),
    String(lim0.getMonth()+1).padStart(2,"0"),
    String(lim0.getDate()).padStart(2,"0")
  ].join("-");

  if(!temDias)o.dias_restantes=dias;

  if(!o.status_prazo || o.status_prazo==="SEM_PRAZO"){
    if(dias<0)o.status_prazo="FORA_PRAZO";
    else if(dias<=30)o.status_prazo="CRITICO";
    else if(dias<=60)o.status_prazo="PROXIMO";
    else if(dias<=90)o.status_prazo="ATENCAO";
    else o.status_prazo="NO_PRAZO";
  }
  return o;
}

function textoDias(o){
  if(o.dias_restantes===null || o.dias_restantes===undefined || o.dias_restantes==="")return"-";
  const d=Number(o.dias_restantes);
  if(d<0)return `${d} (${Math.abs(d)} vencido)`;
  if(d===0)return "0 (vence hoje)";
  return `${d}`;
}


async function salvarStatusInspecao(o,campo,marcado,input){
  const outroCampo=campo==="de"?"pe":"de";
  const linha=input?.closest("tr");
  const outro=linha?.querySelector(`input[data-status="${outroCampo}"]`);

  input?.classList.add("salvando");
  if(marcado && outro){
    outro.checked=false;
    outro.classList.add("salvando");
  }

  try{
    const r=await fetch(`${API}/status`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"same-origin",
      body:JSON.stringify({
        empresa:o.empresa,
        produto:o.codigo,
        campo,
        marcado
      })
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok || j.ok===false) throw new Error(j.erro||"Falha ao gravar inspeção.");

    o[campo]=marcado;
    if(marcado)o[outroCampo]=false;

    const reg=j.registro||{};
    if(reg.data_inspecao)o.data_inspecao=reg.data_inspecao;
    if(reg.inspecionado_em)o.inspecionado_em=reg.inspecionado_em;
    if(reg.usuario_codigo!==undefined)o.usuario_codigo=reg.usuario_codigo||"";
    if(reg.usuario_nome!==undefined)o.usuario_nome=reg.usuario_nome||"";

    // Atualiza imediatamente Usuário/Data/DE/PE sem nova consulta ao banco.
    renderTabela();
  }catch(e){
    input.checked=!marcado;
    if(marcado && outro)outro.checked=Boolean(o[outroCampo]);
    alert(e.message);
  }finally{
    input?.classList.remove("salvando");
    outro?.classList.remove("salvando");
  }
}

function renderTabela(){
  const limite=LIMITE_TABELA;
  const totalLinhas=FILTRADOS.length;
  const totalPaginas=Math.max(1,Math.ceil(totalLinhas/limite));

  if(PAGINA_TABELA>totalPaginas)PAGINA_TABELA=totalPaginas;
  if(PAGINA_TABELA<1)PAGINA_TABELA=1;

  const inicio=(PAGINA_TABELA-1)*limite;
  const fim=Math.min(inicio+limite,totalLinhas);
  const lista=FILTRADOS.slice(inicio,fim);

  $("#statusTabela").textContent=
    `${totalLinhas.toLocaleString("pt-BR")} linha(s) analisadas • `+
    `${fmt(FILTRADOS.reduce((s,x)=>s+num(x.quantidade),0))} unidade(s) em estoque`+
    (totalLinhas>limite
      ? ` • mostrando ${inicio+1}-${fim} • página ${PAGINA_TABELA}/${totalPaginas}`
      : "");

  let nav=$("#paginacaoTabela");
  if(!nav){
    nav=document.createElement("div");
    nav.id="paginacaoTabela";
    nav.style.cssText="display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0 2px;flex-wrap:wrap";
    $("#tableScroll")?.insertAdjacentElement("afterend",nav);
  }

  if(totalLinhas>limite){
    nav.innerHTML=`
      <button class="btn small" id="pgPrimeira" ${PAGINA_TABELA<=1?"disabled":""}>« Primeira</button>
      <button class="btn small" id="pgAnterior" ${PAGINA_TABELA<=1?"disabled":""}>‹ Anterior</button>
      <strong style="color:#edf5ff">Página ${PAGINA_TABELA} de ${totalPaginas}</strong>
      <button class="btn small" id="pgProxima" ${PAGINA_TABELA>=totalPaginas?"disabled":""}>Próxima ›</button>
      <button class="btn small" id="pgUltima" ${PAGINA_TABELA>=totalPaginas?"disabled":""}>Última »</button>
    `;
    $("#pgPrimeira")?.addEventListener("click",()=>{PAGINA_TABELA=1;renderTabela();$("#tableScroll")?.scrollTo({top:0});});
    $("#pgAnterior")?.addEventListener("click",()=>{PAGINA_TABELA--;renderTabela();$("#tableScroll")?.scrollTo({top:0});});
    $("#pgProxima")?.addEventListener("click",()=>{PAGINA_TABELA++;renderTabela();$("#tableScroll")?.scrollTo({top:0});});
    $("#pgUltima")?.addEventListener("click",()=>{PAGINA_TABELA=totalPaginas;renderTabela();$("#tableScroll")?.scrollTo({top:0});});
  }else{
    nav.innerHTML="";
  }

  $("#tbody").innerHTML=lista.map(o=>`
    <tr data-id="${esc(chave(o))}" class="${SELECIONADOS.has(chave(o))?"selecionada":""}">
      <td class="td-foto"><img class="foto-produto" loading="lazy" src="${API}/foto/${encodeURIComponent(o.codigo||"")}" alt="" onerror="this.classList.add('sem-foto');this.removeAttribute('src')"></td>
      <td>${dataBR(o.data_inspecao)}</td>
      <td class="td-status-inspecao"><input class="chk-inspecao" type="checkbox" data-status="de" ${o.de?"checked":""} aria-label="DE — Defeito Encontrado" title="DE — Defeito Encontrado"></td>
      <td class="td-status-inspecao"><input class="chk-inspecao" type="checkbox" data-status="pe" ${o.pe?"checked":""} aria-label="PE — Perfeito Estado" title="PE — Perfeito Estado"></td>
      <td class="td-usuario" title="${esc(o.usuario_nome||"")}">${esc((o.de||o.pe)?(o.usuario_nome||o.usuario_codigo||"-"):"-")}</td>
      <td>${esc(o.empresa)}</td>
      <td>${esc(o.codigo)}</td>
      <td>${esc(o.produto)}</td>
      <td>${fmt(o.quantidade)}</td>
      <td>${dataBR(o.data_limite)}</td>
      <td class="${classeDias(o.dias_restantes)}">${esc(textoDias(o))}</td>
      <td class="${classePrazo(o.status_prazo)}">${esc(o.status_prazo)}</td>
      <td>${esc(o.departamento)}</td>
      <td>${esc(o.grupo)}</td>
      <td>${esc(o.marca)}</td>
      <td>${esc(o.cor)}</td>
      <td>${esc(o.complemento)}</td>
      <td>${esc(o.fornecedor)}</td>
      <td>${dataBR(o.ultima_compra)}</td>
      <td>${o.prazo_meses?esc(o.prazo_meses)+" meses":"-"}</td>
    </tr>`).join("") || '<tr><td colspan="20">Nenhum produto encontrado.</td></tr>';

  document.querySelectorAll("#tbody tr[data-id]").forEach(tr=>{
    tr.onclick=e=>{
      if(e.target.closest(".chk-inspecao"))return;
      const id=tr.dataset.id;
      if(SELECIONADOS.has(id))SELECIONADOS.delete(id);
      else SELECIONADOS.add(id);
      tr.classList.toggle("selecionada",SELECIONADOS.has(id));
    };
  });

  document.querySelectorAll("#tbody .chk-inspecao").forEach(input=>{
    input.onclick=e=>e.stopPropagation();
    input.onchange=async e=>{
      e.stopPropagation();
      const tr=input.closest("tr");
      const o=lista.find(x=>chave(x)===tr?.dataset.id);
      if(!o)return;
      await salvarStatusInspecao(o,input.dataset.status,input.checked,input);
    };
  });
}

function renderTudo(){
  renderGraficos();
  renderTabela();
}

async function carregar(){
  loading(true);
  try{
    const r=await fetch(`${API}/dados`,{credentials:"same-origin"});
    const j=await r.json();
    if(!r.ok || j.ok===false)throw new Error(j.erro||"Falha ao carregar");

    BASE=(Array.isArray(j.dados)?j.dados:[]).map(completarPrazo);

    preencherSelect("#fEmpresa","empresa");
    preencherDatalistCores();

    // Não força a data corrente nem a primeira data encontrada.
    // A coluna "Data inspeção" usa exclusivamente o.data_inspecao,
    // que é a data histórica gravada quando o usuário marcou DE/PE.
    // O filtro de data começa vazio para mostrar todas as inspeções históricas.
    if($("#fData")) $("#fData").value="";

    aplicarFiltros();
  }catch(e){
    alert(e.message);
  }finally{
    loading(false);
  }
}

async function pdf(){
  const itens=FILTRADOS;
  if(!itens.length)return alert("Não há itens filtrados para exportar.");

  const filtros={
    data_inspecao:$("#fData")?.value||"",
    empresa:$("#fEmpresa")?.value||"",
    codigo:$("#fCodigo")?.value||"",
    produto:$("#fProduto")?.value||"",
    cor:$("#fCor")?.value||"",
    ultima_compra:$("#fUltimaCompra")?.value||"",
    dias:$("#fDias")?.value||"",
    situacao:$("#fStatus")?.value||"",
    inspecao:$("#fInspecao")?.value||"",
    ocultar_negativos:Boolean($("#fOcultarNegativos")?.checked),
    selecoes_graficos:Object.fromEntries(
      Object.entries(FILTRO_GRAFICO).map(([campo,valores])=>[
        campo,
        [...(valores instanceof Set?valores:new Set([valores]))].filter(Boolean)
      ])
    )
  };

  const defs=[
    ["Empresas","#chartEmpresas"],["Departamentos","#chartDepartamentos"],
    ["Grupos","#chartGrupos"],["Marcas","#chartMarcas"],["Cores","#chartCores"],
    ["Complementos","#chartComplementos"],["Fornecedores","#chartFornecedores"],["Inspeção","#chartInspecao"]
  ];
  const graficos=defs.map(([titulo,seletor])=>{
    const canvas=$(seletor);
    let imagem="";
    try{imagem=canvas?.toDataURL("image/png",0.92)||"";}catch(_){}
    return {titulo,imagem};
  }).filter(x=>x.imagem);

  loading(true);
  try{
    const r=await fetch(`${API}/relatorio.pdf`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({itens,filtros,graficos}),
      credentials:"same-origin"
    });
    if(!r.ok){
      const j=await r.json().catch(()=>({}));
      throw new Error(j.erro||"Falha no PDF");
    }
    const b=await r.blob(),u=URL.createObjectURL(b);
    window.open(u,"_blank");
    setTimeout(()=>URL.revokeObjectURL(u),60000);
  }catch(e){
    alert(e.message);
  }finally{
    loading(false);
  }
}

function limpar(){
  document.querySelectorAll(".filters input,.filters select").forEach(el=>{
    if(el.type==="checkbox")el.checked=false;
    else el.value="";
  });
  if($("#fDias"))$("#fDias").value="30";
  FILTRO_GRAFICO={};
  SELECIONADOS.clear();
  aplicarFiltros();
}

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".filters input,.filters select").forEach(el=>{
    if(el.tagName==="INPUT" && !["date","number"].includes(el.type)){
      el.addEventListener("input",aplicarFiltrosLeve);
    }else{
      el.addEventListener("change",aplicarFiltros);
    }
  });

  document.querySelectorAll("thead th[data-k]").forEach(th=>th.onclick=()=>{
    const c=th.dataset.k;
    ORDEM=ORDEM.campo===c
      ? {campo:c,dir:ORDEM.dir==="asc"?"desc":"asc"}
      : {campo:c,dir:"asc"};
    ordenarSomenteTabela();
  });

  $("#fOcultarNegativos")?.addEventListener("change",aplicarFiltros);
  $("#btnAtualizar").onclick=carregar;
  $("#btnPdf").onclick=pdf;
  $("#btnLimpar").onclick=limpar;

  carregar();
});
