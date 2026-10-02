// qualidade_routes.js
// Módulo isolado de Qualidade.
// O ERP Seta continua sendo a fonte dos consertos/produtos.
// Esta camada grava SOMENTE as evidências fotográficas em qualidade_fotos.

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const PDFDocument = require("pdfkit");

function criarRotasQualidade({ app, querySafe, queryInventario }) {
  if (!app || !querySafe || !queryInventario) {
    throw new Error("Qualidade: app, querySafe e queryInventario são obrigatórios.");
  }

  const pastaFotos = path.join(__dirname, "uploads", "qualidade");
  fs.mkdirSync(pastaFotos, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, pastaFotos),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
      const conserto = String(req.body?.conserto || "sem-conserto").replace(/[^0-9A-Za-z_-]/g, "");
      const produto = String(req.body?.produto || "sem-produto").replace(/[^0-9A-Za-z_-]/g, "");
      cb(null, `${conserto}_${produto}_${Date.now()}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, cb) => {
      const ok = /^image\/(jpeg|png|webp)$/i.test(file.mimetype || "");
      cb(ok ? null : new Error("Envie somente JPG, PNG ou WEBP."), ok);
    }
  });

  // As imagens ficam protegidas pela autenticação global já existente no index.js.
  app.get("/api/qualidade/fotos/arquivo/:arquivo", (req, res) => {
    const nome = path.basename(String(req.params.arquivo || ""));
    const arquivo = path.join(pastaFotos, nome);
    if (!fs.existsSync(arquivo)) return res.status(404).json({ ok:false, erro:"Foto não encontrada." });
    return res.sendFile(arquivo);
  });

  // Lista fotos já vinculadas ao conserto.
  app.get("/api/qualidade/:conserto/fotos", async (req, res) => {
    try {
      const conserto = String(req.params.conserto || "").trim();
      const r = await queryInventario(`
        SELECT *
        FROM qualidade_fotos
        WHERE TRIM(conserto::text) = $1
        ORDER BY criado_em, id
      `, [conserto], 15000);

      const fotos = (r.rows || []).map(x => ({
        ...x,
        url: x.arquivo ? `/api/qualidade/fotos/arquivo/${encodeURIComponent(path.basename(x.arquivo))}` : null
      }));
      res.json({ ok:true, fotos });
    } catch (e) {
      res.status(500).json({ ok:false, erro:e.message });
    }
  });

  // Upload: exige pelo menos uma foto.
  // Campos multipart: conserto, produto, defeito e fotos.
  app.post("/api/qualidade/fotos", upload.array("fotos", 10), async (req, res) => {
    const arquivos = req.files || [];
    try {
      const conserto = String(req.body?.conserto || "").trim();
      const produto = String(req.body?.produto || "").trim();
      const defeito = String(req.body?.defeito || "").trim();

      if (!conserto || !produto) {
        throw Object.assign(new Error("Conserto e produto são obrigatórios."), { status:400 });
      }
      if (!arquivos.length) {
        throw Object.assign(new Error("É obrigatória pelo menos uma foto do defeito."), { status:400 });
      }

      // Não duplica dados do Seta: somente referência + arquivo.
      // A tabela deve possuir: conserto, produto, arquivo, criado_em.
      // Se você criou também a coluna defeito, ela é preenchida automaticamente.
      const cols = await queryInventario(`
        SELECT LOWER(column_name) AS coluna
        FROM information_schema.columns
        WHERE table_schema='public' AND LOWER(table_name)='qualidade_fotos'
      `, [], 15000);
      const existentes = new Set((cols.rows || []).map(x => x.coluna));

      for (const f of arquivos) {
        if (existentes.has("defeito")) {
          await queryInventario(`
            INSERT INTO qualidade_fotos (conserto, produto, arquivo, defeito, criado_em)
            VALUES ($1,$2,$3,$4,NOW())
          `, [conserto, produto, f.filename, defeito], 15000);
        } else {
          await queryInventario(`
            INSERT INTO qualidade_fotos (conserto, produto, arquivo, criado_em)
            VALUES ($1,$2,$3,NOW())
          `, [conserto, produto, f.filename], 15000);
        }
      }

      res.json({ ok:true, quantidade:arquivos.length, mensagem:"Fotos gravadas com sucesso." });
    } catch (e) {
      for (const f of arquivos) {
        try { fs.unlinkSync(f.path); } catch (_) {}
      }
      res.status(e.status || 500).json({ ok:false, erro:e.message });
    }
  });

  app.delete("/api/qualidade/fotos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id || 0);
      if (!id) return res.status(400).json({ok:false, erro:"Foto inválida."});

      const r = await queryInventario(
        `DELETE FROM qualidade_fotos WHERE id=$1 RETURNING arquivo`,
        [id], 15000
      );
      if (!r.rows.length) return res.status(404).json({ok:false, erro:"Foto não encontrada."});

      const arquivo = r.rows[0].arquivo;
      if (arquivo) {
        try { fs.unlinkSync(path.join(pastaFotos, path.basename(arquivo))); } catch (_) {}
      }
      res.json({ok:true});
    } catch (e) {
      res.status(500).json({ok:false, erro:e.message});
    }
  });

  // PDF fotográfico. Dados cadastrais continuam vindo do Seta quando disponíveis.
  app.get("/api/qualidade/:conserto/pdf", async (req, res) => {
    try {
      const conserto = String(req.params.conserto || "").trim();

      const [rc, rf] = await Promise.all([
        querySafe(`SELECT * FROM consertos WHERE TRIM(codigo::text)=$1 LIMIT 1`, [conserto], 30000),
        queryInventario(`SELECT * FROM qualidade_fotos WHERE TRIM(conserto::text)=$1 ORDER BY criado_em,id`, [conserto], 15000)
      ]);

      if (!rc.rows.length) return res.status(404).json({ok:false, erro:"Conserto não encontrado no Seta."});
      if (!rf.rows.length) return res.status(400).json({ok:false, erro:"Este conserto ainda não possui foto."});

      const c = rc.rows[0];
      const doc = new PDFDocument({size:"A4", margin:42});
      res.setHeader("Content-Type","application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="qualidade-${conserto}.pdf"`);
      doc.pipe(res);

      doc.fontSize(20).text("JP • CONTROLE DE QUALIDADE", {align:"center"});
      doc.moveDown(.4).fontSize(11).text(`Conserto: ${conserto}`);
      if (c.produto != null) doc.text(`Produto: ${c.produto}`);
      if (c.defeito != null) doc.text(`Defeito: ${c.defeito}`);
      if (c.empresa != null) doc.text(`Empresa: ${c.empresa}`);
      doc.moveDown();

      for (const foto of rf.rows) {
        const arq = foto.arquivo ? path.join(pastaFotos, path.basename(foto.arquivo)) : "";
        if (!arq || !fs.existsSync(arq)) continue;
        if (doc.y > 500) doc.addPage();
        doc.fontSize(10).text(`Evidência ${foto.id}${foto.defeito ? " • "+foto.defeito : ""}`);
        try {
          doc.image(arq, {fit:[500,330], align:"center"});
        } catch (_) {
          doc.text("Imagem não pôde ser incorporada ao PDF.");
        }
        doc.moveDown();
      }
      doc.end();
    } catch (e) {
      if (!res.headersSent) res.status(500).json({ok:false, erro:e.message});
      else res.end();
    }
  });
}

module.exports = { criarRotasQualidade };
