from unittest.mock import Mock, call

import pytest


from plugin import metadata, categories
from plugin.metadata import get_formatted_metadata
from plugin.tests.utils import category_responses

PLUGIN = "napari-demo"
VERSION = "0.0.2"
GITHUB_REPO = "https://github.com/chanzuckerberg/napari-demo"
DESCRIPTION = "description from plugin"
RENDERED_DESCRIPTION = "rendered-bsoup-description"
ONTOLOGY = "EDAM-BIOIMAGING:alpha06"


def category_terms():
    return ["Img reg", "2D image", "Affine reg", "Foo"]


class TestMetadata:
    @pytest.fixture
    def expected(self) -> dict:
        return {
            "author": "napari hub team",
            "code_repository": GITHUB_REPO,
            "name": "Napari Demo",
            "visibility": "public",
            "description": DESCRIPTION,
            "description_text": RENDERED_DESCRIPTION,
            "category": {
                "Data": [
                    "2D",
                ],
                "Wrkflw": [
                    "Img reg1",
                    "Img reg2",
                ],
            },
            "category_hierarchy": {
                "Data": [
                    ["2D"],
                ],
                "Wrkflw": [
                    ["Img reg1"],
                    ["Img reg2", "Affine reg"],
                ],
            },
        }

    @pytest.fixture
    def github_metadata(self) -> dict:
        return {
            "name": "Napari Demo",
            "visibility": "public",
            "description": DESCRIPTION,
            "labels": {"ontology": ONTOLOGY, "terms": category_terms()},
        }

    @pytest.fixture
    def pypi_metadata(self) -> dict:
        return {
            "author": "napari hub team",
            "code_repository": GITHUB_REPO,
            "name": "napari-demo",
        }

    @pytest.fixture(autouse=True)
    def setup(self, monkeypatch) -> None:
        self._mock_pypi_data = Mock(
            side_effect=self._get_pypi_response, spec=metadata.get_plugin_pypi_metadata
        )
        monkeypatch.setattr(metadata, "get_plugin_pypi_metadata", self._mock_pypi_data)
        self._mock_github_data = Mock(
            side_effect=self._get_github_response, spec=metadata.get_github_metadata
        )
        monkeypatch.setattr(metadata, "get_github_metadata", self._mock_github_data)
        self._mock_render_desc = Mock(
            return_value=RENDERED_DESCRIPTION, spec=metadata.render_description
        )
        monkeypatch.setattr(metadata, "render_description", self._mock_render_desc)
        self._mock_get_category = Mock(
            side_effect=category_responses(), spec=categories.get_category
        )
        monkeypatch.setattr(categories, "get_category", self._mock_get_category)

    @pytest.fixture
    def verify_calls(self, verify_call):
        def _verify_calls(
            github_metadata_called: bool = False,
            render_desc_called: bool = False,
            get_category_called: bool = False,
        ) -> None:
            verify_call(True, self._mock_pypi_data, [call(PLUGIN, VERSION)])
            verify_call(
                github_metadata_called, self._mock_github_data, [call(GITHUB_REPO)]
            )
            verify_call(render_desc_called, self._mock_render_desc, [call(DESCRIPTION)])

            category_calls = [call(term, ONTOLOGY) for term in category_terms()]
            verify_call(get_category_called, self._mock_get_category, category_calls)

        return _verify_calls

    def test_get_metadata_none_from_pypi(self, verify_calls) -> None:
        self._plugin_pypi_metadata_response = {}
        actual = get_formatted_metadata(PLUGIN, VERSION)

        assert actual is None
        verify_calls()

    def test_get_metadata_none_code_repository_from_pypi(
        self, pypi_metadata: dict, verify_calls
    ) -> None:
        self._plugin_pypi_metadata_response = pypi_metadata
        pypi_metadata["code_repository"] = None

        actual = get_formatted_metadata(PLUGIN, VERSION)

        assert actual == self._plugin_pypi_metadata_response
        verify_calls()

    def test_get_metadata_non_github_code_repository_from_pypi(
        self, pypi_metadata: dict, verify_calls
    ) -> None:
        self._plugin_pypi_metadata_response = pypi_metadata
        pypi_metadata["code_repository"] = "https://bb.com/czi/napari-demo"

        actual = get_formatted_metadata(PLUGIN, VERSION)

        assert actual == self._plugin_pypi_metadata_response
        verify_calls()

    def test_get_metadata_valid_code_repository_from_pypi(
        self, github_metadata: dict, pypi_metadata: dict, expected: dict, verify_calls
    ) -> None:
        del github_metadata["description"]
        del github_metadata["labels"]
        self._plugin_pypi_metadata_response = pypi_metadata
        self._github_metadata_response = github_metadata

        actual = get_formatted_metadata(PLUGIN, VERSION)

        del expected["description"]
        del expected["description_text"]
        del expected["category"]
        del expected["category_hierarchy"]
        assert actual == expected
        verify_calls(github_metadata_called=True)

    def test_get_metadata_when_labels_has_no_ontology(
        self, github_metadata: dict, pypi_metadata: dict, expected: dict, verify_calls
    ) -> None:
        del github_metadata["description"]
        del github_metadata["labels"]["ontology"]
        self._plugin_pypi_metadata_response = pypi_metadata
        self._github_metadata_response = github_metadata

        actual = get_formatted_metadata(PLUGIN, VERSION)

        del expected["description"]
        del expected["description_text"]
        del expected["category"]
        del expected["category_hierarchy"]
        assert actual == expected
        verify_calls(github_metadata_called=True)

    def test_get_metadata_with_description(
        self, github_metadata: dict, pypi_metadata: dict, expected: dict, verify_calls
    ) -> None:
        self._plugin_pypi_metadata_response = pypi_metadata
        self._github_metadata_response = github_metadata
        del github_metadata["labels"]

        actual = get_formatted_metadata(PLUGIN, VERSION)

        del expected["category"]
        del expected["category_hierarchy"]
        assert actual == expected
        verify_calls(github_metadata_called=True, render_desc_called=True)

    def test_get_metadata_with_labels(
        self, github_metadata: dict, pypi_metadata: dict, expected: dict, verify_calls
    ) -> None:
        self._plugin_pypi_metadata_response = pypi_metadata
        self._github_metadata_response = github_metadata
        del github_metadata["description"]

        actual = get_formatted_metadata(PLUGIN, VERSION)

        del expected["description"]
        del expected["description_text"]
        assert actual == expected
        verify_calls(github_metadata_called=True, get_category_called=True)

    def test_get_metadata_with_description_and_labels(
        self, github_metadata: dict, pypi_metadata: dict, expected: dict, verify_calls
    ) -> None:
        self._plugin_pypi_metadata_response = pypi_metadata
        self._github_metadata_response = github_metadata

        actual = get_formatted_metadata(PLUGIN, VERSION)

        assert actual == expected
        verify_calls(
            github_metadata_called=True,
            render_desc_called=True,
            get_category_called=True,
        )

    def _get_pypi_response(self, _, __) -> dict:
        return self._plugin_pypi_metadata_response

    def _get_github_response(self, _) -> dict:
        return self._github_metadata_response
