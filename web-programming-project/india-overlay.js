/* ================================================================
   india-overlay.js  — v7 (DOM-move + full-India viewBox)

   THE FIX:
   - Moves #indiaMainSVG INTO #mapWrap so it fills the same area
     as the world map (mainMapSVG)
   - Changes its viewBox to "74 82 665 701" which covers ALL of
     India's state paths (found by inspecting actual path coords:
     x-min≈74, y-min≈82, x-max≈739, y-max≈783)
   - Uses geographic formula calibrated to this full-India viewBox
     to place markers correctly on each coastal state
   ================================================================ */

(function () {
  'use strict';

  var indiaSVG = document.getElementById('indiaMainSVG');
  if (!indiaSVG) return;

  /* ── Full-India viewBox (from actual path-coordinate scan) ── */
  /* Paths span: x ≈ 74–739, y ≈ 82–783
     We use a slightly padded version for breathing room.        */
  var VB = { x: 60, y: 70, w: 690, h: 725 };
  /* Matches SVG string: "60 70 690 725"                        */

  /* ── Geographic extents of visible India ──────────────────── */
  var GEO = { lonMin: 68, lonMax: 98, latMin: 6, latMax: 38 };

  function geoToSVG(lon, lat) {
    return {
      x: VB.x + (lon - GEO.lonMin) / (GEO.lonMax - GEO.lonMin) * VB.w,
      y: VB.y + (GEO.latMax - lat) / (GEO.latMax - GEO.latMin) * VB.h
    };
  }

  /* ── Coastal state centroids ─────────────────────────────── */
  var STATES = [
    { code:'GJ', name:'Gujarat',          lon: 72,   lat: 22.5 },
    { code:'MH', name:'Maharashtra',      lon: 75.5, lat: 19   },
    { code:'GO', name:'Goa',              lon: 74.1, lat: 15.5 },
    { code:'KA', name:'Karnataka',        lon: 76,   lat: 15   },
    { code:'KL', name:'Kerala',           lon: 76.3, lat: 11   },
    { code:'TN', name:'Tamil Nadu',       lon: 78.8, lat: 11   },
    { code:'AP', name:'Andhra Pradesh',   lon: 79.5, lat: 15.5 },
    { code:'OR', name:'Odisha',           lon: 84,   lat: 20.5 },
    { code:'WB', name:'West Bengal',      lon: 88,   lat: 23   },
  ];

  /* ── Palettes ────────────────────────────────────────────── */
  function isDark() { return document.body.classList.contains('dark'); }
  function pal() {
    var d = isDark();
    return {
      state:    d ? 'rgba(0,151,167,0.28)'   : 'rgba(210,175,100,0.55)',
      stateStr: d ? 'rgba(0,212,200,0.35)'   : 'rgba(255,255,255,0.60)',
      hover:    d ? 'rgba(0,212,200,0.75)'   : 'rgba(255,200,70,0.88)',
      hoverStr: d ? 'rgba(0,230,220,0.95)'   : 'rgba(255,220,100,1.0)',
      titleFill:d ? '#00d4c8'                : '#0097a7',
      bg:       d ? 'rgba(8,51,88,0.80)'     : 'rgba(184,223,245,0.70)',
      dot:      d ? 'rgba(255,210,55,0.95)'  : 'rgba(0,100,145,0.92)',
      dotStr:   'rgba(255,255,255,0.92)',
      dotTxt:   d ? '#0c1e30'                : '#ffffff',
    };
  }

  /* ── Apply theme ─────────────────────────────────────────── */
  function applyTheme() {
    var p     = pal();
    var bg    = document.getElementById('indiaBg');
    var grid  = document.getElementById('indiaGrid');
    var title = document.getElementById('indiaMapTitle');
    if (bg)    { bg.setAttribute('fill', p.bg); bg.setAttribute('x', VB.x); bg.setAttribute('y', VB.y); bg.setAttribute('width', VB.w); bg.setAttribute('height', VB.h); }
    if (grid)  { grid.setAttribute('fill', p.bg); }
    if (title) { title.setAttribute('fill', p.titleFill); }
    document.querySelectorAll('#indiaStatesGroup path:not([data-hovered])').forEach(function(el){
      el.setAttribute('fill',   p.state);
      el.setAttribute('stroke', p.stateStr);
      el.setAttribute('stroke-width','1.5');
    });
    recolourDots();
  }

  function recolourDots() {
    var p = pal();
    document.querySelectorAll('.sdot-circle:not(.sdot-active)').forEach(function(c){
      c.setAttribute('fill',   p.dot);
      c.setAttribute('stroke', p.dotStr);
    });
    document.querySelectorAll('.sdot-label').forEach(function(t){
      t.setAttribute('fill', p.dotTxt);
    });
  }

  /* ── Tooltip ─────────────────────────────────────────────── */
  var tip = null;
  function mkTip() {
    if (tip) return;
    tip = document.createElement('div');
    tip.id = 'indiaTip';
    Object.assign(tip.style, {
      position:'fixed', pointerEvents:'none', zIndex:'9999',
      padding:'4px 10px', borderRadius:'7px', whiteSpace:'nowrap',
      fontSize:'0.62rem', fontFamily:"'DM Sans',sans-serif",
      fontWeight:'600', backdropFilter:'blur(14px)', display:'none',
    });
    document.body.appendChild(tip);
  }
  function tipTheme() {
    var d = isDark();
    tip.style.color      = d ? '#e8f4f8' : '#0c2535';
    tip.style.background = d ? 'rgba(4,28,53,0.94)' : 'rgba(255,255,255,0.94)';
    tip.style.border     = d ? '1px solid rgba(0,212,200,0.3)' : '1px solid rgba(0,151,167,0.3)';
    tip.style.boxShadow  = d ? '0 4px 18px rgba(0,0,0,.5)' : '0 4px 18px rgba(0,80,100,.15)';
  }
  function showTip(e, text) { mkTip(); tipTheme(); tip.textContent=text; tip.style.display='block'; mvTip(e); }
  function mvTip(e){ if(tip){ tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY-32)+'px'; } }
  function hideTip(){ if(tip) tip.style.display='none'; }

  /* ── Panel helpers ───────────────────────────────────────── */
  var activeCode = null;
  function sevCol(s){ return s==='CRITICAL'?'#e53935':s==='WARNING'?'#d4900a':'#0097a7'; }
  function banCol(s){ return s==='RESTRICTED'?'#e53935':s==='UPCOMING'?'#d4900a':'#2e7d32'; }
  function fmtN(n)  { return (n/1000).toFixed(0)+',000'; }
  function fmtD(s)  { return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }
  function ago(ts)  { var d=Math.floor((Date.now()-new Date(ts))/86400000); return d===0?'Today':d===1?'Yesterday':d+' days ago'; }

  function openPanel(code) {
    var panel = document.getElementById('stateSidePanel');
    if (!panel) return;
    activeCode = code;
    var data = window.INDIA_STATE_DATA && window.INDIA_STATE_DATA[code];
    panel.innerHTML = data ? buildHTML(code, data) : noDataHTML(code);
    panel.classList.add('visible');
    if (data) setTimeout(function(){
      var b = panel.querySelector('.sp-util-bar-fill');
      if (b) b.style.width = b.getAttribute('data-w');
    }, 50);
    document.querySelectorAll('.sdot-circle').forEach(function(c){
      var active = c.getAttribute('data-code') === code;
      c.classList.toggle('sdot-active', active);
      var p = pal();
      c.setAttribute('r',    active ? '8' : '5');
      c.setAttribute('fill', active ? '#e53935' : p.dot);
    });
    var btn = document.getElementById('spClose');
    if (btn) btn.addEventListener('click', closePanel);
  }

  function closePanel() {
    var panel = document.getElementById('stateSidePanel');
    if (panel) panel.classList.remove('visible');
    activeCode = null;
    var p = pal();
    document.querySelectorAll('.sdot-circle').forEach(function(c){
      c.classList.remove('sdot-active');
      c.setAttribute('r','5');
      c.setAttribute('fill', p.dot);
    });
  }

  function noDataHTML(code) {
    return '<div class="sp-header"><div class="sp-flag">📍</div><div class="sp-title-wrap">'+
      '<div class="sp-state-name">'+code+'</div><div class="sp-coast">No data available</div></div>'+
      '<button class="sp-close" id="spClose">&#x00D7;</button></div>'+
      '<div class="sp-body"><div class="sp-empty-msg">State data coming soon.</div>'+
      '<a href="https://www.cmfri.org.in/" target="_blank" class="sp-source-link">&#128279; CMFRI Portal</a></div>';
  }

  function buildHTML(code, d) {
    var q=d.quotas, b=d.seasonal_ban, al=d.alerts;
    var bColor=banCol(b.status), uPct=q.utilization_pct;
    var barCol=uPct>=90?'#e53935':uPct>=80?'#d4900a':'#2e7d32';
    var chips = q.key_species.map(function(s){ return '<span class="sp-species-chip">'+s+'</span>'; }).join('');
    var alHTML = '';
    if (al && al.length) {
      alHTML = '<div class="sp-section-label">Active Alerts</div>';
      al.forEach(function(a){
        var ac=sevCol(a.severity);
        alHTML += '<div class="sp-alert" style="border-left-color:'+ac+'">'+
          '<div class="sp-alert-badge" style="background:'+ac+'18;color:'+ac+'">'+a.severity+'</div>'+
          '<div class="sp-alert-title">'+a.title+'</div>'+
          '<div class="sp-alert-desc">'+a.description+'</div>'+
          '<div class="sp-alert-time">'+ago(a.timestamp)+'</div></div>';
      });
    } else { alHTML = '<div class="sp-no-alerts">&#10003; No active alerts</div>'; }

    return '<div class="sp-header"><div class="sp-flag">'+(d.flag||'🐟')+'</div>'+
      '<div class="sp-title-wrap"><div class="sp-state-name">'+d.state_name+'</div>'+
      '<div class="sp-coast">'+d.coast+' Coast · India EEZ</div></div>'+
      '<button class="sp-close" id="spClose">&#x00D7;</button></div>'+
      '<div class="sp-body">'+
      '<div class="sp-section-label">Quota &amp; Catch</div>'+
      '<div class="sp-quota-grid">'+
      '<div class="sp-stat-box"><div class="sp-stat-val">'+fmtN(q.msy_tons)+'</div><div class="sp-stat-lbl">MSY (t)</div></div>'+
      '<div class="sp-stat-box"><div class="sp-stat-val" style="color:'+barCol+'">'+fmtN(q.current_catch_tons)+'</div><div class="sp-stat-lbl">Caught (t)</div></div>'+
      '<div class="sp-stat-box"><div class="sp-stat-val" style="color:'+barCol+'">'+uPct+'%</div><div class="sp-stat-lbl">Used</div></div></div>'+
      '<div class="sp-util-bar-track"><div class="sp-util-bar-fill" data-w="'+uPct+'%" style="width:0;background:'+barCol+'"></div></div>'+
      '<div class="sp-section-label">Key Species</div><div class="sp-species-row">'+chips+'</div>'+
      '<div class="sp-section-label">Seasonal Ban</div>'+
      '<div class="sp-ban-card" style="border-left-color:'+bColor+'">'+
      '<div class="sp-ban-status" style="color:'+bColor+'">'+b.status+'</div>'+
      '<div class="sp-ban-dates">'+fmtD(b.start_date)+' — '+fmtD(b.end_date)+'</div>'+
      '<div class="sp-ban-reason">'+b.reason+'</div></div>'+
      alHTML+
      '<a href="https://www.cmfri.org.in/" target="_blank" class="sp-source-link">&#128279; CMFRI · data.gov.in</a>'+
      '</div>';
  }

  /* ── Panel container ─────────────────────────────────────── */
  function buildPanelContainer() {
    if (document.getElementById('stateSidePanel')) return;
    var panel = document.createElement('div');
    panel.id = 'stateSidePanel';
    panel.className = 'state-side-panel glass';
    var mc = document.getElementById('mapContainer');
    if (mc) mc.appendChild(panel);
    document.addEventListener('click', function(e){
      var sp = document.getElementById('stateSidePanel');
      if (sp && sp.classList.contains('visible') &&
          !sp.contains(e.target) &&
          !e.target.classList.contains('sdot-circle')) {
        closePanel();
      }
    });
  }

  /* ── Wire state path hover ───────────────────────────────── */
  function wireStatePaths() {
    document.querySelectorAll('#indiaStatesGroup path').forEach(function(el){
      var p0 = pal();
      el.setAttribute('fill',   p0.state);
      el.setAttribute('stroke', p0.stateStr);
      el.setAttribute('stroke-width','1.5');
      el.setAttribute('stroke-linejoin','round');
      el.style.transition = 'fill 0.15s ease';
      el.addEventListener('mouseenter', function(){
        var p = pal();
        el.setAttribute('data-hovered','1');
        el.setAttribute('fill',   p.hover);
        el.setAttribute('stroke', p.hoverStr);
        el.setAttribute('stroke-width','2');
        el.setAttribute('filter', isDark()?'url(#stateGlowDark)':'url(#stateGlow)');
      });
      el.addEventListener('mouseleave', function(){
        var p = pal();
        el.removeAttribute('data-hovered');
        el.setAttribute('fill',   p.state);
        el.setAttribute('stroke', p.stateStr);
        el.setAttribute('stroke-width','1.5');
        el.removeAttribute('filter');
      });
    });
  }

  /* ── Add markers at calibrated geographic positions ────────── */
  function addMarkers() {
    var old = document.getElementById('stateDotsGroup');
    if (old) old.parentNode.removeChild(old);

    var p  = pal();
    var ns = 'http://www.w3.org/2000/svg';
    var g  = document.createElementNS(ns, 'g');
    g.setAttribute('id', 'stateDotsGroup');

    STATES.forEach(function(m) {
      var pos = geoToSVG(m.lon, m.lat);
      var cx = pos.x, cy = pos.y;

      /* Pulse */
      var pulse = document.createElementNS(ns,'circle');
      pulse.setAttribute('cx',cx); pulse.setAttribute('cy',cy);
      pulse.setAttribute('r','8'); pulse.setAttribute('fill','none');
      pulse.setAttribute('stroke', p.dot); pulse.setAttribute('stroke-width','2');
      pulse.setAttribute('class','sdot-pulse'); pulse.setAttribute('opacity','0');
      pulse.style.animation = 'sdotPulse 2.4s ease-out '+(Math.random())+'s infinite';

      /* Main dot */
      var circle = document.createElementNS(ns,'circle');
      circle.setAttribute('cx',cx); circle.setAttribute('cy',cy);
      circle.setAttribute('r','7');
      circle.setAttribute('fill',   p.dot);
      circle.setAttribute('stroke', p.dotStr);
      circle.setAttribute('stroke-width','2');
      circle.setAttribute('class','sdot-circle');
      circle.setAttribute('data-code', m.code);
      circle.style.cursor = 'pointer';

      /* Label */
      var label = document.createElementNS(ns,'text');
      label.setAttribute('x',cx); label.setAttribute('y',cy+2.2);
      label.setAttribute('text-anchor','middle');
      label.setAttribute('font-size','5.5');
      label.setAttribute('font-family',"'DM Sans',sans-serif");
      label.setAttribute('font-weight','800');
      label.setAttribute('fill', p.dotTxt);
      label.setAttribute('class','sdot-label');
      label.setAttribute('pointer-events','none');
      label.textContent = m.code;

      circle.addEventListener('mouseenter', function(e){
        if (activeCode !== m.code) circle.setAttribute('r','9');
        showTip(e, m.name);
      });
      circle.addEventListener('mousemove', mvTip);
      circle.addEventListener('mouseleave', function(){
        if (activeCode !== m.code) circle.setAttribute('r','7');
        hideTip();
      });
      circle.addEventListener('click', function(e){
        e.stopPropagation();
        openPanel(m.code);
      });

      g.appendChild(pulse);
      g.appendChild(circle);
      g.appendChild(label);
    });

    indiaSVG.appendChild(g);
  }

  /* ── Boot ───────────────────────────────────────────────── */
  function boot() {
    /* 1. Hide the world map */
    var worldSVG = document.getElementById('mainMapSVG');
    if (worldSVG) worldSVG.style.display = 'none';

    /* 2. Move indiaMainSVG INTO #mapWrap so it fills the map area */
    var mapWrap = document.getElementById('mapWrap');
    if (mapWrap && indiaSVG.parentElement !== mapWrap) {
      mapWrap.appendChild(indiaSVG);
    }

    /* 3. Set correct viewBox covering ALL Indian state paths */
    indiaSVG.setAttribute('viewBox', VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h);
    indiaSVG.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    /* 4. Fill the mapWrap area */
    indiaSVG.style.display   = 'block';
    indiaSVG.style.width     = '100%';
    indiaSVG.style.height    = '100%';
    indiaSVG.style.position  = 'absolute';
    indiaSVG.style.top       = '0';
    indiaSVG.style.left      = '0';

    /* 5. Build panel, colour states, add markers */
    buildPanelContainer();
    applyTheme();
    wireStatePaths();
    addMarkers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  var btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', function(){ setTimeout(applyTheme, 60); });

})();
