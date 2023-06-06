import boto3
import os
import pytest

from pynamodb.models import Model


@pytest.fixture(scope="module")
def aws_credentials():
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


def create_dynamo_table(pynamo_ddb_model: Model, table_name: str):
    pynamo_ddb_model.create_table()
    return boto3.resource("dynamodb", region_name="us-west-2").Table(
        f"local-{table_name}"
    )
