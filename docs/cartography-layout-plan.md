# Cartography page: layout and UI plan

A plan only. Nothing here is built yet. Scope: `/cartography` on branch `maps-portfolio`, which
will later move into the portfolio page.

## 1. What to take from workworkworkwork.work (Stephen Kennedy)

Observed on his site at 1440 px:

- **One long, calm scroll.** An intro, then a few sections ("Interaction & Systems Design",
  "Cartography", "Urban Planning & Participatory Design"), each a stack of projects.
- **The "sticky nav" is actually sticky section titles.** Each section is a two-column row: the
  section title in a narrow left column (3 of 12) that sticks 12 px from the top while you scroll
  that section's projects in the wide right column (9 of 12). When the next section arrives, its
  title takes over. There is no sticky header bar.
- **Every project uses the same five parts**, in the same order:
  1. small label (org, e.g. "MAPBOX", sometimes "DETAILS AVAILABLE ON REQUEST")
  2. title
  3. one or two sentences
  4. one large image
  5. a row of short links ("NEW ROAD DETAIL", "LIVE DEMO")
- **Very few kinds of thing.** Two typefaces (a mono for headings and labels, a sans for
  reading), one accent (a yellow underline on links and the current nav item), one background,
  thin dividers. No cards, no shadows, no pills.

Your resume page already uses the same sticky left-column section names, so this pattern would
also tie `/cartography` to the rest of the site.

## 2. Proposed page structure

```
Header (not sticky)     Jake Steinberg              Portfolio · Resume · Contact
Intro                   2–3 sentences: who you are, what you do, the book
──────────────────────────────────────────────────────────────────────────
STAR TRIBUNE   │  [the live map + switcher + style description]
BASEMAP STYLES │  Five styles, five jobs   (core cards)
  (sticky)     │  Variants                  (Outdoors, Elex)
               │  One-off                   (Paisley)
               │  Color, compared
               │  Type, compared
               │  Inside the styles         (Dakota names · Elex layer stack)
──────────────────────────────────────────────────────────────────────────
TERRAIN        │  Lindsey Vonn's Mountains · Rincon · Cloud Peak
  (sticky)     │  Elevation as data: Restless River · Cathedral · Driftless
──────────────────────────────────────────────────────────────────────────
ABOUT          │  Experience · Education · Book · Honors · Toolkit · Contact
  (sticky)     │
```

- **Section rows:** a left column of 3/12 with the section title, sticky at `top: 24px`. The right
  column of 9/12 holds the content. Below 900 px the title sits above its content and doesn't stick
  (as on the resume).
- **Strib styles are one section.** Everything about the styles lives in its right column,
  with sub-heads (H3) for each part. This replaces the current full-width hero and the separate
  `#styles` section.
- **Map width:** the map fills the right column (about 880 px wide at 1440), 2:1. The switcher
  and description sit under it, side by side as now.
- **Intro:** Stephen opens with a short "Hey there" paragraph. Since you cut "One map, drawn five
  ways", I'd add back just 2–3 plain sentences above the first section, with no big headline.
  **Your call:** intro or none.
- **The dark terrain band:** it's the one place the page changes background. For a calm,
  single-surface scroll like Stephen's, drop the dark band and present terrain on the same
  paper, with the renders large. **Your call:** keep it as the single dramatic moment, or drop it.

## 3. A standard "project block" (used everywhere)

Every project or sub-part follows one pattern, like Stephen's:

| Part | Style |
|---|---|
| Label | Bell Topo Sans caps, `--fs-xs + --label-plus`, `--label-ink` (e.g. `STAR TRIBUNE · 2025–2026`) |
| Title (H3) | Outfit 700, one size (`--fs-xl`), `--head` |
| Text | Source Serif, `--fs-base`/1.6, max 60ch, 1–2 sentences |
| Media | full column width, 1px `--stroke` frame, no shadow, never upscaled |
| Links | one row of text links with `↗`, the standard underline |

The style cards, the terrain works and the "elevation as data" items all become this block,
so the page has one rhythm instead of four different card types.

## 4. UI standardization

**Type: three roles, six sizes on this page**

| Role | Font | Sizes |
|---|---|---|
| Section titles (sticky column) | Outfit 700 | `--fs-h2` |
| Sub-heads, project titles | Outfit 700 | `--fs-xl`, `--fs-lg` (cards) |
| Reading text | Source Serif 4 | `--fs-lg` (intro), `--fs-base` (everything else) |
| Labels, captions, chart text | Bell Topo Sans caps | `--fs-xs + --label-plus` |
| Numbers (hexes, px values) | Source Serif 4, tabular | `--fs-md` |

No H1-size display type on the page. Captions are always sentence case in Source Serif
(today some are Bell Topo caps paragraphs, which are hard to read at length). Bell Topo is for
short labels only, at most a few words.

**Controls: three kinds, used consistently**

1. **Text link:** serif, `--accent-soft` underline, `↗` when it leaves the site. Used for all
   story links, "See it on the map", "Read the story".
2. **Segmented control:** only the map's style switcher.
3. **Small text options:** only variants.

So the remaining pills go: the "Open the live map" pill becomes a plain button styled like the
segmented control's selected state, and the `<details>` toggles ("The stack as a list") become
text links.

**Spacing:** one 8-based scale, with no in-between values.

| Use | Value |
|---|---|
| Inside blocks | 8 / 16 / 24 |
| Between blocks in a section | 48 |
| Between sub-parts (H3s) | 72 |
| Between sections | 120 (desktop), 72 (phone) |
| Grid | 12 columns, 24 px gutter, 1200 px max, 16 px phone gutter |

**Colour**

- **Accent:** coral appears only on links (underline) and focus rings. Kickers in coral become
  `--label-ink`.
- **Surface:** one background (`--plate`) and one rule colour (`--rule`) for every divider.
- **Map colours:** only inside the charts and swatches, where they're data.

**Media**

- **Frames:** every image and video gets the same 1px frame and no shadow.
- **Shape:** the comparison frames are 5:4 everywhere.
- **Captions:** directly under the media, sentence case.

**Figures**

- **Colour sheet:** fits the 9/12 column as is (the columns get narrower; cells already stack).
- **Type sheet:** at true size it can't fit nine styles in about 880 px, and the sideways scroll
  is the least polished part of the page. Two options:
  - **a. Recommended:** show one style at a time (7 rows of samples at true size), chosen with
    the same segmented control as the map, plus a "Compare with Core" toggle that adds a
    second column. Simple and readable, and it reuses the map's control.
  - **b.** Keep the full grid but scale samples to fit, and state the scale in the caption.
    True-size fidelity is lost.

**Details**

- **Placeholders:** one consistent style for "still to come" (dashed frame + label), and a
  single list of them at the end of this doc so none ship by accident.
- **Accessibility:** keep focus rings, `aria-pressed`, alt text, and the hidden H1. Section titles
  become real H2s in the sticky column.

## 5. Build order (for a later session; nothing done yet)

1. **Section frame:** the 3/9 sticky-title row, reused for Strib styles, Terrain and About.
   Fold the hero and `#styles` into the first row. (Small: HTML moves plus about 40 lines of CSS.)
2. **Project block:** convert style cards, terrain works and elevation items to the one
   pattern. Remove the card variants.
3. **Type, colour and spacing pass:** apply the tables above, cut coral kickers and remove
   leftover pills.
4. **Type sheet:** option a (style picker plus "Compare with Core"), if you agree.
5. **Terrain band and intro:** per your two calls in §2.
6. **Check:** 320–1920 px, sticky behaviour, keyboard, live map, no horizontal scroll.

Steps 1–3 are the core of the "professional" pass and could be done in one sitting. Steps 4–5
depend on your decisions.

## 6. Decisions (Jake, 2026-10-31): build all of §5

1. **Intro:** yes, a short intro paragraph at the top. Draft it only from facts already on the
   page or the main site; no new claims.
2. **Dark terrain band:** drop it. Terrain sits on the same paper as the rest.
3. **Type sheet:** option a, one style at a time with "Compare with Core".
4. **Navigation:** sticky section titles in a left column.

## 7. Placeholders currently on the page

- **Use cases:** lorem ipsum for every core style and variant (js/strib-styles.js).
- **Style files:** Core, Outdoors Fall, Outdoors Winter, Elex-1.
- **Comparison frames:** Core, Fall, Winter, Elex-1.
- **Vonn maps:** how they were made (terrain section).
