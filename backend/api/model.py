import os
from concurrent import futures
from typing import Dict, List
from zipfile import ZipFile
from io import BytesIO
from collections import defaultdict
from pynamodb.exceptions import DoesNotExist

from utils.github import get_github_metadata, get_artifact
from utils.pypi import query_pypi, get_plugin_pypi_metadata
from api.s3 import cache
from api.entity import Plugin, ExcludedPlugin, Category, save_plugin_entity
from utils.utils import render_description, get_attribute
from api.zulip import notify_packages
from category.edam import get_edam_mappings

index_subset = ['name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status', 'category']
valid_visibility = {'public', 'hidden'}


def get_public_plugins() -> Dict[str, str]:
    """
    Get the dictionary of public plugins and versions.

    :return: dict of public plugins and their versions
    """
    return {
        plugin.name: plugin.version for plugin in
        Plugin.scan(Plugin.visibility == 'public', attributes_to_get=['name', 'version'])
    }


def get_hidden_plugins() -> Dict[str, str]:
    """
    Get the dictionary of hidden plugins and versions.

    :return: dict of hidden plugins and their versions
    """
    return {
        plugin.name: plugin.version for plugin in
        Plugin.scan(Plugin.visibility == 'hidden', attributes_to_get=['name', 'version'])
    }


def get_valid_plugins() -> Dict[str, str]:
    """
    Get the dictionary of valid plugins and versions.

    :return: dict of valid plugins and their versions
    """
    return {
        plugin.name: plugin.version for plugin in
        Plugin.scan(Plugin.visibility.is_in(valid_visibility), attributes_to_get=['name', 'version'])
    }


def get_plugin(plugin: str, version: str = None) -> dict:
    """
    Get plugin metadata for a particular plugin, get latest if version is None.

    :param plugin: name of the plugin to get
    :param version: version of the plugin
    :return: plugin metadata dictionary
    """
    match = None
    if not version:
        for entity in Plugin.query(plugin, scan_index_forward=False, limit=1):
            match = entity
    else:
        try:
            match = Plugin.get(plugin, version)
        except DoesNotExist:
            pass
    if match and match.visibility in valid_visibility:
        return match.attribute_values
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
        ExcludedPlugin.scan(attributes_to_get=['name', 'status'])
    }


def save_plugin_metadata(plugin: str, version: str):
    """
    Build plugin metadata from multiple sources, reuse cached ones if available.

    :return: dict for aggregated plugin metadata
    """
    try:
        Plugin.get(plugin, version)
        return
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
            mapped_category = category_mappings.get(category, [])
            for match in mapped_category:
                if match['label'] not in categories[match['dimension']]:
                    categories[match['dimension']].append(match['label'])
                match['hierarchy'][0] = match['label']
                category_hierarchy[match['dimension']].append(match['hierarchy'])
        metadata['category'] = categories
        metadata['category_hierarchy'] = category_hierarchy
        del metadata['labels']

    try:
        metadata['visibility'] = ExcludedPlugin.get(plugin).status
    except DoesNotExist:
        pass

    entity = save_plugin_entity(plugin, metadata)
    if entity.visibility == 'public':
        if Plugin.count(plugin, limit=1) == 0:
            notify_packages(plugin)
        else:
            notify_packages(plugin, version)


def update_cache():
    """
    Update database to keep data in sync.
    """
    category_version = os.getenv('CATEGORY_VERSION')
    if Category.count(filter_condition=Category.version == category_version, limit=1) == 0:
        edam_mappings = get_edam_mappings(category_version.split(":")[1])
        for name, mapping in edam_mappings.items():
            entity = Category(name=name, mapping=mapping, version=category_version)
            entity.save()

    all_plugins = {(plugin.name, plugin.version): plugin.visibility
                   for plugin in Plugin.scan(attributes_to_get=['name', 'version', 'visibility'])}
    public_plugins = {
        plugin[0]: plugin[1] for plugin, visibility in all_plugins.items() if visibility == 'public'
    }
    pypi_plugins = query_pypi()

    for plugin in public_plugins.keys():
        if plugin not in pypi_plugins:
            notify_packages(plugin, removed=True)

    updated_plugins = {
        name: version for name, version in pypi_plugins if (name, version) not in all_plugins.keys()
    }
    update_plugin_metadata_async(updated_plugins)


def update_plugin_metadata_async(plugins: Dict[str, str]):
    """
    Query plugin metadata async.

    :param plugins: plugin name and versions to query
    """
    with futures.ThreadPoolExecutor() as executor:
        completion = [executor.submit(save_plugin_metadata, k, v) for k, v in plugins.items()]

    for future in futures.as_completed(completion):
        assert future.done()


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
    return {
        category.name: category.mapping for category in
        Category.scan(Category.version == version, attributes_to_get=['name', 'version', 'mapping'])
    }


def get_category_mapping(category: str, version: str) -> List[Dict]:
    """
    Get category mappings

    Parameters
    ----------
    category : str
        name of the category to map
    version: str
        version of the category

    Returns
    -------
    match : list of matched category
        list of mapped label, dimension and hierarchy, where hierarchy is from most abstract to most specific.
        for example, Manual segmentation is mapped to the following list:
        [
            {
                "label": "Image Segmentation",
                "dimension": "Operation",
                "hierarchy": [
                    "Image segmentation",
                    "Manual segmentation"
                ]
            },
            {
                "label": "Image annotation",
                "dimension": "Operation",
                "hierarchy": [
                    "Image annotation",
                    "Dense image annotation",
                    "Manual segmentation"
                ]
            }
        ]
    """
    try:
        return Category.get(category, version).mapping
    except DoesNotExist:
        return []
