"""Utility module with function to map identifiers and data from Neo4j to
GraphEditor and vice-versa
"""

import neo4j

from blueprints.display.style_support import apply_style_rules
from database.utils import find_a_value
from database.settings import config
from database.id_handling import compute_semantic_id, get_base_id, GraphEditorLabel

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

# ------------------------------- Functions -----------------------------------


def neonode2grapheditor(neo_node, semantic_id=None):
    """Converts a neo4j node into the grapheditor node data structure"""
    grapheditor_dict = neoproperties2grapheditor(neo_node, semantic_id=semantic_id)
    title = get_node_title(neo_node)
    sem_id = get_semantic_id_from_neonode(neo_node)

    grapheditor_dict.update(
        dict(
            id=(
                semantic_id
                if semantic_id
                else f"id::{neo_node.element_id}"
            ),
            dbId=f"id::{neo_node.element_id}",
            semanticId=sem_id,
            labels=list(
                map(
                    lambda label: compute_semantic_id(
                        label, metalabel=GraphEditorLabel.MetaLabel
                    ),
                    neo_node.labels,
                )
            ),
            title=title,
            _grapheditor_type="node",
        )
    )

    apply_style_rules(grapheditor_dict)

    return grapheditor_dict


def get_node_title(node):
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


def neorelation2grapheditor(neo_relation, semantic_id=None):
    """Converts a neo4j relation into the grapheditor relation data structure"""
    title = get_relation_title(neo_relation)
    grapheditor_dict = neoproperties2grapheditor(neo_relation, semantic_id)
    source_id = f"id::{neo_relation.start_node.element_id}"
    target_id = f"id::{neo_relation.end_node.element_id}"
    grapheditor_dict.update(
        id=(
            semantic_id
            if semantic_id
            else f"id::{neo_relation.element_id}"
        ),
        dbId=f"id::{neo_relation.element_id}",
        title=title,
        source_id=source_id,
        target_id=target_id,
        type=compute_semantic_id(
            neo_relation.type, metalabel=GraphEditorLabel.MetaRelation
        ),
        _grapheditor_type="relation",
    )

    apply_style_rules(grapheditor_dict)
    return grapheditor_dict


def neoobject2grapheditor(obj):
    """Converts arbitrary neo4j data to a dictionary where 'type'
    is the grapheditor typo, and 'contents' the corresponding grapheditor
    data structure"""
    if isinstance(obj, neo4j.graph.Node):
        return neonode2grapheditor(obj)
    if isinstance(obj, neo4j.graph.Relationship):
        return neorelation2grapheditor(obj)
    if isinstance(obj, neo4j.graph.Path):
        result = [neonode2grapheditor(obj.start_node)]

        # We need to consider that paths might not be directed. E.g. a path can
        # go to a node, and the next relation doesn't start with the current
        # node, but ends with a current node.

        current_node_id = obj.start_node.id

        for rel in obj:
            result.append(neorelation2grapheditor(rel))

            if rel.start_node.id == current_node_id:
                current_node = rel.end_node
            else:
                current_node = rel.start_node

            result.append(neonode2grapheditor(current_node))
            current_node_id = current_node.id

        return result

    if isinstance(obj, list):
        return list(map(neoobject2grapheditor, obj))
    if isinstance(obj, dict):
        return {k: neoobject2grapheditor(v) for (k, v) in obj.items()}

    return obj


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


def neoproperties2grapheditor(obj, semantic_id=None):
    """Converts a neo4j object with properties into an grapheditor dict"""
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

    for key, value in obj.items():
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
        properties[prop_id] = dict(edit=True, type=prop_type, value=py_val)

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

        if isinstance(obj, neo4j.graph.Node):
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

        for key, value in sorted(obj.items()):
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
        get_base_id(k): v["value"]
        for k, v in old_properties.items()
        if is_tech_property(k)
    }
    properties.update(
        {
            get_base_id(key): value["value"]
            for key, value in new_properties.items()
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


def get_semantic_id_from_neonode(neo_node):
    try:
        name = neo_node["name__tech_"]
        if name is None:
            return None
        metatype = get_metatype_from_labels(neo_node.labels)
        if not metatype:
            return None
        return compute_semantic_id(name, metatype)
    except ValueError:  # name is missing
        return None


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
