  let AT_EMPRESA = "";
    let AT_GERENTE = null;
    let AT_VENDEDORES = [];
    let AT_FILA = [];
    let AT_PERGUNTAS = [];
    let AT_ATENDIMENTO_ATUAL = null;
    let AT_ATENDIMENTOS_ABERTOS = {};
    let AT_BLOQUEANDO_FILA = false;
let AT_CENTRAL_TOKEN = sessionStorage.getItem("jp_atendimento_central_token") || "";
let AT_HEARTBEAT_TIMER = null;
let AT_CENTRAL_ATIVA = false;

    async function api(url, opts={}){
      const headers = {
        "Content-Type":"application/json",
        ...(opts.headers || {})
      };

      if(AT_CENTRAL_TOKEN){
        headers["X-Atendimento-Central-Token"] = AT_CENTRAL_TOKEN;
      }

      const r = await fetch(url, {
        credentials:"same-origin",
        ...opts,
        headers
      });

      const texto = await r.text();
      let j;

      try{
        j = JSON.parse(texto);
      }catch(e){
        const erro = new Error("Servidor retornou erro/HTML em vez de JSON.");
        erro.status = r.status;
        throw erro;
      }

      if(!r.ok || j.ok === false){
        const erro = new Error(j.erro || j.detalhe || "Erro");
        erro.status = r.status;
        erro.codigo = j.codigo || "";
        erro.dados = j;
        throw erro;
      }

      return j;
    }

    function iniciais(nome){
      return String(nome || "?")
        .trim()
        .split(/\s+/)
        .slice(0,2)
        .map(x => x[0] || "")
        .join("")
        .toUpperCase();
    }

    function mostrarToast(msg){
      const el = document.getElementById("toastAtendimento");
      if(!el) return;
      el.textContent = msg;
      el.classList.add("ativo");
      clearTimeout(mostrarToast.timer);
      mostrarToast.timer = setTimeout(()=>el.classList.remove("ativo"),2200);
    }

    async function executarBotao(btn, texto, fn){
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

    function formatarDataHora(v){
      if(!v) return "-";
      return new Date(v).toLocaleString("pt-BR",{
        day:"2-digit",
        month:"2-digit",
        hour:"2-digit",
        minute:"2-digit"
      });
    }

    function mostrarCentralBloqueada(dados={}){
      AT_CENTRAL_ATIVA = false;
      pararHeartbeat();

      const central = dados.central || {};
      const gerente = central.gerente_nome || "outro gerente";
      const empresa = central.empresa || AT_EMPRESA || "--";

      const box = document.getElementById("centralBloqueada");
      const app = document.getElementById("appAtendimento");

      if(app) app.style.display = "none";
      if(box) box.style.display = "grid";

      const titulo = document.getElementById("centralBloqueadaTitulo");
      const texto = document.getElementById("centralBloqueadaTexto");
      const detalhe = document.getElementById("centralBloqueadaDetalhe");

      if(titulo) titulo.textContent = `Central da Loja ${empresa} em uso`;

      if(texto){
        texto.textContent =
          `Esta Central já está sendo operada por ${gerente}. ` +
          `Para evitar conflitos, somente uma sessão pode operar a loja por vez.`;
      }

      if(detalhe){
        detalhe.textContent = central.iniciado_em
          ? `Iniciada em ${formatarDataHora(central.iniciado_em)}.`
          : "Aguarde a liberação da Central atual.";
      }
    }

    function mostrarCentralPerdeuControle(mensagem){
      AT_CENTRAL_ATIVA = false;
      pararHeartbeat();

      const app = document.getElementById("appAtendimento");
      const box = document.getElementById("centralBloqueada");

      if(app) app.style.display = "none";
      if(box) box.style.display = "grid";

      document.getElementById("centralBloqueadaTitulo").textContent =
        "Controle da Central encerrado";

      document.getElementById("centralBloqueadaTexto").textContent =
        mensagem ||
        "Esta janela não controla mais a Central de Atendimento desta loja.";

      document.getElementById("centralBloqueadaDetalhe").textContent =
        "Volte ao JP Dashboard e abra novamente a Central.";
    }

    function iniciarHeartbeat(){
      pararHeartbeat();

      AT_HEARTBEAT_TIMER = setInterval(async ()=>{
        if(!AT_CENTRAL_ATIVA || !AT_CENTRAL_TOKEN) return;

        try{
          await api("/api/atendimento/central/heartbeat",{
            method:"POST",
            body:JSON.stringify({})
          });
        }catch(e){
          console.error("Heartbeat da Central:",e);

          if(e.status === 409){
            sessionStorage.removeItem("jp_atendimento_central_token");
            AT_CENTRAL_TOKEN = "";
            mostrarCentralPerdeuControle(e.message);
          }
        }
      },30000);
    }

    function pararHeartbeat(){
      if(AT_HEARTBEAT_TIMER){
        clearInterval(AT_HEARTBEAT_TIMER);
        AT_HEARTBEAT_TIMER = null;
      }
    }

    async function encerrarCentral(btn){
      if(!AT_CENTRAL_ATIVA){
        window.location.href="/home.html";
        return;
      }

      if(!confirm(
        "Encerrar a Central de Atendimento desta loja? " +
        "Outro gerente poderá assumir a operação imediatamente."
      )) return;

      try{
        await executarBotao(btn,"Encerrando...",async ()=>{
          await api("/api/atendimento/central/encerrar",{
            method:"POST",
            body:JSON.stringify({})
          });

          AT_CENTRAL_ATIVA = false;
          pararHeartbeat();

          sessionStorage.removeItem("jp_atendimento_central_token");
          AT_CENTRAL_TOKEN = "";

          window.location.href="/home.html";
        });
      }catch(e){
        alert("Não foi possível encerrar a Central: " + e.message);
      }
    }

    async function iniciarCentral(){
      try{
        const j = await api("/api/atendimento/sessao");

        AT_GERENTE = j.gerente;
        AT_EMPRESA = j.gerente.empresa;
        AT_VENDEDORES = j.vendedores || [];

        if(j.central?.token){
          AT_CENTRAL_TOKEN = j.central.token;

          sessionStorage.setItem(
            "jp_atendimento_central_token",
            AT_CENTRAL_TOKEN
          );
        }

        AT_CENTRAL_ATIVA = true;

        document.getElementById("kpiLoja").textContent = AT_EMPRESA;
        document.getElementById("kpiGerente").textContent = AT_GERENTE.gerente_nome;
        document.getElementById("infoLoja").textContent =
          `Loja ${AT_EMPRESA} • ${AT_GERENTE.gerente_nome}`;

        const status = document.getElementById("statusCentral");
        if(status){
          status.innerHTML =
            "<span></span> Central ativa • " +
            AT_GERENTE.gerente_nome +
            " • Loja " +
            AT_EMPRESA;
        }

        document.getElementById("centralBloqueada").style.display = "none";
        document.getElementById("appAtendimento").style.display = "block";

        iniciarHeartbeat();
        await carregarTudo();

      }catch(e){
        console.error("Erro ao abrir Central de Atendimento:",e);

        if(e.status === 409 && e.codigo === "CENTRAL_OCUPADA"){
          mostrarCentralBloqueada(e.dados || {});
          return;
        }

        if(e.status === 409){
          mostrarCentralPerdeuControle(e.message);
          return;
        }

        document.getElementById("infoLoja").textContent =
          "Não foi possível abrir a Central de Atendimento.";

        document.getElementById("listaVendedores").innerHTML =
          `<div class="estado-vazio">⚠️ ${e.message}</div>`;

        document.getElementById("listaFila").innerHTML =
          `<div class="estado-vazio">Volte ao JP Dashboard e tente novamente.</div>`;
      }
    }

    async function carregarTudo(btn){
      return executarBotao(btn,"Atualizando...",async ()=>{
        await Promise.all([
          carregarPerguntas(),
          carregarFila()
        ]);
        renderVendedores();
      });
    }

    async function carregarPerguntas(){
      const j = await api("/api/atendimento/perguntas");
      AT_PERGUNTAS = j.perguntas || [];
    }

    async function carregarFila(){
      const j = await api("/api/atendimento/fila?empresa=" + encodeURIComponent(AT_EMPRESA));
      AT_FILA = j.fila || [];
      renderFila();
    }

    function avatarVendedor(codigo,nome){
      const vendedor = AT_VENDEDORES.find(
        v => String(v.codigo) === String(codigo)
      );

      const foto = String(vendedor?.foto || "").trim();

      if(foto){
        return `<div class="avatar avatar-foto" data-vendedor-nome="${String(nome || "Vendedor").replace(/"/g,"&quot;")}" title="Clique para ampliar">
          <img src="${foto}" alt="${String(nome || "Vendedor").replace(/"/g,"&quot;")}">
        </div>`;
      }

      return `<div class="avatar">${iniciais(nome)}</div>`;
    }


    // Clique/toque delegado: funciona mesmo quando os cards são recriados.
    document.addEventListener("click", e=>{
      const avatar = e.target.closest(".avatar-foto");
      if(!avatar) return;

      const img = avatar.querySelector("img");
      if(!img || !img.src) return;

      e.preventDefault();
      e.stopPropagation();

      abrirFotoVendedor(
        img.src,
        avatar.dataset.vendedorNome || img.alt || "Vendedor"
      );
    });

    function abrirFotoVendedor(src,nome){
      if(!src) return;

      let modal = document.getElementById("modalFotoVendedor");

      if(!modal){
        modal = document.createElement("div");
        modal.id = "modalFotoVendedor";
        modal.className = "modal-foto-vendedor";
        modal.innerHTML = `
          <div class="modal-foto-conteudo" onclick="event.stopPropagation()">
            <img id="modalFotoVendedorImg" alt="">
            <div id="modalFotoVendedorNome" class="modal-foto-nome"></div>
          </div>
        `;

        modal.addEventListener("click", fecharFotoVendedor);
        document.body.appendChild(modal);
      }

      const img = document.getElementById("modalFotoVendedorImg");
      const nomeEl = document.getElementById("modalFotoVendedorNome");

      img.src = src;
      img.alt = nome || "Vendedor";
      img.onclick = fecharFotoVendedor;

      nomeEl.textContent = nome || "";

      modal.classList.add("ativo");
      document.body.classList.add("foto-vendedor-aberta");
    }

    function fecharFotoVendedor(){
      const modal = document.getElementById("modalFotoVendedor");
      if(modal) modal.classList.remove("ativo");
      document.body.classList.remove("foto-vendedor-aberta");
    }

    document.addEventListener("keydown", e=>{
      if(e.key === "Escape") fecharFotoVendedor();
    });

    function renderVendedores(){
      const el = document.getElementById("listaVendedores");

      const ocupados = new Set(
        AT_FILA.map(x => String(x.vendedor_codigo))
      );

      const gerenteCodigo = String(AT_GERENTE?.gerente_codigo || "");

      const livres = AT_VENDEDORES.filter(v =>
        !ocupados.has(String(v.codigo)) &&
        String(v.codigo) !== gerenteCodigo
      );

      document.getElementById("contDisponiveis").textContent = livres.length;

      el.innerHTML = livres.map(v => `
        <div class="card-vendedor">
          <div class="card-linha">
            <div class="vendedor-identidade">
              ${avatarVendedor(v.codigo,v.nome)}
              <div>
                <b class="vendedor-nome">${v.nome}</b>
                <small class="vendedor-codigo">Código ${v.codigo}</small>
              </div>
            </div>
          </div>

          <div class="card-acoes">
            <button class="btn-principal"
              onclick="entrarFila('${v.codigo}','${String(v.nome).replace(/'/g,"\\'")}',this)">
              + Entrar na fila
            </button>
          </div>
        </div>
      `).join("") || `
        <div class="estado-vazio">
          Todos os vendedores já estão no fluxo de atendimento.
        </div>
      `;
    }

    function renderFila(){
      const fila = AT_FILA.filter(x => x.status === "ESPERANDO");
      const emAtendimento = AT_FILA.filter(x => x.status === "EM_ATENDIMENTO" || x.status === "POS_ATENDIMENTO");

      document.getElementById("kpiFila").textContent = fila.length;
      document.getElementById("kpiAtendendo").textContent = emAtendimento.length;
      document.getElementById("contFila").textContent = fila.length;
      document.getElementById("contPos").textContent = emAtendimento.length;

      document.getElementById("listaFila").innerHTML = fila.map((x,i) => `
        <div class="card-vendedor">
          <div class="card-linha">
            <div class="vendedor-identidade">
              <div class="posicao">${i+1}º</div>
              ${avatarVendedor(x.vendedor_codigo,x.vendedor_nome)}
              <div>
                <b class="vendedor-nome">${x.vendedor_nome}</b>
                <small class="vendedor-codigo">Aguardando atendimento</small>
              </div>
            </div>
          </div>

          <div class="tempo-info">⏱ Entrou na fila às ${formatarHora(x.entrou_em)}</div>

          <div class="card-acoes">
            <button class="btn-iniciar" onclick="iniciarAtendimento(${x.id},this)">
              Iniciar atendimento
            </button>
            <button class="btn-pequeno danger" onclick="sairDaFila(${x.id},this)">
              Sair
            </button>
          </div>
        </div>
      `).join("") || `
        <div class="estado-vazio">
          <div>Fila vazia.<br><small>Adicione um vendedor disponível.</small></div>
        </div>
      `;

      document.getElementById("listaPos").innerHTML = emAtendimento.map(x => `
        <div class="card-vendedor">
          <div class="card-linha">
            <div class="vendedor-identidade">
              ${avatarVendedor(x.vendedor_codigo,x.vendedor_nome)}
              <div>
                <b class="vendedor-nome">${x.vendedor_nome}</b>
                <small class="vendedor-codigo">Cliente em atendimento</small>
              </div>
            </div>
          </div>

          <div class="tempo-info">Ao concluir, registre o resultado. O vendedor voltará automaticamente ao final da fila.</div>

          <div class="card-acoes">
            <button class="btn-responder"
              onclick="abrirFinalizar(${x.id},${x.atendimento_id || "null"},'${x.vendedor_codigo}','${String(x.vendedor_nome).replace(/'/g,"\\'")}')">
              Registrar resultado
            </button>
          </div>
        </div>
      `).join("") || `
        <div class="estado-vazio">
          Nenhum vendedor em atendimento neste momento.
        </div>
      `;

      renderVendedores();
    }

    async function entrarFila(codigo,nome,btn){
      if(AT_BLOQUEANDO_FILA) return;
      AT_BLOQUEANDO_FILA = true;

      try{
        await executarBotao(btn,"Entrando...",async ()=>{
          await api("/api/atendimento/entrar-fila", {
            method:"POST",
            body:JSON.stringify({
              empresa:AT_EMPRESA,
              vendedor_codigo:codigo,
              vendedor_nome:nome
            })
          });
          await carregarTudo();
          mostrarToast(`${nome} entrou na fila.`);
        });
      }catch(e){
        alert("Erro ao entrar na fila: " + e.message);
      }finally{
        AT_BLOQUEANDO_FILA = false;
      }
    }

    async function sairDaFila(filaId,btn){
      if(!confirm("Deseja remover este vendedor da fila?")) return;

      try{
        await executarBotao(btn,"Saindo...",async ()=>{
          await api("/api/atendimento/sair-fila", {
            method:"POST",
            body:JSON.stringify({ fila_id:filaId })
          });
          await carregarTudo();
          mostrarToast("Vendedor removido da fila.");
        });
      }catch(e){
        alert("Erro: " + e.message);
      }
    }

    async function iniciarAtendimento(filaId,btn){
      try{
        await executarBotao(btn,"Iniciando...",async ()=>{
          const j = await api("/api/atendimento/iniciar", {
            method:"POST",
            body:JSON.stringify({ fila_id:filaId })
          });

          if(j.atendimento){
            AT_ATENDIMENTOS_ABERTOS[String(filaId)] = j.atendimento;
          }

          await carregarTudo();
          mostrarToast("Atendimento iniciado.");
        });
      }catch(e){
        alert("Erro ao iniciar atendimento: " + e.message);
      }
    }

    function abrirFinalizar(filaId, atendimentoId, vendedorCodigo, vendedorNome){
      AT_ATENDIMENTO_ATUAL = {
        fila_id:filaId,
        atendimento_id:atendimentoId,
        vendedor_codigo:vendedorCodigo,
        vendedor_nome:vendedorNome
      };

      if(!AT_ATENDIMENTO_ATUAL.atendimento_id){
        alert("Não encontrei o ID do atendimento. Inicie novamente o atendimento.");
        return;
      }

      document.getElementById("modalVendedorNome").textContent =
        vendedorNome + " • escolha o resultado do atendimento.";

      const form = document.getElementById("formRespostas");

      form.innerHTML = AT_PERGUNTAS.map(p => `
        <div class="campo-resposta">
          ${campoPergunta(p)}
        </div>
      `).join("") || `
        <div class="estado-vazio">Nenhum motivo de atendimento cadastrado.</div>
      `;

      const acoes = document.querySelector("#modalFinalizar .acoes");
        if(acoes){
          acoes.innerHTML = `
            <button onclick="fecharModal()" class="btn-neutro">
              Cancelar
            </button>
          `;
        }

        document.getElementById("modalFinalizar").style.display = "flex";
    }

    function campoPergunta(p){
      const titulo = String(p.pergunta || "").trim();

      if(
        p.tipo_resposta === "BOTAO_SUGESTAO" ||
        p.tipo_resposta === "SUGESTAO" ||
        p.tipo_resposta === "TEXTO_LIVRE" ||
        p.tipo_resposta === "BOTAO_TEXTO"
      ){
        return `
          <div class="bloco-botao-sugestao">
            <button
              type="button"
              class="btn-motivo"
              data-pergunta="${p.id}"
              data-tipo="SUGESTAO"
              data-valor=""
              data-opcao=""
              onclick="abrirSugestaoMotivo(this)">
              ${titulo}
            </button>

            <div class="sugestao-motivo" style="display:none;">
              <textarea
                class="sugestao-motivo-texto"
                rows="3"
                maxlength="250"
                placeholder="Digite aqui a informação específica..."
              ></textarea>

              <button
                type="button"
                class="btn-confirmar-sugestao"
                onclick="confirmarSugestaoMotivo(this)">
                Registrar
              </button>
            </div>
          </div>
        `;
      }

      if(p.tipo_resposta === "BOTAO_LISTA" || p.tipo_resposta === "LISTA"){
        const ops = String(p.opcoes || "").split(";").filter(Boolean);

        return `
          <div class="bloco-botao-lista">
            <button
              type="button"
              class="btn-motivo"
              data-pergunta="${p.id}"
              data-tipo="LISTA"
              data-valor=""
              data-opcao=""
              onclick="abrirListaMotivo(this)">
              ${titulo}
            </button>

            <div class="opcoes-motivo" style="display:none;">
              ${ops.map(o => `
                <button
                  type="button"
                  class="btn-submotivo"
                  onclick="marcarSubMotivo(this,'${String(o).replace(/'/g,"\\'")}')">
                  ${o}
                </button>
              `).join("")}
            </div>
          </div>
        `;
      }

      return `
        <button
          type="button"
          class="btn-motivo"
          data-pergunta="${p.id}"
          data-tipo="UNICO"
          data-valor=""
          data-opcao=""
          onclick="marcarMotivoUnico(this,'${titulo.replace(/'/g,"\\'")}')">
          ${titulo}
        </button>
      `;
    }

    function abrirSugestaoMotivo(btn){
      document.querySelectorAll(".opcoes-motivo").forEach(box=>{
        box.style.display = "none";
      });

      document.querySelectorAll(".sugestao-motivo").forEach(box=>{
        if(box !== btn.parentElement.querySelector(".sugestao-motivo")){
          box.style.display = "none";
        }
      });

      const box =
        btn.parentElement.querySelector(".sugestao-motivo");

      if(!box) return;

      const abrindo =
        box.style.display === "none" ||
        !box.style.display;

      box.style.display = abrindo ? "grid" : "none";

      if(abrindo){
        setTimeout(()=>{
          box.querySelector(".sugestao-motivo-texto")?.focus();
        },20);
      }
    }

    async function confirmarSugestaoMotivo(btn){
      const bloco =
        btn.closest(".bloco-botao-sugestao");

      const principal =
        bloco?.querySelector(".btn-motivo");

      const campo =
        bloco?.querySelector(".sugestao-motivo-texto");

      const texto =
        String(campo?.value || "").trim();

      if(!principal || !texto){
        alert("Digite a informação antes de registrar.");
        campo?.focus();
        return;
      }

      document
        .querySelectorAll(".btn-motivo[data-pergunta]")
        .forEach(b=>{
          b.dataset.valor = "";
          b.dataset.opcao = "";
          b.classList.remove("selecionado");
        });

      document
        .querySelectorAll(".btn-submotivo")
        .forEach(b=>b.classList.remove("selecionado"));

      principal.dataset.valor =
        principal.textContent.trim();

      principal.dataset.opcao = texto;
      principal.classList.add("selecionado");

      await finalizarAtendimento(btn);
    }

    async function marcarMotivoUnico(btn,valor){
      document.querySelectorAll(".btn-motivo[data-pergunta]").forEach(b=>{
        b.dataset.valor = "";
        b.dataset.opcao = "";
        b.classList.remove("selecionado");
      });

      btn.dataset.valor = valor;
      btn.classList.add("selecionado");

      await finalizarAtendimento(btn);
    }

    function abrirListaMotivo(btn){
      document.querySelectorAll(".opcoes-motivo").forEach(box=>{
        if(box !== btn.parentElement.querySelector(".opcoes-motivo")){
          box.style.display = "none";
        }
      });

      const box = btn.parentElement.querySelector(".opcoes-motivo");
      if(!box) return;
      box.style.display = box.style.display === "none" ? "grid" : "none";
    }

    async function marcarSubMotivo(btn,opcao){
      const bloco = btn.closest(".bloco-botao-lista");
      const principal = bloco.querySelector(".btn-motivo");

      document.querySelectorAll(".btn-motivo[data-pergunta]").forEach(b=>{
        b.dataset.valor = "";
        b.dataset.opcao = "";
        b.classList.remove("selecionado");
      });

      document.querySelectorAll(".btn-submotivo").forEach(b=>{
        b.classList.remove("selecionado");
      });

      btn.classList.add("selecionado");
      principal.dataset.valor = principal.textContent.trim();
      principal.dataset.opcao = opcao;
      principal.classList.add("selecionado");

      await finalizarAtendimento(btn);
    }

    async function finalizarAtendimento(btnOrigem){
      const campos = document.querySelectorAll(".btn-motivo[data-pergunta]");

      const respostas = Array.from(campos)
        .filter(c => String(c.dataset.valor || "").trim())
        .map(c => ({
          pergunta_id:Number(c.dataset.pergunta),
          resposta:c.dataset.opcao
            ? `${c.dataset.valor} | ${c.dataset.opcao}`
            : c.dataset.valor
        }));

      if(!respostas.length){
        alert("Escolha o resultado do atendimento.");
        return;
      }

      const botoesMotivo = document.querySelectorAll(
        "#modalFinalizar .btn-motivo, #modalFinalizar .btn-submotivo, #modalFinalizar .btn-confirmar-sugestao"
      );

      botoesMotivo.forEach(b=>b.disabled=true);

      const textoOriginal = btnOrigem?.textContent || "";
      if(btnOrigem) btnOrigem.textContent = "Registrando...";

      try{
        await api("/api/atendimento/finalizar", {
          method:"POST",
          body:JSON.stringify({
            atendimento_id:AT_ATENDIMENTO_ATUAL.atendimento_id,
            empresa:AT_EMPRESA,
            vendedor_codigo:AT_ATENDIMENTO_ATUAL.vendedor_codigo,
            vendedor_nome:AT_ATENDIMENTO_ATUAL.vendedor_nome,
            respostas
          })
        });

        const nome = AT_ATENDIMENTO_ATUAL.vendedor_nome;

        fecharModal();
        await carregarTudo();

        mostrarToast(
          `${nome}: resultado registrado e vendedor voltou ao final da fila.`
        );

      }catch(e){
        alert("Erro ao finalizar: " + e.message);
        botoesMotivo.forEach(b=>b.disabled=false);
        if(btnOrigem) btnOrigem.textContent = textoOriginal;
      }
    }

    function fecharModal(){
      document.getElementById("modalFinalizar").style.display = "none";
      AT_ATENDIMENTO_ATUAL = null;
    }

    function formatarHora(v){
      if(!v) return "-";
      return new Date(v).toLocaleTimeString("pt-BR",{
        hour:"2-digit",
        minute:"2-digit"
      });
    }

    function ajustarRotulosFluxo(){
      const listaEm = document.getElementById("listaPos");

      if(listaEm){
        const coluna = listaEm.closest(".coluna");
        if(coluna){
          const tag = coluna.querySelector(".coluna-tag");
          const h2 = coluna.querySelector("h2");
          const p = coluna.querySelector("p");
          if(tag) tag.textContent = "ATENDIMENTO ATUAL";
          if(h2) h2.textContent = "Em atendimento";
          if(p) p.textContent = "Vendedores atendendo clientes neste momento.";
        }
      }

      const kpi = document.getElementById("kpiAtendendo");
      if(kpi){
        const bloco = kpi.closest(".kpi");
        if(bloco){
          const span = bloco.querySelector("span");
          if(span) span.textContent = "Em atendimento";
        }
      }
    }

    document.addEventListener("DOMContentLoaded", ()=>{
      ajustarRotulosFluxo();
      iniciarCentral();
    });
    window.addEventListener("pagehide", pararHeartbeat);
