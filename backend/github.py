import os.path
import re
import json
import yaml
import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError
from cffconvert.citation import Citation
from .util import get_attribute

# Environment variable set through lambda terraform infra config
github_client_id = os.environ.get('GITHUB_CLIENT_ID', None)
github_client_secret = os.environ.get('GITHUB_CLIENT_SECRET', None)
index_subset = {'name', 'summary', 'description_text', 'description_content_type',
                'authors', 'license', 'python_version', 'operating_system',
                'release_date', 'version', 'first_released',
                'development_status'}
visibility_set = {'public', 'disabled', 'hidden'}

github_pattern = re.compile("https://github\\.com/([^/]+)/([^/]+)")


def get_file(download_url: str, file: str) -> [dict, None]:
    """
    Get file from github.

    :param download_url: github url to download from
    :param file: filename to get
    :return: file context for the file to download
    """
    api_url = download_url.replace("https://github.com/",
                                   "https://raw.githubusercontent.com/")
    try:
        url = f'{api_url}/HEAD/{file}'
        response = requests.get(url)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        return response.text
    except HTTPError:
        pass

    return None


def get_license(url: str) -> [str, None]:
    try:
        api_url = url.replace("https://github.com/",
                              "https://api.github.com/repos/")
        auth = None
        if github_client_id is not None and github_client_secret is not None:
            auth = HTTPBasicAuth(github_client_id, github_client_secret)
        response = requests.get(f'{api_url}/license', auth=auth)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        spdx_id = get_attribute(json.loads(response.text.strip()), ['license', "spdx_id"])
        if spdx_id == "NOASSERTION":
            return None
        else:
            return spdx_id
    except HTTPError:
        return None


def get_github_repo_url(project_urls: dict) -> [str, None]:
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


def get_github_metadata(repo_url: str) -> dict:
    """
    Extract extra metadata from the github repo url.

    :param repo_url: github repo url to download from
    :return: github metadata dictionary
    """
    github_metadata = {}

    github_license = get_license(repo_url)
    if github_license is not None:
        github_metadata['license'] = github_license

    description = get_file(repo_url, ".napari/DESCRIPTION.md")

    if description is not None:
        github_metadata['description'] = description

    yaml_file = get_file(repo_url, ".napari/config.yml")
    if yaml_file:
        config = yaml.safe_load(yaml_file)
        github_metadata.update(config)

    citation_file = get_file(repo_url, "CITATION.cff")
    if citation_file is not None:
        github_metadata['citations'] = get_citations(citation_file)

    if 'visibility' not in github_metadata:
        github_metadata['visibility'] = 'public'
    elif github_metadata['visibility'] not in visibility_set:
        github_metadata['visibility'] = 'public'

    return github_metadata


def get_citations(citation_str: str) -> dict:
    """
    Get citation information from the string.
    :param citation_str: citation string to parse
    :return: citation dictionary with parsed citation of different formats
    """
    citations = {}
    try:
        citation = Citation(cffstr=citation_str)
        citations['citation'] = citation_str
        citations['RIS'] = citation.as_ris()
        citations['BibTex'] = citation.as_bibtex()
        citations['APA'] = citation.as_apalike()
    except ValueError:
        # invalid CITATION.cff content
        citations['citation'] = None
        citations['RIS'] = None
        citations['BibTex'] = None
        citations['APA'] = None
    return citations
