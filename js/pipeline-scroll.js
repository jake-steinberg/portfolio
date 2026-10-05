/* =============================================================================
   pipeline-scroll.js — the scrollytelling for pipeline.html only.
   (22map.html keeps using the original js/scrollmap.js.)

   HOW A SECTION WORKS (in pipeline.html)
     <div class="scroll-container">
       <div class="background-item">             ← the maps, stacked on top of each other
         <img data-slide="0" class="on" …>        ← shown first
         <img data-slide="3" …>                   ← shown once text box 3 is on screen
       </div>
       <div class="foreground-item">              ← the text boxes, one per .row,
         <div class="row">…</div>                 ←   numbered from 0
       </div>
     </div>

   A map's data-slide is the number of the text box that brings it in. As the
   reader scrolls, the latest text box to come fully onto the screen picks the
   map: the one with the highest data-slide that isn't past it. Exactly one
   map per section has the class "on"; the CSS crossfades between them.

   Unlike the original script, this works out the map from scratch on every
   scroll (once per frame), so it stays right after a fast flick, a reload
   partway down or "Back to top", and it only reads the layout, never
   changes it while scrolling.
   ============================================================================= */
(function () {

  /* ---------------------------------------------------------------------------
     Set up each section once: its maps (in slide order) and its text boxes.
     --------------------------------------------------------------------------- */
  const sections = [...document.querySelectorAll('.scroll-container')].map((container) => {
    const background = container.querySelector(':scope > .background-item');
    const foreground = container.querySelector(':scope > .foreground-item');
    if (!background || !foreground) return null;
    const maps = [...background.querySelectorAll(':scope > img')]
      .map((img) => ({ img, slide: Number(img.dataset.slide || 0) }))
      .sort((a, b) => a.slide - b.slide);
    const rows = [...foreground.children].filter((el) => el.nodeName === 'DIV');
    return { container, background, maps, rows, shown: null };
  }).filter(Boolean);


  /* ---------------------------------------------------------------------------
     Show the right map in each section for where the page is scrolled.
     --------------------------------------------------------------------------- */
  function update() {
    const screenBottom = window.innerHeight;
    sections.forEach((s) => {
      // the last text box whose bottom edge has come onto the screen (-1: none yet)
      let reached = -1;
      s.rows.forEach((row, i) => {
        if (row.getBoundingClientRect().bottom <= screenBottom) reached = i;
      });
      // the map for it: the last one whose slide number isn't past that box
      let pick = s.maps[0];
      s.maps.forEach((m) => { if (m.slide <= reached) pick = m; });

      if (pick !== s.shown) {
        s.maps.forEach((m) => m.img.classList.toggle('on', m === pick));
        s.shown = pick;
      }
    });
  }

  // once per frame at most, however many scroll events arrive
  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  }


  /* ---------------------------------------------------------------------------
     "Tall" sections (class="background-item tall"): the maps are long and only
     their tops show while the text scrolls. Leave room after the section so
     its last map can scroll up into view in full once the text is done.
     --------------------------------------------------------------------------- */
  function makeRoomForTallMaps() {
    sections.forEach((s) => {
      if (!s.background.classList.contains('tall')) return;
      const last = s.maps[s.maps.length - 1].img;
      // the map's height at this width, from its width/height attributes, so
      // this works before the image has even loaded
      const ratio = (last.naturalHeight / last.naturalWidth) || (last.getAttribute('height') / last.getAttribute('width'));
      const mapHeight = s.background.clientWidth * ratio;
      s.container.style.marginBottom = Math.max(0, mapHeight - s.background.clientHeight) + 'px';
    });
  }


  /* ---------------------------------------------------------------------------
     Layout helpers kept from the original scrollmap.js
     --------------------------------------------------------------------------- */
  // a .right text box next to a .left one sits inline beside it
  function rightPosition() {
    document.querySelectorAll('.right').forEach((div) => {
      const besideLeft = [...div.parentNode.children].some((el) => el.classList.contains('left'));
      if (besideLeft) {
        div.classList.remove('right');
        div.classList.add('right-inline');
      }
    });
    document.querySelectorAll('.full-width').forEach((div) => { div.parentNode.style.padding = 0; });
  }

  // center the title block vertically within its full-screen box
  function positionTitle() {
    const title = document.querySelector('.title');
    if (!title || !title.firstElementChild) return;
    let contentHeight = 0;
    [...title.children].forEach((child) => { contentHeight += child.clientHeight; });
    title.firstElementChild.style.marginTop = (title.clientHeight - contentHeight) / 2 + 'px';
  }


  /* ---------------------------------------------------------------------------
     Start, and redo the layout when the window changes size
     --------------------------------------------------------------------------- */
  function layout() {
    rightPosition();
    positionTitle();
    makeRoomForTallMaps();
    update();
  }

  layout();                                            // the script loads at the end of the page
  window.addEventListener('load', layout);             // again once fonts and images are in
  window.addEventListener('resize', layout);
  document.addEventListener('scroll', onScroll, { passive: true });
})();
