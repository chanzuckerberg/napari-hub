import time
from datetime import date, datetime, timezone


def get_current_timestamp() -> int:
    return round(time.time() * 1000)

