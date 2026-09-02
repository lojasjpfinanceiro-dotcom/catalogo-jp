"use strict";

/*
 * Cadastro central dos módulos do JP Sistema.
 * As permissões dos grupos NÃO ficam fixas neste arquivo.
 * Elas são gravadas em public.jp_grupos_modulos no banco auxiliar.
 */

const MODULOS = Object.freeze([
  { codigo:"catalogo", nome:"Catálogo", grupoMenu:"LOGÍSTICA", rota:"/index.html", ordem:10 },
  { codigo:"otb", nome:"OTB", grupoMenu:"LOGÍSTICA", rota:"/otb.html", ordem:20 },
  { codigo:"otb-bi", nome:"OTB-BI", grupoMenu:"LOGÍSTICA", rota:"/otb-bi.html", ordem:30 },
  { codigo:"giro", nome:"Giro", grupoMenu:"LOGÍSTICA", rota:"/giro.html", ordem:40 },
  { codigo:"transferencia-inteligente", nome:"Transferência Inteligente", grupoMenu:"LOGÍSTICA", rota:"/transferencia-inteligente.html", ordem:50 },
  { codigo:"inventario-vitrine", nome:"Inventário de Vitrine", grupoMenu:"LOGÍSTICA", rota:"/index.html#inventario-vitrine", ordem:60 },

  { codigo:"catalogo-cliente", nome:"Catálogo Cliente", grupoMenu:"COMERCIAL", rota:"/catalogo_cliente.html", ordem:100 },
  { codigo:"crm-relacionamento", nome:"Central de Relacionamento", grupoMenu:"COMERCIAL", rota:"/crm-relacionamento.html", ordem:110 },
  { codigo:"atendimento", nome:"Atendimento", grupoMenu:"COMERCIAL", rota:"/atendimento.html", ordem:120 },
  { codigo:"atendimento-gerencial", nome:"Atendimento Gerencial", grupoMenu:"COMERCIAL", rota:"/atendimento-admin.html", ordem:130 },
  { codigo:"metas", nome:"Metas", grupoMenu:"COMERCIAL", rota:"/metas.html", ordem:140 },
  { codigo:"relatorios-ia", nome:"Relatórios Inteligentes IA", grupoMenu:"COMERCIAL", rota:"/relatorios-ia.html", ordem:150 },

  { codigo:"financeiro", nome:"Financeiro", grupoMenu:"FINANCEIRO", rota:"/financeiro.html", ordem:200 },

  { codigo:"permissoes", nome:"Permissões de Acesso", grupoMenu:"CONFIGURAÇÕES", rota:"/permissoes.html", ordem:900 }
]);

const TODOS_OS_MODULOS = Object.freeze(MODULOS.map(m => m.codigo));

function normalizarGrupo(grupo) {
  return String(grupo || "").trim().padStart(2, "0").slice(-2);
}

/*
 * IMPORTANTE:
 * As regras mais específicas precisam ficar ANTES das genéricas.
 * Principalmente Atendimento Gerencial, porque /api/atendimento/*
 * também é utilizado pelo atendimento normal.
 */
const REGRAS_DE_ROTA = Object.freeze([
  { modulo:"permissoes", teste:/^\/(?:permissoes(?:\.html)?|api\/permissoes)(?:\/|$)/i },

  { modulo:"otb-bi", teste:/^\/(?:logistica\/)?otb-bi(?:\.html)?(?:\/|$)/i },
  { modulo:"otb-bi", teste:/^\/api\/otb-bi(?:\/|$)/i },
  { modulo:"otb", teste:/^\/(?:logistica\/)?otb(?:\.html)?(?:\/|$)/i },
  { modulo:"otb", teste:/^\/api\/otb(?:\/|$)/i },
  { modulo:"giro", teste:/^\/(?:logistica\/)?giro(?:\.html)?(?:\/|$)/i },
  { modulo:"giro", teste:/^\/api\/giro(?:\/|$)/i },
  { modulo:"transferencia-inteligente", teste:/^\/(?:logistica\/)?(?:transferencia-inteligente|transf-intel)(?:\.html)?(?:\/|$)/i },
  { modulo:"transferencia-inteligente", teste:/^\/api\/transferencia-inteligente(?:\/|$)/i },
  { modulo:"inventario-vitrine", teste:/^\/(?:logistica\/)?inventario-vitrine(?:\.html)?(?:\/|$)/i },
  { modulo:"inventario-vitrine", teste:/^\/api\/inventario(?:\/|$)/i },

  { modulo:"catalogo-cliente", teste:/^\/(?:comercial\/)?catalogo-cliente(?:\.html)?(?:\/|$)/i },
  { modulo:"catalogo-cliente", teste:/^\/catalogo_cliente\.html$/i },
  { modulo:"crm-relacionamento", teste:/^\/(?:comercial\/)?crm-relacionamento(?:\.html)?(?:\/|$)/i },
  { modulo:"crm-relacionamento", teste:/^\/api\/crm(?:\/|$)/i },

  // ----------------------------------------------------------
  // ATENDIMENTO GERENCIAL - SEMPRE ANTES DE ATENDIMENTO NORMAL
  // ----------------------------------------------------------
  { modulo:"atendimento-gerencial", teste:/^\/(?:comercial\/)?atendimento-gerencial(?:\.html)?(?:\/|$)/i },
  { modulo:"atendimento-gerencial", teste:/^\/atendimento-admin\.html$/i },

  // APIs exclusivas da tela gerencial.
  { modulo:"atendimento-gerencial", teste:/^\/api\/atendimento\/dashboard(?:\/|$)/i },
  { modulo:"atendimento-gerencial", teste:/^\/api\/atendimento\/dashboard-lojas(?:\/|$)/i },
  { modulo:"atendimento-gerencial", teste:/^\/api\/atendimento\/relatorio-gerencial(?:\/|$)/i },
  { modulo:"atendimento-gerencial", teste:/^\/api\/atendimento\/reset-dia(?:\/|$)/i },
  { modulo:"atendimento-gerencial", teste:/^\/api\/atendimento\/diagnostico-fila(?:\/|$)/i },

  // Atendimento operacional.
  { modulo:"atendimento", teste:/^\/(?:comercial\/)?atendimento(?:\.html)?(?:\/|$)/i },
  { modulo:"atendimento", teste:/^\/api\/atendimento(?:\/|$)/i },

  { modulo:"metas", teste:/^\/(?:comercial\/)?metas(?:\.html)?(?:\/|$)/i },
  { modulo:"metas", teste:/^\/api\/metas(?:\/|$)/i },
  { modulo:"relatorios-ia", teste:/^\/(?:comercial\/)?relatorios-ia(?:\.html)?(?:\/|$)/i },
  { modulo:"relatorios-ia", teste:/^\/api\/relatorios-ia(?:\/|$)/i },

  { modulo:"financeiro", teste:/^\/financeiro(?:\.html)?(?:\/|$)/i },
  { modulo:"financeiro", teste:/^\/api\/(?:financeiro|conciliacao|conciliacao-bancaria)(?:\/|$)/i },

  { modulo:"catalogo", teste:/^\/(?:logistica\/)?catalogo(?:\/|$)/i },
  { modulo:"catalogo", teste:/^\/index(?:_dark)?\.html$/i },
  { modulo:"catalogo", teste:/^\/api\/(?:produtos|filtros|empresas)(?:\/|$)/i }
]);

function moduloDaRota(caminho) {
  const path = String(caminho || "").split("?")[0];
  const regra = REGRAS_DE_ROTA.find(item => item.teste.test(path));
  return regra ? regra.modulo : "";
}

module.exports = {
  MODULOS,
  TODOS_OS_MODULOS,
  normalizarGrupo,
  moduloDaRota
};
