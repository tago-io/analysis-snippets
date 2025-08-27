/**
 * Parses the value of the reading
 *
 * Value  Value of the entry.  Optional if a Sum value is present,
 * otherwise required.  Values are represented using three basic data
 * types, Floating point numbers ("v" field for "Value"), Booleans
 * ("vb" for "Boolean Value") and Strings ("vs" for "String Value").
 * Exactly one of these three fields MUST appear.
 * @param {Object} item
 * @returns {number | boolean | string}
 */
function parseValue(item) {
  if ("vb" in item) {
    return !!item.vb;
  }

  if ("v" in item) {
    return Number(item.v);
  }

  if ("vs" in item) {
    return item.vs;
  }
}

/**
 * Parses the measurement time
 * If either the Base Time or Time value is missing, the missing
 * attribute is considered to have a value of zero.  The Base Time and
 * Time values are added together to get the time of measurement.  A
 * time of zero indicates that the sensor does not know the absolute
 * time and the measurement was made roughly "now".  A negative value is
 * used to indicate seconds in the past from roughly "now".  A positive
 * value is used to indicate the number of seconds, excluding leap
 * seconds, since the start of the year 1970 in UTC.
 * @param {dayjs.Dayjs | Date} curr_time current time when this code is running
 * @param {Object} item measurement object
 * @returns {dayjs.Dayjs}
 */
function parseTime(curr_time = dayjs(), item) {
  if (!item.t) {
    return dayjs(curr_time).toISOString();
  }

  if (Number(item.t) < 0) {
    return dayjs(curr_time)
      .subtract(item.t * -1, "seconds")
      .toISOString();
  }

  return dayjs(curr_time).add(item.t, "seconds").toISOString();
}

/**
 * Removes unaccepted parameters from the variable name
 * @param {string} variable
 */
function parseVariable(variable) {
  const variableParsed = variable.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/gi, "");
  if (!variableParsed) {
    return "measurement";
  }
  return variableParsed;
}

/**
 *
 * @param {Object[]} senml_obj
 */
function decoder(senml_obj) {
  const toTagoJSON = [];
  const serie = String(Date.now());

  let curr_time = dayjs();
  let base_unit;
  let base_name;
  for (const item of senml_obj) {
    if (item.bt) {
      curr_time = dayjs(item.bt, "X");
    }
    if (item.bn) {
      base_name = item.bn;
    }
    if (item.bu) {
      base_unit = item.bu;
    }

    const itemTago = {
      variable: parseVariable(item.n || base_name),
      unit: item.u || base_unit,
      value: parseValue(item),
      time: parseTime(curr_time, item),
      serie,
      group: serie,
    };

    toTagoJSON.push(itemTago);
  }

  return toTagoJSON;
}

try {
  if (Array.isArray(payload) && payload[0].bn) {
    payload = decoder(payload);
  }
} catch (e) {
  console.log(e.message);
}
