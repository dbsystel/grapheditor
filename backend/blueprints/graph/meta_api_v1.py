from flask import current_app, g
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import meta_model
from blueprints.maintenance.login_api import require_tab_id
from database.utils import abort_with_json
from database.mapper import get_base_id, GraphEditorNode
from database.id_handling import GraphEditorLabel, compute_semantic_id, extract_id_metatype

blp = Blueprint(
    "Meta", __name__, description="Endpoints for fetching meta information"
)

@blp.route("meta_for_meta")
class MetaForMeta(MethodView):
    _supported_metalabels = [
        GraphEditorLabel.MetaLabel,
        GraphEditorLabel.MetaProperty,
        GraphEditorLabel.MetaRelation,
    ]

    def _fetch_metaproperties_for_metalabel(self, nid):
        metaproperties = current_app.graph_db.get_node_relations(
            nid, filters={"relation_type": "MetaProperty__tech_"}
        )
        return metaproperties

    def _fetch_metatypes(self, nids):
        """Return Metatypes (MetaLabel...) of given Node IDs"""
        # IDs may be db ids or semantic ids, so we handle them separately
        semantic_ids_metatypes = {}
        db_ids = []

        for nid in nids:
            # simple case, Metatype can be read directly from the semantic id
            metatype = extract_id_metatype(nid)
            if metatype:
                semantic_ids_metatypes[nid] = metatype
            else:
                # collect remaining IDs
                db_ids.append(nid)

        fetched_nodes = current_app.graph_db.get_nodes_by_ids(db_ids)
        db_ids_metatypes = {}
        for nid, node in fetched_nodes.items():
            for metatype in self._supported_metalabels:
                if metatype.name in map(get_base_id, node["labels"]):
                    db_ids_metatypes[nid] = metatype

        result = db_ids_metatypes | semantic_ids_metatypes

        return result

    def _get_metaproperties_of_metaobjects(self, id_map):
        """Return all MetaProperty nodes associated with the given node ID's.
        The IDs should point to nodes describing either a MetaLabel or
        MetaRelation.  Each ID is mapped to an array of metaproperties.
        """

        nodes_to_neighbors_map = current_app.graph_db.get_nodes_neighbors(
            id_map, ["prop__tech_"], "incoming"
        )

        result = {}
        for nid, neighbors in nodes_to_neighbors_map.items():
            result[nid] = [
                GraphEditorNode.from_base_node(node)
                for node in neighbors.values()
            ]
        return result

    def _get_metaobjects_of_metaproperties(self, id_map):
        """Return all MetaLabel/Relation nodes associated with the
        given node ID's.
        IDs should point to nodes describing a MetaProperty.  Each ID
        is mapped to an array of metalabels or metaproperties.
        """
        result = {}
        nodes_to_neighbors_map = current_app.graph_db.get_nodes_neighbors(
            id_map, ["prop__tech_"], "outgoing"
        )
        for nid, neighbors in nodes_to_neighbors_map.items():
            result[nid] = [
                GraphEditorNode.from_base_node(base_node)
                for base_node in neighbors.values()
            ]
        return result

    @blp.arguments(
        meta_model.MetaForMeta,
        as_kwargs=True,
        location="json",
        example=meta_model.meta_for_meta_example,
    )
    @blp.response(200, meta_model.MetaForMetaResponse)
    @require_tab_id()
    def post(self, ids, result_type):
        """Given a list of IDs of MetaLabels and a result_type, return a Map
        from IDs to corresponding meta objects.

        All IDs should point to an object with the same MetaLabel
        (MetaLabel, MetaRelation or MetaProperty). If that's not the
        case, the error code 400 is returned.

        Currently following combinations are supported:

        - MetaProperties for given MetaLabels
        - MetaProperties for given MetaRelations
        - MetaLabels for given MetaProperties
        - MetaRelations for given MetaProperties

        It's an error if result_type doesn't match one of the listed
        cases. In this case we return the error code 400.

        Ex.: if an ID is a MetaLabel and result_type is MetaProperty,
        the returned object maps the ID to an array of MetaProperties
        belonging to that MetaLabel.
        """
        id_map = current_app.graph_db.ids_to_raw_db_ids(ids)

        if not id_map:
            return {"nodes": {}}

        metatype = None

        # Since we only support fetching metaobjects for IDs that
        # refer to the same metatype, we get the metatype from any
        # object. Mismatching metatypes can lead to weird behavior,
        # like some missing IDs in the result. We could do some basic
        # check of metatype consistency in the future.
        # Get first MetaLabel found.
        for nid in ids:
            sample_node = current_app.graph_db.get_node_by_id(nid)
            if sample_node is None:
                continue
            for label in sample_node.labels:
                try:
                    metatype = GraphEditorLabel(get_base_id(label))
                except ValueError:
                    pass
            if metatype in [
                GraphEditorLabel.MetaLabel,
                GraphEditorLabel.MetaRelation,
                GraphEditorLabel.MetaProperty,
            ]:
                break

        nodes = None
        match (metatype, result_type):
            case (GraphEditorLabel.MetaLabel, GraphEditorLabel.MetaProperty):
                nodes = self._get_metaproperties_of_metaobjects(id_map)
            case (GraphEditorLabel.MetaRelation, GraphEditorLabel.MetaProperty):
                nodes = self._get_metaproperties_of_metaobjects(id_map)
            case (GraphEditorLabel.MetaProperty, GraphEditorLabel.MetaLabel):
                nodes = self._get_metaobjects_of_metaproperties(id_map)
            case (GraphEditorLabel.MetaProperty, GraphEditorLabel.MetaRelation):
                nodes = self._get_metaobjects_of_metaproperties(id_map)
            case _:
                current_app.logger.error(
                    f"Fetching {result_type} for {metatype} not supported"
                )
        if nodes:
            return {"nodes": nodes}
        return {"nodes": {}}


@blp.route("relation_type_suggestions")
class RelationTypeSuggestions(MethodView):
    @blp.arguments(
        meta_model.RelationTypeSuggestionsQuery,
        as_kwargs=True,
        location="query"
    )
    @blp.response(200, meta_model.SuggestionsQueryResponse)
    @require_tab_id()
    def get(self, source_id=None, target_id=None, text=None, limit:int|None=None):
        """Return meta relation suggestions for the given source_id/target_id.
        You can provide both source_id/target_id, one of them or none. If at
        least one is provided, we return the MetaRelation nodes according
        to the restrictions existing in the meta model. These are listed
        in the 'modelDerived' entry.

        'others' contain other types that weren't derived from the model.
        These can also be a pseudo node, in case no MetaRelation node is defined
        for them.

        You may limit the result providing a number for the 'limit' parameter.
        It defaults to None, meaning all types are returned. If a limit was
        reached and there are more type available, the 'hasMore' flag is set
        to true.
        """
        model_derived_types = []
        other_types = []
        suggestions = dict()
        has_more = False
        if text:
            text = text.strip()

        if source_id or target_id:
            raw_source_id = (
                current_app.graph_db.ids_to_raw_db_ids([source_id])[source_id]
                if source_id else None
            )
            raw_target_id = (
                current_app.graph_db.ids_to_raw_db_ids([target_id])[target_id]
                if target_id else None
            )
            suggestions = current_app.graph_db.get_relation_type_suggestions(
                raw_source_id, raw_target_id, text, limit
            )
            model_derived_types = [
                GraphEditorNode.from_base_node(suggestions[rel_type_name])
                for rel_type_name in sorted(list(suggestions.keys()))
            ]
        num_model_derived_types = len(model_derived_types)
        model_derived_types = sorted(model_derived_types, key=lambda node: node.title)
        if limit and num_model_derived_types > limit:
            has_more = True
            model_derived_types = model_derived_types[:limit]
            count = limit
        else:
            count = num_model_derived_types

        if not limit or count < limit:
            all_types = current_app.graph_db.get_all_types(text, limit)
            for rel_type_name in sorted(list(all_types.keys())):
                if rel_type_name in suggestions:
                    continue
                metarel = all_types[rel_type_name]
                if metarel:
                    other_types.append(GraphEditorNode.from_base_node(metarel))
                else:
                    pseudo_node = GraphEditorNode.create_pseudo_node(
                        compute_semantic_id(rel_type_name,
                                            GraphEditorLabel.MetaRelation)
                    )
                    assert pseudo_node
                    other_types.append(pseudo_node)
                count = count + 1

        other_types = sorted(other_types, key=lambda node: node.title)

        # when a limit is given, fill first the "model_derived_types" bucket and put
        # the remaining in "other_types".
        # The case where limit is less then the size of model_derived_types is already
        # covered.
        if limit and count > limit:
            other_types = other_types[:(limit - num_model_derived_types)]
            has_more = True

        return {
            "modelDerived": model_derived_types,
            "others": other_types,
            "hasMore": has_more
        }


@blp.route("relation_end_suggestions")
class RelationEndSuggestions(MethodView):
    @blp.arguments(
        meta_model.RelationEndSuggestionsQuery,
        as_kwargs=True,
        location="query"
    )
    @blp.response(200, meta_model.SuggestionsQueryResponse)
    @require_tab_id()
    # TODO pylint 4 is ok with this, remove after upgrading it
    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def get(self, end, neighbor_id=None, relation_type=None,
            text="", limit:int|None=None):
        """Return suggestions for nodes on one end of a relation.
        You may provide a relation type to restrict suggestions, as well as the ID
        of a neighbor node, so that only nodes that according to the metamodel can
        relate to it are suggested. These results are listed in the "modelDerived"
        entry.

        "others" contain remaining suggestions not listed in "modelDerived".
        """
        if text:
            text = text.strip()

        relation_type_name = None

        if neighbor_id:
            resolved_id = current_app.graph_db.ids_to_raw_db_ids([neighbor_id]).get(neighbor_id)
            if not resolved_id:
                abort_with_json(400, "invalid neighbor id: " + neighbor_id)
            neighbor_id = resolved_id

        if relation_type:
            relation_type_name = current_app.graph_db.resolve_relation_type_name(relation_type)

        model_suggestions = current_app.graph_db.get_relation_end_suggestions(
            end, neighbor_id=neighbor_id, relation_type=relation_type_name, text=text,
            limit=limit
        )
        model_derived = {}
        for base_node in model_suggestions.values():
            ge_node = GraphEditorNode.from_base_node(base_node)
            model_derived[ge_node.id] = ge_node

        count = len(model_suggestions)
        if limit and count >= limit:
            return {
                "modelDerived": sorted(
                    list(model_derived.values()), key=lambda node: node.title
                )[:limit],
                "others": [],
                "hasMore": True
            }

        if g.conn.has_nft_index() and text:
            # add wildcards to allow matching incomplete strings, since the ft search
            # requires that for partial matching. This may lead to several false
            # positives though, sinch the ft search scans the _ft__tech_ property,
            # and that contains the text of all properties of a node.
            text = f"*{text}*"

        # fetch node instances to put into `others`. We have to filter out nodes
        # already stored in `model_derived`. We could do this by filtering
        # directly in cypher. A simpler approach consist in taking up to 2*limit
        # suggestions and filtering out duplicates in python.  The factor 2 is
        # there to make sure we have enough non-model-derived nodes, since we can
        # have at most `limit`-nodes in `model_derived`, so we need at least twice
        # as many to have enough suggestions for `others`.

        other_candidates = current_app.graph_db.query_nodes(
            text=text, labels=[], limit=limit*2 if limit else None
        )

        others = []
        for node in other_candidates:
            if limit and count >= limit:
                break
            if f"id::{node.id}" not in model_derived:
                others.append(GraphEditorNode.from_base_node(node))
                count += 1

        return {
            "modelDerived": list(sorted(model_derived.values(), key=lambda node: node.title)),
            "others": sorted(others, key=lambda node: node.title),
            "hasMore": bool(limit and count > limit)
        }
