from behave import given, then
import requests
import json
import os

prefix = os.getenv('PREFIX')
base_url = f'https://api.dev.napari-hub.org/{prefix}' if prefix else 'https://api.staging.napari-hub.org'
headers = {'User-Agent': 'behave-test'}


@given('we call api {endpoint}')
def call_api_and_set_response(context, endpoint):
    url = f'{base_url}{endpoint}'
    context.response = requests.get(url, headers=headers)


@then('response status is {status_code}')
def verify_response_status_code(context, status_code):
    actual = context.response.status_code
    assert int(status_code) == actual, f'status code of {actual} was not expected'


@then('it will have empty map response with status {status_code}')
def verify_empty_response_with_status_code(context, status_code):
    context.execute_steps(f'then response status is {status_code}')
    response = context.response.json()
    assert response == {}, f'actual response {json.dumps(response)}'


@then('it will have empty list response with status {status_code}')
def verify_empty_response_with_status_code(context, status_code):
    context.execute_steps(f'then response status is {status_code}')
    response = context.response.json()
    assert response == [], f'actual response {json.dumps(response)}'


def valid_str(value):
    return value and value.strip()
