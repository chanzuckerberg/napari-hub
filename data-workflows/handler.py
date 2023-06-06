import json
import logging

import activity.processor
import categories.processor
import plugin.processor


FORMAT = "%(asctime)s [%(levelname)s] %(name)s %(module)s %(funcName)s %(message)s"
logging.basicConfig(format=FORMAT, level=logging.INFO)
logger = logging.getLogger(__name__)

EVENT_TYPE_BY_PROCESSOR = {
    'activity': lambda event: activity.processor.update_activity(),
    'category': lambda event: categories.processor.seed_s3_categories_workflow(
        event.get("version"), event.get("categories_path")
    ),
    'plugin': lambda event: plugin.processor.update_plugin(),
}


def handle(event, context) -> None:
    for record in event.get("Records", []):
        if "body" not in record:
            continue

        body = record.get("body")
        logger.info(f"Received message with body: {body}")
        event = json.loads(body)
        event_type = event.get("type", "").lower()

        processor = EVENT_TYPE_BY_PROCESSOR.get(event_type)
        if processor:
            processor(event)
            logger.info(f"Update successful for type={event_type}")


if __name__ == "__main__":
    logger.info(f"Received message with body: foo")
    logger.warning(f"Received message with body: foo")
