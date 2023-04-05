from pynamodb.attributes import (
    UnicodeAttribute,
    NumberAttribute,
    BooleanAttribute
)
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from pynamodb.models import Model

from helper import set_ddb_metadata
from nhcommons.utils import get_current_timestamp


class _LatestPluginIndex(GlobalSecondaryIndex):

    class Meta:
        index_name = 'latest-plugin'
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
    last_updated_timestamp = NumberAttribute(
        default_for_new=get_current_timestamp
    )

    latest_plugin_index = _LatestPluginIndex()
