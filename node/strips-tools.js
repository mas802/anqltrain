#!/usr/bin/env node
'use strict';

const readline = require('readline');
const {
  refreshStrips,
  applyEffect,
  stripDevices,
  EFFECTS,
} = require('./strips');
const { scanCommand, dumpCommand, connectionPool } = require('./strips-core');

async function main() {
  await refreshStrips();
  printHelp();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'strips> ',
  });
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    const [command, ...args] = input.split(/\s+/);
    const lower = command.toLowerCase();

    if (lower === 'exit' || lower === 'quit') {
      rl.close();
      return;
    }

    if (lower === 'help') {
      printHelp();
      rl.prompt();
      return;
    }

    if (lower === 'scan') {
      await scanCommand();
      rl.prompt();
      return;
    }

    if (lower === 'refresh') {
      await refreshStrips();
      rl.prompt();
      return;
    }

    if (lower === 'dump') {
      const identifier = args[0];
      if (!identifier) {
        console.log('Usage: dump <identifier>');
      } else {
        await dumpCommand(identifier);
      }
      rl.prompt();
      return;
    }

    if (lower === 'apply') {
      const [alias, effectName, override] = args;
      if (!alias || !effectName) {
        console.log('Usage: apply <STRIP> <effect> [effectId]');
        rl.prompt();
        return;
      }
      const effectId = override ? Number(override) : undefined;
      try {
        await applyEffect(alias, effectName, effectId);
      } catch (err) {
        console.error('Failed to apply effect:', err);
      }
      rl.prompt();
      return;
    }

    console.log(`Unknown command "${command}". Type "help" for options.`);
    rl.prompt();
  });

  rl.on('close', async () => {
    await connectionPool.disconnectAll().catch(() => undefined);
    process.exit(0);
  });
}

function printHelp() {
  console.log('Commands:');
  console.log('  scan                 -> list ISP strips');
  console.log('  refresh              -> rescan strips');
  console.log('  apply STRIP fire 7   -> apply fire palette to STRIP with effect id 7');
  console.log('  dump <identifier>    -> dump GATT table');
  console.log('  help                 -> show this help');
  console.log('  exit                 -> quit');
  console.log(`Available effects: ${Object.keys(EFFECTS).join(', ')}`);
  console.log(`Configured strips: ${Object.keys(stripDevices).join(', ') || 'none'}`);
}

main().catch((err) => {
  console.error('strips-tools failed:', err);
  process.exit(1);
});
