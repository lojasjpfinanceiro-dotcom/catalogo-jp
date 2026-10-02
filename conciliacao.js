"use strict";

const express = require("express");
const crypto = require("crypto");
const { lerExtratoItauXlsx } = require("./banco_itau");

module.exports = function registrarRotasConciliacao({
  app,
  querySafe,
  queryAtendimento,
  resolveEmpresasFiltro
}) {
  if (!app || !querySafe || !queryAtendimento || !resolveEmpresasFiltro) {
    throw new Error("Dependências obrigatórias da conciliação não foram informadas.");
  }

  // CONCILIAÇÃO BANCÁRIA - IMPORTADOR UNIVERSAL CSV/OFX/XLS/XLSX
  // Os extratos são gravados somente no banco auxiliar postgres.
  // Nenhuma tabela oficial do ERP é alterada.
  // ======================================================
  let conciliacaoBancariaSchemaPronto = false;

  async function garantirSchemaConciliacaoBancaria() {
    if (conciliacaoBancariaSchemaPronto) return;

    await queryAtendimento(`
      CREATE TABLE IF NOT EXISTS public.financeiro_extrato_bancos (
        id BIGSERIAL PRIMARY KEY,
        empresa VARCHAR(2) NOT NULL DEFAULT '',
        banco VARCHAR(30) NOT NULL,
        agencia VARCHAR(30) NOT NULL DEFAULT '',
        conta VARCHAR(50) NOT NULL,
        data_movimento DATE NOT NULL,
        documento VARCHAR(120) NOT NULL DEFAULT '',
        historico TEXT NOT NULL DEFAULT '',
        valor NUMERIC(18,2) NOT NULL,
        tipo CHAR(1) NOT NULL CHECK (tipo IN ('C','D')),
        saldo NUMERIC(18,2),
        fitid VARCHAR(180) NOT NULL DEFAULT '',
        arquivo_origem VARCHAR(255) NOT NULL,
        hash_linha VARCHAR(64) NOT NULL,
        importado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT financeiro_extrato_bancos_hash_uk UNIQUE (hash_linha)
      )
    `, [], 30000);

    await queryAtendimento(`
      CREATE INDEX IF NOT EXISTS idx_fin_extrato_banco_filtro
        ON public.financeiro_extrato_bancos
        (empresa, banco, conta, data_movimento, tipo)
    `, [], 30000);


    // Repara importações antigas do Itaú gravadas com ano 2001.
    // O ano correto é retirado do nome do arquivo, como 05-08-2026.xlsx.
    await queryAtendimento(`
      UPDATE public.financeiro_extrato_bancos
      SET data_movimento = MAKE_DATE(
        ((REGEXP_MATCH(arquivo_origem, '(20[0-9]{2})'))[1])::int,
        EXTRACT(MONTH FROM data_movimento)::int,
        EXTRACT(DAY FROM data_movimento)::int
      )
      WHERE UPPER(TRIM(COALESCE(banco,''))) = 'ITAU'
        AND EXTRACT(YEAR FROM data_movimento) BETWEEN 2000 AND 2010
        AND COALESCE(arquivo_origem,'') ~ '(20[0-9]{2})'
    `, [], 30000);

    conciliacaoBancariaSchemaPronto = true;
  }

  function textoSemAcento(valor) {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function numeroExtrato(valor) {
    let s = String(valor ?? '').trim();
    if (!s) return null;
    s = s.replace(/R\$/gi, '').replace(/\s/g, '');
    const temVirgula = s.includes(',');
    const temPonto = s.includes('.');
    if (temVirgula && temPonto) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (temVirgula) {
      s = s.replace(/\./g, '').replace(',', '.');
    }
    s = s.replace(/[^0-9+\-.]/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function dataExtrato(valor) {
    const s = String(valor ?? '').trim();
    if (!s) return '';
    let m = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = s.match(/^(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    m = s.match(/^(\d{4})(\d{2})(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return '';
  }

  function detectarSeparadorCSV(linha) {
    const candidatos = [';', ',', '\\t', '|'];
    return candidatos
      .map(sep => ({ sep, qtd: linha.split(sep).length }))
      .sort((a,b) => b.qtd - a.qtd)[0].sep;
  }

  function dividirCSV(linha, sep) {
    const saida = [];
    let atual = '';
    let aspas = false;
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i];
      if (ch === '"') {
        if (aspas && linha[i + 1] === '"') { atual += '"'; i++; }
        else aspas = !aspas;
      } else if (ch === sep && !aspas) {
        saida.push(atual.trim()); atual = '';
      } else atual += ch;
    }
    saida.push(atual.trim());
    return saida;
  }

  function chaveCabecalho(valor) {
    return textoSemAcento(valor).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function localizarColuna(headers, nomes) {
    const normalizados = headers.map(chaveCabecalho);
    for (const nome of nomes) {
      const alvo = chaveCabecalho(nome);
      let i = normalizados.findIndex(x => x === alvo);
      if (i >= 0) return i;
      i = normalizados.findIndex(x => x.includes(alvo) || alvo.includes(x));
      if (i >= 0) return i;
    }
    return -1;
  }


  function dataExcelExtrato(valor) {
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      const y = valor.getFullYear();
      const m = String(valor.getMonth() + 1).padStart(2, '0');
      const d = String(valor.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const base = new Date(Date.UTC(1899, 11, 30));
      const dt = new Date(base.getTime() + Math.round(valor) * 86400000);
      return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
    }
    return dataExtrato(valor);
  }

  function parseLinhasExtrato(linhas) {
    const rows = (linhas || []).filter(row =>
      Array.isArray(row) && row.some(v => String(v ?? '').trim() !== '')
    );

    if (rows.length < 2) {
      throw new Error('Planilha sem linhas suficientes.');
    }

    /*
     * ITAÚ XLSX:
     * Antes da tabela existem linhas de atualização, nome, agência, conta e período.
     * A tabela verdadeira começa somente na linha que contém, ao mesmo tempo:
     * Data | Lançamento | Valor (R$)
     *
     * Não basta procurar qualquer célula contendo "Data" ou "Valor", porque isso
     * fazia o período do extrato ser interpretado como movimentação bancária.
     */
    let cabIdx = rows.findIndex(row => {
      const chaves = row.map(chaveCabecalho);
      const temData = chaves.some(x => x === 'data' || x === 'datalancamento' || x === 'datamovimento');
      const temLancamento = chaves.some(x => x === 'lancamento' || x === 'historico' || x === 'descricao');
      const temValor = chaves.some(x => x === 'valor' || x === 'valorrs' || x === 'valorlancamento' || x === 'credito' || x === 'debito');
      return temData && temLancamento && temValor;
    });

    if (cabIdx < 0) {
      cabIdx = rows.findIndex(row => {
        const chaves = row.map(chaveCabecalho);
        return chaves.some(x => x === 'data') &&
               chaves.some(x => x.includes('valor'));
      });
    }

    if (cabIdx < 0) {
      throw new Error('Não encontrei o cabeçalho de movimentações da planilha.');
    }

    const headers = rows[cabIdx].map(v => String(v ?? '').trim());

    const idxData = localizarColuna(headers, [
      'data lançamento', 'data lancamento', 'data movimento', 'data'
    ]);
    const idxHist = localizarColuna(headers, [
      'lançamento', 'lancamento', 'histórico', 'historico', 'descrição', 'descricao', 'detalhe'
    ]);
    const idxRazao = localizarColuna(headers, [
      'razão social', 'razao social', 'favorecido', 'beneficiário', 'beneficiario', 'nome'
    ]);
    const idxCpfCnpj = localizarColuna(headers, [
      'cpf/cnpj', 'cpf cnpj', 'cpf', 'cnpj'
    ]);
    const idxDoc = localizarColuna(headers, [
      'documento', 'doc', 'número documento', 'numero documento', 'identificador'
    ]);
    const idxValor = localizarColuna(headers, [
      'valor (r$)', 'valor r$', 'valor', 'valor lançamento', 'valor lancamento'
    ]);
    const idxCredito = localizarColuna(headers, ['crédito', 'credito', 'entrada']);
    const idxDebito = localizarColuna(headers, ['débito', 'debito', 'saída', 'saida']);
    const idxTipo = localizarColuna(headers, ['tipo', 'natureza', 'd/c', 'credito/debito']);
    const idxSaldo = localizarColuna(headers, ['saldo (r$)', 'saldo r$', 'saldo']);

    if (idxData < 0 || idxHist < 0 || (idxValor < 0 && idxCredito < 0 && idxDebito < 0)) {
      throw new Error('Não consegui identificar as colunas Data, Lançamento e Valor na planilha.');
    }

    const ignorarHistoricos = [
      'SALDO ANTERIOR',
      'SALDO TOTAL DISPONIVEL DIA',
      'SALDO TOTAL DISPONÍVEL DIA',
      'SALDO DO DIA',
      'SALDO FINAL',
      'SALDO BLOQUEADO',
      'SALDO DISPONIVEL',
      'SALDO DISPONÍVEL'
    ].map(x => textoSemAcento(x).toUpperCase());

    const movs = [];

    for (const c of rows.slice(cabIdx + 1)) {
      const data = dataExcelExtrato(c[idxData]);
      if (!data) continue;

      const historicoBase = String(c[idxHist] ?? '').trim();
      const historicoNormalizado = textoSemAcento(historicoBase).toUpperCase();

      if (!historicoBase) continue;
      if (ignorarHistoricos.some(x => historicoNormalizado === x || historicoNormalizado.startsWith(x))) {
        continue;
      }

      let valor = idxValor >= 0 ? numeroExtrato(c[idxValor]) : null;
      let tipo = '';
      const credito = idxCredito >= 0 ? numeroExtrato(c[idxCredito]) : null;
      const debito = idxDebito >= 0 ? numeroExtrato(c[idxDebito]) : null;

      if (credito != null && Math.abs(credito) > 0) {
        valor = Math.abs(credito);
        tipo = 'C';
      } else if (debito != null && Math.abs(debito) > 0) {
        valor = Math.abs(debito);
        tipo = 'D';
      } else if (valor != null) {
        const natureza = idxTipo >= 0
          ? textoSemAcento(c[idxTipo]).toUpperCase()
          : '';

        tipo = /(^D$|DEB|SAIDA)/.test(natureza) || valor < 0 ? 'D' : 'C';
        valor = Math.abs(valor);
      }

      // Linhas de saldo do Itaú não possuem valor de movimentação.
      if (valor == null || !Number.isFinite(valor) || valor === 0) continue;

      const razaoSocial = idxRazao >= 0 ? String(c[idxRazao] ?? '').trim() : '';
      const cpfCnpj = idxCpfCnpj >= 0 ? String(c[idxCpfCnpj] ?? '').trim() : '';
      const documentoPlanilha = idxDoc >= 0 ? String(c[idxDoc] ?? '').trim() : '';

      const historicoCompleto = [historicoBase, razaoSocial]
        .filter(Boolean)
        .filter((valor, indice, lista) => lista.indexOf(valor) === indice)
        .join(' - ');

      movs.push({
        data,
        documento: documentoPlanilha || cpfCnpj,
        historico: historicoCompleto,
        valor,
        tipo,
        saldo: idxSaldo >= 0 ? numeroExtrato(c[idxSaldo]) : null,
        fitid: ''
      });
    }

    if (!movs.length) {
      throw new Error('Nenhuma movimentação válida foi encontrada na planilha.');
    }

    return movs;
  }

  function parseExcelExtrato(buffer) {
    let XLSX;
    try {
      XLSX = require('xlsx');
    } catch (_) {
      throw new Error("Para importar XLS/XLSX, execute no projeto: npm install xlsx");
    }
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const nomeAba = wb.SheetNames?.[0];
    if (!nomeAba) throw new Error('A planilha não possui abas para leitura.');
    const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nomeAba], { header: 1, raw: true, defval: '' });
    return parseLinhasExtrato(linhas);
  }

  function parseCSVExtrato(texto) {
    const linhas = String(texto || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x.trim());
    if (linhas.length < 2) throw new Error('CSV sem linhas suficientes.');

    let cabIdx = linhas.findIndex(l => /data|lan[cç]amento|hist[oó]rico|descri[cç][aã]o|valor|cr[eé]dito|d[eé]bito/i.test(l));
    if (cabIdx < 0) cabIdx = 0;
    const sep = detectarSeparadorCSV(linhas[cabIdx]);
    const headers = dividirCSV(linhas[cabIdx], sep);

    const idxData = localizarColuna(headers, ['data lançamento','data lancamento','data movimento','data','lançamento']);
    const idxHist = localizarColuna(headers, ['histórico','historico','descrição','descricao','lançamento','detalhe']);
    const idxDoc = localizarColuna(headers, ['documento','doc','número documento','numero documento','identificador']);
    const idxValor = localizarColuna(headers, ['valor','valor lançamento','valor lancamento']);
    const idxCredito = localizarColuna(headers, ['crédito','credito','entrada']);
    const idxDebito = localizarColuna(headers, ['débito','debito','saída','saida']);
    const idxTipo = localizarColuna(headers, ['tipo','natureza','d/c','credito/debito']);
    const idxSaldo = localizarColuna(headers, ['saldo']);

    if (idxData < 0 || (idxValor < 0 && idxCredito < 0 && idxDebito < 0)) {
      throw new Error('Não consegui identificar as colunas de data e valor neste CSV.');
    }

    const movs = [];
    for (const linha of linhas.slice(cabIdx + 1)) {
      const c = dividirCSV(linha, sep);
      const data = dataExtrato(c[idxData]);
      if (!data) continue;

      let valor = idxValor >= 0 ? numeroExtrato(c[idxValor]) : null;
      let tipo = '';
      const credito = idxCredito >= 0 ? numeroExtrato(c[idxCredito]) : null;
      const debito = idxDebito >= 0 ? numeroExtrato(c[idxDebito]) : null;

      if (credito != null && Math.abs(credito) > 0) { valor = Math.abs(credito); tipo = 'C'; }
      else if (debito != null && Math.abs(debito) > 0) { valor = Math.abs(debito); tipo = 'D'; }
      else if (valor != null) {
        const t = idxTipo >= 0 ? textoSemAcento(c[idxTipo]).toUpperCase() : '';
        tipo = /D|DEB|SAIDA/.test(t) || valor < 0 ? 'D' : 'C';
        valor = Math.abs(valor);
      }

      if (valor == null || !Number.isFinite(valor) || valor == 0) continue;
      movs.push({
        data,
        documento: idxDoc >= 0 ? String(c[idxDoc] || '').trim() : '',
        historico: idxHist >= 0 ? String(c[idxHist] || '').trim() : '',
        valor,
        tipo,
        saldo: idxSaldo >= 0 ? numeroExtrato(c[idxSaldo]) : null,
        fitid: ''
      });
    }
    return movs;
  }

  function tagOFX(bloco, nome) {
    const re = new RegExp(`<${nome}>([^<\\r\\n]+)`, 'i');
    return String(bloco || '').match(re)?.[1]?.trim() || '';
  }

  function parseOFXExtrato(texto) {
    const blocos = String(texto || '').match(/<STMTTRN>[\s\S]*?(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi) || [];
    const movs = blocos.map(bloco => {
      const bruto = numeroExtrato(tagOFX(bloco, 'TRNAMT'));
      const trntype = tagOFX(bloco, 'TRNTYPE').toUpperCase();
      return {
        data: dataExtrato(tagOFX(bloco, 'DTPOSTED')),
        documento: tagOFX(bloco, 'CHECKNUM') || tagOFX(bloco, 'REFNUM'),
        historico: [tagOFX(bloco, 'NAME'), tagOFX(bloco, 'MEMO')].filter(Boolean).join(' - '),
        valor: Math.abs(bruto || 0),
        tipo: bruto < 0 || /DEBIT|PAYMENT|FEE|CHECK|ATM|CASH/.test(trntype) ? 'D' : 'C',
        saldo: null,
        fitid: tagOFX(bloco, 'FITID')
      };
    }).filter(x => x.data && x.valor > 0);
    if (!movs.length) throw new Error('Nenhuma movimentação foi encontrada no OFX.');
    return movs;
  }


  function extrairAnoPeriodoItau(periodo) {
    const anos = String(periodo || "").match(/\b(20\d{2})\b/g) || [];
    if (!anos.length) return null;
    const ano = Number(anos[0]);
    return Number.isInteger(ano) ? ano : null;
  }

  function forcarAnoMovimento(dataMovimento, anoEsperado) {
    const valor = String(dataMovimento || "").trim();
    if (!valor || !anoEsperado) return valor;

    let m = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${anoEsperado}-${m[2]}-${m[3]}`;

    m = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${anoEsperado}-${m[2]}-${m[1]}`;

    return valor;
  }


  function dataIsoResposta(valor) {
    if (!valor) return "";

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      const ano = valor.getFullYear();
      const mes = String(valor.getMonth() + 1).padStart(2, "0");
      const dia = String(valor.getDate()).padStart(2, "0");
      return `${ano}-${mes}-${dia}`;
    }

    const s = String(valor).trim();

    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;

    m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;

    return s;
  }

  function hashMovimentoBanco({ empresa, banco, agencia, conta, data, documento, historico, valor, tipo, fitid }) {
    return crypto.createHash('sha256').update([
      empresa, banco, agencia, conta, data, documento, historico,
      Number(valor || 0).toFixed(2), tipo, fitid
    ].map(x => String(x ?? '').trim().toUpperCase()).join('|')).digest('hex');
  }

  app.post('/api/conciliacao-bancaria/importar', express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
    try {
      await garantirSchemaConciliacaoBancaria();
      const banco = textoSemAcento(req.headers['x-banco'] || '').toUpperCase();
      const empresa = String(req.headers['x-empresa'] || '').replace(/\D/g,'').slice(-2).padStart(2,'0');
      const arquivo = decodeURIComponent(String(req.headers['x-arquivo'] || 'extrato'));
      const extensao = arquivo.toLowerCase().split('.').pop();

      if (!banco) return res.status(400).json({ ok:false, erro:'Selecione o banco antes da importação.' });
      const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
      if (!buffer.length) return res.status(400).json({ ok:false, erro:'Arquivo vazio.' });

      let movimentos;
      let metadadosArquivo = null;
      let agenciaArquivo = '';
      let contaArquivo = '';

      if (banco === 'ITAU') {
        if (extensao !== 'xlsx') {
          return res.status(400).json({
            ok:false,
            erro:'Para o Itaú, baixe e selecione exclusivamente o extrato na extensão .xlsx.'
          });
        }

        const leituraItau = lerExtratoItauXlsx(buffer);
        movimentos = leituraItau.movimentos;
        metadadosArquivo = leituraItau.metadata;
        agenciaArquivo = String(metadadosArquivo?.agencia || '').trim();
        contaArquivo = String(metadadosArquivo?.conta || '').trim();

        const anoEsperadoItau = extrairAnoPeriodoItau(metadadosArquivo?.periodo);
        if (!anoEsperadoItau) {
          return res.status(400).json({
            ok:false,
            erro:'Não foi possível identificar o ano no período do extrato do Itaú.'
          });
        }

        movimentos = (movimentos || []).map(m => ({
          ...m,
          data: forcarAnoMovimento(m.data, anoEsperadoItau)
        }));

        console.log('[CONCILIAÇÃO ITAÚ - DATAS NORMALIZADAS]', {
          arquivo,
          periodo: metadadosArquivo?.periodo || '',
          anoEsperado: anoEsperadoItau,
          anosFinais: [...new Set(movimentos.map(m => String(m.data || '').slice(0,4)))],
          primeiraData: movimentos[0]?.data || null,
          ultimaData: movimentos[movimentos.length - 1]?.data || null
        });

        if (!agenciaArquivo || !contaArquivo) {
          return res.status(400).json({
            ok:false,
            erro:'Não foi possível identificar automaticamente a agência e a conta dentro do XLSX do Itaú.'
          });
        }
      } else {
        return res.status(400).json({
          ok:false,
          erro:`O importador do banco ${banco} ainda não foi configurado. Neste momento, utilize ITAU com arquivos .xlsx.`
        });
      }
      // Limpeza automática de importações antigas com ano inválido.
      // Atua somente na tabela auxiliar de extratos do Itaú.
      const invalidosAntigos = await queryAtendimento(`
        DELETE FROM public.financeiro_extrato_bancos
        WHERE UPPER(TRIM(COALESCE(banco,''))) = 'ITAU'
          AND EXTRACT(YEAR FROM data_movimento) < 2020
        RETURNING id
      `, [], 30000);

      // Substitui a importação anterior do MESMO arquivo/conta.
      // Isso remove registros antigos importados com data incorreta (ex.: 2021)
      // antes de gravar novamente as datas corretas do XLSX.
      const removidosAnteriormente = await queryAtendimento(`
        DELETE FROM public.financeiro_extrato_bancos
        WHERE UPPER(TRIM(COALESCE(banco,''))) = $1
          AND TRIM(COALESCE(agencia,'')) = $2
          AND TRIM(COALESCE(conta,'')) = $3
          AND TRIM(COALESCE(arquivo_origem,'')) = $4
        RETURNING id
      `, [banco, agenciaArquivo, contaArquivo, arquivo], 30000);

      let inseridos = 0, duplicados = 0;
      for (const m of movimentos) {
        const hash = hashMovimentoBanco({ empresa, banco, agencia:agenciaArquivo, conta:contaArquivo, ...m });
        const r = await queryAtendimento(`
          INSERT INTO public.financeiro_extrato_bancos
            (empresa,banco,agencia,conta,data_movimento,documento,historico,valor,tipo,saldo,fitid,arquivo_origem,hash_linha)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (hash_linha) DO NOTHING
          RETURNING id
        `, [empresa,banco,agenciaArquivo,contaArquivo,m.data,m.documento,m.historico,m.valor,m.tipo,m.saldo,m.fitid,arquivo,hash], 30000);
        if (r.rows?.length) inseridos++; else duplicados++;
      }

      res.json({
        ok:true,
        arquivo,
        lidos:movimentos.length,
        inseridos,
        duplicados,
        banco,
        agencia:agenciaArquivo,
        conta:contaArquivo,
        metadadosArquivo,
        substituidos: removidosAnteriormente.rows?.length || 0,
        invalidosAntigosRemovidos: invalidosAntigos.rows?.length || 0
      });
    } catch (e) {
      console.error('Erro importação extrato bancário:', e);
      res.status(500).json({ ok:false, erro:e.message });
    }
  });

  // Limpa somente os extratos da tabela auxiliar.
  // Não altera nenhuma tabela oficial do ERP.
  app.delete('/api/conciliacao-bancaria/movimentos', async (req, res) => {
    try {
      await garantirSchemaConciliacaoBancaria();

      const { empresa='', banco='' } = req.query;
      const params=[];
      const where=[];

      if (empresa) {
        params.push(String(empresa).replace(/\D/g,'').slice(-2).padStart(2,'0'));
        where.push(`empresa=$${params.length}`);
      }

      if (banco) {
        params.push(String(banco).toUpperCase());
        where.push(`banco=$${params.length}`);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const r = await queryAtendimento(`
        DELETE FROM public.financeiro_extrato_bancos
        ${whereSql}
        RETURNING id
      `, params, 60000);

      return res.json({
        ok:true,
        removidos:r.rows?.length || 0,
        escopo:{
          empresa:empresa || '',
          banco:banco || ''
        }
      });
    } catch(e) {
      console.error('Erro limpar extratos bancários:', e);
      return res.status(500).json({ok:false, erro:e.message});
    }
  });

  // Lista somente os movimentos importados. Esta rota NÃO consulta o ERP.
  app.get('/api/conciliacao-bancaria/movimentos', async (req, res) => {
    try {
      await garantirSchemaConciliacaoBancaria();
      const { empresa='', banco='', dataIni='', dataFim='', limit='500' } = req.query;
      const limite = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 1000);
      const params=[];
      const where=[];

      if (empresa) {
        params.push(String(empresa).replace(/\D/g,'').slice(-2).padStart(2,'0'));
        where.push(`empresa=$${params.length}`);
      }
      if (banco) {
        params.push(String(banco).toUpperCase());
        where.push(`banco=$${params.length}`);
      }
      if (dataIni) {
        params.push(dataIni);
        where.push(`data_movimento >= $${params.length}::date`);
      }
      if (dataFim) {
        params.push(dataFim);
        where.push(`data_movimento <= $${params.length}::date`);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      params.push(limite);

      const rb = await queryAtendimento(`
        SELECT id,empresa,banco,agencia,conta,data_movimento,documento,historico,
               valor,tipo,saldo,arquivo_origem,importado_em
        FROM public.financeiro_extrato_bancos
        ${whereSql}
        ORDER BY data_movimento DESC,id DESC
        LIMIT $${params.length}
      `, params, 30000);

      const movimentos = (rb.rows || []).map(x => ({
        id:x.id,
        empresa:x.empresa,
        banco:x.banco,
        agencia:x.agencia,
        conta:x.conta,
        data:dataIsoResposta(x.data_movimento),
        documento:x.documento,
        historico:x.historico,
        valor:Number(x.valor || 0),
        tipo:x.tipo,
        saldo:x.saldo == null ? null : Number(x.saldo),
        arquivo:x.arquivo_origem,
        situacao:'IMPORTADO',
        erp:null,
        candidatos:0
      }));

      const resumo = movimentos.reduce((a,x) => {
        a.total++;
        if (x.tipo === 'C') a.creditos += x.valor;
        else a.debitos += x.valor;
        return a;
      }, {total:0,creditos:0,debitos:0,conciliados:0,ambiguos:0,pendentes:0});

      res.json({ok:true, modo:'BANCO', resumo, movimentos});
    } catch(e) {
      console.error('Erro listar movimentos bancários:', e);
      res.status(500).json({ok:false,erro:e.message});
    }
  });

  // Compara banco x ERP somente por ação do usuário, com período obrigatório.
  app.get('/api/conciliacao-bancaria/comparar', async (req, res) => {
    try {
      await garantirSchemaConciliacaoBancaria();
      const { empresa='', banco='', dataIni='', dataFim='', status='todos', limit='500' } = req.query;
      const limite = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 500);

      if (!dataIni || !dataFim) {
        return res.status(400).json({ok:false, erro:'Informe a data inicial e a data final para comparar com o ERP.'});
      }

      const inicio = new Date(`${dataIni}T00:00:00`);
      const fim = new Date(`${dataFim}T00:00:00`);
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim < inicio) {
        return res.status(400).json({ok:false, erro:'Período de comparação inválido.'});
      }
      const dias = Math.floor((fim - inicio) / 86400000) + 1;
      if (dias > 31) {
        return res.status(400).json({ok:false, erro:'Para manter o sistema leve, compare no máximo 31 dias por vez.'});
      }

      const pb=[];
      const wb=[`data_movimento >= $1::date`, `data_movimento <= $2::date`];
      pb.push(dataIni, dataFim);
      if (empresa) {
        pb.push(String(empresa).replace(/\D/g,'').slice(-2).padStart(2,'0'));
        wb.push(`empresa=$${pb.length}`);
      }
      if (banco) {
        pb.push(String(banco).toUpperCase());
        wb.push(`banco=$${pb.length}`);
      }
      pb.push(limite);

      const rb = await queryAtendimento(`
        SELECT id,empresa,banco,agencia,conta,data_movimento,documento,historico,
               valor,tipo,saldo,arquivo_origem
        FROM public.financeiro_extrato_bancos
        WHERE ${wb.join(' AND ')}
        ORDER BY data_movimento DESC,id DESC
        LIMIT $${pb.length}
      `, pb, 30000);

      if (!rb.rows?.length) {
        return res.json({
          ok:true,
          modo:'COMPARACAO',
          resumo:{total:0,creditos:0,debitos:0,conciliados:0,pendentes:0,ambiguos:0},
          movimentos:[]
        });
      }

      const pe=[dataIni, dataFim];
      const we=[
        `TRIM(COALESCE(ft.status::text,'')) = 'B'`,
        `ft.pagamento IS NOT NULL`,
        `ft.pagamento >= $1::date`,
        `ft.pagamento < ($2::date + INTERVAL '1 day')`
      ];
      if (empresa) {
        pe.push(String(empresa).replace(/\D/g,'').slice(-2).padStart(2,'0'));
        we.push(`LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') = $${pe.length}`);
      }

      const re = await querySafe(`
        SELECT
          TRIM(COALESCE(ft.codigo::text,'')) AS codigo,
          LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') AS empresa,
          ft.pagamento::date AS data,
          UPPER(TRIM(COALESCE(ft.rp::text,''))) AS rp,
          COALESCE(NULLIF(TRIM(ft.documento::text),''),TRIM(ft.codigo::text)) AS documento,
          COALESCE(NULLIF(TRIM(ft.pessoa::text),''),'-') AS pessoa,
          COALESCE(NULLIF(TRIM(ft.descricao::text),''),'-') AS descricao,
          ABS(COALESCE(NULLIF(ft.valorpago::numeric,0),ft.valor::numeric,0)) AS valor
        FROM financeiro_titulos ft
        WHERE ${we.join(' AND ')}
        ORDER BY ft.pagamento DESC
        LIMIT 5000
      `, pe, 60000);

      const indice = new Map();
      for (const row of re.rows || []) {
        const data = String(row.data || '').slice(0,10);
        const valor = Number(row.valor || 0).toFixed(2);
        const natureza = row.rp === 'R' ? 'C' : (['P','S'].includes(row.rp) ? 'D' : '');
        if (!natureza) continue;
        const chave = `${data}|${valor}|${natureza}`;
        if (!indice.has(chave)) indice.set(chave, []);
        indice.get(chave).push({...row, valor:Number(row.valor || 0), usado:false});
      }

      const movimentos = (rb.rows || []).map(x => {
        const data = dataIsoResposta(x.data_movimento);
        const chave = `${data}|${Number(x.valor || 0).toFixed(2)}|${x.tipo}`;
        const candidatosLivres = (indice.get(chave) || []).filter(e => !e.usado);
        let candidato = null;
        if (candidatosLivres.length === 1) {
          candidato = candidatosLivres[0];
          candidato.usado = true;
        }
        const situacao = candidato ? 'CONCILIADO' : candidatosLivres.length > 1 ? 'AMBIGUO' : 'PENDENTE';
        return {
          id:x.id, empresa:x.empresa, banco:x.banco, agencia:x.agencia, conta:x.conta,
          data, documento:x.documento, historico:x.historico,
          valor:Number(x.valor || 0), tipo:x.tipo,
          saldo:x.saldo == null ? null : Number(x.saldo), arquivo:x.arquivo_origem,
          situacao,
          erp:candidato ? {
            codigo:candidato.codigo,
            documento:candidato.documento,
            pessoa:candidato.pessoa,
            descricao:candidato.descricao,
            valor:candidato.valor,
            data:String(candidato.data || '').slice(0,10),
            rp:candidato.rp
          } : null,
          candidatos:candidatosLivres.length
        };
      }).filter(x => status === 'todos' || x.situacao.toLowerCase() === String(status).toLowerCase());

      const resumo = movimentos.reduce((a,x) => {
        a.total++;
        if (x.tipo === 'C') a.creditos += x.valor; else a.debitos += x.valor;
        if (x.situacao === 'CONCILIADO') a.conciliados++;
        else if (x.situacao === 'AMBIGUO') a.ambiguos++;
        else a.pendentes++;
        return a;
      }, {total:0,creditos:0,debitos:0,conciliados:0,ambiguos:0,pendentes:0});

      res.json({ok:true, modo:'COMPARACAO', periodo:{dataIni,dataFim,dias}, resumo, movimentos});
    } catch(e) {
      console.error('Erro comparar conciliação bancária:', e);
      res.status(500).json({ok:false,erro:e.message});
    }
  });

  // ======================================================
  // CONCILIAÇÃO - RESUMO GERAL
  // ======================================================
  app.get("/api/conciliacao/resumo", async (req, res) => {
    try {
      const { empresa = "", dataIni = "", dataFim = "" } = req.query;
      const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

      const params = [];
      const whereBase = [];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        whereBase.push(`LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (dataIni) { params.push(dataIni); whereBase.push(`ca.data_ajuste::date >= $${params.length}`); }
      if (dataFim) { params.push(dataFim); whereBase.push(`ca.data_ajuste::date <= $${params.length}`); }

      const where = whereBase.length ? `WHERE ${whereBase.join(" AND ")}` : "";

      const sqlAjustes = `
        SELECT
          COUNT(*) AS total_ajustes,
          COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'C' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS total_credito,
          COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'D' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS total_debito,
          COALESCE(SUM(COALESCE(ca.valor_bruto::numeric,0)),0) AS valor_bruto_total,
          COALESCE(SUM(COALESCE(ca.valor_liquido::numeric,0)),0) AS valor_liquido_total,
          COUNT(CASE WHEN ca.data_pagamento IS NOT NULL THEN 1 END) AS qtd_pagos,
          COUNT(CASE WHEN ca.data_pagamento IS NULL THEN 1 END) AS qtd_pendentes
        FROM conciliacao_ajustes ca
        ${where}
      `;

      const paramsEq = [];
      const whereEq = [];
      if (empList.length) {
        const start = paramsEq.length + 1;
        empList.forEach(e => paramsEq.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        whereEq.push(`LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') IN (${ph})`);
      }
      const whereEqSql = whereEq.length ? `WHERE ${whereEq.join(" AND ")}` : "";

      const sqlEquals = `
        SELECT
          COUNT(*) AS total_conciliacoes,
          COUNT(CASE WHEN ce.status = 1 THEN 1 END) AS conciliadas,
          COUNT(CASE WHEN ce.status = 2 THEN 1 END) AS divergentes,
          COUNT(CASE WHEN ce.status = 0 THEN 1 END) AS pendentes,
          COUNT(CASE WHEN ce.status = 3 THEN 1 END) AS erros
        FROM conciliacao_equals_lite ce
        ${whereEqSql}
      `;

      const paramsReg = [];
      const whereReg = [];
      if (empList.length) {
        const start = paramsReg.length + 1;
        empList.forEach(e => paramsReg.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        whereReg.push(`LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (dataIni) { paramsReg.push(dataIni); whereReg.push(`cr.dtvenda::date >= $${paramsReg.length}`); }
      if (dataFim) { paramsReg.push(dataFim); whereReg.push(`cr.dtvenda::date <= $${paramsReg.length}`); }
      const whereRegSql = whereReg.length ? `WHERE ${whereReg.join(" AND ")}` : "";

      const sqlRegistros = `
        SELECT
          COUNT(*) AS total_registros,
          COUNT(DISTINCT TRIM(COALESCE(cr.bandeira::text,''))) AS qtd_bandeiras,
          COUNT(DISTINCT TRIM(COALESCE(cr.empresa::text,''))) AS qtd_empresas,
          COALESCE(SUM(COALESCE(cr.vlbrutovenda::numeric,0)),0) AS valor_bruto_total,
          COUNT(CASE WHEN COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') <> '' THEN 1 END) AS qtd_conciliados,
          COUNT(CASE WHEN COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') = '' THEN 1 END) AS qtd_nao_conciliados
        FROM conciliacao_cartao_registros cr
        ${whereRegSql}
      `;

      const [rAj, rEq, rReg] = await Promise.all([
        querySafe(sqlAjustes, params, 30000),
        querySafe(sqlEquals, paramsEq, 30000),
        querySafe(sqlRegistros, paramsReg, 30000),
      ]);

      const aj = rAj.rows?.[0] || {};
      const eq = rEq.rows?.[0] || {};
      const reg = rReg.rows?.[0] || {};

      return res.json({
        ok: true,
        ajustes: {
          total: Number(aj.total_ajustes || 0),
          totalCredito: Number(aj.total_credito || 0),
          totalDebito: Number(aj.total_debito || 0),
          valorBrutoTotal: Number(aj.valor_bruto_total || 0),
          valorLiquidoTotal: Number(aj.valor_liquido_total || 0),
          qtdPagos: Number(aj.qtd_pagos || 0),
          qtdPendentes: Number(aj.qtd_pendentes || 0),
        },
        conciliacao: {
          total: Number(eq.total_conciliacoes || 0),
          conciliadas: Number(eq.conciliadas || 0),
          divergentes: Number(eq.divergentes || 0),
          pendentes: Number(eq.pendentes || 0),
          erros: Number(eq.erros || 0),
          taxaConciliacao: Number(eq.total_conciliacoes || 0) > 0
            ? (Number(eq.conciliadas || 0) / Number(eq.total_conciliacoes || 0)) * 100
            : 0,
        },
        cartao: {
          totalRegistros: Number(reg.total_registros || 0),
          qtdBandeiras: Number(reg.qtd_bandeiras || 0),
          qtdEmpresas: Number(reg.qtd_empresas || 0),
          valorBrutoTotal: Number(reg.valor_bruto_total || 0),
          qtdConciliados: Number(reg.qtd_conciliados || 0),
          qtdNaoConciliados: Number(reg.qtd_nao_conciliados || 0),
          taxaConciliacao: Number(reg.total_registros || 0) > 0
            ? (Number(reg.qtd_conciliados || 0) / Number(reg.total_registros || 0)) * 100
            : 0,
        },
      });
    } catch (err) {
      console.error("Erro /api/conciliacao/resumo:", err);
      res.status(500).json({ ok: false, erro: err.message });
    }
  });

  // ======================================================
  // CONCILIAÇÃO - AJUSTES
  // ======================================================
  app.get("/api/conciliacao/ajustes", async (req, res) => {
    try {
      const { empresa = "", dataIni = "", dataFim = "", tipo_ajuste = "", limit = "200" } = req.query;
      const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
      const lim = Math.min(Math.max(parseInt(String(limit || "200"), 10) || 200, 1), 1000);

      const params = [];
      const where = [];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        where.push(`LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (dataIni) { params.push(dataIni); where.push(`ca.data_ajuste::date >= $${params.length}`); }
      if (dataFim) { params.push(dataFim); where.push(`ca.data_ajuste::date <= $${params.length}`); }
      if (tipo_ajuste) { params.push(tipo_ajuste); where.push(`TRIM(COALESCE(ca.tipo_ajuste::text,'')) = $${params.length}`); }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      params.push(lim);

      const sql = `
        SELECT
          ca.codigo,
          LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') AS empresa,
          ca.data_ajuste::date AS data_ajuste,
          TRIM(COALESCE(ca.tipo_ajuste::text,'')) AS tipo_ajuste,
          COALESCE(ca.valor_bruto::numeric,0) AS valor_bruto,
          COALESCE(ca.valor_liquido::numeric,0) AS valor_liquido,
          ca.data_previsao_pagto::date AS data_previsao_pagto,
          ca.data_pagamento::date AS data_pagamento,
          COALESCE(ca.observacao::text,'') AS observacao,
          COALESCE(ca.lote_do_ajuste::text,'') AS lote_do_ajuste,
          COALESCE(ca.id_lote::text,'') AS id_lote,
          ca.parcela_lote,
          COALESCE(cat.descricao::text,'') AS tipo_descricao,
          COALESCE(cat.operacao::text,'') AS operacao,
          COALESCE(cat.operadora::text,'') AS operadora,
          CASE WHEN ca.data_pagamento IS NOT NULL THEN 'PAGO' ELSE 'PENDENTE' END AS situacao
        FROM conciliacao_ajustes ca
        LEFT JOIN conciliacao_ajustes_tipos cat
          ON TRIM(COALESCE(cat.codigo_tipo_seta::text,'')) = TRIM(COALESCE(ca.tipo_ajuste::text,''))
        ${whereSql}
        ORDER BY ca.data_ajuste DESC, ca.codigo DESC
        LIMIT $${params.length}
      `;

      const r = await querySafe(sql, params, 60000);
      return res.json({
        ok: true,
        total: r.rows?.length || 0,
        data: (r.rows || []).map(x => ({
          codigo: x.codigo,
          empresa: x.empresa || "-",
          dataAjuste: x.data_ajuste,
          tipoAjuste: x.tipo_ajuste || "-",
          tipoDescricao: x.tipo_descricao || "-",
          operacao: x.operacao || "-",
          operadora: x.operadora || "-",
          valorBruto: Number(x.valor_bruto || 0),
          valorLiquido: Number(x.valor_liquido || 0),
          dataPrevisaoPagto: x.data_previsao_pagto,
          dataPagamento: x.data_pagamento,
          observacao: x.observacao || "-",
          lotePagamento: x.lote_do_ajuste || "-",
          idLote: x.id_lote || "-",
          parcelaLote: Number(x.parcela_lote || 0),
          situacao: x.situacao || "-",
        })),
      });
    } catch (err) {
      console.error("Erro /api/conciliacao/ajustes:", err);
      res.status(500).json({ ok: false, erro: err.message });
    }
  });

  // ======================================================
  // CONCILIAÇÃO - REGISTROS DE CARTÃO
  // ======================================================
  app.get("/api/conciliacao/cartao-registros", async (req, res) => {
    try {
      const { empresa = "", dataIni = "", dataFim = "", bandeira = "", conciliado = "", limit = "300" } = req.query;
      const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
      const lim = Math.min(Math.max(parseInt(String(limit || "300"), 10) || 300, 1), 2000);

      const params = [];
      const where = [];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        where.push(`LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (dataIni) { params.push(dataIni); where.push(`cr.dtvenda::date >= $${params.length}`); }
      if (dataFim) { params.push(dataFim); where.push(`cr.dtvenda::date <= $${params.length}`); }
      if (bandeira) { params.push(`%${bandeira}%`); where.push(`TRIM(COALESCE(cr.bandeira::text,'')) ILIKE $${params.length}`); }
      if (conciliado === "sim") where.push(`COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') <> ''`);
      if (conciliado === "nao") where.push(`COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') = ''`);

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      params.push(lim);

      const sql = `
        SELECT
          cr.id_arquivo,
          cr.semaforo,
          LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(cr.auxiliar::text,'')) AS auxiliar,
          TRIM(COALESCE(cr.financeiro_conciliacoes::text,'')) AS financeiro_conciliacoes,
          cr.dtvenda::date AS dtvenda,
          COALESCE(cr.vlbrutovenda::numeric,0) AS vlbrutovenda,
          TRIM(COALESCE(cr.plano::text,'')) AS plano,
          TRIM(COALESCE(cr.parcela::text,'')) AS parcela,
          TRIM(COALESCE(cr.nsu::text,'')) AS nsu,
          TRIM(COALESCE(cr.bandeira::text,'')) AS bandeira,
          TRIM(COALESCE(cr.log::text,'')) AS log,
          CASE
            WHEN COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') <> '' THEN 'CONCILIADO'
            ELSE 'PENDENTE'
          END AS status_conciliacao
        FROM conciliacao_cartao_registros cr
        ${whereSql}
        ORDER BY cr.dtvenda DESC, cr.id_arquivo DESC
        LIMIT $${params.length}
      `;

      const r = await querySafe(sql, params, 60000);

      const porBandeira = {};
      (r.rows || []).forEach(row => {
        const b = String(row.bandeira || "OUTROS").trim() || "OUTROS";
        if (!porBandeira[b]) porBandeira[b] = { bandeira: b, qtd: 0, valor: 0, conciliados: 0 };
        porBandeira[b].qtd++;
        porBandeira[b].valor += Number(row.vlbrutovenda || 0);
        if (row.status_conciliacao === "CONCILIADO") porBandeira[b].conciliados++;
      });

      return res.json({
        ok: true,
        total: r.rows?.length || 0,
        resumoBandeira: Object.values(porBandeira).sort((a, b) => b.valor - a.valor),
        data: (r.rows || []).map(x => ({
          idArquivo: x.id_arquivo,
          semaforo: x.semaforo,
          empresa: x.empresa || "-",
          auxiliar: x.auxiliar || "-",
          financeiroConciliacoes: x.financeiro_conciliacoes || "-",
          dtVenda: x.dtvenda,
          vlBrutoVenda: Number(x.vlbrutovenda || 0),
          plano: x.plano || "-",
          parcela: x.parcela || "-",
          nsu: x.nsu || "-",
          bandeira: x.bandeira || "-",
          log: x.log || "-",
          statusConciliacao: x.status_conciliacao || "PENDENTE",
        })),
      });
    } catch (err) {
      console.error("Erro /api/conciliacao/cartao-registros:", err);
      res.status(500).json({ ok: false, erro: err.message });
    }
  });

  // ======================================================
  // CONCILIAÇÃO - EQUALS LITE
  // ======================================================
  app.get("/api/conciliacao/equals", async (req, res) => {
    try {
      const { empresa = "", status = "", limit = "300" } = req.query;
      const empList = await resolveEmpresasFiltro(String(empresa || "").trim());
      const lim = Math.min(Math.max(parseInt(String(limit || "300"), 10) || 300, 1), 2000);

      const params = [];
      const where = [];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        where.push(`LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (status !== "" && status !== "todos") {
        params.push(parseInt(status, 10));
        where.push(`ce.status = $${params.length}`);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      params.push(lim);

      const sql = `
        SELECT
          ce.codigo,
          LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(ce.financeirotitulo::text,'')) AS financeiro_titulo,
          ce.status,
          TRIM(COALESCE(ce.statusdescricao::text,'')) AS status_descricao,
          COALESCE(ce.log::text,'') AS log,
          COALESCE(ce.loghistorico::text,'') AS log_historico,
          ft.vencimento::date AS vencimento,
          ft.valor::numeric AS valor_titulo,
          TRIM(COALESCE(ft.rp::text,'')) AS rp,
          TRIM(COALESCE(ft.status::text,'')) AS status_titulo,
          COALESCE(
            NULLIF(TRIM(p.apelido::text),''),
            NULLIF(TRIM(p.nome::text),''),
            ft.pessoa::text,
            '-'
          ) AS pessoa
        FROM conciliacao_equals_lite ce
        LEFT JOIN financeiro_titulos ft
          ON TRIM(COALESCE(ft.codigo::text,'')) = TRIM(COALESCE(ce.financeirotitulo::text,''))
         AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') = LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0')
        LEFT JOIN pessoas p
          ON TRIM(COALESCE(p.codigo::text,'')) = TRIM(COALESCE(ft.pessoa::text,''))
        ${whereSql}
        ORDER BY ce.codigo DESC
        LIMIT $${params.length}
      `;

      const r = await querySafe(sql, params, 60000);
      const statusLabel = { 0: "PENDENTE", 1: "CONCILIADO", 2: "DIVERGENTE", 3: "ERRO" };

      return res.json({
        ok: true,
        total: r.rows?.length || 0,
        data: (r.rows || []).map(x => ({
          codigo: x.codigo,
          empresa: x.empresa || "-",
          financeiroTitulo: x.financeiro_titulo || "-",
          status: x.status,
          statusLabel: statusLabel[x.status] || "DESCONHECIDO",
          statusDescricao: x.status_descricao || "-",
          log: x.log || "-",
          logHistorico: x.log_historico || "-",
          vencimento: x.vencimento,
          valorTitulo: Number(x.valor_titulo || 0),
          rp: x.rp || "-",
          statusTitulo: x.status_titulo || "-",
          pessoa: x.pessoa || "-",
        })),
      });
    } catch (err) {
      console.error("Erro /api/conciliacao/equals:", err);
      res.status(500).json({ ok: false, erro: err.message });
    }
  });

  // ======================================================
  // CONCILIAÇÃO - DIVERGÊNCIAS E PENDÊNCIAS
  // ======================================================
  app.get("/api/conciliacao/divergencias", async (req, res) => {
    try {
      const { empresa = "", dataIni = "", dataFim = "" } = req.query;
      const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

      const params = [];
      const whereReg = [];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        whereReg.push(`LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (dataIni) { params.push(dataIni); whereReg.push(`cr.dtvenda::date >= $${params.length}`); }
      if (dataFim) { params.push(dataFim); whereReg.push(`cr.dtvenda::date <= $${params.length}`); }
      whereReg.push(`COALESCE(TRIM(cr.financeiro_conciliacoes::text),'') = ''`);

      const whereRegSql = `WHERE ${whereReg.join(" AND ")}`;

      const sqlPendentes = `
        SELECT
          cr.dtvenda::date AS dtvenda,
          LPAD(TRIM(COALESCE(cr.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(cr.bandeira::text,'OUTROS')) AS bandeira,
          COUNT(*) AS qtd,
          COALESCE(SUM(cr.vlbrutovenda::numeric),0) AS valor_total
        FROM conciliacao_cartao_registros cr
        ${whereRegSql}
        GROUP BY cr.dtvenda, cr.empresa, cr.bandeira
        ORDER BY cr.dtvenda DESC, valor_total DESC
        LIMIT 200
      `;

      const paramsEq = [];
      const whereEq = [];
      if (empList.length) {
        const start = paramsEq.length + 1;
        empList.forEach(e => paramsEq.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        whereEq.push(`LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') IN (${ph})`);
      }
      whereEq.push(`ce.status IN (2,3)`);
      const whereEqSql = `WHERE ${whereEq.join(" AND ")}`;

      const sqlDivEq = `
        SELECT
          ce.codigo,
          LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0') AS empresa,
          TRIM(COALESCE(ce.financeirotitulo::text,'')) AS financeiro_titulo,
          ce.status,
          TRIM(COALESCE(ce.statusdescricao::text,'')) AS status_descricao,
          COALESCE(ce.log::text,'') AS log,
          ft.vencimento::date AS vencimento,
          COALESCE(ft.valor::numeric,0) AS valor_titulo
        FROM conciliacao_equals_lite ce
        LEFT JOIN financeiro_titulos ft
          ON TRIM(COALESCE(ft.codigo::text,'')) = TRIM(COALESCE(ce.financeirotitulo::text,''))
         AND LPAD(TRIM(COALESCE(ft.empresa::text,'')),2,'0') = LPAD(TRIM(COALESCE(ce.empresa::text,'')),2,'0')
        ${whereEqSql}
        ORDER BY ce.codigo DESC
        LIMIT 200
      `;

      const [rPend, rDiv] = await Promise.all([
        querySafe(sqlPendentes, params, 30000),
        querySafe(sqlDivEq, paramsEq, 30000),
      ]);

      return res.json({
        ok: true,
        pendentesCartao: (rPend.rows || []).map(x => ({
          dtVenda: x.dtvenda,
          empresa: x.empresa || "-",
          bandeira: x.bandeira || "OUTROS",
          qtd: Number(x.qtd || 0),
          valorTotal: Number(x.valor_total || 0),
        })),
        divergenciasEquals: (rDiv.rows || []).map(x => ({
          codigo: x.codigo,
          empresa: x.empresa || "-",
          financeiroTitulo: x.financeiro_titulo || "-",
          status: x.status,
          statusLabel: x.status === 2 ? "DIVERGENTE" : "ERRO",
          statusDescricao: x.status_descricao || "-",
          log: x.log || "-",
          vencimento: x.vencimento,
          valorTitulo: Number(x.valor_titulo || 0),
        })),
      });
    } catch (err) {
      console.error("Erro /api/conciliacao/divergencias:", err);
      res.status(500).json({ ok: false, erro: err.message });
    }
  });

  // ======================================================
  // CONCILIAÇÃO - TIMELINE DIÁRIA
  // ======================================================
  app.get("/api/conciliacao/timeline", async (req, res) => {
    try {
      const { empresa = "", dataIni = "", dataFim = "" } = req.query;
      const empList = await resolveEmpresasFiltro(String(empresa || "").trim());

      const params = [];
      const where = [];

      if (empList.length) {
        const start = params.length + 1;
        empList.forEach(e => params.push(e));
        const ph = empList.map((_, i) => `$${start + i}`).join(",");
        where.push(`LPAD(TRIM(COALESCE(ca.empresa::text,'')),2,'0') IN (${ph})`);
      }
      if (dataIni) { params.push(dataIni); where.push(`ca.data_ajuste::date >= $${params.length}`); }
      if (dataFim) { params.push(dataFim); where.push(`ca.data_ajuste::date <= $${params.length}`); }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const sql = `
        SELECT
          ca.data_ajuste::date AS data,
          TO_CHAR(ca.data_ajuste::date, 'DD/MM') AS data_fmt,
          COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'C' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS credito,
          COALESCE(SUM(CASE WHEN TRIM(COALESCE(ca.tipo_ajuste::text,'')) = 'D' THEN COALESCE(ca.valor_bruto::numeric,0) ELSE 0 END),0) AS debito,
          COALESCE(SUM(COALESCE(ca.valor_bruto::numeric,0)),0) AS total_bruto,
          COALESCE(SUM(COALESCE(ca.valor_liquido::numeric,0)),0) AS total_liquido,
          COUNT(*) AS qtd_ajustes,
          COUNT(CASE WHEN ca.data_pagamento IS NOT NULL THEN 1 END) AS qtd_pagos
        FROM conciliacao_ajustes ca
        ${whereSql}
        GROUP BY ca.data_ajuste
        ORDER BY ca.data_ajuste DESC
      `;

      const r = await querySafe(sql, params, 30000);
      return res.json({
        ok: true,
        data: (r.rows || []).map(x => ({
          data: x.data,
          dataFmt: x.data_fmt || "-",
          credito: Number(x.credito || 0),
          debito: Number(x.debito || 0),
          totalBruto: Number(x.total_bruto || 0),
          totalLiquido: Number(x.total_liquido || 0),
          qtdAjustes: Number(x.qtd_ajustes || 0),
          qtdPagos: Number(x.qtd_pagos || 0),
        })),
      });
    } catch (err) {
      console.error("Erro /api/conciliacao/timeline:", err);
      res.status(500).json({ ok: false, erro: err.message });
    }
  });
  // ======================================================
};
