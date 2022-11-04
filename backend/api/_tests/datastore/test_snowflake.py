import unittest
from unittest.mock import patch
from api.data_store.snowflake import SnowflakeDAO

MOCK_SNOWFLAKE_USER = 'korra'
MOCK_SNOWFLAKE_PASSWORD = 'appa'

ACTIVITY_DATA_QUERY = """
        SELECT 
            file_project, DATE_TRUNC('month', timestamp) as month, count(*) as num_downloads
        FROM
            imaging.pypi.labeled_downloads
        WHERE 
            download_type = 'pip'
            AND project_type = 'plugin'
        GROUP BY file_project, month
        ORDER BY file_project, month
    """
RECENT_ACTIVITY_DATA_QUERY = """
        SELECT 
            file_project, count(*) as num_downloads
        FROM
            imaging.pypi.labeled_downloads
        WHERE 
            download_type = 'pip'
            AND project_type = 'plugin'
            AND timestamp > DATEADD(DAY, -30, CURRENT_DATE)
        GROUP BY file_project     
        ORDER BY file_project
    """


class MySnowflakeDAO(unittest.TestCase):

    def __int__(self):
        self.__test_snowflake = None

    @patch('snowflake.connector.connect')
    @patch.dict(
        'os.environ',
        {'SNOWFLAKE_USER': MOCK_SNOWFLAKE_USER, 'SNOWFLAKE_PASSWORD': MOCK_SNOWFLAKE_PASSWORD},
        True
    )
    def setUp(self, mock_snowflake_connector):
        self.__mock_snowflake_connector = mock_snowflake_connector
        self.__test_snowflake = SnowflakeDAO()
        mock_snowflake_connector.assert_called_once_with(account='CZI-IMAGING',
                                                         database='IMAGING',
                                                         password=MOCK_SNOWFLAKE_PASSWORD,
                                                         schema='PYPI',
                                                         user=MOCK_SNOWFLAKE_USER,
                                                         warehouse='IMAGING')

    def test_get_activity_data_query_returns_data(self):
        assert self.__test_snowflake is not None

    def test_get_activity_data_query_returns_no_data(self):
        assert self.__test_snowflake is not None

    def test_get_activity_data_query_throws_exception(self):
        assert self.__test_snowflake is not None

    def test_get_recent_activity_data_query_returns_data(self):
        assert self.__test_snowflake is not None

    def test_get_recent_activity_data_query_returns_no_data(self):
        assert self.__test_snowflake is not None

    def test_get_recent_activity_data_query_throws_exception(self):
        assert self.__test_snowflake is not None
