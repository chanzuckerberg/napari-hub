import logging
import os
import time
from typing import Optional, Callable, Iterator, Any, TypeVar, Dict, List, Set

from pynamodb.attributes import (
    UnicodeAttribute, ListAttribute, MapAttribute, NumberAttribute
)
from pynamodb.expressions.condition import Condition
from pynamodb.indexes import (
    GlobalSecondaryIndex, AllProjection
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


def get_index(visibility: Set[str]) -> List[Dict[str, Any]]:
    return _scan_index(
        index=_Plugin.latest_plugin_index,
        attributes_to_get=["name", "version", "data", "visibility"],
        filter_conditions=_to_visibility_condition(visibility),
        mapper=_index_list_mapper(INDEX_SUBSET)
    )


def get_plugin(name: str, version: str = None) -> Dict[str, Any]:
    kwargs = {
        "attributes_to_get": ["data", "release_date"],
        "filter_condition": _to_visibility_condition({"PUBLIC", "HIDDEN"}),
        "hash_key": name
    }
    try:
        if version:
            kwargs["range_key_condition"] = _Plugin.version == version
            results = _query_table(kwargs)
        else:
            results = _query_index(kwargs)

        plugin = _get_latest_version_plugin([plugin for plugin in results])
        return plugin.data.as_dict() if plugin and plugin.data else {}
    except Exception:
        logger.exception(f"failed kwargs={kwargs}")
        return {}


def get_latest_version(name: str) -> Optional[str]:
    result = _query_index({
        "hash_key": name,
        "attributes_to_get": ["name", "version", "release_date"],
    })
    plugin = _get_latest_version_plugin([plugin for plugin in result])
    return plugin.version if plugin else None


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
            filter_condition=filter_conditions,
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


def _to_visibility_condition(visibility: Set[str]) -> Optional[Condition]:
    if not visibility:
        return None
    return _Plugin.visibility.is_in(*{val.upper() for val in visibility})


def _get_latest_version_plugin(plugins: List[_Plugin]) -> Optional[_Plugin]:
    if not plugins:
        return None
    return sorted(plugins, key=lambda p: p.release_date, reverse=True)[0]


def _index_list_mapper(
        fields: Set[str]
) -> Callable[[Iterator[_Plugin]], List[Dict[str, Any]]]:
    def _to_dict(item: _Plugin, data: Dict) -> Dict:
        result = {key: data[key] for key in fields if key in data}
        result["visibility"] = item.visibility.lower()
        return result

    def _mapper(plugins: Iterator[_Plugin]):
        return [
            _to_dict(item, data)
            for item in plugins if item.data and (data := item.data.as_dict())
        ]

    return _mapper
