#!/usr/bin/env node
/**
 * Minimal CLI client for the train WebSocket endpoint.
 * - Logs every inbound message with a timestamp.
 * - Allows the user to type commands that are sent verbatim.
 * - Supports /quit or /exit to terminate the session cleanly.
 */
const { w3cwebsocket: W3CWebSocket } = require('websocket');
const readline = require('readline');

const DEFAULT_WS_URL = 'ws://localhost:8080/trainws/cli';
const wsUrl = process.argv[2] || process.env.TRAIN_WS_URL || DEFAULT_WS_URL;

const log = (message) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${message}`);
};

const client = new W3CWebSocket(wsUrl);
let shuttingDown = false;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

const closeApp = (code = 0) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  rl.close();
  if (client.readyState === client.OPEN || client.readyState === client.CONNECTING) {
    client.close();
  }
  process.exit(code);
};

client.onerror = (error) => {
  log(`WebSocket error: ${error?.message || error}`);
};

client.onopen = () => {
  log(`Connected to ${wsUrl}`);
  rl.prompt();
};

client.onclose = () => {
  log('WebSocket connection closed');
  closeApp();
};

client.onmessage = (event) => {
  if (typeof event.data === 'string') {
    log(`message: ${event.data}`);
  } else {
    log('Received non-text message');
  }
};

rl.on('line', (line) => {
  const input = line.trim();
  if (!input) {
    rl.prompt();
    return;
  }

  if (input === '/quit' || input === '/exit') {
    log('Closing client');
    closeApp();
    return;
  }

  if (client.readyState !== client.OPEN) {
    log('Cannot send message: WebSocket not connected');
  } else {
    client.send(input);
    log(`sent: ${input}`);
  }

  rl.prompt();
});

rl.on('SIGINT', () => {
  log('Interrupted (Ctrl+C)');
  closeApp();
});
