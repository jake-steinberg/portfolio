# Final build spec: `/cartography`, an unlisted map-design page (branch `maps-portfolio`)

Everything below was checked against the repo at commit `627b4a1` (2026-10-09) on 2026-10-28. Claims in the copy cite the file or key they come from. Anything not in the repo is either a `[[PLACEHOLDER]]` (there are only two) or a **gate**: a block that stays hidden until Jake answers the question that unlocks it.

---

## 0. Corrections found while re-checking (they override the proposals)

| Item | What the files say | Effect on the page |
|---|---|---|
| URL `/maps` | `maps/` is a real folder. `tools/serve.py` would serve its directory listing, and GitHub Pages redirects `/maps` to `/maps/` | Use **`cartography.html` → `/cartography`** |
| Address labels at z18 | `address_label` is `visibility: none` in **all five** styles | Never mention it |
| Contours "from z10" | `contours_50m` layer has minzoom 10, but its *source* minzoom is 11 | Say "both contour sets draw from zoom 11" |
| Elex road casings | Metadata says `#E1E1E1`; every visible Elex casing layer is `#DADADA` | Collision card is gated (Q5) |
| Elex buildings | `buildings_osm` is `visibility: none` in Elex; metadata says "only exist z13-14" | Collision card is gated (Q5) |
| Elex base | Background `#ffffff`; contract says `#f7f7f7` | Copy says "meant to resolve to one flat neutral"; card gated |
| "Keeps flagging both" | Supported verbatim: `collisionTestLimitation` says the script "will keep reporting both entries above" | OK to quote |
| Hue-vs-achromatic rationale | Verbatim in `acceptedColorCollisions[0].whyAccepted` | OK to quote (only after the gate opens) |
| Bemidji | Not among the 27 `mn_hubs` | Never name it. Hubs list: Moorhead … Baudette |
| Vonn sites | Lake Louise, Whistler, Buck Hill are in North America; Åre, Cortina, Schladming are in Europe | "two continents" |
| Dakota switch | Visible only in Dark `water_waterway_label`, `pois_parks`, `water_label_lakes` | Say "water, lake and park labels" |
| Outdoors town labels | `places_locality` visible z0–13 only; protomaps source minzoom 5 | Quote sizes at z6 and z10 only |
| Elex label thresholds | Not monotonic (≥1,000 at z6–7, then ≥2,500 at z8) | List the values; don't say "lowers" |
| 22, A Map symbols | `22map.html` line 127: converted with Illustrator **Image Trace** | Not "hand-traced" |
| Cart Lab | resume.html: "eight student **employees**" | Use that wording |
| SSIM 0.965 | A metric threshold | Not "visually identical" |
| PMTiles access | A CLI ranged GET with an `Origin` header returned **HTTP 403** from CloudFront, which also sends `access-control-allow-origin: *`. Possibly gated by referrer or WAF; the browser case is unverified | The hero must fully work without tiles (see §3) |
| `.stylename` | `css/site.css` §8 applies `filter: url(#rough-sm)`. The new page has no SVG filter defs | Set `filter: none` in page CSS, or the style name may not render. site.css applies it through `:is()` (specificity 0-1-1), so the override must be `.styleinfo .stylename` |
| Elex hub labels from z5 | `places_hubs` has minzoom 5, but its text-size is 0 below z6 for places under 40,000, and the largest hub is 34,749 | Hubs show from **zoom 6**; `places_locality` also labels towns of 1,000+ from z6, so the two draw together until the hubs fade (7.6–8) |
| "Thirteen label layers are clipped" | 13 layers carry a `within` filter, but 2 are hidden (`pois_airport`, `earth_label_islands`); Elex has 12 visible label layers | Say "Eleven of its 12 visible label layers" (F6 shows the 12) |
| "The styles ask for tiles up to zoom 14" | Strib Light also draws `landuse_forest` from `uptown-landuse` (maxzoom 17) | Scope it to "the shared Minnesota tiles" |
| Spelling | The rest of the site uses US spelling (color, gray, neighbor, honor) | US spelling in all page copy (review, 2026-10-28) |
| Bell Topo numerals | Bell Topo's 1 is a plain stroke, identical to its l and I | Hex values, commit hashes and figure numbers in Source Serif 4 |

---

## 1. Page identity

- **File:** `/Users/steinja/portfolio/cartography.html` → served at `/cartography` by both GitHub Pages and `tools/serve.py`.
- **`<title>`:** `Jake Steinberg — Cartographic design`
- **Head:**
  - `<meta charset="utf-8">`, viewport meta
  - `<meta name="robots" content="noindex, nofollow">`
  - `<meta name="description" content="Map styles, terrain and tools by cartographer Jake Steinberg.">`
  - `og:title` same as the title; `og:image` → `img/og-card.jpg`; no canonical; no JSON-LD
  - The same two font `<link rel="preload">` lines as `index.html` lines 118–119, plus Outfit if index preloads it
- **Not linked anywhere.** Do not add it to: the nav in index/resume/contact, `sitemap.xml`, `llms.txt`, `js/projects.js` (so `tools/build-project-list.mjs` never sees it), or `robots.txt` (a Disallow line would advertise it and hide the noindex).
- **No Apple names, logos, product terms or SF fonts** anywhere: copy, alt text, meta, comments, file names.
- **Git:** commit on `maps-portfolio` only. Never push or merge to `main` without Jake's go-ahead (memory rule: main publishes the live site). Tell Jake that noindex is not privacy: once merged, anyone with the URL, or anyone reading the public repo, can find it.

---

## 2. Files

### New files

| File | Purpose |
|---|---|
| `cartography.html` | The page. Static HTML; figure SVGs are injected between marker comments by the figure script |
| `css/cartography.css` | Page layout, dark band, figure plates, phone rules, overrides (see §5) |
| `js/cartography.js` | Hero map bootstrap, poster→map handoff, tap-to-load on phones, video-on-screen playback, optional 3D toggle (gated), viewer hookup |
| `js/viewer.js` + `css/viewer.css` | Phone picture viewer, extracted from `js/portfolio.js` §4b (lines 777–848) and `css/portfolio.css` lines 734–774 |
| `tools/make-map-figures.py` | Reads `maps/strib-*.json` and `img/tiles/strib-basemaps.mp4`; writes figures (see §6) |
| `tools/make-page-images.py` | Pillow: WebP derivatives of large originals into `img/cartography/` (see §7) |
| `img/map-figures/`, `img/cartography/` | Generated outputs (committed) |

### Changed files (minimal)

- **`js/basemaps.js`: one line only.** Directly after `panel.basemap = new maplibregl.Map({...})`, add:
  ```js
  panel.dispatchEvent(new CustomEvent('basemap:map', { detail: panel.basemap }));
  ```
  Nothing on index.html listens for it, so the main site is unchanged.
- **`js/portfolio.js`:** replace §4b with calls into `js/viewer.js`:
  - `Viewer.watch('.panel .pmedia a[href]')`
  - In the Escape handler (line ~867), `if (Viewer.isOpen()) { Viewer.close(); return; }`
  - Keep `VIEWER_SCREENS = matchMedia('(max-width: 720px)')`, `IS_PICTURE`, the pushState/Back behaviour and focus return **exactly** as they are.
- **`index.html`:** load `css/viewer.css` and `js/viewer.js` before `js/portfolio.js`. Remove the moved `.viewer` rules from `css/portfolio.css`.
- **`README.md`:** document the two new tools next to the others (what they read, what they write, when to rerun).

### Do not touch

- `maps/*.json` (until Jake answers Q5)
- `sitemap.xml`, `llms.txt`, `robots.txt`
- `tools/build-project-list.mjs`
- `css/site.css` tokens

### Reuse as-is

- `js/projects.js`. The page reads `PROJECTS.find(p => p.slug === …)` at runtime for titles, years, descriptions, story links and the `basemaps` block, so copy stays in sync with the main site.
- `js/basemaps.js`, including `start`/`stop`, the stale-load token, the Minnesota zoom-out control and `cooperativeGestures`.
- Existing tiles and videos in `img/tiles/`, plus the originals in `img/`.

### Scripts on the page (all `defer`, in this order)

1. `js/projects.js`
2. `js/basemaps.js`
3. `js/viewer.js`
4. `js/cartography.js`

Do **not** load `js/portfolio.js`, `js/site.js`, `css/portfolio.css`, `css/paper.css`, `css/ink.css` or `css/strokes.css`. Stylesheets: `css/site.css`, `css/viewer.css`, `css/cartography.css`.

---

## 3. Section order

| # | id | Name | Background |
|---|---|---|---|
| — | — | Slim top bar | `--plate` |
| 0 | `#top` | Hero: the live map | `--plate` |
| 1 | `#styles` | One schema, five jobs | `--plate` |
| 2 | `#terrain` | The world in relief (+ elevation as data) | **`--ink` dark band**, then `--plate` sub-strip |
| 3 | `#zoom` | Designing for every zoom | `--plate` |
| 4 | `#elex` | A base for election data | `--plate` |
| 5 | `#tools` | Tools, and working with an agent | `--plate` |
| 6 | `#explore` | Exploration: buildings in 3D (**gated, Q2**; omitted entirely if not built) | `--plate` |
| 7 | `#about` | About + contact | `--plate` |

There is no "where my work stops" table: the judges read it as a list of deficits. Gaps are handled by omission, gates and the questions list.

---

## 4. Sections in detail

### Top bar (all widths)

- **Left:** "Jake Steinberg", Outfit 700, `--fs-xl`, `--head`, linking to `/`.
- **Right:** text links in Bell Topo caps (`--fs-sm` + `--label-plus`, `--label-ink`, `--track`): `Résumé` → `/resume`, `Email` → `mailto:jakesteinberg96@gmail.com`.
- Not sticky. 1px `--rule` underneath. On phones it is the same, at 16px gutters.

### 0. Hero: the live map

**Projects:** `strib-basemaps`

**Desktop (≥ 900px)**

- Grid 5/7 inside a 1200px max frame.
- Left column, top-aligned: eyebrow, H1, lede, jump pills.
- Right column:
  - `.styleswitch` with five `button.pill[data-style=i]`, in order Light · Dark · Outdoors · Elex · Paisley (from `basemaps.styles`).
  - `.basemap-wrap` at 4:3, holding:
    - the poster layer: `<video>` of `img/tiles/strib-basemaps.mp4` with poster `img/tiles/strib-basemaps.webp` (muted, loop, playsinline, autoplay unless reduced motion)
    - `.basemap`
    - `p.basemap-note[hidden]`
  - Then `.styleinfo`.
  - Caption below the map, Bell Topo `--fs-xs`.

**Desktop interaction**

- When the hero is ≥ 50% visible, start the map on `requestIdleCallback` (2s timeout) with `Basemaps.start(heroEl, project)`.
- On `basemap:map`, attach `map.once('idle', …)`, then fade the poster video out (300ms; instant under reduced motion) and pause it.
- **Failure:** if `idle` hasn't fired within 10s, or the map emits an `error` whose message mentions the pmtiles source:
  - keep the video
  - call `map.remove()` via `Basemaps.stop(heroEl)`
  - set `.basemap-note` to the fallback text (below) and leave it visible as a caption strip *under* the video (override `.basemap-note`'s `inset: 0` for this state)
- **Missing sprite images:** on `basemap:map`, register `map.on('styleimagemissing', e => map.addImage(e.id, {width:1,height:1,data:new Uint8Array(4)}))`. This silences console warnings for `townspot` and `prince-wetland-dots` without drawing substitutes. Do not invent symbols.
- `pagehide` → `Basemaps.stop(heroEl)`.

**Phone (≤ 720px)**

- Single column, 16px gutters, in this order: eyebrow, H1 (clamp min 32px), short lede.
- Then the poster video at full gutter width, 5:4, with a pill `Open the live map` at its bottom-left.
- **Tap:** swap in `.basemap` at 5:4, show the `.styleswitch` (wraps to two rows) above it and `.styleinfo` below, and call `Basemaps.start`.
- **Never auto-start on phones.** Under `navigator.connection?.saveData`, also don't autoplay the video; show the poster.
- The jump pills come after the map block. No horizontal scroll.

**Copy (final)**

- **Eyebrow** (Bell Topo caps, `--label-accent`, `--track-wide`): `JAKE STEINBERG · CARTOGRAPHER`
- **H1** (Outfit 700, `--fs-h1`, `--head`, no filter): `One map, drawn five ways`
- **Lede** (Source Serif 4, `--fs-lg`/1.6, max 40ch on desktop): "Five basemap styles I designed for the Minnesota Star Tribune, running here on the same vector tiles of Minnesota. Switch styles, then zoom from the whole state down to a single street."
  - Sources: `js/projects.js` 286–287 ("Designed a full suite of MapLibre basemap styles…"), 291 (pmtiles), 296 (bounds), 327 ("I designed this one-off…")
- **Phone lede:** "Five basemap styles I designed for the Minnesota Star Tribune, live on one set of vector tiles of Minnesota."
- **Jump pills** (anchor links styled `.pill`): `Five styles` · `3D terrain` · `Every zoom` · `Election base` · `Tools`
- **Map caption:** `LIVE · MAPLIBRE GL 5.24 · PROTOMAPS VECTOR TILES · CTRL/⌘ + SCROLL OR TWO FINGERS TO ZOOM` (js/basemaps.js 15–19, 120)
- **Fallback note:** "The live map couldn't load here, so this loop shows all five styles instead."
- **`.styleinfo`:** written by `basemaps.js` from `projects.js` (title, `about` verbatim, "In the wild" links). Keep it as-is.
  - Known issue: Outdoors' `about` says "seasonal variations", and only one Outdoors file exists. Leave it, because it's Jake's text in projects.js. Q7 asks him.

**Listing fit:** digital interactive map products; different map styles; multiple zoom levels; real data and code; vector formats.

### 1. One schema, five jobs (`#styles`)

**Projects:** `strib-basemaps`, `where-is-uptown` (as proof only)

**Layout**

- **Desktop:** H2 and intro at 63ch, then:
  - **F1** five-up strip (5 equal columns, 1200px wide)
  - two short paragraphs
  - **F2** palette sheet (full 1200px)
  - "In the wild": 10 links grouped by style in 5 small columns
  - Uptown proof card (video left, caption right)
- **Phone:**
  - F1 becomes a scroll-snap carousel *inside its own box* (`overflow-x: auto` on the figure only), each frame 80vw, with the style name below.
  - F2 becomes 5 stacked rows (one per style) of swatches that wrap.
  - Links are a single column.
  - Uptown video, then caption.

**Media**

- F1: `img/map-figures/five-up-{light,dark,outdoors,elex,paisley}.webp` (generated; see §6).
- Uptown: `img/tiles/where-is-uptown.mp4`, poster `img/tiles/where-is-uptown.webp`. Plays only while on screen; `preload="none"`.

**Copy (final)**

- **Kicker:** `STAR TRIBUNE BASEMAP STYLES · 2025–2026`
- **H2:** `One schema, five jobs`
- **Intro:** "A newsroom basemap sits under stories that want opposite things. A hiking guide wants contours and trail names. A precinct map wants the land to get out of the way. All five Star Tribune styles read the same data schema (Protomaps roads, water, land use, places, buildings and boundaries) from the same Minnesota tile archive. Each one runs to 121–125 layers, and between 40 and 80 of them draw. The rest are switched off because that style's job doesn't need them."
  - Sources: `maps/strib-*.json` layers[] (totals 121/121/125/123/122; visible 47/60/80/60/40), sources.protomaps
- **F1 caption:** "The same Twin Cities view in Light, Dark, Outdoors, Elex and Paisley, labels hidden. Frames from the loop that plays on the Star Tribune basemap styles tile in the main portfolio."
- **Paragraph:** "Color follows the job. Outdoors sits on warm paper (#fffbf4) with pale blue water (#c0efff), and adds 10 m and 50 m contours from their own tile archives, dashed green trails and peaks. Dark drops to slate (#313740) with deep navy water (#0f1e35). Elex takes the color out of the land entirely: white ground, gray water (#949494) and every land-cover fill switched off, so the data on top owns the hue. Paisley, a one-off for the 10th anniversary of Prince's passing, puts lavender land (#C8B9DF) and purple water (#5a4979) under yellow roads (#FFF2A3)."
  - Sources: visible-layer paint in each style JSON; projects.js 327
- **F2 caption:** "Each style's colors, read from its visible layers. An empty cell means that role is switched off in that style."
- **"In the wild"** (Bell Topo caps heading): the 10 links from `projects.js` 301–330, grouped under `Strib Light / Dark / Outdoors / Elex / Paisley`, labels verbatim, `↗` arrow, `target="_blank" rel="noopener"`.
- **Uptown caption:** "Where is Uptown? (2025) asked readers to draw their own boundaries for the Minneapolis neighborhood. The call-out is one of the stories that ran on Strib Light. It won three SND Awards of Excellence in 2026: Infographics; Line of Coverage; and Use of Multimedia and Design Elements."
  - Sources: projects.js 304 (link under Light), 544–574; resume.html 317–321
  - Do not state a response count.

**Listing fit:** cohesive graphic systems, different map styles, colour and typography, vector data.

### 2. The world in relief (`#terrain`)

**Projects (dark band):** `lindsey-vonns-mountains`, `rincon-mountains`, `cloud-peak-wilderness`
**Projects (sub-strip):** `restless-river`, `cathedral`, `the-driftless-area`

**Layout: dark band** (background `--ink`, text `--plate`, captions `--rule-soft`)

- **(2a)** Cortina full-bleed: `<img>` with srcset `img/cartography/vonn-cortina-{1200,1600,2000}.webp`. It is capped at 2000px wide, centred, with dark margins above that; never upscaled.
- **(2b)** Text block (63ch).
- **(2c)** 3×2 contact sheet, `img/tiles/vonn-*.webp` (1200×800), in order Cortina, Lake Louise, Whistler, Åre, Schladming, Buck Hill. Buck Hill is last and never enlarged in the layout.
  - Each links to `img/vonn-*.jpg`: desktop opens it in a new tab; phone opens the viewer.
  - Caption under each: the place name in Bell Topo caps.
  - Phone: 2 columns × 3 rows.
- **(2d)** Rincon at full container width (max 1440px): srcset `img/cartography/rincon-{1600,2000}.webp`, linking to `img/cartography/rincon-2400.webp` (the original is over 5 MB).
- **(2e)** Cloud Peak at 1600w (`img/cartography/cloud-peak-1600.webp`, linking to `img/cloud-peak-wilderness.jpg`) with a 1:1 detail crop beside it on desktop (`cloud-peak-detail.webp`, 3:2). Stacked on phones.

**Layout: light sub-strip "Elevation as data, seen from above"**

- Back to `--plate`. Three cards in a row on desktop, stacked on phones:
  - Restless River: `img/tiles/restless-river-loop.mp4`, poster `img/tiles/restless-river-tile.webp`; link to `img/cartography/restless-river-2400.webp`
  - Cathedral: `img/tiles/cathedral.webp`; link to `img/cartography/cathedral-2400.webp`
  - Driftless: `img/tiles/the-driftless-area-scroll.mp4`, poster `-scroll.webp`; link to `img/cartography/driftless-3000.webp`
- **Never link** the 52.9 MB `img/driftless-website.jpg` or the 32 MB `img/bighorns-website.png`.
- **No motion in the dark band.** Videos in the sub-strip play only on screen.

**Copy (final)**

- **Kicker:** `TERRAIN`
- **H2:** `The world in relief`
- **Lindsey Vonn's Mountains · Star Tribune, 2026:** "A biography of Lindsey Vonn published in the run-up to the 2026 Winter Olympics, told by the mountains that made her. Six places on two continents (Lake Louise, Whistler and Buck Hill in North America; Åre, Cortina and Schladming in Europe), drawn as oblique terrain maps that share one lettering system: peak labels on leader lines with elevations, dashed resort boundaries, and a north arrow turned to the view. [[PLACEHOLDER: one sentence on how the six were made — software, elevation and imagery sources, vertical exaggeration — and confirm you made all six]] Read the story ↗"
  - Sources: projects.js 183–194 (link 189); visible in the vonn-*.webp images
- **Rincon Mountains · personal, 2024:** "A golden hour rendering of Saguaro National Park's Rincon Mountains made to commemorate a trip with an old friend." (projects.js 347–348)
- **Cloud Peak Wilderness · personal, 2024:** "A gift given to friends I shared a great trip with: Wyoming's Bighorns in perspective, lettered peak by peak and lake by lake. As the map itself says, 'Scale varies in this perspective.'" (projects.js 972; text in img/tiles/cloud-peak-map.webp)
- **Sub-strip heading:** `ELEVATION AS DATA, SEEN FROM ABOVE`
  - **Restless River:** "RELATIVE ELEVATION · 2026 — A 2-page spread in my book that exposes the writhing and rambling of the Minnesota River, colored by elevation above river level, from the river itself to 10 ft." (projects.js 220–221; legend in restless-river.webp)
  - **Cathedral:** "VIEWSHED · 2026 — A divinely inspired GIS viewshed analysis that appears in my book: how much of the Cathedral of Saint Paul can I see from this spot?" (projects.js 241; spread text)
  - **Driftless:** "SHADED RELIEF + LAND COVER · 2023 — Stylized land cover and elevation data for a sweeping wall map of the Driftless Area, 8,571 × 11,999 pixels at full size." (projects.js 607–611; PIL size)
- **Band footnote** (`--rule-soft`, `--fs-md`): "These are still images, made for print and the web."

**Listing fit:** 3D environments of the natural world (still renders); stunning artwork; raster elevation, imagery and land cover; processing data for design.

### 3. Designing for every zoom (`#zoom`)

**Projects:** `strib-basemaps`, `22-a-map` (aside)

**Layout**

- **Desktop:**
  - Text at 63ch, then **F3** zoom ladder (full width).
  - **F4** label ramps (8/12 column) with the **Dakota card** (4/12 column) beside it.
  - 22, A Map aside: a two-column card, glyph strip on the left and text on the right.
- **Phone:**
  - F3 shows group bars only (about 10 rows). A `<details>` "All 80 layers" reveals the full ladder inside a box that scrolls vertically.
  - F4 at full width, then the Dakota card, then the aside.

**Media for the aside:** the seven glyph SVGs (`img/dude-01.svg`, `fireball-01`, `weed-01`, `twoface-01`, `fingers-01`, `turnblue-01`, `astuary-01`) as small ink-coloured WebP copies (`img/cartography/glyph-*.webp`, made by `tools/make-page-images.py`; `astuary-01` cropped to its emblem) in seven equal square cells of up to 56px, plus a link to `/22map.html`. **Do not embed the Mapbox iframe.**

**Copy (final)**

- **Kicker:** `SCALE`
- **H2:** `Designing for every zoom`
- **P1:** "The shared Minnesota tiles stop at zoom 14, and the styles keep drawing to zoom 24 by enlarging that data. Past 14, line weight and label size carry the hierarchy, not new detail. In Outdoors, the 10 m and 50 m contours both draw from zoom 11. The 50 m index lines are darker and heavier (#A7ADB4, 0.375 to 0.6 px) than the 10 m lines (#C8CCD0, 0.2 to 0.5 px). Building footprints and trails start at zoom 13."
  - Sources: sources.protomaps maxzoom 14; strib-outdoors.json contours_50m/10m, contour sources minzoom 11, buildings_osm and roads_paths minzoom 13
- **F3 caption:** "When each visible Strib Outdoors layer draws, from zoom 0 to 24, grouped by data layer. The line at 14 is where the tiles end; in the shaded zooms past it, their data is enlarged."
- **P2:** "Town names follow two different logics. Outdoors sizes them in two tiers by population rank, 11 and 17 px at zoom 6 growing to 12 and 20 px at zoom 10, and the rank that earns the larger size loosens as you zoom in. Elex is built for election maps, so it sizes names by actual population, from 2,000 to 430,000 people, with a cutoff for each zoom band: 40,000 people below zoom 6, 1,000 at zooms 6 and 7, 2,500 at 8, 1,200 at 9, 500 at 10.5, 150 at 12, and every place by 14."
  - Sources: places_locality layout.text-size in strib-outdoors.json and strib-elex.json
- **F4 caption:** "Town-label size by zoom. Outdoors: two tiers by population rank. Elex: smallest and largest town at each zoom band, by population."
- **Dakota card:**
  - Kicker: `NAMES IN THEIR OWN LETTERS`
  - Glyphs set at 40px in Source Serif 4: ́ á é í ó ú ą į č š ž ŋ ƞ ȟ
  - Text: "In Strib Dark, water, lake and park labels check each name for these Dakota characters. If any appear, the label switches from Graphik Compact to an Open Sans stack." (strib-dark.json `dakota_label` expression; visible layers water_waterway_label, pois_parks, water_label_lakes)
- **22, A Map aside:** "22, A Map (2022). For Rob Roth's Graphic Design in Cartography class, a Mapbox style that translates Bon Iver's 22, A Million into a zoomable map. 38 album symbols were converted to SVG with Illustrator's Image Trace and assigned to point-of-interest and transport categories, with Optima for place names and a dot texture for water. Because Mapbox ranks points of interest by zoom, different glyphs surface as you move in. How it was made →" (projects.js 456–478; 22map.html 49, 127, 135, 151)

**Listing fit:** multiple zoom levels; varying scales; spatial attributes (population, population_rank); typography.

### 4. A base for election data (`#elex`)

**Projects:** `strib-basemaps` (Elex)

**Layout**

- **Desktop:** text on the left (5/12), **F5** hubs map on the right (7/12).
- Below: the **F6** contract card. In **state A** (default) it shows only the anchor diagram. In **state B** (after Q5) it adds two collision rows.
- **Phone:** stacked, F5 at full width, 4:5.

**Copy (final)**

- **Kicker:** `STRIB ELEX · 2026 PRIMARIES, PRECINCT BY PRECINCT`
- **H2:** `Getting out of the data's way`
- **P1:** "Elex exists for precinct maps, where a color means a vote margin, and any color the basemap adds can be misread as data. So the style carries a written rule in its own metadata: election layers are inserted beneath the water layer, and everything below that point is meant to resolve to one flat neutral 'so a precinct's rendered color depends only on its margin.' Land cover is off, water is gray, and roads are white on pale-gray casings."
  - Sources: strib-elex.json metadata.stribElex.choroplethAnchor and anchorContract; layer paint
- **P2:** "At statewide zooms, 27 regional cities stored in the style, from Moorhead (34,749 people) to Baudette (1,106), are labeled from zoom 6 and fade out between 7.6 and 8, leaving the population-sized town labels. Eleven of its 12 visible label layers are clipped to Minnesota's outline, so neighboring states stay quiet."
  - Sources: sources.mn_hubs, places_hubs (text-size step: 0 below z6 for every hub), `within` filters on visible symbol layers
  - Note: "so neighboring states stay quiet" describes the visible effect of clipping, not stated intent. If Jake objects, cut the clause.
- **Used in:** the "2026 GOP primary" and "2026 DFL primary" links (projects.js 323–324).
- **F5 caption:** "The 27 cities Elex labels at zooms 6 to 8, sized by population, inside the Minnesota outline the style clips its labels to."
- **F6, state A:** a diagram of the layer stack: `labels` / `election layers → insert here` / `water` / `everything below: one flat neutral`.
- **F6, state B** (only after Jake confirms which colours are current; values must come from the corrected file):
  - Paragraph: "Two near-collisions stayed in on purpose, and the file says why. Road casings sit close in lightness to a gray result color, but 'separate by hue, not lightness': the result is a saturated hue, the casing strictly achromatic. Building footprints sit next to the no-winner grey and get 'a deliberate warm hue shift plus a 0.4 fill-opacity cap, so footprints read as texture rather than as a data value.' The automated check compares lightness only, so, as the note admits, it 'will keep reporting both.'"
  - Rows: swatch pairs with L* values recomputed by the figure script from the *current* hexes.
  - Never show `#E1E1E1` while the layers use `#DADADA`.

**Listing fit:** trade-offs between design goals and data constraints; spatial data and attributes; colour systems.

### 5. Tools, and working with an agent (`#tools`)

**Layout**

- **Desktop:** text at 63ch, then two figures side by side:
  - **F7** pipeline diagram
  - **F8** "trial and revert" strip
- **Phone:** stacked; F7 becomes a vertical flow.
- No code blocks, no commit-per-month chart.

**Copy (final)**

- **Kicker:** `TOOLS`
- **H2:** `Tools, and working with an agent`
- **P1:** "The charts on this page are drawn by a script that reads the five style files directly: colors from visible layers only, each layer's zoom range, the label-size expressions and the regional-city list. Rerun it after a style changes and the figures follow, so they can't drift from the maps." (tools/make-map-figures.py, new on this branch)
- **P2:** "The rest of this site runs on the same idea. A seeded generator draws every hand-drawn line from the stylesheet's color tokens, two of them borrowed from map symbology: a county-line dash and a coastal stipple. A video compressor steps down a quality ladder and keeps an encode only if it scores at least 0.965 SSIM against the current file and saves at least 10%. That cut the site's videos from 25.5 to 17.4 MB." (tools/make-strokes.py 1–44, 59–60; tools/compress-videos.py 22–23, 44; commit e20a76e)
- **P3:** "I built these tools, and the 2026 rebuild of this site, by directing Claude Code. As of Oct. 9, 2026, 321 of the repository's 373 commits carry a Claude co-author line, all made from Sept. 23 on; the 52 before, back to 2022, carry none. The history keeps the reversals too: a map border around the page added and reverted the same day, and a handwritten label font tried across the site, then removed. [[PLACEHOLDER: one or two sentences on how you run the agent work (brief, review, what you never delegate) and any AI-assisted work at the Star Tribune]]"
  - Sources: git log trailer counts; commits ce0503b → 324b847, 53bd359 → 14fe794 → bdedb1d
- **F7 content:**
  - `maps/strib-*.json` → `make-map-figures.py` → figures on this page
  - `css/site.css` tokens → `make-strokes.py` → 31 SVG strokes → `css/strokes.css`
  - tile images → `crossfade-loop.sh` / `endless-scroll.sh` → `compress-videos.py` (SSIM ≥ 0.965, ≥ 10% saving) → `img/tiles/*.mp4`
- **F8 content:** two rows of real commit subjects with dates and short hashes:
  - `ce0503b` "Map border around the page on wide screens (≥1440px)" → `324b847` "Revert the map border around the page"
  - `53bd359` "Preview: three handwritten label fonts…" → `14fe794` "All remaining labels in the handwritten font…" → `bdedb1d` "Remove the handwritten font entirely"
- **Gate (Q4):** if Jake confirms he built the `mapStyleSandbox` layer-family tool or the L* check, add a paragraph and a layer-family diagram from `metadata.mapStyleSandbox.layerFamilies`. Until then, do not mention either.

**Listing fit:** tools; agentic/AI-assisted workflows; performance trade-offs.

### 6. Exploration: buildings in 3D (`#explore`), gated by Q2

Build this **only if** Jake approves, *and* the probe below finds a height attribute, *and* tiles load in the browser. Otherwise omit the section, the toggle and the jump pill.

**Mechanics (in `js/cartography.js`, behind `const EXPLORE_3D = false`)**

- **Probe:** after `idle` at z ≥ 13 over Minneapolis, call `map.querySourceFeatures('overture-buildings', {sourceLayer: <first layer listed in the PMTiles metadata>})`.
  - Proceed only if features carry a numeric `height` (else `num_floors`, at × 3.5 m, and label it as an estimate).
  - If neither attribute is present, abort silently.
- **Toggle:** an extra pill after the style pills, `3D buildings · exploration`, `aria-pressed`. Available only on Light, Dark, Outdoors and Paisley (the styles that declare `overture-buildings`).
- **On:**
  - `addLayer` a `fill-extrusion` from `overture-buildings` (minzoom 13), inserted before the first symbol layer
  - colour from the active style's `buildings_osm` fill (Light hides that layer, so use its background `#f7f7f7` darkened 8%)
  - opacity 0.9
  - `easeTo({center: [-93.2700, 44.9778], zoom: 15, pitch: 55, bearing: -20, duration: 1500})` (0 under reduced motion)
- **Off:** remove the layer, `easeTo` pitch 0.
- **Style switches:** `setStyle` clears added layers, so re-add on `style.load` if the toggle is on.

**Copy**

- **Kicker:** `EXPLORATION · [[month]] 2026 · NOT IN PRODUCTION`
- **H2:** `Buildings, raised`
- **Text:** "Four of the styles already declare a Minneapolis buildings archive that none of their layers draws. This test extrudes it by height on the live map above. It's an experiment, not a shipped style. Show me ↑"
  - Source: sources.overture-buildings
  - The "Show me" button scrolls to the hero, switches to Dark and turns on the toggle.

### 7. About (`#about`)

**Layout:** two columns on desktop (Experience + Education | Honours + Book + Toolkit), one on phones. Bell Topo for years. 1px `--rule` above. Ends with the contact line.

**Copy (final)** (resume.html 179–212, 227–292, 311–366; index.html 95, 203, 229)

- **H2:** `About`
- **Experience**
  - Graphics Reporter, Minnesota Star Tribune · Sept. 2023–present
  - Graphics Intern, The Wall Street Journal · 2023: 42 maps on deadline with reporters and editors around the world
  - Interim Production Manager, UW Cartography Lab · 2022–23: managed eight student employees and guided production of more than 40 cartographic projects
  - Cartographer & Data Viz Designer, UW Cartography Lab · 2021–23: four interactive and 10 print maps for clients including The Nature Conservancy and Wisconsin Sea Grant
- **Education**
  - M.S., Cartography and GIS, University of Wisconsin–Madison, 2023; master's thesis built on interviews with 17 news cartographers. Taught two semesters of cartographic design and GIS labs as a graduate teaching assistant (Brenda Pfaehler Award of Excellence for instruction) — under the M.S., as on resume.html, which gives the teaching no dates of its own
  - B.A., Journalism, University of Minnesota, 2019
- **Book:** Author, *The Twin Cities in 50 Maps* (Belt Publishing, Nov. 17, 2026). Editor, Atlas of Design. Show `img/book-cover.webp` at 120px wide.
- **Selected honors** (newest first, in resume.html's order)
  - 2026 · Online Journalism Awards, Breaking News, Large Newsroom: contributed to the Star Tribune's winning entry
  - 2026 · Three SND Awards of Excellence, *Where is Uptown?*
  - 2026 · Minnesota SPJ, Best Infographic/Data Visualization (with Bryan Brussee and Mark Boswell)
  - 2022 · CaGIS Arthur Robinson Award for best print map, *Slivers of an Ancient Forest*, also featured in Atlas of Design Vol. VI
  - 2022 · NACIS Student Dynamic Map Competition, winner, *Dark Sky Sanctuaries* (with Aileen Clarke and Austin Novak)
- **Toolkit:** QGIS · ArcGIS Pro · Google Earth Engine · GDAL & OGR · R · MapLibre & Protomaps · Mapbox · D3 · Svelte · Blender · Illustrator · Photoshop · Claude Code
- **Contact:** jakesteinberg96@gmail.com · Résumé → · Full portfolio →

**Excluded or demoted:**
- **Operation Metro Surge:** award line only; his role is "contributed to".
- **WSJ:** one line; never called 3D.
- **Election print pages, 2024 weather, Snowfall Tracker:** omitted; role and data unknown, still images only.
- **Pipeline:** omitted; not ready for mobile (pipeline.html 313).
- **St. Paul Hills, Geology, Iditarod, Fox/coyote, Wildfire, Commute, Outdoor tales:** omitted to keep the page tight. Fox and fall hikes still appear as In the wild links.
- **Slivers image:** omitted; award line only.
- **Commit-per-month chart:** dropped.
- **Paisley wetland pattern and town dots:** never claimed.

---

## 5. Visual direction (mapped to `css/site.css`)

**Tokens**

- Page background `--plate` (#FBF8F1), not `--bg`. No `paper.css`.
- Text `--ink`; headings `--head`; secondary `--muted`; labels `--label-ink`/`--label-accent`.
- Hairlines `--rule` (dividers) and `--stroke` (1px around light images and the map).
- Links and focus `--accent-ink`, with the `--accent-soft` underline.
- Chart chrome uses `--rule-ink` and `--label-ink`.
- **Map colours appear only as the exact JSON hexes inside figures.**
- `--teal` is the second chart series, `--accent-ink` the highlight (the z14 line).
- Dark band: `--ink` background, `--plate` text, `--rule-soft` captions.

**Type**

- Outfit 600–700 for H1/H2/H3, `letter-spacing: var(--track-head)`, **no filters**.
- Source Serif 4 for prose at `--fs-lg`/1.6, max `--measure`.
- Bell Topo Sans caps for kickers, captions, figure labels and axis ticks (`--fs-xs` + `--label-plus`, `--track`). Numbers inside figures, hex values and commit hashes are set in Source Serif 4, because Bell Topo's 1 reads as l or I.
- At most three sizes per screen.

**Ornament**

- None: no strokes, paper, badges or shadows.
- Pills keep the `.pill` shape: copy `.pill`, `.pill:hover` and `.pill[aria-pressed="true"]` from `css/portfolio.css` lines 165–174.
- Also copy the live-map rules (lines 641–671) and the `.storylinks` rules (line 547 onward) into `cartography.css`.
- **Overrides:**
  - `.basemap { border: 1px solid var(--stroke); max-height: none; }`
  - `.stylename { filter: none; font-weight: 700; }`

**Spacing**

- Section padding `clamp(72px, 10vw, 160px)` top and bottom.
- Content max 1200px; spreads and Rincon max 1440px; Cortina max 2000px.
- 16px gutters on phones. No horizontal page scroll at 375px.

**Motion**

- Only: the hero poster loop, the live map, the sub-strip loops and the Uptown loop.
- Videos play only while ≥ 25% visible (IntersectionObserver), pause offscreen, `preload="none"` except the hero, never autoplay under `prefers-reduced-motion` or Save-Data (show posters).
- No parallax and no scroll-jacking.

---

## 6. Figures: `tools/make-map-figures.py`

**Script basics**

- Python 3 with the stdlib plus Pillow (12.0.0 is installed), and `ffmpeg` (installed) via `subprocess`.
- House style matches `tools/make-strokes.py`: docstring, constants at top, deterministic output.
- **Injection:** writes each SVG into `cartography.html` between `<!-- FIG:<name> START -->` / `<!-- FIG:<name> END -->` markers. Same guard as `build-project-list.mjs`: if a marker is missing, error and change nothing.
- Also writes raster files to `img/map-figures/`.
- **Expression evaluator:** a tiny one supporting legacy `{stops, base}`, `interpolate` (linear and exponential), `step`, `case`, `match`, `get`, `zoom`, literals. Anything else raises an error. **Never guess.**
- **Visible means** `layout.visibility != "none"`.
- **Effective zoom range** of a layer = `[max(layer.minzoom, source.minzoom), layer.maxzoom or 24]`.

**F1 five-up**

1. Extract one frame per hold from `img/tiles/strib-basemaps.mp4`: `ffmpeg -ss t`. Holds start at multiples of 3.4s (HOLD 2.7 + FADE 0.7, tools/crossfade-loop.sh); sample at `3.4k + 1.35`.
2. Classify each frame by nearest match of its two most common colours against each style's background and water hexes.
3. Assert there are five distinct styles. Otherwise abort and report.
4. Save `five-up-<style>.webp` at the source resolution (quality 82), plus width and height.

**F2 palette sheet**

- 5 columns × 8 roles. First *visible* layer from each candidate list:

  | Role | Candidate layers |
  |---|---|
  | background | `background` |
  | water | `water` |
  | parks | `landuse_park` |
  | forest | `landuse_forest`, `landcover` (kind wood/forest) |
  | wetland | `landuse_wetland`, `wetland` |
  | highway | `roads_highway` |
  | casing | `roads_highway_casing` |
  | buildings | `buildings_osm` |

- An expression colour shows as a split swatch of up to 3 colours found in it.
- No visible layer → dashed empty cell labelled `off`.
- 40×24 swatches, hex below in Bell Topo.
- Print the table to stdout. Check it against the hexes in the verified facts (e.g. Outdoors #fffbf4 / #c0efff / #d4f5d1 / #FFF9D1 / #C8CCD0 / #e8e4dc).

**F3 zoom ladder (Outdoors)**

- Visible layers only (80), grouped by `source-layer`, or by source id for the contours.
- Bars on a 0–24 axis; ticks at 0, 5, 10, 14, 18, 24.
- `--accent-ink` vertical rule at 14, labelled "tiles end".
- Group summary rows (always shown) plus a full per-layer `<details>`.

**F4 label ramps**

- **Outdoors** `places_locality`: evaluate text-size at z5–13 for population_rank just above and just below each split.
- **Elex**: at each band, evaluate the size at the band's threshold population and at 430,000.
- x axis z5–14; direct labels; no legend.

**F5 hubs map**

- The Minnesota polygon from the Elex `within` filter, plus the 27 `mn_hubs` points.
- Equirectangular projection with x scaled by cos(46.4°).
- Circle area proportional to population; labels for the top 8 by population, plus Baudette and Grand Marais.
- Every city listed in a `<details>` table.

**F6 Elex contract card**

- State A: the stack diagram.
- State B: computes L* (CIE, D65) from the *current* file hexes and shows `whyAccepted` verbatim. Render it only with `--elex-collisions` after Q5.

**F7, F8**

- Hand-authored SVG templates in the script. F8 reads commit subjects with `git show -s --format=%s <hash>` so the text is exact.

**Accessibility (every SVG)**

- `role="img"`, `<title>` and `<desc>`, text as real `<text>` in site font families, and a `<details>` data table equivalent.
- Run the dataviz palette validator on series colours.

---

## 7. Images: `tools/make-page-images.py` (Pillow, WebP q80, never upscaled)

| Source | Outputs (into `img/cartography/`) |
|---|---|
| `img/vonn-cortina.jpg` (2000×1333) | `vonn-cortina-1200.webp`, `-1600.webp`, `-2000.webp` |
| `img/rincon.png` (2754×1653) | `rincon-1600.webp`, `rincon-2000.webp`, `rincon-2400.webp` (12px trimmed off the top first: a black corner in the render). The page shows 1600/2000; 2400 is only the link |
| `img/cloud-peak-wilderness.jpg` (4000×2667) | `cloud-peak-1600.webp`, `cloud-peak-detail.webp` (1:1 crop at 1200×800 around the labelled peaks; the crop box is a constant Jake can adjust) |
| `img/restless-river.jpg` (4875×2475) | `restless-river-2400.webp` |
| `img/cathedral.jpg` (4875×2475) | `cathedral-2400.webp` |
| `img/driftless-website.jpg` (8571×11999) | `driftless-3000.webp` (long edge 3000) |

Set `width` and `height` on every `<img>`, use `loading="lazy"` below the fold, `decoding="async"`, and a `sizes` attribute matching the layout.

---

## 8. Accessibility and performance requirements

**Accessibility**

- One `h1`; sections are `<section aria-labelledby>`.
- Skip link "Skip past the map" before the hero map.
- The map container has `role="region" aria-label="Interactive map of Minnesota in the selected style"`.
- Style buttons use `aria-pressed` (basemaps.js already sets it). `.styleinfo` gets `aria-live="polite"`.
- Every image has alt text naming place and technique (e.g. "Oblique terrain map of Cortina d'Ampezzo with labelled peaks"). Decorative glyphs get `alt=""`.
- Focus rings from site.css; never `outline: none`.
- Contrast: body ≥ 4.5:1. `--plate` on `--ink` passes; `--rule-soft` on `--ink` is for captions ≥ 14px only.
- The viewer keeps Escape, Back and focus return.
- Under `prefers-contrast: more`, use `--ink` captions in the dark band.

**Performance**

- Phone LCP element (H1 or poster) ≤ 300 KB. `strib-basemaps.webp` is 29 KB and the mp4 is 381 KB, so the phone shows the poster and loads the video only if it autoplays.
- MapLibre 5.24.0 and PMTiles 4.5.0 stay lazy (basemaps.js); never load on phones without a tap.
- Exactly one MapLibre instance per page.
- No image wider than 2000px inline; no original over 5 MB linked.
- Run `tools/compress-videos.py` on any new MP4 (none planned).
- CLS < 0.1: set aspect ratios on every media box.

---

## 9. Build order and verification

**Build order**

1. Extract the viewer (`js/viewer.js`, `css/viewer.css`). Run `python3 tools/serve.py 5503`, then check `/` at 375px: open a panel, tap a picture, close with Close, Back and Escape, and confirm focus returns.
2. Add the one-line `basemap:map` event to `js/basemaps.js`. Recheck the index basemaps panel.
3. Run the two scripts. Spot-check three hexes, two zoom ranges and the hubs count (27) against the JSON.
4. Build `cartography.html`, `css/cartography.css` and `js/cartography.js`.

**Verify**

- Hero map loads tiles from `localhost:5503`, and all five styles switch.
- The Minnesota button works.
- Forcing a tile failure (block `static.startribune.com` in devtools) leaves the video and the fallback note.
- No console errors.
- No horizontal scroll at 375px.
- Reduced-motion and Save-Data behave as specified.
- Lighthouse mobile: LCP and CLS within budget.

**Before sharing**

- `grep -n "\[\[PLACEHOLDER" cartography.html` returns nothing. Each placeholder is filled or its sentence cut.
- Gates are closed unless answered.
- Nothing about this page in the sitemap, `llms.txt` or the nav.
- Commit on `maps-portfolio`; wait for Jake before pushing.

---

## 10. Questions for Jake (in priority order)

1. **Tiles:** does `https://static.startribune.com/protomaps/mn_0-22_20260428.pmtiles` load in a browser from `localhost:5503` and from `www.jakesteinberg.com`? A CLI ranged GET returned 403 from CloudFront. If it's blocked off startribune.com, the hero ships as the loop only.
2. **3D:** do you approve the gated buildings exploration (§6)? Does `mpls_buildings_13-15.pmtiles` carry `height` or `num_floors`? Do you have any 3D city or building work, camera animation or procedural work outside this repo? Any of those would outrank everything else.
3. **Vonn renders:** which software, which elevation and imagery sources, what vertical exaggeration, and did you make all six? This fills the only terrain placeholder. The same questions apply to Rincon, Cloud Peak, the Restless River REM and the Cathedral viewshed, for possible captions.
4. **Authorship:** did you build the `mapStyleSandbox` road-family tool and the L* collision-check script referenced in `strib-elex.json`? A yes unlocks the tools gate.
5. **Elex file:** the metadata says casings `#E1E1E1`, buildings `#F2F0EC` and base `#f7f7f7`. The layers use `#DADADA`, hide buildings, and set the background to `#ffffff`. Which is current? This opens the collision card.
6. **Agent workflow:** how do you brief and review Claude Code, and do you use AI-assisted workflows at the Star Tribune? This fills the tools placeholder.
7. **Outdoors "seasonal variations":** do seasonal variants exist? If not, should the `about` line in `projects.js` change? It shows on the main site too.
8. **Sprite:** is there a real Star Tribune sprite with `townspot` and `prince-wetland-dots`? The styles point at the public OSM Bright demo sprite, so those don't render.
9. **Data:** did you build the Minnesota PMTiles extract, the contour tiles, the Uptown tiles and the 27-city hub list? Did the styles start from the Protomaps template?
10. **Adoption:** are any of these styles the newsroom default, and roughly how many graphics use them beyond the 10 linked stories?
11. **Process:** do you have rejected palettes or early versions of any style, or Vonn render stages? A three-image "directions" strip would go at the end of §1 or §2.
12. **Rincon:** was it made in 2024? The map shows the March 2020 trip dates.
13. **Light and Dark:** both hide every place label. Is that how they ship, with labels added per graphic?
14. **Relocation:** should the page mention relocation or work authorization, or leave that for the application?