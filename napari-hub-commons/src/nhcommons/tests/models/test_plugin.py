import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin


def _put_item(
    table,
    name,
    version,
    is_latest,
    visibility="PUBLIC",
    code_repo=None,
    release_date=None,
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
    if release_date:
        item["release_date"] = release_date

    table.put_item(Item=item)


class TestPlugin:
    @pytest.fixture()
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin._Plugin, "plugin")

    @pytest.mark.parametrize(
        "data, expected",
        [
            ([("bar", "0.8.1", None, "PUBLIC")], {}),
            ([("bar", "0.8.1", None, "HIDDEN")], {}),
            ([("bar", "0.8.1", None, "DISABLED")], {}),
            ([("bar", "0.8.1", None, "BLOCKED")], {}),
            (
                [
                    ("Foo", "1.1", True, "PUBLIC"),
                    ("gr", "0.8", False, "PUBLIC"),
                    ("napari-demo", "0.1", True, "HIDDEN"),
                    ("baz", "0.3", True, "DISABLED"),
                    ("hap", "6.0", True, "BLOCKED"),
                ],
                {"Foo": "1.1", "baz": "0.3", "napari-demo": "0.1", "hap": "6.0"},
            ),
        ],
    )
    def test_get_latest_plugins(self, table, data, expected):
        for name, version, is_latest, visibility in data:
            _put_item(table, name, version, is_latest, visibility)

        actual = plugin.get_latest_plugins()
        assert actual == expected

    @pytest.mark.parametrize(
        "data, expected",
        [
            ([("Foo", "0.8", False, "PUBLIC", "https://github.com/org1/Foo")], {}),
            ([("Foo", "0.8", False, "HIDDEN", "https://github.com/org1/Foo")], {}),
            ([("Foo", "0.8", False, "BLOCKED", "https://github.com/org1/Foo")], {}),
            ([("Foo", "0.8", False, "DISABLED", "https://github.com/org1/Foo")], {}),
            ([("Foo", "0.8", True, "PUBLIC", None)], {}),
            ([("Foo", "0.8", True, "HIDDEN", None)], {}),
            ([("Foo", "0.8", True, "BLOCKED", None)], {}),
            ([("Foo", "0.8", True, "DISABLED", None)], {}),
            (
                [("Foo", "1.1", True, "PUBLIC", "https://github.com/org1/foorepo")],
                {"org1/foorepo": "Foo"},
            ),
            (
                [("Foo", "1.1", True, "HIDDEN", "https://github.com/org1/foorepo")],
                {"org1/foorepo": "Foo"},
            ),
            (
                [("Foo", "1.1", True, "BLOCKED", "https://github.com/org1/foorepo")],
                {"org1/foorepo": "Foo"},
            ),
            (
                [("Foo", "1.1", True, "DISABLED", "https://github.com/org1/foorepo")],
                {"org1/foorepo": "Foo"},
            ),
            (
                [("Foo", "1.1", True, "HIDDEN", "https://custome.com/org1/foorepo")],
                {"https://custome.com/org1/foorepo": "Foo"},
            ),
        ],
    )
    def test_get_plugin_name_by_repo(self, table, data, expected):
        for name, version, is_latest, code_repo, visibility in data:
            _put_item(table, name, version, is_latest, code_repo, visibility)

        actual = plugin.get_plugin_name_by_repo()
        assert actual == expected

    @pytest.mark.parametrize(
        "name, expected",
        [
            ("plugin-1", "2.3"),
            ("plugin-2", "1.0.0"),
            ("plugin-8", None),
        ],
    )
    def test_get_excluded_plugins(self, table, name, expected):
        _put_item(table, "plugin-1", "2.1", False, release_date="2022-03-01")
        _put_item(table, "plugin-1", "2.2", True, release_date="2023-03-01")
        _put_item(table, "plugin-1", "2.3", True, release_date="2023-04-01")
        _put_item(table, "plugin-2", "0.0.1", False, release_date="2022-06-21")
        _put_item(table, "plugin-2", "1.0.0", True, release_date="2022-06-21")

        assert plugin.get_latest_version(name) == expected
