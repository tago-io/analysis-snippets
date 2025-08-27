# @title: Statistical Data Analysis
# @description: Calculate minimum, maximum, and average values from device variables
# @tags: statistics, average, min, max, data, calculation

# /// script
# dependencies = [
#   "tagoio-sdk"
# ]
# ///

"""
Analysis Example
Minimum, maximum, and average

Get the minimum, maximum, and the average value of the variable temperature from your device,
and save these values in new variables

Instructions
To run this analysis you need to add a device token to the environment variables,
To do that, go to your device, then token and copy your token.
Go the the analysis, then environment variables,
type device_token on key, and paste your token on value
"""

from tagoio_sdk import Analysis, Device


def temperature_minimum(device: Device) -> None:
    """Record the minimum temperature of the last day in the bucket variable

    Args:
        device (Device): Instance of the Device class
    """
    # This is a filter to get the minimum value of the variable temperature in the last day
    min_filter = {"variables": "temperature", "query": "min", "start_date": "1 day"}

    # Now we use the filter for the device to get the data
    # check if the variable min has any value
    # if so, we crete a new object to send to TagoIO
    min_result = device.getData(queryParams=min_filter)

    if min_result:
        min_value = {
            "variable": "temperature_minimum",
            "value": min_result[0]["value"],
            "unit": "F",
        }

        # now we insert the new object with the minimum value
        device.sendData(data=min_value)
        print(f"Temperature Minimum - {min_result[0]['value']}")
    else:
        print("Minimum value not found")


def temperature_maximum(device: Device) -> None:
    """Record the maximum temperature of the last day in the bucket variable

    Args:
        device (Device): Instance of the Device class
    """
    # This is a filter to get the maximum value of the variable temperature in the last day
    max_filter = {
        "variables": "temperature",
        "query": "max",
        "start_date": "1 day",
    }

    max_result = device.getData(queryParams=max_filter)
    if max_result:
        max_value = {
            "variable": "temperature_maximum",
            "value": max_result[0]["value"],
            "unit": "F",
        }

        # now we insert the new object with the Maximum value
        device.sendData(data=max_value)

        print(f"Temperature Maximum - {max_result[0]['value']}")

    else:
        print("Maximum value not found")


def temperature_average(device: Device) -> None:
    """Record the average of the last day's temperatures in the bucket variable

    Args:
        device (Device): Instance of the Device class
    """
    # This is a filter to get the last 1000 values of the variable temperature in the last day
    average_filter = {
        "variable": "temperature",
        "qty": 1000,
        "start_date": "1 day",
    }

    average = device.getData(queryParams=average_filter)
    if average:
        temperature_average = 0
        for item in average:
            temperature_average = float(temperature_average) + float(item["value"])

        temperature_average = temperature_average / len(average)

        average_value = {
            "variable": "temperature_average",
            "value": temperature_average,
            "unit": "F",
        }

        device.sendData(data=average_value)

        print(f"Temperature Average - {temperature_average}")
    else:
        print("No result found for the avg calculation")


# The function myAnalysis will run when you execute your analysis
def my_analysis(context, scope: list) -> None:
    # reads the value of device_token from the environment variable
    device_token = list(
        filter(
            lambda device_token: device_token["key"] == "device_token",
            context.environment,
        )
    )
    device_token = device_token[0]["value"]

    if not device_token:
        raise ValueError("Missing value: 'device_token' Environment Variable.")

    my_device = Device({"token": device_token})

    temperature_minimum(device=my_device)
    temperature_maximum(device=my_device)
    temperature_average(device=my_device)


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis({"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
