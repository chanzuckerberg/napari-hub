from datetime import datetime, timezone, time
from unittest.mock import Mock

import pytest
from dateutil.relativedelta import relativedelta

import activity
from activity.github_activity_model import (
    transform_and_write_to_dynamo,
    GitHubActivityType,
)

REPO1 = "demo/FOO"
REPO2 = "org2/bar"
PLUGIN_BY_REPO = {REPO1: "foo", REPO2: "bar"}


def generate_expected(data, granularity, type_id, ts_formatter, include_expiry=False):
    expected = []

    for repo, values in data.items():
        if repo not in PLUGIN_BY_REPO:
            continue
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


def get_relative_datetime(**args):
    return datetime.now() - relativedelta(**args)


def ts_day_format(date):
    return ts_format(datetime.combine(date, time.min))


def expiry_format(*args, **kwargs):
    formatted_date = datetime.combine(args[0], time.min)
    return int((formatted_date + relativedelta(**kwargs)).timestamp())


def ts_format(timestamp):
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


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
            "demo/FOO": [{"timestamp": get_relative_datetime(days=30)}],
            "org1/baz": [{"timestamp": get_relative_datetime(days=1)}],
            "org2/bar": [{"timestamp": get_relative_datetime(days=23)}],
        }

        transform_and_write_to_dynamo(data, GitHubActivityType.LATEST, PLUGIN_BY_REPO)

        expected = generate_expected(data, "LATEST", "LATEST:{repo}", ts_format)
        mock_batch_write.assert_called_once_with(expected)

    def test_transform_to_dynamo_records_for_month(self, mock_batch_write):
        data = {
            "demo/FOO": [
                {"timestamp": get_relative_datetime(months=24).date(), "count": 2},
                {"timestamp": get_relative_datetime(months=13).date(), "count": 3},
            ],
            "org1/baz": [
                {"timestamp": get_relative_datetime(months=15).date(), "count": 8},
                {"timestamp": get_relative_datetime(months=14).date(), "count": 7},
                {"timestamp": get_relative_datetime(months=12).date(), "count": 8},
                {"timestamp": get_relative_datetime(months=11).date(), "count": 7},
            ],
        }

        transform_and_write_to_dynamo(data, GitHubActivityType.MONTH, PLUGIN_BY_REPO)

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

        expected = generate_expected(data, "TOTAL", "TOTAL:{repo}", lambda ts: None)
        mock_batch_write.assert_called_once_with(expected)
