// @title: Dynamic Notifications
// @description: Send dynamic email, SMS and push notifications based on conditions
// @tags: notification, dynamic, email, sms, push, conditional

/*
 ** Notification Analysis Example
 ** Dynamically Sending Notifications
 **
 ** This script demonstrates how to send notifications via Email, SMS, and Push to TagoRUN Users using analysis.
 ** To execute this example, you must first set up an action by variable to trigger this analysis.
 ** Once the action meets your specified conditions, the corresponding data will be dispatched for analysis.
 **
 ** Usage Instructions:
 ** In order for this analysis to function correctly, a new policy must be added to your account. Here are the steps for adding a new policy:
 **  1 - Navigate to https://admin.tago.io/am and click on "Add Policy";
 **  2 - In the Target selector, locate "ID" under Analysis field and choose your desired Analysis from the list;
 **  3 - Click on "Click to add a new permission", select "Device", and set rule as "Access" with "Any" field;
 **  4 - Click on "Click to add a new permission" again, select "Service", and set rules as "Send Email" and "Send SMS";
 **  5 - Once more click on "Click to add a new permission", choose "Run User", set rule as "Create Notification" with field set as "Any";
 **  6 - To finalize your new Policy, hit the save button located in the bottom right corner of the screen.
 */

import type { Data, TagoContext } from "npm:@tago-io/sdk";
import { Analysis, Resources, Services } from "npm:@tago-io/sdk";

async function startAnalysis(context: TagoContext, scope: Data[]): Promise<void> {
  if (!scope[0]) {
    return context.log("This analysis must be triggered by an action.");
  }

  console.log("Analysis started");

  // Get the device ID from the scope and retrieve device information.
  const device_id = scope[0].device;
  if (!device_id) {
    return context.log("Device ID not found in scope");
  }

  const device_info = await Resources.devices.info(device_id);

  // Get the device name and tags from the device.
  // [TAG KEY]    [TAG VALUE]
  // email        example@tago.io
  // phone        +1XXxxxxxxx
  // user_id      5f495ae55ff03d0028d39fc5
  //
  // This is just a generic example how to get this information. You can get data from a device, search in tags, or any other way of correlation you have.
  // For example, you can get the email directly from the user_id if it was specified:
  // const { email } = await account.run.userInfo(userID_tag.id);
  const device_name = device_info.name;
  const email_tag = device_info.tags?.find((tag) => tag.key === "email");
  const phone_tag = device_info.tags?.find((tag) => tag.key === "phone");
  const userID_tag = device_info.tags?.find((tag) => tag.key === "user_id");

  // Instance the SMS and Email service using the analysis token from the context.
  const email_service = new Services({ token: context.token }).email;
  const sms_service = new Services({ token: context.token }).sms;

  // Send the notifications and output the results to the analysis console.
  if (email_tag) {
    const emailData = {
      to: email_tag.value,
      subject: "Notification alert",
      message: `You received a notification for the device: ${device_name}. Variable: ${scope[0].variable}, Value: ${scope[0].value}`,
    };

    await email_service
      .send(emailData)
      .then((result) => console.log(result))
      .catch((error) => console.log(error));
  } else {
    console.log("Email not found for this device.");
  }

  if (phone_tag) {
    const smsData = {
      to: phone_tag.value,
      message: `You received a notification for the device: ${device_name}. Variable: ${scope[0].variable}, Value: ${scope[0].value}`,
    };

    await sms_service
      .send(smsData)
      .then((result) => console.log(result))
      .catch((error) => console.log(error));
  } else {
    console.log("Phone number not found for this device.");
  }

  if (userID_tag) {
    const notificationData = {
      title: "Notification Alert",
      message: `You received a notification for the device: ${device_name}. Variable: ${scope[0].variable}, Value: ${scope[0].value}`,
    };

    await Resources.run
      .notificationCreate(userID_tag.value, notificationData)
      .then((result) => console.log(result))
      .catch((error) => console.log(error));
  } else {
    console.log("User ID not found for this device.");
  }

  console.log("Script end.");
}

Analysis.use(startAnalysis);
