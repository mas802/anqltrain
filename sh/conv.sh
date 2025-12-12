
SRC_IMG_DIR="../pics/src"
IMG_DIR="../quarkus/src/main/resources/META-INF/resources/imgs"

#magick ${SRC_IMG_DIR}/github.png  -rotate 12  -resize 500x -crop 300x60+0+20  ${IMG_DIR}/github.jpg
magick ${SRC_IMG_DIR}/youtube.png -rotate -20 -resize 1600x -crop 300x226+9+260 ${IMG_DIR}/youtube.jpg

magick  ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% ${SRC_IMG_DIR}/Icon_Simple_Warn.jpg

ERRORICON="( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40%  -fill red -tint 100 ) -gravity northeast -geometry +20+20 -compose over -composite"
FAILEDICON="( ${SRC_IMG_DIR}/Icon_Simple_Warn.png -resize 40% ) -gravity northeast -geometry +20+20 -compose over -composite"
BUSYICON="( ${SRC_IMG_DIR}/Ubuntu_Recycling_logo-Blue.png -resize 80x ) -gravity northeast -geometry +20+20 -compose over -composite"
YOUTUBEICON="( ${SRC_IMG_DIR}/Youtube_logo.png -resize 8% -alpha Set -channel A -evaluate set 70% +channel ) -gravity northeast -geometry +20+20 -compose over -composite"

function common_pics () {
  magick ${IMG_DIR}/${1}_OFF.jpg -modulate 100,0 ${IMG_DIR}/${1}_load.jpg
  magick \( ${IMG_DIR}/${1}_OFF.jpg -modulate 100,0 \) $ERRORICON ${IMG_DIR}/${1}_error.jpg
  magick \( ${IMG_DIR}/${1}_OFF.jpg -modulate 100,0 \) $FAILEDICON ${IMG_DIR}/${1}_failed.jpg
  magick \( ${IMG_DIR}/${1}_ON.jpg -modulate 100,0 \) $BUSYICON ${IMG_DIR}/${1}_busy.jpg
  magick \( ${IMG_DIR}/${1}_ON.jpg  \) $YOUTUBEICON ${IMG_DIR}/${1}_YOUTUBE.jpg
}

function quickpic() {
  magick "${SRC_IMG_DIR}/${2}" -resize 300x -crop 300x226+0+${4} ${IMG_DIR}/${1}_ON.jpg
  magick "${SRC_IMG_DIR}/${3}" -resize 300x -crop 300x226+0+${4} ${IMG_DIR}/${1}_OFF.jpg
  common_pics ${1}
}

magick "${SRC_IMG_DIR}/IMG_0788.jpeg" -resize 600x -crop 600x240+0+120 ${IMG_DIR}/TRAIN_ON.jpg
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

# PLAN

function plan () {
SIZE=69x41
SIZEH=41x69
magick \( ${SRC_IMG_DIR}/PLAN.png \) \
             \( -size $SIZE xc:${2} \) -gravity northwest -geometry +444+150 -compose over \
  -composite \( -size $SIZE xc:${3} \) -gravity northwest -geometry +364+150 -compose over \
  -composite \( -size $SIZE xc:${4} \) -gravity northwest -geometry +284+150 -compose over \
  -composite \( -size $SIZE xc:${5} \) -gravity northwest -geometry +204+150 -compose over \
  -composite \( -size $SIZE xc:${6} \) -gravity northwest -geometry +350+505 -compose over \
  -composite \( -size $SIZE xc:${7} \) -gravity northwest -geometry +270+505 -compose over \
  -composite \( -size $SIZE xc:${8} \) -gravity northwest -geometry +190+505 -compose over \
  -composite \( -size $SIZE xc:${9} \) -gravity northwest -geometry +110+505 -compose over \
  -composite \( -size $SIZE xc:${10} \) -gravity northwest -geometry +155+930 -compose over \
  -composite \( -size $SIZE xc:${11} \) -gravity northwest -geometry +235+930 -compose over \
  -composite \( -size $SIZE xc:${12} \) -gravity northwest -geometry +315+930 -compose over \
  -composite \( -size $SIZE xc:${13} \) -gravity northwest -geometry +395+930 -compose over \
  -composite \( -size $SIZEH xc:${14} \) -gravity northwest -geometry +1230+620 -compose over \
  -composite \( -size $SIZEH xc:${15} \) -gravity northwest -geometry +1230+540 -compose over \
  -composite \( -size $SIZEH xc:${16} \) -gravity northwest -geometry +1230+460 -compose over \
  -composite \( -size $SIZEH xc:${17} \) -gravity northwest -geometry +1230+380 -compose over \
  -composite  ${SRC_IMG_DIR}/PLAN_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}.jpg -resize 300x ${IMG_DIR}/PLAN_${1}.jpg

  magick ${SRC_IMG_DIR}/PLAN_${1}.jpg -crop 3x3@ +repage ${SRC_IMG_DIR}/PLAN_${1}_%02d.png
  
  magick ${SRC_IMG_DIR}/PLAN_${1}_00.png -resize 300x ${IMG_DIR}/PLAN_LOADER_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}_01.png -resize 300x ${IMG_DIR}/PLAN_LOADEE_${1}.jpg
#  magick ${SRC_IMG_DIR}/PLAN_${1}_02.png -resize 300x ${IMG_DIR}/PLAN_DEMO_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}_03.png -resize 300x ${IMG_DIR}/PLAN_YARD_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}_04.png -resize 300x ${IMG_DIR}/PLAN_PATHBACK_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}_05.png -resize 300x ${IMG_DIR}/PLAN_UNLOADER_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}_06.png -resize 300x ${IMG_DIR}/PLAN_FRONT_${1}.jpg
  magick ${SRC_IMG_DIR}/PLAN_${1}_07.png -resize 300x ${IMG_DIR}/PLAN_PATHFRONT_${1}.jpg
#  magick ${SRC_IMG_DIR}/PLAN_${1}_08.png -resize 300x ${IMG_DIR}/PLAN_CURVE_${1}.jpg
}

function plans () {
local i="${1%%${1#?}}"
plan "U0${i}" NONE NONE NONE $1 NONE NONE $2 $3 NONE NONE NONE NONE NONE NONE NONE RED
plan "F0${i}" NONE NONE NONE $1 NONE NONE $2 $3 RED NONE NONE NONE NONE NONE NONE NONE

plan "U1${i}" NONE NONE NONE NONE NONE NONE $2 $3 NONE NONE NONE NONE NONE NONE RED $1 
plan "F1${i}" NONE NONE NONE NONE NONE NONE $2 $3 RED $1 NONE NONE NONE NONE NONE NONE
plan "L1${i}" NONE NONE RED $1 NONE NONE $2 $3 NONE NONE NONE NONE NONE NONE NONE NONE

plan "U2${i}" NONE NONE NONE $1 NONE NONE NONE NONE NONE NONE NONE NONE NONE RED $2 $3
plan "F2${i}" NONE NONE NONE $1 NONE NONE NONE NONE RED $2 $3 NONE NONE NONE NONE NONE
plan "Y2${i}" NONE NONE NONE $1 NONE RED $2 $3 NONE NONE NONE NONE NONE NONE NONE NONE

plan "U3${i}" NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE RED $2 $3 $1
plan "F3${i}" NONE NONE NONE NONE NONE NONE NONE NONE RED $2 $3 $1 NONE NONE NONE NONE
plan "L3${i}" RED $2 $3 $1 NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE
plan "Y3${i}" NONE NONE NONE NONE RED $2 $3 $1 NONE NONE NONE NONE NONE NONE NONE NONE

}

plan "OFF" NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE
plan "ON" RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE
plan "PATHBACK_OFF" NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE
plan "PATHBACK_ON" RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE
plan "PATHFRONT_OFF" NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE NONE
plan "PATHFRONT_ON" RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE RED WHITE YELLOW BLUE

common_pics PLAN
common_pics PLAN_LOADER
common_pics PLAN_LOADEE
common_pics PLAN_DEMO
common_pics PLAN_YARD
common_pics PLAN_PATHBACK
common_pics PLAN_UNLOADER
common_pics PLAN_FRONT
common_pics PLAN_PATHFRONT
common_pics PLAN_CURVE

plans GRAY GRAY GRAY
plans BLUE WHITE YELLOW
plans YELLOW BLUE WHITE 
plans WHITE YELLOW BLUE

magick "${SRC_IMG_DIR}/IMG_0755.jpeg" -resize 300x -crop 300x226+0+160 ${IMG_DIR}/HOUSE_ON.jpg
magick "${SRC_IMG_DIR}/IMG_0756.jpeg" -resize 300x -crop 300x226+0+160 ${IMG_DIR}/HOUSE_OFF.jpg
common_pics HOUSE

magick "${SRC_IMG_DIR}/IMG_0767.jpeg" -resize 300x -crop 300x226+0+160 ${IMG_DIR}/WATER_ON.jpg
magick "${SRC_IMG_DIR}/IMG_0765.jpeg" -resize 300x -crop 300x226+0+160 ${IMG_DIR}/WATER_OFF.jpg
common_pics WATER

magick "${SRC_IMG_DIR}/IMG_0774.jpeg" -resize 300x -crop 300x226+0+80 ${IMG_DIR}/MONSTER_ON.jpg
magick "${SRC_IMG_DIR}/IMG_0773.jpeg" -resize 300x -crop 300x226+0+80 ${IMG_DIR}/MONSTER_OFF.jpg
common_pics MONSTER

quickpic LOADER IMG_0784.jpeg IMG_0783.jpeg 100
cp ${IMG_DIR}/LOADER_OFF.jpg ${IMG_DIR}/LOADER_COMP_.jpg
cp ${IMG_DIR}/LOADER_ON.jpg ${IMG_DIR}/LOADER_COMP_G.jpg

quickpic YARD IMG_0781.jpeg IMG_0780.jpeg 80
cp ${IMG_DIR}/YARD_OFF.jpg ${IMG_DIR}/YARD_COMP_.jpg
cp ${IMG_DIR}/YARD_ON.jpg ${IMG_DIR}/YARD_COMP_GG.jpg

quickpic UNLOADER IMG_0800.jpeg IMG_0799.jpeg 80
quickpic LOADEE IMG_0778.jpeg IMG_0777.jpeg 40

quickpic THEFORCE starwarson.png starwarsoff.png 0

magick "${SRC_IMG_DIR}/IMG_0851.jpeg" -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SANTA_ON.jpg
magick ${IMG_DIR}/SANTA_ON.jpg -modulate 100,50 ${IMG_DIR}/SANTA_OFF.jpg
common_pics SANTA

magick ${SRC_IMG_DIR}/IMG_0879.jpeg -resize 600x -crop 300x226+300+220 ${IMG_DIR}/TRACK_ON.jpg
magick ${SRC_IMG_DIR}/IMG_0880.jpeg -resize 600x -crop 300x226+300+220 ${IMG_DIR}/TRACK_OFF.jpg
common_pics TRACK

magick "${SRC_IMG_DIR}/IMG_0860.jpeg" -resize 300x  -crop 300x226+0+60 ${IMG_DIR}/HOUSE1_ON.jpg
magick "${SRC_IMG_DIR}/IMG_0859.jpeg" -resize 300x  -crop 300x226+0+60 ${IMG_DIR}/HOUSE1_OFF.jpg
common_pics HOUSE1

magick "${SRC_IMG_DIR}/IMG_0884.jpeg" -resize 300x  -crop 300x226+0+120 ${IMG_DIR}/HOUSE2_ON.jpg
magick "${SRC_IMG_DIR}/IMG_0883.jpeg" -resize 300x  -crop 300x226+0+120 ${IMG_DIR}/HOUSE2_OFF.jpg
common_pics HOUSE2

magick "${SRC_IMG_DIR}/IMG_6968.jpeg" -resize 300x  -crop 300x226+0+140  ${IMG_DIR}/FIRE_ON.jpg
magick "${SRC_IMG_DIR}/IMG_6971.jpeg" -resize 300x  -crop 300x226+0+140  ${IMG_DIR}/FIRE_OFF.jpg
common_pics FIRE


magick "${SRC_IMG_DIR}/SWAP.png" -resize 300x  -crop 300x226+0+0  ${IMG_DIR}/SWAP_ON.jpg
magick "${SRC_IMG_DIR}/SWAP.png" -modulate 100,80 -resize 300x  -crop 300x226+0+0  ${IMG_DIR}/SWAP_OFF.jpg
common_pics SWAP

# magick "${SRC_IMG_DIR}/107_1412/IMGP0958.JPG" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/DRAGON_ON.jpg
# magick "${SRC_IMG_DIR}/107_1412/IMGP0959.JPG" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/DRAGON_OFF.jpg
# common_pics DRAGON

# magick "${SRC_IMG_DIR}/xmas2023_ - 11.jpeg" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/CONVEYOR_ON.jpg
# magick "${SRC_IMG_DIR}/xmas2023_ - 11.jpeg" -resize x226 -crop 300x226+0+0 -modulate 100,50 ${IMG_DIR}/CONVEYOR_OFF.jpg
# common_pics CONVEYOR

# magick "${SRC_IMG_DIR}/IMG_6941.jpeg" -resize x325 -crop 300x226+100+30 ${IMG_DIR}/GUGGE_ON.jpg
# magick "${SRC_IMG_DIR}/IMG_6941.jpeg" -resize x325 -crop 300x226+100+30 -modulate 100,50 ${IMG_DIR}/GUGGE_OFF.jpg
# common_pics GUGGE

magick "${SRC_IMG_DIR}/IMG_6947.jpeg" -resize x425 -crop 300x226+0+0 ${IMG_DIR}/CROSSING_ON.jpg
magick ${IMG_DIR}/CROSSING_ON.jpg -modulate 100,50 ${IMG_DIR}/CROSSING_OFF.jpg
common_pics CROSSING

magick "${SRC_IMG_DIR}/IMG_6978.jpeg" -resize x226 -crop 300x226+0+0 ${IMG_DIR}/GHOSTBUSTERS_ON.jpg
magick ${IMG_DIR}/GHOSTBUSTERS_ON.jpg -modulate 100,50 ${IMG_DIR}/GHOSTBUSTERS_OFF.jpg
common_pics GHOSTBUSTERS

magick "${SRC_IMG_DIR}/xmas2023_ - 4.jpeg" -resize 300x  -crop 300x226+0+0 ${IMG_DIR}/CAVE_ON.jpg
magick "${SRC_IMG_DIR}/xmas2023_ - 3.jpeg" -resize 300x  -crop 300x226+0+0 ${IMG_DIR}/CAVE_OFF.jpg
common_pics CAVE

# magick ${SRC_IMG_DIR}/IMG_9503.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL1_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9502.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL1_OFF.jpg
# common_pics SIGNAL1

# magick ${SRC_IMG_DIR}/IMG_9508.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL2_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9507.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL2_OFF.jpg
# common_pics SIGNAL2

# magick ${SRC_IMG_DIR}/IMG_9517.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL3_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9518.jpg -resize 300x -crop 300x226+0+70 ${IMG_DIR}/SIGNAL3_OFF.jpg
# common_pics SIGNAL3

# magick ${SRC_IMG_DIR}/IMG_9509.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE1_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9510.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE1_OFF.jpg
# common_pics WHITE1

# magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE2_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+100 ${IMG_DIR}/WHITE2_OFF.jpg
# common_pics WHITE2

# magick ${SRC_IMG_DIR}/IMG_9474.jpg -resize x226 -crop 300x226+0+120 ${IMG_DIR}/WARN_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9475.jpg -resize x226 -crop 300x226+0+120 ${IMG_DIR}/WARN_OFF.jpg
# common_pics WARN

# magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCH_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCH_OFF.jpg
# common_pics SWITCH

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHFRONT_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHFRONT_OFF.jpg
common_pics SWITCHFRONT

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHBACK_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/SWITCHBACK_OFF.jpg
common_pics SWITCHBACK

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/PATHFRONT_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/PATHFRONT_OFF.jpg
common_pics PATHFRONT

magick ${SRC_IMG_DIR}/IMG_9499.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/PATHBACK_ON.jpg
magick ${SRC_IMG_DIR}/IMG_9500.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/PATHBACK_OFF.jpg
common_pics PATHBACK

# magick ${SRC_IMG_DIR}/IMG_9509.jpg -resize 300x -crop 300x226+0+80 ${IMG_DIR}/DECOUPLER_ON.jpg
# magick ${SRC_IMG_DIR}/IMG_9510.jpg -resize 300x -crop 300x226+6+80 ${IMG_DIR}/DECOUPLER_OFF.jpg
# common_pics DECOUPLER

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