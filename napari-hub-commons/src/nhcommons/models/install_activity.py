import logging
import time
from typing import Dict, Any, List
from pynamodb.attributes import UnicodeAttribute, NumberAttribute
from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper

logger = logging.getLogger(__name__)


@set_ddb_metadata("install-activity")
class _InstallActivity(PynamoWrapper):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name="type")
    install_count = NumberAttribute()
    is_total = UnicodeAttribute(null=True)
    timestamp = NumberAttribute(null=True)

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        return _InstallActivity(
            plugin_name=data["plugin_name"].lower(),
            type_timestamp=data["type_timestamp"],
            granularity=data["granularity"],
            install_count=data["install_count"],
            is_total=data.get("is_total"),
            timestamp=data.get("timestamp"),
        )


def batch_write(records: List[Dict]) -> None:
    start = time.perf_counter()
    try:
        batch = _InstallActivity.batch_write()

        for record in records:
            batch.save(_InstallActivity.from_dict(record))

        batch.commit()
    finally:
        duration = (time.perf_counter() - start) * 1000
        logger.info(f"_InstallActivity duration={duration}ms")
