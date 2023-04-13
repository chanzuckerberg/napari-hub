import json
import logging
import activity.processor
import categories


LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


def handle(event, context) -> None:
    for record in event.get("Records", []):
        if "body" not in record:
            continue

        body = record.get("body")
        LOGGER.info(f"Received message with body: {body}")
        event = json.loads(body)
        event_type = event.get("type", "").lower()

        # TODO: Create a dict for event_type by method to be called
        if event_type == "activity":
            activity.processor.update_activity()
            LOGGER.info(f"Update successful for type={event_type}")
        elif event_type == "seed-s3-categories":
            version = event.get("version")
            s3_path = event.get("s3_path")

            categories.run_seed_s3_categories_workflow(version, s3_path)
            LOGGER.info(f"Update successful for type={event_type}")
