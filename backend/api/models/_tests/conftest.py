from datetime import datetime, date, timezone

import boto3
import moto.dynamodb.urls
import pytest
from pynamodb.models import Model

from api.models.helper import set_ddb_metadata

LOCAL_DYNAMO_HOST = "http://localhost:1234"
AWS_REGION = "us-east-2"
STACK_NAME = "testing-stack"


@pytest.fixture(scope="module")
def aws_credentials():
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture(scope="module")
def dynamo_env_variables():
    moto.dynamodb.urls.url_bases.append(LOCAL_DYNAMO_HOST)
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("LOCAL_DYNAMO_HOST", LOCAL_DYNAMO_HOST)
    monkeypatch.setenv("AWS_REGION", AWS_REGION)
    monkeypatch.setenv("STACK_NAME", STACK_NAME)


@pytest.fixture
def date_utc_today() -> datetime:
    today = datetime.combine(date.today(), datetime.min.time())
    return today.replace(tzinfo=timezone.utc)


def create_dynamo_table(pynamo_ddb_model: Model, table_name: str):
    set_ddb_metadata(table_name, pynamo_ddb_model)
    pynamo_ddb_model.create_table()
    return boto3.resource("dynamodb", region_name=AWS_REGION)\
        .Table(f"{STACK_NAME}-{table_name}")
