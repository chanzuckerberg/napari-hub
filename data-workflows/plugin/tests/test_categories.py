import pytest
from unittest.mock import Mock

from plugin.categories import merge_metadata_manifest_categories, process_for_categories
from plugin import categories

ONTOLOGY_VERSION = "EDAM-BIOIMAGING:alpha06"

def category_responses():
    return [
        [{"dimension": "Wrkflw", "hierarchy": ["Img reg"], "label": "Img reg1"}],
        [{"dimension": "Data", "hierarchy": ["2D image"], "label": "2D"}],
        [
            {
                "dimension": "Wrkflw",
                "hierarchy": ["Img reg", "Affine reg"],
                "label": "Img reg2",
            }
        ],
        [],
    ]

def assert_category_matches(categories, expected_category):
    assert sorted(categories.keys()) == sorted(expected_category.keys())
    for key in categories:
        cat_list = categories[key]
        assert sorted(cat_list) == sorted(expected_category[key])

def assert_hierarchy_matches(hierarchy, expected_hierarchy):
    assert sorted(hierarchy.keys()) == sorted(expected_hierarchy.keys())
    for key in hierarchy:
        hierarchy_list = hierarchy[key]
        expected_list = expected_hierarchy[key]
        assert sorted(hierarchy_list) == sorted(expected_list)

class TestCategories:
    @pytest.fixture(autouse=True)
    def setup(self, monkeypatch) -> None:
        self._mock_get_category = Mock(
            side_effect=category_responses(), spec=categories.get_category
        )
        monkeypatch.setattr(categories, "get_category", self._mock_get_category)

    @pytest.mark.parametrize(
            "terms, expected_categories, expected_hierarchy",
            [
                ([], {}, {}),
                (["other", "Img reg1"], {"Wrkflw": ["Img reg1"]}, {"Wrkflw": [["Img reg1"], ]}),
                (["2D", "Img reg2"], {"Wrkflw": ["Img reg2"], "Data": ["2D"]}, {"Wrkflw": [["Img reg", "Affine reg"], ], "Data": [["2D"]]})

            ]
    )
    def test_process_for_categories(terms, expected_categories, expected_hierarchy):
        labels = {
            'terms': terms,
            'ontology': ONTOLOGY_VERSION
        }
        result_categories, result_hierarchy = process_for_categories(labels, ONTOLOGY_VERSION)
        assert_category_matches(result_categories, expected_categories)
        assert_hierarchy_matches(result_hierarchy, expected_hierarchy)

    @pytest.mark.parametrize(
        "meta_category, meta_hierarchy, manifest_category, manifest_hierarchy, expected_category, expected_hierarchy",
        [
            ({}, {}, {}, {}, {}, {}),
            (
                {"Workflow step": ["Image segmentation"]},
                {"Workflow step": [["Image segmentation"]]},
                {},
                {},
                {"Workflow step": ["Image segmentation"]},
                {"Workflow step": [["Image segmentation"]]},
            ),
            (
                {},
                {},
                {"Workflow step": ["Image segmentation"]},
                {"Workflow step": [["Image segmentation"]]},
                {"Workflow step": ["Image segmentation"]},
                {"Workflow step": [["Image segmentation"]]},
            ),
            (
                {"Data": ["2D", "3D"], "Modality": ["HeLa"]},
                {
                    "Data": [
                        [
                            "2D",
                            "3D",
                        ]
                    ],
                    "Modality": [["Fluo", "HeLa"]],
                },
                {"Modality": ["Fluo"]},
                {
                    "Modality": [
                        [
                            "Fluo",
                        ]
                    ]
                },
                # Data and Modality are both there
                {"Data": ["2D", "3D"], "Modality": ["Fluo", "HeLa"]},
                # ["Fluo"] & ["Fluo", "HeLa"] have different leaves & are both there
                {
                    "Data": [
                        [
                            "2D",
                            "3D",
                        ]
                    ],
                    "Modality": [["Fluo"], ["Fluo", "HeLa"]],
                },
            ),
        ],
    )
    def test_category_merge(
        meta_category,
        meta_hierarchy,
        manifest_category,
        manifest_hierarchy,
        expected_category,
        expected_hierarchy,
    ):
        mock_meta = {"category": meta_category, "category_hierarchy": meta_hierarchy}
        mock_manifest = {
            "category": manifest_category,
            "category_hierarchy": manifest_hierarchy,
        }

        meta_result = merge_metadata_manifest_categories(mock_meta, mock_manifest)
        merged_meta = meta_result["category"]
        merged_hierarchy = meta_result["category_hierarchy"]
        assert_category_matches(merged_meta, expected_category)
        assert_hierarchy_matches(merged_hierarchy, expected_hierarchy)

