# @title: Console Hello World
# @description: Basic hello world example showing how to send messages to the analysis console
# @tags: basic, console, hello, logging, debug

# /// script
# dependencies = [
#   "tagoio-sdk"
# ]
# ///

"""
Analysis Example
Hello World

Learn how to send messages to the console located on the TagoIO analysis screen.
You can use this principle to show any information during and after development.
"""
from tagoio_sdk import Analysis

# The function myAnalysis will run when you execute your analysis
def myAnalysis(context, scope: list) -> None:
    # This will log "Hello World" at the TagoIO Analysis console
    print("Hello World")

    #  This will log the environment to the TagoIO Analysis console
    print("Environment:", context.environment)

    #  This will log the scope to the TagoIO Analysis console
    print("my scope:", scope)

# The analysis token in only necessary to run the analysis outside TagoIO
Analysis({"token": "MY-ANALYSIS-TOKEN-HERE"}).init(myAnalysis)