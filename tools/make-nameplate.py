#!/usr/bin/env python3
"""
make-nameplate.py — draws the JS nameplate (img/nameplate.webp) sharp.

The nameplate is J S over J S, black then coral on the top row, coral then
black on the bottom. The letter shapes come from tools/og-card/letter-j.png
and letter-s.png (cut from img/favicon_lg-03.jpg). It's drawn at SCALE times
the size of the old 81 x 99 px image, so it stays crisp on high-density
screens even when the header shows it larger on phones.

    python3 tools/make-nameplate.py
"""

import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SCALE = 3
INK, CORAL = (34, 32, 33), (211, 115, 88)      # the original nameplate's colours

# the layout of the original, in its pixels: column and row spans, 4 px gaps
COLS = [(0, 35), (39, 81)]                      # J column, S column (start, end)
ROWS = [(0, 47), (51, 99)]
W, H = 81, 99

letters = {n: Image.open(os.path.join(ROOT, 'tools', 'og-card', f'letter-{n}.png')).getchannel('A')
           for n in 'js'}
out = Image.new('RGBA', (W * SCALE, H * SCALE), INK + (0,))
for r, (y0, y1) in enumerate(ROWS):
    for c, (x0, x1) in enumerate(COLS):
        colour = INK if (r + c) % 2 == 0 else CORAL
        bw, bh = (x1 - x0) * SCALE, (y1 - y0) * SCALE
        mask = letters['js'[c]]
        k = min(bw / mask.width, bh / mask.height)          # fit the letter in its box
        mask = mask.resize((round(mask.width * k), round(mask.height * k)), Image.LANCZOS)
        px, py = x0 * SCALE + (bw - mask.width) // 2, y0 * SCALE + (bh - mask.height) // 2
        out.paste(Image.new('RGBA', mask.size, colour + (255,)), (px, py), mask)
out.save(os.path.join(ROOT, 'img', 'nameplate.webp'), 'WEBP', lossless=True, method=6)
print('Wrote img/nameplate.webp', out.size)
