from pynamodb.attributes import (
    BooleanAttribute,
    MapAttribute,
    UnicodeAttribute,
)

from .helper import set_ddb_metadata, PynamoWrapper
from .plugin_metadata_type import PluginMetadataType


@set_ddb_metadata('plugin-metadata')
class _PluginMetadata(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_type = UnicodeAttribute(range_key=True)
    is_latest = BooleanAttribute(null=True)
    data = MapAttribute(null=True)


def put_pypi_record(plugin: str, version: str, is_latest: bool):
    _PluginMetadata(
        hash_key=plugin,
        range_key=PluginMetadataType.PYPI.to_version_type(version),
        is_latest=is_latest if is_latest else None
    ).save()
