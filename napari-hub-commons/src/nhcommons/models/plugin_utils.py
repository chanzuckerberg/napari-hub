from enum import Enum, auto, EnumMeta


class PluginMetadataType(Enum):

    DISTRIBUTION = auto()
    PYPI = auto()
    METADATA = auto()

    def to_version_type(self, version: str) -> str:
        return f"{version}:{self.name}"


class PluginVisibilityMeta(EnumMeta):
    def __contains__(cls, item):
        return isinstance(item, cls) or \
               isinstance(item, str) and item.upper() in cls._member_names_


class PluginVisibility(Enum, metaclass=PluginVisibilityMeta):

    PUBLIC = auto()
    HIDDEN = auto()
    BLOCKED = auto() # what is this field used for?
    INVALID = auto() # What is this field used for?
