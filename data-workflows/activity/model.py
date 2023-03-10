import os
from enum import Enum

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute


class GitHubActivityType(Enum):
    LATEST = 1
    MONTH = 2
    TOTAL = 3


class GitHubActivity(Model):
    class Meta:
        prefix = os.getenv('STACK_NAME')
        region = os.getenv('AWS_REGION')
        table_name = f'{prefix}-github-activity'
        region = region

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    number_of_commits = NumberAttribute()
    repo = UnicodeAttribute(null=True)
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)
