from typing import Union
from git import Repo
from pkginfo import Wheel
from collections import defaultdict
import subprocess
import sys
import glob
import os
import json

from utils.github import github_pattern, get_github_metadata, get_github_repo_url

def get_plugin_preview(repo_pth: str, dest_dir: str, is_local: bool=False) -> dict:
    """Get plugin preview metadata of package at repo_pth.

    If is_local is not True, first clone the repository from GitHub
    URL repo_pth. Once repository is present locally, build distribution
    and parse metadata. Reuses backend functions for parsing additional
    hub specific metadata. Parsed metadata is saved to JSON file in dest_dir
    alongside the repository itself (if cloned) and the built distribution.

    :param repo_pth: path to plugin repository (URL unless is_local is True)
    :param dest_dir: path to destination directory (must exist)
    :param is_local: True if repo_pth is to local directory, otherwise False
    """
    # clone repository from URL (if repo is not local)
    if not is_local:
        repo_pth = clone_repo(repo_pth, dest_dir)

    # build distribution for plugin repository
    wheel_pth = build_dist(repo_pth, dest_dir)

    # parse metadata from wheel
    meta = parse_meta(wheel_pth)

    # parse additional metadata from URL
    if meta.get("code_repository"):
        extra_meta = get_github_metadata(meta["code_repository"])
        meta.update(extra_meta)

    # write json
    with open(os.path.join(dest_dir, 'preview_meta.json'), 'w') as f:
        json.dump(meta, f)


def clone_repo(code_url: str, dest_dir: str) -> Union[str, None]:
    """Clone repository at code_url to dest_dir.

    :param code_url: url to GitHub code repository
    :param dest_dir: path to destination directory
    :return: path to repository or None
    """
    github_match = github_pattern.match(code_url)
    if not github_match:
        raise ValueError(f"Malformed GitHub URL {code_url}")

    try:
        plugin_name = github_match.group(2)
    except IndexError:
        plugin_name = 'plugin'

    try:
        repo = Repo.clone_from(code_url, os.path.join(dest_dir, plugin_name))
    except Exception:
        raise RuntimeError(f"Could not clone repo from {code_url}")

    return repo.working_tree_dir

def build_dist(pth: str, dest_dir: str) -> str:
    """Builds wheel for package found at `pth` and returns path to wheel.

    Using the currently executing python interpreter, attempts to build a wheel
    from the package at `pth` and place it in dest_dir. 
    If wheel build fails raises RuntimeError.

    :param pth: path to root of python package
    :param dest_dir: path to destination directory
    :raises RuntimeError: if a python binary cannot be found
    :raises RuntimeError: distribution cannot be built
    :return: path to wheel file
    """
    # get env binary where we're executing python
    ENVBIN = sys.exec_prefix
    # get the python binary from this env
    PYTHON_BIN = os.path.join(ENVBIN, "bin", "python")

    if not os.path.exists(PYTHON_BIN):
        raise RuntimeError(f"Cannot find python in {ENVBIN}.")

    # change into plugin directory because building from outside has caused errors before
    full_pth = os.path.abspath(pth)
    current_dir = os.getcwd()
    os.chdir(full_pth)    

    try:
        subprocess.run([PYTHON_BIN, 'setup.py', 'bdist_wheel', '--dist-dir', dest_dir], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        os.chdir(current_dir)
        raise RuntimeError(f'Could not build distribution for package at {full_pth}.\n{e.stderr}')

    wheel_path = glob.glob(os.path.join(dest_dir, '*.whl'))[0]
    os.chdir(current_dir)

    return wheel_path

def parse_meta(pkg_pth):
    """Parses and returns metadata of the wheel at pkg_pth.

    :param pkg_pth: path to wheel
    :return: dictionary matching fields to the parsed values
    """
    meta_needed = {        
        "name": 'name',
        "summary": 'summary',
        "description": 'description',
        "description_content_type" : 'description_content_type',
        "authors" : 'author',
        "license" : 'license',
        "python_version": 'requires_python',
        "operating_system" : 'classifiers',
        "version": 'version',
        "development_status": 'classifiers',
        "requirements" : 'requires_dist',
        "project_site": 'home_page',
    }
    project_url_meta = {
        "documentation": 'Documentation',
        "support": 'User Support',
        "report_issues": 'Report Issues',
        "twitter": 'Twitter',
        "code_repository": 'Source Code'
    }

    meta = defaultdict()
    pkg_info = Wheel(pkg_pth)

    # split project URLS into dict 
    proj_urls = pkg_info.project_urls
    if proj_urls:
        proj_urls = [[val.strip() for val in url_str.split(',')] for url_str in proj_urls]
        proj_urls = dict(zip([url[0] for url in proj_urls], [url[1] for url in proj_urls]))
        
        for key, val in project_url_meta.items():
            if val in proj_urls:
                meta[key] = proj_urls[val]
        if meta["code_repository"] is None:
            meta["code_repository"] = get_github_repo_url(proj_urls)

    for field, attr in meta_needed.items():
        val = getattr(pkg_info, attr)
        # author also needs email
        if attr == 'author':
            meta[field] = [{'name': val, 'email': getattr(pkg_info, 'author_email')}]
        # classifiers is one big list so we need to search through it for relevant ones
        elif attr == 'classifiers':
            if val:
                if field == 'operating_system':
                    meta[field] = list(filter(lambda x: x.startswith('Operating System'), val))
                elif field == 'development_status':
                    meta[field] = list(filter(lambda x: x.startswith('Development Status'), val))
            else:
                meta[field] = None
        else:
            meta[field] = getattr(pkg_info, attr)

    # try to github pattern match home page if code_repository still hasn't been found
    if not meta.get("code_repository"):
        proj_site = meta['project_site']
        match = github_pattern.match(proj_site)
        if match:
            meta["code_repository"] = match.group(0)

    return meta

    