from datetime import datetime, timezone
from typing import Any, Dict, List

import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb
from nhcommons.models import github_activity


def type_identifier() -> Dict[str, str]:
    return {
        "TOTAL": "TOTAL:{repo}",
        "MONTH": "MONTH:{ts:%Y%m}:{repo}",
        "LATEST": "LATEST:{repo}",
    }

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
    type_id = type_identifier()[granularity].format(ts=timestamp, repo=repo)
    return {
        "plugin_name": name if is_input else name.lower(),
        "type_identifier": type_id,
        type_key: granularity,
        "repo": repo,
        "commit_count": commit_count,
        "timestamp": int(timestamp.timestamp() * 1000) if timestamp else None,
        "expiry": expiry,
    }


def get_relative_utc_datetime(**kwargs) -> datetime:
    return datetime.combine(
        datetime.today() - relativedelta(**kwargs), datetime.min.time(), timezone.utc
    )


def generate_github_activity_list(is_input: bool) -> List[Dict[str, Any]]:
    return [
        generate_github_activity(
            "Plugin-1",
            granularity="LATEST",
            timestamp=get_relative_utc_datetime(days=3),
            repo="Foo/Bar",
            is_input=is_input,
        ),
        generate_github_activity(
            "Plugin-1",
            granularity="MONTH",
            commit_count=10,
            timestamp=get_relative_utc_datetime(months=4).replace(day=1),
            repo="Foo/Bar",
            expiry=int(get_relative_utc_datetime(months=-10).timestamp()),
            is_input=is_input,
        ),
        generate_github_activity(
            "Plugin-1",
            granularity="MONTH",
            commit_count=20,
            timestamp=get_relative_utc_datetime(months=9).replace(day=1),
            repo="Foo/Bar",
            expiry=int(get_relative_utc_datetime(months=-5).timestamp()),
            is_input=is_input,
        ),
        generate_github_activity(
            "Plugin-1",
            granularity="TOTAL",
            commit_count=15,
            repo="Foo/Bar",
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

    @pytest.fixture
    def seed_data(self, table):
        for entry in generate_github_activity_list(False):
            item = {key: val for key, val in entry.items() if val is not None}
            table.put_item(Item=item)

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
            "timestamp": get_relative_utc_datetime(days=3),
        }
        del input_data[excluded_field]
        with pytest.raises(KeyError):
            github_activity.batch_write([input_data])

    @pytest.mark.parametrize("plugin_name, repo, expected", [
        ("Plugin-1", "Foo/Bar", 15),
        ("Plugin-1", "foo/bar", 0),
        ("Plugin-1", "Foo/Baz", 0),
        ("Plugin-7", "Foo/Bar", 0),
        ("Plugin-7", "Bar/Baz", 0),
    ])
    def test_get_total_commits(self, seed_data, plugin_name, repo, expected):
        assert github_activity.get_total_commits(plugin_name, repo) == expected

    @pytest.mark.parametrize("plugin_name, repo, expected", [
        (
                "Plugin-1",
                "Foo/Bar",
                int(get_relative_utc_datetime(days=3).timestamp()) * 1000
        ),
        ("Plugin-1", "foo/bar", None),
        ("Plugin-1", "Foo/Baz", None),
        ("Plugin-7", "Foo/Bar", None),
        ("Plugin-7", "Bar/Baz", None),
    ])
    def test_get_latest_commit(self, seed_data, plugin_name, repo, expected):
        assert github_activity.get_latest_commit(plugin_name, repo) == expected

    @pytest.mark.parametrize("plugin_name, repo, month_delta, expected", [
        ("Plugin-1", "Foo/Bar", 0, {}),
        ("Plugin-1", "foo/bar", 0, {}),
        ("Plugin-1", "Foo/Bar", 12, {4: 10, 9: 20}),
        ("Plugin-1", "foo/bar", 12, {}),
        ("Plugin-7", "Foo/Bar", 12, {}),
        ("Plugin-7", "Bar/Baz", 12, {}),
    ])
    def test_get_timeline(
            self, seed_data, generate_timeline, plugin_name, repo, month_delta, expected
    ):
        actual = github_activity.get_timeline(plugin_name, repo, month_delta)
        assert actual == generate_timeline(expected, month_delta, "commits")
