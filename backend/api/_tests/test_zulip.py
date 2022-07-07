import unittest
from unittest.mock import patch

from requests import HTTPError
from backend.api.zulip import get_release_notes_from
from utils.test_utils import FakeResponse, github_api_response, github_api_response_no_body


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

    def test_notify_new_packages(self):
        
