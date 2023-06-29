import json

from pytest_bdd import given, scenarios, then, parsers
from test_utils import call_api, valid_str

required_plugin_keys = {
    'authors', 'description_content_type', 'description_text',
    'development_status', 'display_name', 'first_released', 'license', 'name',
    'operating_system', 'plugin_types', 'python_version',
    'reader_file_extensions', 'release_date', 'summary', 'version',
    'writer_file_extensions', 'writer_save_layers'
}
required_public_plugin_keys = {
    'display_name', 'plugin_types', 'reader_file_extensions',
    'writer_file_extensions', 'writer_save_layers'
}


scenarios('plugin.feature')


@given(parsers.parse('we call plugins api for {name} version {version}'))
def call_plugin_with_version(name, version, context):
    call_api(context, f'/plugins/{name}/versions/{version}')


@given(parsers.parse(
    'we call plugins api for {name} version {version} with {query_param}'
))
def call_plugin_with_version_and_query_param(
        name, version, query_param, context
):
    url = f'/plugins/{name}/versions/{version}?{query_param}'
    call_api(context, url)


@given(parsers.parse('we call plugins api for {name} without version'))
def call_plugin(name, context):
    call_api(context, f'/plugins/{name}')


@given(parsers.parse(
    'we call plugins api for {name} without version with {query_param}'
))
def call_plugin_with_query_param(name, query_param, context):
    call_api(context, f'/plugins/{name}?{query_param}')


@given('we call plugins index api')
def call_plugins_index(context):
    call_api(context, f'/plugins/index')


@given(parsers.parse('we call plugins index api with {query_param}'))
def call_plugins_index_with_query_param(query_param, context):
    call_api(context, f'/plugins/index?{query_param}')


@given('we call plugins api')
def call_plugins(context):
    call_api(context, f'/plugins')


@given(parsers.parse('we call plugins api with {query_param}'))
def call_plugins_with_query_param(query_param, context):
    call_api(context, f'/plugins?{query_param}')


@given('we call excluded plugins api')
def call_excluded_plugins(context):
    call_api(context, f'/plugins/excluded')


@given(parsers.parse('we call excluded plugins api with {query_param}'))
def call_excluded_plugins_with_query_param(query_param, context):
    call_api(context, f'/plugins/excluded?{query_param}')


def _validate_plugin(plugin_data, required_keys):
    assert plugin_data != {}, f'actual response {json.dumps(plugin_data)}'
    if valid_str(plugin_data['display_name']):
        plugin_name = plugin_data['display_name']
    else:
        plugin_name = plugin_data['name']
    assert valid_str(plugin_name), f'No name available for plugin {plugin_data}'

    for key in required_keys:
        assert key in plugin_data, \
            f'key: {key} not in response for plugin {plugin_name}'


@then('it will have valid plugin response')
def verify_plugin_response_valid(context):
    response = context['response'].json()
    _validate_plugin(response, required_plugin_keys)


@then('it should have public plugins defaults')
def verify_public_plugins_defaults(context):
    response = context['response'].json()
    assert len(response) > 250, \
        f'count of public plugins is lesser than expected {len(response)}'


@then('it will fetch all public plugins')
def verify_public_plugins_detailed(context):
    response = context['response'].json()
    for plugin in response:
        _validate_plugin(plugin, required_public_plugin_keys)


@then('it will have only return plugins with excluded type')
def verify_excluded_plugin_response(context):
    response = context['response'].json()
    for key, val in response.items():
        assert val.lower() in {'blocked', 'disabled', 'hidden', 'invalid'}, \
            f'{key} has unknown exclusion type {val}'
