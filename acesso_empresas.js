"use strict";

function normalizarEmpresa(valor) {
  const numeros = String(valor || "").replace(/\D/g, "");
  if (!numeros) return "";
  return numeros.slice(-2).padStart(2, "0");
}

function extrairEmpresas(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return [];

  const codigos = new Set();

  // Prioriza blocos numéricos isolados de 1 ou 2 dígitos.
  for (const achado of texto.matchAll(/(?:^|[^0-9])([0-9]{1,2})(?=[^0-9]|$)/g)) {
    const codigo = normalizarEmpresa(achado[1]);
    if (codigo) codigos.add(codigo);
  }

  // Compatibilidade com listas como 010233.
  if (!codigos.size && /^\d+$/.test(texto) && texto.length % 2 === 0) {
    for (let i = 0; i < texto.length; i += 2) {
      codigos.add(texto.slice(i, i + 2));
    }
  }

  return [...codigos].sort();
}

function empresasDaRequisicao(req) {
  const usuario = req?.usuarioSeta || {};

  const sessaoTemRegraEmpresas =
    typeof usuario.todasEmpresas === "boolean" &&
    Array.isArray(usuario.empresasAcesso);

  return {
    sessaoTemRegraEmpresas,
    todas: usuario.todasEmpresas === true,
    empresas: Array.isArray(usuario.empresasAcesso)
      ? [...new Set(
          usuario.empresasAcesso
            .map(normalizarEmpresa)
            .filter(Boolean)
        )].sort()
      : []
  };
}

function empresaPermitida(req, empresa) {
  const acesso = empresasDaRequisicao(req);
  if (acesso.todas) return true;
  const codigo = normalizarEmpresa(empresa);
  return Boolean(codigo && acesso.empresas.includes(codigo));
}

function restringirListaEmpresas(req, valores) {
  const acesso = empresasDaRequisicao(req);
  const solicitadas = Array.isArray(valores)
    ? valores
    : String(valores || "").split(/[;,|]+/);

  const normalizadas = [...new Set(
    solicitadas.map(normalizarEmpresa).filter(Boolean)
  )];

  if (acesso.todas) return normalizadas;
  if (!normalizadas.length) return [...acesso.empresas];

  return normalizadas.filter(codigo => acesso.empresas.includes(codigo));
}

function coletarEmpresasExplicitas(req) {
  const fontes = [
    req?.query?.empresa,
    req?.query?.empresas,
    req?.query?.filial,
    req?.query?.filiais,
    req?.query?.filial_giro,
    req?.query?.filiais_estoque,
    req?.body?.empresa,
    req?.body?.empresas,
    req?.body?.filial,
    req?.body?.filiais,
    req?.body?.filial_giro,
    req?.body?.filiais_estoque
  ];

  return [...new Set(
    fontes
      .flatMap(valor => Array.isArray(valor) ? valor : String(valor || "").split(/[;,|]+/))
      .map(normalizarEmpresa)
      .filter(Boolean)
  )];
}

function criarMiddlewareEmpresas() {
  return function middlewareEmpresas(req, res, next) {
    if (!req.usuarioSeta) return next();

    const acesso = empresasDaRequisicao(req);

    // Bloqueia tokens antigos, criados antes da inclusão da regra de empresas.
    // Isso impede que uma sessão antiga seja interpretada como acesso total.
    if (!acesso.sessaoTemRegraEmpresas) {
      return res.status(401).json({
        ok: false,
        erro: "Sua sessão precisa ser atualizada. Saia do sistema e faça login novamente."
      });
    }

    req.acessoEmpresas = acesso;
    req.empresasPermitidas = acesso.todas ? [] : [...acesso.empresas];

    if (acesso.todas) return next();

    // Campo preenchido deve produzir pelo menos uma empresa válida.
    // Caso contrário, nega o acesso em vez de liberar tudo por engano.
    if (!acesso.empresas.length) {
      return res.status(403).json({
        ok: false,
        erro: "Nenhuma empresa válida foi identificada no campo Empresas de Acesso do Seta."
      });
    }

    const solicitadas = coletarEmpresasExplicitas(req);
    const proibidas = solicitadas.filter(codigo => !acesso.empresas.includes(codigo));

    if (proibidas.length) {
      return res.status(403).json({
        ok: false,
        erro: `Usuário sem acesso à(s) empresa(s): ${proibidas.join(", ")}.`,
        empresasPermitidas: acesso.empresas
      });
    }

    // Muitas rotas do projeto já utilizam req.query.empresa.
    // Quando o filtro não é informado, injeta automaticamente a lista permitida.
    if (req.path.startsWith("/api/") && !req.query?.empresa) {
      req.query.empresa = acesso.empresas.join(",");
    }

    return next();
  };
}

module.exports = {
  normalizarEmpresa,
  extrairEmpresas,
  empresasDaRequisicao,
  empresaPermitida,
  restringirListaEmpresas,
  criarMiddlewareEmpresas
};
