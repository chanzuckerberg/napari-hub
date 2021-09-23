import unittest
from unittest.mock import patch
from requests import HTTPError
from backend._tests.util import FakeResponse, plugin, plugin_list
from backend.pypi import query_pypi, get_plugin_pypi_metadata


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
        assert (result["authors"] == [{'email': 'test@test.com', 'name': 'Test Author'}])
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
