import requests
from requests.exceptions import HTTPError
import json


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

# test splitting with comma 
split_comma_plugin = """
{"info":{"author":"Test Author 1, Test Author 2 ,Test Author 3,Test Author 4 , Test Author 5","author_email":"test@test.com",
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

split_comma_correct_result = [
  {'name': 'Test Author 1'},
  {'name': 'Test Author 2'},
  {'name': 'Test Author 3'},
  {'name': 'Test Author 4'},
  {'name': 'Test Author 5'}
]

# test splitting with ampersand
split_ampersand_plugin = """
{"info":{"author":"Test Author 1& Test Author 2 &Test Author 3&Test Author 4 & Test Author 5","author_email":"test@test.com",
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

split_ampersand_correct_result = [
  {'name': 'Test Author 1'},
  {'name': 'Test Author 2'},
  {'name': 'Test Author 3'},
  {'name': 'Test Author 4'},
  {'name': 'Test Author 5'}
]

# test splitting with and
split_and_plugin = """
{"info":{"author":"Test Author 1 and Test Author 2, andy& yand & sandra","author_email":"test@test.com",
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

split_and_correct_result = [
  {'name': 'Test Author 1'},
  {'name': 'Test Author 2'},
  {'name': 'andy'},
  {'name': 'yand'},
  {'name': 'sandra'}
]

# test empyy splitting
empty_split_plugin = """
{"info":{"author":" and,,,&& and ,,and,,&&&and ","author_email":"test@test.com",
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

empty_split_correct_result = [
  {'name': 'and'},
  {'name': 'and'},
  {'name': 'and'}
]
