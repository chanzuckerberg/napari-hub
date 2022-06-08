import urllib.parse
import boto3
import yaml
import subprocess
import sys
from typing import Optional
from npe2 import PluginManager, PluginManifest

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
        list(pm.iter_widgets())
        manifest = pm.get_manifest(plugin_name)
    return manifest, is_npe2


def generate_manifest(event, context):
    """
    Inspects the yaml file of the plugin to retrieve the value of process_count. If the value of process_count
    is in the yaml file and it is less than max_failure_tries, then the method attempts to pip install the plugin
    with its version, calls discover_manifest to return manifest and is_npe2, then write to designated location on s3.
    """
    max_failure_tries = 2
    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    response = s3.get_object(Bucket=bucket, Key=key)
    myBody = response["Body"]
    myYaml = yaml.safe_load(myBody)
    if 'process_count' in myYaml and myYaml['process_count'] < max_failure_tries:
        splitPath = str(key).split("/")
        plugin = splitPath[-2]
        version = splitPath[-1][:-5]
        command = [sys.executable, "-m", "pip", "install", f'{plugin}=={version}', "--target=/tmp/" + plugin]
        p = subprocess.Popen(command, stdout=subprocess.PIPE)
        while p.poll() is None:
            l = p.stdout.readline()  # This blocks until it receives a newline.
        sys.path.insert(0, "/tmp/" + plugin)
        manifest, is_npe2 = discover_manifest(plugin)
        manifest_attributes = parse_manifest(manifest, is_npe2)
        # write manifest attributes
        s3_client = boto3.client('s3')
        response = s3_client.delete_object(
            Bucket=bucket,
            Key=key
        )
        s3_client.put_object(Body=manifest.yaml(), Bucket=bucket, Key=key)


def parse_manifest(manifest: Optional[PluginManifest] = None, is_npe2: bool = False):
    """
    Convert raw manifest into dictionary of npe2 attributes.
    :param manifest: raw manifest
    :param is_npe2: boolean flag for npe2 plugin
    """
    manifest_attributes = {
        'display_name': '',
        'plugin_types': [],
        'reader_file_extensions': [],
        'writer_file_extensions': [],
        'writer_save_layers': [],
        'npe2': False
    }
    if manifest is None:
        return manifest_attributes
    if manifest.display_name:
        manifest_attributes['display_name'] = manifest.display_name
    if manifest.contributions.readers:
        readers = manifest.contributions.readers
        manifest_attributes['plugin_types'].append('reader')
        reader_file_extensions = set()
        for reader in readers:
            for ext in reader.filename_patterns:
                reader_file_extensions.add(ext)
        manifest_attributes['reader_file_extensions'] = list(reader_file_extensions)
    if manifest.contributions.writers:
        writers = manifest.contributions.writers
        manifest_attributes['plugin_types'].append('writer')
        writer_file_extensions = set()
        writer_save_layers = set()
        for writer in writers:
            for ext in writer.filename_extensions:
                writer_file_extensions.add(ext)
            for ext in writer.layer_types:
                writer_save_layers.add(ext)
        manifest_attributes['writer_file_extensions'] = list(writer_file_extensions)
        manifest_attributes['writer_save_layers'] = list(writer_save_layers)
    if manifest.contributions.themes:
        manifest_attributes['plugin_types'].append('theme')
    if manifest.contributions.widgets:
        manifest_attributes['plugin_types'].append('widget')
    manifest_attributes['npe2'] = is_npe2
    return manifest_attributes


def failure_handler(event, context):
    """
    Inspects the yaml file of the plugin, and if process_count is in the yaml file, then the method
    increments the value of process_count in the yaml file, then write to designated location on s3.
    """
    yaml_path = event['requestPayload']['Records'][0]['s3']['object']['key']
    bucket = event['requestPayload']['Records'][0]['s3']['bucket']['name']
    response = s3.get_object(Bucket=bucket, Key=yaml_path)
    myBody = response["Body"]
    myYaml = yaml.safe_load(myBody)
    s3_client = boto3.client('s3')
    if 'process_count' in myYaml:
        response = s3_client.delete_object(
            Bucket=bucket,
            Key=yaml_path
        )
        count = myYaml['process_count'] + 1
        body = "{'process_count': " + str(count) + "}"
        s3_client.put_object(Body=body, Bucket=bucket, Key=yaml_path)
