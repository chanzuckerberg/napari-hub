import boto3
import json
import logging
import time

from os import path
from typing import Any, Dict


def get_current_timestamp() -> int:
    return round(time.time() * 1000)


LAST_UPDATED_TIMESTAMP_KEY = "last_activity_fetched_timestamp"


class ParameterStoreAdapter:
    def __init__(self):
        self._parameter_name: str = (
            f'/{os.getenv("STACK_NAME")}/napari-hub/data-workflows/config'
        )
        self._ssm_client = boto3.client("ssm")

    def get_last_updated_timestamp(self) -> int:
        response = self._ssm_client.get_parameter(
            Name=self._parameter_name, WithDecryption=True
        )
        return json.loads(response["Parameter"]["Value"]).get(
            LAST_UPDATED_TIMESTAMP_KEY
        )

    def set_last_updated_timestamp(self, timestamp) -> None:
        value = json.dumps({LAST_UPDATED_TIMESTAMP_KEY: timestamp})
        self._ssm_client.put_parameter(
            Name=self._parameter_name, Value=value, Overwrite=True, Type="SecureString"
        )


class S3Client:
    bucket: str
    prefix: str
    client: Any

    def __init__(self, bucket: str, prefix=""):
        self.bucket = bucket
        self.prefix = prefix
        self.client = boto3.client("s3")

    def _get_complete_path(self, s3_path: str):
        return path.join(self.prefix, s3_path)

    def _get_from_s3(self, s3_path):
        obj = self.client.get_object(
            Bucket=self.bucket, Key=self._get_complete_path(s3_path)
        )

        return obj["Body"].read().decode("utf-8")

    def load_json_from_s3(self, s3_path: str) -> Dict:
        try:
            return json.loads(self._get_from_s3(s3_path))
        except Exception as e:
            logging.error(e)
            return {}
