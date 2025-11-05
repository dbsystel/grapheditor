# GraphDatabase provides an abstract interface to the underlying graph
# database implementation. It's purpose is to enable us to switch to
# different technologies in the future.  GraphEditor code should avoid
# direct dependencies on a particular graph database (or even on
# cypher, when possible) and use a subclass of GraphDatabase instead.

from typing import List
from abc import ABC, abstractmethod

# We don't want to spread database-specific logic across many files,
# what would make it harder to swap the database technology in the
# future. So we opted for a big class to isolate database operation.
# pylint: disable=too-many-public-methods


class GraphDatabase(ABC):
    # ====================== Node related =====================================

    @abstractmethod
    def create_nodes(self, node_data_list):
        """Create multiple nodes at once.
        For now this method transforms node data contained in its input.
        """
        pass

    @abstractmethod
    def get_node_by_id(self, nid, replace_by_pseudo_node=False):
        """Fetch a node by its id from the database.
        Might return None if not found"""
        pass

    @abstractmethod
    def get_nodes_by_ids(self, ids, replace_by_pseudo_node=False, filters=None):
        """Fetch multiple nodes by id from the database.
        Return a dictionary of original IDs to nodes.
        If an ID is not found and replace_by_pseudo_node is True, the ID is
        mapped to a pseudo-node. Otherwise map it to None.
        """
        pass

    @abstractmethod
    def get_nodes_by_names(self, names, filters=None):
        """Fetch multiple nodes by name__tech_.
        Return a map of name to the corresponding node.
        If a name is not found, leave it out of the map."""
        pass

    @abstractmethod
    def replace_node_by_id(self, nid, node_data, existing_node=None):
        """Replace a node by its id from the GraphEditor node_data."""
        pass

    @abstractmethod
    def update_node_by_id(self, nid, node_data, existing_node=None):
        """Update node with partial data."""
        pass

    @abstractmethod
    def delete_nodes_by_ids(self, ids):
        """Delete multiple nodes by ids"""
        pass

    @abstractmethod
    def get_node_relations(self, nid, filters):
        """Return all relations that have node with ID 'nid' as source
        and/or target, or None if the ID is a db_id and doesn't exist.

        Each relation is returned in an array together with the other
        "participant" node.

        filters is a dict with following possible entries:

        - direction: Either "incoming", "outgoing" or "both". Default:
            "both"

        - relation_type: A string representing the relation type,
            e.g. "likes".  If not set, any relation_type is accepted.

        - relation_properties: A dictionary where keys are relation
            properties (strings), and values can have any type. Only
            relations matching ALL properties are returned.  E.g.
            {"MetaProperty::since__dummy_": "1998" }.

        - neighbor_labels: A list of labels (strings). Matching
            neighbors must have all labels.

        - neighbor_properties: A dictionary where keys are relation
            properties (strings), and values can have any type. Only
            neighbors matching ALL properties are returned.  E.g.
            {"MetaProperty::city__dummy_": "Berlin" }
        """
        pass

    @abstractmethod
    def get_relations_by_node_ids(self, node_ids, exclude_relation_types=None):
        """Return all relations that have any of the nodes with IDs 'node_ids'
        # as source and/or target.
        """
        pass

    @abstractmethod
    def get_nodes_neighbors(self, id_map, relation_types, direction, neighbors_filters=None):
        """Return all neighbors from nodes in id_map.

        Args:
            id_map: Maps user-provided IDs (aka. original id) with
                    those found in the database.

            relation_types: List of relation types. For example: ['likes__dummy_'].

        Returns:
            A dict mapping node IDs (original ones found in id_map) to
            another dict (string -> node) representing neighbors
            (mapping each ID to the neighbor node itself). This is an
            easy and efficient way of guaranteeing uniqueness of
            neighbor nodes (a set wouldn't work, since at least for
            now nodes are represented as plain dicts, and thus are not
            hashable).
        """
        pass

    @abstractmethod
    def query_nodes(self, text, labels, pseudo):
        """Return nodes which contain text and labels.

        If the database has _ft__tech_ support, use it. Otherwise search
        across all properties of all nodes
        """
        pass

    # ====================== Relation related =================================

    @abstractmethod
    def get_relation_by_id(self, rid):
        """Fetch a relation by its id from the database.
        Might return None if not found"""
        pass

    @abstractmethod
    def update_relation_by_id(
        self, rid, relation_data, existing_relation=None
    ):
        """Replace a relation by its id from the GraphEditor relation_data."""
        pass

    @abstractmethod
    def create_relations(self, relation_data_list):
        """Create multiple nodes at once.
        For now this method transforms node data contained in its input.
        """
        pass

    @abstractmethod
    def delete_relations_by_ids(self, ids):
        """Delete multiple relations by ids"""
        pass

    # ====================== Perspective related ==============================

    @abstractmethod
    def create_perspective(self, perspective_data):
        """Create a perspective from a dictionary of node ID's and the
        corresponding positions
        """
        pass

    @abstractmethod
    def get_perspective_by_id(self, pid):
        """Get perspective by ID.

        The result contains the perspective nodes and relations.
        """
        pass

    @abstractmethod
    def replace_perspective_by_id(self, pid, json):
        """Replace perspective with ID <pid> by data provided in json (a dict).

        Note: previously existing "pos"-edges are removed and replaced by new
        ones.
        """
        pass

    # ====================== General Info =====================================

    @abstractmethod
    def get_all_labels(self, nids: List[str] = None):
        """Return all labels as GraphEditorIDs.
        If nids is set, only labels of node ids in it are returned.
        """
        pass

    @abstractmethod
    def get_all_types(self):
        """Return all relation types as GraphEditorIDs."""
        pass

    @abstractmethod
    def get_all_node_properties(self, nids: List[str] = None):
        """Return semantic IDs of all node properties.
           If nids is set, only properties of node ids in it are returned.
        """
        pass

    @abstractmethod
    def get_all_relation_properties(self):
        """Return all relation properties as stringids."""
        pass

    @abstractmethod
    def ids_to_raw_db_ids(self, ids):
        """Convert a list of IDs to a map of them to raw database ID."""
        pass
