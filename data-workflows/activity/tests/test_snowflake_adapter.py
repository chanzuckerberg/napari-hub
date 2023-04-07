from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
import snowflake.connector

from activity.install_activity_model import InstallActivityType

SNOWFLAKE_USER = 'super-secret-username'
SNOWFLAKE_PASSWORD = 'a-password-that-cant-be-shared'
START_TIME = 1615705553000
END_TIME = 1647241553000

CONNECTION_PARAMS = {'user': SNOWFLAKE_USER, 'password': SNOWFLAKE_PASSWORD, 'account': "CZI-IMAGING",
                     'warehouse': "IMAGING", 'database': "IMAGING", 'schema': "PYPI", }


def to_ts(epoch):
    return datetime.fromtimestamp(epoch, tz=timezone.utc)


PLUGINS_BY_EARLIEST_TS = {'foo': to_ts(1615680000), 'bar': to_ts(1656979200), 'baz': to_ts(1687737600)}


def get_plugins_with_installs_in_window_query():
    return """
            SELECT 
                LOWER(file_project) AS name, DATE_TRUNC('DAY', MIN(timestamp)) AS earliest_timestamp
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_timestamp) > TO_TIMESTAMP(convert_timezone('UTC', '2021-03-13 23:05:53'))
                AND TO_TIMESTAMP(ingestion_timestamp) <= TO_TIMESTAMP(convert_timezone('UTC', '2022-03-14 00:05:53'))
            GROUP BY file_project
            ORDER BY file_project
            """


def get_plugins_install_count_since_timestamp_query(projection, subquery):
    return f"""
            SELECT 
                LOWER(file_project) AS plugin, 
                {projection} AS timestamp, 
                COUNT(*) AS count
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND ({subquery})
            GROUP BY 1, 2
            ORDER BY 1, 2
            """


class MockSnowflakeCursor:

    def __init__(self, data, row_field_count):
        self._data = data
        self._size = len(data)
        self._index = -1
        self._row_field_count = row_field_count

    def __iter__(self):
        return self

    def __next__(self):
        if self._index < self._size - 1:
            self._index += 1
            if self._row_field_count == 3:
                return self._data[self._index][0], self._data[self._index][1], self._data[self._index][2]
            else:
                return self._data[self._index][0], self._data[self._index][1]
        raise StopIteration


class TestSnowflakeAdapter:
    def _get_mock_snowflake_connect(self, *_, **kwargs):
        if CONNECTION_PARAMS == kwargs:
            self._connection_mock = Mock()
            self._connection_mock.execute_string.return_value = self._expected_cursor_result
            return self._connection_mock
        return None

    @pytest.fixture(autouse=True)
    def _setup_method(self, monkeypatch):
        monkeypatch.setenv('SNOWFLAKE_USER', SNOWFLAKE_USER)
        monkeypatch.setenv('SNOWFLAKE_PASSWORD', SNOWFLAKE_PASSWORD)
        monkeypatch.setattr(snowflake.connector, 'connect', self._get_mock_snowflake_connect)

    def test_get_plugins_with_installs_in_window_no_result(self):
        self._expected_cursor_result = [MockSnowflakeCursor([], 2)]
        from activity.snowflake_adapter import get_plugins_with_installs_in_window
        actual = get_plugins_with_installs_in_window(START_TIME, END_TIME)

        assert {} == actual
        self._connection_mock.execute_string.assert_called_once_with(get_plugins_with_installs_in_window_query())

    def test_get_plugins_with_installs_in_window_with_result(self):
        self._expected_cursor_result = [
            MockSnowflakeCursor([['foo', to_ts(1615680000)], ['bar', to_ts(1656979200)]], 2),
            MockSnowflakeCursor([['baz', to_ts(1687737600)]], 2)
        ]

        from activity.snowflake_adapter import get_plugins_with_installs_in_window
        actual = get_plugins_with_installs_in_window(START_TIME, END_TIME)

        assert PLUGINS_BY_EARLIEST_TS == actual
        self._connection_mock.execute_string.assert_called_once_with(get_plugins_with_installs_in_window_query())

    @pytest.mark.parametrize('expected_cursor_result,expected', [
        ([MockSnowflakeCursor([], 3)], {}),
        ([
             MockSnowflakeCursor([['foo', to_ts(1629072000), 2], ['bar', to_ts(1666656000), 8]], 3),
             MockSnowflakeCursor([['foo', to_ts(1662940800), 3]], 3)
         ],
         {
             'foo': [{'timestamp': to_ts(1629072000), 'count': 2}, {'timestamp': to_ts(1662940800), 'count': 3}],
             'bar': [{'timestamp': to_ts(1666656000), 'count': 8}],
         })
    ])
    def test_get_plugins_install_count_since_timestamp_for_day(self, expected_cursor_result, expected):
        self._expected_cursor_result = expected_cursor_result

        from activity.snowflake_adapter import get_plugins_install_count_since_timestamp
        actual = get_plugins_install_count_since_timestamp(PLUGINS_BY_EARLIEST_TS, InstallActivityType.DAY)

        assert expected == actual
        subquery = "LOWER(file_project) = 'foo' AND timestamp >= TO_TIMESTAMP('2021-03-14 00:00:00') OR " \
                   "LOWER(file_project) = 'bar' AND timestamp >= TO_TIMESTAMP('2022-07-05 00:00:00') OR " \
                   "LOWER(file_project) = 'baz' AND timestamp >= TO_TIMESTAMP('2023-06-26 00:00:00')"
        query = get_plugins_install_count_since_timestamp_query("DATE_TRUNC('DAY', timestamp)", subquery)
        self._connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize('expected_cursor_result,expected', [
        ([MockSnowflakeCursor([], 3)], {}),
        ([
             MockSnowflakeCursor([['foo', to_ts(1629072000), 2], ['bar', to_ts(1666656000), 8]], 3),
             MockSnowflakeCursor([['foo', to_ts(1662940800), 3]], 3)
         ],
         {
             'foo': [{'timestamp': to_ts(1629072000), 'count': 2}, {'timestamp': to_ts(1662940800), 'count': 3}],
             'bar': [{'timestamp': to_ts(1666656000), 'count': 8}],
         })
    ])
    def test_get_plugins_install_count_since_timestamp_for_month(self, expected_cursor_result, expected):
        self._expected_cursor_result = expected_cursor_result

        from activity.snowflake_adapter import get_plugins_install_count_since_timestamp
        actual = get_plugins_install_count_since_timestamp(PLUGINS_BY_EARLIEST_TS, InstallActivityType.MONTH)

        assert expected == actual
        subquery = "LOWER(file_project) = 'foo' AND timestamp >= TO_TIMESTAMP('2021-03-01 00:00:00') OR " \
                   "LOWER(file_project) = 'bar' AND timestamp >= TO_TIMESTAMP('2022-07-01 00:00:00') OR " \
                   "LOWER(file_project) = 'baz' AND timestamp >= TO_TIMESTAMP('2023-06-01 00:00:00')"
        query = get_plugins_install_count_since_timestamp_query("DATE_TRUNC('MONTH', timestamp)", subquery)
        self._connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize('expected_cursor_result,expected', [
        ([MockSnowflakeCursor([], 3)], {}),
        ([
             MockSnowflakeCursor([['foo', to_ts(1629072000), 2], ['bar', to_ts(1666656000), 8]], 3),
             MockSnowflakeCursor([['baz', to_ts(1662940800), 10]], 3)
         ],
         {
             'foo': [{'timestamp': to_ts(1629072000), 'count': 2}],
             'bar': [{'timestamp': to_ts(1666656000), 'count': 8}],
             'baz': [{'timestamp': to_ts(1662940800), 'count': 10}]
         })
    ])
    def test_get_plugins_install_count_since_timestamp_for_total(self, expected_cursor_result, expected):
        self._expected_cursor_result = expected_cursor_result

        from activity.snowflake_adapter import get_plugins_install_count_since_timestamp
        actual = get_plugins_install_count_since_timestamp(PLUGINS_BY_EARLIEST_TS, InstallActivityType.TOTAL)

        assert expected == actual
        subquery = "LOWER(file_project) IN ('foo','bar','baz')"
        query = get_plugins_install_count_since_timestamp_query("1", subquery)
        self._connection_mock.execute_string.assert_called_once_with(query)
