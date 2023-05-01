import logging
import time
from datetime import datetime
import os
from functools import reduce
from typing import List, Any, Callable, Iterable

import snowflake.connector
from snowflake.connector.cursor import SnowflakeCursor

from activity.install_activity_model import InstallActivityType
from activity.github_activity_model import GitHubActivityType

LOGGER = logging.getLogger()
TIMESTAMP_FORMAT = "TO_TIMESTAMP('{0:%Y-%m-%d %H:%M:%S}')"


def get_plugins_with_installs_in_window(start_millis: int, end_millis: int) -> dict[str, datetime]:
    query = f"""
            SELECT 
                LOWER(file_project) AS name, DATE_TRUNC('DAY', MIN(timestamp)) AS earliest_timestamp
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_timestamp) > {_format_timestamp(timestamp_millis=start_millis)}
                AND TO_TIMESTAMP(ingestion_timestamp) <= {_format_timestamp(timestamp_millis=end_millis)}
            GROUP BY name
            ORDER BY name
            """
    LOGGER.info(f'Querying for plugins added between start_timestamp={start_millis} end_timestamp={end_millis}')
    return _mapped_query_results(query, "PYPI", {}, _cursor_to_timestamp_by_name_mapper)


def get_plugins_install_count_since_timestamp(plugins_by_earliest_ts: dict[str, datetime],
                                              install_activity_type: InstallActivityType) -> dict[str, List]:
    query = f"""
            SELECT 
                LOWER(file_project) AS name, 
                {install_activity_type.get_query_timestamp_projection()} AS ts, 
                COUNT(*) AS count
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND ({_generate_subquery_by_type(plugins_by_earliest_ts, install_activity_type)})
            GROUP BY name, ts
            ORDER BY name, ts
            """
    LOGGER.info(f'Fetching data for granularity={install_activity_type.name}')
    return _mapped_query_results(query, 'PYPI', {}, _cursor_to_plugin_activity_mapper)


def get_plugins_with_commits_in_window(start_millis: int, end_millis: int) -> dict[str, datetime]:
    query = f"""
            SELECT 
                repo AS name, DATE_TRUNC('DAY', TO_DATE(min(commit_author_date))) AS earliest_timestamp 
            FROM 
                imaging.github.commits  
            WHERE 
                repo_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_time) > {_format_timestamp(timestamp_millis=start_millis)}
                AND TO_TIMESTAMP(ingestion_time) <= {_format_timestamp(timestamp_millis=end_millis)}
            GROUP BY name
            ORDER BY name
            """
    LOGGER.info(f'Querying for plugins added between start_timestamp={start_millis} end_timestamp={end_millis}')
    return _mapped_query_results(query, 'GITHUB', {}, _cursor_to_timestamp_by_name_mapper)


def get_plugins_commit_count_since_timestamp(plugins_by_earliest_ts: dict[str, datetime],
                                             github_activity_type: GitHubActivityType) -> dict[str, List]:
    """This method gets the commit data since a specific starting point for each plugin.
    If GitHubActivityType.LATEST, fetch the latest commit timestamp, so construct query without commit count constraint
    If GitHubActivityType.MONTH, fetch the sum of commits from the beginning of the month of the timestamp specified
    for each of the plugin.
    If GitHubActivityType.TOTAL, fetch the sum of commits over all time, so construct query without timestamp constraint
    :param dict[str, datetime] plugins_by_earliest_ts: plugin name by earliest timestamp of commit record added
    :param GitHubActivityType github_activity_type:
    """
    if github_activity_type is GitHubActivityType.LATEST:
        accumulator_updater = _cursor_to_plugin_github_activity_latest_mapper
    elif github_activity_type is GitHubActivityType.MONTH:
        accumulator_updater = _cursor_to_plugin_activity_mapper
    else:
        accumulator_updater = _cursor_to_plugin_github_activity_total_mapper
    LOGGER.info(f'Fetching data for granularity={github_activity_type.name}')
    return _mapped_query_results(
        query=github_activity_type.get_query(plugins_by_earliest_ts),
        schema="GITHUB",
        accumulator={},
        accumulator_updater=accumulator_updater,
    )


def _generate_subquery_by_type(plugins_by_timestamp: dict[str, datetime], install_activity_type: InstallActivityType):
    """
    Returns subquery clause generated from the plugins_by_timestamp data based on the InstallActivityType. It is used to
    get the install count since a specific starting point for each plugin.
    If InstallActivityType.TOTAL, fetch the sum of installs over all time, so construct subquery without timestamp
    constraint.
    If InstallActivityType.MONTH, fetch the sum of installs from the beginning of the month of the timestamp specified
    for each of the plugin.
    If InstallActivityType.DAY, fetch the sum of installs from the beginning of the day of the timestamp specified
    for each of the plugin.
    :param dict[str, datetime] plugins_by_timestamp: plugin name by earliest timestamp of install record added
    :param InstallActivityType install_activity_type:
    """
    if install_activity_type is InstallActivityType.TOTAL:
        return f"""LOWER(file_project) IN ({','.join([f"'{plugin}'" for plugin in plugins_by_timestamp.keys()])})"""

    if install_activity_type is InstallActivityType.MONTH:
        plugins_by_formatted_timestamp = {plugin: ts.replace(day=1) for plugin, ts in plugins_by_timestamp.items()}
    else:
        plugins_by_formatted_timestamp = plugins_by_timestamp

    return ' OR '.join([f"LOWER(file_project) = '{name}' AND timestamp >= "f"{TIMESTAMP_FORMAT.format(ts)}"
                        for name, ts in plugins_by_formatted_timestamp.items()])


def _format_timestamp(timestamp_millis):
    return TIMESTAMP_FORMAT.format(datetime.utcfromtimestamp(timestamp_millis / 1000.0))


def _cursor_to_timestamp_by_name_mapper(accumulator: dict[str, datetime], cursor) -> dict[str, datetime]:
    """
    Updates the accumulator with data from the cursor. Timestamp is added to the accumulator keyed on name.
    The cursor contains the fields name and earliest_timestamp
    :param dict[str, datetime] accumulator: Accumulator that will be updated with new data
    :param SnowflakeCursor cursor:
    :returns: Accumulator after data from cursor has been added
    """
    for name, earliest_timestamp in cursor:
        accumulator[name] = earliest_timestamp
    return accumulator


def _cursor_to_plugin_activity_mapper(accumulator: dict[str, List], cursor) -> dict[str, List]:
    """
    Updates the accumulator with data from the cursor. Object with timestamp and count attributes are created from the
    cursor record and added to the accumulator keyed on name.
    The cursor contains the fields name, timestamp, and count
    :param dict[str, List] accumulator: Accumulator that will be updated with new data
    :param SnowflakeCursor cursor:
    :returns: Accumulator after data from cursor has been added
   """
    for name, timestamp, count in cursor:
        accumulator.setdefault(name, []).append({'timestamp': timestamp, 'count': count})
    return accumulator


def _cursor_to_plugin_github_activity_latest_mapper(accumulator: dict[str, List], cursor) -> dict[str, List]:
    """
    Updates the accumulator with data from the cursor for GitHubActivityType.LATEST.
    Object with timestamp is created from the cursor record and added to the accumulator keyed on repo name.
    The cursor contains the fields repo name and timestamp
    :param dict[str, List] accumulator: Accumulator that will be updated with new data
    :param SnowflakeCursor cursor:
    :returns: Accumulator after data from cursor has been added
   """
    for name, timestamp in cursor:
        accumulator.setdefault(name, []).append({'timestamp': timestamp})
    return accumulator


def _cursor_to_plugin_github_activity_total_mapper(accumulator: dict[str, List], cursor) -> dict[str, List]:
    """
    Updates the accumulator with data from the cursor for GitHubActivityType.TOTAL.
    Object with count are created from the cursor record and added to the accumulator keyed on repo name.
    The cursor contains the fields repo name and count
    :param dict[str, List] accumulator: Accumulator that will be updated with new data
    :param SnowflakeCursor cursor:
    :returns: Accumulator after data from cursor has been added
   """
    for name, count in cursor:
        accumulator.setdefault(name, []).append({'count': count})
    return accumulator


def _execute_query(schema: str, query: str) -> Iterable[SnowflakeCursor]:
    connection = snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account="CZI-IMAGING",
        warehouse="IMAGING",
        database="IMAGING",
        schema=schema
    )
    start = time.perf_counter()
    try:
        return connection.execute_string(query)
    except Exception:
        LOGGER.exception(f'Exception when executing query={query}')
    finally:
        duration = time.perf_counter() - start
        LOGGER.info(f'Query execution time={duration * 1000}ms')


def _mapped_query_results(query: str, schema: str, accumulator: Any, accumulator_updater: Callable) -> Any:
    return reduce(accumulator_updater, _execute_query(schema, query), accumulator)
