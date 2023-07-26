import logging
import time
from datetime import datetime
from enum import Enum, auto
from typing import Union, Optional

from nhcommons.models.github_activity import batch_write
from utils.utils import (
    date_to_utc_timestamp_in_millis, datetime_to_utc_timestamp_in_millis
)


logger = logging.getLogger(__name__)
TIMESTAMP_FORMAT = "TO_TIMESTAMP('{0:%Y-%m-%d %H:%M:%S}')"


class GitHubActivityType(Enum):
    def __new__(cls, timestamp_formatter, type_id_formatter, projection, sort):
        github_activity_type = object.__new__(cls)
        github_activity_type._value = auto()
        github_activity_type.timestamp_formatter = timestamp_formatter
        github_activity_type.type_identifier_formatter = type_id_formatter
        github_activity_type.query_projection = projection
        github_activity_type.query_sorting = sort
        return github_activity_type

    LATEST = (
        datetime_to_utc_timestamp_in_millis,
        "LATEST:{repo}",
        "TO_TIMESTAMP(MAX(commit_author_date)) AS latest_commit",
        "name"
    )
    MONTH = (
        date_to_utc_timestamp_in_millis,
        "MONTH:{timestamp:%Y%m}:{repo}",
        "DATE_TRUNC('month', TO_DATE(commit_author_date)) AS month, "
        "COUNT(*) AS commit_count",
        "name, month"
    )
    TOTAL = (
        lambda timestamp: None,
        "TOTAL:{repo}",
        "COUNT(*) AS commit_count",
        "name"
    )

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_identifier(self,
                                  repo_name: str,
                                  timestamp: Optional[datetime]) -> str:
        return self.type_identifier_formatter.format(
            repo=repo_name, timestamp=timestamp
        )

    def _create_subquery(
            self, plugins_by_earliest_ts: dict[str, datetime]
    ) -> str:
        if self is GitHubActivityType.MONTH:
            return " OR ".join(
                [
                    f"repo = '{name}' AND TO_TIMESTAMP(commit_author_date) >= "
                    f"{TIMESTAMP_FORMAT.format(ts.replace(day=1))}"
                    for name, ts in plugins_by_earliest_ts.items()
                ]
            )
        plugins = [f"'{plugin}'" for plugin in plugins_by_earliest_ts.keys()]
        return f"repo IN ({','.join(plugins)})"

    def get_query(self, plugins_by_earliest_ts: dict[str, datetime]) -> str:
        return f"""
                SELECT
                    repo AS name,
                    {self.query_projection}
                FROM
                    imaging.github.commits
                WHERE 
                    repo_type = 'plugin'
                    AND ({self._create_subquery(plugins_by_earliest_ts)})
                GROUP BY {self.query_sorting}
                ORDER BY {self.query_sorting}
                """


def transform_and_write_to_dynamo(data: dict[str, list],
                                  activity_type: GitHubActivityType,
                                  plugin_name_by_repo: dict[str, str]) -> None:
    """Transforms data generated by get_plugins_commit_count_since_timestamp to
    the expected format and then writes the formatted data to the corresponding
    github-activity dynamo table in each environment
    :param dict[str, list] data: plugin commit data in which the key is plugin
    name and the value is GitHub activities
    :param GitHubActivityType activity_type:
    :param dict[str, str] plugin_name_by_repo: dict mapping repo to plugin name
    """
    granularity = activity_type.name
    logger.info(f"Starting for github-activity type={granularity}")

    batch = []
    start = time.perf_counter()

    for repo, github_activities in data.items():
        plugin_name = plugin_name_by_repo.get(repo)
        if plugin_name is None:
            logger.warning(f"Unable to find plugin name for repo={repo}")
            continue
        for activity in github_activities:
            timestamp = activity.get("timestamp")
            type_identifier = activity_type.format_to_type_identifier(
                repo, timestamp
            )
            item = {
                "plugin_name": plugin_name.lower(),
                "type_identifier": type_identifier,
                "granularity": granularity,
                "timestamp": activity_type.format_to_timestamp(timestamp),
                "commit_count": activity.get("count"),
                "repo": repo,
            }
            batch.append(item)

    batch_write(batch)
    duration = (time.perf_counter() - start) * 1000
    logger.info(f"Completed processing for github-activity type={granularity} "
                f"count={len(batch)} timeTaken={duration}ms")
