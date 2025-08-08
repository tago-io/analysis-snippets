// @title: Create Device from Dashboard
// @description: Create new devices dynamically using dashboard interface
// @tags: device, create, dashboard, dynamic, management

/*
 * Example: Creating Devices via Dashboard
 * This example demonstrates how to create devices in your account using an Input Widget on the dashboard.
 *
 * Dashboard Template:
 * You can access the dashboard template needed for this operation here: https://admin.tago.io/template/6143555a314cef001871ec78
 * It's recommended to use a dummy HTTPS device alongside the dashboard for testing purposes.
 *
 * Usage Instructions:
 * For the analysis to function correctly, you must add a new policy to your account by following these steps:
 *  1. Navigate to https://admin.tago.io/am and click on the "Add Policy" button.
 *  2. In the Target selector, ensure the field is set to "ID", then select your Analysis from the list.
 *  3. Click on the "Click to add a new permission" option, choose "Device" as the type, and set the rule to "Access" with the scope as "Any".
 *  4. Finalize by clicking the save button located in the bottom right corner to apply your new Policy.
 */

import { Analysis, Resources } from "jsr:@tago-io/sdk";
import type { AnalysisConstructorParams, Data } from "jsr:@tago-io/sdk";

async function startAnalysis(context: AnalysisConstructorParams, scope: Data[]): Promise<void> {
  if (!scope[0]) {
    return console.log("The analysis must be triggered by a widget.");
  }

  console.log("Creating your device");

  // Get the variables sent by the widget/dashboard.
  const network_id = scope.find((x) => x.variable === "device_network");
  const connector_id = scope.find((x) => x.variable === "device_connector");
  const device_name = scope.find((x) => x.variable === "device_name");
  const device_eui = scope.find((x) => x.variable === "device_eui");

  if (!connector_id || !connector_id.value) {
    return console.log('Missing "device_connector" in the data scope.');
  } else if (!network_id || !network_id.value) {
    return console.log('Missing "device_network" in the data scope.');
  } else if (!device_eui || !device_eui.value) {
    return console.log('Missing "device_eui" in the data scope.');
  }

  const deviceID = scope[0]?.device;
  if (!deviceID) {
    return console.log('Device ID not found in the data scope');
  }

  const deviceCreateInfo: any = {
    name: device_name.value as string,
    // Serie number is the parameter for device eui, sigfox id, etc..
    serie_number: device_eui.value as string,
    tags: [
      // You can add custom tags here.
      { key: "type", value: "sensor" },
      { key: "device_eui", value: device_eui.value as string },
    ],
    connector: connector_id.value as string,
    network: network_id.value as string,
    active: true,
    type: "immutable",
    chunk_period: "month", //consider change
    chunk_retention: 1, //consider change
  };

  const result = await Resources.devices
    .create(deviceCreateInfo)
    .catch((error) => {
      // Send the validation to the device.
      // That way we create an error in the dashboard for feedback.
      Resources.devices.sendDeviceData(deviceID, {
        variable: "validation",
        value: `Error when creating the device ${error}`,
        metadata: { color: "red" },
      });
      throw error;
    });

  // To add Configuration Parameters to the device:
  await Resources.devices.paramSet(result.device_id, { key: "param_key", value: "10", sent: false });

  // Send feedback to the dashboard:
  await Resources.devices.sendDeviceData(deviceID, { variable: "validation", value: "Device succesfully created!", metadata: { type: "success" } });
  console.log(`Device succesfully created. ID: ${result.device_id}`);
}

Analysis.use(startAnalysis);