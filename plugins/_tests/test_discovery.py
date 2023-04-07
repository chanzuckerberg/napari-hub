import json
from unittest.mock import Mock

import boto3
import pytest
from botocore.exceptions import ClientError
from moto import mock_s3
import get_plugin_manifest

TEST_BUCKET = 'test-bucket'
TEST_BUCKET_PATH = 'test-path'
TEST_PLUGIN = 'test-plugin'
TEST_VERSION = '0.0.1'
TEST_CACHE_PATH = f'cache/{TEST_PLUGIN}/{TEST_VERSION}-manifest.json'
TEST_INPUT = {'plugin': TEST_PLUGIN, 'version': TEST_VERSION}
VALID_PLUGIN = 'napari-demo'
VALID_VERSION = 'v0.1.0'
VALID_CACHE_PATH = f'cache/{VALID_PLUGIN}/{VALID_VERSION}-manifest.json'
VALID_INPUT = {'plugin': VALID_PLUGIN, 'version': VALID_VERSION}
DATA = "foo-bar"


@mock_s3
class TestPluginManifest:

    @pytest.fixture
    def setup_env_variables(self, monkeypatch):
        monkeypatch.setenv('BUCKET', TEST_BUCKET)
        monkeypatch.setenv('BUCKET_PATH', TEST_BUCKET_PATH)

    def _set_up_s3(self, bucket_name=TEST_BUCKET):
        self._s3 = boto3.resource('s3')
        bucket = self._s3.Bucket(bucket_name)
        bucket.create()

    def _get_data_from_s3(self, key):
        return self._s3.Object(TEST_BUCKET, key).get()['Body'].read().decode('utf-8')

    def test_discovery_manifest_exists(self, setup_env_variables, aws_credentials, monkeypatch):
        self._set_up_s3()
        complete_path = f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}'
        self._s3.Object(TEST_BUCKET, complete_path).put(Body=bytes(DATA, 'utf-8'))
        last_modified = self._s3.Object(TEST_BUCKET, complete_path).last_modified
        fetch_manifest_mock = Mock()
        monkeypatch.setattr(get_plugin_manifest, 'fetch_manifest', fetch_manifest_mock)

        from get_plugin_manifest import generate_manifest
        generate_manifest(TEST_INPUT, None)

        fetch_manifest_mock.assert_not_called()
        assert DATA == self._get_data_from_s3(complete_path)
        assert last_modified == self._s3.Object(TEST_BUCKET, complete_path).last_modified

    def test_s3_fetching_error(self, setup_env_variables, aws_credentials):
        """Ensure s3 errors outside of missing manifest are reraised."""
        self._set_up_s3("another_bucket")

        with pytest.raises(ClientError):
            from get_plugin_manifest import generate_manifest
            generate_manifest(TEST_INPUT, None)

    def test_discovery_failure(self, setup_env_variables, aws_credentials):
        """Test discovery failure results in error written to manifest file."""
        self._set_up_s3()
        from get_plugin_manifest import generate_manifest
        generate_manifest(TEST_INPUT, None)

        expected_data = json.dumps({'error': 'HTTP Error 404: Not Found'})
        assert expected_data == self._get_data_from_s3(f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}')

    def test_discovery_success(self, setup_env_variables, aws_credentials):
        """Test that valid manifest is correctly written to file."""
        self._set_up_s3()

        from get_plugin_manifest import generate_manifest
        generate_manifest(VALID_INPUT, None)

        parsed_data = json.loads(self._get_data_from_s3(f'{TEST_BUCKET_PATH}/{VALID_CACHE_PATH}'))
        assert parsed_data['name'] == 'napari-demo'
        assert len(parsed_data['contributions']['widgets']) == 1

    def test_bucket_name_not_set(self):
        with pytest.raises(RuntimeError, match='Bucket name not specified.'):
            from get_plugin_manifest import generate_manifest
            generate_manifest(TEST_INPUT, None)

    def test_file_always_written(self, setup_env_variables, aws_credentials):
        self._set_up_s3()
        # Enabling bucket versioning to retain multiple versions of an object
        self._s3.BucketVersioning(TEST_BUCKET).enable()

        from get_plugin_manifest import generate_manifest
        generate_manifest(VALID_INPUT, None)

        complete_path = f'{TEST_BUCKET_PATH}/{VALID_CACHE_PATH}'
        object_versions = list(self._s3.Bucket(TEST_BUCKET).object_versions.filter(Prefix=complete_path))
        assert len(object_versions) == 2  # Verify the object was overriden once
        actual_data = next(obj for obj in object_versions if not obj.is_latest).get()['Body'].read().decode('utf-8')
        assert '{}' == actual_data  # Verify non latest version has the default value
