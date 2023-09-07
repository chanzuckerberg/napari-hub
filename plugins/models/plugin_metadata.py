import logging
from typing import Any, Dict

from nhcommons.models import plugin_metadata
from nhcommons.models.plugin_utils import PluginMetadataType

logger = logging.getLogger(__name__)


def write_manifest_data(plugin: str, version: str, data: Dict[str, Any]) -> None:
    logger.info(f"For {plugin} {version} writing data={data}")
    plugin_metadata.put_plugin_metadata(
        plugin, version, PluginMetadataType.DISTRIBUTION, data=data
    )


def is_manifest_exists(plugin: str, version: str) -> bool:
    existing_types = plugin_metadata.get_existing_types(plugin, version)
    return PluginMetadataType.DISTRIBUTION in existing_types
