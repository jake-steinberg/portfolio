/* =============================================================================
   label-lab.js — TEMPORARY. A small panel for trying Outfit in place of
   Bell Topo Sans for the labels (the --topo font: nav, tags, dates, "Look
   inside", the Buy the book button, the section dots' names).

   It finds every element drawn in Bell Topo Sans, marks it, and restyles the
   marked elements with the panel's settings. Nothing is saved to the site's
   CSS: settings live in this browser only (localStorage). "Copy settings"
   puts them on the clipboard to hand back.

   To remove: delete this file and its <script> line in index.html.
   ============================================================================= */
(function () {
  const KEY = 'label-lab';
  const DEFAULTS = { font: 'outfit', regular: 500, bold: 700, caps: true, track: 0.08, size: 100, open: true };
  let s;
  try { s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { s = { ...DEFAULTS }; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private window */ } };

  // Mark every element whose own font is Bell Topo Sans (checked before any
  // swap, so it still works once the labels have changed font). Bold labels
  // get a second mark, so regular and bold can be weighted separately. Its
  // original size is kept, for the size slider.
  function mark(root) {
    const els = root.nodeType === 1 ? [root, ...root.querySelectorAll('*')] : [];
    els.forEach((el) => {
      if (el.closest('.lab-panel') || el.dataset.labFs) return;
      const cs = getComputedStyle(el);
      if (!/^"?Bell Topo Sans/.test(cs.fontFamily)) return;
      el.classList.add('lab-lbl');
      if (parseInt(cs.fontWeight, 10) >= 600) el.classList.add('lab-bold');
      el.dataset.labFs = parseFloat(cs.fontSize);
    });
  }

  const css = document.createElement('style');
  css.textContent = `
    html.lab-on .lab-lbl {
      font-family: "Outfit", system-ui, sans-serif !important;
      font-weight: var(--lab-w) !important;
      letter-spacing: var(--lab-track) !important;
      text-transform: var(--lab-case) !important;
    }
    html.lab-on .lab-lbl.lab-bold { font-weight: var(--lab-wb) !important; }
    .lab-panel {
      position: fixed; right: 16px; bottom: 16px; z-index: 1000;
      width: 260px; padding: 12px 14px;
      font: 13px/1.4 system-ui, sans-serif; color: #22201C;
      background: #fffdf8; border: 1px solid #22201C; box-shadow: 0 6px 20px rgba(0,0,0,.18);
    }
    .lab-panel.closed > :not(.lab-head) { display: none; }
    .lab-head { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
    .lab-head button { font: inherit; font-weight: 400; border: 1px solid #aaa; background: #fff; padding: 1px 8px; cursor: pointer; }
    .lab-row { display: grid; grid-template-columns: 82px 1fr 38px; align-items: center; gap: 6px; margin-top: 8px; }
    .lab-row output { text-align: right; font-variant-numeric: tabular-nums; }
    .lab-row input[type=range] { width: 100%; }
    .lab-seg { display: flex; gap: 4px; grid-column: 2 / 4; }
    .lab-seg button { flex: 1; font: inherit; border: 1px solid #aaa; background: #fff; padding: 2px 0; cursor: pointer; }
    .lab-seg button[aria-pressed="true"] { background: #22201C; color: #fff; border-color: #22201C; }
    .lab-foot { display: flex; gap: 6px; margin-top: 10px; }
    .lab-foot button { flex: 1; font: inherit; border: 1px solid #aaa; background: #fff; padding: 3px 0; cursor: pointer; }
    .lab-note { margin-top: 6px; color: #6B6355; font-size: 12px; }
  `;
  document.head.appendChild(css);

  const panel = document.createElement('div');
  panel.className = 'lab-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Label font lab (temporary)');
  const seg = (key, opts) => `<div class="lab-seg" data-key="${key}">${opts.map(([v, l]) =>
    `<button type="button" data-v="${v}">${l}</button>`).join('')}</div>`;
  const range = (key, label, min, max, step) => `<label class="lab-row"><span>${label}</span>
    <input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}"><output data-for="${key}"></output></label>`;
  panel.innerHTML = `
    <div class="lab-head"><span>Label font lab</span><button type="button" data-act="toggle">Hide</button></div>
    <div class="lab-row"><span>Font</span>${seg('font', [['topo', 'Bell Topo'], ['outfit', 'Outfit']])}</div>
    ${range('regular', 'Weight', 100, 900, 50)}
    ${range('bold', 'Bold weight', 100, 900, 50)}
    <div class="lab-row"><span>Case</span>${seg('caps', [['true', 'CAPS'], ['false', 'As written']])}</div>
    ${range('track', 'Spacing (em)', -0.02, 0.24, 0.01)}
    ${range('size', 'Size (%)', 70, 140, 5)}
    <div class="lab-foot"><button type="button" data-act="copy">Copy settings</button><button type="button" data-act="reset">Reset</button></div>
    <div class="lab-note">Weight, case, spacing and size apply to Outfit only. Bold weight is for labels that are bold now.</div>`;
  document.body.appendChild(panel);

  function apply() {
    const on = s.font === 'outfit';
    const root = document.documentElement;
    root.classList.toggle('lab-on', on);
    root.style.setProperty('--lab-w', s.regular);
    root.style.setProperty('--lab-wb', s.bold);
    root.style.setProperty('--lab-track', s.track + 'em');
    root.style.setProperty('--lab-case', s.caps ? 'uppercase' : 'none');
    document.querySelectorAll('.lab-lbl').forEach((el) => {
      el.style.fontSize = on && s.size !== 100 ? (el.dataset.labFs * s.size / 100) + 'px' : '';
    });
    panel.classList.toggle('closed', !s.open);
    panel.querySelector('[data-act="toggle"]').textContent = s.open ? 'Hide' : 'Show';
    panel.querySelectorAll('.lab-seg').forEach((g) => g.querySelectorAll('button').forEach((b) =>
      b.setAttribute('aria-pressed', String(String(s[g.dataset.key]) === b.dataset.v))));
    panel.querySelectorAll('input[type=range]').forEach((r) => {
      r.value = s[r.dataset.key];
      panel.querySelector(`output[data-for="${r.dataset.key}"]`).textContent = s[r.dataset.key];
    });
    save();
  }

  panel.addEventListener('input', (e) => {
    const k = e.target.dataset.key;
    if (k) { s[k] = Number(e.target.value); apply(); }
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const g = b.closest('.lab-seg');
    if (g) s[g.dataset.key] = g.dataset.key === 'caps' ? b.dataset.v === 'true' : b.dataset.v;
    if (b.dataset.act === 'toggle') s.open = !s.open;
    if (b.dataset.act === 'reset') s = { ...DEFAULTS };
    if (b.dataset.act === 'copy') {
      const text = `Labels: ${s.font === 'outfit' ? `Outfit ${s.regular} (bold ${s.bold}), ${s.caps ? 'caps' : 'as written'}, ` +
        `spacing ${s.track}em, size ${s.size}%` : 'Bell Topo Sans (unchanged)'}`;
      navigator.clipboard.writeText(text).then(() => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy settings'; }, 1200); },
        () => window.prompt('Copy these settings:', text));
    }
    apply();
  });

  // mark the labels now, and any added later (tiles, panels, the basemap styles)
  document.documentElement.classList.remove('lab-on');
  const start = () => {
    mark(document.body);
    new MutationObserver((list) => {
      // the panel's own changes (its numbers, button labels) aren't page content
      const added = list.filter((m) => !panel.contains(m.target)).flatMap((m) => [...m.addedNodes]);
      if (!added.length) return;
      document.documentElement.classList.remove('lab-on');   // read the original fonts
      added.forEach(mark);
      apply();
    }).observe(document.body, { childList: true, subtree: true });
    apply();
  };
  // wait for the fonts, so Bell Topo Sans is what the page reports
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
})();
