// @title: Timezone Data Processor
// @description: Convert timestamps between timezones using dayjs and timeUtils
// @tags: timezone, dayjs, timestamp, conversion, basic

/**
 * This snippet demonstrates timezone conversion using TagoIO's timeUtils and dayjs.
 * It converts timestamps to different timezones and formats them.
 *
 * Testing:
 * You can test with the Device Emulator using:
 * [{ "variable": "timestamp", "value": "2023-06-15T14:30:00.000Z" }]
 */

// Find timestamp data in payload
const timestampItem = payload.find(
  (item) =>
    item.variable?.toLowerCase().includes("timestamp") ||
    item.variable?.toLowerCase().includes("time")
);

if (timestampItem?.value) {
  try {
    const originalTime = timestampItem.value;
    const group = timestampItem.group || String(Date.now());

    // Use dayjs for basic formatting
    const dayjsTime = dayjs(originalTime);

    // Add formatted timestamp using dayjs
    payload.push({
      variable: "formatted_time",
      value: dayjsTime.format("YYYY-MM-DD HH:mm:ss"),
      group,
    });

    // Use timeUtils for timezone conversion (if available)
    if (typeof timeUtils !== "undefined") {
      try {
        // Convert to New York timezone
        const nyTime = timeUtils.formatInTimezone(
          originalTime,
          "America/New_York",
          "%Y-%m-%d %H:%M:%S %z"
        );
        payload.push({
          variable: "time_ny",
          value: nyTime,
          group,
        });

        // Convert to Tokyo timezone
        const tokyoTime = timeUtils.formatInTimezone(
          originalTime,
          "Asia/Tokyo",
          "%Y-%m-%d %H:%M:%S %z"
        );
        payload.push({
          variable: "time_tokyo",
          value: tokyoTime,
          group,
        });
      } catch (conversionError) {
        console.log("Timezone conversion error:", conversionError.message);
      }
    }

    console.log(`Processed timestamp: ${originalTime}`);
  } catch (error) {
    console.error("Timestamp processing error:", error.message);

    payload.push({
      variable: "timestamp_error",
      value: `Processing failed: ${error.message}`,
      group: String(Date.now()),
    });
  }
}
