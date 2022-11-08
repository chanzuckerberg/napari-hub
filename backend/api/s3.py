import io
import json
import logging
import mimetypes
import os
import os.path
from datetime import datetime
from io import StringIO
from typing import Union, IO, List, Dict

import boto3
import pandas as pd
from botocore.client import Config
from botocore.exceptions import ClientError

from utils.timer import Timer
from utils.utils import send_alert

# Environment variable set through ecs stack terraform module
bucket = os.environ.get('BUCKET')
bucket_path = os.environ.get('BUCKET_PATH', '')
endpoint_url = os.environ.get('BOTO_ENDPOINT_URL', None)

s3_client = boto3.client("s3", endpoint_url=endpoint_url, config=Config(max_pool_connections=50))


def get_cache(key: str) -> Union[Dict, List, None]:
    """
    Get the cached json file or manifest file for a given key if exists, None otherwise.

    :param key: key to the cache to get
    :return: file content for the key if exists, None otherwise
    """
    try:
        return json.loads(__get_object_body_from_s3(key))
    except ClientError:
        print(f"Not cached: {key}")
        return None


def cache(content: Union[dict, list, IO[bytes]], key: str, mime: str = None):
    """
    Cache the given content to the key location.

    :param content: content to cache
    :param key: key path in s3
    :param mime: type of the file
    """
    extra_args = None
    mime = mime or mimetypes.guess_type(key)[0]
    if mime:
        extra_args = {'ContentType': mime}
    if bucket is None:
        send_alert(f"({datetime.now()}) Unable to find bucket for lambda "
                   f"configuration, skipping caching for napari hub."
                   f"Check terraform setup to add environment variable for "
                   f"napari hub lambda")
        return content
    if isinstance(content, io.IOBase):
        s3_client.upload_fileobj(Fileobj=content, Bucket=bucket,
                                 Key=os.path.join(bucket_path, key), ExtraArgs=extra_args)
    else:
        with io.BytesIO(json.dumps(content).encode('utf8')) as stream:
            s3_client.upload_fileobj(Fileobj=stream, Bucket=bucket,
                                     Key=os.path.join(bucket_path, key), ExtraArgs=extra_args)


def get_activity_dashboard_data(data, plugin) -> pd.DataFrame:
    """
    Get the content of activity_dashboard.csv file on s3.

    :param plugin: plugin name
    :return: dataframe that consists of plugin-specific data for activity_dashboard backend endpoints
    """
    try:
        plugin_installs_dataframe = pd.read_csv(StringIO(data))
        plugin_df = plugin_installs_dataframe[plugin_installs_dataframe.PROJECT == plugin]
        plugin_df = plugin_df[['MONTH', 'NUM_DOWNLOADS_BY_MONTH']]
        plugin_df['MONTH'] = pd.to_datetime(plugin_df['MONTH'])
        return plugin_df
    except Exception as e:
        logging.error(e)
        return pd.DataFrame(columns=['MONTH', 'NUM_DOWNLOADS_BY_MONTH'])


def __get_object_body_from_s3(path: str):
    timer = Timer()
    complete_path = os.path.join(bucket_path, path)
    logging.info(f"s3 getObject bucket={bucket} path={complete_path}")
    timer.start()
    try:
        return s3_client.get_object(Bucket=bucket, Key=complete_path)['Body'].read()
    except Exception as e:
        logging.error(f"Exception on fetching bucket={bucket} path={complete_path}", e)
        return None
    finally:
        logging.info(f"S3 getObject bucket={bucket} path={complete_path} elapsed_time={timer.get_elapsed_time()}")
