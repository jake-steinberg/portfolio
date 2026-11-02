/* =============================================================================
   portfolio.js — builds the "Selected work" section on index.html.

   It reads TAGS and PROJECTS from js/projects.js (which must load first) and:
     1. makes a filter pill for every tag
     2. draws a tile for every project that matches the selected tag
     3. unfolds a detail panel under a tile's row when it's clicked
     4. plays video tiles only while they're on screen
     5. keeps the selected tag in the address bar (?tags=outdoors), so a
        filtered view can be shared as a link

   To add or change work, edit js/projects.js — not this file.
   ============================================================================= */
(function () {

  /* ---------------------------------------------------------------------------
     Setup
     ------------------------------------------------------------------------- */
  const mainEl   = document.getElementById('grid');        // "Other work": the filtered grid
  const pillsEl  = document.getElementById('f-tags');      // where filter pills go
  const emptyEl  = document.getElementById('empty');       // "No projects match…"
  const clearBtn = document.getElementById('clear');       // "Clear filters"

  const selected = new Set();   // the tag id switched on (only one at a time)

  // Projects shown in the sections above "Other work" (SECTIONS in projects.js)
  // stay out of that grid, so nothing appears twice
  const SECTION_LISTS = typeof SECTIONS === 'undefined' ? {} : SECTIONS;
  const PLACED = new Set(Object.values(SECTION_LISTS).flat());
  const bySlug = (slug) => PROJECTS.find((p) => p.slug === slug);


  // Text on each panel's main button, by linkType
  const LINK_LABEL = { story: 'Read the story', page: 'Open the project', file: 'View the full map',
                       project: 'View the project' };   // project: someone else's site, in a new tab

  // Shown in a panel when a project's description is still blank
  const PLACEHOLDER = 'Description goes here &mdash; a sentence or two on what the map shows ' +
                      'and what you had to work out to make it.';

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Escape text before putting it into HTML (titles can contain quotes or &)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // tag id -> visible label, e.g. "3d" -> "3D"
  const tagLabel = (id) => (TAGS.find((t) => t.id === id) || { label: id }).label;

  // A project matches if it has the selected tag. Nothing selected = show all,
  // except projects with onlyWhen: [tags] in projects.js — those stay out of the
  // full grid and appear only while one of their onlyWhen tags is selected.
  const matches = (p) => {
    if (PLACED.has(p.slug)) return false;
    const ids = [...selected];
    if (p.onlyWhen && !ids.some((id) => p.onlyWhen.includes(id))) return false;
    return ids.every((id) => p.tags.includes(id));
  };


  /* ---------------------------------------------------------------------------
     1. Filter pills
     ------------------------------------------------------------------------- */
  // (a tag whose projects are all in the sections above gets no pill)
  TAGS.filter((tag) => PROJECTS.some((p) => !PLACED.has(p.slug) && p.tags.includes(tag.id))).forEach((tag) => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill';
    pill.dataset.tag = tag.id;
    pill.textContent = tag.label;
    pill.setAttribute('aria-pressed', 'false');
    // One tag at a time: picking a pill switches off any other; picking the
    // one that's on switches it off, showing everything again.
    pill.addEventListener('click', () => {
      const wasOn = selected.has(tag.id);
      selected.clear();
      if (!wasOn) selected.add(tag.id);
      pillsEl.querySelectorAll('.pill').forEach((p) =>
        p.setAttribute('aria-pressed', String(selected.has(p.dataset.tag))));
      mainGrid.render();
    });
    pillsEl.insertBefore(pill, clearBtn);   // pills sit before the Clear button
  });

  clearBtn.addEventListener('click', () => {
    selected.clear();
    pillsEl.querySelectorAll('.pill').forEach((p) => p.setAttribute('aria-pressed', 'false'));
    mainGrid.render();
  });


  /* ---------------------------------------------------------------------------
     2. Tiles
     ------------------------------------------------------------------------- */
  function tileHTML(p) {
    // A video tile is the still image with the video laid over it. The video
    // stays invisible until it's actually playing (section 4), so there's
    // never a blank moment while it loads (iPhones hide a video's poster as
    // soon as it's told to play). The still loads lazily like any tile;
    // preload="none" means the video downloads nothing until it plays.
    // (no tile yet: tile: "" shows a placeholder box saying so)
    const media = !p.tile
      ? `<span class="gtodo">Picture to come</span>`
      : p.video
      ? `<img class="still" src="${esc(p.tile)}" alt="" loading="lazy" decoding="async">
         <video muted loop playsinline preload="none" aria-label="${esc(p.title)}">
           <source src="${esc(p.video)}" type="video/mp4">
         </video>`
      : `<img src="${esc(p.tile)}" alt="${esc(p.title)}" loading="lazy" decoding="async">`;

    return `
      <button class="gcard${p.size === 'large' ? ' big' : ''}" type="button" aria-expanded="false" data-slug="${esc(p.slug)}">
        <span class="gframe">
          ${media}
          <span class="chip" aria-hidden="true">+</span>
        </span>
        <span class="cap"><span class="ttl">${esc(p.title)}</span>${p.basemapStyle ? `<span class="tstyle">${esc(p.basemapStyle)}</span>` : ''}<span class="cta" aria-hidden="true">Details <span class="plus">+</span></span></span>
        <span class="tags">${p.tags.map((id) => `<span class="tag">${esc(tagLabel(id))}</span>`).join('')}</span>
      </button>`;
  }

  /* ---------------------------------------------------------------------------
     3. Unfolding panel
     The panel is created when a tile is clicked and removed when it closes.
     It's inserted after the last tile in the clicked tile's ROW, so the rest
     of the grid simply moves down instead of leaving holes.
     ------------------------------------------------------------------------- */
  // panelHTML(p, { feature: true }) draws an always-open block instead, for
  // the sections above "Other work": no Close button, an <h2> title, and
  // feature: { media, specimen } in projects.js if the project has them.
  function panelHTML(p, { feature: asFeature = false } = {}) {
    const extra = (asFeature && p.feature) || {};
    // feature.media: pictures beside the text instead of images: [], which
    // then run the whole width under everything else
    const lead = extra.media || null;
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

    // Stories and files (full-size images, PDFs) open in a new tab; the
    // project's own page opens in this one.
    // A project with link: "" gets no main button (e.g. one that lists several stories).
    const mainLink = !p.link ? ''
      : `<a class="primary" href="${esc(p.link)}"${p.linkType === 'page' ? '' : ' target="_blank" rel="noopener"'}>${esc(p.linkLabel || LINK_LABEL[p.linkType] || 'Open')}&nbsp;<span class="ar" aria-hidden="true">&#8599;</span></a>`;

    // links: [{ label, url }] — a list of stories, for projects that span several.
    // When every story has an image: { label, url, image } (its sharing
    // picture, or an .mp4 loop with a .webp poster), they're a grid of cards
    // instead: the picture with the headline under it, two to a row.
    const hasList = p.links && p.links.length;
    const cards = hasList && p.links.every((l) => l.image);
    const cardMedia = (src) => /\.mp4$/i.test(src)
      ? `<video src="${esc(src)}" poster="${esc(src.replace(/(-loop)?\.mp4$/i, '.webp'))}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
      : `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">`;
    const textList = hasList && !cards;
    const storyLinks = cards
      ? `<ul class="storycards">${p.links.map((l) =>
          `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">
            <span class="scard-img">${cardMedia(l.image)}</span>
            <span class="scard-ttl"><span>${esc(l.label)}&nbsp;<span class="ar" aria-hidden="true">&#8599;</span></span></span>
          </a></li>`).join('')}</ul>`
      : textList
      ? `<ul class="storylinks">${p.links.map((l) =>
          `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}&nbsp;<span class="ar" aria-hidden="true">&#8599;</span></a></li>`).join('')}</ul>`
      : '';

    // Panel pictures. Each entry in images: [] is either a path, or
    // { src, link, label } to make that picture open a story instead, or
    // { src, story, label } to caption it with a link to its story.
    //   picture, no link → clicking opens it full size, in a new tab
    //   with a story     → the picture still opens full size; its label under
    //                      it links to the story. A label with no story or
    //                      link is a plain caption (add story: once it's out)
    //   zoom: false      → shown, but not clickable and no hover effect
    //   captionAbove     → { src, label, captionAbove: true }: its caption over it
    //   captionStar      → captionStar: true styles the caption like an award line, with a star
    //   with inBook      → { src, inBook: true }: the "Book version" corner
    //                      marker on the picture (e.g. its book version)
    //   with credit      → { src, credit: "Photo by …" }: a tooltip on the
    //                      picture, and gathered into one line under the
    //                      pictures (unless the project has its own credit:)
    //   with full        → { src, full }: the panel shows src (a light copy),
    //                      and clicking opens full (the original)
    //   .mp4             → plays as a silent loop, with the .webp of the same
    //                      name (minus "-loop") as its still poster; not
    //                      clickable unless it has a link
    //   with a link      → opens that page in a new tab
    // 1 picture shows uncropped. 2 sit side by side at matching heights. 3 or 5
    // make a mosaic: the widest across the top and the rest sharing a row
    // beneath it, or all in one row, whichever shows them bigger (see
    // topIsBigger). 4 sit in two rows of two (.pairs). 6 or more make a grid,
    // three to a row (two on phones). All uncropped. The
    // whole group is kept within a set height (layoutMedia).
    // top: true puts that picture across the top of a mosaic instead of the widest.
    // tall: true gives that picture the full height on the left, with the
    // others stacked in a column beside it (.tallmix).
    const shot = (entry) => {
      const html = shotHTML(entry);
      const flags = (entry.top ? ' data-top' : '') + (entry.tall ? ' data-tall' : '');
      return flags ? html.replace(/^(\s*<\w+)/, '$1' + flags) : html;
    };
    const shotHTML = (entry) => {
      const { src, link, label, story, full, credit, inBook, zoom, captionAbove, captionStar } = typeof entry === 'string' ? { src: entry } : entry;
      const marker = inBook ? '<span class="marker">Book version</span>' : '';
      const big = esc(full || src);                    // what clicking the picture opens
      const tip = credit ? ` title="${esc(credit)}"` : '';
      const isVideo = /\.mp4$/i.test(src);
      const media = isVideo
        ? `<video src="${esc(src)}" poster="${esc(src.replace(/(-loop)?\.mp4$/i, '.webp'))}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
        : `<img src="${esc(src)}" alt="" decoding="async">`;
      const cls = isVideo ? ' class="pvid"' : '';
      // a caption under the picture: a link to its story, or plain text with a label only
      // (a looping video with a story links there too; with only a label, it's just shown)
      if (story || (label && !link)) {
        const name = esc(label || p.title).replace(/\n/g, '<br>');   // \n in a label starts a new line
        const caption = story
          ? `<a class="pcap" href="${esc(story)}" target="_blank" rel="noopener">${name}&nbsp;<span class="ar" aria-hidden="true">&#8599;</span></a>`
          : name;
        const pic = !isVideo ? `<a href="${big}" target="_blank" rel="noopener"${tip}>${media}</a>`
          : story ? `<a class="pvid" href="${esc(story)}" target="_blank" rel="noopener" tabindex="-1">${media}</a>`
          : `<div class="pvid">${media}</div>`;
        return `<figure class="pshot${captionAbove ? ' cap-above' : ''}">
            ${pic}
            <figcaption${captionStar ? ' class="starred"' : ''}>${caption}</figcaption>
          </figure>`;
      }
      if (zoom === false && !link) return `<div class="pstill"${tip}>${marker}${media}</div>`;   // just shown
      if (link) {
        const name = esc(label || p.title);
        return `<a${cls} href="${esc(link)}" target="_blank" rel="noopener" aria-label="${name} (opens the story)" title="${name}">${media}</a>`;
      }
      return isVideo
        ? `<div class="pvid">${media}</div>`
        : `<a href="${big}" target="_blank" rel="noopener"${tip}>${marker}${media}</a>`;
    };
    const shotsGroup = (imgs) => {
      const n = imgs.length;
      // scatter: true → loose, unframed rows filling the width (see .scatter in portfolio.css)
      if (p.scatter) return `<div class="pshots scatter">${imgs.map(shot).join('')}</div>`;
      // stack: true → one above the other, each the full width (see .stack in portfolio.css)
      if (p.stack) return `<div class="pshots stack">${imgs.map(shot).join('')}</div>`;
      // tall: true → the tall picture first, then the rest in a column beside it,
      // as many rows as there are other pictures (--rest; see .tallmix in portfolio.css)
      const tall = imgs.filter((img) => typeof img !== 'string' && img.tall);
      if (tall.length && n > 1) {
        const ordered = [...tall.slice(0, 1), ...imgs.filter((img) => img !== tall[0])];
        return `<div class="pshots tallmix" style="--rest:${n - 1}">${ordered.map(shot).join('')}</div>`;   // fitTall sizes it
      }
      const kind = n >= 6 ? ' grid'                       // .grid: three to a row, uncropped
                 : n === 4 ? ' mosaic many pairs'         // .pairs: two rows of two
                 : n === 5 ? ' mosaic many'               // .many: the lower row wraps on phones
                 : n >= 2 && n <= 3 ? ' mosaic' : '';
      return `<div class="pshots${kind}">${imgs.map(shot).join('')}</div>`;
    };
    // A picture marked top: true normally just sits across the top of the
    // mosaic beside the text (see fitShots in layoutMedia below). But when
    // there are OTHER pictures too, they'd get squeezed into that same column
    // under it — so instead the top picture has the picture column to itself,
    // and the others spread out in a row under the description, in the text
    // column (.pmedia-below; the .split layout in portfolio.css). On phones
    // everything stacks: text, top picture, then the others.
    // (Used by The Legacy Tree: the map beside the text, the photos under it.)
    const isTop = (img) => typeof img !== 'string' && img.top;
    const topImages = hasImages ? p.images.filter(isTop) : [];
    const belowImages = hasImages ? p.images.filter((img) => !isTop(img)) : [];
    const splitBelow = topImages.length > 0 && belowImages.length > 0;
    const shots = lead ? shotsGroup(lead)
                : hasImages ? shotsGroup(splitBelow ? topImages : p.images) : '';
    const belowShots = splitBelow ? shotsGroup(belowImages) : '';

    // The text is in two parts: .ptop (title, year and tags, description,
    // awards) and .pfoot (story links and buttons) right after it.
    const foot = storyLinks || mainLink;

    // The line under the title: the year (if set), then the tags
    const meta = [p.year ? `<span class="tag">${esc(p.year)}</span>` : '',
                  ...p.tags.map((id) => `<span class="tag">${esc(tagLabel(id))}</span>`)].join('');
    // The credit line under the pictures: the project's credit:, or else one
    // line gathered from the pictures' own credits, e.g. "Photo by A" on two
    // pictures and "Photo by B" on another → "Photos by A and B"
    const credited = (p.images || []).filter((img) => typeof img === 'object' && img.credit);
    const names = [...new Set(credited.map((img) => img.credit.replace(/^photos? by\s+/i, '')))];
    const joined = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
    const creditLine = p.credit || (names.length ? `${credited.length > 1 ? 'Photos' : 'Photo'} by ${joined}` : '');
    const creditHTML = creditLine ? `<p class="pcredit">${esc(creditLine)}</p>` : '';

    // basemaps: { … } — a live map (js/basemaps.js). A button per style goes
    // under the text, with the chosen style's name and description below it.
    const maps = p.basemaps;
    const styleButtons = maps ? `<div class="styleswitch" role="group" aria-label="Map style">${maps.styles.map((st, i) =>
                `<button class="pill" type="button" data-style="${i}" aria-pressed="false">${esc(st.name)}</button>`).join('')}</div>` : '';
    const mapHTML = maps ? `<div class="pmedia pmap">
              <div class="basemap-wrap"><div class="basemap"></div><p class="basemap-note" hidden></p></div>
            </div>` : '';
    const hasMedia = hasImages || !!maps || !!lead;
    // a feature's own extras: images in one wide row, and a live map
    // (specimen: { src, title }) under everything, loaded only when near
    const wideShots = lead && hasImages ? `<div class="pmedia pwide">${shotsGroup(p.images)}</div>` : '';
    const specimen = extra.specimen ? `<figure class="specimen">
              <iframe data-src="${esc(extra.specimen.src)}" title="${esc(extra.specimen.title || p.title)}" loading="lazy"></iframe>
              ${extra.specimen.caption ? `<figcaption>${extra.specimen.caption}</figcaption>` : ''}
            </figure>` : '';
    const heading = asFeature ? `<h2 class="ptitle" id="f-${esc(p.slug)}">${esc(p.title)}</h2>` : `<h3 class="ptitle">${esc(p.title)}</h3>`;
    return `
      <div class="panel${asFeature ? ' feature' : ''}" data-open="${asFeature}" data-for="${esc(p.slug)}">
        <div class="panel-in">
          <div class="panel-body${hasMedia ? '' : ' solo'}${splitBelow ? ' split' : ''}${p.mediaHalf ? ' half' : ''}${p.mediaFull && !lead ? ' full' : ''}">
            ${asFeature ? '' : `<button class="close" type="button" data-close="${esc(p.slug)}">Close <span class="x" aria-hidden="true">&#215;</span></button>`}
            <div class="panel-main">
              <div class="ptop">
                ${heading}
                ${meta ? `<div class="tags pmeta">${meta}</div>` : ''}
                ${description}
                ${awards}
                ${styleButtons}
                ${maps ? '<div class="styleinfo" aria-live="polite"></div>' : ''}
                ${asFeature && maps ? '<div class="feature-slot" data-slot="cartography" hidden></div>' : ''}
              </div>
              ${foot ? `<div class="pfoot">
                ${storyLinks}
                ${mainLink ? `<div class="plinks">${mainLink}</div>` : ''}
              </div>` : ''}
            </div>
            ${mapHTML}
            ${shots ? `<div class="pmedia">${shots}${splitBelow ? '' : creditHTML}</div>` : ''}
            ${splitBelow ? `<div class="pmedia pmedia-below">${belowShots}</div>${creditHTML}` : ''}
            ${wideShots}
            ${specimen}
          </div>
        </div>
      </div>`;
  }

  // The veil that dims the rest of the page while a panel is open
  // (see .dimmer in portfolio.css)
  const dimmer = document.createElement('div');
  dimmer.className = 'dimmer';
  dimmer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dimmer);
  const dim = (on) => dimmer.classList.toggle('on', on);

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
    const chosen = items.findIndex((el) => el.hasAttribute('data-top'));   // top: true in projects.js
    const pairs = shots.classList.contains('pairs');     // two rows of two: nothing goes on top
    const widest = top && items.length >= 3 && !pairs ? (chosen >= 0 ? chosen : ratios.indexOf(Math.max(...ratios))) : -1;
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
  // the always-open blocks at the top of the page, and the maps from the
  // book (inBook: true), show their pictures bigger
  const FEATURE_MAX_HEIGHT = 0.7, FEATURE_MAX_PX = 620;
  const showsBig = (box) => {
    if (box.closest('.feature')) return true;
    const panel = box.closest('.panel');
    const project = panel && bySlug(panel.dataset.for);
    return Boolean(project && project.inBook);
  };
  const mediaLimit = (box) => showsBig(box)
    ? Math.min(window.innerHeight * FEATURE_MAX_HEIGHT, FEATURE_MAX_PX)
    : Math.min(window.innerHeight * MEDIA_MAX_HEIGHT, MEDIA_MAX_PX);

  // Lay out the pictures beside the text (.pmedia): matching heights, then
  // size the group so it is as wide as its column allows without going over
  // the height limit. The CSS centers it in that column (see "PANEL LAYOUT"
  // in portfolio.css). Shapes are only known once each picture or video
  // loads, so this runs again as each one arrives, and when the window is
  // resized.
  function sizeMediaBox(box) {
    box.style.width = '';
    if (box.classList.contains('pmap')) return;         // the live map fills its column (see .pmap)
    // a tall picture with a column beside it fills the whole width it's given,
    // cropped to fit, rather than keeping within the height limit
    const tall = box.querySelector('.pshots.tallmix');
    if (tall) { box.style.width = '100%'; fitTall(tall); return; }
    // scattered pictures fill the width too, in one line (their shapes set the widths)
    const scatter = box.querySelector('.pshots.scatter');
    if (scatter) { box.style.width = '100%'; fitShots(scatter, false); return; }
    const mosaic = box.querySelector('.pshots.mosaic');
    const wide = window.matchMedia('(min-width: 721px)').matches;
    const ratios = mosaic ? fitShots(mosaic, true) : null;
    if (!wide) return;                                 // phones: full width, widest on top
    // mediaHalf: true in projects.js — fill the picture half, however tall
    if (box.parentElement.classList.contains('half') && !box.closest('.panel[data-cols]')) {
      box.style.width = '100%'; return;
    }
    // mediaFull: true — fill the whole width under the text, however tall
    if (box.parentElement.classList.contains('full')) { box.style.width = '100%'; return; }
    // the picture column's width, as the grid has worked it out ("544px 700px")
    const tracks = getComputedStyle(box.parentElement).gridTemplateColumns.split(' ');
    let width = Math.floor(parseFloat(tracks[tracks.length - 1]));
    const limit = mediaLimit(box);
    // with 3 or more, use whichever arrangement shows the pictures bigger here.
    // Captioned pictures (a story each) always keep one row, in their order.
    const captioned = mosaic && mosaic.querySelector('.pshot');
    // A picture marked top: true always keeps its place across the top.
    const chosenTop = mosaic && mosaic.querySelector('[data-top]');
    if (ratios && ratios.length >= 3 && !chosenTop &&
        (captioned || !topIsBigger(ratios, width, limit, 12))) fitShots(mosaic, false);
    for (let pass = 0; pass < 3; pass++) {             // a few passes, since gaps don't scale
      box.style.width = width + 'px';
      const kids = [...box.children];
      const height = kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top;
      if (height <= limit + 1) break;
      width = Math.floor(width * limit / height);
    }
  }

  // A tall picture beside a column of others (.tallmix): split the width so
  // the tall one is as tall as the column at its own shape, give or take the
  // gaps, so it's barely cropped. The column pictures are shown at 3:2.
  const COLUMN_SHAPE = 3 / 2;
  function fitTall(group) {
    const m = group.querySelector('[data-tall] img, [data-tall] video');
    const ar = m && (m.naturalWidth || m.videoWidth) / (m.naturalHeight || m.videoHeight);
    const rest = group.children.length - 1;
    const share = ar ? ar * rest / COLUMN_SHAPE : rest / 2;     // until it loads: a 3:4 portrait
    group.style.gridTemplateColumns = `minmax(0, ${share.toFixed(3)}fr) minmax(0, 1fr)`;
  }

  // A project can also have a second group of pictures, spread out under the
  // description (.pmedia-below — see splitBelow above). It already fills the
  // text column's width from the CSS grid, so it just needs its shapes set,
  // always in one plain row (no "widest on top").
  function layoutMedia(panel) {
    if (!panel) return;
    const belowMosaic = panel.querySelector('.pmedia-below .pshots.mosaic');
    if (belowMosaic) fitShots(belowMosaic, false);
    panel.querySelectorAll('.pwide .pshots.mosaic, .pwide .pshots.scatter').forEach((g) => fitShots(g, false));
    const box = panel.querySelector('.pmedia:not(.pmedia-below):not(.pwide)');
    if (!box) return;
    const split = panel.querySelector('.panel-body.split') && !panel.dataset.cols &&
                  window.matchMedia('(min-width: 721px)').matches;
    if (split) sizeSplitMedia(box);
    else sizeMediaBox(box);
  }

  // The .split layout on wider screens (see portfolio.css): the top picture
  // sits at the right edge, as tall as the height limit allows, and the other
  // pictures fill the rest of the width beside it, bottoms lined up. It gets
  // smaller on narrower screens so the text column keeps at least this much:
  const SPLIT_MIN_TEXT = 340;
  function sizeSplitMedia(box) {
    const body = box.parentElement, cs = getComputedStyle(body);
    const inner = body.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const gap = parseFloat(cs.columnGap);
    const m = box.querySelector('img, video');
    const ar = (m.naturalWidth || m.videoWidth) / (m.naturalHeight || m.videoHeight) || 4 / 3;  // until it loads
    const limit = mediaLimit(box);
    const height = Math.min(limit, (inner - gap - SPLIT_MIN_TEXT) / ar);
    box.style.width = Math.floor(height * ar) + 'px';
  }

  // The viewport follows the panels: scroll smoothly so the stretch from
  // top to bottom (page positions) is on screen, below the sticky header.
  // If it's too tall to fit, the bottom part wins: scroll down until its
  // bottom is on screen, but never past keepTop (for a panel: its own top,
  // so the tile scrolls away before the panel's title does). Nothing moves
  // if it's already in view.
  const FOLLOW_MARGIN = 16;                            // breathing room above and below, in px
  const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY;
  const pageBottom = (el) => el.getBoundingClientRect().bottom + window.scrollY;

  function reveal(top, bottom, keepTop = top) {
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--headH')) || 0;
    const viewTop = window.scrollY + head + FOLLOW_MARGIN;
    const viewBottom = window.scrollY + window.innerHeight - FOLLOW_MARGIN;
    const toBottom = bottom - window.innerHeight + FOLLOW_MARGIN;   // bottom just on screen
    const toTop = (y) => y - head - FOLLOW_MARGIN;                   // y just under the header
    let target = null;
    if (bottom - top > viewBottom - viewTop) target = Math.min(toBottom, toTop(keepTop));
    else if (top < viewTop) target = toTop(top);
    else if (bottom > viewBottom) target = toBottom;
    if (target === null) return;
    window.scrollTo({ top: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  // after a panel closes: bring its tile back into view if it's scrolled away
  function followTile(tile) {
    if (tile) reveal(pageTop(tile), pageBottom(tile));
  }

  /* ---------------------------------------------------------------------------
     3b. A grid of tiles with unfolding panels
     makeGrid(element, list, onRender) runs one grid: the "Look inside" tiles
     under the book, the examples under the basemap styles, and "Other work".
     list() returns the projects to show; onRender runs after each render.
     Only one panel is open on the whole page: opening one closes the others.
     ------------------------------------------------------------------------- */
  const grids = [];

  function makeGrid(gridEl, list, onRender) {
    let openSlug = null;          // slug of the project whose panel is open, if any

    function render() {
      const visible = list();
      if (openSlug) dim(false);                          // re-rendering closes any open panel
      openSlug = null;
      gridEl.querySelectorAll('.panel').forEach((panel) => Basemaps.stop(panel));
      gridEl.innerHTML = visible.map(tileHTML).join('');
      watchVideos();
      if (onRender) onRender(visible);
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
      const start = Math.min(columnOf(gridEl.querySelector(`.gcard[data-slug="${slug}"]`), tracks, gap),
                             cols - span);                                  // keep it on the grid
      const left = tracks.slice(0, start).reduce((sum, w) => sum + w + gap, 0);
      const width = tracks.slice(start, start + span).reduce((sum, w) => sum + w, 0) + gap * (span - 1);
      body.style.marginLeft = left + 'px';
      body.style.width = width + 'px';
      panel.dataset.cols = span;                         // see [data-cols] in portfolio.css
    }

    // Which grid column a tile starts in (0 = the first), from where it sits
    function columnOf(tile, tracks, gap) {
      const x = tile.getBoundingClientRect().left - gridEl.getBoundingClientRect().left;
      let edge = 0;
      for (let i = 0; i < tracks.length; i++) {
        if (x < edge + tracks[i] / 2) return i;
        edge += tracks[i] + gap;
      }
      return tracks.length - 1;
    }

    // The band of rows a tile sits in: its own row, plus any row a large tile
    // beside it also spans (a large tile is two rows tall). The panel goes
    // under the whole band, so nothing beside a large tile is split off.
    function bandOf(tile) {
      const tiles = [...gridEl.querySelectorAll('.gcard')];
      const rect = (t) => t.getBoundingClientRect();
      let { top, bottom } = rect(tile);
      let band = [], grew = true;
      while (grew) {
        grew = false;
        band = tiles.filter((t) => rect(t).top < bottom - 1 && rect(t).bottom > top + 1);   // overlaps the band
        band.forEach((t) => {
          const r = rect(t);
          if (r.top < top - 1) { top = r.top; grew = true; }
          if (r.bottom > bottom + 1) { bottom = r.bottom; grew = true; }
        });
      }
      return { band, bottom };
    }

    // How far to pull the panel up: from the bottom of the lowest picture above
    // it to the bottom of its band (the titles and tags it hides, and any
    // taller captions beside them). Sets --pull, used in portfolio.css. The
    // clicked tile, and any tile whose title the panel reaches up over, get
    // .hush, which fades their title and tags out rather than half-covering them.
    const unhush = () => gridEl.querySelectorAll('.gcard.hush').forEach((t) => t.classList.remove('hush'));

    function pullPanel(panel, tile) {
      unhush();
      // measure the tiles where they sit, not tilted and lifted by the hover
      // the click came from (.measuring in portfolio.css)
      gridEl.classList.add('measuring');
      const { band, bottom } = bandOf(tile);
      const body = panel.querySelector('.panel-body').getBoundingClientRect();
      const above = band.filter((t) => {                                     // the tiles over the panel
        const r = t.getBoundingClientRect();
        return r.right > body.left + 1 && r.left < body.right - 1;
      });
      const frameBottom = Math.max(...above.map((t) => t.querySelector('.gframe').getBoundingClientRect().bottom));
      panel.style.setProperty('--pull', Math.max(0, Math.round(bottom - frameBottom)) + 'px');
      // the panel's top edge sits on the bottom of the pictures above it: its
      // drawn top line falls on their drawn bottom line, so the two read as
      // one (each is a 3px stroke just inside a clear 1px border: css/ink.css)
      const gap = -5;
      panel.style.setProperty('--panel-gap', gap + 'px');
      const panelTop = frameBottom + gap;
      above.forEach((t) => {
        if (t === tile || t.querySelector('.tags').getBoundingClientRect().bottom > panelTop) t.classList.add('hush');
      });
      gridEl.classList.remove('measuring');
    }

    // The last tile in the band of rows the tile with this slug is in
    function rowEnd(slug) {
      const tile = gridEl.querySelector(`.gcard[data-slug="${slug}"]`);
      if (!tile) return null;
      const { band } = bandOf(tile);
      return band[band.length - 1];
    }

    // The open panel. A panel that's still animating closed can sit in the
    // grid for a moment alongside the new one, so skip any marked .closing.
    const currentPanel = () => gridEl.querySelector('.panel:not(.closing)');

    function closePanel() {
      if (!openSlug) return;
      const panel = currentPanel();
      const tile = gridEl.querySelector(`.gcard[data-slug="${openSlug}"]`);
      if (tile) tile.setAttribute('aria-expanded', 'false');
      openSlug = null;
      dim(false);
      unhush();
      if (!panel) return;
      panel.classList.add('closing');                    // so currentPanel() skips it from now on
      panel.dataset.open = 'false';                      // starts the closing animation
      const remove = () => { Basemaps.stop(panel); panel.remove(); };
      if (prefersReducedMotion()) remove();
      else { panel.addEventListener('transitionend', remove, { once: true }); setTimeout(remove, 430); }
    }

    // A panel scrolled right out of view closes itself. It's only watched
    // once it has been on screen (it may start off screen while the page
    // scrolls to it). Closing one that's above the screen takes it out at once
    // and scrolls by the same amount, so what's in front of the reader doesn't
    // jump; one below the screen just folds away out of sight.
    let panelWatch = null;

    function watchPanel(panel) {
      if (panelWatch) panelWatch.disconnect();
      if (!('IntersectionObserver' in window)) return;
      const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--headH')) || 0;
      let seen = false;
      panelWatch = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { seen = true; return; }
        if (!seen || panel !== currentPanel()) return;
        panelWatch.disconnect();
        if (panel.getBoundingClientRect().bottom > head) { closePanel(); return; }   // below the screen
        const next = panel.nextElementSibling;             // the first tile after it
        const before = next ? next.getBoundingClientRect().top : 0;
        closePanel();
        panel.remove();
        const after = next ? next.getBoundingClientRect().top : 0;
        window.scrollBy({ top: after - before, behavior: 'instant' });
      }, { rootMargin: `-${Math.round(head)}px 0px 0px 0px` });   // under the sticky header counts as out of view
      panelWatch.observe(panel);
    }

    function openPanel(slug) {
      const wasOpen = openSlug;
      grids.forEach((g) => g.closePanel());              // one panel open on the page at a time
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
      pullPanel(panel, tile);
      watchVideos();                                     // so any loops in the panel play too
      watchPanel(panel);
      if (project.basemaps) Basemaps.start(panel, project);
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
      const follow = () => { if (openSlug === slug) {
        const body = panel.querySelector('.panel-body');
        reveal(pageTop(tile), pageBottom(body), pageTop(body));
      } };
      const closingAbove = [...document.querySelectorAll('.grid > .panel.closing')]
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

      // next frame: flip data-open so the CSS transition runs, and dim the rest
      requestAnimationFrame(() => { panel.dataset.open = 'true'; dim(true); });
    }



    // If the window is resized, move the open panel to its row's new end and re-fit it
    function onResize() {
      if (!openSlug) return;
      const panel = currentPanel();
      const end = rowEnd(openSlug);
      if (panel && end && end.nextElementSibling !== panel) end.after(panel);
      if (panel) sizePanel(panel, openSlug);
      if (panel) pullPanel(panel, gridEl.querySelector(`.gcard[data-slug="${openSlug}"]`));
      layoutMedia(panel);
    }

    const grid = { el: gridEl, render, openPanel, closePanel, onResize,
                   get openSlug() { return openSlug; } };
    grids.push(grid);
    return grid;
  }

  /* ---------------------------------------------------------------------------
     3c. Feature blocks
     An element with data-feature="slug" in index.html gets that project's
     panel, always open. A live map (basemaps:) or a specimen iframe only
     loads once the block comes near the screen.
     ------------------------------------------------------------------------- */
  function renderFeatures() {
    const near = ('IntersectionObserver' in window)
      ? new IntersectionObserver((entries) => entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          near.unobserve(entry.target);
          entry.target.wake();
        }), { rootMargin: '400px 0px' })
      : null;
    document.querySelectorAll('[data-feature]').forEach((el) => {
      const project = bySlug(el.dataset.feature);
      if (!project) return;
      el.innerHTML = panelHTML(project, { feature: true });
      el.setAttribute('aria-labelledby', `f-${project.slug}`);
      const panel = el.firstElementChild;
      panel.querySelectorAll('.pmedia img, .pmedia video').forEach((m) =>
        m.addEventListener(m.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', () => layoutMedia(panel), { once: true }));
      layoutMedia(panel);
      el.wake = () => {
        if (project.basemaps) Basemaps.start(panel, project);
        panel.querySelectorAll('iframe[data-src]').forEach((f) => { f.src = f.dataset.src; });
      };
      if (near) near.observe(el); else el.wake();
    });
  }


  /* ---------------------------------------------------------------------------
     4. Video tiles
        - Each video sits over its still image, invisible until it starts
          playing; then it fades in (.ready in portfolio.css).
        - Videos play only while on screen. On phones (640px wide or less),
          only one plays at a time: the one most in view, once at least 60%
          of it shows. On bigger screens, any tile at least a quarter on
          screen plays.
        - Nothing plays for visitors who prefer reduced motion, or whose
          phone or browser is set to save data: they see the still image.
     ------------------------------------------------------------------------- */
  const PHONE = window.matchMedia('(max-width: 640px)');
  const savingData = () =>
    (navigator.connection && navigator.connection.saveData) ||
    window.matchMedia('(prefers-reduced-data: reduce)').matches;
  const stayStill = () => prefersReducedMotion() || savingData();

  const onScreen = new Map();                     // video -> how much of it shows (0–1)
  function updatePlayback() {
    const visible = [...onScreen].filter(([, ratio]) => ratio > 0);
    let playing;
    if (stayStill()) playing = [];
    else if (PHONE.matches) {
      const best = visible.sort((a, b) => b[1] - a[1])[0];
      playing = best && best[1] >= 0.6 ? [best[0]] : [];
    } else playing = visible.filter(([, ratio]) => ratio >= 0.25).map(([video]) => video);
    onScreen.forEach((ratio, video) => {
      if (playing.includes(video)) video.play().catch(() => {});   // a blocked autoplay just leaves the poster
      else if (!video.paused) video.pause();
    });
  }
  const videoWatcher = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => onScreen.set(entry.target, entry.intersectionRatio));
        updatePlayback();
      }, { threshold: [0, 0.25, 0.4, 0.6, 0.8, 1] })
    : null;

  function watchVideos() {
    if (!videoWatcher) return;                    // very old browsers: just the still images
    videoWatcher.disconnect(); onScreen.clear();
    document.querySelectorAll('main video').forEach((v) => {
      videoWatcher.observe(v);
      // show it once it's really playing; until then the still shows through
      if (!v.classList.contains('ready')) v.addEventListener('playing', () => v.classList.add('ready'), { once: true });
    });
  }
  PHONE.addEventListener('change', updatePlayback);   // e.g. a tablet turned sideways

  // Browsers won't start video in a background tab. If the page was opened
  // in one, re-check the on-screen videos when the tab comes to the front.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') watchVideos();
  });


  /* ---------------------------------------------------------------------------
     4b. Picture viewer (phones)
        On a phone, tapping a picture in a panel opens it full screen
        rather than in a new tab; on wider screens pictures still open in a
        new tab. The viewer itself (tap to zoom, pinch, Close/Escape/Back,
        focus back on the picture) is js/viewer.js, with its look in
        css/viewer.css; this just points it at the panels' pictures.
     ------------------------------------------------------------------------- */
  Viewer.watch('.panel .pmedia a[href]');            // (feature blocks are .panel too)


  /* ---------------------------------------------------------------------------
     Clicks and keys (one listener each, for tiles and panels)
     ------------------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      const grid = grids.find((g) => g.el.contains(closeBtn));
      if (grid) closeAndReturn(grid);
      return;
    }
    const tile = e.target.closest('.gcard');
    const grid = tile && grids.find((g) => g.el.contains(tile));
    if (grid) grid.openPanel(tile.dataset.slug);
  });

  // Close a grid's open panel and put focus back on its tile
  function closeAndReturn(grid) {
    const tile = grid.el.querySelector(`.gcard[data-slug="${grid.openSlug}"]`);
    grid.closePanel();
    if (tile) { tile.focus({ preventScroll: true }); followTile(tile); }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (Viewer.isOpen()) { Viewer.close(); return; }   // the viewer first (it goes Back)
    const grid = grids.find((g) => g.openSlug);         // Escape closes the open panel
    if (grid) closeAndReturn(grid);
  });

  window.addEventListener('resize', () => {
    grids.forEach((g) => g.onResize());
    document.querySelectorAll('.panel.feature').forEach(layoutMedia);
  });


  /* ---------------------------------------------------------------------------
     5. Selected tags in the address bar
     ------------------------------------------------------------------------- */
  function writeURL() {
    const params = new URLSearchParams(location.search);
    if (selected.size) params.set('tags', [...selected].join(','));
    else params.delete('tags');
    const query = params.toString();
    try { history.replaceState(null, '', query ? `?${query}` : location.pathname); } catch (e) { /* ignore */ }
  }

  function readURL() {
    const known = new Set([...pillsEl.querySelectorAll('.pill')].map((p) => p.dataset.tag));   // tags with a pill
    (new URLSearchParams(location.search).get('tags') || '')
      .split(',')
      .filter((id) => known.has(id))                   // ignore misspelled or retired tags
      .slice(0, 1)                                     // one tag at a time (an old link may list several)
      .forEach((id) => selected.add(id));
    pillsEl.querySelectorAll('.pill').forEach((p) =>
      p.setAttribute('aria-pressed', String(selected.has(p.dataset.tag))));
  }


  /* ---------------------------------------------------------------------------
     Go
     ------------------------------------------------------------------------- */
  readURL();
  const mainGrid = makeGrid(mainEl, () => PROJECTS.filter(matches), (visible) => {
    emptyEl.hidden = visible.length > 0;
    clearBtn.hidden = selected.size === 0;
    writeURL();
  });
  // the small grids above "Other work": their projects in the order listed
  document.querySelectorAll('[data-grid]').forEach((el) =>
    makeGrid(el, () => (SECTION_LISTS[el.dataset.grid] || []).map(bySlug).filter(Boolean)));
  renderFeatures();
  grids.forEach((g) => g.render());


  /* ---------------------------------------------------------------------------
     Section dots (nav.dots in index.html): the section you're in is the last
     one whose top has passed 40% of the way down the screen; at the very
     bottom of the page it's the last section.
     ------------------------------------------------------------------------- */
  const dotLinks = [...document.querySelectorAll('.dots a')];
  const dotTargets = dotLinks.map((a) => document.querySelector(a.getAttribute('href')));
  let dotsQueued = false;
  function markDot() {
    dotsQueued = false;
    const line = window.innerHeight * 0.4;
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let current = -1;
    dotTargets.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= line) current = i; });
    if (atEnd) current = dotTargets.length - 1;
    dotLinks.forEach((a, i) => {
      if (i === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  const queueDot = () => { if (!dotsQueued) { dotsQueued = true; requestAnimationFrame(markDot); } };
  if (dotLinks.length) {
    window.addEventListener('scroll', queueDot, { passive: true });
    window.addEventListener('resize', queueDot);
    markDot();
  }
})();
