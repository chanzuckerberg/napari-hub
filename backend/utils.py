import os
from typing import List

import requests
from bs4 import BeautifulSoup
from markdown import markdown
from requests import HTTPError

# Environment variable set through lambda terraform infra config
slack_url = os.environ.get('SLACK_URL')


def get_attribute(obj: dict, path: list):
    """
    Get attribute iteratively from a json object.

    :param obj: object to iterate on
    :param path: list of string to get subpath within json
    :return: the value if the path is accessible, empty string if not found
    """
    part = obj
    for token in path:
        if isinstance(part, dict) and token in part:
            part = part[token]
        elif isinstance(part, list) and token < len(part):
            part = part[token]
        else:
            return ""
    return part


def filter_prefix(str_list: List[str], prefix: str) -> list:
    """
    Filter the list for strings with the given prefix.

    :param str_list: list of strings to filter
    :param prefix: prefix to filter on
    :return: list of filtered strings
    """
    return [string for string in str_list if string.startswith(prefix)]


def render_description(description: str) -> str:
    if description != '':
        html = markdown(description)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

    return ''


def send_alert(message: str):
    """
    Send alert to slack with a message.

    :param message: message to send alongside the alert
    """
    payload = {
        "text": message
    }
    if slack_url is None:
        print("Unable to send alert because slack URL is not set")
    else:
        try:
            requests.post(slack_url, json=payload)
        except HTTPError:
            print("Unable to send alert")
