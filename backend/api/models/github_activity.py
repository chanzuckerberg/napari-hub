import datetime
import logging
import os
import time
from typing import List, Dict

from dateutil.relativedelta import relativedelta
from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, NumberAttribute

LOGGER = logging.getLogger()


class GitHubActivity(Model):
    class Meta:
        host = os.getenv('LOCAL_DYNAMO_HOST')
        region = os.getenv('AWS_REGION', 'us-west-2')
        table_name = f"{os.getenv('STACK_NAME', 'local')}-github-activity"

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
        return GitHubActivity.get(plugin, f'TOTAL:{repo}').commit_count
    except GitHubActivity.DoesNotExist:
        logging.warning(f'No TOTAL:{repo} record found for plugin={plugin}')
        return 0
    finally:
        logging.info(f'get_total_commits for plugin={plugin} time_taken={(time.perf_counter() - start) * 1000}ms')


def get_latest_commit(plugin: str, repo: str) -> int:
    """
    Gets latest_commit timestamp stats from dynamo for a plugin
    :return int: latest_commit timestamp

    :param str plugin: Name of the plugin in lowercase for which latest_commit needs to be computed.
    :param str repo: Name of the GitHub repo.
    """
    start = time.perf_counter()
    try:
        return GitHubActivity.get(plugin, f'LATEST:{repo}').timestamp
    except GitHubActivity.DoesNotExist:
        logging.warning(f'No LATEST{repo}: record found for plugin={plugin}')
        return 0
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
    month_type_format = 'MONTH:{0:%Y%m}:{1}'
    start_date = datetime.datetime.now().replace(day=1) - relativedelta(months=1)
    end_date = start_date - relativedelta(months=month_delta - 1)
    condition = GitHubActivity.type_identifier.between(month_type_format.format(end_date, repo),
                                                       month_type_format.format(start_date, repo))

    start = time.perf_counter()
    results = {row.timestamp: row.commit_count for row in GitHubActivity.query(plugin, condition)}
    duration = (time.perf_counter() - start) * 1000
    logging.info(f'Query for plugin={plugin} month_delta={month_delta} time_taken={duration}ms')

    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=datetime.timezone.utc)
    dates = [int((start_date - relativedelta(months=i)).timestamp()) * 1000 for i in range(month_delta - 1, -1, -1)]
    return list(map(lambda date: {'timestamp': date, 'commits': results.get(date, 0)}, dates))
