#!/usr/bin/env python3
"""
make-page-images.py — makes the smaller WebP copies of the big terrain maps
that the /cartography page shows (cartography.html).

The originals in img/ are print-sized (up to 8,571 x 11,999 px and 54 MB),
far too heavy to put on a web page. This reads each one and writes WebP
copies at the widths the page asks for into img/cartography/:

  vonn-cortina-1200/-1600/-2000.webp   the full-bleed Cortina picture
  rincon-1600/-2400.webp               Rincon Mountains
  cloud-peak-1600.webp                 Cloud Peak Wilderness, whole map
  cloud-peak-detail.webp               ...and a 1:1 crop of its lettered
                                       peaks (CLOUD_PEAK_DETAIL below)
  restless-river-2400.webp             the Restless River spread
  cathedral-2400.webp                  the Cathedral viewshed spread
  driftless-3000.webp                  the Driftless wall map, 3,000 px on
                                       its long edge

A picture is never enlarged: if an original is narrower than a width asked
for, that size is skipped (and reported). The colour profile, if the
original has one, is kept, so the copies look the same as the originals.

Run it again after replacing any of those originals:

    python3 tools/make-page-images.py

Needs Pillow (python3 -m pip install --user Pillow).
"""

import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'img', 'cartography')
QUALITY = 80          # WebP quality, 0–100
METHOD = 6            # WebP effort, 0–6: slowest and smallest; same result every run

# The Driftless original is 103 million pixels, more than Pillow opens by
# default (it guards against "decompression bombs" from unknown files).
# These are our own files, so lift the limit.
Image.MAX_IMAGE_PIXELS = None

# The crop for cloud-peak-detail.webp, in pixels of the 4000 x 2667 original:
# (left, top). It is 1200 x 800 (3:2), at full size (1:1), around the
# lettered peaks on the right: Penrose Peak, Black Tooth Mountain, Mt.
# Woolsey, Cloud Peak and their neighbours. Move it by changing these two.
CLOUD_PEAK_DETAIL = (2780, 560)
DETAIL_SIZE = (1200, 800)

# original (in img/) → [(output name, width)]. A width of None with
# 'long' means "this long edge" (the Driftless map is portrait).
JOBS = [
    ('vonn-cortina.jpg',          [('vonn-cortina-1200.webp', 1200),
                                   ('vonn-cortina-1600.webp', 1600),
                                   ('vonn-cortina-2000.webp', 2000)]),
    ('rincon.png',                [('rincon-1600.webp', 1600),
                                   ('rincon-2400.webp', 2400)]),
    ('cloud-peak-wilderness.jpg', [('cloud-peak-1600.webp', 1600)]),
    ('restless-river.jpg',        [('restless-river-2400.webp', 2400)]),
    ('cathedral.jpg',             [('cathedral-2400.webp', 2400)]),
    ('driftless-website.jpg',     [('driftless-3000.webp', ('long', 3000))]),
]


def save(im, name, icc):
    """Writes one WebP into img/cartography/ and reports its size."""
    path = os.path.join(OUT, name)
    extra = {'icc_profile': icc} if icc else {}
    im.save(path, 'WEBP', quality=QUALITY, method=METHOD, **extra)
    print(f'  {name:28} {im.width:>5} x {im.height:<5} {os.path.getsize(path) // 1024:>6} KB')


def fit(im, size):
    """The picture scaled to `size` (a width, or ('long', n) for its long
    edge), or None if that would make it bigger than the original."""
    if isinstance(size, tuple):
        scale = size[1] / max(im.size)
    else:
        scale = size / im.width
    if scale > 1:
        return None
    if scale == 1:
        return im
    w, h = round(im.width * scale), round(im.height * scale)
    return im.resize((w, h), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for source, outputs in JOBS:
        path = os.path.join(ROOT, 'img', source)
        if not os.path.exists(path):
            sys.exit(f'Missing original: img/{source} — nothing more written.')
        im = Image.open(path)
        icc = im.info.get('icc_profile')
        im.load()
        print(f'img/{source}  ({im.width} x {im.height})')
        for name, size in outputs:
            out = fit(im, size)
            if out is None:
                print(f'  {name:28} skipped: the original is smaller than that, and pictures are never enlarged')
                continue
            save(out, name, icc)
        if source == 'cloud-peak-wilderness.jpg':
            left, top = CLOUD_PEAK_DETAIL
            box = (left, top, left + DETAIL_SIZE[0], top + DETAIL_SIZE[1])
            if box[2] > im.width or box[3] > im.height:
                sys.exit(f'CLOUD_PEAK_DETAIL {box} runs off the {im.width} x {im.height} original.')
            save(im.crop(box), 'cloud-peak-detail.webp', icc)


if __name__ == '__main__':
    main()
