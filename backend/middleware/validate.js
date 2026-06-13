const CATEGORIAS = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Outros',
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateDespesa(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Dados inválidos.'] };
  }

  const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
  if (!descricao || descricao.length > 255) {
    errors.push('Descrição deve ter entre 1 e 255 caracteres.');
  }

  const valor = Number(body.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    errors.push('Valor deve ser um número maior que zero.');
  } else if (!/^\d+(\.\d{1,2})?$/.test(String(body.valor))) {
    errors.push('Valor deve ter no máximo 2 casas decimais.');
  }

  const categoria = typeof body.categoria === 'string' ? body.categoria.trim() : '';
  if (!CATEGORIAS.includes(categoria)) {
    errors.push('Categoria inválida.');
  }

  const data = typeof body.data === 'string' ? body.data.trim() : '';
  if (!isValidDate(data)) {
    errors.push('Data inválida. Use o formato YYYY-MM-DD.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      descricao,
      valor: Math.round(valor * 100) / 100,
      categoria,
      data,
    },
  };
}

function validateMes(mes) {
  if (!mes) return { valid: true, mes: null };
  if (!/^\d{4}-\d{2}$/.test(mes)) {
    return { valid: false, error: 'Mês inválido. Use o formato YYYY-MM.' };
  }
  const [year, month] = mes.split('-').map(Number);
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Mês inválido. Use o formato YYYY-MM.' };
  }
  return { valid: true, mes, year, month };
}

function validateCategoria(categoria) {
  if (!categoria) return { valid: true, categoria: null };
  if (!CATEGORIAS.includes(categoria)) {
    return { valid: false, error: 'Categoria inválida.' };
  }
  return { valid: true, categoria };
}

function validateId(id) {
  const parsed = parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { valid: false, error: 'ID inválido.' };
  }
  return { valid: true, id: parsed };
}

function validateMensagem(mensagem) {
  if (typeof mensagem !== 'string') {
    return { valid: false, error: 'Mensagem inválida.' };
  }
  const trimmed = mensagem.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    return { valid: false, error: 'Mensagem deve ter entre 1 e 2000 caracteres.' };
  }
  return { valid: true, mensagem: trimmed };
}

module.exports = {
  CATEGORIAS,
  validateDespesa,
  validateMes,
  validateCategoria,
  validateId,
  validateMensagem,
};
