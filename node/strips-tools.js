#!/usr/bin/env node
'use strict';

const { scanCommand, dumpCommand } = require('./strips-core');

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  switch ((command || '').toLowerCase()) {
    case 'scan':
      await scanCommand();
      break;
    case 'dump':
      await dumpCommand(rest[0]);
      break;
    default:
      console.log('Usage:');
      console.log('  node lights-tools.js scan');
      console.log('  node lights-tools.js dump <identifier>');
      break;
  }
}

main().catch((err) => {
  console.error('lights-tools failed:', err);
  process.exit(1);
});
