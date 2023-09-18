from typing import Any, Optional

import pytest

from plugin.manifest import get_formatted_manifest


def generate_contributions(reader: bool = False,
                           theme: bool = False,
                           sample_data: bool = False,
                           widget: bool = False,
                           writer: bool = False) -> dict[str, Any]:
    contribution = {}
    if reader:
        contribution["readers"] = [
            {"filename_patterns": ["*.npy"]},
            {"filename_patterns": ["*.tiff", "*.npy"]},
        ]
    if sample_data:
        contribution["sample_data"] = [{"key": "unique_id.1"}]
    if theme:
        contribution["themes"] = [{"colors": {}}]
    if widget:
        contribution["widgets"] = [{"autogenerate": False}]
    if writer:
        contribution["writers"] = [
            {
                "filename_extensions": [".npy"],
                "layer_types": [
                    "shapes{1,3}", "image", "labels", "faketype", "points+"
                ]
            },
            {
                "filename_extensions": [".tif"],
                "layer_types": ["surface*", "vectors*", "tracks*"]
            },
        ]

    return contribution


class TestManifest:

    @pytest.fixture
    def default_result(self) -> dict[str, Any]:
        return {
            "display_name": "",
            "plugin_types": [],
            "reader_file_extensions": [],
            "writer_file_extensions": [],
            "writer_save_layers": [],
            "category": {},
            "category_hierarchy": {}
        }

    @pytest.mark.parametrize("input, result", [
        (None, {}),
        ({}, {}),
        ({"error": "some error"}, {}),
        ({"npe1_shim": True}, {"npe2": False}),
        ({"npe1_shim": False}, {"npe2": True}),
        ({"display_name": "foo"}, {"display_name": "foo", "npe2": True}),
        ({"categories": ['not-mapped']}, {"category": {}, "category_hierarchy": {}, "npe2": True}),
        ({"categories": ['Segmentation', 'other']}, {"category": {"Workflow step": ['Image segmentation']}, "category_hierarchy": {"Workflow step": [["Image segmentation"]]}, 'npe2': True}),
        ({"contributions": generate_contributions(reader=True)},
         {"npe2": True,
          "plugin_types": ["reader"],
          "reader_file_extensions": ["*.tiff", "*.npy"]
          }
         ),
        ({"contributions": generate_contributions(sample_data=True, theme=True, widget=True)},
         {"npe2": True, "plugin_types": ["theme", "widget", "sample_data"]}),
        ({"contributions": generate_contributions(writer=True)},
         {"npe2": True,
          "plugin_types": ["writer"],
          "writer_file_extensions": [".npy", ".tif"],
          "writer_save_layers": ["image", "labels", "points", "shapes",
                                 "surface", "tracks", "vectors"]
          }
         ),
    ])
    def test_manifest_parse(self,
                            default_result: dict[str, Any],
                            input: Optional[dict[str, Any]],
                            result: dict[str, Any]):
        expected = {**default_result, **result}
        actual = get_formatted_manifest(input, "foo", "bar")

        for field in {"plugin_types", "reader_file_extensions",
                      "writer_file_extensions", "writer_save_layers"}:
            actual[field] = sorted(actual[field])
            expected[field] = sorted(expected[field])

        assert actual == expected
