// @title: Data Retention Management
// @description: Implement custom data retention policies for device data
// @tags: data, retention, cleanup, management, storage

/*
 * Analysis Example
 * Custom Data Retention
 *
 * Get the list of devices, then go to each device removing the variables you chooses.
 *
 ** How to use:
 ** To analysis works, you need to add a new policy in your account. Steps to add a new policy:
 **  1 - Click the button "Add Policy" at this url: https://admin.tago.io/am;
 **  2 - In the Target selector, select the Analysis with the field set as "ID" and choose your Analysis in the list;
 **  3 - Click the "Click to add a new permission" element and select "Device" with the rule "Access" with the field as "Any";
 **  4 - To save your new Policy, click the save button in the bottom right corner;
 */

import { Analysis, Resources } from "jsr:@tago-io/sdk";
import dayjs from "npm:dayjs";

// The function startAnalysis will run when you execute your analysis
async function startAnalysis(context: any): Promise<void> {
  // Bellow is an empty filter.
  // Examples of filter:
  // { tags: [{ key: 'tag-key', value: 'tag-value' }]}
  // { name: 'name*' }
  // { name: '*name' }
  // { bucket: 'bucket-id' }
  const filter = {};

  const deviceQuery: any = {
    page: 1,
    fields: ["id"],
    filter,
    amount: 100,
  };

  const devices = await Resources.devices.list(deviceQuery);

  for (const deviceObj of devices) {
    const variables = ["variable1", "variable2"];
    const qty = 100; // remove 100 registers of each variable
    const end_date = dayjs().subtract(1, "month").toISOString(); // registers old than 1 month

    const removeOptions: any = { variables, qty, end_date };

    await Resources.devices
      .deleteDeviceData(deviceObj.id!, removeOptions)
      .then((result) => context.log(result))
      .catch((error) => context.log(error));
  }
}

Analysis.use(startAnalysis);

// To run analysis on your machine (external)
// Analysis.use(myAnalysis, { token: "YOUR-TOKEN" });
