from typing import Dict, Any, List

from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper


@set_ddb_metadata('install-activity')
class _InstallActivity(PynamoWrapper):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    is_total = UnicodeAttribute(null=True)
    install_count = NumberAttribute()

    def __eq__(self, other) -> bool:
        if isinstance(other, _InstallActivity):
            return ((self.plugin_name, self.type_timestamp, self.granularity,
                     self.timestamp, self.install_count, self.is_total) ==
                    (other.plugin_name, other.type_timestamp, other.granularity,
                     other.timestamp, other.install_count, other.is_total))
        return False

    @staticmethod
    def to_model(data: Dict[str, Any]):
        return _InstallActivity(
            plugin_name=data.get("plugin_name"),
            type_timestamp=data.get("type_timestamp"),
            granularity=data.get("granularity"),
            timestamp=data.get("timestamp"),
            install_count=data.get("install_count"),
            is_total=data.get("is_total"),
        )


def batch_write(records: List[Dict]) -> None:
    batch = _InstallActivity.batch_write()

    for record in records:
        batch.save(_InstallActivity.to_model(record))

    batch.commit()

