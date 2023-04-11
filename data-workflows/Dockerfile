FROM public.ecr.aws/lambda/python:3.9

COPY ./napari-hub-commons ../napari-hub-commons
COPY ./data-workflows/requirements.txt .
RUN pip install -r requirements.txt

COPY ./data-workflows/ .

CMD ["handler.handle"]
