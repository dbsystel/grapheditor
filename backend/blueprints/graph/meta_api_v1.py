from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.graph import meta_model
from blueprints.maintenance.login_api import require_tab_id
from database import mapper
from database.id_handling import GraphEditorLabel, extract_id_metatype

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
                if metatype.name in map(mapper.get_base_id, node["labels"]):
                    db_ids_metatypes[nid] = metatype

        result = db_ids_metatypes | semantic_ids_metatypes

        return result

    def _get_metaproperties_of_metaobjects(self, id_map):
        """Return all MetaProperty nodes associated with the given node ID's.
        The IDs should point to nodes describing either a MetaLabel or
        MetaRelation.  Each ID is mapped to an array of metaproperties.
        """

        nodes_to_neighbors_map = current_app.graph_db.get_nodes_neighbors(
            id_map, "prop__tech_", "incoming"
        )

        result = {}
        for nid, neighbors in nodes_to_neighbors_map.items():
            result[nid] = neighbors.values()
        return result

    def _get_metaobjects_of_metaproperties(self, id_map):
        """Return all MetaLabel/Relation nodes associated with the
        given node ID's.
        IDs should point to nodes describing a MetaProperty.  Each ID
        is mapped to an array of metalabels or metaproperties.
        """
        result = {}
        nodes_to_neighbors_map = current_app.graph_db.get_nodes_neighbors(
            id_map, "prop__tech_", "outgoing"
        )
        for nid, neighbors in nodes_to_neighbors_map.items():
            result[nid] = neighbors.values()

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
            sample_node = current_app.graph_db.get_node_by_id(nid, True)
            if sample_node is None:
                continue
            for label in sample_node["labels"]:
                try:
                    metatype = mapper.GraphEditorLabel(mapper.get_base_id(label))
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
