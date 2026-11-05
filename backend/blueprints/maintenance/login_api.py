import uuid
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
from database.utils import abort_with_json, build_login_session_key
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
            # we remove tab_id/template_tab_id/request_id from arguments so that it doesn't
            # get passed to the handler.  We also don't pass arg to the function
            # if it's an empty dict, what happens when headers don't include
            # x-tab-id/x-template-tab-id.
            filtered_args = []
            for arg in args:
                if isinstance(arg, dict):
                    arg_copy = arg.copy()
                    arg_copy.pop("tab_id", None)
                    arg_copy.pop("template_tab_id", None)
                    arg_copy.pop("request_id", None)
                    arg = arg_copy
                if arg == {}:
                    continue
                filtered_args.append(arg)

            return f(parsed_args, *tuple(filtered_args), **kwargs)

        return inner_func

    return decorator


@blp.route("login")
class Login(MethodView):
    @blp.arguments(headers_model.HeaderSchema, location="headers", as_kwargs=False)
    @blp.response(200, login_model.LoginGetResponseSchema)
    def get(self, headers):
        """Get login information for the current tab/session.

        The request may contain a x-template-tab-id. In that case, a new
        tab id is generated (using the credentials store for the referred tab)
        and included in the response."""
        template_tab_id = headers.get("template_tab_id")
        tab_id = headers.get("tab_id")

        # If no x-tab-id is provided, it means the user wants to create
        # a new tab, possibly using a x-template-tab-id to derive the new
        # tab from. So we generate a fresh tab-id to return to it (tab IDs
        # are always generated on server side to provide strong unique IDs).
        if not tab_id:
            tab_id = str(uuid.uuid4())
        neo4j_connect(tab_id, template_tab_id)
        if hasattr(g, "conn"):
            response_body = {
                "host": g.conn.host,
                "username": get_username()
            }
            response_body["tabId"] = tab_id
            return response_body
        abort(401)

    @blp.arguments(
        login_model.LoginPostSchema,
        location="json",
        example=login_model.login_post_example,
    )
    @blp.response(200, login_model.LoginPostResponseSchema)
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

        A new tab id is always generated and returned in the response. I.o.w. 'x-tab-id'
        is ignored. This way we enforce that tab id is only generated on server side.
        ```
        """

        tab_id = str(uuid.uuid4())

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

        g.conn = conn

        # Store login data in session with the password encrypted, so it is
        # not readable in plaintext from the session file.
        session_login_data = dict(login_data)
        enc_key_str = request.cookies.get("enc_key")
        if not enc_key_str:
            enc_key_str = Fernet.generate_key().decode()
        if password := session_login_data.get("password"):
            session_login_data["password"] = encrypt_password(password, enc_key_str.encode())
        key = build_login_session_key(tab_id)
        session[key] = session_login_data
        response_body = {"username": get_username(), "host": host}
        response_body["tabId"] = tab_id
        response = make_response(response_body)
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
    def post(self, sso_logout: bool = False):
        """Remove login_data for this tab_id.
        This forces a new login call to request new login data (and
        not reuse login data from another tab)."""
        tab_id = (
            request.headers.get("x-tab-id")
            if "x-tab-id" in request.headers
            else None
        )
        if not tab_id:
            abort_with_json(401, "Request headers must have a x-tab-id entry")
        key = build_login_session_key(tab_id)
        if key not in session:
            abort_with_json(401, "No login data in session")

        session.pop(key, None)

        if sso_logout:
            current_app.logger.debug("SSO logout.")
            session.pop("oidc_auth_token", None)
        current_app.logger.info("Logged out")
        return "logged out"
