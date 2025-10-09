from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import query_model
from blueprints.maintenance.login_api import require_tab_id
from database import mapper

blp = Blueprint(
    "Neo4j query", __name__, description="Differend kind of queries"
)


@blp.route("cypher")
class Cypherquery(MethodView):
    @blp.arguments(
        query_model.QueryPostSchema, example=query_model.cypher_query_example
    )
    @blp.response(
        200,
        query_model.ResultSchema,
        example=query_model.cypher_result_example,
    )
    @require_tab_id()
    def post(self, query):
        """
        Query with arbitary cypher
        """

        querytext = query["querytext"]
        neo_res = g.conn.run(querytext)
        result = []

        for record in neo_res:
            api_record = {}
            for key in record.keys():
                val = record.get(key)
                api_record[key] = mapper.neoobject2grapheditor(val)
            result.append(api_record.items())
        return {"result": result}
