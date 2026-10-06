# jakesteinberg.com

A plain static site hosted on GitHub Pages. There's no build step, so editing a
file and pushing to `main` publishes it.

## Where things live

| Page | Markup | Styles | Scripts |
|---|---|---|---|
| Portfolio (homepage) | `index.html` | `css/site.css` + `css/portfolio.css` | `js/projects.js`, `js/basemaps.js`, `js/portfolio.js`, `js/site.js` |
| Resume | `resume.html` | `css/site.css` + `css/resume.css` | `js/site.js`, `js/resume.js` |
| Contact | `contact.html` | `css/site.css` + `css/contact.css` | `js/site.js`, `js/contact.js` |
| Bespoke project pages: `22map.html`, `pipeline.html`, `golf.html` | as is | `css/style.css`, Bootstrap, `css/scrollmap.css` | `js/scrollmap.js` |

- **`css/site.css`** holds everything shared by the redesigned pages: the color
  and font tokens at the top, the sticky header and the footer.
- **Don't edit `css/style.css`** for the new design. The bespoke project pages
  depend on it and are meant to stay as they are.

## Add a project to the portfolio

1. **Make a tile image.** It should be **5:4** (about **1000 × 800 px**), saved as
   WebP, in `img/tiles/`. Tiles are cropped edge to edge to fill the frame, so
   the 5:4 crop you export is what visitors see.
2. **For an animated piece**, add a looping MP4 alongside the tile. From a GIF:

   ```sh
   ffmpeg -i img/my-animation.gif -an -movflags +faststart -pix_fmt yuv420p \
     -vf "scale='min(800,iw)':-2,scale=trunc(iw/2)*2:trunc(ih/2)*2" \
     -c:v libx264 -crf 28 img/tiles/my-project.mp4
   ```

   **For a slideshow** (a few separate maps rather than one animation), use
   `tools/crossfade-loop.sh` instead, which crossfades from one picture to
   the next and loops seamlessly. It takes a list of pictures cropped to 5:4,
   or a slideshow GIF:

   ```sh
   tools/crossfade-loop.sh img/tiles/my-project.mp4 800 640 "img/tiles/My tile/"*.jpg
   ```

   Timing and quality settings are at the top of the script.

   The WebP tile is used as the video's poster frame. Videos only play while
   they're on screen, and never for visitors who've asked their device for
   reduced motion.
3. **Add an entry to `js/projects.js`.** There's a template with every field
   explained at the top of that file. The grid follows the order of the list.
4. **Update the plain copy for search engines**, from the repo folder:

   ```sh
   node tools/build-project-list.mjs
   ```

   (See "Search engines and AI tools" below.) Do this whenever you change
   `projects.js`, then commit `index.html` and `llms.txt` with it.

That's all: the tile, its filter tags and its panel are built automatically.

### Fields that are easy to forget

- `year` — shown in the panel under the title, before the tags. Leave it `""`
  to show just the tags.
- `panelCols` — how wide the detail view is on a desktop grid. `3` spans the
  whole row, with the text beside the pictures. `2` spans two columns under
  the tile, with the pictures and their links stacked under the description,
  and `1` is a single column, just under the tile, stacked the same way.
  Either way the rows below move down to make room.
- `scatter: true` — the panel's pictures are laid out loosely: no frames,
  uncropped, slightly tilted, in one line across the width. For cut-out art on
  a clear background (see 22, A Map's glyphs).
- `size: "large"` — the tile is two columns wide and two rows tall, its
  picture filling both rows (a little taller than 5:4). It works best first
  in the list. Tiles beside it open their panels under both rows.
- `basemaps: { … }` — the panel holds a live MapLibre map with a button for
  each style (see Star Tribune basemap styles). Each style's file goes in
  `maps/` under the name given in its `style:`; until it's there, the map says
  it isn't uploaded yet. A vector source named `protomaps` in a style file is
  pointed at the `pmtiles:` address, so the files don't each need it.
  `initial:` names the style it opens with. The map
  code is in `js/basemaps.js`, and only downloads when that panel opens.
- `mediaFull: true` — the pictures go under the text and fill the panel's
  whole width, rather than keeping within the height limit (see Rincon
  Mountains).
- `mediaHalf: true` — in a 3-column panel, the text and the pictures each
  get half, and the pictures fill their half rather than keeping within the
  height limit (see Where is Uptown?).
- `description` — the panel shows a visible placeholder until this is filled
  in. HTML is allowed, so it can include a link.
- `images` — extra pictures for the panel. One shows uncropped. Two sit side
  by side at matching heights. Three or five make a mosaic: the widest across
  the top and the rest sharing a row beneath it, or all in one row, whichever
  shows them bigger in the space. Four sit in two rows of two. Six or more make a grid,
  three to a row (two on phones). All are uncropped. Clicking a picture opens it full size in a new tab;
  write an entry as `{ src, link, label }` to open a story instead, or as
  `{ src, story, label }` to caption it with its label underneath linking to
  the story (with no `story`, the label is a plain caption). Captioned pictures always sit in one row, in the order listed.
  To show a light WebP but have clicking open the original, write
  `{ src, full }`; use `zoom: false` for a picture that shouldn't open at all
  (no click, no hover). Write
  `{ src, top: true }` to always put that picture across the top of the
  mosaic; with other pictures too, the top one gets the picture column to
  itself and the others spread out in a row under the description (see The
  Legacy Tree: the map beside the text, the photos under the description).
  On phones they stack after it. Write `{ src, tall: true }` to give a
  picture the full height on the left with the others stacked in a column
  beside it, filling the width, cropped to fit (see Outdoor tales).
- `credit` — an optional line under the pictures, like "Photos by …". To
  credit single pictures, write each as `{ src, credit: "Photo by …" }`: the
  names are gathered into one line under the pictures ("Photos by A and B"),
  and each shows as a tooltip on its picture. An `.mp4`
  plays as a silent loop, with the `.webp` of the same name (minus `-loop`) as
  its poster. With none, the panel is text only.

  On wider screens the pictures sit beside the text, kept within a set height:
  40% of the screen, and never more than 340px (`MEDIA_MAX_HEIGHT` and
  `MEDIA_MAX_PX` at the top of the panel section of `js/portfolio.js`). The
  text column takes the rest of the width.
- `links` — a list of stories, for a project that spans several (see *Work for the
  Wall Street Journal*). Give every one an `image` (its sharing picture, or an
  `.mp4` loop with a `.webp` poster of the same name minus `-loop`) and they
  show as a grid of cards, two to a row (see *Operation Metro Surge*). Set `link: ""` to drop the single main button.
- `linkType: "file"` opens the full-size image (or PDF) in a new tab.
- `awards` — each is a line with a star. To add the judges' words in a quote
  box beneath it, write it as `{ award: "…", quote: "“…”", quoteBy: "Judge’s comments" }`.
- `onlyWhen: ["3d", "outdoors"]` — keeps a tile out of the full grid; it shows
  up only while one of those tags is selected (see Cloud Peak Wilderness).
- `inBook: true` adds the "In the book" marker to the tile and an "In the book"
  button to the panel. To mark one of the panel's pictures too (say, the book
  version of a map), write it as `{ src, inBook: true }`.

## Tags

The filter pills come from `TAGS` at the top of `js/projects.js`. To add one,
add `{ id: "maps-of-lakes", label: "Lakes" }` there and use the id in any
project's `tags`. Visitors pick one pill at a time; picking it again shows
everything. The selection is kept in the address bar
(`index.html?tags=outdoors`), so a filtered view can be shared as a link.

## Things that are copied onto every page

The **header** and **footer** markup is repeated in each page, since there's no
build step to share it. If you change one, change it in `index.html`,
`resume.html` and `contact.html`:

- **Nav:** the current page's link gets `aria-current="page"`.
- **"Last updated":** update the text and the `datetime` attribute when you
  publish, e.g. `<time datetime="2026-10">October 2026</time>`.

## The contact form

The message box on `contact.html` sends through [Formspree](https://formspree.io),
which emails each message to you. The form's `action` is
`https://formspree.io/f/xoejqgoo`, where `xoejqgoo` is the form's ID from the
Formspree dashboard (the part after `/f/`). To switch to a different Formspree
form, replace that ID. The free plan covers 50 messages a month.

Freelance commissions are a section of the Contact page (`contact.html#freelance`),
which the homepage intro links to.

## Search engines and AI tools

Things that help Google, Bing and AI search tools (ChatGPT, Claude,
Perplexity) find the site and understand it:

- **The plain project list.** The grid is built by JavaScript, which many
  crawlers don't run. `tools/build-project-list.mjs` writes every project from
  `js/projects.js` into `index.html` as plain HTML (between the
  `PROJECT LIST START` / `END` comments), which visitors never see. Rerun it
  after editing `projects.js`.
- **`llms.txt`** — a plain-text summary of you, your freelance work and your
  projects, for AI tools. Edit the top by hand; the "Selected work" list is
  written by the same script.
- **Titles and descriptions.** Each page's `<title>` and
  `<meta name="description">` are what search results show. The
  `<link rel="canonical">` gives each page's one true address (the `www.` one).
- **Structured data.** The `<script type="application/ld+json">` block in each
  page's `<head>` describes you (and the book, and the freelance work) in a
  standard form. If something changes, like a job title, change it there too.
  It's repeated on all three pages.
- **`robots.txt`** lets every crawler in and points to **`sitemap.xml`**, the
  list of pages. Add a `<url>` line there when you add a page.

## Preview locally

From the repo folder:

```sh
python3 tools/serve.py
```

Then open http://localhost:8000. Use this rather than `python3 -m http.server`
or VS Code's Live Server: the site links to short addresses (`/resume`,
`/contact`), which GitHub Pages and this script understand but those don't.

## Page addresses

Pages are linked without `.html`: `/` for the portfolio, `/resume`, `/contact`.
GitHub Pages serves `resume.html` at `/resume` automatically, and the old
`.html` addresses keep working too. When you link to one of these pages, use
the short form; each page's `<link rel="canonical">` tells search engines
which address is the real one.
