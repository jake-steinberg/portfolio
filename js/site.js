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
   ⚠ PROTOTYPE — rough headings (css/site.css, section 8). Delete this whole
   block, and section 8, if it isn't kept; if it is, keep the filter and the
   letter splitting, and drop the switch.
   1. Adds the two SVG "rough" filters to the page (a CSS filter can only
      point at an SVG filter that's in the same page).
   2. Can split the big headings into letters, each with a small fixed lean,
      nudge and width. The values come from the letter and its position, so
      they're the same on every visit. Screen readers get the heading's text
      as a whole (from a hidden copy, .sr-only); the letters are hidden from them.
   3. A switch in the bottom-left corner: Off | Edges | Edges + letters,
      remembered in this browser.
   ============================================================================= */
(function () {
  // 1. the filters. baseFrequency sets how long the wobbles are (smaller =
  //    longer, gentler waves); scale sets how far the edges move, in px.
  //    The displaced letters come out with stair-stepped edges, so each is
  //    softened very slightly (feGaussianBlur) and then sharpened again with
  //    a steep alpha curve (feComponentTransfer): a smooth, wobbly outline.
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML =
    '<filter id="rough-md" x="-3%" y="-15%" width="106%" height="130%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="1" seed="7" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feGaussianBlur in="d" stdDeviation="0.5" result="b"/>' +
      '<feComponentTransfer in="b"><feFuncA type="linear" slope="2.4" intercept="-0.7"/></feComponentTransfer>' +
    '</filter>' +
    '<filter id="rough-lg" x="-3%" y="-15%" width="106%" height="130%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="11" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feGaussianBlur in="d" stdDeviation="0.6" result="b"/>' +
      '<feComponentTransfer in="b"><feFuncA type="linear" slope="2.4" intercept="-0.7"/></feComponentTransfer>' +
    '</filter>';
  document.body.appendChild(svg);

  // 2. letters
  var HEADS = '.brand-name, .hero h1, .sec-head h2, .rsec > h2, .ctitle, .csec > h2, .freelance h2';
  function rand(n) {                       // a fixed pseudo-random number in [-1, 1] for n
    var x = Math.sin(n * 12.9898) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1;
  }
  function split(el) {
    if (el.dataset.roughText) return;
    var text = el.textContent;
    el.dataset.roughText = el.innerHTML;
    var i = 0;
    var esc = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    // the heading's text, readable by screen readers but not shown, then the
    // decorative letters, shown but hidden from screen readers
    el.innerHTML = '<span class="sr-only">' + esc(text.trim()) + '</span>' +
      text.trim().split(/(\s+)/).map(function (part) {
      if (/^\s+$/.test(part)) return ' ';
      return '<span class="rw" aria-hidden="true">' + part.split('').map(function (ch) {
        i++;
        var seed = i * 31 + ch.charCodeAt(0);
        return '<span class="rl" style="--r:' + (rand(seed) * 1.6).toFixed(2) + 'deg;' +
          '--y:' + (rand(seed + 1) * 0.035).toFixed(3) + 'em;' +
          '--x:' + (1 + rand(seed + 2) * 0.035).toFixed(3) + '">' +
          esc(ch) + '</span>';
      }).join('') + '</span>';
    }).join('');
  }
  function unsplit(el) {
    if (!el.dataset.roughText) return;
    el.innerHTML = el.dataset.roughText;
    delete el.dataset.roughText;
  }

  // 3. the switch
  var MODES = [['Off', ''], ['Edges', 'edges'], ['Edges + letters', 'letters']];
  var KEY = 'rough-preview';
  var root = document.documentElement;
  var current = 'Off';
  try { current = localStorage.getItem(KEY) || 'Off'; } catch (e) { /* no storage: fine */ }
  function apply(label) {
    var m = MODES.filter(function (x) { return x[0] === label; })[0] || MODES[0];
    if (m[1]) root.dataset.rough = m[1]; else delete root.dataset.rough;
    document.querySelectorAll(HEADS).forEach(m[1] === 'letters' ? split : unsplit);
    current = m[0];
  }
  apply(current);

  var panel = document.createElement('div');
  panel.setAttribute('aria-label', 'Rough headings preview');
  panel.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:999;display:flex;gap:4px;align-items:center;' +
    'padding:6px 6px 6px 10px;background:#fff;border:1px solid #22201C;font:11px/1 ui-monospace,Menlo,monospace;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.15)';
  panel.appendChild(document.createTextNode('Rough headings:'));
  MODES.forEach(function (m) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = m[0];
    b._paint = function () {
      var on = current === m[0];
      b.style.cssText = 'cursor:pointer;padding:6px 8px;border:1px solid #22201C;font:inherit;' +
        (on ? 'background:#22201C;color:#fff' : 'background:#fff;color:#22201C');
    };
    b.addEventListener('click', function () {
      apply(m[0]);
      try { localStorage.setItem(KEY, m[0]); } catch (e) { /* ignore */ }
      [].forEach.call(panel.querySelectorAll('button'), function (x) { x._paint(); });
    });
    b._paint();
    panel.appendChild(b);
  });
  document.body.appendChild(panel);
})();
