import re
import yaml

from .adapter_helpers import GithubClientHelper, CitationHelper
from ..models.plugin_utils import PluginVisibility

_URL_PATTERN = re.compile("^https://github\\.com/([^/]+)/([^/]+)")
_DEFAULT_DESCRIPTION = "The developer has not yet provided a napari-hub " \
                       "specific description."
_PROJECT_URL_NAMES = {
    'Project Site': 'project_site',
    'Documentation': 'documentation',
    'User Support': 'support',
    'Report Issues': 'report_issues',
    'Twitter': 'twitter'
}
_VISIBILITY_SET = {'public', 'disabled', 'hidden'}
_HUB_CONFIG_KEYS = {'summary', 'authors', 'labels', 'visibility'}


def get_repo_url(project_urls: dict[str, str]) -> str:
    """
    Get repo url for github.

    :param project_urls: project urls to get github repo url from
    :returns: repo url if one is available, else None
    """
    source_code_url = project_urls.get("Source Code")
    if source_code_url:
        return source_code_url

    for key, url in project_urls.items():
        match = _URL_PATTERN.match(url)
        if match:
            return match.group(0)

    return None


def get_github_metadata(repo_url: str, branch: str = 'HEAD') -> dict:
    """
    Extract extra metadata from the github repo url.

    :param repo_url: github repo url to download from
    :param branch: name of the branch to use if specified
    :return: github metadata dictionary
    """
    github_metadata = {}
    github_helper = GithubClientHelper(repo_url, branch)
    github_license = github_helper.get_license()
    if github_license:
        github_metadata['license'] = github_license

    description = github_helper.get_first_valid_file(
            [".napari-hub/DESCRIPTION.md", ".napari/DESCRIPTION.md"]
        )

    if description and _DEFAULT_DESCRIPTION not in description:
        github_metadata['description'] = description

    citation_file = github_helper.get_file("CITATION.cff")
    if citation_file is not None:
        citation_helper = CitationHelper(citation_file)
        citation = citation_helper.get_citations()
        if citation:
            github_metadata['citations'] = citation
        # Try to parse names fron citation
        authors = citation_helper.get_citation_author()
        # update github metadata author info
        if authors:
            github_metadata.update({"authors": authors})
    if github_metadata.get('visibility') not in PluginVisibility:
        github_metadata['visibility'] = 'public'

    yaml_file = github_helper.get_first_valid_file(
        [".napari-hub/config.yml", ".napari/config.yml"]
    )
    if yaml_file:
        config = yaml.safe_load(yaml_file)
        # if the yaml.safe_load method returns None, then assign {} to config
        if config is None:
            config = {}
        hub_config = {key: config[key] for key in _HUB_CONFIG_KEYS if
                      key in config}
        github_metadata.update(hub_config)

        project_urls = config.get('project_urls', {})
        github_metadata.update({
            hub_name: project_urls[yaml_name]
            for yaml_name, hub_name in _PROJECT_URL_NAMES.items()
            if yaml_name in project_urls
        })

    return github_metadata

