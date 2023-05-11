import datetime

import pandas as pd
import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb

from api._tests.test_fixtures import generate_commits_timeline
from api.models._tests.conftest import create_dynamo_table
from api.models import github_activity

PLUGIN_NAME = 'foo'
REPO_NAME = 'foo/repo'
EXPECTED_LATEST_COMMIT_TIMESTAMP = 1681171200000


def to_millis(timestamp):
    return int(timestamp.timestamp()) * 1000 if timestamp else None


def to_timestamp(start, i):
    return to_millis(pd.Timestamp(start + relativedelta(months=i)))


def to_commits(i):
    return 2 if i % 2 == 0 else 0


class TestInstallActivity:

    @pytest.fixture()
    def github_activity_table(self, aws_credentials):
        with mock_dynamodb():
            yield create_dynamo_table(github_activity._GitHubActivityModel, 'github-activity')

    @classmethod
    def _to_type_identifier(cls, granularity, repo, timestamp):
        if granularity == 'LATEST':
            return f'LATEST:{repo}'
        elif granularity == 'MONTH':
            return f'MONTH:{timestamp.strftime("%Y%m")}:{repo}'
        return f'TOTAL:{repo}'

    def _put_item(self, table, granularity, timestamp, commit_count, plugin=PLUGIN_NAME, repo=REPO_NAME):
        item = {
            'plugin_name': plugin,
            'type_identifier': self._to_type_identifier(granularity, repo, timestamp),
            'commit_count': commit_count,
            'granularity': granularity,
            'timestamp': to_millis(timestamp),
        }
        table.put_item(Item=item)

    def test_get_total_commits_has_no_result(self, github_activity_table):
        actual = github_activity.get_total_commits(PLUGIN_NAME, REPO_NAME)

        assert actual == 0

    def test_get_total_commits_has_result(self, github_activity_table):
        expected = 173
        self._put_item(github_activity_table, 'TOTAL', None, expected)

        actual = github_activity.get_total_commits(PLUGIN_NAME, REPO_NAME)

        assert actual == expected

    @pytest.mark.parametrize(
        'data, expected', [
            ([], None),
            ([(10, 5), (24, 12), (19, 10), (100, 30)], EXPECTED_LATEST_COMMIT_TIMESTAMP),
        ])
    def test_get_latest_commit(self, github_activity_table, data, expected):
        start = datetime.date.today()
        for count, period in data:
            timestamp = pd.Timestamp(start - relativedelta(days=period))
            self._put_item(github_activity_table, 'LATEST', timestamp, count)

        actual = github_activity.get_latest_commit(PLUGIN_NAME, REPO_NAME)

        assert actual == expected

    @pytest.mark.parametrize('data, month_delta, expected', [
        ([], 0, []),
        ([], 1, generate_commits_timeline(-1, to_value=lambda i: 0)),
        ([(to_commits(i), i) for i in range(0, 7, 2)], 4, generate_commits_timeline(-4, to_value=to_commits)),
    ])
    def test_get_maintenance_timeline(self, github_activity_table, data, month_delta, expected):
        start = datetime.date.today().replace(day=1)
        for count, period in data:
            timestamp = pd.Timestamp(start - relativedelta(months=period))
            self._put_item(github_activity_table, 'MONTH', timestamp, count)

        actual = github_activity.get_maintenance_timeline(PLUGIN_NAME, REPO_NAME, month_delta)

        assert actual == expected

    @pytest.mark.parametrize(
        'data, expected', [
            ([], 0),
            ([('foo', 10)], 10),
        ])
    def test_get_total_commits(self, github_activity_table, data, expected):
        for plugin, count in data:
            self._put_item(github_activity_table, 'TOTAL', None, count, plugin=plugin)

        actual = github_activity.get_total_commits(PLUGIN_NAME, REPO_NAME)

        assert actual == expected
