import os

import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError
from utils.datadog import report_metrics

# Environment variable set through ecs stack terraform module
zulip_credentials = os.environ.get('ZULIP_CREDENTIALS', "")


def notify_packages(package: str, version: str = None, removed: bool = False):
    """
    Notify package update.

    :param package: name of the package
    :param version: version of the package
    :param removed: if the package is no longer available
    """
    username = None
    key = None
    if zulip_credentials is not None and len(zulip_credentials.split(":")) == 2:
        username = zulip_credentials.split(":")[0]
        key = zulip_credentials.split(":")[1]

    if removed:
        message = f'{package} is no longer available on the [napari hub](https://napari-hub.org) :('
        report_metrics('napari_hub.plugins.count', 1, ['status:removal'])
    elif not version:
        message = f'A new plugin has been published on the napari hub! ' \
                  f'Check out [{package}](https://napari-hub.org/plugins/{package})!'
        report_metrics('napari_hub.plugins.count', 1, ['status:new'])
    else:
        message = f'A new version of [{package}](https://napari-hub.org/plugins/{package}) is available on the ' \
                  f'napari hub! Check out [{version}](https://napari-hub.org/plugins/{package})!'
        report_metrics('napari_hub.plugins.count', 1, ['status:update'])
    if username and key:
        send_zulip_message(username, key, package, message)
    else:
        print(message)


def send_zulip_message(username: str, key: str, topic: str, message: str):
    """
    Send message to zulip
    :param username: username for the user to post message
    :param key: api key for the user
    :param topic: topic in zulip stream to send
    :param message: message to send
    """
    try:
        data = {
            'type': 'stream',
            'to': 'hub-updates',
            'topic': topic,
            'content': message
        }
        response = requests.post('https://napari.zulipchat.com/api/v1/messages',
                                 auth=HTTPBasicAuth(username, key), data=data)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
    except HTTPError:
        pass
