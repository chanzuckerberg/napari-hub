import os

import boto3
import moto.dynamodb.urls
import pytest
from pynamodb.models import Model

LOCAL_DYNAMO_HOST = 'http://localhost:1234'
AWS_REGION = 'us-east-1'
STACK_NAME = 'test-stack'


@pytest.fixture(scope='module')
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture(autouse=True, scope="module")
def setup_local_dynamo():
    moto.dynamodb.urls.url_bases.append(LOCAL_DYNAMO_HOST)


def create_dynamo_table(pynamo_ddb_model: Model):
    pynamo_ddb_model.Meta.host = LOCAL_DYNAMO_HOST
    pynamo_ddb_model.create_table()
    return boto3.resource('dynamodb', region_name=pynamo_ddb_model.Meta.region, endpoint_url=LOCAL_DYNAMO_HOST) \
        .Table(pynamo_ddb_model.Meta.table_name)
