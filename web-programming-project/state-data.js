/* state-data.js  ─  Embedded state fisheries data
   Avoids fetch() CORS restrictions on file:// protocol.
   Source: data/dummy/state-data.json (keep both in sync) */
window.INDIA_STATE_DATA = {
  GJ: {
    state_name: 'Gujarat', coast: 'West', flag: '🌊',
    quotas: { msy_tons: 750000, current_catch_tons: 690000, utilization_pct: 92,
      key_species: ['Ribbonfish', 'Bombay Duck', 'Croakers'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast)' },
    alerts: [{ severity: 'INFO', title: 'PFZ Advisory',
      description: 'High aggregation of Ribbonfish expected off Porbandar coast. Coordinates updated.',
      timestamp: '2026-03-27T08:00:00Z' }]
  },
  TN: {
    state_name: 'Tamil Nadu', coast: 'East', flag: '🐟',
    quotas: { msy_tons: 710000, current_catch_tons: 580000, utilization_pct: 81,
      key_species: ['Lesser Sardines', 'Silverbellies', 'Seer Fish'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast)' },
    alerts: [{ severity: 'WARNING', title: 'Overfishing Risk — Seer Fish',
      description: 'Catch rates for Seer Fish in the Gulf of Mannar region are approaching critical MSY limits.',
      timestamp: '2026-03-28T09:15:00Z' }]
  },
  KL: {
    state_name: 'Kerala', coast: 'West', flag: '🪸',
    quotas: { msy_tons: 650000, current_catch_tons: 540000, utilization_pct: 83,
      key_species: ['Oil Sardine', 'Indian Mackerel', 'Penaeid Prawns'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast)' },
    alerts: [{ severity: 'CRITICAL', title: 'High Wave Alert',
      description: 'Swell waves of 2.0–2.5 m expected off Kollam & Thiruvananthapuram. Small craft advisory in effect.',
      timestamp: '2026-03-28T06:30:00Z' }]
  },
  MH: {
    state_name: 'Maharashtra', coast: 'West', flag: '🎣',
    quotas: { msy_tons: 450000, current_catch_tons: 380000, utilization_pct: 84,
      key_species: ['Non-penaeid Prawns', 'Bombay Duck', 'Catfish'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast)' },
    alerts: []
  },
  AP: {
    state_name: 'Andhra Pradesh', coast: 'East', flag: '⚠️',
    quotas: { msy_tons: 400000, current_catch_tons: 310000, utilization_pct: 77,
      key_species: ['Pelagics', 'Penaeid Prawns', 'Croakers'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast)' },
    alerts: [{ severity: 'WARNING', title: 'Squall Warning',
      description: 'Wind speeds reaching 45–55 kmph gusting to 65 kmph likely along and off north AP coast.',
      timestamp: '2026-03-27T14:30:00Z' }]
  },
  WB: {
    state_name: 'West Bengal', coast: 'East', flag: '🐠',
    quotas: { msy_tons: 350000, current_catch_tons: 260000, utilization_pct: 74,
      key_species: ['Hilsa Shad', 'Bombay Duck', 'Catfish'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast)' },
    alerts: [{ severity: 'INFO', title: 'Hilsa Advisory',
      description: 'Favorable conditions for Hilsa migration detected in the northern Bay of Bengal.',
      timestamp: '2026-03-26T10:00:00Z' }]
  },
  OR: {
    state_name: 'Odisha', coast: 'East', flag: '🌅',
    quotas: { msy_tons: 280000, current_catch_tons: 195000, utilization_pct: 70,
      key_species: ['Hilsa', 'Indian Anchovy', 'Mackerel'] },
    seasonal_ban: { status: 'RESTRICTED', start_date: '2026-04-15', end_date: '2026-06-14',
      reason: 'Monsoon Breeding Season (East Coast)' },
    alerts: []
  },
  KA: {
    state_name: 'Karnataka', coast: 'West', flag: '🌊',
    quotas: { msy_tons: 320000, current_catch_tons: 250000, utilization_pct: 78,
      key_species: ['Sardines', 'Mackerel', 'Tuna'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast)' },
    alerts: []
  },
  GO: {
    state_name: 'Goa', coast: 'West', flag: '🐡',
    quotas: { msy_tons: 90000, current_catch_tons: 68000, utilization_pct: 75,
      key_species: ['King Fish', 'Mackerel', 'Pomfret'] },
    seasonal_ban: { status: 'UPCOMING', start_date: '2026-06-01', end_date: '2026-07-31',
      reason: 'Monsoon Breeding Season (West Coast)' },
    alerts: []
  }
};
