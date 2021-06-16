from unittest import mock
import requests
from requests.exceptions import HTTPError

from backend.napari import get_plugin
from backend.napari import get_plugins
from backend.napari import get_download_url


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
"Topic :: Software Development :: Testing"],"description":"description",
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
    assert(result["description"] == "description")
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
    assert(result["project_site"] == "https://pypi.org/project/test/")
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


def test_github_get_url():
    plugins = {"info": {"project_urls": {"Source Code": "test1"}}}
    assert("test1" == get_download_url(plugins))

    plugins = {"info": {"project_urls": {"Random": "https://random.com"}}}
    assert(get_download_url(plugins) is None)

    plugins = {"info": {"project_urls": {"Random": "https://github.com/org"}}}
    assert(get_download_url(plugins) is None)

    plugins = {"info": {"project_urls": {"Random": "https://github.com/org/repo/random"}}}
    assert("https://github.com/org/repo" == get_download_url(plugins))
