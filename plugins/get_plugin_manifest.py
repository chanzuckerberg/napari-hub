import json
import logging
from npe2 import fetch_manifest
from models import plugin_metadata


def _setup_logging():
    logging.basicConfig(
        level="INFO",
        style="{",
        format="[{levelname}] {asctime} {threadName} {name}.{funcName} {message}",
        force=True,
    )
    return logging.getLogger(__name__)


def generate_manifest(event, context):
    """
    When manifest does not already exist, discover using `npe2_fetch` and write
    valid manifest or resulting error message back to manifest file.
    """
    logger = _setup_logging()

    plugin = event["plugin"]
    version = event["version"]
    logger.info(f"Processing for {plugin}:{version}")
    # if the manifest for this plugin already exists there's nothing to do
    if plugin_metadata.is_manifest_exists(plugin, version):
        logger.info("Manifest exists... returning.")
        return

    body = {}
    plugin_metadata.write_manifest_data(plugin, version, body)
    try:
        logger.info(f"Discovering manifest for {plugin}:{version}")
        manifest = fetch_manifest(plugin, version)
        body = json.loads(manifest.json())
    except Exception as e:
        logger.exception(f"Failed discovery for {plugin}:{version}...")
        body = {"error": str(e)}

    plugin_metadata.write_manifest_data(plugin, version, body)
