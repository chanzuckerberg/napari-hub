import datetime
import os
from functools import reduce
from typing import List, Dict

from dateutil.relativedelta import relativedelta
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute


class InstallActivity(Model):
    class Meta:
        table_name = f'{os.getenv("STACK_NAME")}-install-activity'
        region = os.getenv('AWS_REGION')

    plugin_name = UnicodeAttribute(hash_key=True)
    type_timestamp = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    install_count = NumberAttribute()
    last_updated_timestamp = NumberAttribute()

    @staticmethod
    def get_total_installs(plugin: str) -> int:
        """
        Gets total_installs stats from dynamo for a plugin
        :return int: total_installs count

        :param str plugin: Name of the plugin in lowercase for which total_installs needs to be computed.
        """
        try:
            return InstallActivity.get(plugin, 'TOTAL:').install_count
        except InstallActivity.DoesNotExist:
            return 0

    @staticmethod
    def get_recent_installs(plugin: str, day_delta: int) -> int:
        """
        Fetches plugin recent_install stats from dynamo.
        :return int: sum of installs in the last day_delta timeperiod

        :param str plugin: Name of the plugin in lowercase for which recent_install needs to be computed.
        :param int day_delta: Specifies the number of days to include in the computation.
        """
        day_type_format = 'DAY:{0:%Y%m%d}'
        today = datetime.date.today()
        upper = day_type_format.format(today)
        lower = day_type_format.format(today - relativedelta(days=day_delta))
        results = InstallActivity.query(plugin, InstallActivity.type_timestamp.between(lower, upper))

        return reduce(lambda acc, count: acc + count, [row.install_count for row in results], 0)

    @staticmethod
    def get_timeline(plugin: str, month_delta: int) -> List[Dict[str, int]]:
        """
        Fetches plugin install count at a month level granularity from dynamo over the last month_delta months.
        :returns List[Dict[str, int]]: Entries for the month_delta months

        :param str plugin: Name of the plugin in lowercase for which timeline data needs to be fetched.
        :param int month_delta: Number of months in timeline.
        """
        month_type_format = 'MONTH:{0:%Y%m}'
        start_date = datetime.datetime.now().replace(day=1) - relativedelta(months=1)
        end_date = start_date - relativedelta(months=month_delta - 1)
        condition = InstallActivity.type_timestamp.between(month_type_format.format(end_date),
                                                           month_type_format.format(start_date))
        results = {row.timestamp: row.install_count for row in InstallActivity.query(plugin, condition)}

        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=datetime.timezone.utc)
        dates = [int((start_date - relativedelta(months=i)).timestamp()) * 1000 for i in range(month_delta - 1, -1, -1)]
        return list(map(lambda date: {'timestamp': date, 'installs': results.get(date, 0)}, dates))
