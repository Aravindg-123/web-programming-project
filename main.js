// ─── THEME TOGGLE ────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
let isDark = false;

function applyTheme(dark) {
  isDark = dark;
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('fishTheme', dark ? 'dark' : 'light');
  updateChartsTheme();
  updateMapTheme();
}

themeToggle.addEventListener('click', () => applyTheme(!isDark));

// Restore saved theme
const saved = localStorage.getItem('fishTheme');
if (saved === 'dark') applyTheme(true);

// ─── MULTI-PAGE: auto-detect which page we are on by canvas presence ────────
// Each HTML file is its own page. Charts are initialised only if their
// canvas element exists in the current document.
const ON_QUOTAS = !!document.getElementById('quotaSpeciesChart');
const ON_ALERTS = !!document.getElementById('alertHistoryChart');
const ON_SEASONAL = !!document.getElementById('banTimelineChart');
const ON_DASHBOARD = !!document.getElementById('barChart');

// ─── DATA ────────────────────────────────────────────────
const species = [
  { name: 'Atlantic Cod', pct: 91, color: '#e53935', quota: 1200, catch: 1092 },
  { name: 'Herring', pct: 88, color: '#d4900a', quota: 2100, catch: 1848 },
  { name: 'Mackerel', pct: 72, color: '#0097a7', quota: 1800, catch: 1296 },
  { name: 'Haddock', pct: 65, color: '#0288d1', quota: 900, catch: 585 },
  { name: 'Plaice', pct: 54, color: '#7c3aed', quota: 600, catch: 324 },
  { name: 'Sprat', pct: 42, color: '#2e7d32', quota: 500, catch: 210 },
  { name: 'Whiting', pct: 38, color: '#d84315', quota: 400, catch: 152 },
  { name: 'Saithe', pct: 61, color: '#1565c0', quota: 700, catch: 427 },
  { name: 'Sole', pct: 29, color: '#6a1b9a', quota: 300, catch: 87 },
];

const activities = [
  { col: '#e53935', title: 'CRITICAL: Cod catch exceeds daily limit — Zone 1', time: '2 min ago' },
  { col: '#d4900a', title: 'Vessel MV Nordic entered restricted zone', time: '14 min ago' },
  { col: '#2e7d32', title: 'Quota update issued for Mackerel — Zone 4', time: '31 min ago' },
  { col: '#0097a7', title: 'New license issued: MV Seabird — Zone 7', time: '1 hr ago' },
  { col: '#d4900a', title: 'Herring quota 88% — threshold warning issued', time: '2 hr ago' },
  { col: '#e53935', title: 'Norwegian Sea vessel count exceeds limit', time: '4 hr ago' },
  { col: '#2e7d32', title: 'Seasonal ban lifted: Mid-Atlantic Zone 3', time: '6 hr ago' },
  { col: '#0097a7', title: 'Biomass survey completed — Celtic Sea', time: '8 hr ago' },
  { col: '#2e7d32', title: 'Q4 2025 report submitted to ICES', time: '1 day ago' },
  { col: '#d4900a', title: 'Capelin season opened — Iceland Waters', time: '2 days ago' },
];

// ─── SPECIES LIST ────────────────────────────────────────
const speciesList = document.getElementById('species-list');
if (speciesList) {
  species.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'species-row';
    row.dataset.expand = 'species-' + i;
    row.innerHTML = `
      <div class="species-dot" style="background:${s.color}"></div>
      <div class="species-name">${s.name}</div>
      <div class="quota-bar-wrap">
        <div class="quota-bar-fill" style="width:0;background:${s.color}" data-w="${s.pct}%"></div>
      </div>
      <div class="species-pct" style="color:${s.color}">${s.pct}%</div>
    `;
    speciesList.appendChild(row);
  });

  setTimeout(() => {
    document.querySelectorAll('.quota-bar-fill').forEach(el => {
      el.style.width = el.dataset.w;
    });
  }, 150);
}

// ─── ACTIVITY FEED ───────────────────────────────────────
const feed = document.getElementById('activityFeed');
if (feed) {
  activities.forEach((a, i) => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.style.animationDelay = (i * 0.05) + 's';
    item.innerHTML = `
      <div class="act-indicator" style="background:${a.col}"></div>
      <div class="act-body">
        <div class="act-title">${a.title}</div>
        <div class="act-time">${a.time}</div>
      </div>
    `;
    feed.appendChild(item);
  });
}

// ─── CHART HELPERS ───────────────────────────────────────
function getChartColors() {
  return isDark
    ? { grid: 'rgba(255,255,255,0.05)', tick: 'rgba(232,244,248,0.45)', tooltipBg: 'rgba(4,28,53,0.95)', tooltipBorder: 'rgba(0,212,200,0.20)', tooltipTitle: '#e8f4f8', tooltipBody: '#00d4c8' }
    : { grid: 'rgba(0,80,100,0.07)', tick: 'rgba(12,37,53,0.45)', tooltipBg: 'rgba(242,252,255,0.97)', tooltipBorder: 'rgba(0,151,167,0.22)', tooltipTitle: '#0c2535', tooltipBody: '#0097a7' };
}

let charts = {};

function buildChartDefaults() {
  const c = getChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        borderWidth: 1,
        titleColor: c.tooltipTitle,
        bodyColor: c.tooltipBody,
        titleFont: { family: 'Cormorant Garamond', size: 13 },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
      }
    },
    scales: {
      x: { grid: { color: c.grid }, ticks: { color: c.tick, font: { family: 'DM Sans', size: 9 } } },
      y: { grid: { color: c.grid }, ticks: { color: c.tick, font: { family: 'DM Sans', size: 9 } } },
    }
  };
}

function updateChartsTheme() {
  const c = getChartColors();
  Object.values(charts).forEach(chart => {
    if (!chart) return;
    const opts = chart.options;
    if (opts.scales) {
      ['x', 'y'].forEach(ax => {
        if (opts.scales[ax]) {
          opts.scales[ax].grid = { ...opts.scales[ax].grid, color: c.grid };
          opts.scales[ax].ticks = { ...opts.scales[ax].ticks, color: c.tick };
        }
      });
    }
    if (opts.plugins?.tooltip) {
      Object.assign(opts.plugins.tooltip, {
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        titleColor: c.tooltipTitle,
        bodyColor: c.tooltipBody,
      });
    }
    chart.update();
  });
}

// ─── BUILD MAIN CHARTS ────────────────────────────────────
function initCharts() {
  const def = buildChartDefaults();
  const c = getChartColors();

  // Monthly bar
  charts.bar = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
      datasets: [{
        data: [680, 720, 810, 750, 690, 640, 710],
        backgroundColor: 'rgba(0,151,167,0.22)',
        borderColor: 'rgba(0,151,167,0.70)',
        borderWidth: 1, borderRadius: 3,
      }]
    },
    options: { ...def, animation: { duration: 1000 } }
  });

  // Donut
  const donutData = [
    { label: 'Pelagic', val: 38, color: '#0097a7' },
    { label: 'Demersal', val: 31, color: '#d4900a' },
    { label: 'Shellfish', val: 16, color: '#2e7d32' },
    { label: 'Other', val: 15, color: '#7c3aed' },
  ];
  charts.donut = new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: donutData.map(d => d.label),
      datasets: [{ data: donutData.map(d => d.val), backgroundColor: donutData.map(d => d.color), borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: def.plugins.tooltip },
      cutout: '70%'
    }
  });

  const legend = document.getElementById('donutLegend');
  donutData.forEach(d => {
    const textCol = isDark ? 'rgba(232,244,248,0.6)' : 'rgba(12,37,53,0.55)';
    legend.innerHTML += `<div style="display:flex;align-items:center;gap:5px">
      <div style="width:7px;height:7px;border-radius:50%;background:${d.color}"></div>
      <span style="color:${textCol}">${d.label}</span>
      <span style="color:${d.color};font-family:'JetBrains Mono',monospace;font-weight:500;margin-left:auto">${d.val}%</span>
    </div>`;
  });

  // Line — overfishing risk
  charts.line = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'],
      datasets: [{
        data: [24, 28, 32, 29, 38, 42, 45, 48, 51],
        borderColor: '#e53935',
        backgroundColor: 'rgba(229,57,53,0.07)',
        fill: true, tension: 0.4,
        pointRadius: 2, pointBackgroundColor: '#e53935',
      }]
    },
    options: { ...def, animation: { duration: 1200 } }
  });

  // Fleet chart (fills empty bottom-right space)
  charts.fleet = new Chart(document.getElementById('fleetChart'), {
    type: 'bar',
    data: {
      labels: ['Norway', 'UK', 'Denmark', 'Iceland', 'Other'],
      datasets: [{
        data: [74, 52, 38, 41, 42],
        backgroundColor: [
          'rgba(0,151,167,0.35)', 'rgba(2,136,209,0.35)',
          'rgba(46,125,50,0.35)', 'rgba(124,58,237,0.35)', 'rgba(212,144,10,0.35)'
        ],
        borderColor: ['#0097a7', '#0288d1', '#2e7d32', '#7c3aed', '#d4900a'],
        borderWidth: 1, borderRadius: 3,
      }]
    },
    options: { ...def, animation: { duration: 1000 } }
  });

  // Horizontal bar — quota by region
  const hDef = { ...def };
  hDef.scales = {
    x: { min: 0, max: 100, grid: { color: c.grid }, ticks: { color: c.tick, font: { size: 8 }, callback: v => v + '%' } },
    y: { grid: { display: false }, ticks: { color: c.tick, font: { family: 'DM Sans', size: 8 } } }
  };
  charts.hbar = new Chart(document.getElementById('hbarChart'), {
    type: 'bar',
    data: {
      labels: ['Grand Banks', 'N. Sea', 'Iceland', 'Celtic', 'Barents', 'Faroe'],
      datasets: [{
        data: [91, 88, 67, 54, 72, 45],
        backgroundColor: ['rgba(229,57,53,0.45)', 'rgba(212,144,10,0.45)', 'rgba(0,151,167,0.38)', 'rgba(46,125,50,0.38)', 'rgba(0,151,167,0.38)', 'rgba(46,125,50,0.35)'],
        borderColor: ['#e53935', '#d4900a', '#0097a7', '#2e7d32', '#0097a7', '#2e7d32'],
        borderWidth: 1, borderRadius: 3,
      }]
    },
    options: { indexAxis: 'y', ...hDef }
  });
}

// Only init dashboard charts when on the dashboard page
if (ON_DASHBOARD) initCharts();

// ─── SUB-PAGE: QUOTAS ────────────────────────────────────
function initQuotaCharts() {
  const def = buildChartDefaults();
  const c = getChartColors();

  // Species TAC bar chart
  charts.quotaSpecies = new Chart(document.getElementById('quotaSpeciesChart'), {
    type: 'bar',
    data: {
      labels: species.map(s => s.name),
      datasets: [
        {
          label: 'Caught',
          data: species.map(s => s.catch),
          backgroundColor: species.map(s => s.color + '55'),
          borderColor: species.map(s => s.color),
          borderWidth: 1, borderRadius: 4,
        },
        {
          label: 'Remaining',
          data: species.map(s => s.quota - s.catch),
          backgroundColor: 'rgba(0,120,140,0.12)',
          borderColor: 'rgba(0,120,140,0.30)',
          borderWidth: 1, borderRadius: 4,
        }
      ]
    },
    options: {
      ...def,
      plugins: { ...def.plugins, legend: { display: true, labels: { color: isDark ? '#e8f4f8' : '#0c2535', font: { family: 'DM Sans', size: 10 } } } },
      animation: { duration: 1000 }
    }
  });

  // Region donut
  charts.quotaRegion = new Chart(document.getElementById('quotaRegionChart'), {
    type: 'doughnut',
    data: {
      labels: ['Grand Banks', 'N. Sea', 'Iceland', 'Celtic', 'Barents', 'Faroe'],
      datasets: [{
        data: [1800, 1600, 1200, 1400, 1300, 1200],
        backgroundColor: ['rgba(229,57,53,0.55)', 'rgba(212,144,10,0.55)', 'rgba(0,151,167,0.55)', 'rgba(46,125,50,0.55)', 'rgba(2,136,209,0.55)', 'rgba(124,58,237,0.55)'],
        borderWidth: 0, hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'right', labels: { color: isDark ? '#e8f4f8' : '#0c2535', font: { family: 'DM Sans', size: 10 }, boxWidth: 12 } }, tooltip: def.plugins.tooltip },
      cutout: '60%',
    }
  });

  // Burn rate line
  charts.quotaBurn = new Chart(document.getElementById('quotaBurnChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Actual',
          data: [640, 710, null, null, null, null, null, 680, 720, 810, 750, 690],
          borderColor: '#0097a7', backgroundColor: 'rgba(0,151,167,0.08)',
          fill: true, tension: 0.4, pointRadius: 3,
        },
        {
          label: 'Projected',
          data: [null, 710, 760, 740, 700, 680, 660, null, null, null, null, null],
          borderColor: '#d4900a', borderDash: [4, 4], backgroundColor: 'transparent',
          fill: false, tension: 0.4, pointRadius: 2,
        }
      ]
    },
    options: {
      ...def,
      plugins: { ...def.plugins, legend: { display: true, labels: { color: isDark ? '#e8f4f8' : '#0c2535', font: { family: 'DM Sans', size: 10 } } } },
    }
  });

  // Quota progress bars
  const list = document.getElementById('quotaProgressList');
  species.forEach(s => {
    const statusColor = s.pct > 85 ? '#e53935' : s.pct > 70 ? '#d4900a' : '#0097a7';
    list.innerHTML += `
      <div class="quota-progress-item">
        <div class="quota-prog-name">${s.name}</div>
        <div class="quota-prog-bar-wrap">
          <div class="quota-prog-bar-fill" style="width:${s.pct}%;background:${statusColor}"></div>
        </div>
        <div class="quota-prog-pct" style="color:${statusColor}">${s.pct}%</div>
      </div>`;
  });
}

// ─── SUB-PAGE: ALERTS ────────────────────────────────────
function initAlertCharts() {
  const def = buildChartDefaults();

  charts.alertHistory = new Chart(document.getElementById('alertHistoryChart'), {
    type: 'bar',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13'],
      datasets: [
        { label: 'Critical', data: [1, 0, 2, 1, 0, 1, 2, 0, 1, 2, 1, 0, 2], backgroundColor: 'rgba(229,57,53,0.55)', borderColor: '#e53935', borderWidth: 1, borderRadius: 2 },
        { label: 'Warning', data: [2, 1, 1, 3, 2, 1, 0, 2, 1, 1, 2, 1, 1], backgroundColor: 'rgba(212,144,10,0.50)', borderColor: '#d4900a', borderWidth: 1, borderRadius: 2 },
        { label: 'Info', data: [1, 2, 0, 1, 2, 3, 1, 2, 1, 0, 1, 2, 1], backgroundColor: 'rgba(0,151,167,0.40)', borderColor: '#0097a7', borderWidth: 1, borderRadius: 2 },
      ]
    },
    options: {
      ...def,
      plugins: { ...def.plugins, legend: { display: true, labels: { color: isDark ? '#e8f4f8' : '#0c2535', font: { family: 'DM Sans', size: 10 } } } },
    }
  });

  charts.alertZone = new Chart(document.getElementById('alertZoneChart'), {
    type: 'bar',
    data: {
      labels: ['Grand Banks', 'Norwegian Sea', 'North Sea', 'Celtic', 'Barents', 'Faroe'],
      datasets: [{
        data: [8, 6, 4, 2, 3, 1],
        backgroundColor: ['rgba(229,57,53,0.55)', 'rgba(229,57,53,0.50)', 'rgba(212,144,10,0.50)', 'rgba(0,151,167,0.40)', 'rgba(2,136,209,0.40)', 'rgba(46,125,50,0.40)'],
        borderColor: ['#e53935', '#e53935', '#d4900a', '#0097a7', '#0288d1', '#2e7d32'],
        borderWidth: 1, borderRadius: 3,
      }]
    },
    options: { indexAxis: 'y', ...def }
  });

  charts.alertRisk = new Chart(document.getElementById('alertRiskChart'), {
    type: 'line',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'],
      datasets: [{
        data: [24, 28, 32, 29, 38, 42, 45, 48, 51],
        borderColor: '#e53935',
        backgroundColor: 'rgba(229,57,53,0.08)',
        fill: true, tension: 0.4,
        pointRadius: 3, pointBackgroundColor: '#e53935',
      }]
    },
    options: { ...def }
  });
}

// ─── SUB-PAGE: SEASONAL BANS ─────────────────────────────
function initSeasonalCharts() {
  const def = buildChartDefaults();

  // Timeline chart (horizontal bars per zone)
  const hDef = { ...def };
  hDef.scales = {
    x: { min: 0, max: 12, grid: { color: getChartColors().grid }, ticks: { color: getChartColors().tick, font: { size: 8 }, callback: v => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][v] || '' } },
    y: { grid: { display: false }, ticks: { color: getChartColors().tick, font: { family: 'DM Sans', size: 8 } } }
  };
  charts.banTimeline = new Chart(document.getElementById('banTimelineChart'), {
    type: 'bar',
    data: {
      labels: ['Norwegian Sea', 'Grand Banks', 'North Sea', 'Celtic Sea', 'Iceland', 'Mid-Atlantic'],
      datasets: [{
        label: 'Ban Period',
        data: [
          [0, 3.5],
          [0, 12],
          [0, 4],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        backgroundColor: ['rgba(229,57,53,0.50)', 'rgba(229,57,53,0.50)', 'rgba(212,144,10,0.50)', 'rgba(46,125,50,0.30)', 'rgba(0,151,167,0.30)', 'rgba(46,125,50,0.30)'],
        borderColor: ['#e53935', '#e53935', '#d4900a', '#2e7d32', '#0097a7', '#2e7d32'],
        borderWidth: 1, borderRadius: 3,
        barPercentage: 0.6,
      }]
    },
    options: { indexAxis: 'y', ...hDef }
  });

  // Status donut
  const banStatusData = [
    { label: 'Restricted', val: 2, color: '#e53935' },
    { label: 'Caution', val: 1, color: '#d4900a' },
    { label: 'Active', val: 4, color: '#2e7d32' },
  ];
  charts.banStatus = new Chart(document.getElementById('banStatusChart'), {
    type: 'doughnut',
    data: {
      labels: banStatusData.map(d => d.label),
      datasets: [{ data: banStatusData.map(d => d.val), backgroundColor: banStatusData.map(d => d.color + 'bb'), borderWidth: 0, hoverOffset: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: def.plugins.tooltip },
      cutout: '65%',
    }
  });

  const banLeg = document.getElementById('banStatusLegend');
  banStatusData.forEach(d => {
    const textCol = isDark ? 'rgba(232,244,248,0.7)' : 'rgba(12,37,53,0.7)';
    banLeg.innerHTML += `<div style="display:flex;align-items:center;gap:8px">
      <div style="width:10px;height:10px;border-radius:3px;background:${d.color};flex-shrink:0"></div>
      <span style="color:${textCol}">${d.label}</span>
      <span style="color:${d.color};font-family:'JetBrains Mono',monospace;font-size:0.8rem;font-weight:500;margin-left:auto">${d.val}</span>
    </div>`;
  });
}

// ─── AUTO-INIT SUB-PAGE CHARTS ───────────────────────────
if (ON_QUOTAS) initQuotaCharts();
if (ON_ALERTS) initAlertCharts();
if (ON_SEASONAL) initSeasonalCharts();

// ─── MAP THEME ────────────────────────────────────────────
function updateMapTheme() {
  const ocean = document.getElementById('mapOcean');
  const grid = document.getElementById('mapGrid');
  if (!ocean || !grid) return;
  if (isDark) {
    ocean.setAttribute('fill', 'url(#oceanGradDark)');
    grid.setAttribute('fill', 'url(#gridDark)');
  } else {
    ocean.setAttribute('fill', 'url(#oceanGradLight)');
    grid.setAttribute('fill', 'url(#gridLight)');
  }
}

// ─── MAP INTERACTIONS ────────────────────────────────────
const mapSVG = document.getElementById('mainMapSVG');
const mapTooltip = document.getElementById('mapTooltip');

const regionMeta = {
  'north-america': { label: 'North America', status: 'caution', catch: '2,140 t', vessels: 52 },
  'south-america': { label: 'South America', status: 'active', catch: '980 t', vessels: 31 },
  'caribbean': { label: 'Caribbean', status: 'active', catch: '340 t', vessels: 18 },
  'greenland': { label: 'Greenland', status: 'restricted', catch: '210 t', vessels: 6 },
  'iceland': { label: 'Iceland', status: 'active', catch: '1,560 t', vessels: 41 },
  'europe': { label: 'Europe', status: 'caution', catch: '1,820 t', vessels: 88 },
  'uk': { label: 'United Kingdom', status: 'caution', catch: '520 t', vessels: 22 },
  'norway': { label: 'Norway', status: 'restricted', catch: '890 t', vessels: 74 },
  'russia': { label: 'Russia', status: 'active', catch: '1,250 t', vessels: 39 },
  'middle-east': { label: 'Middle East', status: 'active', catch: '480 t', vessels: 14 },
  'india': { label: 'India', status: 'active', catch: '3,200 t', vessels: 120 },
  'sea': { label: 'SE Asia', status: 'active', catch: '4,800 t', vessels: 210 },
  'china': { label: 'China', status: 'active', catch: '5,600 t', vessels: 280 },
  'africa': { label: 'Africa', status: 'active', catch: '1,890 t', vessels: 65 },
  'australia': { label: 'Australia', status: 'active', catch: '680 t', vessels: 28 },
};

const statusColors = { active: '#2e7d32', caution: '#d4900a', restricted: '#e53935', critical: '#e53935', warning: '#d4900a' };
const statusLabels = { active: '● Active', caution: '⚠ Caution', restricted: '🚫 Restricted', critical: '🔴 Critical', warning: '⚠ Warning' };

if (mapSVG) {
  const regions = mapSVG.querySelectorAll('.map-region');
  const zones = mapSVG.querySelectorAll('.fishing-zone');

  regions.forEach(r => {
    const id = r.dataset.region;
    const meta = regionMeta[id];

    r.addEventListener('mouseenter', e => {
      mapSVG.classList.add('map-hovering');
      regions.forEach(rr => rr.classList.remove('hovered'));
      r.classList.add('hovered');

      if (meta) {
        const col = statusColors[meta.status] || '#0097a7';
        mapTooltip.innerHTML = `<div class="map-tooltip-title">${meta.label}</div>
          <div class="map-tooltip-status" style="color:${col}">${statusLabels[meta.status] || ''}</div>
          <div style="margin-top:4px;font-size:0.6rem;color:var(--text-secondary)">Catch: ${meta.catch} · Vessels: ${meta.vessels}</div>`;
        mapTooltip.classList.add('visible');
      }
    });

    r.addEventListener('mousemove', e => {
      const rect = document.getElementById('mapContainer').getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top + 14;
      if (x + 160 > rect.width) x = e.clientX - rect.left - 160;
      if (y + 80 > rect.height) y = e.clientY - rect.top - 80;
      mapTooltip.style.left = x + 'px';
      mapTooltip.style.top = y + 'px';
    });

    r.addEventListener('mouseleave', () => {
      mapSVG.classList.remove('map-hovering');
      regions.forEach(rr => rr.classList.remove('hovered'));
      mapTooltip.classList.remove('visible');
    });

    r.addEventListener('click', () => {
      if (meta) openRegionPopup(id, meta);
    });
  });

  zones.forEach(z => {
    const zoneKey = z.dataset.zone;
    const status = z.dataset.status;

    z.addEventListener('mouseenter', e => {
      mapSVG.classList.add('map-hovering');
      zones.forEach(zz => zz.classList.remove('hovered'));
      z.classList.add('hovered');

      const col = statusColors[status] || '#0097a7';
      const label = zoneKey.replace('ban-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      mapTooltip.innerHTML = `<div class="map-tooltip-title">${label}</div>
        <div class="map-tooltip-status" style="color:${col}">${statusLabels[status] || ''}</div>
        <div style="margin-top:4px;font-size:0.6rem;color:var(--text-secondary)">Click for details</div>`;
      mapTooltip.classList.add('visible');
    });

    z.addEventListener('mousemove', e => {
      const rect = document.getElementById('mapContainer').getBoundingClientRect();
      let x = e.clientX - rect.left + 14;
      let y = e.clientY - rect.top + 14;
      if (x + 160 > rect.width) x = e.clientX - rect.left - 160;
      if (y + 80 > rect.height) y = e.clientY - rect.top - 80;
      mapTooltip.style.left = x + 'px';
      mapTooltip.style.top = y + 'px';
    });

    z.addEventListener('mouseleave', () => {
      mapSVG.classList.remove('map-hovering');
      zones.forEach(zz => zz.classList.remove('hovered'));
      mapTooltip.classList.remove('visible');
    });

    z.addEventListener('click', () => {
      // Open the zone expand popup
      if (expandData[zoneKey]) openExpand(zoneKey);
      else if (zoneKey === 'ban-georges') openRegionPopup('georges-bank', { label: 'Georges Bank', status: 'warning', catch: '480 t', vessels: 22 });
      else if (zoneKey === 'zone-indian') openRegionPopup('indian-ocean', { label: 'Indian Ocean Zone', status: 'active', catch: '1,240 t', vessels: 48 });
      else if (zoneKey === 'zone-pacific') openRegionPopup('pacific', { label: 'Pacific Zone', status: 'active', catch: '890 t', vessels: 36 });
    });
  });

  // Clear hover when mouse leaves map
  document.getElementById('mapContainer').addEventListener('mouseleave', () => {
    mapSVG.classList.remove('map-hovering');
    document.querySelectorAll('.map-region, .fishing-zone').forEach(el => el.classList.remove('hovered'));
    mapTooltip.classList.remove('visible');
  });
}

// ─── REGION POPUP ────────────────────────────────────────
const mapRegionOverlay = document.getElementById('mapRegionOverlay');
const mapRegionContent = document.getElementById('mapRegionContent');
const mapRegionClose = document.getElementById('mapRegionClose');
let regionChart = null;

const regionDetailData = {
  'north-america': {
    icon: '🌎',
    stats: [{ val: '2,140', lbl: 'Catch (tons)', sc: 'sc-teal' }, { val: '52', lbl: 'Vessels', sc: 'sc-blue' }, { val: '73%', lbl: 'TAC used', sc: 'sc-amber' }],
    details: [['Primary Species', 'Atlantic Cod, Herring, Mackerel'], ['Main Zones', 'Grand Banks, Georges Bank, Mid-Atlantic'], ['Alerts', '2 critical — Grand Banks'], ['Season Status', 'Q1 2026 active'], ['Authority', 'NAFO / ICES / US NOAA']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [320, 380, 420, 370, 310, 280, 330] },
  },
  'india': {
    icon: '🇮🇳',
    stats: [{ val: '3,200', lbl: 'Catch (tons)', sc: 'sc-teal' }, { val: '120', lbl: 'Vessels', sc: 'sc-blue' }, { val: '62%', lbl: 'TAC used', sc: 'sc-green' }],
    details: [['Primary Species', 'Tuna, Shrimp, Sardine, Mackerel'], ['Main Zones', 'Arabian Sea, Bay of Bengal'], ['Alerts', 'None'], ['Season Status', 'Active — monsoon ban Apr–Jun'], ['Authority', 'CMFRI / Ministry of Fisheries']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [480, 520, 610, 580, 490, 440, 510] },
  },
  'europe': {
    icon: '🇪🇺',
    stats: [{ val: '1,820', lbl: 'Catch (tons)', sc: 'sc-teal' }, { val: '88', lbl: 'Vessels', sc: 'sc-blue' }, { val: '80%', lbl: 'TAC used', sc: 'sc-amber' }],
    details: [['Primary Species', 'Cod, Herring, Mackerel, Haddock'], ['Main Zones', 'North Sea, Celtic Sea, Baltic'], ['Alerts', '1 warning — North Sea herring'], ['Season Status', 'Q1 2026 — partial restrictions'], ['Authority', 'EU Common Fisheries Policy']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [240, 270, 310, 290, 250, 230, 260] },
  },
  'norway': {
    icon: '🇳🇴',
    stats: [{ val: '890', lbl: 'Catch (tons)', sc: 'sc-teal' }, { val: '74', lbl: 'Vessels', sc: 'sc-blue' }, { val: 'RESTRICTED', lbl: 'Status', sc: 'sc-red' }],
    details: [['Restriction', 'Cod spawning moratorium'], ['Lifts', 'April 15, 2026'], ['Area', '234,000 km²'], ['Main Species', 'Cod, Capelin, Herring'], ['Authority', 'Norwegian Ministry of Fisheries']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [180, 210, 240, 220, 190, 0, 0] },
  },
  'china': {
    icon: '🇨🇳',
    stats: [{ val: '5,600', lbl: 'Catch (tons)', sc: 'sc-teal' }, { val: '280', lbl: 'Vessels', sc: 'sc-blue' }, { val: '55%', lbl: 'TAC used', sc: 'sc-green' }],
    details: [['Primary Species', 'Hairtail, Cuttlefish, Yellow Croaker'], ['Main Zones', 'East China Sea, Yellow Sea, South China Sea'], ['Alerts', 'None'], ['Season Status', 'Summer ban Jun–Sep (upcoming)'], ['Authority', 'Ministry of Agriculture & Rural Affairs']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [720, 810, 920, 880, 760, 680, 750] },
  },
  'africa': {
    icon: '🌍',
    stats: [{ val: '1,890', lbl: 'Catch (tons)', sc: 'sc-teal' }, { val: '65', lbl: 'Vessels', sc: 'sc-blue' }, { val: '58%', lbl: 'TAC used', sc: 'sc-green' }],
    details: [['Primary Species', 'Sardine, Anchovy, Tuna, Hake'], ['Main Zones', 'West Africa EEZ, Benguela Current'], ['Alerts', 'None'], ['Season Status', 'Normal operations'], ['Authority', 'SWIOFISH / FAO']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [260, 290, 340, 310, 270, 250, 280] },
  },
};

function openRegionPopup(regionId, meta) {
  const data = regionDetailData[regionId];
  const col = statusColors[meta.status] || '#0097a7';
  const statHtml = data ? data.stats.map(s => `
    <div class="expand-stat ${s.sc}">
      <div class="expand-stat-val">${s.val}</div>
      <div class="expand-stat-lbl">${s.lbl}</div>
    </div>`).join('') : `
    <div class="expand-stat sc-teal"><div class="expand-stat-val">${meta.catch}</div><div class="expand-stat-lbl">Catch (tons)</div></div>
    <div class="expand-stat sc-blue"><div class="expand-stat-val">${meta.vessels}</div><div class="expand-stat-lbl">Vessels</div></div>
    <div class="expand-stat sc-green"><div class="expand-stat-val">${statusLabels[meta.status] || ''}</div><div class="expand-stat-lbl">Status</div></div>`;

  const detailHtml = data ? data.details.map(([k, v]) => `<div class="expand-detail-row"><span>${k}</span><span>${v}</span></div>`).join('') : '';

  mapRegionContent.innerHTML = `
    <span class="expand-header-icon">${data?.icon || '🗺️'}</span>
    <div class="expand-title">${meta.label}</div>
    <div class="expand-sub" style="color:${col}">${statusLabels[meta.status] || 'Zone'} — Fisheries Overview</div>
    <div class="expand-stats">${statHtml}</div>
    <div class="expand-detail-list">${detailHtml}</div>
    ${data ? `<div class="expand-chart-area">
      <div class="expand-chart-title">Monthly Catch Trend (tons)</div>
      <div class="expand-chart-wrap">
        <canvas id="regionPopupChart"></canvas>
      </div>
    </div>` : ''}
  `;

  mapRegionOverlay.classList.add('active');

  if (data) {
    setTimeout(() => {
      const c = getChartColors();
      if (regionChart) regionChart.destroy();
      const ctx = document.getElementById('regionPopupChart');
      if (!ctx) return;
      regionChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.chartData.labels,
          datasets: [{
            data: data.chartData.data,
            borderColor: col,
            backgroundColor: col + '18',
            fill: true, tension: 0.4,
            pointRadius: 4, pointBackgroundColor: col,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderWidth: 1, titleColor: c.tooltipTitle, bodyColor: c.tooltipBody, titleFont: { family: 'Cormorant Garamond', size: 13 }, bodyFont: { family: 'JetBrains Mono', size: 11 } }
          },
          scales: {
            x: { grid: { color: c.grid }, ticks: { color: c.tick, font: { family: 'DM Sans', size: 9 } } },
            y: { grid: { color: c.grid }, ticks: { color: c.tick, font: { family: 'JetBrains Mono', size: 9 } } }
          }
        }
      });
    }, 60);
  }
}

mapRegionClose.addEventListener('click', () => mapRegionOverlay.classList.remove('active'));
mapRegionOverlay.addEventListener('click', e => { if (e.target === mapRegionOverlay) mapRegionOverlay.classList.remove('active'); });

// ─── EXPAND DATA (with stat colour schemes) ──────────────
const expandData = {
  quota: {
    icon: '🎣',
    title: 'Total Annual Quota',
    sub: 'North Atlantic Fisheries — 2026 Allocation',
    stats: [
      { val: '8,500', lbl: 'Total (tons)', sc: 'sc-teal' },
      { val: '6,200', lbl: 'Caught (tons)', sc: 'sc-amber' },
      { val: '73%', lbl: 'Utilized', sc: 'sc-green' },
    ],
    details: [
      ['Allocation Method', 'TAC — Total Allowable Catch'],
      ['Regulatory Body', 'ICES / EU Commission'],
      ['Period', 'Jan 1 – Dec 31, 2026'],
      ['Species Covered', '15 commercially managed'],
      ['Remaining Quota', '2,300 tons'],
    ],
    chart: { type: 'bar', labels: ['Cod', 'Herring', 'Mackerel', 'Haddock', 'Plaice', 'Sprat', 'Whiting'], data: [1092, 1848, 1296, 585, 324, 210, 152], color: '#0097a7' }
  },
  catch: {
    icon: '⚖️',
    title: 'Current Catch Status',
    sub: 'Real-time aggregated catch data across all zones',
    stats: [
      { val: '6,200', lbl: 'Tons caught', sc: 'sc-teal' },
      { val: '73%', lbl: 'Of annual TAC', sc: 'sc-amber' },
      { val: '842', lbl: 'Tons this week', sc: 'sc-violet' },
    ],
    details: [
      ['Daily Average', '68 tons/day'],
      ['Projected Year End', '7,820 tons (92% of TAC)'],
      ['Peak Catch Day', 'Feb 18 — 128 tons'],
      ['Lowest Catch Day', 'Dec 26 — 12 tons'],
      ['Pelagic Share', '38% of total catch'],
    ],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [680, 720, 810, 750, 690, 640, 710], color: '#d4900a' }
  },
  alerts: {
    icon: '⚠️',
    title: 'Active Overfishing Alerts',
    sub: 'Real-time monitoring — threshold breaches and warnings',
    stats: [
      { val: '3', lbl: 'Total Alerts', sc: 'sc-amber' },
      { val: '2', lbl: 'Critical', sc: 'sc-red' },
      { val: '1', lbl: 'Warning', sc: 'sc-amber' },
    ],
    details: [
      ['Critical: Grand Banks', 'Cod TAC exceeded by 18%'],
      ['Critical: Norwegian Sea', 'Vessel density +35% above limit'],
      ['Warning: North Sea', 'Herring quota 88% consumed'],
      ['Response Protocol', 'ICES Alert Level 2 activated'],
      ['Last Review', 'Feb 24, 2026 — 08:30 UTC'],
    ],
    chart: { type: 'bar', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [2, 1, 3, 2, 4, 3, 5, 4, 3], color: '#e53935' }
  },
  zones: {
    icon: '🌊',
    title: 'Fishing Zone Overview',
    sub: '12 active management zones — North Atlantic',
    stats: [
      { val: '12', lbl: 'Total Zones', sc: 'sc-teal' },
      { val: '7', lbl: 'Active', sc: 'sc-green' },
      { val: '3', lbl: 'Restricted', sc: 'sc-red' },
    ],
    details: [
      ['Zone Authority', 'ICES / NAFO / OSPAR'],
      ['Monitoring', 'AIS + VMS vessel tracking'],
      ['Coverage Area', '4.2M km² total'],
      ['Active Licenses', '247 vessels'],
      ['Zone Reviews', 'Quarterly (next: Apr 2026)'],
    ]
  },
  vessels: {
    icon: '🚢',
    title: 'Vessels at Sea',
    sub: 'AIS-tracked commercial fishing fleet',
    stats: [
      { val: '247', lbl: 'Total Vessels', sc: 'sc-teal' },
      { val: '18', lbl: 'Joined since dawn', sc: 'sc-green' },
      { val: '6', lbl: 'In restricted zones', sc: 'sc-red' },
    ],
    details: [
      ['Largest Fleet', 'Norwegian — 74 vessels'],
      ['UK Fleet', '52 vessels'],
      ['Danish Fleet', '38 vessels'],
      ['Avg Vessel Size', '28m LOA'],
      ['Vessels Overdue', '0 — all check-ins nominal'],
    ],
    chart: { type: 'bar', labels: ['Norway', 'UK', 'Denmark', 'Iceland', 'Other'], data: [74, 52, 38, 41, 42], color: '#0097a7' }
  },
  biomass: {
    icon: '🐟',
    title: 'Biomass Health Index',
    sub: 'Population and ecosystem health indicators',
    stats: [
      { val: '84%', lbl: 'Biomass Index', sc: 'sc-green' },
      { val: '↑2%', lbl: 'vs 2025', sc: 'sc-teal' },
      { val: 'Good', lbl: 'Status', sc: 'sc-blue' },
    ],
    details: [
      ['Cod Biomass', '62% (below Blim threshold)'],
      ['Herring Biomass', '91% — good recovery'],
      ['Mackerel Biomass', '88% — stable'],
      ['Haddock Biomass', '96% — excellent'],
      ['Assessment', 'ICES WGWIDE 2025 survey'],
    ],
    chart: { type: 'bar', labels: ['Cod', 'Herring', 'Mackerel', 'Haddock', 'Plaice', 'Sprat'], data: [62, 91, 88, 96, 74, 58], color: '#2e7d32' }
  },
  'fleet-status': {
    icon: '🚢',
    title: 'Fleet Distribution by Nation',
    sub: 'Active vessels at sea by flag state — Feb 24, 2026',
    stats: [
      { val: '247', lbl: 'Total Vessels', sc: 'sc-teal' },
      { val: 'Norway', lbl: 'Largest Fleet', sc: 'sc-blue' },
      { val: '28m', lbl: 'Avg LOA', sc: 'sc-green' },
    ],
    details: [
      ['Norwegian Fleet', '74 vessels'],
      ['UK Fleet', '52 vessels'],
      ['Icelandic Fleet', '41 vessels'],
      ['Danish Fleet', '38 vessels'],
      ['Other', '42 vessels'],
    ],
    chart: { type: 'bar', labels: ['Norway', 'UK', 'Iceland', 'Denmark', 'Other'], data: [74, 52, 41, 38, 42], color: '#0097a7' }
  },
  'catch-breakdown': {
    icon: '📊',
    title: 'Catch Breakdown by Category',
    sub: 'Species group composition of total catch',
    stats: [
      { val: '38%', lbl: 'Pelagic', sc: 'sc-teal' },
      { val: '31%', lbl: 'Demersal', sc: 'sc-amber' },
      { val: '16%', lbl: 'Shellfish', sc: 'sc-green' },
    ],
    details: [
      ['Pelagic (2,356 t)', 'Herring, Mackerel, Sprat'],
      ['Demersal (1,922 t)', 'Cod, Haddock, Whiting'],
      ['Shellfish (992 t)', 'Lobster, Crab, Scallop'],
      ['Other (930 t)', 'Flatfish, Squid, misc.'],
      ['Export Proportion', '68% — domestic 32%'],
    ],
    chart: { type: 'doughnut', labels: ['Pelagic', 'Demersal', 'Shellfish', 'Other'], data: [38, 31, 16, 15], color: '#0097a7' }
  },
  'overfishing-trend': {
    icon: '📈',
    title: 'Overfishing Risk Index',
    sub: 'Weekly risk score — catch rates × biomass × vessel density',
    stats: [
      { val: '51', lbl: 'Current Index', sc: 'sc-red' },
      { val: '↑12', lbl: 'vs Week 1', sc: 'sc-orange' },
      { val: 'HIGH', lbl: 'Risk Level', sc: 'sc-amber' },
    ],
    details: [
      ['Risk Formula', 'Catch rate + vessel density + biomass'],
      ['Threshold: MODERATE', '> 35 index points'],
      ['Threshold: HIGH', '> 50 index points'],
      ['Primary Driver', 'Grand Banks cod exceedance'],
      ['Mitigation', 'Zone 1 vessel limit enacted'],
    ],
    chart: { type: 'line', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [24, 28, 32, 29, 38, 42, 45, 48, 51], color: '#e53935' }
  },
  'quota-util': {
    icon: '📉',
    title: 'Quota Utilisation by Region',
    sub: '2026 TAC consumption rates — all managed zones',
    stats: [
      { val: '91%', lbl: 'Grand Banks', sc: 'sc-red' },
      { val: '88%', lbl: 'North Sea', sc: 'sc-amber' },
      { val: '45%', lbl: 'Faroe', sc: 'sc-teal' },
    ],
    details: [
      ['Highest Utilisation', 'Grand Banks 91% — ALERT'],
      ['Lowest Utilisation', 'Faroe Islands 45%'],
      ['On Track', 'Celtic, Barents, Iceland'],
      ['Overpace', 'Grand Banks, North Sea'],
      ['Underpace', 'Faroe — weather disruption'],
    ],
    chart: { type: 'bar', labels: ['Grand Banks', 'N. Sea', 'Iceland', 'Celtic', 'Barents', 'Faroe'], data: [91, 88, 67, 54, 72, 45], color: '#0097a7' }
  },
  'all-alerts': {
    icon: '🚨',
    title: 'All Overfishing Alerts',
    sub: 'Complete incident log — last 48 hours',
    stats: [
      { val: '2', lbl: 'Critical', sc: 'sc-red' },
      { val: '1', lbl: 'Warning', sc: 'sc-amber' },
      { val: '1', lbl: 'Info', sc: 'sc-blue' },
    ],
    details: [
      ['Grand Banks CRITICAL', 'Cod TAC +18% · Zone 1 · 2hr ago'],
      ['Norwegian Sea CRITICAL', 'Vessel density breach · 4hr ago'],
      ['North Sea WARNING', 'Herring 88% quota consumed'],
      ['Mackerel INFO', 'Updated TAC issued · 1 day ago'],
      ['Protocol Active', 'ICES Level 2 — increased monitoring'],
    ],
    chart: { type: 'bar', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [2, 1, 3, 2, 4, 3, 5, 4, 3], color: '#e53935' }
  },
  season: {
    icon: '📅',
    title: 'Season Progress',
    sub: 'Q1 2026 Fishing Season — Jan 1 to Mar 31',
    stats: [
      { val: '75%', lbl: 'Elapsed', sc: 'sc-amber' },
      { val: '9/12', lbl: 'Weeks done', sc: 'sc-teal' },
      { val: '3 wk', lbl: 'Remaining', sc: 'sc-green' },
    ],
    details: [
      ['Season Start', 'January 1, 2026'],
      ['Season End', 'March 31, 2026'],
      ['Catch Trajectory', 'On track — 73% of seasonal TAC'],
      ['Q2 Preview', 'Apr 1 — zone restrictions apply'],
      ['Annual Review', 'October 2026 — ICES'],
    ]
  },
  monthly: {
    icon: '📆',
    title: 'Monthly Catch Trend',
    sub: 'August 2025 — February 2026',
    stats: [
      { val: '810', lbl: 'Peak (Oct)', sc: 'sc-teal' },
      { val: '640', lbl: 'Low (Jan)', sc: 'sc-blue' },
      { val: '710', lbl: 'Current (Feb)', sc: 'sc-green' },
    ],
    details: [
      ['August 2025', '680 tons'],
      ['September 2025', '720 tons'],
      ['October 2025', '810 tons — peak'],
      ['November 2025', '750 tons'],
      ['December 2025', '690 tons'],
      ['January 2026', '640 tons — seasonal low'],
      ['February 2026', '710 tons — recovering'],
    ],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [680, 720, 810, 750, 690, 640, 710], color: '#0097a7' }
  },
};

// Species expand data
species.forEach((s, i) => {
  const statusSc = s.pct > 85 ? 'sc-red' : s.pct > 70 ? 'sc-amber' : 'sc-green';
  expandData['species-' + i] = {
    icon: '🐠',
    title: s.name,
    sub: 'Species quota and catch detail — 2026',
    stats: [
      { val: s.quota.toLocaleString(), lbl: 'TAC (tons)', sc: 'sc-teal' },
      { val: s.catch.toLocaleString(), lbl: 'Caught (tons)', sc: 'sc-blue' },
      { val: s.pct + '%', lbl: 'Utilized', sc: statusSc },
    ],
    details: [
      ['Remaining Quota', (s.quota - s.catch) + ' tons'],
      ['Daily Average', Math.round(s.catch / 55) + ' tons/day'],
      ['Year-End Projection', Math.round(s.catch * 365 / 55) + ' tons'],
      ['Status', s.pct > 85 ? '🔴 CRITICAL' : s.pct > 70 ? '🟡 WARNING' : '🟢 NORMAL'],
      ['Managed Zones', 'Multiple — North Atlantic'],
    ],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [Math.round(s.catch * 0.70), Math.round(s.catch * 0.78), Math.round(s.catch * 0.88), Math.round(s.catch * 0.82), Math.round(s.catch * 0.74), Math.round(s.catch * 0.68), s.catch], color: s.color }
  };
});

// Zone ban expand data
const zoneExpands = {
  'ban-norwegian': {
    icon: '🚫', title: 'Norwegian Sea Restriction', sub: 'Breeding season moratorium active',
    stats: [
      { val: 'Restricted', lbl: 'Status', sc: 'sc-red' },
      { val: 'Apr 15', lbl: 'Reopens', sc: 'sc-amber' },
      { val: 'Cod', lbl: 'Primary sp.', sc: 'sc-teal' },
    ],
    details: [['Restriction Start', 'Jan 1, 2026'], ['Reason', 'Cod spawning season'], ['Area', '234,000 km²'], ['Exemptions', 'Subsistence fishing only'], ['Authority', 'ICES / Norway MFA']],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [180, 210, 240, 220, 190, 0, 0], color: '#e53935' }
  },
  'ban-celtic': {
    icon: '✅', title: 'Celtic Sea', sub: 'Open season — all species active',
    stats: [
      { val: 'Active', lbl: 'Status', sc: 'sc-green' },
      { val: 'Mackerel', lbl: 'Top species', sc: 'sc-teal' },
      { val: '78', lbl: 'Vessels', sc: 'sc-blue' },
    ],
    details: [['Season', 'Year-round'], ['Main Species', 'Mackerel, Herring, Hake'], ['Quota Used', '54% of annual TAC'], ['Vessels Active', '78 licensed'], ['Next Review', 'Apr 2026']],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [68, 74, 88, 81, 72, 65, 71], color: '#2e7d32' }
  },
  'ban-northsea': {
    icon: '⚠️', title: 'North Sea Caution Zone', sub: 'Cod spawning — restricted trawling',
    stats: [
      { val: 'Caution', lbl: 'Status', sc: 'sc-amber' },
      { val: '88%', lbl: 'Herring TAC', sc: 'sc-red' },
      { val: 'Cod', lbl: 'Restricted', sc: 'sc-teal' },
    ],
    details: [['Restriction', 'Bottom trawling limited'], ['Herring TAC', '88% consumed — near cap'], ['Cod Status', 'Protected — no directed catch'], ['Area', '750,000 km²'], ['Lifted When', 'May 1, 2026']],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [95, 112, 128, 118, 102, 95, 108], color: '#d4900a' }
  },
  'ban-iceland': {
    icon: '🧊', title: 'Icelandic Waters', sub: 'Capelin season in progress',
    stats: [
      { val: 'Active', lbl: 'Status', sc: 'sc-green' },
      { val: 'Capelin', lbl: 'Season sp.', sc: 'sc-teal' },
      { val: '67%', lbl: 'TAC used', sc: 'sc-amber' },
    ],
    details: [['Capelin Season', 'Jan–Mar 2026'], ['TAC for Capelin', '850,000 tons (Iceland quota)'], ['Current Catch', '569,500 tons (67%)'], ['Other Species', 'Cod, Haddock — normal ops'], ['Authority', 'Icelandic Ministry of Fisheries']],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [120, 140, 165, 150, 130, 115, 128], color: '#0097a7' }
  },
  'ban-grand': {
    icon: '🔴', title: 'Grand Banks — Critical Alert', sub: 'Cod moratorium + overfishing breach',
    stats: [
      { val: 'CRITICAL', lbl: 'Status', sc: 'sc-red' },
      { val: '91%', lbl: 'TAC used', sc: 'sc-red' },
      { val: '+18%', lbl: 'Daily excess', sc: 'sc-orange' },
    ],
    details: [['Alert Level', 'ICES Level 2 — Critical'], ['Issue', 'Daily catch exceeds TAC by 18%'], ['Action', 'Vessel limit — max 12 active'], ['Cod TAC', '1,200 tons (1,092 caught)'], ['Expected Cap Date', 'Feb 28, 2026']],
    chart: { type: 'line', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [62, 68, 74, 79, 82, 86, 89, 91, 94], color: '#e53935' }
  },
  'ban-mid': {
    icon: '🟢', title: 'Mid-Atlantic Zone', sub: 'Normal operations — all clear',
    stats: [
      { val: 'Active', lbl: 'Status', sc: 'sc-green' },
      { val: '54%', lbl: 'TAC used', sc: 'sc-teal' },
      { val: 'Normal', lbl: 'Risk', sc: 'sc-blue' },
    ],
    details: [['Main Species', 'Tuna, Swordfish, Squid'], ['Vessels Active', '31 licensed'], ['TAC Status', '54% — well within limits'], ['Conditions', 'Good — 2.1m swell, 18kn wind'], ['Next Assessment', 'Mar 15, 2026']],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [42, 48, 55, 51, 45, 41, 46], color: '#2e7d32' }
  },
};
Object.assign(expandData, zoneExpands);

// ─── EXPAND OVERLAY ───────────────────────────────────────
const overlay = document.getElementById('expandOverlay');
const expandContent = document.getElementById('expandContent');
const expandClose = document.getElementById('expandClose');
let popupChart = null;

function openExpand(key) {
  const d = expandData[key];
  if (!d) return;

  expandContent.innerHTML = `
    <span class="expand-header-icon">${d.icon || '📋'}</span>
    <div class="expand-title">${d.title}</div>
    <div class="expand-sub">${d.sub}</div>
    <div class="expand-stats">
      ${d.stats.map(s => `
        <div class="expand-stat ${s.sc}">
          <div class="expand-stat-val">${s.val}</div>
          <div class="expand-stat-lbl">${s.lbl}</div>
        </div>
      `).join('')}
    </div>
    <div class="expand-detail-list">
      ${d.details.map(([k, v]) => `
        <div class="expand-detail-row">
          <span>${k}</span>
          <span>${v}</span>
        </div>
      `).join('')}
    </div>
    ${d.chart ? `<div class="expand-chart-area">
      <div class="expand-chart-title">Data Visualisation</div>
      <div class="expand-chart-wrap">
        <canvas id="popupChart"></canvas>
      </div>
    </div>` : ''}
  `;

  overlay.classList.add('active');

  if (d.chart) {
    setTimeout(() => {
      if (popupChart) popupChart.destroy();
      const ctx = document.getElementById('popupChart');
      if (!ctx) return;
      const c = getChartColors();
      const chartColor = d.chart.color || '#0097a7';
      const isDonut = d.chart.type === 'doughnut';
      const isDoughnut = isDonut;
      popupChart = new Chart(ctx, {
        type: d.chart.type,
        data: isDonut ? {
          labels: d.chart.labels,
          datasets: [{ data: d.chart.data, backgroundColor: ['#0097a7bb', '#d4900abb', '#2e7d32bb', '#7c3aedbb'], borderWidth: 0, hoverOffset: 4 }]
        } : {
          labels: d.chart.labels,
          datasets: [{
            data: d.chart.data,
            backgroundColor: d.chart.type === 'line' ? chartColor + '18' : chartColor + '55',
            borderColor: chartColor,
            borderWidth: d.chart.type === 'line' ? 2 : 1,
            borderRadius: d.chart.type === 'bar' ? 3 : 0,
            fill: d.chart.type === 'line',
            tension: 0.4,
            pointRadius: d.chart.type === 'line' ? 3 : 0,
            pointBackgroundColor: chartColor,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: isDonut, position: 'right', labels: { color: isDark ? '#e8f4f8' : '#0c2535', font: { family: 'DM Sans', size: 10 }, boxWidth: 10 } },
            tooltip: { backgroundColor: c.tooltipBg, borderColor: c.tooltipBorder, borderWidth: 1, titleColor: c.tooltipTitle, bodyColor: c.tooltipBody, titleFont: { family: 'Cormorant Garamond', size: 13 }, bodyFont: { family: 'JetBrains Mono', size: 11 } }
          },
          ...(isDonut ? { cutout: '65%' } : {
            scales: {
              x: { grid: { color: c.grid }, ticks: { color: c.tick, font: { family: 'DM Sans', size: 9 } } },
              y: { grid: { color: c.grid }, ticks: { color: c.tick, font: { family: 'JetBrains Mono', size: 9 } } }
            }
          })
        }
      });
    }, 60);
  }
}

function closeExpand() { overlay.classList.remove('active'); }

expandClose.addEventListener('click', closeExpand);
overlay.addEventListener('click', e => { if (e.target === overlay) closeExpand(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeExpand(); mapRegionOverlay.classList.remove('active'); } });

// Attach click → expand
document.querySelectorAll('[data-expand]').forEach(el => {
  el.addEventListener('click', () => openExpand(el.dataset.expand));
  el.style.cursor = 'pointer';
});
document.querySelectorAll('.species-row').forEach((el, i) => {
  el.addEventListener('click', () => openExpand('species-' + i));
});
