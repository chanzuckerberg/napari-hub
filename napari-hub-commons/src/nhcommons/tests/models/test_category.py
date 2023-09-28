from collections import defaultdict
from typing import List

import pytest
from moto import mock_dynamodb

from nhcommons.models import category

TEST_VERSION = "EDAM-BIOIMAGING:alpha06"
TEST_CATEGORY_NAME = "Confocal Fluorescence Microscopy"


def get_version_hash(hash_input: dict):
    hash_value = "-".join([f"{k}-{str(v)}" for k, v in hash_input.items()])
    return f"{TEST_VERSION}:{hash_value}"


def filter_fields(item: dict) -> dict:
    included_fields = {"label", "dimension", "hierarchy"}
    return {key: value for key, value in item.items() if key in included_fields}


def generate_category(
    name: str, dimension: str, label: str, hierarchy: List[str], is_input: bool
):
    return {
        "name": name if is_input else name.lower().replace(" ", "-"),
        "version_hash": get_version_hash(
            {
                "dimension": dimension,
                "label": label,
                "hierarchy": hierarchy,
            }
        ),
        "version": TEST_VERSION,
        "formatted_name": name,
        "dimension": dimension,
        "label": label,
        "hierarchy": hierarchy,
    }


def generate_category_list(is_input: bool):
    return [
        generate_category(
            name=TEST_CATEGORY_NAME,
            dimension="Image modality",
            label="Fluorescence microscopy",
            hierarchy=["Fluorescence microscopy", "Confocal fluorescence microscopy"],
            is_input=is_input,
        ),
        generate_category(
            name=TEST_CATEGORY_NAME,
            dimension="Image modality",
            label="Confocal microscopy",
            hierarchy=["Confocal microscopy", "Confocal fluorescence microscopy"],
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


def sorter(items: List[dict]) -> List[dict]:
    return sorted(items, key=lambda item: item["hierarchy"])


class TestCategory:
    @pytest.fixture
    def category_table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(category._Category, "category")

    @pytest.fixture
    def seed_table(self):
        def _seed(table):
            items = generate_category_list(False)
            for item in items:
                table.put_item(Item=item)

        return _seed

    def test_batch_write(self, category_table, verify_table_data):
        category.batch_write(generate_category_list(True))

        verify_table_data(generate_category_list(False), category_table)

    @pytest.mark.parametrize(
        "excluded_field",
        [
            "dimension",
            "formatted_name",
            "hierarchy",
            "label",
            "name",
            "version",
            "version_hash",
        ],
    )
    def test_batch_write_for_invalid_data(self, excluded_field, category_table):
        input_data = {
            "name": "confocal-fluorescence-microscopy",
            "version_hash": f"{TEST_VERSION}:foo",
            "version": TEST_VERSION,
            "formatted_name": "Confocal Fluorescence Microscopy",
            "dimension": "Image modality",
            "label": "Fluorescence microscopy",
            "hierarchy": ["Confocal fluorescence microscopy"],
        }
        del input_data[excluded_field]
        with pytest.raises(KeyError):
            category.batch_write([input_data])

    def test_get_category_has_result(self, category_table, seed_table):
        seed_table(category_table)

        expected = [
            filter_fields(item)
            for item in generate_category_list(False)
            if item["formatted_name"] == TEST_CATEGORY_NAME
        ]

        actual = category.get_category(TEST_CATEGORY_NAME, TEST_VERSION)
        assert sorter(actual) == sorter(expected)

    @pytest.mark.parametrize(
        "category_name, version",
        [
            (TEST_CATEGORY_NAME, "foo"),
            (TEST_CATEGORY_NAME, None),
            ("foo", TEST_VERSION),
            (None, TEST_VERSION),
        ],
    )
    def test_get_category_has_no_result(
        self, category_name, version, category_table, seed_table
    ):
        seed_table(category_table)
        assert category.get_category(category_name, version) == []

    def test_get_all_categories_has_result(self, category_table, seed_table):
        seed_table(category_table)
        expected = defaultdict(list)
        for item in generate_category_list(False):
            expected[item["formatted_name"]].append(filter_fields(item))
        assert category.get_all_categories(TEST_VERSION) == expected

    def test_get_all_categories_has_no_result(self, category_table):
        assert category.get_all_categories("foo") == defaultdict(list)
