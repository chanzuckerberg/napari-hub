from apig_wsgi import make_lambda_handler
from flask import Flask, Response, jsonify
from .model import get_public_plugins, get_index, get_plugin, get_excluded_plugins, update_cache
from .shield import get_shield

app = Flask(__name__)
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
