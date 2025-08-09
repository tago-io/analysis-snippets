// @title: Device Offline Alert
// @description: Monitor devices and send alerts when they go offline
// @tags: device, offline, alert, monitoring, status

/*
 ** Analysis Example
 ** Device Offline Alert
 **
 ** This analysis must run by Time Interval. It checks if devices with given Tags
 ** had communication in the past minutes. If not, it sends an email or sms alert.
 **
 ** Environment Variables
 ** In order to use this analysis, you must setup the Environment Variable table.
 **
 ** checkin_time: Minutes between the last input of the device before sending the notification.
 ** tag_key: Device tag Key to filter the devices.
 ** tag_value: Device tag Value to filter the devices.
 ** email_list: Email list comma separated.
 ** sms_list: Phone number list comma separated. The phone number must include the country code
 **
 ** How to use:
 ** To analysis works, you need to add a new policy in your account. Steps to add a new policy:
 **  1 - Click the button "Add Policy" at this url: https://admin.tago.io/am;
 **  2 - In the Target selector, with the field set as "ID", choose your Analysis in the list;
 **  3 - Click the "Click to add a new permission" element and select "Device" with the rule "Access" with the field as "Any";
 **  4 - To save your new Policy, click the save button in the bottom right corner;
 */

const { Analysis, Services, Utils, Resources } = require("@tago-io/sdk");
const dayjs = require("dayjs");

async function startAnalysis(context) {
  // Transform all Environment Variable to JSON.
  const env = Utils.envToJson(context.environment);

  if (!env.checkin_time) {
    return context.log("You must setup a checkin_time in the Environment Variables.");
  } else if (!env.tag_key) {
    return context.log("You must setup a tag_key in the Environment Variables.");
  } else if (!env.tag_value) {
    return context.log("You must setup a tag_value in the Environment Variables.");
  } else if (!env.email_list && !env.sms_list) {
    return context.log("You must setup an email_list or a sms_list in the Environment Variables.");
  }

  const checkin_time = Number(env.checkin_time);
  if (Number.isNaN(checkin_time)) return context.log("The checkin_time must be a number.");

  // You can remove the comments on line 51 and 57 to use the Tag Filter.
  //const filter = { tags: [{ key: env.tag_key, value: env.tag_value }] };

  const devices = await Resources.devices.list({
    page: 1,
    amount: 1000,
    fields: ["id", "name", "last_input"],
    // filter,
  });

  if (!devices.length) {
    return context.log(
      `No device found with given tags. Key: ${env.tag_key}, Value: ${env.tag_value} `
    );
  }

  context.log("Checking devices: ", devices.map((x) => x.name).join(", "));

  const now = dayjs();
  const alert_devices = [];
  for (const device of devices) {
    const last_input = dayjs(new Date(device.last_input));

    // Check the difference in minutes.
    const diff = now.diff(last_input, "minute");
    if (diff > checkin_time) {
      alert_devices.push(device.name);
    }
  }

  if (!alert_devices.length) {
    return context.log("All devices are okay.");
  }

  context.log("Sending notifications");
  const emailService = new Services({ token: context.token }).email;
  const smsService = new Services({ token: context.token }).sms;

  let message = `Hi!\nYou're receiving this alert because the following devices didn't send data in the last ${checkin_time} minutes.\n\nDevices:`;
  message += alert_devices.join("\n");

  if (env.email_list) {
    // Remove space in the string
    const emails = env.email_list.replace(/ /g, "");

    await emailService.send({
      to: emails,
      subject: "Device Offline Alert",
      message,
    });
  }

  if (env.sms_list) {
    // Remove space in the string and convert to an Array.
    const smsNumbers = env.sms_list.replace(/ /g, "").split(",");

    for (const phone of smsNumbers) {
      await smsService.send({
        to: phone,
        message,
      });
    }
  }
}

Analysis.use(startAnalysis);

// To run analysis on your machine (external)
// Analysis.use(myAnalysis, { token: "YOUR-TOKEN" });
