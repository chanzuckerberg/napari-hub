from pynamodb.attributes import (
    BooleanAttribute,
    NumberAttribute,
    MapAttribute,
    UnicodeAttribute,
)
from pynamodb.models import Model

from helper import set_ddb_metadata
from nhcommons.utils import get_current_timestamp


@set_ddb_metadata('plugin-metadata')
class _PluginMetadata(Model):

    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_type = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    type = UnicodeAttribute()
    is_latest = BooleanAttribute(null=True)
    data = MapAttribute()
    last_updated_timestamp = NumberAttribute(
        default_for_new=get_current_timestamp
    )
