import pytest
from utils.utils import parse_manifest


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
