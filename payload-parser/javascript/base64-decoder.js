/**
 * This snippet decodes Base64 encoded payloads commonly used by various IoT protocols.
 * Some devices send sensor data encoded in Base64 format which needs to be decoded
 * before parsing the binary data.
 *
 * Testing:
 * You can test this with the Device Emulator using:
 * [{ "variable": "data", "value": "AQlhE5UA359" }]
 */

// Find Base64 encoded payload
const payload_raw = payload.find((x) => x.variable === "data" || x.variable === "payload");

if (payload_raw) {
  try {
    // Decode Base64 data using Buffer
    const buffer = Buffer.from(payload_raw.value, "base64");

    // Example parsing (adjust based on your device's data format)
    // Let's assume:
    // Byte 0: Device ID
    // Bytes 1-2: Temperature (signed, divide by 100)
    // Byte 3: Battery level
    const data = [
      { variable: "device_id", value: buffer.readUInt8(0) },
      { variable: "temperature", value: buffer.readInt16BE(1) / 100, unit: "°C" },
      { variable: "battery", value: buffer.readUInt8(3), unit: "%" },
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
  } catch (e) {
    // Print the error to the Live Inspector
    console.error("Base64 decode error:", e.message);

    // Add error variable for debugging
    payload.push({
      variable: "parse_error",
      value: `Base64 decode failed: ${e.message}`,
      group: String(Date.now()),
    });
  }
}
