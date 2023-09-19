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
