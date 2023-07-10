from typing import List, Dict, Set, Callable, Union

from api.model import get_index
from random import sample
from datetime import datetime


DEFAULT_FIELDS = {
    "authors", "display_name", "first_released", "name", "release_date",
    "summary", "total_installs",
}
PLUGIN_TYPES = ["reader", "sample_data", "widget", "writer"]


def _filtered(data: Dict) -> Dict:
    return {field: data.get(field) for field in DEFAULT_FIELDS}


def _get_plugin_type() -> str:
    index = int((datetime.now().minute / 5) % 4)
    return PLUGIN_TYPES[index]


def _get_plugins_by_type(index: List[Dict], limit: int) -> Dict:
    plugin_type = _get_plugin_type()

    plugins_of_type = list(
        filter(lambda item: plugin_type in item.get("plugin_types", []), index)
    )
    rand_sample = sample(plugins_of_type, min(limit, len(index)))
    random_sample = [_filtered(plugin) for plugin in rand_sample]
    return {"plugin_types": {"type": plugin_type, "plugins": random_sample}}


def _get_plugins_by_sort(
        index: List[Dict], limit: int, key: str, default_val: Union[str, int]
) -> Dict[str, List]:
    index.sort(key=lambda item: item.get(key, default_val))
    upper_limit = min(limit, len(index))
    return {"plugins": [_filtered(index.pop()) for i in range(0, upper_limit)]}


def _get_newest_plugins(index: List[Dict], limit: int) -> Dict:
    plugins = _get_plugins_by_sort(index, limit, "first_released", "")
    return {"newest": plugins}


def _get_recently_updated_plugins(index: List[Dict], limit: int) -> Dict:
    plugins = _get_plugins_by_sort(index, limit, "release_date", "")
    return {"recently_updated": plugins}


def _get_top_installed_plugins(index: List[Dict], limit: int) -> Dict:
    plugins = _get_plugins_by_sort(index, limit, "total_installs", 0)
    return {"top_install": plugins}


def get_handler_by_section_name() -> Dict[str, Callable]:
    return {
        "plugin_types": _get_plugins_by_type,
        "newest": _get_newest_plugins,
        "recently_updated": _get_recently_updated_plugins,
        "top_install": _get_top_installed_plugins,
    }


def get_plugin_sections(
        sections: Set[str], use_dynamo: bool, limit: int = 3
) -> Dict[str, Dict]:
    response = {}
    index = get_index(use_dynamo)
    for name, handler in get_handler_by_section_name().items():
        if name.lower() in sections:
            response.update(handler(index, limit))
    return response
