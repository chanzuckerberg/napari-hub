from _pytest.fixtures import fixture
from pytest_bdd import then, parsers
import json


@fixture
def context():
    return {}


@then(parsers.parse('response status is {status_code}'))
def verify_response_status_code(status_code, context):
    actual = context['response'].status_code
    assert int(status_code) == actual, f'status code of {actual} was not expected'


@then(parsers.parse('it will have empty map as response'))
def verify_empty_map_response_with_status_code(context):
    response = context['response'].json()
    assert response == {}, f'actual response {json.dumps(response)}'


@then('it will have empty list as response')
def verify_empty_list_response_with_status_code(context):
    response = context['response'].json()
    assert response == [], f'actual response {json.dumps(response)}'

