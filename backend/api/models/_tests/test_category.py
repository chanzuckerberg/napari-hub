from typing import List
import pytest

from api.models._tests.conftest import create_dynamo_table
from moto import mock_dynamodb

TEST_BUCKET = "test-bucket"
TEST_STACK_NAME = "None"
TEST_BUCKET_PATH = "test-path"
TEST_CATEGORY_PATH = "category/EDAM-BIOIMAGING/alpha06.json"
TEST_CATEGORY_VERSION = "EDAM-BIOIMAGING:alpha06"


class TestCategory:
    @pytest.fixture
    def setup_env_variables(self, monkeypatch):
        monkeypatch.setenv("BUCKET", TEST_BUCKET)
        monkeypatch.setenv("BUCKET_PATH", TEST_BUCKET_PATH)

    @pytest.fixture()
    def categories_table(self, aws_credentials, setup_env_variables):
        from api.models.category import CategoryModel

        with mock_dynamodb():
            yield create_dynamo_table(CategoryModel, "category")

    def _get_version_hash(self, hash: str) -> str:
        return f"{TEST_CATEGORY_VERSION}:{hash}"

    def _put_item(
        self,
        table,
        name: str,
        version: str,
        version_hash: str,
        formatted_name: str,
        dimension: str,
        label: str,
        hierarchy: List[str],
    ):
        item = {
            "name": name,
            "version": version,
            "version_hash": self._get_version_hash(version_hash),
            "formatted_name": formatted_name,
            "label": label,
            "dimension": dimension,
            "hierarchy": hierarchy,
        }
        table.put_item(Item=item)

    def _seed_data(self, table):
        self._put_item(
            table,
            name="name1",
            version=TEST_CATEGORY_VERSION,
            version_hash="hash1",
            formatted_name="Name1",
            dimension="dimension1",
            label="label1",
            hierarchy=["hierarchy1"],
        )

        self._put_item(
            table,
            name="name1",
            version=TEST_CATEGORY_VERSION,
            version_hash="hash2",
            formatted_name="Name1",
            dimension="dimension2",
            label="label2",
            hierarchy=["hierarchy1", "hierarchy2"],
        )

        self._put_item(
            table,
            name="name2",
            version=TEST_CATEGORY_VERSION,
            version_hash="hash3",
            formatted_name="Name2",
            dimension="dimension3",
            label="label3",
            hierarchy=["hierarchy3"],
        )

    def test_get_category_has_result(
        self, aws_credentials, setup_env_variables, categories_table
    ):
        self._seed_data(categories_table)

        from api.models.category import get_category

        actual = get_category("name1", TEST_CATEGORY_VERSION)
        expected = [
            {
                "label": "label1",
                "dimension": "dimension1",
                "hierarchy": ["hierarchy1"],
            },
            {
                "label": "label2",
                "dimension": "dimension2",
                "hierarchy": ["hierarchy1", "hierarchy2"],
            },
        ]

        assert actual == expected

    def test_get_category_has_no_result(
        self, aws_credentials, setup_env_variables, categories_table
    ):
        self._seed_data(categories_table)

        from api.models.category import get_category

        actual = get_category("foobar", TEST_CATEGORY_VERSION)
        expected = []

        assert actual == expected

    def test_get_all_categories(
        self,
        aws_credentials,
        setup_env_variables,
        categories_table,
    ):
        self._seed_data(categories_table)

        from api.models.category import get_all_categories

        actual = get_all_categories(TEST_CATEGORY_VERSION)
        expected = {
            "Name1": [
                {
                    "label": "label1",
                    "dimension": "dimension1",
                    "hierarchy": ["hierarchy1"],
                },
                {
                    "label": "label2",
                    "dimension": "dimension2",
                    "hierarchy": ["hierarchy1", "hierarchy2"],
                },
            ],
            "Name2": [
                {
                    "label": "label3",
                    "dimension": "dimension3",
                    "hierarchy": ["hierarchy3"],
                }
            ],
        }

        assert actual == expected

    def test_get_all_categories_empty_table(
        self,
        aws_credentials,
        setup_env_variables,
        categories_table,
    ):
        from api.models.category import get_all_categories

        actual = get_all_categories(TEST_CATEGORY_VERSION)
        expected = {}

        assert actual == expected
