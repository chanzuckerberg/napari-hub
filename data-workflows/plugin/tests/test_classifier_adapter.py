from unittest.mock import Mock, call

import pytest

import nhcommons.utils.adapter_helpers
import plugin.classifier_adapter


REPOSITORY = "https://github.com/napari/npe2api"
FILE_NAME = "public/classifiers.json"


class TestClassifierAdapter:
    @pytest.fixture(autouse=True)
    def clear_cache(self):
        plugin.classifier_adapter._get_recent_query_data.cache_clear()

    @pytest.fixture(autouse=True)
    def github_client_helper(self, monkeypatch):
        self._github_client_helper = Mock()
        self._github_client_helper.get_file.side_effect = (
            lambda _, __: self._classifier_json
        )
        self._github_client_helper_call = Mock(
            spec=nhcommons.utils.adapter_helpers.GithubClientHelper,
            return_value=self._github_client_helper,
        )
        monkeypatch.setattr(
            plugin.classifier_adapter,
            "GithubClientHelper",
            self._github_client_helper_call,
        )

    def test_handle_valid_query_data(self):
        self._classifier_json = {"active": {"foo": ["1.0.0", "1.0.1", "1.0.2"]}}
        assert True == plugin.classifier_adapter.is_plugin_live("foo", "1.0.2")
        assert False == plugin.classifier_adapter.is_plugin_live("foo", "1.0.4")
        assert False == plugin.classifier_adapter.is_plugin_live("bar", "1.0.4")
        self._github_client_helper_call.assert_called_once_with(REPOSITORY)
        self._github_client_helper.get_file.assert_called_once_with(FILE_NAME, "json")

    def test_handle_invalid_query_data(self):
        self._classifier_json = {"inactive": []}
        assert False == plugin.classifier_adapter.is_plugin_live("foo", "1.0.2")
        assert False == plugin.classifier_adapter.is_plugin_live("bar", "1.0.2")
        self._github_client_helper_call.assert_called_once_with(REPOSITORY)
        self._github_client_helper.get_file.assert_called_once_with(FILE_NAME, "json")

    def test_is_plugin_live_caching(self):
        self._classifier_json = {"active": {"foo": ["1.0.0", "1.0.1", "1.0.2"]}}
        assert True == plugin.classifier_adapter.is_plugin_live("foo", "1.0.2")
        assert False == plugin.classifier_adapter.is_plugin_live("foo", "1.0.4")
        self._github_client_helper_call.assert_called_once_with(REPOSITORY)
        self._github_client_helper.get_file.assert_called_once_with(FILE_NAME, "json")

    def test_is_plugin_live_does_not_cache_error(self):
        self._classifier_json = None
        assert True == plugin.classifier_adapter.is_plugin_live("foo", "1.0.2")
        self._classifier_json = {"active": {"foo": ["1.0.0", "1.0.1", "1.0.2"]}}
        assert True == plugin.classifier_adapter.is_plugin_live("foo", "1.0.2")
        self._github_client_helper_call.assert_has_calls(
            [call(REPOSITORY), call(REPOSITORY)]
        )
        self._github_client_helper.get_file.assert_has_calls(
            [call(FILE_NAME, "json"), call(FILE_NAME, "json")]
        )
