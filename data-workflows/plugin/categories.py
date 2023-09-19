from collections import defaultdict

from nhcommons.models.category import get_category

def process_for_categories(labels: dict, version: str) -> (dict, dict):
    categories = defaultdict(list)
    category_hierarchy = defaultdict(list)
    for label_term in labels.get("terms", []):
        for category in get_category(label_term, version):
            dimension = category.get("dimension")
            label = category.get("label")
            if label not in categories[dimension]:
                categories[dimension].append(label)
            category.get("hierarchy")[0] = label
            category_hierarchy[dimension].append(category.get("hierarchy"))
    return dict(categories), dict(category_hierarchy)


def merge_metadata_manifest_categories(
    metadata: dict[str, Any], manifest: dict[str, Any]
):
    """Merge categories and hierarchy in PyPI and manifest.

    Keeps union of keys and values present in both dictionaries.
    """
    meta_category = metadata.get("category", {})
    man_category = manifest.get("category", {})
    meta_category_hierarchy = metadata.get("category_hierarchy", {})
    man_category_hierarchy = manifest.get("category_hierarchy", {})

    if not man_category:
        return meta_category, meta_category_hierarchy

    merged_category = {}
    merged_keys = set(meta_category.keys()).union(set(man_category.keys()))
    for key in merged_keys:
        # unify both lists of terms
        merged_labels = list(
            set(meta_category.get(key, [])).union(set(man_category.get(key, [])))
        )
        merged_category[key] = merged_labels

    merged_hierarchy = {}
    merged_keys = list(
        set(meta_category_hierarchy.keys()).union(set(man_category_hierarchy.keys()))
    )
    for key in merged_keys:
        man_hierarchy = man_category_hierarchy.get(key, [])
        meta_hierarchy = meta_category_hierarchy.get(key, [])
        # the lowest level of the hierarchy will be the comparison key for removing duplicates
        meta_leaves = set([hi_list[-1] for hi_list in meta_hierarchy])
        # only keep manifest hierarchies we don't already have
        man_filtered = list(
            filter(lambda hi_list: hi_list[-1] not in meta_leaves, man_hierarchy)
        )
        merged_hierarchy[key] = meta_hierarchy + man_filtered

    if len(merged_category):
        metadata["category"] = merged_category
        metadata["category_hierarchy"] = merged_hierarchy
    if "category" in manifest:
        del manifest["category"]
        del manifest["category_hierarchy"]
    return metadata
