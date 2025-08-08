# @title: Autoscaling Profile Limits
# @description: Monitor and manage autoscaling profile limits and usage
# @tags: autoscaling, profile, limits, monitoring, management

"""
TagoIO - Analysis Example
Auto Scaling analysis

Check out the SDK documentation on: https://js.sdk.tago.io

Ths is a script to automatically check your current usage, and auto-scale your account if needed.
You can get the analysis template with all the Environment Variables here:
        https://admin.tago.io/template/62151212ec8d8f0012c52772

In order to use this analysis, you must setup all the environment variables needed.
You're also required to create an Action of trigger type Schedule, and choose to run this analysis.
In the action you set how often you want to run this script to check your limits. It can set to a minimum of 1 minute.

Environment Variables
In order to use this analysis, you must setup the Environment Variable table.
account_token: Your account token. Check the steps at the end to understand how to generate it.
input: 95. The 95 value will scale data input when it reachs 95% of the usage. Keep it blank to not scale data input.
output: 95
data_records: 95
analysis: 95
sms: 95
email: 95
push_notification: 95
file_storage: 95

Steps to generate an account_token:
1 - Enter the following link: https://admin.tago.io/account/
2 - Select your Profile.
3 - Enter Tokens tab.
4 - Generate a new Token with Expires Never.
5 - Press the Copy Button and place at the Environment Variables tab of this analysis.
"""
from dataclasses import dataclass
from typing import Optional

from tagoio_sdk import Account, Analysis
from tagoio_sdk.modules.Utils.envToJson import envToJson
from tagoio_sdk.modules.Account.Billing_Type import (
    BillingPrices,
    BillingSubscriptionServices,
)


@dataclass
class CheckAutoScaleSource:
    type: str
    current_value: int
    limit: int
    scale: float
    billing: BillingPrices
    account_limit: BillingSubscriptionServices


def check_auto_scale(data: CheckAutoScaleSource) -> Optional[int]:
    # Stop if current use is less than 95% of what was hired.
    if data.limit <= 0 or data.limit * (data.scale * 0.01) > data.current_value:
        return None

    service_billing = next(
        (
            obj
            for obj in data.billing[data.type]
            if obj["amount"] > data.account_limit[data.type]["limit"]
        ),
        None,
    )
    return service_billing["amount"] if service_billing else None


def get_profile_id_by_token(account: Account, token: str) -> Optional[str]:
    profiles = account.profile.list()

    for profile in profiles:
        token_exist = [
            obj
            for obj in account.profile.tokenList(profileID=profile["id"])
            if obj["token"] == token
        ]
        if token_exist:
            return profile["id"]
    raise Exception(
        "Profile not found for the account token in the environment variable"
    )


def my_analysis(context, list: list = None):
    # Get the environment variables and parses it to a JSON
    environment = envToJson(environment=context.environment)

    if not environment:
        raise ValueError("[ERROR] environment variable empty.")

    if not environment.get("account_token"):
        raise ValueError(
            "[ERROR] You must enter a valid account_token in the environment variable"
        )

    # Setup the account and get's the ID of the profile the account token belongs to.
    account = Account({"token": environment["account_token"]})
    profile_id = get_profile_id_by_token(
        account=account, token=environment["account_token"]
    )

    # Get the current subscriptions of our account for all the services.
    services_limit = (account.billing.getSubscription())["services"]

    # get current limit and used resources of the profile.
    summary = account.profile.summary(profileID=profile_id)
    limit, limit_used = summary["limit"], summary["limit_used"]

    # get the tiers of all services, so we know the next tier for our limits.
    billing_prices = account.billing.getPrices()

    # Check each service to see if it needs scaling
    auto_scale_services = {}
    for statistic_key in limit:
        if statistic_key not in environment:
            continue

        if not environment[statistic_key].isnumeric():
            print(
                f"[ERROR] Ignoring {statistic_key}, because the environment variable value is not a number."
            )
            continue

        scale = float(environment[statistic_key])
        if scale == 0:
            continue

        data = CheckAutoScaleSource(
            type=statistic_key,
            current_value=limit_used[statistic_key],
            limit=limit[statistic_key],
            scale=scale,
            billing=billing_prices,
            account_limit=services_limit,
        )
        result = check_auto_scale(data=data)
        if result:
            auto_scale_services[statistic_key] = {"limit": result}

    # Stop if no auto-scale needed
    if not auto_scale_services:
        print("Services are okay, no auto-scaling needed.")
        return "Services are okay, no auto-scaling needed."

    print(f"Auto-scaling the services: {', '.join(auto_scale_services.keys())}")
    # Update our subscription, so we are actually scaling the account.
    try:
        billing_success = account.billing.editSubscription(
            subscription={"services": auto_scale_services}
        )
    except Exception as error:
        print(f"[ERROR] {error}")
        return error

    if not billing_success:
        return

    # Stop here if account has only one profile. No need to reallocate resources
    profiles = account.profile.list()
    if len(profiles) > 1:
        # Make sure we realocate only what we just subscribed
        amount_to_relocate = {}
        for key in services_limit:
            amount_to_relocate[key] = services_limit[key]["limit"] - (
                amount_to_relocate.get(key, {}).get("limit", 0)
            )

        # Allocate all the subscribed limit to the profile.
        try:
            account.billing.editAllocation(
                allocation={
                    "profile": profile_id,
                    **amount_to_relocate,
                }
            )
        except Exception as error:
            print(f"[ERROR] {error}")
            return error

    return billing_success


# The analysis token in only necessary to run the analysis outside TagoIO
# To run the tests you need to comment out the line below
Analysis(params={"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
