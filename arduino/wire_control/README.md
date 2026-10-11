# Wire control: Uno and Mega

Run builds from the project directory (requires Arduino CLI and the `arduino:avr` core).
Set the address and pin list through `compiler.cpp.extra_flags`:

```sh
# Uno with default pins and address 11
arduino-cli compile --fqbn arduino:avr:uno arduino/wire_control

# Mega 2560 with default pins and address 33
arduino-cli compile --fqbn arduino:avr:mega:cpu=atmega2560 \
  --build-property 'compiler.cpp.extra_flags=-DI2C_SLAVE_ADDRESS=33' \
  arduino/wire_control

# Custom pin list; analog pins are also supported
arduino-cli compile --fqbn arduino:avr:uno \
  --build-property 'compiler.cpp.extra_flags=-DI2C_SLAVE_ADDRESS=12 -DWIRE_CONTROL_PINS=2,3,4,5,A0,A1' \
  arduino/wire_control
```

Without flags, the address defaults to 11. Default pins: Uno D2–D13 and A0–A3
(16 channels), Mega D22–D53 (32 channels). These defaults leave the Serial and
I2C pins available. Custom lists must contain valid, unique output pins and
exclude the Serial and I2C pins (Uno: D0/D1 and A4/A5; Mega: D0/D1 and D20/D21).
The pin list may contain 1–32 entries; the address must be between 0x08 and
0x77. Every second channel starts switched on: indices 1, 3, 5, etc.
Indices 0, 2, 4, etc. start switched off. This pattern follows the pin list
order, including when a custom pin list is used.

`item1` and `item2` in the existing four-byte protocol are **indices into the
pin list**, not physical pin numbers. In the last example, channel 0 controls
D2 and channel 4 controls A0. Invalid indices (e.g. 99 for an unused second
channel) are ignored. Incomplete messages are discarded.
A status request returns exactly one byte per configured channel; the master
must request 16, 32, or the length of the custom pin list, as appropriate.

## Default channel mappings

The interface uses zero-based indices. These tables show the first and last
few channels for the default pin lists; custom lists change the mapping.

### Uno (16 channels)

| Interface index (`item1` / `item2`) | Physical pin |
|---|---|
| 0 | D2 |
| 1 | D3 |
| 2 | D4 |
| … | … |
| 11 | D13 |
| 12 | A0 |
| 13 | A1 |
| 14 | A2 |
| 15 | A3 |

### Mega 2560 (32 channels)

| Interface index (`item1` / `item2`) | Physical pin |
|---|---|
| 0 | D22 |
| 1 | D23 |
| 2 | D24 |
| … | … |
| 29 | D51 |
| 30 | D52 |
| 31 | D53 |

Arduino CLI reference: https://docs.arduino.cc/arduino-cli/commands-reference/arduino-cli_compile

## Node item configuration

`config.json` maps used items to indices in the Arduino's existing pin list:

```json
"wireBoards": {
  "lights": {
    "address": 11,
    "channelCount": 16,
    "items": {
      "HOUSE": { "index": 0, "mode": 5 },
      "SIGNAL3": { "index": 8, "mode": 7, "pairedItem": "SIGNAL3R" },
      "SIGNAL3R": { "index": 9, "mode": 7 }
    }
  }
}
```

Only used items need entries; indices can have gaps. With the default Uno
firmware, index 0 is D2, index 8 is D10, and index 9 is D11. Each board's
`address` and `channelCount` must match its firmware (16 for the default Uno,
32 for the default Mega). Add further boards under different names with unique
addresses. Node reads all configured boards and publishes only configured items.

`mode` selects the toggle action: 0 = off, 1 = on, 5 = flicker toggle,
6 = blink toggle, 7 = toggle. Optional `pairedItem` selects a second output on
the same board; on/off commands switch the two outputs in opposite directions.
Each item name must be unique across boards, and each index unique within its
board. 
