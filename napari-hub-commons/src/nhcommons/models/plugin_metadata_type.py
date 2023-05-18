from enum import Enum


class PluginMetadataType(Enum):

    def __new__(cls):
        return object.__new__(cls)

    PYPI = ()
    SOURCE_CONTROL = ()
    DISTRIBUTION = ()

    def to_version_type(self, version):
        return f"{version}:{self.name}"
