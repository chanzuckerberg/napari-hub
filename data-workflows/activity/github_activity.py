import logging
from activity.model import GitHubActivityType, GitHubActivity, type_timestamp_format_by_type

LOGGER = logging.getLogger()


def update_github_activity(start_time: int, end_time: int):
    # call a method that handles logic for getting plugins with github metrics based on start and end time
    # and assign such a value to updated_plugins; for now, updated_plugins will be defined as None until
    # the method has been implemented
    updated_plugins = None
    LOGGER.info(f'Plugins with update count={len(updated_plugins)}')
    if len(updated_plugins) == 0:
        return
    _fetch_data_and_write_to_dynamo(updated_plugins, GitHubActivityType.LATEST)
    _fetch_data_and_write_to_dynamo(updated_plugins, GitHubActivityType.MONTH)
    _fetch_data_and_write_to_dynamo(updated_plugins, GitHubActivityType.TOTAL)
