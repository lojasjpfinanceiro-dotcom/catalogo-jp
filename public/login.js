(() => {
  "use strict";

  const form = document.getElementById("formLogin");
  const usuario = document.getElementById("usuario");
  const senha = document.getElementById("senha");
  const mensagem = document.getElementById("mensagem");
  const entrar = document.getElementById("entrar");
  const mostrarSenha = document.getElementById("mostrarSenha");

  const params = new URLSearchParams(location.search);
  const destinoInformado = params.get("destino") || "/home.html";
  const destino = destinoInformado.startsWith("/") && !destinoInformado.startsWith("//")
    ? destinoInformado
    : "/home.html";

  mostrarSenha.addEventListener("click", () => {
    const visivel = senha.type === "text";
    senha.type = visivel ? "password" : "text";
    mostrarSenha.textContent = visivel ? "Mostrar" : "Ocultar";
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagem.textContent = "";

    const dados = {
      usuario: usuario.value.trim(),
      senha: senha.value
    };

    if (!dados.usuario || !dados.senha) {
      mensagem.textContent = "Informe usuário e senha.";
      return;
    }

    entrar.disabled = true;
    entrar.textContent = "Validando no Seta...";

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
      });

      const retorno = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(retorno.erro || "Não foi possível entrar.");

      location.replace(destino);
    } catch (erro) {
      mensagem.textContent = erro.message || "Erro ao validar o login.";
      senha.select();
    } finally {
      entrar.disabled = false;
      entrar.textContent = "Entrar no sistema";
    }
  });

  fetch("/api/auth/me")
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d?.ok) location.replace(destino); })
    .catch(() => {});
})();
