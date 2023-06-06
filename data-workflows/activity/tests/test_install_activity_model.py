import time
from datetime import datetime, timezone
from typing import List

import pytest
from dateutil.relativedelta import relativedelta
from moto import mock_dynamodb

from activity.install_activity_model import InstallActivityType
from conftest import create_dynamo_table
from nhcommons.models.install_activity import _InstallActivity


def generate_expected(data, granularity, type_timestamp_formatter,
                      timestamp_formatter, is_total=None):
    expected = []
    for key, values in data.items():
        for val in values:
            timestamp = val['timestamp']
            expected.append({
                "plugin_name": key.lower(),
                "type_timestamp": f"{type_timestamp_formatter(timestamp)}",
                "type": granularity,
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
        timestamp = datetime.strptime('03/21/2023 00:00:00',
                                      '%m/%d/%Y %H:%M:%S')
        assert InstallActivityType.DAY.format_to_timestamp(
            timestamp) == 1679356800000
        assert InstallActivityType.DAY.get_query_timestamp_projection() == "DATE_TRUNC('DAY', timestamp)"
        assert InstallActivityType.DAY.format_to_type_timestamp(
            timestamp) == "DAY:20230321"

    def test_month_install_activity_type(self):
        timestamp = datetime.strptime('03/21/2023 00:00:00',
                                      '%m/%d/%Y %H:%M:%S')
        assert InstallActivityType.MONTH.format_to_timestamp(
            timestamp) == 1679356800000
        assert InstallActivityType.MONTH.get_query_timestamp_projection() == "DATE_TRUNC('MONTH', timestamp)"
        assert InstallActivityType.MONTH.format_to_type_timestamp(
            timestamp) == "MONTH:202303"

    def test_total_install_activity_type(self):
        timestamp = datetime.strptime('03/21/2023 00:00:00',
                                      '%m/%d/%Y %H:%M:%S')
        assert InstallActivityType.TOTAL.format_to_timestamp(timestamp) is None
        assert InstallActivityType.TOTAL.get_query_timestamp_projection() == "1"
        assert InstallActivityType.TOTAL.format_to_type_timestamp(
            timestamp) == "TOTAL:"


class TestInstallActivityModels:
    @pytest.fixture()
    def table(self, aws_credentials):
        with mock_dynamodb():
            yield create_dynamo_table(_InstallActivity, "install-activity")

    def setup_method(self):
        self.start_time = round(time.time() * 1000)

    def _verify(self, expected_list: List[dict], table):
        actual_list = table.scan()["Items"]
        end_time = round(time.time() * 1000)
        assert len(actual_list) == len(expected_list)

        def is_match(expected) -> bool:
            expected_items = set(expected.items())
            for actual in actual_list:
                diff_items = set(actual.items()) - expected_items
                if len(diff_items) != 1:
                    continue
                diff = diff_items.pop()
                if diff[0] == 'last_updated_timestamp' and \
                       self.start_time <= diff[1] <= end_time:
                    return True
            return False

        assert all([is_match(expected) for expected in expected_list])

    def test_transform_to_dynamo_records_for_day(self, table):
        data = {
            'FOO': [{'timestamp': get_relative_timestamp(days=45), 'count': 2},
                    {'timestamp': get_relative_timestamp(days=30), 'count': 3}],
            'BAR': [{'timestamp': get_relative_timestamp(days=1), 'count': 8}],
            'BAZ': [{'timestamp': get_relative_timestamp(days=34), 'count': 15},
                    {'timestamp': get_relative_timestamp(days=33), 'count': 12},
                    {'timestamp': get_relative_timestamp(days=23),
                     'count': 10}],
        }

        from activity.install_activity_model import \
            transform_and_write_to_dynamo
        transform_and_write_to_dynamo(data, InstallActivityType.DAY)

        expected = generate_expected(data, 'DAY',
                                     lambda ts: f'DAY:{ts.strftime("%Y%m%d")}',
                                     timestamp_format)
        self._verify(expected, table)

    def test_transform_to_dynamo_records_for_month(self, table):
        data = {
            'FOO': [
                {'timestamp': get_relative_timestamp(months=24), 'count': 2},
                {'timestamp': get_relative_timestamp(months=13), 'count': 3}],
            'BAR': [
                {'timestamp': get_relative_timestamp(months=15), 'count': 8},
                {'timestamp': get_relative_timestamp(months=14, days=1),
                 'count': 7},
                {'timestamp': get_relative_timestamp(months=12), 'count': 8},
                {'timestamp': get_relative_timestamp(months=11), 'count': 7}],
        }

        from activity.install_activity_model import \
            transform_and_write_to_dynamo
        transform_and_write_to_dynamo(data, InstallActivityType.MONTH)

        expected = generate_expected(data, 'MONTH',
                                     lambda ts: f'MONTH:{ts.strftime("%Y%m")}',
                                     timestamp_format)
        self._verify(expected, table)

    def test_transform_to_dynamo_records_for_total(self, table):
        data = {
            'FOO': [{'timestamp': 1, 'count': 2}],
            'BAR': [{'timestamp': 1, 'count': 8}],
            'BAZ': [{'timestamp': 1, 'count': 3}]
        }

        from activity.install_activity_model import \
            transform_and_write_to_dynamo
        transform_and_write_to_dynamo(data, InstallActivityType.TOTAL)

        expected = generate_expected(data, 'TOTAL', lambda ts: f'TOTAL:',
                                     lambda ts: None, 'true')
        self._verify(expected, table)
