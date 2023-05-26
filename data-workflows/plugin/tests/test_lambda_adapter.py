import json
from unittest.mock import Mock

import plugin.lambda_adapter


def test_invoke(monkeypatch):
    function_name = "plugin-lambda"
    monkeypatch.setenv("PLUGINS_LAMBDA_NAME", function_name)
    boto_mock = Mock()
    client_mock = Mock()
    boto_mock.client.return_value = client_mock
    monkeypatch.setattr(plugin.lambda_adapter, "boto3", boto_mock)

    lambda_adapter = plugin.lambda_adapter.LambdaAdapter()
    lambda_adapter.invoke("foo", "bar")

    boto_mock.client.assert_called_once_with("lambda")
    client_mock.invoke.assert_called_once_with(
        FunctionName=function_name,
        InvocationType="Event",
        Payload=json.dumps({"plugin": "foo", "version": "bar"})
    )
