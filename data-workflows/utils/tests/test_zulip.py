import json
from unittest.mock import Mock, call

import pytest
from requests import HTTPError
from requests.auth import HTTPBasicAuth

import nhcommons.utils.request_adapter
from nhcommons.tests.utils.test_pypi_adapter import MockResponse
from utils import zulip

PLUGIN = "foo"
REPO = "https://github.com/chanzuckerberg/foo-demo-1"
RELEASE_NOTES = "This is the release notes"
SEPARATOR = "\n-------------------------------\n"
VERSION = "1.2"
ZULIP_URL = "https://napari.zulipchat.com/api/v1/messages"
DEFAULT_LINK = f"[{VERSION}](https://napari-hub.org/plugins/{PLUGIN})"


class TestZulip:
    @pytest.fixture
    def expected_get_request_args_list(self):
        url = (
            REPO.replace("https://github.com/", "https://api.github.com/repos/")
            + "/releases/tags/{0}1.2"
        )
        return [call(url.format(prefix)) for prefix in {"", "v"}]

    @pytest.mark.parametrize(
        "code_repo, mock_responses, expected",
        [
            (None, [], ("", DEFAULT_LINK)),
            (
                REPO,
                [MockResponse(200, json.dumps({"body": RELEASE_NOTES}))],
                (RELEASE_NOTES, f"[{VERSION}]({REPO}/releases/tag/{VERSION})"),
            ),
            (
                REPO,
                [HTTPError(), MockResponse(200, json.dumps({"body": RELEASE_NOTES}))],
                (RELEASE_NOTES, f"[v{VERSION}]({REPO}/releases/tag/v{VERSION})"),
            ),
            (
                REPO,
                [
                    MockResponse(200, json.dumps({"bar": RELEASE_NOTES})),
                    MockResponse(200, f"body: {RELEASE_NOTES}"),
                ],
                ("", DEFAULT_LINK),
            ),
        ],
    )
    def test_get_release_notes_and_link_to_release(
        self,
        monkeypatch,
        expected_get_request_args_list,
        code_repo,
        mock_responses,
        expected,
    ):
        mock_get_request = Mock(
            spec=nhcommons.utils.request_adapter.get_request,
            side_effect=mock_responses,
        )
        monkeypatch.setattr(zulip, "get_request", mock_get_request)

        actual = zulip.get_release_notes_and_link_to_release(PLUGIN, VERSION, code_repo)

        assert expected == actual
        expected_arg_list = expected_get_request_args_list[0 : len(mock_responses)]
        assert mock_get_request.call_args_list == expected_arg_list

    @pytest.mark.parametrize(
        "credentials, username, key",
        [(None, None, None), ("user-pass", None, None), ("user:key", "user", "key")],
    )
    def test_send_zulip_message(self, monkeypatch, credentials, username, key):
        if credentials:
            monkeypatch.setenv("ZULIP_CREDENTIALS", credentials)
        mock_post_request = Mock(spec=nhcommons.utils.request_adapter.post_request)
        monkeypatch.setattr(zulip, "post_request", mock_post_request)

        message = "message-content in markdown"
        zulip.send_zulip_message(PLUGIN, message)

        if username:
            data = {
                "type": "stream",
                "to": "hub-updates",
                "topic": PLUGIN,
                "content": message,
            }
            mock_post_request.assert_called_once_with(
                ZULIP_URL, auth=HTTPBasicAuth(username, key), data=data
            )
        else:
            mock_post_request.assert_not_called()

    def test_plugin_no_longer_on_hub(self, monkeypatch):
        mock_send_zulip_message = Mock(spec=zulip.send_zulip_message)
        monkeypatch.setattr(zulip, "send_zulip_message", mock_send_zulip_message)

        zulip.plugin_no_longer_on_hub(PLUGIN)

        message = (
            "This plugin is no longer available on the [napari hub]"
            "(https://napari-hub.org) :("
        )
        mock_send_zulip_message.assert_called_once_with(PLUGIN, message)

    @pytest.mark.parametrize(
        "release_notes, link, suffix",
        [
            (None, DEFAULT_LINK, f" with version {DEFAULT_LINK}!"),
            (
                "release-notes-funsies",
                DEFAULT_LINK,
                f"!\nAlso check out its release notes for version {DEFAULT_LINK}:"
                f"{SEPARATOR}release-notes-funsies",
            ),
        ],
    )
    def test_new_plugin_on_hub(self, monkeypatch, release_notes, link, suffix):
        mock_get_release_notes_and_link_to_release = Mock(
            spec=zulip.get_release_notes_and_link_to_release,
            return_value=(release_notes, link),
        )
        mock_send_zulip_message = Mock(spec=zulip.send_zulip_message)
        monkeypatch.setattr(zulip, "send_zulip_message", mock_send_zulip_message)
        monkeypatch.setattr(
            zulip,
            "get_release_notes_and_link_to_release",
            mock_get_release_notes_and_link_to_release,
        )

        zulip.new_plugin_on_hub(PLUGIN, VERSION, REPO)

        mock_get_release_notes_and_link_to_release.assert_called_once_with(
            PLUGIN, VERSION, REPO
        )
        message = (
            f"A new plugin has been published on the napari hub! "
            f"Check out [{PLUGIN}](https://napari-hub.org/plugins/{PLUGIN}){suffix}"
        )
        mock_send_zulip_message.assert_called_once_with(PLUGIN, message)

    @pytest.mark.parametrize(
        "release_notes, link, suffix",
        [
            (None, DEFAULT_LINK, f"Check out {DEFAULT_LINK}!"),
            (
                "release-notes-funsies",
                DEFAULT_LINK,
                f"Check out the release notes for {DEFAULT_LINK}:"
                f"{SEPARATOR}release-notes-funsies",
            ),
        ],
    )
    def test_plugin_updated_on_hub(self, monkeypatch, release_notes, link, suffix):
        mock_get_release_notes_and_link_to_release = Mock(
            spec=zulip.get_release_notes_and_link_to_release,
            return_value=(release_notes, link),
        )
        mock_send_zulip_message = Mock(spec=zulip.send_zulip_message)
        monkeypatch.setattr(zulip, "send_zulip_message", mock_send_zulip_message)
        monkeypatch.setattr(
            zulip,
            "get_release_notes_and_link_to_release",
            mock_get_release_notes_and_link_to_release,
        )

        zulip.plugin_updated_on_hub(PLUGIN, VERSION, REPO)

        mock_get_release_notes_and_link_to_release.assert_called_once_with(
            PLUGIN, VERSION, REPO
        )
        message = (
            f"A new version of [{PLUGIN}](https://napari-hub.org/plugins/{PLUGIN}) is "
            f"available on the napari hub! {suffix}"
        )
        mock_send_zulip_message.assert_called_once_with(PLUGIN, message)
