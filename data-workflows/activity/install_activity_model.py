import logging
import time
from datetime import datetime
from enum import Enum, auto
from typing import List, Union
import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute
from nhcommons.utils.time import get_current_timestamp
from utils.utils import datetime_to_utc_timestamp_in_millis

LOGGER = logging.getLogger(__name__)


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


class InstallActivity(Model):
    class Meta:
        host = os.getenv('LOCAL_DYNAMO_HOST')
        region = os.getenv('AWS_REGION')
        table_name = f'{os.getenv("STACK_NAME")}-install-activity'

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    is_total = UnicodeAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    def __eq__(self, other):
        if isinstance(other, InstallActivity):
            return ((self.plugin_name, self.type_timestamp, self.granularity,
                     self.timestamp, self.install_count, self.is_total) ==
                    (other.plugin_name, other.type_timestamp, other.granularity,
                     other.timestamp, other.install_count, other.is_total))
        return False


def transform_and_write_to_dynamo(data: dict[str, List],
                                  activity_type: InstallActivityType) -> None:
    granularity = activity_type.name
    LOGGER.info(f"Starting for install-activity type={granularity}")
    batch = InstallActivity.batch_write()
    count = 0
    is_total = "true" if activity_type is InstallActivityType.TOTAL else None
    start = time.perf_counter()
    for plugin_name, install_activities in data.items():
        for activity in install_activities:
            timestamp = activity["timestamp"]

            item = InstallActivity(
                plugin_name=plugin_name.lower(),
                type_timestamp=activity_type.format_to_type_timestamp(timestamp),
                granularity=granularity,
                timestamp=activity_type.format_to_timestamp(timestamp),
                install_count=activity["count"],
                is_total=is_total,
            )
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f"Completed processing for install-activity type={granularity} "
                f"count={count} timeTaken={duration}ms")
