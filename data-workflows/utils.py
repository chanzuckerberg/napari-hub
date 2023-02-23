import time
from datetime import datetime


def get_current_timestamp():
    return round(time.time() * 1000)


def datetime_from_millis(millis) -> datetime:
    return datetime.fromtimestamp(millis / 1000.0)


def get_last_updated_timestamp():
    #TODO: fetch from parameter store
    return 1677363042000


def set_last_updated_timestamp(timestamp):
    #TODO: update parameter store
    return
