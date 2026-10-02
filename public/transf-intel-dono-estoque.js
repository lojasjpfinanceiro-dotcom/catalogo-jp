

let EMPRESAS_TRANSFERENCIA = [];
let GRUPOS_TRANSFERENCIA = [];
let GRUPO_ANALISE_ID = null;
let GRUPO_ANALISE_ATUAL = null;
let OCULTAR_ZEROS_DETALHE = true;
let ULTIMO_DETALHE_TRANSFERENCIA = null;
let MODO_TRANSFERENCIA = "GERAL";
let ITENS_DIRECIONADOS = [];
let ULTIMAS_SUGESTOES_AGRUPADAS = [];

async function apiTransferencia(url, opcoes = {}){
  const resposta = await fetch(url, opcoes);
  const texto = await resposta.text();

  let dados;

  try{
    dados = JSON.parse(texto);
  }catch(e){
    throw new Error(
      "O servidor retornou uma resposta inválida. Verifique se o Node está rodando."
    );
  }

  if(!resposta.ok || dados.ok === false){
    throw new Error(
      dados.erro || "Não foi possível concluir a operação."
    );
  }

  return dados;
}

async function iniciarTransferencia(){
  definirDatasPadrao();

  try{
    await Promise.all([
      carregarEmpresas(),
      carregarGrupos()
    ]);

    configurarFiltrosInteligentes();
  }catch(e){
    console.error(e);
    alert(e.message);
  }
}


const CONFIG_FILTROS_TRANSFERENCIA = [
  {
    campo:"departamento",
    lista:"listaFiltroDepartamento",
    inputs:["filtroDepartamento","direcionadaDepartamento"]
  },
  {
    campo:"grupo",
    lista:"listaFiltroGrupo",
    inputs:["filtroGrupo","direcionadaGrupo"]
  },
  {
    campo:"complemento",
    lista:"listaFiltroComplemento",
    inputs:["filtroComplemento","direcionadaComplemento"]
  },
  {
    campo:"produto",
    lista:"listaFiltroProduto",
    inputs:["filtroProduto","direcionadaProduto"]
  }
];

const TIMERS_FILTROS_TRANSFERENCIA = new Map();

function configurarFiltrosInteligentes(){
  for(const config of CONFIG_FILTROS_TRANSFERENCIA){
    for(const inputId of config.inputs){
      const input = document.getElementById(inputId);
      if(!input || input.dataset.filtroInteligente === "1") continue;

      input.dataset.filtroInteligente = "1";

      input.addEventListener("input", () => {
        const chave = `${config.campo}|${inputId}`;
        clearTimeout(TIMERS_FILTROS_TRANSFERENCIA.get(chave));

        const timer = setTimeout(() => {
          carregarOpcoesFiltroTransferencia(
            config.campo,
            input.value,
            config.lista
          );
        }, 220);

        TIMERS_FILTROS_TRANSFERENCIA.set(chave, timer);
      });

      input.addEventListener("focus", () => {
        carregarOpcoesFiltroTransferencia(
          config.campo,
          input.value,
          config.lista
        );
      });
    }
  }
}

async function carregarOpcoesFiltroTransferencia(campo, termo, listaId){
  const lista = document.getElementById(listaId);
  if(!lista) return;

  try{
    const params = new URLSearchParams({
      campo,
      q:String(termo || "").trim()
    });

    const dados = await apiTransferencia(
      `/api/transferencia-inteligente/opcoes?${params.toString()}`
    );

    lista.innerHTML = (dados.opcoes || [])
      .map(valor => `<option value="${escaparHTML(valor)}"></option>`)
      .join("");
  }catch(e){
    console.error("Erro ao carregar opções do filtro:", e);
  }
}

function definirDatasPadrao(){
  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 59);

  document.getElementById("dataInicio").value =
    inicio.toISOString().slice(0,10);

  document.getElementById("dataFim").value =
    hoje.toISOString().slice(0,10);
}

async function carregarEmpresas(){
  const dados = await apiTransferencia(
    "/api/transferencia-inteligente/empresas"
  );

  EMPRESAS_TRANSFERENCIA = dados.empresas || [];
  renderEmpresas();
}

async function carregarGrupos(){
  const dados = await apiTransferencia(
    "/api/transferencia-inteligente/grupos"
  );

  GRUPOS_TRANSFERENCIA = dados.grupos || [];
  renderGrupos();
  atualizarResumo();
}

function renderEmpresas(){
  const box = document.getElementById("listaEmpresas");

  if(!EMPRESAS_TRANSFERENCIA.length){
    box.innerHTML =
      `<div class="vazio">Nenhuma empresa ativa encontrada.</div>`;
    return;
  }

  box.innerHTML = EMPRESAS_TRANSFERENCIA.map(empresa => `
    <label class="loja-opcao">
      <input
        type="checkbox"
        class="empresa-transferencia"
        value="${escaparHTML(empresa.empresa)}"
      >

      <span>
        <strong>Loja ${escaparHTML(empresa.empresa)}</strong>
        <small>${escaparHTML(empresa.nome || "")}</small>
      </span>
    </label>
  `).join("");
}

function normalizarEmpresasGrupo(grupo){
  return (grupo.empresas || []).map(item =>
    String(item?.empresa ?? item ?? "").padStart(2, "0")
  );
}

function renderGrupos(){
  const box = document.getElementById("listaGrupos");

  if(!GRUPOS_TRANSFERENCIA.length){
    box.innerHTML = `
      <div class="vazio">
        Nenhum grupo cadastrado. Clique em “Novo grupo”.
      </div>
    `;
    return;
  }

  box.innerHTML = GRUPOS_TRANSFERENCIA.map(grupo => {
    const empresas = normalizarEmpresasGrupo(grupo);

    return `
      <article class="grupo-card">
        <div class="grupo-topo">
          <div>
            <h3>${escaparHTML(grupo.nome)}</h3>
            <small>${empresas.length} loja(s) participante(s)</small>
          </div>

          <span class="status ${grupo.ativo ? "ativo" : "inativo"}">
            ${grupo.ativo ? "ATIVO" : "INATIVO"}
          </span>
        </div>

        <div class="chips">
          ${empresas.map(empresa => `
            <span class="chip">Loja ${escaparHTML(empresa)}</span>
          `).join("")}
        </div>

        <div class="regra-grupo">
          Percentuais calculados automaticamente pelas vendas de cada
          produto e numeração no período informado.
        </div>

        <div class="acoes-card">
          <button
            class="primario"
            onclick="abrirAnalise(${Number(grupo.id)})"
          >
            Executar análise
          </button>

          <button onclick="editarGrupo(${Number(grupo.id)})">
            Editar
          </button>

          <button onclick="excluirGrupo(${Number(grupo.id)})">
            Excluir
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function atualizarResumo(){
  const lojas = new Set();

  GRUPOS_TRANSFERENCIA.forEach(grupo => {
    normalizarEmpresasGrupo(grupo)
      .forEach(empresa => lojas.add(empresa));
  });

  document.getElementById("resumoGrupos").textContent =
    GRUPOS_TRANSFERENCIA.length.toLocaleString("pt-BR");

  document.getElementById("resumoLojas").textContent =
    lojas.size.toLocaleString("pt-BR");
}

function abrirNovoGrupo(){
  limparFormulario();

  document.getElementById("tituloModal").textContent =
    "Novo grupo";

  document.getElementById("modalGrupo")
    .classList.remove("oculto");
}

function fecharModal(){
  document.getElementById("modalGrupo")
    .classList.add("oculto");
}

function limparFormulario(){
  document.getElementById("formGrupo").reset();
  document.getElementById("grupoId").value = "";
  document.getElementById("gerarReposicao").checked = true;
  document.getElementById("ativo").checked = true;

  document.querySelectorAll(".empresa-transferencia")
    .forEach(input => input.checked = false);
}

function editarGrupo(id){
  const grupo = GRUPOS_TRANSFERENCIA.find(
    item => Number(item.id) === Number(id)
  );

  if(!grupo) return;

  limparFormulario();

  document.getElementById("tituloModal").textContent =
    "Editar grupo";

  document.getElementById("grupoId").value = grupo.id;
  document.getElementById("grupoNome").value = grupo.nome || "";

  document.getElementById("gerarReposicao").checked =
    Boolean(grupo.gerar_reposicao);

  document.getElementById("ativo").checked =
    Boolean(grupo.ativo);

  const selecionadas = new Set(
    normalizarEmpresasGrupo(grupo)
  );

  document.querySelectorAll(".empresa-transferencia")
    .forEach(input => {
      input.checked = selecionadas.has(input.value);
    });

  document.getElementById("modalGrupo")
    .classList.remove("oculto");
}

function selecionarTodas(){
  const inputs = [
    ...document.querySelectorAll(".empresa-transferencia")
  ];

  const marcar = inputs.some(input => !input.checked);
  inputs.forEach(input => input.checked = marcar);
}

async function salvarGrupo(evento){
  evento.preventDefault();

  const empresas = [
    ...document.querySelectorAll(
      ".empresa-transferencia:checked"
    )
  ].map(input => input.value);

  if(empresas.length < 2){
    alert("Selecione pelo menos duas lojas.");
    return;
  }

  const payload = {
    id:
      Number(document.getElementById("grupoId").value || 0)
      || null,

    nome:
      document.getElementById("grupoNome").value.trim(),

    empresas,

    gerar_reposicao:
      document.getElementById("gerarReposicao").checked,

    ativo:
      document.getElementById("ativo").checked
  };

  try{
    await apiTransferencia(
      "/api/transferencia-inteligente/grupos",
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      }
    );

    fecharModal();
    await carregarGrupos();

  }catch(e){
    console.error(e);
    alert(e.message);
  }
}

async function excluirGrupo(id){
  if(!confirm("Deseja excluir este grupo?")) return;

  try{
    await apiTransferencia(
      `/api/transferencia-inteligente/grupos/${id}`,
      { method:"DELETE" }
    );

    await carregarGrupos();

  }catch(e){
    console.error(e);
    alert(e.message);
  }
}

function abrirAnalise(id){
  const grupo = GRUPOS_TRANSFERENCIA.find(
    item => Number(item.id) === Number(id)
  );

  if(!grupo) return;

  GRUPO_ANALISE_ID = Number(id);
  GRUPO_ANALISE_ATUAL = grupo;

  document.getElementById("tituloAnalise").textContent =
    `Executar análise — ${grupo.nome}`;

  document.getElementById("painelAnalise")
    .classList.remove("oculto");

  document.getElementById("resultadoAnalise")
    .classList.add("oculto");

  document.getElementById("statusAnalise")
    .classList.remove("oculto");

  document.getElementById("statusAnalise").textContent =
    "Informe as datas e clique em calcular.";

  preencherLojasDirecionadas();
  selecionarModoTransferencia(MODO_TRANSFERENCIA);

  document.getElementById("painelAnalise")
    .scrollIntoView({behavior:"smooth"});
}

function fecharAnalise(){
  GRUPO_ANALISE_ID = null;
  GRUPO_ANALISE_ATUAL = null;

  document.getElementById("painelAnalise")
    .classList.add("oculto");
}

async function atualizarDonosEstoque(botao){
  const original = botao?.textContent || "Atualizar donos";
  try{
    if(botao){
      botao.disabled = true;
      botao.textContent = "Atualizando...";
    }
    const dados = await apiTransferencia(
      "/api/transferencia-inteligente/donos/atualizar",
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:"{}"
      }
    );
    alert(`Donos atualizados. Relações gravadas: ${Number(dados.relacoes || 0).toLocaleString("pt-BR")}`);
  }catch(e){
    console.error(e);
    alert(e.message);
  }finally{
    if(botao){
      botao.disabled = false;
      botao.textContent = original;
    }
  }
}

async function executarAnalise(){
  if(!GRUPO_ANALISE_ID){
    alert("Selecione um grupo.");
    return;
  }

  const dataInicio =
    document.getElementById("dataInicio").value;

  const dataFim =
    document.getElementById("dataFim").value;

  if(!dataInicio || !dataFim){
    alert("Informe a data inicial e a data final.");
    return;
  }

  if(dataInicio > dataFim){
    alert("A data inicial não pode ser maior que a data final.");
    return;
  }

  const status = document.getElementById("statusAnalise");

  status.classList.remove("oculto");
  status.textContent =
    "Calculando vendas, percentuais, estoque e rupturas...";

  document.getElementById("resultadoAnalise")
    .classList.add("oculto");

  try{
    const params = new URLSearchParams({
      grupo_id:String(GRUPO_ANALISE_ID),
      data_inicio:dataInicio,
      data_fim:dataFim,
      modo:MODO_TRANSFERENCIA,
      departamento:document.getElementById("filtroDepartamento")?.value.trim() || "",
      grupo:document.getElementById("filtroGrupo")?.value.trim() || "",
      complemento:document.getElementById("filtroComplemento")?.value.trim() || "",
      produto:document.getElementById("filtroProduto")?.value.trim() || "",
      politica_estoque:document.getElementById("politicaEstoque")?.value || "LIVRE"
    });

    const url = `/api/transferencia-inteligente/analisar?${params.toString()}`;

    const dados = await apiTransferencia(url);

    renderResultadoAnalise(dados);

  }catch(e){
    console.error(e);
    status.textContent = e.message;
  }
}


function agruparSugestoesTransferencia(sugestoes){
  const mapa = new Map();

  for(const item of sugestoes || []){
    const produto = String(item.produto || "")
      .replace(/\D/g, "")
      .padStart(6, "0")
      .slice(0, 6);

    const origem = String(item.origem || "").padStart(2, "0");
    const destino = String(item.destino || "").padStart(2, "0");
    const chave = `${produto}|${origem}|${destino}`;

    if(!mapa.has(chave)){
      mapa.set(chave, {
        produto,
        descricao:item.descricao || "",
        origem,
        destino,
        tamanhos:new Map(),
        quantidade_total:0,
        motivos:new Set(),
        ranking:item.ranking || [],
        percentual_origem:Number(item.percentual_origem || 0),
        percentual_destino:Number(item.percentual_destino || 0),
        vendido_origem:Number(item.vendido_origem || 0),
        vendido_destino:Number(item.vendido_destino || 0)
      });
    }

    const grupo = mapa.get(chave);
    const tamanho = String(item.tamanho || "")
      .replace(/^0+(?=\d)/, "");

    const quantidade = Number(item.quantidade || 0);

    grupo.tamanhos.set(
      tamanho,
      Number(grupo.tamanhos.get(tamanho) || 0) + quantidade
    );

    grupo.quantidade_total += quantidade;

    if(item.motivo){
      grupo.motivos.add(String(item.motivo));
    }
  }

  return [...mapa.values()]
    .map(item => ({
      ...item,
      tamanhos:[...item.tamanhos.entries()]
        .sort((a,b) => String(a[0]).localeCompare(
          String(b[0]),
          "pt-BR",
          {numeric:true}
        ))
        .map(([tamanho, quantidade]) => ({
          tamanho,
          quantidade
        })),
      motivos:[...item.motivos]
    }))
    .sort((a,b) =>
      a.produto.localeCompare(b.produto, "pt-BR", {numeric:true}) ||
      a.origem.localeCompare(b.origem, "pt-BR", {numeric:true}) ||
      a.destino.localeCompare(b.destino, "pt-BR", {numeric:true})
    );
}

function montarTamanhosQuantidades(tamanhos){
  return (tamanhos || [])
    .map(item => `
      <span class="chip-tamanho-qtd">
        <strong>${escaparHTML(item.tamanho)}</strong>
        <span>${Number(item.quantidade || 0)}</span>
      </span>
    `)
    .join("");
}

function tratarErroFotoTransferencia(imagem){
  imagem.classList.add("foto-com-erro");
  imagem.removeAttribute("src");
  imagem.alt = "Sem foto";
}

function textoSeguroRelatorio(valor){
  return String(valor ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function gerarPdfTransferencias(){
  if(!ULTIMAS_SUGESTOES_AGRUPADAS.length){
    alert("Não existem transferências para gerar o relatório.");
    return;
  }

  const grupo = GRUPO_ANALISE_ATUAL ||
    GRUPOS_TRANSFERENCIA.find(
      item => Number(item.id) === Number(GRUPO_ANALISE_ID)
    );

  const dataInicio =
    document.getElementById("dataInicio")?.value || "";

  const dataFim =
    document.getElementById("dataFim")?.value || "";

  const totalPares = ULTIMAS_SUGESTOES_AGRUPADAS.reduce(
    (soma,item) => soma + Number(item.quantidade_total || 0),
    0
  );

  const linhas = ULTIMAS_SUGESTOES_AGRUPADAS.map(item => {
    const grade = item.tamanhos
      .map(t => `${textoSeguroRelatorio(t.tamanho)}-${Number(t.quantidade || 0)}`)
      .join(" | ");

    return `
      <tr>
        <td class="foto">
          <img
            src="${location.origin}/foto?codigo=${encodeURIComponent(item.produto)}"
            alt="Foto do produto ${textoSeguroRelatorio(item.produto)}"
          >
        </td>
        <td class="produto">
          <strong>${textoSeguroRelatorio(item.produto)}</strong>
          <div>${textoSeguroRelatorio(item.descricao || "")}</div>
        </td>
        <td>Loja ${textoSeguroRelatorio(item.origem)}</td>
        <td>Loja ${textoSeguroRelatorio(item.destino)}</td>
        <td class="grade">${grade}</td>
        <td class="total">${Number(item.quantidade_total || 0)}</td>
      </tr>
    `;
  }).join("");

  const janela = window.open("", "_blank");

  if(!janela){
    alert("O navegador bloqueou o relatório. Permita pop-ups para este endereço.");
    return;
  }

  janela.document.open();
  janela.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Transferências</title>
      <style>
        @page{
          size:A4 landscape;
          margin:10mm;
        }

        *{box-sizing:border-box}

        body{
          margin:0;
          color:#111827;
          font-family:Arial,Helvetica,sans-serif;
          font-size:10px;
        }

        .topo-relatorio{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:20px;
          margin-bottom:12px;
          padding-bottom:9px;
          border-bottom:2px solid #1f2937;
        }

        h1{
          margin:0 0 5px;
          font-size:20px;
        }

        .subtitulo{
          color:#4b5563;
          line-height:1.5;
        }

        .resumo-relatorio{
          text-align:right;
          line-height:1.6;
        }

        table{
          width:100%;
          border-collapse:collapse;
          table-layout:fixed;
        }

        thead{
          display:table-header-group;
        }

        tr{
          page-break-inside:avoid;
        }

        th,td{
          padding:6px;
          border:1px solid #9ca3af;
          vertical-align:middle;
        }

        th{
          background:#e5e7eb;
          text-align:left;
          font-size:9px;
          text-transform:uppercase;
        }

        .foto{
          width:58px;
          text-align:center;
        }

        .foto img{
          width:48px;
          height:48px;
          object-fit:contain;
        }

        .produto{
          width:210px;
        }

        .produto strong{
          display:block;
          margin-bottom:3px;
          font-size:11px;
        }

        .produto div{
          color:#374151;
          white-space:normal;
        }

        .grade{
          font-weight:bold;
          line-height:1.6;
          white-space:normal;
        }

        .total{
          width:55px;
          text-align:center;
          font-size:12px;
          font-weight:bold;
        }

        .rodape{
          margin-top:10px;
          color:#4b5563;
          text-align:right;
        }
      </style>
    </head>
    <body>
      <header class="topo-relatorio">
        <div>
          <h1>Relatório de Transferências</h1>
          <div class="subtitulo">
            Grupo: ${textoSeguroRelatorio(grupo?.nome || "Grupo selecionado")}<br>
            Período: ${textoSeguroRelatorio(dataInicio || "—")} até
            ${textoSeguroRelatorio(dataFim || "—")}<br>
            Modo:
            ${MODO_TRANSFERENCIA === "VENDAS"
              ? "Somente lojas que vendem"
              : "Distribuição geral"}
          </div>
        </div>

        <div class="resumo-relatorio">
          <strong>${ULTIMAS_SUGESTOES_AGRUPADAS.length}</strong>
          linhas agrupadas<br>
          <strong>${totalPares}</strong> pares para transferir
        </div>
      </header>

      <table>
        <thead>
          <tr>
            <th class="foto">Foto</th>
            <th class="produto">Produto / descrição</th>
            <th>Origem</th>
            <th>Destino</th>
            <th>Tamanho - quantidade</th>
            <th class="total">Total</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>

      <div class="rodape">
        Gerado em ${new Date().toLocaleString("pt-BR")}
      </div>

      <script>
        const imagens = [...document.images];

        Promise.all(
          imagens.map(imagem => new Promise(resolve => {
            if(imagem.complete){
              resolve();
              return;
            }

            imagem.onload = resolve;
            imagem.onerror = resolve;
          }))
        ).then(() => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 350);
        });
      <\/script>
    </body>
    </html>
  `);
  janela.document.close();
}

function renderResultadoAnalise(dados){
  const resumo = dados.resumo || {};
  const sugestoes = dados.sugestoes || [];
  const reposicoes = dados.reposicoes || [];

  document.getElementById("cardItens").textContent =
    Number(resumo.itens_analisados || 0)
      .toLocaleString("pt-BR");

  document.getElementById("cardRupturas").textContent =
    Number(resumo.campeas_rupturadas || 0)
      .toLocaleString("pt-BR");

  document.getElementById("cardTransferencias").textContent =
    Number(resumo.transferencias_sugeridas || 0)
      .toLocaleString("pt-BR");

  document.getElementById("cardPares").textContent =
    Number(resumo.pares_transferir || 0)
      .toLocaleString("pt-BR");

  const corpo = document.getElementById("corpoSugestoes");

  ULTIMAS_SUGESTOES_AGRUPADAS =
    agruparSugestoesTransferencia(sugestoes);

  if(ULTIMAS_SUGESTOES_AGRUPADAS.length){
    corpo.innerHTML = ULTIMAS_SUGESTOES_AGRUPADAS.map(item => `
      <tr>
        <td class="coluna-foto-transferencia">
          <button
            type="button"
            class="botao-foto-transferencia produto-link-transferencia"
            data-produto="${escaparHTML(item.produto)}"
            data-descricao="${escaparHTML(item.descricao || "")}"
            title="Abrir detalhes do produto"
          >
            <img
              src="/foto?codigo=${encodeURIComponent(item.produto)}"
              alt="Foto do produto ${escaparHTML(item.produto)}"
              loading="lazy"
              onerror="tratarErroFotoTransferencia(this)"
            >
          </button>
        </td>

        <td class="coluna-produto-transferencia">
          <button
            type="button"
            class="produto-link-transferencia codigo-produto-transferencia"
            data-produto="${escaparHTML(item.produto)}"
            data-descricao="${escaparHTML(item.descricao || "")}"
          >
            ${escaparHTML(item.produto)}
          </button>

          <span>${escaparHTML(item.descricao || "")}</span>
        </td>

        <td class="loja-transferencia loja-origem">
          <span class="etiqueta-loja-transferencia">
            Loja ${escaparHTML(item.origem)}
          </span>
        </td>

        <td class="loja-transferencia loja-destino">
          <span class="etiqueta-loja-transferencia">
            Loja ${escaparHTML(item.destino)}
          </span>
        </td>

        <td class="tamanhos-quantidades-transferencia">
          ${montarTamanhosQuantidades(item.tamanhos)}
        </td>

        <td class="qtd total-transferencia">
          ${Number(item.quantidade_total || 0)}
        </td>

        <td class="motivo motivo-compacto">
          ${item.motivos.map(escaparHTML).join("<br>")}
        </td>
      </tr>
    `).join("");
  }else{
    corpo.innerHTML = `
      <tr>
        <td colspan="7">
          Nenhuma transferência necessária para o período.
        </td>
      </tr>
    `;
  }

  corpo.querySelectorAll(".produto-link-transferencia")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        abrirDetalheTransferencia(
          botao.dataset.produto,
          botao.dataset.descricao
        );
      });
    });

  const reposicoesBox =
    document.getElementById("reposicoesBox");

  const listaReposicoes =
    document.getElementById("listaReposicoes");

  if(reposicoes.length){
    reposicoesBox.classList.remove("oculto");

    listaReposicoes.innerHTML = reposicoes.map(item => `
      <div class="reposicao-item">
        <strong>
          Produto ${escaparHTML(item.produto)}
          — tamanho ${escaparHTML(item.tamanho)}
        </strong>

        <div>
          Loja prioritária:
          ${escaparHTML(item.destino)}
          — participação:
          ${formatarPercentual(item.percentual_campea)}
        </div>

        <small>${escaparHTML(item.motivo || "")}</small>
      </div>
    `).join("");
  }else{
    reposicoesBox.classList.add("oculto");
    listaReposicoes.innerHTML = "";
  }

  document.getElementById("statusAnalise")
    .classList.add("oculto");

  document.getElementById("resultadoAnalise")
    .classList.remove("oculto");
}



const EXPLICACOES_MODOS_TRANSFERENCIA = {
  GERAL:{
    icone:"G",
    titulo:"Distribuição geral",
    resumo:
      "Distribui o estoque para todas as lojas do grupo, mesmo quando alguma ainda não vendeu o produto.",
    quemRecebe:
      "Todas as lojas do grupo que estejam zeradas naquela numeração.",
    origem:
      "Qualquer loja do grupo com sobra disponível, preservando pelo menos 1 par na origem.",
    prioridade:
      "Primeiro garante 1 par nas lojas zeradas; depois envia o excedente para a loja que mais vende.",
    exemplo:
      "Loja 33 tem 3 pares do tamanho 37 e Loja 01 tem zero: a Loja 01 recebe 1 par, mesmo sem ter vendido.",
    alerta:
      "Use este modo para manter pelo menos uma unidade de cada numeração em todas as lojas do grupo.",
    classe:"geral"
  },

  VENDAS:{
    icone:"V",
    titulo:"Somente lojas que vendem",
    resumo:
      "Direciona o estoque apenas para lojas que comprovaram venda do produto ou da numeração no período analisado.",
    quemRecebe:
      "Somente lojas que venderam o produto no período e estejam precisando daquela numeração.",
    origem:
      "Loja com estoque disponível e menor necessidade, preservando o estoque mínimo definido.",
    prioridade:
      "A loja com maior participação nas vendas recebe primeiro; lojas sem venda não recebem.",
    exemplo:
      "Loja 23 vendeu o tamanho 37 e ficou zerada; Loja 33 tem sobra: a transferência vai para a Loja 23.",
    alerta:
      "Use este modo quando quiser concentrar mercadoria apenas onde existe venda comprovada.",
    classe:"vendas"
  },

  DIRECIONADA:{
    icone:"D",
    titulo:"Transferência direcionada",
    resumo:
      "Você escolhe manualmente a loja de origem, a loja de destino e os produtos que deseja movimentar.",
    quemRecebe:
      "Somente a loja de destino escolhida por você.",
    origem:
      "A loja de origem também é escolhida manualmente.",
    prioridade:
      "Não usa ranking automático: prevalecem a origem, o destino, os filtros e as quantidades escolhidas por você.",
    exemplo:
      "Origem Loja 33, destino Loja 01 e complemento contém 2024: o sistema lista os produtos de 2024 da Loja 33 para você escolher o que vai para a Loja 01.",
    alerta:
      "Use este modo para coleções antigas, mudanças de exposição, encerramento de estoque ou decisões comerciais específicas.",
    classe:"direcionada"
  }
};

function atualizarExplicacaoModoTransferencia(modo){
  const dados =
    EXPLICACOES_MODOS_TRANSFERENCIA[modo] ||
    EXPLICACOES_MODOS_TRANSFERENCIA.GERAL;

  const painel =
    document.getElementById("explicacaoModoTransferencia");

  if(!painel) return;

  painel.classList.remove(
    "modo-geral",
    "modo-vendas",
    "modo-direcionada"
  );

  painel.classList.add(`modo-${dados.classe}`);

  const preencher = (id, valor) => {
    const elemento = document.getElementById(id);
    if(elemento) elemento.textContent = valor;
  };

  preencher("iconeExplicacaoModo", dados.icone);
  preencher("tituloExplicacaoModo", dados.titulo);
  preencher("resumoExplicacaoModo", dados.resumo);
  preencher("quemRecebeModo", dados.quemRecebe);
  preencher("origemModo", dados.origem);
  preencher("prioridadeModo", dados.prioridade);
  preencher("exemploModo", dados.exemplo);
  preencher("alertaExplicacaoModo", dados.alerta);
}

function selecionarModoTransferencia(modo){
  MODO_TRANSFERENCIA = modo;
  atualizarExplicacaoModoTransferencia(modo);

  document.querySelectorAll(".modo-transferencia").forEach(botao => {
    botao.classList.toggle("ativo", botao.dataset.modo === modo);
  });
  document.getElementById("painelModoAutomatico")?.classList.toggle("oculto", modo === "DIRECIONADA");
  document.getElementById("painelModoDirecionado")?.classList.toggle("oculto", modo !== "DIRECIONADA");
  document.getElementById("resultadoAnalise")?.classList.add("oculto");
  document.getElementById("resultadoDirecionado")?.classList.add("oculto");
  const status = document.getElementById("statusAnalise");
  status.classList.remove("oculto");
  status.textContent = modo === "DIRECIONADA"
    ? "Escolha origem, destino e filtros para localizar o estoque."
    : (modo === "VENDAS" ? "Somente lojas que venderam o produto poderão receber." : "Todas as lojas zeradas poderão receber 1 par.");
}

function preencherLojasDirecionadas(){
  const empresas = GRUPO_ANALISE_ATUAL ? normalizarEmpresasGrupo(GRUPO_ANALISE_ATUAL) : [];
  const opcoes = empresas.map(e => `<option value="${escaparHTML(e)}">Loja ${escaparHTML(e)}</option>`).join("");
  const origem = document.getElementById("lojaOrigemDirecionada");
  const destino = document.getElementById("lojaDestinoDirecionada");
  if(origem) origem.innerHTML = `<option value="">Selecione</option>${opcoes}`;
  if(destino) destino.innerHTML = `<option value="">Selecione</option>${opcoes}`;
}

async function buscarTransferenciaDirecionada(){
  const origem = document.getElementById("lojaOrigemDirecionada").value;
  const destino = document.getElementById("lojaDestinoDirecionada").value;
  if(!origem || !destino){ alert("Selecione a loja de origem e a loja de destino."); return; }
  if(origem === destino){ alert("A origem precisa ser diferente do destino."); return; }
  const status = document.getElementById("statusAnalise");
  status.classList.remove("oculto");
  status.textContent = "Buscando estoque e aplicando os filtros...";
  document.getElementById("resultadoDirecionado").classList.add("oculto");
  try{
    const params = new URLSearchParams({
      origem, destino,
      departamento:document.getElementById("direcionadaDepartamento").value.trim(),
      grupo:document.getElementById("direcionadaGrupo").value.trim(),
      complemento:document.getElementById("direcionadaComplemento").value.trim(),
      produto:document.getElementById("direcionadaProduto").value.trim(),
      preservar:document.getElementById("direcionadaPreservar").checked ? "1" : "0",
      politica_estoque:document.getElementById("direcionadaPoliticaEstoque")?.value || "LIVRE"
    });
    const dados = await apiTransferencia(`/api/transferencia-inteligente/direcionada?${params.toString()}`);
    ITENS_DIRECIONADOS = dados.itens || [];
    renderTransferenciaDirecionada();
    status.classList.add("oculto");
  }catch(e){ console.error(e); status.textContent=e.message; }
}

function renderTransferenciaDirecionada(){
  const corpo=document.getElementById("corpoDirecionado");
  if(!ITENS_DIRECIONADOS.length){
    corpo.innerHTML='<tr><td colspan="11">Nenhum estoque encontrado para os filtros informados.</td></tr>';
  }else{
    corpo.innerHTML=ITENS_DIRECIONADOS.map((item,i)=>`
      <tr>
        <td><input class="dir-check" data-i="${i}" type="checkbox" onchange="atualizarResumoDirecionado()"></td>
        <td><button type="button" class="produto-link-transferencia" onclick="abrirDetalheTransferencia('${escaparHTML(item.produto)}','${escaparHTML(item.descricao||'')}')">${escaparHTML(item.produto)}</button></td>
        <td>${escaparHTML(item.descricao||'')}</td><td>${escaparHTML(item.complemento||'')}</td>
        <td>${escaparHTML(item.departamento||'')}</td><td>${escaparHTML(item.grupo||'')}</td><td>${escaparHTML(item.tamanho||'')}</td>
        <td class="qtd">${Number(item.estoque||0)}</td>
        <td><input class="dir-qtd" data-i="${i}" type="number" min="0" max="${Number(item.max_transferir||0)}" value="${Number(item.max_transferir||0)}" onchange="validarQtdDirecionada(this); atualizarResumoDirecionado()"></td>
        <td>Loja ${escaparHTML(item.origem)}</td><td>Loja ${escaparHTML(item.destino)}</td>
      </tr>`).join('');
  }
  document.getElementById("dirItens").textContent=ITENS_DIRECIONADOS.length.toLocaleString('pt-BR');
  document.getElementById("dirDestino").textContent=document.getElementById("lojaDestinoDirecionada").value || '—';
  document.getElementById("resultadoDirecionado").classList.remove("oculto");
  atualizarResumoDirecionado();
}

function validarQtdDirecionada(input){
  const max=Number(input.max||0); let valor=Math.max(0,Number(input.value||0));
  if(valor>max) valor=max; input.value=Math.floor(valor);
}
function marcarTodosDirecionados(marcar){
  document.querySelectorAll('.dir-check').forEach(c=>c.checked=marcar); atualizarResumoDirecionado();
}
function atualizarResumoDirecionado(){
  const selecionados=[...document.querySelectorAll('.dir-check:checked')];
  const produtos=new Set(); let pares=0;
  selecionados.forEach(c=>{ const i=Number(c.dataset.i); produtos.add(ITENS_DIRECIONADOS[i]?.produto); const q=document.querySelector(`.dir-qtd[data-i="${i}"]`); pares+=Number(q?.value||0); });
  document.getElementById('dirProdutos').textContent=produtos.size.toLocaleString('pt-BR');
  document.getElementById('dirPares').textContent=pares.toLocaleString('pt-BR');
}

function formatarPercentual(valor){
  return Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits:2,
    maximumFractionDigits:2
  }) + "%";
}

function escaparHTML(valor){
  return String(valor ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}


async function abrirDetalheTransferencia(produto, descricao = ""){
  const modal = document.getElementById("modalDetalheTransferencia");
  const corpo = document.getElementById("corpoDetalheTransferencia");
  const titulo = document.getElementById("tituloDetalheProduto");
  const subtitulo = document.getElementById("subtituloDetalheProduto");

  if(!modal || !corpo) return;

  const codigo = String(produto || "")
    .replace(/\D/g, "")
    .padStart(6, "0")
    .slice(0, 6);

  const grupo = GRUPO_ANALISE_ATUAL ||
    GRUPOS_TRANSFERENCIA.find(
      item => Number(item.id) === Number(GRUPO_ANALISE_ID)
    );

  const empresas = grupo
    ? normalizarEmpresasGrupo(grupo)
    : [];

  const dataInicio =
    document.getElementById("dataInicio")?.value || "";

  const dataFim =
    document.getElementById("dataFim")?.value || "";

  titulo.textContent =
    `${codigo} - ${descricao || "Produto"}`;

  subtitulo.textContent =
    `Grupo ${grupo?.nome || ""} • ${dataInicio || "início"} até ${dataFim || "fim"}`;

  corpo.innerHTML = `
    <div class="vazio">
      Carregando vendas, pedidos, estoque e foto do produto...
    </div>
  `;

  modal.classList.remove("oculto");
  document.body.classList.add("modal-detalhe-aberto");

  try{
    const params = new URLSearchParams();
    params.set("produto", codigo);

    if(empresas.length){
      params.set("empresas", empresas.join(","));
    }

    if(dataInicio){
      params.set("data_ini", dataInicio);
    }

    if(dataFim){
      params.set("data_fim", dataFim);
    }

    const dados = await apiTransferencia(
      `/api/otb-bi/produto-detalhes?${params.toString()}`
    );

    ULTIMO_DETALHE_TRANSFERENCIA = {
      produto:codigo,
      descricao,
      empresas,
      detalhes:dados.detalhes || [],
      preco_normal:Number(dados.preco_normal || 0),
      valor_promocao:Number(dados.valor_promocao || 0),
      complemento:String(dados.complemento || "").trim(),
      custo:Number(dados.custo || 0)
    };

    montarDetalheTransferencia(
      ULTIMO_DETALHE_TRANSFERENCIA
    );

  }catch(e){
    console.error(e);

    corpo.innerHTML = `
      <div class="vazio erro-detalhe">
        Não foi possível carregar os detalhes:
        ${escaparHTML(e.message)}
      </div>
    `;
  }
}

function montarDetalheTransferencia({
  produto,
  descricao,
  empresas,
  detalhes,
  preco_normal,
  valor_promocao,
  complemento,
  custo
}){
  const corpo = document.getElementById("corpoDetalheTransferencia");

  const mapaEmpresas = new Map();
  const tamanhos = new Set();

  const garantirEmpresa = empresa => {
    if(!mapaEmpresas.has(empresa)){
      mapaEmpresas.set(empresa, {
        empresa,
        vendas:0,
        pedidos:0,
        estoque:0,
        tamanhos:new Map()
      });
    }

    return mapaEmpresas.get(empresa);
  };

  (empresas || []).forEach(garantirEmpresa);

  for(const item of detalhes || []){
    const empresa = String(item.empresa || "").padStart(2, "0");
    const tamanho = String(item.tamanho || "")
      .replace(/^0+(?=\d)/, "");

    tamanhos.add(tamanho);

    const registro = garantirEmpresa(empresa);

    if(!registro.tamanhos.has(tamanho)){
      registro.tamanhos.set(tamanho, {
        vendas:0,
        pedidos:0,
        estoque:0
      });
    }

    const grade = registro.tamanhos.get(tamanho);

    grade.vendas += Number(item.vendas || 0);
    grade.pedidos += Number(item.pedidos || 0);
    grade.estoque += Number(item.estoque || 0);

    registro.vendas += Number(item.vendas || 0);
    registro.pedidos += Number(item.pedidos || 0);
    registro.estoque += Number(item.estoque || 0);
  }

  const todosTamanhos = [...tamanhos].sort(
    (a,b) => a.localeCompare(
      b,
      "pt-BR",
      {numeric:true}
    )
  );

  const listaEmpresas = [...mapaEmpresas.values()].sort(
    (a,b) => a.empresa.localeCompare(
      b.empresa,
      "pt-BR",
      {numeric:true}
    )
  );

  const listaTamanhos = todosTamanhos.filter(tamanho => {
    if(!OCULTAR_ZEROS_DETALHE) return true;

    return listaEmpresas.some(empresa => {
      const grade = empresa.tamanhos.get(tamanho) || {
        vendas:0,
        pedidos:0,
        estoque:0
      };

      return (
        Number(grade.vendas || 0) > 0 ||
        Number(grade.pedidos || 0) > 0 ||
        Number(grade.estoque || 0) > 0
      );
    });
  });

  const totalVendas = listaEmpresas.reduce(
    (s,x) => s + x.vendas,
    0
  );

  const totalPedidos = listaEmpresas.reduce(
    (s,x) => s + x.pedidos,
    0
  );

  const totalEstoque = listaEmpresas.reduce(
    (s,x) => s + x.estoque,
    0
  );

  const linhas = listaEmpresas.map(empresa => `
    <tr>
      <td class="empresa-modal"><strong>Loja ${escaparHTML(empresa.empresa)}</strong></td>
      ${listaTamanhos.map(tamanho => {
        const grade = empresa.tamanhos.get(tamanho) || {
          vendas:0,
          pedidos:0,
          estoque:0
        };

        const linhasMetricas = [
          {
            classe:"venda",
            sigla:"V",
            valor:Number(grade.vendas || 0)
          },
          {
            classe:"pedido",
            sigla:"P",
            valor:Number(grade.pedidos || 0)
          },
          {
            classe:"estoque",
            sigla:"E",
            valor:Number(grade.estoque || 0)
          }
        ]
          .map(metrica => `
            <div class="linha-metrica ${metrica.classe}">
              <span>${metrica.sigla}</span>
              <strong class="${
                OCULTAR_ZEROS_DETALHE && metrica.valor === 0
                  ? "valor-zero-oculto"
                  : ""
              }">
                ${formatarNumeroGrade(metrica.valor)}
              </strong>
            </div>
          `)
          .join("");

        return `
          <td class="celula-grade-modal">
            ${linhasMetricas}
          </td>
        `;
      }).join("")}
      <td class="total-loja-modal">
        <div>Vendas: <strong>${formatarNumeroGrade(empresa.vendas)}</strong></div>
        <div>Pedidos: <strong>${formatarNumeroGrade(empresa.pedidos)}</strong></div>
        <div>Estoque: <strong>${formatarNumeroGrade(empresa.estoque)}</strong></div>
      </td>
    </tr>
  `).join("");

  const totaisTamanho = listaTamanhos.map(tamanho => {
    const total = listaEmpresas.reduce((acc, empresa) => {
      const grade = empresa.tamanhos.get(tamanho) || {
        vendas:0,
        pedidos:0,
        estoque:0
      };

      acc.vendas += grade.vendas;
      acc.pedidos += grade.pedidos;
      acc.estoque += grade.estoque;

      return acc;
    }, {
      vendas:0,
      pedidos:0,
      estoque:0
    });

    const linhasTotal = [
      {
        classe:"venda",
        sigla:"V",
        valor:Number(total.vendas || 0)
      },
      {
        classe:"pedido",
        sigla:"P",
        valor:Number(total.pedidos || 0)
      },
      {
        classe:"estoque",
        sigla:"E",
        valor:Number(total.estoque || 0)
      }
    ]
      .map(metrica => `
        <div class="linha-metrica ${metrica.classe}">
          <span>${metrica.sigla}</span>
          <strong class="${
            OCULTAR_ZEROS_DETALHE && metrica.valor === 0
              ? "valor-zero-oculto"
              : ""
          }">
            ${formatarNumeroGrade(metrica.valor)}
          </strong>
        </div>
      `)
      .join("");

    return `
      <td class="celula-grade-modal total-tamanho-modal">
        ${linhasTotal}
      </td>
    `;
  }).join("");

  corpo.innerHTML = `
    <div class="detalhe-produto-layout">
      <aside class="detalhe-produto-foto-box">
        <img
          class="detalhe-produto-foto"
          src="/foto?codigo=${encodeURIComponent(produto)}"
          alt="Foto do produto ${escaparHTML(produto)}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        >

        <div class="detalhe-produto-sem-foto">
          Sem foto
        </div>

        <div class="detalhe-produto-info">
          <div class="codigo-complemento-detalhe">
            <strong>${escaparHTML(produto)}</strong>

            ${
              complemento
                ? `
                  <span class="complemento-detalhe-produto">
                    ${escaparHTML(complemento)}
                  </span>
                `
                : ""
            }
          </div>

          <span class="descricao-detalhe-produto">
            ${escaparHTML(descricao || "")}
          </span>

          <div class="precos-detalhe">
            <div>
              <small>Preço normal</small>
              <strong>${formatarMoedaTransferencia(preco_normal)}</strong>
            </div>

            <div>
              <small>Promoção</small>
              <strong>${formatarMoedaTransferencia(valor_promocao)}</strong>
            </div>

            <div class="card-custo-codificado">
              <small>Codificado</small>
              <strong>${codificarCustoRepublica(custo)}</strong>
            </div>
          </div>
        </div>
      </aside>

      <section class="detalhe-produto-grade-box">
        <div class="barra-opcoes-grade">
          <label class="opcao-ocultar-zeros">
            <input
              id="toggleOcultarZerosDetalhe"
              type="checkbox"
              ${OCULTAR_ZEROS_DETALHE ? "checked" : ""}
            >
            <span>Ocultar zeros</span>
          </label>

          <small>
            Os zeros somem, mas V, P e E permanecem alinhados.
          </small>
        </div>

        <div class="legenda-grade-modal">
          <span class="legenda-venda">V = Vendas</span>
          <span class="legenda-pedido">P = Pedidos</span>
          <span class="legenda-estoque">E = Estoque</span>
        </div>

        <div class="cards-detalhe-produto">
          <article>
            <span>Vendas</span>
            <strong>${formatarNumeroGrade(totalVendas)}</strong>
          </article>

          <article>
            <span>Pedidos</span>
            <strong>${formatarNumeroGrade(totalPedidos)}</strong>
          </article>

          <article>
            <span>Estoque</span>
            <strong>${formatarNumeroGrade(totalEstoque)}</strong>
          </article>

          <article>
            <span>Lojas do grupo</span>
            <strong>${listaEmpresas.length}</strong>
          </article>
        </div>

        <div class="grade-modal-scroll">
          <table class="grade-modal-tabela">
            <thead>
              <tr>
                <th>Loja</th>
                ${listaTamanhos.map(tamanho =>
                  `<th>Tam. ${escaparHTML(tamanho)}</th>`
                ).join("")}
                <th>Total da loja</th>
              </tr>
            </thead>

            <tbody>
              ${linhas || `
                <tr>
                  <td colspan="${listaTamanhos.length + 2}">
                    Nenhum movimento encontrado para esse produto.
                  </td>
                </tr>
              `}

              <tr class="linha-total-grade-modal">
                <td><strong>TOTAL</strong></td>
                ${totaisTamanho}
                <td class="total-loja-modal">
                  <div>Vendas: <strong>${formatarNumeroGrade(totalVendas)}</strong></div>
                  <div>Pedidos: <strong>${formatarNumeroGrade(totalPedidos)}</strong></div>
                  <div>Estoque: <strong>${formatarNumeroGrade(totalEstoque)}</strong></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  document.getElementById("toggleOcultarZerosDetalhe")
    ?.addEventListener("change", evento => {
      OCULTAR_ZEROS_DETALHE = Boolean(evento.target.checked);

      if(ULTIMO_DETALHE_TRANSFERENCIA){
        montarDetalheTransferencia(
          ULTIMO_DETALHE_TRANSFERENCIA
        );
      }
    });
}

function fecharDetalheTransferencia(){
  document.getElementById("modalDetalheTransferencia")
    ?.classList.add("oculto");

  document.body.classList.remove("modal-detalhe-aberto");
}

function formatarNumeroGrade(valor){
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:0,
      maximumFractionDigits:2
    }
  );
}


function codificarCustoRepublica(valor){
  const mapa = {
    "0":"X",
    "1":"R",
    "2":"E",
    "3":"P",
    "4":"U",
    "5":"B",
    "6":"L",
    "7":"I",
    "8":"C",
    "9":"A"
  };

  const numero = Number(valor || 0);

  if(!Number.isFinite(numero) || numero <= 0){
    return "—";
  }

  const formato = numero
    .toFixed(2)
    .replace(".", "-");

  return formato
    .split("")
    .map(caractere => mapa[caractere] ?? caractere)
    .join("");
}

function formatarMoedaTransferencia(valor){
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style:"currency",
      currency:"BRL"
    }
  );
}

document.addEventListener("keydown", evento => {
  if(evento.key === "Escape"){
    fecharDetalheTransferencia();
  }
});

document.addEventListener("click", evento => {
  const modal = document.getElementById(
    "modalDetalheTransferencia"
  );

  if(evento.target === modal){
    fecharDetalheTransferencia();
  }
});


document.addEventListener(
  "DOMContentLoaded",
  iniciarTransferencia
);
