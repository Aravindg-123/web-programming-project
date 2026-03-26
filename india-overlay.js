/* ================================================================
   india-overlay.js  — v3 (no fetch, DOM-wiring only)
   The India state SVG is already hardcoded in index.html.
   This script only:
     1. Hides the world SVG
     2. Shows #indiaMainSVG
     3. Applies theme colours
     4. Wires per-state hover + tooltip + popup click
   ================================================================ */

(function () {
  'use strict';

  var worldSVG  = document.getElementById('mainMapSVG');
  var indiaSVG  = document.getElementById('indiaMainSVG');
  if (!indiaSVG) return;   /* not on dashboard */

  /* ── Colour palettes ────────────────────────────────────── */
  function pal() {
    var d = document.body.classList.contains('dark');
    return d ? {
      bg:         'rgba(8,51,88,0.80)',
      grid:       'rgba(0,212,200,0.05)',
      stateFill:  'rgba(0,151,167,0.28)',
      stateLine:  'rgba(0,212,200,0.32)',
      hoverFill:  'rgba(0,212,200,0.62)',
      hoverLine:  'rgba(0,230,220,0.90)',
      titleFill:  '#00d4c8',
    } : {
      bg:         'rgba(184,223,245,0.70)',
      grid:       'rgba(0,100,140,0.06)',
      stateFill:  'rgba(210,175,100,0.55)',
      stateLine:  'rgba(255,255,255,0.58)',
      hoverFill:  'rgba(255,200,70,0.82)',
      hoverLine:  'rgba(255,220,100,0.95)',
      titleFill:  '#0097a7',
    };
  }

  /* ── Apply theme colours to the static SVG elements ─────── */
  function applyTheme() {
    var p     = pal();
    var bg    = document.getElementById('indiaBg');
    var grid  = document.getElementById('indiaGrid');
    var title = document.getElementById('indiaMapTitle');
    if (bg)    { bg.setAttribute('fill', p.bg); }
    if (grid)  { grid.setAttribute('fill', p.grid); }
    if (title) { title.setAttribute('fill', p.titleFill); }

    /* Reset all non-hovered states */
    document.querySelectorAll('#indiaStatesGroup path:not([data-hovered])').forEach(function (el) {
      el.setAttribute('fill', p.stateFill);
      el.setAttribute('stroke', p.stateLine);
      el.setAttribute('stroke-width', '1.5');
    });
  }

  /* ── Tooltip ────────────────────────────────────────────── */
  var tip = null;
  function mkTip() {
    if (tip) return;
    tip = document.createElement('div');
    tip.id = 'indiaStateTooltip';
    Object.assign(tip.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '9999',
      padding: '5px 11px', borderRadius: '8px', whiteSpace: 'nowrap',
      fontSize: '0.65rem', fontFamily: "'DM Sans',sans-serif",
      fontWeight: '600', letterSpacing: '0.03em',
      backdropFilter: 'blur(14px)', display: 'none',
    });
    document.body.appendChild(tip);
  }
  function tipStyle() {
    var d = document.body.classList.contains('dark');
    tip.style.color      = d ? '#e8f4f8'                  : '#0c2535';
    tip.style.background = d ? 'rgba(4,28,53,0.94)'       : 'rgba(255,255,255,0.94)';
    tip.style.border     = d ? '1px solid rgba(0,212,200,0.22)' : '1px solid rgba(0,151,167,0.22)';
    tip.style.boxShadow  = d ? '0 4px 18px rgba(0,0,0,.45)' : '0 4px 18px rgba(0,80,100,.15)';
  }
  function showTip(e, name) { mkTip(); tipStyle(); tip.textContent = name; tip.style.display = 'block'; moveTip(e); }
  function moveTip(e) { if (!tip) return; tip.style.left = (e.clientX + 14) + 'px'; tip.style.top = (e.clientY - 32) + 'px'; }
  function hideTip() { if (tip) tip.style.display = 'none'; }

  /* ── Derive a readable name from SVG attributes ─────────── */
  function nameOf(el) {
    var raw = (el.getAttribute('data-name') || el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('title') || '');
    return raw.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\d+/g, '').replace(/\s+/g, ' ').trim() || 'State';
  }

  /* ── Wire hover + click on each state path ──────────────── */
  function wireStates() {
    document.querySelectorAll('#indiaStatesGroup path').forEach(function (el) {
      var name = nameOf(el);
      // Apply initial fill/stroke
      var p = pal();
      el.setAttribute('fill', p.stateFill);
      el.setAttribute('stroke', p.stateLine);
      el.setAttribute('stroke-width', '1.5');
      el.setAttribute('stroke-linejoin', 'round');
      el.style.cursor     = 'pointer';
      el.style.transition = 'fill 0.15s ease';

      el.addEventListener('mouseenter', function (e) {
        var p = pal(), dark = document.body.classList.contains('dark');
        el.setAttribute('data-hovered', '1');
        el.setAttribute('fill', p.hoverFill);
        el.setAttribute('stroke', p.hoverLine);
        el.setAttribute('stroke-width', '2.5');
        el.setAttribute('filter', dark ? 'url(#stateGlowDark)' : 'url(#stateGlow)');
        showTip(e, name);
      });
      el.addEventListener('mousemove', moveTip);
      el.addEventListener('mouseleave', function () {
        var p = pal();
        el.removeAttribute('data-hovered');
        el.setAttribute('fill', p.stateFill);
        el.setAttribute('stroke', p.stateLine);
        el.setAttribute('stroke-width', '1.5');
        el.removeAttribute('filter');
        hideTip();
      });
      el.addEventListener('click', function () {
        if (typeof openRegionPopup === 'function') openRegionPopup('india');
        else if (typeof openExpand === 'function') openExpand('india');
      });
    });
  }

  /* ── Boot ───────────────────────────────────────────────── */
  function boot() {
    /* Hide world map */
    if (worldSVG) worldSVG.style.display = 'none';
    /* Show India SVG */
    indiaSVG.style.display = 'block';
    /* Colour + wire */
    applyTheme();
    wireStates();
  }

  /* Run after main.js + enhancements.js have run */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Re-apply theme on toggle */
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', function () { setTimeout(applyTheme, 60); });
  }

})();
