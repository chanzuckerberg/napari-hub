import json
from typing import Any, Dict, List, Optional, Tuple

import pytest
import requests
from nhcommons.utils import pypi_adapter

ReleasesType = List[Dict[str, str]]


class MockResponse(requests.Response):
    def __init__(self, status_code: int = 200, content: str = ""):
        super().__init__()
        self.status_code = status_code
        self._content = content.encode("UTF-8")


def plugins() -> List[Tuple[str, str]]:
    return [
        ("foo", "0.23"), ("a-12", "2.0.7"), ("ba-r", "aa-120"), ("Zo-o", "1234")
    ]


def valid_pypi_data() -> str:
    return json.dumps({
        "info": {
            "author": "foo & bar|baz, napari hub team and test and   &",
            "author_email": "team@napari-hub.org",
            "classifiers": [
                "Development Status :: 4 - Beta",
                "Operating System :: OS Independent",
                "Operating System :: Linux",
            ],
            "description": "this is description",
            "description_content_type": "text/markdown",
            "home_page": "https://www.napari-demo.com",
            "license": "BSD-3",
            "name": "napari-demo",
            "package_url": "https://pypi.org/project/napari-demo/",
            "platform": None,
            "project_url": "https://pypi.org/project/napari-demo/",
            "project_urls": {
                "Documentation": "https://docs.napari-demo-documentation.com",
                "User Support": "https://user.napari-demo.com/foo-bar",
                "Bug Tracker": "https://zulip.napari-demo.com/bugs",
                "Twitter": "https://www.twitter.com/napari-demo",
                "Source Code": "https://github.com/chanzuckerberg/napari-demo",
            },
            "release_url": "https://pypi.org/project/napari-demo/0.2.3/",
            "requires_dist": ["pydantic", "npe2", "numpy"],
            "requires_python": ">=3.7",
            "summary": "example plugin for napari plugin developers",
            "version": "0.2.3",
        },
        "releases": {
            "0.0.1": [{"upload_time_iso_8601": "2021-01-27T19:22:41.381119Z"}],
            "0.1.0": [],
            "0.2.0": [{}],
            "0.2.1": [{"upload_time_iso_8601": None}],
            "0.2.2": [{"upload_time_iso_8601": ""}],
            "0.2.3": [{"upload_time_iso_8601": "2022-09-14T22:03:09.779012Z"}],
        },
    })


def plugin_metadata_valid() -> Dict[str, Any]:
    return {
        "name": "napari-demo",
        "summary": "example plugin for napari plugin developers",
        "description": "this is description",
        "description_content_type": "text/markdown",
        "authors": [
            {'name': 'foo'},
            {'name': 'bar|baz'},
            {'name': 'napari hub team'},
            {'name': 'test'},
        ],
        "license": "BSD-3",
        "python_version": ">=3.7",
        "operating_system": [
            "Operating System :: OS Independent",
            "Operating System :: Linux",
        ],
        "release_date": "2022-09-14T22:03:09.779012Z",
        "version": "0.2.3",
        "first_released": "2021-01-27T19:22:41.381119Z",
        "development_status": ["Development Status :: 4 - Beta"],
        "requirements": ["pydantic", "npe2", "numpy"],
        "project_site": "https://www.napari-demo.com",
        "documentation": "https://docs.napari-demo-documentation.com",
        "support": "https://user.napari-demo.com/foo-bar",
        "report_issues": "https://zulip.napari-demo.com/bugs",
        "twitter": "https://www.twitter.com/napari-demo",
        "code_repository": "https://github.com/chanzuckerberg/napari-demo"
    }


def default_pypi_data(release: Optional[ReleasesType] = None):
    return json.dumps({
        "info": {
            "project_urls": {},
            "version": "1.9.8",
        },
        "releases": {
            "1.0.0": [{"upload_time_iso_8601":  "2022-09-14T22:03:09.779012Z"}],
            "1.9.8": release
        },
    })


def plugin_metadata_default(release_date: str = ""):
    return {
        "name": "",
        "summary": "",
        "description": "",
        "description_content_type": "",
        "authors": [],
        "license": "",
        "python_version": "",
        "operating_system": [],
        "release_date": release_date,
        "version": "1.9.8",
        "first_released": "2022-09-14T22:03:09.779012Z",
        "development_status": [],
        "requirements": [],
        "project_site": "",
        "documentation": "",
        "support": "",
        "report_issues": "",
        "twitter": "",
        "code_repository": None,
    }


class TestPypiAdapter:

    @pytest.fixture(autouse=True)
    def setup_method(self, monkeypatch):
        monkeypatch.setattr(requests, "get", self._mocked_requests_get)

    def _generate_html_data(self, plugin_version_list: List[Tuple[str, str]]):
        data = [
            f"""
                <div>
                    <span class="package-snippet__name">{plugin[0]}</span>
                    <span class="{self._version_field}">{plugin[1]}</span>
                </div>
            """ for plugin in plugin_version_list
        ]
        return "<br>".join(data)

    def _mocked_requests_get(self, *args, **kwargs):
        if args[0] == "https://pypi.org/search/":
            params = kwargs.get("params", {})
            page = params.get("page", 1000)
            if params and len(params) == 3 and params.get("o") == "-created" \
                    and params.get("c") == "Framework :: napari" and page < 3:
                data = plugins()[:2] if page == 1 else plugins()[2:]
                return MockResponse(content=self._generate_html_data(data))
        elif args[0] == "https://pypi.org/pypi/napari-demo/json":
            return MockResponse(content=valid_pypi_data())
        elif args[0] == "https://pypi.org/pypi/default-demo/json":
            return MockResponse(content=default_pypi_data(self._release))
        return MockResponse(status_code=requests.codes.not_found)

    @pytest.mark.parametrize("is_valid, expected", [
            (True, {plugin[0]: plugin[1] for plugin in plugins()}),
            (False, {})
    ])
    def test_get_all_plugins(self, is_valid: bool, expected: Dict[str, str]):
        self._version_field = "package-snippet__version" if is_valid else "foo"
        assert expected == pypi_adapter.get_all_plugins()

    @pytest.mark.parametrize("plugin, version, expected", [
            ("foo", "0.1", {}),
            ("napari-demo", "0.1", {}),
            ("napari-demo", "0.2.3", plugin_metadata_valid()),
            ("default-demo", "1.9.8", plugin_metadata_default()),
    ])
    def test_get_plugin_metadata(self,
                                 plugin: str,
                                 version: str,
                                 expected: Dict[str, Any]):
        self._release = []
        actual = pypi_adapter.get_plugin_pypi_metadata(plugin, version)
        assert expected == actual

    @pytest.mark.parametrize("release, release_date", [
            ([{"upload_time_iso_8601": "foo"}], "foo"),
            ([{"upload_time_iso_8601": ""}], ""),
            ([{"upload_time_iso_8601": None}], ""),
            ([{"upload_time_iso_8600": "foo"}], ""),
            ([{}], ""),
            ([], ""),
    ])
    def test_get_plugin_metadata_release_date(self,
                                              release: ReleasesType,
                                              release_date: str):
        self._release = release
        actual = pypi_adapter.get_plugin_pypi_metadata("default-demo", "1.9.8")
        assert plugin_metadata_default(release_date) == actual