from apig_wsgi import make_lambda_handler
from napari import app

# Configure this as your entry point in AWS Lambda
handler = make_lambda_handler(app.wsgi_app)
