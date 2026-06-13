let chartInstance = null;

const CHART_COLORS = [
  '#6366F1',
  '#4ADE80',
  '#F59E0B',
  '#F472B6',
  '#A78BFA',
  '#FB923C',
  '#94A3B8',
];

function showDashboardLoading() {
  document.getElementById('skeletonCards')?.classList.remove('hidden');
  document.getElementById('cardsContent')?.classList.add('hidden');
  document.getElementById('skeletonChart')?.classList.remove('hidden');
  document.getElementById('chartContent')?.classList.add('hidden');
  document.getElementById('chartEmpty')?.classList.add('hidden');
  document.getElementById('skeletonRecent')?.classList.remove('hidden');
  document.getElementById('recentList')?.classList.add('hidden');
  document.getElementById('recentEmpty')?.classList.add('hidden');
}

function updateCards(resumo, variacaoPct) {
  DinDin.transitionSkeleton(
    document.getElementById('skeletonCards'),
    document.getElementById('cardsContent'),
    true
  );

  DinDin.animateCounter(document.getElementById('cardTotal'), resumo.totalGasto);

  const varEl = document.getElementById('cardTotalVar');
  if (variacaoPct !== null && Number.isFinite(variacaoPct)) {
    const sign = variacaoPct >= 0 ? '+' : '';
    varEl.textContent = `${sign}${variacaoPct.toFixed(1)}% vs mês anterior`;
    varEl.className = `stat-variation ${variacaoPct <= 0 ? 'positive' : 'negative'}`;
  } else {
    varEl.textContent = 'Sem dados do mês anterior';
    varEl.className = 'stat-variation';
  }

  if (resumo.maiorGasto) {
    document.getElementById('cardMaior').textContent = DinDin.formatBRL(resumo.maiorGasto.valor);
    document.getElementById('cardMaiorSub').textContent =
      `${resumo.maiorGasto.descricao} · ${resumo.maiorGasto.categoria}`;
  } else {
    document.getElementById('cardMaior').textContent = '—';
    document.getElementById('cardMaiorSub').textContent = 'Nenhum gasto';
  }

  if (resumo.categoriaMaisPesada) {
    document.getElementById('cardCategoria').textContent = resumo.categoriaMaisPesada.categoria;
    document.getElementById('cardCategoriaSub').textContent =
      DinDin.formatBRL(resumo.categoriaMaisPesada.total);
  } else {
    document.getElementById('cardCategoria').textContent = '—';
    document.getElementById('cardCategoriaSub').textContent = '';
  }
}

function renderCustomLegend(porCategoria, total) {
  const legend = document.getElementById('chartLegend');
  legend.innerHTML = '';

  porCategoria.forEach((item, i) => {
    const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : 0;
    const div = document.createElement('div');
    div.className = 'legend-item';
    div.innerHTML = `
      <div class="legend-left">
        <span class="legend-dot" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
        <span class="legend-label">${DinDin.escapeHtml(item.categoria)}</span>
      </div>
      <span class="legend-value mono">${DinDin.formatBRL(item.total)} <span style="color:var(--text-muted)">(${pct}%)</span></span>
    `;
    legend.appendChild(div);
  });
}

function updateChart(porCategoria, totalGasto) {
  const skeleton = document.getElementById('skeletonChart');
  const content = document.getElementById('chartContent');
  const empty = document.getElementById('chartEmpty');
  const canvas = document.getElementById('chartDoughnut');
  const centerValue = document.getElementById('chartCenterValue');

  if (!porCategoria || porCategoria.length === 0) {
    skeleton?.classList.add('hidden');
    content?.classList.add('hidden');
    empty?.classList.remove('hidden');
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  DinDin.transitionSkeleton(skeleton, content, true);
  empty?.classList.add('hidden');

  const labels = porCategoria.map((c) => c.categoria);
  const data = porCategoria.map((c) => c.total);

  centerValue.textContent = DinDin.formatBRL(totalGasto);
  renderCustomLegend(porCategoria, totalGasto);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderColor: '#0F1724',
        borderWidth: 3,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#16202E',
          borderColor: '#1E2D42',
          borderWidth: 1,
          titleFont: { family: 'Inter' },
          bodyFont: { family: 'JetBrains Mono' },
          callbacks: {
            label(ctx) {
              const value = ctx.parsed;
              const total = data.reduce((a, b) => a + b, 0);
              const pct = ((value / total) * 100).toFixed(1);
              return ` ${DinDin.formatBRL(value)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

function updateRecentList(ultimas5) {
  const skeleton = document.getElementById('skeletonRecent');
  const list = document.getElementById('recentList');
  const empty = document.getElementById('recentEmpty');

  if (!ultimas5 || ultimas5.length === 0) {
    skeleton?.classList.add('hidden');
    list?.classList.add('hidden');
    empty?.classList.remove('hidden');
    return;
  }

  DinDin.transitionSkeleton(skeleton, list, true);
  empty?.classList.add('hidden');
  list.innerHTML = ultimas5.map((d) => window.DinDinDespesas.renderExpenseItem(d, false)).join('');
}

async function carregarResumo() {
  const mes = document.getElementById('dashboardMes').value || DinDin.getCurrentMes();
  showDashboardLoading();

  try {
    const [resumo, resumoAnterior] = await Promise.all([
      DinDin.apiFetch(`/api/resumo?mes=${mes}`),
      DinDin.apiFetch(`/api/resumo?mes=${DinDin.getPreviousMes(mes)}`).catch(() => null),
    ]);

    let variacaoPct = null;
    if (resumoAnterior && resumoAnterior.totalGasto > 0) {
      variacaoPct = ((resumo.totalGasto - resumoAnterior.totalGasto) / resumoAnterior.totalGasto) * 100;
    } else if (resumoAnterior && resumo.totalGasto > 0) {
      variacaoPct = 100;
    }

    updateCards(resumo, variacaoPct);
    updateChart(resumo.porCategoria, resumo.totalGasto);
    updateRecentList(resumo.ultimas5);
  } catch (err) {
    console.error('Erro ao carregar resumo:', err.message);
    DinDin.showToast('Erro ao carregar dashboard.', 'error');
  }
}

function initGraficos() {
  document.getElementById('dashboardMes')?.addEventListener('change', carregarResumo);
  document.addEventListener('despesas:updated', carregarResumo);
  carregarResumo();
}

document.addEventListener('app:ready', initGraficos);
