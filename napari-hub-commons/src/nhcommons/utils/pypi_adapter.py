import json
import re
from typing import Dict, List

import requests
from requests import HTTPError

from nhcommons.utils.parser import get_attribute
from github_adapter import get_repo_url


_NAME_PATTERN = re.compile('class="package-snippet__name">(.+)</span>')
_VERSION_PATTERN = re.compile('class="package-snippet__version">(.+)</span>')
_BASE_URL = 'https://pypi.org'
_SEARCH_URL = f'{_BASE_URL}/search/'
_PLUGIN_DATA_URL = '{base_url}/pypi/{plugin}/json'


def get_all_plugins() -> Dict[str, str]:
    """
    Query pypi to get all plugins.
    :returns: all plugin names and latest version
    """
    packages = {}
    page = 1
    params = {'o': '-created', 'c': 'Framework :: napari'}
    while True:
        try:
            params['page'] = page
            response = requests.get(_SEARCH_URL, params=params)
            if response.status_code != requests.codes.ok:
                response.raise_for_status()
            html = response.text
            names = _NAME_PATTERN.findall(html)
            versions = _VERSION_PATTERN.findall(html)
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
    # versioned url https://pypi.org/pypi/{plugin}/{version}/json
    # does not track history anymore.
    # see https://github.com/chanzuckerberg/napari-hub/issues/598
    url = _PLUGIN_DATA_URL.format(base_url=_BASE_URL, plugin=plugin)

    try:
        response = requests.get(url)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        info = PluginPypiMetaData.to_plugin_pypi_metadata(response)
        if version and info['version'] != version:
            print(
                f"Index Error: Skipping {plugin}:{version}, mismatching PyPI version {info['version']}"
            )
            return {}
        return info
    except HTTPError:
        return {}


class PluginPypiMetaData:

    @staticmethod
    def _filter_prefix(str_list: List[str], prefix: str) -> list:
        """
        Filter the list for strings with the given prefix.

        :param str_list: list of strings to filter
        :param prefix: prefix to filter on
        :return: list of filtered strings
        """
        return [string for string in str_list if string.startswith(prefix)]

    @staticmethod
    def to_plugin_pypi_metadata(response: requests.Response) -> dict:
        """
        Format the plugin metadata to extra relevant information.

        :param response: plugin response from pypi
        :return: formatted plugin dictionary
        """
        plugin = json.loads(response.text.strip())
        version = get_attribute(plugin, ["info", "version"])

        # parse raw author names string
        raw_name = get_attribute(plugin, ["info", "author"])
        # currently splitting by "&", ",", and the word "and"
        regexp = r'&|,|\sand\s'
        author_names = re.split(regexp, raw_name)
        author_names = [name.strip() for name in author_names if name is not None]
        authors = [{'name': name} for name in author_names if name]

        return {
            "name": get_attribute(plugin, ["info", "name"]),
            "summary": get_attribute(plugin, ["info", "summary"]),
            "description": get_attribute(plugin, ["info", "description"]),
            "description_content_type": f'{get_attribute(plugin, ["info", "description_content_type"])}',
            "authors": authors,
            "license": get_attribute(plugin, ["info", "license"]),
            "python_version": get_attribute(plugin, ["info", "requires_python"]),
            "operating_system": PluginPypiMetaData._filter_prefix(
                get_attribute(plugin, ["info", "classifiers"]),
                "Operating System"),
            "release_date": get_attribute(plugin, ["releases", version, 0,
                                                   "upload_time_iso_8601"]),
            "version": version,
            "first_released": min(
                get_attribute(release, [0, "upload_time_iso_8601"])
                for _, release in get_attribute(plugin, ["releases"]).items()
                if get_attribute(release, [0, "upload_time_iso_8601"])),
            "development_status": PluginPypiMetaData._filter_prefix(
                get_attribute(plugin, ["info", "classifiers"]),
                "Development Status"),

            # below are plugin details
            "requirements": get_attribute(plugin, ["info", "requires_dist"]),
            "project_site": get_attribute(plugin, ["info", "home_page"]),
            "documentation": get_attribute(plugin, ["info", "project_urls", "Documentation"]),
            "support": get_attribute(plugin, ["info", "project_urls", "User Support"]),
            "report_issues": get_attribute(plugin, ["info", "project_urls", "Bug Tracker"]),
            "twitter": get_attribute(plugin, ["info", "project_urls", "Twitter"]),
            "code_repository": get_repo_url(
                get_attribute(plugin, ["info", "project_urls"])
            )
        }
