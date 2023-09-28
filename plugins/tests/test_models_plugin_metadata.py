import time
from typing import Callable

import pytest
from moto import mock_dynamodb

PLUGIN = "napari-demo"
VERSION = "v0.1.0"
DATA_JSON = {"plugin": PLUGIN, "version": VERSION, "foo": "bar"}


class TestPluginMetadata:
    @pytest.fixture(autouse=True)
    def setup(self, setup_dynamo: Callable) -> None:
        with mock_dynamodb():
            self._table = setup_dynamo()
            yield

    @pytest.fixture
    def verify(self, verify_plugin_item: Callable):
        def _verify(start_time: int = None, last_updated_ts: int = None) -> None:
            actual = verify_plugin_item(
                table=self._table,
                name=PLUGIN,
                version=VERSION,
                start_time=start_time,
                last_updated_ts=last_updated_ts,
            )
            assert DATA_JSON == actual

        return _verify

    def test_write_manifest_data_success(self, verify: Callable):
        start_time = round(time.time() * 1000)

        from models.plugin_metadata import write_manifest_data

        write_manifest_data(PLUGIN, VERSION, DATA_JSON)

        verify(start_time=start_time)

    def test_write_manifest_data_failure(self):
        with pytest.raises(Exception):
            from models.plugin_metadata import write_manifest_data

            write_manifest_data(None, None, DATA_JSON)

    def test_is_manifest_exists_with_data(
        self, create_item: Callable, verify: Callable
    ):
        item = create_item(PLUGIN, VERSION, DATA_JSON, True)
        self._table.put_item(Item=item)

        from models.plugin_metadata import is_manifest_exists

        assert is_manifest_exists(PLUGIN, VERSION)

        verify(last_updated_ts=item["last_updated_timestamp"])

    def test_is_manifest_exists_without_data(self):
        from models.plugin_metadata import is_manifest_exists

        assert not is_manifest_exists(PLUGIN, VERSION)
