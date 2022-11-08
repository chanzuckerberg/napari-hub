import unittest
from unittest.mock import patch

from api.dao import s3


class TestActivityModel(unittest.TestCase):
    RECENT_ACTIVITY_DATA = {'foo': 10, 'bar': 15}

    @patch.object(s3.S3DAO, 'get_recent_activity_dashboard_data', return_value=RECENT_ACTIVITY_DATA)
    def test_plugin_data_has_installs(self, _):
        from api.model import get_recent_installs_stats
        actual = get_recent_installs_stats('foo')
        self.assertEqual({'installsInLast30Days': 10}, actual)

    @patch.object(s3.S3DAO, 'get_recent_activity_dashboard_data', return_value=RECENT_ACTIVITY_DATA)
    def test_plugin_data_has_installs(self, _):
        from api.model import get_recent_installs_stats
        actual = get_recent_installs_stats('baz')
        self.assertEqual({'installsInLast30Days': 0}, actual)
