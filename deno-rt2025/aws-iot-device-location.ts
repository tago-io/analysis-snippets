/*
 * TagoIO - Analysis Example
 * AWS IoT Device Location Integration
 *
 * This analysis demonstrates how to integrate with AWS IoT Core Device Location service
 * to estimate device location using GNSS, IP address, or WiFi access points data.
 *
 * Check out the SDK documentation on: https://js.sdk.tago.io
 *
 * Environment Variables needed:
 * - AWS_ACCESSKEYID: Your AWS access key ID
 * - AWS_SECRETACCESSKEY: Your AWS secret access key
 * - AWS_REGION: AWS region (e.g., us-east-1)
 * - DESIREABLE_ACCURACY_PERCENT: Desired accuracy percentage (e.g., 80)
 * - GNSS_SOLVER_VARIABLE: Variable name for GNSS data (default: gnss_solver)
 * - IP_ADDRESS_VARIABLE: Variable name for IP address data (default: ip_addresses)
 * - WIFI_ADDRESSES_VARIABLE: Variable name for WiFi addresses data (default: wifi_addresses)
 */

import { GetPositionEstimateCommand, IoTWirelessClient } from "npm:@aws-sdk/client-iot-wireless";
import type { Data, TagoContext } from "npm:@tago-io/sdk";
import { Analysis, Resources } from "npm:@tago-io/sdk";

interface EstimatedConfiguration {
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
  desireableAccuracyPercent: string;
}

interface EstimatedLocationResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  properties: {
    HorizontalAccuracy: number;
    VerticalAccuracy: number;
  };
}

interface AWSPayload {
  Timestamp: Date;
  Gnss?: {
    Payload: string;
  };
  Ip?: {
    IpAddress: string;
  };
  WiFiAccessPoints?: Array<{
    MacAddress: string;
    Rss: number;
  }>;
}

/**
 * Parse environment variables to get configuration
 */
function _getConfiguration(context: TagoContext): EstimatedConfiguration {
  const awsAccessKeyId = context.environment.find((x) => x.key === "AWS_ACCESSKEYID")?.value;
  const awsSecretAccessKey = context.environment.find(
    (x) => x.key === "AWS_SECRETACCESSKEY"
  )?.value;
  const awsRegion = context.environment.find((x) => x.key === "AWS_REGION")?.value;
  const desireableAccuracyPercent = context.environment.find(
    (x) => x.key === "DESIREABLE_ACCURACY_PERCENT"
  )?.value;

  if (!awsAccessKeyId) {
    throw new Error("Missing AWS_ACCESSKEYID in environment variables");
  }
  if (!awsSecretAccessKey) {
    throw new Error("Missing AWS_SECRETACCESSKEY in environment variables");
  }
  if (!awsRegion) {
    throw new Error("Missing AWS_REGION in environment variables");
  }
  if (!desireableAccuracyPercent) {
    throw new Error("Missing DESIREABLE_ACCURACY_PERCENT in environment variables");
  }

  return {
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
    desireableAccuracyPercent,
  };
}

/**
 * Create AWS payload for position estimate command
 */
function _createAWSPayload(
  gnssValue?: string,
  ipAddress?: string,
  wifiAddresses?: Record<string, number>
): AWSPayload {
  if (!gnssValue && !ipAddress && !wifiAddresses) {
    throw new Error("No data to create the payload");
  }

  let payload: AWSPayload = { Timestamp: new Date() };

  if (gnssValue) {
    payload = { ...payload, Gnss: { Payload: gnssValue } };
  }

  if (ipAddress) {
    payload = { ...payload, Ip: { IpAddress: ipAddress } };
  }

  if (wifiAddresses) {
    const wifiKeys = Object.keys(wifiAddresses);
    const wifiValues = Object.values(wifiAddresses);

    if (wifiKeys.length < 2) {
      throw new Error("Wifi Addresses must have at least 2 addresses");
    }

    payload = {
      ...payload,
      WiFiAccessPoints: [
        {
          MacAddress: wifiKeys[0],
          Rss: wifiValues[0],
        },
        {
          MacAddress: wifiKeys[1],
          Rss: wifiValues[1],
        },
      ],
    };
  }

  return payload;
}

/**
 * Extract estimated location from AWS response
 */
function _getEstimatedLocation(response: {
  GeoJsonPayload?: { transformToString?: () => string };
}): EstimatedLocationResponse {
  if (!response) {
    throw new Error("No response from AWS");
  }

  const estimatedLocation = JSON.parse(response.GeoJsonPayload?.transformToString?.() ?? "");

  if (!estimatedLocation) {
    throw new Error("No estimated location found");
  }

  return estimatedLocation;
}

/**
 * Create TagoIO data object from scope and estimated location
 */
function _createDataForDevice(
  scope: Data,
  desireableAccuracy: string,
  estimatedLocation: EstimatedLocationResponse
): Data {
  const [lng, lat] = estimatedLocation.geometry.coordinates;
  const horizontalAccuracy = estimatedLocation.properties?.HorizontalAccuracy;
  const verticalAccuracy = estimatedLocation.properties?.VerticalAccuracy;

  const accuracy =
    horizontalAccuracy >= parseFloat(desireableAccuracy) ||
    verticalAccuracy >= parseFloat(desireableAccuracy);

  const dataReturn: Data = {
    variable: "estimated_location",
    value: lat + ";" + lng,
    location: {
      coordinates: [lng, lat],
      type: "Point",
    },
    metadata: {
      horizontalAccuracy,
      verticalAccuracy,
      color: accuracy ? "green" : "red",
    },
    group: scope.group,
    time: scope.time,
    device: scope.device,
    id: scope.id,
  };

  return dataReturn;
}

/**
 * Main analysis function for AWS IoT Device Location
 */
async function getEstimatedDeviceLocation(context: TagoContext, scope: Data[]): Promise<void> {
  console.log("Starting Analysis");

  let configuration: EstimatedConfiguration;
  try {
    configuration = _getConfiguration(context);
  } catch (error) {
    console.error((error as Error).message);
    return;
  }

  // Get variable names from environment or use defaults
  const gnssSolverVariable =
    context.environment.find((x) => x.key === "GNSS_SOLVER_VARIABLE")?.value || "gnss_solver";
  const ipAddressVariable =
    context.environment.find((x) => x.key === "IP_ADDRESS_VARIABLE")?.value || "ip_addresses";
  const wifiAdressesVariable =
    context.environment.find((x) => x.key === "WIFI_ADDRESSES_VARIABLE")?.value || "wifi_addresses";

  // Extract data from scope
  const gnssValue = scope.find((x) => x.variable === gnssSolverVariable)?.value as string;
  const ipAddressValue = scope.find((x) => x.variable === ipAddressVariable)?.value as string;
  const ipAddress = ipAddressValue?.split(";");
  const wifiAddresses = scope.find((x) => x.variable === wifiAdressesVariable)?.metadata as Record<
    string,
    number
  >;

  try {
    // Create payload for AWS position estimate
    const payload = _createAWSPayload(gnssValue, ipAddress?.[0], wifiAddresses);

    // Create AWS IoT Wireless client
    const client = new IoTWirelessClient({
      credentials: {
        accessKeyId: configuration.awsAccessKeyId,
        secretAccessKey: configuration.awsSecretAccessKey,
      },
      region: configuration.awsRegion,
    });

    // Send position estimate command
    const command = new GetPositionEstimateCommand(payload);
    const response = await client.send(command);

    // Extract estimated location from response
    const estimatedLocation = _getEstimatedLocation(response);

    // Send data to TagoIO device
    await Resources.devices.sendDeviceData(
      scope[0].device,
      _createDataForDevice(scope[0], configuration.desireableAccuracyPercent, estimatedLocation)
    );

    console.log("Analysis Finished");
  } catch (error) {
    console.error((error as Error).message);
  }
}

// Use analysis in production
Analysis.use(getEstimatedDeviceLocation);
