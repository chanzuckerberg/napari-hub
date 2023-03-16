import logging
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Callable, List, Union
import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils.utils import get_current_timestamp

LOGGER = logging.getLogger()


def to_utc_timestamp_in_millis(timestamp: datetime) -> int:
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


class InstallActivityType(Enum):

    def __new__(cls, value, timestamp_formatter, type_timestamp_formatter):
        install_activity_type = object.__new__(cls)
        install_activity_type._value = value
        install_activity_type.timestamp_formatter = timestamp_formatter
        install_activity_type.type_timestamp_formatter = type_timestamp_formatter
        return install_activity_type

    DAY = (1, to_utc_timestamp_in_millis, lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}')
    MONTH = (2, to_utc_timestamp_in_millis, lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}')
    TOTAL = (3, lambda timestamp: None, lambda timestamp: 'TOTAL:')

    def get_timestamp_formatter(self) -> Callable[[datetime], Union[int, None]]:
        return self.timestamp_formatter

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f"DATE_TRUNC('{self.name}', timestamp)"
    
    def get_type_timestamp_formatter(self) -> Callable[[datetime], str]:
        return self.type_timestamp_formatter

    def get_timestamp_query_formatter(self) -> Callable[[datetime], datetime]:
        return (lambda ts: ts) if self is InstallActivityType.DAY else (lambda ts: ts.replace(day=1))


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

    type_timestamp_format: Callable[[datetime], str] = activity_type.get_type_timestamp_formatter()
    timestamp_format: Callable[[datetime], Union[int, None]] = activity_type.get_timestamp_formatter()

    batch = InstallActivity.batch_write()

    start = time.perf_counter()
    count = 0
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity['timestamp']

            item = InstallActivity(plugin_name.lower(),
                                   type_timestamp_format(timestamp),
                                   granularity=activity_type.name,
                                   timestamp=timestamp_format(timestamp),
                                   install_count=activity['count'])
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f'Items install-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to install-activity type={activity_type.name} timeTaken={duration}ms')
