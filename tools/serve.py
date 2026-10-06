#!/usr/bin/env python3
"""
serve.py — preview the site locally the way GitHub Pages serves it.

The site links to short addresses: /resume and /contact rather than
resume.html and contact.html. GitHub Pages understands those, but Python's
plain `python3 -m http.server` doesn't. This is that same server with one
addition: if /something isn't a file or folder, it tries /something.html.

Run it from the repo folder:

    python3 tools/serve.py           # http://localhost:8000
    python3 tools/serve.py 5502      # or pick a port
"""

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


class CleanURLHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        # /resume → resume.html, when there's no file or folder called "resume"
        if not os.path.exists(local) and os.path.exists(local + '.html'):
            return local + '.html'
        return local


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(CleanURLHandler, directory=ROOT)
    print(f'Serving the site at http://localhost:{port}  (Ctrl+C to stop)')
    ThreadingHTTPServer(('', port), handler).serve_forever()
