from typing import List, Dict

from pynamodb.attributes import UnicodeAttribute, ListAttribute

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


def get_category(category: str, version: str) -> List[Dict]:
    results = _Category.query(
         hash_key=category,
         range_key_condition=_Category.version.startswith(version),
         attributes_to_get=["label", "dimension", "hierarchy"]
    )
    return [{"label": result.label,
             "dimension": result.dimension,
             "hierarchy": result.hierarchy} for result in results]
