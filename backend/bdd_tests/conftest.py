import os
from typing import Any, Callable, Dict

import requests
from _pytest.fixtures import fixture
from pytest_bdd import then, parsers, given
import json


@fixture
def base_url() -> str:
    base_url_by_env = {
        "staging": "https://api.staging.napari-hub.org",
        "prod": "https://api.napari-hub.org",
    }
    prefix = os.getenv("PREFIX")
    if prefix in base_url_by_env:
        return base_url_by_env.get(prefix)
    elif not prefix:
        return f'http://localhost:{os.getenv("PORT", "12345")}'

    return f"https://api.dev.napari-hub.org/{prefix}"


@fixture
def context() -> Dict[str, Any]:
    return {}


@fixture
def headers() -> Dict[str, str]:
    return {"User-Agent": "bdd-test"}


@fixture
def valid_str() -> Callable[[str], bool]:
    return lambda value: value and value.strip()


@given(parsers.cfparse("we call {endpoint} api"))
def call_plugins_index(
    context: Dict[str, Any], base_url: str, headers: Dict[str, str], endpoint: str
) -> None:
    context["response"] = requests.get(f"{base_url}{endpoint}", headers=headers)


@then(parsers.cfparse("response status is {status_code:d}"))
def verify_response_status_code(status_code: int, context: Dict[str, Any]) -> None:
    actual = context["response"].status_code
    assert status_code == actual, f"status code of {actual} was not expected"


@then(parsers.parse("it will have empty map as response"))
def verify_empty_map_response_with_status_code(context: Dict[str, Any]) -> None:
    response = context["response"].json()
    assert response == {}, f"actual response {json.dumps(response)}"


@then("it will have empty list as response")
def verify_empty_list_response_with_status_code(context: Dict[str, Any]) -> None:
    response = context["response"].json()
    assert response == [], f"actual response {json.dumps(response)}"
