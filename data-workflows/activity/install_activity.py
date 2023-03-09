import logging
import time
from datetime import datetime
from typing import Callable, List

from activity.model import InstallActivityType, InstallActivity, type_timestamp_format_by_type
from snowflake_adapter import get_plugins_with_installs_in_window, get_plugins_install_count_since_timestamp


def _transform_to_dynamo_record(data: dict[str, List], activity_type: InstallActivityType) -> List[InstallActivity]:
    logging.info(f'Starting item creation for install-activity type={activity_type.name}')
    type_timestamp_format: Callable[[datetime], str] = type_timestamp_format_by_type[activity_type]
    timestamp_format: Callable[[datetime], int] = activity_type.get_timestamp()

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

    logging.info(f'Items install-activity type={activity_type.name} count={len(items)}')
    return items


def _write_activity_to_dynamo(items: List[InstallActivity], install_activity_type: InstallActivityType):
    start = time.perf_counter_ns()
    with InstallActivity.batch_write() as batch:
        for item in items:
            batch.save(item)

    duration = (time.perf_counter_ns() - start) // 1000000
    logging.info(f'Dynamo write to install-activity type={install_activity_type.name} timeTaken={duration}ms')


def _fetch_data_and_write_to_dynamo(data: dict[str, datetime], install_activity_type: InstallActivityType):
    plugin_install_data = get_plugins_install_count_since_timestamp(data, install_activity_type)
    records = _transform_to_dynamo_record(plugin_install_data, install_activity_type)
    _write_activity_to_dynamo(records, install_activity_type)


def update_install_activity(start_time: int, end_time: int):
    updated_plugins = get_plugins_with_installs_in_window(start_time, end_time)
    logging.info(f'Plugins with update count={len(updated_plugins)}')
    if len(updated_plugins) == 0:
        return
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.DAY)
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.MONTH)
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.TOTAL)
