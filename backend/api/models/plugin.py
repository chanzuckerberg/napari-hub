import logging
import os
import time
from typing import Optional, Callable, Iterator, Any, TypeVar, Dict, List

from pynamodb.attributes import (
    UnicodeAttribute, ListAttribute, MapAttribute, NumberAttribute
)
from pynamodb.expressions.condition import Condition
from pynamodb.indexes import (
    GlobalSecondaryIndex, AllProjection, IncludeProjection
)
from pynamodb.models import Model

from api.models.helper import set_ddb_metadata


logger = logging.getLogger(__name__)
INDEX_SUBSET = {
    "authors", "category", "code_repository", "description_content_type", 
    "description_text", "development_status", "display_name", "error_message", 
    "first_released", "license", "name", "npe2", "operating_system", 
    "plugin_types", "python_version", "reader_file_extensions", "release_date", 
    "summary", "version", "writer_file_extensions", "writer_save_layers"
}
T = TypeVar("T")


class _LatestPluginIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = f"{os.getenv('STACK_NAME')}-latest-plugins"
        projection = AllProjection()

    name = UnicodeAttribute(hash_key=True)
    is_latest = UnicodeAttribute(range_key=True)
    visibility = UnicodeAttribute(null=True)


class _ExcludedPluginIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = f"{os.getenv('STACK_NAME')}-excluded-plugins"
        projection = IncludeProjection(["last_updated_timestamp", "is_latest"])

    name = UnicodeAttribute(hash_key=True)
    excluded = UnicodeAttribute(range_key=True)


@set_ddb_metadata("plugin")
class _Plugin(Model):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version = UnicodeAttribute(range_key=True)

    authors = ListAttribute(null=True)
    data = MapAttribute()
    code_repository = UnicodeAttribute(null=True)
    display_name = UnicodeAttribute(null=True)
    excluded = UnicodeAttribute(null=True)
    first_released = UnicodeAttribute()
    is_latest = UnicodeAttribute(null=True)
    last_updated_timestamp = NumberAttribute()
    summary = UnicodeAttribute(null=True)
    release_date = UnicodeAttribute()
    visibility = UnicodeAttribute(null=True)

    latest_plugin_index = _LatestPluginIndex()
    excluded_plugin_index = _ExcludedPluginIndex()


def get_latest_by_visibility(visibility: str = "PUBLIC") -> Dict[str, str]:
    return _scan_index(
        index=_Plugin.latest_plugin_index,
        attributes_to_get=["name", "version"],
        filter_conditions=_Plugin.visibility == visibility,
        mapper=_to_plugin_version_dict
    )


def get_index() -> List[Dict[str, Any]]:
    return _scan_index(
        index=_Plugin.latest_plugin_index,
        attributes_to_get=["name", "version", "data"],
        filter_conditions=_Plugin.visibility == "PUBLIC",
        mapper=_index_list_mapper
    )


def get_plugin(name: str, version: str = None) -> Dict[str, Any]:
    visibility = ["PUBLIC", "HIDDEN"]
    kwargs = {
        "attributes_to_get": ["data", "release_date"],
        "filter_condition": _LatestPluginIndex.visibility.is_in(*visibility),
        "hash_key": name
    }
    try:
        if version:
            kwargs["range_key_condition"] = _Plugin.version == version
            results = _query_table(kwargs)
        else:
            results = _query_index(kwargs)

        plugins = [plugin for plugin in results]
        if not plugins:
            return {}

        plugin = sorted(plugins, key=lambda p: p.release_date, reverse=True)[0]
        return plugin.data.as_dict() if plugin.data else {}
    except Exception:
        logger.exception(f"failed kwargs={kwargs}")
        return {}


def get_excluded_plugins() -> Dict[str, str]:
    return _scan_index(
        index=_Plugin.excluded_plugin_index,
        attributes_to_get=["name", "excluded"],
        mapper=lambda iterator: {p.name: p.excluded.lower() for p in iterator}
    )


def get_latest_version(name: str) -> Optional[str]:
    result = _query_index({
        "hash_key": name,
        "attributes_to_get": ["name", "version", "release_date"],
    })
    plugins = [plugin for plugin in result]
    if not plugins:
        return None
    plugin = sorted(plugins, key=lambda p: p.release_date, reverse=True)[0]
    return plugin.version


def _scan_index(
        index: GlobalSecondaryIndex,
        mapper: Callable[[Iterator[_Plugin]], T],
        attributes_to_get: Optional[List[str]] = None,
        filter_conditions: Optional[Condition] = None
) -> T:
    plugins = {}
    start = time.perf_counter()
    try:
        response = index.scan(
            attributes_to_get=attributes_to_get,
            filter_condition=filter_conditions
        )
        plugins = mapper(response)
        return plugins
    except Exception:
        logger.exception(f"Error scanning type={type(index)}")
        return plugins
    finally:
        duration = (time.perf_counter() - start) * 1000
        count = len(plugins)
        logger.info(f"type={type(index)} count={count} duration={duration}ms")


def _query_index(kwargs: dict):
    start = time.perf_counter()
    try:
        return _Plugin.latest_plugin_index.query(**kwargs)
    except Exception:
        logger.exception(f"Error querying latest_plugin_index kwargs={kwargs}")
        return []
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"latest_plugin kwargs={kwargs} duration={duration}ms")


def _query_table(kwargs: dict):
    start = time.perf_counter()
    try:
        return _Plugin.query(**kwargs)
    except Exception:
        logger.exception(f"Error querying table kwargs={kwargs}")
        return []
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"kwargs={kwargs} duration={duration}ms")


def _to_plugin_version_dict(iterator: Iterator[_Plugin]) -> Dict[str, str]:
    return {plugin.name: plugin.version for plugin in iterator}


def _index_list_mapper(plugins: Iterator[_Plugin]) -> List[Dict[str, Any]]:
    return [{key: data[key] for key in INDEX_SUBSET if key in data}
            for item in plugins if item.data and (data := item.data.as_dict())]
