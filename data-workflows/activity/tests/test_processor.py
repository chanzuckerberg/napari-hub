from datetime import datetime
from unittest.mock import Mock

import pytest

import activity.install_activity_model
import activity.snowflake_adapter
from activity.install_activity_model import InstallActivityType

START_TIME = 1234567
END_TIME = 1239876

MOCK_DATA = {'foo': datetime.now()}
plugins_with_installs_in_window = {
    InstallActivityType.DAY: {'bar': ["data1", "data2"]},
    InstallActivityType.MONTH: {'baz': ["data3", "data4"]},
    InstallActivityType.TOTAL: {'hap': ["data5", "data6"]},
}
transform_to_dynamo_records = {
    InstallActivityType.DAY: [Mock(), Mock(), Mock()],
    InstallActivityType.MONTH: [Mock(), Mock()],
    InstallActivityType.TOTAL: [Mock()],
}


class TestActivityProcessor:

    @pytest.fixture(autouse=True)
    def setup_method(self, monkeypatch):
        monkeypatch.setattr(
            activity.snowflake_adapter, 'get_plugins_install_count_since_timestamp',
            lambda _, iat: plugins_with_installs_in_window.get(iat)
        )
        monkeypatch.setattr(
            activity.install_activity_model, 'transform_to_dynamo_records',
            lambda _, iat: transform_to_dynamo_records[iat]
        )
        self._batch_write_to_dynamo_mock = Mock()
        monkeypatch.setattr(activity.install_activity_model, 'batch_write_to_dynamo', self._batch_write_to_dynamo_mock)

    def test_update_install_activity_with_new_updates(self, monkeypatch):
        monkeypatch.setattr(activity.snowflake_adapter, 'get_plugins_with_installs_in_window', lambda _, __: MOCK_DATA)

        from activity.processor import update_install_activity
        update_install_activity(START_TIME, END_TIME)

        assert self._batch_write_to_dynamo_mock.call_count == 3
        for iat in InstallActivityType:
            self._batch_write_to_dynamo_mock.assert_any_call(transform_to_dynamo_records[iat], iat)

    def test_update_install_activity_with_no_new_updates(self, monkeypatch):
        monkeypatch.setattr(activity.snowflake_adapter, 'get_plugins_with_installs_in_window', lambda _, __: [])

        from activity.processor import update_install_activity
        update_install_activity(START_TIME, END_TIME)

        assert self._batch_write_to_dynamo_mock.call_count == 0
