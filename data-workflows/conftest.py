import time

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


def verify(expected_list, table, start_time):
    actual_list = table.scan()["Items"]
    end_time = round(time.time() * 1000)
    assert len(actual_list) == len(expected_list)

    def generate_set(map):
        result = set()
        for item in map.items():
            if type(item[1]) == list:
                result.add((item[0], "-".join(item[1])))
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
            if diff[0] == 'last_updated_timestamp' and \
                   start_time <= diff[1] <= end_time:
                return True
        return False
    assert all([is_match(expected) for expected in expected_list])
