import logging
import time
from typing import Any, Dict

from pynamodb.attributes import UnicodeAttribute, BooleanAttribute, \
    MapAttribute, NumberAttribute
from pynamodb.models import Model

from api.models.helper import set_ddb_metadata


logger = logging.getLogger(__name__)


@set_ddb_metadata("plugin-metadata")
class _PluginMetadata(Model):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_type = UnicodeAttribute(range_key=True)
    type = UnicodeAttribute()
    version = UnicodeAttribute()
    is_latest = BooleanAttribute(null=True)
    data = MapAttribute(null=True)
    last_updated_timestamp = NumberAttribute()


def get_manifest(name: str, version: str) -> Dict[str, Any]:
    version_type = f"{version}:DISTRIBUTION"
    start = time.perf_counter()
    try:
        result = _PluginMetadata.get(
            hash_key=name, range_key=version_type, attributes_to_get=["data"]
        )
        return result.data.as_dict()
    except _PluginMetadata.DoesNotExist:
        return {}
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"name={name} version={version} duration={duration}ms")
