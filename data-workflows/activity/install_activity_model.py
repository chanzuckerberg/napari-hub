import logging
import time
from datetime import datetime, timezone
from enum import Enum
from typing import Callable, List
import os
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils.utils import get_current_timestamp

LOGGER = logging.getLogger()


class InstallActivityType(Enum):
    DAY = 1
    MONTH = 2
    TOTAL = 3

    def get_timestamp_format(self) -> Callable[[datetime], int]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: 0
        return lambda timestamp: timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f'DATE_TRUNC(\'{self.name}\', timestamp)'


type_timestamp_format_by_type: dict[InstallActivityType, Callable[[datetime], str]] = {
    InstallActivityType.TOTAL: lambda timestamp: 'TOTAL:',
    InstallActivityType.MONTH: lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}',
    InstallActivityType.DAY: lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}',
}
timestamp_mapper_by_type: dict[InstallActivityType, Callable[[datetime], datetime]] = {
    InstallActivityType.DAY: lambda timestamp: timestamp,
    InstallActivityType.MONTH: lambda timestamp: timestamp.replace(day=1),
}


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


def batch_write_to_dynamo(items: List[InstallActivity], install_activity_type: InstallActivityType):
    start = time.perf_counter_ns()
    with InstallActivity.batch_write() as batch:
        for item in items:
            batch.save(item)

    duration = (time.perf_counter_ns() - start) // 1000000
    LOGGER.info(f'Dynamo write to install-activity type={install_activity_type.name} timeTaken={duration}ms')


def transform_to_dynamo_records(data: dict[str, List], activity_type: InstallActivityType) -> List[InstallActivity]:
    LOGGER.info(f'Starting item creation for install-activity type={activity_type.name}')
    type_timestamp_format: Callable[[datetime], str] = type_timestamp_format_by_type[activity_type]
    timestamp_format: Callable[[datetime], int] = activity_type.get_timestamp_format()

    items = []
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity['timestamp']
            item = InstallActivity(plugin_name.lower(),
                                   type_timestamp_format(timestamp),
                                   granularity=activity_type.name,
                                   timestamp=timestamp_format(timestamp),
                                   install_count=activity['count'])
            items.append(item)

    LOGGER.info(f'Items install-activity type={activity_type.name} count={len(items)}')
    return items
