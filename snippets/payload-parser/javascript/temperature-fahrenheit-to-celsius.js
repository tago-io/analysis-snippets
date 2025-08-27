// @title: Temperature Fahrenheit to Celsius Converter
// @description: Converts temperature values from Fahrenheit to Celsius with validation
// @tags: temperature, conversion, fahrenheit, celsius, basic

/**
 * This snippet converts temperature values from Fahrenheit to Celsius.
 * It includes basic validation and supports multiple temperature variables.
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "temperature", "value": 68 }]
 */

// Find temperature variables in the payload
const temperatureItems = payload.filter(
  (item) => item.variable?.toLowerCase().includes("temp") && typeof item.value === "number"
);

for (const item of temperatureItems) {
  // Validate temperature range (reasonable Fahrenheit values)
  if (item.value >= -40 && item.value <= 140) {
    // Convert from Fahrenheit to Celsius
    const celsius = ((item.value - 32) * 5) / 9;

    // Update the item
    item.value = Math.round(celsius * 100) / 100; // Round to 2 decimal places
    item.unit = "°C";

    console.log(`Converted ${item.variable}: ${item.value}°C`);
  } else {
    // Add error for invalid temperatures
    payload.push({
      variable: `${item.variable}_error`,
      value: "invalid_temperature_range",
      metadata: { original_value: item.value },
      group: item.group || String(Date.now()),
    });
  }
}
