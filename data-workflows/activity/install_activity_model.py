import logging
import time
from datetime import datetime
from enum import Enum, auto
from typing import List, Union

from nhcommons.models.install_activity import batch_write
from utils.utils import datetime_to_utc_timestamp_in_millis

LOGGER = logging.getLogger()


class InstallActivityType(Enum):

    def __new__(cls, timestamp_formatter, type_timestamp_formatter):
        install_activity_type = object.__new__(cls)
        install_activity_type._value_ = auto()
        install_activity_type.timestamp_formatter = timestamp_formatter
        install_activity_type.type_timestamp_formatter = type_timestamp_formatter
        return install_activity_type

    DAY = (datetime_to_utc_timestamp_in_millis, 'DAY:{0:%Y%m%d}')
    MONTH = (datetime_to_utc_timestamp_in_millis, 'MONTH:{0:%Y%m}')
    TOTAL = (lambda timestamp: None, 'TOTAL:')

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_timestamp(self, timestamp: datetime) -> str:
        return self.type_timestamp_formatter.format(timestamp)

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f"DATE_TRUNC('{self.name}', timestamp)"


def transform_and_write_to_dynamo(data: dict[str, List],
                                  activity_type: InstallActivityType) -> None:
    LOGGER.info(f"Starting item creation for install-activity type={activity_type.name}")
    batch = []
    is_total = 'true' if activity_type is InstallActivityType.TOTAL else None
    start = time.perf_counter()
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity["timestamp"]

            item = {
                "plugin_name": plugin_name.lower(),
                "type_timestamp": activity_type.format_to_type_timestamp(timestamp),
                "granularity": activity_type.name,
                "timestamp": activity_type.format_to_timestamp(timestamp),
                "install_count": activity["count"],
                "is_total": is_total,
            }
            batch.append(item)

    batch_write(batch)
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f"Items install-activity type={activity_type.name} "
                f"count={len(batch)}")
    LOGGER.info(f"Transform and write to install-activity "
                f"type={activity_type.name} duration={duration}ms")
