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
                                               // "page"  — one of your own pages, e.g. "trees.html"
                                               // "file"  — a full-size image, shown in the lightbox
     tags:        ["print", "news"],           // any number of ids from TAGS above
     inBook:      false,                       // true adds the "In the book" corner marker
     description: "",                          // a sentence or two for the panel.
                                               //   Left "" → the panel shows a placeholder
     images:      [],                          // extra pictures for the panel, e.g.
                                               //   ["img/foo-detail.webp", "img/foo-2.webp"]
                                               //   Left [] → the panel is text only
     awards:      []                           // lines shown with a star in the panel.
                                               //   HTML is allowed: "<em>Atlas of Design</em>"
   },

   Notes
   - inBook is only true for State Fair Smellscape so far. Other likely book
     chapters to check: Urban Sprawl in the Twin Cities, How Minneapolis Got
     Over Golf, Bryn Mawr.
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
    title:       "Where is Uptown?",
    slug:        "where-is-uptown",
    tile:        "img/tiles/where-is-uptown.webp",
    video:       "img/tiles/where-is-uptown.mp4",
    link:        "https://www.startribune.com/where-is-uptown-help-us-settle-the-debate-by-drawing-your-boundaries/601438173",
    linkType:    "story",
    tags:        ["interactive", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Uptown results",
    slug:        "uptown-results",
    tile:        "img/tiles/uptown-results.webp",
    video:       "",
    link:        "https://www.startribune.com/we-asked-where-uptown-is-and-2000-of-you-responded-heres-what-you-declared/601413699",
    linkType:    "story",
    tags:        ["news"],
    inBook:      false,
    description: "",
    images:      [],
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
    title:       "Urban Paddling guide",
    slug:        "urban-paddling-guide",
    tile:        "img/tiles/urban-paddling-guide.webp",
    video:       "",
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
    tile:        "img/tiles/the-driftless-area.webp",
    video:       "",
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
    tile:        "img/tiles/slivers-of-an-ancient-forest.webp",
    video:       "",
    link:        "trees.html",
    linkType:    "page",
    tags:        ["print", "illustrated", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
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
    title:       "Cloud Peak Wilderness",
    slug:        "cloud-peak-wilderness",
    tile:        "img/tiles/cloud-peak-wilderness.webp",
    video:       "",
    link:        "img/bighorns-website.png",
    linkType:    "file",
    tags:        ["print", "3d", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Dark Sky Sanctuaries",
    slug:        "dark-sky-sanctuaries",
    tile:        "img/tiles/dark-sky-sanctuaries.webp",
    video:       "img/tiles/dark-sky-sanctuaries.mp4",
    link:        "https://jake-steinberg.github.io/2022_DarkSkies_js/",
    linkType:    "story",
    tags:        ["interactive", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      [
      "Winner, NACIS Student Dynamic Map Competition, 2022 &mdash; with Aileen Clarke and Austin Novak"
    ]
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
    title:       "Urban Sprawl in the Twin Cities",
    slug:        "urban-sprawl-in-the-twin-cities",
    tile:        "img/tiles/urban-sprawl-in-the-twin-cities.webp",
    video:       "img/tiles/urban-sprawl-in-the-twin-cities.mp4",
    link:        "https://jake-steinberg.github.io/Twin-Cities-Sprawl/",
    linkType:    "story",
    tags:        ["scrollytelling", "news", "remote-sensing"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
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
    title:       "The Mesabi Trail",
    slug:        "the-mesabi-trail",
    tile:        "img/tiles/the-mesabi-trail.webp",
    video:       "",
    link:        "https://www.startribune.com/mesabi-bike-trail-electric-bikes-iron-range-minnesota/601158947?utm_source=gift",
    linkType:    "story",
    tags:        ["print", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Paddlers",
    slug:        "paddlers",
    tile:        "img/tiles/paddlers.webp",
    video:       "",
    link:        "https://www.startribune.com/beyond-wilderness-the-epic-paddle-that-took-two-men-from-minnesota-to-the-arctic-ocean/601148229",
    linkType:    "story",
    tags:        ["outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "From One to All",
    slug:        "from-one-to-all",
    tile:        "img/tiles/from-one-to-all.webp",
    video:       "",
    link:        "https://www2.startribune.com/a-history-of-st-paul-women-on-the-city-council/600330010/",
    linkType:    "story",
    tags:        ["scrollytelling", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      [
      "First place, local reporting &mdash; Minnesota SPJ Page One Award, 2025 &mdash; with Anna Boone and Katie Galioto"
    ]
  },
  {
    title:       "Minnesota's Deepest Lake",
    slug:        "minnesotas-deepest-lake",
    tile:        "img/tiles/minnesotas-deepest-lake.webp",
    video:       "",
    link:        "https://www.startribune.com/minnesota-deepest-lake-iron-mines-cuyuna-range/600322085/",
    linkType:    "story",
    tags:        ["news", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "State of Turkeys",
    slug:        "state-of-turkeys",
    tile:        "img/tiles/state-of-turkeys.webp",
    video:       "",
    link:        "https://www.startribune.com/turkeys-minnesota-rank-number-one-producer/600320510/",
    linkType:    "story",
    tags:        ["news", "outdoors"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "How Minneapolis Got Over Golf",
    slug:        "how-minneapolis-got-over-golf",
    tile:        "img/tiles/how-minneapolis-got-over-golf.webp",
    video:       "img/tiles/how-minneapolis-got-over-golf.mp4",
    link:        "golf.html",
    linkType:    "page",
    tags:        ["scrollytelling", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Lahaina Wildfire",
    slug:        "lahaina-wildfire",
    tile:        "img/tiles/lahaina-wildfire.webp",
    video:       "",
    link:        "https://www.wsj.com/articles/why-maui-wildfires-hawaii-devastating-84651f12",
    linkType:    "story",
    tags:        ["news", "remote-sensing"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Ring of Fire",
    slug:        "ring-of-fire",
    tile:        "img/tiles/ring-of-fire.webp",
    video:       "img/tiles/ring-of-fire.mp4",
    link:        "https://www.wsj.com/world/americas/minerals-nickel-batteries-canada-climate-carbon-376f11fd",
    linkType:    "story",
    tags:        ["scrollytelling", "3d", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Hawaii Wildfires",
    slug:        "hawaii-wildfires",
    tile:        "img/tiles/hawaii-wildfires.webp",
    video:       "",
    link:        "https://www.wsj.com/articles/why-maui-wildfires-hawaii-devastating-84651f12",
    linkType:    "story",
    tags:        ["news", "remote-sensing"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Red Sea Oil Spill",
    slug:        "red-sea-oil-spill",
    tile:        "img/tiles/red-sea-oil-spill.webp",
    video:       "img/tiles/red-sea-oil-spill.mp4",
    link:        "https://www.wsj.com/articles/the-race-to-avert-an-oil-spill-that-could-cost-20-billion-to-fix-85a884ea",
    linkType:    "story",
    tags:        ["scrollytelling", "news", "remote-sensing"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Strait of Messina Bridge",
    slug:        "strait-of-messina-bridge",
    tile:        "img/tiles/strait-of-messina-bridge.webp",
    video:       "",
    link:        "https://www.wsj.com/articles/italy-says-it-will-build-the-longest-suspension-bridge-in-the-world-dont-hold-your-breath-71b7cc86",
    linkType:    "story",
    tags:        ["3d", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Mountain Valley Pipeline",
    slug:        "mountain-valley-pipeline",
    tile:        "img/tiles/mountain-valley-pipeline.webp",
    video:       "",
    link:        "https://www.wsj.com/articles/they-fought-a-pipeline-on-their-land-then-congress-got-involved-95c4870f?mod=Searchresults_pos1&page=1",
    linkType:    "story",
    tags:        ["news", "remote-sensing"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Alaska LNG Project",
    slug:        "alaska-lng-project",
    tile:        "img/tiles/alaska-lng-project.webp",
    video:       "",
    link:        "https://www.wsj.com/articles/u-s-allies-in-asia-snub-natural-gas-from-alaska-project-e54f754a?mod=Searchresults_pos1&page=1",
    linkType:    "story",
    tags:        ["3d", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Titan Submersible",
    slug:        "titan-submersible",
    tile:        "img/tiles/titan-submersible.webp",
    video:       "",
    link:        "https://www.wsj.com/articles/missing-titan-submersible-search-map-22c882f?mod=Searchresults_pos20&page=1",
    linkType:    "story",
    tags:        ["3d", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Ukraine Land Bridge",
    slug:        "ukraine-land-bridge",
    tile:        "img/tiles/ukraine-land-bridge.webp",
    video:       "img/tiles/ukraine-land-bridge.mp4",
    link:        "https://www.wsj.com/story/the-strategic-importance-of-the-russia-controlled-land-bridge-in-ukraine-832d0728?mod=hp_lead_pos7",
    linkType:    "story",
    tags:        ["scrollytelling", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Bryn Mawr",
    slug:        "bryn-mawr",
    tile:        "img/tiles/bryn-mawr.webp",
    video:       "",
    link:        "img/brynMawr.png",
    linkType:    "file",
    tags:        ["print", "illustrated"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  },
  {
    title:       "Miles from Recovery",
    slug:        "miles-from-recovery",
    tile:        "img/tiles/miles-from-recovery.webp",
    video:       "img/tiles/miles-from-recovery.mp4",
    link:        "https://news.azpm.org/p/news-splash/2020/2/4/165432-miles-from-recovery-how-distance-and-stigma-keep-rural-arizonans-from-opioid-treatment/",
    linkType:    "story",
    tags:        ["scrollytelling", "news"],
    inBook:      false,
    description: "",
    images:      [],
    awards:      []
  }
];
