import json
import os
import pytest
from unittest import mock
from plugins.get_plugin_manifest import generate_manifest
from botocore.exceptions import ClientError

TEST_PLUGIN = 'test-plugin'
TEST_VERSION = '0.0.1'
TEST_BUCKET = 'test-bucket'
TEST_CACHE_PATH = f'cache/{TEST_PLUGIN}/{TEST_PLUGIN}.{TEST_VERSION}-manifest.json'


def _mock_get_object(Bucket, Key):
    if os.path.exists(Key):
        with open(Key) as fp:
            return json.load(fp)
    else:
        raise ClientError(
            error_response={
                'Error': {
                    'Code': 'NoSuchKey',
                    'Message': 'The specified key does not exist.'
                },
            },
            operation_name='Fake'
        )

def _mock_put_object(Body, Bucket, Key):
    if os.path.exists(Key):
        raise FileExistsError
    else:
        with open(Key, 'w') as fp:
            fp.write(Body)


def test_discovery_manifest_exists(tmp_path):
    """Test we return without writing anything when manifest already exists.
    """
    manifest_pth = tmp_path / TEST_CACHE_PATH
    manifest_pth.parent.mkdir(parents=True)
    manifest_pth.write_text(json.dumps({'error': 'Could not build manifest.'}))
    with mock.patch('plugins.get_plugin_manifest.bucket_path', tmp_path),\
        mock.patch('plugins.get_plugin_manifest.s3') as mock_s3:
        mock_s3.get_object = _mock_get_object
        generate_manifest({'plugin': TEST_PLUGIN, 'version': TEST_VERSION}, None)
    mock_s3.put_object.assert_not_called()

def test_s3_fetching_error(tmp_path):
    """Ensure s3 errors outside of missing manifest are reraised.
    """
    manifest_pth = tmp_path / TEST_CACHE_PATH
    manifest_pth.parent.mkdir(parents=True)
    manifest_pth.write_text(json.dumps({'error': 'Could not build manifest.'}))
    with mock.patch('plugins.get_plugin_manifest.bucket_path', tmp_path),\
        mock.patch('plugins.get_plugin_manifest.s3') as mock_s3:
        def mock_get(Bucket, Key):
            raise ClientError(
                error_response={
                    'Error': {
                        'Code': 'AccessDenied',
                        'Message': 'Access Denied.'
                    },
                },
                operation_name='Fake'
            )
        mock_s3.get_object = mock_get
        with pytest.raises(ClientError):
            generate_manifest({'plugin': TEST_PLUGIN, 'version': TEST_VERSION}, None)

def test_discovery_failure(tmp_path):
    """Test discovery failure results in error written to manifest file.
    """
    manifest_pth = tmp_path / TEST_CACHE_PATH
    manifest_pth.parent.mkdir(parents=True)
    with mock.patch('plugins.get_plugin_manifest.bucket_path', tmp_path),\
        mock.patch('plugins.get_plugin_manifest.s3') as mock_s3:
        mock_s3.get_object = _mock_get_object
        mock_s3.put_object = _mock_put_object
        generate_manifest({'plugin': TEST_PLUGIN, 'version': TEST_VERSION}, None)
    written = json.loads(manifest_pth.read_text())
    assert written['error'] == 'HTTP Error 404: Not Found'

def test_discovery_success(tmp_path):
    """Test that valid manifest is correctly written to file."""
    plugin_name = 'napari-demo'
    plugin_version = 'v0.1.0'

    manifest_pth = tmp_path / f'cache/{plugin_name}/{plugin_name}.{plugin_version}-manifest.json'
    manifest_pth.parent.mkdir(parents=True)
    with mock.patch('plugins.get_plugin_manifest.bucket_path', tmp_path),\
        mock.patch('plugins.get_plugin_manifest.s3') as mock_s3:
        mock_s3.get_object = _mock_get_object
        mock_s3.put_object = _mock_put_object
        generate_manifest({'plugin': plugin_name, 'version': plugin_version}, None)
    written = json.loads(manifest_pth.read_text())
    assert written['name'] == 'napari-demo'    
    assert len(written['contributions']['widgets']) == 1
