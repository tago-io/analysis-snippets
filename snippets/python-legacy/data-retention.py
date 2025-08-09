# @title: Custom Data Retention
# @description: Automatically remove old data from devices based on custom retention policies
# @tags: data, retention, cleanup, management, automation

"""
Analysis Example
Custom Data Retention

Use your account token to get the list of devices, then go to each device removing the
variables you chooses.

Instructions
To run this analysis you need to add an account token to the environment variables,
To do that, go to your account settings, then token and copy your token.
Go the the analysis, then environment variables,
type account_token on key, and paste your token on value
"""

from tagoio_sdk import Analysis, Account, Device
from tagoio_sdk.modules.Utils.getTokenByName import getTokenByName


# The function myAnalysis will run when you execute your analysis
def my_analysis(context, scope: list):
    # reads the value of account_token from the environment variable
    account_token = next(
        (item for item in context.environment if item["key"] == "account_token"), None
    )

    if not account_token:
        raise ValueError("Missing 'account_token' in the environment variables")

    account = Account({"token": account_token["value"]})

    # Bellow is an empty filter.
    # Examples of filter:
    # { tags: [{ key: 'tag-key', value: 'tag-value' }]}
    # { name: 'name*' }
    # { name: '*name' }
    # { bucket: 'bucket-id' }
    filter = {}

    devices = account.devices.listDevice(
        {
            "page": 1,
            "fields": ["id"],
            "filter": filter,
            "amount": 100,
        }
    )

    for device_obj in devices:
        token = getTokenByName(account, device_obj["id"])
        device = Device({"token": token})

        variables = ["temperature"]
        qty = 100  # remove 100 registers of each variable
        end_date = "30 days"  # registers old than 30 days

        result = device.deleteData(
            {"variables": variables, "qty": qty, "end_date": end_date}
        )
        print(result)


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis(params={"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
