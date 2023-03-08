import json
from activity.install_activity import update_activity


def handle(event, context):
    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.loads(record.get('body')).get('type')

        if event_type == 'activity':
            update_activity()


if __name__ == '__main__':
    update_activity()
