from typing import Dict, Any

import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin
from nhcommons.models.plugin_utils import PluginVisibility as pv

_INDEX_SUBSET = {
    "authors",
    "category",
    "code_repository",
    "description_content_type",
    "description_text",
    "development_status",
    "display_name",
    "error_message",
    "first_released",
    "license",
    "name",
    "npe2",
    "operating_system",
    "plugin_types",
    "python_version",
    "reader_file_extensions",
    "release_date",
    "summary",
    "version",
    "writer_file_extensions",
    "writer_save_layers",
}


def plugin_data(name: str, version: str) -> Dict[str, str]:
    return {
        "name": name,
        "version": version,
        "description_text": f"A napari plugin with name {name} and version {version}",
        "authors": [{"name": "Napari Hub"}],
        "code_repository": f"https://github.com/naparihub/{name}",
        "description_content_type": "text",
        "development_status": ["Development Status :: 2 - Pre-Alpha"],
        "display_name": name.replace("-", " ").capitalize(),
        "first_released": "2021-12-21T11:39:40.715897Z",
        "license": "BSD-3-Clause",
        "npe2": True,
        "operating_system": ["Operating System :: OS Independent"],
        "plugin_types": [],
        "python_version": ">=3.7",
        "reader_file_extensions": ["*.pdb", "*.cif"],
        "release_date": "2022-01-31T17:59:24.494345Z",
        "summary": "A napari plugin that does imaging magic.",
        "writer_file_extensions": [],
        "writer_save_layers": [],
    }


def _to_index_entry(data: Dict, visibility: str):
    entry = {key: val for key, val in data.items() if key in _INDEX_SUBSET}
    entry["visibility"] = visibility
    return entry


def generate_record_and_expected(data, visibility=None, is_latest=None, excluded=None):
    fields = {
        "authors",
        "data",
        "code_repository",
        "display_name",
        "first_released",
        "summary",
        "release_date",
    }
    default_fields = {
        "first_released": "2023-01-01T12:33:40.715897Z",
        "release_date": "2023-01-31T11:59:24.494345Z",
    }
    data_fields = {key: data[key] for key in fields if key in data}

    record = {**default_fields, **data_fields}
    if visibility:
        record["visibility"] = visibility
    if is_latest:
        record["is_latest"] = "True"
    if excluded:
        record["excluded"] = excluded

    default_expected = {"name": "plugin-1", "version": "1.0", "data": {}}
    expected = {**default_expected, **record}
    return record, expected


class TestPlugin:
    @pytest.fixture
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin._Plugin, "plugin")

    @pytest.fixture
    def put_item(self, table):
        def _put_item(
            name: str,
            version: str,
            is_latest: bool = True,
            visibility: str = "PUBLIC",
            code_repo: str = None,
            release_date: str = "2023-06-16",
            data: Dict[str, Any] = None,
        ) -> None:
            item = {
                "name": name,
                "version": version,
                "visibility": visibility,
                "code_repository": code_repo,
                "release_date": release_date,
                "is_latest": "True" if is_latest else None,
                "data": data,
            }
            clean_item = {key: val for key, val in item.items() if val is not None}
            table.put_item(Item=clean_item)

        return _put_item

    @pytest.fixture
    def seed_data(self, put_item):
        put_item(
            "plugin-1",
            "2.1",
            is_latest=False,
            release_date="2022-03-01",
            data=plugin_data("plugin-1", "2.1"),
        )
        put_item(
            "plugin-1",
            "2.2",
            release_date="2023-03-01",
            data=plugin_data("plugin-1", "2.2"),
            is_latest=True
        )
        put_item(
            "Plugin-2",
            "0.0.1",
            is_latest=False,
            code_repo="https://custom.com/org1/foo",
            data=plugin_data("Plugin-2", "0.0.1"),
        )
        put_item(
            "Plugin-2",
            "1.0.0",
            code_repo="https://custom.com/org1/foo",
            data=plugin_data("Plugin-2", "1.0.0"),
        )
        put_item(
            "plugin-3",
            "0.0.1",
            is_latest=False,
            code_repo="https://github.com/org/Plugin3",
            data=plugin_data("plugin-3", "0.0.1"),
        )
        put_item(
            "plugin-3",
            "1.0.0",
            visibility="HIDDEN",
            code_repo="https://github.com/org/Plugin3",
            data=plugin_data("plugin-3", "1.0.0"),
        )
        put_item(
            "plugin-4",
            "0.0.1",
            is_latest=False,
            code_repo="https://github.com/org/Plugin4",
            data=plugin_data("plugin-4", "0.0.1"),
        )
        put_item(
            "plugin-4",
            "1.0.0",
            visibility="HIDDEN",
            code_repo="https://github.com/org/Plugin4",
            data=plugin_data("plugin-4", "1.0.0"),
        )
        put_item(
            "plugin-5",
            "0.0.1",
            is_latest=False,
            code_repo="https://github.com/org/Plugin5",
            data=plugin_data("plugin-5", "0.0.1"),
        )
        put_item(
            "plugin-5",
            "1.0.0",
            visibility="BLOCKED",
            code_repo="https://github.com/org/Plugin5",
            data=plugin_data("plugin-5", "1.0.0"),
        )
        put_item(
            "plugin-6",
            "0.0.1",
            is_latest=False,
            data=plugin_data("plugin-6", "0.0.1"),
        )
        put_item(
            "plugin-6",
            "1.0.0",
        )
        put_item(
            "plugin-7",
            "0.0.1",
            is_latest=False,
            code_repo="https://github.com/org/plugin7",
            data=plugin_data("plugin-7", "0.0.1"),
        )
        put_item(
            "plugin-7",
            "1.0.0",
            is_latest=False,
            code_repo="https://github.com/org/plugin7",
            data=plugin_data("plugin-7", "1.0.0"),
        )

    @pytest.mark.parametrize(
        "visibilities, expected_data",
        [
            (
                set(),
                [
                    (plugin_data("plugin-1", "2.2"), "public"),
                    (plugin_data("Plugin-2", "1.0.0"), "public"),
                    (plugin_data("plugin-3", "1.0.0"), "hidden"),
                    (plugin_data("plugin-4", "1.0.0"), "hidden"),
                    (plugin_data("plugin-5", "1.0.0"), "blocked"),
                ],
            ),
            (
                {pv.PUBLIC},
                [
                    (plugin_data("plugin-1", "2.2"), "public"),
                    (plugin_data("Plugin-2", "1.0.0"), "public"),
                ],
            ),
            (
                {pv.HIDDEN, pv.BLOCKED},
                [
                    (plugin_data("plugin-3", "1.0.0"), "hidden"),
                    (plugin_data("plugin-4", "1.0.0"), "hidden"),
                    (plugin_data("plugin-5", "1.0.0"), "blocked"),
                ],
            ),
        ],
    )
    def test_get_index(self, seed_data, visibilities, expected_data):
        actual = plugin.get_index(visibilities)

        expected = [_to_index_entry(*item) for item in expected_data]
        sorted_actual = sorted(actual, key=lambda p: p["description_text"])
        sorted_expected = sorted(expected, key=lambda p: p["description_text"])
        assert sorted_actual == sorted_expected

    def test_get_latest_plugins(self, seed_data):
        actual = plugin.get_latest_plugins()
        expected = {
            "plugin-1": "2.2",
            "Plugin-2": "1.0.0",
            "plugin-3": "1.0.0",
            "plugin-4": "1.0.0",
            "plugin-5": "1.0.0",
            "plugin-6": "1.0.0",
        }
        assert actual == expected

    def test_get_plugin_name_by_repo(self, seed_data):
        expected = {
            "https://custom.com/org1/foo": "Plugin-2",
            "org/Plugin3": "plugin-3",
            "org/Plugin4": "plugin-4",
            "org/Plugin5": "plugin-5",
        }
        assert plugin.get_plugin_name_by_repo() == expected

    @pytest.mark.parametrize(
        "name, visibilities, expected",
        [
            # Tests for latest plugin with specific visibility is returned
            ("plugin-1", {pv.PUBLIC}, plugin_data("plugin-1", "2.2")),
            ("plugin-1", {pv.HIDDEN}, {}),
            ("plugin-1", {pv.BLOCKED}, {}),
            ("Plugin-2", {pv.PUBLIC}, plugin_data("Plugin-2", "1.0.0")),
            ("plugin-3", {pv.HIDDEN}, plugin_data("plugin-3", "1.0.0")),
            ("plugin-4", {pv.HIDDEN}, plugin_data("plugin-4", "1.0.0")),
            ("plugin-5", {pv.BLOCKED}, plugin_data("plugin-5", "1.0.0")),
            # Tests for latest plugin with any visibility is returned
            ("plugin-1", set(), plugin_data("plugin-1", "2.2")),
            ("Plugin-2", set(), plugin_data("Plugin-2", "1.0.0")),
            ("plugin-3", set(), plugin_data("plugin-3", "1.0.0")),
            ("plugin-4", set(), plugin_data("plugin-4", "1.0.0")),
            ("plugin-5", set(), plugin_data("plugin-5", "1.0.0")),
            # Tests for latest plugin with matching visibility is returned
            (
                "plugin-1",
                {pv.PUBLIC, pv.HIDDEN},
                plugin_data("plugin-1", "2.2"),
            ),
            # Tests when latest plugin does not have data attribute
            ("plugin-6", set(), {}),
            # Tests when no latest plugin record exists
            ("plugin-7", set(), {}),
            # Tests when plugin does not have any record
            ("plugin-8", set(), {}),
        ],
    )
    def test_get_latest_plugin(self, seed_data, name, visibilities, expected):
        assert plugin.get_latest_plugin(name, visibilities) == expected

    @pytest.mark.parametrize(
        "name, version, visibilities, expected",
        [
            # Tests for latest plugin with specific visibility is returned
            (
                "Plugin-2",
                "1.0.0",
                {pv.PUBLIC},
                plugin_data("Plugin-2", "1.0.0"),
            ),
            (
                "plugin-3",
                "1.0.0",
                {pv.HIDDEN},
                plugin_data("plugin-3", "1.0.0"),
            ),
            (
                "plugin-5",
                "1.0.0",
                {pv.BLOCKED},
                plugin_data("plugin-5", "1.0.0"),
            ),
            # Tests for latest plugin with any visibility is returned
            ("plugin-1", "2.1", set(), plugin_data("plugin-1", "2.1")),
            ("Plugin-2", "0.0.1", set(), plugin_data("Plugin-2", "0.0.1")),
            ("plugin-3", "0.0.1", set(), plugin_data("plugin-3", "0.0.1")),
            ("plugin-4", "0.0.1", set(), plugin_data("plugin-4", "0.0.1")),
            ("plugin-5", "0.0.1", set(), plugin_data("plugin-5", "0.0.1")),
            # Tests when latest plugin does not matching visibility
            (
                "Plugin-2",
                "1.0.0",
                {v for v in pv if v != pv.PUBLIC},
                {},
            ),
            (
                "plugin-3",
                "1.0.0",
                {v for v in pv if v != pv.HIDDEN},
                {},
            ),
            (
                "plugin-5",
                "1.0.0",
                {v for v in pv if v != pv.BLOCKED},
                {},
            ),
            # Tests when latest plugin does not have data attribute
            ("plugin-6", "1.0.0", {pv.PUBLIC}, {}),
            ("plugin-6", "1.0.0", set(), {}),
            # Tests when plugin does not have any record
            ("plugin-6", "2.0.0", set(), {}),
        ],
    )
    def test_get_plugin_by_version(
        self, seed_data, name, version, visibilities, expected
    ):
        assert plugin.get_plugin_by_version(name, version, visibilities) == expected

    @pytest.mark.parametrize(
        "name, expected",
        [
            # Tests for plugins with different visibility
            ("Plugin-2", "1.0.0"),
            ("plugin-3", "1.0.0"),
            ("plugin-4", "1.0.0"),
            ("plugin-5", "1.0.0"),
            # Tests when plugin has no latest version
            ("plugin-7", None),
            # Tests when plugin does not have any record
            ("plugin-8", None),
        ],
    )
    def test_get_latest_plugin_version(self, seed_data, name, expected):
        assert plugin.get_latest_version(name) == expected

    @pytest.mark.parametrize(
        "record, expected",
        [
            generate_record_and_expected({}),
            generate_record_and_expected(plugin_data("plugin-1", "1.0")),
            generate_record_and_expected(
                plugin_data("plugin-1", "1.0"), is_latest=True
            ),
            generate_record_and_expected(
                plugin_data("plugin-1", "1.0"), is_latest=True, visibility="public"
            ),
            generate_record_and_expected(
                plugin_data("plugin-1", "1.0"),
                is_latest=True,
                visibility="hidden",
                excluded="hidden",
            ),
            generate_record_and_expected(
                plugin_data("plugin-1", "1.0"), visibility="hidden"
            ),
        ],
    )
    def test_put_plugin(self, table, verify_table_data, record, expected):
        plugin.put_plugin("plugin-1", "1.0", record)
        verify_table_data([expected], table)
