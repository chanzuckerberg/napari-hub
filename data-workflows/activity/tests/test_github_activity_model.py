import re
from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from dateutil.relativedelta import relativedelta

import activity
from activity.github_activity_model import (
    GitHubActivityType,
    transform_and_write_to_dynamo,
)

REPO1 = "demo/FOO"
REPO2 = "org2/bar"
PLUGIN_BY_REPO = {REPO1: "foo", REPO2: "bar"}
PLUGIN_BY_EARLIEST_TS = {
    REPO1: datetime.strptime("05/16/2023 10:24:20", "%m/%d/%Y %H:%M:%S"),
    REPO2: datetime.strptime("06/26/2023 20:30:00", "%m/%d/%Y %H:%M:%S"),
}
FORMATTED_PLUGIN_BY_TS = {
    repo: ts.replace(day=1) for repo, ts in PLUGIN_BY_EARLIEST_TS.items()
}


def generate_expected(data, granularity, type_id, ts_formatter, include_expiry=False):
    expected = []
    for repo, values in data.items():
        for val in values:
            ts = val.get("timestamp")
            item = {
                "plugin_name": PLUGIN_BY_REPO.get(repo).lower(),
                "type_identifier": f"{type_id.format(repo=repo, ts=ts)}",
                "granularity": granularity,
                "timestamp": ts_formatter(ts),
                "commit_count": val.get("count"),
                "repo": repo,
                "expiry": expiry_format(ts, months=14) if include_expiry else None,
            }

            expected.append(item)
    return expected


def get_relative_timestamp(**args):
    return datetime.now() - relativedelta(**args)


def ts_day_format(timestamp):
    date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
    return ts_format(date)


def expiry_format(*args, **kwargs):
    return int((args[0] + relativedelta(**kwargs)).timestamp())


def ts_format(timestamp):
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


def remove_whitespace(formatted_str: str) -> str:
    return re.compile(r"[ \t]+").sub(" ", formatted_str).strip()


def get_subquery(activity_type) -> str:
    if activity_type != GitHubActivityType.MONTH:
        filters = [f"'{repo}'" for repo in FORMATTED_PLUGIN_BY_TS.keys()]
        return f"repo IN ({','.join(filters)})"

    return " OR ".join(
        [
            f"repo = '{repo}' AND TO_TIMESTAMP(commit_author_date) >= "
            f"TO_TIMESTAMP('{ts}')"
            for repo, ts in FORMATTED_PLUGIN_BY_TS.items()
        ]
    )


@pytest.mark.parametrize(
    "activity_type, timestamp, type_id, projection, group_by, expiry",
    [
        (
            GitHubActivityType.LATEST,
            1679394260000,
            f"LATEST:{REPO1}",
            "TO_TIMESTAMP(MAX(commit_author_date)) AS latest_commit",
            "name",
            None,
        ),
        (
            GitHubActivityType.MONTH,
            1679356800000,
            f"MONTH:202303:{REPO1}",
            "DATE_TRUNC('month', TO_DATE(commit_author_date)) AS month, "
            "COUNT(*) AS commit_count",
            "name, month",
            1716312260,
        ),
        (
            GitHubActivityType.TOTAL,
            None,
            f"TOTAL:{REPO1}",
            "COUNT(*) AS commit_count",
            "name",
            None,
        ),
    ],
)
def test_github_activity_type(
    activity_type, timestamp, type_id, projection, group_by, expiry
):
    input_ts = datetime.strptime("03/21/2023 10:24:20", "%m/%d/%Y %H:%M:%S")
    assert activity_type.format_to_timestamp(input_ts) == timestamp
    assert activity_type.format_to_type_identifier(REPO1, input_ts) == type_id
    expected_query = f"""
        SELECT
            repo AS name,
            {projection}
        FROM
            imaging.github.commits
        WHERE 
            repo_type = 'plugin'
            AND ({get_subquery(activity_type)})
        GROUP BY {group_by}
        ORDER BY {group_by}
    """
    actual = activity_type.get_query(PLUGIN_BY_EARLIEST_TS)
    assert remove_whitespace(actual) == remove_whitespace(expected_query)
    assert activity_type.to_expiry(input_ts) == expiry


class TestGitHubActivityModels:
    @pytest.fixture
    def mock_batch_write(self, monkeypatch):
        mock_batch_write = Mock()
        monkeypatch.setattr(
            activity.github_activity_model, "batch_write", mock_batch_write
        )
        return mock_batch_write

    def test_transform_to_dynamo_records_for_latest(self, mock_batch_write):
        data = {
            "demo/FOO": [{"timestamp": get_relative_timestamp(days=30)}],
            "org1/baz": [{"timestamp": get_relative_timestamp(days=1)}],
            "org2/bar": [{"timestamp": get_relative_timestamp(days=23)}],
        }

        transform_and_write_to_dynamo(data, GitHubActivityType.LATEST, PLUGIN_BY_REPO)

        data.pop("org1/baz")
        expected = generate_expected(data, "LATEST", "LATEST:{repo}", ts_format)
        mock_batch_write.assert_called_once_with(expected)

    def test_transform_to_dynamo_records_for_month(self, mock_batch_write):
        data = {
            "demo/FOO": [
                {"timestamp": get_relative_timestamp(months=24), "count": 2},
                {"timestamp": get_relative_timestamp(months=13), "count": 3},
            ],
            "org1/baz": [
                {"timestamp": get_relative_timestamp(months=15), "count": 8},
                {"timestamp": get_relative_timestamp(months=14), "count": 7},
                {"timestamp": get_relative_timestamp(months=12), "count": 8},
                {"timestamp": get_relative_timestamp(months=11), "count": 7},
            ],
        }

        transform_and_write_to_dynamo(data, GitHubActivityType.MONTH, PLUGIN_BY_REPO)

        data.pop("org1/baz")
        expected = generate_expected(
            data, "MONTH", "MONTH:{ts:%Y%m}:{repo}", ts_day_format, True
        )
        mock_batch_write.assert_called_once_with(expected)

    def test_transform_to_dynamo_records_for_total(self, mock_batch_write):
        data = {
            "demo/FOO": [{"count": 13}],
            "org1/baz": [{"count": 23}],
            "org2/bar": [{"count": 65}],
        }

        transform_and_write_to_dynamo(data, GitHubActivityType.TOTAL, PLUGIN_BY_REPO)

        data.pop("org1/baz")
        expected = generate_expected(data, "TOTAL", "TOTAL:{repo}", lambda ts: None)
        mock_batch_write.assert_called_once_with(expected)
