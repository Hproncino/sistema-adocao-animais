const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL não está definida. Crie um arquivo .env na mesma pasta que server.js " +
      "com DATABASE_URL=postgresql://... (sem espaço depois do =)."
  );
  process.exit(1);
}

const useSsl =
  !databaseUrl.includes("localhost") && !databaseUrl.includes("127.0.0.1");

const sslConfig = useSsl
  ? process.env.NODE_ENV === "development" &&
    process.env.ALLOW_SELF_SIGNED_CERT === "true"
    ? { rejectUnauthorized: false }
    : true
  : false;

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS animais (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      especie VARCHAR(50) NOT NULL,
      porte VARCHAR(50) NOT NULL,
      descricao TEXT,
    const { nome, especie, porte, descricao, foto } = req.body;

    if (
      typeof nome !== "string" ||
      nome.trim() === "" ||
      typeof especie !== "string" ||
      especie.trim() === "" ||
      typeof porte !== "string" ||
      porte.trim() === ""
    ) {
      return res.status(400).json({
        erro:
          "Campos obrigatórios ausentes ou inválidos: 'nome', 'especie' e 'porte' devem ser preenchidos.",
      });
    }
    );
  `);
}

app.post("/animais", async (req, res) => {
  try {
    const { nome, especie, porte, descricao, foto } = req.body;
    const result = await pool.query(
      `INSERT INTO animais (nome, especie, porte, descricao, foto)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nome, especie, porte, descricao, foto`,
      [nome, especie, porte, descricao || "", foto || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível salvar o animal." });
  }
});

app.get("/animais", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, especie, porte, descricao, foto
       FROM animais
       ORDER BY id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível listar os animais." });
  }
});

app.delete("/animais/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ erro: "ID inválido." });
      return;
    }
    await pool.query("DELETE FROM animais WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível remover o animal." });
  }
});

async function start() {
  try {
    await initDb();
    app.listen(3000, () => {
      console.log("Servidor rodando em http://localhost:3000");
      console.log("PostgreSQL conectado");
    });
  } catch (err) {
    if (err && err.code === "ENOTFOUND") {
      console.error(
        "Falha ao iniciar: hostname do banco não encontrado via DNS.",
        "\nVerifique se o valor de DATABASE_URL está correto e ativo no Supabase.",
        "\nSe sua rede não tiver IPv6, use a string de Connection Pooling (IPv4) no Dashboard do Supabase."
      );
      console.error("Erro original:", err.message);
    } else {
      console.error("Falha ao iniciar:", err);
    }
    process.exit(1);
  }
}

start();
