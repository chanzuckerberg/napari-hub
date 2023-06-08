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
    dimension = UnicodeAttribute()
    formatted_name = UnicodeAttribute()
    hierarchy = ListAttribute()  # List[str]
    label = UnicodeAttribute()
    version = UnicodeAttribute()

    @staticmethod
    def from_dict(data: Dict[str, Any]):
        return _Category(
            name=slugify(data["name"]),
            version_hash=data["version_hash"],
            dimension=data["dimension"],
            formatted_name=data["formatted_name"],
            hierarchy=data["hierarchy"],
            label=data["label"],
            version=data["version"],
        )


def batch_write(records: List[Dict]) -> None:
    batch = _Category.batch_write()

    for record in records:
        batch.save(_Category.from_dict(record))

    batch.commit()
