import json
import time
from datetime import datetime

import boto3
import os

ssm_client = boto3.client('ssm')
PARAMETER_NAME = f'/{os.getenv("STACK_NAME")}/napari-hub/data-workflows/config'


def get_current_timestamp() -> int:
    return round(time.time() * 1000)


def datetime_from_millis(millis) -> datetime:
    return datetime.fromtimestamp(millis / 1000.0)


def get_last_updated_timestamp() -> int:
    response = ssm_client.get_parameter(Name=PARAMETER_NAME, WithDecryption=True)
    return json.loads(response['Parameter']['Value']).get('last_activity_fetched_timestamp')


def set_last_updated_timestamp(timestamp) -> None:
    value = json.dumps({'last_activity_fetched_timestamp': timestamp})
    ssm_client.put_parameter(Name=PARAMETER_NAME, Value=value, Overwrite=True)
