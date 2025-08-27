/*
 * TagoIO - Analysis Example
 * Parse Payload Environment Variables
 *
 * Learn how to parse and debug the environment variables and data payload
 * passed to your analysis. This is useful for understanding the data structure
 * and troubleshooting your analysis execution.
 */

// Parse and extract analysis environment variables
const analysis_id = process.env.T_ANALYSIS_ID;
const analysis_token = process.env.T_ANALYSIS_TOKEN;
const analysis_env = JSON.parse(process.env.T_ANALYSIS_ENV || "{}");
const analysis_data = JSON.parse(process.env.T_ANALYSIS_DATA || "[]");

// Debug logging for all variables
console.log("=== Analysis Environment Debug ===");
console.log("Analysis ID:", analysis_id);
console.log("Analysis Token:", analysis_token ? "***PRESENT***" : "MISSING");
console.log("Analysis Environment:", JSON.stringify(analysis_env, null, 2));
console.log("Analysis Data:", JSON.stringify(analysis_data, null, 2));
console.log("=== End Debug ===");
