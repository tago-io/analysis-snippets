# @title: Email Export
# @description: Export data and send via email as attachments
# @tags: email, export, data, attachment, reporting

# /// script
# dependencies = [
#   "tagoio-sdk"
# ]
# ///

"""
Analysis Example
Email export

Learn how to send an email with data in a .csv file attachment.

This analysis will read the variable fuel_level from your device,
and send the values in a .csv file to an e-mail address

Instructions
To run this analysis you need to add a device token and the e-mail to the environment variables.
To do that, go to your device, then token and copy your token.
Go the the analysis, then environment variables,
type device_token on key, and paste your token on value
click the + button to add a new environment
on key, type email and on value, type the e-mail address
"""

from tagoio_sdk import Analysis, Device, Services
from tagoio_sdk.modules.Utils import envToJson


# The function myAnalysis will run when you execute your analysis
def my_analysis(context, scope: list[dict] = None) -> None:
    # reads the values from the environment and saves it in the variable env_vars
    env_vars = envToJson.envToJson(context.environment)

    if not env_vars.get("device_token"):
        raise ValueError("Missing value: 'device_token' environment variable not found")

    if not env_vars.get("email"):
        raise ValueError("Missing value: 'email' environment variable not found")

    device = Device({"token": env_vars["device_token"]})

    # Get the 5 last records of the variable fuel_level in the device bucket.
    fuel_list = device.getData({"variable": "fuel_level", "qty": 5})

    # Create csv header
    csv = "Fuel Level"

    # For each record in the fuel_list, add the value in the csv text.
    # Use \n to break the line.
    for item in fuel_list:
        csv = f"{csv},\n{item['value']}"

    # Print the csv text to the TagoIO analysis console, as a preview
    print(csv)

    # Start the email service
    email = Services({"token": context.token}).email

    # Send the email.
    service_response = email.send(
        {
            "message": "This is an example of a body message",
            "subject": "Exported File from TagoIO",
            "to": env_vars["email"],
            "attachment": {
                "archive": csv,
                "filename": "exported_file.csv",
            },
        }
    )

    print(service_response)


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis(params={"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
