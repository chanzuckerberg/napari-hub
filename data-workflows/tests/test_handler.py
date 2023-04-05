from json import JSONDecodeError
from typing import Dict
from unittest.mock import Mock

import pytest

import activity.processor


class TestHandle:

    @pytest.fixture(autouse=True)
    def setup(self, monkeypatch):
        self._update_activity = Mock(spec=activity.processor.update_activity)
        monkeypatch.setattr(activity.processor, 'update_activity', self._update_activity)

    def _verify(self, activity_call_count: int = 0):
        assert self._update_activity.call_count == activity_call_count

    @pytest.mark.parametrize('event_type', ["Activity", "AcTiviTy", "ACTIVITY"])
    def test_handle_event_type_in_different_case(self, event_type: str):
        from handler import handle
        handle({'Records': [{'body': '{"type":"activity"}'}]}, None)

        self._verify(activity_call_count=1)

    def test_handle_activity_event_type(self):
        from handler import handle
        handle({'Records': [
            {'body': '{"type":"activity"}'},
            {'body': '{"type":"bar"}'}
        ]}, None)
        self._verify(activity_call_count=1)

    def test_handle_invalid_json(self):
        with pytest.raises(JSONDecodeError):
            from handler import handle
            handle({'Records': [{'body': '{"type:"activity"}'}]}, None)
        self._verify()

    @pytest.mark.parametrize('event', [
        ({'Records': [{'body': '{"type":"foo"}'}, {'body': '{"type":"bar"}'}]}),
        ({'Records': [{'body': '{"type":"foo"}'}]}),
        ({'Records': [{'foo': 'bar'}]}),
        ({'Records': []}),
        ({}),
    ])
    def test_handle_invalid_event(self, event: Dict):
        from handler import handle
        handle(event, None)
        self._verify()
