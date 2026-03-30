#! /usr/bin/env python
import pprint

import multiprocessing
import os
import sys
import platform

import waitress
from flask import Flask, abort, request, current_app, g, send_from_directory, \
    redirect, render_template, session, url_for
from flask_cors import CORS
from flask_smorest import Api
from werkzeug._reloader import run_with_reloader
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.middleware.profiler import ProfilerMiddleware
from flask_session import Session
from authlib.common.security import generate_token

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
from blueprints.graph.paraquery_api_v1 import blp as paraquery_api
from blueprints.display.perspective_api_v1 import blp as perspective_api
from blueprints.display.style_api_v1 import blp as style_api
from blueprints.context_menu_api_v1 import blp as context_menu_api

from database.auth import oauth
from database.cypher_database import CypherDatabase
from database.neo4j_connection import neo4j_connect
from database.settings import config

from utils import basedir, get_customized_file_dir

root_folder = os.path.dirname(
    os.path.abspath(__file__)
)  # Example: current directory
sys.path.append(root_folder)
IS_FROZEN = getattr(sys, "frozen", False)
api_prefix = os.environ.get("GUI_API_PREFIX", "")

def custom_name():
    return request.headers.get("X-Custom","default")


def debug_text():
    return f"""

        <pre>

        {request.url}

        {request.headers}

        {pprint.pformat(dict(os.environ), indent=2)}

        </pre>
    """



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

def register_oauth():
    code_verifier = generate_token(48)
    oauth.register(
        name='oidc',
        client_id=app.config["OIDC_CLIENT_ID"],
        client_secret=app.config["OIDC_CLIENT_SECRET"],
        server_metadata_url=app.config["OIDC_METADATA_URL"],
        code_challenge_method='S256',
        code_verifier=code_verifier,
        # offline_access needed in order to get a refresh token
        client_kwargs={"scope": "openid profile email offline_access"}
    )
    oauth.init_app(app)

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
        "http://127.0.0.1:8008",
        "http://localhost:8008"
    ],
)
Session(app)

app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_prefix=1, x_for=1, x_host=1)

if config.profile_dir:
    # An error creating the profile directory cannot be recovered
    # gracefully, so let it crash if an exception occurs.
    print(f"Profiling to {config.profile_dir}")
    os.makedirs(config.profile_dir, exist_ok=True)
    app.wsgi_app = ProfilerMiddleware(app.wsgi_app, profile_dir=config.profile_dir)

api = Api(app)

api.register_blueprint(node_api, url_prefix=f"{api_prefix}/api/v1/nodes")

api.register_blueprint(relation_api, url_prefix=f"{api_prefix}/api/v1/relations")

if config.dev_mode:
    api.register_blueprint(dev_api, url_prefix=f"{api_prefix}/api/v1/dev")

api.register_blueprint(login_api, url_prefix=f"{api_prefix}/api/v1/session")

api.register_blueprint(database_api, url_prefix=f"{api_prefix}/api/v1/databases")

api.register_blueprint(meta_api, url_prefix=f"{api_prefix}/api/v1/meta")

api.register_blueprint(parallax_api, url_prefix=f"{api_prefix}/api/v1/parallax")

api.register_blueprint(paraquery_api, url_prefix=f"{api_prefix}/api/v1/paraqueries")

api.register_blueprint(query_api, url_prefix=f"{api_prefix}/api/v1/query")

api.register_blueprint(perspective_api, url_prefix=f"{api_prefix}/api/v1/perspectives")

api.register_blueprint(style_api, url_prefix=f"{api_prefix}/api/v1/styles")

api.register_blueprint(
    context_menu_api, url_prefix=f"{api_prefix}/api/v1/context-menu/actions"
)

api.register_blueprint(info_api, url_prefix=f"{api_prefix}/api/v1/info")

oauth_enabled = "OIDC_CLIENT_ID" in os.environ

# we don't mandate OAuth support. So if the env var OIDC_CLIENT_ID is
# set, we assume it's enabled and activate OAuth.
# It's an error if any required env var is missing, leading to a startup
# crash.
if oauth_enabled:
    app.config["OIDC_CLIENT_ID"] = os.environ.get("OIDC_CLIENT_ID", False)
    app.config["OIDC_CLIENT_SECRET"] = os.environ.get("OIDC_CLIENT_SECRET")
    app.config["OIDC_METADATA_URL"] = os.environ.get("OIDC_METADATA_URL")
    app.config["OIDC_REDIRECT_URL"] = os.environ.get("OIDC_REDIRECT_URL")
    register_oauth()


@app.route('/sso_login')
def sso_login():
    redirect_uri = app.config.get("OIDC_REDIRECT_URL") or url_for('authorize', _external=True)
    auth_uri = oauth.oidc.authorize_redirect(redirect_uri).location
    return {
        "authorizationUrl": auth_uri
    }


@app.route('/authorize')
def authorize():
    token = oauth.oidc.authorize_access_token()
    session["oidc_auth_token"] = token
    return redirect('/')


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
        "/api/v1/paraqueries",
        "/api/v1/perspectives",
        "/api/v1/query",
        "/api/v1/relations",
        "/api/v1/context-menu/actions",
    ]
    return request.method.lower() != "options" and (
        not request.path
        or any(r in request.path for r in routes_with_connection)
    )


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
        get_customized_file_dir("static"), "favicon.png"
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

if config.dev_mode:
    print("iga_debug_info configured")

    @app.route(f"{api_prefix}/api/iga_debug_info")
    @app.route(f"{api_prefix}/api/iga_debug_info/<path:subpath>")
    def debug_info(subpath=""):
        return f"""
    
        <pre>
        {subpath}
    """ + debug_text()



@app.route(f"{api_prefix}/api/files/<string:filename>")
def files(filename):
    customized_filedir = get_customized_file_dir()
    return send_from_directory(customized_filedir, filename)


if IS_FROZEN:

    @app.route(f"{api_prefix}/<path:path>")
    def gui(path):
        return send_from_directory(os.path.join(basedir, "gui"), path)


def run_server():
    app.debug = False
    waitress.serve(app,
                   listen=f"0.0.0.0:{config.port}",
                   outbuf_overflow=4194304,
                   outbuf_high_watermark=33554432,
                   inbuf_overflow=1048576,
                   connection_limit=512,
                   expose_tracebacks=True,
                   threads=8
                   )


def run_server_debug():
    print("run_server_debug")
    app.debug = True
    waitress.serve(app,
                   listen=f"0.0.0.0:{config.port}",
                   outbuf_overflow=4194304,
                   outbuf_high_watermark=33554432,
                   inbuf_overflow=1048576,
                   connection_limit=512,
                   expose_tracebacks=True,
                   threads=8)


if __name__ == "__main__":
    if IS_FROZEN:
        print(
            f"Welcome to GraphEditor!\n\n\
        GUI:     http://localhost:{config.port}/\n\
        Swagger: http://localhost:{config.port}/api/swagger"
        )
        run_server()

    # https://stackoverflow.com/questions/70396641/how-to-run-gunicorn-inside-python-not-as-a-command-line
    # On Linux default to gunicorn. You may still force using werkzeug by setting
    # the env variable GUI_FORCE_WERKZEUG.
    elif platform.uname().system.lower()=='linux' and not config.force_werkzeug:
        print("Detected Linux, Preparing gunicorn")

        # pylint: disable=import-error
        import gunicorn.app.base

        class StandaloneApplication(gunicorn.app.base.BaseApplication):
            # The example in gunicorn's documentation doesn't override "init"
            # either, so we disable the lint warning that it's missing.
            # pylint: disable=abstract-method
            def __init__(self, flaskapp, gu_options=None):
                self.options = gu_options or {}
                self.application = flaskapp
                super().__init__()

            def load_config(self):
                gu_config = {key: value for key, value in self.options.items()
                          if key in self.cfg.settings and value is not None}
                for key, value in gu_config.items():
                    self.cfg.set(key.lower(), value)

            def load(self):
                return self.application
        options = {
            'bind': f"0.0.0.0:{config.port}",
            'workers': multiprocessing.cpu_count() + 1,
            # 'threads': number_of_workers(),
            'timeout': 120,
        }
        StandaloneApplication(app, options).run()
    else:
        print(
            f"Welcome to GraphEditor!\n\n\
        GUI (d):     http://localhost:8080/\n\
        Swagger: http://localhost:{config.port}/api/swagger"

        )
        run_with_reloader(run_server_debug)
