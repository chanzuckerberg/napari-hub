import os
from apig_wsgi import make_lambda_handler
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from flask import Flask, Response, jsonify
from flask_githubapp.core import GitHubApp
from flask_swagger_ui import get_swaggerui_blueprint

from api.model import get_public_plugins, get_index, get_plugin, get_excluded_plugins, update_cache, \
    move_artifact_to_s3, get_category_mapping, get_categories_mapping
from api.shield import get_shield
from utils.utils import send_alert, reformat_ssh_key_to_pem_bytes

GITHUB_APP_ID = os.getenv('GITHUBAPP_ID')
GITHUB_APP_KEY = os.getenv("GITHUBAPP_KEY")
GITHUB_APP_SECRET = os.getenv('GITHUBAPP_SECRET')

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.url_map.redirect_defaults = False
preview_app = Flask("Preview")
prefix = f"/{os.getenv('BUCKET_PATH', '')}".strip("/")
app.register_blueprint(get_swaggerui_blueprint(prefix, f'{prefix}/static/swagger.yml'))

if GITHUB_APP_ID and GITHUB_APP_KEY and GITHUB_APP_SECRET:
    preview_app.config['GITHUBAPP_ID'] = int(GITHUB_APP_ID)
    preview_app.config['GITHUBAPP_KEY'] = reformat_ssh_key_to_pem_bytes(GITHUB_APP_KEY)
    preview_app.config['GITHUBAPP_SECRET'] = GITHUB_APP_SECRET
    app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {'/preview': preview_app})
else:
    preview_app.config['GITHUBAPP_ID'] = 0
    preview_app.config['GITHUBAPP_KEY'] = None
    preview_app.config['GITHUBAPP_SECRET'] = False

github_app = GitHubApp(preview_app)
handler = make_lambda_handler(app.wsgi_app)


@app.route('/plugins/index')
def index() -> Response:
    return jsonify(get_index())


@app.route('/update', methods=['POST'])
def update() -> Response:
    update_cache()
    return app.make_response(("Complete", 204))


@app.route('/plugins')
def plugins() -> Response:
    return jsonify(get_public_plugins())


@app.route('/plugins/<plugin>', defaults={'version': None})
@app.route('/plugins/<plugin>/versions/<version>')
def versioned_plugin(plugin: str, version: str = None) -> Response:
    return jsonify(get_plugin(plugin, version))


@app.route('/shields/<plugin>')
def shield(plugin: str) -> Response:
    return jsonify(get_shield(plugin))


@app.route('/plugins/excluded')
def get_exclusion_list() -> Response:
    return jsonify(get_excluded_plugins())


@app.route('/categories', defaults={'version': os.getenv('category_version', 'EDAM-BIOIMAGING:alpha06')})
def get_categories(version: str) -> Response:
    return jsonify(get_categories_mapping(version))


@app.route('/categories/<category>', defaults={'version': os.getenv('category_version', 'EDAM-BIOIMAGING:alpha06')})
@app.route('/categories/<category>/versions/<version>')
def get_category(category: str, version: str) -> Response:
    return jsonify(get_category_mapping(category, get_categories_mapping(version)))


@app.errorhandler(404)
def handle_exception(e) -> Response:
    links = [rule.rule for rule in app.url_map.iter_rules()
             if 'GET' in rule.methods and
             any((rule.rule.startswith("/plugins"),
                  rule.rule.startswith("/shields"),
                  rule.rule.startswith("/categories")))]
    links.sort()
    links = "\n".join(links)
    return app.make_response((f"Invalid Endpoint, valid endpoints are:\n{links}", 404,
                              {'Content-Type': 'text/plain; charset=utf-8'}))


@app.errorhandler(Exception)
def handle_exception(e) -> Response:
    send_alert(f"An unexpected error has occurred in napari hub: {e}")
    return app.make_response(("Internal Server Error", 500))


@github_app.on("workflow_run.completed")
def preview():
    move_artifact_to_s3(github_app.payload, github_app.installation_client)


if __name__ == '__main__':
    app.debug=True
    app.run(port=12345)