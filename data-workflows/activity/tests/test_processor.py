from datetime import datetime
from unittest.mock import Mock

import pytest

import activity.install_activity_model as activity_iam
import activity.snowflake_adapter
import activity.processor
from activity.install_activity_model import InstallActivityType
import utils.utils

START_TIME = 1234567
END_TIME = 1239876

MOCK_DATA = {'foo': datetime.now()}
PLUGINS_WITH_INSTALLS_IN_WINDOW = {
    InstallActivityType.DAY: {'bar': ["data1", "data2"]},
    InstallActivityType.MONTH: {'baz': ["data3", "data4"]},
    InstallActivityType.TOTAL: {'hap': ["data5"]},
}


class TestActivityProcessor:

    @pytest.fixture(autouse=True)
    def setup_method(self, monkeypatch):
        self._parameter_store_adapter = Mock(spec=utils.utils.ParameterStoreAdapter,
                                             get_last_updated_timestamp=lambda: START_TIME)
        monkeypatch.setattr(activity.processor, 'ParameterStoreAdapter', lambda: self._parameter_store_adapter)

        monkeypatch.setattr(utils.utils, 'get_current_timestamp', lambda: END_TIME)

        monkeypatch.setattr(
            activity.snowflake_adapter, 'get_plugins_install_count_since_timestamp',
            lambda _, iat: PLUGINS_WITH_INSTALLS_IN_WINDOW.get(iat)
        )
        self._transform_and_write_mock = Mock(spec=activity_iam.transform_and_write_to_dynamo)
        monkeypatch.setattr(activity_iam, 'transform_and_write_to_dynamo', self._transform_and_write_mock)

    def test_update_install_activity_with_new_updates(self, monkeypatch):
        monkeypatch.setattr(activity.snowflake_adapter, 'get_plugins_with_installs_in_window', lambda _, __: MOCK_DATA)

        from activity.processor import update_activity
        update_activity()

        assert self._transform_and_write_mock.call_count == 3
        for iat in InstallActivityType:
            self._transform_and_write_mock.assert_any_call(PLUGINS_WITH_INSTALLS_IN_WINDOW[iat], iat)

        self._parameter_store_adapter.set_last_updated_timestamp.assert_called_once_with(END_TIME)

    def test_update_install_activity_with_no_new_updates(self, monkeypatch):
        monkeypatch.setattr(activity.snowflake_adapter, 'get_plugins_with_installs_in_window', lambda _, __: [])

        from activity.processor import update_activity
        update_activity()

        assert self._transform_and_write_mock.call_count == 0
        self._parameter_store_adapter.set_last_updated_timestamp.assert_called_once_with(END_TIME)
