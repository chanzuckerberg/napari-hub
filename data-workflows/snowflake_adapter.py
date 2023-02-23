from datetime import datetime
import os
from functools import reduce
from typing import List

import snowflake.connector

from utils import datetime_from_millis

SNOWFLAKE_USER = os.getenv('SNOWFLAKE_USER')
SNOWFLAKE_PASSWORD = os.getenv('SNOWFLAKE_PASSWORD')


def get_plugins_with_activity_since_last_update(last_updated_timestamp, end_timestamp):
    query = f"""
            SELECT 
                LOWER(file_project), MIN(timestamp)
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND TO_TIMESTAMP(ingestion_timestamp) > {_format_timestamp(last_updated_timestamp)}
                AND TO_TIMESTAMP(ingestion_timestamp) <= {_format_timestamp(end_timestamp)}
            GROUP BY file_project
            ORDER BY file_project            
            """
    return _execute_query(query, "PYPI", {}, _cursor_to_plugin_timestamp_mapper)


def get_plugins_install_count_since_timestamp(plugins_by_earliest_ts, granularity, time_mapper):
    subquery = ' OR '.join([f"""file_project = '{name}' AND timestamp >= {_format_timestamp(time_mapper(ts))}"""
                            for name, ts in plugins_by_earliest_ts.items()])
    query = f"""
            SELECT 
                LOWER(file_project), DATE_TRUNC('{granularity}', timestamp) as granular_timestamp, count(*) as num_downloads
            FROM
                imaging.pypi.labeled_downloads
            WHERE 
                download_type = 'pip'
                AND project_type = 'plugin'
                AND ({subquery})
            GROUP BY file_project, granular_timestamp
            ORDER BY file_project, granular_timestamp
            """
    return _execute_query(query, "PYPI", {}, _cursor_to_plugin_activity_mapper)


def _format_timestamp(timestamp):
    datetime_obj = timestamp if type(timestamp) is datetime else datetime_from_millis(timestamp)
    return f"""TO_TIMESTAMP('{datetime_obj.strftime("%Y-%m-%d %H:%M:%S")}')"""


def _cursor_to_plugin_timestamp_mapper(accumulator, row):
    accumulator[row[0]] = row[1].replace(hour=0, minute=0, second=0)
    return accumulator


def _cursor_to_plugin_activity_mapper(accumulator, row):
    accumulator.setdefault(row[0], []).append({'timestamp': row[1], 'count': row[2]})
    return accumulator


def _execute_query(query, schema, accumulator, mapper) -> List:
    ctx = snowflake.connector.connect(
        user=SNOWFLAKE_USER,
        password=SNOWFLAKE_PASSWORD,
        account="CZI-IMAGING",
        warehouse="IMAGING",
        database="IMAGING",
        schema=schema
    )
    cursor_list = ctx.execute_string(query)
    return reduce(mapper, [row for cursor in cursor_list for row in cursor], accumulator)
