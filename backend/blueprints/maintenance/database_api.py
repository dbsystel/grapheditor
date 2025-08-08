from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.maintenance import database_model
from blueprints.maintenance.login_api import require_tab_id
from database.neo4j_connection import (
    get_current_datatabase_name,
    set_current_database_name,
)
from database.utils import abort_with_json

blp = Blueprint(
    "Neo4j databases",
    __name__,
    description="Provide access database information in a " "Neo4j Server",
)


@blp.route("")
class Databases(MethodView):
    @blp.response(200, database_model.DatabasesGetSchema)
    @require_tab_id()
    def get(self):
        """Return all online databases available."""
        db_infos = g.conn.get_databases()
        return {"databases": db_infos}


@blp.route("/current")
class DatabaseCurrent(MethodView):
    @blp.response(200, database_model.DatabaseSchema)
    @require_tab_id()
    def get(self):
        """Get database being used by the current tab_id."""
        db_name = get_current_datatabase_name()
        db = g.conn.get_database(db_name)
        return db

    @blp.arguments(database_model.DatabaseCurrentPostSchema, as_kwargs=True)
    @require_tab_id()
    def post(self, name):
        """Set database used by requests for the current tab_id."""
        if hasattr(g, "conn"):
            if not g.conn.is_database_available(name):
                abort_with_json(409, f"{name} not available")

            set_current_database_name(name)
        return f"Database {name} selected."
