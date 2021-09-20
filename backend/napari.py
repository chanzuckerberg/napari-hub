import copy
import os
import os.path
import concurrent.futures
import re
from datetime import datetime, timedelta, timezone
import tempfile
from typing import List

import json
import yaml

from flask import Flask, jsonify
from markdown import markdown
from bs4 import BeautifulSoup

import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError
from requests.utils import requote_uri

import boto3
from botocore.exceptions import ClientError
from google.cloud import bigquery
from cffconvert.citation import Citation

# Environment variable set through lambda terraform infra config
bucket = os.environ.get('BUCKET')
bucket_path = os.environ.get('BUCKET_PATH', '')
slack_url = os.environ.get('SLACK_URL')
zulip_credentials = os.environ.get('ZULIP_CREDENTIALS', "")
github_client_id = os.environ.get('GITHUB_CLIENT_ID', None)
github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET', None)
cache_ttl = int(os.environ.get('TTL', "6"))
endpoint_url = os.environ.get('BOTO_ENDPOINT_URL', None)

plugins_key = 'cache/plugins.json'
index_key = 'cache/index.json'
exclusion_list = 'excluded_plugins.json'
index_subset = {'name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status'}

s3 = boto3.resource('s3', endpoint_url=endpoint_url)
s3_client = boto3.client("s3", endpoint_url=endpoint_url)
cache_ttl = timedelta(minutes=cache_ttl)
github_pattern = re.compile("https://github\\.com/([^/]+)/([^/]+)")

shield_schema = {
    "color": "#0074B8",
    "label": "napari hub",
    "logoSvg": "<svg width=\"512\" height=\"512\" viewBox=\"0 0 512 512\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"256.036\" cy=\"256\" r=\"85.3333\" fill=\"white\" stroke=\"white\" stroke-width=\"56.8889\"/><circle cx=\"256.036\" cy=\"42.6667\" r=\"42.6667\" fill=\"white\"/><circle cx=\"256.036\" cy=\"469.333\" r=\"42.6667\" fill=\"white\"/><path d=\"M256.036 28.4445L256.036 142.222\" stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M256.036 369.778L256.036 483.556\" stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"71.2838\" cy=\"149.333\" r=\"42.6667\" transform=\"rotate(-60 71.2838 149.333)\" fill=\"white\"/><circle cx=\"440.788\" cy=\"362.667\" r=\"42.6667\" transform=\"rotate(-60 440.788 362.667)\" fill=\"white\"/><path d=\"M58.967 142.222L157.501 199.111\" stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M354.57 312.889L453.105 369.778\" stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"71.2838\" cy=\"362.667\" r=\"42.6667\" transform=\"rotate(-120 71.2838 362.667)\" fill=\"white\"/><circle cx=\"440.788\" cy=\"149.333\" r=\"42.6667\" transform=\"rotate(-120 440.788 149.333)\" fill=\"white\"/><path d=\"M58.967 369.778L157.501 312.889\" stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M354.57 199.111L453.105 142.222\" stroke=\"white\" stroke-width=\"56.8889\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    "message": "",
    "schemaVersion": 1,
    "style": "flat-square"
}

app = Flask(__name__)


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


@app.route('/plugins/index')
def get_index() -> dict:
    """
    Get the index page related metadata for all plugins.

    :return: json for index page metadata
    """
    return jsonify(get_cache(index_key))


@app.route('/plugins/index/update')
def update_index() -> dict:
    """
    update the index page related metadata for all plugins.

    :return: json for index page metadata
    """
    results = []
    plugins = get_plugins()
    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as executor:
        futures = [executor.submit(filter_index, k, v)
                   for k, v in plugins.items()]
    for future in concurrent.futures.as_completed(futures):
        results.append(future.result())
    # read cache version of excluded_plugins.json
    excluded_plugins = get_exclusion_list()
    # include public and whitelisted plugins in updated_plugins
    updated_plugins = filter_excluded_plugin(plugins, excluded_plugins, {'hidden'})
    packages = plugins.copy()
    if packages:
        if zulip_credentials is not None and len(zulip_credentials.split(":")) == 2:
            notify_new_packages(plugins, updated_plugins)
        return cache(updated_plugins, plugins_key)
    send_alert(f"({datetime.now()})Actions Required! Failed to query pypi for "
               f"napari plugin packages, switching to backup analysis dump")
    packages = query_analysis_dump()
    if packages:
        return cache(filter_excluded_plugin(packages), index_key)
    send_alert(f"({datetime.now()}) Actions Required! Back up method also "
               f"failed! Immediate fix is required to bring the API back!")
    for key, value in excluded_plugins.items():
        if key in updated_plugins and updated_plugins[key] != "admin" and value != updated_plugins[key]:
            excluded_plugins[key] = updated_plugins[key]
    # write excluded_plugins.json to s3
    cache(excluded_plugins, exclusion_list)
    return jsonify(cache(results, index_key))


def get_file(download_url: str, file: str) -> [dict, None]:
    """
    Get file from github.

    :param download_url: github url to download from
    :param file: filename to get
    :return: file context for the file to download
    """
    api_url = download_url.replace("https://github.com/",
                                   "https://raw.githubusercontent.com/")
    try:
        url = f'{api_url}/HEAD/{file}'
        response = requests.get(url)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        return response.text
    except HTTPError:
        pass

    return None


def get_extra_metadata(download_url: str) -> dict:
    """
    Extract extra metadata from the github download url.

    :param download_url: github repo url to download from
    :return: extra metadata dictionary
    """
    extra_metadata = {}
    # public: fully visible (default)
    # disabled: no plugin page created, does not show up in search listings
    # hidden: plugin page exists, but doesn't show up in search listings
    visibility_set = {'public', 'disabled', 'hidden'}

    github_license = get_license(download_url)
    if github_license is not None:
        extra_metadata['license'] = github_license

    description = get_file(download_url, ".napari/DESCRIPTION.md")

    if description is not None:
        extra_metadata['description'] = description

    yaml_file = get_file(download_url, ".napari/config.yml")
    if yaml_file:
        config = yaml.safe_load(yaml_file)
        extra_metadata.update(config)

    citation_file = get_file(download_url, "CITATION.cff")
    if citation_file is not None:
        extra_metadata['citations'] = get_citations(citation_file)

    if 'visibility' not in extra_metadata:
        extra_metadata['visibility'] = 'public'
    elif extra_metadata['visibility'] not in visibility_set:
        extra_metadata['visibility'] = 'public'

    return extra_metadata


def get_citations(citation_str: str) -> dict:
    """
    Get citation information from the string.
    :param citation_str: citation string to parse
    :return: citation dictionary with parsed citation of different formats
    """
    citations = {}
    try:
        citation = Citation(cffstr=citation_str)
        citations['citation'] = citation_str
        citations['RIS'] = citation.as_ris()
        citations['BibTex'] = citation.as_bibtex()
    except ValueError:
        # invalid CITATION.cff content
        citations['citation'] = None
        citations['RIS'] = None
        citations['BibTex'] = None
    return citations


def get_license(url: str) -> [str, None]:
    try:
        api_url = url.replace("https://github.com/",
                              "https://api.github.com/repos/")
        auth = None
        if github_client_id is not None and github_client_secret is not None:
            auth = HTTPBasicAuth(github_client_id, github_client_secret)
        response = requests.get(f'{api_url}/license', auth=auth)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        spdx_id = get_attribute(json.loads(response.text.strip()), ['license', "spdx_id"])
        if spdx_id == "NOASSERTION":
            return None
        else:
            return spdx_id
    except HTTPError:
        return None


def get_download_url(plugin: dict) -> [str, None]:
    """
    Get download url for github.

    :param plugin: plugin metadata dictionary
    :return: download url if one is available, else None
    """
    project_urls = get_attribute(plugin, ["info", "project_urls"])
    if project_urls:
        source_code_url = get_attribute(project_urls, ["Source Code"])
        if source_code_url:
            return source_code_url
        elif isinstance(project_urls, dict):
            for key, url in project_urls.items():
                if url.startswith("https://github.com"):
                    match = github_pattern.match(url)
                    if match:
                        return github_pattern.match(url).group(0)
    return None


def render_description(description: str) -> str:
    if description != '':
        html = markdown(description)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

    return ''


def format_plugin(plugin: dict) -> dict:
    """
    Format the plugin dictionary to extra relevant information.

    :param plugin: plugin dictionary from pypi
    :return: formatted plugin dictionary
    """
    version = get_attribute(plugin, ["info", "version"])

    download_url = get_download_url(plugin)

    extra_metadata = {}
    project_urls = {}
    if download_url:
        extra_metadata = get_extra_metadata(download_url)
        project_urls = extra_metadata.get('project_urls', {})

    description = extra_metadata.get('description', f'{get_attribute(plugin, ["info", "description"])}')
    extra_metadata['description_text'] = render_description(description)

    return {
        "name": get_attribute(plugin, ["info", "name"]),
        "summary": extra_metadata.get('summary', get_attribute(plugin, ["info", "summary"])),
        "description": description,
        "description_text": extra_metadata.get('description_text', ''),
        "description_content_type": f'{get_attribute(plugin, ["info", "description_content_type"])}',
        "authors": extra_metadata.get('authors', [{'name': get_attribute(plugin, ["info", "author"]),
                                                   'email': get_attribute(plugin, ["info", "author_email"])}]),
        "license": extra_metadata.get('license', get_attribute(plugin, ["info", "license"])),
        "citations": extra_metadata.get('citations'),
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
            plugin, ["info", "home_page"])),
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


@app.route('/plugins')
def get_plugins() -> dict:
    """
    Get the list of plugins if cache is available.

    :param context: context for the run to raise alerts
    :return: json of valid plugins and their visibility
    """
    if cache_available(plugins_key, None):
        return get_cache(plugins_key)
    else:
        return {}


@app.route('/plugins/<plugin>', defaults={'version': None})
@app.route('/plugins/<plugin>/versions/<version>')
def get_plugin(plugin: str, version: str = None) -> dict:
    """
    Get plugin metadata for a particular plugin, get latest if version is None.

    :param plugin: name of the plugin to get
    :param version: version of the plugin
    :return: plugin metadata dictionary
    """
    plugins = get_plugins()
    if plugin not in plugins:
        return {}
    elif version is None:
        version = plugins[plugin]

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


@app.route('/shields/<plugin>')
def get_shield(plugin: str):
    plugins = get_plugins()
    plugin_shield_schema = copy.deepcopy(shield_schema)
    if plugin not in plugins:
        plugin_shield_schema['message'] = 'plugin not found'
    else:
        plugin_shield_schema['message'] = plugin
    return plugin_shield_schema


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
        last_modified = s3.Object(bucket, os.path.join(bucket_path, key)).last_modified
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


def filter_excluded_plugin(packages: dict, excluded_plugins: dict, whitelisted_keyword: set = {}) -> dict:
    """
    Filter excluded plugins from the plugins list
    :param packages: all plugins list
    :param excluded_plugins: excluded plugin list
    :param whitelisted_keyword: keyword reflects plugins to include
    :return: only plugins not in the filtered list
    """
    valid_plugins = packages.copy()
    for key, value in excluded_plugins.items():
        if key in packages and value not in whitelisted_keyword:
            del valid_plugins[key]
    return valid_plugins


@app.route('/plugins/excluded')
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
    url = requote_uri(f"https://pypi.org/search/?q=&o=-created&c=Framework :: napari&page=")
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


def notify_new_packages(existing_packages: dict, new_packages: dict):
    """
    Notify zulip about new packages.

    :param existing_packages: existing packages in cache
    :param new_packages: new packages found
    """
    username = zulip_credentials.split(":")[0]
    key = zulip_credentials.split(":")[1]
    for package, version in new_packages.items():
        if package not in existing_packages:
            send_zulip_message(username, key, package,
                               f'A new plugin has been published on the napari hub! Check out [{package}](https://napari-hub.org/plugins/{package})!')
        elif existing_packages[package] != version:
            send_zulip_message(username, key, package,
                               f'A new version of [{package}](https://napari-hub.org/plugins/{package}) is available on the napari hub! Check out [{version}](https://napari-hub.org/plugins/{package})!')

    for package, version in existing_packages.items():
        if package not in new_packages:
            send_zulip_message(username, key, package,
                               f'This plugin is no longer available on the [napari hub](https://napari-hub.org) :(')


def send_zulip_message(username: str, key: str, topic: str, message: str):
    """
    Send message to zulip
    :param username: username for the user to post message
    :param key: api key for the user
    :param topic: topic in zulip stream to send
    :param message: message to send
    """
    try:
        data = {
            'type': 'stream',
            'to': 'hub-updates',
            'topic': topic,
            'content': message
        }
        response = requests.post('https://napari.zulipchat.com/api/v1/messages',
                                 auth=HTTPBasicAuth(username, key), data=data)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
    except HTTPError:
        pass


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
    return json.loads(s3.Object(bucket, os.path.join(bucket_path, key)).get()['Body'].read())


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
        s3_client.upload_file(fp.name, bucket, os.path.join(bucket_path, key))
    return content
