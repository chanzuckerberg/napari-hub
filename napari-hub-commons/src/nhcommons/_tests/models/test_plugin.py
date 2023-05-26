import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin


class TestPlugin:

    @pytest.fixture()
    def plugin_table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin._Plugin, 'plugin')

    @classmethod
    def _put_item(cls, table, name, version, is_latest):
        item = {
            'name': name,
            'version': version
        }
        if is_latest:
            item['is_latest'] = is_latest

        table.put_item(Item=item)

    @pytest.mark.parametrize(
        'data, expected', [
            ([('bar', '0.8.1', None)], {}),
            ([('foo', '1.1', True), ('bar', '0.8.1', False), ('baz', '0.0.3', True)],
             {'foo': '1.1', 'baz': '0.0.3',})
        ]
    )
    def test_get_latest_plugins(self, plugin_table, data, expected):
        for name, version, is_latest in data:
            self._put_item(plugin_table, name, version, is_latest)

        actual = plugin.get_latest_plugins()
        assert actual == expected
