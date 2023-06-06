import random

import pytest
from moto import mock_dynamodb

from nhcommons.models import category


class TestCategory:

    @pytest.fixture()
    def category_table(self, create_dynamo_table):
        with mock_dynamodb():
            yield create_dynamo_table(category._Category, 'category')

    @pytest.fixture()
    def input(self):
        return [
            {
                "name": "confocal-fluorescence-microscopy",
                "formatted_name": "Confocal Fluorescence Microscopy",
                "dimension": "Image modality",
                "hierarchy": [
                    "Fluorescence microscopy",
                    "Confocal fluorescence microscopy"
                ],
                "label": "Fluorescence microscopy",
                "version": "EDAM-BIOIMAGING:alpha06"
            },
            {
                "name": "confocal-fluorescence-microscopy",
                "formatted_name": "Confocal Fluorescence Microscopy",
                "dimension": "Image modality",
                "hierarchy": [
                    "Confocal microscopy",
                    "Confocal fluorescence microscopy"
                ],
                "label": "Confocal microscopy",
                "version": "EDAM-BIOIMAGING:alpha06"
            },
            {
                "name": "closing",
                "formatted_name": "Closing",
                "dimension": "Workflow step",
                "hierarchy": ["Morphological operation", "Closing"],
                "label": "Morphological operations",
                "version": "EDAM-BIOIMAGING:alpha07"
            }
        ]

    @pytest.mark.parametrize(
        'plugin, version, expected', [
            ("Abalation", "EDAM-BIOIMAGING:alpha06", []),
            ("Closing", "EDAM-BIOIMAGING:alpha06", []),
            ("Closing", "EDAM-BIOIMAGING:alpha07", [{
                "label": "Morphological operations",
                "dimension": "Workflow step",
                "hierarchy": ["Morphological operation", "Closing"]
            }]),
            ("Confocal Fluorescence Microscopy", "EDAM-BIOIMAGING:alpha06", [
                {
                    "dimension": "Image modality",
                    "hierarchy": ["Confocal microscopy", "Confocal fluorescence microscopy"],
                    "label": "Confocal microscopy"
                },
                {
                    "dimension": "Image modality",
                    "hierarchy": ["Fluorescence microscopy", "Confocal fluorescence microscopy"],
                    "label": "Fluorescence microscopy"
                }
            ]),
        ]
    )
    def test_get_category(self, category_table, input, plugin, version, expected):
        for data in input:
            category_table.put_item(Item={
                'name': data["name"],
                'version_hash': f'{data["version"]}:{random.random()}',
                'version': data["version"],
                'formatted_name': data["formatted_name"],
                'dimension': data["dimension"],
                'hierarchy':data["hierarchy"],
                'label': data["label"]
            })

        assert (
            sorted(category.get_category(plugin, version), key=lambda x: x["label"])
            == sorted(expected, key=lambda x: x["label"])
        )
