import logging
import time
from datetime import datetime
from enum import Enum, auto
from typing import List, Union

from nhcommons.models.install_activity import batch_write
from utils.utils import datetime_to_utc_timestamp_in_millis

logger = logging.getLogger(__name__)


class InstallActivityType(Enum):

    def __new__(cls, timestamp_formatter, type_timestamp_format):
        install_activity_type = object.__new__(cls)
        install_activity_type._value_ = auto()
        install_activity_type.timestamp_formatter = timestamp_formatter
        install_activity_type.type_timestamp_format = type_timestamp_format
        return install_activity_type

    DAY = (datetime_to_utc_timestamp_in_millis, "DAY:{0:%Y%m%d}")
    MONTH = (datetime_to_utc_timestamp_in_millis, "MONTH:{0:%Y%m}")
    TOTAL = (lambda timestamp: None, "TOTAL:")

    def format_to_timestamp(self, timestamp: datetime) -> Union[int, None]:
        return self.timestamp_formatter(timestamp)

    def format_to_type_timestamp(self, timestamp: datetime) -> str:
        return self.type_timestamp_format.format(timestamp)

    def get_query_timestamp_projection(self) -> str:
        if self is InstallActivityType.TOTAL:
            return "1"
        return f"DATE_TRUNC('{self.name}', timestamp)"


def transform_and_write_to_dynamo(data: dict[str, List],
                                  activity_type: InstallActivityType) -> None:
    granularity = activity_type.name
    logger.info(f"Starting for install-activity type={granularity}")
    is_total = "true" if activity_type is InstallActivityType.TOTAL else None
    batch = []

    start = time.perf_counter()
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity["timestamp"]
            type_timestamp = activity_type.format_to_type_timestamp(timestamp)
            item = {
                "plugin_name": plugin_name.lower(),
                "type_timestamp": type_timestamp,
                "granularity": activity_type.name,
                "timestamp": activity_type.format_to_timestamp(timestamp),
                "install_count": activity["count"],
                "is_total": is_total,
            }
            batch.append(item)

    batch_write(batch)
    duration = (time.perf_counter() - start) * 1000
    logger.info(f"Completed processing for install-activity type={granularity} "
                f"count={len(batch)} timeTaken={duration}ms")
