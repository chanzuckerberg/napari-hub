import logging
import time
from typing import Any, Dict, List, Callable, Optional, Iterator, Set, TypeVar

from pynamodb.attributes import UnicodeAttribute, ListAttribute, MapAttribute
from pynamodb.expressions.condition import Condition
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.pagination import ResultIterator

from .pynamo_helper import set_ddb_metadata, get_stack_name, PynamoWrapper
from .plugin_utils import PluginVisibility
from ..utils.adapter_helpers import GithubClientHelper

logger = logging.getLogger(__name__)
T = TypeVar("T")


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


_INDEX_SUBSET = {
    "authors",
    "category",
    "code_repository",
    "description_content_type",
    "description_text",
    "development_status",
    "display_name",
    "error_message",
    "first_released",
    "license",
    "name",
    "npe2",
    "operating_system",
    "plugin_types",
    "python_version",
    "reader_file_extensions",
    "release_date",
    "summary",
    "version",
    "writer_file_extensions",
    "writer_save_layers",
}


def get_index(
    visibility_filter: Optional[Set[PluginVisibility]],
) -> List[Dict[str, Any]]:
    return _scan_latest_plugins_index(
        attributes=["name", "version", "data", "visibility"],
        mapper=_index_list_mapper(),
        filter_conditions=_to_visibility_condition(visibility_filter),
    )


def get_latest_plugins() -> Dict[str, str]:
    return _scan_latest_plugins_index(
        attributes=["name", "version"],
        mapper=lambda result: {plugin.name: plugin.version for plugin in result},
    )


def get_latest_plugin(
    name: str, visibilities: Optional[Set[PluginVisibility]]
) -> Dict[str, Any]:
    plugin = _query_for_latest_plugin(
        name, ["data", "release_date"], _to_visibility_condition(visibilities)
    )
    return plugin.data.as_dict() if plugin and plugin.data else {}


def get_latest_version(name: str) -> Optional[str]:
    plugin = _query_for_latest_plugin(name, ["name", "version", "release_date"])
    return plugin.version if plugin else None


def get_plugin_name_by_repo() -> Dict[str, str]:
    return _scan_latest_plugins_index(
        attributes=["name", "code_repository"], mapper=_to_plugin_name_by_repo
    )


def get_plugin_by_version(
    name: str, version: str, visibilities: Optional[Set[PluginVisibility]]
) -> Dict[str, Any]:
    kwargs = {
        "attributes_to_get": ["data", "release_date"],
        "filter_condition": _to_visibility_condition(visibilities),
        "hash_key": name,
        "range_key_condition": _Plugin.version == version,
    }
    plugin = _get_latest([plugin for plugin in _query_table(kwargs)])
    return plugin.data.as_dict() if plugin and plugin.data else {}


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


def _index_list_mapper() -> Callable[[Iterator[_Plugin]], List[Dict[str, Any]]]:
    def _to_dict(item: _Plugin, data: Dict) -> Dict:
        result = {key: data[key] for key in _INDEX_SUBSET if key in data}
        result["visibility"] = item.visibility.lower()
        return result

    def _mapper(plugins: Iterator[_Plugin]) -> List[Dict[str, Any]]:
        return [
            _to_dict(item, data)
            for item in plugins
            if item.data and (data := item.data.as_dict())
        ]

    return _mapper


def _get_latest(plugins: Iterator[_Plugin]) -> Optional[_Plugin]:
    if not plugins:
        return None
    return sorted(plugins, key=lambda p: p.release_date, reverse=True)[0]


def _query_for_latest_plugin(
    name: str,
    attributes_to_get: List[str],
    filter_condition: Optional[Condition] = None,
) -> Optional[_Plugin]:
    kwargs = {
        "hash_key": name,
        "attributes_to_get": attributes_to_get,
        "filter_condition": filter_condition,
    }
    return _get_latest([plugin for plugin in _query_index(kwargs)])


def _scan_latest_plugins_index(
    attributes: List[str],
    mapper: Callable[[ResultIterator[_Plugin]], T],
    filter_conditions: Optional[Condition] = None,
) -> T:
    result = {}
    start = time.perf_counter()
    try:
        results = _Plugin.latest_plugin_index.scan(
            attributes_to_get=attributes,
            filter_condition=filter_conditions,
        )
        result = mapper(results)
        return result
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"latest plugins count={len(result)} duration={duration}ms")


def _to_plugin_name_by_repo(results: ResultIterator[_Plugin]) -> Dict[str, str]:
    return {_to_repo(plugin): plugin.name for plugin in results if _to_repo(plugin)}


def _to_repo(plugin: _Plugin) -> Optional[str]:
    if not plugin.code_repository:
        return None
    return GithubClientHelper.replace_github_url(plugin.code_repository, "")


def _to_visibility_condition(
    visibilities: Optional[Set[PluginVisibility]],
) -> Optional[Condition]:
    if not visibilities:
        return None
    return _Plugin.visibility.is_in(*{visibility.name for visibility in visibilities})


def _query_index(kwargs: dict) -> Iterator[_Plugin]:
    start = time.perf_counter()
    try:
        return _Plugin.latest_plugin_index.query(**kwargs)
    except Exception:
        logger.exception(f"Error querying latest_plugin_index kwargs={kwargs}")
        return []
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"latest_plugin kwargs={kwargs} duration={duration}ms")


def _query_table(kwargs: dict) -> Iterator[_Plugin]:
    start = time.perf_counter()
    try:
        return _Plugin.query(**kwargs)
    except Exception:
        logger.exception(f"Error querying table kwargs={kwargs}")
        return []
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"kwargs={kwargs} duration={duration}ms")
