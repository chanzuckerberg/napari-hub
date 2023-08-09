from typing import Any, Callable, Dict, Set
import pytest
from pytest_bdd import scenarios, then, parsers

scenarios("category.feature")


@pytest.fixture
def valid_dimensions() -> Set[str]:
    return {"Supported data", "Image modality", "Workflow step"}


@pytest.fixture
def validate_category(
        valid_dimensions: Set[str], valid_str: Callable[[str], bool]
) -> Callable[[Dict[str, Any], str], None]:
    def _validate_category(category: [Dict[str, Any]], name: str) -> None:
        for item in category:
            assert item["dimension"] in valid_dimensions
            assert isinstance(item["hierarchy"], list) and len(item["hierarchy"]) > 0
            assert item["hierarchy"][-1] == name
            assert valid_str(item["label"])
    return _validate_category


@then(parsers.parse("it will have valid category response for {category_name}"))
def verify_plugin_response_valid(
        context: Dict[str, Any],
        category_name: str,
        validate_category: Callable[[Dict[str, Any], str], None]
) -> None:
    validate_category(context["response"].json(), category_name)


@then("it will have valid all categories response")
def verify_plugin_response_valid(
        context: Dict[str, Any],
        validate_category: Callable[[Dict[str, Any], str], None]
) -> None:
    response = context["response"].json()
    assert (
        len(response) > 125
    ), f"count of categories is lesser than expected {len(response)}"
    for name, category in response.items():
        validate_category(category, name)
