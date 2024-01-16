from unittest.mock import Mock, call

import pytest

import plugin.lambda_adapter
import plugin.classifier_adapter
import plugin.metadata
from nhcommons.models.plugin_utils import PluginMetadataType as PMType

import nhcommons.models.plugin as nh_plugin
import nhcommons.models.plugin_metadata as nh_plugin_metadata
import nhcommons.utils.pypi_adapter as nh_pypi_adapter
import plugin.processor as processor
from utils import zulip

REPO = "https://github.com/chanzuckerberg/foo-demo-1"
DATA = {"name": "foo-demo-1", "author": "hub-team", "code_repository": REPO}
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

    @pytest.fixture
    def mock_classifier_adapter(self, monkeypatch) -> Mock:
        mock = Mock(
            side_effect=lambda _, __: self._is_plugin_live,
            spec=plugin.classifier_adapter,
        )
        monkeypatch.setattr(processor, "is_plugin_live", mock)
        return mock

    @pytest.fixture
    def mock_zulip(self, monkeypatch) -> Mock:
        mock = Mock(spec=zulip)
        monkeypatch.setattr(processor, "zulip", mock)
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
        mock_classifier_adapter,
        mock_zulip,
    ) -> None:
        self._get_latest_plugins = mock_get_latest_plugins
        self._get_all_plugins = mock_get_all_plugins
        self._put_plugin_metadata = mock_put_plugin_metadata
        self._get_existing_types = mock_get_existing_types
        self._get_formatted_metadata = mock_get_formatted_metadata
        self._lambda_adapter = mock_lambda_adapter
        self._classifier_adapter = mock_classifier_adapter
        self._zulip = mock_zulip

    @pytest.fixture
    def verify_calls(self, verify_call):
        default_call_list = [call(PLUGIN, "3.5.7")]
        empty_call_list = [call()]

        def _verify_calls(
            get_existing_types_called: bool = False,
            get_formatted_metadata_called: bool = False,
            lambda_invoked: bool = False,
            put_pm_calls: list = None,
            classifier_adapter_not_called: bool = True,
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
            if classifier_adapter_not_called:
                self._classifier_adapter.assert_not_called()

        return _verify_calls

    def test_all_latest_plugin_in_dynamo(self, verify_calls):
        plugins = {PLUGIN: VERSION, "bar": "2.4.6"}
        self._dynamo_latest_plugins = plugins
        self._pypi_latest_plugins = plugins

        processor.update_plugin()

        verify_calls()
        self._zulip.assert_not_called()

    @pytest.mark.parametrize("is_plugin_live", [False, True])
    def test_stale_plugin_in_dynamo(
        self,
        is_plugin_live,
        verify_calls,
    ):
        self._dynamo_latest_plugins = {PLUGIN: VERSION, "bar": "2.4.6"}
        self._pypi_latest_plugins = {"bar": "2.4.6"}
        self._is_plugin_live = is_plugin_live

        processor.update_plugin()

        if is_plugin_live:
            assert len(self._zulip.method_calls) == 0
            put_pm_calls = []
        else:
            assert len(self._zulip.method_calls) == 1
            self._zulip.plugin_no_longer_on_hub.assert_called_once_with(PLUGIN)
            put_pm_calls = [_create_put_pm_call(PMType.PYPI)]
        verify_calls(put_pm_calls=put_pm_calls, classifier_adapter_not_called=False)
        self._classifier_adapter.assert_called_once_with(PLUGIN, VERSION)

    @pytest.mark.parametrize(
        "existing_types, put_pm_data, formatted_metadata",
        [
            ({PMType.DISTRIBUTION, PMType.METADATA, PMType.PYPI}, None, None),
            ({PMType.DISTRIBUTION, PMType.METADATA}, None, None),
            ({PMType.DISTRIBUTION, PMType.PYPI}, None, None),
            ({PMType.DISTRIBUTION, PMType.PYPI}, None, {}),
            ({PMType.DISTRIBUTION, PMType.PYPI}, DATA, DATA),
            ({PMType.DISTRIBUTION}, None, None),
            ({PMType.DISTRIBUTION}, None, {}),
            ({PMType.DISTRIBUTION}, DATA, DATA),
            ({PMType.METADATA, PMType.PYPI}, None, None),
            ({PMType.METADATA}, None, None),
            ({PMType.PYPI}, None, None),
            ({PMType.PYPI}, None, {}),
            ({PMType.PYPI}, DATA, DATA),
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
        put_plugin_metadata_calls = [_create_put_pm_call(PMType.PYPI, is_latest=True)]
        if put_pm_data:
            put_plugin_metadata_calls.append(
                _create_put_pm_call(PMType.METADATA, data=put_pm_data)
            )
        self._formatted_metadata = formatted_metadata

        processor.update_plugin()

        verify_calls(
            get_existing_types_called=True,
            get_formatted_metadata_called=PMType.METADATA not in existing_types,
            lambda_invoked=PMType.DISTRIBUTION not in existing_types,
            put_pm_calls=put_plugin_metadata_calls,
        )
        if PMType.METADATA not in existing_types and put_pm_data:
            assert len(self._zulip.method_calls) == 1
            self._zulip.new_plugin_on_hub.assert_called_once_with(PLUGIN, VERSION, REPO)
        else:
            self._zulip.assert_not_called()

    @pytest.mark.parametrize(
        "existing_types, put_pm_data, formatted_metadata",
        [
            ({PMType.DISTRIBUTION, PMType.METADATA, PMType.PYPI}, None, None),
            ({PMType.DISTRIBUTION, PMType.METADATA}, None, None),
            ({PMType.DISTRIBUTION, PMType.PYPI}, None, None),
            ({PMType.DISTRIBUTION, PMType.PYPI}, None, {}),
            ({PMType.DISTRIBUTION, PMType.PYPI}, DATA, DATA),
            ({PMType.DISTRIBUTION}, None, None),
            ({PMType.DISTRIBUTION}, None, {}),
            ({PMType.DISTRIBUTION}, DATA, DATA),
            ({PMType.METADATA, PMType.PYPI}, None, None),
            ({PMType.METADATA}, None, None),
            ({PMType.PYPI}, None, None),
            ({PMType.PYPI}, None, {}),
            ({PMType.PYPI}, DATA, DATA),
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
        put_pm_calls = [_create_put_pm_call(PMType.PYPI, is_latest=True)]
        if put_pm_data:
            put_pm_calls.append(_create_put_pm_call(PMType.METADATA, data=put_pm_data))
        put_pm_calls.append(_create_put_pm_call(PMType.PYPI, version=OLD_VERSION))
        self._formatted_metadata = formatted_metadata

        processor.update_plugin()

        verify_calls(
            get_existing_types_called=True,
            get_formatted_metadata_called=PMType.METADATA not in existing_types,
            lambda_invoked=PMType.DISTRIBUTION not in existing_types,
            put_pm_calls=put_pm_calls,
        )
        if PMType.METADATA not in existing_types and put_pm_data:
            assert len(self._zulip.method_calls) == 1
            self._zulip.plugin_updated_on_hub.assert_called_once_with(
                PLUGIN, VERSION, REPO
            )
        else:
            self._zulip.assert_not_called()


def _create_put_pm_call(pm_type, data=None, is_latest=False, version=VERSION) -> call:
    kwargs = {"plugin": PLUGIN, "version": version, "plugin_metadata_type": pm_type}
    if is_latest:
        kwargs["is_latest"] = is_latest

    if data:
        kwargs["data"] = data
    return call(**kwargs)
