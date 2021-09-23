import os
import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError

zulip_credentials = os.environ.get('ZULIP_CREDENTIALS', "")


def notify_new_packages(existing_packages: dict, new_packages: dict):
    """
    Notify zulip about new packages.

    :param existing_packages: existing packages in cache
    :param new_packages: new packages found
    """
    username = None
    key = None
    if zulip_credentials is not None and len(zulip_credentials.split(":")) == 2:
        username = zulip_credentials.split(":")[0]
        key = zulip_credentials.split(":")[1]
    for package, version in new_packages.items():
        if package not in existing_packages:
            message = f'A new plugin has been published on the napari hub! ' \
                      f'Check out [{package}](https://napari-hub.org/plugins/{package})!'
            if username and key:
                send_zulip_message(username, key, package, message)
            else:
                print(message)
        elif existing_packages[package] != version:
            message = f'A new version of [{package}](https://napari-hub.org/plugins/{package}) is available on the ' \
                      f'napari hub! Check out [{version}](https://napari-hub.org/plugins/{package})!'
            if username and key:
                send_zulip_message(username, key, package, message)
            else:
                print(message)

    for package, version in existing_packages.items():
        if package not in new_packages:
            message = f'This plugin is no longer available on the [napari hub](https://napari-hub.org) :('
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
