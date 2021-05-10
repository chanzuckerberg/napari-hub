import os
import concurrent.futures
import re
from datetime import datetime, timedelta, timezone
import tempfile
from typing import List

import json
import yaml

import requests
from requests.exceptions import HTTPError
from requests.utils import requote_uri

import boto3
from botocore.exceptions import ClientError
from google.cloud import bigquery

# Environment variable set through lambda terraform infra config
bucket = os.environ.get('BUCKET')
slack_url = os.environ.get('SLACK_URL')
cache_ttl = int(os.environ.get('TTL', "4"))
plugins_key = 'cache/plugins.json'
index_key = 'cache/index.json'
exclusion_list = 'excluded_plugins.json'
index_subset = {'name', 'summary', 'description', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status'}

s3 = boto3.resource('s3')
s3_client = boto3.client("s3")
cache_ttl = timedelta(minutes=cache_ttl)


def handler(event: dict, context) -> dict:
    """
    Entrypoint for lambda handler.

    :param event: event for the lambda invoke to handle
    :param context: context about this invoke
    :return: result for the invoke
    """
    if 'index' in event:
        return get_index(context)
    elif 'exclusion' in event:
        return get_exclusion_list()
    elif 'version' in event and 'plugin' in event:
        return get_plugin(event['plugin'], event['version'])
    elif 'plugin' in event:
        return get_plugin(event['plugin'])
    else:
        return get_plugins(context)


def get_attribute(obj: dict, path: list):
    """
    Get attribute iteratively from a json object.

    :param obj: object to iterate on
    :param path: list of string to get subpath within json
    :return: the value if the path is accessible, empty string if not found
    """
    part = obj
    for token in path:
        if isinstance(part, dict) and token in part:
            part = part[token]
        elif isinstance(part, list) and token < len(part):
            part = part[token]
        else:
            return ""
    return part


def filter_prefix(str_list: List[str], prefix: str) -> list:
    """
    Filter the list for strings with the given prefix.

    :param str_list: list of strings to filter
    :param prefix: prefix to filter on
    :return: list of filtered strings
    """
    return [string for string in str_list if string.startswith(prefix)]


def filter_index(plugin: str, version: str) -> dict:
    """
    Filter index based to only include specified entries.

    :param plugin: name of the plugin
    :param version: version of the plugin
    :return: filtered json metadata for the plugin
    """
    plugin_info = get_plugin(plugin, version)
    return {k: plugin_info[k] for k in index_subset}


def get_index(context) -> dict:
    """
    Get the index page related metadata for all plugins.

    :param context: context for the run to raise alerts for
    :return: json for index page metadata
    """
    if cache_available(index_key, cache_ttl):
        return get_cache(index_key)
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as executor:
        futures = [executor.submit(filter_index, k, v)
                   for k, v in get_plugins(context).items()]
    for future in concurrent.futures.as_completed(futures):
        results.append(future.result())
    return cache(results, index_key)


def get_file(download_url: str, file: str) -> [dict, None]:
    """
    Get file from github.

    :param download_url: github url to download from
    :param file: filename to get
    :return: file context for the file to download
    """
    api_url = download_url.replace("https://github.com/",
                                   "https://api.github.com/repos/")
    try:
        response = requests.get(
            f'{api_url}/{file}')
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        info = json.loads(response.text)
        if "download_url" in info:
            return requests.get(info["download_url"]).text
    except HTTPError:
        pass

    return None


def get_extra_metadata(download_url: str) -> dict:
    """
    Extract extra metadata from the github download url

    :param download_url: github url to download from
    :return: extra metadata dictionary
    """
    extra_metadata = {}

    description = get_file(download_url, "contents/.napari/DESCRIPTION.md")

    if description is not None:
        extra_metadata['description'] = description

    yaml_file = get_file(download_url, "contents/.napari/config.yml")
    if yaml_file:
        config = yaml.safe_load(yaml_file)
        extra_metadata.update(config)

    return extra_metadata


def format_plugin(plugin: dict) -> dict:
    """
    Format the plugin dictionary to extra relevant information.

    :param plugin: plugin dictionary from pypi
    :return: formatted plugin dictionary
    """
    version = get_attribute(plugin, ["info", "version"])

    download_url = get_attribute(plugin, ["info", "project_urls", "Source Code"])

    extra_metadata = {}
    project_urls = {}
    if download_url:
        extra_metadata = get_extra_metadata(download_url)
        project_urls = extra_metadata.get('project_urls', {})

    return {
        "name": get_attribute(plugin, ["info", "name"]),
        "summary": extra_metadata.get('summary', get_attribute(plugin, ["info", "summary"])),
        "description": extra_metadata.get('description', f'{get_attribute(plugin, ["info", "description"])}'),
        "description_content_type": f'{get_attribute(plugin, ["info", "description_content_type"])}',
        "authors": extra_metadata.get('authors', [{'name': get_attribute(plugin, ["info", "author"]),
                                                   'email': get_attribute(plugin, ["info", "author_email"])}]),
        "license": get_attribute(plugin, ["info", "license"]),
        "python_version": get_attribute(plugin, ["info", "requires_python"]),
        "operating_system": filter_prefix(
            get_attribute(plugin, ["info", "classifiers"]),
            "Operating System"),
        "release_date": get_attribute(plugin, ["releases", version, 0,
                                               "upload_time_iso_8601"]),
        "version": version,
        "first_released": min(
            get_attribute(release, [0, "upload_time_iso_8601"])
            for _, release in get_attribute(plugin, ["releases"]).items()
            if get_attribute(release, [0, "upload_time_iso_8601"])),
        "development_status": filter_prefix(
            get_attribute(plugin, ["info", "classifiers"]),
            "Development Status"),

        # below are plugin details
        "requirements": get_attribute(plugin, ["info", "requires_dist"]),
        "project_site": project_urls.get('Project Site', get_attribute(
            plugin, ["info", "project_url"])),
        "documentation": project_urls.get('Documentation', get_attribute(
            plugin, ["info", "project_urls", "Documentation"])),
        "support": project_urls.get('User Support', get_attribute(
            plugin, ["info", "project_urls", "User Support"])),
        "report_issues": project_urls.get('Report Issues', get_attribute(
            plugin, ["info", "project_urls", "Bug Tracker"])),
        "twitter": project_urls.get('Twitter', get_attribute(
            plugin, ["info", "project_urls", "Twitter"])),
        "code_repository": download_url,
    }


def get_plugins(context) -> dict:
    """
    Get all valid plugins list. We would first try to see if there is a freshly
    cached list, and return that if available, then we try to read from pypi,
    and fail over to google bigquery analysis dump when pypi reading failed
    as well. If every attempts failed, we return the cached version regardless
    of freshness.

    :param context: context for the run to raise alerts
    :return: json of valid plugins and their version
    """
    if cache_available(plugins_key, cache_ttl):
        return get_cache(plugins_key)

    packages = query_pypi()

    if packages:
        return cache(filter_excluded_plugin(packages), plugins_key)

    send_alert(f"({datetime.now()})Actions Required! Failed to query pypi for "
               f"napari plugin packages, switching to backup analysis dump\n"
               f"Lambda function ARN: {context.invoked_function_arn}\n"
               f"CloudWatch log stream name: {context.log_stream_name}\n"
               f"CloudWatch log group name {context.log_group_name}\n"
               f"Lambda Request ID: {context.aws_request_id}")

    packages = query_analysis_dump()

    if packages:
        return cache(filter_excluded_plugin(packages), index_key)

    send_alert(f"({datetime.now()}) Actions Required! Back up method also "
               f"failed! Immediate fix is required to bring the API back!"
               f"Lambda function ARN: {context.invoked_function_arn}\n"
               f"CloudWatch log stream name: {context.log_stream_name}\n"
               f"CloudWatch log group name {context.log_group_name}\n"
               f"Lambda Request ID: {context.aws_request_id}")

    return get_cache(index_key)


def get_plugin(plugin: str, version: str = None) -> dict:
    """
    Get plugin metadata for a particular plugin, get latest if version is None.

    :param plugin: name of the plugin to get
    :param version: version of the plugin
    :return: plugin metadata dictionary
    """
    if version is None:
        # TODO when version is None, how do we get a cached file?
        url = f"https://pypi.org/pypi/{plugin}/json"
    else:
        if cache_available(f'cache/{plugin}/{version}.json', None):
            return get_cache(f'cache/{plugin}/{version}.json')
        url = f"https://pypi.org/pypi/{plugin}/{version}/json"
    try:
        response = requests.get(url)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        info = format_plugin(json.loads(response.text.strip()))
        if version is None:
            version = info['version']
        return cache(info, f'cache/{plugin}/{version}.json')
    except HTTPError:
        return {}


def cache_available(key: str, ttl: [timedelta, None]) -> bool:
    """
    Check if cache is available for the key.

    :param key: key to check in s3
    :param ttl: ttl for the cache, if None always consider the cache is valid
    :return: True iff cache exists and is considered fresh
    """
    if bucket is None:
        return False
    try:
        last_modified = s3.Object(bucket, key).last_modified
        if ttl is None:
            return True
        if last_modified is None or \
                datetime.now(timezone.utc) - last_modified > ttl:
            print(f"Updated Cache: {key}")
            return False
        else:
            return True
    except ClientError:
        print(f"Not cached: {key}")
        return False


def filter_excluded_plugin(packages: dict) -> dict:
    """
    Filter excluded plugins from the plugins list
    :param packages: all plugins list
    :return: only plugins not in the filtered list
    """
    filtered = packages.copy()
    exclusions = get_exclusion_list()
    for exclusion, versions in exclusions.items():
        if exclusion in packages and \
                (versions is None or packages[exclusion] in versions):
            filtered.pop(exclusion)
    return filtered


def get_exclusion_list() -> dict:
    """
    Get the exclusion plugin list.

    :return: excluded plugin list
    """
    if cache_available(exclusion_list, None):
        return get_cache(exclusion_list)
    else:
        return {}


def query_pypi() -> dict:
    """
    Query pypi to get all plugins.

    :return: all plugin names and latest version
    """
    packages = {}
    page = 1
    name_pattern = re.compile('class="package-snippet__name">(.+)</span>')
    version_pattern = re.compile(
        'class="package-snippet__version">(.+)</span>')
    url = requote_uri(f"https://pypi.org/search/?c=Framework :: napari&page=")

    while True:
        try:
            response = requests.get(f'{url}{page}')
            if response.status_code != requests.codes.ok:
                response.raise_for_status()
            html = response.text
            names = name_pattern.findall(html)
            versions = version_pattern.findall(html)
            assert (len(names) == len(versions))
            for name, version in zip(names, versions):
                packages[name] = version
            page += 1
        except HTTPError:
            break
    return packages


def send_alert(message: str):
    """
    Send alert to slack with a message.

    :param message: message to send alongside the alert
    """
    payload = {
        "text": message
    }
    if slack_url is None:
        print("Unable to send alert because slack URL is not set")
    else:
        try:
            requests.post(slack_url, json=payload)
        except HTTPError:
            print("Unable to send alert")


def query_analysis_dump() -> dict:
    """
    Query google bigquery for all plugins.

    :return: list of plugin name and version
    """
    client = bigquery.Client()
    results = client.query(
        """
            select name, max(version) as version from 
            `bigquery-public-data.pypi.distribution_metadata`  
            where "Framework :: napari" in UNNEST(classifiers) 
            group by name;
        """
    )

    return {row.name: row.version for row in results}


def get_cache(key: str) -> dict:
    """
    Get cache for a given key.

    :param key: key to the cache to get
    :return: file content for the key
    """
    return json.loads(s3.Object(bucket, key).get()['Body'].read())


def cache(content: [dict, list], key: str) -> dict:
    """
    Cache the given content to the key location.

    :param content: content to cache
    :param key: key path in s3
    :return: content that is cached
    """
    if bucket is None:
        send_alert(f"({datetime.now()}) Unable to find bucket for lambda "
                   f"configuration, skipping caching for napari hub."
                   f"Check terraform setup to add environment variable for "
                   f"napari hub lambda")
        return content
    with tempfile.NamedTemporaryFile(mode="w") as fp:
        fp.write(json.dumps(content))
        fp.flush()
        s3_client.upload_file(fp.name, bucket, key)
    return content
