import logging
import time
from typing import Any

from pynamodb.attributes import (
    UnicodeAttribute,
    NumberAttribute,
    ListAttribute,
    MapAttribute
)
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from .helper import (set_ddb_metadata, get_stack_name, PynamoWrapper)

logger = logging.getLogger(__name__)


class _LatestPluginIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = f"{get_stack_name()}-latest-plugins"
        projection = AllProjection()

    name = UnicodeAttribute(hash_key=True)
    is_latest = UnicodeAttribute(range_key=True)

    authors = ListAttribute(null=True)
    data = MapAttribute()
    code_repository = UnicodeAttribute(null=True)
    display_name = UnicodeAttribute(null=True)
    first_released = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    release_date = NumberAttribute()
    last_updated_timestamp = NumberAttribute()


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
    first_released = UnicodeAttribute(null=True)
    summary = UnicodeAttribute(null=True)
    release_date = NumberAttribute()
    visibility = UnicodeAttribute(null=True)

    is_latest = UnicodeAttribute(null=True)
    excluded = UnicodeAttribute(null=True)

    latest_plugin_index = _LatestPluginIndex()


def get_latest_plugins() -> dict[str, str]:
    latest_plugins = {}
    start = time.perf_counter()
    try:
        response = _Plugin.latest_plugin_index.scan(
            attributes_to_get=["name", "version"]
        )
        latest_plugins = {plugin.name: plugin.version for plugin in response}
        return latest_plugins
    finally:
        duration = (time.perf_counter() - start) * 1000
        count = len(latest_plugins)
        logger.info(f"latest plugins count={count} duration={duration}ms")


def put_plugin(plugin: str, version: str, data: dict[str, Any]) -> None:
    start = time.perf_counter()
    try:
        _Plugin(
            hash_key=plugin,
            range_key=version,
            **data
        ).save()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"plugin={plugin} version={version} duration={duration}ms")
