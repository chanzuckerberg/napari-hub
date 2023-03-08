from datetime import datetime, timezone
from enum import Enum
from typing import Callable
import os
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from utils import get_current_timestamp


class InstallActivityType(Enum):
    DAY = 1
    MONTH = 2
    TOTAL = 3

    def get_type_timestamp_format(self) -> Callable[[datetime], str]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: 'TOTAL:'

        if self is InstallActivityType.MONTH:
            return lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}'

        return lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}'

    def get_timestamp(self) -> Callable[[datetime], int]:
        if self is InstallActivityType.TOTAL:
            return lambda timestamp: 0
        return lambda timestamp: timestamp.replace(tzinfo=timezone.utc).timestamp() * 1000

    def get_query_timestamp_projection(self) -> str:
        return '1' if self is InstallActivityType.TOTAL else f'DATE_TRUNC(\'{self.name}\', timestamp)'


class InstallActivity(Model):
    class Meta:
        prefix = os.getenv('STACK_NAME')
        region = os.getenv('AWS_REGION')
        table_name = f'{prefix}-install-activity'
        region = region

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)
