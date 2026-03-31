/* state-data.js  ─  Embedded state fisheries data
   Avoids fetch() CORS restrictions on file:// protocol.
   Sources: fisheries_state_dataset.csv (Marine Fisheries Census 2016),
            kpi_cards.csv, india_map.csv, catch_breakdown.csv */
window.INDIA_STATE_DATA = {
  GJ: {
    state_name: 'Gujarat', coast: 'West', flag: '🌊',
    coastal_length_km: 1600, fisherfolk_population: 354992,
    total_crafts: 27642, mechanized_crafts: 14061, motorized_crafts: 12825,
    quotas: { msy_tons: 750000, current_catch_tons: 690000, utilization_pct: 92,
      key_species: ['Ribbonfish', 'Bombay Duck', 'Croakers'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast) — Jun–Jul (india_map.csv)' },
    alerts: [{ severity: 'INFO', title: 'PFZ Advisory',
      description: 'High aggregation of Ribbonfish expected off Porbandar coast. Coordinates updated.',
      timestamp: '2026-03-27T08:00:00Z' }]
  },
  TN: {
    state_name: 'Tamil Nadu', coast: 'East', flag: '🐟',
    coastal_length_km: 1076, fisherfolk_population: 795708,
    total_crafts: 43355, mechanized_crafts: 5961, motorized_crafts: 31279,
    quotas: { msy_tons: 710000, current_catch_tons: 580000, utilization_pct: 81,
      key_species: ['Lesser Sardines', 'Silverbellies', 'Seer Fish'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast) — Apr–Jun (india_map.csv)' },
    alerts: [{ severity: 'WARNING', title: 'Overfishing Risk — Seer Fish',
      description: 'Catch rates for Seer Fish in the Gulf of Mannar region are approaching critical MSY limits.',
      timestamp: '2026-03-28T09:15:00Z' }]
  },
  KL: {
    state_name: 'Kerala', coast: 'West', flag: '🪸',
    coastal_length_km: 590, fisherfolk_population: 563903,
    total_crafts: 21684, mechanized_crafts: 3800, motorized_crafts: 13868,
    quotas: { msy_tons: 650000, current_catch_tons: 540000, utilization_pct: 83,
      key_species: ['Oil Sardine', 'Indian Mackerel', 'Penaeid Prawns'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast) — Jun–Jul (india_map.csv)' },
    alerts: [{ severity: 'CRITICAL', title: 'High Wave Alert',
      description: 'Swell waves of 2.0–2.5 m expected off Kollam & Thiruvananthapuram. Small craft advisory in effect.',
      timestamp: '2026-03-28T06:30:00Z' }]
  },
  MH: {
    state_name: 'Maharashtra', coast: 'West', flag: '🎣',
    coastal_length_km: 720, fisherfolk_population: 364899,
    total_crafts: 15520, mechanized_crafts: 5867, motorized_crafts: 6788,
    quotas: { msy_tons: 450000, current_catch_tons: 380000, utilization_pct: 84,
      key_species: ['Non-penaeid Prawns', 'Bombay Duck', 'Catfish'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast) — Jun–Jul (india_map.csv)' },
    alerts: []
  },
  AP: {
    state_name: 'Andhra Pradesh', coast: 'East', flag: '⚠️',
    coastal_length_km: 974, fisherfolk_population: 517435,
    total_crafts: 20219, mechanized_crafts: 1176, motorized_crafts: 12078,
    quotas: { msy_tons: 400000, current_catch_tons: 310000, utilization_pct: 77,
      key_species: ['Pelagics', 'Penaeid Prawns', 'Croakers'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast) — Apr–Jun (india_map.csv)' },
    alerts: [{ severity: 'WARNING', title: 'Squall Warning',
      description: 'Wind speeds reaching 45–55 kmph gusting to 65 kmph likely along and off north AP coast.',
      timestamp: '2026-03-27T14:30:00Z' }]
  },
  WB: {
    state_name: 'West Bengal', coast: 'East', flag: '🐠',
    coastal_length_km: 158, fisherfolk_population: 368816,
    total_crafts: 11054, mechanized_crafts: 4014, motorized_crafts: 6564,
    quotas: { msy_tons: 350000, current_catch_tons: 260000, utilization_pct: 74,
      key_species: ['Hilsa Shad', 'Bombay Duck', 'Catfish'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast) — Apr–Jun (india_map.csv)' },
    alerts: [{ severity: 'INFO', title: 'Hilsa Advisory',
      description: 'Favorable conditions for Hilsa migration detected in the northern Bay of Bengal.',
      timestamp: '2026-03-26T10:00:00Z' }]
  },
  OD: {
    state_name: 'Odisha', coast: 'East', flag: '🌅',
    coastal_length_km: 480, fisherfolk_population: 517623,
    total_crafts: 8682, mechanized_crafts: 1748, motorized_crafts: 5678,
    quotas: { msy_tons: 280000, current_catch_tons: 195000, utilization_pct: 70,
      key_species: ['Hilsa', 'Indian Anchovy', 'Mackerel'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast) — Apr–Jun (india_map.csv)' },
    alerts: []
  },
  KA: {
    state_name: 'Karnataka', coast: 'West', flag: '🌊',
    coastal_length_km: 300, fisherfolk_population: 157989,
    total_crafts: 11884, mechanized_crafts: 3780, motorized_crafts: 5879,
    quotas: { msy_tons: 320000, current_catch_tons: 250000, utilization_pct: 78,
      key_species: ['Sardines', 'Mackerel', 'Tuna'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast) — Jun–Jul (india_map.csv)' },
    alerts: []
  },
  GO: {
    state_name: 'Goa', coast: 'West', flag: '🐡',
    coastal_length_km: 104, fisherfolk_population: 12651,
    total_crafts: 1982, mechanized_crafts: 858, motorized_crafts: 942,
    quotas: { msy_tons: 90000, current_catch_tons: 68000, utilization_pct: 75,
      key_species: ['King Fish', 'Mackerel', 'Pomfret'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast) — Jun–Jul (india_map.csv)' },
    alerts: []
  }
};
