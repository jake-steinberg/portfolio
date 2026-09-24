#!/bin/bash
# =============================================================================
# crossfade-loop.sh — turn a set of pictures (or a slideshow GIF) into a
# looping tile video that crossfades from one picture to the next.
#
# Used for: Maps for the Wall Street Journal, Fall Hikes, 22 A Map,
# the Great Lakes Pipeline and the 2024 Election tiles.
#
# Usage (run from the portfolio folder):
#   tools/crossfade-loop.sh <output.mp4> <width> <height> <pictures…>
#   tools/crossfade-loop.sh <output.mp4> <width> <height> <slideshow.gif>
#
# Examples:
#   tools/crossfade-loop.sh img/tiles/fall-hikes.mp4 800 640 "img/tiles/Fall Hikes tile/"*.jpg
#   tools/crossfade-loop.sh img/tiles/22-a-map.mp4 800 600 img/22_gif-2.gif
#
# Pictures play in the order given (a folder glob sorts by filename). Tiles
# are 5:4, so 800 640 is the usual size. Every picture is resized to exactly
# that size, so crop them to the right shape first.
#
# Needs ffmpeg (brew install ffmpeg). Afterwards, make the tile's still image
# from the first picture, e.g.:  cwebp -q 82 first.jpg -o img/tiles/my-project.webp
# =============================================================================
set -euo pipefail

HOLD=2.7     # seconds each picture is on screen, including its fade
FADE=0.7     # seconds each crossfade lasts
FPS=24
CRF=25       # quality: lower = sharper and bigger file (23–28 is sensible)

out=$1; W=$2; H=$3; shift 3
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# 1. Resize every picture (or every frame of the GIF) to the tile size
if [ $# -eq 1 ] && [[ $1 == *.gif ]]; then
  ffmpeg -v error -i "$1" -fps_mode passthrough -vf "scale=${W}:${H}:flags=lanczos,setsar=1" "$tmp/f%d.png"
else
  i=1
  for pic in "$@"; do
    ffmpeg -v error -i "$pic" -vf "scale=${W}:${H}:flags=lanczos,setsar=1" "$tmp/f$i.png"
    i=$((i + 1))
  done
fi
n=$(ls "$tmp" | wc -l | tr -d ' ')
[ "$n" -gt 1 ] || { echo "Need at least two pictures."; exit 1; }

# 2. Chain the crossfades. The first picture is repeated at the end, so the
#    last frame matches the first and the loop has no visible seam.
clip=$(echo "$HOLD + $FADE" | bc)          # each still is shown this long
inputs=(); filters=""; prev="0:v"
for k in $(seq 0 "$n"); do
  pic=$(( k < n ? k + 1 : 1 ))
  dur=$([ "$k" -lt "$n" ] && echo "$clip" || echo "$(echo "$FADE + 1" | bc)")
  inputs+=(-loop 1 -framerate "$FPS" -t "$dur" -i "$tmp/f$pic.png")
  if [ "$k" -gt 0 ]; then
    filters+="[$prev][$k:v]xfade=transition=fade:duration=$FADE:offset=$(echo "$k * $HOLD" | bc)[v$k];"
    prev="v$k"
  fi
done
total=$(echo "$n * $HOLD + $FADE + 0.25" | bc)

ffmpeg -v error -y "${inputs[@]}" \
  -filter_complex "${filters}[$prev]format=yuv420p[out]" -map "[out]" -t "$total" \
  -an -c:v libx264 -crf "$CRF" -preset slow -movflags +faststart "$out"

echo "Made $out: $n pictures, ${total}s loop"
