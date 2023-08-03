import logging
from typing import List, Dict, Set, Callable, Union

from api.model import get_index
from random import sample
from datetime import datetime

DEFAULT_FIELDS = {
    "authors", "display_name", "first_released", "name", "release_date",
    "summary", "total_installs",
}
PLUGIN_TYPES = ["reader", "sample_data", "widget", "writer"]

logger = logging.getLogger(__name__)


def get_plugin_sections(sections: Set[str], limit: int = 3) -> Dict[str, Dict]:
    response = {}
    plugins_encountered = set()
    if _has_no_valid_sections(sections):
        logger.warning("No processing as there are no valid sections")
        return response

    index = get_index()
    for name, handler in _get_handler_by_section_name().items():
        if name in sections:
            response[name] = handler(index, limit, plugins_encountered)
            logger.info(f"fetched data for {name} section")

    return response


def _filtered(data: Dict) -> Dict:
    return {field: data.get(field) for field in DEFAULT_FIELDS}


def _get_plugin_type() -> str:
    index = int((datetime.now().minute / 5) % 4)
    return PLUGIN_TYPES[index]


def _add_to_exclusions(exclude: Set[str], plugins: List[Dict]) -> None:
    for plugin in plugins:
        exclude.add(plugin.get("name"))


def _get_plugins_by_type(index: List[Dict], limit: int, exclude: Set) -> Dict:
    plugin_type = _get_plugin_type()
    logger.info(f"plugin_type section of type={plugin_type}")
    plugins_of_type = list(
        filter(lambda item: plugin_type in item.get("plugin_types", []), index)
    )
    rand_sample = sample(plugins_of_type, min(limit, len(plugins_of_type)))
    sampled_plugins = [_filtered(plugin) for plugin in rand_sample]
    _add_to_exclusions(exclude, sampled_plugins)
    return {"type": plugin_type, "plugins": sampled_plugins}


def _get_plugins_by_sort(
        index: List[Dict],
        limit: int,
        key: str,
        default_val: Union[str, int],
        exclude: Set[str]
) -> Dict[str, List]:
    index.sort(key=lambda item: item.get(key, default_val))
    upper_limit = min(limit, len(index))
    plugins = []
    while len(plugins) < upper_limit and len(index) > 0:
        plugin = index.pop()
        name = plugin.get("name")
        if name in exclude:
            continue
        exclude.add(name)
        plugins.append(_filtered(plugin))

    return {"plugins": plugins}


def _get_newest_plugins(index: List[Dict], limit: int, exclude: Set) -> Dict:
    return _get_plugins_by_sort(index, limit, "first_released", "", exclude)


def _get_recently_updated_plugins(
        index: List[Dict], limit: int, exclude: Set
) -> Dict:
    return _get_plugins_by_sort(index, limit, "release_date", "", exclude)


def _get_top_installed_plugins(
        index: List[Dict], limit: int, exclude: Set
) -> Dict:
    return _get_plugins_by_sort(index, limit, "total_installs", 0, exclude)


def _get_handler_by_section_name() -> Dict[str, Callable]:
    return {
        "plugin_types": _get_plugins_by_type,
        "newest": _get_newest_plugins,
        "recently_updated": _get_recently_updated_plugins,
        "top_installed": _get_top_installed_plugins,
    }


def _has_no_valid_sections(sections: Set):
    return set(_get_handler_by_section_name().keys()).isdisjoint(sections)
