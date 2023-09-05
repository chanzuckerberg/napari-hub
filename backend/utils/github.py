import logging
import os.path

import requests
from requests.auth import HTTPBasicAuth
from requests.exceptions import HTTPError

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


def get_file(
    download_url: str, file: str = "", branch: str = "HEAD", file_format: str = ""
) -> [dict, None]:
    """
    Get file from github.

    :param download_url: github url to download from
    :param file: filename to get if specified
    :param branch: branch name to use if specified
    :param file_format: format to return if specified
    :return: file context for the file to download
    """
    api_url = download_url.replace(
        "https://github.com/", "https://raw.githubusercontent.com/"
    )
    if branch and file:
        api_url = f"{api_url}/{branch}/{file}"
    try:
        response = requests.get(api_url, auth=auth)
        if response.status_code != requests.codes.ok:
            response.raise_for_status()
        if file_format == "json":
            return response.json()
        return response.text
    except HTTPError:
        logging.exception(f"Error when fetching url={download_url} file={file} "
                          f"branch={branch}")
        pass

    return None
