import time

from nhcommons.utils import get_current_timestamp


def test_get_current_time():
    start = round(time.time() * 1000)
    actual = get_current_timestamp()
    end = round(time.time() * 1000)

    assert start <= actual <= end
