import logging
from typing import Union, Dict

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
    is_latest = BooleanAttribute(null=True)
    data = MapAttribute(null=True)


def put_plugin_metadata(plugin: str,
                        version: str,
                        plugin_metadata_type: PluginMetadataType,
                        is_latest: bool = False,
                        data: Dict = None) -> None:
    _PluginMetadata(
        hash_key=plugin,
        range_key=plugin_metadata_type.to_version_type(version),
        is_latest=is_latest if is_latest else None,
        data=data
    ).save()


def get_plugin_metadata(plugin: str,
                        version: str,
                        metadata_type: PluginMetadataType)\
        -> Union[_PluginMetadata, None]:
    version_type = metadata_type.to_version_type(version)
    try:
        return _PluginMetadata.get(hash_key=plugin, range_key=version_type)
    except _PluginMetadata.DoesNotExist:
        logging.info(f"Record does not exist for plugin={plugin} "
                     f"version_type={version_type}")
        return None
