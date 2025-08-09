# @title: Generate PDF Report
# @description: Generate PDF reports from device data and send via email
# @tags: pdf, report, generation, email, data

"""
Analysis Example
Generate pdf report and send via email

Instructions
To run this analysis you need to add a email and device_token to the environment variables,
Go the the analysis, then environment variables,
type email on key, and insert your email on value
type device_token on key and insert your device token on value
"""

import base64
from datetime import datetime

from tagoio_sdk import Analysis, Device, Services
from tagoio_sdk.modules.Utils.envToJson import envToJson

DEVICE_VARIABLES = [
    "your_variable"
]  # enter the variable from your device you would like


def html_content_for_pdf(dataVal, dataVar) -> None:
    return f"""
    <head>
        <style>
            body, html {{
                margin: 0;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
            }}
            td {{
                border: 1px solid black;
                padding: 5px;
                padding-bottom: 25px;
                font-style: italic;
            }}
        </style>
    </head>
    <body>
    <table>
        <tr>
            <td colspan="7">Issue date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</td>
        </tr>
        <tr>
            <td colspan="4">Start date: 2020-05-20 10:21:32</td>
            <td colspan="3">Stop date: 2020-10-08 22:56:19</td>
        </tr>
        <tr>
            <td colspan="4"> Report of the {dataVar}</td>
            <td colspan="3">Device Kitchen Oven 5</td>
        </tr>
        <tr>
            <td>Counter</td>
            <td>{dataVar}</td>
            <td>Time</td>
            <td>Date</td>
            <td>Temperature 2</td>
            <td>Time</td>
            <td>Date</td>
        </tr>
        <tr>
        <td>2</td>
        <td>{dataVal}</td>
        <td>10:53:20</td>
        <td>2020-06-10</td>
        <td>137</td>
        <td>10:53:20</td>
        <td>2020-06-10</td>
        </tr>
    </table>
    </body>
    </html>
    """


# The function myAnalysis will run when you execute your analysis
def my_analysis(context: any, scope: list = None) -> None:
    # reads the values from the environment and saves it in the variable envVars
    envVars = envToJson(context.environment)

    if not envVars.get("email"):
        raise ValueError("email environment variable not found")
    if not envVars.get("device_token"):
        raise ValueError("device_token environment variable not found")

    device = Device({"token": envVars["device_token"]})

    variables_buckets = device.getData(
        {
            "variables": DEVICE_VARIABLES,
            "start_date": "1 month",
            "qty": 10,
        }
    )

    dataParsed = "variable,value,unit,time"

    for variable in variables_buckets:
        dataParsed = f"{variable.get('variable')},{variable.get('value')},{variable.get('unit')},{variable.get('time')}"

    dataArray = dataParsed.split(",")
    dataVar = dataArray[0]
    dataVal = dataArray[1]

    html = html_content_for_pdf(dataVal, dataVar)

    options = {
        "displayHeaderFooter": True,
        "footerTemplate": '<div class="page-footer" style="width:100%; text-align:center; font-size:12px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
        "margin": {
            "top": "1.5cm",
            "right": "1.5cm",
            "left": "1.5cm",
            "bottom": "1.5cm",
        },
    }

    base_64 = base64.b64encode(html.encode("utf-8")).decode("utf-8")

    # start the PDF service
    pdfService = Services({"token": context.token}).PDF
    pdf_base64 = pdfService.generate(
        {
            "base64": base_64,
            "options": options,
        }
    )

    # Start the email service
    emailService = Services({"token": context.token}).email

    # Send the email.
    emailService.send(
        {
            "to": envVars["email"],
            "subject": "Exported File from TagoIO",
            "message": "This is an example of a body message",
            "attachment": {
                "archive": pdf_base64.json()["result"],
                "type": "base64",
                "filename": "exportedfile.pdf",
            },
        }
    )

    print("Email sent successfully")


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis(params={"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
