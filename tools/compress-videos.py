#!/usr/bin/env python3
"""
compress-videos.py — re-encodes the looping tile videos (img/tiles/*.mp4)
a little smaller, without changing their length or size.

For each video it tries a few quality settings (x264 CRF; higher = smaller
and softer) and keeps the smallest one that still looks almost the same as
before: an SSIM similarity score of at least MIN_SSIM against the current
file (1.0 = identical). A video is left alone if that would save under
10%. Each new file replaces the old one, so running this again compresses
again — only do that on purpose.

    python3 tools/compress-videos.py              # every video in img/tiles/
    python3 tools/compress-videos.py legacy-tree  # just one

Needs ffmpeg (brew install ffmpeg).
"""

import glob, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
CRFS = [33, 31, 29, 27]      # tried from smallest to largest file
MIN_SSIM = 0.965

def ssim(a, b):
    out = subprocess.run(['ffmpeg', '-i', a, '-i', b, '-lavfi', 'ssim', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    return float(re.search(r'All:([0-9.]+)', out).group(1))

def main():
    names = sys.argv[1:]
    files = [os.path.join(ROOT, 'img', 'tiles', n + '.mp4') for n in names] if names \
        else sorted(glob.glob(os.path.join(ROOT, 'img', 'tiles', '*.mp4')))
    tmp = tempfile.mkdtemp()
    before = after = 0
    for f in files:
        size = os.path.getsize(f); before += size
        chosen = None
        for crf in CRFS:
            out = os.path.join(tmp, f'{crf}.mp4')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-an', '-c:v', 'libx264', '-preset', 'slow',
                            '-crf', str(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], check=True)
            s = ssim(out, f)
            if s >= MIN_SSIM and os.path.getsize(out) < size * .9:
                chosen = (crf, s, out); break
        name = os.path.basename(f)
        if chosen:
            crf, s, out = chosen
            shutil.copyfile(out, f)
            print(f'{name:40} {size // 1024:6} KB -> {os.path.getsize(f) // 1024:6} KB  (CRF {crf}, SSIM {s:.3f})', flush=True)
        else:
            print(f'{name:40} {size // 1024:6} KB    kept as is', flush=True)
        after += os.path.getsize(f)
    shutil.rmtree(tmp)
    print(f'total {before // 1024} KB -> {after // 1024} KB ({100 - after * 100 // before}% smaller)')

if __name__ == '__main__':
    main()
