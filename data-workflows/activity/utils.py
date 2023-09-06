from datetime import datetime, date, timezone
from typing import Union

from dateutil.relativedelta import relativedelta


def _to_default_entry(timestamp: date) -> dict[str, Union[date, int]]:
    return {
        "timestamp": timestamp,
        "count": 0,
    }


def generate_months_default_value(limit: int):
    upper = datetime.now().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
    )
    return [
        _to_default_entry((upper - relativedelta(months=i)).date())
        for i in range(limit - 1, -1, -1)
    ]
