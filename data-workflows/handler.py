import categories
import json
import logging

from activity.update_activity import update_activity


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    return logger


def handle(event, context):
    logger = _setup_logging()

    for record in event.get("Records", []):
        if "body" not in record:
            continue
        body = record.get("body")
        logger.info(f"Received message with body: {body}")
        event = json.loads(body)
        event_type = event.get("type", "").lower()

        if event_type == "activity":
            update_activity()
            logger.info(f"Update successful for type={event_type}")
        elif event_type == "seed-s3-categories":
            version = event.get("version")
            s3_path = event.get("s3_path")

            categories.run_seed_s3_categories_workflow(version, s3_path)
            logger.info(f"Update successful for type={event_type}")
