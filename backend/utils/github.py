import json
import os.path
import re
from typing import Dict, Union, IO

import requests
import yaml
from cffconvert.citation import Citation
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError

from utils.utils import get_attribute, render_description
from utils.auth import HTTPBearerAuth

# Environment variable set through ecs stack terraform module
github_client_id = os.environ.get('GITHUB_CLIENT_ID', None)
github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET', None)
github_token = os.environ.get('GITHUB_TOKEN', None)

auth = None
if github_token:
    auth = HTTPBearerAuth(github_token)
elif github_client_id and github_client_secret:
    auth = HTTPBasicAuth(github_client_id, github_client_secret)

visibility_set = {'public', 'disabled', 'hidden'}
github_pattern = re.compile("https://github\\.com/([^/]+)/([^/]+)")
hub_config_keys = {'summary', 'authors', 'labels', 'visibility'}
default_description = 'The developer has not yet provided a napari-hub specific description.'
project_url_names = {
    'Project Site': 'project_site',
    'Documentation': 'documentation',
    'User Support': 'support',
    'Report Issues': 'report_issues',
    'Twitter': 'twitter'
}


def get_file(download_url: str, file: str, branch: str = 'HEAD') -> [dict, None]:
    """
    Get file from github.

    :param download_url: github url to download from
    :param file: filename to get
    :param branch: branch name to use if specified
    :return: file context for the file to download
    """
    local_workspace = os.getenv("GITHUB_WORKSPACE")
    if local_workspace:
        # read files locally since github action already checked it out
        if os.path.exists(os.path.join(local_workspace, file)):
            with open(os.path.join(local_workspace, file)) as f:
                return f.read()
        else:
            return None

    api_url = download_url.replace("https://github.com/",
                                   "https://raw.githubusercontent.com/")
    try:
        url = f'{api_url}/{branch}/{file}'
        response = requests.get(url, auth=auth)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        return response.text
    except HTTPError:
        pass

    return None


def get_license(url: str, branch: str = 'HEAD') -> [str, None]:
    try:
        api_url = url.replace("https://github.com/",
                              "https://api.github.com/repos/")
        response = requests.get(f'{api_url}/license?ref={branch}', auth=auth)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        spdx_id = get_attribute(json.loads(response.text.strip()), ['license', "spdx_id"])
        if spdx_id == "NOASSERTION":
            return None
        else:
            return spdx_id
    except HTTPError:
        return None


def get_github_repo_url(project_urls: Dict[str, str]) -> [str, None]:
    """
    Get repo url for github.

    :param project_urls: project urls to get github repo url from
    :return: repo url if one is available, else None
    """
    source_code_url = get_attribute(project_urls, ["Source Code"])
    if source_code_url:
        return source_code_url
    elif isinstance(project_urls, dict):
        for key, url in project_urls.items():
            if url.startswith("https://github.com"):
                match = github_pattern.match(url)
                if match:
                    return github_pattern.match(url).group(0)

    return None


def get_github_metadata(repo_url: str, branch: str = 'HEAD') -> dict:
    """
    Extract extra metadata from the github repo url.

    :param repo_url: github repo url to download from
    :param branch: name of the branch to use if specified
    :return: github metadata dictionary
    """
    github_metadata = {}

    github_license = get_license(repo_url, branch=branch)
    if github_license is not None:
        github_metadata['license'] = github_license

    description = get_file(repo_url, ".napari/DESCRIPTION.md", branch=branch)

    if description and default_description not in description:
        github_metadata['description'] = description

    citation_file = get_file(repo_url, "CITATION.cff", branch=branch)
    if citation_file is not None:
        citation = get_citations(citation_file)
        if citation:
            github_metadata['citations'] = citation

    if 'visibility' not in github_metadata:
        github_metadata['visibility'] = 'public'
    elif github_metadata['visibility'] not in visibility_set:
        github_metadata['visibility'] = 'public'

    yaml_file = get_file(repo_url, ".napari/config.yml", branch=branch)
    if yaml_file:
        config = yaml.safe_load(yaml_file)
        hub_config = {key: config[key] for key in hub_config_keys if key in config}
        github_metadata.update(hub_config)

        project_urls = config.get('project_urls', {})
        github_metadata.update({
           hub_name: project_urls[yaml_name]
           for yaml_name, hub_name in project_url_names.items() if yaml_name in project_urls
        })

    return github_metadata


def get_citations(citation_str: str) -> Union[Dict[str, str], None]:
    """
    Get citation information from the string.
    :param citation_str: citation string to parse
    :return: citation dictionary with parsed citation of different formats, None if not valid citation
    """
    try:
        citation = Citation(cffstr=citation_str)
        return {
            'citation': citation_str,
            'RIS': citation.as_ris(),
            'BibTex': citation.as_bibtex(),
            'APA': citation.as_apalike()
        }
    except ValueError:
        # invalid CITATION.cff content
        return None


def get_artifact(url: str, token: str) -> Union[IO[bytes], None]:
    preview_auth = HTTPBearerAuth(token)
    response = requests.get(url, auth=preview_auth)
    if response.status_code != requests.codes.ok:
        return None

    download_urls = json.loads(response.text.strip()).get("artifacts", [])
    for download_url in download_urls:
        if download_url.get("name") == "preview-page" and 'archive_download_url' in download_url:
            response = requests.get(download_url['archive_download_url'], stream=True, auth=preview_auth)
            if response.status_code != requests.codes.ok:
                return None
            return response.raw
    return None
