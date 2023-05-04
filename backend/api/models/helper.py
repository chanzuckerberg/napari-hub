import os

from pynamodb.models import Model


def set_ddb_metadata(dynamo_model_cls: Model, table_name: str) -> Model:
    dynamo_model_cls.Meta.host = os.getenv('LOCAL_DYNAMO_HOST')
    dynamo_model_cls.Meta.region = os.getenv('AWS_REGION', 'us-west-2')
    dynamo_model_cls.Meta.table_name = f'{os.getenv("STACK_NAME")}-{table_name}'
    return dynamo_model_cls
