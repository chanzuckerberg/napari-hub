import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin_blocked


class TestPluginMetadata:
    @pytest.fixture
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin_blocked._PluginBlocked, "plugin-blocked")

    @pytest.fixture()
    def put_item(self, table):
        def _put_item(name: str, reason: str = None) -> None:
            item = {
                "name": name,
                "last_updated_timestamp": 0,
            }
            if reason:
                item["reason"] = reason
            table.put_item(Item=item)

        return _put_item

    @pytest.mark.parametrize(
        "data, expected",
        [
            ([], set()),
            ([["foo"]], {"foo"}),
            ([["bar", "invalid"]], {"bar"}),
            ([["foo"], ["bar", "invalid"]], {"foo", "bar"}),
        ],
    )
    def test_get_all_blocked_plugins(self, data, expected, table, put_item):
        for record in data:
            put_item(*record)

        actual = plugin_blocked.get_all_blocked_plugins()
        assert expected == actual
