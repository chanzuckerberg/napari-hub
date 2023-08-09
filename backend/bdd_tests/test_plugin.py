import json

from pytest_bdd import given, scenarios, then, parsers
from parse_type import TypeBuilder
from test_utils import call_api, valid_str

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


@given(parsers.cfparse("we call /plugins api for {name} version {version}"))
def call_plugin_with_version(name, version, context):
    endpoint_version = f"/versions/{version}" if version != "None" else ""
    call_api(context, f"/plugins/{name}{endpoint_version}")


@given(parsers.cfparse("we call {endpoint} api"))
def call_plugins_index(context, endpoint):
    call_api(context, endpoint)


@then("it will have valid plugin response")
def verify_plugin_response_valid(context):
    _validate_plugin(context["response"].json(), required_plugin_keys)


@then("it will have valid plugins in response")
def verify_plugins_in_response_valid(context):
    for plugin in context["response"].json():
        _validate_plugin(plugin, required_plugin_keys)


@then(parsers.cfparse("it will have min plugins of {expected:d}"))
def verify_public_plugins_defaults(context, expected):
    response = context["response"].json()
    assert (
        len(response) > expected
    ), f"count of public plugins is lesser than expected {len(response)}"


@then(
    parsers.cfparse(
        "it will fetch plugins with visibility {visibilities:list_str}",
        extra_types={"list_str": list_str_parser}
    )
)
def verify_public_plugins_detailed(context, visibilities):
    expected_visibility = set(visibilities)
    for plugin in context["response"].json():
        visibility = plugin.get("visibility", "").lower()
        assert (
            visibility in expected_visibility
        ), f"{plugin.get('name')} has unexpected visibility: {visibility}"
        _validate_plugin(plugin, required_public_plugin_keys)


@then("it will have total_installs field")
def verify_public_plugins_detailed(context):
    for plugin in context["response"].json():
        assert 0 <= plugin.get(
            "total_installs", -1
        ), f"invalid total_installs for { plugin.get('name')}"


@then(
    parsers.cfparse(
        "it will not have {field_names:list_str} fields",
        extra_types={"list_str": list_str_parser},
    )
)
def verify_public_plugins_detailed(context, field_names):
    for plugin in context["response"].json():
        for field in field_names:
            assert field not in plugin, f"unexpected {field} field in plugin response"


@then("it will have only return plugins with excluded type")
def verify_excluded_plugin_response(context):
    response = context["response"].json()
    valid_types = {"blocked", "disabled", "hidden", "invalid"}
    for key, val in response.items():
        assert val.lower() in valid_types, f"{key} has unknown exclusion type {val}"


def _validate_plugin(plugin_data, required_keys):
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
