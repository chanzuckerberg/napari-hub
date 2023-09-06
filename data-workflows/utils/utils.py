import boto3
import json
from datetime import date, datetime, timezone, time

from .env import get_required_env


LAST_UPDATED_TIMESTAMP_KEY = "last_activity_fetched_timestamp"


def to_datetime(timestamp: date) -> datetime:
    return datetime.combine(timestamp, time.min, timezone.utc)


def datetime_to_utc_timestamp_in_millis(timestamp: datetime) -> int:
    return int(timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000)


class ParameterStoreAdapter:
    def __init__(self):
        self._parameter_name: str = (
            f'/{get_required_env("STACK_NAME")}/napari-hub/data-workflows/config'
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
