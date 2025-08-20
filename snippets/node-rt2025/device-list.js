// @title: Get Device List
// @description: Retrieve and filter device list from your account using fetch
// @tags: devices, api, list, filtering, fetch

/*
 * TagoIO - Analysis Example
 * Get Device List
 *
 * This analysis retrieves a list of devices from your account using direct API calls
 * with fetch and prints it to the console.
 *
 * How to use:
 * To analysis works, you need to add a new policy in your account. Steps to add a new policy:
 *  1 - Click the button "Add Policy" at this url: https://admin.tago.io/am;
 *  2 - In the Target selector, select the Analysis with the field set as "ID" and choose your Analysis in the list;
 *  3 - Click the "Click to add a new permission" element and select "Device" with the rule "Access" with the field as "Any";
 *  4 - To save your new Policy, click the save button in the bottom right corner;
 */

// Parse environment variables
const analysis_token = process.env.T_ANALYSIS_TOKEN;

// TagoIO API base URL
const TAGO_API_BASE = "https://api.tago.io";

async function getDeviceList() {
  try {
    // Debug: Log token availability
    console.log("Analysis Token:", analysis_token ? "***PRESENT***" : "MISSING");

    if (!analysis_token) {
      throw new Error("Analysis token is required");
    }

    // Example of filtering devices by tag.
    // To use this filter, uncomment and modify the filter object below
    // const filter = {
    //   tags: [
    //     {
    //       key: "key_name", // change by your key name
    //       value: "key_value", // change by your key value
    //     },
    //   ],
    //   // You also can filter by: name, last_input, last_output, bucket, etc.
    // };

    // Query parameters for device list
    const query = {
      page: 1,
      fields: ["id", "tags"],
      // filter, // uncomment to use filtering
      amount: 100,
    };

    // Debug: Log query parameters
    console.log("Query parameters:", JSON.stringify(query, null, 2));

    // Make API request to get device list
    const response = await fetch(`${TAGO_API_BASE}/device`, {
      method: "GET",
      headers: {
        Authorization: analysis_token,
        "Content-Type": "application/json",
      },
      // Convert query object to URL search params
      // Note: For complex queries, you might need to use POST method
    });

    // Debug: Log response status
    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Debug: Log raw response
    console.log("Raw API response:", JSON.stringify(data, null, 2));

    // Extract devices from response
    const devices = data.result || data;

    if (!devices || devices.length === 0) {
      return console.log("Devices not found");
    }

    console.log("=== Device List ===");
    console.log(`Found ${devices.length} devices:`);
    console.log(JSON.stringify(devices, null, 2));
  } catch (error) {
    console.error("Error fetching device list:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

// Execute the function
getDeviceList();
