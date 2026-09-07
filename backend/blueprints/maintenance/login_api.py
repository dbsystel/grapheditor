from functools import wraps
from flask import abort, current_app, g, make_response, redirect, request, session
from flask.views import MethodView
from flask_smorest import Blueprint
import neo4j
from cryptography.fernet import Fernet
from blueprints.maintenance import headers_model
from blueprints.maintenance import login_model
from database.auth import get_username, ensure_valid_token, encrypt_password, LoginRequired
from database.neo4j_connection import Neo4jConnection, neo4j_connect
from database.utils import abort_with_json
from database.settings import config

blp = Blueprint("Login", __name__, description="Authentication functionality")

def require_tab_id():
    """Simple decorator to mandate 'x-tab-id' in the HTTP header without
    requiring the function to have an extra argument for it. x-tab-id
    is used in the 'prepare_connection' as a before_request function.
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
                "username": get_username()
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

        use_token = False
        if login_data.get("useToken", False):
            if "oidc_auth_token" not in session:
                current_app.logger.info("Missing token, redirecting to SSO login.")
                return redirect("/sso_login")
            # update session token
            try:
                use_token = True
                token = ensure_valid_token()
            except LoginRequired:
                # Stale or corrupt token — clear it and restart the SSO flow.
                session.pop("oidc_auth_token", None)
                current_app.logger.info("Corrupt token cleared, redirecting to SSO login.")
                return redirect("/sso_login")
        try:
            conn = Neo4jConnection(
                host=login_data["host"],
                username=login_data.get("username"),
                password=login_data.get("password"),
                token=token,
                use_token=use_token)
        except neo4j.exceptions.DriverError as e:
            abort_with_json(401, f"Error connecting to Neo4j: {e}")
        if not conn.is_valid():
            abort_with_json(401, "Invalid host or user credentials")

        session["last_tab_id"] = tab_id
        g.conn = conn

        # Store login data in session with the password encrypted, so it is
        # not readable in plaintext from the session file.
        if "login_data" not in session:
            session["login_data"] = dict()
        session_login_data = dict(login_data)
        enc_key_str = request.cookies.get("enc_key")
        if not enc_key_str:
            enc_key_str = Fernet.generate_key().decode()
        if password := session_login_data.get("password"):
            session_login_data["password"] = encrypt_password(password, enc_key_str.encode())
        session["login_data"][tab_id] = session_login_data
        response = make_response({"username": get_username(), "host": host})
        response.set_cookie(
            "enc_key",
            enc_key_str,
            httponly=True,
            samesite="Strict",
            secure=config.https_enabled
        )
        return response


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
