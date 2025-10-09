from flask import current_app
from flask.views import MethodView
from flask_smorest import Blueprint

from blueprints.maintenance.login_api import require_tab_id
from blueprints.graph import parallax_model
from database.utils import abort_with_json
from database.id_handling import get_base_id, compute_semantic_id, GraphEditorLabel


blp = Blueprint(
    "Parallax API",
    __name__,
    description=(
        "Endpoint for iteratively extending search results based on initial "
        "query and filters/relation types."
    )
)

def _normalize_filters(filters):
    if not filters:
        return None
    result = {}
    if 'properties' in filters:
        result['properties'] = {
            get_base_id(k): v
            for k, v in filters['properties'].items()
        }
    if 'labels' in filters:
        result['labels'] = [get_base_id(label) for label in filters['labels']]
    return result

@blp.route("")
class Parallax(MethodView):
    def _next_types(self, node_ids: list[str]) -> set[str]:
        """Return a set of all relation types of incoming and outgoing
        relations that have any of the given nodes as source/target.
        node_ids is a list of node IDs (string).
        """
        raw_db_ids = [get_base_id(nid) for nid in node_ids]
        in_rel_types = current_app.graph_db.incoming_relation_types(raw_db_ids)
        out_rel_types = current_app.graph_db.outgoing_relation_types(raw_db_ids)

        return {
            'incoming': {
                compute_semantic_id(rel_type, GraphEditorLabel.MetaRelation): {
                    'count': count
                }
                for rel_type, count in in_rel_types.items()
            },
            'outgoing': {
                compute_semantic_id(rel_type, GraphEditorLabel.MetaRelation): {
                    'count': count
                }
                for rel_type, count in out_rel_types.items()
            }
        }

    def _next_set(self,
                  nodes: dict[str, dict],
                  in_rel_types: list[str],
                  out_rel_types: list[str],
                  filters: dict
        ) -> dict[str, dict]:
        # needed for get_nodes_neighbors
        id_map = {nid: get_base_id(nid) for nid in nodes.keys()}

        # get_nodes_neighbors maps IDs of provided nodes to a map containing neighbors
        # (where keys are IDs, values are nodes).
        # We merge the maps into a single map of node ID -> neighbor node.
        neighbors_map = {}
        normalized_filters = _normalize_filters(filters)

        if out_rel_types:
            nodes_with_neighbors = current_app.graph_db.get_nodes_neighbors(
                id_map,
                out_rel_types,
                "outgoing",
                normalized_filters
            )
            for neighbors in nodes_with_neighbors.values():
                for neighbor_id, neighbor in neighbors.items():
                    neighbors_map[neighbor_id] = neighbor

        if in_rel_types:
            nodes_with_neighbors = current_app.graph_db.get_nodes_neighbors(
                id_map,
                in_rel_types,
                "incoming",
                normalized_filters
            )

            for neighbors in nodes_with_neighbors.values():
                for neighbor_id, neighbor in neighbors.items():
                    neighbors_map[neighbor_id] = neighbor

        return neighbors_map

    def _apply_steps(self, initial_set: dict[str, dict], steps: list):
        result_set = initial_set
        for step in steps:
            in_rel_types = [
                get_base_id(rel_type)
                for rel_type in step['incomingRelationTypes']
            ] if 'incomingRelationTypes' in step else []
            out_rel_types = [
                get_base_id(rel_type)
                for rel_type in step['outgoingRelationTypes']
            ] if 'outgoingRelationTypes' in step else []
            if not in_rel_types and not out_rel_types:
                abort_with_json(400, "A parallax step must include at least on relation type.")
            result_set = self._next_set(
                result_set,
                in_rel_types,
                out_rel_types,
                step.get('filters', None)
            )
        return result_set

    def _apply_filters(self, nodes_map: dict[str, dict], filters: dict):
        """Apply filters and return resulting nodes_map.
        Assume property names and labels in filters have any prefix removed.
        """
        if not filters:
            return nodes_map
        prop_filters = filters.get('properties', {})
        label_filters = filters.get('labels', [])
        result = {}
        for nid, node in nodes_map.items():
            # If there are property filters set, all of them must be satisfied (AND semantics).
            # Nodes not fulfilling requirements are skipped.
            all_properties_valid = True
            for pname, expected_pvalue in prop_filters.items():
                props = {
                    get_base_id(k): v
                    for k, v in node['properties'].items()
                }
                # for now we check if property is inside expected value.
                # Later we will support several comparison methods.
                if pname not in props or str(expected_pvalue) not in str(props[pname]['value']):
                    all_properties_valid = False
                    break
            if not all_properties_valid:
                continue
            # Node must have any of the filter labels (OR semantics), if set
            if not label_filters or any(
                label in label_filters for label in node.get('labels', [])
            ):
                result[nid] = node
        return result

    @blp.arguments(parallax_model.ParallaxPostSchema, as_kwargs=True)
    @blp.response(200, parallax_model.ParallaxPostResponseSchema)
    @require_tab_id()
    # Method name corresponds to json names, which use camelCase.
    # pylint: disable=invalid-name
    def post(self, node_ids, filters=None, steps=None):
        nodes = {}
        nodes = current_app.graph_db.get_nodes_by_ids(node_ids, filters=_normalize_filters(filters))

        result_nodes = self._apply_steps(nodes, steps or [])
        result_nids = [get_base_id(nid) for nid in result_nodes]
        next_steps = self._next_types(result_nids)
        return {
            'nodes': result_nodes,
            'properties': current_app.graph_db.get_all_node_properties(result_nids),
            'labels': current_app.graph_db.get_all_labels(result_nids),
            'incomingRelationTypes': next_steps['incoming'],
            'outgoingRelationTypes': next_steps['outgoing'],
        }
