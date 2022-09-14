import json
import os
import boto3
from botocore.exceptions import ClientError
from npe2 import fetch_manifest

s3 = boto3.client('s3')
# Environment variable set through ecs stack terraform module
bucket = os.environ.get('BUCKET')
bucket_path = os.environ.get('BUCKET_PATH', '')

def generate_manifest(event, context):
    """
    When manifest does not already exist, discover using `npe2_fetch` and write
    valid manifest or resulting error message back to manifest file.
    """
    plugin = event['plugin']
    version = event['version']
    key = os.path.join(bucket_path, f'cache/{plugin}/{plugin}.{version}-manifest.json')
    try:
        existing_manifest = s3.get_object(Bucket=bucket, Key=key)
        return
    except ClientError as e:
        # we don't want to hide any "real" s3 errors
        if not e.response['Error']['Code'] == 'NoSuchKey':
            raise e        
            
        try:
            manifest = fetch_manifest(plugin, version)
            s3_body = manifest.json()
        except Exception as e:
            s3_body =  json.dumps({'error': str(e)})
        s3.put_object(Body=s3_body, Bucket=bucket, Key=key)
