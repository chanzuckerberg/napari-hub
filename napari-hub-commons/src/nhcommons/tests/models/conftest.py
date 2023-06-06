import boto3
import moto.dynamodb.urls
import pytest

from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper

LOCAL_DYNAMO_HOST = "http://localhost:1234"
AWS_REGION = "us-east-2"
STACK_NAME = "testing-stack"


@pytest.fixture(scope='module')
def aws_credentials():
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture(scope='module')
def dynamo_env_variables():
    moto.dynamodb.urls.url_bases.append(LOCAL_DYNAMO_HOST)
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setenv("LOCAL_DYNAMO_HOST", LOCAL_DYNAMO_HOST)
    monkeypatch.setenv("AWS_REGION", AWS_REGION)
    monkeypatch.setenv("STACK_NAME", STACK_NAME)


@pytest.fixture
def create_dynamo_table(aws_credentials, dynamo_env_variables):
    def _create_dynamo_table(pynamo_ddb_model: PynamoWrapper, table_name: str):
        # reinitializing to override properties with mock environ value
        pynamo_ddb_model = set_ddb_metadata(table_name, pynamo_ddb_model)
        pynamo_ddb_model.create_table()
        return boto3\
            .resource("dynamodb",
                      region_name=AWS_REGION,
                      endpoint_url=LOCAL_DYNAMO_HOST) \
            .Table(f"{STACK_NAME}-{table_name}")

    return _create_dynamo_table
