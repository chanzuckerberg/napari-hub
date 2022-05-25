import json
import urllib.parse
import boto3
import yaml
import requests
import subprocess
import sys
from npe2 import PluginManager

s3 = boto3.client('s3')


def lambda_handler(event, context):
    max_failure_tries = 2
    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    response = s3.get_object(Bucket=bucket, Key=key)
    myBody = response["Body"]
    myYaml = yaml.safe_load(myBody)
    if 'process_count' in myYaml and myYaml['process_count'] < max_failure_tries:
        splitPath = str(key).split("/")
        pluginName = splitPath[-2]
        version = splitPath[-1][:-5]
        command = [sys.executable, "-m", "pip", "install", f'{pluginName}=={version}', "--target=/tmp/" + pluginName]
        p = subprocess.Popen(command, stdout=subprocess.PIPE)
        while p.poll() is None:
            l = p.stdout.readline()  # This blocks until it receives a newline.
        sys.path.insert(0, "/tmp/" + pluginName)
        pm = PluginManager()
        pm.discover(include_npe1=False)
        if pluginName not in [pm.iter_manifests()]:
            pm.discover(include_npe1=True)
            print("it's not a npe2 plugin")
        else:
            print("it's a npe2 plugin")
        manifest = pm.get_manifest(pluginName)
        s3_client = boto3.client('s3')
        response = s3_client.delete_object(
            Bucket=bucket,
            Key=key
        )
        s3_client.put_object(Body=manifest.yaml(), Bucket=bucket, Key=key)


def failure_handler(event, context):
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
