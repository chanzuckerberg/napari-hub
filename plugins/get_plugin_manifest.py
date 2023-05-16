import json
import logging
from npe2 import fetch_manifest
from utils.s3_adapter import S3Adapter
from models.pluginmetadata import PluginMetadata


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
    LOGGER.info(f'Matching manifests in bucket {existing_manifest_summary}')
    if existing_manifest_summary:
        PluginMetadata.verify_exists_in_dynamo(plugin, version, key)
        LOGGER.info("Manifest exists... returning.")
        return

    # write file to s3 to ensure we never retry this plugin version
    s3_body = json.dumps({})
    s3.write_to_s3(s3_body, key)
    PluginMetadata.write_manifest_data(plugin, version, s3_body)
    try:
        LOGGER.info(f'Discovering manifest for {plugin}:{version}')
        manifest = fetch_manifest(plugin, version)
        s3_body = manifest.json()
    except Exception as e:
        LOGGER.exception(f"Failed discovery for {plugin}:{version}...")
        s3_body = json.dumps({'error': str(e)})

    s3.write_to_s3(s3_body, key)
    PluginMetadata.write_manifest_data(plugin, version, s3_body)
