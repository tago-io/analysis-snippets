# @title: MQTT Push
# @description: Push data to MQTT broker from dashboard interactions
# @tags: mqtt, push, broker, dashboard, communication

"""
Analysis Example
Get Device List

Snippet to push data to MQTT. Follow this pattern within your application
If you want more details about MQTT, search "MQTT" in TagoIO help center.
You can find plenty of documentation about this topic.
TagoIO Team.

How to use?
In order to trigger this analysis you must setup a Dashboard.
Create a Widget "Form" and enter the variable 'push_payload' for the device you want to push with the MQTT.
In User Control, select this Analysis in the Analysis Option.
Save and use the form.
"""
from tagoio_sdk import Analysis, Services


# The function myAnalysis will run when you execute your analysis
def my_analysis(context, scope: list[dict]) -> None:
    if not scope:
        return print("This analysis must be triggered by a dashboard.")

    my_data = [obj for obj in scope if obj["variable"] == "push_payload"]
    if not my_data:
        return print("Couldn't find any variable in the scope.")

    # Create your data object to push to MQTT
    # In this case we're sending a JSON object.
    # You can send anything you want.
    # Example:
    # const myDataObject = 'This is a string';
    my_data_object = {
        "variable": "temperature_celsius",
        "value": (int(my_data[0]["value"]) - 32) * (5 / 9),
        "unit": "C",
    }

    # Create a object with the options you chooses
    options = {
        "retain": False,
        "qos": 0,
    }

    # Publishing to MQTT
    MQTT = Services({"token": context.token}).MQTT
    result = MQTT.publish(
        {
            # bucket: myData.bucket, // for legacy devices
            "bucket": my_data[0]["device"],  # for immutable/mutable devices
            "message": str(my_data_object),
            "topic": "tago/my_topic",
            "options": options,
        }
    )
    print(result)


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis({"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
