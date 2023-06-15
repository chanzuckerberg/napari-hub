from pynamodb.attributes import UnicodeAttribute

from nhcommons.models.helper import set_ddb_metadata, PynamoWrapper


@set_ddb_metadata('plugin-blocked')
class _PluginBlocked(PynamoWrapper):
    class Meta:
        pass

    name = UnicodeAttribute(hash_key=True)


def get_all_blocked_plugins() -> set[str]:
    return {plugin for plugin in _PluginBlocked.scan()}
