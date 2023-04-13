import pandas as pd
from dateutil.relativedelta import relativedelta
from datetime import datetime

BASE = datetime.today().date().replace(day=1)


def generate_expected_usage_timeline(start_range,
                                     timestamp_key='timestamp',
                                     installs_key='installs',
                                     to_installs=lambda i: 2 if i % 2 == 0 else 0):
    to_timestamp = lambda i: int(pd.Timestamp(BASE + relativedelta(months=i)).timestamp()) * 1000
    return [{timestamp_key: to_timestamp(i), installs_key: to_installs(i)} for i in range(start_range, 0)]


def generate_expected_maintenance_timeline(start_range,
                                            timestamp_key='timestamp',
                                            commits_key='commits',
                                            to_commits=lambda i: 3 if i % 2 == 0 else 1):
    to_timestamp = lambda i: int(pd.Timestamp(BASE + relativedelta(months=i)).timestamp()) * 1000
    return [{timestamp_key: to_timestamp(i), commits_key: to_commits(i)} for i in range(start_range, 0)]

