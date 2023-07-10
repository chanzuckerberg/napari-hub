import pytest
from moto import mock_dynamodb

from api.models import plugin_blocked
from api.models._tests.conftest import create_dynamo_table


class TestPluginBlocked:

    @pytest.fixture()
    def plugin_blocked_table(self, aws_credentials, dynamo_env_variables):
        with mock_dynamodb():
            yield create_dynamo_table(
                plugin_blocked._PluginBlocked, "plugin-blocked"
            )

    def _put_items(self, table, name, reason=None):
        item = {"name": name}
        if reason:
            item["reason"] = reason
        table.put_item(Item=item)

    def test_get_blocked_plugins(self, plugin_blocked_table):
        self._put_items(plugin_blocked_table, "plugin1")
        self._put_items(plugin_blocked_table, "plugin2", "invalid")
        self._put_items(plugin_blocked_table, "plugin3")

        actual = plugin_blocked.get_blocked_plugins()

        expected = {
            "plugin1": "blocked", "plugin2": "invalid", "plugin3": "blocked"
        }
        assert actual == expected
