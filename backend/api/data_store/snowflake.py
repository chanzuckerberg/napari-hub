import snowflake.connector as snowflake_connector
import os
from functools import reduce
from typing import Dict
import logging

from api.util.timer import Timer


class SnowflakeDAO:

    def __init__(self, account="CZI-IMAGING", warehouse="IMAGING", database="IMAGING", schema="PYPI"):
        self.__user = os.getenv("SNOWFLAKE_USER")
        self.__password = os.getenv("SNOWFLAKE_PASSWORD")

        self.__connection = snowflake_connector.connect(
            user=self.__user,
            password=self.__password,
            account=account,
            warehouse=warehouse,
            database=database,
            schema=schema
        )

    def get_activity_data(self) -> Dict:
        query = """
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
        return self.__get_from_db(query, self.__accumulate_activity, {}, "get_activity_data")

    def get_recent_activity_data(self) -> Dict:
        query = """
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

        return self.__get_from_db(query, self.__accumulate_recent_activity, {}, "get_recent_activity_data")

    def __get_from_db(self, query_str, reducer, accumulator, query_name):
        timer = Timer()
        timer.start()
        try:
            for cursor in self.__connection.execute_string(query_str):
                reduce(reducer, [row for row in cursor], accumulator)

            return accumulator
        except Exception as e:
            logging.error(f"Exception on fetching from snowflake", e)
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
