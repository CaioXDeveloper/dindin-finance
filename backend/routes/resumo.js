const express = require('express');
const { query } = require('../db/pool');
const { validateMes } = require('../middleware/validate');

const router = express.Router();

function getCurrentMes() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthRange(mes) {
  const [year, month] = mes.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

router.get('/', async (req, res, next) => {
  try {
    const mesParam = req.query.mes || getCurrentMes();
    const mesValidation = validateMes(mesParam);
    if (!mesValidation.valid) {
      return res.status(400).json({ erro: mesValidation.error });
    }

    const { start, end } = getMonthRange(mesValidation.mes);

    const [totaisResult, maiorGastoResult, categoriaResult, ultimasResult] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(valor), 0) AS total_gasto
         FROM despesas
         WHERE data >= $1 AND data <= $2`,
        [start, end]
      ),
      query(
        `SELECT descricao, valor, categoria
         FROM despesas
         WHERE data >= $1 AND data <= $2
         ORDER BY valor DESC
         LIMIT 1`,
        [start, end]
      ),
      query(
        `SELECT categoria, SUM(valor) AS total
         FROM despesas
         WHERE data >= $1 AND data <= $2
         GROUP BY categoria
         ORDER BY total DESC`,
        [start, end]
      ),
      query(
        `SELECT id, descricao, valor, categoria, data, criado_em
         FROM despesas
         WHERE data >= $1 AND data <= $2
         ORDER BY data DESC, id DESC
         LIMIT 5`,
        [start, end]
      ),
    ]);

    const porCategoria = categoriaResult.rows.map((row) => ({
      categoria: row.categoria,
      total: parseFloat(row.total),
    }));

    const categoriaMaisPesada = porCategoria.length > 0 ? porCategoria[0] : null;
    const maiorGasto = maiorGastoResult.rows[0]
      ? {
          descricao: maiorGastoResult.rows[0].descricao,
          valor: parseFloat(maiorGastoResult.rows[0].valor),
          categoria: maiorGastoResult.rows[0].categoria,
        }
      : null;

    res.json({
      mes: mesValidation.mes,
      totalGasto: parseFloat(totaisResult.rows[0].total_gasto),
      maiorGasto,
      categoriaMaisPesada,
      porCategoria,
      ultimas5: ultimasResult.rows.map((row) => ({
        ...row,
        valor: parseFloat(row.valor),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
