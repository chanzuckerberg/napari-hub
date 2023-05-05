import categories
import json
import logging

from activity.update_activity import update_activity

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


def handle(event, context):
    for record in event.get("Records", []):
        if "body" not in record:
            continue
        body = record.get("body")
        LOGGER.info(f"Received message with body: {body}")
        event = json.loads(body)
        event_type = event.get("type", "").lower()

        if event_type == "activity":
            update_activity()
            LOGGER.info(f"Update successful for type={event_type}")
        elif event_type == "seed-s3-categories":
            version = event.get("version")
            categories_path = event.get("categories_path ")

            categories.run_seed_s3_categories_workflow(version, categories_path)
            LOGGER.info(f"Update successful for type={event_type}")
