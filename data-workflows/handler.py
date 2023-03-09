import json
import logging

from activity.handler import update_activity


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)


def handle(event, context):
    _setup_logging()

    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.loads(record.get('body')).get('type')

        if event_type == 'activity':
            update_activity()
