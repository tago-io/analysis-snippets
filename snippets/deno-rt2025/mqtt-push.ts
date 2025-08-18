// @title: MQTT Push from Dashboard
// @description: Send MQTT messages triggered from dashboard interactions
// @tags: mqtt, push, dashboard, messaging, iot

/*
 ** Analysis Example
 ** MQTT Push
 **
 * Snippet to push data to MQTT. Follow this pattern within your application
 * If you want more details about MQTT, search "MQTT" in TagoIO help center.
 * You can find plenty of documentation about this topic.
 * TagoIO Team.
 **
 ** How to use?
 ** In order to trigger this analysis you must setup a Dashboard.
 ** Create a Widget "Form" and enter the variable 'push_payload' for the device you want to push with the MQTT.
 ** In User Control, select this Analysis in the Analysis Option.
 ** Save and use the form.
 */

import { Analysis, Services } from "jsr:@tago-io/sdk";
import type { TagoContext, Data } from "jsr:@tago-io/sdk";

interface TemperatureData {
  variable: string;
  value: number;
  unit: string;
}

async function mqttPushExample(context: TagoContext, scope: Data[]): Promise<void> {
  if (!scope.length) {
    return context.log("This analysis must be triggered by a dashboard.");
  }

  const myData = scope.find((x) => x.variable === "push_payload") || scope[0];
  if (!myData) {
    return context.log("Couldn't find any variable in the scope.");
  }

  // Create your data object to push to MQTT
  // In this case we're sending a JSON object.
  // You can send anything you want.
  // Example:
  // const myDataObject = 'This is a string';
  const myDataObject: TemperatureData = {
    variable: "temperature_celsius",
    value: ((myData.value as number) - 32) * (5 / 9),
    unit: "C",
  };

  // Create a object with the options you chooses
  const options = {
    qos: 0,
  };

  // Publishing to MQTT
  const MQTT = new Services({ token: context.token }).MQTT;
  await MQTT.publish({
    // bucket: myData.bucket, // for legacy devices
    bucket: myData.device!, // for immutable/mutable devices
    message: JSON.stringify(myDataObject),
    topic: "tago/my_topic",
    options,
  }).then(
    (result) => context.log(result),
    (error) => context.log(error)
  );
}

Analysis.use(mqttPushExample);

// To run analysis on your machine (external)
// Analysis.use(mqttPushExample, { token: "YOUR-TOKEN" });
