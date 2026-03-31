# 🐟 MARINE BOARD - Fisheries Resources Management Dashboard


> A production-grade, glassmorphic web dashboard for real-time fisheries monitoring — built with vanilla HTML, CSS, and JavaScript. No frameworks. No build tools. Open in a browser and it just works.

---

This project is part of the course, 

**BCSE203E - Web Programming** under Respected Faculty **Dr. Suvidha Rupesh Kumar madam**.

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Requirements](#2-requirements)
3. [Tech Stack](#3-tech-stack-used)
4. [Project Structure](#4-project-structure)
5. [Pages & Features](#5-pages--features-in-detail)
6. [User Guide](#6-user-guide--tutorial)

---

## 1. Problem Statement

### Background

Global fisheries are under unprecedented pressure. According to the FAO, over **35% of the world's fish stocks are overexploited**, and that number is rising. Regulatory bodies like ICES (International Council for the Exploration of the Sea), NAFO, and national fisheries ministries manage these stocks through a system of Total Allowable Catches (TAC), seasonal bans, vessel licenses, and zone-level quotas.

### The Challenge

Despite the existence of this regulatory framework, enforcement and situational awareness remain fragmented. Fisheries officers, policy analysts, and zone managers often rely on:

- Spreadsheets updated weekly or monthly
- Static PDF reports from ICES and NAFO
- Disconnected AIS (vessel tracking) tools
- Manual alert systems triggered only after thresholds are breached

This creates a **critical lag** between an overfishing event occurring and a decision-maker being aware of it — sometimes measured in days, not hours.

### What This Dashboard Solves

The **Fisheries Resources Management Dashboard** provides a single, unified, real-time web interface that:

- Consolidates quota, catch, alert, and zone data into one visual system
- Enables rapid situational awareness across all managed fishing zones — from the Grand Banks to the Bay of Bengal
- Highlights critical events (TAC breaches, vessel density violations, near-cap species) with instant visual cues
- Gives detailed drill-down capability per zone, species, and event through interactive popups with inline charts
- Remains fully accessible via any modern browser with no installation, no backend, and no dependencies beyond a CDN

### Target Users

| Role | Use Case |
|------|----------|
| Fisheries Officer | Monitor real-time zone status, respond to alerts |
| Policy Analyst | Track quota utilisation trends across seasons |
| Zone Manager | Assess vessel density, species health, seasonal bans |
| ICES / NAFO Delegate | Review cross-zone overfishing risk indices |
| Marine Biologist | Monitor biomass recovery trends over years |

---

## 2. Requirements

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Display live summary metrics: total quota, current catch, active alerts, active zones, vessels at sea, biomass index |
| FR-02 | Render an interactive world map with real-world fishing zones, colour-coded by status |
| FR-03 | On map region hover: highlight the hovered region, fade others, show a tooltip with key data |
| FR-04 | On map region click: open a popup with full zone metrics, inline interactive chart, and detail rows |
| FR-05 | On metric card click: open a popup with detailed stats, inline chart, and detail breakdown |
| FR-06 | Display species quotas with animated progress bars |
| FR-07 | Show seasonal ban grid with per-zone status |
| FR-08 | Show a live activity feed with colour-coded event indicators |
| FR-09 | Display four chart types: bar, line, doughnut, and polar area |
| FR-10 | Include separate sub-pages for Quotas, Current Catch, Alerts, and Seasonal Bans |
| FR-11 | Support a light/dark theme toggle that persists across sessions |
| FR-12 | Render all numeric values in a distinct monospace font for readability |
| FR-13 | Make the right sidebar scrollable to accommodate all data |
| FR-14 | Popups must support minimal internal scrolling to display full content + chart |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Zero dependencies beyond a single CDN script (Chart.js) and Google Fonts |
| NFR-02 | No build step, no bundler, no server — open `index.html` directly |
| NFR-03 | Responsive layout that works on modern desktop browsers |
| NFR-04 | All theme transitions must be smooth (CSS transitions ≤ 0.4s) |
| NFR-05 | Popup charts must be destroyed and re-created cleanly to avoid Chart.js canvas conflicts |
| NFR-06 | Map must re-render on window resize (responsive canvas) |
| NFR-07 | Theme preference must persist via `localStorage` |

---

## 3. Tech Stack Used

This project is built entirely with **vanilla web technologies** — deliberately avoiding frameworks, build tools, and backend dependencies.

### Core Technologies

| Technology | Version / Detail | Purpose |
|------------|-----------------|---------|
| **HTML5** | Semantic markup | Page structure, ARIA attributes |
| **CSS3** | Custom properties, Grid, Flexbox | Layout, theming, glassmorphism, animations |
| **JavaScript (ES2020+)** | Vanilla JS, no transpiler | Interactivity, canvas rendering, data logic |
| **Canvas API** | Native browser API | World map rendering with custom drawing |

### Libraries (CDN)

| Library | Version | CDN Source | Purpose |
|---------|---------|-----------|---------|
| **Chart.js** | 4.4.1 | cdnjs.cloudflare.com | Bar, line, doughnut, polar area charts |

### Fonts (Google Fonts CDN)

| Font | Style | Usage |
|------|-------|-------|
| **Cormorant Garamond** | 300–700, serif | Display titles, metric labels, expand headings |
| **DM Sans** | 300–600, sans-serif | Body text, labels, navigation, tooltips |
| **JetBrains Mono** | 400–600, monospace | All numeric values — quota figures, percentages, catch volumes |

> **Why JetBrains Mono for numbers?** Tabular numerals in a monospace font ensure that columns of figures align perfectly, decimal points are visually consistent, and numbers are clearly distinguished from surrounding text — a critical requirement in a data-heavy regulatory dashboard.

### Design System

| Element | Approach |
|---------|---------|
| **Glassmorphism** | `backdrop-filter: blur()` + semi-transparent backgrounds for all cards |
| **CSS Custom Properties** | Full dual-theme system via `:root` (light) and `body.dark` (dark) variable sets |
| **Colour Semantics** | Teal = primary data, Amber = warning, Coral/Red = critical, Jade = healthy/active, Violet = monitoring |
| **Animations** | CSS keyframes for load (`fadeIn`, `fadeSlide`), JS cubic-bezier for toggle spring animation |

---

## 4. Project Structure

```
fisheries-dashboard/
│
├── index.html          ← Main dashboard page
├── quotas.html         ← Total Fishing Quota sub-page
├── catch.html          ← Current Catch Volume sub-page
├── alerts.html         ← Active Overfishing Alerts sub-page
├── bans.html           ← Active Seasonal Bans sub-page
│
├── style.css           ← Shared stylesheet (all pages)
├── main.js             ← Main dashboard logic (map, charts, expand system)
└── subpage-shared.js   ← Shared utility functions for sub-pages
```

### File Responsibilities

#### `index.html`
The main entry point. Contains the full dashboard layout:
- Navigation bar with theme toggle
- Top metric strip (6 metric cards)
- Three-column grid: Species Quotas (left), World Map + Bottom Charts (centre), Scrollable Sidebar (right)
- Expand overlay markup (shared modal container)
- Loads `main.js`

#### `style.css`
A single shared stylesheet used across all 5 pages. Contains:
- CSS custom properties for both light and dark themes
- All layout systems: main grid, sub-page layout, card components
- Glassmorphism card styles
- Expand overlay styles (including scrollable popup box)
- Data table and progress bar styles for sub-pages
- Keyframe animations
- Number font override (`font-family: var(--font-mono)`) applied globally to all metric value elements

#### `main.js`
The largest and most complex script. Responsibilities:
- Theme toggle logic + localStorage persistence
- **Canvas World Map**: full drawing pipeline — ocean gradient, grid, continent outlines, fishing zone regions, compass rose
- **Map interactivity**: `mousemove` hit-testing against region polygons, hover effects, tooltip, click-to-expand
- Species list rendering with animated quota bars
- Activity feed rendering
- All Chart.js instances: bar, donut, line, polar area, horizontal bar, biomass trend
- `expandData` object — all popup content definitions
- `openExpand()` — generic popup opener with inline chart rendering
- `openRegionExpand()` — map-specific popup opener with region chart
- `closeExpand()` — cleanup including chart destruction

#### `subpage-shared.js`
A lightweight utility script loaded by all sub-pages (quotas, catch, alerts, bans). Provides:
- Theme toggle logic (shared across pages)
- `getChartColors()` — returns theme-appropriate colours for Chart.js
- `buildChartDefaults()` — returns a consistent Chart.js options base object

#### `quotas.html`
Dedicated quota analysis page. Contains: KPI strip, species quota bar chart, quota distribution doughnut, annual trend line chart, full species table with inline progress bars, region quota utilisation bars.

#### `catch.html`
Dedicated catch volume page. Contains: KPI strip, monthly catch bar chart, catch by species group chart, weekly catch line chart, per-species detail table, polar area zone chart, pelagic vs demersal split chart, export/domestic doughnut.

#### `alerts.html`
Dedicated alerts page. Contains: KPI strip, alert frequency stacked bar chart, 9-week risk index line chart, full incident cards (with severity badges, descriptions, and action buttons), historical alerts table.

#### `bans.html`
Dedicated seasonal bans page. Contains: KPI strip, zone status bar chart, ban coverage chart, 2026 ban calendar timeline (visual bar grid by month), full ban detail cards per zone (with progress bars for elapsed period), upcoming season changes table.

---

## 5. Pages & Features in Detail

### **DISCLAIMER**: The data present in the web-pages are ***HARDCODED*** and ***PUBLIC*** Data. 

### Page 1 — Main Dashboard (`index.html`)

The command centre of the application. Designed for at-a-glance awareness and rapid drill-down.

#### Navigation Bar
- **Brand logo** with animated SVG fish icon
- **Tab navigation** linking to all 5 pages; active tab highlighted in teal
- **Live indicator** with animated green pulse dot
- **Theme toggle** (☀️ / 🌙) — smooth track-and-knob slider with spring animation

#### Metric Strip (Top Bar)
Six clickable glass cards across the top, each with an icon, label, large numeric value, and a delta/status line:

| Card | Value | Click Action |
|------|-------|-------------|
| Total Quota | 8,500 tons | Opens quota breakdown popup |
| Current Catch | 6,200 tons | Opens catch status popup |
| Active Alerts | 3 | Opens alerts summary popup |
| Zones Active | 12 | Opens zone overview popup |
| Vessels At Sea | 247 | Opens fleet distribution popup |
| Biomass Index | 84% | Opens biomass trend popup |

#### Left Column
- **Species Quotas** — scrollable list of 9 managed species, each with a colour-coded dot, animated quota bar (fills on load), and utilisation percentage. Click any row for a species-specific popup with chart.
- **Season Progress Ring** — SVG ring chart showing 75% of Q1 2026 elapsed. Click for season detail popup.
- **Monthly Catch Bar Chart** — 7-month Chart.js bar chart (Aug 2025 – Feb 2026). Click for expanded monthly trend popup.

#### Centre Column — World Map
The centrepiece feature. A fully custom Canvas 2D rendering of the world with real fishing zones:

**Rendered Zones (with live status colouring):**

| Zone | Location | Status | Colour |
|------|----------|--------|--------|
| North Atlantic | Grand Banks area | 🔴 Critical | Red |
| Norwegian Sea | Between Norway & Iceland | 🚫 Restricted | Red |
| North Sea | Between UK & Scandinavia | ⚠️ Caution | Amber |
| Iceland Waters | Around Iceland | ✅ Active | Green |
| Celtic Sea | SW of British Isles | ✅ Active | Green |
| India EEZ | Indian subcontinent coast | 🔵 Monitoring | Violet |
| USA East Coast EEZ | US Atlantic seaboard | ⚠️ Caution | Amber |
| Pacific NW (USA) | US Pacific coast | ✅ Active | Green |
| Bay of Bengal | South/SE Asia waters | 🔵 Monitoring | Violet |
| Mediterranean | Mediterranean Sea | ⚠️ Caution | Amber |

**Hover Behaviour:**
- Hovered region: brightened fill, coloured glow/emboss effect, increased stroke weight
- All other regions: faded to near-transparent to focus attention
- Tooltip appears near cursor: zone name, status, TAC%, vessel count, "Click for details" prompt
- Exiting the map restores all regions to normal state

**Click Behaviour:**
- Opens a popup with: zone icon, status badge, 3 coloured stat cards, a full interactive inline chart (bar or line), and a detailed key-value list

#### Centre Column — Bottom Charts Row
Three mini chart cards below the map (fills previously empty space):

| Chart | Type | Data Shown |
|-------|------|-----------|
| Catch Breakdown | Doughnut + legend | Pelagic 38%, Demersal 31%, Shellfish 16%, Other 15% |
| Overfishing Risk | Line chart | 9-week risk index trending from 24 → 51 (HIGH) |
| Fleet by Nation | Polar area | Vessel count by flag state (Norway, UK, Denmark, etc.) |

#### Right Column (Scrollable Sidebar)
The entire right column scrolls independently to accommodate all its content:

- **Seasonal Bans Grid** — 6 zone status tiles (2×3 grid), colour-coded by active/caution/restricted
- **Overfishing Alerts** — 4 alert items with severity badges (critical pulse animation), text, and timestamp
- **Quota Utilisation by Region** — Horizontal bar chart for 6 regions
- **Live Activity Feed** — Scrollable list of 10 timestamped events with colour-coded indicators
- **Biomass Trend** — Line chart showing biomass index recovery 2020–2026

#### Expand Popup System
Any clickable element opens a full-screen overlay popup containing:
- Header icon + title + subtitle
- 3 coloured stat cards (colour-coded by semantic meaning: teal, green, amber, red, violet, blue, orange)
- **Inline interactive Chart.js chart** (unique per card — bar or line)
- Scrollable key-value detail list
- Close button (×), click-outside, or Escape key to dismiss

---

### Page 2 — Total Fishing Quota (`quotas.html`)

Comprehensive quota management view.

- **KPIs**: Total Annual Quota (8,500t), Remaining Quota (2,300t), Species Managed (15), Days Remaining (310)
- **Species Quota Bar Chart** — % utilisation for all 9 species
- **Quota Distribution Doughnut** — allocation breakdown in tons by species
- **Annual Quota vs Catch Trend Line** — dual-dataset 2019–2026 comparison
- **Full Species Table** — quota, caught, remaining, % bar, status pill, zone per species
- **Region Quota Bars** — animated horizontal progress bars per fishing region

---

### Page 3 — Current Catch Volume (`catch.html`)

Detailed catch analysis and trend monitoring.

- **KPIs**: Total Catch YTD (6,200t), This Week (842t), Daily Average (68t/day), Projected Year-End (7,820t)
- **Monthly Catch Bar Chart** — 7-month volume trend
- **Catch by Species Group Bar Chart** — Pelagic, Demersal, Shellfish, Flatfish, Other
- **Weekly Catch Line Chart** — 9-week Q1 2026 trend with fill
- **Per-Species Detail Table** — catch, quota, %, daily average, projected year-end, trend direction per species
- **Catch by Zone Polar Chart** — relative catch volumes per zone
- **Pelagic vs Demersal Line Chart** — weekly split comparison
- **Export/Domestic Doughnut** — 68% exported vs 32% domestic

---

### Page 4 — Active Overfishing Alerts (`alerts.html`)

Full incident log and risk monitoring.

- **KPIs**: Total Alerts (3), Critical (2), Warnings (1), Resolved this month (14)
- **Alert Frequency Stacked Bar Chart** — 4 weeks, split by severity
- **9-Week Risk Index Line Chart** — trending from moderate to HIGH
- **Full Incident Cards** — 4 detailed alert cards with:
  - Severity badge (Critical / Warning / Info)
  - Zone, timestamp, ICES protocol level
  - Full descriptive text of the incident
  - Action buttons (View Zone Report, Vessel Registry, etc.)
- **30-Day Historical Alert Table** — zone, species, type, issue, status per incident

---

### Page 5 — Active Seasonal Bans (`bans.html`)

Seasonal restriction management and calendar view.

- **KPIs**: Active Restrictions (2), Caution Zones (1), Open Zones (3), Next Lifting in 49 days
- **Zone Status Bar Chart** — % of restriction period elapsed per zone
- **Ban Coverage Chart** — horizontal bar of area in thousands of km² per zone
- **2026 Ban Calendar** — visual month-by-month timeline grid, all 6 zones × 12 months
- **Full Zone Ban Cards** — 6 detailed cards with:
  - Status pill (Restricted / Caution / Active)
  - Period, area, vessel count metadata
  - Species chips (affected species per zone)
  - Descriptive text of the restriction and context
  - Animated elapsed-period progress bar
  - Authority attribution
- **Upcoming Season Changes Table** — zone, species, change type, date, days-away, authority

---

## 6. User Guide — Tutorial

### Pre-Requisites

Before using the dashboard, ensure you have the following:

| Requirement | Details |
|-------------|---------|
| **Modern Web Browser** | Google Chrome 90+, Mozilla Firefox 90+, Microsoft Edge 90+, Safari 15+, or any Chromium-based browser |
| **Internet Connection** | Required on first load only — to fetch Chart.js from CDN and Google Fonts. Once cached, works offline |
| **Screen Resolution** | Minimum 1280×720 recommended. Optimised for 1440×900 and above |
| **JavaScript Enabled** | Must be enabled in your browser (it is by default in all modern browsers) |
| **No Installation** | No Node.js, no npm, no Python server, no dependencies to install |

> ⚠️ **Note on Local File Access**: If you open the files directly by double-clicking (`file://` protocol), Google Fonts will load from cache or CDN normally. Chart.js is loaded from a CDN and requires internet on first use. All interactivity works fully with `file://`.

---

### Step 1 — Opening the Dashboard

1. Download or unzip the project folder. It should contain:
   ```
   index.html
   quotas.html
   catch.html
   alerts.html
   bans.html
   style.css
   main.js
   subpage-shared.js
   ```
2. Double-click `index.html` — it will open in your default browser.
3. Alternatively, drag `index.html` into an open browser window.
4. The dashboard loads instantly. You should see the full three-column layout with charts rendering.

---

### Step 2 — Reading the Main Dashboard

When you first open the dashboard, you see five main areas:

```
┌─────────────────────────────────────────────────────────────┐
│  NAV BAR  [Dashboard] [Quotas] [Catch] [Alerts] [Bans]  ☀️ │
├──────────────────────────────────────────────────────────────┤
│  [QUOTA] [CATCH] [ALERTS] [ZONES] [VESSELS] [BIOMASS]       │  ← Metric Strip
├────────────┬──────────────────────────┬──────────────────────┤
│            │                          │  Seasonal Bans       │
│  Species   │      World Map           │  Overfishing Alerts  │
│  Quotas    │                          │  Quota Chart         │
│            ├──────────────────────────┤  Activity Feed       │
│  Season    │  Donut │ Risk │ Fleet   │  Biomass Trend       │
│  Ring      │                          │                      │
│  Bar Chart │                          │                      │
└────────────┴──────────────────────────┴──────────────────────┘
```

**Colour codes to remember:**
- 🟢 **Green/Jade** — Active, healthy, on track
- 🟡 **Amber** — Caution, warning, near threshold
- 🔴 **Coral/Red** — Critical, restricted, breach
- 🔵 **Violet** — Monitoring only, no fishing data
- 🩵 **Teal** — Primary data, neutral metrics

---

### Step 3 — Using the World Map

The world map is the most interactive element of the dashboard.

**Hovering over a fishing zone:**
1. Move your cursor over any coloured region on the map.
2. The hovered region **brightens and glows** with a coloured shadow.
3. All other regions **fade out** — focusing your attention on the selected zone.
4. A **tooltip** appears near your cursor showing:
   - Zone name and status
   - TAC utilisation percentage
   - Number of active vessels
   - "Click for details" prompt

**Clicking a fishing zone:**
1. Click any region on the map.
2. A **popup overlay** appears in the centre of the screen with:
   - Zone name and status badge
   - Three coloured metric cards (status, TAC used, vessels)
   - A **fully interactive chart** (hover over the chart for data points!)
   - A detailed list of zone-specific facts
3. You can **scroll inside the popup** to see all content.
4. Close the popup by:
   - Clicking the **✕** button (top right of popup)
   - Clicking anywhere **outside** the popup
   - Pressing the **Escape key**

**Moving off the map:**
- When your cursor leaves the map entirely, all zones return to their normal state.

---

### Step 4 — Clicking Metric Cards

Any card with a hover effect is clickable and opens a detail popup.

**Clickable elements include:**
- All 6 metric cards in the top strip
- Any species row in the left column species list
- The season progress ring
- The monthly catch bar chart
- Any zone in the Seasonal Bans grid (right sidebar)
- The Overfishing Alerts section
- The Quota Utilisation chart
- Bottom row charts (Catch Breakdown, Overfishing Risk, Fleet by Nation)

**Each popup contains:**
1. An emoji icon and descriptive title
2. Three coloured stat cards — colours are semantic (red = danger, green = healthy, etc.)
3. An **interactive inline chart** — hover the chart bars or data points for exact values
4. A scrollable key-value detail list with operational data

---

### Step 5 — Navigating Sub-Pages

Use the **navigation tabs** at the top to switch pages:

| Tab | Page | What You'll Find |
|-----|------|-----------------|
| **Dashboard** | `index.html` | Full overview — map, charts, alerts, feed |
| **Fishing Quotas** | `quotas.html` | Species-level quota analysis, allocation tables |
| **Current Catch** | `catch.html` | Catch volumes, trends, export breakdown |
| **Alerts** | `alerts.html` | Full incident log, risk index, alert history |
| **Seasonal Bans** | `bans.html` | Zone restrictions, ban calendar, upcoming changes |

Each sub-page:
- Shares the same navigation, styling, and theme toggle
- Has its own set of KPI cards at the top
- Contains multiple charts and data tables specific to that topic
- Is independently scrollable

---

### Step 6 — Switching Themes

The dashboard supports both **Light** (default) and **Dark** themes.

1. Locate the theme toggle in the top-right corner of the navigation bar: `☀️ ─○ 🌙`
2. **Click it** to switch between light and dark mode.
3. The toggle knob slides smoothly to indicate the active mode.
4. All colours, backgrounds, charts, and the world map update instantly.
5. Your preference is **automatically saved** — when you close and reopen the browser, your chosen theme is restored.

**Light Theme** — Soft aqua-blue background, white glass cards, dark text. Ideal for well-lit environments.

**Dark Theme** — Deep ocean dark background, translucent dark cards, bright accent colours. Ideal for low-light environments or extended monitoring sessions.

---

### Step 7 — Reading the Charts

All charts in the dashboard are built with Chart.js and are **fully interactive**:

| Interaction | What Happens |
|-------------|-------------|
| **Hover a bar** | Tooltip shows exact value, label, and context |
| **Hover a line point** | Tooltip shows value at that week/month |
| **Hover a donut segment** | Tooltip shows category name and percentage |
| **Hover a polar area slice** | Tooltip shows nation and vessel count |

Charts automatically update their colours (grid lines, tick labels, tooltips) when you switch themes.

---

### Troubleshooting

| Issue | Solution |
|-------|---------|
| Charts not visible | Ensure JavaScript is enabled; check browser console for CDN errors |
| Fonts look different | Internet connection needed for Google Fonts on first load |
| Map not appearing | Resize the browser window to trigger canvas resize; ensure JS is enabled |
| Theme not saving | Browser must allow `localStorage` (disabled in some private/incognito modes) |
| Popup chart blank | Close and reopen the popup — rare Chart.js canvas timing issue |
| Layout looks broken | Ensure viewport is at least 1280px wide; zoom out if needed |

---

## Data Notes

All data in this dashboard is **representative/illustrative** based on publicly available ICES, NAFO, and FAO fisheries data patterns for the North Atlantic and Indian Ocean regions. Values reflect realistic operational magnitudes for 2026 quota year projections.

Data sources that inspired this dashboard:
- [ICES — International Council for the Exploration of the Sea](https://www.ices.dk)

Data sources from where the Dataset is taken for this dashboard:
> Data Regarding KPIs, Metrics, etc. are taken from CMFRI 2016 Census
- [CMFRI - Central Marine Fisheries Research Institute] (https://www.cmfri.org.in/marine-fisheries-census)

> Data Regarding overall production, catch, etc.  and monthly metrics are taken from Govt. of India - Data Portal
- [Govt. of India - Data Portal] (data.gov.in)
---



## License

This project is provided for educational and demonstration purposes.

---

