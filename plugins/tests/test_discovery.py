import time
from typing import Callable, Dict
from unittest.mock import Mock

import npe2
import pytest
from moto import mock_dynamodb

TEST_PLUGIN = "test-plugin"
TEST_VERSION = "0.0.1"
TEST_INPUT = {"plugin": TEST_PLUGIN, "version": TEST_VERSION}
VALID_PLUGIN = "napari-demo"
VALID_VERSION = "v0.1.0"


@mock_dynamodb
class TestPluginManifest:
    @pytest.fixture(autouse=True)
    def setup(self, setup_dynamo: Callable) -> None:
        with mock_dynamodb():
            self._table = setup_dynamo()
            yield

    @pytest.fixture
    def put_item(self, create_item: Callable) -> Callable[[Dict], int]:
        def _put_item(data: Dict):
            item = create_item(TEST_PLUGIN, TEST_VERSION, data, True)
            self._table.put_item(Item=item)
            return item["last_updated_timestamp"]

        return _put_item

    def test_discovery_manifest_exists(
            self,
            monkeypatch: pytest.MonkeyPatch,
            put_item: Callable[[Dict], int],
            verify_plugin_item: Callable
    ):
        data = {"foo": "bar"}
        last_updated_ts = put_item(data)

        fetch_manifest_mock = Mock(spec=npe2.fetch_manifest)
        import get_plugin_manifest

        monkeypatch.setattr(get_plugin_manifest, "fetch_manifest", fetch_manifest_mock)
        get_plugin_manifest.generate_manifest(TEST_INPUT, None)

        fetch_manifest_mock.assert_not_called()
        actual = verify_plugin_item(
            self._table, TEST_PLUGIN, TEST_VERSION, last_updated_ts=last_updated_ts
        )
        assert data == actual

    def test_dynamo_accessing_error(self):
        """Ensure dynamo errors outside missing manifest are reraised."""
        self._table.delete()
        with pytest.raises(Exception):
            from get_plugin_manifest import generate_manifest

            generate_manifest(TEST_INPUT, None)

    def test_discovery_failure(self, verify_plugin_item: Callable):
        """Test discovery failure results in error written to manifest file."""
        start_time = round(time.time() * 1000)
        from get_plugin_manifest import generate_manifest

        generate_manifest(TEST_INPUT, None)

        expected_data = {"error": "HTTP Error 404: Not Found"}
        actual = verify_plugin_item(
            self._table, TEST_PLUGIN, TEST_VERSION, start_time=start_time
        )
        assert expected_data == actual

    def test_discovery_success(self, verify_plugin_item: Callable):
        """Test that valid manifest is correctly written to file."""
        start_time = round(time.time() * 1000)
        from get_plugin_manifest import generate_manifest

        generate_manifest({"plugin": VALID_PLUGIN, "version": VALID_VERSION}, None)

        actual = verify_plugin_item(
            self._table, VALID_PLUGIN, VALID_VERSION, start_time=start_time
        )
        assert actual["name"] == "napari-demo"
        assert len(actual["contributions"]["widgets"]) == 1
