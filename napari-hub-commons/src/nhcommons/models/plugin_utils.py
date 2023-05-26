from enum import Enum, auto


class PluginMetadataType(Enum):

    def __new__(cls):
        plugin_meta_data_type = object.__new__(cls)
        plugin_meta_data_type._value_ = auto()
        return plugin_meta_data_type

    DISTRIBUTION = ()
    PYPI = ()
    SOURCE_CONTROL = ()

    def to_version_type(self, version: str) -> str:
        return f"{version}:{self.name}"
