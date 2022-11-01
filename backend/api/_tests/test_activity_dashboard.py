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


class TestActivityDashboard(unittest.TestCase):

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=mock_df.copy()
    )
    def test_get_installs_nonempty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs
        result = get_installs('string-1', '3')
        assert result == self.__generate_expected(-3)

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=mock_df.copy()
    )
    def test_get_installs_zero_limit(self, mock_get_activity_dashboard_data):
        from api.model import get_installs
        result = get_installs('string-1', '0')
        assert result == []

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=empty_df.copy()
    )
    def test_get_installs_no_data(self, mock_get_activity_dashboard_data):
        from api.model import get_installs
        result = get_installs('string-1', '1')
        assert result == self.__generate_expected(-1)

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=mock_df.copy()
    )
    def test_get_installs_stats_nonempty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs_stats
        result = get_installs_stats('string-1')
        expected = {'totalInstalls': sum(mock_installs), 'totalMonths': 10}
        assert result == expected

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=empty_df.copy()
    )
    def test_get_installs_stats_empty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs_stats
        result = get_installs_stats('string-1')
        assert result is None

    def __generate_expected(self, start_range):
        return [{'x': int(pd.Timestamp(base + relativedelta(months=i)).timestamp()) * 1000, 'y': 2 if i % 2 == 0 else 0 } for i in range(start_range, 0)]