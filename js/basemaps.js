/* =============================================================================
   basemaps.js — the live map in the "Star Tribune basemap styles" panel.

   js/portfolio.js calls Basemaps.start(panel, project) when a panel for a
   project with basemaps: { … } opens, and Basemaps.stop(panel) when it
   closes. Everything the map needs is in that project's basemaps: block in
   js/projects.js: the tiles, where the map opens, and one entry per style.

   MapLibre (the map) and PMTiles (which reads the single-file tile archive)
   are only downloaded the first time a map opens, so the rest of the page
   never waits on them. To update them, change the version numbers below.
   ============================================================================= */
const Basemaps = (function () {

  const LIBS = {
    css:      'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css',
    maplibre: 'https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js',
    pmtiles:  'https://cdn.jsdelivr.net/npm/pmtiles@4.5.0/dist/pmtiles.js'
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Load the libraries once; every map after the first reuses them
  let ready = null;
  function loadLibs() {
    if (ready) return ready;
    const script = (src) => new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src; el.onload = resolve; el.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(el);
    });
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = LIBS.css;
    document.head.appendChild(css);
    ready = Promise.all([script(LIBS.maplibre), script(LIBS.pmtiles)]).then(() => {
      const protocol = new pmtiles.Protocol();          // lets styles use pmtiles:// sources
      maplibregl.addProtocol('pmtiles', protocol.tile);
    });
    ready.catch(() => { ready = null; });              // try again next time
    return ready;
  }

  // Fetch a style file. A vector source named "protomaps" is pointed at the
  // project's tiles, so the style files don't each need the address.
  async function loadStyle(entry, config) {
    const res = await fetch(entry.style);
    if (!res.ok) throw new Error('missing');
    const style = await res.json();
    const source = style.sources && style.sources.protomaps;
    if (source && config.pmtiles) {
      source.url = 'pmtiles://' + config.pmtiles;
      delete source.tiles;
    }
    return style;
  }

  // The chosen style's name, description and stories, in the panel's text
  function showInfo(panel, entry) {
    const info = panel.querySelector('.styleinfo');
    if (!info) return;
    const links = (entry.links || []).map((l) =>
      `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span aria-hidden="true"> &#8599;</span></a></li>`).join('');
    info.innerHTML = `
      <h4 class="stylename">${esc(entry.title || entry.name)}</h4>
      ${entry.about ? `<p class="styleabout">${esc(entry.about)}</p>` : ''}
      ${links ? `<p class="inwild">In the wild</p><ul class="storylinks">${links}</ul>` : ''}`;
  }

  // A button under + and − that zooms out to the whole state: as far as the
  // tiles reach (bounds: in projects.js). Its icon is a small outline of Minnesota.
  const MN_ICON = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="' +
    'M1.9 2.2L6.3 2.2L6.3 1.1L6.7 1.1L6.9 1.3L7.2 2.6L7.8 3.1L9.1 3.7L9.8 3.6L10.6 3.3L11.6 3.9L12.1 4.6' +
    'L14.1 5.1L15.3 4.7L17 5L18.2 5.2L16.4 6L14.4 7.4L13.6 8.3L12.7 9L12.3 9.4L12.3 11.1L11.3 12.7L11.3 14.1' +
    'L11.2 15.2L12.3 15.8L13.7 17.4L14.5 19L3.5 19L3.5 13.5L3.3 11.6L3.2 9.5L2.7 6.8L2.4 5.3Z"/></svg>';
  function statewideControl(bounds) {
    let box;
    return {
      onAdd(map) {
        box = document.createElement('div');
        box.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        box.innerHTML = `<button type="button" class="basemap-state" title="Zoom out to all of Minnesota" aria-label="Zoom out to all of Minnesota">${MN_ICON}</button>`;
        box.firstChild.addEventListener('click', () => map.fitBounds(bounds));
        return box;
      },
      onRemove() { box.remove(); }
    };
  }

  // A note over the map, e.g. while loading or when a style isn't uploaded yet
  function note(panel, text) {
    const el = panel.querySelector('.basemap-note');
    el.textContent = text || '';
    el.hidden = !text;
  }

  async function choose(panel, config, i) {
    const entry = config.styles[i];
    panel.querySelectorAll('.styleswitch button').forEach((b) =>
      b.setAttribute('aria-pressed', String(Number(b.dataset.style) === i)));
    showInfo(panel, entry);
    const token = (panel.basemapToken = (panel.basemapToken || 0) + 1);   // ignore slower, older loads
    let style;
    try {
      style = await loadStyle(entry, config);
    } catch (e) {
      if (token === panel.basemapToken) note(panel, `${entry.title || entry.name}: style file not uploaded yet (${entry.style})`);
      return;
    }
    if (token !== panel.basemapToken || !panel.isConnected) return;
    note(panel, '');
    // diff: false loads the new style whole; patching one style into another
    // can leave some of the old one's colors behind
    if (panel.basemap) { panel.basemap.setStyle(style, { diff: false }); return; }
    panel.basemap = new maplibregl.Map({
      container: panel.querySelector('.basemap'),
      style,
      center: config.center,
      zoom: config.zoom,
      maxBounds: config.bounds,           // never show past the edge of the tiles
      cooperativeGestures: true,          // page scrolling isn't hijacked: ctrl/⌘ + scroll, or two fingers, to zoom
      attributionControl: { compact: true }
    });
    panel.basemap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    if (config.bounds) panel.basemap.addControl(statewideControl(config.bounds), 'top-right');
  }

  function start(panel, project) {
    const config = project.basemaps;
    // initial: "Outdoors" in projects.js picks the style it opens with; else the first
    const first = Math.max(0, config.styles.findIndex((st) => st.name === config.initial));
    panel.querySelectorAll('.styleswitch button').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.style) === first));
      b.addEventListener('click', () => choose(panel, config, Number(b.dataset.style)));
    });
    showInfo(panel, config.styles[first]);
    note(panel, 'Loading the map…');
    loadLibs()
      .then(() => { if (panel.isConnected) choose(panel, config, first); })
      .catch(() => note(panel, 'The map couldn’t load. Check your connection and open it again.'));
  }

  // Free the map's graphics context when its panel goes away
  function stop(panel) {
    if (panel.basemap) { panel.basemap.remove(); panel.basemap = null; }
  }

  return { start, stop };
})();
