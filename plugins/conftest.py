import json
import os
import time

import boto3
import moto.dynamodb.urls
import pytest

LOCAL_DYNAMO_HOST = 'http://localhost:1234'
AWS_REGION = 'us-east-1'
STACK_NAME = 'test-stack'
TEST_BUCKET = 'test-bucket'
TEST_BUCKET_PATH = 'test-path'


@pytest.fixture(scope='module')
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"


@pytest.fixture()
def env_variables():
    os.environ["LOCAL_DYNAMO_HOST"] = LOCAL_DYNAMO_HOST
    os.environ["AWS_REGION"] = AWS_REGION
    os.environ["STACK_NAME"] = STACK_NAME
    os.environ["BUCKET_PATH"] = TEST_BUCKET_PATH


# Dynamo helper functions
@pytest.fixture(autouse=True)
def setup_local_dynamo():
    moto.dynamodb.urls.url_bases.append(LOCAL_DYNAMO_HOST)


def setup_dynamo():
    from models.plugin import Plugin
    Plugin.create_table()
    return boto3.resource('dynamodb').Table(f'{STACK_NAME}-plugin')


def create_plugin_item(plugin, version, data, include_last_updated_ts):
    item = {
        'name': plugin,
        'version_type': f'{version}:DISTRIBUTION',
        'version': version,
        'type': 'DISTRIBUTION',
        'data': data,
    }
    if include_last_updated_ts:
        item['last_updated_timestamp'] = round(time.time() * 1000)
    return item


def verify_plugin_item(table, name, version, data, start_time=None, last_updated_ts=None):
    key = {'name': name, 'version_type': f'{version}:DISTRIBUTION'}
    actual = table.get_item(Key=key)['Item']
    for key, value in create_plugin_item(name, version, data, False).items():
        assert actual.get(key) == value

    if start_time:
        assert start_time <= actual['last_updated_timestamp']
    elif last_updated_ts:
        assert last_updated_ts == actual['last_updated_timestamp']


# S3 helper functions
def setup_s3(monkeypatch, bucket_name=TEST_BUCKET):
    monkeypatch.setenv('BUCKET', TEST_BUCKET)
    bucket = boto3.resource('s3').Bucket(bucket_name)
    bucket.create()
    return bucket


def put_s3_object(bucket, data, path):
    bucket.put_object(Key=path, Body=bytes(json.dumps(data), 'utf-8'))
    return bucket.Object(path).last_modified
