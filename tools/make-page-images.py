#!/usr/bin/env python3
"""
make-page-images.py — makes the smaller WebP copies of the big terrain maps
that the /cartography page shows (cartography.html).

The originals in img/ are print-sized (up to 8,571 x 11,999 px and 54 MB),
far too heavy to put on a web page. This reads each one and writes WebP
copies at the widths the page asks for into img/cartography/:

  vonn-cortina-1200/-1600/-2000.webp   the full-bleed Cortina picture
  vonn-<place>-600.webp                the six contact-sheet tiles at half
                                       size, for phones (from img/tiles/)
  rincon-1600/-2000/-2400.webp         Rincon Mountains (12 px off the top:
                                       RINCON_TRIM_TOP below). The page
                                       shows up to 2000; 2400 is the link
  cloud-peak-1600.webp                 Cloud Peak Wilderness, whole map
  cloud-peak-detail.webp               ...and a 1:1 crop of its lettered
                                       peaks (CLOUD_PEAK_DETAIL below)
  restless-river-2400.webp             the Restless River spread
  cathedral-2400.webp                  the Cathedral viewshed spread
  driftless-3000.webp                  the Driftless wall map, 3,000 px on
                                       its long edge
  glyph-<name>.webp                    seven of the 22, A Map album symbols
                                       (img/<name>-01.svg), small and in ink
                                       (GLYPHS below)

A picture is never enlarged: if an original is narrower than a width asked
for, that size is skipped (and reported). The colour profile, if the
original has one, is kept, so the copies look the same as the originals.

Run it again after replacing any of those originals:

    python3 tools/make-page-images.py

Needs Pillow (python3 -m pip install --user Pillow) and, for the glyphs,
rsvg-convert (brew install librsvg). The same inputs always give the same
output.
"""

import os
import re
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops

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

# The Rincon render's top-right corner has a sliver of pure black (about 40 x
# 8 px) where the terrain stops short of the frame; on the page it reads as a
# chip out of the picture's edge. This many rows come off the top before
# resizing (a strip of plain sky-lit terrain, nothing labelled).
RINCON_TRIM_TOP = 12

# The six contact-sheet tiles (img/tiles/vonn-<place>.webp, 1200 x 800) show
# about 170px wide on a phone: a copy at this width is plenty even at 3x.
VONN_PLACES = ['cortina', 'lake-louise', 'whistler', 'are', 'schladming', 'buck-hill']
VONN_SMALL = 600

# 22, A Map: the album symbols shown in square cells, 80 CSS px at most, so
# each is drawn to fit GLYPH_BOX px (2x, for sharp screens).
# Their colours are turned into shades of the site's --ink: the darker a
# pixel, the more opaque the ink (pale fills drop away), so a coloured symbol
# keeps its detail instead of becoming a solid blot. GLYPH_CROP keeps only
# part of a symbol, in the units of its SVG viewBox: astuary-01 is 985 x 459
# with the hourglass emblem in the middle and stray letters far out at the
# sides, which at this size were only specks.
GLYPHS = ['dude', 'fireball', 'weed', 'twoface', 'fingers', 'turnblue', 'astuary']
GLYPH_BOX = 160
GLYPH_RENDER = 448      # rendered this big first (long edge), then reduced
GLYPH_CROP = {'astuary': (280, 0, 740, 459)}
GLYPH_PAPER = 0.12      # darkness below this (near-white) draws no ink

# original (in img/) → [(output name, width)]. A width of None with
# 'long' means "this long edge" (the Driftless map is portrait).
JOBS = [
    ('vonn-cortina.jpg',          [('vonn-cortina-1200.webp', 1200),
                                   ('vonn-cortina-1600.webp', 1600),
                                   ('vonn-cortina-2000.webp', 2000)]),
    ('rincon.png',                [('rincon-1600.webp', 1600),
                                   ('rincon-2000.webp', 2000),
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


def ink_colour():
    """The site's --ink, from css/site.css, as (r, g, b)."""
    css = open(os.path.join(ROOT, 'css', 'site.css')).read()
    h = re.search(r'--ink:\s*#([0-9A-Fa-f]{6})', css)[1]
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def glyph(name, ink):
    """One album symbol: rendered from its SVG, cropped (GLYPH_CROP), turned
    into ink and fitted into GLYPH_BOX. Saved as glyph-<name>.webp."""
    svg = os.path.join(ROOT, 'img', f'{name}-01.svg')
    head = open(svg).read(2000)
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', head)[1].replace(',', ' ').split()]
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, 'g.png')
        subprocess.run(['rsvg-convert', '-a', '-w', str(GLYPH_RENDER), '-h', str(GLYPH_RENDER), svg, '-o', png],
                       check=True)
        im = Image.open(png).convert('RGBA')
        im.load()
    if name in GLYPH_CROP:
        k = im.width / vb[2]                        # pixels per viewBox unit
        l, t, r, b = GLYPH_CROP[name]
        im = im.crop((round(l * k), round(t * k), round(r * k), round(b * k)))
    # darkness 0 (white) to 1 (black), less the paper allowance, times the
    # pixel's own opacity, is how much ink it gets
    dark = im.convert('L').point(lambda v: round(255 * min(1, max(0, (1 - v / 255 - GLYPH_PAPER) / (1 - GLYPH_PAPER)))))
    out = Image.new('RGBA', im.size, ink + (0,))
    out.putalpha(ImageChops.multiply(dark, im.getchannel('A')))
    out = out.crop(out.getbbox())
    out.thumbnail((GLYPH_BOX, GLYPH_BOX), Image.LANCZOS)
    path = os.path.join(OUT, f'glyph-{name}.webp')
    out.save(path, 'WEBP', quality=QUALITY, method=METHOD)
    print(f'  {"glyph-" + name + ".webp":28} {out.width:>5} x {out.height:<5} {os.path.getsize(path) // 1024:>6} KB')


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
        if source == 'rincon.png':
            im = im.crop((0, RINCON_TRIM_TOP, im.width, im.height))
            print(f'  trimmed {RINCON_TRIM_TOP} px off the top: {im.width} x {im.height}')
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

    print(f'img/tiles/vonn-*.webp at {VONN_SMALL} px wide')
    for place in VONN_PLACES:
        im = Image.open(os.path.join(ROOT, 'img', 'tiles', f'vonn-{place}.webp'))
        icc = im.info.get('icc_profile')
        im.load()
        save(fit(im, VONN_SMALL), f'vonn-{place}-{VONN_SMALL}.webp', icc)

    print('22, A Map glyphs (img/<name>-01.svg), in ink')
    ink = ink_colour()
    for name in GLYPHS:
        glyph(name, ink)


if __name__ == '__main__':
    main()
