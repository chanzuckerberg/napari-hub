import json
import logging

import activity.processor


LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


def handle(event, context) -> None:

    for record in event.get('Records', []):
        body = record.get('body')
        if not body:
            continue

        body = record.get('body')
        LOGGER.info(f'Received message with body: {body}')
        event_type = json.loads(body).get('type', '').lower()

        # TODO: Create a dict for event_type by method to be called
        if event_type == 'activity':
            activity.processor.update_activity()
            LOGGER.info(f'Update successful for type={event_type}')
