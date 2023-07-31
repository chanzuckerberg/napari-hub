import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb

from api._tests.test_fixtures import generate_installs_timeline
from api.models._tests.conftest import create_dynamo_table
from api.models import install_activity

PLUGIN_NAME = 'foo'


def to_millis(timestamp):
    return int(timestamp.timestamp()) * 1000 if timestamp else None


def to_installs(i):
    return i + 2 if i % 2 == 0 else 0


class TestInstallActivity:

    @pytest.fixture()
    def table(self, aws_credentials, dynamo_env_variables):
        with mock_dynamodb():
            yield create_dynamo_table(
                install_activity._InstallActivityModel, "install-activity"
            )

    @classmethod
    def _to_type_timestamp(cls, granularity, timestamp):
        if granularity == 'DAY':
            return f'DAY:{timestamp.strftime("%Y%m%d")}'
        elif granularity == 'MONTH':
            return f'MONTH:{timestamp.strftime("%Y%m")}'
        return 'TOTAL:'

    def _put_item(
            self, table, granularity, timestamp, install_count, is_total=None, plugin=PLUGIN_NAME
    ):
        item = {
            'plugin_name': plugin,
            'type_timestamp': self._to_type_timestamp(granularity, timestamp),
            'install_count': install_count,
            'type': granularity,
            'timestamp': to_millis(timestamp),
        }
        if is_total:
            item['is_total'] = is_total
        table.put_item(Item=item)

    def test_get_total_installs_has_no_result(self, table):
        actual = install_activity.get_total_installs(plugin=PLUGIN_NAME)

        assert actual == 0

    def test_get_total_installs_has_result(self, table):
        expected = 173
        self._put_item(table, 'TOTAL', None, expected, is_total='true')

        actual = install_activity.get_total_installs(plugin=PLUGIN_NAME)

        assert actual == expected

    @pytest.mark.parametrize(
        'data, expected', [
            ([(100, 30)], 0),
            ([(10, 5), (24, 12), (19, 10), (100, 30)], 53),
        ])
    def test_get_recent_installs(self, table, data, expected, date_utc_today):
        for count, period in data:
            timestamp = (date_utc_today - relativedelta(days=period))
            self._put_item(table, 'DAY', timestamp, count)

        actual = install_activity.get_recent_installs(plugin=PLUGIN_NAME, day_delta=15)

        assert actual == expected

    @pytest.mark.parametrize('data, month_delta, expected', [
        ([], 0, []),
        ([], 1, generate_installs_timeline(-1, to_value=lambda i: 0)),
        ([(to_installs(i), i) for i in range(0, 7, 2)], 4, generate_installs_timeline(-4, to_value=to_installs)),
    ])
    def test_get_timeline(self, table, data, month_delta, expected, date_utc_today):
        start = date_utc_today.replace(day=1)
        for count, period in data:
            timestamp = (start - relativedelta(months=period))
            self._put_item(table, 'MONTH', timestamp, count)

        actual = install_activity.get_timeline(PLUGIN_NAME, month_delta)

        assert actual == expected

    @pytest.mark.parametrize(
        'data, expected', [
            ([], {}),
            ([('foo', 10)], {'foo': 10}),
            ([('foo', 10), ('bar', 24)], {'foo': 10, 'bar': 24}),
        ])
    def test_get_total_installs_by_plugins(self, table, data, expected):
        for plugin, count in data:
            self._put_item(table, 'TOTAL', None, count, is_total='true', plugin=plugin)

        actual = install_activity.get_total_installs_by_plugins()

        assert actual == expected
