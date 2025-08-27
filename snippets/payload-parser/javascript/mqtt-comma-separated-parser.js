// @title: MQTT Comma-Separated Values Parser
// @description: Enhanced parser for MQTT devices sending comma-separated data
// @tags: mqtt, csv, comma-separated, parser, basic

/**
 * This parser handles MQTT devices sending comma-separated data.
 * It supports both key-value pairs and positional data formats.
 *
 * Supported formats:
 * - "temp,12,hum,50" (alternating key-value)
 * - "25.5,60,85" (positional values)
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "payload", "value": "temp,12,hum,50", "metadata": { "mqtt_topic": "sensors/data" } }]
 */

// Find MQTT payload data
const mqttPayload = payload.find(
  (data) => data.variable === "payload" || data.metadata?.mqtt_topic
);

if (mqttPayload?.value) {
  try {
    const dataString = String(mqttPayload.value);
    const parts = dataString.split(",");
    const parsedData = [];

    // Check if it's alternating key-value format (even number of parts)
    if (parts.length % 2 === 0) {
      // Parse "key,value,key,value" format
      for (let i = 0; i < parts.length - 1; i += 2) {
        const variable = parts[i].trim();
        const value = Number(parts[i + 1].trim());

        // Add unit based on variable name
        let unit = null;
        if (variable.toLowerCase().includes("temp")) unit = "°C";
        else if (variable.toLowerCase().includes("hum")) unit = "%";
        else if (variable.toLowerCase().includes("batt")) unit = "%";

        parsedData.push({
          variable,
          value: Number.isNaN(value) ? parts[i + 1].trim() : value,
          ...(unit && { unit }),
        });
      }
    } else {
      // Positional format - assume common sensor order
      const mapping = ["temperature", "humidity", "battery"];

      for (let i = 0; i < parts.length; i++) {
        const value = Number(parts[i].trim());
        const variable = mapping[i] || `sensor_${i + 1}`;

        parsedData.push({
          variable,
          value: Number.isNaN(value) ? parts[i].trim() : value,
          unit: i === 0 ? "°C" : i === 1 ? "%" : null,
        });
      }
    }

    // Add group and time information
    const group = mqttPayload.group || String(Date.now());
    const time = mqttPayload.time;

    const newData = parsedData.map((item) => ({
      ...item,
      group,
      ...(time && { time }),
    }));

    // Add to payload
    payload = payload.concat(newData);

    console.log(`Parsed ${parsedData.length} values from MQTT data`);
  } catch (error) {
    console.error("MQTT parsing error:", error.message);

    payload.push({
      variable: "parse_error",
      value: `MQTT parsing failed: ${error.message}`,
      group: mqttPayload.group || String(Date.now()),
    });
  }
}
