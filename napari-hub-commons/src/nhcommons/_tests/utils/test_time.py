import time

from nhcommons import utils


class TestTimeUtils:

    def test_get_current_time(self):
        start = round(time.time() * 1000)
        actual = utils.time.get_current_timestamp()
        end = round(time.time() * 1000)

        assert start <= actual <= end
