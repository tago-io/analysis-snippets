/* This is a generic payload parser that can be used as a starting point for MQTT devices
 ** The code expects to receive hexadecimal string data, not JSON formatted data.
 **
 ** Testing:
 ** You can do manual tests to the parser by using the Device Emulator. Copy and paste the following JSON:
 ** [{ "variable": "payload", "value": "0109611395", "metadata": { "mqtt_topic": "data" } } ]
 */

// Prevent the code from running for other types of data insertions.
// We search for a variable named "payload" or a variable with metadata.mqtt_topic
const mqtt_payload = payload.find(
  (data) => data.variable === "payload" || data.metadata?.mqtt_topic
);
if (mqtt_payload) {
  // Cast the hexadecimal string to a buffer
  const buffer = Buffer.from(mqtt_payload.value, "hex");

  // Normalize the data to TagoIO format
  // We use the Number function to cast number values, so we can use them in chart widgets, etc.
  const data = [
    { variable: "protocol_version", value: buffer.readInt8(0) },
    { variable: "temperature", value: buffer.readInt16BE(1) / 100, unit: "°C" },
    { variable: "humidity", value: buffer.readUInt16BE(3) / 100, unit: "%" },
  ];

  // This will concatenate the content sent by your device with the content generated in this payload parser
  // It also adds the field "group" to be able to group data in tables and other widgets
  const group = String(Date.now());
  payload = payload.concat(data).map((x) => ({ ...x, group }));
}
