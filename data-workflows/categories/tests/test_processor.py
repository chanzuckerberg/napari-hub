from typing import Any, Dict
import boto3
import json
import pytest

import categories
from categories.utils import hash_category
from conftest import create_dynamo_table, verify
from moto import mock_dynamodb, mock_s3
from unittest.mock import Mock
from categories.processor import seed_s3_categories_workflow
from nhcommons.models.category import _Category

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
                "label": "label1",
                "hierarchy": ["1", "2", "3"],
            },
            {
                "dimension": "dimension2",
                "label": "label2",
                "hierarchy": ["1", "2"],
            },
        ],
        "Foo Bar": [
            {
                "dimension": "dimension1",
                "label": "label3",
                "hierarchy": ["1", "2"],
            },
        ],
    }
)


def _get_version_hash(category: Dict[str, Any]):
    return f"{TEST_VERSION}:{hash_category(category)}"


@mock_s3
class TestCategoryProcessor:
    @pytest.fixture
    def env_variables(self, monkeypatch):
        monkeypatch.setenv("BUCKET", TEST_BUCKET)
        monkeypatch.setenv("BUCKET_PATH", TEST_BUCKET_PATH)
        monkeypatch.setenv("STACK_NAME", TEST_STACK_NAME)

    @pytest.fixture()
    def table(self, aws_credentials, env_variables):
        with mock_dynamodb():
            yield create_dynamo_table(_Category, "category")

    def _set_up_mock_batch_write(self, monkeypatch):
        self._mock_batch_write = Mock()
        monkeypatch.setattr(
            categories.processor, "batch_write", self._mock_batch_write
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

    def test_write_category_data(self, table, cur_time):
        self._set_up_s3()
        self._seed_data()

        seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)

        expected_list = [
            self.generate_expected("Foo", "dimension1", "label1", ["1", "2", "3"]),
            self.generate_expected("Foo", "dimension2", "label2", ["1", "2"]),
            self.generate_expected("Foo Bar", "dimension1", "label3", ["1", "2"]),
        ]
        verify(expected_list, table, cur_time)

    def test_write_category_data_missing_version(self, table, cur_time):
        with pytest.raises(ValueError):
            seed_s3_categories_workflow("", TEST_CATEGORY_PATH)

        verify([], table, cur_time)

    def test_write_category_data_missing_path(self, table, cur_time):
        with pytest.raises(ValueError):
            seed_s3_categories_workflow(TEST_VERSION, "")

        verify([], table, cur_time)

    def test_write_category_data_missing_required_env(
            self, table, cur_time, monkeypatch
    ):
        monkeypatch.delenv("BUCKET")
        with pytest.raises(ValueError):
            seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)

        verify([], table, cur_time)

    def test_write_category_data_s3_load_error(self, table, cur_time):
        self._set_up_s3()

        seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)

        verify([], table, cur_time)

    def test_write_category_data_batch_write_error(
            self, env_variables, monkeypatch
    ):
        self._set_up_s3()
        monkeypatch.setattr(
            categories.processor, "batch_write", Mock(side_effect=Exception())
        )
        with pytest.raises(Exception):
            seed_s3_categories_workflow(TEST_VERSION, TEST_CATEGORY_PATH)
