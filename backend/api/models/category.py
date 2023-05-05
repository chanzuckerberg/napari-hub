import os
import time

from slugify import slugify
from collections import defaultdict
from pynamodb.attributes import ListAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from utils.time import get_current_timestamp, print_perf_duration


class CategoryModel(Model):
    class Meta:
        host = os.getenv('LOCAL_DYNAMO_HOST')
        region = os.environ.get("AWS_REGION", "us-west-2")
        table_name = f"{os.environ.get('STACK_NAME')}-category"

    name = UnicodeAttribute(hash_key=True)
    version_hash = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    formatted_name = UnicodeAttribute()
    dimension = UnicodeAttribute()
    hierarchy = ListAttribute()  # List[str]
    label = UnicodeAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)

    @classmethod
    def _get_category_from_model(cls, category):
        return {
            "label": category.label,
            "dimension": category.dimension,
            "hierarchy": category.hierarchy,
        }

    @classmethod
    def get_category(cls, name: str, version: str):
        """
        Gets the category data for a particular category and EDAM version.
        """

        category = []
        start = time.perf_counter()

        for item in cls.query(
            slugify(name), cls.version_hash.startswith(f"{version}:")
        ):
            category.append(cls._get_category_from_model(item))

        print_perf_duration(start, f"CategoryModel.get_category({name})")

        return category

    @classmethod
    def get_all_categories(cls, version: str):
        """
        Gets all available category mappings from a particular EDAM version.
        """

        start = time.perf_counter()
        categories = cls.scan(
            cls.version == version,
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
                cls._get_category_from_model(category)
            )

        print_perf_duration(start, "CategoryModel.get_all_categories()")

        return mapped_categories
