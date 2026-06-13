const historico = [];

function createMessageRow(role, text) {
  const row = document.createElement('div');
  row.className = `msg-row msg-row--${role}`;

  if (role === 'assistant' || role === 'loading') {
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'D';
    row.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble msg-bubble--${role === 'loading' ? 'loading' : role}`;
  bubble.textContent = text;
  row.appendChild(bubble);

  return row;
}

function getContainers() {
  return [
    document.getElementById('chatMessages'),
    document.getElementById('chatMessagesDash'),
  ].filter(Boolean);
}

function syncHistorico() {
  getContainers().forEach((container) => {
    container.innerHTML = '';
    historico.forEach((msg) => {
      container.appendChild(createMessageRow(msg.role, msg.text));
    });
    container.scrollTop = container.scrollHeight;
  });
}

function setChatLoading(loading) {
  const inputs = [
    document.getElementById('chatInput'),
    document.getElementById('chatInputDash'),
  ];
  const buttons = document.querySelectorAll('.chat-send');

  inputs.forEach((input) => {
    if (input) input.disabled = loading;
  });
  buttons.forEach((btn) => {
    btn.disabled = loading;
  });
}

async function enviarMensagem(mensagem) {
  if (!mensagem.trim()) return;

  historico.push({ role: 'user', text: mensagem });
  syncHistorico();
  setChatLoading(true);

  const loadingRows = getContainers().map((container) => {
    const row = createMessageRow('loading', 'DinDin está pensando...');
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
    return row;
  });

  try {
    const data = await DinDin.apiFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ mensagem }),
    });

    loadingRows.forEach((r) => r.remove());
    historico.push({ role: 'assistant', text: data.resposta });
    syncHistorico();
  } catch (err) {
    loadingRows.forEach((r) => r.remove());
    historico.push({ role: 'assistant', text: `⚠️ ${err.message}` });
    syncHistorico();
    DinDin.showToast(err.message, 'error');
  } finally {
    setChatLoading(false);
    document.getElementById('chatInput')?.focus();
    ['chatInput', 'chatInputDash'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
  }
}

function handleSubmit(e) {
  e.preventDefault();
  const input = e.target.querySelector('.chat-input');
  const mensagem = input?.value.trim();
  if (mensagem) enviarMensagem(mensagem);
}

function handleChipClick(e) {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  enviarMensagem(chip.dataset.sugestao);
}

function initChat() {
  const welcome = '👋 Olá! Sou o DinDin, seu assistente financeiro. Pergunte sobre seus gastos ou use as sugestões abaixo!';
  historico.push({ role: 'assistant', text: welcome });
  syncHistorico();

  document.getElementById('chatForm')?.addEventListener('submit', handleSubmit);
  document.getElementById('chatFormDash')?.addEventListener('submit', handleSubmit);
  document.getElementById('chatSuggestions')?.addEventListener('click', handleChipClick);
  document.getElementById('chatSuggestionsDash')?.addEventListener('click', handleChipClick);
}

document.addEventListener('app:ready', initChat);
