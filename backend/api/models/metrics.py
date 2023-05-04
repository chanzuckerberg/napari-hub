import datetime
import logging
import time
from functools import reduce
from typing import List, Dict

from dateutil.relativedelta import relativedelta
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from api.models.helper import set_ddb_metadata

LOGGER = logging.getLogger()


class InstallActivity:

    class DynamoModel(Model):

        class Meta:
            pass

        plugin_name = UnicodeAttribute(hash_key=True)
        type_timestamp = UnicodeAttribute(range_key=True)
        granularity = UnicodeAttribute(attr_name='type')
        timestamp = NumberAttribute(null=True)
        install_count = NumberAttribute()
        last_updated_timestamp = NumberAttribute()

    _ddb: DynamoModel = set_ddb_metadata(DynamoModel, 'install_activity')

    @classmethod
    def get_total_installs(cls, plugin: str) -> int:
        """
        Gets total_installs stats from dynamo for a plugin
        :return int: total_installs count

        :param str plugin: Name of the plugin in lowercase for which total_installs needs to be computed.
        """
        start = time.perf_counter()
        try:
            return cls._ddb.get(plugin, 'TOTAL:').install_count
        except cls._ddb.DoesNotExist:
            logging.warning(f'No TOTAL: record found for plugin={plugin}')
            return 0
        finally:
            logging.info(f'get_total_installs for plugin={plugin} time_taken={(time.perf_counter() - start) * 1000}ms')

    @classmethod
    def get_recent_installs(cls, plugin: str, day_delta: int) -> int:
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

        start = time.perf_counter()
        results = cls._ddb.query(plugin, cls._ddb.type_timestamp.between(lower, upper))
        duration = (time.perf_counter() - start) * 1000
        logging.info(f'Query for plugin={plugin} day_delta={day_delta} time_taken={duration}ms')

        return reduce(lambda acc, count: acc + count, [row.install_count for row in results], 0)

    @classmethod
    def get_timeline(cls, plugin: str, month_delta: int) -> List[Dict[str, int]]:
        """
        Fetches plugin install count at a month level granularity from dynamo in the previous month_delta months.
        :returns List[Dict[str, int]]: Entries for the month_delta months

        :param str plugin: Name of the plugin in lowercase for which timeline data needs to be fetched.
        :param int month_delta: Number of months in timeline.
        """
        month_type_format = 'MONTH:{0:%Y%m}'
        start_date = datetime.datetime.now().replace(day=1) - relativedelta(months=1)
        end_date = start_date - relativedelta(months=month_delta - 1)
        condition = cls._ddb.type_timestamp.between(month_type_format.format(end_date),
                                                    month_type_format.format(start_date))
        start = time.perf_counter()
        results = {row.timestamp: row.install_count for row in cls._ddb.query(plugin, condition)}
        duration = (time.perf_counter() - start) * 1000
        logging.info(f'Query for plugin={plugin} month_delta={month_delta} time_taken={duration}ms')

        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=datetime.timezone.utc)
        dates = [int((start_date - relativedelta(months=i)).timestamp()) * 1000 for i in range(month_delta - 1, -1, -1)]
        return list(map(lambda date: {'timestamp': date, 'installs': results.get(date, 0)}, dates))

    @classmethod
    def get_total_installs_by_plugins(cls, plugins) -> Dict[str, int]:
        start = time.perf_counter()
        batch_response = cls._ddb.batch_get(
            [(plugin, 'TOTAL:') for plugin in plugins],
            attributes_to_get=["plugin_name", "install_count"]
        )
        duration = (time.perf_counter() - start) * 1000
        logging.info(f'BatchGet for total_installs_by_plugins time_taken={duration}ms')
        return {item.plugin_name: item.install_count for item in batch_response}
