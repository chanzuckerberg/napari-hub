import logging
import re
import time
from typing import Any, Optional

import requests
from requests import HTTPError

from .github_adapter import get_repo_url

_NAME_PATTERN = re.compile('class="package-snippet__name">(.+)</span>')
_VERSION_PATTERN = re.compile('class="package-snippet__version">(.+)</span>')
_BASE_URL = 'https://pypi.org'
_SEARCH_URL = f'/search/'
_PLUGIN_DATA_URL = '/pypi/{plugin}/json'

logger = logging.getLogger(__name__)


def _get_pypi_response(path: str, params: Optional[dict[str, Any]] = None) \
        -> requests.Response:
    url = _BASE_URL + path
    start_time = time.perf_counter()
    try:
        response = requests.get(url, params=params)
        if response.status_code != requests.codes.ok:
            logger.error(f"Error calling {url} params={params}"
                         f"response.status_code={response.status_code}")
            response.raise_for_status()
        return response
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        logger.info(f"PYPI call url={url} params={params} "
                    f"time_taken={duration} ms")


def get_all_plugins() -> dict[str, str]:
    """
    Query pypi to get all plugins.
    :returns: all plugin names and latest version
    """
    logger.info("Getting all napari plugins from PYPI")
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
    logger.info(f"Total number of napari plugins fetched={len(packages)}")
    return packages


def get_plugin_pypi_metadata(plugin: str, version: str) -> dict[str, Any]:
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


def _filter_prefix(str_list: list[str], prefix: str) -> list:
    """
    Filter the list for strings with the given prefix.

    :param str_list: list of strings to filter
    :param prefix: prefix to filter on
    :return: list of filtered strings
    """
    return [string for string in str_list if string.startswith(prefix)]


def _get_authors(raw_name: str) -> list[dict[str, str]]:
    """
    Splits given string by "&", ",", and the word "and" to get list of authors
    :param raw_name: author name string
    :return: List of authors
    """
    regexp = r'&|,|\sand\s'
    author_names = re.split(regexp, raw_name)
    author_names = [name.strip() for name in author_names if
                    name is not None]
    return [{'name': name} for name in author_names if name]


def _get_release_date(release: list[dict[str, Any]]) -> str:
    if len(release) == 0:
        return ''
    release_date = release[0].get("upload_time_iso_8601")
    return release_date or ""


def _to_plugin_pypi_metadata(plugin: dict, version: str) -> dict[str, Any]:
    """
    Format the plugin metadata to extra relevant information.

    :param plugin: plugin response json from pypi
    :param version: expected version from plugin
    :return: formatted plugin dictionary
    """
    info = plugin.get("info", {})
    releases = plugin.get("releases", {})

    if version != info.get("version"):
        logger.error(
            f"Index Error: Skipping {plugin}:{version}, "
            f"mismatching PyPI version {info.get('version')}"
        )
        return {}

    authors = _get_authors(info.get("author", ""))
    project_urls = info.get("project_urls", {})
    classifiers = info.get("classifiers", [])

    return {
        "name": info.get("name", ""),
        "summary": info.get("summary", ""),
        "description": info.get("description", ""),
        "description_content_type": info.get("description_content_type", ""),
        "authors": authors,
        "license": info.get("license", ""),
        "python_version": info.get("requires_python", ""),
        "operating_system": _filter_prefix(classifiers, "Operating System"),
        "release_date": _get_release_date(releases.get(version, [])),
        "version": version,
        "first_released": min(
            release[0]["upload_time_iso_8601"]
            for _, release in releases.items() if _get_release_date(release)
        ),
        "development_status": _filter_prefix(classifiers, "Development Status"),

        # below are plugin details
        "requirements": info.get("requires_dist", []),
        "project_site": info.get("home_page", ""),
        "documentation": project_urls.get("Documentation", ""),
        "support": project_urls.get("User Support", ""),
        "report_issues": project_urls.get("Bug Tracker", ""),
        "twitter": project_urls.get("Twitter", ""),
        "code_repository": get_repo_url(project_urls),
    }
