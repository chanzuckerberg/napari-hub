import datetime
import logging
import time
from typing import List, Dict, Any

from dateutil.relativedelta import relativedelta
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

from api.models.helper import set_ddb_metadata

LOGGER = logging.getLogger()


@set_ddb_metadata('github-activity')
class _GitHubActivityModel(Model):
    class Meta:
        pass

    plugin_name = UnicodeAttribute(hash_key=True)
    type_identifier = UnicodeAttribute(range_key=True)
    granularity = UnicodeAttribute(attr_name='type')
    timestamp = NumberAttribute(null=True)
    commit_count = NumberAttribute(null=True)
    repo = UnicodeAttribute()
    last_updated_timestamp = NumberAttribute()


def get_total_commits(plugin: str, repo: str) -> int:
    """
    Gets total_commits stats from dynamo for a plugin
    :return int: total_commits count

    :param str plugin: Name of the plugin in lowercase for which total_commits needs to be computed.
    :param str repo: Name of the GitHub repo.
    """
    start = time.perf_counter()
    try:
        return _GitHubActivityModel.get(plugin, f'TOTAL:{repo}').commit_count
    except _GitHubActivityModel.DoesNotExist:
        logging.warning(f'No TOTAL:{repo} record found for plugin={plugin}')
        return 0
    finally:
        logging.info(f'get_total_commits for plugin={plugin} repo={repo} time_taken={(time.perf_counter() - start) * 1000}ms')


def get_latest_commit(plugin: str, repo: str) -> Any:
    """
    Gets latest_commit timestamp stats from dynamo for a plugin
    :return int: latest_commit timestamp

    :param str plugin: Name of the plugin in lowercase for which latest_commit needs to be computed.
    :param str repo: Name of the GitHub repo.
    """
    start = time.perf_counter()
    try:
        return _GitHubActivityModel.get(plugin, f'LATEST:{repo}').timestamp
    except _GitHubActivityModel.DoesNotExist:
        logging.warning(f'No LATEST{repo}: record found for plugin={plugin}')
        return None
    finally:
        logging.info(f'get_latest_commit for plugin={plugin} time_taken={(time.perf_counter() - start) * 1000}ms')


def get_maintenance_timeline(plugin: str, repo: str, month_delta: int) -> List[Dict[str, int]]:
    """
    Fetches plugin commit count at a month level granularity from dynamo in the previous month_delta months.
    :returns List[Dict[str, int]]: Entries for the month_delta months

    :param str plugin: Name of the plugin in lowercase for which maintenance timeline data needs to be fetched.
    :param str repo: Name of the GitHub repo.
    :param int month_delta: Number of months in maintenance timeline.
    """
    MONTH_TYPE_IDENTIFIER = f'MONTH:{{timestamp:%Y%m}}:{repo}'
    upper = datetime.datetime.now().replace(day=1) - relativedelta(months=1)
    lower = upper - relativedelta(months=month_delta - 1)
    condition = _GitHubActivityModel.type_identifier.between(MONTH_TYPE_IDENTIFIER.format(timestamp=lower, repo=repo),
                                                             MONTH_TYPE_IDENTIFIER.format(timestamp=upper, repo=repo))

    start = time.perf_counter()
    results = {row.timestamp: row.commit_count for row in _GitHubActivityModel.query(plugin, condition)}
    duration = (time.perf_counter() - start) * 1000
    logging.info(f'Query for plugin={plugin} month_delta={month_delta} time_taken={duration}ms')

    upper = upper.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=datetime.timezone.utc)
    dates = [int((upper - relativedelta(months=i)).timestamp()) * 1000 for i in range(month_delta - 1, -1, -1)]
    return list(map(lambda date: {'timestamp': date, 'commits': results.get(date, 0)}, dates))
