from concurrent import futures
from datetime import datetime
import json
import os
from typing import Tuple, Dict, List, Callable, Any
from zipfile import ZipFile
from io import BytesIO
from collections import defaultdict
import pandas as pd

from api.models.metrics import InstallActivity
from utils.github import get_github_metadata, get_artifact
from utils.pypi import query_pypi, get_plugin_pypi_metadata
from api.s3 import get_cache, cache, write_data, get_install_timeline_data, get_latest_commit, get_commit_activity, \
    get_recent_activity_data
from utils.utils import render_description, send_alert, get_attribute, get_category_mapping, parse_manifest
from utils.datadog import report_metrics
from api.zulip import notify_new_packages
import boto3
import snowflake.connector as sc
from datetime import date
from dateutil.relativedelta import relativedelta

index_subset = {'name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status', 'category', 'display_name', 'plugin_types', 'reader_file_extensions',
                'writer_file_extensions', 'writer_save_layers', 'npe2', 'error_message', 'code_repository'}


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
    Get plugin and manifest metadata for a particular plugin, get latest if version is None.
    :param plugin: name of the plugin to get
    :param version: version of the plugin
    :return: plugin metadata dictionary
    """
    plugins = get_valid_plugins()
    if plugin not in plugins:
        return {}
    elif version is None:
        version = plugins[plugin]
    plugin_metadata = get_cache(f'cache/{plugin}/{version}.json')
    manifest_metadata = get_frontend_manifest_metadata(plugin, version)
    plugin_metadata.update(manifest_metadata)
    if plugin_metadata:
        return plugin_metadata
    else:
        return {}


def get_frontend_manifest_metadata(plugin, version):
    """Get manifest from cache, if it exists and parse into frontend fields

    When `error` is in the returned metadata, we return
    default values to the frontend.

    :param plugin: name of the plugin to get
    :param version: version of the plugin manifest
    :return: parsed metadata for the frontend
    """
    raw_metadata = get_manifest(plugin, version)
    if 'error' in raw_metadata:
        raw_metadata = None
    interpreted_metadata = parse_manifest(raw_metadata)
    return interpreted_metadata


def discover_manifest(plugin: str, version: str = None):
    """
    Invoke plugins lambda to generate manifest & write to cache.

    :param plugin: name of the plugin to get
    :param version: version of the plugin manifest
    """
    client = boto3.client('lambda')
    lambda_event = {'plugin': plugin, 'version': version}
    # this lambda invocation will call `napari-hub/plugins/get_plugin_manifest/generate_manifest`
    client.invoke(
        FunctionName=os.environ.get('PLUGINS_LAMBDA_NAME'),
        InvocationType='Event',
        Payload=json.dumps(lambda_event),
    )


def get_manifest(plugin: str, version: str = None) -> dict:
    """
    Get plugin manifest file for a particular plugin, get latest if version is None.
    :param plugin: name of the plugin to get
    :param version: version of the plugin manifest
    :return: plugin manifest dictionary.
    """
    plugins = get_valid_plugins()
    if plugin not in plugins:
        return {}
    elif version is None:
        version = plugins[plugin]
    plugin_metadata = get_cache(f'cache/{plugin}/{version}-manifest.json')

    # plugin_metadata being None indicates manifest is not cached and needs processing 
    if plugin_metadata is None:
        return {'error': 'Manifest not yet processed.'}

    # empty dict indicates some lambda error in processing e.g. timed out
    if plugin_metadata == {}:
        return {'error': 'Processing manifest failed due to external error.'}

    # error written to file indicates manifest discovery failed
    if 'error' in plugin_metadata:
        return {'error': plugin_metadata['error']}

    # correct plugin manifest
    return plugin_metadata


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
    return [{k: plugin_metadata[k] for k in index_subset if k in plugin_metadata}
            for plugin_metadata in plugins_metadata]


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
        cache(slice_metadata_to_index_columns(list(plugins_metadata.values())), 'cache/index.json')
        notify_new_packages(existing_public_plugins, visibility_plugins['public'], plugins_metadata)
        report_metrics('napari_hub.plugins.count', len(visibility_plugins['public']), ['visibility:public'])
        report_metrics('napari_hub.plugins.count', len(visibility_plugins['hidden']), ['visibility:hidden'])
        report_metrics('napari_hub.plugins.excluded', len(excluded_plugins))
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


def _execute_query(query, schema):
    SNOWFLAKE_USER = os.getenv('SNOWFLAKE_USER')
    SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')
    ctx = sc.connect(
        user=SNOWFLAKE_USER,
        password=SNOWFLAKE_PASSWORD,
        account="CZI-IMAGING",
        warehouse="IMAGING",
        database="IMAGING",
        schema=schema
    )
    return ctx.execute_string(query)


def update_activity_data():
    print("Starting data refresh for metrics")
    _update_activity_timeline_data()
    _update_recent_activity_data()
    repo_to_plugin_dict = _get_repo_to_plugin_dict()
    _update_latest_commits(repo_to_plugin_dict)
    _update_commit_activity(repo_to_plugin_dict)
    print("Completed data refresh for metrics successfully")


def _update_activity_timeline_data():
    """
    Update existing caches to reflect new activity data.
    """
    query = """
        SELECT 
            LOWER(file_project), DATE_TRUNC('month', timestamp) as month, count(*) as num_downloads
        FROM
            imaging.pypi.labeled_downloads
        WHERE 
            download_type = 'pip'
            AND project_type = 'plugin'
        GROUP BY file_project, month
        ORDER BY file_project, month
        """
    cursor_list = _execute_query(query, "PYPI")
    csv_string = "PROJECT,MONTH,NUM_DOWNLOADS_BY_MONTH\n"
    for cursor in cursor_list:
        for row in cursor:
            csv_string += str(row[0]) + ',' + str(row[1]) + ',' + str(row[2]) + '\n'
    write_data(csv_string, "activity_dashboard_data/plugin_installs.csv")


def _process_for_timeline(plugin_df, limit):
    date_format = '%Y-%m-%d'
    end_date = date.today().replace(day=1) + relativedelta(months=-1)
    start_date = end_date + relativedelta(months=-limit + 1)
    dates = pd.date_range(start=start_date, periods=limit, freq='MS')
    plugin_df = plugin_df[(plugin_df['MONTH'] >= start_date.strftime(date_format)) & (
                plugin_df['MONTH'] <= end_date.strftime(date_format))]
    result = []
    for cur_date in dates:
        if cur_date in plugin_df['MONTH'].values:
            row = plugin_df[plugin_df['MONTH'] == cur_date]
            installs = int(str(row.NUM_DOWNLOADS_BY_MONTH).split()[1])
        else:
            installs = 0
        result.append({'timestamp': int(cur_date.timestamp()) * 1000, 'installs': installs})
    return result


def _process_for_stats(plugin_df):
    if len(plugin_df) == 0:
        return {}

    return {'totalInstalls': int(plugin_df['NUM_DOWNLOADS_BY_MONTH'].sum())}


def _update_recent_activity_data(number_of_time_periods=30, time_granularity='DAY'):
    """
    Update existing caches to reflect recent activity data.
    """
    query = f"""
        SELECT 
            LOWER(file_project), count(*) as num_downloads
        FROM
            imaging.pypi.labeled_downloads
        WHERE 
            download_type = 'pip'
            AND project_type = 'plugin'
            AND timestamp > DATEADD({time_granularity}, {number_of_time_periods * -1}, CURRENT_DATE)
        GROUP BY file_project     
        ORDER BY file_project
    """
    cursor_list = _execute_query(query, "PYPI")
    data = {}
    for cursor in cursor_list:
        for row in cursor:
            data[row[0]] = row[1]

    write_data(json.dumps(data), "activity_dashboard_data/recent_installs.json")


def _update_repo_to_plugin_dict(repo_to_plugin_dict: dict, plugin_obj: dict):
    code_repository = plugin_obj.get('code_repository')
    if code_repository:
        repo_to_plugin_dict[code_repository.replace('https://github.com/', '')] = plugin_obj['name']
    return repo_to_plugin_dict


def _get_repo_to_plugin_dict():
    index_json = get_index()
    hidden_plugins = get_hidden_plugins()
    excluded_plugins = get_excluded_plugins()
    repo_to_plugin_dict = {}
    for public_plugin_obj in index_json:
        repo_to_plugin_dict = _update_repo_to_plugin_dict(repo_to_plugin_dict, public_plugin_obj)
    for excluded_plugin_name, excluded_plugin_visibility in excluded_plugins.items():
        if excluded_plugin_visibility == "hidden":
            excluded_plugin_obj = get_plugin(excluded_plugin_name, hidden_plugins[excluded_plugin_name])
        else:
            excluded_plugin_obj = get_plugin(excluded_plugin_name, None)
        repo_to_plugin_dict = _update_repo_to_plugin_dict(repo_to_plugin_dict, excluded_plugin_obj)
    return repo_to_plugin_dict


def _update_latest_commits(repo_to_plugin_dict):
    """
    Get the latest commit occurred for the plugin
    """
    query = f"""
        SELECT 
            repo, max(commit_author_date) as latest_commit
        FROM 
            imaging.github.commits
        WHERE 
            repo_type = 'plugin'
        GROUP BY repo 
        ORDER BY repo
    """
    cursor_list = _execute_query(query, "GITHUB")
    data = {}
    for cursor in cursor_list:
        for row in cursor:
            repo = row[0]
            if repo in repo_to_plugin_dict:
                plugin = repo_to_plugin_dict[repo]
                data[plugin] = int(pd.to_datetime(row[1]).strftime("%s")) * 1000
    write_data(json.dumps(data), "activity_dashboard_data/latest_commits.json")


def _update_commit_activity(repo_to_plugin_dict):
    """
    Get the commit activity occurred for the plugin in the past year
    """
    query = f"""
        SELECT 
            repo, date_trunc('month', to_date(commit_author_date)) as month, count(*) as commit_count
        FROM 
            imaging.github.commits
        WHERE 
            repo_type = 'plugin'
        GROUP BY repo, month
        ORDER BY repo, month
    """
    cursor_list = _execute_query(query, "GITHUB")
    data = {}
    for cursor in cursor_list:
        for repo, month, commit_count in cursor:
            if repo in repo_to_plugin_dict:
                timestamp = int(pd.to_datetime(month).strftime("%s")) * 1000
                commits = int(commit_count)
                data.setdefault(repo_to_plugin_dict[repo], []).append({'timestamp': timestamp, 'commits': commits})
    for plugin in data:
        data[plugin] = sorted(data[plugin], key=lambda x: (x['timestamp']))
    write_data(json.dumps(data), "activity_dashboard_data/commit_activity.json")


def _get_usage_data(plugin: str, limit: int, use_dynamo: bool) -> Dict[str, Any]:
    """
    Fetches plugin usage_data from s3 or dynamo based on the in_test variable
    :returns (dict[str, Any]): A dict with the structure {'timeline': List, 'stats': Dict[str, int]}

    :params str plugin: Name of the plugin in lowercase.
    :params int limit: Sets the number of records to be fetched for timeline.
    :params bool use_dynamo: Fetch data from dynamo if True, else fetch from s3.
    """
    if use_dynamo:
        timeline = InstallActivity.get_timeline(plugin, limit) if limit else []
        usage_stats = {
            'total_installs': InstallActivity.get_total_installs(plugin),
            'installs_in_last_30_days': InstallActivity.get_recent_installs(plugin, 30)
        }
    else:
        data = get_install_timeline_data(plugin)
        usage_stats = {
            'total_installs': _process_for_stats(data).get('totalInstalls', 0),
            'installs_in_last_30_days': get_recent_activity_data().get(plugin, 0),
        }
        timeline = _process_for_timeline(data, limit) if limit else []

    return {'timeline': timeline, 'stats': usage_stats, }


def get_metrics_for_plugin(plugin: str, limit: str, use_dynamo_for_usage: bool) -> Dict[str, Any]:
    """
    Fetches plugin metrics from s3 or dynamo based on the in_test variable
    :return dict[str, Any]: A map with entries for usage and maintenance

    :params str plugin: Name of the plugin in lowercase for which usage data needs to be fetched.
    :params str limit_str: Number of records to be fetched for timeline. Defaults to 0 for invalid number.
    :params bool use_dynamo_for_usage: Fetch data from dynamo if True else fetch from s3. (default= False)
    """
    plugin = plugin.lower()
    commit_activity = get_commit_activity(plugin)

    maintenance_timeline = []
    month_delta = 0

    if limit.isdigit() and limit != '0':
        month_delta = max(int(limit), 0)
        maintenance_timeline = commit_activity[-month_delta:]

    maintenance_stats = {
        'latest_commit_timestamp': get_latest_commit(plugin),
        'total_commits': sum([item['commits'] for item in commit_activity]),
    }
    return {
        'usage': _get_usage_data(plugin, month_delta, use_dynamo_for_usage),
        'maintenance': {'timeline': maintenance_timeline, 'stats': maintenance_stats, }
    }
