import json
import unittest
from unittest.mock import patch

from requests import HTTPError
from backend.api.zulip import get_release_notes_from, generate_release_notes_and_link_to_release, create_message
from utils.test_utils import (
    FakeResponse, github_api_response, github_api_response_no_body,
    metadata_if_code_repository_exists, list_of_demo_plugins, response_with_release_notes, response_without_release_notes,
    existing_release_notes_with_no_v, existing_link_to_release_no_v, existing_message_with_release_no_v, existing_demo_plugins,
    response_with_release_notes_with_v, existing_release_notes_with_v, existing_link_to_release_with_v, existing_message_with_release_with_v,
    empty_release_notes, test_link_to_napari, message_no_release_notes,
    metadata_if_code_repository_is_null,
    metadata_if_code_repository_does_not_exist,
    number_of_plugins, currently_used_plugins
    )

def mocked_requests_get_release_notes_from_with_release_no_v_update(*args, **kwargs):
    """
    Helps create mock responses getting release notes
    Else returns response with no data 
    """
    if args[0] == 'https://api.github.com/repos/author/napari-demo/releases/tags/0.0.1':
        return FakeResponse(data=response_with_release_notes)
    elif args[0] == 'https://api.github.com/repos/author2/new-napari-plugin/releases/tags/0.0.2':
        return FakeResponse(data=response_with_release_notes)
    return FakeResponse(data=response_without_release_notes)

def mocked_requests_get_release_notes_from_with_release_v_update(*args, **kwargs):
    """
    Helps create mock responses getting release notes
    Else returns response with no data 
    """
    if args[0] == 'https://api.github.com/repos/author/napari-demo/releases/tags/v0.0.1':
        return FakeResponse(data=response_with_release_notes_with_v)
    elif args[0] == 'https://api.github.com/repos/author2/new-napari-plugin/releases/tags/v0.0.2':
        return FakeResponse(data=response_with_release_notes_with_v)
    return FakeResponse(data=response_without_release_notes)

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

    @patch('requests.get', side_effect=mocked_requests_get_release_notes_from_with_release_no_v_update)
    def test_create_correct_message_with_release_no_v_update(self, mock_get):
        """
        Test situation where package has release notes, and it's version doesn't have v
        It will run through the release_notes, link_to_release, and message generation portions of the zulip bot code, 
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        number_of_plugins_looped_through = 0
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert existing_release_notes_with_no_v == release_notes
            assert existing_link_to_release_no_v[package] == link_to_release
            message = create_message(package, version, existing_demo_plugins, release_notes, link_to_release)
            assert existing_message_with_release_no_v[package] == message
            number_of_plugins_looped_through += 1
            plugins_used_in_test.add(package)
        assert plugins_used_in_test == currently_used_plugins
        assert number_of_plugins == number_of_plugins_looped_through

    @patch('requests.get', side_effect=mocked_requests_get_release_notes_from_with_release_v_update)
    def test_create_correct_message_with_release_v_update(self, mock_get):
        """
        Test situation where package has release notes, and its version has a v
        It will run through the release_notes, link_to_release, and message generation portions of the zulip bot code, 
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        number_of_plugins_looped_through = 0
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert existing_release_notes_with_v == release_notes
            assert existing_link_to_release_with_v[package] == link_to_release
            message = create_message(package, version, existing_demo_plugins, release_notes, link_to_release)
            assert existing_message_with_release_with_v[package] == message
            number_of_plugins_looped_through += 1
            plugins_used_in_test.add(package)
        assert plugins_used_in_test == currently_used_plugins
        assert number_of_plugins == number_of_plugins_looped_through

    @patch('requests.get', return_value = FakeResponse(data=response_without_release_notes))
    def test_create_correct_message_with_no_release_update(self, mock_get):
        """
        Test situation where package doesn't have release notes
        It will run through the release_notes, link_to_release, and message generation portions of the zulip bot code, 
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        number_of_plugins_looped_through = 0
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert empty_release_notes == release_notes
            assert test_link_to_napari[package] == link_to_release
            message = create_message(package, version, existing_demo_plugins, release_notes, link_to_release)
            assert message_no_release_notes[package] == message
            number_of_plugins_looped_through += 1
            plugins_used_in_test.add(package)
        assert plugins_used_in_test == currently_used_plugins
        assert number_of_plugins == number_of_plugins_looped_through

    @patch('requests.get', return_value = FakeResponse(data=response_with_release_notes))
    def test_create_correct_message_with_null_code_repo(self, mock_get):
        """
        Test situation where package has a null "code_repository" field
        It will run through the release_notes, link_to_release, and message generation portions of the zulip bot code, 
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_is_null)
        number_of_plugins_looped_through = 0
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert empty_release_notes == release_notes
            assert test_link_to_napari[package] == link_to_release
            message = create_message(package, version, existing_demo_plugins, release_notes, link_to_release)
            assert message_no_release_notes[package] == message
            number_of_plugins_looped_through += 1
            plugins_used_in_test.add(package)
        assert plugins_used_in_test == currently_used_plugins
        assert number_of_plugins == number_of_plugins_looped_through

    @patch('requests.get', return_value = FakeResponse(data=response_with_release_notes))
    def test_create_correct_message_with_no_code_repo(self, mock_get):
        """
        Test situation where package doesn't contain a "code_repository" field
        It will run through the release_notes, link_to_release, and message generation portions of the zulip bot code, 
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_does_not_exist)
        number_of_plugins_looped_through = 0
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert empty_release_notes == release_notes
            assert test_link_to_napari[package] == link_to_release
            message = create_message(package, version, existing_demo_plugins, release_notes, link_to_release)
            assert message_no_release_notes[package] == message
            number_of_plugins_looped_through += 1
            plugins_used_in_test.add(package)
        assert plugins_used_in_test == currently_used_plugins
        assert number_of_plugins == number_of_plugins_looped_through
