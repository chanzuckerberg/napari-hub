from enum import Enum, auto, EnumMeta


class PluginMetadataType(Enum):

    def __new__(cls):
        plugin_meta_data_type = object.__new__(cls)
        plugin_meta_data_type._value_ = auto()
        return plugin_meta_data_type

    DISTRIBUTION = ()
    PYPI = ()
    METADATA = ()

    def to_version_type(self, version: str) -> str:
        return f"{version}:{self.name}"


class PluginVisibilityMeta(EnumMeta):
    def __contains__(cls, item):
        return isinstance(item, cls) or \
               isinstance(item, str) and item.upper() in cls._member_names_


class PluginVisibility(Enum, metaclass=PluginVisibilityMeta):
    def __new__(cls):
        plugin_visibility = object.__new__(cls)
        plugin_visibility._value_ = auto()
        return plugin_visibility

    PUBLIC = ()
    HIDDEN = ()
    DISABLED = ()
    BLOCKED = ()
