import os
import requests
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from markdown import markdown
from requests import HTTPError

# Environment variable set through ecs stack terraform module
slack_url = os.environ.get('SLACK_URL')


def get_attribute(obj: dict, path: list):
    """
    Get attribute iteratively from a json object.

    :param obj: object to iterate on
    :param path: list of string to get sub path within json
    :return: the value if the path is accessible, empty string if not found
    """
    current_location = obj
    for token in path:
        if isinstance(current_location, dict) and token in current_location:
            current_location = current_location[token]
        elif isinstance(current_location, list) and token < len(current_location):
            current_location = current_location[token]
        else:
            return ""
    return current_location


def filter_prefix(str_list: List[str], prefix: str) -> list:
    """
    Filter the list for strings with the given prefix.

    :param str_list: list of strings to filter
    :param prefix: prefix to filter on
    :return: list of filtered strings
    """
    return [string for string in str_list if string.startswith(prefix)]


def render_description(description: str) -> str:
    """
    Render description with beautiful soup to generate html format description text.

    :param description: raw description to render
    :return: rendered description html text
    """
    if description != '':
        html = markdown(description)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()

    return ''


def send_alert(message: str):
    """
    Send alert to slack with a message.

    :param message: message to send alongside the alert
    """
    payload = {
        "text": message
    }
    if not slack_url:
        print(f"Unable to send alert because slack URL is not set: {message}")
    else:
        try:
            requests.post(slack_url, json=payload)
        except HTTPError:
            print("Unable to send alert")


def reformat_ssh_key_to_pem_bytes(ssh_key_str: str) -> bytes:
    """
    reformat the ssh key string to pem format bytes for github client.

    :param ssh_key_str: utf-8 string without header and footer for the github app rsa private key
    :return: pem formatted private key in bytes with header and footer
    """
    chunked = '\n'.join(ssh_key_str[i:i + 64] for i in range(0, len(ssh_key_str), 64))
    return f"-----BEGIN RSA PRIVATE KEY-----\n{chunked}\n-----END RSA PRIVATE KEY-----\n".encode("utf-8")


def get_category_mapping(category: str, mappings: Dict[str, List]) -> List[Dict]:
    """
    Get category mappings

    Parameters
    ----------
    category : str
        name of the category to map
    mappings: dict
        mappings to use for lookups, if None, use cached mapping

    Returns
    -------
    match : list of matched category
        list of mapped label, dimension and hierarchy, where hierarchy is from most abstract to most specific.
        for example, Manual segmentation is mapped to the following list:
        [
            {
                "label": "Image Segmentation",
                "dimension": "Operation",
                "hierarchy": [
                    "Image segmentation",
                    "Manual segmentation"
                ]
            },
            {
                "label": "Image annotation",
                "dimension": "Operation",
                "hierarchy": [
                    "Image annotation",
                    "Dense image annotation",
                    "Manual segmentation"
                ]
            }
        ]
    """
    if category not in mappings:
        return []
    else:
        return mappings[category]


def parse_manifest(manifest: Optional[dict] = None):
    """
    Convert raw manifest into dictionary of npe2 attributes.
    :param manifest: raw manifest
    """
    manifest_attributes = {
        'display_name': '',
        'plugin_types': [],
        'reader_file_extensions': [],
        'writer_file_extensions': [],
        'writer_save_layers': [],
    }
    if manifest is None:
        return manifest_attributes
    manifest_attributes['display_name'] = manifest.get('display_name', '')
    if 'contributions' in manifest:
        manifest_contributions = manifest.get('contributions', dict())
        if 'readers' in manifest_contributions:
            readers = manifest_contributions['readers']
            manifest_attributes['plugin_types'].append('reader')
            reader_file_extensions = set()
            for reader in readers:
                filename_patterns = reader.get('filename_patterns', [])
                for ext in filename_patterns:
                    reader_file_extensions.add(ext)
            manifest_attributes['reader_file_extensions'] = list(reader_file_extensions)
        if 'writers' in manifest_contributions:
            writers = manifest_contributions['writers']
            manifest_attributes['plugin_types'].append('writer')
            writer_file_extensions = set()
            writer_save_layers = set()
            for writer in writers:
                filename_extensions = writer.get('filename_extensions', [])
                layer_types = writer.get('layer_types', [])
                for ext in filename_extensions:
                    writer_file_extensions.add(ext)
                for ext in layer_types:
                    writer_save_layers.add(ext)
            manifest_attributes['writer_file_extensions'] = list(writer_file_extensions)
            manifest_attributes['writer_save_layers'] = list(writer_save_layers)
        if 'themes' in manifest_contributions:
            manifest_attributes['plugin_types'].append('theme')
        if 'widgets' in manifest_contributions:
            manifest_attributes['plugin_types'].append('widget')
        if 'sample_data' in manifest_contributions:
            manifest_attributes['plugin_types'].append('sample_data')
    return manifest_attributes
