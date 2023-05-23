from pynamodb.attributes import (
    UnicodeAttribute,
    NumberAttribute,
    BooleanAttribute
)
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model

from helper import (set_ddb_metadata, get_stack_name)


class _LatestPluginIndex(GlobalSecondaryIndex):

    class Meta:
        index_name = f'{get_stack_name()}-latest-plugins'
        projection = AllProjection()

    name = UnicodeAttribute(hash_key=True)
    is_latest = BooleanAttribute(range_key=True)
    last_updated_timestamp = NumberAttribute()


@set_ddb_metadata('plugin')
class _Plugin(Model):

    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version = UnicodeAttribute(range_key=True)
    is_latest = BooleanAttribute()

    latest_plugin_index = _LatestPluginIndex()
