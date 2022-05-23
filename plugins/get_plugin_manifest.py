import json
import urllib.parse
import boto3
import yaml
import requests
import subprocess
import sys
from npe2 import PluginManifest

s3 = boto3.client('s3')

def lambda_handler(event, context):
    # Get the object from the event and show its content type
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')
    #response = s3.get_object(Bucket=bucket, Key=key)
    #myBody = response["Body"]
    #myYaml = yaml.safe_load(myBody)
    splitPath = str(key).split("/")
    pluginName = splitPath[-2]
    version = splitPath[-1][:-5]
    command = [sys.executable, "-m", "pip", "install", f'{pluginName}=={version}', "--target=/tmp/" + pluginName]
    print(command)
    try:
        p = subprocess.Popen(command, stdout=subprocess.PIPE)
        while p.poll() is None:
            l = p.stdout.readline()  # This blocks until it receives a newline.
            print(l)
    except subprocess.CalledProcessError as e:
        print(e.output)
    manifest = PluginManifest.from_distribution(pluginName)
    print(manifest.contributions)
