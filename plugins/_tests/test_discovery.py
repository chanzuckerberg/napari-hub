import json
import time
from unittest.mock import Mock
import pytest
from botocore.exceptions import ClientError
from moto import mock_s3, mock_dynamodb

from conftest import (
    TEST_BUCKET_PATH,
    create_plugin_item,
    put_s3_object,
    setup_dynamo,
    setup_s3,
    verify_plugin_item,
)

TEST_PLUGIN = 'test-plugin'
TEST_VERSION = '0.0.1'
TEST_CACHE_PATH = f'cache/{TEST_PLUGIN}/{TEST_VERSION}-manifest.json'
TEST_INPUT = {'plugin': TEST_PLUGIN, 'version': TEST_VERSION}
VALID_PLUGIN = 'napari-demo'
VALID_VERSION = 'v0.1.0'
VALID_CACHE_PATH = f'cache/{VALID_PLUGIN}/{VALID_VERSION}-manifest.json'


@mock_s3
@mock_dynamodb
class TestPluginManifest:

    def _get_data_from_s3(self, key):
        return self._bucket.Object(key).get()['Body'].read().decode('utf-8')

    def _dynamo_put_item(self, name=TEST_PLUGIN, version=TEST_VERSION, data=None):
        item = create_plugin_item(name, version, data, True)
        self._table.put_item(Item=item)
        return item['last_updated_timestamp']

    def test_discovery_manifest_exists(self, env_variables, aws_credentials, monkeypatch):
        self._bucket = setup_s3(monkeypatch)
        self._table = setup_dynamo()

        data = {'foo': 'bar'}
        complete_path = f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}'
        last_modified = put_s3_object(self._bucket, data, complete_path)
        last_updated_ts = self._dynamo_put_item(data=data)

        fetch_manifest_mock = Mock()
        import get_plugin_manifest
        monkeypatch.setattr(get_plugin_manifest, 'fetch_manifest', fetch_manifest_mock)

        from get_plugin_manifest import generate_manifest
        generate_manifest(TEST_INPUT, None)

        fetch_manifest_mock.assert_not_called()
        assert json.dumps(data) == self._get_data_from_s3(complete_path)
        assert last_modified == self._bucket.Object(complete_path).last_modified
        verify_plugin_item(self._table, TEST_PLUGIN, TEST_VERSION, data, last_updated_ts=last_updated_ts)

    def test_discovery_manifest_exists_only_in_s3(self, env_variables, aws_credentials, monkeypatch):
        self._bucket = setup_s3(monkeypatch)
        self._table = setup_dynamo()

        data = {'foo': 'bar'}
        complete_path = f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}'
        last_modified = put_s3_object(self._bucket, data, complete_path)
        fetch_manifest_mock = Mock()

        start_time = round(time.time() * 1000)
        import get_plugin_manifest
        monkeypatch.setattr(get_plugin_manifest, 'fetch_manifest', fetch_manifest_mock)
        get_plugin_manifest.generate_manifest(TEST_INPUT, None)

        fetch_manifest_mock.assert_not_called()
        assert json.dumps(data) == self._get_data_from_s3(complete_path)
        assert last_modified == self._bucket.Object(complete_path).last_modified
        verify_plugin_item(self._table, TEST_PLUGIN, TEST_VERSION, data, start_time=start_time)

    def test_s3_fetching_error(self, env_variables, aws_credentials, monkeypatch):
        """Ensure s3 errors outside of missing manifest are reraised."""
        self._bucket = setup_s3(monkeypatch, 'another_bucket')

        with pytest.raises(ClientError):
            from get_plugin_manifest import generate_manifest
            generate_manifest(TEST_INPUT, None)

    def test_discovery_failure(self, env_variables, aws_credentials, monkeypatch):
        """Test discovery failure results in error written to manifest file."""
        self._bucket = setup_s3(monkeypatch)
        self._table = setup_dynamo()

        start_time = round(time.time() * 1000)
        from get_plugin_manifest import generate_manifest
        generate_manifest(TEST_INPUT, None)

        expected_data = {'error': 'HTTP Error 404: Not Found'}
        actual = self._get_data_from_s3(f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}')
        assert json.dumps(expected_data) == actual
        verify_plugin_item(self._table, TEST_PLUGIN, TEST_VERSION, expected_data, start_time=start_time)

    def test_discovery_success(self, env_variables, aws_credentials, monkeypatch):
        """Test that valid manifest is correctly written to file."""
        self._bucket = setup_s3(monkeypatch)
        self._table = setup_dynamo()

        start_time = round(time.time() * 1000)
        from get_plugin_manifest import generate_manifest
        generate_manifest({'plugin': VALID_PLUGIN, 'version': VALID_VERSION}, None)

        s3_data = json.loads(self._get_data_from_s3(f'{TEST_BUCKET_PATH}/{VALID_CACHE_PATH}'))
        assert s3_data['name'] == 'napari-demo'
        assert len(s3_data['contributions']['widgets']) == 1
        verify_plugin_item(self._table, VALID_PLUGIN, VALID_VERSION, s3_data, start_time=start_time)

    def test_bucket_name_not_set(self):
        with pytest.raises(RuntimeError, match='Bucket name not specified.'):
            from get_plugin_manifest import generate_manifest
            generate_manifest(TEST_INPUT, None)

    def test_file_always_written(self, env_variables, aws_credentials, monkeypatch):
        self._bucket = setup_s3(monkeypatch)
        # Enabling bucket versioning to retain multiple versions of an object
        self._bucket.Versioning().enable()
        self._table = setup_dynamo()

        from get_plugin_manifest import generate_manifest
        generate_manifest({'plugin': VALID_PLUGIN, 'version': VALID_VERSION}, None)

        complete_path = f'{TEST_BUCKET_PATH}/{VALID_CACHE_PATH}'
        object_versions = list(self._bucket.object_versions.filter(Prefix=complete_path))
        assert len(object_versions) == 2  # Verify the object was overriden once
        actual_data = next(obj for obj in object_versions if not obj.is_latest).get()['Body'].read().decode('utf-8')
        assert '{}' == actual_data  # Verify non latest version has the default value
