import unittest
from unittest.mock import patch
import pandas as pd
from api import model
from datetime import datetime
from dateutil.relativedelta import relativedelta

base = datetime.today().date().replace(day=1)
date_list = [base - relativedelta(months=x) for x in range(12) if x % 2 == 0]
mock_installs = list(range(1, len(date_list) + 1))
mock_df = pd.DataFrame({'MONTH': pd.to_datetime(date_list), 'NUM_DOWNLOADS_BY_MONTH': mock_installs})
empty_df = pd.DataFrame(columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])
mock_plugin_recent_installs = {'string-1': 25, 'foo': 10, 'bar': 30}


class TestActivityDashboard(unittest.TestCase):


    @patch.object(model, 'get_recent_activity_data', return_value={})
    @patch.object(model, 'get_install_timeline_data', return_value=empty_df.copy())
    def test_get_metrics_empty(self, _, __):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin('string-1', '3')
        expected = self._generate_expected_metrics(
            timeline=self._generate_expected_timeline(-3, to_installs=lambda i: 0)
        )
        self.assertEqual(expected, result)

    @patch.object(model, 'get_recent_activity_data', return_value=mock_plugin_recent_installs)
    @patch.object(model, 'get_install_timeline_data', return_value=mock_df.copy())
    def test_get_metrics_nonempty(self, _, __):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin('string-1', '3')
        expected = self._generate_expected_metrics(
            timeline=self._generate_expected_timeline(-3),
            total_installs=sum(mock_installs),
            total_months=10,
            installs_in_last_30_days=25
        )
        self.assertEqual(expected, result)

    @patch.object(model, 'get_recent_activity_data', return_value=mock_plugin_recent_installs)
    @patch.object(model, 'get_install_timeline_data', return_value=mock_df.copy())
    def test_get_metrics_nonempty_zero_limit(self, _, __):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin('string-1', '0')
        expected = self._generate_expected_metrics(
            total_installs=sum(mock_installs), total_months=10, installs_in_last_30_days=25
        )
        self.assertEqual(expected, result)

    @patch.object(model, 'get_recent_activity_data', return_value=mock_plugin_recent_installs)
    @patch.object(model, 'get_install_timeline_data', return_value=mock_df.copy())
    def test_get_metrics_nonempty_invalid_limit(self, _, __):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin('string-1', 'foo')
        expected = self._generate_expected_metrics(
            total_installs=sum(mock_installs), total_months=10, installs_in_last_30_days=25
        )
        self.assertEqual(expected, result)

    @staticmethod
    def _generate_expected_timeline(start_range,
                                    timestamp_key='timestamp',
                                    installs_key='installs',
                                    to_installs=lambda i: 2 if i % 2 == 0 else 0):
        to_timestamp = lambda i: int(pd.Timestamp(base + relativedelta(months=i)).timestamp()) * 1000
        return [{timestamp_key: to_timestamp(i), installs_key: to_installs(i)} for i in range(start_range, 0)]

    @staticmethod
    def _generate_expected_metrics(timeline=None, total_installs=0, total_months=0, installs_in_last_30_days=0):
        return {
            'activity': {
                'timeline': timeline if timeline else [],
                'stats': {
                    'totalInstalls': total_installs,
                    'totalMonths': total_months,
                    'installsInLast30Days': installs_in_last_30_days
                }
            }
        }
