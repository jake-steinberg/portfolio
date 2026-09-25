/* =============================================================================
   portfolio.js — builds the "Selected work" section on index.html.

   It reads TAGS and PROJECTS from js/projects.js (which must load first) and:
     1. makes a filter pill for every tag
     2. draws a tile for every project that matches the selected tags
     3. unfolds a detail panel under a tile's row when it's clicked
     4. plays video tiles only while they're on screen
     5. shows full-size maps in a lightbox
     6. keeps the selected tags in the address bar (?tags=3d,outdoors), so a
        filtered view can be shared as a link

   To add or change work, edit js/projects.js — not this file.
   ============================================================================= */
(function () {

  /* ---------------------------------------------------------------------------
     Setup
     ------------------------------------------------------------------------- */
  const gridEl   = document.getElementById('grid');        // where tiles go
  const pillsEl  = document.getElementById('f-tags');      // where filter pills go
  const emptyEl  = document.getElementById('empty');       // "No projects match…"
  const clearBtn = document.getElementById('clear');       // "Clear filters"

  const selected = new Set();   // tag ids currently switched on
  let openSlug = null;          // slug of the project whose panel is open, if any

  // Where the "In the book" button in a panel goes
  const BOOK_URL = 'https://beltpublishing.com/products/the-twin-cities-in-50-maps';

  // Text on each panel's main button, by linkType
  const LINK_LABEL = { story: 'Read the story', page: 'Open the project', file: 'View the full map' };

  // Shown in a panel when a project's description is still blank
  const PLACEHOLDER = 'Description goes here &mdash; a sentence or two on what the map shows ' +
                      'and what you had to work out to make it.';

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Escape text before putting it into HTML (titles can contain quotes or &)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // tag id -> visible label, e.g. "3d" -> "3D"
  const tagLabel = (id) => (TAGS.find((t) => t.id === id) || { label: id }).label;

  // A project matches if it has EVERY selected tag. Nothing selected = show all.
  const matches = (p) => [...selected].every((id) => p.tags.includes(id));


  /* ---------------------------------------------------------------------------
     1. Filter pills
     ------------------------------------------------------------------------- */
  TAGS.forEach((tag) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill';
    pill.dataset.tag = tag.id;
    pill.textContent = tag.label;
    pill.setAttribute('aria-pressed', 'false');
    pill.addEventListener('click', () => {
      selected.has(tag.id) ? selected.delete(tag.id) : selected.add(tag.id);
      pill.setAttribute('aria-pressed', String(selected.has(tag.id)));
      render();
    });
    pillsEl.insertBefore(pill, clearBtn);   // pills sit before the Clear button
  });

  clearBtn.addEventListener('click', () => {
    selected.clear();
    pillsEl.querySelectorAll('.pill').forEach((p) => p.setAttribute('aria-pressed', 'false'));
    render();
  });


  /* ---------------------------------------------------------------------------
     2. Tiles
     ------------------------------------------------------------------------- */
  function tileHTML(p) {
    // A video tile shows the still image as its poster until the video plays.
    // preload="none" means nothing downloads until the tile scrolls into view.
    const media = p.video
      ? `<video muted loop playsinline preload="none" poster="${esc(p.tile)}" aria-label="${esc(p.title)}">
           <source src="${esc(p.video)}" type="video/mp4">
         </video>`
      : `<img src="${esc(p.tile)}" alt="${esc(p.title)}" loading="lazy" decoding="async">`;

    return `
      <button class="gcard" type="button" aria-expanded="false" data-slug="${esc(p.slug)}">
        <span class="gframe">
          ${p.inBook ? '<span class="marker">In the book</span>' : ''}
          ${media}
          <span class="chip" aria-hidden="true">+</span>
        </span>
        <span class="cap"><span class="ttl">${esc(p.title)}</span></span>
        <span class="tags">${p.tags.map((id) => `<span class="tag">${esc(tagLabel(id))}</span>`).join('')}</span>
      </button>`;
  }

  function render() {
    const visible = PROJECTS.filter(matches);
    openSlug = null;                                   // re-rendering closes any open panel
    gridEl.innerHTML = visible.map(tileHTML).join('');
    emptyEl.hidden = visible.length > 0;
    clearBtn.hidden = selected.size === 0;
    watchVideos();
    writeURL();
  }


  /* ---------------------------------------------------------------------------
     3. Unfolding panel
     The panel is created when a tile is clicked and removed when it closes.
     It's inserted after the last tile in the clicked tile's ROW, so the rest
     of the grid simply moves down instead of leaving holes.
     ------------------------------------------------------------------------- */
  function panelHTML(p) {
    const hasImages = p.images && p.images.length > 0;

    const description = p.description
      ? `<p class="desc">${p.description}</p>`
      : `<p class="desc placeholder">${PLACEHOLDER}</p>`;

    // awards: each is a line of text (HTML allowed), or { award, quote, quoteBy }
    // to add a quote from the judges in a box beneath it
    const awards = (p.awards || []).map((a) => typeof a === 'string'
      ? `<div class="award">${a}</div>`
      : `<div class="award">${a.award}${a.quote ? `
          <blockquote class="quote">${a.quote}${a.quoteBy ? `<footer>${a.quoteBy}</footer>` : ''}</blockquote>` : ''}
        </div>`).join('');

    // "file" links open in the lightbox, except PDFs, which open in a new tab.
    // A project with link: "" gets no main button (e.g. one that lists several stories).
    const isPdf = /\.pdf$/i.test(p.link);
    const mainLink = !p.link ? '' : (p.linkType === 'file' && !isPdf)
      ? `<a class="primary" href="${esc(p.link)}" data-lb="${esc(p.link)}" data-title="${esc(p.title)}">${LINK_LABEL.file} &#8599;</a>`
      : `<a class="primary" href="${esc(p.link)}"${p.linkType === 'page' ? '' : ' target="_blank" rel="noopener"'}>${LINK_LABEL[p.linkType] || 'Open'} &#8599;</a>`;

    // links: [{ label, url }] — a list of stories, for projects that span several
    const storyLinks = (p.links && p.links.length)
      ? `<ul class="storylinks">${p.links.map((l) =>
          `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}<span aria-hidden="true"> &#8599;</span></a></li>`).join('')}</ul>`
      : '';

    const bookLink = p.inBook
      ? `<a href="${BOOK_URL}" target="_blank" rel="noopener">In the book &#8599;</a>`
      : '';

    // Panel pictures. Each entry in images: [] is either a path, or
    // { src, link, label } to make that picture open a story instead, or
    // { src, story, label } to caption it with a link to its story.
    //   picture, no link → opens full size in the lightbox
    //   with a story     → still opens in the lightbox (whose link then says
    //                      "Go to story"), with its label under it linking there
    //   with full        → { src, full }: the lightbox shows src, and its
    //                      "Open full-size map" link opens full (the original)
    //   .mp4             → plays as a silent loop, with the .webp of the same
    //                      name (minus "-loop") as its still poster; not
    //                      clickable unless it has a link
    //   with a link      → opens that page in a new tab
    // 1 picture shows uncropped. 2 sit side by side at matching heights. 3 to 5
    // make a mosaic: the widest across the top and the rest sharing a row
    // beneath it, or all in one row, whichever shows them bigger (see
    // topIsBigger). All uncropped. 6 or more become even 4:3 thumbnails. The
    // whole group is kept within a set height (layoutMedia).
    const shot = (entry) => {
      const { src, link, label, story, full } = typeof entry === 'string' ? { src: entry } : entry;
      const isVideo = /\.mp4$/i.test(src);
      const media = isVideo
        ? `<video src="${esc(src)}" poster="${esc(src.replace(/(-loop)?\.mp4$/i, '.webp'))}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
        : `<img src="${esc(src)}" alt="" decoding="async">`;
      const cls = isVideo ? ' class="pvid"' : '';
      if (story && !isVideo) {
        const name = esc(label || p.title);
        return `<figure class="pshot">
            <a href="${esc(src)}" data-lb="${esc(src)}" data-title="${esc(p.title)} · ${name}" data-story="${esc(story)}">${media}</a>
            <figcaption><a class="pcap" href="${esc(story)}" target="_blank" rel="noopener">${name}<span aria-hidden="true"> &#8599;</span></a></figcaption>
          </figure>`;
      }
      if (link) {
        const name = esc(label || p.title);
        return `<a${cls} href="${esc(link)}" target="_blank" rel="noopener" aria-label="${name} (opens the story)" title="${name}">${media}</a>`;
      }
      return isVideo
        ? `<div class="pvid">${media}</div>`
        : `<a href="${esc(full || src)}" data-lb="${esc(src)}" data-title="${esc(p.title)}"${full ? ` data-full="${esc(full)}"` : ''}>${media}</a>`;
    };
    const count = hasImages ? p.images.length : 0;
    const kind = count >= 4 && count <= 5 ? ' mosaic many'      // .many: the lower row wraps on phones
               : count >= 2 && count <= 3 ? ' mosaic' : '';
    const shots = hasImages
      ? `<div class="pshots${kind}">${p.images.map(shot).join('')}</div>`
      : '';

    // The text is in two parts: .ptop (title, year and tags, description,
    // awards) and .pfoot (story links and buttons) right after it.
    const foot = storyLinks || mainLink || bookLink;

    // The line under the title: the year (if set), then the tags
    const meta = [p.year ? `<span class="tag">${esc(p.year)}</span>` : '',
                  ...p.tags.map((id) => `<span class="tag">${esc(tagLabel(id))}</span>`)].join('');
    return `
      <div class="panel" data-open="false" data-for="${esc(p.slug)}">
        <div class="panel-in">
          <div class="panel-body${hasImages ? '' : ' solo'}">
            <button class="close" type="button" data-close="${esc(p.slug)}">Close &#215;</button>
            <div class="panel-main">
              <div class="ptop">
                <h3>${esc(p.title)}</h3>
                ${meta ? `<div class="tags pmeta">${meta}</div>` : ''}
                ${description}
                ${awards}
              </div>
              ${foot ? `<div class="pfoot">
                ${storyLinks}
                ${(mainLink || bookLink) ? `<div class="plinks">${mainLink}${bookLink}</div>` : ''}
              </div>` : ''}
            </div>
            ${hasImages ? `<div class="pmedia">${shots}</div>` : ''}
          </div>
        </div>
      </div>`;
  }

  // How many columns the grid has right now (changes with screen width)
  function columnCount() {
    const cols = getComputedStyle(gridEl).gridTemplateColumns;
    return cols && cols !== 'none' ? cols.split(' ').filter(Boolean).length : 1;
  }

  // A project with panelCols: 1 or 2 gets a detail view that many columns
  // wide on a desktop grid (3 columns or more): under the open tile alone, or
  // under it and one neighbor.
  // It still spans the whole grid row, so the rows below simply move down;
  // it's just the visible panel (.panel-body) that's narrowed and shifted.
  function sizePanel(panel, slug) {
    const body = panel.querySelector('.panel-body');
    body.style.width = ''; body.style.marginLeft = ''; delete panel.dataset.cols;
    const project = PROJECTS.find((p) => p.slug === slug);
    const cols = columnCount();
    const span = project && project.panelCols;
    if (!span || cols < 3 || span >= cols) return;
    const grid = getComputedStyle(gridEl);
    const tracks = grid.gridTemplateColumns.split(' ').map(parseFloat);    // each column's width
    const gap = parseFloat(grid.columnGap);
    const i = [...gridEl.querySelectorAll('.gcard')].findIndex((t) => t.dataset.slug === slug);
    const start = Math.min(i % cols, cols - span);                        // keep it on the grid
    const left = tracks.slice(0, start).reduce((sum, w) => sum + w + gap, 0);
    const width = tracks.slice(start, start + span).reduce((sum, w) => sum + w, 0) + gap * (span - 1);
    body.style.marginLeft = left + 'px';
    body.style.width = width + 'px';
    panel.dataset.cols = span;                         // see [data-cols] in portfolio.css
  }

  // The last tile in the same row as the tile with this slug
  function rowEnd(slug) {
    const tiles = [...gridEl.querySelectorAll('.gcard')];
    const i = tiles.findIndex((t) => t.dataset.slug === slug);
    if (i < 0) return null;
    const cols = columnCount();
    return tiles[Math.min(Math.ceil((i + 1) / cols) * cols - 1, tiles.length - 1)];
  }

  // The open panel. A panel that's still animating closed can sit in the
  // grid for a moment alongside the new one, so skip any marked .closing.
  const currentPanel = () => gridEl.querySelector('.panel:not(.closing)');

  // Aim the panel's pointer at the middle of the open tile
  function aimPointer() {
    const panel = currentPanel();
    const tile = openSlug && gridEl.querySelector(`.gcard[data-slug="${openSlug}"] .gframe`);
    if (!panel || !tile) return;
    const body = panel.querySelector('.panel-body');
    const t = tile.getBoundingClientRect(), b = body.getBoundingClientRect();
    body.style.setProperty('--arrow-x', Math.round(t.left + t.width / 2 - b.left) + 'px');
  }

  // If the window is resized, move the open panel to its row's new end and re-aim its pointer
  window.addEventListener('resize', () => {
    if (!openSlug) return;
    const panel = currentPanel();
    const end = rowEnd(openSlug);
    if (panel && end && end.nextElementSibling !== panel) end.after(panel);
    if (panel) sizePanel(panel, openSlug);
    aimPointer();
    layoutMedia(panel);
  });

  function closePanel() {
    if (!openSlug) return;
    const panel = currentPanel();
    const tile = gridEl.querySelector(`.gcard[data-slug="${openSlug}"]`);
    if (tile) tile.setAttribute('aria-expanded', 'false');
    openSlug = null;
    if (!panel) return;
    panel.classList.add('closing');                    // so currentPanel() skips it from now on
    panel.dataset.open = 'false';                      // starts the closing animation
    const remove = () => panel.remove();
    if (prefersReducedMotion()) remove();
    else { panel.addEventListener('transitionend', remove, { once: true }); setTimeout(remove, 430); }
  }

  // Give each picture in a mosaic its shape (width ÷ height) as --ar, so the
  // CSS can size them to matching heights. With top = true and 3 or more
  // pictures, mark the widest .wide (the mosaic puts it on top); otherwise
  // they all share one row. Returns the shapes, or null until all have loaded.
  function fitShots(shots, top) {
    const items = [...shots.children];
    const ratios = items.map((el) => {
      const m = el.querySelector('img, video');
      const w = m.naturalWidth || m.videoWidth, h = m.naturalHeight || m.videoHeight;
      return w && h ? w / h : 0;
    });
    if (ratios.some((r) => !r)) return null;           // still waiting on one to load
    const widest = top && items.length >= 3 ? ratios.indexOf(Math.max(...ratios)) : -1;
    items.forEach((el, i) => {
      el.style.setProperty('--ar', ratios[i].toFixed(4));
      el.classList.toggle('wide', i === widest);
    });
    return ratios;
  }

  // For 3 or more pictures in a space W wide and H tall: would they show
  // bigger all in one row, or with the widest on top and the rest in a row
  // beneath? Compares the total picture area of each. (Wide maps usually do
  // better in one row; a mix of shapes, with one very wide, on top.)
  function topIsBigger(ratios, W, H, gap) {
    const n = ratios.length, sum = ratios.reduce((a, b) => a + b, 0);
    const hRow = Math.min(H, (W - gap * (n - 1)) / sum);
    const areaRow = hRow * hRow * sum;
    const top = Math.max(...ratios), rest = sum - top;
    // at width w the mosaic is w/top + gap + (w - gap*(n-2))/rest tall
    let w = W;
    if (w / top + gap + (w - gap * (n - 2)) / rest > H) {
      w = (H - gap + gap * (n - 2) / rest) / (1 / top + 1 / rest);
    }
    const hTop = w / top, hRest = (w - gap * (n - 2)) / rest;
    return hTop * hTop * top + hRest * hRest * rest > areaRow;
  }

  // How tall a panel's pictures may be: a share of the screen's height, and
  // never more than a set number of pixels. Lower these to make the pictures
  // (and so the panels) smaller; the text column widens to take the room.
  const MEDIA_MAX_HEIGHT = 0.4;      // 40% of the screen's height…
  const MEDIA_MAX_PX     = 340;      // …but no taller than this

  // Lay out a panel's pictures: matching heights, then size the group so it
  // is as wide as its column allows without going over the height limit.
  // The CSS centers it in that column (see "PANEL LAYOUT" in portfolio.css).
  // Shapes are only known once each picture or video loads, so this runs
  // again as each one arrives, and when the window is resized.
  function layoutMedia(panel) {
    const box = panel && panel.querySelector('.pmedia');
    if (!box) return;
    box.style.width = '';
    const mosaic = box.querySelector('.pshots.mosaic');
    const wide = window.matchMedia('(min-width: 721px)').matches;
    const ratios = mosaic ? fitShots(mosaic, true) : null;
    if (!wide) return;                                 // phones: full width, widest on top
    // the picture column's width, as the grid has worked it out ("544px 700px")
    const tracks = getComputedStyle(box.parentElement).gridTemplateColumns.split(' ');
    let width = Math.floor(parseFloat(tracks[tracks.length - 1]));
    const limit = Math.min(window.innerHeight * MEDIA_MAX_HEIGHT, MEDIA_MAX_PX);
    // with 3 or more, use whichever arrangement shows the pictures bigger here.
    // Captioned pictures (a story each) always keep one row, in their order.
    const captioned = mosaic && mosaic.querySelector('.pshot');
    if (ratios && ratios.length >= 3 && (captioned || !topIsBigger(ratios, width, limit, 12))) fitShots(mosaic, false);
    for (let pass = 0; pass < 3; pass++) {             // a few passes, since gaps don't scale
      box.style.width = width + 'px';
      const kids = [...box.children];
      const height = kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
      if (height <= limit + 1) break;
      width = Math.floor(width * limit / height);
    }
  }

  // The viewport follows the panels: scroll smoothly so the stretch from
  // top to bottom (page positions) is on screen, below the sticky header. If
  // it's too tall to fit, its top goes just under the header. Nothing moves
  // if it's already in view.
  const FOLLOW_MARGIN = 16;                            // breathing room above and below, in px
  const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const pageBottom = (el) => el.getBoundingClientRect().bottom + window.scrollY;

  function reveal(top, bottom) {
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--headH')) || 0;
    const viewTop = window.scrollY + head + FOLLOW_MARGIN;
    const viewBottom = window.scrollY + window.innerHeight - FOLLOW_MARGIN;
    let target = null;
    if (bottom - top > viewBottom - viewTop || top < viewTop) target = top - head - FOLLOW_MARGIN;
    else if (bottom > viewBottom) target = bottom - window.innerHeight + FOLLOW_MARGIN;
    if (target === null) return;
    window.scrollTo({ top: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  // after a panel closes: bring its tile back into view if it's scrolled away
  function followTile(tile) {
    if (tile) reveal(pageTop(tile), pageBottom(tile));
  }

  function openPanel(slug) {
    const wasOpen = openSlug;
    closePanel();
    if (wasOpen === slug) {                            // clicking the open tile again just closes it
      followTile(gridEl.querySelector(`.gcard[data-slug="${slug}"]`));
      return;
    }

    const project = PROJECTS.find((p) => p.slug === slug);
    const end = rowEnd(slug);
    if (!project || !end) return;

    end.insertAdjacentHTML('afterend', panelHTML(project));
    openSlug = slug;
    const panel = end.nextElementSibling;              // the panel just added
    const tile = gridEl.querySelector(`.gcard[data-slug="${slug}"]`);
    tile.setAttribute('aria-expanded', 'true');
    sizePanel(panel, slug);
    aimPointer();
    watchVideos();                                     // so any loops in the panel play too
    panel.querySelectorAll('.pmedia img, .pmedia video').forEach((m) =>
      m.addEventListener(m.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', () => layoutMedia(panel), { once: true }));
    layoutMedia(panel);

    // Follow it: bring the tile and the whole panel into view. The panel's
    // contents are already full height inside its unfolding frame, so its
    // final size is known now. If a panel above is still folding shut, the
    // page is still moving, so wait for it to finish first. Pictures still
    // loading can make the panel taller, so once they've all arrived (within
    // a couple of seconds), follow once more.
    const openedAt = Date.now();
    const follow = () => { if (openSlug === slug) reveal(pageTop(tile), pageBottom(panel.querySelector('.panel-body'))); };
    const closingAbove = [...gridEl.querySelectorAll('.panel.closing')]
      .some((old) => old.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (closingAbove && !prefersReducedMotion()) setTimeout(follow, 360); else follow();
    // …and again once it has finished unfolding: near the bottom of the page
    // there isn't room to scroll far enough until the panel has grown
    if (!prefersReducedMotion()) setTimeout(follow, 380);
    const loading = [...panel.querySelectorAll('.pmedia img, .pmedia video')]
      .filter((m) => (m.tagName === 'VIDEO' ? m.readyState < 1 : !m.complete));
    let left = loading.length;
    loading.forEach((m) => m.addEventListener(m.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', () => {
      if (--left === 0 && Date.now() - openedAt < 2000) follow();
    }, { once: true }));

    // next frame: flip data-open so the CSS transition runs
    requestAnimationFrame(() => { panel.dataset.open = 'true'; });
  }


  /* ---------------------------------------------------------------------------
     4. Video tiles — play only while at least a quarter of the tile is on
        screen, so 13 videos never run at once. Visitors who prefer reduced
        motion just see the still poster image.
     ------------------------------------------------------------------------- */
  const videoWatcher = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && !prefersReducedMotion()) {
            video.play().catch(() => {});             // a blocked autoplay just leaves the poster
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 })
    : null;

  function watchVideos() {
    if (!videoWatcher) return;
    videoWatcher.disconnect();
    gridEl.querySelectorAll('video').forEach((v) => videoWatcher.observe(v));
  }

  // Browsers won't start video in a background tab. If the page was opened
  // in one, re-check the on-screen videos when the tab comes to the front.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') watchVideos();
  });


  /* ---------------------------------------------------------------------------
     5. Lightbox — any element with data-lb="image.png" opens that image full size
     ------------------------------------------------------------------------- */
  const lb      = document.getElementById('lb');
  const lbImg   = document.getElementById('lb-img');
  const lbCap   = document.getElementById('lb-cap');
  const lbClose = document.getElementById('lb-close');
  let focusBeforeLightbox = null;

  // story: if given, the caption links to that story instead of the full-size file
  // full:  the full-size original to link to, if it isn't src itself
  function openLightbox(src, title, story, full) {
    focusBeforeLightbox = document.activeElement;
    lbImg.src = src;
    lbImg.alt = title;
    const link = story
      ? `<a href="${esc(story)}" target="_blank" rel="noopener">Go to story &#8599;</a>`
      : `<a href="${esc(full || src)}" target="_blank" rel="noopener">Open full-size map &#8599;</a>`;
    lbCap.innerHTML = `${esc(title)} &middot; ${link}`;
    lb.hidden = false;
    lbClose.focus();
  }
  function closeLightbox() {
    lb.hidden = true;
    lbImg.removeAttribute('src');
    if (focusBeforeLightbox) focusBeforeLightbox.focus();
  }
  lbClose.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });   // click the dark backdrop


  /* ---------------------------------------------------------------------------
     Clicks and keys (one listener each, for tiles, panels and the lightbox)
     ------------------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      const tile = gridEl.querySelector(`.gcard[data-slug="${closeBtn.dataset.close}"]`);
      closePanel();
      if (tile) { tile.focus({ preventScroll: true }); followTile(tile); }
      return;
    }
    const lbLink = e.target.closest('[data-lb]');
    if (lbLink) { e.preventDefault(); openLightbox(lbLink.dataset.lb, lbLink.dataset.title, lbLink.dataset.story, lbLink.dataset.full); return; }

    const tile = e.target.closest('.gcard');
    if (tile) openPanel(tile.dataset.slug);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) { closeLightbox(); return; }       // Escape closes the lightbox first…
    if (openSlug) {                                     // …then the open panel
      const tile = gridEl.querySelector(`.gcard[data-slug="${openSlug}"]`);
      closePanel();
      if (tile) { tile.focus({ preventScroll: true }); followTile(tile); }
    }
  });


  /* ---------------------------------------------------------------------------
     6. Selected tags in the address bar
     ------------------------------------------------------------------------- */
  function writeURL() {
    const params = new URLSearchParams(location.search);
    if (selected.size) params.set('tags', [...selected].join(','));
    else params.delete('tags');
    const query = params.toString();
    try { history.replaceState(null, '', query ? `?${query}` : location.pathname); } catch (e) { /* ignore */ }
  }

  function readURL() {
    const known = new Set(TAGS.map((t) => t.id));
    (new URLSearchParams(location.search).get('tags') || '')
      .split(',')
      .filter((id) => known.has(id))                   // ignore misspelled or retired tags
      .forEach((id) => selected.add(id));
    pillsEl.querySelectorAll('.pill').forEach((p) =>
      p.setAttribute('aria-pressed', String(selected.has(p.dataset.tag))));
  }


  /* ---------------------------------------------------------------------------
     Go
     ------------------------------------------------------------------------- */
  readURL();
  render();
})();
