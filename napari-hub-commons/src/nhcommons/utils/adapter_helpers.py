import logging
import os
from typing import Union, Dict, List

import yaml
from cffconvert import Citation
from requests import HTTPError

from nhcommons.utils.auth import get_auth
from nhcommons.utils.request_adapter import get_request


_LOGGER = logging.getLogger()


class GithubClientHelper:
    _auth = None

    def __new__(cls, *args, **kwargs):
        if not cls._auth:
            cls._auth = get_auth()

    def __init__(self, repo_url: str, branch: str = "HEAD"):
        self._repo_url = repo_url
        self._branch = branch

    def get_license(self) -> [str, None]:
        try:
            api_url = self._to_api_github_url()
            response = get_request(f"{api_url}/license?ref={self._branch}",
                                   auth=self._auth).json()
            spdx_id = response.get("license", {}).get( "spdx_id", "")
            if spdx_id != "NOASSERTION":
                return spdx_id

        except HTTPError:
            pass
        return None

    def get_first_valid_file(self, paths: List[str], file_format: str = "") -> [dict, None]:
        for file_path in paths:
            file = self.get_file(file_path, file_format)
            if file:
                return file
        return None

    def get_file(self, file: str = "", file_format: str = "") -> [dict, None]:
        """
        Get file from github.
        :param download_url: github url to download from
        :param file: filename to get if specified
        :param branch: branch name to use if specified
        :param file_format: format to return if specified
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

        api_url = self._to_api_github_url(use_raw_content=True)
        if self._branch and file:
            api_url = f"{api_url}/{self._branch}/{file}"
        try:
            response = get_request(api_url, auth=self._auth)
            return response.json() if file_format == "json" else response.text
        except HTTPError:
            _LOGGER.exception(f"Error fetching {api_url}")
        return None

    def _to_api_github_url(self, use_raw_content : bool = False) -> str:
        if use_raw_content:
            replacement = "https://raw.githubusercontent.com/"
        else:
            replacement = "https://api.github.com/repos/"
        return self._repo_url.replace("https://github.com/", replacement)


class CitationHelper:

    def __init__(self, citation_str):
        self._citation_str = citation_str

    def get_citations(self) -> Union[Dict[str, str], None]:
        """
        Get citation information from the string.
        :return: citation dictionary with parsed citation of different formats,
        None if not valid citation
        """
        try:
            citation = Citation(cffstr=self._citation_str)
            return {
                'citation': self._citation_str,
                'RIS': citation.as_ris(),
                'BibTex': citation.as_bibtex(),
                'APA': citation.as_apalike()
            }
        except Exception as e:
            logging.exception(e)
            return None

    def get_citation_author(self) -> Union[List[Dict[str, str]], None]:
        """
        Parse author information from citation.
        :return: list of mappings between the string 'name' and the author name
        """
        try:
            citation_yaml = yaml.safe_load(self._citation_str)
        except yaml.YAMLError as e:
            logging.error(e)
            return []

        authors = []
        for author_entry in citation_yaml['authors']:
            if 'given-names' in author_entry and 'family-names' in author_entry and author_entry['given-names'] and author_entry['family-names']:
                name = author_entry['given-names'] + " " + author_entry['family-names']
                authors.append({'name': name})
            elif 'name' in author_entry and author_entry['name']:
                authors.append({'name': author_entry['name']})
        return authors
