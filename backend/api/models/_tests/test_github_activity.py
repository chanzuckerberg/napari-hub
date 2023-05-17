import datetime

import pandas as pd
import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb

from api._tests.test_fixtures import generate_commits_timeline
from api.models._tests.conftest import create_dynamo_table
from api.models import github_activity

PLUGIN_NAME = 'foo'
REPO_NAME = 'repo/foo'


def to_timestamp(timestamp):
    if not timestamp:
        return None
    elif isinstance(timestamp, int):
        return timestamp
    return int(timestamp.timestamp()) * 1000


def to_commits(i):
    return i + 2 if i % 2 == 0 else 0


class TestGitHubActivity:

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
            'timestamp': to_timestamp(timestamp),
        }
        table.put_item(Item=item)

    @pytest.mark.parametrize(
        'data, expected', [
            ([], None),
            ([('bar', 'repo/bar', 123456789)], None),
            ([(PLUGIN_NAME, 'repo/foo2', 123456789)], None),
            ([('bar', REPO_NAME, 123456789)], None),
            ([(PLUGIN_NAME, REPO_NAME, 123456789)], 123456789),
        ])
    def test_get_latest_commit(self, github_activity_table, data, expected):
        for plugin, repo, timestamp in data:
            self._put_item(github_activity_table, 'LATEST', timestamp, None, plugin=plugin, repo=repo)

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
            ([('bar', 'repo/bar', 100)], 0),
            ([(PLUGIN_NAME, 'repo/foo2', 100)], 0),
            ([('bar', REPO_NAME, 100)], 0),
            ([(PLUGIN_NAME, REPO_NAME, 100)], 100),
        ])
    def test_get_total_commits(self, github_activity_table, data, expected):
        for plugin, repo, count in data:
            self._put_item(github_activity_table, 'TOTAL', None, count, plugin=plugin, repo=repo)

        actual = github_activity.get_total_commits(plugin=PLUGIN_NAME, repo=REPO_NAME)

        assert actual == expected
