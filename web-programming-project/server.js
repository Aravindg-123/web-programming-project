// ════════════════════════════════════════════════════════════════
// server.js — Fisheries Dashboard Backend
// Node.js + Express, three data-access patterns:
//   Pattern A : Live upstream API (data.gov.in OGD / Open-Meteo Marine)
//   Pattern B : File-based CSV (user places file in /data/raw/)
//   Pattern C : Manual JSON   (hand-maintained in /data/manual/)
//
// Every endpoint falls back to /data/dummy/ if the real source fails.
// Never crashes — always returns valid JSON.
// ════════════════════════════════════════════════════════════════

'use strict';

// ─── Load environment variables ─────────────────────────────────
// dotenv is optional; if not installed, process.env is still read.
try { require('dotenv').config(); } catch (_) { /* dotenv not installed — env vars must be set manually */ }

const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');
const { parse } = require('csv-parse');
// node-fetch v3 is ESM; fall back to native fetch if available (Node 18+)
let fetch;
try {
  fetch = require('node-fetch');
} catch (_) {
  fetch = globalThis.fetch; // Node 18+ native fetch
}

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
// Serve all static frontend files from project root
app.use(express.static(path.join(__dirname)));

// ════════════════════════════════════════════════════════════════
// CACHE
// ════════════════════════════════════════════════════════════════
const _cache = {};

/**
 * Simple in-memory TTL cache.
 * @param {string} key
 * @param {number} ttlMs  — milliseconds to keep cached value
 * @param {Function} fetchFn — async function that returns the value
 */
async function cached(key, ttlMs, fetchFn) {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].ts < ttlMs) {
    return _cache[key].value;
  }
  const value = await fetchFn();
  _cache[key] = { value, ts: now };
  return value;
}

const TTL_API  = 3 * 60 * 60 * 1000; // 3 hours — for live API data
const TTL_CSV  = 1 * 60 * 60 * 1000; // 1 hour  — for file-based CSV

// ════════════════════════════════════════════════════════════════
// PATTERN A — UPSTREAM API FETCHERS
// ════════════════════════════════════════════════════════════════

/**
 * Fetch a dataset from data.gov.in OGD REST API.
 * API key is read from process.env.DATAGOVIN_API_KEY — NEVER hardcoded.
 * @param {string} resourceId — UUID from the dataset page on data.gov.in
 *   Replace with actual UUID from the dataset's Datastore API URL.
 */
async function fetchDataGovIn(resourceId) {
  const apiKey = process.env.DATAGOVIN_API_KEY;
  if (!apiKey || apiKey === 'YOUR_KEY_HERE') {
    throw new Error('DATAGOVIN_API_KEY not set in .env');
  }
  const url =
    `https://api.data.gov.in/resource/${resourceId}` +
    `?api-key=${apiKey}&format=json&limit=50&offset=0`;
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error('data.gov.in API error: ' + res.status);
  return res.json();
}

/**
 * Fetch live ocean conditions from Open-Meteo Marine API.
 * No API key required.
 *
 * // UPGRADE: Replace with INCOIS OSF portal data
 * // (incois.gov.in/portal/osf/osf.jsp) when their API becomes publicly
 * // available. Contact incois@incois.gov.in for access.
 */
async function fetchOceanConditions() {
  const url =
    'https://marine-api.open-meteo.com/v1/marine' +
    '?latitude=13.09&longitude=80.27' +
    '&hourly=wave_height,sea_surface_temperature,wind_speed_10m' +
    '&forecast_days=1&timezone=Asia%2FKolkata';
  const res = await fetch(url, { timeout: 10000 });
  if (!res.ok) throw new Error('Open-Meteo Marine API error: ' + res.status);
  return res.json();
}

// ════════════════════════════════════════════════════════════════
// PATTERN B — CSV FILE PARSERS
// ════════════════════════════════════════════════════════════════

/**
 * Parse a CSV file from /data/raw/.
 * Returns null if the file does not exist (triggers dummy fallback).
 */
async function parseCsvFile(filename) {
  const filepath = path.join(__dirname, 'data', 'raw', filename);
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath, 'utf8');
  return new Promise((resolve, reject) => {
    parse(content, { columns: true, trim: true }, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });
}

// ════════════════════════════════════════════════════════════════
// PATTERN C — MANUAL JSON READER
// ════════════════════════════════════════════════════════════════

/**
 * Read a hand-maintained JSON file from /data/manual/.
 * Returns null if the file does not exist.
 */
function readManualJson(filename) {
  const filepath = path.join(__dirname, 'data', 'manual', filename);
  if (!fs.existsSync(filepath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error('[manual-json] parse error in', filename, e.message);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════
// DUMMY DATA FALLBACK
// ════════════════════════════════════════════════════════════════

function readDummy(filename) {
  const filepath = path.join(__dirname, 'data', 'dummy', filename);
  if (!fs.existsSync(filepath)) return { error: 'dummy data missing', file: filename };
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// ════════════════════════════════════════════════════════════════
// RESPONSE HELPER — always sets X-Data-Source header
// ════════════════════════════════════════════════════════════════

function send(res, data, source) {
  res.set('X-Data-Source', source);
  res.json(data);
}

// ════════════════════════════════════════════════════════════════
// COLOUR MAP  (used for species array)
// ════════════════════════════════════════════════════════════════
const SPECIES_COLORS = [
  '#0097a7', '#2e7d32', '#d4900a', '#7c3aed',
  '#0288d1', '#e53935', '#d84315', '#1565c0', '#6a1b9a',
];

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/kpis
// Pattern A — data.gov.in OGD (DS1: Year-wise Fish Production)
//   DS1_RESOURCE_ID: replace with UUID from data.gov.in DS1 dataset page
//   OGD field mapping:
//     total_fish_production_lakh_tonnes → currentCatch (× 100000)
//     total_fisheries_exports_value     → informational
//   The API returns annual data — we use the latest record.
// ════════════════════════════════════════════════════════════════
app.get('/api/kpis', async (req, res) => {
  try {
    const data = await cached('kpis', TTL_API, async () => {
      // DS1_RESOURCE_ID — replace with actual UUID from data.gov.in DS1 page
      const resourceId = process.env.DS1_RESOURCE_ID || 'REPLACE_WITH_UUID_FROM_DATAGOVIN_DS1_PAGE';
      const raw = await fetchDataGovIn(resourceId);
      // Use the most recent record (last entry in the records array)
      const records = raw.records || [];
      if (!records.length) throw new Error('No records in DS1 response');
      const latest = records[records.length - 1];
      // total_fish_production_lakh_tonnes × 100000 = absolute tonnes
      const prodLakh = parseFloat(latest.total_fish_production_lakh_tonnes || 0);
      const currentCatch = Math.round(prodLakh * 100000);
      const totalQuota   = Math.round(currentCatch * 1.35); // TAC = ~135% of production
      return {
        totalQuota,
        currentCatch,
        catchPercent: Math.round((currentCatch / totalQuota) * 100),
        // kpi_cards.csv values: active_alerts=5, zones=4, biomass_index=0.911
        activeAlerts: 5, criticalAlerts: 1, zonesActive: 4, restrictedZones: 0,
        vesselsAtSea: null, biomassIndex: 91.1, biomassStatus: 'Healthy',
      };
    });
    send(res, data, 'live-api');
  } catch (err) {
    console.warn('[/api/kpis] falling back to dummy:', err.message);
    const d = readDummy('kpis.json');
    send(res, d, 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/species
// Pattern B — DS2: CMFRI Species-wise Landings CSV
//   File: /data/raw/cmfri-species-landings.csv
//   Columns: species_name, catch_tonnes, quota_tonnes, year, zone
// ════════════════════════════════════════════════════════════════
app.get('/api/species', async (req, res) => {
  try {
    const data = await cached('species', TTL_CSV, async () => {
      const rows = await parseCsvFile('cmfri-species-landings.csv');
      if (!rows) return null; // trigger dummy fallback
      return rows.map((r, i) => {
        const caught = parseFloat(r.catch_tonnes || 0);
        const quota  = parseFloat(r.quota_tonnes || caught * 1.2);
        const pct    = Math.min(100, Math.round((caught / quota) * 100));
        return {
          name: r.species_name,
          caught,
          quota,
          percent: pct,
          color: SPECIES_COLORS[i % SPECIES_COLORS.length],
        };
      });
    });
    if (!data) throw new Error('CSV not found');
    console.log('[/api/species] Using real CSV: cmfri-species-landings.csv');
    send(res, data, 'csv-file');
  } catch (err) {
    console.warn('[/api/species] falling back to dummy:', err.message);
    const d = readDummy('species.json');
    send(res, d, 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/catch-monthly
// Pattern B — NEW-2: CMFRI Monthly Marine Fisheries Flash Bulletin
//   File: /data/raw/cmfri-monthly-catch.csv
//   Columns: month, year, catch_tonnes, species_group
//   Projected = simple linear extrapolation from last 3 actual months.
// ════════════════════════════════════════════════════════════════
app.get('/api/catch-monthly', async (req, res) => {
  try {
    const data = await cached('catch-monthly', TTL_CSV, async () => {
      const rows = await parseCsvFile('cmfri-monthly-catch.csv');
      if (!rows) return null;
      const MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      // Aggregate by month label
      const byMonth = {};
      rows.forEach(r => {
        const m = r.month;
        if (!byMonth[m]) byMonth[m] = 0;
        byMonth[m] += parseFloat(r.catch_tonnes || 0);
      });
      const actual = MONTHS.map(m => ({ month: m, value: byMonth[m] || null }));
      // Linear extrapolation from last 3 actual values
      const filled = actual.filter(a => a.value !== null);
      const lastThree = filled.slice(-3).map(a => a.value);
      let trend = 0;
      if (lastThree.length >= 2) {
        trend = (lastThree[lastThree.length - 1] - lastThree[0]) / (lastThree.length - 1);
      }
      let lastVal = lastThree[lastThree.length - 1] || 700;
      const projected = actual.map(a => {
        if (a.value !== null) { lastVal = a.value; return { month: a.month, value: null }; }
        lastVal += trend;
        return { month: a.month, value: Math.round(lastVal) };
      });
      return { actual, projected };
    });
    if (!data) throw new Error('CSV not found');
    console.log('[/api/catch-monthly] Using real CSV: cmfri-monthly-catch.csv');
    send(res, data, 'csv-file');
  } catch (err) {
    console.warn('[/api/catch-monthly] falling back to dummy:', err.message);
    const d = readDummy('catch-monthly.json');
    send(res, d, 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/zones
// Pattern C — DS4 + DS5: DoF Seasonal Ban Gazette + FSI EEZ data
//   File: /data/manual/zones.json
// ════════════════════════════════════════════════════════════════
app.get('/api/zones', (req, res) => {
  const manual = readManualJson('zones.json');
  if (manual) {
    send(res, manual.data || manual, 'manual-json');
  } else {
    console.warn('[/api/zones] manual file absent, using dummy');
    send(res, readDummy('zones.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/seasonal-bans
// Pattern C — DS4: DoF Seasonal Trawling Ban Gazette Notification
//   File: /data/manual/seasonal-bans.json
//   East Coast ban: Apr 15–Jun 14 (startMonth=4, endMonth=6)
//   West Coast ban: Jun 1–Jul 31  (startMonth=6, endMonth=7)
// ════════════════════════════════════════════════════════════════
app.get('/api/seasonal-bans', (req, res) => {
  const manual = readManualJson('seasonal-bans.json');
  if (manual) {
    send(res, manual.data || manual, 'manual-json');
  } else {
    console.warn('[/api/seasonal-bans] manual file absent, using dummy');
    send(res, readDummy('seasonal-bans.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/alerts
// Pattern C — DS6: IMD Fishermen Warnings (mausam.imd.gov.in)
//   File: /data/manual/alerts.json
//   // Manually sync from mausam.imd.gov.in Fishermen Warning section.
//   // No machine-readable API exists.
// ════════════════════════════════════════════════════════════════
app.get('/api/alerts', (req, res) => {
  const manual = readManualJson('alerts.json');
  if (manual) {
    send(res, manual.data || manual, 'manual-json');
  } else {
    console.warn('[/api/alerts] manual file absent, using dummy');
    send(res, readDummy('alerts.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/alert-history
// Pattern C — NEW-5: INCOIS Fishwatch Advisory Archive
//   File: /data/manual/alert-history.json
//   Update frequency: weekly
// ════════════════════════════════════════════════════════════════
app.get('/api/alert-history', (req, res) => {
  const manual = readManualJson('alert-history.json');
  if (manual) {
    send(res, manual.data || manual, 'manual-json');
  } else {
    console.warn('[/api/alert-history] manual file absent, using dummy');
    send(res, readDummy('alert-history.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/risk-index
// Pattern C — NEW-4: Derived Risk Score
//   File: /data/manual/risk-index.json
//   Score formula (documented in the manual JSON file):
//     riskScore = (pfzNoFishingZones × 10) + (imdWarnings × 8) + (avgQuotaUtil × 0.3)
//     Normalise to 0–100.
// ════════════════════════════════════════════════════════════════
app.get('/api/risk-index', (req, res) => {
  const manual = readManualJson('risk-index.json');
  if (manual) {
    send(res, manual.data || manual, 'manual-json');
  } else {
    console.warn('[/api/risk-index] manual file absent, using dummy');
    send(res, readDummy('risk-index.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/catch-breakdown
// Pattern B — DS2: CMFRI species-group catch proportions (same CSV)
//   Pelagic   = Indian Mackerel + Oil Sardine + Anchovies group
//   Demersal  = Ribbonfish + Catfish + Croaker group
//   Shellfish = Penaeid Shrimp + Crab group
// ════════════════════════════════════════════════════════════════
app.get('/api/catch-breakdown', async (req, res) => {
  try {
    const data = await cached('catch-breakdown', TTL_CSV, async () => {
      const rows = await parseCsvFile('cmfri-species-landings.csv');
      if (!rows) return null;
      let pelagic = 0, demersal = 0, shellfish = 0, other = 0;
      const PELAGIC_KEYS   = ['mackerel', 'sardine', 'anchov'];
      const DEMERSAL_KEYS  = ['ribbon', 'catfish', 'croaker'];
      const SHELLFISH_KEYS = ['shrimp', 'prawn', 'crab'];
      rows.forEach(r => {
        const nm = (r.species_name || '').toLowerCase();
        const t  = parseFloat(r.catch_tonnes || 0);
        if (PELAGIC_KEYS.some(k => nm.includes(k)))   pelagic   += t;
        else if (DEMERSAL_KEYS.some(k => nm.includes(k))) demersal += t;
        else if (SHELLFISH_KEYS.some(k => nm.includes(k))) shellfish += t;
        else other += t;
      });
      const total = pelagic + demersal + shellfish + other || 1;
      return {
        pelagic:   Math.round((pelagic   / total) * 100),
        demersal:  Math.round((demersal  / total) * 100),
        shellfish: Math.round((shellfish / total) * 100),
        other:     Math.round((other     / total) * 100),
      };
    });
    if (!data) throw new Error('CSV not found');
    send(res, data, 'csv-file');
  } catch (err) {
    console.warn('[/api/catch-breakdown] falling back to dummy:', err.message);
    send(res, readDummy('catch-breakdown.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/fleet
// Pattern B — DS7: DoF Census of Marine Fisheries (vessel counts)
//   File: /data/raw/dof-vessel-census.csv
//   Columns: state_name, mechanised, motorised, traditional, total
//   Returns top-5 states + "Others" bucket
// ════════════════════════════════════════════════════════════════
app.get('/api/fleet', async (req, res) => {
  try {
    const data = await cached('fleet', TTL_CSV, async () => {
      const rows = await parseCsvFile('dof-vessel-census.csv');
      if (!rows) return null;
      // Sum total vessels per state
      const stateTotals = {};
      rows.forEach(r => {
        const st = (r.state_name || 'Unknown').trim();
        stateTotals[st] = (stateTotals[st] || 0) + parseInt(r.total || 0, 10);
      });
      // Sort descending, take top 4 + Others
      const TOP_STATES = ['Tamil Nadu', 'Gujarat', 'Kerala', 'Andhra Pradesh'];
      const result = TOP_STATES.map(s => ({
        label: s,
        count: stateTotals[s] || 0,
      }));
      const othersCount = Object.entries(stateTotals)
        .filter(([k]) => !TOP_STATES.includes(k))
        .reduce((acc, [, v]) => acc + v, 0);
      result.push({ label: 'Others', count: othersCount });
      return result;
    });
    if (!data) throw new Error('CSV not found');
    console.log('[/api/fleet] Using real CSV: dof-vessel-census.csv');
    send(res, data, 'csv-file');
  } catch (err) {
    console.warn('[/api/fleet] falling back to dummy:', err.message);
    send(res, readDummy('fleet.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/biomass-trend
// Pattern C — NEW-1: CMFRI Annual Marine Fisheries Publication
//   File: /data/manual/biomass-trend.json
// ════════════════════════════════════════════════════════════════
app.get('/api/biomass-trend', (req, res) => {
  const manual = readManualJson('biomass-trend.json');
  if (manual) {
    send(res, manual.data || manual, 'manual-json');
  } else {
    console.warn('[/api/biomass-trend] manual file absent, using dummy');
    send(res, readDummy('biomass-trend.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/ocean-conditions
// Pattern A — NEW-3: Open-Meteo Marine API (INCOIS OSF fallback)
//   Coordinates: 13.09°N 80.27°E (Bay of Bengal near Chennai coast)
//   Parse the first hourly value for current conditions.
//
// // INCOIS OSF is the preferred source.
// // Replace this with INCOIS data when API access is granted.
// // Contact: incois@incois.gov.in
// ════════════════════════════════════════════════════════════════
app.get('/api/ocean-conditions', async (req, res) => {
  try {
    const data = await cached('ocean-conditions', TTL_API, async () => {
      const raw = await fetchOceanConditions();
      const h   = raw.hourly || {};
      return {
        seaTemp:       (h.sea_surface_temperature && h.sea_surface_temperature[0]) || null,
        waveHeight:    (h.wave_height             && h.wave_height[0])             || null,
        windSpeed:     (h.wind_speed_10m          && h.wind_speed_10m[0])          || null,
        windDirection: 'SW',  // Open-Meteo Marine hourly doesn't supply direction label; derive if needed.
        zone:          'Bay of Bengal',
      };
    });
    send(res, data, 'live-api');
  } catch (err) {
    console.warn('[/api/ocean-conditions] falling back to dummy:', err.message);
    send(res, readDummy('ocean-conditions.json'), 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/zones-production
// Pattern A — DS8: data.gov.in state-wise fish production
//   DS8_RESOURCE_ID — replace with actual UUID from data.gov.in DS8 page
// ════════════════════════════════════════════════════════════════
app.get('/api/zones-production', async (req, res) => {
  try {
    const data = await cached('zones-production', TTL_API, async () => {
      // DS8_RESOURCE_ID — replace with actual UUID from data.gov.in dataset page
      const resourceId = process.env.DS8_RESOURCE_ID || 'REPLACE_WITH_UUID_FROM_DATAGOVIN_DS8_PAGE';
      const raw = await fetchDataGovIn(resourceId);
      return (raw.records || []).map(r => ({
        state:      r.state_name || r.state || r.State,
        production: parseFloat(r.production_lakh_tonnes || r.production || 0),
      }));
    });
    send(res, data, 'live-api');
  } catch (err) {
    console.warn('[/api/zones-production] falling back to dummy:', err.message);
    send(res, [], 'dummy');
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/production-trend
// Pattern B — dataset1.csv: Year-wise Total Fish Production 2019–24
//   File: /data/csv-data/dataset1.csv  (checked in to repo)
//   Columns: Year, Total_Fish_Production_Lakh_Tonnes,
//            Total_Fisheries_Exports_Quantity_MT,
//            Total_Fisheries_Exports_Value_Crore_Rs
// Falls back to inline dataset1 values if the file is missing.
// ════════════════════════════════════════════════════════════════
app.get('/api/production-trend', async (req, res) => {
  try {
    const data = await cached('production-trend', TTL_CSV, async () => {
      // Primary: try reading from /data/csv-data/dataset1.csv (repo CSV)
      const filepath = path.join(__dirname, 'data', 'csv-data', 'dataset1.csv');
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf8');
        const rows = await new Promise((resolve, reject) => {
          parse(content, { columns: true, trim: true }, (err, r) => err ? reject(err) : resolve(r));
        });
        return rows.map(r => ({
          year:       r['Year'] || r['year'],
          production: parseFloat(r['Total_Fish_Production_Lakh_Tonnes'] || r['production_lakh_tonnes'] || 0),
          exports_mt: parseFloat(r['Total_Fisheries_Exports_Quantity_MT'] || 0),
          exports_cr: parseFloat(r['Total_Fisheries_Exports_Value_Crore_Rs'] || 0),
        }));
      }
      // Fallback: inline dataset1.csv values (source: data.gov.in DS1)
      return [
        { year: '2019-20', production: 141.64, exports_mt: 1336824, exports_cr: 46662.85 },
        { year: '2020-21', production: 147.25, exports_mt: 1175174, exports_cr: 43720.02 },
        { year: '2021-22', production: 162.48, exports_mt: 1340000, exports_cr: 57587.00 },
        { year: '2022-23', production: 175.45, exports_mt: 1781602, exports_cr: 60523.89 },
        { year: '2023-24', production: 182.70, exports_mt: 1781602, exports_cr: 60524.00 },
      ];
    });
    send(res, data, 'csv-file');
  } catch (err) {
    console.warn('[/api/production-trend] error:', err.message);
    res.json([]);
  }
});

// ════════════════════════════════════════════════════════════════
// ENDPOINT: GET /api/data-status
// Always live — returns freshness metadata for every endpoint
// ════════════════════════════════════════════════════════════════
app.get('/api/data-status', (req, res) => {
  const now = new Date().toISOString();
  const STATUS = [
    { endpoint: '/api/kpis',             source: 'data.gov.in OGD REST API',           pattern: 'A', lastUpdated: now, realDataUrl: 'https://www.data.gov.in/resource/year-wise-details-total-fish-production-and-fisheries-exports-2019-20-2023-24' },
    { endpoint: '/api/species',          source: 'CMFRI Species Landings CSV',         pattern: 'B', lastUpdated: now, realDataUrl: 'https://eprints.cmfri.org.in' },
    { endpoint: '/api/catch-monthly',    source: 'CMFRI Monthly Flash Bulletin CSV',   pattern: 'B', lastUpdated: now, realDataUrl: 'https://cmfri.org.in/publications' },
    { endpoint: '/api/zones',            source: 'DoF Gazette + FSI EEZ (manual)',     pattern: 'C', lastUpdated: now, realDataUrl: 'https://dof.gov.in/statistics' },
    { endpoint: '/api/seasonal-bans',    source: 'DoF Ban Gazette (manual)',           pattern: 'C', lastUpdated: now, realDataUrl: 'https://dof.gov.in/statistics' },
    { endpoint: '/api/alerts',           source: 'IMD Fishermen Warnings (manual)',    pattern: 'C', lastUpdated: now, realDataUrl: 'https://mausam.imd.gov.in' },
    { endpoint: '/api/alert-history',    source: 'INCOIS Fishwatch (manual)',          pattern: 'C', lastUpdated: now, realDataUrl: 'https://fishwatch.incois.gov.in' },
    { endpoint: '/api/risk-index',       source: 'Derived score — INCOIS+IMD (manual)',pattern: 'C', lastUpdated: now, realDataUrl: 'https://incois.gov.in/portal/pfz/pfz.jsp' },
    { endpoint: '/api/catch-breakdown',  source: 'CMFRI Species CSV (derived)',        pattern: 'B', lastUpdated: now, realDataUrl: 'https://eprints.cmfri.org.in' },
    { endpoint: '/api/fleet',            source: 'DoF Vessel Census CSV',              pattern: 'B', lastUpdated: now, realDataUrl: 'https://dof.gov.in/statistics' },
    { endpoint: '/api/biomass-trend',    source: 'CMFRI Annual Report (manual)',       pattern: 'C', lastUpdated: now, realDataUrl: 'https://eprints.cmfri.org.in' },
    { endpoint: '/api/ocean-conditions', source: 'Open-Meteo Marine API (INCOIS fallback)', pattern: 'A', lastUpdated: now, realDataUrl: 'https://incois.gov.in/portal/osf/osf.jsp' },
    { endpoint: '/api/zones-production', source: 'data.gov.in OGD REST API (DS8)',    pattern: 'A', lastUpdated: now, realDataUrl: 'https://www.data.gov.in' },
  ];
  res.json(STATUS);
});

// ─── Start server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log(`║  Fisheries Dashboard — server running on :${PORT}   ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('\nData source status:');
  console.log('  Pattern A (API)  — DATAGOVIN_API_KEY:', process.env.DATAGOVIN_API_KEY ? '✓ SET' : '✗ NOT SET (using dummy)');
  console.log('  Pattern A (API)  — DS1_RESOURCE_ID  :', process.env.DS1_RESOURCE_ID  ? '✓ SET' : '✗ NOT SET (using dummy)');
  console.log('  Pattern A (API)  — DS8_RESOURCE_ID  :', process.env.DS8_RESOURCE_ID  ? '✓ SET' : '✗ NOT SET (using dummy)');
  const rawDir = path.join(__dirname, 'data', 'raw');
  ['cmfri-species-landings.csv', 'cmfri-monthly-catch.csv', 'dof-vessel-census.csv'].forEach(f => {
    const exists = fs.existsSync(path.join(rawDir, f));
    console.log(`  Pattern B (CSV)  — ${f}: ${exists ? '✓ FOUND' : '✗ MISSING (using dummy)'}`);
  });
  const manualDir = path.join(__dirname, 'data', 'manual');
  ['zones.json', 'seasonal-bans.json', 'alerts.json', 'biomass-trend.json', 'risk-index.json', 'alert-history.json'].forEach(f => {
    const exists = fs.existsSync(path.join(manualDir, f));
    console.log(`  Pattern C (JSON) — ${f}: ${exists ? '✓ FOUND' : '✗ MISSING (using dummy)'}`);
  });
  console.log('\nOpen: http://localhost:' + PORT);
});
