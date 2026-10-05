/* =============================================================================
   contact.js — the Contact page: turns over the photos of me.
   ============================================================================= */


/* -----------------------------------------------------------------------------
   Photos of me — stacked in one frame; every few seconds the next one fades
   in (the fade itself is CSS: .aph and .aph.on). Works for any number of
   photos. Visitors who prefer reduced motion keep the first.
   ----------------------------------------------------------------------------- */
(function () {
  const HOLD = 5000;                                   // ms each photo shows before the next fades in
  const photos = [...document.querySelectorAll('.aphotos .aph')];
  if (photos.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let shown = 0;
  setInterval(() => {
    if (document.hidden) return;                       // don't flip through unseen in a background tab
    photos[shown].classList.remove('on');
    shown = (shown + 1) % photos.length;
    photos[shown].classList.add('on');
  }, HOLD);
})();
