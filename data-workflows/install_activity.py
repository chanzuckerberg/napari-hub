import os
from datetime import datetime
from enum import Enum
from typing import Callable

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from snowflake_adapter import get_plugins_with_activity_since_last_update, get_plugins_install_count_since_timestamp
from utils import get_current_timestamp, get_last_updated_timestamp, set_last_updated_timestamp

prefix = os.getenv('STACK_NAME')
region = os.getenv('AWS_REGION')


class InstallActivity(Model):
    class Meta:
        table_name = f'{prefix}-install-activity'
        region = region

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)


class InstallActivityType(Enum):
    DAY = 1
    MONTH = 2
    TOTAL = 3

    def get_type_timestamp_format(self) -> Callable[[datetime], str]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: 'TOTAL:'

        if self is InstallActivityType.MONTH:
            return lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}'

        return lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}'

    def get_timestamp(self) -> Callable[[datetime], int]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: None
        return lambda timestamp: timestamp.timestamp() * 1000

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f'DATE_TRUNC(\'{self.name}\', timestamp)'


def update_activity() -> None:
    last_updated_timestamp = get_last_updated_timestamp()
    current_timestamp = get_current_timestamp()
    update_install_activity(last_updated_timestamp, current_timestamp)
    set_last_updated_timestamp(current_timestamp)


def update_install_activity(last_updated_timestamp: int, current_timestamp: int):
    updated_plugins = get_plugins_with_activity_since_last_update(last_updated_timestamp, current_timestamp)
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.DAY, lambda ts: ts)
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.MONTH, lambda ts: ts.replace(day=1))
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.TOTAL)


def _fetch_data_and_write_to_dynamo(data: dict[str, datetime],
                                    install_activity_type: InstallActivityType,
                                    time_mapper: Callable[[datetime], datetime] = None):
    _write_activity_to_dynamo(
        get_plugins_install_count_since_timestamp(data, install_activity_type, time_mapper),
        install_activity_type
    )


def _write_activity_to_dynamo(plugin_install_data, install_activity_type: InstallActivityType):
    type_timestamp_format: Callable[[datetime], str] = install_activity_type.get_type_timestamp_format()
    timestamp_format: Callable[[datetime], int] = install_activity_type.get_timestamp()

    with InstallActivity.batch_write() as batch:
        for plugin_name, install_activities in plugin_install_data.items():
            for activity in install_activities:
                timestamp = activity['timestamp']
                item = InstallActivity(plugin_name.lower(),
                                       type_timestamp_format(timestamp),
                                       granularity=install_activity_type.name,
                                       timestamp=timestamp_format(timestamp),
                                       install_count=activity['count'])
                batch.save(item)
