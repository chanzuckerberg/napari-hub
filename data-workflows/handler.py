import json
import logging

import activity.processor
import categories.processor
import plugin.processor
import plugin.aggregator

logging.basicConfig(
    level="INFO",
    style="{",
    format="[{levelname}] {asctime} {threadName} {name}.{funcName} {message}",
    force=True,
)
logger = logging.getLogger(__name__)

EVENT_TYPE_BY_PROCESSOR = {
    "activity": lambda event: activity.processor.update_activity(),
    "seed-s3-categories": lambda event: categories.processor.seed_s3_categories_workflow(
        event.get("version"), event.get("categories_path")
    ),
    "plugin": lambda event: plugin.processor.update_plugin(),
}


def handle_sqs_message(body: str) -> None:
    logger.info(f"Received message with body: {body}")
    event = json.loads(body)
    event_type = event.get("type", "").lower()

    processor = EVENT_TYPE_BY_PROCESSOR.get(event_type)
    if processor:
        processor(event)
        logger.info(f"Update successful for type={event_type}")


def _get_plugin_version(dynamodb_dict: dict) -> tuple:
    keys = dynamodb_dict.get("Keys", {})
    name = keys.get("name", {}).get("S")
    version_type = keys.get("version_type", {}).get("S")
    version = version_type[0:version_type.rfind(":")]
    return name, version


def handle(event: dict, context) -> None:
    updated_plugins = set()
    for record in event.get("Records", []):
        if "body" in record:
            handle_sqs_message(record.get("body"))
        elif "dynamodb" in record:
            dynamodb = record.get("dynamodb")
            updated_plugins.add(_get_plugin_version(dynamodb))

    if updated_plugins:
        plugin.aggregator.aggregate_plugins(updated_plugins)
