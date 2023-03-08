import json
import time
from datetime import datetime

import boto3
import os

SSM_CLIENT = boto3.client('ssm')
PARAMETER_NAME:str = f'/{os.getenv("STACK_NAME")}/napari-hub/data-workflows/config'


def get_current_timestamp() -> int:
    return round(time.time() * 1000)


def datetime_from_millis(millis) -> datetime:
    return datetime.fromtimestamp(millis / 1000.0)


def get_last_updated_timestamp() -> int:
    response = SSM_CLIENT.get_parameter(Name=PARAMETER_NAME, WithDecryption=True)
    return json.loads(response['Parameter']['Value']).get('last_activity_fetched_timestamp')


def set_last_updated_timestamp(timestamp) -> None:
    value = json.dumps({'last_activity_fetched_timestamp': timestamp})
    SSM_CLIENT.put_parameter(Name=PARAMETER_NAME, Value=value, Overwrite=True)
