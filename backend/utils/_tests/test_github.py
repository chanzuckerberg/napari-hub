import unittest
from unittest.mock import patch
import requests
from backend.utils.github import get_citation_author, get_github_metadata

from utils.github import get_github_repo_url, get_license, get_citations
from utils.test_utils import FakeResponse, license_response, no_license_response, citation_string, complete_author_citations, config_yaml

def mocked_requests_get_citation(*args, **kwargs):
    if args[0] != None and "CITATION.cff" in args[0]:
        return FakeResponse(data=citation_string)
    elif args[0] != None and "/license?ref=" in args[0]:
        return FakeResponse(data=license_response)

    return FakeResponse(data=None)

def mocked_requests_no_citation_no_config(*args, **kwargs):
    if args[0] != None and "/license?ref=" in args[0]:
        return FakeResponse(data=license_response)

    return FakeResponse(data=None)

def mocked_requests_get_citation_and_config(*args, **kwargs):
    if args[0] != None and "CITATION.cff" in args[0]:
        return FakeResponse(data=citation_string)
    elif args[0] != None and "/license?ref=" in args[0]:
        return FakeResponse(data=license_response)
    elif args[0] != None and ".napari-hub/config.yml" in args[0]:
        return FakeResponse(data=config_yaml)

    return FakeResponse(data=None)

def mocked_requests_get_config(*args, **kwargs):
    if args[0] != None and "/license?ref=" in args[0]:
        return FakeResponse(data=license_response)
    elif args[0] != None and ".napari-hub/config.yml" in args[0]:
        return FakeResponse(data=config_yaml)

    return FakeResponse(data=None)

class TestGithub(unittest.TestCase):

    def test_github_get_url(self):
        project_urls = {"Source Code": "test1"}
        assert ("test1" == get_github_repo_url(project_urls))

        project_urls = {"Random": "https://random.com"}
        assert (get_github_repo_url(project_urls) is None)

        project_urls = {"Random": "https://github.com/org"}
        assert (get_github_repo_url(project_urls) is None)

        project_urls = {"Random": "https://github.com/org/repo/random"}
        assert ("https://github.com/org/repo" == get_github_repo_url(project_urls))

    @patch(
        'requests.get', return_value=FakeResponse(data=license_response)
    )
    def test_github_license(self, mock_get):
        result = get_license("test_website")
        assert result == "BSD-3-Clause"

    @patch(
        'requests.get', return_value=FakeResponse(data=no_license_response)
    )
    def test_github_no_assertion_license(self, mock_get):
        result = get_license("test_website")
        assert result is None

    def test_valid_citation(self):
        citation = get_citations(citation_string)
        assert citation['APA'] == "Fa G.N., Family G. (2019). testing (version 0.0.0). " \
                                  "DOI: 10.0000/something.0000000 URL: https://example.com/example\n"
        assert citation['BibTex'] == "@misc{YourReferenceHere,\nauthor = {Fa, Gi N. and Family, Given},\n" \
                                     "doi = {10.0000/something.0000000},\nmonth = {11},\ntitle = {testing},\n" \
                                     "url = {https://example.com/example},\nyear = {2019}\n}\n"
        assert citation['RIS'] == "TY  - GEN\nAB  - Test\nAU  - Fa, Gi N.\nAU  - Family, Given\nDA  - 2019-11-12\n" \
                                  "DO  - 10.0000/something.0000000\nKW  - citation\nKW  - test\nKW  - cff\n" \
                                  "KW  - CITATION.cff\nPY  - 2019\nTI  - testing\n" \
                                  "UR  - https://example.com/example\nER\n"
        assert citation['citation'] == "# YAML 1.2\n---\nabstract: \"Test\"\nauthors:\n  -\n    " \
                                       "affiliation: \"Test Center\"\n    family-names: Fa\n    " \
                                       "given-names: Gi N.\n    orcid: https://orcid.org/0000-0000-0000-0000\n  " \
                                       "-\n    affiliation: \"Test Center 2\"\n    family-names: Family\n    " \
                                       "given-names: Given\ncff-version: \"1.0.3\"\ndate-released: 2019-11-12\n" \
                                       "doi: 10.0000/something.0000000\nkeywords:\n  - \"citation\"\n  - \"test\"\n" \
                                       "  - \"cff\"\n  - \"CITATION.cff\"\nlicense: Apache-2.0\n" \
                                       "message: \"If you use this software, please cite it using these metadata.\"\n" \
                                       "repository-code: \"https://example.com/example\"\ntitle: testing\n" \
                                       "version: \"0.0.0\"\n"

    def test_invalid_citation(self):
        citation_str = """Ha? What is this?"""
        citations = get_citations(citation_str)
        assert citations is None

    def test_citation_name_filtering(self):
        author = get_citation_author(citation_string)
        assert author == complete_author_citations

    # test that authors field populates when citation exists
    @patch('requests.get', side_effect=mocked_requests_get_citation)
    @patch('os.getenv', return_value=False)
    def test_get_github_metadata_with_citation(self, mock_requests_get, mock_os_get):
        metadata = get_github_metadata("https://github.com")
        assert metadata["authors"] == [{'name': 'Gi N. Fa'}, {'name': 'Given Family'}]

    # test that authors field doesn't populate when no citation exists and no config exists
    @patch('requests.get', side_effect=mocked_requests_no_citation_no_config)
    @patch('os.getenv', return_value=False)
    def test_get_github_metadata_with_no_citation(self, mock_requests_get, mock_os_get):
        metadata = get_github_metadata("https://github.com")
        assert "authors" not in metadata

    # test that config.yml overrides citation when both exist
    @patch('requests.get', side_effect=mocked_requests_get_citation_and_config)
    @patch('os.getenv', return_value=False)
    def test_get_github_metadata_with_config_override(self, mock_requests_get, mock_os_get):
        metadata = get_github_metadata("https://github.com")
        assert metadata["authors"] == [{'name': 'Test Author', 'orcid': '0000-0000-0000-0000'}]

    # test that config.yml populates authors field
    @patch('requests.get', side_effect=mocked_requests_get_config)
    @patch('os.getenv', return_value=False)
    def test_get_github_metadata_with_config(self, mock_requests_get, mock_os_get):
        metadata = get_github_metadata("https://github.com")
        assert metadata["authors"] == [{'name': 'Test Author', 'orcid': '0000-0000-0000-0000'}]
