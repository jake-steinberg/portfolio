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
   Selecting several pills narrows the grid to projects that have ALL of them.
   ----------------------------------------------------------------------------- */
const TAGS = [
  { id: "print", label: "Print" },
  { id: "interactive", label: "Interactive" },
  { id: "scrollytelling", label: "Scrollytelling" },
  { id: "3d", label: "3D" },
  { id: "illustrated", label: "Illustrated" },
  { id: "news", label: "News" },
  { id: "remote-sensing", label: "Remote sensing" },
  { id: "outdoors", label: "Outdoors" }
];


/* -----------------------------------------------------------------------------
   PROJECTS — one { ... } block per tile.

   To add a project, copy this template to wherever you want it in the list:

   {
     title:       "Project name",              // shown under the tile and in the panel
     slug:        "project-name",              // unique id, lowercase-with-dashes
     tile:        "img/tiles/project-name.webp", // the grid image — 5:4, about 1000x800
     video:       "",                          // optional looping .mp4; the tile image
                                               //   becomes its poster frame. "" for none
     link:        "https://...",               // where the panel's main button goes
     linkType:    "story",                     // "story" — a published story (opens in a new tab)
                                               // "page"  — one of your own pages, e.g. "22map.html"
                                               // "file"  — a full-size image, shown in the lightbox
     tags:        ["print", "news"],           // any number of ids from TAGS above
     inBook:      false,                       // true adds the "In the book" corner marker
     description: "",                          // a sentence or two for the panel.
                                               //   Left "" → the panel shows a placeholder
     images:      [],                          // extra pictures for the panel, e.g.
                                               //   ["img/foo-detail.webp", "img/foo-2.webp"]
                                               //   1 fills its column, uncropped. 2 sit side by
                                               //   side at matching heights. 3 make a mosaic: the
                                               //   widest on top, the others side by side under
                                               //   it. All uncropped. 4 or more show as even 4:3
                                               //   thumbnails.
                                               //   Clicking a picture enlarges it. To open a
                                               //   story instead, write it as
                                               //   { src: "img/…", link: "https://…", label: "Story name" }
                                               //   An .mp4 plays as a silent loop; put a .webp
                                               //   of the same name (minus "-loop") beside it
                                               //   for its still poster.
                                               //   Left [] → the panel is text only
     links:       [],                          // optional list of stories, for a project that
                                               //   spans several. Each: { label: "…", url: "…" }.
                                               //   Set link: "" to drop the single main button
     awards:      []                           // lines shown with a star in the panel.
                                               //   HTML is allowed: "<em>Atlas of Design</em>"
   },

   Notes
   - inBook is only true for State Fair Smellscape so far.
   - Tags were a first pass. Scrollytelling vs. Interactive especially is a guess.
   ----------------------------------------------------------------------------- */
const PROJECTS = [
  {
    title:       "State Fair Smellscape",
    slug:        "state-fair-smellscape",
    tile:        "img/tiles/state-fair-smellscape.webp",
    video:       "",
    link:        "https://www.startribune.com/smells-of-the-minnesota-state-fair-create-a-festival-for-the-nose/601443971?utm_source=gift",
    linkType:    "story",
    tags:        ["print", "illustrated", "news"],
    inBook:      true,
    description: "",
    images:      [],
    awards:      []
  },
  {
    // One tile for both Uptown stories: the call-out where readers drew their
    // boundaries, and the results. The tile video shows the drawing animation
    // at full width, with white above and below to make it 5:4.
    title:       "Where is Uptown?",
    slug:        "where-is-uptown",
    tile:        "img/tiles/where-is-uptown.webp",
    video:       "img/tiles/where-is-uptown.mp4",
    link:        "",
    linkType:    "story",
    tags:        ["interactive", "news"],
    inBook:      false,
    description: "",
    images:      [
      { src: "img/tiles/uptown-draw-loop.mp4", label: "Where is Uptown?",
        link: "https://www.startribune.com/where-is-uptown-help-us-settle-the-debate-by-drawing-your-boundaries/601438173" },
      { src: "img/tiles/uptown-results-full.webp", label: "Uptown results",
        link: "https://www.startribune.com/we-asked-where-uptown-is-and-2000-of-you-responded-heres-what-you-declared/601413699" }
    ],
    links:       [
      { label: "Where is Uptown?", url: "https://www.startribune.com/where-is-uptown-help-us-settle-the-debate-by-drawing-your-boundaries/601438173" },
      { label: "Uptown results", url: "https://www.startribune.com/we-asked-where-uptown-is-and-2000-of-you-responded-heres-what-you-declared/601413699" }
    ],
    awards:      []
  },
  {
    title:       "2024 Election in Minnesota",
    slug:        "2024-election-in-minnesota",
    tile:        "img/tiles/2024-election-in-minnesota.webp",
    video:       "img/tiles/2024-election-in-minnesota.mp4",
    link:        "img/Strib_election.pdf",
    linkType:    "file",
    tags:        ["print", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    // The video pans slowly down the full page (img/urban_paddling.jpg) and
    // back up, like the Driftless tile. The old static thumbnail is still at
    // img/tiles/urban-paddling-guide.webp
    title:       "Urban Paddling guide",
    slug:        "urban-paddling-guide",
    tile:        "img/tiles/urban-paddling-guide-scroll.webp",
    video:       "img/tiles/urban-paddling-guide-scroll.mp4",
    link:        "https://www.startribune.com/canoe-kayak-paddleboard-minnesota-twin-cities-metro-paddling-guide/601346521?utm_source=gift",
    linkType:    "story",
    tags:        ["print", "illustrated", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Rincon Mountains",
    slug:        "rincon-mountains",
    tile:        "img/tiles/rincon-mountains.webp",
    video:       "",
    link:        "img/rincon.png",
    linkType:    "file",
    tags:        ["3d", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "2025 Iditarod",
    slug:        "2025-iditarod",
    tile:        "img/tiles/2025-iditarod.webp",
    video:       "",
    link:        "https://www.startribune.com/duluths-emily-ford-faces-her-toughest-winter-adventure-yet-alaskas-famed-iditarod/601225462",
    linkType:    "story",
    tags:        ["news", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Legacy Tree",
    slug:        "legacy-tree",
    tile:        "img/tiles/legacy-tree.webp",
    video:       "img/tiles/legacy-tree.mp4",
    link:        "https://www.startribune.com/ancient-legacy-tree-boundary-waters-minnesota-climate-change/600360250/",
    linkType:    "story",
    tags:        ["scrollytelling", "news", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Snowfall Tracker",
    slug:        "snowfall-tracker",
    tile:        "img/tiles/snowfall-tracker.webp",
    video:       "",
    link:        "https://www.startribune.com/see-how-much-snow-has-or-hasnt-fallen-this-winter/600339679/?refresh=true",
    linkType:    "story",
    tags:        ["interactive", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "2024 Weather",
    slug:        "2024-weather",
    tile:        "img/tiles/2024-weather.webp",
    video:       "",
    link:        "https://www.startribune.com/how-does-2024s-weather-compare-with-your-childhood/601202878",
    linkType:    "story",
    tags:        ["news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    // The video crossfades through five hikes, built from Jake's 5:4 crops
    // in img/tiles/Fall Hikes tile/ (same recipe as the WSJ tile).
    title:       "Fall Hikes",
    slug:        "fall-hikes",
    tile:        "img/tiles/fall-hikes.webp",
    video:       "img/tiles/fall-hikes.mp4",
    link:        "https://www.startribune.com/minnesota-hike-fall-colors-north-shore-state-parks/601143123",
    linkType:    "story",
    tags:        ["interactive", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "The Driftless Area",
    slug:        "the-driftless-area",
    // The video scrolls down the full-size map and back up (48s loop), zoomed
    // 3x on the middle third of the map's width, stopping short of the bottom
    // 10%. The tile is its first frame.
    // The old static thumbnail is still at img/tiles/the-driftless-area.webp
    // if you'd rather go back to it.
    tile:        "img/tiles/the-driftless-area-scroll.webp",
    video:       "img/tiles/the-driftless-area-scroll.mp4",
    link:        "img/driftless-website.jpg",
    linkType:    "file",
    tags:        ["print", "3d", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Slivers of an Ancient Forest",
    slug:        "slivers-of-an-ancient-forest",
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
    tile:        "img/tiles/22-a-map.webp",
    video:       "img/tiles/22-a-map.mp4",
    link:        "22map.html",
    linkType:    "page",
    tags:        ["interactive", "illustrated"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "The Life and Death of the Great Lakes Pipeline",
    slug:        "great-lakes-pipeline",
    tile:        "img/tiles/great-lakes-pipeline.webp",
    video:       "img/tiles/great-lakes-pipeline.mp4",
    link:        "pipeline.html",
    linkType:    "page",
    tags:        ["scrollytelling", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      [
      "Best student map, Wisconsin Land Information Association, 2023"
    ]
  },
  {
    title:       "Projection Trading Card",
    slug:        "projection-trading-card",
    tile:        "img/tiles/projection-trading-card.webp",
    video:       "",
    link:        "img/projection-card.jpg",
    linkType:    "file",
    tags:        ["print", "illustrated"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    // One tile for nine WSJ maps. The video crossfades through all nine, built
    // from Jake's 5:4 crops in img/tiles/WSJ tile/. The panel shows three of
    // them as a mosaic and links every story.
    title:       "Work for Wall Street Journal",
    slug:        "wall-street-journal",
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
        link: "https://www.wsj.com/articles/the-race-to-avert-an-oil-spill-that-could-cost-20-billion-to-fix-85a884ea" }
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
  }
];
