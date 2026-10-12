#!/bin/sh
# 用法：sh tools/make_trailer.sh <trailer_server 的輸出資料夾> <輸出 mp4>
OUT=${1:-trailer_out}; MP4=${2:-trailer.mp4}
ffmpeg -y -framerate 30 -i "$OUT/frames/%05d.jpg" -i "$OUT/audio.wav" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart \
  -af loudnorm=I=-14:TP=-1.0:LRA=11 -c:a aac -b:a 192k -ar 44100 -shortest "$MP4"
