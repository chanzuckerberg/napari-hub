from typing import Any, Optional, Callable
from unittest.mock import Mock
import pytest

from nhcommons.models.plugin_utils import PluginMetadataType as PMType
from plugin import aggregator
from plugin.aggregator import _merge_metadata_manifest_categories

PLUGIN = "plugin-1"
VERSION = "2.34"
BLOCKED_PLUGIN = "foo"
DEFAULT_MANIFEST = {"field": "value"}


class TestAggregator:
    @pytest.fixture(autouse=True)
    def get_all_blocked_plugins(self, monkeypatch):
        self._plugins_blocked = Mock(return_value={BLOCKED_PLUGIN, "bar"})
        monkeypatch.setattr(
            aggregator.plugins_blocked, "get_all_blocked_plugins", self._plugins_blocked
        )

    @pytest.fixture(autouse=True)
    def get_latest_version(self, monkeypatch):
        self.plugin_version = VERSION
        self._get_latest_version = Mock(side_effect=lambda _: self.plugin_version)
        monkeypatch.setattr(
            aggregator.plugin, "get_latest_version", self._get_latest_version
        )

    @pytest.fixture(autouse=True)
    def plugin_metadata_query(self, monkeypatch):
        self._plugin_metadata_query = Mock(side_effect=lambda _, __: self._metadata)
        monkeypatch.setattr(
            aggregator.plugin_metadata, "query", self._plugin_metadata_query
        )

    @pytest.fixture(autouse=True)
    def get_formatted_manifest(self, monkeypatch):
        self._formatted_manifest = {}
        self._get_formatted_manifest = Mock(
            side_effect=lambda _, __, ___: self._formatted_manifest
        )
        monkeypatch.setattr(
            aggregator, "get_formatted_manifest", self._get_formatted_manifest
        )

    @pytest.fixture(autouse=True)
    def put_plugin(self, monkeypatch):
        self._put_plugin = Mock()
        monkeypatch.setattr(aggregator.plugin, "put_plugin", self._put_plugin)

    @pytest.fixture
    def plugin_field(self) -> set[str]:
        return {
            "authors",
            "code_repository",
            "display_name",
            "first_released",
            "release_date",
            "summary",
            "visibility",
        }

    @pytest.fixture
    def plugin_data(self) -> dict[str, Any]:
        return {
            "author": [{"name": "awesome author"}],
            "code_repository": "https:www.github.com/chanzuckerberg/plugin-demo",
            "display_name": "Plugin 1",
            "first_released": "2021-12-01 10:00:05",
            "release_date": "2023-02-21 12:32:45",
            "summary": "plugin-summary",
            "another-field": "rich-data",
        }

    @pytest.fixture
    def generate_record(self, plugin_field: set[str]) -> Callable[[dict, dict], dict]:
        def _generate_record(plugin_data: dict, expected_record: dict) -> dict:
            data_field = {**plugin_data, **expected_record}
            result = {"data": data_field}
            for field in plugin_field:
                if field in data_field:
                    result[field] = data_field.get(field)
            for field in {"excluded", "is_latest"}:
                if field in data_field:
                    result[field] = data_field.pop(field)

            aggregate_visibility = self._formatted_manifest.get("visibility")
            if not aggregate_visibility:
                data_field.pop("visibility")
            elif expected_record.get("visibility") == "BLOCKED":
                data_field["visibility"] = aggregate_visibility
            return result

        return _generate_record

    def test_aggregate_for_invalid_plugin_without_version(self):
        self.plugin_version = None
        aggregator.aggregate_plugins({(PLUGIN, None)})
        self._verify(None)

    @pytest.mark.parametrize(
        "version, query_data",
        [
            (None, []),
            (VERSION, []),
            (None, [{"type": PMType.PYPI}]),
            (VERSION, [{"type": PMType.PYPI}]),
            (None, [{"type": PMType.DISTRIBUTION}]),
            (VERSION, [{"type": PMType.DISTRIBUTION}]),
            (None, [{"type": PMType.PYPI}, {"type": PMType.DISTRIBUTION}]),
            (VERSION, [{"type": PMType.PYPI}, {"type": PMType.DISTRIBUTION}]),
        ],
    )
    def test_aggregate_for_insufficient_plugin_metadata(
        self, version: str, query_data: list[dict[str, Any]]
    ):
        self._metadata = query_data
        aggregator.aggregate_plugins({(PLUGIN, version)})
        self._verify(version)

    @pytest.mark.parametrize(
        "version, query_data, manifest",
        [
            (None, [], None),
            (VERSION, [], None),
            (None, [{"type": PMType.DISTRIBUTION}], None),
            (VERSION, [{"type": PMType.DISTRIBUTION}], None),
            (None, [{"type": PMType.DISTRIBUTION, "data": {}}], {}),
            (VERSION, [{"type": PMType.DISTRIBUTION, "data": {}}], {}),
        ],
    )
    def test_aggregate_for_handling_empty_aggregate(
        self, version: str, query_data: list[dict[str, Any]], manifest: Optional[dict]
    ):
        query_data.append({"type": PMType.METADATA, "data": {}})
        self._metadata = query_data
        aggregator.aggregate_plugins({(PLUGIN, version)})
        self._verify(version, formats_manifest=True, manifest=manifest)

    @pytest.mark.parametrize(
        "name, version, pypi_data, formatted_manifest, expected_record",
        [
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"authors": [{"name": "another author"}]},
                {
                    "authors": [{"name": "another author"}],
                    "is_latest": "true",
                    "visibility": "PUBLIC",
                },
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {"code_repository": "https:www.github.com/org-diff/plugin1"},
                {
                    "code_repository": "https:www.github.com/org-diff/plugin1",
                    "visibility": "PUBLIC",
                },
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "PUBLIC", "display_name": "new plugin-name"},
                {
                    "is_latest": "true",
                    "visibility": "PUBLIC",
                    "display_name": "new plugin-name",
                },
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {"visibility": "PUBLIC", "summary": "detailed summary for plugin"},
                {"visibility": "PUBLIC", "summary": "detailed summary for plugin"},
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "HIDDEN"},
                {"is_latest": "true", "visibility": "HIDDEN", "excluded": "HIDDEN"},
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {"visibility": "HIDDEN", "another-field": "data"},
                {"visibility": "HIDDEN", "another-field": "data"},
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "DISABLED"},
                {"is_latest": "true", "visibility": "DISABLED", "excluded": "DISABLED"},
            ),
            (
                PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {"visibility": "DISABLED", "diff-field-name": "value 2"},
                {"visibility": "DISABLED", "diff-field-name": "value 2"},
            ),
            (
                BLOCKED_PLUGIN,
                VERSION,
                {"type": PMType.PYPI, "is_latest": "true"},
                {},
                {"is_latest": "true", "visibility": "BLOCKED", "excluded": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {},
                {"visibility": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                VERSION,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "PUBLIC"},
                {"is_latest": "true", "visibility": "BLOCKED", "excluded": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {"visibility": "HIDDEN"},
                {"visibility": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                VERSION,
                {"type": PMType.PYPI},
                {"visibility": "DISABLED"},
                {"visibility": "BLOCKED"},
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"authors": [{"name": "another author"}]},
                {
                    "authors": [{"name": "another author"}],
                    "is_latest": "true",
                    "visibility": "PUBLIC",
                },
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI},
                {"code_repository": "https:www.github.com/org-diff/plugin1"},
                {
                    "code_repository": "https:www.github.com/org-diff/plugin1",
                    "visibility": "PUBLIC",
                },
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "PUBLIC", "display_name": "new plugin-name"},
                {
                    "is_latest": "true",
                    "visibility": "PUBLIC",
                    "display_name": "new plugin-name",
                },
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI},
                {"visibility": "PUBLIC", "summary": "detailed summary for plugin"},
                {"visibility": "PUBLIC", "summary": "detailed summary for plugin"},
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "HIDDEN"},
                {"is_latest": "true", "visibility": "HIDDEN", "excluded": "HIDDEN"},
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI},
                {"visibility": "HIDDEN", "another-field": "data"},
                {"visibility": "HIDDEN", "another-field": "data"},
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "DISABLED"},
                {"is_latest": "true", "visibility": "DISABLED", "excluded": "DISABLED"},
            ),
            (
                PLUGIN,
                None,
                {"type": PMType.PYPI},
                {"visibility": "DISABLED", "diff-field-name": "value 2"},
                {"visibility": "DISABLED", "diff-field-name": "value 2"},
            ),
            (
                BLOCKED_PLUGIN,
                None,
                {"type": PMType.PYPI, "is_latest": "true"},
                {},
                {"is_latest": "true", "visibility": "BLOCKED", "excluded": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                None,
                {"type": PMType.PYPI},
                {},
                {"visibility": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                None,
                {"type": PMType.PYPI, "is_latest": "true"},
                {"visibility": "PUBLIC"},
                {"is_latest": "true", "visibility": "BLOCKED", "excluded": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                None,
                {"type": PMType.PYPI},
                {"visibility": "HIDDEN"},
                {"visibility": "BLOCKED"},
            ),
            (
                BLOCKED_PLUGIN,
                None,
                {"type": PMType.PYPI},
                {"visibility": "DISABLED"},
                {"visibility": "BLOCKED"},
            ),
        ],
    )
    def test_aggregate_for_valid_data(
        self,
        name: str,
        version: str,
        pypi_data: list[dict[str, Any]],
        formatted_manifest: Optional[dict],
        expected_record: dict,
        plugin_data: dict,
        generate_record: Callable[[dict, dict], dict],
    ):
        self._metadata = [
            {"type": PMType.DISTRIBUTION, "data": DEFAULT_MANIFEST},
            {"type": PMType.METADATA, "data": plugin_data},
            pypi_data,
        ]
        self._formatted_manifest = formatted_manifest

        aggregator.aggregate_plugins({(name, version)})
        self._verify(
            version,
            name=name,
            formats_manifest=True,
            manifest=DEFAULT_MANIFEST,
            record=generate_record(plugin_data, expected_record),
        )

    def _verify(
        self, version, name=PLUGIN, formats_manifest=False, manifest=None, record=None
    ):
        self._plugins_blocked.assert_called_once()
        if not version:
            self._get_latest_version.assert_called_once_with(name)
        else:
            self._get_latest_version.assert_not_called()
        actual_version = version or self.plugin_version
        if actual_version:
            self._plugin_metadata_query.assert_called_once_with(name, actual_version)
        else:
            self._plugin_metadata_query.assert_not_called()
        if formats_manifest:
            self._get_formatted_manifest.assert_called_once_with(
                manifest, name, actual_version
            )
        else:
            self._get_formatted_manifest.assert_not_called()
        if record:
            self._put_plugin.assert_called_once_with(name, actual_version, record)
        else:
            self._put_plugin.assert_not_called()


@pytest.mark.parametrize(
        "meta_category, meta_hierarchy, manifest_category, manifest_hierarchy, expected_category, expected_hierarchy",
        [
            ({}, {}, {}, {}, {}, {}),
            ({'Workflow step': ['Image segmentation']}, {'Workflow step': [['Image segmentation']]}, {}, {}, {'Workflow step': ['Image segmentation']}, {'Workflow step': [['Image segmentation']]}),
            ({}, {}, {'Workflow step': ['Image segmentation']}, {'Workflow step': [['Image segmentation']]}, {'Workflow step': ['Image segmentation']}, {'Workflow step': [['Image segmentation']]})
        ]
)
def test_category_merge(meta_category, meta_hierarchy, manifest_category, manifest_hierarchy, expected_category, expected_hierarchy):
    mock_meta = {'category': meta_category, 'category_hierarchy': meta_hierarchy}
    mock_manifest = {'category': manifest_category, 'category_hierarchy': manifest_hierarchy}

    merged_meta, merged_hierarchy = _merge_metadata_manifest_categories(mock_meta, mock_manifest)
    assert sorted(merged_meta.keys()) == sorted(expected_category.keys())
    for key in merged_meta:
        cat_list = merged_meta[key]
        assert cat_list == expected_category[key]

    assert sorted(merged_hierarchy.keys()) == sorted(expected_hierarchy.keys())
    for key in merged_hierarchy:
        hierarchy_list = merged_hierarchy[key]
        expected_list = expected_hierarchy[key]
        assert hierarchy_list == expected_list
