import json
import time

import pytest
from moto import mock_dynamodb, mock_s3

from conftest import TEST_BUCKET_PATH, create_plugin_item, setup_dynamo, verify_plugin_item, \
    setup_s3, put_s3_object

PLUGIN = 'napari-demo'
VERSION = 'v0.1.0'
DATA_JSON = {'plugin': PLUGIN, 'version': VERSION, 'foo': 'bar'}
DATA_STR = json.dumps(DATA_JSON)


@mock_dynamodb
@mock_s3
class TestPluginModel:

    def _setup_s3(self, monkeypatch, complete_path):
        self._bucket = setup_s3(monkeypatch)
        self._last_modified = put_s3_object(self._bucket, DATA_JSON, complete_path)

    def _verify(self, start_time=None, last_updated_ts=None):
        verify_plugin_item(table=self._table,
                           name=PLUGIN,
                           version=VERSION,
                           data=DATA_JSON,
                           start_time=start_time,
                           last_updated_ts=last_updated_ts)

    def test_write_manifest_data_success(self, env_variables, aws_credentials):
        self._table = setup_dynamo()
        start_time = round(time.time() * 1000)

        from models.pluginmetadata import PluginMetadata
        PluginMetadata.write_manifest_data(PLUGIN, VERSION, DATA_STR)

        self._verify(start_time=start_time)

    def test_write_manifest_data_failure(self, env_variables, aws_credentials):
        with pytest.raises(Exception):
            from models.pluginmetadata import PluginMetadata
            PluginMetadata.write_manifest_data(PLUGIN, VERSION, DATA_STR)

    def test_verify_exists_in_dynamo_already_exists(self, env_variables, aws_credentials):
        self._table = setup_dynamo()
        item = create_plugin_item(PLUGIN, VERSION, DATA_JSON, True)
        self._table.put_item(Item=item)

        from models.pluginmetadata import PluginMetadata
        PluginMetadata.verify_exists_in_dynamo(PLUGIN, VERSION, 'foo')

        self._verify(last_updated_ts=item['last_updated_timestamp'])

    def test_verify_exists_in_dynamo_doesnt_exists(self, env_variables, aws_credentials, monkeypatch):
        path = 'foobar'
        complete_path = f'{TEST_BUCKET_PATH}/{path}'
        self._table = setup_dynamo()
        self._setup_s3(monkeypatch, complete_path)

        start_time = round(time.time() * 1000)
        from models.pluginmetadata import PluginMetadata
        PluginMetadata.verify_exists_in_dynamo(PLUGIN, VERSION, path)

        self._verify(start_time=start_time)
        assert self._last_modified == self._bucket.Object(complete_path).last_modified
