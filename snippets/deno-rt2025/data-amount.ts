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
import type { TagoContext, Data, DeviceListItem } from "jsr:@tago-io/sdk";

// Simple async queue implementation to replace the async library
class AsyncQueue {
  private tasks: (() => Promise<void>)[] = [];
  private running: Promise<void>[] = [];
  private concurrency: number;
  private errorCallback?: (error: Error) => void;

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  push(task: () => Promise<void>): void {
    this.tasks.push(task);
    this.process();
  }

  private process(): void {
    while (this.tasks.length > 0 && this.running.length < this.concurrency) {
      const task = this.tasks.shift();
      if (task) {
        const promise = task().catch((error) => {
          if (this.errorCallback) {
            this.errorCallback(error as Error);
          }
        }).finally(() => {
          const index = this.running.indexOf(promise);
          if (index > -1) {
            this.running.splice(index, 1);
          }
        });
        this.running.push(promise);
      }
    }
  }

  error(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  idle(): boolean {
    return this.tasks.length === 0 && this.running.length === 0;
  }

  length(): number {
    return this.tasks.length;
  }

  async drain(): Promise<void> {
    while (!this.idle()) {
      await Promise.all(this.running);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to allow new tasks
    }
  }
}

/**
 * This is the main function that will be called when the analysis is executed
 */
async function myAnalysis(_context: TagoContext, _scope: Data[]): Promise<void> {
  const resultList: { name: string; id: string; amount: number }[] = [];

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
  const amountQueue = new AsyncQueue(5);
  amountQueue.error((error) => console.log(error));

  const deviceList = Resources.devices.listStreaming({ filter });
  for await (const devices of deviceList) {
    for (const device of devices) {
      amountQueue.push(() => getDeviceAmount(device as DeviceListItem));
    }
  }

  // stop if queue is empty (fix: should be resultList.length not resultList.length())
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
