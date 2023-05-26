import json
import os

import boto3


class LambdaAdapter:

    def __init__(self):
        self._client = boto3.client('lambda')

    def invoke(self, plugin: str, version: str) -> None:
        """
        Invoke plugins lambda to generate manifest & write to cache.
        :param plugin: name of the plugin to fetch manifest
        :param version: plugin version to fetch manifest
        """
        self._client.invoke(
            FunctionName=os.environ.get('PLUGINS_LAMBDA_NAME'),
            InvocationType='Event',
            Payload=json.dumps({'plugin': plugin, 'version': version}),
        )
