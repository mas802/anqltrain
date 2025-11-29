#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const {
  buildColourDataPacket,
  buildDeviceIndex,
  applyEffectToPeripheral,
  connectionPool,
} = require('./strips-core');

const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath));
const stripDevices = config.strips || {};

const EFFECTS = {
  fire: async (controller, effectId = 1) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 55, 80, buildFirePalette());
  },
  ghost: async (controller, effectId = 2) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 45, 80, buildGhostPalette());
  },
  water: async (controller, effectId = 3) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 50, 70, buildWaterPalette());
  },
  white: createColorEffect([180, 180, 180]),
  blue: createColorEffect([0, 0, 255]),
  red: createColorEffect([255, 0, 0]),
  yellow: createColorEffect([255, 120, 0]),
  on: createColorEffect([255, 255, 255]),
  off: async (controller) => {
    await controller.switchOn(false);
  },
};

function buildFirePalette() {
  return buildColourDataPacket([
    [45, 0, 0],
    [70, 0, 0],
    [95, 2, 0],
    [120, 5, 0],
    [145, 12, 0],
    [165, 20, 0],
    [185, 32, 2],
    [198, 48, 6],
  ]);
}

function buildGhostPalette() {
  return buildColourDataPacket([
    [0, 30, 0],
    [0, 60, 5],
    [5, 90, 20],
    [20, 130, 40],
    [40, 180, 70],
    [90, 230, 110],
    [140, 255, 160],
    [100, 200, 120],
  ]);
}

function buildWaterPalette() {
  return buildColourDataPacket([
    [0, 20, 40],
    [0, 40, 80],
    [0, 60, 120],
    [0, 80, 160],
    [0, 110, 200],
    [0, 150, 230],
    [20, 180, 240],
    [40, 200, 255],
  ]);
}

let stripCache = null;

async function refreshStrips() {
  console.log('Scanning for strips...');
  stripCache = await buildDeviceIndex();
  const identifiers = Array.from(stripCache.index.keys());
  console.log(`Found ${identifiers.length} identifier(s).`);
}

async function applyEffect(alias, effectName, effectOverride) {
  const identifier = stripDevices[alias.toUpperCase()];
  if (!identifier) {
    console.error(`Unknown strip alias "${alias}". Available: ${Object.keys(stripDevices).join(', ') || 'none'}.`);
    return;
  }

  const handler = EFFECTS[effectName.toLowerCase()];
  if (!handler) {
    console.error(`Unknown effect "${effectName}". Allowed: ${Object.keys(EFFECTS).join(', ')}.`);
    return;
  }

  if (!stripCache) {
    await refreshStrips();
  }

  let peripheral = stripCache.index.get(identifier.toLowerCase());
  if (!peripheral) {
    console.warn(`Strip "${identifier}" not found. Rescanning...`);
    await refreshStrips();
    peripheral = stripCache.index.get(identifier.toLowerCase());
    if (!peripheral) {
      console.error(`Strip "${identifier}" still not found after rescan.`);
      return;
    }
  }

  const label = peripheral.advertisement?.localName || identifier;
  console.log(`Applying "${effectName}" to ${alias.toUpperCase()} (${label})`);
  await applyEffectToPeripheral(identifier, peripheral, async (controller) => {
    if (typeof effectOverride === 'number' && !Number.isNaN(effectOverride)) {
      await handler(controller, effectOverride);
    } else {
      await handler(controller);
    }
  });
  console.log('Done');
}

async function main() {
  await refreshStrips();
  printHelp();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'lights> ',
  });

  let busy = false;
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      rl.close();
      return;
    }

    if (input.toLowerCase() === 'help') {
      printHelp();
      rl.prompt();
      return;
    }

    if (input.toLowerCase() === 'refresh') {
      await refreshStrips();
      rl.prompt();
      return;
    }

    if (busy) {
      console.log('Busy processing previous command, please wait...');
      rl.prompt();
      return;
    }

    const parts = input.split(/\s+/);
    if (parts.length < 2) {
      console.log('Please provide strip alias and effect, optionally an effect id, e.g. "STRIP1 fire 4".');
      rl.prompt();
      return;
    }
    const alias = parts[0];
    const effectName = parts[1];
    const effectOverride = parts[2] ? Number(parts[2]) : undefined;

    busy = true;
    try {
      await applyEffect(alias, effectName, effectOverride);
    } catch (err) {
      console.error('Failed to apply effect:', err);
    } finally {
      busy = false;
      rl.prompt();
    }
  });

  rl.on('close', async () => {
    console.log('Exiting lights CLI');
    await connectionPool.disconnectAll().catch(() => undefined);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('lights.js failed:', err);
  process.exit(1);
});

function createColorEffect([r, g, b]) {
  return async (controller) => {
    await controller.switchOn(true);
    await controller.setColour(r, g, b);
  };
}

function printHelp() {
  console.log('Commands:');
  console.log('  STRIP1 fire           -> apply fire effect with default id');
  console.log('  STRIP2 water 4        -> apply water palette using effect #4');
  console.log('  refresh               -> rescan strips');
  console.log('  help                  -> show this help');
  console.log('  exit                  -> quit');
  console.log(`Available effects: ${Object.keys(EFFECTS).join(', ')}`);
  console.log(`Configured strips: ${Object.keys(stripDevices).join(', ') || 'none'}`);
}
