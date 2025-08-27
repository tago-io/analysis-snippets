/**
 * This snippet parses string-based payloads with various delimiters.
 * Common formats include:
 * - "temp:25.5;humidity:60;battery:80"
 * - "temp=25.5&humidity=60&battery=80"
 * - "25.5|60|80" (positional values)
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "payload", "value": "temp:25.5;humidity:60;battery:80" }]
 */

// Configuration: adjust these settings based on your device's format
const PAIR_DELIMITER = ";"; // Separator between key-value pairs
const KEY_VALUE_DELIMITER = ":"; // Separator between key and value
const POSITIONAL_DELIMITER = "|"; // Delimiter for positional data

// Mapping for positional data (when no keys are provided)
const POSITIONAL_MAPPING = [
  { variable: "temperature", unit: "°C" },
  { variable: "humidity", unit: "%" },
  { variable: "battery", unit: "%" },
  { variable: "signal", unit: "dBm" },
];

// Helper function to trim whitespace
function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

// Helper function to convert a value to number if possible
function parseValue(value) {
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
}

// Find string payload in the data
const payload_raw = payload.find(
  (x) => x.variable === "payload" || x.variable === "data" || x.variable === "message"
);

if (payload_raw && typeof payload_raw.value === "string") {
  const data = [];
  const payloadValue = payload_raw.value;

  // Check if it's key-value pairs format
  if (payloadValue.includes(KEY_VALUE_DELIMITER)) {
    // Parse key-value pairs
    const pairs = payloadValue.split(PAIR_DELIMITER);

    for (const pair of pairs) {
      const parts = pair.split(KEY_VALUE_DELIMITER);
      if (parts.length >= 2) {
        const key = trim(parts[0]);
        const value = trim(parts.slice(1).join(KEY_VALUE_DELIMITER)); // Handle values with delimiters

        // Determine unit based on variable name
        let unit = null;
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes("temp")) {
          unit = "°C";
        } else if (lowerKey.includes("humid")) {
          unit = "%";
        } else if (lowerKey.includes("batt")) {
          unit = "%";
        } else if (lowerKey.includes("signal") || lowerKey.includes("rssi")) {
          unit = "dBm";
        }

        data.push({
          variable: key,
          value: parseValue(value),
          ...(unit && { unit }),
        });
      }
    }

    // Check if it's positional format
  } else if (payloadValue.includes(POSITIONAL_DELIMITER)) {
    const values = payloadValue.split(POSITIONAL_DELIMITER);

    values.forEach((value, index) => {
      const trimmedValue = trim(value);
      const mapping = POSITIONAL_MAPPING[index];

      if (mapping) {
        data.push({
          variable: mapping.variable,
          value: parseValue(trimmedValue),
          unit: mapping.unit,
        });
      } else {
        // Fallback for unmapped positions
        data.push({
          variable: `sensor_${index + 1}`,
          value: parseValue(trimmedValue),
        });
      }
    });

    // Single value format
  } else {
    // Assume it's a single temperature value
    data.push({
      variable: "temperature",
      value: parseValue(payloadValue),
      unit: "°C",
    });
  }

  // Add to payload with group and time
  const group = payload_raw.group || String(Date.now());
  const time = payload_raw.time;

  const newData = data.map((item) => ({
    ...item,
    group,
    ...(time && { time }),
  }));

  payload = payload.concat(newData);
}
