FROM public.ecr.aws/lambda/python:3.8

ENV NPE2_NOCACHE = 1

RUN ["yum", "install", "-y", "mesa-libGL"]

COPY requirements.txt .
RUN ["pip", "install", "-r", "requirements.txt"]

COPY . .
CMD ["get_plugin_manifest.generate_manifest"]
