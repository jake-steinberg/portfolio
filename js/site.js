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
   Inknut Antiqua as now, or Outfit (section 7 of site.css).
   ============================================================================= */
(function () {
  var FONTS = [
    ['Inknut', ''],
    ['Outfit', '"Outfit", system-ui, sans-serif']
  ];
  var KEY = 'display-preview';
  var root = document.documentElement;
  var current = 'Inknut';
  try { current = localStorage.getItem(KEY) || 'Inknut'; } catch (e) { /* no storage: fine */ }
  function apply(label) {
    var f = FONTS.filter(function (x) { return x[0] === label; })[0] || FONTS[0];
    if (f[1]) root.style.setProperty('--display', f[1]); else root.style.removeProperty('--display');
    if (f[1]) root.dataset.display = ''; else delete root.dataset.display;   // see site.css, section 7
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
