#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const {
  refreshStrips,
  applyEffect,
  stripDevices,
  EFFECTS,
} = require('./strips');
const { connectionPool } = require('./strips-core');

const configPath = path.resolve(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath));
const wsUrl = config.stripsWsUrl || process.env.STRIPS_WS_URL || 'ws://localhost:8080/trainws/cli';

async function main() {
  await refreshStrips();

  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log(`[Strips WS] Connected to ${wsUrl}`);
  });

  ws.on('close', async () => {
    console.log('[Strips WS] Connection closed');
    await connectionPool.disconnectAll().catch(() => undefined);
    process.exit(0);
  });

  ws.on('error', (err) => {
    console.error('[Strips WS] Error:', err.message || err);
  });

  ws.on('message', async (data) => {
    try {
      await handleMessage(ws, data.toString());
    } catch (err) {
      console.error('[Strips WS] Failed to handle message:', err);
    }
  });
}

async function handleMessage(ws, raw) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('set:')) {
    return; // ignore unrelated commands
  }

  const parts = trimmed.split(':').slice(1); // remove 'set'
  if (parts.length < 2) {
    return;
  }
  const alias = parts[0];
  const effectName = parts[1];
  const override = parts[2] ? Number(parts[2]) : undefined;

  if (!stripDevices[alias.toUpperCase()]) {
    return;
  }

  if (!EFFECTS[effectName.toLowerCase()]) {
    return;
  }

  try {
    await applyEffect(alias, effectName, override);
    ws.send(`OK set:${alias}:${effectName}${override !== undefined ? `:${override}` : ''}`);
  } catch (err) {
    ws.send(`ERR ${err.message || err}`);
  }
}

main().catch((err) => {
  console.error('[Strips WS] Fatal error:', err);
  process.exit(1);
});
