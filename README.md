# jakesteinberg.com

A plain static site hosted on GitHub Pages. There's no build step, so editing a
file and pushing to `main` publishes it.

## Where things live

| Page | Markup | Styles | Scripts |
|---|---|---|---|
| Portfolio (homepage) | `index.html` | `css/site.css` + `css/portfolio.css` | `js/projects.js`, `js/portfolio.js`, `js/site.js` |
| Resume | `resume.html` | `css/site.css` + `css/resume.css` | `js/site.js`, `js/resume.js` |
| Bespoke project pages: `22map.html`, `pipeline.html`, `golf.html`, `trees.html` | as is | `css/style.css`, Bootstrap, `css/scrollmap.css` | `js/scrollmap.js` |

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

   The WebP tile is used as the video's poster frame. Videos only play while
   they're on screen, and never for visitors who've asked their device for
   reduced motion.
3. **Add an entry to `js/projects.js`.** There's a template with every field
   explained at the top of that file. The grid follows the order of the list.

That's all: the tile, its filter tags and its panel are built automatically.

### Fields that are easy to forget

- `description` — the panel shows a visible placeholder until this is filled in.
- `images` — extra pictures for the panel. With none, the panel is text only.
- `links` — a list of stories, for a project that spans several (see *Maps for the
  Wall Street Journal*). Set `link: ""` to drop the single main button.
- `linkType: "file"` opens the full-size image in a lightbox. PDFs open in a
  new tab instead.
- `inBook: true` adds the "In the book" marker.

## Tags

The filter pills come from `TAGS` at the top of `js/projects.js`. To add one,
add `{ id: "maps-of-lakes", label: "Lakes" }` there and use the id in any
project's `tags`. Selecting several pills shows only projects that have **all**
of them. The selection is kept in the address bar
(`index.html?tags=3d,outdoors`), so a filtered view can be shared as a link.

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
