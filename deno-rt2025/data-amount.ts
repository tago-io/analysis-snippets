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

import type { Data, DeviceListItem, TagoContext } from "npm:@tago-io/sdk";
import { Analysis, Resources } from "npm:@tago-io/sdk";
import { queue } from "npm:async";

interface DeviceResult {
  name: string;
  id: string;
  amount: number;
}

/**
 * This is the main function that will be called when the analysis is executed
 */
async function myAnalysis(_context: TagoContext, _scope: Data[]): Promise<void> {
  const resultList: DeviceResult[] = [];

  const getDeviceAmount = async (deviceObj: DeviceListItem): Promise<void> => {
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

  // Create a queue to limit the amount of devices being processed at the same time
  const amountQueue = queue(getDeviceAmount, 5);
  amountQueue.error((error: unknown) => console.log(error));

  const deviceList = Resources.devices.listStreaming({ filter });
  for await (const device of deviceList) {
    void amountQueue.push(device);
  }

  // stop if queue is empty
  if (amountQueue.idle() && resultList.length === 0) {
    console.error("No devices found to process");
    return;
  }

  // periodically console the amount of devices still in the queue
  const queueMonitor = setInterval(() => {
    console.log(`Devices in queue: ${amountQueue.length()}`);
  }, 10000);

  // wait for all devices to be processed
  await amountQueue.drain();

  // Clear the monitoring interval
  clearInterval(queueMonitor);

  // Reorder resultList by the highest data amount
  resultList.sort((a, b) => b.amount - a.amount);

  // Log the top 20 devices
  for (const result of resultList) {
    console.log(JSON.stringify(result));
  }
}

Analysis.use(myAnalysis);
