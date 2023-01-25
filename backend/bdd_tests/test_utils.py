import requests
import os

BASE_URL_BY_ENV = {
    'staging': 'https://api.staging.napari-hub.org',
    'prod': 'https://api.napari-hub.org'
}

prefix = os.getenv('PREFIX')
base_url = BASE_URL_BY_ENV.get(prefix, f'https://api.dev.napari-hub.org/{prefix}')
headers = {'User-Agent': 'bdd-test'}


def verify_response_status_code(context, status_code):
    actual = context['response'].status_code
    assert int(status_code) == actual, f'status code of {actual} was not expected'


def call_api(context, endpoint):
    url = f'{base_url}{endpoint}'
    context['response'] = requests.get(url, headers=headers)


def valid_str(value):
    return value and value.strip()
