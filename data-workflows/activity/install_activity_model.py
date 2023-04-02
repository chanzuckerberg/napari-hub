import logging
import time
from datetime import datetime, timezone
from enum import Enum, auto
from typing import List, Union
import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils.utils import get_current_timestamp

LOGGER = logging.getLogger()


def to_utc_timestamp_in_millis(timestamp: datetime) -> int:
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


class InstallActivityType(Enum):

    def __new__(cls, timestamp_formatter, type_timestamp_formatter):
        install_activity_type = object.__new__(cls)
        install_activity_type._value_ = auto()
        install_activity_type.timestamp_formatter = timestamp_formatter
        install_activity_type.type_timestamp_formatter = type_timestamp_formatter
        return install_activity_type

    DAY = (to_utc_timestamp_in_millis, 'DAY:{0:%Y%m%d}')
    MONTH = (to_utc_timestamp_in_millis, 'MONTH:{0:%Y%m}')
    TOTAL = (lambda timestamp: None, 'TOTAL:')

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_timestamp(self, timestamp: datetime) -> str:
        return self.type_timestamp_formatter.format(timestamp)

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f"DATE_TRUNC('{self.name}', timestamp)"


class InstallActivity(Model):
    class Meta:
        prefix = os.getenv('STACK_NAME')
        region = os.getenv('AWS_REGION')
        table_name = f'{prefix}-install-activity'

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    def __eq__(self, other):
        if isinstance(other, InstallActivity):
            return ((self.plugin_name, self.type_timestamp, self.granularity, self.timestamp, self.install_count) == 
                    (other.plugin_name, other.type_timestamp, other.granularity, other.timestamp, other.install_count))
        return False


def transform_and_write_to_dynamo(data: dict[str, List], activity_type: InstallActivityType) -> None:
    LOGGER.info(f'Starting item creation for install-activity type={activity_type.name}')

    batch = InstallActivity.batch_write()

    start = time.perf_counter()
    count = 0
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity['timestamp']

            item = InstallActivity(plugin_name.lower(),
                                   activity_type.format_to_type_timestamp(timestamp),
                                   granularity=activity_type.name,
                                   timestamp=activity_type.format_to_timestamp(timestamp),
                                   install_count=activity['count'])
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f'Items install-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to install-activity type={activity_type.name} timeTaken={duration}ms')
