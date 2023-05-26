import os
from functools import partial
from typing import Union

from pynamodb.attributes import NumberAttribute
from pynamodb.models import Model

from nhcommons.utils import get_current_timestamp


class PynamoWrapper(Model):

    last_updated_timestamp = NumberAttribute(
        default_for_new=get_current_timestamp
    )


def get_stack_name() -> str:
    return os.getenv("STACK_NAME", "local")


def set_ddb_metadata(table_name: str,
                     dynamo_model_cls: PynamoWrapper = None) -> Union[PynamoWrapper, partial]:
    """
    Sets up the Meta class of dynamo model with required values
    :returns Union[PynamoWrapper, functools.partial]: if all parameters are available,
    returns updated PynamoWrapper class, else returns a partial function

    :params str table_name: Name of the table in dynamo
    :params Model dynamo_model_cls: Model class inherited from pynamo.Model
    """
    if dynamo_model_cls is None:
        return partial(set_ddb_metadata, table_name)

    dynamo_model_cls.Meta.host = os.getenv('LOCAL_DYNAMO_HOST')
    dynamo_model_cls.Meta.region = os.getenv('AWS_REGION', 'us-west-2')
    dynamo_model_cls.Meta.table_name = f'{get_stack_name()}-{table_name}'
    return dynamo_model_cls
