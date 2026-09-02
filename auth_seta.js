"use strict";

const crypto = require("crypto");
const { normalizarGrupo, moduloDaRota } = require("./permissoes_modulos");
const { extrairEmpresas } = require("./acesso_empresas");

function base64UrlEncode(valor) {
  return Buffer.from(String(valor), "utf8").toString("base64url");
}

function base64UrlDecode(valor) {
  return Buffer.from(String(valor), "base64url").toString("utf8");
}

function assinatura(conteudo, segredo) {
  return crypto.createHmac("sha256", segredo).update(conteudo).digest("base64url");
}

function criarToken(payload, segredo, duracaoSegundos) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = {
    ...payload,
    iat: agora,
    exp: agora + duracaoSegundos
  };
  const parte = base64UrlEncode(JSON.stringify(corpo));
  return `${parte}.${assinatura(parte, segredo)}`;
}

function lerToken(token, segredo) {
  try {
    const [parte, ass] = String(token || "").split(".");
    if (!parte || !ass) return null;
    const esperada = assinatura(parte, segredo);
    const a = Buffer.from(ass);
    const b = Buffer.from(esperada);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(base64UrlDecode(parte));
    const agora = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= agora) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookiesDaRequisicao(req) {
  const resultado = {};
  const bruto = String(req.headers.cookie || "");
  for (const item of bruto.split(";")) {
    const pos = item.indexOf("=");
    if (pos < 0) continue;
    const chave = item.slice(0, pos).trim();
    const valor = item.slice(pos + 1).trim();
    if (chave) resultado[chave] = decodeURIComponent(valor);
  }
  return resultado;
}

function codificarSenhaSetaAtual(senha) {
  // Conversão completa observada nas senhas atuais do ERP Seta.
  // Alfabeto de armazenamento identificado:
  // 0=V, 1=W, 2=E, 3=y, 4=t, 5=r, 6=e, 7=R, 8=T, 9=1
  //
  // Exemplo confirmado no banco:
  // senha digitada 1972 -> senha armazenada W1RE
  const mapa = {
    "0": "V",
    "1": "W",
    "2": "E",
    "3": "y",
    "4": "t",
    "5": "r",
    "6": "e",
    "7": "R",
    "8": "T",
    "9": "1"
  };

  return String(senha || "")
    .trim()
    .split("")
    .map(ch => Object.prototype.hasOwnProperty.call(mapa, ch) ? mapa[ch] : ch)
    .join("");
}

function codificarSenhaSetaAntiga(senha) {
  const mapa = {
    "0": "V", "1": "W", "2": "E", "3": "y", "4": "t",
    "5": "U", "6": "e", "7": "r", "8": "q", "9": "p"
  };
  return String(senha || "").trim().split("").map(ch => mapa[ch] || ch).join("");
}

function base64Padrao(valor) {
  return Buffer.from(String(valor || ""), "utf8").toString("base64");
}

function base64Url(valor) {
  return Buffer.from(String(valor || ""), "utf8").toString("base64url");
}

function tentarDecodificarBase64(valor) {
  const bruto = String(valor || "").trim();
  if (!bruto) return "";

  try {
    const normalizado = bruto
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const resto = normalizado.length % 4;
    const completo = resto ? normalizado + "=".repeat(4 - resto) : normalizado;
    const decodificado = Buffer.from(completo, "base64").toString("utf8");

    // Evita aceitar lixo binário como uma senha válida.
    if (!decodificado || /[\u0000-\u0008\u000E-\u001F]/.test(decodificado)) {
      return "";
    }

    return decodificado;
  } catch {
    return "";
  }
}

function decodificarSenhaSetaAntiga(valor) {
  const mapaInverso = {
    "V": "0", "W": "1", "E": "2", "y": "3", "t": "4",
    "U": "5", "e": "6", "r": "7", "q": "8", "p": "9"
  };

  return String(valor || "")
    .split("")
    .map(ch => Object.prototype.hasOwnProperty.call(mapaInverso, ch)
      ? mapaInverso[ch]
      : ch
    )
    .join("");
}

function senhaSetaConfere(senhaDigitada, senhaArmazenada) {
  const digitada = String(senhaDigitada || "").trim();
  const armazenada = String(senhaArmazenada || "").trim();

  if (!digitada || !armazenada) return false;

  const atual = codificarSenhaSetaAtual(digitada);
  const antiga = codificarSenhaSetaAntiga(digitada);
  const b64Digitada = base64Padrao(digitada);
  const b64UrlDigitada = base64Url(digitada);
  const b64Antiga = base64Padrao(antiga);
  const b64UrlAntiga = base64Url(antiga);

  // Formatos encontrados em diferentes versões/cadastros do Seta.
  const possibilidades = new Set([
    digitada,
    atual,
    antiga,
    b64Digitada,
    b64UrlDigitada,
    b64Antiga,
    b64UrlAntiga,
    codificarSenhaSetaAntiga(b64Digitada),
    codificarSenhaSetaAntiga(b64UrlDigitada)
  ]);

  if (possibilidades.has(armazenada)) return true;

  // Tenta uma e duas camadas de Base64.
  const nivel1 = tentarDecodificarBase64(armazenada);
  const nivel2 = nivel1 ? tentarDecodificarBase64(nivel1) : "";

  const valoresDecodificados = [nivel1, nivel2].filter(Boolean);

  for (const valor of valoresDecodificados) {
    if (valor === digitada) return true;
    if (valor === antiga) return true;
    if (decodificarSenhaSetaAntiga(valor) === digitada) return true;
  }

  // Também cobre valor antigo decodificado diretamente.
  if (decodificarSenhaSetaAntiga(armazenada) === digitada) return true;

  return false;
}

function criarAuthSeta(opcoes = {}) {
  const servicoPermissoes = opcoes.servicoPermissoes;
  if (!servicoPermissoes) {
    throw new Error("auth_seta: informe servicoPermissoes.");
  }
  const segredo = String(opcoes.segredo || process.env.AUTH_SETA_SECRET || "").trim();
  if (!segredo || segredo.length < 24) {
    console.warn("⚠️ AUTH_SETA_SECRET não definido ou muito curto. Configure uma chave forte no .env.");
  }

  const chave = segredo || "JP-SISTEMA-ALTERE-ESTA-CHAVE-EM-PRODUCAO";
  const cookieNome = "jp_sessao_seta";
  const duracaoSegundos = Math.max(1800, Number(opcoes.duracaoSegundos || 8 * 60 * 60));
  const producao = String(process.env.NODE_ENV || "").toLowerCase() === "production";

  let colunaEmpresasAcessoCache = "";

  function escaparIdentificador(nome) {
    return `"${String(nome || "").replace(/"/g, '""')}"`;
  }

  async function descobrirColunaEmpresasAcesso(querySafe) {
    if (colunaEmpresasAcessoCache) return colunaEmpresasAcessoCache;

    const r = await querySafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema='public'
        AND table_name='pessoas'
        AND (
          LOWER(column_name) IN (
            'empresasacesso',
            'empresas_acesso',
            'empresaacesso',
            'empresa_acesso',
            'empresasvinculo',
            'empresas_vinculo'
          )
          OR (
            LOWER(column_name) LIKE '%empresa%'
            AND LOWER(column_name) LIKE '%acesso%'
          )
        )
      ORDER BY
        CASE LOWER(column_name)
          WHEN 'empresasacesso' THEN 1
          WHEN 'empresas_acesso' THEN 2
          WHEN 'empresaacesso' THEN 3
          WHEN 'empresa_acesso' THEN 4
          ELSE 10
        END
      LIMIT 1
    `, [], 30000);

    const coluna = String(r.rows?.[0]?.column_name || "").trim();
    if (!coluna) {
      throw new Error(
        'Não foi encontrada na tabela pessoas a coluna "Empresas de Acesso".'
      );
    }

    colunaEmpresasAcessoCache = coluna;
    console.log("[AUTH SETA] Campo Empresas de Acesso:", coluna);
    return coluna;
  }

  const rotasPublicas = [
    /^\/login(?:\.html)?$/i,
    /^\/login\.(?:js|css)$/i,
    /^\/api\/auth\/(?:login|logout|me|empresas)$/i,
    /^\/favicon\.ico$/i
  ];

  function tokenDaRequisicao(req) {
    return cookiesDaRequisicao(req)[cookieNome] || "";
  }

  function usuarioDaRequisicao(req) {
    return lerToken(tokenDaRequisicao(req), chave);
  }

  function enviarCookie(res, token) {
    const partes = [
      `${cookieNome}=${encodeURIComponent(token)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${duracaoSegundos}`
    ];
    if (producao) partes.push("Secure");
    res.setHeader("Set-Cookie", partes.join("; "));
  }

  function apagarCookie(res) {
    const partes = [
      `${cookieNome}=`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0"
    ];
    if (producao) partes.push("Secure");
    res.setHeader("Set-Cookie", partes.join("; "));
  }

  function negar(req, res, status, mensagem) {
    // APIs continuam respondendo JSON, sem alterar a sessão.
    if (req.path.startsWith("/api/")) {
      return res.status(status).json({
        ok: false,
        erro: mensagem
      });
    }

    // Sessão realmente expirada: aí sim volta ao login.
    if (Number(status) === 401) {
      const destino = encodeURIComponent(req.originalUrl || "/home.html");
      return res.redirect(`/login.html?destino=${destino}`);
    }

    /*
     * Usuário autenticado, porém sem permissão:
     * NÃO derruba a sessão e NÃO volta para o login.
     * Mostra um aviso padronizado para qualquer módulo do JP Sistema.
     */
    if (Number(status) === 403) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Acesso não autorizado</title>
          <style>
            *{
              box-sizing:border-box;
            }

            body{
              margin:0;
              min-height:100vh;
              display:grid;
              place-items:center;
              padding:24px;
              background:#061426;
              color:#f5f8ff;
              font-family:Inter,Segoe UI,Arial,sans-serif;
            }

            .acesso-negado{
              width:min(720px,100%);
              padding:42px 36px;
              border:1px solid #29486e;
              border-radius:22px;
              background:#102644;
              box-shadow:0 24px 70px rgba(0,0,0,.28);
            }

            .acesso-negado h1{
              margin:0 0 20px;
              font-size:32px;
              line-height:1.15;
              letter-spacing:-.02em;
            }

            .acesso-negado p{
              margin:0;
              color:#bfd0e8;
              font-size:19px;
              line-height:1.65;
            }

            .acesso-negado .detalhe{
              margin-top:14px;
              color:#89a9d1;
              font-size:14px;
            }

            .acesso-negado a{
              display:inline-flex;
              align-items:center;
              justify-content:center;
              margin-top:30px;
              min-height:54px;
              padding:0 24px;
              border-radius:12px;
              background:linear-gradient(180deg,#3980ff,#2867ea);
              color:#fff;
              font-size:18px;
              font-weight:800;
              text-decoration:none;
              box-shadow:0 10px 24px rgba(40,103,234,.24);
            }

            .acesso-negado a:hover{
              filter:brightness(1.06);
            }

            @media(max-width:600px){
              .acesso-negado{
                padding:30px 24px;
              }

              .acesso-negado h1{
                font-size:27px;
              }

              .acesso-negado p{
                font-size:17px;
              }

              .acesso-negado a{
                width:100%;
              }
            }
          </style>
        </head>
        <body>
          <main class="acesso-negado">
            <h1>Acesso não autorizado</h1>

            <p>
              Seu grupo não possui permissão para acessar este módulo.
              Solicite a liberação na Central de Permissões.
            </p>

            <div class="detalhe">
              ${String(mensagem || "Acesso não permitido.")}
            </div>

            <a href="/home.html">Voltar ao JP Dashboard</a>
          </main>
        </body>
        </html>
      `);
    }

    // Qualquer outro bloqueio de página mantém comportamento seguro.
    return res.status(status || 403).send("Acesso não autorizado.");
  }

  async function middlewareGlobal(req, res, next) {
    try {
      const caminho = req.path || "";
      if (rotasPublicas.some(regra => regra.test(caminho))) return next();

      const usuario = usuarioDaRequisicao(req);
      if (!usuario) {
        return negar(req, res, 401, "Sessão expirada. Faça login novamente.");
      }

      req.usuarioSeta = usuario;

      const modulo = moduloDaRota(caminho);

      /*
       * Permissão consultada AO VIVO.
       * Não depende mais apenas da lista gravada no token no momento do login.
       * Assim, quando o administrador altera uma permissão, ela passa a valer
       * imediatamente sem exigir logout/login do usuário.
       */
      if (modulo) {
        const permitido = await servicoPermissoes.grupoTemModulo(
          usuario.grupo,
          modulo
        );

        if (!permitido) {
          return negar(
            req,
            res,
            403,
            `Seu perfil não possui acesso ao módulo ${modulo}.`
          );
        }
      }

      return next();

    } catch (erro) {
      console.error("Erro ao validar permissão da sessão:", erro);

      if (req.path.startsWith("/api/")) {
        return res.status(500).json({
          ok:false,
          erro:"Não foi possível validar a permissão de acesso."
        });
      }

      return res.status(500).send("Não foi possível validar a permissão de acesso.");
    }
  }

  function exigirModulo(modulo) {
    return async (req, res, next) => {
      try {
        const usuario = req.usuarioSeta || usuarioDaRequisicao(req);

        if (!usuario) {
          return negar(req, res, 401, "Sessão expirada. Faça login novamente.");
        }

        const permitido = await servicoPermissoes.grupoTemModulo(
          usuario.grupo,
          modulo
        );

        if (!permitido) {
          return negar(
            req,
            res,
            403,
            "Usuário sem permissão para acessar este módulo."
          );
        }

        req.usuarioSeta = usuario;
        return next();

      } catch (erro) {
        console.error("Erro exigirModulo:", erro);

        return res.status(500).json({
          ok:false,
          erro:"Não foi possível validar a permissão do módulo."
        });
      }
    };
  }

  function exigirGrupoAdministrador(req, res, next) {
    const usuario = req.usuarioSeta || usuarioDaRequisicao(req);
    if (!usuario) return negar(req, res, 401, "Sessão expirada. Faça login novamente.");
    if (normalizarGrupo(usuario.grupo) !== "02") {
      return negar(req, res, 403, "Somente o grupo ADMINISTRADOR pode configurar permissões.");
    }
    req.usuarioSeta = usuario;
    next();
  }

  function registrarRotas({ app, querySafe }) {
    if (!app || typeof querySafe !== "function") {
      throw new Error("auth_seta: informe app e querySafe.");
    }

    app.post("/api/auth/login", async (req, res) => {
      try {
        const identificacao = String(req.body?.usuario || "").trim();
        const senhaDigitada = String(req.body?.senha || "").trim();

        if (!identificacao || !senhaDigitada) {
          return res.status(400).json({ ok: false, erro: "Informe usuário e senha." });
        }

        // IDENTIFICAÇÃO DO FUNCIONÁRIO
        // Aceita:
        // 1632       -> encontra 00001632 ou código alfanumérico contendo 1632
        // 00001632   -> encontra o mesmo funcionário
        // PATRI      -> encontra PATRICIA pelo nome/apelido
        // ABC1632    -> também permite localizar pelo código alfanumérico
        const identificacaoNormalizada = identificacao
          .trim()
          .toUpperCase();

        const somenteNumeros = identificacaoNormalizada.replace(/\D/g, "");

        const codigoNumerico = somenteNumeros
          ? String(Number.parseInt(somenteNumeros, 10))
          : "";

        // Nome, apelido e código aceitam pesquisa parcial.
        const pesquisaParcial = `%${identificacao}%`;

        // Descobre o nome real da coluna "Empresas de Acesso" no Seta.
        const colunaEmpresasAcesso = await descobrirColunaEmpresasAcesso(querySafe);
        const campoEmpresasAcesso =
          `TRIM(COALESCE(p.${escaparIdentificador(colunaEmpresasAcesso)}::text,''))`;

        // Primeiro localiza os funcionários candidatos. A comparação da senha
        // é feita no servidor, sem expor a senha armazenada no Seta.
        const r = await querySafe(`
          SELECT
            TRIM(p.codigo::text) AS codigo,
            TRIM(
              COALESCE(
                NULLIF(p.apelido::text,''),
                NULLIF(p.nome::text,''),
                p.codigo::text
              )
            ) AS nome,
            TRIM(COALESCE(p.apelido::text,'')) AS apelido,
            TRIM(COALESCE(p.nome::text,'')) AS nome_completo,
            LPAD(RIGHT(TRIM(COALESCE(p.empresa::text,'')),2),2,'0') AS empresa,
            LPAD(TRIM(COALESCE(p.grupo::text,'')),2,'0') AS grupo,
            UPPER(TRIM(COALESCE(fg.descricao::text,''))) AS grupo_descricao,
            ${campoEmpresasAcesso} AS empresas_acesso_raw,
            -- Mantém AS DUAS senhas separadas.
            -- Alguns funcionários possuem registro antigo em
            -- funcionarios_controlesenha e senha atual em pessoas.
            TRIM(COALESCE(cs.senha::text,'')) AS senha_controle,
            TRIM(COALESCE(p.senha::text,'')) AS senha_pessoas,
            cs.ultima_atualizacao AS senha_atualizada_em
          FROM pessoas p
          LEFT JOIN funcionarios_grupos fg
            ON TRIM(fg.codigo::text) = TRIM(p.grupo::text)
          LEFT JOIN LATERAL (
            SELECT
              fcs.senha,
              fcs.ultima_atualizacao
            FROM funcionarios_controlesenha fcs
            WHERE TRIM(fcs.codigofuncionario::text) = TRIM(p.codigo::text)
            ORDER BY
              fcs.ultima_atualizacao DESC NULLS LAST,
              fcs.codigo DESC
            LIMIT 1
          ) cs ON TRUE
          WHERE COALESCE(p.funcionario,false) = TRUE
            AND (
              -- Procura parte do apelido
              COALESCE(TRIM(p.apelido::text),'') ILIKE $1

              -- Procura parte do nome
              OR COALESCE(TRIM(p.nome::text),'') ILIKE $1

              -- Procura diretamente no código, inclusive alfanumérico
              OR COALESCE(TRIM(p.codigo::text),'') ILIKE $1

              -- Se foi informado número, remove letras e outros caracteres
              -- do código armazenado no Seta e compara pelo valor numérico.
              OR (
                $2 <> ''
                AND NULLIF(
                  REGEXP_REPLACE(
                    COALESCE(p.codigo::text,''),
                    '[^0-9]',
                    '',
                    'g'
                  ),
                  ''
                ) IS NOT NULL
                AND NULLIF(
                  REGEXP_REPLACE(
                    COALESCE(p.codigo::text,''),
                    '[^0-9]',
                    '',
                    'g'
                  ),
                  ''
                )::bigint = $2::bigint
              )
            )
          ORDER BY
            CASE
              WHEN $2 <> '' AND NULLIF(REGEXP_REPLACE(COALESCE(p.codigo::text,''), '[^0-9]', '', 'g'),'')::bigint = $2::bigint THEN 0
              WHEN UPPER(TRIM(COALESCE(p.apelido::text,''))) = UPPER($3) THEN 1
              WHEN UPPER(TRIM(COALESCE(p.nome::text,''))) = UPPER($3) THEN 2
              ELSE 3
            END,
            p.codigo
          LIMIT 50
        `, [pesquisaParcial, codigoNumerico, identificacao], 30000);

        const candidatos = r.rows || [];

        // IMPORTANTE:
        // Não escolhe mais apenas uma origem de senha com COALESCE.
        // Valida contra a senha de funcionarios_controlesenha E contra
        // a senha da própria tabela pessoas.
        const row = candidatos.find(item => {
          const confereControle = senhaSetaConfere(
            senhaDigitada,
            item.senha_controle
          );

          const conferePessoas = senhaSetaConfere(
            senhaDigitada,
            item.senha_pessoas
          );

          return confereControle || conferePessoas;
        });

        if (!row) {
          console.warn("[AUTH SETA] Login não validado", {
            identificacao,
            candidatosEncontrados: candidatos.length,
            candidatos: candidatos.map(item => ({
              codigo: item.codigo,
              nome: item.nome,
              apelido: item.apelido,
              grupo: item.grupo,
              senhaAtualizadaEm: item.senha_atualizada_em,
              temSenhaControle: Boolean(String(item.senha_controle || "").trim()),
              temSenhaPessoas: Boolean(String(item.senha_pessoas || "").trim()),
              tamanhoSenhaControle: String(item.senha_controle || "").trim().length,
              tamanhoSenhaPessoas: String(item.senha_pessoas || "").trim().length
            }))
          });

          return res.status(403).json({
            ok: false,
            erro: "Usuário ou senha do Seta inválidos."
          });
        }

        delete row.senha_controle;
        delete row.senha_pessoas;
        delete row.senha_atualizada_em;
        delete row.apelido;
        delete row.nome_completo;
        const grupo = normalizarGrupo(row.grupo);
        const modulos = await servicoPermissoes.modulosDoGrupo(grupo);

        const empresasAcessoRaw = String(row.empresas_acesso_raw || "").trim();
        const empresasAcesso = extrairEmpresas(empresasAcessoRaw);
        const todasEmpresas = empresasAcessoRaw === "";

        delete row.empresas_acesso_raw;

        const usuario = {
          codigo: String(row.codigo || "").trim(),
          nome: String(row.nome || "").trim(),
          empresa: String(row.empresa || "").trim(),
          grupo,
          grupoDescricao: String(row.grupo_descricao || "").trim(),
          empresasAcesso,
          todasEmpresas,
          modulos
        };

        const token = criarToken(usuario, chave, duracaoSegundos);
        enviarCookie(res, token);

        return res.json({ ok: true, usuario });
      } catch (e) {
        console.error("Erro no login Seta:", e);
        return res.status(500).json({ ok: false, erro: "Não foi possível validar o login no Seta." });
      }
    });

    app.get("/api/auth/me", (req, res) => {
      const usuario = usuarioDaRequisicao(req);
      if (!usuario) return res.status(401).json({ ok: false, erro: "Sessão expirada." });
      return res.json({ ok: true, usuario });
    });

    app.get("/api/auth/empresas", (req, res) => {
      const usuario = usuarioDaRequisicao(req);
      if (!usuario) {
        return res.status(401).json({ ok:false, erro:"Sessão expirada." });
      }

      return res.json({
        ok:true,
        todasEmpresas:Boolean(usuario.todasEmpresas),
        empresas:Array.isArray(usuario.empresasAcesso) ? usuario.empresasAcesso : []
      });
    });

    app.post("/api/auth/logout", (req, res) => {
      apagarCookie(res);
      return res.json({ ok: true });
    });
  }

  return {
    middlewareGlobal,
    registrarRotas,
    exigirModulo,
    exigirGrupoAdministrador,
    usuarioDaRequisicao
  };
}

module.exports = { criarAuthSeta };
