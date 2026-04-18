const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(FRONTEND_DIR));

const logger = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data || ""),
  warn: (msg, data) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data || ""),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err?.message || err || ""),
};

const ESPECIES_VALIDAS = ["cao", "gato"];
const PORTES_VALIDOS = ["Pequeno", "Médio", "Grande"];
const TAMANO_MAXIMO_IMAGEM = 2 * 1024 * 1024;
const TAMANHO_MAXIMO_NOME = 100;
const TAMANHO_MAXIMO_DESCRICAO = 500;
const TAMANHO_MINIMO_NOME = 3;
const TAMANHO_MAXIMO_TELEFONE = 20;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL não está definida. Crie um arquivo .env na raiz do projeto " +
      "com DATABASE_URL=postgresql://... (sem espaço depois do =)."
  );
  process.exit(1);
}

const useSsl = !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");
const allowSelfSignedCert = process.env.ALLOW_SELF_SIGNED_CERT === "true";

const sslConfig = useSsl
  ? allowSelfSignedCert
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: true }
  : false;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS animais (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        especie VARCHAR(50) NOT NULL,
        porte VARCHAR(50) NOT NULL,
        descricao TEXT,
        foto TEXT
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS interesses_adocao (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        animal_interesse VARCHAR(255),
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    logger.info("Banco de dados inicializado - tabelas 'animais' e 'interesses_adocao' prontas");
  } catch (err) {
    logger.error("Erro ao inicializar banco de dados", err);
    throw err;
  }
}

app.post("/interesses", async (req, res) => {
  try {
    const { nome, telefone, animalInteresse } = req.body;

    logger.info("POST /interesses - Recebido novo interesse de adoção");

    if (typeof nome !== "string" || typeof telefone !== "string") {
      logger.warn("POST /interesses - Tipos de dados inválidos", {
        nome: typeof nome,
        telefone: typeof telefone,
      });
      return res.status(400).json({
        erro: "Campos 'nome' e 'telefone' devem ser strings.",
      });
    }

    if (animalInteresse !== undefined && typeof animalInteresse !== "string") {
      logger.warn("POST /interesses - animalInteresse inválido", {
        animalInteresse: typeof animalInteresse,
      });
      return res.status(400).json({
        erro: "Campo 'animalInteresse' deve ser string.",
      });
    }

    const nomeTrimmed = nome.trim();
    const telefoneTrimmed = telefone.trim();
    const animalInteresseTrimmed = (animalInteresse || "").trim();

    if (!nomeTrimmed || !telefoneTrimmed) {
      logger.warn("POST /interesses - Campos obrigatórios vazios");
      return res.status(400).json({
        erro: "Campos 'nome' e 'telefone' não podem estar vazios.",
      });
    }

    if (nomeTrimmed.length < TAMANHO_MINIMO_NOME || nomeTrimmed.length > TAMANHO_MAXIMO_NOME) {
      logger.warn("POST /interesses - Nome fora do tamanho permitido");
      return res.status(400).json({
        erro: `Nome deve ter entre ${TAMANHO_MINIMO_NOME} e ${TAMANHO_MAXIMO_NOME} caracteres.`,
      });
    }

    if (telefoneTrimmed.length > TAMANHO_MAXIMO_TELEFONE) {
      logger.warn("POST /interesses - Telefone muito longo");
      return res.status(400).json({
        erro: `Telefone não pode exceder ${TAMANHO_MAXIMO_TELEFONE} caracteres.`,
      });
    }

    const result = await pool.query(
      `INSERT INTO interesses_adocao (nome, telefone, animal_interesse)
       VALUES ($1, $2, $3)
       RETURNING id, nome, telefone, animal_interesse AS "animalInteresse", criado_em AS "criadoEm"`,
      [nomeTrimmed, telefoneTrimmed, animalInteresseTrimmed || null]
    );

    logger.info(`POST /interesses - Interesse salvo com sucesso (ID: ${result.rows[0].id})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error("POST /interesses - Erro ao salvar interesse", err);
    res.status(500).json({ erro: "Não foi possível salvar o interesse de adoção." });
  }
});

app.post("/animais", async (req, res) => {
  try {
    const { nome, especie, porte, descricao, foto } = req.body;

    logger.info("POST /animais - Recebido novo cadastro de animal");

    if (typeof nome !== "string" || typeof especie !== "string" || typeof porte !== "string") {
      logger.warn("POST /animais - Tipos de dados inválidos", { nome: typeof nome, especie: typeof especie, porte: typeof porte });
      return res.status(400).json({
        erro: "Campos 'nome', 'especie' e 'porte' devem ser strings.",
      });
    }

    const nomeTrimmed = nome.trim();
    const especieTrimmed = especie.trim();
    const porteTrimmed = porte.trim();

    if (!nomeTrimmed || !especieTrimmed || !porteTrimmed) {
      logger.warn("POST /animais - Campos obrigatórios vazios");
      return res.status(400).json({
        erro: "Campos 'nome', 'especie' e 'porte' não podem estar vazios.",
      });
    }

    if (nomeTrimmed.length < TAMANHO_MINIMO_NOME) {
      logger.warn(`POST /animais - Nome muito curto (mín ${TAMANHO_MINIMO_NOME} caracteres)`);
      return res.status(400).json({
        erro: `Nome deve ter no mínimo ${TAMANHO_MINIMO_NOME} caracteres.`,
      });
    }

    if (nomeTrimmed.length > TAMANHO_MAXIMO_NOME) {
      logger.warn(`POST /animais - Nome muito longo (máx ${TAMANHO_MAXIMO_NOME} caracteres)`);
      return res.status(400).json({
        erro: `Nome não pode exceder ${TAMANHO_MAXIMO_NOME} caracteres.`,
      });
    }

    if (!ESPECIES_VALIDAS.includes(especieTrimmed)) {
      logger.warn(`POST /animais - Espécie inválida: '${especieTrimmed}'`);
      return res.status(400).json({
        erro: `Espécie deve ser uma das seguintes: ${ESPECIES_VALIDAS.join(", ")}.`,
      });
    }

    if (!PORTES_VALIDOS.includes(porteTrimmed)) {
      logger.warn(`POST /animais - Porte inválido: '${porteTrimmed}'`);
      return res.status(400).json({
        erro: `Porte deve ser um dos seguintes: ${PORTES_VALIDOS.join(", ")}.`,
      });
    }

    if (descricao && typeof descricao !== "string") {
      logger.warn("POST /animais - Descrição deve ser string");
      return res.status(400).json({
        erro: "Descrição deve ser texto.",
      });
    }

    const descricaoTrimmed = (descricao || "").trim();
    if (descricaoTrimmed.length > TAMANHO_MAXIMO_DESCRICAO) {
      logger.warn(`POST /animais - Descrição muito longa (máx ${TAMANHO_MAXIMO_DESCRICAO} caracteres)`);
      return res.status(400).json({
        erro: `Descrição não pode exceder ${TAMANHO_MAXIMO_DESCRICAO} caracteres.`,
      });
    }

    if (foto) {
      if (typeof foto !== "string") {
        logger.warn("POST /animais - Foto deve ser string em base64");
        return res.status(400).json({
          erro: "Foto deve ser em formato base64.",
        });
      }

      const estimatedSize = (foto.length * 3) / 4;
      if (estimatedSize > TAMANO_MAXIMO_IMAGEM) {
        logger.warn(`POST /animais - Imagem no tamanho excedido (${(estimatedSize / 1024 / 1024).toFixed(2)}MB max 2MB)`);
        return res.status(400).json({
          erro: "Imagem é muito grande. Máximo permitido: 2MB.",
        });
      }

      if (!foto.startsWith("data:image/")) {
        logger.warn("POST /animais - Formato de imagem inválido");
        return res.status(400).json({
          erro: "Imagem deve ser em formato válido (jpeg, png, etc).",
        });
      }
    } else {
      logger.warn("POST /animais - Foto obrigatória não fornecida");
      return res.status(400).json({
        erro: "Foto é obrigatória.",
      });
    }

    const result = await pool.query(
      `INSERT INTO animais (nome, especie, porte, descricao, foto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, especie, porte, descricao, foto`,
      [nomeTrimmed, especieTrimmed, porteTrimmed, descricaoTrimmed, foto]
    );

    logger.info(`POST /animais - Animal cadastrado com sucesso (ID: ${result.rows[0].id}, Nome: ${nomeTrimmed})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error("POST /animais - Erro ao salvar animal", err);
    res.status(500).json({ erro: "Não foi possível salvar o animal. Verifique os dados e tente novamente." });
  }
});

app.get("/animais", async (req, res) => {
  try {
    const especie = typeof req.query.especie === "string" ? req.query.especie.trim() : "";
    const porte = typeof req.query.porte === "string" ? req.query.porte.trim() : "";
    const nome = typeof req.query.nome === "string" ? req.query.nome.trim() : "";

    logger.info("GET /animais - Listando animais", { especie, porte, nome });

    const filtros = [];
    const valores = [];

    if (especie) {
      valores.push(especie);
      filtros.push(`LOWER(especie) = LOWER($${valores.length})`);
    }

    if (porte) {
      valores.push(porte);
      filtros.push(`LOWER(porte) = LOWER($${valores.length})`);
    }

    if (nome) {
      valores.push(`%${nome}%`);
      filtros.push(`nome ILIKE $${valores.length}`);
    }

    const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT id, nome, especie, porte, descricao, foto
       FROM animais
       ${whereClause}
       ORDER BY id ASC`,
      valores
    );
    logger.info(`GET /animais - Retornados ${result.rows.length} animal(is)`);
    res.json(result.rows);
  } catch (err) {
    logger.error("GET /animais - Erro ao listar animais", err);
    res.status(500).json({ erro: "Não foi possível listar os animais." });
  }
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    logger.info("GET /health - Servidor saudável");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error("GET /health - Problema na conexão com banco", err);
    res.status(503).json({ status: "error", message: "Banco de dados indisponível" });
  }
});

app.delete("/animais/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    logger.info(`DELETE /animais/:id - Tentando remover animal ID: ${id}`);

    if (Number.isNaN(id) || id < 1) {
      logger.warn(`DELETE /animais/:id - ID inválido fornecido: '${req.params.id}'`);
      return res.status(400).json({ erro: "ID deve ser um número válido e positivo." });
    }

    const checkResult = await pool.query("SELECT id FROM animais WHERE id = $1", [id]);
    if (checkResult.rows.length === 0) {
      logger.warn(`DELETE /animais/:id - Animal ID ${id} não encontrado`);
      return res.status(404).json({ erro: "Animal não encontrado." });
    }

    await pool.query("DELETE FROM animais WHERE id = $1", [id]);
    logger.info(`DELETE /animais/:id - Animal ID ${id} removido com sucesso`);
    res.json({ ok: true, message: "Animal removido com sucesso." });
  } catch (err) {
    logger.error(`DELETE /animais/:id - Erro ao remover animal ID ${req.params.id}`, err);
    res.status(500).json({ erro: "Não foi possível remover o animal." });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

async function start() {
  try {
    await initDb();

    const iniciarServidor = (porta, tentativasRestantes = 5) => {
      const server = app.listen(porta, () => {
        logger.info(`Servidor iniciado com sucesso em http://localhost:${porta}`);
        logger.info("PostgreSQL conectado e banco de dados pronto");
      });

      server.on("error", (err) => {
        if (err && err.code === "EADDRINUSE" && tentativasRestantes > 0) {
          const proximaPorta = porta + 1;
          logger.warn(`Porta ${porta} em uso. Tentando porta ${proximaPorta}...`);
          iniciarServidor(proximaPorta, tentativasRestantes - 1);
          return;
        }

        logger.error("Falha ao iniciar servidor", err);
        process.exit(1);
      });
    };

    iniciarServidor(PORT);
  } catch (err) {
    if (err && err.code === "ENOTFOUND") {
      logger.error(
        "Falha ao iniciar: hostname do banco não encontrado via DNS. Verifique DATABASE_URL no .env e se está ativo.",
        err
      );
    } else if (err && err.code === "ECONNREFUSED") {
      logger.error(
        "Falha ao iniciar: conexão recusada. Verifique se o banco de dados está rodando.",
        err
      );
    } else {
      logger.error("Falha ao iniciar servidor", err);
    }
    process.exit(1);
  }
}

start();
