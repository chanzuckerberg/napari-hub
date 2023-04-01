import json
import logging

import activity.processor
from utils.utils import ParameterStoreAdapter
import utils.utils


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)


def _update_activity() -> None:
    # note: temporarily commenting these lines of code out for testing purposes only; these changes will be reverted
    #parameter_store_adapter = ParameterStoreAdapter()
    #last_updated_timestamp = parameter_store_adapter.get_last_updated_timestamp()
    current_timestamp = utils.utils.get_current_timestamp()
    last_updated_timestamp = 1646092800000
    #activity.processor.update_install_activity(last_updated_timestamp, current_timestamp)
    activity.processor.update_github_activity(last_updated_timestamp, current_timestamp)
    #parameter_store_adapter.set_last_updated_timestamp(current_timestamp)


def handle(event, context):
    _setup_logging()

    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.loads(record.get('body')).get('type')

        if event_type == 'activity':
            _update_activity()


if __name__ == '__main__':
    handle({'Records': [{'body': '{"type":"activity"}'}]}, None)
