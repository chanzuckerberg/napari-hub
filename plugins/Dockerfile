FROM public.ecr.aws/lambda/python:3.9

ENV NPE2_NOCACHE = 1

RUN yum install -y mesa-libGL

COPY ./napari-hub-commons ../napari-hub-commons
COPY ./plugins/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./plugins/ .

CMD ["get_plugin_manifest.generate_manifest"]
