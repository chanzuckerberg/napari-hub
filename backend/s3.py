import io
import json
import os
import os.path
from datetime import datetime
from typing import Union, IO

import boto3
from botocore.exceptions import ClientError
from botocore.client import Config

from utils import send_alert

# Environment variable set through ecs stack terraform module
bucket = os.environ.get('BUCKET')
bucket_path = os.environ.get('BUCKET_PATH', '')
endpoint_url = os.environ.get('BOTO_ENDPOINT_URL', None)

s3_client = boto3.client("s3", endpoint_url=endpoint_url, config=Config(max_pool_connections=50))


def cache_available(key: str) -> bool:
    """
    Check if cache is available for the key.

    :param key: key to check in s3
    :return: True iff cache exists
    """
    if bucket is None:
        return False
    try:
        s3_client.head_object(Bucket=bucket, Key=os.path.join(bucket_path, key))
        return True
    except ClientError:
        return False


def get_cache(key: str) -> Union[dict, None]:
    """
    Get the cached file for a given key if exists, None otherwise.

    :param key: key to the cache to get
    :return: file content for the key if exists, None otherwise
    """
    if cache_available(key):
        return json.loads(s3_client.get_object(Bucket=bucket, Key=os.path.join(bucket_path, key))['Body'].read())
    else:
        print(f"Not cached: {key}")
        return None


def cache(content: Union[dict, list, IO[bytes]], key: str, cache_bucket: str = bucket, extra_args: dict = None):
    """
    Cache the given content to the key location.

    :param content: content to cache
    :param key: key path in s3
    :param cache_bucket: bucket to save the files to, by default use the global bucket
    :param extra_args: extra argument for the uploaded object
    """
    if bucket is None:
        send_alert(f"({datetime.now()}) Unable to find bucket for lambda "
                   f"configuration, skipping caching for napari hub."
                   f"Check terraform setup to add environment variable for "
                   f"napari hub lambda")
        return content
    if isinstance(content, io.IOBase):
        s3_client.upload_fileobj(Fileobj=content, Bucket=cache_bucket,
                                 Key=os.path.join(bucket_path, key), ExtraArgs=extra_args)
    else:
        with io.BytesIO(json.dumps(content).encode('utf8')) as stream:
            s3_client.upload_fileobj(Fileobj=stream, Bucket=cache_bucket,
                                     Key=os.path.join(bucket_path, key), ExtraArgs=extra_args)
