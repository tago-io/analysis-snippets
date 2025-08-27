/* This is a generic payload parser that can be used as a starting point for Sigfox devices.
 ** The code finds the "data" variable sent by your sensor and parses it if it exists.
 ** The content of the value from the "data" variable is always a hexadecimal value.
 **
 ** Testing:
 ** You can do manual tests of the parser by using the Device Emulator. Copy and paste the following JSON:
 ** [{ "variable": "data", "value": "0109611395000DF9011EB9" }]
 */

// Search for the payload variable in the global payload variable. Its contents are always [{ variable, value...}, {variable, value...} ...]
const payload_raw = payload.find((x) => x.variable === "data");

// Check if payload_raw exists
if (payload_raw) {
  try {
    // Convert the data from hexadecimal to JavaScript Buffer
    const buffer = Buffer.from(payload_raw.value, "hex");

    // Let's say you have a payload of 11 bytes:
    // 0 - Counter (1 byte, 0 - 255)
    // 1,2 - Temperature (multiplied by 100, unit = Celsius)
    // 3,4 - Humidity (multiplied by 100, unit = Percent)
    // 5 - Latitude indicator: 00 = positive | 01 = negative
    // 6,7 - (Latitude value * 10000) / 1000000
    // 8 - Longitude indicator: 00 = positive | 01 = negative
    // 9,10 - (Longitude value * 10000) / 1000000
    // More information about buffers can be found here: https://nodejs.org/api/buffer.html

    // Latitude indicator
    const lat_indicator = buffer.readInt8(5);
    // Longitude indicator
    const lng_indicator = buffer.readInt8(8);

    // Latitude value
    let lat = (buffer.readUInt16BE(6) * 10022) / 1000000;

    // Apply indicator rule: if 0, it's positive; if 1, it's negative
    lat = lat_indicator === 0 ? lat : -lat;

    // Longitude value
    let lng = (buffer.readUInt16BE(9) * 10022) / 1000000;

    // Apply indicator rule: if 0, it's positive; if 1, it's negative
    lng = lng_indicator === 0 ? lng : -lng;

    const data = [
      { variable: "counter", value: buffer.readInt8(0) },
      { variable: "temperature", value: buffer.readInt16BE(1) / 100, unit: "°C" },
      { variable: "humidity", value: buffer.readUInt16BE(3) / 100, unit: "%" },
      { variable: "location", value: `${lat}, ${lng}`, location: { lat, lng } },
    ];

    // This will concatenate the content sent by your device with the content generated in this payload parser.
    // It also adds the "group" and "time" fields to it, copying from your sensor data.
    payload = payload.concat(
      data.map((x) => ({
        ...x,
        group: payload_raw.serie || payload_raw.group,
        time: payload_raw.time,
      }))
    );
  } catch (e) {
    // Print the error to the Live Inspector.
    console.error(e);

    // Return the variable parse_error for debugging.
    payload = [{ variable: "parse_error", value: e.message }];
  }
}
