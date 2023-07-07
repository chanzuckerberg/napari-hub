import pytest
from moto import mock_dynamodb

from api.models import plugin_metadata
from api.models._tests.conftest import create_dynamo_table

DATA = {"foo": "bar"}


class TestPluginMetadata:

    @pytest.fixture()
    def plugin_metadata_table(self, aws_credentials, dynamo_env_variables):
        with mock_dynamodb():
            yield create_dynamo_table(
                plugin_metadata._PluginMetadata, "plugin-metadata"
            )

    def _put_items(self, table):
        item = {
            "name": "plugin-1",
            "version_type": "1.1:DISTRIBUTION",
            "version": "1.1",
            "data": DATA
        }
        table.put_item(Item=item)

    @pytest.mark.parametrize("name, version, expected", [
        ("plugin-1", "1.1", DATA),
        ("plugin-1", "1.2", {}),
        ("plugin-2", "1.1", {}),
    ])
    def test_get_blocked_plugins(
            self, plugin_metadata_table, name, version, expected
    ):
        self._put_items(plugin_metadata_table)

        actual = plugin_metadata.get_manifest(name, version)
        assert actual == expected
