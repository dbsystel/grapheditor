from functools import wraps
from flask import abort, current_app, g, redirect, request, session
from flask.views import MethodView
from flask_smorest import Blueprint
import neo4j
from blueprints.maintenance import headers_model
from blueprints.maintenance import login_model
from database.auth import oauth, ensure_valid_token
from database.neo4j_connection import Neo4jConnection, neo4j_connect
from database.utils import abort_with_json

blp = Blueprint("Login", __name__, description="Authentication functionality")

def require_tab_id():
    """Simple decorator to mandate 'x-tab-id' in the HTTP header without
    requiring the function to have an extra argument for it. x-tab-id
    is used in the 'load_metamodels' as a before_request function.
    """

    def decorator(f):
        @wraps(f)
        @blp.arguments(headers_model.HeaderSchema, location="headers")
        def inner_func(parsed_args, *args, **kwargs):
            # we remove tab_id from arguments so that it doesn't get
            # passed to the handler.  We also don't pass arg to the
            # function if it's an empty dict, what happens when
            # headers don't include x-tab-id.
            filtered_args = tuple(
                arg
                for arg in args
                if not arg == {}
                and not (isinstance(arg, dict) and "tab_id" in arg)
            )
            return f(parsed_args, *filtered_args, **kwargs)

        return inner_func

    return decorator


def _get_username():
    username = g.conn.username if hasattr(g.conn, "username") else None
    if not username and g.conn.token:
        # try several keys
        userinfo = oauth.oidc.userinfo(token = g.conn.token)
        if not userinfo:
            abort_with_json(401, "Missing userinfo")
        # starting with email helps to distinguish from a regular
        # login using username/password.
        for key in ['email', 'name', 'sub']:
            if val := userinfo.get(key):
                username = val
                break
    return username


@blp.route("login")
class Login(MethodView):
    @blp.response(200, login_model.LoginGetResponseSchema)
    @require_tab_id()
    def get(self):
        """Get login information for the current tab/session."""
        neo4j_connect()
        if hasattr(g, "conn"):
            return {
                "host": g.conn.host,
                "username": _get_username()
            }
        abort(401)

    @blp.arguments(
        login_model.LoginPostSchema,
        location="json",
        example=login_model.login_post_example,
    )
    @blp.response(200, login_model.LoginPostResponseSchema)
    @require_tab_id()
    def post(self, login_data):
        """Set login data for this tab_id.
        Two login options are possible, which are chosen depending on the contents
        of the JSON body.

        - OAuth/OIDC:
        ```
        {
            "host": <STRING>,
            "useToken": true
        }
        ```
          Other fields are ignored.

        - Username/Password
        ```
        {
            "host": <STRING>,
            "username": <STRING>,
            "password": <STRING>
        }
        ```
        """
        tab_id = (
            request.headers.get("x-tab-id")
            if "x-tab-id" in request.headers
            else None
        )
        if not tab_id:
            abort_with_json(401, "Request headers must have a x-tab-id entry")
        token = None
        host = login_data.get("host")
        # In order for SSO to work, both the Neo4j-Server and Flask (see OIDC_ vars in
        # .env) must be properly configured.
        if login_data.get("useToken", False):
            if "oidc_auth_token" not in session:
                current_app.logger.info("Missing token, redirecting to SSO login.")
                return redirect("/sso_login")
            # update session token
            token = ensure_valid_token()
        try:
            conn = Neo4jConnection(
                host=login_data["host"],
                username=login_data.get("username"),
                password=login_data.get("password"),
                token=token)
        except neo4j.exceptions.DriverError as e:
            abort_with_json(401, f"Error connecting to Neo4j: {e}")
        if not conn.is_valid():
            abort_with_json(401, "Invalid host or user credentials")

        session["last_tab_id"] = tab_id
        g.conn = conn

        # login successful, persist connection data into session.
        if "login_data" not in session:
            session["login_data"] = dict()
        session["login_data"][tab_id] = login_data
        return {
            "username": _get_username(),
            "host": host
        }


@blp.route("logout")
class Logout(MethodView):
    @blp.arguments(
        login_model.LogoutPostResponseSchema,
        as_kwargs=True,
        location="json"
    )
    @require_tab_id()
    def post(self, sso_logout: bool = False):
        """Remove login_data for this tab_id, as well last_tab_id.
        This forces a new login call to request new login data (and
        not reuse login data from another tab)."""
        tab_id = (
            request.headers.get("x-tab-id")
            if "x-tab-id" in request.headers
            else None
        )
        if not tab_id:
            abort_with_json(401, "Request headers must have a x-tab-id entry")
        if "login_data" not in session:
            abort_with_json(401, "No login data in session")

        session["login_data"].pop(tab_id, None)
        session.pop("last_tab_id", None)
        if sso_logout:
            current_app.logger.debug("SSO logout.")
            session.pop("oidc_auth_token", None)
        current_app.logger.info("Logged out")
        return "logged out"
