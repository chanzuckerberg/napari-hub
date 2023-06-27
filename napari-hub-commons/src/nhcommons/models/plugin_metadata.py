
import logging
import time
from typing import Any, Dict, List, Optional, Set, Union

from pynamodb.attributes import (
    BooleanAttribute,
    MapAttribute,
    UnicodeAttribute,
)
from pynamodb.pagination import ResultIterator

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

    def to_dict(self) -> Dict[str, Any]:
        return {
            "data": self.data.as_dict() if self.data else None,
            "is_latest": self.is_latest or False,
            "last_updated_timestamp": self.last_updated_timestamp,
            "name": self.name,
            "type": PluginMetadataType[self.type],
            "version": self.version,
        }


def put_plugin_metadata(plugin: str,
                        version: str,
                        plugin_metadata_type: PluginMetadataType,
                        is_latest: bool = False,
                        data: Dict = None) -> None:
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


def get_existing_types(plugin: str, version: str) -> Set[PluginMetadataType]:
    results = _query(name=plugin, version=version, projection=['type'])
    existing_types = set()
    for result in results:
        try:
            existing_types.add(PluginMetadataType[result.type])
        except KeyError:
            logger.warning(f"Skipping unknown type {result.type}")
    return existing_types


def query(plugin: str, version: str) -> List[Dict[str, Any]]:
    return [result.to_dict() for result in _query(name=plugin, version=version)]


def _query(
        name: str, version: str, projection: Optional[List[str]] = None
) -> Union[ResultIterator[_PluginMetadata], List]:
    if not name or not version:
        return []

    start = time.perf_counter()
    try:
        condition = _PluginMetadata.version_type.startswith(f'{version}:')
        return _PluginMetadata.query(hash_key=name,
                                     range_key_condition=condition,
                                     attributes_to_get=projection)
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"plugin={name} version={version} duration={duration}ms")
