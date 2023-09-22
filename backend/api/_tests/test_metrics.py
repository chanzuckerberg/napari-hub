from typing import Dict
from unittest.mock import Mock

import pytest

from api import metrics
from api._tests.test_fixtures import (
    generate_commits_timeline,
    generate_installs_timeline,
)

PLUGIN_NAME = "StrIng-1"
PLUGIN_NAME_CLEAN = "string-1"
MOCK_EMPTY_PLUGIN = {}
REPO = "user/repo"
MOCK_PLUGIN_OBJ = {"name": "string-1", "code_repository": f"https://github.com/{REPO}"}

MAINTENANCE_TIMELINE = generate_commits_timeline(
    start_range=-3, to_value=lambda i: i * 3
)
LATEST_COMMIT = 1672531200000
TOTAL_COMMITS = 153
USAGE_TIMELINE = generate_installs_timeline(start_range=-3, to_value=lambda i: i + 8)
TOTAL_INSTALLS = 983
RECENT_INSTALLS = 54


def generate_expected_metrics(limit: int):
    return {
        "usage": {
            "timeline": USAGE_TIMELINE if limit else [],
            "stats": {
                "total_installs": TOTAL_INSTALLS,
                "installs_in_last_30_days": RECENT_INSTALLS,
            },
        },
        "maintenance": {
            "timeline": MAINTENANCE_TIMELINE if limit else [],
            "stats": {
                "latest_commit_timestamp": LATEST_COMMIT,
                "total_commits": TOTAL_COMMITS,
            },
        },
    }


class TestMetricModel:
    @pytest.fixture(autouse=True)
    def get_plugin(self, monkeypatch) -> None:
        self._get_plugin = Mock(side_effect=lambda plugin: self._plugin)
        monkeypatch.setattr(metrics, "get_plugin", self._get_plugin)

    @pytest.fixture(autouse=True)
    def maintenance_mocks(self, monkeypatch) -> None:
        self._get_maintenance_timeline = Mock(return_value=MAINTENANCE_TIMELINE)
        monkeypatch.setattr(
            metrics.github_activity, "get_timeline", self._get_maintenance_timeline
        )
        self._get_total_commits = Mock(return_value=TOTAL_COMMITS)
        monkeypatch.setattr(
            metrics.github_activity, "get_total_commits", self._get_total_commits
        )
        self._get_latest_commit = Mock(return_value=LATEST_COMMIT)
        monkeypatch.setattr(
            metrics.github_activity, "get_latest_commit", self._get_latest_commit
        )

    @pytest.fixture(autouse=True)
    def usage_mocks(self, monkeypatch) -> None:
        self._get_usage_timeline = Mock(return_value=USAGE_TIMELINE)
        monkeypatch.setattr(
            metrics.install_activity, "get_timeline", self._get_usage_timeline
        )
        self._get_total_installs = Mock(return_value=TOTAL_INSTALLS)
        monkeypatch.setattr(
            metrics.install_activity, "get_total_installs", self._get_total_installs
        )
        self._get_recent_installs = Mock(return_value=RECENT_INSTALLS)
        monkeypatch.setattr(
            metrics.install_activity, "get_recent_installs", self._get_recent_installs
        )

    @pytest.mark.parametrize(
        "limit_str, limit, plugin, repo",
        [
            ("3", 3, MOCK_EMPTY_PLUGIN, None,),
            ("0", 0, MOCK_PLUGIN_OBJ, REPO,),
            ("foo", 0, MOCK_PLUGIN_OBJ, REPO,),
            ("-5", 0, MOCK_PLUGIN_OBJ, REPO,),
            ("3", 3, MOCK_PLUGIN_OBJ, REPO,),
        ],
    )
    def test_get_metrics_for_plugin(
            self, limit_str: str, limit: int, plugin: Dict, repo: str
    ):
        self._plugin = plugin

        actual = metrics.get_metrics_for_plugin(PLUGIN_NAME, limit_str)

        expected = generate_expected_metrics(limit)
        assert actual == expected
        self._get_plugin.assert_called_once_with(PLUGIN_NAME)

        if limit > 0:
            self._get_maintenance_timeline.assert_called_once_with(
                PLUGIN_NAME_CLEAN, repo, limit
            )
            self._get_usage_timeline.assert_called_once_with(PLUGIN_NAME_CLEAN, limit)
        else:
            self._get_maintenance_timeline.assert_not_called()
            self._get_usage_timeline.assert_not_called()

        self._get_latest_commit.assert_called_once_with(PLUGIN_NAME_CLEAN, repo)
        self._get_total_commits.assert_called_once_with(PLUGIN_NAME_CLEAN, repo)
        self._get_total_installs.assert_called_once_with(PLUGIN_NAME_CLEAN)
        self._get_recent_installs.assert_called_once_with(PLUGIN_NAME_CLEAN, 30)
