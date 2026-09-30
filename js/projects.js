/* =============================================================================
   projects.js — THE LIST OF WORK ON THE PORTFOLIO PAGE.
   This is the file to edit when you add, remove, reorder or retag a project.
   js/portfolio.js reads it and builds the grid, the filter pills and the
   unfolding panels. You shouldn't need to touch any HTML to add a project.

   ORDER: projects appear in the grid in the order they're listed below.
   ============================================================================= */


/* -----------------------------------------------------------------------------
   TAGS — the filter pills, in the order they appear.
     id:    what you type in a project's tags list (lowercase, no spaces)
     label: what visitors see on the pill and under each tile
   To add a tag, add a line here, then use its id on any projects.
   Visitors pick one pill at a time, which shows the projects with that tag.
   ----------------------------------------------------------------------------- */
const TAGS = [
  { id: "print", label: "Print" },
  { id: "interactive", label: "Interactive" },
  { id: "scrollytelling", label: "Scrollytelling" },
  { id: "3d", label: "3D" },
  { id: "illustrated", label: "Illustrated" },
  { id: "news", label: "News" },
  // { id: "remote-sensing", label: "Remote sensing" },   // off for now; to bring it back, remove the // and re-tag Emily Ford's Iditarod
  { id: "outdoors", label: "Outdoors" },
  { id: "climate", label: "Climate" }
];


/* -----------------------------------------------------------------------------
   PROJECTS — one { ... } block per tile.

   To add a project, copy this template to wherever you want it in the list:

   {
     title:       "Project name",              // shown under the tile and in the panel
     slug:        "project-name",              // unique id, lowercase-with-dashes
     year:        "2024",                      // shown before the tags in the panel. "" for none
     panelCols:   3,                           // how wide the detail view is on a desktop grid:
                                               //   3 — the whole row: text beside the pictures
                                               //   2 — two columns, under the tile: the text, then
                                               //       the pictures and their links stacked below
                                               //   1 — one column, just under the tile, stacked the
                                               //       same way
     size:        "",                          // optional: "large" makes the tile two columns wide
                                               //   and two rows tall (best first in the list)
     tile:        "img/tiles/project-name.webp", // the grid image — 5:4, about 1000x800
     video:       "",                          // optional looping .mp4; the tile image
                                               //   becomes its poster frame. "" for none
     link:        "https://...",               // where the panel's main button goes
     linkType:    "story",                     // "story" — a published story (opens in a new tab)
                                               // "page"  — one of your own pages, e.g. "22map.html"
                                               // "file"  — a full-size image or PDF, opened in a new tab
                                               // "project" — "View the project": a client's site, in a new tab
     tags:        ["print", "news"],           // any number of ids from TAGS above
     inBook:      false,                       // true adds the "In the book" corner marker
     description: "",                          // a sentence or two for the panel.
                                               //   Left "" → the panel shows a placeholder.
                                               //   HTML is allowed, e.g. a link:
                                               //   <a href=\"https://…\" target=\"_blank\">text</a>
     scatter:     false,                       // optional: true lays the pictures out loosely,
                                               //   unframed and slightly tilted, in one line
                                               //   across the width (for cut-out art on a clear
                                               //   background, like 22, A Map's glyphs)
     mediaFull:   false,                       // optional: true puts the pictures under the text
                                               //   across the panel's whole width, however tall
     mediaHalf:   false,                       // optional: true gives the pictures exactly half
                                               //   of a 3-column panel, filling it (no height limit)
     images:      [],                          // extra pictures for the panel, e.g.
                                               //   ["img/foo-detail.webp", "img/foo-2.webp"]
                                               //   1 shows uncropped. 2 sit side by side at
                                               //   matching heights. 3 or 5 make a mosaic: the
                                               //   widest on top and the rest in a row under it,
                                               //   or all in one row, whichever shows them
                                               //   bigger. 4 sit in two rows of two. 6 or more
                                               //   make a grid, three to a row. All uncropped.
                                               //   The pictures are kept within a set
                                               //   height (MEDIA_MAX_HEIGHT in js/portfolio.js).
                                               //   Clicking a picture opens it full size, in a
                                               //   new tab. To open a
                                               //   story instead, write it as
                                               //   { src: "img/…", link: "https://…", label: "Story name" }
                                               //   Or caption it, with its label under it
                                               //   linking to its story:
                                               //   { src: "img/…", story: "https://…", label: "Fall 2024" }
                                               //   (a label with no story is a plain caption)
                                               //   captionAbove: true puts the caption over it,
                                               //   captionStar: true styles it like an award line
                                               //   To open a bigger original than the one shown:
                                               //   { src: "img/…webp", full: "img/….jpg" }
                                               //   zoom: false shows it but doesn't open it
                                               //   (no click, no hover effect)
                                               //   tall: true gives a picture the full height on
                                               //   the left, with the rest stacked beside it, all
                                               //   filling the width, cropped to fit (Outdoor tales)
                                               //   top: true puts a picture across the top of a
                                               //   mosaic, instead of the widest one. With OTHER
                                               //   pictures too, the top one gets the picture
                                               //   column to itself and the others spread out in
                                               //   a row under the description (see The Legacy
                                               //   Tree: the map beside the text, the photos
                                               //   under the description)
                                               //   An .mp4 plays as a silent loop; put a .webp
                                               //   of the same name (minus "-loop") beside it
                                               //   for its still poster.
                                               //   Left [] → the panel is text only
     credit:      "",                          // optional line under the pictures, e.g.
                                               //   "Photos by …"
                                               //   A single picture can have its own, shown only
                                               //   { src, credit: "Photo by …" }: shown as a tooltip,
                                               //   and all the pictures' credits are gathered into
                                               //   one line under them ("Photos by A and B")
     links:       [],                          // optional list of stories, for a project that
                                               //   spans several. Each: { label: "…", url: "…" }.
                                               //   Give every one an image: "img/…" (its sharing
                                               //   picture, or an .mp4 loop) to show them as a
                                               //   grid of cards, two to a row
                                               //   Set link: "" to drop the single main button
     basemaps:    null,                        // optional: an interactive map in the panel with a
                                               //   button for each style (see Star Tribune basemap
                                               //   styles below, and js/basemaps.js)
     awards:      []                           // lines shown with a star in the panel.
                                               //   HTML is allowed: "<em>Atlas of Design</em>"
                                               //   To add the judges' words in a quote box:
                                               //   { award: "…", quote: "“…”", quoteBy: "Judge’s comments" }
   },

   Notes
   - inBook is only true for State Fair Smellscape so far.
   - Tags were a first pass. Scrollytelling vs. Interactive especially is a guess.
   ----------------------------------------------------------------------------- */
const PROJECTS = [
  {
    // The tile video crossfades six of the story's 3D mountain renders, unlabeled
    // (tools/crossfade-loop.sh, at CRF 31 to keep the detailed renders light).
    // The panel shows the six labeled maps under the text, three to a row.
    title:       "Lindsey Vonn’s Mountains",
    slug:        "lindsey-vonns-mountains",
    year:        "2026",
    panelCols:   3,
    tile:        "img/tiles/lindsey-vonns-mountains.webp",
    video:       "img/tiles/lindsey-vonns-mountains.mp4",
    link:        "https://www.startribune.com/five-mountains-and-one-notable-hill-that-defined-lindsey-vonns-career-and-comeback/601559700",
    linkType:    "story",
    tags:        ["news", "3d", "outdoors"],
    inBook:      false,
    description: "A biography of Lindsey Vonn published in the run-up to the 2026 Winter " +
                 "Olympics, told by the mountains that made her.",
    mediaFull:   true,                            // the six maps across the whole panel
    images:      [                                 // a light copy each; clicking opens the original
      { src: "img/tiles/vonn-lake-louise.webp", full: "img/vonn-lake-louise.jpg" },
      { src: "img/tiles/vonn-are.webp",         full: "img/vonn-are.jpg" },
      { src: "img/tiles/vonn-buck-hill.webp",   full: "img/vonn-buck-hill.jpg" },
      { src: "img/tiles/vonn-cortina.webp",     full: "img/vonn-cortina.jpg" },
      { src: "img/tiles/vonn-schladming.webp",  full: "img/vonn-schladming.jpg" },
      { src: "img/tiles/vonn-whistler.webp",    full: "img/vonn-whistler.jpg" }
    ],
    awards:      []
  },
  {
    // The tile video crossfades three of the stories' sharing images (not the
    // ICE chart), each shown whole and padded to 5:4, black behind the
    // frame-by-frame analysis (tools/crossfade-loop.sh). The stories show as cards with their sharing images (links: … image:);
    // the last one's image is an animated chart, so it's a loop.
    title:       "Operation Metro Surge",
    slug:        "operation-metro-surge",
    year:        "2026",
    panelCols:   2,
    tile:        "img/tiles/operation-metro-surge.webp",
    video:       "img/tiles/operation-metro-surge-v2.mp4",   // new name so browsers drop the old loop
    link:        "",                              // no button: the stories are the cards below
    linkType:    "story",
    tags:        ["news", "interactive", "scrollytelling"],
    inBook:      false,
    description: "Provided authoritative visual journalism on the unprecedented and rapidly " +
                 "unfolding immigration operation that ultimately left two U.S. citizens dead " +
                 "and ignited a protest movement watched by the world.",
    images:      [],
    links:       [
      { label: "Breaking down the videos: A close examination of the shooting of Renee Good",
        url:   "https://www.startribune.com/breaking-down-the-videos-a-close-examination-of-the-shooting-of-renee-good/601560158",
        image: "img/tiles/metro-surge-1.webp" },
      { label: "How 3,000 federal agents would compare to 10 largest Twin Cities police forces",
        url:   "https://www.startribune.com/how-ice-numbers-compare-to-twin-cities-largest-police-forces/601562617",
        image: "img/tiles/metro-surge-2.webp" },
      { label: "A chaotic confrontation, a gun and 10 shots: A frame-by-frame analysis of the fatal shooting of Alex Pretti",
        url:   "https://www.startribune.com/a-chaotic-confrontation-a-gun-and-10-shots-a-frame-by-frame-analysis-of-the-fatal-shooting-of-alex-pretti/601570463",
        image: "img/tiles/metro-surge-3.webp" },
      { label: "Is ICE really leaving Minnesota? The data is complicated.",
        url:   "https://www.startribune.com/is-ice-really-pulling-out-of-minnesota-observer-data-tells-a-complicated-story/601580496",
        image: "img/tiles/metro-surge-4-loop.mp4" }
    ],
    awards:      [
      "Winner, Breaking News, Large Newsroom, from the Online News Association’s " +
      "<a href=\"https://awards.journalists.org/winners/2026/\" target=\"_blank\" rel=\"noopener\">Online Journalism Awards 2026</a>. " +
      "Finalist for the Knight Award for Public Service."
    ]
  },
  {
    // Two looping maps from the stories, each captioned with a link to it. The
    // fire growth is cropped to 5:4 around the four big fires (1060x848 from
    // 416,0 of the 1920x1080 original). The tile plays it, then the smoke.
    title:       "Wildfire coverage",
    slug:        "wildfire-coverage",
    year:        "2026",
    panelCols:   2,
    tile:        "img/tiles/wildfire-coverage.webp",
    video:       "img/tiles/wildfire-coverage.mp4",
    link:        "",                              // no button: the captions link to the stories
    linkType:    "story",
    tags:        ["news", "scrollytelling", "climate"],
    inBook:      false,
    description: "Mapping the causes and consequences of Minnesota’s worst wildfire season in a generation.",
    images:      [
      { src: "img/tiles/wildfire-growth-loop.mp4", label: "Primed to burn",       // the fires spreading
        story: "https://www.startribune.com/drought-and-dead-wood-stacked-the-deck-for-the-boundary-waters-wildfires/601870740" },
      { src: "img/tiles/wildfire-smoke-loop.mp4", label: "Smoke",                 // the smoke forecast
        story: "https://www.startribune.com/wildfire-smoke-is-arriving-in-the-twin-cities-and-central-minnesota-here-is-what-to-expect/601868148" }
    ],
    awards:      []
  },
  {
    // The panel holds a live MapLibre map with a button for each style; see
    // js/basemaps.js. Each style's file goes in maps/ with the name below.
    // (For a tile two columns wide and two rows tall, add size: "large".)
    title:       "Star Tribune basemap styles",
    slug:        "strib-basemaps",
    year:        "2025–2026",
    panelCols:   3,
    // The tile video crossfades through the five styles over the same Twin
    // Cities view, labels hidden (tools/crossfade-loop.sh); the still is Light.
    tile:        "img/tiles/strib-basemaps.webp",
    video:       "img/tiles/strib-basemaps.mp4",
    link:        "",                              // no button: the stories are listed under each style
    linkType:    "story",
    tags:        ["news", "interactive", "outdoors"],
    inBook:      false,
    description: "Designed a full suite of MapLibre basemap styles for use across the " +
                 "Star Tribune’s editorial coverage verticals.",
    basemaps:    {
      // the vector tiles every style draws on; any style source named
      // "protomaps" is pointed here
      pmtiles:   "https://static.startribune.com/protomaps/mn_0-22_20260428.pmtiles",
      center:    [-93.0165, 44.9398],             // where the map opens: [longitude, latitude]
      zoom:      12.5,                            //   (Battle Creek Regional Park, St. Paul)
      // where the tiles exist (from the .pmtiles file): the map can't be dragged
      // or zoomed out past it, and the Minnesota button zooms out to it
      bounds:    [[-97.415, 43.44], [-89.439, 49.414]],
      initial:   "Outdoors",                      // the style it opens with (a name below)
      // name: the button. title, about, links: shown for the chosen style.
      // style: the MapLibre style file (until it's there, the map says so)
      styles:    [
        { name: "Light", title: "Strib Light", style: "maps/strib-light.json",
          about: "A lively and authoritative style for use across coverage areas.",
          links: [
            { label: "Where is Uptown?", url: "https://www.startribune.com/where-is-uptown-help-us-settle-the-debate-by-drawing-your-boundaries/601438173" },
            { label: "Vital restaurants", url: "https://www.startribune.com/minnesotas-45-most-vital-restaurants-right-now/601728087" }
          ] },
        { name: "Dark", title: "Strib Dark", style: "maps/strib-dark.json",
          about: "A dark style designed for sober enterprise projects and nocturnal settings.",
          links: [
            { label: "Fox vs. coyote", url: "https://www.startribune.com/its-foxes-versus-coyotes-in-a-backyard-battle-for-survival/601504496" },
            { label: "Vance Boelter", url: "https://www.startribune.com/vance-boelters-43-hours-on-the-run-expose-mistakes-in-law-enforcement-response/601546404" }
          ] },
        { name: "Outdoors", title: "Strib Outdoors", style: "maps/strib-outdoors.json",
          about: "A style for outdoor adventure featuring topographic contours and seasonal variations.",
          links: [
            { label: "Spring hikes", url: "https://www.startribune.com/eight-minnesota-hikes-that-sing-of-spring/601637574" },
            { label: "Fall hikes", url: "https://www.startribune.com/8-minnesota-hikes-to-fall-for-this-autumn/601883249" },
            { label: "Jessie Diggins’s favorite ski trails", url: "https://www.startribune.com/you-too-can-ski-on-jessie-diggins-favorite-trails-in-the-upper-midwest/601561307" }
          ] },
        { name: "Elex", title: "Strib Elex", style: "maps/strib-elex.json",
          about: "A style tailored for accurate data presentation that minimizes distortions.",
          links: [
            { label: "2026 GOP primary", url: "https://www.startribune.com/how-minnesotans-voted-in-the-gop-primary-for-governor-precinct-by-precinct/601875965" },
            { label: "2026 DFL primary", url: "https://www.startribune.com/how-minnesotans-voted-in-the-contentious-dfl-primary-for-us-senate-precinct-by-precinct/601875969" }
          ] },
        { name: "Paisley", title: "Strib Paisley", style: "maps/strib-paisley.json",
          about: "I designed this one-off, purple-forward style for the 10th anniversary of Prince’s passing.",
          links: [
            { label: "Top Prince sites", url: "https://www.startribune.com/prince-tourist-sites-minneapolis/601587518" }
          ] }
      ]
    },
    images:      [],
    awards:      []
  },
  {
    // The tile video crossfades four of the spread's inset renders, each cropped
    // to 5:4 (tools/crossfade-loop.sh). The panel shows the whole spread,
    // converted from the CMYK print file (50 Maps/Maps/REM/floodplain.jpg).
    title:       "A Restless River",
    slug:        "restless-river",
    year:        "2026",
    panelCols:   2,
    tile:        "img/tiles/restless-river-tile.webp",
    video:       "img/tiles/restless-river-loop.mp4",
    link:        "",                              // just the "In the book" button
    linkType:    "story",
    tags:        ["print"],
    inBook:      true,
    description: "A 2-page spread in my book that exposes the writhing and rambling of " +
                 "the Minnesota River.",
    images:      [
      { src: "img/tiles/restless-river.webp", full: "img/restless-river.jpg" }   // the whole spread
    ],
    awards:      []
  },
  {
    // The tile video scrolls rightward across the spread without end, a 60px
    // gap in the spread's cream color between copies (about 24s a loop), converted from the CMYK print file
    // (50 Maps/Maps/St. Paul hills/hills.jpg). The panel shows the whole spread.
    title:       "Cycling St. Paul’s Hills",
    slug:        "st-paul-hills",
    year:        "2026",
    panelCols:   2,
    tile:        "img/tiles/st-paul-hills.webp",
    video:       "img/tiles/st-paul-hills-scroll-v2.mp4",
    link:        "",                              // just the "In the book" button
    linkType:    "story",
    tags:        ["print"],
    inBook:      true,
    description: "A 2-page spread in my book that visually compares the hills that await " +
                 "cyclists who wish to traverse the capitol city.",
    images:      [
      { src: "img/tiles/st-paul-hills-spread.webp", full: "img/st-paul-hills.jpg" }   // the whole spread
    ],
    awards:      []
  },
  {
    // The tile video scrolls rightward across the spread without end: the
    // spread repeats with a 60px white gap between copies, and the loop ends
    // where it began (about 24s).
    // Converted from the CMYK print file (50 Maps/Maps/Geology/geology.jpg);
    // the panel shows the whole spread.
    title:       "Twin Cities Geology",
    slug:        "geology",
    year:        "2026",
    panelCols:   2,
    tile:        "img/tiles/geology.webp",
    video:       "img/tiles/geology-scroll.mp4",
    link:        "",                              // just the "In the book" button
    linkType:    "story",
    tags:        ["print"],
    inBook:      true,
    description: "A 2-page spread in my book that tells the story of the subterranean " +
                 "world beneath the Twin Cities.",
    images:      [
      { src: "img/tiles/geology-spread.webp", full: "img/geology.jpg" }   // the whole spread
    ],
    awards:      []
  },
  {
    // The tile video pans slowly down the unlabeled cougar map
    // (img/cougars-base.jpg) and back up, 16s.
    title:       "Illustrated stories",
    slug:        "illustrated-stories",
    year:        "2026",
    panelCols:   2,
    tile:        "img/tiles/illustrated-stories.webp",
    video:       "img/tiles/illustrated-stories.mp4",
    link:        "",
    linkType:    "story",
    tags:        ["news", "illustrated", "outdoors"],
    inBook:      false,
    description: "Hand-drawn cartography for the Star Tribune.",
    images:      [
      { src: "img/tiles/illustrated-camino.webp", full: "img/camino-de-santiago.jpg",
        label: "Camino de Santiago",
        story: "https://www.startribune.com/resilience-enlightenment-and-bed-bugs-on-the-camino-de-santiago/601528801" },
      // not published yet: the label is a plain caption until story: is added
      { src: "img/tiles/illustrated-cougars.webp", full: "img/cougars.jpg",
        label: "Cougars return" }
    ],
    awards:      []
  },
  {
    // The tile video is a screen recording of the story, cropped to just the
    // strip its four vehicles drive through, on white, its end crossfading back.
    title:       "Cost of the commute",
    slug:        "commute-costs",
    year:        "2026",
    panelCols:   1,
    tile:        "img/tiles/commute-costs.webp",
    video:       "img/tiles/commute-costs-drive.mp4",
    link:        "https://www.startribune.com/highest-gas-prices-in-4-years-force-minnesotans-to-rethink-the-commute-if-they-can/601838626",
    linkType:    "story",
    tags:        ["news", "scrollytelling"],
    inBook:      false,
    description: "A visual story about how high gas prices caused by the war with Iran " +
                 "are squeezing commuters.",
    images:      [],
    awards:      []
  },
  {
    // The tile video is the fox and coyote tracking animation, zoomed in to 5:4
    // on where their trails meet (1270x1016 from 743,176 of the 2414x1454
    // recording), its end crossfading back. A wider version, showing more of the
    // coyote trails, is img/tiles/fox-coyote.mp4 / .webp.
    title:       "Urban foxes and coyotes",
    slug:        "fox-coyote",
    year:        "2026",
    panelCols:   3,
    tile:        "img/tiles/fox-coyote-zoom.webp",
    video:       "img/tiles/fox-coyote-zoom.mp4",
    link:        "",                              // no button: the story and the book are listed
    linkType:    "story",
    tags:        ["news", "scrollytelling", "print"],
    inBook:      true,
    description: "Stories about backyard foxes and coyotes eking out a life in the margins of the metro.",
    images:      [
      // "A Year in the Life of an Urban Coyote", converted from the CMYK print
      // original (50 Maps/Maps/Coyotes/coyote.jpg) to screen colors, white
      // margin trimmed, and just its left page shown; clicking opens the whole
      // spread at full resolution
      { src: "img/tiles/urban-coyote-left.webp", full: "img/urban-coyote.jpg" }
    ],
    links:       [                                 // "In the book" is added after these
      { label: "Backyard battle for survival", url: "https://www.startribune.com/its-foxes-versus-coyotes-in-a-backyard-battle-for-survival/601504496" }
    ],
    awards:      []
  },
  {
    title:       "Rincon Mountains",
    slug:        "rincon-mountains",
    year:        "2024",
    panelCols:   2,
    tile:        "img/tiles/rincon-mountains.webp",
    video:       "",
    link:        "",                              // no button: clicking the rendering opens it full size
    linkType:    "file",
    tags:        ["print", "3d", "outdoors"],
    inBook:      false,
    description: "A golden hour rendering of Saguaro National Park’s Rincon Mountains made " +
                 "to commemorate a trip with an old friend.",
    mediaFull:   true,                            // the rendering across the whole panel
    images:      [
      { src: "img/tiles/rincon-mountains-full.webp",   // a lighter copy to preview…
        full: "img/rincon.png" }                        // …clicking it opens the original
    ],
    awards:      []
  },
  {
    title:       "Emily Ford’s Iditarod",
    slug:        "2025-iditarod",
    year:        "2025",
    panelCols:   2,
    tile:        "img/tiles/2025-iditarod.webp",
    video:       "",
    link:        "https://www.startribune.com/duluths-emily-ford-faces-her-toughest-winter-adventure-yet-alaskas-famed-iditarod/601225462",
    linkType:    "story",
    tags:        ["news", "outdoors"],
    inBook:      false,
    description: "A map that conjures the icy Alaska faced by Minnesotan Emily Ford during " +
                 "the 2025 Iditarod dog sled race. Built from a MODIS image.",
    mediaFull:   true,                            // the map across the whole panel
    images:      [
      { src: "img/tiles/2025-iditarod-full.webp",   // a lighter copy to preview…
        full: "img/ford.jpg" }                       // …clicking it opens the original
    ],
    awards:      []
  },
  {
    // The video scrolls down the full-size map and back up (48s loop), zoomed
    // 3x on the middle third of the map's width, stopping short of the bottom
    // 10%. The tile is its first frame.
    // The old static thumbnail is still at img/tiles/the-driftless-area.webp
    // if you'd rather go back to it.
    title:       "Driftless Area",
    slug:        "the-driftless-area",
    year:        "2023",
    panelCols:   1,
    tile:        "img/tiles/the-driftless-area-scroll.webp",
    video:       "img/tiles/the-driftless-area-scroll.mp4",
    link:        "img/driftless-website.jpg",
    linkType:    "file",
    tags:        ["print"],
    inBook:      false,
    description: "Stylized land cover and elevation data for a sweeping wall map of the Driftless Area.",
    images:      [],
    awards:      []
  },
  {
    title:       "Minnesota State Fair Smellscape",
    slug:        "state-fair-smellscape",
    year:        "2025",
    panelCols:   2,
    tile:        "img/tiles/state-fair-smellscape.webp",
    video:       "",
    link:        "https://www.startribune.com/smells-of-the-minnesota-state-fair-create-a-festival-for-the-nose/601443971?utm_source=gift",
    linkType:    "story",
    tags:        ["print", "illustrated"],
    inBook:      true,
    description: "The landscape of smells — or, smellscape — of the Minnesota State Fair, " +
                 "where the aroma of roasting corn is as prominent as any mountain.",
    images:      [
      // both made from the CMYK original, img/smellscape.jpg, converted to screen
      // colors: the preview has its white margins cropped off; the full size is whole
      { src: "img/tiles/state-fair-smellscape-full.webp",
        full: "img/smellscape-fair.jpg" }                    // clicking it opens this
    ],
    awards:      []
  },
  {
    title:       "Slivers of an Ancient Forest",
    slug:        "slivers-of-an-ancient-forest",
    year:        "2021",
    panelCols:   3,
    tile:        "img/tiles/slivers-of-an-ancient-forest.webp",   // 5:4 crop for the grid
    video:       "",
    link:        "img/slivers-of-an-ancient-forest-sml.png",   // full-size map (6375 x 4125)
    linkType:    "file",
    tags:        ["print", "illustrated", "outdoors"],
    inBook:      false,
    description: "The Northwoods are as fundamental to the cultural identity of the Upper Midwest as lakes and mosquitos. I made this National Geographic-inspired poster map for GEOG 370: Intro to Cartography. It tells the story of what the Northwoods used to be, as well as what they might one day become.",
    images:      ["img/tiles/slivers-of-an-ancient-forest-full.webp"],   // the whole map, uncropped
    awards:      [
      "CaGIS Arthur Robinson Award for best print map, 2021",
      "Featured in the NACIS <em>Atlas of Design</em>, Vol. VI",
      "Winner in Research, NACIS Student Map &amp; Poster Competition, 2022",
      "Barbara Petchenik Award, best graduate student map, UW&ndash;Madison, 2021&ndash;22"
    ]
  },
  {
    title:       "22, A Map",
    slug:        "22-a-map",
    year:        "2022",
    panelCols:   2,
    tile:        "img/tiles/22-a-map.webp",
    video:       "img/tiles/22-a-map.mp4",
    link:        "22map.html",
    linkType:    "page",
    tags:        ["interactive", "scrollytelling"],
    inBook:      false,
    description: "A Mapbox-inspired journey through the aesthetic universe of Bon Iver’s " +
                 "<em>22, A Million</em>.",
    scatter:     true,                            // the glyphs, loosely scattered rather than framed
    images:      [                                 // the glyphs between the story's sections, in order
      { src: "img/dude-01.svg", zoom: false },
      { src: "img/fireball-01.svg", zoom: false },
      { src: "img/weed-01.svg", zoom: false },
      { src: "img/twoface-01.svg", zoom: false },
      { src: "img/fingers-01.svg", zoom: false },
      { src: "img/turnblue-01.svg", zoom: false }
    ],
    awards:      []
  },
  {
    // One tile for nine WSJ maps. The video crossfades through all nine, built
    // from Jake's 5:4 crops in img/tiles/WSJ tile/. The panel shows three of
    // them as a mosaic and links every story.
    title:       "Work for the Wall Street Journal",
    slug:        "wall-street-journal",
    year:        "2023",
    panelCols:   3,
    tile:        "img/tiles/wall-street-journal.webp",
    video:       "img/tiles/wall-street-journal.mp4",
    link:        "",
    linkType:    "story",
    tags:        ["news", "scrollytelling"],
    inBook:      false,
    description: "I designed 42 maps on deadline in collaboration with reporters and editors around the world, covering events such as the war in Ukraine, the Maui wildfires, and the Titan submersible.",
    images:      [
      "img/tiles/lahaina-wildfire.webp",
      // looping videos made from the original GIFs; clicking one opens its story
      { src: "img/tiles/ring-of-fire-loop.mp4", label: "Ring of Fire mining conflict",
        link: "https://www.wsj.com/world/americas/minerals-nickel-batteries-canada-climate-carbon-376f11fd" },
      { src: "img/tiles/red-sea-oil-spill-loop.mp4", label: "Red Sea oil spill",
        link: "https://www.wsj.com/articles/the-race-to-avert-an-oil-spill-that-could-cost-20-billion-to-fix-85a884ea" },
      "img/tiles/titan-submersible.webp",
      "img/tiles/strait-of-messina-bridge.webp"
    ],
    links:       [
      { label: "Maui wildfires", url: "https://www.wsj.com/articles/why-maui-wildfires-hawaii-devastating-84651f12" },
      { label: "Ring of Fire mining conflict", url: "https://www.wsj.com/world/americas/minerals-nickel-batteries-canada-climate-carbon-376f11fd" },
      { label: "Titan submersible search", url: "https://www.wsj.com/articles/missing-titan-submersible-search-map-22c882f?mod=Searchresults_pos20&page=1" },
      { label: "War in Ukraine", url: "https://www.wsj.com/story/the-strategic-importance-of-the-russia-controlled-land-bridge-in-ukraine-832d0728?mod=hp_lead_pos7" },
      { label: "Red Sea oil spill", url: "https://www.wsj.com/articles/the-race-to-avert-an-oil-spill-that-could-cost-20-billion-to-fix-85a884ea" },
      { label: "Mountain Valley Pipeline", url: "https://www.wsj.com/articles/they-fought-a-pipeline-on-their-land-then-congress-got-involved-95c4870f?mod=Searchresults_pos1&page=1" },
      { label: "Strait of Messina bridge", url: "https://www.wsj.com/articles/italy-says-it-will-build-the-longest-suspension-bridge-in-the-world-dont-hold-your-breath-71b7cc86" },
      { label: "Alaska LNG project", url: "https://www.wsj.com/articles/u-s-allies-in-asia-snub-natural-gas-from-alaska-project-e54f754a?mod=Searchresults_pos1&page=1" }
    ],
    awards:      []
  },
  {
    // One tile for both Uptown stories: the call-out where readers drew their
    // boundaries, and the results. The tile video shows the drawing animation
    // at full width, with the basemap's gray (#EDEDED) above and below to make it 5:4.
    title:       "Where is Uptown?",
    slug:        "where-is-uptown",
    year:        "2025",
    panelCols:   3,
    mediaHalf:   true,                            // the pictures take half the panel and fill it
    tile:        "img/tiles/where-is-uptown.webp",
    video:       "img/tiles/where-is-uptown.mp4",
    link:        "",
    linkType:    "story",
    tags:        ["news", "interactive", "print"],
    inBook:      true,
    description: "A crowdsourced community geography story about Minneapolis’s most " +
                 "argued-over district. Or, neighborhood? Maybe vibe?",
    images:      [
      { src: "img/tiles/uptown-results-full.webp", label: "Uptown results",
        link: "https://www.startribune.com/we-asked-where-uptown-is-and-2000-of-you-responded-heres-what-you-declared/601413699" },
      { src: "img/tiles/uptown-book.webp", inBook: true }   // the book version (from img/uptown.jpg)
    ],
    links:       [
      { label: "Where is Uptown?", url: "https://www.startribune.com/where-is-uptown-help-us-settle-the-debate-by-drawing-your-boundaries/601438173" },
      { label: "Uptown results", url: "https://www.startribune.com/we-asked-where-uptown-is-and-2000-of-you-responded-heres-what-you-declared/601413699" }
    ],
    awards:      [
      "Awards of Excellence in Infographics; Line of Coverage; and Use of Multimedia " +
      "and Design Elements, Society for News Design, 2026. It contributed to a " +
      "portfolio Bronze Medal for my excellent editor, C.J. Sinner."
    ]
  },
  {
    title:       "The Legacy Tree",
    slug:        "legacy-tree",
    year:        "2024",
    panelCols:   3,
    tile:        "img/tiles/legacy-tree.webp",
    video:       "img/tiles/legacy-tree.mp4",
    link:        "https://www.startribune.com/ancient-legacy-tree-boundary-waters-minnesota-climate-change/600360250/",
    linkType:    "story",
    tags:        ["news", "climate"],
    inBook:      false,
    description: "A quest through time in a warming wilderness to find the oldest living tree in Minnesota.",
    images:      [                                 // clicking a photo opens it on its own
      { src: "img/tiles/legacy-tree-cedar.webp" },   // the cedar
      { src: "img/tiles/legacy-tree-dogs.webp" },    // sled dogs
      { src: "img/tiles/legacy-tree-sled.webp" },    // mushing across the ice
      // the article's two maps (fire history, logging), lined up and alternating;
      // top: true puts it across the top of the mosaic
      { src: "img/tiles/legacy-tree-maps-loop.mp4", top: true }
    ],
    credit:      "Photos by Anthony Soufflé",
    awards:      []
  },
  {
    // The tile video loops three clips from the ICECLIMB folder (Jan. 2025),
    // center-cropped to 5:4: hero-square (the climb), ice-square (the top)
    // and descent-square (lowering off), with 0.6s crossfades between them
    // and back to the start, so it loops seamlessly; sped up 1.25x and
    // scaled to 640x512. 25s, 1.8 MB.
    title:       "Outdoor tales told in the Star Tribune",
    slug:        "outdoor-tales",
    year:        "2023–2026",
    panelCols:   2,
    tile:        "img/tiles/ice-climbing.webp",
    video:       "img/tiles/ice-climbing.mp4",
    link:        "",                              // no button: the stories are listed instead
    linkType:    "story",
    tags:        ["news", "scrollytelling", "outdoors"],
    inBook:      false,
    description: "Stories about the people and places of the North.",
    images:      [                                 // one photo per story: the kayaks full height, the rest beside
      { src: "img/tiles/urban-paddling-mississippi.webp", tall: true, credit: "Photo by Aaron Levinsky" },
      { src: "img/tiles/outdoor-ice-climb.webp", credit: "Photo by Anthony Soufflé" },
      { src: "img/tiles/legacy-tree-sled.webp", credit: "Photo by Anthony Soufflé" },
      { src: "img/tiles/outdoor-midwest-mountaineering.webp", credit: "Photo by Jeff Wheeler" }
    ],
    links:       [
      { label: "Urban Paddling Guide", url: "https://www.startribune.com/canoe-kayak-paddleboard-minnesota-twin-cities-metro-paddling-guide/601346521" },
      { label: "Ice climbing", url: "https://www.startribune.com/flying-shards-and-screaming-barfies-ice-climbing-is-thrilling-and-excruciating/601208711" },
      { label: "The Legacy Tree", url: "https://www2.startribune.com/ancient-legacy-tree-boundary-waters-minnesota-climate-change/600360250/" },
      { label: "Midwest Mountaineering", url: "https://www.startribune.com/midwest-mountaineering-was-more-than-just-a-store-and-losing-it-matters/600314102" }
    ],
    awards:      []
  },
  {
    // All images come from the CMYK print map (OneDrive: Personal/Portfolio/
    // east_river_website.jpg), converted to screen colors with its SWOP profile.
    // The tile is a 5:4 crop around the flood area along the East River.
    title:       "East River Flood Study",
    slug:        "east-river-flood-study",
    year:        "2022",
    panelCols:   2,
    tile:        "img/tiles/east-river-flood-study.webp",
    video:       "",
    link:        "https://east-river-collaborative.tnc.org/pages/maps-data",
    linkType:    "project",
    tags:        ["print", "climate"],
    inBook:      false,
    description: "I designed a series of 9 maps for The Nature Conservancy and Wisconsin Sea " +
                 "Grant to communicate about flood risk in the Green Bay area.",
    images:      [
      // a crop of the map around the flood area, the same shape as the photo so
      // the two show at the same size; clicking opens the whole map (3300px)
      { src: "img/tiles/east-river-map-crop.webp", full: "img/east-river-flood-map.jpg" },
      { src: "img/tiles/east-river-evers.webp", full: "img/east-river-evers.jpg",
        label: "Wisconsin Gov. Tony Evers photographed admiring my maps.", captionAbove: true, captionStar: true }
    ],
    awards:      []
  },
  {
    title:       "Election Results",
    slug:        "2024-election-in-minnesota",
    year:        "2023–2026",
    panelCols:   2,
    tile:        "img/tiles/2024-election-in-minnesota.webp",
    video:       "img/tiles/2024-election-in-minnesota.mp4",
    link:        "",                              // no button: the pictures link to the full-size files
    linkType:    "file",
    tags:        ["news", "print", "interactive"],
    inBook:      false,
    description: "Mapping the results of local, state and national elections for the Star Tribune.",
    images:      [
      { src: "img/tiles/election-results-page.webp",      // the 2024 presidential results page
        full: "img/Strib_election.pdf" },                  // clicking it opens the PDF
      { src: "img/tiles/election-results-st-paul.webp",   // 2025 Minneapolis and St. Paul mayoral races
        full: "img/st_paul_election.png" }
    ],
    awards:      []
  },
  {
    // The video pans slowly down the full page (img/urban_paddling.jpg) and
    // back up, like the Driftless tile. The old static thumbnail is still at
    // img/tiles/urban-paddling-guide.webp
    title:       "Urban Paddling Guide",
    slug:        "urban-paddling-guide",
    year:        "2025",
    panelCols:   2,
    tile:        "img/tiles/urban-paddling-guide-scroll.webp",
    video:       "img/tiles/urban-paddling-guide-scroll.mp4",
    link:        "https://www.startribune.com/canoe-kayak-paddleboard-minnesota-twin-cities-metro-paddling-guide/601346521?utm_source=gift",
    linkType:    "story",
    tags:        ["print", "outdoors"],
    inBook:      false,
    description: "A guide to 13 of the best paddling routes in the Twin Cities. I scouted and " +
                 "authored guides to most of the routes, and mapped them all.",
    images:      [                                 // the kayaks full height, the other two beside
      { src: "img/tiles/urban-paddling-mississippi.webp", tall: true,   // kayaks below downtown Minneapolis
        credit: "Photo by Aaron Levinsky" },
      { src: "img/tiles/urban-paddling-shore.webp",    // landing the canoe at dusk
        credit: "Photo by Anthony Soufflé" },
      { src: "img/tiles/urban-paddling-river.webp",    // on the river (border trimmed off)
        credit: "Photo by Anthony Soufflé" }
    ],
    awards:      [
      "Silver Medal for Story Page Design, Society for News Design, 2026. " +
      "Primary page design by Anna Boone."
    ]
  },
  {
    title:       "The Life and Death of the Great Lakes Pipeline",
    slug:        "great-lakes-pipeline",
    year:        "2023",
    panelCols:   3,
    tile:        "img/tiles/great-lakes-pipeline.webp",
    video:       "img/tiles/great-lakes-pipeline.mp4",
    link:        "pipeline.html",
    linkType:    "page",
    tags:        ["scrollytelling", "climate"],
    inBook:      false,
    description: "Taking place in the all-too-near future, this piece of speculative fiction I made for " +
                 "Rob Roth’s Graphic Design in Cartography course tells the story of a pipeline that " +
                 "exports water from the Great Lakes to an increasingly thirsty world.",
    images:      [{ src: "img/tiles/great-lakes-pipeline-superior.webp",   // light version for the panel
                    full: "img/lake_superior-7-01.jpg" }],                 // clicking it opens the original
    awards:      [
      "Best student map, Wisconsin Land Information Association, 2023"
    ]
  },
  {
    title:       "How does 2024’s weather compare with your childhood’s?",
    slug:        "2024-weather",
    year:        "2025",
    panelCols:   2,
    tile:        "img/tiles/2024-weather.webp",
    video:       "",
    link:        "https://www.startribune.com/how-does-2024s-weather-compare-with-your-childhood/601202878",
    linkType:    "story",
    tags:        ["news", "interactive", "climate"],
    inBook:      false,
    description: "An interactive story that puts data behind the feeling that 2024’s weather " +
                 "wasn’t like you remember it being when you were growing up.",
    images:      [],
    awards:      [
      { award:   "Best Infographic/Data Visualization, Minnesota Society of Professional Journalists, 2026. " +
                 "Shared with Bryan Brussee and Mark Boswell.",
        quote:   "“This is a brilliant way to take what’s otherwise a distant international issue and " +
                 "puts it in stark personal terms, with engaging imagery and functionality.”",
        quoteBy: "Judge’s comments" }
    ]
  },
  {
    title:       "Snowfall Tracker",
    slug:        "snowfall-tracker",
    year:        "2023–2026",
    panelCols:   1,
    tile:        "img/tiles/snowfall-tracker.webp",
    video:       "",
    link:        "https://www.startribune.com/see-how-much-snow-has-or-hasnt-fallen-this-winter/600339679/?refresh=true",
    linkType:    "story",
    tags:        ["news", "interactive", "climate"],
    inBook:      false,
    description: "A seasonal data viz dashboard that tracks and compares annual snowfall accumulation.",
    images:      [],
    awards:      []
  },
  {
    title:       "Projection Trading Card",
    slug:        "projection-trading-card",
    year:        "2022",
    panelCols:   1,
    tile:        "img/tiles/projection-trading-card.webp",
    video:       "",
    link:        "",                              // no button: click the card to open it full size
    linkType:    "file",
    tags:        ["print"],
    inBook:      false,
    description: "A retro video game design I contributed to Daniel Huffman&rsquo;s " +
                 "<a href=\"https://somethingaboutmaps.wordpress.com/2023/09/26/the-projection-collection-returns/\" target=\"_blank\" rel=\"noopener\">Projection Collection</a>.",
    images:      ["img/tiles/projection-trading-card-full.webp"],   // the whole card, uncropped
    awards:      []
  },
  {
    // A seasonal series; one tile for all three stories. The video
    // crossfades through five hikes from Fall 2024, built from Jake's 5:4
    // crops in img/tiles/Fall Hikes tile/ (same recipe as the WSJ tile).
    title:       "Best places to hike",
    slug:        "fall-hikes",
    year:        "2024–2026",
    panelCols:   2,
    tile:        "img/tiles/fall-hikes.webp",
    video:       "img/tiles/fall-hikes.mp4",
    link:        "",
    linkType:    "story",
    tags:        ["interactive", "outdoors"],
    inBook:      false,
    description: "A seasonal feature for the Star Tribune spotlighting the best places to be outside.",
    // one map from each story; its label underneath links to the story, and
    // clicking the map opens it full size
    images:      [
      { src: "img/tiles/hikes-fall-2024.webp", label: "Fall 2024",       // Tettegouche State Park
        story: "https://www.startribune.com/minnesota-hike-fall-colors-north-shore-state-parks/601143123" },
      { src: "img/tiles/hikes-spring-2026.webp", label: "Spring 2026",   // Mariner Mountain Park, Silver Bay
        story: "https://www.startribune.com/eight-minnesota-hikes-that-sing-of-spring/601637574" },
      { src: "img/tiles/hikes-fall-2026.webp", label: "Fall 2026",
        story: "https://www.startribune.com/8-minnesota-hikes-to-fall-for-this-autumn/601883249" }
    ],
    awards:      []
  }
];
