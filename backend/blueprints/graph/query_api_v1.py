from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import query_model
from blueprints.maintenance.login_api import require_tab_id
from database import mapper
from database.id_handling import get_base_id

blp = Blueprint(
    "Neo4j query", __name__, description="Differend kind of queries"
)


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
    def post(self, querytext, parameters=None):
        """
        Query with arbitary cypher
        """

        params = {
            k: get_base_id(v) if isinstance(v, str) else v
            for k, v in parameters.items()
        } if parameters else {}
        neo_res = g.conn.run(querytext, **params)
        result = []

        for record in neo_res:
            api_record = {}
            for key in record.keys():
                val = record.get(key)
                api_record[key] = mapper.neoobject2grapheditor(val)
            result.append(api_record.items())
        return {"result": result}
