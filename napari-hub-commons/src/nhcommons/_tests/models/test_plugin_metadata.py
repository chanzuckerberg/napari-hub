import time

import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin_metadata
from nhcommons._tests.conftest import create_dynamo_table


class TestPluginMetadata:

    @pytest.fixture()
    def plugin_metadata_table(self, aws_credentials):
        with mock_dynamodb():
            yield create_dynamo_table(plugin_metadata._PluginMetadata,
                                      'plugin-metadata')

    @pytest.mark.parametrize(
        'input', [True, False, None]
    )
    def test_put_pypi_record(self, plugin_metadata_table, input):
        start_time = round(time.time() * 1000)
        plugin_metadata.put_pypi_record('bar', '0.7.1', input)

        response = plugin_metadata_table.scan()

        assert response['Count'] == 1
        item = response['Items'][0]
        assert item['name'] == 'bar'
        assert item['version_type'] == '0.7.1:PYPI'
        assert item['last_updated_timestamp'] >= start_time
        if input:
            assert item['is_latest'] == input
        else:
            assert item.get('is_latest') is None
