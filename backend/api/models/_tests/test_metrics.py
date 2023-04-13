import datetime
from unittest.mock import Mock

import pandas as pd
import pytest
from dateutil.relativedelta import relativedelta

from api._tests.test_fixtures import generate_expected_timeline
from api.models.metrics import InstallActivity

PLUGIN_NAME = 'foo'


def to_timestamp(start, i):
    return int(pd.Timestamp(start + relativedelta(months=i)).timestamp()) * 1000


def generate_expected_results(start_range, to_installs=lambda i: 2 if i % 2 == 0 else 0):
    start = datetime.date.today().replace(day=1)
    return [Mock(timestamp=to_timestamp(start, i), install_count=to_installs(i)) for i in range(start_range, 0, 2)]


class TestInstallActivity:

    @staticmethod
    def _format_timestamp(timestamp, time_type):
        if time_type == 'DAY':
            return f'DAY:{timestamp.strftime("%Y%m%d")}'
        return f'MONTH:{timestamp.strftime("%Y%m")}'

    def _get_expected_condition(self, time_delta, time_type):
        if time_type == 'DAY':
            today = datetime.date.today()
            upper = self._format_timestamp(today, time_type)
            lower = self._format_timestamp(today - relativedelta(days=time_delta), time_type)
        else:
            now = datetime.datetime.now().replace(day=1) - relativedelta(months=1)
            upper = self._format_timestamp(now, time_type)
            lower = self._format_timestamp(now - relativedelta(months=time_delta - 1), time_type)
        return str(InstallActivity.type_timestamp.between(lower, upper))

    def test_get_total_installs_has_result(self, monkeypatch):
        expected = 173
        mock_install_activity = Mock(return_value=Mock(install_count=expected))

        from api.models.metrics import InstallActivity
        monkeypatch.setattr(InstallActivity, 'get', mock_install_activity)
        actual = InstallActivity.get_total_installs(PLUGIN_NAME)

        assert actual == expected
        mock_install_activity.assert_called_once_with(PLUGIN_NAME, 'TOTAL:')

    def test_get_total_installs_has_no_result(self, monkeypatch):
        def raise_exception(_, __):
            raise InstallActivity.DoesNotExist()

        from api.models.metrics import InstallActivity
        monkeypatch.setattr(InstallActivity, 'get', raise_exception)
        actual = InstallActivity.get_total_installs(PLUGIN_NAME)

        assert actual == 0

    @pytest.mark.parametrize(
        'results, expected', [
            ([], 0),
            ([Mock(install_count=10), Mock(install_count=24), Mock(install_count=19)], 53),
        ])
    def test_get_recent_installs(self, monkeypatch, results, expected):
        mock_install_activity = Mock(return_value=results)
        day_delta = 15

        from api.models.metrics import InstallActivity
        monkeypatch.setattr(InstallActivity, 'query', mock_install_activity)
        actual = InstallActivity.get_recent_installs(PLUGIN_NAME, day_delta)

        assert actual == expected
        mock_install_activity.assert_called_once()
        assert mock_install_activity.call_args.args[0] == PLUGIN_NAME
        assert str(mock_install_activity.call_args.args[1]) == self._get_expected_condition(day_delta, 'DAY')

    @pytest.mark.parametrize('results, month_delta, expected', [
        ([], 0, []),
        ([], 1, generate_expected_timeline(-1, to_installs=lambda i: 0)),
        (generate_expected_results(-4), 4, generate_expected_timeline(-4)),
    ])
    def test_get_usage_timeline(self, monkeypatch, results, month_delta, expected):
        mock_install_activity = Mock(return_value=results)

        from api.models.metrics import InstallActivity
        monkeypatch.setattr(InstallActivity, 'query', mock_install_activity)
        actual = InstallActivity.get_usage_timeline(PLUGIN_NAME, month_delta)

        assert actual == expected
        mock_install_activity.assert_called_once()
        assert mock_install_activity.call_args.args[0] == PLUGIN_NAME
        assert str(mock_install_activity.call_args.args[1]) == self._get_expected_condition(month_delta, 'MONTH')
