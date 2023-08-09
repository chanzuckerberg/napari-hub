import json
from typing import Callable, Any, Dict, List, Set

import pytest
from pytest_bdd import scenarios, then, parsers
from parse_type import TypeBuilder

required_plugin_keys = {
    "authors",
    "description_content_type",
    "description_text",
    "development_status",
    "display_name",
    "first_released",
    "license",
    "name",
    "operating_system",
    "plugin_types",
    "python_version",
    "reader_file_extensions",
    "release_date",
    "summary",
    "version",
    "writer_file_extensions",
    "writer_save_layers",
}
required_public_plugin_keys = {
    "display_name",
    "plugin_types",
    "reader_file_extensions",
    "writer_file_extensions",
    "writer_save_layers",
}

valid_plugin_types = {"reader", "sample_data", "theme", "widget", "writer"}
list_str_parser = TypeBuilder.with_many(lambda text: text, listsep=",")

scenarios("plugin.feature")


@pytest.fixture
def validate_plugin(
        valid_str: Callable[[str], bool]
) -> Callable[[Dict[str, Any], Set[str]], None]:
    def _validate_plugin(plugin_data: Dict[str, Any], required_keys: Set[str]):
        assert plugin_data != {}, f"actual response {json.dumps(plugin_data)}"
        if valid_str(plugin_data["display_name"]):
            plugin_name = plugin_data["display_name"]
        else:
            plugin_name = plugin_data["name"]
        assert valid_str(plugin_name), f"No name available for plugin {plugin_data}"

        actual_plugin_types = set(plugin_data.get("plugin_types", []))
        assert actual_plugin_types.issubset(
            valid_plugin_types
        ), f"plugin_types contains unexpected value {actual_plugin_types}"

        authors = plugin_data.get("authors", [])
        for author in authors:
            assert "name" in author

        for key in required_keys:
            assert (
                key in plugin_data
            ), f"key: {key} not in response for plugin {plugin_name}"
    return _validate_plugin


@then("it will have valid plugin response")
def verify_plugin_response_valid(
        context: Dict[str, Any],
        validate_plugin: Callable[[Dict[str, Any], Set[str]], None]
) -> None:
    validate_plugin(context["response"].json(), required_plugin_keys)


@then("it will have valid plugins in response")
def verify_plugins_in_response_valid(
        context: Dict[str, Any],
        validate_plugin: Callable[[Dict[str, Any], Set[str]], None]
) -> None:
    for plugin in context["response"].json():
        validate_plugin(plugin, required_plugin_keys)


@then(parsers.cfparse("it will have min plugins of {expected:d}"))
def verify_public_plugins_defaults(context: Dict[str, Any], expected: int) -> None:
    response = context["response"].json()
    assert len(response) > expected, f"count of public plugins is lesser than " \
                                     f"expected {len(response)}"


@then(
    parsers.cfparse(
        "it will fetch plugins with visibility {visibilities:list_str}",
        extra_types={"list_str": list_str_parser}
    )
)
def verify_public_plugins_detailed(
        context: Dict[str, Any],
        validate_plugin: Callable[[Dict[str, Any], Set[str]], None],
        visibilities: List[str]
) -> None:
    expected_visibility = set(visibilities)
    for plugin in context["response"].json():
        visibility = plugin.get("visibility", "").lower()
        assert visibility in expected_visibility, f"{plugin.get('name')} has " \
                                                  f"unexpected visibility: {visibility}"
        validate_plugin(plugin, required_public_plugin_keys)


@then("it will have total_installs field")
def verify_public_plugins_detailed(context: Dict[str, Any]) -> None:
    for plugin in context["response"].json():
        assert 0 <= plugin.get("total_installs", -1), f"invalid total_installs " \
                                                      f"for {plugin.get('name')}"


@then(
    parsers.cfparse(
        "it will not have {field_names:list_str} fields",
        extra_types={"list_str": list_str_parser},
    )
)
def verify_public_plugins_detailed(
        context: Dict[str, Any], field_names: List[str]
) -> None:
    for plugin in context["response"].json():
        for field in field_names:
            assert field not in plugin, f"unexpected {field} field in plugin response"
