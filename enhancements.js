/* ═══════════════════════════════════════════════════════════
   ENHANCEMENTS.JS  – additive only, never modifies existing
   ═══════════════════════════════════════════════════════════
   Runs after main.js so we can safely read state already set.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     1.  NAV-TAB TOOLTIP INJECTION
         Injects a tooltip <div> inside each .nav-tabs li.
         Content is determined by the link's href.
  ──────────────────────────────────────────────────────────── */

  const tabMeta = {
    'index.html': {
      title: '🗺️ Dashboard',
      desc:  'Live command centre — interactive world map, species quotas, overfishing alerts, and the full activity feed.',
    },
    'quotas.html': {
      title: '🎣 Quotas',
      desc:  'Total Allowable Catch analysis — species quota bars, regional distribution, and monthly burn-rate trends.',
    },
    'seasonal.html': {
      title: '📅 Seasonal Bans',
      desc:  'Zone restriction tracker — active moratoriums, caution zones, ban timelines, and upcoming season lifts.',
    },
    'alerts.html': {
      title: '⚠️ Alerts',
      desc:  'Overfishing incident log — critical breaches, warning events, 30-day history, and risk-index trend.',
    },
  };

  /** Normalise an href to just the filename (handles relative + absolute paths). */
  function filenameFrom(href) {
    if (!href) return '';
    try {
      // In file:// context pathname ends with the filename
      const url = new URL(href, window.location.href);
      return url.pathname.split('/').pop() || '';
    } catch (_) {
      return href.split('/').pop().split('?')[0];
    }
  }

  document.querySelectorAll('.nav-tabs li').forEach(function (li) {
    const anchor = li.querySelector('a');
    if (!anchor) return;

    const key  = filenameFrom(anchor.getAttribute('href'));
    const meta = tabMeta[key];
    if (!meta) return;

    const tip = document.createElement('div');
    tip.className = 'nav-tab-tooltip';
    tip.innerHTML =
      '<span class="tt-title">' + meta.title + '</span>' + meta.desc;

    li.appendChild(tip);
  });


  /* ─────────────────────────────────────────────────────────
     2.  DARK-MODE CHART FIX
         Problem: when a sub-page is opened while dark mode is
         already active, main.js calls applyTheme(true) which
         applies body.dark and fires CSS backdrop/transition
         reflows SYNCHRONOUSLY.  Chart.js initialises the
         canvases immediately afterwards and measures container
         sizes during that reflow — often returning 0x0, so
         the chart renders blank.  Light mode has no such
         transition on page load, hence it works fine.

         Fix: after page load, if dark mode is active, wait for
         CSS transitions to finish (longest = 0.4s in style.css)
         then force every Chart instance to resize and redraw.
         We also do this after every theme-toggle click.
  ──────────────────────────────────────────────────────────── */

  /** Force every registered Chart.js chart to resize + redraw. */
  function forceChartRedraw() {
    if (typeof Chart === 'undefined') return;
    var registry = Chart.instances;
    if (!registry) return;

    var dark = document.body.classList.contains('dark');

    Object.values(registry).forEach(function (chart) {
      if (!chart) return;

      /* re-measure the canvas container */
      try { chart.resize(); } catch (e) {}

      /* boost single-colour rgba fills that are near-invisible in dark mode */
      if (chart.data && chart.data.datasets) {
        chart.data.datasets.forEach(function (ds) {
          if (!ds.backgroundColor || Array.isArray(ds.backgroundColor)) return;
          var col = ds.backgroundColor;
          if (typeof col !== 'string' || !col.startsWith('rgba')) return;
          var m = col.match(/rgba\(([^)]+)\)/);
          if (!m) return;
          var parts = m[1].split(',').map(Number);
          if (parts.length !== 4) return;
          var alpha = parts[3];
          if (dark && alpha < 0.30) {
            parts[3] = Math.min(alpha * 2.2, 0.60);
            ds.backgroundColor = 'rgba(' + parts.join(',') + ')';
          } else if (!dark && alpha > 0.55) {
            parts[3] = Math.max(alpha / 2.2, 0.22);
            ds.backgroundColor = 'rgba(' + parts.join(',') + ')';
          }
        });
      }

      try { chart.update('none'); } catch (e) {}
    });
  }

  function scheduleRedraw(ms) { setTimeout(forceChartRedraw, ms || 0); }

  /*
   * On page load: if dark mode is already active, CSS transitions
   * may have caused Chart.js to measure 0x0 containers.
   * Kick redraws at 450ms (after 0.4s transitions) and 900ms
   * (safety net for slower machines / backdrop-filter).
   */
  window.addEventListener('load', function () {
    if (document.body.classList.contains('dark')) {
      scheduleRedraw(450);
      scheduleRedraw(900);
    }
  });

  /* After theme-toggle, redraw so charts adopt the new palette.  */
  var themeToggleEl = document.getElementById('themeToggle');
  if (themeToggleEl) {
    themeToggleEl.addEventListener('click', function () {
      scheduleRedraw(120);  /* colour update */
      scheduleRedraw(500);  /* final settle  */
    });
  }


  /* ─────────────────────────────────────────────────────────
     3.  CURSOR OVERRIDE — strip pointer from non-expandable
         cards that already have cursor:pointer in style.css.
         We add cursor:default inline only on elements that
         carry NO data-expand attribute and are not naturally
         interactive (anchor / button).
  ──────────────────────────────────────────────────────────── */

  function fixCursors() {
    // Selectors that carry cursor:pointer in style.css
    // but are NOT always interactive.
    var candidates = document.querySelectorAll(
      '.metric-card, .chart-card, .ring-card, .quota-card'
    );

    candidates.forEach(function (el) {
      // If the element (or any ancestor up to the card level) has data-expand
      // OR the element contains a child with data-expand, keep pointer.
      var hasExpand = el.hasAttribute('data-expand');
      if (!hasExpand) {
        el.style.cursor = 'default';
      }
      // If main.js later sets cursor:pointer via [data-expand] selector,
      // having an inline 'default' on the element itself won't interfere
      // because the JS targets matching elements (which already have it
      // removed above from non-expand ones).
    });

    // Also restore pointer on anything that DOES have data-expand
    // (in case our blanket above catches them before main.js runs)
    document.querySelectorAll('[data-expand]').forEach(function (el) {
      el.style.cursor = 'pointer';
    });

    // Activity items: purely display, no expand
    document.querySelectorAll('.activity-item').forEach(function (el) {
      el.style.cursor = 'default';
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixCursors);
  } else {
    fixCursors();
  }

})();
