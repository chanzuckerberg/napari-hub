import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

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


def get_formatted_manifest(data: Optional[dict[str, Any]],
                           plugin: str,
                           version: str) -> dict[str, Any]:
    """Parse fetched data if not None into frontend fields
    When `error` is in the returned metadata, we return default values.

    :param data: data fetched from plugin_metadata table for
     type=DISTRIBUTION
    :param plugin: plugin name
    :param version: plugin version
    :return: parsed metadata for the frontend
    """
    raw_metadata = {} if _has_errors(data, plugin, version) else data
    return _parse_manifest(raw_metadata)


def _has_errors(manifest_data: Optional[dict[str, Any]], plugin: str, version: str) -> bool:
    # manifest_data is None indicates manifest isn't cached and needs processing
    if manifest_data is None:
        logger.error(f"{plugin}-{version} manifest not yet processed")
        return True

    # empty dict indicates some lambda error in processing e.g. timed out
    if manifest_data == {}:
        logger.error(f"Processing for {plugin}-{version} manifest failed due "
                     f"to external error")
        return True

    # error written to file indicates manifest discovery failed
    if 'error' in manifest_data:
        error = manifest_data['error']
        logger.error(f"Error in {plugin}-{version} manifest: {error}")
        return True

    return False


def _parse_manifest(manifest: Optional[dict[str, Any]]) -> dict[str, Any]:
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
                manifest_attributes['reader_file_extensions'] = list(
                    reader_file_extensions)
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
                manifest_attributes['writer_file_extensions'] = list(
                    writer_file_extensions)
                manifest_attributes['writer_save_layers'] = list(
                    writer_save_layers)
        if 'themes' in manifest_contributions and manifest_contributions[
            'themes']:
            manifest_attributes['plugin_types'].append('theme')
        if 'widgets' in manifest_contributions and manifest_contributions[
            'widgets']:
            manifest_attributes['plugin_types'].append('widget')
        if 'sample_data' in manifest_contributions and manifest_contributions[
            'sample_data']:
            manifest_attributes['plugin_types'].append('sample_data')
    return manifest_attributes

