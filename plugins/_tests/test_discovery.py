import json
import time
from unittest.mock import Mock

import boto3
import pytest
from botocore.exceptions import ClientError
from moto import mock_s3, mock_dynamodb
import moto.dynamodb.urls

TEST_BUCKET = 'test-bucket'
TEST_BUCKET_PATH = 'test-path'
TEST_PLUGIN = 'test-plugin'
TEST_VERSION = '0.0.1'
TEST_CACHE_PATH = f'cache/{TEST_PLUGIN}/{TEST_VERSION}-manifest.json'
TEST_INPUT = {'plugin': TEST_PLUGIN, 'version': TEST_VERSION}
VALID_PLUGIN = 'napari-demo'
VALID_VERSION = 'v0.1.0'
VALID_CACHE_PATH = f'cache/{VALID_PLUGIN}/{VALID_VERSION}-manifest.json'
LOCAL_DYNAMO_HOST = 'http://localhost:1234'
AWS_REGION = 'us-east-1'
STACK_NAME = 'test-stack'


@mock_s3
@mock_dynamodb
class TestPluginManifest:

    @pytest.fixture(autouse=True)
    def setup_local_dynamo(self):
        moto.dynamodb.urls.url_bases.append(LOCAL_DYNAMO_HOST)

    @pytest.fixture(name='env_variables')
    def setup_env_variables(self, monkeypatch):
        monkeypatch.setenv('BUCKET', TEST_BUCKET)
        monkeypatch.setenv('BUCKET_PATH', TEST_BUCKET_PATH)
        monkeypatch.setenv('LOCAL_DYNAMO_HOST', LOCAL_DYNAMO_HOST)
        monkeypatch.setenv('AWS_REGION', AWS_REGION)
        monkeypatch.setenv('STACK_NAME', STACK_NAME)

    def _set_up_s3(self, bucket_name=TEST_BUCKET):
        self._bucket = boto3.resource('s3').Bucket(bucket_name)
        self._bucket.create()

    def _get_data_from_s3(self, key):
        return self._bucket.Object(key).get()['Body'].read().decode('utf-8')

    def _setup_dynamo(self):
        from models.plugin import Plugin
        Plugin.create_table()

        self._table = boto3.resource('dynamodb').Table(f'{STACK_NAME}-plugin')

    def _dynamo_put_item(self, name=TEST_PLUGIN, version=TEST_VERSION, data=None):
        self._table.put_item(Item={
            'name': name,
            'version_type': f'{version}:DISTRIBUTION',
            'data': data,
            'last_updated_timestamp': round(time.time() * 1000)
        })

    def _get_dynamo_item(self, name, version):
        key = {'name': name, 'version_type': f'{version}:DISTRIBUTION'}
        return self._table.get_item(Key=key)['Item']

    def test_discovery_manifest_exists(self, env_variables, aws_credentials, monkeypatch):
        self._set_up_s3()
        self._setup_dynamo()

        data = {'foo': 'bar'}
        data_str = json.dumps(data)
        complete_path = f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}'
        self._bucket.put_object(Key=complete_path, Body=bytes(data_str, 'utf-8'))
        last_modified = self._bucket.Object(complete_path).last_modified
        fetch_manifest_mock = Mock()
        import get_plugin_manifest
        monkeypatch.setattr(get_plugin_manifest, 'fetch_manifest', fetch_manifest_mock)

        self._dynamo_put_item(data=data)
        last_updated_ts = self._get_dynamo_item(TEST_PLUGIN, TEST_VERSION)['last_updated_timestamp']

        from get_plugin_manifest import generate_manifest
        generate_manifest(TEST_INPUT, None)

        fetch_manifest_mock.assert_not_called()
        assert data_str == self._get_data_from_s3(complete_path)
        assert last_modified == self._bucket.Object(complete_path).last_modified
        dynamo_item = self._get_dynamo_item(TEST_PLUGIN, TEST_VERSION)
        assert data == dynamo_item['data']
        assert last_updated_ts == dynamo_item['last_updated_timestamp']

    def test_discovery_manifest_exists_only_in_s3(self, env_variables, aws_credentials, monkeypatch):
        self._set_up_s3()
        self._setup_dynamo()

        data = {'foo': 'bar'}
        data_str = json.dumps(data)

        complete_path = f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}'
        self._bucket.put_object(Key=complete_path, Body=bytes(data_str, 'utf-8'))
        last_modified = self._bucket.Object(complete_path).last_modified
        fetch_manifest_mock = Mock()

        start_time = round(time.time() * 1000)
        import get_plugin_manifest
        monkeypatch.setattr(get_plugin_manifest, 'fetch_manifest', fetch_manifest_mock)
        get_plugin_manifest.generate_manifest(TEST_INPUT, None)

        fetch_manifest_mock.assert_not_called()
        assert data_str == self._get_data_from_s3(complete_path)
        assert last_modified == self._bucket.Object(complete_path).last_modified
        item = self._get_dynamo_item(TEST_PLUGIN, TEST_VERSION)
        assert start_time <= item['last_updated_timestamp']
        assert data == item['data']

    def test_s3_fetching_error(self, env_variables, aws_credentials):
        """Ensure s3 errors outside of missing manifest are reraised."""
        self._set_up_s3("another_bucket")

        with pytest.raises(ClientError):
            from get_plugin_manifest import generate_manifest
            generate_manifest(TEST_INPUT, None)

    def test_discovery_failure(self, env_variables, aws_credentials):
        """Test discovery failure results in error written to manifest file."""
        self._set_up_s3()
        self._setup_dynamo()

        start_time = round(time.time() * 1000)
        from get_plugin_manifest import generate_manifest
        generate_manifest(TEST_INPUT, None)

        expected_data = json.dumps({'error': 'HTTP Error 404: Not Found'})
        assert expected_data == self._get_data_from_s3(f'{TEST_BUCKET_PATH}/{TEST_CACHE_PATH}')
        item = self._get_dynamo_item(TEST_PLUGIN, TEST_VERSION)
        assert start_time <= item['last_updated_timestamp']
        assert expected_data == json.dumps(item['data'])

    def test_discovery_success(self, env_variables, aws_credentials):
        """Test that valid manifest is correctly written to file."""
        self._set_up_s3()
        self._setup_dynamo()

        start_time = round(time.time() * 1000)
        from get_plugin_manifest import generate_manifest
        generate_manifest({'plugin': VALID_PLUGIN, 'version': VALID_VERSION}, None)

        s3_data = json.loads(self._get_data_from_s3(f'{TEST_BUCKET_PATH}/{VALID_CACHE_PATH}'))
        item = self._get_dynamo_item(VALID_PLUGIN, VALID_VERSION)
        dynamo_data = item['data']
        assert s3_data['name'] == 'napari-demo'
        assert len(s3_data['contributions']['widgets']) == 1
        assert dynamo_data['name'] == 'napari-demo'
        assert len(dynamo_data['contributions']['widgets']) == 1
        assert start_time <= item['last_updated_timestamp']

    def test_bucket_name_not_set(self):
        with pytest.raises(RuntimeError, match='Bucket name not specified.'):
            from get_plugin_manifest import generate_manifest
            generate_manifest(TEST_INPUT, None)

    def test_file_always_written(self, env_variables, aws_credentials):
        self._set_up_s3()
        # Enabling bucket versioning to retain multiple versions of an object
        self._bucket.Versioning().enable()
        self._setup_dynamo()

        from get_plugin_manifest import generate_manifest
        generate_manifest({'plugin': VALID_PLUGIN, 'version': VALID_VERSION}, None)

        complete_path = f'{TEST_BUCKET_PATH}/{VALID_CACHE_PATH}'
        object_versions = list(self._bucket.object_versions.filter(Prefix=complete_path))
        assert len(object_versions) == 2  # Verify the object was overriden once
        actual_data = next(obj for obj in object_versions if not obj.is_latest).get()['Body'].read().decode('utf-8')
        assert '{}' == actual_data  # Verify non latest version has the default value
