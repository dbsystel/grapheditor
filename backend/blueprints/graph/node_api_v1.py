from flask import abort, current_app, g, session
from flask.views import MethodView
from flask_smorest import Blueprint

from database.utils import abort_with_json
from blueprints.maintenance.login_api import require_tab_id
from blueprints.graph import node_model
from blueprints.graph import relation_model


blp = Blueprint(
    "Neo4j nodes", __name__, description="Works with every neo4j database"
)


@blp.route("")
class Nodes(MethodView):
    @blp.arguments(
        node_model.NodePostSchema, example=node_model.node_post_example
    )
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def post(self, node_data):
        """
        Create a new node

        Returns the newly created node
        """
        return current_app.graph_db.create_node(node_data)

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
        return current_app.graph_db.query_nodes(text, labels, pseudo)


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
        nodes = current_app.graph_db.get_nodes_by_ids(
            ids,
            replace_by_pseudo_node=True
        )
        return dict(nodes=nodes)


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
            new_node = current_app.graph_db.update_node_by_id(f"id::{raw_db_id}", patch)
            new_node["id"] = orig_id
            result[orig_id] = new_node
        return dict(
            nodes=result
        )


@blp.route("/<nid>")
class Node(MethodView):
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def get(self, nid: str):
        """
        Get a node by id

        Returns a node
        """
        grapheditor_node = current_app.graph_db.get_node_by_id(nid, True)
        if grapheditor_node is None:
            abort(404)
        grapheditor_node.update(dict(id=nid))
        return grapheditor_node

    @blp.arguments(node_model.NodeSchema, example=node_model.node_put_example)
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def put(self, json_node, nid: str):
        """
        Full update of a node

        Returns the updated node
        """
        existing_node = current_app.graph_db.get_node_by_id(nid, True)
        if "dbId" not in existing_node:
            abort_with_json(405, f"Node {nid} doesn't exist in the database")

        grapheditor_node = current_app.graph_db.replace_node_by_id(
            nid, json_node, existing_node
        )

        grapheditor_node.update(dict(id=nid))
        return grapheditor_node

    @blp.arguments(
        node_model.NodePatchSchema, example=node_model.node_patch_example
    )
    @blp.response(200, node_model.NodeSchema, example=node_model.node_example)
    @require_tab_id()
    def patch(self, json_node, nid: str):
        """
        Partial update of a node

        Returns the updated node
        """
        neo_node = current_app.graph_db.get_node_by_id(nid, True)
        # pseudo node
        if not neo_node or "dbId" not in neo_node:
            abort_with_json(405, f"Can't patch a pseudo node: {nid}")
        grapheditor_node = current_app.graph_db.update_node_by_id(nid, json_node)
        grapheditor_node.update(dict(id=nid))

        return grapheditor_node

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
        if filters["direction"] not in ["both", "outgoing", "ingoing"]:
            abort_with_json(
                400, "direction must be either 'both', 'outgoing' or 'ingoing'"
            )

        # nid doesn't exist. Different than if rel_map is {}, what is a valid
        # relation map and leads to a 200 response.
        if rel_map is None:
            abort(404)
        return dict(relations=rel_map)


@blp.route("/labels")
class NodeLabels(MethodView):
    @blp.response(
        200, node_model.NodeLabels, example=node_model.node_labels_example
    )
    @require_tab_id()
    def get(self):
        """Return all labels available in the database."""
        labels = current_app.graph_db.get_all_labels()
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
        labels = current_app.graph_db.get_nodes_by_ids(
            label_ids, replace_by_pseudo_node=True
        )
        return {"nodes": labels.values()}

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
        node_model.NodeProperties,
        example=node_model.node_properties_example,
    )
    @require_tab_id()
    def get(self):
        """Return all node properties available in the database."""
        properties = current_app.graph_db.get_all_node_properties()
        return dict(properties=properties)
