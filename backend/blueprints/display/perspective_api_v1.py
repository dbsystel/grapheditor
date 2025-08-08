from flask import abort, current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.display import perspective_model
from blueprints.maintenance.login_api import require_tab_id

blp = Blueprint(
    "Perspectives",
    __name__,
    description="Handling of perspectives for persisting graph layouts",
)


@blp.route("")
class Perspectives(MethodView):
    @blp.arguments(
        perspective_model.PerspectivePostSchema,
        example=perspective_model.perspective_post_example,
    )
    @blp.response(200, perspective_model.PerspectivePostResponseSchema)
    @require_tab_id()
    def post(self, perspective_data):
        """
        Create a new perspective

        Returns the ID of the newly created.
        """
        pid = current_app.graph_db.create_perspective(perspective_data)
        if not pid:
            abort(400)
        return {"id": pid}


@blp.route("/<pid>")
class Perspective(MethodView):
    @blp.response(
        200,
        perspective_model.PerspectiveSchema,
        example=perspective_model.perspective_get_example,
    )
    @require_tab_id()
    def get(self, pid: str):
        """
        Get a perspective by id.

        Returns an object containing nodes and their positions, as well
        relations.
        """
        return current_app.graph_db.get_perspective_by_id(pid)

    @blp.arguments(
        perspective_model.PerspectivePutSchema,
        example=perspective_model.perspective_post_example,
    )
    @blp.response(200, perspective_model.PerspectivePostResponseSchema)
    @require_tab_id()
    def put(self, json_node, pid: str):
        """
        Full update of a perspective.

        Returns the ID of the perspective.
        """
        current_app.graph_db.get_perspective_by_id(pid)

        pid = current_app.graph_db.replace_perspective_by_id(pid, json_node)
        return {"id": pid}
