from unittest.mock import Mock


class TestCategory:
    def test_get_category_has_result(self, monkeypatch):
        mock_category = Mock(
            return_value=[
                Mock(label="label1", dimension="dimension1", hierarchy=["hierarchy1"]),
                Mock(
                    label="label2",
                    dimension="dimension2",
                    hierarchy=["hierarchy1", "hierarchy2"],
                ),
            ]
        )

        from api.models.category import CategoryModel

        monkeypatch.setattr(CategoryModel, "query", mock_category)
        actual = CategoryModel.get_category("name", "version")
        expected = [
            {
                "label": "label1",
                "dimension": "dimension1",
                "hierarchy": ["hierarchy1"],
            },
            {
                "label": "label2",
                "dimension": "dimension2",
                "hierarchy": ["hierarchy1", "hierarchy2"],
            },
        ]

        assert actual == expected

    def test_get_all_categories(self, monkeypatch):
        mock_category = Mock(
            return_value=[
                Mock(
                    formatted_name="name1",
                    version="version",
                    label="label1",
                    dimension="dimension1",
                    hierarchy=["hierarchy1"],
                ),
                Mock(
                    formatted_name="name1",
                    version="version",
                    label="label2",
                    dimension="dimension2",
                    hierarchy=["hierarchy1", "hierarchy2"],
                ),
                Mock(
                    formatted_name="name2",
                    version="version",
                    label="label3",
                    dimension="dimension3",
                    hierarchy=["hierarchy3"],
                ),
            ]
        )

        from api.models.category import CategoryModel

        monkeypatch.setattr(CategoryModel, "scan", mock_category)
        actual = CategoryModel.get_all_categories("version")

        expected = {
            "name1": [
                {
                    "label": "label1",
                    "dimension": "dimension1",
                    "hierarchy": ["hierarchy1"],
                },
                {
                    "label": "label2",
                    "dimension": "dimension2",
                    "hierarchy": ["hierarchy1", "hierarchy2"],
                },
            ],
            "name2": [
                {
                    "label": "label3",
                    "dimension": "dimension3",
                    "hierarchy": ["hierarchy3"],
                }
            ],
        }

        assert actual == expected
