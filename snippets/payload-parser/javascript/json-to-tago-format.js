// @title: JSON to TagoIO Format Converter
// @description: Converts raw JSON data to TagoIO format with support for nested objects and metadata
// @tags: json, converter, format, utility, basic

/* What does this snippet do?
 ** It simply converts raw JSON to formatted TagoIO JSON.
 ** So if you send { "temperature": 10 }
 ** This script will convert it to { "variable": "temperature", "value": 10 }
 **
 ** The ignore_vars variable in this code should be used to ignore variables
 ** from the device that you don't want.
 */
// Add ignorable variables in this array.
const ignore_vars = [];

/**
 * Convert an object to TagoIO object format.
 * Can be used in two ways:
 * toTagoFormat({ myvariable: myvalue , anothervariable: anothervalue... })
 * toTagoFormat({ myvariable: { value: myvalue, unit: 'C', metadata: { color: 'green' }} , anothervariable: anothervalue... })
 *
 * @param {Object} object_item Object containing key and value.
 * @param {String} group Group for the variables
 * @param {String} prefix Add a prefix to the variable names
 */
function toTagoFormat(object_item, group, prefix = "") {
  const result = [];
  for (const key in object_item) {
    if (ignore_vars.includes(key)) continue;

    if (typeof object_item[key] === "object") {
      result.push({
        variable: object_item[key].variable || `${prefix}${key}`,
        value: object_item[key].value,
        group: object_item[key].group || group,
        metadata: object_item[key].metadata,
        location: object_item[key].location,
        unit: object_item[key].unit,
      });
    } else {
      result.push({
        variable: `${prefix}${key}`,
        value: object_item[key],
        group,
      });
    }
  }

  return result;
}

// Check if what is being stored is the ttn_payload.
// Payload is an environment variable. Is where what is being inserted to your device comes in.
if (!payload[0].variable) {
  // Get a unique group for the incoming data.
  const group = payload[0].group || String(Date.now());

  payload = toTagoFormat(payload[0], group);
}
