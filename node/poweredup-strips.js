#!/usr/bin/env node
'use strict';

// Running poweredup.js and strips-ws.js in separate Node processes causes both
// copies of @abandonware/noble to fight over the same BLE adapter. Requiring both
// modules inside a single process lets them share one noble instance so that the
// Bluetooth stack can be used concurrently without crashing.

console.log('[Combined] Starting PoweredUP + Strips services in a single process');

// Order is not important, but loading PoweredUP first mirrors the legacy startup
// sequence and keeps the existing logs grouped together.
require('./poweredup');
require('./strips-ws');
