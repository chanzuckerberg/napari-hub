import functools
import os
from typing import Union

from pynamodb.models import Model


def set_ddb_metadata(table_name: str, dynamo_model_cls: Model = None) -> Union[Model, functools.partial]:
    if dynamo_model_cls is None:
        return functools.partial(set_ddb_metadata, table_name)

    dynamo_model_cls.Meta.host = os.getenv('LOCAL_DYNAMO_HOST')
    dynamo_model_cls.Meta.region = os.getenv('AWS_REGION', 'us-west-2')
    dynamo_model_cls.Meta.table_name = f'{os.getenv("STACK_NAME")}-{table_name}'
    return dynamo_model_cls
