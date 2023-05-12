import pytest

from api.models._tests.conftest import create_dynamo_table
from moto import mock_dynamodb
from unittest.mock import Mock

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
        monkeypatch.setenv("STACK_NAME", TEST_STACK_NAME)

    @pytest.fixture()
    def install_activity_table(self, aws_credentials, setup_env_variables):
        from api.models.category import CategoryModel

        with mock_dynamodb():
            yield create_dynamo_table(CategoryModel, "category")

    def _get_version_hash(self, hash: str) -> str:
        return f"{TEST_CATEGORY_VERSION}:{hash}"

    def _save_models(self):
        from api.models.category import CategoryModel

        CategoryModel(
            name="name1",
            version=TEST_CATEGORY_VERSION,
            version_hash=self._get_version_hash("hash1"),
            formatted_name="Name1",
            dimension="dimension1",
            label="label1",
            hierarchy=["hierarchy1"],
        ).save()
        CategoryModel(
            name="name1",
            version=TEST_CATEGORY_VERSION,
            version_hash=self._get_version_hash("hash2"),
            formatted_name="Name1",
            dimension="dimension2",
            label="label2",
            hierarchy=["hierarchy1", "hierarchy2"],
        ).save()
        CategoryModel(
            name="name2",
            version=TEST_CATEGORY_VERSION,
            version_hash=self._get_version_hash("hash3"),
            formatted_name="Name2",
            dimension="dimension3",
            label="label3",
            hierarchy=["hierarchy3"],
        ).save()

    def test_get_category_has_result(
        self, aws_credentials, setup_env_variables, install_activity_table
    ):
        self._save_models()

        from api.models.category import CategoryModel

        actual = CategoryModel.get_category("name1", TEST_CATEGORY_VERSION)
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

    def test_get_all_categories(
        self,
        aws_credentials,
        setup_env_variables,
        install_activity_table,
    ):
        self._save_models()

        from api.models.category import CategoryModel

        actual = CategoryModel.get_all_categories(TEST_CATEGORY_VERSION)
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
