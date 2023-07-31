import time
from typing import Dict, List

from api.models.helper import set_ddb_metadata
from collections import defaultdict
from pynamodb.attributes import ListAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from slugify import slugify
from utils.time import get_current_timestamp, print_perf_duration


@set_ddb_metadata("category")
class CategoryModel(Model):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_hash = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    formatted_name = UnicodeAttribute()
    dimension = UnicodeAttribute()
    hierarchy = ListAttribute()  # List[str]
    label = UnicodeAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    def __eq__(self, other):
        return isinstance(other, CategoryModel) and (
            self.name == other.name
            and self.version_hash == other.version_hash
            and self.version == other.version
            and self.formatted_name == other.formatted_name
            and self.dimension == other.dimension
            and self.hierarchy == other.hierarchy
            and self.label == other.label
        )


def _get_category_from_model(category):
    return {
        "label": category.label,
        "dimension": category.dimension,
        "hierarchy": category.hierarchy,
    }


def get_category(name: str, version: str) -> List[Dict]:
    """
    Gets the category data for a particular category and EDAM version.
    """

    category = []
    start = time.perf_counter()

    for item in CategoryModel.query(
        slugify(name), CategoryModel.version_hash.startswith(f"{version}:")
    ):
        category.append(_get_category_from_model(item))

    print_perf_duration(start, f"get_category({name})")

    return category


def get_all_categories(version: str) -> Dict[str, List]:
    """
    Gets all available category mappings from a particular EDAM version.
    """

    start = time.perf_counter()
    categories = CategoryModel.scan(
        CategoryModel.version == version,
        attributes_to_get=[
            "formatted_name",
            "version",
            "dimension",
            "hierarchy",
            "label",
        ],
    )

    mapped_categories = defaultdict(list)

    for category in categories:
        mapped_categories[category.formatted_name].append(
            _get_category_from_model(category)
        )

    print_perf_duration(start, "get_all_categories()")

    return mapped_categories
