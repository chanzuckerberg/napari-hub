FROM public.ecr.aws/lambda/python:3.8

COPY ./napari-hub-commons ../napari-hub-commons
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./backend/ .

COPY --from=public.ecr.aws/datadog/lambda-extension:latest /opt/extensions/ /opt/extensions

ENV DD_LAMBDA_HANDLER="api.app.handler"
ENV DD_TRACE_ENABLED="true"
CMD ["datadog_lambda.handler.handler"]
