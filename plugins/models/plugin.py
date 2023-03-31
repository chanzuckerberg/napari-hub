import json
import logging
import os
import time

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute, MapAttribute

from utils.s3_adapter import S3Adapter

LOGGER = logging.getLogger()


def _get_version_type(version):
    return f'{version}:DISTRIBUTION'


class Plugin(Model):
    class Meta:
        host = os.getenv('LOCAL_DYNAMO_HOST')
        region = os.getenv('AWS_REGION', 'us-west-2')
        table_name = f'{os.getenv("STACK_NAME", "local")}-plugin'

    name = UnicodeAttribute(hash_key=True)
    version_type = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    type = UnicodeAttribute(default_for_new=lambda: 'DISTRIBUTION')
    data = MapAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=lambda: round(time.time() * 1000))

    @staticmethod
    def write_manifest_data(plugin: str, version: str, data_str: str):
        start = time.perf_counter()
        data = json.loads(data_str)
        version_type = _get_version_type(version)
        Plugin(name=plugin, version_type=version_type, version=version, data=data).save()
        duration = (time.perf_counter() - start) * 1000
        logging.info(f'Put {plugin} {version_type} record time taken={duration}ms')

    @staticmethod
    def verify_exists_in_dynamo(plugin, version, path):
        try:
            Plugin.get(plugin, _get_version_type(version))
        except Plugin.DoesNotExist:
            logging.warning(f'distribution record does not exist for {plugin} version={version} creating one')
            Plugin.write_manifest_data(plugin, version, S3Adapter().get_from_s3(path))
