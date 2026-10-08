#!/usr/bin/env python3
"""
embed-paper.py — builds the paper texture into css/paper.css.

The page's paper texture is two images, img/paper-grain.webp and
img/paper-mottle.webp (css/site.css, section 5). Loaded as separate files,
they arrive a beat after the page has drawn, so the texture pops in. This
writes them into css/paper.css, on the layers that show the texture, so
they arrive with the page's styles instead. If you replace
either image, run this again:

    python3 tools/embed-paper.py

(The grain keeps 16 steps of transparency, all in one brown; at the
texture's strength more steps can't be seen, and it halves the file.)
"""

import base64
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
IMAGES = {'paper-grain': 'img/paper-grain.webp', 'paper-mottle': 'img/paper-mottle.webp'}

# The images go straight onto the three layers that show the texture, rather
# than into a shared setting, which every element on the page would carry.
urls = [f'url("data:image/webp;base64,{base64.b64encode(open(os.path.join(ROOT, p), "rb").read()).decode()}")'
        for p in IMAGES.values()]
lines = ['/* paper.css — WRITTEN BY tools/embed-paper.py; don\'t edit by hand.',
         '   The paper texture\'s two images (grain, then mottling), built into the',
         '   stylesheet so the texture shows with the page rather than a beat',
         '   after it. Everything else about the texture is in css/site.css,',
         '   section 5. */',
         'body::before, .site::before, .jump::before {',
         '  background-image:',
         '    ' + ',\n    '.join(urls) + ';',
         '}']
open(os.path.join(ROOT, 'css', 'paper.css'), 'w').write('\n'.join(lines) + '\n')
print('Wrote css/paper.css')
