/*
 ** Analysis Example
 ** Sending downlink using dashboard
 **
 ** Using an Input Widget in the dashboard, you will be able to trigger a downlink to
 ** any LoraWaN network server.
 ** You can get the dashboard template to use here: https://admin.tago.io/template/5f514218d4555600278023c4
 ** IMPORTANT: Your device is required to send an Uplink before any downlink can be send.
 **
 ** Environment Variables
 ** In order to use this analysis, you must setup the Environment Variable table.
 **
 ** default_PORT: The default port to be used if not sent by the dashboard.
 ** device_id: The default device id to be used if not sent by the dashboard (OPTIONAL).
 ** payload: The default payload to be used if not sent by the dashboard (OPTIONAL).
 **
 ** How to use:
 ** To analysis works, you need to add a new policy in your account. Steps to add a new policy:
 ** 1 - Click the button "Add Policy" at this url: https://admin.tago.io/am;
 ** 2 - In the Target selector, with the field set as "ID", choose your Analysis in the list;
 ** 3 - Click the "Click to add a new permission" element and select "Device" with the rule "Access, Edit, Token Access" with the field as "Any";
 ** 4 - Click the "Click to add a new permission" element and select "Network" with the rule "Access" with the field as "Any";
 **
 */

import type { Data, DownlinkOptions, TagoContext } from "npm:@tago-io/sdk";
import { Analysis, Resources, Utils } from "npm:@tago-io/sdk";

async function startAnalysis(context: TagoContext, scope: Data[]): Promise<void> {
  // Remove code below if you want to trigger by schedule action and using environment variables.
  if (!scope[0]) {
    return context.log("This analysis must be triggered by a widget.");
  }

  context.log("Downlink analysis started");

  // Get environment variables
  const environment = Utils.envToJson(context.environment);

  // Get the variables form_payload and form_port sent by the widget/dashboard.
  let payload = scope.find((x) => x.variable === "form_payload");
  let port = scope.find((x) => x.variable === "form_port");

  // Setup from environment variable if widget hadn't been used to trigger the analysis.
  if (!payload) {
    payload = { value: environment.payload, device: environment.device_id } as Data;
  }

  if (!port) {
    port = { value: environment.default_PORT } as Data;
  }

  // Error to make sure analysis have the information it needs.
  if (!payload.value || !payload.device) {
    return context.log('Missing "form_payload" in the data scope.');
  } else if (!port || !port.value) {
    return context.log('Missing "form_port" in the data scope.');
  }

  // All variables that trigger the analysis have the "device" parameter, with the TagoIO Device ID.
  // Otherwise it will get from the environment variable.
  const device_id = payload.device;
  if (!device_id) {
    return context.log(
      "Device key <device> not found in the variables sent by the widget/dashboard."
    );
  }

  const resources = new Resources({ token: context.token });

  const downlinkOptions: DownlinkOptions = {
    payload: payload.value as string,
    port: port.value as string,
    confirmed: false,
  };

  const result = await Utils.sendDownlink(resources, device_id, downlinkOptions).catch(
    (error) => error
  );

  console.log(result);
}

Analysis.use(startAnalysis);

// To run analysis on your machine (external)
// Analysis.use(myAnalysis, { token: "YOUR-TOKEN" });
