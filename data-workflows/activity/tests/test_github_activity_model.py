from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from dateutil.relativedelta import relativedelta

from activity.github_activity_model import (
    GitHubActivity, GitHubActivityType, transform_and_write_to_dynamo
)


PLUGIN_BY_REPO = {"demo/FOO": "foo", "org2/bar": "bar"}


def generate_expected(data, granularity, type_id, ts_formatter):
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
            }

            expected.append(GitHubActivity(**item))
    return expected


def get_relative_timestamp(**args):
    return datetime.now() - relativedelta(**args)


def ts_day_format(timestamp):
    date = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
    return ts_format(date)


def ts_format(timestamp):
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


class TestGitHubActivityModels:

    @pytest.fixture(autouse=True)
    def _setup_method(self, monkeypatch):
        self._batch_write_mock = Mock()
        monkeypatch.setattr(
            GitHubActivity, "batch_write", lambda: self._batch_write_mock
        )

    def _verify(self, expected):
        _batch_write_save_mock = self._batch_write_mock.save

        assert _batch_write_save_mock.call_count == len(expected)
        for item in expected:
            _batch_write_save_mock.assert_any_call(item)

        self._batch_write_mock.commit.assert_called_once_with()

    def test_transform_to_dynamo_records_for_latest(self):
        data = {
            "demo/FOO": [{"timestamp": get_relative_timestamp(days=30)}],
            "org1/baz": [{"timestamp": get_relative_timestamp(days=1)}],
            "org2/bar": [{"timestamp": get_relative_timestamp(days=23)}],
        }

        transform_and_write_to_dynamo(
            data, GitHubActivityType.LATEST, PLUGIN_BY_REPO
        )

        data.pop("org1/baz")
        expected = generate_expected(data, "LATEST", "LATEST:{repo}", ts_format)
        self._verify(expected)

    def test_transform_to_dynamo_records_for_month(self):
        data = {
            "demo/FOO": [
                {'timestamp': get_relative_timestamp(months=24), 'count': 2},
                {'timestamp': get_relative_timestamp(months=13), 'count': 3}
            ],
            "org1/baz": [
                {'timestamp': get_relative_timestamp(months=15), 'count': 8},
                {'timestamp': get_relative_timestamp(months=14), 'count': 7},
                {'timestamp': get_relative_timestamp(months=12), 'count': 8},
                {'timestamp': get_relative_timestamp(months=11), 'count': 7}
            ],
        }

        transform_and_write_to_dynamo(
            data, GitHubActivityType.MONTH, PLUGIN_BY_REPO
        )

        data.pop("org1/baz")
        expected = generate_expected(
            data, "MONTH", "MONTH:{ts:%Y%m}:{repo}", ts_day_format
        )
        self._verify(expected)

    def test_transform_to_dynamo_records_for_total(self):
        data = {
            "demo/FOO": [{"count": 13}],
            "org1/baz": [{"count": 23}],
            "org2/bar": [{"count": 65}],
        }

        transform_and_write_to_dynamo(
            data, GitHubActivityType.TOTAL, PLUGIN_BY_REPO
        )

        data.pop("org1/baz")
        expected = generate_expected(
            data, "TOTAL", "TOTAL:{repo}", lambda ts: None
        )
        self._verify(expected)
