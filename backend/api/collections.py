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
        print(item)
        slug = item.get("name").replace(".yml", "")
        data = get_collection(slug, subset=True)
        collections.append(data)
    return collections


def get_collection(slug, subset=False):
    collection_url = "https://raw.githubusercontent.com/chanzuckerberg/napari-hub-collections/main/collections/{slug}.yml".format(slug=slug)
    yaml_data = requests.get(collection_url).text
    data = yaml.safe_load(yaml_data)
    data["cover_image"] = IMAGES_BASE_URL + data.get("cover_image")
    if subset:
        return {
            "title": data.get("title"),
            "summary": data.get("summary"),
            "cover_image": data.get("cover_image"),
            "curator": data.get("curator"),
            "symbol": slug
        }
    for collection_plugin in data["plugins"]:
        plugin_name = collection_plugin["name"]
        plugin = get_plugin(plugin_name)
        collection_plugin["summary"] = plugin.get("summary", "No summary provided")
        collection_plugin["authors"] = plugin.get("authors", [{"name": "No authors provided"}])
        collection_plugin["display_name"] = plugin.get("display_name", "No display name provided")
    return data
