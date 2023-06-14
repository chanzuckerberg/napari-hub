import logging
import time

from pynamodb.attributes import (
    BooleanAttribute,
    MapAttribute,
    UnicodeAttribute,
)

from .helper import set_ddb_metadata, PynamoWrapper
from .plugin_utils import PluginMetadataType

logger = logging.getLogger(__name__)


@set_ddb_metadata('plugin-metadata')
class _PluginMetadata(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_type = UnicodeAttribute(range_key=True)
    type = UnicodeAttribute()
    version = UnicodeAttribute()
    is_latest = BooleanAttribute(null=True)
    data = MapAttribute(null=True)


def put_plugin_metadata(plugin: str,
                        version: str,
                        plugin_metadata_type: PluginMetadataType,
                        is_latest: bool = False,
                        data: dict = None) -> None:
    start = time.perf_counter()
    version_type = plugin_metadata_type.to_version_type(version)
    try:
        _PluginMetadata(
            hash_key=plugin,
            range_key=version_type,
            type=plugin_metadata_type.name,
            version=version,
            is_latest=is_latest if is_latest else None,
            data=data,
        ).save()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"plugin={plugin} version_type={version_type} "
                    f"duration={duration}ms")


def get_existing_types(plugin: str, version: str) -> set[PluginMetadataType]:
    start = time.perf_counter()
    try:
        condition = _PluginMetadata.version_type.startswith(f'{version}:')
        results = _PluginMetadata.query(hash_key=plugin,
                                        range_key_condition=condition,
                                        attributes_to_get=['type'])
        existing_types = set()
        for result in results:
            try:
                existing_types.add(PluginMetadataType[result.type])
            except KeyError:
                logger.warning(f"Skipping unknown type {result.type}")
        return existing_types
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"plugin={plugin} version={version} duration={duration}ms")
