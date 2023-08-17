from datetime import datetime, timezone
from unittest.mock import Mock

import pytest
import snowflake.connector
from dateutil.relativedelta import relativedelta

from activity.github_activity_model import GitHubActivityType
from activity.install_activity_model import InstallActivityType
from activity.snowflake_adapter import (
    get_plugins_with_installs_in_window,
    get_plugins_install_count_since_timestamp,
    get_plugins_with_commits_in_window,
    get_plugins_commit_count_since_timestamp,
)

SNOWFLAKE_USER = "super-secret-username"
SNOWFLAKE_PASSWORD = "a-password-that-cant-be-shared"
START_TIME = 1615705553000
END_TIME = datetime.now().replace(tzinfo=timezone.utc)
END_TIMESTAMP = int(END_TIME.timestamp() * 1000)


def to_ts(epoch) -> datetime:
    return datetime.fromtimestamp(epoch, tz=timezone.utc)


def to_datetime(*args, **kwargs) -> datetime:
    first_day_of_month = datetime.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
    )
    return first_day_of_month - relativedelta(**kwargs)


def get_plugins_with_installs_in_window_query():
    end_time = END_TIME.strftime("%Y-%m-%d %H:%M:%S")
    return f"""
            SELECT 
                LOWER(file_project) AS name, 
                DATE_TRUNC('DAY', MIN(timestamp)) AS earliest_timestamp
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_timestamp) > TO_TIMESTAMP('2021-03-14 07:05:53')
                AND TO_TIMESTAMP(ingestion_timestamp) <= TO_TIMESTAMP('{end_time}')
            GROUP BY name
            ORDER BY name
            """


def get_plugins_install_count_since_timestamp_query(projection, subquery):
    return f"""
            SELECT 
                LOWER(file_project) AS name, 
                {projection} AS ts, 
                COUNT(*) AS count
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND ({subquery})
            GROUP BY name, ts
            ORDER BY name, ts
            """


def get_plugins_commit_count_since_timestamp_query(projection, subquery, grouping):
    return f"""
                SELECT
                    repo AS name,
                    {projection}
                FROM
                    imaging.github.commits
                WHERE 
                    repo_type = 'plugin'
                    AND {subquery}
                GROUP BY {grouping}
                ORDER BY {grouping}
                """


def get_plugins_with_commits_in_window_query():
    end_time = END_TIME.strftime("%Y-%m-%d %H:%M:%S")
    return f"""
            SELECT 
                repo AS name, 
                DATE_TRUNC('DAY', TO_DATE(min(commit_author_date))) AS earliest_timestamp 
            FROM 
                imaging.github.commits  
            WHERE 
                repo_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_time) > TO_TIMESTAMP('2021-03-14 07:05:53')
                AND TO_TIMESTAMP(ingestion_time) <= TO_TIMESTAMP('{end_time}')
            GROUP BY name
            ORDER BY name
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
                return (
                    self._data[self._index][0],
                    self._data[self._index][1],
                    self._data[self._index][2],
                )
            else:
                return self._data[self._index][0], self._data[self._index][1]
        raise StopIteration


def _generate_expected(matching_values):
    expected = []
    for i in range(13, -1, -1):
        ts = to_datetime(months=i)
        expected.append({"timestamp": ts, "count": matching_values.get(ts, 0)})
    return expected


class TestSnowflakeAdapter:
    def _get_mock_snowflake_connect(self, *_, **kwargs):
        if self._connection_params == kwargs:
            self._connection_mock = Mock()
            self._connection_mock.execute_string.return_value = (
                self._expected_cursor_result
            )
            return self._connection_mock
        return None

    @pytest.fixture(autouse=True)
    def _setup_method(self, monkeypatch):
        monkeypatch.setenv("SNOWFLAKE_USER", SNOWFLAKE_USER)
        monkeypatch.setenv("SNOWFLAKE_PASSWORD", SNOWFLAKE_PASSWORD)
        monkeypatch.setattr(
            snowflake.connector, "connect", self._get_mock_snowflake_connect
        )

    @pytest.fixture(autouse=True)
    def connection_params(self) -> None:
        self._connection_params = {
            "user": SNOWFLAKE_USER,
            "password": SNOWFLAKE_PASSWORD,
            "account": "CZI-IMAGING",
            "warehouse": "IMAGING",
            "database": "IMAGING",
        }

    @pytest.fixture
    def plugins_by_earliest_ts(self) -> dict[str, datetime]:
        return {
            "foo": to_ts(1615680000),
            "bar": to_ts(1656979200),
            "baz": to_ts(1687737600),
        }

    def test_get_plugins_with_installs_in_window_no_result(self):
        self._connection_params["schema"] = "PYPI"
        self._expected_cursor_result = [MockSnowflakeCursor([], 2)]

        actual = get_plugins_with_installs_in_window(START_TIME, END_TIMESTAMP)

        assert {} == actual
        self._connection_mock.execute_string.assert_called_once_with(
            get_plugins_with_installs_in_window_query()
        )

    def test_get_plugins_with_installs_in_window_with_result(
        self, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "PYPI"
        self._expected_cursor_result = [
            MockSnowflakeCursor(
                [["foo", to_ts(1615680000)], ["bar", to_ts(1656979200)]], 2
            ),
            MockSnowflakeCursor([["baz", to_ts(1687737600)]], 2),
        ]

        actual = get_plugins_with_installs_in_window(START_TIME, END_TIMESTAMP)

        assert plugins_by_earliest_ts == actual
        self._connection_mock.execute_string.assert_called_once_with(
            get_plugins_with_installs_in_window_query()
        )

    @pytest.mark.parametrize(
        "expected_cursor_result,expected",
        [
            ([MockSnowflakeCursor([], 3)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [["foo", to_ts(1629072000), 2], ["bar", to_ts(1666656000), 8]],
                        3,
                    ),
                    MockSnowflakeCursor([["foo", to_ts(1662940800), 3]], 3),
                ],
                {
                    "foo": [
                        {"timestamp": to_ts(1629072000), "count": 2},
                        {"timestamp": to_ts(1662940800), "count": 3},
                    ],
                    "bar": [{"timestamp": to_ts(1666656000), "count": 8}],
                },
            ),
        ],
    )
    def test_get_plugins_install_count_since_timestamp_for_day(
        self, expected_cursor_result, expected, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "PYPI"
        self._expected_cursor_result = expected_cursor_result

        actual = get_plugins_install_count_since_timestamp(
            plugins_by_earliest_ts, InstallActivityType.DAY
        )

        assert expected == actual
        subquery = (
            "LOWER(file_project) = 'foo' AND timestamp >= TO_TIMESTAMP('2021-03-14 00:00:00') OR "
            "LOWER(file_project) = 'bar' AND timestamp >= TO_TIMESTAMP('2022-07-05 00:00:00') OR "
            "LOWER(file_project) = 'baz' AND timestamp >= TO_TIMESTAMP('2023-06-26 00:00:00')"
        )
        query = get_plugins_install_count_since_timestamp_query(
            "DATE_TRUNC('DAY', timestamp)", subquery
        )
        self._connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize(
        "expected_cursor_result,expected",
        [
            ([MockSnowflakeCursor([], 3)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [["foo", to_ts(1629072000), 2], ["bar", to_ts(1666656000), 8]],
                        3,
                    ),
                    MockSnowflakeCursor([["foo", to_ts(1662940800), 3]], 3),
                ],
                {
                    "foo": [
                        {"timestamp": to_ts(1629072000), "count": 2},
                        {"timestamp": to_ts(1662940800), "count": 3},
                    ],
                    "bar": [{"timestamp": to_ts(1666656000), "count": 8}],
                },
            ),
        ],
    )
    def test_get_plugins_install_count_since_timestamp_for_month(
        self, expected_cursor_result, expected, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "PYPI"
        self._expected_cursor_result = expected_cursor_result

        actual = get_plugins_install_count_since_timestamp(
            plugins_by_earliest_ts, InstallActivityType.MONTH
        )

        assert expected == actual
        subquery = (
            "LOWER(file_project) = 'foo' AND timestamp >= TO_TIMESTAMP('2021-03-01 00:00:00') OR "
            "LOWER(file_project) = 'bar' AND timestamp >= TO_TIMESTAMP('2022-07-01 00:00:00') OR "
            "LOWER(file_project) = 'baz' AND timestamp >= TO_TIMESTAMP('2023-06-01 00:00:00')"
        )
        query = get_plugins_install_count_since_timestamp_query(
            "DATE_TRUNC('MONTH', timestamp)", subquery
        )
        self._connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize(
        "expected_cursor_result,expected",
        [
            ([MockSnowflakeCursor([], 3)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [["foo", to_ts(1629072000), 2], ["bar", to_ts(1666656000), 8]],
                        3,
                    ),
                    MockSnowflakeCursor([["baz", to_ts(1662940800), 10]], 3),
                ],
                {
                    "foo": [{"timestamp": to_ts(1629072000), "count": 2}],
                    "bar": [{"timestamp": to_ts(1666656000), "count": 8}],
                    "baz": [{"timestamp": to_ts(1662940800), "count": 10}],
                },
            ),
        ],
    )
    def test_get_plugins_install_count_since_timestamp_for_total(
        self, expected_cursor_result, expected, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "PYPI"
        self._expected_cursor_result = expected_cursor_result

        actual = get_plugins_install_count_since_timestamp(
            plugins_by_earliest_ts, InstallActivityType.TOTAL
        )

        assert expected == actual
        subquery = "LOWER(file_project) IN ('foo','bar','baz')"
        query = get_plugins_install_count_since_timestamp_query("1", subquery)
        self._connection_mock.execute_string.assert_called_once_with(query)

    def test_get_plugins_with_commits_in_window_no_result(self):
        self._connection_params["schema"] = "GITHUB"
        self._expected_cursor_result = [MockSnowflakeCursor([], 2)]

        actual = get_plugins_with_commits_in_window(START_TIME, END_TIMESTAMP)

        assert {} == actual
        self._connection_mock.execute_string.assert_called_once_with(
            get_plugins_with_commits_in_window_query()
        )

    def test_get_plugins_with_commits_in_window_with_result(
        self, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "GITHUB"
        self._expected_cursor_result = [
            MockSnowflakeCursor(
                [["foo", to_ts(1615680000)], ["bar", to_ts(1656979200)]], 2
            ),
            MockSnowflakeCursor([["baz", to_ts(1687737600)]], 2),
        ]

        actual = get_plugins_with_commits_in_window(START_TIME, END_TIMESTAMP)

        assert plugins_by_earliest_ts == actual
        self._connection_mock.execute_string.assert_called_once_with(
            get_plugins_with_commits_in_window_query()
        )

    @pytest.mark.parametrize(
        "expected_cursor_result,expected",
        [
            ([MockSnowflakeCursor([], 2)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [["foo", to_ts(1629072000)], ["bar", to_ts(1666656000)]],
                        2,
                    ),
                    MockSnowflakeCursor([["baz", to_ts(1662940800)]], 2),
                ],
                {
                    "foo": [{"timestamp": to_ts(1629072000)}],
                    "bar": [{"timestamp": to_ts(1666656000)}],
                    "baz": [{"timestamp": to_ts(1662940800)}],
                },
            ),
        ],
    )
    def test_get_plugins_commit_count_since_timestamp_for_latest_commit(
        self, expected_cursor_result, expected, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "GITHUB"
        self._expected_cursor_result = expected_cursor_result

        actual = get_plugins_commit_count_since_timestamp(
            plugins_by_earliest_ts, GitHubActivityType.LATEST
        )

        assert expected == actual
        query = get_plugins_commit_count_since_timestamp_query(
            "TO_TIMESTAMP(MAX(commit_author_date)) AS latest_commit",
            "(repo IN ('foo','bar','baz'))",
            "name",
        )
        self._connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize(
        "expected_cursor_result,expected",
        [
            ([MockSnowflakeCursor([], 3)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [
                            ["foo", to_datetime(months=1), 2],
                            ["bar", to_datetime(months=5), 8],
                        ],
                        3,
                    ),
                    MockSnowflakeCursor([["foo", to_datetime(months=12), 3]], 3),
                ],
                {
                    "foo": _generate_expected(
                        {to_datetime(months=1): 2, to_datetime(months=12): 3}
                    ),
                    "bar": _generate_expected({to_datetime(months=5): 8}),
                },
            ),
        ],
    )
    def test_get_plugins_install_count_since_timestamp_for_month(
        self, expected_cursor_result, expected, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "GITHUB"
        self._expected_cursor_result = expected_cursor_result

        actual = get_plugins_commit_count_since_timestamp(
            plugins_by_earliest_ts, GitHubActivityType.MONTH
        )

        assert expected == actual
        subquery = (
            "(repo = 'foo' AND TO_TIMESTAMP(commit_author_date) >= TO_TIMESTAMP('2021-03-01 00:00:00') OR "
            "repo = 'bar' AND TO_TIMESTAMP(commit_author_date) >= TO_TIMESTAMP('2022-07-01 00:00:00') OR "
            "repo = 'baz' AND TO_TIMESTAMP(commit_author_date) >= TO_TIMESTAMP('2023-06-01 00:00:00')) AND "
            "TO_TIMESTAMP(commit_author_date) > (SELECT DATEADD('month', -14, GETDATE()))"
        )
        query = get_plugins_commit_count_since_timestamp_query(
            "DATE_TRUNC('month', TO_DATE(commit_author_date)) AS month, COUNT(*) AS commit_count",
            subquery,
            "name, month",
        )
        self._connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize(
        "expected_cursor_result,expected",
        [
            ([MockSnowflakeCursor([], 2)], {}),
            (
                [
                    MockSnowflakeCursor([["foo", 2], ["bar", 8]], 2),
                    MockSnowflakeCursor([["baz", 10]], 2),
                ],
                {
                    "foo": [{"count": 2}],
                    "bar": [{"count": 8}],
                    "baz": [{"count": 10}],
                },
            ),
        ],
    )
    def test_get_plugins_commit_count_since_timestamp_for_total(
        self, expected_cursor_result, expected, plugins_by_earliest_ts
    ):
        self._connection_params["schema"] = "GITHUB"
        self._expected_cursor_result = expected_cursor_result

        actual = get_plugins_commit_count_since_timestamp(
            plugins_by_earliest_ts, GitHubActivityType.TOTAL
        )

        assert expected == actual
        subquery = "(repo IN ('foo','bar','baz'))"
        query = get_plugins_commit_count_since_timestamp_query(
            "COUNT(*) AS commit_count", subquery, "name"
        )
        self._connection_mock.execute_string.assert_called_once_with(query)
