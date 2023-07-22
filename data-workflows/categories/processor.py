import os
import time
import logging

from categories.utils import hash_category

from nhcommons.models.category import batch_write
from utils.env import get_required_env
from utils.s3 import S3Client

STACK_NAME = os.getenv("STACK_NAME", "local")

LOGGER = logging.getLogger(__name__)


def seed_s3_categories_workflow(version: str, categories_path: str):
    """
    Runs data workflow for populating the category dynamo table from an S3
    source on the same depoyment stack.

    :param version: The categories version
    :type version: str
    :param categories_path: The categories path in S3
    :type categories_path: str
    :raises ValueError: If params are not defined
    """

    if not all([version, categories_path]):
        LOGGER.error(
            f"Missing required values version={version} s3_path={categories_path}"
        )
        raise ValueError()

    bucket = get_required_env("BUCKET")
    s3_prefix = os.getenv("BUCKET_PATH", "")

    LOGGER.info(
        f"Seeding {version} category data from S3 "
        f"prefix={STACK_NAME} s3_path={categories_path} bucket={bucket}"
    )

    client = S3Client(
        bucket=bucket,
        prefix=s3_prefix,
    )
    data = client.load_json_from_s3(categories_path)

    batch = []
    start = time.perf_counter()

    for name, categories in data.items():
        for category in categories:
            batch.append({
                "name": name,
                "version_hash": f"{version}:{hash_category(category)}",
                "version": version,
                "formatted_name": name,
                "dimension": category.get("dimension", ""),
                "hierarchy": category.get("hierarchy", []),
                "label": category.get("label", ""),
            })

    batch_write(batch)
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f"Finished seeding category data count={len(batch)} "
                f"duration={duration}ms")
