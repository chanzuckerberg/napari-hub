from typing import List, Dict, Any

from pynamodb.attributes import UnicodeAttribute, ListAttribute
from slugify import slugify

from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper


@set_ddb_metadata('category')
class _Category(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)
    version_hash = UnicodeAttribute(range_key=True)
    version = UnicodeAttribute()
    formatted_name = UnicodeAttribute()
    dimension = UnicodeAttribute()
    hierarchy = ListAttribute()  # List[str]
    label = UnicodeAttribute()

    @staticmethod
    def to_model(data: Dict[str, Any]):
        return _Category(
            name=slugify(data.get("name")),
            version_hash=data.get("version_hash"),
            version=data.get("version"),
            formatted_name=data.get("formatted_name"),
            dimension=data.get("dimension"),
            hierarchy=data.get("hierarchy"),
            label=data.get("label"),
        )


def batch_write(records: List[Dict]) -> None:
    batch = _Category.batch_write()

    for record in records:
        batch.save(_Category.to_model(record))

    batch.commit()
