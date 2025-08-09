// @title: Device Data Amount Report
// @description: Get top 20 devices with highest data amount usage
// @tags: data, amount, report, usage, analytics

/**
 * TagoIO - Analysis Example
 * Device Data Amount Analysis
 *
 * This analysis retrieves the amount of data for each device and logs into the console
 * the top 20 devices with the highest data amount.
 *
 * Requirements:
 * - Access Policy must have permission to list devices (Device -> Access)
 * - Access Policy must have permission to get device data (Device -> Get Data)
 *
 * Check out the SDK documentation on: https://js.sdk.tago.io
 * Create Access Policy at https://admin.tago.io/am
 *
 */

import { Analysis, Resources } from "jsr:@tago-io/sdk";
import type { AnalysisConstructorParams, Data, TagoIODevice } from "jsr:@tago-io/sdk";

interface DeviceAmountResult {
  name: string;
  id: string;
  amount: number;
}

/**
 * This is the main function that will be called when the analysis is executed
 */
async function myAnalysis(context: AnalysisConstructorParams, scope: Data[]): Promise<void> {
  const resultList: DeviceAmountResult[] = [];

  const getDeviceAmount = async (deviceObj: TagoIODevice): Promise<void> => {
    const result = await Resources.devices.amount(deviceObj.id).catch(console.log);
    if (!result) {
      // 0 data or error
      return;
    }

    // Any code that you want to run for each device before pushing to the resultList
    // Example to not include devices with less than 40,000 data points
    // if (result < 40000) {
    //   return;
    // }

    resultList.push({ name: deviceObj.name, id: deviceObj.id, amount: result });
    await new Promise((resolve) => setTimeout(resolve, 200)); // sleep
  };

  const filter = {
    // type: "mutable"
    // type: "immutable"
    // tags: [{ key: "my_tag_key", value: "my_tag_value" }]
  };

  // Process devices with concurrency control
  const deviceList = Resources.devices.listStreaming({ filter });
  const devicePromises: Promise<void>[] = [];
  let activePromises = 0;
  const maxConcurrency = 5;

  for await (const device of deviceList) {
    if (activePromises >= maxConcurrency) {
      await Promise.race(devicePromises);
    }

    const promise = getDeviceAmount(device).finally(() => {
      activePromises--;
    });

    devicePromises.push(promise);
    activePromises++;
  }

  // Wait for all devices to be processed
  await Promise.allSettled(devicePromises);

  if (resultList.length === 0) {
    console.error("No devices found to process");
    return;
  }

  // Reorder resultList by the highest data amount
  resultList.sort((a, b) => b.amount - a.amount);

  // Log the top 20 devices
  for (const result of resultList.slice(0, 20)) {
    console.log(JSON.stringify(result));
  }
}

Analysis.use(myAnalysis);
