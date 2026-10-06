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
                            that tiles across minor dividers of any width
  section-<colour>.svg      the same, bolder, for the main section breaks
                            (400 x 4 px)
  rule-outside-bottom.svg,  the sliver below each of those, used to clip the
  section-outside-bottom.svg  sticky header and jump bar right at their line
  pill-left-<colour>.svg    the outline of a pill-shaped button, in two halves
  pill-right-<colour>.svg   (each a rounded end plus a long straight run); the
                            CSS shows each over half the button, scaled to its
                            height, so the ends stay round at any size
  frame-h-<colour>.svg      the same, for the top and bottom of picture frames
  frame-v-<colour>.svg      ...and the left and right sides (3 x 400 px)
  frame-outside-<side>.svg  the thin sliver OUTSIDE each frame stroke's outer
                            edge (top, bottom, left, right). css/ink.css cuts
                            these away from a picture, so it stops exactly at
                            its hand-drawn frame
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
RULE_COLOURS = ['rule', 'rule-soft', 'rule-row']
SECTION_COLOURS = ['rule-ink']
PILL_COLOURS = ['rule-ink', 'stroke', 'accent-ink']
FRAME_COLOURS = ['stroke']
UNDERLINE_COLOURS = ['accent-soft', 'accent', 'rule', 'ink']

STYLES = {
    #               width   height  thickness     swell   drift    taper
    #               (px)    (px)    (avg, px)     (±%)    (±px)    (ends)
    'rule':      dict(w=400, h=3,  thick=1.1,  swell=.45, drift=.30, taper=0),
    'frame':     dict(w=400, h=3,  thick=1.25, swell=.50, drift=.30, taper=0),
    'section':   dict(w=400, h=4,  thick=0.95, swell=.55, drift=.35, taper=0),
    # pills are drawn 28 units tall (about a pill's height in px), so these
    # are roughly px too
    'pill':      dict(w=400, h=28, thick=0.9,  swell=.45, drift=.15, taper=0),
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
    return path(top + bottom[::-1]), top, bottom


def path(pts):
    return 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + ' Z'


def pill_half(rng, style, side):
    """Half a pill outline: a straight run along the top from the far end, a
    rounded end, and a straight run back along the bottom. Drawn as a filled
    shape that swells and thins, like the other strokes."""
    w, h = style['w'], style['h']
    r = h / 2 - 1                                   # 1 unit in from the edges
    cx, cy = h / 2, h / 2
    centre = [(x, 1.0) for x in range(w, int(cx), -2)]
    for i in range(41):                             # the round end, top to bottom
        a = math.radians(270 - 180 * i / 40)
        centre.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    centre += [(x, h - 1.0) for x in range(int(cx) + 2, w + 1, 2)]
    lengths = [0.0]
    for (x0, y0), (x1, y1) in zip(centre, centre[1:]):
        lengths.append(lengths[-1] + math.hypot(x1 - x0, y1 - y0))
    total = lengths[-1]
    width_at, drift_at = wave(rng, total, False), wave(rng, total, False, n=3)
    outer, inner = [], []
    for i, ((x, y), s) in enumerate(zip(centre, lengths)):
        (xa, ya), (xb, yb) = centre[max(i - 1, 0)], centre[min(i + 1, len(centre) - 1)]
        tx, ty = xb - xa, yb - ya
        n = math.hypot(tx, ty) or 1
        nx, ny = -ty / n, tx / n                    # unit normal
        half = style['thick'] / 2 * (1 + style['swell'] * width_at(s))
        d = style['drift'] * drift_at(s)
        outer.append((x + nx * (d + half), y + ny * (d + half)))
        inner.append((x + nx * (d - half), y + ny * (d - half)))
    pts = outer + inner[::-1]
    if side == 'right':                             # mirror it for the right end
        pts = [(w - x, y) for x, y in pts]
    return path(pts)


def svg(path, w, h, colour, vertical=False, stretch=False, fit=None):
    if vertical:          # draw it sideways: swap x and y
        nums = path.replace('M', '').replace('Z', '').split(' L')
        swapped = [' '.join(reversed(p.strip().split(' '))) for p in nums]
        path = 'M' + ' L'.join(swapped) + ' Z'
        w, h = h, w
    aspect = ' preserveAspectRatio="none"' if stretch else (f' preserveAspectRatio="{fit}"' if fit else '')
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
    rule_path, _, rule_bottom = stroke_path(rng, s, periodic=True)
    for c in RULE_COLOURS:
        write(f'rule-{c}.svg', svg(rule_path, s['w'], s['h'], tokens[c]))
    # the sliver below it, for clipping a sticky bar's background at its line
    write('rule-outside-bottom.svg', svg(path(rule_bottom + [(s['w'], s['h']), (0, s['h'])]), s['w'], s['h'], '#000'))

    s = STYLES['frame']
    (h_path, h_top, h_bottom), (v_path, v_top, v_bottom) = stroke_path(rng, s, True), stroke_path(rng, s, True)
    for c in FRAME_COLOURS:
        write(f'frame-h-{c}.svg', svg(h_path, s['w'], s['h'], tokens[c], stretch=True))
        write(f'frame-v-{c}.svg', svg(v_path, s['w'], s['h'], tokens[c], vertical=True, stretch=True))
    # (frame strokes and slivers stretch to fit the size the CSS draws them
    # at, rather than keeping their shape, in case they're drawn bolder)
    # the slivers outside each stroke's OUTER edge. The top and bottom of a
    # frame use the horizontal stroke (outside is above its top edge at the
    # top, below its bottom edge at the bottom); the sides use the vertical
    # one, drawn sideways, so "above" becomes left and "below" right.
    w, h = s['w'], s['h']
    above_top = path([(0, 0), (w, 0)] + h_top[::-1])
    below_bottom = path(h_bottom + [(w, h), (0, h)])
    write('frame-outside-top.svg', svg(above_top, w, h, '#000', stretch=True))
    write('frame-outside-bottom.svg', svg(below_bottom, w, h, '#000', stretch=True))
    write('frame-outside-left.svg', svg(path([(0, 0), (w, 0)] + v_top[::-1]), w, h, '#000', vertical=True, stretch=True))
    write('frame-outside-right.svg', svg(path(v_bottom + [(w, h), (0, h)]), w, h, '#000', vertical=True, stretch=True))

    s = STYLES['underline']
    paths = [stroke_path(rng, s, periodic=False)[0] for _ in range(3)]
    for c in UNDERLINE_COLOURS:
        for n, p in enumerate(paths, 1):
            write(f'underline-{c}-{n}.svg', svg(p, s['w'], s['h'], tokens[c], stretch=True))

    # (made last, so the strokes above keep their shapes from earlier runs)
    s = STYLES['section']
    section_path, _, section_bottom = stroke_path(rng, s, periodic=True)
    for c in SECTION_COLOURS:
        write(f'section-{c}.svg', svg(section_path, s['w'], s['h'], tokens[c]))
    write('section-outside-bottom.svg', svg(path(section_bottom + [(s['w'], s['h']), (0, s['h'])]), s['w'], s['h'], '#000'))

    s = STYLES['pill']
    # each half keeps its shape and fills the button's height; the rest of its
    # long straight run is cut off at the middle ("slice")
    left, right = pill_half(rng, s, 'left'), pill_half(rng, s, 'right')
    for c in PILL_COLOURS:
        write(f'pill-left-{c}.svg', svg(left, s['w'], s['h'], tokens[c], fit='xMinYMid slice'))
        write(f'pill-right-{c}.svg', svg(right, s['w'], s['h'], tokens[c], fit='xMaxYMid slice'))

    print(f'Wrote {len(written)} strokes to img/strokes/')


if __name__ == '__main__':
    main()
