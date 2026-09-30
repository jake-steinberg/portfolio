#!/bin/bash
# =============================================================================
# endless-scroll.sh — a tile video that scrolls rightward across a wide picture
# without end: the picture, a white gap, the picture again, looping exactly.
# Used for Cycling St. Paul's Hills and Geology.
#
# Usage: tools/endless-scroll.sh <picture 640px tall> <output.mp4> [gap px] [speed px/s] [gap color]
#   e.g. magick spread.png -resize x640 wide.png
#        tools/endless-scroll.sh wide.png img/tiles/my-spread-scroll.mp4 60 55 "#FFF1B5"
# =============================================================================
set -euo pipefail
IN=$1; OUT=$2; GAP=${3:-60}; SPEED=${4:-55}; BG=${5:-white}   # gap width, px per second, gap color
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
W=$(magick identify -format '%w' "$IN")
magick "$IN" -background "$BG" -gravity west -extent $((W+GAP))x640 $T/one.png
P=$((W+GAP))
magick $T/one.png $T/one.png +append $T/two.png
D=$(echo "scale=4; $P/$SPEED" | bc)
ffmpeg -v error -y -loop 1 -framerate 30 -i $T/two.png -t $D -vf "crop=800:640:'$P*t/$D':0,format=yuv420p" \
  -an -c:v libx264 -profile:v main -crf 29 -preset slow -movflags +faststart "$OUT"
echo "$OUT: period ${P}px, ${D}s"
