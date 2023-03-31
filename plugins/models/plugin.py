import os
import time

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute, MapAttribute


class Plugin(Model):
    class Meta:
        region = os.getenv('AWS_REGION', 'us-west-2')
        table_name = f'{os.getenv("STACK_NAME")}-plugin'

    name = UnicodeAttribute(hash_key=True)
    version_type = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    type = UnicodeAttribute()
    data = MapAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=lambda: round(time.time() * 1000))

    @staticmethod
    def write_manifest_data(plugin, version, data):
        Plugin(
            name=plugin, version_type=f'{version}:DISTRIBUTION', version=version, type='DISTRIBUTION', data=data
        ).save()
