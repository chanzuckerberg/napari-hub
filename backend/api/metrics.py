from typing import Dict, Any, Optional

from api.models import github_activity, plugin
from nhcommons.models import install_activity


def get_metrics_for_plugin(name: str, limit: str) -> Dict[str, Any]:
    """
    Fetches plugin metrics from dynamo
    :return Dict[str, Any]: A dict with entries for usage and maintenance
    :params str name: Plugin name for which metrics needs to be fetched.
    :params str limit_str: Number of timeline records to be fetched. Defaults to 0
    for invalid number.
    """
    repo = _get_repo_from_plugin(name)
    name = name.lower()
    month_delta = 0

    if limit.isdigit():
        month_delta = max(int(limit), 0)

    return {
        "usage": _get_usage_data(name, month_delta),
        "maintenance": _get_maintenance_data(name, repo, month_delta),
    }


def _get_repo_from_plugin(name: str) -> Optional[str]:
    plugin_metadata = plugin.get_plugin(name)
    if plugin_metadata:
        repo_url = plugin_metadata.get("code_repository")
        if repo_url:
            return repo_url.replace("https://github.com/", "")
    return None


def _get_usage_data(name: str, limit: int) -> Dict[str, Any]:
    """
    Fetches plugin usage_data from dynamo.
    :returns Dict[str, Any]: A dict with entries for timeline and stats.
    :params str name: Name of the plugin in lowercase.
    :params int limit: The number of records to be fetched for timeline.
    """
    return {
        "timeline": install_activity.get_timeline(name, limit) if limit else [],
        "stats": {
            "total_installs": install_activity.get_total_installs(name),
            "installs_in_last_30_days": install_activity.get_recent_installs(name, 30),
        },
    }


def _get_maintenance_data(name: str, repo: Optional[str], limit: int) -> Dict[str, Any]:
    """
    Fetches plugin maintenance_data from dynamo.
    :returns Dict[str, Any]: A dict with entries for timeline and stats.
    :params str name: Name of the plugin in lowercase.
    :params repo: Name of the repo associated to the plugin.
    :params int limit: The number of records to be fetched for timeline.
    """
    return {
        "timeline": github_activity.get_timeline(name, repo, limit) if limit else [],
        "stats": {
            "total_commits": github_activity.get_total_commits(name, repo),
            "latest_commit_timestamp": github_activity.get_latest_commit(name, repo),
        },
    }
