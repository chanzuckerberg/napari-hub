import logging
import re
from typing import Any, Optional

logger = logging.getLogger(__name__)

VALID_LAYERS = ["image", "labels", "points", "shapes", "surface", "tracks",
                "vectors"]
VALID_LAYER_REGEX = rf'({"|".join(VALID_LAYERS)}).*'
PLUGIN_TYPES_BY_KEY = {
    "readers": "reader",
    "sample_data": "sample_data",
    "themes": "theme",
    "widgets": "widget",
    "writers": "writer",
}
ONTOLOGY_VERSION = 'EDAM-BIOIMAGING:alpha06'
MANIFEST_EDAM_MAPPING = {
    'Annotation': ['Annotation'], # Operation
    'Dataset': ['Image'], # Data
    'Image_Processing': ['Image Processing'], # Operation
    'Measurement': ['Image Characteristics'], # Data
    'Segmentation': ['Image Segmentation'], # Operation > Image Processing
    'Transformations': ['Geometric Transformation', 'Morphological Operation'], # Operation > Image Processing
    'Visualization': ['Visualization'] # Operation
}


def get_formatted_manifest(data: Optional[dict[str, Any]],
                           plugin: str,
                           version: str) -> dict[str, Any]:
    """Parse fetched data if not None into frontend fields
    When `error` is in the returned metadata, we return default values.
    :param data: data fetched from plugin_metadata table for type=DISTRIBUTION
    :param plugin: plugin name
    :param version: plugin version
    :return: parsed metadata for the frontend
    """
    raw_metadata = _get_raw_manifest(data, plugin, version)
    return _parse_manifest(raw_metadata)


def _get_raw_manifest(manifest_data: Optional[dict[str, Any]],
                      plugin: str,
                      version: str) -> Optional[dict[str, Any]]:
    if manifest_data is None:
        logger.warning(f"{plugin}-{version} manifest not yet processed")
        return None

    # empty dict indicates some lambda error in processing e.g. timed out
    elif manifest_data == {}:
        logger.warning(f"Processing for {plugin}-{version} manifest failed due "
                       f"to external error")
        return None
    # error written to file indicates manifest discovery failed
    elif "error" in manifest_data:
        error = manifest_data["error"]
        logger.warning(f"Error in {plugin}-{version} manifest: {error}")
        return None

    return manifest_data

def _map_categories(manifest_categories):
    """Maps raw manifest categories to the appropriate EDAM ontology term.

    Any categories that don't map to an EDAM term are discarded.

    :param manifest_categories: categories read from the manifest
    """
    labels = {
        'ontology': ONTOLOGY_VERSION,
        'terms': []
    }
    for category in manifest_categories:
        if category in MANIFEST_EDAM_MAPPING:
            labels['terms'].append(MANIFEST_EDAM_MAPPING[category])
    return labels


def _parse_manifest(manifest: Optional[dict[str, Any]]) -> dict[str, Any]:
    """
    Convert raw manifest into dictionary of npe2 attributes.
    :param manifest: raw manifest
    """
    result = {
        "display_name": "",
        "plugin_types": [],
        "reader_file_extensions": [],
        "writer_file_extensions": [],
        "writer_save_layers": [],
        "labels": {},
    }
    if manifest is None:
        return result

    result["display_name"] = manifest.get("display_name", "")
    result["npe2"] = not manifest.get("npe1_shim", False)
    raw_categories = manifest.get("labels", {})
    if raw_categories:
        result['labels'] = _map_categories(raw_categories)
    if "contributions" in manifest:
        contributions = manifest["contributions"]
        if contributions.get("readers"):
            result["reader_file_extensions"] = _get_distinct_attributes(
                contributions.get("readers"), "filename_patterns"
            )
        if contributions.get("writers"):
            writers = contributions["writers"]
            result["writer_file_extensions"] = _get_distinct_attributes(
                writers, "filename_extensions"
            )
            writer_save_layers = set()
            for writer in writers:
                for layer_type in writer.get("layer_types", []):
                    if match := re.match(VALID_LAYER_REGEX, layer_type):
                        writer_save_layers.add(match.groups()[0])
            result["writer_save_layers"] = list(writer_save_layers)
        for key, value in PLUGIN_TYPES_BY_KEY.items():
            if key in contributions and contributions[key]:
                result["plugin_types"].append(value)
    return result


def _get_distinct_attributes(iterator: list, field_name: str) -> list:
    result = {val for entry in iterator for val in entry.get(field_name, [])}
    return list(result)
