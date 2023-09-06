from datetime import datetime
from typing import Any, Dict, List

import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb
from nhcommons.models import github_activity


def get_type_identifier(granularity: str, timestamp: datetime, repo: str) -> str:
    if granularity == "TOTAL":
        return f"TOTAL:{repo}"
    elif granularity == "MONTH":
        return f"""MONTH:{timestamp.strftime("%Y%m")}:{repo}"""

    return f"LATEST:{repo}"


def generate_github_activity(
    name: str,
    granularity: str,
    repo: str,
    is_input: bool,
    timestamp: datetime = None,
    commit_count: int = None,
    expiry: int = None,
) -> dict:
    type_key = "granularity" if is_input else "type"
    github_activity_item = {
        "plugin_name": name if is_input else name.lower(),
        "type_identifier": get_type_identifier(granularity, timestamp, repo),
        type_key: granularity,
        "repo": repo,
    }
    if timestamp:
        github_activity_item["timestamp"] = int(timestamp.timestamp() * 1000)
    if commit_count:
        github_activity_item["commit_count"] = commit_count
    if expiry:
        github_activity_item["expiry"] = expiry
    return github_activity_item


def get_relative_timestamp(**args) -> datetime:
    return (datetime.now() - relativedelta(**args)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def generate_github_activity_list(is_input: bool) -> List[Dict[str, Any]]:
    return [
        generate_github_activity(
            name="Foo",
            granularity="LATEST",
            timestamp=get_relative_timestamp(days=3),
            repo="foo/bar",
            is_input=is_input,
        ),
        generate_github_activity(
            name="Foo",
            granularity="MONTH",
            commit_count=10,
            timestamp=get_relative_timestamp(months=4),
            repo="foo/bar",
            expiry=int(get_relative_timestamp(months=-14).timestamp()),
            is_input=is_input,
        ),
        generate_github_activity(
            name="Foo",
            granularity="TOTAL",
            commit_count=15,
            repo="foo/bar",
            is_input=is_input,
        ),
    ]


class TestGithubActivity:
    @pytest.fixture()
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(
                github_activity._GitHubActivity, "github-activity"
            )

    def test_batch_write(self, table, verify_table_data):
        github_activity.batch_write(generate_github_activity_list(True))

        verify_table_data(generate_github_activity_list(False), table)

    @pytest.mark.parametrize(
        "excluded_field", ["plugin_name", "type_identifier", "granularity", "repo"]
    )
    def test_batch_write_for_invalid_data(self, excluded_field, table):
        input_data = {
            "plugin_name": "Foo",
            "type_identifier": "LATEST:foo/bar",
            "commit_count": 15,
            "granularity": "LATEST",
            "repo": "foo/bar",
            "timestamp": get_relative_timestamp(days=3),
        }
        del input_data[excluded_field]
        with pytest.raises(KeyError):
            github_activity.batch_write([input_data])
