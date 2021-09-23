import os
import os.path
from datetime import datetime
import tempfile
import json
from typing import Union
import boto3
from botocore.exceptions import ClientError
from backend.util import send_alert

# Environment variable set through lambda terraform infra config
bucket = os.environ.get('BUCKET')
bucket_path = os.environ.get('BUCKET_PATH', '')
endpoint_url = os.environ.get('BOTO_ENDPOINT_URL', None)

s3 = boto3.resource('s3', endpoint_url=endpoint_url)
s3_client = boto3.client("s3", endpoint_url=endpoint_url)


def cache_available(key: str) -> bool:
    """
    Check if cache is available for the key.

    :param key: key to check in s3
    :return: True iff cache exists
    """
    if bucket is None:
        return False
    try:
        s3.Object(bucket, os.path.join(bucket_path, key)).load()
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
        return json.loads(s3.Object(bucket, os.path.join(bucket_path, key)).get()['Body'].read())
    else:
        print(f"Not cached: {key}")
        return None


def cache(content: [dict, list], key: str) -> dict:
    """
    Cache the given content to the key location.

    :param content: content to cache
    :param key: key path in s3
    :return: content that is cached
    """
    if bucket is None:
        send_alert(f"({datetime.now()}) Unable to find bucket for lambda "
                   f"configuration, skipping caching for napari hub."
                   f"Check terraform setup to add environment variable for "
                   f"napari hub lambda")
        return content
    with tempfile.NamedTemporaryFile(mode="w") as fp:
        fp.write(json.dumps(content))
        fp.flush()
        s3_client.upload_file(fp.name, bucket, os.path.join(bucket_path, key))
    return content
