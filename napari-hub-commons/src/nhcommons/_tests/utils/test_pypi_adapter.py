import json
from typing import List, Tuple

import requests

from nhcommons._tests.utils.data_fixture import PYPI_PACKAGE_DATA
from nhcommons.utils import pypi_adapter

PLUGINS = [
    ('foo', '0.23'), ('ap-12', '2.0.34'), ('ba-r', 'aa-1230'), ('Zo-o', '12343')
]


class MockResponse:
    def __init__(self, status_code, text=None):
        self.status_code = status_code
        self.text = text

    def json(self):
        return json.loads(self.text)

    def text(self):
        return self.text

    def raise_for_status(self):
        raise requests.HTTPError()


class TestPypiAdapter:

    def setup_method(self):
        self._version_valid = True

    def _generate_text_data(self, plugins: List[Tuple[str, str]]):
        version_id = 'package-snippet__version' + '' if self._version_valid else 'foo'
        data = [
            f"""
        <div>
            <span class="package-snippet__name">{plugin[0]}</span>
            <span class="{version_id}">{plugin[1]}</span>
        </div>
        """
            for plugin in plugins
        ]
        return "<br>".join(data)

    def _mocked_requests_get(self, *args, **kwargs):
        if args[0] == 'https://pypi.org/search/':
            params = kwargs.get('params')
            if params and len(params) == 3 and params.get('o') == '-created' \
                    and params.get('c') == 'Framework :: napari' \
                    and params.get('page', 1000) < 3:
                data = PLUGINS[:2] if params.get('page') == 1 else PLUGINS[2:]
                return MockResponse(
                    requests.codes.ok, self._generate_text_data(data)
                )
        elif args[0] == 'https://pypi.org/search/o=-created&' \
                        'c=Framework%20::%20napari&page=1':
            return MockResponse(
                requests.codes.ok, self._generate_text_data(PLUGINS[2:])
            )
        elif args[0] == 'https://pypi.org/pypi/napari-demo/json':
            return MockResponse(requests.codes.ok, json.dumps(PYPI_PACKAGE_DATA))

        return MockResponse(status_code=requests.codes.not_found)

    def test_get_all_plugins_returns_valid_response(self, monkeypatch):
        monkeypatch.setattr(requests, 'get', self._mocked_requests_get)

        actual = pypi_adapter.get_all_plugins()

        expected = {plugin[0]: plugin[1] for plugin in PLUGINS}
        assert actual == expected

    def test_get_all_plugins_handles_name_version_mismatch(self, monkeypatch):
        self._version_valid = False
        monkeypatch.setattr(requests, 'get', self._mocked_requests_get)

        actual = pypi_adapter.get_all_plugins()

        assert actual == {}

    def test_get_plugin_metadata_invalid_plugin(self, monkeypatch):
        monkeypatch.setattr(requests, 'get', self._mocked_requests_get)
        assert {} == pypi_adapter.get_plugin_pypi_metadata("foo", "0.1")

    def test_get_plugin_metadata_invalid_version(self, monkeypatch):
        monkeypatch.setattr(requests, 'get', self._mocked_requests_get)
        assert {} == pypi_adapter.get_plugin_pypi_metadata("napari-demo", "0.1")

    def test_get_plugin_metadata_success(self, monkeypatch):
        monkeypatch.setattr(requests, 'get', self._mocked_requests_get)
        version = "0.2.3"
        expected = {
            'name': 'napari-demo',
            'summary': 'example plugin for napari plugin developers',
            'description': 'this is description',
            'description_content_type': 'text/markdown',
            'authors': [{'name': 'napari hub team'}], 'license': 'BSD-3',
            'python_version': '>=3.7',
            'operating_system': ['Operating System :: OS Independent'],
            'release_date': '2022-09-14T22:03:09.779012Z',
            'version': '0.2.3',
            'first_released': '2021-01-27T19:22:41.381119Z',
            'development_status': ['Development Status :: 4 - Beta'],
            'requirements': ['pydantic', 'npe2', 'numpy'],
            'project_site': 'https://github.com/chanzuckerberg/napari-demo',
            'documentation': '',
            'support': '',
            'report_issues': '',
            'twitter': '',
            'code_repository': 'https://github.com/chanzuckerberg/napari-demo'
        }
        assert expected == pypi_adapter.get_plugin_pypi_metadata("napari-demo",
                                                                 version)
