from datetime import datetime
from typing import Callable

from activity.model import InstallActivityType, InstallActivity
from snowflake_adapter import get_plugins_with_activity_since_last_update, get_plugins_install_count_since_timestamp
from utils import get_current_timestamp, get_last_updated_timestamp, set_last_updated_timestamp


def update_activity() -> None:
    last_updated_timestamp = get_last_updated_timestamp()
    current_timestamp = get_current_timestamp()
    update_install_activity(last_updated_timestamp, current_timestamp)
    set_last_updated_timestamp(current_timestamp)


def update_install_activity(last_updated_timestamp: int, current_timestamp: int):
    updated_plugins = get_plugins_with_activity_since_last_update(last_updated_timestamp, current_timestamp)
    print(f'updated_plugins_count={len(updated_plugins)}')
    if len(updated_plugins) == 0:
        return
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
