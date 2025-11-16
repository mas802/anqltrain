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
  degrees: 45,
  speed: -20,
  led: null,
  mode: "normal"
},
"LOADER" : {
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
  degrees: 140,
  speed: -5,
  led: null,
  mode: "toggle"
},
"DECOUPLERFRONT" : {
  motor: null,
  state: "OFF",
  degrees: 140,
  speed: -5,
  led: null,
  mode: "toggle"
}
}

poweredUP.on("discover", async (hub) => {

    // console.log("discovered: " + hub.type);

    await hub.connect().catch(e => {console.warn([e, new Date().toISOString() + " bt connect issue"])});
    console.log(["POWEREDUP INFO connect ", hub.primaryMACAddress, hub.type]);

    let hubname = null
    for (var key in config.hubs) {
      let hc = config.hubs[key]
      if ( hc.addr === hub.primaryMACAddress ) {
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

       if (hub.primaryMACAddress == config["hubAddr"]["CONVEYORHUB"]) {
        console.log(`INFO: Connected to CONVEYORHUB moveHub (${hub.name} / ${hub.primaryMACAddress}))!`);

        motorConfig["CONVEYOR"].motor = await hub.waitForDeviceAtPort("B");

        led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
        led.setColor(PoweredUP.Consts.Color.YELLOW);


       } else if (hub.primaryMACAddress == config["hubAddr"]["SWITCHHUB"]) {
          console.log(`INFO: Connected to SWITCHHUB moveHub (${hub.name} / ${hub.primaryMACAddress}))!`);

          hub.on("color", (device, { color }) => {
            colorSensorHandler(device, color, "BACK");
          });

          motorConfig["SWITCHFRONT"].motor = await hub.waitForDeviceAtPort("C");
          motorConfig["SWITCHFRONT"].led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
          motorConfig["SWITCHFRONT"].led.setColor(PoweredUP.Consts.Color.ORANGE);

          motorConfig["SWITCHBACK"].motor = await hub.waitForDeviceAtPort("D");
          motorConfig["SWITCHBACK"].led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
          motorConfig["SWITCHBACK"].led.setColor(PoweredUP.Consts.Color.YELLOW);

          hub.on("button", (device) => {
            console.log("button pressed");
            buttonHandler(device, "SWITCHFRONT", PoweredUP.Consts.ButtonState.PRESSED);
          });

        } else if (hub.primaryMACAddress == config["hubAddr"]["DECOUPLERHUB"]) {
          console.log(`INFO: Connected to DECOUPLERHUB moveHub (${hub.name} / ${hub.primaryMACAddress}))!`);

          motorConfig["DECOUPLERFRONT"].motor = await hub.waitForDeviceAtPort("A");

          motorConfig["DECOUPLERBACK"].led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
          motorConfig["DECOUPLERBACK"].led.setColor(PoweredUP.Consts.Color.BLUE);
          motorConfig["DECOUPLERBACK"].motor = await hub.waitForDeviceAtPort("B");

          hub.on("color", (device, { color }) => {
            colorSensorHandler(device, color, "FRONT");
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
          hub.on("button", (device) => {
            buttonHandler(device,"DECOUPLER", PoweredUP.Consts.ButtonState.PRESSED);
          });
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
  if (mconfig.state != goal) {
    return await toggleMotor(mconfig);
  }
  return;
}

async function toggleMotor(mconfig) {
  if (!mconfig.motor) { console.log("WARN: motor missing"); return; }
  let dir = mconfig.speed;
  if (mconfig.state == "OFF") {
    mconfig.state = "ON";
  } else {
    mconfig.state = "OFF";
    if (mconfig.mode == "toggle") dir = -dir;
  }
  // console.log("set motor to: " + [mconfig.state, mconfig.speed, dir])
  return await mconfig.motor.rotateByDegrees(mconfig.degrees, dir)
      .catch(e => {console.warn([e, new Date().toISOString() + " motor to far", mconfig])});
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

function colorSensorHandler(device, color, context) {
  if (color && color != 0) {
    sendMsg("relay:color:"+context+":"+PoweredUP.Consts.Color[color]);
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
