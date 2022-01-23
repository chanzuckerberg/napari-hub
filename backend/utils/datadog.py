import time
from datadog_lambda.metric import lambda_metric


def report_metrics(metric_name: str, value, tags: list = None):
    tags = tags if tags else []
    lambda_metric(
        metric_name=metric_name,
        value=value,
        timestamp=int(time.time()),  # optional, must be within last 20 mins
        tags=tags
    )
