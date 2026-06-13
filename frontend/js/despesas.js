let despesasCarregadas = [];

function clearFieldErrors() {
  ['descricao', 'valor', 'categoria', 'data'].forEach((field) => {
    const input = document.getElementById(field);
    const error = document.getElementById(`error${field.charAt(0).toUpperCase() + field.slice(1)}`);
    input?.classList.remove('error');
    if (error) {
      error.textContent = '';
      error.classList.add('hidden');
    }
  });
}

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(`error${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
  input?.classList.add('error');
  if (error) {
    error.textContent = message;
    error.classList.remove('hidden');
  }
}

function validateFormClient() {
  clearFieldErrors();
  let valid = true;

  const descricao = document.getElementById('descricao').value.trim();
  const valor = parseFloat(document.getElementById('valor').value);
  const categoria = document.getElementById('categoria').value;
  const data = document.getElementById('data').value;

  if (!descricao) {
    setFieldError('descricao', 'Informe uma descrição.');
    valid = false;
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    setFieldError('valor', 'Informe um valor maior que zero.');
    valid = false;
  }

  if (!categoria) {
    setFieldError('categoria', 'Selecione uma categoria.');
    valid = false;
  }

  if (!data) {
    setFieldError('data', 'Informe a data.');
    valid = false;
  }

  return valid;
}

function renderExpenseItem(despesa, showDelete = true) {
  const emoji = DinDin.getCategoriaEmoji(despesa.categoria);
  const dateISO = DinDin.formatDateISO(despesa.data);

  return `
    <li class="expense-item" role="listitem">
      <div class="expense-icon" aria-hidden="true">${emoji}</div>
      <div class="expense-info">
        <p class="expense-desc">${DinDin.escapeHtml(despesa.descricao)}</p>
        <p class="expense-meta">
          ${DinDin.escapeHtml(despesa.categoria)} · <time datetime="${dateISO}">${DinDin.formatDate(dateISO)}</time>
        </p>
      </div>
      <span class="expense-valor">${DinDin.formatBRL(despesa.valor)}</span>
      ${showDelete ? `
        <button type="button" class="expense-delete" data-id="${despesa.id}" aria-label="Excluir ${DinDin.escapeHtml(despesa.descricao)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
        </button>
      ` : ''}
    </li>
  `;
}

function bindDeleteButtons(container) {
  container.querySelectorAll('.expense-delete').forEach((btn) => {
    btn.addEventListener('click', () => deletarDespesa(Number(btn.dataset.id)));
  });
}

function renderDespesasList(despesas) {
  const list = document.getElementById('despesasList');
  list.innerHTML = despesas.map((d) => renderExpenseItem(d, true)).join('');
  bindDeleteButtons(list);
}

function showDespesasState({ loading, error, empty, list }) {
  const skeleton = document.getElementById('skeletonDespesas');
  const errorEl = document.getElementById('despesasError');
  const emptyEl = document.getElementById('despesasEmpty');
  const listEl = document.getElementById('despesasList');

  if (loading) {
    skeleton?.classList.remove('hidden');
    errorEl?.classList.add('hidden');
    emptyEl?.classList.add('hidden');
    listEl?.classList.add('hidden');
    return;
  }

  skeleton?.classList.add('hidden');

  if (error) {
    errorEl?.classList.remove('hidden');
    emptyEl?.classList.add('hidden');
    listEl?.classList.add('hidden');
    return;
  }

  errorEl?.classList.add('hidden');

  if (empty) {
    emptyEl?.classList.remove('hidden');
    listEl?.classList.add('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  listEl?.classList.remove('hidden');
  listEl?.classList.add('fade-in');
  setTimeout(() => listEl?.classList.remove('fade-in'), 200);
}

async function carregarDespesas() {
  const mes = document.getElementById('filtroMes').value;
  const categoria = document.getElementById('filtroCategoria').value;

  showDespesasState({ loading: true });

  try {
    const params = new URLSearchParams();
    if (mes) params.set('mes', mes);
    if (categoria) params.set('categoria', categoria);

    const query = params.toString();
    const path = query ? `/api/despesas?${query}` : '/api/despesas';
    despesasCarregadas = await DinDin.apiFetch(path);

    if (despesasCarregadas.length === 0) {
      showDespesasState({ empty: true });
    } else {
      showDespesasState({ list: true });
      renderDespesasList(despesasCarregadas);
    }
  } catch (err) {
    document.getElementById('despesasErrorMsg').textContent = err.message;
    showDespesasState({ error: true });
  }
}

async function salvarDespesa(e) {
  e.preventDefault();

  if (!validateFormClient()) return;

  const btnSalvar = document.getElementById('btnSalvar');
  btnSalvar.disabled = true;

  const body = {
    descricao: document.getElementById('descricao').value.trim(),
    valor: parseFloat(document.getElementById('valor').value),
    categoria: document.getElementById('categoria').value,
    data: document.getElementById('data').value,
  };

  try {
    await DinDin.apiFetch('/api/despesas', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    document.getElementById('despesaForm').reset();
    document.getElementById('data').value = new Date().toISOString().split('T')[0];
    clearFieldErrors();
    window.DinDinModal?.closeModal();
    DinDin.showToast('Despesa salva com sucesso!', 'success');
    await carregarDespesas();
    document.dispatchEvent(new CustomEvent('despesas:updated'));
  } catch (err) {
    DinDin.showToast(err.message, 'error');
  } finally {
    btnSalvar.disabled = false;
  }
}

async function deletarDespesa(id) {
  if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

  try {
    await DinDin.apiFetch(`/api/despesas/${id}`, { method: 'DELETE' });
    DinDin.showToast('Despesa excluída.', 'success');
    await carregarDespesas();
    document.dispatchEvent(new CustomEvent('despesas:updated'));
  } catch (err) {
    DinDin.showToast(err.message, 'error');
  }
}

function openNovaDespesaModal() {
  clearFieldErrors();
  document.getElementById('despesaForm')?.reset();
  document.getElementById('data').value = new Date().toISOString().split('T')[0];
  window.DinDinModal?.openModal();
}

function initDespesas() {
  document.getElementById('despesaForm')?.addEventListener('submit', salvarDespesa);
  document.getElementById('filtroMes')?.addEventListener('change', carregarDespesas);
  document.getElementById('filtroCategoria')?.addEventListener('change', carregarDespesas);
  document.getElementById('btnRetryDespesas')?.addEventListener('click', carregarDespesas);
  document.getElementById('btnNovaDespesa')?.addEventListener('click', openNovaDespesaModal);
  document.getElementById('btnEmptyAdd')?.addEventListener('click', openNovaDespesaModal);
  carregarDespesas();
}

document.addEventListener('app:ready', initDespesas);

window.DinDinDespesas = { renderExpenseItem };
