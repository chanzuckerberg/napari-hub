import json
import logging

from activity.handler import update_activity


def handle(event, context):
    logging.basicConfig(format='%(asctime)s %(name)s %(levelname)s %(module)s %(message)s', level=logging.INFO)

    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.loads(record.get('body')).get('type')

        if event_type == 'activity':
            update_activity()
