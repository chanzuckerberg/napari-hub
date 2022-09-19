import json
import os
import boto3
from npe2 import fetch_manifest

# Environment variable set through ecs stack terraform module
bucket_name = os.environ.get('BUCKET')    
bucket_path = os.environ.get('BUCKET_PATH', '')
s3 = boto3.resource('s3')

def generate_manifest(event, context):
    """
    When manifest does not already exist, discover using `npe2_fetch` and write
    valid manifest or resulting error message back to manifest file.
    """
    if not bucket_name:
        raise RuntimeError('Bucket name not specified.')

    plugin = event['plugin']
    version = event['version']
    key = os.path.join(bucket_path, f'cache/{plugin}/{plugin}.{version}-manifest.json')
    # if the manifest for this plugin already exists there's nothing do to
    bucket = s3.Bucket(bucket_name)
    existing_manifest_summary = bucket.objects.filter(Prefix=key)
    if existing_manifest_summary:
        return

    try:
        manifest = fetch_manifest(plugin, version)
        s3_body = manifest.json()
    except Exception as e:
        s3_body =  json.dumps({'error': str(e)})
    s3.put_object(Body=s3_body, Bucket=bucket_name, Key=key)
