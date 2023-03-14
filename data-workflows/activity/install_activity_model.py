import logging
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Callable, List, Union
import os

from dateutil.relativedelta import relativedelta
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils.utils import get_current_timestamp

LOGGER = logging.getLogger()


class InstallActivityType(Enum):
    DAY = 1
    MONTH = 2
    TOTAL = 3

    def get_timestamp_format(self) -> Callable[[datetime], Union[int, None]]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: None
        return lambda timestamp: timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f'DATE_TRUNC(\'{self.name}\', timestamp)'

    def get_expiry(self) -> Callable[[datetime], Union[int, None]]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: None
        elif self is InstallActivityType.DAY:
            return lambda timestamp: int((timestamp + relativedelta(days=32)).timestamp())
        return lambda timestamp: int((timestamp + relativedelta(months=14)).timestamp())

    def get_type_timestamp_formatter(self) -> Callable[[datetime], str]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: 'TOTAL:'
        elif self is InstallActivityType.DAY:
            return lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}'
        return lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}'

    def get_timestamp_query_formatter(self) -> Callable[[datetime], datetime]:
        return (lambda ts: ts) if self is InstallActivityType.DAY else (lambda ts: ts.replace(day=1))


class InstallActivity(Model):
    class Meta:
        prefix = os.getenv('STACK_NAME')
        region = os.getenv('AWS_REGION')
        table_name = f'{prefix}-install-activity'
        region = region

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)
    expiry = NumberAttribute(null=True)

    def __eq__(self, other):
        if isinstance(other, InstallActivity):
            return (self.plugin_name, self.type_timestamp, self.granularity, self.timestamp, self.install_count,
                    self.expiry) == (other.plugin_name, other.type_timestamp, other.granularity, other.timestamp,
                                     other.install_count, other.expiry)
        return False


def transform_and_write_to_dynamo(data: dict[str, List], activity_type: InstallActivityType) -> None:
    LOGGER.info(f'Starting item creation for install-activity type={activity_type.name}')

    type_timestamp_format: Callable[[datetime], str] = activity_type.get_type_timestamp_formatter()
    timestamp_format: Callable[[datetime], Union[int, None]] = activity_type.get_timestamp_format()
    expiry_mapper: Callable[[datetime], Union[int, None]] = activity_type.get_expiry()

    batch = InstallActivity.batch_write()

    now = int(datetime.now().timestamp())
    start = time.perf_counter_ns()
    count = 0
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity['timestamp']
            expiry = expiry_mapper(timestamp)
            if expiry and now > expiry:
                continue

            item = InstallActivity(plugin_name.lower(),
                                   type_timestamp_format(timestamp),
                                   granularity=activity_type.name,
                                   timestamp=timestamp_format(timestamp),
                                   install_count=activity['count'],
                                   expiry=expiry)
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter_ns() - start) // 1000000

    LOGGER.info(f'Items install-activity type={activity_type.name} count={count}')
    LOGGER.info(f'Transform and write to install-activity type={activity_type.name} timeTaken={duration}ms')
