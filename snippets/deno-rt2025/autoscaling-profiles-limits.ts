// @title: Autoscaling Profile Limits
// @description: Monitor and manage autoscaling profile limits and usage
// @tags: autoscaling, profile, limits, monitoring, management

/*
 * TagoIO - Analysis Example
 * Auto Scaling analysis
 *
 * Check out the SDK documentation on: https://js.sdk.tago.io
 *
 * Ths is a script to automatically check your current usage, and auto-scale your account if needed.
 * You can get the analysis template with all the Environment Variables here:
 *          https://admin.tago.io/template/62151212ec8d8f0012c52772
 *
 * In order to use this analysis, you must setup all the environment variables needed.
 * You're also required to create an Action of trigger type Schedule,
 *  and choose to run this analysis.
 * In the action you set how often you want to run this script to check your limits.
 * It can set to a minimum of 1 minute.
 *
 * Environment Variables
 * In order to use this analysis, you must setup the Environment Variable table.
 *   account_token: Your account token. Check the steps at the end to understand how to generate it.
 *   The 95 value will scale data input when it reach 95% of the usage.
 *   Keep it blank to not scale data input.
 *   input: 95
 *   output: 95
 *   data_records: 95
 *   analysis: 95
 *   sms: 95
 *   email: 95
 *   push_notification: 95
 *   file_storage: 95
 *
 * Steps to generate an account_token:
 * 1 - Enter the following link: https://admin.tago.io/account/
 * 2 - Select your Profile.
 * 3 - Enter Tokens tab.
 * 4 - Generate a new Token with Expires Never.
 * 5 - Press the Copy Button and place at the Environment Variables tab of this analysis.
 */

import { Analysis, Account, Utils } from "jsr:@tago-io/sdk";
import type { AnalysisConstructorParams } from "jsr:@tago-io/sdk";

interface ServiceValue {
  amount: number;
}

interface ServiceLimit {
  limit: number;
}

interface ServiceLimits {
  [key: string]: number;
}

interface AccountLimit {
  [key: string]: ServiceLimit;
}

interface AutoScaleServices {
  [key: string]: ServiceLimit;
}

interface Environment {
  account_token: string;
  [key: string]: string;
}

/**
 * Check if service needs autoscaling
 * @param currentUsage current usage of the profile
 * @param allocated limit allocated of the profile
 * @param scale percentage of usage to allow scaling up
 */
function checkAutoScale(currentUsage: number, allocated: number, scale: number): boolean {
  if (!scale || !allocated) {
    return false;
  }
  const threshold = allocated * (scale * 0.01);

  return threshold <= currentUsage;
}

/**
 *  Get next valid service limit
 */
function getNextTier(serviceValues: ServiceValue[], accountLimit: number): number | undefined {
  if (!accountLimit) {
    return undefined;
  }
  const nextValue = serviceValues
    .sort((a, b) => a.amount - b.amount)
    .find(({ amount }) => amount > accountLimit);

  return nextValue?.amount || undefined;
}

/**
 * Parses the current limit of the account
 */
function getAccountLimit(servicesLimit: Record<string, any>): AccountLimit {
  return Object.keys(servicesLimit).reduce((result: AccountLimit, key) => {
    result[key] = servicesLimit[key];

    return result;
  }, {});
}

/**
 * Find the ID of the profile from the token being used.
 */
async function getProfileIDByToken(account: Account, token: string): Promise<string | false> {
  const profiles = await account.profiles.list();
  for (const profile of profiles) {
    const [token_exist] = await account.profiles.tokenList(profile.id, {
      token,
    });
    if (token_exist) {
      return profile.id;
    }
  }
  return false;
}

/**
 * Calculate services to be scaled
 */
function calculateAutoScale(
  prices: Record<string, ServiceValue[]>,
  profileLimit: ServiceLimits,
  profileLimitUsed: ServiceLimits,
  accountLimit: AccountLimit,
  environment: Environment
): AutoScaleServices | null {
  const autoScaleServices: AutoScaleServices = {};
  for (const statisticKey in profileLimit) {
    if (!environment[statisticKey]) {
      continue;
    }

    const scale = Number(environment[statisticKey]);
    if (scale <= 0) {
      continue;
    }

    if (Number.isNaN(scale)) {
      console.error(
        `[ERROR] Ignoring ${statisticKey}, because the environment variable value is not a number.\n`
      );
      continue;
    }

    const needAutoScale = checkAutoScale(
      profileLimitUsed[statisticKey],
      profileLimit[statisticKey],
      scale
    );

    if (!needAutoScale) {
      continue;
    }

    const nextTier = getNextTier(prices[statisticKey], accountLimit[statisticKey]?.limit);

    if (nextTier) {
      autoScaleServices[statisticKey] = { limit: nextTier };
    }
  }

  if (!Object.keys(autoScaleServices).length) {
    return null;
  }

  return autoScaleServices;
}

function reallocateProfiles(
  accountLimit: AccountLimit,
  autoScaleServices: AutoScaleServices,
  profileAllocation: ServiceLimits
): Record<string, number> | null {
  const newAllocation: Record<string, number> = {};

  for (const service in autoScaleServices) {
    const newAccountLimit = autoScaleServices?.[service]?.limit || 0;
    const oldAccountLimit = accountLimit?.[service]?.limit || 0;

    const difference = newAccountLimit - oldAccountLimit;

    if (Number.isNaN(difference) || difference <= 0) {
      continue;
    }

    const currentAllocation = profileAllocation?.[service] || 0;

    newAllocation[service] = difference + currentAllocation;
  }

  if (!Object.keys(newAllocation).length) {
    return null;
  }

  return newAllocation;
}

/**
 * Get the environment variables and parses it to a JSON
 */
function setupEnvironment(context: AnalysisConstructorParams): Environment {
  const environment = Utils.envToJson(context.environment) as Environment;
  if (!environment) {
    throw new Error("Environment variables not found");
  }

  if (!environment.account_token || environment.account_token.length !== 36) {
    throw new Error("[ERROR] You must enter a valid account_token in the environment variable");
  }

  return environment;
}

// This function will run when you execute your analysis
async function startAnalysis(context: AnalysisConstructorParams): Promise<void> {
  const environment = setupEnvironment(context);

  // Setup the account and get's the ID of the profile the account token belongs to.
  const account = new Account({ token: environment.account_token });
  const id = await getProfileIDByToken(account, environment.account_token);
  if (!id) {
    throw new Error("Profile not found for the account token in the environment variable");
  }

  // Get the current subscriptions of our account for all the services.
  const { services: servicesLimit } = await account.billing.getSubscription();
  const accountLimit = getAccountLimit(servicesLimit);

  // get current limit and used resources of the profile.
  const { limit, limit_used } = await account.profiles.summary(id);

  // get the tiers of all services, so we know the next tier for our limits.
  const billing = await account.billing.getPrices();

  // Check each service to see if it needs scaling
  const autoScaleServices = calculateAutoScale(
    billing,
    limit,
    limit_used,
    accountLimit,
    environment
  );

  // Stop if no auto-scale needed
  if (!autoScaleServices) {
    console.info("Services are okay, no auto-scaling needed.");
    return;
  }

  console.info("Auto-scaling the services:");
  for (const service in autoScaleServices) {
    console.info(
      `${service} from ${accountLimit?.[service]?.limit} to ${autoScaleServices?.[service]?.limit}`
    );
  }

  // Update our subscription, so we are actually scaling the account.
  const billing_success = await account.billing.editSubscription({
    services: autoScaleServices,
  });

  if (!billing_success) {
    return;
  }

  // Stop here if account has only one profile. No need to reallocate resources
  const profiles = await account.profiles.list();
  if (profiles.length > 1) {
    // Wait purchase to be completed
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    // Make sure we reallocate only what we just subscribed
    const amountToReallocate = reallocateProfiles(accountLimit, autoScaleServices, limit);

    console.info("New allocation:");
    if (amountToReallocate) {
      for (const service in amountToReallocate) {
        console.info(`${service} from ${limit?.[service]} to ${amountToReallocate?.[service]}`);
      }

      // Allocate all the subscribed limit to the profile.
      await account.billing.editAllocation([
        {
          profile: id,
          ...amountToReallocate,
        },
      ]);
    }
  }
}

Analysis.use(startAnalysis);
