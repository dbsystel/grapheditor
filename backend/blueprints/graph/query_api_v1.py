import traceback
from flask import g, current_app
from flask.views import MethodView
from flask_smorest import Blueprint
import neo4j.exceptions

from blueprints.graph import query_model
from blueprints.maintenance.login_api import require_tab_id
from database import mapper
from database.id_handling import get_base_id
from database.utils import abort_with_json

blp = Blueprint(
    "Neo4j query", __name__, description="Differend kind of queries"
)

# don't need a return after abort_with_json
# pylint: disable=inconsistent-return-statements
def execute_query(query_text:str, parameters:dict=None):
    raw_parameters = {
        k: get_base_id(v) if isinstance(v, str) else v
        for k, v in parameters.items()
    } if parameters else {}
    try:
        neo_result = g.conn.run(query_text, **raw_parameters)
        result = []
        for record in neo_result:
            api_record = {}
            for key in record.keys():
                val = record.get(key)
                obj = mapper.neoobject2grapheditor(val)
                if isinstance(obj, (mapper.GraphEditorNode, mapper.GraphEditorRelation)):
                    # https: // stackoverflow.com / q / 52229521
                    api_record[key] = obj.__dict__.copy()
                else:
                    api_record[key] = obj
            result.append(api_record.items())
        return {"result": list(result)}
    except neo4j.exceptions.ClientError as e:
        message = f"{repr(e)}\n{repr(e.__cause__)}"
        # we also log the stacktrace (and should consider doing this on other
        # places too)
        current_app.logger.error(f"{message}\n{traceback.format_exc()}")
        abort_with_json(400, message)


@blp.route("cypher")
class Cypherquery(MethodView):
    @blp.arguments(
        query_model.QueryPostSchema, example=query_model.cypher_query_example,
        as_kwargs=True
    )
    @blp.response(
        200,
        query_model.ResultSchema,
        example=query_model.cypher_result_example,
    )
    @require_tab_id()
    def post(self, querytext, parameters:dict=None):
        """
        Query with arbitary cypher
        """

        return execute_query(querytext, parameters)
