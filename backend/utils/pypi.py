import json
import re
from typing import Dict

import requests
from requests import HTTPError
from requests.utils import requote_uri

from utils.github import get_github_repo_url
from utils.utils import get_attribute, filter_prefix


def query_pypi() -> Dict[str, str]:
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
            if len(names) != len(versions):
                return {}
            for name, version in zip(names, versions):
                packages[name] = version
            page += 1
        except HTTPError:
            break
    return packages


def get_plugin_pypi_metadata(plugin: str, version: str) -> dict:
    """
    Get plugin metadata through pypi API.

    :param plugin: name of the plugin
    :param version: version of the plugin
    :return: metadata dict for the plugin, empty if not found
    """
    # versioned url https://pypi.org/pypi/{plugin}/{version}/json does not track history anymore.
    # see https://github.com/chanzuckerberg/napari-hub/issues/598
    url = f"https://pypi.org/pypi/{plugin}/json"

    try:
        response = requests.get(url)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        info = format_plugin(json.loads(response.text.strip()))
        if version and info['version'] != version:
            print(f"Index Error: Skipping {plugin}:{version}, mismatching PyPI version {info['version']}")
            return {}
        return info
    except HTTPError:
        return {}


def format_plugin(plugin: dict) -> dict:
    """
    Format the plugin metadata to extra relevant information.

    :param plugin: plugin dictionary from pypi
    :return: formatted plugin dictionary
    """
    version = get_attribute(plugin, ["info", "version"], "version")

    # parse raw author names string 
    raw_name = get_attribute(plugin, ["info", "author"], "authors")
    # currently splitting by "&", ",", and the word "and"
    regexp = r'&|,|\sand\s'
    author_names = re.split(regexp, raw_name)
    author_names = [name.strip() for name in author_names if name is not None]
    authors = [{'name': name} for name in author_names if name]

    return {
        "name": get_attribute(plugin, ["info", "name"], "name"),
        "summary": get_attribute(plugin, ["info", "summary"], "summary"),
        "description": get_attribute(plugin, ["info", "description"], "description"),
        "description_content_type":
            f'{get_attribute(plugin, ["info", "description_content_type"], "description_content_type")}',
        "authors": authors,
        "license": get_attribute(plugin, ["info", "license"], "license"),
        "python_version": get_attribute(plugin, ["info", "requires_python"], "python_version"),
        "operating_system": filter_prefix(
            get_attribute(plugin, ["info", "classifiers"], "operating_system"),
            "Operating System"),
        "release_date": get_attribute(plugin, ["releases", version, 0,
                                               "upload_time_iso_8601"], "release_date"),
        "version": version,
        "first_released": min(
            get_attribute(release, [0, "upload_time_iso_8601"], "first_released")
            for _, release in get_attribute(plugin, ["releases"], "first_released").items()
            if get_attribute(release, [0, "upload_time_iso_8601"], "first_released")),
        "development_status": filter_prefix(
            get_attribute(plugin, ["info", "classifiers"], "development_status"),
            "Development Status"),

        # below are plugin details
        "requirements": get_attribute(plugin, ["info", "requires_dist"], "requirements"),
        "project_site": get_attribute(plugin, ["info", "home_page"], "project_site"),
        "documentation": get_attribute(plugin, ["info", "project_urls", "Documentation"], "documentation"),
        "support": get_attribute(plugin, ["info", "project_urls", "User Support"], "support"),
        "report_issues": get_attribute(plugin, ["info", "project_urls", "Bug Tracker"], "report_issues"),
        "twitter": get_attribute(plugin, ["info", "project_urls", "Twitter"], "twitter"),
        "code_repository": get_github_repo_url(get_attribute(plugin, ["info", "project_urls"], "code_repository"))
    }
