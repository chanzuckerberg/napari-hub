import json
import os
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
        message = create_message(package, version, existing_packages, packages_metadata)
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

def create_message(package: str, version: str, existing_packages: Dict[str, str], packages_metadata: dict):
    """
    Generates the message for the zulip bot to send. Checks if the plugin already exists and whether or not it has release notes.
    Returns the message for the zulip bot to send, if there's no change in version number, we'll return a blank string which prevents the zulip bot from sending a message

    :param package: name of plugin 
    :param version: version of the plugin we're dealing with
    :param existing_packages: existing packages in cache
    :param release_notes: release notes found from the github api
    :param link_to_release: a link to the github release page
    """
    # handles case with new plugins
    if package not in existing_packages:
        release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
        if not release_notes:
            message_add_on = ''
        else:
            message_add_on = f'\nAlso check out its release notes for version {link_to_release}:{message_separator}{release_notes}'
        message = f'A new plugin has been published on the napari hub! ' \
                    f'Check out [{package}](https://napari-hub.org/plugins/{package})!{message_add_on}'
    # handles case with updating plugins
    elif existing_packages[package] != version:
        release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
        if not release_notes:
            message_add_on = ''
        else:
            message_add_on = f'Check out the release notes for {link_to_release}:{message_separator}{release_notes}'
        message = f'A new version of [{package}](https://napari-hub.org/plugins/{package}) is available on the ' \
                    f'napari hub! {message_add_on}'
    else:
        # handles case where the version is the same, so we don't send a message
        message = ''
    return message

def generate_release_notes_and_link_to_release(package: str, version: str, packages_metadata: dict):
    """
    Parses through the metadata of a plugin to find it's release notes if they exist
    If they don't exist, return a blank string and a link to napari-hub
    Returns the release notes and a link for the zulip bot to add to its message
    Release notes and links to release are generated together because the returned link depends on how the release note is acquired and whether it actually is accquired

    :param existing_packages: existing packages in cache
    :param new_packages: new packages found
    :param packages_metadata: metadata for the packages, contains information about github links
    """
    # if plugin has a "code_repository" entry that isn't blank or null, parse their username information to call the github api
    if packages_metadata[package].get("code_repository"):
        github_link = packages_metadata[package]["code_repository"]
        owner_and_name = get_owner_and_name(github_link)
        github_api_endpoint = create_github_endpoint(owner_and_name, version, with_v = False)
        release_notes = get_release_notes(github_api_endpoint)
        # there is a slight mismatch between pypi and github tag versions
        # sometimes the github tag version number has a v in the front, but versions from pypi metadata never have a v in the front
        # can't tell if release notes exist without trying both possibilities due to format of github api responses, hence the need to call twice 
        if not release_notes:
            github_api_endpoint_with_v = create_github_endpoint(owner_and_name, version, with_v = True)
            release_notes = get_release_notes(github_api_endpoint_with_v)
            # if the 2nd attempt gets release notes, we make a link with v in the version
            if release_notes:
                link_to_release = f'[v{version}]({github_link}/releases/tag/v{version})'
            # if the 2nd attempt fails to get release notes, we default to using the napari-hub link
            else:
                link_to_release = f'[{version}](https://napari-hub.org/plugins/{package})'
        # if release notes were found, we know the version without v is the right one
        else:
            link_to_release = f'[{version}]({github_link}/releases/tag/{version})'
    else:
        # link to napari hub will be used unstead of link to github if the plugin doesn't have a github repo
        release_notes = ''
        link_to_release = f'[{version}](https://napari-hub.org/plugins/{package})'
    return release_notes, link_to_release

def get_owner_and_name(github_link):
    """
    Creates a string containing the owner of the repo and the name of the plugin in the form '{owner name}/{plugin name}' from a link to the github page
    Expects the format of the github link ot be in the form https://github.com/{owner name}/{plugin name}, if it isn't like that, we won't get a release note

    :param github_linke: 
    """
    return github_link.replace('https://github.com/', '')

def create_github_endpoint(owner_and_name, version, with_v = False):
    """
    Creates a link to a github api endpoint that could be used to get release notes
    There are two versions of the link, with and without v, because some github tag versions have a v in their version, 
    but all pypi version don't have a v, so both endpoints need ot be tried to be sure there's no release notes

    :param owner_and_name: a string containing the owner of the repo and the name of the plugin in the form '{owner name}/{plugin name}'
    :param version: current version of the plugin
    :param with_v: whether or not a v should be included in the link
    """
    if with_v:
        return f'https://api.github.com/repos/{owner_and_name}/releases/tags/v{version}'
    else:
        return f'https://api.github.com/repos/{owner_and_name}/releases/tags/{version}'

def get_release_notes(endpoint: str):
    """
    Call github actions api and parse through the response to return the release notes text
    If no release notes text are found, or in th event of an error, return an empty string

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
