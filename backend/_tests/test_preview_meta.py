import os
import pytest
import pkginfo

from backend.parse_preview_meta import clone_repo, build_dist, parse_meta

plugin_url = "https://github.com/DragaDoncila/example-plugin"

def test_clone_existing_plugin(tmpdir):
    dest_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(plugin_url, dest_dir)
    
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
    repo_pth = clone_repo(plugin_url, dest_dir)

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
    repo_pth = clone_repo(plugin_url, repo_dir)
    wheel_pth = build_dist(repo_pth, repo_dir)
    meta = parse_meta(wheel_pth)
    assert meta['name'] == 'example-plugin'

def test_parse_preview_matches_hub(tmpdir):
    pass
