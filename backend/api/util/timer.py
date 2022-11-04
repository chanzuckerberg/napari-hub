import time


class Timer:

    def __init__(self):
        self.__startTime = None

    def start(self):
        self.__startTime = time.perf_counter()

    def get_elapsed_time(self) -> int:
        return int((time.perf_counter() - self.__startTime) * 1000)
