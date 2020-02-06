#!/bin/sh

palette="/tmp/palette.png"

for f in ./public/figures/*.mp4; do
  gif="${f%.*}.gif"
  if [ ! -f "$gif" ] || [ "$f" -nt "$gif" ]; then
    echo $f
    ffmpeg -v warning -i "$f" -vf "palettegen" -y $palette
    ffmpeg -v warning -i "$f" -i $palette -lavfi "paletteuse" -r 2 -y "$gif"
  fi
done
