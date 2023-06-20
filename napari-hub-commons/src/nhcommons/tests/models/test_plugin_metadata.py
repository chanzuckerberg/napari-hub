import time

import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin_metadata
from nhcommons.models.plugin_utils import PluginMetadataType

TEST_DATA1 = {'foo': 'bar'}
TEST_DATA2 = {'baz': 'aap'}


class TestPluginMetadata:

    @pytest.fixture()
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin_metadata._PluginMetadata,
                                      'plugin-metadata')

    @pytest.mark.parametrize(
        'metadata_type, is_latest, data', [
            (PluginMetadataType.PYPI, True, None),
            (PluginMetadataType.PYPI, False, None),
            (PluginMetadataType.PYPI, None, None),
            (PluginMetadataType.DISTRIBUTION, True, TEST_DATA1),
            (PluginMetadataType.DISTRIBUTION, False, TEST_DATA1),
            (PluginMetadataType.METADATA, True, TEST_DATA1),
            (PluginMetadataType.METADATA, False, TEST_DATA1),
        ]
    )
    def test_put_pypi_record(self, table, metadata_type, is_latest, data):
        start_time = round(time.time() * 1000)
        plugin_metadata.put_plugin_metadata(
            'bar', '7.1', metadata_type, is_latest, data
        )

        response = table.scan()

        assert response['Count'] == 1
        item = response['Items'][0]
        assert item['name'] == 'bar'
        assert item['version_type'] == f'7.1:{self._get_suffix(metadata_type)}'
        assert item.get('is_latest') is (True if is_latest else None)
        assert item.get('data') == data
        assert start_time <= item['last_updated_timestamp'] <= \
               round(time.time() * 1000)

    @pytest.mark.parametrize(
        'data, expected', [
            ([], set()),
            (['PYPI'], {PluginMetadataType.PYPI}),
            (['DISTRIBUTION'], {PluginMetadataType.DISTRIBUTION}),
            (['METADATA'], {PluginMetadataType.METADATA}),
            (['PYPI', 'DISTRIBUTION', 'METADATA'],
             {PluginMetadataType.DISTRIBUTION, PluginMetadataType.PYPI,
              PluginMetadataType.METADATA}),
            (['FOO'], set()),
        ]
    )
    def test_get_plugin_metadata_by_type(self, table, data, expected):
        for record in data:
            table.put_item(Item={
                'name': 'bar', 'version_type': f'0.5.6:{record}', 'type': record
            })

        actual = plugin_metadata.get_existing_types('bar', '0.5.6')

        assert actual == expected

    @classmethod
    def _get_suffix(cls, metadata_type):
        if metadata_type is PluginMetadataType.PYPI:
            return "PYPI"
        elif metadata_type is PluginMetadataType.DISTRIBUTION:
            return "DISTRIBUTION"
        return "METADATA"
