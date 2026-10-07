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
   ⚠ TEMPORARY — label-font preview switch. Delete this whole block once a font
   is chosen, and set --mono in css/site.css to it.
   A panel above the lines switch sets the font for the small labels (--mono):
   IBM Plex Mono as now, or one of the three handwritten candidates in
   section 6 of site.css. Remembered in this browser between pages.
   ============================================================================= */
(function () {
  var FONTS = [
    ['Mono', ''],
    ['NSW ACT', '"Edu NSW ACT Foundation", "IBM Plex Mono", cursive'],
    ['SA Beginner', '"Edu SA Beginner", "IBM Plex Mono", cursive'],
    ['SA Hand', '"Edu SA Hand", "IBM Plex Mono", cursive']
  ];
  var KEY = 'font-preview';
  var root = document.documentElement;
  var current = 'Mono';
  try { current = localStorage.getItem(KEY) || 'Mono'; } catch (e) { /* no storage: fine */ }
  function apply(label) {
    var f = FONTS.filter(function (x) { return x[0] === label; })[0] || FONTS[0];
    if (f[1]) root.style.setProperty('--mono', f[1]); else root.style.removeProperty('--mono');
    if (f[1]) root.dataset.hand = ''; else delete root.dataset.hand;   // see site.css, section 6
    current = f[0];
  }
  apply(current);

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Label font preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:56px;z-index:999;display:flex;gap:4px;align-items:center;' +
    'padding:6px 6px 6px 10px;background:#fff;border:1px solid #22201C;font:11px/1 "IBM Plex Mono",monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';
  panel.appendChild(document.createTextNode('Labels:'));
  FONTS.forEach(function (f) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = f[0];
    b._paint = function () {
      var on = current === f[0];
      b.style.cssText = 'cursor:pointer;padding:6px 8px;border:1px solid #22201C;font:inherit;' +
        (on ? 'background:#22201C;color:#fff' : 'background:#fff;color:#22201C');
    };
    b.addEventListener('click', function () {
      apply(f[0]);
      try { localStorage.setItem(KEY, f[0]); } catch (e) { /* ignore */ }
      [].forEach.call(panel.querySelectorAll('button'), function (x) { x._paint(); });
    });
    b._paint();
    panel.appendChild(b);
  });
  document.body.appendChild(panel);
})();


/* =============================================================================
   ⚠ TEMPORARY — heading-font preview switch. Delete this whole block once
   decided (and, to keep Outfit, set --display in css/site.css to it and
   fold section 7's weights into the page stylesheets).
   A panel above the other switches sets the headings' font (--display):
   Inknut Antiqua as now, or one of Outfit's variants (section 7 of
   site.css: regular, heavy, light, caps, italic).
   ============================================================================= */
(function () {
  var OUTFIT = '"Outfit", system-ui, sans-serif';
  var FONTS = [            // [button label, font, variant name for site.css]
    ['Inknut', '', ''],
    ['Outfit', OUTFIT, 'regular'],
    ['Heavy', OUTFIT, 'heavy'],
    ['Light', OUTFIT, 'light'],
    ['Caps', OUTFIT, 'caps'],
    ['Italic', OUTFIT, 'italic']
  ];
  var KEY = 'display-preview';
  var root = document.documentElement;
  var current = 'Inknut';
  try { current = localStorage.getItem(KEY) || 'Inknut'; } catch (e) { /* no storage: fine */ }
  function apply(label) {
    var f = FONTS.filter(function (x) { return x[0] === label; })[0] || FONTS[0];
    if (f[1]) root.style.setProperty('--display', f[1]); else root.style.removeProperty('--display');
    if (f[1]) root.dataset.display = f[2]; else delete root.dataset.display;   // see site.css, section 7
    current = f[0];
  }
  apply(current);

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Heading font preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:100px;z-index:999;display:flex;gap:4px;align-items:center;' +
    'padding:6px 6px 6px 10px;background:#fff;border:1px solid #22201C;font:11px/1 "IBM Plex Mono",monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';
  panel.appendChild(document.createTextNode('Headings:'));
  FONTS.forEach(function (f) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = f[0];
    b._paint = function () {
      var on = current === f[0];
      b.style.cssText = 'cursor:pointer;padding:6px 8px;border:1px solid #22201C;font:inherit;' +
        (on ? 'background:#22201C;color:#fff' : 'background:#fff;color:#22201C');
    };
    b.addEventListener('click', function () {
      apply(f[0]);
      try { localStorage.setItem(KEY, f[0]); } catch (e) { /* ignore */ }
      [].forEach.call(panel.querySelectorAll('button'), function (x) { x._paint(); });
    });
    b._paint();
    panel.appendChild(b);
  });
  document.body.appendChild(panel);
})();


/* =============================================================================
   ⚠ TEMPORARY — heading tracking and colour preview. Delete this whole block
   once decided (and set the chosen letter-spacing / colour on the headings).
   A panel at the top of the stack: a row of tracking amounts and a row of
   colour swatches, black to coral. See the end of section 7 in site.css.
   ============================================================================= */
(function () {
  var TRACKS = [['−.02', '-0.02em'], ['Normal', ''], ['+.03', '0.03em'], ['+.06', '0.06em'], ['+.10', '0.1em']];
  var COLORS = [['Black', ''], ['Umber', '#4A3324'], ['Deep rust', '#6E2F1B'], ['Brick', '#8C3A21'],
                ['Coral ink', '#A34527'], ['Coral', '#D4745A']];
  var root = document.documentElement;
  var state = { track: 'Normal', color: 'Black' };
  try {
    state.track = localStorage.getItem('head-track-preview') || 'Normal';
    state.color = localStorage.getItem('head-color-preview') || 'Black';
  } catch (e) { /* no storage: fine */ }

  function apply() {
    var t = TRACKS.filter(function (x) { return x[0] === state.track; })[0] || TRACKS[1];
    var c = COLORS.filter(function (x) { return x[0] === state.color; })[0] || COLORS[0];
    if (t[1]) { root.style.setProperty('--head-track', t[1]); root.dataset.headTrack = ''; }
    else { root.style.removeProperty('--head-track'); delete root.dataset.headTrack; }
    if (c[1]) { root.style.setProperty('--head-color', c[1]); root.dataset.headColor = ''; }
    else { root.style.removeProperty('--head-color'); delete root.dataset.headColor; }
  }
  apply();

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Heading tracking and colour preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:144px;z-index:999;display:grid;gap:5px;' +
    'padding:7px 8px 7px 10px;background:#fff;border:1px solid #22201C;font:11px/1 "IBM Plex Mono",monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';

  function row(label, options, key, storeKey, swatches) {
    var r = document.createElement('div');
    r.style.cssText = 'display:flex;gap:4px;align-items:center';
    var l = document.createElement('span'); l.textContent = label; l.style.width = '78px';
    r.appendChild(l);
    options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.title = o[0];
      b.textContent = swatches ? '' : o[0];
      b._paint = function () {
        var on = state[key] === o[0];
        b.style.cssText = 'cursor:pointer;font:inherit;border:1px solid #22201C;' + (swatches
          ? 'width:22px;height:22px;padding:0;background:' + (o[1] || '#22201C') + ';' +
            'box-shadow:' + (on ? '0 0 0 2px #fff, 0 0 0 3px #22201C' : 'none')
          : 'padding:6px 7px;' + (on ? 'background:#22201C;color:#fff' : 'background:#fff;color:#22201C'));
      };
      b.addEventListener('click', function () {
        state[key] = o[0]; apply();
        try { localStorage.setItem(storeKey, o[0]); } catch (e) { /* ignore */ }
        [].forEach.call(r.querySelectorAll('button'), function (x) { x._paint(); });
      });
      b._paint();
      r.appendChild(b);
    });
    panel.appendChild(r);
  }
  row('Head track:', TRACKS, 'track', 'head-track-preview', false);
  row('Head colour:', COLORS, 'color', 'head-color-preview', true);
  document.body.appendChild(panel);
})();
