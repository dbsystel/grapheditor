from flask import abort, current_app, g, session
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.maintenance.login_api import require_tab_id
from blueprints.graph import node_model
from blueprints.graph import relation_model
from database.mapper import GraphEditorNode, GraphEditorRelation, prepare_node_patch
from database.id_handling import (
    compute_semantic_id, get_base_id, GraphEditorLabel, parse_semantic_id, id_is_valid
)
from database.utils import abort_with_json


blp = Blueprint(
    "Neo4j nodes", __name__, description="Works with every neo4j database"
)


@blp.route("")
class Nodes(MethodView):
    @blp.arguments(node_model.NodePostSchema, example=node_model.node_post_example)
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def post(self, node_data):
        """
        Create a new node

        Returns the newly created node
        """
        new_nodes = current_app.graph_db.create_nodes(
            [prepare_node_patch(node_data)])
        if not new_nodes:
            abort_with_json(500, "Couldn't create node.")
        return GraphEditorNode.from_base_node(next(iter(new_nodes.values())))

    @blp.arguments(node_model.NodeQuery, as_kwargs=True, location="query")
    @blp.response(
        200,
        node_model.NodeSchema(many=True),
        example=[node_model.node_example],
    )
    @require_tab_id()
    def get(self, text="", labels=None, pseudo=None):
        """
        Fulltext query accross all nodes.

        Returns a list of nodes.
        """
        if labels is None:
            labels = []
        # TODO should we return a map as in other endpoints?
        nodes = [
            GraphEditorNode.from_base_node(base_node)
            for base_node in
            current_app.graph_db.query_nodes(
                text,
                [get_base_id(l) for l in labels],
                pseudo)
        ]
        return nodes


@blp.route("/bulk_fetch")
class NodesBulkFetch(MethodView):
    @blp.arguments(
        node_model.NodeBulkFetchSchema, as_kwargs=True, location="json"
    )
    @blp.response(200, node_model.NodeBulkFetchResponseSchema)
    @require_tab_id()
    def post(self, ids):
        """
        Fetch multiple nodes by the corresponding IDs at once.

        We use POST instead of GET to avoid limitations of passing ID's as
        query parameters.

        Return a dictionary mapping node IDs to the corresponding nodes.
        """
        base_nodes_map = current_app.graph_db.get_nodes_by_ids(ids)

        nodes = {
            k: GraphEditorNode.from_base_node(base_node)
            for k, base_node in
            base_nodes_map.items()
        }
        for nid, node in nodes.items():
            if parse_semantic_id(nid):
                node.id = nid

        for nid in ids:
            # semantic ids are still returned if replace_pseudo_node is true
            if nid not in nodes:
                sem_node = GraphEditorNode.create_pseudo_node(nid)
                if sem_node:
                    nodes[nid] = sem_node

        return dict(nodes=dict(sorted(nodes.items(), key=lambda i: getattr(i[1],"title",""))))


@blp.route("/bulk_delete")
class NodesBulkDelete(MethodView):
    @blp.arguments(
        node_model.NodeBulkDeleteSchema, as_kwargs=True, location="json"
    )
    @require_tab_id()
    def delete(self, ids):
        """
        Delete multiple nodes by the corresponding IDs at once.

        Return a dictionary containing the number of nodes deleted.
        """
        num_deleted = current_app.graph_db.delete_nodes_by_ids(ids)
        return dict(
            num_deleted=num_deleted, message=f"Deleted {num_deleted} nodes"
        )


@blp.route("/bulk_patch")
class NodesBulkPatch(MethodView):
    @blp.arguments(
        node_model.NodeBulkPatchSchema, as_kwargs=True, location="json"
    )
    @blp.response(200, node_model.NodeBulkFetchResponseSchema)
    @require_tab_id()
    def patch(self, patches):
        """
        Update multiple nodes at once.

        Each patch must contain the corresponding ID.
        Return a map of the given node IDs to the new node objects.
        """
        id_map = current_app.graph_db.ids_to_raw_db_ids([p["id"] for p in patches])
        result = {}
        for patch in patches:
            if "id" not in patch:
                abort_with_json(400, f"missing ID in patch: {id}")
            orig_id = patch["id"]
            raw_db_id = id_map[orig_id]
            if not raw_db_id:
                abort_with_json(400, f"Can't patch an unexisting node: {orig_id}")
            new_node = current_app.graph_db.update_node_by_id(
                f"id::{raw_db_id}", prepare_node_patch(patch)
            )
            new_node.id = orig_id
            result[orig_id] = GraphEditorNode.from_base_node(new_node)
        return dict(
            nodes=result
        )


@blp.route("/bulk_post")
class NodesBulkPost(MethodView):
    @blp.arguments(
        node_model.NodeBulkPostSchema, as_kwargs=True, location="json"
    )
    @blp.response(200, node_model.NodeBulkPostResponseSchema)
    @require_tab_id()
    def post(self, nodes):
        return {
            "nodes": {
                k: GraphEditorNode.from_base_node(base_node)
                for k, base_node in
                current_app.graph_db.create_nodes(
                    [prepare_node_patch(node_data) for node_data in nodes]
                ).items()
            }
        }


@blp.route("/<nid>")
class Node(MethodView):
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def get(self, nid: str):
        """
        Get a node by id

        Returns a node
        """
        if not id_is_valid(nid):
            abort(400, "invalid id")
        base_node = current_app.graph_db.get_node_by_id(nid)
        if not base_node:
            grapheditor_node = GraphEditorNode.create_pseudo_node(nid)
        else:
            grapheditor_node = GraphEditorNode.from_base_node(base_node)
        if grapheditor_node is None:
            abort(404)
        grapheditor_node.id = nid
        return grapheditor_node

    @blp.arguments(node_model.NodeSchema, example=node_model.node_put_example)
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def put(self, json_node, nid: str):
        """
        Full update of a node

        Returns the updated node
        """
        existing_node = current_app.graph_db.get_node_by_id(nid)
        if not existing_node:
            abort_with_json(405, f"Node {nid} doesn't exist in the database")

        base_node = current_app.graph_db.replace_node_by_id(
            nid, prepare_node_patch(json_node), existing_node
        )

        base_node.id = nid
        return GraphEditorNode.from_base_node(base_node)

    @blp.arguments(
        node_model.NodePatchSchema, example=node_model.node_patch_example
    )
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def patch(self, json_node, nid: str):
        """
        Partial update of a node.

        Returns the updated node.
        """
        # TODO check and update node in same query
        base_node = current_app.graph_db.get_node_by_id(nid)
        # pseudo node
        if not base_node and GraphEditorNode.create_pseudo_node(nid):
            abort_with_json(405, f"Can't patch a pseudo node: {nid}")
        elif not base_node:
            abort_with_json(404, f"Node ID doesn't exist: {nid}")

        updated_node = current_app.graph_db.update_node_by_id(
            nid, prepare_node_patch(json_node), base_node)
        updated_node.id = nid

        return GraphEditorNode.from_base_node(updated_node)

    @blp.response(200)
    @require_tab_id()
    def delete(self, nid: str):
        """
        Delete a node, if it exists, along with connected relations

        Returns 200
        """

        num_relations = current_app.graph_db.delete_nodes_by_ids([nid])
        return dict(
            num_deleted=num_relations, message=f"Deleted {num_relations} nodes"
        )


@blp.route("/<nid>/relations")
class NodeRelations(MethodView):
    @blp.arguments(
        relation_model.NodeRelationsQuerySchema,
        location="json",
        example=relation_model.node_relations_query_example,
    )
    @blp.response(
        200,
        relation_model.NodeRelationsSchema,
        example=relation_model.node_relations_response_example,
    )
    @require_tab_id()
    def post(self, filters, nid: str):
        """
        Get all relations that have node with ID 'nid' as source and/or target.

        Each relation is packed in an array together with the other
        "participant" node.  If nid is invalid, return 404, otherwise
        return 200.
        """

        rel_map = current_app.graph_db.get_node_relations(nid, filters=filters)
        if filters["direction"] not in ["both", "outgoing", "incoming"]:
            abort_with_json(
                400, "direction must be either 'both', 'outgoing' or 'incoming'"
            )

        # nid doesn't exist. Different than if rel_map is {}, what is a valid
        # relation map and leads to a 200 response.
        if rel_map is None:
            abort(404)
        for rel_info in rel_map:
            base_rel = rel_info['relation']
            rel_info['relation'] = GraphEditorRelation.from_base_relation(base_rel)
            base_node = rel_info['neighbor']
            rel_info['neighbor'] = GraphEditorNode.from_base_node(base_node)
        return dict(relations = rel_map)


@blp.route("/labels")
class NodeLabels(MethodView):
    @blp.response(
        200, node_model.NodeLabelsSchema, example=node_model.node_labels_example
    )
    @require_tab_id()
    def get(self):
        """Return all labels available in the database."""
        labels = [
            compute_semantic_id(label, GraphEditorLabel.MetaLabel)
            for label in current_app.graph_db.get_all_labels()
        ]
        return dict(labels=labels)


@blp.route("/labels/default")
class NodeDefaultLabels(MethodView):
    @blp.response(200, node_model.NodeDefaultLabelsGetResponseSchema)
    @require_tab_id()
    def get(self):
        """Get the list of default labels.
        Return a dummy default label in case none was set (see POST).
        """
        try:
            label_ids = session["default_labels"][g.tab_id]
        except KeyError:
            return {"nodes": []}
        label_nodes_map = current_app.graph_db.get_nodes_by_ids(label_ids)
        result = []
        for label_id in label_ids:
            if label_id not in label_nodes_map:
                pseudo_label_node = GraphEditorNode.create_pseudo_node(label_id)
                if pseudo_label_node:
                    result.append(pseudo_label_node)
            else:
                node = GraphEditorNode.from_base_node(label_nodes_map[label_id])
                result.append(node)
        return {"nodes": result}

    @blp.arguments(node_model.NodeDefaultLabelsPostSchema, as_kwargs=True)
    @require_tab_id()
    def post(self, label_ids):
        """Set the default labels for node creation. Pass an empty array to
        reset the stored label_ids.
        """
        if "default_labels" not in session:
            session["default_labels"] = {}

        if label_ids:
            session["default_labels"][g.tab_id] = label_ids
        elif g.tab_id in session["default_labels"]:
            # clear defalt_labels when input is empty
            del session["default_labels"][g.tab_id]

        return "Default labels set"


@blp.route("/properties")
class NodeProperties(MethodView):
    @blp.response(
        200,
        node_model.NodePropertiesSchema,
        example=node_model.node_properties_example,
    )
    @require_tab_id()
    def get(self):
        """Return all node properties available in the database."""
        properties = [
            compute_semantic_id(pname, GraphEditorLabel.MetaProperty)
            for pname in current_app.graph_db.get_all_node_properties()
        ]
        return dict(properties=properties)
