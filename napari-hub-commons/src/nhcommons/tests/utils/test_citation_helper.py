import datetime

import pytest
import yaml

from nhcommons.utils.adapter_helpers import CitationHelper


class TestCitationHelper:
    @pytest.fixture
    def valid_citation(self):
        citation_json = {
            "abstract": "Test",
            "authors": [
                {
                    "affiliation": "Test Center",
                    "family-names": "Fa",
                    "given-names": "Gi N.",
                    "orcid": "https://orcid.org/0000-0000-0000-0000",
                },
                {
                    "affiliation": "Test Center 2",
                    "name": "The Research Software project",
                },
            ],
            "cff-version": "1.0.3",
            "date-released": datetime.date(2019, 11, 12),
            "doi": "10.0000/something.0000000",
            "keywords": ["citation", "test", "cff", "CITATION.cff"],
            "license": "Apache-2.0",
            "message": "If you use this software, please cite it using these metadata.",
            "repository-code": "https://example.com/example",
            "title": "testing",
            "version": "0.0.0",
        }
        return yaml.dump(citation_json)

    @pytest.fixture
    def expected_citations(self, valid_citation):
        apa = (
            "Fa G.N., The Research Software project (2019). "
            "testing (version 0.0.0). DOI: 10.0000/something.0000000 "
            "URL: https://example.com/example\n"
        )
        bibtex = (
            "@misc{YourReferenceHere,\n"
            "author = {Fa, Gi N. and The Research Software project},\n"
            "doi = {10.0000/something.0000000},\nmonth = {11},\n"
            "title = {testing},\nurl = {https://example.com/example},\n"
            "year = {2019}\n}\n"
        )
        ris = (
            "TY  - GEN\nAB  - Test\nAU  - Fa, Gi N.\n"
            "AU  - The Research Software project\nDA  - 2019-11-12\n"
            "DO  - 10.0000/something.0000000\nKW  - citation\n"
            "KW  - test\nKW  - cff\nKW  - CITATION.cff\nPY  - 2019\nTI  - testing\n"
            "UR  - https://example.com/example\nER\n"
        )
        return {
            "APA": apa,
            "BibTex": bibtex,
            "RIS": ris,
            "citation": valid_citation,
        }

    def test_get_citations_valid_input(self, valid_citation, expected_citations):
        citation_helper = CitationHelper(valid_citation)
        assert citation_helper.get_citations() == expected_citations

    def test_get_citations_invalid_input(self):
        citation_helper = CitationHelper("""Ha? What is this?""")
        assert citation_helper.get_citations() is None

    def test_get_citation_author_valid_input(self, valid_citation):
        citation_helper = CitationHelper(valid_citation)
        expected = [{"name": "Gi N. Fa"}, {"name": "The Research Software project"}]
        assert citation_helper.get_citation_author() == expected

    def test_get_citation_author_invalid_input(self):
        citation_helper = CitationHelper("unbalanced brackets: ][")
        assert citation_helper.get_citation_author() == []
