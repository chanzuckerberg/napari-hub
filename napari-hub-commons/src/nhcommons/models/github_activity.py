from typing import Dict, Any, List

from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper


@set_ddb_metadata('github-activity')
class _GitHubActivity(PynamoWrapper):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    commit_count = NumberAttribute(null=True)
    repo = UnicodeAttribute()

    @staticmethod
    def to_model(data: Dict[str, Any]):
        return _GitHubActivity(
            plugin_name=data.get("plugin_name").lower(),
            type_identifier=data.get("type_identifier"),
            granularity=data.get("granularity"),
            timestamp=data.get("timestamp"),
            commit_count=data.get("commit_count"),
            repo=data.get("repo"),
        )


def batch_write(records: List[Dict]) -> None:
    batch = _GitHubActivity.batch_write()

    for record in records:
        batch.save(_GitHubActivity.to_model(record))

    batch.commit()
