#!/bin/sh
# subset-fonts.sh — makes the site's self-hosted fonts small enough to load fast.
#
# Takes the full font files (the variable .ttf from Google Fonts / the zip you
# downloaded) and writes trimmed .woff2 files that css/site.css loads:
#   - only the characters the site can use: basic Latin, Latin-1 (accented
#     letters, ×, ·), curly quotes and dashes, € ™, and arrows (↗ ↑)
#   - only the features browsers use by default (kerning, ligatures,
#     contextual alternates…), not the optional stylistic sets
#   - the full weight range (they stay variable fonts)
#
# Needs fonttools and brotli:   python3 -m pip install --user fonttools brotli
# Usage (from the repo folder): sh tools/subset-fonts.sh path/to/Outfit-VariableFont_wght.ttf
# (Bell Topo Sans isn't trimmed: its licence says the file may not be altered.)
# If text ever shows in a fallback font, a character is missing: add its
# code to UNICODES below and run this again.

UNICODES="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DC,U+2010-2027,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2190-2199"
FEATURES="kern,liga,clig,calt,ccmp,locl,mark,mkmk,rlig"

subset() {   # $1 = source .ttf, $2 = output .woff2
  python3 -m fontTools.subset "$1" --unicodes="$UNICODES" --layout-features="$FEATURES" \
    --flavor=woff2 --output-file="$2" && echo "wrote $2 ($(($(wc -c < "$2") / 1024)) KB)"
}

[ -n "$1" ] && subset "$1" css/fonts/outfit/Outfit.woff2
