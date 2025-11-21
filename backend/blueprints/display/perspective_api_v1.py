from flask import abort, current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.display import perspective_model
from blueprints.maintenance.login_api import require_tab_id
from database.id_handling import get_base_id
from database.mapper import GraphEditorNode, GraphEditorRelation

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
        perspective_data['relation_ids'] = [
            get_base_id(rid) for rid in perspective_data['relation_ids']
        ]
        perspective_data['node_positions'] = {
            get_base_id(k): v
            for k, v in perspective_data['node_positions'].items()
        }
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
        persp_data = current_app.graph_db.get_perspective_by_id(pid)
        ge_nodes = {}
        for nid, node in persp_data['nodes'].items():
            ge_nodes[f"id::{nid}"] = GraphEditorNode.from_base_node(node)
        persp_data['nodes'] = ge_nodes
        ge_rels = {}
        for rid, rel in persp_data['relations'].items():
            ge_rels[f"id::{rid}"] = GraphEditorRelation.from_base_relation(rel)
        persp_data['relations'] = ge_rels
        return persp_data

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
        json_node['node_positions'] = {
            get_base_id(k): v
            for k, v in json_node['node_positions'].items()
        }

        json_node['node_positions'] = {
            get_base_id(k): v
            for k, v in json_node['node_positions'].items()
        }
        json_node['relation_ids'] = [
            get_base_id(rid)
            for rid in json_node['relation_ids']
        ]

        pid = current_app.graph_db.replace_perspective_by_id(
            pid, json_node)
        return {"id": pid}
