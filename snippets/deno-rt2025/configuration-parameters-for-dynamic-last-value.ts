// @title: Dynamic Last Value Configuration
// @description: Configuration parameters for dynamic last value displays
// @tags: configuration, dynamic, last-value, parameters, display

/*
 ** Analysis Example
 ** Configuration parameters for dynamic last value
 **
 ** Set the configurations parameters with the last value of a given variable,
 ** in this example it is the "temperature" variable
 **
 ** How to use:
 ** To analysis works, you need to add a new policy in your account. Steps to add a new policy:
 **  1 - Click the button "Add Policy" at this url: https://admin.tago.io/am;
 **  2 - In the Target selector, select the Analysis with the field set as "ID" and choose your Analysis in the list;
 **  3 - Click the "Click to add a new permission" element and select "Device" with the rule "Access" with the field as "Any";
 **  4 - To save your new Policy, click the save button in the bottom right corner;
 */

import type { ConfigurationParams, Data, TagoContext } from "npm:@tago-io/sdk";
import { Analysis, Resources } from "npm:@tago-io/sdk";

// set the timezone to show up on dashboard. TagoIO may handle ISOString automatically in a future update.
let timezone = "America/New_York";

const getParam = (params: ConfigurationParams[], key: string): ConfigurationParams =>
  params.find((x) => x.key === key) || { key, value: "-", sent: false };

async function applyDeviceCalculation({
  id: deviceID,
  name,
}: {
  id: string;
  name: string;
}): Promise<void> {
  const deviceInfoText = `${name}(${deviceID})`;
  console.info(`Processing Device ${deviceInfoText}`);

  // Get the temperature variable inside the device bucket.
  // notice it will get the last record at the time the analysis is running.
  const dataResult = await Resources.devices.getDeviceData(deviceID, {
    variables: ["temperature"],
    query: "last_value",
  });
  if (!dataResult.length) {
    console.error(`No data found for ${deviceInfoText}`);
    return;
  }

  // Get configuration params list of the device
  const deviceParams = await Resources.devices.paramList(deviceID);

  // get the variable temperature from our dataResult array
  const temperature = dataResult.find((data) => data.variable === "temperature");
  if (temperature) {
    // get the config. parameter with key temperature
    const temperatureParam = getParam(deviceParams, "temperature");
    // get the config. parameter with key last_record_time
    const lastRecordParam = getParam(deviceParams, "last_record_time");

    // Format time using built-in Date methods instead of moment
    const timeString = new Date(temperature.time as unknown as string).toLocaleString("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // creates or edit the tempreature Param with the value of temperature.
    // creates or edit the last_record_time Param with the time of temperature.
    // Make sure to cast the value to STRING, otherwise you'll get an error.
    await Resources.devices.paramSet(deviceID, [
      { ...temperatureParam, value: String(temperature.value) },
      { ...lastRecordParam, value: timeString },
    ]);
  }
}

// Simple queue implementation to process devices with concurrency control
async function processDevicesWithQueue(
  devices: { id: string; name: string }[],
  concurrency: number = 5
): Promise<void> {
  const results: Promise<void>[] = [];
  let index = 0;

  async function processNext(): Promise<void> {
    if (index >= devices.length) return;

    const currentIndex = index++;
    const device = devices[currentIndex];

    await applyDeviceCalculation(device);

    // Process next device
    return processNext();
  }

  // Start initial batch of concurrent operations
  for (let i = 0; i < Math.min(concurrency, devices.length); i++) {
    results.push(processNext());
  }

  // Wait for all operations to complete
  await Promise.all(results);
}

// scope is not used for Schedule action.
async function startAnalysis(_context: TagoContext, _scope: Data[]): Promise<void> {
  // get timezone from the account
  const accountInfo = await Resources.account.info();
  if (accountInfo.timezone) {
    timezone = accountInfo.timezone;
  }

  // fetch device list filtered by tags.
  // Device list always return an Array with DeviceInfo object.
  const deviceList = await Resources.devices.list({
    amount: 500,
    fields: ["id", "name", "tags"],
    filter: {
      tags: [{ key: "type", value: "sensor" }],
    },
  });

  // Process devices with concurrency control (5 devices simultaneously)
  await processDevicesWithQueue(deviceList, 5);

  console.log("Finished processing all devices");
}

Analysis.use(startAnalysis);
