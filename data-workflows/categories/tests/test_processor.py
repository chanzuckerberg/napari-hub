from typing import Any, Dict
import boto3
import json
import pytest

from categories.category_model import CategoryModel
from categories.utils import hash_category
from conftest import create_dynamo_table
from moto import mock_dynamodb, mock_s3
from unittest.mock import Mock


TEST_BUCKET = "test-bucket"
TEST_STACK_NAME = "None"
TEST_BUCKET_PATH = "test-path"
TEST_CATEGORY_PATH = "category/EDAM-BIOIMAGING/alpha06.json"
TEST_CATEGORY_VERSION = "EDAM-BIOIMAGING:alpha06"
TEST_CATEGORY_DATA = json.dumps(
    {
        "Foo": [
            {
                "dimension": "dimension1",
                "label": "label",
                "hierarchy": ["1", "2", "3"],
            },
            {
                "dimension": "dimension2",
                "label": "label",
                "hierarchy": ["1", "2"],
            },
        ],
        "Foo Bar": [
            {
                "dimension": "dimension1",
                "label": "label",
                "hierarchy": ["1", "2"],
            },
        ],
    }
)


def _get_version_hash(category: Dict[str, Any]):
    hash = hash_category(category)
    return f"{TEST_CATEGORY_VERSION}:{hash}"


class BatchWriteMock:
    def __init__(self, commit=Mock(), save=Mock()):
        self.commit = commit
        self.save = save


@mock_s3
class TestPluginManifest:
    @pytest.fixture
    def setup_env_variables(self, monkeypatch):
        monkeypatch.setenv("BUCKET", TEST_BUCKET)
        monkeypatch.setenv("BUCKET_PATH", TEST_BUCKET_PATH)
        monkeypatch.setenv("STACK_NAME", TEST_STACK_NAME)

    @pytest.fixture()
    def categories_table(self, aws_credentials, setup_env_variables):
        from categories.category_model import CategoryModel

        with mock_dynamodb():
            yield create_dynamo_table(CategoryModel, "category")

    def _set_up_mock_batch_write(self, monkeypatch, commit=Mock(), save=Mock()):
        self._mock_batch_write = BatchWriteMock(commit=commit, save=save)
        monkeypatch.setattr(
            CategoryModel, "batch_write", lambda: self._mock_batch_write
        )

    def _set_up_s3(self, bucket_name=TEST_BUCKET):
        self._s3 = boto3.resource("s3")
        bucket = self._s3.Bucket(bucket_name)
        bucket.create()

    def _seed_data(self):
        complete_path = f"{TEST_BUCKET_PATH}/{TEST_CATEGORY_PATH}"
        self._s3.Object(TEST_BUCKET, complete_path).put(
            Body=bytes(TEST_CATEGORY_DATA, "utf-8")
        )

    def test_write_category_data(
        self,
        aws_credentials,
        setup_env_variables,
        categories_table,
    ):
        self._set_up_s3()
        self._seed_data()

        import categories.processor
        from categories.category_model import CategoryModel

        categories.processor.seed_s3_categories_workflow(
            TEST_CATEGORY_VERSION, TEST_CATEGORY_PATH
        )

        data = list(CategoryModel.scan())
        assert data == [
            CategoryModel(
                name="foo",
                version_hash=_get_version_hash(
                    {
                        "dimension": "dimension1",
                        "label": "label",
                        "hierarchy": ["1", "2", "3"],
                    }
                ),
                version=TEST_CATEGORY_VERSION,
                formatted_name="Foo",
                dimension="dimension1",
                label="label",
                hierarchy=["1", "2", "3"],
            ),
            CategoryModel(
                name="foo",
                version_hash=_get_version_hash(
                    {
                        "dimension": "dimension2",
                        "label": "label",
                        "hierarchy": ["1", "2"],
                    }
                ),
                version=TEST_CATEGORY_VERSION,
                formatted_name="Foo",
                dimension="dimension2",
                label="label",
                hierarchy=["1", "2"],
            ),
            CategoryModel(
                name="foo-bar",
                version=TEST_CATEGORY_VERSION,
                version_hash=_get_version_hash(
                    {
                        "dimension": "dimension1",
                        "label": "label",
                        "hierarchy": ["1", "2"],
                    }
                ),
                formatted_name="Foo Bar",
                dimension="dimension1",
                label="label",
                hierarchy=["1", "2"],
            ),
        ]

    def test_write_category_data_missing_params(self):
        import categories.processor

        with pytest.raises(ValueError):
            categories.processor.seed_s3_categories_workflow("", TEST_CATEGORY_PATH)

        with pytest.raises(ValueError):
            categories.processor.seed_s3_categories_workflow(TEST_CATEGORY_VERSION, "")

    def test_write_category_data_missing_required_env(self):
        import categories.processor

        with pytest.raises(ValueError):
            categories.processor.seed_s3_categories_workflow(
                TEST_CATEGORY_VERSION, TEST_CATEGORY_PATH
            )

    def test_write_category_data_s3_load_error(
        self, aws_credentials, setup_env_variables, categories_table, monkeypatch
    ):
        self._set_up_s3()
        self._set_up_mock_batch_write(monkeypatch)

        import categories.processor

        categories.processor.seed_s3_categories_workflow(
            TEST_CATEGORY_VERSION, TEST_CATEGORY_PATH
        )

        self._mock_batch_write.save.assert_not_called()

    def test_write_category_data_batch_write_error(
        self, aws_credentials, setup_env_variables, categories_table, monkeypatch
    ):
        self._set_up_s3()
        self._set_up_mock_batch_write(monkeypatch, commit=Mock(side_effect=Exception()))

        import categories.processor

        with pytest.raises(Exception):
            categories.processor.seed_s3_categories_workflow(
                TEST_CATEGORY_VERSION, TEST_CATEGORY_PATH
            )
