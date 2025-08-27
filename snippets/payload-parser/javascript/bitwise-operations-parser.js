// @title: Bitwise Operations Parser
// @description: Parse binary data using bitwise operations for compact sensor protocols
// @tags: bitwise, binary, compact, sensor, basic

/**
 * This snippet demonstrates parsing compact binary protocols where multiple
 * sensor values are packed into bytes using bitwise operations.
 *
 * Example format (5 bytes):
 * - Byte 0: Device ID
 * - Byte 1: Status flags (8 bits)
 * - Bytes 2-3: Temperature (16 bits)
 * - Byte 4: Battery level
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "data", "value": "FF8A5C7F80" }]
 */

// Find hexadecimal payload
const payload_raw = payload.find((x) => x.variable === "data" || x.variable === "payload");

if (payload_raw) {
  try {
    // Convert hex to buffer
    const buffer = Buffer.from(payload_raw.value, "hex");

    if (buffer.length >= 5) {
      // Parse device ID (byte 0)
      const deviceId = buffer.readUInt8(0);

      // Parse status flags (byte 1) - extract individual bits
      const statusByte = buffer.readUInt8(1);
      const alarmActive = (statusByte & 0x80) !== 0; // bit 7
      const lowBattery = (statusByte & 0x40) !== 0; // bit 6
      const motionDetected = (statusByte & 0x20) !== 0; // bit 5

      // Parse temperature (bytes 2-3, signed 16-bit)
      const temperatureRaw = buffer.readInt16BE(2);
      const temperature = temperatureRaw / 100.0; // Scale factor

      // Parse battery level (byte 4)
      const batteryLevel = buffer.readUInt8(4);

      // Build the parsed data
      const data = [
        { variable: "device_id", value: deviceId },
        { variable: "temperature", value: temperature, unit: "°C" },
        { variable: "battery", value: batteryLevel, unit: "%" },
        { variable: "alarm", value: alarmActive ? 1 : 0 },
        { variable: "low_battery_flag", value: lowBattery ? 1 : 0 },
        { variable: "motion", value: motionDetected ? 1 : 0 },
      ];

      // Add to payload with group and time
      const group = payload_raw.group || String(Date.now());
      const time = payload_raw.time;

      const newData = data.map((item) => ({
        ...item,
        group,
        ...(time && { time }),
      }));

      payload = payload.concat(newData);
    } else {
      console.log(`Invalid payload length: expected 5 bytes, got ${buffer.length}`);
    }
  } catch (e) {
    console.error("Bitwise parsing error:", e.message);

    payload.push({
      variable: "parse_error",
      value: `Parsing failed: ${e.message}`,
      group: String(Date.now()),
    });
  }
}
