import pytest
from utils.utils import parse_manifest, get_supported_extensions_from_patterns


def test_save_layers_valid():
    manifest = {
        'contributions': {
            'writers': [
                {
                    'layer_types': [
                        'image{1,3}',
                        'image',
                        'labels',
                        'faketype',
                        'points+',
                        'tracks*'
                    ]
                }
            ]
    }}
    parsed_attributes = parse_manifest(manifest)
    assert sorted(parsed_attributes['writer_save_layers']) == ['image', 'labels', 'points', 'tracks']


def test_get_supported_formats():
    extensions = ['*.tif', '*.xml', '*.png']
    supported_extensions = get_supported_extensions_from_patterns(extensions)
    assert sorted(supported_extensions) == ['.tif', '.xml']

    extensions = []
    supported_extensions = get_supported_extensions_from_patterns(extensions)
    assert supported_extensions == []

    extensions = ['*.tif', '*.ome.tif']
    supported_extensions = get_supported_extensions_from_patterns(extensions)
    assert supported_extensions == ['.tif']
