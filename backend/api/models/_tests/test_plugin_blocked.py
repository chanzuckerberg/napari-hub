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

    @classmethod
    def _put_items(cls, table, data):
        for name, reason in data.items():
            item = {"name": name}
            if reason:
                item["reason"] = reason
            table.put_item(Item=item)

    def test_get_blocked_plugins(self, plugin_blocked_table):
        data = {"plugin1": None, "plugin2": "invalid", "plugin3": None}
        self._put_items(plugin_blocked_table, data)

        actual = plugin_blocked.get_blocked_plugins()

        expected = {
            "plugin1": "blocked", "plugin2": "invalid", "plugin3": "blocked"
        }
        assert actual == expected
