
import boto3
import pytest

from pynamodb.models import Model


@pytest.fixture(scope="module")
def aws_credentials():
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")


def create_dynamo_table(pynamo_ddb_model: Model, table_name: str):
    pynamo_ddb_model.create_table()
    return boto3.resource("dynamodb", region_name="us-west-2").Table(
        f"None-{table_name}"
    )
