# @title: Send Notification
# @description: Send notifications via email, SMS, or push notification to users
# @tags: notification, email, sms, push, messaging

"""
Analysis Example
Send Notification to Yourself

The main function used by TagoIO to run the script.
It sends a notification to the account owner.

Environment Variables
You must setup the following Environment Variables:
message - Your Message
title - Your Title
"""
from tagoio_sdk import Analysis
from tagoio_sdk import Services
from tagoio_sdk.modules.Account.Notification_Type import NotificationCreate


def send_notification(token_profile: str, object: NotificationCreate) -> None:
    """	Send Notification to Yourself

    Args:
		object (NotificationCreate): Notification Object
    """
    notification = Services({"token": token_profile}).Notification
    notification.send(notification=object)


# The function myAnalysis will run when you execute your analysis
def my_analysis(context, scope: list) -> None:
    message = list(
        filter(lambda message: message["key"] == "message", context.environment)
    )
    if not message:
        raise ValueError("Missing value: 'message' not found in environment variables")
    message = message[0].get("value")

    title = list(filter(lambda title: title["key"] == "title", context.environment))
    if not title:
        raise ValueError("Missing value: 'title' not found in environment variables")
    title = title[0]["value"]

    send_notification(
        token_profile=context.token, object={"message": message, "title": title}
    )


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis({"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
