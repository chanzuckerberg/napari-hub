import boto3
import json
import logging

from os import path
from typing import Any, Dict


class S3Client:
    """
    Client for accessing S3 resources.
    """

    _bucket: str
    _prefix: str
    _client: Any

    def __init__(self, bucket: str, prefix=""):
        self._bucket = bucket
        self._prefix = prefix
        self._client = boto3.client("s3")

    def _get_complete_path(self, s3_path: str):
        return path.join(self._prefix, s3_path)

    def _get_from_s3(self, s3_path):
        obj = self._client.get_object(
            Bucket=self._bucket, Key=self._get_complete_path(s3_path)
        )

        return obj["Body"].read().decode("utf-8")

    def load_json_from_s3(self, s3_path: str) -> Dict:
        """
        Load JSON file from S3 path and convert to a Python dictionary.
        """

        try:
            return json.loads(self._get_from_s3(s3_path))
        except Exception as e:
            logging.error(e)
            return {}
