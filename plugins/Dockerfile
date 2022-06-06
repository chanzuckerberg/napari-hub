FROM public.ecr.aws/lambda/python:3.8

RUN ['yum', 'install', 'python3-pyqt5']

COPY requirements.txt .
RUN ["pip", "install", "-r", "requirements.txt"]

COPY . .
CMD ["get_plugin_manifest.generate_manifest"]
