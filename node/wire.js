const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, '..', 'config.json');
let config = JSON.parse(fs.readFileSync(configPath));

// Channel indices refer to the pin list already flashed onto each Arduino.
function loadWireBoards(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('config.wireBoards must be an object');
  }
  const names = new Set();
  const addresses = new Set();
  return Object.entries(config).map(([name, board]) => {
    if (!board || !Number.isInteger(board.address) || board.address < 8 || board.address > 119 || addresses.has(board.address)) {
      throw new Error(`Invalid or duplicate I2C address for ${name}`);
    }
    addresses.add(board.address);
    if (!Number.isInteger(board.channelCount) || board.channelCount < 1 || board.channelCount > 32) {
      throw new Error(`Invalid channelCount for ${name}`);
    }
    if (!board.items || typeof board.items !== 'object' || Array.isArray(board.items)) {
      throw new Error(`Invalid items for ${name}`);
    }
    const indices = new Map();
    for (const [itemName, item] of Object.entries(board.items)) {
      if (names.has(itemName)) throw new Error(`Duplicate item ${itemName}`);
      names.add(itemName);
      if (!item || !Number.isInteger(item.index) || item.index < 0 || item.index >= board.channelCount) {
        throw new Error(`Invalid index ${JSON.stringify(item && item.index)} for ${itemName} on ${name}: expected an integer from 0 to ${board.channelCount - 1} (channelCount=${board.channelCount})`);
      }
      if (indices.has(item.index)) {
        throw new Error(`Duplicate index ${item.index} on ${name}: ${itemName} and ${indices.get(item.index)}`);
      }
      indices.set(item.index, itemName);
      if (![0, 1, 5, 6, 7].includes(item.mode)) throw new Error(`Invalid mode for ${itemName}`);
    }
    for (const [itemName, item] of Object.entries(board.items)) {
      if (item.pairedItem !== undefined && (item.pairedItem === itemName || !Object.hasOwn(board.items, item.pairedItem))) {
        throw new Error(`pairedItem for ${itemName} must refer to another item on the same board`);
      }
    }
    return { ...board, name };
  });
}

const boards = loadWireBoards(config.wireBoards);
const itemsByName = new Map();
const status = { CROSSING: 'OFF' };
for (const board of boards) {
  board.buffer = Buffer.alloc(board.channelCount, 99);
  for (const [name, item] of Object.entries(board.items)) {
    itemsByName.set(name, { ...item, board });
    status[name] = 99;
  }
}

const statusMap = {
    "0" : "OFF", // MULTIPLE OFF
    "1" : "ON",  // REGULAR ON
    "2" : "A",   // SIGNAL ON
    "3" : "B",   // R
    "4" : "OFF", // FLICKER TO ON
    "5" : "ON",  // FLICKER TO OFF
    "6" : "ON",  // BLINK
    "7" : "ON",  // TOGGLE FLICKER
    "10" : "ON",  // BLINK ON
    "11" : "OFF",  // BLINK OFF
    "99" : "failed"
};

const I2C_TRAIN_ADDR = 0x0e;
const CROSSING_UP = 10;
const CROSSING_DOWN = 20;

let trainMode = null;

//
// BOUNDARY I2C
//

const i2c = require('i2c-bus');
const wbuffer = Buffer.alloc(16);

const i2c1 = i2c.open(4, true, function (err) {
    if (err)  console.log(err);
});

let lastread = 0;
let pendingRead = null;
function readI2C() {
  if (pendingRead) return pendingRead;
  if (Date.now() - lastread < 1000) return Promise.resolve();
  lastread = Date.now();
  pendingRead = Promise.all(boards.map(board => new Promise(resolve => {
    i2c1.i2cRead(board.address, board.channelCount, board.buffer, (err, bytesRead) => {
      if (err || bytesRead !== board.channelCount) {
        if (err) console.log(err);
        board.buffer.fill(99);
      }
      resolve();
    });
  }))).finally(() => { pendingRead = null; });
  return pendingRead;
}

sendI2C1 = function(addr,item) {
try {
  wbuffer[0] = item;
  i2c1.i2cWriteSync(addr, 1, wbuffer);
} catch (e) {
  console.log("ERROR: sendI2C1: ");
}
}

sendI2C = function(addr,action,item1,item2,data) {

try {
  // console.debug(["send", addr, action, item1, item2, data]);
  wbuffer[0] = action;
  wbuffer[1] = item1;
  wbuffer[2] = item2;
  wbuffer[3] = data;
  i2c1.i2cWriteSync(addr, 4, wbuffer);
  console.debug(["done", addr, action, item1, item2, data]);
} catch (e) {
  console.log("ERROR: sendI2C: ");
}
}

//
// BOUNDARY WEBSOCKET
//

var W3CWebSocket = require('websocket').w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:8080/trainws/wire');

client.onerror = function() {
   console.log( 'Connection Error');
//   process.exit(1);
};

client.onopen = function() {
    console.log('WebSocket Client Connected');
};

client.onclose = function() {
   console.log('WebSocket Client Closed');
//   process.exit(1);
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

function receiveMsg(message) {
  const cmd = message.split(':');
  const itemName = cmd[1];

  if (itemName === 'TRAINLED' && cmd[0] === 'set') {
    status.TRAIN = cmd[2];
    return;
  }
  if (itemName === 'MOTORDIRECT' && cmd[0] === 'set') {
    sendI2C(I2C_TRAIN_ADDR, cmd[2], cmd[3], cmd[4], cmd[5]);
    return;
  }
  if (cmd[0] === 'info') {
    statusSync(false, itemName);
    return;
  }

  const item = itemsByName.get(itemName);
  if (!item) return;
  const paired = item.pairedItem ? itemsByName.get(item.pairedItem) : null;
  let action;
  if (cmd[0] === 'toggle') action = item.mode;
  if (cmd[0] === 'on' || (cmd[0] === 'set' && cmd[2] === 'ON')) action = 1;
  if (cmd[0] === 'off' || (cmd[0] === 'set' && cmd[2] === 'OFF')) action = 0;
  if (action !== undefined) {
    sendI2C(item.board.address, action, item.index, paired ? paired.index : 99, 0);
  }
}

// Publish only configured channels after their I2C reads complete.
statusSync = async function(forceall, forceditem) {
  if (forceditem === 'CROSSING') {
    sendMsg('state:CROSSING:' + status.CROSSING);
    return;
  }
  if (forceditem && !itemsByName.has(forceditem)) return;
  await readI2C();
  for (const board of boards) {
    for (const [name, item] of Object.entries(board.items)) {
      const next = board.buffer[item.index];
      if (forceall || status[name] !== next || forceditem === name) {
        status[name] = next;
        sendMsg('state:' + name + ':' + (statusMap[next] || 'failed'));
      }
    }
  }
};
