import unittest
from unittest.mock import patch

import api.shield as shield


def validate(result, message):
    assert result["message"] == message
    assert "label" in result
    assert "schemaVersion" in result
    assert "color" in result


class TestShield(unittest.TestCase):

    @patch.object(
        shield, "get_valid_plugins", return_value={"package1": "0.0.1"}
    )
    def test_get_shield(self, mock_get_valid_plugins):
        result = shield.get_shield("package1")
        validate(result, "package1")

    @patch.object(
        shield, "get_valid_plugins", return_value={"package1": "0.0.1"}
    )
    def test_get_shield_for_non_plugin(self, mock_get_valid_plugins):
        result = shield.get_shield("not-a-package")
        validate(result, "plugin not found")

    @patch.object(shield, "get_plugin", return_value={"version": "0.0.1"})
    def test_get_shield_use_dynamo(self, mock_get_valid_plugins):
        result = shield.get_shield("package1")
        validate(result, "package1")

    @patch.object(shield, "get_plugin", return_value=None)
    def test_get_shield_for_non_plugin_use_dynamo(self, mock_get_valid_plugins):
        result = shield.get_shield("not-a-package")
        validate(result, "plugin not found")
