
let CRM_ANIVERSARIANTES = [];
let CRM_LISTA_EXIBIDA = [];
let CRM_CLIENTE_TROCA = null;
let CRM_VENDEDORES_ATIVOS = [];
let CRM_PESQUISA_REALIZADA = false;

function valorBooleanoCRM(valor) {
  if (valor === true || valor === 1) return true;
  return ["true", "t", "1", "sim", "s", "yes", "y"].includes(
    String(valor ?? "").trim().toLocaleLowerCase("pt-BR")
  );
}

function vendedorAtivoCRM(cliente) {
  return valorBooleanoCRM(cliente?.vendedor_ativo);
}

function escaparHTMLCRM(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function preencherDatalistCRM(endpoint, termo, datalistId) {
  const datalist = document.getElementById(datalistId);
  if (!datalist) return;

  try {
    const parametros = new URLSearchParams();
    const texto = String(termo || "").trim();

    if (texto) {
      parametros.set("q", texto);
    }

    const url = parametros.toString()
      ? `${endpoint}?${parametros.toString()}`
      : endpoint;

    const resposta = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar as empresas.");
    }

    const dados = await resposta.json();
    const opcoes = Array.isArray(dados) ? dados : [];

    datalist.innerHTML = opcoes
      .map(valor => `
        <option value="${escaparHTMLCRM(valor)}"></option>
      `)
      .join("");
  } catch (erro) {
    console.error("Erro ao carregar empresas:", erro);
    datalist.innerHTML = "";
  }
}

function ligarDatalistCRM(inputId, endpoint, datalistId) {
  const campo = document.getElementById(inputId);
  if (!campo) return;

  let timer = null;

  function carregarTodos() {
    preencherDatalistCRM(endpoint, "", datalistId);
  }

  function carregarDigitado() {
    preencherDatalistCRM(endpoint, campo.value, datalistId);
  }

  campo.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      carregarDigitado();
    }, 250);
  });

  campo.addEventListener("focus", carregarTodos);

  campo.addEventListener("keydown", evento => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      buscarAniversariantesCRM();
    }
  });
}


function formatarDinheiroFrontCRM(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarDataFrontCRM(valor) {
  if (!valor) return "-";
  const texto = String(valor);
  const simples = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (simples) return `${simples[3]}/${simples[2]}/${simples[1]}`;

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Recife" });
}

function dataISOCRM(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function configurarPeriodoPadraoCRM() {
  const hoje = new Date();
  const inicio = new Date(hoje);

  // Domingo: traz sábado e domingo por padrão.
  if (hoje.getDay() === 0) inicio.setDate(inicio.getDate() - 1);

  const campoInicio = document.getElementById("dataInicioCRM");
  const campoFim = document.getElementById("dataFimCRM");
  if (campoInicio) campoInicio.value = dataISOCRM(inicio);
  if (campoFim) campoFim.value = dataISOCRM(hoje);
}

function ocultarMensagemCRM() {
  const elemento = document.getElementById("mensagemCRM");
  if (!elemento) return;
  elemento.hidden = true;
  elemento.textContent = "";
  delete elemento.dataset.tipo;
}

function mostrarMensagemCRM(mensagem, tipo = "info") {
  const elemento = document.getElementById("mensagemCRM");
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.dataset.tipo = tipo;
  elemento.hidden = false;
  elemento.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function colocarCRMEmCarregamento(carregando) {
  const botao = document.getElementById("btnBuscarCRM");
  if (!botao) return;
  botao.disabled = carregando;
  botao.textContent = carregando ? "Buscando..." : "🔎 Buscar";
}

async function lerRespostaJSONCRM(resposta) {
  const tipo = resposta.headers.get("content-type") || "";
  if (!tipo.includes("application/json")) {
    const texto = await resposta.text();
    if (texto.trim().startsWith("<!DOCTYPE") || texto.trim().startsWith("<html")) {
      throw new Error("A rota do CRM não foi encontrada no index.js.");
    }
    throw new Error(texto || "O servidor retornou uma resposta inválida.");
  }
  return resposta.json();
}

function atualizarResumoCRM(lista) {
  const total = Array.isArray(lista) ? lista.length : 0;
  const ativos = (lista || []).filter(vendedorAtivoCRM).length;
  const trocar = total - ativos;

  document.getElementById("totalAniversariantesCRM").textContent = String(total);
  document.getElementById("totalCarteiraAtivaCRM").textContent = String(ativos);
  document.getElementById("totalTrocarVendedorCRM").textContent = String(trocar);
}

function validarPeriodoCRM() {
  const inicio = document.getElementById("dataInicioCRM")?.value || "";
  const fim = document.getElementById("dataFimCRM")?.value || "";

  if (!inicio || !fim) throw new Error("Informe as datas inicial e final.");
  if (inicio > fim) throw new Error("A data inicial não pode ser maior que a data final.");

  const dias = Math.round((new Date(`${fim}T12:00:00`) - new Date(`${inicio}T12:00:00`)) / 86400000);
  if (dias > 366) throw new Error("Escolha um período de no máximo 366 dias.");

  return { inicio, fim };
}

async function buscarAniversariantesCRM() {
  const corpoTabela = document.getElementById("corpoTabelaAniversariantesCRM");
  ocultarMensagemCRM();

  let periodo;
  try {
    periodo = validarPeriodoCRM();
  } catch (erro) {
    mostrarMensagemCRM(erro.message, "erro");
    return;
  }

  colocarCRMEmCarregamento(true);
  if (corpoTabela) {
    corpoTabela.innerHTML = `<tr><td colspan="10">Buscando aniversariantes...</td></tr>`;
  }

  try {
    const empresaBusca = String(
      document.getElementById("empresaCRM")?.value || ""
    ).trim();
    const parametros = new URLSearchParams({
      data_inicio: periodo.inicio,
      data_fim: periodo.fim
    });
    if (empresaBusca) parametros.set("empresa", empresaBusca);

    const resposta = await fetch(`/api/crm/aniversariantes?${parametros.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    const dados = await lerRespostaJSONCRM(resposta);
    if (!resposta.ok || !dados.sucesso) {
      throw new Error(dados.erro || "Erro ao buscar aniversariantes.");
    }

    CRM_PESQUISA_REALIZADA = true;
    CRM_ANIVERSARIANTES = Array.isArray(dados.aniversariantes) ? dados.aniversariantes : [];
    aplicarFiltrosLocaisCRM();
    document.body.classList.add("crm-resultados-visiveis");
    document.querySelector(".crm-conteudo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (erro) {
    console.error("Erro no CRM:", erro);
    CRM_ANIVERSARIANTES = [];
    CRM_LISTA_EXIBIDA = [];
    atualizarResumoCRM([]);
    if (corpoTabela) {
      corpoTabela.innerHTML = `<tr><td colspan="10">${escaparHTMLCRM(erro.message)}</td></tr>`;
    }
    mostrarMensagemCRM(erro.message, "erro");
  } finally {
    colocarCRMEmCarregamento(false);
  }
}

function obterFotoClienteCRM(cliente) {
  const foto = String(cliente?.cliente_foto || "").trim();
  if (!foto) return "";
  if (/^(https?:|data:|blob:|\/)/i.test(foto)) return foto;
  return `/fotos/clientes/${encodeURIComponent(foto)}`;
}

function avatarClienteCRM(cliente) {
  const foto = obterFotoClienteCRM(cliente);
  const nome = escaparHTMLCRM(cliente.cliente_nome || "Cliente");

  // Sem foto: deixa a célula vazia. Não mostra mais o boneco.
  if (!foto) {
    return `<span class="crm-sem-foto" aria-label="Cliente sem foto"></span>`;
  }

  return `
    <img
      class="crm-foto-cliente"
      src="${escaparHTMLCRM(foto)}"
      alt="Foto de ${nome}"
      title="Passe o mouse ou clique para ampliar"
      loading="lazy"
      tabindex="0"
      data-foto-cliente="1"
      onerror="this.style.display='none'"
    >
  `;
}

function criarVisualizadorFotoCRM() {
  if (document.getElementById("crmVisualizadorFoto")) return;

  const visualizador = document.createElement("div");
  visualizador.id = "crmVisualizadorFoto";
  visualizador.className = "crm-visualizador-foto";
  visualizador.hidden = true;

  visualizador.innerHTML = `
    <button
      type="button"
      class="crm-visualizador-fechar"
      aria-label="Fechar foto ampliada"
    >×</button>

    <img
      id="crmVisualizadorFotoImagem"
      alt="Foto ampliada do cliente"
    >
  `;

  document.body.appendChild(visualizador);

  visualizador
    .querySelector(".crm-visualizador-fechar")
    ?.addEventListener("click", fecharVisualizadorFotoCRM);

  visualizador.addEventListener("click", evento => {
    if (evento.target === visualizador) {
      fecharVisualizadorFotoCRM();
    }
  });
}

function abrirVisualizadorFotoCRM(imagem) {
  if (!imagem?.src) return;

  criarVisualizadorFotoCRM();

  const visualizador = document.getElementById("crmVisualizadorFoto");
  const fotoAmpliada = document.getElementById("crmVisualizadorFotoImagem");

  if (!visualizador || !fotoAmpliada) return;

  fotoAmpliada.src = imagem.src;
  fotoAmpliada.alt = imagem.alt || "Foto ampliada do cliente";

  visualizador.hidden = false;
  document.body.classList.add("crm-foto-aberta");
}

function fecharVisualizadorFotoCRM() {
  const visualizador = document.getElementById("crmVisualizadorFoto");
  if (visualizador) visualizador.hidden = true;

  document.body.classList.remove("crm-foto-aberta");
}

function criarPreviewFotoCRM() {
  if (document.getElementById("crmPreviewFoto")) return;

  const preview = document.createElement("div");
  preview.id = "crmPreviewFoto";
  preview.className = "crm-preview-foto";
  preview.hidden = true;
  preview.innerHTML = `<img alt="Foto ampliada do cliente">`;

  document.body.appendChild(preview);
}

function mostrarPreviewFotoCRM(imagem) {
  // No celular e tablet, a ampliação ocorre pelo clique.
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  if (!imagem?.src) return;

  criarPreviewFotoCRM();

  const preview = document.getElementById("crmPreviewFoto");
  const previewImagem = preview?.querySelector("img");
  if (!preview || !previewImagem) return;

  previewImagem.src = imagem.src;
  previewImagem.alt = imagem.alt || "Foto ampliada do cliente";
  preview.hidden = false;

  const retangulo = imagem.getBoundingClientRect();
  const larguraPreview = 300;
  const alturaPreview = 340;
  const margem = 14;

  let esquerda = retangulo.right + margem;
  let topo = retangulo.top + (retangulo.height / 2) - (alturaPreview / 2);

  if (esquerda + larguraPreview > window.innerWidth - margem) {
    esquerda = retangulo.left - larguraPreview - margem;
  }

  if (esquerda < margem) esquerda = margem;
  if (topo < margem) topo = margem;

  if (topo + alturaPreview > window.innerHeight - margem) {
    topo = window.innerHeight - alturaPreview - margem;
  }

  preview.style.left = `${Math.round(esquerda)}px`;
  preview.style.top = `${Math.round(topo)}px`;
}

function esconderPreviewFotoCRM() {
  const preview = document.getElementById("crmPreviewFoto");
  if (preview) preview.hidden = true;
}

function renderTabelaAniversariantesCRM(lista) {
  const corpoTabela = document.getElementById("corpoTabelaAniversariantesCRM");
  if (!corpoTabela) return;

  CRM_LISTA_EXIBIDA = Array.isArray(lista) ? lista : [];

  if (!CRM_PESQUISA_REALIZADA) {
    corpoTabela.innerHTML = `<tr><td colspan="10">Preencha os filtros e clique em Buscar.</td></tr>`;
    return;
  }

  if (!CRM_LISTA_EXIBIDA.length) {
    corpoTabela.innerHTML = `<tr><td colspan="10">Nenhum aniversariante encontrado para os filtros informados.</td></tr>`;
    return;
  }

  corpoTabela.innerHTML = CRM_LISTA_EXIBIDA.map(cliente => {
    const indice = CRM_ANIVERSARIANTES.indexOf(cliente);
    const vendedorAtivo = vendedorAtivoCRM(cliente);
    const clienteComWhatsApp = Boolean(cliente.possui_telefone_cliente);

    let botaoAcao = "";
    if (!vendedorAtivo) {
      botaoAcao = `<button type="button" class="crm-btn crm-btn-trocar" onclick="abrirTrocaVendedorCRM(${indice})">Trocar de vendedor</button>`;
    } else if (clienteComWhatsApp) {
      botaoAcao = `<button type="button" class="crm-btn crm-btn-enviar" onclick="enviarParabensAoClienteCRM(${indice})">Enviar parabéns</button>`;
    } else {
      botaoAcao = `<button type="button" class="crm-btn" disabled>Cliente sem WhatsApp</button>`;
    }

    const motivo = String(cliente.motivo_carteira || "").trim();
    const status = vendedorAtivo
      ? `<span class="crm-status crm-status-ativo">Carteira ativa</span>`
      : `<span class="crm-status crm-status-inativo" title="${escaparHTMLCRM(motivo)}">Trocar responsável</span>`;

    return `
      <tr class="${vendedorAtivo ? "" : "crm-linha-alerta"}">
        <td class="crm-coluna-foto">${avatarClienteCRM(cliente)}</td>
        <td>${escaparHTMLCRM(cliente.cliente_codigo || "-")}</td>
        <td><strong>${escaparHTMLCRM(cliente.cliente_nome || "Cliente sem nome")}</strong><small>${escaparHTMLCRM(cliente.empresa_nome || `Empresa ${cliente.empresa || "-"}`)}</small></td>
        <td>${escaparHTMLCRM(cliente.cliente_celular || cliente.cliente_telefone || "Não informado")}${!clienteComWhatsApp ? "<small>Telefone inválido ou não informado</small>" : ""}</td>
        <td>${escaparHTMLCRM(cliente.vendedor_nome || "Sem vendedor responsável")}</td>
        <td>${escaparHTMLCRM(cliente.vendedor_celular || cliente.vendedor_telefone || "Não informado")}</td>
        <td>${status}</td>
        <td>${formatarDataFrontCRM(cliente.ultima_compra)}</td>
        <td>${formatarDinheiroFrontCRM(cliente.valor_total_comprado)}</td>
        <td>${botaoAcao}</td>
      </tr>`;
  }).join("");
}

function primeiroNomeCRM(nome) {
  return String(nome || "").trim().split(/\s+/)[0] || "cliente";
}

function normalizarTelefoneFrontCRM(valor) {
  let telefone = String(valor || "").replace(/\D/g, "");
  if (telefone.length === 11 && telefone.startsWith("0")) telefone = telefone.substring(1);
  if (telefone.length === 10 || telefone.length === 11) telefone = `55${telefone}`;
  return telefone;
}

function enviarParabensAoClienteCRM(indice) {
  const cliente = CRM_ANIVERSARIANTES[indice];

  if (!cliente) {
    mostrarMensagemCRM(
      "Cliente não encontrado na lista.",
      "erro"
    );
    return;
  }

  if (!vendedorAtivoCRM(cliente)) {
    abrirTrocaVendedorCRM(indice);
    return;
  }

  const telefoneCliente = normalizarTelefoneFrontCRM(
    cliente.cliente_celular ||
    cliente.cliente_telefone
  );

  if (!telefoneCliente) {
    mostrarMensagemCRM(
      `O cliente ${cliente.cliente_nome || ""} não possui WhatsApp válido cadastrado.`,
      "erro"
    );
    return;
  }

  const nomeCliente = primeiroNomeCRM(
    cliente.cliente_nome
  );

  const nomeVendedor = String(
    cliente.vendedor_nome || "seu vendedor"
  ).trim();

  const telefoneVendedor =
    cliente.vendedor_celular ||
    cliente.vendedor_telefone ||
    "Consulte nossa equipe";

  const ultimaCompra = cliente.ultima_compra
    ? formatarDataFrontCRM(cliente.ultima_compra)
    : "não localizada";

  const mensagem = [
    `🎉 Olá, ${nomeCliente}! Feliz aniversário! 🎂`,
    "",
    "A equipe da *JP CALÇADOS* deseja a você um novo ano de vida cheio de saúde, alegria, paz e muitas conquistas.",
    "",
    "Para comemorar esta data especial, preparamos um presente para você aproveitar em qualquer produto da loja, calculado sobre o preço normal:",
    "",
    "🎁 *5% de desconto no crediário*",
    "💳 *10% de desconto no cartão*",
    "💵 *15% de desconto à vista ou no PIX*",
    "",
    "Venha conhecer nossas novidades. Será um prazer receber você novamente! 👟❤️",
    "",
    `Sua última compra conosco: *${ultimaCompra}*`,
    `Seu vendedor: *${nomeVendedor}*`,
    `WhatsApp para retorno: *${telefoneVendedor}*`,
    "",
    "Responda ao seu vendedor para tirar dúvidas, reservar um produto ou combinar seu atendimento.",
    "",
    "*JP CALÇADOS — cada passo combina com você!*"
  ].join("\n");

  const texto = encodeURIComponent(mensagem);
  const linkWhatsApp = `https://wa.me/${telefoneCliente}?text=${texto}`;

  /*
    O CRM está carregado dentro da tela principal do sistema.
    Por isso, não usamos window.location.href, porque ele tenta abrir
    o wa.me dentro do quadro interno e aparece "recusou-se a conectar".

    O link abaixo é criado como uma ação direta do clique do usuário,
    abrindo fora do quadro interno. No celular, o sistema operacional
    encaminha para o aplicativo do WhatsApp.
  */
  const link = document.createElement("a");
  link.href = linkWhatsApp;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function abrirTrocaVendedorCRM(indice) {
  const cliente = CRM_ANIVERSARIANTES[indice];
  if (!cliente) return mostrarMensagemCRM("Cliente não encontrado.", "erro");

  CRM_CLIENTE_TROCA = cliente;
  document.getElementById("clienteTrocaNomeCRM").textContent = cliente.cliente_nome || "Cliente";
  document.getElementById("vendedorAtualTrocaCRM").textContent = cliente.vendedor_nome || "Sem responsável";
  document.getElementById("modalTrocarVendedorCRM").hidden = false;
  document.body.classList.add("crm-modal-aberto");

  const select = document.getElementById("novoVendedorCRM");
  select.innerHTML = `<option value="">Carregando vendedores ativos...</option>`;

  try {
    const parametros = new URLSearchParams();
    if (cliente.empresa) parametros.set("empresa", cliente.empresa);
    const resposta = await fetch(`/api/crm/vendedores-ativos?${parametros.toString()}`, {
      headers: { Accept: "application/json" }, cache: "no-store"
    });
    const dados = await lerRespostaJSONCRM(resposta);
    if (!resposta.ok || !dados.sucesso) throw new Error(dados.erro || "Erro ao buscar vendedores ativos.");

    CRM_VENDEDORES_ATIVOS = Array.isArray(dados.vendedores) ? dados.vendedores : [];
    select.innerHTML = `<option value="">Selecione o novo vendedor</option>` + CRM_VENDEDORES_ATIVOS.map(v => `
      <option value="${escaparHTMLCRM(v.codigo)}">${escaparHTMLCRM(v.nome)}${v.empresa ? ` — Loja ${escaparHTMLCRM(v.empresa)}` : ""}</option>`).join("");
  } catch (erro) {
    select.innerHTML = `<option value="">Não foi possível carregar</option>`;
    mostrarMensagemCRM(erro.message, "erro");
  }
}

function fecharTrocaVendedorCRM() {
  document.getElementById("modalTrocarVendedorCRM").hidden = true;
  document.body.classList.remove("crm-modal-aberto");
  CRM_CLIENTE_TROCA = null;
}

async function confirmarTrocaVendedorCRM() {
  if (!CRM_CLIENTE_TROCA) return;
  const vendedorCodigo = String(document.getElementById("novoVendedorCRM")?.value || "").trim();
  if (!vendedorCodigo) return mostrarMensagemCRM("Selecione um vendedor ativo.", "erro");

  const botao = document.getElementById("btnConfirmarTrocaCRM");
  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    const resposta = await fetch(`/api/crm/clientes/${encodeURIComponent(CRM_CLIENTE_TROCA.cliente_codigo)}/responsavel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ vendedor_codigo: vendedorCodigo })
    });
    const dados = await lerRespostaJSONCRM(resposta);
    if (!resposta.ok || !dados.sucesso) throw new Error(dados.erro || "Erro ao trocar vendedor.");

    fecharTrocaVendedorCRM();
    mostrarMensagemCRM("Responsável alterado com sucesso.", "sucesso");
    await buscarAniversariantesCRM();
  } catch (erro) {
    mostrarMensagemCRM(erro.message, "erro");
  } finally {
    botao.disabled = false;
    botao.textContent = "Confirmar troca";
  }
}

function aplicarFiltrosLocaisCRM() {
  const busca = String(document.getElementById("buscaClienteCRM")?.value || "").trim().toLocaleLowerCase("pt-BR");
  const status = document.getElementById("statusCarteiraCRM")?.value || "";

  const filtrados = CRM_ANIVERSARIANTES.filter(cliente => {
    const atendeStatus = !status ||
      (status === "ativa" && vendedorAtivoCRM(cliente)) ||
      (status === "trocar" && !vendedorAtivoCRM(cliente));
    if (!atendeStatus) return false;
    if (!busca) return true;

    return [
      cliente.cliente_codigo, cliente.cliente_nome, cliente.cliente_celular,
      cliente.cliente_telefone, cliente.vendedor_nome, cliente.vendedor_celular,
      cliente.vendedor_telefone, cliente.empresa, cliente.empresa_nome
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(busca);
  });

  atualizarResumoCRM(filtrados);
  renderTabelaAniversariantesCRM(filtrados);
}

function limparFiltrosCRM() {
  configurarPeriodoPadraoCRM();
  document.getElementById("empresaCRM").value = "";
  document.getElementById("statusCarteiraCRM").value = "";
  document.getElementById("buscaClienteCRM").value = "";
  CRM_ANIVERSARIANTES = [];
  CRM_LISTA_EXIBIDA = [];
  CRM_PESQUISA_REALIZADA = false;
  atualizarResumoCRM([]);
  ocultarMensagemCRM();
  renderTabelaAniversariantesCRM([]);
  document.body.classList.remove("crm-resultados-visiveis");
}


function imagemParaDataURLCRM(url) {
  return new Promise(resolve => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 80, 80);
        const escala = Math.max(80 / img.width, 80 / img.height);
        const largura = img.width * escala;
        const altura = img.height * escala;
        ctx.drawImage(img, (80 - largura) / 2, (80 - altura) / 2, largura, altura);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch (_) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function exportarPDFCRM() {
  if (!CRM_LISTA_EXIBIDA.length) {
    return mostrarMensagemCRM("Faça uma busca com resultados antes de gerar o PDF.", "erro");
  }

  if (!window.jspdf?.jsPDF) {
    return mostrarMensagemCRM("A biblioteca de PDF não foi carregada. Verifique a internet e tente novamente.", "erro");
  }

  const botao = document.getElementById("btnExportarPDFCRM");
  botao.disabled = true;
  botao.textContent = "Gerando PDF...";

  try {
    const fotos = await Promise.all(CRM_LISTA_EXIBIDA.map(cliente => imagemParaDataURLCRM(obterFotoClienteCRM(cliente))));
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    const inicio = formatarDataFrontCRM(document.getElementById("dataInicioCRM").value);
    const fim = formatarDataFrontCRM(document.getElementById("dataFimCRM").value);
    const empresa = document.getElementById("empresaCRM").value.trim() || "Todas as empresas";

    pdf.setFontSize(18);
    pdf.text("JP CALÇADOS - Aniversariantes", 14, 14);
    pdf.setFontSize(9);
    pdf.text(`Período: ${inicio} a ${fim} | Empresa: ${empresa} | Total: ${CRM_LISTA_EXIBIDA.length}`, 14, 20);

    const linhas = CRM_LISTA_EXIBIDA.map((cliente, indice) => [
      indice,
      cliente.cliente_codigo || "-",
      cliente.cliente_nome || "-",
      cliente.cliente_celular || cliente.cliente_telefone || "-",
      cliente.vendedor_nome || "-",
      cliente.empresa_nome || cliente.empresa || "-",
      vendedorAtivoCRM(cliente) ? "Ativa" : "Trocar",
      formatarDataFrontCRM(cliente.ultima_compra),
      formatarDinheiroFrontCRM(cliente.valor_total_comprado)
    ]);

    pdf.autoTable({
      startY: 25,
      head: [["Foto", "Código", "Cliente", "WhatsApp", "Vendedor", "Empresa", "Carteira", "Última compra", "Total comprado"]],
      body: linhas,
      styles: { fontSize: 7.5, cellPadding: 2, valign: "middle", overflow: "linebreak" },
      headStyles: { fillColor: [24, 49, 83], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 15, minCellHeight: 14, textColor: [255, 255, 255] },
        1: { cellWidth: 18 }, 2: { cellWidth: 44 }, 3: { cellWidth: 28 },
        4: { cellWidth: 38 }, 5: { cellWidth: 34 }, 6: { cellWidth: 20 },
        7: { cellWidth: 24 }, 8: { cellWidth: 26 }
      },
      didDrawCell: dados => {
        if (dados.section !== "body" || dados.column.index !== 0) return;
        const foto = fotos[Number(dados.cell.raw)];
        if (foto) {
          pdf.addImage(foto, "JPEG", dados.cell.x + 1.5, dados.cell.y + 1.5, 11, 11);
        } else {
          pdf.setFontSize(12);
          pdf.setTextColor(100);
          pdf.text("-", dados.cell.x + 7, dados.cell.y + 8, { align: "center" });
        }
      },
      didDrawPage: dados => {
        const pagina = pdf.internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(90);
        pdf.text(`Página ${pagina}`, pdf.internal.pageSize.getWidth() - 15, pdf.internal.pageSize.getHeight() - 7, { align: "right" });
      }
    });

    pdf.save(`aniversariantes-${document.getElementById("dataInicioCRM").value}-a-${document.getElementById("dataFimCRM").value}.pdf`);
  } catch (erro) {
    console.error(erro);
    mostrarMensagemCRM(`Não foi possível gerar o PDF: ${erro.message}`, "erro");
  } finally {
    botao.disabled = false;
    botao.textContent = "📄 Exportar PDF";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ligarDatalistCRM(
    "empresaCRM",
    "/opcoes/empresas",
    "dlEmpresasCRM"
  );

  configurarPeriodoPadraoCRM();
  renderTabelaAniversariantesCRM([]);

  document.getElementById("btnBuscarCRM")?.addEventListener("click", buscarAniversariantesCRM);
  document.getElementById("btnLimparCRM")?.addEventListener("click", limparFiltrosCRM);
  document.getElementById("btnExportarPDFCRM")?.addEventListener("click", exportarPDFCRM);
  document.getElementById("btnFecharTrocaCRM")?.addEventListener("click", fecharTrocaVendedorCRM);
  document.getElementById("btnCancelarTrocaCRM")?.addEventListener("click", fecharTrocaVendedorCRM);
  document.getElementById("btnConfirmarTrocaCRM")?.addEventListener("click", confirmarTrocaVendedorCRM);


  document.getElementById("modalTrocarVendedorCRM")?.addEventListener("click", evento => {
    if (evento.target.id === "modalTrocarVendedorCRM") fecharTrocaVendedorCRM();
  });

  criarVisualizadorFotoCRM();
  criarPreviewFotoCRM();

  document.addEventListener("mouseover", evento => {
    const imagem = evento.target.closest?.(".crm-foto-cliente");
    if (imagem) mostrarPreviewFotoCRM(imagem);
  });

  document.addEventListener("mouseout", evento => {
    const imagem = evento.target.closest?.(".crm-foto-cliente");
    if (imagem) esconderPreviewFotoCRM();
  });

  document.addEventListener("click", evento => {
    const imagem = evento.target.closest?.(".crm-foto-cliente");
    if (!imagem) return;

    evento.preventDefault();
    esconderPreviewFotoCRM();
    abrirVisualizadorFotoCRM(imagem);
  });

  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
      fecharVisualizadorFotoCRM();
      esconderPreviewFotoCRM();
      return;
    }

    if (evento.key === "Enter" || evento.key === " ") {
      const imagem = document.activeElement;
      if (imagem?.classList?.contains("crm-foto-cliente")) {
        evento.preventDefault();
        abrirVisualizadorFotoCRM(imagem);
      }
    }
  });

  window.addEventListener("scroll", esconderPreviewFotoCRM, true);
  window.addEventListener("resize", esconderPreviewFotoCRM);
});
