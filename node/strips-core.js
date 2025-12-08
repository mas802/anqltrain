#!/usr/bin/env node
'use strict';

// based on research done in this project: https://github.com/8none1/idealLED

const crypto = require('crypto');
const noble = require('@abandonware/noble');

const SECRET_ENCRYPTION_KEY = Buffer.from([
  0x34, 0x52, 0x2A, 0x5B, 0x7A, 0x6E, 0x49, 0x2C,
  0x08, 0x09, 0x0A, 0x9D, 0x8D, 0x2A, 0x23, 0xF8,
]);

const SERVICE_UUID = normalizeUuid('0000fff0-0000-1000-8000-00805f9b34fb');
const WRITE_CMD_UUID = normalizeUuid('d44bc439-abfd-45a2-b575-925416129600');
const WRITE_DATA_UUID = normalizeUuid('d44bc439-abfd-45a2-b575-92541612960a');
const NOTIFICATION_UUID = normalizeUuid('d44bc439-abfd-45a2-b575-925416129601');

const COLOUR_DATA = hexToBuffer(`
16 00 7F 00 00 7F 51 00 7F 7F 00 00 7F 00 00
00 7F 7F 00 7F 7F 7F 7F 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
`);

class LightController {
  constructor(peripheral) {
    this.peripheral = peripheral;
    this.writeCmdChar = null;
    this.writeDataChar = null;
    this.notificationChar = null;
  }

  async init() {
    const { characteristics } = await discoverCharacteristics(
      this.peripheral,
      [],
      [WRITE_CMD_UUID, WRITE_DATA_UUID, NOTIFICATION_UUID],
    );

    for (const characteristic of characteristics) {
      if (characteristic.uuid === WRITE_CMD_UUID) {
        this.writeCmdChar = characteristic;
      } else if (characteristic.uuid === WRITE_DATA_UUID) {
        this.writeDataChar = characteristic;
      } else if (characteristic.uuid === NOTIFICATION_UUID) {
        this.notificationChar = characteristic;
      }
    }

    if (!this.writeCmdChar || !this.writeDataChar) {
      throw new Error('Required BLE characteristics are missing');
    }

    if (this.notificationChar) {
      await subscribeCharacteristic(this.notificationChar, (data) => {
        const plaintext = decryptAesEcb(data);
        // ignore for now console.log(`Notification: ${toHex(plaintext)}`);
      });
    }
  }

  async writeEncrypted(packet) {
    await writeCharacteristic(this.writeCmdChar, encryptAesEcb(packet));
  }

  async writeColourData(packet) {
    await writeCharacteristic(this.writeDataChar, packet);
  }

  async switchOn(state) {
    const packet = hexToBuffer('05 54 55 52 4E 01 00 00 00 00 00 00 00 00 00 00');
    packet[5] = state ? 1 : 0;
    await this.writeEncrypted(packet);
  }

  async setColour(r, g, b) {
    const packet = hexToBuffer('0F 53 47 4C 53 00 00 64 50 1F 00 00 1F 00 00 32');
    packet[9] = r;
    packet[12] = r;
    packet[10] = g;
    packet[13] = g;
    packet[11] = b;
    packet[14] = b;
    await this.writeEncrypted(packet);
    await this.writeColourData(COLOUR_DATA);
  }

  async setEffect(effect, reverse = 0, speed = 50, saturation = 50, colourData = COLOUR_DATA) {
    const packet = hexToBuffer('0A 4D 55 4C 54 08 00 64 50 07 32 00 00 00 00 00');
    packet[5] = Math.min(effect, 11);
    packet[6] = reverse;
    packet[8] = speed;
    packet[10] = saturation;
    await this.writeEncrypted(packet);
    await this.writeColourData(colourData);
  }

}

function encryptAesEcb(buffer) {
  const cipher = crypto.createCipheriv('aes-128-ecb', SECRET_ENCRYPTION_KEY, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

function decryptAesEcb(buffer) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', SECRET_ENCRYPTION_KEY, null);
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

async function writeCharacteristic(characteristic, data) {
  await new Promise((resolve, reject) => {
    characteristic.write(data, false, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function subscribeCharacteristic(characteristic, handler) {
  characteristic.on('data', handler);
  await new Promise((resolve, reject) => {
    characteristic.subscribe((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function discoverCharacteristics(peripheral, serviceUUIDs, characteristicUUIDs) {
  const serviceFilter = normalizeUuidList(serviceUUIDs);
  const characteristicFilter = normalizeUuidList(characteristicUUIDs);
  const services = await discoverServicesList(peripheral, serviceFilter);

  if (!services.length) {
    console.warn('No services discovered on peripheral');
    return { services: [], characteristics: [] };
  }

  const discoveredCharacteristics = [];

  for (const service of services) {
    const serviceCharacteristics = await discoverCharacteristicsForService(service, null);
    if (!serviceCharacteristics.length) {
      console.log(`No characteristics exposed for service ${service.uuid}`);
    }
    for (const characteristic of serviceCharacteristics) {
      if (!characteristicFilter || characteristicFilter.has(characteristic.uuid)) {
        discoveredCharacteristics.push(characteristic);
      }
    }
  }

  if (!discoveredCharacteristics.length) {
    console.warn('No matching characteristics found during discovery');
  }

  return { services, characteristics: discoveredCharacteristics };
}

function normalizeUuidList(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return new Set(list.map((uuid) => normalizeUuid(uuid)));
}

async function discoverServicesList(peripheral, serviceFilter) {
  const filter = serviceFilter ? Array.from(serviceFilter) : [];
  return await new Promise((resolve) => {
    let resolved = false;
    const finish = (services) => {
      if (resolved) return;
      resolved = true;
      resolve(services ?? []);
    };
    const timeout = setTimeout(() => {
      console.warn('discoverServices timed out, falling back to discoverAllServicesAndCharacteristics');
      peripheral.discoverAllServicesAndCharacteristics((err, services) => {
        if (err) {
          console.warn('discoverAllServicesAndCharacteristics also failed:', err.message);
          finish([]);
        } else {
          finish(services);
        }
      });
    }, 1000);
    peripheral.discoverServices(filter, (err, services) => {
      clearTimeout(timeout);
      if (err) {
        console.warn('discoverServices error:', err.message);
        finish([]);
      } else {
        finish(services);
      }
    });
  });
}

async function discoverCharacteristicsForService(service, characteristicFilterSet) {
  const filter = characteristicFilterSet ? Array.from(characteristicFilterSet) : [];
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn(`discoverCharacteristics timed out for service ${service.uuid}`);
      resolve([]);
    }, 1000);
    service.discoverCharacteristics(filter, (err, characteristics) => {
      clearTimeout(timeout);
      if (err) {
        reject(err);
      } else {
        resolve(characteristics ?? []);
      }
    });
  });
}

async function connectPeripheral(peripheral) {
  await new Promise((resolve, reject) => {
    peripheral.connect((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function disconnectPeripheral(peripheral) {
  await new Promise((resolve) => {
    peripheral.disconnect(() => resolve());
  });
}

const discoveredPeripherals = new Map();
const identifierIndex = new Map();
let scannerInitialized = false;

const rememberPeripheral = (peripheral) => {
  discoveredPeripherals.set(peripheral.id, peripheral);
  deviceIdentifiers(peripheral).forEach((id) => {
    if (id) {
      identifierIndex.set(id, peripheral);
    }
  });
};

noble.on('discover', rememberPeripheral);

async function ensureContinuousScan() {
  await waitForPoweredOn();
  if (scannerInitialized) {
    return;
  }
  scannerInitialized = true;
  const start = () => {
    noble.startScanning([], true, (err) => {
      if (err) {
        console.warn('noble startScanning error:', err.message);
      }
    });
  };
  start();
  // noble.on('scanStop', () => {
  //   if (noble.state === 'poweredOn') {
  //     setTimeout(start, 200);
  //   }
  // });
}

async function waitForPoweredOn() {
  if (noble.state === 'poweredOn') {
    return;
  }
  await new Promise((resolve, reject) => {
    const handler = (state) => {
      if (state === 'poweredOn') {
        noble.off('stateChange', handler);
        resolve();
      } else if (state === 'unsupported') {
        noble.off('stateChange', handler);
        reject(new Error('BLE adapter unsupported'));
      }
    };
    noble.on('stateChange', handler);
  });
}

function buildColourDataPacket(colourList) {
  let list = colourList.slice(0, 32);
  const data = [list.length * 3, 0];
  for (const [r, g, b] of list) {
    data.push(clamp8(r), clamp8(g), clamp8(b));
  }
  while (data.length < 98) {
    data.push(0);
  }
  return Buffer.from(data);
}

function clamp8(value) {
  return Math.max(0, Math.min(255, value | 0));
}

function normalizeUuid(uuid) {
  return uuid.replace(/-/g, '').toLowerCase();
}

function hexToBuffer(str) {
  return Buffer.from(str.replace(/\s+/g, ''), 'hex');
}

function toHex(buffer) {
  return buffer.toString('hex').match(/.{1,2}/g)?.join(' ') ?? '';
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTargetPeripheral(peripheral) {
  const name = peripheral.advertisement?.localName || '';
  return name.startsWith('ISP-');
}

function peripheralAddress(peripheral) {
  if (peripheral.address && peripheral.address !== 'unknown') {
    return peripheral.address.toLowerCase();
  }
  const identifier = peripheral.id || peripheral.uuid || peripheral.advertisement?.localName;
  return identifier ? identifier.toLowerCase() : '';
}

function deviceIdentifiers(peripheral) {
  const identifiers = new Set();
  const addr = peripheralAddress(peripheral);
  if (addr) identifiers.add(addr);
  const name = peripheral.advertisement?.localName;
  if (name) identifiers.add(name.toLowerCase());
  if (peripheral.id) identifiers.add(peripheral.id.toLowerCase());
  if (peripheral.uuid) identifiers.add(peripheral.uuid.toLowerCase());
  return identifiers;
}

function indexPeripherals(peripherals) {
  const map = new Map();
  peripherals.forEach((peripheral) => {
    deviceIdentifiers(peripheral).forEach((id) => {
      if (id) {
        map.set(id, peripheral);
      }
    });
  });
  return map;
}

async function scanCommand() {
  console.log('Scanning for devices');
  await ensureContinuousScan();
  await delay(2000);
  const seen = new Set();
  const matches = [];
  for (const peripheral of discoveredPeripherals.values()) {
    if (seen.has(peripheral.id)) continue;
    seen.add(peripheral.id);
    if (isTargetPeripheral(peripheral)) {
      matches.push(peripheral);
    }
  }
  if (!matches.length) {
    console.log('No devices found');
    return;
  }
  console.log('The following devices were found:');
  for (const peripheral of matches) {
    const addr = peripheralAddress(peripheral);
    console.log(`\tIdentifier: ${addr || '(unknown)'} | RSSI: ${peripheral.rssi} | Name: ${peripheral.advertisement?.localName || 'N/A'}`);
    const manufacturer = peripheral.advertisement?.manufacturerData;
    if (manufacturer) {
      console.log(`\t\tManufacturer data: ${toHex(manufacturer)}`);
    }
  }
}

async function dumpGattTable(peripheral) {
  const services = await discoverServicesList(peripheral, null);

  if (!services.length) {
    console.log('No services discovered on peripheral');
    return;
  }

  console.log(`Discovered ${services.length} services:`);
  for (const [index, service] of services.entries()) {
    console.log(`[${index}] Service ${service.uuid}`);
    const serviceChars = await discoverCharacteristicsForService(service, null);
    if (!serviceChars.length) {
      console.log('    (no characteristics)');
      continue;
    }
    serviceChars.forEach((characteristic) => {
      const props = Array.isArray(characteristic.properties) && characteristic.properties.length
        ? characteristic.properties.join(', ')
        : 'n/a';
      console.log(`    - Characteristic ${characteristic.uuid} (properties: ${props})`);
    });
  }
}

async function buildDeviceIndex() {
  await ensureContinuousScan();
  const devices = Array.from(discoveredPeripherals.values());
  return { devices, index: new Map(identifierIndex) };
}

async function findDevice(identifier) {
  if (!identifier) return null;
  await ensureContinuousScan();
  return identifierIndex.get(identifier.toLowerCase()) || null;
}

async function dumpCommand(identifier) {
  if (!identifier) {
    console.log('Provide an identifier to dump (e.g. node lights-tools.js dump ISP-114981).');
    return;
  }
  const peripheral = await findDevice(identifier.toLowerCase());
  if (!peripheral) {
    console.log(`Device "${identifier}" not found.`);
    return;
  }
  const label = peripheral.advertisement?.localName || identifier;
  console.log(`Dumping GATT table for ${label}`);
  await withConnection(peripheral, async (device) => {
    await dumpGattTable(device);
  });
}

class ConnectionPool {
  constructor() {
    this.pool = new Map();
  }

  getEntry(identifier) {
    return this.pool.get(identifier.toLowerCase()) || null;
  }

  async connect(identifier, peripheral) {
    const controller = new LightController(peripheral);
    await connectPeripheral(peripheral);
    await delay(3000);
    await controller.init();
    this.pool.set(identifier.toLowerCase(), { controller, peripheral });
    return controller;
  }

  async disconnect(identifier) {
    const entry = this.pool.get(identifier.toLowerCase());
    if (!entry) return;
    await disconnectPeripheral(entry.peripheral).catch(() => undefined);
    this.pool.delete(identifier.toLowerCase());
  }

  async disconnectAll() {
    for (const id of Array.from(this.pool.keys())) {
      await this.disconnect(id);
    }
  }
}

const connectionPool = new ConnectionPool();

async function applyEffectToPeripheral(identifier, peripheral, handler) {
  let entry = connectionPool.getEntry(identifier);
  if (!entry) {
    await connectionPool.connect(identifier, peripheral);
    entry = connectionPool.getEntry(identifier);
  }
  const controller = entry.controller;
  await handler(controller, peripheral);
}

module.exports = {
  LightController,
  buildColourDataPacket,
  clamp8,
  scanCommand,
  dumpCommand,
  buildDeviceIndex,
  findDevice,
  applyEffectToPeripheral,
  connectionPool,
  isTargetPeripheral,
  peripheralAddress,
  deviceIdentifiers,
  indexPeripherals,
  toHex,
};
