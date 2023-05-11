import time


def get_current_timestamp() -> int:
    return round(time.time() * 1000)
