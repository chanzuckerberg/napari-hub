import json
import unittest
from unittest.mock import patch

import boto3
from moto import mock_s3
from moto.moto_server.threaded_moto_server import ThreadedMotoServer

from api.dao.s3 import S3DAO

MOCK_BUCKET = 'napari-hub-test-bucket'
MOCK_BUCKET_PATH = 'test-path'
MOCK_BOTO_ENDPOINT_URL = 'http://127.0.0.1:5000'
DEFAULT_ENV_VARIABLES = {
    'BUCKET': MOCK_BUCKET,
    'AWS_ACCESS_KEY_ID': 'dummy-access-key',
    'AWS_SECRET_ACCESS_KEY': 'dummy-access-key-secret',
}
DETAILED_ENV_VARIABLES = {
    'BUCKET_PATH': MOCK_BUCKET_PATH,
    'BOTO_ENDPOINT_URL': MOCK_BOTO_ENDPOINT_URL
}
DETAILED_ENV_VARIABLES.update(DEFAULT_ENV_VARIABLES)
ACTIVITY_DATA = "foo-bar"
ACTIVITY_DATA_PATH = 'activity_dashboard_data/plugin_installs.csv'
RECENT_ACTIVITY_DATA = {"foo": 1, "bar": "3", "baz": 9}
RECENT_ACTIVITY_DATA_PATH = 'activity_dashboard_data/plugin_recent_installs.json'


@mock_s3
class TestS3Adapter(unittest.TestCase):

    def test_get_activity_timeline_data_query_returns_valid_data(self):
        self.__set_up_mock_s3()
        self.__set_up_mock_data(ACTIVITY_DATA_PATH, ACTIVITY_DATA)

        actual = self.__test_s3_dao.get_activity_timeline_data()
        self.assertEqual(ACTIVITY_DATA, actual)

    def test_get_activity_timeline_data_query_handles_s3_exception(self):
        self.__set_up_mock_s3()
        actual = self.__test_s3_dao.get_activity_timeline_data()
        self.assertIsNone(actual)

    def test_get_activity_timeline_data_query_with_default_env_var(self):
        self.__set_up_mock_s3(DEFAULT_ENV_VARIABLES)
        self.__set_up_mock_data(ACTIVITY_DATA_PATH, ACTIVITY_DATA, '')

        actual = self.__test_s3_dao.get_activity_timeline_data()
        self.assertEqual(ACTIVITY_DATA, actual)

    def test_get_recent_activity_data_query_returns_valid_data(self):
        self.__set_up_mock_s3()
        self.__set_up_mock_data(RECENT_ACTIVITY_DATA_PATH, json.dumps(RECENT_ACTIVITY_DATA))

        actual = self.__test_s3_dao.get_recent_activity_dashboard_data()
        self.assertEqual(RECENT_ACTIVITY_DATA, actual)

    def test_get_recent_activity_data_query_handles_data_type_exception(self):
        self.__set_up_mock_s3()
        self.__set_up_mock_data(RECENT_ACTIVITY_DATA_PATH, 'test-data')

        actual = self.__test_s3_dao.get_recent_activity_dashboard_data()
        self.assertEqual({}, actual)

    def test_get_recent_activity_data_query_handles_s3_exception(self):
        self.__set_up_mock_s3()
        actual = self.__test_s3_dao.get_recent_activity_dashboard_data()
        self.assertEqual({}, actual)

    def test_get_recent_activity_data_query_with_default_env_var_returns_valid_data(self):
        self.__set_up_mock_s3(DEFAULT_ENV_VARIABLES)
        self.__set_up_mock_data(RECENT_ACTIVITY_DATA_PATH, json.dumps(RECENT_ACTIVITY_DATA), '')

        actual = self.__test_s3_dao.get_recent_activity_dashboard_data()
        self.assertEqual(RECENT_ACTIVITY_DATA, actual)

    def test_write_data(self):
        data = "this-is-a-test-message"
        test_path = "foo/bar"
        self.__set_up_mock_s3(DETAILED_ENV_VARIABLES)

        self.__test_s3_dao.write_data(data, test_path)

        complete_path = MOCK_BUCKET_PATH + "/" + test_path
        actual = self.__mock_s3_client.get_object(Bucket=MOCK_BUCKET, Key=complete_path)['Body'].read().decode('utf-8')
        self.assertEqual(data, actual)

    def test_write_data_with_default_env_var(self):
        data = "this-is-a-test-message"
        test_path = "foo/bar"
        self.__set_up_mock_s3(DEFAULT_ENV_VARIABLES)

        self.__test_s3_dao.write_data(data, test_path)

        actual = self.__mock_s3_client.get_object(Bucket=MOCK_BUCKET, Key=test_path)['Body'].read().decode('utf-8')
        self.assertEqual(data, actual)

    def tearDown(self):
        if self.__server:
            self.__server.stop()

    def __set_up_mock_s3(self, env_variables=DETAILED_ENV_VARIABLES):
        with patch.dict('os.environ', env_variables):
            is_include_boto_endpoint_url = 'BOTO_ENDPOINT_URL' in env_variables
            if is_include_boto_endpoint_url:
                self.__server = ThreadedMotoServer(ip_address='0.0.0.0', port=5000)
                self.__server.start()
            else:
                self.__server = None

            endpoint = MOCK_BOTO_ENDPOINT_URL if is_include_boto_endpoint_url else None
            self.__mock_s3_client = boto3.client('s3', endpoint_url=endpoint)
            self.__test_s3_dao = S3DAO()
            self.__mock_s3_client.create_bucket(Bucket=MOCK_BUCKET)

    def __set_up_mock_data(self, path, data, bucket_path=MOCK_BUCKET_PATH + '/'):
        complete_path = bucket_path + path
        self.__mock_s3_client.put_object(Bucket=MOCK_BUCKET, Key=complete_path, Body=data)
