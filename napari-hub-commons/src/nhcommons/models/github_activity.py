from typing import (Dict, Any, List)

from pynamodb.attributes import (UnicodeAttribute, NumberAttribute)
from nhcommons.models.helper import (set_ddb_metadata, PynamoWrapper)


@set_ddb_metadata("github-activity")
class _GitHubActivity(PynamoWrapper):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    commit_count = NumberAttribute(null=True)
    granularity = UnicodeAttribute(attr_name="type")
    repo = UnicodeAttribute()
    timestamp = NumberAttribute(null=True)

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        return _GitHubActivity(
            plugin_name=data["plugin_name"].lower(),
            type_identifier=data["type_identifier"],
            commit_count=data.get("commit_count"),
            granularity=data["granularity"],
            repo=data["repo"],
            timestamp=data.get("timestamp"),
        )


def batch_write(records: List[Dict]) -> None:
    batch = _GitHubActivity.batch_write()

    for record in records:
        batch.save(_GitHubActivity.from_dict(record))

    batch.commit()
