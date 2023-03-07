import datetime
import os
from functools import reduce
from typing import List, Callable

from dateutil.relativedelta import relativedelta
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

prefix = os.getenv('PREFIX')
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
    last_updated_timestamp = NumberAttribute()


def get_total_installs(plugin_name: str) -> int:
    try:
        return InstallActivity.get(plugin_name, 'TOTAL:').install_count
    except InstallActivity.DoesNotExist:
        return 0


def get_recent_installs(plugin_name: str, day_delta: int = 30) -> int:
    day_type_format = lambda timestamp: f'DAY:{timestamp.strftime("%Y%m%d")}'
    today = datetime.date.today()
    upper = day_type_format(today)
    lower = day_type_format(today - relativedelta(days=day_delta))
    results = InstallActivity.query(plugin_name, InstallActivity.type_timestamp.between(lower, upper))

    return reduce(lambda acc, count: acc + count, [row.install_count for row in results], 0)


def get_timeline(plugin_name: str, month_delta: int = 12) -> List:
    formatter = lambda timestamp: f'MONTH:{timestamp.strftime("%Y%m")}'
    start_date = datetime.datetime.now().replace(day=1) - relativedelta(months=1)
    end_date = start_date - relativedelta(months=month_delta - 1)
    condition = InstallActivity.type_timestamp.between(formatter(end_date), formatter(start_date))
    results = {row.timestamp: row.install_count for row in InstallActivity.query(plugin_name, condition)}

    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=datetime.timezone.utc)
    dates = [int((start_date - relativedelta(months=i)).timestamp()) * 1000 for i in range(11, -1, -1)]
    return list(map(_map_to_timeline(results), dates))


def _map_to_timeline(result: dict[int, int]) -> Callable[[int], dict[str, int]]:
    return lambda date: {'timestamp': date, 'installs': result.get(date, 0)}
