"""
Analysis Example
Sending downlink using dashboard
Using an Input Widget in the dashboard, you will be able to trigger a downlink to
any LoraWaN network server.
You can get the dashboard template to use here: https://admin.tago.io/template/5f514218d4555600278023c4

Environment Variables
In order to use this analysis, you must setup the Environment Variable table.

account_token: Your account token. Check bellow how to get this.
default_PORT: The default port to be used if not sent by the dashboard.
device_id: The default device id to be used if not sent by the dashboard (OPTIONAL).
payload: The default payload to be used if not sent by the dashboard (OPTIONAL).

Steps to generate an account_token:
1 - Enter the following link: https://admin.tago.io/account/
2 - Select your Profile.
3 - Enter Tokens tab.
4 - Generate a new Token with Expires Never.
5 - Press the Copy Button and place at the Environment Variables tab of this analysis.
"""

from tagoio_sdk import Account, Analysis
from tagoio_sdk.modules.Utils.sendDownlink import sendDownlink


# The function myAnalysis will run when you execute your analysis
def my_analysis(context, scope: list[dict]) -> None:
    account_token = list(
        filter(
            lambda account_token: account_token["key"] == "account_token",
            context.environment,
        )
    )

    if not account_token:
        return ValueError("Missing value: 'account_token' Environment Variable.")

    my_account = Account({"token": account_token[0]["value"]})
    # Get the variables form_payload, form_port and device_id sent by the widget/dashboard.
    payload = list(filter(lambda payload: payload["variable"] == "form_payload", scope))

    if not payload:
        return print('Missing "form_payload" in the data scope.')

    device_id = payload[0]["device_id"]
    payload = payload[0]["payload"]

    port = list(filter(lambda payload: payload["variable"] == "form_port", scope))

    if not port:
        return print('Missing "form_port" in the data scope o.')

    port = port[0]["value"]

    result = sendDownlink(
        account=my_account,
        device_id=device_id,
        dn_options={"port": port, "payload": payload},
    )
    print(result)


# The analysis token in only necessary to run the analysis outside TagoIO
Analysis({"token": "MY-ANALYSIS-TOKEN-HERE"}).init(my_analysis)
