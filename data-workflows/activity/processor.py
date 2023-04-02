import logging
from datetime import datetime

from activity.install_activity_model import InstallActivityType
import activity.install_activity_model as install_model
from activity.github_activity_model import GitHubActivityType
import activity.github_activity_model as github_model
import activity.snowflake_adapter as snowflake_adapter

LOGGER = logging.getLogger()


def _fetch_data_and_write_to_dynamo(data: dict[str, datetime], activity_type: any):
    #plugin_install_data = snowflake_adapter.get_plugins_install_count_since_timestamp(data, install_activity_type)
    plugin_commit_data = snowflake_adapter.get_plugins_commit_count_since_timestamp(data, activity_type)
    #install_model.transform_and_write_to_dynamo(plugin_install_data, install_activity_type)
    github_model.transform_and_write_to_dynamo(plugin_commit_data, activity_type)


def update_install_activity(start_time: int, end_time: int):
    updated_plugins = snowflake_adapter.get_plugins_with_installs_in_window(start_time, end_time)
    LOGGER.info(f'Plugins with new install activity count={len(updated_plugins)}')
    if len(updated_plugins) == 0:
        return
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.DAY)
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.MONTH)
    _fetch_data_and_write_to_dynamo(updated_plugins, InstallActivityType.TOTAL)


def update_github_activity(start_time: int, end_time: int):
    updated_plugins = snowflake_adapter.get_plugins_with_commits_in_window(start_time, end_time)
    LOGGER.info(f'Plugins with new github activity count={len(updated_plugins)}')
    if len(updated_plugins) == 0:
        return
    #_fetch_data_and_write_to_dynamo(updated_plugins, GitHubActivityType.LATEST)
    #_fetch_data_and_write_to_dynamo(updated_plugins, GitHubActivityType.MONTH)
    _fetch_data_and_write_to_dynamo(updated_plugins, GitHubActivityType.TOTAL)
