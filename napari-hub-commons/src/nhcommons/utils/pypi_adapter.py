import logging
import re
import time
from typing import Dict, List, Any

import requests
from requests import HTTPError

from .custom_parser import get_attribute
from .github_adapter import get_repo_url

_NAME_PATTERN = re.compile('class="package-snippet__name">(.+)</span>')
_VERSION_PATTERN = re.compile('class="package-snippet__version">(.+)</span>')
_BASE_URL = 'https://pypi.org'
_SEARCH_URL = f'/search/'
_PLUGIN_DATA_URL = '/pypi/{plugin}/json'

_LOGGER = logging.getLogger()


def _get_pypi_response(path: str, params: Dict[str, Any] = None):
    url = _BASE_URL + path
    start_time = time.perf_counter()
    try:
        response = requests.get(url, params=params)
        if response.status_code != requests.codes.ok:
            _LOGGER.error(f"Error calling {url} "
                          f"response.status_code={response.status_code}")
            response.raise_for_status()
        return response
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        _LOGGER.info(f"PYPI call url={url} params={params} "
                     f"time_taken={duration}")


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
            response = _get_pypi_response(_SEARCH_URL, params=params)
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


def get_plugin_pypi_metadata(plugin: str, version: str) -> Dict[str, Any]:
    """
    Get plugin metadata through pypi API.

    :param plugin: name of the plugin
    :param version: version of the plugin
    :return: metadata dict for the plugin, empty if not found
    """
    # versioned url https://pypi.org/pypi/{plugin}/{version}/json
    # does not track history anymore.
    # see https://github.com/chanzuckerberg/napari-hub/issues/598

    try:
        response = _get_pypi_response(_PLUGIN_DATA_URL.format(plugin=plugin))
        return _to_plugin_pypi_metadata(response.json(), version)
    except HTTPError:
        return {}


def _filter_prefix(str_list: List[str], prefix: str) -> list:
    """
    Filter the list for strings with the given prefix.

    :param str_list: list of strings to filter
    :param prefix: prefix to filter on
    :return: list of filtered strings
    """
    return [string for string in str_list if string.startswith(prefix)]


def _to_plugin_pypi_metadata(plugin: Dict, version: str) -> Dict:
    """
    Format the plugin metadata to extra relevant information.

    :param plugin: plugin response json from pypi
    :param version: expected version from plugin
    :return: formatted plugin dictionary
    """
    info = get_attribute(plugin, ["info"])

    if version != get_attribute(info, ["version"]):
        _LOGGER.error(
            f"Index Error: Skipping {plugin}:{version}, "
            f"mismatching PyPI version {info.get('version')}"
        )
        return {}

    # parse raw author names string
    raw_name = get_attribute(info, ["author"])
    # currently splitting by "&", ",", and the word "and"
    regexp = r'&|,|\sand\s'
    author_names = re.split(regexp, raw_name)
    author_names = [name.strip() for name in author_names if
                    name is not None]
    authors = [{'name': name} for name in author_names if name]

    project_urls = get_attribute(info, ["project_urls"])

    return {
        "name": get_attribute(info, ["name"]),
        "summary": get_attribute(info, ["summary"]),
        "description": get_attribute(info, ["description"]),
        "description_content_type": f'{get_attribute(info, ["description_content_type"])}',
        "authors": authors,
        "license": get_attribute(info, ["license"]),
        "python_version": get_attribute(info, ["requires_python"]),
        "operating_system": _filter_prefix(
            get_attribute(info, ["classifiers"]), "Operating System"
        ),
        "release_date": get_attribute(plugin, ["releases", version, 0,
                                               "upload_time_iso_8601"]),
        "version": version,
        "first_released": min(
            get_attribute(release, [0, "upload_time_iso_8601"])
            for _, release in get_attribute(plugin, ["releases"]).items()
            if get_attribute(release, [0, "upload_time_iso_8601"])
        ),
        "development_status": _filter_prefix(
            get_attribute(info, ["classifiers"]), "Development Status"
        ),

        # below are plugin details
        "requirements": get_attribute(info, ["requires_dist"]),
        "project_site": get_attribute(info, ["home_page"]),
        "documentation": get_attribute(project_urls, ["Documentation"]),
        "support": get_attribute(project_urls, ["User Support"]),
        "report_issues": get_attribute(project_urls, ["Bug Tracker"]),
        "twitter": get_attribute(project_urls, ["Twitter"]),
        "code_repository": get_repo_url(project_urls)
    }
