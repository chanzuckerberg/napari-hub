import requests
import yaml

from api.model import get_plugin

COLLECTIONS_URL = "https://api.github.com/repos/chanzuckerberg/napari-hub-collections/contents/collections"
IMAGES_BASE_URL = "https://raw.githubusercontent.com/chanzuckerberg/napari-hub-collections/main/images/"


def get_collections():
    resp = requests.get(COLLECTIONS_URL)
    collections = []
    contents = list(resp.json())
    for item in contents:
        slug = item.get("name").replace(".yml", "")
        data = get_collection(slug, index_page=True)
        if data:
            collections.append(data)
    return collections


def get_collection(slug, index_page=False):
    collection_url = "https://raw.githubusercontent.com/chanzuckerberg/napari-hub-collections/main/collections/{slug}.yml".format(slug=slug)
    resp = requests.get(collection_url)
    if resp.status_code == 404:
        return None
    data = yaml.safe_load(resp.text)
    collection_visibility = data.get("visibility", "public")
    if collection_visibility == "disabled":
        return None
    data["cover_image"] = IMAGES_BASE_URL + data.get("cover_image")
    if index_page:
        # Returning a subset of collection data for /collections
        if collection_visibility == "public":
            # Only include collections that are set to public
            return {
                "title": data.get("title"),
                "summary": data.get("summary"),
                "cover_image": data.get("cover_image"),
                "curator": data.get("curator"),
                "symbol": slug
            }
        return None
    else:
        # Returning full collection data for /collections/{collection}
        plugins = []
        for collection_plugin in data["plugins"]:
            plugin_name = collection_plugin["name"]
            plugin = get_plugin(plugin_name)
            if plugin:
                plugin_visibility = plugin.get("visibility")
                if plugin_visibility == "public":
                    # Only include plugins that are set to public
                    collection_plugin["summary"] = plugin.get("summary")
                    collection_plugin["authors"] = plugin.get("authors")
                    collection_plugin["display_name"] = plugin.get("display_name")
                    plugins.append(collection_plugin)
        data["plugins"] = plugins
        return data
