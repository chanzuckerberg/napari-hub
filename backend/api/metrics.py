from typing import Dict, Any

from api.models.plugin import get_plugin
from api.models import install_activity, github_activity


def get_metrics_for_plugin(plugin: str, limit: str,) -> Dict[str, Any]:
    """
    Fetches plugin metrics from s3 or dynamo based on the in_test variable
    :return dict[str, Any]: A map with entries for usage and maintenance

    :params str plugin: Name of the plugin for which usage data needs to be fetched.
    :params str limit_str: Number of records to be fetched for timeline. Defaults to 0
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
    Fetches plugin usage_data from s3 or dynamo based on the in_test variable
    :returns (dict[str, Any]): A dict with the structure
    {'timeline': List, 'stats': dict[str, int]}
    :params str plugin: Name of the plugin in lowercase.
    :params int limit: Sets the number of records to be fetched for timeline.
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
    Fetches plugin maintenance_data from s3 or dynamo based on the in_test variable
    :returns (dict[str, Any]): A dict with the structure {'timeline': List, 'stats': Dict[str, int]}
    :params str plugin: Name of the plugin in lowercase.
    :params repo: Parameter used if use_dynamo_for_maintenance is true
    :params int limit: Sets the number of records to be fetched for timeline.
    """
    return {
        "timeline": github_activity.get_timeline(plugin, repo, limit) if limit else [],
        "stats": {
            "total_commits": github_activity.get_total_commits(plugin, repo),
            "latest_commit_timestamp": github_activity.get_latest_commit(plugin, repo),
        },
    }
