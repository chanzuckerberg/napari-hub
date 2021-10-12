import json
import os
import pytest
import pkginfo
import requests

from preview import clone_repo, build_dist, parse_meta, get_plugin_preview

code_plugin_url = "https://github.com/DragaDoncila/example-plugin"
hub_plugin_url = "https://api.napari-hub.org/plugins/example-plugin"

def test_clone_existing_plugin(tmpdir):
    dest_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(code_plugin_url, dest_dir)
    
    # a git repository
    assert os.path.exists(os.path.join(dest_dir, 'example-plugin', '.git/'))
    # correct repo name 
    assert os.path.basename(repo_pth) == 'example-plugin'


def test_clone_invalid_plugin(tmpdir):
    plugin_url = "https://github.com/DragaDoncila/fake-repo"
    dest_dir = tmpdir.mkdir("repo")
    
    with pytest.raises(RuntimeError):
        clone_repo(plugin_url, dest_dir)

def test_build_dist(tmpdir):
    dest_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(code_plugin_url, dest_dir)

    wheel_pth = build_dist(repo_pth, dest_dir)
    assert wheel_pth.endswith('.whl')

    wheel = pkginfo.Wheel(wheel_pth)
    assert isinstance(wheel, pkginfo.Wheel)
    assert wheel.name == 'example-plugin'

def test_build_dist_fail(tmpdir):
    plugin_dir = tmpdir.mkdir('fake-plugin')
    plugin_dir.join('setup.py')

    with pytest.raises(RuntimeError):
        build_dist(plugin_dir, tmpdir.mkdir('wheel_dir'))

def test_parse_meta(tmpdir):
    repo_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(code_plugin_url, repo_dir)
    wheel_pth = build_dist(repo_pth, repo_dir)
    meta = parse_meta(wheel_pth)
    assert meta['name'] == 'example-plugin'

def test_parse_preview_matches_hub(tmpdir):
    dest_dir = tmpdir.mkdir('preview')
    # get hub metadata for example-plugin
    hub_metadata = json.loads(requests.get(hub_plugin_url).text)

    # get preview metadata for example-plugin
    get_plugin_preview(code_plugin_url, dest_dir)
    with open(os.path.join(dest_dir, 'preview_meta.json')) as f:
        preview_meta = json.load(f)

    # for each shared field, assert they're the same
    for field in hub_metadata.keys():
        if field in preview_meta:
            print(field)
            assert preview_meta[field] == hub_metadata[field]
