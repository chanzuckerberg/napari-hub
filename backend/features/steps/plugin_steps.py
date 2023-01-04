import json
from behave import given, then
from util_steps import valid_str

required_plugin_keys = {'authors', 'description_content_type', 'description_text', 'development_status',
                        'display_name', 'first_released', 'license', 'name', 'operating_system', 'plugin_types',
                        'python_version', 'reader_file_extensions', 'release_date', 'summary', 'version',
                        'writer_file_extensions', 'writer_save_layers'}
required_public_plugin_keys = {'display_name', 'plugin_types', 'reader_file_extensions', 'writer_file_extensions',
                               'writer_save_layers'}


@given('we call plugins api for {plugin_name} version {version}')
def call_plugin_with_version(context, plugin_name, version):
    context.execute_steps(f'given we call api /plugins/{plugin_name}/versions/{version}')


@given('we call plugins api for {plugin_name}')
def call_plugin(context, plugin_name):
    context.execute_steps(f'given we call api /plugins/{plugin_name}')


@given('we call plugins index api')
def call_plugins_index(context):
    context.execute_steps(f'given we call api /plugins/index')


@given('we call plugins api')
def call_plugins(context):
    context.execute_steps(f'given we call api /plugins')


@given('we call excluded plugins api')
def call_excluded_plugins(context):
    context.execute_steps(f'given we call api /plugins/excluded')


def _validate_plugin(plugin_data, required_keys):
    assert plugin_data != {}, f'actual response {json.dumps(plugin_data)}'
    plugin_name = plugin_data['display_name'] if valid_str(plugin_data['display_name']) else plugin_data['name']
    assert valid_str(plugin_name), f'No name available for plugin {plugin_data}'

    for key in required_keys:
        assert key in plugin_data, f'key: {key} not in response for plugin {plugin_name}'


@then('it will have valid plugin response')
def verify_plugin_response_valid(context):
    context.execute_steps('then response status is 200')
    response = context.response.json()
    _validate_plugin(response, required_plugin_keys)


@then('it should have public plugins defaults')
def verify_public_plugins_defaults(context):
    context.execute_steps('then response status is 200')
    response = context.response.json()
    assert len(response) > 250, f'count of public plugins is lesser than expected {len(response)}'


@then('it will fetch all public plugins')
def verify_public_plugins_detailed(context):
    context.execute_steps('then it should have public plugins defaults')
    response = context.response.json()
    for plugin in response:
        _validate_plugin(plugin, required_public_plugin_keys)


@then('it will have only return plugins with excluded type')
def verify_excluded_plugin_response(context):
    context.execute_steps('then response status is 200')
    response = context.response.json()
    for key, val in response.items():
        assert val in {'blocked', 'disabled', 'hidden', 'invalid'}, f'{key} has unknown exclusion type {val}'
