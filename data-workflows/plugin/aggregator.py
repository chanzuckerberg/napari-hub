from typing import Any

from nhcommons.models import plugin_metadata
from nhcommons.models.plugin import put_plugin
from nhcommons.models.plugin_utils import PluginMetadataType, PluginVisibility
from nhcommons.models.plugins_blocked import get_all_blocked_plugins
from plugin.manifest import get_formatted_manifest

PLUGIN_FIELDS = {
    "authors", "code_repository", "display_name", "first_released",
    "release_date", "summary",
}


def _get_visibility(plugin, aggregate, blocked_plugins) -> PluginVisibility:
    if plugin in blocked_plugins:
        return PluginVisibility.BLOCKED
    elif not aggregate:
        return PluginVisibility.INVALID

    visibility = aggregate.get("visibility", "").upper()
    if visibility in PluginVisibility:
        return PluginVisibility[visibility]

    return PluginVisibility.PUBLIC


def _generate_record(plugin: str,
                     metadata_by_type: dict[PluginMetadataType, dict],
                     aggregate: dict[str, Any],
                     blocked_plugins: set[str]) -> dict[str, Any]:
    plugin_record = {
        "data": aggregate,
    }
    for field in PLUGIN_FIELDS:
        value = aggregate.get(field)
        if value:
            plugin_record[field] = value

    visibility = _get_visibility(plugin, aggregate, blocked_plugins).name
    plugin_record["visibility"] = visibility

    if metadata_by_type.get(PluginMetadataType.PYPI, {}).get("is_latest"):
        plugin_record["is_latest"] = "true"
        if visibility != PluginVisibility.PUBLIC:
            plugin_record["excluded"] = visibility

    return plugin_record


def aggregate_plugins(updated_plugins: set[tuple[str, str]]) -> None:
    blocked_plugins = get_all_blocked_plugins()
    for plugin, version in updated_plugins:
        metadata_by_type = _get_metadata_by_type(plugin, version)
        aggregate = _generate_aggregate(metadata_by_type, plugin, version)
        record = _generate_record(
            plugin, metadata_by_type, aggregate, blocked_plugins
        )
        put_plugin(plugin, version, record)


def _generate_aggregate(metadata_by_type: dict[PluginMetadataType, dict],
                        plugin: str,
                        version: str):
    metadata = metadata_by_type.get(PluginMetadataType.METADATA)
    distribution = get_formatted_manifest(
        metadata_by_type.get(PluginMetadataType.DISTRIBUTION), plugin, version
    )
    aggregate = metadata.update(distribution)
    return aggregate if aggregate else {}


def _get_metadata_by_type(plugin: str, version: str) -> \
        dict[PluginMetadataType, dict]:
    return {record["type"]: record
            for record in plugin_metadata.query(plugin, version)}
