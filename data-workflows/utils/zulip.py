import logging
import os
from json import JSONDecodeError
from typing import Optional, Tuple

from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError

from nhcommons.utils.adapter_helpers import GithubClientHelper
from nhcommons.utils.request_adapter import post_request, get_request


class Zulip:
    def __init__(self):
        self._username, self._key = self._get_zulip_credentials()

    @classmethod
    def _get_zulip_credentials(cls) -> Tuple[Optional[str], Optional[str]]:
        zulip_credentials = os.environ.get("ZULIP_CREDENTIALS", "")
        if zulip_credentials and len(zulip_credentials.split(":")) == 2:
            split_values = zulip_credentials.split(":")
            return split_values[0], split_values[1]
        return None, None

    def has_valid_credentials(self) -> bool:
        return all([self._username, self._key])

    def get_auth(self) -> HTTPBasicAuth:
        return HTTPBasicAuth(self._username, self._key)


SEPARATOR = "\n-------------------------------\n"
ZULIP_URL = "https://napari.zulipchat.com/api/v1/messages"
logger = logging.getLogger(__name__)


def plugin_no_longer_on_hub(name: str) -> None:
    """
    Notify zulip about packages no longer on the hub.
    :param name: name of the plugin package
    """
    message = (
        "This plugin is no longer available on the [napari hub]"
        "(https://napari-hub.org) :("
    )
    send_zulip_message(name, message)


def new_plugin_on_hub(name: str, version: str, code_repo: Optional[str]) -> None:
    """
    Notify zulip about new package.
    :param name: name of the plugin package
    :param version: version of the plugin package
    :param code_repo: code_repo associated with the plugin package
    """
    release_notes, link_to_release = get_release_notes_and_link_to_release(
        name, version, code_repo
    )
    if not release_notes:
        # if no release notes exist, clicking on the version will link to napari-hub
        # this was to minimize changes in format compared to previous messages
        message_add_on = f" with version {link_to_release}!"
    else:
        # if release notes exist, we'll link to the GitHub release notes and paste
        # the release notes in the message
        message_add_on = (
            f"!\nAlso check out its release notes for version {link_to_release}:"
            f"{SEPARATOR}{release_notes}"
        )
    message = (
        f"A new plugin has been published on the napari hub! "
        f"Check out [{name}](https://napari-hub.org/plugins/{name}){message_add_on}"
    )
    send_zulip_message(name, message)


def plugin_updated_on_hub(name: str, version: str, code_repo: Optional[str]) -> None:
    """
    Notify zulip about updates to packages.
    :param name: name of the plugin package
    :param version: version of the plugin package
    :param code_repo: code_repo associated with the plugin package
    """
    release_notes, link_to_release = get_release_notes_and_link_to_release(
        name, version, code_repo
    )
    if not release_notes:
        # if no release notes exist, clicking on the version will link to napari-hub
        # this was to minimize changes in format compared to previous messages
        message_add_on = f"Check out {link_to_release}!"
    else:
        # if release notes exist, we'll link to the GitHub release notes and paste
        # the release notes in the message
        message_add_on = (
            f"Check out the release notes for {link_to_release}:"
            f"{SEPARATOR}{release_notes}"
        )
    message = (
        f"A new version of [{name}](https://napari-hub.org/plugins/{name}) is "
        f"available on the napari hub! {message_add_on}"
    )
    send_zulip_message(name, message)


def get_release_notes_and_link_to_release(
    package: str, version: str, code_repository: Optional[str]
):
    release_notes = ""
    link = f"[{version}](https://napari-hub.org/plugins/{package})"

    if not code_repository:
        return release_notes, link

    # there is a slight mismatch between pypi package version and GitHub tag version
    # sometimes the GitHub tag version has a v in the front, but versions from pypi
    # metadata doesn't. We can't tell if release notes exist without trying both
    # possibilities due to format of GitHub api responses, hence the need to call
    # GitHub api twice.
    # if the 2nd attempt gets release notes, make a link with v in the version else
    # we default to using the napari-hub link
    owner_and_name = GithubClientHelper.replace_github_url(code_repository)
    release_notes = _get_release_notes(owner_and_name, version)
    if not release_notes:
        version = f"v{version}"
        release_notes = _get_release_notes(owner_and_name, version)
    if release_notes:
        link = f"[{version}]({code_repository}/releases/tag/{version})"

    return release_notes, link


def _get_release_notes(repo: str, version: str):
    try:
        url = f"https://api.github.com/repos/{repo}/releases/tags/{version}"
        return get_request(url).json().get("body", "")
    except (HTTPError, JSONDecodeError):
        return ""


def send_zulip_message(topic: str, message: str) -> None:
    """
    Send message to zulip or print if username or key is not valid
    :param topic: topic in zulip stream to send
    :param message: message to send
    """
    zulip = Zulip()
    if not zulip.has_valid_credentials():
        logger.info(message)
        return

    data = {
        "type": "stream",
        "to": "hub-updates",
        "topic": topic,
        "content": message,
    }
    try:
        post_request(ZULIP_URL, auth=zulip.get_auth(), data=data)
    except HTTPError:
        pass
