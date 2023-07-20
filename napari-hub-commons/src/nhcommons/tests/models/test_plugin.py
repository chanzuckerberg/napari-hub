import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin


def _put_item(
        table, name, version, is_latest, visibility="PUBLIC", code_repo=None
) -> None:
    item = {
        "name": name,
        "version": version,
        "visibility": visibility,
    }
    if is_latest:
        item["is_latest"] = "True"
    if code_repo:
        item["code_repository"] = code_repo

    table.put_item(Item=item)


class TestPlugin:

    @pytest.fixture()
    def plugin_table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin._Plugin, "plugin")

    @pytest.mark.parametrize(
        "data, expected", [
            ([("bar", "0.8.1", None, "PUBLIC")], {}),
            ([("bar", "0.8.1", None, "HIDDEN")], {}),
            ([("bar", "0.8.1", None, "DISABLED")], {}),
            ([("bar", "0.8.1", None, "BLOCKED")], {}),
            ([
                 ("Foo", "1.1", True, "PUBLIC"),
                 ("gr", "0.8", False, "PUBLIC"),
                 ("napari-demo", "0.1", True, "HIDDEN"),
                 ("baz", "0.3", True, "DISABLED"),
                 ("hap", "6.0", True, "BLOCKED"),
             ],
             {"Foo": "1.1", "baz": "0.3", "napari-demo": "0.1", "hap": "6.0"})
        ]
    )
    def test_get_latest_plugins(self, plugin_table, data, expected):
        for name, version, is_latest, visibility in data:
            _put_item(plugin_table, name, version, is_latest, visibility)

        actual = plugin.get_latest_plugins()
        assert actual == expected

    @pytest.mark.parametrize(
        "data, expected", [
            ([("Foo", "0.8", False, "https://github.com/org1/Foo", "PUBLIC")], {}),
            ([("Foo", "0.8", False, "https://github.com/org1/Foo", "HIDDEN")], {}),
            ([("Foo", "0.8", False, "https://github.com/org1/Foo", "BLOCKED")], {}),
            ([("Foo", "0.8", False, "https://github.com/org1/Foo", "DISABLED")], {}),
            ([("Foo", "0.8", True, None, "PUBLIC")], {}),
            ([("Foo", "0.8", True, None, "HIDDEN")], {}),
            ([("Foo", "0.8", True, None, "BLOCKED")], {}),
            ([("Foo", "0.8", True, None, "DISABLED")], {}),
            ([("Foo", "1.1", True, "https://github.com/org1/foorepo", "PUBLIC")], {"org1/foorepo": "Foo"}),
            ([("Foo", "1.1", True, "https://github.com/org1/foorepo", "HIDDEN")], {"org1/foorepo": "Foo"}),
            ([("Foo", "1.1", True, "https://github.com/org1/foorepo", "BLOCKED")], {"org1/foorepo": "Foo"}),
            ([("Foo", "1.1", True, "https://github.com/org1/foorepo", "DISABLED")], {"org1/foorepo": "Foo"}),
            ([("Foo", "1.1", True, "https://custome.com/org1/foorepo", "HIDDEN")], {"https://custome.com/org1/foorepo": "Foo"})
        ]
    )
    def test_get_plugin_name_by_repo(self, plugin_table, data, expected):
        for name, version, is_latest, visibility, code_repo in data:
            _put_item(
                plugin_table, name, version, is_latest, code_repo, visibility
            )

        actual = plugin.get_plugin_name_by_repo()
        assert actual == expected
