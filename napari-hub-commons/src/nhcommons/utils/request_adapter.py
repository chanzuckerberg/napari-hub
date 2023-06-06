import logging
import time
from typing import Dict, Any

import requests

logger = logging.getLogger(__name__)


def get_request(url: str, params: Dict[str, Any] = None, auth=None):
    start_time = time.perf_counter()
    try:
        response = requests.get(url, params=params, auth=auth)
        if response.status_code == requests.codes.ok:
            return response
        logger.error(f"calling {url} status_code={response.status_code}")
        response.raise_for_status()
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        logger.info(f"url={url} params={params} duration={duration}ms")
