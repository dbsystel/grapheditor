from flask import g
from flask.views import MethodView
from flask_smorest import Blueprint
from marshmallow import Schema, fields
from blueprints.maintenance.login_api import require_tab_id

blp = Blueprint(
    "Requests", __name__, description="Allows manipulating ongoing requests."
)

class RequestDeleteSchema(Schema):
    terminated = fields.Int(
        metadata={
            "description": "Number of transactions terminated"
        },
    )

@blp.route("/<string:request_id>")
class RequestDelete(MethodView):
    @blp.response(200, RequestDeleteSchema)
    @require_tab_id()
    def delete(self, request_id):
        """Cancel a running cypher query by its request_id."""
        terminated = g.conn.stop(request_id)
        return {"terminated": terminated}
