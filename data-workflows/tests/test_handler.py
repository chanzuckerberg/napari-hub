from json import JSONDecodeError
from unittest.mock import Mock

import pytest

import activity.processor
import handler
import utils.utils

CURRENT_TIMESTAMP = 987654321
LAST_UPDATED_TIMESTAMP = 1234565789


class TestHandle:

    @pytest.fixture(autouse=True)
    def _setup(self, monkeypatch):
        self._parameter_store_adapter_call = Mock()
        monkeypatch.setattr(handler, 'ParameterStoreAdapter', self._parameter_store_adapter_call)
        self._update_install_activity_call = Mock()
        monkeypatch.setattr(activity.processor, 'update_install_activity', self._update_install_activity_call)
        self._update_github_activity_call = Mock()
        monkeypatch.setattr(activity.processor, 'update_github_activity', self._update_github_activity_call)

    def _verify(self, call_count):
        assert self._parameter_store_adapter_call.call_count == call_count
        assert self._update_install_activity_call.call_count == call_count
        assert self._update_github_activity_call.call_count == call_count

    def test_handle_valid_activity_event(self, monkeypatch):
        parameter_store_adapter = Mock(get_last_updated_timestamp=lambda: LAST_UPDATED_TIMESTAMP)
        self._parameter_store_adapter_call.return_value = parameter_store_adapter
        monkeypatch.setattr(utils.utils, 'get_current_timestamp', lambda: CURRENT_TIMESTAMP)

        from handler import handle
        handle({'Records': [{'body': '{"type":"activity"}'}, {'body': '{"type":"bar"}'}]}, None)

        self._verify(1)
        self._update_install_activity_call.assert_called_once_with(LAST_UPDATED_TIMESTAMP, CURRENT_TIMESTAMP)
        self._update_github_activity_call.assert_called_once_with(LAST_UPDATED_TIMESTAMP, CURRENT_TIMESTAMP)
        parameter_store_adapter.set_last_updated_timestamp.assert_called_once_with(CURRENT_TIMESTAMP)

    def test_handle_invalid_json(self):
        with pytest.raises(JSONDecodeError):
            from handler import handle
            handle({'Records': [{'body': '{"type:"activity"}'}]}, None)
        self._verify(0)

    @pytest.mark.parametrize('event', [
        ({'Records': [{'body': '{"type":"foo"}'}, {'body': '{"type":"bar"}'}]}),
        ({'Records': [{'body': '{"type":"foo"}'}]}),
        ({'Records': [{'foo': 'bar'}]}),
        ({'Records': []}),
        ({}),
    ])
    def test_handle_invalid_event(self, event):
        from handler import handle
        handle(event, None)
        self._verify(0)
