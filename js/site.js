/* =============================================================================
   site.js — shared behaviour for every redesigned page.
   Load it on each page, just before </body>:
       <script src="js/site.js"></script>

   1. Sticky header condenses once the page scrolls
   2. Keeps the CSS variable --headH equal to the header's real height, so
      anything that sticks beneath the header (like the resume's jump bar) lines up
   3. Back to top scrolls smoothly and returns keyboard focus to the top
   ============================================================================= */
(function () {
  var root = document.documentElement;
  var site = document.getElementById('site');   // the <header class="site" id="site">

  if (site) {
    /* 1. Add .stuck after the first few pixels of scrolling. css/site.css
          shrinks the padding and hides the subtitle when .stuck is present. */
    var setStuck = function () {
      site.classList.toggle('stuck', (window.scrollY || 0) > 8);
    };
    window.addEventListener('scroll', setStuck, { passive: true });
    setStuck();

    /* 2. The header's height changes when it condenses and when the nav wraps
          on phones, so measure it whenever it changes size. */
    var measure = function () {
      root.style.setProperty('--headH', site.offsetHeight + 'px');
    };
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(site);
    window.addEventListener('resize', measure);
    measure();
  }

  /* 3. Back to top. The link is <a class="totop" href="#top">, and the page
        starts with <span id="top" tabindex="-1"></span> to receive focus.
        Smooth scroll is skipped for visitors who prefer reduced motion. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a.totop');
    if (!link) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    var top = document.getElementById('top');
    if (top) top.focus({ preventScroll: true });
  });
})();



/* =============================================================================
   ⚠ TEMPORARY — hand-drawn-lines preview switch. Delete this whole block once
   decided (and, to drop the lines, the css/ink.css <link> from each page).
   A small panel in the bottom-left corner turns css/ink.css on and off; the
   choice is remembered in this browser while you click between pages.
   ============================================================================= */
(function () {
  var sheet = document.querySelector('link[href$="css/ink.css"]');
  if (!sheet) return;
  var KEY = 'ink-preview';
  var on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* no storage: fine */ }
  sheet.disabled = !on;

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Hand-drawn lines preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:999;display:flex;gap:4px;align-items:center;' +
    'padding:6px 6px 6px 10px;background:#fff;border:1px solid #22201C;font:11px/1 "IBM Plex Mono",monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';
  panel.appendChild(document.createTextNode('Lines:'));
  [['Plain', false], ['Hand-drawn', true]].forEach(function (opt) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = opt[0];
    function paint() {
      var active = (sheet.disabled ? false : true) === opt[1];
      b.style.cssText = 'cursor:pointer;padding:6px 8px;border:1px solid #22201C;font:inherit;' +
        (active ? 'background:#22201C;color:#fff' : 'background:#fff;color:#22201C');
    }
    b.addEventListener('click', function () {
      sheet.disabled = !opt[1];
      try { localStorage.setItem(KEY, opt[1] ? 'on' : 'off'); } catch (e) { /* ignore */ }
      [].forEach.call(panel.querySelectorAll('button'), function (x) { x._paint(); });
    });
    b._paint = paint; paint();
    panel.appendChild(b);
  });
  document.body.appendChild(panel);
})();


/* =============================================================================
   ⚠ TEMPORARY — label preview panel. Delete this whole block once decided, and
   set the chosen font, case, weight, spacing and colour on the labels
   (--mono in css/site.css, and the label rules in each stylesheet).
   Rows: the labels' font (--mono: IBM Plex Mono, or one of the handwritten
   candidates in section 6 of site.css), and their case, weight, size, extra
   letter-spacing and colour (the colour of the normally grey labels). The
   last four apply to whichever font is chosen. Each choice is remembered in
   this browser between pages.
   ============================================================================= */
(function () {
  var ROWS = [
    { key: 'font', label: 'Labels:', store: 'font-preview', def: 'Mono', options: [
      ['Mono', ''],
      ['NSW ACT', '"Edu NSW ACT Foundation", "IBM Plex Mono", cursive'],
      ['SA Beginner', '"Edu SA Beginner", "IBM Plex Mono", cursive'],
      ['SA Hand', '"Edu SA Hand", "IBM Plex Mono", cursive'] ] },
    { key: 'case', label: 'Case:', store: 'label-case', def: 'All caps', options: [
      ['As set', ''], ['All caps', 'caps'] ] },
    { key: 'weight', label: 'Weight:', store: 'label-weight', def: '500', options: [
      ['400', '400'], ['500', '500'], ['600', '600'], ['700', '700'] ] },
    { key: 'size', label: 'Size:', store: 'label-size', def: 'Usual', options: [
      ['90%', '0.9'], ['Usual', ''], ['110%', '1.1'], ['120%', '1.2'], ['130%', '1.3'] ] },
    { key: 'track', label: 'Tracking:', store: 'label-track', def: '+.03', options: [
      ['Usual', ''], ['+.03', '0.03em'], ['+.06', '0.06em'], ['+.10', '0.1em'] ] },
    { key: 'colour', label: 'Colour:', store: 'label-colour', def: 'Label ink', swatches: true, options: [
      ['Grey (usual)', ''], ['Label ink', '#706A5C'], ['Umber', '#4A3324'],
      ['Black', '#22201C'], ['Coral ink', '#A34527'] ] }
  ];
  var root = document.documentElement;
  var state = {};
  ROWS.forEach(function (r) {
    var v = null;
    try { v = localStorage.getItem(r.store); } catch (e) { /* no storage: fine */ }
    state[r.key] = r.options.some(function (o) { return o[0] === v; }) ? v : r.def;
  });

  function value(key) {
    var r = ROWS.filter(function (x) { return x.key === key; })[0];
    return r.options.filter(function (o) { return o[0] === state[key]; })[0][1];
  }
  function set(prop, attr, v) {          // a custom property + a data- flag, or neither
    if (v) { root.style.setProperty(prop, v); root.dataset[attr] = ''; }
    else { root.style.removeProperty(prop); delete root.dataset[attr]; }
  }
  function apply() {
    var f = value('font');
    if (f) root.style.setProperty('--mono', f); else root.style.removeProperty('--mono');
    if (value('case')) root.dataset.lcase = value('case'); else delete root.dataset.lcase;
    set('--lw', 'lw', value('weight'));
    set('--lt', 'lt', value('track'));
    set('--ls', 'ls', value('size'));
    set('--lc', 'lc', value('colour'));
  }
  apply();

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Label preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:56px;z-index:999;display:grid;gap:5px;' +
    'padding:7px 8px 7px 10px;background:#fff;border:1px solid #22201C;font:11px/1 "IBM Plex Mono",monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';
  ROWS.forEach(function (r) {
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:4px;align-items:center';
    var l = document.createElement('span'); l.textContent = r.label; l.style.width = '66px';
    row.appendChild(l);
    r.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.title = o[0];
      if (!r.swatches) b.textContent = o[0];
      b._paint = function () {
        var on = state[r.key] === o[0];
        b.style.cssText = 'cursor:pointer;font:inherit;border:1px solid #22201C;' + (r.swatches
          ? 'width:22px;height:22px;padding:0;background:' + (o[1] || '#6B6355') + ';' +
            'box-shadow:' + (on ? '0 0 0 2px #fff, 0 0 0 3px #22201C' : 'none')
          : 'padding:6px 7px;' + (on ? 'background:#22201C;color:#fff' : 'background:#fff;color:#22201C'));
      };
      b.addEventListener('click', function () {
        state[r.key] = o[0]; apply();
        try { localStorage.setItem(r.store, o[0]); } catch (e) { /* ignore */ }
        [].forEach.call(row.querySelectorAll('button'), function (x) { x._paint(); });
      });
      b._paint();
      row.appendChild(b);
    });
    panel.appendChild(row);
  });
  document.body.appendChild(panel);
})();
