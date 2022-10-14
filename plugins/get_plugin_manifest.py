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
    key = os.path.join(bucket_path, f'cache/{plugin}/{version}-manifest.json')
    print(f'Processing {key}')
    # if the manifest for this plugin already exists there's nothing do to
    bucket = s3.Bucket(bucket_name)
    existing_manifest_summary = list(bucket.objects.filter(Prefix=key))
    print(f'Matching manifests in bucket: {existing_manifest_summary}')
    if existing_manifest_summary:
        print("Manifest exists... returning.")
        return

    # write file to s3 to ensure we never retry this plugin version
    bucket.put_object(Body=json.dumps({}), Key=key)
    try:
        print('Discovering manifest...')
        manifest = fetch_manifest(plugin, version)
        s3_body = manifest.json()
    except Exception as e:
        print("Failed discovery...")
        s3_body =  json.dumps({'error': str(e)})
    print(f'Writing {s3_body} to {key} in {bucket_name}')
    bucket.put_object(Body=s3_body, Key=key)
