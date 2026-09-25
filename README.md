# jakesteinberg.com

A plain static site hosted on GitHub Pages. There's no build step, so editing a
file and pushing to `main` publishes it.

## Where things live

| Page | Markup | Styles | Scripts |
|---|---|---|---|
| Portfolio (homepage) | `index.html` | `css/site.css` + `css/portfolio.css` | `js/projects.js`, `js/portfolio.js`, `js/site.js` |
| Resume | `resume.html` | `css/site.css` + `css/resume.css` | `js/site.js`, `js/resume.js` |
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
  shows them bigger in the space. Four sit in two rows of two. All are uncropped. Six or more show
  as even thumbnails. Clicking a picture opens it full size in the lightbox;
  write an entry as `{ src, link, label }` to open a story instead, or as
  `{ src, story, label }` to keep it enlarging, with its label underneath
  linking to the story (and "Go to story" in the enlarged view). Captioned
  pictures always sit in one row, in the order listed. To show a light WebP
  but have "Open full-size map" open the original, write `{ src, full }`; use
  `full: false` for pictures with no full-size version (photos, say), or
  `zoom: false` for one that shouldn't enlarge at all (no click, no hover). Write
  `{ src, top: true }` to always put that picture across the top of the
  mosaic; with other pictures too, the top one gets the picture column to
  itself and the others spread out in a row under the description (see The
  Legacy Tree: the map beside the text, the photos under the description).
  On phones they stack after it. Write `{ src, tall: true }` to give a
  picture the full height on the left with the others stacked in a column
  beside it, filling the width, cropped to fit (see Outdoor tales).
- `credit` — an optional line under the pictures, like "Photos by …". It's
  also shown when a picture is enlarged. To credit a single picture, and only
  when it's enlarged, write it as `{ src, credit: "Photo by …" }`. An `.mp4`
  plays as a silent loop, with the `.webp` of the same name (minus `-loop`) as
  its poster. With none, the panel is text only.

  On wider screens the pictures sit beside the text, kept within a set height:
  40% of the screen, and never more than 340px (`MEDIA_MAX_HEIGHT` and
  `MEDIA_MAX_PX` at the top of the panel section of `js/portfolio.js`). The
  text column takes the rest of the width.
- `links` — a list of stories, for a project that spans several (see *Work for the
  Wall Street Journal*). Set `link: ""` to drop the single main button.
- `linkType: "file"` opens the full-size image in a lightbox. PDFs open in a
  new tab instead.
- `awards` — each is a line with a star. To add the judges' words in a quote
  box beneath it, write it as `{ award: "…", quote: "“…”", quoteBy: "Judge’s comments" }`.
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
build step to share it. If you change one, change it in `index.html` and
`resume.html` (and later `about.html` / `freelance.html`):

- **Nav:** the current page's link gets `aria-current="page"`.
- **"Last updated":** update the text and the `datetime` attribute when you
  publish, e.g. `<time datetime="2026-10">October 2026</time>`.

About Me (`about.html`) and Freelance (`freelance.html`) are linked in the nav
but not built yet.

## Preview locally

Use VS Code's Live Server (set to port 5501 in `.vscode/settings.json`), or, from the
repo folder:

```sh
python3 -m http.server
```

Then open http://localhost:8000.
