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
   ⚠ TEMPORARY — paper-texture preview switch. Delete this whole block once a
   strength is chosen, and set --paper in css/site.css to the chosen value.
   A small panel in the bottom-left corner sets the texture's strength; the
   choice is remembered in this browser while you click between pages.
   ============================================================================= */
(function () {
  // [label, --paper, --page]: each --page keeps the page's average at --bg
  var LEVELS = [['Off', 0, '#F1EBDD'], ['Faint', .4, '#F5EFE1'], ['Subtle', .7, '#F7F2E5'], ['Strong', 1, '#FAF6E8']];
  function apply(l) {
    root.style.setProperty('--paper', l[1]);
    root.style.setProperty('--page', l[2]);
  }
  var KEY = 'paper-preview';
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* no storage: fine */ }
  LEVELS.forEach(function (l) { if (saved !== null && String(l[1]) === saved) apply(l); });

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Paper texture preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:999;display:flex;gap:4px;' +
    'padding:6px;background:#fff;border:1px solid #22201C;font:11px/1 "IBM Plex Mono",monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';
  var current = getComputedStyle(root).getPropertyValue('--paper').trim();
  LEVELS.forEach(function (l) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = l[0];
    var on = String(l[1]) === current || parseFloat(current) === l[1];
    b.style.cssText = 'cursor:pointer;padding:6px 8px;border:1px solid #22201C;font:inherit;' +
      'background:' + (on ? '#22201C;color:#fff' : '#fff;color:#22201C');
    b.addEventListener('click', function () {
      apply(l);
      try { localStorage.setItem(KEY, l[1]); } catch (e) { /* ignore */ }
      [].forEach.call(panel.children, function (x) { x.style.background = '#fff'; x.style.color = '#22201C'; });
      b.style.background = '#22201C'; b.style.color = '#fff';
    });
    panel.appendChild(b);
  });
  document.body.appendChild(panel);
})();
