import urllib.parse
import boto3
import yaml
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
        pm.index_npe1_adapters()
        manifest = pm.get_manifest(plugin_name)
    return manifest, is_npe2


def generate_manifest(event, context):
    """
    Inspects the yaml file of the plugin to retrieve the value of process_count. If the value of process_count
    is in the yaml file and it is less than max_failure_tries, then the method attempts to pip install the plugin
    with its version, calls discover_manifest to return manifest and is_npe2, then write to designated location on s3.
    """
    max_failure_tries = 2
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    response = s3.get_object(Bucket=bucket, Key=key)
    myBody = response["Body"]
    myYaml = yaml.safe_load(myBody)
    s3_client = boto3.client('s3')
    s3_body = ''
    if 'process_count' not in myYaml or myYaml['process_count'] >= max_failure_tries:
        return
    try:
        splitPath = str(key).split("/")
        plugin = splitPath[-2]
        version = splitPath[-1][:-5]
        command = [sys.executable, "-m", "pip", "install", f'{plugin}=={version}', "--target=/tmp/" + plugin]
        p = subprocess.Popen(command, stdout=subprocess.PIPE)
        while p.poll() is None:
            l = p.stdout.readline()  # This blocks until it receives a newline.
        sys.path.insert(0, "/tmp/" + plugin)
        manifest, is_npe2 = discover_manifest(plugin)
        body = '#npe2' if is_npe2 else "#npe1"
        s3_body = body + "\n" + manifest.yaml()
    except Exception as e:
        str_e = str(e).replace('"', "")
        str_e = str_e.replace("'", "")
        s3_body = 'process_count: ' + str(myYaml['process_count']) + '\n' + 'error_message: ' + f"'{str_e}'"
        raise e
    finally:
        response = s3_client.delete_object(
            Bucket=bucket,
            Key=key
        )
        s3_client.put_object(Body=s3_body, Bucket=bucket, Key=key)


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
        myYaml['process_count'] += 1
        s3_client.put_object(Body=yaml.dump(myYaml), Bucket=bucket, Key=yaml_path)
