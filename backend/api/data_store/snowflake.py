import snowflake.connector as sc
import os
from functools import reduce
from typing import Dict


class SnowflakeDAO:

    def __init(self):
        self.__user = os.getenv("SNOWFLAKE_USER")
        self.__password = os.getenv("SNOWFLAKE_PASSWORD")
        self.__account = "CZI-IMAGING"
        self.__warehouse = "IMAGING"
        self.__database = "IMAGING"

    def get_activity_data(self) -> Dict:
        """
        Query snowflake to fetch activity data.
        """
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
        return self.__get_from_db(query, self.__accumulate_activity, {})

    def get_recent_activity_data(self) -> Dict:
        """
            Query snowflake to fetch recent activity data.
        """
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
        return self.__get_from_db(query, self.__accumulate_recent_activity, {})

    def __get_from_db(self, query_str, reducer, accumulator, schema="PYPI"):
        ctx = sc.connect(
            user=self.__user,
            password=self.__password,
            account=self.__account,
            warehouse=self.__warehouse,
            database=self.__database,
            schema=schema
        )
        for cursor in ctx.execute_string(query_str):
            reduce(reducer, [row for row in cursor], accumulator)

        return accumulator

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
