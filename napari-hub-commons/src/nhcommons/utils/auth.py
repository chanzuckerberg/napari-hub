import os

import requests
from requests.auth import HTTPBasicAuth


class HTTPBearerAuth(requests.auth.AuthBase):
    def __init__(self, token):
        self.token = token

    def __call__(self, r):
        r.headers["authorization"] = "Bearer " + self.token
        return r


def get_auth():
    # Environment variable set through ecs stack terraform module
    github_client_id = os.getenv('GITHUB_CLIENT_ID')
    github_client_secret = os.getenv('GITHUB_CLIENT_SECRET')
    github_token = os.getenv('GITHUB_TOKEN')

    if github_token:
        return HTTPBearerAuth(github_token)
    elif github_client_id and github_client_secret:
        return HTTPBasicAuth(github_client_id, github_client_secret)

    return None
