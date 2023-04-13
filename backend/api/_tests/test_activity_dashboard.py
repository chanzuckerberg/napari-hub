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
MOCK_PLUGIN_TOTAL_COMMIT_EMPTY = 0
MOCK_PLUGIN_TOTAL_COMMIT_NONEMPTY = 5
MOCK_PLUGIN_COMMIT_ACTIVITY_INVALID_LIMIT = []
MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY = [
    {'timestamp': 1672531200000, 'commits': 0},
    {'timestamp': 1675209600000, 'commits': 0},
    {'timestamp': 1677628800000, 'commits': 0}
]
MOCK_PLUGIN_COMMIT_ACTIVITY_NONEMPTY = [
    {'timestamp': 1672531200000, 'commits': 1},
    {'timestamp': 1675209600000, 'commits': 3},
    {'timestamp': 1677628800000, 'commits': 1}
]


class TestActivityDashboard(unittest.TestCase):

    @patch.object(model, 'get_latest_commit', return_value=None)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY)
    @patch.object(model, 'get_recent_activity_data', return_value={})
    @patch.object(model, 'get_install_timeline_data', return_value=EMPTY_DF.copy())
    def test_get_metrics_empty(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                               mock_get_commit_activity, mock_get_latest_commit):
        expected = self._generate_expected_metrics(
            timeline=self._generate_expected_usage_timeline(-3, to_installs=lambda i: 0),
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT_EMPTY,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY
        )
        self._verify_results('3', expected, mock_get_install_timeline_data, mock_get_recent_activity_data,
                             mock_get_commit_activity, mock_get_latest_commit)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY_NONEMPTY)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                  mock_get_commit_activity, mock_get_latest_commit):
        expected = self._generate_expected_metrics(
            timeline=self._generate_expected_usage_timeline(-3),
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT_NONEMPTY,
            commit_activity= self._generate_expected_maintenance_timeline(-3)
        )
        self._verify_results('3', expected, mock_get_install_timeline_data, mock_get_recent_activity_data,
                             mock_get_commit_activity, mock_get_latest_commit)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY_INVALID_LIMIT)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_zero_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                             mock_get_commit_activity, mock_get_latest_commit):
        expected = self._generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT_EMPTY,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY_INVALID_LIMIT
        )
        self._verify_results('0', expected, mock_get_install_timeline_data, mock_get_recent_activity_data,
                             mock_get_commit_activity, mock_get_latest_commit)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY_INVALID_LIMIT)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_invalid_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                                   mock_get_commit_activity, mock_get_latest_commit):
        expected = self._generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT_EMPTY,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY_INVALID_LIMIT
        )
        self._verify_results('foo', expected, mock_get_install_timeline_data, mock_get_recent_activity_data,
                             mock_get_commit_activity, mock_get_latest_commit)

    def _verify_results(self, limit, expected, mock_get_install_timeline_data, mock_get_recent_activity_data,
                        mock_get_commit_activity, mock_get_latest_commit):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin(PLUGIN_NAME, limit)
        self.assertEqual(expected, result)
        mock_get_install_timeline_data.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_recent_activity_data.assert_called_with()
        mock_get_latest_commit.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_commit_activity.assert_called_with(PLUGIN_NAME_CLEAN)

    @staticmethod
    def _generate_expected_usage_timeline(start_range,
                                          timestamp_key='timestamp',
                                          installs_key='installs',
                                          to_installs=lambda i: 2 if i % 2 == 0 else 0):
        to_timestamp = lambda i: int(pd.Timestamp(BASE + relativedelta(months=i)).timestamp()) * 1000
        return [{timestamp_key: to_timestamp(i), installs_key: to_installs(i)} for i in range(start_range, 0)]

    @staticmethod
    def _generate_expected_maintenance_timeline(start_range,
                                                timestamp_key='timestamp',
                                                commits_key='commits',
                                                to_commits=lambda i: 3 if i % 2 == 0 else 1):
        to_timestamp = lambda i: int(pd.Timestamp(BASE + relativedelta(months=i)).timestamp()) * 1000
        return [{timestamp_key: to_timestamp(i), commits_key: to_commits(i)} for i in range(start_range, 0)]

    @staticmethod
    def _generate_expected_metrics(timeline=None, total_installs=0, installs_in_last_30_days=0, latest_commit=None,
                                   total_commit=0, commit_activity=None):
        return {
            'usage': {
                'timeline': timeline if timeline else [],
                'stats': {
                    'total_installs': total_installs,
                    'installs_in_last_30_days': installs_in_last_30_days
                }
            },
            'maintenance': {
                'timeline': commit_activity,
                'stats': {
                    'latest_commit_timestamp': latest_commit,
                    'total_commits': total_commit
                }
            }
        }
