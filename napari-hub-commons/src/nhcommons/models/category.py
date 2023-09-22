import logging
import time
from collections import defaultdict
from typing import Any, Dict, List

from pynamodb.attributes import UnicodeAttribute, ListAttribute
from slugify import slugify

from nhcommons.models.pynamo_helper import set_ddb_metadata, PynamoWrapper

logger = logging.getLogger(__name__)


@set_ddb_metadata("category")
class _Category(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_hash = UnicodeAttribute(range_key=True)
    dimension = UnicodeAttribute()
    formatted_name = UnicodeAttribute()
    hierarchy = ListAttribute()  # List[str]
    label = UnicodeAttribute()
    version = UnicodeAttribute()

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        return _Category(
            name=slugify(data["name"]),
            version_hash=data["version_hash"],
            dimension=data["dimension"],
            formatted_name=data["formatted_name"],
            hierarchy=data["hierarchy"],
            label=data["label"],
            version=data["version"],
        )


def _get_category_from_model(category):
    return {
        "label": category.label,
        "dimension": category.dimension,
        "hierarchy": category.hierarchy,
    }


def batch_write(records: List[Dict]) -> None:
    start = time.perf_counter()
    try:
        batch = _Category.batch_write()

        for record in records:
            batch.save(_Category.from_dict(record))

        batch.commit()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"_Category duration={duration}ms")


def get_category(category: str, version: str) -> List[Dict[str, Any]]:
    if not category or not version:
        return []
    start = time.perf_counter()
    try:
        results = _Category.query(
            hash_key=slugify(category),
            range_key_condition=_Category.version_hash.startswith(version),
            attributes_to_get=["dimension", "hierarchy", "label"],
        )
        return [_get_category_from_model(result) for result in results]
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"_Category duration={duration}ms")


def get_all_categories(version: str) -> Dict[str, List[Dict[str, Any]]]:
    start = time.perf_counter()
    try:
        categories = _Category.scan(
            _Category.version == version,
            attributes_to_get=["dimension", "formatted_name", "hierarchy", "label"],
        )
        mapped_categories = defaultdict(list)
        for category in categories:
            mapped_categories[category.formatted_name].append(
                _get_category_from_model(category)
            )
        return mapped_categories
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"_Category duration={duration}ms")
