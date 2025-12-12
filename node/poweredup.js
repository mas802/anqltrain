const fs = require('fs');
// FIXME path should be more general
let config = JSON.parse(fs.readFileSync('/home/train/anqltrain/node/config.json'));

//
// BOUNDARY Powered UP
//

const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();
let scanStopTimer = null;
let isScanning = false;

function scanWithStop(timeoutMs = 60000) {
  if (isScanning) {
    return;
  }
  isScanning = true;
  poweredUP.scan();
  if (scanStopTimer) {
    clearTimeout(scanStopTimer);
  }
  scanStopTimer = setTimeout(() => {
    poweredUP.stop();
    isScanning = false;
    scanStopTimer = null;
  }, timeoutMs);
}
scanWithStop();

console.log("POWEREDUP Looking for train and remote...");

let remoteHub = null;
let remoteButtonLeft = null;
let remoteButtonRight = null;
let remoteLed = null;

let lastColorAt = [];
const activeHubs = new Map(); // hubId -> {status, started, lastLog}
const DUPLICATE_LOG_INTERVAL = 2000;
const CONNECT_STALE_MS = 10000;

function shouldSkipDiscovery(hubId, hubType) {
  if (!hubId) return false;
  const entry = activeHubs.get(hubId);
  if (!entry) return false;
  const now = Date.now();
  if (entry.status === "connecting" && now - entry.started > CONNECT_STALE_MS) {
    activeHubs.delete(hubId);
    return false;
  }
  if (!entry.lastLog || (now - entry.lastLog) > DUPLICATE_LOG_INTERVAL) {
    console.log(["POWEREDUP INFO skip duplicate discovery", hubId, hubType, activeHubs]);
    entry.lastLog = now;
  }
  return true;
}

function rememberHub(hubId) {
  if (!hubId) return;
  activeHubs.set(hubId, { status: "connecting", started: Date.now(), lastLog: 0 });
}

function markHubConnected(hubId) {
  if (!hubId) return;
  const entry = activeHubs.get(hubId);
  const now = Date.now();
  if (entry) {
    entry.status = "connected";
    entry.started = now;
  } else {
    activeHubs.set(hubId, { status: "connected", started: now, lastLog: 0 });
  }
}

function releaseHubId(hubId) {
  if (!hubId) return;
  activeHubs.delete(hubId);
}

let motorConfig = {
"SWITCHFRONT" : {
  motor: null,
  state: "OFF",
  degrees: 90,
  speed: 120,
  led: null,
  mode: "toggle"
},
"SWITCHBACK" : {
  motor: null,
  state: "OFF",
  degrees: 90,
  speed: 120,
  led: null,
  mode: "toggle"
},
"CONVEYOR" : {
  motor: null,
  state: "OFF",
  degrees: 720,
  speed: -80,
  led: null,
  mode: "normal"
},
"LOADEEMOTOR" : {
  motor: null,
  state: "OFF",
  degrees: 45,
  speed: -20,
  led: null,
  mode: "toggle"
},
"DECOUPLERBACK" : {
  motor: null,
  state: "OFF",
  degrees: 160,
  speed: 5,
  led: null,
  mode: "toggle"
},
"DECOUPLERFRONT" : {
  motor: null,
  state: "OFF",
  degrees: 280,
  speed: 5,
  led: null,
  mode: "toggle"
}
}

poweredUP.on("discover", async (hub) => {

    const hubId = hub.uuid || hub.primaryMACAddress;
    if (shouldSkipDiscovery(hubId, hub.type)) {
      return;
    }
    rememberHub(hubId);
    const releaseHub = () => releaseHubId(hubId);

    try {
      await hub.connect();
    } catch (e) {
      console.warn([e, new Date().toISOString() + " bt connect issue", { hubId, type: hub.type }]);
      releaseHub();
      return;
    }
    markHubConnected(hubId);
    console.log(["POWEREDUP INFO connect ", hubId, hub.primaryMACAddress, hub.uuid, hub.type]);
    hub.on("disconnect", () => {
      releaseHub();
      console.log("disconnect hub " + hubId + " - " + hub.primaryMACAddress + " - " + hub.uuid + " - " + hub.type);
    });

    let hubname = null
    for (var key in config.hubAddr) {
      if ( config.hubAddr[key] === hub.primaryMACAddress ) {
        hubname = key;
      }
    }

    // console.log("Detected hub config key: " + hubname)
    // console.log(config["hubAddr"]["remote1"])

    if (hub.type === PoweredUP.Consts.HubType.HUB) {

        hub.disconnect();

    } else if (hub.type === PoweredUP.Consts.HubType.REMOTE_CONTROL) {

      if (hubname != null) {

        const led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
        led.setColor(PoweredUP.Consts.Color.RED);

        const buttonLeft = await hub.waitForDeviceAtPort("LEFT");
        buttonLeft.on("remoteButton", ({ event }) => {
          buttonHandler(hub, hubname+":LEFT", event);
        });

        const buttonRight = await hub.waitForDeviceAtPort("RIGHT");
        buttonRight.on("remoteButton", ({ event }) => {
          buttonHandler(hub, hubname+":RIGHT", event);
        });

        hub.on("button", (device) => {
          buttonHandler(device, hubname, PoweredUP.Consts.ButtonState.PRESSED);
        });

        console.log(`INFO: Connected to ${hubname} (${hub.name})!`);

      } else {

        console.log("UNKONW remote " + hub.primaryMACAddress);
        hub.disconnect();

      }

    } else if (hub.type === PoweredUP.Consts.HubType.MOVE_HUB) {

      let hubled = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);

      for (var port in config.movehubConfigs[hubname]) {
        let motor = config.movehubConfigs[hubname][port].motor;
        console.log(`config connect ${hubname} port: ${port} to motor ${motor}`);
        motorConfig[motor].motor = await hub.waitForDeviceAtPort(port);
        motorConfig[motor].led = hubled;
      }

      if (hub.primaryMACAddress == config["hubAddr"]["CONVEYORHUB"]) {
        console.log(`INFO: Connected to CONVEYORHUB moveHub (${hub.name} / ${hubname} / ${hub.primaryMACAddress}))!`);

        hubled.setColor(PoweredUP.Consts.Color.YELLOW);

        let sensor = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR);
        sensor.setColor(PoweredUP.Consts.Color.WHITE);

        hub.on("button", (device) => {
          buttonHandler(device, "LOADEE", PoweredUP.Consts.ButtonState.PRESSED);
        });

        hub.on("colorAndDistance", (device, { color, distance }) => {
          colorSensorHandler(device, color, distance, "CONVEYOR");
        });

      } else if (hub.primaryMACAddress == config["hubAddr"]["SWITCHHUB"]) {
        console.log(`INFO: Connected to SWITCHHUB moveHub (${hub.name} / ${hubname} / ${hub.primaryMACAddress}))!`);

        hubled.setColor(PoweredUP.Consts.Color.GREEN);

        motorConfig["SWITCHFRONT"].motor = await hub.waitForDeviceAtPort("C");
        motorConfig["SWITCHBACK"].motor = await hub.waitForDeviceAtPort("A");

        let sensor = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR);
        sensor.setColor(PoweredUP.Consts.Color.WHITE);

        hub.on("button", (device) => {
          buttonHandler(device, "SWITCHFRONT", PoweredUP.Consts.ButtonState.PRESSED);
        });

        hub.on("colorAndDistance", (device, { color, distance }) => {
          colorSensorHandler(device, color, distance, "SWITCH");
        });

      } else if (hub.primaryMACAddress == config["hubAddr"]["DECOUPLERHUB"]) {
        console.log(`INFO: Connected to DECOUPLERHUB moveHub (${hub.name} / ${hubname} / ${hub.primaryMACAddress}))!`);

        hubled.setColor(PoweredUP.Consts.Color.BLUE);

        motorConfig["DECOUPLERFRONT"].motor = await hub.waitForDeviceAtPort("A");

        motorConfig["DECOUPLERBACK"].motor = await hub.waitForDeviceAtPort("B");

        hub.on("button", (device) => {
          buttonHandler(device, "DECOUPLER", PoweredUP.Consts.ButtonState.PRESSED);
        });

        sensor = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR);
        sensor.setColor(PoweredUP.Consts.Color.WHITE);

        hub.on("colorAndDistance", (device, { color, distance }) => {
          colorSensorHandler(device, color, distance, "DECOUPLER");
        });
      }

    } else {
          console.log("UNKONW hub " + hub.primaryMACAddress);
          hub.disconnect();
    }
});


//
// PoweredUp Actions
//

function isMotorConnected(mconfig) {
  if (!mconfig.motor) {
    console.log("WARN: motor missing");
    return false;
  }
  if (!mconfig.motor.connected) {
    console.log("WARN: motor disconnected");
    mconfig.motor = null;
    return false;
  }
  return true;
}

async function setMotor(mconfig, goal) {
  if (!isMotorConnected(mconfig)) return;
  let dir = mconfig.speed;
  if (goal === "OFF" && mconfig.mode == "toggle") dir = -dir;
  mconfig.state = goal;
  // console.log("set motor to: " + [mconfig.state, mconfig.speed, dir])
  return await mconfig.motor.rotateByDegrees(mconfig.degrees, dir)
      .catch(e => {console.warn([e, new Date().toISOString() + " motor to far", mconfig])});
}

async function toggleMotor(mconfig) {
  const goal = (mconfig.state == "OFF") ? "ON" : "OFF";
  return await setMotor(mconfig, goal);
}

async function runMotor(mconfig, degrees, speed) {
  if (!isMotorConnected(mconfig)) return;
  console.log("direct set motor to: " + [degrees, speed])
  return await mconfig.motor.rotateByDegrees(degrees, speed)
      .catch(e => {console.warn([e, new Date().toISOString() + " motor to far", mconfig])});
}

function buttonHandler(device, context, state) {
  sendMsg("trigger:"+context+":"+PoweredUP.Consts.ButtonState[state]);
}

function colorSensorHandler(device, color, distance, context) {
  let reportColor = "NONE";
  if (color && distance < 100) {
    reportColor = PoweredUP.Consts.Color[color];
  } 

  if (reportColor != lastColorAt[context]) {
    sendMsg("relay:color:"+context+":"+reportColor);
    lastColorAt[context] = reportColor;
  }
}

//
// BOUNDARY WEBSOCKET
//
var W3CWebSocket = require('websocket').w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:8080/trainws/poweredup');

function receiveMsg(message) {
  cmd = message.split(":");

  if (message === "toggle:SCAN") {
    scanWithStop();
  }

  if (cmd[0] === "set" && cmd[1] === "PUMDIRECT") {
    let dmconfig = motorConfig[cmd[2]]
    if (dmconfig) {
      runMotor(dmconfig, cmd[3], cmd[4])
    }
  }

  let mconfig = motorConfig[cmd[1]]

  if (cmd[0] === "toggle") {
    if (mconfig) {
      toggleMotor(mconfig);
    }
  }

  if (cmd[0] === "set") {
     state = cmd[2];
     if (mconfig) {
        setMotor( mconfig, state);
     } else if (cmd[1] === "TRAINLED") {
        if (motorConfig["DECOUPLERBACK"].led) {
          motorConfig["DECOUPLERBACK"].led.setColor(PoweredUP.Consts.Color[state]);
        }
     }
  }

  if (cmd[0] === "info") {
    if (mconfig) {
      sendMsg("state:"+cmd[1]+":"+mconfig.state);
    }
  }
}

client.onerror = function() {
   console.log(Date.now() + 'Connection Error');
   process.exit(1);
};

client.onopen = function() {
    console.log(Date.now() + 'WebSocket Client Connected');
};

client.onclose = function() {
   console.log(Date.now() + 'WebSocket Client Closed');
   process.exit(1);
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        receiveMsg(e.data);
    }
};

function sendMsg(msg) {
    if (client.readyState === client.OPEN) {
        client.send(msg);
    }
}
