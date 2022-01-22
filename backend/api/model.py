from concurrent import futures
from datetime import datetime
from typing import Tuple, Dict, List
from zipfile import ZipFile
from io import BytesIO
from collections import defaultdict
from pynamodb.exceptions import DoesNotExist

from utils.github import get_github_metadata, get_artifact
from utils.pypi import query_pypi, get_plugin_pypi_metadata
from api.s3 import get_cache, cache
from api.entity import Plugin, ExcludedPlugin, get_plugin_entity
from utils.utils import render_description, send_alert, get_attribute, get_category_mapping
from utils.datadog import report_metrics
from api.zulip import notify_new_packages

index_subset = ['name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status', 'category']


def get_public_plugins() -> Dict[str, str]:
    """
    Get the dictionary of public plugins and versions.

    :return: dict of public plugins and their versions
    """
    return {
        plugin.name: plugin.version for plugin in
        Plugin.scan(Plugin.visibility == 'public')
    }


def get_hidden_plugins() -> Dict[str, str]:
    """
    Get the dictionary of hidden plugins and versions.

    :return: dict of hidden plugins and their versions
    """
    return {
        plugin.name: plugin.version for plugin in
        Plugin.scan(Plugin.visibility == 'hidden')
    }


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
    if not version:
        entity = Plugin.query(plugin, scan_index_forward=False).next()
        if not entity:
            return {}
        else:
            return entity.attribute_values
    else:
        try:
            return Plugin.get(plugin, version).attribute_values
        except DoesNotExist:
            return {}


def get_index() -> List[dict]:
    """
    Get the index page related metadata for all plugins.

    :return: list of plugin index metadata
    """
    return [
        plugin.attribute_values for plugin in
        Plugin.scan(Plugin.visibility == 'public', attributes_to_get=index_subset)
    ]


def get_excluded_plugins() -> Dict[str, str]:
    """
    Get the excluded plugins.

    :return: dict for excluded plugins and their exclusion status
    """
    return {
        excluded_plugin.name: excluded_plugin.status for excluded_plugin in
        ExcludedPlugin.scan()
    }


def build_plugin_metadata(plugin: str, version: str) -> Tuple[str, dict]:
    """
    Build plugin metadata from multiple sources, reuse cached ones if available.

    :return: dict for aggregated plugin metadata
    """
    try:
        return plugin, Plugin.get(plugin, version).attribute_values
    except DoesNotExist:
        pass
    metadata = get_plugin_pypi_metadata(plugin, version)
    github_repo_url = metadata.get('code_repository')
    if github_repo_url:
        metadata = {**metadata, **get_github_metadata(github_repo_url)}
    if 'description' in metadata:
        metadata['description_text'] = render_description(metadata.get('description'))
    if 'labels' in metadata:
        category_mappings = get_categories_mapping(metadata['labels']['ontology'])
        categories = defaultdict(list)
        category_hierarchy = defaultdict(list)
        for category in metadata['labels']['terms']:
            mapped_category = get_category_mapping(category, category_mappings)
            for match in mapped_category:
                if match['label'] not in categories[match['dimension']]:
                    categories[match['dimension']].append(match['label'])
                match['hierarchy'][0] = match['label']
                category_hierarchy[match['dimension']].append(match['hierarchy'])
        metadata['category'] = categories
        metadata['category_hierarchy'] = category_hierarchy
        del metadata['labels']

    entity = get_plugin_entity(plugin, metadata)
    entity.save()
    return plugin, metadata


def update_cache():
    """
    Update database to reflect new/updated plugins.
    """
    existing_public_plugins = get_public_plugins()
    plugins = query_pypi()
    plugins_metadata = get_plugin_metadata_async(plugins)
    excluded_plugins = get_updated_plugin_exclusion(plugins_metadata)
    for name, status in excluded_plugins.items():
        excluded_plugin_entity = ExcludedPlugin(name=name, status=status)
        excluded_plugin_entity.save()

    visibility_plugins = {"public": {}, "hidden": {}}
    for plugin, version in plugins.items():
        visibility = plugins_metadata[plugin].get('visibility', 'public')
        if visibility in visibility_plugins:
            visibility_plugins[visibility][plugin] = version

    for plugin, _ in excluded_plugins.items():
        if plugin in plugins_metadata:
            del (plugins_metadata[plugin])

    for key in visibility_plugins.keys():
        report_metrics('napari_hub.plugins.count', len(visibility_plugins[key]), [f'visibility:{key}'])

    if visibility_plugins['public']:
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
    owner = get_attribute(payload, ['repository', 'owner', 'login'])
    repo = get_attribute(payload, ["repository", "name"])
    pull_request_number = get_attribute(payload, ['workflow_run', 'pull_requests', 0, 'number'])
    if not pull_request_number:
        github_repo = client.repository(owner, repo)
        head_owner = get_attribute(payload, ['workflow_run', 'head_repository', 'owner', 'login'])
        head_branch = get_attribute(payload, ['workflow_run', 'head_branch'])
        pull_requests = list(github_repo.pull_requests(head=f'{head_owner}:{head_branch}'))
        if len(pull_requests) == 1:
            pull_request_number = pull_requests[0].number
        else:
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


def get_categories_mapping(version: str) -> Dict[str, List]:
    """
    Get all category mappings.

    Parameters
    ----------
    version
        version of the category mapping to get

    Returns
    -------
    Mapping between ontology label to list of mappings, each mapping consists:
        dimension: dimension of the mapping, should be one of ["Supported data", "Image modality", "Workflow step"]
        hierarchy: mapped hierarchy from the top level ontology label to the bottom as a list
        label: mapped napari hub label.
    """
    mappings = get_cache(f'category/{version.replace(":", "/")}.json')
    return mappings or {}
