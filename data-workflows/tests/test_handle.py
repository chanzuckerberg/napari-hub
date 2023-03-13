from json import JSONDecodeError
from unittest.mock import Mock

import pytest

import activity.processor
import utils.utils

CURRENT_TIMESTAMP = 987654321
LAST_UPDATED_TIMESTAMP = 1234565789


class TestHandle:

    @pytest.fixture(autouse=True)
    def _setup(self, monkeypatch):
        self._set_last_updated_timestamp_mock = Mock()
        monkeypatch.setattr(utils.utils, 'set_last_updated_timestamp', self._set_last_updated_timestamp_mock)
        self._update_install_activity_mock = Mock()
        monkeypatch.setattr(activity.processor, 'update_install_activity', self._update_install_activity_mock)

    def _verify(self, call_count):
        assert self._set_last_updated_timestamp_mock.call_count == call_count
        assert self._update_install_activity_mock.call_count == call_count
        if call_count == 1:
            self._update_install_activity_mock.assert_called_once_with(LAST_UPDATED_TIMESTAMP, CURRENT_TIMESTAMP)
            self._set_last_updated_timestamp_mock.assert_called_once_with(CURRENT_TIMESTAMP)

    def test_handle_valid_activity_event(self, monkeypatch):
        monkeypatch.setattr(utils.utils, 'get_last_updated_timestamp', lambda: LAST_UPDATED_TIMESTAMP)
        monkeypatch.setattr(utils.utils, 'get_current_timestamp', lambda: CURRENT_TIMESTAMP)
        from handler import handle
        handle({'Records': [{'body': '{"type":"activity"}'}, {'body': '{"type":"bar"}'}]}, None)
        self._verify(1)

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
