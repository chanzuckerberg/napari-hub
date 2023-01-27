import unittest
from unittest.mock import patch
import pandas as pd
from api import model
from datetime import datetime
from dateutil.relativedelta import relativedelta

BASE = datetime.today().date().replace(day=1)
DATE_LIST = [BASE - relativedelta(months=x) for x in range(12) if x % 2 == 0]
MOCK_INSTALLS = list(range(1, len(DATE_LIST) + 1))
MOCK_DF = pd.DataFrame({'MONTH': pd.to_datetime(DATE_LIST), 'NUM_DOWNLOADS_BY_MONTH': MOCK_INSTALLS})
EMPTY_DF = pd.DataFrame(columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])
PLUGIN_NAME = 'StrIng-1'
PLUGIN_NAME_CLEAN = 'string-1'
MOCK_PLUGIN_RECENT_INSTALLS = {PLUGIN_NAME_CLEAN: 25, 'foo': 10, 'bar': 30}
MOCK_PLUGIN_LATEST_COMMIT = 1672531200000
MOCK_PLUGIN_TOTAL_COMMIT = 100


class TestActivityDashboard(unittest.TestCase):

    @patch.object(model, 'get_latest_commit', return_value=None)
    @patch.object(model, 'get_total_commit', return_value=None)
    @patch.object(model, 'get_recent_activity_data', return_value={})
    @patch.object(model, 'get_install_timeline_data', return_value=EMPTY_DF.copy())
    def test_get_metrics_empty(self, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit):
        expected = self._generate_expected_metrics(
            timeline=self._generate_expected_timeline(-3, to_installs=lambda i: 0)
        )
        self._verify_results('3', expected, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_total_commit', return_value=MOCK_PLUGIN_TOTAL_COMMIT)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty(self, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit):
        expected = self._generate_expected_metrics(
            timeline=self._generate_expected_timeline(-3),
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT
        )
        self._verify_results('3', expected, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_total_commit', return_value=MOCK_PLUGIN_TOTAL_COMMIT)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_zero_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit):
        expected = self._generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT
        )
        self._verify_results('0', expected, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_total_commit', return_value=MOCK_PLUGIN_TOTAL_COMMIT)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_invalid_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit):
        expected = self._generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT
        )
        self._verify_results('foo', expected, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit)

    def _verify_results(self, limit, expected, mock_get_install_timeline_data, mock_get_recent_activity_data, mock_get_latest_commit, mock_get_total_commit):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin(PLUGIN_NAME, limit)
        self.assertEqual(expected, result)
        mock_get_install_timeline_data.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_recent_activity_data.assert_called_with()
        mock_get_latest_commit.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_total_commit.assert_called_with(PLUGIN_NAME_CLEAN)


    @staticmethod
    def _generate_expected_timeline(start_range,
                                    timestamp_key='timestamp',
                                    installs_key='installs',
                                    to_installs=lambda i: 2 if i % 2 == 0 else 0):
        to_timestamp = lambda i: int(pd.Timestamp(BASE + relativedelta(months=i)).timestamp()) * 1000
        return [{timestamp_key: to_timestamp(i), installs_key: to_installs(i)} for i in range(start_range, 0)]

    @staticmethod
    def _generate_expected_metrics(timeline=None, total_installs=0, installs_in_last_30_days=0, latest_commit=None, total_commit=None):
        return {
            'usage': {
                'timeline': timeline if timeline else [],
                'stats': {
                    'total_installs': total_installs,
                    'installs_in_last_30_days': installs_in_last_30_days
                }
            },
            'maintenance': {
                'stats': {
                    'latest_commit_timestamp': latest_commit,
                    'total_commits': total_commit
                }
            }
        }
