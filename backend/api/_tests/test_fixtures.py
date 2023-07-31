from dateutil.relativedelta import relativedelta
from datetime import datetime, date, timezone

BASE = datetime.combine(date.today(), datetime.min.time()).replace(day=1, tzinfo=timezone.utc)


def _to_timestamp(i):
    return int((BASE + relativedelta(months=i)).timestamp()) * 1000


def _generate_timeline(start_range, value_key, to_value, timestamp_key='timestamp'):
    return [{timestamp_key: _to_timestamp(i), value_key: to_value(abs(i))} for i in range(start_range, 0)]


def generate_installs_timeline(start_range, ts_key='timestamp', to_value=lambda i: 2 if i % 2 == 0 else 0):
    return _generate_timeline(start_range=start_range, value_key='installs', to_value=to_value, timestamp_key=ts_key)


def generate_commits_timeline(start_range, ts_key='timestamp', to_value=lambda i: i + 5):
    return _generate_timeline(start_range=start_range, value_key='commits', to_value=to_value, timestamp_key=ts_key)
