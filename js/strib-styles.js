/* =============================================================================
   strib-styles.js — the Star Tribune basemap styles: the one list the
   cartography page (js/cartography.js) and its figure script
   (tools/make-map-figures.py) both read.

   Five core styles (group "core", in this order), their variants (a
   "parent" names the core style they belong to), and the one-off (group
   "oneoff"). Each entry:
     key      short id; the figure script names its files after it
     name     the button on the map
     title    the full name
     group    "core", "variant" or "oneoff"
     parent   (variants) the key of its core style
     variant  (core styles with variants, and variants) its name in the
              second row of buttons, e.g. "Main", "Fall"
     file     the MapLibre style file. Until it's in maps/, the map says it
              isn't uploaded yet and the figures show a placeholder.
     frame    the still of the Twin Cities used in the style cards, or ""
              for a placeholder until one is made
     about    its use case, a sentence or two
     links    stories that ran on it: { "label", "url" }

   The part between the START and END lines must stay strict JSON (double
   quotes, no comments, no trailing commas): the figure script reads it.
   Lorem ipsum marks text still to be written.
   ============================================================================= */
const STRIB_STYLES =
/* STRIB_STYLES START */
[
  { "key": "core", "name": "Core", "title": "Strib Core", "group": "core",
    "file": "maps/strib-core.json", "frame": "",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    "links": [] },

  { "key": "light", "name": "Light", "title": "Strib Light", "group": "core",
    "file": "maps/strib-light.json", "frame": "img/map-figures/five-up-light.webp",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    "links": [
      { "label": "Where is Uptown?", "url": "https://www.startribune.com/where-is-uptown-help-us-settle-the-debate-by-drawing-your-boundaries/601438173" },
      { "label": "Vital restaurants", "url": "https://www.startribune.com/minnesotas-45-most-vital-restaurants-right-now/601728087" }
    ] },

  { "key": "dark", "name": "Dark", "title": "Strib Dark", "group": "core",
    "file": "maps/strib-dark.json", "frame": "img/map-figures/five-up-dark.webp",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    "links": [
      { "label": "Fox vs. coyote", "url": "https://www.startribune.com/its-foxes-versus-coyotes-in-a-backyard-battle-for-survival/601504496" },
      { "label": "Vance Boelter", "url": "https://www.startribune.com/vance-boelters-43-hours-on-the-run-expose-mistakes-in-law-enforcement-response/601546404" }
    ] },

  { "key": "outdoors", "name": "Outdoors", "title": "Strib Outdoors", "group": "core", "variant": "Main",
    "file": "maps/strib-outdoors.json", "frame": "img/map-figures/five-up-outdoors.webp",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    "links": [
      { "label": "Spring hikes", "url": "https://www.startribune.com/eight-minnesota-hikes-that-sing-of-spring/601637574" },
      { "label": "Fall hikes", "url": "https://www.startribune.com/8-minnesota-hikes-to-fall-for-this-autumn/601883249" },
      { "label": "Jessie Diggins’s favorite ski trails", "url": "https://www.startribune.com/you-too-can-ski-on-jessie-diggins-favorite-trails-in-the-upper-midwest/601561307" }
    ] },

  { "key": "elex", "name": "Elex", "title": "Strib Elex", "group": "core", "variant": "Elex-2",
    "file": "maps/strib-elex.json", "frame": "img/map-figures/five-up-elex.webp",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    "links": [
      { "label": "2026 GOP primary", "url": "https://www.startribune.com/how-minnesotans-voted-in-the-gop-primary-for-governor-precinct-by-precinct/601875965" },
      { "label": "2026 DFL primary", "url": "https://www.startribune.com/how-minnesotans-voted-in-the-contentious-dfl-primary-for-us-senate-precinct-by-precinct/601875969" }
    ] },

  { "key": "outdoors-fall", "name": "Fall", "title": "Strib Outdoors Fall", "group": "variant",
    "parent": "outdoors", "variant": "Fall",
    "file": "maps/strib-outdoors-fall.json", "frame": "",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "links": [] },

  { "key": "outdoors-winter", "name": "Winter", "title": "Strib Outdoors Winter", "group": "variant",
    "parent": "outdoors", "variant": "Winter",
    "file": "maps/strib-outdoors-winter.json", "frame": "",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "links": [] },

  { "key": "elex-1", "name": "Elex-1", "title": "Strib Elex-1", "group": "variant",
    "parent": "elex", "variant": "Elex-1",
    "file": "maps/strib-elex-1.json", "frame": "",
    "about": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "links": [] },

  { "key": "paisley", "name": "Paisley", "title": "Strib Paisley", "group": "oneoff",
    "file": "maps/strib-paisley.json", "frame": "img/map-figures/five-up-paisley.webp",
    "about": "A one-off, purple-forward style for the 10th anniversary of Prince’s passing.",
    "links": [
      { "label": "Top Prince sites", "url": "https://www.startribune.com/prince-tourist-sites-minneapolis/601587518" }
    ]
  }
]
/* STRIB_STYLES END */
;
