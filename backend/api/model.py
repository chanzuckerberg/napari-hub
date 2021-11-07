from concurrent import futures
from datetime import datetime
from typing import Tuple, Dict, List, Union
from zipfile import ZipFile
from io import BytesIO
from collections import defaultdict

from utils.github import get_github_metadata, get_artifact
from utils.pypi import query_pypi, get_plugin_pypi_metadata
from api.s3 import get_cache, cache
from utils.utils import render_description, send_alert, get_attribute
from api.zulip import notify_new_packages

index_subset = {'name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status', 'category'}


def get_public_plugins() -> Dict[str, str]:
    """
    Get the dictionary of public plugins and versions.

    :return: dict of public plugins and their versions
    """
    public_plugins = get_cache('cache/public-plugins.json')
    if public_plugins:
        return public_plugins
    else:
        return {}


def get_hidden_plugins() -> Dict[str, str]:
    """
    Get the dictionary of hidden plugins and versions.

    :return: dict of hidden plugins and their versions
    """
    hidden_plugins = get_cache('cache/hidden-plugins.json')
    if hidden_plugins:
        return hidden_plugins
    else:
        return {}


def get_valid_plugins() -> Dict[str, str]:
    """
    Get the dictionary of valid plugins and versions.

    :return: dict of valid plugins and their versions
    """
    return {**get_hidden_plugins(), **get_public_plugins()}


def get_plugin(plugin: str, version: str = None) -> dict:
    """
    Get plugin metadata for a particular plugin, get latest if version is None.

    :param plugin: name of the plugin to get
    :param version: version of the plugin
    :return: plugin metadata dictionary
    """
    plugins = get_valid_plugins()
    if plugin not in plugins:
        return {}
    elif version is None:
        version = plugins[plugin]
    plugin = get_cache(f'cache/{plugin}/{version}.json')
    if plugin:
        return plugin
    else:
        return {}


def get_index() -> dict:
    """
    Get the index page related metadata for all plugins.

    :return: dict for index page metadata
    """
    index = get_cache('cache/index.json')
    if index:
        return index
    else:
        return {}


def slice_metadata_to_index_columns(plugins_metadata: List[dict]) -> List[dict]:
    """
    slice index to only include specified indexing related columns.

    :param plugins_metadata: plugin metadata dictionary
    :return: sliced dict metadata for the plugin
    """
    return [{k: plugin_metadata.get(k) for k in index_subset} for plugin_metadata in plugins_metadata]


def get_excluded_plugins() -> Dict[str, str]:
    """
    Get the excluded plugins.

    :return: dict for excluded plugins and their exclusion status
    """
    excluded_plugins = get_cache('excluded_plugins.json')
    if excluded_plugins:
        return excluded_plugins
    else:
        return {}


def build_plugin_metadata(plugin: str, version: str) -> Tuple[str, dict]:
    """
    Build plugin metadata from multiple sources, reuse cached ones if available.

    :return: dict for aggregated plugin metadata
    """
    cached_plugin = get_cache(f'cache/{plugin}/{version}.json')
    if cached_plugin:
        return plugin, cached_plugin
    metadata = get_plugin_pypi_metadata(plugin, version)
    github_repo_url = metadata.get('code_repository')
    if github_repo_url:
        metadata = {**metadata, **get_github_metadata(github_repo_url)}
    if 'description' in metadata:
        metadata['description_text'] = render_description(metadata.get('description'))
    if 'category' in metadata:
        category_mappings = get_category_mapping()
        categories = defaultdict(list)
        hierarchies = defaultdict(list)
        for category in metadata['category']:
            mapped_category = get_category_mapping(category, category_mappings)
            for match in mapped_category:
                if match['label'] not in categories[match['dimension']]:
                    categories[match['dimension']].append(match['label'])
                match['hierarchy'][0] = match['label']
                hierarchies[match['dimension']].append(match['hierarchy'])
        metadata['category'] = categories
        metadata['category_hierarchy'] = hierarchies
    cache(metadata, f'cache/{plugin}/{version}.json')
    return plugin, metadata


def update_cache():
    """
    Update existing caches to reflect new/updated plugins. Files updated:
    - excluded_plugins.json (overwrite)
    - cache/public-plugins.json (overwrite)
    - cache/hidden-plugins.json (overwrite)
    - cache/index.json (overwrite)
    - cache/{plugin}/{version}.json (skip if exists)
    """
    plugins = query_pypi()
    plugins_metadata = get_plugin_metadata_async(plugins)
    excluded_plugins = get_updated_plugin_exclusion(plugins_metadata)

    visibility_plugins = {"public": {}, "hidden": {}}
    for plugin, version in plugins.items():
        visibility = plugins_metadata[plugin].get('visibility', 'public')
        if visibility in visibility_plugins:
            visibility_plugins[visibility][plugin] = version

    for plugin, _ in excluded_plugins.items():
        if plugin in plugins_metadata:
            del (plugins_metadata[plugin])

    if visibility_plugins['public']:
        existing_public_plugins = get_public_plugins()
        cache(excluded_plugins, 'excluded_plugins.json')
        cache(visibility_plugins['public'], 'cache/public-plugins.json')
        cache(visibility_plugins['hidden'], 'cache/hidden-plugins.json')
        cache(slice_metadata_to_index_columns(list(plugins_metadata.values())), 'cache/index.json')
        notify_new_packages(existing_public_plugins, visibility_plugins['public'])
    else:
        send_alert(f"({datetime.now()})Actions Required! Failed to query pypi for "
                   f"napari plugin packages, switching to backup analysis dump")


def get_updated_plugin_exclusion(plugins_metadata):
    """
    Update plugin visibility information with latest metadata.
    Override existing visibility information if existing entry is not 'blocked' (disabled by hub admin)

    public: fully visible (default)
    hidden: plugin page exists, but doesn't show up in search listings
    disabled: no plugin page created, does not show up in search listings

    :param plugins_metadata: plugin metadata containing visibility information
    :return: updated exclusion list
    """
    excluded_plugins = get_excluded_plugins()
    for plugin, plugin_metadata in plugins_metadata.items():
        if not plugin_metadata:
            excluded_plugins[plugin] = 'invalid'
        if 'visibility' not in plugin_metadata:
            continue
        if plugin in excluded_plugins and excluded_plugins[plugin] != "blocked":
            if plugin_metadata['visibility'] == 'public':
                del excluded_plugins[plugin]
            else:
                excluded_plugins[plugin] = plugin_metadata['visibility']
        elif plugin not in excluded_plugins and plugin_metadata['visibility'] != 'public':
            excluded_plugins[plugin] = plugin_metadata['visibility']
    return excluded_plugins


def get_plugin_metadata_async(plugins: Dict[str, str]) -> dict:
    """
    Query plugin metadata async.

    :param plugins: plugin name and versions to query
    :return: plugin metadata list
    """
    plugins_metadata = {}
    with futures.ThreadPoolExecutor(max_workers=32) as executor:
        plugin_futures = [executor.submit(build_plugin_metadata, k, v)
                          for k, v in plugins.items()]
    for future in futures.as_completed(plugin_futures):
        plugins_metadata[future.result()[0]] = (future.result()[1])
    return plugins_metadata


def move_artifact_to_s3(payload, client):
    """
    move preview page build artifact zip to public s3.

    :param payload: json body from the github webhook
    :param client: installation client to query GitHub API
    """
    if get_attribute(payload, ["workflow_run", "name"]) != "Preview Page":
        return

    owner = get_attribute(payload, ['repository', 'owner', 'login'])
    repo = get_attribute(payload, ["repository", "name"])
    pull_request_number = get_attribute(payload, ['workflow_run', 'pull_requests', 0, 'number'])
    if not pull_request_number:
        return

    artifact_url = get_attribute(payload, ["workflow_run", "artifacts_url"])
    if artifact_url:
        artifact = get_artifact(artifact_url, client.session.auth.token)
        if artifact:
            zipfile = ZipFile(BytesIO(artifact.read()))
            for name in zipfile.namelist():
                with zipfile.open(name) as file:
                    if name == "index.html":
                        cache(file, f'preview/{owner}/{repo}/{pull_request_number}', "text/html")
                    else:
                        cache(file, f'preview/{owner}/{repo}/{pull_request_number}/{name}')

            pull_request = client.pull_request(owner, repo, pull_request_number)
            pull_request.create_comment('Preview page for your plugin is ready here:\n'
                                        f'https://preview.napari-hub.org/{owner}/{repo}/{pull_request_number}')


def get_category_mapping(category: str = None, mappings: dict = None,
                         version="edam-alpha06") -> Union[Dict[str, List], List[Dict]]:
    """
    Get category mappings

    Parameters
    ----------
    category : str
        name of the category to map
    mappings: dict
        mappings to use for lookups, if None, use cached mapping
    version: str
        version of the category to use

    Returns
    -------
    match : dict if no category is given or list of dict if matched
        list of mapped label, dimension and hierarchy, for example, Manual segmentation is mapped to following:
        [
            {
                "label": "Image Segmentation",
                "dimension": "Operation",
                "hierarchy": [
                    "Manual segmentation",
                    "Image segmentation"
                ]
            },
            {
                "label": "Image annotation",
                "dimension": "Operation",
                "hierarchy": [
                    "Manual segmentation",
                    "Dense image annotation",
                    "Image annotation"
                ]
            }
        ]
    """
    if not mappings:
        mappings = get_cache(f'category/{version}-mappings.json')
    if not category:
        return mappings
    if category not in mappings:
        return []
    else:
        return mappings[category]
