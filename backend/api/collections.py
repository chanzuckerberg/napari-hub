import requests
import yaml


COLLECTIONS_URL = "https://api.github.com/repos/chanzuckerberg/napari-hub-collections/contents/collections"
IMAGES_BASE_URL = "https://raw.githubusercontent.com/chanzuckerberg/napari-hub-collections/main/images/"


def get_collections():
    resp = requests.get(COLLECTIONS_URL)
    collections = []
    files = list(resp.json())
    for file in files:
        download_url = file.get("download_url")
        data = get_collection_data(download_url, subset=True)
        collections.append(data)
    return collections


def get_collection_data(url, subset=False):
    yaml_data = requests.get(url).text
    try:
        data = yaml.safe_load(yaml_data)
        if subset:
            return {
                "title": data.get("title"),
                "summary": data.get("summary"),
                "cover_image": IMAGES_BASE_URL + data.get("cover_image"),
                "curator": data.get("curator"),
            }
        return data
    except yaml.scanner.ScannerError:
        return {}
