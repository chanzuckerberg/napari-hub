import json
import time
from json import JSONDecodeError

import boto3
import pytest
from moto import mock_ssm

import utils.utils

STACK_NAME = 'foo-bar'
EXPECTED_PARAMETER_NAME = f'/{STACK_NAME}/napari-hub/data-workflows/config'
TIMESTAMP = 1232453543
PARAMETER_STORE_VALUE = json.dumps({'last_activity_fetched_timestamp': TIMESTAMP})


class TestParameterStore:

    @pytest.fixture(autouse=True)
    def _setup_and_tear_down(self, monkeypatch):
        monkeypatch.setenv('STACK_NAME', STACK_NAME)

    @mock_ssm
    def test_get_last_updated_timestamp_valid(self, aws_credentials):
        self._client = boto3.client("ssm")
        self._client.put_parameter(Name=EXPECTED_PARAMETER_NAME, Value=PARAMETER_STORE_VALUE, Type='SecureString')

        from utils.utils import ParameterStoreAdapter
        actual = ParameterStoreAdapter().get_last_updated_timestamp()

        assert actual == TIMESTAMP

    @mock_ssm
    def test_get_last_updated_timestamp_invalid(self, aws_credentials):
        self._client = boto3.client("ssm")
        self._client.put_parameter(Name=EXPECTED_PARAMETER_NAME, Value="foo-bar", Type='SecureString')

        with pytest.raises(JSONDecodeError):
            from utils.utils import ParameterStoreAdapter
            ParameterStoreAdapter().get_last_updated_timestamp()

    @mock_ssm
    def test_set_last_updated_timestamp(self, aws_credentials):
        self._client = boto3.client("ssm")
        self._client.put_parameter(Name=EXPECTED_PARAMETER_NAME, Value=PARAMETER_STORE_VALUE, Type='SecureString')
        # Note the put_parameter above validates that overwrite is set to True

        timestamp = int(time.time())
        from utils.utils import ParameterStoreAdapter
        ParameterStoreAdapter().set_last_updated_timestamp(timestamp)

        response = self._client.get_parameter(Name=EXPECTED_PARAMETER_NAME, WithDecryption=True)
        actual = json.loads(response['Parameter']['Value']).get('last_activity_fetched_timestamp')
        assert actual == timestamp


class TestUtils:

    def test_get_current_time(self):
        start = round(time.time() * 1000)
        actual = utils.utils.get_current_timestamp()
        end = round(time.time() * 1000)

        assert start <= actual <= end
