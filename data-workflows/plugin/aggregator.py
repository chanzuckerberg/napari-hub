from typing import Any, Optional

from nhcommons.models import plugin_metadata
from nhcommons.models.plugin import put_plugin
from nhcommons.models.plugin_utils import PluginMetadataType, PluginVisibility
from nhcommons.models.plugin_blocked import get_all_blocked_plugins
from plugin.manifest import get_formatted_manifest

PLUGIN_FIELDS = {
    "authors", "code_repository", "display_name", "first_released",
    "release_date", "summary",
}


def aggregate_plugins(updated_plugins: set[tuple[str, str]]) -> None:
    blocked_plugins = get_all_blocked_plugins()
    for plugin, version in updated_plugins:
        metadata_by_type = _get_metadata_by_type(plugin, version)
        if PluginMetadataType.METADATA not in metadata_by_type:
            continue

        aggregate = _generate_aggregate(metadata_by_type, plugin, version)
        if not aggregate:
            continue

        record = _generate_record(
            plugin, metadata_by_type, aggregate, blocked_plugins
        )
        put_plugin(plugin, version, record)


def _get_data_from_metadata(
        metadata_by_type: dict[PluginMetadataType, dict],
        plugin_metadata_type: PluginMetadataType,
        default_value: Optional[dict]
) -> Optional[dict[str, Any]]:
    if plugin_metadata_type not in metadata_by_type:
        return default_value
    return metadata_by_type.get(plugin_metadata_type).get("data")


def _generate_aggregate(metadata_by_type: dict[PluginMetadataType, dict],
                        plugin: str,
                        version: str) -> dict[str, Any]:
    metadata = _get_data_from_metadata(
        metadata_by_type, PluginMetadataType.METADATA, {}
    )
    manifest = _get_data_from_metadata(
        metadata_by_type, PluginMetadataType.DISTRIBUTION, None
    )
    distribution = get_formatted_manifest(manifest, plugin, version)
    return {**metadata, **distribution}


def _get_metadata_by_type(plugin: str, version: str) -> \
        dict[PluginMetadataType, dict]:
    return {record["type"]: record
            for record in plugin_metadata.query(plugin, version)}


def _generate_record(plugin: str,
                     metadata_by_type: dict[PluginMetadataType, dict],
                     aggregate: dict[str, Any],
                     blocked_plugins: set[str]) -> dict[str, Any]:
    plugin_record = {"data": aggregate}
    for field in PLUGIN_FIELDS:
        value = aggregate.get(field)
        if value:
            plugin_record[field] = value

    visibility = _get_visibility(plugin, aggregate, blocked_plugins)
    plugin_record["visibility"] = visibility.name

    if metadata_by_type.get(PluginMetadataType.PYPI, {}).get("is_latest"):
        plugin_record["is_latest"] = 'true'
        if visibility != PluginVisibility.PUBLIC:
            plugin_record["excluded"] = visibility.name

    return plugin_record


def _get_visibility(plugin, aggregate, blocked_plugins) -> PluginVisibility:
    if plugin in blocked_plugins:
        return PluginVisibility.BLOCKED
    elif not aggregate:
        return PluginVisibility.INVALID

    visibility = aggregate.get("visibility", "").upper()
    if visibility in PluginVisibility:
        return PluginVisibility[visibility]

    return PluginVisibility.PUBLIC
