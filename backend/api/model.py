from datetime import datetime
from typing import Dict, List, Any
from zipfile import ZipFile
from io import BytesIO
from api.models import (
    install_activity,
    plugin as plugin_model,
    plugin_blocked,
    plugin_metadata as plugin_metadata_model,
)
from utils.github import get_artifact
from api.s3 import cache
from utils.utils import get_attribute


def get_manifest(name: str, version: str = None) -> dict:
    """
    Get plugin manifest file for a particular plugin, get the latest if version is None.
    :param name: name of the plugin to get
    :param version: version of the plugin manifest
    :return: plugin manifest dictionary.
    """
    version = version or plugin_model.get_latest_version(name)
    if not version:
        return {}
    manifest_metadata = plugin_metadata_model.get_manifest(name, version)

    # manifest_metadata being None indicates manifest is not cached and needs processing
    if manifest_metadata is None:
        return {'error': 'Manifest not yet processed.'}

    # empty dict indicates some lambda error in processing e.g. timed out
    if manifest_metadata == {}:
        return {'error': 'Processing manifest failed due to external error.'}

    # error written to file indicates manifest discovery failed
    if 'error' in manifest_metadata:
        return {'error': manifest_metadata['error']}

    # correct plugin manifest
    return manifest_metadata


def get_index() -> List[Dict[str, Any]]:
    """
    Get the index page related metadata for all plugins.
    :return: dict for index page metadata
    """
    plugins = plugin_model.get_index()
    total_installs = install_activity.get_total_installs_by_plugins()
    for item in plugins:
        item["total_installs"] = total_installs.get(item["name"].lower(), 0)
    return plugins


def get_excluded_plugins() -> Dict[str, str]:
    """
    Get the excluded plugins.
    :return: dict for excluded plugins and their exclusion status
    """
    return {
        **plugin_model.get_excluded_plugins(),
        **plugin_blocked.get_blocked_plugins()
    }


def move_artifact_to_s3(payload, client):
    """
    move preview page build artifact zip to public s3.

    :param payload: json body from the github webhook
    :param client: installation client to query GitHub API
    """
    owner = get_attribute(payload, ['repository', 'owner', 'login'])
    repo = get_attribute(payload, ["repository", "name"])
    pull_request_number = get_attribute(payload, ['workflow_run', 'pull_requests', 0, 'number'])
    if not pull_request_number:
        github_repo = client.repository(owner, repo)
        head_owner = get_attribute(payload, ['workflow_run', 'head_repository', 'owner', 'login'])
        head_branch = get_attribute(payload, ['workflow_run', 'head_branch'])
        pull_requests = list(github_repo.pull_requests(head=f'{head_owner}:{head_branch}'))
        if len(pull_requests) == 1:
            pull_request_number = pull_requests[0].number
        else:
            return

    artifact_url = get_attribute(payload, ["workflow_run", "artifacts_url"])
    curr_clock = datetime.utcnow().isoformat()
    if artifact_url:
        artifact = get_artifact(artifact_url, client.session.auth.token)
        if artifact:
            zipfile = ZipFile(BytesIO(artifact.read()))
            for name in zipfile.namelist():
                with zipfile.open(name) as file:
                    if name == "index.html":
                        cache(file, f'preview/{owner}/{repo}/{pull_request_number}', "text/html")
                    else:
                        cache(file, f'preview/{owner}/{repo}/{pull_request_number}/{name}')

            pull_request = client.pull_request(owner, repo, pull_request_number)
            text = 'Preview page for your plugin is ready here:'
            comment_found = False
            for comment in pull_request.issue_comments():
                if text in comment.body and comment.user.login == 'napari-hub[bot]':
                    comment_found = True
                    comment.edit(text + f'\nhttps://preview.napari-hub.org/{owner}/{repo}/{pull_request_number}'
                                        f'\n_Updated: {curr_clock}_')
                    break
            if not comment_found:
                pull_request.create_comment(
                    text + f'\nhttps://preview.napari-hub.org/{owner}/{repo}/{pull_request_number}'
                           f'\n_Created: {curr_clock}_')
