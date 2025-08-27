// @title: Data Validation and Error Handling
// @description: Validates sensor data ranges and handles invalid values
// @tags: validation, error-handling, sensor, utility, basic

/**
 * This snippet validates sensor data against expected ranges.
 * Invalid data is flagged with error messages.
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "temperature", "value": -50 }, { "variable": "humidity", "value": 150 }]
 */

// Define valid ranges for common sensors
const SENSOR_RANGES = {
  temperature: { min: -40, max: 85, unit: "°C" },
  humidity: { min: 0, max: 100, unit: "%" },
  battery: { min: 0, max: 100, unit: "%" },
  pressure: { min: 300, max: 1100, unit: "hPa" },
};

// Validate each item in the payload
for (const item of payload) {
  if (item.variable && typeof item.value === "number") {
    const range = SENSOR_RANGES[item.variable];

    if (range) {
      // Check if value is within valid range
      if (item.value < range.min || item.value > range.max) {
        // Add error for out-of-range values
        payload.push({
          variable: `${item.variable}_error`,
          value: `Value ${item.value} outside range ${range.min}-${range.max}`,
          group: item.group || String(Date.now()),
        });

        console.log(
          `Validation error: ${item.variable} = ${item.value} (expected: ${range.min}-${range.max})`
        );
      } else {
        // Add unit if not present
        if (!item.unit) {
          item.unit = range.unit;
        }
      }
    }
  }
}
