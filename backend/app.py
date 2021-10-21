import os
from apig_wsgi import make_lambda_handler
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from flask import Flask, Response, jsonify
from flask_githubapp.core import GitHubApp

from model import get_public_plugins, get_index, get_plugin, get_excluded_plugins, update_cache, move_artifact_to_s3
from shield import get_shield
from utils import send_alert, reformat_ssh_key_to_pem_bytes

GITHUB_APP_ID = os.getenv('GITHUBAPP_ID')
GITHUB_APP_KEY = os.getenv("GITHUBAPP_KEY")
GITHUB_APP_SECRET = os.getenv('GITHUBAPP_SECRET')

app = Flask(__name__)
preview_app = Flask("Preview")

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


@app.errorhandler(404)
def handle_exception(e) -> Response:
    links = [rule.rule for rule in app.url_map.iter_rules() if 'GET' in rule.methods
             and (rule.rule.startswith("/plugins") or rule.rule.startswith("/shields"))]
    return app.make_response((f"Invalid Endpoint, valid endpoints are {links}", 404,
                              {'Content-Type': 'text/plain; charset=utf-8'}))


@app.errorhandler(Exception)
def handle_exception(e) -> Response:
    send_alert(f"An unexpected error has occurred in napari hub: {e}")
    return app.make_response(("Internal Server Error", 500))


@github_app.on("workflow_run.completed")
def preview():
    move_artifact_to_s3(github_app.payload, github_app.installation_client.session.auth.token,
                        'napari-hub-preview-public')
