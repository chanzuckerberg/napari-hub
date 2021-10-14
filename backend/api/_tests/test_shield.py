import unittest
from unittest.mock import patch

from .. import model


@patch.object(
    model, 'get_valid_plugins', return_value={"package1": "0.0.1"}
)
class TestShield(unittest.TestCase):

    def test_get_shield(self, mock_get_valid_plugins):
        from ..shield import get_shield
        result = get_shield('package1')
        assert result['message'] == 'package1'
        assert 'label' in result
        assert 'schemaVersion' in result
        assert 'color' in result

    def test_get_shield_for_non_plugin(self, mock_get_valid_plugins):
        from ..shield import get_shield
        result = get_shield('not-a-package')
        assert result['message'] == 'plugin not found'
        assert 'label' in result
        assert 'schemaVersion' in result
        assert 'color' in result
