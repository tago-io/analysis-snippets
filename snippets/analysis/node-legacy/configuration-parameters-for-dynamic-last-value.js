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
const { Resources, Analysis } = require("@tago-io/sdk");
const { queue } = require("async");
const moment = require("moment-timezone");

// set the timezone to show up on dashboard. TagoIO may handle ISOString automatically in a future update.
let timezone = "America/New_York";

const getParam = (params, key) =>
  params.find((x) => x.key === key) || { key, value: "-", sent: false };
async function applyDeviceCalculation({ id: deviceID, name }) {
  const deviceInfoText = `${name}(${deviceID}`;
  console.info(`Processing Device ${deviceInfoText})`);

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

    const timeString = moment(temperature.time).tz(timezone).format("YYYY/MM/DD HH:mm A");

    // creates or edit the tempreature Param with the value of temperature.
    // creates or edit the last_record_time Param with the time of temperature.
    // Make sure to cast the value to STRING, otherwise you'll get an error.
    await Resources.devices.paramSet(deviceID, [
      { ...temperatureParam, value: String(temperature.value) },
      { ...lastRecordParam, value: timeString },
    ]);
  }
}

// scope is not used for Schedule action.
async function startAnalysis(context, scope) {
  // get timezone from the account
  ({ timezone } = await Resources.account.info());

  // Create a queue, so we don't run on Throughput errors.
  // The queue will make sure we check only 5 devices simultaneously.
  const processQueue = queue(applyDeviceCalculation, 5);

  // fetch device list filtered by tags.
  // Device list always return an Array with DeviceInfo object.
  const deviceList = await Resources.devices.list({
    amount: 500,
    fields: ["id", "name", "tags"],
    filter: {
      tags: [{ key: "type", value: "sensor" }],
    },
  });

  deviceList.forEach((device) => processQueue.push({ ...device, account }));

  // Wait for all queue to be processed
  await processQueue.drain();
}
Analysis.use(startAnalysis);
