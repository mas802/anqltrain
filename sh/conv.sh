
SRC_IMG_DIR="../pics/src"
IMG_DIR="../quarkus/src/main/resources/META-INF/resources/imgs"

#magick ${SRC_IMG_DIR}/github.png  -rotate 12  -resize 500x -crop 300x60+0+20  ${IMG_DIR}/github.jpg
magick ${SRC_IMG_DIR}/youtube.png -rotate -20 -resize 1600x -crop 300x226+9+260 ${IMG_DIR}/youtube.jpg

magick  ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% ${SRC_IMG_DIR}/Icon_Simple_Warn.jpg

ERRORICON="( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40%  -fill red -tint 100 ) -gravity northeast -geometry +20+20 -compose over -composite"
FAILEDICON="( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% ) -gravity northeast -geometry +20+20 -compose over -composite"
YOUTUBEICON="( ${SRC_IMG_DIR}/Youtube_logo.png -resize 8% -alpha Set -channel A -evaluate set 70% +channel ) -gravity northeast -geometry +20+20 -compose over -composite"

function common_pics () {
  magick ${IMG_DIR}/${1}_OFF.jpg -modulate 100,0 ${IMG_DIR}/${1}_load.jpg
  magick \( ${IMG_DIR}/${1}_OFF.jpg -modulate 100,0 \) $ERRORICON ${IMG_DIR}/${1}_error.jpg
  magick \( ${IMG_DIR}/${1}_OFF.jpg -modulate 100,0 \) $FAILEDICON ${IMG_DIR}/${1}_failed.jpg
  magick \( ${IMG_DIR}/${1}_ON.jpg  \) $YOUTUBEICON ${IMG_DIR}/${1}_YOUTUBE.jpg
}

magick "${SRC_IMG_DIR}/xmas2023_ - 12.jpeg" -resize 600x -crop 600x240+0+160 ${IMG_DIR}/TRAIN_ON.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,80  \) ${IMG_DIR}/TRAIN_OFF.jpg
common_pics TRAIN
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,0  \) ${IMG_DIR}/TRAIN_load.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg \) \( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% \) -gravity northeast -geometry +20+20 -compose over -composite ${IMG_DIR}/TRAIN_UNKNOWN.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,0 \)  \( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40%  -fill red -tint 100 \) -gravity northeast -geometry +20+20 -compose over -composite  -font Helvetica-BoldOblique -fill '#FFc800' -stroke black -pointsize 50 -gravity center -draw "text 0,50 'Der Zug macht Pause'" ${IMG_DIR}/TRAIN_error.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,0 \)  \( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% \) -gravity northeast -geometry +20+20 -compose over -composite  -font Helvetica-BoldOblique -fill '#FFc800' -stroke black -pointsize 50 -gravity center -draw "text 0,50 'Der Zug macht Pause'" ${IMG_DIR}/TRAIN_failed.jpg


magick \( ${IMG_DIR}/TRAIN_ON.jpg \) \( ${SRC_IMG_DIR}/120px-Play_blauw.png -resize 40% \)  -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_RUNNING.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,50 \)  \( ${SRC_IMG_DIR}/120px-Play_groen.png -resize 40% \)  -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_STATION_DISCONNECT.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,80 \) \( ${SRC_IMG_DIR}/120px-Play_groen.png -resize 40% \) -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_STATION.jpg

# xmas2022 color of led
#magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,80 \) \( ${SRC_IMG_DIR}/120px-Play_groen.png -resize 40% \) -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_WHITE.jpg
#magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,0 \)  \( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% \) -gravity northeast -geometry +20+20 -compose over -composite  -font Helvetica-BoldOblique -fill '#FFc800' -stroke black -pointsize 50 -gravity center -draw "text 0,50 'Der Zug macht Pause'" ${IMG_DIR}/TRAIN_ORANGE.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,80 \) \( -size 80x80 xc:blue  \) -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_BLUE.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,80 \) \( -size 80x80 xc:red   \) -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_RED.jpg
magick \( ${IMG_DIR}/TRAIN_ON.jpg -modulate 100,80 \) \( -size 80x80 xc:green \) -gravity northeast -geometry +20+20 -compose over -composite  ${IMG_DIR}/TRAIN_GREEN.jpg

function train_one () {
  local i1="${1%%${1#?}}"
magick \( ${IMG_DIR}/TRAIN_STATION.jpg -modulate 100,80 \) \
             \( -size 50x15 xc:${1} \) -gravity southeast -geometry +70+20 -compose over \
  -composite \( -size 40x20 xc:RED \) -gravity southeast -geometry +20+20 -compose over \
  -composite  ${IMG_DIR}/LOADER_COMP_${1}.jpg
}

function train_two () {
  local i1="${1%%${1#?}}"
  local i2="${2%%${2#?}}"
magick \( ${IMG_DIR}/TRAIN_STATION.jpg -modulate 100,80 \) \
             \( -size 50x15 xc:${2} \) -gravity southeast -geometry +130+20 -compose over \
  -composite \( -size 50x15 xc:${1} \) -gravity southeast -geometry +70+20 -compose over \
  -composite \( -size 40x20 xc:RED \) -gravity southeast -geometry +20+20 -compose over \
  -composite  ${IMG_DIR}/YARD_COMP_${i1}${i2}.jpg
}

function train_three () {
  local i1="${1%%${1#?}}"
  local i2="${2%%${2#?}}"
  local i3="${3%%${3#?}}"
magick \( ${IMG_DIR}/TRAIN_STATION.jpg -modulate 100,80 \) \
             \( -size 50x15 xc:${3} \) -gravity southeast -geometry +190+20 -compose over \
  -composite \( -size 50x15 xc:${2} \) -gravity southeast -geometry +130+20 -compose over \
  -composite \( -size 50x15 xc:${1} \) -gravity southeast -geometry +70+20 -compose over \
  -composite \( -size 40x20 xc:RED \) -gravity southeast -geometry +20+20 -compose over \
  -composite  ${IMG_DIR}/TRAIN_COMP_${i1}${i2}${i3}.jpg
}

train_one GRAY
train_one WHITE
train_one BLUE
train_one YELLOW

train_two GRAY GRAY
train_two WHITE BLUE
train_two WHITE YELLOW

train_three GRAY GRAY GRAY


magick "${SRC_IMG_DIR}/IMG_0755.jpeg" -resize 300x -crop 300x226+0+160 ${IMG_DIR}/HOUSE_ON.jpg
magick "${SRC_IMG_DIR}/IMG_0756.jpeg" -resize 300x -crop 300x226+0+160 ${IMG_DIR}/HOUSE_OFF.jpg
common_pics HOUSE

# magick "${SRC_IMG_DIR}/xmas2023_ - 8.jpeg" -resize 300x -crop 300x226+0+20 ${IMG_DIR}/TRACK_ON.jpg
# magick "${SRC_IMG_DIR}/xmas2023_ - 7.jpeg" -resize 300x -crop 300x226+0+20 -modulate 100,50 ${IMG_DIR}/TRACK_OFF.jpg
# common_pics TRACK

magick ${SRC_IMG_DIR}/IMG_1018.jpg -resize 300x -crop 300x226+0+20 ${IMG_DIR}/TRACK_ON.jpg
magick ${SRC_IMG_DIR}/IMG_1018.jpg -resize 300x -crop 300x226+0+20 -modulate 100,50 ${IMG_DIR}/TRACK_OFF.jpg
common_pics TRACK

magick "${SRC_IMG_DIR}/xmas2023_ - 10.jpeg" -resize 300x  ${IMG_DIR}/HOUSE1_ON.jpg
magick "${SRC_IMG_DIR}/xmas2023_ - 9.jpeg" -resize 300x  ${IMG_DIR}/HOUSE1_OFF.jpg
common_pics HOUSE1

magick "${SRC_IMG_DIR}/xmas2023_ - 13.jpeg" -resize 300x  ${IMG_DIR}/HOUSE2_ON.jpg
magick "${SRC_IMG_DIR}/xmas2023_ - 14.jpeg" -resize 300x  ${IMG_DIR}/HOUSE2_OFF.jpg
common_pics HOUSE2

magick "${SRC_IMG_DIR}/IMG_6968.jpeg" -resize 300x  -crop 300x226+0+140  ${IMG_DIR}/FIRE_ON.jpg
magick "${SRC_IMG_DIR}/IMG_6971.jpeg" -resize 300x  -crop 300x226+0+140  ${IMG_DIR}/FIRE_OFF.jpg
common_pics FIRE

magick "${SRC_IMG_DIR}/107_1412/IMGP0958.JPG" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/DRAGON_ON.jpg
magick "${SRC_IMG_DIR}/107_1412/IMGP0959.JPG" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/DRAGON_OFF.jpg
common_pics DRAGON

magick "${SRC_IMG_DIR}/xmas2023_ - 11.jpeg" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/CONVEYOR_ON.jpg
magick "${SRC_IMG_DIR}/xmas2023_ - 11.jpeg" -resize x226 -crop 300x226+0+0 -modulate 100,50 ${IMG_DIR}/CONVEYOR_OFF.jpg
common_pics CONVEYOR

magick "${SRC_IMG_DIR}/IMG_6941.jpeg" -resize x325 -crop 300x226+100+30 ${IMG_DIR}/GUGGE_ON.jpg
magick "${SRC_IMG_DIR}/IMG_6941.jpeg" -resize x325 -crop 300x226+100+30 -modulate 100,50 ${IMG_DIR}/GUGGE_OFF.jpg
common_pics GUGGE

magick "${SRC_IMG_DIR}/IMG_6947.jpeg" -resize x425 -crop 300x226+0+0 ${IMG_DIR}/CROSSING_ON.jpg
magick ${IMG_DIR}/CROSSING_ON.jpg -modulate 100,50 ${IMG_DIR}/CROSSING_OFF.jpg
common_pics CROSSING

magick "${SRC_IMG_DIR}/107_1412/IMGP0967.JPG" -resize x300 -crop 226x300+150+0 ${IMG_DIR}/SANTA_ON.jpg
magick ${IMG_DIR}/SANTA_ON.jpg -modulate 100,50 ${IMG_DIR}/SANTA_OFF.jpg
common_pics SANTA

magick "${SRC_IMG_DIR}/IMG_6978.jpeg" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/GHOSTBUSTERS_ON.jpg
magick ${IMG_DIR}/GHOSTBUSTERS_ON.jpg -modulate 100,50 ${IMG_DIR}/GHOSTBUSTERS_OFF.jpg
common_pics GHOSTBUSTERS

magick "${SRC_IMG_DIR}/xmas2023_ - 4.jpeg" -resize 300x  -crop 300x226+0+0 ${IMG_DIR}/CAVE_ON.jpg
magick "${SRC_IMG_DIR}/xmas2023_ - 3.jpeg" -resize 300x  -crop 300x226+0+0 ${IMG_DIR}/CAVE_OFF.jpg
common_pics CAVE

magick ${SRC_IMG_DIR}/IMG_9503.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL1_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9502.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL1_OFF.jpg
common_pics SIGNAL1

magick ${SRC_IMG_DIR}/IMG_9508.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL2_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9507.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL2_OFF.jpg
common_pics SIGNAL2

magick ${SRC_IMG_DIR}/IMG_9517.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL3_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9518.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL3_OFF.jpg
common_pics SIGNAL3

magick ${SRC_IMG_DIR}/IMG_9509.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE1_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9510.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE1_OFF.jpg
common_pics WHITE1

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE2_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE2_OFF.jpg
common_pics WHITE2

magick ${SRC_IMG_DIR}/IMG_9474.jpg -resize x226 -crop 300x226+0+120 ${IMG_DIR}/WARN_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9475.jpg -resize x226 -crop 300x226+0+120 ${IMG_DIR}/WARN_OFF.jpg
common_pics WARN

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCH_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCH_OFF.jpg
common_pics SWITCH

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHFRONT_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHFRONT_OFF.jpg
common_pics SWITCHFRONT

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHBACK_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHBACK_OFF.jpg
common_pics SWITCHBACK

magick ${SRC_IMG_DIR}/IMG_9509.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/DECOUPLER_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9510.jpg -resize 300x -crop 300x226+6+80 ${IMG_DIR}/DECOUPLER_OFF.jpg
common_pics DECOUPLER

magick ${SRC_IMG_DIR}/IMG_9509.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/DECOUPLERBACK_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9510.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/DECOUPLERBACK_OFF.jpg
common_pics DECOUPLERBACK

magick ${SRC_IMG_DIR}/IMG_9509.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/DECOUPLERFRONT_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9510.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/DECOUPLERFRONT_OFF.jpg
common_pics DECOUPLERFRONT

magick ${SRC_IMG_DIR}/IMG_3464.jpg -resize 300x -crop 300x226+0+0 ${IMG_DIR}/BLUE_ON.jpg
magick ${SRC_IMG_DIR}/IMG_3464.jpg -resize 300x -crop 300x226+0+0 ${IMG_DIR}/BLUE_OFF.jpg
common_pics BLUE

magick ${SRC_IMG_DIR}/IMG_3462.jpg -resize x226 -crop 300x226+0+0 ${IMG_DIR}/RED_ON.jpg
magick ${SRC_IMG_DIR}/IMG_3462.jpg -resize x226 -crop 300x226+0+0 ${IMG_DIR}/RED_OFF.jpg
common_pics RED

magick ${SRC_IMG_DIR}/IMG_3463.jpg -resize 300x -crop 300x226+0+0 ${IMG_DIR}/GREEN_ON.jpg
magick ${SRC_IMG_DIR}/IMG_3463.jpg -resize 300x -crop 300x226+0+0 ${IMG_DIR}/GREEN_OFF.jpg
common_pics GREEN

magick ${SRC_IMG_DIR}/dark.jpg -resize x226 -crop 300x226+0+0 ${IMG_DIR}/ALLOFF_ON.jpg
magick ${SRC_IMG_DIR}/dark.jpg -resize x226 -crop 300x226+0+0 ${IMG_DIR}/ALLOFF_OFF.jpg
common_pics ALLOFF

magick ${SRC_IMG_DIR}/light.jpg -resize x226 -crop 300x226+0+0 ${IMG_DIR}/ALLON_ON.jpg
magick ${SRC_IMG_DIR}/light.jpg -resize x226 -crop 300x226+0+0 ${IMG_DIR}/ALLON_OFF.jpg
common_pics ALLON

magick -size 300x226 xc:purple ${IMG_DIR}/PURPLE_ON.jpg
magick -size 300x226 xc:purple ${IMG_DIR}/PURPLE_OFF.jpg
common_pics PURPLE

magick -size 300x226 xc:#822 ${IMG_DIR}/NONE_ON.jpg
magick -size 300x226 xc:#822 ${IMG_DIR}/NONE_OFF.jpg
magick -size 300x226 xc:#822 ${IMG_DIR}/NONE_load.jpg
magick -size 300x226 xc:#822 ${IMG_DIR}/NONE_error.jpg
magick -size 300x226 xc:#822 ${IMG_DIR}/NONE_failed.jpg

montage ${IMG_DIR}/HOUSE_ON.jpg ${IMG_DIR}/HOUSE1_OFF.jpg ${IMG_DIR}/HOUSE2_ON.jpg ${IMG_DIR}/TRACK_OFF.jpg -geometry +0+0 ${IMG_DIR}/ALLLIGHTS_ON.jpg
montage ${IMG_DIR}/HOUSE_OFF.jpg ${IMG_DIR}/HOUSE1_ON.jpg ${IMG_DIR}/HOUSE2_OFF.jpg ${IMG_DIR}/TRACK_ON.jpg -geometry +0+0 ${IMG_DIR}/ALLLIGHTS_OFF.jpg
common_pics ALLLIGHTS

# Advent calendar tiles with red background, serif numbers and golden border
ADVENT_BG_COLOR="#8b0000"
ADVENT_TEXT_COLOR="#ffd700"
ADVENT_STROKE_COLOR="#b8860b"
ADVENT_FRAME_COLOR="#ffd700"
ADVENT_FONT="Times-Bold"

for day in $(seq 1 24); do
  number=$(printf "%d" "${day}")
  outfile=$(printf "%s/ADVENT_%02d.jpg" "${IMG_DIR}" "${day}")
  magick -size 300x226 xc:${ADVENT_BG_COLOR} \
    -fill none -stroke "${ADVENT_FRAME_COLOR}" -strokewidth 8 \
    -draw "rectangle 12,12 288,213" \
    \( -background none -font "${ADVENT_FONT}" -pointsize 150 \
       -fill "${ADVENT_TEXT_COLOR}" -stroke "${ADVENT_STROKE_COLOR}" -strokewidth 3 \
       -gravity center -kerning 10 -size 260x200 caption:"${number}" \) \
    -gravity center -geometry +0+12 -compose over -composite \
    "${outfile}"
done

echo $IMG_DIR