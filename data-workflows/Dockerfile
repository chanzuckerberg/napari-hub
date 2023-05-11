FROM public.ecr.aws/lambda/python:3.9

RUN python -m pip install --upgrade pip

COPY ./napari-hub-commons napari-hub-commons
COPY ./data-workflows data-workflows

RUN pip install -r data-workflows/requirements.txt

WORKDIR data-workflows

CMD ["handler.handle"]
