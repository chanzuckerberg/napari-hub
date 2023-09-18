import logging
from typing import Any, Optional

from nhcommons.models.plugin_utils import PluginMetadataType, PluginVisibility
from nhcommons.models import plugins_blocked, plugin, plugin_metadata
from plugin.manifest import get_formatted_manifest

PLUGIN_FIELDS = {
    "authors",
    "code_repository",
    "display_name",
    "first_released",
    "release_date",
    "summary",
}

logger = logging.getLogger(__name__)


def aggregate_plugins(updated_plugins: set[tuple[str, Optional[str]]]) -> None:
    blocked_plugins = plugins_blocked.get_all_blocked_plugins()
    for name, version in updated_plugins:
        version = _get_latest_version(name, version)
        if not version:
            logger.warning(
                f"Unable to resolve version for plugin={name} version={version}"
            )
            continue
        metadata_by_type = _get_metadata_by_type(name, version)
        if PluginMetadataType.METADATA not in metadata_by_type:
            continue

        aggregate = _generate_aggregate(metadata_by_type, name, version)
        if not aggregate:
            continue

        record = _generate_record(name, metadata_by_type, aggregate, blocked_plugins)
        plugin.put_plugin(name, version, record)


def _get_latest_version(name: str, version: Optional[str]):
    return version if version else plugin.get_latest_version(name)


def _get_data_from_metadata(
    metadata_by_type: dict[PluginMetadataType, dict],
    plugin_metadata_type: PluginMetadataType,
    default_value: Optional[dict],
) -> Optional[dict[str, Any]]:
    if plugin_metadata_type not in metadata_by_type:
        return default_value
    return metadata_by_type.get(plugin_metadata_type).get("data", default_value)


def _generate_aggregate(
    metadata_by_type: dict[PluginMetadataType, dict], name: str, version: str
) -> dict[str, Any]:
    metadata = _get_data_from_metadata(
        metadata_by_type, PluginMetadataType.METADATA, {}
    )
    manifest = _get_data_from_metadata(
        metadata_by_type, PluginMetadataType.DISTRIBUTION, None
    )
    formatted_manifest = get_formatted_manifest(manifest, name, version)
    # add merged categories
    merged_category, merged_heirarchy = _merge_metadata_manifest_categories(metadata, formatted_manifest)
    metadata['category'] = merged_category
    metadata['category_hierarchy'] = merged_heirarchy
    del formatted_manifest['category']
    del formatted_manifest['category_hierarchy']
    return {**metadata, **formatted_manifest}


def _get_metadata_by_type(name: str, version: str) -> dict[PluginMetadataType, dict]:
    return {record["type"]: record for record in plugin_metadata.query(name, version)}


def _generate_record(
    name: str,
    metadata_by_type: dict[PluginMetadataType, dict],
    aggregate: dict[str, Any],
    blocked_plugins: set[str],
) -> dict[str, Any]:
    plugin_record = {"data": aggregate}
    for field in PLUGIN_FIELDS:
        value = aggregate.get(field)
        if value:
            plugin_record[field] = value

    visibility = _get_visibility(name, aggregate, blocked_plugins)
    plugin_record["visibility"] = visibility.name

    if metadata_by_type.get(PluginMetadataType.PYPI, {}).get("is_latest"):
        plugin_record["is_latest"] = "true"
        if visibility != PluginVisibility.PUBLIC:
            plugin_record["excluded"] = visibility.name

    return plugin_record


def _get_visibility(name, aggregate, blocked_plugins) -> PluginVisibility:
    if name in blocked_plugins:
        return PluginVisibility.BLOCKED

    visibility = aggregate.get("visibility", "").upper()
    if visibility in PluginVisibility:
        return PluginVisibility[visibility]

    return PluginVisibility.PUBLIC

def _merge_metadata_manifest_categories(metadata, manifest):
    """Merge categories and hierarchy in PyPI and manifest.

    Keeps union of keys and values present in both dictionaries.
    """
    meta_category = metadata.get('category', {})
    man_category = manifest.get('category', {})
    meta_category_hierarchy = metadata.get('category_hierarchy', {})
    man_category_hierarchy = manifest.get('category_hierarchy', {})
    
    merged_category = {}
    merged_keys = set(meta_category.keys()).union(set(man_category.keys()))
    for key in merged_keys:
        # unify both lists of terms
        merged_labels = list(set(meta_category.get(key, [])).union(set(man_category.get(key, []))))
        merged_category[key] = merged_labels

    merged_hierarchy = {}
    merged_keys = list(set(meta_category_hierarchy.keys()).union(set(man_category_hierarchy.keys())))
    for key in merged_keys:
        man_hierarchy = man_category_hierarchy.get(key, [])
        meta_hierarchy = meta_category_hierarchy.get(key, [])
        # the lowest level of the hierarchy will be the comparison key for removing duplicates
        meta_leaves = [hi_list[-1] for hi_list in meta_hierarchy]
        # only keep manifest hierarchies we don't already have
        man_filtered = list(filter(lambda hi_list: hi_list[-1] not in meta_leaves, man_hierarchy))
        meta_hierarchy.extend(man_filtered)
        merged_hierarchy[key] = meta_hierarchy
    return merged_category, merged_hierarchy
