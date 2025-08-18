// @title: Console Hello World
// @description: Hello World example with console output
// @tags: basic, console, hello-world

/*
 * TagoIO - Analysis Example
 * Hello World
 *
 * Check out the SDK documentation on: https://js.sdk.tago.io
 *
 * Learn how to send messages to the console located on the TagoIO analysis screen.
 * You can use this principle to show any information during and after development.
 */

import { Analysis } from "jsr:@tago-io/sdk";
// The function myAnalysis will run when you execute your analysis
function myAnalysis() {
  console.log("Hello World");
}

Analysis.use(myAnalysis);

// To run analysis on your machine (external)
// Analysis.use(myAnalysis, { token: "YOUR-TOKEN" });
