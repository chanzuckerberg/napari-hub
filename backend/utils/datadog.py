import time
import os
from datadog_lambda.metric import lambda_metric


def report_metrics(metric_name: str, value, tags: list = None):
    tags = tags if tags else []
    tags.append(f'env:{os.getenv("ENV")}')
    tags.append(f'service:{os.getenv("SERVICE")}')
    lambda_metric(
        metric_name=metric_name,
        value=value,
        timestamp=int(time.time()),  # optional, must be within last 20 mins
        tags=tags
    )
