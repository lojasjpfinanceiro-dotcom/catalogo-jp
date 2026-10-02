"use strict";

const API = "/api/qualidade-fotos";

const $ = seletor =>
  document.querySelector(
    seletor
  );

let resultados = [];
let resultadosBase = [];
const filtroGraficoEmpresas = new Set();
let ocorrenciaFoto = null;

/*
 * Leitor de código de barras pela câmera do celular.
 * Não grava imagem: a câmera é usada somente para localizar o código.
 */
let scannerStream = null;
let scannerFrame = null;
let scannerDetector = null;
let scannerProcessando = false;
let scannerUltimoCodigo = "";
let scannerZxingReader = null;
let scannerZxingControls = null;
let scannerFechando = false;

/*
 * Fotos carregadas por ocorrência.
 * A chave é o número da ocorrência/conserto.
 */
const galeriasFotos = new Map();
const galeriasAbertas = new Set();

document.addEventListener(
  "DOMContentLoaded",
  () => {
    /*
     * Ao abrir a tela, Data inicial e Data final começam
     * preenchidas com a data local de hoje.
     */
    const agora =
      new Date();

    const hoje =
      [
        agora.getFullYear(),
        String(
          agora.getMonth() + 1
        ).padStart(
          2,
          "0"
        ),
        String(
          agora.getDate()
        ).padStart(
          2,
          "0"
        )
      ].join("-");

    if($("#filtroDataInicial")){
      $("#filtroDataInicial").value =
        hoje;
    }

    if($("#filtroDataFinal")){
      $("#filtroDataFinal").value =
        hoje;
    }

    $("#btnBuscar").onclick =
      buscar;

    if($("#btnBipar")){
      $("#btnBipar").onclick =
        abrirScannerCodigoBarras;
    }

    if($("#btnFecharScanner")){
      $("#btnFecharScanner").onclick =
        fecharScannerCodigoBarras;
    }

    if($("#btnPararScanner")){
      $("#btnPararScanner").onclick =
        fecharScannerCodigoBarras;
    }

    if($("#scannerModal")){
      $("#scannerModal").addEventListener(
        "click",
        e => {
          if(e.target === $("#scannerModal")){
            fecharScannerCodigoBarras();
          }
        }
      );
    }

    document.addEventListener(
      "visibilitychange",
      () => {
        if(document.hidden){
          fecharScannerCodigoBarras();
        }
      }
    );

    if($("#btnPdfFiltrado")){
      $("#btnPdfFiltrado").onclick =
        gerarPdfFiltrado;
    }
$("#buscaProduto")
      .addEventListener(
        "keydown",
        e => {
          if(e.key === "Enter"){
            e.preventDefault();
            buscar();
          }
        }
      );

    $("#cameraInput")
      .addEventListener(
        "change",
        enviarFotos
      );

    $("#uploadInput")
      .addEventListener(
        "change",
        enviarFotos
      );

    /*
     * A tela já abre mostrando tudo que ainda está sem foto.
     * A pesquisa serve apenas para localizar rapidamente um item.
     */
    buscar();

    setTimeout(
      () =>
        $("#buscaProduto")
          .focus(),
      150
    );
  }
);

function normalizarCodigoBipado(valor){
  return String(
    valor ||
    ""
  )
    .replace(
      /\s+/g,
      ""
    )
    .trim();
}

function abrirModalScanner(){
  const modal = $("#scannerModal");
  const status = $("#scannerStatus");

  if(!modal){
    return false;
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("scanner-aberto");

  if(status){
    status.textContent = "Abrindo câmera traseira...";
  }

  return true;
}

function carregarBibliotecaZxing(){
  if(window.ZXingBrowser){
    return Promise.resolve(window.ZXingBrowser);
  }

  return new Promise((resolve,reject) => {
    const existente = document.querySelector('script[data-zxing-qualidade="1"]');

    if(existente){
      existente.addEventListener("load", () => resolve(window.ZXingBrowser), { once:true });
      existente.addEventListener("error", () => reject(new Error("Falha ao carregar leitor de código de barras.")), { once:true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/umd/zxing-browser.min.js";
    script.async = true;
    script.dataset.zxingQualidade = "1";
    script.onload = () => {
      if(window.ZXingBrowser){
        resolve(window.ZXingBrowser);
      }else{
        reject(new Error("Leitor de código de barras não ficou disponível."));
      }
    };
    script.onerror = () => reject(new Error("Falha ao carregar leitor de código de barras."));
    document.head.appendChild(script);
  });
}

async function codigoBarrasEncontrado(valor){
  const encontrado = normalizarCodigoBipado(valor);

  if(
    !encontrado ||
    encontrado === scannerUltimoCodigo
  ){
    return;
  }

  scannerUltimoCodigo = encontrado;

  if(navigator.vibrate){
    navigator.vibrate(80);
  }

  const campo = $("#buscaProduto");
  if(campo){
    campo.value = encontrado;
  }

  fecharScannerCodigoBarras();

  toast(`Código ${encontrado} lido. Pesquisando...`);
  await buscar();
}

async function abrirScannerComBarcodeDetector(video,status){
  let formatos = [
    "ean_13",
    "ean_8",
    "upc_a",
    "upc_e",
    "code_128",
    "code_39",
    "itf",
    "codabar"
  ];

  if(typeof BarcodeDetector.getSupportedFormats === "function"){
    const suportados = await BarcodeDetector.getSupportedFormats();
    formatos = formatos.filter(formato => suportados.includes(formato));
  }

  scannerDetector = formatos.length
    ? new BarcodeDetector({ formats:formatos })
    : new BarcodeDetector();

  scannerStream = await navigator.mediaDevices.getUserMedia({
    audio:false,
    video:{
      facingMode:{ ideal:"environment" },
      width:{ ideal:1280 },
      height:{ ideal:720 }
    }
  });

  video.srcObject = scannerStream;
  await video.play();

  if(status){
    status.textContent = "Câmera aberta. Aponte para o código de barras.";
  }

  scannerFrame = requestAnimationFrame(lerFrameCodigoBarras);
}

async function abrirScannerComZxing(video,status){
  if(status){
    status.textContent = "Preparando leitor da câmera...";
  }

  const ZXing = await carregarBibliotecaZxing();

  if(!ZXing?.BrowserMultiFormatReader){
    throw new Error("Leitor de código de barras indisponível.");
  }

  scannerZxingReader = new ZXing.BrowserMultiFormatReader();

  if(status){
    status.textContent = "Câmera aberta. Aponte para o código de barras.";
  }

  scannerZxingControls = await scannerZxingReader.decodeFromConstraints(
    {
      audio:false,
      video:{
        facingMode:{ ideal:"environment" },
        width:{ ideal:1280 },
        height:{ ideal:720 }
      }
    },
    video,
    (result,_error) => {
      if(!result || scannerProcessando){
        return;
      }

      const texto = typeof result.getText === "function"
        ? result.getText()
        : (result.text || result.rawValue || "");

      if(!texto){
        return;
      }

      scannerProcessando = true;
      codigoBarrasEncontrado(texto)
        .finally(() => {
          scannerProcessando = false;
        });
    }
  );
}

async function abrirScannerCodigoBarras(){
  const video = $("#scannerVideo");
  const status = $("#scannerStatus");

  if(!video){
    return;
  }

  /*
   * O clique em BIPAR abre primeiro a tela da câmera.
   * Depois escolhemos o motor de leitura disponível no aparelho:
   * - BarcodeDetector nativo (Android/Chrome e navegadores compatíveis);
   * - ZXing como fallback para iPhone/Safari e outros aparelhos.
   */
  fecharScannerCodigoBarras();
  abrirModalScanner();

  scannerUltimoCodigo = "";
  scannerProcessando = false;
  scannerFechando = false;

  if(
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ){
    fecharScannerCodigoBarras();
    toast(
      "Este navegador não liberou a câmera. Abra o sistema por HTTPS e permita o uso da câmera.",
      true
    );
    return;
  }

  try{
    if("BarcodeDetector" in window){
      await abrirScannerComBarcodeDetector(video,status);
    }else{
      await abrirScannerComZxing(video,status);
    }
  }catch(e){
    console.error("Erro ao abrir leitor de código de barras:",e);
    fecharScannerCodigoBarras();

    const negada = e?.name === "NotAllowedError" || e?.name === "SecurityError";

    toast(
      negada
        ? "A câmera não foi autorizada. No celular, permita o acesso à câmera para este site e toque em Bipar novamente."
        : "Não foi possível abrir a câmera para bipar. Verifique a permissão da câmera e se o site está em HTTPS.",
      true
    );
  }
}

async function lerFrameCodigoBarras(){
  const video = $("#scannerVideo");
  const modal = $("#scannerModal");

  if(
    !video ||
    !modal ||
    modal.hidden ||
    !scannerDetector
  ){
    return;
  }

  if(scannerProcessando || video.readyState < 2){
    scannerFrame = requestAnimationFrame(lerFrameCodigoBarras);
    return;
  }

  scannerProcessando = true;

  try{
    const codigos = await scannerDetector.detect(video);
    const encontrado = (codigos || [])
      .map(item => normalizarCodigoBipado(item.rawValue))
      .find(Boolean);

    if(encontrado){
      await codigoBarrasEncontrado(encontrado);
      return;
    }
  }catch(_){
    // Autofoco e movimento podem causar erros transitórios. Continua lendo.
  }finally{
    scannerProcessando = false;
  }

  if(!$("#scannerModal")?.hidden){
    scannerFrame = requestAnimationFrame(lerFrameCodigoBarras);
  }
}

function fecharScannerCodigoBarras(){
  if(scannerFechando){
    return;
  }

  scannerFechando = true;

  if(scannerFrame){
    cancelAnimationFrame(scannerFrame);
    scannerFrame = null;
  }

  if(scannerZxingControls){
    try{
      scannerZxingControls.stop();
    }catch(_){}
    scannerZxingControls = null;
  }

  if(scannerZxingReader){
    try{
      if(typeof scannerZxingReader.reset === "function"){
        scannerZxingReader.reset();
      }
    }catch(_){}
    scannerZxingReader = null;
  }

  if(scannerStream){
    scannerStream.getTracks().forEach(track => track.stop());
    scannerStream = null;
  }

  const video = $("#scannerVideo");
  if(video){
    try{ video.pause(); }catch(_){}
    video.srcObject = null;
  }

  scannerDetector = null;
  scannerProcessando = false;

  const modal = $("#scannerModal");
  if(modal){
    modal.hidden = true;
    modal.setAttribute("aria-hidden","true");
  }

  document.body.classList.remove("scanner-aberto");
  scannerFechando = false;
}

function preencherObservacoes(lista){
  const select =
    $("#filtroObservacao");

  if(!select){
    return;
  }

  const atual =
    String(
      select.value ||
      ""
    );

  const observacoes =
    [...new Set(
      (lista || [])
        .map(
          item =>
            String(
              item?.observacao_movimento ||
              ""
            ).trim()
        )
        .filter(Boolean)
    )]
      .sort(
        (a,b) =>
          a.localeCompare(
            b,
            "pt-BR",
            {
              numeric:true,
              sensitivity:"base"
            }
          )
      );

  select.innerHTML =
    `<option value="">Todas</option>` +
    observacoes
      .map(
        obs =>
          `<option value="${esc(obs)}">${esc(obs)}</option>`
      )
      .join("");

  if(
    atual &&
    observacoes.includes(
      atual
    )
  ){
    select.value =
      atual;
  }
}

function preencherEmpresas(lista){
  const select =
    $("#filtroEmpresa");

  if(!select){
    return;
  }

  const atual =
    String(
      select.value ||
      ""
    );

  /*
   * O VALUE continua sendo o código da loja (01, 02, 03...).
   * Na tela mostramos somente o apelido/nome comercial da empresa.
   */
  const mapa = new Map();

  for(const item of lista || []){
    const codigo =
      String(
        item?.empresa ||
        item?.codigo ||
        ""
      )
        .trim()
        .padStart(2,"0");

    if(!codigo){
      continue;
    }

    const nome =
      String(
        item?.empresa_nome ||
        item?.nome ||
        codigo
      ).trim();

    if(!mapa.has(codigo)){
      mapa.set(codigo,nome);
    }
  }

  const empresas =
    [...mapa.entries()]
      .map(([codigo,nome]) => ({ codigo,nome }))
      .sort(
        (a,b) =>
          a.nome.localeCompare(
            b.nome,
            "pt-BR",
            {
              numeric:true,
              sensitivity:"base"
            }
          )
      );

  select.innerHTML =
    `<option value="">Todas</option>` +
    empresas
      .map(
        empresa =>
          `<option value="${esc(empresa.codigo)}">${esc(empresa.nome)}</option>`
      )
      .join("");

  if(
    atual &&
    empresas.some(empresa => empresa.codigo === atual)
  ){
    select.value = atual;
  }
}

function esc(valor){
  return String(
    valor ??
    ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

function fmtDataHoraReal(
  valor
){
  if(!valor){
    return "-";
  }

  const bruto =
    String(
      valor
    ).trim();

  const m =
    bruto.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

  if(m){
    const data =
      `${m[3]}/${m[2]}/${m[1]}`;

    if(
      m[4] !== undefined &&
      m[5] !== undefined
    ){
      return `${data} ${m[4]}:${m[5]}${
        m[6] !== undefined
          ? `:${m[6]}`
          : ""
      }`;
    }

    return data;
  }

  return fmtData(
    valor
  );
}

function nomeStatusDefeito(
  valor
){
  const codigo =
    String(
      valor ??
      ""
    ).trim();

  return {
    "1":"Na Loja",
    "2":"Enviado",
    "5":"Baixado",
    "6":"Conserto Entregue",
    "7":"Pré-envio"
  }[codigo] || codigo || "-";
}

function fmtData(valor){
  if(!valor){
    return "-";
  }

  const texto =
    String(
      valor
    )
      .slice(
        0,
        10
      );

  const partes =
    texto.split(
      "-"
    );

  if(partes.length === 3){
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  return texto;
}

async function api(
  url,
  opcoes={}
){
  const r =
    await fetch(
      url,
      {
        credentials:"same-origin",
        ...opcoes
      }
    );

  const tipo =
    String(
      r.headers.get(
        "content-type"
      ) ||
      ""
    );

  const corpo =
    tipo.includes(
      "application/json"
    )
      ? await r.json()
      : {
          ok:r.ok,
          erro:
            await r.text()
        };

  if(
    !r.ok
    ||
    corpo?.ok === false
  ){
    throw new Error(
      corpo?.erro ||
      `Erro HTTP ${r.status}`
    );
  }

  return corpo;
}

function renderLojasDonas(
  item
){
  const lojas =
    Array.isArray(
      item?.lojas_donas
    )
      ? item.lojas_donas
      : [];

  if(!lojas.length){
    return item?.ultima_compra
      ? `<span class="dono-ok">Esta loja é dona</span>`
      : `<span class="dono-vazio">Sem compra encontrada</span>`;
  }

  return lojas
    .map(
      loja => `
        <div class="loja-dona-item">
          <strong>Loja ${esc(
            String(
              loja.empresa ||
              ""
            )
              .trim()
              .padStart(
                2,
                "0"
              )
          )}</strong>
          <span>${esc(
            fmtData(
              loja.ultima_compra
            )
          )}</span>
        </div>
      `
    )
    .join("");
}

function textoLojasDonasPdf(
  item
){
  const lojas =
    Array.isArray(
      item?.lojas_donas
    )
      ? item.lojas_donas
      : [];

  if(!lojas.length){
    return item?.ultima_compra
      ? "Esta loja é dona"
      : "Sem compra encontrada";
  }

  return lojas
    .map(
      loja =>
        `Loja ${String(
          loja.empresa ||
          ""
        )
          .trim()
          .padStart(
            2,
            "0"
          )} - ${fmtData(
            loja.ultima_compra
          )}`
    )
    .join(" | ");
}

function ordenarResultadosDataLoja(
  lista
){
  return [
    ...(lista || [])
  ].sort(
    (a,b) => {
      const dataA =
        String(
          a.data ||
          ""
        );

      const dataB =
        String(
          b.data ||
          ""
        );

      const porData =
        dataB.localeCompare(
          dataA
        );

      if(porData){
        return porData;
      }

      const lojaA =
        String(
          a.empresa ||
          ""
        )
          .trim()
          .padStart(
            2,
            "0"
          );

      const lojaB =
        String(
          b.empresa ||
          ""
        )
          .trim()
          .padStart(
            2,
            "0"
          );

      const porLoja =
        lojaA.localeCompare(
          lojaB,
          "pt-BR",
          {
            numeric:true
          }
        );

      if(porLoja){
        return porLoja;
      }

      return String(
        b.id ||
        b.conserto ||
        b.movimento ||
        ""
      ).localeCompare(
        String(
          a.id ||
          a.conserto ||
          a.movimento ||
          ""
        ),
        "pt-BR",
        {
          numeric:true
        }
      );
    }
  );
}

async function gerarPdfFiltrado(){
  if(!resultados.length){
    return toast(
      "Não há ocorrências filtradas para gerar o PDF.",
      true
    );
  }

  const btn =
    $("#btnPdfFiltrado");

  const textoOriginal =
    btn?.textContent ||
    "PDF";

  try{
    if(btn){
      btn.disabled =
        true;

      btn.textContent =
        "Gerando...";
    }

    const filtros = {
      termo:
        String(
          $("#buscaProduto")?.value ||
          ""
        ).trim(),

      empresa:
        String(
          $("#filtroEmpresa")?.value ||
          ""
        ).trim(),

      observacao:
        String(
          $("#filtroObservacao")?.value ||
          ""
        ).trim(),

      data_inicial:
        String(
          $("#filtroDataInicial")?.value ||
          ""
        ).trim(),

      data_final:
        String(
          $("#filtroDataFinal")?.value ||
          ""
        ).trim()
    };

    const resposta =
      await fetch(
        `${API}/pdf`,
        {
          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              filtros,
              itens:
                ordenarResultadosDataLoja(
                  resultados
                )
                  .map(
                    item => ({
                      ...item,
                      lojas_donas_texto:
                        textoLojasDonasPdf(
                          item
                        )
                    })
                  )
            })
        }
      );

    if(!resposta.ok){
      let erro =
        `Erro HTTP ${resposta.status}`;

      try{
        const corpo =
          await resposta.json();

        erro =
          corpo?.erro ||
          erro;
      }catch{}

      throw new Error(
        erro
      );
    }

    const blob =
      await resposta.blob();

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    const hoje =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    a.href =
      url;

    a.download =
      `fotos-defeitos-filtrado-${hoje}.pdf`;

    document.body.appendChild(
      a
    );

    a.click();
    a.remove();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      1500
    );

  }catch(e){
    toast(
      e.message,
      true
    );

  }finally{
    if(btn){
      btn.textContent =
        textoOriginal;

      btn.disabled =
        resultados.length === 0;
    }
  }
}

function codigoEmpresaGrafico(item){
  return String(item?.empresa || "")
    .trim()
    .padStart(2,"0");
}

function aplicarFiltroGraficoEmpresas(){
  resultados = ordenarResultadosDataLoja(
    (resultadosBase || []).filter(item => {
      if(!filtroGraficoEmpresas.size){
        return true;
      }
      return filtroGraficoEmpresas.has(codigoEmpresaGrafico(item));
    })
  );

  const qtdPendentes = $("#qtdPendentes");
  if(qtdPendentes){
    qtdPendentes.textContent = String(resultados.length);
  }

  const totalResultados = $("#totalResultados");
  if(totalResultados){
    totalResultados.textContent = `${resultados.length} pendente(s)`;
  }

  render();
  renderMiniGraficoPendenciasEmpresa();

  if($("#btnPdfFiltrado")){
    $("#btnPdfFiltrado").disabled = resultados.length === 0;
  }
}

function alternarEmpresaGrafico(codigo){
  const chave = String(codigo || "").trim().padStart(2,"0");
  if(!chave) return;

  if(filtroGraficoEmpresas.has(chave)){
    filtroGraficoEmpresas.delete(chave);
  }else{
    filtroGraficoEmpresas.add(chave);
  }

  aplicarFiltroGraficoEmpresas();
}

function limparFiltroGraficoEmpresas(){
  if(!filtroGraficoEmpresas.size) return;
  filtroGraficoEmpresas.clear();
  aplicarFiltroGraficoEmpresas();
}

function renderMiniGraficoPendenciasEmpresa(){
  const alvo = $("#graficoPendenciasEmpresa");
  const totalAlvo = $("#qtdParesSemFoto");

  if(!alvo){
    return;
  }

  const mapa = new Map();

  // O gráfico parte da base recebida dos filtros superiores (Busca, Empresa,
  // Observação e Datas). O filtro feito pelo próprio gráfico não elimina
  // as outras barras, permitindo seleção múltipla.
  for(const item of resultadosBase || []){
    if(Number(item?.qtd_fotos || 0) > 0){
      continue;
    }

    const codigo = codigoEmpresaGrafico(item);
    const nome = String(item?.empresa_nome || codigo || "Sem empresa").trim();
    const quantidade = Math.abs(Number(item?.quantidade || 0));
    const chave = codigo || nome;

    if(!mapa.has(chave)){
      mapa.set(chave,{ codigo,nome,quantidade:0 });
    }

    mapa.get(chave).quantidade += Number.isFinite(quantidade) ? quantidade : 0;
  }

  const dados = [...mapa.values()]
    .filter(item => item.quantidade > 0)
    .sort((a,b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome,"pt-BR",{numeric:true}));

  const dadosAtivos = filtroGraficoEmpresas.size
    ? dados.filter(item => filtroGraficoEmpresas.has(item.codigo))
    : dados;
  const total = dadosAtivos.reduce((s,item) => s + item.quantidade,0);

  if(totalAlvo){
    totalAlvo.textContent = new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(total);
  }

  if(!dados.length){
    alvo.innerHTML = '<div class="mini-grafico-vazio">Nenhum defeito sem foto nos filtros atuais.</div>';
    return;
  }

  const maior = Math.max(...dados.map(item => item.quantidade),1);
  const fmt = valor => new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2}).format(valor);

  alvo.innerHTML = dados.map(item => {
    const percentual = Math.max(3,(item.quantidade / maior) * 100);
    const rotulo = item.nome || `Loja ${item.codigo}`;
    const selecionado = filtroGraficoEmpresas.has(item.codigo);
    const apagado = filtroGraficoEmpresas.size > 0 && !selecionado;

    return `
      <button
        type="button"
        class="mini-grafico-linha${selecionado ? " selecionado" : ""}${apagado ? " nao-selecionado" : ""}"
        data-grafico-empresa="${esc(item.codigo)}"
        title="${esc(rotulo)}: ${esc(fmt(item.quantidade))} — clique para selecionar/remover; duplo clique limpa todas as seleções"
        aria-pressed="${selecionado ? "true" : "false"}"
      >
        <div class="mini-grafico-rotulo">
          <span>${esc(rotulo)}</span>
          <b>${esc(fmt(item.quantidade))}</b>
        </div>
        <div class="mini-grafico-trilho">
          <div class="mini-grafico-barra" style="width:${percentual.toFixed(2)}%"></div>
        </div>
      </button>
    `;
  }).join("");

  alvo.querySelectorAll("[data-grafico-empresa]").forEach(item => {
    item.addEventListener("click", () => alternarEmpresaGrafico(item.dataset.graficoEmpresa));
    item.addEventListener("dblclick", e => {
      e.preventDefault();
      limparFiltroGraficoEmpresas();
    });
  });
}

async function buscar(){
  const termo =
    $("#buscaProduto")
      .value
      .trim();

  const empresa =
    String(
      $("#filtroEmpresa")?.value ||
      ""
    ).trim();

  const observacao =
    String(
      $("#filtroObservacao")?.value ||
      ""
    ).trim();

  const dataInicial =
    String(
      $("#filtroDataInicial")?.value ||
      ""
    ).trim();

  const dataFinal =
    String(
      $("#filtroDataFinal")?.value ||
      ""
    ).trim();

  $("#statusBusca")
    .textContent =
      termo || empresa || observacao || dataInicial || dataFinal
        ? "Pesquisando no Seta..."
        : "Carregando defeitos recentes...";

  $("#btnBuscar")
    .disabled =
      true;

  try{
    const dados =
      await api(
        `${API}/buscar?q=${encodeURIComponent(
          termo
        )}&empresa_filtro=${encodeURIComponent(
          empresa
        )}&obs_filtro=${encodeURIComponent(
          observacao
        )}&data_inicial=${encodeURIComponent(
          dataInicial
        )}&data_final=${encodeURIComponent(
          dataFinal
        )}`
      );

    resultadosBase =
      ordenarResultadosDataLoja(
        Array.isArray(
          dados.dados
        )
          ? dados.dados
          : []
      );

    // Qualquer nova busca/filtro superior redefine a base do gráfico.
    filtroGraficoEmpresas.clear();
    resultados = [...resultadosBase];

    /*
     * EMPRESA:
     * mostra somente as lojas que existem na tabela atualmente carregada.
     * Assim o dropdown acompanha exatamente o resultado exibido na tela,
     * da mesma forma que já fazemos com Observação.
     */
    preencherEmpresas(
      resultados
    );

    /*
     * A lista de observações é montada com os registros carregados.
     * Quando já existe uma observação selecionada, mantemos a lista
     * atual para permitir trocar ou limpar o filtro.
     */
    if(!observacao){
      preencherObservacoes(
        resultados
      );
    }

    const totalPendentes =
      Number(
        dados.total_pendentes ??
        resultados.length
      );

    $("#qtdPendentes")
      .textContent =
        dados.parcial
          ? `${totalPendentes}+`
          : String(
              totalPendentes
            );

    $("#totalResultados")
      .textContent =
        `${resultados.length} pendente(s)`;

    $("#statusBusca")
      .textContent =
        termo || empresa || dataInicial || dataFinal
          ? [
              "Pendências encontradas",
              empresa ? `na empresa ${empresa}` : "",
              dataInicial ? `de ${fmtData(dataInicial)}` : "",
              dataFinal ? `até ${fmtData(dataFinal)}` : "",
              termo ? `para “${termo}”` : ""
            ]
              .filter(Boolean)
              .join(" ") + "."
          : (
              dados.parcial
                ? "Pendências mais recentes sem foto. Há mais registros além do limite carregado."
                : "Todas as ocorrências carregadas abaixo ainda estão sem foto."
            );

    render();
    renderMiniGraficoPendenciasEmpresa();

    if($("#btnPdfFiltrado")){
      $("#btnPdfFiltrado").disabled =
        resultados.length === 0;
    }
}catch(e){
    resultados = [];

    render();
    renderMiniGraficoPendenciasEmpresa();

    if($("#btnPdfFiltrado")){
      $("#btnPdfFiltrado").disabled =
        true;
    }
$("#statusBusca")
      .textContent =
        "Não foi possível pesquisar.";

    toast(
      e.message,
      true
    );

  }finally{
    $("#btnBuscar")
      .disabled =
      false;

    /*
     * Depois de qualquer pesquisa feita pelo campo de produto/código,
     * limpa somente esse campo e devolve o foco para ele.
     * Assim o estoquista pode bipar/digitar o próximo código imediatamente,
     * sem precisar apagar o código anterior.
     * Empresa e período permanecem selecionados.
     */
    if(termo){
      const campoBusca =
        $("#buscaProduto");

      if(campoBusca){
        campoBusca.value =
          "";

        setTimeout(
          () =>
            campoBusca.focus(),
          0
        );
      }
    }
  }
}

function render(){
  const alvo =
    $("#listaResultados");

  if(!resultados.length){
    alvo.innerHTML =
      `
        <div class="vazio">
          Nenhuma ocorrência sem foto encontrada.
        </div>
      `;

    return;
  }

  alvo.innerHTML =
    `
      <div class="tabela-scroll">
        <table class="tabela-pendencias">
          <thead>
            <tr>
              <th class="produto-foto-col">Foto Produto</th>
              <th class="acao-col">Fotos</th>
              <th>Loja</th>
              <th>Ocorrência</th>
              <th>Entrada (Data/Hora)</th>
              <th>Observação</th>
              <th>Última Compra</th>
              <th class="lojas-donas-col">Lojas Donas / Últ. Compra</th>
              <th>Produto</th>
              <th>Tamanho</th>
              <th>Descrição</th>
              <th>Referência</th>
              <th>Defeito</th>
              <th>Status</th>
              <th>Qtd.</th>
            </tr>
          </thead>

          <tbody>
            ${resultados.map(
              o => {
                const id =
                  o.id ||
                  o.conserto ||
                  o.movimento;

                return `
                  <tr>
                    <td
                      data-label="Foto Produto"
                      class="produto-foto-cell"
                    >
                      <div class="produto-foto-box">
                        <img
                          class="produto-foto-img"
                          src="/foto?codigo=${encodeURIComponent(
                            String(
                              o.produto_base ||
                              o.produto ||
                              ""
                            )
                              .replace(/\D/g,"")
                              .slice(0,6)
                          )}"
                          alt="Foto do produto"
                          loading="lazy"
                          onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';"
                        >
                        <span class="produto-foto-sem">
                          Sem foto
                        </span>
                      </div>
                    </td>

                    <td
                      data-label="Fotos"
                      class="acoes-tabela"
                    >
                      <div class="acoes-foto">
                        <button
                          type="button"
                          class="btn camera"
                          data-fotografar="${esc(
                            id
                          )}"
                        >
                          📷 Fotografar
                        </button>

                        <button
                          type="button"
                          class="btn upload"
                          data-upload="${esc(
                            id
                          )}"
                        >
                          🖼 Enviar
                        </button>
                      </div>

                      <div
                        class="galeria-wrap"
                        data-galeria="${esc(
                          id
                        )}"
                        ${
                          galeriasAbertas.has(
                            String(
                              id
                            )
                          )
                            ? ""
                            : "hidden"
                        }
                      >
                        ${renderGaleria(
                          id
                        )}
                      </div>
                    </td>

                    <td data-label="Loja">
                      <strong class="loja-tabela">
                        ${esc(
                          o.empresa_nome ||
                          o.empresa ||
                          "-"
                        )}
                      </strong>
                    </td>

                    <td data-label="Ocorrência">
                      <strong class="ocorrencia-tabela">
                        ${esc(
                          o.conserto ||
                          o.id ||
                          o.movimento ||
                          "-"
                        )}
                      </strong>
                    </td>

                    <td data-label="Entrada (Data/Hora)">
                      <strong class="entrada-datahora">
                        ${esc(
                          fmtDataHoraReal(
                            o.entrada_datahora ||
                            o.data
                          )
                        )}
                      </strong>
                    </td>

                    <td data-label="Observação">
                      ${esc(
                        o.observacao_movimento ||
                        "-"
                      )}
                    </td>

                    <td data-label="Última Compra">
                      ${esc(
                        fmtData(
                          o.ultima_compra
                        )
                      )}
                    </td>

                    <td
                      data-label="Lojas Donas / Últ. Compra"
                      class="lojas-donas-cell"
                    >
                      ${renderLojasDonas(o)}
                    </td>

                    <td data-label="Produto">
                      <strong>
                        ${esc(
                          String(
                            o.produto_base ||
                            o.produto ||
                            ""
                          )
                            .replace(/\D/g,"")
                            .slice(0,6)
                          ||
                          "-"
                        )}
                      </strong>

                      ${
                        o.codigos_barras
                          ? `
                            <small class="subinfo">
                              Barra: ${esc(
                                o.codigos_barras
                              )}
                            </small>
                          `
                          : ""
                      }
                    </td>

                    <td data-label="Tamanho">
                      <strong>
                        ${esc(
                          String(
                            o.produto ||
                            ""
                          )
                            .replace(/\D/g,"")
                            .padStart(8,"0")
                            .slice(-2)
                          ||
                          "-"
                        )}
                      </strong>
                    </td>

                    <td data-label="Descrição">
                      ${esc(
                        o.descricao ||
                        "-"
                      )}
                    </td>

                    <td data-label="Referência">
                      ${esc(
                        o.referencia ||
                        "-"
                      )}
                    </td>

                    <td data-label="Defeito">
                      <strong>
                        ${esc(
                          o.defeito ||
                          "-"
                        )}
                      </strong>
                    </td>

                    <td data-label="Status">
                      ${esc(
                        nomeStatusDefeito(
                          o.status_seta
                        )
                      )}
                    </td>

                    <td data-label="Qtd.">
                      ${esc(
                        Math.abs(
                          Number(
                            o.quantidade ||
                            0
                          )
                        )
                      )}
                    </td>

                  </tr>
                `;
              }
            ).join("")}
          </tbody>
        </table>
      </div>
    `;

  alvo
    .querySelectorAll(
      "[data-fotografar]"
    )
    .forEach(
      btn => {
        btn.onclick =
          () =>
            abrirCamera(
              btn.dataset.fotografar
            );
      }
    );

  alvo
    .querySelectorAll(
      "[data-upload]"
    )
    .forEach(
      btn => {
        btn.onclick =
          () =>
            abrirUpload(
              btn.dataset.upload
            );
      }
    );

  alvo
    .querySelectorAll(
      "[data-excluir-foto]"
    )
    .forEach(
      btn => {
        btn.onclick =
          () =>
            excluirFoto(
              btn.dataset.ocorrencia,
              btn.dataset.excluirFoto
            );
      }
    );
}

function renderGaleria(
  id
){
  const chave =
    String(
      id ||
      ""
    );

  if(
    !galeriasAbertas.has(
      chave
    )
  ){
    return "";
  }

  const fotos =
    galeriasFotos.get(
      chave
    );

  if(!fotos){
    return `
      <div class="galeria-msg">
        Carregando fotos...
      </div>
    `;
  }

  if(!fotos.length){
    return `
      <div class="galeria-msg">
        Nenhuma foto cadastrada nesta ocorrência.
      </div>
    `;
  }

  return `
    <div class="galeria-fotos">
      ${fotos.map(
        foto => `
          <figure class="foto-item">
            <a
              href="${esc(
                foto.url ||
                foto.arquivo_url ||
                "#"
              )}"
              target="_blank"
              rel="noopener"
            >
              <img
                src="${esc(
                  foto.url ||
                  foto.arquivo_url ||
                  ""
                )}"
                alt="Foto do defeito"
                loading="lazy"
              >
            </a>

            ${
              foto.id
                ? `
                  <button
                    type="button"
                    class="btn-excluir-foto"
                    data-excluir-foto="${esc(
                      foto.id
                    )}"
                    data-ocorrencia="${esc(
                      chave
                    )}"
                    title="Excluir foto"
                  >
                    🗑 Excluir
                  </button>
                `
                : ""
            }
          </figure>
        `
      ).join("")}
    </div>
  `;
}

async function alternarGaleria(
  id
){
  const chave =
    String(
      id ||
      ""
    );

  if(
    galeriasAbertas.has(
      chave
    )
  ){
    galeriasAbertas.delete(
      chave
    );
    render();
    return;
  }

  galeriasAbertas.add(
    chave
  );

  render();

  try{
    const dados =
      await api(
        `${API}/${encodeURIComponent(
          chave
        )}/fotos`
      );

    galeriasFotos.set(
      chave,
      Array.isArray(
        dados.dados
      )
        ? dados.dados
        : []
    );

    render();

  }catch(e){
    galeriasAbertas.delete(
      chave
    );

    render();

    toast(
      e.message,
      true
    );
  }
}

async function excluirFoto(
  ocorrencia,
  fotoId
){
  const chave =
    String(
      ocorrencia ||
      ""
    );

  if(
    !chave
    ||
    !fotoId
  ){
    return;
  }

  if(
    !confirm(
      "Excluir esta foto? Esta ação remove somente a foto do JP Sistema e não altera o ERP Seta."
    )
  ){
    return;
  }

  try{
    await api(
      `${API}/${encodeURIComponent(
        chave
      )}/fotos/${encodeURIComponent(
        fotoId
      )}`,
      {
        method:"DELETE"
      }
    );

    const atuais =
      galeriasFotos.get(
        chave
      ) ||
      [];

    galeriasFotos.set(
      chave,
      atuais.filter(
        foto =>
          String(
            foto.id
          ) !==
          String(
            fotoId
          )
      )
    );

    const item =
      resultados.find(
        x =>
          String(
            x.id ||
            x.conserto ||
            x.movimento
          ) ===
          chave
      );

    if(item){
      item.qtd_fotos =
        Math.max(
          0,
          Number(
            item.qtd_fotos ||
            0
          ) - 1
        );
    }

    render();

    toast(
      "Foto excluída do JP Sistema."
    );

  }catch(e){
    toast(
      e.message,
      true
    );
  }
}

function localizarOcorrencia(
  id
){
  return (
    resultados.find(
      x =>
        String(
          x.id ||
          x.conserto ||
          x.movimento
        ) ===
        String(
          id
        )
    )
    ||
    null
  );
}

function abrirCamera(
  id
){
  ocorrenciaFoto =
    localizarOcorrencia(
      id
    );

  if(!ocorrenciaFoto){
    return toast(
      "Ocorrência não encontrada.",
      true
    );
  }

  const input =
    $("#cameraInput");

  input.value =
    "";

  /*
   * Em Android/iPhone compatíveis, capture=environment
   * solicita diretamente a câmera traseira.
   */
  input.click();
}

function abrirUpload(
  id
){
  ocorrenciaFoto =
    localizarOcorrencia(
      id
    );

  if(!ocorrenciaFoto){
    return toast(
      "Ocorrência não encontrada.",
      true
    );
  }

  const input =
    $("#uploadInput");

  input.value =
    "";

  /*
   * Sem capture: abre a galeria/arquivos do celular
   * ou o seletor de arquivos do computador.
   */
  input.click();
}

async function enviarFotos(){
  const arquivos =
    [
      ...(
        this.files ||
        []
      )
    ];

  if(
    !ocorrenciaFoto
    ||
    !arquivos.length
  ){
    return;
  }

  const id =
    ocorrenciaFoto.id ||
    ocorrenciaFoto.conserto ||
    ocorrenciaFoto.movimento;

  const fd =
    new FormData();

  arquivos.forEach(
    arquivo =>
      fd.append(
        "fotos",
        arquivo
      )
  );

  toast(
    arquivos.length > 1
      ? "Enviando fotos..."
      : "Enviando foto..."
  );

  try{
    await api(
      `${API}/${encodeURIComponent(
        id
      )}/fotos`,
      {
        method:"POST",
        body:fd
      }
    );

    const item =
      resultados.find(
        x =>
          String(
            x.id ||
            x.conserto ||
            x.movimento
          ) ===
          String(
            id
          )
      );

    if(item){
      item.qtd_fotos =
        Number(
          item.qtd_fotos ||
          0
        )
        +
        arquivos.length;
    }

    /*
     * Esta tela mostra somente pendências sem foto.
     * Assim que o primeiro arquivo é salvo, a ocorrência sai
     * automaticamente da lista de pendências.
     */
    resultados =
      resultados.filter(
        x =>
          String(
            x.id ||
            x.conserto ||
            x.movimento
          ) !==
          String(
            id
          )
      );

    const qtdPendentesEl =
      $("#qtdPendentes");

    if(qtdPendentesEl){
      const atual =
        Number(
          String(
            qtdPendentesEl.textContent ||
            "0"
          )
            .replace(/\D/g,"")
        );

      if(
        Number.isFinite(
          atual
        )
        &&
        atual > 0
      ){
        qtdPendentesEl.textContent =
          String(
            atual - 1
          );
      }
    }

    $("#totalResultados")
      .textContent =
        `${resultados.length} pendente(s)`;

    /*
     * Se a galeria estiver aberta, recarrega para mostrar
     * imediatamente as fotos recém-enviadas.
     */
    if(
      galeriasAbertas.has(
        String(
          id
        )
      )
    ){
      const atualizadas =
        await api(
          `${API}/${encodeURIComponent(
            id
          )}/fotos`
        );

      galeriasFotos.set(
        String(
          id
        ),
        Array.isArray(
          atualizadas.dados
        )
          ? atualizadas.dados
          : []
      );
    }

    render();

    toast(
      `${arquivos.length} foto(s) cadastrada(s) no JP Sistema.`
    );

  }catch(e){
    toast(
      e.message,
      true
    );

  }finally{
    this.value =
      "";
  }
}

function toast(
  texto,
  erro=false
){
  const el =
    $("#toast");

  el.hidden =
    false;

  el.textContent =
    texto;

  el.classList.toggle(
    "erro",
    Boolean(
      erro
    )
  );

  clearTimeout(
    toast.timer
  );

  toast.timer =
    setTimeout(
      () => {
        el.hidden =
          true;
      },
      3600
    );
}
