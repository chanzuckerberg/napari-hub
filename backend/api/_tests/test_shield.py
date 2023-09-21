from api import model, shield


def validate(result, message):
    assert result["message"] == message
    assert "label" in result
    assert "schemaVersion" in result
    assert "color" in result


class TestShield:

    def test_get_shield_valid_plugin(self, monkeypatch):
        monkeypatch.setattr(model, "get_plugin", lambda _: {"version": "0.0.1"})
        result = shield.get_shield("package1")
        validate(result, "package1")

    def test_get_shield_for_non_plugin(self, monkeypatch):
        monkeypatch.setattr(model, "get_plugin", lambda _: None)
        result = shield.get_shield("not-a-package")
        validate(result, "plugin not found")
