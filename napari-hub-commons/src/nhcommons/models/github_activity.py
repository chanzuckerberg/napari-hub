import logging
import time

from typing import Dict, Any, List, Optional, Iterator
from pynamodb.attributes import UnicodeAttribute, NumberAttribute
from nhcommons.models.activity_helper import (
    build_timeline_query_parameters,
    process_timeline_results,
)
from nhcommons.models.pynamo_helper import set_ddb_metadata, PynamoWrapper

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
    results = _query_for_timeline(plugin, repo, month_delta)
    return process_timeline_results(results, month_delta, "commits")


def _query_for_timeline(plugin: str, repo: str, month_delta: int) -> Dict[int, int]:
    if not repo:
        logger.info(f"Skipping timeline query for {plugin} as repo={repo}")
        return {}
    query_params = build_timeline_query_parameters(
        plugin,
        f"MONTH:{{timestamp:%Y%m}}:{repo}",
        month_delta,
        _GitHubActivity.type_identifier,
    )
    query_params["filter_condition"] = _GitHubActivity.repo == repo
    return {row.timestamp: row.commit_count for row in _query_table(query_params)}


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
