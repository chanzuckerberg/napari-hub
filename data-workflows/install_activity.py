import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from snowflake_adapter import get_plugins_with_activity_since_last_update, get_plugins_install_count_since_timestamp
from utils import get_current_timestamp, get_last_updated_timestamp, set_last_updated_timestamp

prefix = os.getenv('STACK_NAME')
region = os.getenv('AWS_REGION')


class InstallActivity(Model):
    class Meta:
        table_name = f'{prefix}-install-activity'
        region = region

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute(default_for_new=get_current_timestamp)


def update_activity():
    last_updated_timestamp = get_last_updated_timestamp()
    current_timestamp = get_current_timestamp()
    update_install_activity(last_updated_timestamp, current_timestamp)
    set_last_updated_timestamp(current_timestamp)


def update_install_activity(last_updated_timestamp, current_timestamp):
    updated_plugins = get_plugins_with_activity_since_last_update(last_updated_timestamp, current_timestamp)
    _fetch_data_and_write_to_dynamo(updated_plugins, 'DAY', lambda ts: ts)
    _fetch_data_and_write_to_dynamo(updated_plugins, 'MONTH', lambda ts: ts.replace(day=1))
    _fetch_data_and_write_to_dynamo(updated_plugins, 'TOTAL')


def _fetch_data_and_write_to_dynamo(data, granularity, time_mapper=None):
    _write_activity_to_dynamo(get_plugins_install_count_since_timestamp(data, granularity, time_mapper), granularity)


def _write_activity_to_dynamo(plugin_install_data, granularity):
    type_timestamp_format = _get_type_timestamp_format(granularity)
    with InstallActivity.batch_write() as batch:
        for plugin_name, install_activities in plugin_install_data.items():
            for activity in install_activities:
                timestamp = activity['timestamp']
                item = InstallActivity(plugin_name,
                                       type_timestamp_format(timestamp),
                                       granularity=granularity,
                                       timestamp=None if granularity == "TOTAL" else timestamp.timestamp() * 1000,
                                       install_count=activity['count'])
                batch.save(item)


def _get_type_timestamp_format(granularity):
    if granularity == 'TOTAL':
        return lambda timestamp: 'TOTAL:'

    if granularity == 'MONTH':
        return lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}'

    return lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}'
