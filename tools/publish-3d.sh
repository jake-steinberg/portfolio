#!/bin/sh
# publish-3d.sh — copies the two 3D building viewers from scratch/ (where they're built, and
# which git ignores) into 3d/, which the portfolio's Buildings section loads in its boxes:
#   3d/capella/        Capella Tower's block   (scratch/lidar-buildings, opened with ?embed)
#   3d/science-hall/   Science Hall, UW–Madison (scratch/lidar-wi, opened with ?data=science&embed)
# Only what the boxes load goes: not Capella's 59 MB point cloud (its editor's "Show lidar"
# alone loads it), nor Science Hall's PNG textures (the box loads shrink.py's WebP copies).
#
# Usage, from the repo folder, after rebuilding either model:   sh tools/publish-3d.sh
set -e
cd "$(dirname "$0")/.."

copy() {   # $1 = source folder, $2 = destination folder, then the files
  src=$1 dst=$2; shift 2
  rm -rf "$dst"; mkdir -p "$dst"
  for f in "$@"; do cp "$src/$f" "$dst/$f"; done
  echo "$dst: $# files, $(du -sh "$dst" | cut -f1)"
}

copy scratch/lidar-buildings 3d/capella \
  index.html buildings.json edits.json facade_block.json facade_block.png facade_capella.json facade_capella.png \
  facade_photo_grid.png facade_photo_ribbon.png facade_photo_base.png \
  heightmap.json heightmap.png roof_intensity.json roof_intensity.png signs.json startribune-star-cut.png \
  street_mask.png streetlights.json towers.json trees.json

copy scratch/lidar-wi 3d/science-hall \
  index.html science.json science.bin science_model.json facade.json brick.png turret.png \
  facade.sm.webp facade_n.sm.webp facade_m.sm.webp roof.sm.webp ground.sm.webp ground_photo.sm.webp \
  facade.webp facade_n.webp facade_m.webp roof.webp ground.webp ground_photo.webp
