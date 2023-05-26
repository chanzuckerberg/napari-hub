import re

_URL_PATTERN = re.compile("^https://github\\.com/([^/]+)/([^/]+)")


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
