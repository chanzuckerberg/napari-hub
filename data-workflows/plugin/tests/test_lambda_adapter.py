import json
from unittest.mock import Mock

import boto3

import plugin.lambda_adapter


def test_invoke(monkeypatch):
    function_name = "plugin-lambda"
    monkeypatch.setenv("PLUGINS_LAMBDA_NAME", function_name)
    client_mock = Mock()
    boto_mock = Mock(spec=boto3)
    boto_mock.client.return_value = client_mock
    monkeypatch.setattr(plugin.lambda_adapter, "boto3", boto_mock)

    lambda_adapter = plugin.lambda_adapter.LambdaAdapter()
    lambda_adapter.invoke("foo", "bar")

    # This is intentional, to verify multiple object creation doesn't initialize
    # client multiple times
    plugin.lambda_adapter.LambdaAdapter()

    boto_mock.client.assert_called_once_with("lambda")
    client_mock.invoke.assert_called_once_with(
        FunctionName=function_name,
        InvocationType="Event",
        Payload=json.dumps({"plugin": "foo", "version": "bar"})
    )
