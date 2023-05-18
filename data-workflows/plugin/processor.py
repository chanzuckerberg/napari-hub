from nhcommons.utils import pypi_adapter

from nhcommons.models.plugin_metadata import (
    put_pypi_record,
)
from nhcommons.models.plugin import (
    get_all_latest_plugin_by_plugin_name,
)


def update_plugin():
    dynamo_latest_plugins = get_all_latest_plugin_by_plugin_name()
    pypi_latest_plugins = pypi_adapter.get_all_plugins()

    def _is_new_plugin(plugin_version_pair):
        plugin = dynamo_latest_plugins.get(plugin_version_pair[0])
        return not plugin or plugin.version != plugin_version_pair[1]

    new_plugins = dict(filter(_is_new_plugin, pypi_latest_plugins.items()))

    # update for new version of plugins
    for plugin_name, version in new_plugins.items():
        # plugin = dynamo_latest_plugins.get(plugin_name)
        _update_for_new_plugin(plugin_name, version)

    # update for removed plugins and existing older version of plugins
    for name, plugin in dynamo_latest_plugins.items():
        if name not in pypi_latest_plugins or \
                pypi_latest_plugins.get(name) != plugin.version:
            put_pypi_record(
                plugin=name, version=plugin.version, is_latest=False
            )


def _update_for_new_plugin(plugin_name: str, version: str):
    put_pypi_record(plugin=plugin_name, version=version, is_latest=True)
    pass
