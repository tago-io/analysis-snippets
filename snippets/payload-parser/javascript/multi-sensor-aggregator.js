// @title: Multi-Sensor Data Aggregator
// @description: Aggregates data from multiple sensors and calculates simple derived metrics
// @tags: aggregation, multi-sensor, calculations, basic

/**
 * This snippet demonstrates basic sensor data aggregation and calculations.
 * It calculates a simple heat index and comfort score from temperature and humidity.
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [
 *   { "variable": "temperature", "value": 25.5 },
 *   { "variable": "humidity", "value": 60 }
 * ]
 */

// Find sensor values from payload
let temperature = null;
let humidity = null;

for (const item of payload) {
  if (item.variable === "temperature" && typeof item.value === "number") {
    temperature = item.value;
  } else if (item.variable === "humidity" && typeof item.value === "number") {
    humidity = item.value;
  }
}

// Calculate derived metrics if we have both temperature and humidity
if (temperature !== null && humidity !== null) {
  const group = String(Date.now());

  // Simple heat index calculation (for temperatures above 20°C)
  let heatIndex = temperature;
  if (temperature > 20) {
    heatIndex = temperature + (humidity / 100) * 2; // Simplified formula
  }

  // Comfort score (0-100, higher is better)
  let comfortScore = 50; // Base score

  // Temperature comfort (20-25°C is optimal)
  if (temperature >= 20 && temperature <= 25) {
    comfortScore += 30;
  } else if (temperature >= 18 && temperature <= 28) {
    comfortScore += 15;
  }

  // Humidity comfort (40-60% is optimal)
  if (humidity >= 40 && humidity <= 60) {
    comfortScore += 20;
  } else if (humidity >= 30 && humidity <= 70) {
    comfortScore += 10;
  }

  // Add calculated values to payload
  payload.push(
    {
      variable: "heat_index",
      value: Math.round(heatIndex * 10) / 10,
      unit: "°C",
      group,
    },
    {
      variable: "comfort_score",
      value: Math.min(100, comfortScore),
      unit: "points",
      group,
    }
  );

  console.log(`Calculated heat index: ${heatIndex}°C, comfort score: ${comfortScore}`);
}
