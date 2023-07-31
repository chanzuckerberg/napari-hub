import pytest
from moto import mock_dynamodb

from api.models._tests.conftest import create_dynamo_table
from api.models import plugin


class TestPlugin:

    @pytest.fixture()
    def plugin_table(self, aws_credentials, dynamo_env_variables):
        with mock_dynamodb():
            yield create_dynamo_table(plugin._Plugin, "plugin")

    @pytest.fixture()
    def plugin1_data2_2(self):
        return {
            "authors": [{"name": "Napari Hub"}],
            "code_repository": "https://github.com/naparihub/plugin-1",
            "description_content_type": "text",
            "description_text": "napari plugin with a detailed description.",
            "development_status": ["Development Status :: 2 - Pre-Alpha"],
            "display_name": "Plugin 1",
            "first_released": "2021-12-21T11:39:40.715897Z",
            "license": "BSD-3-Clause",
            "name": "plugin-1",
            "npe2": True,
            "operating_system": ["Operating System :: OS Independent"],
            "plugin_types": ["reader"],
            "python_version": ">=3.7",
            "reader_file_extensions": ["*.pdb", "*.cif"],
            "release_date": "2022-01-31T17:59:24.494345Z",
            "summary": "A napari plugin that does imaging magic.",
            "version": "2.2",
            "writer_file_extensions": [],
            "writer_save_layers": []
        }

    @pytest.fixture()
    def plugin1_data2_3(self, plugin1_data2_2):
        plugin1_data2_2["version"] = "2.3"
        plugin1_data2_2["release_date"] = "2022-02-31T17:59:24.494345Z"
        return plugin1_data2_2

    @pytest.fixture()
    def plugin4_data(self):
        return {
            "authors": "creator-3",
            "category": ["categories for plugin-4"],
            "code_repository": "https://github.com/creator3/plugin4",
            "description_content_type": "text/markdown",
            "description_text": "foo",
            "development_status": ["Development Status :: Beta"],
            "display_name": "Plugin 4",
            "first_released": "2023-06-26T03:23:35",
            "license": "Apache",
            "name": "plugin-4",
            "npe2": False,
            "operating_system": ["Operating System :: Unix"],
            "plugin_types": ["writer", "theme"],
            "python_version": ">=3.9",
            "reader_file_extensions": [],
            "release_date": "2023-07-05T02:30:15",
            "summary": "A summary of the plugin",
            "version": "5.8",
            "writer_file_extensions": [".zarr"],
            "writer_save_layers": ["labels", "image"],
        }

    @pytest.fixture()
    def plugin2_data0_5(self):
        return {"foo": "bar", "release_date": "2025-04-03"}

    @pytest.fixture()
    def plugin2_data1_0_0(self):
        return {"test": "baz", "release_date": "2025-05-03"}

    @pytest.fixture()
    def data(
            self,
            plugin1_data2_2,
            plugin1_data2_3,
            plugin2_data0_5,
            plugin2_data1_0_0,
            plugin4_data
    ):
        return [
            {
                "name": "plugin-1",
                "version": "2.2",
                "visibility": "PUBLIC",
                "data": plugin1_data2_2,
            },
            {
                "name": "plugin-1",
                "version": "2.3",
                "visibility": "PUBLIC",
                "is_latest": "true",
                "data": plugin1_data2_3,
            },
            {
                "name": "plugin-2",
                "version": "0.5",
                "visibility": "HIDDEN",
                "excluded": "HIDDEN",
                "is_latest": "true",
                "data": plugin2_data0_5,
            },
            {
                "name": "plugin-2",
                "version": "1.0.0",
                "visibility": "HIDDEN",
                "excluded": "HIDDEN",
                "is_latest": "true",
                "data": plugin2_data1_0_0,
            },
            {
                "name": "plugin-3",
                "version": "1.5",
                "visibility": "DISABLED",
                "excluded": "DISABLED",
            },
            {
                "name": "plugin-3",
                "version": "1.6",
                "visibility": "DISABLED",
                "excluded": "DISABLED",
                "is_latest": "true",
            },
            {
                "name": "plugin-4",
                "version": "5.0",
                "visibility": "PUBLIC",
                "is_latest": "true",
                "data": plugin4_data,
            },
        ]

    @pytest.fixture()
    def get_fixture(self, request):
        def _get_fixture(name):
            return request.getfixturevalue(name) if name else {}
        return _get_fixture

    @classmethod
    def _put_items(cls, table, data):
        for item in data:
            if item.get("data", {}).get("release_date"):
                item["release_date"] = item["data"]["release_date"]
            table.put_item(Item=item)

    def test_get_latest_by_visibility_default_visibility(
            self, plugin_table, data
    ):
        self._put_items(plugin_table, data)

        actual = plugin.get_latest_by_visibility()

        assert actual == {"plugin-1": "2.3", "plugin-4": "5.0"}

    @pytest.mark.parametrize("visibility", [
        ("PUBLIC", "HIDDEN", "DISABLED"),
    ])
    def test_get_latest_by_visibility_by_visibility_without_data(
            self, plugin_table, visibility
    ):
        actual = plugin.get_latest_by_visibility(visibility)

        assert actual == {}

    @pytest.mark.parametrize("visibility, expected", [
        ("PUBLIC", {"plugin-1": "2.3", "plugin-4": "5.0"}),
        ("HIDDEN", {"plugin-2": "1.0.0"}),
        ("DISABLED", {"plugin-3": "1.6"}),
    ])
    def test_get_latest_by_visibility_by_visibility_with_data(
            self, plugin_table, data, visibility, expected
    ):
        self._put_items(plugin_table, data)

        actual = plugin.get_latest_by_visibility(visibility)
        assert actual == expected

    def test_get_index_with_data(
            self, plugin_table, data, plugin1_data2_3, plugin4_data
    ):
        self._put_items(plugin_table, data)

        actual = plugin.get_index()

        expected = [plugin1_data2_3, plugin4_data]
        sorted(actual, key=lambda item: item["name"])
        sorted(expected, key=lambda item: item["name"])
        assert actual == expected

    def test_get_index_without_data(self, plugin_table):
        actual = plugin.get_index()

        assert actual == []

    @pytest.mark.parametrize("name, version, has_data, fixture_name", [
        ("plugin-1", "2.2", True, "plugin1_data2_2"),
        ("plugin-1", "2.4", False, None),
        ("plugin-2", "0.5", True, "plugin2_data0_5"),
        ("plugin-8", "2.2", False, None),
    ])
    def test_get_plugin_with_version(
            self,
            plugin_table,
            data,
            get_fixture,
            name,
            version,
            has_data,
            fixture_name
    ):
        self._put_items(plugin_table, data)

        actual = plugin.get_plugin(name, version)

        expected = get_fixture(fixture_name)
        assert actual == expected

    @pytest.mark.parametrize("name, has_data, fixture_name", [
        ("plugin-1", True, "plugin1_data2_2"),
        ("plugin-2", True, "plugin2_data1_0_0"),
        ("plugin-8",  False, None),
    ])
    def test_get_plugin_without_version(
            self, plugin_table, data, get_fixture, name, has_data, fixture_name
    ):
        self._put_items(plugin_table, data)

        actual = plugin.get_plugin(name, None)

        expected = get_fixture(fixture_name)
        assert actual == expected

    def test_get_excluded_plugins(self, plugin_table, data):
        self._put_items(plugin_table, data)

        actual = plugin.get_excluded_plugins()

        assert actual == {"plugin-2": "hidden", "plugin-3": "disabled"}

    @pytest.mark.parametrize("name, expected", [
        ("plugin-1", "2.3"),
        ("plugin-2", "1.0.0"),
        ("plugin-8", None),
    ])
    def test_get_excluded_plugins(self, plugin_table, data, name, expected):
        self._put_items(plugin_table, data)

        assert plugin.get_latest_version(name) == expected
