import logging
import time
from typing import Dict, Any

import requests
from requests import Response, HTTPError
from requests.auth import AuthBase

logger = logging.getLogger(__name__)


def get_request(url: str, params: Dict[str, Any] = None, auth=None) -> Response:
    start_time = time.perf_counter()
    try:
        response = requests.get(url, params=params, auth=auth)
        if response.status_code == requests.codes.ok:
            return response
        _raise_for_status("GET", url, response)
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        logger.info(f"url={url} params={params} duration={duration}ms")


def post_request(
    url: str,
    params: Dict[str, Any] = None,
    auth: AuthBase = None,
    data: Dict[str, Any] = None,
) -> Response:
    start_time = time.perf_counter()
    try:
        response = requests.post(url, params=params, auth=auth, data=data)
        if response.status_code == requests.codes.ok:
            return response
        _raise_for_status("POST", url, response)
    finally:
        duration = (time.perf_counter() - start_time) * 1000
        logger.info(f"url={url} params={params} duration={duration}ms")


def _raise_for_status(method: str, url: str, response: Response) -> None:
    logger.error(f"calling {method} {url} status_code={response.status_code}")
    response.raise_for_status()
    raise HTTPError(f"Unexpected error for status={response.status_code}")
