from flask import abort, g, session, current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import relation_model
from blueprints.maintenance.login_api import require_tab_id
from database import mapper, id_handling
from database.id_handling import parse_db_id
from database.utils import abort_with_json

blp = Blueprint(
    "Neo4j relations", __name__, description="Works with every neo4j database"
)


@blp.route("")
class Relations(MethodView):
    @blp.arguments(
        relation_model.RelationPostSchema,
        example=relation_model.relation_post_example,
    )
    @blp.response(
        200,
        relation_model.RelationSchema,
        example=relation_model.relation_example,
    )
    @require_tab_id()
    def post(self, relation_data):
        """
        Create a new relation

        Returns the newly created relation
        """
        return current_app.graph_db.create_relation(relation_data)

    @blp.arguments(
        relation_model.RelationQuery, as_kwargs=True, location="query"
    )
    @blp.response(
        200,
        relation_model.RelationSchema(many=True),
        example=[relation_model.relation_example],
    )
    @require_tab_id()
    def get(self, text=""):
        """
        Fulltext query across all relations

        Returns a list of relations
        """
        return current_app.graph_db.fulltext_query_relations(text)


@blp.route("/bulk_fetch")
class RelationsBulkFetch(MethodView):
    @blp.arguments(
        relation_model.RelationBulkFetchSchema, as_kwargs=True, location="json"
    )
    @blp.response(200, relation_model.RelationBulkFetchResponseSchema)
    @require_tab_id()
    def post(self, ids):
        """
        Fetch multiple nodes by the corresponding IDs at once.

        We use POST instead of GET to avoid limitations of passing ID's as
        query parameters.

        Return a dictionary mapping node IDs to the corresponding nodes.
        """
        relations = current_app.graph_db.get_relations_by_ids(ids)

        return dict(relations=relations)


@blp.route("/bulk_delete")
class RelationsBulkDelete(MethodView):
    @blp.arguments(
        relation_model.RelationBulkDeleteSchema,
        as_kwargs=True,
        location="json",
    )
    @require_tab_id()
    def delete(self, ids):
        """
        Delete multiple relations by the corresponding IDs at once.

        Return a dictionary containing the number of relations deleted.
        """
        num_deleted = current_app.graph_db.delete_relations_by_ids(ids)

        return dict(
            num_deleted=num_deleted, message=f"Deleted {num_deleted} relations"
        )


@blp.route("/bulk_patch")
class RelationsBulkPatch(MethodView):
    @blp.arguments(
        relation_model.RelationBulkPatchSchema, as_kwargs=True, location="json"
    )
    @blp.response(200, relation_model.RelationBulkFetchResponseSchema)
    @require_tab_id()
    def patch(self, patches):
        """
        Update multiple relations at once.

        Each patch must contain the corresponding ID.
        Return a map of the old IDs to the new relation objects. Note
        that these may have a different ID, since changing a type forces
        creation of a new relation.
        """
        current_app.logger.debug(f"patches: {patches}")
        result = {}
        for patch in patches:
            if "id" not in patch:
                abort_with_json(400, f"missing ID in patch: {id}")
            rid = patch["id"]
            neo_rel = current_app.graph_db.get_relation_by_id(rid)
            if not neo_rel:
                abort_with_json(
                    400, f"Can't patch an unexisting relation: {rid}"
                )
            new_rel = current_app.graph_db.update_relation_by_id(rid, patch)
            result[rid] = new_rel

        return dict(
            relations=result
        )


@blp.route("/<rid>")
class Relation(MethodView):
    @blp.response(
        200,
        relation_model.RelationSchema,
        example=relation_model.relation_example,
    )
    @require_tab_id()
    def get(self, rid: str):
        """
        Get a relation by id

        Returns a relation
        """
        grapheditor_relation = current_app.graph_db.get_relation_by_id(rid)
        if not grapheditor_relation:
            abort(404)

        grapheditor_relation.update(dict(id=rid))
        return grapheditor_relation

    @blp.arguments(
        relation_model.RelationPostSchema,
        example=relation_model.relation_put_example,
    )
    @blp.response(
        200,
        relation_model.RelationSchema,
        example=relation_model.relation_example,
    )
    @require_tab_id()
    def put(self, json_relation, rid: str):
        """
        Full update of a relation.

        Return the updated relation.
        """
        existing_relation = current_app.graph_db.get_relation_by_id(rid)
        if existing_relation is None:
            abort(404)

        grapheditor_relation = current_app.graph_db.update_relation_by_id(
            rid, json_relation, existing_relation
        )

        # an semantic id (e.g. ns::...) is returned as provided by the client.
        # A neo4j ID can change when updating a type, so we return the new ID.
        if not id_handling.parse_db_id(rid):
            grapheditor_relation.update(dict(id=rid))
        return grapheditor_relation

    @blp.arguments(
        relation_model.RelationBaseSchema,
        example=relation_model.relation_patch_example,
    )
    @blp.response(
        200,
        relation_model.RelationSchema,
        example=relation_model.relation_example,
    )
    @require_tab_id()
    def patch(self, json_relation, rid: str):
        """
        Partial update of a relation

        Returns the updated relation
        """
        existing_relation = current_app.graph_db.get_relation_by_id(rid)
        if existing_relation is None:
            abort(404)
        grapheditor_relation = current_app.graph_db.update_relation_by_id(
            rid, json_relation, existing_relation
        )

        # an semantic id (e.g. ns::...) is returned as provided by the client.
        # A neo4j ID can change when updating a type, so we return the new ID.
        if not id_handling.parse_db_id(rid):
            grapheditor_relation.update(dict(id=rid))
        return grapheditor_relation

    @blp.response(200)
    @require_tab_id()
    def delete(self, rid: str):
        """
        Delete a relation, if it exists

        Returns 200
        """
        num_deleted = current_app.graph_db.delete_relations_by_ids([rid])
        return dict(
            num_deleted=num_deleted, message=f"Deleted {num_deleted} relations"
        )


@blp.route("/by_node_ids")
class RelationsByNodeIds(MethodView):
    @blp.arguments(
        relation_model.RelationsByNodeIdsQuery,
        as_kwargs=True,
        location="json",
    )
    @blp.response(
        200,
        relation_model.RelationSchema(many=True),
        example=[relation_model.relation_example],
    )
    @require_tab_id()
    def post(self, node_ids=None, exclude_relation_types=None):
        """
        Fetch all relations where both source and target node ids are in
        'nodeIds'.
        """
        if not node_ids:
            abort_with_json(400, "No node Ids provided")

        if not exclude_relation_types:
            exclude_relation_types = []

        raw_db_ids = list(map(parse_db_id, node_ids))
        relations = current_app.graph_db.get_relations_by_node_ids(
            raw_db_ids, exclude_relation_types
        )
        return relations


@blp.route("properties")
class RelationProperties(MethodView):
    @blp.response(
        200,
        relation_model.RelationProperties,
        example=relation_model.relation_properties_example,
    )
    @require_tab_id()
    def get(self):
        """Return all relation properties available in the database."""
        properties = current_app.graph_db.get_all_relation_properties()
        return dict(properties=properties)


@blp.route("/types")
class RelationTypes(MethodView):
    @blp.response(
        200,
        relation_model.RelationTypes,
        example=relation_model.relation_types_example,
    )
    @require_tab_id()
    def get(self):
        """Return all relation types from the database."""
        types = current_app.graph_db.get_all_types()
        return dict(types=types)


@blp.route("/types/default")
class RelationDefaultType(MethodView):
    @blp.response(200, relation_model.RelationDefaultTypeGetResponseSchema)
    @require_tab_id()
    def get(self):
        """Get the default relation type.
        Return a dummy default type in case none was set (see POST).
        """

        default_type_id = None
        try:
            default_type_id = session["default_type"][g.tab_id]
        except KeyError:
            return {
                "node": current_app.graph_db.get_node_by_id(
                    mapper.DEFAULT_RELATION_TYPE, True
                )
            }

        default_type = current_app.graph_db.get_node_by_id(
            default_type_id, True
        )
        if not default_type:
            return {
                "node": current_app.graph_db.get_node_by_id(
                    mapper.DEFAULT_RELATION_TYPE, True
                )
            }
        return {"node": default_type}

    @blp.arguments(
        relation_model.RelationDefaultTypePostSchema,
        as_kwargs=True,
        location="json",
    )
    @require_tab_id()
    def post(self, type_id):
        """Set the default relation type for relation creation."""

        if "default_type" not in session:
            session["default_type"] = {}

        if type_id:
            session["default_type"][g.tab_id] = type_id
        elif g.tab_id in session["default_type"]:
            # clear defalt_type when input is an empty string
            del session["default_type"][g.tab_id]

        return "Default relation type set"
