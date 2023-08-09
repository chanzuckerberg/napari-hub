from typing import Any, Dict

from pytest_bdd import scenarios, then, parsers

default_plugin_keys = {
    "authors", "display_name", "first_released", "name", "release_date",
    "summary", "total_installs"
}
valid_plugin_types = {"reader", "sample_data", "widget", "writer"}

scenarios("homepage_plugins.feature")


@then(parsers.cfparse("it will have only the {sections} sections"))
def verify_sections_are_valid(sections: str, context: Dict[str, Any]) -> None:
    response = context["response"].json()
    sections_list = set(sections.split(","))
    assert response.keys() == sections_list


@then("it will have valid type for plugin_types")
def verify_plugin_types_valid(context: Dict[str, Any]) -> None:
    response = context["response"].json()
    assert response.get("plugin_types").get("type") in valid_plugin_types


@then(parsers.cfparse("each sections will have {limit:d} valid plugins"))
def verify_section_response_valid(limit: int, context: Dict[str, Any]) -> None:
    response = context["response"].json()
    for key, items in response.items():
        plugins = items["plugins"]
        assert len(plugins) == limit, f"{key} has fewer than expected plugins"
        for plugin_data in plugins:
            assert set(plugin_data.keys()).issubset(default_plugin_keys)


@then(parsers.cfparse("the {section_name} section is sorted by {sort_key} field"))
def verify_section_sort_is_valid(
        section_name: str, sort_key: str, context: Dict[str, Any]
) -> None:
    response = context["response"].json()
    section = response[section_name]
    sort_fields = [item.get(sort_key) for item in section["plugins"]]
    assert sort_fields == sorted(sort_fields, reverse=True)
