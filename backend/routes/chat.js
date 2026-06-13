const express = require('express');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../db/pool');
const { validateMensagem } = require('../middleware/validate');

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 1 minuto.' },
});

const SYSTEM_PROMPT = `Você é o DinDin, assistente financeiro pessoal do usuário.
Responda SEMPRE em português brasileiro.
Seja direto, amigável e use emojis com moderação.
Formate relatórios com emojis, seções e totais claros.
Quando pedirem relatório, use tabelas e totais formatados.`;

router.post('/', chatLimiter, async (req, res, next) => {
  try {
    const validation = validateMensagem(req.body?.mensagem);
    if (!validation.valid) {
      return res.status(400).json({ erro: validation.error });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ erro: 'Serviço de IA não configurado.' });
    }

    const despesasResult = await query(
      `SELECT id, descricao, valor, categoria, data, criado_em
       FROM despesas
       ORDER BY data DESC`
    );

    const despesas = despesasResult.rows.map((row) => ({
      ...row,
      valor: parseFloat(row.valor),
    }));

    const prompt = `${SYSTEM_PROMPT}

GASTOS DO USUÁRIO:
${JSON.stringify(despesas, null, 2)}

PERGUNTA:
${validation.mensagem}`;

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const resposta = result.response.text();

    res.json({ resposta });
  } catch (err) {
    console.error('Erro no chat Gemini:', err.message);
    res.status(502).json({
      erro: 'Não foi possível obter resposta da IA. Tente novamente.',
    });
  }
});

module.exports = router;
