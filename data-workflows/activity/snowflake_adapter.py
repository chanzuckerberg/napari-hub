import logging
import time
from datetime import datetime
import os
from functools import reduce
from typing import List, Any, Callable, Iterable

import snowflake.connector
from snowflake.connector.cursor import SnowflakeCursor

from activity.install_activity_model import InstallActivityType

LOGGER = logging.getLogger()
TIMESTAMP_FORMAT = "TO_TIMESTAMP('{0:%Y-%m-%d %H:%M:%S}')"


def get_plugins_with_installs_in_window(start_timestamp: int, end_timestamp: int) -> dict[str, datetime]:
    query = f"""
            SELECT 
                LOWER(file_project), MIN(timestamp)
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_timestamp) > {_format_timestamp(start_timestamp)}
                AND TO_TIMESTAMP(ingestion_timestamp) <= {_format_timestamp(end_timestamp)}
            GROUP BY file_project
            ORDER BY file_project
            """

    LOGGER.info(f'Querying for plugins added between start_timestamp={start_timestamp} end_timestamp={end_timestamp}')
    return _mapped_query_results(query, "PYPI", {}, _cursor_to_timestamp_by_plugin_mapper)


def get_plugins_install_count_since_timestamp(plugins_by_earliest_ts: dict[str, datetime],
                                              install_activity_type: InstallActivityType) -> dict[str, List]:
    query = f"""
            SELECT 
                LOWER(file_project), {install_activity_type.get_query_timestamp_projection()}, COUNT(*)
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND ({_generate_subquery_by_type(plugins_by_earliest_ts, install_activity_type)})
            GROUP BY 1, 2
            ORDER BY 1, 2
            """
    LOGGER.info(f'Fetching data for granularity={install_activity_type.name}')
    return _mapped_query_results(query, 'PYPI', {}, _cursor_to_plugin_activity_mapper)


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

    return ' OR '.join([f"LOWER(file_project) = '{name}' AND timestamp >= "
                        f"{TIMESTAMP_FORMAT.format(install_activity_type.get_timestamp_query_formatter(ts))}"
                        for name, ts in plugins_by_timestamp.items()])


def _format_timestamp(timestamp):
    return TIMESTAMP_FORMAT.format(datetime.fromtimestamp(timestamp / 1000.0))


def _cursor_to_timestamp_by_plugin_mapper(accumulator: dict[str, datetime], row: List) -> dict[str, datetime]:
    """
    Updates the accumulator with data from the record. Timestamp is updated to a day level granularity and added to the
    accumulator keyed on plugin name.
    :param dict[str, datetime] accumulator: Accumulator that will be updated with new data
    :param List row: Row from snowflake cursor
    :returns: Accumulator after data from row has been updated
    """
    accumulator[row[0]] = row[1].replace(hour=0, minute=0, second=0)
    return accumulator


def _cursor_to_plugin_activity_mapper(accumulator: dict[str, List], row: List) -> dict[str, List]:
    """
    Updates the accumulator with data from the record. Object with timestamp and count attributes are created from the
    data and added to the accumulator keyed on plugin name.
    :param dict[str, datetime] accumulator: Accumulator that will be updated with new data
    :param List row: Row from snowflake cursor
    :returns: Accumulator after data from row has been updated
   """
    accumulator.setdefault(row[0], []).append({'timestamp': row[1], 'count': row[2]})
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


def _mapped_query_results(query: str, schema: str, accumulator: Any, mapper: Callable) -> Any:
    cursor_iterable = _execute_query(schema, query)
    return reduce(mapper, [row for cursor in cursor_iterable for row in cursor], accumulator)
