const express = require('express');
const { query } = require('../db/pool');
const {
  validateDespesa,
  validateMes,
  validateCategoria,
  validateId,
} = require('../middleware/validate');

const router = express.Router();

function getMonthRange(mes) {
  const [year, month] = mes.split('-').map(Number);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

router.get('/', async (req, res, next) => {
  try {
    const mesValidation = validateMes(req.query.mes);
    if (!mesValidation.valid) {
      return res.status(400).json({ erro: mesValidation.error });
    }

    const categoriaValidation = validateCategoria(req.query.categoria);
    if (!categoriaValidation.valid) {
      return res.status(400).json({ erro: categoriaValidation.error });
    }

    let sql = 'SELECT id, descricao, valor, categoria, data, criado_em FROM despesas';
    const conditions = [];
    const params = [];
    let paramIndex = 0;

    if (mesValidation.mes) {
      const { start, end } = getMonthRange(mesValidation.mes);
      paramIndex += 1;
      params.push(start);
      const startIdx = paramIndex;
      paramIndex += 1;
      params.push(end);
      conditions.push(`data >= $${startIdx} AND data <= $${paramIndex}`);
    }

    if (categoriaValidation.categoria) {
      paramIndex += 1;
      params.push(categoriaValidation.categoria);
      conditions.push(`categoria = $${paramIndex}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY data DESC, id DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const validation = validateDespesa(req.body);
    if (!validation.valid) {
      return res.status(400).json({ erro: validation.errors[0] });
    }

    const { descricao, valor, categoria, data } = validation.data;
    const result = await query(
      `INSERT INTO despesas (descricao, valor, categoria, data)
       VALUES ($1, $2, $3, $4)
       RETURNING id, descricao, valor, categoria, data, criado_em`,
      [descricao, valor, categoria, data]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const validation = validateId(req.params.id);
    if (!validation.valid) {
      return res.status(400).json({ erro: validation.error });
    }

    const result = await query(
      'DELETE FROM despesas WHERE id = $1 RETURNING id',
      [validation.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Despesa não encontrada.' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
