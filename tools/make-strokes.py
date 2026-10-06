#!/usr/bin/env python3
"""
make-strokes.py — draws the hand-drawn ink strokes used by css/ink.css.

Each stroke is a thin filled shape rather than a line, so its width can swell
and thin like a pen's, its path can drift a fraction of a pixel, and (for
underlines) its ends can taper where the pen lifts. The colours are read
from the tokens at the top of css/site.css, so the strokes always match the
palette. If you change a colour there, run this again:

    python3 tools/make-strokes.py

It writes small SVG files to img/strokes/:

  rule-<colour>.svg         a long, seamless horizontal stroke (400 x 3 px)
                            that tiles across section breaks of any width
  frame-h-<colour>.svg      the same, for the top and bottom of picture frames
  frame-v-<colour>.svg      ...and the left and right sides (3 x 400 px)
  underline-<colour>-N.svg  a short stroke with tapered ends, stretched under
                            a link's text; N = 1, 2, 3 are different
                            variants, so neighbouring links don't match

The look is set by the numbers in STYLES below; the random SEED keeps the
strokes the same each time you run it.
"""

import math
import os
import random
import re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'img', 'strokes')
SEED = 2026

# which colour tokens (from css/site.css) each kind of stroke is made in
RULE_COLOURS = ['rule', 'rule-soft']
FRAME_COLOURS = ['stroke']
UNDERLINE_COLOURS = ['accent-soft', 'accent', 'rule', 'ink']

STYLES = {
    #               width   height  thickness     swell   drift    taper
    #               (px)    (px)    (avg, px)     (±%)    (±px)    (ends)
    'rule':      dict(w=400, h=3,  thick=1.1,  swell=.45, drift=.30, taper=0),
    'frame':     dict(w=400, h=3,  thick=1.25, swell=.50, drift=.30, taper=0),
    # underlines are drawn in a 200 x 10 box and stretched by the CSS (to the
    # link's width, and to 2.5–6 px tall), so their numbers are in box units:
    # a thickness of 5 is half the height they're drawn at
    'underline': dict(w=200, h=10, thick=5.0,  swell=.38, drift=.9,  taper=.07),
}


def read_tokens():
    css = open(os.path.join(ROOT, 'css', 'site.css')).read()
    return {m[0]: m[1] for m in re.findall(r'--([a-z-]+):\s*(#[0-9A-Fa-f]{6})', css)}


def wave(rng, length, periodic, n=7):
    """A smooth random wiggle from -1 to 1 along `length`. If periodic, it
    returns to its start at the end, so the stroke tiles without a seam."""
    parts = []
    for k in range(1, n + 1):
        cycles = rng.randint(k, 3 * k) if periodic else rng.uniform(.6 * k, 2.4 * k)
        parts.append((cycles, rng.uniform(0, 2 * math.pi), 1 / k ** .45))
    total = sum(a for _, _, a in parts)
    return lambda x: sum(a * math.sin(2 * math.pi * c * x / length + p) for c, p, a in parts) / total


def stroke_path(rng, style, periodic):
    w, h = style['w'], style['h']
    width_at = wave(rng, w, periodic)
    drift_at = wave(rng, w, periodic, n=3)
    steps = 160
    top, bottom = [], []
    for i in range(steps + 1):
        x = w * i / steps
        half = style['thick'] / 2 * (1 + style['swell'] * width_at(x))
        if style['taper']:                       # thin to a point at each end
            t = min(x, w - x) / (w * style['taper'])
            half *= min(1, .25 + .75 * t) if t < 1 else 1
        y = h / 2 + style['drift'] * drift_at(x)
        top.append((x, y - half))
        bottom.append((x, y + half))
    pts = top + bottom[::-1]
    return 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + ' Z'


def svg(path, w, h, colour, vertical=False, stretch=False):
    if vertical:          # draw it sideways: swap x and y
        nums = path.replace('M', '').replace('Z', '').split(' L')
        swapped = [' '.join(reversed(p.strip().split(' '))) for p in nums]
        path = 'M' + ' L'.join(swapped) + ' Z'
        w, h = h, w
    aspect = ' preserveAspectRatio="none"' if stretch else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}"{aspect}><path fill="{colour}" d="{path}"/></svg>\n')


def main():
    tokens = read_tokens()
    os.makedirs(OUT, exist_ok=True)
    rng = random.Random(SEED)
    written = []

    def write(name, text):
        open(os.path.join(OUT, name), 'w').write(text)
        written.append(name)

    s = STYLES['rule']
    rule_path = stroke_path(rng, s, periodic=True)
    for c in RULE_COLOURS:
        write(f'rule-{c}.svg', svg(rule_path, s['w'], s['h'], tokens[c]))

    s = STYLES['frame']
    h_path, v_path = stroke_path(rng, s, True), stroke_path(rng, s, True)
    for c in FRAME_COLOURS:
        write(f'frame-h-{c}.svg', svg(h_path, s['w'], s['h'], tokens[c]))
        write(f'frame-v-{c}.svg', svg(v_path, s['w'], s['h'], tokens[c], vertical=True))

    s = STYLES['underline']
    paths = [stroke_path(rng, s, periodic=False) for _ in range(3)]
    for c in UNDERLINE_COLOURS:
        for n, p in enumerate(paths, 1):
            write(f'underline-{c}-{n}.svg', svg(p, s['w'], s['h'], tokens[c], stretch=True))

    print(f'Wrote {len(written)} strokes to img/strokes/')


if __name__ == '__main__':
    main()
