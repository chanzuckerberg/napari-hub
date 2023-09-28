import hashlib

from typing import Dict


def hash_category(category: Dict[str, str]) -> str:
    """
    Hashes a category object using the MD5 hash algorithm. This works by
    creating a hash from the string and string array fields in the category
    object.
    """

    label = category.get("label", "")
    dimension = category.get("dimension")
    hierarchy = category.get("hierarchy", [])

    category_hash = hashlib.new("md5")
    category_hash.update(label.encode("utf-8"))
    category_hash.update(dimension.encode("utf-8"))

    for value in hierarchy:
        category_hash.update(value.encode("utf-8"))

    return category_hash.hexdigest()
