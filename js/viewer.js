/* =============================================================================
   viewer.js — the picture viewer for phones.

   On a phone, tapping a link to a picture opens the picture full screen here
   rather than in a new tab. It starts fitted to the screen; tap it to see it
   at full size and drag around, tap again to fit. Pinching zooms too. Close,
   Escape or the phone's Back button close it and put focus back on the link
   that opened it. On wider screens pictures still open in a new tab.
   Only links to pictures (.jpg .png .webp .gif .avif) open here; links to
   stories and PDFs work as before.

   A page turns it on for its own links with one line, after this file loads:
     Viewer.watch('.panel .pmedia a[href]');      // js/portfolio.js
   and asks it about Escape in its own key handler:
     if (Viewer.isOpen()) { Viewer.close(); return; }

   The look is in css/viewer.css (colors and fonts come from css/site.css).
   ============================================================================= */
const Viewer = (function () {

  const VIEWER_SCREENS = window.matchMedia('(max-width: 720px)');   // phones only
  const IS_PICTURE = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;
  let viewer = null, viewerFrom = null;   // the viewer (built on first use), and the link that opened it

  function buildViewer() {
    viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', 'Picture, full screen');
    viewer.innerHTML = `
      <div class="vscroll"><img alt=""></div>
      <button class="vclose" type="button">Close <span class="x" aria-hidden="true">&#215;</span></button>
      <p class="vhint">Tap to zoom</p>`;
    document.body.appendChild(viewer);
    const scroller = viewer.querySelector('.vscroll');
    const img = viewer.querySelector('img');
    viewer.querySelector('.vclose').addEventListener('click', () => history.back());   // popstate closes it
    img.addEventListener('click', (e) => {               // tap: full size, centred on where you tapped
      const zoom = !viewer.classList.contains('zoomed');
      const box = img.getBoundingClientRect();
      const fx = (e.clientX - box.left) / box.width, fy = (e.clientY - box.top) / box.height;
      viewer.classList.toggle('zoomed', zoom);
      if (zoom) {
        img.style.width = Math.max(img.naturalWidth, scroller.clientWidth * 2) + 'px';
        scroller.scrollLeft = fx * img.offsetWidth - scroller.clientWidth / 2;
        scroller.scrollTop = fy * img.offsetHeight - scroller.clientHeight / 2;
      } else {
        img.style.width = '';
      }
    });
  }

  function openViewer(link) {
    if (!viewer) buildViewer();
    viewerFrom = link;
    const img = viewer.querySelector('img');
    viewer.classList.remove('zoomed');
    img.style.width = '';
    img.src = link.href;
    // the picture's description: the link's own label, or else the alt
    // text of the thumbnail inside the link
    const thumb = link.querySelector('img');
    img.alt = link.getAttribute('aria-label') || (thumb && thumb.alt) || '';
    viewer.classList.add('on');
    document.documentElement.classList.add('viewing');   // stops the page scrolling behind it
    history.pushState({ viewer: true }, '');               // so Back closes it
    viewer.querySelector('.vclose').focus();
  }

  // The one place it actually closes: Back (or Close, or Escape, which both
  // go Back) takes the history entry openViewer added, and that lands here
  function closeViewer() {
    if (!viewer || !viewer.classList.contains('on')) return;
    viewer.classList.remove('on', 'zoomed');
    document.documentElement.classList.remove('viewing');
    if (viewerFrom) viewerFrom.focus({ preventScroll: true });
  }
  window.addEventListener('popstate', closeViewer);

  // Open picture links that match `selector` in the viewer (on phones only).
  // One listener on the whole document, so links added later count too.
  function watch(selector) {
    document.addEventListener('click', (e) => {
      if (!VIEWER_SCREENS.matches) return;
      const link = e.target.closest(selector);
      if (!link || !IS_PICTURE.test(link.getAttribute('href'))) return;
      e.preventDefault();
      openViewer(link);
    });
  }

  // Is a picture showing right now?
  function isOpen() {
    return !!viewer && viewer.classList.contains('on');
  }

  // Close it the same way the Close button does: go Back, and let popstate
  // (closeViewer above) do the rest, so the history entry is used up too
  function close() {
    if (isOpen()) history.back();
  }

  return { watch, isOpen, close };
})();
