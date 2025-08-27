/**
 * This snippet filters data based on time of day.
 * Useful for ignoring data during maintenance hours or specific time periods.
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "humidity", "value": 65, "time": "2023-06-15T08:00:00Z" }]
 */

// Configuration
const MAINTENANCE_START_HOUR = 7; // 7 AM
const MAINTENANCE_END_HOUR = 9; // 9 AM

// Find the variable we want to filter
const sensorItem = payload.find((item) => item.variable === "humidity");

if (sensorItem?.time) {
  const itemTime = dayjs(sensorItem.time);
  const hour = itemTime.hour();

  // Filter out data during maintenance hours
  if (hour >= MAINTENANCE_START_HOUR && hour <= MAINTENANCE_END_HOUR) {
    console.log(`Filtering data at hour ${hour} - maintenance time`);

    // Add a filtered notification
    payload.push({
      variable: "filtered_data",
      value: `${sensorItem.variable} filtered during maintenance`,
      group: String(Date.now()),
    });

    // Remove the original item
    const index = payload.indexOf(sensorItem);
    payload.splice(index, 1);
  }
}
