import logging
import time
from datetime import datetime, timezone
from enum import Enum, auto
from typing import List, Callable, Union
import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils.utils import get_current_timestamp

LOGGER = logging.getLogger()


def to_utc_timestamp_in_millis(timestamp: datetime) -> int:
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


class GitHubActivityType(Enum):
    def __new__(cls, timestamp_formatter, type_identifier_formatter):
        install_activity_type = object.__new__(cls)
        install_activity_type._value = auto()
        install_activity_type.timestamp_formatter = timestamp_formatter
        install_activity_type.type_identifier_formatter = type_identifier_formatter
        return install_activity_type

    LATEST = (to_utc_timestamp_in_millis, 'LATEST:')
    MONTH = (to_utc_timestamp_in_millis, 'MONTH:{0:%Y%m}')
    TOTAL = (lambda timestamp: None, 'TOTAL:')

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_identifier(self, identifier: str) -> str:
        return self.type_identifier_formatter.format(identifier)

    def get_query_projection(self) -> str:
        if self is GitHubActivityType.LATEST:
            return '1, max(commit_author_date) as latest_commit'
        elif self is GitHubActivityType.MONTH:
            return 'date_trunc('"month"', to_date(commit_author_date)) as month, count(*) as num_commit'
        else:
            return '1, count(*) as num_commits'


class GitHubActivity(Model):
    class Meta:
        host = os.getenv('LOCAL_DYNAMO_HOST')
        prefix = os.getenv('STACK_NAME')
        region = os.getenv('AWS_REGION')
        table_name = f'{prefix}-github-activity'

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    number_of_commits = NumberAttribute()
    repo = UnicodeAttribute(null=True)
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    def __eq__(self, other):
        if isinstance(other, GitHubActivity):
            return ((self.plugin_name, self.type_identifier, self.granularity, self.timestamp, self.number_of_commits,
                     self.repo) ==
                    (other.plugin_name, other.type_identifier, other.granularity, other.timestamp,
                     other.number_of_commits, other.repo))
        return False


def transform_and_write_to_dynamo(data: dict[str, List], activity_type: GitHubActivityType) -> None:
    LOGGER.info(f'Starting item creation for github-activity type={activity_type.name}')

    batch = GitHubActivity.batch_write()

    start = time.perf_counter()
    count = 0
    for plugin_name, github_activities in data.items():
        for activity in github_activities:
            timestamp = activity['timestamp']
            print(timestamp)
            print(type(timestamp))

            item = GitHubActivity(plugin_name.lower(),
                                  activity_type.format_to_type_identifier(timestamp),
                                  granularity=activity_type.name,
                                  timestamp=activity_type.format_to_timestamp(timestamp),
                                  number_of_commits=activity['count'],
                                  repo=activity['repo'])
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f'Items github-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to github-activity type={activity_type.name} timeTaken={duration}ms')