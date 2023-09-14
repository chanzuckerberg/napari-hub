from typing import List, Dict, Any, Set, Optional
from unittest.mock import Mock

import pytest

from nhcommons.models import plugin, install_activity
from api import model


class TestModel:

    @pytest.fixture
    def plugin_get_index_result(self) -> List[Dict[str, Any]]:
        return [
            {"name": "Plugin1", "version": "1.0.0"},
            {"name": "plugin-2", "version": "3.2"},
            {"name": "plugin-3", "version": "0.5"},
        ]

    @pytest.fixture
    def mock_get_index(
            self,
            plugin_get_index_result: List[Dict[str, Any]],
            monkeypatch: pytest.MonkeyPatch,
    ) -> Mock:
        mock = Mock(spec=plugin.get_index, return_value=plugin_get_index_result)
        monkeypatch.setattr(model.plugin_model, "get_index", mock)
        return mock

    @pytest.fixture
    def get_total_installs_result(self) -> Dict[str, int]:
        return {"plugin1": 30, "plugin-3": 10}

    @pytest.fixture
    def mock_total_installs(
            self,
            get_total_installs_result: Dict[str, int],
            monkeypatch: pytest.MonkeyPatch,
    ) -> Mock:
        mock = Mock(
            spec=install_activity.get_total_installs_by_plugins,
            return_value=get_total_installs_result
        )
        monkeypatch.setattr(
            model.install_activity, "get_total_installs_by_plugins", mock
        )
        return mock

    @pytest.fixture
    def plugin_index_with_total_installs(
            self,
            plugin_get_index_result: List[Dict[str, Any]],
            get_total_installs_result: Dict[str, int],

    ) -> List[Dict[str, Any]]:
        result = []
        for item in plugin_get_index_result:
            installs = get_total_installs_result.get(item["name"].lower(), 0)
            result.append({**item, **{"total_installs": installs}})
        return result

    @pytest.mark.parametrize("visibility, include_total_installs, expected", [
        ({"PUBLIC"}, True, "plugin_index_with_total_installs"),
        ({"PUBLIC", "HIDDEN"}, True, "plugin_index_with_total_installs"),
        ({"PUBLIC"}, False, "plugin_get_index_result"),
        ({"PUBLIC", "HIDDEN"}, False, "plugin_get_index_result"),
    ])
    def test_get_index_with_include_installs(
            self,
            visibility: Optional[Set[str]],
            include_total_installs: bool,
            expected: str,
            mock_get_index: Mock,
            mock_total_installs: Mock,
            request: pytest.FixtureRequest,
    ):
        actual = model.get_index(visibility, include_total_installs)

        assert request.getfixturevalue(expected) == actual
        mock_get_index.assert_called_with(visibility)
        if include_total_installs:
            mock_total_installs.assert_called_with()
        else:
            mock_total_installs.assert_not_called()
