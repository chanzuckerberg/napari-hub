from unittest import mock
import requests
from requests.exceptions import HTTPError

from backend.napari import get_plugin, get_shield
from backend.napari import get_plugins
from backend.napari import get_download_url
from backend.napari import get_license
from backend.napari import get_citations

AFFINDER_SVG = ('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' 
                  ' width="139" height="20" role="img" aria-label="napari hub: affinder">'
                  '<title>napari hub: affinder</title><g shape-rendering="crispEdges"><rect width="86" height="20" fill="#555"/>'
                  '<rect x="86" width="53" height="20" fill="#0074b8"/></g><g fill="#fff" text-anchor="middle" '
                  'font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">'
                  '<image x="5" y="3" width="14" height="14" xlink:href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZ'
                  'WlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI'
                  '+PGNpcmNsZSBjeD0iMjU2LjAzNiIgY3k9IjI1NiIgcj0iODUuMzMzMyIgZmlsbD0id2hpdGUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13a'
                  'WR0aD0iNTYuODg4OSIvPjxjaXJjbGUgY3g9IjI1Ni4wMzYiIGN5PSI0Mi42NjY3IiByPSI0Mi42NjY3IiBmaWxsPSJ3aGl0ZSIvPjxjaXJ'
                  'jbGUgY3g9IjI1Ni4wMzYiIGN5PSI0NjkuMzMzIiByPSI0Mi42NjY3IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0yNTYuMDM2IDI4LjQ0N'
                  'DVMMjU2LjAzNiAxNDIuMjIyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjU2Ljg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCI'
                  'gc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0yNTYuMDM2IDM2OS43NzhMMjU2LjAzNiA0ODMuNTU2IiBzdHJva2U9Indoa'
                  'XRlIiBzdHJva2Utd2lkdGg9IjU2Ljg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxjaXJ'
                  'jbGUgY3g9IjcxLjI4MzgiIGN5PSIxNDkuMzMzIiByPSI0Mi42NjY3IiB0cmFuc2Zvcm09InJvdGF0ZSgtNjAgNzEuMjgzOCAxNDkuMzMzK'
                  'SIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSI0NDAuNzg4IiBjeT0iMzYyLjY2NyIgcj0iNDIuNjY2NyIgdHJhbnNmb3JtPSJyb3RhdGU'
                  'oLTYwIDQ0MC43ODggMzYyLjY2NykiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTU4Ljk2NyAxNDIuMjIyTDE1Ny41MDEgMTk5LjExMSIgc3'
                  'Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI1Ni44ODg5IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91b'
                  'mQiLz48cGF0aCBkPSJNMzU0LjU3IDMxMi44ODlMNDUzLjEwNSAzNjkuNzc4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjU2Ljg4'
                  'ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjcxLjI4MzgiIGN5PSIzNjI'
                  'uNjY3IiByPSI0Mi42NjY3IiB0cmFuc2Zvcm09InJvdGF0ZSgtMTIwIDcxLjI4MzggMzYyLjY2NykiIGZpbGw9IndoaXRlIi8+PGNpcmNsZSB'
                  'jeD0iNDQwLjc4OCIgY3k9IjE0OS4zMzMiIHI9IjQyLjY2NjciIHRyYW5zZm9ybT0icm90YXRlKC0xMjAgNDQwLjc4OCAxNDkuMzMzKSIgZmls'
                  'bD0id2hpdGUiLz48cGF0aCBkPSJNNTguOTY3IDM2OS43NzhMMTU3LjUwMSAzMTIuODg5IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9I'
                  'jU2Ljg4ODkiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zNTQuNTcgMTk5LjExMU'
                  'w0NTMuMTA1IDE0Mi4yMjIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iNTYuODg4OSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJv'
                  'a2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+"/><text x="525" y="140" transform="scale(.1)" fill="#fff" textLength="590">'
                  'napari hub</text><text x="1115" y="140" transform="scale(.1)" fill="#fff" textLength="430">affinder</text></g></svg>')
SHIELDS_URL = 'https://img.shields.io/endpoint?url='

class FakeResponse:
    def __init__(self, *, data: str):
        self.text = data
        self.status_code = requests.codes.ok

    @property
    def status_code(self):
        status_code = self._status_code
        self.status_code = requests.codes.ok + 100
        return status_code

    @status_code.setter
    def status_code(self, status_code):
        self._status_code = status_code

    def raise_for_status(self):
        raise HTTPError


plugin_list = """
<li>
  <a class="package-snippet" href="/project/brainreg-segment/">
    <h3 class="package-snippet__title">
      <span class="package-snippet__name">package1</span>
      <span class="package-snippet__version">0.2.7</span>
      <span class="package-snippet__released"><time datetime="2021-04-26T13:17:17+0000" data-controller="localized-time" data-localized-time-relative="true" data-localized-time-show-time="false">
  Apr 26, 2021
</time></span>
    </h3>
    <p class="package-snippet__description">test package 1</p>
  </a>
</li>

              <li>
  <a class="package-snippet" href="/project/napari-mri/">
    <h3 class="package-snippet__title">
      <span class="package-snippet__name">package2</span>
      <span class="package-snippet__version">0.1.0</span>
      <span class="package-snippet__released"><time datetime="2021-03-21T06:12:30+0000" data-controller="localized-time" data-localized-time-relative="true" data-localized-time-show-time="false">
  Mar 21, 2021
</time></span>
    </h3>
    <p class="package-snippet__description">test package 2</p>
  </a>
  </li>
"""

plugin = """
{"info":{"author":"Test Author","author_email":"test@test.com",
"bugtrack_url":null,"classifiers":["Development Status :: 4 - Beta",
"Intended Audience :: Developers","License :: OSI Approved :: BSD License",
"Operating System :: OS Independent","Programming Language :: Python",
"Programming Language :: Python :: 3","Programming Language :: Python :: 3.6",
"Programming Language :: Python :: 3.7","Programming Language :: Python :: 3.8"
,"Programming Language :: Python :: Implementation :: CPython",
"Programming Language :: Python :: Implementation :: PyPy",
"Topic :: Software Development :: Testing"],"description":"# description [example](http://example.com)",
  "description_content_type":"","docs_url":null,"download_url":"",
  "downloads":{"last_day":-1,"last_month":-1,"last_week":-1},
  "home_page":"https://github.com/test/test","keywords":"",
  "license":"BSD-3","maintainer":"Test Author",
  "maintainer_email":"test@test.com","name":"test",
  "package_url":"https://pypi.org/project/test/","platform":"",
  "project_url":"https://pypi.org/project/test/","project_urls":{
  "Homepage":"https://github.com/test/test"},
  "release_url":"https://pypi.org/project/test/0.0.1/",
  "requires_dist":null,"requires_python":">=3.6",
  "summary":"A test plugin",
  "version":"0.0.1","yanked":false,"yanked_reason":null},
  "last_serial":10229034,"releases":{"0.0.1":[{"comment_text":"",
  "downloads":-1,"filename":"test.tar.gz","has_sig":false,
  "md5_digest":"","packagetype":"sdist",
  "python_version":"source","requires_python":">=3.6","size":3338,
  "upload_time":"2020-04-13T03:37:20","upload_time_iso_8601":
  "2020-04-13T03:37:20.169990Z","url":"","yanked":false,"yanked_reason":null}],
  "0.0.2":[{"comment_text":"",
  "downloads":-1,"filename":"","has_sig":false,
  "packagetype":"sdist",
  "python_version":"source","requires_python":">=3.6","size":3343,
  "upload_time":"2020-04-13T14:58:21","upload_time_iso_8601":
  "2020-04-13T14:58:21.644816Z","yanked":false,"yanked_reason":null}],"0.0.3":
  [{"comment_text":"",
  "downloads":-1,"filename":"test","has_sig":false,"packagetype":"sdist",
  "python_version":"source","requires_python":">=3.6","size":3423,
  "upload_time":"2020-04-20T15:28:53",
  "upload_time_iso_8601":"2020-04-20T15:28:53.386281Z",
  "url":"","yanked":false,"yanked_reason":null}]}}"""

@mock.patch(
    'requests.get', return_value=FakeResponse(data=plugin_list)
)
def test_get_plugins(mock_get):
    result = get_plugins()
    assert len(result) == 2
    assert result['package1'] == "0.2.7"
    assert result['package2'] == "0.1.0"

@mock.patch(
    'requests.get', return_value=FakeResponse(data=plugin)
)
@mock.patch(
    'backend.napari.get_plugins', return_value={'test': '0.0.1'}
)
def test_get_plugin(mock_get, mock_plugins):
    result = get_plugin("test")
    assert(result["name"] == "test")
    assert(result["summary"] == "A test plugin")
    assert(result["description"] == "# description [example](http://example.com)")
    assert(result["description_text"] == "description example")
    assert(result["description_content_type"] == "")
    assert(result["authors"] == [{'email': 'test@test.com', 'name': 'Test Author'}])
    assert(result["license"] == "BSD-3")
    assert(result["python_version"] == ">=3.6")
    assert(result["operating_system"] == ['Operating System :: OS Independent'])
    assert(result["release_date"] == '2020-04-13T03:37:20.169990Z')
    assert(result["version"] == "0.0.1")
    assert(result["first_released"] == "2020-04-13T03:37:20.169990Z")
    assert(result["development_status"] == ['Development Status :: 4 - Beta'])
    assert(result["requirements"] is None)
    assert(result["project_site"] == "https://github.com/test/test")
    assert(result["documentation"] == "")
    assert(result["support"] == "")
    assert(result["report_issues"] == "")
    assert(result["twitter"] == "")
    assert(result["code_repository"] == "https://github.com/test/test")


@mock.patch(
    'requests.get', return_value=FakeResponse(data=plugin)
)
@mock.patch(
    'backend.napari.get_plugins', return_value={'not_test': '0.0.1'}
)
def test_get_invalid_plugin(mock_get, mock_plugins):
    assert({} == get_plugin("test"))


@mock.patch(
    'backend.napari.get_plugins', return_value=plugin_list
)
def test_get_shield(mock_plugins):
    result = get_shield('package1')
    assert result['message'] == 'package1'
    assert 'label' in result
    assert 'schemaVersion' in result
    assert 'color' in result

    result = get_shield('not-a-package')
    assert result == {}

def test_shield_round_trip():
    valid_plugin_api_url = 'https://api.napari-hub.org/shields/affinder'
    valid_plugin_shield_url = SHIELDS_URL+valid_plugin_api_url

    response = requests.get(valid_plugin_shield_url)
    assert response.status_code == 200
    assert response.text == AFFINDER_SVG

def test_github_get_url():
    plugins = {"info": {"project_urls": {"Source Code": "test1"}}}
    assert("test1" == get_download_url(plugins))

    plugins = {"info": {"project_urls": {"Random": "https://random.com"}}}
    assert(get_download_url(plugins) is None)

    plugins = {"info": {"project_urls": {"Random": "https://github.com/org"}}}
    assert(get_download_url(plugins) is None)

    plugins = {"info": {"project_urls": {"Random": "https://github.com/org/repo/random"}}}
    assert("https://github.com/org/repo" == get_download_url(plugins))


license_response = """
{
  "name": "LICENSE",
  "path": "LICENSE",
  "license": {
    "key": "bsd-3-clause",
    "name": "BSD 3-Clause \\"New\\" or \\"Revised\\" License",
    "spdx_id": "BSD-3-Clause",
    "url": "https://api.github.com/licenses/bsd-3-clause"
  }
}
"""


@mock.patch(
    'requests.get', return_value=FakeResponse(data=license_response)
)
def test_github_license(mock_get):
    result = get_license("test_website")
    assert result == "BSD-3-Clause"


no_license_response = """
{
  "name": "LICENSE",
  "path": "LICENSE",
  "license": {
    "key": "other",
    "name": "Other",
    "spdx_id": "NOASSERTION",
    "url": null
  }
}
"""


@mock.patch(
    'requests.get', return_value=FakeResponse(data=no_license_response)
)
def test_github_no_assertion_license(mock_get):
    result = get_license("test_website")
    assert result is None


def test_valid_citation():
    citation_string = """# YAML 1.2
---
abstract: "Test"
authors:
  -
    affiliation: "Test Center"
    family-names: Fa
    given-names: Gi N.
    orcid: https://orcid.org/0000-0000-0000-0000
  -
    affiliation: "Test Center 2"
    family-names: Family
    given-names: Given
cff-version: "1.0.3"
date-released: 2019-11-12
doi: 10.0000/something.0000000
keywords:
  - "citation"
  - "test"
  - "cff"
  - "CITATION.cff"
license: Apache-2.0
message: "If you use this software, please cite it using these metadata."
repository-code: "https://example.com/example"
title: testing
version: "0.0.0"
"""
    citation = get_citations(citation_string)
    assert citation['citation'] == citation_string
    assert citation['RIS'] == """TY  - COMP
AU  - Fa, Gi N.
AU  - Family, Given
DO  - 10.0000/something.0000000
KW  - citation
KW  - test
KW  - cff
KW  - CITATION.cff
M3  - software
PB  - GitHub Inc.
PP  - San Francisco, USA
PY  - 2019/11/12
T1  - testing
UR  - https://example.com/example
ER  -
"""
    assert citation['BibTex'] == """@misc{YourReferenceHere,
author = {
            Gi N. Fa and
            Given Family
         },
title  = {testing},
month  = {11},
year   = {2019},
doi    = {10.0000/something.0000000},
url    = {https://example.com/example}
}
"""


def test_invalid_citation():
    citation_str = """Ha? What is this?"""
    citations = get_citations(citation_str)
    assert citations['citation'] is None
