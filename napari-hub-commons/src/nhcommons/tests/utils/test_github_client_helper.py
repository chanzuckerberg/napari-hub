import json
from typing import Optional, Union, List
from unittest.mock import Mock, call

import pytest

import nhcommons
from nhcommons.tests.utils.test_fixtures import MockResponse
from nhcommons.utils.adapter_helpers import GithubClientHelper

JSON_CONTENT = {"foo": ["bar", "baz"]}
TEXT_CONTENT = json.dumps(JSON_CONTENT)


class TestGithubClientHelper:
    @pytest.fixture(scope="class")
    def auth_obj(self):
        return Mock()

    @pytest.fixture(autouse=True)
    def get_auth(self, monkeypatch, auth_obj):
        monkeypatch.setattr(
            nhcommons.utils.adapter_helpers, "get_auth", lambda: auth_obj
        )

    def mock_get_request(self, *args, **_):
        if self._expected_url == args[0]:
            return MockResponse(content=self._content)
        return MockResponse(status_code=404).raise_for_status()

    @pytest.fixture
    def get_request(self, monkeypatch):
        mock = Mock(side_effect=self.mock_get_request)
        monkeypatch.setattr(nhcommons.utils.adapter_helpers, "get_request", mock)
        return mock

    @pytest.mark.parametrize(
        "content, expected",
        [
            ("{}", None),
            (json.dumps({"license": {"spdx_id": "NOASSERTION"}}), None),
            (json.dumps({"license": {"spdx_id": "BSD-3-Clause"}}), "BSD-3-Clause"),
            ("{license: {}}", None),
        ],
    )
    def test_get_license(
        self, content: str, expected: Optional[str], get_request: Mock, auth_obj: Mock
    ):
        self._expected_url = "https://api.github.com/repos/foo/bar/license?ref=main"
        self._content = content
        github_client_helper = GithubClientHelper("https://github.com/foo/bar", "main")
        assert github_client_helper.get_license() == expected
        get_request.assert_called_once_with(
            "https://api.github.com/repos/foo/bar/license?ref=main", auth=auth_obj
        )

    @pytest.mark.parametrize(
        "content, file, file_format, expected, url_path",
        [
            (TEXT_CONTENT, "", "", TEXT_CONTENT, ""),
            (TEXT_CONTENT, "", "json", JSON_CONTENT, ""),
            ('{"foo": []', "", "", '{"foo": []', ""),
            ('{"foo": []', "", "json", None, ""),
            (TEXT_CONTENT, "CITATION.cff", "", TEXT_CONTENT, "/main/CITATION.cff"),
            (TEXT_CONTENT, "CITATION.cff", "json", JSON_CONTENT, "/main/CITATION.cff"),
            ('{"foo": []', "CITATION.cff", "json", None, "/main/CITATION.cff"),
        ],
    )
    def test_get_file(
        self,
        content: str,
        file: str,
        file_format: str,
        expected: Optional[Union[str, dict]],
        url_path: str,
        get_request: Mock,
        auth_obj: Mock,
    ):
        self._content = content
        self._expected_url = f"https://raw.githubusercontent.com/foo/bar{url_path}"
        github_client_helper = GithubClientHelper("https://github.com/foo/bar", "main")
        assert github_client_helper.get_file(file, file_format) == expected
        get_request.assert_called_once_with(
            f"https://raw.githubusercontent.com/foo/bar{url_path}", auth=auth_obj
        )

    @pytest.mark.parametrize(
        "valid_file, file_format, expected, url_paths",
        [
            ("file_1", "", TEXT_CONTENT, ["file_1"]),
            ("file_2", "", TEXT_CONTENT, ["file_1", "file_2"]),
            ("file_3", "", None, ["file_1", "file_2"]),
            ("file_1", "json", JSON_CONTENT, ["file_1"]),
            ("file_2", "json", JSON_CONTENT, ["file_1", "file_2"]),
            ("file_3", "json", None, ["file_1", "file_2"]),
        ],
    )
    def test_get_first_valid_file(
        self,
        valid_file: str,
        file_format: str,
        expected: Optional[Union[str, dict]],
        url_paths: List[str],
        get_request: Mock,
        auth_obj: Mock,
    ):
        request_url = "https://raw.githubusercontent.com/foo/bar/main/{path}"
        self._content = TEXT_CONTENT
        self._expected_url = request_url.format(path=valid_file)
        github_client_helper = GithubClientHelper("https://github.com/foo/bar", "main")
        paths = ["file_1", "file_2"]
        assert github_client_helper.get_first_valid_file(paths, file_format) == expected

        get_request_calls = [
            call(request_url.format(path=path), auth=auth_obj) for path in url_paths
        ]
        get_request.assert_has_calls(get_request_calls)
