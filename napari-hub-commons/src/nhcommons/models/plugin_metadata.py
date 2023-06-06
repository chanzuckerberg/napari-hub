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

    def __eq__(self, other):
        if isinstance(other, _PluginMetadata):
            return ((self.name, self.version_type, self.is_latest,
                     self.data.as_dict()) ==
                    (other.name, other.version_type, other.is_latest,
                     other.data.as_dict()))
        return False


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
        logger.info(f"put_plugin_metadata plugin={plugin} "
                    f"version_type={version_type} time_taken={duration}ms")


def existing_plugin_metadata_types(plugin: str, version: str) \
        -> set[PluginMetadataType]:
    start = time.perf_counter()
    try:
        condition = _PluginMetadata.version_type.startswith(f'{version}:')
        results = _PluginMetadata.query(hash_key=plugin,
                                        range_key_condition=condition,
                                        attributes_to_get=['type'])
        return {PluginMetadataType[result.type] for result in results}
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"query plugin_metadata for plugin={plugin} "
                    f"version={version} time_taken={duration}ms")
