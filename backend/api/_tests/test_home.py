from datetime import datetime
from typing import List, Dict
from unittest.mock import Mock
import pytest
from api import home
from nhcommons.models.plugin_utils import PluginVisibility


def filter_plugins(plugins: List[Dict]):
    for plugin in plugins:
        plugin.pop("plugin_types")
    return plugins


def get_name(plugin: Dict):
    return plugin.get("name")


class TestHomepage:
    @pytest.fixture
    def mock_get_index(self, monkeypatch, index_data):
        get_index = Mock()
        monkeypatch.setattr(home, "get_index", get_index)
        get_index.return_value = index_data.copy()
        return get_index

    @pytest.fixture
    def mock_date_time(self, monkeypatch):
        mock_date_time = Mock()
        monkeypatch.setattr(home, "datetime", mock_date_time)
        return mock_date_time

    @pytest.fixture
    def index_data(self):
        return [
            {
                "authors": [{"name": "author1"}],
                "display_name": "Plugin 1",
                "first_released": "2023-01-21 19:00:01",
                "name": "plugin-1",
                "release_date": "2023-07-02 12:20:01",
                "summary": "A plugin named plugin 1",
                "total_installs": 12,
                "plugin_types": ["reader", "writer"],
            },
            {
                "authors": [{"name": "author2"}],
                "display_name": "Plugin 2",
                "first_released": "2022-02-21 19:00:01",
                "name": "plugin-2",
                "release_date": "2023-07-03 15:20:01",
                "summary": "A plugin named plugin 2",
                "total_installs": 19,
                "plugin_types": ["writer", "sample_data"],
            },
            {
                "authors": [{"name": "author3"}],
                "display_name": "Plugin 3",
                "first_released": "2021-02-21 17:00:00",
                "name": "plugin-3",
                "release_date": "2023-06-03 11:25:00",
                "summary": "A plugin named plugin 3",
                "total_installs": 10,
                "plugin_types": ["widget", "sample_data"],
            },
            {
                "authors": [{"name": "author4"}],
                "display_name": "Plugin 4",
                "first_released": "2022-10-11 27:00:00",
                "name": "plugin-4",
                "release_date": "2022-12-13 13:29:00",
                "summary": "A plugin named plugin 4",
                "total_installs": 200,
                "plugin_types": ["reader", "widget"],
            },
        ]

    def test_invalid_section_names(self, mock_get_index):
        assert {} == home.get_plugin_sections({"foo"})
        mock_get_index.assert_not_called()

    @pytest.mark.parametrize(
        "section, sort_key",
        [
            ("newest", "first_released"),
            ("recently_updated", "release_date"),
            ("top_installed", "total_installs"),
        ],
    )
    def test_valid_section_names(self, section, sort_key, index_data, mock_get_index):
        actual = home.get_plugin_sections({section})

        plugins = sorted(index_data, key=lambda item: item.get(sort_key), reverse=True)[
            0:3
        ]
        expected = {section: {"plugins": filter_plugins(plugins)}}
        assert expected == actual
        mock_get_index.assert_called_once_with(
            include_total_installs=True, visibility_filter={PluginVisibility.PUBLIC}
        )

    @pytest.mark.parametrize(
        "plugin_type, minute, expected",
        [
            ("reader", 1, ["plugin-1", "plugin-4"]),
            ("sample_data", 27, ["plugin-2", "plugin-3"]),
            ("widget", 13, ["plugin-3", "plugin-4"]),
            ("writer", 58, ["plugin-1", "plugin-2"]),
        ],
    )
    def test_valid_plugin_types_section(
        self, plugin_type, minute, expected, index_data, mock_get_index, mock_date_time
    ):
        mock_date_time.now.return_value = datetime(2023, 7, 25, 17, minute, 55)

        actual = home.get_plugin_sections({"plugin_types"})

        plugins = filter(lambda item: item.get("name") in expected, index_data)
        expected_result = {
            "plugin_types": {
                "plugins": filter_plugins(sorted(list(plugins), key=get_name)),
                "type": plugin_type,
            }
        }
        actual["plugin_types"]["plugins"] = sorted(
            actual["plugin_types"]["plugins"], key=get_name
        )
        assert expected_result == actual
        mock_get_index.assert_called_once_with(
            include_total_installs=True, visibility_filter={PluginVisibility.PUBLIC}
        )
