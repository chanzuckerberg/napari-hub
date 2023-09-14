from typing import Dict, List, Any, Set, Optional
from nhcommons.models import (
    install_activity,
    plugin_metadata as plugin_metadata_model,
    plugin as plugin_model,
)


def _get_manifest_metadata(name: str, version: str) -> Optional[dict]:
    result = plugin_metadata_model.query(
        plugin=name, version_type=f"{version}:DISTRIBUTION"
    )
    return result[0].get("data", {}) if result else None


def get_manifest(name: str, version: str = None) -> dict:
    """
    Get plugin manifest file for a particular plugin, get the latest if version is None.
    :param name: name of the plugin to get
    :param version: version of the plugin manifest
    :return: plugin manifest dictionary.
    """
    version = version or plugin_model.get_latest_version(name)
    if not version:
        return {}
    manifest_metadata = _get_manifest_metadata(name, version)

    # manifest_metadata being None indicates manifest is not cached and needs processing
    if manifest_metadata is None:
        return {'error': 'Manifest not yet processed.'}

    # empty dict indicates some lambda error in processing e.g. timed out
    if manifest_metadata == {}:
        return {'error': 'Processing manifest failed due to external error.'}

    # error written to file indicates manifest discovery failed
    if 'error' in manifest_metadata:
        return {'error': manifest_metadata['error']}

    # correct plugin manifest
    return manifest_metadata


def get_index(
        visibility: Optional[Set[str]], include_total_installs: bool
) -> List[Dict[str, Any]]:
    """
    Get the index page related metadata for all plugins.
    :params visibility: visibilities to filter results by
    :params include_total_installs: include total_installs in result
    :return: dict for index page metadata
    """
    plugins = plugin_model.get_index(visibility)
    if include_total_installs:
        total_installs = install_activity.get_total_installs_by_plugins()
        for item in plugins:
            item["total_installs"] = total_installs.get(item["name"].lower(), 0)
    return plugins
