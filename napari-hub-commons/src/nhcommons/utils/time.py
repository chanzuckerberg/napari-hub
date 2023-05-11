import time
from datetime import date, datetime, timezone


def get_current_timestamp() -> int:
    return round(time.time() * 1000)


def date_to_utc_timestamp_in_millis(timestamp: date) -> int:
    timestamp_datetime = datetime(timestamp.year, timestamp.month, timestamp.day)
    return datetime_to_utc_timestamp_in_millis(timestamp_datetime)


def datetime_to_utc_timestamp_in_millis(timestamp: datetime) -> int:
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)
