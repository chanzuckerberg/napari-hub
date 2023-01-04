from behave import given, then
from util_steps import valid_str


@given('we call categories api')
def call_category_without_version(context):
    context.execute_steps(f'given we call api /categories')


@given('we call categories api for {category} with version {version}')
def call_category_with_version(context, category, version):
    context.category_name = category
    context.execute_steps(f'given we call api /categories/{category}/versions/{version}')


@given('we call categories api for {category}')
def call_category_without_version(context, category):
    context.category_name = category
    context.execute_steps(f'given we call api /categories/{category}')


def _validate_category(category, name):
    for item in category:
        assert item['dimension'] in {'Supported data', 'Image modality', 'Workflow step'}
        assert isinstance(item['hierarchy'], list) and len(item['hierarchy']) > 0
        assert item['hierarchy'][-1] == name
        assert valid_str(item['label'])


@then('it will have valid category response')
def verify_plugin_response_valid(context):
    context.execute_steps('then response status is 200')
    response = context.response.json()
    _validate_category(response, context.category_name)


@then('it will have valid all categories response')
def verify_plugin_response_valid(context):
    context.execute_steps('then response status is 200')
    response = context.response.json()
    assert len(response) > 125, f'count of categories is lesser than expected {len(response)}'
    for name, category in response.items():
        _validate_category(category, name)
