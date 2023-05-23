import logging

from collections import defaultdict
from typing import Dict

from nhcommons.models.category import get_category
from nhcommons.models.plugin_utils import PluginMetadataType
from nhcommons.utils import pypi_adapter

from nhcommons.models.plugin_metadata import (
    put_plugin_metadata, get_plugin_metadata
)
from nhcommons.models.plugin import (
    get_latest_plugins,
)
from nhcommons.utils.custom_parser import render_description
from nhcommons.utils.github_adapter import get_github_metadata


logger = logging.getLogger(__name__)


def update_plugin():
    dynamo_latest_plugins = get_latest_plugins()
    pypi_latest_plugins = pypi_adapter.get_all_plugins()

    def _is_new_plugin(plugin_version_pair):
        plugin = dynamo_latest_plugins.get(plugin_version_pair[0])
        return not plugin or plugin.version != plugin_version_pair[1]

    new_plugins = dict(filter(_is_new_plugin, pypi_latest_plugins.items()))
    logger.info(f"Count of new plugins={len(new_plugins)}")
    # update for new version of plugins
    for plugin_name, version in new_plugins.items():
        _update_for_new_plugin(plugin_name, version)

    # update for removed plugins and existing older version of plugins
    for name, plugin in dynamo_latest_plugins.items():
        logger.info(f"Updating old plugin={name} version={plugin.version}")
        if pypi_latest_plugins.get(name) != plugin.version:
            put_plugin_metadata(
                plugin=name,
                version=plugin.version,
                plugin_metadata_type=PluginMetadataType.PYPI
            )


def _update_for_new_plugin(plugin_name: str, version: str):
    logger.info(f"Updating for new plugin={plugin_name} version={version}")
    put_plugin_metadata(plugin=plugin_name,
                        version=version,
                        is_latest=True,
                        plugin_metadata_type=PluginMetadataType.PYPI)
    _build_plugin_metadata(plugin_name, version)
    pass


def _generate_metadata(pypi_metadata: Dict) -> Dict:
    github_repo_url = pypi_metadata.get('code_repository')
    if github_repo_url:
        return {**pypi_metadata, **get_github_metadata(github_repo_url)}
    return pypi_metadata


def _format_metadata(metadata: Dict) -> Dict:
    if 'description' in metadata:
        description = metadata.get('description')
        metadata['description_text'] = render_description(description)
    if 'labels' in metadata:
        category_version = metadata['labels']['ontology']
        categories = defaultdict(list)
        category_hierarchy = defaultdict(list)
        for label_term in metadata['labels']['terms']:
            for category in get_category(label_term, category_version):
                dimension = category["dimension"]
                label = category["label"]
                if label not in categories[dimension]:
                    categories[dimension].append(label)
                category["hierarchy"][0] = label
                category_hierarchy[dimension].append(category["hierarchy"])
        metadata['category'] = categories
        metadata['category_hierarchy'] = category_hierarchy
        del metadata['labels']
    return metadata


def _build_plugin_metadata(plugin: str, version: str) -> None:
    """
    Build plugin metadata from multiple sources if one is not already available.
    :return: None
    """
    cached_plugin = get_plugin_metadata(plugin,
                                        version,
                                        PluginMetadataType.DISTRIBUTION)
    if cached_plugin:
        return
    pypi_metadata = pypi_adapter.get_plugin_pypi_metadata(plugin, version)
    if not pypi_metadata:
        return
    distribution_metadata = _generate_metadata(pypi_metadata)

    put_plugin_metadata(plugin=plugin,
                        version=version,
                        plugin_metadata_type=PluginMetadataType.DISTRIBUTION,
                        data=_format_metadata(distribution_metadata))
