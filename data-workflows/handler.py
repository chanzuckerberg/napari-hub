import json
import logging

import activity.processor
import utils.utils as utils


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)


def _update_activity() -> None:
    last_updated_timestamp = utils.get_last_updated_timestamp()
    current_timestamp = utils.get_current_timestamp()
    activity.processor.update_install_activity(last_updated_timestamp, current_timestamp)
    utils.set_last_updated_timestamp(current_timestamp)


def handle(event, context):
    _setup_logging()

    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.loads(record.get('body')).get('type')

        if event_type == 'activity':
            _update_activity()
