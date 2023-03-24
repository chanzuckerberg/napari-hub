import unittest
from unittest.mock import patch
import pandas as pd
import pytest

from api import model
from datetime import datetime
from dateutil.relativedelta import relativedelta

from api._tests.test_fixtures import generate_expected_timeline

BASE = datetime.today().date().replace(day=1)
DATE_LIST = [BASE - relativedelta(months=x) for x in range(12) if x % 2 == 0]
MOCK_INSTALLS = list(range(1, len(DATE_LIST) + 1))
MOCK_DF = pd.DataFrame({'MONTH': pd.to_datetime(DATE_LIST), 'NUM_DOWNLOADS_BY_MONTH': MOCK_INSTALLS})
EMPTY_DF = pd.DataFrame(columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])
PLUGIN_NAME = 'StrIng-1'
PLUGIN_NAME_CLEAN = 'string-1'
MOCK_PLUGIN_RECENT_INSTALLS = {PLUGIN_NAME_CLEAN: 25, 'foo': 10, 'bar': 30}
MOCK_PLUGIN_LATEST_COMMIT = 1672531200000
MOCK_PLUGIN_TOTAL_COMMIT = 200
MOCK_PLUGIN_TOTAL_COMMIT_EMPTY = 0
MOCK_PLUGIN_COMMIT_ACTIVITY = [{'timestamp': 1643673600000, 'commits': 200}]
MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY = []


def generate_expected_metrics(timeline=None, total_installs=0, installs_in_last_30_days=0, latest_commit=None,
                              total_commit=None, commit_activity=None):
    return {
        'usage': {
            'timeline': timeline if timeline else [],
            'stats': {
                'total_installs': total_installs,
                'installs_in_last_30_days': installs_in_last_30_days
            }
        },
        'maintenance': {
            'timeline': commit_activity if commit_activity else MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY,
            'stats': {
                'latest_commit_timestamp': latest_commit,
                'total_commits': total_commit
            }
        }
    }

class TestActivityDashboard(unittest.TestCase):

    @patch.object(model, 'get_latest_commit', return_value=None)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY)
    @patch.object(model, 'get_recent_activity_data', return_value={})
    @patch.object(model, 'get_install_timeline_data', return_value=EMPTY_DF.copy())
    def test_get_metrics_empty(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                               mock_get_commit_activity, mock_get_latest_commit):
        expected = generate_expected_metrics(
            timeline=generate_expected_timeline(-3, to_installs=lambda i: 0),
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT_EMPTY,
        )
        self._verify_results('3', expected, mock_get_commit_activity, mock_get_latest_commit, mock_get_install_timeline_data, mock_get_recent_activity_data)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                  mock_get_commit_activity, mock_get_latest_commit):
        expected = generate_expected_metrics(
            timeline=generate_expected_timeline(-3),
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY
        )
        self._verify_results('3', expected, mock_get_commit_activity, mock_get_latest_commit, mock_get_install_timeline_data, mock_get_recent_activity_data)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_zero_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                             mock_get_commit_activity, mock_get_latest_commit):
        expected = generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY
        )
        self._verify_results('0', expected, mock_get_commit_activity, mock_get_latest_commit, mock_get_install_timeline_data, mock_get_recent_activity_data)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_invalid_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                                mock_get_commit_activity, mock_get_latest_commit):
        expected = generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY
        )
        self._verify_results('foo', expected, mock_get_commit_activity, mock_get_latest_commit, mock_get_install_timeline_data, mock_get_recent_activity_data)

    @patch.object(model, 'get_latest_commit', return_value=MOCK_PLUGIN_LATEST_COMMIT)
    @patch.object(model, 'get_commit_activity', return_value=MOCK_PLUGIN_COMMIT_ACTIVITY)
    @patch.object(model, 'get_recent_activity_data', return_value=MOCK_PLUGIN_RECENT_INSTALLS)
    @patch.object(model, 'get_install_timeline_data', return_value=MOCK_DF.copy())
    def test_get_metrics_nonempty_negative_limit(self, mock_get_install_timeline_data, mock_get_recent_activity_data,
                                                mock_get_commit_activity, mock_get_latest_commit):
        expected = generate_expected_metrics(
            total_installs=sum(MOCK_INSTALLS),
            installs_in_last_30_days=25,
            latest_commit=MOCK_PLUGIN_LATEST_COMMIT,
            total_commit=MOCK_PLUGIN_TOTAL_COMMIT,
            commit_activity=MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY
        )
        self._verify_results('-5', expected, mock_get_commit_activity, mock_get_latest_commit, mock_get_install_timeline_data, mock_get_recent_activity_data)

    def _verify_results(self, limit, expected, mock_get_commit_activity, mock_get_latest_commit, mock_get_install_timeline_data, mock_get_recent_activity_data):
        from api.model import get_metrics_for_plugin
        result = get_metrics_for_plugin(PLUGIN_NAME, limit, False)
        self.assertEqual(expected, result)
        mock_get_latest_commit.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_commit_activity.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_install_timeline_data.assert_called_with(PLUGIN_NAME_CLEAN)
        mock_get_recent_activity_data.assert_called_with()


class TestMetricModel:
    @pytest.mark.parametrize('commit_activity_input, commit_activity_result, latest_commit, total_commit, total_installs,'
                             'recent_installs, timeline, limit', [
        (MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY, MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY, None, MOCK_PLUGIN_TOTAL_COMMIT_EMPTY, 0, 0, generate_expected_timeline(-3, to_installs=lambda i: 0), '3'),
        (MOCK_PLUGIN_COMMIT_ACTIVITY, MOCK_PLUGIN_COMMIT_ACTIVITY, MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMIT, 25, 21, generate_expected_timeline(-3), '3'),
        (MOCK_PLUGIN_COMMIT_ACTIVITY, MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY, MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMIT, 25, 21, [], '0'),
        (MOCK_PLUGIN_COMMIT_ACTIVITY, MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY, MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMIT, 25, 21, [], 'foo'),
        (MOCK_PLUGIN_COMMIT_ACTIVITY, MOCK_PLUGIN_COMMIT_ACTIVITY_EMPTY, MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMIT, 25, 21, [], '-5'),
    ])
    def test_metrics_api_using_dynamo(self, monkeypatch, commit_activity_input, commit_activity_result, latest_commit, total_commit, total_installs, recent_installs, timeline, limit):
        monkeypatch.setattr(model, 'get_commit_activity', self._validate_args_return_value(commit_activity_input))
        monkeypatch.setattr(model, 'get_latest_commit', self._validate_args_return_value(latest_commit))
        monkeypatch.setattr(model.InstallActivity, 'get_total_installs', self._validate_args_return_value(total_installs))
        monkeypatch.setattr(model.InstallActivity, 'get_recent_installs', self._validate_args_return_value(recent_installs))
        monkeypatch.setattr(model.InstallActivity, 'get_timeline', self._validate_args_return_value(timeline))

        from api.model import get_metrics_for_plugin
        actual = get_metrics_for_plugin(PLUGIN_NAME, limit, True)

        expected = generate_expected_metrics(
            total_installs=total_installs, installs_in_last_30_days=recent_installs, timeline=timeline,
            latest_commit=latest_commit, total_commit=total_commit, commit_activity=commit_activity_result
        )
        assert actual == expected

    @staticmethod
    def _validate_args_return_value(value):
        return lambda *args, **kwargs: value if args[0] == PLUGIN_NAME_CLEAN else None
