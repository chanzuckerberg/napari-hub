from datetime import datetime, timezone
from functools import partial
from typing import Dict, Any, List, Union

from dateutil.relativedelta import relativedelta
from pynamodb.attributes import Attribute


def _get_first_of_last_month() -> datetime:
    return datetime.combine(
        datetime.today().replace(day=1) - relativedelta(months=1),
        datetime.min.time(),
        timezone.utc,
    )


def build_timeline_query_parameters(
    plugin: str,
    range_key_format: str,
    month_delta: int,
    range_key_attribute: Attribute,
) -> Dict[str, Any]:
    start_date = _get_first_of_last_month()
    end_date = start_date - relativedelta(months=month_delta - 1)
    condition = range_key_attribute.between(
        range_key_format.format(timestamp=end_date),
        range_key_format.format(timestamp=start_date),
    )
    return {
        "hash_key": plugin.lower(),
        "range_key_condition": condition,
    }


def process_timeline_results(
    results: Dict[int, int], month_delta: int, activity_value_key: str
) -> List[Dict[str, int]]:
    start_datetime = _get_first_of_last_month()
    dates = [
        int((start_datetime - relativedelta(months=i)).timestamp()) * 1000
        for i in range(month_delta - 1, -1, -1)
    ]
    return list(map(_timestamp_to_entry(results, activity_value_key), dates))


def _timestamp_to_entry(
    value_by_timestamp: Dict[int, int], activity_value_key: str, timestamp: int = None
) -> Union[Dict[str, int], partial]:
    if timestamp is None:
        return partial(_timestamp_to_entry, value_by_timestamp, activity_value_key)

    return {
        "timestamp": timestamp,
        activity_value_key: value_by_timestamp.get(timestamp, 0),
    }
