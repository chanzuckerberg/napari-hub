import logging
import time
from datetime import datetime
import os
from functools import reduce
from typing import List, Any, Callable, Iterable

import snowflake.connector
from snowflake.connector.cursor import SnowflakeCursor

from activity.model import InstallActivityType, timestamp_mapper_by_type
from utils import datetime_from_millis

SNOWFLAKE_USER = os.getenv('SNOWFLAKE_USER')
SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')


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

    logging.info(f'Querying for plugins added between start_timestamp={start_timestamp} end_timestamp={end_timestamp}')
    return _mapped_query_results(query, "PYPI", {}, _cursor_to_plugin_timestamp_mapper)


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
    logging.info(f'Fetching data for granularity={install_activity_type.name}')
    return _mapped_query_results(query, 'PYPI', {}, _cursor_to_plugin_activity_mapper)


def _generate_subquery_by_type(plugins_by_timestamp: dict[str, datetime], install_activity_type: InstallActivityType):
    if install_activity_type is InstallActivityType.TOTAL:
        return f"""LOWER(file_project) IN ({','.join([f"'{plugin}'" for plugin in plugins_by_timestamp.keys()])})"""

    timestamp_mapper = timestamp_mapper_by_type[install_activity_type]
    return ' OR '.join([f"""LOWER(file_project) = '{name}' AND timestamp >= {_format_timestamp(timestamp_mapper(ts))}"""
                        for name, ts in plugins_by_timestamp.items()])


def _format_timestamp(timestamp):
    datetime_obj = timestamp if type(timestamp) is datetime else datetime_from_millis(timestamp)
    return f"""TO_TIMESTAMP('{datetime_obj.strftime("%Y-%m-%d %H:%M:%S")}')"""


def _cursor_to_plugin_timestamp_mapper(accumulator: dict[str, datetime], row: List) -> dict[str, datetime]:
    accumulator[row[0]] = row[1].replace(hour=0, minute=0, second=0)
    return accumulator


def _cursor_to_plugin_activity_mapper(accumulator: dict[str, List], row: List) -> dict[str, List]:
    accumulator.setdefault(row[0], []).append({'timestamp': row[1], 'count': row[2]})
    return accumulator


def _execute_query(schema: str, query: str) -> Iterable[SnowflakeCursor]:
    connection = snowflake.connector.connect(
        user=SNOWFLAKE_USER,
        password=SNOWFLAKE_PASSWORD,
        account="CZI-IMAGING",
        warehouse="IMAGING",
        database="IMAGING",
        schema=schema
    )
    start = time.perf_counter_ns()
    try:
        return connection.execute_string(query)
    except Exception:
        logging.exception(f'Exception when executing query={query}')
    finally:
        duration = time.perf_counter_ns() - start
        logging.info(f'Query execution time={duration // 1000000}ms')


def _mapped_query_results(query: str, schema: str, accumulator: Any, mapper: Callable) -> Any:
    cursor_iterable = _execute_query(schema, query)
    return reduce(mapper, [row for cursor in cursor_iterable for row in cursor], accumulator)
