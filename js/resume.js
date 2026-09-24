/* =============================================================================
   resume.js — behaviour for resume.html's jump bar.

   1. Measures the jump bar's height into the CSS variable --jumpH, so the
      sticky section names sit just below it (see css/resume.css)
   2. Highlights the button for whichever section you're reading
   3. On phones, where the bar scrolls sideways, keeps that button in view

   Adding a section: give it <section class="rsec" id="something"> and add
   <a href="#something">Label</a> to the jump bar. Nothing to change here.
   ============================================================================= */
(function () {
  const root = document.documentElement;
  const site = document.getElementById('site');
  const jump = document.getElementById('jump');
  if (!jump) return;

  /* 1. Jump bar height (it gets taller if the buttons wrap onto two rows) */
  const measure = () => root.style.setProperty('--jumpH', jump.offsetHeight + 'px');
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(jump);
  window.addEventListener('resize', measure);
  measure();

  /* 2 + 3. Which section is under the sticky bars right now? */
  const links = [...jump.querySelectorAll('a')];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  let current = null;

  function highlight(id) {
    if (id === current) return;
    current = id;
    links.forEach((a) => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('on', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        // if the bar is scrollable (phones) and this button is out of sight, slide it into view
        if (jump.scrollWidth > jump.clientWidth) {
          const left = a.offsetLeft - jump.offsetLeft;
          const right = left + a.offsetWidth;
          if (left < jump.scrollLeft || right > jump.scrollLeft + jump.clientWidth) {
            jump.scrollLeft = left - 16;
          }
        }
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  function update() {
    // the "reading line" is just below the header + jump bar
    const line = (site ? site.offsetHeight : 0) + jump.offsetHeight + 40;
    let id = sections[0].id;
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    // at the very bottom of the page, the last section counts as current
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      id = sections[sections.length - 1].id;
    }
    highlight(id);
  }

  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { update(); queued = false; });
  }, { passive: true });
  update();
})();
