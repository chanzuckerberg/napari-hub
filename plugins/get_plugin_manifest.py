import json
import logging
from npe2 import fetch_manifest

from utils.s3_adapter import S3Adapter

LOGGER = logging.getLogger()


def _setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)


def generate_manifest(event, context):
    """
    When manifest does not already exist, discover using `npe2_fetch` and write
    valid manifest or resulting error message back to manifest file.
    """
    _setup_logging()
    s3 = S3Adapter()

    plugin = event['plugin']
    version = event['version']
    key = f'cache/{plugin}/{version}-manifest.json'
    LOGGER.info(f'Processing {key}')
    # if the manifest for this plugin already exists there's nothing do to
    existing_manifest_summary = s3.get_object_list_in_bucket(key)
    LOGGER.info(f'Matching manifests in bucket: {existing_manifest_summary}')
    if existing_manifest_summary:
        LOGGER.info("Manifest exists... returning.")
        return

    # write file to s3 to ensure we never retry this plugin version
    s3.write_to_s3(json.dumps({}), key)
    try:
        LOGGER.info('Discovering manifest...')
        manifest = fetch_manifest(plugin, version)
        s3_body = manifest.json()
    except Exception as e:
        LOGGER.exception("Failed discovery...")
        s3_body = json.dumps({'error': str(e)})

    s3.write_to_s3(s3_body, key)
