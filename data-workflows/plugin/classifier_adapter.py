import logging
from functools import cache

from nhcommons.utils.adapter_helpers import GithubClientHelper


REPOSITORY = "https://github.com/napari/npe2api"
FILE_NAME = "public/classifiers.json"
LOGGER = logging.getLogger(__name__)


@cache
def _get_recent_query_data() -> dict:
    github_client_helper = GithubClientHelper(REPOSITORY)
    data = github_client_helper.get_file(FILE_NAME, "json")
    if not data:
        raise RuntimeError(f"Unable to fetch {FILE_NAME} from {REPOSITORY}")
    return data


def is_plugin_live(name: str, version: str) -> bool:
    try:
        recent_query_update = _get_recent_query_data()
        active_versions = set(recent_query_update.get("active", {}).get(name, []))
        return version in active_versions
    except RuntimeError:
        LOGGER.warning(f"Returning {name} {version} is live due to RuntimeError")
        return True
