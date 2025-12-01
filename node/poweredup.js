const fs = require('fs');
// FIXME path should be more general
let config = JSON.parse(fs.readFileSync('/home/train/anqltrain/node/config.json'));

//
// BOUNDARY Powered UP
//

const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();
poweredUP.scan(); // Start scanning

console.log("POWEREDUP Looking for train and remote...");

let remoteHub = null;
let remoteButtonLeft = null;
let remoteButtonRight = null;
let remoteLed = null;

let lastColorAt = [];

// Remote configurations now loaded from config.json
let hubConfigs = config.remoteConfigs;

let motorConfig = {
"SWITCHFRONT" : {
  motor: null,
  state: "OFF",
  degrees: 110,
  speed: 100,
  led: null,
  mode: "toggle"
},
"SWITCHBACK" : {
  motor: null,
  state: "OFF",
  degrees: 110,
  speed: 100,
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

    // console.log("discovered: " + hub.type);

    await hub.connect().catch(e => {console.warn([e, new Date().toISOString() + " bt connect issue"])});
    console.log(["POWEREDUP INFO connect ", hub.primaryMACAddress, hub.type]);

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

        if (hub.primaryMACAddress === config["hubAddr"]["remote1"] ) {
          remoteHub = hub;
          const led = await remoteHub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);

          remoteButtonLeft = await remoteHub.waitForDeviceAtPort("LEFT");
          remoteButtonRight = await remoteHub.waitForDeviceAtPort("RIGHT");
          led.setColor(PoweredUP.Consts.Color.PURPLE);

          addr = "remote1";

          remoteButtonLeft.on("remoteButton", ({ event }) => {
                if (event === PoweredUP.Consts.ButtonState.UP) {
                  sendMsg(hubConfigs[addr]["LEFT"]["UP"]);
                } else if (event === PoweredUP.Consts.ButtonState.STOP) {
                  sendMsg(hubConfigs[addr]["LEFT"]["STOP"]);
                } else if (event === PoweredUP.Consts.ButtonState.DOWN) {
                  sendMsg(hubConfigs[addr]["LEFT"]["DOWN"]);
                }
          });

          remoteButtonRight.on("remoteButton", ({ event }) => {
                if (event === PoweredUP.Consts.ButtonState.UP) {
                  sendMsg(hubConfigs[addr]["RIGHT"]["UP"]);
                } else if (event === PoweredUP.Consts.ButtonState.STOP) {
                  sendMsg(hubConfigs[addr]["RIGHT"]["STOP"]);
                } else if (event === PoweredUP.Consts.ButtonState.DOWN) {
                  sendMsg(hubConfigs[addr]["RIGHT"]["DOWN"]);
                }
          });
          console.log(`INFO: Connected to remote (${remoteHub.name})!`);

        } else if (hubname != null) {

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

        led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
        led.setColor(PoweredUP.Consts.Color.YELLOW);

        sensor = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR);
        sensor.setColor(PoweredUP.Consts.Color.WHITE);

        hub.on("button", (device) => {
          buttonHandler(device, "LOADEE", PoweredUP.Consts.ButtonState.PRESSED);
        });

        hub.on("colorAndDistance", (device, { color, distance }) => {
          colorSensorHandler(device, color, distance, "CONVEYOR");
        });

      } else if (hub.primaryMACAddress == config["hubAddr"]["SWITCHHUB"]) {

          console.log(`INFO: Connected to SWITCHHUB moveHub (${hub.name} / ${hubname} / ${hub.primaryMACAddress}))!`);

          motorConfig["SWITCHFRONT"].motor = await hub.waitForDeviceAtPort("A");

          motorConfig["SWITCHBACK"].motor = await hub.waitForDeviceAtPort("C");
          motorConfig["SWITCHBACK"].led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
          motorConfig["SWITCHBACK"].led.setColor(PoweredUP.Consts.Color.YELLOW);

          hub.on("button", (device) => {
            buttonHandler(device, "SWITCHFRONT", PoweredUP.Consts.ButtonState.PRESSED);
          });

          sensor = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR);
          sensor.setColor(PoweredUP.Consts.Color.WHITE);

          hub.on("colorAndDistance", (device, { color, distance }) => {
            colorSensorHandler(device, color, distance, "SWITCH");
          });

      } else if (hub.primaryMACAddress == config["hubAddr"]["DECOUPLERHUB"]) {
          console.log(`INFO: Connected to DECOUPLERHUB moveHub (${hub.name} / ${hubname} / ${hub.primaryMACAddress}))!`);

          motorConfig["DECOUPLERFRONT"].motor = await hub.waitForDeviceAtPort("A");

          motorConfig["DECOUPLERBACK"].led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
          motorConfig["DECOUPLERBACK"].led.setColor(PoweredUP.Consts.Color.BLUE);
          motorConfig["DECOUPLERBACK"].motor = await hub.waitForDeviceAtPort("B");

          hub.on("button", (device) => {
            buttonHandler(device, "DECOUPLER", PoweredUP.Consts.ButtonState.PRESSED);
          });

          sensor = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.COLOR_DISTANCE_SENSOR);
          sensor.setColor(PoweredUP.Consts.Color.WHITE);

          hub.on("colorAndDistance", (device, { color, distance }) => {
            colorSensorHandler(device, color, distance, "DECOUPLER");
          });

/*
          hub.on("colorAndDistance", (device, { color, distance}) => {
            console.log("detected movement with distance: "+distance);
            colorSensorHandler(device, color, "DECOUPLER");
          });

          hub.on("distance", (device, { distance}) => {
            console.log("detected movement with distand: "+distance);
            colorSensorHandler(device, PoweredUP.Consts.Color.BLUE, "DECOUPLER");
          });
*/
        }

        hub.on("disconnect", () => {
          console.log("disconnect move hub");
        });
    } else {
          console.log("UNKONW hub " + hub.primaryMACAddress);
          hub.disconnect();
    }
});


//
// PoweredUp Actions
//

async function setMotor(mconfig, goal) {
  if (!mconfig.motor) { console.log("WARN: motor missing"); return; }
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
  if (!mconfig.motor) { console.log("WARN: motor missing"); return; }
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
