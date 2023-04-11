import logging
import json
import os
import os.path
from typing import Dict

import boto3
from botocore.exceptions import ClientError

LOGGER = logging.getLogger()


def _get_cache(key: str) -> Dict:
    try:
        bucket = os.getenv('BUCKET')
        bucket_path = os.getenv('BUCKET_PATH', '')
        s3_client = boto3.client("s3")
        return json.loads(s3_client.get_object(Bucket=bucket, Key=os.path.join(bucket_path, key))['Body'].read())
    except ClientError:
        logging.info(f"Not cached: {key}")
        return None


def _get_repo_to_plugin_dict():
    index_json = _get_cache('cache/index.json')
    repo_to_plugin_dict = {}
    for public_plugin_obj in index_json:
        code_repository = public_plugin_obj.get('code_repository')
        if code_repository:
            repo_to_plugin_dict[code_repository.replace('https://github.com/', '')] = plugin_obj['name']
    return repo_to_plugin_dict
