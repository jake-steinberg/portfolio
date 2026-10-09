#!/bin/sh
# subset-fonts.sh — makes the site's self-hosted fonts small enough to load fast.
#
# Takes the full font files (as downloaded) and writes trimmed .woff2 files
# that css/site.css loads:
#   - only the characters the site can use: basic Latin, Latin-1 (accented
#     letters, ×, ·), curly quotes and dashes, € ™, and arrows (↗ ↑)
#   - only the features browsers use by default (kerning, ligatures,
#     contextual alternates…), not the optional stylistic sets
#
# Needs fonttools and brotli:   python3 -m pip install --user fonttools brotli
# Usage, from the repo folder — one font at a time:
#
#   sh tools/subset-fonts.sh outfit   path/to/Outfit-VariableFont_wght.ttf
#   sh tools/subset-fonts.sh serif    "path/to/SourceSerif4[opsz,wght].ttf" "path/to/SourceSerif4-Italic[opsz,wght].ttf"
#   sh tools/subset-fonts.sh belltopo path/to/BellTopoSans-Regular.otf path/to/BellTopoSans-Bold.otf
#
#   outfit    keeps every weight (it stays a variable font)
#   serif     (from github.com/google/fonts, ofl/sourceserif4) keeps weights
#             400–600 as a variable font, with its optical size fixed for 16px
#             text, the size the site reads at — about a quarter the size
#   belltopo  Sarah Bell gave permission (October 2026) to serve it trimmed
#             and converted like this; the EULA in css/fonts/belltopo/ still
#             applies otherwise
#
# If text ever shows in a fallback font, a character is missing: add its
# code to UNICODES below and run this again.

UNICODES="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DC,U+2010-2027,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2190-2199"
FEATURES="kern,liga,clig,calt,ccmp,locl,mark,mkmk,rlig"

subset() {   # $1 = source font, $2 = output .woff2
  python3 -m fontTools.subset "$1" --unicodes="$UNICODES" --layout-features="$FEATURES" \
    --flavor=woff2 --output-file="$2" && echo "wrote $2 ($(($(wc -c < "$2") / 1024)) KB)"
}

serif() {    # $1 = source variable .ttf, $2 = output .woff2
  tmp=$(mktemp -d)
  python3 -m fontTools.varLib.instancer "$1" opsz=16 wght=400:600 -q -o "$tmp/instanced.ttf" &&
    subset "$tmp/instanced.ttf" "$2"
  rm -rf "$tmp"
}

case "$1" in
  outfit)   subset "$2" css/fonts/outfit/Outfit.woff2 ;;
  serif)    serif "$2" css/fonts/sourceserif/SourceSerif4.woff2
            serif "$3" css/fonts/sourceserif/SourceSerif4-Italic.woff2 ;;
  belltopo) subset "$2" css/fonts/belltopo/BellTopoSans-Regular.woff2
            subset "$3" css/fonts/belltopo/BellTopoSans-Bold.woff2 ;;
  *)        echo "usage: sh tools/subset-fonts.sh outfit|serif|belltopo <font files>  (see the top of this file)"; exit 1 ;;
esac
