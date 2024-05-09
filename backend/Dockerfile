FROM public.ecr.aws/lambda/python:3.8

COPY ./napari-hub-commons ../napari-hub-commons
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY ./backend/ .

CMD ["app.handler"]
