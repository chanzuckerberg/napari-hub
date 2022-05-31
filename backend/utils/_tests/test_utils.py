from utils.utils import parse_manifest
from npe2 import PluginManifest, DynamicPlugin, PluginManager


def test_manifest():
    sample_manifest = PluginManifest(name='test-package', display_name='Test Package')
    sample_manifest_attributes = parse_manifest(sample_manifest)
    assert sample_manifest_attributes['display_name'] == 'Test Package'
    assert 'plugin_types' in sample_manifest_attributes
    assert 'reader_file_extensions' in sample_manifest_attributes
    assert 'writer_file_extensions' in sample_manifest_attributes
    assert 'writer_save_layers' in sample_manifest_attributes


def test_manifest_plugin_types():
    pm = PluginManager()
    sample_plugin = DynamicPlugin(name='test-package', plugin_manager=pm)
    sample_plugin.manifest.display_name = 'Test Package'

    @sample_plugin.contribute.reader
    def read_func():
        ...

    @sample_plugin.contribute.writer(layer_types=['image', 'labels'])
    def write_func(path, layer_data):
        ...

    manifest_attributes = parse_manifest(sample_plugin.manifest)
    assert manifest_attributes['plugin_types'] == ['reader', 'writer']


def test_reader_fn_patterns():
    pm = PluginManager()
    sample_plugin = DynamicPlugin(name='test-package', plugin_manager=pm)
    sample_plugin.manifest.display_name = 'Test Package'

    @sample_plugin.contribute.reader(filename_patterns=['*.zarr', '*.tif'])
    def read_func():
        ...

    @sample_plugin.contribute.reader(filename_patterns=['*.csv', '*.tif'])
    def read_func2():
        ...

    manifest_attributes = parse_manifest(sample_plugin.manifest)
    assert sorted(manifest_attributes['reader_file_extensions']) == sorted(['*.zarr', '*.tif', '*.csv'])


def test_writer_fn():
    pm = PluginManager()
    sample_plugin = DynamicPlugin(name='test-package', plugin_manager=pm)
    sample_plugin.manifest.display_name = 'Test Package'

    @sample_plugin.contribute.writer(layer_types=['image', 'points'], filename_extensions=['*.csv', '.tif'])
    def write_func(path, layer_data):
        ...

    @sample_plugin.contribute.writer(layer_types=['image', 'shapes'], filename_extensions=['pdf', '*.jpg'])
    def write_func2(path, layer_data):
        ...

    manifest_attributes = parse_manifest(sample_plugin.manifest)
    assert sorted(manifest_attributes['writer_save_layers']) == sorted(['image', 'points', 'shapes'])
    assert sorted(manifest_attributes['writer_file_extensions']) == sorted(['.pdf', '.tif', '.csv', '.jpg'])


def test_parse_with_none_returns_default():
    vals = parse_manifest()
    assert vals['display_name'] == ''
    assert vals['plugin_types'] == []
    assert vals['reader_file_extensions'] == []
    assert vals['writer_file_extensions'] == []
    assert vals['writer_save_layers'] == []
