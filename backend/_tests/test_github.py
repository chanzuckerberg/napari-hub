import unittest
from unittest.mock import patch

from github import get_github_repo_url, get_license, get_citations
from test_utils import FakeResponse, license_response, no_license_response, citation_string


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
        assert citations['citation'] is None
