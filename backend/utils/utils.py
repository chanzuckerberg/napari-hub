import logging
import os
import requests
from requests import HTTPError

slack_url = os.environ.get('SLACK_URL')
logger = logging.getLogger(__name__)


def send_alert(message: str):
    """
    Send alert to slack with a message.
    :param message: message to send alongside the alert
    """
    if not slack_url:
        logger.error(f"Unable to send alert because slack URL is not set: {message}")
    else:
        payload = {"text": message}
        try:
            requests.post(slack_url, json=payload)
        except HTTPError:
            logger.error(f"Unable to send alert {payload}")
