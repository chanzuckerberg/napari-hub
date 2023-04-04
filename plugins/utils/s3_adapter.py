import logging
import os
import time

import boto3

LOGGER = logging.getLogger()


class S3Adapter:

    def __init__(self):
        # Environment variable set through ecs stack terraform module
        self._bucket = os.getenv('BUCKET')
        self._path_prefix = os.getenv('BUCKET_PATH', '')

        if not self._bucket:
            raise RuntimeError('Bucket name not specified.')

        self._client = boto3.client('s3')

    def _get_complete_path(self, path):
        return os.path.join(self._path_prefix, path)

    def get_from_s3(self, path):
        start = time.perf_counter()
        complete_path = self._get_complete_path(path)
        try:
            obj = self._client.get_object(Bucket=self._bucket, Key=complete_path)
            return obj['Body'].read().decode('utf-8')
        except Exception as e:
            LOGGER.error(f'Error when getting object from {self._bucket} path={complete_path}', e)
            return "{}"
        finally:
            duration = (time.perf_counter() - start) * 1000
            LOGGER.info(f'Getting object from {self._bucket} path={complete_path} time taken={duration}')

    def write_to_s3(self, data, path):
        complete_path = self._get_complete_path(path)
        LOGGER.info(f'Writing {data} to {path} in {self._bucket}')
        start = time.perf_counter()
        try:
            self._client.put_object(Bucket=self._bucket, Key=complete_path, Body=data)
        except Exception as e:
            LOGGER.error(f'Error when writing object to {self._bucket} path={complete_path}', e)
        finally:
            duration = (time.perf_counter() - start) * 1000
            LOGGER.info(f'Writing object to {self._bucket} path={complete_path} time taken={duration}')

    def get_object_list_in_bucket(self, prefix=""):
        start = time.perf_counter()
        complete_prefix = self._get_complete_path(prefix)
        try:
            bucket_list = self._client.list_objects(Bucket=self._bucket, Prefix=complete_prefix)
            return ['Contents'] if 'Contents' in bucket_list else []
        finally:
            duration = (time.perf_counter() - start) * 1000
            LOGGER.info(f'Getting object list from {self._bucket} prefix={complete_prefix} time taken={duration}')
