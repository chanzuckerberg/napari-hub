from json import JSONDecodeError
from typing import Dict
from unittest.mock import Mock

import pytest

import activity.processor
import categories.processor


class TestHandle:
    @pytest.fixture(autouse=True)
    def setup(self, monkeypatch):
        self._update_activity = Mock(spec=activity.processor.update_activity)
        self._seed_s3_categories_workflow = Mock(
            spec=categories.processor.seed_s3_categories_workflow
        )
        monkeypatch.setattr(
            activity.processor, "update_activity", self._update_activity
        )
        monkeypatch.setattr(
            categories.processor,
            "seed_s3_categories_workflow",
            self._seed_s3_categories_workflow,
        )

    def _verify_update_activity(self, activity_call_count: int = 0):
        assert self._update_activity.call_count == activity_call_count

    def _verify_s3_seed(self, s3_seed_call_count: int = 0):
        assert self._seed_s3_categories_workflow.call_count == s3_seed_call_count

    @pytest.mark.parametrize("event_type", ["Activity", "AcTiviTy", "ACTIVITY"])
    def test_handle_event_type_in_different_case(self, event_type: str):
        from handler import handle

        handle({"Records": [{"body": '{"type":"activity"}'}]}, None)

        self._verify_update_activity(activity_call_count=1)

    def test_handle_activity_event_type(self):
        from handler import handle

        handle(
            {"Records": [{"body": '{"type":"activity"}'}, {"body": '{"type":"bar"}'}]},
            None,
        )
        self._verify_update_activity(activity_call_count=1)

    def test_handle_seed_s3_categories_event_type(self):
        from handler import handle

        handle(
            {
                "Records": [
                    {"body": '{"type":"seed-s3-categories"}'},
                    {"body": '{"type":"bar"}'},
                ]
            },
            None,
        )
        self._verify_s3_seed(s3_seed_call_count=1)

    def test_handle_invalid_json(self):
        with pytest.raises(JSONDecodeError):
            from handler import handle

            handle({"Records": [{"body": '{"type:"activity"}'}]}, None)
        self._verify_update_activity()
        self._verify_s3_seed()

    @pytest.mark.parametrize(
        "event",
        [
            ({"Records": [{"body": '{"type":"foo"}'}, {"body": '{"type":"bar"}'}]}),
            ({"Records": [{"body": '{"type":"foo"}'}]}),
            ({"Records": [{"foo": "bar"}]}),
            ({"Records": []}),
            ({}),
        ],
    )
    def test_handle_invalid_event(self, event: Dict):
        from handler import handle

        handle(event, None)
        self._verify_update_activity()
        self._verify_s3_seed()
