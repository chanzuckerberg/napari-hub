from typing import List

import pytest
from moto import mock_dynamodb

from nhcommons.models import category

TEST_VERSION = "EDAM-BIOIMAGING:alpha06"


def get_version_hash(hash_input: dict):
    hash_value = "-".join([f"{k}-{str(v)}" for k, v in hash_input.items()])
    return f"{TEST_VERSION}:{hash_value}"


def generate_category(name: str,
                      dimension: str,
                      label: str,
                      hierarchy: List[str],
                      is_input: bool):
    return {
        "name": name if is_input else name.lower().replace(" ", "-"),
        "version_hash": get_version_hash({
            "dimension": dimension, "label": label, "hierarchy": hierarchy,
        }),
        "version": TEST_VERSION,
        "formatted_name": name,
        "dimension": dimension,
        "label": label,
        "hierarchy": hierarchy,
    }


def generate_category_list(is_input: bool):
    return [
        generate_category(
            name="Confocal Fluorescence Microscopy",
            dimension="Image modality",
            label="Fluorescence microscopy",
            hierarchy=[
                "Fluorescence microscopy", "Confocal fluorescence microscopy"
            ],
            is_input=is_input,
        ),
        generate_category(
            name="Confocal Fluorescence Microscopy",
            dimension="Image modality",
            label="Confocal microscopy",
            hierarchy=[
                "Confocal microscopy", "Confocal fluorescence microscopy"
            ],
            is_input=is_input,
        ),
        generate_category(
            name="Closingy",
            dimension="Workflow step",
            label="Morphological operations",
            hierarchy=["Morphological operation", "Closing"],
            is_input=is_input,
        ),
    ]


class TestCategory:

    @pytest.fixture()
    def category_table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(category._Category, 'category')

    def test_batch_write(self, category_table, verify_table_data):
        category.batch_write(generate_category_list(True))

        verify_table_data(generate_category_list(False), category_table)
