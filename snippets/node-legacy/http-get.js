// @title: HTTP GET Request
// @description: Make HTTP GET requests to external APIs and routes
// @tags: http, get, api, request, external

/*
 ** Analysis Example
 ** Post to HTTP Route
 **
 ** This analysis simple post to an HTTP route. It's a starting example for you to develop more
 ** complex algorithms.
 ** In this example we get the Account name and print to the console.
 **
 **.
 */

const { Analysis } = require("@tago-io/sdk");
const axios = require("axios");

async function startAnalysis(context) {
  const options = {
    url: "https://api.tago.io/info",
    method: "GET",
    headers: {
      Authorization: "Your-Account-Token",
    },
    // How to use HTTP QueryString
    // params: {
    //  serie: 123,
    // },
    //
    // How to send a HTTP Body:
    // body: 'My text body',
  };

  try {
    const result = await axios(options);
    context.log(result.data);

    context.log("Your account name is: ", result.data.result.name);
  } catch (error) {
    context.log(`${error}\n${error}`);
  }
}

Analysis.use(startAnalysis);

// To run analysis on your machine (external)
// Analysis.use(myAnalysis, { token: "YOUR-TOKEN" });
