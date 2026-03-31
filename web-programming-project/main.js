// ═══════════════════════════════════════════════════════════════
// API LAYER — connects to server.js when served via HTTP
// Falls back silently to hardcoded data when running as file://
// ═══════════════════════════════════════════════════════════════

const API_BASE = window.location.protocol === 'file:'
  ? null   // running as file:// — use hardcoded FALLBACK data
  : (window.location.origin || 'http://localhost:3000');
const USE_API = API_BASE !== null;

/**
 * Loading indicator — dims metric-value elements while API fetches are in flight.
 * CSS rule for .loading is in enhancements.css: .metric-value.loading { opacity: 0.35; }
 */
function setLoading(on) {
  document.querySelectorAll('.metric-value')
    .forEach(el => el.classList.toggle('loading', on));
}

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
// FALLBACK — served when backend is unavailable
// Replace by running: npm start
// Real data file: /data/dummy/species.json → /data/raw/cmfri-species-landings.csv
// DATA SOURCE: /api/species
// Real dataset: DS2 — CMFRI Species-wise Landings
// Access pattern: B (CSV file)
// Real source: https://eprints.cmfri.org.in
// DATA SOURCE: CMFRI — https://www.cmfri.org.in/
let species = [
  { name: 'Indian Mackerel', pct: 87, color: '#0097a7', quota: 280000, catch: 245000 },
  { name: 'Oil Sardine', pct: 74, color: '#2e7d32', quota: 350000, catch: 260000 },
  { name: 'Ribbonfish', pct: 81, color: '#d4900a', quota: 220000, catch: 180000 },
  { name: 'Penaeid Shrimp', pct: 86, color: '#7c3aed', quota: 190000, catch: 165000 },
  { name: 'Bombay Duck', pct: 84, color: '#0288d1', quota: 130000, catch: 110000 },
  { name: 'Croakers', pct: 83, color: '#e53935', quota: 150000, catch: 125000 },
  { name: 'Seer Fish', pct: 91, color: '#d84315', quota: 60000, catch: 55000 },
  { name: 'Pomfret', pct: 62, color: '#1565c0', quota: 90000, catch: 55800 },
  { name: 'Squid & Cuttlefish', pct: 45, color: '#6a1b9a', quota: 80000, catch: 36000 },
];

// FALLBACK — served when backend is unavailable
// Real data file: /data/dummy/alerts.json → /data/manual/alerts.json
// DATA SOURCE: /api/alerts
// Real dataset: DS6 — IMD Fishermen Warnings
// Access pattern: C (manual JSON)
// Real source: https://mausam.imd.gov.in
// DATA SOURCE: INCOIS & IMD — https://incois.gov.in | https://mausam.imd.gov.in
let activities = [
  { col: '#e53935', title: 'CRITICAL: High wave alert Kerala & Lakshadweep — all vessels return to harbour', time: '6:12 AM IST' },
  { col: '#d4900a', title: 'Seer Fish — high vessel density off Tamil Nadu coast approaching MSY', time: '4:18 AM IST' },
  { col: '#e53935', title: 'Indian Mackerel quota Arabian Sea at 82% — precautionary freeze enacted', time: '3:00 AM IST' },
  { col: '#d4900a', title: 'Squall warning: wind 45–55 kmph along Andhra Pradesh coast', time: '2:30 AM IST' },
  { col: '#0097a7', title: 'PFZ Advisory updated: new Potential Fishing Zones off Porbandar (Gujarat)', time: '9:00 AM IST' },
  { col: '#e53935', title: 'East Coast trawl ban reminder: commences April 15 — all trawlers vacate EEZ', time: '1 day ago' },
  { col: '#2e7d32', title: 'Oil Sardine — North Kerala zone biomass survey completed by CMFRI', time: '1 day ago' },
  { col: '#0097a7', title: 'DoF census update: 14,205 vessels registered at sea — Gujarat leads fleet', time: '2 days ago' },
  { col: '#2e7d32', title: 'CMFRI Q1 2026 flash bulletin submitted to Ministry of Fisheries', time: '3 days ago' },
  { col: '#d4900a', title: 'West Coast trawl ban (Jun 1 – Jul 31) advisory issued by MoFAH&D', time: '4 days ago' },
];

// ─── MODULE-LEVEL DATA STORE (overwritten by loadAllData) ────
// Chart functions read from _appData when available, otherwise use
// the hardcoded FALLBACK arrays above.
let _appData = {};

// Helper: safe-get fetched data or return null
function _get(key) { return _appData[key] || null; }

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
  const legendColor = isDark ? '#e8f4f8' : '#0c2535';
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
    // Update legend label colours so dark mode text is readable
    if (opts.plugins?.legend?.labels) {
      opts.plugins.legend.labels.color = legendColor;
    }
    chart.update();
  });
  // Re-render any inline HTML legends (donut, ban status)
  const donutLegend = document.getElementById('donutLegend');
  if (donutLegend) {
    const textCol = isDark ? 'rgba(232,244,248,0.7)' : 'rgba(12,37,53,0.55)';
    donutLegend.querySelectorAll('span:first-of-type').forEach(el => {
      el.style.color = textCol;
    });
  }
  const banLegend = document.getElementById('banStatusLegend');
  if (banLegend) {
    const textCol = isDark ? 'rgba(232,244,248,0.7)' : 'rgba(12,37,53,0.7)';
    banLegend.querySelectorAll('span:first-of-type').forEach(el => {
      el.style.color = textCol;
    });
  }
}

// ─── BUILD MAIN CHARTS ────────────────────────────────────
function initCharts() {
  const def = buildChartDefaults();
  const c = getChartColors();

  // Annual production bar — India year-wise total fish production (Lakh Tonnes)
  // Source: dataset1.csv — data.gov.in DS1 (Year-wise Fish Production 2019-20 to 2023-24)
  const prodLabels = ['2019-20', '2020-21', '2021-22', '2022-23', '2023-24'];
  const prodData = [141.64, 147.25, 162.48, 175.45, 182.70];  // Lakh tonnes
  charts.bar = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: {
      labels: prodLabels,
      datasets: [{
        label: 'Production (Lakh t)',
        data: prodData,
        backgroundColor: ['rgba(0,151,167,0.22)', 'rgba(0,151,167,0.28)', 'rgba(0,151,167,0.35)', 'rgba(0,151,167,0.45)', 'rgba(0,151,167,0.60)'],
        borderColor: 'rgba(0,151,167,0.80)',
        borderWidth: 1, borderRadius: 4,
      }]
    },
    options: { ...def, animation: { duration: 1000 } }
  });
  // Update bar chart from fetched production-trend API if available
  const prodTrend = _appData.productionTrend;
  if (prodTrend && Array.isArray(prodTrend) && prodTrend.length) {
    charts.bar.data.labels = prodTrend.map(r => r.year);
    charts.bar.data.datasets[0].data = prodTrend.map(r => r.production);
    charts.bar.update();
  }

  // Donut — India catch breakdown by species group
  // Source: catch_breakdown.csv — Marine Fisheries Census 2016
  const donutData = [
    { label: 'Finfish', val: 65, color: '#0097a7' },
    { label: 'Shellfish', val: 35, color: '#d4900a' },
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

  // Fleet chart — total fishing crafts by Indian state (Marine Fisheries Census 2016)
  // Source: fisheries_state_dataset.csv — total_crafts column
  charts.fleet = new Chart(document.getElementById('fleetChart'), {
    type: 'bar',
    data: {
      labels: ['Gujarat', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Maharashtra'],
      datasets: [{
        data: [27642, 43355, 21684, 20219, 15520],
        backgroundColor: [
          'rgba(0,151,167,0.35)', 'rgba(2,136,209,0.35)',
          'rgba(124,58,237,0.35)', 'rgba(46,125,50,0.35)', 'rgba(212,144,10,0.35)'
        ],
        borderColor: ['#0097a7', '#0288d1', '#7c3aed', '#2e7d32', '#d4900a'],
        borderWidth: 1, borderRadius: 3,
      }]
    },
    options: { ...def, animation: { duration: 1000 } }
  });

  // Horizontal bar — quota utilisation by Indian coastal zone
  // Source: DoF / data.gov.in — https://data.gov.in/sector/fisheries
  const hDef = { ...def };
  hDef.scales = {
    x: { min: 0, max: 100, grid: { color: c.grid }, ticks: { color: c.tick, font: { size: 8 }, callback: v => v + '%' } },
    y: { grid: { display: false }, ticks: { color: c.tick, font: { family: 'DM Sans', size: 8 } } }
  };
  charts.hbar = new Chart(document.getElementById('hbarChart'), {
    type: 'bar',
    data: {
      labels: ['Gujarat Coast', 'Tamil Nadu', 'Kerala Coast', 'Maharashtra', 'Andhra Pr.', 'Others'],
      datasets: [{
        data: [88, 82, 79, 74, 68, 54],
        backgroundColor: ['rgba(229,57,53,0.45)', 'rgba(212,144,10,0.45)', 'rgba(212,144,10,0.38)', 'rgba(0,151,167,0.38)', 'rgba(0,151,167,0.38)', 'rgba(46,125,50,0.35)'],
        borderColor: ['#e53935', '#d4900a', '#d4900a', '#0097a7', '#0097a7', '#2e7d32'],
        borderWidth: 1, borderRadius: 3,
      }]
    },
    options: { indexAxis: 'y', ...hDef }
  });
}

// Dashboard charts are initialised inside loadAllData().then() below,
// so fetched data is available before charts are built.
// (Previously: if (ON_DASHBOARD) initCharts(); — moved to async init block)

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

  // Region donut — India coastal quota distribution by state (fisheries_state_dataset.csv fisherfolk pop)
  // Source: fisheries_state_dataset.csv
  charts.quotaRegion = new Chart(document.getElementById('quotaRegionChart'), {
    type: 'doughnut',
    data: {
      labels: ['Gujarat', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Maharashtra', 'Others'],
      datasets: [{
        data: [750000, 710000, 650000, 400000, 450000, 840000],
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

  // Burn rate line — India annual quota consumption
  // Source: CMFRI / DoF — https://www.cmfri.org.in/
  charts.quotaBurn = new Chart(document.getElementById('quotaBurnChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Actual',
          data: [640000, 710000, null, null, null, null, null, 680000, 720000, 810000, 750000, 690000],
          borderColor: '#0097a7', backgroundColor: 'rgba(0,151,167,0.08)',
          fill: true, tension: 0.4, pointRadius: 3,
        },
        {
          label: 'Projected',
          data: [null, 710000, 760000, 740000, 700000, 680000, 660000, null, null, null, null, null],
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

  // Alert zone bar — India coastal zones
  // Source: INCOIS Fishwatch — https://fishwatch.incois.gov.in
  charts.alertZone = new Chart(document.getElementById('alertZoneChart'), {
    type: 'bar',
    data: {
      labels: ['West Coast', 'East Coast', 'A&N Islands', 'Lakshadweep', 'Arabian Sea', 'Bay of Bengal'],
      datasets: [{
        data: [8, 6, 4, 2, 5, 3],
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

  // Timeline chart — India monsoon trawl bans
  // Source: DoF Gazette — https://dof.gov.in/statistics
  const hDef = { ...def };
  hDef.scales = {
    x: { min: 0, max: 12, grid: { color: getChartColors().grid }, ticks: { color: getChartColors().tick, font: { size: 8 }, callback: v => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][v] || '' } },
    y: { grid: { display: false }, ticks: { color: getChartColors().tick, font: { family: 'DM Sans', size: 8 } } }
  };
  charts.banTimeline = new Chart(document.getElementById('banTimelineChart'), {
    type: 'bar',
    data: {
      labels: ['East Coast', 'West Coast', 'A&N Islands', 'Arabian Sea (outer)', 'Lakshadweep', 'Bay of Bengal'],
      datasets: [{
        label: 'Ban Period',
        data: [
          [3.5, 5.5],
          [5, 7],
          [3.5, 5.5],
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

// ═══════════════════════════════════════════════════════════════
// loadAllData — fetches all API endpoints with Promise.allSettled()
// so ONE failing endpoint never blanks the whole dashboard.
// Falls back to hardcoded data for any rejected promise.
// ═══════════════════════════════════════════════════════════════
async function loadAllData() {
  if (!USE_API) {
    // Running as file:// — use hardcoded fallbacks unchanged
    return;
  }

  setLoading(true);

  const endpoints = [
    // DATA SOURCE: /api/species
    // Real dataset: DS2 — CMFRI Species-wise Landings | Access pattern: B
    // Real source: https://eprints.cmfri.org.in
    fetch(API_BASE + '/api/species').then(r => r.json()).then(d => ({ key: 'species', data: d })),

    // DATA SOURCE: /api/alerts
    // Real dataset: DS6 — IMD Fishermen Warnings | Access pattern: C
    // Real source: https://mausam.imd.gov.in
    fetch(API_BASE + '/api/alerts').then(r => r.json()).then(d => ({ key: 'alerts', data: d })),

    // DATA SOURCE: /api/kpis
    // Real dataset: DS1 — DoF Year-wise Fish Production | Access pattern: A
    // Real source: https://www.data.gov.in (requires DATAGOVIN_API_KEY in .env)
    fetch(API_BASE + '/api/kpis').then(r => r.json()).then(d => ({ key: 'kpis', data: d })),

    // DATA SOURCE: /api/catch-monthly
    // Real dataset: NEW-2 — CMFRI Monthly Flash Bulletin | Access pattern: B
    // Real source: https://cmfri.org.in/publications
    fetch(API_BASE + '/api/catch-monthly').then(r => r.json()).then(d => ({ key: 'catchMonthly', data: d })),

    // DATA SOURCE: /api/alert-history
    // Real dataset: NEW-5 — INCOIS Fishwatch | Access pattern: C
    // Real source: https://fishwatch.incois.gov.in
    fetch(API_BASE + '/api/alert-history').then(r => r.json()).then(d => ({ key: 'alertHistory', data: d })),

    // DATA SOURCE: /api/risk-index
    // Real dataset: NEW-4 — Derived INCOIS+IMD score | Access pattern: C
    // Real source: https://incois.gov.in/portal/pfz/pfz.jsp
    fetch(API_BASE + '/api/risk-index').then(r => r.json()).then(d => ({ key: 'riskIndex', data: d })),

    // DATA SOURCE: /api/catch-breakdown
    // Real dataset: DS2 — CMFRI species-group proportions | Access pattern: B
    // Real source: https://eprints.cmfri.org.in
    fetch(API_BASE + '/api/catch-breakdown').then(r => r.json()).then(d => ({ key: 'catchBreakdown', data: d })),

    // DATA SOURCE: /api/fleet
    // Real dataset: DS7 — DoF Vessel Census | Access pattern: B
    // Real source: https://dof.gov.in/statistics
    fetch(API_BASE + '/api/fleet').then(r => r.json()).then(d => ({ key: 'fleet', data: d })),

    // DATA SOURCE: /api/biomass-trend
    // Real dataset: NEW-1 — CMFRI Annual Report | Access pattern: C
    // Real source: https://eprints.cmfri.org.in
    fetch(API_BASE + '/api/biomass-trend').then(r => r.json()).then(d => ({ key: 'biomassTrend', data: d })),

    // DATA SOURCE: /api/production-trend
    // Real dataset: dataset1.csv — Year-wise Fish Production 2019-24 | Access pattern: B
    // Real source: https://www.data.gov.in/resource/year-wise-details-total-fish-production-and-fisheries-exports-2019-20-2023-24
    fetch(API_BASE + '/api/production-trend').then(r => r.json()).then(d => ({ key: 'productionTrend', data: d })),

    // DATA SOURCE: /api/ocean-conditions
    // Real dataset: NEW-3 — Open-Meteo Marine (INCOIS OSF fallback) | Access pattern: A
    // Real source: https://incois.gov.in/portal/osf/osf.jsp
    fetch(API_BASE + '/api/ocean-conditions').then(r => r.json()).then(d => ({ key: 'oceanConditions', data: d })),
  ];

  const results = await Promise.allSettled(endpoints);

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      const { key, data } = result.value;
      _appData[key] = data;
      // Overwrite species/activities module-level vars if fetched
      if (key === 'species' && Array.isArray(data.data || data)) {
        const arr = data.data || data;
        // Map API format → internal format used by chart functions
        species = arr.map(s => ({
          name: s.name,
          pct: s.percent,
          color: s.color,
          quota: s.quota,
          catch: s.caught,
        }));
      }
      if (key === 'alerts' && Array.isArray(data.data || data)) {
        const arr = data.data || data;
        activities = arr.map(a => ({
          col: a.severity === 'critical' ? '#e53935' : a.severity === 'warning' ? '#d4900a' : '#0097a7',
          title: a.title,
          time: new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        }));
      }
    } else {
      console.warn('[loadAllData] endpoint failed:', result.reason.message, '— using hardcoded fallback');
    }
  });

  setLoading(false);
}

// ─── AUTO-INIT SUB-PAGE CHARTS ───────────────────────────
// Charts are initialised after loadAllData() resolves so they
// use fetched data when the backend is available.
loadAllData().then(() => {
  if (ON_QUOTAS) initQuotaCharts();
  if (ON_ALERTS) initAlertCharts();
  if (ON_SEASONAL) initSeasonalCharts();
  if (ON_DASHBOARD) {
    // Re-render species list and activity feed with (possibly updated) API data
    const sl = document.getElementById('species-list');
    if (sl) {
      sl.innerHTML = '';
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
        sl.appendChild(row);
      });
      setTimeout(() => {
        sl.querySelectorAll('.quota-bar-fill').forEach(el => { el.style.width = el.dataset.w; });
      }, 150);
      // Re-attach click listeners after re-render
      attachSpeciesRowClicks();
    }
    const feedEl = document.getElementById('activityFeed');
    if (feedEl) {
      feedEl.innerHTML = '';
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
        feedEl.appendChild(item);
      });
    }
    initCharts();
  }
  // Re-apply theme colours now that charts exist (fixes blank charts in dark mode on page nav)
  updateChartsTheme();
}).catch(err => {
  console.error('[loadAllData] unexpected error:', err);
  if (ON_QUOTAS) initQuotaCharts();
  if (ON_ALERTS) initAlertCharts();
  if (ON_SEASONAL) initSeasonalCharts();
  if (ON_DASHBOARD) initCharts();
  updateChartsTheme();
});

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
    stats: [{ val: '3,400 kt', lbl: 'Annual Catch', sc: 'sc-teal' }, { val: '14,205', lbl: 'Vessels Active', sc: 'sc-blue' }, { val: '87%', lbl: 'MSY Used', sc: 'sc-amber' }],
    details: [['Primary Species', 'Indian Mackerel, Oil Sardine, Penaeid Shrimp, Seer Fish'], ['Main Zones', 'Arabian Sea, Bay of Bengal, Lakshadweep, Andaman Sea'], ['Active Alerts', '1 Critical (Kerala high waves), 2 Warnings'], ['Season Status', 'Active — East Coast monsoon ban Apr 15'], ['Authority', 'CMFRI / INCOIS / MoFAH&D']],
    chartData: { labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [280000, 310000, 340000, 320000, 290000, 270000, 250000] },
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

if (mapRegionClose) {
  mapRegionClose.addEventListener('click', () => mapRegionOverlay.classList.remove('active'));
  mapRegionOverlay.addEventListener('click', e => { if (e.target === mapRegionOverlay) mapRegionOverlay.classList.remove('active'); });
}

// ─── EXPAND DATA (with stat colour schemes) ──────────────
const expandData = {
  quota: {
    icon: '🎣',
    title: 'Total Annual Quota (MSY)',
    sub: 'Indian Marine Fisheries — 2025–26 Allocation · Source: kpi_cards.csv / DoF',
    sourceUrl: 'https://data.gov.in/sector/fisheries',
    stats: [
      { val: '38 Lakh t', lbl: 'Total Quota', sc: 'sc-teal' },
      { val: '35 Lakh t', lbl: 'Current Catch', sc: 'sc-amber' },
      { val: '92.1%', lbl: 'Utilized', sc: 'sc-red' },
    ],
    details: [
      ['Allocation Method', 'MSY — Maximum Sustainable Yield'],
      ['Regulatory Body', 'Ministry of Fisheries, Animal Husbandry & Dairying'],
      ['Period', 'Apr 1, 2025 – Mar 31, 2026'],
      ['Species Covered', '9+ commercially managed species'],
      ['Remaining Quota', '~3 Lakh tons (7.9% unused)'],
    ],
    chart: { type: 'bar', labels: ['Indian Mackerel', 'Oil Sardine', 'Ribbonfish', 'Penaeid Shrimp', 'Bombay Duck', 'Croakers', 'Seer Fish'], data: [245000, 260000, 180000, 165000, 110000, 125000, 55000], color: '#0097a7' }
  },
  catch: {
    icon: '⚖️',
    title: 'Current Catch Status',
    sub: 'Aggregated marine catch data — India EEZ · Source: kpi_cards.csv / CMFRI',
    sourceUrl: 'https://www.cmfri.org.in/',
    stats: [
      { val: '35 Lakh t', lbl: 'Tons caught', sc: 'sc-teal' },
      { val: '92.1%', lbl: 'Of annual quota', sc: 'sc-red' },
      { val: '14,205', lbl: 'Vessels active', sc: 'sc-violet' },
    ],
    details: [
      ['Quota (total_quota_tons)', '3,800,000 tons'],
      ['Catch (current_catch_tons)', '3,500,000 tons'],
      ['Utilization', '92.1% of annual quota'],
      ['Finfish Share', '65% of total catch (Census 2016)'],
      ['Shellfish Share', '35% of total catch (Census 2016)'],
    ],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [280000, 310000, 340000, 320000, 290000, 270000, 250000], color: '#d4900a' }
  },
  alerts: {
    icon: '⚠️',
    title: 'Active Overfishing Alerts',
    sub: 'INCOIS & IMD real-time monitoring · Source: incois.gov.in',
    sourceUrl: 'https://incois.gov.in/',
    stats: [
      { val: '5', lbl: 'Total Alerts', sc: 'sc-amber' },
      { val: '1', lbl: 'Critical', sc: 'sc-red' },
      { val: '3', lbl: 'Warning', sc: 'sc-amber' },
    ],
    details: [
      ['Critical: Kerala & Lakshadweep', 'High waves 2.5–3.2m — vessels return'],
      ['Warning: Tamil Nadu coast', 'Seer Fish vessel density above threshold'],
      ['Warning: Andhra Pradesh', 'Squall — wind 45–55 kmph gusting 65 kmph'],
      ['Info: Gujarat (Porbandar)', 'New PFZ coordinates issued by INCOIS'],
      ['Response Protocol', 'INCOIS Alert Level 1 — increased monitoring'],
    ],
    chart: { type: 'bar', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [2, 1, 3, 2, 4, 3, 5, 4, 3], color: '#e53935' }
  },
  zones: {
    icon: '🌊',
    title: 'Fishing Zone Overview',
    sub: 'India EEZ management zones · Source: india_map.csv / MoFAH&D',
    sourceUrl: 'https://incois.gov.in/portal/pfz/pfz.jsp',
    stats: [
      { val: '4', lbl: 'Active Zones', sc: 'sc-teal' },
      { val: 'Jun–Jul', lbl: 'West Coast Ban', sc: 'sc-red' },
      { val: 'Apr–Jun', lbl: 'East Coast Ban', sc: 'sc-amber' },
    ],
    details: [
      ['West Coast States', 'GJ, MH, GA, KA, KL — Ban: Jun–Jul'],
      ['East Coast States', 'TN, AP, OD, WB — Ban: Apr–Jun'],
      ['Zone Authority', 'MoFAH&D / CMFRI / INCOIS'],
      ['Monitoring', 'INCOIS PFZ + NAVIC transponder tracking'],
      ['Coverage Area', '~2.3M km² India EEZ'],
    ]
  },
  vessels: {
    icon: '🚢',
    title: 'Vessels at Sea',
    sub: 'NAVIC-tracked commercial fishing fleet · Source: DoF Census',
    sourceUrl: 'https://dof.gov.in/statistics',
    stats: [
      { val: '14,205', lbl: 'Total Vessels', sc: 'sc-teal' },
      { val: '+124', lbl: 'Since dawn', sc: 'sc-green' },
      { val: 'Gujarat', lbl: 'Largest fleet', sc: 'sc-blue' },
    ],
    details: [
      ['Gujarat Fleet', '65 boats active today'],
      ['Tamil Nadu Fleet', '52 boats active today'],
      ['Maharashtra Fleet', '48 boats active today'],
      ['Kerala Fleet', '42 boats active today'],
      ['Vessels Overdue', '0 — all NAVIC check-ins nominal'],
    ],
    chart: { type: 'bar', labels: ['Gujarat', 'Tamil Nadu', 'Maharashtra', 'Kerala', 'Others'], data: [65, 52, 48, 42, 40], color: '#0097a7' }
  },
  biomass: {
    icon: '🐟',
    title: 'Biomass Health Index',
    sub: 'CMFRI Annual Marine Fisheries Report · Source: kpi_cards.csv / CMFRI',
    sourceUrl: 'https://eprints.cmfri.org.in/',
    stats: [
      { val: '91.1%', lbl: 'Biomass Index', sc: 'sc-green' },
      { val: 'Healthy', lbl: 'Status', sc: 'sc-green' },
      { val: 'CMFRI', lbl: 'Authority', sc: 'sc-blue' },
    ],
    details: [
      ['Biomass Index (biomass_index)', '0.911 — Healthy'],
      ['Indian Mackerel Biomass', '82% — near quota cap, monitoring'],
      ['Oil Sardine Biomass', '74% — good, seasonal variation'],
      ['Penaeid Shrimp Biomass', '86% — caution, approaching limit'],
      ['Assessment', 'CMFRI Annual Report 2024–25'],
    ],
    chart: { type: 'bar', labels: ['Indian Mackerel', 'Oil Sardine', 'Ribbonfish', 'Penaeid Shrimp', 'Croakers', 'Seer Fish'], data: [82, 74, 81, 86, 83, 91], color: '#2e7d32' }
  },
  'fleet-status': {
    icon: '🚢',
    title: 'Fleet by State — Total Crafts',
    sub: 'Fishing crafts by state — Marine Fisheries Census 2016 · Source: fisheries_state_dataset.csv',
    sourceUrl: 'https://dof.gov.in/statistics',
    stats: [
      { val: '1,54,354', lbl: 'Total Crafts', sc: 'sc-teal' },
      { val: 'Tamil Nadu', lbl: 'Largest Fleet', sc: 'sc-blue' },
      { val: '13 States', lbl: 'Coverage', sc: 'sc-green' },
    ],
    details: [
      ['Gujarat', '27,642 crafts (14,061 mechanized)'],
      ['Tamil Nadu', '43,355 crafts (5,961 mechanized)'],
      ['Kerala', '21,684 crafts (3,800 mechanized)'],
      ['Andhra Pradesh', '20,219 crafts (1,176 mechanized)'],
      ['Maharashtra', '15,520 crafts (5,867 mechanized)'],
    ],
    chart: { type: 'bar', labels: ['Gujarat', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh', 'Maharashtra'], data: [27642, 43355, 21684, 20219, 15520], color: '#0097a7' }
  },
  'catch-breakdown': {
    icon: '📊',
    title: 'Catch Breakdown by Species Group',
    sub: 'Species group composition — Marine Fisheries Census 2016 · Source: catch_breakdown.csv',
    sourceUrl: 'https://eprints.cmfri.org.in/',
    stats: [
      { val: '65%', lbl: 'Finfish', sc: 'sc-teal' },
      { val: '35%', lbl: 'Shellfish', sc: 'sc-amber' },
      { val: '3.5M t', lbl: 'Total Catch', sc: 'sc-green' },
    ],
    details: [
      ['Finfish (65%)', 'Inland fish, Flat fish, Sardines, Anchovies, Tunas, Misc. Marine'],
      ['Shellfish (35%)', 'Elasmobranchs (Shark, Rays), Decapods (Prawns, Crabs)'],
      ['Total Catch (2023–24)', '1,82.7 Lakh Tonnes (dataset1.csv)'],
      ['Exports (2023–24)', '17,81,602 MT valued ₹60,524 cr'],
      ['Data Source', 'Marine Fisheries Census 2016 (catch_breakdown.csv)'],
    ],
    chart: { type: 'doughnut', labels: ['Finfish', 'Shellfish'], data: [65, 35], color: '#0097a7' }
  },
  'overfishing-trend': {
    icon: '📈',
    title: 'Overfishing Risk Index',
    sub: 'Weekly risk score — INCOIS PFZ + IMD + CMFRI · Source: incois.gov.in',
    sourceUrl: 'https://incois.gov.in/portal/pfz/pfz.jsp',
    stats: [
      { val: '58', lbl: 'Current Index', sc: 'sc-red' },
      { val: '↑33', lbl: 'vs Week 1', sc: 'sc-orange' },
      { val: 'HIGH', lbl: 'Risk Level', sc: 'sc-amber' },
    ],
    details: [
      ['Risk Formula', 'PFZ no-fish zones × 10 + IMD warnings × 8 + quota util × 0.3'],
      ['Threshold: MODERATE', '> 35 index points'],
      ['Threshold: HIGH', '> 50 index points'],
      ['Primary Driver', 'Seer Fish density breach off Tamil Nadu'],
      ['Mitigation', 'INCOIS PFZ advisory issued; vessel limit active'],
    ],
    chart: { type: 'line', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [25, 30, 28, 40, 45, 48, 52, 55, 58], color: '#e53935' }
  },
  'quota-util': {
    icon: '📉',
    title: 'Quota Utilisation by Coastal Zone',
    sub: '2025–26 MSY consumption rates — Indian coasts · Source: DoF',
    sourceUrl: 'https://dof.gov.in/statistics',
    stats: [
      { val: '88%', lbl: 'Gujarat Coast', sc: 'sc-red' },
      { val: '82%', lbl: 'Tamil Nadu', sc: 'sc-amber' },
      { val: '54%', lbl: 'Others', sc: 'sc-teal' },
    ],
    details: [
      ['Highest Utilisation', 'Gujarat Coast 88% — near cap'],
      ['Second Highest', 'Tamil Nadu 82% — monitoring'],
      ['On Track', 'Maharashtra, Andhra Pradesh'],
      ['Lowest Utilisation', 'Other small coastal states 54%'],
      ['Responsible Authority', 'DoF + State Fisheries Departments'],
    ],
    chart: { type: 'bar', labels: ['Gujarat Coast', 'Tamil Nadu', 'Kerala Coast', 'Maharashtra', 'Andhra Pr.', 'Others'], data: [88, 82, 79, 74, 68, 54], color: '#0097a7' }
  },
  'all-alerts': {
    icon: '🚨',
    title: 'All Overfishing Alerts',
    sub: 'Complete incident log — last 48 hours · Source: INCOIS & IMD',
    sourceUrl: 'https://incois.gov.in/',
    stats: [
      { val: '1', lbl: 'Critical', sc: 'sc-red' },
      { val: '3', lbl: 'Warning', sc: 'sc-amber' },
      { val: '1', lbl: 'Info', sc: 'sc-blue' },
    ],
    details: [
      ['CRITICAL: Kerala & Lakshadweep', 'High waves — all vessels return · 6:12 AM IST'],
      ['WARNING: Tamil Nadu coast', 'Seer Fish density above threshold · 4:18 AM IST'],
      ['WARNING: Andhra Pradesh', 'Squall 45–55 kmph · 3:00 AM IST'],
      ['INFO: Gujarat (Porbandar)', 'New PFZ advisory issued by INCOIS'],
      ['Protocol Active', 'INCOIS Level 1 — increased monitoring'],
    ],
    chart: { type: 'bar', labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9'], data: [2, 1, 3, 2, 4, 3, 5, 4, 3], color: '#e53935' }
  },
  season: {
    icon: '📅',
    title: 'Season Progress',
    sub: 'Fishing Season 2025–26 — pre-monsoon phase',
    sourceUrl: 'https://dof.gov.in/statistics',
    stats: [
      { val: '75%', lbl: 'Season Elapsed', sc: 'sc-amber' },
      { val: '9/12', lbl: 'Months done', sc: 'sc-teal' },
      { val: 'Apr 15', lbl: 'Ban starts (E. Coast)', sc: 'sc-red' },
    ],
    details: [
      ['Fishing Season', 'Aug 2025 – Jul 2026'],
      ['East Coast Ban', 'Apr 15 – Jun 14, 2026 (MoFAH&D Gazette SO 1568(E))'],
      ['West Coast Ban', 'Jun 1 – Jul 31, 2026 (MoFAH&D Gazette SO 1568(E))'],
      ['Catch Trajectory', 'On track — 87% of seasonal MSY'],
      ['Annual Review', 'October 2026 — CMFRI / MoFAH&D'],
    ]
  },
  monthly: {
    icon: '📆',
    title: 'Annual Fish Production Trend',
    sub: '2019-20 to 2023-24 · Source: dataset1.csv / data.gov.in DS1',
    sourceUrl: 'https://www.data.gov.in/resource/year-wise-details-total-fish-production-and-fisheries-exports-2019-20-2023-24',
    stats: [
      { val: '182.7 L t', lbl: 'Peak (2023-24)', sc: 'sc-teal' },
      { val: '141.6 L t', lbl: 'Start (2019-20)', sc: 'sc-blue' },
      { val: '+29%', lbl: 'Growth (5 yr)', sc: 'sc-green' },
    ],
    details: [
      ['2019-20', '141.64 Lakh tonnes · Exports: 13,36,824 MT · ₹46,663 cr'],
      ['2020-21', '147.25 Lakh tonnes · Exports: 11,75,174 MT · ₹43,720 cr'],
      ['2021-22', '162.48 Lakh tonnes · Exports: 13,40,000 MT · ₹57,587 cr'],
      ['2022-23', '175.45 Lakh tonnes · Exports: 17,81,602 MT · ₹60,524 cr'],
      ['2023-24', '182.70 Lakh tonnes · Exports: 17,81,602 MT · ₹60,524 cr'],
    ],
    chart: { type: 'bar', labels: ['2019-20', '2020-21', '2021-22', '2022-23', '2023-24'], data: [141.64, 147.25, 162.48, 175.45, 182.70], color: '#0097a7' }
  },
};

// Species expand data
species.forEach((s, i) => {
  const statusSc = s.pct > 85 ? 'sc-red' : s.pct > 70 ? 'sc-amber' : 'sc-green';
  expandData['species-' + i] = {
    icon: '🐠',
    title: s.name,
    sub: 'Species quota and catch detail — 2025–26 · Source: CMFRI',
    sourceUrl: 'https://eprints.cmfri.org.in/',
    stats: [
      { val: s.quota.toLocaleString(), lbl: 'MSY Quota (tons)', sc: 'sc-teal' },
      { val: s.catch.toLocaleString(), lbl: 'Caught (tons)', sc: 'sc-blue' },
      { val: s.pct + '%', lbl: 'Utilized', sc: statusSc },
    ],
    details: [
      ['Remaining Quota', (s.quota - s.catch).toLocaleString() + ' tons'],
      ['Daily Average', Math.round(s.catch / 55).toLocaleString() + ' tons/day'],
      ['Year-End Projection', Math.round(s.catch * 365 / 55).toLocaleString() + ' tons'],
      ['Status', s.pct > 85 ? '🔴 CRITICAL' : s.pct > 70 ? '🟡 WARNING' : '🟢 NORMAL'],
      ['Managed Zones', 'Multiple — India EEZ (Arabian Sea + Bay of Bengal)'],
    ],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [Math.round(s.catch * 0.70), Math.round(s.catch * 0.78), Math.round(s.catch * 0.88), Math.round(s.catch * 0.82), Math.round(s.catch * 0.74), Math.round(s.catch * 0.68), s.catch], color: s.color }
  };
});

// Zone ban expand data — India coastal zones
const zoneExpands = {
  'ban-east-coast': {
    icon: '🚫', title: 'East Coast — Monsoon Trawl Ban', sub: 'Annual spawning protection moratorium',
    sourceUrl: 'https://dof.gov.in/statistics',
    stats: [
      { val: 'RESTRICTED', lbl: 'Status', sc: 'sc-red' },
      { val: 'Jun 15', lbl: 'Ban Lifts', sc: 'sc-amber' },
      { val: '860k km²', lbl: 'Area', sc: 'sc-teal' },
    ],
    details: [['Ban Period', 'Apr 15 – Jun 14, 2026'], ['States', 'Tamil Nadu, Andhra Pradesh, Odisha, W. Bengal, Puducherry'], ['Reason', 'Monsoon breeding season — fish spawning protection'], ['Exemptions', 'Traditional craft <15m LOA in 0–5 NM only'], ['Authority', 'MoFAH&D Gazette SO 1568(E)']],
    chart: { type: 'line', labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'], data: [320000, 300000, 280000, 260000, 240000, 210000, 0], color: '#e53935' }
  },
  'ban-west-coast': {
    icon: '🚫', title: 'West Coast — Monsoon Trawl Ban', sub: 'Annual spawning protection moratorium',
    sourceUrl: 'https://dof.gov.in/statistics',
    stats: [
      { val: 'UPCOMING', lbl: 'Status', sc: 'sc-amber' },
      { val: 'Aug 1', lbl: 'Ban Lifts', sc: 'sc-amber' },
      { val: '1.02M km²', lbl: 'Area', sc: 'sc-teal' },
    ],
    details: [['Ban Period', 'Jun 1 – Jul 31, 2026'], ['States', 'Gujarat, Maharashtra, Goa, Karnataka, Kerala'], ['Reason', 'Monsoon breeding season — fish spawning protection'], ['Exemptions', 'Traditional craft <15m LOA in 0–5 NM only'], ['Authority', 'MoFAH&D Gazette SO 1568(E)']],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [280000, 310000, 340000, 320000, 290000, 270000, 250000], color: '#d4900a' }
  },
  'ban-arabian': {
    icon: '⚠️', title: 'Arabian Sea — Caution Zone', sub: 'Pre-monsoon quota monitoring active',
    sourceUrl: 'https://incois.gov.in/',
    stats: [
      { val: 'CAUTION', lbl: 'Status', sc: 'sc-amber' },
      { val: '83%', lbl: 'Mackerel TAC', sc: 'sc-red' },
      { val: '2,800', lbl: 'Vessels', sc: 'sc-teal' },
    ],
    details: [['Restriction', 'Indian Mackerel quota 82% — quota freeze enacted'], ['Arabian Sea', 'West Coast primary fishing zone'], ['Condition', 'Pre-monsoon advisory — watch for early swells'], ['Area', '3,862,000 km²'], ['Authority', 'CMFRI / INCOIS']],
    chart: { type: 'line', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [95000, 112000, 128000, 118000, 102000, 95000, 88000], color: '#d4900a' }
  },
  'ban-bay-bengal': {
    icon: '✅', title: 'Bay of Bengal — Active Zone', sub: 'Open season — normal operations',
    sourceUrl: 'https://incois.gov.in/',
    stats: [
      { val: 'ACTIVE', lbl: 'Status', sc: 'sc-green' },
      { val: 'Mackerel', lbl: 'Top species', sc: 'sc-teal' },
      { val: '3,200', lbl: 'Vessels', sc: 'sc-blue' },
    ],
    details: [['Season', 'Normal operations — pre-ban period'], ['Main Species', 'Sardine, Mackerel, Anchovy, Croakers'], ['TAC Used', '68% of annual MSY'], ['Area', '2,172,000 km²'], ['Authority', 'CMFRI / BOBP-IGO']],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [68000, 74000, 88000, 81000, 72000, 65000, 60000], color: '#2e7d32' }
  },
  'ban-andaman': {
    icon: '🌴', title: 'Andaman & Nicobar Sea', sub: 'Open season — tuna and pelagic species',
    sourceUrl: 'https://incois.gov.in/',
    stats: [
      { val: 'ACTIVE', lbl: 'Status', sc: 'sc-green' },
      { val: 'Tuna', lbl: 'Primary sp.', sc: 'sc-teal' },
      { val: '38%', lbl: 'TAC used', sc: 'sc-green' },
    ],
    details: [['Tuna Season', 'Year-round with peak Nov–Feb'], ['Main Species', 'Yellowfin Tuna, Skipjack, Flying Fish'], ['TAC Status', '38% — well within limits'], ['Area', '600,000 km²'], ['Authority', 'A&N Administration / Ministry of Fisheries']],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [12000, 14000, 16500, 15000, 13000, 11500, 12800], color: '#0097a7' }
  },
  'ban-lakshadweep': {
    icon: '🪸', title: 'Lakshadweep Sea', sub: 'Sustainable low-intensity coral reef zone',
    sourceUrl: 'https://incois.gov.in/',
    stats: [
      { val: 'ACTIVE', lbl: 'Status', sc: 'sc-green' },
      { val: '42%', lbl: 'TAC used', sc: 'sc-teal' },
      { val: '400', lbl: 'Vessels', sc: 'sc-blue' },
    ],
    details: [['Fishing Type', 'Pole-and-line, traditional craft only'], ['Main Species', 'Skipjack Tuna, Reef Fish'], ['TAC Status', '42% — sustainable operations'], ['Area', '400,000 km²'], ['Authority', 'Lakshadweep UT Administration / CMFRI']],
    chart: { type: 'bar', labels: ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'], data: [4200, 4800, 5500, 5100, 4500, 4100, 4600], color: '#2e7d32' }
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
    ${d.sourceUrl ? `<div class="source-badge"><a href="${d.sourceUrl}" target="_blank" rel="noopener">📎 View Data Source</a></div>` : ''}
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

function closeExpand() { if (overlay) overlay.classList.remove('active'); }

if (expandClose) {
  expandClose.addEventListener('click', closeExpand);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeExpand(); });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeExpand(); if (mapRegionOverlay) mapRegionOverlay.classList.remove('active'); } });

// Attach click → expand
document.querySelectorAll('[data-expand]').forEach(el => {
  el.addEventListener('click', () => openExpand(el.dataset.expand));
  el.style.cursor = 'pointer';
});

// Helper: re-attach click listeners to species rows after each re-render
function attachSpeciesRowClicks() {
  document.querySelectorAll('.species-row').forEach((el, i) => {
    el.addEventListener('click', () => openExpand('species-' + i));
    el.style.cursor = 'pointer';
  });
}
// Attach for initial (synchronous) render
attachSpeciesRowClicks();
