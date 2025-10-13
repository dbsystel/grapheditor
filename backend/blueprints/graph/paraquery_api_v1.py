from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint
from blueprints.graph import paraquery_model
from blueprints.maintenance.login_api import require_tab_id

blp = Blueprint(
    "Parameterized queries", __name__, description="Work with queries with parameters."
)

@blp.route("")
class ParaQuery(MethodView):
    @blp.response(200, paraquery_model.ParaqueryResponseSchema)
    @require_tab_id()
    def get(self):
        paraqueries = current_app.graph_db.get_paraqueries()
        return {
            "paraqueries": paraqueries
        }
