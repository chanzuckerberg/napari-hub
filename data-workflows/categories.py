import os
import time
import hashlib
import logging

from pynamodb.attributes import ListAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from slugify import slugify
from typing import Dict
from utils.env import get_required_env
from utils.s3 import S3Client
from utils.utils import get_current_timestamp

STACK_NAME = os.getenv("STACK_NAME")

LOGGER = logging.getLogger()


class CategoryModel(Model):
    class Meta:
        host = os.getenv("LOCAL_DYNAMO_HOST")
        region = os.getenv("AWS_REGION", "us-west-2")
        table_name = f"{STACK_NAME}-category"

    name = UnicodeAttribute(hash_key=True)
    version_hash = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    formatted_name = UnicodeAttribute()
    dimension = UnicodeAttribute()
    hierarchy = ListAttribute()  # List[str]
    label = UnicodeAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)


def _hash_category(category: Dict[str, str]) -> str:
    """
    Hashes a category object using the MD5 hash algorithm. This works by
    creating a hash from the string and string array fields in the category
    object.
    """

    label = category.get("label", "")
    dimension = category.get("dimension")
    hierarchy = category.get("hierarchy", [])

    category_hash = hashlib.new("md5")
    category_hash.update(label.encode("utf-8"))
    category_hash.update(dimension.encode("utf-8"))

    for value in hierarchy:
        category_hash.update(value.encode("utf-8"))

    return category_hash.hexdigest()


def run_seed_s3_categories_workflow(version: str, categories_path: str):
    """
    Runs data workflow for populating the category dynamo table from an S3
    source on the same depoyment stack.
    """

    if not all(version, categories_path):
        LOGGER.error(
            f"Missing required values version={version} s3_path={categories_path}"
        )
        raise ValueError()

    bucket = get_required_env("BUCKET")
    s3_prefix = os.getenv("BUCKET_PATH", "")

    LOGGER.info(
        f"Seeding {version} category data from S3 "
        f"prefix={STACK_NAME} s3_path={categories_path} bucket={bucket} table={CategoryModel.Meta.table_name}"
    )

    client = S3Client(
        bucket=bucket,
        prefix=s3_prefix,
    )
    data = client.load_json_from_s3(categories_path)

    batch = CategoryModel.batch_write()
    start = time.perf_counter()
    count = 0

    for name, categories in data.items():
        for category in categories:
            item = CategoryModel(
                name=slugify(name),
                version_hash=f"{version}:{_hash_category(category)}",
                version=version,
                formatted_name=name,
                dimension=category.get("dimension", ""),
                hierarchy=category.get("hierarchy", []),
                label=category.get("label", ""),
            )
            batch.save(item)
            count += 1

    batch.commit()
    duration = (time.perf_counter() - start) * 1000

    LOGGER.info(f"Finished seeding category data count={count} duration={duration}ms")
