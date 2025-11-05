
# CypherDatabase implements GraphDatabase's interface assuming the
# underlying technology supports Cypher. For now it may have Neo4j
# specific parts. If in the future we switch to a different engine, we
# can still subclass it.

from typing import List, Any
from flask import abort, g, current_app
import neo4j.exceptions

from database import mapper, id_handling
from database.graph_database import GraphDatabase
from database.id_handling import (
    GraphEditorLabel,
    compute_semantic_id,
    extract_id_metatype,
    get_base_id,
    parse_db_id,
    parse_semantic_id,
    parse_unknown_id,
)
from database.mapper import python_value_to_cypher
from database.utils import abort_with_json, map_dict_keys, dict_to_array


# We don't want to spread database-specific logic across many files,
# what would make it harder to swap the database technology in the
# future. So we opted for a big class to isolate database operation.
# pylint: disable=too-many-public-methods
# pylint: disable=too-many-lines


class CypherDatabase(GraphDatabase):
    def _run(self, *args, **kwargs):
        return g.conn.run(*args, **kwargs)

    # ======================= Node related ====================================
    def create_nodes(self, node_data_list: list[dict]):
        """Create multiple nodes at once.
        Return a dictionary mapping IDs to the generated nodes.

        For now this method transforms node data contained in its input.
        """

        for node_data in node_data_list:
            updated_labels = [get_base_id(l) for l in node_data["labels"]]
            updated_properties = {
                get_base_id(k): v["value"]
                for k, v in node_data["properties"].items()
                # we don't want to allow the user to set an UUID. This is
                # specially important if this method is used for copying
                # existing nodes.
                if k != "_uuid__tech_"
            }
            node_data["labels"] = updated_labels
            node_data["properties"] = updated_properties

        query_text = """
        UNWIND $node_data_list AS node_data
        CALL apoc.create.node(node_data['labels'], node_data['properties'])
        YIELD node AS n
        RETURN n, elementid(n) as nid
        """
        query_result = self._run(query_text, node_data_list=node_data_list)

        new_nodes = {
            f"id::{row['nid']}": mapper.neonode2grapheditor(row["n"])
            for row in query_result
        }
        return new_nodes


    @staticmethod
    def _get_update_label_cypher(old_labels, new_labels):
        """Create cypher to update labels by comparing the complete lists of
        old_labels and new_labels."""
        old_set = set(
            filter(lambda label: not label.startswith("_"), old_labels)
        )
        new_set = set(new_labels)
        to_remove = old_set - new_set - {"___tech_"}
        to_add = new_set - old_set
        cypher = ""
        if to_add:
            cypher += f"SET n:{':'.join(to_add)}\n"
        if to_remove:
            cypher += f"REMOVE n:{':'.join(to_remove)}"
        return cypher

    def _get_node_by_semantic_id(self, semantic_id):
        """Get node by semantic id's."""

        label = extract_id_metatype(semantic_id)
        name = id_handling.get_base_id(semantic_id)
        if not label or not name:
            return None

        query = (
            f"MATCH (n:{label.value}) "
            "WHERE n.name__tech_=$name "
            "RETURN n"
        )

        result = self._run(query, name=name)
        row = result.single()
        if row:
            return mapper.neonode2grapheditor(row["n"], semantic_id=semantic_id)
        return None

    def get_node_by_id(self, nid, replace_by_pseudo_node=False):
        """Fetch a node by its id from the database.
        Might return None if not found"""
        # db:: case
        raw_db_id = parse_db_id(nid)
        if raw_db_id:
            return self._get_node_by_raw_db_id(raw_db_id)

        n = self._get_node_by_semantic_id(nid)
        if n:
            return n

        if replace_by_pseudo_node:
            return self._generate_pseudo_node(nid)
        return None

    def get_nodes_by_ids(self, ids:list[str], replace_by_pseudo_node:bool=False, filters:dict=None):
        """Fetch multiple nodes by id from the database.
        Return a dictionary of original IDs to nodes.
        If an ID is not found and replace_by_pseudo_node is True, the ID is
        mapped to a pseudo-node. Otherwise leave the id out of the resulting
        map.

        filters is an optional dictionary containing a "labels" field with
        a list of labels and/or a "properties" field containing pairs of
        property names and property values.
        "labels" are ORed, i.e. nodes must have at least one of the labels
        provided. "properties" are ANDed, nodes returned must fulfil all
        property pairs.
        """

        input_id_to_raw_db_map = self.ids_to_raw_db_ids(ids)
        raw_db_id_to_input_id_map = {
            value: key for key, value in input_id_to_raw_db_map.items()
        }
        label_filters = filters.get('labels', None) if filters else None
        property_filters = filters.get('properties', None) if filters else None
        label_filters_expression = """
            AND any(label IN $label_filters
                    WHERE label in labels(n))
        """ if label_filters else ""

        property_filter_expr = """
            AND all(pname IN keys($property_filters)
            WHERE toLower(n[pname]) CONTAINS toLower($property_filters[pname]))
        """ if property_filters else ""

        query_text = f"""MATCH (n)
        WHERE toString({g.cypher_id}(n)) IN $raw_db_ids
        {label_filters_expression}
        {property_filter_expr}
        RETURN n, toString({g.cypher_id}(n)) AS id"""

        current_app.logger.debug(f"QUERY: {query_text}")

        query_result = self._run(
            query_text,
            raw_db_ids=list(raw_db_id_to_input_id_map.keys()),
            label_filters=label_filters,
            property_filters=property_filters
        )
        fetched_nodes = {}

        for row in query_result:
            input_id = raw_db_id_to_input_id_map[row["id"]]
            n = mapper.neonode2grapheditor(row["n"], semantic_id=input_id)
            if n:
                fetched_nodes[raw_db_id_to_input_id_map[row["id"]]] = n

        for nid in ids:
            # semantic ids are still returned if replace_pseudo_node is true
            if (nid not in fetched_nodes
                and parse_semantic_id(nid)
                and replace_by_pseudo_node):
                fetched_nodes[nid] = self._generate_pseudo_node(nid)
        return fetched_nodes

    def get_nodes_by_names(self, names: list[str], filters:dict[str, Any] | None = None) -> dict:
        """Fetch multiple nodes by name__tech_.
        
        Return a map of name to the corresponding node.
        If a name is not found, leave it out of the map.

        For more information regarding the filters structure see get_nodes_by_ids."""

        return self._get_nodes_by_unique_property(
            prop_name = "name__tech_", prop_values=names, filters=filters
        )

    def get_nodes_by_uuids(self, uuids: list[str], filters:dict[str, Any] | None = None) -> dict:
        """Fetch multiple nodes by uuid__tech_.

        Return a map of name to the corresponding node.
        For more information regarding the filters structure see get_nodes_by_ids."""

        return self._get_nodes_by_unique_property(
            prop_name = "_uuid__tech_", prop_values=uuids, filters=filters
        )


    def _get_nodes_by_unique_property(self, prop_name:[str], prop_values:list,
                                      filters:dict[str, Any]) -> dict:
        """Helper method for retrieving nodes identified by some unique property.

        Besides elementid we have cases where we identify a node by some
        property (e.g. name__tech_ or uuid__tech_). The property to be
        used as identity is given by prop_name, the values searched for are
        prop_values. Return a dictionary mapping the (identity) property value
        and the matching node.

        prop_name and prop_values are not to be confused with properties listed
        in filters. Those can still be used for filtering results, but are not
        an identifier and thus are not used as keys of the resulting dictionary.
        """
        filters = filters or dict()
        label_filters = [
            get_base_id(label) for label in
            filters.get('labels', [])
        ]
        property_filters = {
            get_base_id(pname): pval
            for pname, pval in filters.get('properties', {}).items()
        }
        label_filters_expression = """
            AND any(label IN $label_filters
                    WHERE label in labels(n))
        """ if label_filters else ""

        property_filter_expr = """
            AND all(pname IN keys($property_filters)
            WHERE n[pname] CONTAINS $property_filters[pname])
        """ if property_filters else ""

        query_text = f"""
        MATCH (n)
        WHERE n[$prop_name] IN $prop_values
        {label_filters_expression}
        {property_filter_expr}
        RETURN n, n[$prop_name] as result
        """

        query_result = self._run(
            query_text,
            prop_name=prop_name,
            prop_values=prop_values,
            label_filters=label_filters,
            property_filters=property_filters
        )
        fetched_nodes = dict()
        for row in query_result:
            n = mapper.neonode2grapheditor(row["n"])
            if n:
                fetched_nodes[row["result"]] = n

        return fetched_nodes


    def _semantic_ids_to_raw_db_ids(self, ids):
        """Map semantic ids (list) to internal Neo4j IDs. Return a dict.

        If the ID is not in the database (e.g. it's a system::... ID),
        the entry is simply omitted from the resulting map.
        """
        ids_parts_map = {id: id_handling.semantic_id_parts(id) for id in ids}
        parts_list = []
        for semantic_id, parts in ids_parts_map.items():
            parts["original_id"] = semantic_id
            parts["label"] = parts["label"].value
            parts_list.append(parts)

        query_str = f"""UNWIND $parts_list AS map
        WITH map, map['label'] AS label,
             map['name'] AS name,
             map['original_id'] AS original_id
        MATCH (n) WHERE label IN labels(n)
             AND n.name__tech_=name
        RETURN original_id, {g.cypher_id}(n) AS raw_db_id
        """
        current_app.logger.debug(query_str)
        query_result = self._run(query_str, parts_list=parts_list)
        result = {}
        for row in query_result:
            result[row["original_id"]] = row["raw_db_id"]
        return result

    def ids_to_raw_db_ids(self, ids):
        """Convert a list of IDs to a map of them to raw database ID."""
        semantic_ids = list(filter(parse_semantic_id, ids))
        raw_db_ids = list(filter(parse_db_id, ids))
        result = self._semantic_ids_to_raw_db_ids(semantic_ids)
        result = result | {id: parse_db_id(id) for id in raw_db_ids}
        return result

    @staticmethod
    def _generate_pseudo_node(nid):
        """Generate a pseudo-node for a node that doesn't exist in the
        database / system.
        """
        parts = id_handling.semantic_id_parts(nid)
        if not parts:
            # ID is malformed
            abort_with_json(400, f"Invalid ID {nid}")

        grapheditor_dict = dict(
            id=nid,
            description="A pseudo-node.",
            longDescription=f"Pseudo node for {nid}",
            properties={},
            labels=[],
            title=get_base_id(nid),
            _grapheditor_type="node",
        )
        return grapheditor_dict

    def _get_node_by_raw_db_id(self, nid):
        """Fetch a node by its id from the database.
        Might return None if not found."""
        result = self._run(
            f"MATCH (n) WHERE {g.cypher_id}(n)={cast_id('$nid')} RETURN n",
            nid=nid,
        )
        row = result.single()

        if row is not None:
            return mapper.neonode2grapheditor(row["n"], semantic_id=nid)
        return None

    def replace_node_by_id(self, nid, node_data, existing_node=None):
        """Replace a node by its id from the GraphEditor node_data."""
        if parse_unknown_id(nid):
            return None

        if not existing_node:
            existing_node = self.get_node_by_id(nid, True)

        raw_db_id = parse_db_id(existing_node["id"])
        if not raw_db_id:
            raw_db_id = existing_node["id"]

        old_labels = list(map(get_base_id, existing_node["labels"]))
        new_labels = list(map(get_base_id, node_data["labels"]))
        label_update = self._get_update_label_cypher(old_labels, new_labels)

        properties = mapper.compute_updated_properties(
            existing_node["properties"], node_data["properties"]
        )

        result = self._run(
            f"""MATCH (n) WHERE {g.cypher_id}(n)={cast_id('$nid')}
                SET n=$properties
                {label_update}
                RETURN n
            """,
            nid=raw_db_id,
            properties=properties,
        )

        return mapper.neonode2grapheditor(result.single()["n"], semantic_id=nid)

    def update_node_by_id(self, nid, node_data, existing_node=None):
        """Update node with ID `nid` according to `node_data`.
        `node_data` is a dict containing partial information
        of a node.

        If `existing_node` is given, update it. Otherwise fetch the
        node corresponding to `nid`.

        Return updated node."""
        if parse_unknown_id(nid):
            return None

        if not existing_node:
            existing_node = self.get_node_by_id(nid, True)

        if not existing_node:
            current_app.logger.error(
                f"Update Node {nid} doesn't exist in the database."
            )
            return None

        raw_db_id = parse_db_id(existing_node["id"])
        if not raw_db_id:
            raw_db_id = parse_db_id(existing_node["dbId"])

        label_update = ""
        if "labels" in node_data:
            old_labels = list(map(get_base_id, existing_node["labels"]))
            new_labels = list(map(get_base_id, node_data["labels"]))
            label_update = self._get_update_label_cypher(
                old_labels, new_labels
            )

        if "properties" in node_data:
            properties = mapper.compute_updated_properties(
                existing_node["properties"], node_data["properties"]
            )
        else:
            properties = {
                get_base_id(k): v["value"]
                for k, v in existing_node["properties"].items()
            }

        if properties:
            result = self._run(
                f"""MATCH (n) WHERE {g.cypher_id}(n)={cast_id('$nid')}
                    SET n=$properties
                    {label_update}
                    RETURN n""",
                nid=raw_db_id,
                properties=properties,
            )

        else:
            result = self._run(
                f"""MATCH (n) WHERE {g.cypher_id}(n)={cast_id('$nid')}
                    {label_update}
                    RETURN n""",
                nid=raw_db_id,
            )

        if not result:
            current_app.logger.debug("No matching relations.")
            return None
        return mapper.neonode2grapheditor(result.single()["n"], semantic_id=nid)

    def delete_nodes_by_ids(self, ids):
        """Delete multiple nodes by their ids"""
        current_app.logger.debug(f"deleting node IDs {ids}")
        raw_db_ids = list(self.ids_to_raw_db_ids(ids).values())
        if not raw_db_ids:
            return None
        if _is_version_4_or_less():
            raw_db_ids = [int(nid) for nid in raw_db_ids]

        result = self._run(
            f"""MATCH (n) WHERE {g.cypher_id}(n) IN {raw_db_ids}
            CALL (n) {{ DETACH DELETE n }}
            RETURN COUNT(n) AS c"""
        )
        return result.single()["c"]

    @staticmethod
    def _get_node_relations_filter_expressions(filters):
        rel_props_expr = ""
        neighbor_props_expr = ""
        where_clauses = ""

        if rel_props := filters.get("relation_properties"):
            rel_props_expr = " " + python_value_to_cypher(
                map_dict_keys(rel_props, get_base_id)
            )

        if n_props := filters.get("neighbor_properties"):
            neighbor_props_expr = " " + python_value_to_cypher(
                map_dict_keys(n_props, get_base_id)
            )

        if rel_type := filters.get("relation_type", ""):
            where_clauses += (
                " AND " + f" type(r) = '{id_handling.get_base_id(rel_type)}' "
            )

        if n_labels := filters.get("neighbor_labels", ""):
            where_clauses += (
                " AND "
                + f""" ALL(label IN {[id_handling.get_base_id(l)
                                          for l in n_labels]}
                       WHERE label IN labels(neighbor))"""
            )

        return {
            "relation_properties": rel_props_expr,
            "neighbor_properties": neighbor_props_expr,
            "where_clauses": where_clauses,
        }

    def _get_node_relations_by_raw_db_id(self, raw_db_id, filters):
        """Get node relations from node with internal db_id."""

        incoming_with_source = []
        outgoing_with_target = []
        direction = filters["direction"]
        exprs = self._get_node_relations_filter_expressions(filters)

        if direction in {"both", "incoming"}:
            neighbor_props = exprs.get("neighbor_properties")
            rel_props = exprs.get("relation_properties")
            where_clauses = exprs.get("where_clauses")
            incoming_res = self._run(
                f"MATCH (neighbor{neighbor_props})-[r{rel_props}]->(n)"
                f" WHERE {g.cypher_id}(n)={cast_id('$nid')} {where_clauses} "
                "RETURN r, neighbor",
                nid=raw_db_id,
            )
            incoming_with_source = [
                {
                    "relation": mapper.neorelation2grapheditor(row["r"]),
                    "neighbor": mapper.neonode2grapheditor(row["neighbor"]),
                    "direction": "incoming",
                }
                for row in incoming_res
            ]

        if direction in {"both", "outgoing"}:
            neighbor_props = exprs.get("neighbor_properties")
            rel_props = exprs.get("relation_properties")
            where_clauses = exprs.get("where_clauses")
            outgoing_res = self._run(
                f"MATCH (n)-[r{rel_props}]->(neighbor{neighbor_props}) "
                f"WHERE {g.cypher_id}(n)={cast_id('$nid')} {where_clauses} "
                "RETURN r, neighbor",
                nid=raw_db_id,
            )
            outgoing_with_target = [
                {
                    "relation": mapper.neorelation2grapheditor(row["r"]),
                    "neighbor": mapper.neonode2grapheditor(row["neighbor"]),
                    "direction": "outgoing",
                }
                for row in outgoing_res
            ]
        return incoming_with_source + outgoing_with_target

    def _get_node_relations_by_semantic_id(self, semantic_id, filters):
        """Get node relations from node with semantic_id.
        Return None if invalid."""
        incoming_with_source = []
        outgoing_with_target = []
        direction = filters["direction"]
        metatype = extract_id_metatype(semantic_id)
        base_id = id_handling.get_base_id(semantic_id)

        if not metatype or not base_id:
            return None

        node_filter = ":" + metatype.value

        exprs = self._get_node_relations_filter_expressions(filters)

        if direction in {"both", "incoming"}:
            neighbor_props = exprs.get("neighbor_properties")
            rel_props = exprs.get("relation_properties")
            where_clauses = exprs.get("where_clauses")
            incoming_res = self._run(
                # pylint: disable=line-too-long
                f"""
                MATCH (neighbor{neighbor_props})-[r{rel_props}]->(n{node_filter})
                WHERE n.name__tech_=$name {where_clauses}
                RETURN r, neighbor""",
                name=base_id,
            )
            incoming_with_source = [
                {
                    "relation": mapper.neorelation2grapheditor(row["r"]),
                    "neighbor": mapper.neonode2grapheditor(row["neighbor"]),
                    "direction": "incoming",
                }
                for row in incoming_res
            ]

        if direction in {"both", "outgoing"}:
            neighbor_props = exprs.get("neighbor_properties")
            rel_props = exprs.get("relation_properties")
            # pylint: disable=line-too-long
            outgoing_res = self._run(
                f"""MATCH (n{node_filter})-[r{rel_props}]->(neighbor{neighbor_props})
                WHERE n.name__tech_=$name {exprs.get('where_clauses')}
                RETURN r, neighbor""",
                name=base_id,
            )
            outgoing_with_target = [
                {
                    "relation": mapper.neorelation2grapheditor(row["r"]),
                    "neighbor": mapper.neonode2grapheditor(row["neighbor"]),
                    "direction": "outgoing",
                }
                for row in outgoing_res
            ]
        return incoming_with_source + outgoing_with_target

    def get_node_relations(self, nid, filters):
        """Return all relations that have node with ID 'nid' as source
        and/or target, or None if the ID is a db_id and doesn't exist.

        Each relation is returned in an array together with the other
        "participant" node.
        """

        raw_db_id = parse_db_id(nid)

        if raw_db_id:
            rels = self._get_node_relations_by_raw_db_id(raw_db_id, filters)
            if not rels:
                # We have to distinguish if nothing was returned
                # because there are no relations (which should end in
                # a 200 response) or the db_id doesn't exist in the
                # database (404).
                if not self._get_node_by_raw_db_id(raw_db_id):
                    return None
            return rels

        # if nid was not of kind id::, treat it as an semantic id
        return self._get_node_relations_by_semantic_id(nid, filters)

    def _neighbors_query_string(self, relation_types=None, direction="incoming",
                                neighbors_filters=None):
        """Return a query string for fetching neighbors from multiple nodes."""
        # swap target/node variables according to direction
        source_var = "n" if direction == "incoming" else "m"
        target_var = "m" if direction == "incoming" else "n"
        if relation_types is None:
            relation_types = []
        rel_type_expr = (
            " AND type(r) IN $relation_types "
            if relation_types else ""
        )

        label_filters = neighbors_filters.get('labels', None) if neighbors_filters else None
        property_filters = neighbors_filters.get('properties', None) if neighbors_filters else None
        label_filters_expr = """
            AND any(label IN $label_filters
                    WHERE label in labels(n))
        """ if label_filters else ""

        property_filter_expr = """
            AND all(pname IN keys($property_filters)
            WHERE n[pname] CONTAINS $property_filters[pname])
        """ if property_filters else ""

        return f"""
        UNWIND $id_pairs AS id_pair
        WITH id_pair[0] AS original_id, id_pair[1] AS raw_db_id
        MATCH ({source_var})-[r]->({target_var})
        WHERE {g.cypher_id}(m) = {cast_id('raw_db_id')}
        {label_filters_expr}
        {property_filter_expr}
        {rel_type_expr}
        RETURN original_id, n
        """

    def get_relations_by_node_ids(self, node_ids, exclude_relation_types=None):
        """Return all relations that have any of the nodes with IDs 'node_ids'
        as source and/or target.
        """
        if exclude_relation_types is None:
            exclude_relation_types = []
        result = g.conn.run(
            f"MATCH (a)-[r]->(b) WHERE {g.cypher_id}(a) in {node_ids} AND "
            f"{g.cypher_id}(b) IN {node_ids} AND "
            f"NOT type(r) in {exclude_relation_types} RETURN r"
        )
        return [mapper.neorelation2grapheditor(row["r"]) for row in result]


    def get_nodes_neighbors(
            self, id_map: dict[str, str],
            relation_types: list[str],
            direction="both",
            neighbors_filters=None
    ) -> dict[str, dict]:
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
        # Cypher accepts neither identifiers with double-colons nor
        # strings as keys.  So we convert id_map to an array of arrays
        # before processing it.
        id_pairs = dict_to_array(id_map)

        result = {}
        property_filters = neighbors_filters.get('properties', None) if neighbors_filters else None
        label_filters = neighbors_filters.get('labels', None) if neighbors_filters else None

        if direction in ["both", "outgoing"]:
            query_str = self._neighbors_query_string(relation_types, "outgoing", neighbors_filters)
            res = g.conn.run(query_str,
                             id_pairs=id_pairs,
                             relation_types=relation_types,
                             label_filters=label_filters,
                             property_filters=property_filters)

            for row in res:
                node = mapper.neonode2grapheditor(row["n"])
                oid = row["original_id"]
                if oid in result:
                    result[oid][node["id"]] = node
                else:
                    result[oid] = {node["id"]: node}
        else:
            query_str = self._neighbors_query_string(relation_types, "incoming", neighbors_filters)
            res = g.conn.run(query_str,
                             id_pairs=id_pairs,
                             relation_types=relation_types,
                             label_filters=label_filters,
                             property_filters=property_filters)

            for row in res:
                node = mapper.neonode2grapheditor(row["n"])
                oid = row["original_id"]
                if oid in result:
                    result[oid][node["id"]] = node
                else:
                    result[oid] = {node["id"]: node}

        return result

    def incoming_relation_types(self, node_ids):
        query_text = """
        MATCH (a)-[r]->(b)
        WHERE elementid(b) IN $node_ids
        RETURN type(r) AS rel_type, count(a) AS num_neighbors
        """
        result = self._run(query_text, node_ids=node_ids)
        return {
            row['rel_type']: row['num_neighbors']
            for row in result
        }

    def outgoing_relation_types(self, node_ids):
        query_text = """
        MATCH (a)-[r]->(b)
        WHERE elementid(a) IN $node_ids
        RETURN type(r) AS rel_type, count(b) AS num_neighbors
        """
        result = self._run(query_text, node_ids=node_ids)
        return {
            row['rel_type']: row['num_neighbors']
            for row in result
        }

    def query_nodes(self, text, labels, pseudo):
        """Return nodes which contain text and labels.

        If the database has _ft__tech_ support, use it. Otherwise search
        across all properties of all nodes
        """

        # pylint: disable=unused-argument
        filter_expr = ""
        if text != "":
            # if text is an ID, strip out the base and search for that instead
            raw_db_id = parse_db_id(text)
            if raw_db_id:
                text = raw_db_id

            filter_expr = f"""
                ((n.`_ft__tech_` CONTAINS toLower("{text}")) OR
                 (ANY(prop in keys(n) WHERE (
                              NOT prop STARTS WITH "_") AND (
                              (toLower(toStringOrNull(n[prop])) STARTS WITH toLower($text)) OR
                              (toLower(prop) STARTS WITH toLower($text))
                             )
                          ) OR
                          toString({g.cypher_id}(n)) = {cast_id('$text')}))"""

        if labels:
            if filter_expr:
                filter_expr += "\n AND "
            filter_expr += f"n:{':'.join(labels)}"

        query = f"""MATCH (n)
                    {filter_expr and 'WHERE' or ''}
                    {filter_expr}
                    RETURN n;
                """
        result = self._run(query, text=text)
        nodes = [mapper.neonode2grapheditor(row["n"]) for row in result]
        return nodes

    # ======================= Relation related ================================

    def get_relation_by_id(self, rid):
        """Fetch a relation by its id from the database.
        Might return None if not found"""

        raw_db_id = parse_db_id(rid)
        if raw_db_id is None:
            return None
        return self._get_relation_by_raw_db_id(raw_db_id)

    def get_relations_by_ids(self, rids):
        """Fetch relations by their IDs. Return a map of IDs to
        Relation objects.  Assume all IDs are in the format
        id::<id> ."""
        id_map = {
            raw_db_id: rid for rid in rids if (raw_db_id := parse_db_id(rid))
        }
        query = f"""
        UNWIND $ids AS id
        MATCH ()-[r]->() WHERE {g.cypher_id}(r)={cast_id('id')}
        RETURN r, id
        """
        res = self._run(query, ids=list(id_map.keys()))
        return {
            id_map[row["id"]]: mapper.neorelation2grapheditor(row["r"])
            for row in res
        }

    def _get_relation_by_raw_db_id(self, rid):
        result = self._run(
            f"""MATCH ()-[r]->() WHERE {g.cypher_id}(r)={cast_id('$rid')}
                RETURN r""",
            rid=rid,
        )
        row = result.single()
        if row is not None:
            return mapper.neorelation2grapheditor(row["r"], semantic_id=rid)
        return None

    def _update_relation_references(self, old_rid, new_rid):
        query = f"""
        MATCH (n)-[r]->() WHERE {g.cypher_id}(r)={cast_id('$new_full_rid')}
        MATCH (p)-[pos:pos__tech_]->(n)
        WITH pos.out_relations__tech_ AS old_rels,
             pos,
             [out_rel IN pos.out_relations__tech_ |
              CASE out_rel
              WHEN $old_rid THEN $new_rid
              ELSE out_rel
              END] AS updated_rels
        SET pos.out_relations__tech_ = updated_rels
        RETURN pos
        """
        self._run(
            query,
            new_full_rid=new_rid,
            old_rid=id_handling.get_internal_id(old_rid),
            new_rid=id_handling.get_internal_id(new_rid),
        )

    def update_relation_by_id(
        self, rid, relation_data, existing_relation=None
    ):
        """Update relation with id `rid` according to `relation_data`.
        `relation_data` is a dict containing partial information
        of a relation.

        If `existing_relation` is given, update it. Otherwise fetch the
        node corresponding to nid.

        Return the updated relation."""
        raw_db_id = parse_db_id(rid)
        if raw_db_id is None:
            return None

        if not existing_relation:
            existing_relation = self.get_relation_by_id(rid)

        if not existing_relation:
            current_app.logger.error(
                f"Relation {rid} doesn't exist in the database."
            )
            return None

        if "properties" in relation_data:
            # collect new properties with corresponding base IDS and keep
            # mandatory ones from the existing relation
            properties = mapper.compute_updated_properties(
                existing_relation["properties"], relation_data["properties"]
            )
        else:
            properties = {
                get_base_id(key): value["value"]
                for key, value in existing_relation["properties"].items()
            }

        if (
            "type" in relation_data
            and relation_data["type"] != existing_relation["type"]
        ):
            new_type = relation_data["type"].split(":")[-1]
            result = self._run(
                f"""
                MATCH (n)-[r]->(m) WHERE {g.cypher_id}(r)={cast_id('$rid')}
                CALL apoc.create.relationship(n, $new_type, $properties, m)
                YIELD rel AS r2
                DELETE r
                RETURN r2 AS r
            """,
                new_type=new_type,
                rid=raw_db_id,
                properties=properties,
            )
        else:
            result = self._run(
                f"""MATCH ()-[r]->() WHERE {g.cypher_id}(r)={cast_id('$rid')}
                    SET r=$properties
                    RETURN r""",
                rid=raw_db_id,
                properties=properties,
            )

        if not result:
            current_app.logger.debug("No matching relations.")
            return None

        new_rel = result.single()["r"]
        self._update_relation_references(raw_db_id, new_rel.element_id)

        if raw_db_id:
            return mapper.neorelation2grapheditor(new_rel)
        return mapper.neorelation2grapheditor(new_rel, semantic_id=rid)

    def create_relations(self, relation_data_list: list[dict]):
        """Create multiple nodes at once.
        Return a dictionary mapping IDs to generated relations.

        For now this method transforms node data contained in its input.
        """

        for relation_data in relation_data_list:
            updated_type = get_base_id(relation_data["type"])
            updated_properties = {
                get_base_id(k): v["value"]
                for k, v in relation_data["properties"].items()
                if k != "_uuid__tech_"
            } if "properties" in relation_data else {}
            source_id = parse_db_id(relation_data["source_id"])
            target_id = parse_db_id(relation_data["target_id"])
            relation_data["type"] = updated_type
            relation_data["properties"] = updated_properties
            relation_data["source_id"] = source_id
            relation_data["target_id"] = target_id

        query_text = """
        UNWIND $relation_data_list AS rel_data
        MATCH (n),(m)
        WHERE elementid(n) = rel_data['source_id']
          AND elementid(m) = rel_data['target_id']
        CALL apoc.create.relationship(
                 n, rel_data['type'], rel_data['properties'], m
             )
        YIELD rel AS r
        WITH r, count(r) AS num_new_rels, count(rel_data) AS num_input_rels
        WITH r, num_new_rels, num_input_rels, num_new_rels <> num_input_rels AS same_size
        CALL apoc.util.validate(
            same_size,
            'Number of created relations (%d) differ from input size (%d).',
            [num_new_rels, num_input_rels]
        )
        RETURN r, elementid(r) as rid
        """
        new_rels = {}
        try:
            query_result = self._run(query_text,
                                     relation_data_list=relation_data_list)
            new_rels = {
                f"id::{row['rid']}": mapper.neorelation2grapheditor(row["r"])
                for row in query_result
            }
            # even if we use apoc.util.validate in cypher, it may still be
            # the case where MATCH never matches, so validation code is not
            # reached. In that case we check it again, and it's safe to assume
            # that no change was done to the database.
            if len(new_rels) != len(relation_data_list):
                abort_with_json(400, "Could not create relations. " +
                                "Check if both source and target IDs exist.")
        except neo4j.exceptions.ClientError as e:
            abort_with_json(400,
                            "Couldn't create relations. " +
                            "Check if both source and target IDs exist: " +
                            repr(e))

        return new_rels

    def delete_relations_by_ids(self, ids):
        """Delete multiple relations by ids"""
        current_app.logger.debug(f"deleting relation IDs {ids}")
        raw_db_ids = list(self.ids_to_raw_db_ids(ids).values())
        if not raw_db_ids:
            return None

        if _is_version_4_or_less():
            raw_db_ids = [int(rid) for rid in raw_db_ids]

        result = self._run(
            f"""MATCH ()-[r]->() WHERE {g.cypher_id}(r) IN {raw_db_ids}
                CALL (r) {{
                  DELETE r
                }}
                RETURN COUNT(r) AS c"""
        )
        return result.single()["c"]

    def fulltext_query_relations(self, text):
        """Return relations which contain text.

        If the database has _ft__tech_ support, use it. Otherwise query
        across all relations, looking in property keys and values.
        """
        filter_expr = ""
        text = get_base_id(text)
        if text != "":
            filter_expr = f"""WHERE r.`_ft__tech_` CONTAINS toLower("{text}") OR
            ANY(prop IN KEYS(r)
                WHERE (NOT prop STARTS WITH "_") AND
                       ((toLower(toStringOrNull(r[prop])) STARTS WITH toLower($text)) OR
                        (toLower(prop) STARTS WITH toLower($text))) OR
                       {g.cypher_id}(r) = {cast_id('$text')} OR
                       toLower(type(r)) STARTS WITH toLower($text))"""
        query = f"""MATCH ()-[r]->()
                    {filter_expr}
                    RETURN r;
                """
        result = self._run(query, text=text)
        relations = [mapper.neorelation2grapheditor(row["r"]) for row in result]
        return relations

    # ======================= Perspective related =============================

    def _set_perspective_node_positions(self, pid, data):
        """Update node positions in perspective.
        Args:
            pid: perspective ID (string).
            data: dictionary node_id->{x: <X>, y: <Y>, z: <Z>}
        """
        arr = [
            {
                "id": parse_db_id(nid),
                "x": pos["x"],
                "y": pos["y"],
                "z": pos["z"] if "z" in pos else 0,
            }
            for nid, pos in data.items()
        ]
        query = f"""
        UNWIND $arr AS pos
        MATCH (p WHERE {g.cypher_id}(p) = {cast_id('$pid')})
        MATCH (n WHERE {g.cypher_id}(n) = {cast_id('pos.id')})
        CREATE (p)-[:pos__tech_ {{x__tech_: pos.x,
                                  y__tech_: pos.y,
                                  z__tech_: pos.z,
                                  out_relations__tech_: []
                                }}]->(n);
        """

        self._run(query, pid=pid, arr=arr)

    def _set_perspective_relations(self, pid, data):
        """Update out_relations from perspective.
        Set out_relations__tech_ property of each perspective node to include
        relation IDs contained in data.
        Args:
            pid: perspective ID (string).
            data: array of relation IDs.
        """
        rel_query = f"""
        UNWIND $arr AS rel_id
        MATCH (p)-[pos:pos__tech_]->(n)-[r]->()
        WHERE id(r) = rel_id
              AND r._uuid__tech_ IS NOT NULL
              AND {g.cypher_id}(p) = {cast_id('$pid')}
        SET pos.out_relations__tech_ = [r._uuid__tech_] + pos.out_relations__tech_
        """

        rel_arr = [id_handling.get_internal_id(rid) for rid in data]
        current_app.logger.debug(f"rel_arr: {rel_arr}")
        if rel_arr:
            self._run(rel_query, pid=pid, arr=rel_arr)

    def create_perspective(self, perspective_data):
        """Create a perspective from a dictionary of node ID's and the
        corresponding positions.
        """

        create_query = f"""CREATE (p: Perspective__tech_)
                           SET p.name__tech_ = $name,
                               p.description__tech_ = $description
                           RETURN {g.cypher_id}(p) as id"""
        name = perspective_data.get("name", "")
        description = perspective_data.get("description", "")
        result = self._run(create_query, name=name, description=description)

        pid = result.single()["id"]
        if not pid:
            current_app.logger.error("Failed creating perspective")
            return None

        self._set_perspective_node_positions(
            pid, perspective_data["node_positions"]
        )

        self._set_perspective_relations(pid, perspective_data["relation_ids"])

        return f"id::{pid}"

    def _collect_perspective_graph(self, query_result):
        """Given a query result corresponding to a perspective, return the
        corresponding perspective name, grapheditor nodes and relations found in it.
        """
        nodes = {}
        relations = {}
        perspective_name = None
        perspective_desc = None

        for row in query_result:
            if not perspective_name:
                perspective_name = row["p"]["name__tech_"]
            if not perspective_desc:
                perspective_desc = row["p"]["description__tech_"]
            pos = row["pos"]
            node = mapper.neonode2grapheditor(row["b"])
            node["style"]["x"] = pos["x__tech_"]
            node["style"]["y"] = pos["y__tech_"]
            if row["rel_uid"] != "last_element" and row["r"] is not None:
                new_rel = mapper.neorelation2grapheditor(row["r"])
                relations[f"id::{row['rel_id']}"] = new_rel
            nodes[node["dbId"]] = node

        return {
            "name": perspective_name,
            "description": perspective_desc,
            "nodes": nodes,
            "relations": relations,
        }

    def get_perspective_by_id(self, pid):
        """Get perspective by ID.

        The result contains the perspective nodes and relations.
        """
        raw_db_id = parse_db_id(pid)
        if not raw_db_id:
            abort_with_json(404, f"Invalid perspective ID: {pid}")

        # in the UNWIND call we add a dummy string to the list (out_relations),
        # so that we still get results even when out_relations is empty.
        query = f"""
        MATCH (p:Perspective__tech_)-[pos:pos__tech_]->(b)
        WHERE {g.cypher_id}(p)={cast_id('$raw_db_id')}
        UNWIND pos.out_relations__tech_ + 'last_element' as rel_uid
        OPTIONAL MATCH ()-[r]->(c) where r._uuid__tech_=rel_uid
        RETURN p, pos, b, r, rel_uid, {g.cypher_id}(r) AS rel_id
        """

        result = self._run(query, raw_db_id=raw_db_id)
        pers_data = self._collect_perspective_graph(result)

        if "name" not in pers_data:
            # even though the result was empty, it might be the case
            # the perspective being updated has no "pos"-relations. So
            # we check if there is a corresponding perspective node at
            # all.
            p = self._get_node_by_raw_db_id(raw_db_id)
            if not p:
                abort(404)

        return {**{"id": pid}, **pers_data}

    def replace_perspective_by_id(self, pid, json):
        """Replace perspective with ID <pid> by data provided in json (a dict).

        Note: previously existing "pos"-edges are removed and replaced by new
        ones.
        """
        raw_db_id = parse_db_id(pid)
        query = f"""
        MATCH (p)-[pos:pos__tech_]->()
        WHERE {g.cypher_id}(p) = {cast_id('$raw_db_id')}
        SET p.name__tech_ = $name
        DELETE pos
        """
        self._run(
            query,
            raw_db_id=raw_db_id,
            name=json["name"] if "name" in json else "",
        )

        self._set_perspective_node_positions(raw_db_id, json["node_positions"])
        self._set_perspective_relations(raw_db_id, json["relation_ids"])

        return pid

    # ---------------------- Paraqueries ---------------------------------

    def _get_parameter_suggestions(self, selection_query):
        result = g.conn.run(selection_query)
        suggestions = []
        for row in result:
            val = row.value()
            # we don't put None or empty string into list of suggestions.
            if val:
                suggestions.append(val)
            else:
                current_app.logger.warn("selection__tech_ return empty entries.")
        return suggestions

    def get_paraqueries(self):
        result = g.conn.run(f"""
        MATCH (param:Parameter__tech_)-[rel:parameter__tech_]->(pquery:Paraquery__tech_)
        RETURN {g.cypher_id}(pquery) AS pquery_id, pquery,
               {g.cypher_id}(param) AS param_id, param,
               rel
        """)
        pquery_dict = dict()
        for row in result:
            pquery_id = f"id::{row['pquery_id']}"
            param_id = f"id::{row['param_id']}"
            pquery_node = row["pquery"]
            param_node = row["param"]
            rel = row["rel"]
            param_name = rel.get("parameter_name__tech_", None)
            if not param_name:
                current_app.logger.warning(f"Parameter doesn't have a name {param_id}")
                continue

            if pquery_id not in pquery_dict:
                pquery_dict[pquery_id] = {
                    "uuid": pquery_node.get("_uuid__tech_", ""),
                    "name": pquery_node.get("name__tech_", ""),
                    "description": pquery_node.get("description__tech_", ""),
                    "user_text": pquery_node.get("user_text__tech_", ""),
                    "cypher": pquery_node.get("cypher__tech_", ""),
                    "parameters": dict()
                }
            params = pquery_dict[pquery_id]["parameters"]
            if param_name not in params:
                new_param = {
                    "help_text": param_node.get("help_text__tech_", ""),
                    "type": param_node.get("type__tech_", "")
                }
                if "default_value__tech_" in rel:
                    new_param["default_value"] = rel["default_value__tech_"]
                if "selection__tech_" in param_node:
                    suggestions = self._get_parameter_suggestions(param_node["selection__tech_"])
                    new_param["suggestions"] = suggestions
                params[param_name] = new_param
        return pquery_dict


    # ---------------------- General information ------------------------------
    def _get_metaobjects(self, metalabel):
        """Get all elements with the given 'metalabel' (MetaLabel, MetaProperty
        etc.)"""
        query = f"""MATCH (def: {metalabel})
                    RETURN def.name__tech_ AS def_name"""
        query_result = self._run(query)
        result = {r["def_name"] for r in query_result}
        return result

    def _get_metalabels(self):
        g.modelled_labels = self._get_metaobjects("MetaLabel__tech_")
        return g.modelled_labels

    def _get_metaproperties(self):
        g.modelled_properties = self._get_metaobjects("MetaProperty__tech_")
        return g.modelled_properties

    def _get_metarelations(self):
        g.modelled_relation_types = self._get_metaobjects("MetaRelation__tech_")
        return g.modelled_relation_types

    def load_metamodels(self):
        """Load metamodels and set corresponding "globals".

        This is needed in order to correctly build semantic ids.
        """
        self._get_metalabels()
        self._get_metaproperties()
        self._get_metarelations()

    def get_all_labels(self, nids: List[str] = None):
        """Return all labels as GraphEditorIDs.
        If nids is set, only labels of node ids in it are returned.
        """
        if nids:
            query = f"""
            MATCH (n) WHERE {g.cypher_id}(n) IN $nids
            UNWIND labels(n) AS l
            RETURN DISTINCT l AS label
            """
            result = self._run(query, nids=nids)
        else:
            query = """MATCH (n) UNWIND labels(n) AS l
            RETURN DISTINCT l AS label
            UNION
            MATCH (m:MetaLabel__tech_)
            RETURN DISTINCT m.name__tech_ AS label
            """
            result = self._run(query)
        semantic_ids = set()
        for r in result:
            label = r["label"]
            stringid = compute_semantic_id(
                label, GraphEditorLabel.MetaLabel
            )
            semantic_ids.add(stringid)
        return sorted(list(semantic_ids))

    def get_all_types(self):
        """Return all relation types as GraphEditorIDs."""
        query = """
        MATCH ()-[r]->()
        RETURN DISTINCT type(r) AS type
        UNION
        MATCH (m:MetaRelation__tech_)
        RETURN DISTINCT m.name__tech_ AS type
        """
        result = self._run(query)
        stringids = set()
        for r in result:
            rel_type = r["type"]
            stringid = compute_semantic_id(
                rel_type, GraphEditorLabel.MetaRelation
            )
            stringids.add(stringid)
        return sorted(list(stringids))

    def _properties_result_to_stringids(self, result):
        """Convert a query result with properties to string IDs."""
        stringids = set()
        for r in result:
            prop = r["prop"]
            stringid = compute_semantic_id(
                prop, GraphEditorLabel.MetaProperty
            )
            stringids.add(stringid)

        return sorted(list(stringids))

    def get_all_node_properties(self, nids: List[str] = None):
        """Return semantic IDs of all node properties.
        If nids is set, only properties of node ids in it are returned.
        """

        if nids:
            query = f"""
            MATCH (n) WHERE {g.cypher_id}(n) in $nids
            UNWIND keys(n) AS key
            RETURN DISTINCT key AS prop
            """
            result = self._run(query, nids=[get_base_id(nid) for nid in nids])
        else:
            query = """MATCH (n)
            UNWIND keys(n) AS key
            RETURN DISTINCT key AS prop
            UNION
            MATCH (p:MetaProperty__tech_)-[r:prop__tech_]->(n:MetaLabel__tech_)
            RETURN DISTINCT p.name__tech_ AS prop
            """
            result = self._run(query)
        return self._properties_result_to_stringids(result)

    def get_all_relation_properties(self):
        """Return all relation properties as stringids."""
        query = """MATCH ()-[r]->()
                   UNWIND keys(r) AS key
                   RETURN DISTINCT key AS prop
                   UNION
                   MATCH (p:MetaProperty__tech_)-[r:prop]->(rel:MetaRelation__tech_)
                   RETURN DISTINCT p.name__tech_ AS prop
                """
        result = self._run(query)
        return self._properties_result_to_stringids(result)


def _is_version_4_or_less():
    version = g.conn.fetch_version()
    major = version.split(".")[0]
    return int(major) < 5


def cast_id(x):
    if _is_version_4_or_less():
        return f"toInteger({x})"
    return x
