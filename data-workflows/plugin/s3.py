import json
import os
import os.path
from typing import Union, List, Dict

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

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
        return json.loads(s3_client.get_object(Bucket=bucket, Key=os.path.join(bucket_path, key))['Body'].read())
    except ClientError:
        print(f"Not cached: {key}")
        return None


def get_index() -> dict:
    """
    Get the index page related metadata for all plugins.
    :return: dict for index page metadata
    """
    index = get_cache('cache/index.json')
    if index:
        return index
    else:
        return {}


def _get_repo_to_plugin_dict():
    index_json = get_index()
    repo_to_plugin_dict = {}
    for plugin_obj in index_json:
        if 'code_repository' in plugin_obj and plugin_obj['code_repository']:
            repo_to_plugin_dict[plugin_obj['code_repository'].replace('https://github.com/', '')] = plugin_obj['name']
    return repo_to_plugin_dict
