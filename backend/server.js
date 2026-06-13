require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./db/pool');
const despesasRouter = require('./routes/despesas');
const resumoRouter = require('./routes/resumo');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  })
);
app.use(express.json({ limit: '16kb' }));

app.use('/api/despesas', despesasRouter);
app.use('/api/resumo', resumoRouter);
app.use('/api/chat', chatRouter);

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, _next) => {
  console.error('Erro interno:', err.message);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL não configurada. Copie .env.example para .env');
    process.exit(1);
  }

  try {
    const now = await testConnection();
    console.log(`Conexão com PostgreSQL OK: ${now}`);
  } catch (err) {
    console.error('Falha ao conectar ao PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`DinDin.AI rodando em http://localhost:${PORT}`);
  });
}

start();
