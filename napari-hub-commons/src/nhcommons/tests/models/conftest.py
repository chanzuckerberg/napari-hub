import json
import time
from datetime import datetime, timezone
from typing import Callable, Dict, List

import boto3
import moto.dynamodb.urls
import pytest
from dateutil.relativedelta import relativedelta

from nhcommons.models.pynamo_helper import set_ddb_metadata, PynamoWrapper

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


@pytest.fixture
def verify_table_data():
    start_time = round(time.time() * 1000)

    def _verify(expected_list, table):
        actual_list = table.scan()["Items"]
        end_time = round(time.time() * 1000)
        assert len(actual_list) == len(expected_list)

        def generate_set(input_map: dict) -> set:
            result = set()
            for item in input_map.items():
                if isinstance(item[1], (dict, list)):
                    result.add((item[0], json.dumps(item[1])))
                else:
                    result.add(item)
            return result

        def is_match(expected) -> bool:
            expected_items = generate_set(expected)
            for actual in actual_list:
                diff_items = generate_set(actual) - expected_items
                if len(diff_items) != 1:
                    continue
                diff = diff_items.pop()
                if diff[0] == "last_updated_timestamp" and \
                        start_time <= diff[1] <= end_time:
                    return True
            return False

        assert all([is_match(expected) for expected in expected_list])

    return _verify


@pytest.fixture
def generate_timeline() -> Callable[[Dict, int, str], List[Dict[str, int]]]:
    first_of_month = datetime.combine(
        datetime.today(), datetime.min.time(), timezone.utc
    ).replace(day=1)

    def _generate(
        values_by_ts: Dict[int, int], month_delta: int, value_key: str
    ) -> List[Dict[str, int]]:
        timeline = []
        for i in range(month_delta, 0, -1):
            ts = first_of_month - relativedelta(months=i)
            entry = {
                "timestamp": int(ts.timestamp()) * 1000,
                value_key: values_by_ts.get(i, 0)
            }
            timeline.append(entry)
        return timeline
    return _generate
