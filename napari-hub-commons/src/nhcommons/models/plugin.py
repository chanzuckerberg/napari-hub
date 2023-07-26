import logging
import time
from typing import Any, Dict, List, Callable, Optional

from pynamodb.attributes import UnicodeAttribute, ListAttribute, MapAttribute
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.pagination import ResultIterator

from .helper import set_ddb_metadata, get_stack_name, PynamoWrapper
from ..utils.adapter_helpers import GithubClientHelper

logger = logging.getLogger(__name__)


class _LatestPluginIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = f"{get_stack_name()}-latest-plugins"
        projection = AllProjection()

    name = UnicodeAttribute(hash_key=True)
    is_latest = UnicodeAttribute(range_key=True)


@set_ddb_metadata("plugin")
class _Plugin(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version = UnicodeAttribute(range_key=True)

    authors = ListAttribute(null=True)
    data = MapAttribute()
    code_repository = UnicodeAttribute(null=True)
    display_name = UnicodeAttribute(null=True)
    first_released = UnicodeAttribute()
    summary = UnicodeAttribute(null=True)
    release_date = UnicodeAttribute()
    visibility = UnicodeAttribute(null=True)

    is_latest = UnicodeAttribute(null=True)
    excluded = UnicodeAttribute(null=True)

    latest_plugin_index = _LatestPluginIndex()


def get_latest_plugins() -> Dict[str, str]:
    return _scan_latest_plugins_index(
        attributes=["name", "version"],
        mapper=lambda result: {plugin.name: plugin.version for plugin in result},
    )


def get_plugin_name_by_repo() -> Dict[str, str]:
    return _scan_latest_plugins_index(
        attributes=["name", "code_repository"], mapper=_to_plugin_name_by_repo
    )


def put_plugin(name: str, version: str, record: Dict[str, Any]) -> None:
    start = time.perf_counter()
    try:
        plugin = _Plugin(
            hash_key=name,
            range_key=version,
            authors=record.get("authors"),
            data=record.get("data", {}),
            code_repository=record.get("code_repository"),
            display_name=record.get("display_name"),
            first_released=record.get("first_released"),
            summary=record.get("summary"),
            release_date=record.get("release_date"),
            visibility=record.get("visibility"),
            is_latest=record.get("is_latest"),
            excluded=record.get("excluded"),
        )
        plugin.save()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"plugin={name} version={version} duration={duration}ms")


def _scan_latest_plugins_index(
    attributes: List[str], mapper: Callable[[ResultIterator[_Plugin]], Dict[str, Any]]
) -> Dict[str, Any]:
    result = {}
    start = time.perf_counter()
    try:
        results = _Plugin.latest_plugin_index.scan(attributes_to_get=attributes)
        result = mapper(results)
        return result
    finally:
        duration = (time.perf_counter() - start) * 1000
        count = len(result)
        logger.info(f"latest plugins count={count} duration={duration}ms")


def _to_plugin_name_by_repo(results: ResultIterator[_Plugin]) -> Dict[str, str]:
    return {_to_repo(plugin): plugin.name for plugin in results if _to_repo(plugin)}


def _to_repo(plugin: _Plugin) -> Optional[str]:
    if not plugin.code_repository:
        return None
    return GithubClientHelper.replace_github_url(plugin.code_repository, "")
