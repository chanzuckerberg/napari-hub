import pytest
from datetime import datetime, timezone, time
from dateutil.relativedelta import relativedelta

from activity.github_activity_model import GitHubActivityType
from activity.snowflake_adapter import (
    get_plugins_with_commits_in_window,
    get_plugins_commit_count_since_timestamp,
)
from activity.tests.test_fixture import MockSnowflakeCursor

START_TIME = 1615705553000
END_TIME = datetime.now().replace(tzinfo=timezone.utc)
END_TIMESTAMP = int(END_TIME.timestamp() * 1000)


def to_datetime(epoch) -> datetime:
    return datetime.fromtimestamp(epoch, tz=timezone.utc)


def relative_datetime(*args, **kwargs) -> datetime:
    first_day_of_month = datetime.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
    )
    return first_day_of_month - relativedelta(**kwargs)


def generate_expected(matching_values):
    expected = []
    for i in range(13, -1, -1):
        ts = relative_datetime(months=i)
        expected.append({"timestamp": ts.date(), "count": matching_values.get(ts, 0)})
    return expected


class TestGithubSnowflakeAdapter:
    @pytest.fixture
    def plugins_with_commits_in_window_query(self):
        end_time = END_TIME.strftime("%Y-%m-%d %H:%M:%S")
        query = f"""
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
        return query

    @pytest.fixture
    def get_plugins_commit_count_since_timestamp_query(self):
        return (
            lambda projection, subquery, grouping: f"""
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
        )

    @pytest.fixture
    def github_connection_params(self, connection_params) -> dict[str, str]:
        connection_params["schema"] = "GITHUB"
        return connection_params

    def test_get_plugins_with_commits_in_window_no_result(
        self,
        github_connection_params,
        setup_connection,
        plugins_with_commits_in_window_query,
    ):
        connection_mock = setup_connection(
            github_connection_params, [MockSnowflakeCursor([], 2)]
        )

        actual = get_plugins_with_commits_in_window(START_TIME, END_TIMESTAMP)

        assert {} == actual
        connection_mock.execute_string.assert_called_once_with(
            plugins_with_commits_in_window_query
        )

    def test_get_plugins_with_commits_in_window_with_result(
        self,
        github_connection_params,
        setup_connection,
        to_ts,
        plugins_with_commits_in_window_query,
        plugins_by_earliest_ts,
    ):
        expected_cursor_result = [
            MockSnowflakeCursor(
                [["foo", to_datetime(1615680000)], ["bar", to_datetime(1656979200)]],
                2,
            ),
            MockSnowflakeCursor([["baz", to_datetime(1687737600)]], 2),
        ]
        connection_mock = setup_connection(
            github_connection_params, expected_cursor_result
        )

        actual = get_plugins_with_commits_in_window(START_TIME, END_TIMESTAMP)

        assert plugins_by_earliest_ts == actual
        connection_mock.execute_string.assert_called_once_with(
            plugins_with_commits_in_window_query
        )

    @pytest.mark.parametrize(
        "expected_cursor_result, expected",
        [
            ([MockSnowflakeCursor([], 2)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [
                            ["foo", to_datetime(1629072000)],
                            ["bar", to_datetime(1666656000)],
                        ],
                        2,
                    ),
                    MockSnowflakeCursor([["baz", to_datetime(1662940800)]], 2),
                ],
                {
                    "foo": [{"timestamp": to_datetime(1629072000)}],
                    "bar": [{"timestamp": to_datetime(1666656000)}],
                    "baz": [{"timestamp": to_datetime(1662940800)}],
                },
            ),
        ],
    )
    def test_get_plugins_commit_count_since_timestamp_for_latest_commit(
        self,
        github_connection_params,
        setup_connection,
        plugins_by_earliest_ts,
        get_plugins_commit_count_since_timestamp_query,
        expected_cursor_result,
        expected,
    ):
        connection_mock = setup_connection(
            github_connection_params, expected_cursor_result
        )

        actual = get_plugins_commit_count_since_timestamp(
            plugins_by_earliest_ts, GitHubActivityType.LATEST
        )

        assert expected == actual
        query = get_plugins_commit_count_since_timestamp_query(
            "TO_TIMESTAMP(MAX(commit_author_date)) AS latest_commit",
            "(repo IN ('foo','bar','baz'))",
            "name",
        )
        connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize(
        "expected_cursor_result, expected",
        [
            ([MockSnowflakeCursor([], 3)], {}),
            (
                [
                    MockSnowflakeCursor(
                        [
                            ["foo", relative_datetime(months=1).date(), 2],
                            ["bar", relative_datetime(months=5).date(), 8],
                        ],
                        3,
                    ),
                    MockSnowflakeCursor(
                        [["foo", relative_datetime(months=12).date(), 3]], 3
                    ),
                ],
                {
                    "foo": generate_expected(
                        {
                            relative_datetime(months=1): 2,
                            relative_datetime(months=12): 3,
                        }
                    ),
                    "bar": generate_expected({relative_datetime(months=5): 8}),
                },
            ),
        ],
    )
    def test_get_plugins_commit_count_since_timestamp_for_month(
        self,
        github_connection_params,
        setup_connection,
        plugins_by_earliest_ts,
        get_plugins_commit_count_since_timestamp_query,
        expected_cursor_result,
        expected,
    ):
        connection_mock = setup_connection(
            github_connection_params, expected_cursor_result
        )

        actual = get_plugins_commit_count_since_timestamp(
            plugins_by_earliest_ts, GitHubActivityType.MONTH
        )

        assert expected == actual

        timestamp = datetime.combine(
            datetime.now() - relativedelta(months=14), time.min
        ).replace(day=1)
        subquery = (
            "(repo IN ('foo','bar','baz') AND TO_TIMESTAMP(commit_author_date)"
            f" >= TO_TIMESTAMP('{timestamp}'))"
        )
        query = get_plugins_commit_count_since_timestamp_query(
            "DATE_TRUNC('month', TO_DATE(commit_author_date)) AS month, COUNT(*) AS commit_count",
            subquery,
            "name, month",
        )
        connection_mock.execute_string.assert_called_once_with(query)

    @pytest.mark.parametrize(
        "expected_cursor_result, expected",
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
        self,
        github_connection_params,
        setup_connection,
        plugins_by_earliest_ts,
        get_plugins_commit_count_since_timestamp_query,
        expected_cursor_result,
        expected,
    ):
        connection_mock = setup_connection(
            github_connection_params, expected_cursor_result
        )
        actual = get_plugins_commit_count_since_timestamp(
            plugins_by_earliest_ts, GitHubActivityType.TOTAL
        )

        assert expected == actual
        subquery = "(repo IN ('foo','bar','baz'))"
        query = get_plugins_commit_count_since_timestamp_query(
            "COUNT(*) AS commit_count", subquery, "name"
        )
        connection_mock.execute_string.assert_called_once_with(query)
