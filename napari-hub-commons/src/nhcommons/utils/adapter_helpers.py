import logging
import os
from typing import Dict, List, Optional

import yaml
from cffconvert import Citation
from requests import HTTPError, JSONDecodeError

from nhcommons.utils.auth import get_auth
from nhcommons.utils.request_adapter import get_request


logger = logging.getLogger(__name__)


class GithubClientHelper:
    _auth = None

    def __new__(cls, *args, **kwargs):
        if not cls._auth:
            cls._auth = get_auth()
        return object.__new__(cls)

    def __init__(self, repo_url: str, branch: str = "HEAD"):
        self._repo_url = repo_url
        self._branch = branch

    def get_license(self) -> Optional[str]:
        try:
            api_url = self._to_api_github_url()
            response = get_request(f"{api_url}/license?ref={self._branch}",
                                   auth=self._auth).json()
            spdx_id = response.get("license", {}).get("spdx_id")
            if spdx_id != "NOASSERTION":
                return spdx_id

        except (HTTPError, JSONDecodeError):
            logging.error(f"Unable to fetch license for {self._repo_url}")
        return None

    def get_first_valid_file(self, paths: List[str], file_format: str = "") \
            -> Optional[str]:
        for file_path in paths:
            file = self.get_file(file_path, file_format)
            if file:
                return file
        return None

    def get_file(self, file: str = "", file_format: str = "") -> Optional[str]:
        """
        Get file from github.
        :param file: filename to get if specified
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
        except (HTTPError, JSONDecodeError):
            logger.error(f"Encountered error fetching {api_url}")
            return None

    @classmethod
    def replace_github_url(cls, repo_url: str, replacement: str = "") -> str:
        return repo_url.replace("https://github.com/", replacement)

    def _to_api_github_url(self, use_raw_content: bool = False) -> str:
        if use_raw_content:
            replacement = "https://raw.githubusercontent.com/"
        else:
            replacement = "https://api.github.com/repos/"
        return self.replace_github_url(self._repo_url, replacement)


class CitationHelper:

    def __init__(self, citation_str):
        self._citation_str = citation_str

    def get_citations(self) -> Optional[Dict[str, str]]:
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

    def get_citation_author(self) -> Optional[List[Dict[str, str]]]:
        """
        Parse author information from citation.
        :return: list of mappings between the string 'name' and the author name
        """
        citation_yaml = self._read_yaml()
        authors = []
        for entry in citation_yaml.get("authors", []):
            if "given-names" in entry and "family-names" in entry and \
                    entry["given-names"] and entry["family-names"]:
                name = entry["given-names"] + " " + entry["family-names"]
                authors.append({"name": name})
            elif "name" in entry and entry["name"]:
                authors.append({"name": entry["name"]})
        return authors

    def _read_yaml(self) -> Dict:
        try:
            return yaml.safe_load(self._citation_str)
        except yaml.YAMLError:
            logging.exception("Unable to parse data to yaml")
            return {}
