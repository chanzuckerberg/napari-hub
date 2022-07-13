import json
import os
from struct import pack
from typing import Dict

import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError

from utils.test_utils import message_separator

# Environment variable set through ecs stack terraform module
zulip_credentials = os.environ.get('ZULIP_CREDENTIALS', "")


def notify_new_packages(existing_packages: Dict[str, str], new_packages: Dict[str, str], packages_metadata: dict):
    """
    Notify zulip about new packages.

    :param existing_packages: existing packages in cache
    :param new_packages: new packages found
    :param packages_metadata: metadata for the packages, contains information about github links
    """
    username = None
    key = None
    if zulip_credentials is not None and len(zulip_credentials.split(":")) == 2:
        username = zulip_credentials.split(":")[0]
        key = zulip_credentials.split(":")[1]
    for package, version in new_packages.items():
        release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
        message = create_message(package, version, existing_packages, release_notes, link_to_release)
        if username and key and message:
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

def get_release_notes_from(endpoint: str):
    """
    Call github actions api and parse through the response to return the release notes text
    If no release notes text are found, we default to return an empty string
    :param endpoint: Github actions endpoint
    """
    try:
        response = requests.get(endpoint)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        info = json.loads(response.text.strip())
        if "body" in info:
            return info["body"]
        return ''
    except HTTPError:
        return ''

def generate_release_notes_and_link_to_release(package: str, version: str, packages_metadata: dict):
    """
    Parses through the metadata of a plugin to find it's release notes if they exist
    returns the release notes and a link for the zulip bot to add to its message

    :param existing_packages: existing packages in cache
    :param new_packages: new packages found
    :param packages_metadata: metadata for the packages, contains information about github links
    """
    # checks if plugin has a "code_repository" and that the "code_repository" is not none
    if "code_repository" in packages_metadata[package] and packages_metadata[package]["code_repository"]:
        github_link = packages_metadata[package]["code_repository"]
        owner_and_repo = github_link.replace('https://github.com/', '')
        general_github_api_endpoint = f'https://api.github.com/repos/{owner_and_repo}/releases/tags/'
        github_api_endpoint = f'{general_github_api_endpoint}{version}'
        release_notes = get_release_notes_from(github_api_endpoint)
        link_to_release = f'[{version}]({github_link}/releases/tag/{version})'
        # sometimes our version number has a v in the front, so we check for that if first attempt without a v fails
        if not release_notes:
            github_api_endpoint_with_v = f'{general_github_api_endpoint}v{version}'
            release_notes = get_release_notes_from(github_api_endpoint_with_v)
            # if the 2nd attempt gets release notes, we make a link with v in the version
            if release_notes:
                link_to_release = f'[v{version}]({github_link}/releases/tag/v{version})'
            # if the 2nd attempt fails to get release notes, we default to using the napari-hub link
            else:
                link_to_release = f'[{version}](https://napari-hub.org/plugins/{package})'
    # sometimes the plugin doesn't have a github repo
    else:
        release_notes = ''
        link_to_release = f'[{version}](https://napari-hub.org/plugins/{package})'
    return release_notes, link_to_release

def create_message(package: str, version: str, existing_packages: Dict[str, str], release_notes: str, link_to_release: str):
    """
    generates a message for the zulip bot to send

    :param package: plugin we're dealing with
    :param version: version of the plugin we're dealing with
    :param existing_packages: existing packages in cache
    :param release_notes: release notes found from the github api
    :param link_to_release: a link to the github release page, if it exists
    """
    if package not in existing_packages:
        if not release_notes:
            message_add_on = ''
        else:
            message_add_on = f'\nAlso check out its release notes for version {link_to_release}:{message_separator}{release_notes}'
        message = f'A new plugin has been published on the napari hub! ' \
                    f'Check out [{package}](https://napari-hub.org/plugins/{package})!{message_add_on}'
    elif existing_packages[package] != version:
        if not release_notes:
            message_add_on = ''
        else:
            message_add_on = f'Check out the release notes for {link_to_release}:{message_separator}{release_notes}'
        message = f'A new version of [{package}](https://napari-hub.org/plugins/{package}) is available on the ' \
                    f'napari hub! {message_add_on}'
    else:
        message = ''
    return message
    
