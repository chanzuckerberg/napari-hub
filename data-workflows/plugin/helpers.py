import logging
import json
import os
import os.path
import re
from typing import Dict, Optional

import boto3
from botocore.exceptions import ClientError

LOGGER = logging.getLogger()

# list of valid layers
VALID_LAYERS = [
    'image',
    'labels',
    'points',
    'shapes',
    'surface',
    'tracks',
    'vectors',
]
VALID_LAYER_REGEX = rf"({'|'.join([layer_type for layer_type in VALID_LAYERS])}).*"


def _get_cache(key: str) -> Dict:
    try:
        bucket = os.getenv('BUCKET')
        bucket_path = os.getenv('BUCKET_PATH', '')
        s3_client = boto3.client("s3")
        return json.loads(s3_client.get_object(Bucket=bucket, Key=os.path.join(bucket_path, key))['Body'].read())
    except ClientError:
        logging.info(f"Not cached: {key}")
        return None


def get_valid_plugins() -> Dict[str, str]:
    return {**_get_cache('cache/hidden-plugins.json'), **_get_cache('cache/public-plugins.json')}


def get_frontend_manifest_metadata(plugin, version):
    raw_metadata = get_manifest(plugin, version)
    if 'error' in raw_metadata:
        raw_metadata = None
    interpreted_metadata = parse_manifest(raw_metadata)
    return interpreted_metadata


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
    manifest_attributes['npe2'] = not manifest.get('npe1_shim', False)
    if 'contributions' in manifest:
        manifest_contributions = manifest['contributions']
        if 'readers' in manifest_contributions:
            readers = manifest_contributions['readers']
            if readers:
                manifest_attributes['plugin_types'].append('reader')
                reader_file_extensions = set()
                for reader in readers:
                    filename_patterns = reader.get('filename_patterns', [])
                    for ext in filename_patterns:
                        reader_file_extensions.add(ext)
                manifest_attributes['reader_file_extensions'] = list(reader_file_extensions)
        if 'writers' in manifest_contributions:
            writers = manifest_contributions['writers']
            if writers:
                manifest_attributes['plugin_types'].append('writer')
                writer_file_extensions = set()
                writer_save_layers = set()
                for writer in writers:
                    filename_extensions = writer.get('filename_extensions', [])
                    layer_types = writer.get('layer_types', [])
                    for ext in filename_extensions:
                        writer_file_extensions.add(ext)
                    for layer_type in layer_types:
                        if match := re.match(VALID_LAYER_REGEX, layer_type):
                            writer_save_layers.add(match.groups()[0])
                manifest_attributes['writer_file_extensions'] = list(writer_file_extensions)
                manifest_attributes['writer_save_layers'] = list(writer_save_layers)
        if 'themes' in manifest_contributions and manifest_contributions['themes']:
            manifest_attributes['plugin_types'].append('theme')
        if 'widgets' in manifest_contributions and manifest_contributions['widgets']:
            manifest_attributes['plugin_types'].append('widget')
        if 'sample_data' in manifest_contributions and manifest_contributions['sample_data']:
            manifest_attributes['plugin_types'].append('sample_data')
    return manifest_attributes


def get_manifest(plugin: str, version: str = None) -> dict:
    plugins = get_valid_plugins()
    if plugin not in plugins:
        return {}
    elif version is None:
        version = plugins[plugin]
    plugin_metadata = _get_cache(f'cache/{plugin}/{version}-manifest.json')

    # plugin_metadata being None indicates manifest is not cached and needs processing
    if plugin_metadata is None:
        return {'error': 'Manifest not yet processed.'}

    # empty dict indicates some lambda error in processing e.g. timed out
    if plugin_metadata == {}:
        return {'error': 'Processing manifest failed due to external error.'}

    # error written to file indicates manifest discovery failed
    if 'error' in plugin_metadata:
        return {'error': plugin_metadata['error']}

    # correct plugin manifest
    return plugin_metadata


def get_plugin(plugin: str, version: str = None) -> dict:
    plugins = get_valid_plugins()
    if plugin not in plugins:
        return {}
    elif version is None:
        version = plugins[plugin]
    plugin_metadata = _get_cache(f'cache/{plugin}/{version}.json')
    manifest_metadata = get_frontend_manifest_metadata(plugin, version)
    plugin_metadata.update(manifest_metadata)
    if plugin_metadata:
        return plugin_metadata
    else:
        return {}


def _update_repo_to_plugin_dict(repo_to_plugin_dict: dict, plugin_obj: dict):
    code_repository = plugin_obj.get('code_repository')
    if code_repository:
        repo_to_plugin_dict[code_repository.replace('https://github.com/', '')] = plugin_obj['name']
    return repo_to_plugin_dict


def _get_repo_to_plugin_dict():
    index_json = _get_cache('cache/index.json')
    hidden_plugins = _get_cache('cache/hidden-plugins.json')
    repo_to_plugin_dict = {}
    for public_plugin_obj in index_json:
        repo_to_plugin_dict = _update_repo_to_plugin_dict(repo_to_plugin_dict, public_plugin_obj)
    for hidden_plugin_name, hidden_plugin_version in hidden_plugins.items():
        hidden_plugin_obj = get_plugin(hidden_plugin_name, hidden_plugin_version)
        repo_to_plugin_dict = _update_repo_to_plugin_dict(repo_to_plugin_dict, hidden_plugin_obj)
    return repo_to_plugin_dict
