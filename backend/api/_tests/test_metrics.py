import pytest

from api import metrics
from api._tests.test_fixtures import generate_commits_timeline, generate_installs_timeline

PLUGIN_NAME = 'StrIng-1'
PLUGIN_NAME_CLEAN = 'string-1'
MOCK_PLUGIN_LATEST_COMMIT = 1672531200000
MOCK_PLUGIN_COMMIT_ACTIVITY = generate_commits_timeline(start_range=-5)
MOCK_PLUGIN_TOTAL_COMMITS = sum([activity.get('commits') for activity in MOCK_PLUGIN_COMMIT_ACTIVITY])
MOCK_PLUGIN_OBJ_EMPTY = {}
MOCK_PLUGIN_OBJ = {"name": "string-1", "code_repository": "https://github.com/user/repo"}

USAGE_TIMELINE = generate_installs_timeline(start_range=-3)


def generate_expected_metrics(usage_timeline=None, total_installs=0, installs_in_last_30_days=0,
                              latest_commit=None, total_commit=0, maintenance_timeline=None):
    return {
        'usage': {
            'timeline': usage_timeline if usage_timeline else [],
            'stats': {
                'total_installs': total_installs,
                'installs_in_last_30_days': installs_in_last_30_days
            }
        },
        'maintenance': {
            'timeline': maintenance_timeline if maintenance_timeline else [],
            'stats': {
                'latest_commit_timestamp': latest_commit,
                'total_commits': total_commit
            }
        }
    }


class TestMetricModel:

    @pytest.mark.parametrize('maintenance_timeline, latest_commit, total_commits, '
                             'total_installs, recent_installs, usage_timeline, limit, get_plugin', [
        (generate_commits_timeline(start_range=-3, to_value=lambda i: 0), None, 0, 0, 0,
         generate_installs_timeline(start_range=-3, to_value=lambda i: 0), '3', MOCK_PLUGIN_OBJ_EMPTY),
        ([], MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMITS, 25, 21, [], '0', MOCK_PLUGIN_OBJ),
        ([], MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMITS, 25, 21, [], 'foo', MOCK_PLUGIN_OBJ),
        ([], MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMITS, 25, 21, [], '-5', MOCK_PLUGIN_OBJ),
        (generate_installs_timeline(start_range=-3), MOCK_PLUGIN_LATEST_COMMIT, MOCK_PLUGIN_TOTAL_COMMITS, 25, 21,
         generate_installs_timeline(start_range=-3), '3', MOCK_PLUGIN_OBJ)])
    def test_metrics_api_using_dynamo(self, monkeypatch, maintenance_timeline, latest_commit,
                                      total_commits, total_installs, recent_installs, usage_timeline, limit, get_plugin):
        monkeypatch.setattr(metrics, 'get_plugin', self._validate_args_return_value(get_plugin))
        monkeypatch.setattr(metrics.github_activity, 'get_total_commits', self._validate_args_return_value(total_commits))
        monkeypatch.setattr(metrics.github_activity, 'get_latest_commit', self._validate_args_return_value(latest_commit))
        monkeypatch.setattr(metrics.github_activity, 'get_timeline', self._validate_args_return_value(maintenance_timeline))
        monkeypatch.setattr(metrics.install_activity, 'get_total_installs', self._validate_args_return_value(total_installs))
        monkeypatch.setattr(metrics.install_activity, 'get_recent_installs', self._validate_args_return_value(recent_installs))
        monkeypatch.setattr(metrics.install_activity, 'get_timeline', self._validate_args_return_value(usage_timeline))

        actual = metrics.get_metrics_for_plugin(PLUGIN_NAME, limit)

        expected = generate_expected_metrics(
            total_installs=total_installs, installs_in_last_30_days=recent_installs, usage_timeline=usage_timeline,
            latest_commit=latest_commit, total_commit=total_commits, maintenance_timeline=maintenance_timeline
        )
        assert actual == expected

    @staticmethod
    def _validate_args_return_value(value):
        return lambda *args, **kwargs: value if args[0] == PLUGIN_NAME_CLEAN else None
