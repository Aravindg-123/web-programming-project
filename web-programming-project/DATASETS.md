# Dataset Integration Guide

## Access Pattern Legend
- **Pattern A (Live API)** — server.js fetches upstream API at runtime
- **Pattern B (File-based CSV)** — download file, place in /data/raw/, server parses
- **Pattern C (Manual JSON)** — hand-maintained JSON, update /data/manual/ files

## Endpoint ↔ Dataset Mapping

| Endpoint | Pattern | Dataset | Download / Register | File to update | Frequency |
|---|---|---|---|---|---|
| /api/kpis | A | DS1 — DoF Year-wise Production | Register at data.gov.in → set DS1_RESOURCE_ID in .env | .env | Annually |
| /api/species | B | DS2 — CMFRI Species Landings | eprints.cmfri.org.in → download CSV | /data/raw/cmfri-species-landings.csv | Annually |
| /api/catch-monthly | B | NEW-2 — CMFRI Monthly Bulletin | cmfri.org.in/publications → extract table | /data/raw/cmfri-monthly-catch.csv | Monthly |
| /api/zones | C | DS4+DS5 — DoF Gazette + FSI EEZ | dof.gov.in gazette + fsi.gov.in | /data/manual/zones.json | Annually |
| /api/seasonal-bans | C | DS4 — DoF Ban Gazette | dof.gov.in/statistics | /data/manual/seasonal-bans.json | Annually (before April) |
| /api/alerts | C | DS6 — IMD Fishermen Warnings | mausam.imd.gov.in fishermen page | /data/manual/alerts.json | Daily during monsoon |
| /api/alert-history | C | NEW-5 — INCOIS Fishwatch | fishwatch.incois.gov.in | /data/manual/alert-history.json | Weekly |
| /api/risk-index | C | NEW-4 — Derived score | incois.gov.in/portal/pfz + IMD | /data/manual/risk-index.json | Weekly |
| /api/catch-breakdown | B | DS2 — CMFRI (same CSV) | Same as /api/species | /data/raw/cmfri-species-landings.csv | Annually |
| /api/fleet | B | DS7 — DoF Vessel Census | dof.gov.in/statistics → Excel | /data/raw/dof-vessel-census.csv | Per census |
| /api/biomass-trend | C | NEW-1 — CMFRI Annual Report | eprints.cmfri.org.in annual PDF | /data/manual/biomass-trend.json | Annually |
| /api/ocean-conditions | A | NEW-3 — Open-Meteo Marine (INCOIS fallback) | No key needed | — | Live (3-hour cache) |
| /api/zones-production | A | DS8 — State-wise production | Register at data.gov.in → set DS8_RESOURCE_ID in .env | .env | Annually |

## How to activate real data (step-by-step)

### Pattern A (data.gov.in):
1. Register at https://data.gov.in → Dashboard → My Account → Generate Key
2. Find each dataset's page on data.gov.in
3. Copy the UUID from the Datastore API URL on that page
4. Set `DATAGOVIN_API_KEY`, `DS1_RESOURCE_ID`, `DS8_RESOURCE_ID` in `.env`
5. Restart server — `/api/kpis` will now return live government data

### Pattern B (CSV files):
1. Download CSV from the source URL in the table above
2. Rename to the exact filename shown in "File to update" column
3. Place in `/data/raw/`
4. Restart server — endpoint auto-detects the file
5. Server logs `"Using real CSV: {filename}"` on startup

### Pattern C (manual JSON):
1. Open the file in `/data/manual/`
2. Replace dummy values with real figures from the source
3. Remove the `"__meta.dataType: DUMMY"` flag — change to `"MANUAL-LIVE"`
4. No restart needed — files are read on each request

## Risk Index Score Formula

The `/api/risk-index` endpoint reads from `/data/manual/risk-index.json`.
Each week, compute the score manually:

```
riskScore = (pfzNoFishingZones × 10) + (imdWarnings × 8) + (avgQuotaUtil × 0.3)
Normalise to 0–100
```

Sources:
- **pfzNoFishingZones**: Count of active "no fishing" PFZ sectors at [incois.gov.in/portal/pfz/pfz.jsp](https://incois.gov.in/portal/pfz/pfz.jsp)
- **imdWarnings**: Count of red/orange fishermen warnings at [mausam.imd.gov.in](https://mausam.imd.gov.in)
- **avgQuotaUtil**: Average `percent` across all species from `/api/species`

## X-Data-Source Response Header

Every API endpoint returns an `X-Data-Source` header with one of:

| Value | Meaning |
|---|---|
| `live-api` | Data fetched from upstream REST API |
| `csv-file` | Data parsed from a file in `/data/raw/` |
| `manual-json` | Data read from a file in `/data/manual/` |
| `dummy` | Fallback — real source unavailable |

## Running the server

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm start
# Dashboard available at http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```
