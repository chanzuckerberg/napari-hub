import activity.processor
import categories
import json
import logging
import utils.utils

from utils.utils import ParameterStoreAdapter


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    return logger


def _update_activity() -> None:
    parameter_store_adapter = ParameterStoreAdapter()
    last_updated_timestamp = parameter_store_adapter.get_last_updated_timestamp()
    current_timestamp = utils.utils.get_current_timestamp()
    activity.processor.update_install_activity(
        last_updated_timestamp, current_timestamp
    )
    activity.processor.update_github_activity(last_updated_timestamp, current_timestamp)
    parameter_store_adapter.set_last_updated_timestamp(current_timestamp)


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
            _update_activity()
            logger.info(f"Update successful for type={event_type}")
        elif event_type == "seed-s3-categories":
            version = event.get("version")
            s3_path = event.get("s3_path")

            categories.run_seed_s3_categories_workflow(version, s3_path)
            logger.info(f"Update successful for type={event_type}")
