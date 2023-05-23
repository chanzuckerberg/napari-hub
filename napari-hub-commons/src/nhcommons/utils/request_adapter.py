import logging
import time
from typing import Dict, Any

import requests

_LOGGER = logging.getLogger()


def get_request(url: str, params: Dict[str, Any] = None, auth=None):
    start_time = time.perf_counter()
    try:
        response = requests.get(url, params=params, auth=auth)
        if response.status_code != requests.codes.ok:
            _LOGGER.error(f"Error calling {url} "
                          f"response.status_code={response.status_code}")
            response.raise_for_status()
        return response
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        _LOGGER.info(f"Request url={url} params={params} time_taken={duration}ms")
