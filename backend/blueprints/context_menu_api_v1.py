from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints import context_menu_model
from blueprints.maintenance.login_api import require_tab_id

blp = Blueprint(
    "Context menu actions",
    __name__,
    description="Provide actions to context menus",
)


@blp.route("")
class ContextMenuAction(MethodView):
    @blp.arguments(
        context_menu_model.ContextMenuPostSchema,
        as_kwargs=True,
        location="json",
        example=context_menu_model.actions_post_example,
    )
    @blp.response(
        200,
        context_menu_model.ContextMenuPostResponseSchema,
        example=context_menu_model.actions_post_response_example,
    )
    @require_tab_id()
    def post(self, node_ids, relation_ids):
        """Get context menu actions possible on the given nodes and
        relations."""
        # ignore other kinds of IDs for now
        nodes = list(current_app.graph_db.get_nodes_by_ids(node_ids).values())
        relations = list(
            current_app.graph_db.get_relations_by_ids(relation_ids).values()
        )

        actions = context_menu_model.select_actions(nodes, relations)

        return {"actions": actions}
