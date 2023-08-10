import time
from typing import Callable

import boto3
import moto.dynamodb.urls
import pytest

LOCAL_DYNAMO_HOST = "http://localhost:1234"
AWS_REGION = "us-east-1"
STACK_NAME = "test-stack"


@pytest.fixture(autouse=True)
def aws_credentials(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_SECURITY_TOKEN", "testing")
    monkeypatch.setenv("AWS_SESSION_TOKEN", "testing")


@pytest.fixture(autouse=True)
def env_variables(monkeypatch):
    monkeypatch.setenv("LOCAL_DYNAMO_HOST", LOCAL_DYNAMO_HOST)
    monkeypatch.setenv("AWS_REGION", AWS_REGION)
    monkeypatch.setenv("STACK_NAME", STACK_NAME)


# Dynamo helper functions
@pytest.fixture(scope="package", autouse=True)
def setup_local_dynamo():
    moto.dynamodb.urls.url_bases.append(LOCAL_DYNAMO_HOST)


@pytest.fixture
def setup_dynamo():
    def _setup():
        from nhcommons.models.plugin_metadata import _PluginMetadata
        _PluginMetadata.create_table()
        return boto3.resource(
            "dynamodb", region_name=AWS_REGION, endpoint_url=LOCAL_DYNAMO_HOST
        ).Table(f"{STACK_NAME}-plugin-metadata")
    return _setup


@pytest.fixture
def create_and_put_item():
    def _create_item(plugin, version, data, include_last_updated_ts):
        item = {
            "name": plugin,
            "version_type": f"{version}:DISTRIBUTION",
            "version": version,
            "type": "DISTRIBUTION",
            "data": data,
        }
        if include_last_updated_ts:
            item["last_updated_timestamp"] = round(time.time() * 1000)
        return item
    return _create_item


@pytest.fixture
def verify_plugin_item(create_and_put_item) -> Callable:
    def _verify_plugin_item(
            table, name, version, start_time=None, last_updated_ts=None
    ) -> None:
        actual = table.get_item(
            Key={"name": name, "version_type": f"{version}:DISTRIBUTION"}
        )["Item"]
        expected_item = create_and_put_item(name, version, None, False)
        expected_item.pop("data")
        for key, value in expected_item.items():
            assert actual.get(key) == value

        if start_time:
            assert start_time <= actual["last_updated_timestamp"]
        elif last_updated_ts:
            assert last_updated_ts == actual["last_updated_timestamp"]
        return actual.get("data")
    return _verify_plugin_item
