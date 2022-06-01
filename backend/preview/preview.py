from time import sleep
from typing import Union
from git import Repo
from pkginfo import Wheel
from collections import defaultdict
import datetime
import subprocess
import sys
import glob
import os
import json
import requests
from utils.utils import get_category_mapping, parse_manifest
from utils.github import github_pattern, get_github_metadata, get_github_repo_url
from utils.pypi import get_plugin_pypi_metadata

def get_plugin_preview(repo_pth: str, dest_dir: str, is_local: bool = False, branch: str = 'HEAD'):
    """Get plugin preview metadata of package at repo_pth.

    If is_local is not True, first clone the repository from GitHub
    URL repo_pth. Once repository is present locally, build distribution
    and parse metadata. Reuses backend functions for parsing additional
    hub specific metadata. Parsed metadata is saved to JSON file in dest_dir
    alongside the repository itself (if cloned) and the built distribution.

    :param repo_pth: path to plugin repository (URL unless is_local is True)
    :param dest_dir: path to destination directory (must exist)
    :param is_local: True if repo_pth is to local directory, otherwise False
    :param branch: Use a branch if specified
    """
    # clone repository from URL (if repo is not local)
    if not is_local:
        repo = clone_repo(repo_pth, dest_dir)
        repo_pth = repo.working_tree_dir
        if branch:
            repo.git.checkout(branch)

    # build distribution for plugin repository
    wheel_pth = build_dist(repo_pth, dest_dir)

    # parse metadata from wheel
    meta = parse_meta(wheel_pth)

    # parse additional metadata from URL
    action_github_repo = os.getenv("GITHUB_REPOSITORY")
    if action_github_repo:
        action_repo_url = f'https://github.com/{action_github_repo}'
        github_metadata = get_github_metadata(action_repo_url, branch=branch)
        if "code_repository" in meta and action_repo_url != meta["code_repository"]:
            github_metadata['action_repository'] = action_repo_url
    elif "code_repository" in meta:
        github_metadata = get_github_metadata(meta["code_repository"], branch=branch)
    else:
        github_metadata = {}

    if 'labels' in github_metadata:
        ontology = github_metadata['labels']['ontology']
        category_mappings = json.loads(requests.get(f'https://api.napari-hub.org/categories?version={ontology}').text)
        categories = defaultdict(list)
        category_hierarchy = defaultdict(list)
        for category in github_metadata['labels']['terms']:
            mapped_category = get_category_mapping(category, category_mappings)
            for match in mapped_category:
                if match['label'] not in categories[match['dimension']]:
                    categories[match['dimension']].append(match['label'])
                match['hierarchy'][0] = match['label']
                category_hierarchy[match['dimension']].append(match['hierarchy'])
        github_metadata['category'] = categories
        github_metadata['category_hierarchy'] = category_hierarchy
        del github_metadata['labels']

    meta.update(github_metadata)
    # get release date and first released
    get_pypi_date_meta(meta)
    manifest_attributes = get_manifest_attributes(meta['name'], repo_pth)
    meta.update(manifest_attributes)

    # write json
    with open(os.path.join(dest_dir, "preview_meta.json"), "w") as f:
        json.dump(meta, f)


def clone_repo(code_url: str, dest_dir: str) -> Union['Repo', None]:
    """Clone repository at code_url to dest_dir.

    :param code_url: url to GitHub code repository
    :param dest_dir: path to destination directory
    :return: cloned repo or None
    """
    github_match = github_pattern.match(code_url)
    if not github_match:
        raise ValueError(f"Malformed GitHub URL {code_url}")

    try:
        plugin_name = github_match.group(2)
    except IndexError:
        plugin_name = "plugin"

    try:
        repo = Repo.clone_from(code_url, os.path.join(dest_dir, plugin_name))
    except Exception:
        raise RuntimeError(f"Could not clone repo from {code_url}")

    return repo


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
        subprocess.run(
            [PYTHON_BIN, "-m", "build", "-w", ".", "-o", dest_dir],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as e:
        os.chdir(current_dir)
        raise RuntimeError(
            f"Could not build distribution for package at {full_pth}.\n{e.stderr}"
        )

    wheel_path = glob.glob(os.path.join(dest_dir, "*.whl"))[0]
    os.chdir(current_dir)

    return wheel_path


def parse_meta(pkg_pth):
    """Parses and returns metadata of the wheel at pkg_pth.

    :param pkg_pth: path to wheel
    :return: dictionary matching fields to the parsed values
    """
    meta_needed = {
        "name": "name",
        "summary": "summary",
        "description": "description",
        "description_content_type": "description_content_type",
        "authors": "author",
        "license": "license",
        "python_version": "requires_python",
        "operating_system": "classifiers",
        "version": "version",
        "development_status": "classifiers",
        "requirements": "requires_dist",
        "project_site": "home_page",
    }
    project_url_meta = {
        "documentation": "Documentation",
        "support": "User Support",
        "report_issues": "Bug Tracker",
        "twitter": "Twitter",
        "code_repository": "Source Code",
    }

    meta = defaultdict()
    pkg_info = Wheel(pkg_pth)

    # split project URLS into dict
    proj_urls = pkg_info.project_urls
    if proj_urls:
        proj_urls = [
            [val.strip() for val in url_str.split(",")] for url_str in proj_urls
        ]
        proj_urls = dict(
            zip([url[0] for url in proj_urls], [url[1] for url in proj_urls])
        )

        for key, val in project_url_meta.items():
            if val in proj_urls:
                meta[key] = proj_urls[val]
        if meta["code_repository"] is None:
            meta["code_repository"] = get_github_repo_url(proj_urls)

    for field, attr in meta_needed.items():
        val = getattr(pkg_info, attr)
        # author also needs email
        if attr == "author":
            meta[field] = [{"name": val, "email": getattr(pkg_info, "author_email")}]
        # classifiers is one big list so we need to search through it for relevant ones
        elif attr == "classifiers":
            if val:
                if field == "operating_system":
                    meta[field] = list(
                        filter(lambda x: x.startswith("Operating System"), val)
                    )
                elif field == "development_status":
                    meta[field] = list(
                        filter(lambda x: x.startswith("Development Status"), val)
                    )
            else:
                meta[field] = None
        else:
            meta[field] = getattr(pkg_info, attr)

    # try to github pattern match project site for source code URL if needed
    populate_source_code_url(meta)

    return meta


def get_pypi_date_meta(meta):
    """Get `first_released` & `release_date` by comparing PyPI and GitHub info

    Compare GitHub package version to PyPI package version and:
        - if plugin is not on PyPI, mock today's date for `first_released`
            and `release_date`
        - else if GitHub version is newer than PyPI, use PyPI `first_released`
            and today's date for `release_date`
        - else use PyPI `first_released` and `release_date`

    :param meta: dictionary of GitHub repository metadata
    """
    name = meta.get("name")
    gh_version = meta.get("version")

    current_date = datetime.datetime.utcnow().isoformat()
    release_date = None
    first_released = None
    if name:
        # don't pass in version in case package version is later than released version
        pypi_info = get_plugin_pypi_metadata(name, version=None)
        # plugin has already been released to PyPI
        if pypi_info:
            pypi_version = pypi_info['version']
            first_released_pypi = pypi_info['first_released']
            release_date_pypi = pypi_info['release_date']
            # this will be a new version on pypi, keep first_released but mock new release_date
            if gh_version > pypi_version:
                first_released = first_released_pypi
                release_date = current_date
            # versions are the same, or gh version is younger, we just keep pypi data
            else:
                first_released = first_released_pypi
                release_date = release_date_pypi
        # plugin not yet released to PyPI, we mock it being released today
        else:
            # assuming UTC
            release_date = first_released = current_date

    meta["release_date"] = release_date
    meta["first_released"] = first_released


def populate_source_code_url(meta):
    """Pattern match project_site as GitHub URL when source code url missing

    :param meta: dictionary of plugin metadata
    """
    if not "code_repository" in meta and "project_site" in meta:
        match = github_pattern.match(meta["project_site"])
        if match:
            meta["code_repository"] = match.group(0)

def discover_manifest(plugin_name):
    from npe2 import PluginManager
    pm = PluginManager()
    print("Discovering npe2")
    pm.discover(include_npe1=False)
    is_npe2 = True
    try:
        manifest = pm.get_manifest(plugin_name)
    except KeyError:
        print("Discovering npe1...")
        pm.discover(include_npe1=True)
        is_npe2 = False
        # forcing lazy discovery to run
        my_widgs = list(pm.iter_widgets())
        manifest = pm.get_manifest(plugin_name)
    return manifest, is_npe2


def get_manifest_attributes(plugin_name, repo_pth):
    """
    Try to install plugin and discover manifest values. If install
    or manifest discovery fails, return default empty values.
    """
    try:
        # command = [sys.executable, "-m", "pip", "install", "-e", f'{repo_pth}']
        # p = subprocess.Popen(command, stdout=subprocess.PIPE)
        # while p.poll() is None:
        #     l = p.stdout.readline()  # This blocks until it receives a newline.
        #     print(l)
        manifest, is_npe2 = discover_manifest(plugin_name)
    except Exception as e:
        manifest = None
        is_npe2 = False
        print(e)
    manifest_attributes = parse_manifest(manifest)
    manifest_attributes['npe2'] = is_npe2
    return manifest_attributes
