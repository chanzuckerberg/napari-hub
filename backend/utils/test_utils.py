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

# constants for testing parsing author info from citation
citation_string_no_auth_name = """# YAML 1.2
---
abstract: "Test"
authors:
  - name: The Research Software project
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

citation_string_auth_names_and_name = """# YAML 1.2
---
abstract: "Test"
authors:
  - given-names: Gi N.
    family-names: Fa
    name: "The Research Software project"
  - name: "The Research Software project"
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

config_yaml = """
visibility: public
summary: The napari adaptation of the ImageJ/Fiji plugin AnnotatorJ for easy and fun image annotation.
authors:
  - name: Test Author
    orcid: 0000-0000-0000-0000
labels:
  ontology: NAPARI:1
  terms:
  - Term 1
  - Term 2
  - Term 3
"""

citations_authors_result = [
  {'name':"Gi N. Fa"},
  {'name':"Given Family"}
]

citations_authors_auth_names_and_name_result = [
  {'name':"Gi N. Fa"}, {'name':"The Research Software project"}
]

citations_no_authors_result = [
  {'name':"The Research Software project"}
]

config_yaml_authors_result = [
  {'name': 'Test Author', 'orcid': '0000-0000-0000-0000'}
]

# constants for testing author splitting
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

# constants for testing zulip bot message generation
github_api_response = """
{
  "url": "https://api.github.com/repos/octocat/Hello-World/releases/1",
  "html_url": "https://github.com/octocat/Hello-World/releases/v1.0.0",
  "assets_url": "https://api.github.com/repos/octocat/Hello-World/releases/1/assets",
  "upload_url": "https://uploads.github.com/repos/octocat/Hello-World/releases/1/assets{?name,label}",
  "tarball_url": "https://api.github.com/repos/octocat/Hello-World/tarball/v1.0.0",
  "zipball_url": "https://api.github.com/repos/octocat/Hello-World/zipball/v1.0.0",
  "discussion_url": "https://github.com/octocat/Hello-World/discussions/90",
  "id": 1,
  "node_id": "MDc6UmVsZWFzZTE=",
  "tag_name": "v1.0.0",
  "target_commitish": "master",
  "name": "v1.0.0",
  "body": "Description of the release",
  "draft": false,
  "prerelease": false,
  "created_at": "2013-02-27T19:35:32Z",
  "published_at": "2013-02-27T19:35:32Z",
  "author": {
    "login": "octocat",
    "id": 1,
    "node_id": "MDQ6VXNlcjE=",
    "avatar_url": "https://github.com/images/error/octocat_happy.gif",
    "gravatar_id": "",
    "url": "https://api.github.com/users/octocat",
    "html_url": "https://github.com/octocat",
    "followers_url": "https://api.github.com/users/octocat/followers",
    "following_url": "https://api.github.com/users/octocat/following{/other_user}",
    "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
    "organizations_url": "https://api.github.com/users/octocat/orgs",
    "repos_url": "https://api.github.com/users/octocat/repos",
    "events_url": "https://api.github.com/users/octocat/events{/privacy}",
    "received_events_url": "https://api.github.com/users/octocat/received_events",
    "type": "User",
    "site_admin": false
  },
  "assets": [
    {
      "url": "https://api.github.com/repos/octocat/Hello-World/releases/assets/1",
      "browser_download_url": "https://github.com/octocat/Hello-World/releases/download/v1.0.0/example.zip",
      "id": 1,
      "node_id": "MDEyOlJlbGVhc2VBc3NldDE=",
      "name": "example.zip",
      "label": "short description",
      "state": "uploaded",
      "content_type": "application/zip",
      "size": 1024,
      "download_count": 42,
      "created_at": "2013-02-27T19:35:32Z",
      "updated_at": "2013-02-27T19:35:32Z",
      "uploader": {
        "login": "octocat",
        "id": 1,
        "node_id": "MDQ6VXNlcjE=",
        "avatar_url": "https://github.com/images/error/octocat_happy.gif",
        "gravatar_id": "",
        "url": "https://api.github.com/users/octocat",
        "html_url": "https://github.com/octocat",
        "followers_url": "https://api.github.com/users/octocat/followers",
        "following_url": "https://api.github.com/users/octocat/following{/other_user}",
        "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
        "organizations_url": "https://api.github.com/users/octocat/orgs",
        "repos_url": "https://api.github.com/users/octocat/repos",
        "events_url": "https://api.github.com/users/octocat/events{/privacy}",
        "received_events_url": "https://api.github.com/users/octocat/received_events",
        "type": "User",
        "site_admin": false
      }
    }
  ]
}
"""

github_api_response_no_body = """
{
  "url": "https://api.github.com/repos/octocat/Hello-World/releases/1"
}
"""

metadata_if_code_repository_exists = """
{
  "napari-demo":{
    "code_repository": "https://github.com/author/napari-demo"
  },
  "new-napari-plugin": {
    "code_repository": "https://github.com/author2/new-napari-plugin"
  }
}
"""

metadata_if_code_repository_is_null = """
{
  "napari-demo":{
    "code_repository": null
  },
  "new-napari-plugin": {
    "code_repository": null
  }
}
"""

metadata_if_code_repository_does_not_exist = """
{
  "napari-demo":{
    "empty": ""
  },
  "new-napari-plugin": {
    "empty": ""
  }
}
"""

test_package_existing = "napari-demo"

test_version_existing = "0.0.1"

test_github_link_existing = "https://github.com/author/napari-demo"

test_package_new = "new-napari-plugin"

test_version_new = "0.0.2"

test_github_link_new = "https://github.com/author2/new-napari-plugin"

existing_demo_plugins = {
    "napari-demo": "0.0.0",
}

existing_demo_plugins_version_unchanged = {
    "napari-demo": "0.0.1",
    "new-napari-plugin": "0.0.2",
    "unchanged-napari-plugin": "0.0.0"
}

list_of_demo_plugins = """
{
    "napari-demo": "0.0.1",
    "new-napari-plugin": "0.0.2"
}
"""

list_of_demo_plugins_no_version_change = """
{
    "napari-demo": "0.0.1",
    "new-napari-plugin": "0.0.2",
    "unchanged-napari-plugin": "0.0.0"
}
"""

currently_used_plugins = {"napari-demo", "new-napari-plugin"}

currently_used_plugins_no_version_change = {"napari-demo", "new-napari-plugin", "unchanged-napari-plugin"}

response_with_release_notes = """
{
    "body":"release_notes"
}
"""

response_with_release_notes_with_v = """
{
    "body":"release_notes_with_v"
}
"""

response_without_release_notes = """
{
    "b":"release_notes"
}
"""

message_separator = '\n-------------------------------\n'

existing_release_notes_with_no_v = "release_notes"

existing_link_to_release_no_v = {
  "napari-demo": f"[{test_version_existing}]({test_github_link_existing}/releases/tag/{test_version_existing})",
  "new-napari-plugin": f"[{test_version_new}]({test_github_link_new}/releases/tag/{test_version_new})"
  }

existing_message_with_release_no_v = {
  "napari-demo": f'A new version of [{test_package_existing}](https://napari-hub.org/plugins/{test_package_existing}) is available on the ' \
                 f'napari hub! Check out the release notes for {existing_link_to_release_no_v["napari-demo"]}:{message_separator}' \
                 + existing_release_notes_with_no_v,
  "new-napari-plugin": f'A new plugin has been published on the napari hub! ' \
                    f'Check out [{test_package_new}](https://napari-hub.org/plugins/{test_package_new})!' \
                    f'\nAlso check out its release notes for version {existing_link_to_release_no_v["new-napari-plugin"]}:{message_separator}' + existing_release_notes_with_no_v

  }

existing_release_notes_with_v = "release_notes_with_v"

existing_link_to_release_with_v = {
  "napari-demo": f"[v{test_version_existing}]({test_github_link_existing}/releases/tag/v{test_version_existing})",
  "new-napari-plugin": f"[v{test_version_new}]({test_github_link_new}/releases/tag/v{test_version_new})"
}

existing_message_with_release_with_v = {
  "napari-demo": f'A new version of [{test_package_existing}](https://napari-hub.org/plugins/{test_package_existing}) is available on the ' \
                 f'napari hub! Check out the release notes for {existing_link_to_release_with_v["napari-demo"]}:{message_separator}' \
                 + existing_release_notes_with_v,
  "new-napari-plugin": f'A new plugin has been published on the napari hub! ' \
                    f'Check out [{test_package_new}](https://napari-hub.org/plugins/{test_package_new})!' \
                    f'\nAlso check out its release notes for version {existing_link_to_release_with_v["new-napari-plugin"]}:{message_separator}' + existing_release_notes_with_v
  }

empty_release_notes = ''

test_link_to_napari = {
  "napari-demo": f'[{test_version_existing}](https://napari-hub.org/plugins/{test_package_existing})',
  "new-napari-plugin": f'[{test_version_new}](https://napari-hub.org/plugins/{test_package_new})'
  }

message_no_release_notes = {
  "napari-demo": f'A new version of [{test_package_existing}](https://napari-hub.org/plugins/{test_package_existing}) is available on the ' \
                 f'napari hub! Check out [0.0.1](https://napari-hub.org/plugins/{test_package_existing})!', 
  "new-napari-plugin": f'A new plugin has been published on the napari hub! ' \
                    f'Check out [{test_package_new}](https://napari-hub.org/plugins/{test_package_new}) with version [{test_version_new}](https://napari-hub.org/plugins/{test_package_new})!' 
  }
