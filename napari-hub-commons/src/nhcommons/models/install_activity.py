import logging
import os
import time
from datetime import date, datetime, timezone
from functools import reduce
from typing import (Dict, Any, List, Iterator)

from dateutil.relativedelta import relativedelta
from pynamodb.attributes import (UnicodeAttribute, NumberAttribute)
from pynamodb.indexes import GlobalSecondaryIndex, IncludeProjection

from nhcommons.models.pynamo_helper import (set_ddb_metadata, PynamoWrapper)

logger = logging.getLogger(__name__)


class _TotalInstallsIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = f'{os.getenv("STACK_NAME")}-total-installs'
        projection = IncludeProjection(["install_count", "last_updated_timestamp"])

    plugin_name = UnicodeAttribute(hash_key=True)
    is_total = UnicodeAttribute(range_key=True)


@set_ddb_metadata("install-activity")
class _InstallActivity(PynamoWrapper):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name="type")
    install_count = NumberAttribute()
    is_total = UnicodeAttribute(null=True)
    timestamp = NumberAttribute(null=True)

    total_installs = _TotalInstallsIndex()

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        return _InstallActivity(
            plugin_name=data["plugin_name"].lower(),
            type_timestamp=data["type_timestamp"],
            granularity=data["granularity"],
            install_count=data["install_count"],
            is_total=data.get("is_total"),
            timestamp=data.get("timestamp"),
        )


def batch_write(records: List[Dict]) -> None:
    start = time.perf_counter()
    try:
        batch = _InstallActivity.batch_write()
        for record in records:
            batch.save(_InstallActivity.from_dict(record))
        batch.commit()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"_InstallActivity duration={duration}ms")


def get_total_installs(plugin: str) -> int:
    """
    Gets total_installs stats from dynamo for a plugin
    :return int: total_installs count

    :param str plugin: Name of the plugin in lowercase
    """
    start = time.perf_counter()
    try:
        return _InstallActivity.get(plugin.lower(), "TOTAL:").install_count
    except _InstallActivity.DoesNotExist:
        logging.warning(f"No TOTAL: record found for plugin={plugin}")
        return 0
    finally:
        duration = (time.perf_counter() - start) * 1000
        logging.info(f"get_total_installs for plugin={plugin} duration={duration}ms")


def get_recent_installs(plugin: str, day_delta: int) -> int:
    """
    Fetches plugin recent_install stats from dynamo.
    :return int: sum of installs in the last day_delta timeperiod

    :param str plugin: Name of the plugin in lowercase.
    :param int day_delta: Specifies the number of days to include in the computation.
    """
    day_type_format = "DAY:{0:%Y%m%d}"
    today = date.today()
    upper = day_type_format.format(today)
    lower = day_type_format.format(today - relativedelta(days=day_delta))

    query_params = {
        "hash_key": plugin.lower(),
        "range_key_condition": _InstallActivity.type_timestamp.between(lower, upper)
    }

    return reduce(
        lambda acc, count: acc + count,
        [row.install_count for row in _query_table(query_params)],
        0
    )


def get_timeline(plugin: str, month_delta: int) -> List[Dict[str, int]]:
    """
    Fetches plugin install at a month level granularity for last n months.
    :returns List[Dict[str, int]]: Entries for the month_delta months

    :param str plugin: Name of the plugin in lowercase.
    :param int month_delta: Number of months in timeline.
    """
    type_timestamp_format = "MONTH:{0:%Y%m}"
    start_date = datetime.today().replace(day=1) - relativedelta(months=1)
    end_date = start_date - relativedelta(months=month_delta - 1)
    condition = _InstallActivity.type_timestamp.between(
        type_timestamp_format.format(end_date), type_timestamp_format.format(start_date)
    )
    query_params = {"hash_key": plugin.lower(), "range_key_condition": condition}
    results = {row.timestamp: row.install_count for row in _query_table(query_params)}

    start_datetime = datetime.combine(start_date, datetime.min.time(), timezone.utc)
    dates = [
        int((start_datetime - relativedelta(months=i)).timestamp()) * 1000
        for i in range(month_delta - 1, -1, -1)
    ]
    return list(
        map(lambda ts: {"timestamp": ts, "installs": results.get(ts, 0)}, dates)
    )


def get_total_installs_by_plugins() -> Dict[str, int]:
    """
    Fetches total_installs for all plugins.
    :returns Dict[str, int]: A dict of total_installs keyed on plugin name
    """
    start = time.perf_counter()
    try:
        iterator = _InstallActivity.total_installs.scan(
                attributes_to_get=["plugin_name", "install_count"]
        )
        return {item.plugin_name: item.install_count for item in iterator}
    finally:
        duration = (time.perf_counter() - start) * 1000
        logging.info(f'scan duration={duration}ms')


def _query_table(kwargs: dict) -> Iterator[_InstallActivity]:
    start = time.perf_counter()
    try:
        return _InstallActivity.query(**kwargs)
    except Exception:
        logger.exception(f"Error querying table kwargs={kwargs}")
        return []
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"kwargs={kwargs} duration={duration}ms")
