import json
import logging
import os
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError

from utils.timer import Timer


class S3DAO:

    def __init__(self):
        self.__bucket = os.environ.get('BUCKET')
        self.__bucket_path = os.environ.get('BUCKET_PATH', '')
        __endpoint_url = os.environ.get('BOTO_ENDPOINT_URL', None)
        self.__s3_client = boto3.client('s3', endpoint_url=__endpoint_url)

    def get_activity_timeline_data(self) -> Any:
        try:
            return self.__get_object_body_from_s3('activity_dashboard_data/plugin_installs.csv').decode('utf-8')
        except Exception as e:
            logging.error(e)
            return None

    def get_recent_activity_dashboard_data(self) -> Dict:
        path = 'activity_dashboard_data/plugin_recent_installs.json'
        try:
            return json.loads(self.__get_object_body_from_s3(path).decode('utf-8'))
        except Exception as e:
            logging.error(e)
            return {}

    def write_data(self, data: str, path: str):
        self.__s3_client.put_object(Body=data, Bucket=self.__bucket, Key=self.__get_complete_path(path))

    def __get_object_body_from_s3(self, path: str):
        timer = Timer()
        complete_path = self.__get_complete_path(path)
        logging.info(f's3 getObject bucket={self.__bucket} path={complete_path}')
        timer.start()
        try:
            return self.__s3_client.get_object(Bucket=self.__bucket, Key=complete_path)['Body'].read()
        except Exception as e:
            logging.error(f'Exception on fetching bucket={self.__bucket} path={complete_path}', e)
            raise ClientError
        finally:
            elapsed_time = timer.get_elapsed_time()
            logging.info(f'S3 getObject bucket={self.__bucket} path={complete_path} elapsed_time={elapsed_time}')

    def __get_complete_path(self, path):
        return os.path.join(self.__bucket_path, path)
