from typing import Dict

import pytest

from nhcommons.utils.github_adapter import get_repo_url


class TestGithubAdapter:
    @pytest.mark.parametrize(
        "input_value, expected",
        [
            (
                {
                    "Source Code": "https://github.com/test123/foo1",
                },
                "https://github.com/test123/foo1",
            ),
            (
                {
                    "Source Code": "https://github.com/test123/foo1.git",
                    "source": "https://github.com/test23/foo2#README.md",
                },
                "https://github.com/test123/foo1.git",
            ),
            (
                {
                    "Source Code": "https://www.foo.com/",
                    "repo": "https://github.com/test123/foo1/tree/main/foo1",
                },
                "https://www.foo.com/",
            ),
            (
                {"repo": "https://github.com/test123/foo1"},
                "https://github.com/test123/foo1",
            ),
            (
                {"repo": "https://github.com/test123/foo1/tree/main/foo1"},
                "https://github.com/test123/foo1",
            ),
            (
                {"repo": "https://github.com/test123/foo1#README.md"},
                "https://github.com/test123/foo1",
            ),
            ({"bar": "https://github1.com/test"}, None),
        ],
    )
    def test_get_repo_url(self, input_value: Dict[str, str], expected: str):
        assert expected == get_repo_url(input_value)
