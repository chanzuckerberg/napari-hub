FROM public.ecr.aws/lambda/python:3.8

COPY requirements.txt .
RUN ["pip", "install", "-r", "requirements.txt"]

# Install citation parsing library without dependencies due to conflicts
RUN ["pip", "install", "cffconvert", "ruamel.yaml", "pykwalify[ruamel]", "--no-dependencies"]

COPY . .
CMD ["app.handler"]
