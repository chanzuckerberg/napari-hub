import unittest
from unittest.mock import patch

from requests import HTTPError
from backend.utils.pypi import format_plugin

from utils.pypi import query_pypi, get_plugin_pypi_metadata
from utils.test_utils import (
    FakeResponse, plugin, plugin_list,
    split_comma_correct_result, split_comma_plugin, 
    split_and_correct_result, split_and_plugin, split_ampersand_correct_result, 
    split_ampersand_plugin, empty_split_plugin, empty_split_correct_result
    ) 

class TestPypi(unittest.TestCase):

    @patch(
        'requests.get', return_value=FakeResponse(data=plugin_list)
    )
    def test_query_pypi(self, mock_get):
        result = query_pypi()
        assert len(result) == 2
        assert result['package1'] == "0.2.7"
        assert result['package2'] == "0.1.0"

    @patch(
        'requests.get', return_value=FakeResponse(data=plugin)
    )
    def test_get_plugin_pypi_metadata(self, mock_request_get):
        result = get_plugin_pypi_metadata("test", "0.0.1")
        assert (result["name"] == "test")
        assert (result["summary"] == "A test plugin")
        assert (result["description"] == "# description [example](http://example.com)")
        assert (result["description_content_type"] == "")
        assert (result["authors"] == [{'name': 'Test Author'}])
        assert (result["license"] == "BSD-3")
        assert (result["python_version"] == ">=3.6")
        assert (result["operating_system"] == ['Operating System :: OS Independent'])
        assert (result["release_date"] == '2020-04-13T03:37:20.169990Z')
        assert (result["version"] == "0.0.1")
        assert (result["first_released"] == "2020-04-13T03:37:20.169990Z")
        assert (result["development_status"] == ['Development Status :: 4 - Beta'])
        assert (result["requirements"] is None)
        assert (result["project_site"] == "https://github.com/test/test")
        assert (result["documentation"] == "")
        assert (result["support"] == "")
        assert (result["report_issues"] == "")
        assert (result["twitter"] == "")

    @patch(
        'requests.get', side_effect=HTTPError()
    )
    def test_get_plugin_error(self, mock_get):
        assert ({} == get_plugin_pypi_metadata("test", "0.0.1"))

    @patch(
        'requests.get', return_value=FakeResponse(data=split_comma_plugin)
    )
    def test_format_plugin_filter_comma(self, mock_request_get):
        """
        Expect input of response from pypi with authors split by commas
        Checks that format_plugin correctly splits the input's author field into a list of 'name'-'{author name}' mappings
        """
        result = get_plugin_pypi_metadata("test", "0.0.1")
        assert result["authors"] == split_comma_correct_result

    @patch(
        'requests.get', return_value=FakeResponse(data=split_and_plugin)
    )
    def test_format_plugin_filter_and(self, mock_request_get):
        """
        Expect input of response from pypi with authors split by ' and ' along with names containing 'and'
        Checks that format_plugin correctly splits the input's author field into a list of 'name'-'{author name}' mappings
        """
        result = get_plugin_pypi_metadata("test", "0.0.1")
        assert result["authors"] == split_and_correct_result

    @patch(
        'requests.get', return_value=FakeResponse(data=split_ampersand_plugin)
    )
    def test_format_plugin_filter_ampersanda(self, mock_request_get):
        """
        Expect input of response from pypi with authors split by &
        Checks that format_plugin correctly splits the input's author field into a list of 'name'-'{author name}' mappings
        """
        result = get_plugin_pypi_metadata("test", "0.0.1")
        assert result["authors"] == split_ampersand_correct_result

    @patch(
        'requests.get', return_value=FakeResponse(data=empty_split_plugin)
    )
    def test_format_plugin_empty_filter(self, mock_request_get):
        """
        Expect input of response from pypi with authors field designed to create empty strings when split
        Checks that format_plugin doesn't include empty strings when splitting
        """
        result = get_plugin_pypi_metadata("test", "0.0.1")
        assert result["authors"] == empty_split_correct_result
