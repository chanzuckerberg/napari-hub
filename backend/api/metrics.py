import logging
from typing import Dict, Any

from api.models.plugin import get_plugin
from api.models import install_activity, github_activity

logger = logging.getLogger(__name__)


def get_metrics_for_plugin(plugin: str, limit: str) -> Dict[str, Any]:
    """
    Fetches plugin metrics from dynamo
    :return Dict[str, Any]: A dict with entries for usage and maintenance
    :params str plugin: Plugin name for which metrics needs to be fetched.
    :params str limit_str: Number of timeline records to be fetched. Defaults to 0
    for invalid number.
    """
    repo = _get_repo_from_plugin(plugin)
    plugin = plugin.lower()
    month_delta = 0

    if limit.isdigit() and limit != "0":
        month_delta = max(int(limit), 0)

    return {
        "usage": _get_usage_data(plugin, month_delta),
        "maintenance": _get_maintenance_data(plugin, repo, month_delta),
    }


def _get_repo_from_plugin(plugin):
    plugin_metadata = get_plugin(plugin)
    if plugin_metadata:
        repo_url = plugin_metadata.get("code_repository")
        if repo_url:
            return repo_url.replace("https://github.com/", "")
    return None


def _get_usage_data(plugin: str, limit: int) -> Dict[str, Any]:
    """
    Fetches plugin usage_data from dynamo.
    :returns Dict[str, Any]: A dict with entries for timeline and stats.
    :params str plugin: Name of the plugin in lowercase.
    :params int limit: The number of records to be fetched for timeline.
    """
    return {
        "timeline": install_activity.get_timeline(plugin, limit) if limit else [],
        "stats": {
            "total_installs": install_activity.get_total_installs(plugin),
            "installs_in_last_30_days": install_activity.get_recent_installs(plugin, 30)
        },
    }


def _get_maintenance_data(plugin: str, repo: Any, limit: int) -> Dict[str, Any]:
    """
    Fetches plugin maintenance_data from dynamo.
    :returns Dict[str, Any]: A dict with entries for timeline and stats.
    :params str plugin: Name of the plugin in lowercase.
    :params repo: Name of the repo associated to the plugin.
    :params int limit: The number of records to be fetched for timeline.
    """
    return {
        "timeline": github_activity.get_timeline(plugin, repo, limit) if limit else [],
        "stats": {
            "total_commits": github_activity.get_total_commits(plugin, repo),
            "latest_commit_timestamp": github_activity.get_latest_commit(plugin, repo),
        },
    }
