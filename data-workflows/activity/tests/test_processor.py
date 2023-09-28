from datetime import datetime
from unittest.mock import Mock

import pytest

import activity.install_activity_model as activity_iam
import activity.github_activity_model as activity_gam
import activity.snowflake_adapter as snowflake
import activity.processor as processor
from activity.install_activity_model import InstallActivityType
from activity.github_activity_model import GitHubActivityType
from utils.utils import ParameterStoreAdapter
from nhcommons.models.plugin import get_plugin_name_by_repo
import nhcommons

START_TIME = 1234567
END_TIME = 1239876

MOCK_DATA = {"foo": datetime.now()}
PLUGINS_WITH_INSTALLS_IN_WINDOW = {
    InstallActivityType.DAY: {"bari": ["data1i", "data2i"]},
    InstallActivityType.MONTH: {"bazi": ["data3i", "data4i"]},
    InstallActivityType.TOTAL: {"hapi": ["data5i"]},
}
PLUGINS_WITH_COMMITS_IN_WINDOW = {
    GitHubActivityType.LATEST: {"barg": ["data1g"]},
    GitHubActivityType.MONTH: {"bazg": ["data3g", "data4g"]},
    GitHubActivityType.TOTAL: {"hapg": ["data5g"]},
}
MOCK_PLUGIN_BY_REPO = {"napari-demo": "chanzuckerberg/napari-demo"}


class TestActivityProcessor:
    def _verify_default(self):
        self._parameter_store.set_last_updated_timestamp.assert_called_once_with(
            END_TIME
        )

    @classmethod
    def _setup_snowflake_response(cls, monkeypatch, data):
        monkeypatch.setattr(
            snowflake, "get_plugins_with_installs_in_window", lambda _, __: data
        )
        monkeypatch.setattr(
            snowflake,
            "get_plugins_install_count_since_timestamp",
            lambda _, iat: PLUGINS_WITH_INSTALLS_IN_WINDOW.get(iat),
        )
        monkeypatch.setattr(
            snowflake, "get_plugins_with_commits_in_window", lambda _, __: data
        )
        monkeypatch.setattr(
            snowflake,
            "get_plugins_commit_count_since_timestamp",
            lambda _, iat: PLUGINS_WITH_COMMITS_IN_WINDOW.get(iat),
        )

    @pytest.fixture(autouse=True)
    def _setup_parameter_store_adapter(self, monkeypatch):
        self._parameter_store = Mock(
            spec=ParameterStoreAdapter,
            get_last_updated_timestamp=lambda: START_TIME,
        )
        monkeypatch.setattr(
            processor, "ParameterStoreAdapter", lambda: self._parameter_store
        )

        yield

        self._verify_default()

    @pytest.fixture(autouse=True)
    def setup_method(self, monkeypatch):
        monkeypatch.setattr(nhcommons.utils, "get_current_timestamp", lambda: END_TIME)
        self._installs_mock = Mock(spec=activity_iam.transform_and_write_to_dynamo)
        self._commits_mock = Mock(spec=activity_gam.transform_and_write_to_dynamo)
        self._plugin_mock = Mock(
            spec=get_plugin_name_by_repo, return_value=MOCK_PLUGIN_BY_REPO
        )

    def test_update_install_activity_with_new_updates(self, monkeypatch):
        self._setup_snowflake_response(monkeypatch, MOCK_DATA)

        monkeypatch.setattr(
            activity_iam, "transform_and_write_to_dynamo", self._installs_mock
        )
        monkeypatch.setattr(
            activity_gam, "transform_and_write_to_dynamo", self._commits_mock
        )
        monkeypatch.setattr(processor, "get_plugin_name_by_repo", self._plugin_mock)

        processor.update_activity()

        assert self._installs_mock.call_count == 3
        for iat in InstallActivityType:
            self._installs_mock.assert_any_call(
                PLUGINS_WITH_INSTALLS_IN_WINDOW[iat], iat
            )
        assert self._commits_mock.call_count == 3
        for gat in GitHubActivityType:
            self._commits_mock.assert_any_call(
                PLUGINS_WITH_COMMITS_IN_WINDOW[gat], gat, MOCK_PLUGIN_BY_REPO
            )
        self._plugin_mock.assert_called_once()

    def test_update_install_activity_with_no_new_updates(self, monkeypatch):
        self._setup_snowflake_response(monkeypatch, [])

        processor.update_activity()

        self._installs_mock.assert_not_called()
        self._commits_mock.assert_not_called()
        self._plugin_mock.assert_not_called()
