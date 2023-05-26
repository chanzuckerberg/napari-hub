import logging
import time

from pynamodb.attributes import (
    UnicodeAttribute,
    NumberAttribute,
    BooleanAttribute
)
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from .helper import (set_ddb_metadata, get_stack_name, PynamoWrapper)

logger = logging.getLogger(__name__)


class _LatestPluginIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = f'{get_stack_name()}-latest-plugins'
        projection = AllProjection()

    name = UnicodeAttribute(hash_key=True)
    is_latest = BooleanAttribute(range_key=True)
    last_updated_timestamp = NumberAttribute()


@set_ddb_metadata('plugin')
class _Plugin(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version = UnicodeAttribute(range_key=True)
    is_latest = BooleanAttribute(null=True)

    latest_plugin_index = _LatestPluginIndex()

    def __eq__(self, other):
        if isinstance(other, _Plugin):
            return ((self.name, self.version, self.is_latest) ==
                    (other.name, other.version, other.is_latest))
        return False


def get_latest_plugins() -> dict[str, str]:
    latest_plugins = {}
    start = time.perf_counter()
    try:
        response = _Plugin.latest_plugin_index.scan(
            attributes_to_get=['name', 'version']
        )
        latest_plugins = {plugin.name: plugin.version for plugin in response}
        return latest_plugins
    finally:
        duration = (time.perf_counter() - start) * 1000
        count = len(latest_plugins)
        logger.info(f"latest plugins count={count} time_taken={duration}ms")
