from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
from dateutil.relativedelta import relativedelta

import activity
from activity.install_activity_model import InstallActivityType
from activity.install_activity_model import transform_and_write_to_dynamo


def generate_expected(data, granularity, type_timestamp_formatter, timestamp_formatter, is_total=None):
    expected = []
    for key, values in data.items():
        for val in values:
            timestamp = val['timestamp']
            expected.append({
                "plugin_name": key.lower(),
                "type_timestamp": f"{type_timestamp_formatter(timestamp)}",
                "granularity": granularity,
                "timestamp": timestamp_formatter(timestamp),
                "install_count": val['count'],
                "is_total": is_total,
            })
    return expected


def timestamp_format(timestamp):
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


def get_relative_timestamp(**args):
    return datetime.now() - relativedelta(**args)


class TestInstallActivity:

    def test_day_install_activity_type(self):
        timestamp = datetime.strptime('03/21/2023 00:00:00', '%m/%d/%Y %H:%M:%S')
        assert InstallActivityType.DAY.format_to_timestamp(timestamp) == 1679356800000
        assert InstallActivityType.DAY.get_query_timestamp_projection() == "DATE_TRUNC('DAY', timestamp)"
        assert InstallActivityType.DAY.format_to_type_timestamp(timestamp) == "DAY:20230321"

    def test_month_install_activity_type(self):
        timestamp = datetime.strptime('03/21/2023 00:00:00', '%m/%d/%Y %H:%M:%S')
        assert InstallActivityType.MONTH.format_to_timestamp(timestamp) == 1679356800000
        assert InstallActivityType.MONTH.get_query_timestamp_projection() == "DATE_TRUNC('MONTH', timestamp)"
        assert InstallActivityType.MONTH.format_to_type_timestamp(timestamp) == "MONTH:202303"

    def test_total_install_activity_type(self):
        timestamp = datetime.strptime('03/21/2023 00:00:00', '%m/%d/%Y %H:%M:%S')
        assert InstallActivityType.TOTAL.format_to_timestamp(timestamp) is None
        assert InstallActivityType.TOTAL.get_query_timestamp_projection() == "1"
        assert InstallActivityType.TOTAL.format_to_type_timestamp(timestamp) == "TOTAL:"


class TestInstallActivityModels:

    @pytest.fixture
    def mock_batch_write(self, monkeypatch):
        mock_batch_write = Mock()
        monkeypatch.setattr(
            activity.install_activity_model, "batch_write", mock_batch_write
        )
        return mock_batch_write

    def test_transform_to_dynamo_records_for_day(self, mock_batch_write):
        data = {
            'FOO': [{'timestamp': get_relative_timestamp(days=45), 'count': 2},
                    {'timestamp': get_relative_timestamp(days=30), 'count': 3}],
            'BAR': [{'timestamp': get_relative_timestamp(days=1), 'count': 8}],
            'BAZ': [{'timestamp': get_relative_timestamp(days=34), 'count': 15},
                    {'timestamp': get_relative_timestamp(days=33), 'count': 12},
                    {'timestamp': get_relative_timestamp(days=23), 'count': 10}],
        }
        transform_and_write_to_dynamo(data, InstallActivityType.DAY)

        expected = generate_expected(data, 'DAY', lambda ts: f'DAY:{ts.strftime("%Y%m%d")}', timestamp_format)
        mock_batch_write.assert_called_once_with(expected)

    def test_transform_to_dynamo_records_for_month(self, mock_batch_write):
        data = {
            'FOO': [
                {'timestamp': get_relative_timestamp(months=24), 'count': 2},
                {'timestamp': get_relative_timestamp(months=13), 'count': 3}],
            'BAR': [
                {'timestamp': get_relative_timestamp(months=15), 'count': 8},
                {'timestamp': get_relative_timestamp(months=14, days=1), 'count': 7},
                {'timestamp': get_relative_timestamp(months=12), 'count': 8},
                {'timestamp': get_relative_timestamp(months=11), 'count': 7}],
        }
        transform_and_write_to_dynamo(data, InstallActivityType.MONTH)

        expected = generate_expected(data, 'MONTH', lambda ts: f'MONTH:{ts.strftime("%Y%m")}', timestamp_format)
        mock_batch_write.assert_called_once_with(expected)

    def test_transform_to_dynamo_records_for_total(self, mock_batch_write):
        data = {
            'FOO': [{'timestamp': 1, 'count': 2}],
            'BAR': [{'timestamp': 1, 'count': 8}],
            'BAZ': [{'timestamp': 1, 'count': 3}]
        }
        transform_and_write_to_dynamo(data, InstallActivityType.TOTAL)

        expected = generate_expected(data, 'TOTAL', lambda ts: f'TOTAL:', lambda ts: None, 'true')
        mock_batch_write.assert_called_once_with(expected)
