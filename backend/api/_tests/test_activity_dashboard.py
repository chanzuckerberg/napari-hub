import unittest
from unittest.mock import patch

import pandas as pd
from api import model

mock_dates = ['2022-05-01', '2022-09-01', '2021-07-01']
mock_installs = [1, 1, 1]
mock_df = pd.DataFrame(list(zip(mock_dates, mock_installs)), columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])
mock_df['MONTH'] = pd.to_datetime(mock_df['MONTH'])


class TestActivityDashboard(unittest.TestCase):

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=mock_df.copy()
    )
    def test_get_installs_nonempty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs
        result = get_installs('string-1')
        assert len(result) == 3
        assert hasattr(result[0], 'x')
        assert hasattr(result[0], 'y')
        expected_ms = mock_df.iloc[[1]].MONTH.astype(int) / int(1e6)
        assert result[1].x == expected_ms.item()
        assert result[1].y == 1

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=pd.DataFrame(columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])
    )
    def test_get_installs_empty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs
        result = get_installs('string-1')
        assert result == []

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=mock_df.copy()
    )
    def test_get_installs_stats_nonempty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs_stats
        result = get_installs_stats('string-1')
        assert result.totalInstallCount == 3
        assert result.totalMonths == 14

    @patch.object(
        model, 'get_activity_dashboard_data', return_value=pd.DataFrame(columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])
    )
    def test_get_installs_stats_empty(self, mock_get_activity_dashboard_data):
        from api.model import get_installs_stats
        result = get_installs_stats('string-1')
        print(result)
        assert result is None
