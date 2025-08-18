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
import type { 
  AnalysisEnvironment, 
  TagoContext, 
  BillingPrices
} from "jsr:@tago-io/sdk";

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
function getNextTier(serviceValues: { amount: number }[], accountLimit: number): number | undefined {
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
function getAccountLimit(servicesLimit: Record<string, unknown>): Record<string, { limit: number }> {
  return Object.keys(servicesLimit).reduce((result: Record<string, { limit: number }>, key) => {
    result[key] = servicesLimit[key] as { limit: number };

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
      filter: {
        token
      }
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
  prices: Record<string, { amount: number }[]>,
  profileLimit: Record<string, number>,
  profileLimitUsed: Record<string, number>,
  accountLimit: Record<string, { limit: number }>,
  environment: AnalysisEnvironment
): Record<string, { limit: number }> | null {
  const autoScaleServices: Record<string, { limit: number }> = {};
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
  accountLimit: Record<string, { limit: number }>,
  autoScaleServices: Record<string, { limit: number }>,
  profileAllocation: Record<string, number>
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
function setupEnvironment(context: TagoContext): AnalysisEnvironment {
  const environment = Utils.envToJson(context.environment) as AnalysisEnvironment;
  if (!environment) {
    throw new Error("Environment variables not found");
  }

  if (!environment.account_token || environment.account_token.length !== 36) {
    throw new Error("[ERROR] You must enter a valid account_token in the environment variable");
  }

  return environment;
}

// This function will run when you execute your analysis
async function startAnalysis(context: TagoContext): Promise<void> {
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
  const billingPrices: BillingPrices = await account.billing.getPrices();

  // Transform billing data to the format expected by calculateAutoScale
  const billing: Record<string, { amount: number }[]> = {};
  if (billingPrices && typeof billingPrices === 'object') {
    Object.entries(billingPrices).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        billing[key] = value.map((item: unknown) => ({
          amount: typeof item === 'object' && item !== null && 'price' in item 
            ? (item as { price: number }).price 
            : typeof item === 'object' && item !== null && 'amount' in item
            ? (item as { amount: number }).amount 
            : 0
        }));
      }
    });
  }

  // Check each service to see if it needs scaling
  // Extract the limits from the ProfileLimit objects
  const profileLimits = (limit as { limits?: Record<string, number> })?.limits || (limit as unknown as Record<string, number>);
  const profileLimitsUsed = (limit_used as { limits?: Record<string, number> })?.limits || (limit_used as unknown as Record<string, number>);
  
  const autoScaleServices = calculateAutoScale(
    billing,
    profileLimits,
    profileLimitsUsed,
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
  try {
    await account.billing.editSubscription({
      services: autoScaleServices,
    });
  } catch (error) {
    console.error('Failed to update subscription:', error);
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
    const amountToReallocate = reallocateProfiles(accountLimit, autoScaleServices, profileLimits);

    console.info("New allocation:");
    if (amountToReallocate) {
      for (const service in amountToReallocate) {
        console.info(`${service} from ${profileLimits?.[service]} to ${amountToReallocate?.[service]}`);
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
