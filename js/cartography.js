/* =============================================================================
   cartography.js — the /cartography page (cartography.html).

   It reads PROJECTS from js/projects.js (loaded first) and uses js/basemaps.js
   for the live map and js/viewer.js for pictures on phones. It:
     1. fills in the parts of the page that come from js/projects.js — the
        style buttons, each style's "In the wild" stories, the Elex stories
        and the story links — so they stay in step with the main portfolio
     2. runs the live map in the hero:
          wide screens  starts it once the map box is half in view, when the
                        browser is idle; the loop of all five styles stands in
                        until the map has drawn, then fades out
          phones        never starts it on its own: "Open the live map" does.
                        The same goes for any screen when Save-Data is on.
          failure       if the map hasn't drawn within 10 seconds, or its
                        tiles fail, the map is removed and the loop stays,
                        with a note under it saying so
     3. plays the page's videos only while they're on screen, and never
        under reduced motion or Save-Data (their still images show instead)
     4. opens picture links in the phone viewer

   The styles, their use cases and stories are listed in js/strib-styles.js;
   the tiles and where the map opens come from the strib-basemaps project in
   js/projects.js. Edit those, not this file.
   ============================================================================= */
(function () {

  /* ---------------------------------------------------------------------------
     Setup
     ------------------------------------------------------------------------- */
  // The 3D buildings exploration (#explore, spec §6) waits on Jake (Q2). It
  // isn't built: no section, no toggle, no jump link. Leave this false.
  const EXPLORE_3D = false;

  // The tiles and where the map opens: the strib-basemaps project in
  // js/projects.js. The styles: js/strib-styles.js, in the shape
  // js/basemaps.js expects (style = the file), opening on Outdoors.
  const base    = PROJECTS.find((p) => p.slug === 'strib-basemaps');
  const styles  = STRIB_STYLES.map((s) => ({ ...s, style: s.file }));
  const config  = { ...base.basemaps, styles, initial: 'Outdoors' };
  const project = { ...base, basemaps: config };

  const hero    = document.querySelector('.hero');
  const panel   = document.getElementById('hero-map');   // the "panel" js/basemaps.js works in
  const mapBox  = panel.querySelector('.basemap-wrap');
  const poster  = panel.querySelector('.poster');        // the loop that stands in for the map
  const noteEl  = panel.querySelector('.basemap-note');
  const openBtn = panel.querySelector('.open-map');

  const PHONE  = window.matchMedia('(max-width: 720px)');
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
  const savingData = () => !!(navigator.connection && navigator.connection.saveData);
  const stayStill  = () => REDUCE.matches || savingData();

  const GIVE_UP_MS = 10000;     // no drawn map by then: show the loop instead
  const FALLBACK = 'The live map couldn’t load here, so this loop shows all five styles instead.';

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const arrow = '&nbsp;<span class="ar" aria-hidden="true">&#8599;</span>';
  const storyLink = (l) =>
    `<a class="tlink" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${arrow}</a>`;


  /* ---------------------------------------------------------------------------
     1. Parts of the page that come from js/projects.js
     ------------------------------------------------------------------------- */
  // The style buttons, in two rows. The first: the core styles, then the
  // one-off set apart. A core style with variants (Outdoors, Elex) opens on
  // the one with "variant" set on the core entry itself (Main, Elex-2).
  // The second row shows that style's variants, and only while one of them
  // is chosen. data-style is the style's place in the list, which
  // js/basemaps.js looks up; all the buttons are made now, so basemaps.js
  // can attach itself to each when the map starts.
  const first = Math.max(0, styles.findIndex((s) => s.name === config.initial));
  const keyOf = (s) => s.parent || s.key;                       // its core style
  const btn = (s, label, cls = '') =>
    `<button class="pill${cls}" type="button" data-style="${styles.indexOf(s)}" data-group="${esc(keyOf(s))}"` +
    ` aria-pressed="${styles.indexOf(s) === first}">${label}</button>`;
  const core = styles.filter((s) => s.group === 'core');
  const oneoff = styles.filter((s) => s.group === 'oneoff');
  const familyOf = (c) => [c, ...styles.filter((s) => s.parent === c.key)];
  panel.querySelector('.styleswitch').innerHTML = `
    <div class="sw-row" role="group" aria-label="Map style">
      ${core.map((s) => btn(s, esc(s.name), ' sw-core')).join('')}
      ${oneoff.map((s) => `<span class="sw-gap" aria-hidden="true"></span>${btn(s, `${esc(s.name)} <span class="sw-tag">One-off</span>`)}`).join('')}
    </div>
    ${core.filter((c) => familyOf(c).length > 1).map((c) => `
    <div class="sw-row sw-variants" role="group" aria-label="${esc(c.title)} variants" data-for="${esc(c.key)}" hidden>
      ${familyOf(c).map((s) => btn(s, esc(s.variant || s.name))).join('')}
    </div>`).join('')}`;

  // Keep the rows in step with the chosen style: its core button pressed
  // too when a variant is chosen, and its variants' row shown
  function syncSwitch(i) {
    const group = keyOf(styles[i]);
    panel.querySelectorAll('.sw-core').forEach((b) => b.classList.toggle('in-group', b.dataset.group === group));
    panel.querySelectorAll('.sw-variants').forEach((row) => { row.hidden = row.dataset.for !== group; });
  }
  syncSwitch(first);
  // (after js/basemaps.js has handled the click, which bubbles up to here)
  panel.querySelector('.styleswitch').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-style]');
    if (b && started) syncSwitch(Number(b.dataset.style));
  });

  // The style cards: the Twin Cities still (or a placeholder until one is
  // made), the use case, and the stories that ran on the style
  const card = (s, small) => `
    <li class="style-card${small ? ' small' : ''}">
      ${s.frame
        ? `<img class="sc-frame" src="${esc(s.frame)}" width="800" height="640" alt="The Twin Cities in ${esc(s.title)}, labels hidden" loading="lazy" decoding="async">`
        : `<div class="sc-frame sc-missing" role="img" aria-label="${esc(s.title)}: still to come"><span>${esc(s.title)}<br>still to come</span></div>`}
      <p class="sc-name">${esc(small ? (s.variant || s.name) : s.title)}</p>
      <p class="sc-about">${esc(s.about)}</p>
      ${s.links && s.links.length ? `<ul class="sc-links">${s.links.map((l) => `<li>${storyLink(l)}</li>`).join('')}</ul>` : ''}
    </li>`;
  document.getElementById('core-cards').innerHTML = core.map((s) => card(s, false)).join('');
  document.getElementById('oneoff-cards').innerHTML = oneoff.map((s) => card(s, false)).join('');
  document.getElementById('variant-groups').innerHTML = core.filter((c) => familyOf(c).length > 1).map((c) => `
    <div class="variant-group">
      <p class="vg-name">${esc(c.title)}</p>
      <ul class="style-cards">${familyOf(c).map((s) => card(s, true)).join('')}</ul>
    </div>`).join('');

  // Story links written into the page keep their address in step with the
  // project: data-project="slug" takes the project's link, and
  // data-link-index="n" its nth entry in links: [] instead.
  document.querySelectorAll('a[data-project]').forEach((a) => {
    const p = PROJECTS.find((x) => x.slug === a.dataset.project);
    if (!p) return;
    const url = a.dataset.linkIndex != null
      ? ((p.links || [])[Number(a.dataset.linkIndex)] || {}).url
      : p.link;
    if (url) a.href = url;
  });


  /* ---------------------------------------------------------------------------
     3. Videos play only while on screen (a quarter of one showing is enough),
        and never under reduced motion or Save-Data. (Above the map code,
        which uses updatePlayback.)
     ------------------------------------------------------------------------- */
  const onScreen = new Map();                     // video -> how much of it shows (0–1)
  function updatePlayback() {
    onScreen.forEach((ratio, video) => {
      const play = ratio >= 0.25 && !stayStill() && !video.hidden && !video.dataset.retired;
      if (play) video.play().catch(() => {});     // a blocked autoplay just leaves the poster
      else if (!video.paused) video.pause();
    });
  }
  if ('IntersectionObserver' in window) {
    const videoWatcher = new IntersectionObserver((entries) => {
      entries.forEach((entry) => onScreen.set(entry.target, entry.intersectionRatio));
      updatePlayback();
    }, { threshold: [0, 0.25, 0.5, 1] });
    document.querySelectorAll('video[data-onscreen]').forEach((v) => videoWatcher.observe(v));
  }
  // The videos below the hero sit over a lazy still image (an <img>, not a
  // poster=, which browsers fetch at once however far down the page it is).
  // Each stays invisible until it's actually playing, then fades in
  // (.ready in css/cartography.css), so the still never gives way to a
  // blank box while the video loads.
  document.querySelectorAll('.still + video').forEach((v) =>
    v.addEventListener('playing', () => v.classList.add('ready'), { once: true }));
  REDUCE.addEventListener('change', updatePlayback);
  // browsers won't start video in a background tab; try again when it's shown
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') updatePlayback();
  });


  /* ---------------------------------------------------------------------------
     2. The live map in the hero
     ------------------------------------------------------------------------- */
  let started = false;      // Basemaps.start has been called
  let drawn = false;        // the map has drawn once: the loop has gone
  let failed = false;       // gave up: the loop stays, with the note
  let giveUp = 0;           // the 10-second timer
  let autoWatch = null;     // the observer that starts the map on wide screens

  // Phones (and Save-Data anywhere) wait for a tap
  const tapToLoad = () => PHONE.matches || savingData();

  function startMap() {
    if (started) return;
    started = true;
    hero.classList.add('is-live');
    giveUp = setTimeout(fail, GIVE_UP_MS);
    Basemaps.start(panel, project);
  }

  // The map has drawn its first view: fade the loop out (at once under
  // reduced motion), then pause and hide it so it costs nothing
  function reveal() {
    if (drawn || failed) return;
    drawn = true;
    clearTimeout(giveUp);
    poster.dataset.retired = '1';
    hero.classList.add('is-drawn');
    setTimeout(() => { poster.pause(); poster.hidden = true; }, REDUCE.matches ? 0 : 300);
  }

  // Give up on the map: remove it, keep the loop, and say why under it
  function fail() {
    if (failed || drawn) return;
    failed = true;
    clearTimeout(giveUp);
    // js/basemaps.js drops a style still on its way when this number changes,
    // so a slow load can't bring a map back after this
    panel.basemapToken = (panel.basemapToken || 0) + 1;
    // removed on the next tick, never from inside one of the map's own events
    setTimeout(() => { Basemaps.stop(panel); showFallback(); });
    showFallback();
  }
  function showFallback() {
    // The style buttons are about to be hidden. If one has keyboard focus
    // (after "Open the live map", it does), focus would drop to the top of
    // the page; it moves to the note instead, which a screen reader then
    // reads out.
    const lost = panel.querySelector('.styleswitch').contains(document.activeElement);
    hero.classList.add('is-fallback');
    noteEl.textContent = FALLBACK;
    noteEl.hidden = false;
    if (lost) {
      noteEl.tabIndex = -1;
      noteEl.focus({ preventScroll: true });
    }
    updatePlayback();
  }

  // The style's name, which js/basemaps.js writes into .styleinfo as an
  // <h4> (right for the main portfolio's panels), would come straight after
  // this page's <h1>. Each time it's written, it's marked as a level-2
  // heading instead, so the page's outline doesn't skip levels.
  const styleInfo = panel.querySelector('.styleinfo');
  const levelName = () => {
    const name = styleInfo.querySelector('.stylename');
    if (name && name.getAttribute('aria-level') !== '2') {
      name.setAttribute('role', 'heading');
      name.setAttribute('aria-level', '2');
    }
  };
  new MutationObserver(levelName).observe(styleInfo, { childList: true, subtree: true });

  // js/basemaps.js announces each new map (once per start) with basemap:map
  panel.addEventListener('basemap:map', (e) => {
    const map = e.detail;
    // the libraries arrived after we'd given up: take the map straight down
    // again (on the next tick: basemaps.js is still adding its buttons)
    if (failed) { setTimeout(() => { Basemaps.stop(panel); showFallback(); }); return; }

    // The styles point at a public demo sprite that lacks two of their icons
    // (townspot, prince-wetland-dots). An empty 1x1 image stands in, so the
    // console stays quiet; nothing is drawn in their place.
    map.on('styleimagemissing', (ev) => {
      if (!map.hasImage(ev.id)) map.addImage(ev.id, { width: 1, height: 1, data: new Uint8Array(4) });
    });

    // Tiles that fail before the first view has drawn (e.g. the tile host
    // refuses this site) mean there's no map to show. Later errors, a tile
    // here or there while panning, are left to MapLibre.
    map.on('error', (ev) => {
      if (drawn) return;
      const msg = String((ev.error && ev.error.message) || '');
      if (ev.sourceId === 'protomaps' || msg.includes(config.pmtiles) || /pmtiles/i.test(msg)) fail();
    });
    // "idle" means nothing is left loading, which is also true when every
    // tile failed. So the loop only goes once a tile of the main vector
    // source has actually arrived; otherwise it's the fallback.
    let gotTiles = false;
    map.on('sourcedata', (ev) => { if (ev.sourceId === 'protomaps' && ev.tile) gotTiles = true; });
    map.once('idle', () => { if (gotTiles) reveal(); else fail(); });
  });

  // Wide screens: start once half the map box is in view, when the browser
  // has a moment (at most 2 seconds later)
  function armAutoStart() {
    if (started || autoWatch || tapToLoad() || !('IntersectionObserver' in window)) return;
    autoWatch = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.5 || started || tapToLoad()) return;
      autoWatch.disconnect(); autoWatch = null;
      if ('requestIdleCallback' in window) requestIdleCallback(startMap, { timeout: 2000 });
      else setTimeout(startMap, 200);
    }, { threshold: [0, 0.5] });
    autoWatch.observe(mapBox);
  }

  // Phones: "Open the live map", then focus moves to the pressed style button
  // (the tapped button goes away)
  openBtn.addEventListener('click', () => {
    startMap();
    const pressed = panel.querySelector('.styleswitch [aria-pressed="true"]');
    if (pressed) pressed.focus({ preventScroll: true });
  });

  function setMode() {
    if (started) return;
    hero.classList.toggle('tap-to-load', tapToLoad());
    if (tapToLoad()) { if (autoWatch) { autoWatch.disconnect(); autoWatch = null; } }
    else armAutoStart();
  }
  setMode();
  PHONE.addEventListener('change', setMode);   // e.g. a tablet turned sideways

  // Leaving the page frees the map's graphics context. Coming back to it
  // from the back/forward cache starts over from the loop.
  window.addEventListener('pagehide', () => Basemaps.stop(panel));
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted || !started) return;
    started = drawn = failed = false;
    clearTimeout(giveUp);
    hero.classList.remove('is-live', 'is-drawn', 'is-fallback');
    noteEl.hidden = true;
    poster.hidden = false;
    delete poster.dataset.retired;
    updatePlayback();
    setMode();
  });

  if (EXPLORE_3D) { /* the exploration would hook in here once approved and built */ }


  /* ---------------------------------------------------------------------------
     4. Pictures on phones open in the viewer (js/viewer.js); on wider screens
        they open in a new tab, as the links say
     ------------------------------------------------------------------------- */
  Viewer.watch('main a[href]');
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && Viewer.isOpen()) Viewer.close();
  });

})();
