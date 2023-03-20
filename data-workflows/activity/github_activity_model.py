import logging
import time
from datetime import datetime
from enum import Enum
from typing import List, Callable, Union
import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

LOGGER = logging.getLogger()


class GitHubActivityType(Enum):
    def __new__(cls, value, timestamp_formatter, type_timestamp_formatter):
        install_activity_type = object.__new__(cls)
        install_activity_type._value = value
        install_activity_type.timestamp_formatter = timestamp_formatter
        install_activity_type.type_timestamp_formatter = type_timestamp_formatter
        return install_activity_type

    LATEST = 1
    MONTH = 2
    TOTAL = 3

    def get_type_timestamp_formatter(self) -> Callable[[datetime], str]:
        return self.type_timestamp_formatter


class GitHubActivity(Model):
    class Meta:
        prefix = os.getenv('STACK_NAME')
        region = os.getenv('AWS_REGION')
        table_name = f'{prefix}-github-activity'
        region = region

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

    type_timestamp_format: Callable[[datetime], str] = activity_type.get_type_timestamp_formatter()
    timestamp_format: Callable[[datetime], Union[int, None]] = activity_type.get_timestamp_formatter()

    batch = GitHubActivity.batch_write()

    start = time.perf_counter()
    count = 0
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity['timestamp']

            item = GitHubActivity(plugin_name.lower(),
                                  type_timestamp_format(timestamp),
                                  granularity=activity_type.name,
                                  timestamp=timestamp_format(timestamp),
                                  number_of_commits=activity['count'],
                                  repo=activity['repo'])
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f'Items github-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to github-activity type={activity_type.name} timeTaken={duration}ms')
