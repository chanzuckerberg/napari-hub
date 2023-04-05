import os
from functools import partial
from typing import Union

from pynamodb.models import Model


def set_ddb_metadata(table_name: str,
                     dynamo_model_cls: Model = None) -> Union[Model, partial]:
    """
    Sets up the Meta class of dynamo model with required values
    :returns Union[Model, functools.partial]: if all parameters are available,
    returns updated Model class, else returns a partial function

    :params str table_name: Name of the table in dynamo
    :params Model dynamo_model_cls: Model class inherited from pynamo.Model
    """
    if dynamo_model_cls is None:
        return partial(set_ddb_metadata, table_name)

    dynamo_model_cls.Meta.host = os.getenv('LOCAL_DYNAMO_HOST')
    dynamo_model_cls.Meta.region = os.getenv('AWS_REGION', 'us-west-2')
    dynamo_model_cls.Meta.table_name = f'{os.getenv("STACK_NAME")}-{table_name}'
    return dynamo_model_cls
