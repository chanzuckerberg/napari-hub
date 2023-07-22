import time
from typing import Dict, List, Union

import pytest
from moto import mock_dynamodb

from nhcommons.models import plugin_metadata
from nhcommons.models.plugin_utils import PluginMetadataType

TEST_DATA1 = {"foo": "bar"}
TEST_DATA2 = {"baz": "aap"}


def get_suffix(metadata_type):
    if metadata_type is PluginMetadataType.PYPI:
        return "PYPI"
    elif metadata_type is PluginMetadataType.DISTRIBUTION:
        return "DISTRIBUTION"
    return "METADATA"


def create_data(name, version, metadata_type, is_latest=False, data=None):
    return {
        "name": name,
        "version": version,
        "type": PluginMetadataType[metadata_type],
        "is_latest": is_latest,
        "last_updated_timestamp": round(time.time() * 1000),
        "data": data
    }


def sort(data: List[Dict]):
    return sorted(data, key=lambda x: x["type"].name)


class TestPluginMetadata:

    @pytest.fixture
    def table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(plugin_metadata._PluginMetadata,
                                      "plugin-metadata")

    @pytest.fixture
    def plugin_1_0_0_1(self):
        return [create_data("plugin-1", "0.0.1", "PYPI")]

    @pytest.fixture
    def plugin_2_0_0_1(self):
        return [
            create_data("plugin-2", "0.0.1", "METADATA", data=TEST_DATA1)
        ]

    @pytest.fixture
    def plugin_3_0_0_1(self):
        return [
            create_data("plugin-3", "0.0.1", "DISTRIBUTION", data=TEST_DATA2)
        ]

    @pytest.fixture
    def plugin_1_0_0_2(self):
        return [
            create_data("plugin-1", "0.0.2", "PYPI", True),
            create_data("plugin-1", "0.0.2", "METADATA", data=TEST_DATA1),
        ]

    @pytest.fixture
    def plugin_2_0_0_2(self):
        return [
            create_data("plugin-2", "0.0.2", "METADATA", data=TEST_DATA2),
            create_data("plugin-2", "0.0.2", "DISTRIBUTION", data=TEST_DATA1),
        ]

    @pytest.fixture
    def plugin_3_0_0_2(self):
        return [
            create_data("plugin-3", "0.0.2", "PYPI", True),
            create_data("plugin-3", "0.0.2", "DISTRIBUTION", data=TEST_DATA2),
        ]

    @pytest.fixture
    def plugin_2_0_0_3(self):
        return [
            create_data("plugin-2", "0.0.3", "PYPI", True, None),
            create_data("plugin-2", "0.0.3", "METADATA", data=TEST_DATA2),
            create_data("plugin-2", "0.0.3", "DISTRIBUTION", data=TEST_DATA1),
        ]

    @pytest.fixture()
    def put_item(self, table):
        def _put_item(name: str,
                      version: str,
                      type: Union[PluginMetadataType, str],
                      data: Dict = None,
                      is_latest: bool = False,
                      last_updated_timestamp: int = 0
                      ):
            item = {
                "last_updated_timestamp": last_updated_timestamp,
                "name": name,
                "version": version,
            }

            if isinstance(type, str):
                item["type"] = type
                item["version_type"] = f"{version}:{type}"
            else:
                item["type"] = type.name
                item["version_type"] = f"{version}:{get_suffix(type)}"

            if data:
                item["data"] = data
            if is_latest:
                item["is_latest"] = is_latest
            table.put_item(Item=item)

        return _put_item

    @pytest.fixture
    def seed_data(self, put_item, plugin_1_0_0_1, plugin_2_0_0_1,
                  plugin_3_0_0_1, plugin_1_0_0_2, plugin_2_0_0_2,
                  plugin_3_0_0_2, plugin_2_0_0_3):
        for records in [plugin_1_0_0_1, plugin_2_0_0_1, plugin_3_0_0_1,
                        plugin_1_0_0_2, plugin_2_0_0_2, plugin_3_0_0_2,
                        plugin_2_0_0_3]:
            for record in records:
                put_item(**record)

    @pytest.mark.parametrize(
        "metadata_type, is_latest, data", [
            (PluginMetadataType.PYPI, True, None),
            (PluginMetadataType.PYPI, False, None),
            (PluginMetadataType.PYPI, None, None),
            (PluginMetadataType.DISTRIBUTION, True, TEST_DATA1),
            (PluginMetadataType.DISTRIBUTION, False, TEST_DATA1),
            (PluginMetadataType.METADATA, True, TEST_DATA1),
            (PluginMetadataType.METADATA, False, TEST_DATA1),
        ]
    )
    def test_put_pypi_record(self, table, metadata_type, is_latest, data):
        start_time = round(time.time() * 1000)
        plugin_metadata.put_plugin_metadata(
            "bar", "7.1", metadata_type, is_latest, data
        )

        response = table.scan()

        assert response["Count"] == 1
        item = response["Items"][0]
        assert item["name"] == "bar"
        assert item["version_type"] == f"7.1:{get_suffix(metadata_type)}"
        assert item.get("is_latest") is (True if is_latest else None)
        assert item.get("data") == data
        assert start_time <= item["last_updated_timestamp"] <= \
               round(time.time() * 1000)

    @pytest.mark.parametrize(
        "plugin, version, expected", [
            ("plugin-5", "0.9", set()),
            ("plugin-1", "0.0.1", {PluginMetadataType.PYPI}),
            ("plugin-2", "0.0.1", {PluginMetadataType.METADATA}),
            ("plugin-3", "0.0.1", {PluginMetadataType.DISTRIBUTION}),
            ("plugin-1", "0.0.2", {PluginMetadataType.PYPI,
                                   PluginMetadataType.METADATA}),
            ("plugin-2", "0.0.2", {PluginMetadataType.METADATA,
                                   PluginMetadataType.DISTRIBUTION}),
            ("plugin-3", "0.0.2", {PluginMetadataType.DISTRIBUTION,
                                   PluginMetadataType.PYPI}),
            ("plugin-2", "0.0.3", {PluginMetadataType.DISTRIBUTION,
                                   PluginMetadataType.PYPI,
                                   PluginMetadataType.METADATA}),
        ]
    )
    def test_get_existing_types(self, seed_data, plugin, version, expected):
        actual = plugin_metadata.get_existing_types(plugin, version)

        assert actual == expected

    @pytest.mark.parametrize(
        "plugin, version", [
            (None, None,), ("", None), (None, ""), ("", ""),
        ]
    )
    def test_query_invalid_values(self, seed_data, plugin, version):
        assert plugin_metadata.query(plugin, version) == []

    @pytest.mark.parametrize(
        "plugin, version, expected", [
            ("plugin-1", "0.0.1", "plugin_1_0_0_1"),
            ("plugin-2", "0.0.1", "plugin_2_0_0_1"),
            ("plugin-3", "0.0.1", "plugin_3_0_0_1"),
            ("plugin-1", "0.0.2", "plugin_1_0_0_2"),
            ("plugin-2", "0.0.2", "plugin_2_0_0_2"),
            ("plugin-3", "0.0.2", "plugin_3_0_0_2"),
            ("plugin-2", "0.0.3", "plugin_2_0_0_3"),
        ]
    )
    def test_query(self, seed_data, plugin, version, expected, request):
        actual = plugin_metadata.query(plugin, version)
        assert sort(actual) == sort(request.getfixturevalue(expected))
