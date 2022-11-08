import unittest
from unittest.mock import patch, Mock
from api.dao.snowflake_db import SnowflakeDAO
import snowflake

MOCK_SNOWFLAKE_USER = 'appa'
MOCK_SNOWFLAKE_PASSWORD = 'yip-yip'

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


def create_mock(cursors):
    mock_snowflake_connection = Mock()
    mock_snowflake_connection.execute_string.return_value = cursors
    return mock_snowflake_connection


def create_mock_with_exception():
    mock_snowflake_connection = Mock()
    mock_snowflake_connection.execute_string.side_effect = Exception('Test')
    return mock_snowflake_connection


class MySnowflakeDAO(unittest.TestCase):

    @patch.dict(
        'os.environ',
        {'SNOWFLAKE_USER': MOCK_SNOWFLAKE_USER, 'SNOWFLAKE_PASSWORD': MOCK_SNOWFLAKE_PASSWORD},
        True
    )
    def setUp(self) -> None:
        self.test_snowflake = SnowflakeDAO()

    @patch.object(
        snowflake.connector,
        'connect',
        return_value=create_mock([[['foo', 1], ['bar', "3"], ['baz', 6]], [['baz', 9]]])
    )
    def test_get_recent_activity_data_query_returns_data(self, mock_snowflake_connection):
        self.assertEqual({"foo": 1, "bar": "3", "baz": 9}, self.test_snowflake.get_recent_activity_data())
        self.__verify_calls(mock_snowflake_connection, RECENT_ACTIVITY_DATA_QUERY)

    @patch.object(snowflake.connector, 'connect', return_value=create_mock([]))
    def test_get_recent_activity_data_query_returns_no_data(self, mock_snowflake_connection):
        self.assertEqual({}, self.test_snowflake.get_recent_activity_data())
        self.__verify_calls(mock_snowflake_connection, RECENT_ACTIVITY_DATA_QUERY)

    @patch.object(snowflake.connector, 'connect', return_value=create_mock_with_exception())
    def test_get_recent_activity_data_query_raise_exception(self, mock_snowflake_connection):
        actual = self.test_snowflake.get_recent_activity_data()
        self.assertIsNone(actual)
        self.__verify_calls(mock_snowflake_connection, RECENT_ACTIVITY_DATA_QUERY)

    @patch.object(
        snowflake.connector,
        'connect',
        return_value=create_mock([
            [['foo', '01-07-2022', 100], ['bar', '01-08-2022', 24]], [['baz', '01-10-2022', 29]],
            [['foo', '01-11-2022', 200]],
            []
        ])
    )
    def test_get_activity_data_query_returns_data(self, mock_snowflake_connection):
        expected = {
            'bar': [{'downloads': 24, 'month': '01-08-2022'}],
            'baz': [{'downloads': 29, 'month': '01-10-2022'}],
            'foo': [{'downloads': 100, 'month': '01-07-2022'}, {'downloads': 200, 'month': '01-11-2022'}]
        }
        self.assertEqual(expected, self.test_snowflake.get_activity_data())
        self.__verify_calls(mock_snowflake_connection, ACTIVITY_DATA_QUERY)

    @patch.object(snowflake.connector, 'connect', return_value=create_mock([]))
    def test_get_activity_data_query_returns_no_data(self, mock_snowflake_connection):
        self.assertEqual({}, self.test_snowflake.get_activity_data())
        self.__verify_calls(mock_snowflake_connection, ACTIVITY_DATA_QUERY)

    @patch.object(snowflake.connector, 'connect', return_value=create_mock_with_exception())
    def test_get_activity_data_query_raise_exception(self, mock_snowflake_connection):
        actual = self.test_snowflake.get_activity_data()
        self.assertIsNone(actual)
        self.__verify_calls(mock_snowflake_connection, ACTIVITY_DATA_QUERY)

    @staticmethod
    def __verify_calls(mock_snowflake_connection, query):
        mock_snowflake_connection.assert_called_once_with(account='CZI-IMAGING',
                                                          database='IMAGING',
                                                          password=MOCK_SNOWFLAKE_PASSWORD,
                                                          schema='PYPI',
                                                          user=MOCK_SNOWFLAKE_USER,
                                                          warehouse='IMAGING')
        mock_snowflake_connection.return_value.execute_string.assert_called_once_with(query)
