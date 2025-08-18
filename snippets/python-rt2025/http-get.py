# @title: HTTP GET Request
# @description: Make HTTP GET requests to external APIs and services
# @tags: http, get, api, request, external

# /// script
# dependencies = [
#   "tagoio-sdk"
# ]
# ///

"""
Analysis Example
Post to HTTP Route

This analysis simple post to an HTTP route. It's a starting example for you to develop more
complex algorithms.
Follow the link of documentation https://api.docs.tago.io/
In this example we get the Account name and print to the console.
"""

import urllib.request

from tagoio_sdk import Analysis


URL_TAGOIO = "https://api.tago.io/info"


def my_analysis(context, scope: list = None) -> dict:
    account_token = next(
        (item for item in context.environment if item["key"] == "account_token"), None
    )

    if not account_token:
        raise ValueError("Missing 'account_token' in the environment variables")

    headers = {"Authorization": account_token["value"]}

    req = urllib.request.Request(URL_TAGOIO, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode("utf-8")
            print(result)
    except Exception as error:
        print(f"{error}")


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis(params={"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
