from functools import wraps

from flask import abort, current_app, g, request, session
from flask.views import MethodView
from flask_smorest import Blueprint
import neo4j
from blueprints.maintenance import headers_model
from blueprints.maintenance import login_model
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


@blp.route("login")
class Login(MethodView):
    @blp.response(200, login_model.LoginGetResponseSchema)
    @require_tab_id()
    def get(self):
        """Get login information for the current tab/session."""
        neo4j_connect()
        if hasattr(g, "conn"):
            return {"host": g.conn.host, "username": g.conn.username}
        abort(401)

    @blp.arguments(
        login_model.LoginPostSchema,
        location="json",
        example=login_model.login_post_example,
    )
    @require_tab_id()
    def post(self, login_data):
        """Set login data for this tab_id."""
        if "login_data" not in session:
            session["login_data"] = dict()

        tab_id = (
            request.headers.get("x-tab-id")
            if "x-tab-id" in request.headers
            else None
        )
        if not tab_id:
            abort_with_json(401, "Request headers must have a x-tab-id entry")

        try:
            conn = Neo4jConnection(
                host=login_data["host"],
                username=login_data["username"],
                password=login_data["password"],
            )
        except neo4j.exceptions.DriverError as e:
            abort_with_json(401, f"Error connecting to Neo4j: {e}")
        if not conn.is_valid():
            abort_with_json(401, "Invalid host or user credentials")
        session["last_tab_id"] = tab_id
        session["login_data"][tab_id] = login_data

        return "Logged in"


@blp.route("logout")
class Logout(MethodView):
    @require_tab_id()
    def post(self):
        """Remove login_data for this tab_id, as well last_tab_id."""
        tab_id = (
            request.headers.get("x-tab-id")
            if "x-tab-id" in request.headers
            else None
        )
        if not tab_id:
            abort_with_json(401, "Request headers must have a x-tab-id entry")
        if "login_data" not in session:
            abort_with_json(401, "No login data in session")

        del session["login_data"][tab_id]
        del session["last_tab_id"]
        current_app.logger.info("Logged out")
        return "logged out"
