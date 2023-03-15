from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from dateutil.relativedelta import relativedelta

from activity.install_activity_model import InstallActivityType, InstallActivity


def to_ts(epoch):
    return datetime.fromtimestamp(epoch)


def sorting_key(install_activity: InstallActivity):
    return install_activity.plugin_name + ' ' + install_activity.type_timestamp


def generate_expected(data, granularity, type_timestamp_formatter, timestamp_formatter):
    expected = []
    for key, values in data.items():
        for val in values:
            timestamp = val['timestamp']

            ia = InstallActivity(key.lower(),
                                 f'{type_timestamp_formatter(timestamp)}',
                                 granularity=granularity,
                                 timestamp=timestamp_formatter(timestamp),
                                 install_count=val['count'])
            expected.append(ia)
    return expected


def timestamp_format(timestamp):
    return timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000


def get_relative_timestamp(**args):
    return datetime.now() - relativedelta(args)


class TestInstallActivityModels:

    @pytest.fixture(autouse=True)
    def _setup_method(self, monkeypatch):
        self._batch_write_mock = Mock()
        monkeypatch.setattr(InstallActivity, 'batch_write', lambda: self._batch_write_mock)

    def _verify(self, expected):
        _batch_write_save_mock = self._batch_write_mock.save

        assert _batch_write_save_mock.call_count == len(expected)
        for item in expected:
            _batch_write_save_mock.assert_any_call(item)

        self._batch_write_mock.commit.assert_called_once_with()

    def test_transform_to_dynamo_records_for_day(self):
        data = {
            'FOO': [{'timestamp': get_relative_timestamp(days=45), 'count': 2},
                    {'timestamp': get_relative_timestamp(days=30), 'count': 3}],
            'BAR': [{'timestamp': get_relative_timestamp(days=1), 'count': 8}],
            'BAZ': [{'timestamp': get_relative_timestamp(days=34), 'count': 15},
                    {'timestamp': get_relative_timestamp(days=33), 'count': 12},
                    {'timestamp': get_relative_timestamp(days=23), 'count': 10}],
        }

        from activity.install_activity_model import transform_and_write_to_dynamo
        transform_and_write_to_dynamo(data, InstallActivityType.DAY)

        expected = generate_expected(data, 'DAY', lambda ts: f'DAY:{ts.strftime("%Y%m%d")}', timestamp_format)
        self._verify(expected)

    def test_transform_to_dynamo_records_for_month(self):
        data = {
            'FOO': [{'timestamp': get_relative_timestamp(months=24), 'count': 2},
                    {'timestamp': get_relative_timestamp(months=13), 'count': 3}],
            'BAR': [{'timestamp': get_relative_timestamp(months=15), 'count': 8},
                    {'timestamp': get_relative_timestamp(months=14, days=1), 'count': 7},
                    {'timestamp': get_relative_timestamp(months=12), 'count': 8},
                    {'timestamp': get_relative_timestamp(months=11), 'count': 7}],
        }

        from activity.install_activity_model import transform_and_write_to_dynamo
        transform_and_write_to_dynamo(data, InstallActivityType.MONTH)

        expected = generate_expected(data, 'MONTH', lambda ts: f'MONTH:{ts.strftime("%Y%m")}', timestamp_format)
        self._verify(expected)

    def test_transform_to_dynamo_records_for_total(self):
        data = {
            'FOO': [{'timestamp': 1, 'count': 2}],
            'BAR': [{'timestamp': 1, 'count': 8}],
            'BAZ': [{'timestamp': 1, 'count': 3}]
        }

        from activity.install_activity_model import transform_and_write_to_dynamo
        transform_and_write_to_dynamo(data, InstallActivityType.TOTAL)

        expected = generate_expected(data, 'TOTAL', lambda ts: f'TOTAL:', lambda ts: None)
        self._verify(expected)
