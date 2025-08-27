/* This is a generic payload parser for LoRaWAN. It will work for any network server.
 ** The code finds the "payload" variable sent by your sensor and parses it if it exists.
 ** The content of the payload variable is always a hexadecimal value.
 **
 ** Note: Additional variables can be created by the Network Server and sent directly to the bucket. Normally they aren't handled here.
 **
 ** Testing:
 ** You can do manual tests to the parser by using the Device Emulator. Copy and paste the following JSON:
 ** [{ "variable": "data", "value": "0109611395" }]
 */

// Search for the payload variable in the payload global variable. Its contents are always [{ variable, value...}, {variable, value...} ...]
const payload_raw = payload.find(
  (x) => x.variable === "payload_raw" || x.variable === "payload" || x.variable === "data"
);
if (payload_raw) {
  try {
    // Convert the data from hexadecimal to JavaScript Buffer
    const buffer = Buffer.from(payload_raw.value, "hex");

    // Let's say you have a payload of 5 bytes:
    // 0 - Protocol Version
    // 1,2 - Temperature
    // 3,4 - Humidity
    // More information about buffers can be found here: https://nodejs.org/api/buffer.html
    const data = [
      { variable: "protocol_version", value: buffer.readInt8(0) },
      {
        variable: "temperature",
        value: buffer.readInt16BE(1) / 100,
        unit: "°C",
      },
      { variable: "humidity", value: buffer.readUInt16BE(3) / 100, unit: "%" },
    ];

    // This will concatenate the content sent by your device with the content generated in this payload parser.
    // It also adds the "group" and "time" fields to it, copying from your sensor data.
    payload = payload.concat(
      data.map((x) => ({
        ...x,
        group: String(payload_raw.serie || payload_raw.group),
        time: String(payload_raw.time),
      }))
    );
  } catch (e) {
    // Print the error to the Live Inspector.
    console.error(e);

    // Return the variable parse_error for debugging.
    payload = [{ variable: "parse_error", value: e.message }];
  }
}
