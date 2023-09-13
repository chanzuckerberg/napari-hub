from typing import Any, Dict
from nhcommons.models import plugin as plugin_model
from nhcommons.models.plugin_utils import PluginVisibility


def get_plugin(name: str, version: str = None) -> Dict[str, Any]:
    visibilities = {PluginVisibility.PUBLIC, PluginVisibility.HIDDEN}
    if version:
        return plugin_model.get_plugin_by_version(name, version, visibilities)
    else:
        return plugin_model.get_latest_plugin(name, visibilities)
