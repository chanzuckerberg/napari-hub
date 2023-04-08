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

        if event_type == "seed-s3-categories":
            bucket = event.get("bucket")
            version = event.get("version")
            s3_path = event.get("s3_path")
            s3_prefix = event.get("s3_prefix")

            if not bucket:
                LOGGER.error(f"Missing 'bucket' for type={event_type}")
                return

            if not version:
                LOGGER.error(f"Missing 'version' for type={event_type}")
                return

            if not s3_path:
                LOGGER.error(f"Missing 's3_path' for type={event_type}")
                return

            categories.run_seed_s3_categories_workflow(version, s3_path, s3_prefix)
            LOGGER.info(f"Update successful for type={event_type}")
