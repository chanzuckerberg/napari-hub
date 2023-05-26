import logging
from concurrent import futures

from plugin.lambda_adapter import LambdaAdapter
from nhcommons.models.plugin_utils import PluginMetadataType
from nhcommons.utils import pypi_adapter

from nhcommons.models.plugin_metadata import (
    put_plugin_metadata, existing_plugin_metadata_types
)
from nhcommons.models.plugin import get_latest_plugins
from plugin.metadata import get_formatted_metadata

logger = logging.getLogger(__name__)


def update_plugin() -> None:
    dynamo_latest_plugins = get_latest_plugins()
    pypi_latest_plugins = pypi_adapter.get_all_plugins()

    def _is_new_plugin(plugin_version_pair):
        version = dynamo_latest_plugins.get(plugin_version_pair[0])
        return not version or version != plugin_version_pair[1]

    new_plugins = dict(filter(_is_new_plugin, pypi_latest_plugins.items()))
    logger.info(f"Count of new plugins={len(new_plugins)}")

    # update for new version of plugins
    with futures.ThreadPoolExecutor(max_workers=32) as executor:
        update_futures = [executor.submit(_update_for_new_plugin, name, version)
                          for name, version in new_plugins.items()]

    futures.wait(update_futures, return_when='ALL_COMPLETED')

    # update for removed plugins and existing older version of plugins
    for name, version in dynamo_latest_plugins.items():
        logger.info(f"Updating old plugin={name} version={version}")
        if pypi_latest_plugins.get(name) != version:
            put_plugin_metadata(
                plugin=name,
                version=version,
                plugin_metadata_type=PluginMetadataType.PYPI
            )


def _update_for_new_plugin(name: str, version: str) -> None:
    logger.info(f"Update complete for new plugin={name} version={version}")
    put_plugin_metadata(plugin=name,
                        version=version,
                        is_latest=True,
                        plugin_metadata_type=PluginMetadataType.PYPI)
    cached_plugins = existing_plugin_metadata_types(name, version)
    _build_plugin_metadata(name, version, cached_plugins)
    _build_plugin_manifest(name, version, cached_plugins)


def _build_plugin_manifest(plugin: str,
                           version: str,
                           cache: set[PluginMetadataType]) -> None:
    """
    Build plugin manifest if one is not already available.
    Invokes plugins lambda to generate manifest & write to cache.
    :param plugin: name of the plugin to get
    :param version: version of the plugin manifest
    :param cache: types of PluginMetadata that exists in dynamo
    :return: None
    """
    if PluginMetadataType.DISTRIBUTION in cache:
        return

    LambdaAdapter().invoke(plugin, version)


def _build_plugin_metadata(plugin: str,
                           version: str,
                           cache: set[PluginMetadataType]) -> None:
    """
    Build plugin metadata from multiple sources if one is not already available.
    :param plugin: name of the plugin to get
    :param version: version of the plugin manifest
    :param cache: types of PluginMetadata that exists in dynamo
    :return: None
    """
    if PluginMetadataType.METADATA in cache:
        return
    data = get_formatted_metadata(plugin, version)
    if not data:
        return

    put_plugin_metadata(plugin=plugin,
                        version=version,
                        plugin_metadata_type=PluginMetadataType.METADATA,
                        data=data)
