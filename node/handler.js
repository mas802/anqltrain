//
// COLOR / WATCHDOG
//

/*

WIP: command list

set:item:state
toggle:item
info:item
state:item
relay:...

*:TRAIN -> should be set:TRAIN:*
color:item:value -> might be state:item:COLOR:value
*:ALLLIGHTS:* -> relay for all lights
composition:* -> no use / info

*/


const { exec } = require('child_process');
const fs = require('fs');
// FIXME path should be more general
let config = JSON.parse(fs.readFileSync('/home/train/anqltrain/node/config.json'));

let lights = config["lights"];

let watchdogTimer;
let colorTimer;
let queue = [];

const afterColorTimeout = 1000;
let colorRecorder = [];
let colorRecorderTimer = null;

let resetCounter = 0;
const resetLimit = 3; // TODO Maybe 10?
const resetTime = 60000;

const randomTime = 1000*47*3

const COLORTRIGGER = "check:COLORTRIGGER";

let colorActionTimer = null;
const colorActionTimeout = 800;
const colorDetectionTimeout = 1000;
let lastColorAction = "NONE";
let lastDetectionColor = "NONE";
const colorActions = ["BLUE", "RED", "GREEN"];

const FULL_ROUND = 7500;
const HALF_ROUND = 3100;
const QUARTER_ROUND = colorDetectionTimeout+10;
const CROSSING_WAIT = 1500;
const SHORT_WAIT = 500;
const ROLLBACK = 8000;

const TRAIN_DURATION_FACTOR = 100;

const BASE_SPEED = 76;
const PER_WAGON_SPEED = 11;

setInterval( function() {
  if (!watchdogTimer) {
    if (resetCounter < resetLimit ) {
      console.log("-");
      resetCounter++;
    } else {
      resetCounter = -99;
      console.log("---------------------------------------------------------------------");
      console.log("  PERIODICALLY RESET ALL");
      console.log("---------------------------------------------------------------------");
      sendMsg(["relay:set:DECOUPLERFRONT:OFF", "relay:set:DECOUPLERBACK:OFF", "relay:set:SIGNAL2:OFF", "relay:set:SIGNAL3:OFF", "relay:set:TRAINLED:WHITE", "relay:set:ALLLIGHTS:OFF"]);
      pic();
    }
  } else {
    resetCounter = 0;
  }
}, resetTime);

setInterval( function() {
    lightsort = lights.sort(() => Math.random() - 0.5);
    sendMsg(["relay:set:"+lightsort[0]+":ON"]);
    sendMsg(["relay:set:"+lightsort[1]+":OFF"]);
    sendMsg(["relay:set:"+lightsort[2]+":OFF"]);
}, randomTime);

function sendWithTimeout(msgs,duration) {
    console.log("" + msgs + " plus timeout " + duration);
    sendMsg(msgs);
    clearTimeout(watchdogTimer);
    watchdogTimer = setTimeout(function() {
      shiftQueue();
    }, duration);
}

function shiftQueue(delta=0) {
  console.log("shift with delta " + delta);
  clearTimeout(watchdogTimer);
  watchdogTimer = null;
  var msg = queue.shift();
  if (msg) {
    sendWithTimeout(msg[0],msg[1]-delta);
  } else {
    pic();
    sendMsg(["relay:set:TRAIN:stop", "relay:set:TRAINLED:WHITE"]);
  }
}

function sendOrQueueSafe(msgs, duration) {
  if (!watchdogTimer) {
    sendWithTimeout(msgs,duration);
  } else {
    queue.push([msgs, duration]);
  }
}

/*
    watchdogTimer = setTimeout(function() {
      sendMsg(["relay:set:TRAIN:stop", "relay:set:TRAINLED:ORANGE", "relay:set:DECOUPLERFRONT:OFF", "relay:set:DECOUPLERBACK:OFF", "relay:set:SIGNAL2:OFF", "relay:set:SIGNAL3:OFF", "relay:toggle:SWITCH"]);
      watchdogTimer = null;
      queue = [];
      console.error("---------------------------------------------------------------------");
      console.error("FAILSAFE TRIGGERED, should not happen");
      console.error("---------------------------------------------------------------------");
    }, 10000);

*/

function pic() {
      var yourscript = exec('sh /home/train/anqltrain/sh/pic.sh',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log(`exec error: ${error}`);
            }
        });
}

function colorDetected(color, context) {
//  if (context === "SWITCHXX") {
    colorTrainDetection(color, context);
//  } else {
//    colorTrainAction(color);
//  }
}

function colorTrainDetection(color, context) {
  if (colorTimer == null) {
  }

  clearTimeout(colorTimer);
  colorTimer = setTimeout(function() {

    if (queue && Array.isArray(queue[0]) && queue[0][0]?.includes(COLORTRIGGER)) {
      console.info(["UPDATE WATCHDOG BASED ON color: ", color, "and context", context]);
      shiftQueue(colorDetectionTimeout);
    } else {
      console.info(["DO NOT UPDATE BASED ON color: ", color, " and context ", context]);
    }

    colorTimer = null;
  }, colorDetectionTimeout);
  recordColor(color, context);
}

function recordColor(color, context) {
  if (color != 'GREEN' && !colorRecorder.includes(color) && colorRecorder.length <= 4) {
    colorRecorder.push(color);
    lastDetectionColor = color;
  }
  console.log("----------- color > " + color + " context: " + context);
  if (colorRecorderTimer == null) {
    colorRecorderTimer = setTimeout(function() {
      // console.log("----");
      // console.log(["TRAINCOMP:" + colorRecorder.join('_'), colorRecorder]);
      lastComposition =  colorRecorder.join('_');
      // console.log("----");
      colorRecorderTimer = null;
      colorRecorder = [];
      lastDetectionColor = "NONE";
    }, 3000);
  }
  if (colorRecorder.length > 100) {
      queue = [];
      colorRecorder = [];
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
      sendMsg(["relay:toggle:BLUE"]);
  }
}


function colorTrainAction(color) {
  if (colorActionTimer === null) {
    toggle = lights.sort(() => Math.random() - 0.5)[0];
    sendMsg(["relay:toggle:"+toggle]);
    target = lastColorAction;

    if (color === "BLUE") {
      target = "BLUE";
    } else if (color === "GREEN" || color === "YELLOW") {
      target = "GREEN";
    } else if (color === "RED" || color === "PURPLE") {
      target = "RED";
    }

    if (lastColorAction === target) {
      target = colorActions.sort(() => Math.random() - 0.5)[0];
    }

    sendMsg(["relay:toggle:"+target]);
    lastColorAction = target;
    colorActionTimer = setTimeout(function() {
        colorActionTimer = null
    }, colorActionTimeout)
  }
}

const STATIONS = {
  FRONT: 'FRONT',
  UNLOADER: 'UNLOADER',
  YARD: 'YARD',
  LOADER: 'LOADER',
  BACK: "BACK",
  TRANSIT: "TRANSIT"
};

let compositionAttached = ['G', 'G', 'G'];

let compositionAt = [];
compositionAt[STATIONS.YARD] = [];
compositionAt[STATIONS.LOADER] = [];
compositionAt[STATIONS.UNLOADER] = [];

let colorAtYard = [];
let colorAtLoader = [];

let trainLocation = STATIONS.FRONT;
let path = STATIONS.YARD;

function handleDecouplerAction(splitLength, decoupler) {
  let trainLength = compositionAttached.length;

  let detached = [];

  if (trainLength >= splitLength) {
    trainLength -= splitLength;
    detached = compositionAttached.splice(-splitLength);
  } else {
    console.log("ERROR AT DECOUPLER 1");
    // check and reset
  }

  const trainDuration = FULL_ROUND / TRAIN_DURATION_FACTOR;
  const decouplerRelay = `relay:set:${decoupler}`;

  sendOrQueueSafe([trainRelay(20,0,CROSSING_WAIT)], CROSSING_WAIT);
  sendOrQueueSafe([`${decouplerRelay}:ON`], CROSSING_WAIT);
  sendOrQueueSafe([trainRelay(10,100,CROSSING_WAIT)], CROSSING_WAIT);
  sendOrQueueSafe([`${decouplerRelay}:OFF`, trainRelay(10,0,FULL_ROUND)], FULL_ROUND);
  sendOrQueueSafe([COLORTRIGGER, `relay:set:TRAINLOC:FRONT`], CROSSING_WAIT);
  trainLocation = STATIONS.FRONT;

  return detached;
}

function trainRelay(mode, speeddelta, duration) {
  let trainLength = compositionAttached.length;
  let trainsSpeed = 70 + trainLength * 12 + speeddelta;
  let trainDuration = duration/100;
  return `relay:set:MOTORDIRECT:${mode}:3:${trainDuration}:${trainsSpeed}`;
}

//
// BOUNDARY WEBSOCKET
//
var W3CWebSocket = require('websocket').w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:8080/trainws/handler');

function receiveMsg(message) {
  cmd = message.split(":");
//  console.log(" HANDLER Received: '" + message + "' " + cmd + " - " +  queue.length);

  if (cmd[0] === "color") {
    colorDetected(cmd[2], cmd[1]);
  }

  if (cmd[1] === "ALLLIGHTS") {
    lights.forEach(l => {sendMsg(["relay:"+cmd[0]+":"+l+":"+cmd[2]])})
  }

  if (cmd[0] === "toggle" && cmd[1] === "ALLOFF") {
    lights.forEach(l => {sendMsg(["relay:set:"+l+":OFF"])})
  }

  if (cmd[0] === "toggle" && cmd[1] === "ALLON") {
    lights.forEach(l => {sendMsg(["relay:set:"+l+":ON"])})
  }

  if (cmd[0] === "set" && cmd[1] === "TRAINLOC") {
    console.log(["TRAINLOC", cmd[2], trainLocation, path, compositionAttached, compositionAt]);
  }

  if (queue.length < 20) {

    if (message === "toggle:BLUE" || message === "toggle:TRAIN" || message === "toggle:FRONT") {
      if (trainLocation === STATIONS.FRONT) {
        sendOrQueueSafe([trainRelay(20,0,FULL_ROUND)], FULL_ROUND);
        sendOrQueueSafe([COLORTRIGGER, `relay:set:TRAINLOC:`+path], CROSSING_WAIT);
        trainLocation = path;
        compositionAttached.push(...compositionAt[trainLocation]);
        compositionAt[trainLocation] = [];
      } else {
        sendOrQueueSafe([trainRelay(10,100,CROSSING_WAIT)], CROSSING_WAIT);
        sendOrQueueSafe([trainRelay(10,0,FULL_ROUND)], FULL_ROUND);
        sendOrQueueSafe([COLORTRIGGER, `relay:set:TRAINLOC:FRONT`], CROSSING_WAIT);
        trainLocation = STATIONS.FRONT;
      }
    }

    if (message === "toggle:ORANGE" || message === "toggle:UNLOADER") {
      if (trainLocation === STATIONS.UNLOADER) {
        // nothing?
      } else {
        let trainLength = compositionAttached.length;
        const trainsSpeed = BASE_SPEED + trainLength * PER_WAGON_SPEED;
        const trainDuration = FULL_ROUND / TRAIN_DURATION_FACTOR;
        if (trainLocation != STATIONS.FRONT) {
          sendOrQueueSafe([trainRelay(10,100,CROSSING_WAIT)], CROSSING_WAIT);
          sendOrQueueSafe([trainRelay(10,0,FULL_ROUND)], FULL_ROUND);
        }
        sendOrQueueSafe(["relay:set:SWITCHBACK:OFF"], CROSSING_WAIT);
        sendOrQueueSafe([trainRelay(20,0,FULL_ROUND)], FULL_ROUND);
        sendOrQueueSafe([COLORTRIGGER, `relay:set:TRAINLOC:UNLOADER`], CROSSING_WAIT);
        trainLocation = STATIONS.UNLOADER;
        path = STATIONS.UNLOADER;
      }
    }

    if (message === "toggle:RED" || message === "toggle:YARD" ) { // FRONT,YARD,DOUBLE
 
      if (trainLocation === STATIONS.YARD) {
        compositionAt[STATIONS.YARD] = handleDecouplerAction(2, "DECOUPLERFRONT");
      } else {
        let trainLength = compositionAttached.length;
        const trainsSpeed = 75 + trainLength * 10;
        const trainDuration = FULL_ROUND / TRAIN_DURATION_FACTOR;
        if (trainLocation != STATIONS.FRONT) {
          sendOrQueueSafe([trainRelay(10,100,CROSSING_WAIT)], CROSSING_WAIT);
          sendOrQueueSafe([trainRelay(10,0,FULL_ROUND)], FULL_ROUND);
        }
        sendOrQueueSafe(["relay:set:SWITCHFRONT:OFF", "relay:set:SWITCHBACK:ON"], CROSSING_WAIT);
        sendOrQueueSafe([trainRelay(20,0,FULL_ROUND)], FULL_ROUND);
        sendOrQueueSafe([COLORTRIGGER, `relay:set:TRAINLOC:YARD`], CROSSING_WAIT);
        trainLocation = STATIONS.YARD;
        path = STATIONS.YARD;
        compositionAttached.push(...compositionAt[trainLocation]);
        compositionAt[trainLocation] = [];
      }
    }

    if (message === "toggle:GREEN" || message === "toggle:LOADER") { // 
      if (trainLocation === STATIONS.LOADER) {
        compositionAt[STATIONS.LOADER] = handleDecouplerAction(1, "DECOUPLERBACK");
      } else {
        let trainLength = compositionAttached.length;
        const trainsSpeed = 75 + trainLength * 10;
        const trainDuration = FULL_ROUND / TRAIN_DURATION_FACTOR;
        if (trainLocation != STATIONS.FRONT) {
          sendOrQueueSafe([trainRelay(10,100,CROSSING_WAIT)], CROSSING_WAIT);
          sendOrQueueSafe([trainRelay(10,0,FULL_ROUND)], FULL_ROUND);
        }
        sendOrQueueSafe(["relay:set:SWITCHFRONT:ON", "relay:set:SWITCHBACK:ON"], CROSSING_WAIT);
        sendOrQueueSafe([trainRelay(20,0,FULL_ROUND)], FULL_ROUND);
        sendOrQueueSafe([COLORTRIGGER, `relay:set:TRAINLOC:LOADER`], CROSSING_WAIT);
        trainLocation = STATIONS.LOADER;
        path = STATIONS.LOADER;
        compositionAttached.push(...compositionAt[trainLocation]);
        compositionAt[trainLocation] = [];
      }
    }
  }

  if (message === "info:BLUE" || message === "info:RED" || message === "info:GREEN" || message === "info:ORANGE") {
// FIXME train state move to decoupler?
    sendMsg(["state:"+cmd[1]+":ON"]);
  }

  if (message === "info:TRAIN") {
    sendMsg(["state:TRAIN:ON"]);
  }

  if (message === "info:TRAINCOMP") {
    sendMsg(["state:TRAINCOMP:COMP_" + compositionAttached.join("")]);
  }

  if (message === "info:YARD") {
    sendMsg(["state:YARD:COMP_" + compositionAt[STATIONS.YARD].join("")]);
  }

  if (message === "info:LOADER") {
    sendMsg(["state:LOADER:COMP_" + compositionAt[STATIONS.LOADER].join("")]);
  }

  if (message === "info:ALLLIGHTS") {
    sendMsg(["state:ALLLIGHTS:ON"]);
  }
  if (message === "info:ALLOFF") {
    sendMsg(["state:ALLOFF:ON"]);
  }
  if (message === "info:ALLON") {
    sendMsg(["state:ALLON:ON"]);
  }
}

client.onerror = function() {
   console.log('Connection Error');
   process.exit(1);
};

client.onopen = function() {
    console.log('WebSocket Client Connected');
};

client.onclose = function() {
   console.log('WebSocket Client Closed');
   process.exit(1);
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        receiveMsg(e.data);
    }
};

function sendMsg(msgs) {
    if (client.readyState === client.OPEN) {
        msgs.forEach(msg => {client.send(msg)});
    }
}
