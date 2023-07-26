from unittest.mock import Mock, call

import pytest

import plugin.lambda_adapter
import plugin.metadata
from nhcommons.models.plugin_utils import PluginMetadataType as pmt

import nhcommons.models.plugin as nh_plugin
import nhcommons.models.plugin_metadata as nh_plugin_metadata
import nhcommons.utils.pypi_adapter as nh_pypi_adapter
import plugin.processor as processor

DATA = {"name": "foo-demo-1", "author": "hub-team"}
PLUGIN = "foo"
OLD_VERSION = "3.5.6"
VERSION = "3.5.7"


class TestProcessor:
    @pytest.fixture
    def mock_get_latest_plugins(self, monkeypatch) -> Mock:
        mock = Mock(
            side_effect=lambda: self._dynamo_latest_plugins,
            spec=nh_plugin.get_latest_plugins,
        )
        monkeypatch.setattr(processor, "get_latest_plugins", mock)
        return mock

    @pytest.fixture
    def mock_get_all_plugins(self, monkeypatch) -> Mock:
        mock = Mock(
            side_effect=lambda: self._pypi_latest_plugins,
            spec=nh_pypi_adapter.get_all_plugins,
        )
        monkeypatch.setattr(nh_pypi_adapter, "get_all_plugins", mock)
        return mock

    @pytest.fixture
    def mock_put_plugin_metadata(self, monkeypatch) -> Mock:
        mock = Mock(spec=nh_plugin_metadata.put_plugin_metadata)
        monkeypatch.setattr(processor, "put_plugin_metadata", mock)
        return mock

    @pytest.fixture
    def mock_get_existing_types(self, monkeypatch) -> Mock:
        mock = Mock(
            side_effect=lambda _, __: self._existing_types,
            spec=nh_plugin_metadata.get_existing_types,
        )
        monkeypatch.setattr(processor, "get_existing_types", mock)
        return mock

    @pytest.fixture
    def mock_get_formatted_metadata(self, monkeypatch) -> Mock:
        mock = Mock(
            side_effect=lambda _, __: self._formatted_metadata,
            spec=plugin.metadata.get_formatted_metadata,
        )
        monkeypatch.setattr(processor, "get_formatted_metadata", mock)
        return mock

    @pytest.fixture
    def mock_lambda_adapter(self, monkeypatch) -> Mock:
        mock = Mock(spec=plugin.lambda_adapter.LambdaAdapter)
        monkeypatch.setattr(processor, "LambdaAdapter", mock)
        return mock

    @pytest.fixture(autouse=True)
    def setup(
        self,
        mock_get_latest_plugins,
        mock_get_all_plugins,
        mock_put_plugin_metadata,
        mock_get_existing_types,
        mock_get_formatted_metadata,
        mock_lambda_adapter,
    ) -> None:
        self._get_latest_plugins = mock_get_latest_plugins
        self._get_all_plugins = mock_get_all_plugins
        self._put_plugin_metadata = mock_put_plugin_metadata
        self._get_existing_types = mock_get_existing_types
        self._get_formatted_metadata = mock_get_formatted_metadata
        self._lambda_adapter = mock_lambda_adapter

    @pytest.fixture
    def verify_calls(self, verify_call):
        default_call_list = [call(PLUGIN, "3.5.7")]
        empty_call_list = [call()]

        def _verify_calls(
            get_existing_types_called: bool = False,
            get_formatted_metadata_called: bool = False,
            lambda_invoked: bool = False,
            put_pm_calls: list = None,
        ) -> None:
            verify_call(True, self._get_latest_plugins, empty_call_list)
            verify_call(True, self._get_all_plugins, empty_call_list)

            verify_call(put_pm_calls, self._put_plugin_metadata, put_pm_calls)

            verify_call(
                get_existing_types_called, self._get_existing_types, default_call_list
            )

            verify_call(
                get_formatted_metadata_called,
                self._get_formatted_metadata,
                default_call_list,
            )

            verify_call(lambda_invoked, self._lambda_adapter, [call()])
            if lambda_invoked:
                assert (
                    default_call_list
                    == self._lambda_adapter.return_value.invoke.call_args_list
                )

        return _verify_calls

    def test_all_latest_plugin_in_dynamo(self, verify_calls):
        plugins = {PLUGIN: VERSION, "bar": "2.4.6"}
        self._dynamo_latest_plugins = plugins
        self._pypi_latest_plugins = plugins

        processor.update_plugin()

        verify_calls()

    def test_stale_plugin_in_dynamo(self, verify_calls):
        self._dynamo_latest_plugins = {PLUGIN: VERSION, "bar": "2.4.6"}
        self._pypi_latest_plugins = {"bar": "2.4.6"}
        put_pm_calls = [_create_ppm_call(pmt.PYPI)]

        processor.update_plugin()

        verify_calls(put_pm_calls=put_pm_calls)

    @pytest.mark.parametrize(
        "existing_types, put_pm_data, formatted_metadata",
        [
            ({pmt.DISTRIBUTION, pmt.METADATA, pmt.PYPI}, None, None),
            ({pmt.DISTRIBUTION, pmt.METADATA}, None, None),
            ({pmt.DISTRIBUTION, pmt.PYPI}, None, None),
            ({pmt.DISTRIBUTION, pmt.PYPI}, None, {}),
            ({pmt.DISTRIBUTION, pmt.PYPI}, DATA, DATA),
            ({pmt.DISTRIBUTION}, None, None),
            ({pmt.DISTRIBUTION}, None, {}),
            ({pmt.DISTRIBUTION}, DATA, DATA),
            ({pmt.METADATA, pmt.PYPI}, None, None),
            ({pmt.METADATA}, None, None),
            ({pmt.PYPI}, None, None),
            ({pmt.PYPI}, None, {}),
            ({pmt.PYPI}, DATA, DATA),
            ({}, None, None),
            ({}, None, {}),
            ({}, DATA, DATA),
        ],
    )
    def test_new_plugin_in_pypi(
        self, existing_types, put_pm_data, formatted_metadata, verify_calls
    ):
        self._dynamo_latest_plugins = {"bar": "2.4.6"}
        self._pypi_latest_plugins = {PLUGIN: VERSION, "bar": "2.4.6"}
        self._existing_types = existing_types
        put_plugin_metadata_calls = [_create_ppm_call(pmt.PYPI, is_latest=True)]
        if put_pm_data:
            put_plugin_metadata_calls.append(
                _create_ppm_call(pmt.METADATA, data=put_pm_data)
            )
        self._formatted_metadata = formatted_metadata

        processor.update_plugin()

        verify_calls(
            get_existing_types_called=True,
            get_formatted_metadata_called=pmt.METADATA not in existing_types,
            lambda_invoked=pmt.DISTRIBUTION not in existing_types,
            put_pm_calls=put_plugin_metadata_calls,
        )

    @pytest.mark.parametrize(
        "existing_types, put_pm_data, formatted_metadata",
        [
            ({pmt.DISTRIBUTION, pmt.METADATA, pmt.PYPI}, None, None),
            ({pmt.DISTRIBUTION, pmt.METADATA}, None, None),
            ({pmt.DISTRIBUTION, pmt.PYPI}, None, None),
            ({pmt.DISTRIBUTION, pmt.PYPI}, None, {}),
            ({pmt.DISTRIBUTION, pmt.PYPI}, DATA, DATA),
            ({pmt.DISTRIBUTION}, None, None),
            ({pmt.DISTRIBUTION}, None, {}),
            ({pmt.DISTRIBUTION}, DATA, DATA),
            ({pmt.METADATA, pmt.PYPI}, None, None),
            ({pmt.METADATA}, None, None),
            ({pmt.PYPI}, None, None),
            ({pmt.PYPI}, None, {}),
            ({pmt.PYPI}, DATA, DATA),
            ({}, None, None),
            ({}, None, {}),
            ({}, DATA, DATA),
        ],
    )
    def test_replace_old_plugin_version_with_new(
        self, existing_types, put_pm_data, formatted_metadata, verify_calls
    ):
        self._dynamo_latest_plugins = {PLUGIN: OLD_VERSION, "bar": "2.4.6"}
        self._pypi_latest_plugins = {PLUGIN: VERSION, "bar": "2.4.6"}
        self._existing_types = existing_types
        put_pm_calls = [_create_ppm_call(pmt.PYPI, is_latest=True)]
        if put_pm_data:
            put_pm_calls.append(_create_ppm_call(pmt.METADATA, data=put_pm_data))
        put_pm_calls.append(_create_ppm_call(pmt.PYPI, version=OLD_VERSION))
        self._formatted_metadata = formatted_metadata

        processor.update_plugin()

        verify_calls(
            get_existing_types_called=True,
            get_formatted_metadata_called=pmt.METADATA not in existing_types,
            lambda_invoked=pmt.DISTRIBUTION not in existing_types,
            put_pm_calls=put_pm_calls,
        )


def _create_ppm_call(pmt, data=None, is_latest=False, version=VERSION) -> call:
    kwargs = {"plugin": PLUGIN, "version": version, "plugin_metadata_type": pmt}
    if is_latest:
        kwargs["is_latest"] = is_latest

    if data:
        kwargs["data"] = data
    return call(**kwargs)
