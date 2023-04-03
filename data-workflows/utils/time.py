import time


def get_perf_duration(start: float) -> float:
    return (time.perf_counter() - start) * 1000


def print_perf_duration(start: float, message: str):
    duration = get_perf_duration(start)
    print(f"{message} duration={duration}ms")
