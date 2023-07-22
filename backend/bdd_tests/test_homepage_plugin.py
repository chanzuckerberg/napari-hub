from pytest_bdd import given, scenarios, then, parsers
from test_utils import call_api

default_plugin_keys = {
    "authors", "display_name", "first_released", "name", "release_date",
    "summary", "total_installs"
}
valid_plugin_types = {"reader", "sample_data", "widget", "writer"}

scenarios("homepage_plugins.feature")


@given(parsers.parse("we call plugins home api for {sections} having a limit of"
                     " {limit} and query_param={query_param}"))
def call_plugin_home_with_limit(sections, limit, query_param, context):
    url = f"/plugin/home/sections/{sections}?limit={limit}&{query_param}"
    call_api(context, url)


@given(parsers.parse("we call plugins home api for {sections} with query_param="
                     "{query_param}"))
def call_plugin_home_without_limit(sections, query_param, context):
    call_api(context, f"/plugin/home/sections/{sections}?{query_param}")


@then(parsers.parse("it will have only the {sections} sections"))
def verify_sections_are_valid(sections, context):
    response = context["response"].json()
    sections_list = set(sections.split(","))
    assert response.keys() == sections_list


@then("it will have valid type for plugin_types")
def verify_plugin_types_valid(context):
    response = context["response"].json()
    assert response.get("plugin_types").get("type") in valid_plugin_types


@then(parsers.cfparse(
    "each sections will have {limit:Number} valid plugins",
    extra_types={"Number": int}
))
def verify_section_response_valid(limit, context):
    response = context["response"].json()
    for key, items in response.items():
        plugins = items["plugins"]
        assert len(plugins) == limit, f"{key} has fewer than expected plugins"
        for plugin_data in plugins:
            assert set(plugin_data.keys()).issubset(default_plugin_keys)


@then(parsers.parse("the {section_name} section is sorted by {sort_key} field"))
def verify_section_sort_is_valid(section_name, sort_key, context):
    response = context["response"].json()
    section = response[section_name]
    sort_fields = [item.get(sort_key) for item in section["plugins"]]
    assert sort_fields == sorted(sort_fields, reverse=True)
