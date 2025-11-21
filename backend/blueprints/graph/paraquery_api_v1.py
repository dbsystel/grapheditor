from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint
from blueprints.graph import query_model
from blueprints.graph import paraquery_model
from blueprints.maintenance.login_api import require_tab_id
from blueprints.graph.query_api_v1 import execute_query
from database.utils import abort_with_json

blp = Blueprint(
    "Parameterized queries", __name__, description="Work with queries with parameters."
)

@blp.route("")
class ParaQuery(MethodView):
    @blp.response(200, paraquery_model.ParaqueryResponseSchema)
    @require_tab_id()
    def get(self):
        "Return a map of paraquery ID's to their contents."
        paraqueries = current_app.graph_db.get_paraqueries()
        return {
            "paraqueries": paraqueries
        }

    @blp.arguments(
        paraquery_model.ParaqueryPostSchema, as_kwargs=True
    )
    @blp.response(
        200,
        query_model.ResultSchema,
        example=query_model.cypher_result_example,
    )
    @require_tab_id()
    def post(self, uuid=None, name=None, db_id=None, parameters=None):
        """Execute an specific paraquery optionally with parameters.

        Given an UUID, name oder ID of a paraquery, execute it on
        the server. You can pass a map of parameter names to their
        corresponding values if the paraquery requires parameters.

        You should provide only one of the values UUID, ID or name. The
        server won't return an error though if multiple, possibly
        inconsistent values are provided.
        """
        paraquery_node = None
        if uuid:
            nodes = current_app.graph_db.get_nodes_by_uuids([uuid])
            if nodes:
                paraquery_node = nodes[uuid]
        elif db_id:
            paraquery_node = current_app.graph_db.get_node_by_id(db_id)
        elif name:
            nodes = current_app.graph_db.get_nodes_by_names(
                [name],
                filters={"labels": ["MetaLabel::Paraquery__tech_"]}
            )
            if nodes:
                paraquery_node = nodes[name]
        else:
            abort_with_json(
                400,
                "You must provide either an uuid, id or a name of the paraquery to be executed."
            )

        if not paraquery_node:
            abort_with_json(400, 'No Paraquery with the given uuid/name found.')

        query_text = paraquery_node.properties["cypher__tech_"]

        return execute_query(query_text, parameters)
