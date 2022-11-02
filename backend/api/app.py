import os

from apig_wsgi import make_lambda_handler
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from flask import Flask, Response, jsonify, render_template
from flask_githubapp.core import GitHubApp

from api.collections import get_collections, get_collection
from api.model import get_public_plugins, get_index, get_plugin, get_excluded_plugins, update_cache, \
    move_artifact_to_s3, get_category_mapping, get_categories_mapping, get_manifest, get_installs, get_installs_stats, \
    get_recent_installs_stats, update_activity_data, update_recent_activity_data
from api.shield import get_shield
from utils.utils import send_alert, reformat_ssh_key_to_pem_bytes

GITHUB_APP_ID = os.getenv('GITHUBAPP_ID')
GITHUB_APP_KEY = os.getenv("GITHUBAPP_KEY")
GITHUB_APP_SECRET = os.getenv('GITHUBAPP_SECRET')

app = Flask(__name__)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
app.url_map.redirect_defaults = False
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


@app.route('/')
def index():
    return render_template('index.html', stack="/" + os.getenv('BUCKET_PATH') if os.getenv('BUCKET_PATH') else '')


@app.route('/swagger.yml')
def swagger():
    return render_template('swagger.yml', local_url=f"- url: {os.getenv('API_URL')}" if os.getenv('API_URL') else '')


@app.route('/plugins/index')
def plugin_index() -> Response:
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


@app.route('/manifest/<plugin>', defaults={'version': None})
@app.route('/manifest/<plugin>/versions/<version>')
def plugin_manifest(plugin: str, version: str = None) -> Response:
    manifest = get_manifest(plugin, version)

    if not manifest:
        return app.make_response(("Plugin does not exist", 404))

    if 'error' not in manifest:
        return jsonify(manifest)

    error = manifest['error']
    if error == 'Manifest not yet processed.':
        response = app.make_response(("Temporarily Unavailable. Attempting to build manifest. Please check back"
                                      " in 5 minutes.", 503))
        response.headers["Retry-After"] = 300
        return response
    else:
        return app.make_response(
            ("Plugin Manifest Not Found. Manifest discovery failed.", 404))


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


@app.route('/activity/update', methods=['POST'])
def update_activity() -> Response:
    update_activity_data()
    update_recent_activity_data()
    return app.make_response(("Complete", 204))


@app.route('/activity/<plugin>')
def get_plugin_installs(plugin: str) -> Response:
    return jsonify(get_installs(plugin))


@app.route('/activity/<plugin>/stats')
def get_plugin_installs_stats(plugin: str) -> Response:
    return jsonify(get_installs_stats(plugin))

@app.route('/activity/<plugin>/recentStats')
def get_recent_plugin_installs_stats(plugin: str) -> Response:
    return jsonify(get_recent_installs_stats(plugin))


@app.route('/collections')
def collections() -> Response:
    return get_collections()


@app.route('/collections/<collection>')
def collection(collection: str) -> Response:
    data = get_collection(collection)
    if not data:
        return app.make_response(("Collection does not exist", 404))
    return data


@app.errorhandler(404)
def handle_exception(e) -> Response:
    links = [rule.rule for rule in app.url_map.iter_rules()
             if 'GET' in rule.methods and
             any((rule.rule.startswith("/plugins"),
                  rule.rule.startswith("/shields"),
                  rule.rule.startswith("/categories"),
                  rule.rule.startswith("/activity")))]
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


@app.after_request
def add_header(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response


if __name__ == '__main__':
    app.run(port=12345)
