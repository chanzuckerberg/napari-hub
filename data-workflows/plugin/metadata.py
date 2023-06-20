import logging
from collections import defaultdict
from typing import Optional

from nhcommons.models.category import get_category
from nhcommons.utils.custom_parser import render_description
from nhcommons.utils.github_adapter import (
    get_github_metadata, is_valid_repo_url
)
from nhcommons.utils.pypi_adapter import get_plugin_pypi_metadata

logger = logging.getLogger(__name__)


def get_formatted_metadata(plugin: str, version: str) -> Optional[dict]:
    pypi_metadata = get_plugin_pypi_metadata(plugin, version)
    if not pypi_metadata:
        return None

    metadata = _generate_metadata(pypi_metadata)
    return _format_metadata(metadata)


def _format_metadata(metadata: dict) -> dict:
    if "description" in metadata:
        description = metadata.get("description")
        metadata["description_text"] = render_description(description)
    if "labels" in metadata:
        labels = metadata["labels"]
        version = labels.get("ontology")

        if version:
            cat, cat_hierarchy = _process_for_categories(labels, version)
            metadata["category"] = cat
            metadata["category_hierarchy"] = cat_hierarchy
        else:
            logger.warning(f"Invalid version in label labels={labels}")

        del metadata["labels"]

    return metadata


def _generate_metadata(pypi_metadata: dict) -> dict:
    github_repo_url = pypi_metadata.get("code_repository")
    if is_valid_repo_url(github_repo_url):
        github_metadata = get_github_metadata(github_repo_url)
        return {**pypi_metadata, **github_metadata}
    return pypi_metadata


def _process_for_categories(labels: dict, version: str) -> (dict, dict):
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
