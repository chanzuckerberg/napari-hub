from typing import Dict
import pytest
from nhcommons.utils.github_adapter import get_repo_url


class TestGithubAdapter:
    @pytest.mark.parametrize(
        "project_urls, expected",
        [
            (
                {
                    "Source Code": "https://www.foo.com/",
                    "bar": "https://github.com/test123/foo1",
                },
                "https://www.foo.com/",
            ),
            ({"bar": "https://www.foo.com/"}, None),
            (
                {"bar": "https://github.com/test123/foo1"},
                "https://github.com/test123/foo1",
            ),
            ({"bar": "https://github1.com/test"}, None),
        ],
    )
    def test_get_latest_plugins(self, project_urls: Dict[str, str], expected: str):
        assert expected == get_repo_url(project_urls)
