import json
import unittest
from unittest.mock import patch

from requests import HTTPError
from api.zulip import create_github_endpoint, get_owner_and_name, get_release_notes, generate_release_notes_and_link_to_release, create_message, send_zulip_message
from utils.test_utils import (
    FakeResponse, github_api_response, github_api_response_no_body,
    metadata_if_code_repository_exists, list_of_demo_plugins, response_with_release_notes, response_without_release_notes,
    existing_release_notes_with_no_v, existing_link_to_release_no_v, existing_message_with_release_no_v, existing_demo_plugins,
    response_with_release_notes_with_v, existing_release_notes_with_v, existing_link_to_release_with_v, existing_message_with_release_with_v,
    empty_release_notes, test_link_to_napari, message_no_release_notes,
    metadata_if_code_repository_is_null,
    metadata_if_code_repository_does_not_exist,
    currently_used_plugins,
    list_of_demo_plugins_no_version_change, existing_demo_plugins_version_unchanged, currently_used_plugins_no_version_change
    )

def mocked_requests_get_release_notes_with_release_no_v_update(*args, **kwargs):
    """
    Helps create mock responses getting release notes
    Else returns response with no data 
    """
    if args[0] == 'https://api.github.com/repos/author/napari-demo/releases/tags/0.0.1':
        return FakeResponse(data=response_with_release_notes)
    elif args[0] == 'https://api.github.com/repos/author2/new-napari-plugin/releases/tags/0.0.2':
        return FakeResponse(data=response_with_release_notes)
    return FakeResponse(data=response_without_release_notes)

def mocked_requests_get_release_notes_with_release_v_update(*args, **kwargs):
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

    def test_get_owner_and_name_works(self):
        owner_and_name = get_owner_and_name('https://github.com/author/plugin')
        assert owner_and_name == 'author/plugin'

    def test_create_github_endpoint(self):
        endpoint = create_github_endpoint('author/plugin', '0.0.1', with_v = False)
        assert endpoint == 'https://api.github.com/repos/author/plugin/releases/tags/0.0.1'
        endpoint = create_github_endpoint('author/plugin', '0.0.1', with_v = True)
        assert endpoint == 'https://api.github.com/repos/author/plugin/releases/tags/v0.0.1'

    # these tests test the get_release_notes(endpoint) method
    @patch(
        'requests.get', return_value=FakeResponse(data=github_api_response)
    )
    def test_get_release_notes_works(self, mock_get):
        """
        Checks that get_release_notes can get release notes from github api response
        """
        result = get_release_notes("mock_endpoint")
        assert result == "Description of the release"

    @patch(
        'requests.get', return_value=FakeResponse(data=github_api_response_no_body)
    )
    def test_get_release_notes_handles_lack_of_body(self, mock_get):
        """
        Checks that get_release_notes can return an empty string if github api response does not include a description
        """
        result = get_release_notes("mock_endpoint")
        assert result == ''

    @patch(
        'requests.get', side_effect=HTTPError()
    )
    def test_get_release_notes_handles_errors(self, mock_get):
        """
        Checks that get_release_notes can return an empty string if the request errors
        """
        result = get_release_notes("mock_endpoint")
        assert result == ''

    # these tests test the logic that goes into creating messages for the zulip bot to send
    @patch('requests.get', side_effect=mocked_requests_get_release_notes_with_release_no_v_update)
    def test_create_correct_message_with_release_no_v_update(self, mock_get):
        """
        Test situation where package has release notes, and it's version doesn't have v for both new and existing packages
        It will test the generate_release_notes_and_link_to_release method and then the create_message method separately from each other
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            # first tests release notes generation works as expected separately from message generation
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert existing_release_notes_with_no_v == release_notes
            assert existing_link_to_release_no_v[package] == link_to_release
            # then tests that message generation works as expected 
            message = create_message(package, version, existing_demo_plugins, packages_metadata)
            assert existing_message_with_release_no_v[package] == message
            plugins_used_in_test.add(package)
        # check that we used all the plugins we wanted to 
        assert plugins_used_in_test == currently_used_plugins

    @patch('requests.get', side_effect=mocked_requests_get_release_notes_with_release_v_update)
    def test_create_correct_message_with_release_v_update(self, mock_get):
        """
        Test situation where package has release notes, and its version has a v for both new and existing packages
        It will test the generate_release_notes_and_link_to_release method and then the create_message method separately from each other
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            # first tests release notes generation works as expected separately from message generation
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert existing_release_notes_with_v == release_notes
            assert existing_link_to_release_with_v[package] == link_to_release
            # then tests that message generation works as expected 
            message = create_message(package, version, existing_demo_plugins, packages_metadata)
            assert existing_message_with_release_with_v[package] == message
            plugins_used_in_test.add(package)
        # check that we used all the plugins we wanted to 
        assert plugins_used_in_test == currently_used_plugins

    @patch('requests.get', return_value = FakeResponse(data=response_without_release_notes))
    def test_create_correct_message_with_no_release_update(self, mock_get):
        """
        Test situation where package doesn't have release notes for both new and existing packages
        It will test the generate_release_notes_and_link_to_release method and then the create_message method separately from each other
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            # first tests release notes generation works as expected separately from message generation
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert empty_release_notes == release_notes
            assert test_link_to_napari[package] == link_to_release
            # then tests that message generation works as expected 
            message = create_message(package, version, existing_demo_plugins, packages_metadata)
            assert message_no_release_notes[package] == message
            plugins_used_in_test.add(package)
        # check that we used all the plugins we wanted to 
        assert plugins_used_in_test == currently_used_plugins

    @patch('requests.get', return_value = FakeResponse(data=response_with_release_notes))
    def test_create_correct_message_with_null_code_repo(self, mock_get):
        """
        Test situation where package has a null "code_repository" field for both new and existing packages
        It will test the generate_release_notes_and_link_to_release method and then the create_message method separately from each other
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_is_null)
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            # first tests release notes generation works as expected separately from message generation
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert empty_release_notes == release_notes
            assert test_link_to_napari[package] == link_to_release
            # then tests that message generation works as expected 
            message = create_message(package, version, existing_demo_plugins, packages_metadata)
            assert message_no_release_notes[package] == message
            plugins_used_in_test.add(package)
        # check that we used all the plugins we wanted to 
        assert plugins_used_in_test == currently_used_plugins

    @patch('requests.get', return_value = FakeResponse(data=response_with_release_notes))
    def test_create_correct_message_with_no_code_repo(self, mock_get):
        """
        Test situation where package doesn't contain a "code_repository" field for both new and existing packages
        It will test the generate_release_notes_and_link_to_release method and then the create_message method separately from each other
        and check that the strings match what is expected 
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins)
        packages_metadata = json.loads(metadata_if_code_repository_does_not_exist)
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            # first tests release notes generation works as expected separately from message generation
            release_notes, link_to_release = generate_release_notes_and_link_to_release(package, version, packages_metadata)
            assert empty_release_notes == release_notes
            assert test_link_to_napari[package] == link_to_release
            # then tests that message generation works as expected 
            message = create_message(package, version, existing_demo_plugins, packages_metadata)
            assert message_no_release_notes[package] == message
            plugins_used_in_test.add(package)
        # check that we used all the plugins we wanted to 
        assert plugins_used_in_test == currently_used_plugins

    def test_ignores_message_generation_when_no_version_change(self):
        """
        Test situation where version has not changed
        It will check that blank messages are created when the version of plugins has not changed
        It also checks to make sure the right amount of plugins were tested
        """
        new_packages = json.loads(list_of_demo_plugins_no_version_change)
        packages_metadata = json.loads(metadata_if_code_repository_exists)
        plugins_used_in_test = set()
        for package, version in new_packages.items():
            # check that a blank message is generated each time
            message = create_message(package, version, existing_demo_plugins_version_unchanged, packages_metadata)
            assert message == ''
            plugins_used_in_test.add(package)
        # check that we used all the plugins we wanted to 
        assert plugins_used_in_test == currently_used_plugins_no_version_change
