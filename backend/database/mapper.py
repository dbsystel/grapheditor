"""Utility module with function to map identifiers and data from Neo4j to
GraphEditor and vice-versa
"""

import copy
from dataclasses import dataclass
from typing import Optional
from flask import current_app
import neo4j

from blueprints.display.style_support import apply_style_rules
from database.utils import find_a_value
from database.settings import config
from database.id_handling import (
    compute_semantic_id, get_base_id, GraphEditorLabel, semantic_id_parts
)
from database.base_types import BaseNode, BaseRelation, BaseElement

# ----------------------- Constants --------------------------------------

# pylint: disable-next=line-too-long
# See https://neo4j.com/docs/cypher-manual/current/values-and-types/property-structural-constructed/
cypher_types = [
    "boolean",
    "date",
    "duration",
    "float",
    "integer",
    "list_boolean",
    "list_date",
    "list_duration",
    "list_float",
    "list_integer",
    "list_local_datetime",
    "list_local_time",
    "list_point",
    "list_string",
    "list_zoned_time",
    "local_datetime",
    "local_time",
    "point",
    "string",
    "zoned_time",
]
pythontype2json = dict(
    str="string",
    int="integer",
    float="float",
    bool="boolean",
    list="list",
    dict="dict",
    tuple="tuple",
)
special_properties = [
    "MetaProperty::name",
    "MetaProperty::description",
]

DEFAULT_RELATION_TYPE = "MetaRelation::FIX_ME"

# all internal tech properties
TECH_PROPERTIES = {"_ft__tech_", "_uuid__tech_"}

# all labels used at the metalevel (MetaLabel, MetaRelation, Restriction etc.).
# Objects with labels from this set only appear at this level.
METALABELS = {e.name for e in GraphEditorLabel}

# all tech labels
TECH_LABELS = METALABELS.union({"___tech_"})

@dataclass
class GraphEditorElement():
    id: str
    properties: dict

# dataclasses representing API may have many attributes.
# our API uses pascalCase.
# pylint: disable=too-many-instance-attributes
# pylint: disable=invalid-name
@dataclass
class GraphEditorNode(GraphEditorElement):
    labels: list
    description: str
    longDescription: str
    title: str
    style: Optional[dict] = None
    semanticId: Optional[str] = None
    dbId: Optional[str] = None
    _grapheditor_type: str = "node" # TODO remove this from datatype

    @classmethod
    def from_base_node(cls, base_node: BaseNode):
        # base_node may contain style information like x, y position
        # from perspectives.
        prev_style = copy.copy(base_node.style)
        apply_style_rules(base_node)
        base_node.style.update(prev_style)
        grapheditor_dict = neoproperties2grapheditor(base_node)
        title = get_node_title(base_node)
        sem_id = get_semantic_id_from_neonode(base_node)
        grapheditor_node = GraphEditorNode(
            id = f"id::{base_node.element_id}",
            dbId=f"id::{base_node.element_id}",
            semanticId=sem_id,
            labels=[
                compute_semantic_id(label, metalabel=GraphEditorLabel.MetaLabel)
                for label in base_node.labels
            ],
            title=title,
            _grapheditor_type='node',
            properties=grapheditor_dict["properties"],
            description=grapheditor_dict["description"],
            longDescription=grapheditor_dict["longDescription"],
            style=base_node.style
        )
        return grapheditor_node

    def to_base_node(self):
        nid = get_base_id(self.id)
        return BaseNode(
            id=nid,
            element_id=nid,
            properties={
                get_base_id(k): v["value"]
                for k, v in self.properties.items()
            },
            style="", # ignored
            labels=[get_base_id(label) for label in self.labels]
        )

    @classmethod
    def from_neo_node(cls, neo_node):
        return cls.from_base_node(BaseNode.from_neo_node(neo_node))

    @classmethod
    def create_pseudo_node(cls, nid):
        if not semantic_id_parts(nid):
            return None
        return cls(
            id=nid,
            semanticId=nid,
            description="A pseudo-node.",
            longDescription=f"Pseudo node for {nid}",
            properties={},
            labels=[],
            title=get_base_id(nid),
            _grapheditor_type="node",
        )


@dataclass
class GraphEditorRelation(GraphEditorElement):
    type: str
    source_id: str
    target_id: str
    description: str
    longDescription: str
    title: str
    style: Optional[dict] = None
    semanticId: Optional[str] = None
    dbId: Optional[str] = None
    _grapheditor_type: str = "relation" # TODO remove this from datatype

    @classmethod
    def from_base_relation(cls, base_relation: BaseRelation, semantic_id: str | None = None):
        # base_relation may contain style information like x, y position
        # from perspectives.
        prev_style = copy.copy(base_relation.style)
        apply_style_rules(base_relation)
        base_relation.style.update(prev_style)
        title = get_relation_title(base_relation)
        grapheditor_dict = neoproperties2grapheditor(base_relation, semantic_id)
        source_id = f"id::{base_relation.source.element_id}"
        target_id = f"id::{base_relation.target.element_id}"
        grapheditor_dict = neoproperties2grapheditor(base_relation, semantic_id=semantic_id)
        grapheditor_rel = GraphEditorRelation(
            id=(
                semantic_id
                if semantic_id
                else f"id::{base_relation.element_id}"
            ),
            dbId=f"id::{base_relation.element_id}",
            semanticId = semantic_id or "",
            title=title,
            source_id=source_id,
            target_id=target_id,
            type=compute_semantic_id(
                base_relation.type, metalabel=GraphEditorLabel.MetaRelation
            ),
            properties=grapheditor_dict["properties"],
            description=grapheditor_dict["description"],
            longDescription=grapheditor_dict["longDescription"],
            style=base_relation.style,
            _grapheditor_type="relation",
        )
        return grapheditor_rel

    @classmethod
    def from_neo_relation(cls, neo_relation):
        return cls.from_base_relation(
            BaseRelation.from_neo_relation(neo_relation)
        )

    def remove_semantic_ids(self):
        self.type = get_base_id(self.type)
        self.properties = {
            get_base_id(k): v["value"]
            for k, v in self.properties.items()
        }
        self.source_id = get_base_id(self.source_id)
        self.target_id = get_base_id(self.target_id)
        return self


# ------------------------------- Functions -----------------------------------

def get_node_title(node: BaseNode):
    """Determine the title of a node by trying keys. Defaults to label: id"""

    title = find_a_value(node, keys=config.node_title_keys)
    if title:
        return title

    label = "???"
    if node.labels:
        relevant_labels = [
            label for label in node.labels if label != "___tech_"
        ]
        if relevant_labels:
            label = relevant_labels[0]
    return f"{label} {node.element_id.split(':')[-1]}"


def get_relation_title(relation):
    """Determine the title of a relation by trying keys. Defaults to type"""

    title = find_a_value(relation, keys=config.relation_title_keys)
    if title:
        return title

    return f"{relation.type}"


def neoobject2grapheditor(obj):
    """Converts arbitrary neo4j data to a dictionary where 'type'
    is the grapheditor typo, and 'contents' the corresponding grapheditor
    data structure"""
    result = None
    if isinstance(obj, neo4j.graph.Node):
        result = GraphEditorNode.from_neo_node(obj)
    elif isinstance(obj, neo4j.graph.Relationship):
        result = GraphEditorRelation.from_neo_relation(obj)
    elif isinstance(obj, neo4j.graph.Path):
        result: list[GraphEditorElement] = [
            GraphEditorNode.from_neo_node(obj.start_node)
        ]

        # We need to consider that paths might not be directed. E.g. a path can
        # go to a node, and the next relation doesn't start with the current
        # node, but ends with a current node.

        current_node_id = obj.start_node.id

        for rel in obj:
            result.append(GraphEditorRelation.from_neo_relation(rel))

            if rel.start_node.id == current_node_id:
                current_node = rel.end_node
            else:
                current_node = rel.start_node

            result.append(GraphEditorNode.from_neo_node(current_node))
            current_node_id = current_node.id
    elif isinstance(obj, (neo4j.time.DateTime, neo4j.time.Time, neo4j.time.DateTime)):
        result = obj.to_native()
    elif isinstance(obj, list):
        result = list(map(neoobject2grapheditor, obj))
    elif isinstance(obj, dict):
        result = {k: neoobject2grapheditor(v) for (k, v) in obj.items()}
    else:
        result = obj

    return result


def prepare_node_patch(node_data: dict):
    """Remove semantic IDs from node patch."""
    if labels := node_data.get('labels', None):
        node_data['labels'] = [get_base_id(label) for label in labels]
    if props := node_data.get('properties', None):
        node_data['properties'] = {
            get_base_id(k): v['value']
            for k, v in props.items()
        }
    return node_data


def prepare_relation_patch(rel_data: dict):
    """Remove semantic IDs from relation patch.
    """
    if rel_type := rel_data.get('type', None):
        rel_data['type'] = get_base_id(rel_type)
    if props := rel_data.get('properties', None):
        rel_data['properties'] = {
            get_base_id(k): v['value']
            for k, v in props.items()
        }
    if source_id := rel_data.get('source_id', None):
        rel_data['source_id'] = get_base_id(source_id)
    if target_id := rel_data.get('target_id', None):
        rel_data['target_id'] = get_base_id(target_id)
    return rel_data


def is_metalevel(obj):
    """Return if obj is an object from the Metalevel.

    That's the case, if the label/type of the object is one of the meta labels
    (MetaLabel, MetaProperty etc).
    """
    return (
        isinstance(obj, neo4j.graph.Node)
        and any(is_metalabel(label) for label in obj.labels)
        or isinstance(obj, neo4j.graph.Relationship)
        and any(is_metalabel(label) for label in obj.type)
    )


def is_tech_property(pid):
    """Is property ID (pid) a reserved property ID from the tech namespace?"""
    return get_base_id(pid) in TECH_PROPERTIES


def is_tech_label(label):
    """Is label a reserved label from the tech namespace?"""
    return label in TECH_LABELS


def is_metalabel(label):
    """Is label a reserved label used in meta models?"""
    return label in METALABELS


def neoproperties2grapheditor(obj: BaseElement, semantic_id: str|None=None) -> dict:
    """Extract properties and attributes from a neo4j object.
    Return a dictionary containing properties and description-related
    attributes."""
    description = find_a_value(
        obj,
        keys=["_description",
              "description",
              "displayDescription",
              "description__tech_"],
        default="...description...",
    )
    default_long_description = "...longDescription..."
    long_desc = find_a_value(
        obj,
        keys=["_longDescription",
              "longDescription",
              "long_description",
              "long_description__tech_"],
        default=default_long_description,
    )

    properties = {}

    for key, value in obj.properties.items():
        prop_type = pythontype2json.get(type(value).__name__, "unknown")
        if key == "_ft__tech_":
            # we don't pass _ft__tech_ to the frontend
            continue
        prop_id: str = compute_semantic_id(
            key,
            metalabel=GraphEditorLabel.MetaProperty
        )
        py_val = value
        if type(value).__name__ in ['DateTime', 'Date', 'Time']:
            # convert to a python value so that jsonify can work with it.
            py_val = value.to_native()
        properties[prop_id] = {
            "edit": True,
            "type": prop_type,
            "value": py_val
        }

    new_properties = dict(
        sorted(
            item
            for item in properties.items()
            if item[0] not in special_properties
        )
    )
    for key in special_properties:
        if key in properties:
            new_properties[key] = properties[key]
    properties = new_properties

    if long_desc == default_long_description:
        long_desc = "<table>"
        obj_id = semantic_id if semantic_id else "id::" + obj.element_id

        if isinstance(obj, BaseNode):
            long_desc += f"<tr><th>Node</th><td>{obj_id}</td></tr>\n"
            long_desc += f"""<tr>
                               <th>Labels</th>
                               <td>{', '.join(sorted(obj.labels))}</td>
                             </tr>\n"""
            long_desc += "<tr><th colspan=2>&nbsp;</th></tr>\n"
        elif isinstance(obj, neo4j.graph.Relationship):
            long_desc += f"<tr><th>Relation</th><td>{obj_id}</td></tr>\n"
            long_desc += f"<tr><th>Type</th><td>{obj.type}</td></tr>\n"
            long_desc += "<tr><th colspan=2>&nbsp;</th></tr>\n"

        for key, value in sorted(obj.properties.items()):
            long_desc += f"<tr><th>{key}</th><td> {value}</td></tr>\n"

        long_desc += "</table>"

    grapheditor_dict = dict(
        description=description,
        longDescription=long_desc,
        properties=properties,
    )
    return grapheditor_dict


def compute_updated_properties(old_properties, new_properties):
    """Return a properties dict keeping mandatory tech properties."""
    properties = {
        k: v
        for k, v in old_properties.items()
        if is_tech_property(k)
    }
    properties.update(
        {
            k: v
            for k, v in new_properties.items()
            if k != "_uuid__tech_"
        }
    )
    return properties


def get_metatype_from_labels(labels):
    """Given a list of raw labels, return a metatype if one of them is present.
    Return None if no label corresponds to a metatype.
    """
    for label in labels:
        try:
            return GraphEditorLabel(label)
        except ValueError:
            pass
    return None


def get_semantic_id_from_neonode(node: BaseNode) -> str | None:
    "Return a semantic ID for node if possible, otherwise None."
    name = node.properties.get("name__tech_", None)
    if name is None:
        return None
    metatype = get_metatype_from_labels(node.labels)
    if not metatype:
        return None
    return compute_semantic_id(name, metatype)


def get_internal_id(idstr: str):
    """Get internal neo4j ID from idstr
        Examples:
    "5:05f05197-a54a-4591-9f8b-0e2220b4200c:42" --> 42
    """
    parts = idstr.split(":")
    return int(parts[-1])


def python_value_to_cypher(v):
    if isinstance(v, (int, float)):
        return f"{v}"
    if isinstance(v, str):
        return f"'{v}'"
    if isinstance(v, list):
        # str(list(map...)) doesn't work correctly.
        # It returns string with escaped quotes
        converted_vals = [python_value_to_cypher(x) for x in v]
        return f"[{', '.join(converted_vals)}]"
    if isinstance(v, dict):
        return _dict_to_cypher_part(v)

    raise ValueError(f"can't convert {v} to cypher")


def _dict_to_cypher_part(d):
    """Convert a dictionary to it's cypher representation.
    Example: {'a': 'x', 'b': 'y', 'c': 3} --> "{a: 'x', b: 'y', c: 3}"
    """
    s = "{"
    entries = []
    for k, v in d.items():
        entries.append(f"{k}: {python_value_to_cypher(v)}")
    s += ", ".join(entries)
    s += "}"
    return s


def get_grapheditor_nodes_by_ids(ids: list[str]) -> list[GraphEditorNode]:
    """Given a list of IDs, return a list of the corresponding grapheditor nodes.
    If an ID is missing, put a pseudo node into the list.
    The resulting list should keep the order of the IDs.
    """
    nodes = current_app.graph_db.get_nodes_by_ids(ids=ids)
    result = []
    for nid in ids:
        if node := nodes.get(nid, None):
            result.append(GraphEditorNode.from_base_node(node))
        else:
            result.append(GraphEditorNode.create_pseudo_node(nid))
    return result
