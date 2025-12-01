#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

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
  fire: async (controller, effectId = 7) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 55, 80, buildFirePalette());
  },
  monster: async (controller, effectId = 7) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 45, 80, buildMonsterPalette());
  },
  ghost: async (controller, effectId = 7) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 45, 80, buildGhostPalette());
  },
  water: async (controller, effectId = 0) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 1, 50, 70, buildWaterPalette());
  },
  rainbow: async (controller, effectId = 1) => {
    await controller.switchOn(true);
    await controller.setEffect(effectId, 0, 45, 80, buildRainbowPalette());
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

function createColorEffect([r, g, b]) {
  return async (controller) => {
    await controller.switchOn(true);
    await controller.setColour(r, g, b);
  };
}

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

function buildMonsterPalette() {
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

function buildGhostPalette() {
  return buildColourDataPacket([
    [30, 0, 60],
    [60, 0, 120],
    [90, 0, 180],
    [130, 20, 220],
    [170, 40, 255],
    [200, 70, 255],
    [230, 110, 255],
    [255, 150, 255],
  ]);
}

function buildWaterPalette() {
  return buildColourDataPacket([
    [0, 20, 40],
    [0, 40, 80],
    [0, 60, 120],
    [200, 200, 250],
    [0, 110, 200],
    [0, 150, 230],
    [20, 180, 240],
    [40, 200, 255],
  ]);
}

function buildRainbowPalette() {
  return buildColourDataPacket([
    [255, 0, 0],
    [255, 128, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 0, 255],
    [75, 0, 130],
    [143, 0, 255],
    [255, 0, 255],
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

module.exports = {
  refreshStrips,
  applyEffect,
  stripDevices,
  EFFECTS,
};
