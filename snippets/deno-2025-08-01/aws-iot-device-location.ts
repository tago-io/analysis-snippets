// @title: AWS IoT Device Location
// @description: AWS IoT Core Device Location service integration
// @tags: aws, iot, location, integration, tracking

/*
 * TagoIO - Analysis Example
 * AWS IoT Device Location Integration
 *
 * This analysis demonstrates how to integrate with AWS IoT Core Device Location service
 * to track and manage device locations.
 *
 * Check out the SDK documentation on: https://js.sdk.tago.io
 *
 * Environment Variables needed:
 * - AWS_ACCESS_KEY_ID: Your AWS access key
 * - AWS_SECRET_ACCESS_KEY: Your AWS secret key
 * - AWS_REGION: AWS region (e.g., us-east-1)
 * - DEVICE_ID: Device ID to track location for
 */

import { Analysis, Resources } from "jsr:@tago-io/sdk";
import type { AnalysisConstructorParams, Data } from "jsr:@tago-io/sdk";

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  deviceId: string;
}

interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * Parse environment variables
 */
function getAWSConfig(context: AnalysisConstructorParams): AWSConfig {
  const envVars = context.environment;

  const accessKeyId = envVars.find((env) => env.key === "AWS_ACCESS_KEY_ID")?.value;
  const secretAccessKey = envVars.find((env) => env.key === "AWS_SECRET_ACCESS_KEY")?.value;
  const region = envVars.find((env) => env.key === "AWS_REGION")?.value;

  if (!accessKeyId || !secretAccessKey || !region) {
    throw new Error("Missing required AWS environment variables");
  }

  return { accessKeyId, secretAccessKey, region };
}

/**
 * Mock AWS IoT Device Location service call
 * In a real implementation, this would use AWS SDK
 */
async function getDeviceLocation(
  config: AWSConfig,
  deviceId: string
): Promise<LocationData | null> {
  try {
    // This is a mock implementation
    // In production, you would use the AWS SDK to call IoT Device Location service
    console.log(`Fetching location for device ${deviceId} from AWS IoT`);

    // Mock response - replace with actual AWS SDK calls
    const mockLocation: LocationData = {
      latitude: -23.55052,
      longitude: -46.633308,
      timestamp: new Date().toISOString(),
      accuracy: 10.0,
      deviceId: deviceId,
    };

    return mockLocation;
  } catch (error) {
    console.error("Error fetching device location:", error);
    return null;
  }
}

/**
 * Store location data in TagoIO
 */
async function storeLocationData(deviceId: string, locationData: LocationData): Promise<void> {
  const dataToInsert: Data[] = [
    {
      variable: "latitude",
      value: locationData.latitude,
      time: locationData.timestamp,
      metadata: {
        source: "aws_iot_location",
        accuracy: locationData.accuracy,
      },
    },
    {
      variable: "longitude",
      value: locationData.longitude,
      time: locationData.timestamp,
      metadata: {
        source: "aws_iot_location",
        accuracy: locationData.accuracy,
      },
    },
    {
      variable: "location",
      value: `${locationData.latitude}, ${locationData.longitude}`,
      time: locationData.timestamp,
      location: {
        lat: locationData.latitude,
        lng: locationData.longitude,
      },
      metadata: {
        source: "aws_iot_location",
        accuracy: locationData.accuracy,
      },
    },
  ];

  await Resources.devices.sendDeviceData(deviceId, dataToInsert);
  console.log(`Stored location data for device ${deviceId}`);
}

/**
 * Main analysis function
 */
async function startAnalysis(context: AnalysisConstructorParams, scope: Data[]): Promise<void> {
  try {
    // Get AWS configuration from environment variables
    const awsConfig = getAWSConfig(context);

    // Get device ID from environment or scope
    const deviceIdEnv = context.environment.find((env) => env.key === "DEVICE_ID")?.value;
    const deviceId = deviceIdEnv || scope[0]?.device;

    if (!deviceId) {
      console.error("No device ID provided in environment variables or scope");
      return;
    }

    console.log(`Processing location update for device: ${deviceId}`);

    // Fetch location from AWS IoT Device Location service
    const locationData = await getDeviceLocation(awsConfig, deviceId);

    if (!locationData) {
      console.error("Failed to retrieve location data from AWS IoT");
      return;
    }

    // Store the location data in TagoIO
    await storeLocationData(deviceId, locationData);

    console.log("Location data processing completed successfully");
  } catch (error) {
    console.error("Analysis execution failed:", error);
  }
}

Analysis.use(startAnalysis);
