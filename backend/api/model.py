from concurrent import futures
from datetime import datetime
import json
import os
from typing import Tuple, Dict, List, Callable, Any
from zipfile import ZipFile
from io import BytesIO
from collections import defaultdict
from api.models import (
    install_activity,
    plugin as plugin_model,
    plugin_blocked,
    plugin_metadata as plugin_metadata_model,
    category as category_model
)
from utils.github import get_github_metadata, get_artifact
from utils.pypi import query_pypi, get_plugin_pypi_metadata
from api.s3 import get_cache, cache
from utils.utils import (
    render_description,
    send_alert,
    get_attribute,
    get_category_mapping,
    parse_manifest
)
from utils.datadog import report_metrics
from api.zulip import notify_new_packages
import boto3
import logging

logger = logging.getLogger(__name__)
index_subset = {'name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status', 'category', 'display_name', 'plugin_types', 'reader_file_extensions',
                'writer_file_extensions', 'writer_save_layers', 'npe2', 'error_message', 'code_repository',
                'total_installs', }


def get_public_plugins() -> Dict[str, str]:
    """
    Get the dictionary of public plugins and versions.
    :return: dict of public plugins and their versions
    """
    return plugin_model.get_latest_by_visibility()


def discover_manifest(plugin: str, version: str = None):
    """
    Invoke plugins lambda to generate manifest & write to cache.

    :param plugin: name of the plugin to get
    :param version: version of the plugin manifest
    """
    client = boto3.client('lambda')
    lambda_event = {'plugin': plugin, 'version': version}
    # this lambda invocation will call
    # `napari-hub/plugins/get_plugin_manifest/generate_manifest`
    client.invoke(
        FunctionName=os.environ.get('PLUGINS_LAMBDA_NAME'),
        InvocationType='Event',
        Payload=json.dumps(lambda_event),
    )


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
    manifest_metadata = plugin_metadata_model.get_manifest(name, version)

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


def get_index() -> List[Dict[str, Any]]:
    """
    Get the index page related metadata for all plugins.
    :return: dict for index page metadata
    """
    plugins = plugin_model.get_index()
    total_installs = install_activity.get_total_installs_by_plugins()
    for item in plugins:
        item["total_installs"] = total_installs.get(item["name"].lower(), 0)
    return plugins


def slice_metadata_to_index_columns(plugins_metadata: List[dict]) -> List[dict]:
    """
    slice index to only include specified indexing related columns.
    :param plugins_metadata: plugin metadata dictionary
    :return: sliced dict metadata for the plugin
    """
    return [{k: plugin_metadata[k] for k in index_subset if k in plugin_metadata}
            for plugin_metadata in plugins_metadata]


def get_excluded_plugins() -> Dict[str, str]:
    """
    Get the excluded plugins.
    :return: dict for excluded plugins and their exclusion status
    """
    return {
        **plugin_model.get_excluded_plugins(),
        **plugin_blocked.get_blocked_plugins()
    }


def build_manifest_metadata(plugin: str, version: str) -> Tuple[str, dict]:
    manifest = get_manifest(plugin, version)
    if 'error' in manifest:
        if 'Manifest not yet processed' in manifest['error']:
            # this will invoke the plugins lambda & write manifest to cache
            discover_manifest(plugin, version)
        # return just default values for now
        metadata = parse_manifest()
    else:
        metadata = parse_manifest(manifest)
    return plugin, metadata


def build_plugin_metadata(plugin: str, version: str) -> Tuple[str, dict]:
    """
    Build plugin metadata from multiple sources, reuse cached ones if available.
    :return: dict for aggregated plugin metadata
    """
    cached_plugin = get_cache(f'cache/{plugin}/{version}.json')
    if cached_plugin:
        return plugin, cached_plugin
    metadata = get_plugin_pypi_metadata(plugin, version=version)
    if not metadata:
        return plugin, metadata
    github_repo_url = metadata.get('code_repository')
    if github_repo_url and github_repo_url.startswith("https://github.com/"):
        metadata = {**metadata, **get_github_metadata(github_repo_url)}
    if 'description' in metadata:
        metadata['description_text'] = render_description(metadata.get('description'))
    if 'labels' in metadata:
        category_mappings = category_model.get_all_categories(metadata['labels']['ontology'])
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
    cache(metadata, f'cache/{plugin}/{version}.json')
    return plugin, metadata


def generate_index(plugins_metadata: Dict[str, Any]):
    """
    Adds total_installs to plugins, and slice index to only include specified indexing related columns
    :param plugins_metadata: plugin metadata dictionary
    :return: sliced dict metadata for the plugin
    """
    total_install_by_plugin_name = install_activity.get_total_installs_by_plugins()
    for plugin_metadata in plugins_metadata.values():
        name = plugin_metadata.get('name')
        plugin_metadata['total_installs'] = total_install_by_plugin_name.get(name, 0)
    return slice_metadata_to_index_columns(list(plugins_metadata.values()))


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
    plugins_metadata = get_plugin_metadata_async(plugins, build_plugin_metadata)
    manifest_metadata = get_plugin_metadata_async(plugins, build_manifest_metadata)
    for plugin in plugins:
        plugins_metadata[plugin].update(manifest_metadata[plugin])
    excluded_plugins = get_updated_plugin_exclusion(plugins_metadata)
    visibility_plugins = {"public": {}, "hidden": {}}
    for plugin, version in plugins.items():
        if plugin in excluded_plugins:
            visibility = excluded_plugins[plugin]
        else:
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
        cache(generate_index(plugins_metadata), 'cache/index.json')
        notify_new_packages(existing_public_plugins, visibility_plugins['public'], plugins_metadata)
        report_metrics('napari_hub.plugins.count', len(visibility_plugins['public']), ['visibility:public'])
        report_metrics('napari_hub.plugins.count', len(visibility_plugins['hidden']), ['visibility:hidden'])
        report_metrics('napari_hub.plugins.excluded', len(excluded_plugins))
        logger.info("plugin update successful")
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
    blocked: no plugin page created, does not show up in search listings

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


def get_plugin_metadata_async(plugins: Dict[str, str], metadata_builder: Callable) -> dict:
    """
    Query plugin metadata async.

    :param plugins: plugin name and versions to query
    :param metadata_builder: function to read and parse metadata files
    :return: plugin metadata list
    """
    plugins_metadata = {}
    with futures.ThreadPoolExecutor(max_workers=32) as executor:
        plugin_futures = [executor.submit(metadata_builder, k, v)
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
    curr_clock = datetime.utcnow().isoformat()
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
            text = 'Preview page for your plugin is ready here:'
            comment_found = False
            for comment in pull_request.issue_comments():
                if text in comment.body and comment.user.login == 'napari-hub[bot]':
                    comment_found = True
                    comment.edit(text + f'\nhttps://preview.napari-hub.org/{owner}/{repo}/{pull_request_number}'
                                        f'\n_Updated: {curr_clock}_')
                    break
            if not comment_found:
                pull_request.create_comment(
                    text + f'\nhttps://preview.napari-hub.org/{owner}/{repo}/{pull_request_number}'
                           f'\n_Created: {curr_clock}_')
