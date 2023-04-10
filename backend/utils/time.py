import time
import logging

LOGGER = logging.getLogger()


def get_current_timestamp() -> int:
    return round(time.time() * 1000)


def get_perf_duration(start: float) -> float:
    return (time.perf_counter() - start) * 1000


def print_perf_duration(start: float, message: str):
    duration = get_perf_duration(start)
    LOGGER.info(f"{message} duration={duration}ms")
