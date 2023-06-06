import time
from typing import Any, Dict
import boto3
import json
import pytest

from categories.category_model import CategoryModel
from categories.utils import hash_category
from conftest import create_dynamo_table, verify
from moto import mock_dynamodb, mock_s3
from unittest.mock import Mock
from categories.processor import seed_s3_categories_workflow


TEST_BUCKET = "test-bucket"
TEST_STACK_NAME = "None"
TEST_BUCKET_PATH = "test-path"
TEST_CATEGORY_PATH = "category/EDAM-BIOIMAGING/alpha06.json"
TEST_VERSION = "EDAM-BIOIMAGING:alpha06"
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
    return f"{TEST_VERSION}:{hash_category(category)}"


class BatchWriteMock:
    def __init__(self, commit=Mock(), save=Mock()):
        self.commit = commit
        self.save = save


@mock_s3
class TestCategoryProcessor:
    @pytest.fixture
    def setup_env_variables(self, monkeypatch):
        monkeypatch.setenv("BUCKET", TEST_BUCKET)
        monkeypatch.setenv("BUCKET_PATH", TEST_BUCKET_PATH)
        monkeypatch.setenv("STACK_NAME", TEST_STACK_NAME)

    @pytest.fixture()
    def categories_table(self, aws_credentials, setup_env_variables):
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

    @classmethod
    def generate_expected(cls, name, dimension, label, hierarchy):
        return {
            "name": name.lower().replace(" ", "-"),
            "version_hash": _get_version_hash({
                "dimension": dimension, "label": label, "hierarchy": hierarchy,
            }),
            "version": TEST_VERSION,
            "formatted_name": name,
            "dimension": dimension,
            "label": label,
            "hierarchy": hierarchy,
        }

    def test_write_category_data(
        self, aws_credentials, setup_env_variables, categories_table
    ):
        self._set_up_s3()
        self._seed_data()

        start_time = round(time.time() * 1000)
        seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)

        expected_list = [
            self.generate_expected("Foo", "dimension1", "label", ["1", "2", "3"]),
            self.generate_expected("Foo", "dimension2", "label", ["1", "2"]),
            self.generate_expected("Foo Bar", "dimension1", "label", ["1", "2"]),
        ]
        verify(expected_list, categories_table, start_time)

    def test_write_category_data_missing_version(self, monkeypatch):
        self._set_up_mock_batch_write(monkeypatch)

        with pytest.raises(ValueError):
            seed_s3_categories_workflow("", TEST_CATEGORY_PATH)

        self._mock_batch_write.save.assert_not_called()

    def test_write_category_data_missing_path(self, monkeypatch):
        self._set_up_mock_batch_write(monkeypatch)

        with pytest.raises(ValueError):
            seed_s3_categories_workflow(TEST_VERSION, "")

        self._mock_batch_write.save.assert_not_called()

    def test_write_category_data_missing_required_env(self, monkeypatch):
        self._set_up_mock_batch_write(monkeypatch)

        with pytest.raises(ValueError):
            seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)

        self._mock_batch_write.save.assert_not_called()

    def test_write_category_data_s3_load_error(
        self, aws_credentials, setup_env_variables, categories_table, monkeypatch
    ):
        self._set_up_s3()
        self._set_up_mock_batch_write(monkeypatch)

        seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)

        self._mock_batch_write.save.assert_not_called()

    def test_write_category_data_batch_write_error(
        self, aws_credentials, setup_env_variables, categories_table, monkeypatch
    ):
        self._set_up_s3()
        self._set_up_mock_batch_write(monkeypatch, commit=Mock(side_effect=Exception()))

        with pytest.raises(Exception):
            seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)
