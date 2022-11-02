import yaml

from api.model import get_plugin
from utils.github import get_file

COLLECTIONS_CONTENTS = "https://api.github.com/repos/chanzuckerberg/napari-hub-collections/contents/collections"
COLLECTIONS_REPO = "https://github.com/chanzuckerberg/napari-hub-collections"
IMAGES_BASE_URL = "https://raw.githubusercontent.com/chanzuckerberg/napari-hub-collections/main/images/"


def get_collections():
    json_file = get_file(download_url=COLLECTIONS_CONTENTS, file_format="json")
    if not json_file:
        return None
    collections = []
    for item in json_file:
        slug = item.get("name").replace(".yml", "")
        data = get_collection_preview(slug)
        if data:
            collections.append(data)
    return collections


def get_yaml_data(slug, visibility_requirements):
    """Return collection's yaml data if it meets visibility requirements."""
    filename = "collections/{slug}.yml".format(slug=slug)
    yaml_file = get_file(download_url=COLLECTIONS_REPO, file=filename, branch="main")
    if yaml_file:
        data = yaml.safe_load(yaml_file)
        if data and data.get("visibility", "public") in visibility_requirements:
            data["cover_image"] = IMAGES_BASE_URL + data.get("cover_image")
            return data
    return None


def get_collection_preview(slug):
    """Return a subset of collection data for /collections."""
    data = get_yaml_data(slug=slug, visibility_requirements=["public"])
    if not data:
        return None
    return {
        "title": data.get("title"),
        "summary": data.get("summary"),
        "cover_image": data.get("cover_image"),
        "curator": data.get("curator"),
        "symbol": slug,
    }


def get_collection(slug):
    """Return full collection data for /collections/{collection}."""
    data = get_yaml_data(slug=slug, visibility_requirements=["public", "hidden"])
    if not data:
        return None
    # Get plugin-specific data
    plugins = get_plugin_data(data["plugins"])
    data["plugins"] = list(plugins)
    return data


def get_plugin_data(collection_plugins):
    """Return plugin-specific data for each plugin specified in a collection."""
    for collection_plugin in collection_plugins:
        plugin_name = collection_plugin["name"]
        plugin = get_plugin(plugin_name)
        # Only include plugins that are set to public
        if plugin and plugin.get("visibility", "public") == "public":
            collection_plugin["summary"] = plugin.get("summary", "")
            collection_plugin["authors"] = plugin.get("authors", [])
            collection_plugin["display_name"] = plugin.get("display_name", "")
            yield collection_plugin
