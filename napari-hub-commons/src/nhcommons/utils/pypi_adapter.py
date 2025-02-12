import logging
import re
from typing import Any, Dict, List, Optional

import requests
from requests import HTTPError

from .github_adapter import get_repo_url
from .request_adapter import get_request

_NAME_PATTERN = re.compile('class="package-snippet__name">(.+)</span>')
_VERSION_PATTERN = re.compile('class="package-snippet__version">(.+)</span>')
_BASE_URL = "https://pypi.org"
_PLUGIN_DATA_URL = "/pypi/{plugin}/json"
_NPE2API_URL = "https://api.napari.org/api"

logger = logging.getLogger(__name__)


def get_all_plugins() -> Dict[str, str]:
    """
    Query npe2api to get all plugins.

    Now we use the npe2api to get the list of plugins, which uses the public BigQuery pypi metadata
    as a source of truth.

    The previous implementation was broken by anti-scraping changes to PyPI.
    :returns: all plugin names and latest version
    """
    logger.info("Getting all napari plugins from npe2api")
    packages = get_request(_NPE2API_URL + "/plugins").json()
    logger.info(f"Total number of napari plugins fetched={len(packages)}")
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


def _get_pypi_response(
    path: str, params: Optional[Dict[str, Any]] = None
) -> requests.Response:
    url = _BASE_URL + path
    return get_request(url, params=params)


def _filter_prefix(str_list: List[str], prefix: str) -> List:
    """
    Filter the list for strings with the given prefix.

    :param str_list: list of strings to filter
    :param prefix: prefix to filter on
    :return: list of filtered strings
    """
    return [string for string in str_list if string.startswith(prefix)]


def _get_authors(raw_name: str) -> List[Dict[str, str]]:
    """
    Splits given string by "&", ",", and the word "and" to get list of authors
    :param raw_name: author name string
    :return: List of authors
    """
    regexp = r"&|,|\sand\s"
    author_names = re.split(regexp, raw_name)
    author_names = [name.strip() for name in author_names if name is not None]
    return [{"name": name} for name in author_names if name]


def _get_release_date(release: List[Dict[str, Any]]) -> str:
    if len(release) == 0:
        return ""
    release_date = release[0].get("upload_time_iso_8601")
    return release_date or ""


def _get_default_if_none(json_obj: Dict, key: str, default: Any = "") -> Any:
    value = json_obj.get(key)
    return value if value else default


def _to_plugin_pypi_metadata(plugin: Dict, version: str) -> Dict[str, Any]:
    """
    Format the plugin metadata to extra relevant information.

    :param plugin: plugin response json from pypi
    :param version: expected version from plugin
    :return: formatted plugin dictionary
    """
    info = _get_default_if_none(plugin, "info", {})
    releases = _get_default_if_none(plugin, "releases", {})

    if version != info.get("version"):
        logger.error(
            f"Index Error: Skipping {plugin}:{version}, "
            f"mismatching PyPI version {info.get('version')}"
        )
        return {}

    authors = _get_authors(_get_default_if_none(info, "author"))
    project_urls = _get_default_if_none(info, "project_urls", {})
    classifiers = _get_default_if_none(info, "classifiers", [])

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
            for _, release in releases.items()
            if _get_release_date(release)
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
