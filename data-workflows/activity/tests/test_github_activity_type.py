import re
from datetime import datetime, date
from typing import Optional, Callable, Union

import pytest

from activity.github_activity_model import GitHubActivityType

REPO = "demo/FOO"


def get_input_ts() -> datetime:
    return datetime.strptime("03/21/2023 10:24:20", "%m/%d/%Y %H:%M:%S")


REPO1 = "demo/FOO"
REPO2 = "org2/bar"


@pytest.fixture
def plugin_by_earliest_ts() -> dict[str, datetime]:
    return {
        REPO1: datetime.strptime("05/16/2023 10:24:20", "%m/%d/%Y %H:%M:%S"),
        REPO2: datetime.strptime("06/26/2023 20:30:00", "%m/%d/%Y %H:%M:%S"),
    }


@pytest.fixture
def remove_whitespace() -> Callable[[str], str]:
    return lambda formatted_str: re.compile(r"[ \t]+").sub(" ", formatted_str).strip()


@pytest.fixture
def get_maintenance_subquery(
    plugin_by_earliest_ts: dict[str, datetime]
) -> Callable[[GitHubActivityType], str]:
    def _get_maintenance_subquery(activity_type: GitHubActivityType) -> str:
        if activity_type != GitHubActivityType.MONTH:
            filters = [f"'{repo}'" for repo in plugin_by_earliest_ts.keys()]
            return f"repo IN ({','.join(filters)})"

        return " OR ".join(
            [
                f"repo = '{repo}' AND TO_TIMESTAMP(commit_author_date) >= "
                f"TO_TIMESTAMP('{ts.replace(day=1)}')"
                for repo, ts in plugin_by_earliest_ts.items()
            ]
        )

    return _get_maintenance_subquery


@pytest.mark.parametrize(
    "activity_type, projection, group_by",
    [
        (
            GitHubActivityType.LATEST,
            "TO_TIMESTAMP(MAX(commit_author_date)) AS latest_commit",
            "name",
        ),
        (
            GitHubActivityType.MONTH,
            "DATE_TRUNC('month', TO_DATE(commit_author_date)) AS month, "
            "COUNT(*) AS commit_count",
            "name, month",
        ),
        (
            GitHubActivityType.TOTAL,
            "COUNT(*) AS commit_count",
            "name",
        ),
    ],
)
def test_github_activity_type_query_generation(
    activity_type: GitHubActivityType,
    projection: str,
    group_by: str,
    plugin_by_earliest_ts: dict[str, datetime],
    get_maintenance_subquery: Callable[[GitHubActivityType], str],
    remove_whitespace: Callable[[str], str],
):
    expected_query = f"""
        SELECT
            repo AS name,
            {projection}
        FROM
            imaging.github.commits
        WHERE 
            repo_type = 'plugin'
            AND ({get_maintenance_subquery(activity_type)})
        GROUP BY {group_by}
        ORDER BY {group_by}
    """
    actual = activity_type.get_query(plugin_by_earliest_ts)
    assert remove_whitespace(actual) == remove_whitespace(expected_query)


@pytest.mark.parametrize(
    "activity_type, input_ts, timestamp, type_id, expiry",
    [
        (
            GitHubActivityType.LATEST,
            get_input_ts(),
            1679394260000,
            f"LATEST:{REPO}",
            None,
        ),
        (
            GitHubActivityType.MONTH,
            get_input_ts().date(),
            1679356800000,
            f"MONTH:202303:{REPO}",
            1716274800,
        ),
        (
            GitHubActivityType.MONTH,
            get_input_ts(),
            1679356800000,
            f"MONTH:202303:{REPO}",
            1716274800,
        ),
        (GitHubActivityType.TOTAL, None, None, f"TOTAL:{REPO}", None),
        (GitHubActivityType.TOTAL, get_input_ts().date(), None, f"TOTAL:{REPO}", None),
        (GitHubActivityType.TOTAL, get_input_ts(), None, f"TOTAL:{REPO}", None),
    ],
)
def test_github_activity_type(
    activity_type: GitHubActivityType,
    input_ts: Union[date, datetime, None],
    timestamp: Optional[int],
    type_id: str,
    expiry: Optional[int],
):
    assert activity_type.format_to_timestamp(input_ts) == timestamp
    assert activity_type.format_to_type_identifier(REPO, input_ts) == type_id
    assert activity_type.to_expiry(input_ts) == expiry
