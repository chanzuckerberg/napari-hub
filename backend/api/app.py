import logging
import os

from werkzeug import exceptions
from apig_wsgi import make_lambda_handler
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from flask import Flask, Response, jsonify, render_template, request
from flask_githubapp.core import GitHubApp

from api.home import get_plugin_sections
from api.plugin_collections import get_collections, get_collection
from api.custom_wsgi import script_path_middleware
from api.model import (
    get_index,
    get_excluded_plugins,
    move_artifact_to_s3,
    get_manifest,
)
from api.metrics import get_metrics_for_plugin
from api.models import (category as categories, plugin as plugin_model)
from api.shield import get_shield
from utils.utils import send_alert, reformat_ssh_key_to_pem_bytes

GITHUB_APP_ID = os.getenv("GITHUBAPP_ID")
GITHUB_APP_KEY = os.getenv("GITHUBAPP_KEY")
GITHUB_APP_SECRET = os.getenv("GITHUBAPP_SECRET")

app = Flask(__name__)
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = True
app.url_map.redirect_defaults = False
preview_app = Flask("Preview")

if os.getenv("DD_ENV") == "dev":
    app.wsgi_app = script_path_middleware(f'/{os.getenv("DD_SERVICE")}')(app.wsgi_app)


if GITHUB_APP_ID and GITHUB_APP_KEY and GITHUB_APP_SECRET:
    preview_app.config["GITHUBAPP_ID"] = int(GITHUB_APP_ID)
    preview_app.config["GITHUBAPP_KEY"] = reformat_ssh_key_to_pem_bytes(GITHUB_APP_KEY)
    preview_app.config["GITHUBAPP_SECRET"] = GITHUB_APP_SECRET
    app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {"/preview": preview_app})
else:
    preview_app.config["GITHUBAPP_ID"] = 0
    preview_app.config["GITHUBAPP_KEY"] = None
    preview_app.config["GITHUBAPP_SECRET"] = False

github_app = GitHubApp(preview_app)
handler = make_lambda_handler(app.wsgi_app)

logger = logging.getLogger()
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s %(module)s %(funcName)s %(message)s",
)
logger.setLevel(logging.DEBUG if os.getenv("IS_DEBUG") else logging.INFO)


@app.route("/")
def index():
    stack = "/" + os.getenv("BUCKET_PATH") if os.getenv("BUCKET_PATH") else ""
    return render_template("index.html", stack=stack)


@app.route("/swagger.yml")
def swagger():
    local_url = f"- url: {os.getenv('API_URL')}" if os.getenv("API_URL") else ""
    return render_template("swagger.yml", local_url=local_url)


@app.route("/plugins/index")
def plugin_index() -> Response:
    return jsonify(get_index())


@app.route("/plugins")
def plugins() -> Response:
    return jsonify(plugin_model.get_latest_by_visibility())


@app.route("/plugins/<plugin>", defaults={"version": None})
@app.route("/plugins/<plugin>/versions/<version>")
def versioned_plugin(plugin: str, version: str = None) -> Response:
    return jsonify(plugin_model.get_plugin(plugin, version))


@app.route("/plugin/home/sections/<sections>")
def plugin_home_page_sections(sections: str = "") -> Response:
    unique_sections = set(sections.split(","))
    limit = int(request.args.get("limit", "3"))
    return jsonify(get_plugin_sections(unique_sections, limit))


@app.route("/manifest/<plugin>", defaults={"version": None})
@app.route("/manifest/<plugin>/versions/<version>")
def plugin_manifest(plugin: str, version: str = None) -> Response:
    manifest = get_manifest(plugin, version)

    if not manifest:
        return app.make_response(("Plugin does not exist", 404))

    if "error" not in manifest:
        return jsonify(manifest)

    error = manifest["error"]
    if error == "Manifest not yet processed.":
        response = app.make_response(
            (
                "Temporarily Unavailable. Attempting to build manifest. Please "
                "check back in 5 minutes.",
                503,
            )
        )
        response.headers["Retry-After"] = 300
        return response
    else:
        return app.make_response(
            ("Plugin Manifest Not Found. Manifest discovery failed.", 404)
        )


@app.route("/shields/<plugin>")
def shield(plugin: str) -> Response:
    return jsonify(get_shield(plugin))


@app.route("/plugins/excluded")
def get_exclusion_list() -> Response:
    return jsonify(get_excluded_plugins())


@app.route(
    "/categories",
    defaults={"version": os.getenv("category_version", "EDAM-BIOIMAGING:alpha06")}
)
def get_categories(version: str) -> Response:
    return jsonify(categories.get_all_categories(version))


@app.route(
    "/categories/<category>",
    defaults={"version": os.getenv("category_version", "EDAM-BIOIMAGING:alpha06")},
)
@app.route("/categories/<category>/versions/<version>")
def get_category(category: str, version: str) -> Response:
    return jsonify(categories.get_category(category, version))


@app.route("/metrics/<plugin>")
def get_plugin_metrics(plugin: str) -> Response:
    """
    Fetches plugin metrics for usage, and maintenance
    :return Response: A json object with entries for usage, and maintenance

    :params str plugin: Name of the plugin for which usage data needs to be fetched.
    :query_params limit: Number of months to be fetched for timeline. (default=12).
    """
    return jsonify(
        get_metrics_for_plugin(
            name=plugin,
            limit=request.args.get("limit", "12"),
        )
    )


@app.route("/collections")
def collections() -> Response:
    return get_collections()


@app.route("/collections/<collection>")
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
                  rule.rule.startswith("/collections"),
                  rule.rule.startswith("/metrics")))
             ]
    links.sort()
    links = "\n".join(links)
    return app.make_response((f"Invalid Endpoint, valid endpoints are:\n{links}", 404,
                              {'Content-Type': 'text/plain; charset=utf-8'}))


@app.errorhandler(exceptions.Unauthorized)
def handle_permission_exception(e) -> Response:
    logger.error(f"Unauthorized Access to endpoint {request.method} {request.endpoint}")
    return app.make_response(("Unauthorized Access", 401))


@app.errorhandler(Exception)
def handle_exception(e) -> Response:
    logger.error(f"An unexpected error has occurred in napari hub: {e}", e)
    send_alert(f"An unexpected error has occurred in napari hub: {e}")
    return app.make_response(("Internal Server Error", 500))


@github_app.on("workflow_run.completed")
def preview():
    move_artifact_to_s3(github_app.payload, github_app.installation_client)


@app.before_request
def authenticate_request():
    if request.method == "POST" and request.headers.get("X-API-Key") != os.getenv("API_KEY"):
        raise exceptions.Unauthorized("Invalid API key")


@app.after_request
def add_header(response):
    logger.info(f"{request.method} {request.full_path} {response.status}")
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


if __name__ == "__main__":
    app.run(port=12345)
