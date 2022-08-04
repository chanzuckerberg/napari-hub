import contextlib
import json
import urllib.parse
import boto3
import subprocess
import sys
from npe2 import PluginManager

s3 = boto3.client('s3')


def discover_manifest(plugin_name):
    """
    Discovers manifest via npe2 library and fetches metadata related to plugin's manifest file.
    """
    pm = PluginManager()
    pm.discover(include_npe1=False)
    is_npe2 = True
    try:
        manifest = pm.get_manifest(plugin_name)
    except KeyError:
        pm.discover(include_npe1=True)
        is_npe2 = False
        # forcing lazy discovery to run
        with contextlib.suppress(OSError):
            pm.index_npe1_adapters()
        manifest = pm.get_manifest(plugin_name)
        if not manifest.contributions:
            raise RuntimeError(f"Manifest {plugin_name} exists but has no contributions.")
    return manifest, is_npe2


def generate_manifest(event, context):
    """
    Inspects the manifest file of the plugin to retrieve the value of process_count. If the value of process_count
    is in the json file and it is less than max_failure_tries, then the method attempts to pip install the plugin
    with its version, calls discover_manifest to return manifest and is_npe2, then write to designated location on s3.
    """
    max_failure_tries = 2
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    response = s3.get_object(Bucket=bucket, Key=key)
    myBody = response["Body"]
    body_dict = json.loads(myBody.read().decode("utf-8"))
    s3_client = boto3.client('s3')
    s3_body = ''
    if 'process_count' not in body_dict or body_dict['process_count'] >= max_failure_tries:
        return
    try:
        splitPath = str(key).split("/")
        plugin = splitPath[-2]
        version = splitPath[-1].strip('-manifest.json')
        command = [sys.executable, "-m", "pip", "install", f'{plugin}=={version}', "--target=/tmp/" + plugin]
        p = subprocess.Popen(command, stdout=subprocess.PIPE)
        while p.poll() is None:
            l = p.stdout.readline()  # This blocks until it receives a newline.
        sys.path.insert(0, "/tmp/" + plugin)
        manifest, is_npe2 = discover_manifest(plugin)
        # shimmed plugins will have `npe1_shim` field set to True, but only after npe2 release
        manifest_dict = json.loads(manifest.json())
        # write field manually for now
        manifest_dict['npe1_shim'] = manifest_dict.get('npe1_shim', not is_npe2)
        s3_body = json.dumps(manifest_dict)
    except Exception as e:
        str_e = str(e).replace('"', "")
        str_e = str_e.replace("'", "")
        body_dict['error_message'] = str_e
        s3_body = json.dumps(body_dict)
        raise e
    finally:
        response = s3_client.delete_object(
            Bucket=bucket,
            Key=key
        )
        s3_client.put_object(Body=s3_body, Bucket=bucket, Key=key)
