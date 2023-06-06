import logging
import time
from datetime import datetime
from enum import Enum, auto
from typing import List, Union

from nhcommons.models.github_activity import batch_write
from utils.utils import (
    date_to_utc_timestamp_in_millis, datetime_to_utc_timestamp_in_millis
)
from plugin.helpers import _get_repo_to_plugin_dict

LOGGER = logging.getLogger()
TIMESTAMP_FORMAT = "TO_TIMESTAMP('{0:%Y-%m-%d %H:%M:%S}')"


class GitHubActivityType(Enum):
    def __new__(cls, timestamp_formatter, type_identifier_formatter, query_projection, query_sorting):
        github_activity_type = object.__new__(cls)
        github_activity_type._value = auto()
        github_activity_type.timestamp_formatter = timestamp_formatter
        github_activity_type.type_identifier_formatter = type_identifier_formatter
        github_activity_type.query_projection = query_projection
        github_activity_type.query_sorting = query_sorting
        return github_activity_type

    LATEST = (datetime_to_utc_timestamp_in_millis, 'LATEST:{0}',
              'repo AS name, TO_TIMESTAMP(MAX(commit_author_date)) AS latest_commit', 'name')
    MONTH = (date_to_utc_timestamp_in_millis, 'MONTH:{1:%Y%m}:{0}',
             'repo AS name, DATE_TRUNC("month", TO_DATE(commit_author_date)) AS month, COUNT(*) AS commit_count',
             'name, month')
    TOTAL = (lambda timestamp: None, 'TOTAL:{0}', 'repo AS name, COUNT(*) AS commit_count', 'name')

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_identifier(self, repo_name: str, identifier_timestamp: str) -> str:
        return self.type_identifier_formatter.format(repo_name, identifier_timestamp)

    def _create_subquery(self, plugins_by_earliest_ts: dict[str, datetime]) -> str:
        if self is GitHubActivityType.MONTH:
            return " OR ".join(
                [
                    f"repo = '{name}' AND TO_TIMESTAMP(commit_author_date) >= "
                    f"{TIMESTAMP_FORMAT.format(ts.replace(day=1))}"
                    for name, ts in plugins_by_earliest_ts.items()
                ]
            )
        return f"""repo IN ({','.join([f"'{plugin}'" for plugin in plugins_by_earliest_ts.keys()])})"""

    def get_query(self, plugins_by_earliest_ts: dict[str, datetime]) -> str:
        return f"""
                SELECT 
                    {self.query_projection}
                FROM
                    imaging.github.commits
                WHERE 
                    repo_type = 'plugin'
                    AND {self._create_subquery(plugins_by_earliest_ts)}
                GROUP BY {self.query_sorting}
                ORDER BY {self.query_sorting}
                """


# TODO: Add tests for this method
def transform_and_write_to_dynamo(data: dict[str, List], activity_type: GitHubActivityType) -> None:
    """Transforms plugin commit data generated by get_plugins_commit_count_since_timestamp to the expected format
    and then writes the formatted data to the corresponding github-activity dynamo table in each environment
    :param dict[str, list] data: plugin commit data of type dictionary in which the key is plugin name
    of type str and the value is Github activities of type list
    :param GitHubActivityType activity_type:
    """
    LOGGER.info(f'Starting item creation for github-activity type={activity_type.name}')

    batch = []

    start = time.perf_counter()
    count = 0
    repo_to_plugin_dict = _get_repo_to_plugin_dict()
    for repo, github_activities in data.items():
        plugin_name = repo_to_plugin_dict.get(repo)
        if plugin_name is None:
            continue
        for activity in github_activities:
            identifier_timestamp = activity.get('timestamp', '')
            timestamp = activity.get('timestamp')
            commit_count = activity.get('count')
            item = {
                "plugin_name": plugin_name,
                "type_identifier": activity_type.format_to_type_identifier(repo, identifier_timestamp),
                "granularity": activity_type.name,
                "timestamp": activity_type.format_to_timestamp(timestamp),
                "commit_count": commit_count,
                "repo": repo,
            }
            batch.append(item)
            count += 1

    batch_write(batch)
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f'Items github-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to github-activity type={activity_type.name} duration={duration}ms')
