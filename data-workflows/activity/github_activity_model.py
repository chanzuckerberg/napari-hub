import logging
import time
from datetime import datetime
from enum import Enum, auto
from typing import List, Union, Callable
import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils.utils import get_current_timestamp, date_to_utc_timestamp_in_millis, datetime_to_utc_timestamp_in_millis
from plugin.s3 import _get_repo_to_plugin_dict


LOGGER = logging.getLogger()
TIMESTAMP_FORMAT = "TO_TIMESTAMP('{0:%Y-%m-%d %H:%M:%S}')"


class GitHubActivityType(Enum):
    def __new__(cls, timestamp_formatter, type_identifier_formatter):
        github_activity_type = object.__new__(cls)
        github_activity_type._value = auto()
        github_activity_type.timestamp_formatter = timestamp_formatter
        github_activity_type.type_identifier_formatter = type_identifier_formatter
        return github_activity_type

    LATEST = (datetime_to_utc_timestamp_in_millis, 'LATEST:{0}')
    MONTH = (date_to_utc_timestamp_in_millis, 'MONTH:{0:%Y%m}:{1}')
    TOTAL = (lambda timestamp: None, 'TOTAL:{0}')

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_identifier(self, identifier: str, repo_name: str) -> str:
        if self is GitHubActivityType.MONTH:
            return self.type_identifier_formatter.format(identifier, repo_name)
        else:
            return self.type_identifier_formatter.format(repo_name)

    def get_query_projection(self) -> str:
        if self is GitHubActivityType.LATEST:
            return 'to_timestamp(max(commit_author_date)) as latest_commit'
        elif self is GitHubActivityType.MONTH:
            return 'date_trunc("month", to_date(commit_author_date)) as month, count(*) as commit_count'
        else:
            return 'count(*) as commit_count'

    def _create_subquery(self, plugins_by_earliest_ts: dict[str, datetime]) -> str:
        if self is GitHubActivityType.MONTH:
            return " OR ".join(
                [
                    f"repo = '{name}' AND to_timestamp(commit_author_date) >= "
                    f"{TIMESTAMP_FORMAT.format(ts.replace(day=1))}"
                    for name, ts in plugins_by_earliest_ts.items()
                ]
            )
        else:
            return f"""repo IN ({','.join([f"'{plugin}'" for plugin in plugins_by_earliest_ts.keys()])})"""

    def get_query_sorting(self) -> str:
        if self is GitHubActivityType.MONTH:
            return 'repo, month'
        else:
            return 'repo'

    def get_accumulator_updater(self) -> Callable:
        import activity.snowflake_adapter as sf
        if self is GitHubActivityType.LATEST:
            return sf._cursor_to_plugin_github_activity_latest_mapper
        elif self is GitHubActivityType.MONTH:
            return sf._cursor_to_plugin_github_activity_month_mapper
        else:
            return sf._cursor_to_plugin_github_activity_total_mapper

    def get_query(self, plugins_by_earliest_ts: dict[str, datetime]) -> str:
        return f"""
                SELECT 
                    repo, 
                    {self.get_query_projection()}
                FROM
                    imaging.github.commits
                WHERE 
                    repo_type = 'plugin'
                    AND {self._create_subquery(plugins_by_earliest_ts)}
                GROUP BY {self.get_query_sorting()}
                ORDER BY {self.get_query_sorting()}
                """


class GitHubActivity(Model):
    class Meta:
        host = os.getenv('LOCAL_DYNAMO_HOST')
        region = os.getenv('AWS_REGION')
        table_name = f'{os.getenv("STACK_NAME")}-github-activity'

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    commit_count = NumberAttribute(null=True)
    repo = UnicodeAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    def __eq__(self, other):
        if isinstance(other, GitHubActivity):
            return ((self.plugin_name, self.type_identifier, self.granularity, self.timestamp, self.commit_count,
                     self.repo) ==
                    (other.plugin_name, other.type_identifier, other.granularity, other.timestamp,
                     other.commit_count, other.repo))
        return False


def transform_and_write_to_dynamo(data: dict[str, List], activity_type: GitHubActivityType) -> None:
    LOGGER.info(f'Starting item creation for github-activity type={activity_type.name}')

    batch = GitHubActivity.batch_write()

    start = time.perf_counter()
    count = 0
    repo_to_plugin_dict = _get_repo_to_plugin_dict()
    for repo_name, github_activities in data.items():
        if repo_name not in repo_to_plugin_dict:
            continue
        for activity in github_activities:
            plugin_name = repo_to_plugin_dict[repo_name]
            identifier = activity.get('timestamp', '')

            if activity_type.name == "LATEST":
                timestamp = datetime_to_utc_timestamp_in_millis(activity['timestamp'])
                commit_count = None
            elif activity_type.name == "MONTH":
                timestamp = date_to_utc_timestamp_in_millis(activity['timestamp'])
                commit_count = activity['count']
            else:
                timestamp = None
                commit_count = activity['count']

            item = GitHubActivity(plugin_name,
                                  activity_type.format_to_type_identifier(identifier, repo_name),
                                  granularity=activity_type.name,
                                  timestamp=timestamp,
                                  commit_count=commit_count,
                                  repo=repo_name)
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f'Items github-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to github-activity type={activity_type.name} timeTaken={duration}ms')
