FROM public.ecr.aws/lambda/python:3.8

COPY requirements.txt .
RUN ["pip", "install", "-r", "requirements.txt"]

COPY . .
ENV DD_LAMBDA_HANDLER="api.app.handler"
ENV DD_TRACE_ENABLED="true"
CMD ["datadog_lambda.handler.handler"]
