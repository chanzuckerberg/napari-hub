import snowflake.connector as snowflake_connector
import os
from functools import reduce
from typing import Dict
import logging

from utils.timer import Timer


ACTIVITY_DATA_QUERY = """
        SELECT 
            file_project, DATE_TRUNC('month', timestamp) as month, count(*) as num_downloads
        FROM
            imaging.pypi.labeled_downloads
        WHERE 
            download_type = 'pip'
            AND project_type = 'plugin'
        GROUP BY file_project, month
        ORDER BY file_project, month
    """
RECENT_ACTIVITY_DATA_QUERY = """
        SELECT 
            file_project, count(*) as num_downloads
        FROM
            imaging.pypi.labeled_downloads
        WHERE 
            download_type = 'pip'
            AND project_type = 'plugin'
            AND timestamp > DATEADD(DAY, -30, CURRENT_DATE)
        GROUP BY file_project     
        ORDER BY file_project
    """


class SnowflakeDAO:

    def __init__(self):
        self.__user = os.getenv("SNOWFLAKE_USER")
        self.__password = os.getenv("SNOWFLAKE_PASSWORD")

    def get_activity_data(self) -> Dict:
        return self.__get_from_db(ACTIVITY_DATA_QUERY, self.__accumulate_activity, {}, "get_activity_data")

    def get_recent_activity_data(self) -> Dict:
        return self.__get_from_db(RECENT_ACTIVITY_DATA_QUERY, self.__accumulate_recent_activity, {}, "get_recent_activity_data")

    def __get_connection(self, account="CZI-IMAGING", database="IMAGING", schema="PYPI", warehouse="IMAGING"):
        return snowflake_connector.connect(
            user=self.__user,
            password=self.__password,
            account=account,
            warehouse=warehouse,
            database=database,
            schema=schema
        )

    def __get_from_db(self, query_str, reducer, accumulator, query_name):
        timer = Timer()
        timer.start()
        try:
            for cursor in self.__get_connection().execute_string(query_str):
                reduce(reducer, [row for row in cursor], accumulator)

            return accumulator
        except Exception:
            logging.exception(f"Exception on fetching from snowflake query={query_name}", exc_info=True)
            return None
        finally:
            logging.info(f"snowflake query={query_name} elapsed_time={timer.get_elapsed_time()}")

    @staticmethod
    def __accumulate_activity(accumulator, row) -> Dict:
        plugin = row[0]
        if plugin not in accumulator:
            accumulator[plugin] = []

        accumulator[plugin].append({'month': row[1], 'downloads': row[2]})
        return accumulator

    @staticmethod
    def __accumulate_recent_activity(accumulator, entry) -> Dict:
        accumulator[entry[0]] = entry[1]
        return accumulator
