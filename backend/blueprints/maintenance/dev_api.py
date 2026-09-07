import sys
import os
import time

from flask import current_app, g
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import Schema, fields

from blueprints.maintenance.login_api import require_tab_id
from database.utils import abort_with_json, split_statements
from database.neo4j_connection import get_current_datatabase_name, set_current_database_name

blp = Blueprint("Dev tools", __name__, description="For development only")
TIMEOUT_LIMIT = 200

class DevResetSchema(Schema):
    host = fields.Str(
        required=False,
        load_default="neo4j://localhost:7687",
        metadata = {
            "description": """The host address where the target database lies.
            It must match the host from the logged user. This is actually meant as an extra check
            to avoid resetting the wrong database.
            """,
            "example": "neo4j://localhost:7687",
        }
    )
    database = fields.Str(
        required=False,
        load_default="neo4j",
        metadata = {
            "description": "The name of the database to be reset.",
            "example": "neo4j",
        }
)


def _reset_graph():
    g.conn.run("MATCH (n) DETACH DELETE n;")
    # without a commit we sometimes get an error that one can't update
    # data and change the schema in a single transaction. So we force
    # it here.
    g.conn.commit()


def _run_file(filename, **params) -> None:
    """Run file containing cypher commands. If transform_func is given, apply
    it to the file contents before executing the contained cypher statements.
    This allow a.o.t. replacing placeholders by some text."""
    file_path = os.path.join(os.environ["GRAPHEDITOR_BASEDIR"], filename)
    current_app.logger.debug(f'Running cypher file {file_path}')
    with open(file_path, encoding="utf-8") as file:
        statements = split_statements(file.read().strip())
        for statement in statements:
            if "// commit" in statement:
                g.conn.commit()

            if statement:
                g.conn.run(statement, **params)
                # time.sleep(0.5)
    g.conn.commit()


@blp.route("/transaction_test")
class Test(MethodView):
    @require_tab_id()
    def get(self):
        """
        Quick test if transactions work
        """
        r = g.conn.run('Create (n:TransactionTest {name: "test"}) return n')
        n = r.single()["n"]
        print(n)
        print(n.id)
        return "hello world"


@blp.route("/generate_ft")
class SetupNeo4j(MethodView):
    @require_tab_id()
    def get(self):
        """Compute _ft__tech_ for nodes and relations."""
        _run_file("cypher/generate_ft.cypher")
        return "_ft__tech_ properties generated."


@blp.route("/reset")
class Reset(MethodView):
    @blp.arguments(
        DevResetSchema,
        location="query",
        as_kwargs=True
    )
    @require_tab_id()
    def get(self, host:str, database:str):
        """
        Reset database

        Cleans the whole database, creates alice and bob nodes.
        """

        if host != g.conn.host:
            abort_with_json(
                409,
                f"Target host '{host}' doesn't match connection's host: '{g.conn.host}'."
            )

        cur_db = get_current_datatabase_name()
        if not cur_db:
            # if cur_db is None, the user is using the default database. We need an extra
            # query for fetching its name.
            db_info = g.conn.get_database(cur_db)
            cur_db = db_info["name"]

        if not cur_db:
            abort_with_json(
                409,
                "Can't retrieve the current database for the user."
                "Check if the user has at least a default database set."
            )

        if cur_db != database:
            abort_with_json(
                409,
                f"Target database '{database}' doesn't match selected database: '{cur_db}'"
            )

        set_current_database_name(database)

        _reset_graph()

        _run_file("cypher/install_grapheditor_functions_and_procedures.cypher",
                  databases = [database])

        # wait until custom functions/procedures are installed, otherwise
        # triggers can be installed first and cause issues when manipulating
        # data.
        counter = 0
        while not g.conn.has_ft():
            if counter >= TIMEOUT_LIMIT:
                abort_with_json(500, "Timeout installing functions/procedures.")
            counter = counter + 1
            current_app.logger.debug(
                f"Waiting for function/procedure installation since {counter} seconds."
            )
            # if we don't commit here, has_ft is executed in the same transaction, returning
            # always the same result.
            g.conn.commit()
            time.sleep(1)
        current_app.logger.info("GraphEditor functions/procedures installed.")

        _run_file("cypher/install_grapheditor_triggers.cypher", databases = [database])

        # triggers must be installed before adding data.
        counter = 0
        while not g.conn.has_iga_triggers():
            if counter >= TIMEOUT_LIMIT:
                abort_with_json(500, "Timeout installing triggers.")
            counter = counter + 1
            current_app.logger.debug(
                f"Waiting for trigger installation since {counter} seconds."
            )
            g.conn.commit()
            time.sleep(1)
        current_app.logger.info("GraphEditor triggers installed.")

        _run_file("cypher/reset_dummy_data.cypher")
        # force computation of ft and uid, since trigger may be not active yet.
        _run_file("cypher/generate_uuid.cypher")
        _run_file("cypher/generate_ft.cypher")
        set_current_database_name(cur_db)

        return f"Database '{database}' at '{host}' successfully reset."


@blp.route("/osm_data")
class ResetWithOSMData(MethodView):
    @blp.arguments(
        DevResetSchema,
        location="query"
    )
    @require_tab_id()
    def get(self):
        """
        Rewrites the osm example data
        """
        _reset_graph()

        with open(
            os.path.join(
                os.environ["GRAPHEDITOR_BASEDIR"], "cypher/osm_example_data.cypher"
            ),
            encoding="utf-8",
        ) as file:
            statements = file.read().strip().split(";\n")
            for i, statement in enumerate(statements):
                print(f"line {i}")
                sys.stdout.flush()
                if statement:
                    g.conn.run(statement)
                    g.conn.commit()

        _run_file("cypher/generate_ft.cypher")

        return "OSM data done"
