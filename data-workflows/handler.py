import json
from install_activity import update_install_activity


def handle(event, context):
    for record in event.get('Records', []):
        if 'body' not in record:
            continue
        event_type = json.load(record.get('body')).get('type')

        if event_type == 'activity':
            update_install_activity()


if __name__ == '__main__':
    update_install_activity()
