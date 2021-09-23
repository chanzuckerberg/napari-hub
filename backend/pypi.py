import json
import re

import requests
from requests import HTTPError
from requests.utils import requote_uri

from github import get_github_repo_url
from utils import get_attribute, filter_prefix


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


def get_plugin_pypi_metadata(plugin: str, version: str) -> dict:
    url = f"https://pypi.org/pypi/{plugin}/{version}/json"
    try:
        response = requests.get(url)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        info = format_plugin(json.loads(response.text.strip()))
        return info
    except HTTPError:
        return {}


def format_plugin(plugin: dict) -> dict:
    """
    Format the plugin metadata to extra relevant information.

    :param plugin: plugin dictionary from pypi
    :return: formatted plugin dictionary
    """
    version = get_attribute(plugin, ["info", "version"])

    return {
        "name": get_attribute(plugin, ["info", "name"]),
        "summary": get_attribute(plugin, ["info", "summary"]),
        "description": get_attribute(plugin, ["info", "description"]),
        "description_content_type": f'{get_attribute(plugin, ["info", "description_content_type"])}',
        "authors": [{'name': get_attribute(plugin, ["info", "author"]),
                     'email': get_attribute(plugin, ["info", "author_email"])}],
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
        "project_site": get_attribute(plugin, ["info", "home_page"]),
        "documentation": get_attribute(plugin, ["info", "project_urls", "Documentation"]),
        "support": get_attribute(plugin, ["info", "project_urls", "User Support"]),
        "report_issues": get_attribute(plugin, ["info", "project_urls", "Bug Tracker"]),
        "twitter": get_attribute(plugin, ["info", "project_urls", "Twitter"]),
        "code_repository": get_github_repo_url(get_attribute(plugin, ["info", "project_urls"]))
    }
