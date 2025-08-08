import sys
import os
import time

from flask import current_app, g
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.maintenance.login_api import require_tab_id

blp = Blueprint("Dev tools", __name__, description="For development only")


def run_file(filename):
    file_path = os.path.join(os.environ["GRAPHEDITOR_BASEDIR"], filename)
    current_app.logger.debug(f'Running cypher file {file_path}')
    with open(file_path, encoding="utf-8") as file:
        statements = file.read().strip().split(";\n")
        for statement in statements:
            if "// commit" in statement:
                g.conn.commit()

            if statement:
                g.conn.run(statement)
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
        run_file("cypher/generate_ft.cypher")
        return "_ft__tech_ properties generated."


@blp.route("/reset")
class Reset(MethodView):
    @require_tab_id()
    def get(self):
        """
        Reset database

        Cleans the whole database, creates alice and bob nodes.
        """

        g.conn.run("MATCH (n) DETACH DELETE n;")
        # without a commit we sometimes get an error that one can't update
        # data and change the schema in a single transaction. So we force
        # it here.
        g.conn.commit()

        run_file("cypher/install_grapheditor_functions_and_procedures.cypher")
        run_file("cypher/install_grapheditor_triggers.cypher")

        while not g.conn.has_ft():
            time.sleep(1)

        run_file("cypher/reset_dummy_data.cypher")
        # force computation of ft and uid, since trigger may be not active yet.
        run_file("cypher/generate_uuid.cypher")
        run_file("cypher/generate_ft.cypher")

        return "Reset done, objects created"


@blp.route("/osm_data")
class ResetWithOSMData(MethodView):
    @require_tab_id()
    def get(self):
        """
        Rewrites the osm example data
        """

        run_file("cypher/reset_graph.cypher")

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

        run_file("cypher/generate_ft.cypher")

        return "OSM data done"
