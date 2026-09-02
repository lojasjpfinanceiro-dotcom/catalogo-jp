"use strict";

/**
 * Importador exclusivo do Banco Itaú em XLSX.
 *
 * Formato esperado no extrato:
 * Data | Lançamento | Razão Social | CPF/CNPJ | Valor (R$) | Saldo (R$)
 *
 * Este módulo:
 * - identifica automaticamente agência e conta;
 * - encontra o cabeçalho mesmo que ele mude de linha;
 * - percorre a planilha inteira até o final;
 * - ignora somente linhas de saldo e linhas sem valor de movimentação;
 * - retorna créditos e débitos com valor positivo e tipo C/D.
 */

function texto(valor) {
  return String(valor ?? "").trim();
}

function semAcentos(valor) {
  return texto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function chave(valor) {
  return semAcentos(valor)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function numero(valor) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : null;
  }

  let s = texto(valor);
  if (!s) return null;

  s = s
    .replace(/R\$/gi, "")
    .replace(/\s+/g, "")
    .replace(/[()]/g, "");

  // Formato brasileiro: 1.234,56
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }

  s = s.replace(/[^0-9+\-.]/g, "");
  if (!s || s === "-" || s === "+" || s === ".") return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function dataIso(valor, XLSX) {
  // O Itaú exporta normalmente a data como texto dd/mm/aaaa.
  // Priorizar o texto evita conversões indevidas do Excel/SheetJS.
  const s = texto(valor);

  let m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if (m) {
    const dia = String(Number(m[1])).padStart(2, "0");
    const mes = String(Number(m[2])).padStart(2, "0");
    const ano = String(Number(m[3])).padStart(4, "0");
    return `${ano}-${mes}-${dia}`;
  }

  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return `${String(Number(m[1])).padStart(4, "0")}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[3])).padStart(2, "0")}`;
  }

  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const ano = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const dia = String(valor.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  if (typeof valor === "number" && Number.isFinite(valor)) {
    const d = XLSX?.SSF?.parse_date_code?.(valor);
    if (d?.y && d?.m && d?.d) {
      return `${String(d.y).padStart(4, "0")}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }

  return "";
}

function ehLinhaDeSaldo(historico) {
  const s = semAcentos(historico).toUpperCase().replace(/\s+/g, " ").trim();
  if (!s) return true;

  return (
    s.startsWith("SALDO ANTERIOR") ||
    s.startsWith("SALDO TOTAL DISPONIVEL DIA") ||
    s.startsWith("SALDO TOTAL DISPONIVEL") ||
    s.startsWith("SALDO DISPONIVEL") ||
    s.startsWith("SALDO DO DIA") ||
    s.startsWith("SALDO FINAL") ||
    s.startsWith("SALDO BLOQUEADO")
  );
}

function localizarCabecalho(linhas) {
  for (let i = 0; i < linhas.length; i += 1) {
    const linha = Array.isArray(linhas[i]) ? linhas[i] : [];
    const cols = linha.map(chave);

    const pos = {
      data: cols.findIndex(v => v === "data"),
      lancamento: cols.findIndex(v => v === "lancamento"),
      razaoSocial: cols.findIndex(v => v === "razaosocial"),
      cpfCnpj: cols.findIndex(v => v === "cpfcnpj"),
      valor: cols.findIndex(v => v === "valor" || v === "valorr" || v === "valorrs" || v.startsWith("valor")),
      saldo: cols.findIndex(v => v === "saldo" || v === "saldor" || v === "saldors" || v.startsWith("saldo"))
    };

    if (pos.data >= 0 && pos.lancamento >= 0 && pos.valor >= 0) {
      return { linha: i, pos };
    }
  }

  return null;
}


function anoEsperadoDoPeriodo(periodo) {
  const anos = String(periodo || "").match(/\b(20\d{2})\b/g) || [];
  if (!anos.length) return null;
  const distintos = [...new Set(anos.map(Number).filter(Number.isFinite))];
  return distintos.length === 1 ? distintos[0] : distintos[0];
}

function corrigirAnoPeloPeriodo(dataIsoValor, periodo) {
  const data = String(dataIsoValor || "");
  const m = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return data;

  const anoAtual = Number(m[1]);
  const anoEsperado = anoEsperadoDoPeriodo(periodo);

  if (!anoEsperado) return data;

  // Proteção contra datas antigas geradas por conversão incorreta do Excel.
  if (anoAtual < 2020 || Math.abs(anoAtual - anoEsperado) > 1) {
    return `${anoEsperado}-${m[2]}-${m[3]}`;
  }

  return data;
}

function extrairMetadados(linhas, ateLinha) {
  const metadata = {
    banco: "ITAU",
    nome: "",
    agencia: "",
    conta: "",
    periodo: ""
  };

  for (let i = 0; i < ateLinha; i += 1) {
    const linha = Array.isArray(linhas[i]) ? linhas[i] : [];

    for (let c = 0; c < linha.length; c += 1) {
      const rotulo = chave(linha[c]);
      const valorDireita = texto(linha[c + 1]);

      if (rotulo === "nome" && valorDireita) metadata.nome = valorDireita;
      if (rotulo === "agencia" && valorDireita) {
        metadata.agencia = valorDireita.replace(/\D/g, "").padStart(4, "0");
      }
      if (rotulo === "conta" && valorDireita) metadata.conta = valorDireita;
      if (rotulo === "periodo" && valorDireita) metadata.periodo = valorDireita;
    }
  }

  return metadata;
}


/**
 * Alguns XLSX exportados pelo Itaú possuem a propriedade !ref incorreta
 * (por exemplo A1:F13), apesar de existirem células até a linha 75 ou mais.
 * O SheetJS usa !ref para decidir até onde converter a planilha. Esta função
 * recalcula o intervalo real usando todas as células efetivamente carregadas.
 */
function corrigirIntervaloRealDaPlanilha(sheet, XLSX) {
  if (!sheet || !XLSX?.utils?.decode_cell || !XLSX?.utils?.encode_range) return;

  let minR = Infinity;
  let minC = Infinity;
  let maxR = -1;
  let maxC = -1;

  for (const endereco of Object.keys(sheet)) {
    if (!endereco || endereco.startsWith("!")) continue;

    let celula;
    try {
      celula = XLSX.utils.decode_cell(endereco);
    } catch (_) {
      continue;
    }

    if (!Number.isFinite(celula.r) || !Number.isFinite(celula.c)) continue;
    minR = Math.min(minR, celula.r);
    minC = Math.min(minC, celula.c);
    maxR = Math.max(maxR, celula.r);
    maxC = Math.max(maxC, celula.c);
  }

  if (maxR >= 0 && maxC >= 0) {
    sheet["!ref"] = XLSX.utils.encode_range({
      s: { r: minR === Infinity ? 0 : minR, c: minC === Infinity ? 0 : minC },
      e: { r: maxR, c: maxC }
    });
  }
}

function lerExtratoItauXlsx(buffer) {
  let XLSX;
  try {
    XLSX = require("xlsx");
  } catch (_) {
    throw new Error("Biblioteca XLSX não instalada. Execute na pasta do projeto: npm install xlsx");
  }

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Arquivo XLSX do Itaú vazio ou inválido.");
  }

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: true,
    dense: false
  });

  const movimentos = [];
  const diagnostico = {
    abasLidas: 0,
    linhasAposCabecalho: 0,
    linhasSaldoIgnoradas: 0,
    linhasSemDataIgnoradas: 0,
    linhasSemValorIgnoradas: 0,
    linhasValidas: 0
  };

  let metadataFinal = null;

  for (const nomeAba of workbook.SheetNames || []) {
    const sheet = workbook.Sheets[nomeAba];
    if (!sheet) continue;

    // Corrige o limite falso gravado pelo próprio XLSX do Itaú.
    corrigirIntervaloRealDaPlanilha(sheet, XLSX);

    const linhas = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: true,
      defval: "",
      blankrows: true
    });

    const cabecalho = localizarCabecalho(linhas);
    if (!cabecalho) continue;

    diagnostico.abasLidas += 1;

    const metadata = extrairMetadados(linhas, cabecalho.linha);
    if (!metadataFinal) metadataFinal = metadata;

    const p = cabecalho.pos;

    // IMPORTANTE: percorre TODAS as linhas; não usa break em nenhuma linha vazia.
    for (let i = cabecalho.linha + 1; i < linhas.length; i += 1) {
      diagnostico.linhasAposCabecalho += 1;

      const linha = Array.isArray(linhas[i]) ? linhas[i] : [];
      const historicoBase = texto(linha[p.lancamento]);
      const dataOriginal = dataIso(linha[p.data], XLSX);
      const data = corrigirAnoPeloPeriodo(dataOriginal, metadata.periodo);

      if (ehLinhaDeSaldo(historicoBase)) {
        diagnostico.linhasSaldoIgnoradas += 1;
        continue;
      }

      if (!data) {
        diagnostico.linhasSemDataIgnoradas += 1;
        continue;
      }

      const valorOriginal = numero(linha[p.valor]);
      if (valorOriginal == null || valorOriginal === 0) {
        diagnostico.linhasSemValorIgnoradas += 1;
        continue;
      }

      const razaoSocial = p.razaoSocial >= 0 ? texto(linha[p.razaoSocial]) : "";
      const cpfCnpj = p.cpfCnpj >= 0 ? texto(linha[p.cpfCnpj]) : "";
      const saldo = p.saldo >= 0 ? numero(linha[p.saldo]) : null;
      const tipo = valorOriginal < 0 ? "D" : "C";

      const historico = [historicoBase, razaoSocial]
        .filter(Boolean)
        .filter((v, idx, arr) => arr.indexOf(v) === idx)
        .join(" - ");

      movimentos.push({
        data,
        documento: cpfCnpj,
        historico,
        valor: Math.abs(valorOriginal),
        tipo,
        saldo,
        fitid: "",
        razaoSocial,
        cpfCnpj,
        linhaPlanilha: i + 1,
        abaPlanilha: nomeAba
      });

      diagnostico.linhasValidas += 1;
    }
  }

  if (!metadataFinal) {
    throw new Error(
      "Layout do Itaú não reconhecido. Não encontrei o cabeçalho Data | Lançamento | Razão Social | CPF/CNPJ | Valor (R$) | Saldo (R$)."
    );
  }

  if (!metadataFinal.agencia || !metadataFinal.conta) {
    throw new Error("O XLSX foi lido, mas não foi possível identificar automaticamente a agência e a conta do Itaú.");
  }

  if (!movimentos.length) {
    throw new Error(
      `Nenhuma movimentação válida encontrada. Diagnóstico: ${JSON.stringify(diagnostico)}`
    );
  }

  // Log útil no terminal do Node para confirmar a leitura real.
  console.log("[ITAÚ XLSX]", {
    agencia: metadataFinal.agencia,
    conta: metadataFinal.conta,
    movimentos: movimentos.length,
    periodo: metadataFinal.periodo,
    anosEncontrados: [...new Set(movimentos.map(x => String(x.data || "").slice(0,4)))],
    diagnostico
  });

  return {
    banco: "ITAU",
    metadata: metadataFinal,
    movimentos,
    diagnostico
  };
}

module.exports = {
  lerExtratoItauXlsx
};
