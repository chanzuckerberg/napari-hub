import json
import unittest
from unittest.mock import patch

from requests import HTTPError
from backend.api.zulip import get_release_notes_from, generate_release_notes_and_link_to_release, create_message
from utils.test_utils import (
    FakeResponse, github_api_response, github_api_response_no_body,
    list_of_plugins, plugins_metadata, existing_packages, plugins_and_expected_results,
    endpoint_to_release_notes
    )

def mocked_requests_get_release_notes_from(*args, **kwargs):
    """
    Helps create mock responses getting release notes
    Else returns response with no data 
    """
    if args[0] in endpoint_to_release_notes:
        return FakeResponse(data=endpoint_to_release_notes[args[0]])
    return FakeResponse(data=github_api_response_no_body)

class TestZulip(unittest.TestCase):

    @patch(
        'requests.get', return_value=FakeResponse(data=github_api_response)
    )
    def test_get_release_notes_from_works(self, mock_get):
        """
        Checks that get_release_notes_from can get release notes from github api response
        """
        result = get_release_notes_from("mock_endpoint")
        assert result == "Description of the release"

    @patch(
        'requests.get', return_value=FakeResponse(data=github_api_response_no_body)
    )
    def test_get_release_notes_from_handles_lack_of_body(self, mock_get):
        """
        Checks that get_release_notes_from can return an empty string if github api response does not include a description
        """
        result = get_release_notes_from("mock_endpoint")
        assert result == ''

    @patch(
        'requests.get', side_effect=HTTPError()
    )
    def test_get_release_notes_from_handles_errors(self, mock_get):
        """
        Checks that get_release_notes_from can return an empty string if the request errors
        """
        result = get_release_notes_from("mock_endpoint")
        assert result == ''

    @patch('requests.get', side_effect=mocked_requests_get_release_notes_from)
    def test_create_correct_message(self, mock_get):
        new_packages = json.loads(list_of_plugins)
        packages_metadata = json.loads(plugins_metadata)
        for package, version in new_packages.items():
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert plugins_and_expected_results[package]["release_notes"] == release_notes
            assert plugins_and_expected_results[package]["link_to_release"] == link_to_release
            message = create_message(package, version, existing_packages, release_notes, link_to_release)
            assert plugins_and_expected_results[package]["message"] == message
