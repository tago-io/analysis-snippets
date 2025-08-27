// @title: HTTP GET Request
// @description: Make HTTP GET requests to external APIs and routes
// @tags: http, get, api, request, external

/*
 ** Analysis Example
 ** HTTP GET Request
 **
 ** This analysis makes a simple GET request to an HTTP route. It's a starting example for you to develop more
 ** complex algorithms.
 ** In this example we get the Account name and print to the console.
 **
 **.
 */

import type { TagoContext } from "npm:@tago-io/sdk";
import { Analysis } from "npm:@tago-io/sdk";

interface ApiResponse {
  result: {
    name: string;
  };
}

async function startAnalysis(context: TagoContext): Promise<void> {
  const url = "https://api.tago.io/info";
  const headers = {
    Authorization: "Your-Account-Token",
  };

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      // How to use HTTP QueryString in fetch:
      // new URLSearchParams({ serie: "123" })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();
    context.log(result);

    context.log("Your account name is: ", result.result.name);
  } catch (error) {
    context.log(`${error}\n${error}`);
  }
}

Analysis.use(startAnalysis);

// To run analysis on your machine (external)
// Analysis.use(myAnalysis, { token: "YOUR-TOKEN" });
