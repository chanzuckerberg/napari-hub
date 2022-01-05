import json
import os
import pytest
import pkginfo
import requests
import dateutil.parser
from datetime import datetime

from ..preview import clone_repo, build_dist, parse_meta, get_plugin_preview, get_pypi_date_meta

code_plugin_url = "https://github.com/chanzuckerberg/napari-demo"
hub_plugin_url = "https://api.napari-hub.org/plugins/napari-demo"
example_plugin_first_released = "2021-07-12T21:30:25.936203Z"
example_plugin_release_date = "2021-10-08T00:49:53.706510Z"


def test_clone_existing_plugin(tmpdir):
    dest_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(code_plugin_url, dest_dir).working_tree_dir
    
    # a git repository
    assert os.path.exists(os.path.join(dest_dir, 'napari-demo', '.git/'))
    # correct repo name 
    assert os.path.basename(repo_pth) == 'napari-demo'


def test_clone_invalid_plugin(tmpdir):
    plugin_url = "https://github.com/chanzuckerberg/fake-repo"
    dest_dir = tmpdir.mkdir("repo")
    
    with pytest.raises(RuntimeError):
        clone_repo(plugin_url, dest_dir)


def test_build_dist(tmpdir):
    dest_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(code_plugin_url, dest_dir).working_tree_dir

    wheel_pth = build_dist(repo_pth, dest_dir)
    assert wheel_pth.endswith('.whl')

    wheel = pkginfo.Wheel(wheel_pth)
    assert isinstance(wheel, pkginfo.Wheel)
    assert wheel.name == 'napari-demo'


def test_build_dist_fail(tmpdir):
    plugin_dir = tmpdir.mkdir('fake-plugin')
    plugin_dir.join('setup.py')

    with pytest.raises(RuntimeError):
        build_dist(plugin_dir, tmpdir.mkdir('wheel_dir'))


def test_parse_meta(tmpdir):
    repo_dir = tmpdir.mkdir("repo")
    repo_pth = clone_repo(code_plugin_url, repo_dir).working_tree_dir
    wheel_pth = build_dist(repo_pth, repo_dir)
    meta = parse_meta(wheel_pth)
    assert meta['name'] == 'napari-demo'


def test_parse_preview_matches_hub(tmpdir):
    dest_dir = tmpdir.mkdir('preview')
    # get hub metadata for example-plugin
    hub_metadata = json.loads(requests.get(hub_plugin_url).text)

    # get preview metadata for example-plugin
    os.environ["GITHUB_REPOSITORY"] = "chanzuckerberg/napari-demo"
    os.environ["GITHUB_WORKSPACE"] = ""
    get_plugin_preview(code_plugin_url, dest_dir)
    with open(os.path.join(dest_dir, 'preview_meta.json')) as f:
        preview_meta = json.load(f)

    # for each shared field, assert they're the same
    for field in hub_metadata.keys():
        if field in preview_meta and field not in ['first_released', 'release_date', 'version']:
            assert preview_meta[field] == hub_metadata[field]


def test_release_date_logic():
    # plugin not on PyPI gives today's date
    meta = {'name': 'not-a-real-napari-plugin', 'version': '0.0.1'}
    get_pypi_date_meta(meta)
    assert dateutil.parser.isoparse(meta['first_released']).date() == dateutil.parser.isoparse(meta['release_date']).date() == datetime.utcnow().date()

    # plugin on PyPI, version on GitHub is later
    meta = {'name': 'example-plugin', 'version': '0.0.8'}
    get_pypi_date_meta(meta)
    assert dateutil.parser.isoparse(meta['first_released']).date() == dateutil.parser.isoparse(example_plugin_first_released).date()
    assert dateutil.parser.isoparse(meta['release_date']).date() == datetime.utcnow().date()

    # plugin on PyPI, version on GitHub matches PyPI or is earlier
    meta = {'name': 'example-plugin', 'version': '0.0.7'}
    get_pypi_date_meta(meta)
    assert dateutil.parser.isoparse(meta['first_released']).date() == dateutil.parser.isoparse(example_plugin_first_released).date()
    assert dateutil.parser.isoparse(meta['release_date']).date() == dateutil.parser.isoparse(example_plugin_release_date).date()
