import json
import logging

import activity.processor
from utils.utils import ParameterStoreAdapter
import utils.utils


def _fetch_and_update_timestamps():
    parameter_store_adapter = ParameterStoreAdapter()
    last_updated_timestamp = parameter_store_adapter.get_last_updated_timestamp()
    current_timestamp = utils.utils.get_current_timestamp()
    parameter_store_adapter.set_last_updated_timestamp(current_timestamp)
    return last_updated_timestamp, current_timestamp


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)


def _update_install_activity() -> None:
    last_updated_timestamp, current_timestamp = _fetch_and_update_timestamps()
    activity.processor.update_install_activity(last_updated_timestamp, current_timestamp)


def _update_github_activity() -> None:
    last_updated_timestamp, current_timestamp = _fetch_and_update_timestamps()
    activity.processor.update_github_activity(last_updated_timestamp, current_timestamp)


def handle(event, context):
    _setup_logging()

    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.loads(record.get('body')).get('type')

        if event_type == 'install_activity':
            _update_install_activity()
        elif event_type == 'github_activity':
            _update_github_activity()
