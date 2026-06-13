const API_BASE = '';

const CATEGORIAS = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Lazer',
  'Educação',
  'Outros',
];

const CATEGORIA_EMOJI = {
  'Alimentação': '🍔',
  'Transporte': '🚌',
  'Moradia': '🏠',
  'Saúde': '💊',
  'Lazer': '🎮',
  'Educação': '📚',
  'Outros': '📦',
};

const SUGESTOES_CHAT = [
  'Quanto gastei esse mês?',
  'Qual categoria mais pesou?',
  'Gere um relatório completo',
  'Onde posso economizar?',
];

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr) {
  const raw = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = raw.split('-');
  return `${day}/${month}/${year}`;
}

function formatDateISO(dateStr) {
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
}

function getCurrentMes() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMes(mes) {
  const [year, month] = mes.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getCategoriaEmoji(categoria) {
  return CATEGORIA_EMOJI[categoria] || '📦';
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.erro || 'Erro na requisição.');
  }

  return data;
}

function transitionSkeleton(skeletonEl, contentEl, showContent) {
  if (!skeletonEl) return;

  if (!showContent) {
    skeletonEl.classList.remove('hidden', 'fade-out');
    if (contentEl) contentEl.classList.add('hidden');
    return;
  }

  skeletonEl.classList.add('fade-out');
  setTimeout(() => {
    skeletonEl.classList.add('hidden');
    skeletonEl.classList.remove('fade-out');
    if (contentEl) {
      contentEl.classList.remove('hidden');
      contentEl.classList.add('fade-in');
      setTimeout(() => contentEl.classList.remove('fade-in'), 200);
    }
  }, 200);
}

function animateCounter(element, targetValue, duration = 800) {
  if (!element) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    element.textContent = formatBRL(targetValue);
    return;
  }

  const start = performance.now();
  const from = 0;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = from + (targetValue - from) * easeOut(progress);
    element.textContent = formatBRL(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = formatBRL(targetValue);
    }
  }

  requestAnimationFrame(tick);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function navigateTo(sectionId) {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });
    sections.forEach((section) => {
      section.classList.toggle('active', section.id === `section-${sectionId}`);
    });
    sidebar?.classList.remove('open');
    if (overlay) overlay.hidden = true;
    menuToggle?.setAttribute('aria-expanded', 'false');
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => navigateTo(item.dataset.section));
  });

  menuToggle?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.toggle('open');
    if (overlay) overlay.hidden = !isOpen;
    menuToggle.setAttribute('aria-expanded', String(!!isOpen));
  });

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay.hidden = true;
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
}

function setCurrentMonthInputs() {
  const mes = getCurrentMes();
  const today = new Date().toISOString().split('T')[0];

  const dashboardMes = document.getElementById('dashboardMes');
  const filtroMes = document.getElementById('filtroMes');
  const dataInput = document.getElementById('data');

  if (dashboardMes) dashboardMes.value = mes;
  if (filtroMes) filtroMes.value = mes;
  if (dataInput) dataInput.value = today;
}

function renderSugestoes(container) {
  if (!container) return;
  container.innerHTML = '';
  SUGESTOES_CHAT.forEach((texto) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = texto;
    chip.dataset.sugestao = texto;
    container.appendChild(chip);
  });
}

function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  function closeModal() {
    overlay?.classList.add('hidden');
    overlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openModal() {
    overlay?.classList.remove('hidden');
    overlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.getElementById('descricao')?.focus();
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay?.classList.contains('open')) {
      closeModal();
    }
  });

  return { openModal, closeModal };
}

document.addEventListener('DOMContentLoaded', () => {
  setCurrentMonthInputs();
  initNavigation();
  renderSugestoes(document.getElementById('chatSuggestions'));
  renderSugestoes(document.getElementById('chatSuggestionsDash'));

  const modal = initModal();
  window.DinDinModal = modal;

  document.dispatchEvent(new CustomEvent('app:ready'));
});

window.DinDin = {
  API_BASE,
  CATEGORIAS,
  CATEGORIA_EMOJI,
  SUGESTOES_CHAT,
  formatBRL,
  formatDate,
  formatDateISO,
  getCurrentMes,
  getPreviousMes,
  escapeHtml,
  getCategoriaEmoji,
  apiFetch,
  transitionSkeleton,
  animateCounter,
  showToast,
};
