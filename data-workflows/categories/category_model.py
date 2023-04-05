import os
import logging

from pynamodb.attributes import ListAttribute, NumberAttribute, UnicodeAttribute
from pynamodb.models import Model
from nhcommons.utils.time import get_current_timestamp

STACK_NAME = os.getenv("STACK_NAME", "local")

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
