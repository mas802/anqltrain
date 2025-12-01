#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <NAME> [duration_seconds]" >&2
  exit 1
fi

IMG_DIR="../quarkus/src/main/resources/META-INF/resources/imgs"
OUT_DIR="../quarkus/src/main/resources/META-INF/resources/videos"
AUDIO_DIR="../quarkus/src/main/resources/META-INF/resources/audio"
mkdir -p "$OUT_DIR"

NAME="$1"
DURATION="${2:-1}"

ON_IMG="$IMG_DIR/${NAME}_ON.jpg"
OFF_IMG="$IMG_DIR/${NAME}_OFF.jpg"
AUDIO_FILE="$AUDIO_DIR/${NAME}.mp3"

if [[ ! -f "$ON_IMG" || ! -f "$OFF_IMG" ]]; then
  echo "Missing input images $ON_IMG or $OFF_IMG" >&2
  exit 1
fi

if [[ -f "$AUDIO_FILE" ]]; then
  DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO_FILE")
fi

HALF_DURATION=$(awk -v d="$DURATION" 'BEGIN{printf "%.6f", d / 2}')

ffmpeg -y \
  -loop 1 -t "$HALF_DURATION" -i "$OFF_IMG" \
  -loop 1 -t "$HALF_DURATION" -i "$ON_IMG" \
  $( [[ -f "$AUDIO_FILE" ]] && echo "-i $AUDIO_FILE" ) \
  -filter_complex "[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[s0];[1:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[s1];[s0][s1]concat=n=2:v=1:a=0" \
  $( [[ -f "$AUDIO_FILE" ]] && echo "-shortest") \
  "$OUT_DIR/${NAME}.mp4"
