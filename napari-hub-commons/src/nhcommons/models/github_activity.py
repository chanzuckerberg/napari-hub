import logging
import time

from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from typing import Dict, Any, List, Optional, Iterator

from pynamodb.attributes import UnicodeAttribute, NumberAttribute
from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper

logger = logging.getLogger(__name__)


@set_ddb_metadata("github-activity")
class _GitHubActivity(PynamoWrapper):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    commit_count = NumberAttribute(null=True)
    granularity = UnicodeAttribute(attr_name="type")
    repo = UnicodeAttribute()
    timestamp = NumberAttribute(null=True)
    expiry = NumberAttribute(null=True)

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        return _GitHubActivity(
            plugin_name=data["plugin_name"].lower(),
            type_identifier=data["type_identifier"],
            commit_count=data.get("commit_count"),
            granularity=data["granularity"],
            repo=data["repo"],
            timestamp=data.get("timestamp"),
            expiry=data.get("expiry"),
        )


def batch_write(records: List[Dict]) -> None:
    start = time.perf_counter()
    try:
        batch = _GitHubActivity.batch_write()
        for record in records:
            batch.save(_GitHubActivity.from_dict(record))
        batch.commit()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"_GitHubActivity duration={duration}ms")


def get_total_commits(plugin: str, repo: str) -> int:
    """
    Gets total_commits stats for a plugin
    :return int: total_commits count

    :param str plugin: Name of the plugin in lowercase.
    :param str repo: Name of the GitHub repo.
    """
    result = _get_item(plugin, f"TOTAL:{repo}")
    return result.commit_count if result else 0


def get_latest_commit(plugin: str, repo: str) -> Optional[int]:
    """
    Gets latest_commit timestamp for a plugin
    :return int: latest_commit timestamp

    :param str plugin: Name of the plugin in lowercase.
    :param str repo: Name of the GitHub repo.
    """
    result = _get_item(plugin, f"LATEST:{repo}")
    return result.timestamp if result else None


def get_timeline(plugin: str, repo: str, month_delta: int) -> List[Dict[str, int]]:
    """
    Fetches plugin commit count at a month level granularity for last n months.
    :returns List[Dict[str, int]]: Entries for the month_delta months

    :param str plugin: Name of the plugin in lowercase.
    :param str repo: Name of the GitHub repo.
    :param int month_delta: Number of months in timeline.
    """
    type_identifier_format = f"MONTH:{{timestamp:%Y%m}}:{repo}"
    start_date = datetime.today().replace(day=1) - relativedelta(months=1)
    end_date = start_date - relativedelta(months=month_delta - 1)
    condition = _GitHubActivity.type_identifier.between(
        type_identifier_format.format(timestamp=end_date),
        type_identifier_format.format(timestamp=start_date)
    )

    query_params = {
        "hash_key": plugin.lower(),
        "range_key_condition": condition,
        "filter_condition": _GitHubActivity.repo == repo
    }
    results = {row.timestamp: row.commit_count for row in _query_table(query_params)}

    start_datetime = datetime.combine(start_date, datetime.min.time(), timezone.utc)
    dates = [
        int((start_datetime - relativedelta(months=i)).timestamp()) * 1000
        for i in range(month_delta - 1, -1, -1)
    ]
    return list(
        map(lambda ts: {"timestamp": ts, "commits": results.get(ts, 0)}, dates)
    )


def _get_item(plugin: str, type_identifier: str) -> Optional[_GitHubActivity]:
    start = time.perf_counter()
    try:
        return _GitHubActivity.get(plugin.lower(), type_identifier)
    except _GitHubActivity.DoesNotExist:
        logging.warning(f"No {type_identifier} record found for plugin={plugin}")
        return None
    finally:
        duration = (time.perf_counter() - start) * 1000
        logging.info(
            f"get for {plugin} type_identifier={type_identifier} duration={duration}ms"
        )


def _query_table(kwargs: dict) -> Iterator[_GitHubActivity]:
    start = time.perf_counter()
    try:
        return _GitHubActivity.query(**kwargs)
    except Exception:
        logger.exception(f"Error querying table kwargs={kwargs}")
        return []
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"kwargs={kwargs} duration={duration}ms")
