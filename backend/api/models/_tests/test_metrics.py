import datetime
from unittest.mock import Mock

import pandas as pd
import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb

from api._tests.test_fixtures import generate_installs_timeline
from api.models.metrics import InstallActivityDDB, InstallActivity
from .conftest import create_dynamo_table

PLUGIN_NAME = 'foo'


def to_millis(timestamp):
    return int(timestamp.timestamp()) * 1000 if timestamp else None


def to_timestamp(start, i):
    return to_millis(pd.Timestamp(start + relativedelta(months=i)))


def to_installs(i):
    return 2 if i % 2 == 0 else 0


def generate_expected_results(start_range):
    start = datetime.date.today().replace(day=1)
    return [Mock(timestamp=to_timestamp(start, i), install_count=to_installs(i)) for i in range(start_range, 0, 2)]


@mock_dynamodb
class TestInstallActivity:

    def install_activity_table(self):
        self._table = create_dynamo_table(InstallActivityDDB)

    @staticmethod
    def _to_type_timestamp(granularity, timestamp):
        if granularity == 'DAY':
            return f'DAY:{timestamp.strftime("%Y%m%d")}'
        elif granularity == 'MONTH':
            return f'MONTH:{timestamp.strftime("%Y%m")}'
        return 'TOTAL:'

    def _put_item(self, granularity, timestamp, install_count, plugin=PLUGIN_NAME):
        item = {
            'plugin_name': plugin,
            'type_timestamp': self._to_type_timestamp(granularity, timestamp),
            'install_count': install_count,
            'granularity': granularity,
            'timestamp': to_millis(timestamp)
        }
        self._table.put_item(Item=item)

    def test_get_total_installs_has_no_result(self, aws_credentials):
        self.install_activity_table()

        actual = InstallActivity.get_total_installs(plugin=PLUGIN_NAME)

        assert actual == 0

    def test_get_total_installs_has_result(self, aws_credentials):
        expected = 173

        self.install_activity_table()
        self._put_item('TOTAL', None, expected)

        actual = InstallActivity.get_total_installs(plugin=PLUGIN_NAME)

        assert actual == expected

    @pytest.mark.parametrize(
        'results, expected', [
            ([(100, 30)], 0),
            ([(10, 5), (24, 12), (19, 10), (100, 30)], 53),
        ])
    def test_get_recent_installs(self, aws_credentials, results, expected):
        self.install_activity_table()
        start = datetime.date.today()
        for count, period in results:
            timestamp = pd.Timestamp(start - relativedelta(days=period))
            self._put_item('DAY', timestamp, count)

        actual = InstallActivity.get_recent_installs(plugin=PLUGIN_NAME, day_delta=15)

        assert actual == expected

    @pytest.mark.parametrize('results, month_delta, expected', [
        ([], 0, []),
        ([], 1, generate_installs_timeline(-1, to_value=lambda i: 0)),
        ([(to_installs(i), i) for i in range(0, 7, 2)], 4, generate_installs_timeline(-4, to_value=to_installs)),
    ])
    def test_get_timeline(self, aws_credentials, results, month_delta, expected):
        self.install_activity_table()
        start = datetime.date.today().replace(day=1)
        for count, period in results:
            timestamp = pd.Timestamp(start - relativedelta(months=period))
            self._put_item('MONTH', timestamp, count)

        actual = InstallActivity.get_timeline(PLUGIN_NAME, month_delta)

        assert actual == expected

    @pytest.mark.parametrize(
        'results, expected', [
            ([], {}),
            ([('foo', 10)], {'foo': 10}),
            ([('foo', 10), ('bar', 24)], {'foo': 10, 'bar': 24}),
        ])
    def test_get_total_installs_by_plugins(self, aws_credentials, results, expected):
        self.install_activity_table()
        for plugin, count in results:
            self._put_item('TOTAL', None, count, plugin=plugin)

        actual = InstallActivity.get_total_installs_by_plugins(plugins=['foo', 'bar'])

        assert actual == expected
