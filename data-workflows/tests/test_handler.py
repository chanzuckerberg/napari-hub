from json import JSONDecodeError
from typing import Dict
from unittest.mock import Mock, call

import pytest

import activity.processor
import categories.processor
import plugin.processor
import plugin.aggregator
from handler import handle


@pytest.fixture
def create_dynamo_db_record():
    def _create_dynamo_db_record(name, version_type):
        return {
            "dynamodb": {
                "Keys": {
                    "name": {"S": name},
                    "version_type": {"S": version_type},
                }
            }
        }
    return _create_dynamo_db_record


class TestHandle:
    @pytest.fixture(autouse=True)
    def setup(self, monkeypatch):
        self._update_activity = Mock(spec=activity.processor.update_activity)
        monkeypatch.setattr(
            activity.processor, "update_activity", self._update_activity
        )
        self._seed_s3_categories = Mock(
            spec=categories.processor.seed_s3_categories_workflow
        )
        monkeypatch.setattr(
            categories.processor,
            "seed_s3_categories_workflow",
            self._seed_s3_categories,
        )
        self._update_plugin = Mock(spec=plugin.processor.update_plugin)
        monkeypatch.setattr(
            plugin.processor, 'update_plugin', self._update_plugin
        )
        self._aggregate_plugins = Mock(spec=plugin.aggregator.aggregate_plugins)
        monkeypatch.setattr(
            plugin.aggregator, 'aggregate_plugins', self._aggregate_plugins
        )

    def _verify(self,
                activity_call_count: int = 0,
                s3_seed_call_count: int = 0,
                plugin_call_count: int = 0,
                plugin_aggs_call_count: int = 0):
        assert self._update_activity.call_count == activity_call_count
        assert self._seed_s3_categories.call_count == s3_seed_call_count
        assert self._update_plugin.call_count == plugin_call_count
        assert self._aggregate_plugins.call_count == plugin_aggs_call_count

    @pytest.mark.parametrize(
        "event_type, activity_call, s3_seed_call, plugin_call",
        [
            ("Activity", 1, 0, 0),
            ("AcTiviTy", 1, 0, 0),
            ("ACTIVITY", 1, 0, 0),
            ("seed-s3-categories", 0, 1, 0),
            ("SeEd-S3-cAtEgorIes", 0, 1, 0),
            ("SEED-S3-CATEGORIES", 0, 1, 0),
            ("Plugin", 0, 0, 1),
            ("PlUgiN", 0, 0, 1),
            ("PLUGIN", 0, 0, 1)
        ])
    def test_handle_event_type_in_different_case(self,
                                                 event_type: str,
                                                 activity_call: int,
                                                 s3_seed_call: int,
                                                 plugin_call: int):
        handle({'Records': [{'body': f'{{"type":"{event_type}"}}'}]}, None)

        self._verify(
            activity_call_count=activity_call,
            plugin_call_count=plugin_call,
            s3_seed_call_count=s3_seed_call,
        )

    def test_handle_valid_event_types(self):
        handle({'Records': [
            {'body': '{"type":"activity"}'},
            {"body": '{"type":"seed-s3-categories"}'},
            {'body': '{"type":"plugin"}'}
        ]}, None)
        self._verify(
            activity_call_count=1, s3_seed_call_count=1, plugin_call_count=1
        )

    def test_handle_invalid_json(self):
        with pytest.raises(JSONDecodeError):
            handle({"Records": [{"body": '{"type:"activity"}'}]}, None)
        self._verify()

    @pytest.mark.parametrize(
        "event",
        [
            ({"Records": [{"body": '{"type":"foo"}'},
                          {"body": '{"type":"bar"}'}]}),
            ({"Records": [{"body": '{"type":"foo"}'}]}),
            ({"Records": [{"foo": "bar"}]}),
            ({"Records": []}),
            ({}),
        ],
    )
    def test_handle_invalid_event(self, event: Dict):
        handle(event, None)
        self._verify()

    def test_dynamo_stream_event(self, create_dynamo_db_record):
        records = [
            create_dynamo_db_record("foo", "1.1:PYPI"),
            create_dynamo_db_record("foo", "1.1:METADATA"),
            create_dynamo_db_record("foo", "1.1:DISTRIBUTION"),
            create_dynamo_db_record("bar", "2.3:4:PYPI"),
            create_dynamo_db_record("bar", "2.3:4:DISTRIBUTION"),
        ]
        event = {'Records': records}

        handle(event, None)

        expected = [call("foo", "1.1"), call("bar", "2.3:4")]
        self._aggregate_plugins.call_args_list = expected
        self._verify(plugin_aggs_call_count=1)
