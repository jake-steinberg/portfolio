#!/usr/bin/env python3
"""
make-map-figures.py — draws the charts and diagrams on the /cartography page
(cartography.html) straight from the files they describe, so the figures
can't drift from the maps.

It reads:
  maps/strib-*.json               the five Star Tribune basemap styles
  js/projects.js                  each style's button name and title
  img/tiles/strib-basemaps.mp4    the loop of all five styles (for F1)
  tools/crossfade-loop.sh         that loop's timing (HOLD, FADE)
  css/site.css                    the colour tokens and label sizes
  img/strokes/, tools/compress-videos.py, git history   (for F7 and F8)

and makes these figures:

  F1  five-up       one still per style, taken from the loop and named by
                    matching its colours to each style's background and
                    water (img/map-figures/five-up-<style>.webp)
  F2  palette       each style's colours for eight roles, read from its
                    visible layers only
  F3  zoom-ladder   when each visible Strib Outdoors layer draws, z0–24,
                    grouped by data layer, with every layer in a table
  F4  label-ramps   town-label size by zoom: Outdoors (by population rank)
                    and Elex (by population)
  F5  hubs          Elex's 27 regional cities inside the Minnesota outline
                    its labels are clipped to
  F6  elex-stack    Elex's layer stack around the "water" anchor where
                    election layers go in
  F7  pipeline      which script reads what and writes what
  F8  trial-revert  two real "tried it, took it back" commit sequences

Each figure is written into cartography.html between its two marker
comments:

    <!-- FIG:<name> START -->  ...  <!-- FIG:<name> END -->

Like tools/build-project-list.mjs: if any marker is missing, it says so and
changes nothing at all. Until cartography.html exists, it writes only the
files in img/map-figures/ and lists what it would put in the page. The
SVGs are also saved on their own in img/map-figures/ (<name>.svg, and
<name>-narrow.svg for the phone version) so they can be looked at directly.
The figure styles (wide/narrow switching, the palette grid, tables) are in
the "Figures" section of css/cartography.css.

Rerun it whenever a style file, the loop video or the colour tokens change:

    python3 tools/make-map-figures.py
    python3 tools/make-map-figures.py --print      # also print the HTML it injects
    python3 tools/make-map-figures.py --page other.html   # write into another page

Nothing is guessed. Colours, zooms and sizes come from a small evaluator for
MapLibre style expressions that knows only the operators these styles use
(see evaluate()); anything else stops the script with an error instead of
being approximated. "Visible" means layout.visibility isn't "none". A
layer's zoom range is [max(its minzoom, its source's minzoom), its maxzoom
or 24].

Needs Python 3, Pillow (python3 -m pip install --user Pillow), ffmpeg and
ffprobe (brew install ffmpeg) and git. The same inputs always give the same
output.
"""

import argparse
import html
import json
import math
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PAGE = os.path.join(ROOT, 'cartography.html')
OUT = os.path.join(ROOT, 'img', 'map-figures')
VIDEO = os.path.join(ROOT, 'img', 'tiles', 'strib-basemaps.mp4')
CROSSFADE = os.path.join(ROOT, 'tools', 'crossfade-loop.sh')
PROJECTS = os.path.join(ROOT, 'js', 'projects.js')
SITE_CSS = os.path.join(ROOT, 'css', 'site.css')
COMPRESS = os.path.join(ROOT, 'tools', 'compress-videos.py')
STROKES = os.path.join(ROOT, 'img', 'strokes')

# ---- what each figure shows -------------------------------------------------

LADDER_STYLE = 'outdoors'       # F3: the style whose layers are laddered
RAMP_STYLES = ('outdoors', 'elex')   # F4: the two label logics compared
RAMP_ZOOMS = (5, 14)            # F4: the x axis
RAMP_LAYER = 'places_locality'  # F4: the town-label layer in both styles
HUBS_STYLE = 'elex'             # F5 and F6
HUBS_SOURCE = 'mn_hubs'
HUB_LAT = 46.4                  # F5: x is scaled by cos(this latitude)
HUB_LABELS_TOP = 8              # F5: label the biggest this many cities...
HUB_LABELS_EXTRA = ['Baudette', 'Grand Marais']   # ...and these two
HUB_KEY = (10000, 30000)        # F5: populations drawn in the size key
FRAME_QUALITY = 82              # F1: WebP quality of the stills

# F1: a pixel votes for the style whose background or water hex is nearest
# to it, if within this distance (RGB, 0–441). Video compression shifts
# colours a few steps; this is enough to absorb that and no more.
VOTE_RADIUS = 20
MIN_LEAD = 1.2                  # the winner must have 1.2x the runner-up's votes

# F2: the eight colour roles, and the layers each is read from, in order:
# the first one that exists and is visible wins. (layer id, properties to
# evaluate a data-driven colour with, or None for "every colour in it")
PALETTE_ROLES = [
    ('Background', [('background', None)]),
    ('Water',      [('water', None)]),
    ('Parks',      [('landuse_park', None)]),
    ('Forest',     [('landuse_forest', None), ('landcover', [{'kind': 'wood'}, {'kind': 'forest'}])]),
    ('Wetland',    [('landuse_wetland', None), ('wetland', None)]),
    ('Highway',    [('roads_highway', None)]),
    ('Casing',     [('roads_highway_casing', None)]),
    ('Buildings',  [('buildings_osm', None)]),
]
PALETTE_ZOOM = 12               # zoom used when a role needs evaluating with properties
MAX_SPLIT = 3                   # an expression colour shows at most this many colours

# F3: friendlier names for the data layers (anything not listed shows its raw name)
GROUP_NAMES = {
    'background': 'Background', 'landuse': 'Land use', 'landcover': 'Land cover',
    'contours_50m': 'Contours, 50 m', 'contours_10m': 'Contours, 10 m',
    'water': 'Water', 'roads': 'Roads and paths', 'buildings': 'Buildings',
    'boundaries': 'Boundaries', 'pois': 'Points of interest', 'places': 'Places',
    'earth': 'Islands',
}
LADDER_TICKS = (0, 5, 10, 14, 18, 24)

# F8: commits that tried something and then took it back, with the sentence
# that heads each row. The subjects and dates are read from git.
TRIALS = [
    ('A map border around the page', ['ce0503b', '324b847']),
    ('A handwritten label font', ['53bd359', '14fe794', 'bdedb1d']),
]

# ---- type -------------------------------------------------------------------
# The site's three fonts, by family name: they load from the page.
TOPO = "'Bell Topo Sans', Outfit, system-ui, sans-serif"
SERIF = "'Source Serif 4', Georgia, serif"
DISPLAY = "Outfit, system-ui, sans-serif"
# Rough widths, in ems, for laying text out before the browser measures it:
# Bell Topo capitals with the site's .1em tracking, and Source Serif 4 text.
EM_CAPS = 0.78      # (measured in Chrome: 0.73–0.77)
EM_LOWER = 0.61     # (0.54–0.61)
EM_SERIF = 0.50     # (0.47–0.50)

MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.',
          'Sept.', 'Oct.', 'Nov.', 'Dec.']


# =============================================================================
# Reading the inputs
# =============================================================================

def read_tokens():
    """The colour and size tokens from css/site.css."""
    css = open(SITE_CSS).read()
    t = {m[0]: m[1] for m in re.findall(r'--([a-z-]+):\s*(#[0-9A-Fa-f]{6})', css)}
    px = {m[0]: float(m[1]) for m in re.findall(r'--([a-z-]+):\s*([0-9.]+)px', css)}
    t['label-size'] = px['fs-xs'] + px['label-plus']      # the site's label size
    t['small-size'] = px['fs-xs']
    t['text-size'] = px['fs-md']
    return t


def read_styles():
    """The five styles, in the order js/projects.js lists them, with their
    button name and title: {key: {'name', 'title', 'json'}}."""
    js = open(PROJECTS).read()
    found = re.findall(r'name:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*style:\s*"maps/strib-([a-z]+)\.json"', js)
    if len(found) != 5:
        sys.exit(f'Expected five basemap styles in js/projects.js, found {len(found)}.')
    styles = {}
    for name, title, key in found:
        with open(os.path.join(ROOT, 'maps', f'strib-{key}.json')) as f:
            styles[key] = {'name': name, 'title': title, 'json': json.load(f)}
    return styles


def visible(layer):
    return layer.get('layout', {}).get('visibility') != 'none'


def layer_by_id(style, lid):
    for layer in style['layers']:
        if layer['id'] == lid:
            return layer
    return None


def zoom_range(style, layer):
    """[max(layer minzoom, source minzoom), layer maxzoom or 24]."""
    src = style['sources'].get(layer.get('source'), {}) if layer.get('source') else {}
    lo = max(layer.get('minzoom', 0) or 0, src.get('minzoom', 0) or 0)
    hi = layer.get('maxzoom', 24)
    return lo, hi


# =============================================================================
# The expression evaluator
# =============================================================================
# Supports exactly what these styles need: legacy {stops, base} zoom
# functions, interpolate (linear, exponential), step, case, match, get, zoom,
# literal values, and the comparisons and logic that case conditions are made
# of (== != < <= > >= ! all any in coalesce). Anything else raises
# Unsupported, so a figure is never drawn from a guess.

class Unsupported(ValueError):
    pass


def _ramp(base, x, stops, what):
    """Interpolates numeric stops [[in, out], ...] at x (clamped at the ends),
    linearly (base 1) or exponentially, the way MapLibre does."""
    for _, out in stops:
        if not isinstance(out, (int, float)) or isinstance(out, bool):
            raise Unsupported(f'{what}: only numbers can be interpolated here, got {out!r}')
    if x <= stops[0][0]:
        return stops[0][1]
    if x >= stops[-1][0]:
        return stops[-1][1]
    for (x0, y0), (x1, y1) in zip(stops, stops[1:]):
        if x0 <= x <= x1:
            if base == 1:
                t = (x - x0) / (x1 - x0)
            else:
                t = (base ** (x - x0) - 1) / (base ** (x1 - x0) - 1)
            return y0 + t * (y1 - y0)
    raise Unsupported(f'{what}: stops out of order')


def _num(v, op):
    if not isinstance(v, (int, float)) or isinstance(v, bool):
        raise Unsupported(f'"{op}" compared a non-number ({v!r})')
    return v


def evaluate(expr, zoom, props=None):
    """The value of a style expression at `zoom` for a feature with `props`."""
    props = props or {}
    if expr is None or isinstance(expr, (bool, int, float, str)):
        return expr
    if isinstance(expr, dict):
        if 'stops' in expr and set(expr) <= {'stops', 'base'}:     # legacy zoom function
            return _ramp(expr.get('base', 1), zoom, expr['stops'], 'legacy function')
        raise Unsupported(f'unsupported function object: {json.dumps(expr)[:80]}')
    if not isinstance(expr, list) or not expr or not isinstance(expr[0], str):
        raise Unsupported(f'not an expression: {json.dumps(expr)[:80]}')

    op, args = expr[0], expr[1:]
    ev = lambda e: evaluate(e, zoom, props)

    if op == 'literal':
        return args[0]
    if op == 'zoom':
        if zoom is None:
            raise Unsupported('this expression depends on zoom, but no zoom was given')
        return zoom
    if op == 'get':
        if len(args) != 1:
            raise Unsupported('"get" with an object argument')
        return props.get(ev(args[0]))
    if op == 'coalesce':
        for a in args:
            v = ev(a)
            if v is not None:
                return v
        return None
    if op in ('==', '!='):
        if len(args) != 2:
            raise Unsupported(f'"{op}" with a collator')
        same = ev(args[0]) == ev(args[1])
        return same if op == '==' else not same
    if op in ('<', '<=', '>', '>='):
        if len(args) != 2:
            raise Unsupported(f'"{op}" with a collator')
        a, b = _num(ev(args[0]), op), _num(ev(args[1]), op)
        return {'<': a < b, '<=': a <= b, '>': a > b, '>=': a >= b}[op]
    if op == '!':
        v = ev(args[0])
        if not isinstance(v, bool):
            raise Unsupported(f'"!" of a non-boolean ({v!r})')
        return not v
    if op in ('all', 'any'):
        vals = [ev(a) for a in args]
        if not all(isinstance(v, bool) for v in vals):
            raise Unsupported(f'"{op}" of non-booleans')
        return all(vals) if op == 'all' else any(vals)
    if op == 'in':
        needle, hay = ev(args[0]), ev(args[1])
        if not isinstance(hay, (list, str)):
            raise Unsupported(f'"in" needs a list or string, got {hay!r}')
        return needle in hay
    if op == 'case':
        if len(args) % 2 != 1:
            raise Unsupported('"case" without a fallback')
        for cond, out in zip(args[0:-1:2], args[1:-1:2]):
            c = ev(cond)
            if not isinstance(c, bool):
                raise Unsupported(f'"case" condition gave {c!r}')
            if c:
                return ev(out)
        return ev(args[-1])
    if op == 'match':
        value, rest = ev(args[0]), args[1:]
        if len(rest) % 2 != 1:
            raise Unsupported('"match" without a fallback')
        for labels, out in zip(rest[0:-1:2], rest[1:-1:2]):
            if value in (labels if isinstance(labels, list) else [labels]):
                return ev(out)
        return ev(rest[-1])
    if op == 'step':
        x = _num(ev(args[0]), 'step')
        out = args[1]
        for edge, val in zip(args[2::2], args[3::2]):
            if x >= edge:
                out = val
            else:
                break
        return ev(out)
    if op == 'interpolate':
        kind, x = args[0], _num(ev(args[1]), 'interpolate')
        if kind == ['linear']:
            base = 1
        elif isinstance(kind, list) and len(kind) == 2 and kind[0] == 'exponential':
            base = kind[1]
        else:
            raise Unsupported(f'unsupported interpolation {kind!r}')
        stops = [[edge, ev(val)] for edge, val in zip(args[2::2], args[3::2])]
        return _ramp(base, x, stops, 'interpolate')
    raise Unsupported(f'unsupported expression operator "{op}"')


def colour_outputs(expr):
    """Every colour an expression can produce (the output values of its
    case/match/step/interpolate branches), as strings, in order."""
    if isinstance(expr, str):
        return [expr]
    if isinstance(expr, dict):
        if 'stops' in expr and set(expr) <= {'stops', 'base'}:
            return [c for _, out in expr['stops'] for c in colour_outputs(out)]
        raise Unsupported(f'unsupported colour function: {json.dumps(expr)[:80]}')
    if not isinstance(expr, list) or not expr:
        raise Unsupported(f'not a colour: {expr!r}')
    op = expr[0]
    if op == 'case':
        outs = expr[2:-1:2] + [expr[-1]]
    elif op == 'match':
        rest = expr[2:]
        outs = rest[1:-1:2] + [rest[-1]]
    elif op == 'step':
        outs = [expr[2]] + expr[4::2]
    elif op == 'interpolate':
        outs = expr[4::2]
    else:
        raise Unsupported(f'unsupported colour expression "{op}"')
    return [c for out in outs for c in colour_outputs(out)]


def parse_colour(s):
    """(r, g, b, alpha) from a hex, rgb() or rgba() string."""
    m = re.fullmatch(r'#([0-9a-fA-F]{6})', s)
    if m:
        h = m[1]
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0
    m = re.fullmatch(r'#([0-9a-fA-F]{3})', s)
    if m:
        return tuple(int(c * 2, 16) for c in m[1]) + (1.0,)
    m = re.fullmatch(r'rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)', s)
    if m:
        return int(float(m[1])), int(float(m[2])), int(float(m[3])), float(m[4] if m[4] else 1)
    raise Unsupported(f'unsupported colour string {s!r}')


PAINT_COLOUR = {'background': 'background-color', 'fill': 'fill-color', 'line': 'line-color'}


def layer_colours(layer, props_list=None):
    """The colours a layer draws in. Fully transparent ones are left out:
    they draw nothing (e.g. a case's "everything else" branch)."""
    key = PAINT_COLOUR.get(layer['type'])
    if not key or key not in layer.get('paint', {}):
        raise Unsupported(f'layer {layer["id"]} has no {key}')
    expr = layer['paint'][key]
    if props_list:
        found = [evaluate(expr, PALETTE_ZOOM, p) for p in props_list]
    else:
        found = colour_outputs(expr)
    out = []
    for c in found:
        if not isinstance(c, str):
            raise Unsupported(f'layer {layer["id"]}: colour {c!r}')
        if parse_colour(c)[3] > 0 and c not in out:
            out.append(c)
    return out


def role_colours(style, candidates):
    """F2: the colours of the first visible candidate layer, and its id;
    ([], None) if none is visible."""
    for lid, props in candidates:
        layer = layer_by_id(style, lid)
        if layer and visible(layer):
            return layer_colours(layer, props), lid
    return [], None


# =============================================================================
# Small SVG and HTML helpers
# =============================================================================

def esc(s):
    return html.escape(str(s), quote=True)


def fmt(n):
    """A coordinate, to a tenth of a pixel."""
    return f'{n:.1f}'.rstrip('0').rstrip('.')


def text_width(s, size, kind='caps'):
    """A rough width of a label, for laying things out."""
    return len(s) * size * {'caps': EM_CAPS, 'lower': EM_LOWER, 'serif': EM_SERIF}[kind]


def svg_open(w, h, title, desc, cls):
    """An accessible SVG: role="img" with a <title> (its name) and a
    <desc>. The width and height let it draw at 1:1 on wide screens; the
    page CSS lets it shrink to fit narrower ones."""
    return (f'<svg class="{cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" '
            f'width="{fmt(w)}" height="{fmt(h)}" role="img">'
            f'<title>{esc(title)}</title><desc>{esc(desc)}</desc>')


def label(x, y, s, size, fill, anchor='start', caps=True, weight=None, extra=''):
    """A Bell Topo label: capitals with the site's .1em tracking."""
    w = f' font-weight="{weight}"' if weight else ''
    track = ' letter-spacing="0.1em"' if caps else ''
    return (f'<text x="{fmt(x)}" y="{fmt(y)}" font-family="{esc(TOPO)}" font-size="{fmt(size)}"{w}{track} '
            f'fill="{fill}" text-anchor="{anchor}"{extra}>{esc(s.upper() if caps else s)}</text>')


def prose(x, y, s, size, fill, anchor='start', italic=False):
    st = ' font-style="italic"' if italic else ''
    return (f'<text x="{fmt(x)}" y="{fmt(y)}" font-family="{esc(SERIF)}" font-size="{fmt(size)}"{st} '
            f'fill="{fill}" text-anchor="{anchor}">{esc(s)}</text>')


def wrap(s, max_width, size, kind='serif'):
    """Splits text into lines that fit max_width (roughly)."""
    lines, line = [], ''
    for word in s.split():
        trial = (line + ' ' + word).strip()
        if line and text_width(trial, size, kind) > max_width:
            lines.append(line)
            line = word
        else:
            line = trial
    if line:
        lines.append(line)
    return lines


def arrow(x1, y1, x2, y2, colour, head=5):
    """A thin line with a small filled arrowhead at (x2, y2)."""
    a = math.atan2(y2 - y1, x2 - x1)
    bx, by = x2 - head * math.cos(a), y2 - head * math.sin(a)
    px, py = -math.sin(a) * head * .6, math.cos(a) * head * .6
    return (f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" x2="{fmt(bx)}" y2="{fmt(by)}" stroke="{colour}" stroke-width="1.25"/>'
            f'<path d="M{fmt(x2)} {fmt(y2)} L{fmt(bx + px)} {fmt(by + py)} L{fmt(bx - px)} {fmt(by - py)} Z" fill="{colour}"/>')


def data_table(caption, head, rows, cls='fig-table'):
    """The <details> data table every chart carries, for screen readers and
    for anyone who wants the numbers."""
    th = ''.join(f'<th scope="col">{esc(h)}</th>' for h in head)
    body = ''.join('<tr>' + ''.join(f'<td>{esc(c)}</td>' for c in r) + '</tr>' for r in rows)
    return (f'<details class="fig-data"><summary>{esc(caption)}</summary>'
            f'<div class="fig-wrap"><table class="{cls}"><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table></div></details>')


def px(v):
    """A label size, to at most two decimals (10.3883 → 10.39)."""
    return f'{round(v, 2):g}'


def thousands(n):
    return f'{n:,}'


def ap_date(iso):
    y, m, d = (int(p) for p in iso.split('-'))
    return f'{MONTHS[m - 1]} {d}, {y}'


# =============================================================================
# F1 five-up: one still per style from the loop
# =============================================================================

def read_loop_timing():
    sh = open(CROSSFADE).read()
    hold = float(re.search(r'^HOLD=([\d.]+)', sh, re.M)[1])
    fade = float(re.search(r'^FADE=([\d.]+)', sh, re.M)[1])
    return hold, fade


def video_duration():
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                          '-of', 'default=nw=1:nk=1', VIDEO], capture_output=True, text=True, check=True)
    return float(out.stdout)


def sample_times(duration, hold, fade):
    """The middle of each picture's steady stretch in a crossfade loop.

    tools/crossfade-loop.sh starts the k-th crossfade at k x HOLD (its
    xfade offset), lasting FADE. So picture 0 is steady from 0 to HOLD, and
    picture k from k x HOLD + FADE to (k + 1) x HOLD."""
    n = int((duration - fade) // hold)
    times = []
    for k in range(n):
        start = k * hold + (fade if k else 0)
        times.append(round((start + (k + 1) * hold) / 2, 3))
    return times


def classify(frame, refs):
    """Which style a frame shows. Every pixel colour within VOTE_RADIUS of
    one of the styles' background or water hexes votes for that style, so the
    frame's most common colours decide. Returns (style, share, runner-up,
    runner-up share)."""
    counts = Counter(frame.getdata())
    votes = Counter()
    for colour, n in counts.items():
        best = min(refs, key=lambda r: sum((a - b) ** 2 for a, b in zip(colour, r[1])))
        if math.dist(colour, best[1]) <= VOTE_RADIUS:
            votes[best[0]] += n
    total = sum(counts.values())
    (win, wn), (second, sn) = (votes.most_common(2) + [('none', 0)])[:2]
    return win, wn / total, second, sn / total


def five_up(styles):
    hold, fade = read_loop_timing()
    times = sample_times(video_duration(), hold, fade)
    refs = []
    for key, s in styles.items():
        for lid in ('background', 'water'):
            cols = layer_colours(layer_by_id(s['json'], lid))
            if len(cols) != 1:
                raise Unsupported(f'{key} {lid}: expected one colour, got {cols}')
            refs.append((key, parse_colour(cols[0])[:3]))
    frames = {}
    with tempfile.TemporaryDirectory() as tmp:
        for i, t in enumerate(times):
            png = os.path.join(tmp, f'{i}.png')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', VIDEO,
                            '-frames:v', '1', png], check=True)
            im = Image.open(png).convert('RGB')
            win, share, second, sshare = classify(im, refs)
            print(f'  F1 frame at {t:5.2f}s → {win:9} ({share:.0%} of pixels; next {second} {sshare:.0%})')
            if sshare and share < MIN_LEAD * sshare:
                sys.exit(f'F1: the frame at {t}s is ambiguous ({win} {share:.0%} vs {second} {sshare:.0%}). Nothing written.')
            if win in frames:
                sys.exit(f'F1: two frames both look like {win}. Nothing written.')
            frames[win] = im.copy()
    if set(frames) != set(styles):
        sys.exit(f'F1: expected five distinct styles, found {sorted(frames)}. Nothing written.')
    return frames


def five_up_html(styles, frames):
    items = []
    for key, s in styles.items():
        im = frames[key]
        items.append(
            f'<li><img src="img/map-figures/five-up-{key}.webp" width="{im.width}" height="{im.height}" '
            f'alt="The Twin Cities in {esc(s["title"])}, labels hidden" loading="lazy" decoding="async">'
            f'<span class="fig-label">{esc(s["name"])}</span></li>')
    return '<ul class="fig-fiveup">' + ''.join(items) + '</ul>'


# =============================================================================
# F2 palette sheet
# =============================================================================

def palette(styles):
    """{style: [(role, [colours], layer id or None)]}"""
    out = {}
    for key, s in styles.items():
        rows = []
        for role, candidates in PALETTE_ROLES:
            cols, lid = role_colours(s['json'], candidates)
            if len(cols) > MAX_SPLIT:
                raise Unsupported(f'{key} {role}: {len(cols)} colours, more than a split swatch shows')
            rows.append((role, cols, lid))
        out[key] = rows
    return out


def swatch_svg(cols, t):
    """A 40 x 24 swatch: one colour, a split of up to three, or a dashed
    empty box for a role that's switched off."""
    if not cols:
        return (f'<svg class="pal-sw" width="40" height="24" viewBox="0 0 40 24" aria-hidden="true">'
                f'<rect x=".75" y=".75" width="38.5" height="22.5" fill="none" stroke="{t["rule-ink"]}" '
                f'stroke-width="1.5" stroke-dasharray="3 2"/></svg>')
    w = 40 / len(cols)
    rects = ''.join(f'<rect x="{fmt(i * w)}" y="0" width="{fmt(w)}" height="24" fill="{esc(c)}"/>'
                    for i, c in enumerate(cols))
    return (f'<svg class="pal-sw" width="40" height="24" viewBox="0 0 40 24" aria-hidden="true">{rects}'
            f'<rect x=".5" y=".5" width="39" height="23" fill="none" stroke="{t["stroke"]}" stroke-opacity=".25"/></svg>')


def palette_html(styles, pal, t):
    blocks = []
    for key, s in styles.items():
        cells = []
        for role, cols, lid in pal[key]:
            hexes = ' / '.join(cols) if cols else 'off'
            cls = 'pal-cell' + ('' if cols else ' pal-off')
            cells.append(f'<li class="{cls}"><span class="pal-role">{esc(role)}</span>{swatch_svg(cols, t)}'
                         f'<span class="pal-hex">{esc(hexes)}</span></li>')
        blocks.append(f'<div class="pal-style"><p class="pal-name">{esc(s["title"])}</p>'
                      f'<ul class="pal-cells">{"".join(cells)}</ul></div>')
    return '<div class="fig-palette">' + ''.join(blocks) + '</div>'


# =============================================================================
# F3 zoom ladder
# =============================================================================

def ladder_rows(style):
    """Visible layers as (group, id, lo, hi), in draw order. Protomaps layers
    group by their source-layer; layers from another source (the contours)
    by that source's id."""
    rows = []
    for layer in style['layers']:
        if not visible(layer):
            continue
        if layer['type'] == 'background':
            group = 'background'
        elif layer.get('source') == 'protomaps':
            group = layer['source-layer']
        else:
            group = layer['source']
        lo, hi = zoom_range(style, layer)
        rows.append((group, layer['id'], lo, hi))
    return rows


def union(spans):
    out = []
    for lo, hi in sorted(spans):
        if out and lo <= out[-1][1]:
            out[-1][1] = max(out[-1][1], hi)
        else:
            out.append([lo, hi])
    return out


def ladder_groups(rows):
    order, groups = [], {}
    for g, lid, lo, hi in rows:
        if g not in groups:
            order.append(g)
            groups[g] = []
        groups[g].append((lo, hi))
    return [(g, groups[g]) for g in order]


def zrange(lo, hi):
    return f'{fmt(lo)}–{fmt(hi)}'


def ladder_svg(groups, tiles_end, t, narrow):
    n = sum(len(sp) for _, sp in groups)
    W = 360 if narrow else 1200
    ls = t['label-size']
    left = 12 if narrow else 250
    right = W - (14 if narrow else 30)
    row_h = 46 if narrow else 36
    top = 46
    H = top + row_h * len(groups) + 10
    x = lambda z: left + (right - left) * z / 24
    title = f'When each of the {n} visible Strib Outdoors layers draws, by data layer'
    desc = ('Bars on a zoom axis from 0 to 24, one row per data layer, spanning the zooms where at least one of its '
            f'layers draws; tick marks show where individual layers start. A line at zoom {fmt(tiles_end)} marks where the tiles end. '
            'The full list of layers is in the table below.')
    o = [svg_open(W, H, title, desc, 'fig-narrow' if narrow else 'fig-wide')]
    # axis: gridlines and zoom numbers
    for z in LADDER_TICKS:
        o.append(f'<line x1="{fmt(x(z))}" y1="{top - 8}" x2="{fmt(x(z))}" y2="{H - 6}" stroke="{t["rule"]}" stroke-width="1"/>')
        o.append(label(x(z), top - 14, str(z), ls, t['label-ink'], 'middle'))
    o.append(label(left if narrow else left - 16, 16, 'Zoom', ls, t['label-ink'], 'start' if narrow else 'end'))
    # the end of the tiles
    o.append(f'<line x1="{fmt(x(tiles_end))}" y1="{top - 8}" x2="{fmt(x(tiles_end))}" y2="{H - 6}" '
             f'stroke="{t["accent-ink"]}" stroke-width="1.5"/>')
    o.append(label(x(tiles_end) + 6, 16, 'Tiles end', ls, t['accent-ink']))
    for i, (g, spans) in enumerate(groups):
        y = top + i * row_h
        name = GROUP_NAMES.get(g, g)
        count = f'{len(spans)} layer' + ('' if len(spans) == 1 else 's')
        if narrow:
            o.append(label(left, y + 14, f'{name} · {count}', ls, t['ink']))
            by = y + 22
        else:
            o.append(label(left - 16, y + 16, name, ls, t['ink'], 'end'))
            o.append(label(left - 16, y + 30, count, t['small-size'], t['label-ink'], 'end'))
            by = y + 12
        for lo, hi in union(spans):
            o.append(f'<rect x="{fmt(x(lo))}" y="{by}" width="{fmt(x(hi) - x(lo))}" height="10" rx="2" fill="{t["label-ink"]}"/>')
        for z in sorted({lo for lo, _ in spans}):
            o.append(f'<line x1="{fmt(x(z))}" y1="{by + 12}" x2="{fmt(x(z))}" y2="{by + 19}" stroke="{t["label-ink"]}" stroke-width="1.5"/>')
    o.append('</svg>')
    return ''.join(o)


def ladder_table(rows, tiles_end, t):
    """Every layer, with a small bar of its zoom range: the full ladder, and
    the data table for the chart above it."""
    body = []
    for g, lid, lo, hi in rows:
        x0, x1 = 120 * lo / 24, 120 * hi / 24
        bar = (f'<svg width="120" height="10" viewBox="0 0 120 10" aria-hidden="true">'
               f'<rect x="0" y="4" width="120" height="2" fill="{t["rule-soft"]}"/>'
               f'<rect x="{fmt(x0)}" y="2" width="{fmt(x1 - x0)}" height="6" rx="1" fill="{t["label-ink"]}"/>'
               f'<line x1="{fmt(120 * tiles_end / 24)}" y1="0" x2="{fmt(120 * tiles_end / 24)}" y2="10" '
               f'stroke="{t["accent-ink"]}" stroke-width="1"/></svg>')
        body.append(f'<tr><td>{esc(lid)}</td><td>{esc(GROUP_NAMES.get(g, g))}</td>'
                    f'<td>{zrange(lo, hi)}</td><td class="fig-bar">{bar}</td></tr>')
    return (f'<details class="fig-more"><summary>All {len(rows)} layers</summary><div class="fig-scroll">'
            f'<table class="fig-table fig-ladder-table"><thead><tr><th scope="col">Layer</th>'
            f'<th scope="col">Data layer</th><th scope="col">Zooms</th><th scope="col"><span class="fig-vh">Range</span></th>'
            f'</tr></thead><tbody>{"".join(body)}</tbody></table></div></details>')


# =============================================================================
# F4 label ramps
# =============================================================================

def walk(expr):
    yield expr
    if isinstance(expr, list):
        for e in expr:
            yield from walk(e)


def rank_splits(expr):
    """The population_rank values the Outdoors size expression compares
    against (each zoom stop splits towns into two tiers at one rank)."""
    out = set()
    for e in walk(expr):
        if (isinstance(e, list) and len(e) == 3 and e[0] in ('<', '>=') and e[1] == ['get', 'population_rank']):
            out.add(_num(e[2], 'rank split'))
    if not out:
        raise Unsupported('no population_rank splits found')
    return sorted(out)


def outdoors_ramps(style):
    layer = layer_by_id(style, RAMP_LAYER)
    lo, hi = zoom_range(style, layer)
    z0, z1 = max(RAMP_ZOOMS[0], lo), min(RAMP_ZOOMS[1], hi)
    expr = layer['layout']['text-size']
    splits = rank_splits(expr)
    ranks = sorted({r for s in splits for r in (s - 1, s)})
    zs = [round(z0 + i * .25, 2) for i in range(int((z1 - z0) / .25) + 1)]
    curves = {r: tuple(round(evaluate(expr, z, {'population_rank': r}), 4) for z in zs) for r in ranks}
    # ranks that draw the same size at every zoom share one line
    classes = []
    for r in ranks:
        for c in classes:
            if curves[c[0]] == curves[r]:
                c.append(r)
                break
        else:
            classes.append([r])
    return {'zs': zs, 'ranks': ranks, 'classes': [(c, curves[c[0]]) for c in classes], 'z0': z0, 'z1': z1}


def rank_label(rs, all_ranks):
    lo, hi = min(rs), max(rs)
    if lo == min(all_ranks) and hi == max(all_ranks):
        return 'All ranks'
    if lo == min(all_ranks):
        return f'Rank {hi} and below'
    if hi == max(all_ranks):
        return f'Rank {lo} and up'
    return f'Rank {lo}' if lo == hi else f'Rank {lo}–{hi}'


def elex_threshold(case):
    """The population a band's case expression requires:
    ["case", [">=", ["coalesce", ["get", "population"], 0], N], size, 0].
    None for a band without a case (every place shows)."""
    if isinstance(case, list) and case and case[0] == 'interpolate':
        return None
    if (isinstance(case, list) and len(case) == 4 and case[0] == 'case'
            and isinstance(case[1], list) and case[1][0] == '>='
            and case[1][1] == ['coalesce', ['get', 'population'], 0] and case[3] == 0):
        return _num(case[1][2], 'threshold')
    raise Unsupported(f'unexpected Elex label band: {json.dumps(case)[:100]}')


def elex_ramps(style):
    layer = layer_by_id(style, RAMP_LAYER)
    expr = layer['layout']['text-size']
    if expr[0] != 'step' or expr[1] != ['zoom']:
        raise Unsupported('Elex text-size is not a step on zoom')
    edges = [RAMP_ZOOMS[0]] + expr[3::2]
    outs = [expr[2]] + expr[4::2]
    tops = {e[-2] for e in walk(expr) if isinstance(e, list) and e and e[0] == 'interpolate'}
    if len(tops) != 1:
        raise Unsupported(f'Elex bands interpolate up to different populations: {tops}')
    top = tops.pop()
    bands = []
    for z, out in zip(edges, outs):
        if z > RAMP_ZOOMS[1]:
            break
        thr = elex_threshold(out)
        small = evaluate(expr, z, {'population': thr if thr is not None else 0})
        big = evaluate(expr, z, {'population': top})
        if bands and bands[-1]['thr'] == thr and bands[-1]['small'] == small and bands[-1]['big'] == big:
            continue                    # same as the band before: one band
        bands.append({'z': z, 'thr': thr, 'small': small, 'big': big})
    return {'bands': bands, 'top': top}


def ramps_svg(od, ex, titles, t, narrow):
    W = 360 if narrow else 780
    ls, ss = t['label-size'], t['small-size']
    left, right = (34, W - 10) if narrow else (52, W - 24)
    ph = 280 if narrow else 330          # each chart's height, headings included
    gap = 74
    y_lo, y_hi = 8, 22                   # px, the y axis
    z0, z1 = RAMP_ZOOMS
    x = lambda z: left + (right - left) * (z - z0) / (z1 - z0)
    H = 2 * (ph + gap) + 6
    title = 'Town-label size by zoom in Strib Outdoors and Strib Elex'
    desc = ('Two charts sharing a zoom axis from 5 to 14 and a label-size axis in pixels. '
            'Outdoors sizes town names in two tiers by population rank; the rank needed for the larger tier loosens as you zoom in. '
            'Elex sizes them by population, showing the smallest and the largest town at each zoom band, with the population '
            'each band requires. The numbers are in the table below.')
    o = [svg_open(W, H, title, desc, 'fig-narrow' if narrow else 'fig-wide')]

    edge = left - (34 if narrow else 52) + 2         # the left edge of the headings

    def panel(top, heading, note):
        """Axes for one chart; returns its y scale (label px → SVG y)."""
        o.append(label(edge, top + 12, heading, ls, t['ink']))
        lines = wrap(note, right - edge, t['text-size'])
        for k, s in enumerate(lines):
            o.append(prose(edge, top + 32 + k * 18, s, t['text-size'], t['label-ink']))
        head = 32 + len(lines) * 18
        o.append(label(edge, top + head + 6, 'px', ss, t['label-ink'], caps=False))
        y = lambda v: top + head + 20 + (ph - head - 40) * (1 - (v - y_lo) / (y_hi - y_lo))
        for v in range(y_lo, y_hi + 1, 4):
            o.append(f'<line x1="{left}" y1="{fmt(y(v))}" x2="{right}" y2="{fmt(y(v))}" stroke="{t["rule-soft"]}"/>')
            o.append(label(left - 8, y(v) + 4, f'{v}', ss, t['label-ink'], 'end'))
        base = y(y_lo)
        o.append(f'<line x1="{left}" y1="{fmt(base)}" x2="{right}" y2="{fmt(base)}" stroke="{t["rule-ink"]}"/>')
        for z in range(z0, z1 + 1):
            o.append(f'<line x1="{fmt(x(z))}" y1="{fmt(base)}" x2="{fmt(x(z))}" y2="{fmt(base + 4)}" stroke="{t["rule-ink"]}"/>')
            o.append(label(x(z), base + 18, str(z), ss, t['label-ink'], 'middle'))
        o.append(label(right, base + 36, 'Zoom', ss, t['label-ink'], 'end'))
        return y

    # Outdoors: one line per group of ranks that draw alike
    y = panel(0, titles[0], 'One line for each group of population ranks that are sized alike.' +
              (' The numbers are ranks.' if narrow else ''))
    colour = t['label-ink']
    for ranks, curve in od['classes']:
        pts = ' '.join(f'{fmt(x(z))},{fmt(y(v))}' for z, v in zip(od['zs'], curve))
        o.append(f'<polyline points="{pts}" fill="none" stroke="{colour}" stroke-width="2" stroke-linejoin="round"/>')
    # Direct labels, one per line, each where its line can be told apart:
    # the top rank group at the left, the bottom one at the right, and each
    # rank in between just under the top tier, where its line joins it (or
    # at the right end if it hasn't joined by then).
    halo = f' paint-order="stroke" stroke="{t["plate"]}" stroke-width="4" stroke-linejoin="round"'
    top_curve = max(od['classes'], key=lambda c: max(c[0]))[1]
    zs = od['zs']
    for ranks, curve in od['classes']:
        name = rank_label(ranks, od['ranks'])
        if narrow:
            name = name.replace('Rank ', '')      # little room on a phone: just the rank
        if narrow and min(ranks) == min(od['ranks']):
            # under its line at the right, clear of the line rising above it
            o.append(label(x(zs[-1]) - 2, y(curve[-1]) + ss + 6, name, ss, t['ink'], 'end', extra=halo))
            continue
        if max(ranks) == max(od['ranks']):
            # above its line, from where the first other line has joined it
            first = min([i for _, c in od['classes'] if c != curve
                         for i in range(1, len(zs)) if c[i] == curve[i]] or [0])
            o.append(label(x(zs[first]) + 4, y(curve[first]) - 14, name, ss, t['ink'], extra=halo))
            continue
        joins = [i for i in range(1, len(zs)) if curve[i] == top_curve[i]]
        if min(ranks) != min(od['ranks']) and joins:
            i = joins[0]
            o.append(label(x(zs[i]) + (3 if narrow else 6), y(curve[i]) + ss + 6, name, ss, t['ink'], extra=halo))
        else:
            o.append(label(x(zs[-1]) - 2, y(curve[-1]) - 8, name, ss, t['ink'], 'end', extra=halo))
    o.append(label(x(od['z1']), y(y_lo) - 8, f'Labels stop at z{fmt(od["z1"])}', ss, t['label-ink'], 'end'))

    # Elex: steps for the biggest town and the smallest one shown
    y = panel(ph + gap, titles[1], 'Top line: a town of {}. Bottom line: the smallest town labelled.'.format(thousands(ex['top']))
              if narrow else 'Between the lines: the population a town needs for a label.')
    colour = t['teal']
    bands = ex['bands']
    for key in ('big', 'small'):
        d = ''
        for i, b in enumerate(bands):
            xa = x(b['z'])
            xb = x(bands[i + 1]['z']) if i + 1 < len(bands) else x(z1)
            d += f'{"M" if i == 0 else "L"}{fmt(xa)} {fmt(y(b[key]))} L{fmt(xb)} {fmt(y(b[key]))} '
        o.append(f'<path d="{d.strip()}" fill="none" stroke="{colour}" stroke-width="2" stroke-linejoin="round"/>')
    last = bands[-1]
    if last['z'] == z1:                  # a band that starts at the axis end: show it as dots
        for key in ('big', 'small'):
            o.append(f'<circle cx="{fmt(x(z1))}" cy="{fmt(y(last[key]))}" r="3.5" fill="{colour}"/>')
    if narrow:
        # too little room between the steps on a phone: the populations go
        # underneath, as a sentence
        need = ' · '.join(f'z{fmt(b["z"])}: ' + (f'{thousands(b["thr"])}+' if b['thr'] is not None else 'all')
                          for b in bands)
        lines = wrap('Population a town needs for a label, from each zoom: ' + need, right - edge, t['text-size'])
        yy = 2 * ph + gap + 44              # under the second chart's zoom axis
        for k, line in enumerate(lines):
            o.append(prose(edge, yy + k * 18, line, t['text-size'], t['label-ink']))
        o[0] = svg_open(W, yy + len(lines) * 18, title, desc, 'fig-narrow')
        o.append('</svg>')
        return ''.join(o)
    # name the two lines on the widest band, so the labels sit clear of the steps
    widest = max(range(len(bands) - 1), key=lambda i: bands[i + 1]['z'] - bands[i]['z'])
    b = bands[widest]
    o.append(label(x(b['z']) + 6, y(b['big']) - 8, f'Town of {thousands(ex["top"])}', ss, t['ink'], extra=halo))
    o.append(label(x(b['z']) + 6, y(b['small']) + ss + 6, 'Smallest town shown', ss, t['ink'], extra=halo))
    # the population each band needs, between the two lines
    for i, b in enumerate(bands):
        xa = x(b['z'])
        xb = x(bands[i + 1]['z']) if i + 1 < len(bands) else x(z1)
        need = f'{thousands(b["thr"])}+' if b['thr'] is not None else 'All'
        cx, anchor = ((xa + xb) / 2, 'middle') if xb > xa else (xa - 8, 'end')
        o.append(label(cx, (y(b['small']) + y(b['big'])) / 2 + ss * .36 + (6 if i == widest else 0),
                       need, ss, t['label-ink'], anchor))
    o.append('</svg>')
    return ''.join(o)


def ramps_table(od, ex):
    rows = []
    zs = sorted({z for z in range(RAMP_ZOOMS[0], RAMP_ZOOMS[1] + 1)} | {b['z'] for b in ex['bands']})
    for z in zs:
        cells = [fmt(z)]
        for ranks, curve in od['classes']:
            cells.append(px(curve[od['zs'].index(z)]) if z in od['zs'] else '–')
        band = [b for b in ex['bands'] if b['z'] <= z][-1]
        need = f'{thousands(band["thr"])}+' if band['thr'] is not None else 'all'
        rows.append(cells + [need, px(band['small']), px(band['big'])])
    head = (['Zoom'] + [f'Outdoors, {rank_label(r, od["ranks"]).lower()} (px)' for r, _ in od['classes']] +
            ['Elex: population needed', 'Elex: smallest town (px)', f'Elex: town of {thousands(ex["top"])} (px)'])
    return data_table('The numbers', head, rows)


# =============================================================================
# F5 hubs map
# =============================================================================

def hubs_data(style):
    feats = style['sources'][HUBS_SOURCE]['data']['features']
    hubs = [(f['properties']['name'], f['properties']['population'], *f['geometry']['coordinates']) for f in feats]
    hubs.sort(key=lambda h: (-h[1], h[0]))
    polys = set()
    for layer in style['layers']:
        for e in walk(layer.get('filter')):
            if isinstance(e, list) and e and e[0] == 'within':
                polys.add(json.dumps(e[1], sort_keys=True))
    if len(polys) != 1:
        raise Unsupported(f'expected one "within" outline in {HUBS_STYLE}, found {len(polys)}')
    poly = json.loads(polys.pop())
    if poly['type'] != 'Polygon':
        raise Unsupported('the "within" outline is not a single polygon')
    clipped = sum(1 for layer in style['layers'] if any(isinstance(e, list) and e and e[0] == 'within'
                                                        for e in walk(layer.get('filter'))))
    for name in HUB_LABELS_EXTRA:
        if name not in [h[0] for h in hubs]:
            raise Unsupported(f'{name} is not one of the {HUBS_SOURCE} cities')
    hub_layer = [l for l in style['layers'] if l.get('source') == HUBS_SOURCE]
    return hubs, poly['coordinates'], clipped, hub_layer


# where each label sits: right of its circle unless listed here (set by eye,
# after looking at the map, so labels don't cover other circles or leave it)
HUB_LABEL_SIDE = {'Grand Marais': 'left', 'Red Wing': 'left', 'Austin': 'left', 'Moorhead': 'above'}


def hubs_svg(hubs, rings, t, narrow):
    W, H = (360, 450) if narrow else (600, 660)
    pad = 16 if narrow else 24
    ls = t['small-size'] if narrow else t['label-size']
    k = math.cos(math.radians(HUB_LAT))
    pts = [(lon * k, lat) for lon, lat in rings[0]]
    minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
    miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
    key_h = 54 if narrow else 60
    s = min((W - 2 * pad) / (maxx - minx), (H - 2 * pad - key_h) / (maxy - miny))
    ox = (W - s * (maxx - minx)) / 2
    oy = pad
    proj = lambda lon, lat: (ox + (lon * k - minx) * s, oy + (maxy - lat) * s)
    rmax = 11 if narrow else 15
    pmax = hubs[0][1]
    radius = lambda p: rmax * math.sqrt(p / pmax)          # area ∝ population
    title = f'The {len(hubs)} regional cities Strib Elex labels at zooms 5 to 8'
    desc = (f'A map of Minnesota\'s outline with {len(hubs)} cities drawn as circles sized by population, from '
            f'{hubs[0][0]} ({thousands(hubs[0][1])}) to {hubs[-1][0]} ({thousands(hubs[-1][1])}). '
            'Every city is listed in the table below.')
    o = [svg_open(W, H, title, desc, 'fig-narrow' if narrow else 'fig-wide')]
    for ring in rings:
        d = 'M' + ' L'.join(f'{fmt(a)} {fmt(b)}' for a, b in (proj(*p) for p in ring)) + ' Z'
        o.append(f'<path d="{d}" fill="{t["bg"]}" stroke="{t["rule-ink"]}" stroke-width="1.25" stroke-linejoin="round"/>')
    labelled = {h[0] for h in hubs[:HUB_LABELS_TOP]} | set(HUB_LABELS_EXTRA)
    for name, pop, lon, lat in sorted(hubs, key=lambda h: -h[1]):   # big circles under small ones
        cx, cy = proj(lon, lat)
        o.append(f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(radius(pop))}" fill="{t["teal"]}" '
                 f'fill-opacity=".85" stroke="{t["plate"]}" stroke-width="1.5"/>')
    halo = f' paint-order="stroke" stroke="{t["bg"]}" stroke-width="4" stroke-linejoin="round"'
    for name, pop, lon, lat in hubs:
        if name not in labelled:
            continue
        cx, cy = proj(lon, lat)
        side = HUB_LABEL_SIDE.get(name, 'right')
        r = radius(pop)
        if side == 'above':
            o.append(label(cx - r, cy - r - 5, name, ls, t['ink'], extra=halo))   # starts over the circle's left edge
        else:
            dx = r + 4 if side == 'right' else -(r + 4)
            o.append(label(cx + dx, cy + ls * .36, name, ls, t['ink'], 'start' if side == 'right' else 'end', extra=halo))
    # size key: one circle per HUB_KEY population, side by side
    ky = H - pad
    kx = pad + 4
    o.append(label(kx, ky - 2 * rmax - 14, 'Population', ls, t['label-ink']))
    for p in HUB_KEY:
        r = radius(p)
        o.append(f'<circle cx="{fmt(kx + r)}" cy="{fmt(ky - r)}" r="{fmt(r)}" fill="{t["teal"]}" fill-opacity=".85" '
                 f'stroke="{t["plate"]}" stroke-width="1.5"/>')
        o.append(label(kx + 2 * r + 5, ky - r + ls * .36, thousands(p), ls, t['label-ink']))
        kx += 2 * r + 5 + text_width(thousands(p), ls) + 14
    o.append('</svg>')
    return ''.join(o)


def hubs_table(hubs):
    rows = [[n, thousands(p), f'{lat:.4f}', f'{lon:.4f}'] for n, p, lon, lat in hubs]
    return data_table(f'All {len(hubs)} cities', ['City', 'Population', 'Latitude', 'Longitude'], rows)


# =============================================================================
# F6 Elex contract card (state A: the layer stack)
# =============================================================================

def stack_bands(style):
    anchor = style['metadata']['stribElex']['choroplethAnchor']
    ids = [l['id'] for l in style['layers']]
    if anchor not in ids:
        raise Unsupported(f'anchor layer "{anchor}" is not in the Elex style')
    i = ids.index(anchor)
    below, above = style['layers'][:i], style['layers'][i + 1:]
    labels = [l for l in above if visible(l) and l['type'] == 'symbol']
    lines = [l for l in above if visible(l) and l['type'] != 'symbol']
    groups = []
    for l in lines:
        g = l.get('source-layer') or l.get('source')
        if g not in groups:
            groups.append(g)
    below_vis = [l for l in below if visible(l)]
    if [l['type'] for l in below_vis] != ['background']:
        raise Unsupported('Elex: expected only the background to draw below the anchor; the diagram needs redrawing')
    anchor_layer = style['layers'][i]
    return {
        'anchor': anchor,
        'anchor_colour': layer_colours(anchor_layer)[0],
        'labels': len(labels),
        'lines': len(lines),
        'line_groups': groups,
        'below_off': len(below) - len(below_vis),
    }


def stack_svg(b, t, narrow):
    W = 360 if narrow else 480
    ls, ts = t['label-size'], t['text-size']
    bands = [
        ('Labels', f'{b["labels"]} visible label layers', t['plate'], None),
        ('Everything else above water', f'{b["lines"]} visible layers: ' + ', '.join(b['line_groups']), t['plate'], None),
        ('Water: the anchor', f'layer "{b["anchor"]}", {b["anchor_colour"]}', b['anchor_colour'], None),
        ('Election layers insert here', f'beforeId "{b["anchor"]}"', None, 'insert'),
        ('Everything below: one flat neutral', f'the background; {b["below_off"]} land fills switched off', t['plate'], None),
    ]
    gap, x0 = 8, 28
    title = 'Strib Elex layer stack around the election anchor'
    desc = ('Five bands, top to bottom: labels; the other layers above water; the water layer, which is the anchor; '
            'the slot where election layers are inserted, directly beneath water; and everything below, meant to '
            'resolve to one flat neutral.')
    o, y = [], 2
    for name, sub, fill, kind in bands:
        lines = wrap(sub, W - x0 - 30, ts)
        bh = 40 + len(lines) * 18
        if kind == 'insert':
            o.append(f'<rect x="{x0}" y="{y}" width="{W - x0 - 2}" height="{bh}" rx="3" fill="none" '
                     f'stroke="{t["accent-ink"]}" stroke-width="1.5" stroke-dasharray="5 3"/>')
            o.append(arrow(4, y + bh / 2, x0 - 6, y + bh / 2, t['accent-ink']))
            colour = t['accent-ink']
        else:
            o.append(f'<rect x="{x0}" y="{y}" width="{W - x0 - 2}" height="{bh}" rx="3" fill="{esc(fill)}" '
                     f'stroke="{t["rule-ink"]}" stroke-width="1"/>')
            colour = t['ink']
        o.append(label(x0 + 14, y + 24, name, ls, colour))
        for k, s in enumerate(lines):
            o.append(prose(x0 + 14, y + 44 + k * 18, s, ts, colour))
        y += bh + gap
    return svg_open(W, y - gap + 2, title, desc, 'fig-narrow' if narrow else 'fig-wide') + ''.join(o) + '</svg>'


def stack_table(b):
    rows = [['Labels', f'{b["labels"]} visible label layers'],
            ['Everything else above water', f'{b["lines"]} visible layers ({", ".join(b["line_groups"])})'],
            ['Water (the anchor)', f'layer "{b["anchor"]}", {b["anchor_colour"]}'],
            ['Election layers', f'inserted with beforeId "{b["anchor"]}", directly beneath water'],
            ['Everything below', f'the background; {b["below_off"]} land fills switched off']]
    return data_table('The stack as a list', ['Band, top to bottom', 'In strib-elex.json'], rows)


# =============================================================================
# F7 pipeline
# =============================================================================

def pipeline_rows():
    """The three pipelines, as rows of nodes; each node is (lines, is a script).
    The numbers are read from the repo."""
    strokes = len([f for f in os.listdir(STROKES) if f.endswith('.svg')])
    src = open(COMPRESS).read()
    ssim = re.search(r'^MIN_SSIM\s*=\s*([\d.]+)', src, re.M)[1]
    keep = float(re.search(r'getsize\(out\)\s*<\s*size\s*\*\s*([\d.]+)', src)[1])
    saving = round((1 - keep) * 100)
    return [
        [(['maps/strib-*.json'], False), (['make-map-figures.py'], True), (['Figures on', 'this page'], False)],
        [(['css/site.css', 'tokens'], False), (['make-strokes.py'], True), ([f'{strokes} SVG strokes'], False),
         (['css/strokes.css'], False)],
        [(['Tile images'], False), (['crossfade-loop.sh', 'endless-scroll.sh'], True),
         (['compress-videos.py', f'SSIM {ssim}+', f'saves {saving}%+'], True), (['img/tiles/*.mp4'], False)],
    ], strokes, ssim, saving


def node_box(o, x, y, w, h, lines, script, t, size):
    stroke = t['label-ink'] if script else t['rule-ink']
    sw = 1.5 if script else 1
    o.append(f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" rx="4" fill="{t["plate"]}" '
             f'stroke="{stroke}" stroke-width="{sw}"/>')
    lh = size + 4
    y0 = y + h / 2 - (len(lines) - 1) * lh / 2 + size * .36
    for i, s in enumerate(lines):
        caps = not re.search(r'[./*]', s)          # file names keep their own case
        o.append(label(x + w / 2, y0 + i * lh, s, size, t['ink'], 'middle', caps=caps))


def pipeline_svg(rows, t, narrow):
    size = t['small-size']
    if narrow:
        W, nw, nh, vgap, rgap = 360, 220, 46, 22, 30
        H = sum(len(r) * nh + (len(r) - 1) * vgap for r in rows) + rgap * (len(rows) - 1) + 4
    else:
        W, nh, rgap = 584, 62, 26
        H = len(rows) * nh + (len(rows) - 1) * rgap + 4
    title = 'Three pipelines: what each script reads and writes'
    desc = '; '.join(' then '.join(' '.join(n[0]) for n in r) for r in rows) + '.'
    o = [svg_open(W, H, title, desc, 'fig-narrow' if narrow else 'fig-wide')]
    if narrow:
        y = 2
        x = (W - nw) / 2
        for r in rows:
            for j, (lines, script) in enumerate(r):
                node_box(o, x, y, nw, nh, lines, script, t, size)
                if j + 1 < len(r):
                    o.append(arrow(W / 2, y + nh + 2, W / 2, y + nh + vgap - 2, t['rule-ink']))
                y += nh + (vgap if j + 1 < len(r) else 0)
            y += rgap
    else:
        cols = max(len(r) for r in rows)
        agap = 14
        widths = []
        for c in range(cols):
            w = 0
            for r in rows:
                if c < len(r):
                    lines = r[c][0]
                    w = max(w, max(text_width(s, size, 'lower' if re.search(r'[./*]', s) else 'caps') for s in lines))
            widths.append(w + 12)
        spare = W - 4 - sum(widths) - agap * (cols - 1)
        if spare < 0:
            raise Unsupported(f'F7 nodes are {-spare:.0f}px too wide for {W}px')
        widths = [w + spare / cols for w in widths]
        for i, r in enumerate(rows):
            y = 2 + i * (nh + rgap)
            x = 2
            for j, (lines, script) in enumerate(r):
                node_box(o, x, y, widths[j], nh, lines, script, t, size)
                if j + 1 < len(r):
                    o.append(arrow(x + widths[j] + 3, y + nh / 2, x + widths[j] + agap - 3, y + nh / 2, t['rule-ink']))
                x += widths[j] + agap
    o.append('</svg>')
    return ''.join(o)


def pipeline_list(rows):
    items = ''.join('<li>' + esc(' → '.join(' '.join(n[0]) for n in r)) + '</li>' for r in rows)
    return f'<details class="fig-data"><summary>As a list</summary><ol>{items}</ol></details>'


# =============================================================================
# F8 trial and revert
# =============================================================================

def read_commit(h):
    out = subprocess.run(['git', '-C', ROOT, 'show', '-s', '--format=%h%x00%ad%x00%s', '--date=short', h],
                         capture_output=True, text=True, check=True).stdout.strip()
    short, date, subject = out.split('\x00')
    return {'hash': short, 'date': date, 'subject': subject}


def trials():
    return [(heading, [read_commit(h) for h in hashes]) for heading, hashes in TRIALS]


def stamp(x, y, c, size, t):
    """'OCT. 8, 2026 · ce0503b': the date in capitals, the hash as git
    prints it, in one line of Bell Topo."""
    return (f'<text x="{fmt(x)}" y="{fmt(y)}" font-family="{esc(TOPO)}" font-size="{fmt(size)}" '
            f'letter-spacing="0.1em" fill="{t["label-ink"]}">{esc(ap_date(c["date"]).upper())} · '
            f'<tspan letter-spacing="0.04em">{esc(c["hash"])}</tspan></text>')


def trials_svg(rows, t, narrow):
    ls, ss, ts = t['label-size'], t['small-size'], t['text-size']
    W = 360 if narrow else 584
    agap = 22
    o_body = []
    y = 2
    for heading, commits in rows:
        o_body.append(label(2, y + 12, heading, ls, t['ink']))
        y += 24
        if narrow:
            for j, c in enumerate(commits):
                lines = wrap(c['subject'], W - 28, ts)
                h = 30 + len(lines) * (ts + 5) + 4
                o_body.append(f'<rect x="2" y="{fmt(y)}" width="{W - 4}" height="{fmt(h)}" rx="4" fill="{t["plate"]}" stroke="{t["rule-ink"]}"/>')
                o_body.append(stamp(14, y + 20, c, ss, t))
                for k, s in enumerate(lines):
                    o_body.append(prose(14, y + 40 + k * (ts + 5), s, ts, t['ink']))
                y += h
                if j + 1 < len(commits):
                    o_body.append(arrow(W / 2, y + 2, W / 2, y + agap - 2, t['rule-ink']))
                    y += agap
        else:
            n = len(commits)
            nw = (W - 4 - agap * (n - 1)) / n
            wrapped = [wrap(c['subject'], nw - 24, ts) for c in commits]
            h = 30 + max(len(w) for w in wrapped) * (ts + 5) + 4
            for j, c in enumerate(commits):
                x = 2 + j * (nw + agap)
                o_body.append(f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(nw)}" height="{fmt(h)}" rx="4" fill="{t["plate"]}" stroke="{t["rule-ink"]}"/>')
                o_body.append(stamp(x + 12, y + 20, c, ss, t))
                for k, s in enumerate(wrapped[j]):
                    o_body.append(prose(x + 12, y + 40 + k * (ts + 5), s, ts, t['ink']))
                if j + 1 < n:
                    o_body.append(arrow(x + nw + 3, y + h / 2, x + nw + agap - 3, y + h / 2, t['rule-ink']))
            y += h
        y += 26
    H = y - 22
    title = 'Trial and revert: two changes tried and taken back, from the commit history'
    desc = ' '.join(f'{heading}: ' + '; then '.join(f'{c["hash"]} on {ap_date(c["date"])}, "{c["subject"]}"' for c in commits) + '.'
                    for heading, commits in rows)
    return svg_open(W, H, title, desc, 'fig-narrow' if narrow else 'fig-wide') + ''.join(o_body) + '</svg>'


def trials_table(rows):
    body = [[heading, c['hash'], ap_date(c['date']), c['subject']] for heading, commits in rows for c in commits]
    return data_table('The commits', ['Change', 'Commit', 'Date', 'Subject'], body)


# =============================================================================
# Writing it all out
# =============================================================================

def standalone(svg):
    """An inline SVG as a file of its own (it already has its xmlns)."""
    return '<?xml version="1.0" encoding="utf-8"?>\n' + svg + '\n'


def inject(page_path, fragments):
    """Puts each fragment between its FIG markers. Checks every marker first;
    if any is missing, changes nothing."""
    page = open(page_path).read()
    missing = []
    for name in fragments:
        pat = re.compile(rf'(<!-- FIG:{re.escape(name)} START -->)[\s\S]*?(<!-- FIG:{re.escape(name)} END -->)')
        if not pat.search(page):
            missing.append(name)
    if missing:
        sys.exit(f"Couldn't find the FIG START / END comments for: {', '.join(missing)} in "
                 f"{os.path.relpath(page_path, ROOT)} — nothing changed.")
    for name, frag in fragments.items():
        pat = re.compile(rf'(<!-- FIG:{re.escape(name)} START -->)[\s\S]*?(<!-- FIG:{re.escape(name)} END -->)')
        page = pat.sub(lambda m: f'{m[1]}\n{frag}\n{m[2]}', page, count=1)
    with open(page_path, 'w') as f:
        f.write(page)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    ap.add_argument('--print', action='store_true', help='also print the HTML injected for each figure')
    ap.add_argument('--page', default=PAGE, help='the page to write into (default: cartography.html)')
    ap.add_argument('--elex-collisions', action='store_true',
                    help='F6 state B (waiting on question 5 in docs/cartography-spec.md)')
    args = ap.parse_args()
    if args.elex_collisions:
        sys.exit('F6 state B is gated: it needs Jake to confirm which Elex colours are current '
                 '(question 5 in docs/cartography-spec.md). Nothing written.')

    t = read_tokens()
    styles = read_styles()
    S = {k: s['json'] for k, s in styles.items()}

    # ---- what the figures rest on, printed so it can be checked ----
    print('Layers per style (total / visible):')
    for k, s in S.items():
        print(f'  {k:9} {len(s["layers"]):4} / {sum(visible(l) for l in s["layers"])}')

    print('F1 five-up:')
    frames = five_up(styles)

    pal = palette(styles)
    print('F2 palette (first visible layer per role; "off" = none visible):')
    print('  ' + f'{"":11}' + ''.join(f'{k:24}' for k in S))
    for i, (role, _) in enumerate(PALETTE_ROLES):
        cells = []
        for k in S:
            _, cols, lid = pal[k][i]
            cells.append(f'{" / ".join(cols)} ({lid})' if cols else 'off')
        print('  ' + f'{role:11}' + ''.join(f'{c:24}' for c in cells))

    ladder = ladder_rows(S[LADDER_STYLE])
    groups = ladder_groups(ladder)
    tiles_end = S[LADDER_STYLE]['sources']['protomaps']['maxzoom']
    print(f'F3 zoom ladder ({LADDER_STYLE}): {len(ladder)} visible layers in {len(groups)} groups; tiles end at z{tiles_end}')
    for g, spans in groups:
        print(f'  {g:14} {len(spans):3} layers  ' + ', '.join(zrange(lo, hi) for lo, hi in union(spans)))
    for lid in ('contours_50m', 'contours_10m', 'buildings_osm', 'roads_paths', 'places_locality'):
        lo, hi = zoom_range(S[LADDER_STYLE], layer_by_id(S[LADDER_STYLE], lid))
        print(f'  {lid:16} draws z{fmt(lo)}–{fmt(hi)}')

    od = outdoors_ramps(S['outdoors'])
    ex = elex_ramps(S['elex'])
    print(f'F4 label ramps: Outdoors ranks {od["ranks"]}, '
          f'{len(od["classes"])} distinct lines, z{fmt(od["z0"])}–{fmt(od["z1"])}')
    for z in (6, 10):
        print(f'  Outdoors z{z}: ' + ', '.join(f'{rank_label(r, od["ranks"])} {px(c[od["zs"].index(z)])}px'
                                              for r, c in od['classes']))
    for b in ex['bands']:
        need = thousands(b['thr']) + '+' if b['thr'] is not None else 'all'
        print(f'  Elex from z{fmt(b["z"])}: {need:8} {px(b["small"])}–{px(b["big"])}px')

    hubs, rings, clipped, hub_layers = hubs_data(S[HUBS_STYLE])
    print(f'F5 hubs: {len(hubs)} cities, {hubs[0][0]} {thousands(hubs[0][1])} … {hubs[-1][0]} {thousands(hubs[-1][1])}; '
          f'{clipped} layers clipped to the outline; hub layer(s) ' +
          ', '.join(f'{l["id"]} z{fmt(zoom_range(S[HUBS_STYLE], l)[0])}–{fmt(zoom_range(S[HUBS_STYLE], l)[1])}' for l in hub_layers))

    bands = stack_bands(S[HUBS_STYLE])
    print(f'F6 stack: anchor "{bands["anchor"]}" {bands["anchor_colour"]}; above: {bands["labels"]} label layers, '
          f'{bands["lines"]} others; below: background + {bands["below_off"]} hidden')

    pipes, strokes, ssim, saving = pipeline_rows()
    print(f'F7 pipeline: {strokes} strokes; SSIM {ssim}+; saves {saving}%+')
    commit_rows = trials()
    print('F8 trial and revert:')
    for heading, commits in commit_rows:
        for c in commits:
            print(f'  {c["hash"]} {c["date"]} {c["subject"]}')

    # ---- build every figure ----
    svgs = {
        'zoom-ladder': (ladder_svg(groups, tiles_end, t, False), ladder_svg(groups, tiles_end, t, True)),
        'label-ramps': (ramps_svg(od, ex, ('Strib Outdoors · by population rank', 'Strib Elex · by population'), t, False),
                        ramps_svg(od, ex, ('Outdoors · by population rank', 'Elex · by population'), t, True)),
        'hubs': (hubs_svg(hubs, rings, t, False), hubs_svg(hubs, rings, t, True)),
        'elex-stack': (stack_svg(bands, t, False), stack_svg(bands, t, True)),
        'pipeline': (pipeline_svg(pipes, t, False), pipeline_svg(pipes, t, True)),
        'trial-revert': (trials_svg(commit_rows, t, False), trials_svg(commit_rows, t, True)),
    }
    extras = {
        'zoom-ladder': ladder_table(ladder, tiles_end, t),
        'label-ramps': ramps_table(od, ex),
        'hubs': hubs_table(hubs),
        'elex-stack': stack_table(bands),
        'pipeline': pipeline_list(pipes),
        'trial-revert': trials_table(commit_rows),
    }
    fragments = {'five-up': five_up_html(styles, frames), 'palette': palette_html(styles, pal, t)}
    for name, (wide, narrow) in svgs.items():
        fragments[name] = (f'<div class="fig-svg">{wide}{narrow or ""}</div>' + extras[name])

    # ---- check the page before writing anything ----
    page = os.path.abspath(args.page)
    have_page = os.path.exists(page)
    if have_page:
        text = open(page).read()
        missing = [n for n in fragments if f'<!-- FIG:{n} START -->' not in text or f'<!-- FIG:{n} END -->' not in text]
        if missing:
            sys.exit(f"Couldn't find the FIG START / END comments for: {', '.join(missing)} in "
                     f"{os.path.relpath(page, ROOT)} — nothing changed.")

    os.makedirs(OUT, exist_ok=True)
    for key, im in frames.items():
        im.save(os.path.join(OUT, f'five-up-{key}.webp'), 'WEBP', quality=FRAME_QUALITY, method=6)
    for name, (wide, narrow) in svgs.items():
        open(os.path.join(OUT, f'{name}.svg'), 'w').write(standalone(wide))
        if narrow:
            open(os.path.join(OUT, f'{name}-narrow.svg'), 'w').write(standalone(narrow))
    print(f'Wrote {len(frames)} stills and {sum(1 + bool(n) for _, n in svgs.values())} SVGs to img/map-figures/')

    if have_page:
        inject(page, fragments)
        print(f'Wrote {len(fragments)} figures into {os.path.relpath(page, ROOT)}')
    else:
        print(f'{os.path.relpath(page, ROOT)} does not exist yet, so nothing was injected. It needs these markers:')
        for name, frag in fragments.items():
            print(f'  <!-- FIG:{name} START --> <!-- FIG:{name} END -->   ({len(frag):,} characters)')
    if args.print:
        for name, frag in fragments.items():
            print(f'\n<!-- FIG:{name} START -->\n{frag}\n<!-- FIG:{name} END -->')


if __name__ == '__main__':
    try:
        main()
    except Unsupported as e:
        sys.exit(f'Stopped, nothing written: {e}')
