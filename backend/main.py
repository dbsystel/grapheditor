#! /usr/bin/env python
import os
import sys
import traceback

import waitress
from flask import Flask, abort, request, current_app, g, send_from_directory, render_template
from flask_cors import CORS
from flask_smorest import Api
from werkzeug._reloader import run_with_reloader
from werkzeug.middleware.proxy_fix import ProxyFix
from flask_session import Session
import neo4j.exceptions

from blueprints.display.style_support import load_default_style
from blueprints.maintenance.info_api_v1 import blp as info_api
from blueprints.maintenance.database_api import blp as database_api
from blueprints.maintenance.dev_api import blp as dev_api
from blueprints.maintenance.login_api import blp as login_api
from blueprints.graph.node_api_v1 import blp as node_api
from blueprints.graph.relation_api_v1 import blp as relation_api
from blueprints.graph.meta_api_v1 import blp as meta_api
from blueprints.graph.query_api_v1 import blp as query_api
from blueprints.graph.parallax_api_v1 import blp as parallax_api
from blueprints.display.perspective_api_v1 import blp as perspective_api
from blueprints.display.style_api_v1 import blp as style_api
from blueprints.context_menu_api_v1 import blp as context_menu_api

from database.cypher_database import CypherDatabase
from database.neo4j_connection import neo4j_connect
from database.settings import config

basedir = os.path.dirname(__file__)
root_folder = os.path.dirname(
    os.path.abspath(__file__)
)  # Example: current directory
sys.path.append(root_folder)
IS_FROZEN = getattr(sys, "frozen", False)
api_prefix = os.environ.get("GUI_API_PREFIX", "")

# accessing _MEIPASS seems to be the way for dealing with frozen:
# pylint: disable=protected-access

if IS_FROZEN:
    static_folder = os.path.join(sys._MEIPASS, "static")
    template_folder = os.path.join(sys._MEIPASS, "flask_smorest", "templates")
    basedir = sys._MEIPASS
    app = Flask(
        __name__,
        static_url_path="/static",
        static_folder=static_folder,
        template_folder=template_folder,
    )
else:
    app = Flask(__name__, static_url_path="/static", static_folder="static")

os.environ["GRAPHEDITOR_BASEDIR"] = basedir

app.json.sort_keys = False

app.config["CORS_HEADERS"] = ["Content-Type", "X-Tab-Id"]
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_FILE_DIR"] = "sessions"

app.config["API_TITLE"] = "GraphEditor API"
app.config["API_VERSION"] = "0.1"
app.config["OPENAPI_VERSION"] = "3.0.3"
app.config["OPENAPI_URL_PREFIX"] = f"{api_prefix}/api/"

app.config["OPENAPI_REDOC_PATH"] = "/redoc"
app.config["OPENAPI_REDOC_URL"] = (
    "https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"
)
app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger"
app.config["OPENAPI_SWAGGER_UI_URL"] = (
    "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"
)
app.config["OPENAPI_RAPIDOC_PATH"] = "/rapidoc"
app.config["OPENAPI_RAPIDOC_URL"] = (
    "https://unpkg.com/rapidoc/dist/rapidoc-min.js"
)

app.logger.setLevel(config.log_level)

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8000",
    ],
)
Session(app)

app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_prefix=1, x_for=1, x_host=1)


api = Api(app)

api.register_blueprint(node_api, url_prefix=f"{api_prefix}/api/v1/nodes")

api.register_blueprint(relation_api, url_prefix=f"{api_prefix}/api/v1/relations")

if config.dev_mode:
    api.register_blueprint(dev_api, url_prefix=f"{api_prefix}/api/v1/dev")

api.register_blueprint(login_api, url_prefix=f"{api_prefix}/api/v1/session")

api.register_blueprint(database_api, url_prefix=f"{api_prefix}/api/v1/databases")

api.register_blueprint(meta_api, url_prefix=f"{api_prefix}/api/v1/meta")

api.register_blueprint(parallax_api, url_prefix=f"{api_prefix}/api/v1/parallax")

api.register_blueprint(query_api, url_prefix=f"{api_prefix}/api/v1/query")

api.register_blueprint(perspective_api, url_prefix=f"{api_prefix}/api/v1/perspectives")

api.register_blueprint(style_api, url_prefix=f"{api_prefix}/api/v1/styles")

api.register_blueprint(
    context_menu_api, url_prefix=f"{api_prefix}/api/v1/context-menu/actions"
)

api.register_blueprint(info_api, url_prefix=f"{api_prefix}/api/v1/info")


# Make sure that transactions are finished etc.
@app.teardown_appcontext
def close_connection(exception):
    app.logger.debug("closing transaction")
    if hasattr(g, "conn"):
        g.conn.close(exception)


def route_requires_connection():
    routes_with_connection = [
        "/api/v1/context_actions",
        "/api/v1/databases",
        "/api/v1/dev",
        "/api/v1/meta",
        "/api/v1/nodes",
        "/api/v1/parallax",
        "/api/v1/perspectives",
        "/api/v1/query",
        "/api/v1/relations",
        "/api/v1/context-menu/actions",
    ]
    return request.method.lower() != "options" and (
        not request.path
        or any(r in request.path for r in routes_with_connection)
    )


@app.errorhandler(neo4j.exceptions.ClientError)
@app.errorhandler(neo4j.exceptions.DriverError)
def neo4j_exception_handler(error):
    """Log and propagate Neo4j error messages to the client if possible.

    As usual, the user can enable sending detailed error messages to
    the client by setting the GUI_DEV_MODE or GUI_SEND_ERROR_MESSAGES env
    vars.
    """
    # In case a TransactionError is caused by another exception like
    # a CypherSyntaxError, we want to show it's contents too
    message = f"{repr(error)}\n{repr(error.__cause__)}"

    # we also log the stacktrace (and should consider doing this on other
    # places too)
    current_app.logger.error(f"{message}\n{traceback.format_exc()}")

    if config.dev_mode or config.send_error_messages:
        return {"message": message}, 400
    return "Bad request", 400


@app.before_request
def load_metamodels():
    if route_requires_connection():
        if "x-tab-id" not in request.headers:
            abort(401)
        current_app.graph_db = CypherDatabase()
        neo4j_connect()
        current_app.graph_db.load_metamodels()


@app.before_request
def prepare_style():
    """Load default style settings.

    This is executed on each request in order to always have an up-to-date
    style configuration.
    """
    load_default_style()


@app.route("/")
@app.route("/search")
@app.route(f"{api_prefix}/api/")
def index():
    # Entry point
    if IS_FROZEN:
        return send_from_directory(os.path.join(basedir, "gui"), "index.html")
    return render_template("index.html")


@app.route(f"{api_prefix}/favicon.ico")
def favicon():
    # Returns the favicon
    return send_from_directory(
        os.path.join(basedir, "static"), "favicon.png"
    )


@app.route(f"{api_prefix}/gui")
def gui_index():
    return send_from_directory(os.path.join(basedir, "gui"), "index.html")


@app.route(f"{api_prefix}/assets/<path:path>")
def assets(path):
    return send_from_directory(os.path.join(basedir, "gui", "assets"), path)


@app.route(f"{api_prefix}/images/<path:path>")
def images(path):
    return send_from_directory(os.path.join(basedir, "gui", "images"), path)


if IS_FROZEN:

    @app.route(f"{api_prefix}/<path:path>")
    def gui(path):
        return send_from_directory(os.path.join(basedir, "gui"), path)


def run_server():
    app.debug = False
    waitress.serve(app, listen=f"0.0.0.0:{config.port}")


def run_server_debug():
    app.debug = True
    waitress.serve(app, listen=f"0.0.0.0:{config.port}")


if __name__ == "__main__":
    if IS_FROZEN:
        print(
            f"Welcome to GraphEditor!\n\n\
        GUI:     http://localhost:{config.port}/\n\
        Swagger: http://localhost:{config.port}/api/swagger"
        )
        run_server()
    else:
        print(
            f"Welcome to GraphEditor!\n\n\
        GUI:     http://localhost:8080/\n\
        Swagger: http://localhost:{config.port}/api/swagger"
        )
        run_with_reloader(run_server_debug)
